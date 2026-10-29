// Caderno gramatical.
import { h, jpHTML } from '../dom.js'
import { openModal } from '../ui.js'
import { GRAMMAR } from '../../core/content.js'
import { sfx } from '../../core/audio.js'

export function openNotebook(topicId) {
  const tabs = h('div.tabs', { role: 'tablist' })
  const page = h('div.nb-page')
  const show = (t) => {
    tabs
      .querySelectorAll('button')
      .forEach((b) => b.classList.toggle('active', b.dataset.id === t.id))
    page.replaceChildren(
      h('h3', {}, h('span', { lang: 'ja', html: jpHTML(t.jp) }), ' — ', t.title),
      h(
        'ul.nb-list',
        {},
        t.body.map((b) => h('li', { html: b }))
      ),
      h(
        'div.nb-examples',
        {},
        t.examples.map((e) => h('div.nb-ex', { lang: 'ja', html: jpHTML(e) }))
      )
    )
  }
  for (const t of GRAMMAR) {
    tabs.append(
      h(
        'button.tab',
        {
          type: 'button',
          role: 'tab',
          dataset: { id: t.id },
          onclick: () => (sfx('click'), show(t))
        },
        t.title
      )
    )
  }
  show(GRAMMAR.find((t) => t.id === topicId) ?? GRAMMAR[0])
  openModal({
    title: 'Caderno gramatical',
    jp: '{文法|ぶんぽう}ノート',
    content: h('div.notebook', {}, tabs, page),
    wide: true
  })
}
