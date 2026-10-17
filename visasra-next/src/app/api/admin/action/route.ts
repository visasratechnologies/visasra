import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, slotKey, orderId, workerId, itemId, reason, proofUrl, amount, utr, phone } = body;

    // 1. Assign Worker to Session
    if (action === 'assign' && slotKey && workerId) {
      const decodedKey = decodeURIComponent(slotKey);
      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: {
          workerId,
          stage: 'assigned',
          status: 'live',
        },
      });

      const session = await prisma.liveSession.findUnique({
        where: { slotKey: decodedKey },
      });

      if (session?.orderId) {
        await prisma.order.update({
          where: { id: session.orderId },
          data: { trackingStage: 'worker_assigned' },
        });
      }

      return NextResponse.json({ success: true, message: 'Shopper assigned successfully' });
    }

    // 2. Unassign Worker
    if (action === 'unassign' && slotKey) {
      const decodedKey = decodeURIComponent(slotKey);
      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: {
          workerId: null,
          stage: 'scheduled',
          status: 'scheduled',
        },
      });

      const session = await prisma.liveSession.findUnique({
        where: { slotKey: decodedKey },
      });

      if (session?.orderId) {
        await prisma.order.update({
          where: { id: session.orderId },
          data: { trackingStage: 'slot_confirmed' },
        });
      }

      return NextResponse.json({ success: true, message: 'Shopper unassigned' });
    }

    // 3. Refund Order
    if (action === 'refund' && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const refundAmount = Number(amount) || order.totalAmount;

      // Update Order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      });

      // Credit User Wallet
      await prisma.user.update({
        where: { id: order.userId },
        data: { walletBalance: { increment: refundAmount } },
      });

      // Record Wallet Transaction
      await prisma.walletTransaction.create({
        data: {
          userId: order.userId,
          type: 'credit',
          amount: refundAmount,
          note: `Refund for Order #${order.orderNumber}`,
        },
      });

      return NextResponse.json({ success: true, message: `Refunded ₹${refundAmount} to user wallet` });
    }

    // 4. KYC Approve / Reject
    if (action === 'kyc' && (workerId || phone)) {
      const targetWorker = workerId
        ? await prisma.worker.findUnique({ where: { id: workerId } })
        : await prisma.worker.findUnique({ where: { phone } });

      if (!targetWorker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }

      const isApprove = body.decision === 'approve';
      await prisma.worker.update({
        where: { id: targetWorker.id },
        data: {
          kycStatus: isApprove ? 'verified' : 'rejected',
        },
      });

      return NextResponse.json({
        success: true,
        message: isApprove ? 'Shopper KYC approved' : `Shopper KYC rejected: ${reason || 'Documents unclear'}`,
      });
    }

    // 5. Settle Shop Payment
    if (action === 'approve_shop_payment' && itemId) {
      await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          shopPaymentStatus: 'paid',
          shopPaymentProof: proofUrl || '/images/decor/visasra-bag.png',
        },
      });

      return NextResponse.json({ success: true, message: 'Shop payment cleared in PostgreSQL' });
    }

    // 6. Settle Worker Payout
    if (action === 'settle_payout' && workerId) {
      const payoutAmt = Number(amount) || 1000;
      await prisma.worker.update({
        where: { id: workerId },
        data: {
          walletBalance: { decrement: Math.max(0, payoutAmt) },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Payout of ₹${payoutAmt} marked paid (UTR: ${utr || 'UPI-' + Date.now()})`,
      });
    }

    // 7. Mark Online Order Placed on Amazon/Flipkart
    if (action === 'mark_online_ordered' && itemId) {
      const { onlineOrderNumber, onlineTrackingNumber, onlinePurchaseNotes, purchasePrice } = body;
      const updatedItem = await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          onlineOrderStatus: 'ordered_online',
          status: 'purchased',
          onlineOrderNumber: onlineOrderNumber ? String(onlineOrderNumber) : null,
          onlineTrackingNumber: onlineTrackingNumber ? String(onlineTrackingNumber) : null,
          onlinePurchaseNotes: onlinePurchaseNotes ? String(onlinePurchaseNotes) : null,
          onlinePurchasedAt: new Date(),
          approvedAmount: Number(purchasePrice) || undefined,
        },
        include: { order: { include: { items: true } } },
      });

      // If all items in this order are procured/purchased, update order stage
      const allItems = updatedItem.order.items;
      const allOrdered = allItems.every((it) => it.status === 'purchased' || it.onlineOrderStatus === 'ordered_online' || it.onlineOrderStatus === 'received_at_hub');
      if (allOrdered) {
        await prisma.order.update({
          where: { id: updatedItem.orderId },
          data: { trackingStage: 'purchased' },
        });
        await prisma.orderTrackingStage.updateMany({
          where: { orderId: updatedItem.orderId, stageKey: 'purchased' },
          data: { status: 'done', note: `Online items ordered by Visasra Ops (${onlineOrderNumber || 'Order confirmed'})` },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Marked as ordered online! Ref: ${onlineOrderNumber || 'Saved'}`,
      });
    }

    // 8. Mark Online Order Received at Hub
    if (action === 'mark_online_received' && itemId) {
      const updatedItem = await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          onlineOrderStatus: 'received_at_hub',
          onlineReceivedAt: new Date(),
        },
        include: { order: { include: { items: true } } },
      });

      const allItems = updatedItem.order.items;
      const allReceived = allItems.every((it) => it.onlineOrderStatus === 'received_at_hub');
      if (allReceived) {
        await prisma.order.update({
          where: { id: updatedItem.orderId },
          data: { trackingStage: 'packed' },
        });
        await prisma.orderTrackingStage.updateMany({
          where: { orderId: updatedItem.orderId, stageKey: 'packed' },
          data: { status: 'done', note: 'All online packages received at Visasra Fulfillment Hub' },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Item marked as safely received at Visasra Fulfillment Hub!',
      });
    }

    // 9. Update Online Item Details
    if (action === 'update_online_item' && itemId) {
      const { onlineOrderNumber, onlineTrackingNumber, onlinePurchaseNotes } = body;
      await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          onlineOrderNumber: onlineOrderNumber !== undefined ? String(onlineOrderNumber) : undefined,
          onlineTrackingNumber: onlineTrackingNumber !== undefined ? String(onlineTrackingNumber) : undefined,
          onlinePurchaseNotes: onlinePurchaseNotes !== undefined ? String(onlinePurchaseNotes) : undefined,
        },
      });
      return NextResponse.json({ success: true, message: 'Online procurement details updated' });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Admin action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
