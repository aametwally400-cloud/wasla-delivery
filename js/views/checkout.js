// Checkout: address, delivery time, payment, live summary. Places a simulated order.

import { t, L, fmtMoney, fmtTime } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { AREAS } from '../data.js';
import { cartTotals, getData, subscribe, isPaused, optionLabels } from '../store.js';
import { placeOrder } from '../ops.js';
import { restLogo, toast } from '../ui.js';
import { totalsHTML } from './cart.js';

const PHONE_RE = /^01[0125]\d{8}$/;

function summaryHTML(tt) {
  return `
    <h2 style="font-size:18px;margin-bottom:14px">${t('co.summary')}</h2>
    <div class="cart-rest">${restLogo(tt.restaurant)}<div><strong>${esc(L(tt.restaurant.name))}</strong><a href="#/r/${tt.restaurant.id}">${t('cart.viewMenu')}</a></div></div>
    <ul class="cart-items" style="max-height:280px">
      ${tt.lines
        .map((l) => {
          const opts = optionLabels(l.options).map(L);
          if (l.note) opts.push(`“${l.note}”`);
          return `<li class="cart-item" style="grid-template-columns:auto 1fr auto">
            <span class="badge" style="height:26px">${l.qty}×</span>
            <div><div class="name">${esc(L(l.item.name))}</div>${opts.length ? `<div class="opts">${esc(opts.join(' · '))}</div>` : ''}</div>
            <div class="line-price">${fmtMoney(l.total)}</div>
          </li>`;
        })
        .join('')}
    </ul>
    ${totalsHTML(tt)}
    ${tt.minShort > 0 ? `<div class="min-warn">${icon('info', 16)}<span>${t('min.warn', { amount: fmtMoney(tt.minShort) })}</span></div>` : ''}
    <button class="btn btn-primary btn-lg btn-block" type="submit" style="margin-top:16px" ${tt.minShort > 0 ? 'disabled' : ''}>${t('co.place', { total: fmtMoney(tt.total) })}</button>
    <p class="demo-note">${icon('info', 15)}<span>${t('co.demo')}</span></p>`;
}

function slots() {
  const out = [];
  const start = new Date();
  start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0);
  start.setHours(start.getHours() + 1);
  for (let i = 0; i < 10; i++) out.push(start.getTime() + i * 30 * 60_000);
  return out;
}

export default function checkout(main) {
  const tt0 = cartTotals();
  if (!tt0.count) {
    main.innerHTML = `<div class="container"><div class="empty" style="margin-top:40px">
      <div class="empty-icon">${icon('bag', 32)}</div><h3>${t('co.empty')}</h3><p>${t('cart.emptyHint')}</p>
      <a class="btn btn-primary" href="#/">${t('cart.browse')}</a></div></div>`;
    return;
  }

  const a = getData().address;
  const field = (name, label, { type = 'text', ph = '', full = false, value = '', attrs = '' } = {}) => `
    <div class="field ${full ? 'full' : ''}" data-field="${name}">
      <label for="f-${name}">${label}</label>
      <input id="f-${name}" class="input" name="${name}" type="${type}" placeholder="${ph}" value="${esc(value)}" ${attrs} />
      <span class="field-error" id="e-${name}"></span>
    </div>`;
  const choice = (name, value, title, sub, ic, checked) => `
    <label class="choice">
      <input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''} />
      <span class="choice-icon">${icon(ic, 20)}</span>
      <span class="choice-body"><span class="choice-title">${title}</span><span class="choice-sub">${sub}</span></span>
      <span class="radio"></span>
    </label>`;

  main.innerHTML = `
    <div class="container">
      <a class="back-link" href="#/r/${tt0.restaurant.id}">${icon('arrowLeft', 16, 'class="flip-rtl"')} ${esc(L(tt0.restaurant.name))}</a>
      <h1 class="page-title" style="margin-top:10px">${t('co.title')}</h1>
      <p class="page-sub">${t('co.sub')}</p>
      <form class="checkout-grid" novalidate>
        <div>
          <section class="card step-card">
            <div class="step-head"><span class="step-num">1</span><h2>${t('co.address')}</h2>
              <button type="button" class="btn btn-ghost btn-sm" data-demo style="margin-inline-start:auto">${icon('sparkle', 15)} Demo</button>
            </div>
            <div class="form-grid">
              ${field('name', t('co.name'), { ph: t('co.namePh'), value: a.name, attrs: 'autocomplete="name" required' })}
              ${field('phone', t('co.phone'), { type: 'tel', ph: '01xxxxxxxxx', value: a.phone, attrs: 'autocomplete="tel" inputmode="numeric" dir="ltr" required maxlength="11"' })}
              <div class="field">
                <label for="f-area">${t('co.area')}</label>
                <select id="f-area" class="select" name="area">
                  ${Object.entries(AREAS).map(([id, n]) => `<option value="${id}" ${id === a.area ? 'selected' : ''}>${esc(L(n))}</option>`).join('')}
                </select>
              </div>
              ${field('floor', t('co.floor'), { ph: t('co.floorPh'), value: a.floor })}
              ${field('street', t('co.street'), { ph: t('co.streetPh'), value: a.street, full: true, attrs: 'autocomplete="street-address" required' })}
              <div class="field full">
                <label for="f-notes">${t('co.notes')}</label>
                <textarea id="f-notes" class="textarea" name="notes" rows="2" maxlength="160" placeholder="${t('co.notesPh')}">${esc(a.notes)}</textarea>
              </div>
            </div>
          </section>

          <section class="card step-card">
            <div class="step-head"><span class="step-num">2</span><h2>${t('co.time')}</h2></div>
            <div class="choice-grid">
              ${choice('when', 'asap', t('co.asap'), t('co.asapSub', { a: tt0.restaurant.eta[0], b: tt0.restaurant.eta[1] }), 'scooter', true)}
              ${choice('when', 'later', t('co.schedule'), t('co.scheduleSub'), 'clock', false)}
            </div>
            <div class="field" data-slot hidden style="margin-top:14px;max-width:280px">
              <label for="f-slot" class="sr-only">${t('co.schedule')}</label>
              <select id="f-slot" class="select" name="slot">${slots().map((s) => `<option value="${s}">${fmtTime(s)}</option>`).join('')}</select>
            </div>
          </section>

          <section class="card step-card">
            <div class="step-head"><span class="step-num">3</span><h2>${t('co.payment')}</h2></div>
            <div class="choice-grid">
              ${choice('pay', 'cash', t('pay.cash'), t('pay.cashSub'), 'cash', true)}
              ${choice('pay', 'card', t('pay.card'), t('pay.cardSub'), 'card', false)}
              ${choice('pay', 'wallet', t('pay.wallet'), t('pay.walletSub'), 'wallet', false)}
            </div>
          </section>
        </div>
        <aside class="card step-card summary" data-summary aria-live="polite">${summaryHTML(tt0)}</aside>
      </form>
    </div>`;

  const form = main.querySelector('form');
  const F = form.elements;

  form.addEventListener('change', (e) => {
    if (e.target.name === 'when') form.querySelector('[data-slot]').hidden = e.target.value !== 'later';
  });

  main.querySelector('[data-demo]').onclick = () => {
    const demo = document.documentElement.lang === 'ar'
      ? { name: 'أحمد محمود', street: '12 شارع 26 يوليو', floor: 'الدور 4، شقة 8' }
      : { name: 'Ahmed Mahmoud', street: '12 26th of July St.', floor: 'Floor 4, apt 8' };
    F.name.value = demo.name;
    F.phone.value = '01012345678';
    F.street.value = demo.street;
    F.floor.value = demo.floor;
    form.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
  };

  const setError = (name, msg) => {
    const f = form.querySelector(`[data-field="${name}"]`);
    f.classList.toggle('invalid', !!msg);
    f.querySelector('.field-error').textContent = msg || '';
    const input = f.querySelector('input');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) input.setAttribute('aria-describedby', `e-${name}`);
  };
  form.addEventListener('input', (e) => {
    if (e.target.closest('.field.invalid')) setError(e.target.name, '');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = {
      name: F.name.value.trim(),
      phone: F.phone.value.replace(/\s|-/g, ''),
      area: F.area.value,
      street: F.street.value.trim(),
      floor: F.floor.value.trim(),
      notes: F.notes.value.trim(),
    };
    const errors = {
      name: v.name ? '' : t('co.required'),
      phone: !v.phone ? t('co.required') : PHONE_RE.test(v.phone) ? '' : t('co.phoneBad'),
      street: v.street ? '' : t('co.required'),
    };
    Object.entries(errors).forEach(([k, msg]) => setError(k, msg));
    const firstBad = Object.keys(errors).find((k) => errors[k]);
    if (firstBad) {
      F[firstBad].focus();
      return;
    }
    const tt = cartTotals();
    if (isPaused(tt.restaurant.id)) return toast(t('co.closed'), { type: 'error' });
    if (tt.minShort > 0) return toast(t('co.minNotMet'), { type: 'error' });

    const when = form.querySelector('input[name=when]:checked').value;
    const order = placeOrder({
      address: v,
      payment: form.querySelector('input[name=pay]:checked').value,
      scheduleAt: when === 'later' ? Number(F.slot.value) : null,
    });
    if (order) {
      toast(t('co.placed'), { icon: 'check' });
      location.hash = `#/track/${order.id}`;
    }
  });

  const unsub = subscribe((r) => {
    if (!(r.startsWith('cart') || r === 'sync')) return;
    const tt = cartTotals();
    if (!tt.count) {
      location.hash = '#/';
      return;
    }
    main.querySelector('[data-summary]').innerHTML = summaryHTML(tt);
  });
  return unsub;
}
