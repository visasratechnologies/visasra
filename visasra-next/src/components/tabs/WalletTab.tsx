'use client';

import React, { useState } from 'react';
import { User } from '@/types';

interface WalletTransactionItem {
  id: string;
  type: string;
  amount: number;
  note?: string;
  date: string;
}

interface WalletTabProps {
  user: User;
  walletTransactions: WalletTransactionItem[];
  onAddMoney: (amount: number) => Promise<void>;
  onBack: () => void;
  showToast: (msg: string) => void;
}

export default function WalletTab({
  user,
  walletTransactions,
  onAddMoney,
  onBack,
  showToast,
}: WalletTabProps) {
  const [selectedQuickAmt, setSelectedQuickAmt] = useState<number | null>(null);
  const [customTopupAmt, setCustomTopupAmt] = useState('');

  return (
    <section className="screen active" data-screen="wallet">
      <button className="back-row" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back
      </button>
      <div className="page-title">Visasra Money</div>
      <div className="page-sub">Your personal shopping wallet balance and complete transaction history.</div>

      <div className="wallet-card" style={{ marginTop: 14 }}>
        <div>
          <div className="label">Available balance</div>
          <div className="amount money">₹{user.walletBalance.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#9FC0E6', fontWeight: 600 }}>Zero hold fees</div>
          <div style={{ fontSize: 12, color: '#EAF3FF', fontWeight: 700, marginTop: 2 }}>Instant live billing</div>
        </div>
      </div>

      {/* Top-Up Box */}
      <div className="wallet-topup-card">
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Add Money to Wallet</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
          Funds stay in your balance and are only utilized when you approve actual store receipts during live shopping.
        </div>

        <div className="wallet-quick-chips">
          {[1000, 2500, 5000, 10000].map((amt) => (
            <button
              key={amt}
              type="button"
              className={`wallet-quick-chip ${selectedQuickAmt === amt ? 'active' : ''}`}
              onClick={() => {
                setSelectedQuickAmt(amt);
                setCustomTopupAmt(String(amt));
              }}
            >
              +₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        <div className="wallet-input-row">
          <div className="wallet-currency-box">
            <span>₹</span>
            <input
              type="number"
              min="100"
              step="100"
              placeholder="Enter amount"
              value={customTopupAmt}
              onChange={(e) => {
                setCustomTopupAmt(e.target.value);
                setSelectedQuickAmt(null);
              }}
            />
          </div>
          <button
            type="button"
            className="wallet-action-btn"
            onClick={() => {
              const num = Number(customTopupAmt);
              if (!num || num <= 0) {
                showToast('Please enter an amount greater than 0');
                return;
              }
              onAddMoney(num);
            }}
          >
            + Add to Wallet
          </button>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>Transaction Activity</div>
      <div className="review-card" style={{ marginTop: 0 }}>
        {walletTransactions.length > 0 ? (
          walletTransactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-soft)',
              }}
            >
              <div>
                <b style={{ fontSize: 13.5 }}>
                  {tx.note || (tx.type === 'credit' ? 'Wallet Deposit via Razorpay' : 'Slot Booking Fee')}
                </b>
                <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>
                  {new Date(tx.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <b style={{ color: tx.type === 'credit' ? '#2F7D4A' : '#DC2626', fontSize: 14 }}>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
              </b>
            </div>
          ))
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            No wallet transactions yet. Top up using Razorpay to start live sourcing!
          </div>
        )}
      </div>
    </section>
  );
}
