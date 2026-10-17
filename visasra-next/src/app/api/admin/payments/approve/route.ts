import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { itemId, proofUrl } = await req.json();

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        shopPaymentStatus: 'paid',
        shopPaymentProof: proofUrl || '/images/decor/visasra-bag.png',
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment clearance failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
