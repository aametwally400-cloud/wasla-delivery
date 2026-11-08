// Hand-rolled SVG charts (no library): area/line with crosshair, columns with
// per-bar tooltips, sparklines. Marks follow one spec: 2px lines, 10% area wash,
// ≤24px bars with 4px rounded data-ends, hairline grid, ringed end-dots.

const NS = 'http://www.w3.org/2000/svg';
const observers = new WeakMap();

function niceStep(raw) {
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

function niceScale(max, ticks = 4) {
  const step = niceStep((max || 1) / ticks);
  const top = Math.ceil((max || 1) / step) * step;
  const values = [];
  for (let v = 0; v <= top + step / 2; v += step) values.push(v);
  return { top, values };
}

function el(tag, attrs = {}, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

/** Re-render on width changes; stop observing once the chart leaves the page. */
function responsive(container, draw) {
  observers.get(container)?.disconnect();
  let lastW = 0;
  const ro = new ResizeObserver(() => {
    if (!container.isConnected) return ro.disconnect();
    const w = container.clientWidth;
    if (w && Math.abs(w - lastW) > 2) {
      lastW = w;
      draw(w);
    }
  });
  ro.observe(container);
  observers.set(container, ro);
  const w = container.clientWidth;
  if (w) {
    lastW = w;
    draw(w);
  }
}

function makeTip(container) {
  let tip = container.querySelector(':scope > .chart-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'chart-tip';
    tip.setAttribute('aria-hidden', 'true');
    container.appendChild(tip);
  }
  return tip;
}

/** Tooltip content: value leads, label follows. Built with textContent (labels are data). */
function fillTip(tip, { value, label, sub, color }) {
  tip.replaceChildren();
  const v = document.createElement('div');
  v.className = 'tip-val';
  if (color) {
    const key = document.createElement('span');
    key.className = 'tip-key';
    key.style.background = color;
    v.appendChild(key);
  }
  v.appendChild(document.createTextNode(value));
  const l = document.createElement('div');
  l.className = 'tip-label';
  l.textContent = label;
  tip.append(v, l);
  if (sub) {
    const s = document.createElement('div');
    s.className = 'tip-sub';
    s.textContent = sub;
    tip.appendChild(s);
  }
}

function placeTip(container, tip, x, y) {
  const cw = container.clientWidth;
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let left = x + 14;
  if (left + tw > cw) left = x - tw - 14;
  tip.style.left = `${Math.max(0, left)}px`;
  tip.style.top = `${Math.max(0, y - th - 10)}px`;
  tip.classList.add('show');
}

/**
 * Single-series area chart with a snapping crosshair.
 * points: [{ value, label, sub? }]
 */
export function areaChart(container, { points, format, height = 260, color = 'var(--series-1)', ariaLabel = '', partialLast = false }) {
  container.classList.add('chart');
  responsive(container, (W) => {
    container.querySelector('svg')?.remove();
    const m = { t: 14, r: 14, b: 30, l: 0 };
    const max = Math.max(...points.map((p) => p.value), 0);
    const { top, values } = niceScale(max);
    // Left margin wide enough for the longest tick label.
    m.l = Math.max(...values.map((v) => format.axis(v).length)) * 7 + 14;
    const iw = W - m.l - m.r;
    const ih = height - m.t - m.b;
    const n = points.length;
    const x = (i) => m.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
    const y = (v) => m.t + ih - (v / top) * ih;

    const svg = el('svg', { width: W, height, viewBox: `0 0 ${W} ${height}`, role: 'img', 'aria-label': ariaLabel });
    const grid = el('g', { class: 'grid' }, svg);
    for (const v of values) {
      if (v > 0) el('line', { x1: m.l, x2: W - m.r, y1: Math.round(y(v)) + 0.5, y2: Math.round(y(v)) + 0.5 }, grid);
      const tx = el('text', { x: m.l - 10, y: y(v) + 4, 'text-anchor': 'end', class: 'tick' }, svg);
      tx.textContent = format.axis(v);
    }
    el('line', { class: 'baseline', x1: m.l, x2: W - m.r, y1: Math.round(y(0)) + 0.5, y2: Math.round(y(0)) + 0.5 }, svg);

    // X labels: at most ~7, evenly spaced, always including the last.
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 72))));
    points.forEach((p, i) => {
      if (i % every !== 0 && i !== n - 1) return;
      if (i !== n - 1 && n - 1 - i < every * 0.6) return;
      const tx = el('text', { x: x(i), y: height - 8, 'text-anchor': i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle', class: 'tick' }, svg);
      tx.textContent = p.label;
    });

    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
    if (n > 1) {
      el('path', { d: `${line}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`, fill: color, 'fill-opacity': 0.1, stroke: 'none' }, svg);
      // The current period is still in progress: draw its segment dashed so the dip doesn't read as a drop.
      const solidN = partialLast && n > 2 ? n - 1 : n;
      const solid = points.slice(0, solidN).map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
      el('path', { d: solid, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      if (solidN < n) el('path', { d: `M${x(n - 2)},${y(points[n - 2].value)}L${x(n - 1)},${y(points[n - 1].value)}`, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-dasharray': '4 4', 'stroke-linecap': 'round' }, svg);
    }
    // End marker with a surface ring.
    el('circle', { cx: x(n - 1), cy: y(points[n - 1].value), r: 4, fill: color, stroke: 'var(--surface)', 'stroke-width': 2 }, svg);

    // Hover layer
    const cross = el('line', { class: 'crosshair', y1: m.t, y2: m.t + ih, x1: 0, x2: 0 }, svg);
    const dot = el('circle', { class: 'hover-dot', r: 5, fill: color, stroke: 'var(--surface)', 'stroke-width': 2 }, svg);
    const hit = el('rect', { class: 'hit', x: m.l, y: 0, width: iw, height: height - m.b, tabindex: 0, 'aria-label': ariaLabel }, svg);
    const tip = makeTip(container);
    let active = n - 1;

    const show = (i) => {
      active = Math.max(0, Math.min(n - 1, i));
      const p = points[active];
      const px = x(active);
      const py = y(p.value);
      cross.setAttribute('x1', px);
      cross.setAttribute('x2', px);
      dot.setAttribute('cx', px);
      dot.setAttribute('cy', py);
      container.classList.add('hovering');
      fillTip(tip, { value: format.tip(p.value), label: p.tipLabel || p.label, sub: p.sub, color });
      placeTip(container, tip, px, py);
    };
    const hide = () => {
      container.classList.remove('hovering');
      tip.classList.remove('show');
    };
    hit.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const px = e.clientX - r.left;
      show(n === 1 ? 0 : Math.round(((px - m.l) / iw) * (n - 1)));
    });
    hit.addEventListener('pointerleave', hide);
    hit.addEventListener('focus', () => show(active));
    hit.addEventListener('blur', hide);
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(active + 1);
      else if (e.key === 'ArrowLeft') show(active - 1);
      else return;
      e.preventDefault();
    });
    container.prepend(svg);
  });
}

/** Columns with a per-bar tooltip; the band (not just the bar) is the hit target. */
export function columnChart(container, { points, format, height = 220, color = 'var(--series-1)', labelEvery = 3, ariaLabel = '', labelPeak = true }) {
  container.classList.add('chart');
  responsive(container, (W) => {
    container.querySelector('svg')?.remove();
    const m = { t: 22, r: 6, b: 28, l: 0 };
    const max = Math.max(...points.map((p) => p.value), 0);
    const { top, values } = niceScale(max, 3);
    m.l = Math.max(...values.map((v) => format.axis(v).length)) * 7 + 12;
    const iw = W - m.l - m.r;
    const ih = height - m.t - m.b;
    const n = points.length;
    const band = iw / n;
    const bw = Math.max(2, Math.min(24, band - 2));
    const y = (v) => m.t + ih - (v / top) * ih;

    const svg = el('svg', { width: W, height, viewBox: `0 0 ${W} ${height}`, role: 'img', 'aria-label': ariaLabel });
    const grid = el('g', { class: 'grid' }, svg);
    for (const v of values) {
      if (v > 0) el('line', { x1: m.l, x2: W - m.r, y1: Math.round(y(v)) + 0.5, y2: Math.round(y(v)) + 0.5 }, grid);
      const tx = el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'tick' }, svg);
      tx.textContent = format.axis(v);
    }
    const bars = el('g', { class: 'bars' }, svg);
    const tip = makeTip(container);
    let peak = 0;
    points.forEach((p, i) => {
      if (p.value > points[peak].value) peak = i;
    });

    points.forEach((p, i) => {
      const cx = m.l + band * i + band / 2;
      const x0 = cx - bw / 2;
      const y0 = y(p.value);
      const h = y(0) - y0;
      const r = Math.min(4, bw / 2, h);
      const g = el('g', {}, bars);
      if (h > 0) {
        el('path', {
          class: 'bar',
          fill: color,
          d: `M${x0},${y(0)}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + bw - r}Q${x0 + bw},${y0} ${x0 + bw},${y0 + r}V${y(0)}Z`,
        }, g);
      }
      if (i % labelEvery === 0) {
        const tx = el('text', { x: cx, y: height - 8, 'text-anchor': 'middle', class: 'tick' }, svg);
        tx.textContent = p.label;
      }
      if (labelPeak && i === peak && p.value > 0) {
        const tx = el('text', { x: cx, y: y0 - 7, 'text-anchor': 'middle', class: 'tick', style: 'fill:var(--text);font-weight:600' }, svg);
        tx.textContent = format.axis(p.value);
      }
      const hit = el('rect', { class: 'hit', x: m.l + band * i, y: m.t, width: band, height: ih + 4, tabindex: 0, 'aria-label': `${p.tipLabel || p.label}: ${format.tip(p.value)}` }, g);
      const on = () => {
        bars.classList.add('has-hover');
        g.querySelector('.bar')?.classList.add('active');
        fillTip(tip, { value: format.tip(p.value), label: p.tipLabel || p.label, color });
        placeTip(container, tip, cx, y0);
      };
      const off = () => {
        bars.classList.remove('has-hover');
        g.querySelector('.bar')?.classList.remove('active');
        tip.classList.remove('show');
      };
      hit.addEventListener('pointerenter', on);
      hit.addEventListener('pointerleave', off);
      hit.addEventListener('focus', on);
      hit.addEventListener('blur', off);
    });
    el('line', { class: 'baseline', x1: m.l, x2: W - m.r, y1: Math.round(y(0)) + 0.5, y2: Math.round(y(0)) + 0.5 }, svg);
    container.prepend(svg);
  });
}

/** Tiny trend line: de-emphasised history, current point in the accent. */
export function sparkline(values, { w = 200, h = 36, accent = 'var(--brand)' } = {}) {
  if (values.length < 2) return '';
  // Downsample long series so the line stays readable.
  const maxPts = 30;
  let v = values;
  if (v.length > maxPts) {
    const step = v.length / maxPts;
    v = Array.from({ length: maxPts }, (_, i) => {
      const s = Math.floor(i * step);
      const e = Math.max(s + 1, Math.floor((i + 1) * step));
      const chunk = values.slice(s, e);
      return chunk.reduce((a, b) => a + b, 0) / chunk.length;
    });
  }
  const min = Math.min(...v);
  const max = Math.max(...v);
  const span = max - min || 1;
  const x = (i) => (i / (v.length - 1)) * (w - 6) + 1;
  const y = (val) => h - 4 - ((val - min) / span) * (h - 8);
  const d = v.map((val, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join('');
  const last = v.length - 1;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <path d="${d}" fill="none" stroke="var(--chart-axis)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(last)}" cy="${y(v[last])}" r="4" fill="${accent}" stroke="var(--surface)" stroke-width="2"/>
  </svg>`;
}
