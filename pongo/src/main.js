// Ponto de entrada: Phaser (jogo) + camada DOM (interface com GSAP).
import * as Phaser from 'phaser'
import './styles/main.css'
import { GAME_W, GAME_H, GRAVITY } from './core/constants.js'
import { load, setting } from './core/store.js'
import { bus } from './core/events.js'
import { unlockAudio, startMusic } from './core/audio.js'
import { initUI, showScreen, clearScreen, isBlocking, wipe } from './ui/ui.js'
import { titleScreen } from './ui/screens/title.js'
import { mapScreen } from './ui/screens/map.js'
import { openJournal } from './ui/screens/journal.js'
import { openNotebook } from './ui/screens/notebook.js'
import { openInventory } from './ui/screens/inventory.js'
import { openSettings } from './ui/screens/settings.js'
import { openAchievements } from './ui/screens/achievements.js'
import { openReview } from './ui/screens/review.js'
import { openPause } from './ui/screens/pause.js'
import { initAchievements } from './systems/achievements.js'
import { BootScene } from './scenes/BootScene.js'
import { TitleScene } from './scenes/TitleScene.js'
import { ParkScene } from './scenes/ParkScene.js'
import { RunnerScene } from './scenes/RunnerScene.js'

load()
initUI()
initAchievements()

async function fontsReady() {
  if (!document.fonts?.load) return
  const timeout = new Promise((r) => setTimeout(r, 2500))
  await Promise.race([
    Promise.all([
      document.fonts.load('800 32px "M PLUS Rounded 1c"', '公園日本語アクション'),
      document.fonts.load('700 20px "M PLUS Rounded 1c"', 'こうえんポンゴ')
    ]).catch(() => {}),
    timeout
  ])
}

await fontsReady()

const debug = new URLSearchParams(location.search).has('debug')
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#bfe7fb',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY }, debug } },
  input: { gamepad: true, activePointers: 3 },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, TitleScene, ParkScene, RunnerScene]
})
window.__PONGO__ = game

const scenes = () => game.scene
const inLevel = () => scenes().isActive('Park') || scenes().isPaused('Park')

function toTitle() {
  wipe(() => {
    scenes().stop('Runner')
    scenes().stop('Park')
    if (!scenes().isActive('Title')) scenes().start('Title')
    showScreen(titleScreen())
  })
}

function toMap() {
  wipe(() => {
    scenes().stop('Runner')
    scenes().stop('Park')
    if (!scenes().isActive('Title')) scenes().start('Title')
    showScreen(mapScreen())
  })
}

function play() {
  unlockAudio()
  wipe(() => {
    clearScreen()
    scenes().stop('Title')
    scenes().stop('Runner')
    scenes().stop('Park')
    scenes().start('Park')
  })
}

bus.once('boot:ready', () => {
  document.getElementById('loading')?.remove()
  showScreen(titleScreen())
})
bus.on('nav:title', toTitle)
bus.on('nav:map', toMap)
bus.on('nav:play', play)
bus.on('ui:journal', openJournal)
bus.on('ui:notebook', () => openNotebook())
bus.on('ui:inventory', openInventory)
bus.on('ui:settings', openSettings)
bus.on('ui:achievements', openAchievements)
bus.on('ui:review', openReview)
bus.on('ui:pause', () => {
  if (inLevel() && !isBlocking()) openPause()
})

// Desbloqueia o áudio no primeiro gesto (política de autoplay dos navegadores).
const firstGesture = () => {
  unlockAudio()
  if (setting('music')) startMusic()
}
window.addEventListener('pointerdown', firstGesture, { once: true })
window.addEventListener('keydown', firstGesture, { once: true })

// Pausa automática quando a aba perde o foco.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && scenes().isActive('Park') && !isBlocking()) openPause()
})
