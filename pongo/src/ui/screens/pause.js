import { h, button } from '../dom.js'
import { openModal } from '../ui.js'
import { bus } from '../../core/events.js'

export function openPause() {
  const go = (evt) => () => {
    m.close()
    bus.emit(evt)
  }
  const m = openModal({
    title: 'Pausa',
    jp: '{一時停止|いちじていし}',
    content: h(
      'div.pause-menu',
      {},
      button('▶ Continuar', () => m.close(), 'btn-primary btn-big'),
      button('📔 Diário de verbos', go('ui:journal'), 'btn-secondary'),
      button('📘 Caderno gramatical', go('ui:notebook'), 'btn-secondary'),
      button('🔁 Revisão', go('ui:review'), 'btn-secondary'),
      button('🏆 Conquistas', go('ui:achievements'), 'btn-secondary'),
      button('⚙️ Configurações', go('ui:settings'), 'btn-secondary'),
      button('🗺️ Mapa de fases', go('nav:map'), 'btn-ghost'),
      button('🏠 Tela inicial', go('nav:title'), 'btn-ghost')
    )
  })
  return m
}
