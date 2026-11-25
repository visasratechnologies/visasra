import React from 'react';
import { Order } from '@/types/customer';

interface OrdersTabProps {
  orders: Order[];
  onBack: () => void;
  onJoinLiveShopping: (slotKey: string) => void;
  onTrackOrder: (slotKey: string) => void;
  onRateShopper?: (order: Order) => void;
  onRefresh?: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  onBack,
  onJoinLiveShopping,
  onTrackOrder,
  onRateShopper,
  onRefresh,
}) => {
  return (
    <section className="screen active screen-orders-root" data-screen="orders">
      <img className="corner-leaf" src="/images/decor/visasra-corner-flourish.png?v=1" alt="" aria-hidden="true" />
      <div className="orders-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button className="back-row" onClick={onBack} aria-label="Back" style={{ margin: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Back
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="btn btn-sm"
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px',
                background: '#F1F5F9',
                color: '#0A2540',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              ↻ Refresh
            </button>
          )}
        </div>
        <div className="page-title">Orders</div>
        <div className="page-sub">Everything you've booked with us.</div>

        <div id="ordersList" style={{ marginTop: 16 }}>
        {orders.length === 0 ? (
          <div className="card pad" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No Active Orders Yet</div>
            <p style={{ margin: 0, fontSize: 13, marginBottom: 14 }}>Browse categories or book a shopping slot to reserve your personal shopper in India.</p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8 }}
              >
                Refresh Orders
              </button>
            )}
          </div>
        ) : (
          orders.map(o => (
            <div key={o.id} className="booking-card">
              <div className="booking-strip"><span style={{ background: 'var(--gold)' }} /></div>
              <div className="booking-main">
                <div className="booking-top">
                  <div className="booking-top-left">
                    <img
                      src={o.items[0]?.image || '/images/placeholders/placeholder-item.svg'}
                      alt=""
                      style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                      }}
                    />
                    <div>
                      <div className="booking-id">{o.orderNumber}</div>
                      <div className="booking-slot">{o.slotLabel || o.slotKey}</div>
                      <div className="booking-items">{o.items.map(i => i.name).join(', ')}</div>
                      <div className="booking-meta">{o.items.length} product(s)</div>
                    </div>
                  </div>
                  <div className="booking-total">₹{o.totalAmount}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="order-status-badge">
                    <span className="osb-dot" />
                    {o.trackingStage.replace(/_/g, ' ')}
                  </span>
                  {o.orderType === 'online' && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF' }}>
                      Online Concierge
                    </span>
                  )}
                  {o.trackingNumber && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                      ✈️ {o.carrier || 'Express'}: {o.trackingNumber}
                    </span>
                  )}
                </div>

                {o.orderType !== 'online' && (o.trackingStage === 'shopping' || o.trackingStage === 'worker_assigned' || o.status === 'shopping') && (
                  <div className="order-live-market-pill">
                    <span className="radar-live-dot">
                      <span className="radar-live-ping" />
                      <span className="radar-live-core" />
                    </span>
                    <span className="order-live-market-text">Personal Shopper Active in Market</span>
                  </div>
                )}

                <div className="booking-actions-row">
                  {o.orderType !== 'online' && (
                    <button
                      type="button"
                      className={`order-btn-live ${(o.trackingStage === 'shopping' || o.status === 'shopping') ? 'active-pulse' : ''}`}
                      onClick={() => onJoinLiveShopping(o.slotKey)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                        <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                      </svg>
                      <span>Join Live Shopping</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="order-btn-track"
                    onClick={() => onTrackOrder(o.slotKey)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="18" r="2.5" />
                      <circle cx="18" cy="6" r="2.5" />
                      <path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
                    </svg>
                    <span>{o.orderType === 'online' ? 'Track Procurement' : 'Track Order'}</span>
                  </button>

                  {o.liveSession?.worker && onRateShopper && (
                    <button
                      type="button"
                      className="order-btn-rate"
                      onClick={() => onRateShopper(o)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>Rate Shopper</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </section>
  );
};
