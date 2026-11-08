// App state: preferences, cart, the orders you place, and admin overrides.
// Persisted to localStorage and kept in sync between tabs, so an order placed
// on the storefront appears on the dashboard open in another tab.

import { setLang } from './i18n.js';
import { itemById, restaurantById, OPTION_GROUPS, PROMO_CODES, SERVICE_RATE, SERVICE_CAP } from './data.js';

const PREFS_KEY = 'wasla:prefs';
const DATA_KEY = 'wasla:data:v1';

const defaultData = () => ({
  cart: { restaurantId: null, lines: [] },
  promo: null,
  address: { area: 'zamalek', street: '', floor: '', name: '', phone: '', notes: '' },
  favorites: [],
  orders: [],
  overrides: {},
  paused: {},
  notifications: [],
  seq: 0,
});

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be unavailable (private mode) — the app still works in memory */
  }
}

let prefs = { lang: 'ar', theme: 'system', ...(read(PREFS_KEY) || {}) };
let data = { ...defaultData(), ...(read(DATA_KEY) || {}) };
const subscribers = new Set();

export const getData = () => data;
export const getPrefs = () => prefs;

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
function emit(reason) {
  for (const fn of [...subscribers]) fn(reason);
}

/** Mutate state in place, persist, and notify. */
export function update(mutator, reason = 'data') {
  mutator(data);
  write(DATA_KEY, data);
  emit(reason);
}

// ---------- Preferences ----------
const media = matchMedia('(prefers-color-scheme: dark)');
export function resolvedTheme() {
  return prefs.theme === 'system' ? (media.matches ? 'dark' : 'light') : prefs.theme;
}
function applyPrefs() {
  setLang(prefs.lang);
  document.documentElement.dataset.theme = resolvedTheme();
}
applyPrefs();
media.addEventListener('change', () => {
  if (prefs.theme === 'system') {
    applyPrefs();
    emit('theme');
  }
});

export function setPref(key, value) {
  prefs = { ...prefs, [key]: value };
  write(PREFS_KEY, prefs);
  applyPrefs();
  emit(key);
}
export const toggleTheme = () => setPref('theme', resolvedTheme() === 'dark' ? 'light' : 'dark');
export const toggleLang = () => setPref('lang', prefs.lang === 'ar' ? 'en' : 'ar');

// ---------- Cross-tab sync ----------
window.addEventListener('storage', (e) => {
  if (e.key === DATA_KEY) {
    data = { ...defaultData(), ...(read(DATA_KEY) || {}) };
    emit('sync');
  } else if (e.key === PREFS_KEY) {
    prefs = { lang: 'ar', theme: 'system', ...(read(PREFS_KEY) || {}) };
    applyPrefs();
    emit('lang');
  }
});

export function resetDemo() {
  data = defaultData();
  write(DATA_KEY, data);
  emit('reset');
}

// ---------- Cart ----------
export function unitPrice(item, options = {}) {
  let p = item.price;
  for (const [groupKey, ids] of Object.entries(options)) {
    const group = OPTION_GROUPS[groupKey];
    if (!group) continue;
    for (const id of ids) p += group.choices.find((c) => c.id === id)?.price || 0;
  }
  return p;
}

const lineKey = (itemId, options, note) =>
  `${itemId}|${Object.keys(options).sort().map((k) => `${k}:${[...options[k]].sort().join(',')}`).join(';')}|${note || ''}`;

/** True when adding from `restaurantId` would replace a cart from another restaurant. */
export function cartConflicts(restaurantId) {
  const { cart } = data;
  return cart.lines.length > 0 && cart.restaurantId && cart.restaurantId !== restaurantId;
}

export function addToCart(itemId, qty = 1, options = {}, note = '') {
  const item = itemById[itemId];
  if (!item) return;
  update((d) => {
    if (d.cart.restaurantId !== item.restaurantId) d.cart = { restaurantId: item.restaurantId, lines: [] };
    const key = lineKey(itemId, options, note.trim());
    const existing = d.cart.lines.find((l) => l.key === key);
    if (existing) existing.qty += qty;
    else d.cart.lines.push({ key, itemId, qty, options, note: note.trim() });
  }, 'cart:add');
}

export function setLineQty(key, qty) {
  update((d) => {
    const line = d.cart.lines.find((l) => l.key === key);
    if (!line) return;
    line.qty = qty;
    d.cart.lines = d.cart.lines.filter((l) => l.qty > 0);
    if (!d.cart.lines.length) d.cart.restaurantId = null;
  }, 'cart');
}

export function clearCart() {
  update((d) => {
    d.cart = { restaurantId: null, lines: [] };
  }, 'cart');
}

export function cartCount() {
  return data.cart.lines.reduce((s, l) => s + l.qty, 0);
}

export function itemQtyInCart(itemId) {
  return data.cart.lines.filter((l) => l.itemId === itemId).reduce((s, l) => s + l.qty, 0);
}

export function cartTotals() {
  const { cart, promo } = data;
  const restaurant = restaurantById[cart.restaurantId] || null;
  const lines = cart.lines
    .map((l) => {
      const item = itemById[l.itemId];
      if (!item) return null;
      const unit = unitPrice(item, l.options);
      return { ...l, item, unit, total: unit * l.qty };
    })
    .filter(Boolean);
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const fee = restaurant && count ? restaurant.fee : 0;
  const service = count ? Math.min(SERVICE_CAP, Math.round(subtotal * SERVICE_RATE)) : 0;
  const rule = promo && PROMO_CODES[promo.code];
  const discount = rule && count ? Math.min(rule.cap, Math.round((subtotal * rule.pct) / 100)) : 0;
  const total = Math.max(0, subtotal + fee + service - discount);
  const minShort = restaurant ? Math.max(0, restaurant.minOrder - subtotal) : 0;
  return { restaurant, lines, subtotal, count, fee, service, discount, total, minShort, promo: rule ? { code: promo.code, ...rule } : null };
}

export function applyPromo(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!PROMO_CODES[c]) return false;
  update((d) => {
    d.promo = { code: c };
  }, 'cart');
  return true;
}
export function removePromo() {
  update((d) => {
    d.promo = null;
  }, 'cart');
}

// ---------- Favorites & address ----------
export const isFavorite = (id) => data.favorites.includes(id);
export function toggleFavorite(id) {
  update((d) => {
    d.favorites = d.favorites.includes(id) ? d.favorites.filter((x) => x !== id) : [...d.favorites, id];
  }, 'favorites');
}
export function setAddress(patch) {
  update((d) => {
    d.address = { ...d.address, ...patch };
  }, 'address');
}

export function isPaused(restaurantId) {
  return !!data.paused[restaurantId];
}
export function setPaused(restaurantId, paused) {
  update((d) => {
    if (paused) d.paused[restaurantId] = true;
    else delete d.paused[restaurantId];
  }, 'paused');
}

/** Human-readable option labels for a cart/order line, e.g. ["Double", "Extra cheddar"]. */
export function optionLabels(options = {}) {
  const out = [];
  for (const [groupKey, ids] of Object.entries(options)) {
    const group = OPTION_GROUPS[groupKey];
    if (!group) continue;
    for (const id of ids) {
      const choice = group.choices.find((c) => c.id === id);
      if (choice) out.push(choice.name);
    }
  }
  return out;
}

export function nextOrderSeq() {
  return data.seq + 1;
}
