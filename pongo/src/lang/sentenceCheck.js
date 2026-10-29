// Verificação de frases montadas com blocos (chunking) + feedback explicativo.

export const ROLE_INFO = {
  topic: {
    label: 'Tópico',
    color: 'blue',
    desc: 'de quem/do que falamos (marcado por は)'
  },
  location: {
    label: 'Local',
    color: 'green',
    desc: 'onde a ação acontece (で) ou destino (に)'
  },
  object: {
    label: 'Objeto',
    color: 'purple',
    desc: 'o que recebe a ação (marcado por を)'
  },
  time: { label: 'Tempo', color: 'orange', desc: 'quando a ação acontece' },
  verb: { label: 'Verbo', color: 'red', desc: 'a ação — sempre no final da frase' }
}

const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])

/**
 * @param sentence { chunks, distractors, accept, altNote }
 * @param placed   ids dos blocos na ordem em que o aluno os colocou
 * @returns { ok, why, tag, note }
 */
export function checkSentence(sentence, placed) {
  const accept = sentence.accept ?? [sentence.chunks.map((c) => c.id)]
  const idx = accept.findIndex((a) => same(a, placed))
  if (idx === 0) return { ok: true, note: sentence.note ?? null }
  if (idx > 0) return { ok: true, note: sentence.altNote ?? sentence.note ?? null }

  if (!placed.length) {
    return { ok: false, tag: 'empty', why: 'Arraste os blocos para a linha da frase.' }
  }
  const distractor = (sentence.distractors ?? []).find((d) => placed.includes(d.id))
  if (distractor)
    return { ok: false, tag: distractor.tag ?? 'distractor', why: distractor.why }

  const need = sentence.chunks.filter((c) => !placed.includes(c.id))
  if (need.length) {
    const roles = need.map((c) => ROLE_INFO[c.role]?.label ?? c.role).join(', ')
    return {
      ok: false,
      tag: 'missing',
      why: `Ainda faltam blocos (${roles}). Uma frase completa precisa de todas as partes.`
    }
  }

  const verbId = sentence.chunks.find((c) => c.role === 'verb')?.id
  if (verbId && placed[placed.length - 1] !== verbId) {
    return {
      ok: false,
      tag: 'verb-last',
      why: 'Em japonês o verbo fica no FINAL da frase (ordem Sujeito-Objeto-Verbo). Coloque o bloco vermelho por último.'
    }
  }
  return {
    ok: false,
    tag: 'order',
    why: 'As partes estão certas, mas a ordem não soa natural. Comece pelo tópico com は e deixe o verbo no final.'
  }
}

/** Monta o texto (com marcação de ruby) de uma lista de ids. */
export function joinChunks(sentence, ids) {
  const all = [...sentence.chunks, ...(sentence.distractors ?? [])]
  return ids.map((id) => all.find((c) => c.id === id)?.text ?? '').join('') + '。'
}
