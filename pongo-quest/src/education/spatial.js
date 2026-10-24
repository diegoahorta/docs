// Relações espaciais calculadas a partir dos dados do mapa. Servem para
// garantir que as frases das missões correspondem às posições reais.
import { BUILDINGS, AREAS, CAR, buildingById } from '../maps/cityMap.js'

const rectOf = (id) => {
  if (id === 'car') return CAR
  const b = buildingById(id)
  if (!b) throw new Error(`Lugar desconhecido: ${id}`)
  return b.rect
}

const cx = (r) => r.x + r.w / 2
const cy = (r) => r.y + r.h / 2
const overlapX = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w
const overlapY = (a, b) => a.y < b.y + b.h && b.y < a.y + a.h
const gapX = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w))
const gapY = (a, b) => Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h))

/** 隣: vizinhos imediatos na mesma fileira, sem outro prédio no meio. */
export function isNextTo(a, b) {
  const A = rectOf(a)
  const B = rectOf(b)
  if (!overlapY(A, B) || gapX(A, B) > 4) return false
  const lo = Math.min(cx(A), cx(B))
  const hi = Math.max(cx(A), cx(B))
  return !BUILDINGS.some(
    (o) =>
      o.id !== a &&
      o.id !== b &&
      overlapY(o.rect, A) &&
      cx(o.rect) > lo &&
      cx(o.rect) < hi
  )
}

/** 間: A fica entre B e C. */
export function isBetween(a, b, c) {
  const A = rectOf(a)
  const B = rectOf(b)
  const C = rectOf(c)
  const horiz = overlapY(A, B) && overlapY(A, C) && (cx(B) - cx(A)) * (cx(C) - cx(A)) < 0
  const vert = overlapX(A, B) && overlapX(A, C) && (cy(B) - cy(A)) * (cy(C) - cy(A)) < 0
  return horiz || vert
}

/** 近く: distância entre centros de até 18 tiles (um quarteirão). */
export function isNear(a, b) {
  const A = rectOf(a)
  const B = rectOf(b)
  return Math.hypot(cx(A) - cx(B), cy(A) - cy(B)) <= 18
}

/** そば: praticamente encostado (até 1 tile de distância). */
export function isBeside(a, b) {
  const A = rectOf(a)
  const B = rectOf(b)
  return (
    Math.max(gapX(A, B), gapY(A, B), -Infinity) <= 1 && (overlapX(A, B) || overlapY(A, B))
  )
}

/** 中: A está contido em B. */
export function isInside(a, b) {
  const A = rectOf(a)
  const B = rectOf(b)
  return A.x >= B.x && A.y >= B.y && A.x + A.w <= B.x + B.w && A.y + A.h <= B.y + B.h
}

/** 北/南/東/西: A fica na direção `dir` de B (com sobreposição no outro eixo). */
export function isDirectionOf(a, dir, b) {
  const A = rectOf(a)
  const B = rectOf(b)
  if (dir === 'N') return overlapX(A, B) && A.y + A.h <= B.y
  if (dir === 'S') return overlapX(A, B) && A.y >= B.y + B.h
  if (dir === 'E') return overlapY(A, B) && A.x >= B.x + B.w
  if (dir === 'W') return overlapY(A, B) && A.x + A.w <= B.x
  return false
}

/** 向こう: A fica do outro lado de `middle` visto a partir de `from`. */
export function isAcross(a, middle, from) {
  const A = rectOf(a)
  const M = rectOf(middle)
  const F = rectOf(from)
  return (cx(A) - cx(M)) * (cx(F) - cx(M)) < 0 && gapX(A, M) <= 2 && gapX(F, M) <= 2
}

/** Verifica um fato declarado nos dados das missões. */
export function checkFact(f) {
  switch (f.rel) {
    case 'tonari':
      return isNextTo(f.a, f.b)
    case 'aida':
      return isBetween(f.a, f.b, f.c)
    case 'chikaku':
      return isNear(f.a, f.b)
    case 'soba':
      return isBeside(f.a, f.b)
    case 'naka':
      return isInside(f.a, f.b)
    case 'mukou':
      return isAcross(f.a, f.b, f.from)
    case 'dir':
      return isDirectionOf(f.a, f.dir, f.b)
    default:
      throw new Error(`Relação desconhecida: ${f.rel}`)
  }
}

export const ALL_PLACES = [...BUILDINGS.map((b) => b.id), ...AREAS.map((a) => a.id)]
