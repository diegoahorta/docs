// VERB TRANSFORMER: transformar verbos da forma de dicionário para outras formas.
import { h, button, shuffle, sample, jpHTML } from '../dom.js'
import { openModal } from '../ui.js'
import {
  conjugate,
  wrongOptions,
  explain,
  FORM_INFO,
  GROUP_LABEL
} from '../../lang/conjugation.js'
import { autoRuby } from '../../lang/ruby.js'
import { MVP_VERBS } from '../../core/content.js'
import { recordForm, recordError, markProduced, addScore } from '../../core/store.js'
import { speak } from '../../core/tts.js'
import { feedback, progressDots } from './common.js'

const DEFAULT_FORMS = ['masu', 'masen', 'mashita', 'te', 'teimasu']

export function makeFormQuestion(verb, form) {
  const c = conjugate(verb, form)
  const wrong = sample(wrongOptions(verb, form), 3)
  return {
    verb,
    form,
    correct: autoRuby(c.kanji, c.kana),
    options: shuffle([
      { text: autoRuby(c.kanji, c.kana), ok: true },
      ...wrong.map((w) => ({
        text: autoRuby(w.kanji, w.kana),
        ok: false,
        why: w.why,
        tag: w.tag
      }))
    ])
  }
}

/** Renderiza uma pergunta de forma verbal; chama onDone(acertouDePrimeira). */
export function renderFormQuestion(q, container, onDone) {
  const fb = h('div.feedback')
  let first = true
  let finished = false
  const opts = h(
    'div.options',
    {},
    q.options.map((o) =>
      h('button.option', {
        type: 'button',
        lang: 'ja',
        html: jpHTML(o.text),
        onclick: (e) => {
          if (finished) return
          const b = e.currentTarget
          if (o.ok) {
            finished = true
            b.classList.add('right')
            opts.querySelectorAll('button').forEach((x) => (x.disabled = true))
            recordForm(q.form, first)
            markProduced(q.verb.id)
            addScore(first ? 25 : 10)
            speak(o.text)
            feedback(fb, true, `<b>正解！</b> ${explain(q.verb, q.form)}`)
            onDone(first)
          } else {
            first = false
            b.classList.add('wrong')
            b.disabled = true
            recordForm(q.form, false)
            recordError(o.tag, q.verb.id)
            feedback(fb, false, o.why)
          }
        }
      })
    )
  )
  container.replaceChildren(
    h(
      'div.vt-card',
      {},
      h('div.vt-from', { lang: 'ja', html: jpHTML(autoRuby(q.verb.kanji, q.verb.kana)) }),
      h('div.vt-meaning', {}, q.verb.meaning),
      h('div.vt-arrow', {}, '⬇'),
      h(
        'div.vt-target',
        {},
        FORM_INFO[q.form].label,
        h('small', {}, FORM_INFO[q.form].pt)
      ),
      h('div.vt-group', {}, `Dica: ${GROUP_LABEL[q.verb.group]}`)
    ),
    opts,
    fb
  )
}

export function verbTransformer({
  count = 5,
  verbs = MVP_VERBS,
  forms = DEFAULT_FORMS,
  title = 'Verb Transformer',
  jp = '{動詞|どうし}{変身|へんしん}！'
} = {}) {
  const pool = sample(verbs, count)
  const qs = pool.map((v, i) => makeFormQuestion(v, forms[i % forms.length]))
  let i = 0
  let perfect = 0
  const dots = h('div')
  const area = h('div')
  const next = button('Próximo ▶', () => go(), 'btn-primary')
  const modal = openModal({
    title,
    jp,
    content: h('div.transformer', {}, dots, area, h('div.row', {}, next))
  })
  function go() {
    if (i >= qs.length)
      return modal.close({
        score: perfect,
        total: qs.length,
        perfect: perfect === qs.length
      })
    dots.replaceChildren(progressDots(qs.length, i))
    next.hidden = true
    renderFormQuestion(qs[i], area, (first) => {
      if (first) perfect++
      next.hidden = false
      next.textContent = i >= qs.length ? 'Concluir ✓' : 'Próximo ▶'
      next.focus()
    })
    i++
  }
  go()
  return modal.done.then(
    (r) =>
      r ??
      (i >= qs.length && !next.hidden
        ? { score: perfect, total: qs.length, perfect: perfect === qs.length }
        : null)
  )
}
