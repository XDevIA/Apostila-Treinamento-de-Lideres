/**
 * main.js — Apostila Digital v2
 * Entry point: wires all modules together
 */

import { APOSTILA_DATA as D } from './data.js';

// Custom cover image override
D.cover = './cover.png';

import { storage }                          from './modules/storage.js';
import { toast }                            from './modules/toast.js';
import { loadPrefs, applyPrefs,
         getPrefs, buildSettingsPanel,
         toggleFocus }                      from './modules/settings.js';
import { initHighlights, setHighlightEnabled,
         applyHighlight, copySelection,
         restoreHighlights }                from './modules/highlights.js';
import { bindFocusContent }                 from './modules/focus.js';
import { renderCover, renderToc,
         renderLessonPage }                 from './modules/renderer.js';
import { buildSidebar, buildDrawer,
         syncActiveNav, updateSidebarProgress } from './modules/navigation.js';

// ================================================================
// SCREEN MODEL
// ================================================================

/** screens[] = [ {type:'cover'}, {type:'toc'}, ...{type:'page',lesson,page} ] */
const screens = (() => {
  const list = [{ type: 'cover' }, { type: 'toc' }];
  for (const lesson of D.lessons) {
    for (const page of lesson.pages) {
      list.push({ type: 'page', lesson, page });
    }
  }
  return list;
})();

// ================================================================
// APP STATE
// ================================================================
const appState = {
  screen:   Math.max(0, Math.min(screens.length - 1,
              Number(storage.get('screen', 0)))),
  viewMode: storage.get('viewMode', 'text'),  // 'text' | 'original'
  tocQuery: '',
};

// ================================================================
// DOM REFS
// ================================================================
const shell       = document.getElementById('pageShell');
const titleEl     = document.getElementById('currentTitle');
const subEl       = document.getElementById('currentSub');
const prevBtn     = document.getElementById('prev');
const nextBtn     = document.getElementById('next');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const viewModeBtn  = document.getElementById('viewModeBtn');
const viewModeLabel = document.getElementById('viewModeLabel');
const focusModeBtn  = document.getElementById('focusModeBtn');

// ================================================================
// RENDER
// ================================================================
function render(dir = 0) {
  const s = screens[appState.screen];

  // Animate page shell
  shell.classList.remove('anim-next', 'anim-prev');
  // Force reflow to restart animation
  void shell.offsetWidth;
  if (dir >  0) shell.classList.add('anim-next');
  if (dir < 0)  shell.classList.add('anim-prev');

  // Render content
  if (s.type === 'cover') {
    shell.innerHTML = renderCover(D);
    // Bind CTA
    document.getElementById('coverStartBtn')?.addEventListener('click', () => goTo(1, 1));

  } else if (s.type === 'toc') {
    shell.innerHTML = renderToc(D, appState.tocQuery);
    // Bind search
    _bindTocSearch();
    // Bind TOC items
    shell.querySelectorAll('.toc-item[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => goTo(Number(btn.dataset.screen)));
    });

  } else {
    shell.innerHTML = renderLessonPage(s, D.totalPages, appState.viewMode);
    // Restore highlights for this page
    restoreHighlights(`${s.lesson.number}_${s.page.localPage}`);
    // Bind focus content
    bindFocusContent();
  }

  // Update header
  _updateHeader(s);

  // Update nav buttons
  prevBtn.disabled = appState.screen === 0;
  nextBtn.disabled = appState.screen === screens.length - 1;

  // Update progress
  const pct = appState.screen / (screens.length - 1);
  progressFill.style.width = (pct * 100).toFixed(1) + '%';
  progressLabel.textContent = appState.screen < 2
    ? `${appState.screen + 1}/${screens.length}`
    : `${s.page.globalPage}/${D.totalPages}`;

  // Update sidebar
  syncActiveNav(appState.screen, screens);
  updateSidebarProgress(pct);

  // Persist position
  storage.set('screen', appState.screen);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Bind any newly rendered sidebar/drawer items
  _bindNavItems();
}

function _updateHeader(s) {
  if (s.type === 'cover') {
    titleEl.textContent = 'Treinamento de Líderes';
    subEl.textContent   = 'Capa';
  } else if (s.type === 'toc') {
    titleEl.textContent = 'Sumário';
    subEl.textContent   = `${D.lessons.length} lições`;
  } else {
    titleEl.textContent = s.lesson.title;
    subEl.textContent   = `Pág. ${s.page.globalPage} de ${D.totalPages}`;
  }
}

// ================================================================
// NAVIGATION
// ================================================================
function goTo(i, dir = 0) {
  i = Math.max(0, Math.min(screens.length - 1, i));
  const d = dir || Math.sign(i - appState.screen) || 1;
  appState.screen = i;
  render(d);
}

function step(d) { goTo(appState.screen + d, d); }

prevBtn.addEventListener('click', () => step(-1));
nextBtn.addEventListener('click', () => step(+1));

/** Bind clicks on dynamically rendered nav items */
function _bindNavItems() {
  document.querySelectorAll('.sidebar-item[data-screen], .drawer-item[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => {
      goTo(Number(btn.dataset.screen));
      closeDrawer();
    });
  });
}

// ================================================================
// TOC SEARCH
// ================================================================
function _bindTocSearch() {
  const input = document.getElementById('tocSearch');
  if (!input) return;
  input.addEventListener('input', e => {
    appState.tocQuery = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const ni = document.getElementById('tocSearch');
    ni?.focus();
    ni?.setSelectionRange(pos, pos);
  });
}

// ================================================================
// DRAWER (mobile)
// ================================================================
function openDrawer()  {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('menuBtn').addEventListener('click', openDrawer);
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);

// ================================================================
// SETTINGS PANEL
// ================================================================
function openSettings() {
  document.getElementById('settingsPanel').classList.add('open');
  document.getElementById('settingsBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSettings() {
  document.getElementById('settingsPanel').classList.remove('open');
  document.getElementById('settingsBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('settingsClose').addEventListener('click', closeSettings);
document.getElementById('settingsBackdrop').addEventListener('click', closeSettings);

// ================================================================
// VIEW MODE (text / original)
// ================================================================
viewModeBtn.addEventListener('click', () => {
  if (appState.screen < 2) {
    toast('Abra uma lição primeiro');
    return;
  }
  appState.viewMode = appState.viewMode === 'text' ? 'original' : 'text';
  storage.set('viewMode', appState.viewMode);
  viewModeLabel.textContent = appState.viewMode === 'text' ? 'Original' : 'Texto';
  render();
});

// ================================================================
// FOCUS MODE TOPBAR BTN
// ================================================================
focusModeBtn.addEventListener('click', () => {
  const p = getPrefs();
  toggleFocus(!p.focusMode);
  bindFocusContent();
});

// ================================================================
// KEYBOARD
// ================================================================
window.addEventListener('keydown', e => {
  // Skip when focus is on an input
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

  switch (e.key) {
    case 'ArrowRight': case 'PageDown': step(+1); break;
    case 'ArrowLeft':  case 'PageUp':  step(-1); break;
    case 'Home': goTo(0); break;
    case 'End':  goTo(screens.length - 1); break;
    case 'f': case 'F': {
      const p = getPrefs();
      toggleFocus(!p.focusMode);
      bindFocusContent();
      break;
    }
    case 's': case 'S': openSettings(); break;
    case 'm': case 'M': openDrawer(); break;
    case 'Escape': closeDrawer(); closeSettings(); break;
  }
});

// ================================================================
// SWIPE (touch)
// ================================================================
let _tx = 0, _ty = 0, _tt = 0;

shell.addEventListener('touchstart', e => {
  const t = e.changedTouches[0];
  _tx = t.clientX; _ty = t.clientY; _tt = Date.now();
}, { passive: true });

shell.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const dx = t.clientX - _tx;
  const dy = t.clientY - _ty;
  if (Date.now() - _tt < 700 && Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    step(dx < 0 ? +1 : -1);
  }
}, { passive: true });

// ================================================================
// INIT
// ================================================================
function init() {
  // 1. Load & apply preferences
  loadPrefs();
  applyPrefs();

  // 2. Build navigation
  buildSidebar(D);
  buildDrawer(D);

  // 3. Build settings panel
  buildSettingsPanel();

  // 4. Set initial view mode label
  viewModeLabel.textContent = appState.viewMode === 'text' ? 'Original' : 'Texto';

  // 5. Init highlights
  initHighlights();

  // 6. Initial render
  render();
}

init();
