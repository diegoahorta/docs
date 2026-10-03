import { STATIONS, LEVELS, WORDS, buildPuzzle, sentenceOf, romajiSentence } from './js/content.js'
import * as audio from './js/audio.js'
import { celebrate, burst, floatText } from './js/fx.js'
import { createWorld } from './js/world.js'

const $ = (id) => document.getElementById(id)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const TOTAL = STATIONS.reduce((n, s) => n + s.phrases.length, 0)

const game = {
  station: 0,
  phrase: 0,
  score: 0,
  combo: 0,
  firstTries: 0,
  attempts: 0,
  hints: 0,
  startedAt: 0,
  puzzle: null,
  placed: [], // índice da peça do banco em cada slot (ou null)
  bankTiles: [],
  learned: [],
  busy: false,
}

let world

// ------------------------------------------------------------------ boot

async function boot() {
  try {
    world = await createWorld($('world'), {
      onPongoTap: () => {
        audio.sfxBark()
        const p = world.pongoScreen()
        floatText('ワン！', p.x, p.y - 20, '#ff8a3d')
      },
      onStep: () => audio.sfxStep(),
    })
  } catch (err) {
    console.error(err)
    $('loading').textContent = 'Não foi possível carregar o 3D 😢 (veja o console)'
    return
  }
  $('loading').classList.add('gone')
  buildJourney()
  bindUI()
}

function bindUI() {
  $('btnStart').addEventListener('click', startGame)
  $('btnAgain').addEventListener('click', () => {
    $('finale').hidden = true
    world.reset()
    resetState()
    startGame()
  })
  $('btnCheck').addEventListener('click', check)
  $('btnHint').addEventListener('click', hint)
  $('btnListen').addEventListener('click', () => audio.speak(sentenceOf(current())))
  $('btnNext').addEventListener('click', next)

  toggle('btnMusic', (on) => audio.setMusic(on))
  toggle('btnSfx', (on) => audio.setSfx(on))
  toggle('btnRomaji', (on) => document.body.classList.toggle('no-romaji', !on))
}

function toggle(id, fn) {
  const b = $(id)
  b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true'
    b.setAttribute('aria-pressed', String(on))
    fn(on)
  })
}

function resetState() {
  Object.assign(game, { station: 0, phrase: 0, score: 0, combo: 0, firstTries: 0, attempts: 0, hints: 0, learned: [] })
  $('score').textContent = '0'
  updateCombo()
  buildJourney()
}

async function startGame() {
  audio.initAudio()
  audio.startMusic()
  $('intro').hidden = true
  $('hud').hidden = false
  world.endIntro()
  audio.sfxBark()
  await sleep(700)
  await goToStation(0)
}

// --------------------------------------------------------------- jornada

function buildJourney() {
  const ol = $('journey')
  ol.innerHTML = ''
  STATIONS.forEach((s, i) => {
    const li = document.createElement('li')
    li.textContent = s.icon
    li.title = s.place
    if (i < game.station) li.className = 'done'
    if (i === game.station) li.className = 'current'
    ol.appendChild(li)
  })
}

async function goToStation(i) {
  game.station = i
  game.phrase = 0
  buildJourney()
  toast(`🐾 O Pongo farejou algo ${STATIONS[i].place}…`)
  await world.walkTo(i)
  audio.sfxBark()
  world.hop()
  showPuzzle()
}

const current = () => STATIONS[game.station].phrases[game.phrase]
const phraseNumber = () => STATIONS.slice(0, game.station).reduce((n, s) => n + s.phrases.length, 0) + game.phrase + 1

// ---------------------------------------------------------------- puzzle

function showPuzzle() {
  const st = STATIONS[game.station]
  const ph = current()
  const level = LEVELS.find((l) => l.id === st.level)
  game.puzzle = buildPuzzle(ph, st.level)
  game.bankTiles = shuffle([...game.puzzle.answer, ...game.puzzle.distract])
  game.placed = game.puzzle.answer.map(() => null)
  game.attempts = 0
  game.hints = 0
  game.startedAt = performance.now()
  game.busy = false

  $('chunkLevel').textContent = `Chunk: ${level.label}`
  $('clueCount').textContent = `Pista ${phraseNumber()}/${TOTAL}`
  $('clueText').textContent = `${ph.clue} ${level.hint}`
  $('targetText').textContent = ph.pt
  renderSlots()
  renderBank()
  $('panel').classList.add('open')
  world.setPanelOpen(true)
}

function renderSlots() {
  const wrap = $('slots')
  wrap.innerHTML = ''
  let k = 0
  for (const grp of game.puzzle.groups) {
    const g = document.createElement('div')
    g.className = `group ${grp.kind}`
    g.innerHTML = `<span class="group-label">${grp.label}</span>`
    for (let i = 0; i < grp.size; i++, k++) {
      const slot = document.createElement('div')
      slot.className = 'slot'
      slot.dataset.index = k
      const bankIndex = game.placed[k]
      if (bankIndex !== null) {
        const t = tileEl(game.bankTiles[bankIndex])
        t.addEventListener('click', () => unplace(+slot.dataset.index))
        slot.appendChild(t)
      }
      g.appendChild(slot)
    }
    wrap.appendChild(g)
  }
  $('btnCheck').disabled = game.placed.some((p) => p === null)
}

function renderBank() {
  const bank = $('bank')
  bank.innerHTML = ''
  game.bankTiles.forEach((tile, i) => {
    const t = tileEl(tile)
    t.style.animationDelay = `${i * 40}ms`
    if (game.placed.includes(i)) t.classList.add('used')
    t.addEventListener('click', () => place(i))
    bank.appendChild(t)
  })
}

function tileEl(tile) {
  const b = document.createElement('button')
  b.className = `tile k-${tile.kind}`
  b.innerHTML = `${tile.text}<small>${tile.romaji}</small>`
  b.setAttribute('aria-label', `${tile.text} (${tile.romaji})`)
  return b
}

function place(bankIndex) {
  if (game.busy || game.placed.includes(bankIndex)) return
  const slot = game.placed.indexOf(null)
  if (slot === -1) return
  game.placed[slot] = bankIndex
  audio.sfxTile()
  clearMarks()
  renderSlots()
  renderBank()
}

function unplace(slotIndex) {
  if (game.busy) return
  game.placed[slotIndex] = null
  audio.sfxUntile()
  clearMarks()
  renderSlots()
  renderBank()
}

function clearMarks() {
  document.querySelectorAll('.slot').forEach((s) => s.classList.remove('wrong', 'right'))
}

function hint() {
  if (game.busy) return
  const ans = game.puzzle.answer
  // primeiro slot errado ou vazio
  const k = game.placed.findIndex((b, i) => b === null || game.bankTiles[b].text !== ans[i].text)
  if (k === -1) return
  // libera a peça certa caso esteja em outro slot
  const correct = game.bankTiles.findIndex((t, i) => t.text === ans[k].text && !game.placed.some((p, s) => p === i && game.bankTiles[p].text === ans[s].text))
  const used = game.placed.indexOf(correct)
  if (used !== -1) game.placed[used] = null
  game.placed[k] = correct
  game.hints++
  audio.sfxTile()
  floatText('-40 💡', window.innerWidth / 2, window.innerHeight * 0.55, '#8b4dff')
  renderSlots()
  renderBank()
}

function check() {
  if (game.busy || game.placed.some((p) => p === null)) return
  const ans = game.puzzle.answer
  const ok = game.placed.every((b, i) => game.bankTiles[b].text === ans[i].text)
  game.attempts++
  if (ok) return success()

  // erro: marca peças erradas e treme
  audio.sfxWrong()
  game.combo = 0
  updateCombo()
  document.querySelectorAll('.slot').forEach((el) => {
    const i = +el.dataset.index
    el.classList.add(game.bankTiles[game.placed[i]].text === ans[i].text ? 'right' : 'wrong')
  })
  const panel = $('panel')
  panel.classList.remove('shake')
  void panel.offsetWidth
  panel.classList.add('shake')
  toast(wrongTip(), 2600)
}

function wrongTip() {
  const ans = game.puzzle.answer
  const placed = game.placed.map((b) => game.bankTiles[b].text)
  const waIdx = placed.findIndex((t) => t === 'は' || (t.endsWith('は') && t.length > 1))
  const desuIdx = placed.findIndex((t) => t.endsWith('です'))
  if (desuIdx !== -1 && desuIdx !== placed.length - 1) return 'です sempre fecha a frase — ela vai no final!'
  if (waIdx !== -1 && desuIdx !== -1 && waIdx > desuIdx) return 'O tópico (com は) vem primeiro, o comentário (com です) depois.'
  if (placed.some((t, i) => t !== ans[i].text && !ans.some((a) => a.text === t))) return 'Tem uma peça intrusa! Leia a tradução de novo.'
  return 'Quase! Confira a ordem: [tópico は] [comentário です].'
}

// ---------------------------------------------------------------- acerto

function success() {
  game.busy = true
  const ph = current()
  const secs = (performance.now() - game.startedAt) / 1000
  const first = game.attempts === 1 && game.hints === 0
  if (first) {
    game.combo++
    game.firstTries++
  } else {
    game.combo = 0
  }
  const mult = Math.min(3, 1 + Math.max(0, game.combo - 1) * 0.5)
  const speed = Math.max(0, Math.round(50 - secs * 2))
  const base = 100 + (first ? 50 : 0) + speed
  const pts = Math.max(20, Math.round((base - game.hints * 40) * mult))
  game.score += pts
  game.learned.push(ph)

  // posição das peças na tela -> explosão
  const points = [...document.querySelectorAll('.slot .tile')].map((el) => {
    const r = el.getBoundingClientRect()
    el.classList.add('popping')
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })
  const isLast = game.station === STATIONS.length - 1 && game.phrase === STATIONS[game.station].phrases.length - 1
  celebrate(points, { intensity: isLast ? 1.6 : 1 + Math.min(game.combo, 4) * 0.15 })
  audio.sfxCelebrate(1 + Math.min(game.combo, 4) * 0.2)
  setTimeout(() => audio.speak(sentenceOf(ph)), 900)
  world.hop()
  bumpScore()
  updateCombo()

  // cartão do chunk aprendido
  const details = [first ? 'de primeira!' : null, speed ? `rapidez +${speed}` : null, mult > 1 ? `combo x${mult}` : null, game.hints ? `dicas -${game.hints * 40}` : null].filter(Boolean)
  $('resultPoints').innerHTML = `+${pts}<small>${details.join(' · ')}</small>`
  $('resultChunks').innerHTML = `
    <div class="chunk topic"><span class="jp">${ph.topic}<b>は</b></span><span class="tag">TÓPICO · ${WORDS[ph.topic].pt}</span></div>
    <div class="chunk comment"><span class="jp">${ph.comment}<b>です</b></span><span class="tag">COMENTÁRIO · ${WORDS[ph.comment].pt}</span></div>`
  $('resultRomaji').textContent = romajiSentence(ph)
  $('resultPt').textContent = ph.pt
  $('resultNote').textContent = ph.note
  setTimeout(() => {
    $('panel').classList.remove('open')
    world.setPanelOpen(false)
    $('result').hidden = false
  }, 350)
}

function bumpScore() {
  const el = $('score')
  const from = +el.textContent
  const to = game.score
  const t0 = performance.now()
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 900)
    el.textContent = Math.round(from + (to - from) * k)
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
  const box = el.parentElement
  box.classList.remove('bump')
  void box.offsetWidth
  box.classList.add('bump')
}

function updateCombo() {
  const el = $('combo')
  const mult = Math.min(3, 1 + Math.max(0, game.combo - 1) * 0.5)
  el.textContent = `x${mult}`
  el.classList.toggle('hot', mult > 1)
}

async function next() {
  $('result').hidden = true
  const st = STATIONS[game.station]
  if (game.phrase < st.phrases.length - 1) {
    game.phrase++
    showPuzzle()
    return
  }
  // estação concluída -> cavar!
  toast('🐶 Cava, Pongo, cava!')
  const digSounds = setInterval(() => audio.sfxDig(), 180)
  await world.dig(game.station, st.find)
  clearInterval(digSounds)

  const last = game.station === STATIONS.length - 1
  if (last) return finale()

  audio.sfxFanfare()
  const p = world.revealScreen()
  burst(p.x, p.y, 40, st.find === 'ball' ? 'ボール！' : 'Pista!')
  game.score += 50
  bumpScore()
  floatText('+50 bônus de buraco', p.x, p.y + 30, '#06d6a0')
  toast(st.findText, 3200)
  await sleep(2600)
  await goToStation(game.station + 1)
}

async function finale() {
  game.station = STATIONS.length
  buildJourney()
  audio.sfxFanfare(true)
  const p = world.revealScreen()
  celebrate([p, { x: p.x - 120, y: p.y + 40 }, { x: p.x + 120, y: p.y + 40 }], { intensity: 2, word: 'ほね！' })
  game.score += 200
  bumpScore()
  setTimeout(() => audio.speak('ほねは ここです！'), 600)
  setTimeout(() => celebrate([{ x: window.innerWidth * 0.25, y: window.innerHeight * 0.3 }, { x: window.innerWidth * 0.75, y: window.innerHeight * 0.3 }], { intensity: 1.4, word: 'やった！' }), 1800)
  await sleep(4200)

  const stars = game.firstTries >= TOTAL - 2 ? 3 : game.firstTries >= TOTAL / 2 ? 2 : 1
  $('stars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? '' : 'off'}" style="animation-delay:${i * 0.2}s">⭐</span>`).join('')
  $('finalScore').textContent = game.score
  let best = 0
  try {
    best = +localStorage.getItem('pongo-best') || 0
    if (game.score > best) localStorage.setItem('pongo-best', String(game.score))
  } catch {}
  $('bestScore').textContent = game.score > best ? '🏆 Novo recorde!' : `Recorde: ${best}`
  $('notebook').innerHTML = game.learned
    .map((ph) => `<li><span class="jp">${ph.topic}<b>は</b> ${ph.comment}<i>です</i></span><span>${ph.pt}</span></li>`)
    .join('')
  $('finale').hidden = false
}

// ----------------------------------------------------------------- toast

let toastTimer
function toast(text, ms = 2200) {
  const el = $('toast')
  el.textContent = text
  el.hidden = false
  el.style.animation = 'none'
  void el.offsetWidth
  el.style.animation = ''
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (el.hidden = true), ms)
}

boot()
