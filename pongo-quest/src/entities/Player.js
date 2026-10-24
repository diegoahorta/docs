// Pongo: movimentação em 4 direções com animações idle/walk.
import Phaser from 'phaser'
import { PLAYER_SPEED } from '../config/gameConfig.js'
import { VEC } from '../systems/DirectionSystem.js'
import { bus } from '../systems/EventBus.js'
import { audio } from '../systems/AudioSystem.js'

const ROW = { S: 'down', W: 'left', E: 'right', N: 'up' }

export function createPongoAnims(scene) {
  if (scene.anims.exists('pongo-walk-down')) return
  Object.values(ROW).forEach((row) => {
    scene.anims.create({
      key: `pongo-walk-${row}`,
      frames: [0, 1, 2, 3].map((i) => ({ key: 'pongo', frame: `${row}-${i}` })),
      frameRate: 8,
      repeat: -1
    })
  })
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, facing = 'S') {
    super(scene, x, y, 'pongo', `${ROW[facing]}-0`)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setOrigin(0.5, 1)
    this.body.setSize(10, 6).setOffset(3, 12)
    this.setCollideWorldBounds(true)
    this.shadow = scene.add.image(x, y, 'shadow').setOrigin(0.5, 0.6)
    this.facing = facing
    this.stepTimer = 0
    createPongoAnims(scene)
  }

  face(dir) {
    if (!dir) return
    this.facing = dir
    this.setFrame(`${ROW[dir]}-0`)
    bus.emit('player:facing', dir)
  }

  /** dir: 'N' | 'S' | 'E' | 'W' | null */
  move(dir, delta) {
    if (!dir) {
      this.setVelocity(0, 0)
      this.anims.stop()
      this.setFrame(`${ROW[this.facing]}-0`)
    } else {
      if (dir !== this.facing) {
        this.facing = dir
        bus.emit('player:facing', dir)
      }
      const [vx, vy] = VEC[dir]
      this.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED)
      this.anims.play(`pongo-walk-${ROW[dir]}`, true)
      this.stepTimer += delta
      if (this.stepTimer > 280) {
        this.stepTimer = 0
        audio.sfx('step')
      }
    }
    this.setDepth(10 + this.y)
    this.shadow.setPosition(this.x, this.y).setDepth(9 + this.y)
  }

  /** Ponto logo à frente de Pongo (para interações). */
  frontPoint(dist = 10) {
    const [vx, vy] = VEC[this.facing]
    return { x: this.x + vx * dist, y: this.y - 4 + vy * dist }
  }

  destroy(fromScene) {
    this.shadow?.destroy()
    super.destroy(fromScene)
  }
}
