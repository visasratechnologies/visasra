import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | Visasra',
  description: 'Official contact details, customer support, and merchant information for Visasra Technologies.',
};

export default function ContactPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to <span className="visasra-name">Visasra</span>
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 8 }}>
          Contact Us
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 32 }}>
          We are here to assist with concierge slot bookings, order dispatch, and custom sourcing.
        </p>

        <section style={{ lineHeight: 1.7, fontSize: 15, color: '#334155' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div style={{ padding: 24, borderRadius: 14, background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#1B5AA6', marginBottom: 6 }}>Legal Entity Name</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#09254A' }}><span className="visasra-name">Visasra</span> Technologies</div>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Registered Merchant &amp; Technology Operator</p>
            </div>

            <div style={{ padding: 24, borderRadius: 14, background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#1B5AA6', marginBottom: 6 }}>Email Support</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#09254A' }}>
                <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#09254A', textDecoration: 'none' }}>visasratechnologies@gmail.com</a>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                Mon – Sat, 9:00 AM – 8:00 PM IST
              </p>
            </div>

            <div style={{ padding: 24, borderRadius: 14, background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#1B5AA6', marginBottom: 6 }}>Online Platform</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#09254A' }}>
                <a href="https://www.visasra.com" style={{ color: '#1B5AA6', textDecoration: 'none' }}>www.visasra.com</a>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                Global Concierge &amp; Personal Shopping
              </p>
            </div>
          </div>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>Grievance Desk</h2>
          <p>
            In accordance with the Information Technology Act 2000 and applicable Consumer Protection rules:
            <br />
            <b>Entity:</b> Visasra Technologies<br />
            <b>Grievance Email:</b> <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a><br />
            <b>Response Timeline:</b> Acknowledgement within 48 hours; resolution within 14 business days.
          </p>
        </section>
      </div>
    </main>
  );
}

