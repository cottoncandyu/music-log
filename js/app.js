import { state, save, load, onSaveError } from './store.js';
import { fmtClock, fmtMS } from './util.js';
import { toast } from './ui.js';
import { icon } from './icons.js';
import { applyTheme } from './theme.js';
import * as T from './timers.js';
import { openFocus } from './focus.js';
import './sync.js';
import { initAuth } from './firebase.js';

import home from './views/home.js';
import memo from './views/memo.js';
import timer from './views/timer.js';
import todo from './views/todo.js';
import dday from './views/dday.js';
import diary from './views/diary.js';
import records from './views/records.js';
import health from './views/health.js';
import share from './views/share.js';
import settings from './views/settings.js';
import bucket from './views/bucket.js';
import music from './views/music.js';
import money from './views/money.js';
import wish from './views/wish.js';
import calendar from './views/calendar.js';
import calc from './views/calc.js';
import journal from './views/journal.js';

// [key, icon, label, view, modes] — 데일리 모드는 모든 메뉴를 보여줘요
const S = ['study', 'daily'], L = ['life', 'daily'], ALL = ['study', 'life', 'daily'];
const ROUTES = [
  ['home', 'home', '홈', home, ALL],
  ['calendar', 'grid', '캘린더', calendar, ALL],
  ['memo', 'memo', '메모', memo, S],
  ['timer', 'timer', '타이머', timer, S],
  ['todo', 'check', '할 일', todo, ALL],
  ['dday', 'calendar', '디데이', dday, S],
  ['records', 'book', '독서·공부', records, S],
  ['diary', 'diary', '다이어리', diary, L],
  ['journal', 'journal', '다꾸북', journal, L],
  ['bucket', 'flag', '버킷리스트', bucket, L],
  ['music', 'music', '음악', music, L],
  ['money', 'wallet', '가계부', money, L],
  ['wish', 'gift', '위시리스트', wish, L],
  ['health', 'activity', '건강', health, L],
  ['share', 'users', '함께', share, L],
  ['calc', 'calc', '계산기', calc, ALL],
  ['settings', 'settings', '설정', settings, ALL],
];
export const MODES = { study: '공부', life: '라이프', daily: '데일리' };
const TITLES = { study: 'STUDY', life: 'LIFE', daily: 'DAILY' };

let current = null;
let currentKey = '';

function renderNav() {
  const mode = state.profile.mode;
  const items = ROUTES.filter((r) => r[4].includes(mode));
  document.getElementById('nav').innerHTML = `
    <div class="nav-brand">ARCHIVE</div>
    <div class="mode-switch" role="tablist">${Object.entries(MODES).map(([k, l]) => `<button data-mode="${k}" class="${k === mode ? 'on' : ''}" role="tab">${l}</button>`).join('')}</div>
    ${items.map(([k, ic, label]) => `<a class="nav-item ${k === currentKey ? 'on' : ''}" href="#/${k}">${icon(ic, 22)}<span>${label}</span></a>`).join('')}`;
  const on = document.querySelector('.nav-item.on');
  if (on && matchMedia('(max-width: 899px)').matches) on.scrollIntoView({ inline: 'center', block: 'nearest' });
}

export function setMode(mode) {
  if (state.profile.mode === mode) return;
  state.profile.mode = mode; save();
  if (location.hash === '#/home' || location.hash === '' || location.hash === '#/') route(); else location.hash = '#/home';
}

function route() {
  const key = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'home';
  const r = ROUTES.find((x) => x[0] === key) || ROUTES[0];
  // 다른 모드의 메뉴로 들어오면 모드를 자동 전환
  if (!r[4].includes(state.profile.mode)) { state.profile.mode = r[4][0]; save(); }
  if (current && current.destroy) current.destroy();
  currentKey = r[0];
  current = r[3];
  document.getElementById('title').textContent = r[0] === 'home' ? TITLES[state.profile.mode] || 'ARCHIVE' : r[2];
  document.title = `ARCHIVE · ${r[2]}`;
  renderNav();
  const fresh = document.createElement('main');
  fresh.id = 'main';
  document.getElementById('main').replaceWith(fresh);
  current.render(fresh);
  window.scrollTo(0, 0);
}

export function rerender() {
  if (current) current.render(document.getElementById('main'));
}

function updateRunningPill() {
  const pill = document.getElementById('running');
  const s = state.run.study, p = state.run.pomo;
  if (s) {
    pill.hidden = false;
    pill.innerHTML = `${s.running ? '<i class="rec"></i>' : icon('pause', 14)} ${s.subject} ${fmtClock(T.studyElapsed())}`;
    pill.onclick = () => openFocus('study');
  } else if (p && p.running) {
    pill.hidden = false;
    pill.innerHTML = `${T.PHASE_LABEL[p.phase]} ${fmtMS(T.pomoRemaining())}`;
    pill.onclick = () => openFocus('pomo');
  } else pill.hidden = true;
}

async function start() {
  await load();
  applyTheme();
  let lastWarn = 0;
  onSaveError((e, e2) => {
    if (Date.now() - lastWarn < 60000) return; // 1분에 한 번만
    lastWarn = Date.now();
    const quota = [e, e2].some((x) => x && x.name === 'QuotaExceededError');
    toast(quota ? '저장 공간이 부족해요. 설정 → 백업 후 사진을 정리해주세요.' : `저장에 실패했어요 (${e && e.name}). 앱을 완전히 닫았다 다시 열어주세요.`, 5000);
  });
  addEventListener('hashchange', route);
  addEventListener('themechange', () => { applyTheme(); renderNav(); });
  addEventListener('datachange', () => { if (current && current.onData) current.onData(); });
  // 다른 기기에서 받은 기록 반영 — 입력 중이면 끝난 뒤에 다시 그림
  let pendingSync = false;
  const applySynced = () => {
    const a = document.activeElement;
    if (a && a.matches('input, textarea, select') && document.getElementById('main').contains(a)) { pendingSync = true; return; }
    if (document.querySelector('.modal-back, .focus')) { pendingSync = true; return; }
    pendingSync = false; applyTheme(); renderNav(); rerender();
  };
  addEventListener('syncapplied', applySynced);
  document.addEventListener('focusout', () => { if (pendingSync) setTimeout(applySynced, 300); });
  document.addEventListener('click', () => { if (pendingSync && !document.querySelector('.modal-back, .focus')) setTimeout(applySynced, 300); });
  document.addEventListener('pointerdown', T.unlockAudio, { once: true });
  document.getElementById('nav').addEventListener('click', (e) => {
    const m = e.target.closest('[data-mode]');
    if (m) setMode(m.dataset.mode);
  });
  route();
  initAuth().catch((e) => console.warn('auth', e));
  let lastDay = new Date().toDateString();
  setInterval(() => {
    T.tick();
    updateRunningPill();
    window.dispatchEvent(new Event('tick'));
    const d = new Date().toDateString();
    if (d !== lastDay) { lastDay = d; rerender(); } // 자정이 지나면 새로고침
  }, 500);
  updateRunningPill();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // 홈 화면 앱은 예전 저장본을 쓰기 쉬워서: 열 때마다 새 버전 확인 → 있으면 받아서 한 번 새로고침
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloading) return;
      reloading = true; flushAndReload();
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      const check = () => reg.update().catch(() => {});
      check();
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
      setInterval(check, 30 * 60 * 1000);
    }).catch(() => {});
  }
}
function flushAndReload() {
  // 입력 중인 내용이 저장된 뒤 새로고침
  import('./store.js').then((m) => { m.flush(); setTimeout(() => location.reload(), 400); });
}
/** 설정의 '앱 새로 받기': 저장본을 모두 지우고 최신 파일로 다시 시작 (기록은 그대로) */
export async function hardRefresh() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(regs.map((r) => r.unregister()));
    const keys = await caches?.keys?.() || [];
    await Promise.all(keys.filter((k) => !/font/.test(k)).map((k) => caches.delete(k)));
  } catch { /* noop */ }
  flushAndReload();
}
export const APP_VERSION = 'v12';
start();
