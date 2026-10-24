// Interiores exploráveis: casa (gatos escondidos) e biblioteca (revisão).
import { WorldScene } from './WorldScene.js'
import { TILE, FONT_FAMILY } from '../config/gameConfig.js'
import { T, SOLID_TILES } from '../maps/tiles.js'
import { INTERIORS } from '../maps/interiorMaps.js'
import { NPC } from '../entities/NPC.js'
import { quest } from '../systems/QuestSystem.js'
import { state } from '../systems/GameState.js'
import { CATS, INSPECTABLES } from '../data/cats.js'
import { VOCAB } from '../education/vocabulary.js'
import { learning } from '../education/LearningTracker.js'
import { reviewItems, recognitionItem } from '../education/questionBank.js'
import { ui } from '../ui/UIManager.js'
import { toHTML, plain } from '../ui/ruby.js'
import { chooseInspect } from '../ui/InspectMenu.js'
import { gsap, motionOK } from '../animations/fx.js'

const px = (t) => t * TILE

/** Posição (px) do gato conforme objeto + posição — o gato fica mesmo lá. */
function catSpot(f, pos) {
  const x = px(f.x)
  const y = px(f.y)
  const w = px(f.w)
  const h = px(f.h)
  switch (pos) {
    case 'naka':
      return { x: x + w / 2, y: y + 20, depth: 'between' } // cabeça aparece acima da borda
    case 'ue':
      return { x: x + w / 2, y: y + 6, depth: 'above' }
    case 'shita':
      return { x: x + w / 2, y: y + h - 1, depth: 'below' }
    case 'ushiro':
      return { x: x + w / 2, y: y + 4, depth: 'below' }
    case 'mae':
      return { x: x + w / 2, y: y + h + 10, depth: 'above' }
    case 'soto':
      return { x: x + w + 8, y: y + h, depth: 'above' }
    default:
      return { x: x + w / 2, y: y + h, depth: 'above' }
  }
}

export class InteriorScene extends WorldScene {
  constructor() {
    super('Interior')
  }

  init(data) {
    this.roomId = data?.id || 'house'
    this.room = INTERIORS[this.roomId]
  }

  create() {
    const R = this.room
    this.initWorld('interior', plain(R.title))
    const floor = T[R.floor]
    const data = Array.from({ length: R.h }, (_, y) =>
      Array.from({ length: R.w }, (_, x) => {
        if (y < 2 || x === 0 || x === R.w - 1) return T.WALL
        if (y === R.h - 1) return x === R.door.x || x === R.door.x + 1 ? floor : T.WALL
        if (
          R.rug &&
          x >= R.rug.x &&
          x < R.rug.x + R.rug.w &&
          y >= R.rug.y &&
          y < R.rug.y + R.rug.h
        )
          return T.RUG
        return floor
      })
    )
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE })
    const layer = map.createLayer(
      0,
      map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0),
      0,
      0
    )
    layer.setCollision(SOLID_TILES)
    this.physics.world.setBounds(0, 0, px(R.w), px(R.h + 1))
    this.add
      .text(px(R.w) / 2, 8, plain(R.title), {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#5a3a5a',
        resolution: 3
      })
      .setOrigin(0.5)
      .setDepth(5)

    this.solidList = []
    this.furniture = {}
    R.furniture.forEach((f) => {
      const x = px(f.x)
      const y = px(f.y)
      const img = this.add
        .image(x + px(f.w) / 2, y + px(f.h), f.kind)
        .setOrigin(0.5, 1)
        .setDepth(10 + y + px(f.h))
      this.furniture[f.id] = { ...f, img }
      const z = this.add.zone(
        x + px(f.w) / 2,
        y + px(f.h) / 2 + 4,
        px(f.w) - 4,
        px(f.h) - 8
      )
      this.physics.add.existing(z, true)
      this.solidList.push(z)
      if (f.inspect)
        this.addInteractable({
          x: x + px(f.w) / 2,
          y: y + px(f.h) + 4,
          r: Math.max(24, px(f.w) / 2 + 8),
          top: px(f.h) + 8,
          label: '',
          onUse: () => this.inspect(f)
        })
      if (f.note === 'book')
        this.addInteractable({
          x: x + 16,
          y: y + px(f.h) + 4,
          r: 26,
          top: px(f.h) + 6,
          label: '',
          onUse: () => this.readBook()
        })
    })

    this.npcs = (R.npcs || []).map((n) => {
      const npc = new NPC(this, n.id, px(n.x) + 8, px(n.y) + 16)
      this.addInteractable({
        x: npc.x,
        y: npc.y + 22,
        r: 26,
        top: 44,
        label: '',
        onUse: () => this.talkSatou()
      })
      return npc
    })

    this.createCats()
    this.spawnPlayer(px(R.spawn.x), px(R.spawn.y), R.spawn.facing)
    this.physics.add.collider(this.player, layer)
    this.physics.add.collider(this.player, this.solidList)
    this.physics.add.collider(this.player, this.npcs)
    this.follow(px(R.w), px(R.h))
    quest.attach(this)
  }

  createCats() {
    this.cats = {}
    CATS.filter((c) => c.scene === this.roomId).forEach((c) => {
      const f = Object.values(this.furniture).find((x) => x.inspect === c.object)
      if (!f) return
      const spot = catSpot(f, c.pos)
      const base = f.img.depth
      const depth =
        spot.depth === 'above' ? base + 2 : spot.depth === 'between' ? base + 1 : base - 1
      const s = this.add
        .sprite(spot.x, spot.y, `cat-${c.id}`, 0)
        .setOrigin(0.5, 1)
        .setDepth(depth)
      if (!this.anims.exists(`cat-${c.id}-idle`))
        this.anims.create({
          key: `cat-${c.id}-idle`,
          frames: this.anims.generateFrameNumbers(`cat-${c.id}`, { start: 0, end: 1 }),
          frameRate: 2,
          repeat: -1
        })
      s.play(`cat-${c.id}-idle`)
      s.setVisible(state.progress.foundCats.includes(c.id))
      this.cats[c.id] = s
      // A frente da caixa cobre o gato que está “dentro”.
      if (c.pos === 'naka' && f.kind === 'box')
        this.add
          .image(f.img.x, f.img.y, 'boxFront')
          .setOrigin(0.5, 1)
          .setDepth(depth + 1)
    })
  }

  revealCat(id) {
    const s = this.cats[id]
    if (!s) return
    s.setVisible(true)
    if (motionOK())
      gsap.from(s, { y: s.y + 6, alpha: 0, duration: 0.45, ease: 'back.out(2)' })
  }

  async inspect(f) {
    this.player.face('N')
    const pos = await chooseInspect(f.inspect)
    if (!pos) return
    if (quest.handle({ type: 'inspect', object: f.inspect, pos })) return
    const obj = INSPECTABLES[f.inspect]
    ui.toast(
      `${toHTML(`${obj.name}を {見|み}ました。なにも いません。`)} <span class="tr">Você olhou: nada aqui.</span>`
    )
  }

  readBook() {
    ui.feedbackCard({
      title: 'Um livro sobre a mesa',
      jp: '{本|ほん}は[ref:{机|つくえ}][no:の][pos:{上|うえ}][part:に][pred:あります]。',
      pt: 'O livro está sobre a mesa.',
      explain: 'Livro é objeto → あります. 机の上 = em cima da mesa.'
    })
    learning.see(['ue', 'arimasu'])
  }

  /** Bibliotecária: revisão dos itens errados (ou prática livre). */
  async talkSatou() {
    if (quest.busy) return
    await this.runDialogue('satou_hello')
    const review = learning.reviewList(4)
    let items = reviewItems(review, 4)
    let title = 'ふくしゅう · Revisão dos seus erros'
    if (!items.length) {
      const seen = VOCAB.filter((w) => learning.isSeen(w.id))
      const pool = (seen.length >= 4 ? seen : VOCAB)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)
      items = pool.map((w) => recognitionItem(w.id))
      title = 'れんしゅう · Prática livre'
    }
    await this.runPuzzle({
      title,
      stage: 'intake',
      items,
      noReview: true,
      setId: 'library-review'
    })
  }

  worldUpdate() {
    const R = this.room
    if (this.player.y > px(R.h) - 2 && !this.leaving)
      this.goTo('City', { at: R.exitTo.at })
  }

  refreshQuestState() {}
}
