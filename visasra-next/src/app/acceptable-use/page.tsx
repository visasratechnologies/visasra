import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | Visasra',
  description: 'Official Acceptable Use Policy for Visasra Technologies. Rules, standards, and safety guidelines for customers, workers, shoppers, and merchants.',
};

export default function AcceptableUsePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Visasra
        </Link>

        <div style={{ display: 'inline-block', background: '#E8F2FD', color: '#1B5AA6', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
          Platform Standards · Visasra Technologies
        </div>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 8 }}>
          Acceptable Use Policy
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 28 }}>
          Effective Date: November 2026 · Applicable to all users of Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>)
        </p>

        <section style={{ lineHeight: 1.75, fontSize: 15, color: '#334155' }}>
          <p>
            This Acceptable Use Policy (&quot;Policy&quot;) explains the rules and standards that apply to the use of Visasra (&quot;App&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operated by <b>Visasra Technologies</b>. By accessing or using our Platform, you agree to comply with this Policy. This Policy applies equally to customers, shoppers, workers, sellers/merchants, logistics partners, and any individual or entity accessing the Platform.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>1. Purpose</h2>
          <p>
            The purpose of this Policy is to maintain a safe, reliable, lawful, and respectful environment for everyone using our Platform. Users must use the Platform only for its intended purposes and in accordance with applicable Indian laws, destination-country laws, our Terms and Conditions, Privacy Policy, and other published guidelines.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>2. Permitted &amp; Acceptable Use</h2>
          <p>Users may access and use the Platform to:</p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Browse authentic Indian products, stores, categories, and shopping services available on the Platform.</li>
            <li>Book verified shopping slots with personal shoppers in Indian retail hubs.</li>
            <li>Purchase or request authentic Indian goods through authorized shoppers and merchants.</li>
            <li>Communicate with shoppers, workers, merchants, customer support, or official representatives through approved, monitored channels.</li>
            <li>Make legitimate payments for goods and services via authorized gateways (Razorpay, UPI, cards, NetBanking, Visasra Wallet).</li>
            <li>Track order status, slot schedules, fulfillment updates, air freight consignments, and delivery milestones.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>3. Prohibited Activities</h2>
          <p>Users, workers, and merchants must <b>never</b> use the Platform to:</p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Violate Applicable Laws:</b> Violate any applicable local, state, national, or international law, export control, or customs regulation.</li>
            <li><b>Illegal or Controlled Goods:</b> Purchase, sell, request, transport, or facilitate contraband, narcotics, prescription drugs without authorization, weapons, stolen property, or counterfeit items.</li>
            <li><b>Fraudulent Information:</b> Provide false, inaccurate, forged, or misleading identity, billing, or shipping information.</li>
            <li><b>Fake Accounts &amp; Impersonation:</b> Create duplicate/ghost accounts, impersonate another individual or business, or misrepresent affiliation with any entity.</li>
            <li><b>Unauthorized Account Access:</b> Log into or attempt to access another person&apos;s account, credentials, or session without explicit written permission.</li>
            <li><b>Platform Manipulation:</b> Artificially manipulate order statuses, bookings, slot availabilities, payment transactions, customer reviews, ratings, or referral credits.</li>
            <li><b>Security Compromises:</b> Attempt to gain unauthorized access to our servers, databases, infrastructure, or APIs, or probe, scan, or test vulnerabilities of our systems.</li>
            <li><b>Harassment &amp; Abuse:</b> Harass, threaten, abuse, defame, intimidate, stalk, or discriminate against other users, workers, personal shoppers, merchant staff, or Visasra representatives.</li>
            <li><b>Unauthorized Scraping &amp; Data Mining:</b> Collect, scrape, crawl, mirror, or harvest product data, pricing, catalog images, worker profiles, or customer details using bots, scripts, or automated scrapers.</li>
            <li><b>Malicious Software:</b> Introduce viruses, worms, Trojan horses, spyware, ransomware, or other malicious, destructive, or harmful code into the Platform.</li>
            <li><b>Payment Fraud &amp; Abuse:</b> Use stolen credit/debit cards, compromised UPI accounts, forged bank credentials, or fraudulently dispute legitimate, completed charges with card issuers.</li>
            <li><b>Off-Platform Solicitation:</b> Solicit workers or customers to complete transactions outside the Visasra platform in order to evade service fees, platform protections, or legal billing.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>4. Product and Service Restrictions</h2>
          <p>
            Users must not request, purchase, or transport products prohibited by Indian export regulations, carrier safety rules, or destination-country customs guidelines. Visasra reserves the absolute right to refuse, cancel, or impound any order involving items that pose legal, safety, bio-security, or regulatory hazards.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>5. User-Generated Content &amp; Reviews</h2>
          <p>
            Where the Platform allows users to submit reviews, store feedback, chat messages, photographs, or order instructions, users must ensure that all content is truthful, lawful, and free of defamatory, obscene, or infringing material.
          </p>
          <p>
            Content must not infringe third-party intellectual property rights, trademarks, or copyrights. Visasra reserves the right to moderate, hide, or delete content that violates this Policy.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>6. Account Responsibility &amp; Security</h2>
          <p>
            Users are solely responsible for safeguarding their login credentials (passwords, OTP codes, session tokens) and for all actions conducted through their accounts. If you suspect unauthorized access or a security breach, notify Visasra immediately at <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a>.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>7. Worker, Shopper &amp; Merchant Conduct</h2>
          <p>
            Personal shoppers, fulfillment partners, and merchants must adhere to the highest standards of integrity:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Provide genuine, itemized GST bills and accurate receipts for all sourced items.</li>
            <li>Treat customers and store personnel with dignity, honesty, and professionalism.</li>
            <li>Safeguard customer privacy and never use personal phone numbers or delivery addresses for personal communication or marketing.</li>
            <li>Never solicit or accept cash payments outside the authorized Visasra app billing flow.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>8. Reporting Violations</h2>
          <p>
            If you encounter any behavior, transaction, content, or product request that violates this Policy, please report it immediately to our Trust &amp; Safety Desk at <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a>. Please include relevant order numbers, screenshots, and supporting details.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>9. Enforcement Actions</h2>
          <p>
            If Visasra determines in its reasonable discretion that a user has violated this Policy, we may take immediate corrective action, including:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Issuing formal written warnings.</li>
            <li>Cancelling open shopping slots or active orders with forfeiture of fees.</li>
            <li>Freezing or locking Visasra Wallet balances associated with fraudulent activities.</li>
            <li>Temporarily suspending or permanently terminating account access.</li>
            <li>Reporting severe violations (fraud, theft, threats, illicit trade) to cybercrime cells and law enforcement authorities.</li>
          </ul>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>10. No Circumvention</h2>
          <p>
            Users must not attempt to bypass, circumvent, or defeat any restriction, account suspension, geographic block, or security control enforced by Visasra. Creating alternate accounts following suspension is strictly prohibited and will result in permanent blacklisting.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>11. Policy Modifications</h2>
          <p>
            Visasra may update this Acceptable Use Policy periodically to adapt to changing legal requirements, security standards, and platform capabilities. Updates take effect immediately upon publication on the Platform.
          </p>

          <h2 style={{ fontSize: 20, color: '#09254A', marginTop: 32, marginBottom: 12 }}>12. Contact &amp; Governance</h2>
          <div style={{ background: '#F1F5F9', borderRadius: 10, padding: '16px 20px', marginTop: 12, lineHeight: 1.8 }}>
            <div><b>Entity:</b> Visasra Technologies</div>
            <div><b>Platform:</b> Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>)</div>
            <div><b>Support Email:</b> <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a></div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
            <Link href="/terms" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Customer Terms &amp; Conditions →
            </Link>
            <Link href="/worker-terms" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Worker Terms &amp; Agreement →
            </Link>
            <Link href="/privacy" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Privacy Policy →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

