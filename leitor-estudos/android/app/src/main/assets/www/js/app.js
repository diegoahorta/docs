// Ponto de entrada: navegação, botão voltar do Android, arquivos recebidos
import { db } from './db.js';
import { $, $$, h, closeTopModal, toast } from './util.js';
import { initLibrary, renderLibrary, pickFiles } from './library.js';
import { importFiles } from './docs.js';
import { openReader, readerBack } from './reader.js';
import { renderExcerpts } from './excerpts.js';
import { renderMaps, closeMap } from './mindmap.js';
import { renderStudies, closeStudy } from './study.js';
import { renderMore, applyTheme, initBackupInput } from './more.js';

const VIEWS = {
  library: { title: 'Biblioteca', render: renderLibrary },
  excerpts: { title: 'Trechos', render: renderExcerpts },
  maps: { title: 'Mapas mentais', render: renderMaps },
  studies: { title: 'Estudos', render: renderStudies },
  more: { title: 'Mais', render: renderMore },
};
let current = 'library';

export function show(view) {
  current = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('#bottomnav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $('#topTitle').textContent = VIEWS[view].title;
  const actions = $('#topActions');
  actions.innerHTML = '';
  if (view === 'library') actions.append(h('button.icon-btn', { title: 'Adicionar', on: { click: pickFiles } }, '📥'));
  VIEWS[view].render();
}

$$('#bottomnav button').forEach(b => b.addEventListener('click', () => show(b.dataset.view)));

// Botão voltar (chamado pelo nativo). Retorna true se tratado.
window.onAndroidBack = () => {
  if (closeTopModal()) return true;
  if (readerBack()) return true;
  if (closeMap()) return true;
  if (closeStudy()) return true;
  if (current !== 'library') { show('library'); return true; }
  return false;
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') window.onAndroidBack(); });

// Arquivos abertos com "Abrir com…" / "Compartilhar"
window.onAndroidIncoming = async list => {
  const files = [];
  for (const it of list) {
    try {
      const r = await fetch('/__incoming/' + it.id);
      const blob = await r.blob();
      let name = it.name || 'documento';
      if (!/\.(pdf|docx)$/i.test(name)) name += it.mime === 'application/pdf' ? '.pdf' : '.docx';
      files.push(new File([blob], name, { type: it.mime || blob.type }));
    } catch (e) { toast('Não foi possível receber o arquivo'); }
  }
  if (!files.length) return;
  // evita duplicatas: se já existir um documento com mesmo nome e tamanho, só abre
  const docs = await db.all('docs');
  const toImport = [];
  let openId = null;
  for (const f of files) {
    const ex = docs.find(d => d.fileName === f.name && d.size === f.size);
    if (ex) openId ||= ex.id; else toImport.push(f);
  }
  const added = await importFiles(toImport);
  openId ||= added[0]?.id;
  if (openId) openReader(openId);
};

(async function init() {
  applyTheme((await db.setting('appTheme')) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  initLibrary();
  initBackupInput();
  show('library');
})();
