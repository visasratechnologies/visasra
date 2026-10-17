import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slotKey: string; itemId: string; optionId: string }> }
) {
  try {
    const { slotKey, itemId, optionId } = await params;
    const decodedKey = decodeURIComponent(slotKey);

    const liveSession = await prisma.liveSession.findUnique({
      where: { slotKey: decodedKey },
      include: {
        user: true,
        order: {
          include: {
            items: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!liveSession || !liveSession.order) {
      return NextResponse.json({ error: 'Live session not found' }, { status: 404 });
    }

    const item = liveSession.order.items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const option = item.options.find((o) => o.id === optionId);
    if (!option) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    // Idempotency: if already approved, return success without recharging
    if (option.status === 'approved') {
      return NextResponse.json({
        session: await getFullSession(decodedKey),
        wallet: {
          balance: liveSession.user.walletBalance,
        },
      });
    }

    const totalAmount = option.price * item.qty;

    if (liveSession.user.walletBalance < totalAmount) {
      return NextResponse.json(
        { error: 'Insufficient funds in wallet', code: 'INSUFFICIENT_FUNDS' },
        { status: 402 }
      );
    }

    // Atomic transaction in PostgreSQL
    const [updatedUser, tx] = await prisma.$transaction([
      prisma.user.update({
        where: { id: liveSession.userId },
        data: {
          walletBalance: { decrement: totalAmount },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: liveSession.userId,
          type: 'debit',
          amount: totalAmount,
          note: `Approved: ${item.name}`,
        },
      }),
      prisma.orderItem.update({
        where: { id: itemId },
        data: {
          status: 'approved',
          approvedAmount: totalAmount,
        },
      }),
      prisma.productOption.update({
        where: { id: optionId },
        data: { status: 'approved' },
      }),
      prisma.productOption.updateMany({
        where: {
          orderItemId: itemId,
          id: { not: optionId },
          status: { not: 'rejected' },
        },
        data: { status: 'not_chosen' },
      }),
    ]);

    const updatedSession = await getFullSession(decodedKey);

    return NextResponse.json({
      session: updatedSession,
      wallet: {
        balance: updatedUser.walletBalance,
        transaction: {
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          note: tx.note,
          date: tx.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Approval failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getFullSession(slotKey: string) {
  const session = await prisma.liveSession.findUnique({
    where: { slotKey },
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
  if (!session) return null;

  return {
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
  };
}
