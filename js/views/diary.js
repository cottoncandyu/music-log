import { state, save, diaryOf } from '../store.js';
import { esc, today, fmtDate, addDays, ymd, debounce, uid } from '../util.js';
import { createDrawPad, migratePage } from '../drawpad.js';
import { toast, confirmBox, modal } from '../ui.js';
import { icon } from '../icons.js';
import { MOODS, WEATHERS, moodSvg, weatherSvg, moodId, weatherId, moodLabel, weatherLabel } from '../art.js';

let date = today();
let view = 'write';
let month = today().slice(0, 7);

const songLinks = (q) => `<a class="btn sm" target="_blank" rel="noopener" href="https://music.youtube.com/search?q=${q}">YouTube Music</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.melon.com/search/total/index.htm?q=${q}">멜론</a>`;
const hasContent = (d) => d && (d.mood || d.weather || d.text || d.drawing || d.song?.title || d.photos?.length || d.page?.strokes?.length || d.page?.items?.length || d.grateful?.some(Boolean));

function calendar() {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1), last = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 1; i <= last; i++) {
    const d = ymd(new Date(y, m - 1, i));
    const e = state.diaries[d];
    cells.push(`<button class="day ${d === today() ? 'today' : ''} ${d === date ? 'sel' : ''}" data-day="${d}">
      <span class="d">${i}</span><span class="art-ic">${e?.mood ? moodSvg(moodId(e.mood)) : hasContent(e) ? '<i class="dot" style="background:var(--accent)"></i>' : ''}</span></button>`);
  }
  const ds = Object.entries(state.diaries).filter(([k, v]) => k.startsWith(month) && hasContent(v));
  const moodCount = {};
  ds.forEach(([, v]) => { if (v.mood) { const id = moodId(v.mood); moodCount[id] = (moodCount[id] || 0) + 1; } });
  const songs = ds.filter(([, v]) => v.song?.title).sort();
  return `<div class="date-nav"><button class="btn sm" data-mnav="-1">${icon('left', 16)}</button><span class="label">${y}년 ${m}월</span><button class="btn sm" data-mnav="1">${icon('right', 16)}</button></div>
    <div class="grid two">
      <div class="card"><div class="cal">${['일', '월', '화', '수', '목', '금', '토'].map((w) => `<div class="wd">${w}</div>`).join('')}
        ${'<div class="day out"></div>'.repeat(first.getDay())}${cells.join('')}</div></div>
      <div class="stack">
        <div class="card"><h3>이달의 기분 <span class="right tiny muted">${ds.length}일 기록</span></h3>
          <div class="mood-sum">${Object.entries(moodCount).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<div><span class="art-ic lg">${moodSvg(id)}</span><span class="tiny">${moodLabel(id)} ${n}</span></div>`).join('') || '<span class="small muted">기분 기록이 없어요</span>'}</div></div>
        <div class="card"><h3>이달의 노래</h3>${songs.length ? `<ul class="list">${songs.map(([k, v]) => `<li><span class="muted small" style="width:40px">${Number(k.slice(8))}일</span><span class="txt">${esc(v.song.title)}${v.song.artist ? ` <span class="muted">- ${esc(v.song.artist)}</span>` : ''}</span></li>`).join('')}</ul>` : '<div class="empty">기록된 노래가 없어요</div>'}</div>
      </div>
    </div>`;
}

function writer() {
  const d = diaryOf(date) || { mood: '', weather: '', song: { title: '', artist: '' }, grateful: ['', '', ''], text: '', photos: [] };
  const mid = moodId(d.mood), wid = weatherId(d.weather);
  const q = encodeURIComponent(`${d.song?.title || ''} ${d.song?.artist || ''}`.trim());
  return `<div class="date-nav"><button class="btn sm" data-nav="-1">${icon('left', 16)}</button><span class="label">${fmtDate(date)}</span><button class="btn sm" data-nav="1">${icon('right', 16)}</button>
      ${date !== today() ? '<button class="btn sm ghost" data-nav="0">오늘</button>' : ''}<span class="spacer"></span>
      ${hasContent(d) ? `<button class="btn sm danger" data-act="delete">${icon('trash', 14)} 삭제</button>` : ''}</div>
    <div class="diary-layout">
      <div class="stack">
        <div class="card"><h3>오늘의 기분 <span class="right small muted" data-moodlabel>${moodLabel(mid)}</span></h3>
          <div class="art-pick">${MOODS.map((m) => `<button data-mood="${m.id}" class="${mid === m.id ? 'on' : ''}" title="${m.label}">${moodSvg(m.id)}<span>${m.label}</span></button>`).join('')}</div></div>
        <div class="card"><h3>오늘의 날씨 <span class="right small muted" data-weatherlabel>${weatherLabel(wid)}</span></h3>
          <div class="art-pick">${WEATHERS.map((w) => `<button data-weather="${w.id}" class="${wid === w.id ? 'on' : ''}" title="${w.label}">${weatherSvg(w.id)}<span>${w.label}</span></button>`).join('')}</div></div>
        <div class="card"><h3>${icon('music', 18)} 오늘의 노래</h3>
          <div class="row nowrap"><input type="text" data-f="song.title" value="${esc(d.song?.title)}" placeholder="노래 제목"><input type="text" data-f="song.artist" value="${esc(d.song?.artist)}" placeholder="가수"></div>
          <div class="row mt" data-songlinks ${q ? '' : 'hidden'}>${songLinks(q)}</div></div>
        <div class="card"><h3>${icon('heart', 18)} 감사 일기</h3><div class="form">${[0, 1, 2].map((i) => `<input type="text" data-g="${i}" value="${esc(d.grateful?.[i])}" placeholder="${i + 1}. 오늘 감사한 일">`).join('')}</div></div>
        <div class="card"><h3>${icon('edit', 18)} 일기</h3><textarea class="diary-text" data-f="text" placeholder="오늘 하루는 어땠나요?">${esc(d.text)}</textarea></div>
        ${d.photos?.length ? `<div class="card"><h3>${icon('image', 18)} 사진첩</h3><div class="photos">${d.photos.map((p, i) => `<div class="ph"><img src="${p}" alt="" data-view="${i}"><button class="x" data-delphoto="${i}" aria-label="삭제">${icon('close', 14)}</button><button class="pin" data-pinphoto="${i}">종이에 붙이기</button></div>`).join('')}</div></div>` : ''}
      </div>
      <div class="card pad-card"><h3>${icon('sparkle', 18)} 꾸미기 페이지</h3><div data-pad></div></div>
    </div>`;
}

export default {
  render(el) {
    el.innerHTML = `<div class="seg"><button data-seg="write" class="${view === 'write' ? 'on' : ''}">쓰기</button><button data-seg="cal" class="${view === 'cal' ? 'on' : ''}">달력</button></div>` +
      (view === 'write' ? writer() : calendar());
    const re = () => this.render(el);
    const get = () => diaryOf(date, true);
    const persist = debounce(() => save(), 300);

    if (view === 'write') {
      const d0 = diaryOf(date);
      const page = d0 ? migratePage(d0) : { paper: 'lined', strokes: [], items: [] };
      createDrawPad(el.querySelector('[data-pad]'), {
        page, legacy: d0?.drawing || '',
        onChange: (pg, extra) => {
          const d = get();
          d.page = pg;
          if (extra && 'legacy' in extra) d.drawing = extra.legacy;
          save();
        },
      });
      this._page = page;
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
      if (mood) {
        const d = get(); d.mood = moodId(d.mood) === mood.dataset.mood ? '' : mood.dataset.mood; save();
        el.querySelectorAll('[data-mood]').forEach((b) => b.classList.toggle('on', b.dataset.mood === d.mood));
        el.querySelector('[data-moodlabel]').textContent = moodLabel(d.mood); return;
      }
      const w = t.closest('[data-weather]');
      if (w) {
        const d = get(); d.weather = weatherId(d.weather) === w.dataset.weather ? '' : w.dataset.weather; save();
        el.querySelectorAll('[data-weather]').forEach((b) => b.classList.toggle('on', b.dataset.weather === d.weather));
        el.querySelector('[data-weatherlabel]').textContent = weatherLabel(d.weather); return;
      }
      const pin = t.closest('[data-pinphoto]');
      if (pin) {
        const d = get(); const pg = migratePage(d);
        pg.items.push({ id: uid(), k: 'photo', src: d.photos[Number(pin.dataset.pinphoto)], frame: 'polaroid', x: 0.5, y: 0.35, w: 0.42, r: -3, z: pg.items.length + 1 });
        d.photos.splice(Number(pin.dataset.pinphoto), 1);
        save(); toast('종이에 붙였어요'); return re();
      }
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
  },
};
