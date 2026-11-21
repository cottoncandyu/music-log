// 독서 기록 + 공부 노트
import { state, save, subjectColor } from '../store.js';
import { icon } from '../icons.js';
import { esc, today, fmtDate, uid, fmtDur, resizeImage } from '../util.js';
import { seg, modal, confirmBox, toast } from '../ui.js';
import { secOnDate } from '../timers.js';

let tab = 'books';
let filter = 'all';
let subjFilter = '';
let search = '';

const STATUS = { reading: '읽는 중', done: '완독', want: '읽고 싶은' };
const BOOK_COLORS = ['#c0705a', '#5a8ac0', '#6aa36f', '#8a6fd6', '#d09a3e', '#4f9a9a', '#b85c8a', '#5f6b7a'];
const stars = (n) => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));

function bookForm(b, after) {
  const isNew = !b;
  b = b || { id: uid(), title: '', author: '', total: 0, current: 0, status: 'reading', rating: 0, review: '', quotes: [], log: [], color: BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)], cover: '', start: today(), end: '' };
  modal(`<h2>${isNew ? '책 추가' : '책 정보 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <label class="field"><span>제목</span><input type="text" name="title" value="${esc(b.title)}" required></label>
      <label class="field"><span>저자</span><input type="text" name="author" value="${esc(b.author)}"></label>
      <div class="row"><label class="field"><span>전체 쪽수</span><input type="number" name="total" min="0" value="${b.total || ''}"></label>
        <label class="field"><span>상태</span><select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${b.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
      <div class="row"><label class="field"><span>시작일</span><input type="date" name="start" value="${b.start || ''}"></label>
        <label class="field"><span>완독일</span><input type="date" name="end" value="${b.end || ''}"></label></div>
      <label class="field"><span>표지 사진 (선택)</span><input type="file" accept="image/*" name="cover"></label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      f.onsubmit = async (e) => {
        e.preventDefault();
        Object.assign(b, { title: f.title.value.trim(), author: f.author.value.trim(), total: Number(f.total.value) || 0, status: f.status.value, start: f.start.value, end: f.end.value });
        if (b.status === 'done' && !b.end) b.end = today();
        if (b.status === 'done' && b.total) b.current = b.total;
        if (f.cover.files[0]) b.cover = await resizeImage(f.cover.files[0], 400, 0.8);
        if (isNew) state.books.unshift(b);
        save(); close(); after();
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox(`'${b.title}'을(를) 삭제할까요?`, '삭제')) { state.books = state.books.filter((x) => x !== b); save(); after(); }
      });
    },
  });
}

function bookDetail(b, after) {
  const draw = (box) => {
    const r = b.total ? Math.min(1, b.current / b.total) : 0;
    box.innerHTML = `<h2>${esc(b.title)}<button class="icon-btn" data-close>${icon('close')}</button></h2>
      <div class="muted small mb">${esc(b.author)} · ${STATUS[b.status]}${b.start ? ` · ${b.start} 시작` : ''}${b.end ? ` · ${b.end} 완독` : ''}</div>
      <div class="card">
        <div class="row"><b>진행</b><span class="spacer"></span><span class="num">${b.current} / ${b.total || '?'}쪽 (${Math.round(r * 100)}%)</span></div>
        <div class="progress mt ${r >= 1 ? 'good' : ''}"><i style="width:${r * 100}%"></i></div>
        <form class="row nowrap mt" data-form="page"><input type="number" name="page" min="0" ${b.total ? `max="${b.total}"` : ''} placeholder="오늘 몇 쪽까지 읽었나요?"><button class="btn primary">기록</button></form>
        ${b.log?.length ? `<div class="tiny muted mt">최근: ${b.log.slice(-5).reverse().map((l) => `${l.date.slice(5)} ${l.page}쪽`).join(' · ')}</div>` : ''}
      </div>
      <div class="card mt"><b>별점</b><div class="star-pick">${[1, 2, 3, 4, 5].map((n) => `<button data-star="${n}" class="${n <= b.rating ? 'on' : ''}">★</button>`).join('')}</div>
        <label class="field mt"><span>감상 / 리뷰</span><textarea data-review placeholder="느낀 점을 남겨보세요">${esc(b.review)}</textarea></label></div>
      <div class="card mt"><b>밑줄 긋기 (인상 깊은 문장)</b>
        ${(b.quotes || []).map((q, i) => `<div class="row nowrap"><div class="quote" style="flex:1">${esc(q.text)}${q.page ? ` <span class="muted tiny">p.${q.page}</span>` : ''}</div><button class="icon-btn" data-delq="${i}">${icon('trash', 16)}</button></div>`).join('')}
        <form class="form mt" data-form="quote"><textarea name="text" placeholder="문장을 적어두세요" style="min-height:60px"></textarea>
          <div class="row nowrap"><input type="number" name="page" placeholder="쪽" style="max-width:100px"><button class="btn">추가</button></div></form></div>
      <div class="actions"><button class="btn" data-edit>정보 수정</button><button class="btn primary" data-close>닫기</button></div>`;
  };
  modal('', {
    wide: true,
    onMount(box, close) {
      draw(box);
      box.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        if (f.dataset.form === 'page') {
          const p = Number(f.page.value);
          if (!(p >= 0)) return;
          b.current = b.total ? Math.min(b.total, p) : p;
          b.log = b.log || [];
          const last = b.log[b.log.length - 1];
          if (last && last.date === today()) last.page = b.current; else b.log.push({ date: today(), page: b.current });
          if (b.status === 'want') b.status = 'reading';
          if (b.total && b.current >= b.total) { b.status = 'done'; b.end = b.end || today(); toast('완독 축하해요! '); }
        }
        if (f.dataset.form === 'quote') {
          const text = f.text.value.trim(); if (!text) return;
          (b.quotes = b.quotes || []).push({ text, page: f.page.value });
        }
        save(); draw(box);
      });
      box.addEventListener('click', (e) => {
        const s = e.target.closest('[data-star]');
        if (s) { b.rating = Number(s.dataset.star) === b.rating ? 0 : Number(s.dataset.star); save(); draw(box); }
        const dq = e.target.closest('[data-delq]');
        if (dq) { b.quotes.splice(Number(dq.dataset.delq), 1); save(); draw(box); }
        if (e.target.closest('[data-edit]')) { close(); bookForm(b, after); }
      });
      box.addEventListener('input', (e) => { if (e.target.matches('[data-review]')) { b.review = e.target.value; save(); } });
    },
    onClose: after,
  });
}

/** 각 책의 날짜별 페이지 기록으로 기간 내 읽은 쪽수 계산 */
function pagesRead(prefix) {
  let sum = 0;
  for (const b of state.books) {
    let prev = 0;
    for (const l of b.log || []) { if (l.date.startsWith(prefix)) sum += Math.max(0, l.page - prev); prev = l.page; }
  }
  return sum;
}

function renderBooks() {
  const y = today().slice(0, 4), m = today().slice(0, 7);
  const list = state.books.filter((b) => filter === 'all' || b.status === filter);
  return `
    <div class="card mb"><div class="stats">
      <div class="stat"><b>${state.books.filter((b) => b.status === 'done' && (b.end || '').startsWith(y)).length}권</b><span>${y}년 완독</span></div>
      <div class="stat"><b>${state.books.filter((b) => b.status === 'reading').length}권</b><span>읽는 중</span></div>
      <div class="stat"><b>${pagesRead(m)}쪽</b><span>이번 달 읽은 쪽수</span></div>
      <div class="stat"><b>${pagesRead(today())}쪽</b><span>오늘</span></div></div></div>
    <div class="row mb"><button class="btn primary" data-act="book">＋ 책 추가</button><span class="spacer"></span>
      <div class="chips">${[['all', '전체'], ...Object.entries(STATUS)].map(([k, v]) => `<button class="chip ${filter === k ? 'on' : ''}" data-filter="${k}">${v}</button>`).join('')}</div></div>
    ${list.length ? `<div class="books">${list.map((b) => {
      const r = b.total ? Math.min(1, b.current / b.total) : 0;
      return `<button class="book" data-book="${b.id}">
        <div class="cover" style="background:${b.color}">${b.cover ? `<img src="${b.cover}" alt="">` : esc((b.title || '?').slice(0, 1))}</div>
        <div class="info"><b>${esc(b.title)}</b><span class="small muted">${esc(b.author)}</span>
          <span class="stars small">${b.rating ? stars(b.rating) : ''}</span><span class="spacer"></span>
          <div class="row small"><span class="tag">${STATUS[b.status]}</span><span class="spacer"></span><span class="muted num">${b.total ? Math.round(r * 100) + '%' : ''}</span></div>
          ${b.total ? `<div class="progress ${r >= 1 ? 'good' : ''}"><i style="width:${r * 100}%"></i></div>` : ''}</div></button>`;
    }).join('')}</div>` : '<div class="card empty">읽은 책, 읽고 있는 책을 기록해보세요</div>'}`;
}

function noteForm(n, after) {
  const isNew = !n;
  n = n || { id: uid(), date: today(), subject: state.subjects[0]?.name || '', title: '', content: '' };
  modal(`<h2>${isNew ? '공부 노트' : '노트 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <div class="row"><label class="field"><span>날짜</span><input type="date" name="date" value="${n.date}" required></label>
        <label class="field"><span>과목</span><select name="subject">${state.subjects.map((s) => `<option ${s.name === n.subject ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label></div>
      <label class="field"><span>제목 / 범위</span><input type="text" name="title" value="${esc(n.title)}" placeholder="예: 3단원 미적분, 인강 12강"></label>
      <label class="field"><span>공부한 내용 · 배운 점 · 틀린 문제</span><textarea name="content" style="min-height:180px">${esc(n.content)}</textarea></label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      f.onsubmit = (e) => {
        e.preventDefault();
        Object.assign(n, { date: f.date.value, subject: f.subject.value, title: f.title.value.trim(), content: f.content.value });
        if (!n.title && !n.content.trim()) return toast('내용을 입력해주세요');
        if (isNew) state.notes.push(n);
        save(); close(); after();
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox('노트를 삭제할까요?', '삭제')) { state.notes = state.notes.filter((x) => x !== n); save(); after(); }
      });
    },
  });
}

function notesList() {
  const s = search.trim().toLowerCase();
  const list = state.notes
    .filter((n) => (!subjFilter || n.subject === subjFilter) && (!s || `${n.title} ${n.content}`.toLowerCase().includes(s)))
    .sort((a, b) => b.date.localeCompare(a.date));
  const byDate = {};
  list.forEach((n) => { (byDate[n.date] = byDate[n.date] || []).push(n); });
  if (!Object.keys(byDate).length) {
    return state.notes.length ? '<div class="card empty">검색 결과가 없어요</div>'
      : '<div class="card empty">오늘 공부한 내용을 정리해보세요.<br>공부 시간은 타이머에서 자동으로 함께 보여요.</div>';
  }
  return Object.entries(byDate).map(([d, ns]) => `
      <div class="card mb"><h3>${fmtDate(d, true)} <span class="right small muted">${fmtDur(secOnDate(d))}</span></h3>
      ${ns.map((n) => `<div class="note-entry" data-note="${n.id}" style="border-color:${subjectColor(n.subject)};cursor:pointer">
        <div class="row small"><span class="tag">${esc(n.subject)}</span><b>${esc(n.title)}</b></div>
        ${n.content ? `<div class="c">${esc(n.content.length > 300 ? n.content.slice(0, 300) + '…' : n.content)}</div>` : ''}</div>`).join('')}</div>`).join('');
}

function renderNotes() {
  return `<div class="row mb"><button class="btn primary" data-act="note">＋ 공부 노트</button>
      <input type="search" data-search value="${esc(search)}" placeholder="노트 검색" style="max-width:260px"></div>
    <div class="chips scroll mb"><button class="chip ${!subjFilter ? 'on' : ''}" data-subj="">전체</button>${state.subjects.map((x) => `<button class="chip ${subjFilter === x.name ? 'on' : ''}" data-subj="${esc(x.name)}"><span class="dot" style="background:${x.color}"></span>${esc(x.name)}</button>`).join('')}</div>
    <div data-notelist>${notesList()}</div>`;
}

export default {
  render(el) {
    el.innerHTML = seg([['books', '독서'], ['notes', '공부 노트']], tab) + (tab === 'books' ? renderBooks() : renderNotes());
    const re = () => this.render(el);
    el.onclick = (e) => {
      const t = e.target;
      const s = t.closest('[data-seg]'); if (s) { tab = s.dataset.seg; return re(); }
      const f = t.closest('[data-filter]'); if (f) { filter = f.dataset.filter; return re(); }
      const sj = t.closest('[data-subj]'); if (sj) { subjFilter = sj.dataset.subj; return re(); }
      const bk = t.closest('[data-book]'); if (bk) return bookDetail(state.books.find((b) => b.id === bk.dataset.book), re);
      const nt = t.closest('[data-note]'); if (nt) return noteForm(state.notes.find((n) => n.id === nt.dataset.note), re);
      const a = t.closest('[data-act]')?.dataset.act;
      if (a === 'book') bookForm(null, re);
      if (a === 'note') noteForm(null, re);
    };
    el.oninput = (e) => {
      if (!e.target.matches('[data-search]')) return;
      search = e.target.value;
      el.querySelector('[data-notelist]').innerHTML = notesList();
    };
  },
};
