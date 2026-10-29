// Formato de texto com furigana usado em todos os dados:
//   {漢字|かんじ}  -> kanji com leitura
//   [は]          -> partícula (destacada em amarelo; romaji correto: wa)
//   resto         -> texto literal (kana, pontuação)
// Exemplo: "ポンゴ[は]{公園|こうえん}[で]{走|はし}っています。"

const TOKEN = /\{([^|}]+)\|([^}]+)\}|\[([^\]]+)\]|([^{[]+)/g

export function parseRuby(text) {
  const out = []
  for (const m of String(text).matchAll(TOKEN)) {
    if (m[1]) out.push({ type: 'ruby', base: m[1], reading: m[2] })
    else if (m[3]) out.push({ type: 'particle', base: m[3], reading: m[3] })
    else out.push({ type: 'text', base: m[4], reading: m[4] })
  }
  return out
}

/** Texto japonês simples (com kanji), sem marcações. */
export function plain(text) {
  return parseRuby(text)
    .map((t) => t.base)
    .join('')
}

/** Leitura somente em kana (ideal para TTS e romaji). */
export function kana(text) {
  return parseRuby(text)
    .map((t) => t.reading)
    .join('')
}

const KANA_RE = /[぀-ヿー。、！？「」・ー〜～]/

/**
 * Alinha automaticamente o furigana de uma palavra conjugada:
 * ("走っています", "はしっています") -> "{走|はし}っています".
 * Remove o sufixo e o prefixo em kana comuns às duas formas.
 */
export function autoRuby(kanjiForm, kanaForm) {
  if (kanjiForm === kanaForm) return kanjiForm
  const a = [...kanjiForm]
  const b = [...kanaForm]
  let suffix = ''
  while (
    a.length &&
    b.length &&
    a[a.length - 1] === b[b.length - 1] &&
    KANA_RE.test(a[a.length - 1])
  ) {
    suffix = a.pop() + suffix
    b.pop()
  }
  let prefix = ''
  while (a.length && b.length && a[0] === b[0] && KANA_RE.test(a[0])) {
    prefix += a.shift()
    b.shift()
  }
  if (!a.length) return prefix + suffix
  return `${prefix}{${a.join('')}|${b.join('')}}${suffix}`
}

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  )
}

/** HTML com <ruby>. Partículas recebem a classe "jp-particle". */
export function rubyHTML(text, { furigana = true, particles = true } = {}) {
  return parseRuby(text)
    .map((t) => {
      if (t.type === 'ruby') {
        return furigana
          ? `<ruby>${esc(t.base)}<rt>${esc(t.reading)}</rt></ruby>`
          : esc(t.base)
      }
      if (t.type === 'particle' && particles)
        return `<span class="jp-particle">${esc(t.base)}</span>`
      return esc(t.base)
    })
    .join('')
}
