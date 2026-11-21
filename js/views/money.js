// 가계부 — 수입/지출, 카테고리, 월 예산, 월별 요약
import { state, save } from '../store.js';
import { esc, today, uid, fmtDate, ymd } from '../util.js';
import { modal, confirmBox, toast } from '../ui.js';
import { icon } from '../icons.js';
import { barChart } from '../charts.js';

const OUT = ['식비', '카페·간식', '교통', '생활', '쇼핑', '문화·여가', '공부·책', '건강', '경조사', '주거·통신', '기타'];
const IN = ['월급', '용돈', '부수입', '환급', '기타'];
const COLORS = ['#c98f7d', '#d9b26a', '#8fb0a0', '#9aa7c9', '#c79bb8', '#b7a58d', '#7f9e86', '#d18e8e', '#a69ad0', '#8aa6b8', '#a3a3a3'];
let month = today().slice(0, 7);

const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
const shortWon = (n) => (n >= 10000 ? `${Math.round(n / 1000) / 10}만` : `${Math.round(n / 1000)}천`);

function form(x, after, type = 'out') {
  const isNew = !x;
  x = x || { id: uid(), date: month === today().slice(0, 7) ? today() : month + '-01', type, amount: '', category: type === 'out' ? OUT[0] : IN[0], memo: '' };
  const cats = (t) => (t === 'out' ? OUT : IN).map((c) => `<option ${c === x.category ? 'selected' : ''}>${c}</option>`).join('');
  modal(`<h2>${isNew ? '내역 추가' : '내역 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <div class="seg" style="margin:0"><button type="button" data-type="out" class="${x.type === 'out' ? 'on' : ''}">지출</button><button type="button" data-type="in" class="${x.type === 'in' ? 'on' : ''}">수입</button></div>
      <label class="field"><span>금액 (원)</span><input type="number" name="amount" inputmode="numeric" min="0" step="1" value="${x.amount}" required placeholder="0"></label>
      <div class="row"><label class="field"><span>날짜</span><input type="date" name="date" value="${x.date}"></label>
        <label class="field"><span>분류</span><select name="category">${cats(x.type)}</select></label></div>
      <label class="field"><span>내용</span><input type="text" name="memo" value="${esc(x.memo)}" placeholder="예: 점심, 교재 구입"></label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      let t = x.type;
      box.querySelector('.seg').onclick = (e) => {
        const b = e.target.closest('[data-type]'); if (!b) return;
        t = b.dataset.type; box.querySelectorAll('[data-type]').forEach((y) => y.classList.toggle('on', y === b));
        x.category = t === 'out' ? OUT[0] : IN[0]; f.category.innerHTML = cats(t);
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const amount = Math.round(Number(f.amount.value));
        if (!(amount > 0)) return toast('금액을 입력해주세요');
        Object.assign(x, { type: t, amount, date: f.date.value || today(), category: f.category.value, memo: f.memo.value.trim() });
        if (isNew) state.money.push(x);
        save(); close(); after();
      };
      setTimeout(() => f.amount.focus(), 50);
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox('이 내역을 삭제할까요?', '삭제')) { state.money = state.money.filter((y) => y !== x); save(); after(); }
      });
    },
  });
}

export default {
  render(el) {
    const items = state.money.filter((x) => x.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date) || 0);
    const inSum = items.filter((x) => x.type === 'in').reduce((a, b) => a + b.amount, 0);
    const outSum = items.filter((x) => x.type === 'out').reduce((a, b) => a + b.amount, 0);
    const budget = Number(state.profile.budget) || 0;
    const byCat = {};
    items.filter((x) => x.type === 'out').forEach((x) => { byCat[x.category] = (byCat[x.category] || 0) + x.amount; });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    const daily = Array.from({ length: last }, (_, i) => { const d = `${month}-${String(i + 1).padStart(2, '0')}`; return { label: i % 5 === 0 || i === last - 1 ? String(i + 1) : '', value: items.filter((x) => x.type === 'out' && x.date === d).reduce((a, b) => a + b.amount, 0), hi: d === today() }; });
    const byDate = {};
    items.forEach((x) => { (byDate[x.date] = byDate[x.date] || []).push(x); });
    const isThisMonth = month === today().slice(0, 7);
    const daysLeft = isThisMonth ? last - Number(today().slice(8)) + 1 : 0;

    el.innerHTML = `
      <div class="date-nav"><button class="btn sm" data-nav="-1">${icon('left', 16)}</button><span class="label">${y}년 ${m}월</span><button class="btn sm" data-nav="1">${icon('right', 16)}</button>
        ${isThisMonth ? '' : '<button class="btn sm ghost" data-nav="0">이번 달</button>'}<span class="spacer"></span>
        <button class="btn soft" data-add="in">${icon('plus', 16)} 수입</button><button class="btn primary" data-add="out">${icon('plus', 16)} 지출</button></div>
      <div class="grid two">
        <div class="card">
          <div class="stats">
            <div class="stat"><b style="color:var(--bad)">${won(outSum)}</b><span>지출</span></div>
            <div class="stat"><b style="color:var(--good)">${won(inSum)}</b><span>수입</span></div>
            <div class="stat"><b>${won(inSum - outSum)}</b><span>합계</span></div></div>
          <hr>
          <div class="row small"><b>월 예산</b><input type="number" data-budget value="${budget || ''}" placeholder="예산 입력 (원)" style="max-width:170px" inputmode="numeric"><span class="spacer"></span>
            ${budget ? `<span class="muted">${outSum > budget ? `<b style="color:var(--bad)">${won(outSum - budget)} 초과</b>` : `남은 예산 <b>${won(budget - outSum)}</b>${daysLeft ? ` · 하루 ${won((budget - outSum) / daysLeft)}` : ''}`}</span>` : ''}</div>
          ${budget ? `<div class="progress mt ${outSum > budget ? 'over' : ''}"><i style="width:${Math.min(100, (outSum / budget) * 100)}%"></i></div>` : ''}
          <div class="mt">${barChart(daily, { fmt: (v) => (v ? shortWon(v) : ''), height: 70, slot: 14, values: false })}</div>
        </div>
        <div class="card"><h3>분류별 지출</h3>${cats.length ? `<div class="legend">${cats.map(([c, v], i) => `<div class="item"><span class="dot" style="background:${COLORS[OUT.indexOf(c) % COLORS.length] || COLORS[i % COLORS.length]}"></span><span style="min-width:74px">${esc(c)}</span>
            <div class="progress bar"><i style="width:${(v / cats[0][1]) * 100}%;background:${COLORS[OUT.indexOf(c) % COLORS.length] || COLORS[i % COLORS.length]}"></i></div><span class="num small" style="min-width:86px;text-align:right">${won(v)}</span></div>`).join('')}</div>` : '<div class="empty">지출 내역이 없어요</div>'}</div>
      </div>
      <div class="card mt"><h3>내역</h3>
        ${Object.keys(byDate).length ? Object.entries(byDate).map(([d, xs]) => `
          <div class="tiny muted mt" style="font-weight:700">${fmtDate(d)} <span style="float:right">${won(xs.filter((x) => x.type === 'out').reduce((a, b) => a + b.amount, 0))}</span></div>
          <ul class="list">${xs.map((x) => `<li data-edit="${x.id}" style="cursor:pointer"><span class="tag">${esc(x.category)}</span><span class="txt">${esc(x.memo || x.category)}</span>
            <b class="num" style="color:${x.type === 'in' ? 'var(--good)' : 'var(--text)'}">${x.type === 'in' ? '+' : '-'}${won(x.amount)}</b></li>`).join('')}</ul>`).join('')
        : '<div class="empty">이번 달 내역을 추가해보세요</div>'}
      </div>`;

    const re = () => this.render(el);
    el.onclick = (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav) { const n = Number(nav.dataset.nav); month = n === 0 ? today().slice(0, 7) : ymd(new Date(y, m - 1 + n, 1)).slice(0, 7); return re(); }
      const add = e.target.closest('[data-add]'); if (add) return form(null, re, add.dataset.add);
      const ed = e.target.closest('[data-edit]'); if (ed) return form(state.money.find((x) => x.id === ed.dataset.edit), re);
    };
    el.onchange = (e) => {
      if (e.target.matches('[data-budget]')) { state.profile.budget = Math.max(0, Math.round(Number(e.target.value) || 0)); save(); re(); }
    };
  },
};
