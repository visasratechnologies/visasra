import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastLiveEvent } from '@/lib/eventBus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slotKey: string; itemId: string; optionId: string }> }
) {
  let decodedKey = '';
  let targetUserId = '';

  try {
    const { slotKey, itemId, optionId } = await params;
    decodedKey = decodeURIComponent(slotKey);

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

    targetUserId = liveSession.userId;

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
          balance: Number(liveSession.user.walletBalance),
        },
      });
    }

    const totalAmount = Number(option.price) * item.qty;

    // Fast pre-check before database lock
    if (Number(liveSession.user.walletBalance) < totalAmount) {
      return NextResponse.json(
        { error: 'Insufficient funds in wallet', code: 'INSUFFICIENT_FUNDS' },
        { status: 402 }
      );
    }

    // Atomic transaction with row lock and strict conditional debit guard
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-verify option status inside transaction to prevent double approval race
      const freshOption = await tx.productOption.findUnique({
        where: { id: optionId },
      });
      if (!freshOption) {
        throw new Error('OPTION_NOT_FOUND');
      }
      if (freshOption.status === 'approved') {
        throw new Error('ALREADY_APPROVED');
      }

      // 2. Atomic conditional decrement: only succeeds if balance >= totalAmount
      const debitResult = await tx.user.updateMany({
        where: {
          id: liveSession.userId,
          walletBalance: { gte: totalAmount },
        },
        data: {
          walletBalance: { decrement: totalAmount },
        },
      });

      if (debitResult.count === 0) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // 3. Fetch verified updated balance
      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: liveSession.userId },
        select: { walletBalance: true },
      });

      // 4. Create debit transaction record
      const walletTx = await tx.walletTransaction.create({
        data: {
          userId: liveSession.userId,
          type: 'debit',
          amount: totalAmount,
          note: `Approved: ${item.name}`,
        },
      });

      // 5. Update order item status and approved amount
      await tx.orderItem.update({
        where: { id: itemId },
        data: {
          status: 'approved',
          approvedAmount: totalAmount,
        },
      });

      // 6. Mark chosen option as approved
      await tx.productOption.update({
        where: { id: optionId },
        data: { status: 'approved' },
      });

      // 7. Mark remaining options as not chosen
      await tx.productOption.updateMany({
        where: {
          orderItemId: itemId,
          id: { not: optionId },
          status: { not: 'rejected' },
        },
        data: { status: 'not_chosen' },
      });

      return { updatedUser, walletTx };
    });

    const updatedSession = await getFullSession(decodedKey);

    // Broadcast option decision via SSE bus to field worker immediately
    broadcastLiveEvent(decodedKey, 'option_decision', {
      itemId,
      optionId,
      decision: 'approved',
      totalAmount,
    });

    return NextResponse.json({
      session: updatedSession,
      wallet: {
        balance: Number(result.updatedUser.walletBalance),
        transaction: {
          id: result.walletTx.id,
          type: result.walletTx.type,
          amount: Number(result.walletTx.amount),
          note: result.walletTx.note,
          date: result.walletTx.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        { error: 'Insufficient funds in wallet', code: 'INSUFFICIENT_FUNDS' },
        { status: 402 }
      );
    }
    if (err instanceof Error && err.message === 'ALREADY_APPROVED') {
      const session = await getFullSession(decodedKey);
      const user = targetUserId
        ? await prisma.user.findUnique({ where: { id: targetUserId } }).catch(() => null)
        : null;
      return NextResponse.json({
        session,
        wallet: { balance: user ? Number(user.walletBalance) : 0 },
      });
    }
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
}
