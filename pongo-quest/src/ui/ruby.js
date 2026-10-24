// Marcação compacta para japonês com furigana e chunking gramatical.
//   {漢字|かんじ}   → <ruby>漢字<rt>かんじ</rt></ruby>
//   [ref:{箱|はこ}] → bloco colorido (modo de análise gramatical)
// Tipos de bloco: ref (azul), no (amarelo), pos (verde), part (roxo),
// pred (vermelho), top (tópico/sujeito, neutro).

export const CHUNK_LABELS = {
  ref: 'ref.',
  no: 'の',
  pos: 'pos.',
  part: 'part.',
  pred: 'pred.',
  top: 'tóp.'
}

const CHUNK_RE = /\[(ref|no|pos|part|pred|top):([^\]]*)\]/g
const RUBY_RE = /\{([^|}]+)\|([^}]*)\}/g

export function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Divide a marcação em segmentos [{type, text}] (type null = texto livre). */
export function parseChunks(markup) {
  const out = []
  let last = 0
  for (const m of markup.matchAll(CHUNK_RE)) {
    if (m.index > last) out.push({ type: null, text: markup.slice(last, m.index) })
    out.push({ type: m[1], text: m[2] })
    last = m.index + m[0].length
  }
  if (last < markup.length) out.push({ type: null, text: markup.slice(last) })
  return out
}

/** Converte furigana em HTML <ruby>. */
export function rubyHTML(text) {
  let html = ''
  let last = 0
  for (const m of text.matchAll(RUBY_RE)) {
    html += escapeHTML(text.slice(last, m.index))
    html += m[2]
      ? `<ruby>${escapeHTML(m[1])}<rt>${escapeHTML(m[2])}</rt></ruby>`
      : escapeHTML(m[1])
    last = m.index + m[0].length
  }
  return html + escapeHTML(text.slice(last))
}

/** HTML completo: blocos gramaticais + furigana. */
export function toHTML(markup) {
  return parseChunks(markup)
    .map(({ type, text }) =>
      type
        ? `<span class="ch ch-${type}" data-label="${CHUNK_LABELS[type]}">${rubyHTML(text)}</span>`
        : rubyHTML(text)
    )
    .join('')
}

/** Texto-base sem leituras (para fala sintetizada e comparação). */
export function plain(markup) {
  return markup.replace(CHUNK_RE, '$2').replace(RUBY_RE, '$1')
}

/** Leitura completa em kana. */
export function reading(markup) {
  return markup.replace(CHUNK_RE, '$2').replace(RUBY_RE, (_, base, kana) => kana || base)
}

/**
 * Divide uma frase em blocos para montagem (construção por blocos).
 * Texto livre também vira bloco (ex.: "{猫|ねこ}は" → tópico).
 * Pontuação final é descartada.
 */
export function toBlocks(markup) {
  return parseChunks(markup)
    .map(({ type, text }) => ({
      type: type || 'top',
      text: text.replace(/[。、！？!?]/g, '').trim()
    }))
    .filter((b) => b.text.length > 0)
}

/** Unidades visuais para a animação de digitação (cada ruby é 1 unidade). */
export function typingUnits(root) {
  const units = []
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const chars = [...child.textContent]
        const frag = document.createDocumentFragment()
        chars.forEach((c) => {
          const s = document.createElement('span')
          s.className = 'tu'
          s.textContent = c
          frag.appendChild(s)
          units.push(s)
        })
        child.replaceWith(frag)
      } else if (child.nodeName === 'RUBY') {
        child.classList.add('tu')
        units.push(child)
      } else {
        walk(child)
      }
    })
  }
  walk(root)
  return units
}
