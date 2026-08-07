import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Prisma client initialized. Testing connection...");
  try {
    const raw = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("Raw query result:", raw);
  } catch (err) {
    console.warn("Raw query failed (maybe driver-specific):", err);
  }

  try {
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);
  } catch (err) {
    console.warn("Could not query User model (maybe DB not reachable):", err);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
