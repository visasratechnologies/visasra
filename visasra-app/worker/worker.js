/* =====================================================================
   VISASRA WORKER APP  (mobile only)
   ---------------------------------------------------------------------
   Talks to the customer app through the SAME localStorage mock the
   customer's Live page already polls (see ../live.js + ../BACKEND_INTEGRATION.md):

     visasra_accounts_v1          customers          (read)
     visasra_app_state_v1:<email> their orders       (read)
     visasra_live_v1:<email>      live sessions      (read + write)  <- the handshake

   Shop payment (new): after the customer approves an option the worker uploads the shop's
   payment QR; the admin pays the shop and attaches a screenshot. It lives on the product:
     product.payment = { status: 'qr_uploaded' | 'paid', qr, amount, uploadedAt, proof?, paidAt? }
   The worker can only mark an item purchased once status === 'paid'. (Admin dashboard to be built.)

   For the backend developer: everything that touches storage is in the
   "DATA LAYER" block (readJobs / sess / mut). Replace those with fetch()
   calls to the endpoints in BACKEND_INTEGRATION.md and the UI stays as is.
   The worker uploads options via the same session shape the customer reads.
   ===================================================================== */
'use strict';

/* ------------------------------------------------------------ constants */
const ACC = 'visasra_accounts_v1', ST = 'visasra_app_state_v1:', LV = 'visasra_live_v1:';
const WORKERS = 'visasra_workers_v1', WSESSION = 'visasra_worker_session_v1';
const PAY_PER_SLOT = 350, MAX_OPTIONS = 4;
/* Start hour of every slot id. Mirrors SLOT_SCHEDULE in the customer app (11 AM - 9 PM, 2h / 3h / 5h slots);
   t1..t4 are the old windows, kept for earlier bookings. */
const SLOT_START = (() => {
  const m = { t1: 9, t2: 11, t3: 14, t4: 16 };
  [2, 3, 5].forEach(dur => { for (let h = 11, n = 1; h + dur <= 21; h += dur, n++) m['h' + dur + '-' + n] = h; });
  return m;
})();
const SLOT_END = (() => {                                 // end hour of every slot id (same windows as SLOT_START)
  const m = { t1: 11, t2: 13, t3: 16, t4: 18 };
  [2, 3, 5].forEach(dur => { for (let h = 11, n = 1; h + dur <= 21; h += dur, n++) m['h' + dur + '-' + n] = h + dur; });
  return m;
})();
const fmtH = h => (h % 12 || 12) + ':00 ' + (h < 12 ? 'AM' : 'PM');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ---------------------------------------------------------------- icons */
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  home: svg('<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
  slots: svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4"/>'),
  pin: svg('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  wallet: svg('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 20c1.4-4 4.4-6 8-6s6.6 2 8 6"/>'),
  back: svg('<path d="M15 6l-6 6 6 6"/>'),
  cam: svg('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  cal: svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),
  bag: svg('<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  bell: svg('<path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
  phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
};

/* ------------------------------------------------------------ utilities */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const initials = n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
const now = () => Date.now();                       // BACKEND: server clock
const isoOf = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayIso = () => isoOf(new Date(now()));
const dateLabel = d => d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
let toastT;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400); }
const slug = n => String(n || '').toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
/* images saved by the customer app are relative to its index.html; the worker app sits one folder below */
const U = src => !src ? '' : /^(data:|https?:|blob:)/.test(src) ? src : '../' + src;
function refSrc(it) {
  if (it.image) return it.image;
  if (it.images && it.images[0]) return it.images[0];
  return it.imgCat && it.imgName ? 'images/products/' + it.imgCat + '/' + slug(it.imgName) + (it.imgType ? '/' + slug(it.imgType) : '') + '.jpg' : '';
}
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#DCEAFB"/><path d="M20 26h24l-2 22H22z" fill="none" stroke="#1261B5" stroke-width="3" stroke-linejoin="round"/><path d="M26 26v-3a6 6 0 0 1 12 0v3" fill="none" stroke="#1261B5" stroke-width="3"/></svg>');
const photo = (src, cls) => `<img class="ph ${cls || ''}" src="${esc(U(src) || PLACEHOLDER)}" alt="" onerror="photoFallback(this)">`;
function photoFallback(img) {                                 // try other extensions, then the placeholder
  const exts = ['jpeg', 'png', 'webp'], m = img.src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i);
  const n = +(img.dataset.try || 0);
  if (m && n < exts.length && !img.src.startsWith('data:')) { img.dataset.try = n + 1; img.src = img.src.replace(/\.(jpg|jpeg|png|webp)(\?|$)/i, '.' + exts[n] + '$2'); }
  else { img.onerror = null; img.src = PLACEHOLDER; }
}
/** Every reference photo the customer attached (up to 5), falling back to the catalog picture. */
function refImgs(it) {
  const a = (it.images || []).filter(Boolean);
  if (it.image && !a.includes(it.image)) a.unshift(it.image);
  if (!a.length) { const s = refSrc(it); if (s) a.push(s); }
  return a;
}
const refStrip = it => { const a = refImgs(it); return a.length ? `<div class="refs">${a.map(s => `<img class="ph" src="${esc(U(s))}" alt="Reference photo" onclick="zoom(this.src)" onerror="photoFallback(this)">`).join('')}</div>` : ''; };
function zoom(src) {
  const d = document.createElement('div'); d.className = 'zoom'; d.onclick = () => d.remove();
  d.innerHTML = `<img src="${esc(src)}" alt=""><span>Tap anywhere to close</span>`; document.body.appendChild(d);
}
const addrLine = a => a ? [a.line1, a.line2, a.city, [a.region, a.zip].filter(Boolean).join(' '), a.country].filter(Boolean).join(', ') : '';

/* =================================================================
   DATA LAYER  — swap these for real API calls
   ================================================================= */
/** All customer bookings, grouped into one "job" per customer per slot (same key the customer app uses). */
function readJobs() {
  const out = [];
  rd(ACC, []).forEach(a => {
    const st = rd(ST + a.email, null);
    if (!st || !st.orders) return;
    const live = rd(LV + a.email, {}), groups = {};
    st.orders.filter(o => o.slot && o.slot.id && o.slot.iso && !o.refunded).forEach(o => (groups[o.slot.id] = groups[o.slot.id] || []).push(o));
    Object.keys(groups).forEach(key => {
      const os = groups[key], items = [];
      os.forEach(o => (o.items || []).forEach(it => items.push(it)));
      out.push({
        id: a.email + '#' + key, email: a.email, key, customer: a.name || a.email.split('@')[0], slot: os[0].slot, items, onlineItems: os.flatMap(o => o.onlineItems || []),
        address: os.find(o => o.address) ? os.find(o => o.address).address : null,
        notes: os.map(o => o.instructions).filter(Boolean).join(' · '), orderIds: os.map(o => o.id), session: live[key] || null,
      });
    });
  });
  return out;
}
/** A session with an entry for every ordered product (same shape the customer mock creates). */
function sess(j, base) {
  const s = base || j.session || { slotKey: j.key, status: 'scheduled', stage: 'scheduled', shopper: null, location: null, store: null, products: [] };
  j.items.forEach(it => {
    if (!s.products.some(p => p.itemId === it.id)) s.products.push({ itemId: it.id, name: it.name, qty: it.qty || 1, estMin: it.priceMin, estMax: it.priceMax, status: 'waiting', options: [] });
  });
  return s;
}
/** Read-only copy of a job's session (never mutates stored data). */
const view = j => sess(j, j.session && JSON.parse(JSON.stringify(j.session)));
/** Read-modify-write on the freshest copy so a customer's approval is never overwritten. */
function mut(j, fn) {
  const all = rd(LV + j.email, {});
  const s = sess(j, all[j.key]);
  if (fn(s) === false) return false;
  all[j.key] = s; j.session = s;
  if (!wr(LV + j.email, all)) { toast('Storage is full — try a smaller photo'); return false; }
  return true;
}

/* ------------------------------------------------------------ worker profile */
const loadWorkers = () => rd(WORKERS, {});
let W = (() => { const p = localStorage.getItem(WSESSION); return p ? loadWorkers()[p] || null : null; })();
const kycOf = () => (W && W.kyc) || { status: 'none' };
const kycOK = () => kycOf().status === 'approved';
const maskA = n => 'XXXX XXXX ' + String(n || '').slice(-4);
const maskP = n => n ? n.slice(0, 3) + '••••' + n.slice(-1) : '';
const fmtA = n => String(n || '').replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');
const normPhone = raw => { const d = String(raw).replace(/\D/g, ''); return d.length >= 10 ? '+91 ' + d.slice(-10, -5) + ' ' + d.slice(-5) : ''; };
const DOCS = { af: ['Aadhaar — front', 'Front side with your photo and name'], ab: ['Aadhaar — back', 'Back side with your address'], pan: ['PAN card', 'Clear photo of the whole card'], dl: ["Driver's license", 'Front side, clear and fully visible'], ph: ['Your photo', 'A clear photo of your face, no sunglasses or cap'] };
function saveW() {
  const all = loadWorkers(), fresh = all[W.phone];
  if (fresh) {                                           // fields the ADMIN owns: always keep the stored copy
    W.suspended = !!fresh.suspended;
    const fk = fresh.kyc || {}, wk = W.kyc || {};         // an admin decision newer than our last submission wins
    if (fk.reviewedAt && fk.status !== 'pending' && fk.status !== wk.status && fk.reviewedAt > (wk.submittedAt || 0)) W.kyc = Object.assign({}, wk, fk);
    (fresh.payouts || []).forEach(fp => { const m = (W.payouts || []).find(p => p.date === fp.date && p.amount === fp.amount && p.type === fp.type && !p.paidAt); if (m && fp.paidAt) { m.paidAt = fp.paidAt; m.utr = fp.utr; } });
    if (fresh.suspended) W.online = false;
  }
  all[W.phone] = W; wr(WORKERS, all);
}

/* ------------------------------------------------------------ job helpers */
const mine = j => !!(j.session && j.session.shopper && W && j.session.shopper.wid === W.id);
function phase(j) {
  const s = j.session;
  if (!s || !s.shopper) return isLate(j) ? 'missed' : 'open';
  if (!mine(j)) return 'taken';
  if (s.stage === 'packed' || s.status === 'completed') return 'done';
  if (s.stage === 'purchased') return 'purchased';
  if (s.stage === 'heading_to_store' || s.stage === 'shopping') return 'progress';
  return isLate(j) ? 'missed' : 'assigned';
}
const PHASE_PILL = { missed: ['Missed', 'r'], open: ['Open', 'o'], assigned: ['Accepted', ''], progress: ['In progress', 'o'], purchased: ['Purchased', 'g'], done: ['Completed', 'g'] };
const slotAt = (j, h) => { const [y, m, d] = j.slot.iso.split('-').map(Number); return new Date(y, m - 1, d, h, 0, 0, 0).getTime(); };
const winOf = j => String(j.key).split('|')[1];
const slotStart = j => slotAt(j, SLOT_START[winOf(j)] || 0);
const slotEnd = j => slotAt(j, SLOT_END[winOf(j)] || 24);
const ACCEPT_LEAD_MS = 4 * 3600000;                      // a slot can be accepted from 4 hours before it starts
const acceptAt = j => slotStart(j) - ACCEPT_LEAD_MS;
const tooSoon = j => now() < acceptAt(j);
function acceptLabel(j) {
  const t = new Date(acceptAt(j)), h = t.getHours(), m = t.getMinutes();
  const clock = (h % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : ':00') + ' ' + (h < 12 ? 'AM' : 'PM');
  const day = isoOf(t) === todayIso() ? '' : isoOf(t) === isoOf(new Date(now() + 86400000)) ? ', tomorrow' : ', ' + t.getDate() + ' ' + MON[t.getMonth()];
  return clock + day;
}
const isEarly = j => now() < slotStart(j);
const isLate = j => now() >= slotEnd(j);
const startLabel = j => fmtH(SLOT_START[winOf(j)] || 0) + (j.slot.iso === todayIso() ? '' : ', ' + j.slot.date);
function untilStart(j) { const m = Math.max(1, Math.ceil((slotStart(j) - now()) / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60); return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + (m % 60) + 'm' : m + ' min'; }
const startKey = j => j.slot.iso + String(SLOT_START[String(j.key).split('|')[1]] || 0).padStart(2, '0');
const pill = (t, c) => `<span class="pill ${c || ''}">${t}</span>`;
function visible() {
  return UI.jobs.filter(j => { const p = phase(j); return p !== 'taken' && !(p === 'missed' && !mine(j)) && (p !== 'open' || (W.online && !W.suspended)); }).sort((a, b) => startKey(a) < startKey(b) ? -1 : 1);
}
const estMid = j => j.items.reduce((a, it) => a + (it.priceMax || it.priceMin || 0) * (it.qty || 1), 0);
const range = it => it.priceMin && it.priceMax ? inr(it.priceMin) + ' – ' + inr(it.priceMax) : '';
const pend = p => p.options.filter(o => o.status === 'pending').length;
const cur = () => UI.jobs.find(j => j.id === UI.job) || null;

/* ------------------------------------------------------------ UI state */
const UI = { otp: null, mode: Object.keys(rd(WORKERS, {})).length ? 'in' : 'up', kyc: null, scr: W ? 'home' : 'login', tab: 'upcoming', ptab: 'todo', etab: 'hist', job: null, item: null, form: null, qr: '', store: 0, jobs: [], sig: '', key: '' };
function go(scr, x) { Object.assign(UI, { scr }, x || {}); render(); }
function rawSig() { const wk = W ? ((loadWorkers()[W.phone] || {}).kyc || {}) : {}; return (wk.status || '') + (wk.reviewedAt || '') + '#' +  rd(ACC, []).map(a => (localStorage.getItem(ST + a.email) || '').length + ':' + (localStorage.getItem(LV + a.email) || '')).join('|'); }

/* ------------------------------------------------ notifications + to-do */
const NOTEK = () => 'visasra_worker_notes_' + W.id, SEENK = () => 'visasra_worker_seen_' + W.id;
const notes = () => (W ? rd(NOTEK(), []) : []);
const unread = () => notes().filter(n => !n.read);
/** Spot customer decisions (approve / reject) since the last look and turn them into notifications. */
function scanNotes() {
  if (!W) return;
  const ky = kycOf();
  if ((ky.status === 'approved' || ky.status === 'rejected') && ky.notified !== ky.reviewedAt) {
    ky.notified = ky.reviewedAt; saveW();
    if (ky.status === 'approved') {
      const all = notes(); all.unshift({ id: 'n' + Date.now().toString(36), ts: Date.now(), read: false, type: 'kyc_ok', name: 'Identity verified' }); wr(NOTEK(), all);
      toast('✅ You are verified — you can now accept slots');
    } else toast('Verification needs changes — see the reason');
  }
  const seen = rd(SEENK(), null), cur = {}, add = [];
  UI.jobs.filter(mine).forEach(j => view(j).products.forEach(p => {
    const k = j.id + '|' + p.itemId; cur[k] = p.status; cur[k + '#pay'] = (p.payment && p.payment.status) || '';
    if (seen && seen[k + '#pay'] === 'qr_uploaded' && cur[k + '#pay'] === 'paid') add.push({ type: 'paid', jid: j.id, itemId: p.itemId, name: p.name, amount: p.approvedAmount });
    if (!seen || seen[k] !== 'options_ready') return;
    if (p.status === 'approved') { const a = p.options.find(o => o.status === 'approved'); add.push({ type: 'approved', jid: j.id, itemId: p.itemId, name: p.name, amount: a ? a.price : 0, qty: p.qty }); }
    else if (p.status === 'needs_options') add.push({ type: 'rejected', jid: j.id, itemId: p.itemId, name: p.name });
  }));
  wr(SEENK(), cur);
  if (!add.length) return;
  const all = notes();
  add.forEach(n => all.unshift(Object.assign({ id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: Date.now(), read: false }, n)));
  wr(NOTEK(), all.slice(0, 40));
  toast(add[0].type === 'approved' ? '✅ Customer approved ' + add[0].name + ' — send the shop QR' : add[0].type === 'paid' ? '💸 Admin paid for ' + add[0].name + ' — collect it now' : '↩ Customer wants other options for ' + add[0].name);
  try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) {}
}
/** Slot alerts: a customer just booked a slot, or an open slot has just entered its 4-hour accept window. */
const SLOTSEEN = () => 'visasra_worker_slotseen_' + W.id;
const SLOT_NOTE_TYPES = ['new_slot', 'accept_open'];
const unreadSlots = () => unread().filter(n => SLOT_NOTE_TYPES.includes(n.type));
function scanSlotNotes() {
  if (!W || !kycOK() || W.suspended || !W.online) return false;        // same people who can see open slots
  const seen = rd(SLOTSEEN(), null), cur = {}, add = [];
  UI.jobs.forEach(j => {
    if (phase(j) !== 'open') return;
    const canNow = !tooSoon(j), was = seen && seen[j.id], base = { jid: j.id, name: j.customer, when: j.slot.date + ' · ' + j.slot.time };
    cur[j.id] = { a: canNow ? 1 : 0 };
    if (!seen) return;                                                  // first look: remember what already exists, don't alert
    if (!was) add.push(Object.assign({ type: 'new_slot', canNow }, base));
    else if (!was.a && canNow) add.push(Object.assign({ type: 'accept_open' }, base));
  });
  wr(SLOTSEEN(), cur);
  if (!add.length) return false;
  const all = notes();
  add.forEach(n => all.unshift(Object.assign({ id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: Date.now(), read: false }, n)));
  wr(NOTEK(), all.slice(0, 40));
  const f = add[0];
  toast(f.type === 'new_slot' ? '📅 New slot booked — ' + f.when : '⏰ You can now accept the slot with ' + f.name);
  try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) {}
  return true;
}
function markSlotsRead() { const all = notes(); if (all.some(n => !n.read && SLOT_NOTE_TYPES.includes(n.type))) wr(NOTEK(), all.map(n => SLOT_NOTE_TYPES.includes(n.type) ? Object.assign(n, { read: true }) : n)); }
/** Everything that needs the worker to act, across all of their active slots. */
function actions() {
  const out = [];
  UI.jobs.filter(j => mine(j) && phase(j) !== 'done').forEach(j => view(j).products.forEach(p => {
    const it = j.items.find(i => i.id === p.itemId) || {}, a = p.options.find(o => o.status === 'approved');
    if (p.status === 'approved') {
      if (!p.payment) out.push({ kind: 'qr', j, p, it, a });
      else if (p.payment.status === 'paid') out.push({ kind: 'buy', j, p, it, a });
    } else if (p.status === 'needs_options') out.push({ kind: 'redo', j, p, it });
  }));
  const rank = { buy: 0, qr: 1, redo: 2 };
  return out.sort((x, y) => rank[x.kind] - rank[y.kind]);
}
const ago = ts => { const m = Math.max(0, Math.round((Date.now() - ts) / 60000)); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.round(m / 60) + ' h ago'; };
const noteText = n => n.type === 'new_slot' ? ['New slot booked', n.when + (n.canNow ? ' · tap to accept' : ' · you can accept it 4 hours before')] : n.type === 'accept_open' ? ['You can accept this slot now', n.when + ' · tap to accept'] : n.type === 'kyc_ok' ? ['You are verified ✓', 'you can now go online and accept slots'] : n.type === 'approved' ? ['Customer approved ' + inr(n.amount) + ' each', 'tap to send the shop QR'] : n.type === 'paid' ? ['Admin paid ' + inr(n.amount) + ' to the shop', 'tap to collect & buy'] : ['Customer wants other options', 'tap to find more'];
function openNote(id) {
  const all = notes(), n = all.find(x => x.id === id); if (!n) return;
  n.read = true; wr(NOTEK(), all);
  if (SLOT_NOTE_TYPES.includes(n.type)) return UI.jobs.some(j => j.id === n.jid) ? go('detail', { job: n.jid }) : go('slots');
  if (UI.jobs.some(j => j.id === n.jid)) go('prod', { job: n.jid, item: n.itemId }); else render();
}
function readAll() { wr(NOTEK(), notes().map(n => Object.assign(n, { read: true }))); render(); }
function goAction(jid, itemId) { go('prod', { job: jid, item: itemId }); }
const bell = () => { const c = unread().length; return `<button class="circ bellb" onclick="go('notes')" aria-label="Notifications">${I.bell}${c ? `<i class="cnt">${c}</i>` : ''}</button>`; };
function alertBanner() {
  const u = unread(); if (!u.length || UI.scr === 'notes') return '';
  const n = u[0], ok = n.type !== 'rejected', nt = noteText(n);
  return `<div class="alert ${ok ? 'ok' : 'warn'}" onclick="openNote('${n.id}')"><span class="ai">${ok ? I.check : I.back}</span><div class="grow"><b>${nt[0]}</b><div>${esc(n.name)} · ${nt[1]}</div></div>${u.length > 1 ? `<span class="more">+${u.length - 1}</span>` : ''}</div>`;
}

/* ---------------------------------------------------------------- layout */
function header(title, back, right) {
  return `<div class="hd"><div class="hd-row">${back ? `<button class="circ" onclick="go('${back}')" aria-label="Back">${I.back}</button>` : ''}
    ${title === null ? `<div class="brand"><img src="logo.png" alt=""><span class="wm">Vis<b>asra</b></span></div>` : `<img class="hd-logo" src="logo.png" alt=""><h2 class="serif">${title}</h2>`}${right || ''}${!back && W ? bell() : ''}</div></div>`;
}
function nav(active) {
  const items = [['home', 'Home', 'home'], ['slots', 'My Slots', 'slots'], ['map', 'Map', 'pin'], ['earn', 'Earnings', 'wallet'], ['profile', 'Profile', 'user']];
  const nAct = actions().length + unreadSlots().length;
  return `<nav class="nav">${items.map(([k, t, i]) => `<button class="${k === active ? 'on' : ''}" onclick="go('${k}')"><span class="ic">${I[i]}${k === 'slots' && nAct ? `<i class="cnt">${nAct}</i>` : ''}</span>${t}</button>`).join('')}</nav>`;
}
const shell = (head, body, active, bar) => `<div class="screen">${head}${alertBanner()}<div class="body ${bar ? 'has-bar' : ''}">${body}</div>${bar ? `<div class="bar">${bar}</div>` : ''}${active ? nav(active) : ''}</div>`;

function jobCard(j) {
  const p = phase(j), pc = PHASE_PILL[p], s = view(j);
  const tag = p === 'open' ? (tooSoon(j) ? `<span class="pill">Accept from ${acceptLabel(j)}</span>` : `<button class="btn s" onclick="event.stopPropagation(); accept('${esc(j.id)}')">Accept</button>`) : '';
  const wait = s.products.filter(x => x.status === 'options_ready').length;
  return `<div class="card" onclick="openJob('${esc(j.id)}')" style="cursor:pointer">
    <div class="row"><div class="av">${initials(j.customer)}</div><div class="grow"><div class="b">${esc(j.customer)}</div>
      <div class="m">${I.cal.replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${esc(j.slot.date)} · ${esc(j.slot.time)}</div></div>${tag || pill(pc[0], pc[1])}</div>
    <div class="row m" style="margin-top:10px"><span><b style="color:var(--text)">${j.items.length}</b> product${j.items.length === 1 ? '' : 's'}</span>
      <span class="grow" style="background:#EAF2FC;border-radius:9px;padding:5px;text-align:center"><b style="color:var(--text)">${inr(estMid(j))}</b> est.</span>
      ${wait ? pill(wait + ' with customer', 'o') : ''}</div></div>`;
}

/* --------------------------------------------------------------- screens */
function homeActions() {
  const a = actions(); if (!a.length) return '';
  const mineP = UI.jobs.filter(mine).flatMap(j => view(j).products);
  const waiting = mineP.filter(p => p.status === 'options_ready').length, payWait = mineP.filter(p => p.status === 'approved' && p.payment && p.payment.status === 'qr_uploaded').length;
  const go_ = x => `goAction('${esc(x.j.id)}','${esc(x.p.itemId)}')`;
  const row = (x, cls, img, txt, btn, bcls) => `<div class="card act ${cls}" onclick="${go_(x)}"><div class="row">${photo(img)}<div class="grow"><div class="b sm">${esc(x.p.name)}</div><div class="m">${txt}</div></div><button class="btn s ${bcls}" onclick="event.stopPropagation();${go_(x)}">${btn}</button></div></div>`;
  return `<div class="sec" style="margin-top:6px"><h3>Needs your action</h3><span class="pill o">${a.length}</span></div>` + a.map(x =>
    x.kind === 'buy' ? row(x, 'buy', x.a ? x.a.image : refSrc(x.it), `Admin paid · collect it · <b>${inr(x.p.approvedAmount)}</b>`, 'Buy', 'g')
    : x.kind === 'qr' ? row(x, 'qr', x.a ? x.a.image : refSrc(x.it), `${esc(x.j.customer)} approved <b>${inr(x.a ? x.a.price : 0)}</b> each · send the shop QR`, 'Send QR', '')
    : row(x, 'redo', refSrc(x.it), 'Customer wants other options', 'Find', 'o2')).join('')
    + (waiting + payWait ? `<div class="m" style="margin:-2px 0 6px">${waiting ? waiting + ' waiting for the customer' : ''}${waiting && payWait ? ' · ' : ''}${payWait ? payWait + ' waiting for admin to pay' : ''}.</div>` : '');
}
const V = {
  login() {
    const up = UI.mode === 'up';
    return `<div class="screen login"><img class="logo" src="logo.png" alt=""><div class="wm">Vis<b>asra</b></div>
      <p>Worker app<br>Shop, pack &amp; deliver Indian products to the world</p>
      <div class="seg"><button class="${up ? 'on' : ''}" onclick="setMode('up')">Create account</button><button class="${up ? '' : 'on'}" onclick="setMode('in')">Sign in</button></div>
      ${up ? `<input type="text" id="lgName" data-g="letters" maxlength="60" placeholder="Full name (as on Aadhaar)" autocomplete="name">` : ''}
      <input type="tel" id="lgPhone" data-g="phone" placeholder="10-digit mobile number" inputmode="numeric" maxlength="14" autocomplete="tel">
      <button class="btn" onclick="login()">Send OTP</button>
      <small>${up ? "We'll text you a 6-digit code. After that you'll upload your Aadhaar, PAN, driver's license and a photo of you for a one-time verification." : "We'll text a 6-digit code to the number you registered with."}</small></div>`;
  },

  otp() {
    const o = UI.otp; if (!o) return V.login();
    return `<div class="screen login"><img class="logo" src="logo.png" alt=""><div class="wm">Vis<b>asra</b></div>
      <p>Enter the 6-digit code sent to<br><b style="color:#fff;font-size:17px">${esc(o.phone)}</b></p>
      <div class="otp" id="otpRow">${[0, 1, 2, 3, 4, 5].map(i => `<input class="otpb" inputmode="numeric" maxlength="1" autocomplete="${i ? 'off' : 'one-time-code'}" data-i="${i}" oninput="otpIn(this)" onkeydown="otpKey(event,this)" onpaste="otpPaste(event)" aria-label="Digit ${i + 1}">`).join('')}</div>
      <button class="btn" onclick="verifyOtp()">Verify &amp; continue</button>
      <div class="otpfoot"><button class="link" id="rs" onclick="resendOtp()">Resend OTP</button><span>·</span><button class="link" onclick="otpBack()">Change number</button></div></div>`;
  },

  kycform() {
    const k = kycDraft(), rej = kycOf().status === 'rejected', bad = k.bad;
    const tile = key => {
      const d = k.docs[key], isBad = rej && bad.includes(key), locked = rej && !isBad && !!d;
      return `<div class="kdoc ${isBad ? 'bad' : ''} ${locked ? 'ok' : ''}"><div class="row" style="margin-bottom:8px"><div class="grow b sm">${DOCS[key][0]}</div>${isBad ? pill('Re-upload', 'r') : locked ? pill('Accepted', 'g') : d ? pill('Added', 'g') : pill('Required', 'o')}</div>
        <label class="upload kd ${locked ? 'locked' : ''}">${d ? `<img src="${d}" alt=""><span class="chg">${locked ? '' : 'Tap to change'}</span>` : `${I.cam}<span>${DOCS[key][1]}</span>`}${locked ? '' : `<input type="file" accept="image/*" ${key === 'ph' ? 'capture="user"' : ''} hidden onchange="pickKyc('${key}',this)">`}</label></div>`;
    };
    return `<div class="screen">${header('Verify your identity', null, '').replace(bell(), '')}<div class="body has-bar">
      ${rej ? `<div class="note" style="background:var(--danger-bg,#FDE8E8);border:1.5px solid var(--danger)"><b>Please fix and send again</b><br>${esc(kycOf().reason || 'Some documents could not be verified.')}</div>` : `<div class="note" style="background:#EAF2FC"><b>One-time verification</b><br>We need your Aadhaar, PAN, driver's license and a photo of you before you can accept slots or get paid. An admin reviews them — you'll be notified here.</div>`}
      <div class="sec" style="margin-top:2px"><h3>1 · Your numbers</h3></div>
      <label class="fl">Aadhaar number</label><input class="kin" id="kA" data-g="whole" inputmode="numeric" placeholder="XXXX XXXX XXXX" maxlength="14" value="${esc(fmtA(k.aNo))}" oninput="kycIn()">
      <label class="fl">PAN number</label><input class="kin" id="kP" placeholder="ABCDE1234F" maxlength="10" style="text-transform:uppercase" value="${esc(k.pNo)}" oninput="kycIn()">
      <div class="sec"><h3>2 · Your documents</h3></div>
      ${tile('af')}${tile('ab')}${tile('pan')}${tile('dl')}${tile('ph')}
      <div class="m" style="margin:2px 0 12px">Make sure all four corners of each document are visible, the text is sharp and there is no glare. Your photo should show your face clearly.</div>
      <label class="consent"><input type="checkbox" id="kC" ${k.consent ? 'checked' : ''} onchange="kycIn()"><span>I confirm these documents are mine. Visasra may use them only to verify my identity and to pay me.</span></label>
    </div><div class="bar" style="flex-direction:column;gap:0"><button class="btn" id="kSub" onclick="submitKyc()" ${kycReady() ? '' : 'disabled'}>${rej ? 'Send again for verification' : 'Submit for verification'}</button><button class="link" style="display:block;margin:6px auto 0" onclick="logout()">Sign out</button></div></div>`;
  },

  kycwait() {
    const ky = kycOf(), when = new Date(ky.submittedAt || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    const th = key => ky.docs && ky.docs[key] ? `<div class="kth"><img src="${ky.docs[key]}" alt="" onclick="zoom(this.src)"><span>${DOCS[key][0].replace(' — ', ' ')}</span></div>` : '';
    return `<div class="screen">${header('Verification', null, '').replace(bell(), '')}<div class="body">
      <div class="kwait"><div class="hg"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12M6 22h12M7 2v3.5c0 2 2.2 3.5 5 6.5-2.8 3-5 4.5-5 6.5V22M17 2v3.5c0 2-2.2 3.5-5 6.5 2.8 3 5 4.5 5 6.5V22"/></svg></div>
        <h3>Verification in progress</h3><p>Submitted ${when}. An admin is checking your documents. You'll get a notification here as soon as it's done — you can close the app meanwhile.</p></div>
      <div class="card"><div class="row"><div class="grow"><div class="m">Aadhaar</div><div class="b sm">${maskA(ky.aadhaarNo)}</div></div><div class="grow"><div class="m">PAN</div><div class="b sm">${esc(maskP(ky.panNo))}</div></div></div><div class="kths">${th('af')}${th('ab')}${th('pan')}${th('dl')}${th('ph')}</div></div>
      <button class="btn o" onclick="render()">Check status</button><button class="btn red" style="margin-top:10px" onclick="logout()">Sign out</button>
    </div></div>`;
  },

  kycrej() {
    const ky = kycOf();
    return `<div class="screen">${header('Verification', null, '').replace(bell(), '')}<div class="body">
      <div class="kwait rej"><div class="hg"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg></div>
        <h3>We couldn't verify you yet</h3><p>${esc(ky.reason || 'Some documents could not be verified.')}</p></div>
      ${(ky.bad || []).length ? `<div class="card"><div class="b sm">Please upload again</div><ul class="kul">${ky.bad.map(k => `<li>${DOCS[k][0]}</li>`).join('')}</ul></div>` : ''}
      <button class="btn" onclick="fixKyc()">Fix and send again</button><button class="btn red" style="margin-top:10px" onclick="logout()">Sign out</button>
    </div></div>`;
  },

  home() {
    const list = visible(), t0 = todayIso(), act = list.filter(j => !['done', 'missed'].includes(phase(j)) && (j.slot.iso === t0 || ['progress', 'purchased'].includes(phase(j))));
    const c = f => list.filter(j => f(phase(j))).length;
    const hr = new Date(now()).getHours(), greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    const stat = (n, t, col, bg) => `<div class="stat" style="background:${bg};color:${col}"><b>${n}</b><span>${t}</span></div>`;
    return shell(header(null, null, `<span class="role">Worker</span>`),
      `<div class="hello">${greet},</div><div class="name">${esc(W.name.split(' ')[0])}!</div>
       <div class="m" style="margin:2px 0 14px">${W.online ? 'You are online. New customer slots appear here.' : 'You are offline. Go online in Profile to take new slots.'}</div>
       <div class="stats">${stat(c(p => p === 'open'), 'Open', '#1261B5', '#DCEAFB')}${stat(c(p => ['assigned', 'progress', 'purchased'].includes(p)), 'Active', '#C26A00', '#FFF1E0')}${stat(c(p => p === 'done'), 'Completed', '#228A1B', '#E7F5E5')}</div>
       ${homeActions()}
       <div class="sec"><h3>Today's slots</h3><button class="link" onclick="go('slots')">See all</button></div>
       ${act.length ? act.slice(0, 5).map(jobCard).join('') : `<div class="empty"><b>No slots today</b>Slots booked for today show up here. Tap See all for upcoming ones.</div>`}`, 'home');
  },

  slots() {
    const t = todayIso(), all = visible(), done = j => phase(j) === 'done';
    const live = j => !done(j) && phase(j) !== 'missed';
    const tabs = { today: all.filter(j => live(j) && (j.slot.iso === t || ['progress', 'purchased'].includes(phase(j)))), upcoming: all.filter(j => live(j) && j.slot.iso > t && !['progress', 'purchased'].includes(phase(j))), completed: all.filter(j => done(j) || phase(j) === 'missed').reverse() };
    const tab = (k, l) => `<button class="${UI.tab === k ? 'on' : ''}" onclick="go('slots',{tab:'${k}'})">${l} (${tabs[k].length})</button>`;
    const l = tabs[UI.tab];
    return shell(header('My Shopping Slots'), `<div class="tabs">${tab('today', 'Today')}${tab('upcoming', 'Upcoming')}${tab('completed', 'Completed')}</div>
      ${l.length ? l.map(jobCard).join('') : `<div class="empty"><b>Nothing here</b>${UI.tab === 'completed' ? 'Finished and missed slots are listed here.' : 'No slots in this tab.'}</div>`}`, 'slots');
  },

  detail() {
    const j = cur(); if (!j) return V.slots();
    const p = phase(j), s = view(j), pc = PHASE_PILL[p];
    const stage = s.stage, idx = p === 'open' ? -1 : p === 'assigned' ? 0 : stage === 'heading_to_store' ? 1 : stage === 'shopping' ? 2 : 3;
    const kv = (ic, t) => `<div class="kv">${ic}<span>${t}</span></div>`;
    const steps = ['Accepted', 'On the way', 'Shopping', 'Packed'].map((t, i) => `<li class="${i <= idx || p === 'done' ? 'd' : ''}">${t}</li>`).join('');
    let bar = '';
    if (p === 'open') bar = tooSoon(j) ? `<button class="btn" disabled>Accepting opens ${acceptLabel(j)}</button>` : `<button class="btn" onclick="accept('${esc(j.id)}')">Accept slot</button>`;
    else if (p === 'assigned') bar = isEarly(j) ? `<button class="btn" disabled>Opens at ${startLabel(j)}</button>` : `<button class="btn" onclick="startTrip()">Start trip</button>`;
    else if (stage === 'heading_to_store') bar = `<button class="btn" onclick="arrive()">I've started shopping</button>`;
    else if (p === 'progress') bar = `<button class="btn" onclick="go('list',{ptab:'todo'})">Open shopping list</button>`;
    else if (p === 'purchased') bar = `<button class="btn" onclick="go('complete')">Finish &amp; pack</button>`;
    const mapCard = (stage === 'heading_to_store' || stage === 'shopping') ? `${s.store ? `<div class="mapbox">${mapSvg(s)}</div>` : ''}
      <div class="card row"><span class="chk" style="background:var(--blue)">${I.pin}</span><div class="grow"><div class="b sm">${stage === 'heading_to_store' ? 'On your way' : 'Shopping'}</div><div class="m">${stage === 'heading_to_store' ? 'Sharing your live location with the customer' : 'You are shopping now'}</div></div></div>` : '';
    return shell(header('Slot Details', 'slots', pill(pc[0], pc[1])), `
      ${p !== 'open' ? `<ul class="steps">${steps}</ul>` : ''}
      <div class="card"><div class="row"><div class="av">${initials(j.customer)}</div><div class="grow"><div class="b">${esc(j.customer)}</div><div class="m">${esc(j.orderIds.join(', '))}</div></div></div>
        ${kv(I.cal, esc(j.slot.date) + ' · ' + esc(j.slot.time))}${j.address ? kv(I.pin, esc(addrLine(j.address))) : ''}${kv(I.bag, j.items.length + ' product' + (j.items.length === 1 ? '' : 's') + ' to buy')}${kv(I.wallet, 'About ' + inr(estMid(j)) + ' (customer estimate)')}</div>
      ${j.notes ? `<div class="note"><b>Customer notes</b><br>${esc(j.notes)}</div>` : ''}
      ${p === 'open' && tooSoon(j) ? `<div class="note" style="background:#EAF2FC"><b>Accepting opens ${acceptLabel(j)}</b><br>Slots can be accepted from 4 hours before they start. Once one shopper accepts, the slot disappears for everyone else.</div>` : ''}${p === 'assigned' && isEarly(j) ? `<div class="note" style="background:#EAF2FC"><b>Shopping opens at ${startLabel(j)}</b> (in ${untilStart(j)}).<br>You can start the trip and add options once the slot begins.</div>` : ''}${p === 'missed' ? `<div class="note" style="background:var(--danger-bg,#FDE8E8)"><b>This slot has ended</b><br>It can no longer be started.</div>` : ''}
      ${mapCard}
      <div class="sec"><h3>Products</h3></div>
      ${j.items.map(it => `<div class="card"><div class="b sm">${esc(it.name)}</div><div class="m">Qty ${it.qty || 1}${range(it) ? ' · Budget ' + range(it) : ''}${it.desc ? '<br>' + esc(it.desc) : ''}</div>${refStrip(it)}</div>`).join('')}${(j.onlineItems || []).length ? `<div class="sec"><h3>Online orders to collect</h3></div>${j.onlineItems.map(o => `<div class="card"><div class="b sm">Online link × ${o.qty || 1}</div><div class="m"><a class="link" href="${esc(o.link)}" target="_blank" rel="noopener" style="word-break:break-all">${esc(o.link)}</a>${o.price ? '<br>Customer’s price: ' + inr(o.price) : ''}</div>${refStrip({ image: o.image })}</div>`).join('')}` : ''}`, 'slots', bar);
  },

  list() {
    const j = cur(); if (!j) return V.slots();
    const s = view(j), ps = s.products;
    const itOf = p => j.items.find(i => i.id === p.itemId) || {};
    const g = {
      buy: ps.filter(x => x.status === 'approved' && x.payment && x.payment.status === 'paid'),
      qr: ps.filter(x => x.status === 'approved' && !x.payment),
      wait: ps.filter(x => x.status === 'approved' && x.payment && x.payment.status === 'qr_uploaded'),
      redo: ps.filter(x => x.status === 'needs_options'),
      todo: ps.filter(x => x.status === 'waiting'),
      sent: ps.filter(x => x.status === 'options_ready'),
      done: ps.filter(x => x.status === 'purchased'),
    };
    const nBought = g.done.length, pct = ps.length ? Math.round(nBought / ps.length * 100) : 0;
    const card = (p, kind) => {
      const it = itOf(p), appr = p.options.find(o => o.status === 'approved');
      const sub = kind === 'buy' ? `Admin paid · ${inr(p.approvedAmount)}` : kind === 'qr' ? `<b>${inr(appr.price)}</b> each · send the shop QR` : kind === 'wait' ? `Admin is paying ${inr(p.approvedAmount)}`
        : kind === 'redo' ? 'Customer rejected — find different ones'
        : kind === 'sent' ? pend(p) + ' option' + (pend(p) === 1 ? '' : 's') + ' with the customer'
        : kind === 'done' ? 'Bought · ' + inr(p.approvedAmount) : (range(it) ? 'Budget ' + range(it) : 'Not started');
      const btn = kind === 'qr' ? `<button class="btn s" onclick="event.stopPropagation();openProd('${esc(p.itemId)}')">Send QR</button>` : kind === 'wait' ? pill('Admin paying', 'o') : kind === 'buy' ? `<button class="btn s g" onclick="event.stopPropagation();openProd('${esc(p.itemId)}')">Buy</button>`
        : kind === 'redo' ? `<button class="btn s o2" onclick="event.stopPropagation();openProd('${esc(p.itemId)}')">Find</button>`
        : kind === 'todo' ? `<button class="btn s" onclick="event.stopPropagation();openProd('${esc(p.itemId)}')">${p.options.length ? 'Options' : 'Find'}</button>`
        : kind === 'sent' ? pill('Waiting', 'o') : `<span class="chk">${I.check}</span>`;
      return `<div class="card act ${kind}" onclick="openProd('${esc(p.itemId)}')"><div class="row">${photo(['buy', 'qr', 'wait', 'done'].includes(kind) ? (appr ? appr.image : refSrc(it)) : refSrc(it))}<div class="grow"><div class="b sm">${esc(p.name)}</div><div class="m">Qty ${p.qty}<br>${sub}</div></div>${btn}</div></div>`;
    };
    const sec = (title, arr, kind, cls) => arr.length ? `<div class="sec lsec ${cls || ''}"><h3>${title}</h3><span class="pill ${kind === 'buy' ? 'g' : 'o'}">${arr.length}</span></div>${arr.map(p => card(p, kind)).join('')}` : '';
    const all = ps.length && ps.every(x => x.status === 'purchased');
    return shell(header('Shopping List', 'detail'), `<div class="card"><div class="row"><div class="grow"><div class="b">${nBought} of ${ps.length} bought</div><div class="m">${g.buy.length ? 'Collect the paid items next.' : g.qr.length ? 'Send the shop QR for approved items.' : g.sent.length && !g.todo.length && !g.redo.length ? 'Waiting for the customer to choose.' : g.redo.length || g.todo.length ? 'Find options for the rest.' : 'All done.'}</div></div><b style="color:var(--blue);font-size:20px">${pct}%</b></div><div class="prog"><i style="width:${pct}%"></i></div></div>
      ${sec('Ready to buy — admin paid', g.buy, 'buy', 'gr')}${sec('Send shop QR to admin', g.qr, 'qr', 'or')}${sec('Waiting for admin payment', g.wait, 'wait')}${sec('Customer wants other options', g.redo, 'redo', 'or')}${sec('To find', g.todo, 'todo')}${sec('Waiting for customer', g.sent, 'sent')}${sec('Bought', g.done, 'done')}`, 'slots',
      all ? `<button class="btn" onclick="go('complete')">Complete shopping</button>` : '');
  },

  notes() {
    const n = notes();
    return shell(header('Notifications', 'home', n.some(x => !x.read) ? `<button class="link" style="color:#fff" onclick="readAll()">Mark all read</button>` : ''),
      n.length ? n.map(x => `<div class="card note-row ${x.read ? '' : 'new'}" onclick="openNote('${x.id}')"><div class="row"><span class="chk" style="background:${x.type !== 'rejected' ? 'var(--success)' : '#C26A00'}">${x.type !== 'rejected' ? I.check : I.back}</span><div class="grow"><div class="b sm">${noteText(x)[0]}</div><div class="m">${esc(x.name)} · ${ago(x.ts)}</div></div>${x.read ? '' : '<i class="dot"></i>'}</div></div>`).join('')
        : `<div class="empty"><b>No notifications yet</b>You'll be told here the moment a customer approves or rejects an option.</div>`, 'home');
  },

  prod() {
    const j = cur(); if (!j) return V.slots();
    const s = view(j), p = s.products.find(x => x.itemId === UI.item);
    if (!p) return V.list();
    const it = j.items.find(i => i.id === p.itemId) || {}, n = pend(p), locked = p.status === 'options_ready';
    const tag = { pending: locked ? ['With customer', 'o'] : ['Not sent yet', ''], rejected: ['Rejected', 'r'], approved: ['Approved', 'g'], not_chosen: ['Not chosen', ''] };
    const opts = p.options.map((o, k) => `<div class="card"><div class="row">${photo(o.image, 'lg')}<div class="grow"><div class="row"><span class="m grow">Option ${k + 1}</span>${pill(tag[o.status][0], tag[o.status][1])}</div>
      <div class="b" style="font-size:19px">${inr(o.price)} <span class="m">each</span></div>${o.description ? `<div class="m">${esc(o.description)}</div>` : ''}</div></div>
      ${o.status === 'pending' && !locked ? `<button class="link" style="color:var(--danger);margin-top:8px" onclick="rmOpt('${esc(o.id)}')">Remove</button>` : ''}</div>`).join('');
    let bar = '', body = '';
    if (p.status === 'approved') {
      const a = p.options.find(o => o.status === 'approved'), pay = p.payment;
      const step = (n, t, on, done) => `<div class="pstep ${on ? 'on' : ''} ${done ? 'done' : ''}"><i>${done ? '✓' : n}</i><span>${t}</span></div>`;
      const steps = `<div class="psteps">${step(1, 'Send shop QR', !pay, !!pay)}${step(2, 'Admin pays', pay && pay.status === 'qr_uploaded', pay && pay.status === 'paid')}${step(3, 'Buy it', pay && pay.status === 'paid', false)}</div>`;
      const upBox = `<label class="upload" style="margin:0">${UI.qr ? `<img src="${UI.qr}" alt="">` : `${I.cam}<span>${pay ? 'Upload a different QR' : "Take or choose the shop's payment QR"}</span>`}<input type="file" accept="image/*" hidden onchange="pickQR(this)"></label>`;
      if (!pay || UI.qr) {
        body = `<div class="note" style="background:var(--success-bg)"><b>Customer approved ${inr(a.price)} each — ${inr(p.approvedAmount)} total.</b><br>${pay ? 'Replace the QR you sent earlier.' : 'Ask the shop for its payment QR, upload it here and the admin will pay the shop.'}</div>${steps}${upBox}`;
        bar = `<button class="btn" ${UI.qr ? '' : 'disabled'} onclick="sendQR('${esc(p.itemId)}')">${pay ? 'Send new QR' : 'Send QR to admin'} · ${inr(p.approvedAmount)}</button>`;
      } else if (pay.status === 'qr_uploaded') {
        body = `<div class="note"><b>Waiting for admin to pay ${inr(p.approvedAmount)} to the shop.</b><br>You will get a notification when it is done. Don't pay from your own pocket.</div>${steps}<div class="card"><div class="b sm">QR you sent</div><div class="refs"><img class="ph" style="width:96px;height:96px" src="${pay.qr}" onclick="zoom(this.src)" alt="Shop QR"></div><label class="link" style="display:block;margin-top:10px">Wrong QR? Upload again<input type="file" accept="image/*" hidden onchange="pickQR(this)"></label></div>`;
        bar = `<button class="btn" disabled>Waiting for admin payment…</button>`;
      } else {
        body = `<div class="note" style="background:var(--success-bg)"><b>Admin paid ${inr(p.approvedAmount)} to the shop.</b><br>Collect the product, then mark it purchased.</div>${steps}${pay.proof ? `<div class="card"><div class="b sm">Payment screenshot</div><div class="refs"><img class="ph" style="width:96px;height:96px" src="${pay.proof}" onclick="zoom(this.src)" alt="Payment proof"></div></div>` : ''}`;
        bar = `<button class="btn" onclick="bought('${esc(p.itemId)}')">Mark as purchased · ${inr(p.approvedAmount)}</button>`;
      }
    } else if (locked) body = `<div class="note">Waiting for the customer to approve one of these options.</div>`;
    else {
      if (p.status === 'needs_options') body = `<div class="note"><b>The customer rejected the last options.</b><br>Find different ones and send them again.</div>`;
      bar = `<button class="btn" ${n ? '' : 'disabled'} onclick="share()">Send ${n} option${n === 1 ? '' : 's'} to customer</button>`;
    }
    return shell(header(esc(p.name), 'list'), `<div class="card"><div class="b sm">Customer wants</div><div class="m">Qty ${p.qty}${range(it) ? ' · Budget ' + range(it) + ' each' : ''}${it.desc ? '<br>' + esc(it.desc) : ''}</div>${refStrip(it)}</div>
      ${body}${p.status === 'approved' ? '' : `<div class="sec" style="margin-top:6px"><h3>Options</h3>${pill(n + ' / ' + MAX_OPTIONS, '')}</div>
      <div class="m" style="margin-bottom:10px">Photograph 1 to ${MAX_OPTIONS} real options. The customer picks one and pays from Visasra Money.</div>`}
      ${opts}${p.status !== 'approved' && p.status !== 'purchased' ? `<button class="btn o" onclick="openAdd()">+ Add ${n ? 'another ' : ''}option</button>${locked ? '<div class="m" style="margin-top:8px">Extra options you add now reach the customer straight away.</div>' : ''}` : ''}`, 'slots', bar);
  },

  add() {
    const j = cur(), f = UI.form; if (!j || !f) return V.list();
    const it = j.items.find(i => i.id === UI.item) || {};
    return shell(header('Add Option', 'prod'), `<div class="card"><div class="b sm">${esc(it.name)}</div><div class="m">Qty ${it.qty || 1}${range(it) ? ' · Budget ' + range(it) : ''}${it.desc ? '<br>' + esc(it.desc) : ''}</div>${refStrip(it)}</div>
      <label style="margin-top:4px">Photo of the product</label>
      <label class="upload" style="margin:0">${f.image ? `<img src="${f.image}" alt="">` : `${I.cam}<span>Take or choose a photo</span>`}<input type="file" accept="image/*" capture="environment" hidden onchange="pick(this)"></label>
      ${f.image ? `<button class="link" style="margin-top:8px" onclick="UI.form.image='';render()">Remove photo</button>` : ''}
      <label>Price per piece (₹)</label><input type="number" inputmode="decimal" min="1" max="1000000" step="any" placeholder="e.g. 2440" value="${esc(f.price)}" oninput="UI.form.price=this.value">
      <label>Shop</label><select onchange="UI.form.store=this.value">${['Pothys, T. Nagar', 'Nalli Silks, T. Nagar', 'Naidu Hall', 'Local shop'].map(s => `<option ${f.store === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <label>Description <span class="m">(optional)</span></label><textarea rows="3" maxlength="300" placeholder="e.g. Magenta, zari border, good quality" oninput="UI.form.note=this.value">${esc(f.note)}</textarea>`, 'slots',
      `<button class="btn o" onclick="go('prod')">Cancel</button><button class="btn" onclick="saveOpt()">Save option</button>`);
  },

  complete() {
    const j = cur(); if (!j) return V.slots();
    const s = view(j), ps = s.products, ok = ps.length && ps.every(p => p.status === 'purchased');
    const total = ps.reduce((a, p) => a + (p.approvedAmount || 0), 0);
    const row = (t, v, good) => `<div class="row" style="padding:9px 0"><span class="chk" style="${good ? '' : 'background:#B7C6DB'}">${I.check}</span><span class="grow b sm">${t}</span><b style="color:var(--blue)">${v}</b></div>`;
    return shell(header('Complete Shopping', 'list'), `<div class="card">${row('All products purchased', ps.filter(p => p.status === 'purchased').length + ' / ' + ps.length, ok)}${row('Total paid by customer', inr(total), true)}${row('Your earning', inr(PAY_PER_SLOT), true)}</div>
      <label>Final notes <span class="m">(optional)</span></label><textarea id="finalNote" rows="4" maxlength="300" placeholder="Anything the packing team should know">${esc(s.finalNote || '')}</textarea>`, 'slots',
      `<button class="btn" ${ok ? '' : 'disabled'} onclick="finish()">Finish &amp; mark packed</button>`);
  },

  map() {
    const j = UI.jobs.find(x => ['assigned', 'progress', 'purchased'].includes(phase(x)) && x.session && x.session.store) || null;
    const s = j && j.session;
    return shell(header('Map'), j ? `<div class="mapbox">${mapSvg(s)}</div><div class="card"><div class="row"><div class="av">${initials(j.customer)}</div><div class="grow"><div class="b">${esc(j.customer)}</div><div class="m">${esc(j.slot.date)} · ${esc(j.slot.time)}</div></div><button class="btn s" onclick="openJob('${esc(j.id)}')">Open</button></div>
      <div class="kv">${I.pin}<span>${s.stage === 'heading_to_store' ? 'On your way' : 'Shopping'}</span></div><div class="kv">${I.clock}<span>${s.stage === 'heading_to_store' ? 'Sharing your live location' : 'You are shopping now'}</span></div></div>`
      : `<div class="empty"><b>No active trip</b>Accept a slot and start your trip. Your live location appears here, and the customer sees it too.</div>`, 'map');
  },

  earn() {
    const hist = W.history || [], total = hist.reduce((a, h) => a + h.amount, 0), avail = availBal(), t = UI.etab;
    const tab = (k, l) => `<button class="${t === k ? 'on' : ''}" onclick="go('earn',{etab:'${k}'})">${l}</button>`;
    const list = (rows, sign, col, emptyT, emptyD) => rows.length ? `<div class="card">${rows.map(r => `<div class="row" style="padding:10px 0;border-bottom:1px solid #EEF3FA"><div class="grow"><div class="b sm">${esc(r[0])}</div><div class="m">${esc(r[1])}</div></div><b style="color:${col}">${sign}${inr(r[2])}</b></div>`).join('')}</div>` : `<div class="empty"><b>${emptyT}</b>${emptyD}</div>`;
    let body;
    if (t === 'hist') body = list(hist.map(h => [h.customer, h.date + ' · ' + h.ref, h.amount]), '+', '#228A1B', 'No earnings yet', 'You earn ' + inr(PAY_PER_SLOT) + ' for every slot you finish.');
    else if (t === 'pay') {
      const wed = isWed();
      body = `<div class="note" style="background:#EAF2FC"><b>Weekly payout every Wednesday</b><br>${wed ? 'Today is payout day — you can take your full balance.' : 'Your next payout day is ' + nextWedLabel() + '.'}</div>
        <button class="btn" style="margin-bottom:14px" ${wed && avail > 0 ? '' : 'disabled'} onclick="payout()">${wed ? (avail > 0 ? 'Withdraw full balance · ' + inr(avail) : 'Nothing to withdraw') : 'Available on Wednesday'}</button>
        ${list((W.payouts || []).filter(x => x.type !== 'emergency').map(p => ['Weekly payout', p.date, p.amount]), '−', 'var(--text)', 'No withdrawals yet', 'Your Wednesday payouts will be listed here.')}`;
    } else {
      const used = emergUsed(), cap = Math.floor(avail * 0.3);
      body = `<div class="note"><b>Need money before Wednesday?</b><br>Once every week you can take up to 30% of your balance early. The rest comes on Wednesday.</div>
        <div class="card row"><div class="grow"><div class="m">You can take now</div><div class="name" style="font-size:26px">${used ? inr(0) : inr(cap)}</div></div>${pill(used ? 'Used this week' : '1 left this week', used ? '' : 'g')}</div>
        <button class="btn red" style="margin-bottom:14px" ${!used && cap > 0 ? '' : 'disabled'} onclick="emergency()">${used ? 'Next emergency withdrawal after Wednesday' : cap > 0 ? 'Withdraw 30% now · ' + inr(cap) : 'Nothing to withdraw'}</button>
        ${list((W.payouts || []).filter(x => x.type === 'emergency').map(p => ['Emergency withdrawal', p.date, p.amount]), '−', 'var(--danger)', 'No emergency withdrawals', 'They will be listed here.')}`;
    }
    return shell(header('Earnings'), `<div class="card row"><span class="av" style="width:62px;height:62px">${I.bag.replace('<svg', '<svg width="28" height="28"')}</span><div class="grow"><div class="m">Total earned</div><div class="name" style="font-size:30px">${inr(total)}</div><div class="m"><b style="color:#228A1B">${inr(avail)}</b> available to withdraw</div></div></div>
      <div class="tabs">${tab('hist', 'Earnings')}${tab('pay', 'Withdrawal')}${tab('emerg', 'Emergency')}</div>${body}`, 'earn');
  },

  profile() {
    const done = (W.history || []).length;
    return shell(header('Profile'), `<div class="card row"><div class="av" style="width:58px;height:58px;font-size:20px;overflow:hidden">${((kycOf().docs || {}).ph) ? `<img src="${kycOf().docs.ph}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">` : initials(W.name)}</div><div class="grow"><div class="serif" style="font-size:20px">${esc(W.name)}</div><div class="m">${esc(W.phone)}</div></div></div>
      <div class="card row" style="margin-top:12px"><span class="chk">${I.check}</span><div class="grow"><div class="b sm">Identity verified</div><div class="m">${'Aadhaar ' + maskA(kycOf().aadhaarNo) + ' · PAN ' + esc(maskP(kycOf().panNo)) + (((kycOf().docs || {}).dl) ? ' · License on file' : '')}</div></div></div>
      <div class="stats" style="margin-top:12px"><div class="stat" style="background:#fff;border:1px solid var(--border)"><b>${W.done + done}</b><span>Slots done</span></div></div>
      <div class="card row" style="margin-top:12px"><div class="grow"><div class="b">${W.online ? 'Online' : 'Offline'}</div><div class="m">${W.online ? 'You can accept new slots.' : 'New slots are hidden from you.'}</div></div><button class="toggle ${W.online ? 'on' : ''}" onclick="toggleOnline()" aria-label="Toggle online"></button></div>
      <button class="btn red" style="margin-top:8px" onclick="logout()">Sign out</button>`, 'profile');
  },
};

/* ------------------------------------------------------------------- map */
function mapSvg(s) {
  const w = 600, h = 300, pad = 60, pts = [s.store, s.location].filter(Boolean);
  let g = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Route map"><rect width="${w}" height="${h}" fill="#E4EEFA"/>
    <path d="M-10 210 C120 175 210 250 340 218 S540 165 620 195 L620 320 L-10 320Z" fill="#C9E0F7"/><rect x="388" y="26" width="120" height="66" rx="16" fill="#D3EBCB"/><rect x="40" y="38" width="86" height="50" rx="12" fill="#D3EBCB"/>
    <g stroke="#fff" stroke-linecap="round" fill="none"><path d="M0 100H600" stroke-width="11"/><path d="M0 160H600" stroke-width="8"/><path d="M150 0V300" stroke-width="11"/><path d="M300 0V300" stroke-width="8"/><path d="M455 0V300" stroke-width="11"/></g>`;
  if (pts.length) {
    let la0 = Math.min(...pts.map(p => p.lat)), la1 = Math.max(...pts.map(p => p.lat)), ln0 = Math.min(...pts.map(p => p.lng)), ln1 = Math.max(...pts.map(p => p.lng));
    if (la1 - la0 < .004) { la0 -= .003; la1 += .003; } if (ln1 - ln0 < .004) { ln0 -= .003; ln1 += .003; }
    const X = v => pad + (v - ln0) / (ln1 - ln0) * (w - pad * 2), Y = v => h - pad - (v - la0) / (la1 - la0) * (h - pad * 2);
    if (s.store && s.location) g += `<path d="M${X(s.location.lng)} ${Y(s.location.lat)} L${X(s.store.lng)} ${Y(s.store.lat)}" stroke="#1261B5" stroke-width="5" stroke-dasharray="2 11" stroke-linecap="round"/>`;
    if (s.store) g += `<g transform="translate(${X(s.store.lng)} ${Y(s.store.lat)})"><path d="M0 0C-26-26-26-54 0-54S26-26 0 0Z" fill="#FF8A00" stroke="#fff" stroke-width="3"/><rect x="-9" y="-44" width="18" height="15" rx="3" fill="#fff"/></g>`;
    if (s.location) g += `<g transform="translate(${X(s.location.lng)} ${Y(s.location.lat)})"><circle r="24" fill="#1261B5" opacity=".18"/><circle r="15" fill="#1261B5" stroke="#fff" stroke-width="4"/><circle cy="-3" r="3.6" fill="#fff"/><path d="M-6 7a6 5 0 0 1 12 0" fill="#fff"/></g>`;
  }
  return g + '</svg>';
}

/* ---------------------------------------------------------------- actions */
function setMode(m) { UI.mode = m; render(); }
function kycDraft() {
  if (!UI.kyc) { const k = kycOf(); UI.kyc = { aNo: k.aadhaarNo || '', pNo: k.panNo || '', docs: Object.assign({ af: '', ab: '', pan: '', dl: '', ph: '' }, k.docs || {}), bad: k.status === 'rejected' ? (k.bad || []) : [], consent: false }; }
  return UI.kyc;
}
const kycErr = k => !/^[2-9]\d{11}$/.test(k.aNo) ? 'Enter your 12-digit Aadhaar number' : !/^[A-Z]{5}\d{4}[A-Z]$/.test(k.pNo) ? 'Enter a valid PAN, like ABCDE1234F' : !k.docs.af || !k.docs.ab || !k.docs.pan ? 'Add all three Aadhaar and PAN photos' : !k.docs.dl ? "Add a photo of your driver's license" : !k.docs.ph ? 'Add your profile photo' : !k.consent ? 'Please tick the confirmation' : '';
const kycReady = () => !kycErr(kycDraft());
function kycIn() {
  const k = kycDraft(), a = $('kA'), p = $('kP');
  k.aNo = a.value.replace(/\D/g, '').slice(0, 12); a.value = fmtA(k.aNo);
  k.pNo = p.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10); p.value = k.pNo;
  k.consent = $('kC').checked; $('kSub').disabled = !kycReady();
}
function pickKyc(key, inp) {
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onerror = () => toast('Could not read that photo'); im.onload = () => {
    const k = Math.min(1, 1100 / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    kycDraft().docs[key] = c.toDataURL('image/jpeg', .78); render();
  }; im.src = r.result; };
  r.readAsDataURL(f);
}
function fixKyc() { UI.kyc = null; UI.scr = 'kycform'; render(); }
function submitKyc() {
  const k = kycDraft(), e = kycErr(k); if (e) return toast(e);
  W.kyc = { status: 'pending', aadhaarNo: k.aNo, panNo: k.pNo, docs: Object.assign({}, k.docs), submittedAt: Date.now() };
  try { saveW(); } catch (err) { return toast('Storage is full — try smaller photos'); }
  UI.kyc = null; toast('Sent for verification'); go('kycwait');
}
function login() {                                     // step 1 — check the details, then send an OTP
  const up = UI.mode === 'up', raw = $('lgPhone').value, phone = normPhone(raw), all = loadWorkers();
  if (!/^[6-9]\d{9}$/.test(raw.replace(/\D/g, '').slice(-10)) || !phone) return toast('Enter a valid 10-digit mobile number');
  let name = '';
  if (up) {
    name = $('lgName').value.trim().replace(/\s+/g, ' ');
    if (!/^[\p{L}\p{M}\s.'’\-]+$/u.test(name)) return toast('Name can only contain letters');
    if (name.length < 3 || !/\s/.test(name)) return toast('Enter your full name as on Aadhaar');
    if (all[phone]) { UI.mode = 'in'; render(); $('lgPhone').value = raw; return toast('This number is already registered — sign in'); }
  } else if (!all[phone]) { UI.mode = 'up'; render(); $('lgPhone').value = raw; return toast('No account for this number — create one'); }
  sendOtp({ phone, name, up });
}
function sendOtp(o) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  UI.otp = Object.assign({}, o, { code, tries: 0, sentAt: Date.now(), expires: Date.now() + 5 * 60000 });
  UI.scr = 'otp'; render();
  /* BACKEND: send the OTP by SMS and verify it on the server — the code is never shown in the app */
}
const otpBoxes = () => [...document.querySelectorAll('.otpb')];
const otpVal = () => otpBoxes().map(i => i.value).join('');
function otpIn(el) {
  el.value = el.value.replace(/\D/g, '').slice(-1);
  const bx = otpBoxes(), i = +el.dataset.i;
  if (el.value && i < 5) bx[i + 1].focus();
  if (otpVal().length === 6) verifyOtp();
}
function otpKey(e, el) { if (e.key === 'Backspace' && !el.value && +el.dataset.i > 0) { const p = otpBoxes()[+el.dataset.i - 1]; p.value = ''; p.focus(); } }
function otpPaste(e) { e.preventDefault(); otpFillWith((e.clipboardData || window.clipboardData).getData('text')); }
function otpFillWith(t) { const d = String(t).replace(/\D/g, '').slice(0, 6); otpBoxes().forEach((b, i) => { b.value = d[i] || ''; }); if (d.length === 6) verifyOtp(); else if (otpBoxes()[d.length]) otpBoxes()[d.length].focus(); }
function otpBack() { UI.otp = null; UI.scr = 'login'; render(); }
function resendOtp() {
  const o = UI.otp; if (!o) return;
  if (Date.now() < o.sentAt + 30000) return toast('Please wait before asking for another OTP');
  sendOtp({ phone: o.phone, name: o.name, up: o.up }); toast('New OTP sent');
}
function verifyOtp() {                                          // step 2 — check the code, then sign in / create the account
  const o = UI.otp; if (!o) return;
  const code = otpVal();
  if (code.length < 6) return toast('Enter all 6 digits');
  if (Date.now() > o.expires) return toast('This OTP has expired — tap Resend OTP');
  if (code !== o.code) {
    o.tries++;
    if (o.tries >= 5) { UI.otp = null; UI.scr = 'login'; render(); return toast('Too many wrong attempts — start again'); }
    const row = $('otpRow'); row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
    otpBoxes().forEach(b => { b.value = ''; }); otpBoxes()[0].focus();
    return toast('Wrong OTP — ' + (5 - o.tries) + ' ' + (5 - o.tries === 1 ? 'try' : 'tries') + ' left');
  }
  const all = loadWorkers();
  if (o.up) {
    if (all[o.phone]) return otpBack();
    W = { id: 'W' + Math.random().toString(36).slice(2, 8), phone: o.phone, name: o.name, done: 0, online: true, history: [], payouts: [], paid: 0, kyc: { status: 'none' } };
  } else W = all[o.phone];
  if (!W) return otpBack();
  saveW(); localStorage.setItem(WSESSION, o.phone); UI.kyc = null; UI.otp = null;
  toast('Phone verified');
  go(kycOK() ? 'home' : 'kycform');
}
setInterval(() => {                                              // live "Resend in 0:24" label
  const b = $('rs'), o = UI.otp; if (!b || !o) return;
  const left = Math.ceil((o.sentAt + 30000 - Date.now()) / 1000);
  b.textContent = left > 0 ? 'Resend in 0:' + String(left).padStart(2, '0') : 'Resend OTP'; b.disabled = left > 0;
}, 500);
function logout() { localStorage.removeItem(WSESSION); W = null; UI.kyc = null; UI.otp = null; UI.mode = 'in'; UI.scr = 'login'; render(); }
function toggleOnline() { if (!kycOK()) return toast('Complete verification first'); if (W.suspended) return toast('Your account is suspended — please contact Visasra'); W.online = !W.online; saveW(); render(); }
function openJob(id) { go('detail', { job: id }); }
function openProd(itemId) { go('prod', { item: itemId }); }
function accept(id) {
  if (!kycOK()) return toast('Complete verification first');
  if (W.suspended) return toast('Your account is suspended — please contact Visasra');
  if (!W.online) return toast('Go online in Profile to accept slots');
  const j = UI.jobs.find(x => x.id === id); if (!j) return;
  if (isLate(j)) return toast('This slot has already ended');
  if (tooSoon(j)) return toast('You can accept this slot from ' + acceptLabel(j));
  const ok = mut(j, s => {
    if (s.shopper && s.shopper.wid !== W.id) return false;                       // someone else got it first
    s.shopper = { wid: W.id };      // only an internal id — the customer never sees worker details
    s.stage = 'assigned';
  });
  if (!ok) { toast('Sorry — another shopper just accepted this slot'); return go('slots'); }
  toast('Slot accepted — the customer can see you are assigned');
  go('detail', { job: id });
}
function startTrip() {
  const j = cur(); if (!j) return;
  if (isEarly(j)) return toast('Shopping opens at ' + startLabel(j));
  if (isLate(j)) return toast('This slot has already ended');
  mut(j, s => { s.status = 'live'; s.stage = 'heading_to_store'; s.location = null; });
  trackGPS();
  toast('Trip started — the customer can track you'); render();
}
function arrive() {
  const j = cur(); if (!j) return;
  if (isEarly(j)) return toast('Shopping opens at ' + startLabel(j));
  mut(j, s => { s.stage = 'shopping'; s.status = 'live'; });
  go('list', { ptab: 'todo' });
}
function pickQR(inp) {                                  // keep the QR sharp enough to scan
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const k = Math.min(1, 1000 / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    UI.qr = c.toDataURL('image/jpeg', .88); render();
  }; im.src = r.result; };
  r.readAsDataURL(f);
}
function sendQR(itemId) {
  if (!UI.qr) return toast('Add the shop\'s QR code first');
  const ok = mut(cur(), s => {
    const p = s.products.find(x => x.itemId === itemId);
    if (!p || p.status !== 'approved' || (p.payment && p.payment.status === 'paid')) return false;
    p.payment = { status: 'qr_uploaded', qr: UI.qr, amount: p.approvedAmount, uploadedAt: Date.now() };
  });
  if (ok) { UI.qr = ''; toast('QR sent to admin — you will be told once it is paid'); render(); }
}
function openAdd() {
  const j0 = cur(); if (j0 && isEarly(j0)) return toast('You can add options once the slot opens at ' + startLabel(j0));
  UI.form = { image: '', price: '', store: 'Pothys, T. Nagar', note: '' }; go('add'); }
function pick(inp) {                                   // shrink the photo so it fits in localStorage
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const k = Math.min(1, 720 / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    UI.form.image = c.toDataURL('image/jpeg', .72); render();
  }; im.src = r.result; };
  r.readAsDataURL(f);
}
function saveOpt() {
  const f = UI.form, j = cur(), id = UI.item;
  if (isEarly(j)) return toast('You can add options once the slot opens at ' + startLabel(j));
  if (!f.image) return toast('Add a photo for the customer');
  if (!(+f.price > 0)) return toast('Enter the price per piece in ₹');
  if (+f.price > 1000000) return toast('That price looks too high — check it');
  { const it0 = j.items.find(i => i.id === id) || {};
    if (it0.priceMax && +f.price > it0.priceMax * 1.5 && !confirm('This is well above the customer\'s budget (' + range(it0) + '). Send it anyway?')) return; }
  const description = [f.store ? 'From ' + f.store : '', (f.note || '').trim()].filter(Boolean).join('. ');
  const ok = mut(j, s => {
    const p = s.products.find(x => x.itemId === id);
    if (pend(p) >= MAX_OPTIONS) { toast('Maximum ' + MAX_OPTIONS + ' options per product'); return false; }
    p.options.push({ id: 'opt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), image: f.image, price: Math.round(+f.price), description, store: f.store || '', status: 'pending' });
  });
  if (ok) { UI.form = null; go('prod'); }
}
function rmOpt(optId) { mut(cur(), s => { const p = s.products.find(x => x.itemId === UI.item); p.options = p.options.filter(o => o.id !== optId); }); render(); }
function share() {
  const j = cur();
  if (isEarly(j)) return toast('Shopping opens at ' + startLabel(j));
  const ok = mut(j, s => {
    const p = s.products.find(x => x.itemId === UI.item);
    if (!pend(p)) return false;
    p.status = 'options_ready'; s.status = 'live'; if (s.stage !== 'purchased') s.stage = 'shopping';
  });
  if (ok) { toast('Sent. The customer can approve in their app'); go('list'); }
}
function bought(itemId) {
  { const p0 = (view(cur()).products.find(x => x.itemId === itemId) || {}); if (!p0.payment || p0.payment.status !== 'paid') return toast('Wait until the admin has paid the shop'); }
  mut(cur(), s => {
    const p = s.products.find(x => x.itemId === itemId); if (!p || p.status !== 'approved') return false;
    p.status = 'purchased';
    if (s.products.every(x => x.status === 'purchased')) s.stage = 'purchased';
  });
  toast('Marked as purchased'); go('list');
}
function finish() {
  const j = cur(), note = ($('finalNote') || {}).value || '';
  const ok = mut(j, s => {
    if (!s.products.every(p => p.status === 'purchased')) return false;
    s.stage = 'packed'; s.status = 'completed'; s.finalNote = note.trim();
  });
  if (!ok) return;
  if (!(W.history || []).some(h => h.key === j.id)) {                       // credit once per slot
    (W.history = W.history || []).unshift({ key: j.id, customer: j.customer, ref: j.orderIds[0] || j.key, date: dateLabel(new Date(now())), amount: PAY_PER_SLOT });
    saveW();
  }
  toast('Slot complete — ' + inr(PAY_PER_SLOT) + ' added to your earnings');
  go('earn', { etab: 'hist' });
}
/* ---- payouts: weekly on Wednesday (full balance) + one emergency 30% per week ---- */
const availBal = () => (W.history || []).reduce((a, h) => a + h.amount, 0) - (W.paid || 0);
const isWed = () => new Date(now()).getDay() === 3;
function cycleKey() { const d = new Date(now()); d.setDate(d.getDate() - ((d.getDay() + 4) % 7)); return isoOf(d); }   // most recent Wednesday
function nextWedLabel() { const d = new Date(now()); d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7 || 7)); return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }); }
const emergUsed = () => (W.payouts || []).some(p => p.type === 'emergency' && p.cycle === cycleKey());
function payout() {
  if (!kycOK()) return toast('Complete verification first');
  const avail = availBal();
  if (!isWed()) return toast('Weekly payouts are on Wednesday');
  if (avail <= 0) return;
  (W.payouts = W.payouts || []).unshift({ type: 'weekly', date: dateLabel(new Date(now())), amount: avail }); W.paid = (W.paid || 0) + avail; saveW();
  toast(inr(avail) + ' withdrawal requested'); go('earn', { etab: 'pay' });
}
function emergency() {
  if (!kycOK()) return toast('Complete verification first');
  const cap = Math.floor(availBal() * 0.3);
  if (emergUsed()) return toast('You have already used this week\'s emergency withdrawal');
  if (cap <= 0) return;
  (W.payouts = W.payouts || []).unshift({ type: 'emergency', cycle: cycleKey(), date: dateLabel(new Date(now())), amount: cap }); W.paid = (W.paid || 0) + cap; saveW();
  toast(inr(cap) + ' emergency withdrawal requested'); go('earn', { etab: 'emerg' });
}

/* Live location: the device's real GPS, written to the session while the worker is on the way / shopping.
   BACKEND: post these positions to the server instead of (or as well as) writing them to storage. */
let gpsW = null;
function trackGPS() {
  const act = () => UI.jobs.filter(j => phase(j) === 'progress' && ['heading_to_store', 'shopping'].includes(j.session.stage));
  if (!act().length) { if (gpsW != null) { navigator.geolocation.clearWatch(gpsW); gpsW = null; } return; }
  if (gpsW != null || !navigator.geolocation) return;
  gpsW = navigator.geolocation.watchPosition(p => {
    act().forEach(j => mut(j, s => { s.location = { lat: p.coords.latitude, lng: p.coords.longitude, updatedAt: Date.now(), etaMin: null }; }));
  }, () => {}, { enableHighAccuracy: true, maximumAge: 5000 });
}

/* ---------------------------------------------------------------- render */
function render() {
  const app = $('app');
  if (W) { const fresh = loadWorkers()[W.phone]; if (fresh) W = fresh; }       // admin decisions are written to storage
  if (!W) UI.scr = UI.scr === 'otp' && UI.otp ? 'otp' : 'login';
  else {
    const st = kycOf().status;
    if (st !== 'approved') UI.scr = st === 'pending' ? 'kycwait' : (UI.scr === 'kycform' ? 'kycform' : st === 'rejected' ? 'kycrej' : 'kycform');
    else if (String(UI.scr).startsWith('kyc')) UI.scr = 'home';
  }
  UI.jobs = W ? readJobs() : [];
  scanNotes(); scanSlotNotes();
  if (UI.scr === 'slots') markSlotsRead();
  UI.sig = rawSig();
  const old = app.querySelector('.body'), y = old ? old.scrollTop : 0, key = UI.scr + UI.tab + UI.ptab + UI.etab + UI.item;
  app.innerHTML = (V[UI.scr] || V.home)();
  const ob = app.querySelector('.otpb'); if (ob && !ob.value) ob.focus();
  const nb = app.querySelector('.body'); if (nb && key === UI.key) nb.scrollTop = y;
  UI.key = key;
  trackGPS();
}
/* pick up changes the customer makes (approve / reject) without a reload */
setInterval(() => { if (W && UI.scr !== 'add' && UI.scr !== 'login' && rawSig() !== UI.sig) render(); }, 2500);
setInterval(() => { if (W && ['home', 'slots', 'detail'].includes(UI.scr)) render(); }, 30000);
setInterval(() => { if (W && !['add', 'login', 'otp'].includes(UI.scr) && kycOK()) render(); }, 30000);   /* catches the moment a slot's 4-hour accept window opens */
window.addEventListener('storage', () => { if (W && UI.scr !== 'add' && UI.scr !== 'login') render(); });
render();

/* ---- input guards: block bad characters as the user types (also covers paste) ---- */
(function () {
  const RULES = {
    letters: v => v.replace(/[^\p{L}\p{M}\s.'’\-]/gu, '').replace(/\s{2,}/g, ' '),
    digits: v => v.replace(/\D/g, ''),
    phone: v => v.replace(/[^\d+\s\-()]/g, '').replace(/(?!^)\+/g, ''),
    zip: v => v.replace(/[^A-Za-z0-9\s\-]/g, '').toUpperCase(),
    money: v => { v = v.replace(/[^\d.]/g, ''); const i = v.indexOf('.'); if (i > -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2); return v; },
    whole: v => v.replace(/\D/g, '')
  };
  window.__guardRules = RULES;
  document.addEventListener('keydown', e => {
    const t = e.target; if (!t || t.type !== 'number') return;
    if (['e', 'E', '+', '-'].includes(e.key) || (t.dataset.whole && e.key === '.')) e.preventDefault();   // number boxes: no exponent / sign
  }, true);
  document.addEventListener('input', e => {
    const t = e.target; if (!t || !t.tagName) return;
    const rule = t.dataset && t.dataset.g;
    if (rule && RULES[rule] && t.type !== 'number') { const a = t.value, b = RULES[rule](a); if (a !== b) { t.value = b; } }
    if (t.type === 'number') {
      const max = t.max !== '' ? +t.max : null;
      if (t.value !== '' && (+t.value < 0)) t.value = String(Math.abs(+t.value));
      if (max !== null && +t.value > max) t.value = String(max);
      const m = String(t.value).match(/^(\d*)\.(\d{3,})/); if (m) t.value = m[1] + '.' + m[2].slice(0, 2);
    }
  }, true);
  document.addEventListener('wheel', e => { if (e.target && e.target.type === 'number' && document.activeElement === e.target) e.target.blur(); }, { passive: true });
})();

