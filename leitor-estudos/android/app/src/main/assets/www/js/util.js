// Utilitários gerais de UI e plataforma
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const bridge = window.AndroidBridge || null;

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Cria elemento: h('div.cls#id', {attrs, on:{click}}, children...) */
export function h(tag, attrs, ...children) {
  const m = tag.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach(t => t[0] === '.' ? el.classList.add(t.slice(1)) : (el.id = t.slice(1)));
  if (attrs != null && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { children.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

export function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function fmtDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
export function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}
export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
export function truncate(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
export function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ---------- Área de transferência ----------
export async function copyText(text) {
  if (bridge) { bridge.copyText(text); return true; }
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { }
  const ta = h('textarea', { style: { position: 'fixed', opacity: 0 } }, text);
  document.body.append(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) { }
  ta.remove();
  return true;
}

export function shareText(title, text) {
  if (bridge) return bridge.shareText(title, text);
  if (navigator.share) return navigator.share({ title, text }).catch(() => { });
  copyText(text); toast('Copiado para a área de transferência');
}

// ---------- Salvar arquivos (nativo: seletor "Salvar como") ----------
const saveWaiters = {};
window.onAndroidSaved = (id, ok) => { saveWaiters[id]?.(ok); delete saveWaiters[id]; };

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Salva um Blob no dispositivo. */
export async function saveBlob(blob, fileName) {
  if (bridge && bridge.beginSave) {
    const id = bridge.beginSave();
    if (!id) { toast('Falha ao salvar'); return false; }
    const CH = 768 * 1024;
    for (let off = 0; off < blob.size; off += CH) {
      const buf = new Uint8Array(await blob.slice(off, off + CH).arrayBuffer());
      if (!bridge.appendSave(id, bytesToB64(buf))) { toast('Falha ao salvar'); return false; }
    }
    const ok = await new Promise(res => { saveWaiters[id] = res; bridge.finishSave(id, fileName, blob.type || 'application/octet-stream'); });
    toast(ok ? 'Arquivo salvo' : 'Salvamento cancelado');
    return ok;
  }
  const a = h('a', { href: URL.createObjectURL(blob), download: fileName });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

// ---------- Modais ----------
const modalStack = [];
export function openModal(build, { onClose } = {}) {
  const back = h('div.modal-back');
  const box = h('div.modal');
  back.append(box);
  const api = {
    close(v) {
      if (!back.isConnected) return;
      back.remove();
      modalStack.splice(modalStack.indexOf(api), 1);
      onClose?.(v);
    }, el: box
  };
  back.addEventListener('click', e => { if (e.target === back) api.close(); });
  build(box, api);
  $('#modalRoot').append(back);
  modalStack.push(api);
  const f = box.querySelector('[autofocus]');
  if (f) setTimeout(() => f.focus(), 60);
  return api;
}
export function closeTopModal() {
  const m = modalStack[modalStack.length - 1];
  if (m) { m.close(); return true; }
  return false;
}

export function prompt(title, { value = '', placeholder = '', multiline = false, okText = 'Salvar', label = '' } = {}) {
  return new Promise(res => {
    openModal((box, m) => {
      const input = multiline
        ? h('textarea', { placeholder, autofocus: true }, value)
        : h('input', { type: 'text', value, placeholder, autofocus: true });
      if (!multiline) input.addEventListener('keydown', e => { if (e.key === 'Enter') { m.close(input.value); } });
      box.append(
        h('h3', title),
        h('div.field', label ? h('label', label) : null, input),
        h('div.actions',
          h('button.btn.ghost', { on: { click: () => m.close(null) } }, 'Cancelar'),
          h('button.btn.primary', { on: { click: () => m.close(input.value) } }, okText))
      );
    }, { onClose: v => res(v == null ? null : v) });
  });
}

export function confirmDialog(title, msg, { okText = 'Confirmar', danger = false } = {}) {
  return new Promise(res => {
    openModal((box, m) => {
      box.append(
        h('h3', title), h('p.muted', msg),
        h('div.actions',
          h('button.btn.ghost', { on: { click: () => m.close(false) } }, 'Cancelar'),
          h(danger ? 'button.btn.danger' : 'button.btn.primary', { on: { click: () => m.close(true) } }, okText))
      );
    }, { onClose: v => res(!!v) });
  });
}

/** Menu de ações: items = [{icon, label, action, danger}] */
export function actionMenu(title, items) {
  return openModal((box, m) => {
    box.append(h('h3', title));
    const list = h('div.menu-list');
    for (const it of items.filter(Boolean)) {
      list.append(h(it.danger ? 'button.danger' : 'button', { on: { click: () => { m.close(); it.action(); } } },
        h('span.ic', it.icon || '•'), it.label));
    }
    box.append(list);
  });
}

/** Lista para escolher um item ou criar novo. */
export function pickFrom(title, items, { newLabel, render } = {}) {
  return new Promise(res => {
    openModal((box, m) => {
      box.append(h('h3', title));
      const list = h('div.pick-list');
      if (newLabel) list.append(h('div.list-item', { on: { click: () => m.close({ isNew: true }) } }, h('span', '➕'), h('div.body.title', newLabel)));
      for (const it of items) list.append(h('div.list-item', { on: { click: () => m.close(it) } }, render ? render(it) : h('div.body.title', it.title || it.name)));
      if (!items.length && !newLabel) list.append(h('p.muted', 'Nada aqui ainda.'));
      box.append(list, h('div.actions', h('button.btn.ghost', { on: { click: () => m.close(null) } }, 'Cancelar')));
    }, { onClose: v => res(v || null) });
  });
}

export const COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'];
export const COLOR_NAMES = { yellow: 'Amarelo', green: 'Verde', blue: 'Azul', pink: 'Rosa', orange: 'Laranja' };
