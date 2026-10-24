import { describe, it, expect, beforeEach } from 'vitest'
import { state, resetState } from '../src/systems/GameState.js'
import { learning } from '../src/education/LearningTracker.js'
import { SaveSystem } from '../src/systems/SaveSystem.js'

const memoryStorage = () => {
  const m = new Map()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k)
  }
}

describe('registro de aprendizagem', () => {
  beforeEach(() => resetState())

  it('conta tentativas, acertos e erros por habilidade', () => {
    learning.record({ skill: 'location', vocab: ['naka'], correct: true })
    learning.record({ skill: 'location', vocab: ['naka'], correct: false })
    const s = learning.summary()
    expect(s.attempts).toBe(2)
    expect(s.correct).toBe(1)
    expect(learning.skillRatio('location')).toBe(0.5)
  })

  it('itens errados entram na revisão e saem após 2 acertos seguidos', () => {
    learning.record({ skill: 'location', vocab: ['tonari'], correct: false })
    expect(learning.reviewList()).toContain('tonari')
    learning.record({ skill: 'location', vocab: ['tonari'], correct: true })
    expect(learning.reviewList()).toContain('tonari')
    learning.record({ skill: 'location', vocab: ['tonari'], correct: true })
    expect(learning.reviewList()).not.toContain('tonari')
  })

  it('dificuldades recorrentes ordenadas', () => {
    learning.record({ skill: 'relative', correct: false })
    learning.record({ skill: 'relative', correct: false })
    learning.record({ skill: 'particles', correct: false })
    expect(learning.recurring()[0].tag).toBe('relative')
  })

  it('exposição (INPUT) registra palavras novas uma vez', () => {
    expect(learning.see(['kita', 'kita', 'xx'])).toEqual(['kita'])
    expect(learning.see(['kita'])).toEqual([])
  })
})

describe('salvamento local', () => {
  beforeEach(() => resetState())

  it('salva e carrega progresso, configurações e aprendizagem', () => {
    const store = memoryStorage()
    const s = new SaveSystem(store, 'test')
    state.progress.started = true
    state.progress.phase = 3
    state.settings.furigana = false
    learning.record({ skill: 'kanji', vocab: ['eki'], correct: true })
    expect(s.save()).toBe(true)
    resetState()
    state.settings.furigana = true
    expect(s.load()).toBe(true)
    expect(state.progress.phase).toBe(3)
    expect(state.settings.furigana).toBe(false)
    expect(state.learning.vocab.eki.correct).toBe(1)
    expect(s.hasSave()).toBe(true)
  })

  it('reset apaga progresso mas mantém configurações', () => {
    const s = new SaveSystem(memoryStorage(), 'test')
    state.progress.phase = 4
    state.settings.volume = 0.2
    s.reset()
    expect(state.progress.phase).toBe(1)
    expect(state.settings.volume).toBe(0.2)
  })
})
