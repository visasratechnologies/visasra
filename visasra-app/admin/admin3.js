/* Visasra Admin v3 — live shopper tracking. Loads after admin2.js. Reads session.location / session.store written by the worker app. */
const STAGE_L = { assigned: 'Assigned · not started', heading_to_store: 'On the way', shopping: 'Shopping now', purchased: 'Purchased · packing' };
const STALE_MIN = 5;
const agoL = t => { if (!t) return 'no signal yet'; const m = Math.max(0, Math.round((now() - t) / 6e4)); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.round(m / 60) + ' h ago'; };
const isStale = l => !l || !l.updatedAt || (now() - l.updatedAt) / 6e4 > STALE_MIN;
const mapsUrl = l => 'https://www.google.com/maps?q=' + l.lat + ',' + l.lng;

/* sessions that a shopper is actively working on */
function liveJobs() {
  return D.B.filter(b => !b.refunded && b.s && b.s.shopper && b.st !== 'completed' && b.iso === today())
    .map(b => ({ b, s: b.s, loc: b.s.location, store: b.s.store, on: ['heading_to_store', 'shopping', 'purchased'].includes(b.s.stage) && b.s.status !== 'completed' }));
}

/* schematic map — no internet needed; same projection idea as the customer + worker apps */
function liveMap(jobs) {
  const W = 700, H = 360, pad = 56, pts = [];
  jobs.forEach(j => { if (j.store) pts.push(j.store); if (j.loc) pts.push(j.loc); });
  if (!pts.length) return '';
  let la0 = Math.min(...pts.map(p => p.lat)), la1 = Math.max(...pts.map(p => p.lat)), ln0 = Math.min(...pts.map(p => p.lng)), ln1 = Math.max(...pts.map(p => p.lng));
  const dla = Math.max(la1 - la0, .01), dln = Math.max(ln1 - ln0, .01); la0 -= dla * .12; la1 += dla * .12; ln0 -= dln * .12; ln1 += dln * .12;
  const X = v => pad + (v - ln0) / (ln1 - ln0) * (W - 2 * pad), Y = v => H - pad - (v - la0) / (la1 - la0) * (H - 2 * pad);
  let g = '';
  for (let i = 1; i < 8; i++) g += `<path d="M${i * W / 8} 0V${H}" stroke="#D6E3F3" stroke-width="1"/>`;
  for (let i = 1; i < 5; i++) g += `<path d="M0 ${i * H / 5}H${W}" stroke="#D6E3F3" stroke-width="1"/>`;
  const seen = {};
  jobs.forEach(j => { if (j.store && j.loc && j.on) g += `<path d="M${X(j.loc.lng)} ${Y(j.loc.lat)}L${X(j.store.lng)} ${Y(j.store.lat)}" stroke="#1261B5" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`; });
  jobs.forEach(j => { if (!j.store) return; const k = j.store.lat + ',' + j.store.lng; if (seen[k]) return; seen[k] = 1; const x = X(j.store.lng), y = Y(j.store.lat);
    g += `<g transform="translate(${x} ${y})"><path d="M0 0C-16-16-16-34 0-34S16-16 0 0Z" fill="#FF8A00" stroke="#fff" stroke-width="2.5"/><rect x="-6" y="-27" width="12" height="9" rx="2" fill="#fff"/></g>`; });
  jobs.forEach(j => { if (!j.loc || !j.on) return; const x = X(j.loc.lng), y = Y(j.loc.lat), c = isStale(j.loc) ? '#E07B00' : '#1261B5', w = j.b.worker || j.s.shopper;
    g += `<g transform="translate(${x} ${y})" style="cursor:pointer" ${ref('open', j.b.id)}><circle r="20" fill="${c}" opacity=".18"/><circle r="13" fill="${c}" stroke="#fff" stroke-width="3"/><text y="3.5" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff">${esc(ini(w.name))}</text><text y="-20" text-anchor="middle" font-size="11" font-weight="800" fill="#092B55">${esc(String(w.name).split(' ')[0])}</text></g>`; });
  return `<div class="card" style="overflow:hidden;margin-bottom:14px"><svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block;background:#F4F9FF">${g}</svg>
  <div class="row wrap sm mut" style="padding:10px 14px;border-top:1px solid var(--bd);gap:16px"><span><b style="color:#1261B5">●</b> Shopper</span><span><b style="color:#E07B00">●</b> No recent signal</span><span class="grow r" style="min-width:140px">Tap a shopper for details</span></div></div>`;
}

function liveRow(j) {
  const w = j.b.worker || j.s.shopper, l = j.loc, stale = j.on && isStale(l);
  return `<div class="card pad row" style="margin-bottom:8px;cursor:pointer" ${ref('open', j.b.id)}>${av(w.name)}<div class="grow"><b>${esc(w.name)}</b> <span class="mut">→ ${esc(j.b.cust.name)}</span>
    <div class="sm mut">${STAGE_L[j.s.stage] || j.s.stage}</div>
    <div class="sm mut">${j.b.win.l}${j.on && l ? ' · ' + (l.etaMin ? 'ETA ' + l.etaMin + ' min · ' : '') + 'updated ' + agoL(l.updatedAt) : ''}</div></div>
    ${l && j.on ? `<a class="btn x s" href="${mapsUrl(l)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Maps</a>` : ''}${j.on ? (stale ? pill('No signal', 'o') : pill('Live', 'g')) : pill('Not started', 'n')}</div>`;
}

PAGES.live = ['Live tracking', () => {
  const all = liveJobs(), on = all.filter(j => j.on), idle = all.filter(j => !j.on);
  const stale = on.filter(j => isStale(j.loc)).length;
  return head('Live tracking', 'Where today’s shoppers are, from the location they share in the worker app.')
    + (stale ? `<div class="note w"><b>${stale} shopper${stale > 1 ? 's' : ''} without a recent signal.</b> Their last location is older than ${STALE_MIN} minutes. Call them to check.</div>` : '')
    + (on.length ? liveMap(on) : empty('Nobody is out shopping right now', 'Shoppers appear here as soon as they tap “Start” on a slot in the worker app.'))
    + (on.length ? `<div class="sec">On the move (${on.length})</div>${on.map(liveRow).join('')}` : '')
    + (idle.length ? `<div class="sec">Assigned for today, not started (${idle.length})</div>${idle.map(liveRow).join('')}` : '');
}];
GROUPS[1][1].splice(1, 0, 'live');

/* location block used inside booking + worker panels */
function locBlock(b) {
  const s = b.s; if (!s || !s.shopper || b.st === 'completed' || b.st === 'refunded') return '';
  const l = s.location, on = ['heading_to_store', 'shopping', 'purchased'].includes(s.stage);
  if (!on || !l) return `<div class="sec">Shopper location</div><div class="card pad sm mut">${esc(s.shopper.name)} hasn’t started yet, so no location is shared.</div>`;
  return `<div class="sec">Shopper location</div><div class="card pad"><div class="row"><div class="grow"><b>${STAGE_L[s.stage] || s.stage}</b><div class="sm mut">${l.etaMin ? 'About ' + l.etaMin + ' min away · ' : ''}updated ${agoL(l.updatedAt)}</div></div>${isStale(l) ? pill('No signal', 'o') : pill('Live', 'g')}</div>
  <dl class="kv" style="margin-top:10px"><dt>Position</dt><dd>${(+l.lat).toFixed(4)}, ${(+l.lng).toFixed(4)}</dd></dl>
  <div style="margin-top:10px"><a class="btn o s" href="${mapsUrl(l)}" target="_blank" rel="noopener">Open in Google Maps</a></div></div>`;
}
function workerLive(w) {
  const j = liveJobs().filter(x => x.on && x.b.worker && x.b.worker.id === w.id)[0]; if (!j) return '';
  return `<div class="sec">Right now</div>` + liveRow(j);
}



/* ---------- after packing: ship the order and tell the customer (their tracking page reads session.shipStage) ---------- */
const SHIP = [['shipped', 'Mark shipped'], ['out_for_delivery', 'Out for delivery'], ['delivered', 'Mark delivered']];
{ const bp = bookingPanel; bookingPanel = function (b) {
    bp(b);
    const s = b.s; if (!s || b.refunded || !(s.stage === 'packed' || s.status === 'completed')) return;
    const cur = s.shipStage || '', idx = SHIP.findIndex(x => x[0] === cur), nx = SHIP[idx + 1];
    let pf = document.querySelector('#ov .pf');
    if (!pf) { const pn = document.querySelector('#ov .panel'); if (!pn) return; pn.insertAdjacentHTML('beforeend', '<div class="pf"></div>'); pf = pn.querySelector('.pf'); }
    pf.insertAdjacentHTML('afterbegin', cur === 'delivered' ? '<span class="pill g">Delivered</span>' : `<span class="sm mut" style="align-self:center">${cur ? 'Now: ' + SHIP[idx][1].replace('Mark ', '') : 'Packed · not shipped yet'}</span><button class="btn g" ${ref('ship', b.id + '~' + nx[0])}>${nx[1]}</button>`);
  };
}
A.ship = v => { const [id, st] = v.split('~'), b = fb(id); if (!b) return; mutS(b, s => { s.shipStage = st; }); log('shipping', 'Marked ' + b.cust.name + '’s order ' + st.replace(/_/g, ' ')); toast('Customer can now see: ' + st.replace(/_/g, ' ')); A.refresh(id); };
