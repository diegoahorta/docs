// Pixel art original desenhada por código (placeholders definitivos até
// a chegada dos assets finais em public/assets/sprites).

export function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingEnabled = false
  return [c, ctx]
}

export function drawAscii(ctx, rows, palette, ox = 0, oy = 0, flip = false) {
  rows.forEach((row, y) => {
    const chars = [...row]
    chars.forEach((ch, x) => {
      const color = palette[ch]
      if (!color) return
      ctx.fillStyle = color
      const px = flip ? ox + chars.length - 1 - x : ox + x
      ctx.fillRect(px, oy + y, 1, 1)
    })
  })
}

/** Contorno de 1px em volta dos pixels opacos (estilo 16 bits). */
export function outline(canvas, color = '#20142a') {
  const ctx = canvas.getContext('2d')
  const { width: w, height: h } = canvas
  const src = ctx.getImageData(0, 0, w, h)
  const out = ctx.getImageData(0, 0, w, h)
  const a = (x, y) =>
    x < 0 || y < 0 || x >= w || y >= h ? 0 : src.data[(y * w + x) * 4 + 3]
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (a(x, y)) continue
      if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) {
        const i = (y * w + x) * 4
        out.data[i] = r
        out.data[i + 1] = g
        out.data[i + 2] = b
        out.data[i + 3] = 255
      }
    }
  ctx.putImageData(out, 0, 0)
  return canvas
}

// ── Pongo (orangotango explorador da ODU Creative) ─────────────────
export const PONGO_PALETTE = {
  o: '#3b1f12',
  f: '#e07b2e',
  F: '#a8521c',
  s: '#f6cf9f',
  e: '#1a1020',
  p: '#e86a7a',
  r: '#e04848',
  b: '#3d6fd6',
  B: '#274a96',
  w: '#ffffff'
}

const HEAD_FRONT = [
  '................',
  '.....oooooo.....',
  '....offffffo....',
  '...offffffffo...',
  '..offfssssfffo..',
  '.ofssssssssssfo.',
  '.ofssessssessfo.',
  '.ofssessssessfo.',
  '.offsssppsssffo.',
  '..offssssssffo..',
  '...orrrrrrrro...'
]
const BODY_FRONT = [
  '..offffffffffo..',
  '.offffffffffffo.',
  '.ofsffffffffsfo.',
  '..offffffffffo..',
  '...offFooFffo...'
]
const HEAD_BACK = [
  '................',
  '.....oooooo.....',
  '....offffffo....',
  '...offffffffo...',
  '..offffffffffo..',
  '.offffffffffffo.',
  '.offffffffffffo.',
  '.offffffffffffo.',
  '.offffffffffffo.',
  '..offffffffffo..',
  '...orrrrrrrro...'
]
const BODY_BACK = [
  '..ofbbbbbbbbfo..',
  '.ofbbBBBBBBbbfo.',
  '.osbbbbbbbbbbso.',
  '..obbbbbbbbbbo..',
  '...offFooFffo...'
]
const LEGS_FRONT = {
  stand: ['...offo..offo...', '...oooo..oooo...'],
  stepA: ['...oooo..offo...', '.........oooo...'],
  stepB: ['...offo..oooo...', '...oooo.........']
}
const SIDE = [
  '................',
  '.....oooooo.....',
  '....offffffo....',
  '...offffffffo...',
  '...offffffsso...',
  '..offffssssssO..',
  '..offfffssesso..',
  '..offfffssessso.',
  '..oFffffsssspso.',
  '...offffssssoo..',
  '....orrrrrro....',
  '...obbffffffo...',
  '..obbbffffffo...',
  '..obbbffffsfo...',
  '...obbffffffo...',
  '....offFFffo....'
]
const LEGS_SIDE = {
  stand: ['....offooffo....', '....oooooooo....'],
  stepA: ['...offo...offo..', '...oooo...oooo..'],
  stepB: ['....offooffo....', '....oooooooo....']
}

export const PONGO_FRAME = { w: 16, h: 18 }
export const PONGO_ROWS = ['down', 'left', 'right', 'up']

/** Folha de sprites de Pongo: 4 linhas (S, O, L, N) × 4 quadros. */
export function makePongoSheet() {
  const { w, h } = PONGO_FRAME
  const [c, ctx] = makeCanvas(w * 4, h * 4)
  const pal = { ...PONGO_PALETTE, O: PONGO_PALETTE.o }
  const seq = ['stand', 'stepA', 'stand', 'stepB']
  seq.forEach((leg, i) => {
    const bob = leg === 'stand' ? 0 : -1
    // baixo (sul)
    drawAscii(ctx, [...HEAD_FRONT, ...BODY_FRONT], pal, i * w, 0 * h + bob)
    drawAscii(ctx, LEGS_FRONT[leg], pal, i * w, 0 * h + 16)
    // esquerda (oeste) = lado espelhado
    drawAscii(ctx, SIDE, pal, i * w, 1 * h + bob, true)
    drawAscii(ctx, LEGS_SIDE[leg], pal, i * w, 1 * h + 16, true)
    // direita (leste)
    drawAscii(ctx, SIDE, pal, i * w, 2 * h + bob)
    drawAscii(ctx, LEGS_SIDE[leg], pal, i * w, 2 * h + 16)
    // cima (norte)
    drawAscii(ctx, [...HEAD_BACK, ...BODY_BACK], pal, i * w, 3 * h + bob)
    drawAscii(ctx, LEGS_FRONT[leg], pal, i * w, 3 * h + 16)
  })
  return c
}

// ── Pessoas (NPCs) ─────────────────────────────────────────────
const HUMAN = [
  '................',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hssssssssh...',
  '...ssessssess...',
  '...ssessssess...',
  '...ssssmmssss...',
  '....ssssssss....',
  '....cccccccc....',
  '...cccccccccc...',
  '..cccccccccccc..',
  '..sccccccccccs..',
  '...cccccccccc...',
  '....pppppppp....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....kkk..kkk....'
]

export function makeHumanSheet(palette, robot = false) {
  const [c, ctx] = makeCanvas(18 * 2, 20)
  const pal = {
    h: palette.hair,
    s: palette.skin,
    e: '#1a1020',
    m: robot ? '#26c6da' : '#c0546a',
    c: palette.cloth,
    p: palette.pants,
    k: palette.shoe
  }
  for (let f = 0; f < 2; f++) {
    const [fc, fctx] = makeCanvas(18, 20)
    drawAscii(fctx, HUMAN, pal, 1, 1 + (f === 1 ? 1 : 0))
    if (robot) {
      fctx.fillStyle = '#ff5252'
      fctx.fillRect(8, 0, 2, 2) // antena
    }
    outline(fc)
    ctx.drawImage(fc, f * 18, 0)
  }
  return c
}

// ── Gatos ──────────────────────────────────────────────────────
const CAT = [
  'k........k',
  'kk......kk',
  'kkkkkkkkkk',
  'kwekkkkwek',
  'kkkkppkkkk',
  '.kkkkkkkk.',
  '.kkkkkkkkt',
  '.kkkkkkkkt',
  '.kk....kk.'
]

export function makeCatSheet(color, eye = '#1a1020') {
  const [c, ctx] = makeCanvas(12 * 2, 11)
  for (let f = 0; f < 2; f++) {
    const [fc, fctx] = makeCanvas(12, 11)
    const rows =
      f === 0
        ? CAT
        : CAT.map((r, i) => (i === 6 ? '.kkkkkkkk.' : i === 5 ? '.kkkkkkkkt' : r))
    drawAscii(
      fctx,
      rows,
      { k: color, w: '#ffffff', e: eye, p: '#f28aa0', t: color },
      1,
      1
    )
    outline(fc, '#20142a')
    ctx.drawImage(fc, f * 12, 0)
  }
  return c
}

/** まよいネコ: gato grande roxo com olhos em espiral. */
export function makeMayoiSheet() {
  const [c, ctx] = makeCanvas(26 * 2, 22)
  for (let f = 0; f < 2; f++) {
    const [fc, fctx] = makeCanvas(12, 11)
    drawAscii(
      fctx,
      CAT,
      { k: '#8e5cf0', w: '#ffe14d', e: '#ff4dc4', p: '#ff9ad5', t: '#8e5cf0' },
      1,
      1
    )
    outline(fc, '#2a0f4a')
    ctx.drawImage(fc, f * 26 + 1, f === 1 ? 1 : 0, 24, 22)
  }
  return c
}

/** Retrato (data URL) para as caixas de diálogo. */
export function portraitURL(source, frameW, frameH, bg = '#ffe9c7') {
  const [c, ctx] = makeCanvas(48, 48)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 48, 48)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.arc(24, 30, 20, 0, Math.PI * 2)
  ctx.fill()
  const scale = Math.floor(Math.min(44 / frameW, 44 / frameH))
  const dw = frameW * scale
  const dh = frameH * scale
  // enquadra cabeça e ombros
  ctx.drawImage(
    source,
    0,
    0,
    frameW,
    frameH,
    (48 - dw) / 2,
    48 - dh + Math.floor(dh * 0.25),
    dw,
    dh
  )
  return c.toDataURL()
}
