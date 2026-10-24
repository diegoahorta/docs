// Objetos do mundo e mobília (canvas → texturas Phaser).
import { makeCanvas, outline } from './pixelSprites.js'

const px = (ctx, color, x, y, w = 1, h = 1) => {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

const disc = (ctx, color, cx, cy, r) => {
  ;[cx, cy, r] = [cx, cy, r].map(Math.round)
  ctx.fillStyle = color
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y))
    ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1)
  }
}

function tree(size = 1) {
  const W = 32 * size
  const H = 40 * size
  const [c, ctx] = makeCanvas(W + 2, H + 2)
  const cx = W / 2 + 1
  px(ctx, 'rgba(0,0,0,0.18)', cx - 9 * size, H - 4 * size, 18 * size, 4 * size)
  px(ctx, '#7a4a2a', cx - 3 * size, H - 16 * size, 6 * size, 14 * size)
  px(ctx, '#5a341c', cx + 1 * size, H - 16 * size, 2 * size, 14 * size)
  disc(ctx, '#2f7d3a', cx, 15 * size, 14 * size)
  disc(ctx, '#3f9a48', cx - 3 * size, 12 * size, 10 * size)
  disc(ctx, '#5cb85c', cx - 5 * size, 9 * size, 5 * size)
  disc(ctx, '#3f9a48', cx + 6 * size, 18 * size, 6 * size)
  return outline(c, '#1d3a22')
}

function trafficLight() {
  const [c, ctx] = makeCanvas(12, 30)
  px(ctx, '#555c66', 5, 10, 2, 19)
  px(ctx, '#2b2f36', 1, 1, 10, 10)
  disc(ctx, '#ff5252', 4, 5, 2)
  disc(ctx, '#2ecc71', 8, 5, 2)
  px(ctx, 'rgba(0,0,0,0.2)', 3, 28, 6, 2)
  return outline(c)
}

function bench() {
  const [c, ctx] = makeCanvas(28, 14)
  px(ctx, '#8a5a3a', 2, 2, 24, 3)
  px(ctx, '#a8744a', 2, 6, 24, 3)
  px(ctx, '#4a3424', 4, 9, 2, 4)
  px(ctx, '#4a3424', 22, 9, 2, 4)
  return outline(c)
}

function fountain() {
  const [c, ctx] = makeCanvas(48, 48)
  disc(ctx, '#9aa0aa', 24, 26, 21)
  disc(ctx, '#c8cdd4', 24, 25, 20)
  disc(ctx, '#3f97d6', 24, 25, 16)
  disc(ctx, '#7cc4f2', 20, 22, 4)
  disc(ctx, '#c8cdd4', 24, 25, 5)
  disc(ctx, '#e8f6ff', 24, 20, 3)
  px(ctx, '#ffffff', 23, 12, 2, 8)
  return outline(c, '#4a4e5c')
}

function car() {
  const [c, ctx] = makeCanvas(34, 22)
  px(ctx, 'rgba(0,0,0,0.2)', 3, 18, 28, 3)
  px(ctx, '#d9534f', 2, 6, 30, 12)
  px(ctx, '#e8716d', 2, 6, 30, 2)
  px(ctx, '#b33c38', 8, 1, 18, 7)
  px(ctx, '#bfe6ff', 10, 2, 6, 4)
  px(ctx, '#bfe6ff', 18, 2, 6, 4)
  px(ctx, '#ffe066', 30, 9, 2, 3)
  px(ctx, '#222', 5, 16, 6, 4)
  px(ctx, '#222', 23, 16, 6, 4)
  return outline(c)
}

function signpost() {
  const [c, ctx] = makeCanvas(22, 26)
  px(ctx, '#6b4a2b', 10, 10, 3, 15)
  px(ctx, '#2a1d16', 0, 0, 22, 12)
  px(ctx, '#1f7a4d', 1, 1, 20, 10)
  return c
}

function pedestal() {
  const [c, ctx] = makeCanvas(16, 16)
  px(ctx, 'rgba(0,0,0,0.2)', 2, 13, 12, 3)
  px(ctx, '#9aa0aa', 3, 6, 10, 8)
  px(ctx, '#c8cdd4', 2, 4, 12, 3)
  return outline(c)
}

function shard() {
  const [c, ctx] = makeCanvas(12, 14)
  const rows = [
    '.....xx.....',
    '....xyyx....',
    '...xyyyyx...',
    '..xyyzyyyx..',
    '.xyyzzyyyyx.',
    'xyyyzyyyyyyx',
    '.xyyyyyyyyx.',
    '..xyyyyyyx..',
    '...xyyyyx...',
    '....xyyx....',
    '.....xx.....'
  ]
  const pal = { x: '#3a2a70', y: '#7fd3ff', z: '#ffffff' }
  rows.forEach((r, y) => [...r].forEach((ch, x) => pal[ch] && px(ctx, pal[ch], x, y + 1)))
  return c
}

function gate() {
  const [c, ctx] = makeCanvas(56, 44)
  px(ctx, '#2f6e3a', 0, 8, 10, 36)
  px(ctx, '#2f6e3a', 46, 8, 10, 36)
  px(ctx, '#245a2e', 0, 0, 56, 12)
  px(ctx, '#3f8a4a', 2, 2, 52, 3)
  px(ctx, '#c0392b', 14, 3, 28, 7)
  px(ctx, '#fff8e7', 16, 4, 24, 5)
  return outline(c, '#1d3a22')
}

// ── Mobília ────────────────────────────────────────────────────
function table(w = 48, h = 32) {
  const [c, ctx] = makeCanvas(w, h)
  px(ctx, '#6b4426', 3, 12, 3, h - 12)
  px(ctx, '#6b4426', w - 6, 12, 3, h - 12)
  px(ctx, 'rgba(0,0,0,0.15)', 6, h - 3, w - 12, 3)
  px(ctx, '#a5703f', 0, 0, w, 13)
  px(ctx, '#c48a52', 1, 1, w - 2, 9)
  px(ctx, '#8a5a32', 0, 10, w, 3)
  return c
}

function desk() {
  const [c, ctx] = makeCanvas(64, 32)
  px(ctx, '#7a5434', 0, 0, 64, 30)
  px(ctx, '#9c6c42', 1, 1, 62, 12)
  px(ctx, '#5a3a24', 0, 13, 64, 2)
  px(ctx, '#6b4426', 6, 17, 20, 10)
  px(ctx, '#6b4426', 38, 17, 20, 10)
  // livro sobre a mesa (本は机の上にあります)
  px(ctx, '#3c6fd6', 26, 3, 12, 8)
  px(ctx, '#fff8e7', 27, 4, 10, 6)
  px(ctx, '#3c6fd6', 31, 3, 2, 8)
  return outline(c)
}

function box() {
  const [c, ctx] = makeCanvas(32, 30)
  px(ctx, '#7a5228', 3, 6, 26, 8) // interior escuro
  px(ctx, '#c8955a', 0, 1, 6, 6) // abas
  px(ctx, '#c8955a', 26, 1, 6, 6)
  px(ctx, '#d9a86a', 3, 12, 26, 16)
  px(ctx, '#b07c44', 3, 12, 26, 2)
  px(ctx, '#e6bd84', 13, 16, 6, 2)
  return outline(c)
}

/** Frente da caixa — fica por cima do gato que está “dentro”. */
function boxFront() {
  const [c, ctx] = makeCanvas(32, 30)
  px(ctx, '#d9a86a', 3, 12, 26, 16)
  px(ctx, '#b07c44', 3, 12, 26, 2)
  px(ctx, '#e6bd84', 13, 16, 6, 2)
  px(ctx, '#20142a', 2, 12, 1, 17)
  px(ctx, '#20142a', 29, 12, 1, 17)
  px(ctx, '#20142a', 2, 28, 28, 1)
  return c
}

function sofa() {
  const [c, ctx] = makeCanvas(64, 32)
  px(ctx, '#3c6fd6', 0, 0, 64, 14) // encosto
  px(ctx, '#5a8ce8', 2, 2, 60, 4)
  px(ctx, '#2f59b0', 0, 12, 64, 18)
  px(ctx, '#4a7be0', 6, 14, 52, 10)
  px(ctx, '#2f59b0', 31, 14, 2, 10)
  px(ctx, '#244a90', 0, 12, 6, 18)
  px(ctx, '#244a90', 58, 12, 6, 18)
  return outline(c)
}

function shelf() {
  const [c, ctx] = makeCanvas(32, 48)
  px(ctx, '#6b4426', 0, 0, 32, 48)
  px(ctx, '#8a5a32', 2, 2, 28, 44)
  const cols = ['#e74c3c', '#3c6fd6', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22']
  for (let row = 0; row < 3; row++) {
    const y = 4 + row * 14
    px(ctx, '#5a3a24', 2, y + 11, 28, 2)
    for (let i = 0; i < 6; i++) px(ctx, cols[(i + row) % 6], 4 + i * 4, y + 2, 3, 9)
  }
  return outline(c)
}

function bed() {
  const [c, ctx] = makeCanvas(48, 64)
  px(ctx, '#8a5a32', 0, 0, 48, 64)
  px(ctx, '#ffffff', 3, 3, 42, 14)
  px(ctx, '#e8e8f0', 6, 5, 36, 8)
  px(ctx, '#f78fb3', 3, 18, 42, 42)
  px(ctx, '#f5a6c4', 3, 18, 42, 4)
  return outline(c)
}

function tv() {
  const [c, ctx] = makeCanvas(32, 30)
  px(ctx, '#6b4426', 2, 18, 28, 12)
  px(ctx, '#222831', 0, 0, 32, 19)
  px(ctx, '#4aa3e0', 2, 2, 28, 14)
  px(ctx, '#7cc4f2', 4, 4, 8, 3)
  return outline(c)
}

function plant() {
  const [c, ctx] = makeCanvas(16, 20)
  px(ctx, '#c0573a', 4, 12, 8, 7)
  disc(ctx, '#3f9a48', 8, 7, 6)
  disc(ctx, '#5cb85c', 6, 5, 3)
  return outline(c)
}

function mazeDoor(color) {
  const [c, ctx] = makeCanvas(24, 30)
  px(ctx, '#3a2a20', 0, 0, 24, 30)
  px(ctx, color, 2, 2, 20, 28)
  px(ctx, 'rgba(255,255,255,0.3)', 4, 4, 7, 22)
  px(ctx, '#ffe066', 17, 15, 3, 3)
  return c
}

function shadow() {
  const [c, ctx] = makeCanvas(14, 5)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(7, 2.5, 7, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()
  return c
}

function sparkle() {
  const [c, ctx] = makeCanvas(7, 7)
  px(ctx, '#fffbd1', 3, 0, 1, 7)
  px(ctx, '#fffbd1', 0, 3, 7, 1)
  px(ctx, '#ffffff', 2, 2, 3, 3)
  return c
}

function junction() {
  const [c, ctx] = makeCanvas(24, 24)
  disc(ctx, 'rgba(255,255,255,0.18)', 12, 12, 11)
  disc(ctx, 'rgba(120,90,60,0.25)', 12, 12, 8)
  return c
}

export function makeObjectTextures() {
  return {
    tree: tree(1),
    bigTree: tree(1.5),
    light: trafficLight(),
    bench: bench(),
    fountain: fountain(),
    car: car(),
    signpost: signpost(),
    pedestal: pedestal(),
    shard: shard(),
    gate: gate(),
    table: table(),
    desk: desk(),
    box: box(),
    boxFront: boxFront(),
    sofa: sofa(),
    shelf: shelf(),
    bed: bed(),
    tv: tv(),
    plant: plant(),
    doorBlue: mazeDoor('#3c6fd6'),
    doorRed: mazeDoor('#e74c3c'),
    shadow: shadow(),
    sparkle: sparkle(),
    junction: junction()
  }
}
