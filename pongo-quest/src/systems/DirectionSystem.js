// Direções absolutas (北・南・東・西) e relativas ao personagem
// (前・右・後ろ・左). Funções puras — testadas em tests/directions.test.js.

export const DIRS = ['N', 'E', 'S', 'W']

export const VEC = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }

export const ABS = {
  N: { kanji: '北', kana: 'きた', pt: 'norte', ruby: '{北|きた}' },
  S: { kanji: '南', kana: 'みなみ', pt: 'sul', ruby: '{南|みなみ}' },
  E: { kanji: '東', kana: 'ひがし', pt: 'leste', ruby: '{東|ひがし}' },
  W: { kanji: '西', kana: 'にし', pt: 'oeste', ruby: '{西|にし}' }
}

export const REL = {
  front: { kanji: '前', kana: 'まえ', pt: 'frente', ruby: '{前|まえ}' },
  right: { kanji: '右', kana: 'みぎ', pt: 'direita', ruby: '{右|みぎ}' },
  back: { kanji: '後ろ', kana: 'うしろ', pt: 'trás', ruby: '{後|うし}ろ' },
  left: { kanji: '左', kana: 'ひだり', pt: 'esquerda', ruby: '{左|ひだり}' }
}

// Instruções de rota usadas no labirinto.
export const MOVES = {
  straight: {
    ruby: '[pos:まっすぐ][pred:{行|い}ってください]',
    pt: 'Siga em frente',
    rel: 'front'
  },
  right: {
    ruby: '[pos:{右|みぎ}][part:に][pred:{曲|ま}がってください]',
    pt: 'Vire à direita',
    rel: 'right'
  },
  left: {
    ruby: '[pos:{左|ひだり}][part:に][pred:{曲|ま}がってください]',
    pt: 'Vire à esquerda',
    rel: 'left'
  }
}

const OFFSET = { front: 0, right: 1, back: 2, left: 3 }

/** Gira a partir da direção atual. turn('N','right') → 'E' */
export function turn(facing, rel) {
  const key = rel === 'straight' ? 'front' : rel
  const i = DIRS.indexOf(facing)
  if (i < 0 || !(key in OFFSET)) throw new Error(`Direção inválida: ${facing}/${rel}`)
  return DIRS[(i + OFFSET[key]) % 4]
}

/** Para onde fica uma direção absoluta em relação a quem olha para `facing`. */
export function relativeOf(facing, absolute) {
  const diff = (DIRS.indexOf(absolute) - DIRS.indexOf(facing) + 4) % 4
  return ['front', 'right', 'back', 'left'][diff]
}

export function opposite(dir) {
  return turn(dir, 'back')
}

/** Converte um deslocamento em direção cardeal predominante. */
export function dirFromDelta(dx, dy) {
  if (dx === 0 && dy === 0) return null
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'E' : 'W'
  return dy > 0 ? 'S' : 'N'
}

/** Ângulo (graus, 0 = norte, sentido horário) de uma direção cardeal. */
export function angleOf(dir) {
  return DIRS.indexOf(dir) * 90
}

/** Traduz uma curva em explicação didática em português. */
export function explainTurn(facing, rel) {
  const to = turn(facing, rel)
  const r = rel === 'straight' ? 'front' : rel
  return `Pongo olhava para ${ABS[facing].kanji} (${ABS[facing].pt}). ${REL[r].kanji} (${REL[r].pt}) dele aponta para ${ABS[to].kanji} (${ABS[to].pt}).`
}
