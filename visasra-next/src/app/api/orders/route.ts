import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    let whereClause: Record<string, unknown> | null = null;
    if (userId) {
      whereClause = { userId };
    } else if (email) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (user) {
        whereClause = { userId: user.id };
      } else {
        return NextResponse.json({ success: true, orders: [] });
      }
    } else if (searchParams.get('all') === 'true') {
      whereClause = {};
    } else {
      // Must not leak other users' orders to unauthenticated or general requests
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            options: true,
          },
        },
        liveSession: {
          include: {
            worker: true,
          },
        },
        stageHistory: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, slotKey, slotDate, slotWindow, slotLabel, items, shippingAddress } = body;

    if (!userId || !slotKey || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 });
    }

    // Process items and classify whether they are online (Amazon, Flipkart, etc.) or physical market
    interface IncomingItem {
      name: string;
      category?: string;
      qty?: number;
      estMin?: number;
      estMax?: number;
      priceMin?: number;
      priceMax?: number;
      image?: string;
      notes?: string;
      sourceType?: string;
      sourceUrl?: string;
      onlinePlatform?: string;
    }

    const processedItems = (items as IncomingItem[]).map((it) => {
      const explicitUrl = it.sourceUrl?.trim() || '';
      const notesUrl = it.notes?.match(/https?:\/\/[^\s]+/)?.[0] || '';
      const finalUrl = explicitUrl || notesUrl;
      const fullText = `${it.name} ${it.notes || ''} ${finalUrl}`.toLowerCase();
      
      const isOnline =
        it.sourceType === 'online' ||
        Boolean(finalUrl) ||
        /amazon|flipkart|myntra|ajio|meesho|tatacliq|nykaa|croma|reliancedigital/i.test(fullText);

      let detectedPlatform = it.onlinePlatform || '';
      if (!detectedPlatform && isOnline) {
        if (/amazon/i.test(fullText)) detectedPlatform = 'Amazon';
        else if (/flipkart/i.test(fullText)) detectedPlatform = 'Flipkart';
        else if (/myntra/i.test(fullText)) detectedPlatform = 'Myntra';
        else if (/ajio/i.test(fullText)) detectedPlatform = 'Ajio';
        else if (/meesho/i.test(fullText)) detectedPlatform = 'Meesho';
        else if (/tatacliq/i.test(fullText)) detectedPlatform = 'Tata CLiQ';
        else if (/nykaa/i.test(fullText)) detectedPlatform = 'Nykaa';
        else detectedPlatform = 'Online Store';
      }

      return {
        name: it.name,
        category: it.category || (isOnline ? 'Online Concierge' : 'General'),
        qty: it.qty || 1,
        estMin: it.estMin || it.priceMin || 1000,
        estMax: it.estMax || it.priceMax || 3000,
        image: it.image || null,
        notes: it.notes || null,
        sourceType: isOnline ? 'online' : (it.sourceType || 'market'),
        sourceUrl: finalUrl || null,
        onlinePlatform: isOnline ? (detectedPlatform || 'Online Store') : null,
        onlineOrderStatus: isOnline ? 'pending_admin' : 'none',
        status: 'waiting',
      };
    });

    const hasOnline = processedItems.some((i) => i.sourceType === 'online');
    const hasMarket = processedItems.some((i) => i.sourceType !== 'online');
    const orderType: 'online' | 'market' | 'hybrid' = hasOnline && hasMarket ? 'hybrid' : (hasOnline ? 'online' : 'market');

    // Only assign a physical gig worker if there are physical market items to shop for!
    // Pure online orders are strictly managed by Visasra Admin ops.
    const worker = hasMarket
      ? await prisma.worker.findFirst({
          where: { status: 'active', kycStatus: 'verified' },
        })
      : null;

    // 1. Resolve target user ID reliably (handle both uuid and fallback demo ID)
    let targetUserId = userId;
    const existingUser = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
    if (!existingUser) {
      if (body.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: body.email.toLowerCase().trim() },
        });
        if (dbUser) targetUserId = dbUser.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Valid user account required to place order' }, { status: 400 });
    }

    // 2. Generate a guaranteed unique orderNumber
    let orderNumber = 'VIS-' + Math.floor(10000 + Math.random() * 90000);
    for (let i = 0; i < 5; i++) {
      const existingOrder = await prisma.order.findUnique({ where: { orderNumber } });
      if (!existingOrder) break;
      orderNumber = 'VIS-' + Math.floor(10000 + Math.random() * 90000);
    }

    // 3. Ensure slotKey is unique for LiveSession (@unique constraint on slotKey)
    let finalSlotKey = slotKey;
    const existingSession = await prisma.liveSession.findUnique({
      where: { slotKey: finalSlotKey },
    });
    if (existingSession) {
      finalSlotKey = `${slotKey}|${orderNumber}`;
    }

    const stages = orderType === 'online'
      ? [
          { stageKey: 'slot_confirmed', title: 'Online Order Confirmed', status: 'done', note: 'Order captured in system for admin procurement' },
          { stageKey: 'admin_procurement', title: 'Admin Online Procurement', status: 'current', note: 'Visasra Ops team purchasing directly from Amazon/Flipkart' },
          { stageKey: 'purchased', title: 'Ordered from Retailer', status: 'pending', note: 'Awaiting retailer shipment to Visasra Hub' },
          { stageKey: 'packed', title: 'Quality Check & Consolidation', status: 'pending', note: 'Package verified at hub and prepped for dispatch' },
          { stageKey: 'shipped', title: 'International Express Shipping', status: 'pending', note: 'Dispatched via DHL/FedEx to your destination' },
          { stageKey: 'out_for_delivery', title: 'Delivered to Doorstep', status: 'pending', note: 'Final doorstep delivery' },
        ]
      : [
          { stageKey: 'slot_confirmed', title: 'Slot Confirmed', status: 'done', note: 'Slot reserved for your shopping window' },
          { stageKey: 'worker_assigned', title: 'Personal Shopper Assigned', status: worker ? 'done' : 'current', note: worker ? `${worker.name} assigned to your order` : 'Assigning nearest verified shopper' },
          { stageKey: 'shopping', title: 'Live Shopping at Market', status: 'pending' },
          { stageKey: 'purchased', title: 'Items Purchased & Verified', status: 'pending' },
          { stageKey: 'packed', title: 'Quality Check & Secure Packing', status: 'pending' },
          { stageKey: 'shipped', title: 'International Express Shipping', status: 'pending' },
          { stageKey: 'out_for_delivery', title: 'Delivered to Doorstep', status: 'pending' },
        ];

    const incomingSlotFee = Number(body.slotFee);
    const slotFee = !isNaN(incomingSlotFee) && incomingSlotFee >= 0 ? incomingSlotFee : 400;
    const merchandiseBudget = processedItems.reduce((acc, it) => acc + (it.estMax || it.estMin || 1000) * (it.qty || 1), 0);

    // Atomically debit slot fee from Visasra Money, log transaction, and create order
    const [updatedUser, walletTx, order] = await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          walletBalance: { decrement: slotFee },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: targetUserId,
          type: 'debit',
          amount: slotFee,
          note: `Slot Booking Fee for Dedicated Shopper (${slotLabel || 'Sourcing Slot'})`,
        },
      }),
      prisma.order.create({
        data: {
          orderNumber,
          userId: targetUserId,
          slotKey: finalSlotKey,
          slotDate: slotDate || new Date().toISOString().split('T')[0],
          slotWindow: slotWindow || 't3',
          slotLabel: slotLabel || (orderType === 'online' ? 'Online Concierge Order' : '2:00 PM – 4:00 PM'),
          status: 'confirmed',
          trackingStage: orderType === 'online' ? 'admin_procurement' : 'slot_confirmed',
          orderType,
          totalAmount: merchandiseBudget,
          shippingAddress: shippingAddress || {},
          items: {
            create: processedItems,
          },
          stageHistory: {
            create: stages,
          },
          // Only create a LiveSession if there are physical market items for gig workers!
          // For pure online orders, no liveSession is created so gig workers never see it.
          ...(hasMarket
            ? {
                liveSession: {
                  create: {
                    slotKey: finalSlotKey,
                    userId: targetUserId,
                    workerId: worker ? worker.id : null,
                    status: 'scheduled',
                    stage: 'scheduled',
                    storeName: null,
                    storeAddress: null,
                    storeLat: null,
                    storeLng: null,
                    workerLat: null,
                    workerLng: null,
                  },
                },
              }
            : {}),
        },
        include: {
          items: true,
          liveSession: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, order, newWalletBalance: updatedUser.walletBalance });
  } catch (err: unknown) {
    console.error('Order creation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to place order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
