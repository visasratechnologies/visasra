import { prisma } from '../src/lib/prisma';

async function main() {
  const tawas = await prisma.productCatalog.findFirst({
    where: { name: 'Tawas' },
    include: { category: true }
  });
  console.log('Tawas product in DB:');
  console.log(JSON.stringify(tawas, null, 2));
}

main().finally(() => prisma.$disconnect());
