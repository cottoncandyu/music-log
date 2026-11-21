// 위시리스트 — 사고 싶은 것, 가격·링크·사진·우선순위, 구매 체크
import { state, save } from '../store.js';
import { esc, today, uid, resizeImage } from '../util.js';
import { modal, confirmBox, toast } from '../ui.js';
import { icon } from '../icons.js';

let filter = 'want';
const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
const PRI = { 3: '꼭 갖고 싶어', 2: '갖고 싶어', 1: '언젠가' };

function form(w, after) {
  const isNew = !w;
  w = w || { id: uid(), title: '', price: '', link: '', priority: 2, photo: '', memo: '', bought: false, boughtDate: '', created: today() };
  let photo = w.photo;
  modal(`<h2>${isNew ? '위시 추가' : '위시 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <label class="field"><span>갖고 싶은 것</span><input type="text" name="title" value="${esc(w.title)}" required></label>
      <div class="row"><label class="field"><span>가격 (원)</span><input type="number" name="price" min="0" inputmode="numeric" value="${w.price}"></label>
        <label class="field"><span>우선순위</span><select name="priority">${[3, 2, 1].map((n) => `<option value="${n}" ${Number(w.priority) === n ? 'selected' : ''}>${PRI[n]}</option>`).join('')}</select></label></div>
      <label class="field"><span>링크</span><input type="url" name="link" value="${esc(w.link)}" placeholder="https://"></label>
      <label class="field"><span>사진</span><div class="row"><img data-prev src="${photo || ''}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px;${photo ? '' : 'display:none'}"><input type="file" accept="image/*" data-photo></div></label>
      <label class="field"><span>메모</span><textarea name="memo" style="min-height:60px">${esc(w.memo)}</textarea></label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      box.querySelector('[data-photo]').onchange = async (e) => {
        if (!e.target.files[0]) return;
        photo = await resizeImage(e.target.files[0], 600, 0.8);
        const img = box.querySelector('[data-prev]'); img.src = photo; img.style.display = '';
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const link = f.link.value.trim();
        Object.assign(w, { title: f.title.value.trim(), price: Math.max(0, Math.round(Number(f.price.value) || 0)), priority: Number(f.priority.value), link: /^https?:\/\//.test(link) ? link : '', memo: f.memo.value, photo });
        if (isNew) state.wishes.push(w);
        save(); close(); after();
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox('위시리스트에서 삭제할까요?', '삭제')) { state.wishes = state.wishes.filter((x) => x !== w); save(); after(); }
      });
    },
  });
}

export default {
  render(el) {
    const want = state.wishes.filter((w) => !w.bought), got = state.wishes.filter((w) => w.bought);
    const list = (filter === 'want' ? want : got).slice().sort((a, b) => (filter === 'want' ? b.priority - a.priority || a.created.localeCompare(b.created) : (b.boughtDate || '').localeCompare(a.boughtDate || '')));
    el.innerHTML = `
      <div class="card mb"><div class="stats">
        <div class="stat"><b>${want.length}개</b><span>갖고 싶은 것</span></div>
        <div class="stat"><b>${won(want.reduce((a, b) => a + (b.price || 0), 0))}</b><span>모두 사면</span></div>
        <div class="stat"><b>${got.length}개</b><span>손에 넣은 것</span></div></div></div>
      <div class="row mb"><div class="seg" style="margin:0"><button data-f="want" class="${filter === 'want' ? 'on' : ''}">위시</button><button data-f="got" class="${filter === 'got' ? 'on' : ''}">구매 완료</button></div>
        <span class="spacer"></span><button class="btn primary" data-act="add">${icon('plus', 18)} 추가</button></div>
      ${list.length ? `<div class="wish-grid">${list.map((w) => `
        <div class="card wish ${w.bought ? 'got' : ''}">
          <div class="ph" data-edit="${w.id}">${w.photo ? `<img src="${w.photo}" alt="">` : `<span>${icon('gift', 30)}</span>`}</div>
          <div class="body" data-edit="${w.id}"><b>${esc(w.title)}</b>
            <div class="row small"><span class="num">${w.price ? won(w.price) : '가격 미정'}</span><span class="spacer"></span><span class="tag">${PRI[w.priority]}</span></div>
            ${w.memo ? `<div class="tiny muted clamp2">${esc(w.memo)}</div>` : ''}</div>
          <div class="row">${w.link ? `<a class="btn sm" href="${esc(w.link)}" target="_blank" rel="noopener">${icon('link', 14)} 보러가기</a>` : ''}<span class="spacer"></span>
            <button class="btn sm ${w.bought ? '' : 'soft'}" data-buy="${w.id}">${w.bought ? '되돌리기' : '샀어요'}</button></div>
        </div>`).join('')}</div>` : `<div class="card empty">${filter === 'want' ? '갖고 싶은 것을 모아두세요' : '아직 구매한 항목이 없어요'}</div>`}`;
    const re = () => this.render(el);
    el.onclick = (e) => {
      if (e.target.closest('a')) return;
      const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; return re(); }
      const b = e.target.closest('[data-buy]');
      if (b) { const w = state.wishes.find((x) => x.id === b.dataset.buy); w.bought = !w.bought; w.boughtDate = w.bought ? today() : ''; save(); if (w.bought) toast('득템 축하해요!'); return re(); }
      const ed = e.target.closest('[data-edit]'); if (ed) return form(state.wishes.find((x) => x.id === ed.dataset.edit), re);
      if (e.target.closest('[data-act=add]')) form(null, re);
    };
  },
};
