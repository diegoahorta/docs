// Trechos: agregador de citações copiadas/salvas de todos os documentos
import { db } from './db.js';
import { $, h, toast, prompt, confirmDialog, actionMenu, debounce, truncate, fmtDateTime, copyText, shareText, saveBlob, normalize } from './util.js';
import { openReader } from './reader.js';
import { addToStudy } from './study.js';
import { addToMap } from './mindmap.js';

const state = { q: '', doc: 'all' };

export async function renderExcerpts() {
  const root = $('#view-excerpts');
  const all = (await db.all('excerpts')).sort((a, b) => b.createdAt - a.createdAt);
  root.innerHTML = '';
  if (!all.length) {
    root.append(h('div.empty', h('span.big', '✂️'), h('b', 'Nenhum trecho salvo'), h('br'),
      'No leitor, selecione um texto e toque em “Trecho” para guardar citações de qualquer documento aqui.'));
    return;
  }
  const input = h('input', { type: 'search', placeholder: 'Buscar nos trechos…', value: state.q });
  root.append(h('div.search', h('span', '🔎'), input));

  const docs = new Map();
  all.forEach(e => docs.set(e.docId, e.docName));
  const chips = h('div.chips', h('button.chip' + (state.doc === 'all' ? '.active' : ''), { on: { click: () => { state.doc = 'all'; renderExcerpts(); } } }, `Todos (${all.length})`),
    ...[...docs].map(([id, name]) => h('button.chip' + (state.doc === id ? '.active' : ''), { on: { click: () => { state.doc = id; renderExcerpts(); } } }, '📄 ' + truncate(name, 28))));
  root.append(chips);

  const list = h('div');
  root.append(list);
  const draw = () => {
    list.innerHTML = '';
    const q = normalize(state.q);
    const items = all.filter(e => (state.doc === 'all' || e.docId === state.doc) && (!q || normalize(e.text + ' ' + (e.note || '') + ' ' + e.docName).includes(q)));
    list.append(h('div.row', { style: { margin: '0 4px 8px' } }, h('span.small.muted.grow', `${items.length} trecho(s)`),
      h('button.btn.sm.ghost', { on: { click: () => exportList(items) } }, '📤 Exportar')));
    items.forEach(e => list.append(h('div.card', { on: { click: () => excerptMenu(e) } },
      h('div.quote', e.text),
      e.note ? h('div.small', { style: { marginTop: '6px' } }, '📝 ' + e.note) : null,
      h('div.row.small.muted', { style: { marginTop: '6px' } },
        h('span.grow.ellipsis', `📄 ${e.docName || '—'}${e.page ? ', p. ' + e.page : ''}`), h('span', fmtDateTime(e.createdAt))))));
  };
  input.addEventListener('input', debounce(() => { state.q = input.value; draw(); }, 200));
  draw();
}

function citation(e) {
  return `“${e.text}”\n— ${e.docName || ''}${e.page ? ', p. ' + e.page : ''}`;
}

function excerptMenu(e) {
  actionMenu(truncate(e.text, 80), [
    { icon: '📋', label: 'Copiar texto', action: async () => { await copyText(e.text); toast('Copiado'); } },
    { icon: '❝', label: 'Copiar com citação', action: async () => { await copyText(citation(e)); toast('Copiado com referência'); } },
    { icon: '📤', label: 'Compartilhar', action: () => shareText(e.docName, citation(e)) },
    { icon: '📝', label: e.note ? 'Editar nota' : 'Adicionar nota', action: async () => { const n = await prompt('Nota', { value: e.note || '', multiline: true }); if (n != null) { e.note = n.trim(); await db.put('excerpts', e); renderExcerpts(); } } },
    { icon: '🎓', label: 'Adicionar a um estudo', action: () => addToStudy({ type: 'excerpt', text: e.text, note: e.note, source: src(e) }) },
    { icon: '🧠', label: 'Adicionar a um mapa mental', action: () => addToMap(e.text, src(e)) },
    { icon: '📖', label: 'Abrir no documento', action: async () => {
      if (!await db.get('docs', e.docId)) { toast('Documento não está mais na biblioteca'); return; }
      openReader(e.docId, e.page ? { page: e.page } : { search: e.text.slice(0, 50) });
    } },
    { icon: '🗑️', label: 'Excluir trecho', danger: true, action: async () => { if (await confirmDialog('Excluir trecho?', truncate(e.text, 100), { okText: 'Excluir', danger: true })) { await db.del('excerpts', e.id); renderExcerpts(); } } },
  ]);
}

const src = e => ({ docId: e.docId, docName: e.docName, docType: e.docType, page: e.page, start: e.start, end: e.end });

function exportList(items) {
  const md = '# Trechos\n\n' + items.map(e => `> ${e.text.replace(/\n/g, '\n> ')}\n\n— ${e.docName || ''}${e.page ? ', p. ' + e.page : ''}${e.note ? `\n\n**Nota:** ${e.note}` : ''}\n`).join('\n');
  actionMenu('Exportar trechos', [
    { icon: '📋', label: 'Copiar tudo', action: async () => { await copyText(md); toast('Copiado'); } },
    { icon: '📤', label: 'Compartilhar', action: () => shareText('Trechos', md) },
    { icon: '💾', label: 'Salvar arquivo .md', action: () => saveBlob(new Blob([md], { type: 'text/markdown' }), 'trechos.md') },
  ]);
}
