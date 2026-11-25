# VISASRA MASTER IMPLEMENTATION PLAN
## Senior Engineering Roadmap & Staged Production Rollout Plan

**Author:** Co-Founder, CTO & Senior Staff Architect  
**Planning Horizon:** 8 Sprints / Phased Execution (Zero Downtime, Zero Regressions)  
**Target Codebase:** `d:\visasra-final\visasra-next`  

---

## EXECUTION PRINCIPLES (HOW A SENIOR DEVELOPER DELIVERS)
1. **Safety First (Zero Downtime):** We never touch 83 issues in one massive unreviewable commit. We stage changes so that every step compiles, passes tests, and can be verified independently.
2. **Financial Integrity Before Polish:** We secure the money flows and customer balances before touching UI colors and typography.
3. **Additive Refactoring:** When decomposing monolithic files (like `page.tsx`), we extract self-contained sub-components incrementally, ensuring HMR and state remain intact.
4. **No Destructive Database Changes:** Database migrations are written additively (nullable columns -> backfill -> enforce constraints) to prevent table locking.

---

## PHASE 1: EMERGENCY FINANCIAL & DATA-LOSS LOCKDOWN (DAY 1)
*Goal: Stop active customer money loss, prevent free wallet balance injection, and delete fake demo numbers.*

### Task 1.1: Fix the Customer Money-Loss Bug on Option Undo
- **Files:** `src/app/api/live/[slotKey]/products/[itemId]/options/[optionId]/reject/route.ts` & `src/components/tabs/LiveShoppingTab.tsx`
- **Action:**
  1. In `reject/route.ts`, check if the option status was `'approved'`.
  2. If approved, wrap the rejection in a `prisma.$transaction`:
     - Calculate refund amount (`option.price * item.qty`).
     - Increment `User.walletBalance` by the refund amount.
     - Insert a `credit` row in `WalletTransaction` with note: `Refund: Undone decision for ${item.name}`.
     - Set `ProductOption.status = 'rejected'`.
     - Set `OrderItem.status = 'needs_options'` and `OrderItem.approvedAmount = null`.
  3. Add a guard: if `orderItem.shopPaymentStatus === 'paid'` or `orderItem.status === 'purchased'`, reject the undo request with HTTP 400 (`"Cannot undo: Item already purchased at store counter"`).
- **Verification:** Approve an item (balance decreases by ₹4,500) -> Click "Change Decision" -> Verify wallet balance restores by ₹4,500 and a credit ledger entry is created.

### Task 1.2: Remove Fake Fallback `|| 2440` in Live Shopping Tab
- **File:** `src/components/tabs/LiveShoppingTab.tsx` (Line 39)
- **Action:** Change `|| 2440` to `|| 0`. If a session has zero approved items, total shows `₹0`.
- **Verification:** Open a live session with 0 approved items; verify total displays `₹0` instead of `₹2,440`.

### Task 1.3: Patch Free Wallet Credit Backdoor & Enforce Razorpay Signatures
- **File:** `src/app/api/wallet/route.ts`
- **Action:**
  1. Require user session authentication on `POST /api/wallet`.
  2. Require mandatory `razorpayPaymentId`, `razorpayOrderId`, and `razorpaySignature`. If any are missing, immediately return HTTP 400.
  3. Verify HMAC SHA-256 signature against `process.env.RAZORPAY_KEY_SECRET`.
  4. Record `razorpayPaymentId` in `WalletTransaction.note` and check for duplicates to prevent replay attacks.
- **Verification:** Attempt POST with no payment ID -> returns 400. Valid signed transaction -> increments balance.

### Task 1.4: Atomic Balance Guard on Live Option Approvals
- **File:** `src/app/api/live/[slotKey]/products/[itemId]/options/[optionId]/approve/route.ts`
- **Action:**
  Move the balance check inside the atomic database update:
  ```typescript
  const updatedUser = await prisma.user.update({
    where: { id: liveSession.userId, walletBalance: { gte: totalAmount } },
    data: { walletBalance: { decrement: totalAmount } },
  });
  ```
  If balance is insufficient, Prisma throws a P2025 error, safely caught and returned as HTTP 402 Insufficient Funds.
- **Verification:** Concurrent approval requests cannot drive wallet balance negative.

### Task 1.5: Fix Worker Payout Decrement Logic
- **File:** `src/app/api/admin/action/route.ts` (Lines 150–163)
- **Action:**
  1. Validate `amount > 0`.
  2. Verify `worker.walletBalance >= payoutAmt`. If insufficient, return HTTP 400.
  3. Only decrement up to available balance; never drop into negative numbers.
- **Verification:** Attempting payout on ₹0 balance returns 400 error.

---

## PHASE 2: AUTHENTICATION & ACCESS CONTROL HARDENING (DAY 2)
*Goal: Eliminate universal session bypasses, close open admin backdoors, and mask worker PII.*

### Task 2.1: Implement Cryptographic Admin Session Tokens
- **Files:** `src/app/api/admin/login/route.ts`, `api/admin/data/route.ts`, `api/admin/action/route.ts`, `src/app/admin/page.tsx`
- **Action:**
  1. In `admin/login/route.ts`, sign an authoritative JWT token containing `{ adminId, email, role }` using `process.env.JWT_SECRET`.
  2. Store the token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie named `visasra_admin_token` (or return bearer token).
  3. In `admin/data/route.ts` and `admin/action/route.ts`, extract and verify the JWT. Reject requests with missing or invalid tokens with HTTP 401. Delete all reliance on `x-admin-email` header.
- **Verification:** Requests with spoofed `x-admin-email` header return 401 Unauthorized. Only valid admin logins succeed.

### Task 2.2: Eliminate Query Parameter Session Bypass in `session.ts`
- **Files:** `src/lib/session.ts` & all API routes calling `getUserFromRequest`
- **Action:**
  1. Remove lines 119–156 in `src/lib/session.ts` (delete `searchParams.get('email')` and `searchParams.get('userId')`).
  2. Authenticate callers strictly via `Authorization: Bearer <token>` or database-backed `UserSession`.
  3. Update frontend API client helper (`apiFetch`) in `src/app/page.tsx` to automatically attach `Authorization: Bearer ${sessionToken}` on all outbound fetches.
- **Verification:** Appending `?email=victim@example.com` returns 401 Unauthorized.

### Task 2.3: Mask Worker PII & Enforce Worker Session Authentication
- **Files:** `src/app/api/worker/jobs/route.ts`, `api/worker/bank/route.ts`, `api/worker/kyc/route.ts`
- **Action:**
  1. Enforce worker session validation on `api/worker/jobs` and `api/worker/bank`.
  2. In `GET /api/worker/jobs`, mask sensitive fields before returning JSON:
     - `aadhaarNumber`: `XXXX-XXXX-${raw.slice(-4)}`
     - `panNumber`: `XXXXX${raw.slice(-4)}`
     - `bankAccountNumber`: `XXXXXXXX${raw.slice(-4)}`
- **Verification:** Unauthenticated calls return 401; authenticated worker calls return masked government identifiers.

### Task 2.4: Secure Address Deletion against IDOR
- **File:** `src/app/api/user/addresses/route.ts`
- **Action:**
  Require authenticated user session. In `DELETE`, enforce `where: { id: addressId, userId: authenticatedUser.id }`.
- **Verification:** User A cannot delete User B's saved address.

### Task 2.5: Scrub Secrets & Reviewer Accounts from Codebase
- **Files:** `src/lib/prisma.ts` & `src/app/api/auth/login/route.ts`
- **Action:**
  1. Remove hardcoded Supabase fallback strings from `prisma.ts`.
  2. Remove hardcoded `reviewer@razorpay.com` / `VisasraTest@2026` logic from `api/auth/login/route.ts`.
- **Verification:** Search entire codebase for `visasra123*` and `VisasraTest@2026` -> 0 occurrences.

---

## PHASE 3: ADMIN & WORKER UX OVERHAUL + PRIVACY COMPLIANCE (DAY 3)
*Goal: Make operations streamlined and privacy-compliant; modernize the worker field app.*

### Task 3.1: Strip Global Customer Dump from Admin Dashboard
- **Files:** `src/app/api/admin/data/route.ts` & `src/app/admin/page.tsx`
- **Action:**
  1. Remove `prisma.user.findMany(...)` from `GET /api/admin/data`.
  2. Focus the dashboard telemetry exclusively on:
     - **Active Live Slots** (Today's sessions requiring shopper monitoring)
     - **Pending Merchant QR Clearances** (Urgent counter payments)
     - **Export Hub Handover & International Dispatch** (Orders ready for DHL packaging)
     - **Ground Shoppers Roster** (Active, busy, offline)
  3. Create a separate paginated customer lookup endpoint: `GET /api/admin/customers?q=...&page=1` for customer support lookups.
- **Verification:** Admin dashboard loads in under 300ms; zero customer personal dossiers dumped into global state.

### Task 3.2: Modernize Worker Dashboard & Field Ergonomics
- **Files:** `src/app/worker/page.tsx` & `src/styles/worker.css`
- **Action:**
  1. Remove the artificial 420px desktop black phone bezel (`#worker-app { border: 8px solid #0B223D }`). Replace with a modern, responsive layout that looks great on mobile, iPad, and desktop.
  2. Unify the color palette with Visasra's primary luxury navy (`#071D3A`) and amber (`#D97706`), ditching the toy baby-blue styling.
  3. Add a prominent **"📍 Open in Google Maps"** navigation button that launches `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeAddress)}`.
  4. Display `order.customerNotes` prominently on the active shopping card.
- **Verification:** Ground shoppers see customer notes and can tap one button to navigate to the store in Google Maps.

### Task 3.3: Implement Real Worker Payout Requests with Ledger History
- **Files:** `src/app/api/worker/jobs/route.ts`, `src/components/worker/WorkerEarnTab.tsx`, `prisma/schema.prisma`
- **Action:**
  1. When worker clicks "Withdraw", create a `WorkerPayoutRequest` record with status `pending`.
  2. Display pending payout requests in Admin Hub under a dedicated "Worker Payouts" tab.
  3. Only decrement worker balance once Admin marks the payout processed with a valid bank UTR reference.
- **Verification:** Worker payout requests appear in Admin hub; balances are not decremented until payment is recorded.

---

## PHASE 4: CLIENT-SIDE IMAGE COMPRESSION & UPLOAD INTEGRITY (DAY 4)
*Goal: 15-second camera uploads drop to 1 second; zero serverless upload crashes.*

### Task 4.1: Client-Side WebP Downscaling Before Upload
- **File:** `src/app/worker/page.tsx`
- **Action:**
  Implement a client-side image compression utility before calling `api/upload`:
  - Load captured photo into an off-screen HTML5 Canvas.
  - Scale down maximum dimension to 1280px (maintaining aspect ratio).
  - Convert to `image/webp` with quality 0.82.
  - Reduces raw 6MB camera JPEGs to ~120KB–180KB WebP images.
- **Verification:** 1080p photo uploads complete in under 1 second over 4G mobile connections.

### Task 4.2: Harden `api/upload` Endpoint
- **File:** `src/app/api/upload/route.ts`
- **Action:**
  1. Enforce strict 5MB file size limit.
  2. Whitelist allowed MIME types: `image/jpeg`, `image/png`, `image/webp`. Reject SVGs, HTML, and executables.
  3. Require Cloudflare R2 credentials; disable unpersisted local disk fallback in production environments.
- **Verification:** Non-image uploads are rejected with HTTP 400; valid images are uploaded to Cloudflare R2.

---

## PHASE 5: REAL-TIME EVENT BUS (SSE) TO KILL 20S POLLING (DAY 5)
*Goal: Sub-500ms live option arrival, eliminate polling, reduce database load by 95%.*

### Task 5.1: Create Server-Sent Events (SSE) Route
- **File:** `src/app/api/live/[slotKey]/events/route.ts`
- **Action:**
  1. Create a lightweight Next.js route handler returning `Content-Type: text/event-stream`.
  2. Broadcast live events when:
     - Worker uploads an option (`option_created`)
     - Customer approves/rejects an option (`option_decision`)
     - Worker uploads a merchant QR (`qr_uploaded`)
     - Admin approves merchant payment (`qr_cleared`)
     - Session stage advances (`stage_changed`)
- **Verification:** Connecting via `EventSource` receives live events instantly upon database mutations.

### Task 5.2: Replace `setInterval` in Customer and Worker Portals
- **Files:** `src/app/page.tsx` & `src/app/worker/page.tsx`
- **Action:**
  1. Replace 20s and 30s `setInterval` polling with `new EventSource('/api/live/.../events')`.
  2. On message receipt, update React state in-place.
  3. Add Web Audio chime on option arrival and merchant payment clearance.
- **Verification:** Customer sees new options on screen in under 500ms; database query count drops from 150 queries/min to near-zero idle.

---

## PHASE 6: DATABASE INTEGRITY, DECIMAL CURRENCY & MIGRATIONS (DAY 6)
*Goal: Eliminate floating-point rounding drift and establish versioned migrations.*

### Task 6.1: Migrate Currency Columns to `Decimal(12, 2)`
- **File:** `prisma/schema.prisma`
- **Action:**
  Update currency fields:
  ```prisma
  walletBalance Decimal @default(0.00) @db.Decimal(12, 2)
  amount        Decimal @db.Decimal(12, 2)
  price         Decimal @db.Decimal(12, 2)
  approvedAmount Decimal? @db.Decimal(12, 2)
  ```
- **Verification:** Prisma client generates Decimal types; arithmetic rounding drift is eliminated.

### Task 6.2: Add PostgreSQL Non-Negative Check Constraints
- **Action:**
  Create SQL migration:
  ```sql
  ALTER TABLE "User" ADD CONSTRAINT "chk_user_wallet_non_negative" CHECK ("walletBalance" >= 0);
  ALTER TABLE "Worker" ADD CONSTRAINT "chk_worker_wallet_non_negative" CHECK ("walletBalance" >= 0);
  ```
- **Verification:** Attempting to update `walletBalance` to -1 throws PostgreSQL constraint violation.

### Task 6.3: Initialize Version-Controlled Migrations
- **Action:**
  Run `npx prisma migrate dev --name init_visasra_production`. Commit migration files to git. Replace `prisma db push` in build scripts with `prisma migrate deploy`.
- **Verification:** Deployments run version-controlled migrations safely.

---

## PHASE 7: MODULARIZE THE 5,257-LINE "GOD COMPONENT" (`page.tsx`) (DAY 7)
*Goal: Decompose monolithic `page.tsx` into clean, maintainable atomic feature directories.*

### Task 7.1: Extract Feature Directories
- **Action:**
  Refactor `src/app/page.tsx` by extracting domain features into `src/features/`:
  - `src/features/catalog/` (`CatalogGrid.tsx`, `CategoryBar.tsx`, `SearchFilter.tsx`)
  - `src/features/cart/` (`CartDrawer.tsx`, `CartItemRow.tsx`, `CheckoutBar.tsx`)
  - `src/features/booking/` (`SlotPickerModal.tsx`, `TimeWindowSelect.tsx`)
  - `src/features/live/` (`LiveShopperBanner.tsx`, `LiveOptionCard.tsx`)
  - `src/features/tracking/` (`OrderTrackingModal.tsx` upgraded to full 7 stages)
- **Verification:** `page.tsx` shrinks from 5,257 lines to ~350 lines; HMR recompile time drops from 6s to < 300ms.

### Task 7.2: Fix 4-Step vs 7-Stage Tracking Modal Inconsistency
- **File:** `src/components/modals/OrderTrackingModal.tsx`
- **Action:**
  Upgrade progress stepper to display all 7 official milestones:
  *Slot Confirmed -> Shopper Assigned -> In-Store Sourcing -> Purchased & Billed -> Central Hub QC -> International Flight Dispatch -> Doorstep Delivery.*
- **Verification:** Tracking modal matches database stages and Terms of Service.

### Task 7.3: Replace Native Browser Alert with Toast
- **File:** `src/components/tabs/AddressesTab.tsx` (Line 37)
- **Action:**
  Replace `alert('Please fill out street address...')` with luxury inline toast notification.
- **Verification:** Form validation triggers a smooth non-intrusive toast.

---

## PHASE 8: AUTOMATED TESTING & REGRESSION PROTECTION (DAY 8)
*Goal: 100% automated regression protection for core financial and order paths.*

### Task 8.1: Unit Test Suite (Vitest)
- **Action:**
  Write automated tests for:
  - Razorpay HMAC SHA-256 signature verification.
  - Option approval atomic transaction.
  - Option rejection wallet refund calculation.
  - Worker payout decrement validation.
- **Verification:** `npm run test` passes 100% of unit test suites.

### Task 8.2: End-to-End Regression Test (Playwright)
- **Action:**
  Write Playwright E2E scenario covering the critical golden path:
  *User Registration -> Razorpay Wallet Deposit -> Slot Booking -> Worker Option Upload -> Customer Live Approval -> Merchant QR Clearance -> Order Shipped.*
- **Verification:** Playwright test completes the entire transaction headless in CI.

---

## PROGRESS TRACKING DASHBOARD

| Phase | Description | Status | Risk Level | Target Completion |
|---|---|---|---|---|
| **Phase 1** | Emergency Financial & Money-Loss Lockdown | **COMPLETED & VERIFIED** | High (Financial) | Day 1 |
| **Phase 2** | Authentication & Access Control Hardening | **COMPLETED & VERIFIED** | High (Security) | Day 2 |
| **Phase 3** | Admin & Worker UX Overhaul + Privacy | **COMPLETED & VERIFIED** | Medium (UX/Data) | Day 3 |
| **Phase 4** | Image Compression & Upload Integrity | **COMPLETED & VERIFIED** | Medium (Media) | Day 4 |
| **Phase 5** | Real-Time Event Bus (SSE) vs Polling | **COMPLETED & VERIFIED** | Medium (Perf) | Day 5 |
| **Phase 6** | Database Integrity & Prisma Migrations | **COMPLETED & VERIFIED** | Medium (Database) | Day 6 |
| **Phase 7** | Decompose 5,257-line `page.tsx` Monolith | **COMPLETED & VERIFIED** | Medium (Frontend) | Day 7 |
| **Phase 8** | Automated Testing & Regression Protection | **COMPLETED & VERIFIED** | Low (Testing) | Day 8 |
