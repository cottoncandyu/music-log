import { state, load, onSaveError } from './store.js';
import { fmtClock, fmtMS } from './util.js';
import { toast } from './ui.js';
import * as T from './timers.js';
import { openFocus } from './focus.js';

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

const ROUTES = [
  ['home', '🏠', '홈', home],
  ['memo', '📌', '메모', memo],
  ['timer', '⏱️', '타이머', timer],
  ['todo', '✅', '할 일', todo],
  ['dday', '📅', '디데이', dday],
  ['diary', '📔', '다이어리', diary],
  ['records', '📚', '독서·공부', records],
  ['health', '💪', '건강', health],
  ['share', '🤝', '함께', share],
  ['settings', '⚙️', '설정', settings],
];

let current = null;
let currentKey = '';

function applyTheme() {
  const t = state.profile.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

function renderNav() {
  document.getElementById('nav').innerHTML = `<div class="nav-brand">📚 공부책상</div>` +
    ROUTES.map(([k, ico, label]) => `<a class="nav-item ${k === currentKey ? 'on' : ''}" href="#/${k}"><span class="ico">${ico}</span><span>${label}</span></a>`).join('');
  const on = document.querySelector('.nav-item.on');
  if (on && matchMedia('(max-width: 899px)').matches) on.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function route() {
  const key = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'home';
  const r = ROUTES.find((x) => x[0] === key) || ROUTES[0];
  if (current && current.destroy) current.destroy();
  currentKey = r[0];
  current = r[3];
  document.getElementById('title').textContent = r[0] === 'home' ? '공부책상' : `${r[1]} ${r[2]}`;
  renderNav();
  const main = document.getElementById('main');
  const fresh = document.createElement('main');
  fresh.id = 'main';
  main.replaceWith(fresh);
  current.render(fresh);
  window.scrollTo(0, 0);
}

export function rerender() {
  const main = document.getElementById('main');
  if (current) current.render(main);
}

function updateRunningPill() {
  const pill = document.getElementById('running');
  const s = state.run.study, p = state.run.pomo;
  if (s) {
    pill.hidden = false;
    pill.textContent = `${s.running ? '●' : '❚❚'} ${s.subject} ${fmtClock(T.studyElapsed())}`;
    pill.onclick = () => openFocus('study');
  } else if (p && p.running) {
    pill.hidden = false;
    pill.textContent = `🍅 ${T.PHASE_LABEL[p.phase]} ${fmtMS(T.pomoRemaining())}`;
    pill.onclick = () => openFocus('pomo');
  } else pill.hidden = true;
}

async function start() {
  await load();
  applyTheme();
  onSaveError(() => toast('⚠️ 저장 공간이 부족해요. 설정에서 백업 후 사진을 정리해주세요.', 5000));
  addEventListener('hashchange', route);
  addEventListener('themechange', applyTheme);
  addEventListener('datachange', () => { if (current && current.onData) current.onData(); });
  document.addEventListener('pointerdown', T.unlockAudio, { once: true });
  route();
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
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
start();
