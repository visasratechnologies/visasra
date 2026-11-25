import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/jwt';

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin session required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({ success: true, customers: [] });
    }

    const customers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        walletBalance: true,
        location: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            note: true,
            date: true,
          },
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
      take: 20,
    });

    return NextResponse.json({ success: true, customers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Customer lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
