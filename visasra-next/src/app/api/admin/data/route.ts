import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/jwt';

export async function GET(req: Request) {
  try {
    const adminSession = await getAdminFromRequest(req);
    if (!adminSession) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid admin session token required' },
        { status: 401 }
      );
    }

    // Lean, high-performance query fetching only the 2 operational domains:
    // 1. Orders & Fulfillment
    // 2. Ground Shoppers, KYC & Payouts
    const [orders, workers] = await Promise.all([
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          slotKey: true,
          slotDate: true,
          slotWindow: true,
          slotLabel: true,
          status: true,
          trackingStage: true,
          orderType: true,
          totalAmount: true,
          customerNotes: true,
          carrier: true,
          trackingNumber: true,
          trackingUrl: true,
          shippedAt: true,
          deliveredAt: true,
          shippingAddress: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              walletBalance: true,
            },
          },
          items: {
            select: {
              id: true,
              name: true,
              category: true,
              qty: true,
              estMin: true,
              estMax: true,
              image: true,
              notes: true,
              status: true,
              approvedAmount: true,
              shopPaymentStatus: true,
              shopPaymentQr: true,
              shopPaymentProof: true,
              shopPaymentAmount: true,
              options: true,
            },
          },
          liveSession: {
            select: {
              id: true,
              slotKey: true,
              status: true,
              stage: true,
              workerId: true,
              storeName: true,
              storeAddress: true,
              workerLat: true,
              workerLng: true,
              worker: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  rating: true,
                  photo: true,
                  status: true,
                  currentLat: true,
                  currentLng: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.worker.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          rating: true,
          ordersDone: true,
          photo: true,
          status: true,
          kycStatus: true,
          aadhaarNumber: true,
          aadhaarFront: true,
          aadhaarBack: true,
          panNumber: true,
          panDoc: true,
          drivingLicenseNumber: true,
          drivingLicenseDoc: true,
          currentAddress: true,
          permanentAddress: true,
          altPhone: true,
          selfie: true,
          currentLat: true,
          currentLng: true,
          walletBalance: true,
          payoutUpi: true,
          bankAccountNumber: true,
          bankIfscCode: true,
          bankName: true,
          bankBranch: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const sanitizedWorkers = workers.map((w) => ({
      ...w,
      walletBalance: Number(w.walletBalance) || 0,
      aadhaarNumber: w.aadhaarNumber ? `XXXX-XXXX-${w.aadhaarNumber.replace(/\D/g, '').slice(-4)}` : null,
      panNumber: w.panNumber ? `XXXXX${w.panNumber.trim().slice(-4)}` : null,
      bankAccountNumber: w.bankAccountNumber ? `XXXXXXXX${w.bankAccountNumber.replace(/\D/g, '').slice(-4)}` : null,
    }));

    const sanitizedOrders = orders.map((o) => ({
      ...o,
      totalAmount: Number(o.totalAmount) || 0,
      user: {
        ...o.user,
        walletBalance: Number(o.user.walletBalance) || 0,
      },
      items: o.items.map((item) => ({
        ...item,
        estMin: Number(item.estMin) || 0,
        estMax: Number(item.estMax) || 0,
        approvedAmount: item.approvedAmount ? Number(item.approvedAmount) : 0,
        shopPaymentAmount: item.shopPaymentAmount ? Number(item.shopPaymentAmount) : 0,
      })),
    }));

    return NextResponse.json({
      success: true,
      orders: sanitizedOrders,
      workers: sanitizedWorkers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch admin data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

