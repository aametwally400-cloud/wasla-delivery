// Orders: status tabs, search, sortable table with pagination, and the order drawer
// where ops can move an order along, cancel it, or reassign the rider.

import { t, L, fmtMoney, fmtNum, fmtTime, fmtDateTime, fmtDate } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, buildHash, startOfDay, DAY } from '../utils.js';
import { restaurantById, AREAS, RIDERS } from '../data.js';
import { subscribe } from '../store.js';
import { allOrders, findOrder, orderHistory, setOrderStatus, assignRider, riderStatuses, FLOW, ACTIVE, lineName, lineOptions, riderOf } from '../ops.js';
import { openOverlay, restLogo, avatar, statusBadge, toast, confirmDialog } from '../ui.js';

const PAGE = 12;
const NEXT = { placed: 'accepted', accepted: 'preparing', preparing: 'on_the_way', on_the_way: 'delivered' };
const PAY_ICON = { cash: 'cash', card: 'card', wallet: 'wallet' };
const maskPhone = (p) => (p && p.length >= 11 ? `${p.slice(0, 3)} ••• ${p.slice(-4)}` : p || '—');

export function openOrderDrawer(id) {
  let unsub;
  let timer;
  openOverlay({
    kind: 'drawer',
    cls: 'wide',
    label: t('od.title', { id }),
    onClose: () => {
      unsub?.();
      clearInterval(timer);
    },
    render(panel, close) {
      const draw = () => {
        const o = findOrder(id);
        if (!o) {
          panel.innerHTML = `<div class="drawer-head"><h2>${esc(id)}</h2><button class="icon-btn sm" type="button" data-x aria-label="${t('close')}">${icon('x', 20)}</button></div><div class="drawer-body"><div class="empty"><h3>${t('tr.notFound')}</h3></div></div>`;
          panel.querySelector('[data-x]').onclick = close;
          return;
        }
        const r = restaurantById[o.restaurantId];
        const h = orderHistory(o);
        const rider = riderOf(o);
        const active = ACTIVE.has(o.status);
        const steps = o.status === 'cancelled' ? ['placed', 'cancelled'] : FLOW;
        const cur = steps.indexOf(o.status);
        const riders = riderStatuses();
        const focusedSel = document.activeElement?.matches?.('[data-assign]');

        panel.innerHTML = `
          <div class="drawer-head">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <h2>${t('od.title', { id: `<span class="order-id">${esc(o.id)}</span>` })}</h2>
              ${statusBadge(o.status)}
            </div>
            <button class="icon-btn sm" type="button" data-x aria-label="${t('close')}">${icon('x', 20)}</button>
          </div>
          <div class="drawer-body">
            <div class="od-top">
              <div class="cell-flex">${restLogo(r)}<div><div class="cell-main">${esc(L(r.name))}</div><div class="cell-sub">${t('od.placedAt')} ${fmtDateTime(o.createdAt)}</div></div></div>
              <strong style="font-size:20px">${fmtMoney(o.total)}</strong>
            </div>
            ${o.source === 'user' ? `<div class="min-warn" style="background:var(--brand-soft);color:var(--brand-ink)">${icon('sparkle', 16)}<span>${t('od.yours')}</span><a href="#/track/${esc(o.id)}" style="margin-inline-start:auto;text-decoration:underline">${t('od.track')}</a></div>` : ''}

            ${
              active
                ? `<div class="od-section"><div class="od-actions">
                    <button class="btn btn-primary full" type="button" data-advance>${icon('arrowRight', 17, 'class="flip-rtl"')} ${t('od.moveTo', { s: t(`st.${NEXT[o.status]}`) })}</button>
                    <div class="field">
                      <label for="assign">${t('od.assign')}</label>
                      <select id="assign" class="select" data-assign>
                        <option value="">${t('od.unassigned')}</option>
                        ${RIDERS.map((rd) => {
                          const st = riders.find((x) => x.id === rd.id)?.status;
                          return `<option value="${rd.id}" ${o.riderId === rd.id ? 'selected' : ''} ${st === 'offline' ? 'disabled' : ''}>${esc(L(rd.name))} — ${t(`rd.${st}`)}</option>`;
                        }).join('')}
                      </select>
                    </div>
                    <button class="btn btn-danger" type="button" data-cancel style="align-self:end">${icon('xCircle', 17)} ${t('od.cancel')}</button>
                  </div></div>`
                : ''
            }

            <div class="od-section">
              <h3>${t('od.timeline')}</h3>
              <div class="timeline">
                ${steps
                  .map((s, i) => {
                    const cls = s === 'cancelled' ? 'cancel done' : o.status === 'delivered' || i < cur ? 'done' : i === cur ? 'current' : '';
                    const ic = { placed: 'receipt', accepted: 'checkCircle', preparing: 'chef', on_the_way: 'scooter', delivered: 'home', cancelled: 'x' }[s];
                    return `<div class="tl-step ${cls}"><span class="tl-dot">${icon(ic, 15)}</span><div class="tl-title">${t(`st.${s}`)}</div><span class="tl-time">${h[s] ? fmtTime(h[s]) : ''}</span></div>`;
                  })
                  .join('')}
              </div>
              ${o.status === 'delivered' && o.source === 'gen' ? `<p class="muted" style="font-size:13px;margin-top:10px">${t('od.deliveredIn', { n: o.deliveryMins })}</p>` : ''}
            </div>

            <div class="od-section">
              <h3>${t('od.items')}</h3>
              <ul class="od-items">
                ${o.lines
                  .map((l) => {
                    const opts = lineOptions(l).map(L);
                    if (l.note) opts.push(`“${l.note}”`);
                    return `<li><span><span class="q">${l.qty}×</span>${esc(L(lineName(l)))}${opts.length ? `<br><small class="muted">${esc(opts.join(' · '))}</small>` : ''}</span><span>${fmtMoney(l.unit * l.qty)}</span></li>`;
                  })
                  .join('')}
              </ul>
            </div>

            <div class="od-section grid-2" style="gap:12px">
              <div>
                <h3>${t('od.customer')}</h3>
                <div class="od-person">${avatar(typeof o.customer.name === 'object' ? o.customer.name.en : o.customer.name)}<div style="min-width:0"><strong class="truncate">${esc(L(o.customer.name))}</strong><small><span class="ltr">${esc(maskPhone(o.customer.phone))}</span> · ${esc(L(AREAS[o.customer.area] || ''))}</small></div></div>
                ${o.address?.street ? `<p class="muted" style="font-size:13px;margin-top:8px">${icon('pin', 14, 'style="display:inline;vertical-align:-2px"')} ${esc(o.address.street)}${o.address.floor ? `، ${esc(o.address.floor)}` : ''}</p>` : ''}
              </div>
              <div>
                <h3>${t('od.rider')}</h3>
                ${rider ? `<div class="od-person">${avatar(rider.name.en)}<div><strong>${esc(L(rider.name))}</strong><small>${t(`veh.${rider.vehicle}`)} · ★ ${rider.rating.toFixed(1)}</small></div></div>` : `<div class="od-person"><span class="avatar" style="background:var(--surface-3);color:var(--muted)">${icon('scooter', 18)}</span><div><strong>${t('od.unassigned')}</strong></div></div>`}
              </div>
            </div>

            <div class="od-section">
              <h3>${t('od.payment')}</h3>
              <dl class="kv">
                <div><dt>${t('col.payment')}</dt><dd>${icon(PAY_ICON[o.payment], 15, 'style="display:inline;vertical-align:-3px"')} ${t(`pay.${o.payment}`)}</dd></div>
                <div><dt>${t('subtotal')}</dt><dd>${fmtMoney(o.subtotal)}</dd></div>
                <div><dt>${t('deliveryFee')}</dt><dd>${o.fee ? fmtMoney(o.fee) : t('free')}</dd></div>
                <div><dt>${t('serviceFee')}</dt><dd>${fmtMoney(o.service)}</dd></div>
                ${o.discount ? `<div><dt>${t('discount')}</dt><dd style="color:var(--good-text)">−${fmtMoney(o.discount)}</dd></div>` : ''}
                <div style="padding-top:10px;border-top:1px solid var(--border)"><dt style="color:var(--text);font-weight:700">${t('total')}</dt><dd>${fmtMoney(o.total)}</dd></div>
              </dl>
            </div>
          </div>`;

        panel.querySelector('[data-x]').onclick = close;
        panel.querySelector('[data-advance]')?.addEventListener('click', () => {
          const next = NEXT[o.status];
          setOrderStatus(o.id, next);
          toast(t('od.moved', { id: o.id, s: t(`st.${next}`) }));
        });
        panel.querySelector('[data-cancel]')?.addEventListener('click', async () => {
          const ok = await confirmDialog({ title: t('od.cancelQ', { id: o.id }), body: t('od.cancelBody'), ok: t('od.cancelOk'), danger: true });
          if (!ok) return;
          setOrderStatus(o.id, 'cancelled');
          toast(t('od.cancelled', { id: o.id }), { type: 'error', icon: 'xCircle' });
        });
        panel.querySelector('[data-assign]')?.addEventListener('change', (e) => {
          const rid = e.target.value || null;
          assignRider(o.id, rid);
          const rd = RIDERS.find((x) => x.id === rid);
          if (rd) toast(t('od.assigned', { name: L(rd.name), id: o.id }));
        });
        if (focusedSel) panel.querySelector('[data-assign]')?.focus();
      };
      draw();
      unsub = subscribe((reason) => {
        if (reason === 'tick' || reason === 'sync' || reason.startsWith('order')) {
          if (!panel.querySelector('[data-assign]:focus')) draw();
        }
      });
      timer = setInterval(() => {
        if (!panel.querySelector('[data-assign]:focus')) draw();
      }, 5000);
    },
  });
}

export default function adminOrders(main, { query }) {
  const state = { tab: query.tab || 'all', q: query.q || '', page: 1, sort: 'time', dir: -1 };

  main.innerHTML = `
    <div class="toolbar">
      <div class="search-field">
        ${icon('search', 17)}
        <label class="sr-only" for="oq">${t('ad.search')}</label>
        <input id="oq" class="input" type="search" placeholder="${t('ad.search')}" value="${esc(state.q)}" autocomplete="off" />
      </div>
      <span class="grow"></span>
      <span class="badge">${icon('clock', 14)} ${t('orders.range')}</span>
    </div>
    <section class="card table-card">
      <div class="tabs" role="tablist" data-tabs style="padding-inline:12px"></div>
      <div class="table-wrap" data-table></div>
      <div class="pager" data-pager></div>
    </section>`;

  const tabsEl = main.querySelector('[data-tabs]');
  const tableEl = main.querySelector('[data-table]');
  const pagerEl = main.querySelector('[data-pager]');

  function rows() {
    const from = startOfDay() - 29 * DAY;
    const all = allOrders();
    const recent = [];
    for (let i = all.length - 1; i >= 0 && all[i].createdAt >= from; i--) recent.push(all[i]);
    const q = state.q.trim().toLowerCase();
    const searched = q
      ? recent.filter((o) => {
          const r = restaurantById[o.restaurantId];
          const cn = o.customer.name;
          return [o.id, r.name.ar, r.name.en, typeof cn === 'object' ? cn.ar : cn, typeof cn === 'object' ? cn.en : ''].some((s) => String(s).toLowerCase().includes(q));
        })
      : recent;
    const counts = { all: searched.length, active: 0, delivered: 0, cancelled: 0 };
    for (const o of searched) {
      if (ACTIVE.has(o.status)) counts.active++;
      else counts[o.status]++;
    }
    const filtered = searched.filter((o) => state.tab === 'all' || (state.tab === 'active' ? ACTIVE.has(o.status) : o.status === state.tab));
    if (state.sort === 'total') filtered.sort((a, b) => (a.total - b.total) * state.dir);
    else if (state.dir === 1) filtered.reverse();
    return { list: filtered, counts };
  }

  function draw() {
    const { list, counts } = rows();
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PAGE, state.page * PAGE);

    tabsEl.innerHTML = ['all', 'active', 'delivered', 'cancelled']
      .map((k) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${state.tab === k}">${t(`tab.${k}`)} <span class="cnt">${fmtNum(counts[k])}</span></button>`)
      .join('');

    const sortBtn = (key, label) =>
      `<button class="th-sort" type="button" data-sort="${key}" ${state.sort === key ? `aria-sort="${state.dir === 1 ? 'ascending' : 'descending'}"` : ''}>${label}${state.sort === key ? icon(state.dir === 1 ? 'arrowUp' : 'arrowDown', 13) : ''}</button>`;

    tableEl.innerHTML = slice.length
      ? `<table class="table resp-table">
          <thead><tr>
            <th>${sortBtn('time', t('col.order'))}</th><th>${t('col.customer')}</th><th>${t('col.restaurant')}</th>
            <th>${t('col.rider')}</th><th>${t('col.payment')}</th><th class="num">${sortBtn('total', t('col.total'))}</th><th>${t('col.status')}</th>
          </tr></thead>
          <tbody>
            ${slice
              .map((o) => {
                const r = restaurantById[o.restaurantId];
                const rider = riderOf(o);
                const isToday = o.createdAt >= startOfDay();
                return `<tr class="clickable" data-open="${esc(o.id)}" tabindex="0">
                  <td><div class="cell-main order-id">${esc(o.id)}${o.source === 'user' ? ` <span class="tag" style="font-size:10.5px;padding:1px 6px">${icon('sparkle', 10)}</span>` : ''}</div><div class="cell-sub">${isToday ? fmtTime(o.createdAt) : fmtDate(o.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div></td>
                  <td data-hide-sm><div class="cell-main">${esc(L(o.customer.name))}</div><div class="cell-sub">${esc(L(AREAS[o.customer.area] || ''))}</div></td>
                  <td><div class="cell-flex">${restLogo(r)}<span class="truncate">${esc(L(r.name))}</span></div></td>
                  <td data-hide-sm>${rider ? esc(L(rider.name)) : `<span class="muted">${t('od.unassigned')}</span>`}</td>
                  <td data-hide-sm><span class="text-2" style="display:inline-flex;align-items:center;gap:6px">${icon(PAY_ICON[o.payment], 16)} ${t(`pay.${o.payment}`)}</span></td>
                  <td class="num" style="font-weight:600">${fmtMoney(o.total)}</td>
                  <td>${statusBadge(o.status)}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>`
      : `<div class="empty"><div class="empty-icon">${icon('receipt', 28)}</div><h3>${t('orders.empty')}</h3></div>`;

    const a = list.length ? (state.page - 1) * PAGE + 1 : 0;
    const b = Math.min(state.page * PAGE, list.length);
    pagerEl.innerHTML = `
      <span>${t('pager.showing', { a: fmtNum(a), b: fmtNum(b), n: fmtNum(list.length) })}</span>
      <div class="btns">
        <button class="btn btn-secondary btn-sm" type="button" data-page="-1" ${state.page <= 1 ? 'disabled' : ''}>${icon('chevronLeft', 16, 'class="flip-rtl"')} ${t('pager.prev')}</button>
        <button class="btn btn-secondary btn-sm" type="button" data-page="1" ${state.page >= pages ? 'disabled' : ''}>${t('pager.next')} ${icon('chevronRight', 16, 'class="flip-rtl"')}</button>
      </div>`;
  }

  const syncHash = () => history.replaceState(null, '', buildHash('/admin/orders', { tab: state.tab !== 'all' ? state.tab : '', q: state.q }));

  draw();

  main.querySelector('#oq').addEventListener('input', (e) => {
    state.q = e.target.value;
    state.page = 1;
    syncHash();
    draw();
  });
  main.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    const page = e.target.closest('[data-page]');
    const sort = e.target.closest('[data-sort]');
    const row = e.target.closest('[data-open]');
    if (tab) {
      state.tab = tab.dataset.tab;
      state.page = 1;
      syncHash();
      draw();
      tabsEl.querySelector(`[data-tab="${state.tab}"]`)?.focus();
    } else if (page) {
      state.page += Number(page.dataset.page);
      draw();
    } else if (sort) {
      if (state.sort === sort.dataset.sort) state.dir *= -1;
      else {
        state.sort = sort.dataset.sort;
        state.dir = -1;
      }
      draw();
    } else if (row) {
      openOrderDrawer(row.dataset.open);
    }
  });
  main.addEventListener('keydown', (e) => {
    const row = e.target.closest('tr[data-open]');
    if (row && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openOrderDrawer(row.dataset.open);
    }
  });

  if (query.open) {
    history.replaceState(null, '', buildHash('/admin/orders', { tab: query.tab, q: query.q }));
    setTimeout(() => openOrderDrawer(query.open), 200);
  }

  let pending = false;
  const unsub = subscribe((r) => {
    if (!(r === 'tick' || r === 'sync' || r.startsWith('order') || r === 'reset')) return;
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      draw();
    }, 200);
  });
  const timer = setInterval(draw, 15000);
  return () => {
    unsub();
    clearInterval(timer);
  };
}
