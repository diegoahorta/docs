// Gerenciador da interface DOM sobre o canvas do Phaser:
// camadas, modais (com pilha), notificações, cartões de verbo e efeitos com GSAP.
import { gsap } from 'gsap'
import { h, jpHTML, jpBlock } from './dom.js'
import { bus } from '../core/events.js'
import { setting } from '../core/store.js'
import { sfx } from '../core/audio.js'
import { speak, ttsAvailable } from '../core/tts.js'
import { conjugate } from '../lang/conjugation.js'
import { autoRuby } from '../lang/ruby.js'
import { TEIRU_NOTE } from '../core/content.js'

const layers = {}
const modals = []
let screenOpen = false
let dialogueOpen = false

export function initUI() {
  const root = document.getElementById('ui')
  for (const name of ['screen', 'hud', 'cards', 'dialogue', 'modal', 'toasts']) {
    layers[name] = h(`div.layer.layer-${name}`)
    root.append(layers[name])
  }
  applyMotion()
  bus.on('settings', ({ key }) => {
    if (key === 'reducedMotion') applyMotion()
    document.body.classList.toggle('no-furigana', !setting('furigana'))
  })
  document.body.classList.toggle('no-furigana', !setting('furigana'))
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    const top = modals[modals.length - 1]
    if (top) {
      if (top.closable) top.close(null)
      return
    }
    if (!dialogueOpen && !screenOpen) bus.emit('ui:pause')
  })
}

function applyMotion() {
  gsap.globalTimeline.timeScale(setting('reducedMotion') ? 6 : 1)
  document.body.classList.toggle('reduced-motion', !!setting('reducedMotion'))
}

export const layer = (name) => layers[name]
export const isBlocking = () => modals.length > 0 || dialogueOpen || screenOpen
export function setDialogueOpen(v) {
  dialogueOpen = v
  bus.emit('ui:blocking', isBlocking())
}

// ---------------- telas cheias (título, mapa) ----------------
export function showScreen(el) {
  clearScreen(true)
  screenOpen = true
  layers.screen.append(el)
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.35 })
  bus.emit('ui:blocking', true)
}
export function clearScreen(silent = false) {
  layers.screen.replaceChildren()
  screenOpen = false
  if (!silent) bus.emit('ui:blocking', isBlocking())
}

// ---------------- modais ----------------
/**
 * Abre um modal. Retorna { el, body, close(result), done: Promise }.
 */
export function openModal({
  title,
  jp,
  content,
  closable = true,
  cls = '',
  wide = false
} = {}) {
  let resolve
  const done = new Promise((r) => (resolve = r))
  const body = h('div.modal-body')
  if (content) body.append(content)
  const closeBtn = closable
    ? h('button.modal-x', { type: 'button', 'aria-label': 'Fechar' }, '✕')
    : null
  const panel = h(
    `div.modal${wide ? '.modal-wide' : ''}${cls ? '.' + cls : ''}`,
    { role: 'dialog', 'aria-modal': 'true' },
    h(
      'div.modal-head',
      {},
      h(
        'div.modal-titles',
        {},
        jp ? h('div.modal-jp', { lang: 'ja', html: jpHTML(jp) }) : null,
        title ? h('h2', {}, title) : null
      ),
      closeBtn
    ),
    body
  )
  const backdrop = h('div.backdrop', {}, panel)
  layers.modal.append(backdrop)
  const ctrl = {
    el: panel,
    body,
    closable,
    done,
    close(result) {
      const i = modals.indexOf(ctrl)
      if (i < 0) return
      modals.splice(i, 1)
      gsap.to(panel, { scale: 0.92, opacity: 0, duration: 0.18 })
      gsap.to(backdrop, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          backdrop.remove()
          bus.emit('ui:blocking', isBlocking())
        }
      })
      resolve(result)
    }
  }
  closeBtn?.addEventListener('click', () => {
    sfx('click')
    ctrl.close(null)
  })
  modals.push(ctrl)
  bus.emit('ui:blocking', true)
  gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2 })
  gsap.fromTo(
    panel,
    { scale: 0.85, y: 30, opacity: 0 },
    { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.6)' }
  )
  setTimeout(
    () => panel.querySelector('button:not(.modal-x)')?.focus({ preventScroll: true }),
    50
  )
  return ctrl
}

export function confirmBox(message, { ok = 'Sim', cancel = 'Cancelar' } = {}) {
  const m = openModal({
    title: 'Confirmar',
    content: h(
      'div.confirm',
      {},
      h('p', {}, message),
      h(
        'div.row',
        {},
        h(
          'button.btn.btn-ghost',
          { type: 'button', onclick: () => m.close(false) },
          cancel
        ),
        h('button.btn.btn-danger', { type: 'button', onclick: () => m.close(true) }, ok)
      )
    )
  })
  return m.done.then(Boolean)
}

// ---------------- notificações ----------------
export function toast(
  text,
  { icon = '✨', type = 'info', dur = 2.6, html = false } = {}
) {
  const el = h(
    `div.toast.toast-${type}`,
    {},
    h('span.toast-icon', {}, icon),
    h('span.toast-text', html ? { html: text } : {}, html ? null : text)
  )
  layers.toasts.append(el)
  gsap.fromTo(
    el,
    { x: 60, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' }
  )
  gsap.to(el, {
    x: 60,
    opacity: 0,
    delay: dur,
    duration: 0.3,
    onComplete: () => el.remove()
  })
}

// ---------------- cartão "Action to Learn" ----------------
let cardTween = null
export function showActionCard(verb, { big = false } = {}) {
  layers.cards.replaceChildren()
  cardTween?.kill()
  const polite = conjugate(verb, 'masu')
  const politeText = autoRuby(polite.kanji, polite.kana)
  const listen = ttsAvailable()
    ? h(
        'button.icon-btn',
        {
          type: 'button',
          title: 'Ouvir',
          'aria-label': 'Ouvir pronúncia',
          onclick: () => speak(`{${verb.kanji}|${verb.kana}}`, { force: true })
        },
        '🔊'
      )
    : null
  const head = h(
    'div.card-head',
    {},
    h('span.card-icon', {}, verb.icon ?? '⭐'),
    jpBlock(autoRuby(verb.kanji, verb.kana), verb.meaning, { size: big ? 'xl' : 'lg' }),
    listen
  )
  const el = h(
    `div.action-card${big ? '.big' : ''}`,
    {},
    big ? h('div.card-badge', {}, 'Novo verbo!') : null,
    head
  )
  if (big) {
    const parts = [
      h(
        'div.card-row',
        {},
        h('span.card-label', {}, 'Forma polida'),
        h('span.jp', { lang: 'ja', html: jpHTML(politeText + '。') })
      ),
      h(
        'div.card-ex',
        {},
        h('span.card-label', {}, 'Exemplo'),
        jpBlock(verb.example.text, verb.example.pt, { size: 'md' })
      ),
      verb.teiru ? h('div.card-note', {}, '💡 ', TEIRU_NOTE[verb.teiru]) : null,
      verb.note ? h('div.card-note', {}, '📝 ', verb.note) : null,
      h('div.card-foot', {}, 'Registrado no Diário de verbos 📔')
    ]
    el.append(...parts.filter(Boolean))
    const close = h('button.modal-x', { type: 'button', 'aria-label': 'Fechar' }, '✕')
    close.addEventListener('click', () => hideCard(el))
    el.prepend(close)
  }
  layers.cards.append(el)
  sfx('verb')
  if (big) speak(verb.example.text)
  else speak(`{${verb.kanji}|${verb.kana}}`)
  gsap.fromTo(
    el,
    { y: -40, opacity: 0, scale: 0.9 },
    { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }
  )
  cardTween = gsap.delayedCall(big ? 9 : 3.2, () => hideCard(el))
}

function hideCard(el) {
  gsap.to(el, { y: -30, opacity: 0, duration: 0.3, onComplete: () => el.remove() })
}

// ---------------- efeitos ----------------
/** Cristal voa de um ponto da tela até o contador do HUD. */
export function flyToHud(x, y, color = '#8fe3ff', target = '#hud-crystals') {
  const dest = document.querySelector(target)
  const gem = h('div.fly-gem', {
    style: { left: `${x}px`, top: `${y}px`, background: color }
  })
  document.body.append(gem)
  const r = dest?.getBoundingClientRect() ?? {
    left: innerWidth / 2,
    top: 20,
    width: 0,
    height: 0
  }
  gsap
    .timeline({ onComplete: () => gem.remove() })
    .to(gem, { scale: 1.6, duration: 0.25, ease: 'back.out(2)' })
    .to(gem, {
      left: r.left + r.width / 2,
      top: r.top + r.height / 2,
      scale: 0.6,
      rotation: 360,
      duration: 0.7,
      ease: 'power2.in'
    })
    .add(() => {
      if (dest)
        gsap.fromTo(
          dest,
          { scale: 1.35 },
          { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' }
        )
    })
}

export function confetti(n = 40) {
  if (setting('reducedMotion')) return
  const cols = ['#ff9fd0', '#ffd35c', '#8fe3ff', '#a8e6a3', '#c7a8ff']
  for (let i = 0; i < n; i++) {
    const p = h('div.confetti', {
      style: {
        left: `${50 + (Math.random() - 0.5) * 30}vw`,
        top: '40vh',
        background: cols[i % cols.length]
      }
    })
    document.body.append(p)
    gsap.to(p, {
      x: (Math.random() - 0.5) * innerWidth * 0.9,
      y: -innerHeight * (0.2 + Math.random() * 0.4),
      rotation: Math.random() * 720,
      duration: 0.8 + Math.random() * 0.4,
      ease: 'power2.out'
    })
    gsap.to(p, {
      y: innerHeight,
      opacity: 0,
      delay: 0.9,
      duration: 1.2,
      ease: 'power1.in',
      onComplete: () => p.remove()
    })
  }
}

/** Cortina de transição entre cenas. */
export function wipe(midFn) {
  const el = h('div.wipe')
  document.body.append(el)
  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: () => (el.remove(), resolve()) })
      .fromTo(
        el,
        { clipPath: 'circle(0% at 50% 50%)' },
        { clipPath: 'circle(75% at 50% 50%)', duration: 0.45, ease: 'power2.in' }
      )
      .add(() => midFn?.())
      .to(el, {
        clipPath: 'circle(0% at 50% 50%)',
        duration: 0.45,
        delay: 0.15,
        ease: 'power2.out'
      })
  })
}
