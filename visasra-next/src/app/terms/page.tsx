import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Customer Terms & Wallet Policy | Visasra',
  description: 'Official Customer Terms and Conditions, including Visasra Wallet Policy and slot booking rules.',
};

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Visasra
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 6 }}>
          Customer Terms &amp; Conditions
        </h1>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#D97706', marginBottom: 10 }}>
          Including Visasra Wallet Terms &amp; Conditions
        </div>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 32 }}>
          Effective Date: November 2026 · Operated by <b>Visasra Technologies</b>
        </p>

        <section style={{ lineHeight: 1.75, fontSize: 15, color: '#334155' }}>
          <p style={{ background: '#F1F5F9', padding: '16px 20px', borderRadius: 12, borderLeft: '4px solid #1B5AA6', fontStyle: 'italic', marginBottom: 28 }}>
            These Customer Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of the Visasra application, website (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>), and related services (&ldquo;Platform&rdquo;). By creating an account, adding money to your Visasra Wallet, booking a shopping slot, purchasing products, or otherwise using the Platform, you agree to these Terms.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>1. About Visasra</h2>
          <p>
            Visasra is a digital platform that enables customers, including customers located outside India, to purchase products from India through a shopping and delivery service. Customers can book shopping slots, provide their product requirements, and have an assigned Worker purchase the requested products on their behalf. The purchased products are then processed, verified, packaged, and arranged for delivery through the Company&rsquo;s verified logistics partners.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>2. Eligibility &amp; Customer Account</h2>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Customers must provide accurate and complete information when creating and using an account.</li>
            <li>Customers are responsible for keeping their passwords, OTPs, and account credentials secure.</li>
            <li>Customers must not share account access with another person or knowingly allow unauthorized use.</li>
            <li>Any suspected unauthorized access or transaction should be reported to Visasra promptly.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>3. Visasra Wallet Policy</h2>
          <p>
            The Visasra Wallet is a digital balance within the customer&rsquo;s Visasra account. It may be used for eligible purchases and services available through the Platform, including shopping slots and eligible products.
          </p>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>3.1 Adding Money to the Wallet</h3>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Customers may add money using payment methods made available by Visasra or its authorized payment gateway provider (Razorpay).</li>
            <li>Successfully processed payments will be credited directly to the customer&rsquo;s Wallet.</li>
            <li>Customers can view their available Wallet balance and transaction history in real-time through the Platform.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>3.2 Complementary Wallet Amount</h3>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Where a promotional offer applies, Visasra may provide a complementary/promotional Wallet amount of up to US$50, or another amount stated in the applicable offer, when a customer adds eligible funds.</li>
            <li>The complementary amount is a promotional benefit and is not a cash deposit made by the customer.</li>
            <li>The complementary amount cannot be withdrawn, transferred to a bank account, or exchanged for cash.</li>
            <li>It may be used only for eligible Visasra purchases and services, subject to the applicable promotional offer.</li>
            <li>Visasra may specify eligibility requirements, expiry periods, or other reasonable promotional conditions. Unless otherwise stated, promotional Wallet amounts are not transferable.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>3.3 No Cash Withdrawal</h3>
          <p>
            Wallet funds are intended strictly for use on the Visasra Platform and are not a general-purpose bank account or cash-withdrawal facility. Except where a refund is legally required to be made to the original payment method or otherwise required by applicable law, Wallet funds cannot be withdrawn as cash or transferred by the customer to a personal bank account.
          </p>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>3.4 Use of Wallet Funds</h3>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Wallet funds may be used to pay for eligible shopping slots, products, services, shipping, or other charges displayed as payable through the Wallet.</li>
            <li>The Wallet balance will be reduced by the exact amount used for an eligible transaction.</li>
            <li>If the Wallet balance is insufficient, the customer may pay the remaining shortfall amount using another available payment method via Razorpay.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>3.5 Wallet Refunds &amp; Credits</h3>
          <p>
            Where a refund is approved as Wallet credit under the separate Visasra Refund, Return &amp; Cancellation Policy, the approved amount will be credited to the customer&rsquo;s Wallet. Promotional Wallet credits remain subject to the applicable promotional terms.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>4. Wallet Security &amp; Unauthorized Transactions</h2>
          <p>
            Visasra takes rigorous technical and organizational measures to protect Wallet balances and account information. Wallet funds remain under the customer&rsquo;s account and must not be accessed or used by another person without authorization.
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Visasra will not knowingly authorize another person to use a customer&rsquo;s Wallet without authorization or a valid legal basis.</li>
            <li>Customers should contact Visasra support immediately if they notice an unauthorized Wallet transaction.</li>
            <li>Visasra may temporarily restrict an account or transaction when reasonably necessary to investigate suspected fraud, unauthorized access, security incidents, or regulatory requirements.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>5. Shopping Slot Bookings &amp; Non-Refundable Policy</h2>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Customers may use Wallet funds or Razorpay payment to book available shopping slots shown on the Platform. A slot is subject to availability and the terms displayed at the time of booking.</li>
            <li>Customers provide product requirements, style preferences, and merchant instructions through the Platform.</li>
            <li>Visasra assigns an in-store personal shopper (Worker) to perform the shopping assignment.</li>
            <li><b>Non-Cancellable and Non-Refundable Slot:</b> Once a shopping slot is successfully booked and confirmed, the customer cannot cancel the slot. The amount paid for the booked slot is non-refundable and will not be returned to the Wallet or original payment method, except where a refund is required by applicable law. The slot amount is charged for reserving the shopping service and allocating dedicated personnel, local travel, and operational resources.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>6. Product Purchases &amp; In-Store Transparency</h2>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Product catalog prices represent estimated budget ranges. Actual purchase prices are determined by merchant invoices and store receipts in India.</li>
            <li>Customers review product photos, varieties, and actual prices before confirming in-store purchases.</li>
            <li>If a requested product is unavailable, the customer may be offered verified alternatives or another available resolution.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>7. International Shipping &amp; Customs Duties</h2>
          <p>
            For eligible international orders, Visasra arranges and pays applicable customs duties, import taxes, and standard clearance fees through authorized logistics partners (DHL, FedEx, DTDC) under our separate Customs &amp; Duty Policy. Estimated delivery timelines may be subject to carrier schedules, weather, and destination customs inspections outside Visasra&rsquo;s reasonable control.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>8. Fees &amp; Payments</h2>
          <p>
            The total amount payable for an order or booking may include product price, shopping slot charges, service charges, international packaging, shipping charges, and applicable statutory taxes. All online transactions are processed through authorized payment gateway partners (Razorpay).
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>9. Customer Responsibilities</h2>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Provide accurate name, contact number, and complete international delivery address.</li>
            <li>Provide truthful and lawful product sourcing instructions.</li>
            <li>Do not misuse promotions, Wallet credits, refunds, or payment systems.</li>
            <li>Do not use another person&rsquo;s account or payment credentials without authorization.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>10. Prohibited Use</h2>
          <p>
            Users must not use the Platform for fraudulent transactions, attempting to obtain unauthorized Wallet credits, scraping data, or ordering prohibited, illicit, or legally restricted items under Indian export laws or international destination regulations.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>11. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes arising out of or related to these Terms shall be resolved first through mutual good-faith discussion with Visasra Customer Support. If unresolved, disputes are subject to the exclusive jurisdiction of the competent courts in Hyderabad, Telangana, India.
          </p>

          <div style={{ marginTop: 36, padding: 24, borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 16, color: '#09254A', marginBottom: 8, fontWeight: 700 }}>Contact Information</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>
              <b>Company Name:</b> Visasra Technologies<br />
              <b>Platform / App:</b> Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>)<br />
              <b>Support Email:</b> <a href="mailto:support@visasra.com" style={{ color: '#1B5AA6' }}>support@visasra.com</a> / <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a><br />
              <b>Support Phone / WhatsApp:</b> +91 91703 24144<br />
              <b>Registered Operating Address:</b> Hyderabad, Telangana 500033, India
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
