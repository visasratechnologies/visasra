import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/jwt';

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      );
    }

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

    const rawPendingKycWorkers = await prisma.worker.findMany({
      where: { kycStatus: 'pending' },
    });

    const pendingKycWorkers = rawPendingKycWorkers.map(w => ({
      ...w,
      aadhaarNumber: w.aadhaarNumber ? `XXXX-XXXX-${w.aadhaarNumber.replace(/\D/g, '').slice(-4)}` : null,
      panNumber: w.panNumber ? `XXXXX${w.panNumber.trim().slice(-4)}` : null,
      bankAccountNumber: w.bankAccountNumber ? `XXXXXXXX${w.bankAccountNumber.replace(/\D/g, '').slice(-4)}` : null,
    }));

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
