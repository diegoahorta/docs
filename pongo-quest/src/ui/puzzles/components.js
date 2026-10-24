// Componentes de puzzle reutilizáveis. Cada um recebe (el, item, ctx)
// e chama ctx.submit({correct}) quando o jogador responde.
// Opcionalmente retorna { check, reveal } para o executor.
import { toHTML, rubyHTML, toBlocks, escapeHTML } from '../ruby.js'
import { ABS, MOVES } from '../../systems/DirectionSystem.js'
import { audio } from '../../systems/AudioSystem.js'
import {
  cityMapSVG,
  findSceneSVG,
  routeGridSVG,
  simulateGrid,
  nodeXY,
  compassPickerSVG,
  facingSVG
} from './common.js'
import { gsap, motionOK, correctPulse, softWobble } from '../../animations/fx.js'

const shuffle = (a) => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

const promptHTML = (item) => `
  ${item.review ? '<div class="review-tag">🔁 Revisão de um item que você errou antes</div>' : ''}
  ${item.prompt ? `<div class="prompt ${item.big ? 'big' : ''}">${toHTML(item.prompt)}</div>` : ''}
  ${item.promptPt ? `<div class="prompt-pt ${item.prompt ? 'tr' : ''}">${escapeHTML(item.promptPt)}</div>` : ''}`

function optionButtons(el, options, onPick) {
  const wrap = document.createElement('div')
  wrap.className = 'options'
  options.forEach((o, i) => {
    const b = document.createElement('button')
    b.className = 'btn'
    b.innerHTML = `${o.jp ? rubyHTML(o.jp) : ''}${o.pt ? `<span class="${o.jp ? 'tr' : ''}">${escapeHTML(o.pt)}</span>` : ''}`
    b.addEventListener('click', () => onPick(i, b))
    wrap.appendChild(b)
  })
  el.appendChild(wrap)
  return [...wrap.children]
}

// ── Múltipla escolha ────────────────────────────────────────
export function choice(el, item, ctx) {
  el.innerHTML = promptHTML(item)
  let locked = false
  const btns = optionButtons(el, item.options, (i, b) => {
    if (locked) return
    const correct = i === item.answer
    b.classList.add(correct ? 'right' : 'wrong')
    correct ? correctPulse(b) : softWobble(b)
    if (correct) locked = true
    ctx.submit({ correct })
  })
  return {
    reveal: () => btns[item.answer].classList.add('right'),
    lock: () => (locked = true)
  }
}

// ── A. Direção correta ──────────────────────────────────────
export function direction(el, item, ctx) {
  el.innerHTML = promptHTML(item)
  const fig = document.createElement('div')
  fig.className = 'figure'
  el.appendChild(fig)
  let locked = false
  if (item.pick === 'compass') {
    fig.innerHTML = compassPickerSVG(item.facing)
    fig.querySelectorAll('[data-dir]').forEach((g) =>
      g.addEventListener('click', () => {
        if (locked) return
        const d = g.dataset.dir
        const correct = d === item.answer
        g.querySelector('text').textContent = ABS[d].kanji
        g.querySelector('.ring').setAttribute('fill', correct ? '#d8f7e6' : '#f2e3ff')
        if (correct) locked = true
        ctx.submit({ correct })
      })
    )
    return {
      reveal: () => {
        const g = fig.querySelector(`[data-dir="${item.answer}"]`)
        g.querySelector('text').textContent = ABS[item.answer].kanji
        g.querySelector('.ring').setAttribute('fill', '#d8f7e6')
      }
    }
  }
  if (item.visual === 'citymap')
    fig.innerHTML = cityMapSVG({ labels: ['plaza'], marker: { x: 31, y: 24 } })
  else if (item.facing) fig.innerHTML = facingSVG(item.facing)
  else fig.remove()
  const opts = item.options.map((d) => ({ jp: ABS[d].ruby, pt: ABS[d].pt }))
  const btns = optionButtons(el, opts, (i, b) => {
    if (locked) return
    const correct = item.options[i] === item.answer
    b.classList.add(correct ? 'right' : 'wrong')
    if (correct) locked = true
    ctx.submit({ correct })
  })
  return { reveal: () => btns[item.options.indexOf(item.answer)].classList.add('right') }
}

// ── B. Encontrar objeto pela descrição ──────────────────────
export function find(el, item, ctx) {
  el.innerHTML = `${item.review ? '<div class="review-tag">🔁 Revisão</div>' : ''}<div class="prompt">${toHTML(item.sentence)}</div><div class="prompt-pt tr">${escapeHTML(item.pt)}</div><div class="prompt-pt">Toque no lugar certo da cena.</div><div class="figure">${findSceneSVG(item.scene)}</div>`
  let locked = false
  el.querySelectorAll('[data-id]').forEach((g) => {
    const pick = () => {
      if (locked) return
      const correct = g.dataset.id === item.answer
      g.querySelector('.ring').setAttribute('stroke', correct ? '#2fbf71' : '#8a5bd6')
      if (correct) locked = true
      ctx.submit({ correct })
    }
    g.addEventListener('click', pick)
    g.addEventListener('keydown', (e) => e.key === 'Enter' && pick())
  })
  return {
    reveal: () =>
      el
        .querySelector(`[data-id="${item.answer}"] .ring`)
        ?.setAttribute('stroke', '#2fbf71')
  }
}

// ── C/H. Construção de frases por blocos ────────────────────
export function builder(el, item, ctx) {
  const answer = toBlocks(item.answer)
  const accepted = [answer, ...(item.alts || []).map(toBlocks)].map((bs) =>
    bs.map((b) => b.text).join('|')
  )
  const extra = (item.distractors || []).flatMap(toBlocks)
  const pool = shuffle([...answer, ...extra]).map((b, i) => ({ ...b, key: i }))
  el.innerHTML = `${promptHTML({ ...item, prompt: null, promptPt: item.prompt })}
    ${item.picture ? `<div class="figure">${findSceneSVG(item.picture.scene, { clickable: false, only: [item.picture.spot], highlight: item.picture.spot })}</div>` : ''}
    <div class="builder-line empty" aria-label="Frase montada"></div>
    <div class="builder-tray" aria-label="Blocos disponíveis"></div>
    <div class="legend"><span class="l-ref">referência</span><span class="l-no">の</span><span class="l-pos">posição</span><span class="l-part">に/で/へ</span><span class="l-pred">predicado</span></div>`
  const line = el.querySelector('.builder-line')
  const tray = el.querySelector('.builder-tray')
  let locked = false

  const makeBlock = (b) => {
    const d = document.createElement('div')
    d.className = `block b-${b.type}`
    d.innerHTML = rubyHTML(b.text)
    d.dataset.key = b.key
    d.dataset.text = b.text
    d.tabIndex = 0
    attachDrag(d)
    d.addEventListener('keydown', (e) => e.key === 'Enter' && toggle(d))
    return d
  }
  const refresh = () => {
    line.classList.toggle('empty', line.children.length === 0)
    line.querySelectorAll('.block').forEach((b) => b.classList.remove('bad'))
    audio.sfx('blip')
  }
  const toggle = (d) => {
    if (locked) return
    ;(d.parentElement === line ? tray : line).appendChild(d)
    refresh()
  }

  // Arrastar com ponteiro (mouse e toque); clique simples alterna.
  function attachDrag(d) {
    d.addEventListener('pointerdown', (e) => {
      if (locked) return
      e.preventDefault()
      const start = { x: e.clientX, y: e.clientY }
      let ghost = null
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return
        if (!ghost) {
          ghost = d.cloneNode(true)
          ghost.classList.add('dragging')
          document.body.appendChild(ghost)
          d.classList.add('ghost')
        }
        ghost.style.left = `${ev.clientX - ghost.offsetWidth / 2}px`
        ghost.style.top = `${ev.clientY - ghost.offsetHeight / 2}px`
      }
      const up = (ev) => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        if (!ghost) return toggle(d)
        ghost.remove()
        d.classList.remove('ghost')
        const lr = line.getBoundingClientRect()
        if (ev.clientY >= lr.top - 20 && ev.clientY <= lr.bottom + 20) {
          const after = [...line.children].find(
            (c) =>
              c !== d && ev.clientX < c.getBoundingClientRect().left + c.offsetWidth / 2
          )
          line.insertBefore(d, after || null)
        } else tray.appendChild(d)
        refresh()
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    })
  }
  pool.forEach((b) => tray.appendChild(makeBlock(b)))

  const check = () => {
    const seq = [...line.children].map((c) => c.dataset.text)
    if (!seq.length) return ctx.say('Monte a frase primeiro: toque nos blocos.')
    const correct = accepted.includes(seq.join('|'))
    if (correct) {
      locked = true
      audio.speak(item.answer)
      correctPulse(line)
    } else {
      // marca blocos fora de posição (dica não punitiva)
      ;[...line.children].forEach(
        (c, i) => c.dataset.text !== answer[i]?.text && c.classList.add('bad')
      )
      softWobble(line)
    }
    ctx.submit({
      correct,
      hint: 'Ordem: tópico は → referência → の → posição → に → あります/います.'
    })
  }
  const reveal = () => {
    locked = true
    line.innerHTML = ''
    answer.forEach((b, i) => line.appendChild(makeBlock({ ...b, key: `r${i}` })))
    tray.innerHTML = ''
    refresh()
  }
  return { check, reveal }
}

// ── D. Kanji ↔ leitura ──────────────────────────────────────
export function kanji(el, item, ctx) {
  el.innerHTML = `${promptHTML({ ...item, prompt: null, promptPt: item.prompt })}<div class="kanji-cols"><div class="col left"></div><div class="col right"></div></div>`
  const left = el.querySelector('.left')
  const right = el.querySelector('.right')
  let sel = null
  let matched = 0
  item.pairs.forEach(([k], i) => {
    const b = document.createElement('button')
    b.className = 'btn'
    b.textContent = k
    b.dataset.i = i
    b.addEventListener('click', () => {
      if (b.classList.contains('done')) return
      left.querySelectorAll('.btn').forEach((x) => x.classList.remove('sel'))
      b.classList.add('sel')
      sel = i
      audio.sfx('select')
    })
    left.appendChild(b)
  })
  shuffle(item.pairs.map((p, i) => ({ p, i }))).forEach(({ p, i }) => {
    const b = document.createElement('button')
    b.className = 'btn'
    b.innerHTML = `${p[1]}<span class="tr" style="display:block;font-size:11px">${escapeHTML(p[2])}</span>`
    b.addEventListener('click', () => {
      if (b.classList.contains('done') || sel == null) return
      const lb = left.querySelector(`[data-i="${sel}"]`)
      if (sel === i) {
        b.classList.add('done')
        lb.classList.remove('sel')
        lb.classList.add('done')
        audio.speak(p[1])
        correctPulse(b)
        matched++
        sel = null
        if (matched === item.pairs.length) ctx.submit({ correct: true })
        else audio.sfx('confirm')
      } else {
        softWobble(b)
        ctx.miss(`${item.pairs[sel][0]} não se lê ${p[1]}. Tente outra leitura.`)
      }
    })
    right.appendChild(b)
  })
  return {
    reveal: () => el.querySelectorAll('.btn').forEach((b) => b.classList.add('done'))
  }
}

// ── E. Partículas の・に・で・へ ─────────────────────────────
export function particle(el, item, ctx) {
  const [a, b] = item.sentence.split('＿')
  el.innerHTML = `${item.review ? '<div class="review-tag">🔁 Revisão</div>' : ''}<div class="prompt">${rubyHTML(a)}<span class="slot">？</span>${rubyHTML(b)}</div><div class="prompt-pt tr">${escapeHTML(item.pt)}</div><div class="prompt-pt">Escolha a partícula.</div>`
  const slot = el.querySelector('.slot')
  let locked = false
  const btns = optionButtons(
    el,
    item.options.map((o) => ({ jp: o })),
    (i, btn) => {
      if (locked) return
      const o = item.options[i]
      slot.textContent = o
      const correct = o === item.answer || (item.accept || []).includes(o)
      btn.classList.add(correct ? 'right' : 'wrong')
      if (correct) {
        locked = true
        correctPulse(slot)
        if (o !== item.answer)
          ctx.note(
            `Também está correto! A resposta mais típica aqui é 「${item.answer}」.`
          )
      } else softWobble(slot)
      ctx.submit({ correct })
    }
  )
  return {
    reveal: () => {
      slot.textContent = item.answer
      btns[item.options.indexOf(item.answer)].classList.add('right')
    }
  }
}

// ── F. Interpretar o mapa ───────────────────────────────────
export function map(el, item, ctx) {
  const clickable = item.mode === 'click'
  el.innerHTML = `${item.review ? '<div class="review-tag">🔁 Revisão</div>' : ''}<div class="prompt">${toHTML(item.question)}</div><div class="prompt-pt tr">${escapeHTML(item.questionPt)}</div>${clickable ? '<div class="prompt-pt">Toque no prédio certo no mapa.</div>' : ''}<div class="figure">${cityMapSVG({ labels: item.labels, highlight: item.highlight, clickable })}</div>`
  let locked = false
  if (clickable) {
    el.querySelectorAll('[data-id]').forEach((g) =>
      g.addEventListener('click', () => {
        if (locked) return
        const correct = g.dataset.id === item.answer
        g.querySelector('.ring')?.setAttribute('stroke', correct ? '#2fbf71' : '#8a5bd6')
        g.querySelector('.ring')?.setAttribute('stroke-width', 6)
        if (correct) locked = true
        ctx.submit({ correct })
      })
    )
    return {
      reveal: () =>
        el
          .querySelector(`[data-id="${item.answer}"] .ring`)
          ?.setAttribute('stroke', '#2fbf71')
    }
  }
  const btns = optionButtons(el, item.options, (i, b) => {
    if (locked) return
    const correct = item.options[i].id === item.answer
    b.classList.add(correct ? 'right' : 'wrong')
    if (correct) locked = true
    ctx.submit({ correct })
  })
  return {
    reveal: () =>
      btns[item.options.findIndex((o) => o.id === item.answer)].classList.add('right')
  }
}

// ── G. Reconstruir rota a partir de instruções ──────────────
export function route(el, item, ctx) {
  const trace = item.mode === 'trace'
  el.innerHTML = `${promptHTML({ ...item, prompt: null, promptPt: item.prompt })}
    ${trace ? `<div class="route-instr"><ol>${item.instructions.map((i) => `<li>${toHTML(MOVES[i].ruby)} <span class="tr" style="font-size:12px">${MOVES[i].pt}</span></li>`).join('')}</ol></div>` : ''}
    <div class="figure">${routeGridSVG(item, { clickable: trace })}</div>
    ${trace ? '' : `<div class="route-seq" aria-label="Sua rota"></div><div class="options build-opts"></div>`}`
  const pongo = el.querySelector('.pongo')
  const pr = el.querySelector('.pr')
  let locked = false

  const animate = (path) =>
    new Promise((resolve) => {
      if (!motionOK()) {
        const last = nodeXY(path[path.length - 1].c, path[path.length - 1].r)
        pongo.setAttribute('transform', `translate(${last.x} ${last.y})`)
        return resolve()
      }
      const tl = gsap.timeline({ onComplete: resolve })
      const pos = { ...nodeXY(path[0].c, path[0].r) }
      const rot = { a: { N: 0, E: 90, S: 180, W: 270 }[path[0].facing] }
      const apply = () => {
        pongo.setAttribute('transform', `translate(${pos.x} ${pos.y})`)
        pr.setAttribute('transform', `rotate(${rot.a})`)
      }
      path.slice(1).forEach((p) => {
        let target = { N: 0, E: 90, S: 180, W: 270 }[p.facing]
        tl.add(() => {
          while (target - rot.a > 180) target -= 360
          while (target - rot.a < -180) target += 360
        })
        tl.to(rot, { a: () => target, duration: 0.2, onUpdate: apply })
        tl.to(pos, {
          ...nodeXY(p.c, p.r),
          duration: 0.35,
          ease: 'power1.inOut',
          onUpdate: apply
        })
      })
    })

  if (trace) {
    const sim = simulateGrid(item, item.instructions)
    el.querySelectorAll('[data-node]').forEach((g) =>
      g.addEventListener('click', async () => {
        if (locked) return
        const [c, r] = g.dataset.node.split(',').map(Number)
        const correct = c === sim.end.c && r === sim.end.r
        g.querySelector('.ring').setAttribute('fill', correct ? '#d8f7e6' : '#f2e3ff')
        if (correct) {
          locked = true
          await animate(sim.path)
        }
        ctx.submit({ correct })
      })
    )
    return {
      reveal: async () => {
        el.querySelector(`[data-node="${sim.end.c},${sim.end.r}"] .ring`).setAttribute(
          'fill',
          '#d8f7e6'
        )
        await animate(sim.path)
      }
    }
  }

  // modo construção
  const SHORT = { straight: 'まっすぐ', right: '{右|みぎ}', left: '{左|ひだり}' }
  const seq = []
  const seqEl = el.querySelector('.route-seq')
  const draw = () => {
    seqEl.innerHTML =
      seq
        .map((s, i) => `<div class="block" data-i="${i}">${rubyHTML(SHORT[s])}</div>`)
        .join('') ||
      '<span style="color:#a59cc0;font-size:13px">Toque nas instruções abaixo para montar a rota</span>'
    seqEl.querySelectorAll('.block').forEach((b) =>
      b.addEventListener('click', () => {
        if (!locked) {
          seq.splice(Number(b.dataset.i), 1)
          draw()
        }
      })
    )
  }
  const opts = el.querySelector('.build-opts')
  ;['straight', 'right', 'left'].forEach((m) => {
    const b = document.createElement('button')
    b.className = 'btn'
    b.innerHTML = `${toHTML(MOVES[m].ruby)}<span class="tr" style="display:block;font-size:11px">${MOVES[m].pt}</span>`
    b.addEventListener('click', () => {
      if (!locked && seq.length < 8) {
        seq.push(m)
        audio.sfx('blip')
        draw()
      }
    })
    opts.appendChild(b)
  })
  const undo = document.createElement('button')
  undo.className = 'btn'
  undo.textContent = '⌫ Apagar'
  undo.addEventListener('click', () => {
    if (!locked) {
      seq.pop()
      draw()
    }
  })
  opts.appendChild(undo)
  draw()

  const check = async () => {
    if (!seq.length) return ctx.say('Monte pelo menos uma instrução.')
    const sim = simulateGrid(item, seq)
    await animate(sim.path)
    const correct = sim.ok && sim.end.c === item.goal.c && sim.end.r === item.goal.r
    if (correct) locked = true
    ctx.submit({
      correct,
      hint: sim.out
        ? 'Pongo saiu do mapa! Confira para onde ele está olhando antes de cada curva.'
        : 'Pongo não chegou ao 🏁. Lembre: 右/左 dependem da direção em que ele olha.'
    })
    if (!correct) {
      const s = nodeXY(item.start.c, item.start.r)
      setTimeout(() => {
        pongo.setAttribute('transform', `translate(${s.x} ${s.y})`)
        pr.setAttribute(
          'transform',
          `rotate(${{ N: 0, E: 90, S: 180, W: 270 }[item.start.facing]})`
        )
      }, 900)
    }
  }
  return { check }
}

export const COMPONENTS = {
  choice,
  direction,
  find,
  builder,
  kanji,
  particle,
  map,
  route
}
