/* =====================================================================
   LIVE SHOPPING — customer side
   ---------------------------------------------------------------------
   What this file does
   1. Works out when a booked slot is "live" and shows a countdown / a
      "Track your shopper" button under the order cell.
   2. Draws the Live page: map, shopper card, the customer's products,
      and the Approve / Reject cards for the options the shopper uploads.
   3. Talks to the server ONLY through the `LiveAPI` object below.

   For the backend developer
   - `LiveAPI` is a localStorage MOCK. Replace its three methods with real
     fetch() calls (see BACKEND_INTEGRATION.md for URLs + JSON shapes).
   - The map is drawn by `LiveMap.render()` — swap it for Google Maps /
     Mapbox / Leaflet; the data it needs is `session.location` + `session.store`.
   - The wallet is debited on the SERVER when an option is approved. The
     response returns the new balance, which the UI then displays.

   This file loads BEFORE app.js, so it only touches app.js globals
   (state, money, toast, …) inside functions, never at load time.
   ===================================================================== */

/* ---------------------------------------------------------------- clock */
function liveNow() {
  return Date.now();                     // BACKEND: use the server clock (e.g. Date.now() + serverOffset)
}

/* ---------------------------------------------------------- slot timing */
function slotWindow(slot) {
  if (!slot || !slot.id) return null;
  const wid = String(slot.id).split('|')[1];
  return SLOT_WINDOWS.find(w => w.id === wid) || null;
}
function slotStartMs(slot) {
  const w = slotWindow(slot);
  if (!w || !slot.iso) return null;
  const d = dateFromIso(slot.iso);
  d.setHours(w.startHour, 0, 0, 0);
  return d.getTime();
}
function slotEndMs(slot) {
  const w = slotWindow(slot);
  if (!w || !slot.iso) return null;
  const d = dateFromIso(slot.iso);
  d.setHours(w.endHour, 0, 0, 0);
  return d.getTime();
}
function fmtCountdown(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d >= 1) return d + 'd ' + h + 'h';
  if (h >= 1) return h + 'h ' + String(mm).padStart(2, '0') + 'm';
  if (m >= 1) return m + ' min';
  return 'less than a minute';
}
/* 'upcoming' (countdown) → 'live' (button, only while the slot window is open) → 'done' (summary)
   or 'ended' (the window is over and no summary was completed: nothing to track any more) */
function slotRefunded(slot) {
  const os = (typeof state !== 'undefined' && state.orders || []).filter(o => o.slot && slot && o.slot.id === slot.id);
  return os.length > 0 && os.every(o => o.refunded);
}
function getSlotPhase(slot) {
  if (slotRefunded(slot)) return { phase: 'refunded' };
  const start = slotStartMs(slot);
  if (start == null) return { phase: 'unknown' };
  const s = peekSession(slot.id);
  if (s && s.status === 'completed') return { phase: 'done', session: s, start };
  const end = slotEndMs(slot);
  if (end != null && liveNow() >= end) return { phase: 'ended', session: s, start, end };
  if (liveNow() >= start || (s && s.status === 'live')) return { phase: 'live', session: s, start, end };
  return { phase: 'upcoming', start, msLeft: start - liveNow() };
}

/* ------------------------------------------------------- session cache
   The UI reads sessions synchronously from this cache; refreshSession()
   fills it from LiveAPI.getSession() (async — works the same with fetch). */
const liveCache = {};
const liveRequested = {};
function peekSession(key) {
  if (!(key in liveCache) && !liveRequested[key]) { liveRequested[key] = true; refreshSession(key); }
  return liveCache[key] || null;
}
async function refreshSession(key) {
  try {
    const s = await LiveAPI.getSession(key);
    const changed = JSON.stringify(liveCache[key] || null) !== JSON.stringify(s || null);
    liveCache[key] = s || null;
    if (changed) { updateLiveFooters(); if (liveView.key === key) renderLive(true); }
  } catch (e) { /* keep the last good copy; the next poll retries */ }
}

/* ------------------------------------------- the button under the order cell */
const LV_ICON = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
};
function pendingApprovals(s) {
  if (!s || !s.products) return 0;
  return s.products.filter(p => p.status === 'options_ready').length;
}
function liveStatusLabel(slot) {
  if (!slot || !slot.id) return null;
  const ph = getSlotPhase(slot).phase;
  return ph === 'live' ? 'Shopping live' : ph === 'done' ? 'Shopping complete' : ph === 'ended' ? 'Slot ended' : null;
}
/* small photos the shopper took (pending options, or the ones the customer approved) */
function liveOptionThumbs(s, which) {
  if (!s || !s.products) return '';
  const imgs = [];
  s.products.forEach(p => (p.options || []).forEach(o => { if (o.image && o.status === which) imgs.push(o.image); }));
  if (!imgs.length) return '';
  return `<span class="lb-thumbs">${imgs.slice(0, 3).map(src => `<img src="${escapeAttr(src)}" alt="Photo from your shopper">`).join('')}${imgs.length > 3 ? `<i>+${imgs.length - 3}</i>` : ''}</span>`;
}
function liveFooterInner(slot) {
  const ph = getSlotPhase(slot);
  if (ph.phase === 'upcoming') {
    return `<div class="live-foot is-upcoming">${LV_ICON.clock}<span>Shopping starts in <b>${fmtCountdown(ph.msLeft)}</b></span></div>`;
  }
  if (ph.phase === 'live') {
    const n = pendingApprovals(ph.session);
    return `<button type="button" class="live-btn" onclick="event.stopPropagation(); openLiveTrack('${slot.id}')">
      <span class="live-pulse"></span>
      <span class="lb-txt"><b>Track your shopper</b><small>${n ? n + (n === 1 ? ' product is' : ' products are') + ' waiting for your approval' : 'Shopping is live right now'}</small></span>
      ${liveOptionThumbs(ph.session, 'pending')}
      ${n ? `<span class="lb-badge">${n}</span>` : ''}
      <span class="lb-arrow">${LV_ICON.chev}</span>
    </button>`;
  }
  if (ph.phase === 'done') {
    return `<button type="button" class="live-btn is-done" onclick="event.stopPropagation(); openLiveTrack('${slot.id}')">
      <span class="lb-tick">${LV_ICON.check}</span>
      <span class="lb-txt"><b>View shopping summary</b><small>Everything for this slot is approved</small></span>
      ${liveOptionThumbs(ph.session, 'approved')}
      <span class="lb-arrow">${LV_ICON.chev}</span>
    </button>`;
  }
  if (ph.phase === 'ended') {
    return `<div class="live-foot is-ended">${LV_ICON.clock}<span>This slot has ended</span></div>`;
  }
  return '';
}
function liveFooterHtml(slot) {
  if (!slot || !slot.id || !slot.iso) return '';
  return `<div class="live-foot-host" data-slot="${slot.id}">${liveFooterInner(slot)}</div>`;
}
function findSlotByKey(key) {
  const o = (state.orders || []).find(x => x.slot && x.slot.id === key);
  return o ? o.slot : null;
}
/* Refresh footers + status pills in place (keeps any expanded order cell open). */
function updateLiveFooters() {
  document.querySelectorAll('.live-foot-host').forEach(el => {
    const slot = findSlotByKey(el.dataset.slot);
    if (!slot) return;
    el.innerHTML = liveFooterInner(slot);
    const card = el.closest('.booking-card');
    const pill = card && card.querySelector('.status-pill');
    const label = liveStatusLabel(slot);
    if (pill && label) pill.textContent = label;
  });
}
/* Every 15 s: refresh countdowns, and re-check slots that are live. */
function liveTick() {
  updateLiveFooters();
  const keys = {};
  /* every slot that is not finished: a booking for tomorrow must notice the shopper accepting / starting too */
  (state.orders || []).forEach(o => { if (o.slot && o.slot.iso) { const ph = getSlotPhase(o.slot).phase; if (ph !== 'done' && ph !== 'refunded' && ph !== 'unknown') keys[o.slot.id] = 1; } });
  Object.keys(keys).forEach(refreshSession);
}
setInterval(() => { if (typeof state !== 'undefined') liveTick(); }, 3000);
window.addEventListener('storage', ev => { if (ev.key && ev.key.indexOf('visasra_live') === 0 && typeof state !== 'undefined') liveTick(); });
setInterval(() => { if (liveView.key && isLiveScreenActive()) refreshSession(liveView.key); }, 4000);

/* ===================================================================
   LiveAPI — MOCK. Replace these methods with real server calls.
   Every method returns a Promise so swapping in fetch() is a drop-in.
   =================================================================== */
const LiveAPI = {
  /** GET /api/live/:slotKey  → session (see BACKEND_INTEGRATION.md) */
  async getSession(slotKey) { return mockSessionFor(slotKey); },

  /** POST /api/live/:slotKey/products/:itemId/options/:optionId/approve
      The server debits the wallet and returns { session, wallet }.
      If the balance is too low it must answer 402 → throw { code:'INSUFFICIENT_FUNDS' }. */
  async approveOption(slotKey, itemId, optionId) {
    const all = mockAll(); const s = all[slotKey];
    const p = s && s.products.find(x => x.itemId === itemId);
    const o = p && p.options.find(x => x.id === optionId);
    if (!o) throw { code: 'NOT_FOUND' };
    const amount = o.price * (p.qty || 1);
    if (state.wallet.balance < amount) throw { code: 'INSUFFICIENT_FUNDS', need: amount, balance: state.wallet.balance };
    p.options.forEach(x => { x.status = x.id === optionId ? 'approved' : (x.status === 'rejected' ? 'rejected' : 'not_chosen'); });
    p.status = 'approved'; p.approvedAmount = amount;
    mockWrite(all);
    return {
      session: s,
      wallet: { balance: state.wallet.balance - amount, transaction: { id: uid(), type: 'debit', amount, note: 'Approved: ' + p.name, date: todayLabel() } },
    };
  },

  /** POST /api/live/:slotKey/products/:itemId/options/:optionId/reject → { session } */
  async rejectOption(slotKey, itemId, optionId) {
    const all = mockAll(); const s = all[slotKey];
    const p = s && s.products.find(x => x.itemId === itemId);
    const o = p && p.options.find(x => x.id === optionId);
    if (!o) throw { code: 'NOT_FOUND' };
    o.status = 'rejected';
    if (!p.options.some(x => x.status === 'pending' || x.status === 'approved')) p.status = 'needs_options';
    mockWrite(all);
    return { session: s };
  },
};

/* ---- mock storage (per signed-in user) ---- */
function mockKey() { return 'visasra_live_v1:' + (currentEmail() || 'guest'); }
function mockAll() { try { return JSON.parse(localStorage.getItem(mockKey())) || {}; } catch (e) { return {}; } }
function mockWrite(all) { try { localStorage.setItem(mockKey(), JSON.stringify(all)); } catch (e) {} }
function mockSessionFor(slotKey) {
  const all = mockAll();
  const group = groupOrdersBySlot((state.orders || []).filter(o => o.slot && o.slot.id === slotKey))[0];
  if (!group) return all[slotKey] || null;
  let s = all[slotKey];
  if (!s) {
    s = all[slotKey] = { slotKey, status: 'scheduled', stage: 'scheduled', shopper: null, location: null, store: null, products: [] };
  }
  group.items.forEach(it => {        // make sure every ordered product has an entry
    if (!s.products.some(p => p.itemId === it.id)) {
      s.products.push({ itemId: it.id, name: it.name, qty: it.qty || 1, estMin: it.priceMin, estMax: it.priceMax, status: 'waiting', options: [] });
    }
  });
  mockWrite(all);
  return s;
}

/* ===================================================================
   LiveMap — the map. MOCK drawing (pure SVG, no external service).
   BACKEND/FRONTEND: replace the body of render() with Google Maps,
   Mapbox or Leaflet. Inputs: session.location {lat,lng,updatedAt,etaMin},
   session.store {name,address,lat,lng}.
   =================================================================== */
const LiveMap = {
  render(el, s) {
    const W = 600, H = 360, pad = 70;
    const pts = [];
    if (s && s.store) pts.push(s.store);
    if (s && s.location) pts.push(s.location);
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map showing your shopper's live location">
      <rect width="${W}" height="${H}" fill="#E4EEFA"/>
      <path d="M-10 250 C 120 210, 210 300, 340 262 S 540 200, 620 238 L620 380 L-10 380 Z" fill="#C9E0F7"/>
      <rect x="388" y="36" width="120" height="76" rx="18" fill="#D3EBCB"/>
      <rect x="40" y="48" width="86" height="58" rx="14" fill="#D3EBCB"/>
      <g stroke="#fff" stroke-linecap="round" fill="none">
        <path d="M0 110 H600" stroke-width="12"/><path d="M0 190 H600" stroke-width="9"/>
        <path d="M150 0 V360" stroke-width="12"/><path d="M300 0 V360" stroke-width="9"/><path d="M455 0 V360" stroke-width="12"/>
        <path d="M0 60 L 600 150" stroke-width="5" opacity=".9"/><path d="M60 360 L 330 0" stroke-width="5" opacity=".9"/>
      </g>`;
    if (pts.length) {
      const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng);
      let minLa = Math.min(...lats), maxLa = Math.max(...lats), minLn = Math.min(...lngs), maxLn = Math.max(...lngs);
      if (maxLa - minLa < 0.004) { minLa -= 0.003; maxLa += 0.003; }
      if (maxLn - minLn < 0.004) { minLn -= 0.003; maxLn += 0.003; }
      const X = ln => pad + (ln - minLn) / (maxLn - minLn) * (W - pad * 2);
      const Y = la => H - pad - (la - minLa) / (maxLa - minLa) * (H - pad * 2);
      if (s.store && s.location) {
        svg += `<path d="M${X(s.location.lng)} ${Y(s.location.lat)} L ${X(s.store.lng)} ${Y(s.store.lat)}" stroke="#1261B5" stroke-width="5" stroke-dasharray="2 11" stroke-linecap="round" fill="none"/>`;
      }
      if (s.store) {
        const x = X(s.store.lng), y = Y(s.store.lat);
        svg += `<g transform="translate(${x} ${y})"><path d="M0 0 C -26 -26, -26 -54, 0 -54 C 26 -54, 26 -26, 0 0Z" fill="#FF8A00" stroke="#fff" stroke-width="3"/>
          <rect x="-9" y="-44" width="18" height="15" rx="3" fill="#fff"/><path d="M-5 -44 V-48 a5 5 0 0 1 10 0 V-44" stroke="#fff" stroke-width="2.4" fill="none"/></g>`;
      }
      if (s.location) {
        const x = X(s.location.lng), y = Y(s.location.lat);
        svg += `<g transform="translate(${x} ${y})"><circle r="22" fill="#1261B5" opacity=".18"><animate attributeName="r" values="14;34;14" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".35;0;.35" dur="2.4s" repeatCount="indefinite"/></circle>
          <circle r="15" fill="#1261B5" stroke="#fff" stroke-width="4"/><circle cx="0" cy="-3" r="3.6" fill="#fff"/><path d="M-6 7 a6 5 0 0 1 12 0" fill="#fff"/></g>`;
      }
    }
    svg += '</svg>';
    el.innerHTML = svg;
  },
};

/* ===================================================================
   LIVE PAGE
   =================================================================== */
const liveView = { key: null, lastHtml: '', busy: false };
function isLiveScreenActive() {
  const a = document.querySelector('.screen.active');
  return !!a && a.dataset.screen === 'liveTrack';
}
function openLiveTrack(key) {
  liveView.key = key; liveView.lastHtml = '';
  refreshSession(key);
  showScreen('liveTrack');
}
function liveGroup() {
  return groupOrdersBySlot((state.orders || []).filter(o => o.slot && o.slot.id === liveView.key))[0] || null;
}
const LV_STAGES = ['scheduled', 'assigned', 'heading_to_store', 'shopping', 'purchased', 'packed'];
function stageIndex(s) { const i = LV_STAGES.indexOf(s && s.stage); return i < 0 ? 0 : i; }
function ago(ms) {
  const sec = Math.max(0, Math.round((Date.now() - ms) / 1000));   // location timestamps come from the server clock
  if (sec < 10) return 'just now';
  if (sec < 60) return sec + 's ago';
  return Math.round(sec / 60) + ' min ago';
}
function initials(name) { return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''); }

function stageMessage(s) {
  switch (s && s.stage) {
    case 'assigned': return 'A shopper has been assigned to your slot';
    case 'heading_to_store': return `Your shopper is on the way` + (s.location && s.location.etaMin ? ` · about ${s.location.etaMin} min away` : '');
    case 'shopping': return 'Your shopper is shopping for your items';
    case 'purchased': return 'All items purchased';
    case 'packed': return 'Packed and ready';
    default: return 'Your shopper will be assigned shortly';
  }
}
function timelineHtml(s, g) {
  const idx = stageIndex(s);
  const approved = s ? s.products.filter(p => p.status === 'approved' || p.status === 'purchased').length : 0;
  const total = g ? g.items.length : 0;
  const steps = [
    ['Slot confirmed', g ? g.slot.date + ' · ' + g.slot.time : '', 0],
    ['Shopper assigned', s && s.shopper ? 'Your shopper is on the job' : 'Waiting for assignment', 1],
    ['Shopper on the way', s && s.location && s.location.etaMin ? 'About ' + s.location.etaMin + ' min away' : '', 2],
    ['Shopping in progress', total ? approved + ' of ' + total + ' products approved' : '', 3],
    ['Items purchased', 'Expected once approvals are done', 4],
    ['Packed & ready', 'At our local warehouse', 5],
  ];
  return steps.map(([t, d, i]) => {
    const state_ = i === 0 || i < idx ? 'done' : i === idx ? 'current' : 'pending';
    return `<li class="lv-step is-${state_}"><span class="lv-dot">${state_ === 'done' ? LV_ICON.check : '<i></i>'}</span>
      <div><b>${escapeHtml(t)}</b>${d ? `<span>${escapeHtml(d)}</span>` : ''}</div></li>`;
  }).join('');
}
const PILLS = {
  waiting: ['Waiting', 'is-wait'], options_ready: ['Pick an option', 'is-action'], needs_options: ['Finding more', 'is-wait'],
  approved: ['Approved', 'is-ok'], purchased: ['Purchased', 'is-ok'],
};
function estChip(price, min, max) {
  if (!min || !max) return '';
  if (price < min) return '<em class="lv-chip is-low">Below your estimate</em>';
  if (price > max) return '<em class="lv-chip is-high">Above your estimate</em>';
  return '<em class="lv-chip is-ok">Within your estimate</em>';
}
function optionHtml(p, o, i, balance) {
  const qty = p.qty || 1, total = o.price * qty;
  const letter = String.fromCharCode(65 + i);
  const acting = o.status === 'pending';
  const short = acting && balance < total;
  return `<div class="lv-opt is-${o.status}">
    <button type="button" class="lv-opt-img" onclick="openLightbox('${escapeAttr(o.image)}')" aria-label="View option ${letter} larger">
      <img src="${escapeAttr(o.image)}" alt="Option ${letter}" loading="lazy" onerror="this.parentNode.classList.add('no-img'); this.remove()">
      <span class="lv-opt-tag">Option ${letter}</span>
    </button>
    <div class="lv-opt-body">
      <div class="lv-opt-price">${money(total)}${qty > 1 ? `<small>${money(o.price)} × ${qty}</small>` : ''}</div>
      ${estChip(o.price, p.estMin, p.estMax)}
      <p class="lv-opt-desc">${escapeHtml(o.description || '')}</p>
      ${acting ? `<div class="lv-opt-actions">
          <button type="button" class="lv-btn-reject" onclick="liveReject('${p.itemId}','${o.id}')">Reject</button>
          ${short
            ? `<button type="button" class="lv-btn-topup" onclick="openTopUp('live')">Add money to approve</button>`
            : `<button type="button" class="lv-btn-approve" onclick="liveAskApprove('${p.itemId}','${o.id}')">Approve</button>`}
        </div>${short ? `<div class="lv-short">You need ${money(total - balance)} more in Visasra Money.</div>` : ''}`
      : `<div class="lv-opt-state">${o.status === 'approved' ? LV_ICON.check + ' Approved' : o.status === 'rejected' ? 'Rejected' : 'Not chosen'}</div>`}
    </div>
  </div>`;
}
function productCardHtml(it, p, balance) {
  const status = p ? p.status : 'waiting';
  const [label, cls] = PILLS[status] || PILLS.waiting;
  const qty = it.qty || 1;
  let body = '';
  if (!p || status === 'waiting') {
    body = `<div class="lv-wait"><span class="lv-shimmer"></span>Your shopper hasn't reached this product yet. The options will appear right here.</div>`;
  } else {
    const opts = p.options || [];
    const live = opts.filter(o => o.status === 'pending');
    const chosen = opts.find(o => o.status === 'approved');
    if (status === 'needs_options') body += `<div class="lv-wait is-warn">You rejected every option — your shopper is finding new ones.</div>`;
    if (chosen) {
      body += `<div class="lv-paid">${LV_ICON.check}<span><b>${money(p.approvedAmount || chosen.price * qty)}</b> paid from Visasra Money</span></div>`;
      body += `<div class="lv-opts">${optionHtml(p, chosen, opts.indexOf(chosen), balance)}</div>`;
      const rest = opts.filter(o => o !== chosen);
      if (rest.length) body += `<details class="lv-others"><summary>Other options (${rest.length})</summary><div class="lv-opts">${rest.map(o => optionHtml(p, o, opts.indexOf(o), balance)).join('')}</div></details>`;
    } else if (opts.length) {
      body += `<div class="lv-opts">${opts.map((o, i) => optionHtml(p, o, i, balance)).join('')}</div>`;
    }
  }
  return `<article class="lv-prod">
    <header class="lv-prod-head">
      ${itemThumb(it)}
      <div class="lv-prod-info"><h3>${escapeHtml(it.name)}</h3>
        <div class="lv-prod-sub">Qty ${qty} · your estimate ${money(it.priceMin)}–${money(it.priceMax)}</div></div>
      <span class="lv-pill ${cls}">${label}</span>
    </header>
    ${it.desc ? `<div class="lv-prod-note"><b>Your note:</b> ${escapeHtml(it.desc)}</div>` : ''}
    ${refThumbsHtml(it)}
    ${body}
  </article>`;
}
function liveHtml(g, s) {
  const balance = state.wallet.balance;
  const slot = g.slot;
  const done = s && s.status === 'completed';
  const approved = s ? s.products.filter(p => p.status === 'approved' || p.status === 'purchased').length : 0;
  const total = g.items.length;
  const spent = s ? s.products.reduce((a, p) => a + (p.approvedAmount || 0), 0) : 0;
  const sh = s && s.shopper;
  const productsHtml = g.items.map(it => productCardHtml(it, s && (s.products.find(p => p.itemId === it.id) || null), balance)).join('');
  const onlineHtml = g.onlineItems.length ? `<div class="lv-online"><b>Online orders we'll collect (${g.onlineItems.length})</b>${g.onlineItems.map(o => `<a class="item-link" href="${escapeAttr(o.link)}" target="_blank" rel="noopener">${escapeHtml(o.link.slice(0, 44))}</a>`).join('')}</div>` : '';
  const allDone = total > 0 && approved === total;
  return `
    <div class="lv-head">
      <div><h1>Live shopping</h1><div class="lv-sub">${escapeHtml(slot.date)} · ${escapeHtml(slot.time)}</div></div>
      <span class="lv-live-pill ${done ? 'is-done' : ''}"><i></i>${done ? 'Completed' : 'Live'}</span>
    </div>
    <div class="lv-grid">
      <section class="lv-card lv-map-card" style="grid-area:map">
        <div class="lv-map" id="lvMap"></div>
        <div class="lv-map-top"><span class="lv-live-dot"></span>${s && s.location ? 'Live · updated ' + ago(s.location.updatedAt) : 'Waiting for your shopper'}</div>
        <div class="lv-map-foot">
          <div class="lv-stage">${LV_ICON.pin}<span>${escapeHtml(stageMessage(s))}</span></div>
          ${s && s.location ? `<a class="lv-maps-link" href="https://www.google.com/maps?q=${s.location.lat},${s.location.lng}" target="_blank" rel="noopener">Open in Maps</a>` : ''}
        </div>
      </section>

      <section class="lv-card lv-shopper" style="grid-area:shopper">
        <div class="lv-avatar${sh ? '' : ' is-empty'}">${sh ? LV_ICON.check : ''}</div>
        <div class="lv-shopper-info"><small>Your shopper</small><b>${sh ? 'Assigned' : 'Assigning…'}</b><span>${sh ? 'Visasra shopper is handling your slot' : "We'll let you know when someone accepts"}</span></div>
      </section>

      <section class="lv-products" style="grid-area:products">
        <div class="lv-sec-head">
          <h2>Your products</h2>
          <div class="lv-wallet">${LV_ICON.wallet}<span>Visasra Money <b>${money(balance)}</b></span><button type="button" onclick="openTopUp('live')">+ Add</button></div>
        </div>
        <div class="lv-progress"><div class="lv-bar"><i style="width:${total ? Math.round(approved / total * 100) : 0}%"></i></div><span>${approved} of ${total} approved</span></div>
        ${productsHtml}
        ${onlineHtml}
        ${allDone ? `<div class="lv-summary">${LV_ICON.check}<div><b>All products approved</b><span>${money(spent)} paid from Visasra Money. Your shopper will pack and ship everything.</span></div></div>` : ''}
      </section>

      <section class="lv-card lv-timeline" style="grid-area:timeline">
        <h2>Progress</h2>
        <ol>${timelineHtml(s, g)}</ol>
      </section>
    </div>`;
}
let liveBusyMsg = false;
function renderLive(force) {
  const root = document.getElementById('liveRoot');
  if (!root || !isLiveScreenActive() || !liveView.key) return;
  const g = liveGroup();
  if (!g) { root.innerHTML = '<div class="empty-state">This booking could not be found.</div>'; return; }
  const s = peekSession(liveView.key);
  const html = liveHtml(g, s);
  const sig = html + '|' + state.wallet.balance;
  if (!force && liveView.lastHtml === sig) return;
  const scrollTop = document.querySelector('.screens').scrollTop;
  liveView.lastHtml = sig;
  root.innerHTML = html;
  LiveMap.render(document.getElementById('lvMap'), s);
  document.querySelector('.screens').scrollTop = scrollTop;
}

/* ---------------- approve / reject ---------------- */
let pendingApprove = null;
function liveFind(itemId, optionId) {
  const s = peekSession(liveView.key);
  const p = s && s.products.find(x => x.itemId === itemId);
  const o = p && p.options.find(x => x.id === optionId);
  return { s, p, o };
}
function liveAskApprove(itemId, optionId) {
  const { p, o } = liveFind(itemId, optionId);
  if (!p || !o) return;
  const amount = o.price * (p.qty || 1);
  pendingApprove = { itemId, optionId, amount };
  document.getElementById('lcImg').src = o.image;
  document.getElementById('lcName').textContent = p.name + (p.qty > 1 ? ' × ' + p.qty : '');
  document.getElementById('lcAmount').textContent = money(amount);
  document.getElementById('lcBalance').textContent = money(state.wallet.balance - amount);
  document.getElementById('liveConfirm').classList.add('active');
}
function closeLiveConfirm() { document.getElementById('liveConfirm').classList.remove('active'); pendingApprove = null; }
async function liveConfirmApprove() {
  if (!pendingApprove || liveView.busy) return;
  const { itemId, optionId } = pendingApprove;
  liveView.busy = true;
  const btn = document.getElementById('lcGo'); btn.disabled = true; btn.textContent = 'Approving…';
  try {
    const res = await LiveAPI.approveOption(liveView.key, itemId, optionId);
    if (res.wallet) {                     // the server did the debit; mirror it in the UI
      state.wallet.balance = res.wallet.balance;
      if (res.wallet.transaction) state.wallet.transactions.unshift(res.wallet.transaction);
    }
    liveCache[liveView.key] = res.session;
    saveState();
    closeLiveConfirm();
    toast('Approved · ' + money(res.wallet && res.wallet.transaction ? res.wallet.transaction.amount : 0) + ' deducted');
    renderAll(); renderLive(true); updateLiveFooters();
  } catch (e) {
    closeLiveConfirm();
    if (e && e.code === 'INSUFFICIENT_FUNDS') { toast('Not enough Visasra Money — please add funds'); openTopUp('live'); }
    else toast('Could not approve right now. Please try again.');
  } finally {
    liveView.busy = false; btn.disabled = false; btn.textContent = 'Approve & pay';
  }
}
async function liveReject(itemId, optionId) {
  if (liveView.busy) return;
  liveView.busy = true;
  try {
    const res = await LiveAPI.rejectOption(liveView.key, itemId, optionId);
    liveCache[liveView.key] = res.session;
    toast('Option rejected — your shopper has been told');
    renderLive(true); updateLiveFooters();
  } catch (e) { toast('Could not reject right now. Please try again.'); }
  finally { liveView.busy = false; }
}

/* ---------------- image zoom ---------------- */
function openLightbox(src) { document.getElementById('lbImg').src = src; document.getElementById('lightbox').classList.add('active'); }
function closeLightbox() { document.getElementById('lightbox').classList.remove('active'); }
