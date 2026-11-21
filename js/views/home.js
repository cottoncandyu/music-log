import { state, save, mainDday, subjectColor } from '../store.js';
import { esc, today, fmtDate, fmtDur, fmtClock, fmtMS, ddayLabel, addDays, startOfWeek, WEEK, uid, parseYmd, fmtShort } from '../util.js';
import * as T from '../timers.js';
import { openFocus } from '../focus.js';
import { barChart } from '../charts.js';
import { toast } from '../ui.js';

let tickFn = null;

function greet() {
  const h = new Date().getHours();
  return h < 6 ? '늦은 밤까지 고생 많아요' : h < 12 ? '좋은 아침이에요' : h < 18 ? '오늘도 힘내요' : '오늘 하루 수고했어요';
}

export default {
  render(el) {
    const t = today();
    const dd = mainDday();
    const todos = state.todos.filter((x) => x.date === t);
    const doneN = todos.filter((x) => x.done).length;
    const goalSec = state.profile.goalMinutes * 60;
    const studySec = T.secOnDate(t);
    const diary = state.diaries[t];
    const ws = startOfWeek(t);
    const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(ws, i); return { label: WEEK[parseYmd(d).getDay()], value: T.secOnDate(d), hi: d === t }; });
    const w = state.weights[t], sl = state.sleeps[t];
    const wMin = state.workouts.filter((x) => x.date === t).reduce((a, b) => a + Number(b.min || 0), 0);
    const p = T.pomo();
    const goals = state.goals.filter((g) => !g.done).slice(0, 4);

    el.innerHTML = `
      <div class="hello"><div class="muted">${fmtDate(t, true)}</div>
        <h2>${esc(state.profile.name ? state.profile.name + '님, ' : '')}${greet()} 👋</h2></div>
      <div class="grid">
        ${dd ? `<a class="card dday-hero" href="#/dday" style="text-decoration:none">
            <div style="opacity:.9">${esc(dd.title)}</div><div class="big">${ddayLabel(dd.date)}</div>
            <div class="small" style="opacity:.85">${fmtDate(dd.date, true)}</div></a>`
          : `<a class="card" href="#/dday" style="text-decoration:none"><h3>📅 디데이</h3><div class="muted">시험·목표 날짜를 추가해보세요 →</div></a>`}

        <div class="card">
          <h3>⏱️ 오늘 공부 <span class="right tiny muted">목표 ${fmtDur(goalSec)}</span></h3>
          <div class="big-time" data-study>${fmtClock(studySec)}</div>
          <div class="progress mt ${studySec >= goalSec ? 'good' : ''}"><i data-goalbar style="width:${Math.min(100, (studySec / goalSec) * 100)}%"></i></div>
          <div class="row mt">
            <button class="btn primary" data-act="study">${T.studyRunning() ? '❚❚ 일시정지' : '▶ 공부 시작'}</button>
            ${state.run.study ? '<button class="btn" data-act="stop">⏹ 저장</button>' : ''}
            <button class="btn soft" data-act="focus">🖥 집중화면</button>
          </div>
        </div>

        <div class="card">
          <h3>🍅 뽀모도로 <span class="right tag">${T.PHASE_LABEL[p.phase]}</span></h3>
          <div class="big-time" data-pomo>${fmtMS(T.pomoRemaining())}</div>
          <div class="muted small">오늘 ${T.pomoCountOn(t)}개 완료 · ${esc(p.subject)}</div>
          <div class="row mt">
            <button class="btn primary" data-act="pomo">${T.pomoRunning() ? '❚❚ 일시정지' : '▶ 시작'}</button>
            <a class="btn" href="#/timer?pomo">설정</a>
          </div>
        </div>

        <div class="card">
          <h3>✅ 오늘 할 일 <span class="right tiny muted">${doneN}/${todos.length}</span></h3>
          ${todos.length ? `<ul class="list">${todos.map((x) => `
            <li class="check-item ${x.done ? 'done' : ''}"><input type="checkbox" data-todo="${x.id}" ${x.done ? 'checked' : ''}>
            <span class="txt">${esc(x.text)}</span></li>`).join('')}</ul>` : '<div class="muted small">오늘 할 일을 적어보세요</div>'}
          <form class="row nowrap mt" data-form="todo"><input type="text" name="text" placeholder="할 일 빠르게 추가" autocomplete="off"><button class="btn">추가</button></form>
        </div>

        ${goals.length ? `<a class="card" href="#/todo?goals" style="text-decoration:none"><h3>🎯 목표</h3>
          <div class="stack" style="gap:10px">${goals.map((g) => {
            const r = g.target ? Math.min(1, g.current / g.target) : 0;
            return `<div><div class="row small"><b>${esc(g.title)}</b><span class="spacer"></span><span class="muted">${g.current}/${g.target}${esc(g.unit || '')}</span></div>
              <div class="progress ${r >= 1 ? 'good' : ''}"><i style="width:${r * 100}%"></i></div></div>`;
          }).join('')}</div></a>` : ''}

        <a class="card" href="#/diary" style="text-decoration:none">
          <h3>📔 오늘의 다이어리</h3>
          ${diary && (diary.mood || diary.text || diary.song?.title) ? `
            <div class="row"><span class="mood-big">${diary.mood || '📝'}</span><span class="mood-big">${diary.weather || ''}</span>
            <div class="small">${diary.song?.title ? `🎵 ${esc(diary.song.title)}${diary.song.artist ? ' - ' + esc(diary.song.artist) : ''}` : ''}</div></div>
            ${diary.text ? `<div class="small muted mt" style="overflow:hidden;max-height:3em">${esc(diary.text)}</div>` : ''}`
          : '<div class="muted">오늘 기분, 날씨, 노래, 감사한 일을 기록해요 →</div>'}
        </a>

        <a class="card" href="#/health" style="text-decoration:none">
          <h3>💪 오늘 건강</h3>
          <div class="stats">
            <div class="stat"><b>${sl?.wake || '--:--'}</b><span>기상</span></div>
            <div class="stat"><b>${w != null ? w + 'kg' : '--'}</b><span>몸무게</span></div>
            <div class="stat"><b>${wMin}분</b><span>운동</span></div>
          </div>
        </a>

        <a class="card" href="#/timer?stats" style="text-decoration:none">
          <h3>📊 이번 주 공부 <span class="right tiny muted">총 ${fmtDur(week.reduce((a, b) => a + b.value, 0))}</span></h3>
          ${barChart(week, { height: 150, fmt: fmtShort })}
        </a>
      </div>`;

    el.onclick = (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const a = b.dataset.act;
      if (a === 'study') T.studyRunning() ? T.studyPause() : T.studyStart();
      if (a === 'stop') { const s = T.studyStop(); toast(s >= 10 ? `${fmtDur(s)} 저장했어요 👏` : '10초 미만은 저장되지 않아요'); }
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
      state.todos.push({ id: uid(), text, date: t, done: false, goalId: '' });
      save(); this.render(el);
      el.querySelector('[data-form=todo] input')?.focus();
    };

    if (tickFn) removeEventListener('tick', tickFn);
    tickFn = () => {
      const s = el.querySelector('[data-study]');
      if (!s) return;
      const sec = T.secOnDate(today());
      s.textContent = fmtClock(sec);
      el.querySelector('[data-goalbar]').style.width = `${Math.min(100, (sec / goalSec) * 100)}%`;
      el.querySelector('[data-pomo]').textContent = fmtMS(T.pomoRemaining());
    };
    addEventListener('tick', tickFn);
  },
  onData() { const el = document.getElementById('main'); this.render(el); },
  destroy() { if (tickFn) removeEventListener('tick', tickFn); tickFn = null; },
};
