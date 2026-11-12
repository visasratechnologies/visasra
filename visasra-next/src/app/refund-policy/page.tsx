import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cancellation, Refund & Return Policy | Visasra',
  description: 'Official Cancellation, Return, and Refund Policy for Visasra Technologies and the Visasra platform.',
};

export default function RefundPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to <span className="visasra-name">Visasra</span>
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 6 }}>
          Cancellation, Refund &amp; Return Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 32 }}>
          Effective Date: November 2026 · <b><span className="visasra-name">Visasra</span> Technologies</b>
        </p>

        <section style={{ lineHeight: 1.75, fontSize: 15, color: '#334155' }}>
          <p style={{ background: '#F1F5F9', padding: '16px 20px', borderRadius: 12, borderLeft: '4px solid #1B5AA6', fontStyle: 'italic', marginBottom: 28 }}>
            This Cancellation, Refund &amp; Return Policy explains when and how cancellations, returns, replacements, and refunds are handled for orders placed through Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>), operated by <b>Visasra Technologies</b>. Because Visasra arranges real-time personal shopping from Indian merchants followed by international freight, resolution eligibility depends on the stage of the order and seller return policies.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>1. Order Cancellation Stages</h2>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>1.1 Cancellation Before Sourcing / Order Processing</h3>
          <p>
            A customer may request cancellation before the assigned personal shopper or merchant has started purchasing or processing the requested products. Where no non-recoverable operational cost has been incurred, the customer is eligible for a full refund of the product amount.
          </p>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>1.2 Cancellation After Shopping Has Started</h3>
          <p>
            Once a worker has physically arrived at the retail market, reserved products, or incurred local costs for the order, cancellation is restricted. If cancellation is still possible, Visasra may deduct actual non-recoverable costs (such as local transportation, shopper travel, or non-refundable seller charges) before issuing the eligible balance.
          </p>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>1.3 Cancellation After Products Have Been Purchased</h3>
          <p>
            If products have already been purchased in-store against official GST tax invoices, cancellation depends on whether the merchant accepts store returns. If the seller accepts the return, the refund is issued after deducting return logistics or restocking fees. Custom-tailored items, perishable goods, or products marked non-returnable by the merchant are non-refundable.
          </p>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>1.4 Cancellation After International Dispatch</h3>
          <p>
            Once an order has been packaged and handed over to our international logistics partner (DHL, FedEx, DTDC), the shipment cannot be cancelled in transit. The customer may request an eligible return after doorstep delivery in accordance with Section 2 below.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>2. Sourcing Slot Booking Cancellation Terms</h2>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <b style={{ color: '#92400E' }}>Important Slot Policy:</b>
            <p style={{ margin: '6px 0 0', color: '#78350F' }}>
              Once a concierge shopping slot is successfully booked and confirmed, the slot booking fee is <b>non-cancellable and non-refundable</b>. This charge directly covers the allocation of dedicated personal shoppers, travel logistics, and operational reservation of field resources.
            </p>
          </div>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>3. Refunds &amp; Returns Scenarios</h2>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>3.1 Damaged or Broken in Transit</h3>
          <p>
            If a product arrives damaged, the customer should submit photos of the outer box, inner packaging, and damaged merchandise to Visasra Support within 48 hours of delivery. Upon verification, available resolutions include:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Full Wallet Refund:</b> 100% of the product value credited instantly to the customer&rsquo;s Visasra Wallet.</li>
            <li><b>Free Replacement:</b> A replacement product is procured and dispatched, subject to item availability.</li>
            <li><b>Original Payment Method Refund:</b> 100% of the product value returned to the original bank/card account via Razorpay.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>3.2 Incorrect Product Delivered</h3>
          <p>
            If an item delivered differs from the verified option approved in your live session, Visasra will investigate the issue. The customer may be offered a replacement, a full return, or a partial wallet compensation if the customer chooses to retain the delivered item.
          </p>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>3.3 Minor Cosmetic Issues</h3>
          <p>
            For non-critical cosmetic issues (e.g. slight surface mark on a watch or utensil that functions properly), where international return shipping is economically disproportionate, Visasra offers customers the choice to keep the item with an immediate partial wallet credit compensation.
          </p>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>3.4 Customer Changed Mind</h3>
          <p>
            Customers may request a return due to change of mind where the merchant policy permits. For change-of-mind returns on international shipments, return international shipping costs are payable by the customer. Upon verified receipt of the returned item in original unused condition with all tags and store bills, the product cost will be refunded. Original shipping charges are non-refundable.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>4. Refund Processing &amp; Turnaround Times</h2>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Visasra Wallet Credit:</b> Credited instantly upon claim approval, ready for immediate use on any current or future booking.</li>
            <li><b>Original Payment Method (Card, Netbanking, UPI):</b> Processed through Razorpay within 24 hours of approval. Depending on your bank or issuing card network, the funds reflect in your account within <b>5 to 7 business days</b>.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>5. How to Initiate a Return or Refund Claim</h2>
          <ol style={{ paddingLeft: 22, marginBottom: 20 }}>
            <li>Locate the order in your Visasra account under the <b>Orders</b> tab.</li>
            <li>Tap &ldquo;Need Help&rdquo; or email our support team at <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a>.</li>
            <li>Provide your Order ID (e.g. VIS-XXXXX), detailed description of the issue, and clear photographs/videos of the package and item.</li>
          </ol>

          <div style={{ marginTop: 36, padding: 24, borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 16, color: '#09254A', marginBottom: 8, fontWeight: 700 }}>Contact Information</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
              <b>Entity:</b> Visasra Technologies<br />
              <b>Platform:</b> Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>)<br />
              <b>Support Email:</b> <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
