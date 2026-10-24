// Caixa de diálogo estilo RPG: retrato, nome, japonês com furigana,
// tradução opcional, digitação animada, voz opcional, escolhas com
// ramificações e feedback gramatical.
import { state } from '../systems/GameState.js'
import { audio } from '../systems/AudioSystem.js'
import { learning } from '../education/LearningTracker.js'
import { NPCS } from '../data/npcs.js'
import { ITEMS } from '../data/items.js'
import { VOCAB_BY_ID } from '../education/vocabulary.js'
import { ui } from './UIManager.js'
import { toHTML, rubyHTML, escapeHTML, typingUnits } from './ruby.js'
import { portrait } from './portraits.js'
import {
  dialogIn,
  dialogOut,
  reward,
  correctPulse,
  softWobble
} from '../animations/fx.js'

const SPEED = { slow: 55, normal: 28, fast: 12, instant: 0 }

export class DialogueBox {
  constructor() {
    this.el = ui.el('div', 'card dialogue')
    this.el.setAttribute('role', 'dialog')
    this.el.innerHTML = `
      <div class="portrait"><img alt=""></div>
      <div class="body">
        <div class="name"></div>
        <div class="jp-line" lang="ja"></div>
        <div class="tr"></div>
        <div class="choices"></div>
        <div class="fb hidden"></div>
        <div class="controls"><button class="btn ghost speak-btn" title="Ouvir em japonês">🔊</button><button class="btn ghost speak-btn skip" title="Pular diálogo">⏭</button><span class="next">▼</span></div>
      </div>`
    this.$ = (s) => this.el.querySelector(s)
  }

  /** Executa um roteiro. Resolve com { choices: [...] }. */
  play(script, { onItem } = {}) {
    return new Promise((resolve) => {
      ui.root.appendChild(this.el)
      ui.lockInput()
      dialogIn(this.el)
      this.script = script
      this.i = 0
      this.onItem = onItem
      this.results = []
      this.resolve = resolve
      this.waiting = null
      this.keyHandler = (e) => this.onKey(e)
      setTimeout(() => window.addEventListener('keydown', this.keyHandler, true), 120)
      this.el.addEventListener(
        'click',
        (this.clickHandler = (e) => {
          if (e.target.closest('button')) return
          this.advance()
        })
      )
      this.$('.speak-btn').onclick = () => this.line && audio.speak(this.line.jp, true)
      this.$('.skip').onclick = () => this.skipAll()
      this.run()
    })
  }

  onKey(e) {
    if (e.repeat) return
    if (['Enter', 'Space', 'KeyE'].includes(e.code)) {
      e.preventDefault()
      e.stopPropagation()
      this.advance()
    } else if (/^Digit[1-4]$/.test(e.code)) {
      const btn = this.$('.choices').children[Number(e.code.slice(5)) - 1]
      btn?.click()
    }
  }

  find(label) {
    return this.script.findIndex((l) => l.label === label)
  }

  run() {
    while (this.i < this.script.length) {
      const l = this.script[this.i]
      if (l.goto) {
        this.i = this.find(l.goto)
        continue
      }
      if (l.label && !l.s) {
        this.i++
        continue
      }
      return this.show(l)
    }
    this.close()
  }

  show(line) {
    this.line = line
    const npc = NPCS[line.s] || {}
    this.$('.portrait img').src = portrait(line.s)
    this.$('.portrait').classList.toggle('hidden', !portrait(line.s))
    this.$('.name').innerHTML =
      `${rubyHTML(npc.name || '')}<small>${escapeHTML(npc.namePt || '')}</small>`
    const jp = this.$('.jp-line')
    jp.innerHTML = toHTML(line.jp)
    this.$('.tr').textContent = line.pt || ''
    this.$('.choices').innerHTML = ''
    this.$('.fb').classList.add('hidden')
    this.$('.next').classList.add('hidden')
    if (line.teach) {
      const fresh = learning.see(line.teach)
      if (fresh.length)
        ui.toast(
          `📖 Novo no diário: ${fresh.map((id) => rubyHTML(VOCAB_BY_ID[id].word)).join('・')}`,
          'ok',
          3200
        )
    }
    if (line.item && !state.progress.inventory.includes(line.item)) {
      state.progress.inventory.push(line.item)
      const it = ITEMS[line.item]
      reward(it.icon, `${it.name} — ${it.pt}`)
      this.onItem?.(line.item)
    }
    audio.speak(line.jp)
    this.type(jp)
  }

  type(container) {
    const units = typingUnits(container)
    const delay = SPEED[state.settings.textSpeed] ?? 28
    clearInterval(this.typer)
    this.typing = true
    if (!delay || state.settings.reducedMotion) {
      units.forEach((u) => u.classList.add('v'))
      return this.doneTyping()
    }
    let k = 0
    this.typer = setInterval(() => {
      const u = units[k++]
      if (u) {
        u.classList.add('v')
        if (k % 2) audio.sfx('blip')
      } else this.doneTyping()
    }, delay)
    this.units = units
  }

  doneTyping() {
    clearInterval(this.typer)
    this.typing = false
    this.el.querySelectorAll('.tu').forEach((u) => u.classList.add('v'))
    if (this.line.choices) this.showChoices(this.line)
    else this.$('.next').classList.remove('hidden')
  }

  showChoices(line) {
    const box = this.$('.choices')
    box.innerHTML = ''
    this.waiting = 'choice'
    line.choices.forEach((c, idx) => {
      const b = ui.el('button', 'btn choice')
      b.innerHTML = `<span class="n">${idx + 1}.</span> ${c.jp ? rubyHTML(c.jp) : ''}${c.pt ? `<span class="${c.jp ? 'tr' : ''}">${escapeHTML(c.pt)}</span>` : ''}`
      b.addEventListener('click', () => this.choose(line, c, b))
      box.appendChild(b)
    })
    box.firstChild?.focus({ preventScroll: true })
  }

  choose(line, c, btn) {
    if (this.waiting !== 'choice') return
    learning.record({
      skill: line.skill,
      vocab: line.vocab,
      correct: !!c.ok,
      tag: line.skill
    })
    this.results.push({ line: this.i, ok: !!c.ok })
    const fb = this.$('.fb')
    fb.classList.remove('hidden')
    fb.classList.toggle('ok', !!c.ok)
    fb.innerHTML = `${c.ok ? '✨' : '💜'} ${rubyHTML(c.fb || (c.ok ? 'Isso!' : 'Tente outra opção.'))}`
    if (c.ok) {
      audio.sfx('success')
      btn.classList.add('right')
      correctPulse(btn)
      this.waiting = 'after-choice'
      this.pendingNext = c.next
      this.$('.choices')
        .querySelectorAll('button')
        .forEach((b) => (b.disabled = b !== btn))
      this.$('.next').classList.remove('hidden')
    } else {
      audio.sfx('soft-error')
      btn.classList.add('wrong')
      btn.disabled = true
      softWobble(btn)
      if (c.next) {
        this.waiting = 'after-choice'
        this.pendingNext = c.next
        this.$('.next').classList.remove('hidden')
      }
    }
  }

  advance() {
    if (this.typing) return this.doneTyping()
    if (this.waiting === 'choice') return
    if (this.waiting === 'after-choice') {
      this.waiting = null
      const next = this.pendingNext
      this.pendingNext = null
      this.i = next ? this.find(next) : this.i + 1
      return this.run()
    }
    if (this.line?.end) return this.close()
    this.i++
    this.run()
  }

  /** Pula falas sem escolhas, mas para nas perguntas (que contam progresso). */
  skipAll() {
    if (this.waiting === 'choice') return
    clearInterval(this.typer)
    this.typing = false
    this.waiting = null
    let j = this.i + 1
    while (j < this.script.length && !this.script[j].choices) {
      const l = this.script[j]
      if (l.teach) learning.see(l.teach)
      if (l.item && !state.progress.inventory.includes(l.item)) {
        state.progress.inventory.push(l.item)
        this.onItem?.(l.item)
      }
      j++
    }
    this.i = j
    this.run()
  }

  async close() {
    clearInterval(this.typer)
    window.removeEventListener('keydown', this.keyHandler, true)
    this.el.removeEventListener('click', this.clickHandler)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    await dialogOut(this.el)
    this.el.remove()
    ui.unlockInput()
    this.resolve?.({ choices: this.results })
  }
}
