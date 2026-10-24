// Gera atividades de reconhecimento e produção para qualquer palavra —
// usadas no diário e na revisão dos itens errados em missões futuras.
import { VOCAB, VOCAB_BY_ID } from './vocabulary.js'

const shuffle = (arr, rand = Math.random) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Reconhecimento: ver a palavra e escolher o significado. */
export function recognitionItem(id, rand = Math.random) {
  const w = VOCAB_BY_ID[id]
  if (!w) return null
  const pool = VOCAB.filter((o) => o.id !== id && o.pt !== w.pt)
  const same = pool.filter((o) => o.cat === w.cat)
  const others = shuffle(same.length >= 3 ? same : pool, rand).slice(0, 3)
  const options = shuffle([w, ...others], rand)
  return {
    type: 'choice',
    review: true,
    skill: w.skill,
    vocab: [id],
    prompt: w.word,
    promptPt: 'O que significa esta palavra?',
    big: true,
    options: options.map((o) => ({ pt: o.pt })),
    answer: options.indexOf(w),
    explain: `${w.kanji || w.kana} (${w.kana}) = ${w.pt}. Exemplo: ${w.exPt}`
  }
}

/** Produção: montar a frase-exemplo da palavra com blocos. */
export function productionItem(id, rand = Math.random) {
  const w = VOCAB_BY_ID[id]
  if (!w) return null
  const distractors = []
  if (w.ex.includes('[pred:います]')) distractors.push('[pred:あります]')
  if (w.ex.includes('[pred:あります]')) distractors.push('[pred:います]')
  const posPool = VOCAB.filter(
    (o) => ['spatial', 'cardinal', 'relative'].includes(o.cat) && o.id !== id
  )
  const p = shuffle(posPool, rand)[0]
  if (p && w.ex.includes('[pos:')) distractors.push(`[pos:${p.word}]`)
  if (w.ex.includes('[part:に]')) distractors.push('[part:で]')
  return {
    type: 'builder',
    review: true,
    skill: 'building',
    vocab: [id],
    prompt: `Monte: “${w.exPt}”`,
    answer: w.ex,
    distractors: distractors.slice(0, 3),
    explain: `Frase-modelo com ${w.kanji || w.kana} (${w.pt}).`
  }
}

/** Itens de revisão a injetar no início de um conjunto de puzzles. */
export function reviewItems(ids, max = 2, rand = Math.random) {
  return ids
    .slice(0, max)
    .map((id, i) => (i % 2 === 0 ? recognitionItem(id, rand) : productionItem(id, rand)))
    .filter(Boolean)
}
