// Labirinto das direções (Fase 4). Cada caractere é um bloco de 2×2 tiles.
// Nós (cruzamentos) ficam em coordenadas ímpares. T = saída norte,
// B = saída sul. As mesmas portas mudam de 左側 para 右側 conforme a
// direção de chegada — a direção relativa depende da orientação!
import { VEC, DIRS, turn, opposite, relativeOf } from '../systems/DirectionSystem.js'

export const MAZE_ASCII = [
  '###########',
  '#####T#####',
  '#####.#####',
  '#.........#',
  '#.#.#.#.#.#',
  '#.........#',
  '#.#.#.#.#.#',
  '#.........#',
  '#.#.###.#.#',
  '#.........#',
  '#####.#####',
  '#####B#####',
  '###########'
]

export const BLOCK = 2 // tiles por bloco

export const MAZE_ROUNDS = [
  {
    start: 'B',
    heading: 'N',
    goal: 'T',
    door: 'left',
    instructions: ['right', 'left', 'straight', 'left', 'right', 'straight'],
    intro: 'p4_maze1'
  },
  {
    start: 'T',
    heading: 'S',
    goal: 'B',
    door: 'right',
    instructions: [
      'left',
      'right',
      'straight',
      'right',
      'straight',
      'left',
      'left',
      'right'
    ],
    intro: 'p4_maze2'
  }
]

export const isFloor = (x, y, grid = MAZE_ASCII) => {
  const row = grid[y]
  return !!row && x >= 0 && x < row.length && row[x] !== '#'
}

export function findChar(ch, grid = MAZE_ASCII) {
  for (let y = 0; y < grid.length; y++) {
    const x = grid[y].indexOf(ch)
    if (x >= 0) return { x, y }
  }
  return null
}

export function exitsOf(node, grid = MAZE_ASCII) {
  return DIRS.filter((d) => isFloor(node.x + VEC[d][0], node.y + VEC[d][1], grid))
}

export const isJunction = (node, grid = MAZE_ASCII) => exitsOf(node, grid).length >= 3

/**
 * Simula a rota seguindo as instruções nos cruzamentos.
 * Retorna os cruzamentos esperados (com direção de chegada) e o fim.
 */
export function simulateRoute(round, grid = MAZE_ASCII) {
  let pos = findChar(round.start, grid)
  let h = round.heading
  const junctions = []
  let k = 0
  for (let guard = 0; guard < 200; guard++) {
    if (!isFloor(pos.x + VEC[h][0], pos.y + VEC[h][1], grid))
      throw new Error(`Parede em ${pos.x},${pos.y} rumo ${h}`)
    pos = { x: pos.x + VEC[h][0] * 2, y: pos.y + VEC[h][1] * 2 }
    const exits = exitsOf(pos, grid)
    if (exits.length === 1) return { junctions, end: pos, endHeading: h, used: k }
    if (exits.length >= 3) {
      const instr = round.instructions[k++]
      if (!instr) throw new Error(`Instruções acabaram em ${pos.x},${pos.y}`)
      const out = turn(h, instr)
      if (!exits.includes(out))
        throw new Error(`Saída ${out} bloqueada em ${pos.x},${pos.y}`)
      junctions.push({ node: pos, headingIn: h, instr, headingOut: out })
      h = out
    } else {
      h = exits.includes(h) ? h : exits.find((d) => d !== opposite(h))
    }
  }
  throw new Error('Rota sem fim')
}

/** Portas laterais do salão final: posição + lado relativo à chegada. */
export function doorsAt(goalNode, arrivalHeading) {
  return ['W', 'E', 'N', 'S']
    .filter((d) => d !== arrivalHeading && d !== opposite(arrivalHeading))
    .map((d) => ({
      dir: d,
      x: goalNode.x + VEC[d][0],
      y: goalNode.y + VEC[d][1],
      side: relativeOf(arrivalHeading, d) // 'left' | 'right'
    }))
}
