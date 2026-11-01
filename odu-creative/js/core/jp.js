/**
 * Suporte a japonês (funções puras — testadas em tests/jp.test.mjs).
 *
 * Marcação de furigana usada nas unidades:   {先生|せんせい}が {言|い}った とおりに
 *   - plain()   → 先生が 言った とおりに        (texto exibido / comparado)
 *   - reading() → せんせいが いった とおりに     (kana — aceito como resposta)
 *   - romaji()  → sensei ga itta toori ni        (Hepburn, por bunsetsu)
 *   - paren()   → 先生(せんせい)が 言(い)った…   (para DOCX, que não tem ruby)
 *   - tokens()  → [{base, ruby}] para montar <ruby> no HTML
 *
 * Os espaços entre bunsetsu (分かち書き), como nos livros para estudantes, são mantidos na
 * exibição e ignorados na correção. Partículas は/へ/を no fim de um bunsetsu viram wa/e/o no romaji.
 */

const RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;

export const hasMarkup = (s) => /\{[^|{}]+\|[^|{}]+\}/.test(String(s ?? ''));
export const isJapanese = (s) => /[぀-ヿ㐀-鿿]/.test(String(s ?? ''));

export function tokens(s) {
  const out = [];
  let last = 0;
  const str = String(s ?? '');
  for (const m of str.matchAll(RUBY)) {
    if (m.index > last) out.push({ base: str.slice(last, m.index) });
    out.push({ base: m[1], ruby: m[2] });
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push({ base: str.slice(last) });
  return out;
}

export const plain = (s) => String(s ?? '').replace(RUBY, '$1');
export const reading = (s) => String(s ?? '').replace(RUBY, '$2');
export const paren = (s) => String(s ?? '').replace(RUBY, '$1($2)');

/** Katakana → hiragana (mantém ー). */
export function toHiragana(s) {
  return String(s).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

const BASE = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o', か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no', は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo', や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', ゐ: 'i', ゑ: 'e', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po', ゔ: 'vu',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゎ: 'wa',
};
const YOUON = { ゃ: 'a', ゅ: 'u', ょ: 'o' };
const SPECIAL = { しゃ: 'sha', しゅ: 'shu', しょ: 'sho', ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', じゃ: 'ja', じゅ: 'ju', じょ: 'jo', ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo' };
const SMALL_V = { ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo', てぃ: 'ti', でぃ: 'di', うぃ: 'wi', うぇ: 'we', うぉ: 'wo', ちぇ: 'che', しぇ: 'she', じぇ: 'je', ゔぁ: 'va', ゔぃ: 'vi', ゔぇ: 've', ゔぉ: 'vo' };
const PUNCT = { '、': ',', '。': '.', '！': '!', '？': '?', '「': '"', '」': '"', '・': ' ', '〜': '~', '（': '(', '）': ')' };

/** Converte uma palavra/bunsetsu em kana para romaji (Hepburn). */
export function kanaToRomaji(word, { particle = true } = {}) {
  const s = toHiragana(word);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1];
    if (c === 'っ') { // geminada: dobra a consoante seguinte (っち → tch)
      const next = kanaToRomaji(s.slice(i + 1, i + 3), { particle: false });
      out += next.startsWith('ch') ? 't' : next[0] && /[a-z]/.test(next[0]) ? next[0] : '';
      continue;
    }
    if (c === 'ー') { out += out.slice(-1).match(/[aeiou]/) ? out.slice(-1) : ''; continue; }
    if (n && (SPECIAL[c + n] || SMALL_V[c + n])) { out += SPECIAL[c + n] || SMALL_V[c + n]; i++; continue; }
    if (n && YOUON[n] && BASE[c]) { out += BASE[c].slice(0, -1) + 'y' + YOUON[n]; i++; continue; }
    if (c === 'ん') { out += /^[aeiouy]/.test(BASE[n] || '') ? "n'" : 'n'; continue; }
    out += BASE[c] ?? PUNCT[c] ?? c;
  }
  if (particle && s.length > 1) out = out.replace(/ha$/, 'wa').replace(/he$/, 'e');
  if (particle && s === 'は') out = 'wa';
  if (particle && s === 'へ') out = 'e';
  return out;
}

/**
 * Romaji de um texto com marcação. Cada bunsetsu (separado por espaço) é convertido; は/へ no
 * fim do bunsetsu são tratados como partículas (wa/e). Kanji sem leitura marcada fica como está.
 */
export function romaji(s) {
  return reading(s)
    .replace(/([、。！？])(?=\S)/g, '$1 ')
    .split(/[\s\u3000]+/)
    .filter(Boolean)
    .map((w) => {
      const m = w.match(/^(.*?)([、。！？」]*)$/); // separa a pontuação final
      const [stem, particle] = splitParticle(m[1]);
      // cópula です/でした separada da palavra anterior (きゅうひゃくえんです → kyuuhyakuen desu)
      const cop = stem.match(/^(.+?)(です(?:か|ね|よ)?|でした)$/);
      const words = cop ? [cop[1], cop[2]] : [stem];
      return [...words.filter(Boolean).map((w) => kanaToRomaji(w, { particle: false })), particle && kanaToRomaji(particle)].filter(Boolean).join(' ') + kanaToRomaji(m[2], { particle: false });
    })
    .join(' ')
    .replace(/\s+([,.!?])/g, '$1');
}

/**
 * Separa uma partícula final segura (を は が に へ で, e か depois de す/ん) do resto do bunsetsu.
 * Não separa で depois de ん/い (飲んで, ないで = forma て), nem palavras de 1 kana.
 */
export function splitParticle(w) {
  const h = toHiragana(w);
  if (h.length < 2) return [w, ''];
  const last = h.slice(-1);
  const prev = h.slice(-2, -1);
  if (last === 'か' && 'すん'.includes(prev)) return [w.slice(0, -1), w.slice(-1)]; // ですか / ませんか
  if (!'をはがにへで'.includes(last)) return [w, ''];
  if (last === 'で' && (prev === 'ん' || prev === 'い')) return [w, ''];
  if (/[ぁぃぅぇぉゃゅょっ]/.test(last)) return [w, ''];
  return [w.slice(0, -1), w.slice(-1)];
}

/** Normalização para comparar respostas em japonês: NFKC, sem espaços e sem pontuação. */
export function normalizeJa(s) {
  return String(s ?? '').normalize('NFKC').replace(/[\s　、。，．,.！!？?「」『』・〜~]/g, '');
}
