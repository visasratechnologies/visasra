import { prisma } from '../src/lib/prisma';

async function main() {
  const prods = await prisma.productCatalog.findMany({
    select: { name: true, image: true, category: { select: { slug: true } }, types: true }
  });
  console.log(`Total products in DB: ${prods.length}`);
  prods.forEach((p, idx) => {
    if (idx < 20 || p.types) {
      console.log(`[${p.category.slug}] ${p.name} -> ${p.image} (${Array.isArray(p.types) ? p.types.length + ' types' : 'no types'})`);
    }
  });
}

main().finally(() => prisma.$disconnect());
