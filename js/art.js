// ARCHIVE 그림 모음 — 감정·날씨 캐릭터, 다이어리 스티커, 마스킹테이프 (모두 직접 그린 SVG)
const INK = '#2b2522';
const sw = 'stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"';

// ---------- 얼굴 파츠 ----------
function eyes(type, y = 48, lx = 38, rx = 62) {
  const L = (d) => d(lx, y), R = (d) => d(rx, y);
  switch (type) {
    case 'squint': return `<path ${sw} d="M${lx - 5} ${y - 5} L${lx + 2} ${y} L${lx - 5} ${y + 5}"/><path ${sw} d="M${rx + 5} ${y - 5} L${rx - 2} ${y} L${rx + 5} ${y + 5}"/>`;
    case 'arcs': return [lx, rx].map((x) => `<path ${sw} d="M${x - 5} ${y + 2} Q${x} ${y - 6} ${x + 5} ${y + 2}"/>`).join('');
    case 'closed': return [lx, rx].map((x) => `<path ${sw} d="M${x - 5} ${y - 2} Q${x} ${y + 5} ${x + 5} ${y - 2}"/>`).join('');
    case 'dots': return [lx, rx].map((x) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${INK}"/>`).join('');
    case 'tired': return `<path ${sw} d="M${lx - 6} ${y - 2} L${lx + 4} ${y + 1}"/><path ${sw} d="M${rx + 6} ${y - 2} L${rx - 4} ${y + 1}"/>`;
    case 'tears': return [lx, rx].map((x) => `<circle cx="${x}" cy="${y - 2}" r="3" fill="${INK}"/><path d="M${x} ${y + 3} V${y + 14}" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`).join('');
    case 'big': return [lx, rx].map((x) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#fff"/><circle cx="${x}" cy="${y}" r="2.8" fill="${INK}"/>`).join('');
    case 'angry': return `<path ${sw} d="M${lx - 6} ${y - 4} L${lx + 5} ${y + 1}"/><path ${sw} d="M${rx + 6} ${y - 4} L${rx - 5} ${y + 1}"/>`;
    case 'droop': return `<path ${sw} d="M${lx - 6} ${y + 2} Q${lx - 1} ${y - 4} ${lx + 5} ${y}"/><path ${sw} d="M${rx + 6} ${y + 2} Q${rx + 1} ${y - 4} ${rx - 5} ${y}"/>`;
    case 'spiral': return [lx, rx].map((x) => `<circle cx="${x}" cy="${y}" r="5.5" stroke="${INK}" stroke-width="2.4" fill="#fff"/><circle cx="${x + 0.5}" cy="${y + 0.3}" r="2.2" stroke="${INK}" stroke-width="2" fill="none"/>`).join('');
    case 'sleepy': return [lx, rx].map((x) => `<circle cx="${x}" cy="${y}" r="5" stroke="${INK}" stroke-width="2.4" fill="#fff"/><path d="M${x - 5} ${y} H${x + 5}" stroke="${INK}" stroke-width="2.4"/>`).join('');
    case 'ring': return [lx, rx].map((x) => `<circle cx="${x}" cy="${y}" r="4" stroke="${INK}" stroke-width="2.6" fill="none"/>`).join('');
    case 'wide': return [lx, rx].map((x) => `<circle cx="${x}" cy="${y}" r="3" fill="${INK}"/>`).join('');
    default: return '';
  }
}
function mouth(type, y = 58, x = 50) {
  switch (type) {
    case 'smile': return `<path ${sw} d="M${x - 5} ${y - 2} Q${x} ${y + 4} ${x + 5} ${y - 2}"/>`;
    case 'flat': return `<path ${sw} d="M${x - 4} ${y} H${x + 4}"/>`;
    case 'frown': return `<path ${sw} d="M${x - 6} ${y + 3} Q${x} ${y - 4} ${x + 6} ${y + 3}"/>`;
    case 'wavy': return `<path stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round" d="M${x - 10} ${y} q2.5 -2.5 5 0 t5 0 t5 0 t5 0"/>`;
    case 'open': return `<ellipse cx="${x}" cy="${y + 2}" rx="4.5" ry="6.5" fill="#e8708a"/>`;
    default: return '';
  }
}
const svg100 = (inner, extra = '') => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ${extra}>${inner}</svg>`;

// ---------- 감정 ----------
export const MOODS = [
  { id: 'happy', label: '행복', color: '#f6b8bf', body: (c) => `<path fill="${c}" d="M50 88C22 71 9 54 12 36 15 20 36 15 50 31 64 15 85 20 88 36 91 54 78 71 50 88Z"/>`, e: 'squint', m: 'smile', ey: 46 },
  { id: 'fluster', label: '당황', color: '#fbe07a', body: (c) => `<path fill="${c}" d="M14 68C10 40 28 18 50 18S90 40 86 68C84 82 70 84 50 84S16 82 14 68Z"/>`, e: 'squint', m: 'flat', ey: 50 },
  { id: 'pleasure', label: '즐거움', color: '#f7a8da', body: (c) => `<rect x="11" y="20" width="78" height="64" rx="30" fill="${c}"/>`, e: 'arcs', m: 'smile', ey: 48 },
  { id: 'peaceful', label: '평온', color: '#93c4a0', body: (c) => `<path fill="${c}" d="M16 50C16 28 32 16 50 16S84 28 84 50V78C78 88 72 78 66 84 60 90 56 80 50 84 44 90 40 80 34 84 28 90 22 78 16 80Z"/>`, e: 'closed', m: 'smile', ey: 46 },
  { id: 'normal', label: '보통', color: '#cfe5e8', body: (c) => `<circle cx="50" cy="52" r="34" fill="${c}"/>`, e: 'dots', m: 'flat', ey: 50 },
  { id: 'tired', label: '지침', color: '#d9d5ce', body: (c) => `<ellipse cx="50" cy="54" rx="40" ry="28" fill="${c}"/>`, e: 'tired', m: 'flat', ey: 50 },
  { id: 'sad', label: '슬픔', color: '#8aa9e6', body: (c) => `<path fill="${c}" d="M12 70C12 40 30 22 50 22S88 40 88 70C88 82 78 84 50 84S12 82 12 70Z"/>`, e: 'tears', m: 'flat', ey: 50 },
  { id: 'anxiety', label: '불안', color: '#c9a8ee', body: (c) => `<g fill="${c}"><circle cx="30" cy="50" r="18"/><circle cx="50" cy="35" r="19"/><circle cx="70" cy="50" r="18"/><circle cx="38" cy="67" r="17"/><circle cx="62" cy="67" r="17"/><circle cx="50" cy="54" r="22"/></g>`, e: 'big', m: 'flat', ey: 50 },
  { id: 'anger', label: '화남', color: '#e46a7f', body: (c) => `<path fill="${c}" d="M14 60C14 40 22 28 26 16L38 33 50 12 62 33 74 16C78 28 86 40 86 60 86 78 70 86 50 86S14 78 14 60Z"/>`, e: 'angry', m: 'frown', ey: 52 },
  { id: 'disappointed', label: '실망', color: '#fbe39a', body: (c) => `<path fill="${c}" d="M8 52C8 52 14 50 16 46 20 28 34 18 50 18S80 28 84 46C86 50 92 52 92 52S86 54 84 58C80 76 66 86 50 86S20 76 16 58C14 54 8 52 8 52Z"/>`, e: 'droop', m: 'frown', ey: 47 },
  { id: 'stress', label: '스트레스', color: '#e59a95', body: (c) => `<g fill="${c}"><circle cx="22" cy="32" r="13"/><circle cx="78" cy="32" r="13"/><rect x="13" y="24" width="74" height="60" rx="28"/></g>`, e: 'spiral', m: 'wavy', ey: 50 },
  { id: 'sleepy', label: '졸림', color: '#bcd2ef', body: (c) => `<rect x="10" y="24" width="80" height="58" rx="28" fill="${c}"/>`, e: 'sleepy', m: 'flat', ey: 50 },
  { id: 'surprised', label: '놀람', color: '#fbc4a4', body: (c) => `<path fill="${c}" d="M16 54C16 32 32 18 50 18S84 32 84 54C84 66 80 72 78 74 80 80 74 86 68 82 64 88 58 88 54 84 50 88 44 88 40 84 34 88 28 84 30 78 22 78 16 70 16 54Z"/>`, e: 'wide', m: 'open', ey: 46 },
  { id: 'numbness', label: '무감각', color: '#e8cdea', body: (c) => `<path fill="${c}" d="M16 34C16 24 26 20 36 24S54 28 64 24C76 20 86 26 86 38 86 48 80 52 82 62 84 74 76 84 62 82 52 80 46 80 36 82 22 86 14 76 16 64 18 54 16 46 16 34Z"/>`, e: 'ring', m: 'flat', ey: 50 },
];
export function moodSvg(id) {
  const m = MOODS.find((x) => x.id === id);
  if (!m) return '';
  return svg100(m.body(m.color) + eyes(m.e, m.ey) + mouth(m.m, m.ey + 10));
}

// ---------- 날씨 ----------
const CLOUD = 'M26 72C16 72 11 65 11 58 11 50 17 44 26 44 27 33 36 26 46 27 52 20 64 20 70 29 80 29 88 37 87 47 93 49 95 57 93 62 91 68 86 72 80 72Z';
const cloud = (fill, t = '') => `<path d="${CLOUD}" fill="${fill}" ${t}/>`;
const cface = (dx = 0, dy = 0) => `<g transform="translate(${dx} ${dy})"><circle cx="44" cy="51" r="3" fill="${INK}"/><circle cx="58" cy="51" r="3" fill="${INK}"/><path ${sw} d="M45 58 Q51 63 57 58"/></g>`;
const rays = (cx, cy, r1, r2, color, w = 6) => Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  return `<path d="M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}).join('');
const drops = (pts) => pts.map(([x, y]) => `<path d="M${x} ${y} l-3 8" stroke="#8fc0ee" stroke-width="4" stroke-linecap="round"/>`).join('');
const flake = (x, y, r = 4.5) => `<g stroke="#8fc0ee" stroke-width="2.6" stroke-linecap="round"><path d="M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}M${x - r * 0.7} ${y - r * 0.7}L${x + r * 0.7} ${y + r * 0.7}M${x + r * 0.7} ${y - r * 0.7}L${x - r * 0.7} ${y + r * 0.7}"/></g>`;
const SKY = '#bfe0fb', GRAY = '#a3a3a3', SUN = '#f6c140';

export const WEATHERS = [
  { id: 'sunny', label: '맑음', draw: () => rays(50, 50, 30, 39, SUN) + `<circle cx="50" cy="50" r="23" fill="${SUN}"/>` + cface(-1, -1) },
  { id: 'partly', label: '구름 조금', draw: () => `<g transform="translate(14 -12) scale(.72)">${rays(50, 50, 30, 39, SUN, 7)}<circle cx="50" cy="50" r="23" fill="${SUN}"/><circle cx="44" cy="49" r="3.4" fill="${INK}"/><circle cx="57" cy="49" r="3.4" fill="${INK}"/><path ${sw} d="M45 57 Q51 62 57 57"/></g>` + `<g transform="translate(-8 14) scale(.82)">${cloud(SKY)}</g>` },
  { id: 'cloudy', label: '흐림', draw: () => cloud(SKY) + cface() },
  { id: 'fog', label: '안개', draw: () => `<g transform="translate(0 -8)">${cloud(GRAY)}${cface()}</g><g stroke="${GRAY}" stroke-width="5" stroke-linecap="round"><path d="M28 74H72M20 83H80M30 92H70"/></g>` },
  { id: 'rain', label: '비', draw: () => `<g transform="translate(0 -10)">${cloud(SKY)}${cface()}</g>` + drops([[36, 70], [52, 76], [66, 70]]) },
  { id: 'storm', label: '폭우', draw: () => `<g transform="translate(0 -10)">${cloud(SKY)}${cface()}</g>` + drops([[30, 68], [44, 68], [58, 68], [72, 68], [36, 82], [50, 82], [64, 82]]) },
  { id: 'snow', label: '눈', draw: () => `<g transform="translate(0 -10)">${cloud(SKY)}${cface()}</g>` + flake(38, 80) + flake(62, 74) },
  { id: 'blizzard', label: '폭설', draw: () => `<g transform="translate(0 -10)">${cloud(SKY)}${cface()}</g>` + flake(30, 72, 4) + flake(50, 72, 4) + flake(70, 72, 4) + flake(40, 86, 4) + flake(60, 86, 4) },
  { id: 'thunder', label: '천둥', draw: () => `<g transform="translate(0 -10)">${cloud(GRAY)}${cface()}</g><path d="M52 62 L43 80 H52 L47 95 L63 74 H54 L59 62Z" fill="${SUN}"/>` + drops([[32, 70], [72, 70]]) },
];
export const weatherSvg = (id) => { const w = WEATHERS.find((x) => x.id === id); return w ? svg100(w.draw()) : ''; };

// 예전 이모지 기록 → 새 캐릭터
export const LEGACY_MOOD = { '😆': 'happy', '🙂': 'pleasure', '😐': 'normal', '😔': 'disappointed', '😢': 'sad', '😡': 'anger', '😴': 'sleepy', '🥰': 'happy' };
export const LEGACY_WEATHER = { '☀️': 'sunny', '⛅': 'partly', '☁️': 'cloudy', '🌧️': 'rain', '⛈️': 'thunder', '❄️': 'snow', '🌫️': 'fog', '🌈': 'sunny' };
export const moodId = (v) => LEGACY_MOOD[v] || v || '';
export const weatherId = (v) => LEGACY_WEATHER[v] || v || '';
export const moodLabel = (v) => (MOODS.find((m) => m.id === moodId(v)) || {}).label || '';
export const weatherLabel = (v) => (WEATHERS.find((m) => m.id === weatherId(v)) || {}).label || '';

// ---------- 다이어리 스티커 (텍스트 스티커 + 소품) ----------
const HAND = `font-family="Gaegu, 'Gamja Flower', sans-serif"`;
const ROUND = `font-family="Jua, 'Gowun Dodum', sans-serif"`;
const K = (vb, inner) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const T = (x, y, size, text, attrs = '') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="middle" ${attrs}>${text}</text>`;
const scallop = (cx, cy, r, n, fill, stroke, w = 5) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * r.x, y = cy + Math.sin(a) * r.y;
    if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
    else {
      const am = ((i - 0.5) / n) * Math.PI * 2;
      d += ` Q${(cx + Math.cos(am) * r.x * 1.18).toFixed(1)} ${(cy + Math.sin(am) * r.y * 1.18).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
};
const star = (cx, cy, r1, r2, n) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return d + 'Z';
};

export const STICKERS = [
  { id: 'bubble', w: 0.42, svg: () => K('0 0 240 150', `<ellipse cx="120" cy="66" rx="110" ry="56" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M84 116 L74 146 L104 118" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M80 114 L104 116" stroke="#fff" stroke-width="5"/>` + T(120, 66, 25, '오늘 진짜 열심히 함', `${HAND} font-weight="700" fill="${INK}"`)) },
  { id: 'window', w: 0.44, svg: () => K('0 0 260 150', `<rect x="4" y="4" width="252" height="142" rx="6" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M4 30H256" stroke="${INK}" stroke-width="3"/><rect x="230" y="10" width="16" height="14" fill="none" stroke="${INK}" stroke-width="2"/><path d="M233 13l10 8M243 13l-10 8" stroke="${INK}" stroke-width="2"/>` + T(130, 62, 19, '오늘 공부 끝!', `${ROUND} fill="${INK}"`) + T(130, 88, 15, '퇴근하시겠습니까?', `${ROUND} fill="#555"`) + `<rect x="100" y="104" width="60" height="28" rx="3" fill="#f6d64a" stroke="${INK}" stroke-width="2.5"/>` + T(130, 119, 16, 'YES', `${ROUND} fill="${INK}"`) + `<path d="M158 122 l0 22 l6 -6 l5 10 l5 -2 l-5 -10 l8 0z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`) },
  { id: 'proud', w: 0.3, svg: () => K('0 0 170 140', scallop(85, 70, { x: 66, y: 50 }, 12, '#fff', '#4f9d52', 7) + T(85, 72, 42, '뿌듯', `${ROUND} fill="#1f2f6b"`)) },
  { id: 'boom', w: 0.4, svg: () => K('0 0 220 180', `<path d="${star(110, 90, 100, 66, 14)}" fill="#fbe36a" stroke="#e7c43a" stroke-width="4" stroke-linejoin="round"/>` + T(110, 76, 30, '합격', `${ROUND} fill="#b5283b" stroke="#fff" stroke-width="5" paint-order="stroke"`) + T(110, 110, 30, '가즈아', `${ROUND} fill="#b5283b" stroke="#fff" stroke-width="5" paint-order="stroke"`)) },
  { id: 'tomato', w: 0.42, svg: () => K('0 0 260 130', `<ellipse cx="130" cy="74" rx="122" ry="50" fill="#ef6a4f"/><path d="M130 30 l-26 -14 l18 2 l8 -14 l8 14 l18 -2 z" fill="#5fb05a" stroke="#3d8a3a" stroke-width="2" stroke-linejoin="round"/>` + T(130, 78, 24, '목표: 갓생 살기', `${HAND} font-weight="700" fill="#3b1d14"`)) },
  { id: 'ribbon', w: 0.44, svg: () => K('0 0 280 90', `<path d="M10 22 H50 V72 H10 L26 47Z" fill="#e88aa8"/><path d="M270 22 H230 V72 H270 L254 47Z" fill="#e88aa8"/><path d="M40 14 H240 V64 H40Z" fill="#f7b3c8" stroke="#e88aa8" stroke-width="3"/>` + T(140, 40, 24, '오늘도 화이팅', `${ROUND} fill="#7a2944"`)) },
  { id: 'pixel', w: 0.3, svg: () => K('0 0 180 90', T(90, 30, 30, '공부!!♥', `font-family="'Courier New', monospace" font-weight="900" fill="#f067a6" letter-spacing="1"`) + T(90, 66, 30, '♥!!공부', `font-family="'Courier New', monospace" font-weight="900" fill="#f067a6" letter-spacing="1"`)) },
  { id: 'notepad', w: 0.3, svg: () => K('0 0 170 170', `<rect x="12" y="20" width="146" height="140" fill="#fbf4dc" stroke="${INK}" stroke-width="3" transform="rotate(-3 85 90)"/><path d="M40 12h50l-6 22h-50z" fill="#f2a3b6" opacity=".85"/>` + T(85, 78, 30, '할 게', `${HAND} font-weight="700" fill="${INK}" transform="rotate(-3 85 90)"`) + T(85, 116, 30, '산더미', `${HAND} font-weight="700" fill="${INK}" transform="rotate(-3 85 90)"`)) },
  { id: 'phone', w: 0.26, svg: () => K('0 0 150 120', `<rect x="4" y="4" width="142" height="112" rx="4" fill="#6fa8b8" stroke="#3d6f7d" stroke-width="3"/><g fill="#173a44"><rect x="12" y="20" width="4" height="6"/><rect x="18" y="16" width="4" height="10"/><rect x="24" y="12" width="4" height="14"/><rect x="116" y="12" width="22" height="12" rx="2"/></g>` + T(75, 56, 17, '멘탈 관리 중', `font-family="'Courier New', monospace" font-weight="700" fill="#0f2a32"`) + T(75, 82, 17, '포기 금지!', `font-family="'Courier New', monospace" font-weight="700" fill="#0f2a32"`)) },
  { id: 'label', w: 0.44, svg: () => K('0 0 260 64', `<rect x="2" y="2" width="256" height="60" fill="#2c3f9e"/>` + T(130, 33, 24, '작은 행복 수집 중.', `font-family="'Gowun Dodum', sans-serif" fill="#fff"`)) },
  { id: 'pass', w: 0.24, svg: () => K('0 0 140 140', `<g transform="rotate(-12 70 70)" fill="none" stroke="#d6453f" stroke-width="5"><circle cx="70" cy="70" r="60"/><circle cx="70" cy="70" r="50" stroke-width="2"/></g>` + T(70, 72, 36, 'PASS', `font-family="Georgia, serif" font-weight="900" fill="#d6453f" transform="rotate(-12 70 70)" letter-spacing="2"`)) },
  { id: 'goodjob', w: 0.24, svg: () => K('0 0 140 140', `<circle cx="70" cy="70" r="62" fill="none" stroke="#e0566f" stroke-width="5"/>${[...Array(5)].map((_, i) => { const a = -Math.PI / 2 + (i - 2) * 0.32; return `<path d="${star(70 + Math.cos(a) * 44, 70 + Math.sin(a) * 44, 7, 3, 5)}" fill="#e0566f"/>`; }).join('')}` + T(70, 72, 24, '참 잘했어요', `${ROUND} fill="#e0566f"`)) },
  { id: 'thought', w: 0.3, svg: () => K('0 0 180 140', `<g fill="#fff" stroke="${INK}" stroke-width="3"><ellipse cx="96" cy="58" rx="78" ry="48"/><circle cx="36" cy="116" r="11"/><circle cx="18" cy="134" r="5"/></g>` + T(96, 60, 26, '느낌 좋아', `${ROUND} fill="${INK}"`)) },
  { id: 'okwin', w: 0.38, svg: () => K('0 0 220 130', `<rect x="3" y="3" width="214" height="124" fill="#ece9d8" stroke="#2457c5" stroke-width="4"/><rect x="3" y="3" width="214" height="26" fill="#2f6ae0"/>` + T(56, 17, 13, 'Notice', `font-family="Tahoma, sans-serif" font-weight="700" fill="#fff"`) + `<path d="M28 52 L44 80 H12Z" fill="#f6d64a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` + T(28, 70, 16, '!', `font-family="Arial" font-weight="900" fill="${INK}"`) + T(130, 64, 18, '집중 모드 ON', `${ROUND} fill="${INK}"`) + `<rect x="98" y="88" width="64" height="24" fill="#ece9d8" stroke="#555" stroke-width="2"/>` + T(130, 101, 14, 'OK', `font-family="Tahoma, sans-serif" fill="${INK}"`)) },
  { id: 'heart', w: 0.16, svg: () => K('0 0 100 100', `<path d="M50 86C22 69 10 52 13 35 16 20 36 15 50 31 64 15 84 20 87 35 90 52 78 69 50 86Z" fill="#ef5b6b" stroke="${INK}" stroke-width="3"/><path d="M28 36q4-8 12-6" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>`) },
  { id: 'star', w: 0.16, svg: () => K('0 0 100 100', `<path d="${star(50, 52, 44, 20, 5)}" fill="#f8cf4a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="43" cy="52" r="2.6" fill="${INK}"/><circle cx="57" cy="52" r="2.6" fill="${INK}"/><path d="M45 59q5 4 10 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`) },
  { id: 'sparkle', w: 0.15, svg: () => K('0 0 100 100', `<path d="M40 10C44 34 50 40 74 44 50 48 44 54 40 78 36 54 30 48 6 44 30 40 36 34 40 10Z" fill="#ffd34e"/><path d="M78 58C80 70 83 73 94 75 83 77 80 80 78 92 76 80 73 77 62 75 73 73 76 70 78 58Z" fill="#9ad3ff"/>`) },
  { id: 'flower', w: 0.15, svg: () => K('0 0 100 100', `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="50" cy="26" rx="15" ry="22" fill="#f7a8c2" stroke="${INK}" stroke-width="2.5" transform="rotate(${a} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="12" fill="#f8cf4a" stroke="${INK}" stroke-width="2.5"/>`) },
  { id: 'clover', w: 0.15, svg: () => K('0 0 100 100', `${[0, 90, 180, 270].map((a) => `<path d="M50 50C34 40 30 20 42 16 48 14 50 20 50 22 50 20 52 14 58 16 70 20 66 40 50 50Z" fill="#7cc47f" stroke="#3d8a3a" stroke-width="2.5" transform="rotate(${a} 50 50)"/>`).join('')}<path d="M50 52 Q58 74 70 88" stroke="#3d8a3a" stroke-width="4" fill="none" stroke-linecap="round"/>`) },
  { id: 'bear', w: 0.18, svg: () => K('0 0 100 100', `<g stroke="${INK}" stroke-width="3"><circle cx="24" cy="28" r="13" fill="#c99a6e"/><circle cx="76" cy="28" r="13" fill="#c99a6e"/><circle cx="50" cy="56" r="36" fill="#c99a6e"/><ellipse cx="50" cy="66" rx="15" ry="11" fill="#f2dcc2"/></g><circle cx="37" cy="52" r="3.2" fill="${INK}"/><circle cx="63" cy="52" r="3.2" fill="${INK}"/><ellipse cx="50" cy="62" rx="4" ry="3" fill="${INK}"/><path d="M45 69q5 4 10 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`) },
  { id: 'bunny', w: 0.18, svg: () => K('0 0 100 110', `<g stroke="${INK}" stroke-width="3" fill="#fff"><ellipse cx="34" cy="28" rx="10" ry="26"/><ellipse cx="66" cy="28" rx="10" ry="26"/><ellipse cx="50" cy="70" rx="38" ry="32"/></g><ellipse cx="34" cy="28" rx="4" ry="16" fill="#f7b3c8"/><ellipse cx="66" cy="28" rx="4" ry="16" fill="#f7b3c8"/><circle cx="37" cy="68" r="3" fill="${INK}"/><circle cx="63" cy="68" r="3" fill="${INK}"/><path d="M46 76q4 4 8 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="28" cy="78" rx="6" ry="3.5" fill="#f7b3c8"/><ellipse cx="72" cy="78" rx="6" ry="3.5" fill="#f7b3c8"/>`) },
  { id: 'cat', w: 0.18, svg: () => K('0 0 100 100', `<path d="M16 40 L20 10 L40 28 H60 L80 10 L84 40 C90 70 74 90 50 90 S10 70 16 40Z" fill="#f4c27f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M40 28 l10 10 10 -10" fill="#e9a65a"/><circle cx="37" cy="56" r="3.2" fill="${INK}"/><circle cx="63" cy="56" r="3.2" fill="${INK}"/><path d="M44 66q3 4 6 0q3 4 6 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M14 60h16M14 68h16M70 60h16M70 68h16" stroke="${INK}" stroke-width="2"/>`) },
  { id: 'coffee', w: 0.16, svg: () => K('0 0 100 100', `<path d="M20 36 H72 L66 86 H26Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M72 46 C88 46 88 70 68 70" stroke="${INK}" stroke-width="3" fill="none"/><path d="M24 50 H68" stroke="#b9805a" stroke-width="10"/><path d="M38 26c-4-6 4-8 0-16M52 26c-4-6 4-8 0-16" stroke="#999" stroke-width="2.6" fill="none" stroke-linecap="round"/>`) },
  { id: 'done', w: 0.2, svg: () => K('0 0 120 120', `<circle cx="60" cy="52" r="40" fill="#8fd19a" stroke="${INK}" stroke-width="3"/><path d="M40 52 l14 14 l26 -28" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` + T(60, 108, 18, 'DONE', `${ROUND} fill="${INK}"`)) },
  { id: 'arrow', w: 0.2, svg: () => K('0 0 140 80', `<path d="M10 54 C40 18 80 16 118 40" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 26 L122 42 L98 54" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`) },
  { id: 'pencil', w: 0.24, svg: () => K('0 0 160 50', `<path d="M10 25 L30 12 H136 V38 H30Z" fill="#f8cf4a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M10 25 L22 17 V33Z" fill="${INK}"/><rect x="136" y="12" width="16" height="26" rx="3" fill="#f2a3b6" stroke="${INK}" stroke-width="3"/><path d="M30 25 H130" stroke="#e2b230" stroke-width="2"/>`) },
];
export const stickerSvg = (id) => {
  const s = STICKERS.find((x) => x.id === id);
  if (s) return s.svg();
  if (id.startsWith('mood:')) return moodSvg(id.slice(5));
  if (id.startsWith('weather:')) return weatherSvg(id.slice(8));
  return '';
};
export const stickerDefaultW = (id) => (STICKERS.find((x) => x.id === id) || { w: 0.16 }).w;

// ---------- 마스킹테이프 ----------
const TORN = 'M6 0 L234 0 L240 5 L235 11 L240 17 L235 22 L240 28 L235 33 L240 39 L234 44 L6 44 L0 39 L5 33 L0 28 L5 22 L0 17 L5 11 L0 5Z';
const tape = (id, defs, fill) => K('0 0 240 44', `<defs>${defs}</defs><path d="${TORN}" fill="${fill}" opacity=".88"/>`);
export const TAPES = [
  { id: 'kraft', label: '크라프트', svg: () => tape('kraft', `<pattern id="tp-kraft" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#d8c19b"/><circle cx="1" cy="2" r=".6" fill="#c4aa80"/><circle cx="4" cy="5" r=".5" fill="#e6d3b3"/></pattern>`, 'url(#tp-kraft)') },
  { id: 'stripe', label: '스트라이프', svg: () => tape('stripe', `<pattern id="tp-stripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#fff4f6"/><rect width="7" height="14" fill="#f5b5c4"/></pattern>`, 'url(#tp-stripe)') },
  { id: 'dot', label: '도트', svg: () => tape('dot', `<pattern id="tp-dot" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#cdeedd"/><circle cx="6" cy="6" r="2.4" fill="#fff"/></pattern>`, 'url(#tp-dot)') },
  { id: 'grid', label: '모눈', svg: () => tape('grid', `<pattern id="tp-grid" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#e3eefc"/><path d="M10 0V10M0 10H10" stroke="#9cc0ee" stroke-width="1"/></pattern>`, 'url(#tp-grid)') },
  { id: 'gingham', label: '깅엄', svg: () => tape('gingham', `<pattern id="tp-gingham" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff8d9"/><rect width="8" height="16" fill="#f8de7e" opacity=".6"/><rect width="16" height="8" fill="#f8de7e" opacity=".6"/></pattern>`, 'url(#tp-gingham)') },
  { id: 'heart', label: '하트', svg: () => tape('heart', `<pattern id="tp-heart" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#ffe3ea"/><path d="M11 16C6 13 4 10 5 7.5 6 5 9 5 11 7.5 13 5 16 5 17 7.5 18 10 16 13 11 16Z" fill="#f48aa5"/></pattern>`, 'url(#tp-heart)') },
  { id: 'star', label: '별', svg: () => tape('star', `<pattern id="tp-star" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#e7dcfb"/><path d="${star(10, 10, 5, 2.2, 5)}" fill="#fff"/></pattern>`, 'url(#tp-star)') },
  { id: 'mono', label: '모노', svg: () => tape('mono', `<pattern id="tp-mono" width="10" height="44" patternUnits="userSpaceOnUse"><rect width="10" height="44" fill="#f2f2f2"/><rect width="4" height="44" fill="#222"/></pattern>`, 'url(#tp-mono)') },
  { id: 'vintage', label: '빈티지', svg: () => K('0 0 240 44', `<path d="${TORN}" fill="#cfcac0" opacity=".9"/><text x="120" y="24" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'Nanum Myeongjo', serif" font-size="12" letter-spacing="3" fill="#6b665e">ARCHIVE · ARCHIVE</text>`) },
  { id: 'clear', label: '반투명', svg: () => K('0 0 240 44', `<path d="${TORN}" fill="#ffffff" opacity=".55" stroke="#ddd" stroke-width="1"/>`) },
];
export const tapeSvg = (id) => (TAPES.find((t) => t.id === id) || TAPES[0]).svg();
