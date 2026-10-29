// VERB RUNNER: Pongo corre sozinho; o jogador pula para coletar o verbo pedido.
import * as Phaser from 'phaser'
import { GAME_W, GAME_H, GROUND_Y } from '../core/constants.js'
import { buildParallax } from './parallax.js'
import { Pongo } from '../entities/Pongo.js'
import { InputSystem } from '../systems/inputSystem.js'
import { muteLearn } from '../systems/actionSystem.js'
import { MVP_VERBS } from '../core/content.js'
import { markRecognized, recordError, addScore } from '../core/store.js'
import { bus } from '../core/events.js'
import { sfx } from '../core/audio.js'
import { speak } from '../core/tts.js'
import { toast, isBlocking } from '../ui/ui.js'
import { FONT } from '../art/canvas.js'

const ROUNDS = 5
const WORLD = 60000

const shuffle = (a) => Phaser.Utils.Array.Shuffle([...a])

export class RunnerScene extends Phaser.Scene {
  constructor() {
    super('Runner')
  }

  create() {
    muteLearn(true)
    this.events.once('shutdown', () => muteLearn(false))
    this.physics.world.setBounds(0, -400, WORLD, GAME_H + 400)
    this.updateParallax = buildParallax(this, WORLD, { houses: false })
    this.ground = this.add
      .tileSprite(0, GROUND_Y - 14, GAME_W, 140, 'ground')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(5)
    this.fence = this.add
      .tileSprite(0, GROUND_Y - 66, GAME_W, 72, 'fence')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(2)
    const floor = this.add
      .rectangle(0, GROUND_Y, WORLD, 200)
      .setOrigin(0)
      .setVisible(false)
    this.physics.add.existing(floor, true)

    this.pongo = new Pongo(this, 200, GROUND_Y)
    this.physics.add.collider(this.pongo.zone, floor)
    this.cameras.main.setBounds(0, 0, WORLD, GAME_H)
    this.cameras.main.startFollow(this.pongo.zone, true, 1, 0.1, -320, 60)
    this.cameras.main.fadeIn(400, 255, 255, 255)
    this.inputSys = new InputSystem(this)

    this.targets = Phaser.Utils.Array.Shuffle(
      MVP_VERBS.filter((v) => v.id !== 'hairu')
    ).slice(0, ROUNDS)
    this.round = 0
    this.score = 0
    this.firstTry = true
    this.bubbles = []
    this.finished = false

    this.banner = this.add
      .text(GAME_W / 2, 150, '', {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: '800',
        color: '#4b4566',
        backgroundColor: '#ffffffee',
        padding: { x: 20, y: 10 },
        align: 'center'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60)
    this.counter = this.add
      .text(24, 110, '', {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: '800',
        color: '#ffffff',
        stroke: '#4b4566',
        strokeThickness: 6
      })
      .setScrollFactor(0)
      .setDepth(60)
    const exit = this.add
      .text(GAME_W - 24, 110, '✕ Sair', {
        fontFamily: FONT,
        fontSize: '20px',
        fontStyle: '800',
        color: '#4b4566',
        backgroundColor: '#ffffffdd',
        padding: { x: 12, y: 6 }
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(60)
      .setInteractive({ useHandCursor: true })
    exit.on('pointerdown', () => this.finish(null))
    this.sparks = this.add
      .particles(0, 0, 'sparkle', {
        speed: { min: 80, max: 240 },
        lifespan: 700,
        scale: { start: 1.1, end: 0 },
        emitting: false
      })
      .setDepth(55)
    this.spawnWave()
  }

  spawnWave() {
    this.bubbles.forEach((b) => b.c.destroy())
    this.bubbles = []
    const target = this.targets[this.round]
    this.banner.setText(`Colete o verbo: “${target.meaning.split(',')[0]}”`)
    this.tweens.add({
      targets: this.banner,
      scale: { from: 1.25, to: 1 },
      duration: 350,
      ease: 'Back.Out'
    })
    this.counter.setText(`${this.round + 1} / ${ROUNDS}   ⭐ ${this.score}`)
    const others = shuffle(MVP_VERBS.filter((v) => v.id !== target.id)).slice(0, 2)
    const order = shuffle([target, ...others])
    const baseX = this.pongo.x + 950
    order.forEach((verb, i) => {
      const high = (i + this.round) % 2 === 1
      const x = baseX + i * 330
      const y = high ? GROUND_Y - 175 : GROUND_Y - 60
      const g = this.add.graphics()
      g.fillStyle(0xffffff, 0.95).fillCircle(0, 0, 50)
      g.lineStyle(5, 0x8fd3f4).strokeCircle(0, 0, 50)
      g.fillStyle(0xffffff, 0.7).fillEllipse(-18, -24, 22, 12)
      const kanji = this.add
        .text(0, 8, verb.kanji, {
          fontFamily: FONT,
          fontSize: '30px',
          fontStyle: '800',
          color: '#e0607e'
        })
        .setOrigin(0.5)
      const kana = this.add
        .text(0, -24, verb.kana, {
          fontFamily: FONT,
          fontSize: '13px',
          fontStyle: '700',
          color: '#7a6f99'
        })
        .setOrigin(0.5)
      const c = this.add.container(x, y, [g, kanji, kana]).setDepth(30)
      this.tweens.add({
        targets: c,
        y: y - 12,
        duration: 900 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      })
      this.bubbles.push({ c, verb, alive: true })
    })
  }

  collect(b) {
    const target = this.targets[this.round]
    b.alive = false
    if (b.verb.id === target.id) {
      sfx('correct')
      speak(`{${b.verb.kanji}|${b.verb.kana}}`)
      this.sparks.explode(20, b.c.x, b.c.y)
      markRecognized(target.id)
      addScore(this.firstTry ? 25 : 10)
      if (this.firstTry) this.score++
      this.bubbles.forEach((x) => (x.alive = false))
      this.tweens.add({ targets: b.c, scale: 1.6, alpha: 0, duration: 300 })
      this.round++
      this.firstTry = true
      if (this.round >= ROUNDS) return this.finish({ score: this.score, total: ROUNDS })
      this.time.delayedCall(700, () => this.spawnWave())
    } else {
      sfx('wrong')
      this.firstTry = false
      recordError('runner', target.id)
      this.tweens.add({ targets: b.c, alpha: 0.25, scale: 0.8, duration: 250 })
      toast(
        `${b.verb.kanji}（${b.verb.kana}）= ${b.verb.meaning}. Procure “${target.meaning.split(',')[0]}”!`,
        { icon: '💭', type: 'error', dur: 3 }
      )
    }
  }

  finish(result) {
    if (this.finished) return
    this.finished = true
    this.banner.setText(
      result
        ? `すごい！ ${result.score}/${result.total} de primeira!`
        : 'Até a próxima corrida!'
    )
    this.pongo.freeze()
    this.pongo.play('celebrate')
    this.time.delayedCall(result ? 1500 : 300, () => {
      this.cameras.main.fadeOut(300, 255, 255, 255)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        bus.emit('runner:done', result)
        this.scene.stop()
      })
    })
  }

  update(time, dt) {
    const raw = this.inputSys.read()
    this.updateParallax()
    const sx = this.cameras.main.scrollX
    this.ground.tilePositionX = sx
    this.fence.tilePositionX = sx
    if (this.finished || isBlocking()) return
    this.pongo.update(
      { right: true, run: true, left: false, jump: raw.jump, jumpHeld: raw.jumpHeld },
      dt
    )
    const p = this.pongo
    const cx = p.x
    const cy = p.body.center.y
    for (const b of this.bubbles) {
      if (b.alive && Phaser.Math.Distance.Between(cx, cy, b.c.x, b.c.y) < 66)
        this.collect(b)
    }
    const last = this.bubbles[this.bubbles.length - 1]
    if (
      last &&
      last.c.x < cx - 260 &&
      this.bubbles.some((b) => b.alive) &&
      this.round < ROUNDS
    ) {
      this.firstTry = false
      toast('Ops, passou! Pule (Espaço) para pegar as bolhas no alto.', {
        icon: '🔁',
        dur: 2.4
      })
      this.spawnWave()
    }
  }
}
