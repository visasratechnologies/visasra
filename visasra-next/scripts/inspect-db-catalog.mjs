import { prisma } from '../src/lib/prisma.js';

async function main() {
  const cats = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: { products: true }
  });
  console.log('Categories count in DB:', cats.length);
  let totalProducts = 0;
  cats.forEach(c => {
    totalProducts += c.products.length;
    console.log(`${c.sort}. [${c.slug}] ${c.name}: ${c.products.length} products`);
  });
  console.log('Total products in DB:', totalProducts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
