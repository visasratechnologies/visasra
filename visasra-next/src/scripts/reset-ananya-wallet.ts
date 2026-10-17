import { prisma } from '../lib/prisma';

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { email: 'customer@visasra.com' },
        { name: { contains: 'Ananya', mode: 'insensitive' } },
      ],
    },
    data: {
      walletBalance: 0,
    },
  });

  console.log(`Updated ${result.count} user records to 0 wallet balance.`);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'customer@visasra.com' },
        { name: { contains: 'Ananya', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true, walletBalance: true },
  });

  console.log('Current DB state for Ananya Iyer:', users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
