// 기기 연동 엔진 — 기록을 '조각(unit)'으로 나눠 바뀐 것만 올리고, 다른 기기의 변경을 받아 합칩니다.
// - 조각: 메뉴별(k_memos, k_todos …) + 다이어리 날짜별(d_20261122)
// - 사진(data:image…)은 따로 한 번만 올리고, 조각 안에는 '@img:해시'로만 남깁니다.
// - 같은 조각을 두 기기에서 고쳤다면 합치기: 목록은 id 기준으로 둘 다 남기고, 같은 항목·값은 최신 쪽 우선.
// backend 인터페이스: put(id, data), get(id), del(id), updateManifest(entries), getManifest(), watchManifest(cb) → 해제함수
import { state, onChange, saveQuiet, kvGet, kvSet, defaults } from './store.js';

const CHUNK = 250000;        // 문서 하나에 담는 글자 수 (한글 3바이트 기준 1MiB 제한 안쪽)
const PUSH_DELAY = 4000;     // 마지막 변경 후 4초 뒤에 올리기
const META_KEY = 'syncMeta';

let backend = null;
let meta = { units: {}, imgs: {}, device: '' };
let remote = {};             // 마지막으로 받은 manifest
let unwatch = null;
let pushTimer = null;
let queue = Promise.resolve();
const imgCache = new Map();  // 해시 → dataURL
const hashCache = new Map(); // dataURL → 해시 (최근 것만)

export const status = { state: 'off', lastSync: 0, error: '', pending: false };
const emit = () => dispatchEvent(new Event('syncstatus'));
const setStatus = (s, error = '') => { status.state = s; status.error = error; if (s === 'ok') status.lastSync = Date.now(); emit(); };

// ---------- 도우미 ----------
function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + '.' + str.length.toString(36);
}
async function imgHash(dataUrl) {
  if (hashCache.has(dataUrl)) return hashCache.get(dataUrl);
  let h;
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataUrl));
    h = [...new Uint8Array(buf)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
  } else h = 'f' + fnv(dataUrl).replace('.', '');
  if (hashCache.size > 400) hashCache.clear();
  hashCache.set(dataUrl, h);
  imgCache.set(h, dataUrl);
  return h;
}
const isImg = (v) => typeof v === 'string' && v.startsWith('data:image/');
function collectImgs(v, out) {
  if (isImg(v)) out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => collectImgs(x, out));
  else if (v && typeof v === 'object') for (const k in v) collectImgs(v[k], out);
  return out;
}
const unitDate = (key) => `${key.slice(2, 6)}-${key.slice(6, 8)}-${key.slice(8, 10)}`;

function currentUnits() {
  const m = new Map();
  for (const k of Object.keys(state)) if (k !== 'diaries') m.set('k_' + k, state[k]);
  for (const d of Object.keys(state.diaries || {})) m.set('d_' + d.replace(/-/g, ''), state.diaries[d]);
  return m;
}
function readUnit(key) {
  if (key.startsWith('k_')) return state[key.slice(2)];
  return (state.diaries || {})[unitDate(key)];
}
function applyUnit(key, value) {
  if (key.startsWith('k_')) {
    const k = key.slice(2);
    state[k] = value === undefined ? defaults()[k] : value;
  } else if (key.startsWith('d_')) {
    const d = unitDate(key);
    if (value == null) delete state.diaries[d]; else state.diaries[d] = value;
  }
}

async function encode(value) {
  const imgs = new Map();
  for (const s of collectImgs(value, new Set())) imgs.set(s, await imgHash(s));
  const json = JSON.stringify(value === undefined ? null : value, (k, v) => (isImg(v) ? '@img:' + imgs.get(v) : v));
  return { json, imgs };
}
async function decode(json) {
  const need = [...new Set((json.match(/"@img:[0-9a-z.]+"/g) || []).map((s) => s.slice(6, -1)))];
  for (const h of need) {
    if (imgCache.has(h)) continue;
    const data = await getBlob('i_' + h);
    if (data) imgCache.set(h, data);
  }
  return JSON.parse(json, (k, v) => (typeof v === 'string' && v.startsWith('@img:') ? imgCache.get(v.slice(5)) || '' : v));
}

async function putBlob(id, str, prevN = 0) {
  const n = Math.max(1, Math.ceil(str.length / CHUNK));
  for (let i = 0; i < n; i++) await backend.put(`${id}~${i}`, { s: str.slice(i * CHUNK, (i + 1) * CHUNK), i, n });
  for (let i = n; i < prevN; i++) await backend.del(`${id}~${i}`);
  return n;
}
async function getBlob(id) {
  const first = await backend.get(`${id}~0`);
  if (!first) return null;
  const parts = [first.s];
  for (let i = 1; i < (first.n || 1); i++) { const d = await backend.get(`${id}~${i}`); parts.push(d ? d.s : ''); }
  return parts.join('');
}

/** 두 기기 값 합치기: newerIsB면 충돌 시 b 우선 */
export function mergeValues(a, b, newerIsB) {
  if (a === undefined || a === null) return b;
  if (b === undefined || b === null) return a;
  if (Array.isArray(a) && Array.isArray(b)) {
    const withId = (arr) => arr.length && arr.every((x) => x && typeof x === 'object' && 'id' in x);
    if (!(withId(a) || withId(b)) || !a.concat(b).every((x) => x && typeof x === 'object' && 'id' in x)) return newerIsB ? b : a;
    const bm = new Map(b.map((x) => [x.id, x]));
    const out = a.map((x) => (bm.has(x.id) ? mergeValues(x, bm.get(x.id), newerIsB) : x));
    const am = new Set(a.map((x) => x.id));
    for (const x of b) if (!am.has(x.id)) out.push(x);
    return out;
  }
  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = k in a && k in b ? mergeValues(a[k], b[k], newerIsB) : k in a ? a[k] : b[k];
    return out;
  }
  return newerIsB ? b : a;
}

const saveMeta = () => kvSet(META_KEY, meta);
const serial = (fn) => (queue = queue.then(fn, fn).catch((e) => { console.error('sync', e); setStatus('error', e.message || String(e)); }));

// ---------- 올리기 ----------
async function pushNow() {
  if (!backend) return;
  status.pending = false;
  const units = currentUnits();
  const entries = {};
  for (const [key, val] of units) {
    const { json, imgs } = await encode(val);
    const h = fnv(json);
    if (meta.units[key]?.h === h) continue;
    if (!navigator.onLine) { setStatus('offline'); status.pending = true; return; }
    setStatus('syncing');
    for (const [dataUrl, ih] of imgs) {
      if (meta.imgs[ih]) continue;
      await putBlob('i_' + ih, dataUrl);
      meta.imgs[ih] = 1;
    }
    // 다른 기기의 새 버전을 아직 못 받았다면 먼저 받아서 합친 뒤 올림
    if (remote[key] && meta.units[key] && remote[key].h !== meta.units[key].h) { schedulePush(1500); continue; }
    const n = await putBlob('u_' + key, json, remote[key]?.n || meta.units[key]?.n || 0);
    const e = { h, n, at: Date.now(), by: meta.device, base: meta.units[key]?.h || '' };
    entries[key] = e; meta.units[key] = { h, n, at: e.at, by: meta.device }; remote[key] = e;
  }
  // 이 기기에서 지운 다이어리
  for (const key of Object.keys(meta.units)) {
    if (key.startsWith('d_') && !units.has(key) && !meta.units[key].del) {
      const e = { h: 'del', n: 0, at: Date.now(), by: meta.device, del: 1 };
      entries[key] = e; meta.units[key] = { h: 'del', del: 1, at: e.at }; remote[key] = e;
    }
  }
  if (Object.keys(entries).length) await backend.updateManifest(entries);
  await saveMeta();
  setStatus('ok');
}
function schedulePush(delay = PUSH_DELAY) {
  if (!backend) return;
  status.pending = true; emit();
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => serial(pushNow), delay);
}

// ---------- 받기 ----------
async function pull(manifest) {
  remote = manifest || {};
  let changed = false, needPush = false;
  for (const [key, e] of Object.entries(remote)) {
    const mine = meta.units[key];
    if (mine && mine.h === e.h) continue;
    const localVal = readUnit(key);
    const localJson = localVal === undefined ? null : (await encode(localVal)).json;
    // 내 변경이 덮어씌워진 경우: 상대가 내 버전을 보지 못하고 올림 → 내 값과 합쳐야 함
    const overwritten = mine && mine.by === meta.device && e.by !== meta.device && e.base !== mine.h;
    const localDirty = localVal !== undefined && (!mine || overwritten || fnv(localJson) !== mine.h);
    setStatus('syncing');
    if (e.del) {
      if (!localDirty) { applyUnit(key, undefined); changed = true; } else needPush = true;
      meta.units[key] = { h: e.h, del: 1, at: e.at };
      continue;
    }
    const json = await getBlob('u_' + key);
    if (json == null) continue;
    const remoteVal = await decode(json);
    if (!localDirty) applyUnit(key, remoteVal);
    else { applyUnit(key, mergeValues(localVal, remoteVal, e.at >= (mine?.at || 0))); needPush = true; }
    meta.units[key] = { h: e.h, n: e.n, at: e.at, by: e.by };
    changed = true;
  }
  await saveMeta();
  if (changed) {
    saveQuiet();
    dispatchEvent(new Event('syncapplied'));
  }
  setStatus('ok');
  if (needPush) schedulePush(500);
}

// ---------- 시작 / 중지 ----------
export async function startSync(b, uid) {
  stopSync();
  backend = b;
  const saved = await kvGet(META_KEY);
  meta = saved && saved.uid === uid ? saved : { units: {}, imgs: {}, device: saved?.device || '', uid };
  if (!meta.device) meta.device = Math.random().toString(36).slice(2, 10);
  setStatus('syncing');
  // 처음: 클라우드 기록을 먼저 받아 합친 뒤, 이 기기 기록을 올림
  await serial(async () => pull(await backend.getManifest()));
  await serial(pushNow);
  unwatch = backend.watchManifest((m) => serial(() => pull(m)));
}
export function stopSync() {
  if (unwatch) { try { unwatch(); } catch { /* noop */ } }
  unwatch = null; backend = null; clearTimeout(pushTimer);
  setStatus('off');
}
export const syncNow = () => serial(async () => { await pull(await backend.getManifest()); await pushNow(); });
export const isSyncing = () => !!backend;

onChange(() => schedulePush());
addEventListener('online', () => schedulePush(500));
document.addEventListener('visibilitychange', () => {
  if (!backend) return;
  if (document.visibilityState === 'hidden' && status.pending) { clearTimeout(pushTimer); serial(pushNow); }
  if (document.visibilityState === 'visible') syncNow();
});

// 테스트용: 메모리 백엔드로 동작 확인 (실서비스에서는 쓰이지 않음)
if (window.__archiveTestBackend) setTimeout(() => startSync(window.__archiveTestBackend, 'test-user'), 0);
