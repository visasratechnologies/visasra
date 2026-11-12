import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Visasra',
  description: 'Official Privacy Policy for Visasra Technologies and the Visasra platform.',
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Visasra
        </Link>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 6 }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 32 }}>
          Effective Date: November 2026 · <b>Visasra Technologies</b>
        </p>

        <section style={{ lineHeight: 1.75, fontSize: 15, color: '#334155' }}>
          <p style={{ background: '#F1F5F9', padding: '16px 20px', borderRadius: 12, borderLeft: '4px solid #1B5AA6', fontStyle: 'italic', marginBottom: 28 }}>
            This Privacy Policy explains how <b>Visasra Technologies</b> (&ldquo;Visasra&rdquo;, &ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, stores, shares, and protects personal information when you use the Visasra application, website (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>), and related services. By using Visasra, you acknowledge the practices described in this Policy, subject to your rights under applicable law.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>1. Information We Collect</h2>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>1.1 Information You Provide</h3>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Name, email address, phone number, and account credentials.</li>
            <li>Billing and international delivery address, postal code, and contact information required to fulfill an order.</li>
            <li>Order details, product preferences, shopping instructions, reference photos, and communications with customer support.</li>
            <li>Information provided by merchants, workers, or logistics partners when required to complete an order.</li>
            <li>Identity, address, or business verification information where required for personal shoppers, workers, or statutory legal compliance.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>1.2 Payment Information</h3>
          <p>
            Payments are securely processed through authorized third-party payment gateway providers such as <b>Razorpay</b>. Visasra receives transaction metadata such as payment status, transaction reference IDs, and timestamps. Payment card details, CVVs, netbanking credentials, and UPI MPINs are handled directly by the PCI-DSS compliant payment provider and are never stored on Visasra servers.
          </p>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 18, marginBottom: 8 }}>1.3 Automatically Collected Technical Information</h3>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Device type, operating system, and browser version.</li>
            <li>IP address and approximate regional location information.</li>
            <li>Log data, usage activity, and session interaction with the Platform.</li>
            <li>Essential session cookies used to maintain customer login and secure state.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>2. How We Use Information</h2>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Create, authenticate, and manage user and worker accounts.</li>
            <li>Process orders, concierge shopping requests, payments, refunds, and cancellations.</li>
            <li>Coordinate assigned personal shoppers and logistics partners to fulfill orders in India.</li>
            <li>Provide real-time order tracking, live shopping session photos, and customer support.</li>
            <li>Verify transactions, prevent fraud, and protect the security of the Platform.</li>
            <li>Communicate order updates, dispatch notices, and important security alerts.</li>
            <li>Comply with applicable legal, export-import, tax, and law-enforcement requirements.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>3. How We Share Information</h2>
          <p>
            We share information only as reasonably necessary to operate Visasra, fulfill requested orders, protect users, and comply with applicable law. <b>We do not sell personal information to third parties for independent marketing purposes.</b>
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Workers / Personal Shoppers:</b> Customer item instructions and delivery names necessary to procure the order.</li>
            <li><b>Logistics &amp; Shipping Partners (DHL, FedEx, DTDC):</b> Name, address, phone number, and package customs declaration required for physical delivery.</li>
            <li><b>Payment Providers (Razorpay):</b> Information necessary to process, verify, and settle customer payments and wallet transactions.</li>
            <li><b>Technology Infrastructure:</b> Cloud hosting, database management (PostgreSQL), and transactional email/SMS delivery.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>4. International Data Transfers</h2>
          <p>
            Because Visasra serves international clients procuring goods from India and utilizes global cloud infrastructure and courier services, personal data may be transferred, stored, or processed across jurisdictions. We take all reasonable administrative and technical measures required by applicable law to safeguard your information during such cross-border processing.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>5. Data Security &amp; Retention</h2>
          <p>
            We employ modern industry-standard security safeguards, including 256-bit SSL/TLS encryption, database-level encryption at rest, and strict role-based access restrictions. Personal information is retained only as long as necessary to provide active platform services, maintain transaction records for tax compliance, resolve disputes, and fulfill statutory legal obligations.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 28, marginBottom: 12 }}>6. Your Rights &amp; Choices</h2>
          <p>
            Depending on your jurisdiction and applicable data protection legislation, you may have rights to access personal records we hold, request corrections to inaccurate data, request account closure or data deletion (subject to legal record retention requirements), or withdraw consent for non-essential communications.
          </p>

          <div style={{ marginTop: 36, padding: 24, borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 16, color: '#09254A', marginBottom: 8, fontWeight: 700 }}>Contact Information &amp; Grievance Officer</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
              <b>Entity:</b> Visasra Technologies<br />
              <b>Platform:</b> Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>)<br />
              <b>Support Email:</b> <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a><br />
              <b>Phone:</b> +91 91703 24144<br />
              <b>Grievance Officer:</b> Hareharan Nagula, Visasra Technologies, Hyderabad, India
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
