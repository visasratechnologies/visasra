# Live shopping — backend integration guide

The customer-side screens are finished and run on a **localStorage mock**.
Everything the backend has to provide goes through one object, `LiveAPI`, in `live.js`.
Replace its three methods with real `fetch()` calls (they already return Promises) and the UI works unchanged.

## How the customer sees it

1. The customer books a slot (e.g. Fri 16 Oct, 2:00–4:00 PM). The order cell shows **"Shopping starts in 3h 20m"**.
2. When the slot starts, the cell shows a green **"Track your shopper"** button (and the pill reads "Shopping live"). If options are waiting it shows a count: "2 products are waiting for your approval".
3. The button opens the **Live page**: map, shopper card, one card per ordered product, progress timeline.
4. When the worker uploads options for a product, the customer sees them (photo, price, description) with **Approve / Reject**.
5. **Approve** → the server debits the wallet and marks that option chosen. **Reject** → the worker is told to find another.

## Keys

* One live session per customer per slot. The key is the order's `slot.id` — `"2026-10-16|t3"` (`iso date | window id`).
* Orders booked in the same slot are merged into one cell and one session.
* Orders must keep `slot.iso` and `slot.id` (they already do); older orders without them simply show no live UI.
* The button appears when `slot start <= now < slot end` (computed in the browser from `SLOT_WINDOWS`), or earlier if the server reports `session.status = "live"`. Once the slot end time passes, the button disappears: the cell shows "This slot has ended" (pill: "Slot ended"), unless the session is `completed`, in which case the shopping summary stays available.
* Slot schedule (IST, 11 AM – 9 PM, back-to-back): 2-hour slots h2-1..h2-5, 3-hour slots h3-1..h3-3, 5-hour slots h5-1..h5-2. Slot ids are `<date>|<windowId>`; old ids t1..t4 are still understood. The server should also set `status = "completed"` when the shopping for the slot is finished.

## Endpoints

### 1. `GET /api/live/:slotKey` → session
Polled every 4 s while the Live page is open and every 15 s for live slots on the Orders/Home lists.
(A WebSocket/SSE push is better — call `refreshSession(slotKey)` whenever a message arrives.)

```jsonc
{
  "slotKey": "2026-10-16|t3",
  "status": "scheduled | live | completed",
  "stage": "scheduled | assigned | heading_to_store | shopping | purchased | packed",
  "shopper": { "name": "Ramesh Kumar", "rating": 4.8, "ordersDone": 320, "phone": "+91…", "photo": "https://…|null" },
  "store":   { "name": "T. Nagar Market, Chennai", "address": "…", "lat": 13.0418, "lng": 80.2341 },
  "location": { "lat": 13.06, "lng": 80.25, "updatedAt": 1760000000000, "etaMin": 14 },   // shopper's live position (ms epoch, server clock)
  "products": [
    {
      "itemId": "…",              // = the order item's id
      "name": "Jewellery Sets",
      "qty": 1,
      "estMin": 1500, "estMax": 5000,   // the customer's own estimate range
      "status": "waiting | options_ready | needs_options | approved | purchased",
      "approvedAmount": 2440,           // set once approved (unit price × qty)
      "options": [
        {
          "id": "opt_123",
          "image": "https://…",          // uploaded by the worker
          "price": 2440,                 // price PER UNIT, exact (₹)
          "description": "…",
          "status": "pending | approved | rejected | not_chosen"
        }
      ]
    }
  ]
}
```
`shopper`, `store` and `location` may be `null` before a shopper is assigned.

### 2. `POST /api/live/:slotKey/products/:itemId/options/:optionId/approve`
Server, in **one transaction**:
* check the option is still `pending` (make it **idempotent** — a double tap must not charge twice),
* amount = `option.price × product.qty`,
* if wallet balance < amount → **HTTP 402** (the UI then offers "Add money"),
* debit the wallet, write the wallet transaction, set this option `approved`, the others `not_chosen` (keep `rejected` ones), product `approved`.

Response:
```json
{
  "session": { "…full session as above…" },
  "wallet": {
    "balance": 47560,
    "transaction": { "id": "tx_1", "type": "debit", "amount": 2440, "note": "Approved: Jewellery Sets", "date": "2 Oct 2026" }
  }
}
```
On 402 the front end expects the call to throw `{ code: "INSUFFICIENT_FUNDS" }` — map the status code in the `LiveAPI` wrapper.

### 3. `POST /api/live/:slotKey/products/:itemId/options/:optionId/reject` → `{ "session": {…} }`
Mark the option `rejected`. If no option is `pending`/`approved` any more, set the product to `needs_options` and notify the worker dashboard.

## Worker dashboard side (not part of this front end)
The worker app needs to be able to: change `stage`, post `location` updates, and **upload options** for a product
(`image`, `price` per unit, `description`) which flips the product to `options_ready`.

## Map
`LiveMap.render(el, session)` in `live.js` draws a placeholder SVG map. Replace its body with Google Maps / Mapbox / Leaflet.
It needs `session.location` (shopper pin) and `session.store` (store pin); call it again whenever the session updates.

## Other hooks to wire
* **Call button** — already `tel:` from `shopper.phone`.
* **Message button** — shows a toast; connect it to your chat (`live.js`, search for "Chat will open here").
* **Wallet** — the UI mirrors `response.wallet.balance`; the server is the source of truth.

## Mock parts to replace
All demo / test tools (simulator, demo OTP, skip buttons, sample data, time travel) have been removed. What is left is the localStorage mock that stands in for the server:
* `live.js` — `LiveAPI` (see above) and `liveNow()` (use the server clock).
* `track.js` — order tracking mock (`TRACK_MOCK_DAYS`).
* `app.js` — sign-up / sign-in is device-local (`hashPassword`, accounts in storage); wallet top-up (`openTopUp`) only edits the local balance — connect a payment gateway.
* `worker/worker.js` — `sendOtp()` generates the code locally and shows nothing: send it by SMS and verify on the server. KYC, QR, payouts and live location (real device GPS) are written to storage; post them to the API.
* `admin/admin.js` — `ADMINS` is a hard-coded login: replace with real admin authentication.

## Files added/changed
* `live.js` (new) — timing, order-cell button, `LiveAPI` mock, `LiveMap`, Live page
* `live.css` (new) — styles for all of the above
* `index.html` — Live page section, approve-confirmation sheet, image lightbox, the two new includes
* `app.js` — order card shows the countdown/button; small hooks in `renderAll` and the nav highlight


## Order tracking (track.js)

The "Order Tracking" page shows the whole journey of an order. It reads from one call:

`GET /api/tracking/:slotKey` (slotKey looks like `2026-10-16|t3`)

```json
{
  "slotKey": "2026-10-16|t3",
  "stages": [
    { "key": "slot_confirmed",   "status": "done" },
    { "key": "worker_assigned",  "status": "done" },
    { "key": "shopping",         "status": "current" },
    { "key": "purchased",        "status": "pending", "expected": "2026-10-16" },
    { "key": "packed",           "status": "pending", "expected": "2026-10-17", "note": "At Local Warehouse" },
    { "key": "shipped",          "status": "pending", "expected": "2026-10-19" },
    { "key": "out_for_delivery", "status": "pending", "expected": "2026-10-24" }
  ],
  "shopper": { "name": "Ramesh Kumar", "rating": 4.8, "ordersDone": 320, "phone": "+91...", "photo": null },
  "store":   { "name": "T. Nagar Market, Chennai", "lat": 13.04, "lng": 80.23 }
}
```

- `status` is `done`, `current` or `pending`. The first stage that is not done should be `current`.
- `expected` (YYYY-MM-DD) and `at` (ISO time) are accepted but the page currently shows stage names only.
- Replace the body of `TrackAPI.get()` in `track.js` with a `fetch()` to this URL.
- When the server pushes an update (WebSocket / SSE), call `refreshTracking(slotKey)`. Until then the page polls every 5 seconds.
- Testing without a backend: the DEV panel has "7 · Shipped" and "8 · Out for delivery" buttons.


---

# Admin dashboard: sign in, create account, OTP

Front end only. All calls go through `AdminAuthAPI` in `admin/admin.js` (set `API_BASE` if the API is on another origin; requests use `credentials: 'include'`). No OTP is generated or checked in the browser.

| Call | Body | Success | Errors the UI handles |
|---|---|---|---|
| `POST /api/admin/login` | `{ email, password }` | `200 { otpToken }` (OTP emailed) | `401` wrong email/password |
| `POST /api/admin/signup` | `{ name, email, password }` | `200 { otpToken }` (OTP emailed, **account not created yet**) | `409` email already an admin |
| `POST /api/admin/otp/verify` | `{ otpToken, code }` | `200 { admin: { name, email, role }, token }` (create the account here for sign-up) | `422` wrong code, `410` expired, `429` too many tries |
| `POST /api/admin/otp/resend` | `{ otpToken }` | `200 { otpToken }` | `429` too soon |

Error bodies may include `{ "message": "..." }`, which is shown to the admin. Server rules: 6-digit code, 5 min expiry, max 5 wrong tries, resend at most once per 30 s (the UI also disables Resend for 30 s). Hash passwords, and never return the code to the browser.

After `/otp/verify` the front end stores `{ name, email, role, token }` in `visasra_admin_session_v1`. Settings > Team (add/remove admin) is still a local mock and needs its own endpoints.
