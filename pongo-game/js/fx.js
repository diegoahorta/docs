// Camada 2D de efeitos (canvas por cima do 3D):
// explosão estilo candy crush com doces, estrelas, confete, ondas de choque,
// raios de luz giratórios e palavras gigantes ("すごい！", "Delícia!").

const canvas = document.getElementById('fx')
const g = canvas.getContext('2d')
let W = 0
let H = 0
let dpr = 1

const parts = []
const rings = []
const words = []
let rays = null
let flash = 0
let running = false

const CANDY = ['#ff4d6d', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0', '#ff8fab', '#fb5607']
const CHEERS = ['すごい！', 'やった！', 'Delícia!', 'Incrível!', 'Doce!', 'Sugoi!', 'Perfeito!', 'Uau!']

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = window.innerWidth
  H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
}
window.addEventListener('resize', resize)
resize()

const rand = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[(Math.random() * arr.length) | 0]

function spawn(x, y, n, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2)
    const v = rand(4, 15) * power
    parts.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - rand(2, 6),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.3, 0.3),
      size: rand(9, 20),
      color: pick(CANDY),
      shape: pick(['wrapped', 'bean', 'star', 'star', 'heart', 'confetti', 'confetti', 'drop']),
      life: rand(70, 120),
      age: 0,
    })
  }
}

/** Explosão grande. `points` = lista de {x, y} na tela (ex.: centro de cada peça). */
export function celebrate(points, { intensity = 1, word } = {}) {
  const cx = W / 2
  const cy = H * 0.42
  flash = 0.9
  rays = { x: cx, y: cy, age: 0, life: 110, spin: rand(-0.02, 0.02) }
  // pops em cascata, peça por peça
  points.forEach((p, k) => {
    setTimeout(() => {
      spawn(p.x, p.y, Math.round(22 * intensity), 0.8)
      rings.push({ x: p.x, y: p.y, r: 10, max: 120, color: pick(CANDY), age: 0 })
    }, k * 110)
  })
  // estouro central
  setTimeout(() => {
    spawn(cx, cy, Math.round(110 * intensity), 1.3)
    rings.push({ x: cx, y: cy, r: 20, max: Math.max(W, H) * 0.7, color: '#ffffff', age: 0, w: 18 })
    rings.push({ x: cx, y: cy, r: 10, max: Math.max(W, H) * 0.5, color: pick(CANDY), age: 0, w: 10 })
    words.push({ text: word || pick(CHEERS), x: cx, y: cy, age: 0, life: 85, color: pick(CANDY) })
    document.body.classList.remove('quake')
    void document.body.offsetWidth
    document.body.classList.add('quake')
  }, points.length * 110 + 60)
  // chuva de confete pelas bordas
  setTimeout(() => {
    for (let i = 0; i < 40 * intensity; i++) {
      parts.push({
        x: rand(0, W), y: -20, vx: rand(-2, 2), vy: rand(2, 6),
        rot: rand(0, 6), vr: rand(-0.2, 0.2), size: rand(8, 14), color: pick(CANDY),
        shape: pick(['confetti', 'star', 'bean']), life: 160, age: 0,
      })
    }
  }, points.length * 110 + 250)
  start()
}

/** Pequeno estouro num ponto (ex.: peça encaixada, moeda de pista). */
export function burst(x, y, n = 18, word) {
  spawn(x, y, n, 0.7)
  rings.push({ x, y, r: 6, max: 90, color: pick(CANDY), age: 0 })
  if (word) words.push({ text: word, x, y: y - 30, age: 0, life: 70, color: pick(CANDY), small: true })
  start()
}

export function floatText(text, x, y, color = '#ffbe0b') {
  words.push({ text, x, y, age: 0, life: 70, color, small: true, rise: true })
  start()
}

function start() {
  if (running) return
  running = true
  requestAnimationFrame(loop)
}

function loop() {
  g.clearRect(0, 0, W, H)

  if (flash > 0) {
    g.fillStyle = `rgba(255,255,240,${flash * 0.6})`
    g.fillRect(0, 0, W, H)
    flash *= 0.85
    if (flash < 0.02) flash = 0
  }

  if (rays) {
    rays.age++
    const k = rays.age / rays.life
    const alpha = Math.sin(Math.PI * Math.min(1, k)) * 0.35
    g.save()
    g.translate(rays.x, rays.y)
    g.rotate(rays.age * (0.012 + rays.spin))
    const R = Math.max(W, H)
    for (let i = 0; i < 14; i++) {
      g.rotate((Math.PI * 2) / 14)
      g.fillStyle = i % 2 ? `rgba(255,214,102,${alpha})` : `rgba(255,143,171,${alpha})`
      g.beginPath()
      g.moveTo(0, 0)
      g.lineTo(R, -R * 0.12)
      g.lineTo(R, R * 0.12)
      g.closePath()
      g.fill()
    }
    g.restore()
    if (rays.age > rays.life) rays = null
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]
    r.age++
    r.r += (r.max - r.r) * 0.12
    const a = 1 - r.r / r.max
    g.strokeStyle = r.color
    g.globalAlpha = Math.max(0, a)
    g.lineWidth = (r.w || 6) * a + 1
    g.beginPath()
    g.arc(r.x, r.y, r.r, 0, Math.PI * 2)
    g.stroke()
    g.globalAlpha = 1
    if (a < 0.03) rings.splice(i, 1)
  }

  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]
    p.age++
    p.vx *= 0.97
    p.vy = p.vy * 0.97 + 0.32
    p.x += p.vx
    p.y += p.vy
    p.rot += p.vr
    const fade = Math.min(1, (p.life - p.age) / 25)
    g.globalAlpha = Math.max(0, fade)
    drawShape(p)
    if (p.age > p.life || p.y > H + 40) parts.splice(i, 1)
  }
  g.globalAlpha = 1

  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i]
    w.age++
    const k = w.age / w.life
    const s = w.small ? 1 : elastic(Math.min(1, w.age / 22)) * (1 + k * 0.15)
    const size = w.small ? 26 : Math.min(W * 0.16, 96)
    const y = w.rise ? w.y - w.age * 1.2 : w.y
    g.save()
    g.translate(w.x, y)
    g.rotate(w.small ? 0 : Math.sin(w.age * 0.15) * 0.06)
    g.scale(s, s)
    g.globalAlpha = Math.min(1, (w.life - w.age) / 15)
    g.font = `800 ${size}px "Baloo 2", "M PLUS Rounded 1c", sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.lineJoin = 'round'
    g.lineWidth = w.small ? 6 : 14
    g.strokeStyle = '#3a0ca3'
    g.strokeText(w.text, 0, 0)
    const grad = g.createLinearGradient(0, -size / 2, 0, size / 2)
    grad.addColorStop(0, '#fff6c2')
    grad.addColorStop(0.5, w.color)
    grad.addColorStop(1, '#ff4d6d')
    g.fillStyle = grad
    g.fillText(w.text, 0, 0)
    g.restore()
    if (w.age > w.life) words.splice(i, 1)
  }

  if (parts.length || rings.length || words.length || rays || flash) {
    requestAnimationFrame(loop)
  } else {
    running = false
    g.clearRect(0, 0, W, H)
  }
}

function elastic(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) * Math.cos(t * 10)
}

function drawShape(p) {
  g.save()
  g.translate(p.x, p.y)
  g.rotate(p.rot)
  const s = p.size
  g.fillStyle = p.color
  switch (p.shape) {
    case 'wrapped': {
      // bala embrulhada
      g.beginPath()
      g.ellipse(0, 0, s * 0.6, s * 0.45, 0, 0, Math.PI * 2)
      g.fill()
      g.beginPath()
      g.moveTo(-s * 0.5, 0); g.lineTo(-s, -s * 0.4); g.lineTo(-s, s * 0.4); g.closePath()
      g.moveTo(s * 0.5, 0); g.lineTo(s, -s * 0.4); g.lineTo(s, s * 0.4); g.closePath()
      g.fill()
      g.strokeStyle = 'rgba(255,255,255,.7)'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(-s * 0.2, -s * 0.4); g.lineTo(s * 0.1, s * 0.4)
      g.stroke()
      break
    }
    case 'bean': {
      g.beginPath()
      g.ellipse(0, 0, s * 0.7, s * 0.4, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,.55)'
      g.beginPath()
      g.ellipse(-s * 0.2, -s * 0.15, s * 0.25, s * 0.1, 0, 0, Math.PI * 2)
      g.fill()
      break
    }
    case 'star': {
      g.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.32 : s * 0.75
        const a = (i * Math.PI) / 5
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      g.closePath()
      g.fill()
      break
    }
    case 'heart': {
      const k = s / 18
      g.scale(k, k)
      g.beginPath()
      g.moveTo(0, 5)
      g.bezierCurveTo(-14, -6, -6, -16, 0, -7)
      g.bezierCurveTo(6, -16, 14, -6, 0, 5)
      g.fill()
      break
    }
    case 'drop': {
      g.beginPath()
      g.arc(0, 0, s * 0.45, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,.6)'
      g.beginPath()
      g.arc(-s * 0.15, -s * 0.15, s * 0.12, 0, Math.PI * 2)
      g.fill()
      break
    }
    default:
      g.fillRect(-s * 0.5, -s * 0.18, s, s * 0.36)
  }
  g.restore()
}
