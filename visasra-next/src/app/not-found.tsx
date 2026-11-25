import Link from 'next/link';

export default function NotFound() {
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
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
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
        Visasra Concierge Shopping
      </div>

      <h1
        style={{
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 800,
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
        }}
      >
        Page Not Found
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
        The shopping page or destination you requested does not exist or has moved. Return to the main portal to book your slot or view orders.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
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
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
            transition: 'transform 0.15s ease',
          }}
        >
          <span>Return to Home</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/book-slot"
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
            textDecoration: 'none',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          Book Shopping Slot
        </Link>
      </div>
    </div>
  );
}
