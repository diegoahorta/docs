// Bússola interativa: pontos cardeais fixos (北・東・南・西) e anel
// interno relativo (前・右・後ろ・左) que gira com o personagem.
import { ABS, REL, angleOf } from '../systems/DirectionSystem.js'
import { state } from '../systems/GameState.js'
import { audio } from '../systems/AudioSystem.js'
import { gsap, motionOK } from '../animations/fx.js'

const POS = { N: [50, 15], E: [86, 55], S: [50, 93], W: [14, 55] }
const NS = 'http://www.w3.org/2000/svg'

export class Compass {
  constructor(parent) {
    this.el = document.createElement('div')
    this.el.className = 'compass'
    this.el.setAttribute('role', 'group')
    this.el.setAttribute('aria-label', 'Bússola')
    this.el.innerHTML = `
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#fff8e7"/>
        <circle cx="50" cy="50" r="36" fill="none" stroke="#e0d3b6" stroke-width="1.5"/>
        <g class="rel"></g>
        <g class="needle"><path d="M50 22 L56 52 L50 47 L44 52 Z" fill="#ff7a3d" stroke="#1b1530" stroke-width="1.5"/><circle cx="50" cy="50" r="4" fill="#1b1530"/></g>
        <g class="cards"></g>
      </svg>
      <div class="compass-tip"></div>`
    parent.appendChild(this.el)
    this.svg = this.el.querySelector('svg')
    this.needle = this.el.querySelector('.needle')
    this.relG = this.el.querySelector('.rel')
    this.tip = this.el.querySelector('.compass-tip')
    this.proxy = { a: 0 }
    this.facing = 'S'

    const cards = this.el.querySelector('.cards')
    this.cardEls = {}
    Object.entries(POS).forEach(([d, [x, y]]) => {
      const g = document.createElementNS(NS, 'g')
      g.setAttribute('class', 'cardinal')
      g.setAttribute('tabindex', '0')
      g.innerHTML = `<circle cx="${x}" cy="${y - 5}" r="10" fill="transparent"/><text x="${x}" y="${y}" font-size="15" text-anchor="middle" fill="#1b1530">${ABS[d].kanji}</text>`
      g.addEventListener('click', () => this.explain(d))
      g.addEventListener('keydown', (e) => e.key === 'Enter' && this.explain(d))
      cards.appendChild(g)
      this.cardEls[d] = g
    })
    this.relLabels = ['front', 'right', 'back', 'left'].map((r) => {
      const t = document.createElementNS(NS, 'text')
      t.setAttribute('font-size', '9')
      t.setAttribute('text-anchor', 'middle')
      t.setAttribute('fill', '#3a7bd5')
      t.textContent = REL[r].kanji
      this.relG.appendChild(t)
      return { r, t }
    })
    this.render()
  }

  explain(d) {
    if (!this.known(d)) {
      this.showTip('？ Ainda falta este pedaço da bússola')
      return
    }
    const rel = this.relativeName(d)
    this.showTip(
      `${ABS[d].kanji}（${ABS[d].kana}）= ${ABS[d].pt}${rel ? ` · para Pongo: ${rel}` : ''}`
    )
    audio.speak(ABS[d].ruby, true)
  }

  relativeName(d) {
    if (!this.relativeOn()) return ''
    const order = ['N', 'E', 'S', 'W']
    const diff = (order.indexOf(d) - order.indexOf(this.facing) + 4) % 4
    const r = REL[['front', 'right', 'back', 'left'][diff]]
    return `${r.kanji} (${r.pt})`
  }

  showTip(text) {
    this.tip.textContent = text
    gsap.killTweensOf(this.tip)
    gsap.fromTo(this.tip, { autoAlpha: 1 }, { autoAlpha: 0, delay: 2.4, duration: 0.4 })
  }

  known(d) {
    const p = state.progress
    return (
      p.phase > 1 ||
      p.completed.includes(1) ||
      p.collected.includes(`mk_${d.toLowerCase()}`)
    )
  }

  relativeOn() {
    return state.progress.inventory.includes('compass')
  }

  setFacing(dir) {
    if (!dir || dir === this.facing) return
    this.facing = dir
    let target = angleOf(dir)
    const cur = this.proxy.a
    while (target - cur > 180) target -= 360
    while (target - cur < -180) target += 360
    gsap.killTweensOf(this.proxy)
    if (!motionOK()) {
      this.proxy.a = target
      this.render()
    } else
      gsap.to(this.proxy, {
        a: target,
        duration: 0.25,
        ease: 'power2.out',
        onUpdate: () => this.render()
      })
  }

  render() {
    const a = this.proxy.a
    this.needle.setAttribute('transform', `rotate(${a} 50 50)`)
    Object.entries(this.cardEls).forEach(([d, g]) => {
      const known = this.known(d)
      g.querySelector('text').textContent = known ? ABS[d].kanji : '？'
      g.querySelector('text').setAttribute('fill', known ? '#1b1530' : '#b9b2d6')
    })
    const showRel = this.relativeOn()
    this.relG.style.display = showRel ? '' : 'none'
    this.relLabels.forEach(({ t }, i) => {
      const ang = ((a + i * 90 - 90) * Math.PI) / 180
      t.setAttribute('x', (50 + Math.cos(ang) * 27).toFixed(1))
      t.setAttribute('y', (53 + Math.sin(ang) * 27).toFixed(1))
    })
  }
}
