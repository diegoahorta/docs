/**
 * Exibição de texto no idioma-alvo, independente do idioma da unidade.
 *
 * tl(unit, text) devolve um <span lang="…"> pronto para inserir na página:
 *  - inglês/francês…: o texto como está;
 *  - japonês: furigana em <ruby> (a partir da marcação {漢字|かんじ}) + linha de romaji.
 * Mostrar/ocultar furigana e romaji é controlado pelas configurações (atributos em <html>),
 * sem precisar redesenhar a página.
 */
import { h } from './dom.js';
import { tokens, romaji, plain } from './jp.js';

export const isJa = (unit) => unit?.language?.code === 'ja';

/** Texto sem marcação (para comparar, falar com a voz do navegador, etc.). */
export const plainText = (unit, text) => (isJa(unit) ? plain(text) : String(text ?? ''));

/** Como juntar blocos de palavras (japonês não usa espaço entre blocos). */
export const joiner = (unit) => (isJa(unit) ? '' : ' ');

/**
 * Nó com o texto no idioma-alvo.
 * opts.noFurigana: mostra só o kanji (questões de leitura de kanji estilo JLPT).
 * opts.noRomaji: não acrescenta a linha de romaji.
 */
export function tl(unit, text, { noFurigana = false, noRomaji = false, tag = 'span', cls = '' } = {}) {
  const lang = unit?.language?.bcp47 || 'en';
  if (!isJa(unit)) return h(tag, { lang, class: cls || null }, String(text ?? ''));
  const el = h(tag, { lang, class: `ja ${cls}`.trim() });
  const body = h('span', { class: 'ja-text' });
  for (const t of tokens(text)) {
    if (t.ruby && !noFurigana) body.append(h('ruby', {}, t.base, h('rp', {}, '('), h('rt', {}, t.ruby), h('rp', {}, ')')));
    else body.append(t.base);
  }
  el.append(body);
  if (!noRomaji && !noFurigana) el.append(h('span', { class: 'romaji', lang: 'ja-Latn' }, romaji(noFurigana ? plain(text) : text)));
  return el;
}

/** Formata preço conforme a moeda da unidade (ex.: $3.50 ou 350円). */
export function money(unit, v) {
  const m = unit?.menu || {};
  const decimals = m.decimals ?? 2;
  const n = Number(v).toFixed(decimals);
  return m.currencySuffix ? `${n}${m.currencySuffix}` : `${m.currency ?? '$'}${n}`;
}

/** Botões rápidos de furigana/romaji (só aparecem em unidades de japonês). */
export function jaControls(ctx) {
  if (!isJa(ctx.unit)) return null;
  const mk = (key, label, on) => {
    const b = h('button', { class: 'btn small', 'aria-pressed': String(on()), onClick: () => {
      ctx.setSettings({ [key]: !on() });
      document.querySelectorAll(`[data-ja-toggle="${key}"]`).forEach((x) => x.setAttribute('aria-pressed', String(on())));
    } }, label);
    b.dataset.jaToggle = key;
    return b;
  };
  return h('div', { class: 'ja-ctrl', role: 'group', 'aria-label': 'Leitura do japonês' },
    mk('furigana', 'ふりがな Furigana', () => ctx.settings.furigana !== false),
    mk('romaji', 'Rōmaji', () => !!ctx.settings.romaji));
}
