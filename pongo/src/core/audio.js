// Efeitos sonoros e música sintetizados com Web Audio (sem arquivos externos).
import { setting } from './store.js'
import { bus } from './events.js'

let ctx = null
let master = null
let musicGain = null
let musicTimer = null
let step = 0

function ensure() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.5
  master.connect(ctx.destination)
  musicGain = ctx.createGain()
  musicGain.gain.value = 0.16
  musicGain.connect(master)
  return ctx
}

/** Chamar após o primeiro gesto do usuário (política de autoplay). */
export function unlockAudio() {
  const c = ensure()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
  if (setting('music')) startMusic()
}

function tone(freq, dur, { type = 'sine', vol = 0.3, slide = 0, delay = 0, dest } = {}) {
  const c = ensure()
  if (!c || c.state !== 'running') return
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest ?? master)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function noise(dur, { vol = 0.2, freq = 900 } = {}) {
  const c = ensure()
  if (!c || c.state !== 'running') return
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  const g = c.createGain()
  g.gain.value = vol
  src.connect(f).connect(g).connect(master)
  src.start()
}

const SFX = {
  jump: () => tone(380, 0.18, { type: 'square', vol: 0.12, slide: 420 }),
  land: () => tone(140, 0.08, { type: 'triangle', vol: 0.15, slide: -60 }),
  click: () => tone(720, 0.05, { type: 'triangle', vol: 0.15 }),
  pop: () => tone(520, 0.09, { type: 'sine', vol: 0.25, slide: 300 }),
  talk: () => tone(600 + Math.random() * 200, 0.05, { type: 'square', vol: 0.05 }),
  correct: () => {
    tone(660, 0.12, { type: 'triangle', vol: 0.25 })
    tone(990, 0.2, { type: 'triangle', vol: 0.25, delay: 0.1 })
  },
  wrong: () => {
    tone(300, 0.15, { type: 'sine', vol: 0.2, slide: -80 })
    tone(240, 0.22, { type: 'sine', vol: 0.18, delay: 0.12, slide: -60 })
  },
  crystal: () =>
    [784, 988, 1175, 1568].forEach((f, i) =>
      tone(f, 0.25, { type: 'triangle', vol: 0.18, delay: i * 0.07 })
    ),
  verb: () => {
    tone(880, 0.1, { type: 'sine', vol: 0.18 })
    tone(1320, 0.18, { type: 'sine', vol: 0.15, delay: 0.08 })
  },
  splash: () => noise(0.35, { vol: 0.35, freq: 700 }),
  kick: () => {
    noise(0.08, { vol: 0.4, freq: 300 })
    tone(200, 0.1, { type: 'triangle', vol: 0.2, slide: -80 })
  },
  build: () => tone(240, 0.1, { type: 'square', vol: 0.1, slide: 120 }),
  portal: () => tone(200, 1.2, { type: 'sine', vol: 0.25, slide: 900 }),
  achievement: () =>
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, 0.3, { type: 'square', vol: 0.08, delay: i * 0.09 })
    )
}

export function sfx(name) {
  if (!setting('sfx')) return
  try {
    SFX[name]?.()
  } catch {
    /* áudio é opcional */
  }
}

// Música: escala pentatônica japonesa (yo) em loop leve.
const SCALE = [0, 2, 5, 7, 9, 12, 14, 17]
const MELODY = [
  0, 2, 3, 4, 3, 2, 1, 0, 2, 4, 5, 4, 3, 1, 2, -1, 4, 5, 6, 5, 4, 3, 2, 3, 2, 1, 0, 1, 2,
  1, 0, -1
]
const BASS = [0, 0, 3, 3, 4, 4, 2, 2]
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12)

function tick() {
  const c = ensure()
  if (!c || c.state !== 'running') return
  const m = MELODY[step % MELODY.length]
  if (m >= 0)
    tone(midi(67 + SCALE[m]), 0.32, { type: 'triangle', vol: 0.5, dest: musicGain })
  if (step % 4 === 0)
    tone(midi(43 + SCALE[BASS[(step / 4) % BASS.length]]), 0.7, {
      type: 'sine',
      vol: 0.6,
      dest: musicGain
    })
  step++
}

export function startMusic() {
  if (musicTimer || !setting('music')) return
  if (!ensure()) return
  musicTimer = setInterval(tick, 260)
}
export function stopMusic() {
  clearInterval(musicTimer)
  musicTimer = null
}

bus.on('settings', ({ key, value }) => {
  if (key === 'music') value ? startMusic() : stopMusic()
})
