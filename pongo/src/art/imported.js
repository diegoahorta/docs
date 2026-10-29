// Arte oficial ilustrada (ODU Creative): spritesheets recortados por
// tools/sprites/extract_sprites.py a partir de art-source/.
// Aqui definimos como os quadros viram as animações do jogo.
import { makeCanvas } from './canvas.js'
import { onigiri, book, notebook, drops } from './props.js'
import pongoUrl from '../assets/sprites/pongo.webp'
import pongoMeta from '../assets/sprites/pongo.json'
import taroUrl from '../assets/sprites/taro.webp'
import taroMeta from '../assets/sprites/taro.json'
import momoUrl from '../assets/sprites/momo.webp'
import momoMeta from '../assets/sprites/momo.json'
import kumiUrl from '../assets/sprites/kumi.webp'
import kumiMeta from '../assets/sprites/kumi.json'
import silenceUrl from '../assets/sprites/silence.webp'
import silenceMeta from '../assets/sprites/silence.json'

const range = (name, n, from = 0) =>
  Array.from({ length: n }, (_, i) => `${name}_${from + i}`)

// anim do jogo -> quadros de origem (+ objeto desenhado por cima, quando a ação não tem quadro próprio)
const PONGO = {
  idle: { frames: range('idle', 6), fps: 6 },
  walk: { frames: range('walk', 7), fps: 11 },
  run: { frames: range('run', 5), fps: 12 },
  jump: { frames: ['jump_1', 'jump_2'], fps: 10, repeat: 0 },
  fall: { frames: ['jump_3'], fps: 4 },
  sit: { frames: range('sit', 4), fps: 4 },
  stand: { frames: ['sit_3', 'jump_4', 'idle_0'], fps: 9, repeat: 0 },
  eat: { frames: range('talk', 4), fps: 6, prop: 'onigiri' },
  drink: { frames: range('idle', 4), fps: 6, prop: 'drops' },
  sleep: { frames: range('sleep', 3), fps: 3 },
  read: { frames: range('sit', 4), fps: 3, prop: 'book' },
  write: { frames: range('sit', 4), fps: 5, prop: 'notebook' },
  swim: { frames: range('run', 5), fps: 9 },
  interact: { frames: ['interact_0', 'interact_1', 'interact_2', 'interact_1'], fps: 5 },
  kick: { frames: ['attack_1', 'attack_2', 'attack_3'], fps: 10, repeat: 0 },
  celebrate: { frames: range('emote', 5), fps: 7 },
  ride: { frames: range('talk', 5), fps: 6 },
  hurt: { frames: range('hurt', 5), fps: 8 }
}

const npc = (meta) => {
  const g = (name) =>
    Object.keys(meta.frames)
      .filter((k) => k.startsWith(`${name}_`))
      .sort()
  return {
    idle: { frames: g('idle'), fps: 4 },
    talk: { frames: g('talk'), fps: 6 },
    happy: { frames: [...g('talk'), ...g('walk')], fps: 7 }
  }
}

const SILENCE = {
  float: { frames: range('idle', 4), fps: 4 },
  shh: { frames: ['idle_0', 'idle_3'], fps: 2 },
  happy: { frames: [...range('talk', 3), ...range('fly', 3)], fps: 6 }
}

export const IMPORTED = {
  pongo: { url: pongoUrl, meta: pongoMeta, anims: PONGO, shadow: true },
  taro: { url: taroUrl, meta: taroMeta, anims: npc(taroMeta) },
  momo: { url: momoUrl, meta: momoMeta, anims: npc(momoMeta) },
  kumi: { url: kumiUrl, meta: kumiMeta, anims: npc(kumiMeta) },
  silence: { url: silenceUrl, meta: silenceMeta, anims: SILENCE }
}

export function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Carrega todas as imagens; as que falharem voltam como null (o jogo usa a arte procedural). */
export async function loadImported() {
  const entries = await Promise.all(
    Object.entries(IMPORTED).map(async ([id, def]) => [id, await loadImage(def.url)])
  )
  return Object.fromEntries(entries)
}

function drawProp(ctx, prop, nose, cell, i) {
  const [nx, ny] = nose
  if (prop === 'onigiri') onigiri(ctx, nx - 4, ny + 14, i % 4)
  else if (prop === 'book') book(ctx, nx - 16, ny + 34, i)
  else if (prop === 'notebook') notebook(ctx, nx + 2, cell.footY - 6, i)
  else if (prop === 'drops') drops(ctx, nx + 4, ny + 6, i)
}

/**
 * Monta um spritesheet do jogo (mesmo formato do procedural) a partir dos quadros ilustrados.
 * @returns {{ canvas, frames, anims, frame: {w,h,footY}, res: number, shadow: boolean }}
 */
export function composeSheet(id, img, cols = 10) {
  const { meta, anims, shadow } = IMPORTED[id]
  const { w, h, footY } = meta.cell
  const list = []
  for (const [name, def] of Object.entries(anims)) {
    def.frames.forEach((src, i) =>
      list.push({ name: `${name}_${i}`, src, prop: def.prop, i })
    )
  }
  const rows = Math.ceil(list.length / cols)
  const canvas = makeCanvas(w * Math.min(cols, list.length), h * rows)
  const ctx = canvas.getContext('2d')
  const frames = list.map((f, n) => {
    const x = (n % cols) * w
    const y = Math.floor(n / cols) * h
    const s = meta.frames[f.src]
    ctx.drawImage(img, s.x, s.y, w, h, x, y, w, h)
    if (f.prop) {
      ctx.save()
      ctx.translate(x, y)
      ctx.beginPath()
      ctx.rect(0, 0, w, h)
      ctx.clip()
      drawProp(ctx, f.prop, s.nose, meta.cell, f.i)
      ctx.restore()
    }
    return { name: f.name, x, y, w, h }
  })
  const animList = Object.entries(anims).map(([name, def]) => ({
    key: `${id}-${name}`,
    frames: def.frames.map((_, i) => `${name}_${i}`),
    fps: def.fps,
    repeat: def.repeat ?? -1
  }))
  return {
    canvas,
    frames,
    anims: animList,
    frame: { w, h, footY },
    res: 1,
    shadow: !!shadow
  }
}
