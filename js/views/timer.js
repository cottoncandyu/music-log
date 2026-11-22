import { state, save, subjectColor } from '../store.js';
import { icon } from '../icons.js';
import { esc, today, fmtDate, fmtDur, fmtClock, fmtMS, addDays, startOfWeek, WEEK, parseYmd, ymd, pad, uid, fmtShort, daysBetween } from '../util.js';
import * as T from '../timers.js';
import { openFocus } from '../focus.js';
import { barChart, ring, setRing } from '../charts.js';
import { seg, modal, confirmBox, toast } from '../ui.js';

let tab = 'study';
let statMode = 'week';
let anchor = today();
let selDay = today();
let tickFn = null;
let statKind = 'self'; // 통계: 'self' 순공만 | 'all' 학원·인강 포함
const secFor = (d) => (statKind === 'self' ? T.selfSecOnDate(d) : T.secOnDate(d));
const modeChips = (cur) => `<div class="chips mode-chips">${Object.entries(T.STUDY_MODES).map(([k, l]) => `<button class="chip ${k === cur ? 'on' : ''}" data-mode-pick="${k}">${l}</button>`).join('')}</div>`;
const modeTag = (s) => `<span class="tag mode-${T.modeOf(s)}">${T.STUDY_MODES[T.modeOf(s)]}</span>`;
function todaySplit(d) {
  const self = T.selfSecOnDate(d), lec = T.secOnDate(d, null, 'lecture'), cls = T.secOnDate(d, null, 'class');
  return `<div class="stats split"><div class="stat"><b data-self>${fmtDur(self)}</b><span>순공</span></div><div class="stat"><b>${fmtDur(lec)}</b><span>인강</span></div><div class="stat"><b>${fmtDur(cls)}</b><span>학원·수업</span></div><div class="stat"><b data-today>${fmtDur(self + lec + cls)}</b><span>합계</span></div></div>`;
}

const subjectChips = (cur, attr = 'subj') =>
  `<div class="chips">${state.subjects.map((s) => `<button class="chip ${s.name === cur ? 'on' : ''}" data-${attr}="${esc(s.name)}"><span class="dot" style="background:${s.color}"></span>${esc(s.name)}</button>`).join('')}</div>`;

function subjectLegend(sessions) {
  const rows = T.bySubject(sessions);
  if (!rows.length) return '<div class="empty">기록이 없어요</div>';
  const max = rows[0][1];
  return `<div class="legend">${rows.map(([name, sec]) => `<div class="item"><span class="dot" style="background:${subjectColor(name)}"></span>
    <span style="min-width:64px">${esc(name)}</span><div class="progress bar"><i style="width:${(sec / max) * 100}%;background:${subjectColor(name)}"></i></div>
    <span class="num small" style="min-width:76px;text-align:right">${fmtDur(sec)}</span></div>`).join('')}</div>`;
}

function sessionList(date) {
  const list = state.sessions.filter((s) => s.date === date).sort((a, b) => a.start - b.start);
  if (!list.length) return '<div class="empty">이 날의 기록이 없어요</div>';
  return `<ul class="list">${list.map((s) => {
    const d = new Date(s.start);
    return `<li><span class="dot" style="background:${subjectColor(s.subject)}"></span>
      <span class="txt" style="flex:1">${esc(s.subject)} ${modeTag(s)} <span class="tag">${s.kind === 'pomo' ? '뽀모도로' : s.kind === 'manual' ? '직접 입력' : '타이머'}</span></span>
      <span class="muted small num">${pad(d.getHours())}:${pad(d.getMinutes())}</span><b class="num">${fmtDur(s.sec)}</b>
      <button class="icon-btn" data-del-session="${s.id}" aria-label="삭제">${icon('trash', 16)}</button></li>`;
  }).join('')}</ul>`;
}

function addManual(after) {
  modal(`<h2>공부 시간 직접 입력<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <label class="field"><span>날짜</span><input type="date" name="date" value="${selDay}" max="${today()}" required></label>
      <div class="row"><label class="field"><span>과목</span><select name="subject">${state.subjects.map((s) => `<option>${esc(s.name)}</option>`).join('')}</select></label>
        <label class="field"><span>종류</span><select name="mode">${Object.entries(T.STUDY_MODES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label></div>
      <div class="row"><label class="field"><span>시간</span><input type="number" name="h" min="0" max="23" value="1"></label>
      <label class="field"><span>분</span><input type="number" name="m" min="0" max="59" value="0"></label></div>
      <div class="actions"><button type="button" class="btn" data-close>취소</button><button class="btn primary">추가</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      f.onsubmit = (e) => {
        e.preventDefault();
        const sec = (Number(f.h.value) || 0) * 3600 + (Number(f.m.value) || 0) * 60;
        if (sec <= 0) return toast('시간을 입력해주세요');
        const start = parseYmd(f.date.value); start.setHours(12);
        state.sessions.push({ id: uid(), subject: f.subject.value, start: start.getTime(), sec, date: f.date.value, kind: 'manual', mode: f.mode.value });
        save(); close(); after();
      };
    },
  });
}

function renderStudy() {
  const r = state.run.study;
  const cur = r ? r.subject : T.defaultSubject();
  const t = today();
  return `<div class="grid two">
    <div class="card">
      <h3>과목 선택</h3>${subjectChips(cur)}
      <div class="small muted mt">공부 종류 <span class="tiny">— 학원·인강 시간은 순공과 따로 집계돼요</span></div>${modeChips(r ? T.modeOf(r) : T.defaultMode())}
      <div class="timer-face"><div class="clock" data-clock>${fmtClock(T.studyElapsed())}</div>
        <div class="sub">${r ? `${T.STUDY_MODES[T.modeOf(r)]} · ${r.running ? '공부 중…' : '일시정지'}` : '시작 버튼을 눌러주세요'}</div></div>
      <div class="row" style="justify-content:center">
        <button class="btn lg primary" data-act="toggle">${T.studyRunning() ? icon('pause', 18) + ' 일시정지' : r ? icon('play', 18) + ' 계속' : icon('play', 18) + ' 시작'}</button>
        ${r ? `<button class="btn lg" data-act="stop">${icon('stop', 18)} 종료·저장</button>` : ''}
        <button class="btn lg soft" data-act="focus">${icon('screen', 18)} 집중 화면</button>
      </div>
      <p class="tiny muted center mt">집중 화면은 화면이 꺼지지 않게 유지돼요. 아이패드를 세워두고 공부해보세요.</p>
    </div>
    <div class="card">
      <h3>오늘 <span class="right tiny muted">순공 목표 ${fmtDur(state.profile.goalMinutes * 60)}</span></h3>
      ${todaySplit(t)}
      <div class="progress mb mt"><i data-goalp style="width:${Math.min(100, (T.selfSecOnDate(t) / (state.profile.goalMinutes * 60)) * 100)}%"></i></div>
      ${subjectLegend(state.sessions.filter((s) => s.date === t))}
      <hr>${sessionList(t)}
      <button class="btn sm mt" data-act="manual">＋ 직접 입력</button>
    </div>
  </div>`;
}

function renderPomo() {
  const p = T.pomo();
  const c = state.pomoCfg;
  const rem = T.pomoRemaining();
  return `<div class="grid two">
    <div class="card">
      <div class="seg" style="display:flex;justify-content:center">${['focus', 'short', 'long'].map((k) => `<button data-phase="${k}" class="${p.phase === k ? 'on' : ''}">${T.PHASE_LABEL[k]}</button>`).join('')}</div>
      <div class="ring-wrap">${ring(1 - rem / T.pomoTotal(), { color: p.phase === 'focus' ? 'var(--accent)' : 'var(--good)' })}
        <div class="inner"><div class="clock" data-pclock>${fmtMS(rem)}</div><div class="muted">${esc(p.subject)}</div></div></div>
      <div class="tomatoes center">${'<i class="tomato on"></i>'.repeat(p.count % c.every || (p.count ? c.every : 0))}${'<i class="tomato"></i>'.repeat(c.every - (p.count % c.every || (p.count ? c.every : 0)))}</div>
      <div class="row mt" style="justify-content:center">
        <button class="btn lg primary" data-act="ptoggle">${p.running ? icon('pause', 18) + ' 일시정지' : icon('play', 18) + ' 시작'}</button>
        <button class="btn lg" data-act="preset">${icon('refresh', 18)}</button><button class="btn lg" data-act="pskip">건너뛰기</button>
        <button class="btn lg soft" data-act="pfocus">${icon('screen', 18)}</button>
      </div>
      <div class="mt"><div class="small muted mb">집중 과목 (완료 시 공부시간에 자동 기록)</div>${subjectChips(p.subject, 'psubj')}</div>
    </div>
    <div class="card">
      <h3>설정</h3>
      <form class="form" data-form="pomo">
        <div class="row"><label class="field"><span>집중(분)</span><input type="number" name="focus" min="1" max="180" value="${c.focus}"></label>
        <label class="field"><span>짧은 휴식</span><input type="number" name="short" min="1" max="60" value="${c.short}"></label>
        <label class="field"><span>긴 휴식</span><input type="number" name="long" min="1" max="90" value="${c.long}"></label></div>
        <label class="field"><span>긴 휴식 주기 (뽀모도로 n개마다)</span><input type="number" name="every" min="2" max="10" value="${c.every}"></label>
        <label class="row"><input type="checkbox" name="autoStart" ${c.autoStart ? 'checked' : ''}> 다음 단계 자동 시작</label>
        <label class="row"><input type="checkbox" name="sound" ${c.sound ? 'checked' : ''}> 알림 소리</label>
      </form>
      <hr><div class="stats"><div class="stat"><b>${T.pomoCountOn(today())}</b><span>오늘 완료한 </span></div>
      <div class="stat"><b>${fmtDur(state.sessions.filter((s) => s.date === today() && s.kind === 'pomo').reduce((a, b) => a + b.sec, 0))}</b><span>뽀모도로 집중 시간</span></div></div>
      <p class="tiny muted mt">※ iPad/iPhone 웹앱은 화면이 꺼지면 소리 알림이 울리지 않을 수 있어요. 집중 화면을 켜두면 화면이 유지돼요.</p>
    </div>
  </div>`;
}

function renderStats() {
  let from, to, items;
  if (statMode === 'week') {
    from = startOfWeek(anchor); to = addDays(from, 6);
    items = Array.from({ length: 7 }, (_, i) => { const d = addDays(from, i); return { label: `${WEEK[parseYmd(d).getDay()]} ${parseYmd(d).getDate()}`, value: secFor(d), hi: d === selDay, date: d }; });
  } else {
    const a = parseYmd(anchor);
    from = ymd(new Date(a.getFullYear(), a.getMonth(), 1)); to = ymd(new Date(a.getFullYear(), a.getMonth() + 1, 0));
  }
  const allSessions = T.sessionsBetween(from, to);
  const sessions = statKind === 'self' ? allSessions.filter((x) => T.modeOf(x) === 'self') : allSessions;
  const runAdd = state.run.study && today() >= from && today() <= to && (statKind === 'all' || T.modeOf(state.run.study) === 'self') ? T.studyElapsed() : 0;
  const total = sessions.reduce((s, x) => s + x.sec, 0) + runAdd;
  const classSec = allSessions.filter((x) => T.modeOf(x) !== 'self').reduce((a, b) => a + b.sec, 0);
  const days = new Set(sessions.map((s) => s.date)).size;
  const nDays = Math.max(1, Math.min(daysBetween(from, to) + 1, daysBetween(from, today()) + 1));
  const label = statMode === 'week' ? `${fmtDate(from).replace(/ \(.\)/, '')} ~ ${fmtDate(to).replace(/ \(.\)/, '')}` : `${from.slice(0, 4)}년 ${Number(from.slice(5, 7))}월`;

  let body;
  if (statMode === 'week') body = `<div data-bars>${barChart(items, { fmt: fmtShort, height: 200 })}</div><div class="chips scroll mt">${items.map((i) => `<button class="chip ${i.date === selDay ? 'on' : ''}" data-day="${i.date}">${i.label}</button>`).join('')}</div>`;
  else {
    const first = parseYmd(from);
    const lead = (first.getDay() + 6) % 7;
    const last = parseYmd(to).getDate();
    const vals = Array.from({ length: last }, (_, i) => secFor(addDays(from, i)));
    const max = Math.max(3600, ...vals);
    body = `<div class="cal">${['월', '화', '수', '목', '금', '토', '일'].map((w) => `<div class="wd">${w}</div>`).join('')}
      ${'<div class="day out"></div>'.repeat(lead)}
      ${vals.map((v, i) => {
        const d = addDays(from, i);
        const a = v ? 0.18 + 0.82 * (v / max) : 0;
        return `<button class="day ${d === today() ? 'today' : ''} ${d === selDay ? 'sel' : ''}" data-day="${d}" style="${v ? `background:color-mix(in srgb, var(--accent) ${Math.round(a * 100)}%, var(--surface2))` : ''}">
          <span class="d">${i + 1}</span><span class="v">${v ? fmtShort(v) : ''}</span></button>`;
      }).join('')}</div>`;
  }

  return `<div class="row mb">${seg([['week', '주간'], ['month', '월간']], statMode).replace('class="seg"', 'class="seg" style="margin:0"').replaceAll('data-seg', 'data-smode')}
      ${seg([['self', '순공만'], ['all', '학원·인강 포함']], statKind).replace('class="seg"', 'class="seg" style="margin:0"').replaceAll('data-seg', 'data-skind')}
      <span class="spacer"></span><button class="btn sm" data-act="manual">＋ 직접 입력</button></div>
    <div class="date-nav"><button class="btn sm" data-nav="-1">‹</button><span class="label">${label}</span><button class="btn sm" data-nav="1">›</button>
      <button class="btn sm ghost" data-nav="0">오늘</button></div>
    <div class="grid two">
      <div class="card"><div class="stats mb">
          <div class="stat"><b>${fmtDur(total)}</b><span>${statKind === 'self' ? '순공' : '총 공부'}</span></div>
          ${statKind === 'self' ? `<div class="stat"><b>${fmtDur(classSec)}</b><span>학원·인강 (별도)</span></div>` : ''}
          <div class="stat"><b>${fmtDur(total / nDays)}</b><span>하루 평균</span></div>
          <div class="stat"><b>${days}일</b><span>공부한 날</span></div>
          <div class="stat"><b>${sessions.filter((s) => s.kind === 'pomo').length}</b><span></span></div>
        </div>${body}</div>
      <div class="card"><h3>과목별</h3>${subjectLegend(sessions)}</div>
      <div class="card"><h3>${fmtDate(selDay)} 기록 <span class="right num">순공 ${fmtDur(T.selfSecOnDate(selDay))} · 총 ${fmtDur(T.secOnDate(selDay))}</span></h3>${sessionList(selDay)}</div>
    </div>`;
}

export default {
  render(el) {
    const q = location.hash.split('?')[1];
    if (q === 'pomo' || q === 'stats') { tab = q; history.replaceState(null, '', '#/timer'); }
    el.innerHTML = seg([['study', '공부 타이머'], ['pomo', '뽀모도로'], ['stats', '통계']], tab) +
      `<div data-body>${tab === 'study' ? renderStudy() : tab === 'pomo' ? renderPomo() : renderStats()}</div>`;
    const re = () => this.render(el);

    el.onclick = async (e) => {
      const t = e.target;
      const segB = t.closest('[data-seg]');
      if (segB) { tab = segB.dataset.seg; return re(); }
      const sm = t.closest('[data-smode]');
      if (sm) { statMode = sm.dataset.smode; return re(); }
      const sk = t.closest('[data-skind]'); if (sk) { statKind = sk.dataset.skind; return re(); }
      const mp = t.closest('[data-mode-pick]'); if (mp) { T.studySetMode(mp.dataset.modePick); return re(); }
      const subj = t.closest('[data-subj]');
      if (subj) {
        if (state.run.study) T.studySetSubject(subj.dataset.subj);
        else { state.profile.lastSubject = subj.dataset.subj; save(); }
        return re();
      }
      const ps = t.closest('[data-psubj]');
      if (ps) { T.pomo().subject = ps.dataset.psubj; save(); return re(); }
      const ph = t.closest('[data-phase]');
      if (ph) { T.pomoSetPhase(ph.dataset.phase); return re(); }
      const nav = t.closest('[data-nav]');
      if (nav) {
        const n = Number(nav.dataset.nav);
        if (n === 0) anchor = selDay = today();
        else if (statMode === 'week') { anchor = addDays(anchor, 7 * n); selDay = startOfWeek(anchor); }
        else { const a = parseYmd(anchor); anchor = ymd(new Date(a.getFullYear(), a.getMonth() + n, 1)); selDay = anchor; }
        return re();
      }
      const day = t.closest('[data-day]');
      if (day) { selDay = day.dataset.day; return re(); }
      const del = t.closest('[data-del-session]');
      if (del) {
        if (await confirmBox('이 공부 기록을 삭제할까요?', '삭제')) { state.sessions = state.sessions.filter((s) => s.id !== del.dataset.delSession); save(); re(); }
        return;
      }
      const a = t.closest('[data-act]')?.dataset.act;
      if (!a) return;
      if (a === 'toggle') T.studyRunning() ? T.studyPause() : T.studyStart();
      if (a === 'stop') { const s = T.studyStop(); toast(s >= 10 ? `${fmtDur(s)} 저장했어요 ` : '10초 미만은 저장되지 않아요'); }
      if (a === 'focus') { if (!state.run.study) T.studyStart(); else if (!T.studyRunning()) T.studyStart(); openFocus('study'); }
      if (a === 'manual') return addManual(re);
      if (a === 'ptoggle') { T.pomoRunning() ? T.pomoPause() : T.pomoStart(); if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); }
      if (a === 'preset') T.pomoReset();
      if (a === 'pskip') T.pomoSkip();
      if (a === 'pfocus') { T.pomoStart(); openFocus('pomo'); }
      re();
    };
    el.onchange = (e) => {
      const f = e.target.closest('[data-form=pomo]');
      if (!f) return;
      const c = state.pomoCfg;
      for (const k of ['focus', 'short', 'long', 'every']) { const v = Math.round(Number(f[k].value)); if (v > 0) c[k] = v; }
      c.autoStart = f.autoStart.checked; c.sound = f.sound.checked;
      const p = T.pomo();
      if (!p.running) T.pomoReset();
      save(); re();
    };

    if (tickFn) removeEventListener('tick', tickFn);
    tickFn = () => {
      const c = el.querySelector('[data-clock]');
      if (c) {
        c.textContent = fmtClock(T.studyElapsed());
        const td = el.querySelector('[data-today]'); if (td) td.textContent = fmtDur(T.secOnDate(today()));
        const sf = el.querySelector('[data-self]'); if (sf) sf.textContent = fmtDur(T.selfSecOnDate(today()));
        const gp = el.querySelector('[data-goalp]'); if (gp) gp.style.width = `${Math.min(100, (T.selfSecOnDate(today()) / (state.profile.goalMinutes * 60)) * 100)}%`;
      }
      const pc = el.querySelector('[data-pclock]');
      if (pc) { const rem = T.pomoRemaining(); pc.textContent = fmtMS(rem); setRing(el.querySelector('.ring-wrap'), 1 - rem / T.pomoTotal()); }
    };
    addEventListener('tick', tickFn);
  },
  onData() { this.render(document.getElementById('main')); },
  destroy() { if (tickFn) removeEventListener('tick', tickFn); tickFn = null; },
};
