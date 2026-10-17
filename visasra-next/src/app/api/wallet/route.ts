import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
          },
        },
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      balance: user.walletBalance,
      transactions: user.transactions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch wallet';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, email, amount, note, razorpayPaymentId } = await req.json();
    const topupAmount = Number(amount);

    if (isNaN(topupAmount) || topupAmount <= 0) {
      return NextResponse.json({ error: 'Invalid top-up amount' }, { status: 400 });
    }

    let targetUserId = userId;
    const existingUser = targetUserId
      ? await prisma.user.findUnique({ where: { id: targetUserId } }).catch(() => null)
      : null;

    if (!existingUser && email) {
      const u = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (u) targetUserId = u.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
    }

    const txNote = razorpayPaymentId
      ? `${note || 'Visasra Money Deposit'} · Razorpay Ref: ${razorpayPaymentId}`
      : (note || 'Visasra Money Deposit via Razorpay');

    const [updatedUser, tx] = await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          walletBalance: { increment: topupAmount },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: targetUserId,
          type: 'credit',
          amount: topupAmount,
          note: txNote,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      balance: updatedUser.walletBalance,
      transaction: tx,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Top-up failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
