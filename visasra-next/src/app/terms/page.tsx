import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Visasra',
  description: 'Terms of service and legal conditions for Visasra Technologies concierge shopping and international delivery.',
};

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Visasra
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 8 }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 32 }}>
          Last updated: November 2026 · Operated by <b>Visasra Technologies</b>
        </p>

        <section style={{ lineHeight: 1.7, fontSize: 15, color: '#334155' }}>
          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>1. Platform Overview &amp; Sourcing Service</h2>
          <p>
            Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>), operated by <b>Visasra Technologies</b>, connects international and domestic clients with dedicated in-store personal shoppers across India. Our personal shoppers physically visit authentic local retail stores, bazaars, and verified brands to procure, inspect, and package requested merchandise according to client instructions.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>2. Concierge Slot Bookings &amp; Sourcing Sessions</h2>
          <p>
            Users reserve a dedicated live shopping window (&ldquo;Slot&rdquo;) by selecting a date, time window, and preferred sourcing category. A personal shopper is assigned to physically visit designated retail markets in India during your slot window. Clients may interact with their assigned shopper via live session updates, approve product selections, and review GST store receipts before purchases are finalized.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>3. Pricing, Visasra Money &amp; Escrow Deposit</h2>
          <p>
            All product prices displayed in the catalog are estimated procurement ranges. Actual items are purchased against verified merchant tax invoices (GST bills). Clients maintain an escrow balance in <b>Visasra Money</b> via secure payment gateways (including Razorpay). Approved item purchases and dedicated sourcing concierge fees are debited from the client&rsquo;s Visasra Money balance with full transaction history available in the account dashboard.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>4. In-Store Quality Verification &amp; Billing</h2>
          <p>
            All purchased physical goods undergo visual inspection at our Quality Control fulfillment hub. Original merchant invoices or digital GST bills are retained and provided to the client for full price transparency.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>5. International Customs, Duties &amp; Taxes</h2>
          <p>
            For international dispatches, destination import duties, custom clearances, and local taxes (if applicable by destination country customs authorities) are the sole responsibility of the recipient.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>6. Contact &amp; Grievance Redressal</h2>
          <p>
            For any queries or formal notices regarding these Terms, contact us at:
            <br />
            <b>Entity:</b> Visasra Technologies<br />
            <b>Email:</b> <a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a> / <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a><br />
            <b>Phone / WhatsApp:</b> +91 91703 24144
          </p>
        </section>
      </div>
    </main>
  );
}
