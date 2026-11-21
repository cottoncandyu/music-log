// 계산기 — 사칙연산·괄호·%, 계산 기록, 결과를 가계부로 보내기 (eval 사용 안 함)
import { icon } from '../icons.js';
import { toast } from '../ui.js';

let expr = '';
let result = '';
const history = [];

/** 직접 만든 수식 계산기: + - × ÷ ( ) % 소수점 */
export function calculate(src) {
  const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '').replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];
  function num() {
    let start = i;
    while (i < s.length && /[0-9.]/.test(s[i])) i++;
    if (start === i) throw new Error('숫자가 필요해요');
    const v = Number(s.slice(start, i));
    if (Number.isNaN(v)) throw new Error('잘못된 숫자');
    return v;
  }
  function factor() {
    let v;
    if (peek() === '-') { i++; return -factor(); }
    if (peek() === '+') { i++; return factor(); }
    if (peek() === '(') { i++; v = expr2(); if (peek() !== ')') throw new Error('괄호가 안 닫혔어요'); i++; }
    else v = num();
    while (peek() === '%') { i++; v = v / 100; }
    return v;
  }
  function term() {
    let v = factor();
    while (peek() === '*' || peek() === '/') {
      const op = s[i++]; const r = factor();
      if (op === '/' && r === 0) throw new Error('0으로 나눌 수 없어요');
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function expr2() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = term(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  if (!s) return 0;
  const v = expr2();
  if (i !== s.length) throw new Error('수식을 확인해주세요');
  // 부동소수점 오차 정리 (예: 0.1+0.2)
  return Math.round(v * 1e10) / 1e10;
}
const fmt = (n) => (Math.abs(n) >= 1e15 ? n.toExponential(6) : n.toLocaleString('ko-KR', { maximumFractionDigits: 10 }));

const KEYS = [['C', '(', ')', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '-'], ['1', '2', '3', '+'], ['%', '0', '.', '=']];

export default {
  render(el) {
    let preview = '';
    try { preview = expr && /[+\-×÷%]/.test(expr) ? fmt(calculate(expr)) : ''; } catch { preview = ''; }
    el.innerHTML = `
      <div class="calc-layout">
        <div class="card calc">
          <div class="calc-screen"><div class="expr num" data-expr>${expr || '0'}</div><div class="res num">${result ? '= ' + result : preview ? '= ' + preview : ''}</div></div>
          <div class="calc-keys">${KEYS.flat().map((k) => `<button class="ck ${/[÷×+\-=]/.test(k) ? 'op' : ''} ${k === '=' ? 'eq' : ''} ${k === 'C' ? 'clr' : ''}" data-k="${k}">${k}</button>`).join('')}</div>
          <div class="row mt"><button class="btn sm" data-k="⌫">${icon('left', 14)} 지우기</button><span class="spacer"></span>
            <button class="btn sm" data-act="copy">복사</button><button class="btn sm soft" data-act="money">${icon('wallet', 14)} 가계부에 기록</button></div>
        </div>
        <div class="card"><h3>${icon('list', 16)} 계산 기록</h3>
          ${history.length ? `<ul class="list">${history.map((h, i) => `<li data-h="${i}" style="cursor:pointer"><span class="txt small muted">${h.e}</span><b class="num">${h.r}</b></li>`).join('')}</ul>` : '<div class="small muted">계산하면 여기에 남아요 (앱을 닫으면 지워져요)</div>'}
        </div>
      </div>`;
    const re = () => this.render(el);
    const press = (k) => {
      if (k === 'C') { expr = ''; result = ''; }
      else if (k === '⌫') { expr = expr.slice(0, -1); result = ''; }
      else if (k === '=') {
        try {
          const v = calculate(expr);
          result = fmt(v);
          history.unshift({ e: expr, r: result, v }); history.length = Math.min(history.length, 30);
          expr = String(v);
        } catch (err) { toast(err.message); }
      } else {
        if (result && /[0-9.(]/.test(k)) expr = '';
        result = '';
        if (/[+\-×÷]/.test(k) && /[+\-×÷]$/.test(expr)) expr = expr.slice(0, -1);
        expr += k;
      }
      re();
    };
    el.onclick = async (e) => {
      const b = e.target.closest('[data-k]'); if (b) return press(b.dataset.k);
      const h = e.target.closest('[data-h]'); if (h) { expr = String(history[Number(h.dataset.h)].v); result = ''; return re(); }
      const a = e.target.closest('[data-act]')?.dataset.act;
      let v = null;
      try { v = calculate(expr); } catch { v = null; }
      if (a === 'copy' && v != null) { try { await navigator.clipboard.writeText(String(v)); toast('복사했어요'); } catch { toast('복사하지 못했어요'); } }
      if (a === 'money') {
        if (!(v > 0)) return toast('0보다 큰 결과만 기록할 수 있어요');
        location.hash = `#/money?amount=${Math.round(v)}`;
      }
    };
    if (this._key) removeEventListener('keydown', this._key);
    this._key = (e) => {
      if (!document.querySelector('.calc') || document.querySelector('.modal')) return;
      const map = { '*': '×', '/': '÷', Enter: '=', Backspace: '⌫', Escape: 'C', c: 'C' };
      const k = map[e.key] || e.key;
      if (/^[0-9.+\-×÷()%=C⌫]$/.test(k)) { e.preventDefault(); press(k); }
    };
    addEventListener('keydown', this._key);
  },
  destroy() { if (this._key) removeEventListener('keydown', this._key); this._key = null; },
};
