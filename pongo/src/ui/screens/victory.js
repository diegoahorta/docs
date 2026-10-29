import { gsap } from 'gsap'
import { h, button, jpHTML } from '../dom.js'
import { openModal, confetti } from '../ui.js'
import { bus } from '../../core/events.js'
import { get } from '../../core/store.js'
import { frameURL } from '../../art/register.js'

export function openVictory({ stars, activities, verbs }) {
  const starEls = [1, 2, 3].map((i) => h(`span.vstar${i <= stars ? '.on' : ''}`, {}, '★'))
  const m = openModal({
    title: 'Fase concluída!',
    jp: '{公園|こうえん}クリア！',
    closable: false,
    content: h(
      'div.victory',
      {},
      h('img.victory-pongo', { src: frameURL('pongo', 'celebrate_1'), alt: '' }),
      h('div.vstars', {}, starEls),
      h('p.big-jp', {
        lang: 'ja',
        html: jpHTML('ポンゴ[は]ポータル[に]{入|はい}りました！')
      }),
      h(
        'p',
        {},
        'Pongo entrou no portal! A Cidade dos Verbos está um pouco mais barulhenta — do jeito bom.'
      ),
      h(
        'ul.victory-stats',
        {},
        h('li', {}, `💎 10/10 cristais`),
        h('li', {}, `📔 ${verbs} verbos descobertos`),
        h('li', {}, `🎯 ${activities}/5 atividades concluídas`),
        h('li', {}, `⭐ ${get().score} pontos`)
      ),
      h(
        'p.hint',
        {},
        stars < 3
          ? 'Dica: complete as 5 atividades (Action Match, Verb Runner, NPC Challenge, Grammar Bridge e Verb Transformer) para ganhar 3 estrelas.'
          : 'Perfeito! Você completou todas as atividades.'
      ),
      h(
        'div.row',
        {},
        button('🔁 Revisar', () => (m.close(), bus.emit('ui:review')), 'btn-ghost'),
        button('🗺️ Mapa de fases', () => (m.close(), bus.emit('nav:map')), 'btn-primary')
      )
    )
  })
  requestAnimationFrame(() => {
    gsap.from(starEls, {
      scale: 0,
      rotation: -180,
      stagger: 0.2,
      duration: 0.6,
      ease: 'back.out(2)',
      delay: 0.3
    })
    confetti(60)
  })
  return m.done
}
