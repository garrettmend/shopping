import prisma from '../prisma.js';
import redisClient from '../redis.js';

export const getProducts = async (req: any, res: any) => {
  // 1. Check Redis cache first
  const cachedProducts = await redisClient.get('products:all');
  if (cachedProducts) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(JSON.parse(cachedProducts));
  }

  // 2. If not in cache, fetch from PostgreSQL database (via Prisma)
  const products = await prisma.product.findMany();

  // 3. Save to Redis cache with an expiration time (e.g., 60 seconds)
  await redisClient.setEx('products:all', 60, JSON.stringify(products));

  res.setHeader('X-Cache', 'MISS');
  res.json(products);
};

export const clearProductCache = async (_req: any, res: any) => {
  await redisClient.del('products:all');
  return res.json({ cleared: true });
};

const DEFAULT_TEST_STOCK = 2000;

export const restoreStock = async (_req: any, res: any) => {
  const result = await prisma.product.updateMany({
    data: { stock: DEFAULT_TEST_STOCK },
  });
  await redisClient.del('products:all');
  return res.json({ restored: result.count, stock: DEFAULT_TEST_STOCK });
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
