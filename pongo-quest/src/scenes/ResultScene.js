// Tela de conclusão com estatísticas de aprendizagem.
import Phaser from 'phaser'
import { learning } from '../education/LearningTracker.js'
import { resultScreen } from '../ui/MenuUI.js'
import { ui } from '../ui/UIManager.js'
import { confetti } from '../animations/fx.js'
import { audio } from '../systems/AudioSystem.js'
import { bus } from '../systems/EventBus.js'

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result')
  }

  create({ from }) {
    if (from) this.scene.pause(from)
    ui.lockInput()
    audio.sfx('fanfare')
    confetti(120)
    resultScreen({
      stats: learning.summary(),
      onExplore: () => {
        ui.unlockInput()
        if (from) this.scene.resume(from)
        this.scene.stop()
      },
      onMenu: () => {
        ui.unlockInput()
        this.scene.stop()
        bus.emit('game:menu')
      }
    })
  }
}
