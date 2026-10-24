// Índices dos tiles gerados programaticamente (art/tileArt.js).
export const T = {
  GRASS: 0,
  GRASS2: 1,
  ROAD: 2,
  ROAD_DASH_H: 3,
  ROAD_DASH_V: 4,
  SIDEWALK: 5,
  CROSS_NS: 6,
  CROSS_EW: 7,
  PLAZA: 8,
  WATER: 9,
  HEDGE: 10,
  RAIL: 11,
  PARK: 12,
  DIRT: 13,
  FLOWER: 14,
  WOOD: 15,
  WALL: 16,
  TILEFLOOR: 17,
  GRAVEL: 18,
  RUG: 19
}

export const TILE_COUNT = 20

export const SOLID_TILES = [T.WATER, T.HEDGE, T.RAIL, T.WALL]

// Cores usadas no minimapa e no mapa dos puzzles.
export const MINIMAP_COLORS = {
  [T.GRASS]: '#5fb354',
  [T.GRASS2]: '#58a94e',
  [T.ROAD]: '#4a4e5c',
  [T.ROAD_DASH_H]: '#4a4e5c',
  [T.ROAD_DASH_V]: '#4a4e5c',
  [T.SIDEWALK]: '#c9c4b8',
  [T.CROSS_NS]: '#e9e9e9',
  [T.CROSS_EW]: '#e9e9e9',
  [T.PLAZA]: '#e8d3a2',
  [T.WATER]: '#4aa3e0',
  [T.HEDGE]: '#2f6e3a',
  [T.RAIL]: '#7a6656',
  [T.PARK]: '#6cc463',
  [T.DIRT]: '#d4ae7a',
  [T.FLOWER]: '#f08bb5',
  [T.WOOD]: '#c48a52',
  [T.WALL]: '#6b5a7a',
  [T.TILEFLOOR]: '#e6e0d0',
  [T.GRAVEL]: '#bcae96',
  [T.RUG]: '#c55a5a'
}
