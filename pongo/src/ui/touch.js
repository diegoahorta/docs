// Controles virtuais para celular (multitoque com Pointer Events).
import { h } from './dom.js'
import { layer } from './ui.js'

export const touchState = {
  left: false,
  right: false,
  run: false,
  jump: false,
  jumpPresses: 0,
  interactPresses: 0
}

let el = null

export const isTouchDevice = () =>
  new URLSearchParams(location.search).has('touch') ||
  (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)

function hold(btn, key) {
  const on = (e) => {
    e.preventDefault()
    btn.setPointerCapture?.(e.pointerId)
    btn.classList.add('active')
    touchState[key] = true
    if (key === 'jump') touchState.jumpPresses++
  }
  const off = () => {
    btn.classList.remove('active')
    touchState[key] = false
  }
  btn.addEventListener('pointerdown', on)
  btn.addEventListener('pointerup', off)
  btn.addEventListener('pointercancel', off)
  btn.addEventListener('lostpointercapture', off)
  return btn
}

export function showTouch() {
  if (!isTouchDevice() || el) return
  const tap = (label, cls, fn) => {
    const b = h(`button.tc.${cls}`, { type: 'button', 'aria-label': label }, label)
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      b.classList.add('active')
      fn()
    })
    b.addEventListener('pointerup', () => b.classList.remove('active'))
    b.addEventListener('pointercancel', () => b.classList.remove('active'))
    return b
  }
  el = h(
    'div.touch',
    {},
    h(
      'div.tc-dpad',
      {},
      hold(
        h('button.tc.tc-l', { type: 'button', 'aria-label': 'Esquerda' }, '◀'),
        'left'
      ),
      hold(h('button.tc.tc-r', { type: 'button', 'aria-label': 'Direita' }, '▶'), 'right')
    ),
    h(
      'div.tc-actions',
      {},
      hold(
        h('button.tc.tc-run', { type: 'button', 'aria-label': 'Correr' }, '走'),
        'run'
      ),
      tap('✋', 'tc-act', () => touchState.interactPresses++),
      hold(
        h('button.tc.tc-jump', { type: 'button', 'aria-label': 'Pular' }, '跳'),
        'jump'
      )
    )
  )
  el.addEventListener('contextmenu', (e) => e.preventDefault())
  layer('hud').append(el)
}

export function hideTouch() {
  el?.remove()
  el = null
  Object.assign(touchState, {
    left: false,
    right: false,
    run: false,
    jump: false,
    jumpPresses: 0,
    interactPresses: 0
  })
}
