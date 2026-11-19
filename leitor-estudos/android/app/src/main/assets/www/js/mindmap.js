// Mapas mentais: lista, editor (SVG com pan/zoom), geração a partir de documentos
import { db } from './db.js';
import { $, h, uid, toast, prompt, confirmDialog, actionMenu, pickFrom, openModal, truncate, fmtDate, copyText, shareText, saveBlob, COLOR_NAMES } from './util.js';
import { loadPdf, getFileBuffer } from './docs.js';
import { openReader } from './reader.js';

const PALETTE = ['#3e7bfa', '#e8833a', '#2ea66b', '#c94fd6', '#e0b100', '#e2475b', '#17a2b8', '#7a5cff'];
const HL_HEX = { yellow: '#e0b100', green: '#2ea66b', blue: '#3e7bfa', pink: '#e2475b', orange: '#e8833a' };
const node = (text, extra = {}) => ({ id: uid(), text, children: [], ...extra });

let M = null; // estado do editor

// ============================================================
// Lista
// ============================================================
export async function renderMaps() {
  const root = $('#view-maps');
  const maps = (await db.all('mindmaps')).sort((a, b) => b.updatedAt - a.updatedAt);
  root.innerHTML = '';
  if (!maps.length) {
    root.append(h('div.empty', h('span.big', '🧠'), h('b', 'Nenhum mapa mental'), h('br'),
      'Crie um mapa do zero ou gere automaticamente a partir dos destaques e da estrutura de um documento (menu ⋮ do documento).'));
  }
  maps.forEach(m => {
    const count = countNodes(m.root);
    root.append(h('div.list-item', { on: { click: () => openMap(m.id) } },
      h('span', { style: { fontSize: '26px' } }, '🧠'),
      h('div.body', h('div.title', m.title), h('div.small.muted', `${count} tópico(s) · ${fmtDate(m.updatedAt)}`)),
      h('button.icon-btn', { on: { click: e => { e.stopPropagation(); mapMenu(m); } } }, '⋮')));
  });
  root.append(h('button.fab', { title: 'Novo mapa', on: { click: newMap } }, '＋'));
}

function countNodes(n) { return 1 + (n.children || []).reduce((s, c) => s + countNodes(c), 0); }

function mapMenu(m) {
  actionMenu(m.title, [
    { icon: '✏️', label: 'Renomear', action: async () => { const t = await prompt('Renomear mapa', { value: m.title }); if (t?.trim()) { m.title = t.trim(); m.root.text = m.root.text || m.title; await saveMap(m); renderMaps(); } } },
    { icon: '📄', label: 'Duplicar', action: async () => { const c = JSON.parse(JSON.stringify(m)); c.id = uid(); c.title += ' (cópia)'; reId(c.root); await saveMap(c); renderMaps(); } },
    { icon: '🗑️', label: 'Excluir', danger: true, action: async () => { if (await confirmDialog('Excluir mapa?', m.title, { okText: 'Excluir', danger: true })) { await db.del('mindmaps', m.id); renderMaps(); } } },
  ]);
}
function reId(n) { n.id = uid(); (n.children || []).forEach(reId); }

async function saveMap(m) { m.updatedAt = Date.now(); m.createdAt = m.createdAt || Date.now(); return db.put('mindmaps', m); }

async function newMap() {
  const title = await prompt('Novo mapa mental', { placeholder: 'Tema central' });
  if (!title?.trim()) return;
  const m = { id: uid(), title: title.trim(), root: node(title.trim()) };
  await saveMap(m);
  openMap(m.id);
}

// ============================================================
// Integração com o leitor
// ============================================================
export async function addToMap(text, source) {
  const maps = (await db.all('mindmaps')).sort((a, b) => b.updatedAt - a.updatedAt);
  const pick = await pickFrom('Adicionar ao mapa mental', maps, { newLabel: 'Novo mapa' });
  if (!pick) return;
  let m;
  if (pick.isNew) {
    const title = await prompt('Novo mapa mental', { value: source?.docName || '', placeholder: 'Tema central' });
    if (!title?.trim()) return;
    m = { id: uid(), title: title.trim(), root: node(title.trim()) };
  } else m = pick;
  // escolher o tópico pai
  let parent = m.root;
  if (countNodes(m.root) > 1) {
    const flat = [];
    (function walk(n, d) { flat.push({ n, d, title: '  '.repeat(d) + truncate(n.text, 60) }); (n.children || []).forEach(c => walk(c, d + 1)); })(m.root, 0);
    const p = await pickFrom('Inserir dentro de qual tópico?', flat, { render: it => h('div.body', { style: { paddingLeft: it.d * 14 + 'px' } }, it.d ? '↳ ' : '◉ ', truncate(it.n.text, 70)) });
    if (!p) return;
    parent = p.n;
  }
  parent.children.push(node(truncate(text, 160), { source, full: text }));
  parent.collapsed = false;
  await saveMap(m);
  toast('Adicionado ao mapa “' + m.title + '”');
}

/** Gera um mapa a partir da estrutura (títulos/sumário) e das anotações do documento. */
export async function createMapFromDoc(docId) {
  const doc = await db.get('docs', docId);
  if (!doc) return;
  toast('Gerando mapa mental…');
  const anns = await db.byDoc('annotations', docId);
  const root = node(doc.name);
  let ci = 0;
  const branch = (text) => { const n = node(text, { color: PALETTE[ci++ % PALETTE.length] }); root.children.push(n); return n; };

  const structure = await docStructure(doc).catch(() => []);
  if (structure.length) { const b = branch('Estrutura'); b.children = structure; b.collapsed = structure.length > 12; }

  const bms = anns.filter(a => a.kind === 'bookmark');
  if (bms.length) { const b = branch('Marcadores'); bms.forEach(a => b.children.push(node(a.title, { source: { docId, docName: doc.name, docType: doc.type, page: a.page } }))); }

  const hls = anns.filter(a => a.kind === 'highlight').sort((a, b) => (a.page || 0) - (b.page || 0) || (a.start ?? 0) - (b.start ?? 0));
  const byColor = {};
  hls.forEach(a => (byColor[a.color || 'yellow'] ||= []).push(a));
  for (const [color, list] of Object.entries(byColor)) {
    const b = node(`Destaques ${COLOR_NAMES[color] || ''}`.trim(), { color: HL_HEX[color] });
    root.children.push(b);
    list.forEach(a => {
      const n = node(truncate(a.text, 140), { full: a.text, source: { docId, docName: doc.name, docType: doc.type, page: a.page, start: a.start, end: a.end } });
      if (a.note) n.children.push(node('📝 ' + truncate(a.note, 140)));
      b.children.push(n);
    });
  }
  if (!root.children.length) toast('Sem estrutura ou destaques: mapa criado só com o tema central');
  const m = { id: uid(), title: 'Mapa — ' + doc.name, root };
  await saveMap(m);
  openMap(m.id);
}

async function docStructure(doc) {
  const out = [];
  if (doc.type === 'docx') {
    const t = await db.get('texts', doc.id);
    if (!t?.html) return out;
    const d = document.createElement('div');
    d.innerHTML = t.html;
    const stack = [{ level: 0, n: { children: out } }];
    let count = 0;
    d.querySelectorAll('h1,h2,h3,h4').forEach(hd => {
      const text = hd.textContent.trim();
      if (!text || count > 120) return;
      const level = +hd.tagName[1];
      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      const n = node(truncate(text, 120));
      stack[stack.length - 1].n.children.push(n);
      stack.push({ level, n });
      count++;
    });
  } else {
    const pdf = await loadPdf(await getFileBuffer(doc.id));
    try {
      const outline = await pdf.getOutline();
      let count = 0;
      const conv = async (items, depth) => {
        const res = [];
        for (const it of items || []) {
          if (count++ > 150) break;
          let page = null;
          try {
            const dest = typeof it.dest === 'string' ? await pdf.getDestination(it.dest) : it.dest;
            if (dest && dest[0]) page = (await pdf.getPageIndex(dest[0])) + 1;
          } catch (e) { }
          const n = node(truncate(it.title, 120), page ? { source: { docId: doc.id, docName: doc.name, docType: 'pdf', page } } : {});
          if (depth < 3) n.children = await conv(it.items, depth + 1);
          res.push(n);
        }
        return res;
      };
      out.push(...await conv(outline, 1));
    } finally { pdf.destroy(); }
  }
  return out;
}

// ============================================================
// Editor
// ============================================================
export async function openMap(id) {
  const m = await db.get('mindmaps', id);
  if (!m) return;
  const root = $('#mapEditor');
  root.innerHTML = '';
  root.classList.remove('hidden');
  M = { map: m, sel: m.root.id, tx: 0, ty: 0, s: 1, root };

  const titleEl = h('div.title.ellipsis', { on: { click: renameMap } }, m.title);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const canvas = h('div.mm-canvas', svg,
    h('div.mm-zoom',
      h('button', { on: { click: () => zoomBy(1.2) } }, '＋'),
      h('button', { on: { click: () => zoomBy(1 / 1.2) } }, '－'),
      h('button', { title: 'Centralizar', on: { click: () => fit() } }, '⌖')));
  const tools = h('div.mm-tools');
  root.append(
    h('div.fs-top',
      h('button.icon-btn', { on: { click: closeMap } }, '←'), titleEl,
      h('button.icon-btn', { title: 'Exportar', on: { click: exportMenu } }, '📤')),
    canvas, tools);
  Object.assign(M, { svg, canvas, tools, titleEl });
  setupPanZoom();
  draw();
  requestAnimationFrame(() => fit());
}

export function closeMap() {
  if (!M) return false;
  M.root.classList.add('hidden');
  M.root.innerHTML = '';
  M = null;
  renderMaps();
  return true;
}
export const isMapOpen = () => !!M;

async function persist() { await saveMap(M.map); }

function findNode(id, n = M.map.root, parent = null) {
  if (n.id === id) return { n, parent };
  for (const c of n.children || []) { const r = findNode(id, c, n); if (r) return r; }
  return null;
}

// ---------- medidas e layout ----------
const mctx = document.createElement('canvas').getContext('2d');
const MAXW = 210, PADX = 14, PADY = 9, LINE = 19, HGAP = 46, VGAP = 12;

function wrapText(text, bold) {
  mctx.font = `${bold ? '600 ' : ''}14px system-ui, Roboto, sans-serif`;
  const words = String(text || ' ').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (mctx.measureText(t).width > MAXW && cur) { lines.push(cur); cur = w; } else cur = t;
    if (lines.length >= 6) break;
  }
  if (cur && lines.length < 6) lines.push(cur);
  else if (lines.length >= 6) lines[5] = lines[5].replace(/.{0,2}$/, '…');
  const width = Math.min(MAXW, Math.max(...lines.map(l => mctx.measureText(l).width)));
  return { lines, w: width + PADX * 2, h: lines.length * LINE + PADY * 2 };
}

function measure(n, depth) {
  const r = wrapText(n.text, depth <= 1);
  n._lines = r.lines; n._w = Math.max(depth === 0 ? 120 : 60, r.w); n._h = r.h + (depth === 0 ? 8 : 0); n._d = depth;
  (n.children || []).forEach(c => measure(c, depth + 1));
}

function subH(n) {
  if (n.collapsed || !n.children?.length) return n._h;
  return Math.max(n._h, n.children.reduce((s, c) => s + subH(c), 0) + VGAP * (n.children.length - 1));
}

function place(n, x, yc, dir, color) {
  n._x = dir > 0 ? x : x - n._w;
  n._y = yc - n._h / 2;
  n._dir = dir;
  n._color = n.color || color;
  if (n.collapsed || !n.children?.length) return;
  const total = n.children.reduce((s, c) => s + subH(c), 0) + VGAP * (n.children.length - 1);
  let y = yc - total / 2;
  for (const c of n.children) {
    const ch = subH(c);
    place(c, dir > 0 ? n._x + n._w + HGAP : n._x - HGAP, y + ch / 2, dir, n._color);
    y += ch + VGAP;
  }
}

function layout() {
  const r = M.map.root;
  measure(r, 0);
  r._x = -r._w / 2; r._y = -r._h / 2; r._color = '#1e3a5f'; r._dir = 0;
  if (r.collapsed) return;
  const kids = r.children || [];
  const nRight = Math.ceil(kids.length / 2);
  const right = kids.slice(0, nRight), left = kids.slice(nRight);
  const side = (list, dir) => {
    const total = list.reduce((s, c) => s + subH(c), 0) + VGAP * 2 * Math.max(0, list.length - 1);
    let y = -total / 2;
    list.forEach(c => {
      const ch = subH(c);
      const idx = kids.indexOf(c);
      place(c, dir > 0 ? r._w / 2 + HGAP + 10 : -r._w / 2 - HGAP - 10, y + ch / 2, dir, c.color || PALETTE[idx % PALETTE.length]);
      y += ch + VGAP * 2;
    });
  };
  side(right, 1); side(left, -1);
}

// ---------- desenho ----------
const SVGNS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

function draw() {
  layout();
  const svg = M.svg;
  svg.innerHTML = '';
  const dark = document.documentElement.dataset.theme === 'dark';
  const g = s('g', { transform: `translate(${M.tx},${M.ty}) scale(${M.s})` });
  M.g = g;
  const links = s('g'), nodes = s('g');
  g.append(links, nodes);
  const walk = (n, parent) => {
    if (parent) {
      const fromRight = n._dir > 0;
      const x1 = fromRight ? parent._x + parent._w : parent._x, y1 = parent._y + parent._h / 2;
      const x2 = fromRight ? n._x : n._x + n._w, y2 = n._y + n._h / 2;
      const mx = (x1 + x2) / 2;
      links.append(s('path', { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, class: 'mm-link', stroke: n._color, opacity: 0.75 }));
    }
    const gn = s('g', { class: 'mm-node' + (M.sel === n.id ? ' selected' : ''), 'data-id': n.id });
    let fill, stroke, color;
    if (n._d === 0) { fill = '#1e3a5f'; stroke = '#1e3a5f'; color = '#fff'; }
    else if (n._d === 1) { fill = n._color; stroke = n._color; color = '#fff'; }
    else { fill = dark ? '#18202b' : '#fff'; stroke = n._color; color = dark ? '#e6ebf2' : '#1b2330'; }
    gn.append(s('rect', { x: n._x, y: n._y, width: n._w, height: n._h, rx: n._d === 0 ? 16 : 10, fill, stroke }));
    const tx = s('text', { x: n._x + n._w / 2, y: n._y + n._h / 2 - (n._lines.length - 1) * LINE / 2, fill: color, 'text-anchor': 'middle', 'font-weight': n._d <= 1 ? 600 : 400, 'font-family': 'system-ui, Roboto, sans-serif' });
    n._lines.forEach((l, i) => { const t = s('tspan', { x: n._x + n._w / 2, dy: i ? LINE : 0 }); t.textContent = l; tx.append(t); });
    gn.append(tx);
    if (n.source) gn.append(s('circle', { cx: n._x + n._w - 4, cy: n._y + 4, r: 5, fill: '#f2b33d', stroke: '#fff', 'stroke-width': 1.5 }));
    if (n.collapsed && n.children?.length) {
      const cx = n._dir < 0 ? n._x - 12 : n._x + n._w + 12;
      gn.append(s('circle', { cx, cy: n._y + n._h / 2, r: 11, fill: n._color }));
      const t = s('text', { x: cx, y: n._y + n._h / 2 + 1, fill: '#fff', 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700 });
      t.textContent = countNodes(n) - 1; gn.append(t);
    }
    nodes.append(gn);
    if (!n.collapsed) (n.children || []).forEach(c => walk(c, n));
  };
  walk(M.map.root, null);
  svg.append(g);
  drawTools();
}

function applyTransform() { M.g?.setAttribute('transform', `translate(${M.tx},${M.ty}) scale(${M.s})`); }

function bounds(n = M.map.root, b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }) {
  b.x1 = Math.min(b.x1, n._x); b.y1 = Math.min(b.y1, n._y); b.x2 = Math.max(b.x2, n._x + n._w); b.y2 = Math.max(b.y2, n._y + n._h);
  if (!n.collapsed) (n.children || []).forEach(c => bounds(c, b));
  return b;
}

function fit() {
  const b = bounds();
  const W = M.canvas.clientWidth, H = M.canvas.clientHeight;
  const want = Math.min((W - 40) / (b.x2 - b.x1), (H - 40) / (b.y2 - b.y1));
  const sc = Math.min(1.3, Math.max(0.6, want));
  M.s = sc;
  if (want >= 0.6) { // cabe tudo: centraliza o conjunto
    M.tx = W / 2 - ((b.x1 + b.x2) / 2) * sc;
    M.ty = H / 2 - ((b.y1 + b.y2) / 2) * sc;
  } else { // mapa grande: centraliza no tópico central (arraste para navegar)
    M.tx = W / 2; M.ty = H / 2;
  }
  applyTransform();
}

function zoomBy(f, cx = M.canvas.clientWidth / 2, cy = M.canvas.clientHeight / 2) {
  const ns = Math.max(0.15, Math.min(4, M.s * f));
  M.tx = cx - (cx - M.tx) * (ns / M.s);
  M.ty = cy - (cy - M.ty) * (ns / M.s);
  M.s = ns;
  applyTransform();
}

function setupPanZoom() {
  const c = M.canvas;
  const pts = new Map();
  let start = null, moved = false, lastTap = 0;
  c.addEventListener('pointerdown', e => {
    if (e.target.closest('.mm-zoom')) return;
    c.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (pts.size === 1) start = { x: e.clientX, y: e.clientY, tx: M.tx, ty: M.ty, target: e.target };
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      start = { pinch: true, d: Math.hypot(a.x - b.x, a.y - b.y), s: M.s, tx: M.tx, ty: M.ty, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
  });
  c.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rect = c.getBoundingClientRect();
    if (start.pinch && pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const ns = Math.max(0.15, Math.min(4, start.s * d / start.d));
      const cx = start.cx - rect.left, cy = start.cy - rect.top;
      M.tx = cx - (cx - start.tx) * (ns / start.s) + ((a.x + b.x) / 2 - start.cx);
      M.ty = cy - (cy - start.ty) * (ns / start.s) + ((a.y + b.y) / 2 - start.cy);
      M.s = ns;
      moved = true;
      applyTransform();
    } else if (!start.pinch) {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (moved) { M.tx = start.tx + dx; M.ty = start.ty + dy; applyTransform(); }
    }
  });
  const up = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 0 && start && !start.pinch && !moved) {
      const gn = start.target.closest?.('.mm-node');
      if (gn) {
        const now = Date.now();
        if (M.sel === gn.dataset.id && now - lastTap < 400) editNode();
        else { M.sel = gn.dataset.id; draw(); }
        lastTap = now;
      }
    }
    if (pts.size === 0) start = null;
    else if (pts.size === 1) { const [p] = [...pts.values()]; start = { x: p.x, y: p.y, tx: M.tx, ty: M.ty, target: c }; moved = true; }
  };
  c.addEventListener('pointerup', up);
  c.addEventListener('pointercancel', up);
  c.addEventListener('wheel', e => { e.preventDefault(); const r = c.getBoundingClientRect(); zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
}

// ---------- ferramentas ----------
function drawTools() {
  const t = M.tools;
  t.innerHTML = '';
  const f = findNode(M.sel);
  const n = f?.n, isRoot = n === M.map.root;
  const b = (ic, label, fn, disabled) => t.append(h('button', { disabled: !!disabled, on: { click: fn } }, h('span', ic), label));
  b('➕', 'Filho', addChild, !n);
  b('↔️', 'Irmão', addSibling, !n || isRoot);
  b('✏️', 'Editar', editNode, !n);
  b('🎨', 'Cor', pickColor, !n || isRoot);
  b(n?.collapsed ? '📂' : '📁', n?.collapsed ? 'Expandir' : 'Recolher', toggleCollapse, !n?.children?.length);
  b('⬆️', 'Subir', () => move(-1), !n || isRoot);
  b('⬇️', 'Descer', () => move(1), !n || isRoot);
  b('📖', 'Origem', openSource, !n?.source);
  b('🗑️', 'Excluir', delNode, !n || isRoot);
}

async function addChild() {
  const { n } = findNode(M.sel);
  const text = await prompt('Novo tópico', { placeholder: 'Texto do tópico', okText: 'Adicionar' });
  if (!text?.trim()) return;
  const c = node(text.trim());
  n.children.push(c); n.collapsed = false;
  M.sel = c.id;
  await persist(); draw();
}

async function addSibling() {
  const { parent, n } = findNode(M.sel);
  const text = await prompt('Novo tópico', { placeholder: 'Texto do tópico', okText: 'Adicionar' });
  if (!text?.trim()) return;
  const c = node(text.trim());
  parent.children.splice(parent.children.indexOf(n) + 1, 0, c);
  M.sel = c.id;
  await persist(); draw();
}

async function editNode() {
  const { n } = findNode(M.sel);
  openModal((box, m) => {
    const ta = h('textarea', { autofocus: true }, n.text);
    box.append(h('h3', 'Editar tópico'), h('div.field', ta),
      n.full && n.full !== n.text ? h('div.quote.small', { style: { maxHeight: '160px', overflow: 'auto' } }, n.full) : null,
      n.source ? h('p.small.muted', `Origem: ${n.source.docName}${n.source.page ? ', p. ' + n.source.page : ''}`) : null,
      h('div.actions',
        h('button.btn.ghost', { on: { click: () => m.close() } }, 'Cancelar'),
        h('button.btn.primary', { on: { click: async () => { if (ta.value.trim()) { n.text = ta.value.trim(); if (n === M.map.root && !M.map.title) M.map.title = n.text; await persist(); draw(); } m.close(); } } }, 'Salvar')));
  });
}

function pickColor() {
  const { n } = findNode(M.sel);
  openModal((box, m) => {
    box.append(h('h3', 'Cor do ramo'), h('div.color-row', ...PALETTE.map(c => h('button' + (n.color === c ? '.sel' : ''), { style: { background: c }, on: { click: async () => { n.color = c; await persist(); draw(); m.close(); } } })),
      h('button', { style: { background: 'var(--surface-2)' }, title: 'Automática', on: { click: async () => { delete n.color; await persist(); draw(); m.close(); } } }, '↺')));
  });
}

async function toggleCollapse() { const { n } = findNode(M.sel); n.collapsed = !n.collapsed; await persist(); draw(); }

async function move(d) {
  const { parent, n } = findNode(M.sel);
  const i = parent.children.indexOf(n), j = i + d;
  if (j < 0 || j >= parent.children.length) return;
  parent.children.splice(i, 1); parent.children.splice(j, 0, n);
  await persist(); draw();
}

async function delNode() {
  const { parent, n } = findNode(M.sel);
  if (n.children?.length && !await confirmDialog('Excluir tópico?', `"${truncate(n.text, 60)}" e ${countNodes(n) - 1} subtópico(s) serão removidos.`, { okText: 'Excluir', danger: true })) return;
  parent.children.splice(parent.children.indexOf(n), 1);
  M.sel = parent.id;
  await persist(); draw();
}

function openSource() {
  const { n } = findNode(M.sel);
  const src = n.source;
  if (!src?.docId) return;
  db.get('docs', src.docId).then(d => {
    if (!d) { toast('Documento de origem não está mais na biblioteca'); return; }
    openReader(src.docId, src.page ? { page: src.page } : (n.full ? { search: n.full.slice(0, 60) } : {}));
  });
}

async function renameMap() {
  const t = await prompt('Título do mapa', { value: M.map.title });
  if (!t?.trim()) return;
  M.map.title = t.trim();
  M.titleEl.textContent = M.map.title;
  await persist();
}

// ---------- exportação ----------
function toOutline(n, d = 0) {
  return '  '.repeat(d) + (d ? '- ' : '# ') + (n.full || n.text) + '\n' + (n.children || []).map(c => toOutline(c, d + 1)).join('');
}

function exportMenu() {
  const md = toOutline(M.map.root);
  actionMenu('Exportar mapa', [
    { icon: '🖼️', label: 'Salvar como imagem (PNG)', action: exportPng },
    { icon: '📋', label: 'Copiar como tópicos (Markdown)', action: async () => { await copyText(md); toast('Copiado'); } },
    { icon: '📤', label: 'Compartilhar como texto', action: () => shareText(M.map.title, md) },
    { icon: '💾', label: 'Salvar arquivo .md', action: () => saveBlob(new Blob([md], { type: 'text/markdown' }), M.map.title + '.md') },
  ]);
}

async function exportPng() {
  const b = bounds();
  const pad = 30, sc = 2;
  const W = b.x2 - b.x1 + pad * 2, H = b.y2 - b.y1 + pad * 2;
  const clone = M.svg.cloneNode(true);
  clone.setAttribute('xmlns', SVGNS);
  clone.setAttribute('width', W); clone.setAttribute('height', H);
  clone.setAttribute('viewBox', `0 0 ${W} ${H}`);
  clone.querySelector('g').setAttribute('transform', `translate(${pad - b.x1},${pad - b.y1})`);
  clone.querySelectorAll('.mm-node.selected').forEach(n => n.classList.remove('selected'));
  const style = document.createElementNS(SVGNS, 'style');
  style.textContent = '.mm-link{fill:none;stroke-width:2.4}.mm-node rect{stroke-width:2}text{font-size:14px;dominant-baseline:middle;font-family:system-ui,Roboto,sans-serif}';
  clone.prepend(style);
  const bg = s('rect', { x: 0, y: 0, width: W, height: H, fill: document.documentElement.dataset.theme === 'dark' ? '#0f141b' : '#ffffff' });
  clone.insertBefore(bg, clone.querySelector('g'));
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const cv = document.createElement('canvas');
  const k = Math.min(sc, Math.sqrt(30e6 / (W * H)));
  cv.width = W * k; cv.height = H * k;
  const ctx = cv.getContext('2d');
  ctx.scale(k, k);
  ctx.drawImage(img, 0, 0);
  cv.toBlob(blob => saveBlob(blob, M.map.title + '.png'), 'image/png');
}
