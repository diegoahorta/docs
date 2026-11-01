/** MÓDULO 8 — Geração da apostila DOCX no navegador (versões aluno e professor). */
import { h, download, toast } from '../core/dom.js';
import { buildApostila } from '../core/docx-builder.js';
import { assetUrl } from '../core/unit-loader.js';

let docxPromise = null;
/** Carrega vendor/docx.iife.js sob demanda (≈800 KB), só quando o usuário gera um documento. */
export function loadDocx() {
  if (globalThis.docx) return Promise.resolve(globalThis.docx);
  docxPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/docx.iife.js';
    s.onload = () => resolve(globalThis.docx);
    s.onerror = () => { docxPromise = null; reject(new Error('Não foi possível carregar a biblioteca docx.')); };
    document.head.append(s);
  });
  return docxPromise;
}

export async function generate(unit, version, audioBaseUrl) {
  const docx = await loadDocx();
  const doc = buildApostila(docx, unit, { version, audioBaseUrl });
  const blob = await docx.Packer.toBlob(doc);
  download(`${unit.id}-${version === 'student' ? 'aluno' : 'professor'}.docx`, blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

export function render(ctx) {
  const { unit } = ctx;
  const guess = !globalThis.__ODU_EMBED__ && location.protocol.startsWith('http') && !/^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname)
    ? new URL(unit._base, location.href).href : '';
  const base = h('input', { type: 'url', id: 'audio-base', value: unit.audioBaseUrl || guess, placeholder: 'https://seu-site.com/odu-creative/units/en-a1-cafe/' });
  const status = h('p', { class: 'small', 'aria-live': 'polite' });
  const btn = (version, label) => h('button', { class: `btn ${version === 'teacher' ? 'accent' : 'primary'}`, onClick: async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    status.textContent = 'Gerando documento…';
    try { await generate(unit, version, base.value.trim()); status.textContent = '✓ Documento gerado. Verifique seus downloads.'; }
    catch (err) { status.textContent = `Erro: ${err.message}`; toast(err.message); }
    b.disabled = false;
  } }, label);

  const prebuilt = unit._edited ? null : h('p', { class: 'small' }, 'Versões pré-geradas desta unidade (sem links de áudio): ',
    h('a', { href: assetUrl(`${unit._base}docs/${unit.id}-aluno.docx`), download: `${unit.id}-aluno.docx` }, 'aluno'), ' · ',
    h('a', { href: assetUrl(`${unit._base}docs/${unit.id}-professor.docx`), download: `${unit.id}-professor.docx` }, 'professor'), '.');

  return h('div', {},
    h('header', { class: 'page-head' }, h('div', { class: 'eyebrow' }, 'Módulo 8 · Materiais'), h('h1', {}, 'Apostila ODU CREATIVE (DOCX)'),
      h('p', {}, 'Gera um arquivo Word com as 17 seções da apostila: capa, objetivos, vocabulário, listening, transcrição, gramática, descoberta, chunks, exercícios, avaliação, conversação, escrita, gabarito, distratores, plano de revisão e referências.')),
    h('section', { class: 'card' },
      h('label', { class: 'field', for: 'audio-base' }, 'URL pública da pasta da unidade (para links de áudio)'), base,
      h('p', { class: 'small muted' }, 'O DOCX não contém áudio incorporado. Com uma URL pública, cada faixa recebe um link clicável. Sem URL, a apostila indica onde ouvir na plataforma. QR codes são incluídos ao gerar pela linha de comando (npm run build:docx -- --audio-base URL).'),
      h('div', { class: 'row' }, btn('student', '⬇ Versão do aluno'), btn('teacher', '⬇ Versão do professor (com gabarito)')),
      status, prebuilt,
      unit._edited ? h('p', { class: 'notice' }, 'Esta unidade foi editada no Painel do Professor: o documento usa a versão editada.') : null));
}
