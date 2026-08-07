import prisma from '../prisma.js';
import redisClient from '../redis.js';

export const getProducts = async (req: any, res: any) => {
  // 1. Check Redis cache first
  const cachedProducts = await redisClient.get('products:all');
  if (cachedProducts) {
    return res.json(JSON.parse(cachedProducts));
  }

  // 2. If not in cache, fetch from PostgreSQL database (via Prisma)
  const products = await prisma.product.findMany();

  // 3. Save to Redis cache with an expiration time (e.g., 60 seconds)
  await redisClient.setEx('products:all', 60, JSON.stringify(products));

  res.json(products);
};

export const getProductById = async (req: any, res: any) => {
  const productId = req.params.id;

  // 1. Check Redis cache first
  const cachedProduct = await redisClient.get(`product:${productId}`);
  if (cachedProduct) {
    return res.json(JSON.parse(cachedProduct));
  }

  // 2. If not in cache, fetch from PostgreSQL database (via Prisma)
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // 3. Save to Redis cache with an expiration time (e.g., 60 seconds)
  await redisClient.setEx(`product:${productId}`, 60, JSON.stringify(product));

  res.json(product);
};
