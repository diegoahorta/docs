import { h, jpBlock } from '../dom.js'
import { openModal } from '../ui.js'
import { ITEMS } from '../../core/content.js'
import { get } from '../../core/store.js'

export function openInventory() {
  const inv = get().inventory
  const content = inv.length
    ? h(
        'div.inv-grid',
        {},
        inv.map((id) => {
          const it = ITEMS[id]
          return h(
            'div.inv-item',
            {},
            h('div.inv-icon', {}, it.icon),
            jpBlock(it.text, it.pt, { size: 'md' }),
            h('div.inv-use', {}, jpBlock(it.use, it.usePt, { size: 'sm' }))
          )
        })
      )
    : h(
        'p.empty',
        {},
        'Sua mochila está vazia. Interaja com objetos do parque para coletar itens!'
      )
  openModal({
    title: 'Inventário',
    jp: '{持|も}ち{物|もの}',
    content: h(
      'div',
      {},
      h(
        'p.hint',
        { lang: 'ja' },
        '持つ（もつ）= segurar/carregar. ',
        h('span', {}, 'Cada item vem com uma frase de uso.')
      ),
      content
    )
  })
}
