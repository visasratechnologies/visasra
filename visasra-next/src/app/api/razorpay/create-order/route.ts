import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawAmount = Number(body.amount);

    if (isNaN(rawAmount) || rawAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount' },
        { status: 400 }
      );
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      'rzp_live_T2fS0wvX1zbtHt';
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || 'O1e5VVNluY2HmvZUtsO4301p';

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay API credentials not configured' },
        { status: 500 }
      );
    }

    // Razorpay amount is in subunits (paise for INR): 1 INR = 100 paise
    const amountInPaise = Math.round(rawAmount * 100);
    const currency = (body.currency || 'INR').toUpperCase();
    const receipt = body.receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const authHeader = Buffer.from(`${keyId.trim()}:${keySecret.trim()}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt,
        notes: body.notes || {},
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Razorpay create-order] API error:', data);
      const errMsg =
        data?.error?.description || data?.error?.message || 'Failed to create Razorpay order';
      return NextResponse.json({ success: false, error: errMsg }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      key: keyId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[Razorpay create-order] Exception:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
