// Registro de aprendizagem: vocabulário, acertos, erros, tentativas,
// habilidades, dificuldades recorrentes e revisão espaçada simples.
// Importante: é um indicador de prática, não uma certificação.
import { state } from '../systems/GameState.js'
import { bus } from '../systems/EventBus.js'
import { VOCAB_BY_ID, SKILLS } from './vocabulary.js'

const L = () => state.learning

export const learning = {
  /** INPUT: o aluno foi exposto à palavra. Retorna as novas. */
  see(ids = []) {
    const fresh = []
    ids.forEach((id) => {
      if (!VOCAB_BY_ID[id]) return
      if (!L().seen[id]) {
        L().seen[id] = Date.now()
        fresh.push(id)
      }
    })
    if (fresh.length) bus.emit('learning:updated', { fresh })
    return fresh
  },

  /** Registra uma tentativa (INTAKE/OUTPUT). */
  record({ skill, vocab = [], correct, tag } = {}) {
    const l = L()
    l.attempts++
    correct ? l.correct++ : l.wrong++
    if (skill) {
      l.skills[skill] ??= { correct: 0, wrong: 0 }
      correct ? l.skills[skill].correct++ : l.skills[skill].wrong++
    }
    vocab.forEach((id) => {
      if (!VOCAB_BY_ID[id]) return
      l.seen[id] ??= Date.now()
      const v = (l.vocab[id] ??= { correct: 0, wrong: 0, streak: 0 })
      if (correct) {
        v.correct++
        v.streak++
        if (v.streak >= 2) l.review = l.review.filter((r) => r !== id)
      } else {
        v.wrong++
        v.streak = 0
        if (!l.review.includes(id)) l.review.push(id)
      }
    })
    if (!correct) {
      const key = tag || skill || 'geral'
      l.errors[key] = (l.errors[key] || 0) + 1
    }
    bus.emit('learning:updated', {})
  },

  completeChallenge(id) {
    if (!L().challenges.includes(id)) L().challenges.push(id)
    bus.emit('learning:updated', {})
  },

  isSeen: (id) => !!L().seen[id],

  /** Palavra considerada aprendida: vista, ≥2 acertos e mais acertos que erros. */
  isLearned(id) {
    const v = L().vocab[id]
    return !!v && v.correct >= 2 && v.correct > v.wrong
  },

  skillRatio(skill) {
    const s = L().skills[skill]
    if (!s || s.correct + s.wrong === 0) return null
    return s.correct / (s.correct + s.wrong)
  },

  /** Itens para revisão, priorizando os mais errados. */
  reviewList(limit = 10) {
    const l = L()
    return [...l.review]
      .sort((a, b) => (l.vocab[b]?.wrong || 0) - (l.vocab[a]?.wrong || 0))
      .slice(0, limit)
  },

  recurring(limit = 3) {
    return Object.entries(L().errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, label: SKILLS[tag] || tag, count }))
  },

  summary() {
    const l = L()
    return {
      seen: Object.keys(l.seen).length,
      learned: Object.keys(l.vocab).filter((id) => learning.isLearned(id)).length,
      attempts: l.attempts,
      correct: l.correct,
      wrong: l.wrong,
      accuracy: l.attempts ? l.correct / l.attempts : 0,
      challenges: l.challenges.length,
      review: l.review.length
    }
  }
}
