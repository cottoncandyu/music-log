// 다이어리 꾸미기 패드
// - 손글씨는 '선(벡터)'으로 저장 → 획 지우개, 글씨 보정, 실행 취소가 가능
// - 스티커 / 마스킹테이프 / 사진 / 텍스트는 종이 위 '아이템'으로 배치 (드래그·두 손가락 확대/회전)
import { state, save } from './store.js';
import { loadImage, resizeImage, uid, esc } from './util.js';
import { icon } from './icons.js';
import { modal } from './ui.js';
import { STICKERS, MOODS, WEATHERS, ALL_TAPES, stickerSvg, stickerDefaultW, tapeSvg, moodSvg, weatherSvg, STICKER_GROUPS, PAPERS, paperSvg, paperDefaultW } from './art.js';
import { handFont, fontPicker } from './theme.js';
import { recordSvg, timetableSvg, todoCardSvg, dateTextSvg, DATE_TEXT_STYLES } from './decor.js';
import { collageSvg, DATE_STICKERS, LABEL_STICKERS, PATTERN_BUBBLES, Y2K_STICKERS, DOODLE_STICKERS, DRINK_STICKERS, BOOK_STICKERS } from './art3.js';

const W = 900, H = 1200, S = 1.5; // 논리 좌표 900×1200, 실제 픽셀 1.5배
export const PAPER_STYLES = [['lined', '줄'], ['grid', '격자'], ['dot', '도트'], ['blank', '무지'], ['kraft', '크라프트'], ['half', '반반'], ['torn', '찢은 노트'], ['news', '신문지'], ['manuscript', '원고지'], ['music', '오선지'], ['vintage', '빈티지'], ['pinkgrid', '핑크 모눈'], ['skygrid', '하늘 모눈'], ['gingham', '깅엄'], ['polka', '도트 무늬'], ['board', '칠판']];
const INKS = ['#2b2522', '#5b5f66', '#8b6f5a', '#c4544a', '#e0896b', '#e2b448', '#6e9a6a', '#4f8fa8', '#4a6fc4', '#8a72c8', '#d97aa6', '#ffffff'];

// ---------- 선 그리기 ----------
const pw = (s, pr) => (s.pen ? s.w * (0.35 + pr * 1.3) : s.w);
function pathOf(ctx, p) {
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  if (p.length === 3) { ctx.lineTo(p[0] + 0.1, p[1]); return; }
  for (let i = 3; i < p.length - 3; i += 3) {
    const mx = (p[i] + p[i + 3]) / 2, my = (p[i + 1] + p[i + 4]) / 2;
    ctx.quadraticCurveTo(p[i], p[i + 1], mx, my);
  }
  ctx.lineTo(p[p.length - 3], p[p.length - 2]);
}
let tmp = null;
function drawStroke(ctx, s) {
  const p = s.p;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (s.t === 'marker') {
    if (!tmp) { tmp = document.createElement('canvas'); tmp.width = W * S; tmp.height = H * S; }
    const t = tmp.getContext('2d');
    t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, tmp.width, tmp.height); t.setTransform(S, 0, 0, S, 0, 0);
    t.strokeStyle = s.c; t.lineWidth = s.w * 4; t.lineCap = 'round'; t.lineJoin = 'round';
    pathOf(t, p); t.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.38; ctx.drawImage(tmp, 0, 0);
  } else if (s.t === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = s.w * 3; pathOf(ctx, p); ctx.stroke();
  } else {
    ctx.strokeStyle = s.c; ctx.fillStyle = s.c;
    if (p.length === 3) { ctx.beginPath(); ctx.arc(p[0], p[1], pw(s, p[2]) / 2, 0, Math.PI * 2); ctx.fill(); }
    else {
      // 필압에 따라 구간별 굵기
      let lx = p[0], ly = p[1];
      for (let i = 3; i < p.length; i += 3) {
        const last = i + 3 >= p.length;
        const mx = last ? p[i] : (p[i] + p[i + 3]) / 2, my = last ? p[i + 1] : (p[i + 1] + p[i + 4]) / 2;
        ctx.lineWidth = pw(s, (p[i - 1] + p[i + 2]) / 2);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(p[i], p[i + 1], mx, my); ctx.stroke();
        lx = mx; ly = my;
      }
    }
  }
  ctx.restore();
}

// ---------- 글씨 보정 ----------
function resample(p, step = 2.5) {
  const out = [p[0], p[1], p[2]];
  let acc = 0;
  for (let i = 3; i < p.length; i += 3) {
    let x0 = p[i - 3], y0 = p[i - 2], pr0 = p[i - 1];
    const x1 = p[i], y1 = p[i + 1], pr1 = p[i + 2];
    let seg = Math.hypot(x1 - x0, y1 - y0);
    while (acc + seg >= step) {
      const t = (step - acc) / seg;
      x0 += (x1 - x0) * t; y0 += (y1 - y0) * t; const pr = pr0 + (pr1 - pr0) * t;
      out.push(x0, y0, pr); seg = Math.hypot(x1 - x0, y1 - y0); acc = 0;
    }
    acc += seg;
  }
  out.push(p[p.length - 3], p[p.length - 2], p[p.length - 1]);
  return out;
}
export function correct(p, strength = 3) {
  if (p.length < 9) return p;
  const n = p.length / 3;
  // 1) 거의 직선이면 반듯하게
  const x0 = p[0], y0 = p[1], x1 = p[p.length - 3], y1 = p[p.length - 2];
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len > 60) {
    let maxDev = 0;
    for (let i = 0; i < p.length; i += 3) {
      const d = Math.abs((y1 - y0) * p[i] - (x1 - x0) * p[i + 1] + x1 * y0 - y1 * x0) / len;
      if (d > maxDev) maxDev = d;
    }
    if (maxDev < Math.max(3, len * 0.025)) {
      let pr = 0; for (let i = 2; i < p.length; i += 3) pr += p[i];
      pr /= n;
      return [x0, y0, pr, (x0 + x1) / 2, (y0 + y1) / 2, pr, x1, y1, pr];
    }
  }
  // 2) 손떨림 줄이기: 일정 간격으로 다시 찍고 이동평균
  const r = resample(p);
  const m = r.length / 3, k = Math.max(1, Math.round(strength * 1.6));
  const out = [];
  for (let i = 0; i < m; i++) {
    const kk = Math.min(k, i, m - 1 - i);
    let sx = 0, sy = 0, sp = 0, c = 0;
    for (let j = i - kk; j <= i + kk; j++) { sx += r[j * 3]; sy += r[j * 3 + 1]; sp += r[j * 3 + 2]; c++; }
    out.push(sx / c, sy / c, sp / c);
  }
  return out;
}
const round = (p) => p.map((v, i) => (i % 3 === 2 ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10));

function hitStroke(s, x, y, r) {
  const p = s.p, rr = r + (s.t === 'marker' ? s.w * 2 : s.w / 2);
  for (let i = 0; i < p.length; i += 3) {
    if (i + 3 < p.length) {
      const ax = p[i], ay = p[i + 1], bx = p[i + 3], by = p[i + 4];
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
      const t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
      if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) < rr) return true;
    } else if (Math.hypot(x - p[i], y - p[i + 1]) < rr) return true;
  }
  return false;
}

// ---------- 오늘의 기록 (영수증 스타일 카드) ----------
export function receiptSvg(d) {
  const rows = (d.rows || []).slice(0, 9);
  const h = 118 + rows.length * 22 + (d.note ? 26 : 0);
  let zig = `M0 0 H200 V${h - 8}`;
  for (let x = 190, k = 1; x >= 0; x -= 10, k++) zig += ` L${x} ${h - 8 + (k % 2) * 8}`;
  zig += 'Z';
  const mono = "font-family=\"'Nanum Gothic Coding', 'Courier New', monospace\"";
  return `<svg viewBox="0 0 200 ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="rsh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".15"/></filter></defs>
    <path d="${zig}" fill="#fffefb" filter="url(#rsh)"/>
    <text x="100" y="26" text-anchor="middle" font-size="15" font-weight="700" ${mono} fill="#222" letter-spacing="2">TODAY RECORD</text>
    <text x="100" y="44" text-anchor="middle" font-size="9" ${mono} fill="#666">${esc(d.date || '')}</text>
    <path d="M12 54 H188" stroke="#222" stroke-dasharray="3 3"/>
    ${rows.map((r, i) => `<text x="14" y="${74 + i * 22}" font-size="10.5" ${mono} fill="#333">${esc(r[0])}</text><text x="186" y="${74 + i * 22}" text-anchor="end" font-size="10.5" font-weight="700" ${mono} fill="#111">${esc(r[1])}</text>`).join('')}
    <path d="M12 ${68 + rows.length * 22} H188" stroke="#222" stroke-dasharray="3 3"/>
    ${d.note ? `<text x="100" y="${88 + rows.length * 22}" text-anchor="middle" font-size="10.5" ${mono} fill="#333">"${esc(d.note)}"</text>` : ''}
    <g transform="translate(40 ${h - 40})">${Array.from({ length: 30 }, (_, i) => `<rect x="${i * 4}" y="0" width="${[1, 2, 1, 3][i % 4]}" height="18" fill="#222"/>`).join('')}</g>
    <text x="100" y="${h - 14}" text-anchor="middle" font-size="7" ${mono} fill="#888">THANK YOU · ARCHIVE</text></svg>`;
}

// ---------- 아이템 ----------
// ---------- 사진 모양 ----------
export const PHOTO_FRAMES = [['polaroid', '폴라로이드'], ['cutout', '스티커(흰 테두리)'], ['rounded', '둥근 사각'], ['circle', '동그라미'], ['heart', '하트'], ['star', '별'], ['cloud', '구름'], ['stamp', '우표'], ['film', '필름'], ['plain', '그대로']];
const SHAPE_D = {
  circle: 'M50 2 A48 48 0 1 1 49.9 2Z',
  heart: 'M50 92 C14 70 2 50 6 32 C10 12 34 6 50 26 C66 6 90 12 94 32 C98 50 86 70 50 92Z',
  star: (() => { let d = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 48, a = (i / 10) * Math.PI * 2 - Math.PI / 2; d += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(1)} ${(53 + Math.sin(a) * r).toFixed(1)}`; } return d + 'Z'; })(),
  cloud: (() => { const n = 8; let d = ''; for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, x = 50 + Math.cos(a) * 36, y = 52 + Math.sin(a) * 30; if (!i) d += `M${x.toFixed(1)} ${y.toFixed(1)}`; else { const am = ((i - 0.5) / n) * Math.PI * 2; d += ` Q${(50 + Math.cos(am) * 50).toFixed(1)} ${(52 + Math.sin(am) * 44).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`; } } return d + 'Z'; })(),
};
function photoInner(it) {
  const f = it.frame || 'polaroid', src = it.src;
  if (SHAPE_D[f]) {
    const id = 'cp' + it.id;
    return `<svg viewBox="-6 -6 112 112" class="pshape"><defs><clipPath id="${id}"><path d="${SHAPE_D[f]}"/></clipPath><filter id="f${id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity=".25"/></filter></defs>
      <path d="${SHAPE_D[f]}" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round" filter="url(#f${id})"/><image href="${src}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/></svg>`;
  }
  return `<div class="pframe2 fr-${f}"><img src="${src}" alt="" draggable="false"></div>`;
}
const TEXT_FX = [['none', '기본'], ['bubble', '말랑 글자'], ['outline', '흰 테두리'], ['shadow', '그림자'], ['marker', '형광펜'], ['label', '라벨'], ['collage', '콜라주 글자']];
function textStyle(it) {
  const c = it.color || '#2b2522';
  switch (it.fx) {
    case 'outline': return `text-shadow:${[[2, 0], [-2, 0], [0, 2], [0, -2], [1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5], [3, 0], [-3, 0], [0, 3], [0, -3]].map(([x, y]) => `${x * 0.06}em ${y * 0.06}em 0 #fff`).join(',')}, 0 .12em .2em rgba(0,0,0,.25);`;
    case 'shadow': return `text-shadow:.07em .07em 0 ${c}55;`;
    case 'marker': return `background:linear-gradient(transparent 58%, ${it.bg || '#f8e27a'}cc 58%, ${it.bg || '#f8e27a'}cc 92%, transparent 92%);`;
    case 'label': return `background:${it.bg || '#f6d6df'};padding:.1em .4em;box-shadow:0 1px 2px rgba(0,0,0,.15);`;
    case 'bubble': { // 'ABOUT ME' 같은 동글동글 테두리 글자: 연한 속 + 진한 테두리 + 흰 바깥선
      const ring = (r, col) => Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(3)}em ${(Math.sin(a) * r).toFixed(3)}em 0 ${col}`; }).join(',');
      return `color:${it.bg || '#dfe8fb'};font-weight:700;letter-spacing:.04em;text-shadow:${ring(0.035, c)},${ring(0.06, c)},${ring(0.1, '#fff')},0 .12em .14em rgba(0,0,0,.18);`;
    }
    default: return '';
  }
}

function itemInner(it) {
  if (it.k === 'sticker') return stickerSvg(it.ref);
  if (it.k === 'tape') return tapeSvg(it.ref);
  if (it.k === 'paper') return paperSvg(it.ref);
  if (it.k === 'record') return recordSvg(it.data || {});
  if (it.k === 'timetable') return timetableSvg(it.ymd);
  if (it.k === 'todocard') return todoCardSvg(it.ymd);
  if (it.k === 'photo') return photoInner(it);
  if (it.k === 'text' && it.fx === 'collage') return collageSvg(it.text, it.seed || 1);
  if (it.k === 'text') return `<div class="ptext" style="font-family:${handFont(it.font).css};color:${it.color};font-size:${(it.f * handFont(it.font).scale).toFixed(2)}cqw;${textStyle(it)}">${esc(it.text)}</div>`;
  if (it.k === 'emoji') return `<span style="font-size:${it.s || 9}cqw;line-height:1">${esc(it.text)}</span>`;
  return '';
}
function itemStyle(it) {
  const w = (it.k === 'text' && it.fx !== 'collage') || it.k === 'emoji' ? '' : `width:${(it.k === 'text' ? (it.w || 0.4) : it.w) * 100}%;`;
  return `left:${it.x * 100}%;top:${it.y * 100}%;${w}transform:translate(-50%,-50%) rotate(${it.r || 0}deg);z-index:${it.z || 1}`;
}

function textEditor(it, onDone) {
  let font = it.font, color = it.color, fx = it.fx || 'none', bg = it.bg || '#f8e27a';
  modal(`<h2>종이에 글쓰기<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <div class="form">
      <textarea data-t style="min-height:110px;font-size:20px;font-family:${handFont(font).css}">${esc(it.text)}</textarea>
      <div class="field"><span>글씨체</span>${fontPicker('font', font)}</div>
      <label class="field"><span>색</span><div class="row">${INKS.map((c) => `<button type="button" class="sw ${c === color ? 'on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div></label>
      <label class="field"><span>크기</span><input type="range" min="2.5" max="14" step="0.5" value="${it.f}" data-size></label>
      <div class="field"><span>효과</span><div class="chips">${TEXT_FX.map(([k, l]) => `<button type="button" class="chip ${k === fx ? 'on' : ''}" data-fx="${k}">${l}</button>`).join('')}</div></div>
      <div class="field" data-bgrow><span>형광펜·라벨 색</span><div class="row">${['#f8e27a', '#f6d6df', '#cfe3f6', '#d6efd0', '#e6dbf6', '#f9d9bf', '#2b2522'].map((c) => `<button type="button" class="sw ${c === bg ? 'on' : ''}" data-bg="${c}" style="background:${c}"></button>`).join('')}</div></div>
      <div class="actions"><button class="btn" data-close>취소</button><button class="btn primary" data-ok>완료</button></div>
    </div>`, {
    onMount(box, close) {
      const ta = box.querySelector('[data-t]');
      setTimeout(() => ta.focus(), 50);
      box.addEventListener('click', (e) => {
        const f = e.target.closest('[data-font]');
        if (f) { font = f.dataset.font; ta.style.fontFamily = handFont(font).css; box.querySelectorAll('[data-font]').forEach((b) => b.classList.toggle('on', b === f)); }
        const c = e.target.closest('[data-c]');
        if (c) { color = c.dataset.c; box.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('on', b === c)); }
        const fb = e.target.closest('[data-fx]');
        if (fb) { fx = fb.dataset.fx; box.querySelectorAll('[data-fx]').forEach((b) => b.classList.toggle('on', b === fb)); }
        const bb = e.target.closest('[data-bg]');
        if (bb) { bg = bb.dataset.bg; box.querySelectorAll('[data-bg]').forEach((b) => b.classList.toggle('on', b === bb)); }
        if (e.target.closest('[data-ok]')) {
          it.text = ta.value; it.font = font; it.color = color; it.f = Number(box.querySelector('[data-size]').value);
          it.fx = fx; it.bg = bg;
          if (fx === 'collage') { it.seed = it.seed || Math.floor(Math.random() * 1e6); it.w = it.w || Math.min(0.9, 0.08 * [...it.text].length + 0.08); }
          close(); onDone(true);
        }
      });
    },
    onClose: () => onDone(false),
  });
}

export function createDrawPad(host, { page, legacy = '', onChange, date }) {
  const padDate = () => date || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  page.paper = page.paper || 'lined';
  page.strokes = page.strokes || [];
  page.items = page.items || [];
  const P = state.profile;
  let tool = 'pen', color = INKS[0], size = 3.5, selected = null, panel = '', sawPen = false;
  const undo = [];

  host.innerHTML = `
    <div class="pad-tools">
      <button class="tool on" data-tool="pen" title="펜">${icon('pen')}</button>
      <button class="tool" data-tool="marker" title="형광펜">${icon('marker')}</button>
      <button class="tool" data-tool="stroke" title="획 지우개 (한 획씩)">${icon('strokeErase')}</button>
      <button class="tool" data-tool="erase" title="부분 지우개">${icon('eraser')}</button>
      <span class="sep"></span>
      <button class="tool" data-tool="hand" title="옮기기·크기 조절">${icon('hand')}</button>
      <button class="tool" data-tool="text" title="글쓰기">${icon('text')}</button>
      <button class="tool" data-panel="sticker" title="스티커">${icon('sticker')}</button>
      <button class="tool" data-panel="tape" title="마스킹테이프">${icon('tape')}</button>
      <button class="tool" data-panel="paper" title="메모지">${icon('paper')}</button>
      <label class="tool" title="사진 올리기">${icon('image')}<input type="file" accept="image/*" multiple data-photo hidden></label>
      <span class="spacer"></span>
      <button class="tool" data-act="undo" title="실행 취소">${icon('undo')}</button>
      <button class="tool" data-act="clear" title="모두 지우기">${icon('trash')}</button>
    </div>
    <div class="pad-tools" data-penopts>
      ${INKS.map((c, i) => `<button class="sw ${i === 0 ? 'on' : ''}" data-color="${c}" style="background:${c}" aria-label="펜 색"></button>`).join('')}
      <label class="sw custom" title="색 직접 고르기"><input type="color" data-custom value="#2b2522"></label>
      <input type="range" min="1" max="14" step="0.5" value="${size}" data-size aria-label="굵기" title="굵기">
      <button class="chip ${P.inkCorrect ? 'on' : ''}" data-act="correct" title="손떨림을 줄이고 직선을 반듯하게">글씨 보정</button>
    </div>
    <div class="pad-panel" data-panelbox hidden></div>
    <div class="row small" style="margin-bottom:8px"><span class="muted">내지</span>
      <div class="chips scroll paper-chips">${PAPER_STYLES.map(([k, l]) => `<button class="chip ${page.paper === k ? 'on' : ''}" data-paper="${k}">${l}</button>`).join('')}</div></div>
    <div class="pad paper-${page.paper}">
      <div class="items"></div>
      <canvas width="${W * S}" height="${H * S}" data-ink></canvas>
      <canvas width="${W * S}" height="${H * S}" data-live style="pointer-events:none"></canvas>
    </div>
    <div class="pad-sel" data-sel hidden>
      <span class="small muted">크기</span><input type="range" min="0.05" max="1" step="0.01" data-iw>
      <span class="small muted">회전</span><input type="range" min="-180" max="180" step="1" data-ir>
      <button class="btn sm" data-act="edit" hidden>${icon('edit', 14)} 글 수정</button>
      <button class="btn sm" data-act="front">${icon('front', 14)} 맨 앞</button>
      <button class="btn sm" data-act="dup">복제</button>
      <button class="btn sm danger" data-act="del">${icon('trash', 14)} 삭제</button>
      <div class="chips frame-chips" data-frames hidden>${PHOTO_FRAMES.map(([k, l]) => `<button class="chip" data-frame="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="tiny muted mt">${P.penOnly ? '펜슬 전용 모드: 손가락 터치는 그려지지 않아요' : '애플펜슬로 쓰기 시작하면 손바닥 터치는 자동으로 무시돼요'} · 두 손가락으로 아이템 크기·각도 조절</div>`;

  const pad = host.querySelector('.pad');
  const cv = host.querySelector('[data-ink]'), live = host.querySelector('[data-live]');
  const ctx = cv.getContext('2d'), lctx = live.getContext('2d');
  ctx.setTransform(S, 0, 0, S, 0, 0); lctx.setTransform(S, 0, 0, S, 0, 0);
  const layer = host.querySelector('.items');
  let legacyImg = null;

  const changed = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => onChange(page), 400); }; })();

  function renderInk() {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore();
    if (legacyImg) ctx.drawImage(legacyImg, 0, 0, W, H);
    for (const s of page.strokes) drawStroke(ctx, s);
  }
  if (legacy) loadImage(legacy).then((img) => { legacyImg = img; renderInk(); }).catch(() => {});
  renderInk();

  function renderItems() {
    layer.innerHTML = page.items.map((it) => `<div class="pitem k-${it.k} ${selected === it ? 'sel' : ''}" data-id="${it.id}" style="${itemStyle(it)}">${itemInner(it)}</div>`).join('');
    syncSel();
  }
  function syncSel() {
    const box = host.querySelector('[data-sel]');
    box.hidden = !selected;
    if (!selected) return;
    const isText = (selected.k === 'text' && selected.fx !== 'collage') || selected.k === 'emoji';
    const fr = box.querySelector('[data-frames]'); fr.hidden = selected.k !== 'photo';
    if (selected.k === 'photo') fr.querySelectorAll('[data-frame]').forEach((b) => b.classList.toggle('on', b.dataset.frame === (selected.frame || 'polaroid')));
    const iw = box.querySelector('[data-iw]');
    if (isText) { iw.min = 2; iw.max = 14; iw.step = 0.25; iw.value = selected.k === 'text' ? selected.f : selected.s || 9; }
    else { iw.min = 0.05; iw.max = 1; iw.step = 0.01; iw.value = selected.w; }
    box.querySelector('[data-ir]').value = selected.r || 0;
    box.querySelector('[data-act=edit]').hidden = selected.k !== 'text';
  }
  const elOf = (it) => layer.querySelector(`[data-id="${it.id}"]`);
  const applyStyle = (it) => { const e = elOf(it); if (!e) return; e.setAttribute('style', itemStyle(it)); if (it.k === 'text' && it.fx !== 'collage') e.innerHTML = itemInner(it); };
  renderItems();

  function setTool(t) {
    tool = t;
    host.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
    pad.classList.toggle('arrange', t === 'hand' || t === 'text');
    host.querySelector('[data-penopts]').hidden = !(t === 'pen' || t === 'marker');
    if (t !== 'hand') { selected = null; renderItems(); }
  }
  const zTop = () => Math.max(0, ...page.items.map((i) => i.z || 0)) + 1;
  function addItem(it) {
    it.id = uid();
    it.z = it.k === 'paper' ? Math.min(1, ...page.items.map((i) => i.z || 1)) - 1 : zTop();
    page.items.push(it);
    selected = it;
    setTool('hand'); selected = it; renderItems(); changed();
  }
  // 화면에 보이는 종이 영역 가운데
  function visibleCenter() {
    const r = pad.getBoundingClientRect();
    const top = Math.max(r.top, 80), bottom = Math.min(r.bottom, innerHeight - 80);
    const y = bottom > top ? ((top + bottom) / 2 - r.top) / r.height : 0.4;
    return { x: 0.5 + (Math.random() - 0.5) * 0.12, y: Math.min(0.9, Math.max(0.1, y + (Math.random() - 0.5) * 0.08)) };
  }

  // ---------- 패널 (스티커 / 테이프) ----------
  let stTab = '소품';
  const ST_TABS = () => [['날짜', null], ['낙서', DOODLE_STICKERS], ['음료', DRINK_STICKERS], ['교과서', BOOK_STICKERS], ['소품', STICKERS], ['Y2K', Y2K_STICKERS], ['패턴 말풍선', PATTERN_BUBBLES], ...STICKER_GROUPS.map((g) => [g.name, g.items]), ['라벨', LABEL_STICKERS], ['감정', null], ['날씨', null]];
  function renderPanel() {
    const box = host.querySelector('[data-panelbox]');
    box.hidden = !panel;
    host.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('on', b.dataset.panel === panel));
    if (!panel) return;
    if (panel === 'tape') {
      box.innerHTML = `<div class="tape-grid">${ALL_TAPES().map((t) => `<button data-add-tape="${t.id}" title="${t.label}">${t.svg()}</button>`).join('')}</div>`;
    } else if (panel === 'paper') {
      box.innerHTML = `<div class="tiny muted">메모지를 붙이고 펜이나 글쓰기로 위에 써보세요</div><div class="st-grid paper-grid">${PAPERS.map((p) => `<button data-add-paper="${p.id}">${p.svg()}</button>`).join('')}</div>`;
    } else {
      const tabs = ST_TABS();
      const cur = tabs.find((t) => t[0] === stTab) || tabs[0];
      let grid;
      if (cur[0] === '날짜') {
        const ymd = padDate();
        grid = `<div class="tiny muted mt">큰 날짜 (${ymd})</div><div class="st-grid wide">${DATE_TEXT_STYLES.map(([k, l]) => `<button data-add-st="dt:${k}:${ymd}" title="${l}">${dateTextSvg(k, ymd)}</button>`).join('')}</div>
          <div class="tiny muted mt">날짜 동그라미</div><div class="st-grid small">${DATE_STICKERS.map((s) => `<button data-add-st="${s.id}">${s.svg()}</button>`).join('')}</div>
          <div class="tiny muted mt">오늘 기록으로 만드는 카드 (기록이 바뀌면 자동으로 갱신돼요)</div><div class="row"><button class="btn sm" data-add-live="timetable">${icon('grid', 14)} 타임테이블</button><button class="btn sm" data-add-live="todocard">${icon('check', 14)} 할 일 카드</button></div>`;
      } else if (cur[0] === '감정') grid = `<div class="st-grid small">${MOODS.map((m) => `<button data-add-st="mood:${m.id}" title="${m.label}">${moodSvg(m.id)}</button>`).join('')}</div>`;
      else if (cur[0] === '날씨') grid = `<div class="st-grid small">${WEATHERS.map((w) => `<button data-add-st="weather:${w.id}" title="${w.label}">${weatherSvg(w.id)}</button>`).join('')}</div>`;
      else grid = `<div class="st-grid">${cur[1].map((s) => `<button data-add-st="${s.id}">${s.svg()}</button>`).join('')}</div>`;
      box.innerHTML = `<div class="chips scroll">${tabs.map(([n]) => `<button class="chip ${n === cur[0] ? 'on' : ''}" data-sttab="${n}">${n}</button>`).join('')}</div>${grid}`;
    }
  }

  // ---------- 그리기 ----------
  let stroke = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H, e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5]; };
  const ignoreTouch = (e) => e.pointerType === 'touch' && (P.penOnly || sawPen);

  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'pen') sawPen = true;
    if (ignoreTouch(e) || stroke) return;
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    const p = pos(e);
    if (tool === 'stroke') { stroke = { id: e.pointerId, erase: true }; eraseAt(p); return; }
    const s = { t: tool === 'erase' ? 'erase' : tool, c: color, w: size, pen: e.pointerType === 'pen', p: [...p] };
    stroke = { id: e.pointerId, s, last: p, lastMid: p };
    if (s.t !== 'marker') drawStroke(ctx, { ...s, p: [...p] });
  });
  cv.addEventListener('pointermove', (e) => {
    if (!stroke || e.pointerId !== stroke.id) return;
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    for (const ev of evs.length ? evs : [e]) {
      const p = pos(ev);
      if (stroke.erase) { eraseAt(p); continue; }
      const s = stroke.s;
      s.p.push(...p);
      if (s.t === 'marker') continue;
      const mid = [(stroke.last[0] + p[0]) / 2, (stroke.last[1] + p[1]) / 2];
      ctx.save();
      ctx.lineCap = 'round';
      if (s.t === 'erase') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = s.w * 3; }
      else { ctx.strokeStyle = s.c; ctx.lineWidth = pw(s, (stroke.last[2] + p[2]) / 2); }
      ctx.beginPath(); ctx.moveTo(stroke.lastMid[0], stroke.lastMid[1]); ctx.quadraticCurveTo(stroke.last[0], stroke.last[1], mid[0], mid[1]); ctx.stroke();
      ctx.restore();
      stroke.last = p; stroke.lastMid = mid;
    }
    if (stroke.s && stroke.s.t === 'marker') {
      lctx.save(); lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, live.width, live.height); lctx.restore();
      lctx.globalAlpha = 0.38; lctx.strokeStyle = stroke.s.c; lctx.lineWidth = stroke.s.w * 4; lctx.lineCap = 'round'; lctx.lineJoin = 'round';
      pathOf(lctx, stroke.s.p); lctx.stroke(); lctx.globalAlpha = 1;
    }
  });
  const end = (e) => {
    if (!stroke || e.pointerId !== stroke.id) return;
    const st = stroke; stroke = null;
    if (st.erase) { if (st.removed?.length) { undo.push({ a: 'del', list: st.removed }); changed(); } return; }
    const s = st.s;
    if (P.inkCorrect && s.t !== 'erase') s.p = correct(s.p, P.inkStrength || 3);
    s.p = round(s.p);
    page.strokes.push(s);
    undo.push({ a: 'add', s });
    lctx.save(); lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, live.width, live.height); lctx.restore();
    renderInk();
    changed();
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);

  function eraseAt([x, y]) {
    const hit = [];
    page.strokes.forEach((s, i) => { if (s.t !== 'erase' && hitStroke(s, x, y, 10)) hit.push(i); });
    if (!hit.length) return;
    stroke.removed = stroke.removed || [];
    for (let k = hit.length - 1; k >= 0; k--) stroke.removed.push({ i: hit[k], s: page.strokes.splice(hit[k], 1)[0] });
    renderInk();
  }

  // ---------- 아이템 조작 (드래그 / 두 손가락) ----------
  const pts = new Map();
  let gesture = null;
  const rel = (e) => { const r = pad.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, px: e.clientX, py: e.clientY }; };
  layer.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.pitem');
    if (tool === 'text' && el && el.classList.contains('k-text')) {
      const it = page.items.find((i) => i.id === el.dataset.id);
      textEditor(it, () => { renderItems(); changed(); });
      return;
    }
    if (tool === 'text') { // 사진·카드 위에도 바로 글쓰기
      const p = rel(e);
      const it = { k: 'text', text: '', font: P.memoFont || 'gaegu', color, f: 5, x: p.x, y: p.y, r: 0 };
      textEditor(it, (ok) => { if (ok && it.text.trim()) addItem(it); });
      return;
    }
    if (tool !== 'hand') return;
    if (!el) { if (!pts.size) { selected = null; renderItems(); } return; }
    const it = page.items.find((i) => i.id === el.dataset.id);
    if (!it) return;
    e.preventDefault();
    layer.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, rel(e));
    if (selected !== it && pts.size === 1) { selected = it; layer.querySelectorAll('.pitem').forEach((x) => x.classList.toggle('sel', x === el)); syncSel(); }
    startGesture();
  });
  function startGesture() {
    if (!selected) return;
    const arr = [...pts.values()];
    const it = selected;
    if (arr.length === 1) gesture = { mode: 'drag', sx: arr[0].x, sy: arr[0].y, ox: it.x, oy: it.y };
    else if (arr.length >= 2) {
      const [a, b] = arr;
      gesture = { mode: 'pinch', d: Math.hypot(b.px - a.px, b.py - a.py), ang: Math.atan2(b.py - a.py, b.px - a.px), ow: it.w, of: it.f, os: it.s || 9, or: it.r || 0, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, ox: it.x, oy: it.y };
    }
  }
  layer.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !selected || !gesture) return;
    pts.set(e.pointerId, rel(e));
    const arr = [...pts.values()], it = selected;
    if (gesture.mode === 'drag' && arr.length === 1) {
      it.x = Math.min(1.05, Math.max(-0.05, gesture.ox + arr[0].x - gesture.sx));
      it.y = Math.min(1.05, Math.max(-0.05, gesture.oy + arr[0].y - gesture.sy));
    } else if (gesture.mode === 'pinch' && arr.length >= 2) {
      const [a, b] = arr;
      const k = Math.hypot(b.px - a.px, b.py - a.py) / (gesture.d || 1);
      const da = ((Math.atan2(b.py - a.py, b.px - a.px) - gesture.ang) * 180) / Math.PI;
      if (it.k === 'text' && it.fx !== 'collage') it.f = Math.min(14, Math.max(2, gesture.of * k));
      else if (it.k === 'emoji') it.s = Math.min(30, Math.max(3, gesture.os * k));
      else it.w = Math.min(1.2, Math.max(0.04, gesture.ow * k));
      it.r = Math.round(gesture.or + da);
      it.x = gesture.ox + (a.x + b.x) / 2 - gesture.cx; it.y = gesture.oy + (a.y + b.y) / 2 - gesture.cy;
    }
    applyStyle(it);
  });
  const lEnd = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size) startGesture(); else { gesture = null; syncSel(); changed(); }
  };
  layer.addEventListener('pointerup', lEnd);
  layer.addEventListener('pointercancel', lEnd);
  layer.addEventListener('dblclick', (e) => {
    const el = e.target.closest('.pitem.k-text');
    if (!el) return;
    const it = page.items.find((i) => i.id === el.dataset.id);
    textEditor(it, () => { renderItems(); changed(); });
  });

  // ---------- 툴바 ----------
  host.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tool]');
    if (t) { setTool(t.dataset.tool); return; }
    const pn = e.target.closest('[data-panel]');
    if (pn) { panel = panel === pn.dataset.panel ? '' : pn.dataset.panel; renderPanel(); return; }
    const st = e.target.closest('[data-add-st]');
    if (st) {
      const ref = st.dataset.addSt, c = visibleCenter();
      const w = ref.startsWith('dt:') ? (ref.includes(':stamp:') ? 0.26 : 0.5) : ref.includes(':') ? 0.16 : stickerDefaultW(ref);
      addItem({ k: 'sticker', ref, x: c.x, y: c.y, w, r: ref.startsWith('dt:') ? 0 : Math.round(Math.random() * 16 - 8) }); return;
    }
    const fr = e.target.closest('[data-frame]');
    if (fr && selected && selected.k === 'photo') { selected.frame = fr.dataset.frame; const el = elOf(selected); if (el) el.innerHTML = itemInner(selected); syncSel(); changed(); return; }
    const stt = e.target.closest('[data-sttab]'); if (stt) { stTab = stt.dataset.sttab; renderPanel(); return; }
    const lv = e.target.closest('[data-add-live]');
    if (lv) { const c = visibleCenter(); addItem({ k: lv.dataset.addLive, ymd: padDate(), x: c.x, y: c.y, w: lv.dataset.addLive === 'timetable' ? 0.36 : 0.44, r: 0 }); return; }
    const pa = e.target.closest('[data-add-paper]');
    if (pa) { const c = visibleCenter(); addItem({ k: 'paper', ref: pa.dataset.addPaper, x: c.x, y: c.y, w: paperDefaultW(pa.dataset.addPaper), r: Math.round(Math.random() * 6 - 3) }); return; }
    const tp = e.target.closest('[data-add-tape]');
    if (tp) { const c = visibleCenter(); addItem({ k: 'tape', ref: tp.dataset.addTape, x: c.x, y: c.y, w: 0.34, r: Math.round(Math.random() * 20 - 10) }); return; }
    const c = e.target.closest('[data-color]');
    if (c) { color = c.dataset.color; host.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('on', b === c)); return; }
    const pp = e.target.closest('[data-paper]');
    if (pp) {
      page.paper = pp.dataset.paper;
      PAPER_STYLES.forEach(([k]) => pad.classList.remove('paper-' + k)); pad.classList.add('paper-' + page.paper);
      host.querySelectorAll('[data-paper]').forEach((b) => b.classList.toggle('on', b === pp));
      changed(); return;
    }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (!a) return;
    if (a === 'correct') { P.inkCorrect = !P.inkCorrect; save(); e.target.closest('[data-act]').classList.toggle('on', P.inkCorrect); }
    if (a === 'undo') {
      const u = undo.pop();
      if (!u) return;
      if (u.a === 'add') { const i = page.strokes.lastIndexOf(u.s); if (i >= 0) page.strokes.splice(i, 1); }
      if (u.a === 'del') u.list.slice().reverse().forEach(({ i, s }) => page.strokes.splice(Math.min(i, page.strokes.length), 0, s));
      if (u.a === 'clear') { page.strokes = u.strokes; page.items = u.items; legacyImg = u.legacyImg; onChange(page, { legacy: u.legacy }); renderItems(); }
      renderInk(); changed();
    }
    if (a === 'clear' && confirm('손글씨와 스티커·사진을 모두 지울까요? (실행 취소 가능)')) {
      undo.push({ a: 'clear', strokes: page.strokes, items: page.items, legacyImg, legacy });
      page.strokes = []; page.items = []; legacyImg = null; selected = null;
      onChange(page, { legacy: '' });
      renderInk(); renderItems();
    }
    if (!selected) return;
    if (a === 'del') { page.items = page.items.filter((i) => i !== selected); selected = null; renderItems(); changed(); }
    if (a === 'front') { selected.z = zTop(); applyStyle(selected); changed(); }
    if (a === 'dup') { const c2 = { ...selected, x: selected.x + 0.04, y: selected.y + 0.04 }; delete c2.id; addItem(c2); }
    if (a === 'edit') textEditor(selected, () => { renderItems(); changed(); });
  });
  host.addEventListener('input', (e) => {
    if (e.target.matches('[data-size]') && e.target.closest('[data-penopts]')) size = Number(e.target.value);
    if (e.target.matches('[data-custom]')) { color = e.target.value; host.querySelectorAll('[data-color]').forEach((b) => b.classList.remove('on')); }
    if (!selected) return;
    if (e.target.matches('[data-iw]')) {
      const v = Number(e.target.value);
      if (selected.k === 'text' && selected.fx !== 'collage') selected.f = v; else if (selected.k === 'emoji') selected.s = v; else selected.w = v;
      applyStyle(selected); changed();
    }
    if (e.target.matches('[data-ir]')) { selected.r = Number(e.target.value); applyStyle(selected); changed(); }
  });
  host.addEventListener('change', async (e) => {
    if (!e.target.matches('[data-photo]') || !e.target.files[0]) return;
    const files = [...e.target.files].slice(0, 9);
    e.target.value = '';
    const c = visibleCenter();
    if (files.length === 1) {
      const src = await resizeImage(files[0], 1000, 0.82);
      addItem({ k: 'photo', src, frame: 'polaroid', x: c.x, y: c.y, w: 0.42, r: Math.round(Math.random() * 10 - 5) });
      return;
    }
    // 여러 장: 콜라주 배치 (2열 또는 3열)
    const cols = files.length <= 4 ? 2 : 3, cw = 0.9 / cols, rowsN = Math.ceil(files.length / cols);
    const top = Math.max(0.08, Math.min(0.92 - rowsN * cw * 0.75, c.y - (rowsN * cw * 0.75) / 2));
    for (let i = 0; i < files.length; i++) {
      const src = await resizeImage(files[i], 800, 0.8);
      const col = i % cols, row = Math.floor(i / cols);
      const it = { k: 'photo', src, frame: 'rounded', x: 0.05 + cw * col + cw / 2, y: top + row * cw * 0.75 + cw * 0.36, w: cw * 0.94, r: 0 };
      it.id = uid(); it.z = zTop(); page.items.push(it);
    }
    setTool('hand'); renderItems(); changed();
  });
  return { addItem: (it) => { const c = visibleCenter(); addItem({ x: c.x, y: c.y, r: 0, ...it }); pad.scrollIntoView({ behavior: 'smooth', block: 'center' }); } };
}

/** 꾸민 페이지를 그대로 작게 보여주기 (편집 불가 미리보기) */
export function renderPagePreview(host, page, scale = 0.5) {
  page = page || { paper: 'blank', strokes: [], items: [] };
  host.innerHTML = `<div class="pad preview paper-${page.paper || 'lined'}"><div class="items">${(page.items || []).slice().sort((a, b) => (a.z || 0) - (b.z || 0)).map((it) => `<div class="pitem k-${it.k}" style="${itemStyle(it)}">${itemInner(it)}</div>`).join('')}</div><canvas width="${Math.round(W * scale)}" height="${Math.round(H * scale)}"></canvas></div>`;
  const cv = host.querySelector('canvas');
  const ctx = cv.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  for (const st of page.strokes || []) {
    if (st.t === 'marker') { // 미리보기는 단순하게
      ctx.save(); ctx.globalAlpha = 0.38; ctx.strokeStyle = st.c; ctx.lineWidth = st.w * 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; pathOf(ctx, st.p); ctx.stroke(); ctx.restore();
    } else drawStroke(ctx, st);
  }
}

/** 예전 버전(그림 PNG + 이모지 스티커) → 새 페이지 구조 */
export function migratePage(d) {
  if (d.page) return d.page;
  const items = (d.stickers || []).map((s, i) => ({ id: 'old' + i, k: 'emoji', text: s.e, x: s.x, y: s.y, s: s.s, r: s.r || 0, z: i + 1 }));
  d.page = { paper: 'lined', strokes: [], items };
  delete d.stickers;
  return d.page;
}
