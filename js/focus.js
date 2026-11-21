// 집중 화면: 화면을 켜둔 채 공부할 수 있는 전체화면 시계 (화면 꺼짐 방지)
import { state } from './store.js';
import { icon } from './icons.js';
import { fmtClock, fmtMS, fmtDur, pad, today } from './util.js';
import * as T from './timers.js';

let wakeLock = null;
async function lockScreen() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch { wakeLock = null; }
}
function onVis() { if (document.visibilityState === 'visible' && document.querySelector('.focus')) lockScreen(); }

export function openFocus(mode = 'study') {
  if (document.querySelector('.focus')) return;
  const el = document.createElement('div');
  el.className = 'focus';
  el.innerHTML = `
    <div class="now num" data-now></div>
    <div class="clock" data-clock>00:00:00</div>
    <div class="label" data-label></div>
    <div class="progress" data-prog hidden><i style="width:0"></i></div>
    <div class="ctrl">
      <button class="btn lg" data-act="toggle">시작/일시정지</button>
      ${mode === 'study' ? `<button class="btn lg" data-act="stop">${icon('stop', 18)} 종료·저장</button>` : '<button class="btn lg" data-act="skip">건너뛰기</button>'}
      <button class="btn lg" data-act="dim">어둡게</button>
      <button class="btn lg" data-act="close">닫기</button>
    </div>
    <div class="tiny" style="opacity:.4;margin-top:14px">화면을 탭하면 버튼이 숨겨져요</div>`;
  document.body.appendChild(el);
  lockScreen();
  document.addEventListener('visibilitychange', onVis);
  try { (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); } catch { /* iPhone Safari 미지원 */ }

  const $ = (s) => el.querySelector(s);
  const update = () => {
    const d = new Date();
    $('[data-now]').textContent = `${d.getMonth() + 1}/${d.getDate()}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (mode === 'study') {
      const r = state.run.study;
      $('[data-clock]').textContent = fmtClock(T.studyElapsed());
      $('[data-label]').textContent = `${r ? r.subject : '대기 중'} · 오늘 총 ${fmtDur(T.secOnDate(today()))}${r && !r.running ? ' · 일시정지' : ''}`;
    } else {
      const p = T.pomo();
      const rem = T.pomoRemaining();
      $('[data-clock]').textContent = fmtMS(rem);
      $('[data-label]').textContent = `${T.PHASE_LABEL[p.phase]} · ${p.subject} · ${p.count}회 완료${p.running ? '' : ' · 일시정지'}`;
      const prog = $('[data-prog]'); prog.hidden = false;
      prog.firstElementChild.style.width = `${(1 - rem / T.pomoTotal()) * 100}%`;
    }
  };
  update();
  const iv = setInterval(update, 500);

  const close = () => {
    clearInterval(iv);
    document.removeEventListener('visibilitychange', onVis);
    try { wakeLock && wakeLock.release(); } catch { /* noop */ }
    wakeLock = null;
    try { if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch { /* noop */ }
    el.remove();
    window.dispatchEvent(new Event('datachange'));
  };

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) { el.classList.toggle('hide-ctrl'); return; }
    const a = b.dataset.act;
    if (a === 'close') return close();
    if (a === 'dim') return el.classList.toggle('dim');
    if (mode === 'study') {
      if (a === 'toggle') T.studyRunning() ? T.studyPause() : T.studyStart();
      if (a === 'stop') { T.studyStop(); return close(); }
    } else {
      if (a === 'toggle') T.pomoRunning() ? T.pomoPause() : T.pomoStart();
      if (a === 'skip') T.pomoSkip();
    }
    update();
  });
}
