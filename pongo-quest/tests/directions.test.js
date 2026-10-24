import { describe, it, expect } from 'vitest'
import {
  turn,
  relativeOf,
  dirFromDelta,
  opposite,
  explainTurn
} from '../src/systems/DirectionSystem.js'

describe('direções relativas dependem da orientação', () => {
  it('virar à direita olhando para cada ponto cardeal', () => {
    expect(turn('N', 'right')).toBe('E')
    expect(turn('E', 'right')).toBe('S')
    expect(turn('S', 'right')).toBe('W')
    expect(turn('W', 'right')).toBe('N')
  })

  it('virar à esquerda e seguir em frente', () => {
    expect(turn('N', 'left')).toBe('W')
    expect(turn('S', 'left')).toBe('E')
    expect(turn('E', 'straight')).toBe('E')
    expect(opposite('N')).toBe('S')
  })

  it('posição relativa de uma direção absoluta', () => {
    expect(relativeOf('N', 'E')).toBe('right')
    expect(relativeOf('S', 'E')).toBe('left') // olhando para o sul, o leste fica à esquerda
    expect(relativeOf('W', 'N')).toBe('right')
    expect(relativeOf('E', 'W')).toBe('back')
    expect(relativeOf('S', 'S')).toBe('front')
  })

  it('converte deslocamento em direção predominante', () => {
    expect(dirFromDelta(10, 2)).toBe('E')
    expect(dirFromDelta(-1, -9)).toBe('N')
    expect(dirFromDelta(0, 0)).toBeNull()
  })

  it('explica a curva em português', () => {
    expect(explainTurn('S', 'right')).toContain('西')
  })

  it('rejeita direções inválidas', () => {
    expect(() => turn('X', 'right')).toThrow()
  })
})
