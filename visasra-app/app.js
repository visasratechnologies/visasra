/* ================================================================
   STATE, DATA & CORE LOGIC — UNCHANGED FROM THE ORIGINAL APP
   ================================================================ */
/* ---------------- Accounts & session (device-local; BACKEND: replace with real auth) ---------------- */
const LEGACY_KEY = 'visasra_app_state_v1';
const ACCOUNTS_KEY = 'visasra_accounts_v1';
const SESSION_KEY = 'visasra_session_v1';
function readAccounts() { try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || []; } catch (e) { return []; } }
function writeAccounts(list) { try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list)); } catch (e) {} }
function currentEmail() { try { return localStorage.getItem(SESSION_KEY) || ''; } catch (e) { return ''; } }
function currentAccount() { const e = currentEmail(); return readAccounts().find(a => a.email === e) || null; }
/* Each account keeps its own wallet, orders, and cart. */
const STORAGE_KEY = LEGACY_KEY + ':' + (currentEmail() || 'guest');
const CATEGORIES = [
  { key: 'groceries', name: 'Groceries & Essentials', accent: '#36A82D', desc: 'Snacks, sweets, spices & daily staples',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16l-1.5 10a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 9z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/><path d="M9 13v4M12 13v4M15 13v4"/></svg>` },
  { key: 'electronics', name: 'Electronics & Gadgets', accent: '#092B55', desc: 'Devices and accessories from Indian retail',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/></svg>` },
  { key: 'fashion', name: 'Fashion & Apparel', accent: '#A80062', desc: 'Sarees, ethnic wear & everyday fashion',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a2 2 0 0 1 2 2c0 1-1 1.6-2 2.2"/><path d="M12 7.2L3 13.5a1.5 1.5 0 0 0 .9 2.7h16.2a1.5 1.5 0 0 0 .9-2.7L12 7.2z"/><path d="M7 20h10"/></svg>` },
  { key: 'home', name: 'Home & Kitchen', accent: '#1261B5', desc: 'Cookware, decor & everyday household picks',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-3z"/><path d="M2 10h3M19 10h3"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg>` },
  { key: 'health', name: 'Medicines & Health', accent: '#227A1C', desc: 'Ayurvedic essentials & pharmacy items',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-30 12 12)"/><line x1="10.5" y1="7" x2="13.5" y2="17" transform="rotate(-30 12 12)"/></svg>` },
  { key: 'gifts', name: 'Gifts & Festival', accent: '#FF8A00', desc: 'Festive pieces & thoughtful gifting',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11" rx="1.2"/><path d="M4 9h16M12 9v11"/><path d="M12 9c-2-3-6-3-6-.5S9 9 12 9zM12 9c2-3 6-3 6-.5S15 9 12 9z"/></svg>` },
  { key: 'documents', name: 'Documents & Courier', accent: '#1B4A80', desc: 'Paperwork pickup & courier handling',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 12h5M9.5 15h5M9.5 9h2"/></svg>` },
  { key: 'other', name: 'Something else', accent: '#4C8AD1', desc: "Can't find it? Tell us what you need",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M15 9l-2 5-4 1 2-5z"/></svg>` },
];
const EMPTY_ICONS = {
  bookings: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="16" width="32" height="24" rx="3"/><path d="M18 16v-4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4"/><path d="M8 25h32"/><path d="M20 25v4M28 25v4"/></svg>`,
  orders: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 10l14 7v14l-14 7-14-7V17z"/><path d="M10 17l14 7 14-7"/><path d="M24 24v14"/></svg>`,
  cart: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="11" y="8" width="26" height="34" rx="3"/><path d="M18 8v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><path d="M17 20h14M17 27h14M17 34h9"/></svg>`,
  activity: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5h24v33l-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5-3 2.5z"/><path d="M18 15h12M18 21h12M18 27h7"/></svg>`,
};
const USER_FIRST_NAME = ((currentAccount() || {}).name || 'there').split(' ')[0];
const HERO_BANNER_SRC = 'images/banner/home-banner.jpg';
const SLOT_FEE = 199;
/* Time-slot schedule (IST), operating window 11 AM - 9 PM, back-to-back with no gaps.
   The customer first picks a slot length (2 / 3 / 5 hours), then one of its slots. */
function fmtHour12(h) { const ap = h >= 12 ? 'PM' : 'AM'; const x = h % 12 === 0 ? 12 : h % 12; return x + ':00 ' + ap; }
const SLOT_DAY_START = 11, SLOT_DAY_END = 21;
const SLOT_DURATIONS = [2, 3, 5];
const SLOT_SCHEDULE = {};
SLOT_DURATIONS.forEach(dur => {
  SLOT_SCHEDULE[dur] = [];
  for (let h = SLOT_DAY_START, n = 1; h + dur <= SLOT_DAY_END; h += dur, n++) {
    SLOT_SCHEDULE[dur].push({ id: 'h' + dur + '-' + n, no: n, dur, startHour: h, endHour: h + dur, label: fmtHour12(h) + ' – ' + fmtHour12(h + dur) });
  }
});
/* Slots booked before the new schedule existed keep their original timings so old orders still track correctly. */
const LEGACY_WINDOWS = [
  { id: 't1', label: '9:00 AM – 11:00 AM', startHour: 9, endHour: 11, dur: 2 },
  { id: 't2', label: '11:00 AM – 1:00 PM', startHour: 11, endHour: 13, dur: 2 },
  { id: 't3', label: '2:00 PM – 4:00 PM', startHour: 14, endHour: 16, dur: 2 },
  { id: 't4', label: '4:00 PM – 6:00 PM', startHour: 16, endHour: 18, dur: 2 },
];
/* Every window the app can look up by id (new schedule + legacy). */
const SLOT_WINDOWS = [].concat(...SLOT_DURATIONS.map(d => SLOT_SCHEDULE[d]), LEGACY_WINDOWS);
const SLOT_DEFAULT_DUR = 2;
function draftSlotDur(d) {
  const w = d && d.slotTime && SLOT_WINDOWS.find(x => x.id === d.slotTime);
  return (w && w.dur) || (d && d.slotDur) || SLOT_DEFAULT_DUR;
}
const SLOT_MIN_DAYS = 1, SLOT_MAX_DAYS = 365;    // any day from tomorrow up to a year ahead — just not the same day
function bookIso(days) { const d = new Date(); d.setDate(d.getDate() + days); return isoOf(d.getFullYear(), d.getMonth(), d.getDate()); }
const minBookIso = () => bookIso(SLOT_MIN_DAYS), maxBookIso = () => bookIso(SLOT_MAX_DAYS);
const DOW_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MON_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function isoOf(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
function todayIso() { const n = new Date(); return isoOf(n.getFullYear(), n.getMonth(), n.getDate()); }
function dateFromIso(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
function dateLabelFromIso(iso) { const d = dateFromIso(iso); return DOW_SHORT[d.getDay()] + ', ' + d.getDate() + ' ' + MON_SHORT[d.getMonth()]; }
function windowPassed(iso, w) { return iso === todayIso() && new Date().getHours() >= w.startHour; }
function buildSlot(draft) {
  if (!draft || !draft.slotDate || !draft.slotTime) return null;
  const w = SLOT_WINDOWS.find(x => x.id === draft.slotTime);
  if (!w) return null;
  return { id: draft.slotDate + '|' + w.id, iso: draft.slotDate, date: dateLabelFromIso(draft.slotDate), time: w.label, type: 'Standard', fee: SLOT_FEE };
}
let calView = null;

function defaultState() {
  return {
    wallet: { balance: 0, transactions: [] },
    orders: [],
    draft: null,
    addresses: [],
    lastAddressId: null,
    orderSeq: 1041,
  };
}
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const st = Object.assign(defaultState(), parsed);
    if (st.draft && st.draft.slotId && !st.draft.slotDate) st.draft.slotId = null;
    if (st.draft && /^t\d$/.test(st.draft.slotTime || '')) { st.draft.slotTime = null; st.draft.slotId = null; }   // old schedule -> pick again
    return st;
  } catch (e) { return defaultState(); }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
/* The admin app writes to this customer's data (e.g. a refund). Re-read it whenever it changes or the tab
   comes back into view, so the next saveState() can never overwrite it with an out-of-date copy. */
function syncFromStorage() {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) return;
    const fresh = loadState();
    if (JSON.stringify(fresh) === JSON.stringify(state)) return;
    state = fresh;
    if (typeof renderAll === 'function') renderAll();
  } catch (e) {}
}
window.addEventListener('storage', ev => { if (ev.key === STORAGE_KEY) syncFromStorage(); });
window.addEventListener('focus', syncFromStorage);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncFromStorage(); });
function money(n) {
  n = Math.round(n || 0);
  return '₹' + n.toLocaleString('en-IN');
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function emptyState(icon, title, copy, actionHtml) {
  return `<div class="empty-state">
    <div class="empty-illustration">${EMPTY_ICONS[icon]}</div>
    <div class="empty-title">${title}</div>
    <div class="empty-copy">${copy}</div>
    ${actionHtml || ''}
  </div>`;
}

/* ---------------- Navigation ---------------- */
const FLOW_SCREENS = ['addItems', 'chooseSlot', 'delivery', 'review', 'confirmation'];
const FLOW_STEP_INDEX = { addItems: 0, chooseSlot: 1, delivery: 2, review: 3 };
const FLOW_STEP_LABELS = ['Items', 'Slot', 'Delivery', 'Review & Pay'];
function renderFlowProgress(screenName) {
  const target = document.getElementById('flowProgress-' + screenName);
  if (!target) return;
  const current = FLOW_STEP_INDEX[screenName];
  target.innerHTML = FLOW_STEP_LABELS.map((label, i) => {
    const cls = i < current ? 'done' : (i === current ? 'active' : '');
    return `<div class="fp-step ${cls}">
      <div class="fp-dot">${i < current ? '✓' : (i + 1).toString().padStart(2, '0')}</div>
      <div class="fp-label">${label}</div>
      ${i < FLOW_STEP_LABELS.length - 1 ? '<div class="fp-line"></div>' : ''}
    </div>`;
  }).join('');
}
/* True back-navigation history, so the back arrow always returns to
   wherever the person actually came from (Home, Categories, a
   category, a product's type grid) instead of one hardcoded screen.
   Root/tab screens (reached from the bottom/side nav) clear the
   stack, since they're destinations in their own right, not a step
   to "back out of". */
let navStack = [];
const ROOT_SCREENS = ['home', 'categories', 'orders', 'cart', 'profile'];
/* Every forward move remembers where you came from (and adds a browser-history
   entry, so the phone/browser back button works too). Bottom/side nav taps
   start a fresh trail; Home is always the start of the trail. */
function showScreen(name, opts) {
  opts = opts || {};
  const activeEl = document.querySelector('.screen.active');
  const currentName = activeEl ? activeEl.dataset.screen : null;
  if (name === 'home' || opts.tab) {
    navStack = [];
  } else if (!opts.isBack && currentName && currentName !== name) {
    if (currentName !== 'confirmation') navStack.push(currentName);
  }
  if (!opts.isBack && currentName && currentName !== name) {
    try { history.pushState({ s: name }, ''); } catch (e) {}
  }
  if (addrFormCtx && ((addrFormCtx === 'delivery' && name !== 'delivery') || (addrFormCtx === 'profile' && name !== 'addresses'))) closeAddrForm(true);
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
  document.getElementById('bottomnav').classList.toggle('hidden', FLOW_SCREENS.includes(name));
  document.body.classList.toggle('in-flow', FLOW_SCREENS.includes(name));
  document.getElementById('sidenav').classList.toggle('hidden', FLOW_SCREENS.includes(name));
  document.body.classList.toggle('on-confirm', name === 'confirmation');
  const navMatch = name === 'addresses' ? 'profile' : (name === 'categoryDetail' || name === 'typeDetail' || name === 'productDetail') ? 'categories' : (name === 'liveTrack' || name === 'tracking') ? 'orders' : name;
  document.querySelectorAll('.nav-btn, .top-btn[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === navMatch));
  document.querySelector('.screens').scrollTo({ top: 0 });
  if (FLOW_STEP_INDEX.hasOwnProperty(name)) renderFlowProgress(name);
  renderAll();
  fitFlowDecor();
  if (name === 'confirmation') animateCheck();
}
/* Phone view: show the corner art only when there is real leftover room above the footer */
function fitFlowDecor() {
  document.querySelectorAll('.fd-m').forEach(el => {
    const ok = el.clientHeight >= 90;
    el.classList.toggle('show', ok);
  });
}
window.addEventListener('resize', fitFlowDecor);
function navTab(name) { showScreen(name, { tab: true }); }
/* Back arrows call goBack(fallback). With history available it steps the
   browser back one entry (the popstate handler below then shows the previous
   screen); otherwise it goes to the fallback screen. */
const FLOW_PREV = { chooseSlot: 'addItems', delivery: 'chooseSlot', review: 'delivery' };
/* Explicit step-back for the booking flow (Review -> Delivery -> Slot -> Items).
   Doesn't rely on browser history, so it works even when the flow was resumed
   from a draft or the history stack got out of sync. */
function flowBack(target) {
  const i = navStack.lastIndexOf(target);
  if (i > -1) navStack.length = i;
  showScreen(target, { isBack: true });
}
function goBack(fallback) {
  if (navStack.length && history.state && history.state.s) { history.back(); return; }
  const prev = navStack.pop();
  showScreen(prev || fallback || 'home', { isBack: true });
}
window.addEventListener('popstate', () => {
  const active = document.querySelector('.screen.active');
  if (active && FLOW_PREV[active.dataset.screen]) { flowBack(FLOW_PREV[active.dataset.screen]); return; }
  const prev = navStack.pop();
  if (prev) showScreen(prev, { isBack: true });
  else if (active && active.dataset.screen !== 'home') showScreen('home', { isBack: true });
});
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- Booking flow (unchanged logic) ---------------- */
function startBooking(categoryKey) {
  state.draft = { id: uid(), items: [], onlineItems: [], slotId: null, slotDate: null, slotTime: null, instructions: '', category: categoryKey || null };
  saveState();
  showScreen('addItems');
}
function resumeDraft() {
  if (!state.draft) { showScreen('home'); return; }
  if (buildSlot(state.draft)) { showScreen(getDraftAddress(state.draft) ? 'review' : 'delivery'); return; }
  if (state.draft.items.length + state.draft.onlineItems.length > 0) { showScreen('chooseSlot'); return; }
  showScreen('addItems');
}
/* From the cart: always start the flow at step 1 (Items) so the customer walks through every step. */
function continueBooking() {
  if (!state.draft) { showScreen('home'); return; }
  showScreen('addItems');
}
/* "Book Slot" in the nav: always begin at step 1 (Items), even when the cart already has products,
   so the customer walks through Items -> Slot -> Delivery -> Review in order. */
function bookSlotNav() {
  if (state.draft) { showScreen('addItems'); } else { startBooking(); }
}
function discardDraft() {
  state.draft = null;
  saveState();
  toast('Draft discarded');
  showScreen('home');
}

function toggleForm(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function stepQty(id, delta) {
  const el = document.getElementById(id);
  let v = parseInt(el.textContent, 10) + delta;
  if (v < 1) v = 1;
  if (v > 25) v = 25;
  el.textContent = v;
}

const uploadedImages = { product: null, online: null };

function handleImageUpload(fileInputId, previewId, key) {
  const input = document.getElementById(fileInputId);
  const file = input.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Please choose an image file');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImages[key] = e.target.result;
    const preview = document.getElementById(previewId);
    preview.innerHTML = `
      <img src="${e.target.result}" alt="Uploaded reference photo">
      <button type="button" class="img-remove" onclick="clearUploadedImage('${key}','${previewId}','${fileInputId}')" aria-label="Remove photo">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button>`;
  };
  reader.readAsDataURL(file);
}
function clearUploadedImage(key, previewId, fileInputId) {
  uploadedImages[key] = null;
  document.getElementById(previewId).innerHTML = '';
  document.getElementById(fileInputId).value = '';
}

function addProduct() {
  const name = document.getElementById('pName').value.trim();
  const min = parseFloat(document.getElementById('pMin').value);
  const max = parseFloat(document.getElementById('pMax').value);
  const err = document.getElementById('pError');
  if (!name || isNaN(min) || isNaN(max) || min <= 0 || max < min || max > 1000000) {
    err.textContent = !name ? 'Give it a name so we know what to look for.'
      : (isNaN(min) || isNaN(max) || min <= 0) ? 'Enter the lowest and highest price you would pay, as numbers above 0.'
      : max < min ? 'The highest price must be the same as or more than the lowest price.'
      : 'That price looks too high — please check it (max ₹10,00,000).';
    err.classList.add('show');
    return;
  }
  err.classList.remove('show');
  state.draft.items.push({
    id: uid(), name,
    priceMin: min, priceMax: max,
    image: uploadedImages.product || '',
    desc: document.getElementById('pDesc').value.trim(),
    qty: parseInt(document.getElementById('pQty').textContent, 10),
  });
  saveState();
  ['pName','pDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pMin').value = ''; document.getElementById('pMax').value = '';
  document.getElementById('pQty').textContent = '1';
  clearUploadedImage('product','pImgPreview','pImgFile');
  document.getElementById('productForm').style.display = 'none';
  renderAddItems();
  renderCartBadge();
}
function removeProduct(id) {
  state.draft.items = state.draft.items.filter(i => i.id !== id);
  saveState(); renderAddItems(); renderCart(); renderCartBadge();
}
function addOnlineItem() {
  const link = document.getElementById('oLink').value.trim();
  const err = document.getElementById('oError');
  let okLink = false; try { const u = new URL(link); okLink = /^https?:$/.test(u.protocol) && u.hostname.includes('.'); } catch (e) {}
  if (!link || !okLink) { err.textContent = 'Enter a full product link starting with https://'; err.classList.add('show'); return; }
  err.classList.remove('show');
  state.draft.onlineItems.push({
    id: uid(), link,
    image: uploadedImages.online || '',
    price: Math.min(1000000, Math.max(0, parseFloat(document.getElementById('oPrice').value) || 0)),
    qty: parseInt(document.getElementById('oQty').textContent, 10),
  });
  saveState();
  ['oLink','oPrice'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('oQty').textContent = '1';
  clearUploadedImage('online','oImgPreview','oImgFile');
  document.getElementById('onlineForm').style.display = 'none';
  renderAddItems();
  renderCartBadge();
}
/* +/- quantity control for an item already in the draft (cart page and the Items step). */
function qtyStepperHtml(it, online) {
  const q = it.qty || 1, k = online ? 'online' : 'product';
  return `<div class="qty-stepper cart-qty" role="group" aria-label="Quantity">
    <button type="button" onclick="changeItemQty('${k}','${it.id}',-1)" aria-label="Decrease quantity"${q <= 1 ? ' disabled' : ''}>−</button>
    <span aria-live="polite">${q}</span>
    <button type="button" onclick="changeItemQty('${k}','${it.id}',1)" aria-label="Increase quantity"${q >= 25 ? ' disabled' : ''}>+</button>
  </div>`;
}
function changeItemQty(kind, id, delta) {
  if (!state.draft) return;
  const list = kind === 'online' ? state.draft.onlineItems : state.draft.items;
  const it = list.find(i => i.id === id);
  if (!it) return;
  const q = Math.max(1, Math.min(25, (it.qty || 1) + delta));
  if (q === it.qty) return;
  it.qty = q;
  saveState(); renderAddItems(); renderCart(); renderCartBadge();
}
function removeOnlineItem(id) {
  state.draft.onlineItems = state.draft.onlineItems.filter(i => i.id !== id);
  saveState(); renderAddItems(); renderCart(); renderCartBadge();
}

/* Renders a draft/order item's thumbnail. Catalog products and types
   (tapped from a category or type grid) carry imgCat/imgName/imgType
   instead of a flat URL, so their real product photo — the same one
   shown on the category and type grids — can be resolved and shown
   here, on the slot screen, review, orders, and confirmation. Manual
   items, online links, and "popular" picks still just use .image. */
/* Older saved items may lack imgCat/imgName; find the catalog product
   (or "Product – Type") by name so their photo still shows. */
function guessCatalogImg(it) {
  if (!it || !it.name || typeof PRODUCT_CATALOG === 'undefined') return null;
  const nm = String(it.name).trim().toLowerCase();
  for (const c of PRODUCT_CATALOG) {
    for (const p of c.products) {
      if (nm === p.name.toLowerCase()) return { imgCat: c.key, imgName: p.name, imgType: null };
      for (const t of (p.types || [])) {
        const tn = t.name || t;
        if (nm === `${p.name} – ${tn}`.toLowerCase() || nm === `${p.name} - ${tn}`.toLowerCase()) return { imgCat: c.key, imgName: p.name, imgType: tn };
      }
    }
  }
  return null;
}
function itemThumb(it) {
    /* ONE product = ONE image: the customer's reference photo if given, else the catalog image */
  const refImg = it && ((it.images && it.images.filter(Boolean)[0]) || it.image);
  if (refImg) it = Object.assign({}, it, { image: refImg, imgCat: null });
  if (it && !it.imgCat && !it.image) { const g = guessCatalogImg(it); if (g) it = Object.assign({}, it, g); }
  if (it && it.imgCat) {
    const src = it.imgType
      ? typeImageSrc(it.imgCat, it.imgName, it.imgType, 0)
      : productImageSrc(it.imgCat, it.imgName, 0);
    if (src) {
      return `<div class="item-thumb"><img src="${escapeAttr(src)}" data-cat="${escapeAttr(it.imgCat)}" data-pname="${escapeAttr(it.imgName)}"${it.imgType ? ` data-tname="${escapeAttr(it.imgType)}"` : ''} data-ext="0" onerror="itemThumbImgError(this)"></div>`;
    }
  }
  const imgUrl = it && it.image;
  if (imgUrl) {
    return `<div class="item-thumb"><img src="${escapeAttr(imgUrl)}" onerror="handleImgError(this)"></div>`;
  }
  return `<div class="item-thumb">${IMG_FALLBACK}</div>`;
}
/* Same idea as productImgError: tries the next file extension for a
   catalog item's thumbnail before giving up and showing the fallback icon. */
function itemThumbImgError(img) {
  const next = (parseInt(img.dataset.ext, 10) || 0) + 1;
  const src = img.dataset.tname
    ? typeImageSrc(img.dataset.cat, img.dataset.pname, img.dataset.tname, next)
    : productImageSrc(img.dataset.cat, img.dataset.pname, next);
  if (src) { img.dataset.ext = next; img.src = src; return; }
  handleImgError(img);
}
/* All reference photos the customer attached to a product (tap to enlarge). */
function refThumbsHtml(it) {
  const a = ((it && it.images) || []).filter(Boolean);
  if (it && it.image && !a.includes(it.image)) a.unshift(it.image);
  if (a.length < 2) return '';        /* the single reference photo is already the item's thumbnail; only show the strip for 2+ */
  return `<div class="ref-thumbs"><span class="ref-cap">Your photo${a.length === 1 ? '' : 's'}</span>${a.map(s => `<img src="${escapeAttr(s)}" alt="Reference photo" onclick="event.stopPropagation(); openLightbox(this.src)">`).join('')}</div>`;
}
/* Compact row of up to 5 item thumbnails (draft or order), used
   anywhere a quick visual summary is more useful than a text list. */
function itemsStripHtml(items, onlineItems) {
  const all = [...(items || []), ...(onlineItems || [])];
  if (!all.length) return '';
  const shown = all.slice(0, 5);
  const extra = all.length - shown.length;
  return `<div class="items-strip">
    ${shown.map(it => itemThumb(it)).join('')}
    ${extra > 0 ? `<div class="items-strip-more">+${extra}</div>` : ''}
  </div>`;
}
/* Short "what's in it" label for a booking/draft, used anywhere a
   card shows a slot or total but not the actual item names — e.g.
   "Frying Pan, Cast Iron Kadai +1 more". Online items (no product
   name, just a link) show as "Online item". */
function itemNamesLabel(items, onlineItems, max) {
  max = max || 3;
  const names = [...(items || []).map(it => it.name), ...(onlineItems || []).map(() => 'Online item')];
  if (!names.length) return '';
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return shown.join(', ') + (extra > 0 ? ` +${extra} more` : '');
}
function handleImgError(el) { el.parentElement.innerHTML = IMG_FALLBACK; }
const IMG_FALLBACK = `<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6'><rect x='3' y='5' width='18' height='14' rx='2'/><circle cx='9' cy='10' r='1.6'/><path d='M21 16l-5-5-5 5-3-3-4 4'/></svg>`;
function escapeAttr(s) { return (s || '').replace(/"/g, '&quot;'); }
function escapeHtml(s) {
  return (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function renderAddItems() {
  if (!state.draft) return;
  const pList = document.getElementById('productList');
  pList.innerHTML = state.draft.items.map(it => `
    <div class="item-card">
      ${itemThumb(it)}
      <div class="item-body">
        <div class="item-name">${escapeHtml(it.name)}</div>
        <div class="item-sub">${money(it.priceMax)} each</div>
        ${it.desc ? `<div class="item-desc">${escapeHtml(it.desc)}</div>` : ''}
        <div class="item-actions">
          ${qtyStepperHtml(it, false)}
          <button class="icon-btn" onclick="removeProduct('${it.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('');

  const oList = document.getElementById('onlineList');
  oList.innerHTML = state.draft.onlineItems.map(it => `
    <div class="item-card">
      ${itemThumb(it)}
      <div class="item-body">
        <div class="item-name">Online item</div>
        <a class="item-link" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">${escapeHtml(it.link)}</a>
        <div class="item-sub">${it.price ? money(it.price) + ' est.' : 'Price to confirm'}</div>
        <div class="item-actions">
          ${qtyStepperHtml(it, true)}
          <button class="icon-btn" onclick="removeOnlineItem('${it.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('');

  const total = state.draft.items.length + state.draft.onlineItems.length;
  document.getElementById('itemCountLabel').textContent = total === 0 ? 'No items yet' : total + (total === 1 ? ' item added' : ' items added');
  document.getElementById('toSlotBtn').disabled = total === 0;

  const summaryEl = document.getElementById('addItemsSummary');
  if (summaryEl) {
    const productsTotal = state.draft.items.reduce((sum, it) => sum + (it.priceMax || it.priceMin || 0) * it.qty, 0);
    const onlineTotal = state.draft.onlineItems.reduce((sum, it) => sum + (it.price || 0) * it.qty, 0);
    if (total === 0) {
      summaryEl.innerHTML = `<div class="empty-copy" style="font-size:12.5px;">Nothing added yet — items you pick will show up here as you go.</div>`;
    } else {
      summaryEl.innerHTML = `
        <div class="review-row"><span class="label">${total} item${total === 1 ? '' : 's'}</span><span class="val">${money(productsTotal + onlineTotal)} est.</span></div>
        <p class="price-note" style="margin-top:8px;">Slot fee is added once you pick a shopping window.</p>`;
    }
  }
}

function goToChooseSlot() {
  if (!state.draft || (state.draft.items.length + state.draft.onlineItems.length) === 0) return;
  showScreen('chooseSlot');
}
function syncSlotId() {
  const d = state.draft;
  d.slotId = (d.slotDate && d.slotTime) ? d.slotDate + '|' + d.slotTime : null;
}
function pickSlotDate(iso) {
  const d = state.draft;
  if (iso < minBookIso() || iso > maxBookIso()) return;      // no same-day (or past) bookings
  d.slotDate = iso;
  const w = SLOT_WINDOWS.find(x => x.id === d.slotTime);
  if (w && windowPassed(iso, w)) d.slotTime = null;
  syncSlotId(); saveState(); renderChooseSlot();
}
function pickSlotDur(n) {
  const d = state.draft; n = Number(n);
  if (!SLOT_SCHEDULE[n]) return;
  if (draftSlotDur(d) === n) return;
  d.slotDur = n; d.slotTime = null; syncSlotId(); saveState(); renderChooseSlot();
}
function pickSlotTime(id) {
  const d = state.draft;
  const w = SLOT_WINDOWS.find(x => x.id === id);
  if (!d.slotDate || !w || windowPassed(d.slotDate, w)) return;
  d.slotTime = id; d.slotDur = w.dur;
  syncSlotId(); saveState(); renderChooseSlot();
}
function calNav(delta) {
  if (!calView) return;
  const n = dateFromIso(minBookIso());
  const minIdx = n.getFullYear() * 12 + n.getMonth();
  const max = new Date(); max.setDate(max.getDate() + SLOT_MAX_DAYS);
  const maxIdx = max.getFullYear() * 12 + max.getMonth();
  const idx = calView.y * 12 + calView.m + delta;
  if (idx < minIdx || idx > maxIdx) return;
  calView = { y: Math.floor(idx / 12), m: idx % 12 };
  renderChooseSlot();
}
function setInstructions(el) {
  state.draft.instructions = el.value.slice(0, 300);
  document.getElementById('slotNoteCount').textContent = state.draft.instructions.length + '/300';
  saveState();
}
function renderChooseSlot() {
  if (!state.draft) return;
  const d = state.draft;
  const stripEl = document.getElementById('slotItemsStrip');
  if (stripEl) {
    const st = computeTotals(d);
    stripEl.innerHTML = `${itemsStripHtml(d.items, d.onlineItems)}
      <div class="review-row"><span class="label">Items</span><span class="val">${escapeHtml(itemNamesLabel(d.items, d.onlineItems, 3))}</span></div>
      <div class="review-row"><span class="label">Slot</span><span class="val">${st.slot ? st.slot.date + ' · ' + st.slot.time : 'Not chosen yet'}</span></div>
      <div class="review-row"><span class="label">Items estimate</span><span class="val">${money(st.productsTotal + st.onlineTotal)}</span></div>`;
  }

  const now = new Date();
  if (!calView) {
    const base = d.slotDate ? dateFromIso(d.slotDate) : dateFromIso(minBookIso());
    calView = { y: base.getFullYear(), m: base.getMonth() };
  }
  const today = todayIso();
  const maxIso = maxBookIso(), minIso = minBookIso();
  const first = new Date(calView.y, calView.m, 1);
  const daysIn = new Date(calView.y, calView.m + 1, 0).getDate();
  const idx = calView.y * 12 + calView.m;
  const minD = dateFromIso(minIso), maxD = dateFromIso(maxIso);
  const canPrev = idx > minD.getFullYear() * 12 + minD.getMonth();
  const canNext = idx < maxD.getFullYear() * 12 + maxD.getMonth();
  const chev = (dir) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${dir < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}"/></svg>`;

  let cells = DOW_SHORT.map(x => `<div class="cal-dow">${x}</div>`).join('');
  for (let i = 0; i < first.getDay(); i++) cells += '<div></div>';
  for (let day = 1; day <= daysIn; day++) {
    const iso = isoOf(calView.y, calView.m, day);
    const off = iso < minIso || iso > maxIso;
    const sel = d.slotDate === iso;
    cells += `<button type="button" class="cal-day${sel ? ' selected' : ''}${iso === today ? ' today' : ''}" ${off ? 'disabled' : `onclick="pickSlotDate('${iso}')"`} aria-label="${dateLabelFromIso(iso)}"${sel ? ' aria-pressed="true"' : ''}>${day}</button>`;
  }

  const dur = draftSlotDur(d);
  const durTabs = SLOT_DURATIONS.map(n => `<button type="button" class="dur-tab dur-${n}${dur === n ? ' selected' : ''}" onclick="pickSlotDur(${n})" aria-pressed="${dur === n}"><b>${n}-Hour</b><small>${SLOT_SCHEDULE[n].length} slots</small></button>`).join('');
  const times = SLOT_SCHEDULE[dur].map(w => {
    const off = !d.slotDate || windowPassed(d.slotDate, w);
    const sel = d.slotTime === w.id;
    return `<button type="button" class="time-slot dur-${dur}${sel ? ' selected' : ''}" ${off ? 'disabled' : `onclick="pickSlotTime('${w.id}')"`}><span class="ts-no">${w.no}</span><span class="ts-time">${w.label}</span></button>`;
  }).join('');

  document.getElementById('slotList').innerHTML = `
    <div class="sl-col"><div class="slot-sec-title">Choose preferred date</div>
    <div class="cal-card">
      <div class="cal-head">
        <button type="button" class="cal-nav" onclick="calNav(-1)" ${canPrev ? '' : 'disabled'} aria-label="Previous month">${chev(-1)}</button>
        <div class="cal-month">${MON_LONG[calView.m]} ${calView.y}</div>
        <button type="button" class="cal-nav" onclick="calNav(1)" ${canNext ? '' : 'disabled'} aria-label="Next month">${chev(1)}</button>
      </div>
      <div class="cal-grid">${cells}</div>
    </div></div>
    <div class="sl-col"><div class="slot-sec-title">Choose slot length</div>
    <div class="dur-tabs" role="group" aria-label="Slot length">${durTabs}</div>
    <div class="slot-sec-title" style="margin-top:14px">Choose preferred time slot <span class="slot-ist">(IST · 11 AM – 9 PM)</span></div>
    <div class="time-grid">${times}</div>
    ${d.slotDate ? '' : '<div class="slot-hint">Pick a date to see the time slots.</div>'}</div>`;

  const note = document.getElementById('slotNote');
  if (note && document.activeElement !== note) note.value = d.instructions || '';
  document.getElementById('slotNoteCount').textContent = (d.instructions || '').length + '/300';

  const chosen = buildSlot(d);
  document.getElementById('slotSelectedLabel').textContent = chosen ? chosen.date + ' · ' + chosen.time : 'No slot selected';
  document.getElementById('toReviewBtn').disabled = !chosen;
}


/* ================================================================
   DELIVERY DETAILS (flow step 3): saved addresses, add / edit / delete,
   the chosen address is stored on the draft and copied onto the order.
   ================================================================ */
let addrFormCtx = null, addrEditId = null, addrLabel = 'Home';
function escapeAttr(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function addressOneLine(a) {
  return [a.line1, a.line2, a.city, [a.region, a.zip].filter(Boolean).join(' '), a.country].filter(Boolean).join(', ');
}
function getDraftAddress(d) {
  return d && d.addressId ? (state.addresses || []).find(a => a.id === d.addressId) || null : null;
}
function ensureDraftAddress(d) {
  if (!d || getDraftAddress(d)) return;
  const list = state.addresses || [];
  const pref = list.find(a => a.id === state.lastAddressId) || list[0];
  d.addressId = pref ? pref.id : null;
}
function selectAddress(id) {
  if (!state.draft) return;
  state.draft.addressId = id; state.lastAddressId = id;
  saveState(); renderDelivery(); renderProfileAddresses();
}
function pickAddrLabel(l) {
  addrLabel = l;
  document.querySelectorAll('#addrChips .af-chip').forEach(c => c.classList.toggle('active', c.dataset.l === l));
}
function addrCardHtml(a, selectable, selected) {
  const attrs = selectable
    ? `role="radio" aria-checked="${selected}" tabindex="0" onclick="selectAddress('${a.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectAddress('${a.id}');}"`
    : '';
  return `<div class="addr-card ${selectable ? 'selectable' : ''} ${selected ? 'selected' : ''}" ${attrs}>
    ${selectable ? '<span class="addr-radio"></span>' : `<span class="addr-pin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg></span>`}
    <div class="addr-body">
      <div class="addr-name">${escapeHtml(a.name)} <span class="addr-tag">${escapeHtml(a.label || 'Home')}</span></div>
      <div class="addr-lines">${escapeHtml(addressOneLine(a))}</div>
      <div class="addr-phone">${escapeHtml(a.phone)}</div>
    </div>
    <button type="button" class="addr-edit" onclick="event.stopPropagation(); openAddrForm('${selectable ? 'delivery' : 'profile'}', '${a.id}')">Edit</button>
  </div>`;
}
function addrFormHtml(ctx, a, seed) {
  const src = a || seed || null;
  const v = k => escapeAttr(src ? src[k] : '');
  const canCancel = ctx === 'profile' || (state.addresses || []).length > 0;
  return `<div class="af">
    <div class="af-head" ${(!a && !(state.addresses || []).length) ? 'style="display:none"' : ''}><div class="af-title">${a ? 'Edit address' : 'New address'}</div>
      ${a ? '<button type="button" class="af-del" onclick="deleteAddress(addrEditId)">Delete</button>' : ''}</div>
    <div class="af-sec">Contact</div>
    <div class="af-grid">
      <label class="af-f"><span>Full name</span><input type="text" id="adName" data-g="letters" maxlength="60" autocomplete="name" placeholder="Priya Sharma" value="${v('name')}"></label>
      <label class="af-f"><span>Phone</span><input type="tel" id="adPhone" data-g="phone" maxlength="18" autocomplete="tel" inputmode="tel" placeholder="+1 415 123 4567" value="${v('phone')}"></label>
    </div>
    <div class="af-sec">Address</div>
    <div class="af-grid">
      <label class="af-f af-full"><span>Street address</span><input type="text" id="adLine1" maxlength="100" autocomplete="address-line1" placeholder="House / building, street" value="${v('line1')}"></label>
      <label class="af-f af-full"><span>Apartment, suite, landmark <em>optional</em></span><input type="text" id="adLine2" maxlength="100" autocomplete="address-line2" value="${v('line2')}"></label>
      <label class="af-f"><span>City</span><input type="text" id="adCity" data-g="letters" maxlength="50" autocomplete="address-level2" value="${v('city')}"></label>
      <label class="af-f"><span>State / Province</span><input type="text" id="adRegion" data-g="letters" maxlength="50" autocomplete="address-level1" value="${v('region')}"></label>
      <label class="af-f"><span>ZIP / Postal code</span><input type="text" id="adZip" data-g="zip" maxlength="10" inputmode="text" autocomplete="postal-code" value="${v('zip')}"></label>
      <label class="af-f"><span>Country</span><input type="text" id="adCountry" data-g="letters" maxlength="56" autocomplete="country-name" placeholder="United States" value="${v('country')}"></label>
    </div>
    <div class="af-foot">
      <div class="af-chips" id="addrChips" role="group" aria-label="Save as">
        <span class="af-saveas">Save as</span>
        <button type="button" class="af-chip" data-l="Home" onclick="pickAddrLabel('Home')">Home</button>
        <button type="button" class="af-chip" data-l="Office" onclick="pickAddrLabel('Office')">Office</button>
        <button type="button" class="af-chip" data-l="Other" onclick="pickAddrLabel('Other')">Other</button>
      </div>
    </div>
    <div class="field-error" id="adError">Please fill in your name, phone, street address, city, postal code and country.</div>
    <div class="af-actions">
      ${canCancel ? '<button type="button" class="af-cancel" onclick="closeAddrForm()">Cancel</button>' : '<span></span>'}
      ${ctx === 'profile' ? '<button type="button" class="btn btn-primary" onclick="saveAddress(false)">Save address</button>' : ''}
    </div>
  </div>`;
}
function openAddrForm(ctx, id, quiet) {
  closeAddrForm(true);
  addrFormCtx = ctx; addrEditId = id || null;
  const a = id ? (state.addresses || []).find(x => x.id === id) : null;
  const first = !(state.addresses || []).length;
  let seed = a;
  if (!a && first) { const acct = currentAccount(); if (acct) seed = { name: acct.name }; }
  const host = document.getElementById('addrHost-' + ctx);
  host.innerHTML = addrFormHtml(ctx, a, seed);
  pickAddrLabel(a ? a.label : (first ? 'Home' : 'Office'));
  renderDelivery(); renderProfileAddresses();
  if (!quiet) {
    const firstEmpty = Array.from(host.querySelectorAll('input')).find(i => !i.value) || host.querySelector('input');
    if (firstEmpty) firstEmpty.focus({ preventScroll: true });
    if (host.scrollIntoView) host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
function closeAddrForm(silent) {
  if (addrFormCtx) { const h = document.getElementById('addrHost-' + addrFormCtx); if (h) h.innerHTML = ''; }
  addrFormCtx = null; addrEditId = null;
  if (!silent) { renderDelivery(); renderProfileAddresses(); }
}
function saveAddress(andContinue) {
  const v = k => document.getElementById(k).value.trim();
  const a = { label: addrLabel, name: v('adName'), phone: v('adPhone'), line1: v('adLine1'), line2: v('adLine2'),
              city: v('adCity'), region: v('adRegion'), zip: v('adZip'), country: v('adCountry') };
  const adErr = (m) => { const el = document.getElementById('adError'); el.textContent = m; el.classList.add('show'); return false; };
  const phDigits = a.phone.replace(/\D/g, '');
  if (!a.name || !a.phone || !a.line1 || !a.city || !a.zip || !a.country) return adErr('Please fill in your name, phone, street address, city, postal code and country.');
  if (a.name.length < 2 || !/^[\p{L}\p{M}\s.'’\-]+$/u.test(a.name)) return adErr('Name can only contain letters.');
  if (!/^\+?[\d\s\-()]+$/.test(a.phone) || phDigits.length < 7 || phDigits.length > 15) return adErr('Enter a valid phone number (7–15 digits).');
  if (!/^[\p{L}\p{M}\s.'’\-]+$/u.test(a.city)) return adErr('City can only contain letters.');
  if (a.region && !/^[\p{L}\p{M}\s.'’\-]+$/u.test(a.region)) return adErr('State / Province can only contain letters.');
  if (!/^[A-Za-z0-9][A-Za-z0-9\s\-]{1,8}[A-Za-z0-9]$/.test(a.zip)) return adErr('Enter a valid postal code (3–10 letters or numbers).');
  if (!/^[\p{L}\p{M}\s.'’\-]+$/u.test(a.country)) return adErr('Country can only contain letters.');
  document.getElementById('adError').classList.remove('show');
  state.addresses = state.addresses || [];
  const wasEdit = !!addrEditId;
  let id = addrEditId;
  if (id) {
    const i = state.addresses.findIndex(x => x.id === id);
    if (i > -1) state.addresses[i] = Object.assign({ id }, a);
  } else {
    id = uid(); state.addresses.push(Object.assign({ id }, a));
  }
  const ctx = addrFormCtx;
  if (state.draft && (ctx === 'delivery' || !state.draft.addressId)) state.draft.addressId = id;
  if (ctx === 'delivery' || !state.lastAddressId) state.lastAddressId = id;
  saveState();
  closeAddrForm(true);
  renderAll();
  toast(wasEdit ? 'Address updated' : 'Address saved');
  if (andContinue) goToReview();
  return true;
}
function deleteAddress(id) {
  if (!id) return;
  if (!confirm('Remove this address?')) return;
  state.addresses = (state.addresses || []).filter(a => a.id !== id);
  if (state.lastAddressId === id) state.lastAddressId = null;
  if (state.draft && state.draft.addressId === id) { state.draft.addressId = null; ensureDraftAddress(state.draft); }
  closeAddrForm(true);
  saveState(); renderAll(); toast('Address removed');
}
function setDeliveryNotes(el) {
  if (!state.draft) return;
  state.draft.deliveryNotes = el.value.slice(0, 300);
  document.getElementById('dlNotesCount').textContent = state.draft.deliveryNotes.length + '/300';
  saveState();
}
function deliveryContinue() {
  if (addrFormCtx === 'delivery') { saveAddress(true); return; }
  goToReview();
}
function renderDelivery() {
  const d = state.draft;
  const list = document.getElementById('addrList');
  if (!d || !list) return;
  ensureDraftAddress(d);
  const addrs = state.addresses || [];
  const onScreen = (document.querySelector('.screen.active') || {}).dataset && document.querySelector('.screen.active').dataset.screen === 'delivery';
  if (!addrs.length && addrFormCtx === null && onScreen) { openAddrForm('delivery', null, true); return; }
  const formOpen = addrFormCtx === 'delivery';
  list.innerHTML = addrs.map(a => addrCardHtml(a, true, a.id === d.addressId)).join('');
  list.style.display = addrs.length ? '' : 'none';
  document.getElementById('addrAddBtn').style.display = (formOpen || !addrs.length) ? 'none' : '';

  const chosen = getDraftAddress(d);
  document.getElementById('dlSelectedLabel').textContent = formOpen ? 'Fill in the address to continue' : (chosen ? `Delivering to ${chosen.city}` : 'No address selected');
  document.getElementById('dlBtnLabel').textContent = formOpen ? 'Save & continue' : 'Continue to review & pay';
  document.getElementById('toReviewFromDelivery').disabled = !(formOpen || chosen);

  const notes = document.getElementById('dlNotes');
  if (notes && document.activeElement !== notes) notes.value = d.deliveryNotes || '';
  document.getElementById('dlNotesCount').textContent = (d.deliveryNotes || '').length + '/300';
  const t = computeTotals(d);
  const sum = document.getElementById('dlSummary');
  if (sum) sum.innerHTML = `
    <div class="review-row"><span class="label">Slot</span><span class="val">${t.slot ? t.slot.date + ' · ' + t.slot.time : '—'}</span></div>
    <div class="review-row"><span class="label">Deliver to</span><span class="val">${chosen ? escapeHtml(chosen.name) + '<br><span class="val-sub">' + escapeHtml(addressOneLine(chosen)) + '</span>' : 'Not chosen yet'}</span></div>
    <div class="review-row"><span class="label">Estimated total</span><span class="val">${money(t.grandTotal)}</span></div>`;
}
function renderProfileAddresses() {
  const list = document.getElementById('pfAddrList');
  if (!list) return;
  const addrs = state.addresses || [];
  list.innerHTML = addrs.length
    ? addrs.map(a => addrCardHtml(a, false, a.id === state.lastAddressId)).join('')
    : '<div class="dl-empty">No saved addresses yet. Add one here, or while booking a slot.</div>';
  document.getElementById('pfAddBtn').style.display = addrFormCtx === 'profile' ? 'none' : '';
  const sub = document.getElementById('profileAddrSub');
  if (sub) {
    const def = addrs.find(a => a.id === state.lastAddressId) || addrs[0];
    sub.textContent = def ? `${def.label || 'Home'} · ${def.city}${addrs.length > 1 ? ' +' + (addrs.length - 1) + ' more' : ''}` : 'Add an address';
  }
}

function goToDelivery() {
  if (!state.draft || !buildSlot(state.draft)) return;
  showScreen('delivery');
}
function goToReview() {
  if (!state.draft || !buildSlot(state.draft)) return;
  ensureDraftAddress(state.draft);
  if (!getDraftAddress(state.draft)) { showScreen('delivery'); return; }
  saveState();
  showScreen('review');
}
function computeTotals(draft) {
  const productsTotal = draft.items.reduce((sum, it) => sum + (it.priceMax || it.priceMin || 0) * it.qty, 0);
  const onlineTotal = draft.onlineItems.reduce((sum, it) => sum + (it.price || 0) * it.qty, 0);
  const slot = buildSlot(draft);
  const slotFee = slot ? slot.fee : 0;
  return { productsTotal, onlineTotal, slotFee, grandTotal: productsTotal + onlineTotal + slotFee, slot };
}
function toggleReviewDetail() {
  const el = document.getElementById('rvDetail');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function renderReview() {
  if (!state.draft) return;
  const d = state.draft;
  const t = computeTotals(d);
  document.getElementById('rvSlot').textContent = t.slot ? `${t.slot.date} · ${t.slot.time}` : '—';
  const rvN = (d.instructions || '').trim();
  document.getElementById('rvNoteRow').style.display = rvN ? '' : 'none';
  document.getElementById('rvNote').textContent = rvN;
  const rvA = getDraftAddress(d);
  document.getElementById('rvAddr').textContent = rvA ? `${rvA.name} · ${addressOneLine(rvA)}` : 'Not chosen yet';
  const rvDN = (d.deliveryNotes || '').trim();
  document.getElementById('rvDelNoteRow').style.display = rvDN ? '' : 'none';
  document.getElementById('rvDelNote').textContent = rvDN;
  const parts = [];
  if (d.items.length) parts.push(`${d.items.length} product${d.items.length > 1 ? 's' : ''}`);
  if (d.onlineItems.length) parts.push(`${d.onlineItems.length} online link${d.onlineItems.length > 1 ? 's' : ''}`);
  document.getElementById('rvItems').textContent = parts.join(', ') || '—';

  document.getElementById('rvDetail').innerHTML = [
    ...d.items.map(it => `<div class="detail-row-thumb">${itemThumb(it)}<div class="drt-body"><span class="drt-name">${escapeHtml(it.name)} × ${it.qty}${refThumbsHtml(it)}</span><b>${money((it.priceMax || it.priceMin || 0) * it.qty)}</b></div></div>`),
    ...d.onlineItems.map(it => `<div class="detail-row-thumb">${itemThumb(it)}<div class="drt-body"><span class="drt-name">Online link × ${it.qty}</span><b>${it.price ? money(it.price * it.qty) : 'TBC'}</b></div></div>`)
  ].join('') || '<div class="detail-row"><span>No items</span></div>';

  document.getElementById('prProducts').textContent = money(t.productsTotal);
  document.getElementById('prOnline').textContent = money(t.onlineTotal);
  document.getElementById('prSlot').textContent = money(t.slotFee);
  document.getElementById('prTotal').textContent = money(t.grandTotal);
  document.getElementById('rvSideTotal').textContent = money(t.grandTotal);
  document.getElementById('rvSideBal').textContent = money(state.wallet.balance);

  const card = document.getElementById('walletStatusCard');
  const text = document.getElementById('walletStatusText');
  const btn = document.getElementById('walletStatusBtn');
  const balance = state.wallet.balance;

  if (balance >= t.grandTotal) {
    card.className = 'wallet-status-card ok';
    text.textContent = `Your Visasra Money balance is ${money(balance)}. Confirming will deduct ${money(t.grandTotal)} for this booking.`;
    btn.className = 'btn btn-primary btn-block';
    btn.textContent = 'Confirm booking';
    btn.onclick = confirmBooking;
  } else {
    const short = t.grandTotal - balance;
    card.className = 'wallet-status-card short';
    text.textContent = `You're ${money(short)} short in Visasra Money for this booking (balance: ${money(balance)}).`;
    btn.className = 'btn btn-primary btn-block';
    btn.textContent = 'Add money to Visasra Money';
    btn.onclick = () => openTopUp('review');
  }
}

function confirmBooking() {
  const d = state.draft;
  const t = computeTotals(d);
  const sw = t.slot && SLOT_WINDOWS.find(x => x.id === String(t.slot.id).split('|')[1]);
  if (!t.slot || !sw || t.slot.iso < minBookIso() || t.slot.iso > maxBookIso() || windowPassed(t.slot.iso, sw)) {      // the chosen time slipped into the past while the draft was open
    state.draft.slotTime = null; saveState(); toast('Same-day slots can’t be booked — please pick a later date and time'); showScreen('chooseSlot'); return;
  }
  if (!getDraftAddress(d)) { showScreen('delivery'); return; }
  if (state.wallet.balance < t.grandTotal) { renderReview(); return; }
  const addr = Object.assign({}, getDraftAddress(d));
  state.wallet.balance -= t.grandTotal;
  state.wallet.transactions.unshift({ id: uid(), type: 'debit', amount: t.grandTotal, note: 'Booking payment', date: todayLabel() });

  const orderId = 'VS-' + (state.orderSeq++);
  const order = {
    id: orderId, createdLabel: todayLabel(),
    items: d.items, onlineItems: d.onlineItems, slot: t.slot, instructions: (d.instructions || '').trim(), category: d.category,
    productsTotal: t.productsTotal, onlineTotal: t.onlineTotal, slotFee: t.slotFee, total: t.grandTotal,
    status: 'Slot booked',
    address: addr, deliveryNotes: (d.deliveryNotes || '').trim(),
  };
  state.orders.unshift(order);
  state.draft = null;
  saveState();

  document.getElementById('confirmSummary').innerHTML = `
    ${itemsStripHtml(order.items, order.onlineItems)}
    <div class="review-row"><span class="label">Items</span><span class="val">${escapeHtml(itemNamesLabel(order.items, order.onlineItems, 5))}</span></div>
    <div class="review-row"><span class="label">Order</span><span class="val">${order.id}</span></div>
    <div class="review-row"><span class="label">Slot</span><span class="val">${order.slot.date} · ${order.slot.time}</span></div>
    <div class="review-row"><span class="label">Deliver to</span><span class="val">${escapeHtml(order.address.name)} · ${escapeHtml(addressOneLine(order.address))}</span></div>
    <div class="review-row"><span class="label">Amount deducted</span><span class="val">${money(order.total)}</span></div>
    <div class="review-row"><span class="label">Visasra Money left</span><span class="val">${money(state.wallet.balance)}</span></div>
  `;
  showScreen('confirmation');
}
function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function animateCheck() {
  const path = document.getElementById('checkPath');
  if (!path) return;
  path.style.transition = 'none';
  path.style.strokeDashoffset = 20;
  requestAnimationFrame(() => {
    path.style.transition = 'stroke-dashoffset .5s ease .1s';
    path.style.strokeDashoffset = 0;
  });
}

/* ---------------- Top-up modal (unchanged logic) ---------------- */
let topUpOrigin = 'home';
const QUICK_AMOUNTS = [1000, 2500, 5000, 10000];
let selectedChip = null;
function openTopUp(origin) {
  topUpOrigin = origin;
  selectedChip = null;
  document.getElementById('customAmount').value = '';
  document.getElementById('amountChips').innerHTML = QUICK_AMOUNTS.map(a =>
    `<button class="amount-chip" onclick="pickChip(${a}, this)">${money(a)}</button>`).join('');
  document.getElementById('topUpModal').classList.add('active');
}
function pickChip(amount, el) {
  document.querySelectorAll('.amount-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedChip = amount;
  document.getElementById('customAmount').value = amount;
}
function closeTopUp() { document.getElementById('topUpModal').classList.remove('active'); }
function confirmTopUp() {
  const amt = parseFloat(document.getElementById('customAmount').value);
  if (!amt || amt <= 0) return toast('Enter an amount greater than ₹0');
  if (amt > 100000) return toast('You can add up to ₹1,00,000 at a time');
  state.wallet.balance += Math.round(amt * 100) / 100;
  state.wallet.transactions.unshift({ id: uid(), type: 'credit', amount: Math.round(amt * 100) / 100, note: 'Added to Visasra Money', date: todayLabel() });
  saveState();
  closeTopUp();
  toast(`${money(amt)} added to Visasra Money`);
  renderAll();
}

/* ================================================================
   NEW, PURELY ADDITIVE FEATURES — small, real, non-fake:
   search filter, "Popular on Visasra" quick-add.
   None of these touch wallet/booking business logic above.
   ================================================================ */
const POPULAR_ITEMS = [
  { cat: 'jewellery-accessories', name: 'Jewellery Sets', mid: 1500, high: 5000 },
  { cat: 'pooja-spiritual',       name: 'Pooja Sets',     mid: 800,  high: 2000 },
  { cat: 'cookware',              name: 'Cookware Sets',  mid: 1800, high: 5300 },
  { cat: 'home-furnishing',       name: 'Bedsheets',      mid: 500,  high: 3700 },
  { cat: 'home-decors',           name: 'Lamps & Lighting', mid: 1600, high: 12500 },
  { cat: 'electronics-accessories', name: 'Smart Watches', mid: 1500, high: 5000 },
  { cat: 'toys-games',            name: 'Soft Toys',      mid: 300,  high: 1500 },
  { cat: 'pooja-spiritual',       name: 'Diyas',          mid: 400,  high: 1000 },
];
const HOW_IT_WORKS = [
  { t: 'Choose what you want', d: 'Pick a category or tell us exactly what to look for.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
  { t: 'Tell us what to buy', d: 'Add products, a price range and any reference photos.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
  { t: 'Choose a shopping slot', d: 'Pick a time window that works for you.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>' },
  { t: 'We buy it in India', d: 'A real person sources and verifies it with you.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M6 8h12l-1 12H7L6 8z"/></svg>' },
  { t: 'We deliver it to you', d: 'Shipped and tracked, wherever you are now.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="14" height="10" rx="1.5"/><path d="M16 10h3l3 3v4h-6z"/><circle cx="7" cy="19" r="1.6"/><circle cx="18" cy="19" r="1.6"/></svg>' },
];

function toggleMobileSearch() {
  document.getElementById('mobileSearch').classList.toggle('open');
  const input = document.getElementById('searchInputMobile');
  const open = document.getElementById('mobileSearch').classList.contains('open');
  const sb = document.getElementById('topSearchBtn'); if (sb) sb.classList.toggle('active', open);
  if (open) input.focus();
}
function runSearch(query) {
  query = (query || '').trim();
  if (!query) return;
  showScreen('categories');
  document.getElementById('searchInputCatDesktop').value = query;
  filterCategoryGrid(query);
  toast(`Showing categories matching "${query}"`);
}
function filterCategoryGrid(query) {
  const q = (query || '').toLowerCase();
  document.querySelectorAll('#catPageGrid .cat-tile').forEach(tile => {
    const name = tile.dataset.name || '';
    tile.style.display = name.includes(q) ? '' : 'none';
  });
}

function quickAddPopular(idx) {
  const it = POPULAR_ITEMS[idx];
  if (!it) return;
  openProductDetail(it.cat, it.name, it.mid, it.high);
}

/* ================================================================
   CATEGORY TILE IMAGES — swap these to change the pictures shown
   on the category cards (currently random stock photos).
   See the guide at the bottom of this file for how to change them.
   ================================================================ */
const CATEGORY_IMAGES = {
  groceries:   'https://picsum.photos/seed/visasra-cat-groceries/500/380',
  electronics: 'https://picsum.photos/seed/visasra-cat-electronics/500/380',
  fashion:     'https://picsum.photos/seed/visasra-cat-fashion/500/380',
  home:        'https://picsum.photos/seed/visasra-cat-home/500/380',
  health:      'https://picsum.photos/seed/visasra-cat-health/500/380',
  gifts:       'https://picsum.photos/seed/visasra-cat-gifts/500/380',
  documents:   'https://picsum.photos/seed/visasra-cat-documents/500/380',
  other:       'https://picsum.photos/seed/visasra-cat-other/500/380',
  // Categories-page catalog (see PRODUCT_CATALOG / MAIN_CATEGORIES below).
  // Swap these three for your own downloaded pictures the same way as above:
  // e.g. 'cookware': 'images/cookware.jpg'
  cookware:         'images/categories/cookware.jpg',
  'home-decors':    'images/categories/home-decors.jpg',
  'home-furnishing':'images/categories/home-furnishing.jpg',
  'electronics-accessories': 'images/categories/electronics-accessories.jpg',
  'toys-games':              'images/categories/toys-games.jpg',
  'jewellery-accessories':   'images/categories/jewellery-accessories.jpg',
  'pooja-spiritual':         'images/categories/pooja-spiritual.jpg',
  'bags-wallets':            'images/categories/bags-wallets.jpg',
  'womens-fashion':          'images/categories/womens-fashion.jpg',
  'mens-fashion':            'images/categories/mens-fashion.jpg',
};
function catImageSeed(key) { return CATEGORY_IMAGES[key] || CATEGORY_IMAGES.other; }

/* Where each picture is cropped from when a tile or banner is a different
   shape than the photo ("x% y%": 50% 50% = centre). Tweak these if a crop
   cuts off the important part of a photo. */
const CATEGORY_FOCUS = {
  cookware:                 '50% 48%',
  'home-decors':            '50% 76%',
  'jewellery-accessories':  '50% 50%',
  'pooja-spiritual':        '28% 62%',
  'womens-fashion':         '50% 68%',
  'home-furnishing':        '50% 60%',
  'electronics-accessories':'50% 55%',
  'toys-games':             '55% 55%',
  'bags-wallets':           '35% 55%',
  'mens-fashion':           '70% 52%',
};
function catFocus(key) { return CATEGORY_FOCUS[key] || '50% 50%'; }

/* ================================================================
   CATEGORIES PAGE — product catalog (from AURUMS_EXCEL_.xlsx)
   Each section below is one purple-header block from the sheet.
   "mid" / "high" are the Mid Range / High Range columns and become
   the pre-filled price range when a product is tapped.
   ================================================================ */
const PRODUCT_CATALOG = [
  {
    key: 'cookware', name: 'Cookware',
    products: [
      { name: 'Cooker', mid: 1500, high: 4590, types: [
        { name: 'Electric Pressure Cooker' },
        { name: 'Idli Steamer' },
        { name: 'Steel Idli Steamer' },
        { name: 'Aluminium Idli Steamer' },
        { name: '2 Litre Cooker' },
        { name: '3 Litre Cooker' },
        { name: 'Dual Lid Cooker' },
        { name: 'Rice Cooker' },
      ] },
      { name: 'Pots', mid: 1500, high: 6000, types: [
        { name: 'Bowls Set' },
        { name: 'Handi Set' },
        { name: 'Copper Bottom Handi Set' },
        { name: 'Milk Pots Combo' },
        { name: 'Cast Iron Pot' },
      ] },
      { name: 'Pans', mid: 900, high: 3300, types: [
        { name: 'Appam Pan' },
        { name: 'Cast Iron Appam Pan' },
        { name: 'Cast Iron Tadka Pan' },
        { name: 'Cast Iron Wok Pan' },
        { name: 'Deep Fry Pan' },
        { name: 'Frying Pan' },
        { name: 'Grill Pan' },
        { name: 'Sauce Pan' },
        { name: 'Steel Deep Fry Pan' },
        { name: 'Steel Fry Pan' },
        { name: 'Tadka Pan' },
      ] },
      { name: 'Tawas', mid: 1400, high: 5000, types: [
        { name: 'Non-Stick Tawa' },
        { name: 'Aluminium Tawa' },
        { name: 'Dosa Tawa' },
        { name: 'Roti Tawa' },
      ] },
      { name: 'Kadai', mid: 1200, high: 4000, types: [
        { name: 'Iron Kadai' },
        { name: 'Non-Stick Kadai' },
        { name: 'Stainless Steel Kadai' },
      ] },
      { name: 'Woks', mid: 1800, high: 3500 },
      { name: 'Handi', mid: 1800, high: 3300 },
      { name: 'Dutch Ovens', mid: 1700, high: 8500 },
      { name: 'Cookware Sets', mid: 1800, high: 5300 },
      { name: 'Spoons', mid: 300, high: 1500 },
      { name: 'Forks', mid: 600, high: 1600 },
      { name: 'Knives', mid: 400, high: 1000, types: [
        { name: 'Knife Set' },
        { name: 'Knives' },
      ] },
      { name: 'Spatula', mid: 450, high: 900, types: [
        { name: 'Silicone Spatula' },
        { name: 'Silicone Utensil Set' },
        { name: 'Spatula Set' },
        { name: 'Wooden Spatula Set' },
        { name: 'Whisk' },
      ] },
      { name: 'Plates', mid: 700, high: 1200, types: [
        { name: 'Steel Plates' },
        { name: 'Dinner Plates' },
        { name: 'Partition Plate' },
        { name: 'Hammered Plate' },
      ] },
      { name: 'Bowls', mid: 1000, high: 1600, types: [
        { name: 'Ceramic Bowl' },
        { name: 'Serving Bowls' },
        { name: 'Steel Bowls' },
      ] },
      { name: 'Dinner Sets', mid: 1600, high: 6000, types: [
        { name: 'Ceramic Dinner Set' },
        { name: 'Steel Thali Set' },
      ] },
      { name: 'Serving Sets', mid: 900, high: 3000 },
      { name: 'Trays', mid: 600, high: 1800, types: [
        { name: 'Trays' },
        { name: 'Wooden Trays' },
        { name: 'Steel Trays' },
      ] },
      { name: 'Cutlery Sets', mid: 1800, high: 4800 },
      { name: 'Glasses', mid: 1200, high: 3000, types: [
        { name: 'Brass Glasses' },
        { name: 'Copper Glasses' },
        { name: 'Steel Water Glass' },
        { name: 'Glassware Water Glasses' },
      ] },
      { name: 'Cups & Mugs', mid: 1100, high: 3000, types: [
        { name: 'Ceramic Tea Cups' },
        { name: 'Handcrafted Mugs' },
        { name: 'Steel Tea Cups' },
        { name: 'Mugs' },
        { name: 'Glassware Tea Cups' },
      ] },
    ],
  },
  {
    key: 'home-decors', name: 'Home Decors',
    products: [
      { name: 'Home Decor', mid: 1300, high: 6000 },
      { name: 'Wall Decor', mid: 1400, high: 5000 },
      { name: 'Lamps & Lighting', mid: 1600, high: 12500 },
      { name: 'Candles & Diyas', mid: 800, high: 2000 },
      { name: 'Clocks', mid: 1000, high: 4000 },
      { name: 'Cushions & Covers', mid: 800, high: 2500 },
      { name: 'Curtains', mid: 900, high: 2000 },
      { name: 'Rugs & Carpets', mid: 2000, high: 12000 },
      { name: 'Storage & Organizers', mid: 1000, high: 3000, types: [
        { name: 'Drying Stand' },
        { name: 'Pot Rack' },
        { name: 'Shoe Rack' },
        { name: 'Steel Rack' },
        { name: 'Storage Unit' },
      ] },
      { name: 'Artificial Flowers', mid: 600, high: 2500 },
      { name: 'Decorative Items', mid: 900, high: 4200 },
    ],
  },
  {
    key: 'home-furnishing', name: 'Home Furnishing',
    products: [
      { name: 'Bedsheets', mid: 500, high: 3700 },
      { name: 'Blankets', mid: 950, high: 5500 },
      { name: 'Comforters', mid: 1100, high: 7000 },
      { name: 'Pillows', mid: 750, high: 3500 },
      { name: 'Pillow Covers', mid: 350, high: 600 },
      { name: 'Mattress Protectors', mid: 800, high: 3500 },
      { name: 'Towels', mid: 500, high: 1600 },
      { name: 'Bath Mats', mid: 1600, high: 4500 },
      { name: 'Table Covers', mid: 1600, high: 4100 },
      { name: 'Kitchen Towel', mid: 800, high: 1700 },
    ],
  },
  {
    key: "electronics-accessories", name: "Electronics & Accessories",
    products: [
      { name: "Mobile Accessories", mid: 100, high: 1000 },
      { name: "Chargers", mid: 500, high: 2000 },
      { name: "Cables", mid: 150, high: 600 },
      { name: "Earphones", mid: 1000, high: 2000 },
      { name: "Headphones", mid: 1000, high: 3000 },
      { name: "Smart Watches", mid: 1500, high: 5000 },
      { name: "Speakers", mid: 1500, high: 10000 },
      { name: "Power Banks", mid: 1000, high: 3000 },
      { name: "Small Appliances", mid: 499, high: 3000 },
    ],
  },
  {
    key: "toys-games", name: "Toys & Games",
    products: [
      { name: "Educational Toys", mid: 250, high: 1000 },
      { name: "Remote Control Toys", mid: 500, high: 2000 },
      { name: "Dolls & Doll Sets", mid: 500, high: 2000 },
      { name: "Cars & Vehicles", mid: 500, high: 8000 },
      { name: "Board Games", mid: 300, high: 1000 },
      { name: "Puzzles", mid: 250, high: 500 },
      { name: "Building Blocks", mid: 300, high: 700 },
      { name: "Soft Toys", mid: 300, high: 1500 },
      { name: "Outdoor Games", mid: 700, high: 3000 },
      { name: "Musical Toys", mid: 300, high: 700 },
      { name: "Baby Toys", mid: 250, high: 700 },
    ],
  },
  {
    key: "jewellery-accessories", name: "Jewellery & Accessories",
    products: [
      { name: "Oxidized Jewellery", mid: 150, high: 1000 },
      { name: "Earrings", mid: 100, high: 800 },
      { name: "Necklaces", mid: 400, high: 1200 },
      { name: "Chains", mid: 150, high: 600 },
      { name: "Bracelets", mid: 150, high: 800 },
      { name: "Bangles", mid: 250, high: 800 },
      { name: "Rings", mid: 150, high: 500 },
      { name: "Anklets", mid: 300, high: 1000 },
      { name: "Maang Tikka", mid: 250, high: 1500 },
      { name: "Nose Pins", mid: 350, high: 800 },
      { name: "Jewellery Sets", mid: 1500, high: 5000 },
    ],
  },
  {
    key: "pooja-spiritual", name: "Pooja & Spiritual",
    products: [
      { name: "Pooja Sets", mid: 800, high: 2000 },
      { name: "Diyas", mid: 400, high: 1000, types: [
        { name: "Peacock Standing Diya" },
        { name: "Branch Standing Diya" },
        { name: "Classic Standing Diya" },
        { name: "Silver Diya" },
        { name: "Copper Diya" },
        { name: "Brass Diya" },
      ] },
      { name: "Incense Sticks", mid: 200, high: 500, types: [
        { name: "Dhoop Sticks" },
        { name: "Incense Holder" },
      ] },
      { name: "Camphor", mid: 200, high: 600 },
      { name: "Pooja Utensils", mid: 500, high: 3000 },
      { name: "Brass Idols", mid: 1000, high: 3500 },
      { name: "Decorative Torans", mid: 300, high: 600 },
      { name: "Rangoli Items", mid: 300, high: 600 },
    ],
  },
  {
    key: "bags-wallets", name: "Bags & Wallets",
    products: [
      { name: "Handbags", mid: 800, high: 5000 },
      { name: "Sling Bags", mid: 600, high: 2000 },
      { name: "Tote Bags", mid: 800, high: 5000 },
      { name: "Backpacks", mid: 1000, high: 2500 },
      { name: "Clutches", mid: 500, high: 1000 },
      { name: "Wallets", mid: 500, high: 1000 },
      { name: "Card Holders", mid: 350, high: 700 },
      { name: "Laptop Bags", mid: 1000, high: 2000 },
      { name: "Travel Bags", mid: 800, high: 1500 },
      { name: "Duffle Bags", mid: 1000, high: 1500 },
      { name: "Crossbody Bags", mid: 500, high: 1000 },
    ],
  },
  {
    key: "womens-fashion", name: "Women's Fashion",
    products: [
      { name: "Tops", mid: 400, high: 1500 },
      { name: "Ethnic Wear", mid: 800, high: 5000 },
      { name: "Bottom Wear", mid: 600, high: 1500 },
      { name: "Blouses", mid: 500, high: 3000 },
      { name: "Nightwear", mid: 1000, high: 2000 },
      { name: "Women's Watches", mid: 500, high: 5000 },
      { name: "Women's Footwear", mid: 500, high: 3000 },
    ],
  },
  {
    key: "mens-fashion", name: "Men's Fashion",
    products: [
      { name: "Shirts", mid: 1000, high: 3000 },
      { name: "T-Shirts", mid: 500, high: 1500 },
      { name: "Trousers", mid: 1000, high: 2000 },
      { name: "Ethnic Wear", mid: 800, high: 5000 },
      { name: "Jackets", mid: 1000, high: 2500 },
      { name: "Sweatshirts", mid: 700, high: 2500 },
      { name: "Shorts", mid: 700, high: 1500 },
      { name: "Men's Footwear", mid: 800, high: 2000 },
      { name: "Men's Watches", mid: 1000, high: 5000 },
    ],
  },
];

/* Tapping a product: add it to the draft with its sheet price range
   already filled in, then land on "Start a booking" (the addItems
   review stage) so the person sees what they picked, can add more or
   remove it, before moving on to a slot. imgCat/imgName/imgType (set
   when this came from a catalog tap, not a manual/online item) let
   itemThumb() find the same photo shown on the category/type grid,
   so it carries through to the slot screen, review, orders and the
   confirmation screen too. */
function bookProduct(categoryKey, productName, mid, high, imgType) {
  if (!state.draft) {
    state.draft = { id: uid(), items: [], onlineItems: [], slotId: null, slotDate: null, slotTime: null, instructions: '', category: categoryKey };
  } else if (!state.draft.category) {
    state.draft.category = categoryKey;
  }
  const itemName = imgType ? `${productName} – ${imgType}` : productName;
  const existing = state.draft.items.find(it => it.imgCat === categoryKey && it.imgName === productName && (it.imgType || null) === (imgType || null));
  if (existing) existing.qty = Math.min(25, (existing.qty || 1) + 1);
  else state.draft.items.push({
    id: uid(), name: itemName,
    priceMin: mid, priceMax: high,
    image: '', desc: '', qty: 1,
    imgCat: categoryKey, imgName: productName, imgType: imgType || null,
  });
  saveState();
  renderCartBadge();
  showAddedCard(itemName);   // stay on this page — just confirm it went into the cart
}
function showAddedCard(name) {
  const card = document.getElementById('addedCard');
  if (!card) return toast(`Added "${name}" to cart`);
  document.getElementById('acName').textContent = name;
  card.classList.add('show');
  clearTimeout(window.__addedTimer);
  window.__addedTimer = setTimeout(hideAddedCard, 2800);
}
function hideAddedCard() {
  const card = document.getElementById('addedCard');
  if (card) card.classList.remove('show');
}

/* ================================================================
   PRODUCT PAGE — tapping a product (or a type of product) opens this
   page: photo, price range, the customer's own photos, a specifications
   box and a quantity stepper, then "Add to Cart".
   ================================================================ */
let pd = null;
function openProductDetail(cat, name, mid, high, type) {
  pd = { cat, name, type: type || null, mid, high, images: [] };
  const catInfo = MAIN_CATEGORIES.find(c => c.key === cat);
  const src = type ? typeImageSrc(cat, name, type, 0) : productImageSrc(cat, name, 0);
  document.getElementById('pdPhoto').innerHTML = src
    ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(name)}" data-cat="${escapeAttr(cat)}" data-pname="${escapeAttr(name)}"${type ? ` data-tname="${escapeAttr(type)}"` : ''} data-ext="0" onerror="itemThumbImgError(this)">`
    : IMG_FALLBACK;
  document.getElementById('pdCat').textContent = catInfo ? catInfo.name : '';
  document.getElementById('pdTitle').textContent = type ? `${name} – ${type}` : name;
  document.getElementById('pdPrice').textContent = `${money(mid)} – ${money(high)}`;
  document.getElementById('pdSpec').value = '';
  document.getElementById('pdQty').textContent = '1';
  document.getElementById('pdFile').value = '';
  renderPdThumbs();
  showScreen('productDetail');
}
/* Photos are shrunk before saving so a few uploads never fill the browser's storage. */
function compressImage(file, maxSide) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
async function handlePdUpload(input) {
  if (!pd) return;
  const files = Array.from(input.files || []).filter(f => f.type.startsWith('image/'));
  if (!files.length) { if (input.files && input.files.length) toast('Please choose an image file'); return; }
  const room = 5 - pd.images.length;
  if (room <= 0) { toast('You can add up to 5 photos'); input.value = ''; return; }
  if (files.length > room) toast('Only the first ' + room + ' photo' + (room === 1 ? '' : 's') + ' were added (max 5)');
  for (const f of files.slice(0, room)) {
    try { pd.images.push(await compressImage(f, 900)); } catch (e) { toast('Could not read that image'); }
  }
  input.value = '';
  renderPdThumbs();
}
function removePdImage(i) { if (pd) { pd.images.splice(i, 1); renderPdThumbs(); } }
function renderPdThumbs() {
  const el = document.getElementById('pdThumbs');
  el.innerHTML = (pd ? pd.images : []).map((src, i) => `
    <div class="pd-thumb"><img src="${src}" alt="Your photo ${i + 1}">
      <button type="button" class="img-remove" onclick="removePdImage(${i})" aria-label="Remove photo">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button></div>`).join('');
}
function addFromProductPage() {
  if (!pd) return;
  const spec = document.getElementById('pdSpec').value.trim();
  const qty = parseInt(document.getElementById('pdQty').textContent, 10) || 1;
  if (!state.draft) {
    state.draft = { id: uid(), items: [], onlineItems: [], slotId: null, slotDate: null, slotTime: null, instructions: '', category: pd.cat };
  } else if (!state.draft.category) {
    state.draft.category = pd.cat;
  }
  const itemName = pd.type ? `${pd.name} – ${pd.type}` : pd.name;
  const plain = !spec && !pd.images.length;
  const sameProd = state.draft.items.filter(it => it.imgCat === pd.cat && it.imgName === pd.name && (it.imgType || null) === pd.type);
  const isPlainLine = it => !it.desc && !(it.images && it.images.length) && !it.image;
  const plainLine = sameProd.find(isPlainLine);
  const photos = it => ((it.images && it.images.length) ? it.images : (it.image ? [it.image] : []));
  const mergeImgs = (a, b) => a.concat(b.filter(x => !a.includes(x))).slice(0, 5);
  let same = null;
  if (plain) same = plainLine || (sameProd.length === 1 ? sameProd[0] : null);        // another unit of what is already in the cart
  else if (plainLine) {                                                                // earlier plain add + now photos/notes = ONE product with details
    plainLine.desc = spec; plainLine.images = pd.images.slice(); plainLine.image = pd.images[0] || '';
    plainLine.qty = Math.min(25, Math.max(plainLine.qty || 1, qty));
    same = plainLine; same.__detailsAdded = true;
  } else same = sameProd.find(it => (it.desc || '').toLowerCase() === spec.toLowerCase() && (!photos(it).length || !pd.images.length || photos(it).some(x => pd.images.includes(x))));
  if (same && same.__detailsAdded) delete same.__detailsAdded;
  else if (same) {
    same.qty = Math.min(25, (same.qty || 1) + qty);
    if (pd.images.length) { same.images = mergeImgs(photos(same), pd.images); same.image = same.images[0]; }
  }
  if (!same) state.draft.items.push({
    id: uid(), name: itemName, priceMin: pd.mid, priceMax: pd.high,
    image: pd.images[0] || '', images: pd.images.slice(), desc: spec, qty,
    imgCat: pd.cat, imgName: pd.name, imgType: pd.type,
  });
  saveState();
  renderCartBadge();
  showAddedCard(qty > 1 ? `${itemName} × ${qty}` : itemName);
  // ready for the next variant
  pd.images = [];
  document.getElementById('pdSpec').value = '';
  document.getElementById('pdQty').textContent = '1';
  renderPdThumbs();
}

/* Same as bookProduct, but for a type tapped inside a product's type
   grid (e.g. Cookware > Pans > Frying Pan). Stores "Pans – Frying Pan"
   as the item name so it reads clearly in the cart and order history. */
function bookProductType(categoryKey, productName, typeName, mid, high) {
  openProductDetail(categoryKey, productName, mid, high, typeName);
}

/* ================================================================
   MAIN CATEGORIES (Categories page) — one image tile per purple
   section in the sheet. Tapping a tile opens the category-detail
   screen with all its products. Swap CATEGORY_IMAGES[key] above to
   change the picture on each tile.
   ================================================================ */
const MAIN_CATEGORIES = [
  { key: 'cookware', name: 'Cookware', accent: '#C1622D',
    desc: 'Pots, pans, cutlery & everyday kitchen sets',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-3z"/><path d="M2 10h3M19 10h3"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg>` },
  { key: 'home-decors', name: 'Home Decors', accent: '#7C3AED',
    desc: 'Lighting, wall art, rugs & decorative pieces',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.6l-5.6 3 1.4-6.3-4.8-4.3 6.4-.6z"/></svg>` },
  { key: 'home-furnishing', name: 'Home Furnishing', accent: '#0E8074',
    desc: 'Bedsheets, towels, blankets & everyday linen',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M3 13.2h18"/><path d="M6 9V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>` },
  { key: "electronics-accessories", name: "Electronics & Accessories", accent: "#2563EB",
    desc: "Chargers, earphones, smart watches & gadgets",
    icon: `<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"7\" y=\"2.5\" width=\"10\" height=\"19\" rx=\"2.2\"/><path d=\"M11 18.5h2\"/></svg>` },
  { key: "toys-games", name: "Toys & Games", accent: "#16A34A",
    desc: "Puzzles, dolls, board games & toys for every age",
    icon: `<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2.5l8.5 4.7v9.6L12 21.5l-8.5-4.7V7.2z\"/><path d=\"M12 12L3.5 7.2M12 12l8.5-4.8M12 12v9.5\"/></svg>` },
  { key: "jewellery-accessories", name: "Jewellery & Accessories", accent: "#B8860B",
    desc: "Earrings, necklaces, bangles & full sets",
    icon: `<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6.5 3.5h11l4 5.5L12 21 2.5 9z\"/><path d=\"M2.5 9h19M8.5 3.5L12 9l3.5-5.5M12 21L8.5 9M12 21l3.5-12\"/></svg>` },
  { key: "pooja-spiritual", name: "Pooja & Spiritual", accent: "#E11D48",
    desc: "Pooja sets, diyas, idols & festive essentials",
    icon: `<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2.5c.8 3.6 5 5.6 5 10.5a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2 0 2 .9 3 2 3 .8-3.6-.4-6 1-9.3z\"/></svg>` },
  { key: "bags-wallets", name: "Bags & Wallets", accent: "#7B4B2A",
    desc: "Handbags, backpacks, wallets & travel bags",
    icon: `<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 8h14l1.5 12.5h-17z\"/><path d=\"M9 8V6.5a3 3 0 0 1 6 0V8\"/></svg>` },
  { key: "womens-fashion", name: "Women's Fashion", accent: "#DB2777",
    desc: "Ethnic wear, tops, footwear & watches",
    icon: `<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 7.5a2.2 2.2 0 1 0-2.2-2.2\"/><path d=\"M12 7.5v2L3.3 16a1.2 1.2 0 0 0 .7 2.2h16a1.2 1.2 0 0 0 .7-2.2z\"/></svg>` },
  { key: "mens-fashion", name: "Men's Fashion", accent: "#334155",
    desc: "Shirts, trousers, ethnic wear & footwear",
    icon: `<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 3L3 6l2.5 4L8 9v12h8V9l2.5 1L21 6l-5-3a4 4 0 0 1-8 0z\"/></svg>` },
];
function categoryProductCount(key) {
  const c = PRODUCT_CATALOG.find(c => c.key === key);
  return c ? c.products.length : 0;
}
function categoryTileHtml(cat) {
  const cData = PRODUCT_CATALOG.find(c => c.key === cat.key);
  const searchText = escapeAttr((cat.name + ' ' + (cData ? cData.products.map(p => p.name).join(' ') : '')).toLowerCase());
  return `<div class="cat-tile" data-name="${searchText}" style="background-image:url('${catImageSeed(cat.key)}'); background-position:${catFocus(cat.key)}" onclick="openCategoryDetail('${cat.key}')">
    <div class="cat-tile-count">${categoryProductCount(cat.key)} products</div>
    <div class="cat-tile-body">
      <div class="cat-icon-wrap">${cat.icon}</div>
      <div class="name">${cat.name}</div>
      <div class="desc">${cat.desc}</div>
    </div>
  </div>`;
}

/* ---------------- Category detail screen ---------------- */
let activeCatDetailKey = null;
function openCategoryDetail(key) {
  activeCatDetailKey = key;
  showScreen('categoryDetail');
}
function filterCategoryDetail(query) {
  const q = (query || '').trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll('#cdProductList .cd-prod-card').forEach(card => {
    const match = (card.dataset.name || '').includes(q);
    card.style.display = match ? '' : 'none';
    if (match) shown++;
  });
  const empty = document.getElementById('cdEmpty');
  if (empty) empty.style.display = shown ? 'none' : 'block';
}

/* ================================================================
   PRODUCT PICTURES — one folder per category inside images/products/,
   each photo named after the product (lowercase, dashes, no apostrophes):
     Cookware · Dutch Ovens      -> images/products/cookware/dutch-ovens.jpg
     Home Decors · Wall Decor    -> images/products/home-decors/wall-decor.jpg
     Women's Fashion · Tops      -> images/products/womens-fashion/tops.jpg
     Men's Fashion · Tops etc.   -> images/products/mens-fashion/...
   (Folders keep same-named products apart, e.g. Ethnic Wear in both
   Women's and Men's Fashion.)
   .jpg, .jpeg, .png and .webp all work. Any product without a photo
   shows a coloured placeholder tile until you add one.
   To use a different file name for a product, add it here, e.g.
     'cookware/Dutch Ovens': 'images/products/cookware/my-oven-photo.jpg'
   ================================================================ */
const PRODUCT_IMAGES = {};
const PRODUCT_IMAGE_DIR = 'images/products/';
const PRODUCT_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
function productSlug(name) {
  return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function productImageSrc(catKey, name, extIndex) {
  const override = PRODUCT_IMAGES[`${catKey}/${name}`];
  if (override) return extIndex === 0 ? override : null;
  const ext = PRODUCT_IMAGE_EXTS[extIndex];
  return ext ? `${PRODUCT_IMAGE_DIR}${catKey}/${productSlug(name)}.${ext}` : null;
}
/* Same idea, one folder deeper, for a product's types, e.g.
   images/products/cookware/pans/frying-pan.jpg */
function typeImageSrc(catKey, productName, typeName, extIndex) {
  const override = PRODUCT_IMAGES[`${catKey}/${productName}/${typeName}`];
  if (override) return extIndex === 0 ? override : null;
  const ext = PRODUCT_IMAGE_EXTS[extIndex];
  return ext ? `${PRODUCT_IMAGE_DIR}${catKey}/${productSlug(productName)}/${productSlug(typeName)}.${ext}` : null;
}
/* Tries the next file extension; when none exist, swaps in the placeholder. */
function productImgError(img) {
  const next = (parseInt(img.dataset.ext, 10) || 0) + 1;
  const src = img.dataset.tname
    ? typeImageSrc(img.dataset.cat, img.dataset.pname, img.dataset.tname, next)
    : productImageSrc(img.dataset.cat, img.dataset.pname, next);
  if (src) { img.dataset.ext = next; img.src = src; return; }
  img.parentElement.classList.add('no-photo');
  img.remove();
}
function renderCategoryDetail() {
  if (!activeCatDetailKey) return;
  const cat = MAIN_CATEGORIES.find(c => c.key === activeCatDetailKey);
  const catalog = PRODUCT_CATALOG.find(c => c.key === activeCatDetailKey);
  if (!cat || !catalog) return;

  const hero = document.getElementById('cdHero');
  if (hero) { hero.style.backgroundImage = `url('${catImageSeed(cat.key)}')`; hero.style.backgroundPosition = catFocus(cat.key); }
  document.getElementById('cdTitle').textContent = cat.name;
  document.getElementById('cdDesc').textContent = cat.desc;
  document.getElementById('cdCount').textContent = `${catalog.products.length} products`;

  const searchInput = document.getElementById('cdSearchInput');
  if (searchInput) searchInput.value = '';

  const tint = hexToRgba(cat.accent, 0.12);
  const list = document.getElementById('cdProductList');
  list.innerHTML = catalog.products.map(p => {
    const name = escapeAttr(p.name);
    const jsName = name.replace(/'/g, "\\'");
    const hasTypes = p.types && p.types.length > 0;
    const onclick = hasTypes
      ? `openTypeDetail('${cat.key}','${jsName}')`
      : `openProductDetail('${cat.key}','${jsName}',${p.mid},${p.high})`;
    return `
    <div class="cd-prod-card" data-name="${escapeAttr(p.name.toLowerCase())}" tabindex="0" role="button"
         onclick="${onclick}"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">
      <div class="cd-prod-photo" style="--tint:${tint}; color:${cat.accent}">
        <img src="${productImageSrc(cat.key, p.name, 0)}" alt="${name}" loading="lazy" data-cat="${cat.key}" data-pname="${name}" data-ext="0" onerror="productImgError(this)">
        <div class="cd-prod-fallback">${cat.icon}</div>
        ${hasTypes ? `<div class="cd-prod-types-badge">${p.types.length} types</div>` : ''}
      </div>
      <div class="cd-prod-name">${escapeHtml(p.name)}</div>
      <div class="cd-prod-range">${money(p.mid)} – ${money(p.high)}</div>
    </div>`;
  }).join('') ;
  const empty = document.getElementById('cdEmpty');
  if (empty) empty.style.display = 'none';
}

/* ---------------- Product type screen (e.g. Cookware > Pans) ---------------- */
let activeTypeProductName = null;
function openTypeDetail(catKey, productName) {
  activeCatDetailKey = catKey;
  activeTypeProductName = productName;
  showScreen('typeDetail');
}
function filterTypeDetail(query) {
  const q = (query || '').trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll('#tdTypeList .cd-prod-card').forEach(card => {
    const match = (card.dataset.name || '').includes(q);
    card.style.display = match ? '' : 'none';
    if (match) shown++;
  });
  const empty = document.getElementById('tdEmpty');
  if (empty) empty.style.display = shown ? 'none' : 'block';
}
function renderTypeDetail() {
  if (!activeCatDetailKey || !activeTypeProductName) return;
  const cat = MAIN_CATEGORIES.find(c => c.key === activeCatDetailKey);
  const catalog = PRODUCT_CATALOG.find(c => c.key === activeCatDetailKey);
  const product = catalog && catalog.products.find(p => p.name === activeTypeProductName);
  if (!cat || !product || !product.types) return;

  const hero = document.getElementById('tdHero');
  if (hero) { hero.style.backgroundImage = `url('${catImageSeed(cat.key)}')`; hero.style.backgroundPosition = catFocus(cat.key); }
  document.getElementById('tdTitle').textContent = product.name;
  document.getElementById('tdDesc').textContent = `Pick a type of ${product.name.toLowerCase()}`;
  document.getElementById('tdCount').textContent = `${product.types.length} types`;

  const searchInput = document.getElementById('tdSearchInput');
  if (searchInput) searchInput.value = '';

  const tint = hexToRgba(cat.accent, 0.12);
  const list = document.getElementById('tdTypeList');
  list.innerHTML = product.types.map(t => {
    const name = escapeAttr(t.name);
    const jsProd = escapeAttr(product.name).replace(/'/g, "\\'");
    const jsType = name.replace(/'/g, "\\'");
    const mid = t.mid != null ? t.mid : product.mid;
    const high = t.high != null ? t.high : product.high;
    return `
    <div class="cd-prod-card" data-name="${escapeAttr(t.name.toLowerCase())}" tabindex="0" role="button"
         onclick="bookProductType('${cat.key}','${jsProd}','${jsType}',${mid},${high})"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">
      <div class="cd-prod-photo" style="--tint:${tint}; color:${cat.accent}">
        <img src="${typeImageSrc(cat.key, product.name, t.name, 0)}" alt="${name}" loading="lazy" data-cat="${cat.key}" data-pname="${escapeAttr(product.name)}" data-tname="${name}" data-ext="0" onerror="productImgError(this)">
        <div class="cd-prod-fallback">${cat.icon}</div>
      </div>
      <div class="cd-prod-name">${escapeHtml(t.name)}</div>
      <div class="cd-prod-range">${money(mid)} – ${money(high)}</div>
    </div>`;
  }).join('');
  const empty = document.getElementById('tdEmpty');
  if (empty) empty.style.display = 'none';
}

/* ---------------- Renders: home / categories / orders / cart / profile ---------------- */
function renderWalletChips() {
  const topAmt = document.getElementById('topWalletAmt');
  if (topAmt) topAmt.textContent = money(state.wallet.balance);
  document.getElementById('homeWalletAmt').textContent = money(state.wallet.balance);
  document.getElementById('profileWalletAmt').textContent = money(state.wallet.balance);
  const sideAmt = document.getElementById('sideWalletAmt');
  if (sideAmt) sideAmt.textContent = money(state.wallet.balance);
  const walletScreenAmt = document.getElementById('walletScreenAmt');
  if (walletScreenAmt) walletScreenAmt.textContent = money(state.wallet.balance);
}
function renderCartBadge() {
  const count = state.draft ? (state.draft.items.length + state.draft.onlineItems.length) : 0;
  [['cartBadgeMobile'], ['cartBadgeDesktop'], ['cartBadgeFlowItems'], ['cartBadgeFlowSlot'], ['cartBadgeFlowDelivery'], ['cartBadgeFlowReview']].forEach(([id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = count > 0 ? 'flex' : 'none';
    el.textContent = count;
  });
}
/* One cell per slot: every order booked for the same date + time is merged into
   a single card, so 10 products in one slot show up together in one place. */
function groupOrdersBySlot(orders) {
  const groups = [];
  const byKey = {};
  (orders || []).forEach(o => {
    const key = o.slot.date + '|' + o.slot.time;
    let g = byKey[key];
    if (!g) {
      g = byKey[key] = {
        ids: [], createdLabel: o.createdLabel, slot: o.slot, items: [], onlineItems: [], instructions: [],
        productsTotal: 0, onlineTotal: 0, slotFee: 0, total: 0, status: o.status, category: o.category, address: o.address || null, deliveryNotes: o.deliveryNotes || '',
        refunded: true,
      };
      groups.push(g);
    }
    g.ids.push(o.id);
    if (!o.refunded) g.refunded = false;
    /* Products are NOT merged by name: each keeps its own id, so the worker's session and this list always match. */
    o.items.forEach(it => g.items.push(Object.assign({}, it)));
    g.onlineItems.push(...o.onlineItems);
    if (o.instructions && !g.instructions.includes(o.instructions)) g.instructions.push(o.instructions);
    g.productsTotal += o.productsTotal || 0;
    g.onlineTotal += o.onlineTotal || 0;
    g.slotFee += o.slotFee || 0;
    g.total += o.total || 0;
  });
  return groups;
}
function orderCardHtml(o, openable) {
  const itemCount = o.items.length + o.onlineItems.length;
  const firstThumbItem = o.items[0] || o.onlineItems[0];
  return `
    <div class="booking-card" ${openable ? `onclick="this.classList.toggle('open')"` : ''}>
      <div class="booking-strip"><span style="background:${o.category ? (CATEGORIES.find(c=>c.key===o.category)||MAIN_CATEGORIES.find(c=>c.key===o.category)||{}).accent||'var(--gold)' : 'var(--gold)'}"></span></div>
      <div class="booking-main">
        <div class="booking-top">
          <div class="booking-top-left">
            ${firstThumbItem ? itemThumb(firstThumbItem) : ''}
            <div>
              <div class="booking-id">${o.ids ? o.ids[0] + (o.ids.length > 1 ? ' +' + (o.ids.length - 1) + ' more' : '') : o.id} · ${o.createdLabel}</div>
              <div class="booking-slot">${o.slot.date} · ${o.slot.time}</div>
              <div class="booking-items">${escapeHtml(itemNamesLabel(o.items, o.onlineItems, 3))}</div>
              <div class="booking-meta">${itemCount} product${itemCount === 1 ? '' : 's'} · ${o.slot.type} slot</div>
            </div>
          </div>
          <div class="booking-total">${money(o.total)}</div>
        </div>
        <div class="status-pill">${o.refunded ? 'Refunded' : (typeof liveStatusLabel === 'function' && liveStatusLabel(o.slot)) || o.status}</div>
        ${!o.refunded && typeof liveFooterHtml === 'function' ? liveFooterHtml(o.slot) : ''}
        ${!o.refunded && o.slot && o.slot.id ? `<button type="button" class="track-btn" onclick="event.stopPropagation(); openTracking('${o.slot.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg><span>Track order</span><svg class="tb-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>` : ''}
        <div class="booking-detail">
          <div class="detail-row"><span>Products</span><b>${money(o.productsTotal)}</b></div>
          <div class="detail-row"><span>Online shopping</span><b>${money(o.onlineTotal)}</b></div>
          <div class="detail-row"><span>Slot fee</span><b>${money(o.slotFee)}</b></div>
          ${(Array.isArray(o.instructions) ? o.instructions.join(' · ') : o.instructions) ? `<div class="detail-row"><span>Instructions</span><b style="text-align:right;max-width:60%;white-space:normal;">${escapeHtml(Array.isArray(o.instructions) ? o.instructions.join(' · ') : o.instructions)}</b></div>` : ''}
          ${o.address ? `<div class="detail-row"><span>Deliver to</span><b style="text-align:right;max-width:60%;white-space:normal;">${escapeHtml(o.address.name)}<br><span style="font-weight:600;color:var(--text-dim);">${escapeHtml(addressOneLine(o.address))}</span></b></div>` : ''}
          ${o.deliveryNotes ? `<div class="detail-row"><span>Delivery notes</span><b style="text-align:right;max-width:60%;white-space:normal;">${escapeHtml(o.deliveryNotes)}</b></div>` : ''}
          ${o.ids && o.ids.length > 1 ? `<div class="detail-row"><span>Bookings</span><b>${o.ids.join(', ')}</b></div>` : ''}
          <hr class="divider">
          ${o.items.map(it => `<div class="detail-row-thumb">${itemThumb(it)}<div class="drt-body"><span class="drt-name">${escapeHtml(it.name)} × ${it.qty}${refThumbsHtml(it)}</span></div></div>`).join('')}
          ${o.onlineItems.map(it => `<div class="detail-row-thumb">${itemThumb(it)}<div class="drt-body"><span class="drt-name">Online: <a class="item-link" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">${escapeHtml(it.link.slice(0,34))}${it.link.length>34?'…':''}</a></span></div></div>`).join('')}
        </div>
      </div>
    </div>`;
}
function renderHomeBanner() {
  const el = document.getElementById('homeBanner');
  if (!el) return;
  el.innerHTML = `
    <div class="hero-banner-wrap">
      <img class="hero-banner" src="${HERO_BANNER_SRC}" alt="Charminar, Hyderabad at sunset">
      <div class="hero-banner-copy">
        <div class="hbc-eyebrow">Authentic Indian products</div>
        <h1 class="hbc-title">Bringing India to the World</h1>
        <p class="hbc-sub">Shop from local stores in India with trusted shoppers.</p>
        <button class="hbc-btn" onclick="showScreen('categories')">Shop Now
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
    </div>`;
}
function renderHome() {
  renderHomeBanner();
  const wrap = document.getElementById('homeBookings');
  if (state.orders.length === 0) {
    wrap.innerHTML = emptyState('bookings', 'No bookings yet',
      "Book a slot and tell us what you need — we'll take it from there.",
      `<button class="btn btn-primary" onclick="startBooking()">Book a shopping slot</button>`);
  } else {
    wrap.innerHTML = groupOrdersBySlot(state.orders).slice(0, 2).map(g => orderCardHtml(g, true)).join('');
  }
  const seeAll = document.getElementById('homeBookingsSeeAll');
  if (seeAll) seeAll.style.display = state.orders.length ? '' : 'none';
  renderPopular();
  renderHowItWorks();
}
function catTileHtml(c, withDesc) {
  return `<div class="cat-tile" data-name="${c.name.toLowerCase()}" style="background-image:url('${catImageSeed(c.key)}')" onclick="startBooking('${c.key}')">
    <div class="cat-tile-body">
      <div class="cat-icon-wrap">${c.icon}</div>
      <div class="name">${c.name}</div>
      ${withDesc ? `<div class="desc">${c.desc}</div>` : ''}
    </div>
  </div>`;
}
/* Home page "Shop by category": a few featured categories (picture + name)
   followed by a "See all" tile. Change or reorder the list below to feature
   different categories — the keys are the ones in MAIN_CATEGORIES. */
const HOME_FEATURED_CATEGORIES = [
  'jewellery-accessories', 'womens-fashion', 'pooja-spiritual', 'cookware', 'home-decors',
];
function homeCategoryTileHtml(cat) {
  return `<div class="cat-tile home-cat" style="background-image:url('${catImageSeed(cat.key)}'); background-position:${catFocus(cat.key)}" tabindex="0" role="button"
      onclick="openCategoryDetail('${cat.key}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">
    <div class="cat-tile-body"><div class="name">${cat.name}</div></div>
  </div>`;
}
function homeSeeAllTileHtml() {
  return `<div class="cat-tile home-cat see-all-tile" tabindex="0" role="button"
      onclick="showScreen('categories')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">
    <div class="cat-tile-body">
      <span class="see-all-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      <div class="name">See all categories</div>
      <div class="see-all-sub">${MAIN_CATEGORIES.length} categories</div>
    </div>
  </div>`;
}
function renderCategories() {
  const featured = HOME_FEATURED_CATEGORIES
    .map(k => MAIN_CATEGORIES.find(c => c.key === k)).filter(Boolean);
  document.getElementById('catGrid').innerHTML = featured.map(homeCategoryTileHtml).join('') + homeSeeAllTileHtml();
  document.getElementById('catPageGrid').innerHTML = MAIN_CATEGORIES.map(c => categoryTileHtml(c)).join('');
}
function renderPopular() {
  const el = document.getElementById('popularScroll');
  if (!el) return;
  el.innerHTML = POPULAR_ITEMS.map((it, i) => {
    const cat = MAIN_CATEGORIES.find(c => c.key === it.cat);
    const src = productImageSrc(it.cat, it.name, 0);
    return `
    <div class="product-card" onclick="quickAddPopular(${i})">
      <div class="product-photo">
        <img src="${escapeAttr(src)}" alt="${escapeAttr(it.name)}" loading="lazy" data-cat="${escapeAttr(it.cat)}" data-pname="${escapeAttr(it.name)}" data-ext="0" onerror="productImgError(this)">
      </div>
      <div class="product-body">
        <div class="product-cat">${escapeHtml(cat ? cat.name : '')}</div>
        <div class="product-name">${escapeHtml(it.name)}</div>
        <div class="product-price">${money(it.mid)}–${money(it.high)}</div>
        <button class="product-add" onclick="event.stopPropagation(); quickAddPopular(${i})">Add to my order</button>
      </div>
    </div>`;
  }).join('');
}
function renderHowItWorks() {
  const el = document.getElementById('howItWorks');
  if (!el) return;
  el.innerHTML = HOW_IT_WORKS.map((s, i) => `
    <div class="hw-step">
      <div class="hw-node"><span class="hw-circle">${s.icon}</span><span class="hw-count">${i + 1}</span></div>
      <div class="hw-copy"><div class="t">${s.t}</div><div class="d">${s.d}</div></div>
    </div>`).join('');
}
function renderOrders() {
  const wrap = document.getElementById('ordersList');
  if (state.orders.length === 0) {
    wrap.innerHTML = emptyState('orders', 'No orders yet',
      'Once you book a slot, your orders and their status will show up here.',
      `<button class="btn btn-primary" onclick="startBooking()">Book a shopping slot</button>`);
  } else {
    wrap.innerHTML = groupOrdersBySlot(state.orders).map(g => orderCardHtml(g, true)).join('');
  }
}
function cartItemRow(it, removeFn, isOnline) {
  const name = isOnline ? 'Online item' : it.name;
  const priceLabel = isOnline
    ? (it.price ? money(it.price) + ' est. × ' + it.qty : 'Price to confirm')
    : money(it.priceMax) + ' each × ' + it.qty;
  return `
    <div class="cart-item">
      ${itemThumb(it)}
      <div class="item-body">
        <div class="item-name">${escapeHtml(name)}</div>
        ${isOnline ? `<a class="item-link" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">${escapeHtml(it.link.slice(0,40))}${it.link.length>40?'…':''}</a>` : ''}
        <div class="item-sub">${priceLabel}</div>
        ${isOnline ? '' : refThumbsHtml(it)}
        ${(!isOnline && (it.desc || (it.images && it.images.length))) ? `<div class="item-desc">${it.desc ? escapeHtml(it.desc.length > 90 ? it.desc.slice(0, 90) + '…' : it.desc) : ''}${it.images && it.images.length ? `${it.desc ? ' · ' : ''}${it.images.length} photo${it.images.length === 1 ? '' : 's'} attached` : ''}</div>` : ''}
        <div class="item-actions">
          ${qtyStepperHtml(it, isOnline)}
          <button class="icon-btn" onclick="${removeFn}('${it.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}
function renderCart() {
  const wrap = document.getElementById('cartBody');
  if (!wrap) return;
  if (!state.draft) {
    wrap.innerHTML = emptyState('cart', 'Nothing in progress',
      "Start a booking and we'll keep it here until you confirm it.",
      `<button class="btn btn-primary" onclick="startBooking()">Start a booking</button>`);
    renderCartBadge();
    return;
  }
  const d = state.draft;
  const t = computeTotals(d);
  const slotLabel = t.slot ? `${t.slot.date} · ${t.slot.time}` : 'Not chosen yet';
  const itemsHtml = [
    ...d.items.map(it => cartItemRow(it, 'removeProduct', false)),
    ...d.onlineItems.map(it => cartItemRow(it, 'removeOnlineItem', true)),
  ].join('') || `<div class="empty-state" style="padding:24px 16px;"><div class="empty-copy">No items added yet.</div></div>`;

  const summaryHtml = `
    <div class="cart-summary">
      <div class="review-row"><span class="label">Slot</span><span class="val">${slotLabel}</span></div>
      <hr class="divider">
      <div class="price-row"><span>Products (est.)</span><span class="v">${money(t.productsTotal)}</span></div>
      <div class="price-row"><span>Online shopping (est.)</span><span class="v">${money(t.onlineTotal)}</span></div>
      <div class="price-row"><span>Slot fee</span><span class="v">${money(t.slotFee)}</span></div>
      <div class="price-row total"><span>Estimated total</span><span class="v">${money(t.grandTotal)}</span></div>
      <div class="review-row" style="margin-top:6px;"><span class="label">Visasra Money balance</span><span class="val">${money(state.wallet.balance)}</span></div>
      <div style="display:flex; gap:10px; margin-top:14px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="discardDraft()">Discard</button>
        <button class="btn btn-primary" style="flex:2;" onclick="continueBooking()">Continue booking</button>
      </div>
    </div>`;

  wrap.innerHTML = `
    <div class="cart-layout">
      <div>${itemsHtml}</div>
      ${summaryHtml}
    </div>
    <div class="cart-mobile-cta">
      <div>
        <div class="log-date" style="font-size:11px;color:var(--text-faint);">Estimated total</div>
        <div class="booking-total">${money(t.grandTotal)}</div>
      </div>
      <button class="btn btn-primary" onclick="resumeDraft()">Continue</button>
    </div>`;
  renderCartBadge();
}
function renderProfile() {
  renderProfileAddresses();
}
function renderWallet() {
  const wrap = document.getElementById('walletTxList');
  if (!wrap) return;
  if (state.wallet.transactions.length === 0) {
    wrap.innerHTML = `<div class="empty-state" style="border:none; padding:8px 0 4px;">
      <div class="empty-illustration" style="margin-bottom:8px;">${EMPTY_ICONS.activity}</div>
      <div class="empty-copy">No activity yet. Top-ups and bookings will show up here.</div>
    </div>`;
  } else {
    wrap.innerHTML = state.wallet.transactions.map(tx => `
      <div class="tx-row">
        <span class="tx-label">${tx.note}<span class="tx-date">${tx.date}</span></span>
        <span class="tx-amt ${tx.type === 'credit' ? 'plus' : 'minus'}">${tx.type === 'credit' ? '+' : '−'}${money(tx.amount)}</span>
      </div>`).join('');
  }
}

function renderAll() {
  /* Each renderer runs on its own, so one failing screen can never blank the whole app. */
  const steps = [
    renderWalletChips, renderCartBadge, renderHome, renderCategories, renderCategoryDetail,
    renderTypeDetail, renderOrders, renderCart, renderProfile, renderWallet,
    () => { if (state.draft) renderAddItems(); },
    () => { if (state.draft) renderChooseSlot(); },
    () => { if (state.draft) renderDelivery(); },
    () => { if (state.draft && buildSlot(state.draft)) renderReview(); },
    fitFlowDecor,
    () => { if (typeof renderLive === 'function') renderLive(); },
  ];
  steps.forEach(fn => { try { fn(); } catch (e) { console.error('render step failed:', fn.name || 'step', e); } });
}

/* ---------------- Sign in / Create account ---------------- */
let authMode = 'in';
function authSwitch(mode) {
  authMode = mode;
  const up = mode === 'up';
  document.getElementById('tabIn').classList.toggle('active', !up);
  document.getElementById('tabUp').classList.toggle('active', up);
  document.getElementById('authTitle').textContent = up ? 'Create your account' : 'Welcome back';
  document.getElementById('authSub').textContent = up ? 'Takes under a minute. Then shop India from anywhere.' : 'Sign in to keep shopping India from wherever you are.';
  document.getElementById('authBtn').textContent = up ? 'Create account' : 'Sign in';
  document.getElementById('authSwitch').innerHTML = up
    ? 'Already have an account? <a href="#" onclick="authSwitch(\'in\');return false;">Sign in</a>'
    : 'New to Visasra? <a href="#" onclick="authSwitch(\'up\');return false;">Create an account</a>';
  document.getElementById('authForm').classList.toggle('is-up', up);
  document.getElementById('auPass').autocomplete = up ? 'new-password' : 'current-password';
  document.getElementById('auEmail').autocomplete = up ? 'email' : 'username';
  authError('');
}
function authError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg; el.classList.toggle('show', !!msg);
}
function authTogglePw() {
  const i = document.getElementById('auPass');
  i.type = i.type === 'password' ? 'text' : 'password';
}
async function hashPassword(pw, salt) {
  const text = salt + ':' + pw;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let x = 5381; for (const ch of text) x = ((x << 5) + x + ch.charCodeAt(0)) >>> 0;
  return 'x' + x.toString(16);
}
async function authSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('auEmail').value.trim().toLowerCase();
  const pass = document.getElementById('auPass').value;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return authError('Please enter a valid email address.'), false;
  if (pass.length < 6) return authError('Password must be at least 6 characters.'), false;
  const accounts = readAccounts();
  const existing = accounts.find(a => a.email === email);
  if (authMode === 'up') {
    const name = document.getElementById('auName').value.trim();
    if (name.length < 2 || !/^[\p{L}\p{M}\s.'’\-]+$/u.test(name)) return authError('Please enter your name using letters only.'), false;
    if (existing) return authError('An account with this email already exists. Try signing in.'), false;
    const salt = uid();
    const acct = { email, name, loc: '', salt, hash: await hashPassword(pass, salt), created: Date.now() };
    // First account on this device adopts any data saved before accounts existed.
    if (!accounts.length) {
      try {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) localStorage.setItem(LEGACY_KEY + ':' + email, legacy);
      } catch (err) {}
    }
    accounts.push(acct); writeAccounts(accounts);
  } else {
    if (!existing) return authError('No account found for this email. Create one instead?'), false;
    if (await hashPassword(pass, existing.salt) !== existing.hash) return authError('Incorrect password. Please try again.'), false;
  }
  try { localStorage.setItem(SESSION_KEY, email); } catch (err) {}
  location.reload();
  return false;
}
function signOut() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  location.reload();
}
function applyUserToUi() {
  const a = currentAccount();
  document.documentElement.classList.toggle('logged-out', !a);
  if (!a) return;
  const initials = a.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'U';
  const set = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
  set('profileAvatar', initials);
  set('profileName', a.name);
  set('profileLoc', a.loc ? `${a.loc}  ·  ships to ${a.loc}` : a.email);
}

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

/* ---------------- Init ---------------- */
applyUserToUi();
renderAll();
showScreen('home');
