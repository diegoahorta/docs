// Pequenos utilitários de DOM + renderização de japonês conforme as configurações.
import { rubyHTML } from '../lang/ruby.js'
import { romaji } from '../lang/romaji.js'
import { setting } from '../core/store.js'

/** h('div.classe', { onclick }, filhos...) */
export function h(tag, attrs = {}, ...children) {
  const idMatch = tag.match(/#([\w-]+)/)
  const [name, ...classes] = tag.replace(/#[\w-]+/, '').split('.')
  const el = document.createElement(name || 'div')
  if (idMatch) el.id = idMatch[1]
  if (classes.length) el.className = classes.join(' ')
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v)
    else if (k === 'html') el.innerHTML = v
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v)
    else if (k === 'dataset') Object.assign(el.dataset, v)
    else el.setAttribute(k, v === true ? '' : v)
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
  return el
}

export const $ = (sel, root = document) => root.querySelector(sel)

/** HTML de um texto japonês com furigana (segundo a configuração). */
export function jpHTML(text, opts = {}) {
  return rubyHTML(text, {
    furigana: opts.furigana ?? setting('furigana'),
    particles: opts.particles ?? true
  })
}

/**
 * Bloco japonês completo: texto + romaji (opcional) + tradução (opcional).
 * @param {string} text  texto com marcação de ruby
 * @param {string} [pt]  tradução
 */
export function jpBlock(text, pt, { size = 'md', cls = '' } = {}) {
  return h(
    `div.jp-block.jp-${size}${cls ? '.' + cls : ''}`,
    {},
    h('div.jp', { lang: 'ja', html: jpHTML(text) }),
    setting('romaji') ? h('div.romaji', {}, romaji(text)) : null,
    pt && setting('translation') ? h('div.pt', {}, pt) : null
  )
}

export function button(label, onclick, cls = '') {
  return h(`button.btn${cls ? '.' + cls : ''}`, { type: 'button', onclick }, label)
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const sample = (arr, n) => shuffle(arr).slice(0, n)
