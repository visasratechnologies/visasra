# Visasra — Full-Stack PostgreSQL & TypeScript (.tsx) Architecture

This project is a complete conversion of the Visasra platform into **Next.js with TypeScript (`.tsx`)** backed by **PostgreSQL** via **Prisma ORM**.

---

## 🌟 What Has Been Converted

1. **Customer Shopping Portal (`.tsx`)**:
   - Location: [`visasra-next/src/app/page.tsx`](file:///d:/visasra-suite/visasra-next/src/app/page.tsx)
   - Route: `http://localhost:3000/`
   - Features:
     - Authentication (Sign In & Sign Up stored in PostgreSQL)
     - Interactive Indian Catalog & Custom Product Requests
     - Slot Booking flow (2h, 3h, 5h slots, date picker, slot schedule)
     - Order Management & Orders tab
     - **Live Shopping Screen**: Shopper card, active market location, real-time products & option cards with **Approve** (atomic PostgreSQL wallet debit) and **Reject** buttons
     - **Order Tracking Screen**: 7-stage live milestone tracker
     - **Visasra Money Wallet**: Live balance, top-up modal, and PostgreSQL transaction history

2. **Personal Shopper / Worker Portal (`.tsx`)**:
   - Location: [`visasra-next/src/app/worker/page.tsx`](file:///d:/visasra-suite/visasra-next/src/app/worker/page.tsx)
   - Route: `http://localhost:3000/worker`
   - Features:
     - Verified Shopper status, earnings (₹350/slot), KYC badge
     - Active Slot controller with 4 stage progression buttons (*Heading to Store* → *In Store Shopping* → *Purchased* → *Handed to Hub*)
     - **Upload Sourced Option**: Upload photo, set price per unit, and enter description directly into PostgreSQL `ProductOption` table
     - **Upload Shop QR**: Upload counter payment QR for admin clearance

3. **Admin Operations Hub (`.tsx`)**:
   - Location: [`visasra-next/src/app/admin/page.tsx`](file:///d:/visasra-suite/visasra-next/src/app/admin/page.tsx)
   - Route: `http://localhost:3000/admin`
   - Features:
     - Overview KPI cards (Active sessions, Total orders, Shoppers, Customers)
     - Live Slots monitor
     - Orders management
     - **Shop QR Clearance**: Approve and mark merchant counter payments paid
     - Shopper force management & KYC verification

4. **PostgreSQL Database (`visasradb`)**:
   - Connection: `postgresql://postgres:postgres@localhost:5433/visasradb?schema=public`
   - Prisma Schema: [`visasra-next/prisma/schema.prisma`](file:///d:/visasra-suite/visasra-next/prisma/schema.prisma)
   - Seeding Script: [`visasra-next/prisma/seed.mjs`](file:///d:/visasra-suite/visasra-next/prisma/seed.mjs)
   - Models:
     - `User`: Customer profile, hashed password, wallet balance
     - `WalletTransaction`: Ledger entries (credit/debit)
     - `Worker`: Personal shoppers, rating, orders done, KYC status
     - `Admin`: Operations and finance management
     - `Category` & `ProductCatalog`: Indian items & estimate ranges
     - `Order`: Booked shopping slots, shipping details, total
     - `OrderItem`: Items in each slot with approval and payment statuses
     - `ProductOption`: Options uploaded live by shoppers
     - `LiveSession`: Live shopping sessions and GPS location
     - `OrderTrackingStage`: 7 milestone tracking stages

---

## 🚀 Running the Project

From the project root `d:\visasra-suite`:

```bash
# Start Next.js dev server on http://localhost:3000
npm run dev

# Sync database schema with PostgreSQL
npm run db:push

# Re-seed database with initial data
npm run db:seed

# Production build
npm run build
```

---

## 🔗 Portals Overview

| Portal | URL | Description |
|---|---|---|
| **Customer App** | `http://localhost:3000/` | Main shopping experience, slot booking, live approval |
| **Shopper / Worker App** | `http://localhost:3000/worker` | Personal shopper job screen, photo upload, stages |
| **Admin Operations** | `http://localhost:3000/admin` | Operational telemetry, order tracking, QR clearance |
