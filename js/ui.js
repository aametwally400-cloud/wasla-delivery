// UI primitives: images with fallback, toasts, modal/drawer, confirm, confetti.

import { icon } from './icons.js';
import { t } from './i18n.js';
import { esc, colorFor, initials, reducedMotion } from './utils.js';
import { photo } from './data.js';

// ---------- Images ----------
// Every photo fades in when loaded and falls back to a branded gradient if it fails.
const GRADIENTS = [
  'linear-gradient(135deg,#ffb18f,#ff5b2e)', 'linear-gradient(135deg,#fcd34d,#f97316)', 'linear-gradient(135deg,#86efac,#16a34a)',
  'linear-gradient(135deg,#93c5fd,#2563eb)', 'linear-gradient(135deg,#f0abfc,#a21caf)', 'linear-gradient(135deg,#fca5a5,#b91c1c)',
];

export function media(key, { cls = '', w = 800, label = '', alt = '' } = {}) {
  const fb = GRADIENTS[Math.abs([...String(key)].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % GRADIENTS.length];
  return `<div class="media ${cls}" style="--fb:${fb}"><img src="${photo(key, w)}" alt="${esc(alt)}" loading="lazy" decoding="async" /><span class="fb-label" aria-hidden="true">${esc(label)}</span></div>`;
}

document.addEventListener(
  'load',
  (e) => {
    if (e.target.tagName === 'IMG' && e.target.parentElement?.classList.contains('media')) e.target.classList.add('loaded');
  },
  true,
);
document.addEventListener(
  'error',
  (e) => {
    if (e.target.tagName === 'IMG' && e.target.parentElement?.classList.contains('media')) e.target.parentElement.classList.add('fallback');
  },
  true,
);
/** Images that finished loading before the listener saw them (cache hits). */
export function settleImages(root = document) {
  for (const img of root.querySelectorAll('.media img:not(.loaded)')) {
    if (img.complete) {
      if (img.naturalWidth) img.classList.add('loaded');
      else img.parentElement.classList.add('fallback');
    }
  }
}

export function restLogo(r, cls = '') {
  const name = r.name.en;
  return `<span class="rest-logo ${cls}" style="background:${r.color}" aria-hidden="true">${esc(initials(name))}</span>`;
}

export function avatar(name, cls = '') {
  const label = typeof name === 'object' ? name.en : name;
  return `<span class="avatar ${cls}" style="background:${colorFor(label)}" aria-hidden="true">${esc(initials(label) || '?')}</span>`;
}

// ---------- Toasts ----------
export function toast(message, { type = 'success', icon: ic, action, onAction, duration = 3200 } = {}) {
  const root = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const iconName = ic || (type === 'error' ? 'x' : type === 'brand' ? 'bell' : 'check');
  el.innerHTML = `<span class="t-icon">${icon(iconName, 15)}</span><span class="t-msg"></span>${action ? `<button class="t-action" type="button"></button>` : ''}`;
  el.querySelector('.t-msg').textContent = message;
  if (action) {
    const btn = el.querySelector('.t-action');
    btn.textContent = action;
    btn.addEventListener('click', () => {
      onAction?.();
      dismiss();
    });
  }
  root.appendChild(el);
  while (root.children.length > 3) root.firstElementChild.remove();
  let timer = setTimeout(dismiss, duration);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => (timer = setTimeout(dismiss, 1500)));
  function dismiss() {
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
  }
}

// ---------- Overlays (modal + drawer) ----------
const stack = [];

function trapFocus(container, e) {
  const focusables = [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Open a modal or drawer. `render(panel, close)` fills the panel.
 * Returns a close() function.
 */
export function openOverlay({ kind = 'modal', cls = '', label = '', render, onClose }) {
  const root = document.getElementById('overlay-root');
  const prevFocus = document.activeElement;
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay';
  const panel = document.createElement('div');
  panel.className = `${kind} ${cls}`;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  if (label) panel.setAttribute('aria-label', label);
  root.append(backdrop, panel);
  document.body.style.overflow = 'hidden';

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    panel.classList.add('closing');
    backdrop.classList.add('closing');
    stack.splice(stack.indexOf(entry), 1);
    setTimeout(() => {
      panel.remove();
      backdrop.remove();
      if (!stack.length) document.body.style.overflow = '';
      prevFocus?.focus?.({ preventScroll: true });
      onClose?.();
    }, reducedMotion() ? 0 : 200);
  };
  const entry = { panel, close };
  stack.push(entry);
  backdrop.addEventListener('click', close);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
    if (e.key === 'Tab') trapFocus(panel, e);
  });
  render(panel, close);
  settleImages(panel);
  requestAnimationFrame(() => (panel.querySelector('[autofocus]') || panel.querySelector('button, a[href], input'))?.focus({ preventScroll: true }));
  return close;
}

export function closeAllOverlays() {
  [...stack].reverse().forEach((o) => o.close());
}

export function confirmDialog({ title, body, ok, danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    openOverlay({
      kind: 'modal',
      cls: 'sm',
      label: title,
      onClose: () => !answered && resolve(false),
      render(panel, close) {
        panel.innerHTML = `
          <div class="modal-body">
            <h2 class="modal-title">${esc(title)}</h2>
            <p class="modal-sub">${esc(body)}</p>
          </div>
          <div class="modal-foot">
            <button class="btn btn-secondary" data-no type="button" style="flex:1">${t('cancel')}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes type="button" style="flex:1" autofocus>${esc(ok)}</button>
          </div>`;
        panel.querySelector('[data-no]').onclick = () => close();
        panel.querySelector('[data-yes]').onclick = () => {
          answered = true;
          resolve(true);
          close();
        };
      },
    });
  });
}

// ---------- Confetti ----------
export function confetti() {
  if (reducedMotion()) return;
  const wrap = document.createElement('div');
  wrap.className = 'confetti';
  const colors = ['#ff5b2e', '#fab219', '#1baf7a', '#2a78d6', '#e87ba4', '#6250d6'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4000);
}

export function bump(el) {
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

export function statusBadge(status, { pulse = true } = {}) {
  const live = pulse && ['placed', 'accepted', 'preparing', 'on_the_way'].includes(status);
  return `<span class="badge st-${status} ${live ? 'pulse' : ''}"><span class="bdot"></span>${t(`st.${status}`)}</span>`;
}

export function stars(n) {
  return `<span class="rating">${icon('star', 14)}${n.toFixed(1)}</span>`;
}
