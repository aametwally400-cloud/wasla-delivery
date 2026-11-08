// Inline stroke icons (24×24 grid, 2px stroke, round caps).

const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bag: '<path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.5Z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bike: '<circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M8.5 17h5l3-6h-4l-2-4H8m5.5 4L11 17m3.5-10H17l1.5 4"/>',
  car: '<path d="M5 17h14v-4.5l-2-5H7l-2 5V17Z"/><path d="M5 12.5h14"/><circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/>',
  heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  arrowRight: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  arrowUp: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14m6-6-6 6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5Z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  receipt: '<path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5L6 20.5v-17Z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12v8h13v-8M10 20v-4.5h4V20"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  scooter: '<circle cx="6" cy="17.5" r="2.5"/><circle cx="18" cy="17.5" r="2.5"/><path d="M8.5 17.5h7l-2-8.5H16M13.5 9H10"/><path d="M15.5 9.5 18 15"/><path d="M3.5 13h6v4.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  phone: '<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z"/>',
  chat: '<path d="M4.5 18.5 5.8 15A7.5 7.5 0 1 1 9 18.2l-4.5.3Z"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><circle cx="16" cy="13.5" r="1.2"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0l-8.5-8.1Z"/><circle cx="8" cy="8" r="1.5"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5h10L18 7M9 7V4.5h6V7"/>',
  home: '<path d="m3.5 11 8.5-7 8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  logout: '<path d="M15 4.5h3.5v15H15M10 16l4-4-4-4M14 12H4"/>',
  sparkle: '<path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14l-6.7-2 6.7-2L12 3.5Z"/>',
  fire: '<path d="M12 21a7 7 0 0 0 7-7c0-4.5-4-6-4-10.5C11 5 9.5 8 9.5 10.5 8 9.5 7.5 8 7.5 7 5.8 8.8 5 11.2 5 14a7 7 0 0 0 7 7Z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',
  trendUp: '<path d="m3.5 16.5 6-6 4 4 7-7"/><path d="M15 7.5h5.5V13"/>',
  trendDown: '<path d="m3.5 7.5 6 6 4-4 7 7"/><path d="M15 16.5h5.5V11"/>',
  external: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M17 14v5.5H4.5V7H10"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M3.5 15h17M9.5 10v9.5"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4.5V9H15"/>',
  target: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2"/>',
  chef: '<path d="M7 14.5V20h10v-5.5"/><path d="M7 14.5a4 4 0 0 1-1-7.8 4.5 4.5 0 0 1 8.6-1.5 4 4 0 0 1 3.4 7A4 4 0 0 1 17 14.5H7Z"/><path d="M7 17h10"/>',
  package: '<path d="m12 3.5 8 4.5v8l-8 4.5-8-4.5V8l8-4.5Z"/><path d="m4 8 8 4.5L20 8M12 12.5v8"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.4 2.4 4.8-4.9"/>',
  xCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/>',
  timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2 1.5M9.5 3.5h5M12 3.5v3"/>',
  github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  filter: '<path d="M4 5.5h16l-6.2 7.3v5.7l-3.6 1.8v-7.5L4 5.5Z"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  dots: '<circle cx="12" cy="5.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="18.5" r="1.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  leaf: '<path d="M5 19c0-8 5-13.5 14.5-14.5C19 14 13.5 19 5.5 19"/><path d="M5 19c3-4 6-6.5 9.5-8"/>',
};

const FILLED = new Set(['star']);

export function icon(name, size = 20, extra = '') {
  const body = P[name] || P.info;
  const fill = FILLED.has(name) ? 'currentColor' : 'none';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;
}

/** The Wasla mark: a "W" that reads like a route between three stops. */
export function logoMark(size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.5h2.6l2.4 9 3.5-7 3.5 7 2.4-9h2.6"/></svg>`;
}
