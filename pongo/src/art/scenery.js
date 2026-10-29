// Cenário cartoon 2D em tons pastel (parque, cidade ao fundo, brinquedos).
// Todas as texturas são geradas em canvas: o jogo não depende de arquivos de imagem.
import { makeCanvas, ell, paint, rr, shade, capsule, star, rng, FONT } from './canvas.js'

export const PAL = {
  skyTop: '#8fd3f4',
  skyBottom: '#e3f6ff',
  cloud: '#ffffff',
  cloudShade: '#d3ebfa',
  grass: '#9fdb84',
  grassDark: '#78c266',
  grassLine: '#5fae5a',
  dirt: '#f3cfa0',
  dirtDark: '#e6b67f',
  trunk: '#b97c57',
  trunkLine: '#8a5638',
  leaf: ['#8fd27a', '#74c46b', '#a9e08c', '#b9e6a0'],
  wood: '#e8a96b',
  woodLine: '#b5713f',
  pink: '#f5768f',
  pinkLine: '#c84a68',
  yellow: '#ffd25c',
  yellowLine: '#d49a24',
  blue: '#5fb4ee',
  blueLine: '#2f7fc0',
  mint: '#7fd8c4',
  mintLine: '#3d9e8c',
  stone: '#c9c3d6',
  stoneLine: '#8f88a6',
  water: '#7fd3f2',
  waterLine: '#3fa6d6'
}

function canvas(w, h, fn) {
  const c = makeCanvas(w, h)
  const ctx = c.getContext('2d')
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  fn(ctx, w, h)
  return c
}

function cloud(seed) {
  const r = rng(seed)
  return canvas(280, 120, (ctx) => {
    const puffs = Array.from({ length: 6 }, (_, i) => [
      40 + i * 38 + r() * 10,
      70 - Math.sin((i / 5) * Math.PI) * 30 - r() * 8,
      30 + r() * 14
    ])
    ctx.fillStyle = PAL.cloudShade
    for (const [x, y, rad] of puffs) {
      ell(ctx, x + 3, y + 6, rad, rad * 0.85)
      ctx.fill()
    }
    ell(ctx, 140, 88, 115, 22)
    ctx.fill()
    ctx.fillStyle = PAL.cloud
    for (const [x, y, rad] of puffs) {
      ell(ctx, x, y, rad, rad * 0.85)
      ctx.fill()
    }
    ell(ctx, 140, 82, 112, 20)
    ctx.fill()
  })
}

function city() {
  const r = rng(7)
  const cols = ['#f7c9b6', '#bfe6d8', '#f3e3b5', '#f5b7c5', '#c9d8f5', '#d8f0c9']
  return canvas(1600, 380, (ctx, w, h) => {
    let x = 0
    while (x < w) {
      const bw = 90 + r() * 110
      const bh = 120 + r() * 220
      const col = cols[Math.floor(r() * cols.length)]
      const y = h - bh
      rr(ctx, x + 6, y, bw - 12, bh + 10, 10)
      paint(ctx, col, shade(col, -0.22), 3)
      if (r() > 0.5) {
        rr(ctx, x + bw * 0.3, y - 26, bw * 0.4, 30, 6)
        paint(ctx, shade(col, -0.06), shade(col, -0.22), 3)
      }
      const win = '#a6d8ef'
      for (let wy = y + 18; wy < h - 30; wy += 30) {
        for (let wx = x + 18; wx < x + bw - 28; wx += 24) {
          if (r() > 0.82) continue
          rr(ctx, wx, wy, 12, 16, 3)
          paint(ctx, win, shade(win, -0.2), 1.5)
        }
      }
      x += bw + r() * 30
    }
  })
}

function hills() {
  return canvas(1400, 260, (ctx, w, h) => {
    const band = (base, amp, col, line, phase, freq) => {
      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let x = 0; x <= w; x += 10) {
        const y =
          base -
          Math.sin((x / w) * Math.PI * 2 * freq + phase) * amp -
          Math.sin((x / w) * Math.PI * 6 + phase) * amp * 0.25
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w, h)
      ctx.closePath()
      paint(ctx, col, line, 3)
    }
    band(110, 50, '#b8e6b4', '#8fcf95', 0.4, 2)
    band(170, 36, '#9fdb9c', '#74c07c', 2.1, 3)
  })
}

function roundTree(ctx, x, y, s, r) {
  capsule(ctx, x, y, x + 4 * s, y - 90 * s, 22 * s, PAL.trunk, PAL.trunkLine, 3)
  capsule(
    ctx,
    x + 2 * s,
    y - 60 * s,
    x + 26 * s,
    y - 92 * s,
    9 * s,
    PAL.trunk,
    PAL.trunkLine,
    2.5
  )
  const blobs = [
    [0, -150, 70],
    [-50, -120, 50],
    [50, -118, 52],
    [-28, -190, 46],
    [32, -186, 48],
    [0, -100, 50]
  ]
  ctx.lineWidth = 7
  ctx.strokeStyle = shade(PAL.leaf[1], -0.25)
  for (const [bx, by, br] of blobs) {
    ell(ctx, x + bx * s, y + by * s, br * s, br * s * 0.92)
    ctx.stroke()
  }
  blobs.forEach(([bx, by, br], i) => {
    ell(ctx, x + bx * s, y + by * s, br * s, br * s * 0.92)
    paint(ctx, PAL.leaf[i % 2 ? 1 : 0])
  })
  for (let i = 0; i < 9; i++) {
    ell(ctx, x + (r() - 0.5) * 120 * s, y - (110 + r() * 90) * s, 12 * s, 8 * s, r())
    paint(ctx, PAL.leaf[2])
  }
}

function pine(ctx, x, y, s) {
  capsule(ctx, x, y, x, y - 40 * s, 16 * s, PAL.trunk, PAL.trunkLine, 3)
  const layers = [
    [-40, 70],
    [-95, 58],
    [-145, 44],
    [-185, 30]
  ]
  layers.forEach(([ly, lw], i) => {
    ctx.beginPath()
    ctx.moveTo(x - lw * s, y + ly * s)
    ctx.quadraticCurveTo(x, y + (ly - 10) * s, x + lw * s, y + ly * s)
    ctx.lineTo(x, y + (ly - 80) * s)
    ctx.closePath()
    paint(ctx, i % 2 ? '#5fbf8a' : '#6fcf98', '#3f9a6c', 3)
  })
}

function treesBack() {
  const r = rng(11)
  return canvas(1200, 260, (ctx, w, h) => {
    for (let x = 40; x < w; x += 120 + r() * 60) {
      if (r() > 0.6) pine(ctx, x, h, 0.75 + r() * 0.2)
      else roundTree(ctx, x, h, 0.6 + r() * 0.2, r)
    }
  })
}

function house(variant) {
  const roofs = [
    ['#f5768f', '#c84a68'],
    ['#5fc4c9', '#3a9499'],
    ['#ff9d6b', '#cf6c3d']
  ]
  const walls = ['#ffd3a6', '#c9d6f5', '#fff0c9']
  return canvas(260, 230, (ctx) => {
    const [roof, roofLine] = roofs[variant % 3]
    const wall = walls[variant % 3]
    rr(ctx, 30, 96, 200, 130, 8)
    paint(ctx, wall, shade(wall, -0.25), 3.5)
    ctx.beginPath()
    ctx.moveTo(14, 104)
    ctx.lineTo(130, 24)
    ctx.lineTo(246, 104)
    ctx.closePath()
    paint(ctx, roof, roofLine, 3.5)
    ctx.save()
    ctx.clip()
    ctx.strokeStyle = shade(roof, -0.15)
    ctx.lineWidth = 2.5
    for (let y = 40; y < 110; y += 12) {
      for (let x = 0; x < 260; x += 18) {
        ctx.beginPath()
        ctx.arc(x + ((y / 12) % 2) * 9, y, 9, 0, Math.PI)
        ctx.stroke()
      }
    }
    ctx.restore()
    rr(ctx, 112, 150, 40, 76, 6)
    paint(ctx, '#c98a5c', '#8a5638', 3)
    ell(ctx, 144, 190, 3, 3)
    paint(ctx, '#ffd25c')
    for (const wx of [50, 176]) {
      rr(ctx, wx, 132, 38, 38, 5)
      paint(ctx, '#bfe9fb', '#7a8fa6', 3)
      ctx.beginPath()
      ctx.moveTo(wx + 19, 132)
      ctx.lineTo(wx + 19, 170)
      ctx.moveTo(wx, 151)
      ctx.lineTo(wx + 38, 151)
      ctx.strokeStyle = '#7a8fa6'
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
    rr(ctx, 176, 30, 22, 44, 3)
    paint(ctx, '#e07a5f', '#a5503a', 3)
  })
}

function ground() {
  return canvas(256, 140, (ctx, w, h) => {
    ctx.fillStyle = PAL.dirt
    ctx.fillRect(0, 26, w, h)
    const r = rng(3)
    for (let i = 0; i < 14; i++) {
      ell(ctx, r() * w, 50 + r() * 80, 6 + r() * 8, 3 + r() * 3)
      paint(ctx, PAL.dirtDark)
    }
    ctx.fillStyle = PAL.grass
    ctx.beginPath()
    ctx.moveTo(0, 30)
    for (let x = 0; x <= w; x += 16) ctx.quadraticCurveTo(x + 8, 40, x + 16, 30)
    ctx.lineTo(w, 10)
    for (let x = w; x >= 0; x -= 8) ctx.lineTo(x, x % 16 ? 6 : 12)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = PAL.grassLine
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 30)
    for (let x = 0; x <= w; x += 16) ctx.quadraticCurveTo(x + 8, 40, x + 16, 30)
    ctx.stroke()
    ctx.strokeStyle = PAL.grassDark
    ctx.lineWidth = 2
    for (let x = 6; x < w; x += 22) {
      ctx.beginPath()
      ctx.moveTo(x, 22)
      ctx.lineTo(x + 3, 15)
      ctx.stroke()
    }
  })
}

function fence() {
  return canvas(160, 72, (ctx) => {
    for (const y of [26, 50]) {
      rr(ctx, 0, y, 160, 9, 3)
      paint(ctx, PAL.wood, PAL.woodLine, 2.5)
    }
    for (const x of [16, 56, 96, 136]) {
      ctx.beginPath()
      ctx.moveTo(x - 9, 72)
      ctx.lineTo(x - 9, 14)
      ctx.lineTo(x, 4)
      ctx.lineTo(x + 9, 14)
      ctx.lineTo(x + 9, 72)
      ctx.closePath()
      paint(ctx, '#f2bd85', PAL.woodLine, 2.5)
    }
  })
}

function lamp() {
  return canvas(50, 260, (ctx) => {
    rr(ctx, 19, 30, 12, 228, 5)
    paint(ctx, '#3f8fa8', '#2a6378', 3)
    rr(ctx, 10, 236, 30, 22, 6)
    paint(ctx, '#3f8fa8', '#2a6378', 3)
    rr(ctx, 9, 6, 32, 30, 10)
    paint(ctx, '#fff3b0', '#2a6378', 3)
  })
}

function sign() {
  return canvas(150, 140, (ctx) => {
    rr(ctx, 68, 60, 14, 80, 4)
    paint(ctx, PAL.wood, PAL.woodLine, 3)
    rr(ctx, 8, 10, 134, 64, 14)
    paint(ctx, '#fff6e0', PAL.woodLine, 4)
    ctx.fillStyle = '#e0607e'
    ctx.font = `800 34px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('公園', 75, 38)
    ctx.fillStyle = '#7a5c48'
    ctx.font = `700 12px ${FONT}`
    ctx.fillText('こうえん', 75, 62)
  })
}

function seesawBase() {
  return canvas(110, 80, (ctx) => {
    ctx.beginPath()
    ctx.moveTo(55, 8)
    ctx.lineTo(102, 76)
    ctx.lineTo(8, 76)
    ctx.closePath()
    paint(ctx, PAL.yellow, PAL.yellowLine, 4)
    ell(ctx, 55, 48, 13, 13)
    paint(ctx, PAL.blue, PAL.blueLine, 3)
    ell(ctx, 55, 48, 5, 5)
    paint(ctx, '#ffffff')
  })
}

function seesawPlank() {
  return canvas(340, 40, (ctx) => {
    rr(ctx, 6, 14, 328, 20, 8)
    paint(ctx, PAL.pink, PAL.pinkLine, 3.5)
    for (const x of [44, 296]) {
      ctx.beginPath()
      ctx.moveTo(x - 9, 15)
      ctx.lineTo(x - 7, 3)
      ctx.lineTo(x + 7, 3)
      ctx.lineTo(x + 9, 15)
      ctx.strokeStyle = PAL.yellowLine
      ctx.lineWidth = 5
      ctx.stroke()
    }
  })
}

function swingFrame() {
  return canvas(260, 240, (ctx) => {
    for (const x of [20, 240]) {
      capsule(ctx, x, 236, 130 + (x < 130 ? -90 : 90), 16, 12, PAL.pink, PAL.pinkLine, 3)
    }
    capsule(ctx, 30, 16, 230, 16, 14, PAL.pink, PAL.pinkLine, 3)
    capsule(ctx, 40, 236, 70, 16, 12, PAL.pink, PAL.pinkLine, 3)
    capsule(ctx, 220, 236, 190, 16, 12, PAL.pink, PAL.pinkLine, 3)
  })
}

function swingSeat() {
  return canvas(70, 170, (ctx) => {
    ctx.strokeStyle = '#8f88a6'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    for (const x of [10, 60]) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 150)
      ctx.stroke()
    }
    ctx.setLineDash([])
    rr(ctx, 2, 146, 66, 14, 6)
    paint(ctx, PAL.yellow, PAL.yellowLine, 3)
  })
}

function slide() {
  return canvas(300, 250, (ctx) => {
    capsule(ctx, 236, 246, 220, 40, 10, PAL.blue, PAL.blueLine, 3)
    capsule(ctx, 280, 246, 264, 40, 10, PAL.blue, PAL.blueLine, 3)
    for (let y = 70; y < 240; y += 34) {
      capsule(ctx, 226 - (y - 70) * 0.02, y, 270, y, 7, '#ffffff', PAL.blueLine, 2.5)
    }
    rr(ctx, 200, 30, 90, 16, 6)
    paint(ctx, PAL.blue, PAL.blueLine, 3)
    ctx.beginPath()
    ctx.moveTo(210, 30)
    ctx.quadraticCurveTo(150, 60, 80, 190)
    ctx.quadraticCurveTo(60, 226, 10, 232)
    ctx.lineTo(10, 248)
    ctx.quadraticCurveTo(80, 240, 104, 200)
    ctx.quadraticCurveTo(170, 76, 226, 46)
    ctx.closePath()
    paint(ctx, PAL.yellow, PAL.yellowLine, 4)
    ctx.beginPath()
    ctx.moveTo(206, 40)
    ctx.quadraticCurveTo(150, 70, 90, 194)
    ctx.strokeStyle = '#fff2b8'
    ctx.lineWidth = 5
    ctx.stroke()
  })
}

function bench() {
  return canvas(190, 96, (ctx) => {
    for (const x of [24, 162]) {
      rr(ctx, x - 6, 50, 12, 46, 3)
      paint(ctx, '#6b7a99', '#4a5670', 3)
    }
    rr(ctx, 6, 6, 178, 14, 6)
    paint(ctx, PAL.wood, PAL.woodLine, 3)
    rr(ctx, 6, 24, 178, 14, 6)
    paint(ctx, PAL.wood, PAL.woodLine, 3)
    rr(ctx, 2, 48, 186, 16, 6)
    paint(ctx, '#f2bd85', PAL.woodLine, 3)
  })
}

function fountain() {
  return canvas(90, 130, (ctx) => {
    rr(ctx, 26, 40, 38, 88, 8)
    paint(ctx, PAL.stone, PAL.stoneLine, 3)
    ell(ctx, 45, 38, 34, 12)
    paint(ctx, '#a8dff5', PAL.stoneLine, 3)
    ell(ctx, 45, 36, 22, 6)
    paint(ctx, '#d6f3ff')
    rr(ctx, 40, 16, 10, 20, 4)
    paint(ctx, '#9aa3c0', PAL.stoneLine, 2.5)
    rr(ctx, 40, 14, 22, 7, 3)
    paint(ctx, '#9aa3c0', PAL.stoneLine, 2.5)
  })
}

function waterArc() {
  return canvas(80, 50, (ctx) => {
    ctx.strokeStyle = '#7fd0ff'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(4, 30)
    ctx.quadraticCurveTo(30, -10, 70, 40)
    ctx.stroke()
    ctx.strokeStyle = '#d6f3ff'
    ctx.lineWidth = 2
    ctx.stroke()
  })
}

function picnic() {
  return canvas(250, 130, (ctx) => {
    for (const x of [40, 210]) {
      capsule(ctx, x, 40, x - 18, 126, 9, PAL.wood, PAL.woodLine, 3)
      capsule(ctx, x, 40, x + 18, 126, 9, PAL.wood, PAL.woodLine, 3)
    }
    rr(ctx, 4, 82, 242, 12, 5)
    paint(ctx, '#f2bd85', PAL.woodLine, 3)
    rr(ctx, 10, 28, 230, 18, 6)
    paint(ctx, PAL.wood, PAL.woodLine, 3)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(30, 26)
    ctx.lineTo(220, 26)
    ctx.lineTo(228, 60)
    ctx.lineTo(22, 60)
    ctx.closePath()
    ctx.clip()
    for (let x = 0; x < 250; x += 16) {
      for (let y = 20; y < 64; y += 16) {
        ctx.fillStyle = ((x + y) / 16) % 2 ? '#ff8f9f' : '#ffffff'
        ctx.fillRect(x, y, 16, 16)
      }
    }
    ctx.restore()
    ctx.beginPath()
    ctx.moveTo(30, 26)
    ctx.lineTo(220, 26)
    ctx.lineTo(228, 60)
    ctx.lineTo(22, 60)
    ctx.closePath()
    paint(ctx, null, '#d9607a', 2.5)
  })
}

function basket() {
  return canvas(70, 56, (ctx) => {
    ctx.beginPath()
    ctx.arc(35, 26, 22, Math.PI, 0)
    ctx.strokeStyle = PAL.woodLine
    ctx.lineWidth = 4
    ctx.stroke()
    rr(ctx, 8, 24, 54, 30, 8)
    paint(ctx, '#e6b067', PAL.woodLine, 3)
    ctx.strokeStyle = '#c98a45'
    ctx.lineWidth = 2
    for (let x = 16; x < 60; x += 9) {
      ctx.beginPath()
      ctx.moveTo(x, 26)
      ctx.lineTo(x, 52)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(14, 25)
    ctx.lineTo(28, 14)
    ctx.lineTo(38, 25)
    ctx.closePath()
    paint(ctx, '#ffffff', '#c9c3b3', 2)
  })
}

function ball() {
  return canvas(48, 48, (ctx) => {
    ell(ctx, 24, 24, 20, 20)
    paint(ctx, '#ffffff', '#c84a68', 3)
    ctx.save()
    ell(ctx, 24, 24, 19, 19)
    ctx.clip()
    const cols = [PAL.pink, PAL.yellow, PAL.blue]
    for (let i = 0; i < 6; i += 2) {
      ctx.beginPath()
      ctx.moveTo(24, 24)
      ctx.arc(24, 24, 22, (i / 6) * Math.PI * 2, ((i + 1) / 6) * Math.PI * 2)
      ctx.closePath()
      ctx.fillStyle = cols[i / 2]
      ctx.fill()
    }
    ctx.restore()
    ell(ctx, 24, 24, 5, 5)
    paint(ctx, '#ffffff', '#c84a68', 2)
    ell(ctx, 17, 15, 4, 2.5, -0.6)
    paint(ctx, 'rgba(255,255,255,0.8)')
  })
}

function bookbox() {
  return canvas(90, 150, (ctx) => {
    rr(ctx, 39, 70, 12, 80, 3)
    paint(ctx, PAL.wood, PAL.woodLine, 3)
    rr(ctx, 8, 22, 74, 56, 6)
    paint(ctx, '#7fd8c4', PAL.mintLine, 3)
    ctx.beginPath()
    ctx.moveTo(2, 26)
    ctx.lineTo(45, 2)
    ctx.lineTo(88, 26)
    ctx.closePath()
    paint(ctx, PAL.pink, PAL.pinkLine, 3)
    rr(ctx, 16, 32, 58, 38, 4)
    paint(ctx, '#fff6e0', PAL.mintLine, 2.5)
    const books = ['#e5484d', '#5fb4ee', '#ffd25c', '#9b7be0', '#78c266']
    books.forEach((c, i) => {
      rr(ctx, 20 + i * 10, 40 - (i % 2) * 3, 8, 28 + (i % 2) * 3, 2)
      paint(ctx, c, shade(c, -0.3), 1.5)
    })
  })
}

function bike() {
  return canvas(160, 96, (ctx) => {
    for (const x of [34, 126]) {
      ell(ctx, x, 64, 26, 26)
      paint(ctx, null, '#4a5670', 6)
      ell(ctx, x, 64, 4, 4)
      paint(ctx, '#4a5670')
      ctx.strokeStyle = '#9aa3c0'
      ctx.lineWidth = 1.5
      for (let a = 0; a < 6; a++) {
        ctx.beginPath()
        ctx.moveTo(x, 64)
        ctx.lineTo(x + Math.cos(a) * 22, 64 + Math.sin(a) * 22)
        ctx.stroke()
      }
    }
    const tube = (a, b, c, d) => capsule(ctx, a, b, c, d, 7, PAL.mint, PAL.mintLine, 2.5)
    tube(34, 64, 70, 64)
    tube(70, 64, 60, 26)
    tube(60, 26, 112, 30)
    tube(70, 64, 112, 30)
    tube(112, 30, 126, 64)
    tube(34, 64, 60, 26)
    capsule(ctx, 112, 30, 106, 10, 6, '#4a5670', '#2f3a52', 2)
    capsule(ctx, 100, 10, 116, 10, 6, '#4a5670', '#2f3a52', 2)
    rr(ctx, 46, 14, 26, 9, 4)
    paint(ctx, PAL.pink, PAL.pinkLine, 2.5)
    ell(ctx, 128, 26, 12, 8)
    paint(ctx, '#e6b067', PAL.woodLine, 2.5)
  })
}

function platform(lit) {
  return canvas(200, 64, (ctx) => {
    ctx.beginPath()
    ctx.moveTo(10, 22)
    ctx.quadraticCurveTo(100, 84, 190, 22)
    ctx.closePath()
    paint(ctx, PAL.dirt, PAL.dirtDark, 3)
    rr(ctx, 4, 8, 192, 24, 12)
    paint(ctx, lit ? '#c4f0a8' : PAL.grass, PAL.grassLine, 3.5)
    const pawCol = lit ? '#ffb347' : 'rgba(95,174,90,0.7)'
    ctx.fillStyle = pawCol
    ell(ctx, 100, 22, 7, 5.5)
    ctx.fill()
    for (const [x, y] of [
      [-8, -4],
      [-3, -9],
      [3, -9],
      [8, -4]
    ]) {
      ell(ctx, 100 + x, 22 + y, 2.6, 2.6)
      ctx.fill()
    }
    if (lit) {
      star(ctx, 30, 16, 6, 4, 0.4)
      paint(ctx, '#fff3b0')
      star(ctx, 170, 18, 5, 4, 0.4)
      paint(ctx, '#fff3b0')
    }
  })
}

function water(dark) {
  return canvas(128, 140, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, dark ? '#6cc3ea' : '#8fdcf6')
    g.addColorStop(1, dark ? '#3d8fc9' : '#5fb8e6')
    ctx.globalAlpha = 0.85
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, 10)
    ctx.quadraticCurveTo(32, 2, 64, 10)
    ctx.quadraticCurveTo(96, 18, 128, 10)
    ctx.lineTo(128, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#e8fbff'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(0, 10)
    ctx.quadraticCurveTo(32, 2, 64, 10)
    ctx.quadraticCurveTo(96, 18, 128, 10)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 3
    for (const [x, y] of [
      [20, 40],
      [80, 66],
      [40, 96]
    ]) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 18, y)
      ctx.stroke()
    }
  })
}

function plank() {
  return canvas(56, 26, (ctx) => {
    rr(ctx, 3, 3, 50, 20, 5)
    paint(ctx, PAL.wood, PAL.woodLine, 3)
    ctx.strokeStyle = shade(PAL.wood, -0.15)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(10, 13)
    ctx.lineTo(44, 13)
    ctx.stroke()
  })
}

function portalArch() {
  return canvas(250, 310, (ctx) => {
    const r = rng(5)
    ctx.beginPath()
    ctx.moveTo(14, 310)
    ctx.lineTo(14, 120)
    ctx.arc(125, 120, 111, Math.PI, 0)
    ctx.lineTo(236, 310)
    ctx.lineTo(196, 310)
    ctx.lineTo(196, 120)
    ctx.arc(125, 120, 71, 0, Math.PI, true)
    ctx.lineTo(54, 310)
    ctx.closePath()
    paint(ctx, '#d8cfe8', '#8f88a6', 4)
    ctx.save()
    ctx.clip()
    for (let i = 0; i < 30; i++) {
      rr(ctx, r() * 250, r() * 310, 26 + r() * 20, 14, 4)
      paint(ctx, null, '#b5abc9', 2)
    }
    ctx.restore()
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI
      star(ctx, 125 + Math.cos(a) * 92, 120 + Math.sin(a) * 92, 7, 4, 0.45)
      paint(ctx, ['#ffd35c', '#8fe3ff', '#ff9fd0'][i % 3])
    }
    ctx.fillStyle = PAL.leaf[1]
    for (const [x, y] of [
      [20, 200],
      [30, 150],
      [226, 230],
      [218, 170]
    ]) {
      ell(ctx, x, y, 12, 7, 0.6)
      paint(ctx, PAL.leaf[0], PAL.grassLine, 2)
    }
  })
}

function portalSwirl() {
  return canvas(150, 190, (ctx) => {
    const g = ctx.createRadialGradient(75, 95, 6, 75, 95, 90)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.3, '#bff3ff')
    g.addColorStop(0.65, '#b9a6f0')
    g.addColorStop(1, 'rgba(255,159,208,0)')
    ctx.fillStyle = g
    ell(ctx, 75, 95, 72, 92)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 4
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      for (let a = 0; a < Math.PI * 3; a += 0.1) {
        const rad = 6 + a * 7
        const x = 75 + Math.cos(a + i * 2.1) * rad * 0.8
        const y = 95 + Math.sin(a + i * 2.1) * rad
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  })
}

function barrier() {
  return canvas(160, 200, (ctx) => {
    const r = rng(9)
    for (let i = 0; i < 9; i++) {
      const x = 20 + r() * 120
      const h = 60 + r() * 110
      ctx.beginPath()
      ctx.moveTo(x - 16, 200)
      ctx.lineTo(x - 10, 200 - h)
      ctx.lineTo(x, 200 - h - 18)
      ctx.lineTo(x + 10, 200 - h)
      ctx.lineTo(x + 16, 200)
      ctx.closePath()
      paint(ctx, i % 2 ? '#a7a3b8' : '#bdb9cc', '#6f6a88', 3)
    }
  })
}

const CRYSTAL_COLORS = [
  ['#ff9fd0', '#d4609c'],
  ['#8fe3ff', '#3fa6d6'],
  ['#ffd35c', '#d49a24'],
  ['#a8e6a3', '#4fae6a'],
  ['#c7a8ff', '#7a5fd1']
]

function crystal(i) {
  const [c, l] = CRYSTAL_COLORS[i % CRYSTAL_COLORS.length]
  return canvas(40, 54, (ctx) => {
    ctx.beginPath()
    ctx.moveTo(20, 3)
    ctx.lineTo(36, 18)
    ctx.lineTo(20, 51)
    ctx.lineTo(4, 18)
    ctx.closePath()
    paint(ctx, c, l, 3)
    ctx.beginPath()
    ctx.moveTo(20, 3)
    ctx.lineTo(26, 18)
    ctx.lineTo(20, 51)
    ctx.lineTo(14, 18)
    ctx.closePath()
    paint(ctx, 'rgba(255,255,255,0.35)')
    ctx.beginPath()
    ctx.moveTo(4, 18)
    ctx.lineTo(36, 18)
    ctx.strokeStyle = l
    ctx.lineWidth = 2
    ctx.stroke()
  })
}

function radial(size, inner, outer) {
  return canvas(size, size, (ctx) => {
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    )
    g.addColorStop(0, inner)
    g.addColorStop(1, outer)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  })
}

function sparkleTex() {
  return canvas(22, 22, (ctx) => {
    star(ctx, 11, 11, 10, 4, 0.35)
    paint(ctx, '#ffffff')
  })
}

function butterfly(open) {
  return canvas(30, 24, (ctx) => {
    const w = open ? 1 : 0.35
    for (const s of [-1, 1]) {
      ell(ctx, 15 + s * 7 * w, 9, 7 * w + 1, 7)
      paint(ctx, '#ff9fd0', '#d4609c', 1.6)
      ell(ctx, 15 + s * 5 * w, 17, 5 * w + 1, 4.5)
      paint(ctx, '#ffd35c', '#d49a24', 1.6)
    }
    capsule(ctx, 15, 6, 15, 20, 3, '#5b4a8a', null)
  })
}

function flower(i) {
  const cols = ['#ff9fd0', '#ffd35c', '#c7a8ff', '#ffffff']
  return canvas(26, 34, (ctx) => {
    capsule(ctx, 13, 34, 13, 14, 3, PAL.grassDark, null)
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2
      ell(ctx, 13 + Math.cos(a) * 6, 12 + Math.sin(a) * 6, 5, 5)
      paint(ctx, cols[i % cols.length], shade(cols[i % cols.length], -0.25), 1.4)
    }
    ell(ctx, 13, 12, 4, 4)
    paint(ctx, '#ffb347')
  })
}

function bush() {
  return canvas(140, 76, (ctx) => {
    const blobs = [
      [30, 50, 26],
      [60, 36, 30],
      [94, 40, 28],
      [116, 54, 20],
      [70, 58, 22]
    ]
    ctx.strokeStyle = shade(PAL.leaf[1], -0.25)
    ctx.lineWidth = 6
    for (const [x, y, rad] of blobs) {
      ell(ctx, x, y, rad, rad * 0.85)
      ctx.stroke()
    }
    blobs.forEach(([x, y, rad], i) => {
      ell(ctx, x, y, rad, rad * 0.85)
      paint(ctx, PAL.leaf[i % 2])
    })
    for (const [x, y] of [
      [40, 40],
      [86, 30],
      [100, 52]
    ]) {
      ell(ctx, x, y, 4, 4)
      paint(ctx, '#ff9fd0')
    }
  })
}

function rock() {
  return canvas(70, 40, (ctx) => {
    ell(ctx, 35, 24, 30, 14)
    paint(ctx, PAL.stone, PAL.stoneLine, 3)
    ell(ctx, 28, 18, 10, 4, -0.2)
    paint(ctx, '#e4dff0')
  })
}

function bigTree(kind) {
  return canvas(260, 340, (ctx) => {
    if (kind === 'pine') pine(ctx, 130, 336, 1.3)
    else roundTree(ctx, 130, 336, 1.1, rng(21))
  })
}

function sky() {
  return canvas(16, 720, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, PAL.skyTop)
    g.addColorStop(0.75, PAL.skyBottom)
    g.addColorStop(1, '#f6fbff')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

export function buildScenery() {
  return {
    sky: sky(),
    sun: radial(220, 'rgba(255,248,200,0.95)', 'rgba(255,248,200,0)'),
    cloud0: cloud(1),
    cloud1: cloud(2),
    cloud2: cloud(3),
    city: city(),
    hills: hills(),
    treesBack: treesBack(),
    house0: house(0),
    house1: house(1),
    house2: house(2),
    tree0: bigTree('round'),
    tree1: bigTree('pine'),
    bush: bush(),
    rock: rock(),
    flower0: flower(0),
    flower1: flower(1),
    flower2: flower(2),
    flower3: flower(3),
    ground: ground(),
    fence: fence(),
    lamp: lamp(),
    sign: sign(),
    seesawBase: seesawBase(),
    seesawPlank: seesawPlank(),
    swingFrame: swingFrame(),
    swingSeat: swingSeat(),
    slide: slide(),
    bench: bench(),
    fountain: fountain(),
    waterArc: waterArc(),
    picnic: picnic(),
    basket: basket(),
    ball: ball(),
    bookbox: bookbox(),
    bike: bike(),
    platform: platform(false),
    platformLit: platform(true),
    water: water(false),
    river: water(true),
    plank: plank(),
    portalArch: portalArch(),
    portalSwirl: portalSwirl(),
    barrier: barrier(),
    crystal0: crystal(0),
    crystal1: crystal(1),
    crystal2: crystal(2),
    crystal3: crystal(3),
    crystal4: crystal(4),
    glow: radial(96, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'),
    dust: radial(20, 'rgba(255,248,235,0.95)', 'rgba(255,248,235,0)'),
    sparkle: sparkleTex(),
    bubble: radial(14, 'rgba(255,255,255,0.9)', 'rgba(191,243,255,0)'),
    butterfly0: butterfly(true),
    butterfly1: butterfly(false)
  }
}
