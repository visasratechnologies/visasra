import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [orders, workers, users] = await Promise.all([
      prisma.order.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, walletBalance: true } },
          items: {
            include: { options: true },
          },
          liveSession: {
            include: {
              worker: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.worker.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        include: {
          transactions: { orderBy: { date: 'desc' }, take: 10 },
          orders: { select: { id: true, orderNumber: true, totalAmount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      workers,
      users,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch admin data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
