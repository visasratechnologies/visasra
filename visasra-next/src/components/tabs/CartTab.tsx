'use client';

import React from 'react';
import type { CartItem, CustomerTab } from '@/types/customer';
import { resolveItemImage } from '@/lib/placeholders';

interface CartTabProps {
  cart: CartItem[];
  onRemoveItem: (id: string) => void;
  onNavigate: (tab: CustomerTab) => void;
}

export function CartTab({ cart, onRemoveItem, onNavigate }: CartTabProps) {
  return (
    <section className="screen active" data-screen="cart">
      <button className="back-row" onClick={() => onNavigate('home')} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        Back
      </button>
      <div className="page-title">Cart</div>
      <div className="page-sub">A booking in progress, before it's confirmed.</div>

      <div id="cartBody" style={{ marginTop: 16 }}>
        {cart.length > 0 ? (
          <>
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                  <img
                    src={resolveItemImage(item.image, item.sourceType)}
                    alt=""
                    className="thumb"
                    style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                    }}
                  />
                  {item.images && item.images.length > 1 && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '1px 5px', borderRadius: 4 }}>
                      {item.images.slice(0, 4).length} pics
                    </span>
                  )}
                </div>
                <div className="item-body">
                  <div className="item-name">{item.name}</div>
                  <div className="item-sub">₹{item.priceMin.toLocaleString('en-IN')} – ₹{item.priceMax.toLocaleString('en-IN')} each × {item.qty}</div>
                  {item.images && item.images.length > 1 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {item.images.slice(0, 4).map((pic, pIdx) => (
                        <img
                          key={pIdx}
                          src={pic}
                          alt={`Pic ${pIdx + 1}`}
                          style={{ width: 28, height: 28, borderRadius: 5, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="item-actions" style={{ marginTop: 8 }}>
                    <button className="icon-btn" onClick={() => onRemoveItem(item.id)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={() => onNavigate('bookslot')}>
                Proceed to Slot Booking →
              </button>
            </div>
          </>
        ) : (
          <div className="card pad" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <b>Nothing in progress</b>
            <p style={{ color: 'var(--text-dim)', margin: '6px 0 16px' }}>Start a booking and we'll keep it here until you confirm it.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('categories')}>Start a booking</button>
          </div>
        )}
      </div>
    </section>
  );
}
