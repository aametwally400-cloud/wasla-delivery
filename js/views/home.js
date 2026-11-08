// Home: hero, categories, offers, and the filterable restaurant grid / search results.

import { t, L, fmtMoney, fmtNum } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, buildHash } from '../utils.js';
import { RESTAURANTS, CATEGORIES, AREAS, itemById, restaurantById } from '../data.js';
import { isFavorite, toggleFavorite, isPaused, subscribe } from '../store.js';
import { riderStatuses, analytics } from '../ops.js';
import { media, restLogo, toast, settleImages } from '../ui.js';

const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[ً-ٟ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

export function restCard(r) {
  const paused = isPaused(r.id);
  const fav = isFavorite(r.id);
  return `
    <article class="rest-card" data-rest="${r.id}">
      <a href="#/r/${r.id}" aria-label="${esc(L(r.name))}">
        <div class="rest-media-wrap">
          ${media(r.cover, { cls: 'rest-media', w: 700, label: L(r.name) })}
          <div class="tags">
            ${r.offer ? `<span class="tag">${icon('tag', 12)} ${esc(L(r.offer))}</span>` : ''}
            <span class="tag dark">${icon('clock', 12)} ${t('minutesRange', { a: r.eta[0], b: r.eta[1] })}</span>
          </div>
          ${paused ? `<div class="closed-veil">${t('closed')}</div>` : ''}
          ${restLogo(r)}
        </div>
        <div class="rest-body">
          <div class="rest-row">
            <h3 class="truncate">${esc(L(r.name))}</h3>
            <span class="rating">${icon('star', 14)}${r.rating.toFixed(1)} <span class="muted" style="font-weight:500">${t('reviews', { n: fmtNum(r.reviews) })}</span></span>
          </div>
          <p class="rest-cuisine truncate">${esc(L(r.sub))} · ${esc(L(AREAS[r.area]))}</p>
          <div class="rest-meta">
            <span>${icon('scooter', 15)} ${r.fee ? fmtMoney(r.fee) : `<b class="free">${t('freeDelivery')}</b>`}</span>
            <span>${icon('bag', 15)} ${t('rest.minOrder', { v: fmtMoney(r.minOrder) })}</span>
          </div>
        </div>
      </a>
      <button class="fav-btn" type="button" data-fav="${r.id}" aria-pressed="${fav}" aria-label="${fav ? t('favRemove') : t('favAdd')}">${icon('heart', 18)}</button>
    </article>`;
}

export default function home(main, { query }) {
  const state = {
    q: query.q || '',
    cat: query.cat || 'all',
    sort: query.sort || 'recommended',
    free: query.free === '1',
    offers: query.offers === '1',
    open: query.open === '1',
    favs: query.favs === '1',
  };

  const syncHash = () => {
    const h = buildHash('/', {
      q: state.q,
      cat: state.cat !== 'all' ? state.cat : '',
      sort: state.sort !== 'recommended' ? state.sort : '',
      free: state.free ? '1' : '',
      offers: state.offers ? '1' : '',
      open: state.open ? '1' : '',
      favs: state.favs ? '1' : '',
    });
    history.replaceState(null, '', h);
  };

  const ridersOnline = riderStatuses().filter((r) => r.status !== 'offline').length;
  const avgDelivery = Math.round(analytics('30d').kpi.delivery) || 28;

  const heroHTML = `
    <section class="container hero">
      <div class="hero-card">
        <div class="hero-copy">
          <span class="eyebrow"><span class="live-dot"></span>${t('hero.eyebrow', { n: ridersOnline })}</span>
          <h1>${t('hero.title')}</h1>
          <p>${t('hero.sub')}</p>
          <form class="hero-search" role="search" data-hero-search>
            ${icon('search', 20)}
            <label class="sr-only" for="hero-q">${t('search.placeholder')}</label>
            <input id="hero-q" name="q" type="search" placeholder="${t('search.placeholder')}" autocomplete="off" />
            <button class="btn btn-primary">${icon('search', 18)}<span class="label">${t('search.go')}</span></button>
          </form>
          <div class="hero-stats">
            <div><strong>${t('minutes', { n: avgDelivery })}</strong><span>${t('hero.stat1')}</span></div>
            <div><strong>4.8 ★</strong><span>${t('hero.stat2')}</span></div>
            <div><strong>${RESTAURANTS.length}</strong><span>${t('hero.stat3')}</span></div>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          ${media('spread', { cls: 'hero-img', w: 900 })}
          <div class="float-card one"><span class="fc-icon">${icon('scooter', 22)}</span><div><strong>${t('hero.float1')}</strong><small>${t('hero.float1sub')}</small></div></div>
          <div class="float-card two"><span class="fc-icon good">${icon('star', 20)}</span><div><strong>${t('hero.float2')}</strong><small>${t('hero.float2sub')}</small></div></div>
        </div>
      </div>
    </section>`;

  const offersHTML = `
    <section class="container section" aria-labelledby="offers-h">
      <div class="section-head"><h2 id="offers-h">${t('home.offers')}</h2></div>
      <div class="h-scroll">
        <button class="promo-card" type="button" data-copy="WASLA20">
          ${media('burger2', { w: 800 })}
          <span class="tag">${icon('sparkle', 12)} ${t('promo.tagNew')}</span>
          <h3>${t('promo1.title')}</h3>
          <p>${t('promo1.sub')} <code>WASLA20</code></p>
        </button>
        <a class="promo-card" href="#/r/smash-lab">
          ${media('burger1', { w: 800 })}
          <span class="tag">${icon('scooter', 12)} ${t('promo.tagOffer')}</span>
          <h3>${t('promo2.title')}</h3>
          <p>${t('promo2.sub')}</p>
        </a>
        <a class="promo-card" href="#/r/sweet-corner">
          ${media('dessert1', { w: 800 })}
          <span class="tag">${icon('tag', 12)} ${t('promo.tagOffer')}</span>
          <h3>${t('promo3.title')}</h3>
          <p>${t('promo3.sub')}</p>
        </a>
      </div>
    </section>`;

  const catsHTML = () => `
    <div class="h-scroll" role="toolbar" aria-label="${t('cat.all')}">
      <button class="cat-btn" type="button" data-cat="all" aria-pressed="${state.cat === 'all'}">
        <span class="cat-img cat-all">${icon('grid', 26)}</span>${t('cat.all')}
      </button>
      ${CATEGORIES.map(
        (c) => `<button class="cat-btn" type="button" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">
          ${media(c.img, { cls: 'cat-img', w: 200, label: '' })}${t(`cat.${c.id}`)}
        </button>`,
      ).join('')}
    </div>`;

  main.innerHTML = `
    ${state.q ? '' : heroHTML}
    <section class="container section" style="${state.q ? 'margin-top:28px' : ''}" data-cats>${catsHTML()}</section>
    ${state.q ? '' : offersHTML}
    <section class="container section" aria-live="polite" data-results></section>`;

  const results = main.querySelector('[data-results]');

  function filtered() {
    const q = norm(state.q.trim());
    let list = RESTAURANTS.filter((r) => {
      if (state.cat !== 'all' && !r.tags.includes(state.cat)) return false;
      if (state.free && r.fee !== 0) return false;
      if (state.offers && !r.offer) return false;
      if (state.open && isPaused(r.id)) return false;
      if (state.favs && !isFavorite(r.id)) return false;
      if (!q) return true;
      const hay = [r.name.ar, r.name.en, r.sub.ar, r.sub.en, t(`cat.${r.cuisine}`), ...r.menu.flatMap((c) => c.items.flatMap((i) => [i.name.ar, i.name.en]))];
      return hay.some((s) => norm(s).includes(q));
    });
    const by = {
      recommended: (a, b) => isPaused(a.id) - isPaused(b.id) || b.weight * b.rating - a.weight * a.rating,
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      fastest: (a, b) => a.eta[0] - b.eta[0] || a.eta[1] - b.eta[1],
      fee: (a, b) => a.fee - b.fee || b.rating - a.rating,
    };
    list = list.sort(by[state.sort] || by.recommended);
    const dishes = q
      ? Object.values(itemById)
          .filter((i) => norm(i.name.ar).includes(q) || norm(i.name.en).includes(q))
          .slice(0, 8)
      : [];
    return { list, dishes };
  }

  function drawResults() {
    const { list, dishes } = filtered();
    const anyFilter = state.cat !== 'all' || state.free || state.offers || state.open || state.favs || state.q;
    const toggle = (key, label, ic) => `<button class="chip" type="button" data-toggle="${key}" aria-pressed="${state[key]}">${icon(ic, 15)} ${label}</button>`;
    results.innerHTML = `
      <div class="section-head">
        <h2>${state.q ? esc(t('home.results', { q: state.q })) : state.cat !== 'all' ? t(`cat.${state.cat}`) : t('home.restaurants')}<span class="count">${t('home.count', { n: list.length })}</span></h2>
        <div class="filter-bar">
          <label class="sr-only" for="sort">${t('sort.recommended')}</label>
          <select id="sort" class="select" data-sort>
            ${['recommended', 'rating', 'fastest', 'fee'].map((s) => `<option value="${s}" ${state.sort === s ? 'selected' : ''}>${t(`sort.${s}`)}</option>`).join('')}
          </select>
          ${toggle('free', t('filter.free'), 'scooter')}
          ${toggle('offers', t('filter.offers'), 'tag')}
          ${toggle('open', t('filter.open'), 'clock')}
          ${toggle('favs', t('filter.favs'), 'heart')}
        </div>
      </div>
      ${
        dishes.length
          ? `<h3 style="font-size:16px;margin:4px 0 12px">${t('home.dishes')}</h3>
             <div class="dish-results" style="margin-bottom:28px">
               ${dishes
                 .map((i) => {
                   const r = restaurantById[i.restaurantId];
                   return `<a class="dish-hit" href="${buildHash(`/r/${r.id}`, { item: i.id })}">
                      ${media(i.img, { w: 200 })}
                      <div style="min-width:0"><strong class="truncate">${esc(L(i.name))}</strong><small>${esc(L(r.name))}</small></div>
                      <span class="price">${fmtMoney(i.price)}</span>
                    </a>`;
                 })
                 .join('')}
             </div>`
          : ''
      }
      ${
        list.length
          ? `<div class="rest-grid">${list.map(restCard).join('')}</div>`
          : `<div class="empty card">
               <div class="empty-icon">${icon('search', 32)}</div>
               <h3>${t('empty.title')}</h3><p>${t('empty.hint')}</p>
               ${anyFilter ? `<button class="btn btn-secondary" type="button" data-clear-filters>${t('empty.clear')}</button>` : ''}
             </div>`
      }`;
    settleImages(results);
  }

  drawResults();

  main.addEventListener('click', (e) => {
    const cat = e.target.closest('[data-cat]');
    const tog = e.target.closest('[data-toggle]');
    const fav = e.target.closest('[data-fav]');
    const copy = e.target.closest('[data-copy]');
    if (cat) {
      state.cat = cat.dataset.cat;
      main.querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === state.cat));
      syncHash();
      drawResults();
    } else if (tog) {
      const key = tog.dataset.toggle;
      state[key] = !state[key];
      syncHash();
      drawResults();
      results.querySelector(`[data-toggle="${key}"]`)?.focus();
    } else if (fav) {
      e.preventDefault();
      toggleFavorite(fav.dataset.fav);
      const on = isFavorite(fav.dataset.fav);
      fav.setAttribute('aria-pressed', on);
      fav.setAttribute('aria-label', on ? t('favRemove') : t('favAdd'));
      if (state.favs) drawResults();
    } else if (copy) {
      navigator.clipboard?.writeText(copy.dataset.copy).catch(() => {});
      toast(`${copy.dataset.copy} ✓`, { icon: 'tag' });
    } else if (e.target.closest('[data-clear-filters]')) {
      Object.assign(state, { q: '', cat: 'all', free: false, offers: false, open: false, favs: false });
      if (main.querySelector('.hero')) {
        main.querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === 'all'));
        syncHash();
        drawResults();
      } else location.hash = '#/';
    }
  });
  main.addEventListener('change', (e) => {
    if (e.target.matches('[data-sort]')) {
      state.sort = e.target.value;
      syncHash();
      drawResults();
      main.querySelector('[data-sort]')?.focus();
    }
  });
  main.querySelector('[data-hero-search]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (q) location.hash = buildHash('/', { q });
  });

  const unsub = subscribe((r) => {
    if (r === 'paused' || r === 'sync') drawResults();
  });
  return unsub;
}
