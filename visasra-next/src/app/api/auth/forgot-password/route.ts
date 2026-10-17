import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAndStoreOtp, verifyStoredOtp } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { action, email, otp, newPassword } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email / Gmail ID is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    // Step 1: Request OTP - Store in PostgreSQL and dispatch via Resend
    if (action === 'request_otp') {
      const otpResult = await createAndStoreOtp(cleanEmail, 'reset_password');
      return NextResponse.json({
        success: true,
        message: otpResult.message || `Password reset code sent to ${cleanEmail}. Please check your email.`,
      });
    }

    // Step 2: Reset Password with OTP verified against PostgreSQL
    if (action === 'reset_password') {
      if (!otp) {
        return NextResponse.json({ error: 'Verification OTP is required' }, { status: 400 });
      }

      const verifyCheck = await verifyStoredOtp(cleanEmail, otp, 'reset_password');
      if (!verifyCheck.valid) {
        return NextResponse.json({ error: verifyCheck.error || 'Invalid or expired OTP' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email: cleanEmail },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successful! You can now sign in with your new password.',
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Password reset failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
