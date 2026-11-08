// Restaurant page: header, sticky menu nav with scroll-spy, dish cards, item modal, cart panel.

import { t, L, fmtMoney, fmtNum } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { restaurantById, itemById, OPTION_GROUPS, AREAS } from '../data.js';
import { isFavorite, toggleFavorite, isPaused, subscribe, addToCart, cartConflicts, clearCart, itemQtyInCart, unitPrice, getData } from '../store.js';
import { media, restLogo, toast, openOverlay, confirmDialog } from '../ui.js';
import { mountCartPanel, openCartDrawer } from './cart.js';

const norm = (s) => String(s).toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');

function itemCard(item) {
  const qty = itemQtyInCart(item.id);
  return `
    <article class="item-card ${qty ? 'in-cart' : ''}" data-item="${item.id}" role="button" tabindex="0" aria-label="${esc(L(item.name))}, ${fmtMoney(item.price)}">
      <div class="item-info">
        <h3>${esc(L(item.name))}</h3>
        ${item.desc ? `<p class="item-desc">${esc(L(item.desc))}</p>` : ''}
        <div class="item-foot">
          <strong>${fmtMoney(item.price)}</strong>
          ${item.popular ? `<span class="badge st-on_the_way">${icon('fire', 12)} ${t('item.popular')}</span>` : ''}
        </div>
      </div>
      <div class="item-media" style="position:relative">
        ${media(item.img, { w: 300, label: '' })}
        <span class="in-cart-qty" data-qty ${qty ? '' : 'hidden'}>${qty}</span>
        <span class="add-btn" aria-hidden="true">${icon('plus', 18)}</span>
      </div>
    </article>`;
}

/** Item modal: options, note, quantity, add to cart. */
export function openItemModal(itemId) {
  const item = itemById[itemId];
  if (!item) return;
  const r = restaurantById[item.restaurantId];
  const groups = (item.options || []).map((k) => ({ key: k, ...OPTION_GROUPS[k] }));
  const sel = Object.fromEntries(groups.map((g) => [g.key, g.required ? [g.choices[0].id] : []]));
  let qty = 1;

  openOverlay({
    kind: 'modal',
    label: L(item.name),
    render(panel, close) {
      panel.innerHTML = `
        <button class="icon-btn modal-close" type="button" aria-label="${t('close')}">${icon('x', 20)}</button>
        <div class="modal-body">
          ${media(item.img, { cls: 'item-modal-media', w: 1000, label: L(item.name) })}
          <div class="item-modal-head">
            <h2>${esc(L(item.name))}</h2>
            ${item.desc ? `<p>${esc(L(item.desc))}</p>` : ''}
            <div class="price">${fmtMoney(item.price)}</div>
          </div>
          ${groups
            .map(
              (g) => `
            <fieldset class="opt-group" data-group="${g.key}">
              <legend class="sr-only">${esc(L(g.name))}</legend>
              <div class="opt-head">
                <h3 aria-hidden="true">${esc(L(g.name))}</h3>
                <span class="badge ${g.required ? 'st-on_the_way' : ''}">${g.required ? t('item.required') : `${t('item.optional')} · ${t('item.upTo', { n: g.max })}`}</span>
              </div>
              <div class="opt-list">
                ${g.choices
                  .map(
                    (c) => `
                  <label class="choice">
                    <input type="${g.max === 1 ? 'radio' : 'checkbox'}" name="${g.key}" value="${c.id}" ${sel[g.key].includes(c.id) ? 'checked' : ''} />
                    <span class="radio"></span>
                    <span class="choice-body"><span class="choice-title">${esc(L(c.name))}</span></span>
                    ${c.price ? `<span class="opt-price">+${fmtMoney(c.price)}</span>` : ''}
                  </label>`,
                  )
                  .join('')}
              </div>
            </fieldset>`,
            )
            .join('')}
          <div class="item-note field" style="${groups.length ? '' : 'margin-top:18px'}">
            <label for="note">${t('item.note')}</label>
            <textarea id="note" class="textarea" rows="2" maxlength="140" placeholder="${t('item.notePh')}"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <div class="stepper lg" role="group" aria-label="qty">
            <button type="button" data-q="-1" aria-label="${t('decrease')}">${icon('minus', 18)}</button>
            <output data-qty>1</output>
            <button type="button" data-q="1" aria-label="${t('increase')}">${icon('plus', 18)}</button>
          </div>
          <button class="btn btn-primary btn-lg" type="button" data-add style="flex:1"></button>
        </div>`;

      const addBtn = panel.querySelector('[data-add]');
      const refresh = () => {
        const price = unitPrice(item, sel) * qty;
        addBtn.textContent = t('addToCart', { price: fmtMoney(price) });
        panel.querySelector('[data-qty]').textContent = qty;
        for (const g of groups) {
          if (g.max > 1) {
            const full = sel[g.key].length >= g.max;
            panel.querySelectorAll(`input[name="${g.key}"]`).forEach((inp) => (inp.disabled = full && !inp.checked));
          }
        }
      };
      refresh();

      panel.querySelector('.modal-close').onclick = close;
      panel.addEventListener('change', (e) => {
        const inp = e.target;
        const g = inp.name && groups.find((x) => x.key === inp.name);
        if (!g) return;
        sel[g.key] = [...panel.querySelectorAll(`input[name="${g.key}"]:checked`)].map((x) => x.value);
        refresh();
      });
      panel.querySelectorAll('[data-q]').forEach((b) =>
        b.addEventListener('click', () => {
          qty = Math.max(1, Math.min(20, qty + Number(b.dataset.q)));
          refresh();
        }),
      );
      addBtn.addEventListener('click', async () => {
        if (isPaused(r.id)) {
          toast(t('closedHint'), { type: 'error' });
          return;
        }
        const note = panel.querySelector('#note').value;
        if (cartConflicts(r.id)) {
          const current = restaurantById[getData().cart.restaurantId];
          const ok = await confirmDialog({ title: t('swap.title'), body: t('swap.body', { a: L(current.name), b: L(r.name) }), ok: t('swap.ok') });
          if (!ok) return;
          clearCart();
        }
        addToCart(item.id, qty, sel, note);
        close();
        toast(t('item.added', { name: L(item.name) }), { action: t('cart.view'), onAction: openCartDrawer });
      });
    },
  });
}

export default function restaurant(main, { params: [id], query }) {
  const r = restaurantById[id];
  if (!r) {
    main.innerHTML = `<div class="container"><div class="empty"><div class="empty-icon">${icon('store', 32)}</div><h3>${t('rest.notFound')}</h3><a class="btn btn-primary" href="#/">${t('rest.all')}</a></div></div>`;
    return;
  }

  const popular = r.menu.flatMap((c) => c.items).filter((i) => i.popular);
  const sections = [...(popular.length ? [{ id: 'popular', name: { ar: t('rest.popular'), en: t('rest.popular') }, items: popular, icon: 'fire' }] : []), ...r.menu];

  main.innerHTML = `
    <div class="rest-hero">
      ${media(r.cover, { cls: 'rest-cover', w: 1800, label: L(r.name) })}
      <div class="container">
        <div class="rest-head card">
          ${restLogo(r)}
          <div style="min-width:0">
            <h1>${esc(L(r.name))}</h1>
            <p class="sub">${esc(L(r.sub))} · ${esc(L(AREAS[r.area]))}</p>
            <div class="rest-facts">
              <span class="fact"><span class="rating">${icon('star', 14)}${r.rating.toFixed(1)}</span> ${t('reviews', { n: fmtNum(r.reviews) })}</span>
              <span class="fact">${icon('clock', 15)} ${t('minutesRange', { a: r.eta[0], b: r.eta[1] })}</span>
              <span class="fact">${icon('scooter', 15)} ${t('rest.delivery', { v: r.fee ? fmtMoney(r.fee) : t('free') })}</span>
              <span class="fact">${icon('bag', 15)} ${t('rest.minOrder', { v: fmtMoney(r.minOrder) })}</span>
              ${r.offer ? `<span class="fact" style="background:var(--brand-soft);color:var(--brand-ink)">${icon('tag', 15)} ${esc(L(r.offer))}</span>` : ''}
            </div>
          </div>
          <div class="rest-head-actions">
            <button class="icon-btn bordered" type="button" data-fav aria-pressed="${isFavorite(r.id)}"></button>
          </div>
        </div>
        <div data-closed></div>
        <a class="back-link" href="#/">${icon('arrowLeft', 16, 'class="flip-rtl"')} ${t('rest.all')}</a>
      </div>
    </div>
    <div class="container rest-layout">
      <nav class="menu-nav" aria-label="${esc(L(r.name))}">
        ${sections.map((s, i) => `<a href="#sec-${s.id}" data-sec="${s.id}" class="${i === 0 ? 'active' : ''}">${esc(L(s.name))}<small>${s.items.length}</small></a>`).join('')}
      </nav>
      <div class="menu-main">
        <div class="search-field menu-search">
          ${icon('search', 18)}
          <label class="sr-only" for="menu-q">${t('rest.searchMenu')}</label>
          <input id="menu-q" class="input" type="search" placeholder="${t('rest.searchMenu')}" autocomplete="off" />
        </div>
        <div data-sections>
          ${sections
            .map(
              (s) => `<section class="menu-section" id="sec-${s.id}" data-section="${s.id}">
                <h2>${s.icon ? `<span style="color:var(--brand)">${icon(s.icon, 20)}</span>` : ''}${esc(L(s.name))}</h2>
                <div class="menu-grid">${s.items.map(itemCard).join('')}</div>
              </section>`,
            )
            .join('')}
          <div class="empty" data-no-items hidden><div class="empty-icon">${icon('search', 30)}</div><h3>${t('rest.noItems')}</h3></div>
        </div>
      </div>
      <aside class="cart-panel card" data-cart-panel aria-label="${t('cart')}"></aside>
    </div>`;

  const favBtn = main.querySelector('[data-fav]');
  const paintFav = () => {
    const on = isFavorite(r.id);
    favBtn.setAttribute('aria-pressed', on);
    favBtn.setAttribute('aria-label', on ? t('favRemove') : t('favAdd'));
    favBtn.innerHTML = icon('heart', 20, on ? 'style="fill:#e5383b;color:#e5383b"' : '');
  };
  const paintClosed = () => {
    main.querySelector('[data-closed]').innerHTML = isPaused(r.id) ? `<div class="closed-banner">${icon('clock', 18)} ${t('closedHint')}</div>` : '';
  };
  const paintQty = () => {
    main.querySelectorAll('[data-item]').forEach((card) => {
      const q = itemQtyInCart(card.dataset.item);
      card.classList.toggle('in-cart', q > 0);
      const badge = card.querySelector('[data-qty]');
      badge.hidden = !q;
      badge.textContent = q;
    });
  };
  paintFav();
  paintClosed();

  favBtn.onclick = () => {
    toggleFavorite(r.id);
    paintFav();
  };

  // Item open (click / keyboard)
  const sectionsEl = main.querySelector('[data-sections]');
  sectionsEl.addEventListener('click', (e) => {
    const card = e.target.closest('[data-item]');
    if (card) openItemModal(card.dataset.item);
  });
  sectionsEl.addEventListener('keydown', (e) => {
    const card = e.target.closest('[data-item]');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openItemModal(card.dataset.item);
    }
  });

  // Menu search
  main.querySelector('#menu-q').addEventListener('input', (e) => {
    const q = norm(e.target.value.trim());
    let any = false;
    main.querySelectorAll('[data-section]').forEach((sec) => {
      let visible = 0;
      sec.querySelectorAll('[data-item]').forEach((card) => {
        const item = itemById[card.dataset.item];
        const show = !q || norm(item.name.ar).includes(q) || norm(item.name.en).includes(q);
        card.hidden = !show;
        if (show) visible++;
      });
      // Hide the "popular" duplicate section while searching.
      sec.hidden = !visible || (q && sec.dataset.section === 'popular');
      if (!sec.hidden) any = true;
    });
    main.querySelector('[data-no-items]').hidden = any;
  });

  // Nav: smooth scroll + scroll-spy
  const nav = main.querySelector('.menu-nav');
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('[data-sec]');
    if (!a) return;
    e.preventDefault();
    main.querySelector(`#sec-${a.dataset.sec}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const setActive = (sid) => {
    nav.querySelectorAll('[data-sec]').forEach((a) => {
      const on = a.dataset.sec === sid;
      a.classList.toggle('active', on);
      if (on && nav.scrollWidth > nav.clientWidth) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
  };
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((en) => en.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.dataset.section);
    },
    { rootMargin: '-140px 0px -55% 0px' },
  );
  main.querySelectorAll('[data-section]').forEach((s) => io.observe(s));

  const cleanupPanel = mountCartPanel(main.querySelector('[data-cart-panel]'));
  const unsub = subscribe((reason) => {
    if (reason.startsWith('cart') || reason === 'sync' || reason === 'reset') paintQty();
    if (reason === 'paused' || reason === 'sync') paintClosed();
  });

  if (query.item && itemById[query.item]?.restaurantId === r.id) {
    history.replaceState(null, '', `#/r/${r.id}`);
    setTimeout(() => openItemModal(query.item), 250);
  }

  return () => {
    io.disconnect();
    cleanupPanel();
    unsub();
  };
}
