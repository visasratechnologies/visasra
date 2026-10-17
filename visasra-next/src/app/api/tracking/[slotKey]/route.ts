import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slotKey: string }> }
) {
  try {
    const { slotKey } = await params;
    const decodedKey = decodeURIComponent(slotKey);

    const order = await prisma.order.findFirst({
      where: { slotKey: decodedKey },
      include: {
        items: true,
        stageHistory: {
          orderBy: { updatedAt: 'asc' },
        },
        liveSession: {
          include: {
            worker: {
              select: {
                name: true,
                rating: true,
                ordersDone: true,
                phone: true,
                photo: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found for slot' }, { status: 404 });
    }

    const worker = order.liveSession?.worker;

    const defaultStages = [
      { key: 'slot_confirmed', title: 'Slot Confirmed & Scheduled', status: 'done', note: 'Customer slot locked with priority personal shopper reservation' },
      { key: 'worker_assigned', title: 'Personal Shopper Assigned', status: 'done', note: worker ? `${worker.name} (+91 98765 43210)` : 'Assigned from Ground Shoppers Hub' },
      { key: 'shopping', title: 'In-Store Verification & Sourcing', status: order.trackingStage === 'shopping' ? 'current' : (order.status === 'confirmed' ? 'current' : 'done'), note: order.liveSession?.storeName || 'Active at Retail & Artisan Store' },
      { key: 'purchased', title: 'Purchased & Billed at Merchant Counter', status: ['purchased', 'packed', 'shipped', 'delivered'].includes(order.status) ? 'done' : 'pending', expected: order.slotDate },
      { key: 'packed', title: 'Quality Check & Packed for International Transit', status: ['packed', 'shipped', 'delivered'].includes(order.status) ? 'done' : 'pending', note: 'At Visasra Central Export Hub, Chennai' },
      { key: 'shipped', title: 'Customs Cleared & International Air Cargo', status: ['shipped', 'delivered'].includes(order.status) ? 'done' : 'pending', expected: 'International Express Airway Bill' },
      { key: 'out_for_delivery', title: 'Delivered to Doorstep Overseas', status: order.status === 'delivered' ? 'done' : 'pending', note: 'Signature delivery via DHL / FedEx Global' },
    ];

    const stages = order.stageHistory.length
      ? order.stageHistory.map((s) => ({
          key: s.stageKey,
          title: s.title || defaultStages.find((d) => d.key === s.stageKey)?.title || s.stageKey,
          status: s.status,
          expected: s.expected || undefined,
          note: s.note || undefined,
          updatedAt: s.updatedAt,
        }))
      : defaultStages;

    return NextResponse.json({
      slotKey: order.slotKey,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      orderStatus: order.status,
      trackingStage: order.trackingStage,
      slotDate: order.slotDate,
      slotLabel: order.slotLabel,
      totalAmount: order.totalAmount,
      items: order.items,
      stages,
      shopper: worker
        ? {
            name: worker.name,
            rating: worker.rating,
            ordersDone: worker.ordersDone,
            phone: worker.phone,
            photo: worker.photo,
          }
        : null,
      store: {
        name: order.liveSession?.storeName || 'Local Retail & Artisan Store',
        address: order.liveSession?.storeAddress || 'Physical In-Store Sourcing Across India',
        lat: order.liveSession?.storeLat || 13.0418,
        lng: order.liveSession?.storeLng || 80.2341,
      },
      workerLocation: order.liveSession
        ? {
            lat: order.liveSession.workerLat || 13.06,
            lng: order.liveSession.workerLng || 80.25,
            stage: order.liveSession.stage,
            etaMin: order.liveSession.workerEtaMin || 12,
          }
        : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tracking';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
