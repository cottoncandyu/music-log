// 모든 데이터는 기기 안(IndexedDB)에만 저장됩니다. 서버로 전송되지 않습니다.
import { today } from './util.js';

const DB_NAME = 'gongbu-desk';
const STORE = 'kv';
const KEY = 'state';

export const SUBJECT_COLORS = ['#e57373', '#f0a35e', '#e3c04f', '#7cbf6b', '#4fb0a5', '#5c9ce6', '#8a7be0', '#d07ab8', '#8d8d8d'];

const defaults = () => ({
  version: 1,
  profile: { name: '', goalMinutes: 240, goalWeight: null, theme: 'auto', penOnly: false },
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
});

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
    const tx = db.transaction(STORE, mode);
    const r = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(r && r.result);
    tx.onerror = () => reject(tx.error);
  });
}

function merge(base, saved) {
  const out = { ...base, ...saved };
  for (const k of ['profile', 'pomoCfg', 'run']) out[k] = { ...base[k], ...(saved[k] || {}) };
  return out;
}

export async function load() {
  let saved = null;
  try {
    db = await openDB();
    saved = await idb('readonly', (s) => s.get(KEY));
  } catch (e) {
    console.warn('IndexedDB 사용 불가, localStorage 사용', e);
    db = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { saved = null; }
  }
  if (saved) Object.assign(state, merge(defaults(), saved));
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { /* noop */ }
}

let timer = null;
const listeners = new Set();
export function onSaveError(fn) { listeners.add(fn); }

async function writeNow() {
  timer = null;
  try {
    if (db) await idb('readwrite', (s) => s.put(state, KEY));
    else localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error(e);
    listeners.forEach((fn) => fn(e));
  }
}
export function save() { clearTimeout(timer); timer = setTimeout(writeNow, 250); }
export function flush() { if (timer) { clearTimeout(timer); writeNow(); } }
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

export function replaceAll(data) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, merge(defaults(), data));
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
