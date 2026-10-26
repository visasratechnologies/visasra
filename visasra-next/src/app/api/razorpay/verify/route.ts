import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing required signature verification fields' },
        { status: 400 }
      );
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || 'O1e5VVNluY2HmvZUtsO4301p';

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.warn('[Razorpay verify] Signature mismatch:', {
        expected: expectedSignature,
        received: razorpay_signature,
      });
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
