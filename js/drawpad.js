// 손글씨(애플펜슬 필압 지원) + 형광펜 + 지우개 + 스티커 꾸미기 패드
import { state } from './store.js';
import { loadImage } from './util.js';

const W = 900, H = 1200;
const COLORS = ['#2f2a24', '#e5534b', '#e47f52', '#e3b341', '#4f9d62', '#3b82c4', '#8a6fd6', '#e87aa4', '#ffffff'];
export const STICKERS = ['⭐', '💖', '🌸', '🍀', '☀️', '🌙', '🌈', '☁️', '🔥', '✨', '🎀', '🎵', '📚', '✏️', '☕', '🍰', '🍓', '🐻', '🐰', '🐱', '🐶', '🦊', '🐥', '👍', '💯', '🎉', '😊', '😭', '😴', '💪', '🏃', '📌', '✅', '❤️', '💙', '💚'];

export function createDrawPad(host, { drawing = '', stickers = [], onChange }) {
  let tool = 'pen', color = COLORS[0], size = 4, sticker = STICKERS[0], selected = -1;
  const list = stickers.map((s) => ({ ...s }));

  host.innerHTML = `
    <div class="pad-tools">
      <button class="tool on" data-tool="pen" title="펜">✏️</button>
      <button class="tool" data-tool="marker" title="형광펜">🖍️</button>
      <button class="tool" data-tool="eraser" title="지우개">🧽</button>
      <button class="tool" data-tool="sticker" title="스티커">⭐</button>
      <span class="spacer"></span>
      <button class="tool" data-act="undo" title="실행 취소">↶</button>
      <button class="tool" data-act="clear" title="모두 지우기">🗑</button>
    </div>
    <div class="pad-tools" data-penopts>
      ${COLORS.map((c, i) => `<button class="sw ${i === 0 ? 'on' : ''}" data-color="${c}" style="background:${c}" aria-label="색 ${c}"></button>`).join('')}
      <input type="range" min="1" max="30" value="${size}" data-size aria-label="굵기">
    </div>
    <div class="sticker-palette" data-palette hidden>${STICKERS.map((s, i) => `<button data-st="${s}" class="${i === 0 ? 'on' : ''}">${s}</button>`).join('')}
      <div class="row" style="width:100%;margin-top:6px" data-selopts hidden>
        <span class="small muted">선택한 스티커</span><input type="range" min="3" max="30" data-ssize style="flex:1">
        <button class="btn sm" data-act="rot">↻</button><button class="btn sm danger" data-act="sdel">삭제</button></div>
      <div class="tiny muted" style="width:100%">스티커를 고르고 종이를 탭하면 붙어요 · 붙인 스티커는 끌어서 옮기기</div>
    </div>
    <div class="pad"><canvas width="${W}" height="${H}"></canvas><canvas width="${W}" height="${H}" data-live style="pointer-events:none"></canvas><div class="stickers"></div></div>
    <div class="tiny muted mt">${state.profile.penOnly ? '✍️ 펜 전용 모드: 손가락 터치는 무시돼요 (설정에서 변경)' : '💡 설정에서 ‘애플펜슬 전용’을 켜면 손바닥이 닿아도 그려지지 않아요'}</div>`;

  const pad = host.querySelector('.pad');
  const [cv, live] = host.querySelectorAll('canvas');
  const ctx = cv.getContext('2d');
  const lctx = live.getContext('2d');
  const layer = host.querySelector('.stickers');
  const undo = [];
  const pushUndo = () => { undo.push(ctx.getImageData(0, 0, W, H)); if (undo.length > 8) undo.shift(); };

  if (drawing) loadImage(drawing).then((img) => ctx.drawImage(img, 0, 0, W, H)).catch(() => {});

  let saveT;
  const changed = () => {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      const empty = !ctx.getImageData(0, 0, W, H).data.some((v, i) => i % 4 === 3 && v);
      onChange({ drawing: empty ? '' : cv.toDataURL('image/png'), stickers: list });
    }, 600);
  };

  // ---------- 스티커 ----------
  const renderStickers = () => {
    layer.innerHTML = list.map((s, i) => `<span class="sticker ${i === selected ? 'sel' : ''}" data-i="${i}" style="left:${s.x * 100}%;top:${s.y * 100}%;font-size:${s.s}cqw;--r:${s.r || 0}deg">${s.e}</span>`).join('');
    const opts = host.querySelector('[data-selopts]');
    opts.hidden = selected < 0;
    if (selected >= 0) host.querySelector('[data-ssize]').value = list[selected].s;
  };
  pad.style.containerType = 'inline-size';
  renderStickers();

  const rel = (e) => { const r = pad.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
  let sdrag = null;
  layer.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.sticker');
    if (el) {
      selected = Number(el.dataset.i);
      const p = rel(e); const s = list[selected];
      sdrag = { dx: s.x - p.x, dy: s.y - p.y, id: e.pointerId, el };
      layer.setPointerCapture(e.pointerId);
      layer.querySelectorAll('.sticker').forEach((x) => x.classList.toggle('sel', x === el));
      host.querySelector('[data-selopts]').hidden = false;
      host.querySelector('[data-ssize]').value = s.s;
    } else {
      const p = rel(e);
      list.push({ e: sticker, x: p.x, y: p.y, s: 9, r: Math.round(Math.random() * 30 - 15) });
      selected = list.length - 1;
      renderStickers(); changed();
    }
  });
  layer.addEventListener('pointermove', (e) => {
    if (!sdrag || e.pointerId !== sdrag.id) return;
    const p = rel(e); const s = list[selected];
    s.x = Math.min(1, Math.max(0, p.x + sdrag.dx)); s.y = Math.min(1, Math.max(0, p.y + sdrag.dy));
    sdrag.el.style.left = s.x * 100 + '%'; sdrag.el.style.top = s.y * 100 + '%';
  });
  const sEnd = () => { if (sdrag) { sdrag = null; changed(); } };
  layer.addEventListener('pointerup', sEnd);
  layer.addEventListener('pointercancel', sEnd);

  // ---------- 그리기 ----------
  let stroke = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, p: e.pressure }; };
  const widthFor = (e, base) => (e.pointerType === 'pen' ? base * (0.35 + (e.pressure || 0.5) * 1.3) : base);

  cv.addEventListener('pointerdown', (e) => {
    if (state.profile.penOnly && e.pointerType === 'touch') return;
    if (stroke) return;
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    pushUndo();
    const p = pos(e);
    stroke = { id: e.pointerId, pts: [p], last: p, lastMid: p };
    if (tool === 'pen' || tool === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, (tool === 'eraser' ? size * 3 : widthFor(e, size)) / 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!stroke || e.pointerId !== stroke.id) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (evs.length ? evs : [e])) {
      const p = pos(ev);
      stroke.pts.push(p);
      if (tool === 'marker') continue;
      const mid = { x: (stroke.last.x + p.x) / 2, y: (stroke.last.y + p.y) / 2 };
      ctx.save();
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = tool === 'eraser' ? size * 3 : widthFor(ev, size);
      ctx.beginPath(); ctx.moveTo(stroke.lastMid.x, stroke.lastMid.y);
      ctx.quadraticCurveTo(stroke.last.x, stroke.last.y, mid.x, mid.y); ctx.stroke();
      ctx.restore();
      stroke.last = p; stroke.lastMid = mid;
    }
    if (tool === 'marker') {
      lctx.clearRect(0, 0, W, H);
      lctx.strokeStyle = color; lctx.globalAlpha = 0.35; lctx.lineWidth = size * 4; lctx.lineCap = 'round'; lctx.lineJoin = 'round';
      lctx.beginPath(); stroke.pts.forEach((p, i) => (i ? lctx.lineTo(p.x, p.y) : lctx.moveTo(p.x, p.y))); lctx.stroke();
    }
  });
  const end = (e) => {
    if (!stroke || e.pointerId !== stroke.id) return;
    if (tool === 'marker') {
      if (stroke.pts.length === 1) { const p = stroke.pts[0]; lctx.globalAlpha = 0.35; lctx.fillStyle = color; lctx.beginPath(); lctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2); lctx.fill(); }
      ctx.drawImage(live, 0, 0); lctx.clearRect(0, 0, W, H);
    } else if (tool === 'pen' || tool === 'eraser') {
      const p = stroke.last;
      ctx.save(); ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineWidth = tool === 'eraser' ? size * 3 : widthFor(e, size);
      ctx.beginPath(); ctx.moveTo(stroke.lastMid.x, stroke.lastMid.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.restore();
    }
    stroke = null;
    changed();
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);

  // ---------- 도구 ----------
  host.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tool]');
    if (t) {
      tool = t.dataset.tool;
      host.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b === t));
      pad.classList.toggle('sticker-mode', tool === 'sticker');
      host.querySelector('[data-palette]').hidden = tool !== 'sticker';
      host.querySelector('[data-penopts]').hidden = tool === 'sticker';
      if (tool !== 'sticker') { selected = -1; renderStickers(); }
      return;
    }
    const c = e.target.closest('[data-color]');
    if (c) { color = c.dataset.color; host.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('on', b === c)); if (tool === 'eraser') host.querySelector('[data-tool=pen]').click(); return; }
    const st = e.target.closest('[data-st]');
    if (st) { sticker = st.dataset.st; host.querySelectorAll('[data-st]').forEach((b) => b.classList.toggle('on', b === st)); return; }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'undo' && undo.length) { ctx.putImageData(undo.pop(), 0, 0); changed(); }
    if (a === 'clear' && confirm('그림과 스티커를 모두 지울까요?')) { pushUndo(); ctx.clearRect(0, 0, W, H); list.length = 0; selected = -1; renderStickers(); changed(); }
    if (a === 'sdel' && selected >= 0) { list.splice(selected, 1); selected = -1; renderStickers(); changed(); }
    if (a === 'rot' && selected >= 0) { list[selected].r = ((list[selected].r || 0) + 15) % 360; renderStickers(); changed(); }
  });
  host.querySelector('[data-size]').addEventListener('input', (e) => { size = Number(e.target.value); });
  host.querySelector('[data-ssize]').addEventListener('input', (e) => {
    if (selected < 0) return;
    list[selected].s = Number(e.target.value);
    const el = layer.querySelector(`[data-i="${selected}"]`); if (el) el.style.fontSize = list[selected].s + 'cqw';
    changed();
  });
}
