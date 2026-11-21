// 하루 한 줄 — 속담과 짧은 다짐 문장 (출처를 확인할 수 없는 '명언 인용'은 넣지 않았어요)
// 설정에서 내가 좋아하는 문장(출처 포함)을 직접 추가할 수 있어요.
import { state } from './store.js';
import { today, daysBetween } from './util.js';

export const BUILTIN = [
  { text: '천 리 길도 한 걸음부터', by: '속담' },
  { text: '시작이 반이다', by: '속담' },
  { text: '티끌 모아 태산', by: '속담' },
  { text: '낙숫물이 댓돌을 뚫는다', by: '속담' },
  { text: '고생 끝에 낙이 온다', by: '속담' },
  { text: '공든 탑이 무너지랴', by: '속담' },
  { text: '구슬이 서 말이라도 꿰어야 보배', by: '속담' },
  { text: '급할수록 돌아가라', by: '속담' },
  { text: '하늘은 스스로 돕는 자를 돕는다', by: '서양 속담' },
  { text: '열 번 찍어 안 넘어가는 나무 없다', by: '속담' },
  { text: '배움에는 왕도가 없다', by: '격언' },
  { text: '오늘 할 일을 내일로 미루지 말라', by: '격언' },
  { text: '완벽보다 완료.', by: '' },
  { text: '느려도 멈추지만 않으면 된다.', by: '' },
  { text: '어제의 나보다 한 페이지만 더.', by: '' },
  { text: '하기 싫은 날에도 10분만.', by: '' },
  { text: '오늘의 작은 습관이 내일의 나를 만든다.', by: '' },
  { text: '비교는 어제의 나와만.', by: '' },
  { text: '쉬는 것도 계획의 일부.', by: '' },
  { text: '기록하는 사람은 흔들려도 길을 잃지 않는다.', by: '' },
  { text: '지금 이 한 문제가 합격선을 만든다.', by: '' },
  { text: '잘하고 있어. 생각보다 훨씬.', by: '' },
  { text: '오늘은 오늘의 몫만큼만.', by: '' },
  { text: '조급해하지 말고, 꾸준하게.', by: '' },
  { text: '마음이 흐린 날엔 할 일 하나만 끝내기.', by: '' },
  { text: '내가 쌓은 시간은 사라지지 않는다.', by: '' },
  { text: '좋아하는 것을 오래 하는 사람이 결국 이긴다.', by: '' },
  { text: '실수는 기록하고, 자책은 지우기.', by: '' },
  { text: '오늘의 한 줄이 모여 한 권이 된다.', by: '' },
  { text: '피곤하면 쉬고, 쉬었으면 다시.', by: '' },
  { text: '작게 시작해서 끝까지.', by: '' },
  { text: '할 수 있는 만큼이 아니라, 할 수 있을 때까지.', by: '' },
  { text: '지금 버틴 시간이 나중의 여유가 된다.', by: '' },
  { text: '행복은 크기보다 빈도.', by: '' },
  { text: '내일의 나에게 고마운 오늘을.', by: '' },
];

export function allQuotes() { return [...(state.quotes || []), ...BUILTIN]; }

/** 날짜마다 바뀌는 오늘의 문장 (offset으로 다음 문장 넘기기) */
export function quoteOfDay(offset = 0) {
  const list = allQuotes();
  const n = daysBetween('2024-01-01', today()) + offset;
  return list[((n % list.length) + list.length) % list.length];
}
