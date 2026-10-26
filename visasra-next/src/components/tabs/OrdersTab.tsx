import React from 'react';
import { Order } from '@/types/customer';

interface OrdersTabProps {
  orders: Order[];
  onBack: () => void;
  onJoinLiveShopping: (slotKey: string) => void;
  onTrackOrder: (slotKey: string) => void;
  onRateShopper?: (order: Order) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  onBack,
  onJoinLiveShopping,
  onTrackOrder,
  onRateShopper,
}) => {
  return (
    <section className="screen active" data-screen="orders">
      <img className="corner-leaf" src="/images/decor/leaf-cluster.png" alt="" aria-hidden="true" />
      <button className="back-row" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back
      </button>
      <div className="page-title">Orders</div>
      <div className="page-sub">Everything you've booked with us.</div>

      <div id="ordersList" style={{ marginTop: 16 }}>
        {orders.length === 0 ? (
          <div className="card pad" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No Active Orders Yet</div>
            <p style={{ margin: 0, fontSize: 13 }}>Browse categories or book a shopping slot to reserve your personal concierge in India.</p>
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
                  <div className="status-pill">{o.trackingStage.replace(/_/g, ' ')}</div>
                  {o.orderType === 'online' && (
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#EDE9FE', color: '#6D28D9' }}>
                      Online Concierge (Admin Procurement)
                    </span>
                  )}
                  {o.trackingNumber && (
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                      ✈️ {o.carrier || 'Express'}: {o.trackingNumber}
                    </span>
                  )}
                </div>

                {o.orderType !== 'online' && (o.trackingStage === 'shopping' || o.trackingStage === 'worker_assigned' || o.status === 'shopping') && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#ECFDF5',
                    border: '1.2px solid #10B981',
                    borderRadius: 8,
                    padding: '6px 10px',
                    marginTop: 10,
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#065F46'
                  }}>
                    <span className="live-pulsing-dot" style={{ width: 7, height: 7 }} />
                    <span>🟢 Personal Shopper Active in Market Right Now</span>
                  </div>
                )}

                <div className="booking-actions-row" style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  {o.orderType !== 'online' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary live-track-btn"
                      style={{
                        flex: '1 1 130px',
                        minWidth: 110,
                        justifyContent: 'center',
                        ...((o.trackingStage === 'shopping' || o.status === 'shopping') ? {
                          background: 'linear-gradient(135deg, #059669, #047857)',
                          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                          border: 'none',
                        } : {})
                      }}
                      onClick={() => onJoinLiveShopping(o.slotKey)}
                    >
                      {(o.trackingStage === 'shopping' || o.status === 'shopping') ? '● Join Live Shopping' : 'Live Shopping'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="track-btn"
                    style={{
                      flex: '1 1 130px',
                      minWidth: 110,
                      margin: 0,
                      justifyContent: 'center',
                      ...(o.orderType === 'online' ? { background: 'var(--navy)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8 } : {})
                    }}
                    onClick={() => onTrackOrder(o.slotKey)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="18" r="2.5" />
                      <circle cx="18" cy="6" r="2.5" />
                      <path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
                    </svg>
                    <span>{o.orderType === 'online' ? 'Track Procurement' : 'Track order'}</span>
                  </button>

                  {o.liveSession?.worker && onRateShopper && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        flex: '1 1 110px',
                        minWidth: 100,
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FCD34D',
                        fontWeight: 700,
                        borderRadius: 8,
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                      onClick={() => onRateShopper(o)}
                    >
                      ⭐ Rate Shopper
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
