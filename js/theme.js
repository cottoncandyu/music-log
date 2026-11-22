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
  { id: 'cinema', name: '시네마 나이트', desc: '영화관처럼 까만 화면과 레드 포인트', sw: ['#111111', '#1e1e1e', '#e1251b'] },
  { id: 'castle', name: '매직 캐슬', desc: '동화 속 성처럼 로열 블루와 금빛 별', sw: ['#1d2150', '#f7f4ea', '#d9b45a'] },
  { id: 'rose', name: '프린세스 로즈', desc: '장밋빛 핑크와 금색 장식', sw: ['#fbeff2', '#fffafb', '#cf7b95'] },
];

// 글꼴 출처
// - Google Fonts (index.html): 한글은 필요한 글자만 내려받음
// - npm 패키지(@kfonts/*, galmuri, pretendard) → jsDelivr CDN (css/kfonts.css): 모두 SIL OFL 1.1 표기, 처음 쓸 때만 내려받음
// group: 손글씨 / 귀여운 / 디자인 / 고딕 / 명조 / 영문(한글은 옆에 적힌 한글 글꼴로 표시)
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
  { id: 'nh-sonpyeonjiche', name: '손편지체', css: "'나눔손글씨 손편지체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-ttobagttobag', name: '또박또박', css: "'나눔손글씨 또박또박', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-jalhago-iss-eo', name: '잘하고 있어', css: "'나눔손글씨 잘하고 있어', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-dasi-sijaghae', name: '다시 시작해', css: "'나눔손글씨 다시 시작해', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-kkochnae-eum', name: '꽃내음', css: "'나눔손글씨 꽃내음', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-jangmiche', name: '장미체', css: "'나눔손글씨 장미체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-gomsinche', name: '곰신체', css: "'나눔손글씨 곰신체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-kokoche', name: '코코체', css: "'나눔손글씨 코코체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-hyejunche', name: '혜준체', css: "'나눔손글씨 혜준체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-junghagsaeng', name: '중학생', css: "'나눔손글씨 중학생', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-chodinghuimang', name: '초딩희망', css: "'나눔손글씨 초딩희망', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-eommasalang', name: '엄마사랑', css: "'나눔손글씨 엄마사랑', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-agisalangche', name: '아기사랑체', css: "'나눔손글씨 아기사랑체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-baleunhipi', name: '바른히피', css: "'나눔손글씨 바른히피', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-seongsilche', name: '성실체', css: "'나눔손글씨 성실체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-somiche', name: '소미체', css: "'나눔손글씨 소미체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-yeonjiche', name: '연지체', css: "'나눔손글씨 연지체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-dahaengche', name: '다행체', css: "'나눔손글씨 다행체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-huimangnuli', name: '희망누리', css: "'나눔손글씨 희망누리', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-gangbujangnimche', name: '강부장님체', css: "'나눔손글씨 강부장님체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-ogbiche', name: '옥비체', css: "'나눔손글씨 옥비체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nh-magoche', name: '마고체', css: "'나눔손글씨 마고체', 'Gowun Dodum', sans-serif", scale: 1.3, group: '나눔손글씨' },
  { id: 'nanum-barun-pen', name: '나눔바른펜', css: "'나눔바른펜', 'Gowun Dodum', sans-serif", scale: 1.0, group: '나눔손글씨' },
  { id: 'bm-hanna-pro', name: '배민 한나 Pro', css: "'배달의민족 한나체 Pro', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'bm-hanna-air', name: '배민 한나 Air', css: "'배달의민족 한나체 Air', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'bm-hanna-11yrs', name: '배민 한나는 열한살', css: "'배달의민족 한나는 열한살', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'bm-euljiro', name: '배민 을지로체', css: "'배달의민족 을지로체 TTF', 'Gowun Dodum', sans-serif", scale: 0.95, group: '귀여운' },
  { id: 'bm-euljiro-10years-later', name: '배민 을지로 10년후', css: "'배민 을지로10년후체', 'Gowun Dodum', sans-serif", scale: 0.95, group: '귀여운' },
  { id: 'hakgyoansim-monggeulmonggeul', name: '학교안심 몽글몽글', css: "'학교안심 몽글몽글', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'hakgyoansim-bunpil', name: '학교안심 분필', css: "'학교안심 분필', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'hakgyoansim-ggooreogi', name: '학교안심 꾸러기', css: "'학교안심 꾸러기', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'hakgyoansim-gaeulsopung', name: '학교안심 가을소풍', css: "'학교안심 가을소풍', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'hakgyoansim-malgeunnal', name: '학교안심 맑은날', css: "'학교안심 맑은날', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'hakgyoansim-wooju', name: '학교안심 우주', css: "'학교안심 우주', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'hakgyoansim-dotbogi', name: '학교안심 돋보기', css: "'학교안심 돋보기', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'kcc-hanbit', name: 'KCC 한빛', css: "'KCC-한빛', 'Gowun Dodum', sans-serif", scale: 1.0, group: '귀여운' },
  { id: 'neodgm', name: 'Neo둥근모', css: "'Neo둥근모', 'Gowun Dodum', sans-serif", scale: 1.0, group: '픽셀' },
  { id: 'galmuri11', name: '갈무리11', css: "'Galmuri11', 'Gowun Dodum', sans-serif", scale: 1.0, group: '픽셀' },
  { id: 'galmuri9', name: '갈무리9', css: "'Galmuri9', 'Gowun Dodum', sans-serif", scale: 1.0, group: '픽셀' },
  { id: 'pretendard', name: '프리텐다드', css: "'Pretendard Variable', 'Gowun Dodum', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'nanum-square', name: '나눔스퀘어', css: "'나눔스퀘어', 'Gowun Dodum', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'nanum-square-round', name: '나눔스퀘어라운드', css: "'나눔스퀘어라운드', 'Gowun Dodum', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'nanum-barun-gothic', name: '나눔바른고딕', css: "'나눔바른고딕', 'Gowun Dodum', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'line-seed', name: 'LINE Seed', css: "'LINE Seed Sans KR', 'Gowun Dodum', sans-serif", scale: 0.92, group: '고딕' },
  { id: 'maruburi', name: '마루부리', css: "'마루 부리', 'Gowun Dodum', sans-serif", scale: 0.92, group: '명조' },
  { id: 'ridi-batang', name: '리디바탕', css: "'리디바탕', 'Gowun Dodum', sans-serif", scale: 0.92, group: '명조' },
  { id: 'hakgyoansim-bareonbatang', name: '학교안심 바른바탕', css: "'학교안심 바른바탕', 'Gowun Dodum', sans-serif", scale: 0.92, group: '명조' },
  { id: 'caveat', name: 'Caveat', css: "'Caveat', 'Gaegu', sans-serif", scale: 1.2, group: '영문' },
  { id: 'pacifico', name: 'Pacifico', css: "'Pacifico', 'Gaegu', sans-serif", scale: 0.95, group: '영문' },
  { id: 'dancing', name: 'Dancing Script', css: "'Dancing Script', 'Gaegu', sans-serif", scale: 1.15, group: '영문' },
  { id: 'marker', name: 'Permanent Marker', css: "'Permanent Marker', 'Jua', sans-serif", scale: 0.95, group: '영문' },
  { id: 'shadows', name: 'Shadows Into Light', css: "'Shadows Into Light', 'Gaegu', sans-serif", scale: 1.15, group: '영문' },
  { id: 'amatic', name: 'Amatic SC', css: "'Amatic SC', 'Gaegu', sans-serif", scale: 1.35, group: '영문' },
  { id: 'elite', name: 'Special Elite', css: "'Special Elite', 'Nanum Gothic Coding', sans-serif", scale: 0.95, group: '영문' },
  { id: 'courier', name: 'Courier Prime', css: "'Courier Prime', 'Nanum Gothic Coding', sans-serif", scale: 0.95, group: '영문' },
  { id: 'lobster', name: 'Lobster', css: "'Lobster', 'Jua', sans-serif", scale: 1.0, group: '영문' },
  { id: 'fredoka', name: 'Fredoka', css: "'Fredoka', 'Jua', sans-serif", scale: 1.0, group: '영문' },
  { id: 'righteous', name: 'Righteous', css: "'Righteous', 'Do Hyeon', sans-serif", scale: 0.95, group: '영문' },
  { id: 'pixel', name: 'Press Start 2P', css: "'Press Start 2P', 'Dongle', sans-serif", scale: 0.65, group: '영문' },
  { id: 'sacramento', name: 'Sacramento', css: "'Sacramento', 'Gaegu', sans-serif", scale: 1.5, group: '영문' },
  { id: 'homemade', name: 'Homemade Apple', css: "'Homemade Apple', 'Nanum Pen Script', sans-serif", scale: 0.85, group: '영문' },
  { id: 'rubik-mono', name: 'Rubik Mono One', css: "'Rubik Mono One', 'Black Han Sans', sans-serif", scale: 0.8, group: '영문' },
  { id: 'dm-serif', name: 'DM Serif Display', css: "'DM Serif Display', 'Song Myung', sans-serif", scale: 1.0, group: '영문' },
  { id: 'gloria', name: 'Gloria Hallelujah', css: "'Gloria Hallelujah', 'Gaegu', sans-serif", scale: 0.95, group: '영문' },
  { id: 'patrick', name: 'Patrick Hand', css: "'Patrick Hand', 'Gaegu', sans-serif", scale: 1.1, group: '영문' },
  { id: 'kalam', name: 'Kalam', css: "'Kalam', 'Gaegu', sans-serif", scale: 1.05, group: '영문' },
  { id: 'monoton', name: 'Monoton', css: "'Monoton', 'Black Han Sans', sans-serif", scale: 0.9, group: '영문' },
  { id: 'bungee', name: 'Bungee', css: "'Bungee', 'Black Han Sans', sans-serif", scale: 0.85, group: '영문' },
  { id: 'cherry-bomb', name: 'Cherry Bomb One', css: "'Cherry Bomb One', 'Jua', sans-serif", scale: 1.0, group: '영문' },
  { id: 'rock-salt', name: 'Rock Salt', css: "'Rock Salt', 'Nanum Brush Script', sans-serif", scale: 0.8, group: '영문' },
  { id: 'great-vibes', name: 'Great Vibes', css: "'Great Vibes', 'Nanum Pen Script', sans-serif", scale: 1.4, group: '영문' },
  { id: 'indie', name: 'Indie Flower', css: "'Indie Flower', 'Gaegu', sans-serif", scale: 1.1, group: '영문' },
  { id: 'satisfy', name: 'Satisfy', css: "'Satisfy', 'Gaegu', sans-serif", scale: 1.15, group: '영문' },
  { id: 'alfa-slab', name: 'Alfa Slab One', css: "'Alfa Slab One', 'Black Han Sans', sans-serif", scale: 0.9, group: '영문' },
  { id: 'anton', name: 'Anton', css: "'Anton', 'Do Hyeon', sans-serif", scale: 1.0, group: '영문' },
  { id: 'comfortaa', name: 'Comfortaa', css: "'Comfortaa', 'Gowun Dodum', sans-serif", scale: 0.95, group: '영문' },
  { id: 'reenie', name: 'Reenie Beanie', css: "'Reenie Beanie', 'Nanum Pen Script', sans-serif", scale: 1.5, group: '영문' },
  { id: 'nothing-you', name: 'Nothing You Could Do', css: "'Nothing You Could Do', 'Nanum Pen Script', sans-serif", scale: 0.9, group: '영문' },
  { id: 'abril', name: 'Abril Fatface', css: "'Abril Fatface', 'Song Myung', sans-serif", scale: 1.0, group: '영문' },
  { id: 'playfair', name: 'Playfair Display', css: "'Playfair Display', 'Noto Serif KR', sans-serif", scale: 1.0, group: '영문' },
  { id: 'bebas', name: 'Bebas Neue', css: "'Bebas Neue', 'Do Hyeon', sans-serif", scale: 1.2, group: '영문' },
  { id: 'archivo-black', name: 'Archivo Black', css: "'Archivo Black', 'Black Han Sans', sans-serif", scale: 0.9, group: '영문' },
];
export const FONT_GROUPS = ['손글씨', '나눔손글씨', '귀여운', '픽셀', '디자인', '고딕', '명조', '영문'];
// 앱 전체 글꼴로 쓰기 좋은(읽기 편한) 글꼴만
const UI_IDS = ['pretendard', 'nanum-square-round', 'nanum-square', 'nanum-barun-gothic', 'line-seed', 'maruburi', 'ridi-batang', 'system', 'noto-sans', 'gothic-a1', 'nanum-gothic', 'gowun-dodum', 'ibm-plex', 'sunflower', 'nanum-myeongjo', 'gowun-batang', 'noto-serif', 'hahmlet', 'jua', 'stylish', 'do-hyeon', 'orbit'];
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
