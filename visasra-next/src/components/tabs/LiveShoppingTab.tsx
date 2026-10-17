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
  const approvedItemsCount = liveSessionData?.products?.reduce(
    (acc, p) => acc + (p.options?.filter(o => o.status === 'approved').length || 0),
    0
  ) || 0;

  const approvedItemsTotal = liveSessionData?.products?.reduce(
    (acc, p) => acc + (p.options?.filter(o => o.status === 'approved').reduce((s, o) => s + o.price, 0) || 0),
    0
  ) || 2440;

  return (
    <section className="screen active" data-screen="live-shopping">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button className="back-row" onClick={onBackToOrders} aria-label="Back" style={{ margin: 0, fontWeight: 700, fontSize: 13.5 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to Orders
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="live-pulsing-badge">
            <span className="live-pulsing-dot" />
            LIVE IN-STORE CONCIERGE ACTIVE
          </span>
          {orders.length > 0 && (
            <select
              className="inp"
              style={{ padding: '7px 14px', fontSize: 13, height: 'auto', width: 'auto', background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: 10, fontWeight: 600, color: '#071D3A' }}
              value={liveSessionSlot || (orders[0]?.slotKey || '')}
              onChange={e => setLiveSessionSlot(e.target.value)}
            >
              {orders.map(o => (
                <option key={o.slotKey} value={o.slotKey}>{o.orderNumber} ({o.slotLabel || o.slotKey})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Concierge Live Header */}
      <div className="shopper-banner-hero" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="shopper-avatar-ring">
            <span style={{ fontSize: 17, fontWeight: 800, color: '#BAE6FD', letterSpacing: 0.5 }}>
              {(liveSessionData?.shopper?.name || 'Personal Concierge').split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 19, fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.2px' }}>
                {liveSessionData?.shopper?.name || 'Personal Shopper'}
              </h2>
              <span className="shopper-rating-badge">
                ★ {liveSessionData?.shopper?.rating || '4.9'} · Verified Concierge
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              In-Store Curations &amp; Suggestions
            </h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', background: '#F1F5F9', padding: '3px 10px', borderRadius: 999 }}>
              {liveSessionData?.products?.length || 0} Item(s) in Scope
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
            <div style={{ display: 'grid', gap: 16 }}>
              {liveSessionData.products.map((item, itemIdx) => (
                <div key={item.itemId || itemIdx} className="live-item-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0A3A6B', textTransform: 'uppercase', letterSpacing: 0.6, background: '#EFF6FF', display: 'inline-block', padding: '2px 8px', borderRadius: 6, marginBottom: 4 }}>
                        Sourced Item #{itemIdx + 1}
                      </div>
                      <h4 style={{ margin: '2px 0 0', fontSize: 18, color: 'var(--text)', fontWeight: 800 }}>{item.name}</h4>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Quantity: <b>{item.qty}</b></div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0A3A6B', marginTop: 3 }}>
                        Target Budget: ₹{item.estMin} – ₹{item.estMax}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A3A6B" strokeWidth="2.5">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Shopper Recommendations ({item.options?.length || 0})
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>Verified genuine in-store options</span>
                    </div>

                    {item.options && item.options.length > 0 ? (
                      <div style={{ display: 'grid', gap: 14 }}>
                        {item.options.map((opt, optIdx) => (
                          <div
                            key={opt.id}
                            className={`live-suggestion-card ${opt.status === 'approved' ? 'approved' : opt.status === 'rejected' ? 'rejected' : 'pending'}`}
                          >
                            <div className="live-sugg-content-row" style={{ display: 'flex', gap: 16 }}>
                              <div className="live-sugg-img-wrapper">
                                <img
                                  src={opt.image || '/images/categories/jewellery-accessories.jpg'}
                                  alt=""
                                  className="live-sugg-img"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/categories/jewellery-accessories.jpg';
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Suggestion #{optIdx + 1}
                                  </span>
                                  <span className={`live-tag-${opt.status}`}>
                                    {opt.status === 'approved' ? '✓ Approved & Reserved' : opt.status === 'rejected' ? '✕ Alternative Requested' : '⏳ Awaiting Your Approval'}
                                  </span>
                                </div>
                                <div className="live-sugg-price" style={{ flexWrap: 'wrap' }}>
                                  ₹{opt.price.toLocaleString('en-IN')}
                                  <span className="live-sugg-price-usd">(~${Math.round(opt.price / 83)} USD)</span>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 4, wordBreak: 'break-word' }}>
                                  {opt.description || 'Verified authentic item option selected in-store by shopper.'}
                                </div>
                              </div>
                            </div>

                            {opt.status === 'pending' && (
                              <div className="live-sugg-actions" style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                                <button
                                  type="button"
                                  className="btn-live-approve"
                                  style={user.walletBalance < opt.price * (item.qty || 1) ? {
                                    background: 'linear-gradient(135deg, #D97706, #B45309)',
                                    boxShadow: '0 6px 16px rgba(180, 83, 9, 0.35)',
                                  } : {}}
                                  onClick={() => onApproveOption(item.itemId, opt.id, item, opt)}
                                >
                                  {user.walletBalance < opt.price * (item.qty || 1)
                                    ? `⚡ Top-Up ₹${(opt.price * (item.qty || 1) - user.walletBalance).toLocaleString('en-IN')} & Approve`
                                    : `✓ Approve Option (₹${opt.price.toLocaleString('en-IN')})`}
                                </button>
                                <button
                                  type="button"
                                  className="btn-live-reject"
                                  onClick={() => onRejectOption(item.itemId, opt.id)}
                                >
                                  ✕ Request Alternative
                                </button>
                              </div>
                            )}

                            {opt.status === 'approved' && (
                              <div className="live-approved-banner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                  <span>Reserved for billing! Shopper will include authentic GST store invoice.</span>
                                </div>
                                <button type="button" className="btn-live-undo" onClick={() => onRejectOption(item.itemId, opt.id)}>
                                  Change Decision
                                </button>
                              </div>
                            )}

                            {opt.status === 'rejected' && (
                              <div className="live-rejected-banner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                  <span>Alternative requested. Shopper is inspecting other designs.</span>
                                </div>
                                <button type="button" className="btn-live-undo" onClick={() => onApproveOption(item.itemId, opt.id, item, opt)}>
                                  Re-evaluate
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 22, textAlign: 'center', border: '1.5px dashed #CBD5E1' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                          Shopper is selecting options in the market...
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                          Photos and prices from the store will appear here as items are found.
                        </div>
                      </div>
                    )}
                  </div>
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
              <div className="live-tally-row">
                <span>International QC &amp; Vault</span>
                <span style={{ color: 'var(--text-dim)' }}>Complimentary</span>
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
              100% Escrow Protected · Authentic Store Bills
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
