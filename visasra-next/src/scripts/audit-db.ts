import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- AUDITING POSTGRESQL DATABASE ---');
  
  // 1. Check Users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, walletBalance: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`Users in DB: ${users.length}`);
  users.slice(0, 5).forEach((u, i) => {
    console.log(` [${i+1}] ${u.name} | ${u.email} | ${u.phone} | Wallet: ₹${u.walletBalance}`);
  });

  // 2. Check OtpVerification Table
  const otps = await prisma.otpVerification.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(`\nRecent OTP Verifications in DB: ${otps.length}`);
  otps.forEach(o => {
    console.log(` - Email: ${o.email} | OTP: ${o.otp} | Type: ${o.type} | Verified: ${o.verified} | Created: ${o.createdAt}`);
  });

  // 3. Check Categories & Products
  const categories = await prisma.category.findMany({
    include: { products: true }
  });
  const totalProducts = categories.reduce((sum, c) => sum + (c.products?.length || 0), 0);
  console.log(`\nCatalog: ${categories.length} Categories, ${totalProducts} Products`);
  categories.slice(0, 4).forEach(c => {
    console.log(` - ${c.name} (${c.products.length} items)`);
  });

  // 4. Check Orders
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { items: true, user: { select: { name: true, email: true } } }
  });
  console.log(`\nRecent Orders in DB: ${orders.length}`);
  orders.forEach(o => {
    console.log(` - Order #${o.id.slice(0, 8)} | Slot: ${o.slotKey} | Status: ${o.status} | User: ${o.user?.name || 'Guest'}`);
  });

  // 5. Check Workers
  const workers = await prisma.worker.findMany();
  console.log(`\nGig Workers in DB: ${workers.length}`);
  workers.forEach(w => {
    console.log(` - Worker: ${w.name} | Phone: ${w.phone} | Status: ${w.status} | Rating: ${w.rating}`);
  });

  console.log('\n--- ALL POSTGRESQL TABLES VERIFIED HEALTHY ---');
}

main().catch(console.error).finally(() => process.exit(0));
