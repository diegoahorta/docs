// Estudos: cadernos que agregam trechos de vários documentos, notas e flashcards (repetição espaçada)
import { db } from './db.js';
import { $, h, uid, toast, prompt, confirmDialog, actionMenu, pickFrom, openModal, truncate, fmtDate, copyText, shareText, saveBlob } from './util.js';
import { openReader } from './reader.js';

const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 16, 35]; // dias por caixa (Leitner)
let S = null;

// ============================================================
// Lista de estudos
// ============================================================
export async function renderStudies() {
  const root = $('#view-studies');
  const studies = (await db.all('studies')).sort((a, b) => b.updatedAt - a.updatedAt);
  root.innerHTML = '';
  const now = Date.now();
  const due = studies.reduce((s, st) => s + (st.cards || []).filter(c => (c.due || 0) <= now).length, 0);
  if (studies.length) {
    root.append(h('div.stat-row',
      h('div.stat', h('b', studies.length), h('span', 'estudos')),
      h('div.stat', h('b', studies.reduce((s, st) => s + (st.cards || []).length, 0)), h('span', 'flashcards')),
      h('div.stat', h('b', due), h('span', 'para revisar'))));
  } else {
    root.append(h('div.empty', h('span.big', '🎓'), h('b', 'Nenhum estudo'), h('br'),
      'Um estudo reúne trechos de vários documentos, suas notas e flashcards para revisão. Crie um aqui ou selecione um texto no leitor e toque em “Estudo”.'));
  }
  studies.forEach(st => {
    const d = (st.cards || []).filter(c => (c.due || 0) <= now).length;
    root.append(h('div.list-item', { on: { click: () => openStudy(st.id) } },
      h('span', { style: { fontSize: '26px' } }, '🎓'),
      h('div.body', h('div.title', st.title),
        st.description ? h('div.small.muted.ellipsis', st.description) : null,
        h('div.small.muted', `${(st.items || []).length} item(ns) · ${(st.cards || []).length} flashcard(s)${d ? ` · ${d} para revisar` : ''} · ${fmtDate(st.updatedAt)}`)),
      h('button.icon-btn', { on: { click: e => { e.stopPropagation(); studyMenu(st); } } }, '⋮')));
  });
  root.append(h('button.fab', { title: 'Novo estudo', on: { click: newStudy } }, '＋'));
}

function studyMenu(st) {
  actionMenu(st.title, [
    { icon: '✏️', label: 'Renomear', action: async () => { const t = await prompt('Renomear estudo', { value: st.title }); if (t?.trim()) { st.title = t.trim(); await save(st); renderStudies(); } } },
    { icon: '📤', label: 'Exportar (Markdown)', action: () => exportStudy(st) },
    { icon: '🗑️', label: 'Excluir', danger: true, action: async () => { if (await confirmDialog('Excluir estudo?', st.title, { okText: 'Excluir', danger: true })) { await db.del('studies', st.id); renderStudies(); } } },
  ]);
}

async function save(st) { st.updatedAt = Date.now(); st.createdAt ||= Date.now(); return db.put('studies', st); }

async function newStudy() {
  const title = await prompt('Novo estudo', { placeholder: 'Ex.: Revisão para a prova de História' });
  if (!title?.trim()) return null;
  const st = { id: uid(), title: title.trim(), description: '', items: [], cards: [] };
  await save(st);
  renderStudies();
  return st;
}

// ============================================================
// Integração
// ============================================================
export async function addToStudy(item) {
  const studies = (await db.all('studies')).sort((a, b) => b.updatedAt - a.updatedAt);
  const pick = await pickFrom('Adicionar ao estudo', studies, { newLabel: 'Novo estudo' });
  if (!pick) return;
  const st = pick.isNew ? await newStudy() : pick;
  if (!st) return;
  st.items.push({ id: uid(), type: item.type || 'excerpt', text: item.text, note: item.note || '', source: item.source || null, createdAt: Date.now() });
  await save(st);
  toast('Adicionado ao estudo “' + st.title + '”');
  if (S?.st.id === st.id) { S.st = st; drawStudy(); }
}

export async function createStudyFromDoc(docId) {
  const doc = await db.get('docs', docId);
  if (!doc) return;
  const anns = (await db.byDoc('annotations', docId)).filter(a => a.kind === 'highlight')
    .sort((a, b) => (a.page || 0) - (b.page || 0) || (a.start ?? 0) - (b.start ?? 0));
  const st = { id: uid(), title: 'Estudo — ' + doc.name, description: '', items: [], cards: [] };
  st.items.push({ id: uid(), type: 'heading', text: doc.name });
  const notebook = (await db.get('settings', 'notebook:' + docId))?.value;
  if (notebook?.trim()) st.items.push({ id: uid(), type: 'note', text: notebook.trim() });
  for (const a of anns) {
    const source = { docId, docName: doc.name, docType: doc.type, page: a.page, start: a.start, end: a.end };
    st.items.push({ id: uid(), type: 'excerpt', text: a.text, note: a.note || '', source, createdAt: a.createdAt });
    if (a.note) st.cards.push(newCard(a.note, a.text, source));
  }
  await save(st);
  toast(anns.length ? `Estudo criado com ${anns.length} trecho(s)` : 'Estudo criado (o documento ainda não tem destaques)');
  openStudy(st.id);
}

function newCard(q, a, source = null) { return { id: uid(), q, a, source, box: 0, due: 0, reviews: 0, lapses: 0, createdAt: Date.now() }; }

// ============================================================
// Tela do estudo
// ============================================================
export async function openStudy(id, tab = 'content') {
  const st = await db.get('studies', id);
  if (!st) return;
  st.items ||= []; st.cards ||= [];
  const root = $('#studyView');
  root.classList.remove('hidden');
  S = { st, tab, root };
  drawStudy();
}

export function closeStudy() {
  if (!S) return false;
  S.root.classList.add('hidden');
  S.root.innerHTML = '';
  S = null;
  renderStudies();
  return true;
}
export const isStudyOpen = () => !!S;

function drawStudy() {
  const { st, root } = S;
  root.innerHTML = '';
  const now = Date.now();
  const due = st.cards.filter(c => (c.due || 0) <= now);
  const tab = (k, label) => h('button' + (S.tab === k ? '.active' : ''), { on: { click: () => { S.tab = k; S.review = null; drawStudy(); } } }, label);
  root.append(
    h('div.fs-top',
      h('button.icon-btn', { on: { click: closeStudy } }, '←'),
      h('div.title.ellipsis', { on: { click: async () => { const t = await prompt('Título do estudo', { value: st.title }); if (t?.trim()) { st.title = t.trim(); await save(st); drawStudy(); } } } }, st.title),
      h('button.icon-btn', { title: 'Exportar', on: { click: () => exportStudy(st) } }, '📤')),
    h('div.tabs', tab('content', `Conteúdo (${st.items.length})`), tab('cards', `Flashcards (${st.cards.length})`), tab('review', `Revisar (${due.length})`)));
  const body = h('div.study-body');
  root.append(body);
  if (S.tab === 'content') drawContent(body);
  else if (S.tab === 'cards') drawCards(body);
  else drawReview(body);
}

function drawContent(body) {
  const { st } = S;
  const descr = h('textarea', { placeholder: 'Objetivo / descrição do estudo…', style: { width: '100%', minHeight: '54px', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px', resize: 'vertical' } }, st.description || '');
  descr.addEventListener('change', async () => { st.description = descr.value; await save(st); });
  body.append(descr);

  // documentos agregados neste estudo
  const docs = new Map();
  st.items.forEach(it => it.source?.docId && docs.set(it.source.docId, it.source.docName));
  if (docs.size) {
    body.append(h('div.section-title', 'Documentos'), h('div.chips', ...[...docs].map(([id, name]) =>
      h('button.chip', { on: { click: () => openSourceDoc({ docId: id }) } }, '📄 ' + truncate(name, 34)))));
  }

  body.append(h('div.row', { style: { margin: '10px 0', flexWrap: 'wrap' } },
    h('button.btn.sm', { on: { click: () => addItem('heading') } }, '＋ Título'),
    h('button.btn.sm', { on: { click: () => addItem('note') } }, '＋ Nota'),
    h('button.btn.sm', { on: { click: importExcerpts } }, '＋ De Trechos'),
    st.items.some(i => i.type === 'excerpt') ? h('button.btn.sm', { on: { click: autoCards } }, '🃏 Gerar flashcards') : null));

  if (!st.items.length) body.append(h('div.empty', 'Adicione títulos, notas ou trechos dos seus documentos.'));
  st.items.forEach((it, i) => {
    const tools = h('div.tools',
      h('button', { title: 'Subir', on: { click: () => moveItem(i, -1) } }, '⬆️'),
      h('button', { title: 'Descer', on: { click: () => moveItem(i, 1) } }, '⬇️'),
      h('button', { title: 'Editar', on: { click: () => editItem(it) } }, '✏️'),
      it.type !== 'heading' ? h('button', { title: 'Criar flashcard', on: { click: () => editCard(null, { a: it.text, q: it.note || '', source: it.source }) } }, '🃏') : null,
      h('button', { title: 'Copiar', on: { click: async () => { await copyText(it.text); toast('Copiado'); } } }, '📋'),
      h('button', { title: 'Excluir', on: { click: () => delItem(i) } }, '🗑️'));
    if (it.type === 'heading') body.append(h('div.study-item.heading', h('div', it.text), tools));
    else body.append(h('div.study-item',
      it.type === 'excerpt' ? h('div.quote', it.text) : h('div', { style: { whiteSpace: 'pre-wrap', lineHeight: '1.5' } }, it.text),
      it.note ? h('div.ann-item', { style: { boxShadow: 'none', background: 'var(--surface-2)', margin: '6px 0 0', cursor: 'default' } }, '📝 ' + it.note) : null,
      it.source ? h('div.src', { on: { click: () => openSourceDoc(it.source) } }, `📖 ${it.source.docName}${it.source.page ? ', p. ' + it.source.page : ''}`) : null,
      tools));
  });
}

async function addItem(type) {
  const text = await prompt(type === 'heading' ? 'Novo título/seção' : 'Nova nota', { multiline: type === 'note', okText: 'Adicionar' });
  if (!text?.trim()) return;
  S.st.items.push({ id: uid(), type, text: text.trim(), createdAt: Date.now() });
  await save(S.st); drawStudy();
}

async function editItem(it) {
  openModal((box, m) => {
    const ta = h('textarea', { autofocus: true }, it.text);
    const note = it.type === 'excerpt' ? h('textarea', { placeholder: 'Sua nota sobre o trecho…' }, it.note || '') : null;
    box.append(h('h3', 'Editar'), h('div.field', h('label', it.type === 'excerpt' ? 'Trecho' : 'Texto'), ta),
      note ? h('div.field', h('label', 'Nota'), note) : null,
      h('div.actions', h('button.btn.ghost', { on: { click: () => m.close() } }, 'Cancelar'),
        h('button.btn.primary', { on: { click: async () => { it.text = ta.value.trim() || it.text; if (note) it.note = note.value.trim(); await save(S.st); m.close(); drawStudy(); } } }, 'Salvar')));
  });
}

async function moveItem(i, d) {
  const j = i + d, items = S.st.items;
  if (j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  await save(S.st); drawStudy();
}

async function delItem(i) {
  if (!await confirmDialog('Remover item?', truncate(S.st.items[i].text, 100), { okText: 'Remover', danger: true })) return;
  S.st.items.splice(i, 1);
  await save(S.st); drawStudy();
}

async function importExcerpts() {
  const ex = (await db.all('excerpts')).sort((a, b) => b.createdAt - a.createdAt);
  if (!ex.length) { toast('Nenhum trecho salvo ainda'); return; }
  openModal((box, m) => {
    const sel = new Set();
    box.append(h('h3', 'Adicionar trechos salvos'));
    ex.forEach(e => {
      const cb = h('input', { type: 'checkbox', on: { change: ev => ev.target.checked ? sel.add(e) : sel.delete(e) } });
      box.append(h('label.list-item', { style: { boxShadow: 'none', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px' } }, cb,
        h('div.body', h('div', truncate(e.text, 160)), h('div.small.muted', `${e.docName || ''}${e.page ? ', p. ' + e.page : ''}`))));
    });
    box.append(h('div.actions', h('button.btn.ghost', { on: { click: () => m.close() } }, 'Cancelar'),
      h('button.btn.primary', { on: { click: async () => {
        for (const e of sel) S.st.items.push({ id: uid(), type: 'excerpt', text: e.text, note: e.note || '', source: { docId: e.docId, docName: e.docName, docType: e.docType, page: e.page, start: e.start, end: e.end }, createdAt: Date.now() });
        await save(S.st); m.close(); drawStudy(); toast(`${sel.size} trecho(s) adicionados`);
      } } }, 'Adicionar')));
  });
}

async function autoCards() {
  const existing = new Set(S.st.cards.map(c => c.a));
  let n = 0;
  for (const it of S.st.items) {
    if (it.type !== 'excerpt' || existing.has(it.text)) continue;
    const q = it.note ? it.note : clozeQuestion(it.text);
    S.st.cards.push(newCard(q.q || q, q.a || it.text, it.source));
    n++;
  }
  await save(S.st);
  toast(n ? `${n} flashcard(s) criados` : 'Todos os trechos já têm flashcards');
  S.tab = 'cards'; drawStudy();
}

/** Cria uma pergunta de lacuna, ocultando a palavra mais longa do trecho. */
function clozeQuestion(text) {
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}-]{4,}/gu) || [];
  if (!words.length) return { q: 'Explique: ' + truncate(text, 120), a: text };
  const key = words.reduce((a, b) => (b.length > a.length ? b : a));
  return { q: 'Complete a lacuna:\n\n' + truncate(text.replace(key, '_____'), 400), a: key + '\n\n' + truncate(text, 400) };
}

function drawCards(body) {
  const { st } = S;
  body.append(h('div.row', { style: { marginBottom: '10px' } },
    h('button.btn.primary.sm', { on: { click: () => editCard() } }, '＋ Novo flashcard'),
    st.items.some(i => i.type === 'excerpt') ? h('button.btn.sm', { on: { click: autoCards } }, '🃏 Gerar dos trechos') : null));
  if (!st.cards.length) body.append(h('div.empty', h('span.big', '🃏'), 'Nenhum flashcard.', h('br'), 'Crie cartões de pergunta e resposta para revisar com repetição espaçada.'));
  const now = Date.now();
  st.cards.forEach(c => body.append(h('div.study-item',
    h('div', { style: { fontWeight: 600, whiteSpace: 'pre-wrap' } }, truncate(c.q, 200)),
    h('div.small.muted', { style: { marginTop: '4px', whiteSpace: 'pre-wrap' } }, truncate(c.a, 200)),
    h('div.row.small.muted', { style: { marginTop: '6px' } },
      h('span.grow', `Caixa ${c.box || 0}/5 · ${(c.due || 0) <= now ? 'para revisar' : 'próxima: ' + fmtDate(c.due)}`),
      h('button.btn.sm.ghost', { on: { click: () => editCard(c) } }, '✏️'),
      h('button.btn.sm.ghost', { on: { click: async () => { if (await confirmDialog('Excluir flashcard?', truncate(c.q, 80), { okText: 'Excluir', danger: true })) { st.cards = st.cards.filter(x => x !== c); await save(st); drawStudy(); } } } }, '🗑️')))));
}

function editCard(card, preset = {}) {
  openModal((box, m) => {
    const q = h('textarea', { autofocus: true, placeholder: 'Pergunta / frente' }, card?.q ?? preset.q ?? '');
    const a = h('textarea', { placeholder: 'Resposta / verso' }, card?.a ?? preset.a ?? '');
    box.append(h('h3', card ? 'Editar flashcard' : 'Novo flashcard'),
      h('div.field', h('label', 'Frente (pergunta)'), q), h('div.field', h('label', 'Verso (resposta)'), a),
      h('div.actions', h('button.btn.ghost', { on: { click: () => m.close() } }, 'Cancelar'),
        h('button.btn.primary', { on: { click: async () => {
          if (!q.value.trim() || !a.value.trim()) { toast('Preencha frente e verso'); return; }
          if (card) { card.q = q.value.trim(); card.a = a.value.trim(); }
          else S.st.cards.push(newCard(q.value.trim(), a.value.trim(), preset.source || null));
          await save(S.st); m.close();
          if (!card) toast('Flashcard criado');
          drawStudy();
        } } }, 'Salvar')));
  });
}

// ---------- revisão ----------
function drawReview(body) {
  const { st } = S;
  const now = Date.now();
  if (!S.review) {
    const due = st.cards.filter(c => (c.due || 0) <= now).sort(() => Math.random() - 0.5);
    S.review = { queue: due, idx: 0, show: false, ok: 0, bad: 0 };
  }
  const R = S.review;
  const mastered = st.cards.filter(c => (c.box || 0) >= 4).length;
  body.append(h('div.stat-row',
    h('div.stat', h('b', st.cards.length), h('span', 'total')),
    h('div.stat', h('b', Math.max(0, R.queue.length - R.idx)), h('span', 'restantes')),
    h('div.stat', h('b', mastered), h('span', 'dominados'))));
  if (!st.cards.length) { body.append(h('div.empty', 'Crie flashcards para começar a revisar.')); return; }
  if (R.idx >= R.queue.length) {
    const next = st.cards.reduce((m, c) => Math.min(m, c.due || 0), Infinity);
    body.append(h('div.empty', h('span.big', '🎉'), h('b', R.queue.length ? 'Revisão concluída!' : 'Nada para revisar agora.'), h('br'),
      R.queue.length ? `Acertos: ${R.ok} · Erros: ${R.bad}` : '', h('br'),
      next < Infinity && next > now ? `Próxima revisão: ${fmtDate(next)}` : ''),
      h('div.row', { style: { justifyContent: 'center' } },
        h('button.btn', { on: { click: () => { st.cards.forEach(c => c.due = 0); save(st); S.review = null; drawStudy(); } } }, 'Revisar todos agora')));
    return;
  }
  const c = R.queue[R.idx];
  body.append(h('div.flashcard', h('div.face', c.q)));
  if (!R.show) {
    body.append(h('div.row', { style: { justifyContent: 'center', marginTop: '12px' } },
      h('button.btn.primary', { style: { padding: '14px 28px' }, on: { click: () => { R.show = true; drawStudy(); } } }, 'Mostrar resposta')));
  } else {
    body.append(h('div.flashcard', h('div.face.answer', c.a)),
      c.source ? h('div.src', { style: { textAlign: 'center' }, on: { click: () => openSourceDoc(c.source) } }, `📖 ${c.source.docName}${c.source.page ? ', p. ' + c.source.page : ''}`) : null,
      h('div.review-btns',
        h('button.btn.danger', { on: { click: () => grade(c, 0) } }, '❌ Errei'),
        h('button.btn', { on: { click: () => grade(c, 1) } }, '😐 Difícil'),
        h('button.btn.primary', { on: { click: () => grade(c, 2) } }, '✅ Acertei')));
  }
}

async function grade(c, g) {
  const now = Date.now();
  c.reviews = (c.reviews || 0) + 1;
  if (g === 0) { c.box = 0; c.lapses = (c.lapses || 0) + 1; c.due = now + 10 * 60000; S.review.bad++; }
  else if (g === 1) { c.box = Math.max(1, c.box || 0); c.due = now + Math.max(0.5, INTERVALS[c.box] / 2) * DAY; S.review.ok++; }
  else { c.box = Math.min(5, (c.box || 0) + 1); c.due = now + INTERVALS[c.box] * DAY; S.review.ok++; }
  c.lastReview = now;
  await save(S.st);
  S.review.idx++; S.review.show = false;
  drawStudy();
}

// ---------- utilidades ----------
async function openSourceDoc(src) {
  const d = await db.get('docs', src.docId);
  if (!d) { toast('Documento de origem não está mais na biblioteca'); return; }
  openReader(src.docId, src.page ? { page: src.page } : {});
}

function studyMarkdown(st) {
  let md = `# ${st.title}\n\n`;
  if (st.description) md += st.description + '\n\n';
  for (const it of st.items) {
    if (it.type === 'heading') md += `## ${it.text}\n\n`;
    else if (it.type === 'note') md += it.text + '\n\n';
    else {
      md += `> ${it.text.replace(/\n/g, '\n> ')}\n\n`;
      if (it.source) md += `— ${it.source.docName}${it.source.page ? ', p. ' + it.source.page : ''}\n\n`;
      if (it.note) md += `**Nota:** ${it.note}\n\n`;
    }
  }
  if (st.cards.length) {
    md += '## Flashcards\n\n';
    st.cards.forEach((c, i) => md += `**${i + 1}. ${c.q.replace(/\n+/g, ' ')}**\n\n${c.a}\n\n`);
  }
  return md;
}

function exportStudy(st) {
  const md = studyMarkdown(st);
  actionMenu('Exportar estudo', [
    { icon: '📋', label: 'Copiar (Markdown)', action: async () => { await copyText(md); toast('Copiado'); } },
    { icon: '📤', label: 'Compartilhar', action: () => shareText(st.title, md) },
    { icon: '💾', label: 'Salvar arquivo .md', action: () => saveBlob(new Blob([md], { type: 'text/markdown' }), st.title + '.md') },
  ]);
}
