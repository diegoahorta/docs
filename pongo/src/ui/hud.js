// HUD: cristais, pontuação, missão atual e atalhos (diário, caderno, inventário, pausa).
import { gsap } from 'gsap'
import { h, jpHTML } from './dom.js'
import { layer } from './ui.js'
import { bus } from '../core/events.js'
import { get, level } from '../core/store.js'
import { LEVELS } from '../core/content.js'

let el = null
let offs = []
let current = null

export function showHud(levelId) {
  hideHud()
  current = levelId
  const crystals = h(
    'div.hud-pill#hud-crystals',
    { title: 'Cristais das Ações' },
    h('span.gem'),
    h('b.hud-c'),
    h('small', {}, ' / 10')
  )
  const score = h('div.hud-pill#hud-score', { title: 'Pontuação' }, '⭐ ', h('b.hud-s'))
  const mission = h('button.hud-mission', {
    type: 'button',
    title: 'Ver missões',
    onclick: () => list.classList.toggle('open')
  })
  const list = h('ol.hud-list')
  const btn = (icon, label, evt) =>
    h(
      'button.hud-btn',
      { type: 'button', title: label, 'aria-label': label, onclick: () => bus.emit(evt) },
      icon
    )
  el = h(
    'div.hud',
    {},
    h('div.hud-left', {}, crystals, score, h('div.hud-mwrap', {}, mission, list)),
    h(
      'div.hud-right',
      {},
      btn('📔', 'Diário de verbos', 'ui:journal'),
      btn('📘', 'Caderno gramatical', 'ui:notebook'),
      btn('🎒', 'Inventário', 'ui:inventory'),
      btn('⏸', 'Pausar (Esc)', 'ui:pause')
    )
  )
  layer('hud').append(el)
  gsap.fromTo(
    el,
    { y: -60, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
  )
  offs.push(bus.on('progress', updateHud))
  updateHud()
}

export function updateHud() {
  if (!el) return
  const lv = LEVELS[current]
  const done = level(current).missions
  el.querySelector('.hud-c').textContent = done.length
  el.querySelector('.hud-s').textContent = get().score
  const next = lv.missions.find((m) => !done.includes(m.id))
  const mission = el.querySelector('.hud-mission')
  mission.innerHTML = next
    ? `<span class="hud-mnum">${lv.missions.indexOf(next) + 1}</span><span><span class="jp" lang="ja">${jpHTML(next.jp)}</span><small>${next.title}</small></span>`
    : '<span class="hud-mnum">✓</span><span>Todas as missões concluídas!</span>'
  const list = el.querySelector('.hud-list')
  list.replaceChildren(
    ...lv.missions.map((m) =>
      h(
        `li${done.includes(m.id) ? '.done' : m === next ? '.current' : ''}`,
        {},
        h('b', {}, m.title),
        h('small', {}, m.hint)
      )
    )
  )
}

export function hideHud() {
  offs.forEach((f) => f())
  offs = []
  el?.remove()
  el = null
}
