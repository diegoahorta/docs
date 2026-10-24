// Animações de interface com GSAP. Phaser cuida da movimentação/física;
// GSAP cuida de UI, recompensas, transições e sequências narrativas.
// Todas respeitam o modo de redução de movimento.
import { gsap } from 'gsap'
import { state } from '../systems/GameState.js'
import { audio } from '../systems/AudioSystem.js'

export const motionOK = () => !state.settings.reducedMotion
export const D = (d) => (motionOK() ? d : 0.001)

export function dialogIn(el) {
  if (!motionOK()) return gsap.set(el, { autoAlpha: 1 })
  return gsap.fromTo(
    el,
    { autoAlpha: 0, y: 40, xPercent: -50 },
    { autoAlpha: 1, y: 0, xPercent: -50, duration: 0.3, ease: 'back.out(1.6)' }
  )
}

export function dialogOut(el) {
  return new Promise((resolve) => {
    if (!motionOK()) return resolve()
    gsap.to(el, {
      autoAlpha: 0,
      y: 30,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: resolve
    })
  })
}

export function popIn(el, from = 0.85) {
  if (!motionOK()) return gsap.set(el, { autoAlpha: 1, scale: 1 })
  return gsap.fromTo(
    el,
    { autoAlpha: 0, scale: from },
    { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'back.out(1.8)' }
  )
}

export function popOut(el) {
  return new Promise((resolve) => {
    if (!motionOK()) return resolve()
    gsap.to(el, {
      autoAlpha: 0,
      scale: 0.92,
      duration: 0.16,
      ease: 'power2.in',
      onComplete: resolve
    })
  })
}

export function fadeIn(el, d = 0.4) {
  return gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: D(d) })
}

/** Feedback de acerto: salto alegre. */
export function correctPulse(el) {
  if (!el || !motionOK()) return
  gsap.fromTo(
    el,
    { scale: 1 },
    { scale: 1.08, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out' }
  )
}

/** Feedback de erro não punitivo: balanço suave, sem vermelho agressivo. */
export function softWobble(el) {
  if (!el || !motionOK()) return
  gsap.fromTo(
    el,
    { rotation: 0 },
    {
      keyframes: [{ rotation: -2 }, { rotation: 2 }, { rotation: 0 }],
      duration: 0.3,
      ease: 'sine.inOut'
    }
  )
}

/** Recompensa central (ícone + texto). */
export function reward(icon, text) {
  audio.sfx('pickup')
  const el = document.createElement('div')
  el.className = 'reward'
  el.innerHTML = `<div class="big">${icon}</div><div class="txt">${text}</div>`
  document.getElementById('ui').appendChild(el)
  const tl = gsap.timeline({ onComplete: () => el.remove() })
  if (!motionOK()) {
    tl.set(el, { autoAlpha: 1 }).to(el, { autoAlpha: 0, duration: 0.3, delay: 1.4 })
    return tl
  }
  tl.fromTo(
    el.querySelector('.big'),
    { scale: 0, rotation: -40 },
    { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }
  )
    .fromTo(
      el.querySelector('.txt'),
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.3 },
      '-=0.2'
    )
    .to(el.querySelector('.big'), {
      y: -6,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut'
    })
    .to(el, { autoAlpha: 0, y: -30, duration: 0.4, delay: 0.3 })
  return tl
}

/** Confete de celebração. */
export function confetti(count = 60) {
  if (!motionOK()) return
  const root = document.getElementById('ui')
  const colors = ['#ff7a3d', '#ffb020', '#7fd3ff', '#2fbf71', '#9b5cff', '#ff4dc4']
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div')
    c.className = 'confetti'
    c.style.background = colors[i % colors.length]
    c.style.left = `${50 + (Math.random() - 0.5) * 20}%`
    c.style.top = '40%'
    root.appendChild(c)
    gsap.to(c, {
      x: (Math.random() - 0.5) * window.innerWidth * 0.9,
      y: window.innerHeight * (0.3 + Math.random() * 0.6),
      rotation: Math.random() * 720,
      duration: 1.6 + Math.random(),
      ease: 'power2.out',
      onComplete: () => c.remove()
    })
    gsap.to(c, { autoAlpha: 0, duration: 0.5, delay: 1.5 + Math.random() * 0.8 })
  }
}

/** Transição entre fases (cortina com título). */
export function phaseTransition({ t1, t2, t3 }) {
  return new Promise((resolve) => {
    const el = document.createElement('div')
    el.className = 'transition-wipe'
    el.innerHTML = `<div><div class="t1">${t1}</div><div class="t2">${t2}</div><div class="t3">${t3 || ''}</div></div>`
    document.getElementById('ui').appendChild(el)
    const tl = gsap.timeline({
      onComplete: () => {
        el.remove()
        resolve()
      }
    })
    if (!motionOK()) {
      tl.set(el, { autoAlpha: 1 }).to(el, { autoAlpha: 0, duration: 0.3, delay: 1.6 })
      return
    }
    tl.fromTo(
      el,
      { clipPath: 'circle(0% at 50% 50%)' },
      { clipPath: 'circle(75% at 50% 50%)', duration: 0.6, ease: 'power2.inOut' }
    )
      .from(el.querySelectorAll('.t1,.t2,.t3'), {
        y: 20,
        autoAlpha: 0,
        stagger: 0.12,
        duration: 0.35
      })
      .to(el, {
        clipPath: 'circle(0% at 50% 50%)',
        duration: 0.6,
        ease: 'power2.inOut',
        delay: 1.3
      })
  })
}

/** Placa sendo restaurada (aplicado a um objeto Phaser). */
export function signRestore(obj, glow) {
  if (!motionOK()) return
  gsap.fromTo(obj, { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'back.out(2)' })
  if (glow)
    gsap.fromTo(glow, { alpha: 0.9 }, { alpha: 0, duration: 1.2, ease: 'power2.out' })
}

/** Brilho contínuo de coletáveis (objeto Phaser). */
export function shine(obj) {
  if (!motionOK()) return null
  return gsap.to(obj, {
    alpha: 0.55,
    y: obj.y - 3,
    duration: 0.8,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut'
  })
}

export { gsap }
