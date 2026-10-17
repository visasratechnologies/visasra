import React, { useState } from 'react';
import { Address } from '@/types/customer';

interface AddressesTabProps {
  savedAddresses: Address[];
  onBack: () => void;
  onDeleteAddress: (id: string) => void;
  onSaveAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  defaultName?: string;
  defaultPhone?: string;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({
  savedAddresses,
  onBack,
  onDeleteAddress,
  onSaveAddress,
  defaultName = '',
  defaultPhone = '',
}) => {
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    name: defaultName,
    phone: defaultPhone,
    line1: '',
    line2: '',
    city: '',
    region: '',
    zip: '',
    country: 'United States',
    label: 'Home',
  });

  const handleSave = async () => {
    if (!addressForm.line1.trim() || !addressForm.city.trim() || !addressForm.zip.trim()) {
      alert('Please fill out street address, city, and zip code');
      return;
    }
    setSaving(true);
    try {
      await onSaveAddress(addressForm);
      setIsAddingAddress(false);
      setAddressForm({
        name: defaultName,
        phone: defaultPhone,
        line1: '',
        line2: '',
        city: '',
        region: '',
        zip: '',
        country: 'United States',
        label: 'Home',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="screen active" data-screen="addresses">
      <button className="back-row" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back
      </button>
      <div className="page-title">Delivery addresses</div>
      <div className="page-sub">Addresses and phone numbers saved on your Visasra account.</div>

      <div className="dl-wrap dl-wrap-page" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          {savedAddresses.map(addr => (
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
                  onChange={e => setAddressForm({ ...addressForm, name: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>Phone / Mobile</span>
                <input
                  type="tel"
                  className="inp"
                  placeholder="+1 (415) 890-1234"
                  value={addressForm.phone}
                  onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
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
                  onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })}
                />
              </label>
              <label className="af-f af-full">
                <span>Apartment, suite, landmark (optional)</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="Apartment or landmark"
                  value={addressForm.line2}
                  onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>City</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. San Francisco or London"
                  value={addressForm.city}
                  onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>State / Province</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. California"
                  value={addressForm.region}
                  onChange={e => setAddressForm({ ...addressForm, region: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>Postal / ZIP code</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. 94107"
                  value={addressForm.zip}
                  onChange={e => setAddressForm({ ...addressForm, zip: e.target.value })}
                />
              </label>
              <label className="af-f">
                <span>Country</span>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. United States"
                  value={addressForm.country}
                  onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                />
              </label>
            </div>

            <div className="af-foot" style={{ marginTop: 14 }}>
              <div className="af-chips">
                <span className="af-saveas">Label as:</span>
                {(['Home', 'Office', 'Other'] as const).map(lbl => (
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
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2 }}>
                {saving ? 'Saving...' : 'Save address'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
