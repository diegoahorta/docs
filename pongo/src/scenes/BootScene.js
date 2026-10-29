// Carrega a arte oficial (sprites ilustrados) e gera cenário e reservas procedurais.
import * as Phaser from 'phaser'
import { registerArt } from '../art/register.js'
import { loadImported } from '../art/imported.js'
import { bus } from '../core/events.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  create() {
    loadImported().then((images) => {
      for (const [id, img] of Object.entries(images)) {
        if (!img)
          console.warn(`[boot] sprite "${id}" indisponível; usando a arte procedural`)
      }
      registerArt(this, images)
      bus.emit('boot:ready')
      this.scene.start('Title')
    })
  }
}
