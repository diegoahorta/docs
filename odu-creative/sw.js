/**
 * Service worker (PWA): app shell em cache para uso offline.
 * - Código e bibliotecas: cache-first, versionado por CACHE.
 * - unit.json: network-first (edições publicadas aparecem logo), com fallback ao cache.
 * - Áudios: cache-first ao serem ouvidos pela primeira vez (respostas 206 parciais não são guardadas).
 */
const CACHE = 'odu-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'assets/icon.svg', 'css/tokens.css', 'css/app.css', 'vendor/gsap.min.js',
  'js/main.js', 'js/core/dom.js', 'js/core/store.js', 'js/core/srs.js', 'js/core/evaluate.js', 'js/core/audio-sync.js',
  'js/core/speech.js', 'js/core/motion.js', 'js/core/gamify.js', 'js/core/idb.js', 'js/core/unit-loader.js', 'js/core/docx-builder.js',
  'js/components/question.js', 'js/components/player.js',
  'js/modules/home.js', 'js/modules/quest.js', 'js/modules/listening.js', 'js/modules/discover.js', 'js/modules/grammar.js',
  'js/modules/practice.js', 'js/modules/speaking.js', 'js/modules/review.js', 'js/modules/progress.js', 'js/modules/docs.js', 'js/modules/teacher.js',
  'js/modules/flashcards.js', 'js/three/cafe3d.js', 'js/three/card-art.js',
  'vendor/three/three.module.min.js', 'vendor/three/addons/loaders/GLTFLoader.js', 'vendor/three/addons/utils/BufferGeometryUtils.js',
  'units/index.json', 'units/en-a1-cafe/unit.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('.json')) {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
