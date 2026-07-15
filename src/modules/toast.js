/**
 * toast.js — global toast notification
 */

let _timer = null;
const _el = () => document.getElementById('toast');

export function toast(message, duration = 1700) {
  const el = _el();
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(_timer);
  _timer = setTimeout(() => el.classList.remove('show'), duration);
}
