import { state, save } from '../store.js';
import { icon } from '../icons.js';
import { esc, today, fmtDate, addDays, uid, ddayLabel, takeQuery, isYmd } from '../util.js';
import { seg, modal, confirmBox, toast } from '../ui.js';

let tab = 'todo';
let date = today();

function goalForm(g, after) {
  const isNew = !g;
  g = g || { id: uid(), title: '', target: 10, unit: '', current: 0, deadline: '', done: false };
  modal(`<h2>${isNew ? '새 목표' : '목표 수정'}<button class="icon-btn" data-close>${icon('close')}</button></h2>
    <form class="form">
      <label class="field"><span>목표</span><input type="text" name="title" value="${esc(g.title)}" required placeholder="예: 기출문제 10회독, 책 12권 읽기"></label>
      <div class="row"><label class="field"><span>현재</span><input type="number" name="current" step="any" value="${g.current}"></label>
      <label class="field"><span>목표치</span><input type="number" name="target" step="any" min="0" value="${g.target}"></label>
      <label class="field"><span>단위</span><input type="text" name="unit" value="${esc(g.unit)}" placeholder="회, 권, 강"></label></div>
      <label class="field"><span>마감일 (선택)</span><input type="date" name="deadline" value="${g.deadline}"></label>
      <div class="actions">${isNew ? '' : '<button type="button" class="btn danger" data-del>삭제</button><span class="spacer"></span>'}
        <button type="button" class="btn" data-close>취소</button><button class="btn primary">저장</button></div>
    </form>`, {
    onMount(box, close) {
      const f = box.querySelector('form');
      f.onsubmit = (e) => {
        e.preventDefault();
        Object.assign(g, { title: f.title.value.trim(), current: Number(f.current.value) || 0, target: Number(f.target.value) || 0, unit: f.unit.value.trim(), deadline: f.deadline.value });
        if (isNew) state.goals.push(g);
        save(); close(); after();
      };
      box.querySelector('[data-del]')?.addEventListener('click', async () => {
        close();
        if (await confirmBox('목표를 삭제할까요?', '삭제')) {
          state.goals = state.goals.filter((x) => x !== g);
          state.todos.forEach((t) => { if (t.goalId === g.id) t.goalId = ''; });
          save(); after();
        }
      });
    },
  });
}

function renderTodo() {
  const list = state.todos.filter((t) => t.date === date);
  const done = list.filter((t) => t.done).length;
  const overdue = state.todos.filter((t) => !t.done && t.date < date);
  const goals = state.goals.filter((g) => !g.done);
  const sorted = [...list.filter((t) => !t.done), ...list.filter((t) => t.done)];
  return `
    <div class="date-nav"><button class="btn sm" data-nav="-1">‹</button><span class="label">${fmtDate(date)}</span>
      <button class="btn sm" data-nav="1">›</button>${date !== today() ? '<button class="btn sm ghost" data-nav="0">오늘</button>' : ''}</div>
    <div class="grid two">
      <div class="card">
        <h3>할 일 <span class="right small muted">${done}/${list.length} 완료</span></h3>
        <div class="progress mb ${list.length && done === list.length ? 'good' : ''}"><i style="width:${list.length ? (done / list.length) * 100 : 0}%"></i></div>
        <form class="form" data-form="add">
          <div class="row nowrap"><input type="text" name="text" placeholder="할 일을 입력하고 엔터" autocomplete="off" enterkeyhint="done">
          <button class="btn primary">추가</button></div>
          ${goals.length ? `<select name="goal"><option value="">목표 연결 없음</option>${goals.map((g) => `<option value="${g.id}">${esc(g.title)}</option>`).join('')}</select>` : ''}
        </form>
        ${sorted.length ? `<ul class="list mt">${sorted.map((t) => {
          const g = state.goals.find((x) => x.id === t.goalId);
          return `<li class="check-item ${t.done ? 'done' : ''}"><input type="checkbox" data-check="${t.id}" ${t.done ? 'checked' : ''}>
            <span class="txt" data-edit="${t.id}">${esc(t.text)}</span>${g ? `<span class="tag">${esc(g.title)}</span>` : ''}
            <button class="icon-btn" data-move="${t.id}" title="내일로 미루기">${icon('arrowR', 16)}</button>
            <button class="icon-btn" data-del="${t.id}" aria-label="삭제">${icon('trash', 16)}</button></li>`;
        }).join('')}</ul>` : '<div class="empty">아직 할 일이 없어요</div>'}
        ${overdue.length ? `<hr><button class="btn soft block" data-act="carry">⤵︎ 지난 날 못한 일 ${overdue.length}개 가져오기</button>` : ''}
      </div>
      <div class="card">
        <h3>이번 주 달성률</h3>
        ${Array.from({ length: 7 }, (_, i) => {
          const d = addDays(date, i - 6);
          const l = state.todos.filter((t) => t.date === d), dn = l.filter((t) => t.done).length;
          return `<div class="row small" style="margin-bottom:6px"><span style="width:110px">${fmtDate(d)}</span>
            <div class="progress" style="flex:1"><i style="width:${l.length ? (dn / l.length) * 100 : 0}%"></i></div><span class="muted num" style="width:44px;text-align:right">${dn}/${l.length}</span></div>`;
        }).join('')}
        <p class="tiny muted mt">팁: 홈 화면의 ‘오늘 할 일’ 위젯에서도 바로 체크할 수 있어요.</p>
      </div>
    </div>`;
}

function renderGoals() {
  const active = state.goals.filter((g) => !g.done), finished = state.goals.filter((g) => g.done);
  const card = (g) => {
    const r = g.target ? Math.min(1, g.current / g.target) : 0;
    const linked = state.todos.filter((t) => t.goalId === g.id);
    return `<div class="card">
      <h3>${g.done ? '' : ''} ${esc(g.title)} <button class="icon-btn right" data-gedit="${g.id}">${icon('edit', 16)}</button></h3>
      <div class="row"><b class="big-time" style="font-size:30px">${g.current}</b><span class="muted">/ ${g.target}${esc(g.unit)}</span><span class="spacer"></span>
        <b style="color:var(--accent)">${Math.round(r * 100)}%</b></div>
      <div class="progress mt ${r >= 1 ? 'good' : ''}"><i style="width:${r * 100}%"></i></div>
      <div class="row mt small muted">${g.deadline ? `<span>${ddayLabel(g.deadline)} (${g.deadline})</span>` : ''}
        ${linked.length ? `<span>연결된 할 일 ${linked.filter((t) => t.done).length}/${linked.length}</span>` : ''}</div>
      <div class="row mt">
        <button class="btn sm" data-gstep="${g.id}" data-v="-1">−1</button><button class="btn sm primary" data-gstep="${g.id}" data-v="1">＋1</button>
        <span class="spacer"></span>
        <button class="btn sm ${g.done ? '' : 'soft'}" data-gdone="${g.id}">${g.done ? '다시 진행' : '달성 완료 '}</button></div>
    </div>`;
  };
  return `<div class="row mb"><button class="btn primary" data-act="goal">＋ 새 목표</button></div>
    ${active.length ? `<div class="grid">${active.map(card).join('')}</div>` : '<div class="card empty">장기 목표를 세워보세요 (예: 기출 5회독, 토익 900)</div>'}
    ${finished.length ? `<h3 class="mt mb">달성한 목표</h3><div class="grid">${finished.map(card).join('')}</div>` : ''}`;
}

export default {
  render(el) {
    const hq = location.hash.split('?')[1] || '';
    if (hq === 'goals') { tab = 'goals'; history.replaceState(null, '', '#/todo'); }
    else { const q = takeQuery('todo'); if (isYmd(q.date)) { date = q.date; tab = 'todo'; } }
    el.innerHTML = seg([['todo', '할 일'], ['goals', '목표']], tab) + (tab === 'todo' ? renderTodo() : renderGoals());
    const re = () => this.render(el);
    const find = (id) => state.todos.find((t) => t.id === id);

    el.onclick = async (e) => {
      const t = e.target;
      const s = t.closest('[data-seg]'); if (s) { tab = s.dataset.seg; return re(); }
      const nav = t.closest('[data-nav]');
      if (nav) { const n = Number(nav.dataset.nav); date = n === 0 ? today() : addDays(date, n); return re(); }
      const del = t.closest('[data-del]');
      if (del && del.dataset.del) { state.todos = state.todos.filter((x) => x.id !== del.dataset.del); save(); return re(); }
      const mv = t.closest('[data-move]');
      if (mv) { const x = find(mv.dataset.move); x.date = addDays(x.date, 1); save(); toast('내일로 옮겼어요'); return re(); }
      const ed = t.closest('[data-edit]');
      if (ed) {
        const x = find(ed.dataset.edit);
        const v = prompt('할 일 수정', x.text);
        if (v != null && v.trim()) { x.text = v.trim(); save(); re(); }
        return;
      }
      const gs = t.closest('[data-gstep]');
      if (gs) { const g = state.goals.find((x) => x.id === gs.dataset.gstep); g.current = Math.max(0, Math.round((g.current + Number(gs.dataset.v)) * 100) / 100); if (g.target && g.current >= g.target && !g.done) toast('목표치 도달! 달성 완료를 눌러보세요'); save(); return re(); }
      const gd = t.closest('[data-gdone]');
      if (gd) { const g = state.goals.find((x) => x.id === gd.dataset.gdone); g.done = !g.done; save(); return re(); }
      const ge = t.closest('[data-gedit]');
      if (ge) return goalForm(state.goals.find((x) => x.id === ge.dataset.gedit), re);
      const a = t.closest('[data-act]')?.dataset.act;
      if (a === 'goal') goalForm(null, re);
      if (a === 'carry') {
        state.todos.filter((x) => !x.done && x.date < date).forEach((x) => { x.date = date; });
        save(); toast('가져왔어요'); re();
      }
    };
    el.onchange = (e) => {
      const id = e.target.dataset.check;
      if (id) { find(id).done = e.target.checked; save(); re(); }
    };
    el.onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      const text = f.text.value.trim();
      if (!text) return;
      state.todos.push({ id: uid(), text, date, done: false, goalId: f.goal ? f.goal.value : '' });
      save(); re();
      el.querySelector('[data-form=add] input')?.focus();
    };
  },
};
