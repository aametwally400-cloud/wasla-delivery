// Restaurants: 30-day performance per partner, plus a pause/resume switch that
// immediately closes or reopens the restaurant on the storefront.

import { t, L, fmtMoney, fmtNum } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { RESTAURANTS, AREAS } from '../data.js';
import { isPaused, setPaused, subscribe } from '../store.js';
import { restaurantStats } from '../ops.js';
import { media, restLogo, toast, settleImages } from '../ui.js';

export default function adminRestaurants(main) {
  const draw = () => {
    const stats = restaurantStats();
    const list = [...RESTAURANTS].sort((a, b) => stats[b.id].revenue - stats[a.id].revenue);
    main.innerHTML = `
      <div class="rest-admin-grid">
        ${list
          .map((r) => {
            const s = stats[r.id];
            const paused = isPaused(r.id);
            return `<article class="card ra-card ${paused ? 'paused' : ''}">
              ${media(r.cover, { cls: 'ra-cover', w: 600, label: L(r.name) })}
              <div class="ra-body">
                ${restLogo(r)}
                <div class="ra-title">
                  <div style="min-width:0"><h3 class="truncate">${esc(L(r.name))}</h3><small>${t(`cat.${r.cuisine}`)} · ${esc(L(AREAS[r.area]))}</small></div>
                  <span class="rating">${icon('star', 14)}${r.rating.toFixed(1)}</span>
                </div>
                <div class="ra-stats">
                  <div><span>${t('ra.orders')}</span><strong>${fmtNum(s.orders)}</strong></div>
                  <div><span>${t('ra.revenue')}</span><strong>${fmtMoney(s.revenue, { compact: true })}</strong></div>
                  <div><span>${t('ra.aov')}</span><strong>${fmtMoney(s.orders ? s.revenue / s.orders : 0)}</strong></div>
                </div>
                <div class="ra-foot">
                  <label class="switch">
                    <input type="checkbox" data-toggle="${r.id}" ${paused ? '' : 'checked'} />
                    <span class="track"></span>
                    <span style="color:${paused ? 'var(--critical-text)' : 'var(--good-text)'}">${paused ? t('ra.paused') : t('ra.accepting')}</span>
                  </label>
                  <a class="btn btn-ghost btn-sm" href="#/r/${r.id}">${t('ra.preview')} ${icon('arrowRight', 14, 'class="flip-rtl"')}</a>
                </div>
              </div>
            </article>`;
          })
          .join('')}
      </div>`;
    settleImages(main);
  };
  draw();

  main.addEventListener('change', (e) => {
    const sw = e.target.closest('[data-toggle]');
    if (!sw) return;
    const r = RESTAURANTS.find((x) => x.id === sw.dataset.toggle);
    setPaused(r.id, !sw.checked);
    toast(sw.checked ? t('ra.nowOpen', { name: L(r.name) }) : t('ra.nowPaused', { name: L(r.name) }), { icon: sw.checked ? 'check' : 'clock' });
  });

  const unsub = subscribe((reason) => {
    if (reason === 'paused' || reason === 'sync' || reason === 'reset') {
      const focusId = document.activeElement?.dataset?.toggle;
      draw();
      if (focusId) main.querySelector(`[data-toggle="${focusId}"]`)?.focus();
    }
  });
  return unsub;
}
