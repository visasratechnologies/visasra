import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAndStoreOtp, verifyStoredOtp } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { action, email, otp, newPassword } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Please enter your registered email address' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if worker exists
    const worker = await prisma.worker.findUnique({
      where: { email: cleanEmail },
    });

    if (!worker) {
      return NextResponse.json({ error: 'No partner account found with this email address' }, { status: 404 });
    }

    // Step 1: Request Reset OTP
    if (action === 'request_otp') {
      const otpResult = await createAndStoreOtp(cleanEmail, 'reset_password');
      return NextResponse.json({
        success: true,
        message: `Password reset verification code sent to ${cleanEmail}. (Code: ${otpResult.otp})`,
        otp: otpResult.otp,
      });
    }

    // Step 2: Reset Password with OTP verification
    if (action === 'reset_password') {
      if (!otp || !otp.trim()) {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
      }

      const verifyCheck = await verifyStoredOtp(cleanEmail, otp, 'reset_password');
      if (!verifyCheck.valid) {
        return NextResponse.json({ error: verifyCheck.error || 'Invalid or expired verification code' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.worker.update({
        where: { id: worker.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successful! You can now log in with your email and new password.',
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Worker forgot-password error:', err);
    const message = err instanceof Error ? err.message : 'Password reset failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
