import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');

  // 1. Find Customer User
  const customer = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'harenagula@gmail.com' },
        { phone: '7032414481' },
      ],
    },
  });

  if (!customer) {
    throw new Error('Customer user harenagula@gmail.com not found in database!');
  }
  console.log('Customer found:', customer.id, customer.name, customer.email);

  // 2. Find Worker
  const worker = await prisma.worker.findFirst({
    where: {
      OR: [
        { email: 'hareharannagula@gmail.com' },
        { phone: '7032414481' },
        { phone: '+91 70324 14481' },
        { phone: '+91 91703 24144' },
      ],
    },
  });

  if (!worker) {
    console.log('Warning: Target worker not found by exact query, checking all workers...');
    const allWorkers = await prisma.worker.findMany({ select: { id: true, name: true, phone: true, email: true, status: true, kycStatus: true } });
    console.log('All workers in DB:', allWorkers);
  } else {
    console.log('Worker found:', worker.id, worker.name, worker.phone, worker.email, worker.status, worker.kycStatus);
  }

  // 3. Clear existing test order/session for 3:30 PM if exists
  const slotKey = '2026-11-25|h2-3';
  const existingOrder = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: 'VIS-33025' },
        { slotKey },
      ],
    },
    include: { liveSession: true },
  });

  if (existingOrder) {
    console.log('Found existing order/session to clean up:', existingOrder.orderNumber);
    if (existingOrder.liveSession) {
      await prisma.liveSession.delete({ where: { id: existingOrder.liveSession.id } });
    }
    await prisma.orderTrackingStage.deleteMany({ where: { orderId: existingOrder.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: existingOrder.id } });
    await prisma.order.delete({ where: { id: existingOrder.id } });
    console.log('Cleaned up previous order successfully');
  }

  // Also check if any loose liveSession with slotKey exists
  await prisma.liveSession.deleteMany({ where: { slotKey } });

  // 4. Create the 3:30 PM Order Booking
  const orderNumber = 'VIS-33025';
  const slotDate = '2026-11-25';
  const slotWindow = '03:30 PM – 04:30 PM (IST)';
  const slotLabel = 'Today, 03:30 PM – 04:30 PM IST';

  const newOrder = await prisma.order.create({
    data: {
      orderNumber,
      userId: customer.id,
      slotKey,
      slotDate,
      slotWindow,
      slotLabel,
      status: 'confirmed',
      trackingStage: 'slot_confirmed',
      orderType: 'market',
      totalAmount: 2450.00,
      customerNotes: 'Need vibrant magenta or deep pink silk dupatta with authentic peacock motif. Please verify zari quality on camera.',
      shippingAddress: {
        name: customer.name || 'Hareharan Nagula',
        phone: customer.phone || '+91 70324 14481',
        line1: 'Flat 4B, Emerald Heights, Road No. 12, Banjara Hills',
        line2: 'Near Care Hospital',
        city: 'Hyderabad',
        region: 'Telangana',
        zip: '500034',
        country: 'India',
      },
      items: {
        create: [
          {
            name: 'Handloom Kanchipuram Pure Silk Dupatta',
            category: 'Traditional Clothing',
            qty: 1,
            estMin: 1450.00,
            estMax: 1800.00,
            image: '/images/products/traditional-clothing/saree.jpg',
            sourceType: 'market',
            status: 'waiting',
            notes: 'Pure zari peacock border, bright pink/magenta shade from Nalli Silks',
          },
          {
            name: 'Handcrafted Brass Hanging Pooja Bell',
            category: 'Pooja & Spiritual',
            qty: 1,
            estMin: 650.00,
            estMax: 850.00,
            image: '/images/products/pooja-spiritual/brass-diya.jpg',
            sourceType: 'market',
            status: 'waiting',
            notes: 'Authentic temple chime bell with chain from T. Nagar market',
          },
        ],
      },
      stageHistory: {
        create: [
          {
            stageKey: 'slot_confirmed',
            title: 'Slot Confirmed',
            status: 'done',
            note: '3:30 PM slot booked and reserved for your dedicated shopper',
          },
          {
            stageKey: 'worker_assigned',
            title: 'Personal Shopper Assigned',
            status: 'current',
            note: 'Assigning nearest verified shopper in T. Nagar bazaar',
          },
          {
            stageKey: 'shopping',
            title: 'Live Shopping at Market',
            status: 'pending',
            note: 'Shopper browsing items with live interactive video & chat',
          },
          {
            stageKey: 'purchased',
            title: 'Items Purchased & Verified',
            status: 'pending',
            note: 'Shop payment cleared and bill receipt verified',
          },
          {
            stageKey: 'packed',
            title: 'Quality Check & Secure Packing',
            status: 'pending',
            note: 'Verified and packed at Chennai central hub',
          },
          {
            stageKey: 'shipped',
            title: 'International Express Shipping',
            status: 'pending',
            note: 'Dispatched via premium express courier',
          },
          {
            stageKey: 'out_for_delivery',
            title: 'Delivered to Doorstep',
            status: 'pending',
            note: 'Safe delivery at customer address',
          },
        ],
      },
      liveSession: {
        create: {
          slotKey,
          userId: customer.id,
          workerId: null, // Open slot ready for worker to accept or admin to assign!
          status: 'scheduled',
          stage: 'scheduled',
          storeName: 'Nalli Silks & T. Nagar Market, Chennai',
          storeAddress: '9 Nageswaran Road, T. Nagar, Chennai 600017',
          storeLat: 13.0418,
          storeLng: 80.2341,
          workerLat: 13.0450,
          workerLng: 80.2300,
          workerEtaMin: 8,
        },
      },
    },
    include: {
      items: true,
      liveSession: true,
      stageHistory: true,
    },
  });

  console.log(' Successfully created 3:30 PM slot booking!');
  console.log('Order Number:', newOrder.orderNumber);
  console.log('Slot Key:', newOrder.slotKey);
  console.log('Slot Window:', newOrder.slotWindow);
  console.log('Customer:', customer.email, customer.name);
  console.log('Session ID:', newOrder.liveSession?.id);
  console.log('Worker ID:', newOrder.liveSession?.workerId ?? '(Unassigned - Open for Worker to Accept / Admin to Assign)');
}

main()
  .catch((err) => {
    console.error('Error creating demo booking:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
