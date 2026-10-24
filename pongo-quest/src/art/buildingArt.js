// Fachadas dos prédios desenhadas por código (vista superior 3/4).
import { makeCanvas } from './pixelSprites.js'

const STYLES = {
  school: {
    roof: '#3fa68f',
    roofDark: '#2c7a69',
    wall: '#f5ead2',
    trim: '#c9b48a',
    door: '#7a4a2a',
    win: '#8fd3ff'
  },
  hospital: {
    roof: '#8ec9ee',
    roofDark: '#5c9bc4',
    wall: '#ffffff',
    trim: '#cfd8e3',
    door: '#6fa8dc',
    win: '#bfe6ff'
  },
  restaurant: {
    roof: '#c0573a',
    roofDark: '#8f3d27',
    wall: '#ffd59a',
    trim: '#e0a96a',
    door: '#5a3420',
    win: '#ffe9a8'
  },
  bank: {
    roof: '#34407a',
    roofDark: '#242c58',
    wall: '#d9dbe3',
    trim: '#a9adbd',
    door: '#5a5f73',
    win: '#9fc3e8'
  },
  station: {
    roof: '#8a3b3b',
    roofDark: '#5f2626',
    wall: '#f0dcc0',
    trim: '#c4a57d',
    door: '#7fb4d6',
    win: '#b8e0f5'
  },
  post: {
    roof: '#d64541',
    roofDark: '#a12f2c',
    wall: '#fff3ea',
    trim: '#e6b9a8',
    door: '#a12f2c',
    win: '#ffd7c9'
  },
  konbini: {
    roof: '#e9eef2',
    roofDark: '#b9c3cc',
    wall: '#ffffff',
    trim: '#2ecc71',
    door: '#9fe3ff',
    win: '#c8f1ff'
  },
  house: {
    roof: '#d9534f',
    roofDark: '#a63c39',
    wall: '#fff1d6',
    trim: '#d8b98a',
    door: '#8a5a3a',
    win: '#a8dcff'
  },
  library: {
    roof: '#4f8a3f',
    roofDark: '#386630',
    wall: '#c98a5c',
    trim: '#a06a42',
    door: '#5a3a24',
    win: '#ffe7a0'
  }
}

const px = (ctx, color, x, y, w = 1, h = 1) => {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function symbol(ctx, kind, x, y) {
  if (kind === 'cross') {
    px(ctx, '#ffffff', x - 1, y - 1, 10, 10)
    px(ctx, '#e53935', x + 3, y, 2, 8)
    px(ctx, '#e53935', x, y + 3, 8, 2)
  } else if (kind === 'post') {
    // 〒
    px(ctx, '#ffffff', x - 1, y - 1, 10, 10)
    px(ctx, '#d64541', x, y, 8, 1)
    px(ctx, '#d64541', x, y + 2, 8, 1)
    px(ctx, '#d64541', x + 3, y + 2, 2, 6)
  } else if (kind === 'yen') {
    px(ctx, '#ffe066', x - 1, y - 1, 10, 10)
    px(ctx, '#8a6d00', x + 1, y, 1, 2)
    px(ctx, '#8a6d00', x + 6, y, 1, 2)
    px(ctx, '#8a6d00', x + 2, y + 2, 1, 1)
    px(ctx, '#8a6d00', x + 5, y + 2, 1, 1)
    px(ctx, '#8a6d00', x + 3, y + 3, 2, 5)
    px(ctx, '#8a6d00', x + 1, y + 4, 6, 1)
    px(ctx, '#8a6d00', x + 1, y + 6, 6, 1)
  } else if (kind === 'book') {
    px(ctx, '#fff8e7', x, y, 4, 7)
    px(ctx, '#fff8e7', x + 5, y, 4, 7)
    px(ctx, '#7a4a2a', x + 4, y, 1, 8)
    px(ctx, '#7a4a2a', x, y + 7, 9, 1)
  } else if (kind === 'clock') {
    px(ctx, '#ffffff', x, y + 1, 9, 7)
    px(ctx, '#ffffff', x + 1, y, 7, 9)
    px(ctx, '#333', x + 4, y + 2, 1, 3)
    px(ctx, '#333', x + 4, y + 4, 3, 1)
  } else if (kind === 'fork') {
    px(ctx, '#fff8e7', x - 1, y - 1, 10, 10)
    px(ctx, '#8f3d27', x + 1, y, 1, 3)
    px(ctx, '#8f3d27', x + 3, y, 1, 3)
    px(ctx, '#8f3d27', x + 1, y + 3, 3, 1)
    px(ctx, '#8f3d27', x + 2, y + 3, 1, 5)
    px(ctx, '#8f3d27', x + 6, y, 2, 4)
    px(ctx, '#8f3d27', x + 6, y + 4, 1, 4)
  }
}

/**
 * Desenha a fachada de um prédio.
 * @returns {{canvas: HTMLCanvasElement, sign: {x:number,y:number,w:number,h:number}}}
 */
export function drawBuilding(b) {
  const W = b.rect.w * 16
  const H = b.rect.h * 16
  const st = STYLES[b.style]
  const [c, ctx] = makeCanvas(W, H)
  const roofH = Math.round(H * 0.34)

  // Telhado com telhas
  px(ctx, st.roof, 0, 0, W, roofH)
  for (let y = 3; y < roofH - 2; y += 4)
    for (let x = (y / 4) % 2 ? 0 : 4; x < W; x += 8) px(ctx, st.roofDark, x, y, 5, 1)
  px(ctx, 'rgba(255,255,255,0.25)', 0, 0, W, 2)
  px(ctx, st.roofDark, 0, roofH - 3, W, 3)

  // Parede
  px(ctx, st.wall, 0, roofH, W, H - roofH)
  px(ctx, st.trim, 0, H - 3, W, 3)
  px(ctx, 'rgba(0,0,0,0.08)', 0, roofH, W, 2)

  // Placa (o texto é sobreposto pelo Phaser)
  const signW = Math.min(W - 8, 64)
  const sign = { x: Math.round((W - signW) / 2), y: roofH + 3, w: signW, h: 13 }
  px(ctx, '#3a2a20', sign.x - 1, sign.y - 1, sign.w + 2, sign.h + 2)
  px(ctx, '#fffaf0', sign.x, sign.y, sign.w, sign.h)

  // Janelas
  const doorX = (b.door.x - b.rect.x) * 16
  const winY = sign.y + sign.h + 4
  for (let x = 6; x + 10 < W - 4; x += 16) {
    if (x + 10 > doorX - 2 && x < doorX + 34) continue
    if (winY + 10 > H - 6) break
    px(ctx, st.trim, x - 1, winY - 1, 12, 12)
    px(ctx, st.win, x, winY, 10, 10)
    px(ctx, 'rgba(255,255,255,0.6)', x + 1, winY + 1, 3, 2)
    px(ctx, st.trim, x + 5, winY, 1, 10)
  }

  // Porta (2 tiles)
  const doorH = 20
  px(ctx, '#2a1d16', doorX + 3, H - doorH - 1, 26, doorH + 1)
  px(ctx, st.door, doorX + 4, H - doorH, 24, doorH)
  px(ctx, 'rgba(255,255,255,0.35)', doorX + 6, H - doorH + 2, 8, doorH - 6)
  px(ctx, 'rgba(255,255,255,0.35)', doorX + 18, H - doorH + 2, 8, doorH - 6)
  px(ctx, '#2a1d16', doorX + 15, H - doorH, 2, doorH)

  // Detalhes de estilo
  const midX = Math.round(W / 2) - 4
  switch (b.style) {
    case 'school':
      symbol(ctx, 'clock', midX, 4)
      break
    case 'hospital':
      symbol(ctx, 'cross', midX, 5)
      break
    case 'restaurant':
      for (let x = doorX - 2; x < doorX + 34; x += 6) {
        px(ctx, '#e53935', x, H - doorH - 7, 3, 5)
        px(ctx, '#ffffff', x + 3, H - doorH - 7, 3, 5)
      }
      symbol(ctx, 'fork', midX, 5)
      break
    case 'bank':
      for (let x = 3; x < W - 3; x += 12) px(ctx, '#f4f5f8', x, winY - 2, 4, H - winY - 3)
      symbol(ctx, 'yen', midX, 5)
      break
    case 'station':
      symbol(ctx, 'clock', midX, 5)
      px(ctx, '#d4b483', 0, H - 6, W, 3)
      break
    case 'post':
      symbol(ctx, 'post', midX, 5)
      px(ctx, '#d64541', doorX + 30, H - 14, 6, 11) // caixa de correio
      px(ctx, '#2a1d16', doorX + 31, H - 12, 4, 1)
      break
    case 'konbini':
      px(ctx, '#2ecc71', 0, roofH - 9, W, 2)
      px(ctx, '#ff9f43', 0, roofH - 7, W, 2)
      px(ctx, '#3c8cff', 0, roofH - 5, W, 2)
      break
    case 'house':
      px(ctx, '#7ec850', 2, H - 8, 6, 5)
      px(ctx, '#7ec850', W - 8, H - 8, 6, 5)
      break
    case 'library':
      for (let x = 4; x < W - 4; x += 14) px(ctx, '#e8d5b5', x, winY - 2, 3, H - winY - 3)
      symbol(ctx, 'book', midX, 5)
      break
  }
  return { canvas: c, sign }
}
