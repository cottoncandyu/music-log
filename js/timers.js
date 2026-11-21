// 공부 타이머 + 뽀모도로 엔진. 시작 시각을 저장하므로 앱을 닫았다 열어도 이어집니다.
import { state, save } from './store.js';
import { uid, ymd, today } from './util.js';
import { toast } from './ui.js';

// ---------- 소리 ----------
let actx = null;
export function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch { /* noop */ }
}
export function chime(times = 3) {
  if (!state.pomoCfg.sound || !actx) return;
  const t0 = actx.currentTime;
  for (let i = 0; i < times; i++) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = i % 2 ? 660 : 880;
    g.gain.setValueAtTime(0.0001, t0 + i * 0.35);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + i * 0.35 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.35 + 0.3);
    o.connect(g).connect(actx.destination);
    o.start(t0 + i * 0.35); o.stop(t0 + i * 0.35 + 0.32);
  }
}
function alertUser(msg) {
  chime();
  toast(msg, 4000);
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch { /* noop */ }
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
      new Notification('공부책상', { body: msg, icon: 'icons/icon-192.png' });
    }
  } catch { /* iOS 일부 버전 미지원 */ }
}

// ---------- 공부 타이머(스톱워치) ----------
export function studyElapsed() {
  const s = state.run.study;
  if (!s) return 0;
  return s.acc + (s.running ? (Date.now() - s.since) / 1000 : 0);
}
export const studyRunning = () => !!(state.run.study && state.run.study.running);

export const defaultSubject = () =>
  (state.subjects.some((s) => s.name === state.profile.lastSubject) ? state.profile.lastSubject : state.subjects[0]?.name) || '기타';

export function studyStart(subject) {
  unlockAudio();
  const now = Date.now();
  const s = state.run.study;
  if (!s) state.run.study = { subject: subject || defaultSubject(), firstStart: now, acc: 0, running: true, since: now };
  else if (!s.running) { s.running = true; s.since = now; if (subject) s.subject = subject; }
  save();
}
export function studyPause() {
  const s = state.run.study;
  if (!s || !s.running) return;
  s.acc += (Date.now() - s.since) / 1000; s.running = false;
  save();
}
export function studySetSubject(subject) {
  if (state.run.study) { state.run.study.subject = subject; save(); }
}
/** 종료 후 기록 저장. 저장된 초를 반환 */
export function studyStop() {
  const s = state.run.study;
  if (!s) return 0;
  const sec = Math.round(studyElapsed());
  if (sec >= 10) {
    state.sessions.push({ id: uid(), subject: s.subject, start: s.firstStart, sec, date: ymd(new Date(s.firstStart)), kind: 'timer' });
  }
  state.profile.lastSubject = s.subject;
  state.run.study = null;
  save();
  return sec;
}

// ---------- 뽀모도로 ----------
const phaseLen = (phase) => (phase === 'focus' ? state.pomoCfg.focus : phase === 'short' ? state.pomoCfg.short : state.pomoCfg.long) * 60;
export const PHASE_LABEL = { focus: '집중', short: '짧은 휴식', long: '긴 휴식' };

export function pomo() {
  if (!state.run.pomo) state.run.pomo = { phase: 'focus', running: false, endsAt: 0, remain: phaseLen('focus'), count: 0, countDate: today(), subject: state.subjects[0]?.name || '기타' };
  const p = state.run.pomo;
  if (p.countDate !== today()) { p.count = 0; p.countDate = today(); }
  return p;
}
export const pomoRunning = () => !!(state.run.pomo && state.run.pomo.running);
export function pomoRemaining() {
  const p = pomo();
  return p.running ? Math.max(0, (p.endsAt - Date.now()) / 1000) : p.remain;
}
export const pomoTotal = () => phaseLen(pomo().phase);

export function pomoStart() {
  unlockAudio();
  const p = pomo();
  if (p.running) return;
  p.running = true; p.endsAt = Date.now() + p.remain * 1000;
  save();
}
export function pomoPause() {
  const p = pomo();
  if (!p.running) return;
  p.remain = pomoRemaining(); p.running = false;
  save();
}
export function pomoReset() {
  const p = pomo();
  p.running = false; p.remain = phaseLen(p.phase);
  save();
}
export function pomoSetPhase(phase) {
  const p = pomo();
  p.phase = phase; p.running = false; p.remain = phaseLen(phase);
  save();
}
export function pomoSkip() { advance(false); }

function advance(completed) {
  const p = pomo();
  let next;
  if (p.phase === 'focus') {
    if (completed) {
      const sec = phaseLen('focus');
      const start = p.endsAt - sec * 1000;
      state.sessions.push({ id: uid(), subject: p.subject, start, sec, date: ymd(new Date(start)), kind: 'pomo' });
      p.count++;
    }
    next = completed && p.count % state.pomoCfg.every === 0 ? 'long' : 'short';
  } else next = 'focus';
  const endedAt = p.endsAt;
  p.phase = next; p.remain = phaseLen(next);
  p.running = completed && state.pomoCfg.autoStart;
  if (p.running) p.endsAt = Math.max(Date.now(), endedAt) + p.remain * 1000;
  save();
  window.dispatchEvent(new Event('datachange'));
  if (completed) alertUser(next === 'focus' ? '휴식 끝! 다시 집중해볼까요? 💪' : `🍅 집중 완료! ${PHASE_LABEL[next]} 시간이에요`);
}

/** 1초마다 호출 */
export function tick() {
  const p = state.run.pomo;
  if (p && p.running && Date.now() >= p.endsAt) advance(true);
}

// ---------- 집계 ----------
export function secOnDate(date, subject) {
  let sum = 0;
  for (const s of state.sessions) if (s.date === date && (!subject || s.subject === subject)) sum += s.sec;
  const r = state.run.study;
  if (r && ymd(new Date(r.firstStart)) === date && (!subject || r.subject === subject)) sum += studyElapsed();
  return sum;
}
export function sessionsBetween(from, to) {
  return state.sessions.filter((s) => s.date >= from && s.date <= to);
}
export function bySubject(sessions) {
  const m = {};
  for (const s of sessions) m[s.subject] = (m[s.subject] || 0) + s.sec;
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
export const pomoCountOn = (date) => state.sessions.filter((s) => s.date === date && s.kind === 'pomo').length;
