import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Customs & Duty Policy | Visasra',
  description: 'Official Customs & Duty Policy for Visasra Technologies. Details on Delivered Duty Paid (DDP), customs clearance, and import tax handling for international shipments.',
};

export default function CustomsPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Visasra
        </Link>

        <div style={{ display: 'inline-block', background: '#E8F2FD', color: '#1B5AA6', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
          Official Policy · Visasra Technologies
        </div>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 8 }}>
          Customs &amp; Duty Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 28 }}>
          Effective Date: November 2026 · Applicable to all cross-border orders on Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>)
        </p>

        {/* Highlight Card: DDP Model */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '18px 22px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <b style={{ color: '#166534', fontSize: 16 }}>No Surprise Customs Fees at Delivery</b>
          </div>
          <p style={{ color: '#15803D', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Visasra operates primarily on a Delivered Duty Paid (DDP) framework. For standard international shipments, <b>Visasra arranges and pays applicable destination customs duties, import taxes, and clearance fees directly through our logistics partners</b> (DHL, FedEx, DTDC). You do not need to pay the courier upon arrival.
          </p>
        </div>

        <section style={{ lineHeight: 1.75, fontSize: 15, color: '#334155' }}>
          <p>
            This Customs &amp; Duty Policy explains how customs duties, import taxes, customs clearance charges, and related destination-country charges are handled for products purchased through Visasra and shipped internationally from India.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>1. General Principle</h2>
          <p>
            For standard Visasra international orders, customers are <b>not responsible for paying customs duties, import taxes, customs clearance charges, brokerage fees, or similar destination-country charges at delivery</b>, unless the order terms expressly state otherwise.
          </p>
          <p>
            Visasra arranges and pays applicable customs and import-related charges through its designated logistics or shipping partners, subject to the applicable shipping arrangement and destination-country requirements.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>2. Who Pays Customs Duties?</h2>
          <p>
            <b>Visasra is responsible</b> for applicable customs duties, import taxes, and standard destination-country customs or clearance charges associated with eligible international shipments.
          </p>
          <p>
            Visasra partners with authorized international logistics and courier providers such as <b>DHL Express, FedEx, and DTDC</b> to manage cross-border customs clearance smoothly.
          </p>
          <p>
            Customers should not be asked to pay customs or import charges separately at delivery for standard orders covered by this policy. If a logistics partner contacts a customer requesting payment, the customer should contact Visasra Support (<a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a>) before making any payment, unless Visasra has expressly communicated otherwise for that specific order.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>3. How Customs Charges Are Determined</h2>
          <p>
            Customs authorities determine duties and taxes based on factors including:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Product classification (Harmonized System / HS Codes).</li>
            <li>Declared commercial value and quantity of items.</li>
            <li>Country of origin (India).</li>
            <li>Destination-country tax laws, de minimis duty-free thresholds, and VAT/GST schedules.</li>
          </ul>
          <p>
            Visasra and its logistics partners manage all assessment calculations and settle duties directly with the respective customs authorities.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>4. Customs Clearance &amp; Documentation</h2>
          <p>
            Visasra and its logistics partners submit all documentation required for international export from India and import into the destination country, including commercial invoices, packing lists, product descriptions, declared values, and consignee details.
          </p>
          <p>
            Customers are responsible for providing complete and accurate recipient details (legal name, complete physical address, and reachable phone number) and for promptly providing any identity or tax verification documents (such as passport copy, national ID, or tax identification number) if required by the foreign customs authority.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>5. Customs Delays &amp; Inspections</h2>
          <p>
            Customs authorities reserve the sovereign right to inspect, hold, or request additional documentation for any international consignment. Such inspections may cause temporary transit delays.
          </p>
          <p>
            Visasra and its logistics partners actively monitor clearance milestones and coordinate directly with customs agents to resolve questions promptly. However, processing time within customs border agencies is governed by sovereign local law and is beyond Visasra&apos;s direct control.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>6. Restricted or Prohibited Products</h2>
          <p>
            Certain categories of products are restricted or prohibited from international import under foreign customs regulations or international air freight safety rules. These include hazardous materials, prohibited biological materials, certain unpasteurized edibles, uncertified electronics, or counterfeit goods.
          </p>
          <p>
            Visasra reserves the right to decline or cancel any shopping request for products that cannot legally or practically be cleared through customs.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>7. Accurate Product Valuation &amp; Anti-Fraud Commitment</h2>
          <p>
            Visasra strictly abides by international trade laws and Indian customs export regulations. All declarations reflect true commercial values and authentic merchant purchase invoices.
          </p>
          <p>
            <b>Visasra does not accept customer requests for undervaluation, false descriptions, or fraudulent customs declarations.</b> Attempting to circumvent customs rules through fraudulent documentation is strictly prohibited.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>8. Indian Export Regulations</h2>
          <p>
            All shipments leaving India are processed in full compliance with the Directorate General of Foreign Trade (DGFT), Indian Customs Act, and Reserve Bank of India (RBI) export guidelines through authorized courier and postal channels.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>9. Refunds in Relation to Customs Charges</h2>
          <p>
            Where Visasra has paid customs duties, import clearance fees, or air cargo tariffs on behalf of an order, those costs represent direct third-party expenses.
          </p>
          <p>
            If an order is cancelled after dispatch or refused by the customer at the destination, customs clearance fees and non-recoverable return shipping tariffs already incurred will be deducted from any refund amount, in accordance with the Visasra Cancellation and Refund &amp; Return Policies.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>10. Important Legal Notice</h2>
          <p>
            Visasra does not provide formal legal or tax advisory services. Visasra covers standard customs and import-related duties for eligible international retail orders as described herein. Exceptional shipments or commercial bulk orders may be governed by specific written agreements.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>11. Customs Support &amp; Assistance</h2>
          <p>
            If you have questions about customs clearance or receive an inquiry from a courier partner regarding your delivery:
          </p>
          <div style={{ background: '#F1F5F9', borderRadius: 10, padding: '16px 20px', marginTop: 12 }}>
            <div><b>Operating Entity:</b> Visasra Technologies</div>
            <div><b>Headquarters:</b> Hyderabad, Telangana, India</div>
            <div><b>Customs &amp; Shipping Desk:</b> <a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a></div>
            <div><b>Customer Helpline:</b> +91 91703 24144</div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
            <Link href="/shipping-policy" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              ← Back to Shipping &amp; Delivery Policy
            </Link>
            <Link href="/refund-policy" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Cancellation &amp; Refund Policy →
            </Link>
            <Link href="/terms" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Customer Terms &amp; Wallet Policy →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
