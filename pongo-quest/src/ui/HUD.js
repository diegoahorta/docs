// HUD: fase, etapa INPUT/INTAKE/OUTPUT, objetivo, bússola, minimapa e
// barra de ferramentas (inventário, diário, caderno, progresso…).
import { bus } from '../systems/EventBus.js'
import { state } from '../systems/GameState.js'
import { input } from '../systems/InputSystem.js'
import { toHTML, escapeHTML } from './ruby.js'
import { portrait } from './portraits.js'
import { Compass } from './Compass.js'
import { Minimap } from './Minimap.js'
import { ui } from './UIManager.js'
import { panels } from './Panels.js'
import { gsap, motionOK } from '../animations/fx.js'

const STAGES = [
  ['input', 'INPUT'],
  ['intake', 'INTAKE'],
  ['output', 'OUTPUT']
]

class HUD {
  init() {
    this.el = ui.el('div', 'hud hidden')
    this.el.innerHTML = `
      <div class="hud-left">
        <div class="phase-chip"><span class="ptitle"></span><span class="stage">${STAGES.map(([k, l]) => `<span data-s="${k}">${l}</span>`).join('')}</span></div>
        <div class="card objective" aria-live="polite"></div>
      </div>
      <div class="hud-right">
        <div class="toolbar"></div>
        <div class="nav-widgets"><div class="mm-slot"></div><div class="cp-slot"></div></div>
      </div>`
    ui.root.appendChild(this.el)
    this.obj = this.el.querySelector('.objective')
    const chip = this.el.querySelector('.phase-chip')
    chip.title = 'Mostrar/ocultar objetivo'
    chip.style.cursor = 'pointer'
    chip.addEventListener('click', () => this.obj.classList.toggle('collapsed'))
    this.compass = new Compass(this.el.querySelector('.cp-slot'))
    this.minimap = new Minimap(this.el.querySelector('.mm-slot'))
    this.buildToolbar()
    this.syncToggles()

    bus.on('objective', (o) => this.setObjective(o))
    bus.on('player:facing', (d) => this.compass.setFacing(d))
    bus.on('player:pos', ({ x, y, facing }) => this.minimap.setPlayer(x, y, facing))
    bus.on('minimap:target', (t) => this.minimap.setTarget(t))
    bus.on('hud:scene', ({ kind, title }) => this.minimap.setMode(kind, title))
    bus.on('compass:refresh', () => this.compass.render())
    bus.on('settings:changed', () => this.syncToggles())
    bus.on('learning:updated', () => this.updateBadges())
    setInterval(() => !this.el.classList.contains('hidden') && this.minimap.render(), 120)

    input.hotkey('KeyM', () => this.visible && ui.toggleSetting('minimap'))
    input.hotkey('KeyF', () => this.visible && ui.toggleSetting('furigana'))
    input.hotkey('KeyT', () => this.visible && ui.toggleSetting('translation'))
    input.hotkey('KeyX', () => this.visible && ui.toggleSetting('analysis'))
    input.hotkey('KeyI', () => this.canOpen() && panels.open('inventory'))
    input.hotkey('KeyJ', () => this.canOpen() && panels.open('diary'))
    input.hotkey('KeyK', () => this.canOpen() && panels.open('grammar'))
    input.hotkey('KeyP', () => this.canOpen() && panels.open('progress'))
    input.hotkey('Escape', () => {
      if (ui.modalOpen) {
        if (!ui.topModal.locked) ui.closeModal()
      } else if (this.canOpen()) panels.open('settings')
    })
  }

  get visible() {
    return !this.el.classList.contains('hidden')
  }

  canOpen() {
    return this.visible && !ui.busy
  }

  show(on = true) {
    this.el.classList.toggle('hidden', !on)
  }

  buildToolbar() {
    const tools = [
      ['inventory', '🎒', 'Inventário (I)', () => panels.open('inventory')],
      ['diary', '📖', 'Diário de vocabulário (J)', () => panels.open('diary')],
      ['grammar', '📝', 'Caderno gramatical (K)', () => panels.open('grammar')],
      ['progress', '📊', 'Painel de progresso (P)', () => panels.open('progress')],
      ['furigana', 'ふ', 'Furigana on/off (F)', () => ui.toggleSetting('furigana')],
      ['translation', 'PT', 'Tradução on/off (T)', () => ui.toggleSetting('translation')],
      [
        'analysis',
        '🎨',
        'Modo de análise gramatical (X)',
        () => ui.toggleSetting('analysis')
      ],
      ['minimap', '🗺️', 'Minimapa (M)', () => ui.toggleSetting('minimap')],
      ['settings', '⚙️', 'Configurações (Esc)', () => panels.open('settings')]
    ]
    const bar = this.el.querySelector('.toolbar')
    this.tools = {}
    tools.forEach(([id, icon, title, fn]) => {
      const b = ui.el('button', 'tool', icon)
      b.title = title
      b.setAttribute('aria-label', title)
      b.addEventListener('click', (e) => {
        e.currentTarget.blur()
        if (
          ui.busy &&
          ['inventory', 'diary', 'grammar', 'progress', 'settings'].includes(id)
        )
          return
        fn()
      })
      bar.appendChild(b)
      this.tools[id] = b
    })
    this.updateBadges()
  }

  syncToggles() {
    const s = state.settings
    ;['furigana', 'translation', 'analysis', 'minimap'].forEach((k) =>
      this.tools?.[k]?.classList.toggle('on', !!s[k])
    )
    this.minimap?.el.classList.toggle('hidden', !s.minimap)
  }

  updateBadges() {
    const n = state.learning.review.length
    const b = this.tools?.progress
    if (!b) return
    b.querySelector('.badge')?.remove()
    if (n) b.insertAdjacentHTML('beforeend', `<span class="badge">${n}</span>`)
  }

  setStage(stage) {
    this.el
      .querySelectorAll('.stage span')
      .forEach((s) => s.classList.toggle('on', s.dataset.s === stage))
  }

  setPhaseTitle(text) {
    this.el.querySelector('.ptitle').textContent = text
  }

  /** o = { stage, speaker, jp, jpPt, hideTr, task, list:[{jp,pt,done}], hint } */
  setObjective(o) {
    if (!o) {
      this.obj.classList.add('hidden')
      return
    }
    this.obj.classList.remove('hidden', 'collapsed')
    if (o.stage) this.setStage(o.stage)
    const sp = o.speaker
      ? `<div class="speaker">${portrait(o.speaker) ? `<img alt="" src="${portrait(o.speaker)}">` : ''}${escapeHTML(o.speakerName || '')}</div>`
      : ''
    const jp = o.jp ? `<div class="jp-line">${toHTML(o.jp)}</div>` : ''
    const tr = o.jpPt && !o.hideTr ? `<div class="tr">${escapeHTML(o.jpPt)}</div>` : ''
    const pt = o.task ? `<div>🎯 ${escapeHTML(o.task)}</div>` : ''
    const list = o.list
      ? `<ul>${o.list
          .map(
            (i) =>
              `<li class="${i.done ? 'done' : ''}">${i.done ? '✅' : '⬜'} <span><span class="jp">${toHTML(i.jp || '')}</span> <span class="tr">${escapeHTML(i.pt || '')}</span></span></li>`
          )
          .join('')}</ul>`
      : ''
    const hint = o.hint ? `<div class="hint">${escapeHTML(o.hint)}</div>` : ''
    this.obj.innerHTML =
      sp +
      jp +
      tr +
      pt +
      list +
      hint +
      '<div class="legend"><span class="l-ref">referência</span><span class="l-no">の</span><span class="l-pos">posição</span><span class="l-part">に/で/へ</span><span class="l-pred">predicado</span></div>'
    if (motionOK())
      gsap.fromTo(
        this.obj,
        { x: -12, autoAlpha: 0.3 },
        { x: 0, autoAlpha: 1, duration: 0.3 }
      )
  }
}

export const hud = new HUD()
