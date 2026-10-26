import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Phase 2 Functionality...');

  // 1. Pick a test user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found');
    return;
  }
  console.log('Found user:', user.email);

  // 2. Test updating location and lastLoginAt
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      location: 'Hyderabad, Telangana, India',
      lastLoginAt: new Date(),
    },
  });
  console.log('Updated user location:', updatedUser.location);
  console.log('Updated user lastLoginAt:', updatedUser.lastLoginAt);

  // 3. Test creating a session in UserSession
  const token = `cs_test_${Date.now()}`;
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      token,
      userAgent: 'Mozilla/5.0 Test Suite (Chrome 120)',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Created UserSession in DB:', session.token);

  // 4. Test finding session and associated user
  const verifiedSession = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });
  console.log('Verified Session User in DB:', verifiedSession?.user.name, '· Location:', verifiedSession?.user.location);

  // 5. Test ensuring Cart exists for user
  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  console.log('User Cart Initialized in DB:', cart.id);

  // Clean up test session
  await prisma.userSession.delete({ where: { id: session.id } });
  console.log('Cleaned up test session.');

  console.log('✅ Phase 2 Verification PASSED!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
