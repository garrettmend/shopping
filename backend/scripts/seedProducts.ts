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
  console.log("Seeding 10 products with 10 stock each...");
  for (const [index, name] of productNames.entries()) {
    // generate a pseudo-random price between 10.00 and 299.99
    const price = Number((10 + Math.random() * 289.99).toFixed(2));
    const product = await prisma.product.create({
      data: {
        name,
        price,
        stock: 10,
        image: null,
      },
    });
    console.log(`Created product #${index + 1}: ${product.name} - $${product.price} (stock: ${product.stock})`);
  }
  console.log("Done seeding products.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
