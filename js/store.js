// 모든 데이터는 기기 안(IndexedDB)에만 저장됩니다. 서버로 전송되지 않습니다.
import { today } from './util.js';

// 기존 기록 유지를 위해 DB 이름은 바꾸지 않습니다 (앱 이름: ARCHIVE)
const DB_NAME = 'gongbu-desk';
const STORE = 'kv';
const KEY = 'state';

export const SUBJECT_COLORS = ['#e57373', '#f0a35e', '#e3c04f', '#7cbf6b', '#4fb0a5', '#5c9ce6', '#8a7be0', '#d07ab8', '#8d8d8d'];

const defaults = () => ({
  version: 2,
  profile: {
    name: '', goalMinutes: 240, goalWeight: null, penOnly: false, lastSubject: '',
    mode: 'study',            // 'study' | 'life' | 'daily'(둘 다)
    theme: 'vintage',         // 'vintage' | 'mono' | 'pastel' | 'clean'
    dark: 'auto',             // 'auto' | 'light' | 'dark'
    accent: '',               // 빈 값이면 테마 기본색
    uiFont: 'system', fontScale: 100, radius: -1, // -1 = 테마 기본
    bgImage: '', bgDim: 30,
    memoFont: 'gaegu', inkCorrect: true, inkStrength: 3,
    budget: 0,
    widgets: null,            // {study|life|daily: [{id,on}]} — null이면 기본
    widgetCfg: {
      clock: { style: 'digital', h24: true, seconds: false, date: true, font: 'gowun-batang', color: '' },
      photo: { src: '', caption: '', frame: 'polaroid' },
    },
  },
  subjects: [
    { name: '국어', color: '#e57373' }, { name: '영어', color: '#5c9ce6' }, { name: '수학', color: '#7cbf6b' },
    { name: '전공', color: '#8a7be0' }, { name: '자격증', color: '#f0a35e' }, { name: '기타', color: '#8d8d8d' },
  ],
  memos: [],        // {id, deck, front, back, color, x, y, rot, z, known, created}
  sessions: [],     // {id, subject, start, sec, date, kind:'timer'|'pomo'|'manual'}
  run: { study: null, pomo: null },
  pomoCfg: { focus: 25, short: 5, long: 15, every: 4, autoStart: false, sound: true },
  todos: [],        // {id, text, date, done, goalId}
  goals: [],        // {id, title, target, unit, current, deadline, done}
  ddays: [],        // {id, title, date, main}
  diaries: {},      // date -> {mood, weather, song:{title, artist}, grateful:[], text, drawing, stickers:[], photos:[]}
  books: [],        // {id, title, author, total, current, status, rating, review, quotes:[], log:[], color, start, end}
  notes: [],        // {id, date, subject, title, content}
  workouts: [],     // {id, date, type, min, memo}
  weights: {},      // date -> kg
  sleeps: {},       // date -> {wake, bed}
  friends: [],      // 공유 코드로 받은 친구 기록
  bucket: [],       // {id, title, term:'short'|'long', start, end, category, memo, done, doneDate}
  music: [],        // {id, date, title, artist, rating, tag, memo, link}
  money: [],        // {id, date, type:'in'|'out', amount, category, memo}
  wishes: [],       // {id, title, price, link, priority, photo, memo, bought, boughtDate, created}
  quotes: [],       // 직접 추가한 문장 {id, text, by}
  events: [],       // 캘린더 일정 {id, date, time, title, color, memo}
  playlists: [],    // {id, name, desc, color, cover, songs:[{id, title, artist, link}], created}
});

/** 이전 버전 데이터 변환 */
function migrate(s) {
  const p = s.profile || {};
  if (p.theme === 'auto' || p.theme === 'light' || p.theme === 'dark') { p.dark = p.theme; p.theme = 'vintage'; }
  s.version = 2;
  return s;
}

export const state = defaults();

let db = null;
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function idb(mode, fn) {
  return new Promise((resolve, reject) => {
    let tx;
    try { tx = db.transaction(STORE, mode); } catch (e) { reject(e); return; }
    const r = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(r && r.result);
    tx.onerror = () => reject(tx.error || new Error('IDB error'));
    tx.onabort = () => reject(tx.error || new Error('IDB abort'));
  });
}

async function connect() {
  try { db && db.close(); } catch { /* noop */ }
  db = await openDB();
  // iPadOS/iOS는 앱이 백그라운드로 가면 DB 연결을 끊는 경우가 있어 재연결 표시
  db.onclose = () => { db = null; };
  db.onversionchange = () => { try { db.close(); } catch { /* noop */ } db = null; };
  return db;
}

function merge(base, saved) {
  const out = { ...base, ...saved };
  for (const k of ['profile', 'pomoCfg', 'run']) out[k] = { ...base[k], ...(saved[k] || {}) };
  const wc = (saved.profile || {}).widgetCfg || {};
  out.profile.widgetCfg = { clock: { ...base.profile.widgetCfg.clock, ...(wc.clock || {}) }, photo: { ...base.profile.widgetCfg.photo, ...(wc.photo || {}) } };
  return out;
}

export const storageInfo = { engine: 'indexeddb', lastError: '' };

export async function load() {
  let saved = null;
  try {
    await connect();
    saved = await idb('readonly', (s) => s.get(KEY));
  } catch (e) {
    console.warn('IndexedDB 열기 실패', e);
    db = null;
  }
  if (!saved) {
    // 예전에 localStorage로 저장된 기록이 있으면 가져오기
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { saved = null; }
  }
  if (saved) Object.assign(state, merge(defaults(), migrate(saved)));
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { /* noop */ }
}

let timer = null;
const listeners = new Set();
export function onSaveError(fn) { listeners.add(fn); }

async function putIDB() {
  if (!db) await connect();
  await idb('readwrite', (s) => s.put(state, KEY));
}

async function writeNow() {
  timer = null;
  try {
    try {
      await putIDB();
    } catch (e1) {
      // 연결이 끊긴 경우가 대부분 → 재연결 후 한 번 더
      console.warn('IDB 저장 재시도', e1);
      db = null;
      await putIDB();
    }
    storageInfo.engine = 'indexeddb';
    storageInfo.lastError = '';
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
  } catch (e) {
    console.error(e);
    // 최후 수단: localStorage (용량 약 5MB)
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageInfo.engine = 'localstorage';
      storageInfo.lastError = `${e.name || 'Error'}: ${e.message || ''}`;
      return;
    } catch (e2) {
      storageInfo.lastError = `${e.name || 'Error'} / ${e2.name || 'Error'}`;
      listeners.forEach((fn) => fn(e, e2));
    }
  }
}
export function save() { clearTimeout(timer); timer = setTimeout(writeNow, 250); }
export function flush() { if (timer) { clearTimeout(timer); writeNow(); } }
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

export function replaceAll(data) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, merge(defaults(), migrate(data)));
  return writeNow();
}
export function resetAll() { return replaceAll({}); }

// ===== 조회 도우미 =====
export const subjectColor = (name) => (state.subjects.find((s) => s.name === name) || {}).color || '#8d8d8d';

export function diaryOf(date, create = false) {
  if (!state.diaries[date] && create) {
    state.diaries[date] = { mood: '', weather: '', song: { title: '', artist: '' }, grateful: ['', '', ''], text: '', drawing: '', stickers: [], photos: [] };
  }
  return state.diaries[date];
}

export const mainDday = () => {
  const list = state.ddays.slice().sort((a, b) => a.date.localeCompare(b.date));
  return list.find((d) => d.main) || list.find((d) => d.date >= today()) || list[0] || null;
};
