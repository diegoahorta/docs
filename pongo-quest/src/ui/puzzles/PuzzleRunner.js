// Executor de puzzles: mostra itens em sequência, dá feedback em
// português (não punitivo), dicas progressivas, gabarito após 3 erros,
// registra a aprendizagem e injeta revisões de itens errados antes.
import { state } from '../../systems/GameState.js'
import { audio } from '../../systems/AudioSystem.js'
import { learning } from '../../education/LearningTracker.js'
import { reviewItems } from '../../education/questionBank.js'
import { VOCAB_BY_ID } from '../../education/vocabulary.js'
import { ui } from '../UIManager.js'
import { rubyHTML, escapeHTML } from '../ruby.js'
import { portrait } from '../portraits.js'
import { COMPONENTS } from './components.js'
import { gsap, motionOK, confetti } from '../../animations/fx.js'

const PRAISE = [
  'すごい！ Muito bem!',
  'せいかい！ Correto!',
  'いいね！ Ótimo!',
  'かんぺき！ Perfeito!'
]
const GENTLE = [
  'Quase! Vamos tentar de novo.',
  'Boa tentativa! Observe com calma.',
  'Ainda não — você está perto!',
  'Tudo bem errar: é assim que se aprende.'
]
const TAUNTS = [
  'にゃはは！ ちがうにゃ～',
  'まよったにゃ？',
  'ワガハイの かちかにゃ？',
  'もう いちど やってみるにゃ！'
]
const OUCH = ['にゃっ！？', 'う、うそにゃ…', 'まよいが きえていくにゃ～', 'にゃにゃっ！']

const pick = (a) => a[Math.floor(Math.random() * a.length)]

/**
 * Executa um conjunto de puzzles num modal.
 * @returns {Promise<{total:number, firstTry:number}>}
 */
export function runPuzzles({
  title,
  stage = 'intake',
  items,
  boss = false,
  noReview = false,
  setId
}) {
  return new Promise((resolve) => {
    let list = items.filter(Boolean)
    if (!noReview && !boss) {
      const phase = state.progress.phase
      const ids = learning
        .reviewList()
        .filter((id) => (VOCAB_BY_ID[id]?.phase || 99) < phase)
      list = [...reviewItems(ids, 2), ...list]
    }
    const root = ui.el('div', 'card puzzle')
    root.setAttribute('role', 'dialog')
    root.innerHTML = `
      <header><span class="timer">${escapeHTML(stage.toUpperCase())}</span><h2>${rubyHTML(title || '')}</h2><span class="timer countdown hidden"></span><div class="dots">${list.map(() => '<i></i>').join('')}</div></header>
      ${boss ? `<div class="boss"><img alt="" src="${portrait('mayoi')}"><div style="flex:1"><div class="taunt">まよいメーター</div><div class="meter"><i style="width:100%"></i></div></div></div>` : ''}
      <div class="body"></div>
      <footer><div class="msg" aria-live="polite"></div><button class="btn hint-btn hidden">💡 Dica</button><button class="btn check hidden">Verificar</button><button class="btn primary next hidden">Continuar ▶</button></footer>`
    const modal = ui.openModal(root, { closeOnBackdrop: false })
    const body = root.querySelector('.body')
    const msg = root.querySelector('.msg')
    const btnCheck = root.querySelector('.check')
    const btnNext = root.querySelector('.next')
    const btnHint = root.querySelector('.hint-btn')
    const timerEl = root.querySelector('.countdown')
    const dots = [...root.querySelectorAll('.dots i')]
    const meter = root.querySelector('.boss .meter i')
    const taunt = root.querySelector('.boss .taunt')
    let idx = 0
    let firstTry = 0
    let wrong = 0
    let done = false
    let comp = null
    let timer = null

    const say = (html, kind = '') => {
      msg.className = `msg ${kind}`
      msg.innerHTML = html
      if (motionOK())
        gsap.fromTo(msg, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.2 })
    }

    const stopTimer = () => {
      clearInterval(timer)
      timer = null
      timerEl.classList.add('hidden')
    }

    const startTimer = () => {
      stopTimer()
      if (!state.settings.timer) return
      let t = 60
      timerEl.classList.remove('hidden')
      timerEl.textContent = `⏱ ${t}s`
      timer = setInterval(() => {
        t--
        timerEl.textContent = `⏱ ${t}s`
        if (t <= 0) {
          stopTimer()
          say(
            `⏰ O tempo acabou — sem problema! Dica: ${rubyHTML(list[idx].explain || '')}`,
            'soft'
          )
        }
      }, 1000)
    }

    const finishItem = () => {
      done = true
      stopTimer()
      btnCheck.classList.add('hidden')
      btnHint.classList.add('hidden')
      btnNext.classList.remove('hidden')
      btnNext.focus({ preventScroll: true })
      dots[idx].className = 'done'
    }

    const ctx = {
      submit({ correct, hint } = {}) {
        if (done) return
        const item = list[idx]
        learning.record({
          skill: item.skill,
          vocab: item.vocab,
          correct,
          tag: item.skill
        })
        if (correct) {
          if (wrong === 0) firstTry++
          audio.sfx('success')
          say(`<b>${pick(PRAISE)}</b> ${rubyHTML(item.explain || '')}`, 'ok')
          if (boss) {
            const left = 1 - (idx + 1) / list.length
            gsap.to(meter, {
              width: `${Math.max(0, left * 100)}%`,
              duration: motionOK() ? 0.6 : 0,
              ease: 'power2.out'
            })
            taunt.textContent = `${pick(OUCH)}  まよいメーター`
          }
          finishItem()
        } else {
          wrong++
          audio.sfx('soft-error')
          if (boss) taunt.textContent = `${pick(TAUNTS)}  まよいメーター`
          if (wrong >= 3) {
            comp?.reveal?.()
            say(
              `Vamos ver juntos a resposta: ${rubyHTML(item.explain || '')} <i>(este item voltará para revisão)</i>`,
              'soft'
            )
            finishItem()
          } else if (wrong === 2) {
            say(`${pick(GENTLE)} 💡 ${rubyHTML(item.explain || hint || '')}`, 'soft')
          } else {
            say(
              `${pick(GENTLE)}${hint ? ` <small>${escapeHTML(hint)}</small>` : ''}`,
              'soft'
            )
            btnHint.classList.remove('hidden')
          }
        }
      },
      miss(text) {
        const item = list[idx]
        learning.record({
          skill: item.skill,
          vocab: item.vocab,
          correct: false,
          tag: item.skill
        })
        wrong++
        audio.sfx('soft-error')
        say(
          `${escapeHTML(text)}${wrong >= 2 ? ` 💡 ${rubyHTML(item.explain || '')}` : ''}`,
          'soft'
        )
      },
      note(text) {
        setTimeout(
          () => say(`${msg.innerHTML}<br><small>${escapeHTML(text)}</small>`, 'ok'),
          0
        )
      },
      say(text) {
        say(escapeHTML(text))
      }
    }

    const show = () => {
      const item = list[idx]
      done = false
      wrong = 0
      body.innerHTML = ''
      say(item.review ? 'Revisão rápida antes da missão.' : '')
      dots.forEach((d, i) => (d.className = i < idx ? 'done' : i === idx ? 'now' : ''))
      btnNext.classList.add('hidden')
      btnHint.classList.add('hidden')
      comp = COMPONENTS[item.type]?.(body, item, ctx) || null
      btnCheck.classList.toggle('hidden', !comp?.check)
      if (motionOK())
        gsap.fromTo(
          body,
          { x: 30, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' }
        )
      startTimer()
    }

    const finishSet = () => {
      stopTimer()
      if (setId) learning.completeChallenge(setId)
      body.innerHTML = `<div style="text-align:center;padding:20px">
        <div style="font-size:56px">${boss ? '😺' : '🌟'}</div>
        <div class="prompt">${boss ? 'まよいメーター ゼロ！' : 'クリア！'}</div>
        <p>Você concluiu ${list.length} desafio(s) — ${firstTry} de primeira.</p>
        <p style="font-size:13px;color:#3a3157">Itens com erro voltam em revisões futuras. 💜</p></div>`
      say('')
      btnNext.textContent = 'Fechar ▶'
      btnNext.classList.remove('hidden')
      btnCheck.classList.add('hidden')
      btnHint.classList.add('hidden')
      audio.sfx('fanfare')
      confetti(40)
      btnNext.onclick = async () => {
        window.removeEventListener('keydown', onKey, true)
        await ui.closeModal(modal)
        resolve({ total: list.length, firstTry })
      }
    }

    btnCheck.addEventListener('click', () => comp?.check?.())
    btnHint.addEventListener('click', () =>
      say(`💡 ${rubyHTML(list[idx].explain || '')}`, 'soft')
    )
    btnNext.onclick = () => {
      idx++
      if (idx >= list.length) finishSet()
      else show()
    }
    const onKey = (e) => {
      if (
        e.code === 'Enter' &&
        !btnNext.classList.contains('hidden') &&
        document.activeElement !== btnNext
      ) {
        e.preventDefault()
        btnNext.click()
      }
    }
    window.addEventListener('keydown', onKey, true)
    show()
  })
}
