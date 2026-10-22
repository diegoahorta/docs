import { LANG_CODES } from '../config.js';
import { ALL_SENTENCES, normalize, tileText } from '../core/blocks.js';

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Embaralha garantindo que a ordem inicial não seja já a resposta. */
function scramble(tiles) {
  if (tiles.length < 2) return tiles;
  let out = shuffle(tiles);
  for (let n = 0; n < 8 && out.every((t, i) => t.pos === i); n += 1) out = shuffle(tiles);
  return out;
}

/** Um bloco de outra frase do mesmo idioma, com texto diferente de todos os da resposta. */
function distractor(sentence, lang) {
  const used = new Set(sentence.blocks[lang].map((b) => tileText(b.t).toLowerCase()));
  const pool = ALL_SENTENCES.filter((s) => s.id !== sentence.id).flatMap((s) => s.blocks[lang]);
  const options = pool.filter((b) => b.b !== 0 && !used.has(tileText(b.t).toLowerCase()));
  return options[Math.floor(Math.random() * options.length)];
}

export function makeRound(sentence, lang, { withDistractor = true } = {}) {
  const blocks = sentence.blocks[lang];
  const tiles = blocks.map((b, i) => ({ key: `${sentence.id}-${i}`, b: b.b, t: b.t, label: tileText(b.t), pos: i }));
  if (withDistractor && blocks.length >= 3) {
    const d = distractor(sentence, lang);
    if (d) tiles.push({ key: `${sentence.id}-x`, b: d.b, t: d.t, label: tileText(d.t), pos: -1 });
  }
  return { sentence, lang, tiles: scramble(tiles), answer: blocks.map((b) => b.t) };
}

/** Rodadas de uma partida. lang = 'en' | 'fr' | 'de' | 'es' | 'all' (mesma frase nos 4 idiomas). */
export function makeGame({ lesson = 'all', lang = 'en', count = 10 } = {}) {
  const pool = ALL_SENTENCES.filter((s) => (lesson === 'all' || s.licao === lesson) && s.blocks.en.length >= 2);
  if (lang === 'all') {
    return shuffle(pool)
      .slice(0, Math.max(1, Math.round(count / 4)))
      .flatMap((s) => LANG_CODES.map((l) => makeRound(s, l)));
  }
  const picked = shuffle(pool).slice(0, count);
  return picked.map((s) => makeRound(s, lang));
}

/** Compara pelo texto, então blocos repetidos (do … do) podem trocar entre si. */
export function isCorrect(round, chosen) {
  return normalize(chosen.map((t) => t.t)) === normalize(round.answer);
}
