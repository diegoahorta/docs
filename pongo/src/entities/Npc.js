// NPC canino: sprite animado, plaquinha com o nome e indicador "!" quando há algo novo.
import { charInfo } from '../art/register.js'
import { plain } from '../lang/ruby.js'
import { NPCS } from '../core/content.js'
import { FONT } from '../art/canvas.js'

export class Npc {
  constructor(scene, id, x, groundY, { flip = true } = {}) {
    this.scene = scene
    this.id = id
    this.x = x
    this.y = groundY
    this.sprite = scene.add
      .sprite(x, groundY, id, 'idle_0')
      .setOrigin(0.5, charInfo(id).originY)
      .setScale(charInfo(id).scale)
      .setFlipX(flip)
      .setDepth(15)
    this.sprite.play(`${id}-idle`)
    const npc = NPCS[id]
    this.label = scene.add
      .text(x, groundY - 118, `${plain(npc.name)} · ${npc.namePt}`, {
        fontFamily: FONT,
        fontSize: '15px',
        fontStyle: '700',
        color: '#4b4566',
        backgroundColor: 'rgba(255,255,255,0.85)',
        padding: { x: 8, y: 3 }
      })
      .setOrigin(0.5)
      .setDepth(16)
    this.alert = scene.add
      .text(x + 34, groundY - 96, '!', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: '800',
        color: '#ff6b8a',
        stroke: '#ffffff',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(16)
    scene.tweens.add({
      targets: this.alert,
      y: '-=8',
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    })
  }

  setAlert(on) {
    this.alert.setVisible(on)
  }

  talk(on) {
    this.sprite.play(`${this.id}-${on ? 'talk' : 'idle'}`, true)
  }

  happy() {
    this.sprite.play(`${this.id}-happy`, true)
    this.scene.time.delayedCall(1800, () => this.sprite.play(`${this.id}-idle`, true))
  }

  faceTowards(x) {
    this.sprite.setFlipX(x < this.x)
  }
}
