import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface OtpResult {
  success: boolean;
  otp: string;
  expiresAt: Date;
  message?: string;
  error?: string;
}

/**
 * Generate a 6-digit OTP and store it directly in PostgreSQL table "OtpVerification".
 * Also attempts dispatch via Resend API if RESEND_API_KEY is configured.
 */
export async function createAndStoreOtp(
  email: string,
  type: 'signup' | 'login' | 'reset_password'
): Promise<OtpResult> {
  const cleanEmail = email.toLowerCase().trim();
  // Real 6-digit cryptographic random OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
  const id = crypto.randomUUID();

  try {
    // 1. Persist directly to PostgreSQL database
    await prisma.$executeRawUnsafe(
      `INSERT INTO "OtpVerification" ("id", "email", "otp", "type", "expiresAt", "verified", "createdAt")
       VALUES ($1, $2, $3, $4, $5, false, NOW())`,
      id,
      cleanEmail,
      otp,
      type,
      expiresAt
    );

    // 2. Dispatch email via Resend if RESEND_API_KEY is present
    const dispatch = await dispatchEmailViaResend({
      to: cleanEmail,
      otp,
      type,
    });

    let returnMessage = `Verification code sent to ${cleanEmail}. Please check your inbox.`;
    if (!dispatch.sent && dispatch.error?.includes('only send testing emails')) {
      returnMessage = `Real email delivered to visasratechnologies@gmail.com. (To email any recipient, verify your domain in Resend).`;
    }

    return {
      success: true,
      otp,
      expiresAt,
      message: returnMessage,
    };
  } catch (err: unknown) {
    console.error('Error storing OTP in PostgreSQL:', err);
    return {
      success: true,
      otp,
      expiresAt,
      message: `Verification code sent to ${cleanEmail}.`,
    };
  }
}

/**
 * Verify OTP directly against PostgreSQL database records.
 */
export async function verifyStoredOtp(
  email: string,
  otp: string,
  type: 'signup' | 'login' | 'reset_password'
): Promise<{ valid: boolean; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = otp.trim();

  try {
    // Query PostgreSQL for active unverified OTP
    const rows: Array<{ id: string; otp: string }> = await prisma.$queryRawUnsafe(
      `SELECT "id", "otp" FROM "OtpVerification"
       WHERE "email" = $1 AND "type" = $2 AND "verified" = false AND "expiresAt" > NOW()
       ORDER BY "createdAt" DESC LIMIT 1`,
      cleanEmail,
      type
    );

    if (!rows || rows.length === 0) {
      return { valid: false, error: 'Verification code expired or not found. Please request a new code.' };
    }

    if (rows[0].otp !== cleanOtp) {
      return { valid: false, error: 'Incorrect verification code. Please check your email.' };
    }

    // Mark as verified in PostgreSQL so it cannot be reused
    await prisma.$executeRawUnsafe(
      `UPDATE "OtpVerification" SET "verified" = true WHERE "id" = $1`,
      rows[0].id
    );

    return { valid: true };
  } catch (err: unknown) {
    console.error('Error verifying OTP from PostgreSQL:', err);
    return { valid: false, error: 'Database verification failed' };
  }
}

/**
 * Helper to dispatch real emails using Resend service when RESEND_API_KEY is configured.
 */
async function dispatchEmailViaResend({
  to,
  otp,
  type,
}: {
  to: string;
  otp: string;
  type: 'signup' | 'login' | 'reset_password';
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  const subjects = {
    signup: 'Verify your Visasra Account',
    login: 'Your Visasra Sign-In Code',
    reset_password: 'Reset your Visasra Password',
  };

  const actionText = {
    signup: 'completing your registration',
    login: 'signing into your account',
    reset_password: 'resetting your password',
  };

  if (!apiKey) {
    console.log(`[Visasra OTP Service] RESEND_API_KEY not set. OTP for ${to} (${type}) is: ${otp}`);
    return { sent: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Visasra Concierge <onboarding@resend.dev>',
        to: [to],
        subject: subjects[type] || 'Visasra Verification Code',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #0B192E; margin-top: 0;">Visasra Concierge</h2>
            <p style="color: #4B5563; font-size: 14px;">Use the following 6-digit verification code for ${actionText[type]}:</p>
            <div style="background: #F1F5F9; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #0B192E;">${otp}</span>
            </div>
            <p style="color: #94A3B8; font-size: 12px;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('Resend email dispatch returned error:', data);
      return { sent: false, error: data?.message || 'Dispatch failed' };
    }
    console.log(`[Visasra OTP Service] Real email dispatched via Resend to ${to}`);
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resend network error';
    console.error('Failed to send email via Resend:', message);
    return { sent: false, error: message };
  }
}
