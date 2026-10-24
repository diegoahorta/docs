// Controles touch: direcional virtual + botão de ação.
import { input } from '../systems/InputSystem.js'
import { state } from '../systems/GameState.js'
import { bus } from '../systems/EventBus.js'
import { ui } from './UIManager.js'

const isTouch = () =>
  window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window

class TouchControls {
  init() {
    this.el = ui.el('div', 'touch')
    this.el.innerHTML = `
      <div class="dpad">
        <button class="u" data-d="N" aria-label="Norte / cima">▲</button>
        <button class="l" data-d="W" aria-label="Oeste / esquerda">◀</button>
        <button class="r" data-d="E" aria-label="Leste / direita">▶</button>
        <button class="d" data-d="S" aria-label="Sul / baixo">▼</button>
      </div>
      <button class="abtn" aria-label="Interagir">E</button>`
    ui.root.appendChild(this.el)
    const pad = this.el.querySelector('.dpad')
    const set = (d) => {
      input.setTouchDir(d)
      pad
        .querySelectorAll('button')
        .forEach((b) => b.classList.toggle('on', b.dataset.d === d))
    }
    const fromPoint = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      return el?.closest?.('.dpad button')?.dataset.d || null
    }
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      pad.setPointerCapture(e.pointerId)
      set(fromPoint(e))
    })
    pad.addEventListener(
      'pointermove',
      (e) => pad.hasPointerCapture(e.pointerId) && set(fromPoint(e))
    )
    const end = () => set(null)
    pad.addEventListener('pointerup', end)
    pad.addEventListener('pointercancel', end)
    this.el.querySelector('.abtn').addEventListener('pointerdown', (e) => {
      e.preventDefault()
      input.pressAction()
    })
    this.visible = false
    bus.on('settings:changed', () => this.sync())
    this.sync()
  }

  show(on) {
    this.visible = on
    this.sync()
  }

  sync() {
    const mode = state.settings.touch
    const enabled = mode === 'on' || (mode === 'auto' && isTouch())
    this.el.classList.toggle('hidden', !(enabled && this.visible))
  }
}

export const touch = new TouchControls()
