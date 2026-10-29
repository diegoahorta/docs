// Caixa de diálogo com retrato, texto japonês (furigana/romaji) e tradução.
import { gsap } from 'gsap'
import { h, jpBlock, jpHTML } from './dom.js'
import { layer, setDialogueOpen } from './ui.js'
import { frameURL } from '../art/register.js'
import { NPCS } from '../core/content.js'
import { speak } from '../core/tts.js'
import { sfx } from '../core/audio.js'

const ADVANCE_KEYS = new Set(['e', 'E', 'Enter', ' '])

/**
 * Mostra falas em sequência. Resolve quando o jogador termina de ler.
 * @param {{jp:string, pt:string}[]} lines
 * @param {string} speaker  id do NPC (taro, momo, kumi, silence) ou 'pongo'
 */
export function dialogue(lines, speaker) {
  const npc = NPCS[speaker]
  const narrator = speaker === 'narrator'
  const sheet = narrator ? 'pongo' : speaker
  const portraitFrame =
    speaker === 'silence'
      ? 'shh_0'
      : narrator
        ? 'celebrate_1'
        : speaker === 'pongo'
          ? 'idle_0'
          : 'talk_1'
  return new Promise((resolve) => {
    let i = 0
    const portrait = h('img.dlg-portrait', {
      src: frameURL(sheet, portraitFrame),
      alt: ''
    })
    const name = h('div.dlg-name', {
      lang: 'ja',
      html: npc
        ? `${jpHTML(npc.name)} <small>${npc.namePt}</small>`
        : narrator
          ? 'ナレーター <small>Narrador</small>'
          : 'ポンゴ <small>Pongo</small>'
    })
    const text = h('div.dlg-text')
    const next = h('button.btn.dlg-next', { type: 'button' }, '▶')
    const box = h(
      'div.dialogue',
      { role: 'dialog' },
      portrait,
      h('div.dlg-main', {}, name, text),
      next
    )
    layer('dialogue').append(box)
    setDialogueOpen(true)
    gsap.fromTo(
      box,
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.4)' }
    )
    gsap.fromTo(
      portrait,
      { rotate: -6 },
      { rotate: 6, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }
    )

    let ready = 0
    const show = () => {
      const line = lines[i]
      text.replaceChildren(jpBlock(line.jp, line.pt, { size: 'md' }))
      gsap.fromTo(text, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 })
      next.textContent = i < lines.length - 1 ? '▶' : '✓'
      sfx('talk')
      speak(line.jp)
      ready = performance.now() + 250
    }
    const advance = () => {
      if (performance.now() < ready) return
      i++
      if (i < lines.length) return show()
      window.removeEventListener('keydown', onKey)
      gsap.killTweensOf(portrait)
      gsap.to(box, {
        y: 60,
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          box.remove()
          setDialogueOpen(false)
          resolve()
        }
      })
    }
    const onKey = (e) => {
      if (ADVANCE_KEYS.has(e.key)) {
        e.preventDefault()
        advance()
      }
    }
    box.addEventListener('click', advance)
    window.addEventListener('keydown', onKey)
    show()
  })
}
