// Personagem não jogável com animação idle e marcador de missão.
import Phaser from 'phaser'
import { FONT_FAMILY } from '../config/gameConfig.js'

export class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, id, x, y, texture = `npc-${id}`) {
    super(scene, x, y, texture, 0)
    this.id = id
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.setOrigin(0.5, 1)
    this.body.setSize(12, 6).setOffset((this.width - 12) / 2, this.height - 7)
    this.body.updateFromGameObject?.()
    this.refreshBody?.()
    this.shadow = scene.add
      .image(x, y, 'shadow')
      .setOrigin(0.5, 0.6)
      .setDepth(9 + y)
    this.setDepth(10 + y)
    const key = `${texture}-idle`
    if (!scene.anims.exists(key))
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: 1 }),
        frameRate: 2,
        repeat: -1
      })
    this.play({ key, delay: Math.random() * 500 })
    this.marker = scene.add
      .text(x, y - this.height - 4, '！', {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: '#ffe14d',
        stroke: '#1b1530',
        strokeThickness: 3,
        resolution: 2
      })
      .setOrigin(0.5, 1)
      .setDepth(6000)
      .setVisible(false)
    scene.tweens.add({
      targets: this.marker,
      y: this.marker.y - 3,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    })
  }

  setQuest(on) {
    this.marker.setVisible(on)
  }

  setShown(on) {
    this.setVisible(on)
    this.shadow.setVisible(on)
    this.body.enable = on
    if (!on) this.marker.setVisible(false)
  }

  destroy(fromScene) {
    this.shadow?.destroy()
    this.marker?.destroy()
    super.destroy(fromScene)
  }
}
