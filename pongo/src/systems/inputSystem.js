// Entrada unificada: teclado (A/D, setas, Espaço, Shift, E), toque e gamepad.
import * as Phaser from 'phaser'
import { touchState } from '../ui/touch.js'

const KC = Phaser.Input.Keyboard.KeyCodes

export class InputSystem {
  constructor(scene) {
    this.scene = scene
    const kb = scene.input.keyboard
    this.keys = kb.addKeys({
      left: KC.LEFT,
      right: KC.RIGHT,
      a: KC.A,
      d: KC.D,
      up: KC.UP,
      w: KC.W,
      space: KC.SPACE,
      shift: KC.SHIFT,
      e: KC.E,
      enter: KC.ENTER
    })
    this.prevPad = {}
    this.jumpPresses = 0
    this.interactPresses = 0
  }

  padButton(pad, i) {
    return !!pad?.buttons?.[i]?.pressed
  }

  read() {
    const k = this.keys
    const JD = Phaser.Input.Keyboard.JustDown
    const pad = this.scene.input.gamepad?.total
      ? this.scene.input.gamepad.getPad(0)
      : null
    const axis = pad?.axes?.[0]?.getValue?.() ?? 0
    const padNow = {
      jump: this.padButton(pad, 0),
      interact: this.padButton(pad, 2) || this.padButton(pad, 1),
      pause: this.padButton(pad, 9)
    }
    const edge = (name) => padNow[name] && !this.prevPad[name]
    const state = {
      left:
        k.left.isDown ||
        k.a.isDown ||
        touchState.left ||
        axis < -0.35 ||
        this.padButton(pad, 14),
      right:
        k.right.isDown ||
        k.d.isDown ||
        touchState.right ||
        axis > 0.35 ||
        this.padButton(pad, 15),
      run:
        k.shift.isDown ||
        touchState.run ||
        this.padButton(pad, 7) ||
        this.padButton(pad, 5),
      jumpHeld:
        k.space.isDown || k.up.isDown || k.w.isDown || touchState.jump || padNow.jump,
      jump:
        JD(k.space) | JD(k.up) | JD(k.w) || touchState.jumpPresses > 0 || edge('jump'),
      interact:
        JD(k.e) | JD(k.enter) || touchState.interactPresses > 0 || edge('interact'),
      pause: edge('pause')
    }
    state.jump = !!state.jump
    state.interact = !!state.interact
    touchState.jumpPresses = 0
    touchState.interactPresses = 0
    this.prevPad = padNow
    return state
  }
}
