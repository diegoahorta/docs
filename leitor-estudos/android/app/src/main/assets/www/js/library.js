// Biblioteca: armazenamento, organização (coleções), busca global
import { db } from './db.js';
import { $, h, esc, toast, fmtDate, fmtSize, debounce, prompt, confirmDialog, actionMenu, openModal, saveBlob, normalize } from './util.js';
import { importFiles, deleteDoc, onDocsChanged, emitDocsChanged } from './docs.js';
import { openReader } from './reader.js';
import { createMapFromDoc } from './mindmap.js';
import { createStudyFromDoc } from './study.js';

const state = { filter: 'all', sort: 'recent', query: '' };
let root;

export function initLibrary() {
  root = $('#view-library');
  onDocsChanged(() => { if (root.classList.contains('active') || true) renderLibrary(); });
  $('#fileInput').addEventListener('change', async e => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    const added = await importFiles(files);
    if (state.filter.startsWith('col:') && added.length) {
      const colId = state.filter.slice(4);
      for (const d of added) { d.collections = [colId]; await db.put('docs', d); }
      emitDocsChanged();
    }
  });
}

export function pickFiles() { $('#fileInput').click(); }

export async function renderLibrary() {
  const [docs, cols] = await Promise.all([db.all('docs'), db.all('collections')]);
  root.innerHTML = '';

  const searchInput = h('input', { type: 'search', placeholder: 'Buscar por nome ou dentro dos documentos…', value: state.query });
  const searchBox = h('div.search', h('span', '🔎'), searchInput);
  root.append(searchBox);

  const chips = h('div.chips');
  const chip = (key, label) => h('button.chip' + (state.filter === key ? '.active' : ''), {
    on: { click: () => { state.filter = key; renderLibrary(); } },
  }, label);
  chips.append(chip('all', 'Todos'), chip('fav', '⭐ Favoritos'), chip('pdf', 'PDF'), chip('docx', 'DOCX'));
  cols.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => chips.append(chip('col:' + c.id, '📁 ' + c.name)));
  chips.append(h('button.chip', { on: { click: newCollection } }, '＋ Coleção'));
  root.append(chips);

  const activeCol = state.filter.startsWith('col:') ? cols.find(c => 'col:' + c.id === state.filter) : null;

  const sortSel = h('select', { style: { border: '0', background: 'transparent', color: 'var(--muted)', fontSize: '13px' }, on: { change: e => { state.sort = e.target.value; renderLibrary(); } } },
    ...[['recent', 'Lidos recentemente'], ['added', 'Adicionados'], ['name', 'Nome A–Z'], ['size', 'Tamanho']]
      .map(([v, l]) => h('option', { value: v, selected: state.sort === v }, l)));
  const header = h('div.row', { style: { margin: '2px 4px 10px' } },
    h('span.muted.small.grow', activeCol ? '📁 ' + activeCol.name : `${docs.length} documento(s)`),
    activeCol ? h('button.btn.sm.ghost', { on: { click: () => collectionMenu(activeCol) } }, '⋯ Coleção') : null,
    sortSel);
  root.append(header);

  const listWrap = h('div');
  root.append(listWrap);

  const renderList = async () => {
    listWrap.innerHTML = '';
    let list = docs.filter(d => {
      if (state.filter === 'fav') return d.fav;
      if (state.filter === 'pdf' || state.filter === 'docx') return d.type === state.filter;
      if (state.filter.startsWith('col:')) return (d.collections || []).includes(state.filter.slice(4));
      return true;
    });
    const q = normalize(state.query.trim());
    if (q) list = list.filter(d => normalize(d.name + ' ' + (d.author || '')).includes(q));
    const sorters = {
      recent: (a, b) => (b.openedAt || b.addedAt) - (a.openedAt || a.addedAt),
      added: (a, b) => b.addedAt - a.addedAt,
      name: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
      size: (a, b) => b.size - a.size,
    };
    list.sort(sorters[state.sort]);

    if (!docs.length) {
      listWrap.append(h('div.empty', h('span.big', '📄'),
        h('b', 'Sua biblioteca está vazia'), h('br'),
        'Toque em ＋ para adicionar arquivos PDF ou DOCX do seu aparelho. Tudo fica salvo off-line.'));
    } else if (!list.length && !q) {
      listWrap.append(h('div.empty', 'Nenhum documento neste filtro.'));
    }
    if (list.length) {
      const grid = h('div.doc-grid');
      list.forEach(d => grid.append(docCard(d)));
      listWrap.append(grid);
    }
    if (q.length >= 2) await renderFullTextResults(listWrap, state.query.trim(), docs);
  };
  searchInput.addEventListener('input', debounce(() => { state.query = searchInput.value; renderList(); }, 250));
  await renderList();

  root.append(h('button.fab', { title: 'Adicionar documento', on: { click: pickFiles } }, '＋'));
}

function docCard(d) {
  const thumb = h('div.doc-thumb');
  if (d.thumb) thumb.append(h('img', { src: d.thumb, alt: '', loading: 'lazy' }));
  else if (d.type === 'docx') thumb.append(h('div.docx-thumb', d.thumbText || ''));
  else thumb.append('📄');
  const progress = Math.round((d.progress || 0) * 100);
  return h('div.doc-card', { on: { click: () => openReader(d.id), contextmenu: e => { e.preventDefault(); docMenu(d); } } },
    thumb,
    d.fav ? h('span.doc-fav', '⭐') : null,
    h('button.doc-more', { on: { click: e => { e.stopPropagation(); docMenu(d); } } }, '⋮'),
    h('div.doc-info',
      h('div.doc-name', d.name),
      h('div.doc-meta', h('span.badge.' + d.type, d.type.toUpperCase()),
        h('span', d.type === 'pdf' ? `${d.pages} pág.` : `${d.words || 0} palavras`),
        progress ? h('span', `· ${progress}%`) : null),
      h('div.progress', h('i', { style: { width: progress + '%' } })))
  );
}

/** Busca no conteúdo de todos os documentos. */
async function renderFullTextResults(container, query, docs) {
  const texts = await db.all('texts');
  const byId = Object.fromEntries(docs.map(d => [d.id, d]));
  const q = normalize(query);
  const results = [];
  for (const t of texts) {
    const d = byId[t.id];
    if (!d) continue;
    let count = 0;
    (t.pages || []).forEach((txt, pi) => {
      if (count >= 3) return;
      const n = normalize(txt);
      let idx = n.indexOf(q);
      while (idx >= 0 && count < 3) {
        results.push({ doc: d, page: pi + 1, snippet: snippet(txt, idx, query.length), offset: idx });
        count++;
        idx = n.indexOf(q, idx + q.length);
      }
    });
  }
  container.append(h('div.section-title', `Encontrado no conteúdo (${results.length}${results.length >= 3 ? '+' : ''})`));
  if (!results.length) { container.append(h('p.muted.small', { style: { margin: '0 4px' } }, 'Nenhuma ocorrência no texto dos documentos.')); return; }
  results.slice(0, 60).forEach(r => {
    container.append(h('div.list-item.search-hit-item', {
      on: { click: () => openReader(r.doc.id, r.doc.type === 'pdf' ? { page: r.page, search: query } : { search: query }) },
    },
      h('span.badge.' + r.doc.type, r.doc.type.toUpperCase()),
      h('div.body',
        h('div.title.ellipsis', r.doc.name + (r.doc.type === 'pdf' ? ` — pág. ${r.page}` : '')),
        h('div.small.snippet', { html: r.snippet }))));
  });
}

function snippet(text, idx, len) {
  const start = Math.max(0, idx - 60), end = Math.min(text.length, idx + len + 80);
  return (start > 0 ? '…' : '') + esc(text.slice(start, idx)) + '<mark>' + esc(text.slice(idx, idx + len)) + '</mark>' +
    esc(text.slice(idx + len, end)) + (end < text.length ? '…' : '');
}

async function newCollection() {
  const name = await prompt('Nova coleção', { placeholder: 'Ex.: Direito Civil, TCC, Concurso…' });
  if (!name?.trim()) return;
  const c = { id: 'c' + Date.now().toString(36), name: name.trim(), createdAt: Date.now() };
  await db.put('collections', c);
  state.filter = 'col:' + c.id;
  renderLibrary();
}

function collectionMenu(c) {
  actionMenu('📁 ' + c.name, [
    { icon: '✏️', label: 'Renomear coleção', action: async () => { const n = await prompt('Renomear coleção', { value: c.name }); if (n?.trim()) { c.name = n.trim(); await db.put('collections', c); renderLibrary(); } } },
    { icon: '➕', label: 'Adicionar documentos do aparelho', action: pickFiles },
    { icon: '🗑️', label: 'Excluir coleção (mantém documentos)', danger: true, action: async () => {
      if (!await confirmDialog('Excluir coleção?', 'Os documentos continuarão na biblioteca.', { okText: 'Excluir', danger: true })) return;
      await db.del('collections', c.id);
      for (const d of await db.all('docs')) if ((d.collections || []).includes(c.id)) { d.collections = d.collections.filter(x => x !== c.id); await db.put('docs', d); }
      state.filter = 'all'; renderLibrary();
    } },
  ]);
}

export async function docMenu(d) {
  actionMenu(d.name, [
    { icon: '📖', label: 'Abrir', action: () => openReader(d.id) },
    { icon: d.fav ? '☆' : '⭐', label: d.fav ? 'Remover dos favoritos' : 'Favoritar', action: async () => { d.fav = !d.fav; await db.put('docs', d); renderLibrary(); } },
    { icon: '📁', label: 'Coleções…', action: () => assignCollections(d) },
    { icon: '✏️', label: 'Renomear', action: async () => { const n = await prompt('Renomear documento', { value: d.name }); if (n?.trim()) { d.name = n.trim(); await db.put('docs', d); renderLibrary(); } } },
    { icon: '🧠', label: 'Criar mapa mental das anotações', action: () => createMapFromDoc(d.id) },
    { icon: '🎓', label: 'Criar estudo das anotações', action: () => createStudyFromDoc(d.id) },
    { icon: '💾', label: 'Salvar cópia do arquivo', action: async () => { const f = await db.get('files', d.id); if (f) saveBlob(f.blob, d.fileName || d.name + '.' + d.type); } },
    { icon: 'ℹ️', label: 'Informações', action: () => docInfo(d) },
    { icon: '🗑️', label: 'Excluir', danger: true, action: async () => {
      if (await confirmDialog('Excluir documento?', `"${d.name}" e seus marcadores e destaques serão apagados. Trechos salvos, mapas e estudos são mantidos.`, { okText: 'Excluir', danger: true })) {
        await deleteDoc(d.id); toast('Documento excluído');
      }
    } },
  ]);
}

async function assignCollections(d) {
  const cols = await db.all('collections');
  openModal((box, m) => {
    box.append(h('h3', 'Coleções'));
    if (!cols.length) box.append(h('p.muted', 'Você ainda não criou coleções.'));
    const sel = new Set(d.collections || []);
    cols.forEach(c => {
      const cb = h('input', { type: 'checkbox', checked: sel.has(c.id), on: { change: e => e.target.checked ? sel.add(c.id) : sel.delete(c.id) } });
      box.append(h('label.list-item', { style: { boxShadow: 'none', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '15px' } }, cb, h('span', '📁 ' + c.name)));
    });
    box.append(h('div.actions',
      h('button.btn.ghost', { on: { click: async () => { m.close(); await newCollection(); } } }, '＋ Nova coleção'),
      h('button.btn.primary', { on: { click: async () => { d.collections = [...sel]; await db.put('docs', d); m.close(); renderLibrary(); } } }, 'Salvar')));
  });
}

async function docInfo(d) {
  const anns = await db.byDoc('annotations', d.id);
  openModal((box, m) => {
    box.append(h('h3', d.name),
      h('p', h('span.badge.' + d.type, d.type.toUpperCase()), ' ', d.fileName),
      h('p.small.muted',
        `Tamanho: ${fmtSize(d.size)}`, h('br'),
        d.type === 'pdf' ? `Páginas: ${d.pages}` : `Palavras: ${d.words || 0}`, h('br'),
        d.author ? [`Autor: ${d.author}`, h('br')] : null,
        `Adicionado em: ${fmtDate(d.addedAt)}`, h('br'),
        d.openedAt ? [`Última leitura: ${fmtDate(d.openedAt)}`, h('br')] : null,
        `Progresso: ${Math.round((d.progress || 0) * 100)}%`, h('br'),
        `Marcadores: ${anns.filter(a => a.kind === 'bookmark').length} · Destaques: ${anns.filter(a => a.kind === 'highlight').length} · Notas: ${anns.filter(a => a.note).length}`, h('br'),
        `Indexado para busca: ${d.indexed ? 'sim' : 'em andamento…'}`),
      h('div.actions', h('button.btn.primary', { on: { click: () => m.close() } }, 'Fechar')));
  });
}
