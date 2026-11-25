import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/jwt';
import { broadcastLiveEvent } from '@/lib/eventBus';

export async function POST(req: Request) {
  try {
    const adminSession = await getAdminFromRequest(req);
    if (!adminSession) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid admin session token required' },
        { status: 401 }
      );
    }

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
          status: isApprove ? 'active' : targetWorker.status,
        },
      });

      return NextResponse.json({
        success: true,
        message: isApprove ? 'Shopper KYC approved' : `Shopper KYC rejected: ${reason || 'Documents unclear'}`,
      });
    }

    // 4b. Toggle Worker Status (Active / Suspended)
    if (action === 'toggle_worker_status' && workerId) {
      const targetWorker = await prisma.worker.findUnique({ where: { id: workerId } });
      if (!targetWorker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }
      const newStatus = body.status || (targetWorker.status === 'active' ? 'suspended' : 'active');
      await prisma.worker.update({
        where: { id: targetWorker.id },
        data: { status: newStatus },
      });
      return NextResponse.json({
        success: true,
        message: `Shopper status updated to ${newStatus}`,
      });
    }

    // 5. Settle Shop Payment
    if (action === 'approve_shop_payment' && itemId) {
      const updatedItem = await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          shopPaymentStatus: 'paid',
          shopPaymentProof: proofUrl || '/images/decor/visasra-bag.png',
        },
        include: {
          order: {
            include: {
              liveSession: true,
            },
          },
        },
      });

      if (updatedItem.order?.liveSession?.slotKey) {
        broadcastLiveEvent(updatedItem.order.liveSession.slotKey, 'qr_cleared', {
          itemId,
          amount: updatedItem.shopPaymentAmount,
          proofUrl: updatedItem.shopPaymentProof,
        });
      }

      return NextResponse.json({ success: true, message: 'Shop payment cleared in PostgreSQL' });
    }

    // 6. Settle Worker Payout
    if (action === 'settle_payout' && workerId) {
      const payoutAmt = Number(amount);
      if (isNaN(payoutAmt) || payoutAmt <= 0) {
        return NextResponse.json({ error: 'Valid payout amount greater than 0 is required' }, { status: 400 });
      }

      // Atomic conditional decrement: prevents race conditions and negative worker balances
      const updateResult = await prisma.worker.updateMany({
        where: {
          id: workerId,
          walletBalance: { gte: payoutAmt },
        },
        data: {
          walletBalance: { decrement: payoutAmt },
        },
      });

      if (updateResult.count === 0) {
        const currentWorker = await prisma.worker.findUnique({
          where: { id: workerId },
          select: { walletBalance: true },
        });

        if (!currentWorker) {
          return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
        }

        return NextResponse.json({
          error: `Payout failed: Insufficient worker balance. Current balance is ₹${Number(currentWorker.walletBalance).toLocaleString('en-IN')}, but requested payout is ₹${payoutAmt.toLocaleString('en-IN')}.`,
        }, { status: 400 });
      }

      const updatedWorker = await prisma.worker.findUnique({
        where: { id: workerId },
        select: { walletBalance: true, name: true },
      });

      const remBal = updatedWorker ? Number(updatedWorker.walletBalance) : 0;

      return NextResponse.json({
        success: true,
        message: `Payout of ₹${payoutAmt.toLocaleString('en-IN')} marked paid to ${updatedWorker?.name || 'worker'} (UTR: ${utr || 'UPI-' + Date.now()}). Remaining balance: ₹${remBal.toLocaleString('en-IN')}`,
        remainingBalance: remBal,
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

    // 10. Admin Direct Handover Verification for Ground Shoppers
    if (action === 'verify_handover' && slotKey) {
      const decodedKey = decodeURIComponent(slotKey);
      const session = await prisma.liveSession.findUnique({
        where: { slotKey: decodedKey },
      });
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: {
          stage: 'packed',
          status: 'completed',
        },
      });

      if (session.orderId) {
        await prisma.order.update({
          where: { id: session.orderId },
          data: {
            trackingStage: 'packed',
            status: 'packed',
          },
        });
        await prisma.orderTrackingStage.updateMany({
          where: { orderId: session.orderId, stageKey: 'packed' },
          data: { status: 'current', note: 'QC Passed & Packed at Visasra Fulfillment Hub' },
        });
      }

      if (session.workerId) {
        await prisma.worker.update({
          where: { id: session.workerId },
          data: {
            walletBalance: { increment: 350 },
            ordersDone: { increment: 1 },
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Shopper packages inspected & Handover verified! ₹350 payout credited to shopper wallet.',
      });
    }

    // 11. Mark Order Shipped with Airway Bill / Tracking Carrier
    if (action === 'mark_shipped' && orderId) {
      const { carrier, trackingNumber, trackingUrl, note } = body;
      const carrierName = carrier ? String(carrier).trim() : 'DHL Express';
      const awb = trackingNumber ? String(trackingNumber).trim() : 'EXP-' + Math.floor(10000000 + Math.random() * 90000000);
      const url = trackingUrl ? String(trackingUrl).trim() : null;

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'shipped',
          trackingStage: 'shipped',
          carrier: carrierName,
          trackingNumber: awb,
          trackingUrl: url,
          shippedAt: new Date(),
        },
      });

      // Update tracking stages in PostgreSQL
      await prisma.orderTrackingStage.updateMany({
        where: { orderId, stageKey: 'packed' },
        data: { status: 'done' },
      });
      await prisma.orderTrackingStage.updateMany({
        where: { orderId, stageKey: 'shipped' },
        data: {
          status: 'current',
          note: note ? String(note).trim() : `Dispatched via ${carrierName} (AWB: ${awb})`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Order #${updatedOrder.orderNumber} dispatched via ${carrierName}! AWB: ${awb}`,
        order: updatedOrder,
      });
    }

    // 12. Mark Order Delivered
    if (action === 'mark_delivered' && orderId) {
      const { note } = body;
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'delivered',
          trackingStage: 'out_for_delivery',
          deliveredAt: new Date(),
        },
      });

      await prisma.orderTrackingStage.updateMany({
        where: { orderId, stageKey: 'shipped' },
        data: { status: 'done' },
      });
      await prisma.orderTrackingStage.updateMany({
        where: { orderId, stageKey: 'out_for_delivery' },
        data: {
          status: 'done',
          note: note ? String(note).trim() : 'Package successfully delivered to customer doorstep with signature verification',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Order #${updatedOrder.orderNumber} marked as successfully delivered!`,
        order: updatedOrder,
      });
    }

    // 13. Delete / Purge Test Order (Admin Cleanup)
    if (action === 'delete_order' && orderId) {
      await prisma.liveSession.deleteMany({
        where: { orderId },
      });
      await prisma.order.delete({
        where: { id: orderId },
      });

      return NextResponse.json({
        success: true,
        message: 'Order and associated test data purged successfully from PostgreSQL',
      });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Admin action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
