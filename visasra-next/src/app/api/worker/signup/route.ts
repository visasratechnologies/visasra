import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAndStoreOtp, verifyStoredOtp } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, email, phone, password, otp } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Please enter your email address' }, { status: 400 });
    }
    const cleanEmail = email.toLowerCase().trim();

    // Step 1: Send Email OTP for Worker Signup
    if (action === 'send_otp') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 });
      }
      if (!phone || !phone.trim()) {
        return NextResponse.json({ error: 'Please enter your 10-digit mobile number' }, { status: 400 });
      }
      const rawDigits = phone.replace(/\D/g, '').slice(-10);
      if (rawDigits.length !== 10) {
        return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Check if email or phone already registered
      const existingEmail = await prisma.worker.findUnique({
        where: { email: cleanEmail },
      });
      if (existingEmail) {
        return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 });
      }

      const formattedPhone = `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;
      const existingPhone = await prisma.worker.findFirst({
        where: {
          OR: [
            { phone: formattedPhone },
            { phone: rawDigits },
            { phone: `+91${rawDigits}` },
          ],
        },
      });
      if (existingPhone) {
        return NextResponse.json({ error: 'This mobile number is already registered. Please sign in.' }, { status: 400 });
      }

      // Generate & store OTP in PostgreSQL
      const otpResult = await createAndStoreOtp(cleanEmail, 'signup');

      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${cleanEmail}. (Code: ${otpResult.otp})`,
        otp: otpResult.otp,
      });
    }

    // Step 2: Verify Email OTP and Create Worker Account
    if (action === 'verify_and_create') {
      if (!otp || !otp.trim()) {
        return NextResponse.json({ error: 'Please enter the 6-digit email verification code' }, { status: 400 });
      }
      if (!name || !phone || !password) {
        return NextResponse.json({ error: 'Missing registration details' }, { status: 400 });
      }

      const verifyCheck = await verifyStoredOtp(cleanEmail, otp, 'signup');
      if (!verifyCheck.valid) {
        return NextResponse.json({ error: verifyCheck.error || 'Invalid or expired verification code' }, { status: 400 });
      }

      const rawDigits = phone.replace(/\D/g, '').slice(-10);
      const formattedPhone = `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;

      const hashedPassword = await bcrypt.hash(password, 10);

      const worker = await prisma.worker.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          phone: formattedPhone,
          password: hashedPassword,
          rating: 4.8,
          ordersDone: 0,
          status: 'offline',
          kycStatus: 'none', // Strictly requires application form submission post-login
          walletBalance: 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Account created successfully! Please complete your verification application.',
        worker,
        token: 'worker_session_' + Date.now(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Worker signup error:', err);
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
