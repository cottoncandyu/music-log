// 설정 화면의 '기기 연동' 카드
import { esc } from '../util.js';
import { icon } from '../icons.js';
import { toast, confirmBox } from '../ui.js';
import { auth, isConfigured, signIn, signUp, signOut, resetPassword, authMessage } from '../firebase.js';
import { status, syncNow } from '../sync.js';

const time = (t) => { if (!t) return ''; const d = new Date(t); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
const STATE = { off: '꺼짐', syncing: '동기화 중…', ok: '동기화됨', offline: '오프라인 (연결되면 자동으로 올려요)', error: '오류' };

function html() {
  if (!isConfigured()) {
    return `<h3>${icon('refresh', 18)} 기기 연동</h3>
      <p class="small muted">패드·폰 기록을 자동으로 맞추려면 Firebase 프로젝트 연결이 필요해요. 설정이 끝나면 여기서 로그인할 수 있어요.</p>`;
  }
  if (!auth.ready) return `<h3>${icon('refresh', 18)} 기기 연동</h3><div class="small muted">확인 중…</div>`;
  if (!auth.user) {
    return `<h3>${icon('refresh', 18)} 기기 연동</h3>
      <p class="small muted">같은 계정으로 패드와 폰에서 로그인하면 기록이 자동으로 맞춰져요. 이 기기에 있던 기록은 지워지지 않고 클라우드 기록과 <b>합쳐져요</b>.</p>
      <form class="form" data-form="auth">
        <input type="email" name="email" placeholder="이메일" autocomplete="username" required>
        <input type="password" name="pw" placeholder="비밀번호 (6자 이상)" autocomplete="current-password" required minlength="6">
        <div class="row"><button class="btn primary" data-auth="in">로그인</button><button class="btn" data-auth="up">처음이면 가입</button>
          <span class="spacer"></span><button type="button" class="btn ghost sm" data-auth="reset">비밀번호 찾기</button></div>
      </form>`;
  }
  return `<h3>${icon('refresh', 18)} 기기 연동 <span class="right tag sync-${status.state}">${STATE[status.state] || status.state}${status.state === 'ok' && status.lastSync ? ' · ' + time(status.lastSync) : ''}</span></h3>
    <div class="small">${esc(auth.user.email)}</div>
    ${status.error ? `<div class="tiny" style="color:var(--bad)">${esc(status.error)}</div>` : ''}
    <p class="tiny muted">기록을 바꾸면 몇 초 안에 올라가고, 다른 기기에서는 바로 반영돼요. 사진도 함께 맞춰져요.</p>
    <div class="row"><button class="btn sm" data-auth="now">지금 동기화</button><button class="btn sm danger" data-auth="out">로그아웃</button></div>`;
}

export function mountSyncCard(box) {
  const draw = () => {
    // 입력 중이면 다시 그리지 않음
    if (box.contains(document.activeElement) && document.activeElement.matches('input')) return;
    box.innerHTML = html();
  };
  draw();
  addEventListener('authchange', draw);
  addEventListener('syncstatus', draw);
  box.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-auth]'); if (!b) return;
    const a = b.dataset.auth;
    const f = box.querySelector('form');
    if (a === 'in' || a === 'up') {
      e.preventDefault();
      const email = f.email.value.trim(), pw = f.pw.value;
      if (!email || pw.length < 6) return toast('이메일과 6자 이상 비밀번호를 입력해주세요');
      b.disabled = true;
      try { await (a === 'in' ? signIn(email, pw) : signUp(email, pw)); document.activeElement?.blur(); toast(a === 'in' ? '로그인했어요. 기록을 맞추는 중…' : '가입했어요. 이 기기 기록을 올리는 중…'); }
      catch (err) { toast(authMessage(err), 4000); }
      b.disabled = false; draw();
    }
    if (a === 'reset') {
      const email = f.email.value.trim(); if (!email) return toast('이메일을 먼저 입력해주세요');
      try { await resetPassword(email); toast('비밀번호 재설정 메일을 보냈어요'); } catch (err) { toast(authMessage(err), 4000); }
    }
    if (a === 'now') syncNow();
    if (a === 'out' && await confirmBox('로그아웃할까요? 이 기기의 기록은 그대로 남아요.', '로그아웃', false)) { await signOut(); toast('로그아웃했어요'); }
  });
  return () => { removeEventListener('authchange', draw); removeEventListener('syncstatus', draw); };
}
