// Mais: tema, backup/restauração, armazenamento, sobre
import { db, STORES } from './db.js';
import { $, h, toast, confirmDialog, fmtSize, saveBlob, openModal } from './util.js';
import { emitDocsChanged } from './docs.js';

const MAGIC = 'LEITORBAK1';

export async function renderMore() {
  const root = $('#view-more');
  root.innerHTML = '';
  const docs = await db.all('docs');
  const total = docs.reduce((s, d) => s + (d.size || 0), 0);
  let est = null;
  try { est = await navigator.storage?.estimate(); } catch (e) { }
  const theme = (await db.setting('appTheme')) || 'light';

  const item = (ic, title, sub, fn) => h('div.list-item', { on: { click: fn } }, h('span.ic', ic), h('div.body', h('div.title', title), sub ? h('div.small.muted', sub) : null));
  root.append(h('div.settings',
    h('div.section-title', 'Aparência'),
    item(theme === 'dark' ? '☀️' : '🌙', theme === 'dark' ? 'Tema claro' : 'Tema escuro', 'Aparência do aplicativo', async () => {
      const t = theme === 'dark' ? 'light' : 'dark';
      await db.setting('appTheme', t); applyTheme(t); renderMore();
    }),
    h('div.section-title', 'Armazenamento (off-line)'),
    h('div.card',
      h('div', `${docs.length} documento(s) · ${fmtSize(total)}`),
      est ? h('div.small.muted', `Em uso pelo app: ${fmtSize(est.usage || 0)}${est.quota ? ' de ' + fmtSize(est.quota) + ' disponíveis' : ''}`) : null,
      est?.quota ? h('div.storage-bar', h('i', { style: { width: Math.min(100, (est.usage / est.quota) * 100).toFixed(1) + '%' } })) : null),
    h('div.section-title', 'Backup'),
    item('💾', 'Fazer backup completo', 'Documentos, anotações, trechos, mapas e estudos em um arquivo .leitorbak', exportBackup),
    item('📥', 'Restaurar backup', 'Importa um arquivo .leitorbak', () => $('#backupInput').click()),
    h('div.section-title', 'Dados'),
    item('🧹', 'Apagar todos os dados', 'Remove tudo deste aparelho', async () => {
      if (!await confirmDialog('Apagar tudo?', 'Todos os documentos, anotações, mapas e estudos serão apagados deste aparelho. Faça um backup antes.', { okText: 'Apagar tudo', danger: true })) return;
      for (const s of STORES) await db.clear(s);
      emitDocsChanged(); toast('Dados apagados'); renderMore();
    }),
    h('div.section-title', 'Sobre'),
    h('div.card.small',
      h('b', 'Leitor & Estudos 1.0'), h('br'),
      'Leitor, organizador e agregador de PDF e DOCX com marcadores, destaques, notas, trechos, mapas mentais e estudos com flashcards. Funciona 100% off-line: nenhum dado sai do aparelho.', h('br'), h('br'),
      h('span.muted', 'Usa pdf.js (Apache-2.0) e mammoth.js (BSD-2-Clause).'))));
}

export function applyTheme(t) {
  document.documentElement.dataset.theme = t;
}

// ---------- Backup ----------
async function exportBackup() {
  toast('Preparando backup…');
  const stores = {};
  for (const s of STORES) if (s !== 'files') stores[s] = await db.all(s);
  const files = await db.all('files');
  const meta = { version: 1, exportedAt: Date.now(), stores, files: files.map(f => ({ id: f.id, size: f.blob.size, type: f.blob.type })) };
  const metaBytes = new TextEncoder().encode(JSON.stringify(meta));
  const header = new Uint8Array(MAGIC.length + 4);
  header.set(new TextEncoder().encode(MAGIC), 0);
  new DataView(header.buffer).setUint32(MAGIC.length, metaBytes.length, true);
  const blob = new Blob([header, metaBytes, ...files.map(f => f.blob)], { type: 'application/octet-stream' });
  const d = new Date();
  const name = `leitor-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.leitorbak`;
  await saveBlob(blob, name);
}

export function initBackupInput() {
  $('#backupInput').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) await importBackup(f);
  });
}

async function importBackup(file) {
  try {
    const head = new Uint8Array(await file.slice(0, MAGIC.length + 4).arrayBuffer());
    if (new TextDecoder().decode(head.slice(0, MAGIC.length)) !== MAGIC) { toast('Arquivo de backup inválido'); return; }
    const metaLen = new DataView(head.buffer).getUint32(MAGIC.length, true);
    let off = MAGIC.length + 4;
    const meta = JSON.parse(new TextDecoder().decode(await file.slice(off, off + metaLen).arrayBuffer()));
    off += metaLen;
    const mode = await new Promise(res => openModal((box, m) => {
      box.append(h('h3', 'Restaurar backup'),
        h('p.muted', `Backup de ${new Date(meta.exportedAt).toLocaleString('pt-BR')} com ${meta.stores.docs?.length || 0} documento(s).`),
        h('div.actions',
          h('button.btn.ghost', { on: { click: () => m.close(null) } }, 'Cancelar'),
          h('button.btn', { on: { click: () => m.close('merge') } }, 'Mesclar'),
          h('button.btn.danger', { on: { click: () => m.close('replace') } }, 'Substituir tudo')));
    }, { onClose: v => res(v || null) }));
    if (!mode) return;
    toast('Restaurando…');
    if (mode === 'replace') for (const s of STORES) await db.clear(s);
    for (const fm of meta.files) {
      const blob = file.slice(off, off + fm.size, fm.type);
      off += fm.size;
      await db.put('files', { id: fm.id, blob: new Blob([await blob.arrayBuffer()], { type: fm.type }) });
    }
    for (const [s, list] of Object.entries(meta.stores)) if (STORES.includes(s) && s !== 'files') await db.putMany(s, list);
    emitDocsChanged();
    toast('Backup restaurado ✔');
    renderMore();
  } catch (err) {
    console.error(err);
    toast('Falha ao restaurar: ' + (err.message || err));
  }
}
