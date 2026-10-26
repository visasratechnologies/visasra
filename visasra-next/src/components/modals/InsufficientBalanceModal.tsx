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
            <span style={{ fontSize: 20 }}>💳</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Visasra Money Top-Up Needed</h3>
              <div style={{ fontSize: 12, color: '#BAE6FD', marginTop: 2 }}>Instant deposit via Razorpay to approve item</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: 4 }}
          >
            ✕
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
            <span>⚡ Pay ₹{modalData.shortfall.toLocaleString('en-IN')} via Razorpay &amp; Approve</span>
          </button>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {[1000, 2000, 5000].map(extra => (
              <button
                key={extra}
                type="button"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
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

          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11.5, color: '#64748B' }}>
            🔒 Bank-grade 256-bit SSL Escrow · Unused balance is 100% refundable instantly
          </div>
        </div>
      </div>
    </div>
  );
};
