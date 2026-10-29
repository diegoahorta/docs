// Diário de verbos: o que o aluno já viu (INPUT), reconheceu (INTAKE) e produziu (OUTPUT).
import { h, jpHTML, jpBlock } from '../dom.js'
import { openModal } from '../ui.js'
import { VERBS, TEIRU_NOTE } from '../../core/content.js'
import { verbStage, get, setting } from '../../core/store.js'
import { conjugate, FORMS, FORM_INFO, GROUP_LABEL } from '../../lang/conjugation.js'
import { autoRuby } from '../../lang/ruby.js'
import { romaji } from '../../lang/romaji.js'
import { speak, ttsAvailable } from '../../core/tts.js'

const STAGES = [
  'Ainda não visto',
  'Visto (input)',
  'Reconhecido (intake)',
  'Produzido (output)'
]

function dots(stage) {
  return h(
    'span.stage-dots',
    { title: STAGES[stage] },
    [1, 2, 3].map((i) => h(`i${i <= stage ? '.on' : ''}`))
  )
}

export function openJournal() {
  const seen = VERBS.filter((v) => verbStage(v.id) > 0).length
  const grid = h('div.verb-grid')
  const modules = [
    [1, 'Módulo 1 · Movimento'],
    [2, 'Módulo 2 · Ações cotidianas'],
    [3, 'Módulo 3 · Interação'],
    [0, 'Ações do Pongo (bônus)']
  ]
  for (const [mod, label] of modules) {
    grid.append(h('h3.grid-title', {}, label))
    for (const v of VERBS.filter((x) => x.module === mod)) {
      const st = verbStage(v.id)
      grid.append(
        st
          ? h(
              'button.verb-tile',
              { type: 'button', onclick: () => openVerb(v) },
              h('span.vt-icon', {}, v.icon),
              h('span.vt-jp', { lang: 'ja', html: jpHTML(autoRuby(v.kanji, v.kana)) }),
              setting('translation') ? h('span.vt-pt', {}, v.meaning) : null,
              dots(st)
            )
          : h(
              'div.verb-tile.locked',
              { title: 'Realize a ação no jogo para descobrir' },
              h('span.vt-icon', {}, '❔'),
              h('span.vt-jp', {}, '？？'),
              dots(0)
            )
      )
    }
  }
  const legend = h(
    'div.legend',
    {},
    dots(1),
    ' visto · ',
    dots(2),
    ' reconhecido · ',
    dots(3),
    ' produzido'
  )
  openModal({
    title: `Diário de verbos — ${seen}/${VERBS.length}`,
    jp: '{動詞|どうし}{日記|にっき}',
    content: h('div', {}, legend, grid),
    wide: true
  })
}

export function openVerb(v) {
  const rec = get().verbs[v.id] ?? {}
  const rows = FORMS.map((f) => {
    const c = conjugate(v, f)
    const t = autoRuby(c.kanji, c.kana)
    return h(
      'tr',
      {},
      h('th', {}, FORM_INFO[f].label, h('small', {}, FORM_INFO[f].pt)),
      h('td', { lang: 'ja', html: jpHTML(t) }),
      setting('romaji') ? h('td.romaji', {}, romaji(t)) : null
    )
  })
  const content = h(
    'div.verb-detail',
    {},
    h(
      'div.vd-head',
      {},
      h('span.vd-icon', {}, v.icon),
      jpBlock(autoRuby(v.kanji, v.kana), v.meaning, { size: 'xl' }),
      ttsAvailable()
        ? h(
            'button.icon-btn',
            {
              type: 'button',
              'aria-label': 'Ouvir',
              onclick: () => speak(`{${v.kanji}|${v.kana}}`, { force: true })
            },
            '🔊'
          )
        : null
    ),
    h(
      'div.vd-tags',
      {},
      h('span.tag', {}, GROUP_LABEL[v.group]),
      v.exception ? h('span.tag.tag-warn', {}, 'Exceção!') : null,
      h('span.tag', {}, STAGES[verbStage(v.id)])
    ),
    h('div.vd-ex', {}, jpBlock(v.example.text, v.example.pt)),
    v.teiru ? h('p.card-note', {}, '💡 ', TEIRU_NOTE[v.teiru]) : null,
    v.note ? h('p.card-note', {}, '📝 ', v.note) : null,
    h('table.conj', {}, h('tbody', {}, rows)),
    h(
      'p.vd-stats',
      {},
      `Visto ${rec.seen ?? 0}× · reconhecido ${rec.recognized ?? 0}× · produzido ${rec.produced ?? 0}× · erros ${rec.errors ?? 0}`
    )
  )
  openModal({ title: v.meaning, content })
}
