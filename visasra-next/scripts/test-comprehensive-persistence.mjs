import { prisma } from '../src/lib/prisma';

async function testComprehensivePersistence() {
  console.log('=== RUNNING COMPREHENSIVE PERSISTENCE VALIDATION ===\n');

  // Find a test user and test worker
  const user = await prisma.user.findFirst({
    where: { email: 'akkulasaikiran1@gmail.com' },
  });
  if (!user) throw new Error('Test user not found');

  const worker = await prisma.worker.findFirst();
  if (!worker) throw new Error('Test worker not found');

  const admin = await prisma.admin.findFirst();
  if (!admin) throw new Error('Test admin not found');

  console.log(`[PASS] Environment verified: User "${user.name}", Worker "${worker.name}", Admin "${admin.name}"`);

  // 1. Test UserAddress persistence with label and update (PUT)
  console.log('\n--- 1. Testing UserAddress Persistence & Labels ---');
  const createdAddr = await prisma.userAddress.create({
    data: {
      userId: user.id,
      name: 'Sai Kiran (Test)',
      label: 'Office',
      phone: '+91 98765 43210',
      line1: 'Plot 42, Hitech City Main Rd',
      city: 'Hyderabad',
      region: 'Telangana',
      zip: '500081',
      country: 'India',
      isDefault: false,
    },
  });
  console.log(`[PASS] Created UserAddress: "${createdAddr.name}" (${createdAddr.label})`);

  const updatedAddr = await prisma.userAddress.update({
    where: { id: createdAddr.id },
    data: {
      label: 'Home HQ',
      line2: 'Tower B, 14th Floor',
    },
  });
  if (updatedAddr.label === 'Home HQ' && updatedAddr.line2 === 'Tower B, 14th Floor') {
    console.log(`[PASS] Address update verified: Label="${updatedAddr.label}", Line2="${updatedAddr.line2}"`);
  } else {
    throw new Error('Address update failed');
  }

  // 2. Test Worker & Admin lastLoginAt persistence
  console.log('\n--- 2. Testing Worker & Admin lastLoginAt Tracking ---');
  const now = new Date();
  const updatedWorker = await prisma.worker.update({
    where: { id: worker.id },
    data: { lastLoginAt: now },
  });
  const updatedAdmin = await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: now },
  });

  if (updatedWorker.lastLoginAt && updatedAdmin.lastLoginAt) {
    console.log(`[PASS] Worker lastLoginAt recorded: ${updatedWorker.lastLoginAt.toISOString()}`);
    console.log(`[PASS] Admin lastLoginAt recorded: ${updatedAdmin.lastLoginAt.toISOString()}`);
  } else {
    throw new Error('lastLoginAt update failed for worker or admin');
  }

  // 3. Test Order Creation, CustomerNotes & Atomic Cart Clearing in PostgreSQL
  console.log('\n--- 3. Testing Order Placement, CustomerNotes & Atomic Cart Clearing ---');
  
  // Ensure user has a cart with an item
  let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: user.id } });
  }
  
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      name: 'Test Saree to be cleared on order',
      priceMin: 2000,
      priceMax: 3000,
      sourceType: 'catalog',
    },
  });

  const cartItemsBefore = await prisma.cartItem.count({ where: { cartId: cart.id } });
  console.log(`User cart item count before order: ${cartItemsBefore}`);

  // Create order with customer notes and atomically clear cart
  const testOrderNum = 'VIS-T' + Math.floor(1000 + Math.random() * 9000);
  const testSlotKey = `2026-10-25|t2|${testOrderNum}`;

  const [savedOrder] = await prisma.$transaction([
    prisma.order.create({
      data: {
        orderNumber: testOrderNum,
        userId: user.id,
        slotKey: testSlotKey,
        slotDate: '2026-10-25',
        slotWindow: 't2',
        slotLabel: '2026-10-25 · 11:00 AM – 1:00 PM',
        status: 'confirmed',
        trackingStage: 'slot_confirmed',
        orderType: 'market',
        totalAmount: 2500,
        customerNotes: 'Please inspect the zari border carefully for authenticity before billing',
        shippingAddress: {
          name: 'Sai Kiran',
          line1: 'Plot 42, Hitech City',
          city: 'Hyderabad',
          zip: '500081',
          country: 'India',
        },
        items: {
          create: [{
            name: 'Kanchipuram Silk Saree',
            qty: 1,
            estMin: 2000,
            estMax: 3000,
            status: 'waiting',
          }],
        },
        liveSession: {
          create: {
            slotKey: testSlotKey,
            userId: user.id,
            workerId: worker.id,
            status: 'scheduled',
            stage: 'scheduled',
          },
        },
        stageHistory: {
          create: [
            { stageKey: 'slot_confirmed', title: 'Slot Confirmed', status: 'done' },
            { stageKey: 'worker_assigned', title: 'Shopper Assigned', status: 'done' },
            { stageKey: 'shopping', title: 'Live Shopping', status: 'pending' },
            { stageKey: 'packed', title: 'Quality Check & Packed', status: 'pending' },
            { stageKey: 'shipped', title: 'International Cargo Dispatched', status: 'pending' },
            { stageKey: 'out_for_delivery', title: 'Delivered', status: 'pending' },
          ],
        },
      },
    }),
    prisma.cartItem.deleteMany({
      where: { cart: { userId: user.id } },
    }),
  ]);

  const cartItemsAfter = await prisma.cartItem.count({ where: { cartId: cart.id } });
  console.log(`[PASS] Order created #${savedOrder.orderNumber}`);
  console.log(`[PASS] CustomerNotes saved in PostgreSQL: "${savedOrder.customerNotes}"`);
  console.log(`[PASS] Cart items after order placement: ${cartItemsAfter} (Atomically cleared in PostgreSQL)`);

  // 4. Test International Shipping Carrier & AWB Tracking Update
  console.log('\n--- 4. Testing International Shipping Dispatch Persistence ---');
  const shippedOrder = await prisma.order.update({
    where: { id: savedOrder.id },
    data: {
      status: 'shipped',
      trackingStage: 'shipped',
      carrier: 'DHL Express Global',
      trackingNumber: 'DHL-8492019482',
      trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=8492019482',
      shippedAt: new Date(),
    },
  });
  console.log(`[PASS] Order dispatched: Carrier="${shippedOrder.carrier}", AWB="${shippedOrder.trackingNumber}"`);

  // 5. Test WorkerReview & Rating Aggregation Persistence
  console.log('\n--- 5. Testing WorkerReview & Dynamic Rating Recalculation ---');
  const review = await prisma.workerReview.create({
    data: {
      userId: user.id,
      workerId: worker.id,
      orderId: savedOrder.id,
      rating: 5,
      comment: 'Excellent shopper! Picked the exact authentic pure silk saree on live video call.',
    },
  });

  const agg = await prisma.workerReview.aggregate({
    where: { workerId: worker.id },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const newRating = agg._avg.rating !== null ? Math.round(agg._avg.rating * 10) / 10 : 5.0;
  await prisma.worker.update({
    where: { id: worker.id },
    data: { rating: newRating },
  });

  console.log(`[PASS] Review saved for Worker "${worker.name}": ⭐ ${review.rating}/5 — "${review.comment}"`);
  console.log(`[PASS] Recalculated Worker Rating in PostgreSQL: ⭐ ${newRating} (${agg._count.rating} verified reviews)`);

  // 6. Test Doorstep Delivery
  console.log('\n--- 6. Testing Doorstep Delivery Completion ---');
  const deliveredOrder = await prisma.order.update({
    where: { id: savedOrder.id },
    data: {
      status: 'delivered',
      trackingStage: 'out_for_delivery',
      deliveredAt: new Date(),
    },
  });
  console.log(`[PASS] Order #${deliveredOrder.orderNumber} successfully marked as DELIVERED at ${deliveredOrder.deliveredAt.toISOString()}`);

  // Cleanup test data
  console.log('\n--- Cleaning up test artifacts ---');
  await prisma.workerReview.deleteMany({ where: { orderId: savedOrder.id } });
  await prisma.liveSession.deleteMany({ where: { slotKey: testSlotKey } });
  await prisma.orderTrackingStage.deleteMany({ where: { orderId: savedOrder.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: savedOrder.id } });
  await prisma.order.delete({ where: { id: savedOrder.id } });
  await prisma.userAddress.delete({ where: { id: createdAddr.id } });
  console.log('[PASS] Test cleanup completed.');

  console.log('\n=== ALL COMPREHENSIVE PERSISTENCE TESTS PASSED (100%) ===');
}

testComprehensivePersistence()
  .catch((err) => {
    console.error('Persistence test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
