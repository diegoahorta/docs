// Áudio sintetizado (Web Audio) — sem arquivos externos — e voz
// opcional em japonês via Web Speech API.
import { state } from './GameState.js'
import { plain } from '../ui/ruby.js'

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12)

class AudioSystem {
  constructor() {
    this.ctx = null
    this.musicTimer = null
    this.step = 0
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return this.ctx
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.connect(this.master)
    this.applyVolume()
    return this.ctx
  }

  applyVolume() {
    if (!this.ctx) return
    this.master.gain.value = state.settings.volume
    this.musicGain.gain.value = state.settings.music * 0.5
  }

  tone(freq, dur = 0.1, { type = 'square', vol = 0.15, delay = 0, dest, slide } = {}) {
    const ctx = this.ensure()
    if (!ctx || state.settings.volume <= 0) return
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(g)
    g.connect(dest || this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  sfx(name) {
    switch (name) {
      case 'blip':
        return this.tone(880, 0.03, { vol: 0.04 })
      case 'select':
        return this.tone(660, 0.06, { vol: 0.08 })
      case 'confirm':
        this.tone(660, 0.07, { vol: 0.1 })
        return this.tone(990, 0.1, { vol: 0.1, delay: 0.07 })
      case 'success':
        return [72, 76, 79, 84].forEach((n, i) =>
          this.tone(NOTE(n), 0.14, { vol: 0.1, delay: i * 0.08, type: 'triangle' })
        )
      case 'soft-error':
        this.tone(330, 0.12, { vol: 0.07, type: 'triangle' })
        return this.tone(294, 0.16, { vol: 0.07, type: 'triangle', delay: 0.1 })
      case 'pickup':
        return [84, 88, 91].forEach((n, i) =>
          this.tone(NOTE(n), 0.08, { vol: 0.08, delay: i * 0.05, type: 'triangle' })
        )
      case 'door':
        return this.tone(180, 0.15, { vol: 0.1, type: 'sawtooth', slide: 90 })
      case 'step':
        return this.tone(120, 0.03, { vol: 0.02, type: 'triangle' })
      case 'fanfare':
        return [60, 64, 67, 72, 67, 72, 76].forEach((n, i) =>
          this.tone(NOTE(n), 0.2, { vol: 0.1, delay: i * 0.12, type: 'square' })
        )
      case 'meow':
        return this.tone(900, 0.25, { vol: 0.06, type: 'sine', slide: 600 })
      default:
        return null
    }
  }

  /** Música de fundo procedural (pentatônica, estilo chiptune). */
  startMusic() {
    if (this.musicTimer || !this.ensure()) return
    const melody = [72, 74, 76, 79, 81, 79, 76, 74, 72, 76, 79, 76, 74, 72, 69, 72]
    const bass = [48, 48, 55, 55, 53, 53, 55, 55]
    this.musicTimer = setInterval(() => {
      if (state.settings.music <= 0) return
      const i = this.step++ % 16
      if (i % 2 === 0)
        this.tone(NOTE(melody[(i + Math.floor(this.step / 16) * 3) % 16]), 0.22, {
          vol: 0.05,
          type: 'triangle',
          dest: this.musicGain
        })
      if (i % 4 === 0)
        this.tone(NOTE(bass[(i / 2) % 8]), 0.35, {
          vol: 0.06,
          type: 'sine',
          dest: this.musicGain
        })
    }, 190)
  }

  stopMusic() {
    clearInterval(this.musicTimer)
    this.musicTimer = null
  }

  /** Lê uma frase em japonês (voz opcional). */
  speak(markup, force = false) {
    if (!force && !state.settings.voice) return
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(plain(markup))
    u.lang = 'ja-JP'
    u.rate = 0.85
    u.volume = Math.max(0.2, state.settings.volume)
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith('ja'))
    if (voice) u.voice = voice
    window.speechSynthesis.speak(u)
  }
}

export const audio = new AudioSystem()
