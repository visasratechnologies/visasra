import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAndStoreOtp, verifyStoredOtp } from '@/lib/otp';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, phone, otp, name } = body;

    // A. Action to send OTP specifically to Email (saved in PostgreSQL & dispatched via Resend)
    if (action === 'send_email_otp') {
      if (!email || !email.trim()) {
        return NextResponse.json({ error: 'Please enter your Gmail / Email ID' }, { status: 400 });
      }
      const cleanEmail = email.toLowerCase().trim();
      const otpResult = await createAndStoreOtp(cleanEmail, 'login');
      return NextResponse.json({
        success: true,
        message: otpResult.message || `Verification code sent to ${cleanEmail}. Please check your email.`,
      });
    }

    // 1. Primary: Email Login with OTP (verified against PostgreSQL)
    if (email && otp) {
      const cleanEmail = email.toLowerCase().trim();
      const verifyCheck = await verifyStoredOtp(cleanEmail, otp, 'login');
      if (!verifyCheck.valid) {
        return NextResponse.json({ error: verifyCheck.error || 'Invalid verification code' }, { status: 400 });
      }

      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        const randomPass = crypto.randomUUID();
        const defaultPassword = await bcrypt.hash(randomPass, 10);
        user = await prisma.user.create({
          data: {
            name: name ? name.trim() : cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: phone ? phone.trim() : null,
            password: defaultPassword,
            walletBalance: 0,
            lastLoginAt: new Date(),
          },
        });
      }

      // Record authoritative session in PostgreSQL and update lastLoginAt
      const session = await createSession(user.id, req);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          avatar: user.avatar,
          walletBalance: user.walletBalance,
          lastLoginAt: user.lastLoginAt,
        },
        token: session.token,
      });
    }

    // 2. Primary: Email or Phone + Password Login
    if ((email || phone) && password) {
      const cleanInput = (email || phone || '').toLowerCase().trim();
      const cleanDigits = cleanInput.replace(/\D/g, '').slice(-10);
      const isPhone = !cleanInput.includes('@') && cleanDigits.length >= 10;
      const phoneVariations = [
        cleanInput,
        cleanDigits,
        `+91${cleanDigits}`,
        `+91 ${cleanDigits}`,
        `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`,
        `91${cleanDigits}`,
      ];

      let user = null;
      if (!isPhone) {
        user = await prisma.user.findUnique({
          where: { email: cleanInput },
        });
      }
      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: cleanInput },
              ...phoneVariations.map((p) => ({ phone: p })),
            ],
          },
        });
      }

      if (!user) {
        return NextResponse.json({ error: 'No account found with this email or phone number. Please check or sign up.' }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Incorrect password. Please try again or use Forgot Password.' }, { status: 401 });
      }

      // Record authoritative session in PostgreSQL and update lastLoginAt
      const session = await createSession(user.id, req);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          avatar: user.avatar,
          walletBalance: user.walletBalance,
          lastLoginAt: user.lastLoginAt,
        },
        token: session.token,
      });
    }

    // 3. Fallback: Phone Login with OTP
    if (phone && otp) {
      const cleanPhone = phone.trim();
      const digits = cleanPhone.replace(/\D/g, '').slice(-10);
      const verifyCheck = await verifyStoredOtp(phone, otp, 'login');
      if (!verifyCheck.valid) {
        return NextResponse.json({ error: verifyCheck.error || 'Invalid verification OTP' }, { status: 400 });
      }

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: { contains: digits } },
            { email: `${digits}@visasra.com` },
            { email: 'customer@visasra.com' },
          ],
        },
      });

      if (!user) {
        const defaultPassword = await bcrypt.hash(crypto.randomUUID(), 10);
        user = await prisma.user.create({
          data: {
            name: name ? name.trim() : 'Customer',
            email: `${digits || Date.now()}@visasra.com`,
            phone: cleanPhone.startsWith('+') ? cleanPhone : `+91 ${digits}`,
            password: defaultPassword,
            walletBalance: 0,
            lastLoginAt: new Date(),
          },
        });
      }

      // Record authoritative session in PostgreSQL and update lastLoginAt
      const session = await createSession(user.id, req);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          avatar: user.avatar,
          walletBalance: user.walletBalance,
          lastLoginAt: user.lastLoginAt,
        },
        token: session.token,
      });
    }

    return NextResponse.json({ error: 'Please enter your Gmail / Email ID and Password or OTP' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

