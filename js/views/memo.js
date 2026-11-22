// 책상 위 포스트잇 메모 보드 + 암기 카드 모드
import { state, save } from '../store.js';
import { esc, uid, resizeImage, fmtDate, ymd } from '../util.js';
import { createDrawPad } from '../drawpad.js';
import { modal, confirmBox, toast } from '../ui.js';
import { icon } from '../icons.js';
import { handFont, fontPicker } from '../theme.js';

/** 메모별 글씨체 (없으면 설정의 기본 메모 글씨체) */
const fontStyle = (m, base) => { const f = handFont(m.font || state.profile.memoFont); return `font-family:${f.css};font-size:calc(${base} * ${f.scale})`; };

export const COLORS = ['yellow', 'lemon', 'cream', 'peach', 'orange', 'coral', 'pink', 'blush', 'lilac', 'purple', 'lavender', 'sky', 'blue', 'mint', 'sage', 'teal', 'gray', 'white', 'kraft', 'navy'];
let deckFilter = '전체';
let showHidden = false;
let tab = 'board';      // 'board' 포스트잇 | 'free' 자유 메모
let editingFree = null; // 편집 중인 자유 메모 id

/** 단원 목록: 미리 만들어 둔 것 + 실제 쓰인 것 */
const decks = () => [...new Set([...(state.memoDecks || []), ...state.memos.map((m) => m.deck || '기본'), ...state.freeMemos.map((m) => m.deck).filter(Boolean)])];
const visible = () => state.memos.filter((m) => (deckFilter === '전체' || (m.deck || '기본') === deckFilter) && (showHidden ? m.hidden : !m.hidden));

function deckManager(after) {
  const draw = (box) => {
    box.innerHTML = `<h2>단원 관리<button class="icon-btn" data-close>${icon('close')}</button></h2>
      <p class="small muted">자주 쓰는 과목·단원 이름을 미리 만들어 두면 메모를 쓸 때 탭 한 번으로 고를 수 있어요.</p>
      <form class="row nowrap" data-form="deck"><input type="text" name="name" placeholder="예: 재무회계 3장, 영단어 Day 12" required><button class="btn primary">추가</button></form>
      <ul class="list mt">${(state.memoDecks || []).map((d, i) => `<li><span class="txt">${esc(d)}</span><span class="tiny muted">${state.memos.filter((m) => m.deck === d).length}장</span>
        <button class="icon-btn" data-up="${i}" ${i ? '' : 'disabled'}>${icon('up', 16)}</button><button class="icon-btn" data-ren="${i}">${icon('edit', 16)}</button><button class="icon-btn" data-rm="${i}">${icon('trash', 16)}</button></li>`).join('') || '<div class="empty">아직 만든 단원이 없어요</div>'}</ul>`;
  };
  modal('', {
    onMount(box) {
      draw(box);
      box.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim(); if (!name) return;
        state.memoDecks = state.memoDecks || [];
        if (!state.memoDecks.includes(name)) state.memoDecks.push(name);
        save(); draw(box); box.querySelector('[name=name]').focus();
      });
      box.addEventListener('click', (e) => {
        const up = e.target.closest('[data-up]');
        if (up) { const i = Number(up.dataset.up); [state.memoDecks[i - 1], state.memoDecks[i]] = [state.memoDecks[i], state.memoDecks[i - 1]]; save(); return draw(box); }
        const ren = e.target.closest('[data-ren]');
        if (ren) {
          const i = Number(ren.dataset.ren), old = state.memoDecks[i];
          const v = prompt('단원 이름 바꾸기', old);
          if (v && v.trim() && v.trim() !== old) { state.memoDecks[i] = v.trim(); state.memos.forEach((m) => { if (m.deck === old) m.deck = v.trim(); }); state.freeMemos.forEach((m) => { if (m.deck === old) m.deck = v.trim(); }); save(); draw(box); }
          return;
        }
        const rm = e.target.closest('[data-rm]');
        if (rm) { state.memoDecks.splice(Number(rm.dataset.rm), 1); save(); draw(box); }
      });
    },
    onClose: after,
  });
}
const deckPicker = (cur) => `<div class="chips deck-pick">${decks().map((d) => `<button type="button" class="chip ${d === cur ? 'on' : ''}" data-pickdeck="${esc(d)}">${esc(d)}</button>`).join('')}</div>`;
const randRot = () => Math.round((Math.random() * 8 - 4) * 10) / 10;

function editMemo(m, after) {
  const isNew = !m;
  m = m || { id: uid(), deck: deckFilter === '전체' ? '기본' : deckFilter, front: '', back: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], known: false };
  let color = m.color, font = m.font || state.profile.memoFont || 'gaegu', photo = m.photo || '';
  modal(`<h2>${isNew ? '새 메모' : '메모 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <div class="field"><span>단원 <button type="button" class="btn ghost sm" data-managedecks>단원 관리</button></span>${deckPicker(m.deck)}
        <input type="text" name="deck" value="${esc(m.deck)}" placeholder="새 단원 이름을 직접 입력해도 돼요"></div>
      <label class="field"><span>앞면 (메모 / 문제)</span><textarea name="front" placeholder="자유롭게 적어요">${esc(m.front)}</textarea></label>
      <div class="field"><span>사진 (선택) — 교재·필기 사진을 붙여두세요</span><div class="row"><img data-prev src="${photo}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:8px;${photo ? '' : 'display:none'}">
        <label class="btn sm">${icon('image', 14)} 사진 고르기<input type="file" accept="image/*" data-photo hidden></label>${photo ? '<button type="button" class="btn sm danger" data-nophoto>사진 빼기</button>' : ''}</div></div>
      <label class="field"><span>뒷면 (정답 · 선택) — 적으면 암기 카드로 쓸 수 있어요</span><textarea name="back" placeholder="예: 뜻, 정답, 해설">${esc(m.back)}</textarea></label>
      <div class="field"><span>글씨체</span>${fontPicker('font', font)}</div>
      <div class="color-pick">${COLORS.map((c) => `<button type="button" class="c-${c} ${c === color ? 'on' : ''}" data-color="${c}" aria-label="${c}"></button>`).join('')}</div>
      <div class="actions"><button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      box.querySelector('.font-groups').onclick = (e) => {
        const b = e.target.closest('[data-font]'); if (!b) return;
        font = b.dataset.font;
        box.querySelectorAll('[data-font]').forEach((x) => x.classList.toggle('on', x === b));
        box.querySelector('[name=front]').style.fontFamily = handFont(font).css;
      };
      box.querySelector('[name=front]').style.fontFamily = handFont(font).css;
      box.querySelector('.deck-pick').onclick = (e) => {
        const b = e.target.closest('[data-pickdeck]'); if (!b) return;
        box.querySelector('[name=deck]').value = b.dataset.pickdeck;
        box.querySelectorAll('[data-pickdeck]').forEach((x) => x.classList.toggle('on', x === b));
      };
      box.querySelector('[data-managedecks]').onclick = () => deckManager(() => {
        const dp = box.querySelector('.deck-pick'); if (dp) dp.outerHTML = deckPicker(box.querySelector('[name=deck]').value);
        box.querySelector('.deck-pick').onclick = (ev) => { const b = ev.target.closest('[data-pickdeck]'); if (!b) return; box.querySelector('[name=deck]').value = b.dataset.pickdeck; box.querySelectorAll('[data-pickdeck]').forEach((x) => x.classList.toggle('on', x === b)); };
      });
      box.querySelector('[data-photo]').onchange = async (e) => {
        if (!e.target.files[0]) return;
        photo = await resizeImage(e.target.files[0], 900, 0.82);
        const img = box.querySelector('[data-prev]'); img.src = photo; img.style.display = '';
      };
      box.querySelector('[data-nophoto]')?.addEventListener('click', () => { photo = ''; box.querySelector('[data-prev]').style.display = 'none'; });
      box.querySelector('.color-pick').onclick = (e) => {
        const b = e.target.closest('[data-color]'); if (!b) return;
        color = b.dataset.color;
        box.querySelectorAll('[data-color]').forEach((x) => x.classList.toggle('on', x === b));
      };
      const f = box.querySelector('form');
      f.onsubmit = (e) => {
        e.preventDefault();
        m.front = f.front.value.trim(); m.back = f.back.value.trim(); m.deck = f.deck.value.trim() || '기본'; m.color = color; m.font = font; m.photo = photo;
        if (!m.front && !m.photo) return toast('내용이나 사진을 넣어주세요');
        if (m.deck !== '기본' && !(state.memoDecks || []).includes(m.deck)) (state.memoDecks = state.memoDecks || []).push(m.deck);
        if (isNew) {
          const board = document.querySelector('.board');
          const sx = board ? board.scrollLeft : 0, sy = board ? board.scrollTop : 0;
          const bw = board ? board.clientWidth : 600;
          m.x = sx + 20 + Math.random() * Math.max(40, bw - 240); m.y = sy + 20 + Math.random() * 160;
          m.rot = randRot(); m.z = Math.max(0, ...state.memos.map((x) => x.z || 0)) + 1; m.created = Date.now();
          state.memos.push(m);
        }
        save(); close(); after();
      };
      setTimeout(() => f.front.focus(), 50);
    },
  });
}

function viewMemo(m, after) {
  modal(`<div class="note-view c-${m.color}" style="${fontStyle(m, '24px')}">
      <div class="tiny" style="opacity:.6;font-family:system-ui">${esc(m.deck || '기본')}</div>
      ${m.photo ? `<img src="${m.photo}" alt="" class="note-photo-lg">` : ''}
      <div class="front">${esc(m.front)}</div>
      ${m.back ? `<div class="back blur" data-reveal title="탭해서 정답 보기">${esc(m.back)}</div><div class="tiny" style="opacity:.6;font-family:system-ui" data-hint>뒷면을 탭하면 보여요</div>` : ''}
    </div>
    <div class="actions">
      <button class="btn danger" data-act="del">삭제</button>
      <button class="btn" data-act="hide">${m.hidden ? '다시 보이기' : '숨기기'}</button><span class="spacer"></span>
      <button class="btn" data-act="known">${m.known ? '다시 외우기' : '외웠어요'}</button>
      <button class="btn" data-act="edit">수정</button>
      <button class="btn primary" data-close>닫기</button>
    </div>`, {
    onMount(box, close) {
      box.onclick = async (e) => {
        if (e.target.closest('[data-reveal]')) { e.target.closest('[data-reveal]').classList.remove('blur'); box.querySelector('[data-hint]')?.remove(); return; }
        const a = e.target.closest('[data-act]')?.dataset.act;
        if (a === 'known') { m.known = !m.known; save(); close(); after(); }
        if (a === 'hide') { m.hidden = !m.hidden; save(); close(); toast(m.hidden ? '숨겼어요. 위의 ‘숨긴 메모’에서 다시 볼 수 있어요' : '다시 보이게 했어요'); after(); }
        if (a === 'edit') { close(); editMemo(m, after); }
        if (a === 'del') {
          close();
          if (await confirmBox('이 메모를 삭제할까요?', '삭제')) { state.memos = state.memos.filter((x) => x !== m); save(); after(); }
        }
      };
    },
  });
}

function studyMode(after) {
  let pool = visible().filter((m) => m.back);
  if (!pool.length) { toast('뒷면(정답)이 있는 메모가 있어야 암기 모드를 쓸 수 있어요'); return; }
  let onlyUnknown = pool.some((m) => !m.known);
  const build = () => {
    const list = pool.filter((m) => !onlyUnknown || !m.known);
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
  };
  let cards = build(), idx = 0, flipped = false, knownCount = 0;

  modal('<div data-root></div>', {
    wide: true,
    onMount(box, close) {
      const root = box.querySelector('[data-root]');
      const draw = () => {
        if (!cards.length || idx >= cards.length) {
          root.innerHTML = `<h2>한 바퀴 완료!<button class="icon-btn" data-close>${icon('close')}</button></h2>
            <p>이번에 외운 카드: <b>${knownCount}</b> / ${cards.length}</p>
            <div class="actions"><button class="btn" data-act="again-all">전체 다시</button>
            <button class="btn primary" data-act="again">못 외운 것만 다시</button></div>`;
          return;
        }
        const m = cards[idx];
        root.innerHTML = `<h2>암기 모드 <span class="tag">${idx + 1} / ${cards.length}</span><button class="icon-btn" data-close>${icon('close')}</button></h2>
          <label class="row small muted mb"><input type="checkbox" data-only ${onlyUnknown ? 'checked' : ''}> 외운 카드는 빼기</label>
          <div class="flash ${flipped ? 'flipped' : ''}" data-act="flip">
            <div class="flash-inner">
              <div class="flash-face c-${m.color}" style="${fontStyle(m, 'clamp(24px, 5vw, 40px)')}">${esc(m.front)}<div class="hint">탭해서 뒤집기</div></div>
              <div class="flash-face back c-${m.color}" style="${fontStyle(m, 'clamp(24px, 5vw, 40px)')}">${esc(m.back)}<div class="hint">${esc(m.front.slice(0, 40))}</div></div>
            </div>
          </div>
          <div class="actions" style="justify-content:center">
            <button class="btn lg" data-act="no">다시 볼래요</button>
            <button class="btn lg primary" data-act="yes">외웠어요</button>
          </div>`;
      };
      draw();
      root.onclick = (e) => {
        const a = e.target.closest('[data-act]')?.dataset.act;
        if (!a) return;
        if (a === 'flip') { flipped = !flipped; root.querySelector('.flash').classList.toggle('flipped', flipped); return; }
        if (a === 'yes' || a === 'no') {
          const m = cards[idx];
          m.known = a === 'yes'; if (a === 'yes') knownCount++;
          save(); idx++; flipped = false; draw();
        }
        if (a === 'again') { onlyUnknown = true; cards = build(); idx = 0; knownCount = 0; if (!cards.length) { toast('모두 외웠어요! '); close(); return; } draw(); }
        if (a === 'again-all') { onlyUnknown = false; pool.forEach((m) => { m.known = false; }); save(); cards = build(); idx = 0; knownCount = 0; draw(); }
      };
      root.onchange = (e) => {
        if (e.target.matches('[data-only]')) { onlyUnknown = e.target.checked; cards = build(); idx = 0; flipped = false; draw(); }
      };
      const key = (e) => {
        if (!document.body.contains(box)) { removeEventListener('keydown', key); return; }
        if (e.key === ' ') { e.preventDefault(); root.querySelector('[data-act=flip]')?.click(); }
        if (e.key === 'ArrowRight') root.querySelector('[data-act=yes]')?.click();
        if (e.key === 'ArrowLeft') root.querySelector('[data-act=no]')?.click();
      };
      addEventListener('keydown', key);
    },
    onClose: () => after(),
  });
}

function tidy() {
  const board = document.querySelector('.board');
  const W = board ? board.clientWidth : 800;
  const cols = Math.max(1, Math.floor((W - 20) / 200));
  visible().forEach((m, i) => { m.x = 20 + (i % cols) * 200; m.y = 24 + Math.floor(i / cols) * 200; m.rot = randRot(); });
  save();
}

export default {
  render(el) {
    if (tab === 'free') return renderFree.call(this, el);
    const ds = decks();
    if (deckFilter !== '전체' && !ds.includes(deckFilter)) deckFilter = '전체';
    const list = visible();
    const withBack = list.filter((m) => m.back).length;
    const maxX = Math.max(0, ...list.map((m) => (m.x || 0) + 200));
    const maxY = Math.max(0, ...list.map((m) => (m.y || 0) + 230));

    const hiddenN = state.memos.filter((m) => m.hidden).length;
    el.innerHTML = tabsHtml() + `
      <div class="row mb">
        <button class="btn primary" data-act="new">＋ 새 메모</button>
        <button class="btn" data-act="decks">단원 관리</button>
        <button class="btn soft" data-act="study">암기 모드 ${withBack ? `(${withBack})` : ''}</button>
        <button class="btn" data-act="tidy">정리</button>
        <span class="spacer"></span>
        <span class="muted small">${list.length}장 · 외움 ${list.filter((m) => m.known).length}</span>
      </div>
      <div class="chips scroll mb">${['전체', ...ds].map((d) => `<button class="chip ${d === deckFilter ? 'on' : ''}" data-deck="${esc(d)}">${esc(d)}</button>`).join('')}
        <button class="chip ${showHidden ? 'on' : ''}" data-act="hidden">숨긴 메모 ${hiddenN}</button></div>
      ${showHidden ? '<div class="small muted mb">숨긴 메모만 보고 있어요. 메모를 눌러 ‘다시 보이기’를 할 수 있어요.</div>' : ''}
      <div class="board"><div class="board-inner" style="width:${maxX}px;height:${maxY}px">
        ${list.length ? '' : '<div class="empty" style="color:#fff;padding-top:80px;font-size:16px">책상에 메모를 붙여보세요 <br><span class="small">드래그해서 옮기고, 탭하면 크게 볼 수 있어요</span></div>'}
        ${list.map((m) => `
          <div class="note c-${m.color} ${m.known ? 'known' : ''}" data-id="${m.id}" style="left:${m.x || 0}px;top:${m.y || 0}px;--rot:${m.rot || 0}deg;z-index:${m.z || 1}">
            ${m.photo ? `<img src="${m.photo}" alt="" class="note-photo" draggable="false">` : ''}
            ${m.front ? `<div class="front" style="${fontStyle(m, '21px')}">${esc(m.front)}</div>` : ''}
            <div class="meta"><span>${esc(m.deck || '기본')}</span>${m.back ? '<span>· 카드</span>' : ''}${m.known ? '<span>· 외움</span>' : ''}</div>
          </div>`).join('')}
      </div></div>`;

    const refresh = () => this.render(el);

    el.onclick = (e) => {
      const deck = e.target.closest('[data-deck]');
      if (deck) { deckFilter = deck.dataset.deck; return refresh(); }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'new') editMemo(null, refresh);
      if (a === 'study') studyMode(refresh);
      if (a === 'tidy') { tidy(); refresh(); }
      if (a === 'decks') deckManager(refresh);
      if (a === 'hidden') { showHidden = !showHidden; refresh(); }
      const tb = e.target.closest('[data-memotab]'); if (tb) { tab = tb.dataset.memotab; refresh(); }
    };

    // 드래그 & 탭
    const inner = el.querySelector('.board-inner');
    let drag = null;
    inner.addEventListener('pointerdown', (e) => {
      const n = e.target.closest('.note');
      if (!n) return;
      const m = state.memos.find((x) => x.id === n.dataset.id);
      drag = { n, m, sx: e.clientX, sy: e.clientY, ox: m.x || 0, oy: m.y || 0, moved: false, id: e.pointerId };
      n.setPointerCapture(e.pointerId);
    });
    inner.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) {
        drag.moved = true; drag.n.classList.add('dragging');
        drag.m.z = Math.max(0, ...state.memos.map((x) => x.z || 0)) + 1; drag.n.style.zIndex = drag.m.z;
      }
      drag.m.x = Math.max(0, drag.ox + dx); drag.m.y = Math.max(0, drag.oy + dy);
      drag.n.style.left = drag.m.x + 'px'; drag.n.style.top = drag.m.y + 'px';
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      d.n.classList.remove('dragging');
      if (d.moved) {
        save();
        inner.style.width = Math.max(inner.offsetWidth, d.m.x + 200) + 'px';
        inner.style.height = Math.max(inner.offsetHeight, d.m.y + 230) + 'px';
      } else if (e.type === 'pointerup') viewMemo(d.m, refresh);
    };
    inner.addEventListener('pointerup', end);
    inner.addEventListener('pointercancel', end);
  },
};

// ---------- 자유 메모 (손글씨·사진·스티커를 자유롭게 쓰는 노트) ----------
const tabsHtml = () => `<div class="seg"><button data-memotab="board" class="${tab === 'board' ? 'on' : ''}">포스트잇</button><button data-memotab="free" class="${tab === 'free' ? 'on' : ''}">자유 메모</button></div>`;
const FREE_COLORS = ['#fffdf6', '#fff6d6', '#fde8ea', '#e8f1fb', '#e8f4e6', '#efe9fa', '#f1ede6'];
let freeDeck = '전체';
let freeHidden = false;

function freeThumb(m) {
  const photo = (m.page?.items || []).find((i) => i.k === 'photo');
  const n = (m.page?.strokes?.length || 0) + (m.page?.items?.length || 0);
  return `<button class="free-card" data-free="${m.id}" style="background:${m.color || FREE_COLORS[0]}">
    ${m.pinned ? `<span class="pin">${icon('star', 14, 'fill="currentColor"')}</span>` : ''}
    ${photo ? `<img src="${photo.src}" alt="">` : ''}
    <b>${esc(m.title || '제목 없음')}</b>
    ${m.text ? `<span class="small clamp2">${esc(m.text)}</span>` : ''}
    <span class="tiny muted">${m.deck ? esc(m.deck) + ' · ' : ''}${fmtDate(ymd(new Date(m.updated || m.created)))}${n ? ` · 꾸미기 ${n}` : ''}</span></button>`;
}

function renderFree(el) {
  const editing = editingFree && state.freeMemos.find((m) => m.id === editingFree);
  if (editing) return renderFreeEditor.call(this, el, editing);
  const ds = [...new Set(state.freeMemos.map((m) => m.deck).filter(Boolean))];
  const list = state.freeMemos.filter((m) => (freeDeck === '전체' || m.deck === freeDeck) && (freeHidden ? m.hidden : !m.hidden))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || 0) - (a.updated || 0));
  el.innerHTML = tabsHtml() + `
    <div class="row mb"><button class="btn primary" data-act="newfree">${icon('plus', 16)} 새 자유 메모</button><button class="btn" data-act="decks">단원 관리</button></div>
    <div class="chips scroll mb">${['전체', ...ds].map((d) => `<button class="chip ${d === freeDeck ? 'on' : ''}" data-fdeck="${esc(d)}">${esc(d)}</button>`).join('')}
      <button class="chip ${freeHidden ? 'on' : ''}" data-act="fhidden">숨긴 메모 ${state.freeMemos.filter((m) => m.hidden).length}</button></div>
    ${list.length ? `<div class="free-grid">${list.map(freeThumb).join('')}</div>` : `<div class="card empty">${freeHidden ? '숨긴 자유 메모가 없어요' : '손글씨·사진·스티커로 자유롭게 쓰는 노트예요.<br>필기 사진을 붙이고 위에 펜으로 정리해 보세요.'}</div>`}`;
  const re = () => this.render(el);
  el.onclick = (e) => {
    const tb = e.target.closest('[data-memotab]'); if (tb) { tab = tb.dataset.memotab; return re(); }
    const fd = e.target.closest('[data-fdeck]'); if (fd) { freeDeck = fd.dataset.fdeck; return re(); }
    const c = e.target.closest('[data-free]'); if (c) { editingFree = c.dataset.free; return re(); }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'decks') deckManager(re);
    if (a === 'fhidden') { freeHidden = !freeHidden; re(); }
    if (a === 'newfree') {
      const m = { id: uid(), title: '', deck: freeDeck === '전체' ? '' : freeDeck, text: '', page: { paper: 'blank', strokes: [], items: [] }, color: FREE_COLORS[0], pinned: false, hidden: false, created: Date.now(), updated: Date.now() };
      state.freeMemos.push(m); save(); editingFree = m.id; re();
    }
  };
  el.oninput = null; el.onchange = null;
}

function renderFreeEditor(el, m) {
  el.innerHTML = `
    <div class="row mb"><button class="btn" data-act="back">${icon('left', 16)} 목록</button><span class="spacer"></span>
      <button class="btn sm" data-act="pin">${icon('star', 14, m.pinned ? 'fill="currentColor"' : '')} ${m.pinned ? '고정 해제' : '위에 고정'}</button>
      <button class="btn sm" data-act="hide">${m.hidden ? '다시 보이기' : '숨기기'}</button>
      <button class="btn sm danger" data-act="del">${icon('trash', 14)} 삭제</button></div>
    <div class="grid two free-editor">
      <div class="card"><div class="form">
        <input type="text" data-ff="title" value="${esc(m.title)}" placeholder="제목" class="free-title">
        <div class="field"><span>단원</span>${deckPicker(m.deck)}</div>
        <div class="field"><span>색</span><div class="row">${FREE_COLORS.map((c) => `<button type="button" class="sw ${c === m.color ? 'on' : ''}" data-fcolor="${c}" style="background:${c}"></button>`).join('')}</div></div>
        <textarea data-ff="text" placeholder="타이핑으로 적기 (손글씨는 오른쪽 종이에)" style="min-height:180px">${esc(m.text)}</textarea>
        <div class="tiny muted">사진 버튼으로 교재·필기 사진을 올리고 위에 펜으로 정리할 수 있어요.</div>
      </div></div>
      <div class="card"><div data-fpad></div></div>
    </div>`;
  createDrawPad(el.querySelector('[data-fpad]'), { page: m.page, onChange: (pg) => { m.page = pg; m.updated = Date.now(); save(); } });
  const re = () => this.render(el);
  el.onclick = async (e) => {
    const pd = e.target.closest('[data-pickdeck]');
    if (pd) { m.deck = m.deck === pd.dataset.pickdeck ? '' : pd.dataset.pickdeck; m.updated = Date.now(); save(); el.querySelectorAll('[data-pickdeck]').forEach((x) => x.classList.toggle('on', x.dataset.pickdeck === m.deck)); return; }
    const fc = e.target.closest('[data-fcolor]');
    if (fc) { m.color = fc.dataset.fcolor; save(); el.querySelectorAll('[data-fcolor]').forEach((x) => x.classList.toggle('on', x === fc)); return; }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'back') {
      // 아무것도 안 쓴 새 메모는 정리
      if (!m.title && !m.text && !m.page.strokes.length && !m.page.items.length) state.freeMemos = state.freeMemos.filter((x) => x !== m);
      save(); editingFree = null; return re();
    }
    if (a === 'pin') { m.pinned = !m.pinned; save(); return re(); }
    if (a === 'hide') { m.hidden = !m.hidden; save(); toast(m.hidden ? '숨겼어요' : '다시 보이게 했어요'); editingFree = null; return re(); }
    if (a === 'del' && await confirmBox('이 자유 메모를 삭제할까요?', '삭제')) { state.freeMemos = state.freeMemos.filter((x) => x !== m); save(); editingFree = null; re(); }
  };
  el.oninput = (e) => {
    const k = e.target.dataset.ff; if (!k) return;
    m[k] = e.target.value; m.updated = Date.now(); save();
  };
}
