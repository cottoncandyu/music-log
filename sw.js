// 오프라인 지원: 앱 파일을 캐시. 앱을 수정하면 VERSION을 올려주세요.
const VERSION = 'v1';
const CACHE = `gongbu-desk-${VERSION}`;
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/app.js', './js/store.js', './js/util.js', './js/ui.js', './js/timers.js', './js/charts.js', './js/focus.js', './js/drawpad.js',
  './js/views/home.js', './js/views/memo.js', './js/views/timer.js', './js/views/todo.js', './js/views/dday.js',
  './js/views/diary.js', './js/views/records.js', './js/views/health.js', './js/views/share.js', './js/views/settings.js',
  './icons/icon.svg', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 같은 출처: 네트워크 우선(최신 반영) → 실패 시 캐시
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // 구글 폰트: 캐시 우선
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
  }
});
