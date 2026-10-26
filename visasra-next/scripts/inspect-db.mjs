import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, createdAt: true } });
  const orders = await prisma.order.findMany({ 
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, orderNumber: true, totalAmount: true, status: true, userId: true, createdAt: true }
  });
  const orderItemsCount = await prisma.orderItem.count();
  const categories = await prisma.category.findMany({ select: { id: true, slug: true, name: true, image: true } });
  const productsCount = await prisma.productCatalog.count();
  const sampleProducts = await prisma.productCatalog.findMany({ 
    take: 5,
    select: { id: true, name: true, image: true, categoryId: true, types: true }
  });
  const workers = await prisma.worker.findMany({ select: { id: true, name: true, phone: true, email: true } });
  const admins = await prisma.admin.findMany({ select: { id: true, name: true, email: true } });
  const otps = await prisma.otpVerification.count();
  const addresses = await prisma.userAddress.count();
  const cartsCount = await prisma.cart.count();
  const cartItemsCount = await prisma.cartItem.count();
  const userSessionsCount = await prisma.userSession.count();

  const userTest = await prisma.user.findFirst({
    select: { id: true, email: true, lastLoginAt: true, cart: true, sessions: true }
  });

  console.log('=== DATABASE SUMMARY ===');
  console.log('Users count:', users.length);
  console.log('Sample User with relations:', userTest);
  console.log('Carts count in DB:', cartsCount);
  console.log('Cart Items count in DB:', cartItemsCount);
  console.log('User Sessions count in DB:', userSessionsCount);
  console.log('Orders count:', orders.length);
  console.log('Order Items count:', orderItemsCount);
  console.log('Categories count:', categories.length);
  console.log('Products count:', productsCount);
  console.log('Workers count:', workers.length);
  console.log('Admins count:', admins.length);
  console.log('OTP Records count:', otps);
  console.log('User Addresses count:', addresses);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
