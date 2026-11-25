import React from 'react';

export interface InsufficientBalanceState {
  itemId: string;
  optId?: string;
  optionId?: string;
  itemName: string;
  itemImage?: string;
  price?: number;
  qty: number;
  requiredAmount: number;
  currentBalance: number;
  shortfall: number;
}

interface InsufficientBalanceModalProps {
  modalData: InsufficientBalanceState | null;
  onClose: () => void;
  onTopupAndApprove: (amount: number) => void;
}

export const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  modalData,
  onClose,
  onTopupAndApprove,
}) => {
  if (!modalData) return null;

  return (
    <div className="topup-guard-overlay" onClick={onClose}>
      <div className="topup-guard-card" onClick={e => e.stopPropagation()}>
        <div className="topup-guard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Visasra Money Top-Up</h3>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2 }}>Secure deposit via Razorpay to approve item</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="topup-guard-body">
          <div className="topup-item-summary">
            <img
              src={modalData.itemImage || '/images/placeholders/placeholder-item.svg'}
              alt=""
              style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {modalData.itemName}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Quantity: {modalData.qty} · In-Store Verified Option
              </div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 800, color: '#0F172A', fontSize: 15 }}>
              ₹{modalData.requiredAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="topup-balance-breakdown">
            <div className="topup-breakdown-row">
              <span>Item Total Price</span>
              <span>₹{modalData.requiredAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="topup-breakdown-row">
              <span>Current Visasra Money Balance</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>₹{modalData.currentBalance.toLocaleString('en-IN')}</span>
            </div>
            <div className="topup-breakdown-row shortfall">
              <span>Shortfall to Deposit</span>
              <span>₹{modalData.shortfall.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            type="button"
            className="topup-action-btn"
            onClick={() => onTopupAndApprove(modalData.shortfall)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>Deposit ₹{modalData.shortfall.toLocaleString('en-IN')} &amp; Approve</span>
          </button>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {[1000, 2000, 5000].map(extra => (
              <button
                key={extra}
                type="button"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer'
                }}
                onClick={() => onTopupAndApprove(modalData.shortfall + extra)}
              >
                +₹{extra} buffer
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11.5, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>256-bit Encrypted via Razorpay · Unused balance 100% refundable</span>
          </div>
        </div>
      </div>
    </div>
  );
};
