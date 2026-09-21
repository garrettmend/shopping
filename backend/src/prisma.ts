import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Default pg pool (10) is too small for concurrent order load tests; raise it via env if needed
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_SIZE) || 20,
});
const prisma = new PrismaClient({ adapter });

export default prisma;
