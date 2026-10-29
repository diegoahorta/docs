import { h } from '../dom.js'
import { openModal } from '../ui.js'
import { ACHIEVEMENTS } from '../../core/content.js'
import { get } from '../../core/store.js'

export function openAchievements() {
  const got = get().achievements
  openModal({
    title: `Conquistas — ${got.length}/${ACHIEVEMENTS.length}`,
    jp: '{実績|じっせき}',
    content: h(
      'div.ach-grid',
      {},
      ACHIEVEMENTS.map((a) =>
        h(
          `div.ach${got.includes(a.id) ? '.got' : ''}`,
          {},
          h('div.ach-icon', {}, got.includes(a.id) ? a.icon : '🔒'),
          h('b', {}, a.title),
          h('small', {}, a.desc)
        )
      )
    )
  })
}
