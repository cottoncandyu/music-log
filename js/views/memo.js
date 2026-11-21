// 책상 위 포스트잇 메모 보드 + 암기 카드 모드
import { state, save } from '../store.js';
import { esc, uid } from '../util.js';
import { modal, confirmBox, toast } from '../ui.js';

const COLORS = ['yellow', 'pink', 'mint', 'blue', 'purple', 'orange'];
let deckFilter = '전체';

const decks = () => [...new Set(state.memos.map((m) => m.deck || '기본'))].sort();
const visible = () => state.memos.filter((m) => deckFilter === '전체' || (m.deck || '기본') === deckFilter);
const randRot = () => Math.round((Math.random() * 8 - 4) * 10) / 10;

function editMemo(m, after) {
  const isNew = !m;
  m = m || { id: uid(), deck: deckFilter === '전체' ? '기본' : deckFilter, front: '', back: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], known: false };
  let color = m.color;
  modal(`<h2>${isNew ? '📌 새 메모' : '✏️ 메모 수정'}<button class="icon-btn" data-close>✕</button></h2>
    <form class="form">
      <label class="field"><span>묶음(과목·단원)</span><input type="text" name="deck" list="deck-list" value="${esc(m.deck)}" placeholder="예: 영단어 Day1">
        <datalist id="deck-list">${decks().map((d) => `<option value="${esc(d)}">`).join('')}</datalist></label>
      <label class="field"><span>앞면 (메모 / 문제)</span><textarea name="front" required placeholder="자유롭게 적어요">${esc(m.front)}</textarea></label>
      <label class="field"><span>뒷면 (정답 · 선택) — 적으면 암기 카드로 쓸 수 있어요</span><textarea name="back" placeholder="예: 뜻, 정답, 해설">${esc(m.back)}</textarea></label>
      <div class="color-pick">${COLORS.map((c) => `<button type="button" class="c-${c} ${c === color ? 'on' : ''}" data-color="${c}" aria-label="${c}"></button>`).join('')}</div>
      <div class="actions"><button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      box.querySelector('.color-pick').onclick = (e) => {
        const b = e.target.closest('[data-color]'); if (!b) return;
        color = b.dataset.color;
        box.querySelectorAll('[data-color]').forEach((x) => x.classList.toggle('on', x === b));
      };
      const f = box.querySelector('form');
      f.onsubmit = (e) => {
        e.preventDefault();
        m.front = f.front.value.trim(); m.back = f.back.value.trim(); m.deck = f.deck.value.trim() || '기본'; m.color = color;
        if (!m.front) return;
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
  modal(`<div class="note-view c-${m.color} hand">
      <div class="tiny" style="opacity:.6;font-family:system-ui">${esc(m.deck || '기본')}</div>
      <div class="front">${esc(m.front)}</div>
      ${m.back ? `<div class="back blur" data-reveal title="탭해서 정답 보기">${esc(m.back)}</div><div class="tiny" style="opacity:.6;font-family:system-ui" data-hint>뒷면을 탭하면 보여요</div>` : ''}
    </div>
    <div class="actions">
      <button class="btn danger" data-act="del">삭제</button><span class="spacer"></span>
      <button class="btn" data-act="known">${m.known ? '↩︎ 다시 외우기' : '✔︎ 외웠어요'}</button>
      <button class="btn" data-act="edit">수정</button>
      <button class="btn primary" data-close>닫기</button>
    </div>`, {
    onMount(box, close) {
      box.onclick = async (e) => {
        if (e.target.closest('[data-reveal]')) { e.target.closest('[data-reveal]').classList.remove('blur'); box.querySelector('[data-hint]')?.remove(); return; }
        const a = e.target.closest('[data-act]')?.dataset.act;
        if (a === 'known') { m.known = !m.known; save(); close(); after(); }
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
          root.innerHTML = `<h2>🎉 한 바퀴 완료!<button class="icon-btn" data-close>✕</button></h2>
            <p>이번에 외운 카드: <b>${knownCount}</b> / ${cards.length}</p>
            <div class="actions"><button class="btn" data-act="again-all">전체 다시</button>
            <button class="btn primary" data-act="again">못 외운 것만 다시</button></div>`;
          return;
        }
        const m = cards[idx];
        root.innerHTML = `<h2>🧠 암기 모드 <span class="tag">${idx + 1} / ${cards.length}</span><button class="icon-btn" data-close>✕</button></h2>
          <label class="row small muted mb"><input type="checkbox" data-only ${onlyUnknown ? 'checked' : ''}> 외운 카드는 빼기</label>
          <div class="flash ${flipped ? 'flipped' : ''}" data-act="flip">
            <div class="flash-inner">
              <div class="flash-face c-${m.color} hand">${esc(m.front)}<div class="hint">탭해서 뒤집기</div></div>
              <div class="flash-face back c-${m.color} hand">${esc(m.back)}<div class="hint">${esc(m.front.slice(0, 40))}</div></div>
            </div>
          </div>
          <div class="actions" style="justify-content:center">
            <button class="btn lg" data-act="no">😵 다시 볼래요</button>
            <button class="btn lg primary" data-act="yes">😎 외웠어요</button>
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
        if (a === 'again') { onlyUnknown = true; cards = build(); idx = 0; knownCount = 0; if (!cards.length) { toast('모두 외웠어요! 👏'); close(); return; } draw(); }
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
    const ds = decks();
    if (deckFilter !== '전체' && !ds.includes(deckFilter)) deckFilter = '전체';
    const list = visible();
    const withBack = list.filter((m) => m.back).length;
    const maxX = Math.max(0, ...list.map((m) => (m.x || 0) + 200));
    const maxY = Math.max(0, ...list.map((m) => (m.y || 0) + 230));

    el.innerHTML = `
      <div class="row mb">
        <button class="btn primary" data-act="new">＋ 새 메모</button>
        <button class="btn soft" data-act="study">🧠 암기 모드 ${withBack ? `(${withBack})` : ''}</button>
        <button class="btn" data-act="tidy">🧹 정리</button>
        <span class="spacer"></span>
        <span class="muted small">${list.length}장 · 외움 ${list.filter((m) => m.known).length}</span>
      </div>
      <div class="chips scroll mb">${['전체', ...ds].map((d) => `<button class="chip ${d === deckFilter ? 'on' : ''}" data-deck="${esc(d)}">${esc(d)}</button>`).join('')}</div>
      <div class="board"><div class="board-inner" style="width:${maxX}px;height:${maxY}px">
        ${list.length ? '' : '<div class="empty" style="color:#fff;padding-top:80px;font-size:16px">책상에 메모를 붙여보세요 📌<br><span class="small">드래그해서 옮기고, 탭하면 크게 볼 수 있어요</span></div>'}
        ${list.map((m) => `
          <div class="note c-${m.color} ${m.known ? 'known' : ''}" data-id="${m.id}" style="left:${m.x || 0}px;top:${m.y || 0}px;--rot:${m.rot || 0}deg;z-index:${m.z || 1}">
            <div class="front hand">${esc(m.front)}</div>
            <div class="meta"><span>${esc(m.deck || '기본')}</span>${m.back ? '<span>🔁</span>' : ''}${m.known ? '<span>✔︎</span>' : ''}</div>
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
