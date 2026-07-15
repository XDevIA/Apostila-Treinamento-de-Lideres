/**
 * renderer.js — renders each screen type into #pageShell
 */

const WPM = 250;

// ---- Utility: HTML escape ----
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ---- Estimate reading time from blocks ----
export function estimateReadingTime(blocks = []) {
  const words = blocks.reduce((acc, b) => {
    const t = b.type === 'list' ? (b.items ?? []).join(' ') : (b.text ?? '');
    return acc + t.split(/\s+/).filter(Boolean).length;
  }, 0);
  const mins = Math.ceil(words / WPM);
  return mins <= 1 ? '~1 min de leitura' : `~${mins} min de leitura`;
}

// ---- Render content blocks to HTML ----
export function blocksToHtml(blocks = []) {
  return blocks.map(b => {
    if (b.type === 'h')    return `<h2>${esc(b.text)}</h2>`;
    if (b.type === 'list') return `<ul>${(b.items ?? []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
    return `<p>${esc(b.text)}</p>`;
  }).join('');
}

// ---- COVER ----
export function renderCover(D) {
  const coverImg = D.cover ?? D.lessons?.[0]?.pages?.[0]?.image ?? '';
  return `<div class="cover-page">
    <div class="cover-card">
      <div class="cover-img-wrap">
        <img src="${coverImg}" alt="Capa do Treinamento de Líderes" loading="eager">
      </div>
      <div class="cover-glass">
        <div class="cover-eyebrow">Apostila Digital</div>
        <div class="cover-title">Treinamento de Líderes</div>
        <div class="cover-pills">
          <span class="cover-pill">📖 ${D.totalLessons ?? D.lessons?.length} estudos</span>
          <span class="cover-pill">📄 ${D.totalPages} páginas</span>
          <span class="cover-pill">✦ Leitura premium</span>
        </div>
        <button class="cover-cta" id="coverStartBtn">Abrir Sumário →</button>
      </div>
    </div>
  </div>`;
}

// ---- TABLE OF CONTENTS ----
export function renderToc(D, query = '') {
  const q = query.trim().toLocaleLowerCase('pt-BR');

  let html = `<div class="toc-page">
    <div class="text-xs font-extrabold uppercase tracking-widest mb-1"
         style="color:var(--color-accent);letter-spacing:.12em">Treinamento de Líderes</div>
    <h1>Sumário</h1>
    <p style="color:var(--color-muted);font-size:.88rem;margin:.25rem 0 1.2rem;line-height:1.55">
      Toque em uma lição para ir direto ao estudo.
    </p>
    <div class="toc-search-wrap">
      <svg class="toc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input id="tocSearch" class="toc-search" value="${esc(query)}"
             placeholder="Buscar uma lição..." autocomplete="off" spellcheck="false">
    </div>`;

  for (const sec of D.sections) {
    const lessons = D.lessons.filter(l =>
      l.section === sec && (!q || l.title.toLocaleLowerCase('pt-BR').includes(q))
    );
    if (!lessons.length) continue;

    html += `<div class="toc-section-group">
      <div class="toc-section-label">${esc(sec)}</div>`;

    for (const l of lessons) {
      const pageRange = l.startPage === l.endPage
        ? `p. ${l.startPage}`
        : `p. ${l.startPage}–${l.endPage}`;
      html += `<button class="toc-item" data-screen="${l.startPage + 1}">
        <span class="toc-num">${String(l.number).padStart(2, '0')}</span>
        <span class="toc-label">
          <span class="toc-title">${esc(l.title)}</span>
          ${l.subtitle ? `<span class="toc-subtitle">${esc(l.subtitle)}</span>` : ''}
        </span>
        <span class="toc-pages">${pageRange}</span>
      </button>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ---- LESSON PAGE ----
export function renderLessonPage(screenItem, totalPages, viewMode = 'text') {
  const { lesson: l, page: p } = screenItem;

  if (viewMode === 'original') {
    return `<div class="original-view">
      <img src="${p.image}" alt="Página original ${p.globalPage}" loading="lazy">
      <div class="original-note">Modo original. Toque em "Texto" para voltar à leitura.</div>
    </div>`;
  }

  const localStr = `${p.localPage}/${l.pages.length}`;
  const readTime = p.localPage === 1 ? estimateReadingTime(p.blocks) : null;

  return `<article class="lesson" data-lesson="${l.number}" data-page="${p.globalPage}">
    <header class="lesson-head">
      <div class="lesson-meta">
        <span class="pill pill-accent">Lição ${String(l.number).padStart(2, '0')}</span>
        <span class="pill">${esc(l.section)}</span>
        <span class="pill">Parte ${localStr}</span>
      </div>
      <h1>${esc(l.title)}</h1>
      ${l.subtitle && p.localPage === 1
        ? `<div class="lesson-subtitle">${esc(l.subtitle)}</div>`
        : ''}
      ${readTime
        ? `<div class="reading-time-tag">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
               <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
             </svg>
             ${readTime}
           </div>`
        : ''}
    </header>
    <div class="lesson-content">${blocksToHtml(p.blocks)}</div>
    <footer class="page-foot">
      <span>Treinamento de Líderes</span>
      <span class="page-num">Página ${p.globalPage} de ${totalPages}</span>
    </footer>
  </article>`;
}
