import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createAndStoreOtp, verifyStoredOtp } from '@/lib/otp';
import { signAdminToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { action, email, password, otp } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Step 1: Send real OTP to Admin email
    if (action === 'send_otp') {
      const otpResult = await createAndStoreOtp(cleanEmail, 'login');
      return NextResponse.json({
        success: true,
        message: otpResult.message || `Verification code sent to ${cleanEmail}. Please check your email.`,
      });
    }

    let admin = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin) {
      // If admin doesn't exist yet, seed initial administrator with random hash and require OTP
      if (cleanEmail === 'admin@visasra.com' || cleanEmail === 'visasratechnologies@gmail.com') {
        const initialRandomPassword = await bcrypt.hash(crypto.randomUUID(), 10);
        admin = await prisma.admin.create({
          data: {
            name: 'Visasra Administrator',
            email: cleanEmail,
            password: initialRandomPassword,
            role: 'superadmin',
          },
        });
      } else {
        return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
      }
    }

    // Check verification OTP or Password against PostgreSQL
    if (otp) {
      const verifyCheck = await verifyStoredOtp(cleanEmail, otp, 'login');
      if (!verifyCheck.valid) {
        return NextResponse.json({ error: verifyCheck.error || 'Invalid or expired authorization code' }, { status: 401 });
      }
    } else if (password) {
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Password or OTP required' }, { status: 400 });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate authoritative cryptographic JWT session token
    const token = signAdminToken({
      adminId: updatedAdmin.id,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        lastLoginAt: updatedAdmin.lastLoginAt,
      },
      token,
    });

    // Set secure HttpOnly cookie for defense-in-depth
    response.cookies.set('visasra_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Admin login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
