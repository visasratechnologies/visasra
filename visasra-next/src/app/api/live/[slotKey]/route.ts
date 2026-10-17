import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slotKey: string }> }
) {
  try {
    const { slotKey } = await params;
    const decodedKey = decodeURIComponent(slotKey);

    const session = await prisma.liveSession.findUnique({
      where: { slotKey: decodedKey },
      include: {
        worker: true,
        order: {
          include: {
            items: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Live session not found' }, { status: 404 });
    }

    const responseData = {
      slotKey: session.slotKey,
      status: session.status,
      stage: session.stage,
      shopper: session.worker
        ? {
            id: session.worker.id,
            name: session.worker.name,
            rating: session.worker.rating,
            ordersDone: session.worker.ordersDone,
            phone: session.worker.phone,
            photo: session.worker.photo,
          }
        : null,
      store: {
        name: session.storeName || 'Local Retail & Artisan Store',
        address: session.storeAddress || 'Physical In-Store Sourcing Across India',
        lat: session.storeLat || 13.0418,
        lng: session.storeLng || 80.2341,
      },
      location: session.worker
        ? {
            lat: session.workerLat || 13.06,
            lng: session.workerLng || 80.25,
            updatedAt: session.updatedAt.getTime(),
            etaMin: session.workerEtaMin || 14,
          }
        : null,
      products: session.order
        ? session.order.items.map((it) => ({
            itemId: it.id,
            name: it.name,
            qty: it.qty,
            estMin: it.estMin,
            estMax: it.estMax,
            status: it.status,
            approvedAmount: it.approvedAmount,
            options: it.options.map((opt) => ({
              id: opt.id,
              image: opt.image,
              price: opt.price,
              description: opt.description,
              status: opt.status,
            })),
          }))
        : [],
    };

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch live session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
