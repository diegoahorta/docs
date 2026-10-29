import { gsap } from 'gsap'
import { h, jpHTML } from '../dom.js'
import { sfx } from '../../core/audio.js'
import { autoRuby } from '../../lang/ruby.js'

export function feedback(box, ok, html) {
  box.className = `feedback ${ok ? 'ok' : 'bad'}`
  box.innerHTML = `<span class="fb-icon">${ok ? '⭕' : '💭'}</span><div>${html}</div>`
  sfx(ok ? 'correct' : 'wrong')
  gsap.fromTo(box, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 })
  if (!ok)
    gsap.fromTo(box, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' })
}

export const ROLE_LEGEND = () =>
  h(
    'div.legend.role-legend',
    {},
    h('span.chip-mini.role-topic', {}, 'Tópico'),
    h('span.chip-mini.role-location', {}, 'Local'),
    h('span.chip-mini.role-object', {}, 'Objeto'),
    h('span.chip-mini.role-particle', {}, 'Partícula'),
    h('span.chip-mini.role-verb', {}, 'Verbo')
  )

export const progressDots = (n, i) =>
  h(
    'div.progress-dots',
    {},
    Array.from({ length: n }, (_, k) => h(`i${k < i ? '.done' : k === i ? '.now' : ''}`))
  )

export const verbLabel = (v) => jpHTML(autoRuby(v.kanji, v.kana))
