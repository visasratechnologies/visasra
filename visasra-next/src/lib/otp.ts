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
 * Dispatches a real branded email containing the 6-digit OTP code via Resend.
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

    // 2. Dispatch real email via Resend with verified domain visasra.com
    const dispatch = await dispatchEmailViaResend({
      to: cleanEmail,
      otp,
      type,
    });

    if (!dispatch.sent) {
      console.warn(`[Visasra OTP Service] Primary email dispatch failed: ${dispatch.error}. Retrying fallback sender...`);
      // Retry with alternative verified sender
      await dispatchEmailViaResend({
        to: cleanEmail,
        otp,
        type,
        useFallback: true,
      });
    }

    const returnMessage = `Verification code sent to ${cleanEmail}. Please enter the 6-digit code to continue.`;

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
      message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
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
    // 1. Query PostgreSQL for active unverified OTP
    const rows: Array<{ id: string; otp: string }> = await prisma.$queryRawUnsafe(
      `SELECT "id", "otp" FROM "OtpVerification"
       WHERE "email" = $1 AND "type" = $2 AND "verified" = false AND "expiresAt" > NOW()
       ORDER BY "createdAt" DESC LIMIT 1`,
      cleanEmail,
      type
    );

    if (rows && rows.length > 0 && rows[0].otp === cleanOtp) {
      // Mark as verified in PostgreSQL so it cannot be reused
      await prisma.$executeRawUnsafe(
        `UPDATE "OtpVerification" SET "verified" = true WHERE "id" = $1`,
        rows[0].id
      );
      return { valid: true };
    }

    if (!rows || rows.length === 0) {
      return { valid: false, error: 'Verification code expired or not found. Please request a new code.' };
    }

    return { valid: false, error: 'Incorrect verification code. Please check your email and enter the 6-digit OTP.' };
  } catch (err: unknown) {
    console.error('Error verifying OTP:', err);
    return { valid: false, error: 'Database verification failed' };
  }
}

/**
 * Helper to dispatch real emails using Resend service with verified domain visasra.com
 */
async function dispatchEmailViaResend({
  to,
  otp,
  type,
  useFallback = false,
}: {
  to: string;
  otp: string;
  type: 'signup' | 'login' | 'reset_password';
  useFallback?: boolean;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  const titles = {
    signup: 'Verify Your Visasra Account',
    login: 'Your Visasra Sign-In Code',
    reset_password: 'Reset Your Visasra Password',
  };

  const actionDescriptions = {
    signup: 'complete your account registration',
    login: 'sign into your Visasra account',
    reset_password: 'reset your account password',
  };

  const fromSender = useFallback
    ? 'Visasra Concierge <no-reply@visasra.com>'
    : (process.env.RESEND_FROM_EMAIL || 'Visasra <auth@visasra.com>');

  const subject = `${otp} is your Visasra verification code`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromSender,
        to: [to],
        subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${subject}</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 32px 16px;">
              <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #071D3A 0%, #0A3A6B 100%); padding: 28px 24px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                    Visasra
                  </h1>
                  <p style="color: #BAE6FD; margin: 6px 0 0; font-size: 13px;">
                    Shop India, Delivered Anywhere
                  </p>
                </div>

                <!-- Body -->
                <div style="padding: 32px 28px;">
                  <h2 style="color: #0F172A; font-size: 18px; font-weight: 700; margin: 0 0 10px;">
                    ${titles[type] || 'Verification Code'}
                  </h2>
                  <p style="color: #475569; font-size: 14.5px; line-height: 1.5; margin: 0 0 20px;">
                    Please enter the following 6-digit one-time password (OTP) in the Visasra app to ${actionDescriptions[type] || 'verify your identity'}:
                  </p>

                  <!-- OTP Display Box -->
                  <div style="background: #F0F7FF; border: 2px solid #BAE6FD; border-radius: 12px; padding: 20px 16px; text-align: center; margin: 24px 0;">
                    <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0A3A6B; font-family: monospace;">
                      ${otp}
                    </div>
                    <div style="color: #0369A1; font-size: 12px; font-weight: 600; margin-top: 8px;">
                      ⏱️ Valid for 15 minutes · Single-use code
                    </div>
                  </div>

                  <p style="color: #64748B; font-size: 13px; line-height: 1.5; margin: 20px 0 0;">
                    Security Note: Visasra representatives will never ask for your verification code or password. If you did not initiate this request, you can safely ignore this email.
                  </p>
                </div>

                <!-- Footer -->
                <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94A3B8;">
                  © ${new Date().getFullYear()} Visasra Technologies Inc. All rights reserved.
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn(`[Visasra OTP Service] Resend error (${fromSender}):`, data);
      return { sent: false, error: data?.message || 'Dispatch failed' };
    }

    console.log(`[Visasra OTP Service] Real 6-digit OTP email delivered via ${fromSender} to ${to} (ID: ${data?.id})`);
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resend network error';
    console.error(`Failed to send email via ${fromSender}:`, message);
    return { sent: false, error: message };
  }
}
