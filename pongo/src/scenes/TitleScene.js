// Fundo animado da tela inicial e do mapa: o parque com Pongo e amigos.
import * as Phaser from 'phaser'
import { GAME_W, GROUND_Y } from '../core/constants.js'
import { buildParallax } from './parallax.js'
import { charInfo } from '../art/register.js'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title')
  }

  create() {
    this.updateParallax = buildParallax(this, 20000)
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
    this.pongo = this.add
      .sprite(GAME_W * 0.5, GROUND_Y, 'pongo', 'run_0')
      .setOrigin(0.5, charInfo('pongo').originY)
      .setScale(charInfo('pongo').scale * 1.25)
      .setScrollFactor(0)
      .setDepth(10)
    this.pongo.play('pongo-run')
    this.taro = this.add
      .sprite(GAME_W * 0.3, GROUND_Y, 'taro', 'happy_0')
      .setOrigin(0.5, charInfo('taro').originY)
      .setScale(charInfo('taro').scale)
      .setScrollFactor(0)
      .setDepth(9)
    this.taro.play('taro-happy')
    this.momo = this.add
      .sprite(GAME_W * 0.72, GROUND_Y, 'momo', 'idle_0')
      .setOrigin(0.5, charInfo('momo').originY)
      .setScale(charInfo('momo').scale)
      .setScrollFactor(0)
      .setDepth(9)
      .setFlipX(true)
    this.momo.play('momo-idle')
    this.kumi = this.add
      .sprite(GAME_W * 0.86, GROUND_Y, 'kumi', 'idle_0')
      .setOrigin(0.5, charInfo('kumi').originY)
      .setScale(charInfo('kumi').scale)
      .setScrollFactor(0)
      .setDepth(9)
      .setFlipX(true)
    this.kumi.play('kumi-idle')
    this.cameras.main.fadeIn(500, 255, 255, 255)
  }

  update(_time, dt) {
    this.cameras.main.scrollX += dt * 0.12
    this.updateParallax()
    this.ground.tilePositionX = this.cameras.main.scrollX * 2
    this.fence.tilePositionX = this.cameras.main.scrollX * 2
  }
}
