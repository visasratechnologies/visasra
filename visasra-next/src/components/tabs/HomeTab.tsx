'use client';

import React from 'react';
import type { User, CartItem, Order, Category, Product, CustomerTab } from '@/types/customer';

export interface HowItWorksStep {
  step: string;
  t: string;
  d: string;
  tag: string;
  badgeClass: string;
  icon: React.ReactNode;
}

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    step: '01',
    t: 'Request Anything',
    d: 'Choose catalog items, paste online store links, or send photos with your budget.',
    tag: 'Links, Photos & Custom',
    badgeClass: 'hw-step-1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    step: '02',
    t: 'Book Live Shopper',
    d: 'Pick a convenient slot. A verified local shopper visits authentic stores exclusively for you.',
    tag: 'Verified In-Store Pro',
    badgeClass: 'hw-step-2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M16 11l2 2 4-4" />
      </svg>
    ),
  },
  {
    step: '03',
    t: 'Live Photo Approval',
    d: 'Shopper shares in-store photos and original bills. You review and approve before purchase.',
    tag: 'In-Store Photos & Bills',
    badgeClass: 'hw-step-3',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    step: '04',
    t: 'Worldwide Delivery',
    d: 'Consolidated packaging, customs clearance (DDP), and express door-to-door tracking.',
    tag: 'DDP Customs & Tracked',
    badgeClass: 'hw-step-4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="14" height="10" rx="1.5" />
        <path d="M16 10h3l3 3v4h-6z" />
        <circle cx="7" cy="19" r="1.6" />
        <circle cx="18" cy="19" r="1.6" />
      </svg>
    ),
  },
];

interface HomeTabProps {
  user: User;
  cart: CartItem[];
  orders: Order[];
  categories: Category[];
  popularProducts?: Product[];
  addedFeedbackId: string | null;
  onNavigate: (tab: CustomerTab) => void;
  onSelectCategory: (cat: Category) => void;
  onAddToCart: (product: Product) => void;
  onLiveSession: (slotKey: string) => void;
  onTrackOrder: (slotKey: string) => void;
  renderSearchBar: (isMobile: boolean) => React.ReactNode;
}

export function HomeTab({
  user,
  cart,
  orders,
  categories,
  popularProducts,
  addedFeedbackId,
  onNavigate,
  onSelectCategory,
  onAddToCart,
  onLiveSession,
  onTrackOrder,
  renderSearchBar,
}: HomeTabProps) {
  return (
    <section className="screen active" data-screen="home">
      {/* Desktop Header */}
      <div className="desk-header">
        {renderSearchBar(false)}
        <div className="top-actions">
          <button className="icon-pill" onClick={() => onNavigate('wallet')} title="Wallet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/></svg>
          </button>
          <button className="icon-pill" onClick={() => onNavigate('cart')} title="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M6 8h12l-1 12H7L6 8z"/></svg>
            {cart.length > 0 && <span className="icon-badge">{cart.length}</span>}
          </button>
        </div>
      </div>

      {/* Hero Banner Wrap */}
      <div className="hero" id="homeBanner">
        <div className="hero-banner-wrap">
          <img className="hero-banner" src="/images/banner/home-banner.jpg" alt="Charminar, Hyderabad at sunset" />
          <div className="hero-banner-copy">
            <div className="hbc-eyebrow">Authentic Indian products</div>
            <h1 className="hbc-title">Bringing India to the World</h1>
            <p className="hbc-sub">Shop from local stores in India with trusted shoppers.</p>
            <button className="hbc-btn" onClick={() => onNavigate('categories')}>
              Shop Now
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Home Grid (Wallet Rail + Your Bookings) */}
      <div className="home-grid">
        <div className="home-rail">
          <div className="wallet-card" onClick={() => onNavigate('wallet')} style={{ cursor: 'pointer' }}>
            <div>
              <div className="label"><span className="visasra-name">Visasra</span> Money</div>
              <div className="amount money">₹{user.walletBalance.toLocaleString('en-IN')}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); onNavigate('wallet'); }}>
              Add money
            </button>
          </div>
          <p className="wallet-caption">Keep this loaded so a booking never stalls on payment.</p>
        </div>

        <div className="home-main">
          <div className="section-title row">
            <span>Your bookings</span>
            <span className="see-all" onClick={() => onNavigate('orders')}>See all</span>
          </div>

          <div id="homeBookings">
            {orders.filter(o => o && o.id).slice(0, 2).map(o => (
              <div key={o.id} className="booking-card">
                <div className="booking-strip"><span style={{ background: 'var(--gold)' }} /></div>
                <div className="booking-main">
                  <div className="booking-top">
                    <div className="booking-top-left">
                      <img
                        src={o.items?.[0]?.image || '/images/placeholders/placeholder-item.svg'}
                        alt=""
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                        }}
                      />
                      <div>
                        <div className="booking-id">{o.orderNumber || 'Order'}</div>
                        <div className="booking-slot">{o.slotLabel || o.slotKey || 'Scheduled Slot'}</div>
                        <div className="booking-items">{(o.items || []).map(i => i?.name).filter(Boolean).join(', ') || 'Sourcing items'}</div>
                        <div className="booking-meta">{(o.items || []).length} product(s)</div>
                      </div>
                    </div>
                    <div className="booking-total">₹{Number(o.totalAmount || 0)}</div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span className="order-status-badge">
                      <span className="osb-dot" />
                      {(o.trackingStage || 'slot_confirmed').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="booking-actions-row" style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="order-btn-live"
                      onClick={() => onLiveSession(o.slotKey)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                        <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                      </svg>
                      <span>Live Shopping</span>
                    </button>
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
                      <span>Track Order</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="booking-card" style={{ padding: '24px', textAlign: 'center' }}>
                <b>No active shopping orders</b>
                <div style={{ color: 'var(--text-dim)', margin: '4px 0 14px' }}>Upload photos or store links, and we&apos;ll take care of the rest.</div>
                <button className="btn btn-primary" onClick={() => onNavigate('bookslot')}>Upload items to source</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shop By Category */}
      <div className="section-title row">
        <span>Shop by category</span>
        <span className="see-all" onClick={() => onNavigate('categories')}>See all</span>
      </div>
      <div className="cat-grid" id="catGrid">
        {(() => {
          const HOME_FEATURED_SLUGS = ['jewellery-accessories', 'womens-fashion', 'pooja-spiritual', 'cookware', 'home-decors'];
          const featuredList: Category[] = [];
          HOME_FEATURED_SLUGS.forEach(slug => {
            const match = categories.find(c => c.slug === slug);
            if (match) featuredList.push(match);
          });
          categories.forEach(c => {
            if (!featuredList.some(f => f.id === c.id)) featuredList.push(c);
          });
          return featuredList.slice(0, 5);
        })().map(c => (
          <div
            key={c.id}
            className="cat-tile home-cat"
            onClick={() => {
              onSelectCategory(c);
              onNavigate('categories');
            }}
          >
            <img
              src={c.image || '/images/placeholders/placeholder-category.svg'}
              alt={c.name}
              className="cat-tile-bg-img"
              loading="eager"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('placeholder-category.svg')) {
                  target.src = '/images/placeholders/placeholder-category.svg';
                }
              }}
            />
            <div className="cat-tile-body">
              <div className="name">{c.name}</div>
            </div>
          </div>
        ))}
        <div className="cat-tile home-cat see-all-tile" onClick={() => onNavigate('categories')}>
          <div className="cat-tile-body">
            <span className="see-all-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
            <div className="name">See all categories</div>
            <div className="see-all-sub">{categories.length} categories</div>
          </div>
        </div>
      </div>

      {/* 4-Step How Visasra Works */}
      <div className="hw-container-modern">
        <div className="hw-header-wrap">
          <div className="hw-eyebrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            How it works
          </div>
          <div className="hw-heading-row">
            <h2 className="hw-heading">Shop India in 4 simple steps</h2>
            <span className="hw-step-indicator">From your wish to your doorstep</span>
          </div>
        </div>
        <div className="hw-grid-modern" id="howItWorks">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="hw-card-modern">
              <div className="hw-card-top">
                <div className={`hw-card-icon-wrap ${s.badgeClass}`}>
                  {s.icon}
                </div>
                <span className="hw-step-num">{s.step}</span>
              </div>
              <div className="hw-card-content">
                <div className="hw-card-title">{s.t}</div>
                <div className="hw-card-desc">{s.d}</div>
                <div className="hw-card-pill">{s.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Card */}
      <div className="trust-card">
        <div className="tc-eyebrow">Why customers trust <span className="visasra-name">Visasra</span></div>
        <div className="tc-title">Authentic India, delivered to your door.</div>
        <div className="tc-text">Your personal eyes and hands in India — real people sourcing directly from genuine physical stores, so you get the real thing without the plane ticket.</div>
        <div className="tc-points">
          <div className="tc-point">
            <span className="tc-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"/><path d="M9 12l2 2 4-4"/></svg>
            </span>
            <div><b>100% Genuine Stores</b><span>Sourced from verified markets with original receipts.</span></div>
          </div>
          <div className="tc-point">
            <span className="tc-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </span>
            <div><b>Live Photo Approval</b><span>Shopper shares item photos and bills for your approval.</span></div>
          </div>
          <div className="tc-point">
            <span className="tc-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h13v10H3zM16 10h3l2 3v4h-5z"/><circle cx="7.5" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/></svg>
            </span>
            <div><b>Customs-Cleared Delivery</b><span>Express worldwide door-to-door tracking.</span></div>
          </div>
        </div>

        {/* Platform & Merchant Compliance Footer */}
        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #E2E8F0', fontSize: 13, color: '#64748B', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '14px 22px', marginBottom: 12, fontWeight: 600 }}>
            <a href="/terms" style={{ color: '#1B5AA6', textDecoration: 'none' }}>Terms &amp; Wallet Policy</a>
            <a href="/privacy" style={{ color: '#1B5AA6', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/refund-policy" style={{ color: '#1B5AA6', textDecoration: 'none' }}>Cancellation &amp; Refund</a>
            <a href="/shipping-policy" style={{ color: '#1B5AA6', textDecoration: 'none' }}>Shipping &amp; Delivery</a>
            <a href="/customs-policy" style={{ color: '#1B5AA6', textDecoration: 'none' }}>Customs &amp; Duty (DDP)</a>
            <a href="/acceptable-use" style={{ color: '#1B5AA6', textDecoration: 'none' }}>Acceptable Use</a>
            <a href="/contact" style={{ color: '#1B5AA6', textDecoration: 'none' }}>Contact Us</a>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>
            © {new Date().getFullYear()} <b><span className="visasra-name">Visasra</span> Technologies</b>. All rights reserved. · Sourcing &amp; Worldwide Delivery · Secured via <b>Razorpay Gateway</b>
          </div>
        </footer>
      </div>
    </section>
  );
}
