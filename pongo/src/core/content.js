// Acesso central aos dados pedagógicos (JSON).
import verbsData from '../data/verbs.json'
import sentences from '../data/sentences.json'
import missionsData from '../data/missions.json'
import npcData from '../data/npcs.json'
import grammar from '../data/grammar.json'
import achievementsData from '../data/achievements.json'
import itemsData from '../data/items.json'

export const VERBS = verbsData.verbs
export const VERB = Object.fromEntries(VERBS.map((v) => [v.id, v]))
export const MVP_VERBS = VERBS.filter((v) => v.mvp)
export const SENTENCES = sentences
export const LEVELS = missionsData
export const NPCS = npcData.npcs
export const INTRO = npcData.intro
export const GRAMMAR = grammar.topics
export const ACHIEVEMENTS = achievementsData.achievements
export const ITEMS = Object.fromEntries(itemsData.items.map((i) => [i.id, i]))

/** Verbo associado a uma animação/ação do Pongo. */
export const ACTION_VERB = Object.fromEntries(
  VERBS.filter((v) => v.action).map((v) => [v.action, v.id])
)

export const TEIRU_NOTE = {
  progress:
    'Aqui ～ています indica uma ação em andamento. Atenção: com outros verbos, ～ています também pode indicar um estado resultante ou um hábito.',
  result:
    'Com este verbo, ～ています indica o ESTADO resultante (ex.: 座っています = está sentado), não uma ação em andamento.'
}
