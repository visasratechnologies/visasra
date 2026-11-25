'use client';

import React from 'react';
import { TrackingDetails } from '@/types/customer';

interface OrderTrackingModalProps {
  slotKey: string | null;
  trackingData: TrackingDetails | null;
  onClose: () => void;
}

export default function OrderTrackingModal({
  slotKey,
  trackingData,
  onClose,
}: OrderTrackingModalProps) {
  if (!slotKey) return null;

  const orderStatus = trackingData?.orderStatus || 'confirmed';
  const trackingStage = trackingData?.trackingStage || 'slot_confirmed';

  // The 7 Official Milestones
  const SEVEN_STAGES = [
    {
      key: 'slot_confirmed',
      num: 1,
      title: 'Slot Confirmed & Scheduled',
      desc: 'Priority shopping window reserved across ground shopper network.',
      icon: '📅',
    },
    {
      key: 'worker_assigned',
      num: 2,
      title: 'Personal Shopper Assigned',
      desc: trackingData?.shopper
        ? `${trackingData.shopper.name} (${trackingData.shopper.phone}) assigned as your dedicated in-store shopper.`
        : 'Dedicated personal shopper assigned from regional fulfillment team.',
      icon: '🧑‍💼',
    },
    {
      key: 'shopping',
      num: 3,
      title: 'In-Store Verification & Sourcing',
      desc: trackingData?.store?.name
        ? `Live sourcing and photo verification active at ${trackingData.store.name}.`
        : 'Shopper active in local retail / wholesale market selecting verified pieces.',
      icon: '🛍️',
    },
    {
      key: 'purchased',
      num: 4,
      title: 'Purchased & Merchant Billed',
      desc: 'Items approved by customer, payment settled at counter, and tax invoices collected.',
      icon: '💳',
    },
    {
      key: 'packed',
      num: 5,
      title: 'Central Hub Quality Check & Export Packing',
      desc: 'Inspected for international transit, bubble-wrapped, and packed at Visasra Central Export Hub.',
      icon: '📦',
    },
    {
      key: 'shipped',
      num: 6,
      title: 'Customs Clearance & International Flight Dispatch',
      desc: trackingData?.trackingNumber
        ? `Dispatched via ${trackingData.carrier || 'International Airway Carrier'} (AWB: ${trackingData.trackingNumber}).`
        : 'Export documents prepared and handed to international air cargo carrier.',
      icon: '✈️',
    },
    {
      key: 'out_for_delivery',
      num: 7,
      title: 'Doorstep Delivery Overseas',
      desc: 'Customs cleared in destination country and out for final courier delivery.',
      icon: '🏠',
    },
  ];

  // Helper to determine stage status: 'done', 'current', or 'pending'
  const STAGE_ORDER = ['slot_confirmed', 'worker_assigned', 'shopping', 'purchased', 'packed', 'shipped', 'out_for_delivery'];

  const getStageState = (stageKey: string): 'done' | 'current' | 'pending' => {
    // If order is delivered, everything is done
    if (orderStatus === 'delivered') return 'done';

    // Map high-level orderStatus or trackingStage to stage index
    const effectiveStage = orderStatus === 'shipped'
      ? 'shipped'
      : orderStatus === 'packed'
      ? 'packed'
      : orderStatus === 'purchased'
      ? 'purchased'
      : trackingStage || 'slot_confirmed';

    const currentIdx = STAGE_ORDER.indexOf(effectiveStage);
    const thisIdx = STAGE_ORDER.indexOf(stageKey);

    if (thisIdx < currentIdx) return 'done';
    if (thisIdx === currentIdx) return 'current';
    return 'pending';
  };

  const completedCount = SEVEN_STAGES.filter((s) => getStageState(s.key) === 'done').length;
  const progressPercent = Math.min(100, Math.round(((completedCount + 0.5) / 7) * 100));

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 540,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          borderRadius: '18px',
          background: '#ffffff',
          boxShadow: '0 20px 45px -10px rgba(7, 29, 58, 0.25)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display, serif)', fontSize: 20, color: '#071D3A', fontWeight: 800 }}>
                Live Order Journey
              </h3>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                }}
              >
                {trackingData?.orderNumber || 'VIS-ORDER'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
              Shopping Slot: <strong style={{ color: '#071D3A' }}>{trackingData?.slotLabel || slotKey}</strong>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            aria-label="Close"
            style={{ fontSize: 18, padding: '4px 8px', color: '#64748B', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Global Progress Metric */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#071D3A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Fulfilment Pipeline (7 Milestones)
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#D97706' }}>
              {orderStatus === 'delivered' ? '100% Complete' : `Stage ${Math.min(7, completedCount + 1)} of 7`}
            </span>
          </div>
          <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: orderStatus === 'delivered' ? '100%' : `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #D97706, #059669)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Carrier Tracking Banner if Shipped */}
        {(trackingData?.trackingNumber || trackingData?.carrier) && (
          <div
            style={{
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                International Carrier Tracking
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#047857', marginTop: 2 }}>
                {trackingData.carrier || 'Express Air Cargo'} · {trackingData.trackingNumber || 'AWB-PENDING'}
              </div>
            </div>
            {trackingData.trackingUrl && (
              <a
                href={trackingData.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#059669',
                  padding: '6px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Track on Carrier ↗
              </a>
            )}
          </div>
        )}

        {/* Dedicated Personal Shopper In-Store Card */}
        {trackingData?.shopper && (
          <div
            style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#071D3A',
                  color: '#F59E0B',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {trackingData.shopper.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: '#071D3A' }}>
                  {trackingData.shopper.name}
                </div>
                <div style={{ fontSize: 11.5, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span>Personal Shopper</span>
                  <span>·</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>{trackingData.shopper.rating?.toFixed(1) || '4.9'} ({trackingData.shopper.ordersDone || 12}+ orders)</span>
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
              ● On Duty
            </span>
          </div>
        )}

        {/* Complete 7-Stage Stepper List */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Official Milestones
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {SEVEN_STAGES.map((s, idx) => {
              const state = getStageState(s.key);
              const isLast = idx === SEVEN_STAGES.length - 1;

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
                        bottom: -4,
                        background: state === 'done' ? '#059669' : '#E2E8F0',
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
                      background: state === 'done' ? '#059669' : state === 'current' ? '#071D3A' : '#F1F5F9',
                      color: state === 'done' || state === 'current' ? '#ffffff' : '#94A3B8',
                      border: state === 'current' ? '3px solid #D97706' : state === 'done' ? 'none' : '2px solid #CBD5E1',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0,
                      zIndex: 1,
                      boxShadow: state === 'current' ? '0 0 0 4px rgba(217, 119, 6, 0.2)' : 'none',
                    }}
                  >
                    {state === 'done' ? '✓' : s.num}
                  </div>

                  {/* Stage Details */}
                  <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: state === 'current' ? 800 : state === 'done' ? 700 : 600,
                          color: state === 'current' ? '#071D3A' : state === 'done' ? '#0F172A' : '#94A3B8',
                        }}
                      >
                        {s.icon} {s.title}
                      </div>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background:
                            state === 'done'
                              ? '#DCFCE7'
                              : state === 'current'
                              ? '#FEF3C7'
                              : '#F1F5F9',
                          color:
                            state === 'done'
                              ? '#15803D'
                              : state === 'current'
                              ? '#B45309'
                              : '#94A3B8',
                          flexShrink: 0,
                        }}
                      >
                        {state === 'done' ? 'Completed' : state === 'current' ? 'In Progress' : 'Upcoming'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: state === 'pending' ? '#94A3B8' : '#64748B', marginTop: 3, lineHeight: 1.4 }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Basket Items Sourced & Purchased */}
        {trackingData?.items && trackingData.items.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Sourced Items ({trackingData.items.length})
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {trackingData.items.map((it) => {
                const isPurchased = it.status === 'purchased';
                const isApproved = it.status === 'approved';

                return (
                  <div
                    key={it.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{ fontSize: 18 }}>{it.sourceType === 'online' ? '📦' : '🛍️'}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#071D3A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
                          {it.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          Qty: {it.qty || 1} {it.approvedAmount ? `· ₹${Number(it.approvedAmount).toLocaleString('en-IN')}` : ''}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 6,
                        background: isPurchased ? '#DCFCE7' : isApproved ? '#EFF6FF' : '#FEF3C7',
                        color: isPurchased ? '#166534' : isApproved ? '#1E40AF' : '#92400E',
                        flexShrink: 0,
                      }}
                    >
                      {isPurchased ? '✓ Purchased' : isApproved ? 'Customer Approved' : 'Sourcing in Store'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Notice */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 11.5,
            color: '#64748B',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Protected by Visasra Guarantee: Inspected at Central QC Hub, verified against counterfeit goods, and delivered with door-to-door international insurance.
        </div>
      </div>
    </div>
  );
}
