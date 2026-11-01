/**
 * Utilitários de DOM sem dependências.
 * h('button', {class: 'btn', onClick: fn}, 'Texto') cria elementos de forma declarativa.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v; // usar apenas com conteúdo confiável e já escapado
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

/** Anuncia uma mensagem para leitores de tela. */
export function announce(msg) {
  const a = document.getElementById('announcer');
  if (!a) return;
  a.textContent = '';
  setTimeout(() => (a.textContent = msg), 30);
}

export function toast(msg, { kind = '', timeout = 3500 } = {}) {
  const region = document.getElementById('toasts');
  if (!region) return;
  const t = h('div', { class: `toast ${kind}` }, msg);
  region.append(t);
  setTimeout(() => t.remove(), timeout);
}

export function shuffle(arr, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmtTime(sec) {
  if (!isFinite(sec)) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtMoney(v, cur = '$') {
  return `${cur}${Number(v).toFixed(2)}`;
}

export function progressBar(ratio, label) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': label || `${pct}%` },
    h('span', { style: { width: `${pct}%` } }));
}

/** Cria um grupo de abas acessível. tabs: [{id, label, render: () => Node}] */
export function tabs(items, { initial = 0, onChange, label = 'Seções' } = {}) {
  const list = h('div', { class: 'tabs', role: 'tablist', 'aria-label': label });
  const panel = h('div', { role: 'tabpanel', tabindex: '0' });
  const btns = items.map((it, i) =>
    h('button', {
      class: 'btn small', role: 'tab', id: `tab-${it.id}`, 'aria-selected': 'false', tabindex: '-1',
      onClick: () => select(i),
      onKeydown: (e) => {
        if (e.key === 'ArrowRight') { select((i + 1) % items.length); btns[(i + 1) % items.length].focus(); }
        if (e.key === 'ArrowLeft') { const j = (i - 1 + items.length) % items.length; select(j); btns[j].focus(); }
      },
    }, it.label));
  list.append(...btns);
  function select(i) {
    btns.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    panel.setAttribute('aria-labelledby', `tab-${items[i].id}`);
    clear(panel).append(items[i].render());
    onChange?.(items[i].id, i);
  }
  select(Math.max(0, Math.min(initial, items.length - 1)));
  return { el: h('div', {}, list, panel), select };
}

export function download(filename, data, type = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
