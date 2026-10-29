// FASE 1 — 公園の冒険 (A Aventura no Parque)
import * as Phaser from 'phaser'
import { gsap } from 'gsap'
import { GAME_W, GAME_H, GROUND_Y, WORLD_W } from '../core/constants.js'
import { buildParallax } from './parallax.js'
import { Pongo } from '../entities/Pongo.js'
import { Npc } from '../entities/Npc.js'
import { InputSystem } from '../systems/inputSystem.js'
import { learn } from '../systems/actionSystem.js'
import { bus } from '../core/events.js'
import { sfx } from '../core/audio.js'
import * as store from '../core/store.js'
import { LEVELS, NPCS, INTRO, SENTENCES, VERB } from '../core/content.js'
import { isBlocking, toast, flyToHud, confetti, openModal } from '../ui/ui.js'
import { h, button } from '../ui/dom.js'
import { showHud, hideHud } from '../ui/hud.js'
import { showTouch, hideTouch, isTouchDevice } from '../ui/touch.js'
import { dialogue } from '../ui/dialogue.js'
import { actionMatch } from '../ui/activities/actionMatch.js'
import { sentenceBuilder } from '../ui/activities/sentenceBuilder.js'
import { verbTransformer } from '../ui/activities/verbTransformer.js'
import { actionBoss } from '../ui/activities/actionBoss.js'
import { openVictory } from '../ui/screens/victory.js'
import { FONT } from '../art/canvas.js'
import { charInfo } from '../art/register.js'

const LEVEL = 'park'
const POND = [4780, 5180]
const RIVER = [5520, 5880]
const CRYSTAL_COLORS = ['#ff9fd0', '#8fe3ff', '#ffd35c', '#a8e6a3', '#c7a8ff']

export class ParkScene extends Phaser.Scene {
  constructor() {
    super('Park')
  }

  create() {
    if (store.level(LEVEL).completed && !store.level(LEVEL).inProgress)
      store.resetLevelRun(LEVEL)
    store.level(LEVEL).inProgress = true
    this.offs = []
    this.busyScript = false
    this.grace = 0
    this.interactables = []

    this.physics.world.setBounds(0, -600, WORLD_W, GAME_H + 1200)
    this.physics.world.setBoundsCollision(true, true, false, false)
    this.updateParallax = buildParallax(this, WORLD_W)
    this.solids = this.physics.add.staticGroup()
    this.oneWay = this.physics.add.staticGroup()

    this.buildGround()
    this.buildDecor()
    this.buildPlayground()
    this.buildPlatforms()
    this.buildPortal()
    this.buildNpcs()

    this.pongo = new Pongo(this, 160, GROUND_Y)
    this.physics.add.collider(this.pongo.zone, this.solids)
    this.physics.add.collider(
      this.pongo.zone,
      this.oneWay,
      null,
      (z, p) => z.body.velocity.y >= 0 && z.body.bottom <= p.body.top + 14
    )
    this.physics.add.collider(this.ball, this.solids)

    const cam = this.cameras.main
    cam.setBounds(0, 0, WORLD_W, GAME_H)
    cam.startFollow(this.pongo.zone, true, 0.09, 0.09, 0, 60)
    cam.setDeadzone(140, 160)
    cam.fadeIn(500, 255, 255, 255)

    this.inputSys = new InputSystem(this)
    this.buildPrompt()
    showHud(LEVEL)
    showTouch()

    this.offs.push(
      bus.on('ui:blocking', (b) => {
        if (b) this.physics.world.pause()
        else {
          this.physics.world.resume()
          this.grace = 250
        }
      })
    )
    this.events.once('shutdown', () => this.cleanup())
    this.events.on('resume', () => {
      this.grace = 300
      showTouch()
    })

    this.restoreProgress()
    if (!store.hasFlag('introSeen')) this.time.delayedCall(600, () => this.intro())
    else
      toast(
        isTouchDevice()
          ? 'Use ◀ ▶, 跳 (pular), 走 (correr) e ✋ (interagir).'
          : 'A/D andar · Espaço pular · Shift correr · E interagir',
        { icon: '🎮', dur: 4 }
      )
  }

  cleanup() {
    this.offs.forEach((f) => f())
    this.offs = []
    hideHud()
    hideTouch()
    this.tweens.killAll()
    this.time.removeAllEvents()
  }

  // ------------------------------------------------------------------ mundo
  solid(x, y, w, h) {
    const r = this.add.rectangle(x, y, w, h).setOrigin(0).setVisible(false)
    this.solids.add(r)
    return r
  }

  groundStrip(x0, x1) {
    this.add
      .tileSprite(x0, GROUND_Y - 14, x1 - x0, 140, 'ground')
      .setOrigin(0)
      .setDepth(5)
    this.solid(x0, GROUND_Y, x1 - x0, 300)
  }

  buildGround() {
    this.groundStrip(0, POND[0])
    this.groundStrip(POND[1], RIVER[0])
    this.groundStrip(RIVER[1], WORLD_W)
    // lago (nadar)
    const pw = POND[1] - POND[0]
    this.add
      .rectangle(POND[0], GROUND_Y + 10, pw, 200, 0xe6b67f)
      .setOrigin(0)
      .setDepth(4)
    this.add
      .rectangle(POND[0], GROUND_Y + 100, pw, 30, 0xd9a46a)
      .setOrigin(0)
      .setDepth(4)
    this.solid(POND[0], GROUND_Y + 100, pw, 200)
    this.water = this.add
      .tileSprite(POND[0], GROUND_Y + 2, pw, 130, 'water')
      .setOrigin(0)
      .setDepth(25)
      .setAlpha(0.88)
    for (const x of [POND[0] - 10, POND[1] + 10])
      this.add.image(x, GROUND_Y + 8, 'rock').setDepth(26)
    this.add
      .text(POND[0] + pw / 2, GROUND_Y - 40, '池 いけ', {
        fontFamily: FONT,
        fontSize: '18px',
        fontStyle: '700',
        color: '#2f7fc0'
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0.8)
    // rio (precisa da ponte)
    const rw = RIVER[1] - RIVER[0]
    this.river = this.add
      .tileSprite(RIVER[0], GROUND_Y + 40, rw, 120, 'river')
      .setOrigin(0)
      .setDepth(4)
    this.add
      .rectangle(RIVER[0] - 4, GROUND_Y + 14, 8, 200, 0xd9a46a)
      .setOrigin(0)
      .setDepth(5)
    this.add
      .rectangle(RIVER[1] - 4, GROUND_Y + 14, 8, 200, 0xd9a46a)
      .setOrigin(0)
      .setDepth(5)
    this.add
      .text(RIVER[0] + rw / 2, GROUND_Y + 70, '川 かわ', {
        fontFamily: FONT,
        fontSize: '18px',
        fontStyle: '700',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(5)
      .setAlpha(0.8)
  }

  buildDecor() {
    this.add
      .tileSprite(0, GROUND_Y - 66, POND[0], 72, 'fence')
      .setOrigin(0)
      .setDepth(2)
    this.add
      .tileSprite(POND[1], GROUND_Y - 66, RIVER[0] - POND[1], 72, 'fence')
      .setOrigin(0)
      .setDepth(2)
    this.add
      .tileSprite(RIVER[1], GROUND_Y - 66, WORLD_W - RIVER[1], 72, 'fence')
      .setOrigin(0)
      .setDepth(2)
    const trees = [
      [560, 0],
      [1080, 1],
      [1980, 0],
      [2470, 1],
      [3290, 0],
      [3640, 1],
      [4400, 0],
      [5330, 1],
      [6020, 0],
      [6600, 1]
    ]
    for (const [x, k] of trees) {
      const t = this.add
        .image(x, GROUND_Y + 4, `tree${k}`)
        .setOrigin(0.5, 1)
        .setDepth(3)
      this.tweens.add({
        targets: t,
        angle: { from: -0.8, to: 0.8 },
        duration: 2600 + (x % 900),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      })
    }
    for (const x of [1000, 2960, 4120, 5470])
      this.add
        .image(x, GROUND_Y + 2, 'lamp')
        .setOrigin(0.5, 1)
        .setDepth(3)
    this.add
      .image(330, GROUND_Y + 4, 'sign')
      .setOrigin(0.5, 1)
      .setDepth(6)
    for (let x = 80, i = 0; x < WORLD_W; x += 140 + ((i * 47) % 120), i++) {
      if (
        (x > POND[0] - 20 && x < POND[1] + 20) ||
        (x > RIVER[0] - 20 && x < RIVER[1] + 20)
      )
        continue
      const f = this.add
        .image(x, GROUND_Y + 6, `flower${i % 4}`)
        .setOrigin(0.5, 1)
        .setDepth(7)
      this.tweens.add({
        targets: f,
        angle: { from: -6, to: 6 },
        duration: 1400 + (i % 5) * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      })
    }
    for (const x of [700, 1900, 3100, 4600, 6200]) {
      const b = this.add.sprite(x, GROUND_Y - 120, 'butterfly0').setDepth(30)
      this.time.addEvent({
        delay: 140,
        loop: true,
        callback: () =>
          b.setTexture(b.texture.key === 'butterfly0' ? 'butterfly1' : 'butterfly0')
      })
      this.tweens.add({
        targets: b,
        x: x + 160,
        y: GROUND_Y - 190,
        duration: 3200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      })
    }
    for (const x of [150, 1400, 2580, 3900, 6380])
      this.add
        .image(x, GAME_H + 12, 'bush')
        .setOrigin(0.5, 1)
        .setScrollFactor(1.12)
        .setDepth(40)
        .setScale(1.2)
  }

  /** Registra um objeto interativo (tecla E / botão ✋). */
  addInteract(def) {
    this.interactables.push({ range: 90, can: () => true, ...def })
  }

  buildPlayground() {
    // gangorra
    this.add
      .image(820, GROUND_Y + 4, 'seesawBase')
      .setOrigin(0.5, 1)
      .setDepth(8)
    this.plank = this.add.image(820, GROUND_Y - 64, 'seesawPlank').setDepth(9)
    this.seesawEnd = { x: 0, y: 0 }
    this.addInteract({
      id: 'seesaw',
      x: 820,
      range: 170,
      verb: 'noru',
      y: GROUND_Y - 130,
      act: () => this.rideSeesaw()
    })

    // banco, livros, bebedouro
    this.add
      .image(2650, GROUND_Y + 4, 'bench')
      .setOrigin(0.5, 1)
      .setDepth(8)
    this.addInteract({
      id: 'bench',
      x: 2650,
      verb: 'suwaru',
      y: GROUND_Y - 120,
      act: () => this.sitBench()
    })
    this.add
      .image(2880, GROUND_Y + 4, 'bookbox')
      .setOrigin(0.5, 1)
      .setDepth(8)
    this.addInteract({
      id: 'book',
      x: 2880,
      verb: 'yomu',
      y: GROUND_Y - 170,
      act: () => this.readBook()
    })
    this.add
      .image(3120, GROUND_Y + 4, 'fountain')
      .setOrigin(0.5, 1)
      .setDepth(8)
    this.waterArc = this.add
      .image(3150, GROUND_Y - 112, 'waterArc')
      .setDepth(9)
      .setVisible(false)
    this.addInteract({
      id: 'fountain',
      x: 3120,
      verb: 'nomu',
      y: GROUND_Y - 150,
      act: () => this.drinkWater()
    })

    // balanço
    this.add
      .image(3420, GROUND_Y + 4, 'swingFrame')
      .setOrigin(0.5, 1)
      .setDepth(7)
    this.swingSeat = this.add
      .image(3420, GROUND_Y - 222, 'swingSeat')
      .setOrigin(0.5, 0)
      .setDepth(9)
    this.swingEnd = { x: 0, y: 0 }
    this.addInteract({
      id: 'swing',
      x: 3420,
      verb: 'asobu',
      y: GROUND_Y - 260,
      act: () => this.playSwing()
    })

    // piquenique
    this.add
      .image(3800, GROUND_Y + 4, 'picnic')
      .setOrigin(0.5, 1)
      .setDepth(8)
    this.add
      .image(3760, GROUND_Y - 92, 'basket')
      .setOrigin(0.5, 1)
      .setDepth(9)
    this.addInteract({
      id: 'picnic',
      x: 3800,
      range: 130,
      verb: 'taberu',
      y: GROUND_Y - 170,
      act: () => this.eatPicnic()
    })

    // escorregador, bola, bicicleta
    this.add
      .image(4240, GROUND_Y + 4, 'slide')
      .setOrigin(0.5, 1)
      .setDepth(7)
    this.slideRider = { x: 0, y: 0 }
    this.addInteract({
      id: 'slide',
      x: 4340,
      verb: 'suberu',
      y: GROUND_Y - 270,
      act: () => this.useSlide()
    })
    this.ball = this.physics.add
      .image(4500, GROUND_Y - 40, 'ball')
      .setDepth(12)
      .setBounce(0.6)
      .setDrag(120, 0)
      .setCircle(20, 4, 4)
    this.ball.body.setCollideWorldBounds(true)
    this.addInteract({
      id: 'ball',
      x: () => this.ball.x,
      range: 80,
      verb: 'keru',
      y: () => this.ball.y - 60,
      act: () => this.kickBall()
    })
    this.bike = this.add
      .image(4660, GROUND_Y + 4, 'bike')
      .setOrigin(0.5, 1)
      .setDepth(8)
    this.addInteract({
      id: 'bike',
      x: 4660,
      verb: 'noru',
      y: GROUND_Y - 130,
      act: () => this.rideBike()
    })
  }

  buildPlatforms() {
    this.platforms = [
      [1250, 505],
      [1480, 415],
      [1720, 325]
    ].map(([x, y]) => {
      const img = this.add
        .image(x, y, 'platform')
        .setOrigin(0.5, 8 / 64)
        .setDepth(8)
      const r = this.add
        .rectangle(x - 94, y, 188, 22)
        .setOrigin(0)
        .setVisible(false)
      this.oneWay.add(r)
      this.tweens.add({
        targets: img,
        y: y + 4,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      })
      return { x, y, img, lit: false }
    })
    this.add.image(1720, 260, 'glow').setDepth(7).setAlpha(0.7)
  }

  buildPortal() {
    this.portalSwirl = this.add
      .image(6450, GROUND_Y - 120, 'portalSwirl')
      .setDepth(6)
      .setAlpha(0.35)
    this.tweens.add({ targets: this.portalSwirl, angle: 360, duration: 9000, repeat: -1 })
    this.add
      .image(6450, GROUND_Y + 6, 'portalArch')
      .setOrigin(0.5, 1)
      .setDepth(7)
    this.barrier = this.add
      .image(6270, GROUND_Y + 6, 'barrier')
      .setOrigin(0.5, 1)
      .setDepth(11)
    this.barrierSolid = this.solid(6230, GROUND_Y - 400, 80, 400)
    this.silence = this.add
      .sprite(6140, GROUND_Y - 30, 'silence', 'float_0')
      .setOrigin(0.5, charInfo('silence').originY)
      .setScale(charInfo('silence').imported ? 1.1 : 0.55)
      .setDepth(14)
    this.silence.play('silence-float')
    this.tweens.add({
      targets: this.silence,
      y: GROUND_Y - 44,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    })
    this.addInteract({
      id: 'silence',
      x: 6140,
      range: 140,
      verb: null,
      label: '話す',
      sub: 'falar',
      y: GROUND_Y - 150,
      act: () => this.talkSilence()
    })
    this.crystalsAtPortal = []
  }

  buildNpcs() {
    this.npcs = {
      taro: new Npc(this, 'taro', 2250, GROUND_Y),
      momo: new Npc(this, 'momo', 4000, GROUND_Y),
      kumi: new Npc(this, 'kumi', 5400, GROUND_Y)
    }
    this.addInteract({
      id: 'taro',
      x: 2250,
      verb: 'hanasu',
      y: GROUND_Y - 150,
      act: () => this.talkTaro()
    })
    this.addInteract({
      id: 'momo',
      x: 4000,
      verb: 'hanasu',
      y: GROUND_Y - 150,
      act: () => this.talkMomo()
    })
    this.addInteract({
      id: 'kumi',
      x: 5400,
      verb: 'hanasu',
      y: GROUND_Y - 150,
      act: () => this.talkKumi()
    })
  }

  buildPrompt() {
    this.prompt = this.add
      .text(0, 0, '', {
        fontFamily: FONT,
        fontSize: '20px',
        fontStyle: '800',
        color: '#4b4566',
        align: 'center',
        backgroundColor: '#ffffff',
        padding: { x: 12, y: 6 }
      })
      .setOrigin(0.5, 1)
      .setDepth(50)
      .setVisible(false)
    this.promptFor = null
  }

  restoreProgress() {
    const done = store.level(LEVEL).missions
    if (done.includes('m2')) this.platforms.forEach((p) => this.lightPlatform(p, true))
    if (done.includes('m9')) this.buildBridge(true)
    this.refreshAlerts()
  }

  refreshAlerts() {
    const d = (m) => this.isDone(m)
    this.npcs.taro.setAlert(!d('m3') || !store.activityDone('runner'))
    this.npcs.momo.setAlert(d('m7') && !d('m8'))
    this.npcs.kumi.setAlert(!d('m9') || !store.activityDone('transformer'))
  }

  isDone(m) {
    return store.level(LEVEL).missions.includes(m)
  }

  // ------------------------------------------------------------------ missões
  complete(missionId) {
    if (!store.completeMission(LEVEL, missionId)) return false
    const lv = LEVELS[LEVEL]
    const m = lv.missions.find((x) => x.id === missionId)
    const idx = lv.missions.indexOf(m)
    store.addScore(100)
    sfx('crystal')
    const gem = this.add
      .image(this.pongo.x, this.pongo.feetY - 90, `crystal${idx % 5}`)
      .setDepth(45)
    this.tweens.add({
      targets: gem,
      y: gem.y - 50,
      scale: 1.5,
      duration: 450,
      ease: 'Back.Out',
      onComplete: () => {
        const p = this.toPage(gem.x, gem.y)
        gem.destroy()
        flyToHud(p.x, p.y, CRYSTAL_COLORS[idx % 5])
      }
    })
    toast(`<b>Missão ${idx + 1} concluída!</b> ${m.title} · +1 💎`, {
      icon: '💎',
      type: 'mission',
      html: true,
      dur: 3
    })
    this.refreshAlerts()
    if (store.level(LEVEL).missions.length === 9 && !this.isDone('m10')) {
      this.time.delayedCall(1500, () =>
        toast('9 cristais! Vá até o portal no fim do parque. →', { icon: '🌀', dur: 4 })
      )
    }
    return true
  }

  toPage(wx, wy) {
    const cam = this.cameras.main
    const r = this.game.canvas.getBoundingClientRect()
    const k = r.width / GAME_W
    return { x: r.left + (wx - cam.scrollX) * k, y: r.top + (wy - cam.scrollY) * k }
  }

  async script(fn) {
    if (this.busyScript) return
    this.busyScript = true
    this.prompt.setVisible(false)
    try {
      await fn()
    } catch (err) {
      console.error(err)
    } finally {
      this.busyScript = false
      this.grace = 200
    }
  }

  wait(ms) {
    return new Promise((r) => this.time.delayedCall(ms, r))
  }

  intro() {
    this.script(async () => {
      this.pongo.freeze()
      const bars = [h('div.letterbox.top'), h('div.letterbox.bottom')]
      document.body.append(...bars)
      gsap.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.5 })
      const cam = this.cameras.main
      cam.stopFollow()
      cam.pan(6200, GAME_H / 2, 2600, 'Sine.easeInOut')
      await this.wait(2700)
      this.silence.play('silence-shh')
      await dialogue(INTRO, 'narrator')
      cam.pan(this.pongo.x + 200, GAME_H / 2, 1800, 'Sine.easeInOut')
      await this.wait(1900)
      cam.startFollow(this.pongo.zone, true, 0.09, 0.09, 0, 60)
      this.silence.play('silence-float')
      gsap.to(bars, {
        scaleY: 0,
        duration: 0.4,
        onComplete: () => bars.forEach((b) => b.remove())
      })
      store.setFlag('introSeen')
      this.pongo.release()
      toast(
        isTouchDevice()
          ? 'Use ◀ ▶ para andar até a gangorra!'
          : 'Use A/D ou ←/→ para andar até a gangorra!',
        { icon: '🎯', dur: 4 }
      )
    })
  }

  // ------------------------------------------------------------------ interações
  rideSeesaw() {
    this.script(async () => {
      const p = this.pongo
      p.freeze(680, GROUND_Y - 80)
      p.face(1)
      p.attached = { obj: this.seesawEnd }
      p.play('ride')
      this.seesawTilt = -13
      this.tweens.add({
        targets: this.plank,
        angle: -13,
        duration: 500,
        ease: 'Bounce.Out'
      })
      sfx('pop')
      learn('noru')
      store.setFlag('played_seesaw')
      await this.wait(900)
      if (!store.activityDone('actionMatch')) {
        await dialogue(
          [
            {
              jp: 'シーソー[は]{二人|ふたり}で{遊|あそ}びます…',
              pt: 'A gangorra é para dois… Enquanto o amigo não vem, vamos treinar os olhos!'
            }
          ],
          'narrator'
        )
        const r = await actionMatch({ rounds: 3 })
        if (r) {
          store.markActivity('actionMatch', r)
          toast(`Action Match: ${r.score}/${r.total} de primeira!`, { icon: '👀' })
        }
      } else {
        await this.wait(800)
      }
      this.tweens.add({ targets: this.plank, angle: 0, duration: 400, ease: 'Sine.Out' })
      await this.wait(250)
      p.attached = null
      p.release()
      p.body.reset(620, GROUND_Y - 32)
      p.squash(1.2, 0.8)
    })
  }

  sitBench() {
    if (this.seated) return
    this.script(async () => {
      const p = this.pongo
      p.freeze(2650, GROUND_Y - 44)
      p.attached = { obj: { x: 2650, y: GROUND_Y - 40 } }
      p.play('sit')
      p.squash(1.15, 0.85)
      learn('suwaru')
      this.seated = 'sit'
      this.complete('m4')
      await this.wait(400)
      toast('Mova-se para levantar (立つ) · E para dormir (寝る)', {
        icon: '🪑',
        dur: 3.5
      })
    })
  }

  benchUpdate(input) {
    if (!this.seated || this.busyScript) return
    const p = this.pongo
    const move = input.left || input.right || input.jump
    if (input.interact && this.seated === 'sit') {
      this.seated = 'sleep'
      p.play('sleep')
      learn('neru')
      return
    }
    if (move || (input.interact && this.seated === 'sleep')) {
      const wasSleeping = this.seated === 'sleep'
      this.seated = null
      this.script(async () => {
        if (wasSleeping) {
          p.play('sit')
          learn('okiru', { force: true })
          await this.wait(700)
        }
        p.play('stand', false)
        learn('tatsu')
        await this.wait(350)
        p.attached = null
        p.release()
        p.body.reset(2650, GROUND_Y - 32)
      })
    }
  }

  readBook() {
    this.script(async () => {
      const p = this.pongo
      p.freeze(2830, GROUND_Y)
      p.face(1)
      p.play('read')
      learn('yomu')
      if (store.addItem('book')) toast('Você pegou: 本（ほん）livro 📕', { icon: '🎒' })
      await this.wait(3200)
      this.complete('m6')
      p.release()
    })
  }

  drinkWater() {
    this.script(async () => {
      const p = this.pongo
      p.freeze(3075, GROUND_Y)
      p.face(1)
      this.waterArc.setVisible(true)
      p.play('drink')
      learn('nomu')
      await this.wait(2600)
      this.waterArc.setVisible(false)
      this.complete('m5')
      p.release()
    })
  }

  playSwing() {
    this.script(async () => {
      const p = this.pongo
      p.freeze(3420, GROUND_Y)
      p.attached = { obj: this.swingEnd, dy: -2 }
      p.play('ride')
      learn('asobu')
      store.setFlag('played_swing')
      await new Promise((resolve) =>
        this.tweens.add({
          targets: this.swingSeat,
          angle: { from: -28, to: 28 },
          duration: 700,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.InOut',
          onComplete: resolve
        })
      )
      this.swingSeat.angle = 0
      p.attached = null
      p.release()
      p.body.reset(3420, GROUND_Y - 32)
    })
  }

  eatPicnic() {
    this.script(async () => {
      const p = this.pongo
      p.freeze(3860, GROUND_Y)
      p.face(-1)
      p.play('eat')
      learn('taberu')
      if (store.addItem('onigiri')) toast('Você ganhou: おにぎり 🍙', { icon: '🎒' })
      await this.wait(3000)
      p.play('celebrate')
      learn('yorokobu')
      await this.wait(1200)
      p.release()
      this.complete('m7')
    })
  }

  useSlide() {
    this.script(async () => {
      const p = this.pongo
      p.freeze(4330, GROUND_Y - 200)
      const r = this.slideRider
      r.x = 4330
      r.y = GROUND_Y - 200
      p.attached = { obj: r }
      p.face(-1)
      p.play('ride')
      learn('suberu')
      store.setFlag('played_slide')
      await new Promise((resolve) => {
        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(4330, GROUND_Y - 205),
          new Phaser.Math.Vector2(4180, GROUND_Y - 120),
          new Phaser.Math.Vector2(4060, GROUND_Y - 6)
        )
        const t = { v: 0 }
        this.tweens.add({
          targets: t,
          v: 1,
          duration: 1100,
          ease: 'Quad.In',
          onUpdate: () => {
            const pt = curve.getPoint(t.v)
            r.x = pt.x
            r.y = pt.y
          },
          onComplete: resolve
        })
      })
      p.attached = null
      p.release()
      p.body.reset(4040, GROUND_Y - 32)
      p.squash(1.25, 0.8)
      sfx('land')
    })
  }

  kickBall() {
    this.script(async () => {
      const p = this.pongo
      const dir = this.ball.x >= p.x ? 1 : -1
      p.face(dir)
      p.perform('kick', 300)
      await this.wait(120)
      this.ball.setVelocity(dir * 460, -420)
      this.ball.setAngularVelocity(dir * 600)
      sfx('kick')
      learn('keru')
      store.setFlag('played_ball')
      if (store.addItem('ball')) toast('Item: ボール bola ⚽', { icon: '🎒' })
      await this.wait(250)
      p.release()
    })
  }

  rideBike() {
    this.script(async () => {
      const p = this.pongo
      p.freeze(4660, GROUND_Y)
      p.attached = { obj: this.bike, dx: -6, dy: -52 }
      p.face(1)
      p.play('ride')
      learn('noru', { force: true })
      store.setFlag('played_bike')
      await new Promise((resolve) =>
        this.tweens.add({
          targets: this.bike,
          y: GROUND_Y,
          duration: 140,
          yoyo: true,
          repeat: 7,
          onComplete: resolve
        })
      )
      this.bike.y = GROUND_Y + 4
      p.attached = null
      p.release()
      p.body.reset(4600, GROUND_Y - 32)
    })
  }

  // ------------------------------------------------------------------ NPCs
  async npcTalk(id, lines) {
    const npc = this.npcs[id]
    npc.faceTowards(this.pongo.x)
    npc.talk(true)
    this.pongo.face(npc.x > this.pongo.x ? 1 : -1)
    this.pongo.play('interact')
    await dialogue(lines, id)
    npc.talk(false)
    this.pongo.play('idle')
  }

  taroCheck() {
    const p = this.pongo
    const d = Math.abs(p.x - 2250)
    if (d > 320) this.taroWarned = false
    if (this.isDone('m3') || d > 110 || this.busyScript) return
    if (p.state === 'run') {
      this.script(async () => {
        p.halt()
        p.freeze()
        this.complete('m3')
        this.npcs.taro.happy()
        await this.npcTalk('taro', NPCS.taro.runDone)
        p.release()
        await this.offerRunner()
      })
    } else if (!this.taroWarned) {
      this.taroWarned = true
      this.script(async () => {
        p.freeze()
        await this.npcTalk('taro', NPCS.taro.notRunning)
        p.release()
        p.body.reset(1960, GROUND_Y - 32)
        toast('Segure Shift (ou 走) e corra até o Taro!', { icon: '🏃' })
      })
    }
  }

  async offerRunner() {
    const m = openModal({
      title: 'Verb Runner',
      jp: 'ヴァーブ・ランナー',
      content: h(
        'div',
        {},
        h(
          'p',
          {},
          'O Taro desafia você: corra pelo parque e colete os verbos pedidos. Pule (Espaço/跳) para alcançar as bolhas no alto!'
        ),
        h(
          'div.row',
          {},
          button('Agora não', () => m.close(false), 'btn-ghost'),
          button('▶ Jogar', () => m.close(true), 'btn-primary')
        )
      )
    })
    if (!(await m.done)) return
    const result = await new Promise((resolve) => {
      bus.once('runner:done', resolve)
      this.scene.launch('Runner')
      this.scene.pause()
    })
    this.scene.resume()
    if (result) {
      store.markActivity('runner', result)
      this.npcs.taro.happy()
      toast(`Verb Runner: ${result.score}/${result.total} verbos certos!`, { icon: '⚡' })
    }
    this.refreshAlerts()
  }

  talkTaro() {
    this.script(async () => {
      this.pongo.freeze()
      if (!this.isDone('m3')) {
        await this.npcTalk('taro', [...NPCS.taro.greet, ...NPCS.taro.notRunning])
        this.pongo.release()
        this.pongo.body.reset(1960, GROUND_Y - 32)
        return
      }
      learn('hanasu')
      await this.npcTalk('taro', NPCS.taro.after)
      this.pongo.release()
      await this.offerRunner()
    })
  }

  talkMomo() {
    this.script(async () => {
      this.pongo.freeze()
      learn('hanasu')
      if (!this.isDone('m7')) {
        await this.npcTalk('momo', NPCS.momo.greet)
      } else if (!this.isDone('m8')) {
        await this.npcTalk('momo', NPCS.momo.ask)
        const r = await sentenceBuilder(SENTENCES.picnic, {
          title: 'NPC Challenge',
          jp: '{答|こた}えよう',
          npc: 'momo'
        })
        if (r) {
          store.markActivity('npc', r)
          this.npcs.momo.happy()
          this.complete('m8')
          await this.npcTalk('momo', NPCS.momo.after)
        }
      } else {
        await this.npcTalk('momo', NPCS.momo.after)
      }
      this.pongo.release()
    })
  }

  talkKumi() {
    this.script(async () => {
      const p = this.pongo
      p.freeze()
      learn('hanasu')
      if (!this.isDone('m9')) {
        await this.npcTalk('kumi', NPCS.kumi.greet)
        const r = await sentenceBuilder(SENTENCES.bridge, {
          title: 'Grammar Bridge',
          jp: '{文|ぶん}の{橋|はし}'
        })
        if (r) {
          store.markActivity('bridge', r)
          await this.buildBridge(false)
          await this.npcTalk('kumi', NPCS.kumi.bridgeDone)
          p.face(1)
          p.play('write')
          learn('kaku')
          if (store.addItem('notebook'))
            toast('Você ganhou: ノート caderno 📒', { icon: '🎒' })
          await this.wait(2200)
          this.complete('m9')
        }
      } else {
        await this.npcTalk('kumi', NPCS.kumi.transformer)
        const r = await verbTransformer({ count: 5 })
        if (r) {
          store.markActivity('transformer', r)
          if (r.perfect) store.setFlag('transformerPerfect')
          toast(`Verb Transformer: ${r.score}/${r.total} de primeira!`, { icon: '🔁' })
        }
        await this.npcTalk('kumi', NPCS.kumi.after)
      }
      this.refreshAlerts()
      p.release()
    })
  }

  buildBridge(instant) {
    if (this.bridgeBuilt) return Promise.resolve()
    this.bridgeBuilt = true
    this.solid(RIVER[0], GROUND_Y, RIVER[1] - RIVER[0], 24)
    const n = 7
    const w = (RIVER[1] - RIVER[0]) / n
    const planks = []
    for (let i = 0; i < n; i++) {
      planks.push(
        this.add
          .image(RIVER[0] + w * i + w / 2, GROUND_Y + 10, 'plank')
          .setDisplaySize(w + 4, 26)
          .setDepth(9)
      )
    }
    const rope = this.add.graphics().setDepth(9)
    rope
      .lineStyle(4, 0xb5713f)
      .lineBetween(RIVER[0], GROUND_Y - 20, RIVER[1], GROUND_Y - 20)
    if (instant) return Promise.resolve()
    const cam = this.cameras.main
    cam.stopFollow()
    cam.pan(RIVER[0] + 180, GAME_H / 2, 700)
    rope.setAlpha(0)
    planks.forEach((pl) => pl.setAlpha(0).setY(GROUND_Y - 160))
    return new Promise((resolve) => {
      planks.forEach((pl, i) =>
        this.tweens.add({
          targets: pl,
          y: GROUND_Y + 10,
          alpha: 1,
          delay: 400 + i * 180,
          duration: 380,
          ease: 'Bounce.Out',
          onStart: () => sfx('build'),
          onComplete: () => {
            if (i === n - 1) {
              this.tweens.add({ targets: rope, alpha: 1, duration: 300 })
              confetti(30)
              this.time.delayedCall(600, () => {
                cam.startFollow(this.pongo.zone, true, 0.09, 0.09, 0, 60)
                resolve()
              })
            }
          }
        })
      )
    })
  }

  talkSilence() {
    if (this.portalOpen) return
    this.script(async () => {
      const p = this.pongo
      p.freeze()
      p.face(1)
      const count = store.level(LEVEL).missions.filter((m) => m !== 'm10').length
      this.silence.play('silence-shh')
      if (count < 9) {
        await dialogue([...NPCS.silence.block, ...NPCS.silence.needCrystals], 'silence')
        const missing = LEVELS[LEVEL].missions.filter(
          (m) => m.id !== 'm10' && !this.isDone(m.id)
        )
        toast(`Faltam ${missing.length} cristais. Próxima: ${missing[0]?.title}`, {
          icon: '💎',
          dur: 4
        })
        this.silence.play('silence-float')
        p.release()
        p.body.reset(5980, GROUND_Y - 32)
        return
      }
      await dialogue([...NPCS.silence.block, ...NPCS.silence.challenge], 'silence')
      const r = await actionBoss()
      if (!r) {
        this.silence.play('silence-float')
        p.release()
        return
      }
      this.silence.play('silence-happy')
      await dialogue(NPCS.silence.defeated, 'silence')
      await this.openPortal()
      p.release()
    })
  }

  openPortal() {
    this.portalOpen = true
    sfx('portal')
    this.barrierSolid.destroy()
    this.add
      .particles(this.barrier.x, this.barrier.y - 90, 'sparkle', {
        speed: { min: 80, max: 260 },
        lifespan: 900,
        scale: { start: 1.2, end: 0 },
        quantity: 40,
        emitting: false
      })
      .setDepth(45)
      .explode(40)
    this.tweens.add({ targets: this.barrier, alpha: 0, scaleY: 0.2, duration: 600 })
    this.tweens.add({ targets: this.portalSwirl, alpha: 1, scale: 1.1, duration: 900 })
    this.tweens.add({ targets: this.silence, x: 6060, duration: 900, ease: 'Sine.InOut' })
    confetti(40)
    toast('O portal está aberto! Entre nele. →', { icon: '🌀', dur: 4 })
    return this.wait(900)
  }

  enterPortal() {
    this.script(async () => {
      const p = this.pongo
      p.freeze()
      p.play('celebrate')
      learn('hairu', { force: true })
      sfx('portal')
      await new Promise((resolve) =>
        this.tweens.add({
          targets: p.sprite,
          x: 6450,
          y: GROUND_Y - 110,
          scale: 0.05,
          angle: 540,
          duration: 1300,
          ease: 'Cubic.In',
          onComplete: resolve
        })
      )
      p.sprite.setVisible(false)
      this.complete('m10')
      const acts = ['actionMatch', 'runner', 'npc', 'bridge', 'transformer'].filter((a) =>
        store.activityDone(a)
      ).length
      const stars = 1 + (acts >= 3 ? 1 : 0) + (acts === 5 ? 1 : 0)
      store.level(LEVEL).inProgress = false
      store.completeLevel(LEVEL, stars)
      await this.wait(700)
      await openVictory({
        stars,
        activities: acts,
        verbs: store.discoveredVerbs().length
      })
    })
  }

  lightPlatform(p, silent) {
    if (p.lit) return
    p.lit = true
    p.img.setTexture('platformLit')
    if (!silent) {
      sfx('pop')
      this.tweens.add({
        targets: p.img,
        scaleX: 1.08,
        scaleY: 0.9,
        duration: 120,
        yoyo: true
      })
    }
  }

  // ------------------------------------------------------------------ loop
  update(time, dt) {
    const input = this.inputSys.read()
    this.updateParallax()
    this.water.tilePositionX += dt * 0.02
    this.river.tilePositionX -= dt * 0.12
    const p = this.pongo
    this.updateRides()

    if (this.grace > 0) this.grace -= dt
    if (isBlocking() || this.busyScript || this.grace > 0) {
      if (!p.busy) p.halt()
      this.prompt.setVisible(false)
      return
    }
    if (input.pause) bus.emit('ui:pause')
    if (this.seated) {
      this.benchUpdate(input)
      return
    }

    // água: lago
    const inPond = p.x > POND[0] + 10 && p.x < POND[1] - 10 && p.feetY > GROUND_Y + 22
    p.inWater = inPond
    p.waterSurface = GROUND_Y + 10
    if (inPond && !store.hasFlag('swam')) store.setFlag('swam')

    p.update(input, dt)

    // queda no rio
    if (p.body.top > GAME_H + 40) {
      learn('fall', { force: true })
      sfx('splash')
      toast('Pongo caiu no rio! 落ちました。 Construa a ponte com a professora Kumi.', {
        icon: '💦',
        dur: 3.5
      })
      p.respawn(5380, GROUND_Y)
      return
    }

    // missões por posição
    if (!this.isDone('m1') && p.x > 700 && p.x < 960) this.complete('m1')
    if (!this.isDone('m2') && p.onGround) {
      for (const pl of this.platforms) {
        if (Math.abs(p.x - pl.x) < 100 && Math.abs(p.feetY - pl.y) < 6)
          this.lightPlatform(pl)
      }
      if (this.platforms.every((pl) => pl.lit)) this.complete('m2')
    }
    this.taroCheck()
    if (this.portalOpen && !this.isDone('m10') && p.x > 6380) this.enterPortal()
    if (!this.portalOpen && p.x > 6000 && p.x < 6200 && !this.silenceWarned) {
      this.silenceWarned = true
      this.talkSilence()
    }
    if (p.x < 5900) this.silenceWarned = false

    // interação mais próxima
    let best = null
    let bestD = Infinity
    for (const it of this.interactables) {
      const ix = typeof it.x === 'function' ? it.x() : it.x
      const d = Math.abs(ix - p.x)
      if (d < it.range && d < bestD && it.can() && Math.abs(p.feetY - GROUND_Y) < 120) {
        best = it
        bestD = d
      }
    }
    if (best) {
      if (this.promptFor !== best) {
        this.promptFor = best
        const verb = best.verb ? VERB[best.verb] : null
        const key = isTouchDevice() ? '✋' : 'E'
        this.prompt.setText(
          `${key}  ${verb ? verb.kanji : best.label}\n${verb ? verb.meaning.split(',')[0] : best.sub}`
        )
        this.prompt.setVisible(true).setScale(0.6)
        this.tweens.add({
          targets: this.prompt,
          scale: 1,
          duration: 200,
          ease: 'Back.Out'
        })
      }
      const ix = typeof best.x === 'function' ? best.x() : best.x
      const iy = typeof best.y === 'function' ? best.y() : best.y
      this.prompt.setPosition(ix, iy + Math.sin(time / 250) * 3)
      if (input.interact) {
        sfx('click')
        best.act()
      }
    } else if (this.promptFor) {
      this.promptFor = null
      this.prompt.setVisible(false)
    }
  }

  updateRides() {
    const a = Phaser.Math.DegToRad(this.plank.angle)
    this.seesawEnd.x = this.plank.x - Math.cos(a) * 138
    this.seesawEnd.y = this.plank.y - Math.sin(a) * 138 - 6
    const s = Phaser.Math.DegToRad(this.swingSeat.angle)
    this.swingEnd.x = this.swingSeat.x - Math.sin(s) * 156
    this.swingEnd.y = this.swingSeat.y + Math.cos(s) * 156 - 4
  }
}
