// Dados da cidade ことばの町. Todas as frases de localização usadas nas
// missões são verificadas contra estes dados em tests/spatial.test.js.
import { T } from './tiles.js'

export const CITY_W = 64
export const CITY_H = 46

// rect em tiles; door = tile esquerdo da porta (portas têm 2 tiles).
export const BUILDINGS = [
  {
    id: 'school',
    vocab: 'gakkou',
    name: '{学校|がっこう}',
    pt: 'Escola',
    rect: { x: 2, y: 3, w: 8, h: 8 },
    door: { x: 5, y: 10 },
    style: 'school'
  },
  {
    id: 'hospital',
    vocab: 'byouin',
    name: '{病院|びょういん}',
    pt: 'Hospital',
    rect: { x: 11, y: 3, w: 6, h: 8 },
    door: { x: 13, y: 10 },
    style: 'hospital'
  },
  {
    id: 'restaurant',
    vocab: 'resutoran',
    name: 'レストラン',
    pt: 'Restaurante',
    rect: { x: 21, y: 4, w: 6, h: 7 },
    door: { x: 23, y: 10 },
    style: 'restaurant'
  },
  {
    id: 'bank',
    vocab: 'ginkou',
    name: '{銀行|ぎんこう}',
    pt: 'Banco',
    rect: { x: 28, y: 3, w: 6, h: 8 },
    door: { x: 30, y: 10 },
    style: 'bank'
  },
  {
    id: 'station',
    vocab: 'eki',
    name: '{駅|えき}',
    pt: 'Estação',
    rect: { x: 35, y: 3, w: 8, h: 8 },
    door: { x: 38, y: 10 },
    style: 'station'
  },
  {
    id: 'post',
    vocab: 'yuubinkyoku',
    name: '{郵便局|ゆうびんきょく}',
    pt: 'Correio',
    rect: { x: 45, y: 4, w: 6, h: 7 },
    door: { x: 47, y: 10 },
    style: 'post'
  },
  {
    id: 'konbini',
    vocab: 'konbini',
    name: 'コンビニ',
    pt: 'Loja de conveniência',
    rect: { x: 52, y: 5, w: 6, h: 6 },
    door: { x: 54, y: 10 },
    style: 'konbini'
  },
  {
    id: 'house',
    vocab: 'ie',
    name: '{家|いえ}',
    pt: 'Casa',
    rect: { x: 5, y: 16, w: 7, h: 7 },
    door: { x: 7, y: 22 },
    style: 'house',
    enter: 'house'
  },
  {
    id: 'library',
    vocab: 'toshokan',
    name: '{図書館|としょかん}',
    pt: 'Biblioteca',
    rect: { x: 3, y: 34, w: 10, h: 7 },
    door: { x: 7, y: 40 },
    style: 'library',
    enter: 'library'
  }
]

// Áreas que não são prédios mas aparecem nas frases e no mapa.
export const AREAS = [
  {
    id: 'plaza',
    name: '{広場|ひろば}',
    pt: 'Praça',
    rect: { x: 21, y: 15, w: 22, h: 14 }
  },
  {
    id: 'park',
    vocab: 'kouen',
    name: '{公園|こうえん}',
    pt: 'Parque',
    rect: { x: 47, y: 15, w: 15, h: 29 }
  },
  {
    id: 'maze',
    name: '{迷路|めいろ}',
    pt: 'Labirinto',
    rect: { x: 21, y: 33, w: 22, h: 11 }
  },
  { id: 'pond', name: '{池|いけ}', pt: 'Lago', rect: { x: 52, y: 34, w: 7, h: 6 } },
  {
    id: 'eastRoad',
    name: '{道|みち}',
    pt: 'Rua (leste)',
    rect: { x: 44, y: 12, w: 2, h: 32 }
  }
]

// Placas de prédio e do parque podem estar “embaralhadas” por まよいネコ.
export const SCRAMBLED_AT_START = ['station', 'restaurant', 'konbini', 'park', 'library']

export const PARK_GATE = { x: 47, y: 21, h: 2, sign: { x: 48, y: 20 } }

export const MARKERS = {
  mk_n: { x: 31, y: 16, dir: 'N' },
  mk_s: { x: 31, y: 27, dir: 'S' },
  mk_w: { x: 23, y: 21, dir: 'W' },
  mk_e: { x: 39, y: 21, dir: 'E' }
}

export const FOUNTAIN = { x: 30, y: 20, w: 3, h: 3 }
export const CAR = { x: 12, y: 21, w: 2, h: 1 } // ao lado (そば) da casa
export const BIG_TREE = { x: 57, y: 22 }
export const MAZE_GATE = { x: 31, y: 35 }

export const NPC_SPAWNS = {
  obaasan: { x: 31, y: 24 },
  lisa: { x: 25, y: 17 },
  ken: { x: 41, y: 24 },
  yuki: { x: 14, y: 25 },
  michi: { x: 35, y: 34 },
  sensei: { x: 8, y: 11 },
  mayoi: { x: 31, y: 18 }
}

export const SPAWNS = {
  station: { x: 38.5, y: 11.6, facing: 'S' },
  plaza: { x: 31.5, y: 25.6, facing: 'N' },
  house: { x: 8, y: 23.6, facing: 'S' },
  houseYard: { x: 13.5, y: 25.6, facing: 'W' },
  maze: { x: 32, y: 33.6, facing: 'S' },
  library: { x: 8, y: 41.6, facing: 'S' }
}

// Placas de rua (texto japonês com furigana).
export const STREET_SIGNS = [
  {
    id: 'sign_n',
    x: 33,
    y: 14,
    jp: '↑ {北|きた}：{駅|えき}・{銀行|ぎんこう}',
    pt: '↑ Norte: estação, banco'
  },
  {
    id: 'sign_e',
    x: 42,
    y: 23,
    jp: '→ {東|ひがし}：{公園|こうえん}',
    pt: '→ Leste: parque'
  },
  { id: 'sign_w', x: 21, y: 19, jp: '← {西|にし}：{家|いえ}', pt: '← Oeste: casa' },
  {
    id: 'sign_s',
    x: 33,
    y: 28,
    jp: '↓ {南|みなみ}：{迷路|めいろ}・{図書館|としょかん}',
    pt: '↓ Sul: labirinto, biblioteca'
  },
  { id: 'sign_park', x: 48, y: 20, jp: '{公園|こうえん}', pt: 'Parque', building: 'park' }
]

export const TREES = [
  [58, 4],
  [60, 6],
  [58, 8],
  [60, 9],
  [18, 4],
  [18, 8],
  [3, 15],
  [3, 26],
  [15, 16],
  [15, 28],
  [21, 15],
  [42, 15],
  [21, 28],
  [42, 28],
  [49, 17],
  [52, 17],
  [57, 17],
  [60, 19],
  [50, 27],
  [57, 26],
  [60, 28],
  [49, 32],
  [60, 33],
  [49, 41],
  [60, 41],
  [56, 30],
  [2, 33],
  [14, 34],
  [15, 39],
  [3, 42],
  [22, 34],
  [41, 34],
  [22, 42],
  [41, 42]
]

export const LIGHTS = [
  { x: 30, y: 14 },
  { x: 33, y: 11 },
  { x: 17, y: 20 },
  { x: 20, y: 23 },
  { x: 43, y: 20 },
  { x: 46, y: 23 },
  { x: 30, y: 32 },
  { x: 33, y: 29 }
]

export const BENCHES = [
  { x: 26, y: 24 },
  { x: 36, y: 24 },
  { x: 52, y: 30 },
  { x: 50, y: 25 }
]

const fill = (grid, x, y, w, h, t) => {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) if (grid[j] && i >= 0 && i < CITY_W) grid[j][i] = t
}

/** Gera a matriz de tiles da cidade. */
export function buildCityTiles() {
  const g = Array.from({ length: CITY_H }, (_, y) =>
    Array.from({ length: CITY_W }, (_, x) =>
      (x * 7 + y * 13) % 11 === 0 ? T.GRASS2 : T.GRASS
    )
  )
  // Calçadas
  fill(g, 2, 11, 60, 1, T.SIDEWALK)
  fill(g, 2, 14, 60, 1, T.SIDEWALK)
  fill(g, 2, 29, 45, 1, T.SIDEWALK)
  fill(g, 2, 32, 45, 1, T.SIDEWALK)
  fill(g, 17, 14, 1, 30, T.SIDEWALK)
  fill(g, 20, 14, 1, 30, T.SIDEWALK)
  fill(g, 43, 14, 1, 30, T.SIDEWALK)
  fill(g, 46, 14, 1, 30, T.SIDEWALK)
  // Ruas
  fill(g, 2, 12, 60, 2, T.ROAD)
  fill(g, 2, 30, 44, 2, T.ROAD)
  fill(g, 18, 12, 2, 32, T.ROAD)
  fill(g, 44, 12, 2, 32, T.ROAD)
  for (let x = 2; x < 62; x += 2) if (![18, 44].includes(x)) g[12][x] = T.ROAD_DASH_H
  for (let x = 2; x < 46; x += 2) if (![18, 44].includes(x)) g[30][x] = T.ROAD_DASH_H
  for (let y = 15; y < 44; y += 2)
    if (y !== 30) {
      g[y][18] = T.ROAD_DASH_V
      g[y][44] = T.ROAD_DASH_V
    }
  // Faixas de pedestres
  fill(g, 31, 12, 2, 2, T.CROSS_NS)
  fill(g, 31, 30, 2, 2, T.CROSS_NS)
  fill(g, 18, 21, 2, 2, T.CROSS_EW)
  fill(g, 44, 21, 2, 2, T.CROSS_EW)
  fill(g, 7, 12, 2, 2, T.CROSS_NS)
  // Praça
  fill(g, 21, 15, 22, 14, T.PLAZA)
  fill(g, 22, 16, 2, 2, T.FLOWER)
  fill(g, 40, 16, 2, 2, T.FLOWER)
  fill(g, 22, 26, 2, 2, T.FLOWER)
  fill(g, 40, 26, 2, 2, T.FLOWER)
  // Parque cercado com portão a oeste
  fill(g, 47, 15, 15, 29, T.PARK)
  fill(g, 47, 15, 1, 29, T.HEDGE)
  fill(g, 47, 15, 15, 1, T.HEDGE)
  fill(g, 47, PARK_GATE.y, 1, PARK_GATE.h, T.DIRT)
  fill(g, 48, 21, 6, 2, T.DIRT)
  fill(g, 54, 21, 2, 12, T.DIRT)
  fill(g, 50, 32, 10, 1, T.DIRT)
  fill(g, 52, 34, 7, 6, T.WATER)
  // Trilhos atrás da estação
  fill(g, 34, 2, 28, 1, T.RAIL)
  // Jardim da casa
  fill(g, 7, 23, 2, 6, T.DIRT)
  fill(g, 9, 26, 8, 2, T.DIRT)
  fill(g, 3, 24, 3, 2, T.FLOWER)
  // Biblioteca: caminho até a calçada
  fill(g, 7, 41, 2, 2, T.DIRT)
  fill(g, 9, 41, 8, 2, T.DIRT)
  // Jardim do labirinto
  fill(g, 21, 33, 22, 11, T.GRAVEL)
  fill(g, 31, 33, 2, 3, T.DIRT)
  fill(g, 23, 37, 7, 1, T.HEDGE)
  fill(g, 34, 37, 7, 1, T.HEDGE)
  fill(g, 23, 39, 18, 1, T.HEDGE)
  fill(g, 23, 41, 7, 1, T.HEDGE)
  fill(g, 34, 41, 7, 1, T.HEDGE)
  // Borda da cidade
  fill(g, 0, 0, CITY_W, 2, T.HEDGE)
  fill(g, 0, CITY_H - 2, CITY_W, 2, T.HEDGE)
  fill(g, 0, 0, 2, CITY_H, T.HEDGE)
  fill(g, CITY_W - 2, 0, 2, CITY_H, T.HEDGE)
  return g
}

export function buildingById(id) {
  return BUILDINGS.find((b) => b.id === id) || AREAS.find((a) => a.id === id)
}

/** Centro (em pixels) de um tile. */
export const tileCenter = (tx, ty, tile = 16) => ({
  x: (tx + 0.5) * tile,
  y: (ty + 0.5) * tile
})
