import { parseRuby } from './ruby.js'

// Romanização Hepburn simplificada (vogais longas escritas por extenso: kouen).

const BASE = {
  あ: 'a',
  い: 'i',
  う: 'u',
  え: 'e',
  お: 'o',
  か: 'ka',
  き: 'ki',
  く: 'ku',
  け: 'ke',
  こ: 'ko',
  が: 'ga',
  ぎ: 'gi',
  ぐ: 'gu',
  げ: 'ge',
  ご: 'go',
  さ: 'sa',
  し: 'shi',
  す: 'su',
  せ: 'se',
  そ: 'so',
  ざ: 'za',
  じ: 'ji',
  ず: 'zu',
  ぜ: 'ze',
  ぞ: 'zo',
  た: 'ta',
  ち: 'chi',
  つ: 'tsu',
  て: 'te',
  と: 'to',
  だ: 'da',
  ぢ: 'ji',
  づ: 'zu',
  で: 'de',
  ど: 'do',
  な: 'na',
  に: 'ni',
  ぬ: 'nu',
  ね: 'ne',
  の: 'no',
  は: 'ha',
  ひ: 'hi',
  ふ: 'fu',
  へ: 'he',
  ほ: 'ho',
  ば: 'ba',
  び: 'bi',
  ぶ: 'bu',
  べ: 'be',
  ぼ: 'bo',
  ぱ: 'pa',
  ぴ: 'pi',
  ぷ: 'pu',
  ぺ: 'pe',
  ぽ: 'po',
  ま: 'ma',
  み: 'mi',
  む: 'mu',
  め: 'me',
  も: 'mo',
  や: 'ya',
  ゆ: 'yu',
  よ: 'yo',
  ら: 'ra',
  り: 'ri',
  る: 'ru',
  れ: 're',
  ろ: 'ro',
  わ: 'wa',
  を: 'o',
  ん: 'n',
  ぁ: 'a',
  ぃ: 'i',
  ぅ: 'u',
  ぇ: 'e',
  ぉ: 'o',
  '。': '.',
  '、': ',',
  '！': '!',
  '？': '?',
  '　': ' ',
  '・': ' ',
  '〜': '~',
  '～': '~'
}

const SMALL_Y = { ゃ: 'a', ゅ: 'u', ょ: 'o' }

export function toHiragana(str) {
  return [...str]
    .map((ch) => {
      const c = ch.charCodeAt(0)
      return c >= 0x30a1 && c <= 0x30f6 ? String.fromCharCode(c - 0x60) : ch
    })
    .join('')
}

export function kanaToRomaji(input) {
  const s = [...toHiragana(input)]
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    const next = s[i + 1]
    if (ch === 'っ') {
      const r = kanaToRomaji(s.slice(i + 1, i + 3).join(''))
      if (/^[b-df-hj-np-tv-z]/.test(r)) out += r.startsWith('ch') ? 't' : r[0]
      continue
    }
    if (ch === 'ー') {
      const m = out.match(/[aeiou]$/)
      if (m) out += m[0]
      continue
    }
    if (ch === 'ん') {
      out += next && /^[あいうえおやゆよ]$/.test(next) ? "n'" : 'n'
      continue
    }
    if (next && SMALL_Y[next] && BASE[ch]) {
      const base = BASE[ch]
      if (/^(shi|chi|ji)$/.test(base)) out += base.slice(0, -1) + SMALL_Y[next]
      else out += base.slice(0, -1) + 'y' + SMALL_Y[next]
      i++
      continue
    }
    out += BASE[ch] ?? ch
  }
  return out
}

const PARTICLE_ROMAJI = { は: 'wa', を: 'o', へ: 'e' }

/** Romaji de um texto com marcação de ruby; partículas viram palavras separadas. */
export function romaji(text) {
  const parts = []
  for (const t of parseRuby(text)) {
    if (t.type === 'particle') {
      parts.push(` ${PARTICLE_ROMAJI[t.base] ?? kanaToRomaji(t.base)} `)
    } else {
      parts.push(kanaToRomaji(t.reading))
    }
  }
  return parts
    .join('')
    .replace(/\s+([.,!?])/g, '$1')
    .replace(/([.,!?])(?=[a-z])/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
}
