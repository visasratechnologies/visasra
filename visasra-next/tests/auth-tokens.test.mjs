import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('Authentication & Access Control Test Suite', () => {
  const JWT_SECRET = 'visasra_secure_jwt_test_secret_38928174';

  function base64UrlEncode(str) {
    const base64 = typeof str === 'string' ? Buffer.from(str).toString('base64') : str.toString('base64');
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  function signJwt(payload, secret, expiresInSeconds = 3600) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    const message = `${encodedHeader}.${encodedPayload}`;

    const signature = base64UrlEncode(
      crypto.createHmac('sha256', secret).update(message).digest()
    );

    return `${message}.${signature}`;
  }

  function verifyJwt(token, secret) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const expectedSignature = base64UrlEncode(
      crypto.createHmac('sha256', secret).update(message).digest()
    );

    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    try {
      const payload = JSON.parse(base64UrlDecode(payloadB64));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }
      return payload;
    } catch {
      return null;
    }
  }

  describe('Task 2.1: Admin JWT Token Signing and Verification', () => {
    const adminPayload = { adminId: 'adm_123', email: 'admin@visasra.com', role: 'superadmin' };

    test('Valid admin token decodes authentic payload', () => {
      const token = signJwt(adminPayload, JWT_SECRET, 3600);
      const verified = verifyJwt(token, JWT_SECRET);
      assert.ok(verified, 'Verified payload must exist');
      assert.strictEqual(verified.adminId, 'adm_123');
      assert.strictEqual(verified.email, 'admin@visasra.com');
      assert.strictEqual(verified.role, 'superadmin');
    });

    test('Tampered admin payload fails signature verification', () => {
      const token = signJwt(adminPayload, JWT_SECRET, 3600);
      const [h, p, s] = token.split('.');
      const alteredPayload = JSON.parse(base64UrlDecode(p));
      alteredPayload.adminId = 'adm_HACKER';
      const alteredToken = `${h}.${base64UrlEncode(JSON.stringify(alteredPayload))}.${s}`;

      const verified = verifyJwt(alteredToken, JWT_SECRET);
      assert.strictEqual(verified, null, 'Tampered token must return null');
    });

    test('Token signed with wrong secret fails verification', () => {
      const token = signJwt(adminPayload, 'wrong_secret', 3600);
      const verified = verifyJwt(token, JWT_SECRET);
      assert.strictEqual(verified, null, 'Token with wrong key must fail');
    });

    test('Expired token returns null', () => {
      const token = signJwt(adminPayload, JWT_SECRET, -10); // Expired 10s ago
      const verified = verifyJwt(token, JWT_SECRET);
      assert.strictEqual(verified, null, 'Expired token must fail');
    });
  });

  describe('Task 2.2: Worker Session Token Signing and Verification', () => {
    const workerPayload = { workerId: 'wrk_999', phone: '9876543210' };

    test('Valid worker token decodes authentic payload', () => {
      const token = signJwt(workerPayload, JWT_SECRET, 86400);
      const verified = verifyJwt(token, JWT_SECRET);
      assert.ok(verified);
      assert.strictEqual(verified.workerId, 'wrk_999');
      assert.strictEqual(verified.phone, '9876543210');
    });

    test('Malformed bearer token returns null', () => {
      assert.strictEqual(verifyJwt('malformed.token', JWT_SECRET), null);
      assert.strictEqual(verifyJwt('', JWT_SECRET), null);
      assert.strictEqual(verifyJwt(null, JWT_SECRET), null);
    });
  });

  describe('Task 2.3: Worker PII Masking & Privacy Compliance', () => {
    function maskAadhaar(num) {
      if (!num) return null;
      const digits = num.replace(/\D/g, '');
      return `XXXX-XXXX-${digits.slice(-4)}`;
    }

    function maskPan(pan) {
      if (!pan) return null;
      return `XXXXX${pan.trim().slice(-4)}`;
    }

    function maskBankAccount(acc) {
      if (!acc) return null;
      const digits = acc.replace(/\D/g, '');
      return `XXXXXXXX${digits.slice(-4)}`;
    }

    test('Aadhaar number is masked with only last 4 digits visible', () => {
      assert.strictEqual(maskAadhaar('1234 5678 9012'), 'XXXX-XXXX-9012');
      assert.strictEqual(maskAadhaar('987654321098'), 'XXXX-XXXX-1098');
    });

    test('PAN card is masked with only last 4 characters visible', () => {
      assert.strictEqual(maskPan('ABCDE1234F'), 'XXXXX234F');
    });

    test('Bank account number is masked with only last 4 digits visible', () => {
      assert.strictEqual(maskBankAccount('98765432101234'), 'XXXXXXXX1234');
    });

    test('Null PII inputs safely return null without throwing', () => {
      assert.strictEqual(maskAadhaar(null), null);
      assert.strictEqual(maskPan(null), null);
      assert.strictEqual(maskBankAccount(null), null);
    });
  });
});
