import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Visasra',
  description: 'Cancellation and refund guidelines for Visasra Technologies concierge shopping bookings and wallet deposits.',
};

export default function RefundPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Visasra
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 8 }}>
          Cancellation &amp; Refund Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 32 }}>
          Last updated: November 2026 · Visasra Technologies
        </p>

        <section style={{ lineHeight: 1.7, fontSize: 15, color: '#334155' }}>
          <p>
            At Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>), operated by <b>Visasra Technologies</b>, customer satisfaction and transparency are our highest priorities. This Cancellation &amp; Refund Policy outlines the terms governing slot booking cancellations, unspent wallet balance returns, and item refund claims.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>1. Slot Booking Cancellation</h2>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><b>Before Shopper Dispatched:</b> You may cancel your booked shopping slot anytime before your personal shopper is assigned and dispatched to local retail markets. Upon cancellation, 100% of the slot fee is credited back immediately to your Visasra Money wallet.</li>
            <li><b>After Shopper Dispatched:</b> Once a shopper has physically arrived at the retail market or store, the base concierge sourcing service fee is non-refundable as field operational costs have already been incurred.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>2. Sourced Merchandise Refunds</h2>
          <p>
            Because items are physically inspected, photographed, and approved by you in real-time before in-store purchase bills are paid, purchased items are non-returnable once dispatched internationally, except under the following conditions:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><b>Out of Stock / Store Unavailable:</b> If an item requested cannot be sourced or verified in stock, 100% of the allocated item funds remain credited to your Visasra Money wallet.</li>
            <li><b>Defective or Incorrect Item:</b> If an item received differs substantially from the approved live option or arrives damaged in transit, please submit photo proof to <a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a> within 48 hours of doorstep delivery.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>3. Visasra Money Wallet Withdrawal &amp; Payouts</h2>
          <p>
            Any unspent balance in your Visasra Money wallet can be withdrawn back to your original source payment method (Credit/Debit Card, Netbanking, or UPI via Razorpay) at any time. Simply submit a withdrawal request from your Profile or email our support team.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>4. Refund Timeline &amp; Processing</h2>
          <p>
            Once a refund or wallet withdrawal request is approved, the funds are initiated via Razorpay immediately. Depending on your bank or card issuer, the credited amount reflects in your original payment account within <b>5 to 7 business days</b>.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>5. Contact Support for Refunds</h2>
          <p>
            To initiate a cancellation, claim, or refund:
            <br />
            <b>Entity:</b> Visasra Technologies<br />
            <b>Email:</b> <a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a><br />
            <b>Phone / WhatsApp:</b> +91 91703 24144
          </p>
        </section>
      </div>
    </main>
  );
}
