import { describe, it, expect } from 'vitest'
import {
  MAZE_ROUNDS,
  MAZE_ASCII,
  simulateRoute,
  doorsAt,
  findChar,
  exitsOf
} from '../src/maps/mazeMap.js'

describe('labirinto das direções', () => {
  it('a grade é retangular e tem as duas saídas', () => {
    const w = MAZE_ASCII[0].length
    expect(MAZE_ASCII.every((r) => r.length === w)).toBe(true)
    expect(findChar('T')).toBeTruthy()
    expect(findChar('B')).toBeTruthy()
  })

  MAZE_ROUNDS.forEach((round, i) => {
    it(`rodada ${i + 1}: as instruções levam ao salão ${round.goal}`, () => {
      const r = simulateRoute(round)
      expect(r.end).toEqual(findChar(round.goal))
      expect(r.used).toBe(round.instructions.length)
      expect(r.junctions).toHaveLength(round.instructions.length)
      expect(exitsOf(r.end)).toHaveLength(1)
    })
  })

  it('a mesma porta (oeste) é 左側 na rodada 1 e 右側 na rodada 2', () => {
    const r1 = simulateRoute(MAZE_ROUNDS[0])
    const r2 = simulateRoute(MAZE_ROUNDS[1])
    const d1 = doorsAt(r1.end, r1.endHeading).find((d) => d.side === MAZE_ROUNDS[0].door)
    const d2 = doorsAt(r2.end, r2.endHeading).find((d) => d.side === MAZE_ROUNDS[1].door)
    expect(r1.endHeading).toBe('N')
    expect(r2.endHeading).toBe('S')
    expect(d1.dir).toBe('W')
    expect(d2.dir).toBe('W')
  })
})
