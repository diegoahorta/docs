// Objetos desenhados por cima dos quadros ilustrados (para ações sem quadro próprio).
import { ell, paint } from './canvas.js'

export function onigiri(ctx, x, y, bite = 0) {
  const s = 1 - bite * 0.16
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.beginPath()
  ctx.moveTo(0, -13)
  ctx.quadraticCurveTo(4, -14, 13, 8)
  ctx.quadraticCurveTo(0, 12, -13, 8)
  ctx.quadraticCurveTo(-4, -14, 0, -13)
  paint(ctx, '#ffffff', '#7a5c48', 2.4)
  ctx.beginPath()
  ctx.rect(-6, 0, 12, 9)
  paint(ctx, '#2e4a3f')
  ctx.restore()
}

export function book(ctx, x, y, page = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.12)
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(-22, -2)
  ctx.lineTo(0, 4)
  ctx.lineTo(22, -2)
  ctx.lineTo(22, 19)
  ctx.lineTo(0, 25)
  ctx.lineTo(-22, 19)
  ctx.closePath()
  paint(ctx, '#e5484d', '#7a2a30', 2.6)
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(0, 2)
    ctx.lineTo(s * 20, -4)
    ctx.lineTo(s * 20, 15)
    ctx.lineTo(0, 21)
    ctx.closePath()
    paint(ctx, '#fffdf5', '#7a5c48', 2)
    ctx.strokeStyle = '#9fb3d1'
    ctx.lineWidth = 1.4
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(s * 4, 6 + i * 4)
      ctx.lineTo(s * 15, 2 + i * 4)
      ctx.stroke()
    }
  }
  if (page % 2) {
    ctx.beginPath()
    ctx.moveTo(0, 2)
    ctx.quadraticCurveTo(9, -11, 13, -7)
    ctx.lineTo(11, 12)
    ctx.quadraticCurveTo(6, 8, 0, 21)
    ctx.closePath()
    paint(ctx, '#ffffff', '#7a5c48', 1.8)
  }
  ctx.restore()
}

export function notebook(ctx, x, y, t = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(-20, 0)
  ctx.lineTo(18, 0)
  ctx.lineTo(25, -11)
  ctx.lineTo(-13, -11)
  ctx.closePath()
  paint(ctx, '#ffe8a3', '#7a5c48', 2.2)
  ctx.strokeStyle = '#5f8fd9'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(-9, -5)
  ctx.lineTo(-9 + 6 + t * 5, -5)
  ctx.stroke()
  const px = 6 + (t % 2) * 6
  ctx.translate(px, -12)
  ctx.rotate(0.6)
  ctx.beginPath()
  ctx.rect(-3, -24, 6, 22)
  paint(ctx, '#ffcf4a', '#7a5c48', 2)
  ctx.beginPath()
  ctx.moveTo(-3, -2)
  ctx.lineTo(0, 5)
  ctx.lineTo(3, -2)
  ctx.closePath()
  paint(ctx, '#f6d7b0', '#7a5c48', 1.6)
  ell(ctx, 0, -25, 3, 2)
  paint(ctx, '#ff8fa3')
  ctx.restore()
}

export function drops(ctx, x, y, t = 0) {
  for (let i = 0; i < 3; i++) {
    const dy = (t * 6 + i * 8) % 22
    ell(ctx, x - i * 4, y + dy, 2.8, 3.8)
    paint(ctx, '#7fd0ff', '#2f7fc0', 1.3)
  }
  ctx.save()
  ctx.strokeStyle = '#7fd0ff'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + 26, y - 18)
  ctx.quadraticCurveTo(x + 14, y - 30, x + 2, y - 4)
  ctx.stroke()
  ctx.restore()
}
