/**
 * focus.js — focus mode (highlight active paragraph, blur others)
 */

import { toast } from './toast.js';

let _active = false;
let _cleanup = null;

export function setFocusMode(on) {
  _active = on;
  document.body.classList.toggle('focus-mode', on);
  if (on) _bindContent();
  else _unbind();
}

export function isFocusActive() { return _active; }

/** Re-bind after page render */
export function bindFocusContent() {
  if (!_active) return;
  _bindContent();
}

function _bindContent() {
  _unbind();
  const content = document.querySelector('.lesson-content');
  if (!content) return;

  const items = [...content.querySelectorAll('p, ul, h2')];
  if (!items.length) return;

  // Highlight first paragraph by default
  items[0]?.classList.add('focused');

  const handlers = items.map(el => {
    const fn = () => {
      items.forEach(x => x.classList.remove('focused'));
      el.classList.add('focused');
    };
    el.addEventListener('mouseenter', fn);
    el.addEventListener('touchstart', fn, { passive: true });
    return { el, fn };
  });

  _cleanup = () => {
    handlers.forEach(({ el, fn }) => {
      el.removeEventListener('mouseenter', fn);
      el.removeEventListener('touchstart', fn);
      el.classList.remove('focused');
    });
  };
}

function _unbind() {
  _cleanup?.();
  _cleanup = null;
}

export function toggleFocusMode(currentState) {
  const next = !currentState;
  setFocusMode(next);
  toast(next ? '◉ Modo foco ativado' : '○ Modo foco desativado');
  return next;
}
