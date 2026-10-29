// ACTION MATCH: observe a animação do Pongo e escolha o verbo correto (INTAKE).
import { gsap } from 'gsap'
import { h, button, sample, shuffle } from '../dom.js'
import { openModal } from '../ui.js'
import { animFrames, hasAnim } from '../../art/register.js'
import { VERB, ACTION_VERB } from '../../core/content.js'
import { markRecognized, recordError, addScore } from '../../core/store.js'
import { speak } from '../../core/tts.js'
import { jpHTML } from '../dom.js'
import { feedback, progressDots, verbLabel } from './common.js'

const POOL = [
  'run',
  'jump',
  'drink',
  'eat',
  'read',
  'sleep',
  'swim',
  'sit',
  'walk',
  'write'
]

/** Imagem animada a partir dos quadros do spritesheet. Retorna { el, stop }. */
export function animatedSprite(sheet, anim, cls = 'anim-sprite') {
  const { urls, fps } = animFrames(sheet, anim)
  const img = h(`img.${cls}`, { src: urls[0] ?? '', alt: '' })
  let i = 0
  const timer = setInterval(() => {
    if (!img.isConnected) return clearInterval(timer)
    i = (i + 1) % urls.length
    img.src = urls[i]
  }, 1000 / fps)
  return { el: img, stop: () => clearInterval(timer) }
}

export function actionMatch({ rounds = 3 } = {}) {
  const actions = sample(
    POOL.filter((a) => hasAnim('pongo', a) && ACTION_VERB[a]),
    rounds
  )
  let round = 0
  let score = 0
  let firstTry = true
  let sprite = null
  const stage = h('div.am-stage')
  const opts = h('div.options')
  const fb = h('div.feedback')
  const dots = h('div')
  const next = button('Próximo ▶', () => nextRound(), 'btn-primary')
  next.hidden = true
  const content = h(
    'div.action-match',
    {},
    dots,
    h('p.sb-prompt', {}, '👀 O que o Pongo está fazendo? Escolha o verbo.'),
    stage,
    opts,
    fb,
    h('div.row', {}, next)
  )
  const modal = openModal({
    title: 'Action Match',
    jp: '{見|み}て、{選|えら}んで！',
    content
  })

  function nextRound() {
    if (round >= actions.length) return modal.close({ score, total: actions.length })
    sprite?.stop()
    const action = actions[round]
    const verb = VERB[ACTION_VERB[action]]
    dots.replaceChildren(progressDots(actions.length, round))
    sprite = animatedSprite('pongo', action)
    stage.replaceChildren(sprite.el)
    gsap.fromTo(
      sprite.el,
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' }
    )
    fb.className = 'feedback'
    fb.replaceChildren()
    next.hidden = true
    firstTry = true
    const others = sample(
      POOL.filter((a) => a !== action && ACTION_VERB[a]),
      3
    ).map((a) => VERB[ACTION_VERB[a]])
    opts.replaceChildren(
      ...shuffle([verb, ...others]).map((v) =>
        h('button.option', {
          type: 'button',
          lang: 'ja',
          html: verbLabel(v),
          onclick: (e) => answer(e.currentTarget, v, verb)
        })
      )
    )
    round++
  }

  function answer(btn, chosen, verb) {
    if (!next.hidden) return
    if (chosen.id === verb.id) {
      btn.classList.add('right')
      if (firstTry) score++
      markRecognized(verb.id)
      addScore(firstTry ? 20 : 8)
      speak(verb.example.text)
      feedback(
        fb,
        true,
        `<b>正解！</b> <span lang="ja">${jpHTML(verb.example.text)}</span><br><small>${verb.example.pt}</small>`
      )
      opts.querySelectorAll('button').forEach((b) => (b.disabled = true))
      next.hidden = false
      next.textContent = round >= actions.length ? 'Concluir ✓' : 'Próximo ▶'
      next.focus()
    } else {
      btn.classList.add('wrong')
      btn.disabled = true
      firstTry = false
      recordError('action-match', verb.id)
      feedback(
        fb,
        false,
        `<span lang="ja">${verbLabel(chosen)}</span> significa <b>${chosen.meaning}</b>. Observe de novo: o que o Pongo faz com o corpo?`
      )
    }
  }

  nextRound()
  return modal.done.then((r) => {
    sprite?.stop()
    return (
      r ??
      (round >= actions.length && !next.hidden ? { score, total: actions.length } : null)
    )
  })
}
