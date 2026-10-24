// Gerencia a camada DOM: configurações visuais, travas de entrada,
// modais, toasts e cartões de feedback.
import { state } from '../systems/GameState.js'
import { input } from '../systems/InputSystem.js'
import { bus } from '../systems/EventBus.js'
import { saves } from '../systems/SaveSystem.js'
import { audio } from '../systems/AudioSystem.js'
import { toHTML, rubyHTML, reading, escapeHTML } from './ruby.js'
import { popIn, popOut, gsap, motionOK } from '../animations/fx.js'

class UIManager {
  constructor() {
    this.locks = 0
    this.modals = []
  }

  init() {
    this.root = document.getElementById('ui')
    this.toasts = this.el('div', 'toasts passthrough')
    this.root.appendChild(this.toasts)
    const hint = this.el(
      'div',
      'rotate-hint passthrough',
      '📱↻ Gire o celular para jogar na horizontal'
    )
    this.root.appendChild(hint)
    this.applySettings()
    bus.on('settings:changed', () => this.applySettings())
  }

  el(tag, cls, html) {
    const e = document.createElement(tag)
    if (cls) e.className = cls
    if (html != null) e.innerHTML = html
    return e
  }

  applySettings() {
    const s = state.settings
    const b = document.body.classList
    b.toggle('no-furigana', !s.furigana)
    b.toggle('no-translation', !s.translation)
    b.toggle('analysis', s.analysis)
    b.toggle('reduced-motion', s.reducedMotion)
    audio.applyVolume()
  }

  setSetting(key, value) {
    state.settings[key] = value
    saves.saveSoon()
    bus.emit('settings:changed', { key, value })
  }

  toggleSetting(key) {
    this.setSetting(key, !state.settings[key])
    const labels = {
      furigana: 'Furigana',
      translation: 'Tradução',
      analysis: 'Modo de análise gramatical',
      minimap: 'Minimapa'
    }
    if (labels[key])
      this.toast(`${labels[key]}: ${state.settings[key] ? 'ligado' : 'desligado'}`)
  }

  // ── Entrada ────────────────────────────────────────────────
  lockInput() {
    this.locks++
    input.setEnabled(false)
  }

  unlockInput() {
    this.locks = Math.max(0, this.locks - 1)
    if (this.locks === 0) input.setEnabled(true)
  }

  get busy() {
    return this.locks > 0
  }

  // ── Modais ─────────────────────────────────────────────────
  openModal(content, { onClose, closeOnBackdrop = true } = {}) {
    const overlay = this.el('div', 'overlay')
    overlay.appendChild(content)
    this.root.appendChild(overlay)
    this.lockInput()
    const modal = { overlay, content, onClose, locked: !closeOnBackdrop }
    this.modals.push(modal)
    if (closeOnBackdrop)
      overlay.addEventListener('pointerdown', (e) => {
        if (e.target === overlay) this.closeModal(modal)
      })
    popIn(content)
    const focusable = content.querySelector('button, [tabindex]')
    focusable?.focus({ preventScroll: true })
    return modal
  }

  async closeModal(modal = this.modals[this.modals.length - 1]) {
    if (!modal || !this.modals.includes(modal)) return
    this.modals = this.modals.filter((m) => m !== modal)
    await popOut(modal.content)
    modal.overlay.remove()
    this.unlockInput()
    modal.onClose?.()
  }

  get modalOpen() {
    return this.modals.length > 0
  }

  get topModal() {
    return this.modals[this.modals.length - 1]
  }

  // ── Mensagens ──────────────────────────────────────────────
  toast(html, kind = '', ms = 2600) {
    const t = this.el('div', `toast ${kind}`, html)
    this.toasts.appendChild(t)
    if (motionOK())
      gsap.fromTo(t, { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25 })
    setTimeout(() => {
      if (!motionOK()) return t.remove()
      gsap.to(t, { autoAlpha: 0, y: -10, duration: 0.25, onComplete: () => t.remove() })
    }, ms)
  }

  /**
   * Cartão de feedback após uma ação: frase, leitura, tradução e explicação.
   * Retorna uma Promise resolvida quando o jogador fecha o cartão.
   */
  feedbackCard({ title = 'Muito bem!', jp, pt, explain, soft = false, auto = 0 }) {
    return new Promise((resolve) => {
      const card = this.el('div', `card feedback-card ${soft ? 'soft' : ''}`)
      card.innerHTML = `
        <h4>${soft ? '💜' : '✨'} ${escapeHTML(title)}</h4>
        ${jp ? `<div class="jp-line">${toHTML(jp)}</div><div class="reading">${escapeHTML(reading(jp))}</div>` : ''}
        ${pt ? `<div class="tr">${escapeHTML(pt)}</div>` : ''}
        ${explain ? `<div class="explain">${rubyHTML(explain)}</div>` : ''}
        <div class="row"><button class="btn ghost speak-btn" title="Ouvir">🔊</button><button class="btn primary ok">OK ▶</button></div>`
      this.root.appendChild(card)
      this.lockInput()
      popIn(card)
      let closed = false
      const close = async () => {
        if (closed) return
        closed = true
        window.removeEventListener('keydown', onKey, true)
        await popOut(card)
        card.remove()
        this.unlockInput()
        resolve()
      }
      const onKey = (e) => {
        if (['Enter', 'Space', 'KeyE', 'Escape'].includes(e.code) && !e.repeat) {
          e.preventDefault()
          e.stopPropagation()
          close()
        }
      }
      setTimeout(() => window.addEventListener('keydown', onKey, true), 150)
      card.querySelector('.ok').addEventListener('click', close)
      card
        .querySelector('.speak-btn')
        .addEventListener('click', () => jp && audio.speak(jp, true))
      if (jp) audio.speak(jp)
      if (auto) setTimeout(close, auto)
    })
  }
}

export const ui = new UIManager()
