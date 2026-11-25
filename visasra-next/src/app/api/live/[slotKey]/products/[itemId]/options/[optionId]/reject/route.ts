import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastLiveEvent } from '@/lib/eventBus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slotKey: string; itemId: string; optionId: string }> }
) {
  try {
    const { slotKey, itemId, optionId } = await params;
    const decodedKey = decodeURIComponent(slotKey);

    // 1. Fetch target option with related order item and order
    const targetOption = await prisma.productOption.findUnique({
      where: { id: optionId },
      include: {
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!targetOption) {
      return NextResponse.json({ error: 'Product option not found' }, { status: 404 });
    }

    const { orderItem } = targetOption;

    // 2. Prevent undoing decisions if already bought at store counter
    if (orderItem.shopPaymentStatus === 'paid' || orderItem.status === 'purchased') {
      return NextResponse.json(
        { error: 'Cannot undo decision: Item has already been billed and purchased at the merchant counter' },
        { status: 400 }
      );
    }

    const wasApproved = targetOption.status === 'approved';
    const refundAmount = wasApproved
      ? Number(orderItem.approvedAmount ? orderItem.approvedAmount : (Number(targetOption.price) * orderItem.qty))
      : 0;
    const userId = orderItem.order.userId;

    let updatedWalletBalance: number | null = null;

    // 3. Atomic transaction: Refund wallet if previously approved, update statuses
    if (wasApproved && refundAmount > 0) {
      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            walletBalance: { increment: refundAmount },
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId,
            type: 'credit',
            amount: refundAmount,
            note: `Refund: Decision undone for ${orderItem.name} (Option rejected)`,
          },
        }),
        prisma.productOption.update({
          where: { id: optionId },
          data: { status: 'rejected' },
        }),
        prisma.orderItem.update({
          where: { id: itemId },
          data: {
            status: 'needs_options',
            approvedAmount: null,
          },
        }),
      ]);
      updatedWalletBalance = Number(updatedUser.walletBalance);
    } else {
      // Just mark as rejected
      await prisma.productOption.update({
        where: { id: optionId },
        data: { status: 'rejected' },
      });

      // Check if any other options are still active
      const remainingOptions = await prisma.productOption.findMany({
        where: { orderItemId: itemId, id: { not: optionId } },
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
    }

    // 4. Fetch updated live session details
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
        }
      : null;

    // Broadcast option decision via SSE bus to field worker immediately
    broadcastLiveEvent(decodedKey, 'option_decision', {
      itemId,
      optionId,
      decision: 'rejected',
      refundedAmount: wasApproved ? refundAmount : 0,
    });

    return NextResponse.json({
      success: true,
      session: responseSession,
      wallet: updatedWalletBalance !== null ? { balance: updatedWalletBalance } : undefined,
      refundedAmount: wasApproved ? refundAmount : 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reject failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
