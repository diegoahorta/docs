// Leitor de PDF e DOCX com destaques, notas, marcadores, trechos e busca
import { db } from './db.js';
import { $, h, uid, esc, toast, debounce, copyText, shareText, saveBlob, openModal, prompt, confirmDialog, actionMenu,
  truncate, normalize, fmtDateTime, bridge, COLORS, COLOR_NAMES } from './util.js';
import { loadPdf, getFileBuffer, docxToHtml, extractPdfText, emitDocsChanged } from './docs.js';
import { addToStudy, createStudyFromDoc } from './study.js';
import { addToMap, createMapFromDoc } from './mindmap.js';

const pdfjsLib = window.pdfjsLib;
let R = null; // estado do leitor atual
const el = () => $('#reader');

export const isReaderOpen = () => !!R;

// ============================================================
// Abrir / fechar
// ============================================================
export async function openReader(docId, opts = {}) {
  if (R) await closeReader();
  const doc = await db.get('docs', docId);
  if (!doc) { toast('Documento não encontrado'); return; }
  doc.openedAt = Date.now();
  await db.put('docs', doc);

  const rtheme = (await db.setting('readerTheme')) || 'light';
  R = { doc, anns: [], gen: 0, zoom: doc.zoom || 1, fontScale: doc.fontScale || 1, pending: null, searchTerm: opts.search || '' };
  const root = el();
  root.innerHTML = '';
  root.dataset.rtheme = rtheme;
  root.classList.remove('hidden', 'immersive');

  const pageInd = h('span.page-ind', { on: { click: goToPageDialog } }, '…');
  const range = h('input', { type: 'range', min: 0, max: 100, value: 0 });
  const top = h('div.reader-top',
    h('button.icon-btn', { title: 'Voltar', on: { click: () => closeReader() } }, '←'),
    h('div.title.ellipsis', doc.name),
    h('button.icon-btn', { title: 'Buscar no documento', on: { click: searchDialog } }, '🔍'),
    h('button.icon-btn#bmBtn', { title: 'Marcador', on: { click: toggleBookmark } }, '🔖'),
    h('button.icon-btn', { title: 'Anotações', on: { click: () => openDrawer() } }, '☰'),
    h('button.icon-btn', { title: 'Mais', on: { click: readerMenu } }, '⋮'));
  const body = h('div.reader-body', h('div.spinner'));
  const minus = h('button.icon-btn', { title: doc.type === 'pdf' ? 'Diminuir zoom' : 'Diminuir fonte', on: { click: () => doc.type === 'pdf' ? setZoom(R.zoom / 1.2) : setFont(R.fontScale - 0.1) } }, doc.type === 'pdf' ? '－' : 'A−');
  const plus = h('button.icon-btn', { title: doc.type === 'pdf' ? 'Aumentar zoom' : 'Aumentar fonte', on: { click: () => doc.type === 'pdf' ? setZoom(R.zoom * 1.2) : setFont(R.fontScale + 0.1) } }, doc.type === 'pdf' ? '＋' : 'A+');
  const bottom = h('div.reader-bottom', minus, pageInd, range, plus);
  const selBar = buildSelBar();
  root.append(top, body, bottom, selBar);
  Object.assign(R, { root, body, pageInd, range, selBar });

  R.anns = await db.byDoc('annotations', doc.id);

  body.addEventListener('pointerdown', () => { const s = getSelection(); R && (R.hadSel = s && !s.isCollapsed); });
  body.addEventListener('click', onBodyClick);

  try {
    if (doc.type === 'pdf') await setupPdf(opts);
    else await setupDocx(opts);
  } catch (e) {
    console.error(e);
    body.innerHTML = '';
    body.append(h('div.empty', h('span.big', '⚠️'), 'Não foi possível abrir o documento.', h('br'), h('small', String(e.message || e))));
  }
  updateBookmarkBtn();
  if (bridge) bridge.keepScreenOn(!!(await db.setting('keepScreenOn')));
}

export async function closeReader() {
  if (!R) return;
  const r = R;
  saveProgress.flush?.();
  await saveProgressNow();
  R = null;
  r.io?.disconnect(); r.io2?.disconnect();
  window.removeEventListener('resize', r.onResize);
  try { r.pdf?.destroy(); } catch (e) { }
  el().classList.add('hidden');
  el().innerHTML = '';
  if (bridge) { bridge.setImmersive(false); bridge.keepScreenOn(false); }
  emitDocsChanged();
}

/** Botão "voltar" do Android */
export function readerBack() {
  if (!R) return false;
  if (R.drawer) { closeDrawer(); return true; }
  if (R.selBar.classList.contains('show')) { getSelection().removeAllRanges(); hideSelBar(); return true; }
  if (R.root.classList.contains('immersive')) { setImmersive(false); return true; }
  closeReader();
  return true;
}

// ============================================================
// PDF
// ============================================================
async function setupPdf(opts) {
  const buf = await getFileBuffer(R.doc.id);
  const pdf = await loadPdf(buf);
  if (!R) { pdf.destroy(); return; }
  R.pdf = pdf;
  R.numPages = pdf.numPages;

  // tamanhos das páginas (pré-carrega se o documento não for enorme)
  const p1 = await pdf.getPage(1);
  const v1 = p1.getViewport({ scale: 1 });
  R.sizes = Array.from({ length: R.numPages }, () => ({ w: v1.width, h: v1.height }));
  if (R.numPages <= 400) {
    for (let i = 2; i <= R.numPages; i += 25) {
      const batch = [];
      for (let j = i; j < Math.min(i + 25, R.numPages + 1); j++) batch.push(pdf.getPage(j).then(p => { const v = p.getViewport({ scale: 1 }); R && (R.sizes[j - 1] = { w: v.width, h: v.height }); }));
      await Promise.all(batch);
      if (!R) return;
    }
  }

  R.body.innerHTML = '';
  R.pagesWrap = h('div.pdf-pages');
  R.body.append(R.pagesWrap);
  R.pageEls = [];
  for (let i = 0; i < R.numPages; i++) {
    const pg = h('div.pdf-page', { 'data-i': i }, h('span.pnum', String(i + 1)));
    pg._i = i;
    R.pageEls.push(pg);
    R.pagesWrap.append(pg);
  }
  layoutPdf();

  R.range.max = R.numPages;
  R.range.min = 1;
  R.range.addEventListener('input', () => { R.pageInd.textContent = `${R.range.value} / ${R.numPages}`; });
  R.range.addEventListener('change', () => goToPage(+R.range.value));

  R.io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) renderPage(e.target._i);
  }, { root: R.body, rootMargin: '120% 0px' });
  R.io2 = new IntersectionObserver(entries => {
    for (const e of entries) if (!e.isIntersecting) unrenderPage(e.target._i);
  }, { root: R.body, rootMargin: '400% 0px' });
  R.pageEls.forEach(p => { R.io.observe(p); R.io2.observe(p); });

  R.body.addEventListener('scroll', onPdfScroll, { passive: true });
  setupPinch();
  R.onResize = debounce(() => { if (R?.pdf) { const p = R.curPage; layoutPdf(); goToPage(p, false); } }, 250);
  window.addEventListener('resize', R.onResize);

  const startPage = opts.page || R.doc.lastPos?.page || 1;
  goToPage(startPage, false);
  onPdfScroll();
}

function pageScale(i) {
  const avail = Math.max(200, R.body.clientWidth - 16);
  return (avail / R.sizes[i].w) * R.zoom;
}

function layoutPdf() {
  R.gen++;
  R.pageEls.forEach((pg, i) => {
    const s = pageScale(i);
    pg.style.width = Math.floor(R.sizes[i].w * s) + 'px';
    pg.style.height = Math.floor(R.sizes[i].h * s) + 'px';
    pg.style.setProperty('--scale-factor', s);
    if (pg._rendered || pg._rendering) unrenderPage(i);
  });
  computeTops();
  // re-renderiza as visíveis
  requestAnimationFrame(() => {
    if (!R?.pageEls) return;
    const st = R.body.scrollTop, bh = R.body.clientHeight;
    R.pageEls.forEach((pg, i) => { if (R.tops[i] < st + bh * 2.2 && R.tops[i] + pg.offsetHeight > st - bh) renderPage(i); });
  });
}

function computeTops() { R.tops = R.pageEls.map(p => p.offsetTop); }

function unrenderPage(i) {
  const pg = R.pageEls[i];
  if (!pg) return;
  pg._rendered = false; pg._rendering = false;
  pg._task?.cancel?.();
  pg.querySelectorAll('canvas,.textLayer,.hl-layer').forEach(e => { if (e.tagName === 'CANVAS') { e.width = 0; e.height = 0; } e.remove(); });
}

async function renderPage(i) {
  const pg = R?.pageEls?.[i];
  if (!pg || pg._rendered || pg._rendering) return;
  pg._rendering = true;
  const gen = R.gen;
  try {
    const page = await R.pdf.getPage(i + 1);
    if (!R || gen !== R.gen || !pg._rendering) return;
    const v1 = page.getViewport({ scale: 1 });
    if (Math.abs(v1.width - R.sizes[i].w) > 1 || Math.abs(v1.height - R.sizes[i].h) > 1) {
      R.sizes[i] = { w: v1.width, h: v1.height };
      const s0 = pageScale(i);
      pg.style.width = Math.floor(v1.width * s0) + 'px';
      pg.style.height = Math.floor(v1.height * s0) + 'px';
      pg.style.setProperty('--scale-factor', s0);
      computeTops();
    }
    const scale = pageScale(i);
    const vp = page.getViewport({ scale });
    let dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const maxPx = 12e6;
    if (vp.width * vp.height * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (vp.width * vp.height));
    const canvas = h('canvas');
    canvas.width = Math.floor(vp.width * dpr);
    canvas.height = Math.floor(vp.height * dpr);
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const task = page.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
    pg._task = task;
    await task.promise;
    if (!R || gen !== R.gen || !pg._rendering) { canvas.width = 0; return; }
    pg.querySelector('.pnum')?.remove();
    pg.prepend(canvas);

    const hl = h('div.hl-layer');
    pg.append(hl);
    const textDiv = h('div.textLayer');
    pg.append(textDiv);
    pg._rendered = true; pg._rendering = false;
    drawPdfHighlights(i);

    const tc = await page.getTextContent();
    if (!R || gen !== R.gen || !pg._rendered) return;
    const tl = pdfjsLib.renderTextLayer({ textContentSource: tc, container: textDiv, viewport: vp, textDivs: [] });
    await tl.promise;
    const eoc = h('div.endOfContent');
    textDiv.append(eoc);
    textDiv.addEventListener('pointerdown', () => eoc.classList.add('active'));
    textDiv.addEventListener('pointerup', () => eoc.classList.remove('active'));
    markSearchInTextLayer(textDiv);
  } catch (e) {
    if (e?.name !== 'RenderingCancelledException') console.warn('render', i, e);
    pg._rendering = false;
  }
}

function markSearchInTextLayer(textDiv) {
  if (!R.searchTerm) return;
  const q = normalize(R.searchTerm);
  textDiv.querySelectorAll('span').forEach(s => {
    if (normalize(s.textContent).includes(q)) s.style.background = 'rgba(255,150,0,.45)';
  });
}

function drawPdfHighlights(i) {
  const pg = R.pageEls[i];
  const layer = pg?.querySelector('.hl-layer');
  if (!layer) return;
  layer.innerHTML = '';
  for (const a of R.anns) {
    if (a.kind !== 'highlight') continue;
    for (const area of a.areas || []) {
      if (area.page !== i + 1) continue;
      area.rects.forEach(([x, y, w, hh], k) => {
        layer.append(h('div.hl.' + (a.color || 'yellow'), { 'data-id': a.id, style: { left: x * 100 + '%', top: y * 100 + '%', width: w * 100 + '%', height: hh * 100 + '%' } }));
        if (k === 0 && a.note && area === a.areas[0]) {
          layer.append(h('span.note-pin', { style: { left: (x + w) * 100 + '%', top: y * 100 + '%' } }, '📝'));
        }
      });
    }
  }
}

function refreshHighlights() {
  if (R.doc.type === 'pdf') R.pageEls.forEach((p, i) => p._rendered && drawPdfHighlights(i));
  else applyDocxHighlights();
}

function onPdfScroll() {
  if (!R?.tops) return;
  const y = R.body.scrollTop + R.body.clientHeight * 0.35;
  let lo = 0, hi = R.tops.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (R.tops[mid] <= y) lo = mid; else hi = mid - 1; }
  const p = lo + 1;
  if (p !== R.curPage) {
    R.curPage = p;
    R.pageInd.textContent = `${p} / ${R.numPages}`;
    R.range.value = p;
    updateBookmarkBtn();
  }
  saveProgress();
}

function goToPage(p, smooth = false) {
  if (!R?.pageEls) return;
  p = Math.max(1, Math.min(R.numPages, p | 0));
  computeTops();
  R.body.scrollTo({ top: R.tops[p - 1] - 8, behavior: smooth ? 'smooth' : 'auto' });
  R.curPage = null;
  onPdfScroll();
}

function setZoom(z) {
  if (R.doc.type !== 'pdf') return;
  z = Math.max(0.5, Math.min(5, z));
  const page = R.curPage || 1;
  const i = page - 1;
  const frac = R.tops ? (R.body.scrollTop - R.tops[i]) / (R.pageEls[i].offsetHeight || 1) : 0;
  const cx = R.body.scrollLeft + R.body.clientWidth / 2, ratioX = cx / (R.pagesWrap.scrollWidth || 1);
  R.zoom = z;
  R.doc.zoom = z;
  layoutPdf();
  R.body.scrollTop = R.tops[i] + frac * R.pageEls[i].offsetHeight;
  R.body.scrollLeft = ratioX * R.pagesWrap.scrollWidth - R.body.clientWidth / 2;
  toast(`Zoom ${Math.round(z * 100)}%`);
  saveProgress();
}

function setupPinch() {
  let start = null;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  R.body.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      const rect = R.body.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left + R.body.scrollLeft;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top + R.body.scrollTop;
      start = { d: dist(e.touches), cx, cy, ratio: 1 };
      R.pagesWrap.style.transformOrigin = `${cx}px ${cy}px`;
    }
  }, { passive: true });
  R.body.addEventListener('touchmove', e => {
    if (start && e.touches.length === 2) {
      e.preventDefault();
      start.ratio = Math.max(0.4, Math.min(4, dist(e.touches) / start.d));
      R.pagesWrap.style.transform = `scale(${start.ratio})`;
    }
  }, { passive: false });
  const end = () => {
    if (!start) return;
    const ratio = start.ratio;
    start = null;
    R.pagesWrap.style.transform = '';
    if (Math.abs(ratio - 1) > 0.05) setZoom(R.zoom * ratio);
  };
  R.body.addEventListener('touchend', e => { if (e.touches.length < 2) end(); });
  R.body.addEventListener('touchcancel', end);
}

// ============================================================
// DOCX
// ============================================================
async function setupDocx(opts) {
  const t = await db.get('texts', R.doc.id);
  let html = t?.html;
  if (!html) {
    html = await docxToHtml(await getFileBuffer(R.doc.id));
    await db.put('texts', { ...(t || {}), id: R.doc.id, html });
  }
  if (!R) return;
  R.body.innerHTML = '';
  R.content = h('div.docx-content', { html });
  R.content.style.setProperty('--fs', R.fontScale);
  R.body.append(h('div.docx-wrap', R.content));
  applyDocxHighlights();

  R.range.min = 0; R.range.max = 100;
  R.range.addEventListener('input', () => {
    const max = R.body.scrollHeight - R.body.clientHeight;
    R.body.scrollTop = (R.range.value / 100) * max;
  });
  R.body.addEventListener('scroll', onDocxScroll, { passive: true });
  await new Promise(r => requestAnimationFrame(r));
  if (opts.search) {
    R.searchTerm = opts.search;
    const hits = findDocxOccurrences(opts.search);
    if (hits.length) jumpToDocxOffset(hits[0].start, hits[0].end);
  } else if (R.doc.lastPos?.ratio) {
    R.body.scrollTop = R.doc.lastPos.ratio * (R.body.scrollHeight - R.body.clientHeight);
  }
  onDocxScroll();
}

function docxRatio() {
  const max = R.body.scrollHeight - R.body.clientHeight;
  return max > 0 ? Math.min(1, R.body.scrollTop / max) : 1;
}

function onDocxScroll() {
  if (!R?.content) return;
  const r = docxRatio();
  R.pageInd.textContent = Math.round(r * 100) + '%';
  R.range.value = Math.round(r * 100);
  updateBookmarkBtn();
  saveProgress();
}

function setFont(s) {
  R.fontScale = Math.max(0.7, Math.min(2.2, Math.round(s * 10) / 10));
  R.doc.fontScale = R.fontScale;
  const r = docxRatio();
  R.content.style.setProperty('--fs', R.fontScale);
  R.body.scrollTop = r * (R.body.scrollHeight - R.body.clientHeight);
  toast(`Fonte ${Math.round(R.fontScale * 100)}%`);
  saveProgress();
}

const SKIP_PARENTS = new Set(['TABLE', 'TBODY', 'THEAD', 'TR', 'UL', 'OL']);
/** Envolve o intervalo [start,end) de caracteres (no texto de root) com elementos criados por make(). */
function wrapOffsets(root, start, end, make) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let pos = 0, node;
  const targets = [];
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (pos + len > start && pos < end) targets.push([node, Math.max(0, start - pos), Math.min(len, end - pos)]);
    pos += len;
    if (pos >= end) break;
  }
  const marks = [];
  for (const [n, s, e] of targets) {
    if (SKIP_PARENTS.has(n.parentNode.nodeName)) continue;
    let t = n;
    if (s > 0) t = t.splitText(s);
    if (e - s < t.nodeValue.length) t.splitText(e - s);
    const m = make();
    t.parentNode.insertBefore(m, t);
    m.appendChild(t);
    marks.push(m);
  }
  return marks;
}

function unwrap(selector) {
  R.content.querySelectorAll(selector).forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); m.remove(); });
  R.content.normalize();
}

function applyDocxHighlights() {
  if (!R.content) return;
  unwrap('mark.hl');
  const hls = R.anns.filter(a => a.kind === 'highlight' && a.start != null).sort((a, b) => a.start - b.start);
  for (const a of hls) {
    wrapOffsets(R.content, a.start, a.end, () => h('mark.hl.' + (a.color || 'yellow') + (a.note ? '.has-note' : ''), { 'data-id': a.id }));
    // indicador de nota apenas no último fragmento
    const ms = R.content.querySelectorAll(`mark[data-id="${a.id}"]`);
    ms.forEach((m, k) => { if (k < ms.length - 1) m.classList.remove('has-note'); });
  }
}

function rangeOffsets(range) {
  const pre = document.createRange();
  pre.selectNodeContents(R.content);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  return { start, end: start + range.toString().length };
}

function findDocxOccurrences(q) {
  const text = R.content.textContent;
  const n = normalize(text), nq = normalize(q);
  const out = [];
  if (!nq) return out;
  let i = n.indexOf(nq);
  while (i >= 0 && out.length < 500) { out.push({ start: i, end: i + nq.length, text }); i = n.indexOf(nq, i + nq.length); }
  return out;
}

function jumpToDocxOffset(start, end, cls = 'search-hit') {
  unwrap('mark.search-hit');
  const marks = wrapOffsets(R.content, start, end, () => h('mark.' + cls));
  const target = marks[0];
  if (target) {
    const top = target.getBoundingClientRect().top - R.body.getBoundingClientRect().top + R.body.scrollTop - R.body.clientHeight / 3;
    R.body.scrollTo({ top, behavior: 'auto' });
  }
  if (cls !== 'search-hit') setTimeout(() => R && unwrap('mark.' + cls), 2000);
  return marks;
}

// ============================================================
// Seleção de texto -> barra de ações
// ============================================================
function buildSelBar() {
  const keep = e => e.preventDefault(); // mantém a seleção ao tocar
  const colors = h('div.colors', ...COLORS.map(c => h('button.c-' + c, { title: COLOR_NAMES[c], on: { mousedown: keep, click: () => actHighlight(c) } })));
  const act = (icon, label, fn) => h('button', { on: { mousedown: keep, click: fn } }, h('span', icon), label);
  return h('div.sel-bar', colors, h('div.acts',
    act('📝', 'Nota', actNote),
    act('📋', 'Copiar', actCopy),
    act('✂️', 'Trecho', actExcerpt),
    act('🎓', 'Estudo', actStudy),
    act('🧠', 'Mapa', actMap)));
}

document.addEventListener('selectionchange', debounce(onSelectionChange, 180));

function onSelectionChange() {
  if (!R || R.drawer) return;
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) { hideSelBar(); return; }
  const range = sel.getRangeAt(0);
  if (!R.body.contains(range.commonAncestorContainer)) { hideSelBar(); return; }
  const text = sel.toString().replace(/\s+\n/g, '\n').trim();
  if (!text) { hideSelBar(); return; }
  const info = R.doc.type === 'pdf' ? pdfSelectionInfo(range) : docxSelectionInfo(range);
  if (!info) { hideSelBar(); return; }
  info.text = text;
  R.pending = info;
  R.selBar.classList.add('show');
}

function hideSelBar() { if (R) { R.selBar.classList.remove('show'); } }

function pdfSelectionInfo(range) {
  const startEl = (range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement)?.closest('.pdf-page');
  if (!startEl) return null;
  const rects = [...range.getClientRects()].filter(r => r.width > 1 && r.height > 1);
  const byPage = new Map();
  for (const pg of R.pageEls) {
    if (!pg._rendered) continue;
    const pr = pg.getBoundingClientRect();
    for (const r of rects) {
      const cy = r.top + r.height / 2, cx = r.left + r.width / 2;
      if (cy < pr.top || cy > pr.bottom || cx < pr.left || cx > pr.right) continue;
      if (r.height > pr.height * 0.08) continue; // ignora retângulos de bloco
      const list = byPage.get(pg._i) || [];
      list.push([(r.left - pr.left) / pr.width, (r.top - pr.top) / pr.height, r.width / pr.width, r.height / pr.height]);
      byPage.set(pg._i, list);
    }
  }
  if (!byPage.size) return null;
  const areas = [...byPage.entries()].sort((a, b) => a[0] - b[0]).map(([i, rs]) => ({ page: i + 1, rects: mergeRects(rs) }));
  return { page: areas[0].page, areas };
}

function mergeRects(rs) {
  rs.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const out = [];
  for (const r of rs) {
    const last = out[out.length - 1];
    if (last && Math.abs(last[1] - r[1]) < last[3] * 0.5 && Math.abs(last[3] - r[3]) < last[3] * 0.6 && r[0] <= last[0] + last[2] + 0.02) {
      const x1 = Math.min(last[0], r[0]), x2 = Math.max(last[0] + last[2], r[0] + r[2]);
      const y1 = Math.min(last[1], r[1]), y2 = Math.max(last[1] + last[3], r[1] + r[3]);
      out[out.length - 1] = [x1, y1, x2 - x1, y2 - y1];
    } else out.push(r.slice());
  }
  return out.map(r => r.map(v => Math.round(v * 10000) / 10000));
}

function docxSelectionInfo(range) {
  if (!R.content.contains(range.commonAncestorContainer)) return null;
  const { start, end } = rangeOffsets(range);
  if (end <= start) return null;
  return { start, end, ratio: docxRatio() };
}

function takePending() {
  const p = R.pending;
  getSelection().removeAllRanges();
  hideSelBar();
  R.pending = null;
  return p;
}

function sourceOf(p) {
  return { docId: R.doc.id, docName: R.doc.name, docType: R.doc.type, page: p.page || null, start: p.start ?? null, end: p.end ?? null };
}

async function createHighlight(p, color, note = '') {
  const a = {
    id: uid(), docId: R.doc.id, kind: 'highlight', color, text: p.text, note, createdAt: Date.now(), updatedAt: Date.now(),
    page: p.page || null, areas: p.areas || null, start: p.start ?? null, end: p.end ?? null, ratio: p.ratio ?? null,
  };
  await db.put('annotations', a);
  R.anns.push(a);
  refreshHighlights();
  return a;
}

async function actHighlight(color) {
  const p = takePending(); if (!p) return;
  await createHighlight(p, color);
  toast('Destaque criado');
}

async function actNote() {
  const p = takePending(); if (!p) return;
  const note = await prompt('Nota no trecho', { multiline: true, placeholder: 'Escreva sua anotação…', label: '“' + truncate(p.text, 140) + '”' });
  if (note == null) return;
  await createHighlight(p, 'yellow', note.trim());
  toast('Nota adicionada');
}

async function actCopy() {
  const p = takePending(); if (!p) return;
  await copyText(p.text);
  toast('Trecho copiado');
}

async function actExcerpt() {
  const p = takePending(); if (!p) return;
  await saveExcerpt(p.text, sourceOf(p));
}

export async function saveExcerpt(text, source, note = '') {
  await db.put('excerpts', { id: uid(), text, note, ...source, createdAt: Date.now(), tags: [] });
  toast('Salvo em Trechos ✂️');
}

async function actStudy() {
  const p = takePending(); if (!p) return;
  await addToStudy({ type: 'excerpt', text: p.text, source: sourceOf(p) });
}

async function actMap() {
  const p = takePending(); if (!p) return;
  await addToMap(p.text, sourceOf(p));
}

// ============================================================
// Toques no conteúdo: destaque existente ou modo imersivo
// ============================================================
function onBodyClick(e) {
  if (!R || R.hadSel) return;
  const sel = getSelection();
  if (sel && !sel.isCollapsed) return;
  let ann = null;
  if (R.doc.type === 'docx') {
    const m = e.target.closest('mark.hl');
    if (m) ann = R.anns.find(a => a.id === m.dataset.id);
  } else {
    const pg = e.target.closest('.pdf-page');
    if (pg) {
      const pr = pg.getBoundingClientRect();
      const x = (e.clientX - pr.left) / pr.width, y = (e.clientY - pr.top) / pr.height;
      ann = R.anns.find(a => a.kind === 'highlight' && (a.areas || []).some(ar => ar.page === pg._i + 1 &&
        ar.rects.some(([rx, ry, rw, rh]) => x >= rx - 0.005 && x <= rx + rw + 0.005 && y >= ry - 0.004 && y <= ry + rh + 0.004)));
    }
  }
  if (ann) { annPopover(ann); return; }
  if (e.target.closest('a,button,input')) return;
  setImmersive(!R.root.classList.contains('immersive'));
}

function setImmersive(on) {
  R.root.classList.toggle('immersive', on);
  if (bridge) bridge.setImmersive(on);
}

function annPopover(a) {
  openModal((box, m) => {
    box.append(
      h('div.row', h('span.dot.c-' + (a.color || 'yellow')), h('b.grow', a.page ? `Página ${a.page}` : 'Destaque'), h('span.small.muted', fmtDateTime(a.createdAt))),
      h('div.quote', { style: { margin: '10px 0' } }, a.text),
      a.note ? h('div.ann-item', { style: { cursor: 'default' } }, h('div.meta', '📝 Nota'), h('div', { style: { whiteSpace: 'pre-wrap' } }, a.note)) : null,
      h('div.color-row', { style: { margin: '10px 0' } }, ...COLORS.map(c => h('button.c-' + c + (a.color === c ? '.sel' : ''), {
        title: COLOR_NAMES[c], on: { click: async () => { a.color = c; a.updatedAt = Date.now(); await db.put('annotations', a); refreshHighlights(); m.close(); } },
      }))),
    );
    const list = h('div.menu-list');
    const item = (ic, label, fn, danger) => list.append(h(danger ? 'button.danger' : 'button', { on: { click: () => { m.close(); fn(); } } }, h('span.ic', ic), label));
    item('📝', a.note ? 'Editar nota' : 'Adicionar nota', () => editNote(a));
    item('📋', 'Copiar', async () => { await copyText(a.text); toast('Copiado'); });
    item('✂️', 'Salvar em Trechos', () => saveExcerpt(a.text, { ...sourceOf(a) }, a.note || ''));
    item('🎓', 'Adicionar a um estudo', () => addToStudy({ type: 'excerpt', text: a.text, note: a.note, source: sourceOf(a) }));
    item('🧠', 'Adicionar a um mapa mental', () => addToMap(a.text, sourceOf(a)));
    item('📤', 'Compartilhar', () => shareText(R.doc.name, `“${a.text}”${a.note ? '\n\nNota: ' + a.note : ''}\n— ${R.doc.name}${a.page ? ', p. ' + a.page : ''}`));
    item('🗑️', 'Excluir destaque', () => deleteAnn(a), true);
    box.append(list);
  });
}

async function editNote(a) {
  const note = await prompt(a.note ? 'Editar nota' : 'Adicionar nota', { value: a.note || '', multiline: true, label: '“' + truncate(a.text, 140) + '”' });
  if (note == null) return;
  a.note = note.trim();
  a.updatedAt = Date.now();
  await db.put('annotations', a);
  refreshHighlights();
  if (R.drawer) renderDrawer();
}

async function deleteAnn(a) {
  await db.del('annotations', a.id);
  R.anns = R.anns.filter(x => x.id !== a.id);
  refreshHighlights();
  updateBookmarkBtn();
  if (R.drawer) renderDrawer();
  toast('Excluído');
}

// ============================================================
// Marcadores
// ============================================================
function currentBookmark() {
  if (R.doc.type === 'pdf') return R.anns.find(a => a.kind === 'bookmark' && a.page === R.curPage);
  const r = docxRatio();
  return R.anns.find(a => a.kind === 'bookmark' && Math.abs(a.ratio - r) < 0.01);
}

function updateBookmarkBtn() {
  const b = R?.root.querySelector('#bmBtn');
  if (b) b.classList.toggle('on', !!currentBookmark());
}

function visibleDocxText() {
  const br = R.body.getBoundingClientRect();
  const els = R.content.querySelectorAll('p,h1,h2,h3,h4,li');
  for (const e of els) { const r = e.getBoundingClientRect(); if (r.bottom > br.top + 20 && e.textContent.trim()) return truncate(e.textContent, 90); }
  return '';
}

async function toggleBookmark() {
  const ex = currentBookmark();
  if (ex) { await deleteAnn(ex); toast('Marcador removido'); return; }
  const isPdf = R.doc.type === 'pdf';
  const def = isPdf ? `Página ${R.curPage}` : (visibleDocxText() || `Posição ${Math.round(docxRatio() * 100)}%`);
  const title = await prompt('Novo marcador', { value: def, okText: 'Adicionar' });
  if (title == null) return;
  const a = { id: uid(), docId: R.doc.id, kind: 'bookmark', title: title.trim() || def, createdAt: Date.now(),
    page: isPdf ? R.curPage : null, ratio: isPdf ? null : docxRatio() };
  await db.put('annotations', a);
  R.anns.push(a);
  updateBookmarkBtn();
  toast('Marcador adicionado 🔖');
}

function goToAnn(a) {
  closeDrawer();
  if (R.doc.type === 'pdf') {
    goToPage(a.page || 1);
    if (a.kind === 'highlight') {
      setTimeout(() => R?.root.querySelectorAll(`.hl[data-id="${a.id}"]`).forEach(x => { x.classList.add('flash'); setTimeout(() => x.classList.remove('flash'), 1600); }), 500);
      // centraliza o destaque
      const area = a.areas?.[0], pg = R.pageEls[(a.page || 1) - 1];
      if (area && pg) R.body.scrollTop = R.tops[pg._i] + area.rects[0][1] * pg.offsetHeight - R.body.clientHeight / 3;
    }
  } else if (a.kind === 'highlight' && a.start != null) {
    const m = R.content.querySelector(`mark.hl[data-id="${a.id}"]`);
    if (m) {
      const top = m.getBoundingClientRect().top - R.body.getBoundingClientRect().top + R.body.scrollTop - R.body.clientHeight / 3;
      R.body.scrollTo({ top });
      m.classList.add('flash'); setTimeout(() => m.classList.remove('flash'), 1600);
    }
  } else {
    R.body.scrollTop = (a.ratio || 0) * (R.body.scrollHeight - R.body.clientHeight);
  }
}

// ============================================================
// Gaveta: marcadores, destaques/notas, caderno do documento
// ============================================================
function openDrawer(tab = 'hl') {
  hideSelBar();
  R.drawerTab = tab;
  const back = h('div.drawer-back', { on: { click: closeDrawer } });
  const dr = h('div.drawer');
  R.drawer = { back, dr };
  document.body.append(back, dr);
  renderDrawer();
}

function closeDrawer() {
  if (!R?.drawer) return;
  if (R.notebookSave) R.notebookSave.flush?.();
  R.drawer.back.remove(); R.drawer.dr.remove();
  R.drawer = null;
}

async function renderDrawer() {
  const { dr } = R.drawer;
  dr.innerHTML = '';
  const tab = R.drawerTab;
  const bms = R.anns.filter(a => a.kind === 'bookmark').sort((a, b) => (a.page ?? a.ratio) - (b.page ?? b.ratio));
  const hls = R.anns.filter(a => a.kind === 'highlight').sort((a, b) => (a.page || 0) - (b.page || 0) || (a.start ?? 0) - (b.start ?? 0) || (a.areas?.[0]?.rects[0][1] ?? 0) - (b.areas?.[0]?.rects[0][1] ?? 0));
  const tabBtn = (key, label) => h('button' + (tab === key ? '.active' : ''), { on: { click: () => { R.drawerTab = key; renderDrawer(); } } }, label);
  dr.append(
    h('header', h('h2', 'Anotações'),
      h('button.icon-btn', { title: 'Exportar', on: { click: exportAnnotations } }, '📤'),
      h('button.icon-btn', { title: 'Fechar', on: { click: closeDrawer } }, '✕')),
    h('div.tabs', tabBtn('hl', `Destaques (${hls.length})`), tabBtn('bm', `Marcadores (${bms.length})`), tabBtn('nb', 'Caderno')));
  const content = h('div.content');
  dr.append(content);

  if (tab === 'bm') {
    if (!bms.length) content.append(h('div.empty', h('span.big', '🔖'), 'Nenhum marcador.', h('br'), 'Use o botão 🔖 no topo para marcar a posição atual.'));
    bms.forEach(a => content.append(h('div.ann-item', { on: { click: () => goToAnn(a) } },
      h('div.meta', '🔖 ', a.page ? `Página ${a.page}` : `${Math.round((a.ratio || 0) * 100)}%`, h('span.grow'), fmtDateTime(a.createdAt)),
      h('div.row', h('b.grow', a.title),
        h('button.icon-btn', { on: { click: async e => { e.stopPropagation(); const t = await prompt('Renomear marcador', { value: a.title }); if (t?.trim()) { a.title = t.trim(); await db.put('annotations', a); renderDrawer(); } } } }, '✏️'),
        h('button.icon-btn', { on: { click: e => { e.stopPropagation(); deleteAnn(a); } } }, '🗑️')))));
  } else if (tab === 'hl') {
    const filters = h('div.chips');
    const cur = R.hlFilter || 'all';
    const fchip = (k, label) => h('button.chip' + (cur === k ? '.active' : ''), { on: { click: () => { R.hlFilter = k; renderDrawer(); } } }, label);
    filters.append(fchip('all', 'Todos'), fchip('notes', '📝 Com nota'), ...COLORS.filter(c => hls.some(a => a.color === c)).map(c => fchip(c, COLOR_NAMES[c])));
    content.append(filters,
      h('div.row', { style: { marginBottom: '8px' } },
        h('button.btn.sm', { on: { click: () => { closeDrawer(); createMapFromDoc(R.doc.id); } } }, '🧠 Gerar mapa'),
        h('button.btn.sm', { on: { click: () => { closeDrawer(); createStudyFromDoc(R.doc.id); } } }, '🎓 Gerar estudo')));
    const list = hls.filter(a => cur === 'all' || (cur === 'notes' ? a.note : a.color === cur));
    if (!list.length) content.append(h('div.empty', h('span.big', '🖍️'), 'Nenhum destaque.', h('br'), 'Selecione um texto no documento para destacar, anotar ou copiar.'));
    list.forEach(a => content.append(h('div.ann-item.hl-' + (a.color || 'yellow'), { on: { click: () => goToAnn(a) } },
      h('div.meta', a.page ? `Página ${a.page}` : 'Destaque', h('span.grow'), fmtDateTime(a.createdAt),
        h('button.icon-btn', { style: { width: '30px', height: '30px', fontSize: '15px' }, on: { click: e => { e.stopPropagation(); annPopover(a); } } }, '⋮')),
      h('div', { style: { lineHeight: '1.4' } }, truncate(a.text, 400)),
      a.note ? h('div.note', '📝 ' + a.note) : null)));
  } else {
    const nb = (await db.get('settings', 'notebook:' + R.doc.id))?.value || '';
    const ta = h('textarea.notebook', { placeholder: 'Anotações livres sobre este documento (salvas automaticamente)…' }, nb);
    R.notebookSave = debounce(() => db.setting('notebook:' + R.doc.id, ta.value), 500);
    R.notebookSave.flush = () => db.setting('notebook:' + R.doc.id, ta.value);
    ta.addEventListener('input', R.notebookSave);
    content.append(ta, h('p.small.muted', 'O caderno também é incluído na exportação das anotações.'));
  }
}

async function annotationsMarkdown() {
  const d = R.doc;
  const nb = (await db.get('settings', 'notebook:' + d.id))?.value || '';
  let md = `# ${d.name}\n\n`;
  const bms = R.anns.filter(a => a.kind === 'bookmark');
  if (bms.length) { md += '## Marcadores\n\n'; bms.forEach(a => md += `- ${a.title}${a.page ? ` (p. ${a.page})` : ''}\n`); md += '\n'; }
  const hls = R.anns.filter(a => a.kind === 'highlight').sort((a, b) => (a.page || 0) - (b.page || 0) || (a.start ?? 0) - (b.start ?? 0));
  if (hls.length) {
    md += '## Destaques e notas\n\n';
    hls.forEach(a => { md += `> ${a.text.replace(/\n/g, '\n> ')}\n\n`; md += `— ${a.page ? 'p. ' + a.page + ' · ' : ''}${COLOR_NAMES[a.color] || ''}\n\n`; if (a.note) md += `**Nota:** ${a.note}\n\n`; });
  }
  if (nb.trim()) md += '## Caderno\n\n' + nb + '\n';
  return md;
}

async function exportAnnotations() {
  const md = await annotationsMarkdown();
  actionMenu('Exportar anotações', [
    { icon: '📋', label: 'Copiar (Markdown)', action: async () => { await copyText(md); toast('Copiado'); } },
    { icon: '📤', label: 'Compartilhar', action: () => shareText(R.doc.name, md) },
    { icon: '💾', label: 'Salvar arquivo .md', action: () => saveBlob(new Blob([md], { type: 'text/markdown' }), R.doc.name + ' - anotações.md') },
  ]);
}

// ============================================================
// Busca no documento
// ============================================================
async function searchDialog() {
  let pages = null;
  if (R.doc.type === 'pdf') {
    const t = await db.get('texts', R.doc.id);
    pages = t?.pages;
  }
  openModal((box, m) => {
    const input = h('input', { type: 'text', placeholder: 'Buscar no documento…', value: R.searchTerm || '', autofocus: true });
    const results = h('div', { style: { marginTop: '10px' } });
    const run = async () => {
      const q = input.value.trim();
      results.innerHTML = '';
      R.searchTerm = q;
      if (q.length < 2) return;
      if (R.doc.type === 'pdf') {
        if (!pages) {
          results.append(h('div.spinner'));
          pages = await extractPdfText(R.pdf);
          await db.put('texts', { id: R.doc.id, pages });
          results.innerHTML = '';
        }
        const nq = normalize(q);
        let total = 0;
        pages.forEach((txt, i) => {
          const n = normalize(txt);
          let idx = n.indexOf(nq), k = 0;
          while (idx >= 0 && total < 300) {
            if (k < 3) results.append(resultItem(`Página ${i + 1}`, txt, idx, q.length, () => { m.close(); goToPage(i + 1); refreshSearchMarks(); }));
            k++; total++;
            idx = n.indexOf(nq, idx + nq.length);
          }
        });
        results.prepend(h('p.small.muted', `${total} ocorrência(s)`));
      } else {
        const hits = findDocxOccurrences(q);
        results.append(h('p.small.muted', `${hits.length} ocorrência(s)`));
        hits.slice(0, 200).forEach((hit, k) => results.append(resultItem(`Ocorrência ${k + 1}`, hit.text, hit.start, hit.end - hit.start, () => { m.close(); jumpToDocxOffset(hit.start, hit.end); })));
      }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    input.addEventListener('input', debounce(run, 400));
    box.append(h('h3', 'Buscar'), h('div.search', h('span', '🔎'), input), results,
      h('div.actions', h('button.btn.ghost', { on: { click: () => { R.searchTerm = ''; refreshSearchMarks(); if (R.content) unwrap('mark.search-hit'); m.close(); } } }, 'Limpar'),
        h('button.btn.primary', { on: { click: () => m.close() } }, 'Fechar')));
    if (input.value) run();
  });
}

function refreshSearchMarks() {
  if (R.doc.type !== 'pdf') return;
  R.pageEls.forEach(pg => {
    const tl = pg.querySelector('.textLayer');
    if (!tl) return;
    tl.querySelectorAll('span').forEach(s => s.style.background = '');
    markSearchInTextLayer(tl);
  });
}

function resultItem(label, text, idx, len, onClick) {
  const start = Math.max(0, idx - 50), end = Math.min(text.length, idx + len + 70);
  return h('div.list-item', { style: { boxShadow: 'none', border: '1px solid var(--border)' }, on: { click: onClick } },
    h('div.body', h('div.small.muted', label),
      h('div.small', { html: (start ? '…' : '') + esc(text.slice(start, idx)) + '<mark>' + esc(text.slice(idx, idx + len)) + '</mark>' + esc(text.slice(idx + len, end)) + '…' })));
}

// ============================================================
// Menu, tema, navegação
// ============================================================
async function goToPageDialog() {
  if (R.doc.type !== 'pdf') return;
  const v = await prompt('Ir para a página', { value: String(R.curPage || 1), okText: 'Ir', label: `1 – ${R.numPages}` });
  if (v && !isNaN(+v)) goToPage(+v);
}

function readerMenu() {
  const isPdf = R.doc.type === 'pdf';
  actionMenu('Opções de leitura', [
    { icon: '☀️', label: 'Tema claro', action: () => setReaderTheme('light') },
    { icon: '📜', label: 'Tema sépia', action: () => setReaderTheme('sepia') },
    { icon: '🌙', label: 'Tema escuro', action: () => setReaderTheme('dark') },
    isPdf ? { icon: '#️⃣', label: 'Ir para página…', action: goToPageDialog } : null,
    isPdf ? { icon: '↔️', label: 'Ajustar à largura', action: () => setZoom(1) } : { icon: '🔤', label: 'Tamanho de fonte padrão', action: () => setFont(1) },
    { icon: '⛶', label: 'Tela cheia (toque no texto alterna)', action: () => setImmersive(true) },
    { icon: '🔖', label: 'Marcadores', action: () => openDrawer('bm') },
    { icon: '📓', label: 'Caderno do documento', action: () => openDrawer('nb') },
    { icon: '🧠', label: 'Criar mapa mental das anotações', action: () => createMapFromDoc(R.doc.id) },
    { icon: '🎓', label: 'Criar estudo das anotações', action: () => createStudyFromDoc(R.doc.id) },
    { icon: '💡', label: 'Manter tela ligada (liga/desliga)', action: async () => { const v = !(await db.setting('keepScreenOn')); await db.setting('keepScreenOn', v); bridge?.keepScreenOn(v); toast(v ? 'Tela ficará ligada durante a leitura' : 'Desativado'); } },
  ]);
}

async function setReaderTheme(t) {
  R.root.dataset.rtheme = t;
  await db.setting('readerTheme', t);
}

// ============================================================
// Progresso
// ============================================================
async function saveProgressNow() {
  if (!R) return;
  const d = await db.get('docs', R.doc.id);
  if (!d) return;
  if (R.doc.type === 'pdf') {
    if (!R.curPage) return;
    d.lastPos = { page: R.curPage };
    d.progress = R.numPages > 1 ? (R.curPage - 1) / (R.numPages - 1) : 1;
    d.zoom = R.zoom;
  } else {
    if (!R.content) return;
    const r = docxRatio();
    d.lastPos = { ratio: r };
    d.progress = r;
    d.fontScale = R.fontScale;
  }
  d.openedAt = Date.now();
  await db.put('docs', d);
}
const saveProgress = debounce(saveProgressNow, 800);
