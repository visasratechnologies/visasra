/* =====================================================================
   ORDER TRACKING — customer side
   ---------------------------------------------------------------------
   One page that shows the whole journey of an order, from "Slot confirmed"
   to "Out for delivery", plus the shopper's card.

   For the backend developer
   - The page talks to the server ONLY through `TrackAPI.get(slotKey)`.
     Replace its body with  fetch('/api/tracking/' + encodeURIComponent(slotKey))
     (JSON shape is in BACKEND_INTEGRATION.md → "Order tracking").
   - Call `refreshTracking(slotKey)` whenever a push message arrives
     (WebSocket / SSE) and the page updates by itself. Until then it polls.

   Stages (same order as the design):
     slot_confirmed → worker_assigned → shopping → purchased →
     packed → shipped → out_for_delivery
   Each stage has status 'done' | 'current' | 'pending'.
   The first stage that is not 'done' should be 'current'.
   ===================================================================== */

const TRACK_STAGES = [
  { key: 'slot_confirmed',   title: 'Slot Confirmed' },
  { key: 'worker_assigned',  title: 'Worker Assigned' },
  { key: 'shopping',         title: 'Shopping in Progress' },
  { key: 'purchased',        title: 'Items Purchased' },
  { key: 'packed',           title: 'Packed & Ready', note: 'At Local Warehouse' },
  { key: 'shipped',          title: 'Shipped to Your Country' },
  { key: 'out_for_delivery', title: 'Out for Delivery' },
];
/* Only used by the mock: how many days after the slot each stage is expected. */
const TRACK_MOCK_DAYS = { purchased: 0, packed: 1, shipped: 3, out_for_delivery: 8 };

function trackFmtDate(d) {
  return d.getDate() + ' ' + MON_SHORT[d.getMonth()] + ' ' + d.getFullYear();
}

/* ------------------------------------------------------------ API (MOCK) */
const TrackAPI = {
  /** GET /api/tracking/:slotKey → { slotKey, stages:[{key,status,expected?,at?,note?}], shopper, store } */
  async get(slotKey) {
    const session = await LiveAPI.getSession(slotKey);
    const slot = findSlotByKey(slotKey);
    if (!slot) return null;
    const idx = session ? stageIndex(session) : 0;
    const finished = session && session.status === 'completed';
    const ship = session && session.shipStage;          // 'shipped' | 'out_for_delivery' | 'delivered'
    const done = {
      slot_confirmed: true,
      worker_assigned: !!(session && session.shopper),
      shopping: idx >= 4 || finished,
      purchased: idx >= 4 || finished,
      packed: idx >= 5 || finished,
      shipped: ship === 'shipped' || ship === 'out_for_delivery' || ship === 'delivered',
      out_for_delivery: ship === 'out_for_delivery' || ship === 'delivered',
    };
    const base = slot.iso ? dateFromIso(slot.iso) : new Date();
    let currentSet = false;
    const stages = TRACK_STAGES.map(st => {
      let status = 'pending';
      if (done[st.key]) status = 'done';
      else if (!currentSet) { status = 'current'; currentSet = true; }
      const out = { key: st.key, status };
      if (st.note) out.note = st.note;
      if (status !== 'done' && st.key in TRACK_MOCK_DAYS) {
        const d = new Date(base); d.setDate(d.getDate() + TRACK_MOCK_DAYS[st.key]);
        out.expected = d.toISOString().slice(0, 10);
      }
      return out;
    });
    return { slotKey, stages, shopper: session && session.shopper || null, store: session && session.store || null };
  },
};

/* ----------------------------------------------------------------- state */
const trackView = { key: null, data: null, lastHtml: '' };
function isTrackingScreenActive() {
  const a = document.querySelector('.screen.active');
  return !!a && a.dataset.screen === 'tracking';
}
function openTracking(key) {
  trackView.key = key; trackView.data = null; trackView.lastHtml = '';
  refreshTracking(key);
  showScreen('tracking');
}
async function refreshTracking(key) {
  try {
    const d = await TrackAPI.get(key);
    if (trackView.key !== key) return;
    trackView.data = d;
    if (isTrackingScreenActive()) renderTracking();
  } catch (e) { /* keep the last good copy; the next poll retries */ }
}
setInterval(() => { if (trackView.key && isTrackingScreenActive()) refreshTracking(trackView.key); }, 5000);

/* ---------------------------------------------------------------- render */
const TK_ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
};
function trackGroup(key) {
  return groupOrdersBySlot((state.orders || []).filter(o => o.slot && o.slot.id === key))[0] || null;
}
function trackStepsHtml(data, g) {
  return data.stages.map(st => {
    const def = TRACK_STAGES.find(x => x.key === st.key) || { title: st.key };
    return `<li class="tk-step is-${st.status}">
      <span class="tk-dot">${st.status === 'done' ? TK_ICON.check : '<i></i>'}</span>
      <div class="tk-text"><b>${escapeHtml(def.title)}</b></div>
    </li>`;
  }).join('');
}
function trackShopperHtml(sh) {
  return `<div class="tk-shopper"><div class="lv-avatar${sh ? '' : ' is-empty'}">${sh ? LV_ICON.check : ''}</div><div class="tk-sh-info"><small>Your shopper</small><b>${sh ? 'Assigned' : 'Assigning…'}</b><span>${sh ? 'Visasra shopper is handling your slot' : "We'll let you know when someone accepts"}</span></div></div>`;
}
function renderTracking() {
  const root = document.getElementById('trackRoot');
  if (!root) return;
  const data = trackView.data, g = trackGroup(trackView.key);
  let html;
  if (!g) {
    html = `<div class="empty-state"><h3>Order not found</h3><p>We couldn't find this order. Head back to your orders and try again.</p></div>`;
  } else if (!data) {
    html = `<h1 class="page-title">Order Tracking</h1><div class="tk-loading">Loading your order…</div>`;
  } else {
    const ids = g.ids.map(i => '#' + i).join(', ');
    html = `
      <h1 class="page-title">Order Tracking</h1>
      <div class="tk-grid">
        <section class="tk-card">
          <div class="tk-order">${g.ids.length > 1 ? 'Orders' : 'Order'} <b>${escapeHtml(ids)}</b></div>
          <div class="tk-placed">Placed on ${escapeHtml(g.createdLabel || '')}</div>
          <ol class="tk-steps">${trackStepsHtml(data, g)}</ol>
        </section>
        <aside class="tk-side">${trackShopperHtml(data.shopper)}</aside>
      </div>`;
  }
  if (html === trackView.lastHtml) return;
  trackView.lastHtml = html;
  root.innerHTML = html;
}
