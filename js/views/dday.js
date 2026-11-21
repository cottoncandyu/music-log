import { state, save } from '../store.js';
import { esc, today, fmtDate, ddayLabel, ddayDiff, uid, canvasToBlob, shareOrDownload, loadImage, resizeImage, wrapText } from '../util.js';
import { modal, confirmBox, toast } from '../ui.js';

const BGS = [
  ['#f8b195', '#c06c84'], ['#a8edea', '#fed6e3'], ['#2c3e50', '#4ca1af'], ['#fbc2eb', '#a6c1ee'],
  ['#fdfcfb', '#e2d1c3'], ['#0f2027', '#2c5364'], ['#ffecd2', '#fcb69f'], ['#1d1b18', '#3a332a'],
];
const SIZES = [
  ['ipad-p', 'iPad 세로', 2048, 2732], ['ipad-l', 'iPad 가로', 2732, 2048],
  ['iphone', 'iPhone', 1179, 2556], ['android', '갤럭시', 1440, 3120],
];

function ddayForm(d, after) {
  const isNew = !d;
  d = d || { id: uid(), title: '', date: today(), main: state.ddays.length === 0 };
  modal(`<h2>${isNew ? '📅 새 디데이' : '✏️ 디데이 수정'}<button class="icon-btn" data-close>✕</button></h2>
    <form class="form">
      <label class="field"><span>이름</span><input type="text" name="title" value="${esc(d.title)}" required placeholder="예: 수능, 토익 시험, 여행"></label>
      <label class="field"><span>날짜</span><input type="date" name="date" value="${d.date}" required></label>
      <label class="row"><input type="checkbox" name="main" ${d.main ? 'checked' : ''}> 대표 디데이 (홈·위젯에 크게 표시)</label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      f.onsubmit = (e) => {
        e.preventDefault();
        d.title = f.title.value.trim(); d.date = f.date.value;
        if (f.main.checked) state.ddays.forEach((x) => { x.main = false; });
        d.main = f.main.checked;
        if (isNew) state.ddays.push(d);
        save(); close(); after();
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox(`'${d.title}' 디데이를 삭제할까요?`, '삭제')) { state.ddays = state.ddays.filter((x) => x !== d); save(); after(); }
      });
    },
  });
}

async function drawWallpaper(canvas, o) {
  const [, , W, H] = SIZES.find((s) => s[0] === o.size);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (o.photo) {
    const img = await loadImage(o.photo);
    const r = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * r) / 2, (H - img.height * r) / 2, img.width * r, img.height * r);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, 0, W, H);
  } else {
    const [a, b] = BGS[o.bg];
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(1, b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const light = o.photo ? false : (() => { const hex = BGS[o.bg][0]; const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) > 170; })();
  const ink = light ? '#2f2a24' : '#ffffff';
  const sub = light ? 'rgba(47,42,36,.7)' : 'rgba(255,255,255,.82)';
  const base = Math.min(W, H);
  const font = (w, px) => `${w} ${px}px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (!light) { ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = base * 0.02; }

  const list = o.ids.map((id) => state.ddays.find((x) => x.id === id)).filter(Boolean);
  const todos = o.todos ? state.todos.filter((t) => t.date === today()) : [];
  // 잠금화면 시계를 피하도록 기본 위치를 화면 중간~하단에
  const blockH = base * 0.36 + (list.length - 1) * base * 0.13 + (o.quote ? base * 0.08 : 0) + (todos.length ? base * 0.06 * (Math.min(todos.length, 6) + 1) : 0);
  let y = o.pos === 'top' ? H * 0.12 : o.pos === 'middle' ? (H - blockH) / 2 : H * 0.9 - blockH;
  if (o.pos === 'middle') y = Math.max(H * 0.3, y);

  list.forEach((d, i) => {
    if (i === 0) {
      ctx.fillStyle = sub; ctx.font = font(600, base * 0.05); y += base * 0.06; ctx.fillText(d.title, W / 2, y);
      ctx.fillStyle = ink; ctx.font = font(900, base * 0.2); y += base * 0.2; ctx.fillText(ddayLabel(d.date), W / 2, y);
      ctx.fillStyle = sub; ctx.font = font(500, base * 0.034); y += base * 0.07; ctx.fillText(fmtDate(d.date, true), W / 2, y);
    } else {
      ctx.font = font(700, base * 0.05); y += base * 0.1; ctx.fillStyle = ink;
      ctx.fillText(`${d.title}  ${ddayLabel(d.date)}`, W / 2, y);
    }
  });
  if (o.quote) {
    ctx.fillStyle = ink; ctx.font = font(600, base * 0.042);
    for (const line of wrapText(ctx, o.quote, W * 0.8).slice(0, 2)) { y += base * 0.075; ctx.fillText(line, W / 2, y); }
  }
  if (todos.length) {
    y += base * 0.08;
    const boxW = Math.min(W * 0.8, base * 0.8), x0 = (W - boxW) / 2, lh = base * 0.058;
    const shown = todos.slice(0, 6);
    ctx.shadowBlur = 0;
    ctx.fillStyle = light ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.28)';
    const bh = lh * (shown.length + 1) + base * 0.03;
    roundRect(ctx, x0, y - lh * 0.2, boxW, bh, base * 0.03); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = ink; ctx.font = font(700, base * 0.036);
    ctx.fillText('오늘 할 일', x0 + base * 0.04, y + lh * 0.7);
    ctx.font = font(500, base * 0.034);
    shown.forEach((t, i) => ctx.fillText(`${t.done ? '☑︎' : '☐'}  ${t.text}`.slice(0, 26), x0 + base * 0.04, y + lh * (i + 1.75)));
    ctx.textAlign = 'center';
  }
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function wallpaper() {
  if (!state.ddays.length) return toast('먼저 디데이를 추가해주세요');
  const main = state.ddays.find((d) => d.main) || state.ddays[0];
  const isIpad = /iPad|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  const o = { size: isIpad ? 'ipad-p' : /iPhone/.test(navigator.userAgent) ? 'iphone' : 'ipad-p', bg: 0, photo: '', pos: 'middle', quote: '', ids: [main.id], todos: false };

  modal(`<h2>🖼 디데이 배경화면 만들기<button class="icon-btn" data-close>✕</button></h2>
    <div class="grid two">
      <div><img class="wp-preview" data-prev alt="미리보기"></div>
      <div class="form">
        <label class="field"><span>표시할 디데이 (첫 번째가 크게)</span>
          <div class="chips">${state.ddays.map((d) => `<button type="button" class="chip ${o.ids.includes(d.id) ? 'on' : ''}" data-id="${d.id}">${esc(d.title)} ${ddayLabel(d.date)}</button>`).join('')}</div></label>
        <label class="field"><span>화면 크기</span><select data-k="size">${SIZES.map((s) => `<option value="${s[0]}" ${s[0] === o.size ? 'selected' : ''}>${s[1]} (${s[2]}×${s[3]})</option>`).join('')}</select></label>
        <label class="field"><span>배경</span><div class="bg-pick">${BGS.map((b, i) => `<button type="button" data-bg="${i}" class="${i === 0 ? 'on' : ''}" style="background:linear-gradient(135deg,${b[0]},${b[1]})"></button>`).join('')}
          <label class="btn sm">📷 사진<input type="file" accept="image/*" data-photo hidden></label></div></label>
        <label class="field"><span>위치</span><select data-k="pos"><option value="top">위</option><option value="middle" selected>가운데</option><option value="bottom">아래</option></select></label>
        <label class="field"><span>응원 문구 (선택)</span><input type="text" data-k="quote" placeholder="예: 할 수 있다!"></label>
        <label class="row"><input type="checkbox" data-k="todos"> 오늘 할 일 목록 넣기</label>
        <button class="btn primary lg" data-save>💾 이미지 저장/공유</button>
        <p class="tiny muted">저장 후 <b>사진 앱 → 공유 → 배경화면으로 사용</b>을 누르면 잠금·홈 화면에 설정돼요.</p>
      </div>
    </div>`, {
    wide: true,
    onMount(box) {
      const canvas = document.createElement('canvas');
      const prev = box.querySelector('[data-prev]');
      let busy = false, again = false;
      const redraw = async () => {
        if (busy) { again = true; return; }
        busy = true;
        await drawWallpaper(canvas, o);
        const small = document.createElement('canvas');
        const r = 700 / Math.max(canvas.width, canvas.height);
        small.width = canvas.width * r; small.height = canvas.height * r;
        small.getContext('2d').drawImage(canvas, 0, 0, small.width, small.height);
        prev.src = small.toDataURL('image/jpeg', 0.85);
        busy = false;
        if (again) { again = false; redraw(); }
      };
      redraw();
      box.addEventListener('click', async (e) => {
        const id = e.target.closest('[data-id]');
        if (id) {
          const k = id.dataset.id;
          o.ids = o.ids.includes(k) ? o.ids.filter((x) => x !== k) : [...o.ids, k];
          if (!o.ids.length) o.ids = [k];
          box.querySelectorAll('[data-id]').forEach((b) => b.classList.toggle('on', o.ids.includes(b.dataset.id)));
          return redraw();
        }
        const bg = e.target.closest('[data-bg]');
        if (bg) { o.bg = Number(bg.dataset.bg); o.photo = ''; box.querySelectorAll('[data-bg]').forEach((b) => b.classList.toggle('on', b === bg)); return redraw(); }
        if (e.target.closest('[data-save]')) {
          await drawWallpaper(canvas, o);
          const blob = await canvasToBlob(canvas, 'image/png');
          const r = await shareOrDownload(blob, `dday-${today()}.png`, '디데이 배경화면');
          if (r === 'downloaded') toast('이미지를 저장했어요');
        }
      });
      box.addEventListener('change', async (e) => {
        if (e.target.matches('[data-photo]') && e.target.files[0]) {
          o.photo = await resizeImage(e.target.files[0], 2800, 0.9);
          box.querySelectorAll('[data-bg]').forEach((b) => b.classList.remove('on'));
          return redraw();
        }
        const k = e.target.dataset.k;
        if (k) { o[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; redraw(); }
      });
      box.addEventListener('input', (e) => { if (e.target.dataset.k === 'quote') { o.quote = e.target.value; redraw(); } });
    },
  });
}

export default {
  render(el) {
    const list = state.ddays.slice().sort((a, b) => {
      const da = ddayDiff(a.date), db = ddayDiff(b.date);
      if ((da >= 0) !== (db >= 0)) return da >= 0 ? -1 : 1;
      return Math.abs(da) - Math.abs(db);
    });
    el.innerHTML = `
      <div class="row mb"><button class="btn primary" data-act="new">＋ 새 디데이</button>
        <button class="btn soft" data-act="wp">🖼 배경화면 만들기</button></div>
      ${list.length ? `<div class="stack">${list.map((d) => `
        <div class="card dday-card">
          <div class="d">${ddayLabel(d.date)}</div>
          <div class="t"><b>${esc(d.title)}</b> ${d.main ? '<span class="tag">⭐ 대표</span>' : ''}<div class="small muted">${fmtDate(d.date, true)}</div></div>
          <button class="icon-btn" data-star="${d.id}" title="대표로">${d.main ? '⭐' : '☆'}</button>
          <button class="icon-btn" data-edit="${d.id}">✏️</button>
        </div>`).join('')}</div>` : '<div class="card empty">시험, 목표, 기념일까지 남은 날을 세어보세요</div>'}
      <div class="card mt small muted">
        <b>📱 위젯처럼 쓰는 방법</b><br>
        · <b>배경화면</b>: ‘배경화면 만들기’로 이미지를 저장 → 사진 앱에서 배경화면으로 설정<br>
        · <b>홈 화면</b>: Safari 공유 버튼 → ‘홈 화면에 추가’ 후 앱을 열면 첫 화면에 대표 디데이가 크게 보여요<br>
        · 웹앱 특성상 iOS 홈 화면 ‘위젯’ 자체는 만들 수 없어요 (네이티브 앱 필요)
      </div>`;
    const re = () => this.render(el);
    el.onclick = (e) => {
      const st = e.target.closest('[data-star]');
      if (st) { state.ddays.forEach((x) => { x.main = x.id === st.dataset.star; }); save(); return re(); }
      const ed = e.target.closest('[data-edit]');
      if (ed) return ddayForm(state.ddays.find((x) => x.id === ed.dataset.edit), re);
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'new') ddayForm(null, re);
      if (a === 'wp') wallpaper();
    };
  },
};
