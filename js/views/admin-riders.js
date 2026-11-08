// Riders: who is available, on a delivery, or off shift — refreshed live.

import { t, L, fmtNum } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { subscribe } from '../store.js';
import { riderStatuses } from '../ops.js';
import { avatar } from '../ui.js';
import { openOrderDrawer } from './admin-orders.js';

const STATUS_CLS = { available: 'st-delivered', busy: 'st-on_the_way', offline: '' };
const VEH_ICON = { motorbike: 'scooter', bicycle: 'bike', car: 'car' };

export default function adminRiders(main) {
  let filter = 'all';
  const draw = () => {
    const riders = riderStatuses();
    const count = (s) => riders.filter((r) => r.status === s).length;
    const order = { busy: 0, available: 1, offline: 2 };
    const list = riders.filter((r) => filter === 'all' || r.status === filter).sort((a, b) => order[a.status] - order[b.status] || b.today - a.today);
    main.innerHTML = `
      <div class="rider-stats">
        <div class="card mini-stat"><span class="ms-icon" style="background:var(--good-soft);color:var(--good-text)">${icon('checkCircle', 22)}</span><div><strong>${count('available')}</strong><span>${t('rd.available')}</span></div></div>
        <div class="card mini-stat"><span class="ms-icon" style="background:var(--brand-soft);color:var(--brand)">${icon('scooter', 22)}</span><div><strong>${count('busy')}</strong><span>${t('rd.busy')}</span></div></div>
        <div class="card mini-stat"><span class="ms-icon" style="background:var(--surface-2);color:var(--muted)">${icon('clock', 22)}</span><div><strong>${count('offline')}</strong><span>${t('rd.offline')}</span></div></div>
      </div>
      <div class="toolbar">
        <div class="seg" role="group" aria-label="${t('ad.riders')}">
          ${['all', 'available', 'busy', 'offline'].map((k) => `<button type="button" data-f="${k}" aria-pressed="${filter === k}">${k === 'all' ? t('tab.all') : t(`rd.${k}`)}</button>`).join('')}
        </div>
      </div>
      <div class="rider-grid">
        ${list
          .map(
            (r) => `<article class="card rd-card">
              <div class="rd-top">
                ${avatar(r.name.en, 'lg')}
                <div class="info"><strong>${esc(L(r.name))}</strong><small>${icon(VEH_ICON[r.vehicle], 14, 'style="display:inline;vertical-align:-2px"')} ${t(`veh.${r.vehicle}`)}</small></div>
                <span class="badge ${STATUS_CLS[r.status]} ${r.status === 'busy' ? 'pulse' : ''}"><span class="bdot"></span>${t(`rd.${r.status}`)}</span>
              </div>
              <div class="rd-meta">
                <div><strong>${fmtNum(r.today)}</strong><span>${t('rd.today')}</span></div>
                <div><strong>★ ${r.rating.toFixed(1)}</strong><span>${t('rd.rating')}</span></div>
                <div><strong>${r.onTime}%</strong><span>${t('rd.onTime')}</span></div>
              </div>
              <div class="meter" title="${t('rd.onTime')} ${r.onTime}%"><span style="width:${r.onTime}%"></span></div>
              <div class="rd-current">
                ${
                  r.status === 'busy'
                    ? `${icon('package', 16)} <button type="button" class="btn btn-ghost btn-sm" style="padding-inline:6px" data-open="${esc(r.order.id)}">${t('rd.delivering', { id: `<span class="order-id">${esc(r.order.id)}</span>` })}</button>`
                    : r.status === 'available'
                      ? `${icon('clock', 16)} ${t('rd.idle')}`
                      : `${icon('moon', 16)} ${t('rd.off')}`
                }
              </div>
            </article>`,
          )
          .join('')}
      </div>`;
  };
  draw();

  main.addEventListener('click', (e) => {
    const f = e.target.closest('[data-f]');
    const o = e.target.closest('[data-open]');
    if (f) {
      filter = f.dataset.f;
      draw();
      main.querySelector(`[data-f="${filter}"]`)?.focus();
    } else if (o) openOrderDrawer(o.dataset.open);
  });

  const unsub = subscribe((r) => {
    if (r === 'tick' || r === 'sync' || r.startsWith('order')) draw();
  });
  const timer = setInterval(draw, 15000);
  return () => {
    unsub();
    clearInterval(timer);
  };
}
