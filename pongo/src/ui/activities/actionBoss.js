// ACTION BOSS: desafio final do Professor Silêncio — sequência de ações,
// conjugação e frase. Sem combate: cada acerto devolve cor ao professor.
import { gsap } from 'gsap'
import { h, button, shuffle, jpHTML } from '../dom.js'
import { openModal } from '../ui.js'
import { VERB, ACTION_VERB, SENTENCES } from '../../core/content.js'
import { markRecognized, recordError, addScore } from '../../core/store.js'
import { frameURL } from '../../art/register.js'
import { feedback, verbLabel } from './common.js'
import { animatedSprite } from './actionMatch.js'
import { makeFormQuestion, renderFormQuestion } from './verbTransformer.js'
import { sentenceBuilder } from './sentenceBuilder.js'

const SEQ = ['run', 'jump', 'drink']

function bossHeader(stage) {
  const pct = stage / 3
  return h(
    'div.boss-head',
    {},
    h('img.boss-face', {
      src: frameURL('silence', stage >= 3 ? 'happy_0' : 'shh_0'),
      alt: '',
      style: { filter: `grayscale(${1 - pct}) saturate(${0.6 + pct})` }
    }),
    h('div.boss-bar', {}, h('div.boss-fill', { style: { width: `${pct * 100}%` } })),
    h('small', {}, `Cor devolvida: ${stage}/3`)
  )
}

function sequenceStage() {
  return new Promise((resolve) => {
    const tv = h('div.am-stage.boss-tv')
    const slots = h(
      'div.seq-slots',
      {},
      SEQ.map((_, i) => h('div.seq-slot', { dataset: { i } }, `${i + 1}`))
    )
    const opts = h('div.options')
    const fb = h('div.feedback')
    const replay = button('↺ Ver de novo', () => play(), 'btn-ghost')
    const next = button('Próximo ▶', () => m.close(true), 'btn-primary')
    next.hidden = true
    const m = openModal({
      title: 'Desafio 1: a sequência',
      jp: '{順番|じゅんばん}は？',
      closable: false,
      content: h(
        'div.boss',
        {},
        bossHeader(0),
        h(
          'p.sb-prompt',
          {},
          '🎬 Observe as três ações do Pongo e toque nos verbos na ordem certa.'
        ),
        tv,
        slots,
        opts,
        fb,
        h('div.row', {}, replay, next)
      )
    })
    let picked = []
    let sprite = null
    let timer = null
    const verbs = SEQ.map((a) => VERB[ACTION_VERB[a]])
    const choices = shuffle([...verbs, VERB.taberu])
    function play() {
      clearTimeout(timer)
      let k = 0
      const step = () => {
        sprite?.stop()
        if (k >= SEQ.length) {
          tv.replaceChildren(h('div.tv-end', {}, '？'))
          return
        }
        sprite = animatedSprite('pongo', SEQ[k])
        tv.replaceChildren(sprite.el, h('div.tv-n', {}, `${k + 1}`))
        gsap.fromTo(
          sprite.el,
          { x: -40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3 }
        )
        k++
        timer = setTimeout(step, 1600)
      }
      step()
    }
    function render() {
      slots.querySelectorAll('.seq-slot').forEach((s, i) => {
        s.innerHTML = picked[i] ? verbLabel(picked[i]) : `${i + 1}`
        s.classList.toggle('filled', !!picked[i])
      })
      opts.replaceChildren(
        ...choices.map((v) =>
          h('button.option', {
            type: 'button',
            lang: 'ja',
            disabled: picked.includes(v),
            html: verbLabel(v),
            onclick: () => pick(v)
          })
        )
      )
    }
    function pick(v) {
      picked.push(v)
      render()
      if (picked.length < SEQ.length) return
      const ok = picked.every((p, i) => p.id === verbs[i].id)
      if (ok) {
        verbs.forEach((x) => markRecognized(x.id))
        addScore(60)
        feedback(
          fb,
          true,
          `<b>正解！</b> ${verbs.map((x) => verbLabel(x)).join(' → ')}<br><small>Correr → pular → beber.</small>`
        )
        opts.replaceChildren()
        replay.hidden = true
        next.hidden = false
        clearTimeout(timer)
        sprite?.stop()
      } else {
        const wrongAt = picked.findIndex((p, i) => p.id !== verbs[i].id)
        recordError('boss-sequence', verbs[wrongAt].id)
        feedback(
          fb,
          false,
          `A ação nº ${wrongAt + 1} não é <span lang="ja">${verbLabel(picked[wrongAt])}</span> (${picked[wrongAt].meaning}). Veja a sequência de novo!`
        )
        picked = []
        setTimeout(render, 600)
        play()
      }
    }
    render()
    play()
    m.done.then(() => {
      clearTimeout(timer)
      sprite?.stop()
      resolve(true)
    })
  })
}

function formStage() {
  return new Promise((resolve) => {
    const qs = [
      makeFormQuestion(VERB.oyogu, 'teimasu'),
      makeFormQuestion(VERB.yomu, 'teimasu')
    ]
    let i = 0
    const area = h('div')
    const next = button('Próximo ▶', () => go(), 'btn-primary')
    const m = openModal({
      title: 'Desafio 2: ～ています',
      jp: '{今|いま}、{何|なに}をしていますか。',
      closable: false,
      content: h(
        'div.boss',
        {},
        bossHeader(1),
        h(
          'p.sb-prompt',
          {},
          '🔁 O que está acontecendo agora? Transforme para ～ています.'
        ),
        area,
        h('div.row', {}, next)
      )
    })
    function go() {
      if (i >= qs.length) return m.close(true)
      next.hidden = true
      renderFormQuestion(qs[i], area, () => {
        next.hidden = false
        next.focus()
      })
      i++
    }
    go()
    m.done.then(() => resolve(true))
  })
}

export async function actionBoss() {
  const intro = openModal({
    title: 'Professor Silêncio',
    jp: '{最後|さいご}の{挑戦|ちょうせん}',
    content: h(
      'div.boss',
      {},
      bossHeader(0),
      h(
        'p',
        {},
        'O Professor Silêncio acha que palavras são barulhentas. Mostre a ele a beleza dos verbos em três desafios — sem lutas, só japonês!'
      ),
      h(
        'ol.boss-steps',
        {},
        h('li', {}, 'Ordene uma sequência de ações.'),
        h('li', {}, 'Use ～ています.'),
        h('li', {}, 'Monte uma frase completa.')
      ),
      h(
        'div.row',
        {},
        button('Começar ▶', () => intro.close(true), 'btn-primary')
      )
    )
  })
  if (!(await intro.done)) return null
  await sequenceStage()
  await formStage()
  let res = null
  while (!res) {
    res = await sentenceBuilder(SENTENCES.boss, {
      title: 'Desafio 3: a frase',
      jp: '{文|ぶん}を{作|つく}ろう'
    })
  }
  const end = openModal({
    title: 'Cores devolvidas!',
    content: h(
      'div.boss',
      {},
      bossHeader(3),
      h('p.big-jp', { lang: 'ja', html: jpHTML('{言葉|ことば}はきれいですね。') }),
      h('p', {}, '“As palavras são bonitas, não é?” — o Professor Silêncio sorriu.'),
      h(
        'div.row',
        {},
        button('Abrir o portal ✨', () => end.close(true), 'btn-primary')
      )
    )
  })
  await end.done
  return { ok: true }
}
