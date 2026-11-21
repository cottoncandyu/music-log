import { state, save, replaceAll, resetAll, SUBJECT_COLORS } from '../store.js';
import { esc, today, downloadBlob } from '../util.js';
import { toast, confirmBox } from '../ui.js';

export default {
  async render(el) {
    const p = state.profile;
    let usage = '';
    try { const est = await navigator.storage?.estimate?.(); if (est) usage = `${(est.usage / 1048576).toFixed(1)}MB 사용 중`; } catch { /* noop */ }
    el.innerHTML = `
      <div class="grid two">
        <div class="card"><h3>🙂 프로필</h3><div class="form">
          <label class="field"><span>이름 (공유 카드에 표시)</span><input type="text" data-p="name" value="${esc(p.name)}" placeholder="닉네임"></label>
          <label class="field"><span>하루 공부 목표 (분)</span><input type="number" min="10" step="10" data-p="goalMinutes" value="${p.goalMinutes}"></label>
          <label class="field"><span>화면 테마</span><select data-p="theme">
            <option value="auto" ${p.theme === 'auto' ? 'selected' : ''}>기기 설정 따르기</option>
            <option value="light" ${p.theme === 'light' ? 'selected' : ''}>밝게</option>
            <option value="dark" ${p.theme === 'dark' ? 'selected' : ''}>어둡게</option></select></label>
          <label class="row"><input type="checkbox" data-p="penOnly" ${p.penOnly ? 'checked' : ''}> ✍️ 애플펜슬 전용 그리기 (손바닥·손가락 터치 무시)</label>
        </div></div>

        <div class="card"><h3>📘 과목 관리</h3>
          <ul class="list">${state.subjects.map((s, i) => `<li><input type="color" value="${s.color}" data-scolor="${i}" style="width:36px;height:32px;border:0;background:none;padding:0">
            <span class="txt">${esc(s.name)}</span><button class="icon-btn" data-sdel="${i}">🗑</button></li>`).join('')}</ul>
          <form class="row nowrap mt" data-form="subj"><input type="text" name="name" placeholder="새 과목 이름"><button class="btn">추가</button></form>
        </div>

        <div class="card"><h3>💾 백업 · 복원</h3>
          <p class="small muted">모든 기록은 이 기기의 브라우저 저장소에만 있어요. ${usage}<br>
          Safari 방문 기록·웹사이트 데이터를 지우면 기록도 사라지니 <b>주기적으로 백업</b>해주세요.</p>
          <div class="row"><button class="btn primary" data-act="export">⬇️ 백업 파일 저장</button>
            <label class="btn">⬆️ 백업 불러오기<input type="file" accept="application/json,.json" data-import hidden></label></div>
          <p class="tiny muted mt">다른 기기(예: 아이폰 ↔ 아이패드)로 옮길 때도 백업 파일을 이용하세요.</p>
          <hr><button class="btn danger sm" data-act="reset">모든 데이터 초기화</button>
        </div>

        <div class="card"><h3>📲 아이패드에 앱처럼 설치하기</h3>
          <ol class="small" style="padding-left:18px;margin:0">
            <li>Safari로 이 페이지를 열어요</li>
            <li>주소창 옆 <b>공유 버튼(⬆️)</b> → <b>홈 화면에 추가</b></li>
            <li>홈 화면의 ‘공부책상’ 아이콘으로 실행하면 전체화면 앱으로 동작해요 (오프라인에서도 OK)</li>
          </ol>
          <p class="tiny muted mt">※ 웹앱은 iOS의 홈 화면/잠금화면 ‘위젯’을 직접 만들 수 없어요. 대신 앱 첫 화면이 위젯 대시보드로 구성되어 있고, 디데이 메뉴에서 배경화면 이미지를 만들 수 있어요.</p>
        </div>
      </div>`;

    const re = () => this.render(el);
    el.onchange = async (e) => {
      const t = e.target;
      const k = t.dataset.p;
      if (k) {
        p[k] = t.type === 'checkbox' ? t.checked : t.type === 'number' ? Math.max(10, Number(t.value) || 240) : t.value;
        save();
        if (k === 'theme') dispatchEvent(new Event('themechange'));
        return toast('저장했어요');
      }
      if (t.dataset.scolor != null) { state.subjects[Number(t.dataset.scolor)].color = t.value; save(); return; }
      if (t.matches('[data-import]') && t.files[0]) {
        try {
          const data = JSON.parse(await t.files[0].text());
          if (!data || typeof data !== 'object' || !('memos' in data || 'sessions' in data)) throw new Error('형식 오류');
          if (!(await confirmBox('현재 기록을 백업 파일 내용으로 바꿀까요?', '불러오기'))) return;
          await replaceAll(data);
          toast('불러왔어요'); dispatchEvent(new Event('themechange'));
          setTimeout(() => location.reload(), 600);
        } catch { toast('올바른 백업 파일이 아니에요'); }
      }
    };
    el.onclick = async (e) => {
      const sd = e.target.closest('[data-sdel]');
      if (sd) {
        if (state.subjects.length <= 1) return toast('과목은 최소 1개 필요해요');
        const s = state.subjects[Number(sd.dataset.sdel)];
        if (await confirmBox(`'${s.name}' 과목을 목록에서 뺄까요? (기존 기록은 유지돼요)`, '빼기')) { state.subjects.splice(Number(sd.dataset.sdel), 1); save(); re(); }
        return;
      }
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'export') {
        downloadBlob(new Blob([JSON.stringify(state)], { type: 'application/json' }), `공부책상-백업-${today()}.json`);
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
      const name = e.target.name.value.trim();
      if (!name) return;
      if (state.subjects.some((s) => s.name === name)) return toast('이미 있는 과목이에요');
      state.subjects.push({ name, color: SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length] });
      save(); re();
    };
  },
};
