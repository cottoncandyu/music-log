import { state, save, diaryOf } from '../store.js';
import { esc, today, fmtDate, addDays, parseYmd, ymd, resizeImage, debounce } from '../util.js';
import { createDrawPad } from '../drawpad.js';
import { toast, confirmBox, modal } from '../ui.js';

const MOODS = [['😆', '최고'], ['🙂', '좋음'], ['😐', '보통'], ['😔', '우울'], ['😢', '슬픔'], ['😡', '화남'], ['😴', '피곤'], ['🥰', '설렘']];
const WEATHERS = [['☀️', '맑음'], ['⛅', '구름 조금'], ['☁️', '흐림'], ['🌧️', '비'], ['⛈️', '천둥'], ['❄️', '눈'], ['🌫️', '안개'], ['🌈', '무지개']];

let date = today();
let view = 'write';
let month = today().slice(0, 7);

function calendar() {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1), last = new Date(y, m, 0).getDate();
  const lead = first.getDay();
  const cells = [];
  for (let i = 1; i <= last; i++) {
    const d = ymd(new Date(y, m - 1, i));
    const e = state.diaries[d];
    cells.push(`<button class="day ${d === today() ? 'today' : ''} ${d === date ? 'sel' : ''}" data-day="${d}">
      <span class="d">${i}</span><span class="e">${e?.mood || (e && (e.text || e.drawing) ? '📝' : '')}</span><span class="v">${e?.weather || ''}</span></button>`);
  }
  const written = Object.keys(state.diaries).filter((k) => k.startsWith(month) && hasContent(state.diaries[k])).length;
  const moodCount = {};
  Object.entries(state.diaries).forEach(([k, v]) => { if (k.startsWith(month) && v.mood) moodCount[v.mood] = (moodCount[v.mood] || 0) + 1; });
  const songs = Object.entries(state.diaries).filter(([k, v]) => k.startsWith(month) && v.song?.title).sort();
  return `<div class="date-nav"><button class="btn sm" data-mnav="-1">‹</button><span class="label">${y}년 ${m}월</span><button class="btn sm" data-mnav="1">›</button></div>
    <div class="grid two">
      <div class="card"><div class="cal">${['일', '월', '화', '수', '목', '금', '토'].map((w) => `<div class="wd">${w}</div>`).join('')}
        ${'<div class="day out"></div>'.repeat(lead)}${cells.join('')}</div></div>
      <div class="stack">
        <div class="card"><h3>이달의 기록</h3><div class="stats"><div class="stat"><b>${written}일</b><span>작성</span></div></div>
          <div class="row mt" style="font-size:22px">${Object.entries(moodCount).sort((a, b) => b[1] - a[1]).map(([e, n]) => `<span>${e}<sub class="small muted">${n}</sub></span>`).join(' ') || '<span class="small muted">기분 기록이 없어요</span>'}</div></div>
        <div class="card"><h3>🎵 이달의 노래</h3>${songs.length ? `<ul class="list">${songs.map(([k, v]) => `<li><span class="muted small" style="width:44px">${Number(k.slice(8))}일</span><span class="txt">${esc(v.song.title)}${v.song.artist ? ` <span class="muted">- ${esc(v.song.artist)}</span>` : ''}</span></li>`).join('')}</ul>` : '<div class="empty">기록된 노래가 없어요</div>'}</div>
      </div>
    </div>`;
}

const songLinks = (q) => `<a class="btn sm" target="_blank" rel="noopener" href="https://music.youtube.com/search?q=${q}">▶ YouTube Music에서 듣기</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.melon.com/search/total/index.htm?q=${q}">멜론에서 찾기</a>`;

const hasContent = (d) => d && (d.mood || d.weather || d.text || d.drawing || d.song?.title || d.photos?.length || d.stickers?.length || d.grateful?.some(Boolean));

function writer() {
  const d = diaryOf(date) || { mood: '', weather: '', song: { title: '', artist: '' }, grateful: ['', '', ''], text: '', photos: [] };
  const q = encodeURIComponent(`${d.song?.title || ''} ${d.song?.artist || ''}`.trim());
  return `<div class="date-nav"><button class="btn sm" data-nav="-1">‹</button><span class="label">${fmtDate(date)}</span><button class="btn sm" data-nav="1">›</button>
      ${date !== today() ? '<button class="btn sm ghost" data-nav="0">오늘</button>' : ''}<span class="spacer"></span>
      ${hasContent(d) ? '<button class="btn sm danger" data-act="delete">삭제</button>' : ''}</div>
    <div class="grid two">
      <div class="stack">
        <div class="card"><h3>오늘의 기분</h3><div class="emoji-pick">${MOODS.map(([e, l]) => `<button data-mood="${e}" class="${d.mood === e ? 'on' : ''}" title="${l}">${e}</button>`).join('')}</div></div>
        <div class="card"><h3>오늘의 날씨</h3><div class="emoji-pick">${WEATHERS.map(([e, l]) => `<button data-weather="${e}" class="${d.weather === e ? 'on' : ''}" title="${l}">${e}</button>`).join('')}</div></div>
        <div class="card"><h3>🎵 오늘의 노래</h3>
          <div class="row nowrap"><input type="text" data-f="song.title" value="${esc(d.song?.title)}" placeholder="노래 제목"><input type="text" data-f="song.artist" value="${esc(d.song?.artist)}" placeholder="가수"></div>
          <div class="row mt" data-songlinks ${q ? '' : 'hidden'}>${songLinks(q)}</div>
        </div>
        <div class="card"><h3>🙏 감사 일기</h3><div class="form">${[0, 1, 2].map((i) => `<input type="text" data-g="${i}" value="${esc(d.grateful?.[i])}" placeholder="${i + 1}. 오늘 감사한 일">`).join('')}</div></div>
      </div>
      <div class="stack">
        <div class="card"><h3>✍️ 일기</h3><textarea class="diary-text" data-f="text" placeholder="오늘 하루는 어땠나요?">${esc(d.text)}</textarea></div>
        <div class="card"><h3>📷 사진 <span class="right tiny muted">${d.photos?.length || 0}장</span></h3>
          <div class="photos">${(d.photos || []).map((p, i) => `<div class="ph"><img src="${p}" alt="" data-view="${i}"><button class="x" data-delphoto="${i}" aria-label="삭제">✕</button></div>`).join('')}
            <label class="add" style="display:flex;align-items:center;justify-content:center">＋<input type="file" accept="image/*" multiple data-photo hidden></label></div></div>
      </div>
    </div>
    <div class="card mt"><h3>🎨 꾸미기 페이지 <span class="right tiny muted">손글씨 · 형광펜 · 스티커</span></h3><div data-pad></div></div>`;
}

export default {
  render(el) {
    el.innerHTML = `<div class="row">${`<div class="seg"><button data-seg="write" class="${view === 'write' ? 'on' : ''}">📝 쓰기</button><button data-seg="cal" class="${view === 'cal' ? 'on' : ''}">📅 달력</button></div>`}</div>` +
      (view === 'write' ? writer() : calendar());
    const re = () => this.render(el);
    const get = () => diaryOf(date, true);
    const persist = debounce(() => save(), 300);

    if (view === 'write') {
      const d0 = diaryOf(date);
      createDrawPad(el.querySelector('[data-pad]'), {
        drawing: d0?.drawing || '', stickers: d0?.stickers || [],
        onChange: ({ drawing, stickers }) => { const d = get(); d.drawing = drawing; d.stickers = stickers; save(); },
      });
    }

    el.onclick = async (e) => {
      const t = e.target;
      const sg = t.closest('[data-seg]'); if (sg) { view = sg.dataset.seg; if (view === 'cal') month = date.slice(0, 7); return re(); }
      const nav = t.closest('[data-nav]');
      if (nav) { const n = Number(nav.dataset.nav); date = n === 0 ? today() : addDays(date, n); return re(); }
      const mn = t.closest('[data-mnav]');
      if (mn) { const [y, m] = month.split('-').map(Number); month = ymd(new Date(y, m - 1 + Number(mn.dataset.mnav), 1)).slice(0, 7); return re(); }
      const day = t.closest('[data-day]'); if (day) { date = day.dataset.day; view = 'write'; return re(); }
      const mood = t.closest('[data-mood]');
      if (mood) { const d = get(); d.mood = d.mood === mood.dataset.mood ? '' : mood.dataset.mood; save(); el.querySelectorAll('[data-mood]').forEach((b) => b.classList.toggle('on', b.dataset.mood === d.mood)); return; }
      const w = t.closest('[data-weather]');
      if (w) { const d = get(); d.weather = d.weather === w.dataset.weather ? '' : w.dataset.weather; save(); el.querySelectorAll('[data-weather]').forEach((b) => b.classList.toggle('on', b.dataset.weather === d.weather)); return; }
      const dp = t.closest('[data-delphoto]');
      if (dp) { if (await confirmBox('사진을 삭제할까요?', '삭제')) { get().photos.splice(Number(dp.dataset.delphoto), 1); save(); re(); } return; }
      const v = t.closest('[data-view]');
      if (v) { modal(`<img src="${get().photos[Number(v.dataset.view)]}" alt="" style="width:100%;border-radius:12px;display:block"><div class="actions"><button class="btn primary" data-close>닫기</button></div>`, { wide: true }); return; }
      if (t.closest('[data-act=delete]')) {
        if (await confirmBox(`${fmtDate(date)} 다이어리를 모두 지울까요?`, '삭제')) { delete state.diaries[date]; save(); re(); }
      }
    };
    el.oninput = (e) => {
      const f = e.target.dataset.f, g = e.target.dataset.g;
      if (!f && g == null) return;
      const d = get();
      if (f === 'text') d.text = e.target.value;
      if (f === 'song.title') d.song.title = e.target.value;
      if (f === 'song.artist') d.song.artist = e.target.value;
      if (g != null) { d.grateful = d.grateful || ['', '', '']; d.grateful[Number(g)] = e.target.value; }
      if (f && f.startsWith('song')) {
        const q = encodeURIComponent(`${d.song.title} ${d.song.artist}`.trim());
        const box = el.querySelector('[data-songlinks]');
        box.hidden = !q; box.innerHTML = songLinks(q);
      }
      persist();
    };
    el.onchange = async (e) => {
      if (!e.target.matches('[data-photo]')) return;
      const files = [...e.target.files];
      if (!files.length) return;
      toast('사진을 넣는 중…');
      const d = get();
      for (const f of files) { try { d.photos.push(await resizeImage(f, 1280, 0.82)); } catch { toast('사진을 읽지 못했어요'); } }
      save(); re();
    };
  },
};
