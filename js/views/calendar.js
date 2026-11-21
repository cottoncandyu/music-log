// 캘린더 — 일정 + 할 일 · 디데이 · 다이어리 기분 · 공부시간 · 지출을 한 달에 모아보기
import { state, save } from '../store.js';
import { esc, today, fmtDate, ymd, uid, fmtShort, fmtDur, ddayLabel } from '../util.js';
import { modal, confirmBox } from '../ui.js';
import { icon } from '../icons.js';
import { moodSvg, moodId } from '../art.js';
import { secOnDate } from '../timers.js';

const COLORS = ['#e07a6f', '#e9a65a', '#d9bb4a', '#7fae78', '#5fa3a0', '#6b93d6', '#9a84d0', '#d784a8', '#8d8d8d'];
let month = today().slice(0, 7);
let sel = today();
const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;

function eventForm(ev, after) {
  const isNew = !ev;
  ev = ev || { id: uid(), date: sel, time: '', title: '', color: COLORS[5], memo: '' };
  let color = ev.color;
  modal(`<h2>${isNew ? '일정 추가' : '일정 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <label class="field"><span>일정</span><input type="text" name="title" value="${esc(ev.title)}" required placeholder="예: 스터디 모임, 병원"></label>
      <div class="row"><label class="field"><span>날짜</span><input type="date" name="date" value="${ev.date}" required></label>
        <label class="field"><span>시간 (선택)</span><input type="time" name="time" value="${ev.time}"></label></div>
      <div class="row">${COLORS.map((c) => `<button type="button" class="sw ${c === color ? 'on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>
      <label class="field"><span>메모</span><textarea name="memo" style="min-height:60px">${esc(ev.memo)}</textarea></label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      box.addEventListener('click', (e) => {
        const c = e.target.closest('[data-c]'); if (!c) return;
        color = c.dataset.c; box.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('on', b === c));
      });
      f.onsubmit = (e) => {
        e.preventDefault();
        Object.assign(ev, { title: f.title.value.trim(), date: f.date.value, time: f.time.value, memo: f.memo.value, color });
        if (isNew) state.events.push(ev);
        sel = ev.date; month = ev.date.slice(0, 7);
        save(); close(); after();
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox('이 일정을 삭제할까요?', '삭제')) { state.events = state.events.filter((x) => x !== ev); save(); after(); }
      });
    },
  });
}

const eventsOn = (d) => state.events.filter((e) => e.date === d).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));

function dayPanel() {
  const d = sel;
  const evs = eventsOn(d);
  const todos = state.todos.filter((t) => t.date === d);
  const dds = state.ddays.filter((x) => x.date === d);
  const di = state.diaries[d];
  const sec = secOnDate(d);
  const spend = state.money.filter((x) => x.date === d && x.type === 'out').reduce((a, b) => a + b.amount, 0);
  const bucket = state.bucket.filter((b) => !b.done && b.end === d);
  return `<div class="card"><h3>${fmtDate(d, true)}<button class="btn sm primary right" data-act="add">${icon('plus', 14)} 일정</button></h3>
    ${evs.length ? `<ul class="list">${evs.map((e) => `<li data-ev="${e.id}" style="cursor:pointer"><span class="dot" style="background:${e.color}"></span><span class="small muted num" style="min-width:42px">${e.time || '하루'}</span><span class="txt">${esc(e.title)}${e.memo ? `<br><span class="tiny muted">${esc(e.memo)}</span>` : ''}</span></li>`).join('')}</ul>` : '<div class="small muted">일정이 없어요</div>'}
    ${dds.length ? `<hr>${dds.map((x) => `<div class="small">${icon('calendar', 14)} <b>${esc(x.title)}</b> 당일</div>`).join('')}` : ''}
    ${bucket.length ? `<hr>${bucket.map((b) => `<div class="small">${icon('flag', 14)} 버킷리스트 기한: ${esc(b.title)}</div>`).join('')}` : ''}
    ${todos.length ? `<hr><div class="tiny muted">할 일 ${todos.filter((t) => t.done).length}/${todos.length}</div><ul class="list">${todos.map((t) => `<li class="check-item ${t.done ? 'done' : ''}"><input type="checkbox" data-todo="${t.id}" ${t.done ? 'checked' : ''}><span class="txt">${esc(t.text)}</span></li>`).join('')}</ul>` : ''}
    <hr><div class="stats">
      <div class="stat"><b>${sec ? fmtDur(sec) : '-'}</b><span>공부</span></div>
      <div class="stat"><b>${spend ? won(spend) : '-'}</b><span>지출</span></div>
      <div class="stat">${di?.mood ? `<span class="art-ic lg">${moodSvg(moodId(di.mood))}</span>` : '<b>-</b>'}<span>기분</span></div></div>
    <div class="row mt"><a class="btn sm" href="#/diary?date=${d}">${icon('diary', 14)} 다이어리</a><a class="btn sm" href="#/todo?date=${d}">${icon('check', 14)} 할 일</a></div>
  </div>`;
}

export default {
  render(el) {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1), last = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = 1; i <= last; i++) {
      const d = ymd(new Date(y, m - 1, i));
      const evs = eventsOn(d);
      const dds = state.ddays.filter((x) => x.date === d);
      const td = state.todos.filter((t) => t.date === d);
      const di = state.diaries[d];
      const sec = secOnDate(d);
      const dow = new Date(y, m - 1, i).getDay();
      cells.push(`<button class="cday ${d === today() ? 'today' : ''} ${d === sel ? 'sel' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}" data-day="${d}">
        <div class="top"><span class="d">${i}</span>${di?.mood ? `<span class="art-ic">${moodSvg(moodId(di.mood))}</span>` : ''}</div>
        ${dds.map((x) => `<span class="ev dd">${esc(x.title)}</span>`).join('')}
        ${evs.slice(0, 3).map((e) => `<span class="ev" style="--c:${e.color}">${esc(e.title)}</span>`).join('')}${evs.length > 3 ? `<span class="tiny muted">+${evs.length - 3}</span>` : ''}
        <span class="meta">${td.length ? `<i>${td.filter((t) => t.done).length}/${td.length}</i>` : ''}${sec ? `<i>${fmtShort(sec)}</i>` : ''}</span>
      </button>`);
    }
    const upcoming = state.events.filter((e) => e.date >= today()).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))).slice(0, 5);
    el.innerHTML = `
      <div class="date-nav"><button class="btn sm" data-nav="-1">${icon('left', 16)}</button><span class="label">${y}년 ${m}월</span><button class="btn sm" data-nav="1">${icon('right', 16)}</button>
        <button class="btn sm ghost" data-nav="0">오늘</button></div>
      <div class="cal-layout">
        <div class="card"><div class="bigcal">${['일', '월', '화', '수', '목', '금', '토'].map((w, i) => `<div class="wd ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</div>`).join('')}
          ${'<div class="cday out"></div>'.repeat(first.getDay())}${cells.join('')}</div>
          <div class="tiny muted mt">칸 안 숫자: 할 일 완료/전체 · 공부 시간</div></div>
        <div class="stack">${dayPanel()}
          <div class="card"><h3>${icon('clock', 16)} 다가오는 일정</h3>${upcoming.length ? `<ul class="list">${upcoming.map((e) => `<li data-ev="${e.id}" style="cursor:pointer"><span class="dot" style="background:${e.color}"></span><span class="txt">${esc(e.title)}</span><span class="tiny muted">${e.date.slice(5).replace('-', '/')} ${e.time || ''} · ${ddayLabel(e.date)}</span></li>`).join('')}</ul>` : '<div class="small muted">예정된 일정이 없어요</div>'}</div>
        </div>
      </div>`;
    const re = () => this.render(el);
    el.onclick = (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        const n = Number(nav.dataset.nav);
        if (n === 0) { month = today().slice(0, 7); sel = today(); } else month = ymd(new Date(y, m - 1 + n, 1)).slice(0, 7);
        return re();
      }
      const day = e.target.closest('[data-day]');
      if (day) { if (sel === day.dataset.day && e.detail >= 2) return eventForm(null, re); sel = day.dataset.day; return re(); }
      const ev = e.target.closest('[data-ev]'); if (ev) return eventForm(state.events.find((x) => x.id === ev.dataset.ev), re);
      if (e.target.closest('[data-act=add]')) eventForm(null, re);
    };
    el.onchange = (e) => {
      const id = e.target.dataset.todo;
      if (id) { const t = state.todos.find((x) => x.id === id); t.done = e.target.checked; save(); re(); }
    };
  },
};
