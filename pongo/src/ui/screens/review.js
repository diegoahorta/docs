// Tela de revisão: avaliação (verbos, formas, erros recorrentes) + treino rápido.
import { h, button, shuffle, sample, jpHTML } from '../dom.js'
import { openModal } from '../ui.js'
import { VERB, VERBS } from '../../core/content.js'
import {
  get,
  pendingReviews,
  discoveredVerbs,
  markRecognized,
  recordError,
  addScore,
  verbStage
} from '../../core/store.js'
import { FORM_INFO } from '../../lang/conjugation.js'
import { feedback, progressDots, verbLabel } from '../activities/common.js'
import { makeFormQuestion, renderFormQuestion } from '../activities/verbTransformer.js'

export const ERROR_LABEL = {
  'particle-ni-de': 'Confusão entre に e で',
  'particle-wo-de': 'Confusão entre を e で',
  'masu-vs-teimasu': 'ます × ています',
  'verb-last': 'Verbo fora do final da frase',
  order: 'Ordem da frase',
  missing: 'Frase incompleta',
  'as-ichidan': 'Tratar Grupo I como Grupo II',
  'as-godan': 'Tratar Grupo II como Grupo I',
  'dict-plus': 'Terminação colada na forma de dicionário',
  'wrong-te': 'Regras da forma て',
  'stem-te': 'Radical + て no Grupo I',
  potential: 'Confusão com o potencial',
  'wrong-row': 'Linha errada na forma ない',
  tense: 'Tempo ou polaridade',
  irregular: 'Verbos irregulares',
  'action-match': 'Reconhecer ações',
  'wrong-verb': 'Escolha do verbo',
  polarity: 'Afirmativo × negativo',
  runner: 'Verb Runner',
  'boss-sequence': 'Sequência de ações',
  meaning: 'Significado dos verbos'
}

export function openReview() {
  const s = get()
  const pending = pendingReviews()
  const disc = discoveredVerbs()
  const stage = (n) => VERBS.filter((v) => verbStage(v.id) >= n).length
  const errors = Object.entries(s.errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const forms = Object.entries(s.forms)
  const content = h(
    'div.review',
    {},
    h(
      'div.stats',
      {},
      stat('👀', stage(1), 'verbos vistos (input)'),
      stat('🧠', stage(2), 'reconhecidos (intake)'),
      stat('🗣️', stage(3), 'usados (output)'),
      stat('🧩', s.sentences, 'frases produzidas')
    ),
    h('h3', {}, 'Conjugações'),
    forms.length
      ? h(
          'div.form-bars',
          {},
          forms.map(([f, r]) => {
            const pct = Math.round((r.correct / Math.max(1, r.correct + r.wrong)) * 100)
            return h(
              'div.form-bar',
              {},
              h('span', {}, FORM_INFO[f]?.label ?? f),
              h('div.bar', {}, h('i', { style: { width: `${pct}%` } })),
              h('b', {}, `${pct}%`)
            )
          })
        )
      : h(
          'p.empty',
          {},
          'Use o Verb Transformer com a professora Kumi para treinar formas.'
        ),
    h('h3', {}, 'Erros recorrentes'),
    errors.length
      ? h(
          'ul.err-list',
          {},
          errors.map(([tag, n]) => h('li', {}, `${ERROR_LABEL[tag] ?? tag} — ${n}×`))
        )
      : h('p.empty', {}, 'Nenhum erro registrado ainda. 🎉'),
    h('h3', {}, `Revisões pendentes (${pending.length})`),
    pending.length
      ? h(
          'div.pending',
          {},
          pending.map((id) => h('span.pill', { lang: 'ja', html: verbLabel(VERB[id]) }))
        )
      : h('p.empty', {}, disc.length ? 'Tudo em dia!' : 'Jogue para descobrir verbos.'),
    h(
      'div.row',
      {},
      disc.length
        ? button(
            '🔁 Treinar agora',
            () => (m.close(), quickQuiz(pending.length ? pending : disc)),
            'btn-primary'
          )
        : null
    )
  )
  const m = openModal({ title: 'Revisão', jp: '{復習|ふくしゅう}', content, wide: true })
}

function stat(icon, n, label) {
  return h(
    'div.stat',
    {},
    h('div.stat-n', {}, icon, ' ', String(n)),
    h('small', {}, label)
  )
}

/** Treino rápido misturando reconhecimento (significado) e produção (formas). */
export function quickQuiz(ids) {
  const verbs = sample(ids.map((id) => VERB[id]).filter(Boolean), 6)
  let i = 0
  let right = 0
  const dots = h('div')
  const area = h('div')
  const next = button('Próximo ▶', () => go(), 'btn-primary')
  const m = openModal({
    title: 'Treino rápido',
    jp: '{練習|れんしゅう}',
    content: h('div', {}, dots, area, h('div.row', {}, next))
  })
  function go() {
    if (i >= verbs.length) {
      area.replaceChildren(
        h('p.big', {}, `Você acertou ${right} de ${verbs.length} de primeira!`)
      )
      next.textContent = 'Fechar'
      next.onclick = () => m.close()
      dots.replaceChildren(progressDots(verbs.length, verbs.length))
      i++
      return
    }
    const v = verbs[i]
    dots.replaceChildren(progressDots(verbs.length, i))
    next.hidden = true
    const done = (first) => {
      if (first) right++
      next.hidden = false
    }
    if (i % 2 === 0) meaningQuestion(v, area, done)
    else
      renderFormQuestion(
        makeFormQuestion(
          v,
          sample(['masu', 'te', 'nai', 'mashita', 'teimasu', 'tai'], 1)[0]
        ),
        area,
        done
      )
    i++
  }
  go()
}

function meaningQuestion(v, area, done) {
  const others = sample(
    VERBS.filter((x) => x.id !== v.id),
    3
  )
  const fb = h('div.feedback')
  let first = true
  const opts = h(
    'div.options',
    {},
    shuffle([v, ...others]).map((o) =>
      h('button.option', {
        type: 'button',
        lang: 'ja',
        html: verbLabel(o),
        onclick: (e) => {
          if (o.id === v.id) {
            e.currentTarget.classList.add('right')
            opts.querySelectorAll('button').forEach((b) => (b.disabled = true))
            markRecognized(v.id)
            addScore(first ? 15 : 5)
            feedback(
              fb,
              true,
              `<b>正解！</b> <span lang="ja">${jpHTML(v.example.text)}</span><br><small>${v.example.pt}</small>`
            )
            done(first)
          } else {
            first = false
            e.currentTarget.classList.add('wrong')
            e.currentTarget.disabled = true
            recordError('meaning', v.id)
            feedback(
              fb,
              false,
              `<span lang="ja">${verbLabel(o)}</span> = ${o.meaning}. Procure o verbo que significa “${v.meaning}”.`
            )
          }
        }
      })
    )
  )
  area.replaceChildren(
    h('div.vt-card', {}, h('div.vt-target', {}, `Qual verbo significa “${v.meaning}”?`)),
    opts,
    fb
  )
}
