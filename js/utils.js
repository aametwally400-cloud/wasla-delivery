// Small, dependency-free helpers shared by every view.

export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape any untrusted text before it goes into an HTML template. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Deterministic PRNG so generated demo data is identical on every load. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(rand, items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function startOfDay(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Days since the Unix epoch in local time — a stable key for a calendar day. */
export function dayNumber(ts) {
  const d = new Date(ts);
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / DAY);
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0);

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function initials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

/** A stable color for an avatar, derived from a string. */
const AVATAR_COLORS = ['#2a78d6', '#e0632f', '#159a6b', '#c98500', '#c74f7f', '#0f7a0f', '#6250d6', '#d13f3e', '#0e7490', '#7c4d1f'];
export function colorFor(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Parse "#/path?x=1" into { path, query }. */
export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function buildHash(path, query = {}) {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null && v !== false)).toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}

export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
