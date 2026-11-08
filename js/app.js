// Entry point: hash router + layout shells + the simulation clock.

import { parseHash } from './utils.js';
import { subscribe } from './store.js';
import { tick } from './ops.js';
import { closeAllOverlays, settleImages } from './ui.js';
import { mountStore } from './views/store-layout.js';
import { mountAdmin } from './views/admin-layout.js';
import home from './views/home.js';
import restaurant from './views/restaurant.js';
import checkout from './views/checkout.js';
import track from './views/track.js';
import myOrders from './views/my-orders.js';
import overview from './views/admin-overview.js';
import adminOrders from './views/admin-orders.js';
import adminRestaurants from './views/admin-restaurants.js';
import adminRiders from './views/admin-riders.js';
import adminCustomers from './views/admin-customers.js';

const routes = [
  { re: /^\/$/, layout: 'store', view: home, name: 'home' },
  { re: /^\/r\/([\w-]+)$/, layout: 'store', view: restaurant, name: 'restaurant' },
  { re: /^\/checkout$/, layout: 'store', view: checkout, name: 'checkout' },
  { re: /^\/track\/([\w-]+)$/, layout: 'store', view: track, name: 'track' },
  { re: /^\/orders$/, layout: 'store', view: myOrders, name: 'orders' },
  { re: /^\/admin\/?$/, layout: 'admin', view: overview, name: 'overview' },
  { re: /^\/admin\/orders$/, layout: 'admin', view: adminOrders, name: 'orders' },
  { re: /^\/admin\/restaurants$/, layout: 'admin', view: adminRestaurants, name: 'restaurants' },
  { re: /^\/admin\/riders$/, layout: 'admin', view: adminRiders, name: 'riders' },
  { re: /^\/admin\/customers$/, layout: 'admin', view: adminCustomers, name: 'customers' },
];

const app = document.getElementById('app');
const state = { layoutName: null, shell: null, cleanup: null, path: null };

function render({ keepScroll = false } = {}) {
  const { path, query } = parseHash();
  let route = null;
  let params = [];
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      route = r;
      params = m.slice(1);
      break;
    }
  }
  if (!route) {
    location.replace('#/');
    return;
  }

  closeAllOverlays();
  state.cleanup?.();
  state.cleanup = null;

  if (state.layoutName !== route.layout || !state.shell) {
    state.shell?.destroy();
    state.shell = route.layout === 'admin' ? mountAdmin(app) : mountStore(app);
    state.layoutName = route.layout;
  }
  state.shell.setRoute(route.name);

  const main = state.shell.main;
  main.classList.remove('page-enter');
  void main.offsetWidth;
  main.classList.add('page-enter');
  main.innerHTML = '';
  state.cleanup = route.view(main, { params, query }) || null;
  settleImages(main);

  const samePage = state.path === path;
  state.path = path;
  if (!keepScroll && !samePage) window.scrollTo({ top: 0, behavior: 'instant' });
}

window.addEventListener('hashchange', () => render());

// Language changes rebuild everything (direction flips); scroll position is kept.
subscribe((reason) => {
  if (reason === 'lang') {
    const y = window.scrollY;
    state.shell?.destroy();
    state.shell = null;
    render({ keepScroll: true });
    window.scrollTo(0, y);
  }
});

// The simulation clock: advances orders you placed (and ones you changed in the dashboard).
setInterval(tick, 1000);
tick();

render();
