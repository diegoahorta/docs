// Verifica conquistas sempre que o progresso muda.
import { bus } from '../core/events.js'
import { get, unlockAchievement, discoveredVerbs, addScore } from '../core/store.js'
import { ACHIEVEMENTS } from '../core/content.js'
import { toast } from '../ui/ui.js'
import { sfx } from '../core/audio.js'

const RULES = {
  first_verb: () => discoveredVerbs().length >= 1,
  five_verbs: () => discoveredVerbs().length >= 5,
  ten_verbs: () => discoveredVerbs().length >= 10,
  first_sentence: (s) => s.sentences >= 1,
  transformer: (s) => !!s.flags.transformerPerfect,
  runner: (s) => !!s.activities.runner?.done,
  swimmer: (s) => (s.verbs.oyogu?.seen ?? 0) > 0,
  explorer: (s) =>
    ['seesaw', 'swing', 'slide', 'ball', 'bike'].every((k) => s.flags[`played_${k}`]),
  park_clear: (s) => !!s.levels.park?.completed
}

let busy = false
export function initAchievements() {
  bus.on('progress', ({ kind }) => {
    if (busy || kind === 'achievement' || kind === 'score') return
    busy = true
    const s = get()
    for (const a of ACHIEVEMENTS) {
      if (!s.achievements.includes(a.id) && RULES[a.id]?.(s) && unlockAchievement(a.id)) {
        addScore(50)
        sfx('achievement')
        toast(`<b>Conquista!</b> ${a.title}`, {
          icon: a.icon,
          type: 'achievement',
          html: true,
          dur: 3.5
        })
      }
    }
    busy = false
  })
}
