// Menu “どこを見ますか？” para examinar posições de um objeto.
import { INSPECTABLES, POSITIONS } from '../data/cats.js'
import { ui } from './UIManager.js'
import { rubyHTML, escapeHTML } from './ruby.js'

export function chooseInspect(objKey) {
  const obj = INSPECTABLES[objKey]
  return new Promise((resolve) => {
    const p = ui.el('div', 'card panel')
    p.style.width = 'min(420px, 94vw)'
    p.innerHTML = `<header><h2>${rubyHTML('どこを {見|み}ますか？')} <small class="tr" style="font-size:12px">Onde você quer olhar?</small></h2><button class="btn close" aria-label="Fechar">✕</button></header>
      <div class="content"><div class="options" style="flex-direction:column">${obj.positions
        .map(
          (pos, i) =>
            `<button class="btn" data-pos="${pos}">${i + 1}. ${rubyHTML(`${obj.name}の${POSITIONS[pos].ruby}`)} <span class="tr" style="font-size:12px">— ${escapeHTML(POSITIONS[pos].pt)} ${obj.pt === 'carro' ? 'do' : 'da'} ${escapeHTML(obj.pt)}</span></button>`
        )
        .join('')}</div></div>`
    let chosen = null
    const modal = ui.openModal(p, { onClose: () => resolve(chosen) })
    p.querySelector('.close').addEventListener('click', () => ui.closeModal(modal))
    p.querySelectorAll('[data-pos]').forEach((b) =>
      b.addEventListener('click', () => {
        chosen = b.dataset.pos
        ui.closeModal(modal)
      })
    )
    const onKey = (e) => {
      const n = /^Digit(\d)$/.exec(e.code)?.[1]
      const btn = n && p.querySelectorAll('[data-pos]')[Number(n) - 1]
      if (btn) {
        window.removeEventListener('keydown', onKey)
        btn.click()
      }
    }
    window.addEventListener('keydown', onKey)
    modal.onClose = () => {
      window.removeEventListener('keydown', onKey)
      resolve(chosen)
    }
  })
}
