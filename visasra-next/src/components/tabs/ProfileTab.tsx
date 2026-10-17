'use client';

import React from 'react';
import { User, Address } from '@/types';

interface ProfileTabProps {
  user: User;
  customerPhone: string;
  savedAddresses: Address[];
  activeTab: 'profile' | 'addresses';
  onNavigate: (tab: 'home' | 'wallet' | 'orders' | 'profile' | 'addresses') => void;
  onLogout: () => void;
  isAddingAddress: boolean;
  setIsAddingAddress: (val: boolean) => void;
  addressForm: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    zip: string;
    country: string;
    label: 'Home' | 'Office' | 'Other';
  };
  setAddressForm: React.Dispatch<React.SetStateAction<{
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    zip: string;
    country: string;
    label: 'Home' | 'Office' | 'Other';
  }>>;
  onSaveAddress: () => void;
  onDeleteAddress: (id: string) => void;
}

export default function ProfileTab({
  user,
  customerPhone,
  savedAddresses,
  activeTab,
  onNavigate,
  onLogout,
  isAddingAddress,
  setIsAddingAddress,
  addressForm,
  setAddressForm,
  onSaveAddress,
  onDeleteAddress,
}: ProfileTabProps) {
  if (activeTab === 'profile') {
    return (
      <section className="screen active" data-screen="profile">
        <img className="corner-leaf" src="/images/decor/leaf-cluster.png" alt="" aria-hidden="true" />
        <button className="back-row" onClick={() => onNavigate('home')} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back
        </button>
        <div className="profile-head">
          <div className="avatar">
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'VI'}
          </div>
          <div>
            <div className="profile-name">{user.name}</div>
            <div className="profile-loc">{user.email} · Phone: {customerPhone || user.phone || 'Not set'}</div>
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
                {savedAddresses.length} saved · Primary: {customerPhone || user.phone}
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
  }

  // activeTab === 'addresses'
  return (
    <section className="screen active" data-screen="addresses">
      <button className="back-row" onClick={() => onNavigate('profile')} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back
      </button>
      <div className="page-title">Delivery addresses</div>
      <div className="page-sub">Addresses and phone numbers saved on your Visasra account.</div>

      <div className="dl-wrap dl-wrap-page" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          {savedAddresses.map((addr) => (
            <div key={addr.id} className="addr-card">
              <span className="addr-pin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.4" />
                </svg>
              </span>
              <div className="addr-body">
                <div className="addr-name">
                  {addr.name} <span className="addr-tag">{addr.label}</span>
                </div>
                <div className="addr-lines">
                  {[addr.line1, addr.line2, addr.city, addr.region, addr.zip, addr.country].filter(Boolean).join(', ')}
                </div>
                <div className="addr-phone">{addr.phone}</div>
              </div>
              <button
                type="button"
                className="addr-edit"
                style={{ color: 'var(--danger)' }}
                onClick={() => onDeleteAddress(addr.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {!isAddingAddress ? (
          <button type="button" className="dl-add" onClick={() => setIsAddingAddress(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add new address
          </button>
        ) : (
          <div className="af" style={{ background: '#F8FAFD', border: '1.5px solid var(--border)', borderRadius: 16, padding: 16 }}>
            <div className="af-head">
              <div className="af-title">Add New Address</div>
              <button type="button" className="af-del" onClick={() => setIsAddingAddress(false)}>Close</button>
            </div>

            <div className="af-sec">Contact Details</div>
            <div className="af-grid">
              <label className="af-f">
                <span>Full name</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="Recipient Name"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>Phone / Mobile</span>
                <input
                  type="tel"
                  className="inp"
                  placeholder="+1 (415) 890-1234"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </label>
            </div>

            <div className="af-sec" style={{ marginTop: 12 }}>Street &amp; Location</div>
            <div className="af-grid">
              <label className="af-f af-full">
                <span>Street address</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="Flat / House no, Building, Street"
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                />
              </label>
              <label className="af-f af-full">
                <span>Apartment, suite, landmark (optional)</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="Apartment or landmark"
                  value={addressForm.line2 || ''}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>City</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. San Francisco or London"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>State / Province</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. California"
                  value={addressForm.region || ''}
                  onChange={(e) => setAddressForm({ ...addressForm, region: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>Postal / ZIP code</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. 94107"
                  value={addressForm.zip}
                  onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>Country</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. United States"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                />
              </label>
            </div>

            <div className="af-foot" style={{ marginTop: 14 }}>
              <div className="af-chips">
                <span className="af-saveas">Label as:</span>
                {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    className={`af-chip ${addressForm.label === lbl ? 'active' : ''}`}
                    onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddingAddress(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onSaveAddress} style={{ flex: 2 }}>
                Save address
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
