// GRAMMAR BRIDGE / NPC CHALLENGE: montar frases com blocos coloridos (arrastar ou tocar).
import { gsap } from 'gsap'
import { h, jpHTML, jpBlock, shuffle, button } from '../dom.js'
import { openModal } from '../ui.js'
import { checkSentence, joinChunks, ROLE_INFO } from '../../lang/sentenceCheck.js'
import { romaji } from '../../lang/romaji.js'
import {
  setting,
  addSentence,
  markProduced,
  recordError,
  addScore
} from '../../core/store.js'
import { speak } from '../../core/tts.js'
import { sfx } from '../../core/audio.js'
import { frameURL } from '../../art/register.js'
import { NPCS } from '../../core/content.js'
import { feedback, ROLE_LEGEND } from './common.js'

/**
 * @returns Promise<{ firstTry:boolean, attempts:number } | null>
 */
export function sentenceBuilder(
  sentence,
  { title = 'Monte a frase', jp = '{文|ぶん}を{作|つく}ろう', npc = null } = {}
) {
  const all = [...sentence.chunks, ...(sentence.distractors ?? [])]
  const chips = new Map()
  let pool = shuffle(all.map((c) => c.id))
  let line = []
  let attempts = 0
  let solved = false

  for (const c of all) {
    const el = h(
      `div.chip.role-${c.role}`,
      {
        dataset: { id: c.id },
        tabindex: '0',
        role: 'button',
        'aria-label': `${ROLE_INFO[c.role]?.label ?? ''}`
      },
      h('span.chip-jp', { lang: 'ja', html: jpHTML(c.text) }),
      setting('romaji') ? h('span.chip-romaji', {}, romaji(c.text)) : null
    )
    attachDrag(el, c.id)
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        toggle(c.id)
      }
    })
    chips.set(c.id, el)
  }

  const lineEl = h('div.sb-line', { 'aria-label': 'Linha da frase' })
  const poolEl = h('div.sb-pool', { 'aria-label': 'Blocos disponíveis' })
  const fb = h('div.feedback')
  const checkBtn = button('✔ Verificar', () => check(), 'btn-primary')
  const header = h('div.sb-header')
  if (sentence.question && npc) {
    header.append(
      h(
        'div.npc-ask',
        {},
        h('img.npc-face', { src: frameURL(npc, 'talk_1'), alt: '' }),
        h(
          'div.bubble',
          {},
          h('div.bubble-name', { lang: 'ja', html: jpHTML(NPCS[npc]?.name ?? '') }),
          jpBlock(sentence.question, sentence.questionPt)
        )
      )
    )
  }
  header.append(h('p.sb-prompt', {}, '🎯 ', sentence.prompt))

  const content = h(
    'div.sentence-builder',
    {},
    header,
    h('div.sb-label', {}, 'Frase'),
    lineEl,
    h('div.sb-label', {}, 'Blocos — arraste ou toque'),
    poolEl,
    ROLE_LEGEND(),
    fb,
    h(
      'div.row',
      {},
      button(
        '↺ Limpar',
        () => {
          pool = [...pool, ...line]
          line = []
          render()
        },
        'btn-ghost'
      ),
      button('💡 Dica', hint, 'btn-ghost'),
      checkBtn
    )
  )
  const modal = openModal({ title, jp, content, wide: true })
  render()

  function render() {
    lineEl.replaceChildren(...line.map((id) => chips.get(id)))
    poolEl.replaceChildren(...pool.map((id) => chips.get(id)))
    if (!line.length)
      lineEl.append(h('span.sb-placeholder', {}, 'Arraste os blocos para cá…'))
  }

  function toggle(id) {
    if (solved) return
    sfx('pop')
    if (line.includes(id)) {
      line = line.filter((x) => x !== id)
      pool.push(id)
    } else {
      pool = pool.filter((x) => x !== id)
      line.push(id)
    }
    render()
  }

  function insertAt(id, zone, x) {
    pool = pool.filter((p) => p !== id)
    line = line.filter((p) => p !== id)
    if (zone === 'line') {
      const others = line.map((lid) => chips.get(lid).getBoundingClientRect())
      let idx = others.findIndex((r) => x < r.left + r.width / 2)
      if (idx < 0) idx = line.length
      line.splice(idx, 0, id)
    } else pool.push(id)
    sfx('pop')
    render()
  }

  function attachDrag(el, id) {
    let start = null
    let dragging = false
    let offset = [0, 0]
    el.addEventListener('pointerdown', (e) => {
      if (solved || e.button > 0) return
      start = [e.clientX, e.clientY]
      const r = el.getBoundingClientRect()
      offset = [e.clientX - r.left, e.clientY - r.top]
      el.setPointerCapture(e.pointerId)
    })
    el.addEventListener('pointermove', (e) => {
      if (!start) return
      if (!dragging && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 6) {
        dragging = true
        const r = el.getBoundingClientRect()
        el.classList.add('dragging')
        Object.assign(el.style, {
          position: 'fixed',
          left: `${r.left}px`,
          top: `${r.top}px`,
          width: `${r.width}px`,
          zIndex: 1000
        })
      }
      if (dragging) {
        el.style.left = `${e.clientX - offset[0]}px`
        el.style.top = `${e.clientY - offset[1]}px`
        lineEl.classList.toggle('hover', inside(lineEl, e))
      }
    })
    const end = (e) => {
      if (!start) return
      const wasDragging = dragging
      start = null
      dragging = false
      el.classList.remove('dragging')
      lineEl.classList.remove('hover')
      Object.assign(el.style, { position: '', left: '', top: '', width: '', zIndex: '' })
      if (!wasDragging) return toggle(id)
      if (inside(lineEl, e)) insertAt(id, 'line', e.clientX)
      else if (inside(poolEl, e)) insertAt(id, 'pool', e.clientX)
      else render()
    }
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
  }

  function inside(zone, e) {
    const r = zone.getBoundingClientRect()
    return (
      e.clientX >= r.left - 10 &&
      e.clientX <= r.right + 10 &&
      e.clientY >= r.top - 20 &&
      e.clientY <= r.bottom + 20
    )
  }

  function hint() {
    const order = sentence.accept?.[0] ?? sentence.chunks.map((c) => c.id)
    const roles = order.map(
      (id) => ROLE_INFO[sentence.chunks.find((c) => c.id === id).role]
    )
    feedback(
      fb,
      false,
      `Ordem sugerida: <b>${roles.map((r) => r.label).join(' → ')}</b>.<br><small>${roles.map((r) => `${r.label}: ${r.desc}`).join(' · ')}</small>`
    )
    attempts++
  }

  function check() {
    if (solved) return modal.close({ firstTry: attempts === 0, attempts })
    const r = checkSentence(sentence, line)
    const verbId = sentence.chunks.find((c) => c.role === 'verb')?.verb
    if (!r.ok) {
      attempts++
      recordError(r.tag, r.tag === 'empty' ? null : verbId)
      feedback(fb, false, r.why)
      gsap.fromTo(
        lineEl,
        { x: -10 },
        { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
      )
      return
    }
    solved = true
    const text = joinChunks(sentence, line)
    addSentence()
    if (verbId) markProduced(verbId)
    addScore(attempts === 0 ? 60 : 30)
    lineEl.classList.add('solved')
    gsap.fromTo(
      [...lineEl.children],
      { y: -12 },
      { y: 0, stagger: 0.08, duration: 0.5, ease: 'bounce.out' }
    )
    speak(text)
    feedback(
      fb,
      true,
      `<b>正解！ Correto!</b><div class="fb-sentence" lang="ja">${jpHTML(text)}</div>${setting('romaji') ? `<div class="romaji">${romaji(text)}</div>` : ''}${r.note ? `<p>${r.note}</p>` : ''}`
    )
    checkBtn.textContent = 'Continuar ▶'
  }

  return modal.done.then(
    (r) => r ?? (solved ? { firstTry: attempts === 0, attempts } : null)
  )
}
