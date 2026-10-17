import React from 'react';
import { Order, CustomerTab } from '@/types/customer';

interface OrderPlacedModalProps {
  order: Order | null;
  onClose: () => void;
  onNavigate: (tab: CustomerTab) => void;
  onJoinLiveShopping: (slotKey: string) => void;
}

export const OrderPlacedModal: React.FC<OrderPlacedModalProps> = ({
  order,
  onClose,
  onNavigate,
  onJoinLiveShopping,
}) => {
  if (!order) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 29, 58, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '28px 24px',
          maxWidth: 460,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 60px -15px rgba(7, 29, 58, 0.35)',
          border: '1.5px solid rgba(226, 232, 240, 0.9)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top decorative gradient bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #10B981, #059669, #0284C7)',
          }}
        />

        {/* Success Icon */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 12px 28px -6px rgba(16, 185, 129, 0.45)',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', color: '#047857', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
          <span>●</span> Order Confirmed &amp; Verified
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#0B192E',
            margin: '4px 0 6px',
            fontFamily: 'var(--font-display)',
          }}
        >
          Order Placed Successfully! 🎉
        </h2>

        <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 18px', lineHeight: 1.5 }}>
          Your shopping slot is confirmed. A verified personal shopper on the ground in India will source your items with authentic GST bills.
        </p>

        {/* Order snapshot card */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1.2px solid #E2E8F0',
            borderRadius: 16,
            padding: '16px 18px',
            textAlign: 'left',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Order Reference</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0B192E', marginTop: 1 }}>{order.orderNumber}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Held in Escrow</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0284C7', marginTop: 1 }}>₹{order.totalAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Slot Timing:</span>
              <b style={{ color: '#0F172A' }}>{order.slotLabel || order.slotKey}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Items Booked:</span>
              <b style={{ color: '#0F172A' }}>{order.items?.length || 1} product(s)</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Personal Shopper:</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>Assigned &amp; Ready</span>
            </div>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#047857' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14, flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Official GST store bills &amp; live video photo inspection guaranteed</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: 14.5,
              fontWeight: 800,
              borderRadius: 12,
              justifyContent: 'center',
            }}
            onClick={() => {
              onClose();
              onNavigate('orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            View in Orders List →
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {order.orderType !== 'online' && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: '11px',
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 12,
                  justifyContent: 'center',
                  background: '#F0FDF4',
                  color: '#166534',
                  borderColor: '#86EFAC',
                }}
                onClick={() => {
                  onJoinLiveShopping(order.slotKey);
                  onClose();
                  onNavigate('live-shopping');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Join Live Shopping
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                flex: 1,
                padding: '11px',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 12,
                justifyContent: 'center',
                color: '#64748B',
              }}
              onClick={() => {
                onClose();
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
