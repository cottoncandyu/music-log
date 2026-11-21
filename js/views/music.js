// 음악 기록 — 들은 노래, 별점, 감상, 다이어리 '오늘의 노래'도 함께 모아보기
import { state, save } from '../store.js';
import { esc, today, uid, fmtDate } from '../util.js';
import { modal, confirmBox } from '../ui.js';
import { icon } from '../icons.js';

const TAGS = ['최애', '공부할 때', '새벽 감성', '신날 때', '위로', '운동', '드라이브', '추억'];
let tag = '';
let q = '';
let month = '';

const links = (title, artist) => {
  const s = encodeURIComponent(`${title} ${artist || ''}`.trim());
  return `<a class="btn sm" target="_blank" rel="noopener" href="https://music.youtube.com/search?q=${s}">YouTube Music</a>
    <a class="btn sm" target="_blank" rel="noopener" href="https://www.melon.com/search/total/index.htm?q=${s}">멜론</a>
    <a class="btn sm" target="_blank" rel="noopener" href="https://music.apple.com/kr/search?term=${s}">Apple Music</a>`;
};

function form(m, after) {
  const isNew = !m;
  m = m || { id: uid(), date: today(), title: '', artist: '', rating: 0, tag: '', memo: '', link: '' };
  modal(`<h2>${isNew ? '음악 기록' : '음악 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <div class="row"><label class="field"><span>제목</span><input type="text" name="title" value="${esc(m.title)}" required></label>
        <label class="field"><span>아티스트</span><input type="text" name="artist" value="${esc(m.artist)}"></label></div>
      <div class="row"><label class="field"><span>날짜</span><input type="date" name="date" value="${m.date}"></label>
        <label class="field"><span>태그</span><select name="tag"><option value="">없음</option>${TAGS.map((t) => `<option ${t === m.tag ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <div class="field"><span>별점</span><div class="star-pick">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" class="${n <= m.rating ? 'on' : ''}">★</button>`).join('')}</div></div>
      <label class="field"><span>감상 · 좋아하는 가사</span><textarea name="memo">${esc(m.memo)}</textarea></label>
      <label class="field"><span>링크 (선택)</span><input type="url" name="link" value="${esc(m.link)}" placeholder="https://"></label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      let rating = m.rating;
      box.querySelector('.star-pick').onclick = (e) => {
        const s = e.target.closest('[data-star]'); if (!s) return;
        rating = Number(s.dataset.star) === rating ? 0 : Number(s.dataset.star);
        box.querySelectorAll('[data-star]').forEach((x) => x.classList.toggle('on', Number(x.dataset.star) <= rating));
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const link = f.link.value.trim();
        Object.assign(m, { title: f.title.value.trim(), artist: f.artist.value.trim(), date: f.date.value || today(), tag: f.tag.value, memo: f.memo.value, link: /^https?:\/\//.test(link) ? link : '', rating });
        if (isNew) state.music.push(m);
        save(); close(); after();
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox('이 기록을 삭제할까요?', '삭제')) { state.music = state.music.filter((x) => x !== m); save(); after(); }
      });
    },
  });
}

function allEntries() {
  const fromDiary = Object.entries(state.diaries).filter(([, d]) => d.song?.title)
    .map(([date, d]) => ({ id: 'diary-' + date, date, title: d.song.title, artist: d.song.artist, rating: 0, tag: '', memo: '', diary: true }));
  return [...state.music, ...fromDiary].sort((a, b) => b.date.localeCompare(a.date));
}

function list() {
  const s = q.trim().toLowerCase();
  const items = allEntries().filter((m) => (!tag || m.tag === tag) && (!month || m.date.startsWith(month)) && (!s || `${m.title} ${m.artist} ${m.memo}`.toLowerCase().includes(s)));
  if (!items.length) return '<div class="card empty">요즘 듣는 노래를 기록해보세요.<br>다이어리의 ‘오늘의 노래’도 여기에 함께 모여요.</div>';
  return `<div class="music-list">${items.map((m) => `
    <div class="card music" ${m.diary ? '' : `data-edit="${m.id}"`}>
      <div class="disc" aria-hidden="true">${icon('music', 22)}</div>
      <div class="body">
        <div class="row"><b>${esc(m.title)}</b>${m.rating ? `<span class="stars small">${'★'.repeat(m.rating)}</span>` : ''}<span class="spacer"></span><span class="tiny muted">${fmtDate(m.date)}</span></div>
        <div class="small muted">${esc(m.artist)}${m.tag ? ` · <span class="tag">${esc(m.tag)}</span>` : ''}${m.diary ? ' · <span class="tag">다이어리</span>' : ''}</div>
        ${m.memo ? `<div class="small mt quote">${esc(m.memo)}</div>` : ''}
        <div class="row mt" data-stop>${m.link ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(m.link)}">${icon('link', 14)} 링크</a>` : ''}${links(m.title, m.artist)}</div>
      </div></div>`).join('')}</div>`;
}

export default {
  render(el) {
    const all = allEntries();
    const ym = today().slice(0, 7);
    const artists = {};
    all.forEach((m) => { if (m.artist) artists[m.artist] = (artists[m.artist] || 0) + 1; });
    const top = Object.entries(artists).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const months = [...new Set(all.map((m) => m.date.slice(0, 7)))].sort().reverse();
    el.innerHTML = `
      <div class="card mb"><div class="stats">
        <div class="stat"><b>${all.length}</b><span>기록한 곡</span></div>
        <div class="stat"><b>${all.filter((m) => m.date.startsWith(ym)).length}</b><span>이번 달</span></div>
        <div class="stat"><b class="small" style="font-size:16px">${top.length ? top.map(([a]) => esc(a)).join(', ') : '-'}</b><span>많이 들은 아티스트</span></div></div></div>
      <div class="row mb"><button class="btn primary" data-act="add">${icon('plus', 18)} 음악 기록</button>
        <input type="search" data-q value="${esc(q)}" placeholder="제목·가수 검색" style="max-width:220px">
        <select data-month style="max-width:150px"><option value="">전체 기간</option>${months.map((m) => `<option value="${m}" ${m === month ? 'selected' : ''}>${m.replace('-', '년 ')}월</option>`).join('')}</select></div>
      <div class="chips scroll mb"><button class="chip ${!tag ? 'on' : ''}" data-tag="">전체</button>${TAGS.map((t) => `<button class="chip ${tag === t ? 'on' : ''}" data-tag="${t}">${t}</button>`).join('')}</div>
      <div data-list>${list()}</div>`;
    const re = () => this.render(el);
    el.onclick = (e) => {
      if (e.target.closest('[data-stop] a')) return;
      const t = e.target.closest('[data-tag]'); if (t) { tag = t.dataset.tag; return re(); }
      const ed = e.target.closest('[data-edit]'); if (ed) return form(state.music.find((x) => x.id === ed.dataset.edit), re);
      if (e.target.closest('[data-act=add]')) form(null, re);
    };
    el.oninput = (e) => { if (e.target.matches('[data-q]')) { q = e.target.value; el.querySelector('[data-list]').innerHTML = list(); } };
    el.onchange = (e) => { if (e.target.matches('[data-month]')) { month = e.target.value; re(); } };
  },
};
