import React, { useState } from 'react';
import { User, WalletTransaction } from '@/types/customer';

interface WalletTabProps {
  user: User;
  walletTransactions: WalletTransaction[];
  onAddMoney: (amount: number) => void;
  onBack: () => void;
  showToast: (msg: string) => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({
  user,
  walletTransactions,
  onAddMoney,
  onBack,
  showToast,
}) => {
  const [selectedQuickAmt, setSelectedQuickAmt] = useState<number | null>(5000);
  const [customTopupAmt, setCustomTopupAmt] = useState<string>('5000');
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [copiedTxId, setCopiedTxId] = useState(false);

  // Helper to parse clean title and references from technical raw notes
  const parseTx = (tx: WalletTransaction) => {
    let title = tx.type === 'credit' ? 'Wallet Top-up' : 'Slot Booking Fee';
    let category: 'topup' | 'purchase' | 'refund' | 'booking' = tx.type === 'credit' ? 'topup' : 'booking';
    let paymentId: string | null = tx.razorpayPaymentId || null;
    let orderId: string | null = null;

    const raw = tx.note || '';

    // Extract pay_ ID if inside note
    const payMatch = raw.match(/pay_[a-zA-Z0-9]+/);
    if (payMatch) paymentId = payMatch[0];

    // Extract order_ ID if inside note
    const ordMatch = raw.match(/order_[a-zA-Z0-9]+/);
    if (ordMatch) orderId = ordMatch[0];

    if (tx.type === 'credit') {
      if (raw.toLowerCase().includes('refund')) {
        title = 'Order Refund';
        category = 'refund';
      } else if (raw.toLowerCase().includes('reward') || raw.toLowerCase().includes('credit')) {
        title = 'Credit Balance Added';
        category = 'topup';
      } else {
        title = 'Wallet Top-up';
        category = 'topup';
      }
    } else {
      if (raw.toLowerCase().includes('booking') || raw.toLowerCase().includes('slot')) {
        title = 'Shopping Slot Booking';
        category = 'booking';
      } else if (raw.toLowerCase().includes('purchase') || raw.toLowerCase().includes('item')) {
        title = raw.replace(/·.*$/, '').replace(/Pay:.*$/, '').trim() || 'Store Purchase';
        category = 'purchase';
      } else {
        title = raw.replace(/·.*$/, '').replace(/Pay:.*$/, '').trim() || 'Shopping Debit';
        category = 'purchase';
      }
    }

    return { title, category, paymentId, orderId };
  };

  const handleCopy = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedTxId(true);
      showToast('Reference copied to clipboard');
      setTimeout(() => setCopiedTxId(false), 2000);
    } catch {
      showToast(text);
    }
  };

  return (
    <section className="screen active" data-screen="wallet">
      <button className="back-row" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back
      </button>
      <div className="page-title"><span className="visasra-name">Visasra</span> Money</div>
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

      {/* Compact Top-Up Box */}
      <div className="wallet-topup-card">
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Add Money to Wallet</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
          Funds stay in your balance and are only utilized when you approve actual store receipts during live shopping.
        </div>

        <div className="wallet-quick-chips">
          {[1000, 2500, 5000, 10000].map(amt => (
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
              onChange={e => {
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

      {/* Transaction Activity Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#071D3A' }}>Transaction Activity</div>
        {walletTransactions.length > 0 && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
            {walletTransactions.length} transaction{walletTransactions.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {/* Zomato-Style Clean White Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {walletTransactions.length > 0 ? (
          walletTransactions.map(tx => {
            const { title, category } = parseTx(tx);
            const isCredit = tx.type === 'credit';
            const txDate = new Date(tx.date);
            const formattedDate = txDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1.5px solid #E2E8F0',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Left: Icon & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: isCredit ? '#ECFDF5' : category === 'refund' ? '#FAF5FF' : '#FFFBEB',
                      border: `1.5px solid ${isCredit ? '#A7F3D0' : category === 'refund' ? '#E9D8FD' : '#FDE68A'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isCredit ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <circle cx="12" cy="12" r="2" />
                        <path d="M6 12h.01M18 12h.01" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {formattedDate}
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: isCredit ? '#16A34A' : '#0F172A' }}>
                    {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center', background: '#FFFFFF', borderRadius: 14, border: '1.5px dashed #CBD5E1', color: '#64748B', fontSize: 13 }}>
            No wallet transactions yet. Top up using Razorpay to start live sourcing!
          </div>
        )}
      </div>

      {/* Zomato-Style Transaction Details Modal (Pure White Theme) */}
      {selectedTx && (() => {
        const { title, category, paymentId, orderId } = parseTx(selectedTx);
        const isCredit = selectedTx.type === 'credit';
        const txDate = new Date(selectedTx.date);
        const formattedDate = txDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(7, 30, 61, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 16,
            }}
            onClick={() => setSelectedTx(null)}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 24,
                maxWidth: 420,
                width: '100%',
                padding: '28px 22px 24px 22px',
                boxShadow: '0 24px 50px rgba(7, 30, 61, 0.25)',
                textAlign: 'center',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: '#F1F5F9',
                  border: 'none',
                  fontSize: 16,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>

              {/* Big Circular Icon */}
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: isCredit ? '#ECFDF5' : category === 'refund' ? '#FAF5FF' : '#FFFBEB',
                  border: `2px solid ${isCredit ? '#A7F3D0' : category === 'refund' ? '#E9D8FD' : '#FDE68A'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                {isCredit ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                )}
              </div>

              {/* Amount Display */}
              <div style={{ fontSize: 30, fontWeight: 800, color: '#071D3A', letterSpacing: '-0.02em' }}>
                ₹{Number(selectedTx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isCredit ? '#16A34A' : '#475569', marginTop: 4, marginBottom: 20 }}>
                {title} Successful
              </div>

              {/* Transaction Receipt Details Card */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 16,
                  border: '1.5px solid #E2E8F0',
                  padding: '16px 18px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Date and Time</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{formattedDate}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Transaction Type</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                    {isCredit ? 'Visasra Money Deposit' : 'Visasra Money Debit'}
                  </span>
                </div>

                {paymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Payment Reference</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0B4F9C',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Click to copy"
                    >
                      <span>{paymentId.length > 20 ? `${paymentId.slice(0, 10)}...${paymentId.slice(-6)}` : paymentId}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </div>
                )}

                {orderId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Order ID</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{orderId}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Status</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 6 }}>
                    Successful ✓
                  </span>
                </div>
              </div>

              {/* Support / Issue Link */}
              <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 14 }}>
                Have an issue?{' '}
                <a
                  href="mailto:visasratechnologies@gmail.com"
                  style={{ color: '#0B4F9C', fontWeight: 700, textDecoration: 'none' }}
                >
                  Chat with us
                </a>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
