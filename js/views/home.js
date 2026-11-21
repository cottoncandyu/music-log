// 홈 — 모드(공부/라이프)별 위젯 대시보드. 위젯 순서·표시는 설정에서 변경
import { state, save, mainDday } from '../store.js';
import { esc, today, fmtDate, fmtDur, fmtClock, fmtMS, ddayLabel, addDays, startOfWeek, WEEK, uid, parseYmd, fmtShort } from '../util.js';
import * as T from '../timers.js';
import { openFocus } from '../focus.js';
import { barChart } from '../charts.js';
import { toast } from '../ui.js';
import { icon } from '../icons.js';
import { quoteOfDay } from '../quotes.js';
import { moodSvg, weatherSvg, moodId, weatherId, moodLabel } from '../art.js';

export const WIDGETS = {
  quote: '하루 한 줄', dday: '디데이', study: '오늘 공부', pomo: '뽀모도로', todo: '오늘 할 일', goals: '목표', week: '이번 주 공부',
  diary: '오늘의 다이어리', bucket: '버킷리스트', music: '최근 음악', money: '이번 달 가계부', wish: '위시리스트', health: '오늘 건강',
};
export const DEFAULT_WIDGETS = {
  study: ['quote', 'dday', 'study', 'pomo', 'todo', 'goals', 'week'],
  life: ['quote', 'diary', 'dday', 'bucket', 'money', 'music', 'wish', 'health', 'todo'],
};
/** [{id,on}] 목록 — 새 위젯이 생겨도 뒤에 붙여서 반환 */
export function widgetList(mode) {
  const saved = state.profile.widgets?.[mode];
  const base = saved ? saved.filter((w) => WIDGETS[w.id]) : DEFAULT_WIDGETS[mode].map((id) => ({ id, on: true }));
  for (const id of Object.keys(WIDGETS)) if (!base.some((w) => w.id === id)) base.push({ id, on: false });
  return base;
}

let tickFn = null;
let quoteOffset = 0;
const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
const link = (href, inner, cls = '') => `<a class="card widget ${cls}" href="${href}">${inner}</a>`;
const head = (ic, title, right = '') => `<h3>${icon(ic, 18)} ${title}${right ? `<span class="right tiny muted">${right}</span>` : ''}</h3>`;

function greet() {
  const h = new Date().getHours();
  return h < 6 ? '늦은 밤까지 고생 많아요' : h < 12 ? '좋은 아침이에요' : h < 18 ? '오늘도 힘내요' : '오늘 하루 수고했어요';
}

const W = {
  quote() {
    const q = quoteOfDay(quoteOffset);
    return `<div class="card widget quote-card"><div class="row"><span class="tiny muted">${icon('quote', 16)} 하루 한 줄</span><span class="spacer"></span>
      <button class="icon-btn" data-act="quote" aria-label="다른 문장">${icon('refresh', 16)}</button></div>
      <div class="q hand">${esc(q.text)}</div>${q.by ? `<div class="tiny muted">— ${esc(q.by)}</div>` : ''}</div>`;
  },
  dday() {
    const dd = mainDday();
    return dd ? link('#/dday', `<div class="tiny" style="opacity:.85">${esc(dd.title)}</div><div class="big">${ddayLabel(dd.date)}</div><div class="tiny" style="opacity:.8">${fmtDate(dd.date, true)}</div>`, 'dday-hero')
      : link('#/dday', head('calendar', '디데이') + '<div class="muted small">시험·목표 날짜를 추가해보세요</div>');
  },
  study() {
    const goalSec = state.profile.goalMinutes * 60, sec = T.secOnDate(today());
    return `<div class="card widget">${head('timer', '오늘 공부', `목표 ${fmtDur(goalSec)}`)}
      <div class="big-time" data-study>${fmtClock(sec)}</div>
      <div class="progress mt ${sec >= goalSec ? 'good' : ''}"><i data-goalbar style="width:${Math.min(100, (sec / goalSec) * 100)}%"></i></div>
      <div class="row mt"><button class="btn primary" data-act="study">${T.studyRunning() ? icon('pause', 16) + ' 일시정지' : icon('play', 16) + ' 시작'}</button>
        ${state.run.study ? `<button class="btn" data-act="stop">${icon('stop', 16)} 저장</button>` : ''}
        <button class="btn soft" data-act="focus">${icon('screen', 16)} 집중화면</button></div></div>`;
  },
  pomo() {
    const p = T.pomo();
    return `<div class="card widget">${head('timer', '뽀모도로', T.PHASE_LABEL[p.phase])}
      <div class="big-time" data-pomo>${fmtMS(T.pomoRemaining())}</div><div class="muted small">오늘 ${T.pomoCountOn(today())}회 완료 · ${esc(p.subject)}</div>
      <div class="row mt"><button class="btn primary" data-act="pomo">${T.pomoRunning() ? icon('pause', 16) + ' 일시정지' : icon('play', 16) + ' 시작'}</button><a class="btn" href="#/timer?pomo">설정</a></div></div>`;
  },
  todo() {
    const t = today(), todos = state.todos.filter((x) => x.date === t), done = todos.filter((x) => x.done).length;
    return `<div class="card widget">${head('check', '오늘 할 일', `${done}/${todos.length}`)}
      ${todos.length ? `<ul class="list">${todos.map((x) => `<li class="check-item ${x.done ? 'done' : ''}"><input type="checkbox" data-todo="${x.id}" ${x.done ? 'checked' : ''}><span class="txt">${esc(x.text)}</span></li>`).join('')}</ul>` : '<div class="muted small">오늘 할 일을 적어보세요</div>'}
      <form class="row nowrap mt" data-form="todo"><input type="text" name="text" placeholder="빠르게 추가" autocomplete="off"><button class="btn">추가</button></form></div>`;
  },
  goals() {
    const goals = state.goals.filter((g) => !g.done).slice(0, 4);
    if (!goals.length) return link('#/todo?goals', head('flag', '목표') + '<div class="muted small">장기 목표를 세워보세요</div>');
    return link('#/todo?goals', head('flag', '목표') + `<div class="stack" style="gap:10px">${goals.map((g) => {
      const r = g.target ? Math.min(1, g.current / g.target) : 0;
      return `<div><div class="row small"><b>${esc(g.title)}</b><span class="spacer"></span><span class="muted">${g.current}/${g.target}${esc(g.unit || '')}</span></div><div class="progress ${r >= 1 ? 'good' : ''}"><i style="width:${r * 100}%"></i></div></div>`;
    }).join('')}</div>`);
  },
  week() {
    const t = today(), ws = startOfWeek(t);
    const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(ws, i); return { label: WEEK[parseYmd(d).getDay()], value: T.secOnDate(d), hi: d === t }; });
    return link('#/timer?stats', head('activity', '이번 주 공부', `총 ${fmtDur(week.reduce((a, b) => a + b.value, 0))}`) + barChart(week, { height: 140, fmt: fmtShort }));
  },
  diary() {
    const d = state.diaries[today()];
    const has = d && (d.mood || d.text || d.song?.title);
    return link('#/diary', head('diary', '오늘의 다이어리') + (has ? `<div class="row">
        ${d.mood ? `<span class="art-ic lg">${moodSvg(moodId(d.mood))}</span>` : ''}${d.weather ? `<span class="art-ic lg">${weatherSvg(weatherId(d.weather))}</span>` : ''}
        <div class="small">${d.mood ? `<b>${moodLabel(d.mood)}</b><br>` : ''}${d.song?.title ? `${icon('music', 14)} ${esc(d.song.title)}${d.song.artist ? ' - ' + esc(d.song.artist) : ''}` : ''}</div></div>
        ${d.text ? `<div class="small muted mt clamp2">${esc(d.text)}</div>` : ''}` : '<div class="muted small">오늘의 기분, 날씨, 노래를 남겨보세요</div>'));
  },
  bucket() {
    const list = state.bucket.filter((b) => !b.done).sort((a, b) => (a.end || '9').localeCompare(b.end || '9')).slice(0, 4);
    const done = state.bucket.filter((b) => b.done).length;
    return link('#/bucket', head('flag', '버킷리스트', `이룬 꿈 ${done}`) + (list.length ? `<ul class="list">${list.map((b) => `<li><span class="tag">${b.term === 'long' ? '장기' : '단기'}</span><span class="txt">${esc(b.title)}</span><span class="tiny muted">${b.end ? ddayLabel(b.end) : ''}</span></li>`).join('')}</ul>` : '<div class="muted small">해보고 싶은 일을 적어보세요</div>'));
  },
  music() {
    const all = [...state.music, ...Object.entries(state.diaries).filter(([, d]) => d.song?.title).map(([date, d]) => ({ date, title: d.song.title, artist: d.song.artist }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    return link('#/music', head('music', '최근 음악') + (all.length ? `<ul class="list">${all.map((m) => `<li><span class="txt"><b>${esc(m.title)}</b> <span class="muted small">${esc(m.artist || '')}</span></span><span class="tiny muted">${m.date.slice(5).replace('-', '/')}</span></li>`).join('')}</ul>` : '<div class="muted small">요즘 듣는 노래를 기록해보세요</div>'));
  },
  money() {
    const ym = today().slice(0, 7);
    const items = state.money.filter((x) => x.date.startsWith(ym));
    const out = items.filter((x) => x.type === 'out').reduce((a, b) => a + b.amount, 0);
    const todayOut = items.filter((x) => x.type === 'out' && x.date === today()).reduce((a, b) => a + b.amount, 0);
    const budget = Number(state.profile.budget) || 0;
    return link('#/money', head('wallet', '이번 달 가계부') + `<div class="stats"><div class="stat"><b>${won(out)}</b><span>지출</span></div><div class="stat"><b>${won(todayOut)}</b><span>오늘</span></div></div>
      ${budget ? `<div class="progress mt ${out > budget ? 'over' : ''}"><i style="width:${Math.min(100, (out / budget) * 100)}%"></i></div><div class="tiny muted mt">예산 ${won(budget)} 중 ${Math.round((out / budget) * 100)}%</div>` : ''}`);
  },
  wish() {
    const list = state.wishes.filter((w) => !w.bought).sort((a, b) => b.priority - a.priority).slice(0, 3);
    return link('#/wish', head('gift', '위시리스트') + (list.length ? `<ul class="list">${list.map((w) => `<li><span class="txt">${esc(w.title)}</span><span class="small muted num">${w.price ? won(w.price) : ''}</span></li>`).join('')}</ul>` : '<div class="muted small">갖고 싶은 것을 모아보세요</div>'));
  },
  health() {
    const t = today(), w = state.weights[t], sl = state.sleeps[t];
    const wMin = state.workouts.filter((x) => x.date === t).reduce((a, b) => a + Number(b.min || 0), 0);
    return link('#/health', head('activity', '오늘 건강') + `<div class="stats"><div class="stat"><b>${sl?.wake || '--:--'}</b><span>기상</span></div><div class="stat"><b>${w != null ? w + 'kg' : '--'}</b><span>몸무게</span></div><div class="stat"><b>${wMin}분</b><span>운동</span></div></div>`);
  },
};

export default {
  render(el) {
    const mode = state.profile.mode;
    const list = widgetList(mode).filter((w) => w.on);
    el.innerHTML = `
      <div class="hello"><div class="muted small">${fmtDate(today(), true)}</div>
        <h2>${esc(state.profile.name ? state.profile.name + '님, ' : '')}${greet()}</h2></div>
      <div class="grid widgets">${list.map((w) => W[w.id]()).join('')}</div>
      <p class="center tiny muted mt"><a href="#/settings?widgets" style="color:inherit">위젯 순서·표시 변경</a></p>`;

    el.onclick = (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      e.preventDefault();
      const a = b.dataset.act;
      if (a === 'quote') { quoteOffset++; return this.render(el); }
      if (a === 'study') T.studyRunning() ? T.studyPause() : T.studyStart();
      if (a === 'stop') { const s = T.studyStop(); toast(s >= 10 ? `${fmtDur(s)} 저장했어요` : '10초 미만은 저장되지 않아요'); }
      if (a === 'focus') { if (!state.run.study) T.studyStart(); openFocus('study'); }
      if (a === 'pomo') T.pomoRunning() ? T.pomoPause() : T.pomoStart();
      this.render(el);
    };
    el.onchange = (e) => {
      const id = e.target.dataset.todo;
      if (!id) return;
      const x = state.todos.find((y) => y.id === id);
      if (x) { x.done = e.target.checked; save(); this.render(el); }
    };
    el.onsubmit = (e) => {
      e.preventDefault();
      const text = e.target.text.value.trim();
      if (!text) return;
      state.todos.push({ id: uid(), text, date: today(), done: false, goalId: '' });
      save(); this.render(el);
      el.querySelector('[data-form=todo] input')?.focus();
    };

    if (tickFn) removeEventListener('tick', tickFn);
    tickFn = () => {
      const s = el.querySelector('[data-study]');
      if (s) {
        const sec = T.secOnDate(today());
        s.textContent = fmtClock(sec);
        el.querySelector('[data-goalbar]').style.width = `${Math.min(100, (sec / (state.profile.goalMinutes * 60)) * 100)}%`;
      }
      const p = el.querySelector('[data-pomo]'); if (p) p.textContent = fmtMS(T.pomoRemaining());
    };
    addEventListener('tick', tickFn);
  },
  onData() { this.render(document.getElementById('main')); },
  destroy() { if (tickFn) removeEventListener('tick', tickFn); tickFn = null; },
};
