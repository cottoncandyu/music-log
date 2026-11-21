// 테마 · 다크모드 · 사용자 꾸미기 설정 적용
import { state } from './store.js';

export const THEMES = [
  { id: 'vintage', name: '빈티지 그레이', desc: '회색·아이보리, 차분한 종이 질감', sw: ['#e9e5dc', '#f6f3ec', '#6e695f'] },
  { id: 'mono', name: '모던 모노톤', desc: '흑백 대비, 군더더기 없이', sw: ['#f1f1ef', '#ffffff', '#111111'] },
  { id: 'pastel', name: '파스텔', desc: '다꾸 감성, 정신없지 않게', sw: ['#fcf5ef', '#fde5eb', '#ec9cb1'] },
  { id: 'clean', name: '클린 화이트', desc: '밝고 깔끔한 화이트', sw: ['#ffffff', '#f4f5f7', '#3a6df0'] },
];

// 모두 Google Fonts에서 제공되는 한글 글꼴 (index.html에서 불러옴)
export const FONTS = [
  { id: 'system', name: '기본 (애플 고딕)', css: '-apple-system, BlinkMacSystemFont, \'Apple SD Gothic Neo\', \'Noto Sans KR\', sans-serif' },
  { id: 'gowun-dodum', name: '고운돋움', css: '\'Gowun Dodum\', sans-serif' },
  { id: 'gowun-batang', name: '고운바탕', css: '\'Gowun Batang\', serif' },
  { id: 'nanum-myeongjo', name: '나눔명조', css: '\'Nanum Myeongjo\', serif' },
  { id: 'ibm-plex', name: 'IBM Plex Sans KR', css: '\'IBM Plex Sans KR\', sans-serif' },
  { id: 'nanum-gothic', name: '나눔고딕', css: '\'Nanum Gothic\', sans-serif' },
  { id: 'jua', name: '주아', css: 'Jua, sans-serif' },
];
export const HAND_FONTS = [
  { id: 'gaegu', name: '개구', css: 'Gaegu, cursive', scale: 1.1 },
  { id: 'nanum-pen', name: '나눔손글씨 펜', css: '\'Nanum Pen Script\', cursive', scale: 1.35 },
  { id: 'hi-melody', name: '하이멜로디', css: '\'Hi Melody\', cursive', scale: 1.2 },
  { id: 'gamja', name: '감자꽃', css: '\'Gamja Flower\', cursive', scale: 1.05 },
  { id: 'poor-story', name: '푸어스토리', css: '\'Poor Story\', cursive', scale: 1.05 },
  { id: 'single-day', name: '싱글데이', css: '\'Single Day\', cursive', scale: 1.05 },
  { id: 'yeon-sung', name: '연성', css: '\'Yeon Sung\', cursive', scale: 1.05 },
  { id: 'east-sea', name: '동해독도', css: '\'East Sea Dokdo\', cursive', scale: 1.4 },
  { id: 'dongle', name: '동글', css: 'Dongle, sans-serif', scale: 1.5 },
  { id: 'jua', name: '주아', css: 'Jua, sans-serif', scale: 1 },
  { id: 'gowun-dodum', name: '고운돋움', css: '\'Gowun Dodum\', sans-serif', scale: 0.92 },
  { id: 'nanum-myeongjo', name: '나눔명조', css: '\'Nanum Myeongjo\', serif', scale: 0.92 },
  { id: 'system', name: '기본 고딕', css: '-apple-system, \'Apple SD Gothic Neo\', sans-serif', scale: 0.9 },
];
export const handFont = (id) => HAND_FONTS.find((f) => f.id === id) || HAND_FONTS[0];

const mq = matchMedia('(prefers-color-scheme: dark)');
export function isDark() {
  const d = state.profile.dark;
  return d === 'dark' || (d === 'auto' && mq.matches);
}

export function applyTheme() {
  const p = state.profile;
  const root = document.documentElement;
  root.dataset.theme = p.theme || 'vintage';
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
