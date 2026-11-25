import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      );
    }

    const { itemId, proofUrl } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        shopPaymentStatus: 'paid',
        shopPaymentProof: proofUrl || null,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment clearance failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
