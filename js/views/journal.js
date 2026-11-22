// 다꾸북 — 여러 장짜리 꾸미기 노트. 책장 → 펼친 두 페이지(넘김 효과) → 페이지 꾸미기
import { state, save } from '../store.js';
import { esc, uid, today, fmtDate } from '../util.js';
import { migratePage } from '../drawpad.js';
import { modal, confirmBox, toast } from '../ui.js';
import { icon } from '../icons.js';
import { createDrawPad, renderPagePreview, PAPER_STYLES } from '../drawpad.js';

const COVERS = [
  ['#c9b8a3', 'solid'], ['#7f9ac4', 'solid'], ['#e7a9b9', 'gingham'], ['#a9c4a0', 'dots'], ['#d9c3a0', 'kraft'],
  ['#2f3f63', 'solid'], ['#f2d78a', 'stripe'], ['#b9a3e6', 'dots'], ['#e98f7a', 'solid'], ['#222222', 'solid'],
];
let openId = null;   // 열어 둔 노트
let spread = 0;      // 펼친 면 번호 (두 페이지 기준)
let editIdx = null;  // 꾸미는 중인 페이지
let showFan = false;

const DIARY_ID = '__diary__';
/** 하루 다이어리를 자동으로 모은 노트 (복사본이 아니라 다이어리 기록을 그대로 보여줌) */
function diaryBook() {
  const dates = Object.keys(state.diaries).filter((d) => { const x = state.diaries[d]; return x && ((x.page && ((x.page.strokes || []).length || (x.page.items || []).length)) || x.drawing || x.stickers?.length); }).sort();
  return {
    id: DIARY_ID, title: '하루 다이어리', color: '#6e695f', pattern: 'kraft', paper: 'lined', virtual: true,
    pages: dates.map((d) => ({ id: 'd-' + d, date: d, page: migratePage(state.diaries[d]) })),
    updated: Infinity,
  };
}
const findBook = (id) => (id === DIARY_ID ? diaryBook() : state.journals.find((x) => x.id === id));

const wide = () => (document.getElementById('main')?.clientWidth || innerWidth) >= 760;
const perView = () => (wide() ? 2 : 1);
const newPage = (paper = 'lined') => ({ id: uid(), page: { paper, strokes: [], items: [] }, created: Date.now() });
const coverStyle = (j) => `--cv:${j.color};`;

function notebookForm(j, after) {
  const isNew = !j;
  j = j || { id: uid(), title: '', color: COVERS[0][0], pattern: COVERS[0][1], paper: 'lined', pages: [], created: Date.now(), updated: Date.now() };
  let cv = [j.color, j.pattern], paper = j.paper || 'lined';
  modal(`<h2>${isNew ? '새 다꾸북' : '노트 정보'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <label class="field"><span>제목</span><input type="text" name="title" value="${esc(j.title)}" placeholder="예: 2026 다꾸, 공부 기록장, 여행 저널" required></label>
      <div class="field"><span>표지</span><div class="cover-pick">${COVERS.map(([c, p], i) => `<button type="button" class="nb-cover mini pat-${p} ${c === cv[0] && p === cv[1] ? 'on' : ''}" data-cv="${i}" style="--cv:${c}"></button>`).join('')}</div></div>
      <div class="field"><span>새 페이지 기본 내지</span><div class="chips">${PAPER_STYLES.map(([k, l]) => `<button type="button" class="chip ${k === paper ? 'on' : ''}" data-pp="${k}">${l}</button>`).join('')}</div></div>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>노트 삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">${isNew ? '만들기' : '저장'}</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      box.addEventListener('click', (e) => {
        const c = e.target.closest('[data-cv]');
        if (c) { cv = COVERS[Number(c.dataset.cv)]; box.querySelectorAll('[data-cv]').forEach((b) => b.classList.toggle('on', b === c)); }
        const pp = e.target.closest('[data-pp]');
        if (pp) { paper = pp.dataset.pp; box.querySelectorAll('[data-pp]').forEach((b) => b.classList.toggle('on', b === pp)); }
      });
      f.onsubmit = (e) => {
        e.preventDefault();
        Object.assign(j, { title: f.title.value.trim() || '다꾸북', color: cv[0], pattern: cv[1], paper, updated: Date.now() });
        if (isNew) { j.pages = [newPage(paper), newPage(paper)]; state.journals.push(j); }
        save(); close(); after(isNew ? j : null);
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox(`'${j.title}' 노트와 모든 페이지를 삭제할까요?`, '삭제')) { state.journals = state.journals.filter((x) => x !== j); openId = null; save(); after(); }
      });
    },
  });
}

function shelf(el) {
  const db = diaryBook();
  const list = [...(db.pages.length ? [db] : []), ...state.journals.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0))];
  el.innerHTML = `
    <div class="row mb"><button class="btn primary" data-act="new">${icon('plus', 16)} 새 다꾸북</button><span class="spacer"></span><a class="btn ghost sm" href="#/diary">하루 다이어리로</a></div>
    ${list.length ? `<div class="shelf">${list.map((j) => `
      <button class="nb" data-open="${j.id}">
        <div class="nb-stack">${j.pages.slice(0, 3).map(() => '<i></i>').join('')}</div>
        <div class="nb-cover pat-${j.pattern}" style="${coverStyle(j)}">
          <div class="nb-window" data-prev="${j.id}"></div>
          <div class="nb-label"><b>${esc(j.title)}</b><span>${j.virtual ? `자동 · ${j.pages.length}일` : `${j.pages.length} Pages`}</span></div>
        </div>
      </button>`).join('')}</div>`
      : '<div class="card empty">여러 장으로 이어지는 꾸미기 노트예요.<br>사진·스티커·말랑 글자로 ABOUT ME, 여행, 공부 기록장을 만들어 보세요.</div>'}`;
  list.forEach((j) => { const w = el.querySelector(`[data-prev="${j.id}"]`); if (w && j.pages[0]) renderPagePreview(w, j.pages[0].page, 0.25); });
  el.onclick = (e) => {
    const o = e.target.closest('[data-open]');
    if (o) { openId = o.dataset.open; editIdx = null; spread = openId === DIARY_ID ? 1e6 : 0; return render(el); }
    if (e.target.closest('[data-act=new]')) notebookForm(null, (j) => { if (j) { openId = j.id; spread = 0; } render(el); });
  };
}

function book(el, j) {
  const pv = perView();
  const maxSpread = Math.max(0, Math.ceil(j.pages.length / pv) - 1);
  spread = Math.min(spread, maxSpread);
  const first = spread * pv;
  const idxs = Array.from({ length: pv }, (_, i) => first + i);
  el.innerHTML = `
    <div class="row mb book-head"><button class="btn" data-act="shelf">${icon('left', 16)} 책장</button>
      <div class="book-title"><b>${esc(j.title)}</b><span class="tiny muted">${j.pages.length} Pages</span></div>
      <span class="spacer"></span>
      <button class="btn sm ${showFan ? 'soft' : ''}" data-act="fan">${icon('grid', 14)} 모아보기</button>
      ${j.virtual ? `<a class="btn sm primary" href="#/diary">${icon('plus', 14)} 오늘 다이어리 쓰기</a></div>
    <p class="tiny muted mb">다이어리의 꾸미기 페이지가 날짜순으로 자동으로 모여요. 페이지를 누르면 그 날 다이어리로 가요.</p>` : `<button class="btn sm" data-act="info">${icon('edit', 14)} 표지</button>
      <button class="btn sm primary" data-act="add">${icon('plus', 14)} 페이지</button></div>`}
    ${showFan ? `<div class="fan">${j.pages.map((p, i) => `<button class="fan-page ${i >= first && i < first + pv ? 'on' : ''}" data-jump="${i}" style="--i:${i};--n:${j.pages.length}"><div data-fp="${i}"></div><span>${i + 1}</span></button>`).join('')}</div>` : ''}
    <div class="book-wrap">
      <button class="flip-btn left" data-act="prev" ${spread ? '' : 'disabled'} aria-label="이전">${icon('left', 22)}</button>
      <div class="spread ${pv === 2 ? 'two' : 'one'}" data-spread style="${coverStyle(j)}">
        ${idxs.map((i, k) => j.pages[i] ? `<div class="bpage ${pv === 2 ? (k ? 'right' : 'left') : ''}" data-edit="${i}"><div data-bp="${i}"></div><span class="pno">${j.virtual ? fmtDate(j.pages[i].date) : i + 1}</span><span class="edit-hint">${icon('pen', 14)} 탭해서 꾸미기</span></div>`
          : j.virtual ? `<div class="bpage empty-page ${k ? 'right' : 'left'}"><span>다음 다이어리를 기다리는 중</span></div>` : `<button class="bpage empty-page ${k ? 'right' : 'left'}" data-act="add">${icon('plus', 22)}<span>페이지 추가</span></button>`).join('')}
      </div>
      <button class="flip-btn right" data-act="next" ${spread < maxSpread ? '' : 'disabled'} aria-label="다음">${icon('right', 22)}</button>
    </div>
    <div class="center tiny muted mt">${first + 1}${pv === 2 && j.pages[first + 1] ? `–${first + 2}` : ''} / ${j.pages.length} · 옆으로 밀어서 넘기기</div>`;
  idxs.forEach((i) => { const h = el.querySelector(`[data-bp="${i}"]`); if (h) renderPagePreview(h, j.pages[i].page, 0.5); });
  if (showFan) j.pages.forEach((p, i) => { const h = el.querySelector(`[data-fp="${i}"]`); if (h) renderPagePreview(h, p.page, 0.18); });

  const go = (dir) => {
    const ns = spread + dir;
    if (ns < 0 || ns > maxSpread) return;
    flip(el, j, dir, () => { spread = ns; render(el); });
  };
  el.onclick = (e) => {
    const jp = e.target.closest('[data-jump]'); if (jp) { spread = Math.floor(Number(jp.dataset.jump) / pv); return render(el); }
    const ed = e.target.closest('[data-edit]');
    if (ed && !swiped) {
      if (j.virtual) { location.hash = `#/diary?date=${j.pages[Number(ed.dataset.edit)].date}`; return; }
      editIdx = Number(ed.dataset.edit); return render(el);
    }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'shelf') { openId = null; return render(el); }
    if (a === 'fan') { showFan = !showFan; return render(el); }
    if (a === 'info') return notebookForm(j, () => render(el));
    if (a === 'prev') go(-1);
    if (a === 'next') go(1);
    if (a === 'add') {
      j.pages.push(newPage(j.paper)); if (pv === 2 && j.pages.length % 2) j.pages.push(newPage(j.paper));
      j.updated = Date.now(); save();
      spread = Math.ceil(j.pages.length / pv) - 1; toast('페이지를 추가했어요'); render(el);
    }
  };
  // 옆으로 밀어서 넘기기
  let sx = null, swiped = false;
  const sp = el.querySelector('[data-spread]');
  sp.addEventListener('pointerdown', (e) => { sx = e.clientX; swiped = false; });
  sp.addEventListener('pointerup', (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 60) { swiped = true; go(dx < 0 ? 1 : -1); setTimeout(() => { swiped = false; }, 50); }
  });
  if (el._key) removeEventListener('keydown', el._key);
  el._key = (e) => { if (!document.querySelector('.modal') && document.querySelector('[data-spread]')) { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); } };
  addEventListener('keydown', el._key);
}

/** 책장 넘김: 넘어가는 쪽 페이지가 가운데 접선을 축으로 돌아감 */
function flip(el, j, dir, done) {
  const sp = el.querySelector('[data-spread]');
  const pv = perView();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !sp) return done();
  const pages = sp.querySelectorAll('.bpage');
  const turning = dir > 0 ? pages[pages.length - 1] : pages[0];
  if (!turning) return done();
  const nextFirst = (spread + dir) * pv;
  const backIdx = dir > 0 ? nextFirst : nextFirst + pv - 1;
  const leaf = document.createElement('div');
  leaf.className = `leaf ${pv === 2 ? (dir > 0 ? 'from-right' : 'from-left') : 'single'} ${dir > 0 ? 'fwd' : 'back'}`;
  leaf.innerHTML = `<div class="face front"></div><div class="face back"></div>`;
  leaf.querySelector('.front').appendChild(turning.firstElementChild.cloneNode(true));
  const back = leaf.querySelector('.back');
  if (j.pages[backIdx]) renderPagePreview(back, j.pages[backIdx].page, 0.5);
  const r = turning.getBoundingClientRect(), sr = sp.getBoundingClientRect();
  Object.assign(leaf.style, { left: r.left - sr.left + 'px', top: r.top - sr.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  // 넘어가는 동안 아래쪽에 다음 페이지를 미리 보여줌
  const under = dir > 0 ? nextFirst + (pv === 2 ? 1 : 0) : nextFirst;
  const tc = turning.querySelector('[data-bp]');
  if (tc && j.pages[under]) renderPagePreview(tc, j.pages[under].page, 0.5);
  sp.appendChild(leaf);
  leaf.addEventListener('animationend', done, { once: true });
  setTimeout(done, 900);
}

function editor(el, j) {
  const i = Math.min(editIdx, j.pages.length - 1);
  const pg = j.pages[i];
  el.innerHTML = `
    <div class="row mb"><button class="btn" data-act="back">${icon('left', 16)} ${esc(j.title)}</button>
      <span class="tag">${i + 1} / ${j.pages.length} 페이지</span><span class="spacer"></span>
      <button class="btn sm" data-act="mvl" ${i ? '' : 'disabled'}>${icon('left', 14)} 앞으로</button>
      <button class="btn sm" data-act="mvr" ${i < j.pages.length - 1 ? '' : 'disabled'}>뒤로 ${icon('right', 14)}</button>
      <button class="btn sm" data-act="dup">복제</button>
      <button class="btn sm danger" data-act="del">${icon('trash', 14)}</button></div>
    <div class="row mb">
      <button class="btn sm" data-act="prevp" ${i ? '' : 'disabled'}>${icon('left', 14)} 이전 페이지</button><span class="spacer"></span>
      <button class="btn sm" data-act="nextp">${i < j.pages.length - 1 ? '다음 페이지' : '새 페이지'} ${icon('right', 14)}</button></div>
    <div class="card journal-edit"><div data-jpad></div></div>`;
  createDrawPad(el.querySelector('[data-jpad]'), { page: pg.page, date: today(), onChange: (p) => { pg.page = p; j.updated = Date.now(); save(); } });
  el.onclick = async (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (!a) return;
    if (a === 'back') { spread = Math.floor(i / perView()); editIdx = null; return render(el); }
    if (a === 'prevp') { editIdx = i - 1; return render(el); }
    if (a === 'nextp') { if (i === j.pages.length - 1) { j.pages.push(newPage(j.paper)); save(); } editIdx = i + 1; return render(el); }
    if (a === 'mvl' || a === 'mvr') { const k = a === 'mvl' ? i - 1 : i + 1; [j.pages[i], j.pages[k]] = [j.pages[k], j.pages[i]]; editIdx = k; save(); return render(el); }
    if (a === 'dup') { const c = JSON.parse(JSON.stringify(pg)); c.id = uid(); c.page.items.forEach((it) => { it.id = uid(); }); j.pages.splice(i + 1, 0, c); editIdx = i + 1; save(); toast('페이지를 복제했어요'); return render(el); }
    if (a === 'del') {
      if (j.pages.length <= 1) return toast('마지막 페이지는 지울 수 없어요');
      if (await confirmBox(`${i + 1}페이지를 삭제할까요?`, '삭제')) { j.pages.splice(i, 1); editIdx = Math.max(0, i - 1); save(); render(el); }
    }
  };
}

function render(el) {
  const j = openId && findBook(openId);
  if (!j) { openId = null; return shelf(el); }
  if (editIdx != null && !j.virtual) return editor(el, j);
  return book(el, j);
}

export default {
  render(el) { render(el); },
  destroy() { const m = document.getElementById('main'); if (m && m._key) removeEventListener('keydown', m._key); },
};
