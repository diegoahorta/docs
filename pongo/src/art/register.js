// Registra as texturas procedurais no Phaser e expõe quadros como imagens para a UI (DOM).
import { buildCharacters, ART_SCALE, CHAR_FRAME } from './sheets.js'
import { buildScenery } from './scenery.js'
import { makeCanvas } from './canvas.js'

const sheets = {}
const urlCache = new Map()

export function registerArt(scene, override = null) {
  const tm = scene.textures
  const chars = buildCharacters()
  for (const [id, sheet] of Object.entries(chars)) {
    if (id === 'pongo' && override) continue
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
  if (override) registerOverride(scene, override)
  for (const [key, canvas] of Object.entries(buildScenery())) {
    if (!tm.exists(key)) tm.addCanvas(key, canvas)
  }
}

/**
 * Permite trocar o Pongo procedural por um spritesheet oficial da ODU Creative
 * (ver public/assets/manifest.json e o README).
 */
function registerOverride(scene, cfg) {
  const tex = scene.textures.get('pongo-official')
  const src = tex.getSourceImage()
  const fw = cfg.frameWidth
  const fh = cfg.frameHeight
  const cols = Math.floor(src.width / fw)
  const canvas = makeCanvas(src.width, src.height)
  canvas.getContext('2d').drawImage(src, 0, 0)
  const frames = []
  const anims = []
  for (const [name, [start, end, fps = 10, repeat = -1]] of Object.entries(
    cfg.animations
  )) {
    const names = []
    for (let i = start; i <= end; i++) {
      const fname = `${name}_${i - start}`
      frames.push({
        name: fname,
        x: (i % cols) * fw,
        y: Math.floor(i / cols) * fh,
        w: fw,
        h: fh
      })
      names.push(fname)
    }
    anims.push({ key: `pongo-${name}`, frames: names, fps, repeat })
  }
  sheets.pongo = { canvas, frames, anims }
  const t = scene.textures.addCanvas('pongo', canvas)
  for (const f of frames) t.add(f.name, 0, f.x, f.y, f.w, f.h)
  for (const a of anims) {
    scene.anims.create({
      key: a.key,
      frames: a.frames.map((frame) => ({ key: 'pongo', frame })),
      frameRate: a.fps,
      repeat: a.repeat
    })
  }
}

/** URL (PNG) de um quadro, para usar em <img> na interface. */
export function frameURL(sheetId, frameName) {
  const key = `${sheetId}/${frameName}`
  if (urlCache.has(key)) return urlCache.get(key)
  const sheet = sheets[sheetId]
  const f = sheet?.frames.find((fr) => fr.name === frameName)
  if (!f) return ''
  const c = makeCanvas(f.w, f.h)
  c.getContext('2d').drawImage(sheet.canvas, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h)
  const url = c.toDataURL('image/png')
  urlCache.set(key, url)
  return url
}

/** Lista de URLs + fps de uma animação (para o Action Match). */
export function animFrames(sheetId, anim) {
  const sheet = sheets[sheetId]
  const a = sheet?.anims.find((x) => x.key === `${sheetId}-${anim}`)
  if (!a) return { urls: [], fps: 8 }
  return { urls: a.frames.map((fr) => frameURL(sheetId, fr)), fps: a.fps }
}

export const hasAnim = (sheetId, anim) =>
  !!sheets[sheetId]?.anims.some((x) => x.key === `${sheetId}-${anim}`)

export { ART_SCALE, CHAR_FRAME }
