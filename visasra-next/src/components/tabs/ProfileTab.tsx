import React from 'react';
import { User, CustomerTab } from '@/types/customer';

interface ProfileTabProps {
  user: User;
  customerPhone: string;
  savedAddressesCount: number;
  onNavigate: (tab: CustomerTab) => void;
  onLogout: () => void;
  onBack: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  customerPhone,
  savedAddressesCount,
  onNavigate,
  onLogout,
  onBack,
}) => {
  const initials = (user.name || 'AI')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  return (
    <section className="screen active" data-screen="profile">
      <img className="corner-leaf" src="/images/decor/leaf-cluster.png" alt="" aria-hidden="true" />
      <button className="back-row" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back
      </button>
      <div className="profile-head">
        <div className="avatar">{initials || 'AI'}</div>
        <div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-loc">San Francisco, California · Phone: {customerPhone || user.phone || 'Not set'}</div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 22 }}>Account</div>
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
          <div className="rt">Orders</div>
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
              {savedAddressesCount} saved · Primary: {customerPhone || user.phone || 'Default'}
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
