// Base das cenas exploráveis (cidade, interiores, labirinto): jogador,
// câmera, interações, ponte com diálogos/puzzles e com o QuestSystem.
import Phaser from 'phaser'
import {
  ZOOM,
  INTERACT_RANGE,
  FONT_FAMILY,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT
} from '../config/gameConfig.js'
import { Player } from '../entities/Player.js'
import { input } from '../systems/InputSystem.js'
import { bus } from '../systems/EventBus.js'
import { quest } from '../systems/QuestSystem.js'
import { saves } from '../systems/SaveSystem.js'
import { state } from '../systems/GameState.js'
import { audio } from '../systems/AudioSystem.js'
import { DIALOGUES } from '../data/dialogues.js'
import { PUZZLE_SETS } from '../data/puzzles.js'
import { hud } from '../ui/HUD.js'
import { touch } from '../ui/TouchControls.js'
import { ui } from '../ui/UIManager.js'

export class WorldScene extends Phaser.Scene {
  initWorld(kind, title = '') {
    // Cenas do Phaser são reutilizadas: zere o estado a cada início.
    this.kind = kind
    this.leaving = false
    this.interactables = []
    this.offs = []
    hud.show(true)
    touch.show(true)
    bus.emit('hud:scene', { kind, title })
    this.cameras.main.setZoom(ZOOM).setBackgroundColor('#1b1530')
    this.cameras.main.fadeIn(250, 27, 21, 48)
    this.indicator = this.add.container(0, 0).setDepth(7000).setVisible(false)
    const bg = this.add.graphics()
    bg.fillStyle(0xfff8e7, 1).fillRoundedRect(-7, -16, 14, 13, 3)
    bg.lineStyle(1.5, 0x1b1530, 1).strokeRoundedRect(-7, -16, 14, 13, 3)
    bg.fillStyle(0xfff8e7, 1).fillTriangle(-3, -3, 3, -3, 0, 1)
    const t = this.add
      .text(0, -9.5, 'E', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#1b1530',
        resolution: 3
      })
      .setOrigin(0.5)
    this.indicator.add([bg, t])
    this.tweens.add({
      targets: this.indicator,
      scale: 1.12,
      duration: 380,
      yoyo: true,
      repeat: -1
    })
    this.hintText = this.add
      .text(0, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        color: '#fff8e7',
        backgroundColor: '#1b1530cc',
        padding: { x: 3, y: 1 },
        resolution: 3
      })
      .setOrigin(0.5, 0)
      .setDepth(7000)
      .setVisible(false)
    this.events.once('shutdown', () => this.onShutdown())
    this.saveTimer = this.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => saves.save()
    })
    input.clear()
  }

  spawnPlayer(x, y, facing) {
    this.player = new Player(this, x, y, facing)
    this.player.face(facing)
    return this.player
  }

  follow(mapW, mapH) {
    const cam = this.cameras.main
    const vw = LOGICAL_WIDTH
    const vh = LOGICAL_HEIGHT
    if (mapW <= vw && mapH <= vh) {
      cam.centerOn(mapW / 2, mapH / 2)
      return
    }
    cam.setBounds(
      Math.min(0, (mapW - vw) / 2),
      Math.min(0, (mapH - vh) / 2),
      Math.max(mapW, vw),
      Math.max(mapH, vh)
    )
    cam.startFollow(this.player, true, 0.15, 0.15)
    cam.setRoundPixels(true)
  }

  addInteractable(def) {
    const it = { r: INTERACT_RANGE, top: 18, enabled: () => true, ...def }
    this.interactables.push(it)
    return it
  }

  nearestInteractable() {
    const f = this.player.frontPoint(8)
    let best = null
    let bd = Infinity
    for (const it of this.interactables) {
      if (!it.enabled()) continue
      const d = Math.hypot(it.x - f.x, it.y - f.y)
      if (d < it.r && d < bd) {
        best = it
        bd = d
      }
    }
    return best
  }

  update(time, delta) {
    if (!this.player || !this.player.body) return
    const dir = ui.busy ? null : input.direction()
    this.player.move(dir, delta)
    bus.emit('player:pos', {
      x: this.player.x,
      y: this.player.y,
      facing: this.player.facing
    })
    const near = ui.busy || quest.busy ? null : this.nearestInteractable()
    if (near) {
      this.indicator.setPosition(near.x, near.y - near.top).setVisible(true)
      this.hintText
        .setText(near.label || '')
        .setPosition(near.x, near.y + 4)
        .setVisible(!!near.label)
    } else {
      this.indicator.setVisible(false)
      this.hintText.setVisible(false)
    }
    if (input.consumeAction() && near && !ui.busy && !quest.busy) {
      this.player.move(null, 0)
      near.onUse()
    }
    this.worldUpdate?.(time, delta)
  }

  // ── Diálogos e puzzles ─────────────────────────────────────
  runDialogue(idOrScript) {
    const script = typeof idOrScript === 'string' ? DIALOGUES[idOrScript] : idOrScript
    return new Promise((resolve) => {
      this.player?.move(null, 0)
      this.scene.launch('Dialogue', {
        script,
        from: this.scene.key,
        resolve,
        onItem: () => bus.emit('compass:refresh')
      })
    })
  }

  runPuzzle(setOrConfig) {
    const cfg =
      typeof setOrConfig === 'string'
        ? { ...PUZZLE_SETS[setOrConfig], setId: setOrConfig }
        : setOrConfig
    return new Promise((resolve) => {
      this.player?.move(null, 0)
      this.scene.launch('Puzzle', { config: cfg, from: this.scene.key, resolve })
    })
  }

  /** Conversa com um NPC: missão primeiro; senão, fala livre. */
  talkTo(npcId) {
    this.player.face(this.faceToward(npcId))
    if (quest.handle({ type: 'talk', npc: npcId })) return
    const idle = DIALOGUES[`idle_${npcId}`]
    if (idle) this.runDialogue(idle)
  }

  faceToward() {
    return this.player.facing
  }

  goTo(key, data) {
    if (this.leaving) return
    this.leaving = true
    audio.sfx('door')
    ui.lockInput()
    this.cameras.main.fadeOut(220, 27, 21, 48)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      ui.unlockInput()
      saves.save()
      this.scene.start(key, data)
    })
  }

  showResult() {
    this.scene.launch('Result', { from: this.scene.key })
  }

  onShutdown() {
    quest.detach(this)
    this.offs.forEach((off) => off())
    this.saveTimer?.remove()
  }

  get settings() {
    return state.settings
  }
}
