// Cena de puzzle: pausa o mundo e executa um conjunto de desafios.
import Phaser from 'phaser'
import { runPuzzles } from '../ui/puzzles/PuzzleRunner.js'

export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super('Puzzle')
  }

  create({ config, from, resolve }) {
    if (from) this.scene.pause(from)
    runPuzzles(config).then((result) => {
      if (from) this.scene.resume(from)
      this.scene.stop()
      resolve?.(result)
    })
  }
}
