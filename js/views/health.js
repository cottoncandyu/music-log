// 운동 · 몸무게 · 기상/취침 기록
import { state, save } from '../store.js';
import { esc, today, fmtDate, addDays, uid, startOfWeek, WEEK, parseYmd } from '../util.js';
import { lineChart, barChart } from '../charts.js';
import { toast } from '../ui.js';

const TYPES = ['🚶 걷기', '🏃 러닝', '🏋️ 헬스', '🧘 요가', '🤸 필라테스', '🏊 수영', '🚴 자전거', '🏠 홈트', '⛹️ 구기', '🧗 기타'];
let date = today();
let wType = TYPES[0];

const toMin = (hm) => { if (!hm) return null; const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const hm = (min) => `${String(Math.floor(((min % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(Math.round(((min % 60) + 60) % 60)).padStart(2, '0')}`;

/** date의 기상시각 - 전날 취침시각 (취침이 자정 이후면 같은 날 새벽으로 간주) */
function sleepHours(d) {
  const wake = toMin(state.sleeps[d]?.wake);
  const bed = toMin(state.sleeps[addDays(d, -1)]?.bed);
  if (wake == null || bed == null) return null;
  let dur = wake + 1440 - bed;
  if (bed < 12 * 60) dur = wake - bed; // 전날 '취침' 입력이 새벽(예 01:30)이면 같은 밤
  if (dur <= 0 || dur > 20 * 60) return null;
  return Math.round((dur / 60) * 10) / 10;
}

export default {
  render(el) {
    const sl = state.sleeps[date] || {};
    const w = state.weights[date];
    const prevW = Object.keys(state.weights).filter((k) => k < date).sort().pop();
    const diff = w != null && prevW ? Math.round((w - state.weights[prevW]) * 10) / 10 : null;
    const ws = state.workouts.filter((x) => x.date === date);
    const goal = state.profile.goalWeight;

    const wKeys = Object.keys(state.weights).sort().slice(-30);
    const wPoints = wKeys.map((k) => ({ label: `${Number(k.slice(5, 7))}/${Number(k.slice(8))}`, value: state.weights[k] }));
    const days14 = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
    const wakePts = days14.map((d) => ({ label: `${parseYmd(d).getDate()}`, value: toMin(state.sleeps[d]?.wake) }));
    const sleepBars = days14.map((d) => ({ label: `${parseYmd(d).getDate()}`, value: sleepHours(d) || 0, hi: d === date }));
    const wakeVals = wakePts.map((p) => p.value).filter((v) => v != null);
    const avgWake = wakeVals.length ? Math.round(wakeVals.reduce((a, b) => a + b, 0) / wakeVals.length) : null;
    const sv = sleepBars.map((b) => b.value).filter(Boolean);
    const avgSleep = sv.length ? (sv.reduce((a, b) => a + b, 0) / sv.length).toFixed(1) : null;
    const wk = startOfWeek(date);
    const weekBars = Array.from({ length: 7 }, (_, i) => { const d = addDays(wk, i); return { label: WEEK[parseYmd(d).getDay()], value: state.workouts.filter((x) => x.date === d).reduce((a, b) => a + Number(b.min || 0), 0), hi: d === date }; });

    el.innerHTML = `
      <div class="date-nav"><button class="btn sm" data-nav="-1">‹</button><span class="label">${fmtDate(date)}</span><button class="btn sm" data-nav="1">›</button>
        ${date !== today() ? '<button class="btn sm ghost" data-nav="0">오늘</button>' : ''}</div>
      <div class="grid">
        <div class="card"><h3>⏰ 기상 · 취침</h3>
          <div class="row nowrap"><label class="field"><span>기상 시간</span><input type="time" data-sleep="wake" value="${sl.wake || ''}"></label>
          <label class="field"><span>취침 시간 (이날 밤)</span><input type="time" data-sleep="bed" value="${sl.bed || ''}"></label></div>
          <div class="row mt"><button class="btn sm soft" data-act="wakenow">☀️ 지금 일어났어요</button><button class="btn sm soft" data-act="bednow">🌙 지금 잘게요</button></div>
          <div class="small muted mt">${sleepHours(date) != null ? `지난밤 수면 <b style="color:var(--text)">${sleepHours(date)}시간</b>` : '전날 취침 + 오늘 기상을 입력하면 수면 시간이 계산돼요'}</div>
        </div>
        <div class="card"><h3>⚖️ 몸무게</h3>
          <div class="row nowrap"><input type="number" step="0.1" min="20" max="300" inputmode="decimal" data-weight value="${w ?? ''}" placeholder="kg"><span>kg</span></div>
          <div class="small muted mt">${diff != null ? `지난 기록 대비 <b style="color:${diff > 0 ? 'var(--bad)' : 'var(--good)'}">${diff > 0 ? '+' : ''}${diff}kg</b>` : ''}
            ${goal ? ` · 목표 ${goal}kg${w != null ? `까지 ${Math.round((w - goal) * 10) / 10}kg` : ''}` : ''}</div>
          <div class="row nowrap mt"><label class="field"><span>목표 체중</span><input type="number" step="0.1" data-goalw value="${goal ?? ''}" placeholder="선택"></label></div>
        </div>
        <div class="card"><h3>🏃 운동 <span class="right small muted">${ws.reduce((a, b) => a + Number(b.min || 0), 0)}분</span></h3>
          <div class="chips mb">${TYPES.map((t) => `<button class="chip ${t === wType ? 'on' : ''}" data-type="${t}">${t}</button>`).join('')}</div>
          <form class="form" data-form="wo"><div class="row nowrap"><input type="number" name="min" min="1" placeholder="분" style="max-width:90px" inputmode="numeric">
            <input type="text" name="memo" placeholder="메모 (예: 하체, 5km)"><button class="btn primary">추가</button></div></form>
          ${ws.length ? `<ul class="list mt">${ws.map((x) => `<li><span class="txt">${esc(x.type)} <b>${x.min}분</b> <span class="muted small">${esc(x.memo)}</span></span><button class="icon-btn" data-delwo="${x.id}">🗑</button></li>`).join('')}</ul>` : ''}
        </div>
      </div>
      <div class="grid two mt">
        <div class="card"><h3>⚖️ 몸무게 변화 <span class="right tiny muted">최근 ${wKeys.length}회</span></h3>${lineChart(wPoints, { fmt: (v) => v, goal })}</div>
        <div class="card"><h3>☀️ 기상 시간 (최근 14일) <span class="right tiny muted">${avgWake != null ? '평균 ' + hm(avgWake) : ''}</span></h3>${lineChart(wakePts, { fmt: hm, invert: true, color: '#e3b341' })}</div>
        <div class="card"><h3>😴 수면 시간 <span class="right tiny muted">${avgSleep ? '평균 ' + avgSleep + '시간' : ''}</span></h3>${barChart(sleepBars, { fmt: (v) => v + 'h', color: '#8a7be0' })}</div>
        <div class="card"><h3>🏃 이번 주 운동 <span class="right tiny muted">총 ${weekBars.reduce((a, b) => a + b.value, 0)}분</span></h3>${barChart(weekBars, { fmt: (v) => v + '분', color: 'var(--good)' })}</div>
      </div>`;

    const re = () => this.render(el);
    const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    el.onclick = (e) => {
      const t = e.target;
      const nav = t.closest('[data-nav]');
      if (nav) { const n = Number(nav.dataset.nav); date = n === 0 ? today() : addDays(date, n); return re(); }
      const ty = t.closest('[data-type]'); if (ty) { wType = ty.dataset.type; el.querySelectorAll('[data-type]').forEach((b) => b.classList.toggle('on', b === ty)); return; }
      const dw = t.closest('[data-delwo]'); if (dw) { state.workouts = state.workouts.filter((x) => x.id !== dw.dataset.delwo); save(); return re(); }
      const a = t.closest('[data-act]')?.dataset.act;
      if (a === 'wakenow') { date = today(); (state.sleeps[date] = state.sleeps[date] || {}).wake = now(); save(); toast('좋은 아침이에요 ☀️'); re(); }
      if (a === 'bednow') {
        // 자정~정오 사이에 누르면 전날 밤 취침으로 기록
        const d = new Date().getHours() < 12 ? addDays(today(), -1) : today();
        (state.sleeps[d] = state.sleeps[d] || {}).bed = now(); save(); toast('좋은 꿈 꾸세요 🌙'); re();
      }
    };
    el.onchange = (e) => {
      const t = e.target;
      if (t.dataset.sleep) { const s = (state.sleeps[date] = state.sleeps[date] || {}); s[t.dataset.sleep] = t.value; save(); re(); }
      if (t.matches('[data-weight]')) { const v = parseFloat(t.value); if (isNaN(v)) delete state.weights[date]; else state.weights[date] = Math.round(v * 10) / 10; save(); re(); }
      if (t.matches('[data-goalw]')) { const v = parseFloat(t.value); state.profile.goalWeight = isNaN(v) ? null : v; save(); re(); }
    };
    el.onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const min = Number(f.min.value);
      if (!(min > 0)) return toast('운동 시간을 입력해주세요');
      state.workouts.push({ id: uid(), date, type: wType, min, memo: f.memo.value.trim() });
      save(); re();
    };
  },
};
