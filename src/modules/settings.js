/**
 * settings.js — settings panel: themes, fonts, reading prefs, toggles
 */

import { storage } from './storage.js';
import { toast }   from './toast.js';
import { setFocusMode, isFocusActive } from './focus.js';
import { setHighlightEnabled } from './highlights.js';

// ---- Defaults ----
export const DEFAULTS = {
  theme:       'light',
  fontFamily:  'literary',   // 'literary' | 'humanist'
  fontScale:   1,
  lineHeight:  1.86,
  lineWidth:   68,            // ch units
  focusMode:   false,
  highlights:  true,
};

let state = null;

/** Load persisted prefs or defaults */
export function loadPrefs() {
  state = {
    theme:      storage.get('theme',      DEFAULTS.theme),
    fontFamily: storage.get('fontFamily', DEFAULTS.fontFamily),
    fontScale:  Number(storage.get('fontScale',  DEFAULTS.fontScale)),
    lineHeight: Number(storage.get('lineHeight', DEFAULTS.lineHeight)),
    lineWidth:  Number(storage.get('lineWidth',  DEFAULTS.lineWidth)),
    focusMode:  storage.get('focus', '0') === '1',
    highlights: storage.get('hl', '1') !== '0',
  };
  return state;
}

export function getPrefs() { return state; }

/** Apply all prefs to DOM */
export function applyPrefs() {
  const s = state;
  const root = document.documentElement;

  // Theme
  root.dataset.theme = s.theme;
  document.getElementById('themeColorMeta')?.setAttribute(
    'content',
    { light: '#f5f0e8', sepia: '#f4ead0', dark: '#080c12', night: '#000' }[s.theme] ?? '#0d1118'
  );

  // Typography CSS vars
  root.style.setProperty('--font-scale',   s.fontScale);
  root.style.setProperty('--reading-lh',   s.lineHeight);
  root.style.setProperty('--reading-maxw', s.lineWidth + 'ch');

  const bodyFont = s.fontFamily === 'humanist'
    ? "'DM Sans','Inter',ui-sans-serif,system-ui,sans-serif"
    : "'Literata','Source Serif 4',Georgia,serif";
  root.style.setProperty('--font-body', bodyFont);

  // Focus / highlight side effects
  setFocusMode(s.focusMode);
  setHighlightEnabled(s.highlights);

  // Sync settings panel UI
  _syncPanel();
}

// ---- Setters ----
export function setTheme(t) {
  state.theme = t;
  storage.set('theme', t);
  applyPrefs();
}

export function setFontFamily(f) {
  state.fontFamily = f;
  storage.set('fontFamily', f);
  applyPrefs();
}

export function adjustFontScale(delta) {
  state.fontScale = _clamp(+(state.fontScale + delta).toFixed(2), 0.75, 1.45);
  storage.set('fontScale', state.fontScale);
  applyPrefs();
  toast(`Fonte ${Math.round(state.fontScale * 100)}%`);
}

export function setFontScale(v) {
  state.fontScale = _clamp(+v, 0.75, 1.45);
  storage.set('fontScale', state.fontScale);
  applyPrefs();
}

export function adjustLineHeight(delta) {
  state.lineHeight = _clamp(+(state.lineHeight + delta).toFixed(2), 1.4, 2.4);
  storage.set('lineHeight', state.lineHeight);
  applyPrefs();
}

export function setLineHeight(v) {
  state.lineHeight = _clamp(+v, 1.4, 2.4);
  storage.set('lineHeight', state.lineHeight);
  applyPrefs();
}

export function adjustLineWidth(delta) {
  state.lineWidth = _clamp(state.lineWidth + delta, 44, 90);
  storage.set('lineWidth', state.lineWidth);
  applyPrefs();
}

export function setLineWidth(v) {
  state.lineWidth = _clamp(+v, 44, 90);
  storage.set('lineWidth', state.lineWidth);
  applyPrefs();
}

export function toggleFocus(on) {
  state.focusMode = on;
  storage.set('focus', on ? '1' : '0');
  applyPrefs();
  toast(on ? '◉ Modo foco ativado' : '○ Modo foco desativado');
}

export function toggleHighlights(on) {
  state.highlights = on;
  storage.set('hl', on ? '1' : '0');
  applyPrefs();
}

export function resetPrefs() {
  storage.clear('theme','fontFamily','fontScale','lineHeight','lineWidth','focus','hl');
  state = { ...DEFAULTS };
  applyPrefs();
  toast('↺ Configurações restauradas');
}

// ---- Build settings panel ----
export function buildSettingsPanel() {
  const el = document.getElementById('settingsBody');
  if (!el) return;

  el.innerHTML = `
    <!-- Theme -->
    <div>
      <div class="settings-section-label">Tema de leitura</div>
      <div class="theme-swatches">
        ${_themeSwatches()}
      </div>
    </div>

    <div class="settings-divider"></div>

    <!-- Font family -->
    <div>
      <div class="settings-section-label">Tipografia</div>
      <div class="font-choices">
        <button class="font-choice ${state.fontFamily === 'literary' ? 'active' : ''}" data-font="literary">
          <div class="font-choice-name" style="font-family:'Literata',serif">Literata</div>
          <div class="font-choice-sample" style="font-family:'Literata',serif;font-style:italic">Liderança & fé</div>
        </button>
        <button class="font-choice ${state.fontFamily === 'humanist' ? 'active' : ''}" data-font="humanist">
          <div class="font-choice-name" style="font-family:'DM Sans',sans-serif">DM Sans</div>
          <div class="font-choice-sample" style="font-family:'DM Sans',sans-serif">Liderança & fé</div>
        </button>
      </div>
    </div>

    <div class="settings-divider"></div>

    <!-- Font size -->
    <div>
      <div class="settings-section-label">
        Tamanho do texto
        <span id="fsSval" class="slider-value">${Math.round(state.fontScale * 100)}%</span>
      </div>
      <div class="slider-row">
        <button class="slider-step-btn" id="fsMinus">A−</button>
        <input type="range" id="fsSlider" min="0.75" max="1.45" step="0.02" value="${state.fontScale}">
        <button class="slider-step-btn" id="fsPlus">A+</button>
      </div>
    </div>

    <!-- Line height -->
    <div>
      <div class="settings-section-label">
        Espaçamento de linha
        <span id="lhSval" class="slider-value">${state.lineHeight.toFixed(2)}</span>
      </div>
      <div class="slider-row">
        <button class="slider-step-btn" id="lhMinus">≡−</button>
        <input type="range" id="lhSlider" min="1.4" max="2.4" step="0.04" value="${state.lineHeight}">
        <button class="slider-step-btn" id="lhPlus">≡+</button>
      </div>
    </div>

    <!-- Line width -->
    <div>
      <div class="settings-section-label">
        Largura de leitura
        <span id="lwSval" class="slider-value">${state.lineWidth}ch</span>
      </div>
      <div class="slider-row">
        <button class="slider-step-btn" id="lwMinus">◂</button>
        <input type="range" id="lwSlider" min="44" max="90" step="2" value="${state.lineWidth}">
        <button class="slider-step-btn" id="lwPlus">▸</button>
      </div>
    </div>

    <div class="settings-divider"></div>

    <!-- Focus mode toggle -->
    <div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Modo Foco</div>
          <div class="toggle-sub">Destaca apenas o parágrafo atual</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="focusToggle" ${state.focusMode ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
    </div>

    <!-- Highlights toggle -->
    <div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Destaques de texto</div>
          <div class="toggle-sub">Selecione texto para marcar</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="hlToggle" ${state.highlights ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
    </div>

    <div class="settings-divider"></div>

    <!-- Reset -->
    <button class="btn-reset" id="resetBtn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.47"/></svg>
      Restaurar padrões
    </button>
  `;

  _bindPanelEvents();
}

function _themeSwatches() {
  const themes = [
    { id: 'light', name: 'Claro',   bg: '#faf8f4', dot: '#1a1510' },
    { id: 'sepia', name: 'Sépia',   bg: '#fdf6e3', dot: '#3c2f1a' },
    { id: 'dark',  name: 'Escuro',  bg: '#0f1520', dot: '#e8eef8' },
    { id: 'night', name: 'Noite',   bg: '#000000', dot: '#c8c8c8' },
  ];
  return themes.map(t => `
    <button class="theme-swatch ${state.theme === t.id ? 'active' : ''}" data-theme="${t.id}">
      <div class="theme-swatch-bg" style="background:${t.bg}"></div>
      <div class="theme-swatch-name">${t.name}</div>
    </button>
  `).join('');
}

function _bindPanelEvents() {
  // Theme swatches
  document.querySelectorAll('[data-theme]').forEach(b => {
    b.addEventListener('click', () => setTheme(b.dataset.theme));
  });

  // Font family
  document.querySelectorAll('[data-font]').forEach(b => {
    b.addEventListener('click', () => setFontFamily(b.dataset.font));
  });

  // Font size
  document.getElementById('fsMinus')?.addEventListener('click', () => adjustFontScale(-0.06));
  document.getElementById('fsPlus')?.addEventListener('click',  () => adjustFontScale(+0.06));
  document.getElementById('fsSlider')?.addEventListener('input', e => setFontScale(e.target.value));

  // Line height
  document.getElementById('lhMinus')?.addEventListener('click', () => adjustLineHeight(-0.08));
  document.getElementById('lhPlus')?.addEventListener('click',  () => adjustLineHeight(+0.08));
  document.getElementById('lhSlider')?.addEventListener('input', e => setLineHeight(e.target.value));

  // Line width
  document.getElementById('lwMinus')?.addEventListener('click', () => adjustLineWidth(-4));
  document.getElementById('lwPlus')?.addEventListener('click',  () => adjustLineWidth(+4));
  document.getElementById('lwSlider')?.addEventListener('input', e => setLineWidth(e.target.value));

  // Focus toggle
  document.getElementById('focusToggle')?.addEventListener('change', e => toggleFocus(e.target.checked));

  // Highlights toggle
  document.getElementById('hlToggle')?.addEventListener('change', e => toggleHighlights(e.target.checked));

  // Reset
  document.getElementById('resetBtn')?.addEventListener('click', resetPrefs);
}

function _syncPanel() {
  // Theme swatches
  document.querySelectorAll('[data-theme]').forEach(b =>
    b.classList.toggle('active', b.dataset.theme === state.theme));
  // Font choices
  document.querySelectorAll('[data-font]').forEach(b =>
    b.classList.toggle('active', b.dataset.font === state.fontFamily));
  // Sliders / labels
  _syncSlider('fsSlider', 'fsSval', state.fontScale, v => Math.round(v * 100) + '%');
  _syncSlider('lhSlider', 'lhSval', state.lineHeight, v => v.toFixed(2));
  _syncSlider('lwSlider', 'lwSval', state.lineWidth, v => v + 'ch');
  // Toggles
  const ft = document.getElementById('focusToggle');
  if (ft) ft.checked = state.focusMode;
  const ht = document.getElementById('hlToggle');
  if (ht) ht.checked = state.highlights;
}

function _syncSlider(sliderId, valId, value, fmt) {
  const s = document.getElementById(sliderId); if (s) s.value = value;
  const v = document.getElementById(valId);    if (v) v.textContent = fmt(value);
}

function _clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
