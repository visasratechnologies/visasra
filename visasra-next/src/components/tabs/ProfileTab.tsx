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

  const initials = (user.name || 'AI')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
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
    <section className="screen active" data-screen="profile">
      <img className="corner-leaf" src="/images/decor/leaf-cluster.png" alt="" aria-hidden="true" />
      <button className="back-row" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back
      </button>

      <div className="profile-head" style={{ position: 'relative' }}>
        <div className="avatar">{initials || 'AI'}</div>
        <div style={{ flex: 1 }}>
          <div className="profile-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>{user.name}</span>
            <button
              onClick={() => {
                setEditName(user.name || '');
                setEditPhone(user.phone || customerPhone || '');
                setEditLocation(user.location || '');
                setIsEditing(true);
              }}
              style={{
                background: 'rgba(18, 97, 181, 0.08)',
                color: 'var(--primary, #1261B5)',
                border: '1px solid rgba(18, 97, 181, 0.2)',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Details
            </button>
          </div>
          <div className="profile-loc" style={{ marginTop: 4 }}>
            📍 {user.location ? user.location : 'Delivery Location: Not set'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-faint, #666)', marginTop: 2 }}>
            📞 {user.phone || customerPhone || 'Phone not set'} · ✉️ {user.email}
          </div>
          {user.lastLoginAt && (
            <div style={{ fontSize: '11px', color: 'var(--text-faint, #888)', marginTop: 4 }}>
              Active Session · Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div className="modal-card" style={{ background: 'var(--surface, #fff)', borderRadius: 16, maxWidth: 440, width: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Edit Profile Details</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border, #ddd)', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Mobile Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border, #ddd)', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>Delivery Destination / City</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. San Jose, California or Hyderabad, India"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border, #ddd)', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #ccc', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--primary, #1261B5)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="section-title" style={{ marginTop: 22 }}>Account & Orders</div>
      <div className="menu-card">
        <div className="row-link" onClick={() => onNavigate('wallet')}>
          <div className="ri">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18" />
              <circle cx="16.5" cy="14.5" r="1" />
            </svg>
          </div>
          <div className="rt">
            Visasra Money
            <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--gold-soft)', marginTop: 1 }} className="money">
              ₹{user.walletBalance.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="rc">›</div>
        </div>
        <div className="row-link" onClick={() => onNavigate('orders')}>
          <div className="ri">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <line x1="8" y1="8" x2="16" y2="8" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="rt">Orders & Sourcing Trips</div>
          <div className="rc">›</div>
        </div>
        <div className="row-link" onClick={() => onNavigate('addresses')}>
          <div className="ri">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.4" />
            </svg>
          </div>
          <div className="rt">
            Delivery addresses
            <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-faint)', marginTop: 1 }}>
              {savedAddressesCount} saved · Primary: {user.phone || customerPhone || 'Default'}
            </span>
          </div>
          <div className="rc">›</div>
        </div>
        <div className="row-link" onClick={onLogout} style={{ color: '#DC2626' }}>
          <div className="ri">
            <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
              <path d="M10 12h11M17 8l4 4-4 4" />
            </svg>
          </div>
          <div className="rt" style={{ fontWeight: 700 }}>Sign out of Visasra</div>
          <div className="rc" style={{ color: '#DC2626' }}>›</div>
        </div>
      </div>
    </section>
  );
};
