// Labirinto das direções (Fase 4): instruções relativas em cada
// cruzamento. 右/左 são avaliados em relação à direção de chegada.
import { WorldScene } from './WorldScene.js'
import { TILE, FONT_FAMILY } from '../config/gameConfig.js'
import { T } from '../maps/tiles.js'
import {
  MAZE_ASCII,
  MAZE_ROUNDS,
  BLOCK,
  simulateRoute,
  findChar,
  isJunction,
  doorsAt
} from '../maps/mazeMap.js'
import {
  ABS,
  REL,
  MOVES,
  relativeOf,
  dirFromDelta,
  explainTurn,
  opposite
} from '../systems/DirectionSystem.js'
import { quest } from '../systems/QuestSystem.js'
import { bus } from '../systems/EventBus.js'
import { audio } from '../systems/AudioSystem.js'
import { learning } from '../education/LearningTracker.js'
import { ui } from '../ui/UIManager.js'
import { toHTML } from '../ui/ruby.js'
import { reward } from '../animations/fx.js'

const B = TILE * BLOCK // 32px por bloco
const center = (n) => ({ x: n.x * B + B / 2, y: n.y * B + B / 2 })
const SIDE = {
  left: { ruby: '{左側|ひだりがわ}', pt: 'lado esquerdo', vocab: 'hidarigawa' },
  right: { ruby: '{右側|みぎがわ}', pt: 'lado direito', vocab: 'migigawa' }
}

export class MazeScene extends WorldScene {
  constructor() {
    super('Maze')
  }

  create() {
    this.initWorld('maze', '迷路')
    const W = MAZE_ASCII[0].length * BLOCK
    const H = MAZE_ASCII.length * BLOCK
    const data = Array.from({ length: H }, (_, y) =>
      Array.from({ length: W }, (_, x) =>
        MAZE_ASCII[Math.floor(y / BLOCK)][Math.floor(x / BLOCK)] === '#'
          ? T.HEDGE
          : T.GRAVEL
      )
    )
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE })
    const layer = map.createLayer(
      0,
      map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0),
      0,
      0
    )
    layer.setCollision([T.HEDGE])
    this.physics.world.setBounds(0, 0, W * TILE, H * TILE)

    // Marcas dos cruzamentos
    MAZE_ASCII.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (x % 2 && y % 2 && ch !== '#' && isJunction({ x, y })) {
          const c = center({ x, y })
          this.add.image(c.x, c.y, 'junction').setDepth(1)
        }
      })
    )
    // Salões com portas laterais e placas de saída
    ;['T', 'B'].forEach((ch) => {
      const n = findChar(ch)
      const c = center(n)
      const exitDir = ch === 'T' ? 'N' : 'S'
      this.add
        .text(
          c.x,
          c.y + (ch === 'T' ? -22 : 20),
          ch === 'T' ? '北口 · 出口' : '南口 · 出口',
          {
            fontFamily: FONT_FAMILY,
            fontSize: '8px',
            color: '#fff8e7',
            backgroundColor: '#1f7a4d',
            padding: { x: 3, y: 1 },
            resolution: 3
          }
        )
        .setOrigin(0.5)
        .setDepth(6)
      this.addInteractable({
        x: c.x,
        y: c.y + (exitDir === 'N' ? -14 : 14),
        r: 14,
        top: 12,
        label: '出口 · Sair',
        onUse: () => this.goTo('City', { at: 'maze' })
      })
      ;['W', 'E'].forEach((d) => {
        const dx = d === 'W' ? -1 : 1
        const x = c.x + dx * B
        this.add
          .image(x - dx * 10, c.y + 12, 'doorBlue')
          .setOrigin(0.5, 1)
          .setDepth(6)
        this.addInteractable({
          x: x - dx * 14,
          y: c.y + 4,
          r: 16,
          top: 26,
          label: '',
          onUse: () => this.useDoor(ch, d)
        })
      })
    })

    this.practice = quest.currentMazeRound() == null
    this.spawnPlayer(0, 0, 'N')
    this.physics.add.collider(this.player, layer)
    this.follow(W * TILE, H * TILE)
    quest.attach(this)
    this.startRound(this.practice ? 0 : quest.currentMazeRound())
  }

  async startRound(r) {
    this.r = r
    this.round = MAZE_ROUNDS[r]
    this.route = simulateRoute(this.round)
    this.k = 0
    this.arrived = false
    this.cur = null
    const s = center(findChar(this.round.start))
    this.player.setPosition(s.x, s.y + 8)
    this.player.face(this.round.heading)
    this.cameras.main.fadeIn(250, 27, 21, 48)
    this.objective()
    await this.runDialogue(this.round.intro)
    this.objective()
  }

  objective() {
    const j = this.route.junctions[this.k]
    const side = SIDE[this.round.door]
    if (j) {
      bus.emit('objective', {
        stage: 'output',
        speaker: 'michi',
        speakerName: `Michi · Rodada ${this.r + 1}`,
        jp: MOVES[j.instr].ruby,
        jpPt: MOVES[j.instr].pt,
        task: `Cruzamento ${this.k + 1}/${this.route.junctions.length}: faça isso no PRÓXIMO cruzamento (marca redonda).`,
        hint: 'O anel azul da bússola mostra 前・右・後ろ・左 de Pongo.'
      })
    } else {
      bus.emit('objective', {
        stage: 'output',
        speaker: 'michi',
        speakerName: `Michi · Rodada ${this.r + 1}`,
        jp: `まっすぐ {行|い}って、${side.ruby}の ドアに {入|はい}って ください。`,
        jpPt: `Siga em frente e entre pela porta do ${side.pt}.`,
        task: 'Chegue ao salão e examine a porta certa (E).'
      })
    }
  }

  nodeAt(x, y) {
    const bx = Math.round((x - B / 2) / B)
    const by = Math.round((y - B / 2) / B)
    if (bx % 2 !== 1 || by % 2 !== 1) return null
    return { x: bx, y: by }
  }

  worldUpdate() {
    const pl = this.player
    const cx = pl.x
    const cy = pl.y - 6
    const n = this.nodeAt(cx, cy)
    const inNode = n && Math.hypot(center(n).x - cx, center(n).y - cy) < 9
    if (inNode && (!this.cur || this.cur.x !== n.x || this.cur.y !== n.y)) {
      this.cur = n
      this.headingIn = pl.facing
      if (
        this.k >= this.route.junctions.length &&
        n.x === this.route.end.x &&
        n.y === this.route.end.y &&
        !this.arrived
      ) {
        this.arrived = true
        ui.toast('Você chegou ao salão! Agora escolha a porta.', 'ok')
      }
    } else if (this.cur) {
      const c = center(this.cur)
      if (Math.hypot(c.x - cx, c.y - cy) > 20) {
        const out = dirFromDelta(cx - c.x, cy - c.y)
        const node = this.cur
        this.cur = null
        if (isJunction(node)) this.evaluate(node, this.headingIn, out)
      }
    }
  }

  evaluate(node, hin, out) {
    if (this.practiceDone) return
    const j = this.route.junctions[this.k]
    if (!j)
      return this.resetTo(
        this.route.junctions[this.k - 1]?.node || node,
        hin,
        'Você já passou por todos os cruzamentos: siga até o salão.'
      )
    if (j.node.x !== node.x || j.node.y !== node.y)
      return this.resetTo(
        j.node,
        j.headingIn,
        'Ops, caminho errado. Voltando ao cruzamento certo…'
      )
    const rel = relativeOf(hin, out)
    const want = MOVES[j.instr].rel
    if (rel === 'back')
      return this.resetTo(node, hin, 'Para trás (後ろ) não! Siga a instrução do Michi.')
    const vocab = { front: 'massugu', right: 'migi', left: 'hidari' }[want]
    if (rel === want) {
      learning.record({
        skill: 'relative',
        vocab: [vocab],
        correct: true,
        tag: 'relative'
      })
      audio.sfx('success')
      ui.toast(
        `✔ ${toHTML(REL[rel].ruby)} — olhando para ${ABS[hin].kanji}, ${REL[rel].pt} = ${ABS[out].kanji} (${ABS[out].pt}).`,
        'ok',
        3000
      )
      this.k++
      this.objective()
    } else {
      learning.record({
        skill: 'relative',
        vocab: [vocab],
        correct: false,
        tag: 'relative'
      })
      audio.sfx('soft-error')
      this.resetTo(
        node,
        hin,
        `💜 Você foi para ${ABS[out].kanji} (${REL[rel].kanji}). ${explainTurn(hin, j.instr)}`
      )
    }
  }

  resetTo(node, facing, msg) {
    ui.toast(msg, 'soft', 4200)
    const c = center(node)
    const [dx, dy] = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] }[facing]
    // recoloca Pongo pouco antes do cruzamento, olhando na direção de chegada
    this.player.setPosition(c.x + dx * 22, c.y + 6 + dy * 22)
    this.player.face(facing)
    this.cur = null
    this.cameras.main.flash(150, 155, 92, 255)
  }

  async useDoor(hall, dir) {
    const goal = this.round.goal
    if (hall !== goal)
      return ui.toast(
        'Esta é a porta do salão de partida. Siga as instruções até o outro salão!',
        'soft'
      )
    if (this.k < this.route.junctions.length)
      return ui.toast('Ainda faltam cruzamentos! Volte à rota do Michi.', 'soft')
    const door = doorsAt(this.route.end, this.route.endHeading).find((d) => d.dir === dir)
    const want = this.round.door
    const side = SIDE[door.side]
    if (door.side === want) {
      learning.record({
        skill: 'relative',
        vocab: [side.vocab],
        correct: true,
        tag: 'relative'
      })
      reward('🚪', `${side.ruby.replace(/\{([^|]+)\|[^}]+\}/, '$1')} ✓`)
      await ui.feedbackCard({
        title: `Rodada ${this.r + 1} concluída!`,
        jp: `${side.ruby}の ドアに {入|はい}りました。`,
        pt: `Você entrou pela porta do ${side.pt}.`,
        explain: `Você chegou andando para ${ABS[this.route.endHeading].kanji} (${ABS[this.route.endHeading].pt}). Para quem olha para lá, o ${side.pt} fica a ${ABS[dir].kanji} (${ABS[dir].pt}).`
      })
      if (this.practice) return this.goTo('City', { at: 'maze' })
      quest.handle({ type: 'mazeRoundDone', round: this.r })
      const next = quest.currentMazeRound()
      if (next != null) this.startRound(next)
      else this.goTo('City', { at: 'maze' })
    } else {
      learning.record({
        skill: 'relative',
        vocab: [SIDE[want].vocab],
        correct: false,
        tag: 'relative'
      })
      audio.sfx('soft-error')
      ui.feedbackCard({
        soft: true,
        title: 'Porta errada — tudo bem!',
        jp: `これは ${side.ruby}の ドアです。`,
        pt: `Esta é a porta do ${side.pt}.`,
        explain: `Você chegou olhando para ${ABS[this.route.endHeading].kanji}. ${SIDE[want].ruby.replace(/\{([^|]+)\|[^}]+\}/, '$1')} (${SIDE[want].pt}) fica a ${ABS[doorsAt(this.route.end, this.route.endHeading).find((d) => d.side === want).dir].kanji}. Dica: imagine-se de costas para ${ABS[opposite(this.route.endHeading)].kanji}.`
      })
    }
  }

  refreshQuestState() {}
}
