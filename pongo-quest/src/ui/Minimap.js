// Minimapa opcional gerado a partir dos dados da cidade.
import { buildCityTiles, BUILDINGS, CITY_W, CITY_H } from '../maps/cityMap.js'
import { MINIMAP_COLORS } from '../maps/tiles.js'
import { VEC } from '../systems/DirectionSystem.js'

const S = 2 // pixels por tile

export class Minimap {
  constructor(parent) {
    this.el = document.createElement('div')
    this.el.className = 'minimap'
    this.el.title = 'Minimapa (M)'
    this.canvas = document.createElement('canvas')
    this.canvas.width = CITY_W * S
    this.canvas.height = CITY_H * S
    this.label = document.createElement('div')
    this.label.className = 'label'
    this.el.append(this.canvas, this.label)
    parent.appendChild(this.el)
    this.ctx = this.canvas.getContext('2d')
    this.base = this.drawBase()
    this.player = null
    this.target = null
    this.mode = 'city'
    this.blink = 0
    this.render()
  }

  drawBase() {
    const c = document.createElement('canvas')
    c.width = this.canvas.width
    c.height = this.canvas.height
    const ctx = c.getContext('2d')
    buildCityTiles().forEach((row, y) =>
      row.forEach((t, x) => {
        ctx.fillStyle = MINIMAP_COLORS[t] || '#000'
        ctx.fillRect(x * S, y * S, S, S)
      })
    )
    BUILDINGS.forEach((b) => {
      ctx.fillStyle = '#6b5a7a'
      ctx.fillRect(b.rect.x * S, b.rect.y * S, b.rect.w * S, b.rect.h * S)
      ctx.fillStyle = '#ffe2a8'
      ctx.fillRect(b.door.x * S, b.door.y * S, 2 * S, S)
    })
    return c
  }

  setPlayer(x, y, facing) {
    this.player = { x, y, facing }
  }

  setTarget(t) {
    this.target = t
  }

  setMode(mode, title = '') {
    this.mode = mode
    this.label.textContent = mode === 'city' ? 'ことばの町' : title
    this.render()
  }

  render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.mode !== 'city') {
      ctx.fillStyle = '#2b2440'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      ctx.fillStyle = '#fff8e7'
      ctx.font = '12px DotGothic16, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('屋内', this.canvas.width / 2, this.canvas.height / 2 - 4)
      ctx.font = '9px sans-serif'
      ctx.fillText('(interior)', this.canvas.width / 2, this.canvas.height / 2 + 10)
      return
    }
    ctx.drawImage(this.base, 0, 0)
    this.blink = (this.blink + 1) % 30
    if (this.target && this.blink < 20) {
      ctx.fillStyle = '#ffe14d'
      ctx.strokeStyle = '#1b1530'
      ctx.beginPath()
      ctx.arc(this.target.x * S, this.target.y * S, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    if (this.player) {
      const { x, y, facing } = this.player
      const px = (x / 16) * S
      const py = (y / 16) * S
      ctx.fillStyle = '#ff7a3d'
      ctx.strokeStyle = '#fff'
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      const [dx, dy] = VEC[facing] || [0, 1]
      ctx.strokeStyle = '#1b1530'
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + dx * 6, py + dy * 6)
      ctx.stroke()
    }
  }
}
