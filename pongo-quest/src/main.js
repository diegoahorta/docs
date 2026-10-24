// PONGO: 方向の冒険 — ponto de entrada.
// ODU Creative — Learn. Play. Connect.
import Phaser from 'phaser'
import '@fontsource/dotgothic16/400.css'
import './styles/main.css'
import { GAME_WIDTH, GAME_HEIGHT } from './config/gameConfig.js'
import { BootScene } from './scenes/BootScene.js'
import { PreloadScene } from './scenes/PreloadScene.js'
import { MenuScene } from './scenes/MenuScene.js'
import { CityScene } from './scenes/CityScene.js'
import { InteriorScene } from './scenes/InteriorScene.js'
import { MazeScene } from './scenes/MazeScene.js'
import { DialogueScene } from './scenes/DialogueScene.js'
import { PuzzleScene } from './scenes/PuzzleScene.js'
import { ResultScene } from './scenes/ResultScene.js'
import { bus } from './systems/EventBus.js'
import { saves } from './systems/SaveSystem.js'

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1b1530',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  input: { keyboard: false },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    CityScene,
    InteriorScene,
    MazeScene,
    DialogueScene,
    PuzzleScene,
    ResultScene
  ]
})

// Voltar ao menu a partir de qualquer cena.
bus.on('game:menu', () => {
  ;['City', 'Interior', 'Maze', 'Dialogue', 'Puzzle', 'Result'].forEach((k) => {
    if (game.scene.isActive(k) || game.scene.isPaused(k)) game.scene.stop(k)
  })
  game.scene.start('Menu')
})

window.addEventListener('beforeunload', () => saves.save())
document.addEventListener('visibilitychange', () => document.hidden && saves.save())

if (import.meta.env.DEV) window.__PONGO__ = { game, bus }
