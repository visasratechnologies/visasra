import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, workerId, orderId, rating, comment, email } = body;

    let targetUserId = userId;
    if (!targetUserId && email) {
      const u = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (u) targetUserId = u.id;
    }

    if (!targetUserId || !workerId) {
      return NextResponse.json({ error: 'User ID and Worker ID are required' }, { status: 400 });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    // Check if review already exists for this order
    if (orderId) {
      const existing = await prisma.workerReview.findUnique({
        where: { orderId },
      });
      if (existing) {
        return NextResponse.json({ error: 'You have already submitted a review for this order' }, { status: 400 });
      }
    }

    // Create review in PostgreSQL
    const review = await prisma.workerReview.create({
      data: {
        userId: targetUserId,
        workerId,
        orderId: orderId || null,
        rating: numRating,
        comment: comment ? String(comment).trim() : null,
      },
    });

    // Recalculate Worker average rating in PostgreSQL
    const agg = await prisma.workerReview.aggregate({
      where: { workerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    if (agg._avg.rating !== null) {
      const roundedRating = Math.round(agg._avg.rating * 10) / 10;
      await prisma.worker.update({
        where: { id: workerId },
        data: { rating: roundedRating },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your rating and review have been saved.',
      review,
    });
  } catch (err: unknown) {
    console.error('Review submission error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to submit review';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const review = await prisma.workerReview.findUnique({
        where: { orderId },
        include: { user: { select: { name: true, avatar: true } } },
      });
      return NextResponse.json({ success: true, review });
    }

    if (workerId) {
      const reviews = await prisma.workerReview.findMany({
        where: { workerId },
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, reviews });
    }

    return NextResponse.json({ error: 'Worker ID or Order ID required' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reviews';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
