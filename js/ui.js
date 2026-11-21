import { esc } from './util.js';

export function modal(html, { onMount, wide = false, onClose } = {}) {
  const root = document.getElementById('modal-root');
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  root.appendChild(back);
  const box = back.firstElementChild;
  let closed = false;
  const close = () => { if (closed) return; closed = true; back.remove(); onClose && onClose(); };
  back.addEventListener('click', (e) => {
    if (e.target === back || e.target.closest('[data-close]')) close();
  });
  onMount && onMount(box, close);
  return close;
}

export function confirmBox(message, okText = '확인', danger = true) {
  return new Promise((resolve) => {
    let result = false;
    modal(`<h2>${esc(message)}</h2>
      <div class="actions"><button class="btn" data-close>취소</button>
      <button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okText)}</button></div>`, {
      onMount: (box, close) => { box.querySelector('[data-ok]').onclick = () => { result = true; close(); }; },
      onClose: () => resolve(result),
    });
  });
}

let toastTimer;
export function toast(msg, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/** 세그먼트 탭 HTML */
export const seg = (items, cur) =>
  `<div class="seg">${items.map(([k, label]) => `<button data-seg="${k}" class="${k === cur ? 'on' : ''}">${label}</button>`).join('')}</div>`;
