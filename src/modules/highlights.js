/**
 * highlights.js — text highlight feature with localStorage persistence
 */

import { storage } from './storage.js';
import { toast } from './toast.js';

const SPAN_CLASS = 'text-highlight';
let _enabled = true;
let _currentRange = null;
let _pageKey = null;

// ---- DOM refs ----
const tooltip  = () => document.getElementById('hlTooltip');
const applyBtn = () => document.getElementById('hlApply');
const copyBtn  = () => document.getElementById('hlCopy');

// ---- Init ----
export function initHighlights() {
  document.addEventListener('mouseup', _onMouseUp);
  document.addEventListener('touchend', _onTouchEnd);
  document.addEventListener('mousedown', _onMouseDown);
  applyBtn()?.addEventListener('click', applyHighlight);
  copyBtn()?.addEventListener('click', copySelection);
}

export function setHighlightEnabled(val) {
  _enabled = val;
  if (!val) hideTooltip();
}

/** Called when reader renders a new page — restore saved highlights */
export function restoreHighlights(pageKey) {
  _pageKey = pageKey;
  // Highlights are stored as text positions (simplified: just class spans restored via innerHTML reparse)
  // For this implementation we restore by marking saved text snippets
  const saved = storage.getJSON('hl_' + pageKey, []);
  if (!saved.length) return;
  const content = document.querySelector('.lesson-content');
  if (!content) return;
  // Restore by searching and wrapping text nodes
  saved.forEach(text => _wrapTextInContent(content, text));
}

/** Saves all highlights from current page */
function _saveHighlights() {
  if (!_pageKey) return;
  const spans = [...document.querySelectorAll('.' + SPAN_CLASS)];
  const texts = spans.map(s => s.textContent);
  storage.setJSON('hl_' + _pageKey, texts);
}

// ---- Text wrapping helper ----
function _wrapTextInContent(container, searchText) {
  if (!searchText.trim()) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const idx = node.nodeValue.indexOf(searchText);
    if (idx === -1) continue;
    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + searchText.length);
    _wrapRange(range);
    break;
  }
}

// ---- Event handlers ----
function _onMouseUp() {
  if (!_enabled) return;
  _checkSelection();
}

function _onTouchEnd() {
  if (!_enabled) return;
  // Small delay to let selection stabilize on touch
  setTimeout(_checkSelection, 80);
}

function _onMouseDown(e) {
  if (e.target.closest('#hlTooltip')) return;
  hideTooltip();
}

function _checkSelection() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) {
    hideTooltip();
    return;
  }
  const range = sel.getRangeAt(0);
  const text = range.toString().trim();
  if (!text || text.length < 2) {
    hideTooltip();
    return;
  }

  // Only show inside lesson content
  const content = document.querySelector('.lesson-content');
  if (!content || !content.contains(range.commonAncestorContainer)) {
    hideTooltip();
    return;
  }

  _currentRange = range.cloneRange();
  _showTooltip(range.getBoundingClientRect());
}

function _showTooltip(rect) {
  const tip = tooltip();
  if (!tip) return;
  tip.classList.add('visible');
  // Position above selection
  const tipH = tip.offsetHeight || 40;
  const tipW = tip.offsetWidth || 130;
  let top = rect.top + window.scrollY - tipH - 8;
  let left = rect.left + rect.width / 2 - tipW / 2;
  // Clamp to viewport
  left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
  if (top < 8) top = rect.bottom + window.scrollY + 8;
  tip.style.top  = top + 'px';
  tip.style.left = left + 'px';
}

function hideTooltip() {
  tooltip()?.classList.remove('visible');
  _currentRange = null;
}

// ---- Actions ----
export function applyHighlight() {
  if (!_currentRange) return;
  try {
    _wrapRange(_currentRange);
    window.getSelection()?.removeAllRanges();
    hideTooltip();
    _saveHighlights();
    toast('✦ Texto destacado');
  } catch {
    toast('Não foi possível destacar aqui');
  }
}

function _wrapRange(range) {
  const span = document.createElement('span');
  span.className = SPAN_CLASS;
  span.title = 'Clique para remover destaque';
  range.surroundContents(span);
  span.addEventListener('click', () => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    _saveHighlights();
    toast('Destaque removido');
  });
}

export function copySelection() {
  const sel = window.getSelection();
  const text = sel?.toString() ?? '';
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
  sel.removeAllRanges();
  hideTooltip();
  toast('⎘ Copiado!');
}
