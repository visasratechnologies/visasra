'use client';

import React, { useState } from 'react';
import { WorkerProfile, LiveSession } from '@/types/worker';

interface WorkerEarnTabProps {
  worker: WorkerProfile | null;
  sessions: LiveSession[];
  onExecAction: (data: Record<string, unknown>) => Promise<unknown> | unknown;
  showToast: (msg: string) => void;
  phaseOf: (s: LiveSession) => string;
}

export const WorkerEarnTab: React.FC<WorkerEarnTabProps> = ({
  worker,
  sessions,
  onExecAction,
  showToast,
  phaseOf,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPayoutMethod = Boolean(worker?.payoutUpi || worker?.bankAccountNumber);
  const payoutDestination = worker?.payoutUpi
    ? `UPI: ${worker.payoutUpi}`
    : worker?.bankAccountNumber
    ? `${worker.bankName || 'Bank'} · A/C Ending •••• ${worker.bankAccountNumber.slice(-4)}`
    : 'No Account Configured';

  const completedSessions = sessions.filter(
    (s) => phaseOf(s) === 'done' || s.stage === 'packed' || s.status === 'completed'
  );

  const handleWithdraw = async (amount: number, label: string) => {
    if (!hasPayoutMethod) {
      showToast('Please add your Payout UPI or Bank details in Profile first');
      return;
    }
    if (amount <= 0) {
      showToast('No balance available for payout');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onExecAction({ action: 'request_payout', payoutAmount: amount });
      if (res) {
        showToast(`${label} of ₹${amount.toLocaleString('en-IN')} requested!`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="screen active" style={{ paddingBottom: '90px' }}>
      <div className="body" style={{ maxWidth: '480px', margin: '0 auto', padding: '14px 16px' }}>
        
        {/* ========================================================= */}
        {/* 1. EXECUTIVE WALLET & BALANCE HERO CARD                   */}
        {/* ========================================================= */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #071F48 0%, #0A2F6B 55%, #10428E 100%)',
            color: '#FFFFFF',
            borderRadius: 18,
            padding: '22px 20px',
            boxShadow: '0 10px 25px rgba(7, 31, 72, 0.25)',
            marginBottom: 14,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top Label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Available Payout Balance
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: 10.5,
                fontWeight: 700,
                color: '#E0F2FE',
              }}
            >
              Direct Deposit
            </span>
          </div>

          {/* Large Balance Display */}
          <div style={{ fontSize: 36, fontWeight: 800, color: '#FFFFFF', margin: '6px 0 8px', letterSpacing: '-0.02em' }}>
            ₹{(worker?.walletBalance || 0).toLocaleString('en-IN')}
          </div>

          {/* Destination info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#CBD5E1', marginBottom: 16 }}>
            <span>Account:</span>
            <b style={{ color: hasPayoutMethod ? '#86EFAC' : '#FCA5A5' }}>{payoutDestination}</b>
          </div>

          {/* Instant Withdrawal Action */}
          <button
            type="button"
            disabled={isSubmitting || (worker?.walletBalance || 0) <= 0 || !hasPayoutMethod}
            onClick={() => handleWithdraw(worker?.walletBalance || 0, 'Instant Payout')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              background: (worker?.walletBalance || 0) > 0 ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              cursor: (worker?.walletBalance || 0) > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: (worker?.walletBalance || 0) > 0 ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
              transition: 'background 0.15s ease',
            }}
          >
            <img src="/images/icons/earnings.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
            <span>
              {isSubmitting
                ? 'Processing...'
                : (worker?.walletBalance || 0) > 0
                ? `Request Instant Payout (₹${(worker?.walletBalance || 0).toLocaleString('en-IN')})`
                : 'No Unsettled Balance'}
            </span>
          </button>
        </div>

        {/* Warning if no payout account is configured */}
        {!hasPayoutMethod && (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <img src="/images/icons/kyc.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
            <div style={{ fontSize: 12, color: '#92400E' }}>
              <b>Payout Account Missing:</b> Go to your Profile tab to set up your UPI ID or Bank Account so the team can disburse your earnings.
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SUMMARY METRICS ROW                                    */}
        {/* ========================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Payout Schedule</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#092B55', marginTop: 2 }}>Every Wednesday</div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 1 }}>Direct Bank / UPI Deposit</div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Partner Base Rate</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#092B55', marginTop: 2 }}>₹350 per Slot</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>+ Bonus on multi-store runs</div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. COMPLETED TRIPS & EARNINGS TIMELINE                    */}
        {/* ========================================================= */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#092B55', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Completed Trips &amp; Credits ({completedSessions.length})
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {completedSessions.length > 0 ? (
            completedSessions.map((s) => (
              <div
                key={s.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#092B55' }}>
                    Personal Shopping Slot Completed
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                    {s.storeName || 'Local Market'} &bull; Order #{s.order?.orderNumber || s.slotKey}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    Customer: {s.user?.name || 'Verified Customer'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#16A34A' }}>
                    +₹350.00
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#166534',
                      background: '#DCFCE7',
                      padding: '2px 6px',
                      borderRadius: 4,
                      marginTop: 2,
                    }}
                  >
                    Credited
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                padding: '32px 20px',
                textAlign: 'center',
                border: '1px solid #E2E8F0',
              }}
            >
              <img
                src="/images/icons/slot.png"
                alt=""
                style={{ width: 36, height: 36, objectFit: 'contain', margin: '0 auto 12px', opacity: 0.7 }}
              />
              <div style={{ fontSize: 14, fontWeight: 800, color: '#092B55' }}>No Completed Trips Yet</div>
              <div style={{ fontSize: 12, color: '#64748B', maxWidth: 320, margin: '6px auto 0', lineHeight: 1.5 }}>
                When you accept shopping slots in Chennai and complete the handover at our hub, each +₹350 payout will appear here in real time.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
