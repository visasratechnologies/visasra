import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, phone, name, isSignUp, otp } = body;

    // 1. Primary: Email and Password Login
    if (email && password) {
      const cleanEmail = email.toLowerCase().trim();
      const worker = await prisma.worker.findUnique({
        where: { email: cleanEmail },
      });

      if (!worker) {
        return NextResponse.json({ error: 'No account found with this email. Please check or create an account.' }, { status: 401 });
      }

      // Check password
      let isValid = false;
      if (worker.password) {
        isValid = await bcrypt.compare(password, worker.password);
      }
      // Allow demo default fallback password
      if (!isValid && (password === 'password123' || password === 'visasra123')) {
        isValid = true;
      }

      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect password. Try password123 or use Forgot Password.' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        worker,
        token: 'worker_session_' + Date.now(),
      });
    }

    // 2. Fallback: Phone and OTP Login (for demo shopper auto-fill)
    if (phone) {
      if (otp && otp !== '123456' && otp !== '9999') {
        return NextResponse.json({ error: 'Invalid OTP. Please use Demo OTP: 123456' }, { status: 400 });
      }

      const cleanPhone = phone.trim();
      const digits = cleanPhone.replace(/\D/g, '').slice(-10);
      let worker = await prisma.worker.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` },
            { phone: `+91${digits}` },
            { phone: digits },
          ],
        },
      });

      if (!worker) {
        if (!isSignUp) {
          return NextResponse.json({ error: 'Worker account not found with this number. Please sign up first.' }, { status: 404 });
        }
        worker = await prisma.worker.create({
          data: {
            name: name ? name.trim() : 'Partner',
            phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
            email: `${digits}@shopper.visasra.com`,
            rating: 5.0,
            ordersDone: 0,
            status: 'offline',
            kycStatus: 'none',
            walletBalance: 0,
          },
        });
      } else if (name && isSignUp) {
        worker = await prisma.worker.update({
          where: { id: worker.id },
          data: { name: name.trim() },
        });
      }

      return NextResponse.json({
        success: true,
        worker,
        token: 'worker_session_' + Date.now(),
      });
    }

    return NextResponse.json({ error: 'Please enter your email and password to log in' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Worker login error:', err);
    const message = err instanceof Error ? err.message : 'Worker login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
