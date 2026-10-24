// Boot: carrega a fonte japonesa em pixel e inicializa sistemas globais.
import Phaser from 'phaser'
import { saves } from '../systems/SaveSystem.js'
import { input } from '../systems/InputSystem.js'
import { ui } from '../ui/UIManager.js'
import { hud } from '../ui/HUD.js'
import { touch } from '../ui/TouchControls.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  async create() {
    saves.load()
    input.init()
    ui.init()
    hud.init()
    touch.init()
    try {
      await Promise.race([
        document.fonts.load('16px "DotGothic16"', '北南東西駅学校ことば'),
        new Promise((r) => setTimeout(r, 2500))
      ])
    } catch {
      /* segue com a fonte de fallback */
    }
    this.scene.start('Preload')
  }
}
