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

  const [showPolicies, setShowPolicies] = useState(false);

  return (
    <section className="screen active screen-profile-root" data-screen="profile" style={{ padding: 0 }}>
      <div className="account-modern-wrap">
        {/* Top Curved Royal Blue Banner */}
        <div className="account-hero-blue">
          <h1 className="account-title">Account</h1>
          <div className="account-user-row">
            <div className="account-avatar">
              {initials || 'H'}
            </div>
            <div className="account-user-meta">
              <div className="account-user-name">{user.name || 'Hareh'}</div>
              <div className="account-user-sub">
                Verified customer · {user.location || 'Dallas, TX'}
              </div>
            </div>
            <button
              type="button"
              className="account-edit-icon-btn"
              onClick={() => {
                setEditName(user.name || '');
                setEditPhone(user.phone || customerPhone || '');
                setEditLocation(user.location || '');
                setIsEditing(true);
              }}
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Floating Visasra Money Card */}
        <div className="account-wallet-card">
          <div className="account-wallet-left">
            <div className="account-wallet-label">Visasra Money</div>
            <div className="account-wallet-balance">
              ₹{Number(user.walletBalance || 0).toLocaleString('en-IN')}
            </div>
            <div className="account-wallet-hint">
              Unfulfilled items are refunded to this balance.
            </div>
          </div>
          <button
            type="button"
            className="account-topup-btn"
            onClick={() => onNavigate('wallet')}
          >
            Top up
          </button>
        </div>

        {/* Single Grouped Menu Card */}
        <div className="account-menu-card">
          <div className="account-menu-row" onClick={() => onNavigate('orders')}>
            <div className="account-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <span className="account-menu-label">Orders and sourcing</span>
            <span className="account-menu-arrow">›</span>
          </div>

          <div className="account-menu-row" onClick={() => onNavigate('addresses')}>
            <div className="account-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="account-menu-label">Delivery addresses</span>
            {savedAddressesCount > 0 && (
              <span className="account-menu-badge">{savedAddressesCount} saved</span>
            )}
            <span className="account-menu-arrow">›</span>
          </div>

          <div className="account-menu-row" onClick={() => onNavigate('wallet')}>
            <div className="account-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <span className="account-menu-label">Payments and refunds</span>
            <span className="account-menu-arrow">›</span>
          </div>

          <div className="account-menu-row" onClick={() => setShowPolicies(!showPolicies)}>
            <div className="account-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="account-menu-label">Policies and support</span>
            <span className="account-menu-arrow">{showPolicies ? '⌄' : '›'}</span>
          </div>
        </div>

        {/* Collapsible Policy Links */}
        {showPolicies && (
          <div className="account-menu-card" style={{ marginTop: -8, marginBottom: 14 }}>
            <a href="/terms" className="account-menu-row">
              <span className="account-menu-label" style={{ fontSize: 13, color: '#475569' }}>Terms & Wallet Policy</span>
              <span className="account-menu-arrow">↗</span>
            </a>
            <a href="/privacy" className="account-menu-row">
              <span className="account-menu-label" style={{ fontSize: 13, color: '#475569' }}>Privacy Policy</span>
              <span className="account-menu-arrow">↗</span>
            </a>
            <a href="/refund-policy" className="account-menu-row">
              <span className="account-menu-label" style={{ fontSize: 13, color: '#475569' }}>Cancellation & Refund Policy</span>
              <span className="account-menu-arrow">↗</span>
            </a>
            <a href="/shipping-policy" className="account-menu-row">
              <span className="account-menu-label" style={{ fontSize: 13, color: '#475569' }}>Shipping & Customs Policy</span>
              <span className="account-menu-arrow">↗</span>
            </a>
            <a href="/contact" className="account-menu-row">
              <span className="account-menu-label" style={{ fontSize: 13, color: '#475569' }}>Contact Us</span>
              <span className="account-menu-arrow">↗</span>
            </a>
          </div>
        )}

        {/* Sign Out Button */}
        <button
          type="button"
          className="account-signout-btn"
          onClick={onLogout}
        >
          Sign out
        </button>

        {/* Trust Footer */}
        <div className="account-trust-footer">
          Payments secured by Razorpay. GST invoices on request.
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
