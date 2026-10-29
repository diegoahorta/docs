// Pongo: corpo físico (zona invisível) + sprite visual sincronizado.
// Separar os dois permite squash & stretch sem afetar as colisões.
import * as Phaser from 'phaser'
import { ART_SCALE, CHAR_FRAME } from '../art/register.js'
import { GRAVITY } from '../core/constants.js'
import { learn } from '../systems/actionSystem.js'
import { sfx } from '../core/audio.js'
import { setting } from '../core/store.js'

const BASE = 1 / ART_SCALE
const W = 54
const H = 64

export class Pongo {
  constructor(scene, x, groundY) {
    this.scene = scene
    this.zone = scene.add.zone(x, groundY - H / 2, W, H)
    scene.physics.add.existing(this.zone)
    this.body = this.zone.body
    this.body.setCollideWorldBounds(true)
    this.body.setMaxVelocity(700, 1200)
    this.sprite = scene.add
      .sprite(x, groundY, 'pongo', 'idle_0')
      .setOrigin(0.5, CHAR_FRAME.footY / CHAR_FRAME.h)
      .setScale(BASE)
      .setDepth(20)
    this.shadow = scene.add.ellipse(x, groundY, 50, 10, 0x5f7f6a, 0.22).setDepth(19)
    this.facing = 1
    this.busy = false
    this.inWater = false
    this.coyote = 0
    this.jumpBuffer = 0
    this.airTime = 0
    this.idleTime = 0
    this.wasOnGround = true
    this.state = 'idle'
    this.attached = null
    this.dust = scene.add.particles(0, 0, 'dust', {
      lifespan: 420,
      speed: { min: 20, max: 70 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.8, end: 0 },
      gravityY: -40,
      emitting: false
    })
    this.dust.setDepth(19)
    this.splash = scene.add.particles(0, 0, 'bubble', {
      lifespan: 700,
      speed: { min: 60, max: 180 },
      angle: { min: 230, max: 310 },
      scale: { start: 1.2, end: 0.2 },
      gravityY: 500,
      emitting: false
    })
    this.splash.setDepth(26)
    scene.events.on('postupdate', this.sync, this)
    scene.events.once('shutdown', () => scene.events.off('postupdate', this.sync, this))
    this.play('idle')
  }

  get x() {
    return this.zone.x
  }
  get feetY() {
    return this.body.bottom
  }
  get onGround() {
    return this.body.blocked.down || this.body.touching.down
  }

  play(name, ignoreIfPlaying = true) {
    let key = `pongo-${name}`
    if (!this.scene.anims.exists(key)) key = 'pongo-idle'
    this.sprite.play(key, ignoreIfPlaying)
  }

  face(dir) {
    if (!dir) return
    this.facing = dir
    this.sprite.setFlipX(dir < 0)
  }

  /** Efeito de squash & stretch no sprite visual. */
  squash(sx, sy, dur = 160) {
    if (setting('reducedMotion')) return
    this.scene.tweens.killTweensOf(this.sprite)
    this.sprite.setScale(BASE * sx, BASE * sy)
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: BASE,
      scaleY: BASE,
      duration: dur,
      ease: 'Back.Out'
    })
  }

  sync() {
    const b = this.body
    if (this.attached) {
      const { obj, dx = 0, dy = 0 } = this.attached
      this.sprite.setPosition(obj.x + dx, obj.y + dy)
    } else {
      this.sprite.setPosition(b.center.x, b.bottom + (this.state === 'swim' ? 22 : 0))
    }
    this.shadow.setVisible(!this.inWater && !this.attached)
    this.shadow.setPosition(b.center.x, this.groundUnder ?? b.bottom)
    const h = Math.max(0, (this.groundUnder ?? b.bottom) - b.bottom)
    this.shadow.setScale(Math.max(0.3, 1 - h / 300))
  }

  halt() {
    if (this.body.enable) this.body.setVelocityX(0)
    if (!this.busy && this.onGround && this.state !== 'idle') {
      this.state = 'idle'
      this.play('idle')
    }
  }

  /** Coloca o Pongo em uma ação roteirizada (sentar, comer...). */
  freeze(x, y) {
    this.busy = true
    this.body.setVelocity(0, 0)
    this.body.setAllowGravity(false)
    if (x != null) this.body.reset(x, y - H / 2)
  }

  release() {
    this.attached = null
    this.busy = false
    this.body.setAllowGravity(true)
    this.state = 'idle'
    this.play('idle')
  }

  /** Executa uma animação por um tempo (ms) e chama onDone. */
  perform(anim, ms, onDone) {
    this.busy = true
    this.body.setVelocityX(0)
    this.play(anim, false)
    this.scene.time.delayedCall(ms, () => {
      onDone?.()
    })
  }

  respawn(x, y) {
    this.attached = null
    this.inWater = false
    this.busy = false
    this.body.setAllowGravity(true)
    this.body.reset(x, y - H / 2)
    this.state = 'idle'
    this.play('idle')
    this.sprite.setAlpha(0)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      duration: 400,
      repeat: 2,
      yoyo: false
    })
  }

  update(input, dt) {
    const b = this.body
    if (this.busy) {
      if (b.enable) b.setVelocityX(0)
      return
    }
    const onGround = this.onGround
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const running = input.run && dir !== 0
    const maxV = this.inWater ? 160 : running ? 340 : 180
    const k = 1 - Math.pow(1 - (onGround || this.inWater ? 0.28 : 0.12), dt / 16.67)
    b.setVelocityX(Phaser.Math.Linear(b.velocity.x, dir * maxV, k))
    if (Math.abs(b.velocity.x) < 4 && !dir) b.setVelocityX(0)
    this.face(dir)

    this.coyote = onGround ? 110 : this.coyote - dt
    this.jumpBuffer = input.jump ? 140 : this.jumpBuffer - dt

    if (this.inWater) {
      b.setAllowGravity(false)
      const surface = this.waterSurface ?? b.bottom
      const target = input.jumpHeld ? -170 : b.bottom > surface + 46 ? -90 : 30
      b.setVelocityY(Phaser.Math.Linear(b.velocity.y, target, 0.08))
      if ((this.jumpBuffer > 0 || input.jumpHeld) && b.top < surface + 6) {
        b.setAllowGravity(true)
        b.setVelocityY(-620)
        this.jumpBuffer = 0
        this.splash.explode(10, this.x, surface)
        sfx('splash')
      }
    } else {
      b.setAllowGravity(true)
      if (this.jumpBuffer > 0 && this.coyote > 0) {
        b.setVelocityY(-650)
        this.coyote = 0
        this.jumpBuffer = 0
        this.squash(0.82, 1.2)
        this.dust.explode(6, this.x, b.bottom)
        sfx('jump')
        this.play('jump', false)
        learn('jump')
      }
      if (!input.jumpHeld && b.velocity.y < -280) b.setVelocityY(-280)
    }

    if (onGround && !this.wasOnGround && this.airTime > 160) {
      this.squash(1.22, 0.8, 220)
      this.dust.explode(8, this.x, b.bottom)
      sfx('land')
    }
    this.airTime = onGround || this.inWater ? 0 : this.airTime + dt
    this.wasOnGround = onGround

    let state
    if (this.inWater) state = 'swim'
    else if (!onGround) state = b.velocity.y < 0 ? 'jump' : 'fall'
    else if (Math.abs(b.velocity.x) > 25) state = running ? 'run' : 'walk'
    else state = 'idle'

    if (state !== this.state) {
      const prev = this.state
      this.state = state
      if (state !== 'jump') this.play(state)
      if (state === 'walk' || state === 'run' || state === 'swim') learn(state)
      if (state === 'swim' && prev !== 'swim') {
        this.splash.explode(14, this.x, this.waterSurface ?? b.bottom)
        sfx('splash')
      }
    }
    if (state === 'run' && Math.random() < 0.25)
      this.dust.emitParticleAt(this.x - this.facing * 20, b.bottom, 1)
    if (state === 'fall' && this.airTime > 700 && !this.fallLearned) {
      this.fallLearned = true
      learn('fall')
    }
    if (onGround) this.fallLearned = false
    this.idleTime = state === 'idle' ? this.idleTime + dt : 0
    if (this.idleTime > 6000) {
      this.idleTime = -30000
      learn('idle')
    }
  }
}

export { GRAVITY }
