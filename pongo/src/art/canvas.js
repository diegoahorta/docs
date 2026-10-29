// Utilitários de desenho em Canvas 2D para a arte procedural.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(w)
  c.height = Math.ceil(h)
  return c
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  const t = amt < 0 ? 0 : 255
  const p = Math.abs(amt)
  r = Math.round((t - r) * p + r)
  g = Math.round((t - g) * p + g)
  b = Math.round((t - b) * p + b)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

export function ell(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2)
}

/** Preenche e contorna o caminho atual (contorno suave, nunca preto puro). */
export function paint(ctx, fill, stroke, lw = 3) {
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke && lw > 0) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lw
    ctx.stroke()
  }
}

/** Linha "cápsula" com contorno: ótima para pernas, canos, correntes. */
export function capsule(ctx, x1, y1, x2, y2, w, fill, stroke, lw = 3) {
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = w + lw * 2
    ctx.stroke()
  }
  ctx.strokeStyle = fill
  ctx.lineWidth = w
  ctx.stroke()
}

export function star(ctx, x, y, r, points = 5, inner = 0.45) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r * inner : r
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad)
  }
  ctx.closePath()
}

/** Gerador pseudoaleatório determinístico (arte idêntica a cada execução). */
export function rng(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const FONT =
  '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif'
