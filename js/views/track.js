// Live order tracking: stylised city map with a moving rider, ETA, timeline, rider card.

import { t, L, fmtMoney, fmtTime, fmtNum } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { AREAS } from '../data.js';
import { subscribe } from '../store.js';
import { findOrder, orderHistory, etaMinutes, routeProgress, FLOW, ACTIVE, rateOrder, lineName, lineOptions, riderOf, restaurantOf } from '../ops.js';
import { restLogo, avatar, toast, confetti, statusBadge } from '../ui.js';

const ROUTES = [
  'M64 236 L64 176 L178 176 L178 112 L300 112 L300 74',
  'M80 250 L150 250 L150 160 L250 160 L250 96 L318 96',
  'M56 210 L120 210 L120 132 L216 132 L216 72 L320 72',
];
const STEP_ICONS = { placed: 'receipt', accepted: 'checkCircle', preparing: 'chef', on_the_way: 'scooter', delivered: 'home' };

function mapSVG(routeD) {
  // Streets on a grid, the Nile curving through, two parks.
  const vRoads = [40, 100, 150, 200, 250, 300, 360];
  const hRoads = [50, 96, 132, 176, 220, 270];
  return `
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="map-land" width="400" height="320"/>
      <g>${vRoads.map((x) => `<line class="map-road" x1="${x}" y1="0" x2="${x}" y2="320" stroke-width="7"/>`).join('')}
         ${hRoads.map((y) => `<line class="map-road" x1="0" y1="${y}" x2="400" y2="${y}" stroke-width="7"/>`).join('')}</g>
      <line class="map-road map-road-major" x1="0" y1="300" x2="400" y2="20" stroke-width="10"/>
      <rect class="map-park" x="206" y="184" width="36" height="28" rx="6"/>
      <rect class="map-park" x="108" y="58" width="34" height="30" rx="6"/>
      <path class="map-water" d="M-10 -10 C 40 60, 10 140, 34 200 S 30 300, 6 340 L -10 340 Z"/>
      <path class="map-water" d="M330 -10 C 350 40, 400 70, 410 60 L 410 -10 Z" opacity="0.7"/>
      <path class="route-bg" d="${routeD}"/>
      <path class="route" d="${routeD}" data-route/>
      <g data-pin-rest></g>
      <g data-pin-home></g>
      <g class="rider-marker" data-rider>
        <circle r="15" fill="var(--brand)" stroke="var(--surface)" stroke-width="3"/>
        <g transform="translate(-9 -9)" style="color:#fff">${icon('scooter', 18)}</g>
      </g>
    </svg>`;
}

function pin(x, y, ic, { pulse = false, label = '' } = {}) {
  return `<g transform="translate(${x} ${y})">
      ${pulse ? '<circle class="pin-pulse" r="12" fill="var(--brand)" opacity=".5"/>' : ''}
      <circle r="14" fill="var(--surface)" stroke="var(--border-strong)" stroke-width="1"/>
      <g transform="translate(-8 -8)" style="color:${pulse ? 'var(--brand)' : 'var(--text)'}">${icon(ic, 16)}</g>
      ${label ? `<text y="28" text-anchor="middle" style="font:600 10.5px var(--font-sans);fill:var(--text-2)">${esc(label)}</text>` : ''}
    </g>`;
}

export default function track(main, { params: [id] }) {
  let order = findOrder(id);
  if (!order) {
    main.innerHTML = `<div class="container"><div class="empty" style="margin-top:40px"><div class="empty-icon">${icon('receipt', 30)}</div><h3>${t('tr.notFound')}</h3><a class="btn btn-primary" href="#/orders">${t('mo.title')}</a></div></div>`;
    return;
  }
  const r = restaurantOf(order);
  const routeD = ROUTES[[...order.id].reduce((s, c) => s + c.charCodeAt(0), 0) % ROUTES.length];
  const isMine = order.source === 'user';

  main.innerHTML = `
    <div class="container">
      <a class="back-link" href="${isMine ? '#/orders' : '#/admin/orders'}">${icon('arrowLeft', 16, 'class="flip-rtl"')} ${isMine ? t('mo.title') : t('ad.orders')}</a>
      <h1 class="page-title" style="margin-top:10px">${t('tr.title', { id: `<span class="order-id">${esc(order.id)}</span>` })}</h1>
      <p class="page-sub">${esc(L(r.name))} · ${fmtTime(order.createdAt)}</p>
      <div class="track-grid">
        <div>
          <div class="map-wrap">
            <div class="map-card card">${mapSVG(routeD)}</div>
            <div class="map-status" data-status aria-live="polite"></div>
          </div>
          <p class="demo-note">${icon('info', 15)}<span>${t('tr.note')} <a href="#/admin/orders?open=${encodeURIComponent(order.id)}" style="color:var(--brand-ink);font-weight:600">${t('tr.openDash')}</a></span></p>
        </div>
        <div style="display:grid;gap:16px">
          <section class="card card-pad" data-progress></section>
          <section class="card card-pad" data-rider-card></section>
          <section class="card card-pad">
            <h2 class="card-title" style="margin-bottom:10px">${t('tr.details')}</h2>
            <ul class="od-items" style="font-size:14px">
              ${order.lines
                .map((l) => {
                  const opts = lineOptions(l).map(L);
                  return `<li><span><span class="q" style="color:var(--brand-ink);font-weight:700">${l.qty}×</span>${esc(L(lineName(l)))}${opts.length ? `<br><small class="muted">${esc(opts.join(' · '))}</small>` : ''}</span><span>${fmtMoney(l.unit * l.qty)}</span></li>`;
                })
                .join('')}
            </ul>
            <hr class="divider" />
            <dl class="totals" style="margin-top:0">
              <div><dt>${t('subtotal')}</dt><dd>${fmtMoney(order.subtotal)}</dd></div>
              <div><dt>${t('deliveryFee')}</dt><dd>${order.fee ? fmtMoney(order.fee) : t('free')}</dd></div>
              <div><dt>${t('serviceFee')}</dt><dd>${fmtMoney(order.service)}</dd></div>
              ${order.discount ? `<div class="discount"><dt>${t('discount')}</dt><dd>−${fmtMoney(order.discount)}</dd></div>` : ''}
              <div class="grand"><dt>${t('total')}</dt><dd>${fmtMoney(order.total)}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </div>`;

  const svg = main.querySelector('.map-card svg');
  const route = svg.querySelector('[data-route]');
  const len = route.getTotalLength();
  const start = route.getPointAtLength(0);
  const end = route.getPointAtLength(len);
  svg.querySelector('[data-pin-rest]').innerHTML = pin(start.x, start.y, 'store', { label: L(r.name) });
  svg.querySelector('[data-pin-home]').innerHTML = pin(end.x, end.y, 'home', { pulse: true, label: t('tr.home') });
  route.style.strokeDasharray = `${len}`;

  let lastStatus = order.status;
  let rated = order.rating || 0;

  function paint() {
    order = findOrder(id) || order;
    const now = Date.now();
    const h = orderHistory(order, now);
    const eta = etaMinutes(order, now);
    const p = routeProgress(order, now);

    // Rider + travelled route
    const pt = route.getPointAtLength(len * p);
    svg.querySelector('[data-rider]').style.transform = `translate(${pt.x}px, ${pt.y}px)`;
    svg.querySelector('[data-rider]').style.opacity = order.status === 'cancelled' ? 0 : 1;
    route.style.strokeDashoffset = `${-len * p}`; // only the road still ahead stays drawn
    route.style.opacity = order.status === 'cancelled' ? 0.25 : 1;

    // Floating status card
    const statusEl = main.querySelector('[data-status]');
    statusEl.innerHTML = ACTIVE.has(order.status)
      ? `<div><div class="lbl">${t('tr.eta')}</div><div class="eta">${eta}<small>${t('min')}</small></div></div>
         <span class="sep"></span>
         <div style="min-width:0"><div class="lbl">${t('tr.status')}</div><div class="state">${t(`st.${order.status}`)}</div><div class="lbl">${t(`stsub.${order.status}`)}</div></div>`
      : `<div style="display:flex;align-items:center;gap:12px">${statusBadge(order.status)}<strong>${order.status === 'delivered' ? t('tr.delivered') : t('tr.cancelled')}</strong></div>`;

    // Progress card: timeline, or the delivered / cancelled panel
    const prog = main.querySelector('[data-progress]');
    const steps = order.status === 'cancelled' ? ['placed', 'cancelled'] : FLOW;
    const curIdx = steps.indexOf(order.status);
    const timeline = `<div class="timeline">${steps
      .map((s, i) => {
        const cls = s === 'cancelled' ? 'cancel done' : i < curIdx || order.status === 'delivered' ? 'done' : i === curIdx ? 'current' : '';
        return `<div class="tl-step ${cls}">
          <span class="tl-dot">${icon(s === 'cancelled' ? 'x' : STEP_ICONS[s], 16)}</span>
          <div><div class="tl-title">${t(`st.${s}`)}</div>${s !== 'cancelled' && (i <= curIdx) ? `<div class="tl-sub">${t(`stsub.${s}`)}</div>` : ''}</div>
          <span class="tl-time">${h[s] ? fmtTime(h[s]) : ''}</span>
        </div>`;
      })
      .join('')}</div>`;

    if (order.status === 'delivered' && isMine) {
      prog.innerHTML = `
        <div style="text-align:center;padding:6px 0 4px">
          <div class="empty-icon" style="margin:0 auto 10px;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--good-soft);color:var(--good-text)">${icon('checkCircle', 30)}</div>
          <h2 style="font-size:20px">${t('tr.delivered')}</h2>
          <p class="muted" style="margin-top:4px">${rated ? t('tr.thanks') : t('tr.deliveredSub')}</p>
          <div class="rate-stars" role="radiogroup" aria-label="${t('tr.rate')}">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-rate="${n}" class="${n <= rated ? 'on' : ''}" role="radio" aria-checked="${n === rated}" aria-label="${n}/5">${icon('star', 30)}</button>`).join('')}
          </div>
        </div>
        <hr class="divider" />${timeline}`;
    } else if (order.status === 'cancelled') {
      prog.innerHTML = `<div class="closed-banner" style="margin:0 0 16px">${icon('xCircle', 18)}<span>${t('tr.cancelled')} — ${t('tr.cancelledSub')}</span></div>${timeline}`;
    } else {
      prog.innerHTML = timeline;
    }

    // Rider card
    const rider = riderOf(order);
    main.querySelector('[data-rider-card]').innerHTML = rider && order.status !== 'placed'
      ? `<div class="card-sub" style="margin:0 0 10px">${t('tr.rider')}</div>
         <div class="rider-card">
           ${avatar(rider.name.en, 'lg')}
           <div class="info"><strong>${esc(L(rider.name))}</strong><small>${t(`veh.${rider.vehicle}`)} · <span class="rating" style="font-size:13px">${icon('star', 13)}${rider.rating.toFixed(1)}</span></small></div>
           <button class="icon-btn bordered" type="button" data-demo-contact aria-label="${t('tr.chat')}">${icon('chat', 19)}</button>
           <button class="btn btn-primary btn-sm" type="button" data-demo-contact>${icon('phone', 16)} ${t('tr.call')}</button>
         </div>`
      : `<div class="rider-card"><span class="avatar lg" style="background:var(--surface-2);color:var(--muted)">${icon('scooter', 22)}</span><div class="info"><strong>${t('tr.noRider')}</strong><small>${esc(L(AREAS[order.customer?.area] || AREAS.zamalek))}</small></div></div>`;

    if (lastStatus !== 'delivered' && order.status === 'delivered' && isMine) confetti();
    lastStatus = order.status;
  }

  paint();
  requestAnimationFrame(() => svg.querySelector('[data-rider]').classList.add('ready'));

  main.addEventListener('click', (e) => {
    const rate = e.target.closest('[data-rate]');
    if (rate) {
      rated = Number(rate.dataset.rate);
      rateOrder(order.id, rated);
      toast(t('tr.thanks'), { icon: 'star' });
      paint();
    } else if (e.target.closest('[data-demo-contact]')) {
      toast(t('tr.demoOnly'), { icon: 'info' });
    }
  });

  const timer = setInterval(paint, 1000);
  const unsub = subscribe((reason) => {
    if (reason === 'tick' || reason === 'sync' || reason.startsWith('order')) paint();
  });
  return () => {
    clearInterval(timer);
    unsub();
  };
}
