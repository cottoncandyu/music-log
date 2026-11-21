// 버킷리스트 — 단기/장기, 기간 설정, 달성 체크
import { state, save } from '../store.js';
import { esc, today, uid, ddayLabel, daysBetween } from '../util.js';
import { seg, modal, confirmBox, toast } from '../ui.js';
import { icon } from '../icons.js';

const CATS = ['여행', '공부', '건강', '취미', '커리어', '관계', '돈', '기타'];
let tab = 'short';
let cat = '';

function form(b, after) {
  const isNew = !b;
  const y = Number(today().slice(0, 4));
  b = b || { id: uid(), title: '', term: tab === 'long' ? 'long' : 'short', start: today(), end: tab === 'long' ? `${y + 3}-12-31` : `${y}-12-31`, category: cat || '기타', memo: '', done: false, doneDate: '' };
  modal(`<h2>${isNew ? '버킷리스트 추가' : '버킷리스트 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <label class="field"><span>하고 싶은 일</span><input type="text" name="title" value="${esc(b.title)}" required placeholder="예: 혼자 제주도 한 달 살기"></label>
      <div class="seg" style="margin:0"><button type="button" data-term="short" class="${b.term === 'short' ? 'on' : ''}">단기</button><button type="button" data-term="long" class="${b.term === 'long' ? 'on' : ''}">장기</button></div>
      <div class="row"><label class="field"><span>시작</span><input type="date" name="start" value="${b.start}"></label>
        <label class="field"><span>목표 기한</span><input type="date" name="end" value="${b.end}"></label></div>
      <label class="field"><span>분류</span><select name="category">${CATS.map((c) => `<option ${c === b.category ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field"><span>메모 / 계획</span><textarea name="memo" placeholder="어떻게 이룰지 적어보세요">${esc(b.memo)}</textarea></label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      let term = b.term;
      box.querySelector('.seg').onclick = (e) => {
        const t = e.target.closest('[data-term]'); if (!t) return;
        term = t.dataset.term;
        box.querySelectorAll('[data-term]').forEach((x) => x.classList.toggle('on', x === t));
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        Object.assign(b, { title: f.title.value.trim(), term, start: f.start.value, end: f.end.value, category: f.category.value, memo: f.memo.value });
        if (b.start && b.end && b.end < b.start) return toast('기한이 시작일보다 빨라요');
        if (isNew) state.bucket.push(b);
        save(); close(); after();
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox('이 항목을 삭제할까요?', '삭제')) { state.bucket = state.bucket.filter((x) => x !== b); save(); after(); }
      });
    },
  });
}

function item(b) {
  const total = b.start && b.end ? Math.max(1, daysBetween(b.start, b.end)) : 0;
  const passed = total ? Math.min(total, Math.max(0, daysBetween(b.start, today()))) : 0;
  const late = !b.done && b.end && b.end < today();
  return `<li class="bucket ${b.done ? 'done' : ''}">
    <button class="tick" data-done="${b.id}" aria-label="달성">${b.done ? icon('check', 22) : ''}</button>
    <div class="body" data-edit="${b.id}">
      <div class="row"><b class="t">${esc(b.title)}</b><span class="tag">${esc(b.category)}</span></div>
      <div class="tiny muted">${b.start ? b.start.replaceAll('-', '.') : ''} ~ ${b.end ? b.end.replaceAll('-', '.') : ''}
        ${b.done ? ` · ${b.doneDate.replaceAll('-', '.')} 달성` : b.end ? ` · <b style="color:${late ? 'var(--bad)' : 'var(--accent)'}">${late ? '기한 지남' : ddayLabel(b.end)}</b>` : ''}</div>
      ${!b.done && total ? `<div class="progress thin mt"><i style="width:${(passed / total) * 100}%"></i></div>` : ''}
      ${b.memo ? `<div class="small muted mt clamp2">${esc(b.memo)}</div>` : ''}
    </div></li>`;
}

export default {
  render(el) {
    const all = state.bucket;
    const list = all.filter((b) => (tab === 'done' ? b.done : !b.done && b.term === tab) && (!cat || b.category === cat))
      .sort((a, b) => (tab === 'done' ? (b.doneDate || '').localeCompare(a.doneDate || '') : (a.end || '9').localeCompare(b.end || '9')));
    const doneN = all.filter((b) => b.done).length;
    el.innerHTML = `
      <div class="card mb"><div class="stats">
        <div class="stat"><b>${all.filter((b) => !b.done && b.term === 'short').length}</b><span>단기 진행 중</span></div>
        <div class="stat"><b>${all.filter((b) => !b.done && b.term === 'long').length}</b><span>장기 진행 중</span></div>
        <div class="stat"><b>${doneN}</b><span>이룬 꿈</span></div>
        <div class="stat"><b>${all.length ? Math.round((doneN / all.length) * 100) : 0}%</b><span>달성률</span></div></div></div>
      <div class="row mb">${seg([['short', '단기'], ['long', '장기'], ['done', '달성']], tab).replace('class="seg"', 'class="seg" style="margin:0"')}
        <span class="spacer"></span><button class="btn primary" data-act="add">${icon('plus', 18)} 추가</button></div>
      <div class="chips scroll mb"><button class="chip ${!cat ? 'on' : ''}" data-cat="">전체</button>${CATS.map((c) => `<button class="chip ${cat === c ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
      ${list.length ? `<ul class="list card bucket-list">${list.map(item).join('')}</ul>` : `<div class="card empty">${tab === 'done' ? '아직 이룬 항목이 없어요' : tab === 'short' ? '올해 안에 해보고 싶은 일을 적어보세요' : '언젠가 꼭 이루고 싶은 큰 꿈을 적어보세요'}</div>`}`;
    const re = () => this.render(el);
    el.onclick = (e) => {
      const s = e.target.closest('[data-seg]'); if (s) { tab = s.dataset.seg; return re(); }
      const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; return re(); }
      const d = e.target.closest('[data-done]');
      if (d) {
        const b = state.bucket.find((x) => x.id === d.dataset.done);
        b.done = !b.done; b.doneDate = b.done ? today() : '';
        save(); if (b.done) toast('축하해요! 하나 이뤘어요'); return re();
      }
      const ed = e.target.closest('[data-edit]'); if (ed) return form(state.bucket.find((x) => x.id === ed.dataset.edit), re);
      if (e.target.closest('[data-act=add]')) form(null, re);
    };
  },
};
