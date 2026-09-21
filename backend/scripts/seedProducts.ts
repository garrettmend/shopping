import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const productNames = [
  "Wireless Mouse",
  "Mechanical Keyboard",
  "USB-C Hub",
  "Laptop Stand",
  "Noise-Cancelling Headphones",
  "Webcam 1080p",
  "Portable SSD 1TB",
  "Ergonomic Chair",
  "Desk Lamp",
  "Bluetooth Speaker",
];

async function main() {
  console.log("Seeding 10 products with 2000 stock each...");
  for (const [index, name] of productNames.entries()) {
    // generate a pseudo-random price between 10.00 and 299.99
      const product = await prisma.product.upsert({
        where: { id: `seed-${index + 1}` },
        update: {
          name,
          price: 0,
          stock: 2000,
          image: null,
        },
        create: {
          id: `seed-${index + 1}`,
          name,
          price: 0,
          stock: 2000,
          image: null,
        },
    });
      console.log(`Seeded product #${index + 1}: ${product.name} - $${product.price} (stock: ${product.stock})`);
  }
    await prisma.product.updateMany({
      data: { price: 0 },
    });
    console.log("Done seeding products. All product prices are $0.00.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
