// Registra as texturas no Phaser e expõe quadros como imagens para a UI (DOM).
// Personagens: arte oficial ilustrada (src/assets/sprites) quando disponível;
// se uma imagem não carregar, usa a versão procedural equivalente.
import { buildCharacters, ART_SCALE, CHAR_FRAME } from './sheets.js'
import { buildScenery } from './scenery.js'
import { makeCanvas } from './canvas.js'
import { composeSheet } from './imported.js'

const sheets = {}
const urlCache = new Map()

/** @param images resultado de loadImported(): { pongo: HTMLImageElement|null, ... } */
export function registerArt(scene, images = {}) {
  const tm = scene.textures
  const procedural = buildCharacters()
  for (const id of Object.keys(procedural)) {
    let sheet = null
    if (images[id]) {
      try {
        sheet = composeSheet(id, images[id])
      } catch (err) {
        console.warn(`[art] usando arte procedural para "${id}"`, err)
      }
    }
    sheet ??= { ...procedural[id], frame: CHAR_FRAME, res: ART_SCALE, shadow: false }
    sheets[id] = sheet
    if (tm.exists(id)) continue
    const tex = tm.addCanvas(id, sheet.canvas)
    for (const f of sheet.frames) tex.add(f.name, 0, f.x, f.y, f.w, f.h)
    for (const a of sheet.anims) {
      if (scene.anims.exists(a.key)) continue
      scene.anims.create({
        key: a.key,
        frames: a.frames.map((frame) => ({ key: id, frame })),
        frameRate: a.fps,
        repeat: a.repeat
      })
    }
  }
  for (const [key, canvas] of Object.entries(buildScenery())) {
    if (!tm.exists(key)) tm.addCanvas(key, canvas)
  }
}

/** Escala e origem (pés) de um personagem, para posicionar o sprite no chão. */
export function charInfo(id) {
  const s = sheets[id]
  const frame = s?.frame ?? CHAR_FRAME
  return {
    scale: 1 / (s?.res ?? ART_SCALE),
    originY: frame.footY / frame.h,
    hasShadow: !!s?.shadow,
    imported: s?.res === 1
  }
}

/** URL (PNG) de um quadro, para usar em <img> na interface. */
export function frameURL(sheetId, frameName, { trim = true } = {}) {
  const key = `${sheetId}/${frameName}/${trim}`
  if (urlCache.has(key)) return urlCache.get(key)
  const sheet = sheets[sheetId]
  const f = sheet?.frames.find((fr) => fr.name === frameName) ?? sheet?.frames[0]
  if (!f) return ''
  const c = makeCanvas(f.w, f.h)
  const ctx = c.getContext('2d')
  ctx.drawImage(sheet.canvas, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h)
  const url = (trim ? trimmed(c, ctx) : c).toDataURL('image/png')
  urlCache.set(key, url)
  return url
}

/** Recorta as bordas transparentes (com margem) para retratos e miniaturas ocuparem o espaço. */
function trimmed(c, ctx) {
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height)
  let x0 = width
  let y0 = height
  let x1 = 0
  let y1 = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) return c
  const pad = 4
  const side = Math.max(x1 - x0, y1 - y0) + pad * 2
  const out = makeCanvas(side, side)
  out
    .getContext('2d')
    .drawImage(
      c,
      x0,
      y0,
      x1 - x0 + 1,
      y1 - y0 + 1,
      (side - (x1 - x0)) / 2,
      side - pad - (y1 - y0),
      x1 - x0 + 1,
      y1 - y0 + 1
    )
  return out
}

/** Lista de URLs + fps de uma animação (para o Action Match). */
export function animFrames(sheetId, anim) {
  const sheet = sheets[sheetId]
  const a = sheet?.anims.find((x) => x.key === `${sheetId}-${anim}`)
  if (!a) return { urls: [], fps: 8 }
  return {
    urls: a.frames.map((fr) => frameURL(sheetId, fr, { trim: false })),
    fps: a.fps
  }
}

export const hasAnim = (sheetId, anim) =>
  !!sheets[sheetId]?.anims.some((x) => x.key === `${sheetId}-${anim}`)

export { ART_SCALE, CHAR_FRAME }
