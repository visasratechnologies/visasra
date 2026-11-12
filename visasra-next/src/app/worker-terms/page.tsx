import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Worker Terms, Conditions & Agreement | Visasra',
  description: 'Official Worker Terms, Conditions, Slot Attendance, Penalty Rules, Payment Policy, and Personal Shopper Agreement for Visasra Technologies.',
};

export default function WorkerTermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', background: '#FFFFFF', borderRadius: 20, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Link href="/worker" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1B5AA6', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          ← Back to Partner Portal
        </Link>

        <div style={{ display: 'inline-block', background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
          Official Partner Policy · Visasra Technologies
        </div>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, color: '#09254A', marginBottom: 8 }}>
          Worker Terms, Conditions &amp; Agreement
        </h1>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 28 }}>
          Version 1.0 · Effective Date: November 2026 · Applicable to all verified personal shoppers and field partners
        </p>

        {/* Quick Nav Anchor Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          <a href="#attendance" style={{ background: '#F1F5F9', color: '#1B5AA6', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Slot Attendance &amp; Penalties ↓
          </a>
          <a href="#payments" style={{ background: '#F1F5F9', color: '#1B5AA6', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Payment &amp; Payout Structure ↓
          </a>
          <a href="#agreement" style={{ background: '#F1F5F9', color: '#1B5AA6', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Partner Service Agreement &amp; NDA ↓
          </a>
          <a href="#code-of-conduct" style={{ background: '#F1F5F9', color: '#1B5AA6', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Code of Conduct ↓
          </a>
        </div>

        <section style={{ lineHeight: 1.75, fontSize: 15, color: '#334155' }}>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '18px 22px', marginBottom: 28 }}>
            <b style={{ color: '#1E40AF', fontSize: 15 }}>Operational Context</b>
            <p style={{ color: '#1E3A8A', fontSize: 14, margin: '6px 0 0', lineHeight: 1.6 }}>
              Visasra Technologies operates an online platform connecting global customers with personal shoppers in India. Personal shoppers (&quot;Workers&quot; or &quot;Partners&quot;) are assigned to customer shopping slots to source authentic products from local retail stores, verify items, collect valid GST tax bills, and safely transport goods to designated Visasra fulfillment hubs for export packaging.
            </p>
          </div>

          {/* ================= SECTION 1: ATTENDANCE & PUNCTUALITY ================= */}
          <h2 id="attendance" style={{ fontSize: 22, color: '#09254A', marginTop: 36, marginBottom: 12, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
            Part A: Slot Attendance, Punctuality &amp; Penalties Policy
          </h2>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>1. Acceptance of a Shopping Slot</h3>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>A Worker should accept a slot only when they are reasonably able to report on time and complete the sourcing assignment within the scheduled window.</li>
            <li>Once an assignment is accepted, the Worker is expected to remain available and present at the assigned store location at the scheduled start time.</li>
            <li>The Worker must carefully review the assigned store address, shopping list, customer instructions, and allotted time before accepting the slot.</li>
            <li><b>Slot Transfer Strictly Prohibited:</b> The Worker shall not transfer, delegate, or sub-assign an accepted slot to another individual without prior written approval from Visasra Admin.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>2. Reporting &amp; Grace Period</h3>
          <p>
            The Worker must report at the assigned store location at the scheduled slot start time. Attendance is verified via the Visasra Partner App through geo-location check-in, live status updates, or photo upload at the venue.
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Standard Grace Period:</b> <b>15 minutes</b> from scheduled slot start time.</li>
            <li>If a Worker anticipates unavoidable delay due to traffic or weather, they must immediately inform Visasra Support via the partner portal before the grace period expires.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>3. Late Arrival &amp; Payment Adjustment Schedule</h3>
          <p>
            Timely attendance is essential to protect customer schedules and store hours. Where a Worker arrives late without a pre-approved valid reason, the following transparent adjustments apply:
          </p>

          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', color: '#09254A' }}>
                  <th style={{ padding: '12px 14px', border: '1px solid #CBD5E1' }}>Delay Threshold</th>
                  <th style={{ padding: '12px 14px', border: '1px solid #CBD5E1' }}>Operational Action</th>
                  <th style={{ padding: '12px 14px', border: '1px solid #CBD5E1' }}>Adjustment / Penalty</th>
                  <th style={{ padding: '12px 14px', border: '1px solid #CBD5E1' }}>Impact on Account</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}><b>Within Grace Period (0–15 mins)</b></td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>Normal slot processing</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0', color: '#166534', fontWeight: 600 }}>₹0 (No penalty)</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>Full rating maintained</td>
                </tr>
                <tr style={{ background: '#FFFBEB' }}>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}><b>16 to 30 minutes late</b></td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>Customer notified of delay</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0', color: '#B45309', fontWeight: 600 }}>15% base slot deduction</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>Soft warning logged</td>
                </tr>
                <tr style={{ background: '#FEF2F2' }}>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}><b>31 to 45 minutes late</b></td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>Store time compressed</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0', color: '#DC2626', fontWeight: 600 }}>30% base slot deduction</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>Punctuality score reduced</td>
                </tr>
                <tr style={{ background: '#FEE2E2' }}>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}><b>Over 45 minutes late / No Show</b></td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>Slot re-assigned to backup shopper</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0', color: '#991B1B', fontWeight: 700 }}>100% slot fee forfeited</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #E2E8F0' }}>Temporary slot restriction / suspension</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>4. Exceptions Where No Late Penalty Applies</h3>
          <p>Visasra waives late adjustments in genuine, verified extenuating circumstances:</p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Store Delays:</b> Unexpected store queues, delayed store opening, or vendor inventory retrieval delays beyond Worker control.</li>
            <li><b>Customer Rescheduling:</b> Customer requested a time change or delayed answering required sizing/product selection messages.</li>
            <li><b>Genuine Emergencies:</b> Verified medical emergency, accident, or documented vehicular breakdown, provided the Worker notifies Visasra Support as soon as safe and possible.</li>
            <li><b>Platform Technical Issues:</b> App check-in failure due to verified network or server downtime, confirmed with photographic evidence.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>5. Last-Minute Slot Cancellations &amp; No-Shows</h3>
          <p>
            Cancellations made less than <b>4 hours before scheduled slot start time</b> severely disrupt customer bookings. Frequent unexcused cancellations or no-shows will lead to slot access restrictions or permanent removal from the Visasra Partner Network.
          </p>

          {/* ================= SECTION 2: PAYMENTS & PAYOUTS ================= */}
          <h2 id="payments" style={{ fontSize: 22, color: '#09254A', marginTop: 36, marginBottom: 12, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
            Part B: Worker Payment &amp; Payout Terms
          </h2>
          <p>
            Personal shoppers receive guaranteed payments for every successfully fulfilled shopping slot and hub handover:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Standard Base Slot Pay:</b> ₹350 per 2-hour shopping slot completed with verified bills and hub handover.</li>
            <li><b>Extended Slot / Task Pay:</b> Additional ₹150 per extra hour when pre-approved for multi-stop sourcing.</li>
            <li><b>Fuel &amp; Travel Reimbursement:</b> Pre-approved travel allowances for sourcing assignments requiring inter-city or long-distance travel.</li>
            <li><b>Performance Incentives:</b> Monthly bonuses for shoppers maintaining 100% on-time attendance and 5-star customer ratings.</li>
            <li><b>Payout Cycle:</b> Earnings are settled weekly or on designated settlement days directly to the Worker&apos;s verified bank account or UPI ID registered in the Partner Portal.</li>
          </ul>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, marginBottom: 24 }}>
            <b>Dispute Window for Adjustments:</b> If a Worker believes a payment adjustment was calculated erroneously, they may file a review request with the Partner Operations Desk within <b>7 business days</b> of the statement date. Operations will review GPS logs and bill timestamps and rectify legitimate discrepancies.
          </div>

          {/* ================= SECTION 3: WORKER AGREEMENT & NDA ================= */}
          <h2 id="agreement" style={{ fontSize: 22, color: '#09254A', marginTop: 36, marginBottom: 12, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
            Part C: Personal Shopper Assignment Agreement &amp; NDA
          </h2>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>1. Duties and Quality Verification</h3>
          <p>The Worker agrees to:</p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Faithfully purchase items according to the customer&apos;s exact order specifications (brand, size, colour, material, quantity).</li>
            <li>Thoroughly inspect all merchandise for defects, stains, tears, missing parts, or expiry dates before paying the merchant.</li>
            <li>Always collect and upload authentic, itemized GST tax invoices/bills for every item purchased. Handwritten or unofficial chits without merchant GST details are unacceptable.</li>
            <li>Safeguard all purchased goods and deliver them without delay to the Visasra fulfillment hub in original store condition.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>2. Handling of Funds &amp; Anti-Fraud</h3>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>All advance sourcing funds or shopping allowances provided by Visasra or customers must be used solely for authorized item purchases.</li>
            <li>Workers must account for every rupee spent with exact matching merchant receipts and return any unspent balances to Visasra immediately.</li>
            <li>Submitting forged, inflated, or falsified bills is a criminal offense under Indian law. Visasra will take immediate legal action and lodge formal police complaints for intentional fraud or embezzlement.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>3. Non-Disclosure &amp; Customer Data Privacy (NDA)</h3>
          <p>
            In the course of performing assignments, Workers may receive confidential customer details, including names, contact numbers, residential delivery addresses, and personal shopping preferences.
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>Workers shall use customer details strictly to fulfill the active assignment.</li>
            <li>Workers must <b>never</b> store customer phone numbers, contact customers for personal reasons, share customer details with third parties, or market independent services to customers.</li>
            <li>This non-disclosure obligation survives perpetually even after cessation of the Worker&apos;s engagement with Visasra.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>4. Accident, Safety &amp; Insurance Policy</h3>
          <p>
            Workers must strictly adhere to Indian traffic regulations, wear helmets/seatbelts, and exercise reasonable care while travelling between retail stores.
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li>In the event of an unfortunate road mishap or emergency during an active assignment, the Worker must prioritize medical safety and notify Visasra Partner Support as soon as feasible.</li>
            <li>Where eligible personal accident insurance is extended by Visasra, claim assistance will be coordinated according to the underwriter&apos;s statutory policy terms. Accidents resulting from intoxication, gross negligence, or unauthorized personal deviations are excluded.</li>
          </ul>

          {/* ================= SECTION 4: CODE OF CONDUCT ================= */}
          <h2 id="code-of-conduct" style={{ fontSize: 22, color: '#09254A', marginTop: 36, marginBottom: 12, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
            Part D: Professional Code of Conduct &amp; Prohibited Actions
          </h2>
          <p>Personal shoppers represent Visasra at local Indian merchants and in interactions with global customers. The following standards are mandatory:</p>
          <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
            <li><b>Zero Tolerance for Harassment:</b> Harassment, discrimination, abusive language, or inappropriate conduct toward customers, store staff, or Visasra employees results in immediate permanent blacklisting.</li>
            <li><b>Sobriety:</b> Performing shopping assignments under the influence of alcohol, drugs, or intoxicating substances is strictly prohibited.</li>
            <li><b>No Private Dealing:</b> Workers shall not solicit or conduct private off-platform transactions with Visasra customers or accept kickbacks/commissions from merchants.</li>
            <li><b>Return of Company Property:</b> Upon account termination, the Worker must return any badges, credentials, equipment, or funds belonging to Visasra.</li>
          </ul>

          <h3 style={{ fontSize: 17, color: '#09254A', marginTop: 20, marginBottom: 8 }}>Governing Law &amp; Jurisdiction</h3>
          <p>
            These Worker Terms, Conditions, and Assignment Agreement are governed by and construed in accordance with the substantive laws of India. Any disputes arising out of or in connection with this agreement shall be subject to the exclusive jurisdiction of the competent courts in <b>Hyderabad, Telangana, India</b>.
          </p>

          <div style={{ background: '#F1F5F9', borderRadius: 10, padding: '16px 20px', marginTop: 20, lineHeight: 1.8 }}>
            <div><b>Entity:</b> Visasra Technologies</div>
            <div><b>Platform:</b> Visasra (<a href="https://www.visasra.com" style={{ color: '#1B5AA6' }}>www.visasra.com</a>)</div>
            <div><b>Support Email:</b> <a href="mailto:visasratechnologies@gmail.com" style={{ color: '#1B5AA6' }}>visasratechnologies@gmail.com</a></div>
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
            <Link href="/worker" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              ← Return to Partner Portal
            </Link>
            <Link href="/acceptable-use" style={{ color: '#1B5AA6', fontWeight: 600 }}>
              Acceptable Use Policy →
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

