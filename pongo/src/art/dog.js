// Personagens caninos originais desenhados proceduralmente (vista lateral, olhando à direita).
// Coordenadas locais: origem no chão, entre as patas; y negativo = para cima.
import { ell, paint, shade, capsule, star } from './canvas.js'

export const PONGO_LOOK = {
  body: '#fff3df',
  line: '#d9a677',
  patch: '#ec9548',
  patchLine: '#c46d2b',
  innerEar: '#f7a9b9',
  muzzle: '#fffaf2',
  nose: '#3b2b2e',
  eye: '#2a2238',
  tongue: '#ff8ea6',
  mouth: '#8a3b45',
  blush: '#ff9fb0',
  vest: {
    color: '#72cdbd',
    line: '#3f9d93',
    trim: '#2f4f6b',
    spots: ['#4a95c8', '#a8e6a3', '#2f8f8f', '#7fc8e8']
  },
  collar: '#2f3e6b',
  tag: '#ffd35c',
  ears: 'pongo',
  tail: 'pongo',
  accessory: null,
  backPatch: true
}

export const NPC_LOOKS = {
  taro: {
    body: '#f2a560',
    line: '#c4773b',
    patch: '#f2a560',
    patchLine: '#c4773b',
    muzzle: '#fff4e4',
    innerEar: '#ffd9b8',
    vest: null,
    collar: '#e5484d',
    tag: '#ffe17a',
    ears: 'pointy',
    tail: 'curl',
    accessory: 'cap',
    backPatch: false,
    chest: '#fff4e4'
  },
  momo: {
    body: '#fff7fb',
    line: '#e0aac3',
    patch: '#f9cfe0',
    patchLine: '#dd9fbb',
    muzzle: '#ffffff',
    innerEar: '#f9cfe0',
    vest: null,
    collar: '#ff7aa8',
    tag: '#fff07a',
    ears: 'round',
    tail: 'pom',
    accessory: 'bow',
    backPatch: false
  },
  kumi: {
    body: '#d9dce6',
    line: '#9aa1b6',
    patch: '#a9b0c4',
    patchLine: '#80889f',
    muzzle: '#f4f5f9',
    innerEar: '#c5cad8',
    vest: null,
    collar: '#8e6bd1',
    tag: '#ffd35c',
    ears: 'long',
    tail: 'pongo',
    accessory: 'glasses',
    scarf: '#9b7be0',
    backPatch: false
  }
}

const POSE = {
  mode: 'stand',
  dx: 0,
  bodyY: 0,
  rot: 0,
  sx: 1,
  sy: 1,
  legs: [0, 0, 0, 0],
  legLen: [1, 1, 1, 1],
  headRot: 0,
  headDX: 0,
  headDY: 0,
  mouth: 'smile',
  eyes: 'open',
  pupil: 0,
  tail: 0,
  ear: 0,
  prop: null,
  propT: 0
}

const LEG = 36

const rot = (x, y, a) => [
  x * Math.cos(a) - y * Math.sin(a),
  x * Math.sin(a) + y * Math.cos(a)
]

function legFrom(hip, a, len) {
  return {
    hip,
    foot: [hip[0] + LEG * len * Math.sin(a), hip[1] + LEG * len * Math.cos(a)]
  }
}

function skeleton(p) {
  if (p.mode === 'sit') {
    const B = { x: -4, y: -46, rx: 30, ry: 20, rot: -0.75 }
    const [sx, sy] = rot(18, 6, B.rot)
    const sh = [B.x + sx, B.y + sy]
    const [nx, ny] = rot(22, -8, B.rot)
    const neck = [B.x + nx, B.y + ny]
    return {
      B,
      far: [{ hip: [sh[0] + 6, sh[1]], foot: [sh[0] + 9, -6] }],
      near: [{ hip: sh, foot: [sh[0] + 3, -6] }],
      haunch: { x: -16, y: -21, rx: 19, ry: 16, foot: [2, -5] },
      neck,
      head: [neck[0] + 8 + p.headDX, neck[1] - 16 + p.headDY],
      tail: [-30, -16],
      tailBase: 2.1
    }
  }
  if (p.mode === 'lie') {
    const B = { x: -2, y: -24, rx: 36, ry: 17, rot: 0 }
    return {
      B,
      far: [{ hip: [20, -18], foot: [48, -8] }],
      near: [{ hip: [16, -15], foot: [42, -6] }],
      haunch: { x: -18, y: -18, rx: 17, ry: 12, foot: [-2, -6] },
      neck: [22, -32],
      head: [36 + p.headDX, -34 + p.headDY],
      tail: [-36, -26],
      tailBase: 2.3
    }
  }
  const B = { x: 0, y: -50, rx: 34, ry: 21, rot: 0 }
  const L = p.legs
  const n = p.legLen
  return {
    B,
    far: [legFrom([-15, -42], L[0], n[0]), legFrom([25, -42], L[1], n[1])],
    near: [legFrom([-20, -42], L[2], n[2]), legFrom([20, -42], L[3], n[3])],
    neck: [24, -62],
    head: [34 + p.headDX, -78 + p.headDY],
    tail: [-32, -56],
    tailBase: 0
  }
}

/** Contorno de união: contorna todas as formas e depois preenche (sem linhas internas). */
function blob(ctx, shapes, fill, line, lw = 3.5) {
  ctx.strokeStyle = line
  ctx.lineWidth = lw * 2
  for (const s of shapes) {
    ell(ctx, ...s)
    ctx.stroke()
  }
  ctx.fillStyle = fill
  for (const s of shapes) {
    ell(ctx, ...s)
    ctx.fill()
  }
}

function clipShapes(ctx, shapes) {
  ctx.beginPath()
  for (const s of shapes) {
    ctx.moveTo(s[0] + s[2], s[1])
    ctx.ellipse(s[0], s[1], s[2], s[3], s[4] ?? 0, 0, Math.PI * 2)
  }
  ctx.clip()
}

function drawLeg(ctx, leg, fill, line, w = 13) {
  capsule(ctx, leg.hip[0], leg.hip[1], leg.foot[0], leg.foot[1], w, fill, line, 3)
  ell(ctx, leg.foot[0] + 3, leg.foot[1] + 1, 8.5, 5.8)
  paint(ctx, fill, line, 2.6)
}

function drawTail(ctx, sk, p, L) {
  const [x, y] = sk.tail
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(sk.tailBase + p.tail)
  ctx.lineCap = 'round'
  if (L.tail === 'curl') {
    ctx.beginPath()
    ctx.arc(-8, -10, 10, Math.PI * 0.3, Math.PI * 2.1)
    ctx.strokeStyle = L.line
    ctx.lineWidth = 15
    ctx.stroke()
    ctx.strokeStyle = L.body
    ctx.lineWidth = 9
    ctx.stroke()
    ctx.strokeStyle = L.chest ?? L.muzzle
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(-8, -10, 10, Math.PI * 1.2, Math.PI * 1.8)
    ctx.stroke()
  } else if (L.tail === 'pom') {
    capsule(ctx, 0, 0, -10, -20, 5, L.body, L.line, 2.5)
    for (const [dx, dy] of [
      [-12, -26],
      [-6, -30],
      [-16, -32],
      [-10, -36]
    ]) {
      ell(ctx, dx, dy, 8, 8)
      paint(ctx, L.body, L.line, 2.5)
    }
    for (const [dx, dy] of [
      [-12, -26],
      [-6, -30],
      [-16, -32]
    ]) {
      ell(ctx, dx, dy, 6.5, 6.5)
      paint(ctx, L.body)
    }
  } else {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(-18, -6, -20, -30)
    ctx.strokeStyle = L.line
    ctx.lineWidth = 14
    ctx.stroke()
    ctx.strokeStyle = L.body
    ctx.lineWidth = 8.5
    ctx.stroke()
    if (L.tail === 'pongo') {
      ctx.beginPath()
      ctx.moveTo(-17, -18)
      ctx.quadraticCurveTo(-20, -24, -20, -30)
      ctx.strokeStyle = L.patch
      ctx.lineWidth = 8.5
      ctx.stroke()
    }
  }
  ctx.restore()
}

function bodyShapes(B) {
  return [
    [0, 0, B.rx, B.ry, 0],
    [B.rx * 0.58, -4, 15, 18, 0],
    [-B.rx * 0.6, 2, 15, 15, 0]
  ]
}

function drawBody(ctx, sk, L, mode) {
  const B = sk.B
  ctx.save()
  ctx.translate(B.x, B.y)
  ctx.rotate(B.rot)
  const shapes = bodyShapes(B)
  blob(ctx, shapes, L.body, L.line)
  ctx.save()
  clipShapes(ctx, shapes)
  if (L.chest) {
    ell(ctx, B.rx * 0.65, 8, 16, 14)
    paint(ctx, L.chest)
  }
  if (L.backPatch) {
    ell(ctx, -B.rx * 0.45, -B.ry * 0.7, 10, 7, 0.2)
    paint(ctx, L.patch)
  }
  if (L.vest) {
    const v = L.vest
    ctx.beginPath()
    ctx.moveTo(-B.rx * 0.32, -B.ry - 30)
    ctx.quadraticCurveTo(-B.rx * 0.42, 0, -B.rx * 0.3, B.ry + 30)
    ctx.lineTo(B.rx + 40, B.ry + 30)
    ctx.lineTo(B.rx + 40, -B.ry - 30)
    ctx.closePath()
    ctx.fillStyle = v.color
    ctx.fill()
    const spots = [
      [-4, -10, 6, 4.5],
      [10, 4, 7, 5],
      [22, -12, 5, 4],
      [-6, 10, 5, 4],
      [30, 6, 6, 5],
      [14, -18, 4, 3],
      [4, -2, 3.5, 3],
      [24, 16, 4, 3]
    ]
    spots.forEach(([x, y, rx, ry], i) => {
      ell(ctx, x, y, rx, ry, i * 0.7)
      paint(ctx, v.spots[i % v.spots.length])
    })
    ctx.beginPath()
    ctx.moveTo(-B.rx * 0.32, -B.ry - 30)
    ctx.quadraticCurveTo(-B.rx * 0.42, 0, -B.rx * 0.3, B.ry + 30)
    ctx.strokeStyle = v.line
    ctx.lineWidth = 3
    ctx.stroke()
  }
  ctx.restore()
  ctx.restore()
  if (L.vest && mode !== 'lie') {
    // punho da manga sobre o ombro dianteiro
    const sh = sk.near[sk.near.length - 1].hip
    ell(ctx, sh[0] + 1, sh[1] + 6, 9, 6.5)
    paint(ctx, L.vest.trim, shade(L.vest.trim, -0.2), 2)
  }
}

function drawHaunch(ctx, h, fill, line) {
  ell(ctx, h.foot[0] + 4, h.foot[1], 11, 6)
  paint(ctx, fill, line, 2.6)
  ell(ctx, h.x, h.y, h.rx, h.ry, -0.2)
  paint(ctx, fill, line, 3.2)
}

function drawCollar(ctx, sk, L) {
  const [x, y] = sk.neck
  if (L.scarf) {
    ell(ctx, x, y + 2, 9, 15, -0.45)
    paint(ctx, L.scarf, shade(L.scarf, -0.3), 2.5)
    capsule(ctx, x - 2, y + 10, x - 8, y + 26, 7, L.scarf, shade(L.scarf, -0.3), 2)
    return
  }
  ell(ctx, x, y, 6.5, 14, -0.5)
  paint(ctx, L.collar, shade(L.collar, -0.3), 2)
  ell(ctx, x + 6, y + 11, 4.2, 4.2)
  paint(ctx, L.tag, shade(L.tag, -0.35), 1.8)
}

function earPath(ctx, kind) {
  ctx.beginPath()
  if (kind === 'erect') {
    ctx.moveTo(-15, -10)
    ctx.quadraticCurveTo(-26, -38, -16, -54)
    ctx.quadraticCurveTo(-2, -40, 4, -18)
    ctx.closePath()
  } else if (kind === 'erectInner') {
    ctx.moveTo(-11, -16)
    ctx.quadraticCurveTo(-19, -36, -15, -46)
    ctx.quadraticCurveTo(-5, -36, -1, -20)
    ctx.closePath()
  } else if (kind === 'flop') {
    ctx.moveTo(-8, -18)
    ctx.quadraticCurveTo(2, -42, 20, -32)
    ctx.quadraticCurveTo(25, -24, 15, -17)
    ctx.quadraticCurveTo(4, -12, -4, -10)
    ctx.closePath()
  }
}

function drawEars(ctx, p, L, layer) {
  const e = p.ear
  if (L.ears === 'pongo') {
    if (layer === 'back') {
      ctx.save()
      ctx.translate(-6, -16)
      ctx.rotate(-e * 0.6)
      ctx.translate(6, 16)
      earPath(ctx, 'erect')
      paint(ctx, L.patch, L.patchLine, 3)
      earPath(ctx, 'erectInner')
      paint(ctx, L.innerEar)
      ctx.restore()
    } else {
      ctx.save()
      ctx.translate(-4, -16)
      ctx.rotate(e)
      ctx.translate(4, 16)
      earPath(ctx, 'flop')
      paint(ctx, L.patch, L.patchLine, 3)
      ctx.restore()
    }
  } else if (L.ears === 'pointy') {
    const tri = (ox, s) => {
      ctx.beginPath()
      ctx.moveTo(ox - 11 * s, -14)
      ctx.quadraticCurveTo(ox - 6 * s, -42, ox + 2, -46)
      ctx.quadraticCurveTo(ox + 10, -30, ox + 11, -14)
      ctx.closePath()
    }
    ctx.save()
    ctx.translate(0, -16)
    ctx.rotate(-e * 0.4)
    ctx.translate(0, 16)
    if (layer === 'back') {
      tri(-12, 1)
      paint(ctx, shade(L.body, -0.08), L.line, 3)
    } else {
      tri(4, 1)
      paint(ctx, L.body, L.line, 3)
      ctx.beginPath()
      ctx.moveTo(-1, -18)
      ctx.quadraticCurveTo(2, -34, 6, -38)
      ctx.quadraticCurveTo(10, -28, 10, -18)
      ctx.closePath()
      paint(ctx, L.innerEar)
    }
    ctx.restore()
  } else if (L.ears === 'long') {
    ctx.save()
    ctx.translate(-6, -14)
    ctx.rotate(e * 0.5)
    if (layer === 'back') {
      ell(ctx, -8, 20, 11, 24, 0.25)
      paint(ctx, shade(L.patch, -0.1), L.patchLine, 3)
    } else {
      ell(ctx, 0, 22, 12, 26, 0.12)
      paint(ctx, L.patch, L.patchLine, 3)
    }
    ctx.restore()
  } else if (L.ears === 'round') {
    if (layer === 'back') {
      for (const [x, y] of [
        [-14, -22],
        [-4, -27],
        [6, -24]
      ]) {
        ell(ctx, x, y, 11, 11)
        paint(ctx, L.body, L.line, 3)
      }
    } else {
      ctx.save()
      ctx.translate(-6, -6)
      ctx.rotate(e * 0.5)
      for (const [x, y] of [
        [-4, 4],
        [-8, 16],
        [0, 22]
      ]) {
        ell(ctx, x, y, 10, 10)
        paint(ctx, L.patch, L.patchLine, 2.5)
      }
      for (const [x, y] of [
        [-4, 4],
        [-8, 16],
        [0, 22]
      ]) {
        ell(ctx, x, y, 8, 8)
        paint(ctx, L.patch)
      }
      ctx.restore()
    }
  }
}

function drawEye(ctx, p, L) {
  ctx.save()
  ctx.translate(11 + p.pupil, -3)
  ctx.lineCap = 'round'
  ctx.strokeStyle = L.eye
  ctx.lineWidth = 2.8
  switch (p.eyes) {
    case 'closed':
      ctx.beginPath()
      ctx.arc(0, -2, 5, Math.PI * 0.15, Math.PI * 0.85)
      ctx.stroke()
      break
    case 'happy':
      ctx.beginPath()
      ctx.arc(0, 3, 5.5, Math.PI * 1.15, Math.PI * 1.85)
      ctx.stroke()
      break
    case 'wide':
      ell(ctx, 0, 0, 7, 8.2)
      paint(ctx, '#ffffff', L.eye, 2)
      ell(ctx, 1.5, 0.5, 4, 5)
      paint(ctx, L.eye)
      ell(ctx, 2.8, -1.8, 1.6, 1.6)
      paint(ctx, '#ffffff')
      break
    case 'half':
      ctx.beginPath()
      ctx.ellipse(0, 1, 4.8, 5, 0, 0, Math.PI)
      paint(ctx, L.eye)
      ctx.beginPath()
      ctx.moveTo(-6, 0.5)
      ctx.lineTo(6, 0.5)
      ctx.stroke()
      break
    default:
      ell(ctx, 0, 0, 4.8, 6.4)
      paint(ctx, L.eye)
      ell(ctx, 1.5, -2.4, 1.9, 1.9)
      paint(ctx, '#ffffff')
      ell(ctx, -1.6, 2.6, 0.9, 0.9)
      paint(ctx, '#ffffff')
  }
  ctx.restore()
  // sobrancelha
  ctx.strokeStyle = shade(L.patchLine, -0.1)
  ctx.lineWidth = 2.2
  ctx.beginPath()
  const lift = p.eyes === 'wide' ? -4 : 0
  ctx.moveTo(6 + p.pupil, -13 + lift)
  ctx.quadraticCurveTo(11 + p.pupil, -16 + lift, 16 + p.pupil, -13 + lift)
  ctx.stroke()
}

function drawMouth(ctx, p, L) {
  ctx.strokeStyle = L.mouth
  ctx.lineWidth = 2.3
  ctx.lineCap = 'round'
  const smile = () => {
    ctx.beginPath()
    ctx.moveTo(33, 6)
    ctx.lineTo(33, 9)
    ctx.quadraticCurveTo(29, 14.5, 23, 10.5)
    ctx.stroke()
  }
  switch (p.mouth) {
    case 'open':
    case 'chomp': {
      const big = p.mouth === 'open' ? 1 : 0.6
      ctx.beginPath()
      ctx.moveTo(33, 7)
      ctx.quadraticCurveTo(31, 9 + 14 * big, 21, 10 + 3 * big)
      ctx.quadraticCurveTo(26, 9, 33, 7)
      paint(ctx, L.mouth, L.mouth, 1.5)
      ell(ctx, 26, 11 + 5 * big, 4.8, 3.2 * big + 1)
      paint(ctx, L.tongue)
      break
    }
    case 'tongue':
      ell(ctx, 28, 15, 4, 6.5, -0.2)
      paint(ctx, L.tongue, shade(L.tongue, -0.3), 1.6)
      smile()
      break
    case 'o':
      ell(ctx, 28, 12, 3.6, 4.4)
      paint(ctx, L.mouth)
      break
    case 'flat':
      ctx.beginPath()
      ctx.moveTo(33, 8)
      ctx.lineTo(24, 11)
      ctx.stroke()
      break
    default:
      smile()
  }
}

function drawAccessory(ctx, L) {
  if (L.accessory === 'cap') {
    ctx.beginPath()
    ctx.moveTo(-22, -12)
    ctx.quadraticCurveTo(-18, -34, 2, -32)
    ctx.quadraticCurveTo(20, -30, 22, -14)
    ctx.closePath()
    paint(ctx, '#e5484d', '#a92f39', 3)
    ctx.beginPath()
    ctx.moveTo(14, -16)
    ctx.quadraticCurveTo(30, -18, 38, -12)
    ctx.quadraticCurveTo(28, -8, 14, -11)
    ctx.closePath()
    paint(ctx, '#ffffff', '#a92f39', 2.5)
    ell(ctx, 0, -32, 3.5, 2.5)
    paint(ctx, '#ffffff')
  } else if (L.accessory === 'bow') {
    ctx.save()
    ctx.translate(-4, -30)
    ctx.rotate(-0.25)
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(s * 14, -12, s * 16, 0)
      ctx.quadraticCurveTo(s * 14, 12, 0, 0)
      paint(ctx, '#ff7aa8', '#d4467b', 2.5)
    }
    ell(ctx, 0, 0, 4.5, 4.5)
    paint(ctx, '#ff9cc0', '#d4467b', 2)
    ctx.restore()
  } else if (L.accessory === 'glasses') {
    ctx.lineWidth = 2.6
    ctx.strokeStyle = '#5b4a8a'
    ell(ctx, 11, -3, 8.5, 8.5)
    ctx.fillStyle = 'rgba(220,235,255,0.35)'
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(2.5, -4)
    ctx.lineTo(-10, -8)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(19.5, -3)
    ctx.lineTo(24, -1)
    ctx.stroke()
  }
}

function drawHead(ctx, sk, p, L) {
  const [nx, ny] = sk.neck
  const [hx, hy] = sk.head
  ctx.save()
  ctx.translate(nx, ny)
  ctx.rotate(p.headRot + (p.mode === 'lie' ? 0.15 : 0))
  ctx.translate(hx - nx, hy - ny)

  drawEars(ctx, p, L, 'back')
  const shapes = [
    [0, 0, 25, 23, 0],
    [8, 8, 20, 15, 0],
    [21, 6, 15, 11, 0]
  ]
  blob(ctx, shapes, L.body, L.line)
  ctx.save()
  clipShapes(ctx, shapes)
  if (L.ears === 'pongo') {
    ell(ctx, -9, -10, 19, 17, 0.2)
    paint(ctx, L.patch)
  }
  ell(ctx, 22, 8, 14, 10)
  paint(ctx, L.muzzle)
  ctx.restore()
  ell(ctx, 13, 9, 6, 3.6)
  ctx.globalAlpha = 0.5
  paint(ctx, L.blush)
  ctx.globalAlpha = 1
  drawEye(ctx, p, L)
  // nariz
  ell(ctx, 34, 2, 6.2, 4.6)
  paint(ctx, L.nose)
  ell(ctx, 32.2, 0.4, 2.1, 1.2)
  paint(ctx, '#ffffff')
  drawMouth(ctx, p, L)
  drawEars(ctx, p, L, 'front')
  drawAccessory(ctx, L)
  ctx.restore()
}

function drawProp(ctx, sk, p) {
  const t = p.propT
  switch (p.prop) {
    case 'book': {
      ctx.save()
      ctx.translate(30, -46)
      ctx.rotate(-0.15)
      ctx.beginPath()
      ctx.moveTo(-20, -2)
      ctx.lineTo(0, 4)
      ctx.lineTo(20, -2)
      ctx.lineTo(20, 18)
      ctx.lineTo(0, 24)
      ctx.lineTo(-20, 18)
      ctx.closePath()
      paint(ctx, '#e5484d', '#a92f39', 2.5)
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(0, 2)
        ctx.lineTo(s * 18, -4)
        ctx.lineTo(s * 18, 14)
        ctx.lineTo(0, 20)
        ctx.closePath()
        paint(ctx, '#fffdf5', '#c9b99a', 1.8)
        ctx.strokeStyle = '#b8c4d8'
        ctx.lineWidth = 1.4
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.moveTo(s * 4, 6 + i * 4)
          ctx.lineTo(s * 14, 2 + i * 4)
          ctx.stroke()
        }
      }
      if (t % 2 === 1) {
        ctx.beginPath()
        ctx.moveTo(0, 2)
        ctx.quadraticCurveTo(8, -10, 12, -6)
        ctx.lineTo(10, 12)
        ctx.quadraticCurveTo(6, 8, 0, 20)
        ctx.closePath()
        paint(ctx, '#ffffff', '#c9b99a', 1.6)
      }
      ctx.restore()
      // patinhas segurando
      ell(ctx, 16, -36, 7, 5.5)
      paint(ctx, PONGO_LOOK.body, PONGO_LOOK.line, 2.4)
      ell(ctx, 44, -40, 7, 5.5)
      paint(ctx, PONGO_LOOK.body, PONGO_LOOK.line, 2.4)
      break
    }
    case 'pencil': {
      ctx.save()
      ctx.translate(34, -6)
      ctx.beginPath()
      ctx.moveTo(-18, 0)
      ctx.lineTo(18, 0)
      ctx.lineTo(24, -10)
      ctx.lineTo(-12, -10)
      ctx.closePath()
      paint(ctx, '#ffe8a3', '#c9a24e', 2.2)
      ctx.strokeStyle = '#7fa6d9'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-8, -4)
      ctx.lineTo(-8 + 6 + t * 4, -4)
      ctx.stroke()
      ctx.restore()
      const px = 22 + (t % 2) * 5
      ctx.save()
      ctx.translate(px, -14)
      ctx.rotate(0.6)
      ctx.fillStyle = '#ffcf4a'
      ctx.strokeStyle = '#b8862a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.rect(-3, -22, 6, 20)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-3, -2)
      ctx.lineTo(0, 5)
      ctx.lineTo(3, -2)
      ctx.closePath()
      paint(ctx, '#f6d7b0', '#b8862a', 1.6)
      ell(ctx, 0, -23, 3, 2)
      paint(ctx, '#ff8fa3')
      ctx.restore()
      break
    }
    case 'onigiri': {
      const s = 1 - t * 0.18
      ctx.save()
      ctx.translate(sk.head[0] + 22, sk.head[1] + 30)
      ctx.scale(s, s)
      ctx.beginPath()
      ctx.moveTo(0, -14)
      ctx.quadraticCurveTo(4, -15, 14, 8)
      ctx.quadraticCurveTo(0, 13, -14, 8)
      ctx.quadraticCurveTo(-4, -15, 0, -14)
      paint(ctx, '#ffffff', '#c9c3b3', 2.4)
      ctx.beginPath()
      ctx.rect(-7, 0, 14, 10)
      paint(ctx, '#2e4a3f')
      ctx.restore()
      break
    }
    case 'zzz': {
      ctx.save()
      ctx.fillStyle = '#7b8fd6'
      ctx.font = 'bold 16px sans-serif'
      for (let i = 0; i < 3; i++) {
        const k = (t + i) % 4
        ctx.globalAlpha = 1 - k * 0.22
        ctx.font = `bold ${12 + k * 3}px sans-serif`
        ctx.fillText('Z', 48 + k * 8, -60 - k * 12)
      }
      ctx.restore()
      break
    }
    case 'drops': {
      for (let i = 0; i < 3; i++) {
        const y = ((t * 5 + i * 7) % 18) - 30
        ell(ctx, 62 - i * 4, y, 2.6, 3.6)
        paint(ctx, '#7fd0ff', '#4aa8e0', 1.2)
      }
      break
    }
    case 'sparkles': {
      const pts = [
        [-50, -110],
        [56, -120],
        [-30, -140],
        [70, -80],
        [0, -150],
        [-62, -70]
      ]
      pts.forEach(([x, y], i) => {
        if ((i + t) % 2) return
        star(ctx, x, y, 7 + (i % 3) * 2, 4, 0.4)
        paint(ctx, ['#ffd35c', '#ff9fd0', '#8fe3ff'][i % 3])
      })
      break
    }
  }
}

export function drawDog(ctx, pose = {}, look = PONGO_LOOK) {
  const p = { ...POSE, ...pose }
  const L = { ...PONGO_LOOK, ...look }
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.scale(p.sx, p.sy)
  ctx.translate(p.dx, p.bodyY)
  ctx.rotate(p.rot)
  const sk = skeleton(p)
  const farFill = shade(L.body, -0.12)
  const farLine = shade(L.line, -0.1)
  drawTail(ctx, sk, p, L)
  for (const leg of sk.far) drawLeg(ctx, leg, farFill, farLine, 12)
  if (sk.haunch)
    drawHaunch(
      ctx,
      {
        ...sk.haunch,
        x: sk.haunch.x + 5,
        foot: [sk.haunch.foot[0] + 6, sk.haunch.foot[1]]
      },
      farFill,
      farLine
    )
  for (const leg of sk.near) drawLeg(ctx, leg, L.body, L.line)
  drawBody(ctx, sk, L, p.mode)
  if (sk.haunch) drawHaunch(ctx, sk.haunch, L.body, L.line)
  drawCollar(ctx, sk, L)
  drawHead(ctx, sk, p, L)
  drawProp(ctx, sk, p, L)
  ctx.restore()
}

// ------------------------------------------------------------------
// Animações (sequências de poses). Cada animação tem um verbo associado.
// ------------------------------------------------------------------
const TAU = Math.PI * 2
const seq = (n, fn) => Array.from({ length: n }, (_, i) => fn(i / n, i))

export const PONGO_ANIMS = {
  idle: {
    fps: 6,
    repeat: -1,
    poses: seq(6, (t, i) => ({
      sy: 1 + 0.02 * Math.sin(t * TAU),
      sx: 1 - 0.012 * Math.sin(t * TAU),
      tail: 0.35 * Math.sin(t * TAU * 2),
      ear: 0.06 * Math.sin(t * TAU),
      eyes: i === 4 ? 'closed' : 'open',
      mouth: i < 3 ? 'tongue' : 'smile'
    }))
  },
  walk: {
    fps: 12,
    repeat: -1,
    poses: seq(8, (t) => {
      const a = Math.sin(t * TAU) * 0.42
      return {
        legs: [a, -a, -a, a],
        bodyY: -Math.abs(Math.cos(t * TAU)) * 2.5,
        tail: 0.25 * Math.sin(t * TAU * 2),
        ear: 0.12 * Math.sin(t * TAU),
        mouth: 'smile'
      }
    })
  },
  run: {
    fps: 16,
    repeat: -1,
    poses: seq(8, (t) => {
      const s = Math.sin(t * TAU)
      return {
        legs: [0.85 * s, -0.85 * s, 0.75 * s + 0.1, -0.75 * s - 0.1],
        rot: -0.06 * s,
        bodyY: -6 * (1 + Math.cos(t * TAU)) * 0.5,
        sx: 1 - 0.05 * s,
        sy: 1 + 0.04 * s,
        ear: -0.35 + 0.12 * Math.sin(t * TAU),
        tail: -0.3 + 0.2 * s,
        mouth: 'open'
      }
    })
  },
  jump: {
    fps: 10,
    repeat: 0,
    poses: [
      {
        sy: 1.1,
        sx: 0.93,
        rot: -0.18,
        legs: [-0.9, -0.5, -1.0, -0.6],
        mouth: 'open',
        ear: -0.3
      },
      {
        rot: -0.1,
        legs: [0.4, -0.7, 0.5, -0.8],
        legLen: [0.75, 0.8, 0.75, 0.8],
        mouth: 'open',
        ear: -0.2
      }
    ]
  },
  fall: {
    fps: 8,
    repeat: -1,
    poses: [
      { rot: 0.14, legs: [-0.5, 0.7, -0.6, 0.8], eyes: 'wide', mouth: 'o', ear: 0.45 },
      { rot: 0.12, legs: [-0.6, 0.8, -0.7, 0.9], eyes: 'wide', mouth: 'o', ear: 0.6 }
    ]
  },
  sit: {
    fps: 4,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      mode: 'sit',
      tail: 0.2 * Math.sin(t * TAU),
      eyes: i === 3 ? 'closed' : 'open',
      mouth: 'smile'
    }))
  },
  stand: {
    fps: 10,
    repeat: 0,
    poses: [
      { mode: 'sit', eyes: 'happy' },
      { sy: 0.9, sx: 1.06, legs: [0.3, -0.2, 0.3, -0.2], mouth: 'smile' },
      { sy: 1.03, sx: 0.98, mouth: 'tongue' }
    ]
  },
  eat: {
    fps: 6,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      mode: 'sit',
      headRot: 0.22,
      prop: 'onigiri',
      propT: i,
      mouth: i % 2 ? 'chomp' : 'smile',
      eyes: 'happy',
      tail: 0.3 * Math.sin(t * TAU)
    }))
  },
  drink: {
    fps: 7,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      headRot: 0.5,
      headDY: 4,
      prop: 'drops',
      propT: i,
      mouth: i % 2 ? 'tongue' : 'open',
      eyes: i % 2 ? 'closed' : 'happy',
      legs: [0.1, -0.15, 0.1, -0.15],
      tail: 0.3 * Math.sin(t * TAU)
    }))
  },
  sleep: {
    fps: 3,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      mode: 'lie',
      eyes: 'closed',
      mouth: 'flat',
      prop: 'zzz',
      propT: i,
      sy: 1 + 0.025 * Math.sin(t * TAU),
      tail: 0.1
    }))
  },
  read: {
    fps: 3,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      mode: 'sit',
      headRot: 0.16,
      prop: 'book',
      propT: i,
      eyes: 'open',
      pupil: i % 2 ? 1.5 : -0.5,
      mouth: 'smile'
    }))
  },
  write: {
    fps: 6,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      mode: 'sit',
      headRot: 0.32,
      prop: 'pencil',
      propT: i,
      eyes: 'open',
      mouth: 'tongue',
      pupil: 1
    }))
  },
  swim: {
    fps: 10,
    repeat: -1,
    poses: seq(6, (t) => {
      const s = Math.sin(t * TAU)
      return {
        rot: -0.12,
        legs: [1.1 * s, -1.1 * s, -1.2 * s, 1.2 * s],
        legLen: [0.9, 0.9, 0.9, 0.9],
        mouth: 'open',
        ear: -0.2,
        headRot: -0.15,
        bodyY: 2 * s
      }
    })
  },
  interact: {
    fps: 6,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      legs: [0, 0, 0, 1.9 + 0.25 * Math.sin(t * TAU)],
      legLen: [1, 1, 1, 0.85],
      mouth: i % 2 ? 'open' : 'smile',
      headRot: -0.1,
      eyes: i === 2 ? 'happy' : 'open',
      tail: 0.4 * Math.sin(t * TAU * 2)
    }))
  },
  kick: {
    fps: 10,
    repeat: 0,
    poses: [
      { legs: [0, 0, 0, -0.7], mouth: 'smile' },
      { legs: [0, 0, 0, 1.3], rot: -0.05, mouth: 'open', eyes: 'happy' },
      { legs: [0, 0, 0, 0.4], mouth: 'open' }
    ]
  },
  celebrate: {
    fps: 10,
    repeat: -1,
    poses: seq(6, (t, i) => ({
      bodyY: -16 * Math.sin(t * Math.PI),
      legs: [0.1, 1.5, 0.2, 1.7],
      legLen: [1, 0.85, 1, 0.85],
      eyes: 'happy',
      mouth: 'open',
      prop: 'sparkles',
      propT: i,
      tail: 0.5 * Math.sin(t * TAU * 2),
      ear: -0.2 * Math.sin(t * TAU)
    }))
  },
  ride: {
    fps: 6,
    repeat: -1,
    poses: seq(4, (t) => ({
      mode: 'sit',
      eyes: 'happy',
      mouth: 'open',
      ear: -0.3 + 0.15 * Math.sin(t * TAU),
      tail: 0.3 * Math.sin(t * TAU)
    }))
  }
}

export const NPC_ANIMS = {
  idle: {
    fps: 5,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      mode: 'sit',
      sy: 1 + 0.02 * Math.sin(t * TAU),
      tail: 0.3 * Math.sin(t * TAU),
      eyes: i === 3 ? 'closed' : 'open',
      mouth: 'smile'
    }))
  },
  talk: {
    fps: 8,
    repeat: -1,
    poses: seq(4, (t, i) => ({
      mode: 'sit',
      mouth: i % 2 ? 'open' : 'smile',
      tail: 0.4 * Math.sin(t * TAU),
      headRot: -0.05 * Math.sin(t * TAU),
      eyes: 'open'
    }))
  },
  happy: {
    fps: 8,
    repeat: -1,
    poses: seq(4, (t) => ({
      bodyY: -10 * Math.abs(Math.sin(t * TAU)),
      eyes: 'happy',
      mouth: 'open',
      legs: [0.1, 1.4, 0.2, 1.6],
      tail: 0.5 * Math.sin(t * TAU * 2)
    }))
  }
}
