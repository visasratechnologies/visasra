import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slotKey: string; itemId: string; optionId: string }> }
) {
  try {
    const { slotKey, itemId, optionId } = await params;
    const decodedKey = decodeURIComponent(slotKey);

    await prisma.productOption.update({
      where: { id: optionId },
      data: { status: 'rejected' },
    });

    // Check remaining options
    const remainingOptions = await prisma.productOption.findMany({
      where: { orderItemId: itemId },
    });

    const hasPendingOrApproved = remainingOptions.some(
      (o) => o.status === 'pending' || o.status === 'approved'
    );

    if (!hasPendingOrApproved) {
      await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: 'needs_options' },
      });
    }

    const session = await prisma.liveSession.findUnique({
      where: { slotKey: decodedKey },
      include: {
        worker: true,
        order: {
          include: {
            items: {
              include: { options: true },
            },
          },
        },
      },
    });

    const responseSession = session
      ? {
          slotKey: session.slotKey,
          status: session.status,
          stage: session.stage,
          shopper: session.worker
            ? {
                name: session.worker.name,
                rating: session.worker.rating,
                ordersDone: session.worker.ordersDone,
                phone: session.worker.phone,
                photo: session.worker.photo,
              }
            : null,
          store: {
            name: session.storeName,
            address: session.storeAddress,
            lat: session.storeLat,
            lng: session.storeLng,
          },
          location: session.worker
            ? {
                lat: session.workerLat,
                lng: session.workerLng,
                updatedAt: session.updatedAt.getTime(),
                etaMin: session.workerEtaMin,
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
        }
      : null;

    return NextResponse.json({ session: responseSession });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reject failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
