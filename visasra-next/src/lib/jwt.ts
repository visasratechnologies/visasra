import crypto from 'crypto';
import { prisma } from './prisma';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret;
};

function base64UrlEncode(str: string | Buffer): string {
  const base64 = typeof str === 'string' ? Buffer.from(str).toString('base64') : str.toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface WorkerTokenPayload {
  workerId: string;
  phone: string;
  email?: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Signs a cryptographic JWT token for Admin sessions (default 7 days expiry)
 */
export function signAdminToken(
  payload: Omit<AdminTokenPayload, 'iat' | 'exp'>,
  expiresInSeconds = 7 * 24 * 60 * 60
): string {
  const secret = getJwtSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AdminTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${data}.${encodedSignature}`;
}

/**
 * Cryptographically verifies an Admin JWT token using timing-safe comparison
 */
export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const secret = getJwtSecret();

    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest();
    const expectedEncodedSig = base64UrlEncode(expectedSig);

    const bufExpected = Buffer.from(expectedEncodedSig);
    const bufReceived = Buffer.from(encodedSignature);

    if (bufExpected.length !== bufReceived.length || !crypto.timingSafeEqual(bufExpected, bufReceived)) {
      return null;
    }

    const payload: AdminTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the admin session from Authorization header or cookie
 */
export async function getAdminFromRequest(req: Request): Promise<AdminTokenPayload | null> {
  try {
    let token = '';

    // 1. Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Cookie: visasra_admin_token
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/visasra_admin_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1].trim());
      }
    }

    if (!token) return null;

    const payload = verifyAdminToken(token);
    if (!payload || !payload.adminId) return null;

    // Verify admin still exists in PostgreSQL database
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, email: true, role: true },
    });

    if (!admin) return null;

    return {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };
  } catch {
    return null;
  }
}

/**
 * Signs a cryptographic JWT token for Worker sessions (default 30 days expiry)
 */
export function signWorkerToken(
  payload: Omit<WorkerTokenPayload, 'iat' | 'exp'>,
  expiresInSeconds = 30 * 24 * 60 * 60
): string {
  const secret = getJwtSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: WorkerTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${data}.${encodedSignature}`;
}

/**
 * Cryptographically verifies a Worker JWT token using timing-safe comparison
 */
export function verifyWorkerToken(token: string): WorkerTokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const secret = getJwtSecret();

    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest();
    const expectedEncodedSig = base64UrlEncode(expectedSig);

    const bufExpected = Buffer.from(expectedEncodedSig);
    const bufReceived = Buffer.from(encodedSignature);

    if (bufExpected.length !== bufReceived.length || !crypto.timingSafeEqual(bufExpected, bufReceived)) {
      return null;
    }

    const payload: WorkerTokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies worker session from Authorization header or cookie
 */
export async function getWorkerFromRequest(req: Request): Promise<WorkerTokenPayload | null> {
  try {
    let token = '';

    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/visasra_worker_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1].trim());
      }
    }

    if (!token) return null;

    const payload = verifyWorkerToken(token);
    if (!payload || !payload.workerId) return null;

    // Verify worker exists in database
    const worker = await prisma.worker.findUnique({
      where: { id: payload.workerId },
      select: { id: true, phone: true, email: true },
    });

    if (!worker) return null;

    return {
      workerId: worker.id,
      phone: worker.phone,
      email: worker.email,
    };
  } catch {
    return null;
  }
}
