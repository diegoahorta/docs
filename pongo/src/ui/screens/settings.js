import { h, button } from '../dom.js'
import { openModal, confirmBox, toast } from '../ui.js'
import { get, setSetting, resetProgress } from '../../core/store.js'
import { ttsAvailable } from '../../core/tts.js'
import { sfx, unlockAudio } from '../../core/audio.js'

const OPTIONS = [
  ['furigana', 'Furigana', 'Leitura em hiragana sobre os kanji'],
  ['translation', 'Tradução', 'Mostrar o português abaixo do japonês'],
  ['romaji', 'Romaji', 'Mostrar a pronúncia em letras latinas'],
  ['sfx', 'Efeitos sonoros', ''],
  ['music', 'Música', ''],
  ['voice', 'Voz japonesa (TTS)', 'Usa a voz do sistema, se disponível'],
  [
    'reducedMotion',
    'Reduzir animações intensas',
    'Menos tremores, partículas e transições'
  ]
]

export function openSettings() {
  const s = get().settings
  const rows = OPTIONS.map(([key, label, desc]) => {
    const input = h('input', { type: 'checkbox', role: 'switch', checked: !!s[key] })
    input.addEventListener('change', () => {
      unlockAudio()
      setSetting(key, input.checked)
      sfx('click')
    })
    return h(
      'label.setting',
      {},
      h(
        'span',
        {},
        h('b', {}, label),
        desc ? h('small', {}, desc) : null,
        key === 'voice' && !ttsAvailable()
          ? h('small.warn', {}, 'Nenhuma voz japonesa encontrada neste dispositivo.')
          : null
      ),
      input,
      h('span.switch')
    )
  })
  const fs = button(
    '⛶ Tela cheia',
    () => {
      if (document.fullscreenElement) document.exitFullscreen?.()
      else
        document.documentElement
          .requestFullscreen?.()
          .catch(() => toast('Tela cheia indisponível', { icon: '⚠️' }))
    },
    'btn-secondary'
  )
  const reset = button(
    '🗑️ Apagar progresso',
    async () => {
      if (
        await confirmBox(
          'Apagar todo o progresso (verbos, missões, conquistas)? As configurações serão mantidas.',
          { ok: 'Apagar' }
        )
      ) {
        resetProgress()
        toast('Progresso apagado.', { icon: '🗑️' })
      }
    },
    'btn-danger'
  )
  openModal({
    title: 'Configurações',
    jp: '{設定|せってい}',
    content: h('div.settings', {}, rows, h('div.row', {}, fs, reset))
  })
}
