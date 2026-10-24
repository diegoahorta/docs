// Cidade explorável ことばの町.
import { WorldScene } from './WorldScene.js'
import { TILE, FONT_FAMILY } from '../config/gameConfig.js'
import { SOLID_TILES } from '../maps/tiles.js'
import {
  buildCityTiles,
  CITY_W,
  CITY_H,
  BUILDINGS,
  MARKERS,
  FOUNTAIN,
  CAR,
  BIG_TREE,
  MAZE_GATE,
  NPC_SPAWNS,
  SPAWNS,
  STREET_SIGNS,
  TREES,
  LIGHTS,
  BENCHES
} from '../maps/cityMap.js'
import { NPC } from '../entities/NPC.js'
import { quest } from '../systems/QuestSystem.js'
import { state } from '../systems/GameState.js'
import { audio } from '../systems/AudioSystem.js'
import { saves } from '../systems/SaveSystem.js'
import { CATS } from '../data/cats.js'
import { phaseById } from '../data/phases.js'
import { ui } from '../ui/UIManager.js'
import { toHTML, plain, escapeHTML } from '../ui/ruby.js'
import { chooseInspect } from '../ui/InspectMenu.js'
import { signRestore, shine, gsap, motionOK } from '../animations/fx.js'

const px = (t) => t * TILE

export class CityScene extends WorldScene {
  constructor() {
    super('City')
  }

  init(data) {
    this.spawnAt = data?.at
  }

  create() {
    this.initWorld('city')
    this.solidList = []

    const map = this.make.tilemap({
      data: buildCityTiles(),
      tileWidth: TILE,
      tileHeight: TILE
    })
    const ts = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)
    this.layer = map.createLayer(0, ts, 0, 0).setDepth(0)
    this.layer.setCollision(SOLID_TILES)
    this.physics.world.setBounds(0, 0, px(CITY_W), px(CITY_H))

    this.createBuildings()
    this.createDecor()
    this.createMarkers()
    this.createNPCs()
    this.createCityCats()

    const p = state.progress
    let sp
    if (this.spawnAt) sp = SPAWNS[this.spawnAt]
    else if (p.pos) sp = p.pos
    else sp = SPAWNS[phaseById(p.phase)?.spawn.at || 'station']
    this.spawnPlayer(px(sp.x), px(sp.y), sp.facing)
    this.physics.add.collider(this.player, this.layer)
    this.physics.add.collider(this.player, this.solidList)
    this.physics.add.collider(
      this.player,
      this.npcs.map((n) => n)
    )
    this.follow(px(CITY_W), px(CITY_H))
    this.insideMarker = null

    audio.startMusic()
    quest.attach(this)
    this.refreshQuestState()
  }

  solid(x, y, w, h) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h)
    this.physics.add.existing(z, true)
    this.solidList.push(z)
    return z
  }

  // ── Prédios e placas ───────────────────────────────────────
  createBuildings() {
    const signs = this.registry.get('signs')
    this.signTexts = {}
    BUILDINGS.forEach((b) => {
      const x = px(b.rect.x)
      const y = px(b.rect.y)
      const w = px(b.rect.w)
      const h = px(b.rect.h)
      this.add
        .image(x, y, `bld-${b.id}`)
        .setOrigin(0, 0)
        .setDepth(10 + y + h)
      this.solid(x, y + 6, w, h - 6)
      const s = signs[b.id]
      const text = this.add
        .text(x + s.x + s.w / 2, y + s.y + s.h / 2 + 0.5, '', {
          fontFamily: FONT_FAMILY,
          fontSize: '10px',
          color: '#1b1530',
          resolution: 3
        })
        .setOrigin(0.5)
        .setDepth(10 + y + h + 1)
      const glow = this.add
        .image(text.x, text.y, 'sparkle')
        .setDepth(text.depth + 1)
        .setAlpha(0)
        .setScale(2)
      this.signTexts[b.id] = { text, glow, b, maxW: s.w - 4 }
      this.setSignText(b.id)
      // Porta
      this.addInteractable({
        x: px(b.door.x + 1),
        y: px(b.door.y + 1) + 5,
        top: 22,
        label: '',
        id: `door-${b.id}`,
        onUse: () => this.useDoor(b)
      })
    })
  }

  signLabel(id) {
    if (quest.isScrambled(id)) return '？？？'
    const b = BUILDINGS.find((x) => x.id === id)
    return plain(b?.name || '{公園|こうえん}')
  }

  setSignText(id) {
    const st = this.signTexts[id]
    if (!st) return
    const label = this.signLabel(id)
    const scrambled = label === '？？？'
    st.text.setText(label).setColor(scrambled ? '#9b5cff' : '#1b1530')
    const size = Math.min(10, Math.floor(st.maxW / [...label].length))
    st.text.setFontSize(size)
    if (scrambled && !st.wobble && motionOK())
      st.wobble = gsap.to(st.text, {
        angle: 4,
        duration: 0.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      })
    if (!scrambled && st.wobble) {
      st.wobble.kill()
      st.wobble = null
      st.text.setAngle(0)
    }
  }

  restoreSign(id) {
    if (id === 'park') return this.setParkSign(true)
    const st = this.signTexts[id]
    if (!st) return
    this.setSignText(id)
    signRestore(st.text, st.glow)
    this.sparkleAt(st.text.x, st.text.y)
  }

  sparkleAt(x, y) {
    for (let i = 0; i < 8; i++) {
      const s = this.add.image(x, y, 'sparkle').setDepth(7000)
      const a = (i / 8) * Math.PI * 2
      gsap.to(s, {
        x: x + Math.cos(a) * 18,
        y: y + Math.sin(a) * 12,
        alpha: 0,
        duration: motionOK() ? 0.7 : 0.01,
        onComplete: () => s.destroy()
      })
    }
  }

  async useDoor(b) {
    this.player.face('N')
    if (quest.handle({ type: 'door', building: b.id })) return
    if (b.enter) return this.goTo('Interior', { id: b.enter })
    if (quest.isScrambled(b.id)) {
      ui.toast('A placa está embaralhada por まよいネコ… 🌀', 'soft')
      return
    }
    audio.speak(`ここは ${b.name}です。`)
    ui.toast(
      `${toHTML(`ここは ${b.name}です。`)} <span class="tr">Aqui é: ${escapeHTML(b.pt)} (fechado agora)</span>`
    )
  }

  // ── Decoração ──────────────────────────────────────────────
  createDecor() {
    TREES.forEach(([tx, ty]) => {
      const x = px(tx) + 8
      const y = px(ty) + 16
      this.add
        .image(x, y, 'tree')
        .setOrigin(0.5, 1)
        .setDepth(10 + y)
      this.solid(x - 4, y - 6, 8, 5)
    })
    const bx = px(BIG_TREE.x) + 8
    const by = px(BIG_TREE.y) + 16
    this.add
      .image(bx, by, 'bigTree')
      .setOrigin(0.5, 1)
      .setDepth(10 + by)
    this.solid(bx - 6, by - 8, 12, 7)
    LIGHTS.forEach(({ x, y }) => {
      const X = px(x) + 8
      const Y = px(y) + 15
      this.add
        .image(X, Y, 'light')
        .setOrigin(0.5, 1)
        .setDepth(10 + Y)
      this.solid(X - 2, Y - 3, 4, 3)
    })
    BENCHES.forEach(({ x, y }) => {
      const X = px(x) + 8
      const Y = px(y) + 12
      this.add
        .image(X, Y, 'bench')
        .setOrigin(0.5, 1)
        .setDepth(10 + Y)
      this.solid(X - 12, Y - 8, 24, 7)
    })
    // Fonte
    const fx = px(FOUNTAIN.x) + 24
    const fy = px(FOUNTAIN.y) + 24
    this.add.image(fx, fy, 'fountain').setDepth(10 + fy + 16)
    this.solid(fx - 20, fy - 14, 40, 34)
    // Carro (Fase 3: そば / Fase 5: destino)
    const cx = px(CAR.x) + 16
    const cy = px(CAR.y) + 14
    this.add
      .image(cx, cy, 'car')
      .setOrigin(0.5, 0.7)
      .setDepth(10 + cy)
    this.solid(cx - 15, cy - 8, 30, 10)
    this.addInteractable({
      x: cx,
      y: cy + 4,
      r: 26,
      top: 20,
      label: '',
      onUse: () => this.useCar()
    })
    // Portão do labirinto
    const gx = px(MAZE_GATE.x) + 16
    const gy = px(MAZE_GATE.y) + 16
    this.add
      .image(gx, gy, 'gate')
      .setOrigin(0.5, 1)
      .setDepth(10 + gy)
    this.add
      .text(gx, gy - 37, '迷路', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        color: '#c0392b',
        resolution: 3
      })
      .setOrigin(0.5)
      .setDepth(11 + gy)
    this.solid(gx - 28, gy - 14, 10, 14)
    this.solid(gx + 18, gy - 14, 10, 14)
    this.solid(gx - 18, gy - 4, 36, 4)
    this.addInteractable({
      x: gx,
      y: gy - 12,
      r: 24,
      top: 30,
      label: '迷路 · Labirinto',
      onUse: () => this.useMaze()
    })
    // Placas de rua
    STREET_SIGNS.forEach((s) => {
      const X = px(s.x) + 8
      const Y = px(s.y) + 16
      this.add
        .image(X, Y, 'signpost')
        .setOrigin(0.5, 1)
        .setDepth(10 + Y)
      this.solid(X - 2, Y - 3, 4, 3)
      const short = s.building ? '' : plain(s.jp).split('：')[0].replace(/\s/g, '')
      const txt = this.add
        .text(X, Y - 20, short, {
          fontFamily: FONT_FAMILY,
          fontSize: '8px',
          color: '#ffffff',
          resolution: 3
        })
        .setOrigin(0.5)
        .setDepth(11 + Y)
      if (s.building === 'park') this.parkSign = txt
      this.addInteractable({
        x: X,
        y: Y,
        top: 30,
        label: '',
        onUse: () => this.useSign(s)
      })
    })
    this.setParkSign(false)
    // Lago (destino da Fase 5)
    this.addInteractable({
      x: px(55) + 8,
      y: px(33) + 8,
      r: 26,
      top: 14,
      label: '池',
      onUse: () => this.usePond()
    })
  }

  setParkSign(animate) {
    if (!this.parkSign) return
    const scr = quest.isScrambled('park')
    this.parkSign.setText(scr ? '？？？' : '公園').setColor(scr ? '#e3d4ff' : '#ffffff')
    if (animate) {
      signRestore(this.parkSign)
      this.sparkleAt(this.parkSign.x, this.parkSign.y)
    }
  }

  useSign(s) {
    this.player.face('N')
    if (s.building === 'park') {
      if (quest.handle({ type: 'sign', building: 'park' })) return
      if (quest.isScrambled('park'))
        return ui.toast('A placa está embaralhada… 🌀', 'soft')
    }
    audio.speak(s.jp)
    ui.toast(`🪧 ${toHTML(s.jp)} <span class="tr">— ${escapeHTML(s.pt)}</span>`, '', 3800)
  }

  async useCar() {
    if (quest.handle({ type: 'spot', id: 'car' })) return
    const pos = await chooseInspect('car')
    if (!pos) return
    if (quest.handle({ type: 'inspect', object: 'car', pos })) return
    ui.toast(`${toHTML('なにも いません。')} <span class="tr">Não há nada aqui.</span>`)
  }

  usePond() {
    if (quest.handle({ type: 'spot', id: 'pond' })) return
    ui.toast(
      `${toHTML('{池|いけ}です。{公園|こうえん}の {中|なか}に あります。')} <span class="tr">É um lago. Fica dentro do parque.</span>`
    )
  }

  useMaze() {
    const s = quest.step
    if (s?.type === 'maze' || quest.free) return this.goTo('Maze', {})
    if (state.progress.phase < 4)
      return ui.toast('O labirinto ainda está fechado. Volte na Fase 4!', 'soft')
    ui.toast('Fale com o robô Michi primeiro.', 'soft')
  }

  // ── Marcadores da bússola (Fase 1) ─────────────────────────
  createMarkers() {
    this.markers = {}
    Object.entries(MARKERS).forEach(([id, m]) => {
      const x = px(m.x) + 8
      const y = px(m.y) + 10
      const ped = this.add.image(x, y, 'pedestal').setDepth(10 + y)
      const shard = this.add.image(x, y - 10, 'shard').setDepth(11 + y)
      const tween = shine(shard)
      this.markers[id] = { x, y, ped, shard, tween }
    })
  }

  collectShard(id) {
    const m = this.markers[id]
    if (!m) return
    m.tween?.kill()
    gsap.to(m.shard, {
      y: m.shard.y - 24,
      alpha: 0,
      scale: 2,
      duration: motionOK() ? 0.6 : 0.01,
      onComplete: () => m.shard.setVisible(false)
    })
    this.sparkleAt(m.x, m.y - 10)
  }

  // ── NPCs ───────────────────────────────────────────────────
  createNPCs() {
    this.npcs = []
    this.npcById = {}
    Object.entries(NPC_SPAWNS).forEach(([id, s]) => {
      const npc = new NPC(this, id, px(s.x) + 8, px(s.y) + 16)
      this.npcs.push(npc)
      this.npcById[id] = npc
      this.addInteractable({
        x: npc.x,
        y: npc.y - 2,
        r: 24,
        top: npc.height + 8,
        label: '',
        enabled: () => npc.visible,
        onUse: () => this.talkTo(id)
      })
    })
  }

  faceToward(npcId) {
    const n = this.npcById[npcId]
    if (!n) return this.player.facing
    const dx = n.x - this.player.x
    const dy = n.y - this.player.y
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N'
  }

  createCityCats() {
    this.cityCats = {}
    CATS.filter((c) => c.scene === 'city').forEach((c) => {
      const x = px(CAR.x) + 38
      const y = px(CAR.y) + 18
      const s = this.add
        .sprite(x, y, `cat-${c.id}`, 0)
        .setOrigin(0.5, 1)
        .setDepth(10 + y)
      if (!this.anims.exists(`cat-${c.id}-idle`))
        this.anims.create({
          key: `cat-${c.id}-idle`,
          frames: this.anims.generateFrameNumbers(`cat-${c.id}`, { start: 0, end: 1 }),
          frameRate: 2,
          repeat: -1
        })
      s.play(`cat-${c.id}-idle`)
      s.setVisible(state.progress.foundCats.includes(c.id))
      this.cityCats[c.id] = s
    })
  }

  revealCat(id) {
    const s = this.cityCats[id]
    if (!s) return
    s.setVisible(true)
    if (motionOK())
      gsap.from(s, { scaleX: 0, scaleY: 0, duration: 0.5, ease: 'back.out(3)' })
    this.sparkleAt(s.x, s.y - 6)
  }

  // ── Estado da missão ───────────────────────────────────────
  refreshQuestState() {
    if (!this.npcs) return
    const questNpcs = quest.questNpcs()
    this.npcs.forEach((n) => {
      const shown = n.id !== 'mayoi' || quest.mayoiVisible()
      n.setShown(shown)
      n.setQuest(shown && questNpcs.includes(n.id))
    })
    const p = state.progress
    const s = quest.step
    const phase1 = p.phase === 1 && !!s
    Object.entries(this.markers).forEach(([id, m]) => {
      m.ped.setVisible(phase1 || p.phase === 1)
      m.shard.setVisible(
        phase1 &&
          !p.collected.includes(id) &&
          (s.type === 'reach' || s.type === 'dialogue')
      )
    })
    Object.keys(this.signTexts).forEach((id) => this.setSignText(id))
    this.setParkSign(false)
    Object.entries(this.cityCats).forEach(([id, c]) =>
      c.setVisible(p.foundCats.includes(id))
    )
  }

  placeAtSpawn(at) {
    const sp = SPAWNS[at]
    if (!sp || !this.player) return
    this.player.setPosition(px(sp.x), px(sp.y))
    this.player.face(sp.facing)
    this.cameras.main.fadeIn(300, 27, 21, 48)
  }

  worldUpdate() {
    const pl = this.player
    let inside = null
    for (const [id, m] of Object.entries(this.markers)) {
      if (Math.hypot(pl.x - m.x, pl.y - 4 - m.y) < 12) inside = id
    }
    if (inside !== this.insideMarker) {
      this.insideMarker = inside
      const s = quest.step
      if (inside && s && (s.type === 'reach' || s.type === 'sequence'))
        quest.handle({ type: 'reach', marker: inside })
    }
    if (this.time.now - (this.lastPosSave || 0) > 3000) {
      this.lastPosSave = this.time.now
      state.progress.pos = { x: pl.x / TILE, y: pl.y / TILE, facing: pl.facing }
      saves.saveSoon(2000)
    }
  }
}
