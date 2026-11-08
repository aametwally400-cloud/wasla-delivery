// Customers: searchable, sortable list with order count, spend and segment.

import { t, L, fmtMoney, fmtNum, fmtDate, fmtAgo } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { AREAS } from '../data.js';
import { customerStats } from '../ops.js';
import { avatar } from '../ui.js';

const PAGE = 15;

export default function adminCustomers(main) {
  const all = customerStats();
  const state = { q: '', seg: 'all', sort: 'spent', dir: -1, page: 1 };

  main.innerHTML = `
    <div class="toolbar">
      <div class="search-field">
        ${icon('search', 17)}
        <label class="sr-only" for="cq">${t('cu.search')}</label>
        <input id="cq" class="input" type="search" placeholder="${t('cu.search')}" autocomplete="off" />
      </div>
      <div class="seg" role="group" aria-label="${t('col.segment')}" data-segs></div>
      <span class="grow"></span>
      <span class="badge" data-count></span>
    </div>
    <section class="card table-card">
      <div class="table-wrap" data-table></div>
      <div class="pager" data-pager></div>
    </section>`;

  const norm = (s) => String(s).toLowerCase();

  function draw() {
    const q = norm(state.q.trim());
    let list = all.filter((c) => (state.seg === 'all' || c.segment === state.seg) && (!q || [c.name.ar, c.name.en, AREAS[c.area].ar, AREAS[c.area].en].some((s) => norm(s).includes(q))));
    const key = { spent: (c) => c.spent, orders: (c) => c.orders, last: (c) => c.last }[state.sort];
    list = list.sort((a, b) => (key(a) - key(b)) * state.dir);
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PAGE, state.page * PAGE);

    main.querySelector('[data-segs]').innerHTML = ['all', 'vip', 'regular', 'new']
      .map((s) => `<button type="button" data-seg="${s}" aria-pressed="${state.seg === s}">${s === 'all' ? t('tab.all') : t(`cu.${s}`)}</button>`)
      .join('');
    main.querySelector('[data-count]').textContent = t('cu.count', { n: fmtNum(list.length) });

    const sortBtn = (k, label) =>
      `<button class="th-sort" type="button" data-sort="${k}" ${state.sort === k ? `aria-sort="${state.dir === 1 ? 'ascending' : 'descending'}"` : ''}>${label}${state.sort === k ? icon(state.dir === 1 ? 'arrowUp' : 'arrowDown', 13) : ''}</button>`;

    main.querySelector('[data-table]').innerHTML = slice.length
      ? `<table class="table resp-table">
          <thead><tr><th>${t('col.customer')}</th><th>${t('col.area')}</th><th class="num">${sortBtn('orders', t('col.orders'))}</th><th class="num">${sortBtn('spent', t('col.spent'))}</th><th>${sortBtn('last', t('col.last'))}</th><th>${t('col.segment')}</th></tr></thead>
          <tbody>
            ${slice
              .map(
                (c) => `<tr>
                <td><div class="cell-flex">${avatar(c.name.en, 'sm')}<div style="min-width:0"><div class="cell-main truncate">${esc(L(c.name))}</div><div class="cell-sub ltr">${esc(c.phone.slice(0, 3))} ••• ${esc(c.phone.slice(-4))}</div></div></div></td>
                <td data-hide-sm>${esc(L(AREAS[c.area]))}</td>
                <td class="num" data-hide-sm>${fmtNum(c.orders)}</td>
                <td class="num" style="font-weight:600">${fmtMoney(c.spent)}</td>
                <td data-hide-sm><div>${fmtDate(c.last)}</div><div class="cell-sub">${fmtAgo(c.last)}</div></td>
                <td><span class="badge seg-badge ${c.segment}">${t(`cu.${c.segment}`)}</span></td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>`
      : `<div class="empty"><div class="empty-icon">${icon('users', 28)}</div><h3>${t('empty.title')}</h3></div>`;

    const a = list.length ? (state.page - 1) * PAGE + 1 : 0;
    const b = Math.min(state.page * PAGE, list.length);
    main.querySelector('[data-pager]').innerHTML = `
      <span>${t('pager.showing', { a: fmtNum(a), b: fmtNum(b), n: fmtNum(list.length) })}</span>
      <div class="btns">
        <button class="btn btn-secondary btn-sm" type="button" data-page="-1" ${state.page <= 1 ? 'disabled' : ''}>${icon('chevronLeft', 16, 'class="flip-rtl"')} ${t('pager.prev')}</button>
        <button class="btn btn-secondary btn-sm" type="button" data-page="1" ${state.page >= pages ? 'disabled' : ''}>${t('pager.next')} ${icon('chevronRight', 16, 'class="flip-rtl"')}</button>
      </div>`;
  }
  draw();

  main.querySelector('#cq').addEventListener('input', (e) => {
    state.q = e.target.value;
    state.page = 1;
    draw();
  });
  main.addEventListener('click', (e) => {
    const seg = e.target.closest('[data-seg]');
    const sort = e.target.closest('[data-sort]');
    const page = e.target.closest('[data-page]');
    if (seg) {
      state.seg = seg.dataset.seg;
      state.page = 1;
      draw();
      main.querySelector(`[data-seg="${state.seg}"]`)?.focus();
    } else if (sort) {
      if (state.sort === sort.dataset.sort) state.dir *= -1;
      else {
        state.sort = sort.dataset.sort;
        state.dir = -1;
      }
      draw();
    } else if (page) {
      state.page += Number(page.dataset.page);
      draw();
    }
  });
}
