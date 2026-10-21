// Fantasy HQ service worker.
// - The app itself: network first, so updates show up right away; falls back to the saved copy offline.
// - Sleeper's big player list (~10 MB): kept for a day so the app opens fast.
// - Everything else (scores, rosters, matchups) always comes live from the network.
const VERSION = 'fhq-v7';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
const PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl';
const PLAYERS_MAX_AGE = 24 * 60 * 60 * 1000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'fhq-data').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html')) || Response.error();
  }
}

async function playersList(req) {
  const cache = await caches.open('fhq-data');
  const hit = await cache.match(PLAYERS_URL);
  const age = hit ? Date.now() - Number(hit.headers.get('x-fhq-saved') || 0) : Infinity;
  if (hit && age < PLAYERS_MAX_AGE) return hit;
  try {
    const res = await fetch(req);
    if (!res.ok) return hit || res;
    const body = await res.blob();
    const headers = new Headers(res.headers);
    headers.set('x-fhq-saved', String(Date.now()));
    await cache.put(PLAYERS_URL, new Response(body, { status: 200, headers }));
    return new Response(body, { status: 200, headers });
  } catch (err) {
    return hit || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open('fhq-data');
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.href === PLAYERS_URL) { e.respondWith(playersList(req)); return; }
  if (url.origin === self.location.origin) { e.respondWith(networkFirst(req)); return; }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') { e.respondWith(cacheFirst(req)); return; }
  // Live data (Sleeper, ESPN): straight to the network.
});
