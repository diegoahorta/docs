// Importação, conversão e indexação de documentos (PDF e DOCX)
import { db } from './db.js';
import { uid, toast } from './util.js';

const pdfjsLib = window.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdfjs/pdf.worker.min.js';

export const PDF_OPTS = {
  cMapUrl: 'lib/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'lib/pdfjs/standard_fonts/',
  isEvalSupported: false, // segurança
  enableXfa: false,
};

export function loadPdf(arrayBuffer) {
  return pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer), ...PDF_OPTS }).promise;
}

export const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function detectType(name = '', mime = '') {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf') || mime === MIME.pdf) return 'pdf';
  if (n.endsWith('.docx') || mime === MIME.docx) return 'docx';
  return null;
}

/** Converte DOCX em HTML seguro. */
export async function docxToHtml(arrayBuffer) {
  const res = await window.mammoth.convertToHtml({ arrayBuffer }, {
    styleMap: [
      "p[style-name='Title'] => h1.doc-title:fresh",
      "p[style-name='Subtitle'] => h2.doc-subtitle:fresh",
      "p[style-name='Quote'] => blockquote:fresh",
      "p[style-name='Citação'] => blockquote:fresh",
      "p[style-name='Título'] => h1.doc-title:fresh",
    ],
  });
  return sanitizeHtml(res.value);
}

/** Remove scripts/handlers e links perigosos do HTML gerado. */
export function sanitizeHtml(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  tpl.content.querySelectorAll('script,iframe,object,embed,link,meta,style,form').forEach(e => e.remove());
  tpl.content.querySelectorAll('*').forEach(el => {
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase();
      if (n.startsWith('on')) el.removeAttribute(a.name);
      if ((n === 'href' || n === 'src') && !/^(#|data:image\/)/i.test(a.value.trim())) {
        if (n === 'href') { el.setAttribute('data-href', a.value); el.removeAttribute('href'); }
        else el.removeAttribute(a.name);
      }
    }
  });
  return tpl.innerHTML;
}

function htmlToText(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  d.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,tr,br').forEach(e => e.append('\n'));
  return d.textContent;
}

async function pdfThumb(pdf) {
  try {
    const page = await pdf.getPage(1);
    const vp0 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 260 / vp0.width });
    const c = document.createElement('canvas');
    c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return c.toDataURL('image/jpeg', 0.72);
  } catch (e) { return null; }
}

/** Extrai texto de cada página do PDF (para busca global e dentro do documento). */
export async function extractPdfText(pdf, onProgress) {
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const p = await pdf.getPage(i);
      const tc = await p.getTextContent();
      pages.push(tc.items.map(it => (it.str || '') + (it.hasEOL ? '\n' : '')).join(''));
      p.cleanup();
    } catch (e) { pages.push(''); }
    if (onProgress && i % 10 === 0) onProgress(i, pdf.numPages);
  }
  return pages;
}

let listeners = [];
export function onDocsChanged(fn) { listeners.push(fn); }
export function emitDocsChanged() { listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }

/** Importa um arquivo (Blob/File) para a biblioteca. Retorna o documento criado. */
export async function importFile(blob, fileName) {
  const type = detectType(fileName, blob.type);
  if (!type) throw new Error('Formato não suportado: ' + fileName);
  const buf = await blob.arrayBuffer();
  const id = uid();
  const doc = {
    id, type, fileName,
    name: fileName.replace(/\.(pdf|docx)$/i, ''),
    size: buf.byteLength,
    addedAt: Date.now(), openedAt: 0,
    collections: [], fav: false, progress: 0, pages: 0, lastPos: null, indexed: false,
  };
  await db.put('files', { id, blob: new Blob([buf], { type: MIME[type] }) });

  if (type === 'pdf') {
    const pdf = await loadPdf(buf.slice(0));
    doc.pages = pdf.numPages;
    doc.thumb = await pdfThumb(pdf);
    try {
      const meta = await pdf.getMetadata();
      if (meta?.info?.Author) doc.author = String(meta.info.Author).slice(0, 120);
    } catch (e) { }
    await db.put('docs', doc);
    emitDocsChanged();
    // indexação em segundo plano
    extractPdfText(pdf).then(async pages => {
      await db.put('texts', { id, pages });
      const d = await db.get('docs', id);
      if (d) { d.indexed = true; await db.put('docs', d); }
      pdf.destroy();
    }).catch(() => pdf.destroy());
  } else {
    const html = await docxToHtml(buf);
    const plain = htmlToText(html);
    doc.thumbText = plain.slice(0, 600);
    doc.words = (plain.match(/\S+/g) || []).length;
    doc.indexed = true;
    await db.put('texts', { id, html, pages: [plain] });
    await db.put('docs', doc);
    emitDocsChanged();
  }
  return doc;
}

export async function importFiles(files) {
  const out = [];
  for (const f of files) {
    try {
      toast('Importando ' + f.name + '…');
      out.push(await importFile(f, f.name));
    } catch (e) {
      console.error(e);
      toast('Erro ao importar ' + f.name + ': ' + (e.message || e));
    }
  }
  if (out.length) toast(out.length === 1 ? 'Documento adicionado' : out.length + ' documentos adicionados');
  return out;
}

export async function deleteDoc(id) {
  await db.del('docs', id);
  await db.del('files', id);
  await db.del('texts', id);
  for (const a of await db.byDoc('annotations', id)) await db.del('annotations', a.id);
  emitDocsChanged();
}

export async function getFileBuffer(id) {
  const f = await db.get('files', id);
  if (!f) throw new Error('Arquivo não encontrado');
  return f.blob.arrayBuffer();
}
