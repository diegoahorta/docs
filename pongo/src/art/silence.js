// Professor Silêncio: uma coruja-professora original, cinzenta e sonolenta.
// Não é um inimigo de combate: o desafio final é linguístico.
import { ell, paint, shade, star } from './canvas.js'

const GRAY = {
  body: '#b9b5cc',
  line: '#7f7a99',
  belly: '#e4e1ee',
  wing: '#a19cb8',
  hat: '#4b4566',
  beak: '#f2c46b'
}
const COLOR = {
  body: '#b9a6f0',
  line: '#7a62c9',
  belly: '#fff1c9',
  wing: '#8fc9f0',
  hat: '#4b4566',
  beak: '#ffb347'
}

export function drawSilence(
  ctx,
  { bob = 0, shh = false, happy = false, sparkle = 0 } = {}
) {
  const C = happy ? COLOR : GRAY
  ctx.save()
  ctx.translate(0, bob)
  ctx.lineJoin = 'round'
  // sombra flutuante
  ctx.save()
  ctx.globalAlpha = 0.18
  ell(ctx, 0, 6 - bob, 34, 7)
  paint(ctx, '#4b4566')
  ctx.restore()
  // corpo
  ell(ctx, 0, -60, 46, 56)
  paint(ctx, C.body, C.line, 4)
  ell(ctx, 0, -46, 30, 36)
  paint(ctx, C.belly)
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(-10 + i * 10, -40 + (i % 2) * 8, 5, 0.1 * Math.PI, 0.9 * Math.PI)
    ctx.strokeStyle = shade(C.belly, -0.18)
    ctx.lineWidth = 2
    ctx.stroke()
  }
  // asas
  ctx.save()
  ctx.translate(-42, -58)
  ctx.rotate(0.3)
  ell(ctx, 0, 0, 12, 28)
  paint(ctx, C.wing, C.line, 3)
  ctx.restore()
  ctx.save()
  if (shh) {
    ctx.translate(22, -88)
    ctx.rotate(-0.9)
  } else {
    ctx.translate(42, -58)
    ctx.rotate(-0.3)
  }
  ell(ctx, 0, 0, 12, 28)
  paint(ctx, C.wing, C.line, 3)
  ctx.restore()
  // olhos
  for (const s of [-1, 1]) {
    ell(ctx, s * 18, -86, 16, 16)
    paint(ctx, '#ffffff', C.line, 3)
    if (happy) {
      ctx.beginPath()
      ctx.arc(s * 18, -82, 8, Math.PI * 1.15, Math.PI * 1.85)
      ctx.strokeStyle = '#3a3150'
      ctx.lineWidth = 3.5
      ctx.stroke()
    } else {
      ell(ctx, s * 18, -83, 7, 7)
      paint(ctx, '#3a3150')
      ctx.beginPath()
      ctx.moveTo(s * 18 - 16, -92)
      ctx.lineTo(s * 18 + 16, -88)
      ctx.lineTo(s * 18 + 16, -103)
      ctx.lineTo(s * 18 - 16, -103)
      ctx.closePath()
      paint(ctx, C.body)
      ctx.beginPath()
      ctx.moveTo(s * 18 - 15, -92)
      ctx.lineTo(s * 18 + 15, -88)
      ctx.strokeStyle = C.line
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }
  // monóculo
  ell(ctx, 18, -86, 18, 18)
  ctx.strokeStyle = '#d4a63a'
  ctx.lineWidth = 2.5
  ctx.stroke()
  // bico
  ctx.beginPath()
  ctx.moveTo(-7, -72)
  ctx.lineTo(7, -72)
  ctx.lineTo(0, -60)
  ctx.closePath()
  paint(ctx, C.beak, shade(C.beak, -0.3), 2.5)
  // capelo (chapéu de formatura)
  ctx.beginPath()
  ctx.moveTo(-40, -112)
  ctx.lineTo(0, -128)
  ctx.lineTo(40, -112)
  ctx.lineTo(0, -98)
  ctx.closePath()
  paint(ctx, C.hat, shade(C.hat, -0.3), 3)
  ctx.beginPath()
  ctx.moveTo(-22, -110)
  ctx.lineTo(-22, -100)
  ctx.quadraticCurveTo(0, -90, 22, -100)
  ctx.lineTo(22, -110)
  paint(ctx, shade(C.hat, -0.1), shade(C.hat, -0.3), 3)
  ctx.beginPath()
  ctx.moveTo(0, -114)
  ctx.quadraticCurveTo(30, -112, 34, -92)
  ctx.strokeStyle = '#ffd35c'
  ctx.lineWidth = 3
  ctx.stroke()
  ell(ctx, 34, -90, 4, 5)
  paint(ctx, '#ffd35c')
  // "しー" de silêncio
  if (shh && !happy) {
    ctx.fillStyle = '#7f7a99'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('…', 48, -112)
  }
  if (happy) {
    ;[
      [-56, -120],
      [58, -130],
      [-64, -40],
      [62, -30]
    ].forEach(([x, y], i) => {
      if ((i + sparkle) % 2) return
      star(ctx, x, y, 9, 4, 0.4)
      paint(ctx, ['#ffd35c', '#ff9fd0', '#8fe3ff'][i % 3])
    })
  }
  ctx.restore()
}

export const SILENCE_ANIMS = {
  float: {
    fps: 5,
    repeat: -1,
    poses: [0, 1, 2, 3].map((i) => ({ bob: -4 * Math.sin((i / 4) * Math.PI * 2) }))
  },
  shh: { fps: 4, repeat: -1, poses: [0, 1].map((i) => ({ bob: -2 * i, shh: true })) },
  happy: {
    fps: 6,
    repeat: -1,
    poses: [0, 1, 2, 3].map((i) => ({
      bob: -6 * Math.sin((i / 4) * Math.PI * 2),
      happy: true,
      sparkle: i
    }))
  }
}
