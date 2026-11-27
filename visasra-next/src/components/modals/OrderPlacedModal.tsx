'use client';

import React from 'react';
import { Order, CustomerTab } from '@/types/customer';

interface OrderPlacedModalProps {
  order: Order | null;
  onClose: () => void;
  onNavigate: (tab: CustomerTab) => void;
  onJoinLiveShopping?: (slotKey: string) => void;
  onTrackOrder?: (slotKey: string) => void;
}

export const OrderPlacedModal: React.FC<OrderPlacedModalProps> = ({
  order,
  onClose,
  onNavigate,
  onTrackOrder,
}) => {
  if (!order || !order.id || !order.orderNumber) return null;

  const handleTrack = () => {
    if (onTrackOrder) {
      onTrackOrder(order.slotKey);
    } else {
      onClose();
      onNavigate('orders');
    }
  };

  const handleHome = () => {
    onClose();
    onNavigate('home');
  };

  const slotTiming = order.slotLabel || order.slotDate || 'Today, 11:00 AM - 2:00 PM IST';
  const itemCount = order.items?.length || 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#FFFFFF',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Top Application Bar */}
      <header
        style={{
          width: '100%',
          borderBottom: '1px solid #EEF2F6',
          background: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: 'calc(12px + env(safe-area-inset-top, 0px)) 20px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/images/logo/visasra-logo.png" alt="Visasra" style={{ height: 28, width: 'auto' }} />
            <span style={{ fontFamily: 'var(--font-display, serif)', fontWeight: 800, fontSize: 18, color: '#071D3A', letterSpacing: '0.04em' }}>
              VISASRA
            </span>
          </div>

          <button
            type="button"
            onClick={handleHome}
            aria-label="Back to home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#F8FAFC',
              border: '1.2px solid #E2E8F0',
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Close</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <main
        className="order-placed-page-body"
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 960,
          margin: '0 auto',
          padding: '28px 20px calc(48px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
      >
        <style jsx>{`
          .order-placed-layout {
            display: grid;
            grid-template-columns: 1fr 1.15fr;
            gap: 40px;
            align-items: start;
          }
          .op-left {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .op-buttons {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 24px;
            width: 100%;
            justify-content: center;
          }
          .op-btn-home {
            background: #FFFFFF;
            border: 1.2px solid #CBD5E1;
            border-radius: 999px;
            padding: 11px 24px;
            font-size: 13.5px;
            font-weight: 700;
            color: #071D3A;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .op-btn-home:hover {
            border-color: #94A3B8;
            background: #F8FAFC;
          }
          .op-btn-track {
            background: #0B4F9C;
            border: none;
            border-radius: 999px;
            padding: 11px 28px;
            font-size: 13.5px;
            font-weight: 700;
            color: #FFFFFF;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(11, 79, 156, 0.25);
            transition: all 0.15s ease;
          }
          .op-btn-track:hover {
            background: #093E7A;
          }
          @media (max-width: 768px) {
            .order-placed-page-body {
              padding: 18px 16px calc(36px + env(safe-area-inset-bottom, 0px)) !important;
            }
            .order-placed-layout {
              grid-template-columns: 1fr;
              gap: 20px;
            }
            .op-buttons {
              order: 3;
              margin-top: 16px;
              display: flex;
              gap: 10px;
              width: 100%;
            }
            .op-btn-home,
            .op-btn-track {
              flex: 1;
              text-align: center;
              padding: 12px 14px;
              font-size: 13px;
            }
          }
        `}</style>

        <div className="order-placed-layout">
          {/* Left Column: Festive Bag Art + Headline + Subtitle + Action Buttons */}
          <div className="op-left">
            <img
              src="/images/decor/visasra-bag.png"
              alt="Visasra Shopping Bag"
              style={{
                width: 150,
                height: 150,
                objectFit: 'contain',
                filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.12))',
              }}
            />

            {/* Blue Circular Checkmark */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#0B4F9C',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                margin: '14px 0 10px',
                boxShadow: '0 4px 10px rgba(11, 79, 156, 0.3)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display, serif)',
                fontSize: 26,
                fontWeight: 800,
                color: '#071D3A',
              }}
            >
              Order placed
            </h2>

            <p
              style={{
                fontSize: 13,
                color: '#64748B',
                lineHeight: 1.5,
                margin: '6px 0 0',
                maxWidth: 290,
              }}
            >
              Your request is with a local shopper. Nothing is charged until you approve an item.
            </p>

            {/* Desktop Action Buttons (Side by Side) */}
            <div className="op-buttons">
              <button
                type="button"
                className="op-btn-home"
                onClick={handleHome}
              >
                Back to home
              </button>

              <button
                type="button"
                className="op-btn-track"
                onClick={handleTrack}
              >
                Track order
              </button>
            </div>
          </div>

          {/* Right Column: Order Summary Card + What Happens Next Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Card 1: Order Summary */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.2px solid #E2E8F0',
                borderRadius: 16,
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#071D3A', fontFamily: 'var(--font-display, serif)' }}>
                  Order summary
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#15803D',
                    background: '#DCFCE7',
                    padding: '3px 10px',
                    borderRadius: 999,
                    border: '1px solid #BBF7D0',
                  }}
                >
                  Shopper assigned
                </span>
              </div>

              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>Order</span>
                  <span style={{ fontWeight: 800, color: '#071D3A' }}>{order.orderNumber}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>Shopping slot</span>
                  <span style={{ fontWeight: 700, color: '#071D3A' }}>{slotTiming}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>Items requested</span>
                  <span style={{ fontWeight: 700, color: '#071D3A' }}>{itemCount} requested</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#64748B' }}>Charged today</span>
                  <span style={{ fontWeight: 800, color: '#071D3A' }}>₹0</span>
                </div>
              </div>
            </div>

            {/* Card 2: What Happens Next */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.2px solid #E2E8F0',
                borderRadius: 16,
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 800, color: '#071D3A', fontFamily: 'var(--font-display, serif)' }}>
                What happens next
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Step 1 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#0B4F9C',
                      color: '#FFFFFF',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11.5,
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#071D3A' }}>
                      Shopper visits the store
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                      At your slot, {slotTiming}
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#EFF6FF',
                      color: '#0B4F9C',
                      border: '1px solid #BFDBFE',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11.5,
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#071D3A' }}>
                      You approve each item
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                      Review photos and prices. Nothing is bought without your approval.
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#EFF6FF',
                      color: '#0B4F9C',
                      border: '1px solid #BFDBFE',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11.5,
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#071D3A' }}>
                      Delivered to your door
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                      Customs and duties prepaid, tracked end to end.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
