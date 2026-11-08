// My orders: the orders you placed in this browser, active first.

import { t, L, fmtMoney, fmtDateTime } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { restaurantById, itemById } from '../data.js';
import { getData, subscribe, addToCart, cartConflicts, clearCart } from '../store.js';
import { ACTIVE, lineName, findOrder } from '../ops.js';
import { restLogo, statusBadge, toast, confirmDialog } from '../ui.js';
import { openCartDrawer } from './cart.js';

function row(o) {
  const r = restaurantById[o.restaurantId];
  const live = findOrder(o.id) || o;
  const items = o.lines.map((l) => `${l.qty}× ${L(lineName(l))}`).join('، ');
  return `
    <article class="card order-row">
      ${restLogo(r)}
      <div style="min-width:0">
        <h3>${esc(L(r.name))} ${statusBadge(live.status)}</h3>
        <div class="meta"><span class="order-id">${esc(o.id)}</span> · ${fmtDateTime(o.createdAt)}</div>
        <div class="items truncate">${esc(items)}</div>
      </div>
      <div class="actions">
        <span class="total">${fmtMoney(o.total)}</span>
        ${ACTIVE.has(live.status) ? `<a class="btn btn-primary btn-sm" href="#/track/${o.id}">${icon('scooter', 16)} ${t('mo.track')}</a>` : `<a class="btn btn-ghost btn-sm" href="#/track/${o.id}">${icon('receipt', 16)}</a><button class="btn btn-secondary btn-sm" type="button" data-reorder="${o.id}">${icon('refresh', 16)} ${t('mo.reorder')}</button>`}
      </div>
    </article>`;
}

export default function myOrders(main) {
  const draw = () => {
    const mine = [...getData().orders].sort((a, b) => b.createdAt - a.createdAt);
    const status = (o) => (findOrder(o.id) || o).status;
    const active = mine.filter((o) => ACTIVE.has(status(o)));
    const past = mine.filter((o) => !ACTIVE.has(status(o)));
    main.innerHTML = `
      <div class="container" style="max-width:920px">
        <h1 class="page-title">${t('mo.title')}</h1>
        <p class="page-sub">${t('mo.sub')}</p>
        ${
          mine.length
            ? `${active.length ? `<h2 style="font-size:17px;margin-top:26px">${t('mo.active')}</h2><div class="orders-list">${active.map(row).join('')}</div>` : ''}
               ${past.length ? `<h2 style="font-size:17px;margin-top:30px">${t('mo.past')}</h2><div class="orders-list">${past.map(row).join('')}</div>` : ''}`
            : `<div class="empty card" style="margin-top:24px"><div class="empty-icon">${icon('receipt', 30)}</div><h3>${t('mo.empty')}</h3><p>${t('mo.emptyHint')}</p><a class="btn btn-primary" href="#/">${t('cart.browse')}</a></div>`
        }
      </div>`;
  };
  draw();

  main.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-reorder]');
    if (!btn) return;
    const o = getData().orders.find((x) => x.id === btn.dataset.reorder);
    if (!o) return;
    if (cartConflicts(o.restaurantId)) {
      const cur = restaurantById[getData().cart.restaurantId];
      const ok = await confirmDialog({ title: t('swap.title'), body: t('swap.body', { a: L(cur.name), b: L(restaurantById[o.restaurantId].name) }), ok: t('swap.ok') });
      if (!ok) return;
      clearCart();
    }
    for (const l of o.lines) if (itemById[l.itemId]) addToCart(l.itemId, l.qty, l.options || {}, l.note || '');
    toast(t('mo.reordered'), { action: t('cart.view'), onAction: openCartDrawer });
  });

  const unsub = subscribe((r) => {
    if (r === 'tick' || r === 'sync' || r.startsWith('order')) draw();
  });
  return unsub;
}
