// Cena de diálogo: pausa o mundo e conduz a caixa de diálogo (DOM).
import Phaser from 'phaser'
import { DialogueBox } from '../ui/DialogueBox.js'

export class DialogueScene extends Phaser.Scene {
  constructor() {
    super('Dialogue')
  }

  create({ script, from, resolve, onItem }) {
    if (from) this.scene.pause(from)
    const box = new DialogueBox()
    box.play(script, { onItem }).then((result) => {
      if (from) this.scene.resume(from)
      this.scene.stop()
      resolve?.(result)
    })
  }
}
