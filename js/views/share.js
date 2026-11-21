// 오늘의 기록 카드 공유 + 친구 기록 모아보기 (서버 없이 공유 코드로 주고받기)
import { state, save, mainDday } from '../store.js';
import { esc, today, fmtDate, fmtDur, ddayLabel, uid, canvasToBlob, shareOrDownload, b64encode, b64decode, wrapText } from '../util.js';
import { secOnDate, pomoCountOn, bySubject } from '../timers.js';
import { toast, confirmBox } from '../ui.js';

const OPTS = [['study', '공부 시간'], ['todo', '할 일'], ['mood', '기분·날씨'], ['song', '오늘의 노래'], ['grateful', '감사 일기'], ['workout', '운동'], ['wake', '기상 시간'], ['weight', '몸무게'], ['dday', '디데이']];
let on = { study: true, todo: true, mood: true, song: true, grateful: false, workout: true, wake: true, weight: false, dday: true };
let comment = '';

function summary() {
  const t = today();
  const d = state.diaries[t] || {};
  const todos = state.todos.filter((x) => x.date === t);
  const dd = mainDday();
  const s = { v: 1, name: state.profile.name || '익명', date: t, c: comment };
  if (on.study) { s.study = Math.round(secOnDate(t)); s.pomo = pomoCountOn(t); s.subj = bySubject(state.sessions.filter((x) => x.date === t)).slice(0, 3).map(([n, sec]) => [n, sec]); }
  if (on.todo) { s.todo = [todos.filter((x) => x.done).length, todos.length]; }
  if (on.mood) { s.mood = d.mood || ''; s.weather = d.weather || ''; }
  if (on.song && d.song?.title) s.song = `${d.song.title}${d.song.artist ? ' - ' + d.song.artist : ''}`;
  if (on.grateful) s.grat = (d.grateful || []).filter(Boolean);
  if (on.workout) { const w = state.workouts.filter((x) => x.date === t); s.wo = [w.reduce((a, b) => a + Number(b.min || 0), 0), [...new Set(w.map((x) => x.type))].join(', ')]; }
  if (on.wake && state.sleeps[t]?.wake) s.wake = state.sleeps[t].wake;
  if (on.weight && state.weights[t] != null) s.kg = state.weights[t];
  if (on.dday && dd) s.dday = [dd.title, ddayLabel(dd.date)];
  return s;
}

function lines(s) {
  const out = [];
  if (s.dday) out.push(`📅 ${s.dday[0]} ${s.dday[1]}`);
  if (s.study != null) out.push(`⏱ 공부 ${fmtDur(s.study)}${s.pomo ? ` · 🍅 ${s.pomo}` : ''}${s.subj?.length ? ` (${s.subj.map(([n, sec]) => `${n} ${fmtDur(sec)}`).join(', ')})` : ''}`);
  if (s.todo) out.push(`✅ 할 일 ${s.todo[0]}/${s.todo[1]}`);
  if (s.mood || s.weather) out.push(`${s.mood || ''}${s.weather ? ' ' + s.weather : ''} 오늘의 기분`);
  if (s.song) out.push(`🎵 ${s.song}`);
  if (s.grat?.length) out.push(`🙏 ${s.grat.join(' / ')}`);
  if (s.wo && s.wo[0]) out.push(`🏃 운동 ${s.wo[0]}분${s.wo[1] ? ' · ' + s.wo[1] : ''}`);
  if (s.wake) out.push(`☀️ 기상 ${s.wake}`);
  if (s.kg != null) out.push(`⚖️ ${s.kg}kg`);
  return out;
}

const CODE_PREFIX = '#공부책상코드:';
const toCode = (s) => CODE_PREFIX + b64encode(JSON.stringify(s));
function fromText(text) {
  const m = text.match(/#공부책상코드:([A-Za-z0-9+/=]+)/);
  if (!m) return null;
  try { const s = JSON.parse(b64decode(m[1])); return s && s.date ? s : null; } catch { return null; }
}

async function drawCard(s) {
  const W = 1080, P = 80;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = (w, px) => `${w} ${px}px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
  ctx.font = font(500, 40);
  const ls = lines(s).flatMap((l) => wrapText(ctx, l, W - P * 2));
  ctx.font = font(500, 38);
  const cm = s.c ? wrapText(ctx, `“${s.c}”`, W - P * 2) : [];
  const H = Math.max(1080, 380 + ls.length * 70 + cm.length * 56 + 120);
  c.width = W; c.height = H;
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fff6ec'); g.addColorStop(1, '#fde0cf');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e47f52'; ctx.fillRect(0, 0, W, 16);
  ctx.fillStyle = '#8a7f70'; ctx.font = font(600, 36); ctx.fillText(fmtDate(s.date, true), P, 130);
  ctx.fillStyle = '#2f2a24'; ctx.font = font(800, 66); ctx.fillText(`${s.name}의 오늘 기록`, P, 220);
  let y = 330;
  ctx.font = font(500, 40);
  for (const l of ls) { ctx.fillText(l, P, y); y += 70; }
  if (cm.length) { y += 20; ctx.fillStyle = '#c0623c'; ctx.font = font(500, 38); for (const l of cm) { ctx.fillText(l, P, y); y += 56; } }
  ctx.fillStyle = '#b3a796'; ctx.font = font(600, 28); ctx.fillText('📚 공부책상', P, H - 60);
  return c;
}

export default {
  render(el) {
    const s = summary();
    const friends = state.friends.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.added || 0) - (a.added || 0));
    el.innerHTML = `
      <div class="grid two">
        <div class="card"><h3>📤 오늘의 기록 나누기</h3>
          <div class="chips mb">${OPTS.map(([k, l]) => `<button class="chip ${on[k] ? 'on' : ''}" data-opt="${k}">${l}</button>`).join('')}</div>
          <input type="text" data-comment value="${esc(comment)}" placeholder="한마디 (예: 오늘도 완주!)" maxlength="80">
          <div class="card mt" style="background:var(--surface2);box-shadow:none" data-preview>
            <div class="small muted">${fmtDate(s.date, true)}</div><b>${esc(s.name)}의 오늘 기록</b>
            <div class="small mt" style="white-space:pre-line">${esc(lines(s).join('\n')) || '<span class="muted">기록이 아직 없어요</span>'}</div>
            ${comment ? `<div class="small mt" style="color:var(--accent)">“${esc(comment)}”</div>` : ''}
          </div>
          <div class="row mt"><button class="btn primary" data-act="img">🖼 이미지로 공유</button><button class="btn" data-act="text">💬 텍스트+코드 공유</button></div>
          <p class="tiny muted mt">카톡·인스타·문자 등으로 보낼 수 있어요. 함께 쓰는 친구가 메시지를 통째로 아래에 붙여넣으면 피드에 추가돼요.</p>
        </div>
        <div class="card"><h3>👥 친구들의 기록</h3>
          <form class="form" data-form="import"><textarea name="code" placeholder="친구가 보낸 메시지를 그대로 붙여넣기" style="min-height:70px"></textarea>
            <button class="btn">＋ 피드에 추가</button></form>
          <hr>
          ${friends.length ? friends.map((f) => `
            <div class="friend mb"><div class="av">${esc((f.name || '?').slice(0, 1))}</div>
              <div class="body"><div class="row"><b>${esc(f.name)}</b><span class="tiny muted">${fmtDate(f.date)}</span><span class="spacer"></span><button class="icon-btn" data-delf="${f.id}">✕</button></div>
              <div class="lines">${lines(f).map((l) => `<span>${esc(l)}</span>`).join('')}</div>
              ${f.c ? `<div class="small mt" style="color:var(--accent)">“${esc(f.c)}”</div>` : ''}</div></div>`).join('')
          : '<div class="empty">친구가 보낸 기록이 여기에 모여요</div>'}
        </div>
      </div>
      <div class="card mt small muted"><b>ℹ️ 함께 기록하기 안내</b><br>
        이 앱은 개인정보 보호를 위해 모든 기록을 <b>내 기기에만</b> 저장해요. 친구와는 공유 코드가 들어간 메시지로 주고받아요.
        실시간 스터디 그룹(자동 동기화)이 필요하면 서버 연동(예: Firebase, Supabase)을 추가해야 해요.</div>`;

    const re = () => this.render(el);
    el.onclick = async (e) => {
      const o = e.target.closest('[data-opt]'); if (o) { on[o.dataset.opt] = !on[o.dataset.opt]; return re(); }
      const df = e.target.closest('[data-delf]');
      if (df) { if (await confirmBox('이 기록을 피드에서 지울까요?', '삭제')) { state.friends = state.friends.filter((x) => x.id !== df.dataset.delf); save(); re(); } return; }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'img') {
        const c = await drawCard(summary());
        const r = await shareOrDownload(await canvasToBlob(c), `today-${today()}.png`, '오늘의 기록');
        if (r === 'downloaded') toast('이미지를 저장했어요');
      }
      if (a === 'text') {
        const sm = summary();
        const text = `📚 ${sm.name}의 오늘 기록 (${fmtDate(sm.date)})\n${lines(sm).join('\n')}${sm.c ? `\n“${sm.c}”` : ''}\n\n${toCode(sm)}`;
        try {
          if (navigator.share) await navigator.share({ text });
          else { await navigator.clipboard.writeText(text); toast('복사했어요! 메신저에 붙여넣으세요'); }
        } catch (err) {
          if (err.name !== 'AbortError') { try { await navigator.clipboard.writeText(text); toast('복사했어요!'); } catch { toast('공유에 실패했어요'); } }
        }
      }
    };
    el.oninput = (e) => {
      if (!e.target.matches('[data-comment]')) return;
      comment = e.target.value;
    };
    el.onchange = (e) => { if (e.target.matches('[data-comment]')) re(); };
    el.onsubmit = (e) => {
      e.preventDefault();
      const s = fromText(e.target.code.value);
      if (!s) return toast('공유 코드를 찾지 못했어요');
      const dup = state.friends.find((f) => f.name === s.name && f.date === s.date);
      if (dup) Object.assign(dup, s, { added: Date.now() });
      else state.friends.push({ ...s, id: uid(), added: Date.now() });
      save(); toast(`${s.name}님의 기록을 추가했어요`); re();
    };
  },
};
