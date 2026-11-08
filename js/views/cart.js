// Cart: shared by the slide-over drawer and the sticky panel on restaurant pages.

import { t, L, fmtMoney } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { cartTotals, setLineQty, applyPromo, removePromo, clearCart, subscribe, optionLabels } from '../store.js';
import { openOverlay, restLogo } from '../ui.js';

function lineHTML(l) {
  const opts = optionLabels(l.options).map(L);
  if (l.note) opts.push(`“${l.note}”`);
  return `
    <li class="cart-item">
      <div class="stepper" role="group" aria-label="${esc(L(l.item.name))}">
        <button type="button" data-dec="${esc(l.key)}" aria-label="${t('decrease')}">${icon(l.qty === 1 ? 'trash' : 'minus', 15)}</button>
        <output>${l.qty}</output>
        <button type="button" data-inc="${esc(l.key)}" aria-label="${t('increase')}">${icon('plus', 15)}</button>
      </div>
      <div>
        <div class="name">${esc(L(l.item.name))}</div>
        ${opts.length ? `<div class="opts">${esc(opts.join(' · '))}</div>` : ''}
      </div>
      <div class="line-price">${fmtMoney(l.total)}</div>
    </li>`;
}

export function totalsHTML(tt) {
  return `
    <dl class="totals">
      <div><dt>${t('subtotal')}</dt><dd>${fmtMoney(tt.subtotal)}</dd></div>
      <div><dt>${t('deliveryFee')}</dt><dd>${tt.fee ? fmtMoney(tt.fee) : `<span style="color:var(--good-text)">${t('free')}</span>`}</dd></div>
      <div><dt>${t('serviceFee')}</dt><dd>${fmtMoney(tt.service)}</dd></div>
      ${tt.discount ? `<div class="discount"><dt>${t('discount')} (${esc(tt.promo.code)})</dt><dd>−${fmtMoney(tt.discount)}</dd></div>` : ''}
      <div class="grand"><dt>${t('total')}</dt><dd>${fmtMoney(tt.total)}</dd></div>
    </dl>`;
}

function promoHTML(tt) {
  if (tt.promo) {
    return `<div class="promo-msg ok" style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
      <span>${icon('tag', 14)} ${t('promo.ok', { code: esc(tt.promo.code), p: tt.promo.pct })}</span>
      <button type="button" class="btn btn-ghost btn-sm" data-promo-remove>${t('promo.remove')}</button></div>`;
  }
  return `<form class="promo-row" data-promo-form>
      <label class="sr-only" for="promo-${tt.uid}">${t('promo.label')}</label>
      <input id="promo-${tt.uid}" class="input" name="code" placeholder="${t('promo.placeholder')}" autocomplete="off" />
      <button class="btn btn-secondary btn-sm" style="height:42px">${t('promo.apply')}</button>
    </form><div class="promo-msg" data-promo-msg aria-live="polite"></div>`;
}

function emptyHTML(withButton = true) {
  return `<div class="empty">
      <div class="empty-icon">${icon('bag', 32)}</div>
      <h3>${t('cart.empty')}</h3>
      <p>${t('cart.emptyHint')}</p>
      ${withButton ? `<a class="btn btn-primary" href="#/" data-close>${t('cart.browse')}</a>` : ''}
    </div>`;
}

function checkoutBlock(tt) {
  const r = tt.restaurant;
  const pct = r ? Math.min(100, (tt.subtotal / r.minOrder) * 100) : 100;
  return `
    ${tt.minShort > 0 ? `<div class="min-warn">${icon('info', 16)}<span>${t('min.warn', { amount: fmtMoney(tt.minShort) })}</span></div><div class="progress"><span style="width:${pct}%"></span></div>` : ''}
    <a class="btn btn-primary btn-lg btn-block ${tt.minShort > 0 ? 'is-disabled' : ''}" href="#/checkout" data-checkout ${tt.minShort > 0 ? 'aria-disabled="true" tabindex="-1" style="opacity:.5;pointer-events:none"' : ''}>
      <span>${t('checkout')}</span><span style="margin-inline-start:auto">${fmtMoney(tt.total)}</span>
    </a>`;
}

let uidSeq = 0;

/** Sticky cart panel (restaurant page, desktop). Returns cleanup. */
export function mountCartPanel(el) {
  const uid = ++uidSeq;
  const draw = () => {
    const tt = { ...cartTotals(), uid };
    if (!tt.count) {
      el.innerHTML = `<h2>${t('cart')}</h2>${emptyHTML(false)}`;
      return;
    }
    el.innerHTML = `
      <div class="cart-rest">${restLogo(tt.restaurant)}<div><strong>${esc(L(tt.restaurant.name))}</strong><span class="muted" style="font-size:13px">${t('cart.items', { n: tt.count })}</span></div></div>
      <ul class="cart-items">${tt.lines.map(lineHTML).join('')}</ul>
      <div>${promoHTML(tt)}${totalsHTML(tt)}<div style="margin-top:14px;display:grid;gap:10px">${checkoutBlock(tt)}</div></div>`;
  };
  draw();
  bindCartEvents(el, draw);
  const unsub = subscribe((r) => {
    if (r.startsWith('cart') || r === 'sync' || r === 'reset') draw();
  });
  return unsub;
}

function bindCartEvents(el, redraw, close) {
  el.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const tt = cartTotals();
    if (inc) {
      const l = tt.lines.find((x) => x.key === inc.dataset.inc);
      if (l) setLineQty(l.key, l.qty + 1);
    } else if (dec) {
      const l = tt.lines.find((x) => x.key === dec.dataset.dec);
      if (l) setLineQty(l.key, l.qty - 1);
    } else if (e.target.closest('[data-promo-remove]')) {
      removePromo();
    } else if (e.target.closest('[data-clear]')) {
      clearCart();
    } else if (e.target.closest('[data-checkout], [data-close]')) {
      close?.();
    }
  });
  el.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-promo-form]');
    if (!form) return;
    e.preventDefault();
    const code = form.code.value;
    if (!applyPromo(code)) {
      const msg = el.querySelector('[data-promo-msg]');
      msg.className = 'promo-msg err';
      msg.textContent = t('promo.bad');
      form.code.select();
    }
  });
}

/** Slide-over cart. */
export function openCartDrawer() {
  let unsub;
  openOverlay({
    kind: 'drawer',
    label: t('cart'),
    onClose: () => unsub?.(),
    render(panel, close) {
      const uid = ++uidSeq;
      const draw = () => {
        const tt = { ...cartTotals(), uid };
        panel.innerHTML = `
          <div class="drawer-head">
            <h2>${t('cart')} ${tt.count ? `<span class="muted" style="font-size:14px;font-weight:500">· ${t('cart.items', { n: tt.count })}</span>` : ''}</h2>
            <div style="display:flex;gap:4px">
              ${tt.count ? `<button class="icon-btn sm" type="button" data-clear aria-label="${t('cart.clear')}" title="${t('cart.clear')}">${icon('trash', 18)}</button>` : ''}
              <button class="icon-btn sm" type="button" data-x aria-label="${t('close')}">${icon('x', 20)}</button>
            </div>
          </div>
          ${
            tt.count
              ? `<div class="drawer-body">
                  <div class="cart-rest">${restLogo(tt.restaurant)}<div><strong>${esc(L(tt.restaurant.name))}</strong><a href="#/r/${tt.restaurant.id}" data-close>${t('cart.viewMenu')}</a></div></div>
                  <ul class="cart-items">${tt.lines.map(lineHTML).join('')}</ul>
                  ${promoHTML(tt)}
                </div>
                <div class="drawer-foot">${totalsHTML(tt)}${checkoutBlock(tt)}</div>`
              : `<div class="drawer-body">${emptyHTML()}</div>`
          }`;
        panel.querySelector('[data-x]').onclick = close;
      };
      draw();
      bindCartEvents(panel, draw, close);
      unsub = subscribe((r) => {
        if (r.startsWith('cart') || r === 'sync' || r === 'reset') {
          const focusedKey = document.activeElement?.dataset?.inc || document.activeElement?.dataset?.dec;
          const which = document.activeElement?.dataset?.inc ? 'inc' : 'dec';
          draw();
          if (focusedKey) panel.querySelector(`[data-${which}="${CSS.escape(focusedKey)}"]`)?.focus();
        }
      });
    },
  });
}
