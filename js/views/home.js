// 홈 — 모드(공부/라이프)별 위젯 대시보드. 위젯 순서·표시는 설정에서 변경
import { state, save, mainDday } from '../store.js';
import { esc, today, fmtDate, fmtDur, fmtClock, fmtMS, ddayLabel, addDays, startOfWeek, WEEK, uid, parseYmd, fmtShort, pad, ymd, resizeImage } from '../util.js';
import * as T from '../timers.js';
import { openFocus } from '../focus.js';
import { barChart } from '../charts.js';
import { toast, modal } from '../ui.js';
import { HAND_FONTS, handFont, fontPicker } from '../theme.js';
import { icon } from '../icons.js';
import { quoteOfDay } from '../quotes.js';
import { moodSvg, weatherSvg, moodId, weatherId, moodLabel } from '../art.js';

export const WIDGETS = {
  clock: '시계', photo: '사진', calendar: '이번 달 캘린더',
  quote: '하루 한 줄', dday: '디데이', study: '오늘 공부', pomo: '뽀모도로', todo: '오늘 할 일', goals: '목표', week: '이번 주 공부',
  diary: '오늘의 다이어리', bucket: '버킷리스트', music: '최근 음악', money: '이번 달 가계부', wish: '위시리스트', health: '오늘 건강',
};
export const DEFAULT_WIDGETS = {
  study: ['clock', 'quote', 'dday', 'study', 'pomo', 'todo', 'goals', 'week'],
  life: ['photo', 'quote', 'diary', 'dday', 'bucket', 'money', 'music', 'wish', 'health', 'todo'],
  daily: ['clock', 'photo', 'quote', 'dday', 'todo', 'study', 'diary', 'calendar', 'money', 'music', 'week', 'health'],
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

// ---------- 시계 ----------
const two = (n) => String(n).padStart(2, '0');
function clockText(c, d = new Date()) {
  let h = d.getHours();
  const ap = h < 12 ? '오전' : '오후';
  if (!c.h24) h = h % 12 || 12;
  return { main: `${c.h24 ? two(h) : h}:${two(d.getMinutes())}`, sec: two(d.getSeconds()), ap: c.h24 ? '' : ap };
}
function analog(d = new Date()) {
  const h = (d.getHours() % 12) * 30 + d.getMinutes() * 0.5, m = d.getMinutes() * 6 + d.getSeconds() * 0.1, s = d.getSeconds() * 6;
  return `<svg viewBox="0 0 100 100" class="analog"><circle cx="50" cy="50" r="46" fill="var(--surface)" stroke="currentColor" stroke-width="2"/>
    ${Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="${i % 3 ? 9 : 7}" x2="50" y2="${i % 3 ? 12 : 15}" stroke="currentColor" stroke-width="${i % 3 ? 1.4 : 2.6}" transform="rotate(${i * 30} 50 50)"/>`).join('')}
    <line data-hh x1="50" y1="50" x2="50" y2="27" stroke="currentColor" stroke-width="4" stroke-linecap="round" transform="rotate(${h} 50 50)"/>
    <line data-mm x1="50" y1="50" x2="50" y2="15" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" transform="rotate(${m} 50 50)"/>
    <line data-ss x1="50" y1="56" x2="50" y2="12" stroke="var(--accent)" stroke-width="1.2" transform="rotate(${s} 50 50)"/>
    <circle cx="50" cy="50" r="2.6" fill="var(--accent)"/></svg>`;
}
const WD = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
function clockInner(c) {
  const d = new Date(), t = clockText(c, d);
  const date = c.date ? `<div class="cdate">${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[d.getDay()]}</div>` : '';
  if (c.style === 'analog') return `<div class="clock-analog">${analog(d)}</div>${date}`;
  if (c.style === 'flip') return `<div class="clock-flip">${t.main.split('').map((ch) => (ch === ':' ? '<b class="colon">:</b>' : `<b>${ch}</b>`)).join('')}${c.seconds ? `<b class="s">${t.sec}</b>` : ''}</div>${t.ap ? `<div class="cdate">${t.ap}</div>` : ''}${date}`;
  if (c.style === 'minimal') return `${date}<div class="clock-min">${t.ap ? `<small>${t.ap}</small> ` : ''}${t.main}${c.seconds ? `<small>:${t.sec}</small>` : ''}</div>`;
  return `<div class="clock-digital">${t.ap ? `<small>${t.ap}</small>` : ''}${t.main}${c.seconds ? `<small class="s">${t.sec}</small>` : ''}</div>${date}`;
}
function clockEditor(after) {
  const c = state.profile.widgetCfg.clock;
  const draw = (box) => {
    box.innerHTML = `<h2>시계 꾸미기<button class="icon-btn" data-close>${icon('close')}</button></h2>
      <div class="card widget clock-w preview" style="font-family:${handFont(c.font).css};${c.color ? `color:${c.color}` : ''}">${clockInner(c)}</div>
      <div class="form mt">
        <div class="seg" style="margin:0">${[['digital', '디지털'], ['flip', '플립'], ['minimal', '미니멀'], ['analog', '아날로그']].map(([k, l]) => `<button data-style="${k}" class="${c.style === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="row"><label class="row"><input type="checkbox" data-o="h24" ${c.h24 ? 'checked' : ''}> 24시간</label>
          <label class="row"><input type="checkbox" data-o="seconds" ${c.seconds ? 'checked' : ''}> 초 표시</label>
          <label class="row"><input type="checkbox" data-o="date" ${c.date ? 'checked' : ''}> 날짜</label></div>
        <div class="row nowrap"><span class="small">글자색</span><input type="color" data-o="color" value="${c.color || '#3a3834'}" style="max-width:70px;height:38px;padding:2px"><button class="btn sm" data-act="color-reset">테마색</button></div>
        <div class="field"><span>글꼴</span>${fontPicker('cfont', c.font)}</div>
      </div>
      <div class="actions"><button class="btn primary" data-close>완료</button></div>`;
  };
  modal('', {
    wide: true,
    onMount(box) {
      draw(box);
      box.addEventListener('click', (e) => {
        const st = e.target.closest('[data-style]'); if (st) { c.style = st.dataset.style; save(); draw(box); }
        const f = e.target.closest('[data-cfont]'); if (f) { c.font = f.dataset.cfont; save(); draw(box); }
        if (e.target.closest('[data-act=color-reset]')) { c.color = ''; save(); draw(box); }
      });
      box.addEventListener('change', (e) => {
        const o = e.target.dataset.o; if (!o) return;
        c[o] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; save(); draw(box);
      });
    },
    onClose: after,
  });
}
// ---------- 사진 ----------
function photoEditor(after) {
  const ph = state.profile.widgetCfg.photo;
  const draw = (box) => {
    box.innerHTML = `<h2>사진 위젯<button class="icon-btn" data-close>${icon('close')}</button></h2>
      <div class="photo-w-prev">${photoInner(ph)}</div>
      <div class="form mt">
        <label class="btn">${icon('image', 16)} 사진 고르기<input type="file" accept="image/*" data-file hidden></label>
        <label class="field"><span>한 줄 문구</span><input type="text" data-cap value="${esc(ph.caption)}" placeholder="예: 2026 가을, 우리"></label>
        <div class="field"><span>액자</span><div class="seg" style="margin:0">${[['polaroid', '폴라로이드'], ['tape', '테이프'], ['round', '둥글게'], ['full', '꽉 차게']].map(([k, l]) => `<button data-frame="${k}" class="${ph.frame === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        ${ph.src ? '<button class="btn sm danger" data-act="del">사진 지우기</button>' : ''}
      </div>
      <div class="actions"><button class="btn primary" data-close>완료</button></div>`;
  };
  modal('', {
    onMount(box) {
      draw(box);
      box.addEventListener('click', (e) => {
        const f = e.target.closest('[data-frame]'); if (f) { ph.frame = f.dataset.frame; save(); draw(box); }
        if (e.target.closest('[data-act=del]')) { ph.src = ''; save(); draw(box); }
      });
      box.addEventListener('change', async (e) => {
        if (e.target.matches('[data-file]') && e.target.files[0]) { ph.src = await resizeImage(e.target.files[0], 1200, 0.85); save(); draw(box); }
        if (e.target.matches('[data-cap]')) { ph.caption = e.target.value; save(); draw(box); }
      });
    },
    onClose: after,
  });
}
function photoInner(ph) {
  if (!ph.src) return `<div class="photo-empty">${icon('image', 30)}<span class="small">사진을 추가해보세요</span></div>`;
  return `<figure class="pframe f-${ph.frame}">${ph.frame === 'tape' ? '<i class="ptape"></i>' : ''}<img src="${ph.src}" alt="">${ph.caption && ph.frame === 'polaroid' ? `<figcaption class="hand">${esc(ph.caption)}</figcaption>` : ''}</figure>${ph.caption && ph.frame !== 'polaroid' ? `<div class="hand center pcap">${esc(ph.caption)}</div>` : ''}`;
}

const W = {
  clock() {
    const c = state.profile.widgetCfg.clock;
    return `<div class="card widget clock-w" style="font-family:${handFont(c.font).css};${c.color ? `color:${c.color}` : ''}">
      <button class="icon-btn wedit" data-act="clock-edit" aria-label="시계 꾸미기">${icon('edit', 15)}</button><div data-clockbox>${clockInner(c)}</div></div>`;
  },
  photo() {
    const ph = state.profile.widgetCfg.photo;
    return `<div class="card widget photo-w"><button class="icon-btn wedit" data-act="photo-edit" aria-label="사진 바꾸기">${icon('edit', 15)}</button><div data-act="photo-edit">${photoInner(ph)}</div></div>`;
  },
  calendar() {
    const t = today(), [y, m] = t.slice(0, 7).split('-').map(Number);
    const first = new Date(y, m - 1, 1).getDay(), last = new Date(y, m, 0).getDate();
    const cells = Array.from({ length: last }, (_, i) => {
      const d = ymd(new Date(y, m - 1, i + 1));
      const has = state.events.some((e) => e.date === d) || state.ddays.some((x) => x.date === d);
      return `<span class="${d === t ? 'today' : ''} ${has ? 'has' : ''}">${i + 1}</span>`;
    });
    const next = state.events.filter((e) => e.date >= t).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))[0];
    return link('#/calendar', head('grid', `${m}월`, next ? `${esc(next.title)} · ${ddayLabel(next.date)}` : '') + `<div class="minical">${['일', '월', '화', '수', '목', '금', '토'].map((w) => `<b>${w}</b>`).join('')}${'<span></span>'.repeat(first)}${cells.join('')}</div>`);
  },
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
    const goalSec = state.profile.goalMinutes * 60, sec = T.selfSecOnDate(today()), all = T.secOnDate(today());
    return `<div class="card widget">${head('timer', '오늘 순공', `목표 ${fmtDur(goalSec)}`)}
      <div class="big-time" data-study>${fmtClock(sec)}</div>
      <div class="tiny muted" data-studyall>${all > sec ? `학원·인강 포함 ${fmtDur(all)}` : ''}</div>
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
      if (a === 'clock-edit') return clockEditor(() => this.render(el));
      if (a === 'photo-edit') return photoEditor(() => this.render(el));
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
        const sec = T.selfSecOnDate(today()), all = T.secOnDate(today());
        s.textContent = fmtClock(sec);
        const sa = el.querySelector('[data-studyall]'); if (sa) sa.textContent = all > sec ? `학원·인강 포함 ${fmtDur(all)}` : '';
        el.querySelector('[data-goalbar]').style.width = `${Math.min(100, (sec / (state.profile.goalMinutes * 60)) * 100)}%`;
      }
      const p = el.querySelector('[data-pomo]'); if (p) p.textContent = fmtMS(T.pomoRemaining());
      const cb = el.querySelector('[data-clockbox]');
      if (cb) { const c = state.profile.widgetCfg.clock; const html = clockInner(c); if (cb._h !== html) { cb.innerHTML = html; cb._h = html; } }
    };
    addEventListener('tick', tickFn);
  },
  onData() { this.render(document.getElementById('main')); },
  destroy() { if (tickFn) removeEventListener('tick', tickFn); tickFn = null; },
};
