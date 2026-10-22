import { LICOES } from '../data/licoes.js';
import { LANG_CODES } from '../config.js';

/** "1:I|5:study" → [{ b: 1, t: 'I' }, { b: 5, t: 'study' }] */
export function parseBlocks(spec) {
  return spec.split('|').map((part) => {
    const i = part.indexOf(':');
    return { b: Number(part.slice(0, i)), t: part.slice(i + 1) };
  });
}

const upperFirst = (s) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/** Blocos com espaço entre eles; elisão (j', c', l') cola no bloco seguinte. */
export function joinTokens(tokens) {
  let out = '';
  tokens.forEach((t, i) => {
    let text = t;
    if (i === 0 || /[.!?]$/.test(out)) text = upperFirst(text);
    const glue = i === 0 || out.endsWith("'") || text.startsWith(',');
    out += glue ? text : ` ${text}`;
  });
  return out;
}

/** Frase completa com a pontuação de cada idioma (¿ ¡ no espanhol, espaço fino no francês). */
export function sentenceText(lang, blocks, p = '') {
  const body = joinTokens(blocks.map((x) => x.t));
  if (!p || p === '.') return body + p;
  if (lang === 'es') {
    // ¿ ¡ abrem só a última oração: "No, gracias. ¿Cuánto cuesta?"
    const cut = body.search(/[.!?] (?=[^.!?]*$)/) + 2;
    const at = cut > 1 ? cut : 0;
    return `${body.slice(0, at)}${p === '?' ? '¿' : '¡'}${body.slice(at)}${p}`;
  }
  if (lang === 'fr') return `${body}\u202f${p}`;
  return body + p;
}

/** Texto do bloco sem a vírgula de ligação, para peças soltas. */
export const tileText = (t) => t.replace(/^,\s*/, '');

/** Junta os blocos com espaço respeitando a elisão, para checar respostas. */
export function normalize(tokens) {
  return joinTokens(tokens).toLocaleLowerCase();
}

function prepare(item) {
  const blocks = {};
  for (const lang of LANG_CODES) blocks[lang] = parseBlocks(item.b[lang]);
  return { ...item, blocks };
}

export const LESSONS = LICOES.map((l) => ({
  ...l,
  scaffold: l.scaffold.map(prepare),
  frases: l.frases.map((f) => ({ ...prepare(f), licao: l.id })),
  dialogo: l.dialogo.map(prepare),
}));

export const ALL_SENTENCES = LESSONS.flatMap((l) => l.frases);

export const sentenceById = Object.fromEntries(ALL_SENTENCES.map((s) => [s.id, s]));

export const lessonById = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
