// Entrada unificada: teclado (setas/WASD, E/Espaço) e controles touch.
// Lida diretamente com eventos DOM para não conflitar com a UI.
const KEYMAP = {
  ArrowUp: 'N',
  KeyW: 'N',
  ArrowDown: 'S',
  KeyS: 'S',
  ArrowLeft: 'W',
  KeyA: 'W',
  ArrowRight: 'E',
  KeyD: 'E'
}
const ACTION_KEYS = ['KeyE', 'Space', 'Enter']

class InputSystem {
  constructor() {
    this.held = [] // pilha: a última direção pressionada tem prioridade
    this.touchDir = null
    this.actionQueued = false
    this.enabled = true
    this.hotkeys = new Map()
  }

  init() {
    if (this.ready) return
    this.ready = true
    window.addEventListener('keydown', (e) => this.onDown(e))
    window.addEventListener('keyup', (e) => this.onUp(e))
    window.addEventListener('blur', () => this.clear())
  }

  isTyping(e) {
    const t = e.target
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
  }

  onDown(e) {
    if (this.isTyping(e)) return
    const dir = KEYMAP[e.code]
    if (dir) {
      if (this.enabled) e.preventDefault()
      if (!this.held.includes(dir)) this.held.push(dir)
      return
    }
    if (ACTION_KEYS.includes(e.code)) {
      if (!this.enabled || e.repeat) return
      e.preventDefault()
      this.actionQueued = true
      return
    }
    if (!e.repeat && this.hotkeys.has(e.code)) this.hotkeys.get(e.code)(e)
  }

  onUp(e) {
    const dir = KEYMAP[e.code]
    if (dir) this.held = this.held.filter((d) => d !== dir)
  }

  /** Atalho global (ex.: M = minimapa). */
  hotkey(code, fn) {
    this.hotkeys.set(code, fn)
  }

  setTouchDir(dir) {
    this.touchDir = dir
  }

  pressAction() {
    if (this.enabled) this.actionQueued = true
  }

  /** Direção atual (null = parado). */
  direction() {
    if (!this.enabled) return null
    return this.touchDir || this.held[this.held.length - 1] || null
  }

  consumeAction() {
    const a = this.actionQueued && this.enabled
    this.actionQueued = false
    return a
  }

  setEnabled(on) {
    this.enabled = on
    this.actionQueued = false
    if (!on) this.touchDir = null
  }

  clear() {
    this.held = []
    this.touchDir = null
    this.actionQueued = false
  }
}

export const input = new InputSystem()
