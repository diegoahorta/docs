// Tileset 16×16 gerado proceduralmente (uma faixa horizontal de tiles).
import { makeCanvas } from './pixelSprites.js'
import { T, TILE_COUNT } from '../maps/tiles.js'

const S = 16

// Ruído determinístico para variação de pixels.
const noise = (x, y, seed) => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453
  return n - Math.floor(n)
}

function speckle(ctx, ox, base, dots, seed, density = 0.12) {
  ctx.fillStyle = base
  ctx.fillRect(ox, 0, S, S)
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const r = noise(x, y, seed)
      if (r < density) {
        ctx.fillStyle = dots[Math.floor(r * 1000) % dots.length]
        ctx.fillRect(ox + x, y, 1, 1)
      }
    }
}

const painters = {
  [T.GRASS]: (ctx, ox) => speckle(ctx, ox, '#5fb354', ['#4f9e46', '#74c766'], 1),
  [T.GRASS2]: (ctx, ox) => {
    speckle(ctx, ox, '#5fb354', ['#4f9e46', '#74c766'], 2)
    ctx.fillStyle = '#ffe066'
    ctx.fillRect(ox + 4, 5, 1, 1)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(ox + 11, 10, 1, 1)
  },
  [T.ROAD]: (ctx, ox) =>
    speckle(ctx, ox, '#4a4e5c', ['#43475400', '#555a69', '#40434f'], 3, 0.08),
  [T.ROAD_DASH_H]: (ctx, ox) => {
    painters[T.ROAD](ctx, ox)
    ctx.fillStyle = '#f2e6b0'
    ctx.fillRect(ox + 3, 15, 10, 1)
  },
  [T.ROAD_DASH_V]: (ctx, ox) => {
    painters[T.ROAD](ctx, ox)
    ctx.fillStyle = '#f2e6b0'
    ctx.fillRect(ox + 15, 3, 1, 10)
  },
  [T.SIDEWALK]: (ctx, ox) => {
    ctx.fillStyle = '#cfc9bc'
    ctx.fillRect(ox, 0, S, S)
    ctx.fillStyle = '#b3ad9f'
    ctx.fillRect(ox, 7, S, 1)
    ctx.fillRect(ox + 7, 0, 1, 7)
    ctx.fillRect(ox + 15, 8, 1, 8)
  },
  [T.CROSS_NS]: (ctx, ox) => {
    painters[T.ROAD](ctx, ox)
    ctx.fillStyle = '#f4f4f4'
    for (let x = 1; x < S; x += 4) ctx.fillRect(ox + x, 0, 2, S)
  },
  [T.CROSS_EW]: (ctx, ox) => {
    painters[T.ROAD](ctx, ox)
    ctx.fillStyle = '#f4f4f4'
    for (let y = 1; y < S; y += 4) ctx.fillRect(ox, y, S, 2)
  },
  [T.PLAZA]: (ctx, ox) => {
    ctx.fillStyle = '#ead6a6'
    ctx.fillRect(ox, 0, S, S)
    ctx.fillStyle = '#d9c08a'
    ctx.fillRect(ox, 0, S, 1)
    ctx.fillRect(ox, 0, 1, S)
    ctx.fillRect(ox + 8, 8, 8, 1)
    ctx.fillRect(ox + 8, 8, 1, 8)
  },
  [T.WATER]: (ctx, ox) => {
    ctx.fillStyle = '#3f97d6'
    ctx.fillRect(ox, 0, S, S)
    ctx.fillStyle = '#7cc4f2'
    ctx.fillRect(ox + 2, 4, 4, 1)
    ctx.fillRect(ox + 9, 10, 5, 1)
    ctx.fillStyle = '#2f7cb8'
    ctx.fillRect(ox + 4, 13, 3, 1)
  },
  [T.HEDGE]: (ctx, ox) => {
    speckle(ctx, ox, '#2f6e3a', ['#245a2e', '#3f8a4a'], 4, 0.3)
    ctx.fillStyle = '#1d4a26'
    ctx.fillRect(ox, 14, S, 2)
  },
  [T.RAIL]: (ctx, ox) => {
    speckle(ctx, ox, '#8a7a6a', ['#7a6656', '#9c8c7a'], 5, 0.2)
    ctx.fillStyle = '#5a3d2a'
    for (let x = 1; x < S; x += 5) ctx.fillRect(ox + x, 2, 3, 12)
    ctx.fillStyle = '#c0c4cc'
    ctx.fillRect(ox, 4, S, 1)
    ctx.fillRect(ox, 11, S, 1)
  },
  [T.PARK]: (ctx, ox) => speckle(ctx, ox, '#6cc463', ['#5bb052', '#86d67b'], 6),
  [T.DIRT]: (ctx, ox) => speckle(ctx, ox, '#d9b382', ['#c69d6c', '#e6c597'], 7, 0.15),
  [T.FLOWER]: (ctx, ox) => {
    speckle(ctx, ox, '#5fb354', ['#4f9e46'], 8)
    const cols = ['#ff7eb6', '#ffd93d', '#ffffff', '#ff6b6b']
    ;[
      [3, 3],
      [10, 2],
      [6, 8],
      [13, 9],
      [2, 12],
      [9, 13]
    ].forEach(([x, y], i) => {
      ctx.fillStyle = cols[i % cols.length]
      ctx.fillRect(ox + x, y, 2, 2)
    })
  },
  [T.WOOD]: (ctx, ox) => {
    ctx.fillStyle = '#c99a62'
    ctx.fillRect(ox, 0, S, S)
    ctx.fillStyle = '#b5844c'
    for (let y = 3; y < S; y += 4) ctx.fillRect(ox, y, S, 1)
    ctx.fillRect(ox + 5, 0, 1, 3)
    ctx.fillRect(ox + 11, 4, 1, 3)
    ctx.fillRect(ox + 3, 8, 1, 3)
    ctx.fillRect(ox + 13, 12, 1, 3)
  },
  [T.WALL]: (ctx, ox) => {
    ctx.fillStyle = '#efe0c6'
    ctx.fillRect(ox, 0, S, S)
    ctx.fillStyle = '#8c6a8f'
    ctx.fillRect(ox, 12, S, 4)
    ctx.fillStyle = '#d9c7a8'
    ctx.fillRect(ox, 0, S, 1)
  },
  [T.TILEFLOOR]: (ctx, ox) => {
    ctx.fillStyle = '#ece6d6'
    ctx.fillRect(ox, 0, S, S)
    ctx.fillStyle = '#d6cfbb'
    ctx.fillRect(ox, 0, S, 1)
    ctx.fillRect(ox, 0, 1, S)
    ctx.fillRect(ox + 8, 0, 1, S)
    ctx.fillRect(ox, 8, S, 1)
  },
  [T.GRAVEL]: (ctx, ox) =>
    speckle(ctx, ox, '#c7b99f', ['#b0a186', '#d8ccb5', '#9e907a'], 9, 0.25),
  [T.RUG]: (ctx, ox) => {
    ctx.fillStyle = '#c95d5d'
    ctx.fillRect(ox, 0, S, S)
    ctx.fillStyle = '#e89a6a'
    ctx.fillRect(ox, 3, S, 1)
    ctx.fillRect(ox, 12, S, 1)
    ctx.fillStyle = '#a84444'
    ctx.fillRect(ox + 6, 6, 4, 4)
  }
}

export function makeTileset() {
  const [c, ctx] = makeCanvas(S * TILE_COUNT, S)
  for (let i = 0; i < TILE_COUNT; i++) painters[i]?.(ctx, i * S)
  return c
}
