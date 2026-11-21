// ARCHIVE 그림 2 — 메모지 · 크레용 낙서 · 말랑 스티커 · 말풍선 · 파스텔 · 테이프 추가분
// 모두 레퍼런스 분위기를 참고해 새로 그린 SVG (문구도 직접 작성)
const INK = '#2b2522';
const K = (vb, inner) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const T = (x, y, size, text, attrs = '') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="middle" ${attrs}>${text}</text>`;
const HAND = `font-family="Gaegu, 'Gamja Flower', sans-serif"`;
const SINGLE = `font-family="'Single Day', Gaegu, sans-serif"`;
const ROUND = `font-family="Jua, 'Gowun Dodum', sans-serif"`;
const GOTHIC = `font-family="'Gowun Dodum', 'Noto Sans KR', sans-serif"`;
const BOLD = `font-family="'Do Hyeon', Jua, sans-serif"`;
const star = (cx, cy, r1, r2, n) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`; }
  return d + 'Z';
};
const burst = (cx, cy, rx, ry, n, jag = 0.72, seed = 1) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const k = i % 2 ? jag * (0.9 + ((i * 37 + seed * 11) % 7) / 30) : 1;
    const a = (i / (n * 2)) * Math.PI * 2;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`;
  }
  return d + 'Z';
};
const cloudPath = (cx, cy, w, h) => { // 몽글 구름
  const n = 9; let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * w, y = cy + Math.sin(a) * h;
    if (!i) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
    else { const am = ((i - 0.5) / n) * Math.PI * 2; d += ` Q${(cx + Math.cos(am) * w * 1.32).toFixed(1)} ${(cy + Math.sin(am) * h * 1.32).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`; }
  }
  return d + 'Z';
};
const heartPath = (cx, cy, s) => `M${cx} ${cy + s * 0.9}C${cx - s * 1.1} ${cy + s * 0.2} ${cx - s * 1.05} ${cy - s * 0.75} ${cx - s * 0.5} ${cy - s * 0.8}C${cx - s * 0.2} ${cy - s * 0.85} ${cx} ${cy - s * 0.6} ${cx} ${cy - s * 0.35}C${cx} ${cy - s * 0.6} ${cx + s * 0.2} ${cy - s * 0.85} ${cx + s * 0.5} ${cy - s * 0.8}C${cx + s * 1.05} ${cy - s * 0.75} ${cx + s * 1.1} ${cy + s * 0.2} ${cx} ${cy + s * 0.9}Z`;

// ---------- 크레용 질감 필터 ----------
const CRAYON = `<defs><filter id="cry" x="-12%" y="-12%" width="124%" height="124%">
  <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="4" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.45" result="ga"/>
  <feComposite in="d" in2="ga" operator="in"/></filter></defs>`;
const cr = (vb, inner) => K(vb, `${CRAYON}<g filter="url(#cry)">${inner}</g>`);
const crText = (text, color, size = 46, font = SINGLE, vb = '0 0 130 64') => cr(vb, T(65, 34, size, text, `${font} font-weight="700" fill="${color}" stroke="${color}" stroke-width="1.5"`));

export const CRAYON_STICKERS = [
  { id: 'c-sun', w: 0.16, svg: () => cr('0 0 100 100', `${Array.from({ length: 10 }, (_, i) => `<path d="M50 50 L${(50 + Math.cos(i * 0.628) * 44).toFixed(1)} ${(50 + Math.sin(i * 0.628) * 44).toFixed(1)}" stroke="#f08a3c" stroke-width="7" stroke-linecap="round"/>`).join('')}<circle cx="50" cy="50" r="20" fill="#f39a45"/>`) },
  { id: 'c-snow', w: 0.17, svg: () => cr('0 0 120 100', `<path d="${cloudPath(60, 42, 38, 20)}" fill="#c9daf0"/>${[[34, 78], [56, 86], [80, 76], [46, 94], [72, 96]].map(([x, y]) => `<path d="M${x - 4} ${y}h8M${x} ${y - 4}v8" stroke="#a9c3e6" stroke-width="2.6" stroke-linecap="round"/>`).join('')}`) },
  { id: 'c-rain', w: 0.17, svg: () => cr('0 0 120 100', `<path d="${cloudPath(60, 40, 38, 20)}" fill="#7d93bd"/>${[[38, 76], [56, 82], [74, 76], [48, 94], [66, 94]].map(([x, y]) => `<path d="M${x} ${y} l-2 7" stroke="#7d93bd" stroke-width="4" stroke-linecap="round"/>`).join('')}`) },
  { id: 'c-palm', w: 0.16, svg: () => cr('0 0 100 110', `<path d="M50 40 Q54 75 48 106" stroke="#5fa59c" stroke-width="7" fill="none" stroke-linecap="round"/>${[-150, -110, -70, -30, 10, 200].map((a) => `<path d="M50 38 q${(Math.cos((a * Math.PI) / 180) * 20).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * 20 - 6).toFixed(1)} ${(Math.cos((a * Math.PI) / 180) * 40).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * 40 + 8).toFixed(1)}" stroke="#4f9c93" stroke-width="7" fill="none" stroke-linecap="round"/>`).join('')}`) },
  { id: 'c-tree', w: 0.14, svg: () => cr('0 0 80 110', `<rect x="34" y="66" width="12" height="40" rx="3" fill="#7b5235"/><ellipse cx="40" cy="42" rx="30" ry="34" fill="#4f7a3a"/>`) },
  { id: 'c-tree2', w: 0.12, svg: () => cr('0 0 70 120', `<rect x="29" y="82" width="12" height="34" fill="#7b5235"/><ellipse cx="35" cy="28" rx="22" ry="22" fill="#3f6e3a"/><ellipse cx="35" cy="62" rx="27" ry="25" fill="#3f6e3a"/>`) },
  { id: 'c-house', w: 0.18, svg: () => cr('0 0 120 110', `<path d="M14 50 L60 16 L106 50Z" fill="#7a5544"/>${[24, 34, 44].map((y) => `<path d="M${30 + (y - 24) * -0.6} ${y + 4}H${90 + (y - 24) * 0.6}" stroke="#d9c3b4" stroke-width="2.5"/>`).join('')}<rect x="22" y="50" width="76" height="52" fill="#f4b8c4"/><rect x="34" y="66" width="16" height="36" fill="#d4474f"/><path d="M62 66h24v20H62z" fill="#f8e7a8"/><path d="M74 66v20M62 76h24" stroke="#d98aa0" stroke-width="2"/>`) },
  { id: 'c-tulip', w: 0.12, svg: () => cr('0 0 80 110', `<path d="M40 50 V104" stroke="#5f8a4f" stroke-width="6" stroke-linecap="round"/><path d="M40 80 q20 -6 26 -24 q-20 4 -26 24z" fill="#6c9a58"/><path d="M18 22 Q20 52 40 52 Q60 52 62 22 Q52 30 46 18 Q40 30 34 18 Q28 30 18 22Z" fill="#f6d27a"/>`) },
  { id: 'c-love', w: 0.16, svg: () => cr('0 0 100 100', `<path d="${heartPath(50, 50, 40)}" fill="#c43a3a"/>` + T(50, 44, 22, 'LOVE', `${SINGLE} font-weight="700" fill="#fff" transform="rotate(-10 50 50)"`)) },
  { id: 'c-cake', w: 0.17, svg: () => cr('0 0 110 100', `<ellipse cx="55" cy="36" rx="42" ry="12" fill="#f8e7a0"/><path d="M13 36 V76 Q55 92 97 76 V36" fill="#f6d77b"/><path d="M13 70 Q55 86 97 70" stroke="#7fc0e0" stroke-width="6" fill="none"/><circle cx="55" cy="24" r="7" fill="#d93a3a"/><path d="M55 17 q4 -8 10 -10" stroke="#5f8a4f" stroke-width="2" fill="none"/>` + T(55, 54, 16, 'H·B·D', `${SINGLE} font-weight="700" fill="#d65a8a"`)) },
  { id: 'c-bread', w: 0.16, svg: () => cr('0 0 110 80', `<path d="M10 56 Q8 22 34 20 Q55 12 76 20 Q102 22 100 56 Q100 70 55 70 Q10 70 10 56Z" fill="#a8683e"/><path d="M34 28 l8 14 M54 24 l8 14 M74 28 l8 14" stroke="#e4b685" stroke-width="4" stroke-linecap="round"/>`) },
  { id: 'c-apple', w: 0.13, svg: () => cr('0 0 100 100', `<path d="M50 30 C30 18 12 30 14 54 C16 80 36 92 50 84 C64 92 84 80 86 54 C88 30 70 18 50 30Z" fill="#9cc56a"/><path d="M50 30 V14" stroke="#6b4a2f" stroke-width="5" stroke-linecap="round"/>`) },
  { id: 'c-tomato', w: 0.15, svg: () => cr('0 0 110 90', `<ellipse cx="55" cy="52" rx="46" ry="32" fill="#d9442f"/><path d="M55 22 l-18 -6 l12 10 l-16 6 l18 0 l4 12 l4 -12 l18 0 l-16 -6 l12 -10z" fill="#3f7a35"/>`) },
  { id: 'c-cat', w: 0.15, svg: () => cr('0 0 100 90', `<path d="M14 40 L18 10 L38 26 H62 L82 10 L86 40 C90 70 72 84 50 84 S10 70 14 40Z" fill="#9aa0a6"/><path d="M30 34 h12 M58 34 h12 M46 22 v10" stroke="#6f757b" stroke-width="4"/><circle cx="36" cy="52" r="3.5" fill="${INK}"/><circle cx="64" cy="52" r="3.5" fill="${INK}"/><path d="M45 62 q5 4 10 0" stroke="${INK}" stroke-width="2.6" fill="none"/>`) },
  { id: 'c-dog', w: 0.15, svg: () => cr('0 0 100 100', `<ellipse cx="50" cy="52" rx="30" ry="34" fill="#f3e6cf"/><path d="M20 24 C6 36 8 66 22 70 C30 56 30 34 20 24Z" fill="#8a5a3a"/><path d="M80 24 C94 36 92 66 78 70 C70 56 70 34 80 24Z" fill="#8a5a3a"/><circle cx="40" cy="50" r="3.4" fill="${INK}"/><circle cx="60" cy="50" r="3.4" fill="${INK}"/><ellipse cx="50" cy="74" rx="5" ry="4" fill="${INK}"/>`) },
  { id: 'c-bunny', w: 0.13, svg: () => cr('0 0 90 110', `<ellipse cx="32" cy="30" rx="10" ry="26" fill="#f6efe0"/><ellipse cx="58" cy="30" rx="10" ry="26" fill="#f6efe0"/><ellipse cx="45" cy="76" rx="32" ry="28" fill="#f6efe0"/><circle cx="36" cy="74" r="3" fill="${INK}"/><circle cx="54" cy="74" r="3" fill="${INK}"/><circle cx="45" cy="82" r="2" fill="${INK}"/>`) },
  { id: 'c-bear', w: 0.15, svg: () => cr('0 0 100 100', `<circle cx="22" cy="26" r="13" fill="#7a4e30"/><circle cx="78" cy="26" r="13" fill="#7a4e30"/><circle cx="50" cy="54" r="38" fill="#7a4e30"/><ellipse cx="50" cy="66" rx="18" ry="13" fill="#f1e2c8"/><ellipse cx="50" cy="62" rx="7" ry="5" fill="${INK}"/><circle cx="34" cy="46" r="3.6" fill="${INK}"/><circle cx="66" cy="46" r="3.6" fill="${INK}"/>`) },
  { id: 'c-paw', w: 0.1, svg: () => cr('0 0 80 80', `<ellipse cx="40" cy="52" rx="20" ry="16" fill="#f4b8c0"/>${[[18, 30], [32, 18], [48, 18], [62, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="9" fill="#f4b8c0"/>`).join('')}`) },
  { id: 'c-pow', w: 0.15, svg: () => cr('0 0 100 100', `<path d="${burst(50, 50, 44, 44, 9, 0.45, 2)}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`) },
  { id: 'c-hearts', w: 0.13, svg: () => cr('0 0 100 90', `<path d="${heartPath(30, 34, 20)}" fill="#c43a3a" transform="rotate(-15 30 34)"/><path d="${heartPath(68, 30, 20)}" fill="#c43a3a" transform="rotate(12 68 30)"/><path d="${heartPath(50, 64, 20)}" fill="#c43a3a"/>`) },
  { id: 'c-goodluck', w: 0.2, svg: () => cr('0 0 160 90', T(80, 30, 34, 'GOOD', `${SINGLE} font-weight="700" fill="#4f7a2e"`) + T(80, 66, 34, 'LUCK', `${SINGLE} font-weight="700" fill="#4f7a2e"`)) },
  { id: 'c-home', w: 0.2, svg: () => cr('0 0 160 120', T(80, 26, 30, 'HOME', `${SINGLE} font-weight="700" fill="${INK}"`) + T(80, 60, 30, 'SWEET', `${SINGLE} font-weight="700" fill="${INK}"`) + T(80, 94, 30, 'HOME', `${SINGLE} font-weight="700" fill="${INK}"`)) },
  { id: 'c-yes', w: 0.15, svg: () => crText('YES', INK, 40) },
  { id: 'c-no', w: 0.13, svg: () => crText('NO', INK, 42) },
  { id: 'c-ok', w: 0.13, svg: () => crText('OK', INK, 42) },
  { id: 'c-wow', w: 0.15, svg: () => crText('WOW', '#d9442f', 40) },
  { id: 'c-excl', w: 0.06, svg: () => cr('0 0 40 100', `<path d="M20 12 V64" stroke="#c43a3a" stroke-width="10" stroke-linecap="round"/><circle cx="20" cy="86" r="7" fill="#c43a3a"/>`) },
  { id: 'c-q', w: 0.08, svg: () => cr('0 0 60 100', `<path d="M14 30 Q14 10 32 10 Q50 10 50 28 Q50 42 32 50 V64" stroke="#c43a3a" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="32" cy="86" r="7" fill="#c43a3a"/>`) },
  { id: 'c-dots', w: 0.14, svg: () => cr('0 0 120 90', `<ellipse cx="60" cy="42" rx="52" ry="32" fill="#fff" stroke="#bbb" stroke-width="2.5"/><path d="M30 70 l-8 14 l18 -10" fill="#fff" stroke="#bbb" stroke-width="2.5"/><circle cx="40" cy="42" r="6" fill="${INK}"/><circle cx="60" cy="42" r="6" fill="${INK}"/><circle cx="80" cy="42" r="6" fill="${INK}"/>`) },
  { id: 'c-bheart', w: 0.14, svg: () => cr('0 0 120 90', `<ellipse cx="60" cy="42" rx="52" ry="32" fill="#fff" stroke="#bbb" stroke-width="2.5"/><path d="M30 70 l-8 14 l18 -10" fill="#fff" stroke="#bbb" stroke-width="2.5"/><path d="${heartPath(60, 42, 18)}" fill="#c43a3a"/>`) },
];

// ---------- 말랑(말캉한 3D 느낌) ----------
const PUFF = `<defs><radialGradient id="pf" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".65" stop-color="#f1f1f3"/><stop offset="1" stop-color="#d6d6db"/></radialGradient>
  <filter id="pfs" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".18"/></filter></defs>`;
const pf = (vb, inner) => K(vb, PUFF + inner);
export const PUFFY_STICKERS = [
  { id: 'p-dots', w: 0.17, svg: () => pf('0 0 120 110', `<g filter="url(#pfs)"><path d="M60 10 C92 10 112 28 112 50 C112 72 92 88 62 88 L36 104 L42 84 C20 78 8 64 8 50 C8 28 28 10 60 10Z" fill="url(#pf)"/></g><circle cx="38" cy="50" r="6" fill="#4a4a4f"/><circle cx="60" cy="50" r="6" fill="#4a4a4f"/><circle cx="82" cy="50" r="6" fill="#4a4a4f"/>`) },
  { id: 'p-cloud', w: 0.17, svg: () => pf('0 0 120 100', `<g filter="url(#pfs)"><path d="${cloudPath(60, 52, 40, 28)}" fill="url(#pf)"/></g><ellipse cx="72" cy="46" rx="3.5" ry="5" fill="#2b2b2f"/><ellipse cx="86" cy="46" rx="3.5" ry="5" fill="#2b2b2f"/><path d="M73 58 q6 5 12 0" stroke="#2b2b2f" stroke-width="2.4" fill="none" stroke-linecap="round"/>`) },
  { id: 'p-heartcloud', w: 0.17, svg: () => pf('0 0 120 110', `<g filter="url(#pfs)"><path d="${cloudPath(60, 50, 42, 32)}" fill="url(#pf)"/><circle cx="18" cy="98" r="7" fill="url(#pf)"/></g><path d="${heartPath(60, 50, 22)}" fill="#f7a9c4"/><path d="${heartPath(100, 22, 7)}" fill="#f7a9c4"/><path d="${heartPath(22, 30, 6)}" fill="#f7a9c4"/>`) },
  { id: 'p-burst', w: 0.18, svg: () => pf('0 0 130 110', `<g filter="url(#pfs)"><path d="${burst(65, 50, 58, 42, 16, 0.78, 3)} M48 84 L40 106 L64 86" fill="url(#pf)" stroke="#c9c9cf" stroke-width="1.5" stroke-linejoin="round"/></g>`) },
  { id: 'p-think', w: 0.2, svg: () => pf('0 0 150 120', `<g filter="url(#pfs)"><path d="${cloudPath(80, 50, 56, 32)}" fill="url(#pf)"/><circle cx="26" cy="96" r="9" fill="url(#pf)"/><circle cx="12" cy="112" r="5" fill="url(#pf)"/></g>` + T(80, 44, 15, '오늘 좀', `${HAND} font-weight="700" fill="#333"`) + T(80, 64, 15, '잘한 듯..?', `${HAND} font-weight="700" fill="#333"`)) },
  { id: 'p-tt', w: 0.15, svg: () => K('0 0 120 90', T(60, 34, 44, 'ㅠ_ㅠ', `${BOLD} fill="#1d1d1f"`) + T(60, 74, 16, '눈물 한 바가지', `${GOTHIC} font-weight="700" fill="#1d1d1f"`)) },
  { id: 'p-cute', w: 0.2, svg: () => K('0 0 140 140', `${Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2, r1 = 46 + (i % 3) * 4, r2 = 64 + (i % 2) * 6; return `<path d="M${(70 + Math.cos(a) * r1).toFixed(1)} ${(70 + Math.sin(a) * r1).toFixed(1)} L${(70 + Math.cos(a) * r2).toFixed(1)} ${(70 + Math.sin(a) * r2).toFixed(1)}" stroke="#333" stroke-width="1.4"/>`; }).join('')}` + T(70, 72, 20, '최고야..!!', `${HAND} font-weight="700" fill="#222"`) + `<path d="${heartPath(48, 40, 6)}" fill="none" stroke="#e7a5b8" stroke-width="1.6"/><path d="${heartPath(96, 100, 6)}" fill="none" stroke="#e7a5b8" stroke-width="1.6"/>`) },
  { id: 'p-ghost', w: 0.14, svg: () => pf('0 0 100 110', `<g filter="url(#pfs)"><path d="M18 52 C18 24 34 10 50 10 S82 24 82 52 V96 C76 104 70 94 64 100 C58 106 54 96 50 100 C46 106 42 96 36 100 C30 106 24 96 18 100Z" fill="url(#pf)"/></g><circle cx="38" cy="48" r="5" fill="#2b2b2f"/><circle cx="62" cy="48" r="5" fill="#2b2b2f"/><ellipse cx="50" cy="64" rx="6" ry="7" fill="#ef7f9b"/><path d="M58 18 l10 -6 l2 10z M58 18 l-8 -6 l-2 10z" fill="#f7a9c4"/>`) },
  { id: 'p-bowcloud', w: 0.17, svg: () => pf('0 0 120 120', `<g filter="url(#pfs)"><path d="${cloudPath(60, 36, 42, 24)}" fill="url(#pf)"/></g>${[30, 60, 90].map((x, i) => `<path d="M${x} 58 V${74 + i % 2 * 12}" stroke="#bbb" stroke-width="1.5" stroke-dasharray="2 2"/><path d="M${x} ${80 + i % 2 * 12} l-12 -7 v14z M${x} ${80 + i % 2 * 12} l12 -7 v14z" fill="#f48fb1"/><circle cx="${x}" cy="${80 + i % 2 * 12}" r="3" fill="#e46a94"/>`).join('')}`) },
  { id: 'p-headphone', w: 0.15, svg: () => pf('0 0 100 100', `<path d="M18 60 V48 A32 32 0 0 1 82 48 V60" stroke="#c9c9cf" stroke-width="7" fill="none" stroke-linecap="round"/><g filter="url(#pfs)"><rect x="10" y="52" width="22" height="34" rx="10" fill="url(#pf)"/><rect x="68" y="52" width="22" height="34" rx="10" fill="url(#pf)"/></g>`) },
  { id: 'p-search', w: 0.14, svg: () => pf('0 0 100 100', `<path d="M60 60 L88 88" stroke="#3a3a3f" stroke-width="9" stroke-linecap="round"/><g filter="url(#pfs)"><circle cx="42" cy="42" r="28" fill="#eef4f8" stroke="#c9c9cf" stroke-width="5"/></g><path d="M28 34 q6 -10 16 -8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`) },
  { id: 'p-spiral', w: 0.13, svg: () => pf('0 0 100 100', `<g filter="url(#pfs)"><path d="${burst(50, 50, 42, 42, 14, 0.86, 5)}" fill="url(#pf)"/></g><path d="M50 50 m-3 0 a3 3 0 1 1 6 0 a8 8 0 1 1 -16 0 a13 13 0 1 1 26 0 a18 18 0 1 1 -36 0" stroke="#f3a8c3" stroke-width="4" fill="none" stroke-linecap="round"/>`) },
  { id: 'p-tea', w: 0.14, svg: () => pf('0 0 110 90', `<ellipse cx="55" cy="78" rx="46" ry="8" fill="#5a3d2e"/><g filter="url(#pfs)"><path d="M16 30 H94 L88 70 Q55 84 22 70Z" fill="url(#pf)"/></g><ellipse cx="55" cy="30" rx="39" ry="8" fill="#7da35a"/><circle cx="46" cy="52" r="2.6" fill="#333"/><circle cx="64" cy="52" r="2.6" fill="#333"/><path d="M50 58 q2.5 3 5 0 q2.5 3 5 0" stroke="#333" stroke-width="1.8" fill="none"/>`) },
  { id: 'p-mic', w: 0.11, svg: () => pf('0 0 80 120', `<path d="M40 82 V108 M24 110 H56" stroke="#9a9aa0" stroke-width="5" stroke-linecap="round"/><g filter="url(#pfs)"><rect x="18" y="8" width="44" height="72" rx="22" fill="url(#pf)" stroke="#b9b9bf" stroke-width="2"/></g>${[24, 34, 44, 54, 64].map((y) => `<path d="M24 ${y} H56" stroke="#3a3a3f" stroke-width="3" stroke-linecap="round" opacity=".7"/>`).join('')}`) },
];

// ---------- 말풍선 텍스트 (선 스타일) ----------
const bub = (vb, shape, lines, opt = {}) => {
  const [, , w, h] = vb.split(' ').map(Number);
  const size = opt.size || 17, lh = size * 1.3, cy = opt.cy || h / 2;
  const start = cy - ((lines.length - 1) * lh) / 2;
  return K(vb, shape + lines.map((l, i) => T(w / 2 + (opt.dx || 0), start + i * lh, size, l, `${opt.font || GOTHIC} font-weight="${opt.weight || 700}" fill="${opt.color || INK}"`)).join(''));
};
const S = `stroke="${INK}" stroke-width="2.6"`;
export const BUBBLE_STICKERS = [
  { id: 'b-oval', w: 0.24, svg: () => bub('0 0 170 100', `<ellipse cx="85" cy="50" rx="80" ry="44" fill="#fff" ${S}/>`, ['오늘도', '고생했어 ♡'], { size: 16 }) },
  { id: 'b-rect', w: 0.28, svg: () => bub('0 0 200 56', `<rect x="3" y="3" width="194" height="50" fill="#fff" ${S}/><rect x="9" y="9" width="194" height="50" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".0"/>`, ['오늘 좀 멋진데...?'], { size: 18 }) },
  { id: 'b-heart', w: 0.24, svg: () => bub('0 0 160 150', `<path d="${heartPath(80, 72, 70)}" fill="#fff" ${S}/>`, ['설렘 주의...', '심장 아파...'], { size: 15, cy: 66 }) },
  { id: 'b-bold', w: 0.26, svg: () => bub('0 0 190 80', `<ellipse cx="95" cy="40" rx="90" ry="34" fill="#fff" stroke="${INK}" stroke-width="5"/>`, ['최고야..!!!'], { size: 24, font: BOLD, weight: 400 }) },
  { id: 'b-thin', w: 0.26, svg: () => bub('0 0 190 76', `<rect x="4" y="4" width="182" height="68" fill="#fff" stroke="#999" stroke-width="1.6" transform="rotate(-1 95 38)"/>`, ['오~ 괜찮은데'], { size: 22, weight: 400 }) },
  { id: 'b-taste', w: 0.24, svg: () => bub('0 0 170 100', `<ellipse cx="85" cy="50" rx="80" ry="44" fill="#fff" ${S}/>`, ['취향 저격.'], { size: 18 }) },
  { id: 'b-good', w: 0.26, svg: () => bub('0 0 200 110', `<ellipse cx="108" cy="46" rx="88" ry="38" fill="#f4f4f4" stroke="#bbb" stroke-width="2"/><circle cx="26" cy="90" r="9" fill="#f4f4f4" stroke="#bbb" stroke-width="2"/><circle cx="10" cy="104" r="5" fill="#f4f4f4" stroke="#bbb" stroke-width="2"/>`, ['느(낌)좋(은)'], { size: 24, dx: 8, cy: 46, weight: 400 }) },
  { id: 'b-tail', w: 0.24, svg: () => bub('0 0 170 120', `<path d="M85 6 C130 6 162 30 162 56 C162 82 130 104 86 104 C74 104 64 102 54 98 L28 116 L36 90 C18 80 8 68 8 56 C8 30 40 6 85 6Z" fill="#fff" ${S}/>`, ['집중 집중', '말 걸지 마세요'], { size: 15, cy: 54 }) },
  { id: 'b-black', w: 0.3, svg: () => bub('0 0 220 100', `<ellipse cx="110" cy="50" rx="105" ry="44" fill="#141414"/>`, ['작심삼일도', '열 번이면 한 달'], { size: 18, color: '#fff', weight: 400 }) },
  { id: 'b-cutie', w: 0.16, svg: () => bub('0 0 120 80', `<path d="M14 20 H50 L60 8 L70 20 H106 Q114 20 114 28 V66 Q114 74 106 74 H14 Q6 74 6 66 V28 Q6 20 14 20Z" fill="#333"/>`, ['cutie'], { size: 22, color: '#fff', font: `font-family="Arial, sans-serif"`, cy: 48 }) },
  { id: 'b-home', w: 0.26, svg: () => bub('0 0 180 120', `<path d="M90 6 L174 56 H150 V114 H30 V56 H6Z" fill="#f6f6f6" stroke="#aaa" stroke-width="2" stroke-linejoin="round"/>`, ['집에 가고 싶다.'], { size: 17, cy: 84, font: HAND }) },
  { id: 'b-blue', w: 0.28, svg: () => bub('0 0 200 100', `<path d="${cloudPath(100, 50, 84, 34)}" fill="#bcd2ee"/>`, ['칭찬 받으면', '더 잘해요'], { size: 15, color: '#2b3a5c', font: HAND }) },
  { id: 'b-sparkle', w: 0.28, svg: () => bub('0 0 200 110', `<ellipse cx="100" cy="55" rx="94" ry="48" fill="#fff" stroke="#999" stroke-width="1.6" stroke-dasharray="3 4"/>` + `<text x="100" y="22" font-size="11" text-anchor="middle" fill="#888">˚ ✧ ˚ · ✦ · ˚ ✧ ˚</text><text x="100" y="94" font-size="11" text-anchor="middle" fill="#888">· ˚ ✦ ˚ · ✧ · ˚ ✦</text>`, ['아름다운 시간만', '쌓아가자'], { size: 16, weight: 400 }) },
  { id: 'b-yellow', w: 0.3, svg: () => bub('0 0 220 70', `<rect x="0" y="0" width="220" height="70" fill="#fbf2a8"/>`, ['피할 수 없다면 즐기자♪'], { size: 17, font: GOTHIC, weight: 700 }) },
  { id: 'b-banner', w: 0.32, svg: () => bub('0 0 240 64', `<rect x="0" y="0" width="240" height="64" fill="#f48fc8"/><path d="M60 16 H200 L188 32 L200 48 H60 L72 32Z" fill="#fbd0e6" stroke="#7a2950" stroke-width="2"/>` + `<g transform="translate(14 14)"><circle cx="18" cy="18" r="16" fill="none" stroke="#7a2950" stroke-width="2"/><circle cx="12" cy="16" r="2" fill="#7a2950"/><circle cx="24" cy="16" r="2" fill="#7a2950"/><path d="M14 23 q4 3 8 0" stroke="#7a2950" stroke-width="1.6" fill="none"/></g>`, ['쭈욱 가보자고'], { size: 16, color: '#7a2950', dx: 22 }) },
  { id: 'b-crown', w: 0.3, svg: () => bub('0 0 220 70', `<path d="M0 14 L110 0 L220 14 V70 H0Z" fill="#fbe64a"/>`, ['♥ 오늘의 주인공 ♥'], { size: 19, font: BOLD, weight: 400, cy: 42 }) },
  { id: 'b-barcode', w: 0.3, svg: () => K('0 0 220 100', `<rect x="0" y="0" width="220" height="100" fill="#fff"/>` + T(110, 16, 14, '갓생 살기 [한정판]', `${GOTHIC} fill="${INK}"`) + `<path d="M0 28 H220" stroke="${INK}" stroke-width="1"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${12 + i * 3.6}" y="36" width="${[1, 2, 1, 3, 1, 2][i % 6]}" height="38" fill="${INK}"/>`).join('')}` + T(176, 56, 26, '2026', `font-family="Arial, sans-serif" fill="${INK}"`) + `<path d="M0 84 Q60 74 110 88 T220 82 V100 H0Z" fill="#2d6fd0"/><path d="M110 88 T220 82 V100 H140Z" fill="#2c9a4a"/>`) },
  { id: 'b-blackbox', w: 0.32, svg: () => bub('0 0 240 80', `<rect width="240" height="80" fill="#111"/>`, ['오늘 하루도 무사히.'], { size: 17, color: '#fff', weight: 400 }) },
  { id: 'b-pink', w: 0.18, svg: () => bub('0 0 120 60', `<rect width="120" height="60" fill="#f27fbf"/>`, ['느좋'], { size: 28, font: BOLD, weight: 400, color: '#1d1d1f' }) },
  { id: 'b-vertical', w: 0.13, svg: () => bub('0 0 80 170', `<ellipse cx="40" cy="85" rx="36" ry="80" fill="#fff" ${S}/>`, ['오', '늘', '도', '♡'], { size: 18 }) },
];

// ---------- 파스텔 귀염 ----------
const face = (cx, cy, s = 1, type = 'smile') => `<circle cx="${cx - 7 * s}" cy="${cy}" r="${2.4 * s}" fill="#4a3a40"/><circle cx="${cx + 7 * s}" cy="${cy}" r="${2.4 * s}" fill="#4a3a40"/>${type === 'smile' ? `<path d="M${cx - 3 * s} ${cy + 5 * s} q${3 * s} ${3 * s} ${6 * s} 0" stroke="#4a3a40" stroke-width="${1.8 * s}" fill="none" stroke-linecap="round"/>` : type === 'spiral' ? '' : `<path d="M${cx - 3 * s} ${cy + 6 * s} h${6 * s}" stroke="#4a3a40" stroke-width="${1.8 * s}"/>`}<ellipse cx="${cx - 12 * s}" cy="${cy + 5 * s}" rx="${3.5 * s}" ry="${2 * s}" fill="#f7a9c4" opacity=".8"/><ellipse cx="${cx + 12 * s}" cy="${cy + 5 * s}" rx="${3.5 * s}" ry="${2 * s}" fill="#f7a9c4" opacity=".8"/>`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PILL = ['#f6c6d8', '#c9e4f6', '#d8f0c9', '#f8e3a8', '#e2d4f6', '#fbd3bf'];
export const PASTEL_STICKERS = [
  { id: 'q-star', w: 0.14, svg: () => K('0 0 100 100', `<path d="${star(50, 52, 44, 22, 5)}" fill="#a9d1f5" stroke="#7fb3e3" stroke-width="3" stroke-linejoin="round"/>${face(50, 54, 1.1)}`) },
  { id: 'q-gstar', w: 0.14, svg: () => K('0 0 100 100', `<path d="${star(50, 52, 44, 22, 5)}" fill="#b9e6a0" stroke="#8cc96e" stroke-width="3" stroke-linejoin="round"/><path d="M38 52 m-4 0 a4 4 0 1 1 8 0 a2 2 0 1 1 -4 0 M62 52 m-4 0 a4 4 0 1 1 8 0 a2 2 0 1 1 -4 0" stroke="#4a3a40" stroke-width="1.8" fill="none"/><path d="M46 62 h8" stroke="#4a3a40" stroke-width="1.8"/>`) },
  { id: 'q-berry', w: 0.13, svg: () => K('0 0 100 110', `<rect x="14" y="24" width="72" height="72" rx="20" fill="#f39cb8"/>${[[30, 44], [50, 40], [70, 44], [36, 80], [64, 80]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#fde4ec"/>`).join('')}<path d="M50 26 q-14 -16 -26 -10 q12 4 26 10 q14 -16 26 -10 q-12 4 -26 10z" fill="#7cc47f"/>${face(50, 62, 1)}`) },
  { id: 'q-letter', w: 0.2, svg: () => K('0 0 160 100', `<rect x="4" y="4" width="152" height="92" fill="#fff" stroke="#9a9aa0" stroke-width="2"/><path d="M4 4 L80 52 L156 4" fill="none" stroke="#9a9aa0" stroke-width="2"/><path d="${heartPath(80, 46, 12)}" fill="#f48fb1"/>` + T(80, 80, 13, '"오늘도 설렘"', `${GOTHIC} fill="#555"`)) },
  { id: 'q-house', w: 0.17, svg: () => bub('0 0 130 120', `<path d="M65 6 L124 52 H108 V114 H22 V52 H6Z" fill="#bfe0f6"/><path d="${heartPath(65, 36, 9)}" fill="#f8e07a"/>`, ['잠시', '쉬어가도 돼'], { size: 13, color: '#3a5a7a', font: HAND, cy: 84 }) },
  { id: 'q-camera', w: 0.2, svg: () => K('0 0 160 110', `<rect x="6" y="24" width="148" height="80" rx="12" fill="#f6b7cf"/><rect x="18" y="12" width="34" height="16" rx="4" fill="#f6b7cf"/><rect x="6" y="40" width="148" height="12" fill="#f39cbf"/><circle cx="80" cy="66" r="30" fill="#4a4a4f"/><circle cx="80" cy="66" r="24" fill="#2b2b2f"/>` + T(80, 60, 11, '오늘', `${HAND} font-weight="700" fill="#fff"`) + T(80, 74, 11, '기록 완료', `${HAND} font-weight="700" fill="#fff"`)) },
  { id: 'q-wings', w: 0.18, svg: () => K('0 0 150 80', `<path d="M70 40 C50 6 14 10 8 26 C20 26 26 32 18 40 C30 40 34 46 26 54 C44 56 60 52 70 40Z" fill="#fbf0a8" stroke="#e6d36a" stroke-width="2"/><path d="M80 40 C100 6 136 10 142 26 C130 26 124 32 132 40 C120 40 116 46 124 54 C106 56 90 52 80 40Z" fill="#fbf0a8" stroke="#e6d36a" stroke-width="2"/>`) },
  { id: 'q-clover', w: 0.16, svg: () => K('0 0 110 110', `${[0, 90, 180, 270].map((a) => `<circle cx="55" cy="30" r="22" fill="#a8dcae" transform="rotate(${a} 55 55)"/>`).join('')}<circle cx="55" cy="55" r="20" fill="#a8dcae"/>` + T(55, 57, 16, '행운', `${BOLD} fill="#2f5a3a"`)) },
  { id: 'q-pinkburst', w: 0.2, svg: () => K('0 0 150 110', `<path d="${burst(75, 55, 70, 50, 9, 0.7, 4)}" fill="#f7b3d4"/>` + T(75, 56, 13, '쿨하게 한 번', `${HAND} font-weight="700" fill="#7a2950"`) + T(75, 72, 13, '해볼까?', `${HAND} font-weight="700" fill="#7a2950"`)) },
  { id: 'q-pencil', w: 0.13, svg: () => K('0 0 90 120', `<path d="M45 4 L74 36 H16Z" fill="#f8d8b0"/><path d="M45 4 L54 14 H36Z" fill="#555"/><rect x="16" y="36" width="58" height="66" fill="#f39cb8"/><rect x="16" y="102" width="58" height="14" fill="#c9c9cf"/>${face(45, 66, 1, 'flat')}`) },
  { id: 'q-heartpill', w: 0.14, svg: () => K('0 0 120 50', `<rect x="2" y="2" width="116" height="46" rx="23" fill="#f6c6d8"/>` + T(60, 26, 20, '♡ Love', `font-family="Georgia, serif" font-style="italic" fill="#a8476e"`)) },
  { id: 'q-stars', w: 0.34, svg: () => K('0 0 260 30', `<text x="130" y="20" font-size="16" text-anchor="middle" fill="#7a7a80" letter-spacing="2">· ˚ ✦ · ★ · ˚ ✧ ˚ · ★ · ✦ ˚ ·</text>`) },
  { id: 'q-bluelabel', w: 0.28, svg: () => bub('0 0 200 50', `<rect width="200" height="50" fill="#c9e4f6"/>`, ['오늘도 빛나는 나'], { size: 17, font: GOTHIC }) },
  { id: 'q-dessert', w: 0.12, svg: () => K('0 0 90 120', `<path d="M14 54 H76 L66 92 H24Z" fill="#e8f3f6" stroke="#bcd" stroke-width="2"/><ellipse cx="45" cy="54" rx="31" ry="8" fill="#9fd29a"/><path d="M14 54 C14 30 76 30 76 54" fill="#a8dca0"/><circle cx="45" cy="26" r="9" fill="#e85a5a"/><path d="M45 17 q3 -8 9 -9" stroke="#5f8a4f" stroke-width="2" fill="none"/><rect x="40" y="92" width="10" height="16" fill="#e8f3f6"/><ellipse cx="45" cy="110" rx="18" ry="4" fill="#e8f3f6" stroke="#bcd" stroke-width="2"/><path d="M38 64 m-3 0 a3 3 0 1 1 6 0 M52 64 m-3 0 a3 3 0 1 1 6 0" stroke="#4a3a40" stroke-width="1.6" fill="none"/>`) },
  ...MONTHS.map((m, i) => ({ id: 'q-m' + (i + 1), w: 0.1, svg: () => K('0 0 80 36', `<rect x="1" y="1" width="78" height="34" rx="17" fill="${PILL[i % PILL.length]}"/>` + T(40, 19, 17, m, `${ROUND} fill="#4a3a40"`)) })),
];

// ---------- 메모지 (글을 쓰거나 위에 그릴 수 있는 종이) ----------
const TAPE_TOP = (x, y, w, c, r = -2) => `<rect x="${x}" y="${y}" width="${w}" height="26" fill="${c}" opacity=".82" transform="rotate(${r} ${x + w / 2} ${y + 13})"/>`;
const shadow = `<defs><filter id="psh" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".14"/></filter></defs>`;
const grain = (id, base, dot) => `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${base}"/><circle cx="2" cy="3" r=".6" fill="${dot}"/><circle cx="6" cy="6" r=".5" fill="${dot}"/></pattern>`;
const deckle = (x, y, w, h, amp = 4, seed = 1) => {
  const pts = [];
  const step = 10;
  for (let i = 0; i <= w; i += step) pts.push([x + i, y + Math.sin(i * 0.7 + seed) * amp * 0.6 + ((i * 7 + seed) % 5) * 0.5]);
  for (let i = 0; i <= h; i += step) pts.push([x + w + Math.sin(i * 0.9 + seed) * amp * 0.6, y + i]);
  for (let i = w; i >= 0; i -= step) pts.push([x + i, y + h + Math.sin(i * 0.8 + seed) * amp * 0.7 + ((i * 3) % 4) * 0.6]);
  for (let i = h; i >= 0; i -= step) pts.push([x + Math.sin(i * 0.6 + seed) * amp * 0.6, y + i]);
  return 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L') + 'Z';
};
const tornBottom = (x, y, w, h) => {
  let d = `M${x} ${y} H${x + w} V${y + h}`;
  for (let i = w; i >= 0; i -= 8) d += ` L${x + i} ${y + h + ((i * 13) % 7) - 3}`;
  return d + 'Z';
};
const lines = (x1, x2, y0, n, gap, c = '#c9ccd3', w = 1) => Array.from({ length: n }, (_, i) => `<path d="M${x1} ${y0 + i * gap}H${x2}" stroke="${c}" stroke-width="${w}"/>`).join('');
const player = (bg, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/><rect x="${x + 10}" y="${y + 10}" width="${h - 20}" height="${h - 20}" fill="#fff"/>
  <g transform="translate(${x + h + 4} ${y + h / 2 - 16})" fill="#2b3a3a" stroke="#2b3a3a"><path d="M2 6 l10 8 M2 14 l10 -8" stroke-width="1.6" fill="none"/><path d="M26 4 v12 M28 10 l8 -6 v12z" stroke-width="1.6"/><path d="M50 2 l14 8 l-14 8z" stroke="none"/><path d="M78 4 l8 6 l-8 6z M88 4 v12" stroke-width="1.6"/><path d="M102 6 h10 l-3 -3 M112 14 h-10 l3 3" stroke-width="1.6" fill="none"/></g>
  <path d="M${x + h + 4} ${y + h / 2 + 16} H${x + w - 12}" stroke="#2b3a3a" stroke-width="1.4"/><circle cx="${x + h + 4 + (w - h - 16) * 0.65}" cy="${y + h / 2 + 16}" r="3.5" fill="#2b3a3a"/>
  <text x="${x + h + 4}" y="${y + h / 2 + 28}" font-size="7" fill="#2b3a3a">1:52</text><text x="${x + w - 12}" y="${y + h / 2 + 28}" font-size="7" text-anchor="end" fill="#2b3a3a">3:09</text>`;

export const PAPERS = [
  { id: 'pa-blue', w: 0.42, svg: () => K('0 0 200 210', `${shadow}<rect x="10" y="22" width="180" height="180" rx="22" fill="#cfe0f4" filter="url(#psh)"/>${TAPE_TOP(66, 8, 68, '#efeadc')}`) },
  { id: 'pa-gray', w: 0.42, svg: () => K('0 0 200 210', `${shadow}<rect x="10" y="20" width="180" height="182" fill="#d9d7d3" filter="url(#psh)"/>${TAPE_TOP(80, 6, 60, '#cfc6e4', 1)}`) },
  { id: 'pa-deckle', w: 0.42, svg: () => K('0 0 210 200', `${shadow}<defs>${grain('gdk', '#f1ede4', '#ddd6c8')}</defs><path d="${deckle(12, 18, 186, 170, 5, 2)}" fill="url(#gdk)" filter="url(#psh)"/>${TAPE_TOP(70, 4, 62, '#eef2f6', -3)}`) },
  { id: 'pa-note', w: 0.42, svg: () => K('0 0 200 220', `${shadow}<path d="${tornBottom(14, 18, 176, 186)}" fill="#f4f3ef" filter="url(#psh)"/>${lines(14, 190, 58, 11, 14)}${Array.from({ length: 10 }, (_, i) => `<circle cx="24" cy="${40 + i * 16}" r="4" fill="#e6e4de" stroke="#cfccc4" stroke-width="1"/>`).join('')}${TAPE_TOP(82, 4, 60, '#cfe0f4')}`) },
  { id: 'pa-stack', w: 0.42, svg: () => K('0 0 210 210', `${shadow}<rect x="10" y="24" width="168" height="176" fill="#cbc4e4" filter="url(#psh)" transform="rotate(-3 94 112)"/><rect x="32" y="28" width="168" height="170" fill="#f6f4ee" filter="url(#psh)"/>${TAPE_TOP(86, 14, 60, '#efeadc')}`) },
  { id: 'pa-recycled', w: 0.42, svg: () => K('0 0 220 210', `${shadow}<defs>${grain('grc', '#c4d0dc', '#a9b7c6')}</defs><rect x="22" y="18" width="178" height="178" fill="url(#grc)" filter="url(#psh)"/>${TAPE_TOP(166, 8, 56, '#efe4c8', 40)}${TAPE_TOP(-2, 168, 56, '#efe4c8', 40)}`) },
  { id: 'pa-check', w: 0.4, svg: () => K('0 0 190 190', `${shadow}<rect x="6" y="6" width="178" height="178" fill="#f7f4ea" filter="url(#psh)"/>` + T(95, 36, 22, 'check list', `${HAND} font-weight="700" fill="#2f7d7a"`) + [64, 98, 132, 166].map((y) => `<rect x="20" y="${y - 18}" width="12" height="12" fill="none" stroke="#2f7d7a" stroke-width="2"/><path d="M20 ${y} H170" stroke="#2f7d7a" stroke-width="1.6"/>`).join('')) },
  { id: 'pa-memo', w: 0.36, svg: () => K('0 0 170 200', `${shadow}<rect x="6" y="6" width="158" height="188" fill="#f6f0d6" filter="url(#psh)"/>` + T(85, 32, 20, 'memo', `${HAND} font-weight="700" font-style="italic" fill="#2f7d7a"`)) },
  { id: 'pa-todo', w: 0.36, svg: () => K('0 0 170 200', `${shadow}<rect x="6" y="6" width="158" height="188" fill="#f8f6f0" filter="url(#psh)"/>` + T(85, 30, 18, 'To Do', `${HAND} fill="${INK}" letter-spacing="3"`) + [62, 88, 114, 140, 166].map((y) => `<circle cx="24" cy="${y}" r="6" fill="none" stroke="#555" stroke-width="1.6"/>`).join('')) },
  { id: 'pa-legal', w: 0.4, svg: () => K('0 0 190 230', `${shadow}<rect x="6" y="6" width="178" height="218" fill="#f6efc9" filter="url(#psh)"/>${lines(6, 184, 50, 8, 24, '#b9b39a')}<path d="M50 6 V224" stroke="#e2847a" stroke-width="1.4"/>`) },
  { id: 'pa-title', w: 0.4, svg: () => K('0 0 190 190', `${shadow}<rect x="6" y="6" width="178" height="178" fill="#f4ead6" filter="url(#psh)"/><rect x="16" y="16" width="158" height="150" fill="#fff" stroke="#2f5f8a" stroke-width="1.6"/><path d="M24 50 H166" stroke="#2f5f8a" stroke-width="1.4"/>` + T(50, 36, 18, 'Title :', `${HAND} fill="#2f5f8a"`)) },
  { id: 'pa-player-g', w: 0.5, svg: () => K('0 0 240 100', `${shadow}<g filter="url(#psh)">${player('#bcd9c8', 4, 4, 232, 92)}</g>`) },
  { id: 'pa-player-b', w: 0.5, svg: () => K('0 0 240 100', `${shadow}<g filter="url(#psh)">${player('#bad3dc', 4, 4, 232, 92)}</g>`) },
  { id: 'pa-weekly', w: 0.4, svg: () => K('0 0 180 250', `${shadow}<rect x="6" y="6" width="168" height="238" fill="#f8f6f0" filter="url(#psh)"/>` + T(90, 30, 18, 'WEEKLY', `${HAND} fill="${INK}" letter-spacing="3"`) + ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => `<path d="M6 ${50 + i * 28} H174" stroke="#888" stroke-width="1"/>` + `<text x="14" y="${68 + i * 28}" font-size="10" ${HAND} fill="${INK}">${d}</text><path d="M44 ${56 + i * 28} l-6 18" stroke="#888" stroke-width="1"/>`).join('')) },
  { id: 'pa-wave', w: 0.36, svg: () => K('0 0 170 240', `${shadow}<rect x="6" y="6" width="158" height="228" fill="#f6f0dc" filter="url(#psh)"/><ellipse cx="85" cy="28" rx="13" ry="9" fill="none" stroke="#9a8a78" stroke-width="1.5"/><circle cx="85" cy="37" r="3" fill="none" stroke="#9a8a78" stroke-width="1.5"/>${[66, 100, 134, 168, 202].map((y) => `<path d="M6 ${y} q20 -8 40 0 t40 0 t40 0 t38 0" stroke="#b09c88" stroke-width="1.4" fill="none"/>`).join('')}`) },
  { id: 'pa-polaroid', w: 0.38, svg: () => K('0 0 180 250', `${shadow}<rect x="6" y="6" width="168" height="238" fill="#f4f1ea" filter="url(#psh)"/><rect x="22" y="30" width="136" height="136" fill="#fff" stroke="#e5e1d8"/>` + T(90, 18, 9, '· ARCHIVE ·', `${HAND} fill="#555" letter-spacing="2"`) + `<path d="M24 188 H156" stroke="#bbb" stroke-width="2"/><path d="M24 188 H112" stroke="#333" stroke-width="2"/><circle cx="112" cy="188" r="4" fill="#333"/><g transform="translate(34 206)" fill="#333" stroke="#333"><path d="M0 4 l10 8 M0 12 l10 -8" stroke-width="1.6" fill="none"/><path d="M26 2 v14 M28 9 l9 -7 v14z" stroke-width="1.6"/><path d="M52 0 l16 9 l-16 9z" stroke="none"/><path d="M82 2 l9 7 l-9 7z M93 2 v14" stroke-width="1.6"/></g>`) },
  { id: 'pa-stripe', w: 0.34, svg: () => K('0 0 150 230', `${shadow}<g filter="url(#psh)"><rect x="6" y="6" width="138" height="218" fill="#bcd8f2"/><rect x="6" y="6" width="138" height="66" fill="#f8efb8"/></g>${Array.from({ length: 9 }, (_, i) => `<path d="M${20 + i * 15} 72 V224" stroke="#fff" stroke-width="3"/>`).join('')}<ellipse cx="75" cy="39" rx="34" ry="17" fill="#c9c6c4"/>`) },
  { id: 'pa-heartgrid', w: 0.34, svg: () => K('0 0 150 230', `${shadow}<rect x="6" y="6" width="138" height="218" fill="#fbfaf8" filter="url(#psh)"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${6 + i * 23} 6 V224" stroke="#bbb" stroke-width=".8"/>`).join('')}${Array.from({ length: 10 }, (_, i) => `<path d="M6 ${6 + i * 23} H144" stroke="#bbb" stroke-width=".8"/>`).join('')}<path d="${heartPath(75, 70, 42)}" fill="#f0b7bf"/><path d="${heartPath(75, 156, 42)}" fill="#bdbcbc"/>`) },
  { id: 'pa-blocks', w: 0.34, svg: () => K('0 0 150 230', `${shadow}<rect x="6" y="6" width="138" height="218" fill="#f8efb8" filter="url(#psh)"/><rect x="16" y="18" width="118" height="22" fill="#a9d6dd"/><rect x="16" y="46" width="118" height="70" fill="#f4bcc6"/><rect x="16" y="124" width="118" height="22" fill="#a9d6dd"/><rect x="16" y="152" width="118" height="62" fill="#f4bcc6"/>`) },
  { id: 'pa-pinkline', w: 0.34, svg: () => K('0 0 150 230', `${shadow}<rect x="6" y="6" width="138" height="218" fill="#f4d9db" filter="url(#psh)"/>${lines(6, 144, 22, 10, 21, '#8a7a7c', 0.8)}<path d="M26 6 V224" stroke="#8a7a7c" stroke-width=".8"/><ellipse cx="118" cy="196" rx="10" ry="22" fill="#fbf4f0"/><path d="M118 180 V210" stroke="#d9c36a" stroke-width="4"/>`) },
  { id: 'pa-dots', w: 0.42, svg: () => K('0 0 220 150', `${shadow}<rect x="6" y="6" width="208" height="138" fill="#f6f5f4" filter="url(#psh)"/><rect x="6" y="6" width="208" height="46" fill="#cfcdcb"/><rect x="22" y="14" width="176" height="30" fill="#f3f2f0"/>${[[16, 80], [62, 80], [108, 80], [154, 80], [200, 80], [40, 124], [86, 124], [132, 124], [178, 124]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="#cfcdcb"/>`).join('')}`) },
];

// ---------- 마스킹테이프 추가분 ----------
const ENDS = {
  zig: 'M6 0 L234 0 L240 5 L235 11 L240 17 L235 22 L240 28 L235 33 L240 39 L234 44 L6 44 L0 39 L5 33 L0 28 L5 22 L0 17 L5 11 L0 5Z',
  straight: 'M2 2 L238 0 L240 42 L0 44Z',
  wavy: 'M8 0 L232 0 Q240 6 234 12 Q228 18 236 24 Q242 32 234 38 L232 44 L8 44 Q0 38 6 32 Q12 26 4 20 Q-2 12 6 6Z',
  angled: 'M14 0 L240 0 L226 44 L0 44Z',
  torn: 'M4 3 L60 0 L120 2 L180 0 L238 3 L236 12 L240 22 L235 33 L238 42 L180 44 L120 42 L60 44 L2 41 L5 30 L0 20 L4 10Z',
};
const tp = (pat, end = 'zig', op = 0.9) => K('0 0 240 44', `<defs>${pat}</defs><path d="${ENDS[end]}" fill="url(#${pat.match(/id="([^"]+)"/)[1]})" opacity="${op}"/>`);
const solid = (id, c, end, op = 0.9, extra = '') => tp(`<pattern id="${id}" width="240" height="44" patternUnits="userSpaceOnUse"><rect width="240" height="44" fill="${c}"/>${extra}</pattern>`, end, op);
const gingham = (id, a, b, s = 14) => `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><rect width="${s}" height="${s}" fill="#fff"/><rect width="${s / 2}" height="${s}" fill="${a}" opacity=".55"/><rect width="${s}" height="${s / 2}" fill="${a}" opacity=".55"/><rect width="${s / 2}" height="${s / 2}" fill="${b}"/></pattern>`;
const gridPat = (id, bg, line, s = 12, w = 1) => `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><rect width="${s}" height="${s}" fill="${bg}"/><path d="M${s} 0V${s}M0 ${s}H${s}" stroke="${line}" stroke-width="${w}"/></pattern>`;
const crumple = '<path d="M30 0 L70 44 M140 0 L120 44 M190 0 L210 44" stroke="#000" stroke-opacity=".06" stroke-width="2"/>';
export const TAPES2 = [
  { id: 'g-peach', label: '피치 깅엄', svg: () => tp(gingham('t-gp', '#fbcfae', '#f6b48a'), 'straight') },
  { id: 'g-lav', label: '라벤더 깅엄', svg: () => tp(gingham('t-gl', '#d8d4ec', '#c1bbe0'), 'straight') },
  { id: 'g-navy', label: '네이비 체크', svg: () => tp(gingham('t-gn', '#3a447a', '#28305e', 10), 'zig', 0.95) },
  { id: 'g-orange', label: '오렌지 깅엄', svg: () => tp(gingham('t-go', '#f9c25a', '#f3a73a'), 'angled') },
  { id: 'kraft-t', label: '크라프트 찢김', svg: () => solid('t-kt', '#c9a985', 'torn', 0.95, crumple) },
  { id: 'black', label: '블랙', svg: () => solid('t-bk', '#262626', 'angled', 0.95, crumple) },
  { id: 'floral', label: '플라워', svg: () => tp(`<pattern id="t-fl" width="48" height="44" patternUnits="userSpaceOnUse"><rect width="48" height="44" fill="#ece3dc"/>${[[12, 12], [36, 30]].map(([x, y]) => `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 4}" rx="3" ry="4.5" fill="#e08a8a" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="2" fill="#c45a5a"/>`).join('')}<path d="M30 8 q4 4 0 8 M8 32 q4 4 0 8" stroke="#e6a3a3" stroke-width="2" fill="none"/></pattern>`, 'zig') },
  { id: 'forest', label: '포레스트', svg: () => solid('t-fo', '#2f6b5f', 'wavy') },
  { id: 'sand', label: '샌드', svg: () => solid('t-sa', '#c8a77e', 'straight', 0.95, crumple) },
  { id: 'terracotta', label: '테라코타', svg: () => solid('t-te', '#a85a48', 'wavy') },
  { id: 'blush', label: '블러쉬', svg: () => solid('t-bl', '#ecc4bd', 'straight') },
  { id: 'linen', label: '리넨', svg: () => solid('t-li', '#e6e0d6', 'torn', 0.95, crumple) },
  { id: 'watercolor', label: '수채 핑크', svg: () => tp(`<linearGradient id="t-wc" x1="0" x2="1"><stop offset="0" stop-color="#f6c3d0"/><stop offset=".5" stop-color="#eeb0c0"/><stop offset="1" stop-color="#f7cdd8"/></linearGradient>`, 'zig', 0.9) },
  { id: 'pinkgrid', label: '핑크 모눈', svg: () => tp(gridPat('t-pg', '#fbeef6', '#d68ac0', 12, 1.2), 'zig') },
  { id: 'browngrid', label: '브라운 모눈', svg: () => tp(gridPat('t-bg', '#8c7a5c', '#d9ccb4', 12, 1), 'straight') },
  { id: 'blackgrid', label: '블랙 모눈', svg: () => tp(gridPat('t-kg', '#ffffff', '#222', 13, 1.4), 'torn', 0.85) },
  { id: 'kraftgrid', label: '크라프트 모눈', svg: () => tp(gridPat('t-kfg', '#c9a985', '#5a4532', 18, 1.2), 'straight') },
  { id: 'redheart', label: '레드 하트', svg: () => tp(`<pattern id="t-rh" width="26" height="22" patternUnits="userSpaceOnUse"><rect width="26" height="22" fill="#d9707e"/><path d="${heartPath(13, 11, 4)}" fill="#a3253a"/></pattern>`, 'straight') },
  { id: 'sky', label: '스카이', svg: () => solid('t-sk', '#bfe0fb', 'wavy') },
];

export const STICKER_GROUPS = [
  { name: '말풍선', items: BUBBLE_STICKERS },
  { name: '크레용', items: CRAYON_STICKERS },
  { name: '말랑', items: PUFFY_STICKERS },
  { name: '파스텔', items: PASTEL_STICKERS },
];
