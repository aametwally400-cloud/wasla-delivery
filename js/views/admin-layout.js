// Dashboard shell: sidebar, top bar, notifications.

import { t, L, fmtAgo } from '../i18n.js';
import { icon, logoMark } from '../icons.js';
import { esc, buildHash } from '../utils.js';
import { restaurantById } from '../data.js';
import { getData, update, subscribe, toggleLang, toggleTheme, resolvedTheme, resetDemo } from '../store.js';
import { activeCount } from '../ops.js';
import { toast, confirmDialog, avatar } from '../ui.js';

const NAV = [
  { name: 'overview', href: '#/admin', icon: 'grid', label: 'ad.overview', sub: 'ad.overviewSub' },
  { name: 'orders', href: '#/admin/orders', icon: 'receipt', label: 'ad.orders', sub: 'ad.ordersSub' },
  { name: 'restaurants', href: '#/admin/restaurants', icon: 'store', label: 'ad.restaurants', sub: 'ad.restaurantsSub' },
  { name: 'riders', href: '#/admin/riders', icon: 'scooter', label: 'ad.riders', sub: 'ad.ridersSub' },
  { name: 'customers', href: '#/admin/customers', icon: 'users', label: 'ad.customers', sub: 'ad.customersSub' },
];

export function mountAdmin(app) {
  app.innerHTML = `
    <div class="admin">
      <aside class="sidebar" id="sidebar" aria-label="${t('ad.title')}">
        <div class="sb-top">
          <a class="logo" href="#/admin"><span class="logo-mark">${logoMark(22)}</span><span>${t('brand')}<small>${t('ad.title')}</small></span></a>
          <button class="icon-btn sm sb-close" type="button" data-sb-close aria-label="${t('close')}">${icon('x', 18)}</button>
        </div>
        <span class="sb-label">${t('ad.menu')}</span>
        <nav class="sb-nav">
          ${NAV.map((n) => `<a class="sb-link" href="${n.href}" data-nav="${n.name}">${icon(n.icon, 20)}<span>${t(n.label)}</span>${n.name === 'orders' ? '<span class="sb-count" data-active-count hidden></span>' : ''}</a>`).join('')}
        </nav>
        <div class="sb-spacer"></div>
        <div class="sb-card">
          <strong>${t('ad.storeCard')}</strong>
          <p>${t('ad.storeCardSub')}</p>
          <a class="btn btn-sm btn-block" href="#/" target="_blank" rel="noopener">${icon('external', 15)} ${t('ad.openStore')}</a>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" data-reset style="justify-content:flex-start">${icon('refresh', 16)} ${t('ad.reset')}</button>
        <div class="sb-user">
          ${avatar('Ops Team')}
          <div><strong>${t('ad.adminName')}</strong><small>${t('ad.role')}</small></div>
        </div>
      </aside>
      <div class="admin-main">
        <header class="topbar">
          <button class="icon-btn sb-toggle" type="button" data-sb-open aria-label="${t('ad.openMenu')}" aria-controls="sidebar">${icon('menu', 22)}</button>
          <div class="tb-title"><h1 data-title></h1><p data-sub></p></div>
          <div class="tb-actions">
            <form class="search-field tb-search" role="search" data-search>
              ${icon('search', 17)}
              <label class="sr-only" for="tbq">${t('ad.search')}</label>
              <input id="tbq" class="input" type="search" name="q" placeholder="${t('ad.search')}" autocomplete="off" />
            </form>
            <button class="icon-btn hide-xs" type="button" data-lang aria-label="${t('lang.toggle')}" title="${t('lang.toggle')}"><span class="lang-label">${t('lang.short')}</span></button>
            <button class="icon-btn" type="button" data-theme aria-label="${t('theme.toggle')}" title="${t('theme.toggle')}"></button>
            <div class="pos-rel">
              <button class="icon-btn" type="button" data-bell aria-label="${t('notif.open')}" aria-expanded="false">${icon('bell', 20)}<span class="dot-badge" data-unread hidden></span></button>
              <div class="popover" data-pop hidden role="dialog" aria-label="${t('notif.title')}"></div>
            </div>
            <a class="btn btn-secondary btn-sm hide-xs" href="#/">${icon('store', 16)} <span>${t('nav.storefront')}</span></a>
          </div>
        </header>
        <main id="main" class="admin-content" tabindex="-1"></main>
      </div>
    </div>`;

  const main = app.querySelector('main');
  const sidebar = app.querySelector('.sidebar');
  const pop = app.querySelector('[data-pop]');
  const bell = app.querySelector('[data-bell]');
  let backdrop = null;
  let lastUnread = getData().notifications.filter((n) => !n.read).length;

  const openSidebar = () => {
    sidebar.classList.add('open');
    backdrop = document.createElement('div');
    backdrop.className = 'sb-backdrop';
    backdrop.onclick = closeSidebar;
    app.querySelector('.admin').appendChild(backdrop);
    sidebar.querySelector('.sb-link')?.focus();
  };
  const closeSidebar = () => {
    sidebar.classList.remove('open');
    backdrop?.remove();
    backdrop = null;
  };

  const drawPop = () => {
    const list = getData().notifications;
    pop.innerHTML = `
      <div class="pop-head"><strong>${t('notif.title')}</strong>${list.some((n) => !n.read) ? `<button type="button" data-mark>${t('notif.markAll')}</button>` : ''}</div>
      <div class="pop-list">
        ${
          list.length
            ? list
                .map((n) => {
                  const r = restaurantById[n.restaurantId];
                  return `<a class="notif ${n.read ? '' : 'unread'}" href="${buildHash('/admin/orders', { open: n.orderId })}" data-notif="${n.id}">
                    <span class="n-icon">${icon('bag', 17)}</span>
                    <span><p>${esc(t('notif.newOrder', { id: n.orderId, r: r ? L(r.name) : '' }))}</p><small>${fmtAgo(n.at)}</small></span>
                  </a>`;
                })
                .join('')
            : `<div class="pop-empty">${t('notif.empty')}</div>`
        }
      </div>`;
  };

  const paint = (reason) => {
    const d = getData();
    const unread = d.notifications.filter((n) => !n.read).length;
    const badge = app.querySelector('[data-unread]');
    badge.hidden = !unread;
    badge.textContent = unread;
    const n = activeCount();
    const ac = app.querySelector('[data-active-count]');
    ac.hidden = !n;
    ac.textContent = n;
    app.querySelector('[data-theme]').innerHTML = icon(resolvedTheme() === 'dark' ? 'sun' : 'moon', 19);
    if (!pop.hidden) drawPop();

    // A new order from the storefront (possibly in another tab).
    if (unread > lastUnread && (reason === 'sync' || reason === 'order:new')) {
      const latest = d.notifications[0];
      const r = restaurantById[latest.restaurantId];
      toast(t('notif.newOrder', { id: latest.orderId, r: r ? L(r.name) : '' }), {
        type: 'brand',
        icon: 'bell',
        action: t('viewAll'),
        onAction: () => (location.hash = buildHash('/admin/orders', { open: latest.orderId })),
        duration: 6000,
      });
    }
    lastUnread = unread;
  };
  paint();

  const unsub = subscribe(paint);
  const timer = setInterval(() => paint('timer'), 5000);

  const onDocClick = (e) => {
    if (!pop.hidden && !e.target.closest('[data-pop]') && !e.target.closest('[data-bell]')) {
      pop.hidden = true;
      bell.setAttribute('aria-expanded', 'false');
    }
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && !pop.hidden) {
      pop.hidden = true;
      bell.setAttribute('aria-expanded', 'false');
      bell.focus();
    }
  };
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKey);

  bell.onclick = () => {
    pop.hidden = !pop.hidden;
    bell.setAttribute('aria-expanded', String(!pop.hidden));
    if (!pop.hidden) drawPop();
  };
  pop.addEventListener('click', (e) => {
    if (e.target.closest('[data-mark]')) {
      update((d) => d.notifications.forEach((n) => (n.read = true)), 'notif');
    }
    const n = e.target.closest('[data-notif]');
    if (n) {
      update((d) => {
        const x = d.notifications.find((y) => y.id === n.dataset.notif);
        if (x) x.read = true;
      }, 'notif');
      pop.hidden = true;
    }
  });

  app.querySelector('[data-sb-open]').onclick = openSidebar;
  app.querySelector('[data-sb-close]').onclick = closeSidebar;
  app.querySelector('[data-lang]').onclick = toggleLang;
  app.querySelector('[data-theme]').onclick = toggleTheme;
  app.querySelector('[data-reset]').onclick = async () => {
    const ok = await confirmDialog({ title: t('ad.reset'), body: t('ad.resetConfirm'), ok: t('ad.reset'), danger: true });
    if (!ok) return;
    resetDemo();
    toast(t('ad.resetDone'));
  };
  app.querySelector('[data-search]').addEventListener('submit', (e) => {
    e.preventDefault();
    location.hash = buildHash('/admin/orders', { q: e.target.q.value.trim() });
    e.target.q.value = '';
  });

  return {
    main,
    setRoute(name) {
      closeSidebar();
      const n = NAV.find((x) => x.name === name) || NAV[0];
      app.querySelectorAll('[data-nav]').forEach((a) => {
        const on = a.dataset.nav === name;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      app.querySelector('[data-title]').textContent = name === 'overview' ? t('ad.hello') : t(n.label);
      app.querySelector('[data-sub]').textContent = t(n.sub);
      document.title = `${t(n.label)} · ${t('brand')} ${t('ad.title')}`;
    },
    destroy() {
      unsub();
      clearInterval(timer);
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    },
  };
}
