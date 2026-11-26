import React from 'react';
import { Order, User, LiveSessionDetails, LiveProductItem, LiveOption, CustomerTab } from '@/types/customer';

interface LiveShoppingTabProps {
  orders: Order[];
  liveSessionSlot: string | null;
  setLiveSessionSlot: (slot: string) => void;
  liveSessionData: LiveSessionDetails | null;
  liveSessionLoading: boolean;
  user: User;
  onBackToOrders: () => void;
  onNavigate: (tab: CustomerTab) => void;
  onApproveOption: (itemId: string, optId: string, item: LiveProductItem, opt: LiveOption) => void;
  onRejectOption: (itemId: string, optId: string) => void;
  showToast: (msg: string) => void;
}

export const LiveShoppingTab: React.FC<LiveShoppingTabProps> = ({
  orders,
  liveSessionSlot,
  setLiveSessionSlot,
  liveSessionData,
  liveSessionLoading,
  user,
  onBackToOrders,
  onNavigate,
  onApproveOption,
  onRejectOption,
  showToast,
}) => {
  const [lightboxImg, setLightboxImg] = React.useState<{ src: string; title: string; price?: number } | null>(null);

  const approvedItemsCount = liveSessionData?.products?.reduce(
    (acc, p) => acc + (p.options?.filter(o => o.status === 'approved').length || 0),
    0
  ) || 0;

  const approvedItemsTotal = liveSessionData?.products?.reduce(
    (acc, p) => acc + (p.options?.filter(o => o.status === 'approved').reduce((s, o) => s + o.price, 0) || 0),
    0
  ) || 0;

  return (
    <section className="screen active" data-screen="live-shopping">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button className="back-row" onClick={onBackToOrders} aria-label="Back" style={{ margin: 0, fontWeight: 700, fontSize: 13.5 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to Orders
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="live-pulsing-badge">
            <span className="live-pulsing-dot" />
            LIVE IN-STORE SHOPPER ACTIVE
          </span>
          {(() => {
            const activeLiveOrders = orders.filter(
              (o) => o.trackingStage === 'shopping' || o.trackingStage === 'worker_assigned' || o.status === 'shopping'
            );
            const currentOrder = orders.find((o) => o.slotKey === liveSessionSlot) || activeLiveOrders[0] || orders[0];

            if (activeLiveOrders.length > 1) {
              return (
                <select
                  className="inp"
                  style={{ padding: '6px 12px', fontSize: 12.5, height: 'auto', width: 'auto', background: '#fff', border: '1.2px solid #CBD5E1', borderRadius: 8, fontWeight: 700, color: '#071D3A' }}
                  value={liveSessionSlot || activeLiveOrders[0]?.slotKey}
                  onChange={e => setLiveSessionSlot(e.target.value)}
                >
                  {activeLiveOrders.map(o => (
                    <option key={o.slotKey} value={o.slotKey}>{o.orderNumber} ({o.slotLabel || 'Live Shopping'})</option>
                  ))}
                </select>
              );
            }

            if (currentOrder) {
              return (
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#071D3A', background: '#FFFFFF', border: '1.2px solid #E2E8F0', padding: '5px 12px', borderRadius: 8 }}>
                  {currentOrder.orderNumber} · {currentOrder.slotLabel || 'Live Sourcing'}
                </span>
              );
            }

            return null;
          })()}
        </div>
      </div>

      {/* Concierge Live Header */}
      <div className="shopper-banner-hero" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="shopper-avatar-ring">
            <span style={{ fontSize: 17, fontWeight: 800, color: '#BAE6FD', letterSpacing: 0.5 }}>
              {(liveSessionData?.shopper?.name || 'Personal Shopper').split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 19, fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.2px' }}>
                {liveSessionData?.shopper?.name || 'Personal Shopper'}
              </h2>
              <span className="shopper-rating-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span>{liveSessionData?.shopper?.rating || '4.9'} · Verified Personal Shopper</span>
              </span>
            </div>
            <div style={{ color: '#BAE6FD', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {liveSessionData?.store?.name ? `At ${liveSessionData.store.name}` : 'In-store at local markets across India'}
            </div>
          </div>
        </div>

        <div className="sbh-concierge-panel">
          <div className="sbh-live-indicator">
            <span className="sbh-live-beacon" />
            Live in Store
          </div>
        </div>
      </div>

      {/* 2-Column Live Session Workspace */}
      <div className="live-layout-2col">
        {/* Column 1: Items & Suggestions */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontFamily: 'var(--font-display, serif)', color: '#071D3A', fontWeight: 800 }}>
              Items to approve
            </h3>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              {liveSessionData?.products?.length || 0} item{(liveSessionData?.products?.length || 0) === 1 ? '' : 's'} · nothing is bought until you approve
            </span>
          </div>

          {liveSessionLoading && !liveSessionData ? (
            <div className="card pad" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                Connecting with Ground Shopper at Store Floor...
              </div>
              <p style={{ margin: 0, fontSize: 13 }}>Syncing live recommendations, real-time tags, and high-res store photos.</p>
            </div>
          ) : liveSessionData?.products && liveSessionData.products.length > 0 ? (
            <div className="approval-items-wrap">
              {liveSessionData.products.map((item, itemIdx) => (
                <div key={item.itemId || itemIdx} className="approval-item-outer-card">
                  {/* Outer Item Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: 0.5, background: '#EFF6FF', padding: '3px 9px', borderRadius: 6 }}>
                        Item {itemIdx + 1}
                      </span>
                      <h4 style={{ margin: 0, fontSize: 17, color: '#071D3A', fontWeight: 800 }}>{item.name}</h4>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0A3A6B' }}>
                        Budget ₹{item.estMin} to ₹{item.estMax}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#64748B', margin: '8px 0 14px' }}>
                    Shopper is sharing live options from store counters:
                  </div>

                  {/* Side-by-Side Options Comparison Grid */}
                  {item.options && item.options.length > 0 ? (
                    <div className="approval-options-grid">
                      {item.options.map((opt, optIdx) => {
                        const isApproved = opt.status === 'approved';
                        const isRejected = opt.status === 'rejected';
                        const isPending = opt.status === 'pending';
                        const optionLabel = optIdx === 0
                          ? 'Option A · Shopper pick'
                          : optIdx === 1
                          ? 'Option B · Alternative'
                          : `Option ${String.fromCharCode(65 + optIdx)}`;

                        return (
                          <div
                            key={opt.id}
                            className={`approval-option-card ${isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'}`}
                          >
                            {/* Option Photo with Zoom/Lightbox Action */}
                            <div
                              style={{
                                height: 180,
                                borderRadius: 10,
                                overflow: 'hidden',
                                position: 'relative',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                border: '1px solid #E2E8F0',
                              }}
                              onClick={() => setLightboxImg({
                                src: opt.image || '/images/placeholders/placeholder-item.svg',
                                title: opt.description || `${item.name} · ${optionLabel}`,
                                price: opt.price,
                              })}
                              title="Click to view full image in detail"
                            >
                              <img
                                src={opt.image || '/images/placeholders/placeholder-item.svg'}
                                alt={opt.description || `${item.name} · ${optionLabel}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: 8,
                                  right: 8,
                                  background: 'rgba(7, 29, 58, 0.85)',
                                  backdropFilter: 'blur(4px)',
                                  color: '#FFFFFF',
                                  borderRadius: 6,
                                  padding: '3px 8px',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                                <span>View photo</span>
                              </div>
                            </div>

                            {/* Option Details */}
                            <div style={{ marginTop: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#071D3A' }}>
                                  {optionLabel}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    background: isApproved ? '#DCFCE7' : isRejected ? '#F1F5F9' : '#DCFCE7',
                                    color: isApproved ? '#15803D' : isRejected ? '#64748B' : '#15803D',
                                  }}
                                >
                                  {isApproved ? 'Approved' : isRejected ? 'Declined' : 'Photo verified'}
                                </span>
                              </div>

                              <div style={{ fontSize: 19, fontWeight: 800, color: '#071D3A', margin: '6px 0 2px' }}>
                                ₹{opt.price.toLocaleString('en-IN')}
                              </div>

                              <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.45, marginBottom: 14, flex: 1 }}>
                                {opt.description || 'Verified authentic piece selected in-store by personal shopper.'}
                              </div>

                              {/* Action Buttons */}
                              {isPending && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => onApproveOption(item.itemId, opt.id, item, opt)}
                                      style={{
                                        flex: 1,
                                        background: '#0B4F9C',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '10px 16px',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        whiteSpace: 'nowrap',
                                        transition: 'background 0.15s ease',
                                      }}
                                    >
                                      <span>Approve</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setLightboxImg({
                                        src: opt.image || '/images/placeholders/placeholder-item.svg',
                                        title: opt.description || `${item.name} · ${optionLabel}`,
                                        price: opt.price,
                                      })}
                                      style={{
                                        flex: 1,
                                        background: '#FFFFFF',
                                        color: '#071D3A',
                                        border: '1.2px solid #CBD5E1',
                                        borderRadius: 8,
                                        padding: '10px 16px',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <span>View photos</span>
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => onRejectOption(item.itemId, opt.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#64748B',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      padding: '4px 0',
                                      textAlign: 'center',
                                      marginTop: 2,
                                    }}
                                  >
                                    Request alternative design →
                                  </button>
                                </div>
                              )}

                              {isApproved && (
                                <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8, padding: '10px 12px', marginTop: 'auto' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 6 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span>Approved &amp; Reserved</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onRejectOption(item.itemId, opt.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#166534',
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      textDecoration: 'underline',
                                      padding: 0,
                                    }}
                                  >
                                    Change decision
                                  </button>
                                </div>
                              )}

                              {isRejected && (
                                <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 12px', marginTop: 'auto' }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
                                    Alternative requested
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onApproveOption(item.itemId, opt.id, item, opt)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#0B4F9C',
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      padding: 0,
                                    }}
                                  >
                                    Re-evaluate this option
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 22, textAlign: 'center', border: '1.5px dashed #CBD5E1' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                        Shopper is selecting options in the market...
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        Photos and prices from the store will appear here as items are found.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card pad" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              No items found for this slot session.
            </div>
          )}
        </div>

        {/* Column 2: Running Tally, Verification & Checkout */}
        <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <div className="live-tally-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="live-tally-title">Session Running Tally</div>
              <span className="live-status-badge">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284C7' }}></span>
                Live Sync
              </span>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <div className="live-tally-row">
                <span>Slot Deposit Credit</span>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>-₹199</span>
              </div>
              <div className="live-tally-row">
                <span>Approved Items ({approvedItemsCount})</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  ₹{approvedItemsTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="live-tally-row">
                <span>Official GST Store Bills</span>
                <span style={{ color: '#16A34A', fontWeight: 600 }}>Included (Verified)</span>
              </div>
              <div className="live-tally-divider" />
              <div className="live-tally-total">
                <span>Total Payable at Checkout</span>
                <span style={{ color: '#0A3A6B' }}>₹{Math.max(0, approvedItemsTotal - 199).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ marginTop: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Wallet Balance: <b style={{ color: '#071D3A' }}>₹{user.walletBalance.toLocaleString('en-IN')}</b></span>
              <button type="button" className="btn btn-sm btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onNavigate('wallet')}>+ Top Up</button>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 16, justifyContent: 'center', padding: '12px 18px', fontSize: 14, fontWeight: 800 }}
              onClick={() => {
                onNavigate('cart');
                showToast('Approved items transferred to checkout cart');
              }}
            >
              Proceed to Secure Checkout →
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 11.5, color: 'var(--text-dim)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              100% Protected · Authentic Store Bills
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      {lightboxImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 10, 20, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setLightboxImg(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: 760,
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#071D3A',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                background: '#0A254A',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                {lightboxImg.title}
              </div>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'grid',
                  placeItems: 'center',
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div
              style={{
                width: '100%',
                flex: 1,
                maxHeight: 'calc(92vh - 120px)',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#030A14',
                padding: 16,
              }}
            >
              <img
                src={lightboxImg.src}
                alt={lightboxImg.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '74vh',
                  objectFit: 'contain',
                  borderRadius: 10,
                }}
              />
            </div>

            {lightboxImg.price && (
              <div
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: '#0A254A',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#94A3B8', fontSize: 13 }}>Verified In-Store Sample</span>
                <span style={{ color: '#60A5FA', fontSize: 18, fontWeight: 800 }}>₹{lightboxImg.price.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
