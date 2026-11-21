// 테마 · 다크모드 · 글꼴 · 사용자 꾸미기 설정 적용
import { state } from './store.js';

export const THEMES = [
  { id: 'vintage', name: '빈티지 그레이', desc: '회색·아이보리, 차분한 종이 질감', sw: ['#e9e5dc', '#f6f3ec', '#6e695f'] },
  { id: 'mono', name: '모던 모노톤', desc: '흑백 대비, 군더더기 없이', sw: ['#f1f1ef', '#ffffff', '#111111'] },
  { id: 'pastel', name: '파스텔', desc: '다꾸 감성, 정신없지 않게', sw: ['#fcf5ef', '#fde5eb', '#ec9cb1'] },
  { id: 'clean', name: '클린 화이트', desc: '밝고 깔끔한 화이트', sw: ['#ffffff', '#f4f5f7', '#3a6df0'] },
  { id: 'sky', name: '스카이 페이퍼', desc: '하늘색·회색 메모지 톤', sw: ['#eef1f5', '#fbfcfd', '#7d9cc4'] },
  { id: 'lavender', name: '라벤더 미스트', desc: '연보라 안개 같은 톤', sw: ['#f2f0f7', '#fcfbfe', '#9a8bc4'] },
  { id: 'sage', name: '세이지 그린', desc: '차분한 초록과 크림', sw: ['#eef0e8', '#fbfbf6', '#7f9a7a'] },
  { id: 'butter', name: '버터 크림', desc: '따뜻한 크림·청록 포인트', sw: ['#f7f3e3', '#fffdf4', '#3f8a86'] },
  { id: 'kraft', name: '크라프트', desc: '갈색 종이·빈티지 다이어리', sw: ['#e6dccb', '#f4eee2', '#8b6a4f'] },
  { id: 'navy', name: '네이비 클래식', desc: '남색과 아이보리, 단정하게', sw: ['#eceae4', '#faf9f5', '#2f3f63'] },
];

// 모두 Google Fonts 제공 글꼴 (index.html에서 불러옴). 한글은 필요한 글자만 내려받아요.
// group: 손글씨 / 귀여운 / 디자인 / 고딕 / 명조
export const HAND_FONTS = [
  { id: 'gaegu', name: '개구', css: 'Gaegu, cursive', scale: 1.1, group: '손글씨' },
  { id: 'nanum-pen', name: '나눔손글씨 펜', css: "'Nanum Pen Script', cursive", scale: 1.35, group: '손글씨' },
  { id: 'nanum-brush', name: '나눔손글씨 붓', css: "'Nanum Brush Script', cursive", scale: 1.35, group: '손글씨' },
  { id: 'hi-melody', name: '하이멜로디', css: "'Hi Melody', cursive", scale: 1.2, group: '손글씨' },
  { id: 'gamja', name: '감자꽃', css: "'Gamja Flower', cursive", scale: 1.05, group: '손글씨' },
  { id: 'poor-story', name: '푸어스토리', css: "'Poor Story', cursive", scale: 1.05, group: '손글씨' },
  { id: 'single-day', name: '싱글데이', css: "'Single Day', cursive", scale: 1.05, group: '손글씨' },
  { id: 'yeon-sung', name: '연성', css: "'Yeon Sung', cursive", scale: 1.05, group: '손글씨' },
  { id: 'kirang', name: '기랑해랑', css: "'Kirang Haerang', cursive", scale: 1.2, group: '손글씨' },
  { id: 'dokdo', name: '독도', css: 'Dokdo, cursive', scale: 1.25, group: '손글씨' },
  { id: 'east-sea', name: '동해독도', css: "'East Sea Dokdo', cursive", scale: 1.4, group: '손글씨' },
  { id: 'cute-font', name: '귀여운 글씨', css: "'Cute Font', cursive", scale: 1.35, group: '귀여운' },
  { id: 'dongle', name: '동글', css: 'Dongle, sans-serif', scale: 1.5, group: '귀여운' },
  { id: 'jua', name: '주아', css: 'Jua, sans-serif', scale: 1, group: '귀여운' },
  { id: 'stylish', name: '스타일리시', css: 'Stylish, sans-serif', scale: 1.05, group: '귀여운' },
  { id: 'bwp', name: '흑백사진', css: "'Black And White Picture', sans-serif", scale: 1.3, group: '귀여운' },
  { id: 'bagel', name: '베이글', css: "'Bagel Fat One', sans-serif", scale: 0.85, group: '디자인' },
  { id: 'gasoek', name: '가석', css: "'Gasoek One', sans-serif", scale: 0.85, group: '디자인' },
  { id: 'moirai', name: '모이라이', css: "'Moirai One', sans-serif", scale: 0.95, group: '디자인' },
  { id: 'grandiflora', name: '그랜디플로라', css: "'Grandiflora One', serif", scale: 0.95, group: '디자인' },
  { id: 'gugi', name: '구기', css: 'Gugi, sans-serif', scale: 0.95, group: '디자인' },
  { id: 'do-hyeon', name: '도현', css: "'Do Hyeon', sans-serif", scale: 1, group: '디자인' },
  { id: 'black-han', name: '검은고딕', css: "'Black Han Sans', sans-serif", scale: 0.95, group: '디자인' },
  { id: 'orbit', name: '오르빗', css: 'Orbit, sans-serif', scale: 0.95, group: '디자인' },
  { id: 'diphylleia', name: '디필레이아', css: 'Diphylleia, serif', scale: 0.95, group: '디자인' },
  { id: 'system', name: '애플 고딕', css: "-apple-system, 'Apple SD Gothic Neo', sans-serif", scale: 0.9, group: '고딕' },
  { id: 'noto-sans', name: '노토 산스', css: "'Noto Sans KR', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'gothic-a1', name: '고딕 A1', css: "'Gothic A1', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'nanum-gothic', name: '나눔고딕', css: "'Nanum Gothic', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'gowun-dodum', name: '고운돋움', css: "'Gowun Dodum', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'ibm-plex', name: 'IBM Plex', css: "'IBM Plex Sans KR', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'sunflower', name: '해바라기', css: 'Sunflower, sans-serif', scale: 0.95, group: '고딕' },
  { id: 'coding', name: '나눔고딕 코딩', css: "'Nanum Gothic Coding', monospace", scale: 0.92, group: '고딕' },
  { id: 'nanum-myeongjo', name: '나눔명조', css: "'Nanum Myeongjo', serif", scale: 0.92, group: '명조' },
  { id: 'gowun-batang', name: '고운바탕', css: "'Gowun Batang', serif", scale: 0.92, group: '명조' },
  { id: 'noto-serif', name: '노토 세리프', css: "'Noto Serif KR', serif", scale: 0.92, group: '명조' },
  { id: 'hahmlet', name: '함렛', css: 'Hahmlet, serif', scale: 0.92, group: '명조' },
  { id: 'song-myung', name: '송명', css: "'Song Myung', serif", scale: 0.98, group: '명조' },
];
export const FONT_GROUPS = ['손글씨', '귀여운', '디자인', '고딕', '명조'];
// 앱 전체 글꼴로 쓰기 좋은(읽기 편한) 글꼴만
const UI_IDS = ['system', 'noto-sans', 'gothic-a1', 'nanum-gothic', 'gowun-dodum', 'ibm-plex', 'sunflower', 'nanum-myeongjo', 'gowun-batang', 'noto-serif', 'hahmlet', 'jua', 'stylish', 'do-hyeon', 'orbit'];
export const FONTS = HAND_FONTS.filter((f) => UI_IDS.includes(f.id)).map((f) => ({ ...f, name: f.id === 'system' ? '기본 (애플 고딕)' : f.name }));
export const handFont = (id) => HAND_FONTS.find((f) => f.id === id) || HAND_FONTS[0];

/** 그룹별 글꼴 선택 버튼 HTML (attr: data-속성 이름) */
export function fontPicker(attr, current) {
  return `<div class="font-groups">${FONT_GROUPS.map((g) => `<div class="tiny muted">${g}</div><div class="font-pick">${HAND_FONTS.filter((f) => f.group === g)
    .map((f) => `<button type="button" data-${attr}="${f.id}" class="${f.id === current ? 'on' : ''}" style="font-family:${f.css}">${f.name}</button>`).join('')}</div>`).join('')}</div>`;
}

const mq = matchMedia('(prefers-color-scheme: dark)');
export function isDark() {
  const d = state.profile.dark;
  return d === 'dark' || (d === 'auto' && mq.matches);
}

export function applyTheme() {
  const p = state.profile;
  const root = document.documentElement;
  root.dataset.theme = THEMES.some((t) => t.id === p.theme) ? p.theme : 'vintage';
  if (isDark()) root.dataset.dark = ''; else delete root.dataset.dark;
  const set = (k, v) => (v == null || v === '' ? root.style.removeProperty(k) : root.style.setProperty(k, v));
  set('--accent', p.accent && !isDark() ? p.accent : '');
  if (p.accent && !isDark()) set('--accent-soft', `color-mix(in srgb, ${p.accent} 18%, var(--surface))`); else set('--accent-soft', '');
  set('--radius', p.radius >= 0 ? p.radius + 'px' : '');
  const f = FONTS.find((x) => x.id === p.uiFont);
  set('--font-ui', f && f.id !== 'system' ? f.css : '');
  set('--font-head', f && f.id !== 'system' ? f.css : '');
  set('--fs', p.fontScale && p.fontScale !== 100 ? String(p.fontScale / 100) : '');
  set('--font-memo', handFont(p.memoFont).css);
  if (p.bgImage) {
    set('--bg-image', `url("${p.bgImage}")`);
    set('--bg-dim', String((p.bgDim ?? 30) / 100));
    document.body.classList.add('has-bg');
  } else {
    set('--bg-image', ''); document.body.classList.remove('has-bg');
  }
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#e9e5dc';
}
mq.addEventListener?.('change', () => { if (state.profile.dark === 'auto') applyTheme(); });
