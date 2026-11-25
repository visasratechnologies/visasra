import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyStoredOtp } from '@/lib/otp';
import { signWorkerToken } from '@/lib/jwt';

function sanitizeWorker(w: any) {
  return {
    ...w,
    aadhaarNumber: w.aadhaarNumber ? `XXXX-XXXX-${w.aadhaarNumber.replace(/\D/g, '').slice(-4)}` : null,
    panNumber: w.panNumber ? `XXXXX${w.panNumber.trim().slice(-4)}` : null,
    bankAccountNumber: w.bankAccountNumber ? `XXXXXXXX${w.bankAccountNumber.replace(/\D/g, '').slice(-4)}` : null,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, phone, name, isSignUp, otp } = body;

    // 1. Primary: Email or Phone and Password Login
    if ((email || phone) && password) {
      const input = (email || phone || '').toLowerCase().trim();
      const digits = input.replace(/\D/g, '').slice(-10);
      const isPhoneInput = !input.includes('@') && digits.length >= 10;

      let worker = null;
      if (!isPhoneInput) {
        worker = await prisma.worker.findUnique({
          where: { email: input },
        });
      }
      if (!worker) {
        worker = await prisma.worker.findFirst({
          where: {
            OR: [
              { email: input },
              { phone: input },
              { phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` },
              { phone: `+91${digits}` },
              { phone: digits },
            ],
          },
        });
      }

      if (!worker) {
        return NextResponse.json({ error: 'No partner account found with this email or phone number. Please check or register.' }, { status: 401 });
      }

      // Check password
      let isValid = false;
      if (worker.password) {
        isValid = await bcrypt.compare(password, worker.password);
      }

      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect password. Please try again or use Forgot Password.' }, { status: 401 });
      }

      const updatedWorker = await prisma.worker.update({
        where: { id: worker.id },
        data: { lastLoginAt: new Date() },
      });

      const token = signWorkerToken({
        workerId: updatedWorker.id,
        phone: updatedWorker.phone,
        email: updatedWorker.email,
      });

      const response = NextResponse.json({
        success: true,
        worker: sanitizeWorker(updatedWorker),
        token,
      });

      response.cookies.set('visasra_worker_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // 2. Fallback: Phone and OTP Login
    if (phone && otp) {
      const verifyCheck = await verifyStoredOtp(phone, otp, 'login');
      if (!verifyCheck.valid) {
        return NextResponse.json({ error: verifyCheck.error || 'Invalid verification OTP' }, { status: 400 });
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
            lastLoginAt: new Date(),
          },
        });
      } else {
        worker = await prisma.worker.update({
          where: { id: worker.id },
          data: {
            ...(name && isSignUp ? { name: name.trim() } : {}),
            lastLoginAt: new Date(),
          },
        });
      }

      const token = signWorkerToken({
        workerId: worker.id,
        phone: worker.phone,
        email: worker.email,
      });

      const response = NextResponse.json({
        success: true,
        worker: sanitizeWorker(worker),
        token,
      });

      response.cookies.set('visasra_worker_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json({ error: 'Please enter your email and password to log in' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Worker login error:', err);
    const message = err instanceof Error ? err.message : 'Worker login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
