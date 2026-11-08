// Storefront shell: sticky header, footer, mobile cart bar, address picker.

import { t, L, fmtMoney } from '../i18n.js';
import { icon, logoMark } from '../icons.js';
import { esc, buildHash } from '../utils.js';
import { AREAS } from '../data.js';
import { getData, subscribe, cartCount, cartTotals, toggleLang, toggleTheme, resolvedTheme, setAddress } from '../store.js';
import { openOverlay, bump } from '../ui.js';
import { openCartDrawer } from './cart.js';
import { REPO_URL } from '../config.js';

export function openAddressModal() {
  openOverlay({
    kind: 'modal',
    cls: 'sm',
    label: t('chooseArea'),
    render(panel, close) {
      const current = getData().address.area;
      panel.innerHTML = `
        <button class="icon-btn modal-close" type="button" aria-label="${t('close')}">${icon('x', 20)}</button>
        <div class="modal-body">
          <h2 class="modal-title">${t('chooseArea')}</h2>
          <p class="modal-sub">${t('chooseAreaSub')}</p>
          <div class="addr-list" role="radiogroup">
            ${Object.entries(AREAS)
              .map(
                ([id, name]) => `
              <label class="choice">
                <input type="radio" name="area" value="${id}" ${id === current ? 'checked' : ''} />
                <span class="choice-icon">${icon('pin', 18)}</span>
                <span class="choice-body"><span class="choice-title">${esc(L(name))}</span></span>
                <span class="radio"></span>
              </label>`,
              )
              .join('')}
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-primary btn-block" type="button" data-save>${t('save')}</button></div>`;
      panel.querySelector('.modal-close').onclick = close;
      panel.querySelector('[data-save]').onclick = () => {
        const v = panel.querySelector('input[name=area]:checked')?.value;
        if (v) setAddress({ area: v });
        close();
      };
    },
  });
}

export function mountStore(app) {
  app.innerHTML = `
    <header class="site-header">
      <div class="container header-inner">
        <a class="logo" href="#/" aria-label="${t('brand')}">
          <span class="logo-mark">${logoMark(22)}</span>
          <span class="logo-word">${t('brand')}<small>${t('brandSub')}</small></span>
        </a>
        <button class="loc-btn" type="button" data-addr aria-label="${t('changeAddress')}">
          <span class="pin">${icon('pin', 17)}</span>
          <span><small>${t('deliverTo')}</small><strong data-addr-label></strong></span>
          ${icon('chevronDown', 16)}
        </button>
        <form class="header-search search-field" role="search" data-search>
          ${icon('search', 18)}
          <label class="sr-only" for="hsearch">${t('search.placeholder')}</label>
          <input id="hsearch" class="input" type="search" name="q" placeholder="${t('search.placeholder')}" autocomplete="off" />
        </form>
        <nav class="header-actions" aria-label="Main">
          <a class="btn btn-ghost btn-sm nav-orders hide-xs" href="#/orders" data-nav="orders">${icon('receipt', 18)}<span class="label">${t('nav.orders')}</span></a>
          <button class="icon-btn" type="button" data-lang aria-label="${t('lang.toggle')}" title="${t('lang.toggle')}"><span class="lang-label">${t('lang.short')}</span></button>
          <button class="icon-btn" type="button" data-theme aria-label="${t('theme.toggle')}" title="${t('theme.toggle')}"></button>
          <a class="btn btn-dark btn-sm nav-dash" href="#/admin">${icon('grid', 17)}<span class="label">${t('nav.dashboard')}</span></a>
          <button class="icon-btn bordered" type="button" data-cart aria-label="${t('openCart')}">${icon('bag', 20)}<span class="dot-badge" data-cart-count hidden></span></button>
        </nav>
      </div>
    </header>
    <main id="main" class="store-main" tabindex="-1"></main>
    <footer class="site-footer">
      <div class="container footer-inner">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="logo-mark" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--brand);color:#fff">${logoMark(17)}</span>
          <span>${t('footer.note')}</span>
        </div>
        <div class="footer-links">
          <a href="#/admin">${t('nav.dashboard')}</a>
          <a href="https://unsplash.com" target="_blank" rel="noopener">${t('footer.photos')}</a>
          <a href="${REPO_URL}" target="_blank" rel="noopener" data-repo>${icon('github', 15, 'style="display:inline;vertical-align:-2px"')} ${t('footer.source')}</a>
        </div>
      </div>
    </footer>
    <button class="mobile-cart-bar" type="button" data-cart-bar>
      <span class="qty" data-bar-qty></span><span>${t('cart.view')}</span><span class="total" data-bar-total></span>
    </button>`;

  const header = app.querySelector('.site-header');
  const main = app.querySelector('main');

  const paint = (reason) => {
    const count = cartCount();
    const badge = app.querySelector('[data-cart-count]');
    const prev = Number(badge.textContent) || 0;
    badge.hidden = !count;
    badge.textContent = count;
    if (count > prev && reason === 'cart:add') bump(badge);

    const bar = app.querySelector('[data-cart-bar]');
    const onCheckout = location.hash.startsWith('#/checkout');
    bar.classList.toggle('has-items', count > 0 && !onCheckout);
    document.body.classList.toggle('has-cart-bar', count > 0 && !onCheckout);
    if (count) {
      app.querySelector('[data-bar-qty]').textContent = count;
      app.querySelector('[data-bar-total]').textContent = fmtMoney(cartTotals().total);
    }
    app.querySelector('[data-addr-label]').textContent = L(AREAS[getData().address.area] || AREAS.zamalek);
    app.querySelector('[data-theme]').innerHTML = icon(resolvedTheme() === 'dark' ? 'sun' : 'moon', 19);
  };
  paint();

  const unsub = subscribe(paint);
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  app.querySelector('[data-lang]').onclick = toggleLang;
  app.querySelector('[data-theme]').onclick = toggleTheme;
  app.querySelector('[data-cart]').onclick = openCartDrawer;
  app.querySelector('[data-cart-bar]').onclick = openCartDrawer;
  app.querySelector('[data-addr]').onclick = openAddressModal;
  app.querySelector('[data-search]').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    location.hash = buildHash('/', { q });
  });

  return {
    main,
    setRoute(name) {
      document.title = name === 'orders' ? `${t('mo.title')} · ${t('brand')}` : 'Wasla · وصلة — Food delivery & ops dashboard';
      app.querySelector('[data-nav="orders"]')?.classList.toggle('btn-soft', name === 'orders');
      const q = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || '';
      app.querySelector('#hsearch').value = name === 'home' ? q : '';
      paint();
    },
    destroy() {
      unsub();
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('has-cart-bar');
    },
  };
}

