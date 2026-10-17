/* Visasra Admin v4 — back buttons, browser back/forward, panel back, smooth page + panel transitions. Loads after admin3.js */
document.head.insertAdjacentHTML('beforeend', `<style>
.bkbtn{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--bd);background:#fff;color:var(--nv);display:grid;place-items:center;flex:none;padding:0}
.bkbtn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}.bkbtn:hover{border-color:var(--bl)}
.pt .bkbtn{width:34px;height:34px}
#page.pgin{animation:pgIn .26s cubic-bezier(.2,.8,.2,1) both}@keyframes pgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
#ov .scrim{animation:fadeIn .2s ease both}@keyframes fadeIn{from{opacity:0}to{opacity:1}}
#ov .panel{animation:panelIn .28s cubic-bezier(.2,.8,.2,1) both}@keyframes panelIn{from{transform:translateX(28px);opacity:0}to{transform:none;opacity:1}}
.mdc{animation:popIn .2s ease both}@keyframes popIn{from{transform:translateY(10px) scale(.98);opacity:0}to{transform:none;opacity:1}}
#ov .noanim,#ov .noanim.scrim,#ov .noanim .scrim{animation:none!important}
.nv,.chip,.btn,.kpi,.task,.pick,.t tbody tr,.bn button{transition:background .15s,transform .12s,box-shadow .15s,border-color .15s,color .15s}
html{scroll-behavior:smooth}
@media(max-width:860px){#ov .panel{animation-name:sheetIn}@keyframes sheetIn{from{transform:translateY(44px);opacity:0}to{transform:none;opacity:1}}.top .bkbtn{background:rgba(255,255,255,.18);border-color:transparent;color:#fff}.top .bkbtn~img{display:none}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>`);
const CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
const ovOpen = () => $('ov').classList.contains('on'), mdOpen = () => { const m = $('md'); return m && m.style.display === 'block'; };
let DEPTH = 0, NAVF = false, PST = [], ZF = null, BACKING = false;

/* ---- page navigation: every move is a real history entry, so Back / swipe-back work too ---- */
const go0 = A.go;
A.go = function (p, f) {
  if (!PAGES[p]) return;
  if (mdOpen()) A.mclose();
  if (p !== U.page || f) { try { history.pushState(null, '', '#' + p); } catch (e) {} DEPTH++; NAVF = true; }
  go0.call(A, p, f);
};
A.back = function () {
  if (mdOpen()) return A.mclose();
  if (ovOpen()) return A.close();
  if (DEPTH > 0) { DEPTH--; history.back(); } else if (U.page !== 'overview') { NAVF = true; go0.call(A, 'overview', ''); }
};
addEventListener('popstate', () => {
  if (mdOpen()) { A.mclose(); try { history.pushState(null, '', '#' + U.page); } catch (e) {} return; }
  if (ovOpen()) { A.close(); try { history.pushState(null, '', '#' + U.page); } catch (e) {} return; }
  const p = location.hash.slice(1) || 'overview';
  if (PAGES[p] && p !== U.page) { DEPTH = Math.max(0, DEPTH - 1); NAVF = true; go0.call(A, p, p === 'bookings' ? U.f.bk : ''); }
});

/* ---- panels: back to the previous record, and zoomed photos return to the record they came from ---- */
const open0 = A.open; A.open = function (id) { if (CUR && CUR !== id && !BACKING && !ZF) PST.push(CUR); open0.call(A, id); };
A.pback = function () { const id = PST.pop(); if (!id) return; BACKING = true; A.open(id); BACKING = false; };
const close0 = A.close; A.close = function () { if (ZF) { const id = ZF; ZF = null; BACKING = true; A.open(id); BACKING = false; return; } PST = []; close0.call(A); };
const zoom0 = A.zoom; A.zoom = function (src) { ZF = CUR || null; zoom0.call(A, src); };
const panel0 = panel; panel = function (t, s, b, f) {
  const was = ovOpen(); panel0(t, s, b, f);
  const pn = document.querySelector('#ov .panel'); if (!pn) return;
  if (PST.length) { const pt = pn.querySelector('.pt'); if (pt) pt.insertAdjacentHTML('afterbegin', `<button class="bkbtn" onclick="A.pback()" aria-label="Back">${CHEV}</button>`); }
  if (was) { pn.classList.add('noanim'); const sc = document.querySelector('#ov .scrim'); if (sc) sc.classList.add('noanim'); }
};

/* ---- back button in the top bar + page transition ---- */
const render0 = render; render = function () { render0.apply(this, arguments); try { decorate(); } catch (e) { console.error(e); } };
function decorate() {
  const top = document.querySelector('.top');
  if (top && !top.querySelector('.bkbtn') && (U.page !== 'overview' || DEPTH > 0)) top.insertAdjacentHTML('afterbegin', `<button class="bkbtn" onclick="A.back()" aria-label="Back">${CHEV}</button>`);
  const pg = $('page'); if (pg && NAVF) { pg.classList.remove('pgin'); void pg.offsetWidth; pg.classList.add('pgin'); NAVF = false; }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ovOpen() && !mdOpen() && U.page !== 'overview' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) A.back(); });
try { history.replaceState(null, '', '#' + U.page); } catch (e) {}
render();
