// Menu: abertura ODU Creative, título, seleção de fases e história.
// Ao fundo, a cidade em pixel art com Pongo passeando.
import Phaser from 'phaser'
import { ZOOM, TILE } from '../config/gameConfig.js'
import { buildCityTiles, BUILDINGS } from '../maps/cityMap.js'
import { state } from '../systems/GameState.js'
import { saves } from '../systems/SaveSystem.js'
import { audio } from '../systems/AudioSystem.js'
import { quest } from '../systems/QuestSystem.js'
import { hud } from '../ui/HUD.js'
import { touch } from '../ui/TouchControls.js'
import { brandSplash, mainMenu, storyIntro } from '../ui/MenuUI.js'
import { createPongoAnims } from '../entities/Player.js'

let splashShown = false

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu')
  }

  create() {
    hud.show(false)
    touch.show(false)
    audio.stopMusic()
    const map = this.make.tilemap({
      data: buildCityTiles(),
      tileWidth: TILE,
      tileHeight: TILE
    })
    map.createLayer(0, map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0), 0, 0)
    BUILDINGS.forEach((b) =>
      this.add.image(b.rect.x * TILE, b.rect.y * TILE, `bld-${b.id}`).setOrigin(0, 0)
    )
    createPongoAnims(this)
    const pongo = this.add
      .sprite(20 * TILE, 12.9 * TILE, 'pongo')
      .setOrigin(0.5, 1)
      .setDepth(10)
    pongo.play('pongo-walk-right')
    this.tweens.add({
      targets: pongo,
      x: 44 * TILE,
      duration: 14000,
      yoyo: true,
      repeat: -1,
      onYoyo: () => pongo.play('pongo-walk-left'),
      onRepeat: () => pongo.play('pongo-walk-right')
    })
    const cam = this.cameras.main.setZoom(ZOOM)
    cam.centerOn(22 * TILE, 9 * TILE)
    this.tweens.add({
      targets: cam,
      scrollX: cam.scrollX + 20 * TILE,
      duration: 16000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    })
    this.flow()
  }

  async flow() {
    if (!splashShown) {
      splashShown = true
      await brandSplash()
    }
    const choice = await mainMenu()
    audio.ensure()
    if (choice.action === 'continue') {
      saves.load()
      return this.enterWorld()
    }
    if (choice.action === 'new') {
      saves.reset()
      quest.startPhase(1)
      state.progress.pos = null
      await storyIntro()
      return this.enterWorld()
    }
    if (choice.action === 'phase') {
      quest.startPhase(choice.phase)
      state.progress.pos = null
      state.progress.finished = false
      return this.enterWorld()
    }
  }

  enterWorld() {
    this.cameras.main.fadeOut(300, 27, 21, 48)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('City', {}))
  }
}
