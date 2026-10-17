/* Visasra Admin v2 — adds finance, activity log, editable settings + team, proper dialogs, payment proof, exports. Loads after admin.js */
const SETK = 'visasra_admin_settings_v1', LOGK = 'visasra_admin_log_v1';
{ const S = rd(SETK, {}); if (S.fee != null) FEE = S.fee; if (S.pay != null) PAY = S.pay; if (S.lead != null) LEAD = S.lead; if (S.admins && S.admins.length) ADMINS.splice(0, ADMINS.length, ...S.admins); }
const saveS = () => wr(SETK, { fee: FEE, pay: PAY, lead: LEAD, admins: ADMINS });
const log = (type, text) => { const l = rd(LOGK, []); l.unshift({ ts: Date.now(), by: (me() || {}).name || 'System', type, text }); wr(LOGK, l.slice(0, 300)); };
document.head.insertAdjacentHTML('beforeend', `<style>#md{display:none;position:fixed;inset:0;z-index:80}.mdb{position:absolute;inset:0;background:rgba(9,28,56,.55);display:grid;place-items:center;padding:14px}.mdc{background:#fff;border-radius:18px;padding:22px;width:min(440px,100%);max-height:90%;overflow:auto}.mdc h3{margin:0 0 6px;font-size:19px}.acts{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}.chart{width:100%;height:auto;display:block}.chart text{font:600 10.5px system-ui;fill:#8B9CB5}.rs{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.rs button{border:1.5px dashed var(--bd);background:#fff;border-radius:99px;padding:4px 11px;font-size:12px;color:var(--dim)}@media(max-width:860px){.mdb{place-items:end center;padding:0}.mdc{border-radius:20px 20px 0 0;width:100%}}</style>`);
const md = document.createElement('div'); md.id = 'md'; document.body.appendChild(md);
const dlg = h => { md.innerHTML = `<div class="mdb" onclick="if(event.target===this)A.mclose()"><div class="mdc">${h}</div></div>`; md.style.display = 'block'; };
A.mclose = () => { md.style.display = 'none'; md.innerHTML = ''; };
const ask = (t, x, label, cls, fn, arg) => dlg(`<h3>${t}</h3><p class="mut" style="margin:6px 0 0">${x}</p><div class="acts"><button class="btn x" onclick="A.mclose()">Cancel</button><button class="btn ${cls}" ${ref(fn, arg)}>${label}</button></div>`);
const fld = (id, l, v, t, x) => `<div class="field"><label for="${id}">${l}</label><input class="inp" id="${id}" type="${t || 'text'}" ${x || ''} value="${esc(v == null ? '' : v)}"></div>`;
const csv = (n, rows) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv' })); a.download = n; document.body.appendChild(a); a.click(); a.remove(); toast('Downloaded ' + n); };
const bars = (v, l, col, f) => { const W = 620, H = 200, n = v.length, mx = Math.max(1, ...v), bw = W / n; return `<svg class="chart" viewBox="0 0 ${W} ${H}">` + v.map((x, i) => { const h = (H - 44) * x / mx, xx = i * bw + bw * .18, cx = xx + bw * .32; return `<rect x="${xx}" y="${H - 24 - h}" width="${bw * .64}" height="${Math.max(h, x ? 3 : 0)}" rx="5" fill="${col}" opacity="${x ? 1 : .25}"><title>${l[i]}: ${f ? f(x) : x}</title></rect>` + (n <= 10 && x ? `<text x="${cx}" y="${H - 28 - h}" text-anchor="middle" style="fill:#092B55">${f ? f(x) : x}</text>` : '') + (n <= 14 || i % Math.ceil(n / 10) === 0 ? `<text x="${cx}" y="${H - 8}" text-anchor="middle">${l[i]}</text>` : ''); }).join('') + '</svg>'; };
const comp = (f, max, cb) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .75)); }; im.src = r.result; }; r.readAsDataURL(f); };

/* ---------- overview chart ---------- */
{ const o0 = PAGES.overview[1]; PAGES.overview[1] = () => { let c = ''; try { c = overviewChart(); } catch (e) { console.error('chart', e); c = ''; } return o0() + `<div style="margin-top:14px">${c}</div>`; }; }

/* ---------- finance ---------- */
U.f.fr = '30';
const finRows = () => { const t = today(), n = U.f.fr === 'all' ? 60 : +U.f.fr, from = addD(t, -(n - 1)); return { t, n, from, bs: D.B.filter(b => !b.refunded && b.iso >= from && b.iso <= addD(t, 400)) }; };
PAGES.finance = ['Finance', () => {
  const { t, n, from, bs } = finRows(), done = bs.filter(b => b.st === 'completed'), col = bs.reduce((a, b) => a + b.total, 0), fees = bs.reduce((a, b) => a + (b.fee || 0), 0), wpay = done.length * PAY;
  const sp = D.P.filter(p => bs.includes(p.b)), paid = sp.filter(p => p.st === 'paid').reduce((a, p) => a + p.amt, 0), due = sp.filter(p => p.st !== 'paid').reduce((a, p) => a + p.amt, 0);
  const ref2 = D.B.filter(b => b.refunded && b.iso >= from).reduce((a, b) => a + b.total, 0), held = D.C.reduce((a, c) => a + (c.wallet.balance || 0), 0);
  const days = []; const ahead = Math.max(1, ...bs.map(b => Math.round((new Date(b.iso + 'T00:00') - new Date(t + 'T00:00')) / 864e5))); for (let i = n - 1; i >= -ahead; i--) { const d = addD(t, -i), x = bs.filter(b => b.iso === d), c = x.filter(b => b.st === 'completed'); days.push({ d, n: x.length, col: x.reduce((a, b) => a + b.total, 0), fee: x.reduce((a, b) => a + (b.fee || 0), 0), done: c.length }); }
  const k = (l, v, s, c) => `<div class="card kpi" style="--c:${c};cursor:default">${kicon(l)}<div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`, ch = days.filter(r => r.d <= addD(t, 1)).slice(-30);
  return head('Finance', 'Money in, money out and what Visasra keeps. Product amounts pass through to the shops.', `<button class="btn o" onclick="A.exportFin()">Export</button>`) + chips('fr', [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All']]) +
    `<div class="grid g4" style="margin-bottom:14px">${k('Collected', inr(col), bs.length + ' bookings', '#1261B5')}${k('Slot fees', inr(fees), 'Visasra’s share', '#2F7D4A')}${k('Shop payments', inr(paid + due), inr(paid) + ' paid · ' + inr(due) + ' due', '#B26A00')}${k('Worker earnings', inr(wpay), done.length + ' slots × ' + inr(PAY), '#A8206F')}</div>
    <div class="grid g2"><div class="card pad"><div class="b" style="font-size:16px;margin-bottom:8px">Collected per day</div>${bars(ch.map(r => r.col), ch.map(r => r.d.slice(5).replace('-', '/')), '#1261B5', inr)}</div>
    <div class="grid" style="align-content:start">${k('Net revenue (estimate)', inr(fees - wpay), 'Slot fees − worker earnings', fees - wpay >= 0 ? '#2F7D4A' : '#B3261E')}${k('Refunded to wallets', inr(ref2), 'in this period', '#5B6B82')}${k('Held in customer wallets', inr(held), 'owed back if withdrawn', '#5B6B82')}</div></div>
    <div style="margin-top:14px">${table(['Date', 'Bookings', 'Collected', 'Slot fees', 'Completed'], days.filter(r => r.n).reverse().map(r => row('style="cursor:default"', [['Date', `<b>${dayL(r.d)}</b>`], ['Bookings', r.n], ['Collected', inr(r.col)], ['Slot fees', inr(r.fee)], ['Completed', r.done]])))}</div>`;
}];
PAGES.activity = ['Activity log', () => { const l = rd(LOGK, []).filter(x => match(x.text, x.by, x.type)); return head('Activity log', 'Every action taken in this dashboard.') + search('Search activity') + (l.length ? table(['When', 'By', 'Type', 'What happened'], l.slice(0, 150).map(x => row('style="cursor:default"', [['When', fmtTs(x.ts)], ['By', esc(x.by)], ['Type', pill(x.type, 'k-' + String(x.type).replace(/[^a-z]/gi, '').toLowerCase())], ['What', esc(x.text)]]))) : empty('No activity yet', 'Approvals, payments and refunds you make are recorded here.')); }];
GROUPS.splice(3, 0, ['Business', ['finance', 'activity']]);

/* ---------- settings + team ---------- */
PAGES.settings = ['Settings', () => {
  const u = me() || {};
  return head('Settings', 'Business rules, team access and exports.', `<button class="btn" onclick="A.saveSet()">Save changes</button>`) + `<div class="grid g2" style="align-items:start">
  <div class="grid" style="align-content:start"><div class="card pad"><div class="b" style="font-size:16px;margin-bottom:10px">Business rules</div>${fld('sFee', 'Slot fee (₹)', FEE, 'number', 'min="0" max="100000" step="1" data-whole="1"')}${fld('sPay', 'Worker pay per slot (₹)', PAY, 'number', 'min="0" max="100000" step="1" data-whole="1"')}${fld('sLead', 'Accepting opens (hours before slot)', LEAD, 'number', 'min="0" max="72" step="1" data-whole="1"')}<div class="note" style="margin:0">Used here for slot status and finance. The customer and worker apps will follow them once everything runs on a backend.</div></div>
  <div class="card pad"><div class="b" style="font-size:16px;margin-bottom:8px">Exports</div><div class="row wrap"><button class="btn o" onclick="A.exportBk()">Export bookings</button><button class="btn o" onclick="A.exportPo()">Export payouts</button></div></div></div>
  <div class="card pad"><div class="row" style="margin-bottom:8px"><div class="b grow" style="font-size:16px">Team</div><button class="btn o s" onclick="A.addAdmin()">+ Add admin</button></div>${ADMINS.map(a => `<div class="row" style="padding:10px 0;border-top:1px solid #E6EEF8">${av(a.name)}<div class="grow"><b>${esc(a.name)}</b>${a.email === u.email ? ' ' + pill('You', 'g') : ''}<div class="sm mut">${esc(a.email)} · ${esc(a.role || 'Admin')}</div></div>${a.email !== u.email ? `<button class="btn x s" ${ref('delAdmin', a.email)}>Remove</button>` : ''}</div>`).join('')}<div style="margin-top:14px"><button class="btn x" onclick="A.logout()">Sign out</button></div></div></div>`;
}];
Object.assign(A, {
  saveSet() { const n = id => Math.max(0, Math.round(+$(id).value || 0)); const f = n('sFee'), y = n('sPay'), l = n('sLead'); if (f > 100000 || y > 100000) return toast('Fee and pay can be at most ₹1,00,000'); if (l > 72) return toast('Accepting window can be at most 72 hours'); FEE = f; PAY = y; LEAD = l; saveS(); log('settings', 'Updated business rules'); toast('Settings saved'); A.refresh(); },
  addAdmin() { dlg(`<h3>Add an admin</h3><p class="mut" style="margin:4px 0 12px">They sign in with this email and password.</p>${fld('aN', 'Name', '', 'text', 'maxlength="60" data-g="letters"')}${fld('aE', 'Email', '', 'email', 'maxlength="120"')}${fld('aP', 'Password (6+ characters)', '', 'password', 'maxlength="64"')}<div class="field"><label>Role</label><select class="inp" id="aR"><option>Admin</option><option>Support</option><option>Finance</option></select></div><div class="acts"><button class="btn x" onclick="A.mclose()">Cancel</button><button class="btn" onclick="A.doAddAdmin()">Add admin</button></div>`); },
  doAddAdmin() { const name = $('aN').value.trim(), email = $('aE').value.trim().toLowerCase(), pass = $('aP').value; if (!name || !/^[\p{L}\p{M}\s.'’\-]+$/u.test(name)) return toast('Name can only contain letters'); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Enter a valid email'); if (pass.length < 6) return toast('Password needs 6+ characters'); if (ADMINS.some(a => a.email === email)) return toast('That email is already an admin'); ADMINS.push({ name, email, pass, role: $('aR').value }); saveS(); log('settings', 'Added admin ' + name); A.mclose(); toast(name + ' added'); A.refresh(); },
  delAdmin(e) { const a = ADMINS.find(x => x.email === e); ask('Remove ' + esc(a.name) + '?', 'They will no longer be able to sign in.', 'Remove', 'd', 'doDelAdmin', e); },
  doDelAdmin(e) { const i = ADMINS.findIndex(x => x.email === e), a = ADMINS[i]; ADMINS.splice(i, 1); saveS(); log('settings', 'Removed admin ' + a.name); A.mclose(); toast('Admin removed'); A.refresh(); },
  exportBk() { csv('visasra-bookings.csv', [['Order', 'Date', 'Slot', 'Customer', 'Email', 'Items', 'Value', 'Shopper', 'Status']].concat(D.B.map(b => [b.ref, b.iso, b.win.l, b.cust.name, b.email, b.items.length, b.total, b.worker ? b.worker.name : '', ST[b.st][0]]))); },
  exportPo() { csv('visasra-payouts.csv', [['Worker', 'Phone', 'Type', 'Requested', 'Amount', 'Status', 'Reference']].concat(D.PO.map(p => [p.w.name, p.w.phone, p.type || 'weekly', p.date, p.amount, p.st, p.utr || '']))); },
  exportFin() { const { bs } = finRows(); csv('visasra-finance.csv', [['Date', 'Order', 'Customer', 'Collected', 'Slot fee', 'Status']].concat(bs.map(b => [b.iso, b.ref, b.cust.name, b.total, b.fee || 0, ST[b.st][0]]))); },

  /* dialogs replace the old browser pop-ups; every action is logged */
  unassign(id) { const b = fb(id); ask('Unassign shopper?', esc(b.worker ? b.worker.name : 'The shopper') + ' is removed and the slot opens up for another worker.', 'Unassign', 'd', 'doUnassign', id); },
  doUnassign(id) { const b = fb(id); mutS(b, s => { s.shopper = null; s.stage = 'scheduled'; s.status = 'scheduled'; }); log('booking', 'Unassigned the shopper from ' + b.cust.name + '’s slot'); A.mclose(); toast('Shopper removed'); A.refresh(id); },
  refund(id) { const b = fb(id), s = b.s; if (s && s.shopper && ['heading_to_store', 'shopping', 'purchased'].includes(s.stage)) return toast('Shopping already started — finish or unassign first'); ask('Refund ' + inr(b.total) + '?', 'The full amount goes to ' + esc(b.cust.name) + '’s Visasra Money wallet and the booking is marked refunded.', 'Refund', 'd', 'doRefund', id); },
  doRefund(id) {
    const b = fb(id); mutC(b.email, s => { (s.orders || []).forEach(o => { if (o.slot && o.slot.id === b.key) { o.refunded = true; o.status = 'Refunded'; } }); s.wallet.balance = (s.wallet.balance || 0) + b.total; s.wallet.transactions.unshift({ id: uid(), type: 'credit', amount: b.total, note: 'Refund — ' + b.ref, date: new Date(now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }); });
    if (b.s && b.s.shopper) mutS(b, s => { s.shopper = null; s.stage = 'scheduled'; s.status = 'scheduled'; });
    log('wallet', 'Refunded ' + inr(b.total) + ' to ' + b.cust.name + ' (' + b.ref + ')'); A.mclose(); toast(inr(b.total) + ' refunded'); A.refresh(id);
  },
  suspend(k) { const w = fw(k); w.suspended ? A.doSuspend(k) : ask('Suspend ' + esc(w.name) + '?', 'They go offline and should not accept new slots until reactivated.', 'Suspend', 'd', 'doSuspend', k); },
  doSuspend(k) { const w = fw(k); mutW(k, x => { x.suspended = !x.suspended; if (x.suspended) x.online = false; }); log('worker', (w.suspended ? 'Reactivated ' : 'Suspended ') + w.name); A.mclose(); toast(w.suspended ? 'Reactivated' : 'Suspended'); A.refresh('w:' + k); },
  kycNo(k) { const w = fw(k); dlg(`<h3>Reject verification</h3><p class="mut" style="margin:4px 0 0">${esc(w.name)} sees your reason and can upload again.</p><div class="rs">${['Photo is blurry', 'Document is cut off', 'Name does not match', 'Number does not match the photo', 'Face not clearly visible', 'License is expired or unreadable'].map(r => `<button onclick="A.rsn(this.textContent)">${r}</button>`).join('')}</div><textarea class="inp" id="rs" rows="3" maxlength="300" placeholder="Tell the worker what to fix"></textarea><div class="acts"><button class="btn x" onclick="A.mclose()">Cancel</button><button class="btn d" ${ref('doKycNo', k)}>Reject &amp; notify</button></div>`); },
  rsn(t) { const e = $('rs'); e.value = e.value ? e.value.replace(/[. ]*$/, '') + '. ' + t : t; },
  doKycNo(k) { const r = $('rs').value.trim(); if (!r) return toast('Add a reason for the worker'); const w = fw(k); mutW(k, x => { x.kyc.status = 'rejected'; x.kyc.reason = r; x.kyc.reviewedAt = Date.now(); }); log('verification', 'Rejected ' + w.name + ' — ' + r); A.mclose(); toast('Sent back to ' + w.name); A.refresh(); },
  payout(v) { const [k, i] = v.split('|'), w = fw(k), p = w.payouts[+i]; dlg(`<h3>Pay ${inr(p.amount)} to ${esc(w.name)}</h3><p class="mut" style="margin:4px 0 12px">${p.type === 'emergency' ? 'Emergency withdrawal' : 'Weekly payout'}. Send the money first, then record it here.</p>${fld('ut', 'Bank / UPI reference (optional)', '')}<div class="acts"><button class="btn x" onclick="A.mclose()">Cancel</button><button class="btn g" ${ref('doPayout', v)}>Mark as paid</button></div>`); },
  doPayout(v) { const [k, i] = v.split('|'), w = fw(k), utr = ($('ut').value || '').trim() || 'UTR' + Math.floor(Math.random() * 9e9 + 1e9); mutW(k, x => { x.payouts[+i].paidAt = Date.now(); x.payouts[+i].utr = utr; }); log('payout', 'Paid ' + inr(w.payouts[+i].amount) + ' to ' + w.name + ' (' + utr + ')'); A.mclose(); toast('Payout recorded'); A.refresh(); },

  /* shop payment now needs a payment screenshot as proof */
  payShop(id) { MF.id = id; MF.proof = ''; A.payModal(); },
  payModal() { const p = D.P.find(x => x.id === MF.id); dlg(`<h3>Mark as paid</h3><p class="mut" style="margin:4px 0 12px">Pay <b>${inr(p.amt)}</b> to <b>${esc(p.store)}</b> using the QR, then attach the payment screenshot as proof.</p><label style="display:block;border:1.5px dashed var(--bl);border-radius:12px;padding:14px;text-align:center;color:var(--bl);font-weight:700;cursor:pointer">${MF.proof ? `<img src="${MF.proof}" alt="" style="max-height:150px;border-radius:8px;display:block;margin:0 auto 6px">Change screenshot` : 'Attach payment screenshot'}<input type="file" accept="image/*" hidden onchange="A.pick(this)"></label><div class="acts"><button class="btn x" onclick="A.mclose()">Cancel</button><button class="btn g" onclick="A.doPay()">Confirm payment</button></div>`); },
  pick(i) { const f = i.files[0]; if (f) comp(f, 900, d => { MF.proof = d; A.payModal(); }); },
  doPay() { const p = D.P.find(x => x.id === MF.id); if (!MF.proof) return toast('Attach the payment screenshot first'); mutS(p.b, s => { const x = s.products.find(y => y.itemId === p.p.itemId); x.payment = Object.assign({}, x.payment || {}, { status: 'paid', proof: MF.proof, paidAt: Date.now(), amount: p.amt }); }); log('payment', 'Paid ' + inr(p.amt) + ' to ' + p.store + ' for ' + p.name); A.mclose(); toast('Marked paid — worker can buy it now'); A.refresh(); },
});
const MF = { id: '', proof: '' };
{ const d = A.doAssign; A.doAssign = v => { const [id, wk] = v.split('~'), b = fb(id), w = fw(wk); d(v); if (b && w) log('booking', 'Assigned ' + w.name + ' to ' + b.cust.name + '’s slot on ' + dayL(b.iso)); }; }
{ const d = A.kycOk; A.kycOk = k => { const w = fw(k); d(k); log('verification', 'Approved ' + w.name); }; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') A.mclose(); });
load(); render();

/* ---------- Overview: weekly activity card ---------- */
function overviewChart() {
  const t = today(), N = 7, days = [], live = D.B.filter(b => !b.refunded);
  for (let i = N - 1; i >= 0; i--) { const d = addD(t, -i), bs = live.filter(b => b.iso === d); days.push({ d, n: bs.length, v: bs.reduce((a, b) => a + (b.total || 0), 0), dow: DOW[new Date(d + 'T00:00').getDay()], dm: new Date(d + 'T00:00').getDate() }); }
  const prev = live.filter(b => b.iso >= addD(t, -2 * N + 1) && b.iso <= addD(t, -N)).length;
  const tot = days.reduce((a, x) => a + x.n, 0), val = days.reduce((a, x) => a + x.v, 0), best = days.reduce((a, x) => x.n > a.n ? x : a, days[0]);
  const delta = prev ? Math.round((tot - prev) / prev * 100) : null;
  const W = 640, H = 250, L = 34, R = 14, T = 30, B = 46, pw = W - L - R, ph = H - T - B;
  const mx = Math.max(4, Math.ceil(Math.max(...days.map(x => x.n)) / 2) * 2), X = i => L + pw * (i + .5) / N, Y = v => T + ph - ph * v / mx;
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = mx * k / 4, y = Y(v); g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="${k ? '#DCE7F4' : '#B9CCE4'}" ${k ? 'stroke-dasharray="3 5"' : ''}/><text x="${L - 8}" y="${y + 4}" text-anchor="end" class="ax">${Number.isInteger(v) ? v : v.toFixed(1)}</text>`; }
  const P = days.map((x, i) => [X(i), Y(x.n)]);
  let line = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 1; i < P.length; i++) { const cx = (P[i - 1][0] + P[i][0]) / 2; line += `C${cx} ${P[i - 1][1]} ${cx} ${P[i][1]} ${P[i][0]} ${P[i][1]}`; }
  const area = line + `L${P[N - 1][0]} ${Y(0)}L${P[0][0]} ${Y(0)}Z`;
  g += `<rect x="${X(N - 1) - pw / N / 2 + 3}" y="${T - 8}" width="${pw / N - 6}" height="${ph + 8}" rx="10" fill="#1B5AA6" opacity=".07"/>`;
  g += `<path d="${area}" fill="url(#ocg)"/><path d="${line}" fill="none" stroke="#1B5AA6" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  days.forEach((x, i) => { const [cx, cy] = P[i], td = i === N - 1;
    g += `<g><title>${x.dow} ${x.dm}: ${x.n} booking${x.n === 1 ? '' : 's'} · ${inr(x.v)}</title><circle cx="${cx}" cy="${cy}" r="${td ? 7 : 5}" fill="${td ? '#1B5AA6' : '#fff'}" stroke="#1B5AA6" stroke-width="2.6"/></g>`
      + (x.n ? `<text x="${cx}" y="${cy - 13}" text-anchor="middle" class="vl${td ? ' td' : ''}">${x.n}</text>` : '')
      + `<text x="${cx}" y="${H - 24}" text-anchor="middle" class="dw${td ? ' td' : ''}">${td ? 'Today' : x.dow}</text><text x="${cx}" y="${H - 9}" text-anchor="middle" class="dd">${x.dm}</text>`; });
  const chip = delta === null ? '' : `<span class="dl ${delta >= 0 ? 'up' : 'dn'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs previous 7 days</span>`;
  return `<div class="card wk"><div class="wk-main"><div class="row wrap" style="margin-bottom:6px"><div class="grow"><div class="b" style="font-size:16px">Bookings this week</div><div class="sm mut">Slots booked each day, last 7 days</div></div>${chip}</div>
    <svg viewBox="0 0 ${W} ${H}" class="wk-svg" role="img" aria-label="Bookings per day, last 7 days"><defs><linearGradient id="ocg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B5AA6" stop-opacity=".34"/><stop offset="1" stop-color="#1B5AA6" stop-opacity=".02"/></linearGradient></defs>${g}</svg></div>
    <div class="wk-side"><div class="ws"><span>Total bookings</span><b>${tot}</b></div><div class="ws"><span>Booking value</span><b>${inr(val)}</b></div><div class="ws"><span>Busiest day</span><b>${best.n ? (best.d === t ? 'Today' : best.dow + ' ' + best.dm) : '—'}</b><small>${best.n ? best.n + ' booking' + (best.n === 1 ? '' : 's') : 'No bookings yet'}</small></div></div></div>`;
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

