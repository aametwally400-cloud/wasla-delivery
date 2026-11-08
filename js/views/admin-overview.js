// Dashboard overview: range filter, KPI tiles, revenue trend, hour-of-day, cuisine, payments,
// live orders and top restaurants. Every panel reads the same range, so the numbers agree.

import { t, L, fmtMoney, fmtNum, fmtCompact, fmtPct, fmtDate, fmtHour, fmtTime, fmtAgo, getLang } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { subscribe } from '../store.js';
import { restaurantById } from '../data.js';
import { analytics, RANGES } from '../ops.js';
import { areaChart, columnChart, sparkline } from '../charts.js';
import { restLogo, statusBadge } from '../ui.js';
import { openOrderDrawer } from './admin-orders.js';

const RANGE_KEY = 'wasla:range';
const readRange = () => {
  try {
    return localStorage.getItem(RANGE_KEY) || '7d';
  } catch {
    return '7d';
  }
};

function delta(cur, prev, upIsGood = true) {
  if (!prev) return { cls: 'flat', text: '—', dir: 0 };
  const ch = ((cur - prev) / prev) * 100;
  if (Math.abs(ch) < 0.5) return { cls: 'flat', text: fmtPct(0, 0), dir: 0 };
  const good = ch > 0 === upIsGood;
  return { cls: good ? 'good' : 'bad', text: `${ch > 0 ? '+' : '−'}${fmtPct(Math.abs(ch))}`, dir: ch > 0 ? 1 : -1 };
}

export default function overview(main) {
  let range = RANGES[readRange()] ? readRange() : '7d';
  let view = { revenue: 'chart', hours: 'chart' };
  let a;

  main.innerHTML = `
    <div class="toolbar">
      <div class="seg" role="group" aria-label="${t('range.label')}" data-range>
        ${Object.keys(RANGES).map((k) => `<button type="button" data-r="${k}" aria-pressed="${k === range}">${t(`range.${k}`)}</button>`).join('')}
      </div>
      <span class="grow"></span>
      <span class="live-pill"><span class="live-dot"></span><span data-updated></span></span>
    </div>
    <div class="kpi-grid" data-kpis></div>
    <div class="grid-main">
      <section class="card chart-card" aria-labelledby="rev-h">
        <div class="card-head">
          <div><h2 class="card-title" id="rev-h">${t('ch.revenue')}</h2><p class="card-sub" data-rev-sub></p></div>
          <div class="view-toggle" role="group" aria-label="${t('ch.revenue')}">
            <button type="button" data-view="revenue:chart" aria-label="${t('ch.showChart')}">${icon('chart', 16)}</button>
            <button type="button" data-view="revenue:table" aria-label="${t('ch.showTable')}">${icon('table', 16)}</button>
          </div>
        </div>
        <div data-rev></div>
      </section>
      <section class="card chart-card" aria-labelledby="live-h">
        <div class="card-head">
          <div><h2 class="card-title" id="live-h">${t('live.title')}</h2><p class="card-sub" data-live-sub></p></div>
          <a class="btn btn-ghost btn-sm" href="#/admin/orders?tab=active">${t('viewAll')} ${icon('arrowRight', 15, 'class="flip-rtl"')}</a>
        </div>
        <div class="feed" data-live></div>
      </section>
    </div>
    <div class="grid-3">
      <section class="card chart-card" aria-labelledby="hour-h">
        <div class="card-head">
          <div><h2 class="card-title" id="hour-h">${t('ch.byHour')}</h2><p class="card-sub" data-hour-sub></p></div>
          <div class="view-toggle" role="group" aria-label="${t('ch.byHour')}">
            <button type="button" data-view="hours:chart" aria-label="${t('ch.showChart')}">${icon('chart', 16)}</button>
            <button type="button" data-view="hours:table" aria-label="${t('ch.showTable')}">${icon('table', 16)}</button>
          </div>
        </div>
        <div data-hours></div>
      </section>
      <section class="card chart-card" aria-labelledby="cui-h">
        <div class="card-head"><div><h2 class="card-title" id="cui-h">${t('ch.cuisine')}</h2><p class="card-sub">${t('ch.cuisineSub')}</p></div></div>
        <div class="hbars" data-cuisine></div>
      </section>
      <section class="card chart-card" aria-labelledby="pay-h">
        <div class="card-head"><div><h2 class="card-title" id="pay-h">${t('ch.payment')}</h2><p class="card-sub">${t('ch.paymentSub')}</p></div></div>
        <div data-pay></div>
      </section>
    </div>
    <section class="card table-card" aria-labelledby="top-h">
      <div class="card-head" style="padding:20px 20px 0"><h2 class="card-title" id="top-h">${t('top.title')}</h2></div>
      <div class="table-wrap" data-top></div>
    </section>`;

  const $ = (s) => main.querySelector(s);

  function drawKPIs() {
    const { kpi, prev, series } = a;
    const vs = range === 'today' ? t('kpi.vsYesterday') : t('kpi.vsPrev');
    const tiles = [
      { key: 'revenue', icon: 'wallet', label: t('kpi.revenue'), value: fmtMoney(kpi.revenue, { compact: kpi.revenue >= 1e5 }), d: delta(kpi.revenue, prev.revenue), s: series.map((x) => x.revenue) },
      { key: 'orders', icon: 'receipt', label: t('kpi.orders'), value: fmtNum(kpi.orders), d: delta(kpi.orders, prev.orders), s: series.map((x) => x.orders) },
      { key: 'aov', icon: 'bag', label: t('kpi.aov'), value: fmtMoney(kpi.aov), d: delta(kpi.aov, prev.aov), s: series.map((x) => x.aov) },
      { key: 'delivery', icon: 'timer', label: t('kpi.delivery'), value: `${fmtNum(kpi.delivery, { maximumFractionDigits: 1 })}<small>${t('min')}</small>`, d: delta(kpi.delivery, prev.delivery, false), s: series.map((x) => x.delivery).filter(Boolean) },
    ];
    $('[data-kpis]').innerHTML = tiles
      .map(
        (k) => `
      <article class="card kpi">
        <div class="kpi-head"><span class="kpi-icon">${icon(k.icon, 18)}</span>${k.label}</div>
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-foot"><span class="delta ${k.d.cls}">${k.d.dir ? icon(k.d.dir > 0 ? 'arrowUp' : 'arrowDown', 12) : ''}${k.d.text}</span><span>${vs}</span></div>
        <div class="kpi-spark" data-spark="${k.key}"></div>
      </article>`,
      )
      .join('');
    tiles.forEach((k) => {
      const el = $(`[data-spark="${k.key}"]`);
      el.innerHTML = sparkline(k.s, { w: Math.max(80, el.clientWidth || 200) });
    });
  }

  function tableHTML(cols, rows) {
    return `<div class="data-table"><table class="table"><thead><tr>${cols.map((c, i) => `<th class="${i ? 'num' : ''}">${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<td class="${i ? 'num' : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function drawRevenue() {
    const today = range === 'today';
    $('[data-rev-sub]').textContent = today ? t('ch.revenueHourly') : t('ch.revenueDaily');
    const pts = a.series.map((s, i) => {
      const d = new Date(s.start);
      return {
        value: s.revenue,
        label: today ? fmtHour(d.getHours()) : fmtDate(s.start),
        tipLabel: today ? fmtHour(d.getHours()) : fmtDate(s.start, { weekday: 'short', day: 'numeric', month: 'short' }),
        sub: t('ch.orders', { n: fmtNum(s.orders) }) + (i === a.series.length - 1 ? ` · ${t('ch.soFar')}` : ''),
      };
    });
    const host = $('[data-rev]');
    setToggle('revenue');
    if (view.revenue === 'table') {
      host.className = '';
      host.innerHTML = tableHTML([today ? t('ch.hour') : t('ch.date'), t('col.revenue'), t('col.orders')], [...pts].reverse().map((p, i) => [esc(p.tipLabel), fmtMoney(a.series[a.series.length - 1 - i].revenue), fmtNum(a.series[a.series.length - 1 - i].orders)]));
      return;
    }
    host.innerHTML = '';
    areaChart(host, {
      points: pts,
      height: 280,
      partialLast: true,
      ariaLabel: `${t('ch.revenue')} — ${fmtMoney(a.kpi.revenue)}`,
      format: { axis: (v) => fmtCompact(v), tip: (v) => fmtMoney(v) },
    });
  }

  function drawHours() {
    const peak = a.byHour.indexOf(Math.max(...a.byHour));
    $('[data-hour-sub]').textContent = t('ch.byHourSub', { h: fmtHour(peak) });
    const host = $('[data-hours]');
    setToggle('hours');
    if (view.hours === 'table') {
      host.className = '';
      host.innerHTML = tableHTML([t('ch.hour'), t('col.orders')], a.byHour.map((v, h) => [fmtHour(h), fmtNum(v)]));
      return;
    }
    host.innerHTML = '';
    columnChart(host, {
      points: a.byHour.map((v, h) => ({ value: v, label: getLang() === 'ar' ? String(h) : fmtHour(h).replace(/\s?([AP])M/i, '$1'), tipLabel: `${fmtHour(h)}` })),
      height: 220,
      labelEvery: 4,
      ariaLabel: t('ch.byHour'),
      format: { axis: (v) => fmtCompact(v), tip: (v) => t('ch.orders', { n: fmtNum(v) }) },
    });
  }

  function drawCuisine() {
    // Twelve cuisines fit as sorted single-hue bars, so nothing needs folding into "Other".
    const top = Object.entries(a.byCuisine).sort((x, y) => y[1] - x[1]);
    const max = Math.max(...top.map(([, v]) => v), 1);
    $('[data-cuisine]').innerHTML = top
      .map(([k, v]) => {
        const label = t(`cat.${k}`);
        return `<div class="hbar" tabindex="0" title="${esc(label)}: ${fmtNum(v)}" aria-label="${esc(label)}: ${fmtNum(v)}">
          <span class="lbl">${esc(label)}</span>
          <span class="track"><span class="fill" style="width:${(v / max) * 100}%"></span></span>
          <span class="val">${fmtNum(v)}</span>
        </div>`;
      })
      .join('');
  }

  function drawPayments() {
    const parts = [
      { k: 'cash', label: t('pay.cash'), color: 'var(--series-1)' },
      { k: 'card', label: t('pay.card'), color: 'var(--series-2)' },
      { k: 'wallet', label: t('pay.wallet'), color: 'var(--series-3)' },
    ].map((p) => ({ ...p, v: a.payments[p.k] || 0 }));
    const total = parts.reduce((s, p) => s + p.v, 0) || 1;
    $('[data-pay]').innerHTML = `
      <div class="segbar" role="img" aria-label="${parts.map((p) => `${esc(p.label)} ${fmtPct((p.v / total) * 100, 0)}`).join(', ')}">
        ${parts
          .filter((p) => p.v)
          .map((p) => {
            const share = (p.v / total) * 100;
            return `<div class="seg-part" tabindex="0" style="flex:${p.v};background:${p.color}" title="${esc(p.label)} · ${fmtNum(p.v)} · ${fmtPct(share, 0)}">${share >= 14 ? fmtPct(share, 0) : ''}</div>`;
          })
          .join('')}
      </div>
      <ul class="seg-legend">
        ${parts.map((p) => `<li><i style="background:${p.color}"></i><span>${esc(p.label)}</span><span class="v">${fmtNum(p.v)}</span><span class="p">${fmtPct((p.v / total) * 100, 0)}</span></li>`).join('')}
      </ul>`;
  }

  function drawTop() {
    const rows = a.top.slice(0, 6);
    $('[data-top]').innerHTML = `
      <table class="table resp-table">
        <thead><tr><th>${t('top.rank')}</th><th>${t('col.restaurant')}</th><th class="num">${t('col.orders')}</th><th class="num">${t('col.revenue')}</th><th class="num">${t('col.aov')}</th><th class="num">${t('col.rating')}</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (x, i) => `<tr class="clickable" data-href="#/r/${x.restaurant.id}">
              <td data-hide-sm class="muted num" style="text-align:start">${i + 1}</td>
              <td><div class="cell-flex">${restLogo(x.restaurant)}<div style="min-width:0"><div class="cell-main truncate">${esc(L(x.restaurant.name))}</div><div class="cell-sub">${t(`cat.${x.restaurant.cuisine}`)}</div></div></div></td>
              <td class="num">${fmtNum(x.orders)}</td>
              <td class="num" style="font-weight:600">${fmtMoney(x.revenue)}</td>
              <td class="num" data-hide-sm>${fmtMoney(x.aov)}</td>
              <td class="num" data-hide-sm><span class="rating" style="justify-content:flex-end">${icon('star', 13)}${x.rating.toFixed(2)}</span></td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  }

  function drawLive() {
    const live = a.live;
    $('[data-live-sub]').textContent = t('live.sub', { n: live.length });
    $('[data-live]').innerHTML = live.length
      ? live
          .slice(0, 6)
          .map((o) => {
            const r = o.restaurantId;
            return `<button class="feed-item" type="button" data-open="${esc(o.id)}">
              ${restLogo(restaurantById[r])}
              <div style="min-width:0"><strong class="truncate"><span class="order-id">${esc(o.id)}</span> · ${esc(L(o.customer.name))}</strong><small>${esc(L(restaurantById[r].name))} · ${fmtAgo(o.createdAt)}</small></div>
              <div class="end">${statusBadge(o.status)}<b>${fmtMoney(o.total)}</b></div>
            </button>`;
          })
          .join('')
      : `<div class="pop-empty">${t('live.empty')}</div>`;
    $('[data-updated]').textContent = t('ad.live', { t: fmtTime(Date.now()) });
  }

  function setToggle(which) {
    main.querySelectorAll(`[data-view^="${which}:"]`).forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === `${which}:${view[which]}`));
  }

  function drawAll() {
    a = analytics(range);
    drawKPIs();
    drawRevenue();
    drawLive();
    drawHours();
    drawCuisine();
    drawPayments();
    drawTop();
  }

  drawAll();

  main.addEventListener('click', (e) => {
    const rb = e.target.closest('[data-r]');
    const vb = e.target.closest('[data-view]');
    const open = e.target.closest('[data-open]');
    const row = e.target.closest('tr[data-href]');
    if (rb) {
      range = rb.dataset.r;
      try {
        localStorage.setItem(RANGE_KEY, range);
      } catch {}
      main.querySelectorAll('[data-r]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.r === range));
      // Hold the previous frame at reduced opacity while recomputing.
      main.style.opacity = '0.6';
      requestAnimationFrame(() => {
        drawAll();
        main.style.opacity = '';
      });
    } else if (vb) {
      const [which, mode] = vb.dataset.view.split(':');
      view[which] = mode;
      which === 'revenue' ? drawRevenue() : drawHours();
    } else if (open) {
      openOrderDrawer(open.dataset.open);
    } else if (row) {
      location.hash = row.dataset.href;
    }
  });

  let pending = false;
  const refresh = (live = false) => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      a = analytics(range);
      drawLive();
      if (!live) {
        drawKPIs();
        drawCuisine();
        drawPayments();
        drawTop();
      }
    }, 150);
  };
  const unsub = subscribe((r) => {
    if (r === 'tick') refresh(true);
    else if (r === 'sync' || r.startsWith('order') || r === 'reset') refresh(false);
  });
  const timer = setInterval(() => refresh(false), 20000);
  return () => {
    unsub();
    clearInterval(timer);
  };
}

