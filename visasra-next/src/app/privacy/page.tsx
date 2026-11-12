import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Visasra',
  description: 'Privacy and data protection policy for Visasra Technologies and www.visasra.com.',
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Visasra
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 32 }}>
          Last updated: November 2026 · Visasra Technologies
        </p>

        <section style={{ lineHeight: 1.7, fontSize: 15, color: '#334155' }}>
          <p>
            Visasra Technologies (&ldquo;Visasra&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy outlines how your personal information is collected, used, and safeguarded when visiting or using our services at <a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>1. Information We Collect</h2>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><b>Account Information:</b> Name, email address, mobile number, and encrypted password.</li>
            <li><b>Delivery Details:</b> Recipient name, street address, city, state, postal code, and country for domestic and international courier dispatch.</li>
            <li><b>Transaction Data:</b> Order references, wallet deposit timestamps, and payment transaction IDs processed via Razorpay. We do not store raw credit/debit card numbers or UPI MPINs on our servers.</li>
            <li><b>Sourcing &amp; Communications:</b> Custom product requests, uploaded reference photos, and customer feedback.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>2. How We Use Your Information</h2>
          <p>
            We use your data strictly to fulfill concierge shopping requests, coordinate with assigned personal shoppers in India, package and dispatch shipments via international couriers (DHL, FedEx, BlueDart), process secure payments, and provide tracking alerts.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>3. Payment Gateway Security</h2>
          <p>
            All online transactions on Visasra are processed via <b>Razorpay Software Private Limited</b>, an RBI-authorized Payment Aggregator complying with PCI-DSS Level 1 security standards. All card and banking transactions occur over 256-bit encrypted SSL/TLS channels.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>4. Data Protection &amp; Retention</h2>
          <p>
            We implement industry-standard database encryption and strict access controls. Your data is retained only as long as necessary to maintain active account records and comply with statutory legal and tax obligations.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>5. Contact Our Privacy Team</h2>
          <p>
            For privacy inquiries, data deletion requests, or grievances:
            <br />
            <b>Entity:</b> Visasra Technologies<br />
            <b>Email:</b> <a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a> / <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a><br />
            <b>Phone:</b> +91 91703 24144
          </p>
        </section>
      </div>
    </main>
  );
}
