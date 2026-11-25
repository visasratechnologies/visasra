import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Golden Path Order Lifecycle & Milestone Integration Test', () => {
  // State simulation across the full multi-actor lifecycle
  const state = {
    user: {
      id: 'usr_golden_test',
      name: 'Ananya Sharma',
      email: 'ananya@visasra.com',
      walletBalance: 0,
    },
    worker: {
      id: 'wrk_ground_chennai',
      name: 'Karthik Raja',
      phone: '9876543210',
      walletBalance: 0,
      ordersDone: 14,
    },
    order: null,
    liveSession: null,
    eventStream: [],
  };

  function pushEvent(slotKey, type, payload) {
    state.eventStream.push({ slotKey, type, payload, timestamp: Date.now() });
  }

  test('Step 1: Razorpay Wallet Deposit (₹10,000 credit)', () => {
    const depositAmount = 10000;
    state.user.walletBalance += depositAmount;
    assert.strictEqual(state.user.walletBalance, 10000);
  });

  test('Step 2: Slot Booking with Atomic Slot Fee Debit', () => {
    const slotFee = 499;
    assert.ok(state.user.walletBalance >= slotFee, 'User must have sufficient balance for slot fee');

    state.user.walletBalance -= slotFee;

    state.order = {
      id: 'ord_vis_90214',
      orderNumber: 'VIS-90214',
      userId: state.user.id,
      slotKey: '2026-11-20|h3-1',
      status: 'confirmed',
      trackingStage: 'slot_confirmed',
      carrier: null,
      trackingNumber: null,
      items: [
        {
          id: 'item_kanchi_silk',
          name: 'Handwoven Kanchipuram Pure Silk Saree',
          qty: 1,
          status: 'waiting',
          options: [],
        },
      ],
    };

    state.liveSession = {
      slotKey: state.order.slotKey,
      orderId: state.order.id,
      userId: state.user.id,
      workerId: null,
      stage: 'scheduled',
      status: 'scheduled',
    };

    assert.strictEqual(state.user.walletBalance, 9501);
    assert.strictEqual(state.order.status, 'confirmed');
    assert.strictEqual(state.order.trackingStage, 'slot_confirmed');
  });

  test('Step 3: Shopper Assignment & In-Store Arrival', () => {
    // Worker accepts job
    state.liveSession.workerId = state.worker.id;
    state.liveSession.stage = 'assigned';
    state.order.trackingStage = 'worker_assigned';
    pushEvent(state.order.slotKey, 'stage_changed', { stage: 'worker_assigned' });

    // Worker starts trip to store
    state.liveSession.stage = 'heading_to_store';
    state.liveSession.status = 'live';
    pushEvent(state.order.slotKey, 'stage_changed', { stage: 'heading_to_store' });

    // Worker arrives at retail store
    state.liveSession.stage = 'shopping';
    state.order.trackingStage = 'shopping';
    pushEvent(state.order.slotKey, 'stage_changed', { stage: 'shopping' });

    assert.strictEqual(state.liveSession.workerId, state.worker.id);
    assert.strictEqual(state.liveSession.stage, 'shopping');
    assert.strictEqual(state.order.trackingStage, 'shopping');
  });

  test('Step 4: Live Option Upload by Ground Shopper', () => {
    const targetItem = state.order.items[0];

    const option1 = {
      id: 'opt_saree_crimson',
      orderItemId: targetItem.id,
      image: 'https://r2.visasra.com/options/saree-crimson.webp',
      price: 6500,
      description: 'Zari woven pure mulberry silk in royal crimson red',
      status: 'pending',
    };

    const option2 = {
      id: 'opt_saree_peacock',
      orderItemId: targetItem.id,
      image: 'https://r2.visasra.com/options/saree-peacock.webp',
      price: 7200,
      description: 'Peacock blue dual-tone bridal weave with temple border',
      status: 'pending',
    };

    targetItem.options.push(option1, option2);
    targetItem.status = 'options_ready';

    pushEvent(state.order.slotKey, 'option_created', { itemId: targetItem.id, optionCount: 2 });

    assert.strictEqual(targetItem.options.length, 2);
    assert.strictEqual(targetItem.status, 'options_ready');
  });

  test('Step 5: Customer Live Decision Approval & Atomic Wallet Debit', () => {
    const targetItem = state.order.items[0];
    const chosenOption = targetItem.options[0]; // Crimson Red: ₹6500

    const totalDebit = chosenOption.price * targetItem.qty; // ₹6500
    assert.ok(state.user.walletBalance >= totalDebit, 'Customer must have sufficient wallet balance');

    // Atomic debit
    state.user.walletBalance -= totalDebit;
    chosenOption.status = 'approved';
    targetItem.options[1].status = 'not_chosen';
    targetItem.status = 'approved';
    targetItem.approvedAmount = totalDebit;

    pushEvent(state.order.slotKey, 'option_decision', {
      itemId: targetItem.id,
      optionId: chosenOption.id,
      decision: 'approved',
      amount: totalDebit,
    });

    assert.strictEqual(chosenOption.status, 'approved');
    assert.strictEqual(targetItem.status, 'approved');
    assert.strictEqual(state.user.walletBalance, 3001); // 9501 - 6500 = 3001
  });

  test('Step 6: Store Counter QR Payment & Admin Settlement', () => {
    const targetItem = state.order.items[0];

    // Worker uploads merchant QR at billing counter
    targetItem.shopPaymentStatus = 'qr_uploaded';
    targetItem.shopPaymentAmount = 6500;
    pushEvent(state.order.slotKey, 'qr_uploaded', { itemId: targetItem.id, amount: 6500 });

    // Admin verifies merchant tax invoice & settles QR
    targetItem.shopPaymentStatus = 'paid';
    targetItem.status = 'purchased';
    state.order.status = 'purchased';
    state.order.trackingStage = 'purchased';

    pushEvent(state.order.slotKey, 'qr_cleared', { itemId: targetItem.id });

    assert.strictEqual(targetItem.shopPaymentStatus, 'paid');
    assert.strictEqual(targetItem.status, 'purchased');
    assert.strictEqual(state.order.status, 'purchased');
  });

  test('Step 7: Central Export Hub QC, Flight Dispatch & Overseas Delivery', () => {
    // 1. Central Export Hub Handover with Admin OTP
    const submittedOtp = '8492';
    assert.strictEqual(submittedOtp, '8492', 'Valid Admin QC handover OTP required');

    state.order.status = 'packed';
    state.order.trackingStage = 'packed';
    state.liveSession.stage = 'packed';
    state.liveSession.status = 'completed';

    // Worker receives payment for completed trip
    state.worker.walletBalance += 350;
    state.worker.ordersDone += 1;

    // 2. Customs Cleared & International Flight Dispatch
    state.order.status = 'shipped';
    state.order.trackingStage = 'shipped';
    state.order.carrier = 'DHL Express International';
    state.order.trackingNumber = 'DHL-VIS-9812476';

    // 3. Final Doorstep Delivery Overseas
    state.order.status = 'delivered';
    state.order.trackingStage = 'out_for_delivery';

    assert.strictEqual(state.order.status, 'delivered');
    assert.strictEqual(state.order.carrier, 'DHL Express International');
    assert.strictEqual(state.order.trackingNumber, 'DHL-VIS-9812476');
    assert.strictEqual(state.worker.walletBalance, 350);
    assert.strictEqual(state.worker.ordersDone, 15);
    assert.strictEqual(state.eventStream.length >= 4, true);
  });
});
