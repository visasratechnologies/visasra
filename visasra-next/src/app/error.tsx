'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled customer app error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0A2540 0%, #07192C 100%)',
        color: '#FFFFFF',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'var(--font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 20,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#D4AF37',
          marginBottom: 8,
        }}
      >
        Visasra Concierge
      </div>

      <h1
        style={{
          fontSize: 'clamp(26px, 4.5vw, 36px)',
          fontWeight: 800,
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
        }}
      >
        Session Restored Safely
      </h1>

      <p
        style={{
          fontSize: 15,
          color: 'rgba(255, 255, 255, 0.72)',
          maxWidth: 440,
          lineHeight: 1.6,
          margin: '0 0 28px',
        }}
      >
        A temporary display glitch occurred while updating your view. Your orders and wallet balance remain completely secure.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
          }}
        >
          <span>Retry Action</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 22px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
          }}
        >
          Return to Portal
        </button>
      </div>
    </div>
  );
}
