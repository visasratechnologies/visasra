import React, { useState } from 'react';
import { User, CustomerTab } from '@/types/customer';

interface ProfileTabProps {
  user: User;
  customerPhone: string;
  savedAddressesCount: number;
  onNavigate: (tab: CustomerTab) => void;
  onLogout: () => void;
  onBack: () => void;
  onUpdateUser?: (updated: User) => void;
  showToast?: (msg: string) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  customerPhone,
  savedAddressesCount,
  onNavigate,
  onLogout,
  onBack,
  onUpdateUser,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name || '');
  const [editPhone, setEditPhone] = useState(user.phone || customerPhone || '');
  const [editLocation, setEditLocation] = useState(user.location || '');
  const [isSaving, setIsSaving] = useState(false);

  const initials = (user.name || 'Visasra Customer')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast?.('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: editName.trim(),
          phone: editPhone.trim(),
          location: editLocation.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        showToast?.('Profile updated successfully');
        onUpdateUser?.(data.user);
        setIsEditing(false);
      } else {
        showToast?.(data.error || 'Failed to update profile');
      }
    } catch {
      showToast?.('Network error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="screen active screen-profile-root" data-screen="profile">
      <div className="profile-shell">
        {/* Header with Back button for Mobile */}
        <div className="profile-page-header">
          <button className="profile-back-btn" onClick={onBack} aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            <span>Back</span>
          </button>
          <div className="profile-header-text">
            <h1 className="profile-page-title">My Account</h1>
            <p className="profile-page-subtitle">
              Manage personal profile, sourcing wallet, and delivery addresses.
            </p>
          </div>
          <div className="profile-desktop-status">
            <span className="dot-active"></span>
            Verified Customer
          </div>
        </div>

        {/* Hero Customer Profile Card - 100% Mobile Clean & Responsive */}
        <div className="profile-hero-card">
          {/* Top Row: Avatar + Name & Verified Pill + Edit Button */}
          <div className="profile-hero-top-row">
            <div className="profile-avatar-large">
              {initials || 'V'}
            </div>
            <div className="profile-hero-name-block">
              <h2 className="profile-hero-name">{user.name || 'Visasra Customer'}</h2>
              <span className="profile-verified-badge">✓ Verified Customer</span>
            </div>
            <button
              type="button"
              className="profile-edit-btn"
              onClick={() => {
                setEditName(user.name || '');
                setEditPhone(user.phone || customerPhone || '');
                setEditLocation(user.location || '');
                setIsEditing(true);
              }}
              aria-label="Edit Profile Details"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>

          {/* Details Section: Full width items, clean SVG icons, zero crowding */}
          <div className="profile-hero-details">
            <div className="profile-detail-item">
              <span className="pdi-icon-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <span className="pdi-text" title={user.email}>{user.email}</span>
            </div>

            <div className="profile-detail-item">
              <span className="pdi-icon-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <span className="pdi-text">{user.phone || customerPhone || 'Mobile not set'}</span>
            </div>

            <div className="profile-detail-item">
              <span className="pdi-icon-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </span>
              <span className="pdi-text">{user.location || 'Delivery Destination: Not set'}</span>
            </div>
          </div>
        </div>

        {/* 2-Column Dashboard Grid */}
        <div className="profile-dashboard-grid">
          {/* Column 1: Financial & Core Account Services */}
          <div className="profile-col-main">
            {/* Spotlight Visasra Money Card */}
            <div className="profile-wallet-card">
              <div className="profile-wallet-header">
                <div className="profile-wallet-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  Visasra Money
                </div>
                <button
                  type="button"
                  className="profile-wallet-btn"
                  onClick={() => onNavigate('wallet')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Top Up Funds</span>
                </button>
              </div>

              {/* Clean Currency Display in Plus Jakarta Sans */}
              <div className="profile-wallet-balance">
                <span className="profile-curr-sym">₹</span>
                <span className="profile-curr-num">{user.walletBalance.toLocaleString('en-IN')}</span>
              </div>

              <div className="profile-wallet-actions">
                <div className="profile-wallet-trust">
                  <span>🛡️</span>
                  <span>100% Protected · Instant refund on unfulfilled items</span>
                </div>
              </div>
            </div>

            {/* Orders & Sourcing Trips Card */}
            <div className="profile-nav-card" onClick={() => onNavigate('orders')}>
              <div className="profile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <line x1="8" y1="8" x2="16" y2="8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="8" y1="16" x2="13" y2="16" />
                </svg>
              </div>
              <div className="profile-nav-body">
                <div className="profile-nav-title">Orders &amp; Sourcing Trips</div>
                <p className="profile-nav-sub">Track real-time market sourcing, live store inspections &amp; courier shipments.</p>
              </div>
              <div className="profile-nav-arrow">›</div>
            </div>

            {/* Delivery Addresses Card */}
            <div className="profile-nav-card" onClick={() => onNavigate('addresses')}>
              <div className="profile-nav-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
              </div>
              <div className="profile-nav-body">
                <div className="profile-nav-title">Delivery Addresses</div>
                <p className="profile-nav-sub">
                  {savedAddressesCount} saved address{savedAddressesCount === 1 ? '' : 'es'} · {user.location ? `Destination: ${user.location}` : 'Set primary address'}
                </p>
              </div>
              <div className="profile-nav-arrow">›</div>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              className="profile-logout-btn"
              onClick={onLogout}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out of Visasra</span>
            </button>
          </div>

          {/* Column 2: Legal, Policies & Merchant Information (Razorpay Compliance) */}
          <div className="profile-col-policies">
            <div className="profile-policies-card">
              <div className="profile-policies-head">
                <div className="profile-policies-title">Policies &amp; Merchant Information</div>
                <p className="profile-policies-sub">Platform compliance, terms of service &amp; consumer grievance procedures.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <a href="/terms" className="profile-policy-link">
                  <span className="pol-left">
                    <span className="pol-icon">📜</span>
                    <span>Terms &amp; Wallet Policy</span>
                  </span>
                  <span className="pol-arrow">›</span>
                </a>

                <a href="/privacy" className="profile-policy-link">
                  <span className="pol-left">
                    <span className="pol-icon">🔒</span>
                    <span>Privacy Policy</span>
                  </span>
                  <span className="pol-arrow">›</span>
                </a>

                <a href="/refund-policy" className="profile-policy-link">
                  <span className="pol-left">
                    <span className="pol-icon">🔄</span>
                    <span>Cancellation &amp; Refund Policy</span>
                  </span>
                  <span className="pol-arrow">›</span>
                </a>

                <a href="/shipping-policy" className="profile-policy-link">
                  <span className="pol-left">
                    <span className="pol-icon">✈️</span>
                    <span>Shipping &amp; Delivery Policy</span>
                  </span>
                  <span className="pol-arrow">›</span>
                </a>

                <a href="/customs-policy" className="profile-policy-link">
                  <span className="pol-left">
                    <span className="pol-icon">🛃</span>
                    <span>Customs &amp; Duty Policy (DDP)</span>
                  </span>
                  <span className="pol-arrow">›</span>
                </a>

                <a href="/acceptable-use" className="profile-policy-link">
                  <span className="pol-left">
                    <span className="pol-icon">🛡️</span>
                    <span>Acceptable Use Policy</span>
                  </span>
                  <span className="pol-arrow">›</span>
                </a>

                <a href="/contact" className="profile-policy-link">
                  <span className="pol-left">
                    <span className="pol-icon">✉️</span>
                    <span>Contact Us &amp; Merchant Details</span>
                  </span>
                  <span className="pol-arrow">›</span>
                </a>
              </div>

              <div className="profile-merchant-footer">
                Operated by <b><span className="visasra-name">Visasra</span> Technologies</b><br />
                Secured Payments via Razorpay · Verified GST Invoices
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 30, 61, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="modal-card"
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              maxWidth: 460,
              width: '100%',
              padding: '24px 22px',
              boxShadow: '0 24px 50px rgba(7, 30, 61, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: "var(--font-bodoni, serif)" }}>
                  Edit Profile Details
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
                  Update your contact and primary delivery destination.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  fontSize: 16,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Delivery Destination / City
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. San Jose, California or Hyderabad, India"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#123C75',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
