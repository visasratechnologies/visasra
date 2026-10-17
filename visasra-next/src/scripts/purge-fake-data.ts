import { prisma } from '../lib/prisma';

async function purge() {
  console.log('--- PURGING ALL FAKE & TEST DATA FROM POSTGRESQL ---');

  // 1. Delete all test product options
  const deletedOptions = await prisma.productOption.deleteMany();
  console.log(`Deleted Product Options: ${deletedOptions.count}`);

  // 2. Delete all test order items
  const deletedItems = await prisma.orderItem.deleteMany();
  console.log(`Deleted Order Items: ${deletedItems.count}`);

  // 3. Delete all test tracking stages
  const deletedStages = await prisma.orderTrackingStage.deleteMany();
  console.log(`Deleted Order Tracking Stages: ${deletedStages.count}`);

  // 4. Delete all test live sessions
  const deletedSessions = await prisma.liveSession.deleteMany();
  console.log(`Deleted Live Sessions: ${deletedSessions.count}`);

  // 5. Delete all test orders
  const deletedOrders = await prisma.order.deleteMany();
  console.log(`Deleted Orders: ${deletedOrders.count}`);

  // 6. Delete all test wallet transactions
  const deletedTx = await prisma.walletTransaction.deleteMany();
  console.log(`Deleted Wallet Transactions: ${deletedTx.count}`);

  // 7. Delete all test OTP verifications
  const deletedOtps = await prisma.otpVerification.deleteMany();
  console.log(`Deleted OTP records: ${deletedOtps.count}`);

  // 8. Reset Customer Wallet Balance to 0 (real starting state)
  const updatedUsers = await prisma.user.updateMany({
    data: {
      walletBalance: 0,
    },
  });
  console.log(`Reset wallet balance to 0 for ${updatedUsers.count} user(s)`);

  // 9. Reset Worker stats to clean starting state
  const updatedWorkers = await prisma.worker.updateMany({
    data: {
      walletBalance: 0,
      ordersDone: 0,
      rating: 5.0,
      status: 'offline',
      currentLat: null,
      currentLng: null,
    },
  });
  console.log(`Reset ${updatedWorkers.count} worker(s) to 0 earnings & 0 orders`);

  console.log('--- CLEANUP COMPLETE: DATABASE IS 100% CLEAN OF FAKE DATA ---');
}

purge()
  .catch(console.error)
  .finally(() => process.exit(0));
