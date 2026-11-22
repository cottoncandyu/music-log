// 다이어리 꾸미기 생성기 — 오늘의 기록 카드 6종 · 타임테이블 · 할 일 카드 · 큰 날짜 스티커
import { state, subjectColor } from './store.js';
import { collageSvg } from './art3.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const K = (vb, inner) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const MONO = `font-family="'Courier Prime', 'Nanum Gothic Coding', monospace"`;
const SANS = `font-family="'Gowun Dodum', 'Noto Sans KR', sans-serif"`;
const HAND = `font-family="Caveat, 'Nanum Pen Script', Gaegu, cursive"`;
const WD_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WD_FULL = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MON_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const shadow = (id) => `<defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".16"/></filter></defs>`;
const barcode = (x, y, n = 30, h = 18, c = '#222') => `<g transform="translate(${x} ${y})">${Array.from({ length: n }, (_, i) => `<rect x="${i * 4}" width="${[1, 2, 1, 3, 1.5][i % 5]}" height="${h}" fill="${c}"/>`).join('')}</g>`;
const parse = (d) => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd); };

export const RECORD_DESIGNS = [['receipt', '영수증'], ['ticket', '영화 티켓'], ['boarding', '탑승권'], ['report', '성적표'], ['player', '뮤직 플레이어'], ['daily', '일력']];

/** d: { ymd, date, rows:[[라벨,값]], note, self, goal, song } */
export function recordSvg(d) {
  const design = d.design || 'receipt';
  const rows = (d.rows || []).slice(0, 9);
  const dt = d.ymd ? parse(d.ymd) : new Date();
  if (design === 'ticket') {
    const h = 150;
    const list = rows.slice(0, 6);
    return K(`0 0 300 ${h}`, `${shadow('tks')}<g filter="url(#tks)"><path d="M8 4 H222 a8 8 0 0 0 16 0 H292 V${h - 4} H238 a8 8 0 0 0 -16 0 H8Z" fill="#f4e7d0"/></g>
      <rect x="16" y="12" width="198" height="${h - 24}" fill="none" stroke="#b5452f" stroke-width="1.5"/>
      <text x="115" y="34" text-anchor="middle" font-family="'Abril Fatface', 'Song Myung', serif" font-size="20" fill="#b5452f" letter-spacing="2">ADMIT ONE</text>
      <text x="115" y="50" text-anchor="middle" ${MONO} font-size="9" fill="#6a4a3a">TODAY'S RECORD · ${esc(d.date || '')}</text>
      ${list.map((r, i) => `<text x="${i % 2 ? 122 : 26}" y="${72 + Math.floor(i / 2) * 18}" ${SANS} font-size="10" fill="#6a4a3a">${esc(r[0])}</text><text x="${i % 2 ? 206 : 110}" y="${72 + Math.floor(i / 2) * 18}" text-anchor="end" ${MONO} font-size="10.5" font-weight="700" fill="#2b2522">${esc(r[1])}</text>`).join('')}
      ${d.note ? `<text x="115" y="${h - 20}" text-anchor="middle" ${HAND} font-size="15" fill="#b5452f">"${esc(d.note)}"</text>` : ''}
      <path d="M230 12 V${h - 12}" stroke="#b5452f" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="264" y="40" text-anchor="middle" ${MONO} font-size="10" fill="#6a4a3a">${MON_EN[dt.getMonth()]}</text>
      <text x="264" y="84" text-anchor="middle" font-family="'Abril Fatface', serif" font-size="44" fill="#b5452f">${dt.getDate()}</text>
      <text x="264" y="104" text-anchor="middle" ${MONO} font-size="10" fill="#6a4a3a">${WD_EN[dt.getDay()]}</text>
      <text x="264" y="128" text-anchor="middle" ${MONO} font-size="8" fill="#6a4a3a">No.${String(dt.getFullYear()).slice(2)}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}</text>`);
  }
  if (design === 'boarding') {
    const list = rows.slice(0, 6);
    return K('0 0 320 170', `${shadow('bps')}<rect x="6" y="6" width="308" height="158" rx="12" fill="#fbfbf8" filter="url(#bps)"/>
      <path d="M6 18 a12 12 0 0 1 12 -12 H302 a12 12 0 0 1 12 12 V40 H6Z" fill="#3d5f9a"/>
      <text x="20" y="29" ${MONO} font-size="12" font-weight="700" fill="#fff" letter-spacing="2">BOARDING PASS</text><text x="300" y="29" text-anchor="end" ${MONO} font-size="10" fill="#dbe6f7">ARCHIVE AIR</text>
      <text x="20" y="60" ${MONO} font-size="8" fill="#888">FROM</text><text x="20" y="82" font-family="'Archivo Black', 'Black Han Sans', sans-serif" font-size="22" fill="#223">어제</text>
      <path d="M96 72 H140 M132 66 L140 72 L132 78" stroke="#3d5f9a" stroke-width="2" fill="none"/>
      <text x="150" y="60" ${MONO} font-size="8" fill="#888">TO</text><text x="150" y="82" font-family="'Archivo Black', 'Black Han Sans', sans-serif" font-size="22" fill="#223">내일</text>
      ${list.map((r, i) => `<text x="${20 + (i % 3) * 78}" y="${106 + Math.floor(i / 3) * 30}" ${MONO} font-size="7.5" fill="#888">${esc(r[0])}</text><text x="${20 + (i % 3) * 78}" y="${119 + Math.floor(i / 3) * 30}" ${MONO} font-size="11" font-weight="700" fill="#223">${esc(r[1])}</text>`).join('')}
      <path d="M248 46 V158" stroke="#bbb" stroke-dasharray="3 3"/>
      <text x="282" y="64" text-anchor="middle" ${MONO} font-size="8" fill="#888">DATE</text><text x="282" y="80" text-anchor="middle" ${MONO} font-size="12" font-weight="700" fill="#223">${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}</text>
      <text x="282" y="100" text-anchor="middle" ${MONO} font-size="8" fill="#888">GATE</text><text x="282" y="116" text-anchor="middle" ${MONO} font-size="12" font-weight="700" fill="#3d5f9a">${WD_EN[dt.getDay()]}</text>
      ${barcode(258, 128, 12, 22)}`);
  }
  if (design === 'report') {
    const ratio = d.goal ? (d.self || 0) / d.goal : 0;
    const grade = ratio >= 1 ? 'A+' : ratio >= 0.8 ? 'A' : ratio >= 0.6 ? 'B' : ratio >= 0.3 ? 'C' : 'D';
    const h = 150 + rows.length * 22;
    return K(`0 0 240 ${h}`, `${shadow('rps')}<rect x="6" y="6" width="228" height="${h - 12}" fill="#fffef6" filter="url(#rps)"/><rect x="14" y="14" width="212" height="${h - 28}" fill="none" stroke="#7a8a5a" stroke-width="1"/>
      <text x="120" y="40" text-anchor="middle" font-family="'Song Myung', 'Noto Serif KR', serif" font-size="18" fill="#3a4a2a" letter-spacing="3">오늘의 성적표</text>
      <text x="120" y="56" text-anchor="middle" ${SANS} font-size="9" fill="#7a8a5a">${esc(d.date || '')}</text>
      ${rows.map((r, i) => `<path d="M22 ${70 + i * 22} H218" stroke="#d9dcc8"/><text x="28" y="${85 + i * 22}" ${SANS} font-size="11" fill="#3a4a2a">${esc(r[0])}</text><text x="208" y="${85 + i * 22}" text-anchor="end" ${SANS} font-size="11.5" font-weight="700" fill="#222">${esc(r[1])}</text>`).join('')}
      ${d.note ? `<text x="28" y="${h - 40}" ${HAND} font-size="15" fill="#555">${esc(d.note)}</text>` : ''}
      <text x="28" y="${h - 22}" ${SANS} font-size="8.5" fill="#7a8a5a">순공 목표 대비 평가</text>
      <g transform="translate(184 ${h - 46}) rotate(-14)"><circle r="26" fill="none" stroke="#d6453f" stroke-width="2.5"/><text y="9" text-anchor="middle" font-family="'Abril Fatface', serif" font-size="26" fill="#d6453f">${grade}</text></g>`);
  }
  if (design === 'player') {
    const title = d.song || '오늘의 기록';
    const ratio = Math.max(0.03, Math.min(1, d.goal ? (d.self || 0) / d.goal : 0.5));
    const list = rows.slice(0, 4);
    const fmt = (sec) => `${Math.floor(sec / 3600)}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`;
    return K('0 0 220 290', `${shadow('pls')}<rect x="6" y="6" width="208" height="278" rx="14" fill="#f3f0ea" filter="url(#pls)"/>
      <rect x="22" y="22" width="176" height="130" rx="6" fill="#d9e6df"/><text x="110" y="78" text-anchor="middle" font-family="'Abril Fatface', serif" font-size="40" fill="#5e8a78">${dt.getDate()}</text><text x="110" y="104" text-anchor="middle" ${MONO} font-size="10" fill="#5e8a78">${MON_EN[dt.getMonth()]} · ${WD_EN[dt.getDay()]}</text>
      <text x="22" y="174" ${SANS} font-size="13" font-weight="700" fill="#222">${esc(title.slice(0, 18))}</text><text x="22" y="190" ${SANS} font-size="9.5" fill="#888">${esc(d.note || d.date || '')}</text>
      <path d="M22 206 H198" stroke="#ccc" stroke-width="3" stroke-linecap="round"/><path d="M22 206 H${22 + 176 * ratio}" stroke="#333" stroke-width="3" stroke-linecap="round"/><circle cx="${22 + 176 * ratio}" cy="206" r="5" fill="#333"/>
      <text x="22" y="220" ${MONO} font-size="8" fill="#888">${fmt(d.self || 0)}</text><text x="198" y="220" text-anchor="end" ${MONO} font-size="8" fill="#888">${fmt(d.goal || 0)}</text>
      <g transform="translate(110 244)" fill="#333"><path d="M-30 -7 v14 M-28 0 l10 -7 v14z" stroke="#333" stroke-width="2"/><circle r="14" fill="#333"/><path d="M-4 -6 v12 M4 -6 v12" stroke="#f3f0ea" stroke-width="3"/><path d="M18 -7 l10 7 -10 7z M30 -7 v14" stroke="#333" stroke-width="2"/></g>
      <text x="110" y="276" text-anchor="middle" ${MONO} font-size="8" fill="#888">${esc(list.map((r) => `${r[0]} ${r[1]}`).join(' · ').slice(0, 44))}</text>`);
  }
  if (design === 'daily') {
    const h = 210 + Math.min(rows.length, 5) * 16;
    return K(`0 0 200 ${h}`, `${shadow('dls')}<rect x="6" y="14" width="188" height="${h - 20}" fill="#fffefb" filter="url(#dls)"/><rect x="6" y="14" width="188" height="34" fill="#d6453f"/>
      ${[40, 80, 120, 160].map((x) => `<circle cx="${x}" cy="14" r="5" fill="#f3f0ea" stroke="#999"/>`).join('')}
      <text x="100" y="38" text-anchor="middle" font-family="'Bebas Neue', 'Do Hyeon', sans-serif" font-size="20" fill="#fff" letter-spacing="3">${dt.getFullYear()} · ${MON_EN[dt.getMonth()]}</text>
      <text x="100" y="128" text-anchor="middle" font-family="'Abril Fatface', 'Song Myung', serif" font-size="84" fill="${dt.getDay() === 0 ? '#d6453f' : dt.getDay() === 6 ? '#3d5f9a' : '#222'}">${dt.getDate()}</text>
      <text x="100" y="152" text-anchor="middle" ${SANS} font-size="12" fill="#555">${'일월화수목금토'[dt.getDay()]}요일</text>
      ${d.note ? `<text x="100" y="176" text-anchor="middle" ${HAND} font-size="16" fill="#333">${esc(d.note)}</text>` : ''}
      ${rows.slice(0, 5).map((r, i) => `<text x="22" y="${200 + i * 16}" ${SANS} font-size="9.5" fill="#777">${esc(r[0])}</text><text x="178" y="${200 + i * 16}" text-anchor="end" ${SANS} font-size="9.5" font-weight="700" fill="#333">${esc(r[1])}</text>`).join('')}`);
  }
  // 기본: 영수증
  const h = 118 + rows.length * 22 + (d.note ? 26 : 0);
  let zig = `M0 0 H200 V${h - 8}`;
  for (let x = 190, k = 1; x >= 0; x -= 10, k++) zig += ` L${x} ${h - 8 + (k % 2) * 8}`;
  zig += 'Z';
  return K(`0 0 200 ${h}`, `${shadow('rsh')}<path d="${zig}" fill="#fffefb" filter="url(#rsh)"/>
    <text x="100" y="26" text-anchor="middle" font-size="15" font-weight="700" ${MONO} fill="#222" letter-spacing="2">TODAY RECORD</text>
    <text x="100" y="44" text-anchor="middle" font-size="9" ${MONO} fill="#666">${esc(d.date || '')}</text>
    <path d="M12 54 H188" stroke="#222" stroke-dasharray="3 3"/>
    ${rows.map((r, i) => `<text x="14" y="${74 + i * 22}" font-size="10.5" ${SANS} fill="#333">${esc(r[0])}</text><text x="186" y="${74 + i * 22}" text-anchor="end" font-size="10.5" font-weight="700" ${MONO} fill="#111">${esc(r[1])}</text>`).join('')}
    <path d="M12 ${68 + rows.length * 22} H188" stroke="#222" stroke-dasharray="3 3"/>
    ${d.note ? `<text x="100" y="${88 + rows.length * 22}" text-anchor="middle" font-size="10.5" ${SANS} fill="#333">"${esc(d.note)}"</text>` : ''}
    ${barcode(40, h - 40)}<text x="100" y="${h - 14}" text-anchor="middle" font-size="7" ${MONO} fill="#888">THANK YOU · ARCHIVE</text>`);
}

/** 타임테이블: 그날 공부 기록을 10분 칸에 색칠 (새벽 5시 ~ 다음날 새벽 4시) */
export function timetableSvg(ymd) {
  const sessions = state.sessions.filter((s) => s.date === ymd);
  const cell = {};
  for (const s of sessions) {
    const st = new Date(s.start);
    let m = (st.getHours() - 5 + 24) % 24 * 60 + st.getMinutes();
    const end = m + Math.round(s.sec / 60);
    for (; m < end && m < 24 * 60; m += 10) cell[Math.floor(m / 10)] = { c: subjectColor(s.subject), self: (s.mode || 'self') === 'self' };
  }
  const total = sessions.reduce((a, b) => a + b.sec, 0);
  const cw = 24, ch = 13, x0 = 30, y0 = 46;
  let g = '';
  for (let r = 0; r < 24; r++) {
    g += `<text x="${x0 - 6}" y="${y0 + r * ch + 10}" text-anchor="end" font-size="8.5" font-family="'Courier Prime', monospace" fill="#888">${(r + 5) % 24}</text>`;
    for (let c = 0; c < 6; c++) {
      const v = cell[r * 6 + c];
      g += `<rect x="${x0 + c * cw}" y="${y0 + r * ch}" width="${cw}" height="${ch}" fill="${v ? v.c : '#fff'}" ${v && !v.self ? 'fill-opacity=".45"' : ''} stroke="#e3e0d8" stroke-width=".8"/>`;
    }
  }
  const head = [10, 20, 30, 40, 50, 60].map((n, i) => `<text x="${x0 + i * cw + cw / 2}" y="${y0 - 5}" text-anchor="middle" font-size="7.5" font-family="'Courier Prime', monospace" fill="#999">${n}</text>`).join('');
  const subj = [...new Set(sessions.map((s) => s.subject))].slice(0, 4);
  const w = x0 + 6 * cw + 12, h = y0 + 24 * ch + 30;
  const dt = parse(ymd);
  return K(`0 0 ${w} ${h}`, `${shadow('tts')}<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="8" fill="#fbfaf6" filter="url(#tts)"/>
    <text x="14" y="24" font-family="'Archivo Black', 'Black Han Sans', sans-serif" font-size="12" fill="#333" letter-spacing="1">TIME TABLE</text>
    <text x="${w - 14}" y="24" text-anchor="end" font-family="'Courier Prime', monospace" font-size="9" fill="#666">${dt.getMonth() + 1}/${dt.getDate()} · ${Math.floor(total / 3600)}h ${Math.floor((total % 3600) / 60)}m</text>
    ${head}${g}
    ${subj.map((n, i) => `<rect x="${14 + i * 44}" y="${h - 20}" width="8" height="8" fill="${subjectColor(n)}"/><text x="${25 + i * 44}" y="${h - 13}" font-size="8" ${SANS} fill="#555">${esc(n.slice(0, 4))}</text>`).join('')}`);
}

/** 할 일 카드: 완료 V, 미완료 △ */
export function todoCardSvg(ymd) {
  const todos = state.todos.filter((t) => t.date === ymd).slice(0, 8);
  const h = 70 + Math.max(3, todos.length) * 30;
  const vmark = (x, y) => `<path d="M${x} ${y - 8} L${x + 5} ${y + 2} L${x + 14} ${y - 14}" stroke="#d6453f" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const tri = (x, y) => `<path d="M${x + 6} ${y - 13} L${x + 13} ${y} H${x - 1}Z" stroke="#d6453f" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
  return K(`0 0 260 ${h}`, `${shadow('tdc')}<rect x="6" y="6" width="248" height="${h - 12}" rx="6" fill="#fffefa" filter="url(#tdc)"/>
    <text x="22" y="36" font-family="'Archivo Black', 'Black Han Sans', sans-serif" font-size="14" fill="#333" letter-spacing="2">TO DO</text><text x="238" y="36" text-anchor="end" ${HAND} font-size="15" fill="#888">No. ${ymd.slice(5).replace('-', '.')}</text>
    ${Array.from({ length: Math.max(3, todos.length) }, (_, i) => `<path d="M18 ${76 + i * 30} H242" stroke="#e3dfd6"/>`).join('')}
    ${todos.map((t, i) => `${t.done ? vmark(22, 68 + i * 30) : tri(22, 68 + i * 30)}<text x="46" y="${68 + i * 30}" ${HAND} font-size="19" fill="#2b2522">${esc(t.text.slice(0, 22))}</text>`).join('')}
    ${todos.length ? '' : `<text x="130" y="100" text-anchor="middle" ${HAND} font-size="17" fill="#aaa">할 일이 없어요</text>`}`);
}

/** 큰 날짜 스티커 (손글씨 / 세리프 / 콜라주 / 도장) */
export const DATE_TEXT_STYLES = [['hand', '손글씨'], ['serif', '세리프'], ['collage', '콜라주'], ['stamp', '도장'], ['brush', '붓글씨']];
export function dateTextSvg(style, ymd) {
  const dt = parse(ymd);
  const s = `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
  if (style === 'collage') return collageSvg(s.slice(2), dt.getDate());
  if (style === 'stamp') return K('0 0 160 160', `<g transform="rotate(-10 80 80)" fill="none" stroke="#c8453f"><circle cx="80" cy="80" r="70" stroke-width="4"/><circle cx="80" cy="80" r="60" stroke-width="1.5"/></g>
    <text x="80" y="62" text-anchor="middle" font-family="'Courier Prime', monospace" font-size="13" font-weight="700" fill="#c8453f" transform="rotate(-10 80 80)">${dt.getFullYear()}</text>
    <text x="80" y="98" text-anchor="middle" font-family="'Abril Fatface', serif" font-size="34" fill="#c8453f" transform="rotate(-10 80 80)">${MON_EN[dt.getMonth()]} ${dt.getDate()}</text>
    <text x="80" y="118" text-anchor="middle" font-family="'Courier Prime', monospace" font-size="11" fill="#c8453f" transform="rotate(-10 80 80)">${WD_FULL[dt.getDay()]}</text>`);
  if (style === 'serif') return K('0 0 330 90', `<text x="165" y="58" text-anchor="middle" font-family="'Playfair Display', 'Noto Serif KR', serif" font-weight="900" font-size="52" fill="#222">${s}</text><text x="165" y="82" text-anchor="middle" font-family="'Courier Prime', monospace" font-size="12" fill="#666" letter-spacing="6">${WD_EN[dt.getDay()]}</text>`);
  if (style === 'brush') return K('0 0 330 90', `<text x="165" y="64" text-anchor="middle" font-family="'Rock Salt', 'Nanum Brush Script', cursive" font-size="40" fill="#222">${s}</text>`);
  return K('0 0 330 100', `<text x="10" y="62" font-family="'Nothing You Could Do', Caveat, 'Nanum Pen Script', cursive" font-size="56" fill="#1f1f22">${s}</text><text x="30" y="92" font-family="Caveat, 'Nanum Pen Script', cursive" font-size="22" fill="#555">There's no later, only now.</text>`);
}
