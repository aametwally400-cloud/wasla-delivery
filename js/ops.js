// Orders engine: deterministic demo history, the live order simulation,
// and every aggregate the dashboard shows.

import { RESTAURANTS, RIDERS, FIRST_NAMES, LAST_NAMES, AREAS, itemById, restaurantById, riderById } from './data.js';
import { getData, update, cartTotals, optionLabels, subscribe } from './store.js';
import { mulberry32, pickWeighted, startOfDay, dayNumber, clamp, MIN, HOUR, DAY } from './utils.js';

export const FLOW = ['placed', 'accepted', 'preparing', 'on_the_way', 'delivered'];
export const ACTIVE = new Set(['placed', 'accepted', 'preparing', 'on_the_way']);
const NEXT = { placed: 'accepted', accepted: 'preparing', preparing: 'on_the_way', on_the_way: 'delivered' };

/** Demo pacing for orders you place: the whole journey takes about 80 seconds. */
export const SIM_DUR = { placed: 10_000, accepted: 12_000, preparing: 22_000, on_the_way: 36_000 };
const SIM_TOTAL = Object.values(SIM_DUR).reduce((a, b) => a + b, 0);

const HISTORY_DAYS = 181;
const CUSTOMER_COUNT = 1400;
// Lunch and dinner peaks, quiet before dawn.
const HOUR_WEIGHTS = [0.5, 0.3, 0.15, 0.08, 0.05, 0.05, 0.12, 0.35, 0.7, 0.9, 1.0, 1.2, 1.7, 2.3, 2.5, 2.0, 1.5, 1.4, 1.7, 2.2, 2.7, 2.8, 2.1, 1.2];
const HOURS = HOUR_WEIGHTS.map((_, i) => i);
const AREA_IDS = Object.keys(AREAS);

// ---------- Generated history ----------
let base = null;

function generate() {
  const now = new Date();
  const rand0 = mulberry32(20261108);

  const customers = Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
    const f = FIRST_NAMES[Math.floor(rand0() * FIRST_NAMES.length)];
    const l = LAST_NAMES[Math.floor(rand0() * LAST_NAMES.length)];
    const prefix = ['010', '011', '012', '015'][Math.floor(rand0() * 4)];
    return {
      id: `c${i + 1}`,
      name: { ar: `${f[0]} ${l[0]}`, en: `${f[1]} ${l[1]}` },
      area: AREA_IDS[Math.floor(rand0() * AREA_IDS.length)],
      phone: `${prefix}${String(Math.floor(rand0() * 1e8)).padStart(8, '0')}`,
    };
  });

  const restWeights = RESTAURANTS.map((r) => r.weight);
  const menus = Object.fromEntries(RESTAURANTS.map((r) => [r.id, r.menu.flatMap((c) => c.items)]));
  const orders = [];

  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).getTime();
    const dn = dayNumber(day0);
    const rand = mulberry32(dn * 7919 + 13);
    const wd = new Date(day0).getDay();
    const weekday = wd === 4 ? 1.22 : wd === 5 ? 1.3 : wd === 6 ? 1.1 : 1;
    const trend = 0.74 + 0.34 * (1 - d / (HISTORY_DAYS - 1));
    const count = Math.round(165 * weekday * trend * (0.86 + rand() * 0.28));
    const day = [];

    for (let i = 0; i < count; i++) {
      const hour = pickWeighted(rand, HOURS, HOUR_WEIGHTS);
      const createdAt = day0 + hour * HOUR + Math.floor(rand() * HOUR);
      const r = pickWeighted(rand, RESTAURANTS, restWeights);
      const menu = menus[r.id];
      const n = rand() < 0.55 ? 1 : rand() < 0.8 ? 2 : 3;
      const lines = [];
      for (let k = 0; k < n; k++) {
        const item = menu[Math.floor(rand() * menu.length)];
        const existing = lines.find((l) => l.itemId === item.id);
        if (existing) existing.qty++;
        else lines.push({ itemId: item.id, qty: rand() < 0.8 ? 1 : 2, unit: item.price });
      }
      const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
      const service = Math.min(25, Math.round(subtotal * 0.05));
      const discount = rand() < 0.12 ? Math.min(100, Math.round(subtotal * 0.15)) : 0;
      const mid = (r.eta[0] + r.eta[1]) / 2;
      const deliveryMins = clamp(Math.round(mid + (rand() + rand() + rand() - 1.5) * 9), 14, 75);
      const cancelled = rand() < 0.055;
      const rr = rand();
      day.push({
        id: '',
        source: 'gen',
        restaurantId: r.id,
        customerId: customers[Math.floor(Math.pow(rand(), 1.7) * CUSTOMER_COUNT)].id,
        lines,
        subtotal,
        fee: r.fee,
        service,
        discount,
        total: subtotal + r.fee + service - discount,
        payment: rand() < 0.52 ? 'cash' : rand() < 0.8 ? 'card' : 'wallet',
        createdAt,
        deliveryMins,
        riderId: RIDERS[Math.floor(rand() * RIDERS.length)].id,
        cancelled,
        rating: cancelled ? null : rr < 0.68 ? 5 : rr < 0.92 ? 4 : 3,
      });
    }
    // Number orders in the order they were placed, so IDs read chronologically.
    day.sort((a, b) => a.createdAt - b.createdAt);
    day.forEach((o, idx) => (o.id = `WS-${(dn % 10000) * 1000 + idx}`));
    orders.push(...day);
  }

  const customerById = Object.fromEntries(customers.map((c) => [c.id, c]));
  return { day: startOfDay(), orders, customers, customerById };
}

function getBase() {
  if (!base || base.day !== startOfDay()) base = generate();
  return base;
}

// ---------- Status of a generated order at a point in time ----------
function genTimeline(o) {
  const half = Math.max(12, Math.round(o.deliveryMins * 0.5));
  return {
    placed: o.createdAt,
    accepted: o.createdAt + 3 * MIN,
    preparing: o.createdAt + 7 * MIN,
    on_the_way: o.createdAt + half * MIN,
    delivered: o.createdAt + o.deliveryMins * MIN,
  };
}

function genStatus(o, now) {
  const age = (now - o.createdAt) / MIN;
  if (o.cancelled) return age < 6 ? 'placed' : 'cancelled';
  const tl = genTimeline(o);
  let status = 'placed';
  for (const s of FLOW) if (now >= tl[s]) status = s;
  return status;
}

// ---------- Unified order view ----------
let cache = { at: 0, version: -1, list: [] };
let version = 0;
export const invalidate = () => {
  version++;
};
// Any state change (including one from another tab) can change the order list.
subscribe((reason) => {
  if (reason === 'sync' || reason === 'reset' || reason.startsWith('order')) invalidate();
});

function customerView(o, b) {
  if (o.source === 'user') return { name: o.customer.name, phone: o.customer.phone, area: o.customer.area, id: null };
  const c = b.customerById[o.customerId];
  return { name: c.name, phone: c.phone, area: c.area, id: c.id };
}

/**
 * Every order the dashboard knows about — generated history plus the orders
 * you placed — with live status and admin overrides applied. Newest last.
 */
export function allOrders(now = Date.now()) {
  if (cache.version === version && now - cache.at < 4000) return cache.list;
  const b = getBase();
  const { overrides, orders: mine } = getData();
  const list = [];
  const liveWindow = now - 2 * HOUR;

  for (const o of b.orders) {
    if (o.createdAt > now) break;
    const ov = overrides[o.id];
    let status;
    let history;
    if (ov) {
      status = ov.status;
      history = ov.history;
    } else if (o.createdAt < liveWindow) {
      status = o.cancelled ? 'cancelled' : 'delivered';
      history = null; // computed lazily by orderHistory()
    } else {
      status = genStatus(o, now);
      history = null;
    }
    list.push({ ...o, status, history, riderId: ov?.riderId ?? o.riderId, customer: customerView(o, b) });
  }
  for (const o of mine) list.push({ ...o, customer: customerView(o, b) });
  list.sort((a, b2) => a.createdAt - b2.createdAt);
  cache = { at: now, version, list };
  return list;
}

export function findOrder(id) {
  return allOrders().find((o) => o.id === id) || null;
}

/** Timestamps reached for each status (only the ones already reached). */
export function orderHistory(o, now = Date.now()) {
  if (o.history) return o.history;
  if (o.status === 'cancelled') return { placed: o.createdAt, cancelled: o.createdAt + 6 * MIN };
  const tl = genTimeline(o);
  const out = {};
  for (const s of FLOW) if (tl[s] <= now) out[s] = tl[s];
  return out;
}

/** Minutes until the food arrives (null when not applicable). */
export function etaMinutes(o, now = Date.now()) {
  if (!ACTIVE.has(o.status)) return null;
  if (o.source === 'user' && o.auto !== false) {
    const idx = FLOW.indexOf(o.status);
    let remaining = Math.max(0, SIM_DUR[o.status] - (now - o.statusAt));
    for (let i = idx + 1; i < FLOW.length - 1; i++) remaining += SIM_DUR[FLOW[i]];
    return Math.max(1, Math.ceil((remaining / SIM_TOTAL) * o.deliveryMins));
  }
  const due = o.createdAt + o.deliveryMins * MIN;
  return Math.max(1, Math.ceil((due - now) / MIN));
}

/** 0..1 progress of the rider along the route (only meaningful while on the way). */
export function routeProgress(o, now = Date.now()) {
  if (o.status === 'delivered') return 1;
  if (o.status !== 'on_the_way') return 0;
  if (o.source === 'user' && o.auto !== false) return clamp((now - o.statusAt) / SIM_DUR.on_the_way, 0, 0.98);
  const h = orderHistory(o, now);
  const start = h.on_the_way || now;
  const end = o.createdAt + o.deliveryMins * MIN;
  return clamp((now - start) / Math.max(1, end - start), 0, 0.98);
}

// ---------- Riders ----------
export function riderStatuses(now = Date.now()) {
  const orders = allOrders(now);
  const today0 = startOfDay(now);
  const busy = {};
  const deliveredToday = {};
  for (let i = orders.length - 1; i >= 0; i--) {
    const o = orders[i];
    if (o.createdAt < today0 - 2 * HOUR) break;
    if (!o.riderId) continue;
    if (['accepted', 'preparing', 'on_the_way'].includes(o.status) && !busy[o.riderId]) busy[o.riderId] = o;
    if (o.status === 'delivered' && o.createdAt >= today0) deliveredToday[o.riderId] = (deliveredToday[o.riderId] || 0) + 1;
  }
  // A few riders are off shift; which ones changes every hour.
  const rand = mulberry32(dayNumber(now) * 24 + new Date(now).getHours());
  const offline = new Set();
  const pool = RIDERS.filter((r) => !busy[r.id]);
  while (offline.size < 3 && pool.length) offline.add(pool.splice(Math.floor(rand() * pool.length), 1)[0].id);

  return RIDERS.map((r) => {
    const status = busy[r.id] ? 'busy' : offline.has(r.id) ? 'offline' : 'available';
    const onTime = Math.round(84 + (r.rating - 4.5) * 28 + (r.id.length % 3));
    return { ...r, status, order: busy[r.id] || null, today: deliveredToday[r.id] || 0, onTime: clamp(onTime, 80, 99) };
  });
}

function pickRider() {
  const free = riderStatuses().filter((r) => r.status === 'available');
  const pool = free.length ? free : RIDERS;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

// ---------- Placing & moving orders ----------
export function placeOrder({ address, payment, scheduleAt }) {
  const t = cartTotals();
  if (!t.restaurant || !t.count) return null;
  const now = Date.now();
  const dn = dayNumber(now);
  const data = getData();
  const seq = data.seq + 1;
  const id = `WS-${(dn % 10000) * 1000 + 900 + (seq % 100)}`;
  const mid = Math.round((t.restaurant.eta[0] + t.restaurant.eta[1]) / 2);
  const order = {
    id,
    source: 'user',
    restaurantId: t.restaurant.id,
    customer: { name: address.name, phone: address.phone, area: address.area },
    address: { ...address },
    lines: t.lines.map((l) => ({ itemId: l.itemId, qty: l.qty, unit: l.unit, options: l.options, note: l.note })),
    subtotal: t.subtotal,
    fee: t.fee,
    service: t.service,
    discount: t.discount,
    total: t.total,
    promo: t.promo?.code || null,
    payment,
    scheduleAt: scheduleAt || null,
    createdAt: now,
    status: 'placed',
    statusAt: now,
    history: { placed: now },
    riderId: null,
    deliveryMins: mid,
    auto: true,
    rating: null,
  };
  update((d) => {
    d.seq = seq;
    d.orders.push(order);
    d.cart = { restaurantId: null, lines: [] };
    d.promo = null;
    d.address = { ...d.address, ...address };
    d.notifications.unshift({ id: `n${now}`, orderId: id, restaurantId: order.restaurantId, at: now, read: false });
    d.notifications = d.notifications.slice(0, 30);
  }, 'order:new');
  invalidate();
  return order;
}

function advance(rec, now) {
  let changed = false;
  while (rec.auto !== false && SIM_DUR[rec.status] && now - rec.statusAt >= SIM_DUR[rec.status]) {
    rec.statusAt += SIM_DUR[rec.status];
    rec.status = NEXT[rec.status];
    rec.history = { ...rec.history, [rec.status]: rec.statusAt };
    if (rec.status === 'accepted' && !rec.riderId) rec.riderId = pickRider();
    changed = true;
  }
  return changed;
}

const isDue = (rec, now) => rec.auto !== false && SIM_DUR[rec.status] && now - rec.statusAt >= SIM_DUR[rec.status];

/** Called every second: moves simulated orders forward. */
export function tick() {
  const now = Date.now();
  const d = getData();
  const due = d.orders.some((o) => isDue(o, now)) || Object.values(d.overrides).some((o) => isDue(o, now));
  if (!due) return false;
  update((data) => {
    for (const o of data.orders) advance(o, now);
    for (const o of Object.values(data.overrides)) advance(o, now);
  }, 'tick');
  invalidate();
  return true;
}

/** Admin: move an order to a status (or cancel it). Works for generated and placed orders. */
export function setOrderStatus(id, status) {
  const o = findOrder(id);
  if (!o) return;
  const now = Date.now();
  update((d) => {
    let rec = d.orders.find((x) => x.id === id);
    if (!rec) {
      rec = d.overrides[id] || { status: o.status, statusAt: now, history: { ...orderHistory(o, now) }, riderId: o.riderId, auto: true };
      d.overrides[id] = rec;
    }
    rec.status = status;
    rec.statusAt = now;
    rec.history = { ...rec.history, [status]: now };
    if (status === 'accepted' && !rec.riderId) rec.riderId = pickRider();
  }, 'order:status');
  invalidate();
}

export function assignRider(id, riderId) {
  const o = findOrder(id);
  if (!o) return;
  const now = Date.now();
  update((d) => {
    let rec = d.orders.find((x) => x.id === id);
    if (!rec) {
      rec = d.overrides[id] || { status: o.status, statusAt: now, history: { ...orderHistory(o, now) }, riderId: o.riderId, auto: true };
      d.overrides[id] = rec;
    }
    rec.riderId = riderId;
  }, 'order:rider');
  invalidate();
}

export function rateOrder(id, stars) {
  update((d) => {
    const rec = d.orders.find((x) => x.id === id);
    if (rec) rec.rating = stars;
  }, 'order:rate');
  invalidate();
}

// ---------- Display helpers ----------
export function lineName(line) {
  return itemById[line.itemId]?.name || { ar: line.itemId, en: line.itemId };
}
export function lineOptions(line) {
  return optionLabels(line.options);
}
export const riderOf = (o) => (o.riderId ? riderById[o.riderId] : null);
export const restaurantOf = (o) => restaurantById[o.restaurantId];

// ---------- Analytics ----------
export const RANGES = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

export function rangeBounds(key, now = Date.now()) {
  const days = RANGES[key] || 7;
  const today0 = startOfDay(now);
  const from = new Date(today0).setDate(new Date(today0).getDate() - (days - 1));
  const span = now - from;
  return { key, days, from, to: now, prevFrom: from - (key === 'today' ? DAY : days * DAY), prevTo: from - (key === 'today' ? DAY : days * DAY) + span };
}

function inRange(orders, from, to) {
  // Orders are sorted by createdAt: binary search the start.
  let lo = 0;
  let hi = orders.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (orders[mid].createdAt < from) lo = mid + 1;
    else hi = mid;
  }
  const out = [];
  for (let i = lo; i < orders.length && orders[i].createdAt <= to; i++) out.push(orders[i]);
  return out;
}

function summarize(list) {
  let revenue = 0;
  let count = 0;
  let delSum = 0;
  let delCount = 0;
  for (const o of list) {
    if (o.status === 'cancelled') continue;
    revenue += o.total;
    count++;
    if (o.status === 'delivered') {
      delSum += o.deliveryMins;
      delCount++;
    }
  }
  return { revenue, orders: count, aov: count ? revenue / count : 0, delivery: delCount ? delSum / delCount : 0 };
}

/** Buckets for the trend chart: hourly for "today", daily otherwise. */
function buckets(list, b) {
  const out = [];
  if (b.key === 'today') {
    const hours = new Date(b.to).getHours() + 1;
    for (let h = 0; h < hours; h++) out.push({ start: b.from + h * HOUR, list: [] });
    for (const o of list) {
      const h = new Date(o.createdAt).getHours();
      if (out[h]) out[h].list.push(o);
    }
  } else {
    const d0 = new Date(b.from);
    for (let i = 0; i < b.days; i++) out.push({ start: new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i).getTime(), list: [] });
    let idx = 0;
    for (const o of list) {
      while (idx + 1 < out.length && o.createdAt >= out[idx + 1].start) idx++;
      out[idx].list.push(o);
    }
  }
  return out.map((bk) => ({ start: bk.start, ...summarize(bk.list) }));
}

export function analytics(rangeKey, now = Date.now()) {
  const all = allOrders(now);
  const b = rangeBounds(rangeKey, now);
  const cur = inRange(all, b.from, b.to);
  const prev = inRange(all, b.prevFrom, b.prevTo);
  const k = summarize(cur);
  const p = summarize(prev);
  const series = buckets(cur, b);

  const byHour = Array(24).fill(0);
  const byCuisine = {};
  const payments = { cash: 0, card: 0, wallet: 0 };
  const perRest = {};
  for (const o of cur) {
    if (o.status === 'cancelled') continue;
    byHour[new Date(o.createdAt).getHours()]++;
    const r = restaurantById[o.restaurantId];
    byCuisine[r.cuisine] = (byCuisine[r.cuisine] || 0) + 1;
    payments[o.payment] = (payments[o.payment] || 0) + 1;
    const pr = (perRest[r.id] ||= { restaurant: r, orders: 0, revenue: 0, ratingSum: 0, ratingN: 0 });
    pr.orders++;
    pr.revenue += o.total;
    if (o.rating) {
      pr.ratingSum += o.rating;
      pr.ratingN++;
    }
  }
  const top = Object.values(perRest)
    .map((x) => ({ ...x, aov: x.revenue / x.orders, rating: x.ratingN ? x.ratingSum / x.ratingN : x.restaurant.rating }))
    .sort((a, b2) => b2.revenue - a.revenue);

  const live = all.filter((o) => ACTIVE.has(o.status)).reverse();
  return { bounds: b, kpi: k, prev: p, series, byHour, byCuisine, payments, top, live };
}

export function restaurantStats(now = Date.now()) {
  const all = allOrders(now);
  const from = startOfDay(now) - 29 * DAY;
  const out = Object.fromEntries(RESTAURANTS.map((r) => [r.id, { orders: 0, revenue: 0, live: 0 }]));
  for (let i = all.length - 1; i >= 0 && all[i].createdAt >= from; i--) {
    const o = all[i];
    const s = out[o.restaurantId];
    if (o.status === 'cancelled') continue;
    s.orders++;
    s.revenue += o.total;
    if (ACTIVE.has(o.status)) s.live++;
  }
  return out;
}

export function customerStats(now = Date.now()) {
  const b = getBase();
  const all = allOrders(now);
  const agg = Object.fromEntries(b.customers.map((c) => [c.id, { ...c, orders: 0, spent: 0, first: Infinity, last: 0 }]));
  for (const o of all) {
    if (o.source !== 'gen' || o.status === 'cancelled') continue;
    const a = agg[o.customerId];
    a.orders++;
    a.spent += o.total;
    if (o.createdAt < a.first) a.first = o.createdAt;
    if (o.createdAt > a.last) a.last = o.createdAt;
  }
  const list = Object.values(agg).filter((c) => c.orders > 0);
  const spends = list.map((c) => c.spent).sort((x, y) => y - x);
  const vipLine = spends[Math.floor(spends.length * 0.1)] || Infinity;
  for (const c of list) c.segment = c.spent >= vipLine ? 'vip' : now - c.first < 30 * DAY ? 'new' : 'regular';
  return list;
}

export function activeCount(now = Date.now()) {
  let n = 0;
  const all = allOrders(now);
  for (let i = all.length - 1; i >= 0 && all[i].createdAt > now - 3 * HOUR; i--) if (ACTIVE.has(all[i].status)) n++;
  return n;
}
