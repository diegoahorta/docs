import { describe, it, expect } from 'vitest'
import { PHASES } from '../src/data/phases.js'
import {
  checkFact,
  isNextTo,
  isBetween,
  isDirectionOf,
  isNear
} from '../src/education/spatial.js'
import {
  BUILDINGS,
  NPC_SPAWNS,
  MARKERS,
  buildCityTiles,
  CITY_W,
  CITY_H
} from '../src/maps/cityMap.js'
import { SOLID_TILES } from '../src/maps/tiles.js'

const facts = []
PHASES.forEach((ph) =>
  ph.steps.forEach((s) => {
    ;[s.fact]
      .flat()
      .filter(Boolean)
      .forEach((f) => facts.push([`fase ${ph.id} ${s.type}`, f]))
    ;(s.targets || []).forEach((t) =>
      [t.fact]
        .flat()
        .filter(Boolean)
        .forEach((f) => facts.push([`fase ${ph.id} ${t.id}`, f]))
    )
  })
)

describe('as frases das missões correspondem ao mapa', () => {
  it('há fatos para verificar', () => expect(facts.length).toBeGreaterThan(6))
  facts.forEach(([where, f]) => {
    it(`${where}: ${f.a} ${f.rel} ${f.b}${f.c ? ' / ' + f.c : ''}`, () =>
      expect(checkFact(f)).toBe(true))
  })

  it('exemplos do vocabulário e da gramática são verdadeiros', () => {
    expect(isNextTo('station', 'bank')).toBe(true)
    expect(isNextTo('station', 'post')).toBe(true)
    expect(isBetween('restaurant', 'hospital', 'bank')).toBe(true)
    expect(isDirectionOf('station', 'N', 'plaza')).toBe(true)
    expect(isDirectionOf('park', 'E', 'plaza')).toBe(true)
    expect(isDirectionOf('house', 'W', 'plaza')).toBe(true)
    expect(isDirectionOf('library', 'S', 'house')).toBe(true)
    expect(isNear('konbini', 'station')).toBe(true)
    expect(isNextTo('hospital', 'school')).toBe(true)
  })

  it('relações falsas são rejeitadas', () => {
    expect(isNextTo('station', 'school')).toBe(false)
    expect(isBetween('bank', 'school', 'hospital')).toBe(false)
    expect(isDirectionOf('library', 'N', 'house')).toBe(false)
  })
})

describe('integridade do mapa', () => {
  const tiles = buildCityTiles()
  const solid = (x, y) => SOLID_TILES.includes(tiles[y][x])
  it('tem o tamanho declarado', () => {
    expect(tiles).toHaveLength(CITY_H)
    expect(tiles.every((r) => r.length === CITY_W)).toBe(true)
  })
  it('portas, NPCs e marcadores ficam em tiles caminháveis', () => {
    BUILDINGS.forEach((b) =>
      expect(solid(b.door.x, b.door.y + 1), `porta ${b.id}`).toBe(false)
    )
    Object.entries(NPC_SPAWNS).forEach(([id, s]) =>
      expect(solid(s.x, s.y), id).toBe(false)
    )
    Object.values(MARKERS).forEach((m) => expect(solid(m.x, m.y)).toBe(false))
  })
  it('prédios não se sobrepõem', () => {
    BUILDINGS.forEach((a, i) =>
      BUILDINGS.slice(i + 1).forEach((b) => {
        const o =
          a.rect.x < b.rect.x + b.rect.w &&
          b.rect.x < a.rect.x + a.rect.w &&
          a.rect.y < b.rect.y + b.rect.h &&
          b.rect.y < a.rect.y + a.rect.h
        expect(o, `${a.id} × ${b.id}`).toBe(false)
      })
    )
  })
})
