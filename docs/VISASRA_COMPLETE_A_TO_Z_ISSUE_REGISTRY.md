# VISASRA MASTER DEFECT & ISSUE REGISTRY (A TO Z COMPLETE AUDIT)
## Comprehensive Forensic Code-Level Inspection & Systemic Defect Catalog

**Audit Date:** November 2026  
**Auditor:** Co-Founder, CTO, Senior Architect & Lead QA Engineer  
**Classification:** STRICT COMPREHENSIVE DEFECT SPECIFICATION  
**Scope:** 100% of all API routes, pages, components, schemas, scripts, and stylesheets in `d:\visasra-final\visasra-next`

---

## TABLE OF CONTENTS
1. [Domain 1: Financial, Payment & Wallet Exploits (F-01 – F-08)](#domain-1-financial-payment--wallet-exploits)
2. [Domain 2: Authentication, Authorization & Session Bypasses (A-01 – A-09)](#domain-2-authentication-authorization--session-bypasses)
3. [Domain 3: Core Business Logic Failures & Silent Money Loss (L-01 – L-10)](#domain-3-core-business-logic-failures--silent-money-loss)
4. [Domain 4: Data Overexposure, IDOR & Privacy Violations (P-01 – P-07)](#domain-4-data-overexposure-idor--privacy-violations)
5. [Domain 5: Fake Stubs, Phantom Logic & Mock Fallbacks (S-01 – S-08)](#domain-5-fake-stubs-phantom-logic--mock-fallbacks)
6. [Domain 6: Customer Portal UI/UX, Images & Broken Interactions (U-01 – U-12)](#domain-6-customer-portal-uiux-images--broken-interactions)
7. [Domain 7: Worker Dashboard Ergonomics & Field Operations Gaps (W-01 – W-08)](#domain-7-worker-dashboard-ergonomics--field-operations-gaps)
8. [Domain 8: Admin Operations Flaws & Data Sprawl (M-01 – M-07)](#domain-8-admin-operations-flaws--data-sprawl)
9. [Domain 9: Database Schema, Floating-Point & Migration Anti-Patterns (D-01 – D-08)](#domain-9-database-schema-floating-point--migration-anti-patterns)
10. [Domain 10: Performance Bottlenecks, Polling Latency & Serverless Crashes (T-01 – T-06)](#domain-10-performance-bottlenecks-polling-latency--serverless-crashes)

---

## DOMAIN 1: FINANCIAL, PAYMENT & WALLET EXPLOITS

### F-01: Free Money Exploit via Razorpay Signature Bypass
- **Exact File & Lines:** `src/app/api/wallet/route.ts` (Lines 47–121)
- **The Defect:** HMAC SHA-256 signature verification only runs inside `if (razorpayPaymentId || razorpayOrderId)`. If an attacker submits `POST /api/wallet` with `{ "userId": "...", "amount": 500000 }` and omits payment IDs, the signature check is skipped entirely. PostgreSQL immediately increments `User.walletBalance` by ₹5,00,000 for free.
- **Severity:** P0 – Critical
- **Remediation:** Enforce mandatory Razorpay payment ID and cryptographically verify signature before any increment, or migrate exclusively to Razorpay Server-to-Server Webhooks (`payment.captured`).

### F-02: Payment Replay Vulnerability (Missing Idempotency)
- **Exact File & Lines:** `src/app/api/wallet/route.ts` (Lines 106–121)
- **The Defect:** `razorpayPaymentId` is not constrained as unique in `WalletTransaction` or a dedicated `Payment` table. An attacker with a single valid ₹10 transaction ID can replay the exact same payload 1,000 times, multiplying their balance.
- **Severity:** P0 – Critical
- **Remediation:** Add unique constraint on `razorpayPaymentId` in PostgreSQL and reject duplicate attempts with HTTP 409 Conflict.

### F-03: Race Condition on Option Approval Driving Wallet Negative
- **Exact File & Lines:** `src/app/api/live/[slotKey]/products/[itemId]/options/[optionId]/approve/route.ts` (Lines 52–66)
- **The Defect:** `if (liveSession.user.walletBalance < totalAmount)` is executed *outside* the PostgreSQL transaction. Two concurrent parallel approval requests will both pass the check and decrement the balance, driving `walletBalance` below zero.
- **Severity:** P1 – High
- **Remediation:** Include conditional guard inside atomic SQL update: `where: { id: userId, walletBalance: { gte: totalAmount } }`.

### F-04: Unverified Administrative Arbitrary Refunds
- **Exact File & Lines:** `src/app/api/admin/action/route.ts` (Lines 75–110)
- **The Defect:** Admin refund action takes `const refundAmount = Number(amount) || order.totalAmount`. Anyone calling this with `amount: 10000000` credits ₹1 crore to the target user's wallet with zero authorization checks or bounds checking against original payment amounts.
- **Severity:** P0 – Critical
- **Remediation:** Cap refund amounts strictly to `Order.totalAmount` minus already refunded amounts; require signed 2-step financial operator authorization.

### F-05: Worker Balance Decrement to Negative on Payout
- **Exact File & Lines:** `src/app/api/admin/action/route.ts` (Lines 150–163)
- **The Defect:** `walletBalance: { decrement: Math.max(0, payoutAmt) }` runs with no minimum balance validation. If executed on a worker with ₹0 balance, their balance drops to -₹1,000.
- **Severity:** P1 – High
- **Remediation:** Verify `worker.walletBalance >= payoutAmt` before decrementing.

### F-06: Missing Transaction Ledger on Worker Payouts
- **Exact File & Lines:** `src/app/api/admin/action/route.ts` (Lines 150–163) & `api/worker/jobs/route.ts` (Lines 142–154)
- **The Defect:** When worker balance is decremented for payout, no record is created in any payout or transaction history table. Money vanishes from the worker's balance with zero audit trail.
- **Severity:** P1 – High
- **Remediation:** Create `WorkerPayoutTransaction` table in Prisma schema with status (`requested`, `processed`, `failed`), UTR number, and timestamp.

### F-07: Unauthenticated Shop QR Counter Payment Clearance
- **Exact File & Lines:** `src/app/api/admin/payments/approve/route.ts` (Lines 4–16)
- **The Defect:** Endpoint accepts `{ itemId, proofUrl }` and directly updates `shopPaymentStatus = 'paid'` on the target `OrderItem` in PostgreSQL with zero authentication check whatsoever.
- **Severity:** P0 – Critical
- **Remediation:** Require signed admin session token.

### F-08: Currency Floating-Point Rounding Drift
- **Exact File & Lines:** `prisma/schema.prisma` (`User.walletBalance`, `WalletTransaction.amount`, `ProductOption.price`, `Order.totalAmount`)
- **The Defect:** All monetary values use IEEE-754 `Float` (`DOUBLE PRECISION`). Repeated additions and deductions result in rounding errors (e.g. `₹1,499.99999998`), breaking balance checks.
- **Severity:** P1 – High
- **Remediation:** Migrate all monetary fields to `Decimal(12, 2)` or integer paise.

---

## DOMAIN 2: AUTHENTICATION, AUTHORIZATION & SESSION BYPASSES

### A-01: Universal User Authentication Bypass & IDOR in `session.ts`
- **Exact File & Lines:** `src/lib/session.ts` (Lines 119–156)
- **The Defect:** `getUserFromRequest` checks `searchParams.get('email')` and `searchParams.get('userId')`. Any caller who provides `?email=victim@example.com` is treated as fully authenticated as that victim.
- **Severity:** P0 – Critical
- **Remediation:** Delete lines 119–156. Enforce strict `Authorization: Bearer <token>` or `HttpOnly` session cookies.

### A-02: Open Admin Backdoor via Spoofed `x-admin-email` Header
- **Exact File & Lines:** `src/app/api/admin/data/route.ts` (Lines 6–17) & `api/admin/action/route.ts` (Lines 6–17)
- **The Defect:** Admin authentication checks only if `x-admin-email` header matches an email in the `Admin` table. Anyone sending `x-admin-email: admin@visasra.com` via curl or Postman gains unrestricted administrative control.
- **Severity:** P0 – Critical
- **Remediation:** Implement cryptographically signed JWT admin session cookies.

### A-03: Fake Dummy Admin Session Token
- **Exact File & Lines:** `src/app/api/admin/login/route.ts` (Line 74)
- **The Defect:** Login handler returns `token: 'admin_session_' + Date.now()`. This token is never saved in the database and never validated on subsequent requests.
- **Severity:** P1 – High
- **Remediation:** Issue real signed JWT or persist session in a database `AdminSession` table.

### A-04: Fake Dummy Worker Session Token
- **Exact File & Lines:** `src/app/api/worker/login/route.ts` (Line 59)
- **The Defect:** Login handler returns `token: 'worker_session_' + Date.now()`, which is never stored or validated.
- **Severity:** P1 – High
- **Remediation:** Create `WorkerSession` model and validate worker bearer tokens.

### A-05: Missing Rate Limiting on 6-Digit Email OTP Verification
- **Exact File & Lines:** `src/lib/otp.ts` (Lines 78–114)
- **The Defect:** No failure attempt counter. An attacker can brute-force all 1,000,000 possible 6-digit codes within the 15-minute validity window.
- **Severity:** P1 – High
- **Remediation:** Invalidate OTP after 5 failed attempts; enforce IP-based rate limiting via Upstash Redis.

### A-06: OTP Email Bombing / Quota Exhaustion
- **Exact File & Lines:** `src/lib/otp.ts` (Lines 16–73)
- **The Defect:** No rate limit on requesting OTPs. An attacker can script thousands of OTP requests to target emails, depleting the Resend email tier.
- **Severity:** P2 – Medium
- **Remediation:** Enforce a 60-second cooldown per email/IP.

### A-07: Hardcoded Production Database Credentials in Source Code
- **Exact File & Lines:** `src/lib/prisma.ts` (Lines 3–6)
- **The Defect:** Plain-text Supabase connection strings containing database password `visasra123*` and pooler hosts are hardcoded in source.
- **Severity:** P1 – High
- **Remediation:** Rotate Supabase password immediately; delete source code strings.

### A-08: Reviewer Backdoor Account with Hardcoded Balance
- **Exact File & Lines:** `src/app/api/auth/login/route.ts` (Lines 76–126)
- **The Defect:** Hardcoded login credentials `reviewer@razorpay.com` / `VisasraTest@2026` auto-create an account loaded with ₹25,000 balance.
- **Severity:** P1 – High
- **Remediation:** Remove hardcoded credentials from production routes.

### A-09: Unauthenticated Admin Stats Dump
- **Exact File & Lines:** `src/app/api/admin/stats/route.ts` (Lines 4–46)
- **The Defect:** Has zero authentication checks. Any unauthenticated caller can query total orders, worker KYC lists, and pending shop payment QR records.
- **Severity:** P0 – Critical
- **Remediation:** Require admin session validation.

---

## DOMAIN 3: CORE BUSINESS LOGIC FAILURES & SILENT MONEY LOSS

### L-01: Silent Money Loss on Customer "Change Decision" (Undo)
- **Exact File & Lines:** `src/components/tabs/LiveShoppingTab.tsx` (Line 223) & `api/live/.../reject/route.ts` (Lines 12–16)
- **The Defect:** When an approved option is undone via "Change Decision", `reject/route.ts` sets `status = 'rejected'` but **never refunds the debited amount to the user's wallet**. The customer loses their money permanently with no ledger record.
- **Severity:** P0 – Critical (Direct customer funds theft bug)
- **Remediation:** Inside `reject/route.ts`, check if the option was previously approved; if so, atomically credit `approvedAmount` back to `User.walletBalance` and create a `WalletTransaction` refund row.

### L-02: Double Billing on Re-Approval of Rejected Option
- **Exact File & Lines:** `src/app/api/live/.../approve/route.ts` (Line 41)
- **The Defect:** Idempotency only checks `if (option.status === 'approved')`. If an option was rejected and then re-approved, it executes a second debit on the customer's wallet.
- **Severity:** P1 – High
- **Remediation:** Verify previous transaction history before executing additional debits.

### L-03: Post-Purchase Customer Cancellation Glitch
- **Exact File & Lines:** `src/app/api/live/.../reject/route.ts` (Lines 12–32)
- **The Defect:** No check prevents a customer from rejecting an option *after* the worker has already paid the shop cashier (`shopPaymentStatus === 'paid'`).
- **Severity:** P1 – High
- **Remediation:** Block rejection if `orderItem.status === 'purchased'` or `orderItem.shopPaymentStatus === 'paid'`.

### L-04: Phantom Worker Payout Request (Unprocessed Payouts)
- **Exact File & Lines:** `src/components/worker/WorkerEarnTab.tsx` (Lines 75 & 102) & `api/worker/jobs/route.ts` (Lines 142–154)
- **The Defect:** Clicking "Withdraw full balance" decrements the worker's wallet balance in PostgreSQL, but **no payout is ever dispatched**, no bank transfer is queued, and no notification is sent to Admin. Worker balance drops to 0, but they receive zero money.
- **Severity:** P0 – Critical
- **Remediation:** Create a `PayoutRequest` model in PostgreSQL, queue it for admin processing via RazorpayX, and only decrement balance upon confirmed bank settlement.

### L-05: Missing Customer Instructions on Worker Screen
- **Exact File & Lines:** `src/app/worker/page.tsx` & `api/worker/jobs/route.ts` (Lines 9–48)
- **The Defect:** `Order.customerNotes` (e.g. *"Ensure pure zari, no polyester"*) is not selected or displayed on the Worker portal. Ground shoppers shop blind without customer requirements.
- **Severity:** P1 – High
- **Remediation:** Include `order.customerNotes` in `api/worker/jobs` query and display prominently in active job card.

### L-06: Automatic ₹350 Worker Over-Crediting on Handover
- **Exact File & Lines:** `src/app/api/admin/action/route.ts` (Lines 278–286)
- **The Defect:** Every time an admin clicks "Verify Handover", `worker.walletBalance` increments by ₹350 with no idempotency guard. Clicking the button twice credits ₹700.
- **Severity:** P1 – High
- **Remediation:** Check if session stage is already `packed`/`completed` before incrementing.

### L-07: Unchecked Order Status Transitions
- **Exact File & Lines:** `src/app/api/admin/action/route.ts` (Lines 294–362)
- **The Defect:** Orders can be marked "shipped" or "delivered" even if individual items have not been purchased or approved.
- **Severity:** P2 – Medium
- **Remediation:** Enforce state machine validation: cannot ship an order with unpurchased items.

### L-08: Lack of Delivery Address Validation in Order Placement
- **Exact File & Lines:** `src/app/api/orders/route.ts` (Lines 62–70)
- **The Defect:** `POST /api/orders` accepts orders without validating whether `shippingAddress` contains valid international postal codes, recipient names, or phone numbers.
- **Severity:** P2 – Medium
- **Remediation:** Validate required address fields before creating `Order`.

### L-09: Unvalidated Custom Item Budget Ranges
- **Exact File & Lines:** `src/app/api/orders/route.ts` (Lines 87–110)
- **The Defect:** Custom items can be submitted with negative or zero estimated price ranges (`estMin <= 0`), breaking budget reservations.
- **Severity:** P2 – Medium
- **Remediation:** Enforce `estMin > 0` and `estMax >= estMin`.

### L-10: Cart Item Price Tampering
- **Exact File & Lines:** `src/app/api/cart/route.ts` (Lines 87–130)
- **The Defect:** Client sends `priceMin` and `priceMax` in POST body. The server does not cross-check these prices against `ProductCatalog` in the database, allowing client-side price tampering.
- **Severity:** P1 – High
- **Remediation:** Look up catalog prices on the server when `productId` is provided.

---

## DOMAIN 4: DATA OVEREXPOSURE, IDOR & PRIVACY VIOLATIONS

### P-01: Mass Exposure of Worker Aadhaar, PAN & Bank Details
- **Exact File & Lines:** `src/app/api/worker/jobs/route.ts` (Lines 53–81)
- **The Defect:** Querying `GET /api/worker/jobs?workerId=<id>` without authentication returns the worker's complete 12-digit Aadhaar, PAN, DL, bank account, IFSC code, and live GPS coordinates.
- **Severity:** P0 – Critical
- **Remediation:** Require authenticated worker session; mask all sensitive PII (`XXXX-XXXX-1234`).

### P-02: Global Customer Directory Dump in Admin Dashboard
- **Exact File & Lines:** `src/app/api/admin/data/route.ts` (Lines 59–66)
- **The Defect:** Admin API queries and dumps **every single customer in the database**, along with their full transaction ledger, email, phone, and wallet balance on every page load.
- **Severity:** P1 – High
- **Remediation:** Remove full user dump from main telemetry; implement paginated, search-only customer inspection.

### P-03: Unauthenticated Order Inspection by IDOR
- **Exact File & Lines:** `src/app/api/orders/route.ts` (Lines 4–25)
- **The Defect:** `GET /api/orders?all=true` or `GET /api/orders?userId=...` has zero session token checks. Any caller can view any customer's orders, recipient names, and delivery addresses.
- **Severity:** P0 – Critical
- **Remediation:** Resolve user strictly from verified session token; only superadmins may query `all=true`.

### P-04: Unauthenticated Address Deletion (IDOR)
- **Exact File & Lines:** `src/app/api/user/addresses/route.ts` (Lines 120–131)
- **The Defect:** `DELETE /api/user/addresses?id=<addressId>` deletes the address with no session check and no ownership verification. Any user can delete any other user's saved addresses.
- **Severity:** P0 – Critical
- **Remediation:** Enforce session check and `where: { id, userId: caller.id }`.

### P-05: Unauthenticated Worker Bank Account Hijacking
- **Exact File & Lines:** `src/app/api/worker/bank/route.ts` (Lines 4–57)
- **The Defect:** Anyone can submit `POST /api/worker/bank` with another worker's ID or phone number and update their payout UPI to an attacker-controlled account.
- **Severity:** P0 – Critical
- **Remediation:** Require authenticated worker bearer token.

### P-06: Unauthenticated Live Session Tracking & Worker Eavesdropping
- **Exact File & Lines:** `src/app/api/live/[slotKey]/route.ts` (Lines 4–40) & `api/tracking/[slotKey]/route.ts` (Lines 4–37)
- **The Defect:** Live sessions and order tracking endpoints have zero authentication. Anyone guessing a slot key can track worker GPS coordinates and customer orders.
- **Severity:** P1 – High
- **Remediation:** Verify that the caller is either the order's owner, assigned worker, or admin.

### P-07: Unauthenticated Review Manipulation
- **Exact File & Lines:** `src/app/api/worker/reviews/route.ts` (Lines 4–65)
- **The Defect:** Anyone can POST fake 1-star or 5-star reviews for any worker by supplying arbitrary `userId` and `workerId`.
- **Severity:** P2 – Medium
- **Remediation:** Verify caller session and confirm caller placed an order with that worker.

---

## DOMAIN 5: FAKE STUBS, PHANTOM LOGIC & MOCK FALLBACKS

### S-01: Hardcoded ₹2,440 Approved Items Fallback
- **Exact File & Lines:** `src/components/tabs/LiveShoppingTab.tsx` (Line 39)
- **The Defect:** `const approvedIt  emsTotal = ... || 2440;`. New sessions with 0 approved items falsely display ₹2,440 approved.
- **Severity:** P1 – High
- **Remediation:** Delete `|| 2440`; fallback strictly to `0`.

### S-02: Fabricated DHL / FedEx Airway Bill Generation
- **Exact File & Lines:** `src/app/api/admin/action/route.ts` (Line 298)
- **The Defect:** Fabricates fake tracking number `'EXP-' + Math.floor(...)` if left blank by admin.
- **Severity:** P1 – High
- **Remediation:** Require real tracking number before marking shipped.

### S-03: Hardcoded Ramesh Kumar Tracking Fallback
- **Exact File & Lines:** `src/app/api/tracking/[slotKey]/route.ts` (Line 43)
- **The Defect:** Default tracking stage note hardcodes: `"Ramesh Kumar (+91 98765 43210)"` if worker is not loaded.
- **Severity:** P2 – Medium
- **Remediation:** Replace with neutral string: `"Awaiting Ground Shopper Assignment"`.

### S-04: Fake Order Number Generator on Frontend
- **Exact File & Lines:** `src/app/page.tsx` (Line 2128)
- **The Defect:** Client generates random order number: `orderNumber: VIS-${Math.floor(10000 + Math.random() * 90000)}` instead of using database sequence.
- **Severity:** P2 – Medium
- **Remediation:** Rely exclusively on server-generated unique order numbers.

### S-05: Conflicting Seed Scripts (Catalog Saree Erasure)
- **Exact File & Lines:** `src/scripts/seed-complete-catalog.ts` (Line 399) vs `prisma/seed.mjs`
- **The Defect:** Running `seed-complete-catalog.ts` deletes all authentic handloom silk sarees and temple jewelry, replacing them with generic cookware spoons and knives.
- **Severity:** P1 – High
- **Remediation:** Consolidate into a single authoritative seed script preserving authentic Indian cultural items.

### S-06: Broken Path Crash in `compare-catalog.ts`
- **Exact File & Lines:** `src/scripts/compare-catalog.ts` (Line 5)
- **The Defect:** Hardcodes `fs.readFileSync('d:/visasra-suite/visasra-app/app.js')`, which does not exist and crashes with `ENOENT`.
- **Severity:** P2 – Medium
- **Remediation:** Update to read from current project directory or remove obsolete script.

### S-07: Placeholder Image Filtering Hack
- **Exact File & Lines:** `src/lib/placeholders.ts` (Lines 18–23)
- **The Defect:** Hardcodes string check `!image.includes('pooja-spiritual.jpg')` to prevent cookware showing pooja lamps.
- **Severity:** P2 – Medium
- **Remediation:** Populate real image URLs for all products; remove brittle string checks.

### S-08: Ananya Iyer Test Data Residue
- **Exact File & Lines:** `src/scripts/reset-ananya-wallet.ts` & `src/app/page.tsx` (Lines 2547, 2558)
- **The Defect:** Hardcoded test script and input placeholders specifically naming `ananya.iyer@gmail.com`.
- **Severity:** P3 – Low
- **Remediation:** Remove test scripts and replace with generic placeholders.

---

## DOMAIN 6: CUSTOMER PORTAL UI/UX, IMAGES & BROKEN INTERACTIONS

### U-01: 5,257-Line Monolithic God Component (`page.tsx`)
- **Exact File:** `src/app/page.tsx` (250 KB single file)
- **The Defect:** Over 100 useState hooks, 25 useEffects, all modals, cart drawer, catalog, and checkout packed into one component. Unmaintainable, slow HMR, frequent re-render thrashing.
- **Severity:** P1 – High
- **Remediation:** Decompose into `src/features/` atomic design modules.

### U-02: 4-Step Modal vs 7-Stage Database Inconsistency
- **Exact File & Lines:** `src/components/modals/OrderTrackingModal.tsx` (Lines 29–38)
- **The Defect:** UI displays an oversimplified 4-step progress bar (*Order Placed -> Sourced -> Shipped -> Delivered*), while the database, API, and Terms of Service specify a 7-stage pipeline.
- **Severity:** P2 – Medium
- **Remediation:** Upgrade `OrderTrackingModal` to display the full 7-stage milestone timeline.

### U-03: Native Browser Alert in `AddressesTab.tsx`
- **Exact File & Lines:** `src/components/tabs/AddressesTab.tsx` (Line 37)
- **The Defect:** Uses raw browser `alert('Please fill out street address...')` instead of luxury toast notification.
- **Severity:** P2 – Medium
- **Remediation:** Replace with `showToast(msg, 'error')`.

### U-04: Google Webfont Overhead (4 Redundant Families)
- **Exact File & Lines:** `src/app/layout.tsx` (Lines 53–56)
- **The Defect:** Loads `Bodoni Moda`, `Fraunces`, `Libre Bodoni`, and `Plus Jakarta Sans` simultaneously, adding 180 KB of render-blocking webfont payload.
- **Severity:** P2 – Medium
- **Remediation:** Consolidate to `Fraunces` (editorial headings) and `Plus Jakarta Sans` (UI).

### U-05: Missing Image Alt Text for Accessibility & SEO
- **Exact File & Lines:** `src/components/tabs/LiveShoppingTab.tsx` (Line 166)
- **The Defect:** Sourced option images render with empty `alt=""`, failing WCAG 2.1 accessibility audits.
- **Severity:** P3 – Low
- **Remediation:** Provide descriptive alt text: `alt={opt.description || item.name}`.

### U-06: Modal Stacking Trap on Mobile
- **Exact File & Lines:** `src/app/page.tsx`
- **The Defect:** Opening custom product modal -> cart -> auth modal stacks three full-screen overlays, trapping mobile back button navigation.
- **Severity:** P2 – Medium
- **Remediation:** Implement single top-level modal manager with back-stack support.

### U-07: Unchecked Empty State on "Live Shopping" Tab Click
- **Exact File & Lines:** `src/app/page.tsx` (Lines 2899–2904)
- **The Defect:** Clicking "Live Shopping" with 0 orders leaves `liveSessionSlot = null`, rendering an empty screen with no helpful onboarding message.
- **Severity:** P2 – Medium
- **Remediation:** Show prominent empty state: *"You have no active shopping slots. Book a slot to start live shopping."*

### U-08: Global CSS Sprawl (214 KB `styles.css`)
- **Exact File:** `src/styles/styles.css`
- **The Defect:** Monolithic stylesheet with overlapping class names, hardcoded pixel values, and unused legacy selectors.
- **Severity:** P2 – Medium
- **Remediation:** Purge unused CSS or migrate to Tailwind CSS / scoped CSS modules.

### U-09: Unbounded Quantity Selector in Edit Basket Item Modal
- **Exact File & Lines:** `src/components/modals/EditBasketItemModal.tsx` (Lines 46–54)
- **The Defect:** No upper bound check on item quantity. A user can type `9999999`, creating absurd budget calculations.
- **Severity:** P2 – Medium
- **Remediation:** Cap maximum item quantity at 50 per slot.

### U-10: Inconsistent Date Picker Bounds
- **Exact File & Lines:** `src/app/page.tsx`
- **The Defect:** Slot booking date picker allows selecting past dates or dates more than 30 days in advance where worker availability is unknown.
- **Severity:** P2 – Medium
- **Remediation:** Restrict date picker bounds: `min = tomorrow`, `max = +14 days`.

### U-11: Currency Formatting Inconsistency (USD vs INR)
- **Exact File & Lines:** `src/components/tabs/LiveShoppingTab.tsx` (Line 184)
- **The Defect:** Hardcodes conversion rate: `Math.round(opt.price / 83)`. If the rupee moves or customer is from the UK/UAE, conversion is inaccurate.
- **Severity:** P2 – Medium
- **Remediation:** Dynamic exchange rate API or explicit INR display with currency disclaimer.

### U-12: Unhandled 404 Product Images on Catalog Grid
- **Exact File & Lines:** `src/app/page.tsx`
- **The Defect:** Missing product images show broken image icons when `onError` handler fails on external CDN hosts.
- **Severity:** P2 – Medium
- **Remediation:** Robust SVG fallback component for broken images.

---

## DOMAIN 7: WORKER DASHBOARD ERGONOMICS & FIELD OPERATIONS GAPS

### W-01: Artificial Desktop Phone Bezel Frame
- **Exact File & Lines:** `src/styles/worker.css` (Lines 44–70)
- **The Defect:** Forces a 420px container with an 8px black phone border on desktop, making the app look like an unpolished Figma preview.
- **Severity:** P2 – Medium
- **Remediation:** Responsive layout that scales gracefully on both mobile and tablet/desktop viewports.

### W-02: Missing Google Maps Navigation Link
- **Exact File:** `src/app/worker/page.tsx`
- **The Defect:** Displays store text name but provides no Google Maps intent link (`https://www.google.com/maps/dir/?api=1&destination=...`).
- **Severity:** P1 – High
- **Remediation:** Add one-tap "Open in Google Maps" button next to store location.

### W-03: Lack of Client-Side Image Compression
- **Exact File & Lines:** `src/app/worker/page.tsx` (Lines 290–310)
- **The Defect:** Smartphone camera photos (4MB–8MB raw JPEGs) are uploaded uncompressed over weak 4G in crowded bazaars, causing 15-second upload delays and frequent dropouts.
- **Severity:** P1 – High
- **Remediation:** Use canvas/browser compression to downscale to 1080p WebP (~150KB) before transmission.

### W-04: No Offline Image Caching
- **Exact File:** `src/app/worker/page.tsx`
- **The Defect:** If upload fails in a store basement, the form resets and the photo is lost.
- **Severity:** P2 – Medium
- **Remediation:** Cache captured photos in IndexedDB until upload acknowledgment is received.

### W-05: Non-Functional Chat Icon
- **Exact File & Lines:** `src/app/worker/page.tsx`
- **The Defect:** Renders a chat icon that does nothing when tapped because no messaging socket or API exists.
- **Severity:** P2 – Medium
- **Remediation:** Hide icon until in-app chat is implemented, or wire to direct WhatsApp concierge intent.

### W-06: 30-Second Polling Lag in Store Aisles
- **Exact File & Lines:** `src/app/worker/page.tsx` (Lines 480–485)
- **The Defect:** Ground workers wait up to 30 seconds to see customer approvals, stalling in-store workflow.
- **Severity:** P1 – High
- **Remediation:** Replace polling with Server-Sent Events (SSE).

### W-07: Exhaustive Single-Step KYC Form
- **Exact File & Lines:** `src/app/worker/page.tsx` (Lines 820–930)
- **The Defect:** Single mobile form demands 6 document uploads simultaneously with no auto-save or draft recovery.
- **Severity:** P2 – Medium
- **Remediation:** Refactor into a 3-step mobile wizard stepper with progress indicators.

### W-08: Baby-Blue Color Palette Mismatch
- **Exact File & Lines:** `src/styles/worker.css` (Lines 2–22)
- **The Defect:** Pale `#EAF2FC` background and washed-out blue buttons clash with Visasra's core luxury navy/amber branding.
- **Severity:** P3 – Low
- **Remediation:** Align color palette with primary design tokens.

---

## DOMAIN 8: ADMIN OPERATIONS FLAWS & DATA SPRAWL

### M-01: Unbounded Table Rendering (Performance Lag)
- **Exact File & Lines:** `src/app/admin/page.tsx` (Lines 500–800)
- **The Defect:** Renders hundreds of orders, users, and transactions in unpaginated tables, lagging browser DOM.
- **Severity:** P2 – Medium
- **Remediation:** Implement server-side pagination (25 items per page) and virtualized tables.

### M-02: Missing 2-Step Confirmation on Destructive Actions
- **Exact File & Lines:** `src/app/admin/page.tsx` (Lines 450–470)
- **The Defect:** Refund and worker unassignment actions execute immediately on click with no confirmation dialog.
- **Severity:** P1 – High
- **Remediation:** Add confirmation modal requiring typed order number for refunds.

### M-03: Raw Date & Long UUID Display
- **Exact File & Lines:** `src/app/admin/page.tsx`
- **The Defect:** Displays raw ISO timestamps (`2026-11-18T09:12:34.000Z`) and 36-character UUID strings instead of humanized relative dates (`10 minutes ago`) and short order numbers.
- **Severity:** P3 – Low
- **Remediation:** Use `date-fns` relative format and truncate UUIDs.

### M-04: Lack of Sound / Push Alerts for Pending Shop QRs
- **Exact File & Lines:** `src/app/admin/page.tsx`
- **The Defect:** When a ground worker uploads a merchant QR at the billing counter, the admin dashboard displays no sound or desktop notification. Admin must manually refresh.
- **Severity:** P1 – High
- **Remediation:** Add Web Audio chime and browser push notifications on `shopPaymentStatus === 'qr_uploaded'`.

### M-05: Unchecked KYC Document Rejection Without Reason
- **Exact File & Lines:** `src/app/api/admin/action/route.ts` (Lines 112–134)
- **The Defect:** Admin can reject worker KYC without providing a reason, leaving ground workers confused.
- **Severity:** P2 – Medium
- **Remediation:** Make rejection reason mandatory in modal.

### M-06: Missing Export / CSV Download for Accounting
- **Exact File:** `src/app/admin/page.tsx`
- **The Defect:** No way to export daily orders, GST payments, or worker payouts for financial reconciliation.
- **Severity:** P2 – Medium
- **Remediation:** Add "Export to CSV" for orders and merchant payments.

### M-07: Unauthenticated Admin Action Endpoints
- **Exact File & Lines:** `src/app/api/admin/action/route.ts`
- **The Defect:** Relies exclusively on `x-admin-email` header.
- **Severity:** P0 – Critical
- **Remediation:** Protect with signed JWT session cookies.

---

## DOMAIN 9: DATABASE SCHEMA, FLOATING-POINT & MIGRATION ANTI-PATTERNS

### D-01: Absence of Migration Version Control (`prisma db push`)
- **Exact File:** `prisma/schema.prisma` & `package.json`
- **The Defect:** Project uses `prisma db push` instead of version-controlled `prisma migrate`. Schema changes on production risk silent column drops and data loss.
- **Severity:** P1 – High
- **Remediation:** Initialize `prisma migrate dev --name init` and run `prisma migrate deploy` on production.

### D-02: Missing PostgreSQL Check Constraint on Wallet Balances
- **Exact File:** `prisma/schema.prisma` (`User`, `Worker`)
- **The Defect:** No `CHECK ("walletBalance" >= 0)` constraint in database, allowing negative balances.
- **Severity:** P1 – High
- **Remediation:** Add SQL migration with check constraints.

### D-03: Missing Indexes on Foreign Keys and Query Paths
- **Exact File:** `prisma/schema.prisma`
- **The Defect:** `ProductCatalog` missing index on `categoryId`; `OrderItem` missing index on `productId`; `OrderTrackingStage` missing index on `[orderId, stageKey]`.
- **Severity:** P2 – Medium
- **Remediation:** Add `@@index` annotations across all relation foreign keys.

### D-04: Non-Existent Row Level Security (RLS)
- **Exact File:** PostgreSQL Database
- **The Defect:** RLS is disabled on all tables. Connection connects as table owner `postgres`, bypassing security policies.
- **Severity:** P1 – High
- **Remediation:** Enable RLS and define ownership policies.

### D-05: Missing Unique Constraint on `WalletTransaction.razorpayPaymentId`
- **Exact File:** `prisma/schema.prisma`
- **The Defect:** Replay attacks cannot be blocked at the database constraint level.
- **Severity:** P1 – High
- **Remediation:** Add unique column `razorpayPaymentId String? @unique` to `WalletTransaction`.

### D-06: Uncascaded Deletions on Custom Order Items
- **Exact File:** `prisma/schema.prisma` (`OrderItem` to `ProductCatalog`)
- **The Defect:** `OrderItem.productId` is an unconstrained string with no foreign key relation to `ProductCatalog`, risking orphaned data.
- **Severity:** P2 – Medium
- **Remediation:** Establish explicit optional foreign key `productId -> ProductCatalog.id (onDelete: SetNull)`.

### D-07: Inconsistent Timestamp Types
- **Exact File:** `prisma/schema.prisma`
- **The Defect:** Some tracking timestamps use ISO strings (`String`), while others use `DateTime`, creating serialization mismatches.
- **Severity:** P3 – Low
- **Remediation:** Standardize on PostgreSQL `TIMESTAMPTZ` (`DateTime`).

### D-08: Redundant User Address Columns
- **Exact File:** `prisma/schema.prisma` (`UserAddress`)
- **The Defect:** `region` and `city` are duplicated without standard ISO state codes, leading to messy carrier shipping labels.
- **Severity:** P3 – Low
- **Remediation:** Standardize on ISO-3166-2 state codes.

---

## DOMAIN 10: PERFORMANCE BOTTLENECKS, POLLING LATENCY & SERVERLESS CRASHES

### T-01: 20-Second Polling Avalanche Overloading PostgreSQL
- **Exact File & Lines:** `src/app/page.tsx` (Lines 1230–1252)
- **The Defect:** Every active customer polls `api/live` and `api/tracking` every 20 seconds. 50 active users generate 150 heavy multi-table queries per minute, exhausting poolers.
- **Severity:** P1 – High
- **Remediation:** Replace with Server-Sent Events (SSE).

### T-02: Serverless Local Filesystem Write Failure
- **Exact File & Lines:** `src/app/api/upload/route.ts` (Lines 67–74)
- **The Defect:** Writes uploads to `public/uploads/` on local disk. On Vercel serverless functions, the disk is read-only and ephemeral, causing upload crashes or immediate file loss.
- **Severity:** P1 – High
- **Remediation:** Require direct upload to Cloudflare R2 object storage.

### T-03: Uncompressed 8MB Image Upload Memory Spikes
- **Exact File & Lines:** `src/app/api/upload/route.ts` (Lines 16–18)
- **The Defect:** `Buffer.from(await file.arrayBuffer())` loads full 8MB camera images into Node.js heap memory without streaming, risking serverless out-of-memory crashes.
- **Severity:** P1 – High
- **Remediation:** Enforce 5MB limit and stream directly to Cloudflare R2 using Sharp resize.

### T-04: Hardcoded Database Pooler Connection Limit (25 Connections)
- **Exact File & Lines:** `src/lib/prisma.ts` (Lines 14–17)
- **The Defect:** Hardcodes `connection_limit=25`. When multiple serverless lambda instances spin up during high traffic, pool connections saturate and throw 504 errors.
- **Severity:** P1 – High
- **Remediation:** Use Supabase Supavisor in transaction pooling mode on port 6543 with Prisma Accelerate.

### T-05: Massive 650 KB Initial Client JavaScript Bundle
- **Exact File:** `src/app/page.tsx`
- **The Defect:** Leaflet maps, Razorpay scripts, and dozens of modals are bundled synchronously into the initial client bundle. Mobile FCP and LCP exceed 3.5 seconds.
- **Severity:** P2 – Medium
- **Remediation:** Lazy-load modals and map with `next/dynamic`.

### T-06: Zero Caching on Order & Wallet Read Endpoints
- **Exact File:** `src/app/api/orders/route.ts` & `src/app/api/wallet/route.ts`
- **The Defect:** Zero HTTP cache headers or stale-while-revalidate directives, hitting the database on every tab switch.
- **Severity:** P2 – Medium
- **Remediation:** Implement SWR or React Query client-side caching with 30-second deduplication.

---

## MASTER DEFECT SUMMARY TABLE

| Domain | Total Issues | Critical (P0) | High (P1) | Medium (P2) | Low (P3) |
|---|---|---|---|---|---|
| **Domain 1: Financial & Payments** | 8 | 4 | 4 | 0 | 0 |
| **Domain 2: Auth & Session Bypasses** | 9 | 4 | 4 | 1 | 0 |
| **Domain 3: Logic Failures & Money Loss** | 10 | 2 | 5 | 3 | 0 |
| **Domain 4: Data Overexposure & IDOR** | 7 | 4 | 2 | 1 | 0 |
| **Domain 5: Fake Stubs & Mock Fallbacks** | 8 | 0 | 2 | 5 | 1 |
| **Domain 6: Customer Portal UI/UX** | 12 | 0 | 1 | 9 | 2 |
| **Domain 7: Worker Dashboard Ergonomics** | 8 | 0 | 3 | 4 | 1 |
| **Domain 8: Admin Operations Flaws** | 7 | 1 | 2 | 3 | 1 |
| **Domain 9: Database Schema & Constraints**| 8 | 0 | 4 | 3 | 1 |
| **Domain 10: Performance & Polling** | 6 | 0 | 4 | 2 | 0 |
| **TOTALS** | **83** | **15** | **31** | **31** | **6** |
