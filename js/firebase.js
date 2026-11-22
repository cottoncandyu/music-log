// Firebase 연결 (로그인 + Firestore). 연동을 켠 사람만 SDK를 내려받도록 필요할 때 불러옵니다.
// 데이터 위치: users/{로그인한 사람 uid}/... — 보안 규칙으로 본인만 읽고 쓸 수 있게 막아야 합니다 (README 참고).
import { firebaseConfig } from './firebase-config.js';
import { startSync, stopSync } from './sync.js';

let sdk = null;
export const auth = { user: null, ready: false };
const emit = () => dispatchEvent(new Event('authchange'));
export const isConfigured = () => !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

async function load() {
  if (sdk) return sdk;
  const [App, A, F] = await Promise.all([
    import('../vendor/firebase/firebase-app.js'),
    import('../vendor/firebase/firebase-auth.js'),
    import('../vendor/firebase/firebase-firestore.js'),
  ]);
  const app = App.initializeApp(firebaseConfig);
  sdk = { A, F, auth: A.getAuth(app), db: F.getFirestore(app) };
  return sdk;
}

function backendFor(uid) {
  const { F, db } = sdk;
  const blob = (id) => F.doc(db, 'users', uid, 'blobs', id);
  const manifest = F.doc(db, 'users', uid, 'meta', 'manifest');
  return {
    put: (id, data) => F.setDoc(blob(id), data),
    get: async (id) => { const s = await F.getDoc(blob(id)); return s.exists() ? s.data() : null; },
    del: (id) => F.deleteDoc(blob(id)),
    updateManifest: (entries) => F.setDoc(manifest, { u: entries }, { merge: true }),
    getManifest: async () => { const s = await F.getDoc(manifest); return s.exists() ? s.data().u || {} : {}; },
    watchManifest: (cb) => F.onSnapshot(manifest, (s) => { if (!s.metadata.hasPendingWrites) cb(s.exists() ? s.data().u || {} : {}); }, (e) => console.warn('manifest', e)),
  };
}

/** 앱 시작 시: 이전에 로그인해 둔 상태면 자동으로 연동 시작 */
export async function initAuth() {
  if (!isConfigured()) { auth.ready = true; emit(); return; }
  // 한 번도 로그인한 적 없는 기기는 SDK를 미리 받지 않음
  if (!localStorage.getItem('archive-signed-in')) { auth.ready = true; emit(); return; }
  await watchUserOnce();
}
async function watchUser() {
  const { A } = await load();
  A.onAuthStateChanged(sdk.auth, async (user) => {
    auth.user = user; auth.ready = true; emit();
    if (user) { localStorage.setItem('archive-signed-in', '1'); startSync(backendFor(user.uid), user.uid); }
    else { localStorage.removeItem('archive-signed-in'); stopSync(); }
  });
}

const MSG = {
  'auth/invalid-email': '이메일 형식을 확인해주세요',
  'auth/missing-password': '비밀번호를 입력해주세요',
  'auth/weak-password': '비밀번호는 6자 이상이어야 해요',
  'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인해주세요',
  'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않아요',
  'auth/wrong-password': '이메일 또는 비밀번호가 맞지 않아요',
  'auth/user-not-found': '가입되지 않은 이메일이에요',
  'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 해주세요',
  'auth/network-request-failed': '인터넷 연결을 확인해주세요',
  'auth/operation-not-allowed': 'Firebase 콘솔에서 이메일/비밀번호 로그인을 켜주세요',
};
export const authMessage = (e) => MSG[e?.code] || e?.message || '알 수 없는 오류';

export async function signIn(email, pw) { await load(); await watchUserOnce(); return sdk.A.signInWithEmailAndPassword(sdk.auth, email, pw); }
export async function signUp(email, pw) { await load(); await watchUserOnce(); return sdk.A.createUserWithEmailAndPassword(sdk.auth, email, pw); }
export async function resetPassword(email) { await load(); return sdk.A.sendPasswordResetEmail(sdk.auth, email); }
export async function signOut() { if (!sdk) return; await sdk.A.signOut(sdk.auth); }
let watching = false;
async function watchUserOnce() { if (!watching) { watching = true; await watchUser(); } }
