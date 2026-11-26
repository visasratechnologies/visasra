import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function calculateEta(workerLat?: number | null, workerLng?: number | null, storeLat?: number | null, storeLng?: number | null): number {
  if (!workerLat || !workerLng || !storeLat || !storeLng) return 12;
  const R = 6371; // km
  const dLat = ((storeLat - workerLat) * Math.PI) / 180;
  const dLng = ((storeLng - workerLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((workerLat * Math.PI) / 180) * Math.cos((storeLat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return Math.max(4, Math.round((distanceKm / 18) * 60) + 3);
}

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
        worker: {
          select: {
            id: true,
            name: true,
            rating: true,
            ordersDone: true,
            phone: true,
            photo: true,
          },
        },
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
        name: session.storeName || 'Local Store & Market',
        address: session.storeAddress || 'Physical In-Store Sourcing Across India',
        lat: session.storeLat || 13.0418,
        lng: session.storeLng || 80.2341,
      },
      location: session.worker
        ? {
            lat: session.workerLat || 13.06,
            lng: session.workerLng || 80.25,
            updatedAt: session.updatedAt.getTime(),
            etaMin: session.workerEtaMin || calculateEta(session.workerLat, session.workerLng, session.storeLat, session.storeLng),
          }
        : null,
      products: session.order
        ? session.order.items.map((it) => ({
            itemId: it.id,
            name: it.name,
            qty: it.qty,
            estMin: Number(it.estMin),
            estMax: Number(it.estMax),
            status: it.status,
            approvedAmount: it.approvedAmount ? Number(it.approvedAmount) : undefined,
            options: it.options.map((opt) => ({
              id: opt.id,
              image: opt.image,
              price: Number(opt.price),
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
