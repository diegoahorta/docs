import { gsap } from 'gsap'
import { h, jpHTML, button } from '../dom.js'
import { bus } from '../../core/events.js'
import { level } from '../../core/store.js'
import { sfx } from '../../core/audio.js'

const STAGES = [
  {
    id: 'park',
    n: 1,
    jp: '{公園|こうえん}の{冒険|ぼうけん}',
    title: 'A Aventura no Parque',
    desc: 'Verbos de movimento e ações do dia a dia.',
    icon: '🌳',
    open: true
  },
  {
    id: 'station',
    n: 2,
    jp: '{駅|えき}の{冒険|ぼうけん}',
    title: 'A Estação',
    desc: 'Módulo 1 completo: 行く, 来る, 帰る, 入る, 出る.',
    icon: '🚉'
  },
  {
    id: 'school',
    n: 3,
    jp: '{学校|がっこう}の{冒険|ぼうけん}',
    title: 'A Escola',
    desc: 'Módulo 2: 見る, 聞く, 書く, 起きる + forma ない.',
    icon: '🏫'
  },
  {
    id: 'market',
    n: 4,
    jp: '{市場|いちば}の{冒険|ぼうけん}',
    title: 'O Mercado',
    desc: 'Módulo 3: 買う, 使う, 開ける, 持つ + forma たい.',
    icon: '🏮'
  }
]

export function mapScreen() {
  const nodes = STAGES.map((s) => {
    const lv = level(s.id)
    const stars = '★'.repeat(lv.stars) + '☆'.repeat(3 - lv.stars)
    return h(
      `button.map-node${s.open ? '' : '.locked'}`,
      {
        type: 'button',
        disabled: !s.open,
        onclick: () => {
          sfx('click')
          bus.emit('nav:play', s.id)
        }
      },
      h('div.map-icon', {}, s.open ? s.icon : '🔒'),
      h('div.map-n', {}, `Fase ${s.n}`),
      h('div.map-jp', { lang: 'ja', html: jpHTML(s.jp) }),
      h('div.map-title', {}, s.title),
      h('div.map-desc', {}, s.desc),
      s.open
        ? h('div.map-stars', {}, stars, ` · ${lv.missions.length}/10 💎`)
        : h('div.map-soon', {}, 'Em breve')
    )
  })
  const el = h(
    'div.screen.map-screen',
    {},
    h(
      'div.map-card',
      {},
      h(
        'div.map-head',
        {},
        button('← Voltar', () => bus.emit('nav:title'), 'btn-ghost'),
        h('h2', {
          lang: 'ja',
          html: `${jpHTML('{動詞|どうし}の{町|まち}')} <small>Cidade dos Verbos</small>`
        })
      ),
      h('div.map-path', {}, nodes)
    )
  )
  requestAnimationFrame(() =>
    gsap.from(nodes, {
      y: 50,
      opacity: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: 'back.out(1.6)'
    })
  )
  return el
}
