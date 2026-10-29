// ACTION TO LEARN: quando o Pongo realiza uma ação, mostramos o verbo correspondente,
// registramos no diário (INPUT) e, na primeira vez, exibimos o cartão completo.
import { VERB, ACTION_VERB } from '../core/content.js'
import { markSeen, addScore } from '../core/store.js'
import { showActionCard } from '../ui/ui.js'

const last = new Map()
let muted = false

/** Silencia os cartões (ex.: durante o Verb Runner, que tem seu próprio foco). */
export function muteLearn(v) {
  muted = v
}
const COOLDOWN = { walk: 12000, run: 12000, jump: 9000, idle: 30000, fall: 8000 }

/** @param key ação (run, jump...) ou id de verbo (hashiru...) */
export function learn(key, { force = false } = {}) {
  const verbId = VERB[key] ? key : ACTION_VERB[key]
  const verb = VERB[verbId]
  if (!verb || muted) return verb ?? null
  const now = performance.now()
  const cd = COOLDOWN[verb.action] ?? 4000
  if (!force && now - (last.get(verbId) ?? -Infinity) < cd) return verb
  last.set(verbId, now)
  const isNew = markSeen(verbId)
  if (isNew) addScore(10)
  showActionCard(verb, { big: isNew })
  return verb
}

export function resetLearnCooldowns() {
  last.clear()
}
