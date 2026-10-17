import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalOrders = await prisma.order.count();
    const liveSessionsCount = await prisma.liveSession.count({
      where: { status: 'live' },
    });
    const totalShoppers = await prisma.worker.count();
    const totalCustomers = await prisma.user.count();

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { options: true } },
        liveSession: { include: { worker: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const pendingKycWorkers = await prisma.worker.findMany({
      where: { kycStatus: 'pending' },
    });

    const pendingShopPayments = await prisma.orderItem.findMany({
      where: { shopPaymentStatus: 'qr_uploaded' },
      include: {
        order: { include: { user: true } },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        liveSessionsCount,
        totalShoppers,
        totalCustomers,
      },
      orders,
      pendingKycWorkers,
      pendingShopPayments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch admin stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
