// Fundo com parallax: céu, nuvens, cidade, colinas, árvores e casas.
import { GAME_W, GAME_H, GROUND_Y } from '../core/constants.js'

export function buildParallax(scene, worldW, { houses = true } = {}) {
  scene.add
    .image(0, 0, 'sky')
    .setOrigin(0)
    .setScrollFactor(0)
    .setDisplaySize(GAME_W, GAME_H)
    .setDepth(-100)
  scene.add.image(1040, 110, 'sun').setScrollFactor(0).setDepth(-99)
  const clouds = []
  for (let i = 0; i < 9; i++) {
    const c = scene.add
      .image(i * 230 + (i % 2) * 60, 60 + ((i * 53) % 160), `cloud${i % 3}`)
      .setScrollFactor(0.06)
      .setScale(0.55 + ((i * 37) % 50) / 100)
      .setAlpha(0.95)
      .setDepth(-98)
    clouds.push(c)
    scene.tweens.add({
      targets: c,
      x: c.x + 80 + (i % 3) * 30,
      duration: 14000 + i * 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    })
  }
  const tile = (key, y, h, depth) =>
    scene.add
      .tileSprite(0, y, GAME_W, h, key)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(depth)
  const city = tile('city', GROUND_Y - 360, 380, -97)
  const hills = tile('hills', GROUND_Y - 230, 260, -96)
  const trees = tile('treesBack', GROUND_Y - 230, 260, -95)
  trees.setAlpha(0.95)
  if (houses) {
    const f = 0.72
    for (
      let x = 160, i = 0;
      x < (worldW - GAME_W) * f + GAME_W;
      x += 620 + (i % 3) * 90, i++
    ) {
      scene.add
        .image(x, GROUND_Y - 6, `house${i % 3}`)
        .setOrigin(0.5, 1)
        .setScrollFactor(f)
        .setScale(0.85)
        .setDepth(-94)
    }
  }
  return () => {
    const sx = scene.cameras.main.scrollX
    city.tilePositionX = sx * 0.15
    hills.tilePositionX = sx * 0.3
    trees.tilePositionX = sx * 0.5
  }
}
