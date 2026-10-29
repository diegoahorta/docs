// Gera toda a arte procedural e, se configurado, carrega o spritesheet oficial do Pongo.
import * as Phaser from 'phaser'
import { registerArt } from '../art/register.js'
import { bus } from '../core/events.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    this.load.json('manifest', 'assets/manifest.json')
    this.load.on('loaderror', (file) =>
      console.warn(`[boot] asset opcional ausente: ${file.key}`)
    )
  }

  create() {
    const manifest = this.cache.json.get('manifest') ?? {}
    const official = manifest.pongo
    if (official?.image && official.animations) {
      this.load.image('pongo-official', official.image)
      this.load.once('complete', () =>
        this.finish(this.textures.exists('pongo-official') ? official : null)
      )
      this.load.start()
    } else {
      this.finish(null)
    }
  }

  finish(override) {
    registerArt(this, override)
    bus.emit('boot:ready')
    this.scene.start('Title')
  }
}
