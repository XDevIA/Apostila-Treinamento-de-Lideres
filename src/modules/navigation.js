/**
 * navigation.js — sidebar + drawer NAV items: build and sync active state
 */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ---- Build sidebar (desktop) ----
export function buildSidebar(D) {
  const el = document.getElementById('sidebarBody');
  if (!el) return;

  let h = '';

  h += _sidebarItem(0, '⌂', 'Capa');
  h += _sidebarItem(1, '☷', 'Sumário');

  for (const sec of D.sections) {
    h += `<div class="sidebar-section-label">${esc(sec)}</div>`;
    D.lessons
      .filter(l => l.section === sec)
      .forEach(l => {
        h += _sidebarItem(l.startPage + 1, String(l.number).padStart(2, '0'), l.title);
      });
  }

  el.innerHTML = h;
}

function _sidebarItem(screen, num, label) {
  return `<button class="sidebar-item" data-screen="${screen}">
    <span class="sidebar-num">${esc(num)}</span>
    <span>${esc(label)}</span>
  </button>`;
}

// ---- Build drawer (mobile) ----
export function buildDrawer(D) {
  const el = document.getElementById('drawerBody');
  if (!el) return;

  let h = '';

  h += _drawerItem(0, '⌂', 'Capa');
  h += _drawerItem(1, '☷', 'Sumário');

  for (const sec of D.sections) {
    h += `<div class="drawer-section-label">${esc(sec)}</div>`;
    D.lessons
      .filter(l => l.section === sec)
      .forEach(l => {
        h += _drawerItem(l.startPage + 1, String(l.number).padStart(2, '0'), l.title);
      });
  }

  el.innerHTML = h;
}

function _drawerItem(screen, num, label) {
  return `<button class="drawer-item" data-screen="${screen}">
    <span class="drawer-item-num">${esc(num)}</span>
    <span>${esc(label)}</span>
  </button>`;
}

// ---- Update active state ----
export function syncActiveNav(currentScreen, screens) {
  const s = screens[currentScreen];

  // Resolve which lesson is active (first screen of lesson)
  let activeLessonStart = -1;
  if (s?.type === 'page' && s.lesson) {
    activeLessonStart = s.lesson.startPage + 1;
  }

  _updateItems('.sidebar-item', currentScreen, activeLessonStart);
  _updateItems('.drawer-item', currentScreen, activeLessonStart);
}

function _updateItems(selector, currentScreen, activeLessonStart) {
  document.querySelectorAll(selector).forEach(btn => {
    const t = Number(btn.dataset.screen);
    let active = false;

    if (currentScreen === 0 && t === 0) active = true;
    else if (currentScreen === 1 && t === 1) active = true;
    else if (activeLessonStart >= 2 && t === activeLessonStart) active = true;

    btn.classList.toggle('active', active);
  });
}

// ---- Sidebar progress ----
export function updateSidebarProgress(pct) {
  const fill  = document.getElementById('sidebarFill');
  const label = document.getElementById('sidebarLabel');
  if (fill)  fill.style.width = (pct * 100).toFixed(1) + '%';
  if (label) label.textContent = Math.round(pct * 100) + '%';
}
