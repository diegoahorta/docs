// Preload: gera todas as texturas (pixel art procedural) e retratos.
// Para usar assets finais, carregue-os aqui com this.load.* a partir de
// public/assets/ mantendo as mesmas chaves de textura.
import Phaser from 'phaser'
import {
  makePongoSheet,
  makeHumanSheet,
  makeCatSheet,
  makeMayoiSheet,
  portraitURL,
  PONGO_FRAME,
  PONGO_ROWS
} from '../art/pixelSprites.js'
import { makeTileset } from '../art/tileArt.js'
import { drawBuilding } from '../art/buildingArt.js'
import { makeObjectTextures } from '../art/objectArt.js'
import { BUILDINGS } from '../maps/cityMap.js'
import { NPCS } from '../data/npcs.js'
import { CATS } from '../data/cats.js'
import { setPortrait } from '../ui/portraits.js'
import { FONT_FAMILY } from '../config/gameConfig.js'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  create() {
    const { width, height } = this.scale
    const label = this.add
      .text(width / 2, height / 2, 'ことばの町を つくっています…', {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        color: '#fff8e7'
      })
      .setOrigin(0.5)
    this.time.delayedCall(30, () => {
      this.generate()
      label.destroy()
      this.scene.start('Menu')
    })
  }

  sheet(key, canvas, fw, fh, names) {
    if (this.textures.exists(key)) this.textures.remove(key)
    const tex = this.textures.addCanvas(key, canvas)
    const cols = Math.floor(canvas.width / fw)
    const rows = Math.floor(canvas.height / fh)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const name = names ? `${names[r]}-${c}` : r * cols + c
        tex.add(name, 0, c * fw, r * fh, fw, fh)
      }
    return tex
  }

  canvasTex(key, canvas) {
    if (this.textures.exists(key)) this.textures.remove(key)
    this.textures.addCanvas(key, canvas)
  }

  generate() {
    // Tileset
    this.canvasTex('tiles', makeTileset())

    // Pongo
    const pongo = makePongoSheet()
    this.sheet('pongo', pongo, PONGO_FRAME.w, PONGO_FRAME.h, PONGO_ROWS)
    setPortrait('pongo', portraitURL(pongo, PONGO_FRAME.w, PONGO_FRAME.h, '#ffd9b0'))

    // NPCs
    Object.entries(NPCS).forEach(([id, npc]) => {
      if (!npc.palette) return
      const c = makeHumanSheet(npc.palette, id === 'michi')
      this.sheet(`npc-${id}`, c, 18, 20)
      setPortrait(id, portraitURL(c, 18, 20))
    })

    // Gatos e まよいネコ
    CATS.forEach((cat) => this.sheet(`cat-${cat.id}`, makeCatSheet(cat.color), 12, 11))
    const mayoi = makeMayoiSheet()
    this.sheet('npc-mayoi', mayoi, 26, 22)
    setPortrait('mayoi', portraitURL(mayoi, 26, 22, '#e3d4ff'))

    // Prédios
    const signs = {}
    BUILDINGS.forEach((b) => {
      const { canvas, sign } = drawBuilding(b)
      this.canvasTex(`bld-${b.id}`, canvas)
      signs[b.id] = sign
    })
    this.registry.set('signs', signs)

    // Objetos e mobília
    Object.entries(makeObjectTextures()).forEach(([k, c]) => this.canvasTex(k, c))
  }
}
