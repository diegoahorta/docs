// Configurações globais do jogo. Resolução lógica 480×270 escalonada
// mantendo proporção e pixels nítidos.
// O canvas interno usa 2× a resolução lógica para que o texto japonês
// (placas, nomes) fique nítido; as câmeras do mundo usam zoom 2.
export const LOGICAL_WIDTH = 480
export const LOGICAL_HEIGHT = 270
export const ZOOM = 2
export const GAME_WIDTH = LOGICAL_WIDTH * ZOOM
export const GAME_HEIGHT = LOGICAL_HEIGHT * ZOOM
export const TILE = 16

export const PLAYER_SPEED = 82
export const INTERACT_RANGE = 22

export const FONT_FAMILY =
  '"DotGothic16", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif'

export const DEPTH = {
  GROUND: 0,
  DECOR: 5,
  ENTITIES: 10, // entidades usam 10 + y para ordenação
  OVERHEAD: 5000,
  MARKERS: 6000
}

export const COLORS = {
  ink: '#1b1530',
  paper: '#fff8e7',
  accent: '#ff7a3d',
  sky: '#7fd3ff',
  mayoi: '#9b5cff',
  ok: '#2fbf71',
  warn: '#ffb020'
}

export const SAVE_KEY = 'pongo-direction-quest-save-v1'

export const BRAND = {
  name: 'ODU Creative',
  tagline: 'Learn. Play. Connect.'
}
