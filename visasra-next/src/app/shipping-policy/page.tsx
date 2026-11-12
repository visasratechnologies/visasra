import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Visasra',
  description: 'Shipping timelines, courier partners, and international tracking guidelines for Visasra Technologies.',
};

export default function ShippingPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Visasra
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 8 }}>
          Shipping &amp; Delivery Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 32 }}>
          Last updated: November 2026 · Visasra Technologies
        </p>

        <section style={{ lineHeight: 1.7, fontSize: 15, color: '#334155' }}>
          <p>
            Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>), operated by <b>Visasra Technologies</b>, offers international and domestic shipping for all sourced authentic Indian products, including cookware, ethnic wear, jewellery, handicrafts, and spiritual items.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>1. Sourcing, QC &amp; Dispatch Timeline</h2>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><b>Day 1 (Shopping Slot):</b> Your personal shopper visits the store, sources items, and completes payment against official GST bills.</li>
            <li><b>Day 2 (Hub QC &amp; Packaging):</b> Sourced goods are received at our fulfillment center, checked for quality, and packaged with heavy-duty export-grade protective boxing.</li>
            <li><b>Day 3 (Dispatch):</b> The consolidated shipment is handed over to our verified air freight courier partner.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>2. Delivery Timelines by Destination</h2>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><b>Domestic Delivery (India):</b> 2 to 4 business days via BlueDart / Delhivery / DTDC Express.</li>
            <li><b>United States, Canada &amp; UK:</b> 4 to 7 business days via DHL Express / FedEx Priority.</li>
            <li><b>Middle East (UAE, Saudi Arabia, Qatar):</b> 3 to 5 business days via Aramex / DHL Express.</li>
            <li><b>Australia, Singapore &amp; Europe:</b> 5 to 8 business days via DHL / FedEx.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>3. Real-Time Tracking &amp; Airway Bill (AWB)</h2>
          <p>
            As soon as your shipment is picked up by the international courier, an official Airway Bill (AWB) number and live tracking link will be updated in your <b>Orders</b> tab and sent via email/SMS. You can track your package every step of the journey until doorstep delivery.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>4. International Customs, Duties &amp; Taxes</h2>
          <p>
            Shipments comply with Indian export regulations. For cross-border deliveries, any destination country customs tariffs, local VAT, or clearance duties levied by local border authorities are payable by the recipient upon arrival.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>5. Shipping Support &amp; Enquiries</h2>
          <p>
            For courier tracking inquiries or shipping assistance:
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
