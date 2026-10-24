// Salvamento local (localStorage). O armazenamento é injetável para testes.
import { SAVE_KEY } from '../config/gameConfig.js'
import { state, DEFAULT_SETTINGS, newProgress, newLearning } from './GameState.js'

const VERSION = 1

export class SaveSystem {
  constructor(
    storage = typeof localStorage !== 'undefined' ? localStorage : null,
    key = SAVE_KEY
  ) {
    this.storage = storage
    this.key = key
    this.timer = null
  }

  hasSave() {
    try {
      const raw = this.storage?.getItem(this.key)
      return !!raw && !!JSON.parse(raw).progress?.started
    } catch {
      return false
    }
  }

  load() {
    try {
      const raw = this.storage?.getItem(this.key)
      if (!raw) return false
      const data = JSON.parse(raw)
      if (data.version !== VERSION) return false
      state.settings = { ...DEFAULT_SETTINGS, ...data.settings }
      state.progress = { ...newProgress(), ...data.progress }
      state.learning = { ...newLearning(), ...data.learning }
      return true
    } catch (err) {
      console.warn('[save] falha ao carregar', err)
      return false
    }
  }

  save() {
    clearTimeout(this.timer)
    this.timer = null
    try {
      this.storage?.setItem(
        this.key,
        JSON.stringify({
          version: VERSION,
          savedAt: Date.now(),
          settings: state.settings,
          progress: state.progress,
          learning: state.learning
        })
      )
      return true
    } catch (err) {
      console.warn('[save] falha ao salvar', err)
      return false
    }
  }

  /** Salva com atraso para agrupar várias mudanças. */
  saveSoon(ms = 400) {
    if (this.timer) return
    this.timer = setTimeout(() => this.save(), ms)
  }

  /** Apaga progresso e aprendizagem, mantendo configurações. */
  reset() {
    state.progress = newProgress()
    state.learning = newLearning()
    this.save()
  }
}

export const saves = new SaveSystem()
