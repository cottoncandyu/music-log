import { state, save, replaceAll, resetAll, SUBJECT_COLORS, storageInfo } from '../store.js';
import { esc, today, downloadBlob, resizeImage, uid } from '../util.js';
import { toast, confirmBox } from '../ui.js';
import { icon } from '../icons.js';
import { THEMES, FONTS, HAND_FONTS } from '../theme.js';
import { WIDGETS, widgetList } from './home.js';
import { BUILTIN } from '../quotes.js';

let wMode = null;

export default {
  async render(el) {
    const p = state.profile;
    wMode = wMode || p.mode;
    let usage = '';
    try { const est = await navigator.storage?.estimate?.(); if (est) usage = `${(est.usage / 1048576).toFixed(1)}MB 사용 / 약 ${(est.quota / 1048576).toFixed(0)}MB 가능`; } catch { /* noop */ }
    const dataMB = (new Blob([JSON.stringify(state)]).size / 1048576).toFixed(2);
    usage += ` · 기록 데이터 ${dataMB}MB · 저장 방식 ${storageInfo.engine === 'indexeddb' ? 'IndexedDB' : 'localStorage(임시)'}${storageInfo.lastError ? ` · 최근 오류: ${storageInfo.lastError}` : ''}`;
    const widgets = widgetList(wMode);
    const scrollToWidgets = location.hash.includes('?widgets');
    if (scrollToWidgets) history.replaceState(null, '', '#/settings');

    el.innerHTML = `
      <div class="card mb"><h3>${icon('sparkle', 18)} 테마</h3>
        <div class="theme-pick">${THEMES.map((t) => `<button data-pick-theme="${t.id}" class="${p.theme === t.id ? 'on' : ''}">
          <span class="sw3">${t.sw.map((c) => `<i style="background:${c}"></i>`).join('')}</span><b>${t.name}</b><span class="tiny muted">${t.desc}</span></button>`).join('')}</div>
        <div class="row mt"><span class="small"><b>화면 밝기</b></span>
          <div class="seg" style="margin:0">${[['auto', '자동'], ['light', '밝게'], ['dark', '어둡게']].map(([k, l]) => `<button data-pick-dark="${k}" class="${p.dark === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      </div>

      <div class="grid two">
        <div class="card"><h3>${icon('edit', 18)} 꾸미기</h3><div class="form">
          <div class="row nowrap"><label class="field"><span>강조색</span><input type="color" data-p="accent" value="${p.accent || '#6e695f'}" style="height:42px;padding:2px"></label>
            <button class="btn sm" data-act="accent-reset" style="align-self:flex-end">테마 기본색</button></div>
          <label class="field"><span>앱 글꼴</span><select data-p="uiFont">${FONTS.map((f) => `<option value="${f.id}" ${p.uiFont === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}</select></label>
          <label class="field"><span>글자 크기 ${p.fontScale}%</span><input type="range" min="85" max="125" step="5" data-p="fontScale" value="${p.fontScale}"></label>
          <label class="field"><span>모서리 둥글기 ${p.radius >= 0 ? p.radius + 'px' : '(테마 기본)'}</span><input type="range" min="0" max="28" step="2" data-p="radius" value="${p.radius >= 0 ? p.radius : 12}"></label>
          <button class="btn sm" data-act="radius-reset" style="align-self:flex-start">모서리 테마 기본</button>
          <label class="field"><span>배경 사진</span><div class="row">${p.bgImage ? `<img src="${p.bgImage}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px">` : ''}
            <label class="btn sm">사진 고르기<input type="file" accept="image/*" data-bg hidden></label>${p.bgImage ? '<button class="btn sm danger" data-act="bg-del">없애기</button>' : ''}</div></label>
          ${p.bgImage ? `<label class="field"><span>배경 흐리게 ${p.bgDim}%</span><input type="range" min="0" max="90" step="5" data-p="bgDim" value="${p.bgDim}"></label>` : ''}
          <label class="field"><span>메모·글쓰기 기본 글씨체</span>
            <div class="font-pick">${HAND_FONTS.map((f) => `<button type="button" data-memofont="${f.id}" class="${p.memoFont === f.id ? 'on' : ''}" style="font-family:${f.css}">${f.name}</button>`).join('')}</div></label>
        </div></div>

        <div class="card" id="widgets"><h3>${icon('home', 18)} 홈 위젯</h3>
          <div class="seg">${[['study', '공부 모드'], ['life', '라이프 모드']].map(([k, l]) => `<button data-wmode="${k}" class="${wMode === k ? 'on' : ''}">${l}</button>`).join('')}</div>
          <ul class="list">${widgets.map((w, i) => `<li><input type="checkbox" data-won="${w.id}" ${w.on ? 'checked' : ''}><span class="txt">${WIDGETS[w.id]}</span>
            <button class="icon-btn" data-wmove="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="위로">↑</button><button class="icon-btn" data-wmove="${i}" data-dir="1" ${i === widgets.length - 1 ? 'disabled' : ''} aria-label="아래로">↓</button></li>`).join('')}</ul>
          <button class="btn sm mt" data-act="widgets-reset">기본 배치로</button>
        </div>

        <div class="card"><h3>${icon('pen', 18)} 손글씨</h3><div class="form">
          <label class="row"><input type="checkbox" data-p="inkCorrect" ${p.inkCorrect ? 'checked' : ''}> 글씨 보정 (손떨림 줄이기 · 직선 반듯하게)</label>
          <label class="field"><span>보정 강도 ${p.inkStrength}</span><input type="range" min="1" max="6" step="1" data-p="inkStrength" value="${p.inkStrength}"></label>
          <label class="row"><input type="checkbox" data-p="penOnly" ${p.penOnly ? 'checked' : ''}> 애플펜슬 전용 (손가락 터치로는 안 그려짐)</label>
        </div></div>

        <div class="card"><h3>${icon('quote', 18)} 하루 한 줄</h3>
          <p class="tiny muted">기본 문장 ${BUILTIN.length}개(속담·짧은 다짐)에 내가 좋아하는 문장을 더할 수 있어요.</p>
          <form class="form" data-form="quote"><input type="text" name="text" placeholder="문장" required><div class="row nowrap"><input type="text" name="by" placeholder="출처 (선택)"><button class="btn">추가</button></div></form>
          ${state.quotes.length ? `<ul class="list mt">${state.quotes.map((q) => `<li><span class="txt">${esc(q.text)}${q.by ? ` <span class="muted small">— ${esc(q.by)}</span>` : ''}</span><button class="icon-btn" data-qdel="${q.id}">${icon('trash', 16)}</button></li>`).join('')}</ul>` : ''}
        </div>

        <div class="card"><h3>${icon('users', 18)} 프로필 · 공부</h3><div class="form">
          <label class="field"><span>이름 (공유 카드에 표시)</span><input type="text" data-p="name" value="${esc(p.name)}" placeholder="닉네임"></label>
          <label class="field"><span>하루 공부 목표 (분)</span><input type="number" min="10" step="10" data-p="goalMinutes" value="${p.goalMinutes}"></label>
          <div class="field"><span>과목</span>
          <ul class="list">${state.subjects.map((s, i) => `<li><input type="color" value="${s.color}" data-scolor="${i}" style="width:36px;height:32px;border:0;background:none;padding:0">
            <span class="txt">${esc(s.name)}</span><button class="icon-btn" data-sdel="${i}">${icon('trash', 16)}</button></li>`).join('')}</ul>
          <form class="row nowrap" data-form="subj"><input type="text" name="name" placeholder="새 과목 이름"><button class="btn">추가</button></form></div>
        </div></div>

        <div class="card"><h3>${icon('share', 18)} 백업 · 복원</h3>
          <p class="small muted">모든 기록은 이 기기에만 저장돼요.<br><span class="tiny">${esc(usage)}</span><br>
          Safari 웹사이트 데이터를 지우면 기록도 사라지니 <b>주기적으로 백업</b>해주세요.</p>
          <div class="row"><button class="btn primary" data-act="export">백업 파일 저장</button>
            <label class="btn">백업 불러오기<input type="file" accept="application/json,.json" data-import hidden></label></div>
          <hr><button class="btn danger sm" data-act="reset">모든 데이터 초기화</button>
        </div>

        <div class="card"><h3>${icon('screen', 18)} 홈 화면에 앱으로 추가</h3>
          <ol class="small" style="padding-left:18px;margin:0;line-height:1.9">
            <li><b>Safari</b>로 ARCHIVE 주소를 열어요 (크롬·네이버 앱 X)</li>
            <li>주소창 오른쪽 <b>공유 버튼</b>(네모에 위 화살표) 탭</li>
            <li>목록을 내려 <b>홈 화면에 추가</b> → 이름 확인 후 <b>추가</b></li>
            <li>홈 화면의 ARCHIVE 아이콘으로 실행하면 주소창 없는 전체화면 앱이 돼요</li>
          </ol>
          <p class="tiny muted mt">${matchMedia('(display-mode: standalone)').matches || navigator.standalone ? '지금 홈 화면 앱으로 실행 중이에요.' : '지금은 브라우저에서 보고 있어요.'} 홈 화면 앱과 Safari는 저장 공간이 따로라서, 옮길 땐 백업 파일을 이용하세요.</p>
        </div>
      </div>`;

    if (scrollToWidgets) setTimeout(() => el.querySelector('#widgets')?.scrollIntoView({ behavior: 'smooth' }), 50);
    const re = () => this.render(el);
    const theme = () => dispatchEvent(new Event('themechange'));
    const setWidgets = (list) => { p.widgets = { ...(p.widgets || {}), [wMode]: list }; save(); };

    el.oninput = (e) => {
      const k = e.target.dataset.p;
      if (!k || e.target.type !== 'range') return;
      p[k] = Number(e.target.value); save(); theme();
      const label = e.target.closest('label')?.querySelector('span');
      if (label && k === 'fontScale') label.textContent = `글자 크기 ${p[k]}%`;
      if (label && k === 'radius') label.textContent = `모서리 둥글기 ${p[k]}px`;
      if (label && k === 'bgDim') label.textContent = `배경 흐리게 ${p[k]}%`;
      if (label && k === 'inkStrength') label.textContent = `보정 강도 ${p[k]}`;
    };
    el.onchange = async (e) => {
      const t = e.target;
      const k = t.dataset.p;
      if (k && t.type !== 'range') {
        p[k] = t.type === 'checkbox' ? t.checked : t.type === 'number' ? Math.max(10, Number(t.value) || 240) : t.value;
        save(); theme(); return toast('저장했어요');
      }
      const won = t.dataset.won;
      if (won) { setWidgets(widgetList(wMode).map((w) => (w.id === won ? { ...w, on: t.checked } : w))); return; }
      if (t.dataset.scolor != null) { state.subjects[Number(t.dataset.scolor)].color = t.value; save(); return; }
      if (t.matches('[data-bg]') && t.files[0]) { p.bgImage = await resizeImage(t.files[0], 1600, 0.8); save(); theme(); return re(); }
      if (t.matches('[data-import]') && t.files[0]) {
        try {
          const data = JSON.parse(await t.files[0].text());
          if (!data || typeof data !== 'object' || !('memos' in data || 'sessions' in data)) throw new Error('형식 오류');
          if (!(await confirmBox('현재 기록을 백업 파일 내용으로 바꿀까요?', '불러오기'))) return;
          await replaceAll(data);
          toast('불러왔어요'); setTimeout(() => location.reload(), 600);
        } catch { toast('올바른 백업 파일이 아니에요'); }
      }
    };
    el.onclick = async (e) => {
      const th = e.target.closest('[data-pick-theme]');
      if (th) { p.theme = th.dataset.pickTheme; p.accent = ''; p.radius = -1; save(); theme(); return re(); }
      const dk = e.target.closest('[data-pick-dark]'); if (dk) { p.dark = dk.dataset.pickDark; save(); theme(); return re(); }
      const mf = e.target.closest('[data-memofont]'); if (mf) { p.memoFont = mf.dataset.memofont; save(); theme(); return re(); }
      const wm = e.target.closest('[data-wmode]'); if (wm) { wMode = wm.dataset.wmode; return re(); }
      const mv = e.target.closest('[data-wmove]');
      if (mv) {
        const list = widgetList(wMode), i = Number(mv.dataset.wmove), j = i + Number(mv.dataset.dir);
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]]; setWidgets(list); return re();
      }
      const qd = e.target.closest('[data-qdel]'); if (qd) { state.quotes = state.quotes.filter((q) => q.id !== qd.dataset.qdel); save(); return re(); }
      const sd = e.target.closest('[data-sdel]');
      if (sd) {
        if (state.subjects.length <= 1) return toast('과목은 최소 1개 필요해요');
        const s = state.subjects[Number(sd.dataset.sdel)];
        if (await confirmBox(`'${s.name}' 과목을 목록에서 뺄까요? (기존 기록은 유지돼요)`, '빼기')) { state.subjects.splice(Number(sd.dataset.sdel), 1); save(); re(); }
        return;
      }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'accent-reset') { p.accent = ''; save(); theme(); re(); }
      if (a === 'radius-reset') { p.radius = -1; save(); theme(); re(); }
      if (a === 'bg-del') { p.bgImage = ''; save(); theme(); re(); }
      if (a === 'widgets-reset') { if (p.widgets) delete p.widgets[wMode]; save(); re(); }
      if (a === 'export') {
        downloadBlob(new Blob([JSON.stringify(state)], { type: 'application/json' }), `ARCHIVE-백업-${today()}.json`);
        toast('백업 파일을 저장했어요');
      }
      if (a === 'reset') {
        if (await confirmBox('정말 모든 기록을 지울까요? 되돌릴 수 없어요.', '모두 삭제')) {
          if (await confirmBox('마지막 확인: 백업은 하셨나요?', '네, 삭제')) { await resetAll(); location.reload(); }
        }
      }
    };
    el.onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.dataset.form === 'quote') {
        const text = f.text.value.trim(); if (!text) return;
        state.quotes.unshift({ id: uid(), text, by: f.by.value.trim() }); save(); return re();
      }
      const name = f.name.value.trim();
      if (!name) return;
      if (state.subjects.some((s) => s.name === name)) return toast('이미 있는 과목이에요');
      state.subjects.push({ name, color: SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length] });
      save(); re();
    };
  },
};
