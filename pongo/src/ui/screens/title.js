import { gsap } from 'gsap'
import { h, button } from '../dom.js'
import { bus } from '../../core/events.js'
import { get } from '../../core/store.js'
import { sfx, unlockAudio } from '../../core/audio.js'

const go = (evt) => () => {
  unlockAudio()
  sfx('click')
  bus.emit(evt)
}

export function titleScreen() {
  const letters = [...'PONGO'].map((c) => h('span.logo-letter', {}, c))
  const hasProgress = get().score > 0
  const el = h(
    'div.screen.title-screen',
    {},
    h(
      'div.title-card',
      {},
      h('div.brand', {}, 'ODU Creative · ODU Kizuna'),
      h('h1.logo', { 'aria-label': 'PONGO' }, letters),
      h('div.logo-jp', { lang: 'ja' }, '日本語アクション！'),
      h('div.logo-sub', {}, 'Japanese Verb Adventure'),
      h(
        'p.title-pitch',
        {},
        'Ajude o Pongo a devolver os verbos à Cidade dos Verbos: cada ação no parque ensina um verbo japonês.'
      ),
      h(
        'div.title-actions',
        {},
        button(
          hasProgress ? '▶ Continuar aventura' : '▶ Jogar',
          go('nav:play'),
          'btn-primary btn-big'
        ),
        button('🗺️ Mapa de fases', go('nav:map'), 'btn-secondary')
      ),
      h(
        'div.title-links',
        {},
        button('📔 Diário', go('ui:journal'), 'btn-ghost'),
        button('📘 Caderno', go('ui:notebook'), 'btn-ghost'),
        button('🔁 Revisão', go('ui:review'), 'btn-ghost'),
        button('🏆 Conquistas', go('ui:achievements'), 'btn-ghost'),
        button('⚙️ Configurações', go('ui:settings'), 'btn-ghost')
      ),
      h(
        'div.title-controls',
        {},
        'A/D ou ←/→ andar · Espaço pular · Shift correr · E interagir · Esc pausar'
      )
    )
  )
  requestAnimationFrame(() => {
    gsap.from(el.querySelector('.title-card'), {
      y: 40,
      opacity: 0,
      duration: 0.6,
      ease: 'back.out(1.4)'
    })
    gsap.from(letters, {
      y: -80,
      opacity: 0,
      rotation: () => gsap.utils.random(-30, 30),
      stagger: 0.08,
      duration: 0.7,
      ease: 'bounce.out',
      delay: 0.2
    })
    gsap.to(letters, {
      y: -6,
      duration: 0.6,
      stagger: { each: 0.1, yoyo: true, repeat: -1 },
      ease: 'sine.inOut',
      delay: 1.4
    })
  })
  return el
}
