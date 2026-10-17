/* Visasra Admin v1 (basic). Reads the same browser storage as the customer + worker apps.
   Put this `admin` folder beside the customer app's index.html. BACKEND: sign-in / create account / OTP call AdminAuthAPI (below). The ADMINS list is only the Settings > Team mock. */
const K = { ACC: 'visasra_accounts_v1', ST: 'visasra_app_state_v1:', LV: 'visasra_live_v1:', WK: 'visasra_workers_v1', SES: 'visasra_admin_session_v1' };
const ADMINS = [{ email: 'admin@visasra.in', pass: 'admin123', name: 'Admin' }];
/* Slot windows (IST, 11 AM - 9 PM). Mirrors SLOT_SCHEDULE in the customer app: 2h / 3h / 5h slots, back-to-back.
   t1..t4 are the old windows, kept so earlier bookings still resolve. */
const WIN = (() => {
  const h12 = h => (h % 12 === 0 ? 12 : h % 12) + ' ' + (h >= 12 ? 'PM' : 'AM');
  const out = [];
  [2, 3, 5].forEach(dur => { for (let h = 11, n = 1; h + dur <= 21; h += dur, n++) out.push({ id: 'h' + dur + '-' + n, l: h12(h) + ' – ' + h12(h + dur), s: h, e: h + dur }); });
  return out.concat([{ id: 't1', l: '9 AM – 11 AM', s: 9, e: 11 }, { id: 't2', l: '11 AM – 1 PM', s: 11, e: 13 }, { id: 't3', l: '2 PM – 4 PM', s: 14, e: 16 }, { id: 't4', l: '4 PM – 6 PM', s: 16, e: 18 }]);
})();
let LEAD = 4, PAY = 350, FEE = 199;
const $ = id => document.getElementById(id);
const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast('Browser storage is full'); return false; } };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const now = () => Date.now();
const p2 = n => String(n).padStart(2, '0'), isoOf = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
const today = () => isoOf(new Date(now()));
const addD = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return isoOf(new Date(y, m - 1, d + n)); };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayL = iso => { const [y, m, d] = iso.split('-').map(Number); return DOW[new Date(y, m - 1, d).getDay()] + ', ' + d + ' ' + MON[m - 1]; };
const ini = n => String(n || '?').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
const av = n => `<span class="av">${esc(ini(n))}</span>`;
const fmtTs = t => t ? new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
const uid = () => Math.random().toString(36).slice(2, 9);
const svgUri = s => 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
const ref = (fn, id, stop) => `onclick="${stop ? 'event.stopPropagation();' : ''}A.${fn}(this.dataset.id)" data-id="${esc(id)}"`;
const pill = (t, c) => `<span class="pill ${c || ''}">${esc(t)}</span>`;
const empty = (t, d) => `<div class="card empty"><b>${t}</b>${d || ''}</div>`;
let toastT = 0;
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }

const ST = { open: ['Scheduled', 'n'], needs: ['Needs shopper', 'o'], unclaimed: ['Unclaimed', 'r'], assigned: ['Assigned', ''], shopping: ['Shopping', 'p'], purchased: ['Purchased', 'g'], completed: ['Completed', 'g'], refunded: ['Refunded', 'n'] };
const stPill = s => pill(ST[s][0], ST[s][1]);
const kycOf = w => (w.kyc || {}).status || 'none';
const kycPill = w => { const s = kycOf(w); return pill({ approved: 'Verified', pending: 'Pending review', rejected: 'Rejected', none: 'Not submitted' }[s], { approved: 'g', pending: 'o', rejected: 'r', none: 'n' }[s]); };
const earned = w => (w.history || []).reduce((a, h) => a + h.amount, 0);

/* ---------- data ---------- */
function stat(b) {
  const s = b.s, t = now();
  if (b.refunded) return 'refunded';
  if (s && (s.stage === 'packed' || s.status === 'completed')) return 'completed';
  if (!s || !s.shopper) return t >= b.end ? 'unclaimed' : t >= b.start - LEAD * 36e5 ? 'needs' : 'open';
  if (s.stage === 'purchased') return 'purchased';
  return s.stage === 'heading_to_store' || s.stage === 'shopping' ? 'shopping' : 'assigned';
}
let D = null;
function load() {
  const wo = rd(K.WK, {}), W = Object.keys(wo).map(k => Object.assign({ key: k }, wo[k])), byId = {}; W.forEach(w => { byId[w.id] = w; });
  const C = [], B = [], P = [], PO = [];
  rd(K.ACC, []).forEach(a => {
    const st = rd(K.ST + a.email, null) || { orders: [], wallet: { balance: 0 } }, lv = rd(K.LV + a.email, {});
    const c = { email: a.email, name: a.name || a.email.split('@')[0], wallet: st.wallet || { balance: 0 }, n: 0, spent: 0 }; C.push(c);
    const g = {}; (st.orders || []).filter(o => o.slot && o.slot.id && o.slot.iso).forEach(o => (g[o.slot.id] = g[o.slot.id] || []).push(o));
    Object.keys(g).forEach(key => {
      const os = g[key], w = WIN.find(x => x.id === key.split('|')[1]) || WIN[0], s = lv[key] || null, [y, m, d] = os[0].slot.iso.split('-').map(Number);
      const b = { id: a.email + '#' + key, email: a.email, key, cust: c, iso: os[0].slot.iso, win: w, items: os.flatMap(o => o.items || []), online: os.flatMap(o => o.onlineItems || []), ref: os[0].id, fee: os.reduce((x, o) => x + (o.slotFee || 0), 0), total: os.reduce((x, o) => x + (o.total || 0), 0), s,
        start: new Date(y, m - 1, d, w.s).getTime(), end: new Date(y, m - 1, d, w.e).getTime(), worker: s && s.shopper ? byId[s.shopper.wid] || { name: s.shopper.name } : null,
        refunded: os.every(o => o.refunded), address: (os.find(o => o.address) || {}).address, notes: os.map(o => o.instructions).filter(Boolean).join(' · ') };
      b.st = stat(b); c.n++; if (!b.refunded) c.spent += b.total; B.push(b);
      ((s && s.products) || []).forEach(p => {
        if (p.status !== 'approved' && p.status !== 'purchased') return; const pay = p.payment;
        P.push({ id: b.id + '/' + p.itemId, b, p, img: ((p.options || []).find(o => o.status === 'approved') || {}).image, name: p.name, qty: p.qty || 1, amt: p.approvedAmount || 0, store: (() => { const o = (p.options || []).find(o => o.status === 'approved') || {}; return o.store || ((/^From ([^.]+)/.exec(o.description || '') || [])[1]) || '—'; })(), st: !pay ? 'wait' : pay.status === 'paid' ? 'paid' : 'qr', qr: pay && pay.qr, proof: pay && pay.proof });
      });
    });
  });
  W.forEach(w => (w.payouts || []).forEach((p, i) => PO.push(Object.assign({}, p, { w, i, st: p.paidAt ? 'paid' : 'req' }))));
  B.sort((a, b) => b.start - a.start); D = { C, B, W, P, PO };
}
const counts = () => ({ book: D.B.filter(b => b.st === 'needs' || b.st === 'unclaimed').length, kyc: D.W.filter(w => kycOf(w) === 'pending').length, shop: D.P.filter(p => p.st === 'qr').length, pay: D.PO.filter(p => p.st === 'req').length });

/* ---------- writers ---------- */
function mutS(b, fn) { const all = rd(K.LV + b.email, {}), s = all[b.key] || { slotKey: b.key, status: 'scheduled', stage: 'scheduled', shopper: null, location: null, store: null, products: [] }; fn(s); all[b.key] = s; return wr(K.LV + b.email, all); }
function mutW(key, fn) { const all = rd(K.WK, {}); if (!all[key]) return; fn(all[key]); wr(K.WK, all); }
function mutC(email, fn) { const s = rd(K.ST + email, null) || { orders: [], wallet: { balance: 0, transactions: [] } }; s.wallet = s.wallet || { balance: 0, transactions: [] }; s.wallet.transactions = s.wallet.transactions || []; fn(s); wr(K.ST + email, s); }
const fb = id => D.B.find(b => b.id === id), fw = k => D.W.find(w => w.key === k);

/* ---------- ui state ---------- */
const U = { page: 'overview', q: '', f: { bk: 'all', kyc: 'pending', shop: 'qr', po: 'req' } };
const match = (...p) => { const t = U.q.trim().toLowerCase(); return !t || p.join(' ').toLowerCase().includes(t); };
const search = ph => `<div class="tool"><input id="q" class="inp" placeholder="${ph}" value="${esc(U.q)}" oninput="A.q(this.value)"></div>`;
const chips = (key, list) => `<div class="chips">${list.map(([v, l, n]) => `<button class="chip ${U.f[key] === v ? 'on' : ''}" onclick="A.f('${key}','${v}')">${l}${n != null ? ' · ' + n : ''}</button>`).join('')}</div>`;
const head = (t, s, r) => `<div class="ph2"><div><h2>${t}</h2>${s ? `<p>${s}</p>` : ''}</div><div class="row wrap">${r || ''}</div></div>`;
const row = (attr, cells) => `<tr ${attr}>${cells.map(([l, h], i) => `<td data-l="${l}"${i ? '' : ' class="f"'}>${h}</td>`).join('')}</tr>`;
const table = (heads, rows) => `<div class="card" style="overflow-x:auto"><table class="t"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const who = (n, sub) => `<div class="who">${av(n)}<div><b>${esc(n)}</b><small>${esc(sub || '')}</small></div></div>`;

/* ---------- pages ---------- */
function tasks() {
  const c = D.B, o = [], unc = c.filter(b => b.st === 'unclaimed').length, need = c.filter(b => b.st === 'needs').length, n = counts();
  const due = D.P.filter(p => p.st === 'qr').reduce((a, p) => a + p.amt, 0), pd = D.PO.filter(p => p.st === 'req').reduce((a, p) => a + p.amount, 0);
  if (unc) o.push([unc + ' slot(s) nobody accepted', 'Assign a shopper or refund the customer', 'bookings', 'attention', 'r']);
  if (need) o.push([need + ' slot(s) waiting for a shopper', 'Accepting is open', 'bookings', 'attention', 'o']);
  if (n.kyc) o.push([n.kyc + ' shopper(s) to verify', 'Aadhaar, PAN, license & photo waiting', 'verification', '', 'o']);
  if (n.shop) o.push([n.shop + ' shop payment(s) · ' + inr(due), 'Shoppers are waiting with a QR', 'shop', '', 'o']);
  if (n.pay) o.push([n.pay + ' payout request(s) · ' + inr(pd), 'Weekly and emergency', 'payouts', '', '']);
  return o;
}
const KIC = { book: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>', alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>', pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', money: '<circle cx="12" cy="12" r="9"/><path d="M9 8h6M9 12h6M10 8c4 0 4 5 0 5l4 3"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>', bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' };
const kicFor = l => /book/i.test(l) && /value/i.test(l) ? 'chart' : /today|booking/i.test(l) ? 'book' : /attention/i.test(l) ? 'alert' : /online/i.test(l) ? 'pin' : /shop pay/i.test(l) ? 'card' : /payout|due|paid|revenue|net|fee|collected|refund|wallet|earn/i.test(l) ? 'money' : /customer/i.test(l) ? 'users' : /worker|shopper/i.test(l) ? 'bag' : 'chart';
const kicon = l => `<span class="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${KIC[kicFor(l)]}</svg></span>`;
function pgOverview() {
  const t = today(), n = counts(), tb = D.B.filter(b => b.iso === t && !b.refunded), online = D.W.filter(w => w.online && kycOf(w) === 'approved' && !w.suspended).length;
  const due = D.P.filter(p => p.st === 'qr').reduce((a, p) => a + p.amt, 0), pd = D.PO.filter(p => p.st === 'req').reduce((a, p) => a + p.amount, 0);
  const k = (l, v, s, c, go) => `<div class="card kpi" style="--c:${c}" onclick="A.go('${go}')">${kicon(l)}<div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const tk = tasks(), up = D.B.filter(b => b.end >= now() && !b.refunded).sort((a, b) => a.start - b.start).slice(0, 6);
  const first = !D.C.length && !D.W.length ? `<div class="note ok"><b>No data yet.</b> Customers and workers show up here as they use the customer and worker apps.</div>` : '';
  return head('Overview', dayL(t)) + first + `<div class="grid g4" style="margin-bottom:14px">${k('Bookings today', tb.length, tb.filter(b => b.st === 'completed').length + ' completed', '#1261B5', 'bookings')}${k('Need attention', n.book, n.book ? 'No shopper yet' : 'All covered', n.book ? '#B3261E' : '#2F7D4A', 'bookings')}${k('Shoppers online', online, n.kyc + ' awaiting verification', '#A8206F', 'live')}${k('Shop payments due', inr(due), n.shop + ' QR waiting', '#B26A00', 'shop')}</div>
  <div class="grid g2"><div class="card"><div class="pad b" style="font-size:16px">Needs your attention</div>${tk.length ? tk.map(x => `<div class="task" onclick="A.go('${x[2]}','${x[3]}')"><span class="pill ${x[4]}">●</span><div class="grow"><b>${x[0]}</b><div class="sm mut">${x[1]}</div></div>›</div>`).join('') : '<div class="empty"><b>All clear</b>Nothing is waiting on you.</div>'}</div>
  <div class="card"><div class="pad b" style="font-size:16px">Next slots</div>${up.length ? up.map(b => `<div class="task" ${ref('open', b.id)}>${av(b.cust.name)}<div class="grow"><b>${esc(b.cust.name)}</b><div class="sm mut">${dayL(b.iso)} · ${b.win.l}</div></div>${stPill(b.st)}</div>`).join('') : '<div class="empty">No upcoming slots</div>'}</div></div>
  <div class="grid g4" style="margin-top:14px">${k('Payouts due', inr(pd), n.pay + ' requests', '#1261B5', 'payouts')}${k('Customers', D.C.length, 'with wallets ' + inr(D.C.reduce((a, c) => a + (c.wallet.balance || 0), 0)), '#5B6B82', 'customers')}${k('Workers', D.W.length, D.W.filter(w => kycOf(w) === 'approved').length + ' verified', '#5B6B82', 'workers')}${k('Booking value', inr(D.B.filter(b => !b.refunded).reduce((a, b) => a + b.total, 0)), 'all time', '#2F7D4A', 'bookings')}</div>`;
}
function pgBookings() {
  const t = today(), f = U.f.bk, all = D.B, c = s => all.filter(b => b.st === s).length;
  const rows = all.filter(b => (f === 'all' || (f === 'attention' ? b.st === 'needs' || b.st === 'unclaimed' : f === 'today' ? b.iso === t : f === 'upcoming' ? b.iso > t : f === 'past' ? b.iso < t : true)) && match(b.cust.name, b.cust.email, b.ref, b.worker ? b.worker.name : '', b.items.map(i => i.name).join(' ')));
  return head('Bookings', 'Every slot customers have booked.', '<button class="btn o" onclick="A.exportBk()">Export</button>') + search('Search customer, order, shopper or product') + chips('bk', [['all', 'All', all.length], ['attention', 'Needs attention', c('needs') + c('unclaimed')], ['today', 'Today'], ['upcoming', 'Upcoming'], ['past', 'Past']]) +
    (rows.length ? table(['Slot', 'Customer', 'Items', 'Value', 'Shopper', 'Status'], rows.map(b => row(ref('open', b.id), [['Slot', `<b>${dayL(b.iso)}</b><div class="sm mut">${b.win.l}</div>`], ['Customer', who(b.cust.name, b.ref)], ['Items', itemStrip(b)], ['Value', `<b>${inr(b.total)}</b>`], ['Shopper', b.worker ? esc(b.worker.name) : '<span class="mut">Not assigned</span>'], ['Status', stPill(b.st)]]))) : empty(all.length ? 'No bookings match' : 'No bookings yet', 'Bookings made in the customer app appear here.'));
}
function pgVerification() {
  const all = D.W.filter(w => kycOf(w) !== 'none'), f = U.f.kyc, n = s => all.filter(w => kycOf(w) === s).length, rows = all.filter(w => kycOf(w) === f && match(w.name, w.phone));
  return head('Verification', 'Check Aadhaar, PAN, driver\'s license and profile photo before a worker can accept slots.') + chips('kyc', [['pending', 'Pending', n('pending')], ['approved', 'Approved', n('approved')], ['rejected', 'Rejected', n('rejected')]]) +
    (rows.length ? rows.map(w => { const k = w.kyc, d = k.docs || {}; return `<div class="card pad" style="margin-bottom:12px"><div class="row wrap">${d.ph ? `<span class="av" style="overflow:hidden"><img src="${esc(d.ph)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></span>` : av(w.name)}<div class="grow"><b style="font-size:16px">${esc(w.name)}</b><div class="sm mut">${esc(w.phone)} · submitted ${fmtTs(k.submittedAt)}</div></div>${kycPill(w)}</div>
      <dl class="kv" style="margin-top:12px"><dt>Aadhaar</dt><dd>${esc(k.aadhaarNo || '—')}</dd><dt>PAN</dt><dd>${esc(k.panNo || '—')}</dd></dl>
      <div class="docs">${[['ph', 'Profile photo'], ['dl', "Driver's license"], ['af', 'Aadhaar front'], ['ab', 'Aadhaar back'], ['pan', 'PAN card']].filter(x => d[x[0]]).map(x => `<figure style="margin:0"><img src="${esc(d[x[0]])}" alt="${x[1]}" onclick="A.zoom(this.src)"><div class="sm b">${x[1]}</div></figure>`).join('') || '<span class="mut">No documents uploaded</span>'}</div>
      ${k.status === 'pending' ? `<div class="row wrap"><button class="btn g" ${ref('kycOk', w.key)}>Approve</button><button class="btn d" ${ref('kycNo', w.key)}>Reject…</button></div>` : k.status === 'rejected' ? `<div class="note bad" style="margin:0">Rejected: ${esc(k.reason || '')}</div>` : `<div class="note ok" style="margin:0">Approved ${fmtTs(k.reviewedAt)}</div>`}</div>`; }).join('') : empty('Nothing here', f === 'pending' ? 'New verification requests will appear here.' : ''));
}
function pgShop() {
  const all = D.P, f = U.f.shop, n = s => all.filter(p => p.st === s).length, rows = all.filter(p => p.st === f && match(p.name, p.b.cust.name, p.b.worker ? p.b.worker.name : '', p.store));
  return head('Shop payments', 'Workers send the shop’s QR after a customer approves. Pay the shop, then mark it paid.') + search('Search product, worker, customer or shop') + chips('shop', [['qr', 'To pay', n('qr')], ['wait', 'Waiting for QR', n('wait')], ['paid', 'Paid', n('paid')]]) +
    (rows.length ? rows.map(p => `<div class="card pad row" style="margin-bottom:12px;align-items:flex-start">${p.img ? `<img class="pth" src="${esc(imgU(p.img))}" alt="Product" onclick="A.zoom(this.src)" onerror="imgErr(this)">` : ''}${p.qr ? `<img class="qr" src="${esc(p.qr)}" alt="Shop QR" onclick="A.zoom(this.src)">` : ''}<div class="grow"><div class="row wrap"><b style="font-size:22px" class="grow">${inr(p.amt)}</b>${p.st === 'paid' ? pill('Paid', 'g') : p.st === 'qr' ? pill('Pay now', 'o') : pill('Waiting for QR', 'n')}</div><b>${esc(p.name)}</b> <span class="mut">× ${p.qty}</span>
      <dl class="kv" style="margin-top:8px"><dt>Shop</dt><dd>${esc(p.store)}</dd><dt>Worker</dt><dd>${p.b.worker ? esc(p.b.worker.name) : '—'}</dd><dt>Customer</dt><dd>${esc(p.b.cust.name)}</dd></dl>
      <div class="row wrap" style="margin-top:10px">${p.st === 'qr' ? `<button class="btn g s" ${ref('payShop', p.id)}>Mark as paid</button>` : ''}${p.proof ? `<button class="btn o s" ${ref('zoom', p.proof)}>View screenshot</button>` : ''}<button class="btn x s" ${ref('open', p.b.id)}>Open booking</button></div></div></div>`).join('') : empty('Nothing here', f === 'qr' ? 'No shop payments to make.' : ''));
}
function pgPayouts() {
  const all = D.PO, f = U.f.po, rows = all.filter(p => p.st === f && match(p.w.name, p.w.phone)), n = s => all.filter(p => p.st === s).length;
  return head('Worker payouts', 'Weekly (Wednesday) and emergency withdrawals.', '<button class="btn o" onclick="A.exportPo()">Export</button>') + chips('po', [['req', 'Requested', n('req')], ['paid', 'Paid', n('paid')]]) +
    (rows.length ? table(['Worker', 'Type', 'Requested', 'Amount', 'Status', ''], rows.map(p => row('style="cursor:default"', [['Worker', who(p.w.name, p.w.phone)], ['Type', p.type === 'emergency' ? pill('Emergency', 'r') : pill('Weekly')], ['Requested', esc(p.date || '—')], ['Amount', `<b>${inr(p.amount)}</b>`], ['Status', p.st === 'paid' ? pill('Paid', 'g') + `<div class="sm faint">${esc(p.utr || '')}</div>` : pill('Requested', 'o')], ['', p.st === 'req' ? `<button class="btn g s" ${ref('payout', p.w.key + '|' + p.i)}>Mark paid</button>` : '']]))) : empty('No payouts here', 'Withdrawal requests from workers appear here.'));
}
function pgWorkers() {
  const rows = D.W.filter(w => match(w.name, w.phone));
  return head('Workers', 'Everyone who shops for customers.') + search('Search name or phone') + (rows.length ? table(['Worker', 'Status', 'Verification', 'Slots', 'Earned'], rows.map(w => row(ref('open', 'w:' + w.key), [['Worker', who(w.name, w.phone)], ['Status', w.suspended ? pill('Suspended', 'r') : w.online ? pill('Online', 'g') : pill('Offline', 'n')], ['Verification', kycPill(w)], ['Slots', String((w.done || 0) + (w.history || []).length)], ['Earned', inr(earned(w))]]))) : empty('No workers yet', 'Workers appear after signing up in the worker app.'));
}
function pgCustomers() {
  const rows = D.C.filter(c => match(c.name, c.email));
  return head('Customers', 'People who book shopping slots.') + search('Search name or email') + (rows.length ? table(['Customer', 'Bookings', 'Spent', 'Wallet'], rows.map(c => row(ref('open', 'c:' + c.email), [['Customer', who(c.name, c.email)], ['Bookings', c.n], ['Spent', inr(c.spent)], ['Wallet', `<b>${inr(c.wallet.balance)}</b>`]]))) : empty('No customers yet', 'Customers appear after signing up in the customer app.'));
}
function pgSettings() {
  return head('Settings') + `<div class="card pad" style="max-width:640px">
    <hr style="border:0;border-top:1px solid var(--bd);margin:18px 0"><dl class="kv"><dt>Signed in</dt><dd>${esc((me() || {}).name)}</dd><dt>Slot fee</dt><dd>${inr(FEE)}</dd><dt>Worker pay / slot</dt><dd>${inr(PAY)}</dd><dt>Data</dt><dd>Browser storage shared with the customer & worker apps</dd></dl><div style="margin-top:16px"><button class="btn x" onclick="A.logout()">Sign out</button></div></div>`;
}
const PAGES = { overview: ['Overview', pgOverview], bookings: ['Bookings', pgBookings], verification: ['Verification', pgVerification], shop: ['Shop payments', pgShop], payouts: ['Worker payouts', pgPayouts], workers: ['Workers', pgWorkers], customers: ['Customers', pgCustomers], settings: ['Settings', pgSettings] };
const GROUPS = [['', ['overview']], ['Operations', ['bookings', 'verification', 'shop', 'payouts']], ['People', ['workers', 'customers']], ['', ['settings']]];

/* ---------- panels ---------- */
let CUR = null;
function panel(title, sub, body, foot) {
  $('ov').innerHTML = `<div class="scrim" onclick="A.close()"></div><div class="panel"><div class="pt"><div class="grow"><b>${title}</b>${sub ? `<div class="sm mut">${sub}</div>` : ''}</div><button class="btn x s" onclick="A.close()">✕</button></div><div class="pb">${body}</div>${foot ? `<div class="pf">${foot}</div>` : ''}</div>`; $('ov').classList.add('on');
}
/* reference photos: everything the customer attached, else the catalogue picture (admin sits one folder below the customer app) */
const slug = n => String(n || '').toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
function refList(it) { const a = (it.images || []).filter(Boolean).map(imgU); if (it.image && !a.includes(imgU(it.image))) a.unshift(imgU(it.image)); if (!a.length && it.imgCat && it.imgName) a.push('../images/products/' + it.imgCat + '/' + slug(it.imgName) + (it.imgType ? '/' + slug(it.imgType) : '') + '.jpg'); return a; }
function imgErr(i) { const x = ['jpeg', 'png', 'webp'], n = +(i.dataset.t || 0); if (!i.src.startsWith('data:') && n < 3 && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(i.src)) { i.dataset.t = n + 1; i.src = i.src.replace(/\.(jpg|jpeg|png|webp)(\?|$)/i, '.' + x[n] + '$2'); } else { i.onerror = null; i.style.display = 'none'; } }
const thumbs = a => a.length ? `<div class="thumbs">${a.map(src => `<img src="${esc(src)}" alt="Reference photo" onclick="A.zoom(this.src)" onerror="imgErr(this)">`).join('')}</div>` : '';
/* photo paths saved by the customer app are relative to its index.html; the admin sits one folder below */
const imgU = s => !s ? '' : /^(data:|https?:|blob:|\/|\.\.\/)/.test(s) ? s : '../' + s;
const optOf = p => p && (p.options || []).find(o => o.status === 'approved');
const OPT_TAG = { approved: ['Approved', 'g'], pending: ['Waiting', 'o'], rejected: ['Rejected', 'r'], not_chosen: ['Not chosen', 'n'] };
const fig = (src, cap, cls, sub) => `<figure class="pcf ${cls || ''}"><img src="${esc(imgU(src))}" alt="" onclick="A.zoom(this.src)" onerror="imgErr(this)"><figcaption>${cap || ''}${sub ? `<small>${sub}</small>` : ''}</figcaption></figure>`;
/* one card per ordered product: what the customer asked for, what the worker found, what was bought */
function prodCard(it, p) {
  const refs = refList(it), opts = (p && p.options) || [], ap = optOf(p), bought = p && p.status === 'purchased', pay = p && p.payment;
  const st = p ? pill(({ approved: 'Approved', purchased: 'Bought', options_ready: 'Customer choosing', needs_options: 'Needs new options', waiting: 'Finding options' })[p.status] || p.status, bought || p.status === 'approved' ? 'g' : 'o') : pill('Not started', 'n');
  const ask = refs.length ? `<div class="pcg">${refs.map((r, i) => fig(r, refs.length > 1 ? 'Reference ' + (i + 1) : 'Reference')).join('')}</div>` : '<div class="sm mut">No reference photo</div>';
  const found = opts.length ? `<div class="pcg">${opts.map((o, i) => { const t = OPT_TAG[o.status] || ['', 'n']; return fig(o.image, inr(o.price) + ' each', 'o-' + o.status, `${pill(t[0], t[1])}${o.store ? '<br>' + esc(o.store) : ''}`); }).join('')}</div>` : `<div class="sm mut">${p ? 'No options uploaded yet' : 'Worker has not started this item'}</div>`;
  const buy = ap && (bought || p.status === 'approved') ? `<div class="pch">${bought ? 'Bought' : 'Approved · waiting to be bought'}</div><div class="pcg">${fig(ap.image, inr(p.approvedAmount || ap.price * (p.qty || 1)), 'big o-approved', (bought ? 'Purchased' : 'To buy') + (ap.store ? ' · ' + esc(ap.store) : ''))}${pay && pay.proof ? fig(pay.proof, 'Payment proof', 'big') : ''}</div>` : '';
  return `<div class="card pad pc"><div class="row"><div class="grow"><b>${esc(it.name)}</b> <span class="mut">× ${it.qty || 1}</span><div class="sm mut">${it.priceMin ? 'Budget ' + inr(it.priceMin) + ' – ' + inr(it.priceMax) : ''}${it.desc ? '<br>“' + esc(it.desc) + '”' : ''}</div></div>${st}</div>
    <div class="pch">Customer asked for</div>${ask}<div class="pch">Worker found${opts.length ? ' · ' + opts.length + ' option' + (opts.length > 1 ? 's' : '') : ''}</div>${found}${buy}</div>`;
}
/* small photo strip for the bookings list: the bought photo when there is one, else the customer's reference */
function itemStrip(b) {
  const prods = (b.s && b.s.products) || [], pics = b.items.map(it => { const p = prods.find(x => x.itemId === it.id), ap = optOf(p); return p && p.status === 'purchased' && ap && ap.image ? ap.image : refList(it)[0]; }).filter(Boolean);
  return `<div class="strip">${pics.slice(0, 3).map(s => `<img src="${esc(imgU(s))}" alt="" onerror="imgErr(this)">`).join('')}${pics.length > 3 ? `<i>+${pics.length - 3}</i>` : ''}<span>${b.items.length}</span></div>`;
}
function bookingPanel(b) {
  const s = b.s, prods = (s && s.products) || [], can = !b.refunded && b.st !== 'completed';
  const body = `${b.st === 'unclaimed' ? '<div class="note bad"><b>Nobody accepted this slot.</b> Assign a shopper or refund the customer.</div>' : b.st === 'needs' ? '<div class="note w"><b>Waiting for a shopper.</b> Assign one if nobody takes it soon.</div>' : ''}
  <div class="card pad"><div class="row"><div class="grow"><div style="font-size:24px;font-weight:800">${inr(b.total)}</div><div class="sm mut">${b.items.length} item(s) · order ${esc(b.ref)}</div></div>${stPill(b.st)}</div><dl class="kv" style="margin-top:10px"><dt>Slot</dt><dd>${dayL(b.iso)} · ${b.win.l}</dd><dt>Shopper</dt><dd>${b.worker ? esc(b.worker.name) : 'Not assigned'}</dd>${s && s.store ? `<dt>Store</dt><dd>${esc(s.store.name)}</dd>` : ''}</dl></div>
  <div class="sec">Customer</div><div class="card pad"><div class="row">${av(b.cust.name)}<div class="grow"><b>${esc(b.cust.name)}</b><div class="sm mut">${esc(b.email)}</div></div></div><dl class="kv" style="margin-top:10px"><dt>Address</dt><dd>${esc(b.address ? ['name', 'phone', 'line1', 'line2', 'city', 'region', 'zip', 'country'].map(k => b.address[k]).filter(Boolean).join(', ') : '—')}</dd>${b.notes ? `<dt>Instructions</dt><dd>${esc(b.notes)}</dd>` : ''}</dl></div>
  ${typeof locBlock === 'function' ? locBlock(b) : ''}
  <div class="sec">What the customer ordered</div>${b.items.map(it => prodCard(it, prods.find(x => x.itemId === it.id))).join('')}${(b.online || []).length ? `<div class="sec">Online orders to collect</div>${b.online.map(o => `<div class="card pad" style="margin-bottom:8px"><b>Online link × ${o.qty || 1}</b>${o.price ? ' <span class="mut">· ' + inr(o.price) + ' each</span>' : ''}<div class="sm" style="word-break:break-all"><a href="${esc(o.link)}" target="_blank" rel="noopener">${esc(o.link)}</a></div>${thumbs(o.image ? [imgU(o.image)] : [])}</div>`).join('')}` : ''}`;
  const foot = (can && !b.worker ? `<button class="btn" ${ref('assign', b.id)}>Assign shopper</button>` : '') + (can && s && s.shopper && s.stage === 'assigned' ? `<button class="btn o" ${ref('unassign', b.id)}>Unassign</button>` : '') + (can ? `<button class="btn d" ${ref('refund', b.id)}>Refund to wallet</button>` : '');
  panel('Booking ' + esc(b.ref), esc(b.cust.name), body, foot);
}
function workerPanel(w) {
  const k = w.kyc || {}, jobs = D.B.filter(b => b.worker && b.worker.id === w.id).slice(0, 6);
  panel(esc(w.name), esc(w.phone), `<div class="card pad"><div class="row wrap"><div class="grow"><b>${(w.done || 0) + (w.history || []).length}</b> slots done</div>${kycPill(w)}</div>${k.docs && (k.docs.ph || k.docs.dl) ? `<div class="docs" style="grid-template-columns:repeat(2,1fr)">${[['ph', 'Profile photo'], ['dl', "Driver's license"]].filter(x => k.docs[x[0]]).map(x => `<figure style="margin:0"><img src="${esc(k.docs[x[0]])}" alt="${x[1]}" onclick="A.zoom(this.src)"><div class="sm b">${x[1]}</div></figure>`).join('')}</div>` : ''}<dl class="kv" style="margin-top:10px"><dt>Earned</dt><dd>${inr(earned(w))}</dd><dt>Withdrawn</dt><dd>${inr(w.paid || 0)}</dd><dt>Available</dt><dd>${inr(earned(w) - (w.paid || 0))}</dd></dl></div>${typeof workerLive === 'function' ? workerLive(w) : ''}<div class="sec">Recent slots</div>${jobs.map(b => `<div class="card pad row" style="margin-bottom:8px;cursor:pointer" ${ref('open', b.id)}><div class="grow"><b>${esc(b.cust.name)}</b><div class="sm mut">${dayL(b.iso)} · ${b.win.l}</div></div>${stPill(b.st)}</div>`).join('') || '<div class="mut">No slots yet.</div>'}`, `<button class="btn ${w.suspended ? 'g' : 'd'}" ${ref('suspend', w.key)}>${w.suspended ? 'Reactivate' : 'Suspend'} worker</button>`);
}
function customerPanel(c) {
  const bs = D.B.filter(b => b.email === c.email);
  panel(esc(c.name), esc(c.email), `<div class="card pad"><dl class="kv"><dt>Wallet</dt><dd>${inr(c.wallet.balance)}</dd><dt>Bookings</dt><dd>${c.n}</dd><dt>Spent</dt><dd>${inr(c.spent)}</dd></dl></div><div class="sec">Bookings</div>${bs.map(b => `<div class="card pad row" style="margin-bottom:8px;cursor:pointer" ${ref('open', b.id)}><div class="grow"><b>${dayL(b.iso)}</b><div class="sm mut">${b.win.l} · ${inr(b.total)}</div></div>${stPill(b.st)}</div>`).join('') || '<div class="mut">No bookings yet.</div>'}`);
}

/* ---------- actions ---------- */
const A = {
  go(p, f) { if (!PAGES[p]) return; U.page = p; U.q = ''; if (p === 'bookings') U.f.bk = f || 'all'; A.close(); try { history.replaceState(null, '', '#' + p); } catch (e) {} load(); render(); scrollTo(0, 0); },
  q(v) { U.q = v; page(true); }, f(k, v) { U.f[k] = v; page(); },
  close() { $('ov').classList.remove('on'); $('ov').innerHTML = ''; CUR = null; },
  open(id) { CUR = id; if (id.startsWith('w:')) { const w = fw(id.slice(2)); return w && workerPanel(w); } if (id.startsWith('c:')) { const c = D.C.find(x => x.email === id.slice(2)); return c && customerPanel(c); } const b = fb(id); b ? bookingPanel(b) : toast('Record not found'); },
  zoom(src) { $('ov').innerHTML = `<div class="scrim" onclick="A.close()" style="background:rgba(6,16,32,.92)"></div><img src="${esc(src)}" alt="" onclick="A.close()" style="position:absolute;inset:0;margin:auto;max-width:94%;max-height:90%;border-radius:12px;background:#fff">`; $('ov').classList.add('on'); },
  assign(id) {
    const b = fb(id), cand = D.W.filter(w => kycOf(w) === 'approved' && !w.suspended);
    panel('Assign a shopper', esc(b.cust.name) + ' · ' + dayL(b.iso) + ' · ' + b.win.l, cand.length ? cand.map(w => `<div class="pick" ${ref('doAssign', id + '~' + w.key)}>${av(w.name)}<div class="grow"><b>${esc(w.name)}</b><div class="sm mut">${(w.done || 0) + (w.history || []).length} slots done</div></div>${w.online ? pill('Online', 'g') : pill('Offline', 'n')}</div>`).join('') : '<div class="note w">No verified workers yet. Approve one in Verification first.</div>', `<button class="btn x" ${ref('open', id)}>Back</button>`);
  },
  doAssign(v) { const [id, wk] = v.split('~'), b = fb(id), w = fw(wk); if (!b || !w) return; mutS(b, s => { s.shopper = { name: w.name, ordersDone: w.done || 0, phone: w.phone, photo: null, wid: w.id }; s.stage = 'assigned'; }); toast(w.name + ' assigned'); A.refresh(id); },
  unassign(id) { const b = fb(id); if (!confirm('Remove ' + (b.worker ? b.worker.name : 'the shopper') + ' from this slot?')) return; mutS(b, s => { s.shopper = null; s.stage = 'scheduled'; s.status = 'scheduled'; }); toast('Shopper removed'); A.refresh(id); },
  refund(id) {
    const b = fb(id); if (!confirm('Refund ' + inr(b.total) + ' to ' + b.cust.name + '’s wallet?')) return;
    mutC(b.email, s => { (s.orders || []).forEach(o => { if (o.slot && o.slot.id === b.key) { o.refunded = true; o.status = 'Refunded'; } }); s.wallet.balance = (s.wallet.balance || 0) + b.total; s.wallet.transactions.unshift({ id: uid(), type: 'credit', amount: b.total, note: 'Refund — ' + b.ref, date: new Date(now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }); });
    toast(inr(b.total) + ' refunded'); A.refresh(id);
  },
  kycOk(k) { mutW(k, w => { w.kyc.status = 'approved'; w.kyc.reviewedAt = Date.now(); w.kyc.reason = ''; w.kyc.bad = []; }); toast('Worker verified'); A.refresh(); },
  kycNo(k) { const r = (prompt('Reason for rejection (the worker will see this):') || '').trim(); if (!r) return; mutW(k, w => { w.kyc.status = 'rejected'; w.kyc.reason = r; w.kyc.reviewedAt = Date.now(); }); toast('Sent back to worker'); A.refresh(); },
  suspend(k) { const w = fw(k); if (!w.suspended && !confirm('Suspend ' + w.name + '?')) return; mutW(k, x => { x.suspended = !x.suspended; if (x.suspended) x.online = false; }); toast(w.suspended ? 'Reactivated' : 'Suspended'); A.refresh('w:' + k); },
  payShop(id) { const p = D.P.find(x => x.id === id); if (!confirm('Have you paid ' + inr(p.amt) + ' to ' + p.store + '?')) return; mutS(p.b, s => { const x = s.products.find(y => y.itemId === p.p.itemId); x.payment = Object.assign({}, x.payment || {}, { status: 'paid', paidAt: Date.now(), amount: p.amt }); }); toast('Marked paid — worker can buy it now'); A.refresh(); },
  payout(v) { const [k, i] = v.split('|'), w = fw(k), p = w.payouts[+i], utr = prompt('Bank / UPI reference for ' + inr(p.amount) + ' (optional):'); if (utr === null) return; mutW(k, x => { x.payouts[+i].paidAt = Date.now(); x.payouts[+i].utr = utr.trim() || 'UTR' + Math.floor(Math.random() * 9e9 + 1e9); }); toast('Payout recorded'); A.refresh(); },
  login() {
    const e = $('lE').value.trim().toLowerCase(), p = $('lP').value, err = $('lErr');
    const bad = m => { err.textContent = m; err.style.display = 'block'; };
    if (!e || !p) return bad('Enter your email and password.');
    busy(true);
    AdminAuthAPI.login(e, p).then(r => startOtp({ email: e, up: false, token: r && r.otpToken })).catch(x => { busy(false); bad(x.status === 401 ? 'That email or password is not right.' : authMsg(x)); });
  },
  authMode(m) { AUTH = m; OTP = null; render(); },
  verifyOtp() { verifyOtp(); }, resendOtp() { resendOtp(); }, otpBack() { otpBack(); },
  signup() {
    const name = $('sN').value.trim(), email = $('sE').value.trim().toLowerCase(), pass = $('sP').value, err = $('sErr');
    const bad = m => { err.textContent = m; err.style.display = 'block'; };
    if (!name || !/^[\p{L}\p{M}\s.'’\-]+$/u.test(name)) return bad('Name can only contain letters.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('Enter a valid email.');
    if (pass.length < 6) return bad('Password needs 6+ characters.');
    if (pass !== $('sP2').value) return bad('Passwords do not match.');
    busy(true);
    AdminAuthAPI.signup(name, email, pass).then(r => startOtp({ email, name, up: true, token: r && r.otpToken })).catch(x => { busy(false); bad(x.status === 409 ? 'An admin with that email already exists.' : authMsg(x)); });
  },
  logout() { localStorage.removeItem(K.SES); A.close(); render(); },
  menu() { panel('More', '', Object.keys(PAGES).map(k => `<div class="pick" onclick="A.go('${k}')"><b>${PAGES[k][0]}</b></div>`).join('') + `<div class="pick" onclick="A.logout()"><b>Sign out</b></div>`); },
  refresh(keep) { load(); render(); if (keep) A.open(keep); else if (CUR && !$('ov').classList.contains('on')) A.close(); else if (!keep) A.close(); },
};


/* ---------- sign in / create account ---------- */
let AUTH = 'in';
function authView() {
  if (AUTH === 'otp' && OTP) return otpView();
  const up = AUTH === 'up';
  return `<div class="login"><form onsubmit="event.preventDefault();A.${up ? 'signup' : 'login'}()"><img src="logo.png" alt="Visasra"><div class="wm">Vis<b>asra</b></div>
  <h2 style="text-align:center;margin-bottom:4px">${up ? 'Create admin account' : 'Admin sign in'}</h2>
  <p class="mut" style="text-align:center;margin:0 0 18px">${up ? 'Set up your Visasra admin account.' : 'Use your Visasra admin account.'}</p>
  ${up ? '<div class="field"><label for="sN">Full name</label><input class="inp" id="sN" type="text" maxlength="60" autocomplete="name"></div>' : ''}
  <div class="field"><label for="${up ? 'sE' : 'lE'}">Email</label><input class="inp" id="${up ? 'sE' : 'lE'}" type="email" maxlength="120" autocomplete="username"></div>
  <div class="field"><label for="${up ? 'sP' : 'lP'}">Password${up ? ' (6+ characters)' : ''}</label><input class="inp" id="${up ? 'sP' : 'lP'}" type="password" maxlength="64" autocomplete="${up ? 'new-password' : 'current-password'}"></div>
  ${up ? '<div class="field"><label for="sP2">Confirm password</label><input class="inp" id="sP2" type="password" maxlength="64" autocomplete="new-password"></div>' : ''}
  <div class="note bad" id="${up ? 'sErr' : 'lErr'}" style="display:none">${up ? '' : 'That email or password is not right.'}</div>
  <button class="btn" style="width:100%;padding:12px" type="submit">${up ? 'Create account' : 'Sign in'}</button>
  <p class="mut sm" style="text-align:center;margin:14px 0 0">${up ? 'Already have an account?' : 'New here?'} <a href="#" onclick="A.authMode('${up ? 'in' : 'up'}');return false" style="color:var(--bl);font-weight:700">${up ? 'Sign in' : 'Create account'}</a></p></form></div>`;
}

/* ---------- Auth API: BACKEND replaces nothing here but the URLs/response shapes below ----------
   POST /api/admin/login        { email, password }              -> 200 { otpToken }        | 401 wrong email/password
   POST /api/admin/signup       { name, email, password }        -> 200 { otpToken }        | 409 email already an admin
   POST /api/admin/otp/verify   { otpToken, code }               -> 200 { admin:{name,email,role}, token } | 422 wrong code | 410 expired | 429 too many tries
   POST /api/admin/otp/resend   { otpToken }                     -> 200 { otpToken }        | 429 too soon
   The server emails the OTP (it is never sent to the browser), expires it after 5 min, limits tries (5) and resends (1 per 30 s).
   Sign-up must only create the account after /otp/verify succeeds. See BACKEND_INTEGRATION.md. */
const API_BASE = '';
const AdminAuthAPI = (() => {
  const call = (path, body) => fetch(API_BASE + '/api/admin/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
    .then(r => r.json().catch(() => ({})).then(d => { if (!r.ok) throw { status: r.status, message: d.message || d.error }; return d; }),
      () => { throw { status: 0, message: 'Can’t reach the server. Check your connection.' }; });
  return {
    login: (email, password) => call('login', { email, password }),
    signup: (name, email, password) => call('signup', { name, email, password }),
    verifyOtp: (otpToken, code) => call('otp/verify', { otpToken, code }),
    resendOtp: otpToken => call('otp/resend', { otpToken }),
  };
})();
const authMsg = x => (x && x.message) || 'Something went wrong. Please try again.';
const busy = on => { const b = document.querySelector('.login button[type=submit]'); if (b) { b.disabled = on; b.style.opacity = on ? .6 : 1; } };

/* ---------- OTP screen ---------- */
let OTP = null;
const otpView = () => `<div class="login"><form onsubmit="event.preventDefault();A.verifyOtp()"><img src="logo.png" alt="Visasra"><div class="wm">Vis<b>asra</b></div>
  <h2 style="text-align:center;margin-bottom:4px">Verify it's you</h2>
  <p class="mut" style="text-align:center;margin:0 0 16px">Enter the 6-digit code sent to<br><b style="color:var(--tx)">${esc(OTP.email)}</b></p>
  <div class="otp" id="otpRow">${[0, 1, 2, 3, 4, 5].map(i => `<input class="otpb" inputmode="numeric" maxlength="1" autocomplete="${i ? 'off' : 'one-time-code'}" data-i="${i}" oninput="otpIn(this)" onkeydown="otpKey(event,this)" onpaste="otpPaste(event)" aria-label="Digit ${i + 1}">`).join('')}</div>
  <button class="btn" style="width:100%;padding:12px" type="submit">Verify &amp; continue</button>
  <div class="otpfoot"><button type="button" class="lnk" id="rs" onclick="A.resendOtp()">Resend OTP</button><span>·</span><button type="button" class="lnk" onclick="A.otpBack()">Back</button></div></form></div>`;
function startOtp(o) {
  OTP = Object.assign({ sentAt: Date.now() }, o);
  AUTH = 'otp'; render();
  const f = document.querySelector('.otpb'); if (f) f.focus();
}
const otpBoxes = () => [...document.querySelectorAll('.otpb')];
const otpVal = () => otpBoxes().map(i => i.value).join('');
const otpClear = () => { otpBoxes().forEach(b => { b.value = ''; }); const f = otpBoxes()[0]; if (f) f.focus(); };
function otpIn(el) {
  el.value = el.value.replace(/\D/g, '').slice(-1);
  const bx = otpBoxes(), i = +el.dataset.i;
  if (el.value && bx[i + 1]) bx[i + 1].focus();
  if (otpVal().length === 6) verifyOtp();
}
function otpKey(e, el) { if (e.key === 'Backspace' && !el.value && +el.dataset.i > 0) { const p = otpBoxes()[+el.dataset.i - 1]; p.value = ''; p.focus(); } }
function otpPaste(e) {
  e.preventDefault();
  const d = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
  otpBoxes().forEach((b, i) => { b.value = d[i] || ''; });
  if (d.length === 6) verifyOtp(); else if (otpBoxes()[d.length]) otpBoxes()[d.length].focus();
}
function otpBack() { AUTH = OTP && OTP.up ? 'up' : 'in'; OTP = null; render(); }
function resendOtp() {
  const o = OTP; if (!o) return;
  if (Date.now() < o.sentAt + 30000) return toast('Please wait before asking for another OTP');
  AdminAuthAPI.resendOtp(o.token).then(r => { o.sentAt = Date.now(); if (r && r.otpToken) o.token = r.otpToken; otpClear(); toast('New OTP sent'); }).catch(x => toast(authMsg(x)));
}
let otpBusy = false;
function verifyOtp() {
  const o = OTP; if (!o || otpBusy) return;
  const code = otpVal();
  if (code.length < 6) return toast('Enter all 6 digits');
  otpBusy = true; busy(true);
  AdminAuthAPI.verifyOtp(o.token, code).then(r => {
    otpBusy = false;
    const a = (r && r.admin) || {};
    wr(K.SES, { name: a.name || o.name || o.email, email: a.email || o.email, role: a.role, token: r && r.token });
    OTP = null; AUTH = 'in'; load(); render();
  }).catch(x => {
    otpBusy = false; busy(false);
    if (x.status === 429) { OTP = null; AUTH = 'in'; render(); return toast(authMsg(x) || 'Too many attempts. Start again'); }
    if (x.status === 410) return toast('This OTP has expired. Tap Resend OTP');
    const row = $('otpRow'); if (row) { row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); }
    otpClear(); toast(x.status === 422 ? (x.message || 'Wrong OTP. Try again') : authMsg(x));
  });
}
setInterval(() => {
  const b = $('rs'), o = OTP; if (!b || !o) return;
  const left = Math.ceil((o.sentAt + 30000 - Date.now()) / 1000);
  b.textContent = left > 0 ? 'Resend in 0:' + String(left).padStart(2, '0') : 'Resend OTP'; b.disabled = left > 0;
}, 500);

/* ---------- shell ---------- */
const me = () => rd(K.SES, null);
function page(keepFocus) { const el = $('page'); if (!el) return; el.innerHTML = PAGES[U.page][1](); if (keepFocus && $('q')) { const q = $('q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
const ICO = {"overview": "<path d=\"M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/>", "bookings": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><path d=\"M8 8h8M8 12h8M8 16h5\"/>", "shop": "<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M2 10h20\"/>", "verification": "<path d=\"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z\"/><path d=\"M8.5 12l2.5 2.5 4.5-5\"/>", "more": "<circle cx=\"5\" cy=\"12\" r=\"1.6\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\"/><circle cx=\"19\" cy=\"12\" r=\"1.6\"/>"};
const ico = k => `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICO[k]}</svg></span>`;
function render() {
  const root = $('root'), u = me();
  if (!u) { root.innerHTML = authView(); return; }
  if (!D) load(); const n = counts(), bd = { bookings: n.book, verification: n.kyc, shop: n.shop, payouts: n.pay };
  const nav = GROUPS.map(([g, l]) => (g ? `<div class="grp">${g}</div>` : '') + l.map(k => `<button class="nv ${U.page === k ? 'on' : ''}" onclick="A.go('${k}')">${PAGES[k][0]}${bd[k] ? `<b>${bd[k]}</b>` : ''}</button>`).join('')).join('');
  const bn = [['overview', 'Home', 0], ['bookings', 'Bookings', n.book], ['shop', 'Payments', n.shop], ['verification', 'Verify', n.kyc]], main = bn.some(x => x[0] === U.page);
  root.innerHTML = `<div class="shell"><aside class="side"><div class="brand"><img src="logo.png" alt=""><div>Visasra<small>Admin</small></div></div>${nav}<div style="margin-top:auto;padding:10px 8px 0;font-size:12.5px"><b style="color:#fff">${esc(u.name)}</b><br><a href="#" onclick="A.logout();return false" style="color:#8DB6E6">Sign out</a></div></aside>
  <div class="main"><header class="top"><img src="logo.png" alt=""><span class="wmk">Vis<b>asra</b></span><span class="crumb">${esc((GROUPS.find(g => g[1].includes(U.page)) || [])[0] || 'Visasra Admin')}<i>/</i><b>${PAGES[U.page][0]}</b></span><span class="grow"></span><span class="usr">${av(u.name)}<span>${esc(u.name)}</span></span></header><main class="page" id="page">${PAGES[U.page][1]()}</main></div>
  <nav class="bn">${bn.map(([k, t, c]) => `<button class="${U.page === k ? 'on' : ''}" onclick="A.go('${k}')">${ico(k)}<span>${t}</span>${c ? `<b>${c}</b>` : ''}</button>`).join('')}<button class="${main ? '' : 'on'}" onclick="A.menu()">${ico('more')}<span>More</span></button></nav></div>`;
  document.title = PAGES[U.page][0] + ' · Visasra Admin';
}
const hsh = s => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return s.length + '.' + x; };
const sig = () => rd(K.ACC, []).map(a => hsh(localStorage.getItem(K.ST + a.email) || '') + ':' + hsh(localStorage.getItem(K.LV + a.email) || '')).join('|') + '#' + hsh(localStorage.getItem(K.WK) || '') + '#' + hsh(localStorage.getItem(K.ACC) || '');
let SIG = '';
{ const h = location.hash.slice(1); if (PAGES[h]) U.page = h; }
load(); SIG = sig(); render();
setInterval(() => { if (!me() || $('ov').classList.contains('on')) return; const ae = document.activeElement; if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) return; const s = sig(); if (s !== SIG) { SIG = s; load(); render(); } }, 2000);
window.addEventListener('storage', ev => { if (!ev.key || ev.key.indexOf('visasra') !== 0 || !me() || $('ov').classList.contains('on')) return; const s = sig(); if (s !== SIG) { SIG = s; load(); render(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') A.close(); });
