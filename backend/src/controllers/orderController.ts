import prisma from '../prisma.js';
import redisClient from '../redis.js';
import { publishOrderCreated } from '../kafka/producer.js';

export const createOrder = async (req: any, res: any) => {
  try {
    const { items, userEmail } = req.body; // Expects array of { productId, quantity } + optional userEmail
    const userId = req.user.userId;
    const customerEmail = userEmail || req.user.email;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    let totalPrice = 0;
    const orderItemsData: { productId: string; quantity: number; price: any }[] = [];

    // Validate products and compute price securely server-side
    for (const item of items) {
      // 1. Check Redis cache first
      const cachedProduct = await redisClient.get(`product:${item.productId}`);
      let product: any = cachedProduct ? JSON.parse(cachedProduct) : null;

      // 2. If not in cache, fetch from PostgreSQL database (via Prisma)
      if (!product) {
        product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          // 3. Save to Redis cache with an expiration time (e.g., 60 seconds)
          await redisClient.setEx(`product:${item.productId}`, 60, JSON.stringify(product));
        }
      }

      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = Number(product.price) * item.quantity;
      totalPrice += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create the Order in a Transaction with status PENDING
    const newOrder = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          userId,
          totalPrice,
          status: 'PENDING',
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });
    });

    // Publish order-created to Kafka (includes userEmail for email receipts)
    await publishOrderCreated(newOrder.id, items, customerEmail);

    // Invalidate cached products since stock changed after the order
    for (const item of items) {
      await redisClient.del(`product:${item.productId}`);
    }
    await redisClient.del('products:all');

    res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.id, status: newOrder.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process order' });
  }
};

