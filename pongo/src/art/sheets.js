// Monta spritesheets em canvas a partir das funções de desenho.
// Personagens são desenhados em 2x (ART_SCALE) para ficarem nítidos em telas grandes.
import { makeCanvas } from './canvas.js'
import { drawDog, PONGO_ANIMS, NPC_ANIMS, NPC_LOOKS, PONGO_LOOK } from './dog.js'
import { drawSilence, SILENCE_ANIMS } from './silence.js'

export const ART_SCALE = 2
export const CHAR_FRAME = { w: 176, h: 176, footY: 166 }

/**
 * @returns {{ canvas, frames: {name,x,y,w,h}[], anims: {key, frames:string[], fps, repeat}[] }}
 */
export function buildSheet(prefix, animDefs, drawFn, frame = CHAR_FRAME, cols = 10) {
  const list = []
  for (const [name, def] of Object.entries(animDefs)) {
    def.poses.forEach((pose, i) => list.push({ anim: name, name: `${name}_${i}`, pose }))
  }
  const S = ART_SCALE
  const fw = frame.w * S
  const fh = frame.h * S
  const rows = Math.ceil(list.length / cols)
  const canvas = makeCanvas(fw * Math.min(cols, list.length), fh * rows)
  const ctx = canvas.getContext('2d')
  const frames = []
  list.forEach((f, i) => {
    const x = (i % cols) * fw
    const y = Math.floor(i / cols) * fh
    ctx.save()
    ctx.translate(x, y)
    ctx.beginPath()
    ctx.rect(0, 0, fw, fh)
    ctx.clip()
    ctx.scale(S, S)
    ctx.translate(frame.w / 2, frame.footY)
    drawFn(ctx, f.pose)
    ctx.restore()
    frames.push({ name: f.name, x, y, w: fw, h: fh })
  })
  const anims = Object.entries(animDefs).map(([name, def]) => ({
    key: `${prefix}-${name}`,
    frames: def.poses.map((_, i) => `${name}_${i}`),
    fps: def.fps,
    repeat: def.repeat
  }))
  return { canvas, frames, anims }
}

export function buildCharacters() {
  const sheets = {
    pongo: buildSheet('pongo', PONGO_ANIMS, (ctx, pose) =>
      drawDog(ctx, pose, PONGO_LOOK)
    ),
    silence: buildSheet(
      'silence',
      SILENCE_ANIMS,
      (ctx, pose) => drawSilence(ctx, pose),
      { w: 176, h: 176, footY: 166 },
      6
    )
  }
  for (const [id, look] of Object.entries(NPC_LOOKS)) {
    sheets[id] = buildSheet(id, NPC_ANIMS, (ctx, pose) => drawDog(ctx, pose, look))
  }
  return sheets
}
