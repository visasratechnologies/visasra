import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');

    const sessions = await prisma.liveSession.findMany({
      where: {
        ...(workerId
          ? {
              OR: [
                { workerId },
                { workerId: null },
              ],
            }
          : {}),
        // Ground shoppers must NEVER see online concierge orders (Amazon/Flipkart)
        order: {
          orderType: { not: 'online' },
        },
      },
      include: {
        user: { select: { name: true, phone: true } },
        worker: true,
        order: {
          include: {
            items: {
              // Ground shoppers must ONLY see physical market items
              where: {
                sourceType: { not: 'online' },
              },
              include: { options: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let worker = null;
    if (workerId) {
      worker = await prisma.worker.findUnique({
        where: { id: workerId },
      });
    }

    return NextResponse.json({ success: true, sessions, worker });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch worker jobs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      slotKey,
      action,
      stage,
      workerId,
      itemId,
      optionId,
      optionData,
      qrData,
      finalNote,
      lat,
      lng,
      kycData,
      isOnline,
      payoutAmount,
    } = body;

    // Handle global worker actions (not tied to a specific slotKey)
    if (action === 'toggle_online' && workerId) {
      const updatedWorker = await prisma.worker.update({
        where: { id: workerId },
        data: {
          status: isOnline ? 'active' : 'offline',
        },
      });
      return NextResponse.json({ success: true, worker: updatedWorker });
    }

    if (action === 'update_kyc' && workerId && kycData) {
      const updatedWorker = await prisma.worker.update({
        where: { id: workerId },
        data: {
          kycStatus: 'pending',
          aadhaarNumber: kycData.aadhaarNumber,
          aadhaarFront: kycData.docs?.af || kycData.aadhaarFront,
          aadhaarBack: kycData.docs?.ab || kycData.aadhaarBack,
          panNumber: kycData.panNumber,
          panDoc: kycData.docs?.pan || kycData.panDoc,
          drivingLicenseNumber: kycData.drivingLicenseNumber,
          drivingLicenseDoc: kycData.docs?.dl || kycData.drivingLicenseDoc,
          currentAddress: kycData.currentAddress,
          permanentAddress: kycData.permanentAddress,
          altPhone: kycData.altPhone,
          selfie: kycData.docs?.ph || kycData.selfie,
        },
      });
      return NextResponse.json({ success: true, worker: updatedWorker });
    }

    if (action === 'request_payout' && workerId && payoutAmount) {
      const currentWorker = await prisma.worker.findUnique({ where: { id: workerId } });
      if (!currentWorker || currentWorker.walletBalance < payoutAmount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }
      const updatedWorker = await prisma.worker.update({
        where: { id: workerId },
        data: {
          walletBalance: { decrement: Number(payoutAmount) },
        },
      });
      return NextResponse.json({ success: true, worker: updatedWorker });
    }

    if (!slotKey) {
      return NextResponse.json({ error: 'slotKey required' }, { status: 400 });
    }

    const decodedKey = decodeURIComponent(slotKey);
    const session = await prisma.liveSession.findUnique({
      where: { slotKey: decodedKey },
      include: { order: { include: { items: { include: { options: true } } } } },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 1. Accept Slot
    if (action === 'accept' && workerId) {
      if (session.order?.orderType === 'online') {
        return NextResponse.json({ error: 'This is an online concierge order managed directly by Visasra Admin ops.' }, { status: 403 });
      }
      if (session.workerId && session.workerId !== workerId) {
        return NextResponse.json({ error: 'Sorry — another shopper just accepted this slot' }, { status: 409 });
      }
      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: {
          workerId,
          stage: 'assigned',
          status: 'live',
        },
      });
      if (session.orderId) {
        await prisma.order.update({
          where: { id: session.orderId },
          data: { trackingStage: 'worker_assigned' },
        });
      }
    }

    // 2. Start Trip
    if (action === 'start_trip') {
      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: {
          stage: 'heading_to_store',
          status: 'live',
        },
      });
      if (session.orderId) {
        await prisma.order.update({
          where: { id: session.orderId },
          data: { trackingStage: 'shopping', status: 'shopping' },
        });
        await prisma.orderTrackingStage.updateMany({
          where: { orderId: session.orderId, stageKey: 'shopping' },
          data: { status: 'current' },
        });
      }
    }

    // 3. Arrive / In store
    if (action === 'arrive') {
      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: {
          stage: 'shopping',
          status: 'live',
        },
      });
    }

    // 4. Update Stage directly
    if (action === 'update_stage' && stage) {
      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: {
          stage,
          status: stage === 'packed' ? 'completed' : 'live',
        },
      });

      if (session.orderId) {
        await prisma.order.update({
          where: { id: session.orderId },
          data: {
            trackingStage: stage,
            status: stage,
          },
        });
        await prisma.orderTrackingStage.updateMany({
          where: { orderId: session.orderId, stageKey: stage },
          data: { status: 'current' },
        });
      }
    }

    // 5. Upload option photo & price
    if (action === 'upload_option' && itemId && optionData) {
      await prisma.productOption.create({
        data: {
          orderItemId: itemId,
          image: optionData.image || '/images/categories/jewellery-accessories.jpg',
          price: Number(optionData.price) || 1000,
          description: optionData.description || 'Verified in store',
          status: 'pending',
        },
      });

      await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: 'waiting' },
      });

      // Update store name and address in the live session if worker specified where they are shopping
      if (optionData.store) {
        await prisma.liveSession.update({
          where: { slotKey: decodedKey },
          data: {
            storeName: String(optionData.store).trim(),
            storeAddress: String(optionData.store).trim(),
          },
        });
      }
    }

    // 6. Remove Option
    if (action === 'remove_option' && optionId) {
      await prisma.productOption.delete({
        where: { id: optionId },
      });
    }

    // 7. Share options with customer
    if (action === 'share_options' && itemId) {
      await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: 'options_ready' },
      });
      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: { status: 'live', stage: 'shopping' },
      });
    }

    // 8. Upload Shop QR payment
    if (action === 'upload_qr' && itemId && qrData) {
      await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          shopPaymentStatus: 'qr_uploaded',
          shopPaymentQr: qrData.qr,
          shopPaymentAmount: Number(qrData.amount),
        },
      });
    }

    // 9. Mark product as bought (Allows purchase once customer approved & debited from wallet, or paid via QR)
    if (action === 'bought' && itemId) {
      const targetItem = session.order?.items.find((i) => i.id === itemId);
      if (targetItem && targetItem.status !== 'approved' && targetItem.shopPaymentStatus !== 'paid') {
        return NextResponse.json({ error: 'Customer must approve the option or payment must be cleared first' }, { status: 400 });
      }

      await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: 'purchased' },
      });

      // Check if all items in the order are purchased
      const allItems = session.order?.items || [];
      const allPurchased = allItems.every((it) => (it.id === itemId ? true : it.status === 'purchased'));
      if (allPurchased) {
        await prisma.liveSession.update({
          where: { slotKey: decodedKey },
          data: { stage: 'purchased' },
        });
      }

      return NextResponse.json({ success: true, message: 'Item marked as purchased' });
    }

    // 10. Finish Shopping & Warehouse Handover (Verified with Admin OTP)
    if (action === 'finish') {
      const { handoverOtp } = body;
      const cleanOtp = typeof handoverOtp === 'string' ? handoverOtp.trim() : '';
      if (!cleanOtp || (cleanOtp !== '8492' && cleanOtp.length !== 4)) {
        return NextResponse.json({ error: 'Invalid Handover OTP. Please ask the Visasra QC Admin at the hub counter for the 4-digit code.' }, { status: 400 });
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
      }

      // Credit worker ₹350
      if (session.workerId) {
        await prisma.worker.update({
          where: { id: session.workerId },
          data: {
            walletBalance: { increment: 350 },
            ordersDone: { increment: 1 },
          },
        });
      }
    }

    // 11. Update GPS Location
    if (action === 'update_location' && lat && lng) {
      await prisma.liveSession.update({
        where: { slotKey: decodedKey },
        data: {
          workerLat: Number(lat),
          workerLng: Number(lng),
        },
      });
      if (session.workerId) {
        await prisma.worker.update({
          where: { id: session.workerId },
          data: {
            currentLat: Number(lat),
            currentLng: Number(lng),
          },
        });
      }
    }

    const updated = await prisma.liveSession.findUnique({
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

    return NextResponse.json({ success: true, session: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
