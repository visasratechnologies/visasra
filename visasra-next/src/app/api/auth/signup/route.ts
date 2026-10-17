import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAndStoreOtp, verifyStoredOtp } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, email, password, phone, location, otp } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Please enter your Gmail / Email ID' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // Step 1: Generate & Store OTP in PostgreSQL, and dispatch via Resend
    if (action === 'send_otp') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
      }
      if (!phone || !phone.trim()) {
        return NextResponse.json({ error: 'Please enter your mobile number' }, { status: 400 });
      }
      const rawDigits = phone.replace(/\D/g, '');
      if (rawDigits.length < 8 || rawDigits.length > 15) {
        return NextResponse.json({ error: 'Please enter a valid mobile number with country dial code (8 to 15 digits)' }, { status: 400 });
      }
      if (!location || !location.trim()) {
        return NextResponse.json({ error: 'Please enter your location' }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // If user exists, create login OTP; otherwise create signup OTP
      const otpType = existing ? 'login' : 'signup';
      const otpResult = await createAndStoreOtp(cleanEmail, otpType);

      return NextResponse.json({
        success: true,
        isExistingUser: Boolean(existing),
        message: existing
          ? `Welcome back! Verification code sent to email.`
          : otpResult.message,
        otp: otpResult.otp,
      });
    }

    // Step 2: Verify OTP directly against PostgreSQL and create or log in user
    if (!otp) {
      return NextResponse.json({ error: 'Verification OTP is required to verify your email' }, { status: 400 });
    }

    if (existing) {
      // User exists: verify OTP and log them right in
      let verifyCheck = await verifyStoredOtp(cleanEmail, otp, 'login');
      if (!verifyCheck.valid) {
        verifyCheck = await verifyStoredOtp(cleanEmail, otp, 'signup');
      }
      if (!verifyCheck.valid) {
        return NextResponse.json({ error: verifyCheck.error || 'Invalid verification code' }, { status: 400 });
      }

      // Update phone if supplied
      const updatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: {
          phone: phone ? phone.trim() : existing.phone,
        },
      });

      return NextResponse.json({
        success: true,
        isExistingUser: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: location || 'Global',
          walletBalance: updatedUser.walletBalance,
        },
        token: 'customer_session_' + Date.now(),
      });
    }

    // New User: verify signup OTP
    const verifyCheck = await verifyStoredOtp(cleanEmail, otp, 'signup');
    if (!verifyCheck.valid) {
      return NextResponse.json({ error: verifyCheck.error || 'Invalid verification code' }, { status: 400 });
    }

    if (!name || !password) {
      return NextResponse.json({ error: 'Missing registration details' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        walletBalance: 0,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location || location || 'Global',
        walletBalance: user.walletBalance,
      },
      token: 'customer_session_' + Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
