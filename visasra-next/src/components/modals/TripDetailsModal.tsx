'use client';

import React from 'react';
import { CartItem, Address, User } from '@/types/customer';

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotDuration: number;
  selectedDate: string;
  selectedSlotWindow: string;
  cart: CartItem[];
  activeAddr: Address | null;
  user: User;
  customerPhone: string;
  merchandiseBudget: number;
  currentSlotFee: number;
  totalDepositRequired: number;
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({
  isOpen,
  onClose,
  slotDuration,
  selectedDate,
  selectedSlotWindow,
  cart,
  activeAddr,
  user,
  customerPhone,
  merchandiseBudget,
  currentSlotFee,
  totalDepositRequired,
}) => {
  if (!isOpen) return null;

  return (
    <div className="abhibus-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="abhibus-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Close circle button at top */}
        <div className="abhibus-close-row">
          <button
            type="button"
            className="abhibus-close-btn"
            onClick={onClose}
            aria-label="Close trip details"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="abhibus-sheet">
          <div className="abhibus-sheet-header">
            <h2 className="abhibus-title">Sourcing &amp; Payment Details</h2>
          </div>

          {/* Service Card */}
          <div className="abhibus-service-card">
            <div className="absc-header">
              <div className="absc-header-text">
                <div className="absc-service-name">VISASRA SOURCING · {slotDuration}H SHOPPING PASS</div>
                <div className="absc-service-type">
                  {slotDuration === 2
                    ? 'Super Express Sourcing (1–2 Stores)'
                    : slotDuration === 3
                    ? 'Comprehensive Multi-Bazaar Shopping'
                    : 'VIP Full-Day Artisan & Boutique Tour'}
                </div>
              </div>
              <div className="absc-thumb-box">
                <img
                  src={cart[0]?.image || '/images/placeholders/placeholder-item.svg'}
                  alt={cart[0]?.name || 'Item'}
                  className="absc-bus-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                  }}
                />
              </div>
            </div>

            <div className="absc-divider" />

            {/* Timeline Stops */}
            <div className="absc-timeline">
              <div className="absc-stop">
                <div className="absc-stop-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="absc-stop-content">
                  <div className="absc-stop-city">Local Artisan Markets &amp; Stores</div>
                  <div className="absc-stop-time">{selectedDate}, {selectedSlotWindow}</div>
                </div>
              </div>

              <div className="absc-timeline-line" />

              <div className="absc-stop">
                <div className="absc-stop-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" style={{ width: 18, height: 18 }}>
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div className="absc-stop-content">
                  <div className="absc-stop-city">
                    {activeAddr ? [activeAddr.city, activeAddr.country].filter(Boolean).join(', ') : 'International Destination'}
                  </div>
                  <div className="absc-stop-time">
                    {activeAddr ? `${activeAddr.line1} (Insured Air Courier)` : 'Doorstep Delivery (Insured Air Courier)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Sourcing Details */}
          <div className="abhibus-section">
            <div className="abhibus-section-title">CUSTOMER &amp; SOURCING CAPACITY</div>

            <div className="abhibus-traveller-row">
              <div className="abhibus-avatar">
                {((activeAddr?.name || user.name || 'CU')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()) || 'CU'}
              </div>
              <div className="abhibus-traveller-info">
                <div className="abhibus-traveller-name">
                  {activeAddr?.name || user.name || 'Valued Customer'}
                </div>
                <div className="abhibus-traveller-sub">
                  {activeAddr ? `Verified Customer · ${activeAddr.country}` : 'Verified Customer'}
                </div>
              </div>
              <div className="abhibus-seat-badge">
                {slotDuration}H Pass Active
              </div>
            </div>

            {/* Mini Visual Grid for Items */}
            <div className="abhibus-seat-mini-grid">
              <div className="abhibus-seat-grid-label">Reserved Basket Items ({cart.length}):</div>
              <div className="abhibus-seat-slots">
                {cart.map((item, idx) => (
                  <div key={item.id || idx} className="abhibus-seat-chip active">
                    <img
                      src={
                        item.image && !item.image.includes('pooja-spiritual.jpg')
                          ? item.image
                          : item.sourceType === 'mind'
                          ? '/images/placeholders/placeholder-custom.svg'
                          : item.sourceType === 'online'
                          ? '/images/placeholders/placeholder-online.svg'
                          : '/images/placeholders/placeholder-item.svg'
                      }
                      alt={item.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                      }}
                    />
                    <span>
                      {item.name} (x{item.qty || 1}) · Est: ₹{(item.priceMax || item.priceMin || 1000).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="abhibus-section">
            <div className="abhibus-section-title">CONTACT DETAILS</div>
            <div className="abhibus-contact-sub">Your live shopping updates, photos &amp; store bills will be sent here:</div>
            <div className="abhibus-contact-card">
              <div className="abhibus-contact-phone">
                <span className="abhibus-contact-phone-icon">📞</span>
                <span>{customerPhone || activeAddr?.phone || user.phone || 'Phone Pending'}</span>
              </div>
              <span className="abhibus-wa-tag">WhatsApp Active</span>
            </div>
          </div>

          {/* Visasra Money & Payment Structure */}
          <div className="abhibus-fare-card">
            <div className="absc-payment-title">VISASRA MONEY PAYMENT FLOW</div>

            <div className="absc-breakdown-row">
              <div className="absc-breakdown-label">
                <span>🛍️ Sourcing Merchandise Budget (Max)</span>
                <span className="absc-sub-tip">Estimated for {cart.length} item{cart.length > 1 ? 's' : ''} in basket</span>
              </div>
              <div className="absc-breakdown-val">₹{merchandiseBudget.toLocaleString('en-IN')}</div>
            </div>

            <div className="absc-breakdown-row">
              <div className="absc-breakdown-label">
                <span>⚡ Dedicated Shopper Slot Fee ({slotDuration}h)</span>
                <span className="absc-sub-tip">Deducted immediately to reserve ground personal shopper</span>
              </div>
              <div className="absc-breakdown-val" style={{ color: '#2563EB' }}>₹{currentSlotFee}</div>
            </div>

            <div className="absc-total-deposit-row">
              <div>
                <div className="absc-total-label">Total Required Deposit in Visasra Money</div>
                <div className="absc-total-sub">Full deposit required to confirm slot booking</div>
              </div>
              <div className="absc-total-amt">₹{totalDepositRequired.toLocaleString('en-IN')}</div>
            </div>

            {/* How Money Works 4-Step Breakdown */}
            <div className="absc-how-money-works">
              <div className="absc-step-item">
                <div className="absc-step-num">1</div>
                <div className="absc-step-text">
                  <b>Deposit Upfront:</b> Deposit ₹{totalDepositRequired.toLocaleString('en-IN')} to Visasra Money to lock in your slot.
                </div>
              </div>
              <div className="absc-step-item">
                <div className="absc-step-num">2</div>
                <div className="absc-step-text">
                  <b>Slot Fee Deducted:</b> ₹{currentSlotFee} is deducted automatically from your wallet when slot is confirmed.
                </div>
              </div>
              <div className="absc-step-item">
                <div className="absc-step-num">3</div>
                <div className="absc-step-text">
                  <b>Live Sample Selection:</b> The remaining ₹{merchandiseBudget.toLocaleString('en-IN')} stays in your Visasra Money. When the shopper shares live samples and you choose one, only that exact item&apos;s price is deducted.
                </div>
              </div>
              <div className="absc-step-item">
                <div className="absc-step-num">4</div>
                <div className="absc-step-text">
                  <b>Final Settlement:</b> Any leftover balance covers international packaging &amp; courier shipping fees at final dispatch.
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="abhibus-sheet-confirm-btn"
            onClick={onClose}
          >
            Done &amp; Return to Booking
          </button>
        </div>
      </div>
    </div>
  );
};
