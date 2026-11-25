import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('Financial Security & Integrity Test Suite', () => {
  const MOCK_RAZORPAY_SECRET = 'test_secret_visasra_prod_key_9281';

  function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
    if (!orderId || !paymentId || !signature || !secret) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }

  describe('Task 1.1: Razorpay HMAC-SHA256 Signature Verification', () => {
    const validOrderId = 'order_OXYZ1234567890';
    const validPaymentId = 'pay_PXYZ1234567890';
    const validSignature = crypto
      .createHmac('sha256', MOCK_RAZORPAY_SECRET)
      .update(`${validOrderId}|${validPaymentId}`)
      .digest('hex');

    test('Valid signature matches and passes verification', () => {
      const isValid = verifyRazorpaySignature(validOrderId, validPaymentId, validSignature, MOCK_RAZORPAY_SECRET);
      assert.strictEqual(isValid, true, 'Cryptographically valid signature must pass');
    });

    test('Tampered signature is rejected', () => {
      const tampered = validSignature.slice(0, -4) + 'abcd';
      const isValid = verifyRazorpaySignature(validOrderId, validPaymentId, tampered, MOCK_RAZORPAY_SECRET);
      assert.strictEqual(isValid, false, 'Tampered signature must be rejected');
    });

    test('Tampered order ID is rejected', () => {
      const isValid = verifyRazorpaySignature('order_HACKED', validPaymentId, validSignature, MOCK_RAZORPAY_SECRET);
      assert.strictEqual(isValid, false, 'Mismatched order ID must be rejected');
    });

    test('Tampered payment ID is rejected', () => {
      const isValid = verifyRazorpaySignature(validOrderId, 'pay_HACKED', validSignature, MOCK_RAZORPAY_SECRET);
      assert.strictEqual(isValid, false, 'Mismatched payment ID must be rejected');
    });

    test('Invalid secret key is rejected', () => {
      const isValid = verifyRazorpaySignature(validOrderId, validPaymentId, validSignature, 'wrong_secret');
      assert.strictEqual(isValid, false, 'Verification with wrong secret must fail');
    });
  });

  describe('Task 1.2: Replay Attack Detection', () => {
    const ledger = new Set();

    function processTopup(paymentId, amount) {
      if (ledger.has(paymentId)) {
        return { success: false, status: 409, error: 'Replay attack prevented: Payment ID already credited' };
      }
      ledger.add(paymentId);
      return { success: true, credited: amount };
    }

    test('First deposit with new payment ID succeeds', () => {
      const result = processTopup('pay_FIRST_001', 5000);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.credited, 5000);
    });

    test('Second deposit replay with same payment ID is blocked with 409 Conflict', () => {
      const replay = processTopup('pay_FIRST_001', 5000);
      assert.strictEqual(replay.success, false);
      assert.strictEqual(replay.status, 409);
      assert.match(replay.error, /already credited/i);
    });
  });

  describe('Task 1.3: Live Option Approval Atomic Debit Guard', () => {
    function simulateOptionApproval(userWallet, optionPrice, itemQty, currentOptionStatus) {
      if (currentOptionStatus === 'approved') {
        return { success: true, idempotent: true, debited: 0, newBalance: userWallet };
      }

      const totalAmount = optionPrice * itemQty;
      if (userWallet < totalAmount) {
        return { success: false, error: 'INSUFFICIENT_FUNDS', required: totalAmount, current: userWallet };
      }

      const newBalance = userWallet - totalAmount;
      return { success: true, debited: totalAmount, newBalance };
    }

    test('Sufficient balance debits exact total amount (price * qty)', () => {
      const wallet = 10000;
      const price = 2500;
      const qty = 2;
      const res = simulateOptionApproval(wallet, price, qty, 'pending');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.debited, 5000);
      assert.strictEqual(res.newBalance, 5000);
    });

    test('Insufficient balance is blocked with INSUFFICIENT_FUNDS', () => {
      const wallet = 3000;
      const price = 2500;
      const qty = 2; // Total: 5000
      const res = simulateOptionApproval(wallet, price, qty, 'pending');
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.error, 'INSUFFICIENT_FUNDS');
      assert.strictEqual(res.required, 5000);
    });

    test('Idempotent double-approval does not re-debit wallet', () => {
      const wallet = 5000;
      const price = 2500;
      const qty = 1;
      const res = simulateOptionApproval(wallet, price, qty, 'approved');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.idempotent, true);
      assert.strictEqual(res.debited, 0);
      assert.strictEqual(res.newBalance, 5000);
    });
  });

  describe('Task 1.4: Live Option Rejection & Wallet Refund Integrity', () => {
    function simulateOptionRejection(userWallet, optionStatus, approvedAmount, isAlreadyPurchased) {
      if (isAlreadyPurchased) {
        return { success: false, error: 'Cannot undo decision: Item already purchased at store counter' };
      }

      const wasApproved = optionStatus === 'approved';
      const refundAmount = wasApproved ? approvedAmount : 0;
      const newBalance = userWallet + refundAmount;

      return { success: true, refunded: refundAmount, newBalance };
    }

    test('Rejecting previously approved option refunds exact amount to wallet', () => {
      const initialWallet = 2500;
      const approvedAmount = 3500;
      const res = simulateOptionRejection(initialWallet, 'approved', approvedAmount, false);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.refunded, 3500);
      assert.strictEqual(res.newBalance, 6000);
    });

    test('Rejecting pending unapproved option grants 0 refund', () => {
      const initialWallet = 2500;
      const res = simulateOptionRejection(initialWallet, 'pending', 3500, false);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.refunded, 0);
      assert.strictEqual(res.newBalance, 2500);
    });

    test('Rejecting option after item is billed at store counter is blocked', () => {
      const res = simulateOptionRejection(5000, 'approved', 3500, true);
      assert.strictEqual(res.success, false);
      assert.match(res.error, /already purchased/i);
    });
  });

  describe('Task 1.5: Worker Payout Decrement Validation', () => {
    function simulateWorkerPayout(workerBalance, requestedPayout) {
      const amount = Number(requestedPayout);
      if (isNaN(amount) || amount <= 0) {
        return { success: false, error: 'Valid payout amount greater than 0 required' };
      }
      if (workerBalance < amount) {
        return { success: false, error: 'Insufficient worker balance' };
      }
      return { success: true, payout: amount, remaining: workerBalance - amount };
    }

    test('Valid withdrawal decrements worker balance correctly', () => {
      const res = simulateWorkerPayout(2500, 1000);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.payout, 1000);
      assert.strictEqual(res.remaining, 1500);
    });

    test('Withdrawal exceeding current balance is blocked', () => {
      const res = simulateWorkerPayout(800, 1500);
      assert.strictEqual(res.success, false);
      assert.match(res.error, /insufficient/i);
    });

    test('Zero or negative withdrawal is rejected', () => {
      const resZero = simulateWorkerPayout(1000, 0);
      assert.strictEqual(resZero.success, false);
      const resNeg = simulateWorkerPayout(1000, -500);
      assert.strictEqual(resNeg.success, false);
    });
  });
});
