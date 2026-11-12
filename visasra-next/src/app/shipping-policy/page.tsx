import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping, Delivery & Customs Policy | Visasra',
  description: 'Official Shipping & Delivery Policy and Customs & Duty Policy for Visasra Technologies. Transparent timelines, international air freight, and Delivered Duty Paid (DDP) guidelines.',
};

export default function ShippingPolicyPage() {
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
          Shipping &amp; Delivery Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 28 }}>
          Effective Date: November 2026 · Applicable to all orders placed on Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>)
        </p>

        {/* Highlight Card: DDP Model */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '18px 22px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>✈️</span>
            <b style={{ color: '#166534', fontSize: 16 }}>Delivered Duty Paid (DDP) for Standard Orders</b>
          </div>
          <p style={{ color: '#15803D', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            For standard Visasra international orders, <b>customers are not responsible for paying customs duties, import taxes, or clearance fees at delivery</b>. Visasra arranges and pays applicable destination duties and clearance charges directly through our authorized international logistics partners (DHL, FedEx, DTDC).
          </p>
        </div>

        <section style={{ lineHeight: 1.75, fontSize: 15, color: '#334155' }}>
          <p>
            This Shipping &amp; Delivery Policy explains how products purchased through Visasra are prepared, collected, shipped, and delivered to customers worldwide. Visasra arranges purchases from authentic Indian merchants through assigned personal shoppers and coordinates dispatch through premier domestic and international logistics carriers.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>1. Order Processing &amp; Fulfillment Workflow</h2>
          <p>After an order or shopping slot is successfully booked and confirmed, Visasra coordinates product availability and purchasing:</p>
          <ol style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li style={{ marginBottom: 6 }}><b>Slot Allocation &amp; Store Visit:</b> An assigned personal shopper or verified merchant visits the selected local stores in India to inspect and procure the requested products according to your specific instructions.</li>
            <li style={{ marginBottom: 6 }}><b>Hub Consolidation &amp; Quality Check:</b> All sourced products are collected at the designated Visasra fulfillment hub, where items undergo strict inspection against authentic GST bills and are prepared with export-grade protective packaging.</li>
            <li style={{ marginBottom: 6 }}><b>Carrier Handover:</b> The consolidated and weighed package is handed over to our selected logistics partner for immediate dispatch.</li>
          </ol>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>2. Shipping Destinations &amp; Availability</h2>
          <p>
            Visasra offers worldwide international shipping to selected countries and delivery addresses, subject to destination-country regulations, carrier serviceability, and customs requirements.
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Domestic Delivery:</b> All serviceable pin codes across India.</li>
            <li><b>Major International Hubs:</b> United States, Canada, United Kingdom, European Union, United Arab Emirates, Saudi Arabia, Qatar, Singapore, Australia, New Zealand, and other serviceable regions.</li>
          </ul>
          <p style={{ fontSize: 14, color: '#64748B' }}>
            Note: Certain destinations or remote addresses may be restricted due to international trade sanctions, carrier embargoes, or specific destination import regulations.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>3. Estimated Shipping &amp; Delivery Timelines</h2>
          <p>Estimated delivery times shown on the App or checkout page are indicative estimates:</p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Domestic Delivery (India):</b> 2 to 4 business days via BlueDart, Delhivery, or DTDC Express.</li>
            <li><b>North America (USA &amp; Canada):</b> 4 to 7 business days via DHL Express / FedEx Priority.</li>
            <li><b>United Kingdom &amp; Europe:</b> 4 to 7 business days via DHL Express / FedEx.</li>
            <li><b>Middle East (UAE, Saudi Arabia, Qatar):</b> 3 to 5 business days via Aramex / DHL Express.</li>
            <li><b>Asia-Pacific (Singapore, Australia, etc.):</b> 5 to 8 business days via DHL Express / FedEx.</li>
          </ul>
          <p>
            Actual delivery timeframes may vary depending on foreign customs inspections, public holidays, weather disruptions, air cargo congestion, or carrier operational conditions outside Visasra&apos;s reasonable control.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>4. Shipping Charges &amp; Weight Calculation</h2>
          <p>
            Shipping charges are calculated transparently based on destination country, volumetric/actual package weight, delivery speed, and logistics partner tariffs.
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Estimated shipping charges are displayed during cart review or slot checkout.</li>
            <li>Final shipping weight is confirmed at the Visasra fulfillment hub after final packaging. Any variance is automatically adjusted against your Visasra Wallet or notified prior to final dispatch.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>5. Customs, Duties &amp; Taxes Policy</h2>
          <p>
            International shipments are subject to the customs rules, tariffs, and clearance procedures of the destination country:
          </p>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, color: '#09254A', marginTop: 0, marginBottom: 8 }}>Who Pays Customs Duties?</h3>
            <p style={{ margin: 0, marginBottom: 10 }}>
              <b>Visasra is responsible for applicable customs duties, import taxes, and standard destination customs clearance charges</b> associated with eligible international orders under our Delivered Duty Paid (DDP) service.
            </p>
            <p style={{ margin: 0, marginBottom: 10 }}>
              Visasra partners with authorized international carriers such as <b>DHL Express, FedEx, and DTDC</b> to clear customs smoothly. Customers should <b>not</b> be asked to pay customs or import taxes separately upon delivery for standard orders.
            </p>
            <p style={{ margin: 0, fontSize: 13.5, color: '#64748B' }}>
              If a courier agent contacts you requesting local import duty payment for an order covered by this policy, please do not pay immediately—contact Visasra Support (<a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a>) and our customs coordination desk will verify and resolve the clearance record directly with the carrier.
            </p>
          </div>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>6. Live Shipment Tracking &amp; Airway Bill (AWB)</h2>
          <p>
            Once your package is handed over to the courier partner, an official Airway Bill (AWB) tracking number is generated. You can track your shipment live:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Inside your Visasra account under the <b>Orders</b> section.</li>
            <li>Directly on the courier partner&apos;s global tracking portal (DHL, FedEx, or DTDC).</li>
            <li>Via automated SMS and email notifications at milestone intervals (Picked Up, Export Customs Cleared, In International Transit, Import Cleared, Out for Delivery).</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>7. Delivery Address Accuracy &amp; Recipient Obligations</h2>
          <p>
            Customers must provide a complete and accurate delivery address, reachable contact phone number, and any destination-required identification (such as national ID or tax number if requested by local customs regulations).
          </p>
          <p>
            If a package cannot be delivered due to an incorrect or incomplete address provided by the customer, re-routing fees or return shipping charges assessed by the carrier may be charged to the customer.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>8. Failed or Missed Delivery Attempts</h2>
          <p>
            Our logistics partners typically make 2 to 3 delivery attempts. If the recipient is unavailable, the courier may leave a notice or hold the package at the nearest local depot for a designated hold period (usually 5 to 7 days).
          </p>
          <p>
            If the package remains uncollected and is returned to India or abandoned by carrier rules, any non-recoverable shipping and customs return costs will be deducted from any refund eligibility in accordance with our Cancellation &amp; Refund Policy.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>9. Lost, Damaged, or Tampered Shipments</h2>
          <p>
            We take extreme care in packaging your authentic Indian goods. If an order arrives damaged, tampered with, or is lost in transit:
          </p>
          <ol style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li style={{ marginBottom: 6 }}>Notify Visasra Support within <b>48 hours of delivery</b> (or expected delivery date for lost items).</li>
            <li style={{ marginBottom: 6 }}>Provide clear photographs and video of the outer box, shipping label, internal packaging, and damaged items.</li>
            <li style={{ marginBottom: 6 }}>Visasra will initiate an investigation with the courier partner and insurance provider. Validated claims will be resolved via <b>replacement, 100% Visasra Wallet credit, or original payment refund within 5 to 7 business days</b>.</li>
          </ol>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>10. Restricted &amp; Prohibited Products</h2>
          <p>
            Certain goods cannot be shipped internationally under Indian export laws or international air transit safety guidelines. Prohibited items include:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Flammable liquids, perfumes with high alcohol content, aerosols, and compressed gases.</li>
            <li>Currency, bullion, raw precious metal ingots, and antique artifacts older than 100 years without ASI license.</li>
            <li>Perishable fresh produce, meat products, or items prohibited under destination agricultural regulations.</li>
            <li>Prescription medications without authorized international doctor prescriptions and export permits.</li>
          </ul>
          <p>
            Visasra reserves the right to decline or cancel shopping requests for any item identified as restricted or illegal.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>11. Customs Documentation &amp; Anti-Fraud Compliance</h2>
          <p>
            All international shipments are declared accurately with commercial invoices and genuine export documentation. Visasra strictly adheres to legal customs declarations and does not support requests for undervaluation, false descriptions, or fraudulent invoices.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>12. Contact &amp; Shipping Inquiries</h2>
          <p>
            For any queries regarding shipping status, tracking, or customs clearance:
          </p>
          <div style={{ background: '#F1F5F9', borderRadius: 10, padding: '16px 20px', marginTop: 12 }}>
            <div><b>Operating Entity:</b> Visasra Technologies</div>
            <div><b>Registered Office:</b> Hyderabad, Telangana, India</div>
            <div><b>Shipping Support:</b> <a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a></div>
            <div><b>Helpline / WhatsApp:</b> +91 91703 24144</div>
            <div><b>Support Hours:</b> Monday – Saturday, 9:00 AM – 8:00 PM IST</div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
            <Link href="/customs-policy" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Read Dedicated Customs &amp; Duty Policy →
            </Link>
            <Link href="/refund-policy" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Read Cancellation &amp; Refund Policy →
            </Link>
            <Link href="/terms" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Read Customer Terms &amp; Wallet Policy →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
