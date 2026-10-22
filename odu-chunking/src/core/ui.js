import { gsap } from 'gsap';
import { BLOCKS, LANGS } from '../config.js';
import { sentenceText, tileText } from './blocks.js';
import { canSpeak, speak } from './speech.js';
import { reducedMotion } from './theme.js';

/** Cria um elemento: h('div.classe', { atributos }, ...filhos) */
export function h(tag, attrs = {}, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const SPEAKER_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';

export function sayButton(text, lang, label = 'Ouvir') {
  return h('button.say', {
    type: 'button',
    title: canSpeak() ? `${label}: ${text}` : 'Áudio indisponível neste navegador',
    'aria-label': `${label}: ${text}`,
    disabled: !canSpeak(),
    html: SPEAKER_SVG,
    onclick: () => speak(text, lang),
  });
}

export const blockName = (id) => BLOCKS.find((b) => b.id === id)?.rotulo ?? '';

/** Um bloco colorido; clique lê o bloco no idioma. */
export function chip(block, lang) {
  const text = tileText(block.t);
  return h(
    `button.chip.b${block.b}`,
    {
      type: 'button',
      'data-b': block.b,
      title: blockName(block.b),
      onclick: () => speak(text, lang),
    },
    text,
  );
}

/** Linha de blocos de uma frase, com a pontuação final. */
export function chipLine(lang, blocks, p = '') {
  const line = h('div.chip-line', { lang });
  // No espanhol, ¿ ¡ abrem a última oração (depois de um bloco que termina em ponto).
  const opener = lang === 'es' ? { '?': '¿', '!': '¡' }[p] : null;
  const openAt = opener ? blocks.findLastIndex((b) => /[.!?]$/.test(b.t)) + 1 : -1;
  blocks.forEach((b, i) => {
    if (i === openAt) line.append(h('span.punct.open', {}, opener));
    line.append(chip(b, lang));
  });
  if (p) line.append(h('span.punct', {}, p));
  return line;
}

/** Destaca a mesma categoria de bloco em todos os idiomas ao passar o mouse. */
export function linkHighlights(root) {
  const set = (b) => {
    root.querySelectorAll('.chip[data-b]').forEach((c) => {
      const same = b != null && c.dataset.b === b;
      c.classList.toggle('dim', b != null && !same);
      c.classList.toggle('lift', same);
    });
  };
  root.addEventListener('pointerover', (e) => {
    const c = e.target.closest('.chip[data-b]');
    if (c) set(c.dataset.b);
  });
  root.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget || !root.contains(e.relatedTarget.closest?.('.chip'))) set(null);
  });
  root.addEventListener('focusin', (e) => {
    const c = e.target.closest('.chip[data-b]');
    if (c) set(c.dataset.b);
  });
  root.addEventListener('focusout', () => set(null));
}

/** Quadro com a mesma frase nos 4 idiomas, PT-BR em cima. */
export function quad(item, { langs = LANGS.map((l) => l.code), showPt = true } = {}) {
  const box = h('div.quad');
  if (showPt && item.pt) box.append(h('div.quad-pt', {}, h('strong', {}, item.pt), h('span.eyebrow', {}, 'PT-BR')));
  for (const code of langs) {
    const text = sentenceText(code, item.blocks[code], item.p);
    box.append(
      h(
        'div.lang-row',
        {},
        h('span.lang-tag', {}, code.toUpperCase()),
        chipLine(code, item.blocks[code], item.p),
        sayButton(text, code),
      ),
    );
  }
  linkHighlights(box);
  return box;
}

export function legend() {
  return h(
    'div.legend',
    {},
    BLOCKS.filter((b) => b.id > 0)
      .concat(BLOCKS.filter((b) => b.id === 0))
      .map((b) =>
        h(
          'div.legend-item',
          {},
          h(`span.chip.b${b.id}`, {}, b.id === 0 ? 'Expressão' : `Bloco ${b.id}`),
          h('strong', {}, b.rotulo),
          h('small', {}, `Ex.: ${b.exemplo}`),
        ),
      ),
  );
}

/** Entrada escalonada dos blocos de um container. */
export function animateIn(root, selector = '.chip') {
  const els = root.querySelectorAll(selector);
  if (!els.length || reducedMotion()) return;
  gsap.from(els, { y: 10, autoAlpha: 0, duration: 0.35, stagger: 0.025, ease: 'back.out(2)', clearProps: 'all' });
}

export function select(id, label, options, value, onchange) {
  return h(
    'div.field',
    {},
    h('label', { for: id }, label),
    h(
      'select',
      { id, onchange: (e) => onchange(e.target.value) },
      options.map(([v, t]) => h('option', { value: v, selected: v === value }, t)),
    ),
  );
}
