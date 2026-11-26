'use client';

import React from 'react';
import type { CartItem, CustomerTab } from '@/types/customer';
import { resolveItemImage } from '@/lib/placeholders';

interface CartTabProps {
  cart: CartItem[];
  onRemoveItem: (id: string) => void;
  onNavigate: (tab: CustomerTab) => void;
  onBack?: () => void;
}

export function CartTab({ cart, onRemoveItem, onNavigate, onBack }: CartTabProps) {
  const totalMin = cart.reduce((acc, item) => acc + (item.priceMin || 0) * (item.qty || 1), 0);
  const totalMax = cart.reduce((acc, item) => acc + (item.priceMax || item.priceMin || 0) * (item.qty || 1), 0);

  return (
    <section className="screen active" data-screen="cart" style={{ maxWidth: 1160, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header & Back Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          className="back-row"
          onClick={() => (onBack ? onBack() : onNavigate('home'))}
          aria-label="Back"
          style={{ margin: 0, fontWeight: 700, fontSize: 13.5 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>

        {cart.length > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => onNavigate('categories')}
            style={{ fontSize: 13, fontWeight: 700, color: '#0B4F9C', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>+ Add More Items</span>
          </button>
        )}
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className="page-title" style={{ margin: 0 }}>Shopping Cart</h1>
          {cart.length > 0 && (
            <span style={{ background: '#0A3A6B', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 999 }}>
              {cart.length} item{cart.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="page-sub" style={{ marginTop: 4 }}>
          Items reserved in your active sourcing list. Confirm your slot to dispatch your personal shopper.
        </div>
      </div>

      <div id="cartBody">
        {cart.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
              alignItems: 'start',
            }}
          >
            {/* Left Column: Sourced Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cart.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 16,
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={resolveItemImage(item.image, item.sourceType)}
                      alt={item.name}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        objectFit: 'cover',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                      }}
                    />
                    {item.images && item.images.length > 1 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: -4,
                          right: -4,
                          background: '#0B4F9C',
                          color: '#fff',
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 6,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        }}
                      >
                        +{item.images.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Item Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: item.sourceType === 'online' ? '#ECFDF5' : item.sourceType === 'mind' ? '#F5F3FF' : '#EFF6FF',
                          color: item.sourceType === 'online' ? '#047857' : item.sourceType === 'mind' ? '#6D28D9' : '#1D4ED8',
                        }}
                      >
                        {item.sourceType === 'online' ? 'Online Store' : item.sourceType === 'mind' ? 'Customized Item' : (item.categoryName || 'Catalog Item')}
                      </span>
                      {item.qty > 1 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                          Qty: {item.qty}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 800, color: '#071D3A', lineHeight: 1.35, marginBottom: 4 }}>
                      {item.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0B4F9C' }}>
                        ₹{(item.priceMin * item.qty).toLocaleString('en-IN')} – ₹{(item.priceMax * item.qty).toLocaleString('en-IN')}
                      </span>
                      {item.qty > 1 && (
                        <span style={{ fontSize: 11.5, color: '#64748B' }}>
                          (₹{item.priceMin.toLocaleString('en-IN')} – ₹{item.priceMax.toLocaleString('en-IN')} each)
                        </span>
                      )}
                    </div>

                    {/* Reference Photos Preview */}
                    {item.images && item.images.length > 1 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {item.images.slice(0, 4).map((pic, pIdx) => (
                          <img
                            key={pIdx}
                            src={pic}
                            alt={`Ref ${pIdx + 1}`}
                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    style={{
                      background: 'transparent',
                      border: '1px solid #F1F5F9',
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      display: 'grid',
                      placeItems: 'center',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#EF4444';
                      e.currentTarget.style.borderColor = '#FCA5A5';
                      e.currentTarget.style.background = '#FEF2F2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94A3B8';
                      e.currentTarget.style.borderColor = '#F1F5F9';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary Card */}
            <div
              style={{
                position: 'sticky',
                top: 24,
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 18,
                padding: '22px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: '#071D3A', marginBottom: 14 }}>
                Sourcing Order Summary
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#475569', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Total Items:</span>
                  <b style={{ color: '#071D3A' }}>{cart.length} item{cart.length > 1 ? 's' : ''}</b>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Est. Merchandise Budget:</span>
                  <b style={{ color: '#0B4F9C', fontSize: 14 }}>
                    ₹{totalMin.toLocaleString('en-IN')} – ₹{totalMax.toLocaleString('en-IN')}
                  </b>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Dedicated Personal Shopper:</span>
                  <span style={{ color: '#16A34A', fontWeight: 700 }}>Choose slot in Step 3</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Delivery Fee:</span>
                  <span style={{ color: '#64748B', fontSize: 12 }}>Weighed &amp; calculated after store purchase</span>
                </div>
              </div>

              <div style={{ height: 1, background: '#E2E8F0', margin: '14px 0' }} />

              <button
                type="button"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 12,
                  fontSize: 14.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(11, 79, 156, 0.28)',
                }}
                onClick={() => onNavigate('bookslot')}
              >
                <span>Proceed to Slot Booking</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              {/* Trust Badges */}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11.5, color: '#64748B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                  <span>100% Verified Stores with GST bills</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                  <span>Real-time photo &amp; video approvals</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                  <span>Central export QC inspection &amp; insured transit</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px solid #E2E8F0',
              maxWidth: 520,
              margin: '30px auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                color: '#64748B',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#071D3A', margin: '0 0 6px' }}>Your Cart is Empty</h3>
            <p style={{ color: '#64748B', fontSize: 13.5, margin: '0 0 22px', lineHeight: 1.5 }}>
              Browse through our authentic Indian collections or paste a store link to begin your sourcing run.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700 }}
              onClick={() => onNavigate('categories')}
            >
              Browse Categories
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
