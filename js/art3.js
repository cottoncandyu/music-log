// ARCHIVE 그림 3 — 콜라주 글자 · 날짜 동그라미 · 월/요일 라벨 · 패턴 말풍선 · Y2K 소품 (모두 직접 그린 SVG)
const INK = '#2b2522';
const K = (vb, inner) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), ((s ^= s >>> 16) >>> 0) / 4294967296); }
const strSeed = (str) => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };

// ---------- 콜라주(신문 오려붙인) 글자 ----------
const PAPER = ['#e8c6d3', '#c9d7e6', '#dcd4c4', '#b9cbb2', '#f1e2b0', '#2f2f33', '#8c6f88', '#c6b4dc', '#f3cfb3', '#a7bfd8', '#fbfaf6', '#d97a7a', '#6f8f86', '#f0b8c8', '#e6d36a', '#5a6f9a'];
const FONTS = ["'Abril Fatface'", "'Playfair Display'", "'Bebas Neue'", "'Archivo Black'", "'Courier Prime'", "'DM Serif Display'", "'Alfa Slab One'", 'Anton', "'Black Han Sans'", "'Do Hyeon'", "'Song Myung'", "'Gasoek One'", "'Bagel Fat One'", "'Noto Serif KR'", 'Lobster', 'Fredoka'];
const dark = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) < 120; };
/** 글자마다 다른 종이·글꼴로 오려 붙인 느낌의 글자 스티커 */
export function collageSvg(text, seed = 1) {
  const r = rng(seed + strSeed(text));
  const chars = [...String(text).slice(0, 24)];
  let x = 4, tiles = '';
  const H = 64;
  for (const ch of chars) {
    if (ch === ' ') { x += 18; continue; }
    const wide = /[ㄱ-힝]/.test(ch) || /[MWmw@]/.test(ch);
    const w = wide ? 58 : 46 + Math.round(r() * 6);
    const bg = PAPER[Math.floor(r() * PAPER.length)];
    const fg = dark(bg) ? '#fbfaf6' : r() < 0.7 ? '#1f1f22' : ['#b8324a', '#2f4f8f', '#3f6f4a'][Math.floor(r() * 3)];
    const font = FONTS[Math.floor(r() * FONTS.length)];
    const rot = (r() * 14 - 7).toFixed(1), dy = (r() * 6 - 3).toFixed(1);
    const j = () => (r() * 4 - 2).toFixed(1);
    const pts = `${j()},${j()} ${w + +j()},${j()} ${w + +j()},${H + +j()} ${j()},${H + +j()}`;
    const italic = r() < 0.2 ? 'font-style="italic"' : '';
    tiles += `<g transform="translate(${x} ${4 + +dy}) rotate(${rot} ${w / 2} ${H / 2})"><polygon points="${pts}" fill="${bg}"/>${r() < 0.25 ? `<polygon points="${pts}" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>` : ''}
      <text x="${w / 2}" y="${H / 2 + 2}" text-anchor="middle" dominant-baseline="middle" font-family="${esc(font)}, 'Black Han Sans', serif" font-size="${wide ? 40 : 44 + Math.round(r() * 8)}" font-weight="700" ${italic} fill="${fg}">${esc(ch)}</text></g>`;
    x += w + 3;
  }
  return K(`0 0 ${Math.max(60, x + 4)} ${H + 12}`, tiles);
}

// ---------- 날짜 동그라미 1~31 ----------
const NUMC = ['#ef5a5a', '#4fa6e8', '#f2c230', '#a875d1', '#5aa04a', '#f28a2e', '#ef5a8a', '#4fb0c8', '#ef6f6f', '#f2c230'];
export const dateCircle = (n) => K('0 0 100 100', `<defs><filter id="dcs"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-opacity=".18"/></filter></defs><circle cx="50" cy="50" r="44" fill="#f5f1ea" filter="url(#dcs)"/><text x="50" y="54" text-anchor="middle" dominant-baseline="middle" font-family="Fredoka, Jua, sans-serif" font-weight="700" font-size="${n > 9 ? 40 : 46}" fill="${NUMC[(n - 1) % NUMC.length]}">${n}</text>`);

// ---------- 월·요일·라벨 (오려 붙인 종이 띠) ----------
const LAB_BG = ['#e7d3e3', '#7f9ac4', '#d9c2cf', '#8ea2bf', '#c25f86', '#c9c3d6', '#6f86a8', '#e3dbe6', '#a7b4c7'];
const LAB_FONT = ["'Archivo Black'", "'Playfair Display'", 'Lobster', "'Bebas Neue'", "'DM Serif Display'", "'Permanent Marker'", "'Courier Prime'", 'Fredoka', "'Abril Fatface'"];
export const LABELS = ['JANUARY', 'February', 'MARCH', 'April', 'MAY', 'JUNE', 'JULY', 'August', 'September', 'October', 'NOVEMBER', 'DECEMBER',
  'MONDAY', 'TUESDAY', 'Wednesday', 'THURSDAY', 'FRIDAY', 'Saturday', 'SUNDAY', 'WEEKEND', 'THIS WEEK', 'TO DO', "DON'T FORGET", 'Tomorrow', 'To Buy', 'Meal Plan', 'NOTES', 'TODAY', 'Study', 'Memories'];
export function labelSvg(text) {
  const r = rng(strSeed(text));
  const bg = LAB_BG[Math.floor(r() * LAB_BG.length)];
  const fg = dark(bg) && r() < 0.6 ? '#fbfaf6' : '#1f1f22';
  const font = LAB_FONT[Math.floor(r() * LAB_FONT.length)];
  const w = Math.max(90, text.length * 22 + 30), h = 52;
  const j = () => (r() * 5 - 2.5).toFixed(1);
  return K(`0 0 ${w + 8} ${h + 8}`, `<defs><filter id="lbn"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .12 0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="screen"/></filter></defs>
    <polygon points="${4 + +j()},${4 + +j()} ${w + 4 + +j()},${4 + +j()} ${w + 4 + +j()},${h + 4 + +j()} ${4 + +j()},${h + 4 + +j()}" fill="${bg}" filter="url(#lbn)"/>
    <text x="${w / 2 + 4}" y="${h / 2 + 6}" text-anchor="middle" dominant-baseline="middle" font-family="${esc(font)}, 'Black Han Sans', sans-serif" font-size="${text.length > 9 ? 26 : 32}" font-weight="700" fill="${fg}">${esc(text)}</text>`);
}

// ---------- 패턴 말풍선 (안에 글쓰기 좋은 빈 말풍선) ----------
const burstD = (cx, cy, rx, ry, n, k) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, f = i % 2 ? k : 1; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rx * f).toFixed(1)} ${(cy + Math.sin(a) * ry * f).toFixed(1)}`; } return d + 'Z'; };
const cloudD = (cx, cy, w, h, n = 9) => { let d = ''; for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * w, y = cy + Math.sin(a) * h; if (!i) d += `M${x.toFixed(1)} ${y.toFixed(1)}`; else { const am = ((i - 0.5) / n) * Math.PI * 2; d += ` Q${(cx + Math.cos(am) * w * 1.3).toFixed(1)} ${(cy + Math.sin(am) * h * 1.3).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`; } } return d + 'Z'; };
const SHAPES = {
  burst: (w, h) => burstD(w / 2, h / 2, w / 2 - 12, h / 2 - 12, 11, 0.74),
  cloud: (w, h) => cloudD(w / 2, h / 2 - 4, w / 2 - 22, h / 2 - 18),
  oval: (w, h) => `M${w / 2} 10 C${w - 10} 10 ${w - 10} ${h - 10} ${w / 2} ${h - 10} C10 ${h - 10} 10 10 ${w / 2} 10Z`,
  speech: (w, h) => `M30 12 H${w - 30} Q${w - 10} 12 ${w - 10} 32 V${h - 44} Q${w - 10} ${h - 24} ${w - 30} ${h - 24} H64 L40 ${h - 6} L46 ${h - 24} H30 Q10 ${h - 24} 10 ${h - 44} V32 Q10 12 30 12Z`,
  round: (w, h) => `M${w / 2} 12 C${w - 12} 12 ${w - 12} ${h - 30} ${w / 2 + 10} ${h - 26} L${w / 2 - 16} ${h - 8} L${w / 2 - 6} ${h - 28} C14 ${h - 34} 14 12 ${w / 2} 12Z`,
};
const PATS = {
  stars: (id, c) => `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#fffef8"/><path d="M11 5 l1.6 3.4 3.7.4-2.8 2.5.8 3.6L11 13.1 7.7 14.9l.8-3.6-2.8-2.5 3.7-.4z" fill="${c}" opacity=".55"/></pattern>`,
  dots: (id, c) => `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#fffefb"/><circle cx="7" cy="7" r="1.8" fill="${c}" opacity=".6"/></pattern>`,
  lines: (id, c) => `<pattern id="${id}" width="20" height="18" patternUnits="userSpaceOnUse"><rect width="20" height="18" fill="#fffefb"/><path d="M0 17.5 H20" stroke="${c}" stroke-width="1" opacity=".6"/></pattern>`,
  plain: (id, c) => `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${c}" opacity=".35"/><rect width="10" height="10" fill="#fff" opacity=".55"/></pattern>`,
};
const pb = (shape, pat, ring, pc, w = 200, h = 150) => {
  const id = `pbp-${shape}-${pat}-${ring.slice(1)}`;
  const d = SHAPES[shape](w, h);
  return K(`0 0 ${w} ${h}`, `<defs>${PATS[pat](id, pc)}</defs><path d="${d}" fill="#fff" stroke="${ring}" stroke-width="12" stroke-linejoin="round"/><path d="${d}" fill="url(#${id})" stroke="#4a4048" stroke-width="1.6" stroke-linejoin="round"/>${shape === 'cloud' ? `<circle cx="${w - 30}" cy="${h - 18}" r="5" fill="#fff" stroke="#4a4048" stroke-width="1.4"/>` : ''}`);
};
export const PATTERN_BUBBLES = [
  ['burst', 'stars', '#f6c9d6', '#f3a8bf'], ['cloud', 'plain', '#cfd8f3', '#bcd2ee'], ['oval', 'dots', '#f3d2e4', '#ec9cbf'], ['speech', 'lines', '#f6c9d6', '#9ec3e8'],
  ['round', 'plain', '#f3d2e4', '#f5b7c9'], ['cloud', 'dots', '#f7d9b0', '#f0b37a'], ['burst', 'plain', '#f6a5a5', '#f8e08a'], ['oval', 'dots', '#b9d8b0', '#e8a3b8'],
  ['speech', 'plain', '#c9daf1', '#a9cdef'], ['cloud', 'stars', '#e6d4f5', '#b9a3e6'], ['burst', 'lines', '#f6c9d6', '#f2c27a'], ['round', 'dots', '#cfe8d8', '#86c79a'],
].map(([s, p, ring, pc], i) => ({ id: `pb-${i}`, w: 0.3, svg: () => pb(s, p, ring, pc) }));

// ---------- Y2K 소품 ----------
const star5 = (cx, cy, r1, r2) => { let d = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? r2 : r1, a = (i / 10) * Math.PI * 2 - Math.PI / 2; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`; } return d + 'Z'; };
const ST = star5(50, 54, 46, 21);
const chrome = (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#b9bcc4"/><stop offset=".55" stop-color="#f4f5f7"/><stop offset=".8" stop-color="#7d828c"/><stop offset="1" stop-color="#d9dbe0"/></linearGradient>`;
const heartD = 'M50 88 C18 68 8 50 12 34 C16 18 36 14 50 30 C64 14 84 18 88 34 C92 50 82 68 50 88Z';
const button = (shape, fill, holes = 4, extra = '') => `${shape.replace('FILL', fill)}<g fill="#00000055">${holes === 4 ? '<circle cx="42" cy="46" r="4"/><circle cx="58" cy="46" r="4"/><circle cx="42" cy="60" r="4"/><circle cx="58" cy="60" r="4"/>' : '<circle cx="44" cy="52" r="4"/><circle cx="56" cy="52" r="4"/>'}</g>${extra}`;
export const Y2K_STICKERS = [
  { id: 'y-feltstar', w: 0.14, svg: () => K('0 0 100 100', `<path d="${ST}" fill="#d9453f"/><path d="${star5(50, 54, 38, 17)}" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="4 3"/>`) },
  { id: 'y-denimstar', w: 0.14, svg: () => K('0 0 100 100', `<defs><pattern id="dnm" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="4" height="4" fill="#5f84b8"/><path d="M0 0V4" stroke="#7a9cc9" stroke-width="1.5"/></pattern></defs><path d="${ST}" fill="url(#dnm)"/><path d="${star5(50, 54, 38, 17)}" fill="none" stroke="#f3e3c3" stroke-width="2" stroke-dasharray="4 3"/>`) },
  { id: 'y-chromestar', w: 0.13, svg: () => K('0 0 100 100', `<defs>${chrome('chs')}</defs><path d="${ST}" fill="url(#chs)" stroke="#8a8e96" stroke-width="1.5" stroke-linejoin="round"/><path d="M34 40 q10 -10 16 -24" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9" fill="none"/>`) },
  { id: 'y-goldstar', w: 0.13, svg: () => K('0 0 100 100', `<defs><linearGradient id="gds" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dc8a"/><stop offset=".5" stop-color="#b9922f"/><stop offset="1" stop-color="#e8c766"/></linearGradient></defs><path d="${ST}" fill="url(#gds)"/>`) },
  { id: 'y-glitter', w: 0.14, svg: () => K('0 0 100 100', `<defs><pattern id="glt" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#d94f9a"/><circle cx="1.5" cy="1.5" r=".9" fill="#ffd1ec"/><circle cx="4.5" cy="4" r=".6" fill="#fff"/></pattern></defs><path d="${ST}" fill="url(#glt)" stroke="#f6b3d6" stroke-width="5" stroke-linejoin="round"/>`) },
  { id: 'y-polkastar', w: 0.14, svg: () => K('0 0 100 100', `<defs><pattern id="pks" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#1f1d22"/><circle cx="4" cy="4" r="1.4" fill="#f6b3d0"/></pattern></defs><path d="${ST}" fill="url(#pks)" stroke="#f6c7dc" stroke-width="6" stroke-linejoin="round"/>`) },
  { id: 'y-ginghamstar', w: 0.14, svg: () => K('0 0 100 100', `<defs><pattern id="ggs" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#fff"/><rect width="4" height="8" fill="#a9c47a" opacity=".6"/><rect width="8" height="4" fill="#a9c47a" opacity=".6"/></pattern></defs><path d="${ST}" fill="url(#ggs)"/><path d="${star5(50, 56, 26, 12)}" fill="#fff"/>`) },
  { id: 'y-chromespark', w: 0.12, svg: () => K('0 0 100 100', `<defs>${chrome('chk')}<linearGradient id="pkc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd6ea"/><stop offset=".5" stop-color="#e46aa8"/><stop offset="1" stop-color="#ffc1e0"/></linearGradient></defs><path d="M50 4 C54 38 62 46 96 50 C62 54 54 62 50 96 C46 62 38 54 4 50 C38 46 46 38 50 4Z" fill="url(#pkc)"/>`) },
  { id: 'y-chromeheart', w: 0.12, svg: () => K('0 0 100 100', `<defs><radialGradient id="chh" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#e9b3c3"/><stop offset="1" stop-color="#9c5f73"/></radialGradient></defs><path d="${heartD}" fill="url(#chh)"/>`) },
  { id: 'y-btn-blue', w: 0.11, svg: () => K('0 0 100 100', button('<circle cx="50" cy="53" r="40" fill="FILL"/><circle cx="50" cy="53" r="31" fill="none" stroke="#ffffff66" stroke-width="3"/>', '#7cc0ea')) },
  { id: 'y-btn-heart', w: 0.12, svg: () => K('0 0 100 100', `<defs><pattern id="hbp" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#3b6fbf"/><circle cx="5" cy="5" r="1.6" fill="#fff"/></pattern></defs>${button(`<path d="${heartD}" fill="FILL"/>`, 'url(#hbp)')}`) },
  { id: 'y-btn-apple', w: 0.12, svg: () => K('0 0 100 100', `<defs><pattern id="abp" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#fff"/><rect width="6" height="12" fill="#f2a6be" opacity=".7"/><rect width="12" height="6" fill="#f2a6be" opacity=".7"/></pattern></defs>${button('<path d="M50 28 C30 16 10 28 12 54 C14 82 36 94 50 86 C64 94 86 82 88 54 C90 28 70 16 50 28Z" fill="FILL"/>', 'url(#abp)', 4, '<path d="M50 28 V14" stroke="#7a4a2f" stroke-width="4" stroke-linecap="round"/><circle cx="54" cy="12" r="4" fill="#d9453f"/>')}`) },
  { id: 'y-btn-flower', w: 0.11, svg: () => K('0 0 100 100', button(`<g fill="FILL">${[0, 72, 144, 216, 288].map((a) => `<circle cx="50" cy="30" r="20" transform="rotate(${a} 50 53)"/>`).join('')}<circle cx="50" cy="53" r="24"/></g>`, '#a9d1a4', 2)) },
  { id: 'y-btn-pink', w: 0.1, svg: () => K('0 0 100 100', button('<circle cx="50" cy="53" r="40" fill="FILL"/><circle cx="50" cy="53" r="30" fill="#00000010"/>', '#f2a0bb', 2)) },
  { id: 'y-cd', w: 0.16, svg: () => K('0 0 100 100', `<defs><radialGradient id="cdg" cx="50%" cy="50%" r="50%"><stop offset=".2" stop-color="#e8e8ee"/><stop offset=".45" stop-color="#c9f0ff"/><stop offset=".6" stop-color="#ffd6f4"/><stop offset=".75" stop-color="#fff6c9"/><stop offset=".9" stop-color="#d4ffe9"/><stop offset="1" stop-color="#c9c9d6"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(#cdg)" stroke="#b9b9c4"/><circle cx="50" cy="50" r="14" fill="#f4f4f6" stroke="#ccc"/><circle cx="50" cy="50" r="6" fill="#fff" stroke="#bbb"/>${[[30, 30, '#f06aa8'], [70, 34, '#5ac8e8'], [66, 70, '#f2c230'], [30, 66, '#7ad17a'], [50, 22, '#a875d1']].map(([x, y, c]) => `<path d="${star5(x, y, 6, 2.6)}" fill="${c}"/>`).join('')}`) },
  { id: 'y-vinyl', w: 0.16, svg: () => K('0 0 100 100', `<circle cx="50" cy="50" r="46" fill="#151517"/>${[40, 34, 28, 22].map((r) => `<circle cx="50" cy="50" r="${r}" fill="none" stroke="#2c2c30" stroke-width="1"/>`).join('')}<path d="M24 26 A34 34 0 0 1 50 16" stroke="#ffffff22" stroke-width="5" fill="none"/><circle cx="50" cy="50" r="13" fill="#efe6d4"/><circle cx="50" cy="50" r="2.5" fill="#151517"/>`) },
  { id: 'y-pin-pink', w: 0.09, svg: () => K('0 0 80 100', `<path d="M40 60 L40 96" stroke="#9a9aa0" stroke-width="3" stroke-linecap="round"/><ellipse cx="40" cy="58" rx="22" ry="7" fill="#e86aa0"/><path d="M28 56 V30 h24 V56Z" fill="#f28dbb"/><ellipse cx="40" cy="22" rx="20" ry="16" fill="#f6a3c9"/><ellipse cx="34" cy="16" rx="6" ry="4" fill="#fff" opacity=".7"/>`) },
  { id: 'y-pin-yellow', w: 0.09, svg: () => K('0 0 80 100', `<defs><pattern id="pyd" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f6e07a"/><circle cx="4" cy="4" r="1.3" fill="#fff"/></pattern></defs><path d="M40 60 L40 96" stroke="#9a9aa0" stroke-width="3" stroke-linecap="round"/><ellipse cx="40" cy="58" rx="22" ry="7" fill="#e6c94a"/><path d="M28 56 V30 h24 V56Z" fill="url(#pyd)"/><ellipse cx="40" cy="22" rx="20" ry="16" fill="url(#pyd)"/>`) },
  { id: 'y-clip', w: 0.14, svg: () => K('0 0 120 80', `<defs>${chrome('clg')}</defs><path d="M20 30 H100 L92 70 H28Z" fill="#9a9ea6"/><path d="M14 30 Q60 18 106 30" stroke="url(#clg)" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M40 30 Q40 6 60 6 Q80 6 80 30" stroke="url(#clg)" stroke-width="5" fill="none"/>`) },
  { id: 'y-disco', w: 0.15, svg: () => K('0 0 100 100', `<defs><clipPath id="dsc"><circle cx="50" cy="50" r="44"/></clipPath><radialGradient id="dsg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#b9bcc4"/><stop offset="1" stop-color="#6d7179"/></radialGradient></defs><circle cx="50" cy="50" r="44" fill="url(#dsg)"/><g clip-path="url(#dsc)" stroke="#5e626a" stroke-width=".8" opacity=".6">${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${8 + i * 8} H100"/>`).join('')}${Array.from({ length: 12 }, (_, i) => `<path d="M${8 + i * 8} 0 V100"/>`).join('')}</g>${[[34, 30], [62, 40], [44, 64]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#fff"/>`).join('')}`) },
  { id: 'y-cassette', w: 0.2, svg: () => K('0 0 150 100', `<rect x="4" y="6" width="142" height="88" rx="8" fill="#f6b8cf"/><rect x="16" y="16" width="118" height="44" rx="4" fill="#fbe7ef"/>` + `<text x="75" y="30" text-anchor="middle" font-family="'Permanent Marker', Jua, sans-serif" font-size="12" fill="#a8476e">LOVE SONGS ♡</text><rect x="38" y="38" width="74" height="16" rx="8" fill="#6d5560"/><circle cx="52" cy="46" r="6" fill="#fbe7ef"/><circle cx="98" cy="46" r="6" fill="#fbe7ef"/><path d="M30 94 L40 70 H110 L120 94" fill="#f29cbf"/><circle cx="58" cy="82" r="3" fill="#a8476e"/><circle cx="92" cy="82" r="3" fill="#a8476e"/>`) },
  { id: 'y-camera', w: 0.18, svg: () => K('0 0 140 100', `<defs>${chrome('cmg')}</defs><rect x="6" y="16" width="128" height="76" rx="10" fill="url(#cmg)" stroke="#8a8e96"/><rect x="20" y="8" width="30" height="12" rx="3" fill="#b9bcc4"/><circle cx="84" cy="54" r="26" fill="#3a3c42"/><circle cx="84" cy="54" r="18" fill="#1d1e22"/><circle cx="78" cy="48" r="5" fill="#ffffff55"/><rect x="18" y="30" width="22" height="14" rx="2" fill="#2a2c30"/><path d="M28 74 c-4 -4 -8 0 -4 5 l4 4 l4 -4 c4 -5 0 -9 -4 -5z" fill="#f4a3c0"/>`) },
  { id: 'y-bow', w: 0.15, svg: () => K('0 0 120 90', `<defs><pattern id="bwp" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#fbe1ea"/><circle cx="4.5" cy="4.5" r="1.4" fill="#5a4a50"/></pattern></defs><path d="M60 40 C40 10 8 12 10 34 C12 54 40 56 60 40Z M60 40 C80 10 112 12 110 34 C108 54 80 56 60 40Z" fill="url(#bwp)" stroke="#f3c2d3" stroke-width="2"/><path d="M56 42 L38 84 L48 80 L54 88 L60 46 L66 88 L72 80 L82 84 L64 42Z" fill="url(#bwp)" stroke="#f3c2d3" stroke-width="2"/><rect x="52" y="32" width="16" height="16" rx="5" fill="url(#bwp)" stroke="#f3c2d3" stroke-width="2"/>`) },
  { id: 'y-gems', w: 0.14, svg: () => K('0 0 110 80', [[18, 20, '#e84a5f'], [46, 14, '#2fa36b'], [78, 24, '#f2c230'], [30, 52, '#2f8fd8'], [62, 50, '#d9d9e8'], [92, 58, '#a875d1']].map(([x, y, c]) => `<path d="${star5(x, y, 11, 5)}" fill="${c}" stroke="#ffffff99" stroke-width="1.2"/><path d="M${x - 3} ${y - 4} l3 -4" stroke="#fff" stroke-width="1.5" opacity=".8"/>`).join('')) },
  { id: 'y-diamond', w: 0.11, svg: () => K('0 0 100 100', `<defs>${chrome('dmg')}</defs><path d="M50 6 L92 50 L50 94 L8 50Z" fill="url(#dmg)" stroke="#7d828c" stroke-width="1.5"/><path d="M50 6 L50 94 M8 50 H92" stroke="#ffffff88" stroke-width="1.2"/>`) },
  { id: 'y-swirl', w: 0.1, svg: () => K('0 0 100 100', `<path d="M50 50 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0 a22 22 0 1 1 -44 0 a28 28 0 1 1 56 0" fill="none" stroke="#f3a8c8" stroke-width="5" stroke-dasharray="2 3" stroke-linecap="round"/>`) },
];

export const DATE_STICKERS = Array.from({ length: 31 }, (_, i) => ({ id: `dc-${i + 1}`, w: 0.09, svg: () => dateCircle(i + 1) }));
export const LABEL_STICKERS = LABELS.map((t, i) => ({ id: `lb-${i}`, w: Math.min(0.34, 0.08 + t.length * 0.02), svg: () => labelSvg(t) }));

// ---------- 손그림 낙서 (펜으로 그린 느낌) ----------
const D = (vb, paths, color = INK, w = 3.2) => K(vb, `<g fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`);
export const DOODLE_STICKERS = [
  { id: 'd-arrow', w: 0.16, svg: () => D('0 0 140 70', '<path d="M8 52 C36 14 82 8 124 30"/><path d="M106 18 L126 31 L104 42"/>') },
  { id: 'd-arrow-loop', w: 0.16, svg: () => D('0 0 140 80', '<path d="M8 60 C30 60 44 50 50 34 C56 14 38 10 34 26 C30 44 60 58 92 50 C110 46 120 40 128 32"/><path d="M114 26 L129 31 L120 44"/>', '#d9534f') },
  { id: 'd-arrow-down', w: 0.08, svg: () => D('0 0 60 110', '<path d="M30 6 C24 36 38 62 30 96"/><path d="M16 80 L30 98 L44 80"/>', '#3b6fb6') },
  { id: 'd-heart', w: 0.1, svg: () => D('0 0 100 90', '<path d="M50 80 C20 60 6 44 10 28 C14 10 36 8 48 26 C58 8 84 8 90 26 C96 44 80 62 50 80 Z"/>', '#e05a7a', 3.6) },
  { id: 'd-hearts', w: 0.1, svg: () => D('0 0 110 70', '<path d="M30 58 C12 46 4 36 7 26 C10 14 24 14 30 26 C36 14 50 14 52 26 C55 36 46 46 30 58Z"/><path d="M80 46 C68 38 63 31 65 24 C67 16 76 16 80 24 C84 16 93 16 95 24 C97 31 92 38 80 46Z"/>', '#e05a7a') },
  { id: 'd-circle', w: 0.24, svg: () => D('0 0 200 110', '<path d="M100 8 C40 6 8 30 10 56 C12 86 60 102 112 100 C164 98 194 76 190 50 C186 22 140 8 92 12 C70 14 52 20 40 28"/>', '#d9534f', 3) },
  { id: 'd-underline', w: 0.26, svg: () => D('0 0 220 30', '<path d="M6 18 C40 10 70 24 106 16 C142 8 170 22 214 12"/>', '#3b6fb6', 3.6) },
  { id: 'd-wave', w: 0.26, svg: () => D('0 0 220 30', '<path d="M6 16 q13 -12 26 0 t26 0 t26 0 t26 0 t26 0 t26 0 t26 0 t26 0"/>', '#e9a23b', 3.4) },
  { id: 'd-star', w: 0.1, svg: () => D('0 0 100 100', '<path d="M50 8 L61 38 L93 39 L67 58 L77 90 L50 71 L23 90 L33 58 L7 39 L39 38 Z"/>', '#e9a23b') },
  { id: 'd-sparkle', w: 0.1, svg: () => D('0 0 100 100', '<path d="M50 14 V36 M50 64 V86 M14 50 H36 M64 50 H86 M26 26 L38 38 M62 62 L74 74 M74 26 L62 38 M38 62 L26 74"/>', INK, 3) },
  { id: 'd-shine', w: 0.08, svg: () => D('0 0 80 60', '<path d="M10 44 L24 30 M30 50 L40 22 M50 52 L68 34"/>', INK, 3.2) },
  { id: 'd-crown', w: 0.12, svg: () => D('0 0 120 80', '<path d="M12 66 L18 22 L40 46 L60 14 L80 46 L102 22 L108 66 Z"/><path d="M14 74 H106"/>', '#e9a23b') },
  { id: 'd-bow', w: 0.12, svg: () => D('0 0 120 80', '<path d="M60 36 C44 10 14 12 14 30 C14 46 42 48 60 36 C78 48 106 46 106 30 C106 12 76 10 60 36 Z"/><path d="M56 40 L40 74 M64 40 L80 74"/>', '#e05a7a') },
  { id: 'd-flower', w: 0.1, svg: () => D('0 0 100 120', '<circle cx="50" cy="36" r="9"/><path d="M50 27 C40 8 60 8 50 27 M59 36 C78 26 78 46 59 36 M50 45 C60 64 40 64 50 45 M41 36 C22 46 22 26 41 36"/><path d="M50 54 C48 76 52 96 50 114 M50 92 C40 84 32 86 28 80"/>', '#5a8f5a') },
  { id: 'd-sun', w: 0.1, svg: () => D('0 0 100 100', '<circle cx="50" cy="50" r="18"/><path d="M50 8 V20 M50 80 V92 M8 50 H20 M80 50 H92 M20 20 L28 28 M72 72 L80 80 M80 20 L72 28 M28 72 L20 80"/>', '#e9a23b') },
  { id: 'd-smile', w: 0.1, svg: () => D('0 0 100 100', '<circle cx="50" cy="50" r="40"/><path d="M36 40 v4 M64 40 v4"/><path d="M32 60 C42 74 60 74 68 60"/>', INK) },
  { id: 'd-me', w: 0.14, svg: () => D('0 0 120 120', '<path d="M24 66 C18 30 40 12 62 14 C88 16 104 36 98 70"/><path d="M24 66 C20 92 40 108 62 106 C86 104 100 90 98 70"/><path d="M30 44 C46 40 54 30 58 22 C66 36 82 42 96 44"/><path d="M44 66 v6 M78 66 v6"/><path d="M54 86 C60 90 66 90 70 86"/><ellipse cx="38" cy="80" rx="6" ry="4" fill="#f4a3b4" stroke="none"/><ellipse cx="86" cy="80" rx="6" ry="4" fill="#f4a3b4" stroke="none"/>', INK, 2.6) },
  { id: 'd-cloud', w: 0.16, svg: () => D('0 0 140 80', '<path d="M30 66 C10 66 8 44 24 40 C22 22 44 14 56 26 C62 10 90 10 94 28 C112 22 128 36 120 52 C134 58 126 70 112 66 Z"/>', '#7ea6d9') },
  { id: 'd-check', w: 0.08, svg: () => D('0 0 80 70', '<path d="M8 38 L28 58 L72 10"/>', '#d9534f', 5) },
  { id: 'd-x', w: 0.07, svg: () => D('0 0 70 70', '<path d="M12 12 L58 58 M58 12 L12 58"/>', '#d9534f', 5) },
  { id: 'd-excl', w: 0.07, svg: () => D('0 0 70 90', '<path d="M20 10 L24 58 M48 10 L44 58"/><circle cx="25" cy="76" r="3" fill="' + INK + '"/><circle cx="44" cy="76" r="3" fill="' + INK + '"/>', INK, 4) },
  { id: 'd-fish', w: 0.12, svg: () => D('0 0 120 70', '<path d="M18 35 C34 12 70 12 88 35 C70 58 34 58 18 35 Z"/><path d="M88 35 L110 18 L106 35 L110 52 Z"/><circle cx="36" cy="32" r="2.5" fill="' + INK + '"/><path d="M52 24 C58 32 58 40 52 46"/>', '#5a7fb0', 2.8) },
  { id: 'd-swirl', w: 0.1, svg: () => D('0 0 100 100', '<path d="M50 50 C56 46 56 38 48 38 C38 38 36 52 46 58 C60 66 72 52 68 38 C62 20 36 18 26 36 C14 56 30 82 56 82"/>', '#9a7fd1', 3) },
  { id: 'd-bracket', w: 0.12, svg: () => D('0 0 60 140', '<path d="M44 8 C20 10 30 60 12 70 C30 80 20 130 44 132"/>', INK, 3) },
];
