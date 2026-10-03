// Áudio 100% sintetizado com Web Audio API:
// - trilha "aventura na selva" (congas, shaker, baixo saltitante, marimba, pássaros)
// - efeitos: cliques, erro, explosão estilo candy crush, latido, cavar, fanfarra

let ctx = null
let master, musicBus, sfxBus, noiseBuf
let musicOn = true
let sfxOn = true

export function initAudio() {
  if (ctx) {
    ctx.resume()
    return
  }
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(comp).connect(ctx.destination)
  musicBus = ctx.createGain()
  musicBus.gain.value = 0.32
  musicBus.connect(master)
  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.8
  sfxBus.connect(master)

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
}

export function setMusic(on) {
  musicOn = on
  if (!ctx) return
  musicBus.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.1)
}
export function setSfx(on) {
  sfxOn = on
  if (!ctx) return
  sfxBus.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.05)
}
/** Abaixa a música durante momentos importantes (fala, fanfarra). */
export function duckMusic(seconds = 1.5) {
  if (!ctx || !musicOn) return
  const t = ctx.currentTime
  musicBus.gain.cancelScheduledValues(t)
  musicBus.gain.setTargetAtTime(0.1, t, 0.05)
  musicBus.gain.setTargetAtTime(0.32, t + seconds, 0.4)
}

// ----------------------------------------------------------- primitivas

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)

function env(gainNode, t, a, peak, dec, sustain = 0.0001) {
  const g = gainNode.gain
  g.cancelScheduledValues(t)
  g.setValueAtTime(0.0001, t)
  g.exponentialRampToValueAtTime(peak, t + a)
  g.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + dec)
}

function tone({ freq, type = 'sine', t, dur = 0.3, vol = 0.3, attack = 0.005, out, glideTo, detune = 0, filter }) {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur)
  o.detune.value = detune
  const g = ctx.createGain()
  env(g, t, attack, vol, dur)
  let node = o
  if (filter) {
    const f = ctx.createBiquadFilter()
    f.type = filter.type || 'lowpass'
    f.frequency.value = filter.freq
    f.Q.value = filter.q || 1
    node.connect(f)
    node = f
  }
  node.connect(g).connect(out)
  o.start(t)
  o.stop(t + attack + dur + 0.05)
}

function noise({ t, dur = 0.1, vol = 0.2, type = 'highpass', freq = 6000, q = 1, out, sweepTo }) {
  const s = ctx.createBufferSource()
  s.buffer = noiseBuf
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.setValueAtTime(freq, t)
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur)
  f.Q.value = q
  const g = ctx.createGain()
  env(g, t, 0.003, vol, dur)
  s.connect(f).connect(g).connect(out)
  s.start(t, Math.random() * 0.5)
  s.stop(t + dur + 0.05)
}

// ------------------------------------------------------------- música
// Sol maior, 124 BPM, progressão G – Em – C – D (aventura alegre)

const BPM = 124
const STEP = 60 / BPM / 4 // semicolcheia
const CHORDS = [
  [55, 59, 62], // G
  [52, 55, 59], // Em
  [48, 52, 55], // C
  [50, 54, 57], // D
]
const BASS = [43, 40, 36, 38]
// pentatônica de G: índices -> notas
const SCALE = [67, 69, 71, 74, 76, 79, 81, 83, 86]
// 8 compassos x 8 colcheias; '.' = pausa
const MELODY = [
  '4.34.43.', '2.123...', '4.345654', '3.212...',
  '55.45.7.', '6.542.1.', '234.5.43', '1.2.0...',
]
const KICK = 'x......x x.......'.replace(/ /g, '')
const CONGA_HI = '..x..x....x..x.x'
const CONGA_LO = 'x.....x...x.....'
const CLAVE = 'x..x..x...x.x...'

let musicTimer = null
let nextTime = 0
let step = 0

export function startMusic() {
  if (!ctx || musicTimer) return
  nextTime = ctx.currentTime + 0.1
  step = 0
  musicTimer = setInterval(scheduler, 25)
}

function scheduler() {
  while (nextTime < ctx.currentTime + 0.12) {
    playStep(step, nextTime)
    nextTime += STEP
    step = (step + 1) % (16 * 8)
  }
}

function playStep(s, t) {
  const out = musicBus
  const bar = Math.floor(s / 16)
  const i = s % 16
  const chord = CHORDS[bar % 4]
  const swing = i % 2 === 1 ? STEP * 0.12 : 0
  t += swing

  // bumbo (tambor grave da selva)
  if (KICK[i] === 'x') tone({ freq: 120, glideTo: 45, t, dur: 0.22, vol: 0.9, out })
  // congas
  if (CONGA_HI[i] === 'x') tone({ freq: 380, glideTo: 300, t, dur: 0.12, vol: 0.35, out })
  if (CONGA_LO[i] === 'x') tone({ freq: 210, glideTo: 170, t, dur: 0.18, vol: 0.4, out })
  // clave de madeira
  if (CLAVE[i] === 'x' && bar % 2 === 1) tone({ freq: 2500, t, dur: 0.04, vol: 0.12, out, type: 'triangle' })
  // shaker em todas as semicolcheias
  noise({ t, dur: i % 4 === 2 ? 0.07 : 0.035, vol: i % 4 === 2 ? 0.12 : 0.05, freq: 7000, out })

  // baixo saltitante
  const root = BASS[bar % 4]
  const bassPat = { 0: root, 3: root + 12, 6: root + 7, 8: root, 10: root + 12, 14: root + 7 }
  if (bassPat[i] !== undefined) {
    tone({ freq: mtof(bassPat[i]), type: 'triangle', t, dur: 0.18, vol: 0.45, out })
    tone({ freq: mtof(bassPat[i]), type: 'square', t, dur: 0.08, vol: 0.06, out, filter: { freq: 600 } })
  }

  // acordes "skank" no contratempo
  if (i === 4 || i === 12 || (i === 14 && bar % 2 === 1)) {
    for (const n of chord) {
      tone({ freq: mtof(n + 12), type: 'triangle', t, dur: 0.12, vol: 0.07, out })
    }
  }

  // marimba (melodia em colcheias)
  if (i % 2 === 0) {
    const ch = MELODY[bar][i / 2]
    if (ch !== '.') {
      const f = mtof(SCALE[+ch])
      tone({ freq: f, t, dur: 0.35, vol: 0.22, out })
      tone({ freq: f * 4, t, dur: 0.06, vol: 0.05, out })
      tone({ freq: f * 2, type: 'triangle', t, dur: 0.12, vol: 0.04, out })
    }
  }

  // pássaros da selva de vez em quando
  if (i === 0 && bar % 4 === 2 && Math.random() < 0.8) bird(t + STEP * 3)
  if (i === 8 && bar === 7) monkey(t)
}

function bird(t) {
  const out = musicBus
  const base = 2200 + Math.random() * 1200
  for (let k = 0; k < 3; k++) {
    tone({ freq: base, glideTo: base * 1.5, t: t + k * 0.09, dur: 0.07, vol: 0.06, out })
  }
}

function monkey(t) {
  const out = musicBus
  for (let k = 0; k < 4; k++) {
    tone({ freq: 500 + k * 60, glideTo: 900 + k * 80, t: t + k * 0.11, dur: 0.09, vol: 0.05, type: 'sawtooth', out, filter: { type: 'bandpass', freq: 1200, q: 3 } })
  }
}

// ------------------------------------------------------------ efeitos

const now = () => ctx.currentTime

export function sfxTile() {
  if (!ctx) return
  const t = now()
  tone({ freq: 700 + Math.random() * 200, glideTo: 1200, t, dur: 0.08, vol: 0.25, out: sfxBus, type: 'triangle' })
}

export function sfxUntile() {
  if (!ctx) return
  const t = now()
  tone({ freq: 900, glideTo: 450, t, dur: 0.08, vol: 0.2, out: sfxBus, type: 'triangle' })
}

export function sfxWrong() {
  if (!ctx) return
  const t = now()
  tone({ freq: 220, glideTo: 110, t, dur: 0.35, vol: 0.25, type: 'sawtooth', out: sfxBus, filter: { freq: 900 } })
  tone({ freq: 233, glideTo: 104, t: t + 0.02, dur: 0.35, vol: 0.2, type: 'sawtooth', out: sfxBus, filter: { freq: 900 } })
  // "boing"
  tone({ freq: 160, glideTo: 520, t: t + 0.32, dur: 0.25, vol: 0.25, out: sfxBus })
}

/** Explosão estilo candy crush: cascata de pops, arpejo, brilhos, boom e whoosh. */
export function sfxCelebrate(intensity = 1) {
  if (!ctx) return
  duckMusic(2.2)
  const t = now()
  const out = sfxBus
  // whoosh subindo
  noise({ t, dur: 0.45, vol: 0.35, type: 'bandpass', freq: 400, sweepTo: 6000, q: 2, out })
  // boom grave
  tone({ freq: 160, glideTo: 35, t: t + 0.35, dur: 0.6, vol: 0.9, out })
  noise({ t: t + 0.35, dur: 0.4, vol: 0.4, type: 'lowpass', freq: 1500, sweepTo: 200, out })
  // arpejo doce
  const arp = [72, 76, 79, 84, 88, 91, 96]
  arp.forEach((m, k) => {
    tone({ freq: mtof(m), t: t + 0.05 + k * 0.055, dur: 0.25, vol: 0.18, type: 'square', out, filter: { freq: 3500 } })
    tone({ freq: mtof(m), t: t + 0.05 + k * 0.055, dur: 0.4, vol: 0.22, out })
  })
  // cascata de pops (bolhas estourando)
  const pops = Math.round(14 * intensity)
  for (let k = 0; k < pops; k++) {
    const tt = t + 0.35 + k * 0.045 + Math.random() * 0.03
    const f = 500 + Math.random() * 900
    tone({ freq: f * 2, glideTo: f * 0.6, t: tt, dur: 0.07, vol: 0.28, out })
  }
  // brilhos agudos
  for (let k = 0; k < 16 * intensity; k++) {
    const tt = t + 0.5 + Math.random() * 1.1
    tone({ freq: mtof(96 + [0, 4, 7, 12][k % 4]), t: tt, dur: 0.15, vol: 0.08, out })
  }
  // acorde final
  for (const m of [60, 64, 67, 72]) {
    tone({ freq: mtof(m), t: t + 0.42, dur: 0.9, vol: 0.12, type: 'sawtooth', out, filter: { freq: 2400 } })
  }
}

export function sfxPop() {
  if (!ctx) return
  const t = now()
  const f = 600 + Math.random() * 600
  tone({ freq: f * 2, glideTo: f * 0.5, t, dur: 0.08, vol: 0.3, out: sfxBus })
}

export function sfxBark() {
  if (!ctx) return
  const t = now()
  for (const dt of [0, 0.22]) {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(520, t + dt)
    o.frequency.exponentialRampToValueAtTime(260, t + dt + 0.13)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1100
    f.Q.value = 1.5
    const g = ctx.createGain()
    env(g, t + dt, 0.01, 0.6, 0.14)
    o.connect(f).connect(g).connect(sfxBus)
    o.start(t + dt)
    o.stop(t + dt + 0.2)
    noise({ t: t + dt, dur: 0.08, vol: 0.18, type: 'bandpass', freq: 1500, q: 2, out: sfxBus })
  }
}

export function sfxDig() {
  if (!ctx) return
  const t = now()
  noise({ t, dur: 0.12, vol: 0.4, type: 'lowpass', freq: 900, sweepTo: 300, out: sfxBus })
  tone({ freq: 90, glideTo: 60, t, dur: 0.08, vol: 0.2, out: sfxBus })
}

export function sfxStep() {
  if (!ctx) return
  const t = now()
  noise({ t, dur: 0.04, vol: 0.06, type: 'bandpass', freq: 1200, q: 1, out: sfxBus })
}

export function sfxFanfare(big = false) {
  if (!ctx) return
  duckMusic(big ? 4 : 2)
  const t = now()
  const seq = big
    ? [[67, 0, 0.15], [72, 0.15, 0.15], [76, 0.3, 0.15], [79, 0.45, 0.4], [76, 0.85, 0.15], [79, 1.0, 0.9]]
    : [[72, 0, 0.12], [76, 0.12, 0.12], [79, 0.24, 0.5]]
  for (const [m, dt, d] of seq) {
    for (const det of [-8, 8]) {
      tone({ freq: mtof(m), t: t + dt, dur: d + 0.15, vol: 0.13, type: 'sawtooth', detune: det, out: sfxBus, filter: { freq: 2600 } })
    }
    tone({ freq: mtof(m - 12), t: t + dt, dur: d + 0.1, vol: 0.15, type: 'triangle', out: sfxBus })
  }
  if (big) {
    for (let k = 0; k < 30; k++) tone({ freq: mtof(84 + Math.floor(Math.random() * 3) * 4), t: t + 1 + Math.random() * 1.8, dur: 0.12, vol: 0.07, out: sfxBus })
    tone({ freq: 140, glideTo: 30, t: t + 1, dur: 1, vol: 0.9, out: sfxBus })
  }
}

// --------------------------------------------------------------- fala

let jaVoice = null
function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() || []
  jaVoice = voices.find((v) => v.lang === 'ja-JP') || voices.find((v) => v.lang?.startsWith('ja')) || null
}
if ('speechSynthesis' in window) {
  pickVoice()
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export function speak(text, rate = 0.85) {
  if (!('speechSynthesis' in window) || !sfxOn) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  if (jaVoice) u.voice = jaVoice
  u.rate = rate
  u.pitch = 1.1
  duckMusic(2.5)
  window.speechSynthesis.speak(u)
}
