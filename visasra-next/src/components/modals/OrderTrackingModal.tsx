'use client';

import React from 'react';
import { TrackingDetails } from '@/types/customer';
import { resolveItemImage } from '@/lib/placeholders';

interface OrderTrackingModalProps {
  slotKey: string | null;
  trackingData: TrackingDetails | null;
  onClose: () => void;
  onJoinLiveShopping?: (slotKey: string) => void;
}

export default function OrderTrackingModal({
  slotKey,
  trackingData,
  onClose,
  onJoinLiveShopping,
}: OrderTrackingModalProps) {
  if (!slotKey) return null;

  const orderStatus = trackingData?.orderStatus || 'confirmed';
  const trackingStage = trackingData?.trackingStage || 'slot_confirmed';
  const shopperName = trackingData?.shopper?.name || 'Hareharan';

  // 7 Official Milestones matching User Mockup
  const SEVEN_STAGES = [
    {
      key: 'slot_confirmed',
      num: 1,
      title: 'Slot confirmed and scheduled',
      desc: 'Priority shopping window reserved across the local shopper network.',
    },
    {
      key: 'worker_assigned',
      num: 2,
      title: 'Personal shopper assigned',
      desc: `${shopperName} is your dedicated in-store shopper for this slot.`,
    },
    {
      key: 'shopping',
      num: 3,
      title: 'In-store verification and sourcing',
      desc: trackingData?.store?.name
        ? `Live sourcing and photo verification active at ${trackingData.store.name}.`
        : 'Live sourcing and photo verification at the store.',
    },
    {
      key: 'purchased',
      num: 4,
      title: 'Purchase and merchant bill',
      desc: 'Only items you approve are bought. Payment settles at the counter and tax invoices are saved.',
    },
    {
      key: 'packed',
      num: 5,
      title: 'Quality check and export packing',
      desc: 'Inspected in transit, wrapped, and packed at the export hub.',
    },
    {
      key: 'shipped',
      num: 6,
      title: 'Customs clearance and dispatch',
      desc: trackingData?.trackingNumber
        ? `Export documents prepared and dispatched via ${trackingData.carrier || 'Express Air Cargo'} (AWB: ${trackingData.trackingNumber}).`
        : 'Export documents prepared and handed to the courier. Duties are prepaid (DDP).',
    },
    {
      key: 'out_for_delivery',
      num: 7,
      title: 'Doorstep delivery',
      desc: 'Customs cleared at destination. Tracked until it reaches you.',
    },
  ];

  const STAGE_ORDER = ['slot_confirmed', 'worker_assigned', 'shopping', 'purchased', 'packed', 'shipped', 'out_for_delivery'];

  const getStageState = (stageKey: string): 'done' | 'current' | 'pending' => {
    if (orderStatus === 'delivered') return 'done';

    const effectiveStage = orderStatus === 'shipped'
      ? 'shipped'
      : orderStatus === 'packed'
      ? 'packed'
      : orderStatus === 'purchased'
      ? 'purchased'
      : trackingStage || 'shopping'; // Default to active sourcing stage to match mockup

    const currentIdx = STAGE_ORDER.indexOf(effectiveStage);
    const thisIdx = STAGE_ORDER.indexOf(stageKey);

    if (thisIdx < currentIdx) return 'done';
    if (thisIdx === currentIdx) return 'current';
    return 'pending';
  };

  const completedCount = SEVEN_STAGES.filter((s) => getStageState(s.key) === 'done').length;
  const currentStageNumber = Math.min(7, completedCount + 1);

  // Sourced items fallback if none present in backend
  const displayItems = (trackingData?.items && trackingData.items.length > 0)
    ? trackingData.items
    : [
        {
          id: 'item-dup-1',
          name: 'Handloom Kanchipuram Pure Silk Dupatta',
          qty: 1,
          priceMin: 1450,
          priceMax: 1800,
          status: 'sourcing',
          image: '/images/products/womens-fashion/kanchipuram-silk-saree.jpg',
        },
        {
          id: 'item-bell-2',
          name: 'Handcrafted Brass Hanging Pooja Bell',
          qty: 1,
          priceMin: 650,
          priceMax: 850,
          status: 'sourcing',
          image: '/images/products/pooja-spiritual/diyas/brass-diya.jpg',
        },
      ];

  const handleJoinLive = () => {
    if (onJoinLiveShopping) {
      onJoinLiveShopping(slotKey);
    } else {
      onClose();
    }
  };

  const handleTrackCarrier = () => {
    if (trackingData?.trackingUrl) {
      window.open(trackingData.trackingUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Refresh or focus on current modal
      const num = trackingData?.trackingNumber || 'AWB-PENDING';
      alert(`Carrier Tracking AWB: ${num}\nTracking status will activate once dispatched from the central hub.`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card tracking-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row with Back Button, Title, Subtitle, and Stage Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#FFFFFF',
                border: '1.2px solid #E2E8F0',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 12.5,
                fontWeight: 700,
                color: '#071D3A',
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Orders</span>
            </button>

            <h2 style={{ margin: 0, fontFamily: 'var(--font-display, serif)', fontSize: 22, color: '#071D3A', fontWeight: 800 }}>
              Live order journey
            </h2>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
              {trackingData?.orderNumber || 'VIS-33025'} · {trackingData?.slotLabel || 'Today, 3:30 to 4:30 PM IST'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              className="tracking-header-stage-pill"
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
                background: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #BBF7D0',
              }}
            >
              Stage {currentStageNumber} of 7
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                border: 'none',
                background: '#F1F5F9',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'grid',
                placeItems: 'center',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: 15,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mobile-Only Progress Card with 7 Horizontal Segmented Bars */}
        <div className="tracking-mobile-progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#071D3A' }}>Progress</span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0A3A6B' }}>
              Stage {currentStageNumber} of 7
            </span>
          </div>

          {/* 7 Segmented Bars */}
          <div style={{ display: 'flex', gap: 5, margin: '10px 0 14px' }}>
            {SEVEN_STAGES.map((s, idx) => {
              const isFilled = idx < currentStageNumber;
              return (
                <div
                  key={s.key}
                  style={{
                    height: 6,
                    flex: 1,
                    borderRadius: 999,
                    background: isFilled ? '#0A3A6B' : '#E2E8F0',
                    transition: 'background 0.3s ease',
                  }}
                />
              );
            })}
          </div>

          {/* Shopper row inside mobile progress card */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#071D3A',
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {shopperName.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#071D3A' }}>
                  {shopperName} · Personal shopper
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>
                  5.0 rating · on duty
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#15803D',
                background: '#DCFCE7',
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid #86EFAC',
              }}
            >
              ● On duty
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout (Desktop: Milestones Left | Shopper & Sourced Items Right) */}
        <div className="tracking-grid-2col">
          {/* Column 1: Milestones Box */}
          <div className="tracking-card-box">
            <h3 style={{ margin: '0 0 18px 0', fontSize: 17, fontWeight: 800, color: '#071D3A', fontFamily: 'var(--font-display, serif)' }}>
              Milestones
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {SEVEN_STAGES.map((s, idx) => {
                const state = getStageState(s.key);
                const isLast = idx === SEVEN_STAGES.length - 1;
                const isDone = state === 'done';
                const isCurrent = state === 'current';
                const isPending = state === 'pending';

                return (
                  <div key={s.key} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                    {/* Vertical Connecting Line */}
                    {!isLast && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 28,
                          left: 14,
                          width: 2,
                          bottom: -2,
                          background: isDone ? '#0A3A6B' : '#E2E8F0',
                          zIndex: 0,
                        }}
                      />
                    )}

                    {/* Node Badge */}
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: isDone ? '#0A3A6B' : isCurrent ? '#FFFFFF' : '#F8FAFC',
                        color: isDone ? '#FFFFFF' : isCurrent ? '#0A3A6B' : '#64748B',
                        border: isDone ? 'none' : isCurrent ? '2.5px solid #0A3A6B' : '1.5px solid #CBD5E1',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: isDone ? 13 : 12,
                        fontWeight: 800,
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      {isDone ? '✓' : s.num}
                    </div>

                    {/* Milestone Info */}
                    <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: isCurrent ? 800 : isDone ? 700 : 600,
                            color: isPending ? '#64748B' : '#071D3A',
                          }}
                        >
                          {s.title}
                        </span>

                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: isDone ? '#DCFCE7' : isCurrent ? '#FEF3C7' : '#F1F5F9',
                            color: isDone ? '#15803D' : isCurrent ? '#92400E' : '#64748B',
                            flexShrink: 0,
                          }}
                        >
                          {isDone ? 'Completed' : isCurrent ? 'In progress' : 'Upcoming'}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 1.45 }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Shopper, Sourced Items & CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Shopper Card (Desktop) */}
            <div className="tracking-card-box tracking-desktop-shopper-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: '#071D3A',
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  {shopperName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: '#071D3A' }}>
                    {shopperName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Personal shopper · 5.0 rating
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#15803D',
                  background: '#DCFCE7',
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: '1px solid #86EFAC',
                }}
              >
                ● On duty
              </span>
            </div>

            {/* Sourced Items Card */}
            <div className="tracking-card-box" style={{ padding: '18px 20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 15.5, fontWeight: 800, color: '#071D3A', fontFamily: 'var(--font-display, serif)' }}>
                Sourced items
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayItems.map((it: any, itIdx: number) => {
                  const isPurchased = it.status === 'purchased';
                  const isApproved = it.status === 'approved';

                  return (
                    <div
                      key={it.id || itIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: '#EFF6FF',
                            border: '1px solid #DBEAFE',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={resolveItemImage(it.image, it.sourceType, it.name)}
                            alt={it.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('placeholder-item.svg')) {
                                target.src = '/images/placeholders/placeholder-item.svg';
                              }
                            }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#071D3A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {it.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                            Qty {it.qty || 1} · Budget ₹{(it.priceMin || 1450).toLocaleString('en-IN')} to ₹{(it.priceMax || 1800).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isPurchased ? '#DCFCE7' : isApproved ? '#EFF6FF' : '#FEF3C7',
                          color: isPurchased ? '#166534' : isApproved ? '#1E40AF' : '#92400E',
                          flexShrink: 0,
                        }}
                      >
                        {isPurchased ? 'Purchased' : isApproved ? 'Approved' : 'Sourcing'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={handleJoinLive}
                style={{
                  width: '100%',
                  background: '#0B4F9C',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  padding: '12px 18px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(11, 79, 156, 0.25)',
                  transition: 'background 0.15s ease',
                }}
              >
                Join live shopping
              </button>

              <button
                type="button"
                onClick={handleTrackCarrier}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  color: '#071D3A',
                  fontSize: 14,
                  fontWeight: 700,
                  padding: '11px 18px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                Track order
              </button>
            </div>

            {/* Trust Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11.5,
                color: '#64748B',
                lineHeight: 1.4,
                padding: '4px 2px',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Inspected at the hub, checked for counterfeits, and insured to your door.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
