'use client';

import React from 'react';
import { TrackingDetails } from '@/types';

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

  const status = trackingData?.orderStatus || 'confirmed';
  const isDelivered = status === 'delivered';
  const isShipped = isDelivered || status === 'shipped';
  const isPacked = isShipped || status === 'packed';
  const isSourced =
    isPacked ||
    ['purchased', 'bought', 'approved'].includes(status) ||
    (trackingData?.items?.some((i) => i.status === 'purchased') ?? false);
  const isConfirmed = true;

  const steps = [
    { label: 'Order Placed', done: isSourced, current: !isSourced && isConfirmed },
    {
      label: trackingData?.orderType === 'online' ? 'Procured' : 'Sourced',
      done: isPacked,
      current: isSourced && !isPacked,
    },
    { label: 'Shipped', done: isDelivered, current: isPacked && !isDelivered },
    { label: 'Delivered', done: isDelivered, current: isDelivered },
  ];

  const progressPct = isDelivered ? '100%' : isShipped ? '70%' : isSourced ? '40%' : '10%';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, color: '#0F172A' }}>
                Order Tracking
              </h3>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#E0F2FE', color: '#0369A1' }}>
                {trackingData?.orderNumber || 'VIS-92014'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Slot: <b>{trackingData?.slotLabel || slotKey}</b>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            style={{ fontSize: 13, padding: '4px 10px' }}
          >
            Close
          </button>
        </div>

        {/* 4-Step Progress Bar */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 10px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {/* Background Progress Track */}
            <div style={{ position: 'absolute', top: 12, left: '12%', right: '12%', height: 3, background: '#E2E8F0', zIndex: 0 }}>
              <div style={{ height: '100%', background: '#22C55E', width: progressPct, transition: 'width 0.3s ease' }} />
            </div>

            {steps.map((s, idx) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '24%' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: s.done ? '#22C55E' : s.current ? '#0284C7' : '#fff',
                    border: s.done || s.current ? 'none' : '2px solid #CBD5E1',
                    color: s.done || s.current ? '#fff' : '#94A3B8',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    boxShadow: s.current ? '0 0 0 4px rgba(2, 132, 199, 0.18)' : 'none',
                  }}
                >
                  {s.done ? '✓' : idx + 1}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: s.current ? 800 : 600,
                    color: s.current ? '#0284C7' : s.done ? '#1E293B' : '#94A3B8',
                    marginTop: 6,
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shopper / Sourcing Badge (Physical Market Orders) */}
        {trackingData?.orderType !== 'online' && trackingData?.shopper && (
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0284C7', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>
                {trackingData.shopper.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0369A1' }}>{trackingData.shopper.name}</div>
                <div style={{ fontSize: 11, color: '#0284C7' }}>Personal Shopper · {trackingData.store?.name || 'Local Store'}</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: 999 }}>
              ● Active
            </span>
          </div>
        )}

        {/* Items Summary */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Items ({trackingData?.items?.length || 0})
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {trackingData?.items?.map((it) => {
              const isBought = it.status === 'purchased';
              const isApproved = it.status === 'approved';
              return (
                <div
                  key={it.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 16 }}>{it.sourceType === 'online' ? '📦' : '🛍️'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Qty: {it.qty || 1} · {it.onlinePlatform || 'In-Store'}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: isBought ? '#DCFCE7' : isApproved ? '#EFF6FF' : '#FEF3C7',
                      color: isBought ? '#166534' : isApproved ? '#1E40AF' : '#92400E',
                      flexShrink: 0,
                    }}
                  >
                    {isBought ? '✓ Purchased' : isApproved ? 'Approved' : 'Procuring'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Note */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: '#64748B', textAlign: 'center' }}>
          Shipped via Express International Courier directly to your doorstep.
        </div>
      </div>
    </div>
  );
}
