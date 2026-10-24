// Diretor de missões: interpreta os passos das fases (data/phases.js),
// reage a eventos do mundo (falar, chegar, examinar portas…), atualiza
// o objetivo no HUD e conduz INPUT → INTAKE → OUTPUT.
import { state } from './GameState.js'
import { bus } from './EventBus.js'
import { saves } from './SaveSystem.js'
import { audio } from './AudioSystem.js'
import { ABS } from './DirectionSystem.js'
import { PHASES, phaseById } from '../data/phases.js'
import { PUZZLE_SETS } from '../data/puzzles.js'
import { CATS, POSITIONS, INSPECTABLES } from '../data/cats.js'
import { NPCS } from '../data/npcs.js'
import {
  MARKERS,
  NPC_SPAWNS,
  SCRAMBLED_AT_START,
  buildingById,
  MAZE_GATE
} from '../maps/cityMap.js'
import { learning } from '../education/LearningTracker.js'
import { ui } from '../ui/UIManager.js'
import { hud } from '../ui/HUD.js'
import { toHTML } from '../ui/ruby.js'
import { phaseTransition, reward, confetti } from '../animations/fx.js'

const POS_VOCAB = {
  ue: 'ue',
  shita: 'shita',
  naka: 'naka',
  soto: 'soto',
  mae: 'mae',
  ushiro: 'ushiro',
  soba: 'soba'
}

// Estado canônico no início de cada fase (para a seleção de fases).
const ITEMS_BEFORE = {
  1: [],
  2: ['compass_broken', 'compass'],
  3: ['compass_broken', 'compass', 'guidebook'],
  4: ['compass_broken', 'compass', 'guidebook', 'cat_list'],
  5: ['compass_broken', 'compass', 'guidebook', 'cat_list', 'maze_badge']
}

class QuestSystem {
  constructor() {
    this.world = null
    this.busy = false
  }

  get p() {
    return state.progress
  }

  get phase() {
    return phaseById(this.p.phase)
  }

  get step() {
    if (this.p.finished && this.p.step >= (this.phase?.steps.length || 0)) return null
    return this.phase?.steps[this.p.step] || null
  }

  get free() {
    return !this.step
  }

  attach(world) {
    this.world = world
    this.refresh()
    this.kick()
  }

  detach(world) {
    if (this.world === world) this.world = null
  }

  // ── Fases ──────────────────────────────────────────────────
  /** Prepara o estado canônico do início da fase `id`. */
  startPhase(id) {
    const p = this.p
    p.started = true
    p.phase = id
    p.step = 0
    p.seqIndex = 0
    p.unlocked = Math.max(p.unlocked, id)
    p.inventory = [...ITEMS_BEFORE[id]]
    p.collected = id > 1 ? Object.keys(MARKERS) : []
    p.restored = id > 2 ? ['station', 'restaurant', 'konbini', 'park'] : []
    p.foundCats = id > 3 ? CATS.map((c) => c.id) : []
    p.huntDone = []
    saves.save()
  }

  isScrambled(id) {
    return (
      SCRAMBLED_AT_START.includes(id) && !this.p.restored.includes(id) && !this.p.finished
    )
  }

  mayoiVisible() {
    return this.p.phase === 5 || this.p.finished
  }

  /** NPCs com “!” (precisam ser procurados). */
  questNpcs() {
    const s = this.step
    if (!s) return []
    if (s.type === 'dialogue' && !s.auto) return [s.npc]
    if (s.type === 'hunt')
      return s.targets
        .filter((t) => t.kind === 'npc' && !this.p.huntDone.includes(t.id))
        .map((t) => t.ref)
    return []
  }

  currentMazeRound() {
    const s = this.step
    return s?.type === 'maze' ? s.round : null
  }

  // ── HUD ────────────────────────────────────────────────────
  refresh() {
    const ph = this.phase
    hud.setPhaseTitle(
      this.free ? '自由 · Exploração livre' : `FASE ${ph.id} · ${ph.title}`
    )
    const s = this.step
    let o
    let target = null
    if (!s) {
      o = {
        stage: 'output',
        task: 'Exploração livre! Converse com todos, visite a biblioteca para revisar e confira o diário.'
      }
    } else {
      const npcName = (id) => NPCS[id]?.namePt || ''
      switch (s.type) {
        case 'dialogue':
          o = {
            speaker: s.npc,
            speakerName: npcName(s.npc),
            jp: s.obj?.jp,
            task: s.obj?.pt || '…'
          }
          if (NPC_SPAWNS[s.npc]) target = NPC_SPAWNS[s.npc]
          break
        case 'reach':
          o = {
            speaker: 'obaasan',
            speakerName: npcName('obaasan'),
            jp: s.jp,
            jpPt: s.pt,
            task: 'Caminhe até o pedaço da bússola nessa direção. No mapa, 北 fica para cima.'
          }
          break
        case 'sequence': {
          const it = s.items[this.p.seqIndex]
          o = {
            speaker: 'obaasan',
            speakerName: npcName('obaasan'),
            jp: it.jp,
            jpPt: it.pt,
            hideTr: true,
            task: `Teste final ${this.p.seqIndex + 1}/${s.items.length}: siga só o japonês.`
          }
          break
        }
        case 'puzzle':
          o = { task: 'Desafio em andamento…' }
          break
        case 'findBuilding':
          o = {
            speaker: 'lisa',
            speakerName: 'Guia da Lisa',
            jp: s.clue,
            jpPt: s.cluePt,
            task:
              s.building === 'park'
                ? 'Encontre a placa do parque e examine-a (E).'
                : 'Encontre o prédio certo e examine a porta (E).',
            hint: 'Placas com ？？？ estão embaralhadas. Use os prédios conhecidos como referência.'
          }
          break
        case 'enter':
          o = { jp: s.obj.jp, task: s.obj.pt }
          target = { x: 8, y: 23 }
          break
        case 'findCats': {
          const list = s.cats.map((id) => {
            const c = CATS.find((x) => x.id === id)
            return { jp: c.clue, pt: c.cluePt, done: this.p.foundCats.includes(id) }
          })
          o = {
            speaker: 'yuki',
            speakerName: 'Lista da Yuki',
            list,
            task:
              s.scene === 'city'
                ? 'O último gato está do lado de fora da casa!'
                : 'Examine os móveis (E) e escolha a posição certa.'
          }
          if (s.scene === 'city') target = { x: 13, y: 22 }
          break
        }
        case 'maze':
          o = { speaker: 'michi', speakerName: 'Michi', jp: s.obj.jp, task: s.obj.pt }
          target = MAZE_GATE
          break
        case 'hunt': {
          const list = s.targets.map((t) => ({
            jp: t.clue,
            pt: t.cluePt,
            done: this.p.huntDone.includes(t.id)
          }))
          o = {
            speaker: 'mayoi',
            speakerName: 'Mapa misterioso',
            list,
            task: `Encontre os lugares (${this.p.huntDone.length}/${s.targets.length}) e interaja (E).`
          }
          break
        }
        default:
          o = { task: '…' }
      }
      o.stage = s.stage
    }
    bus.emit('objective', o)
    bus.emit('minimap:target', target ? { x: target.x + 0.5, y: target.y + 0.5 } : null)
    this.world?.refreshQuestState?.()
  }

  // ── Fluxo ──────────────────────────────────────────────────
  kick() {
    if (!this.world || this.busy) return
    const s = this.step
    if (!s) return
    if (s.type === 'puzzle' || (s.type === 'dialogue' && s.auto)) {
      if (s.type === 'dialogue' && s.npc === 'mayoi' && this.world.kind !== 'city') return
      this.busy = true
      setTimeout(() => {
        this.busy = false
        this.runAuto()
      }, 450)
    }
  }

  async runAuto() {
    const s = this.step
    if (!s || !this.world || this.world.leaving) return
    if (s.type === 'puzzle') await this.withBusy(() => this.world.runPuzzle(s.set))
    else await this.withBusy(() => this.world.runDialogue(s.id))
    this.advance()
  }

  async withBusy(fn) {
    this.busy = true
    try {
      return await fn()
    } finally {
      this.busy = false
    }
  }

  advance() {
    this.p.step++
    this.p.seqIndex = 0
    saves.save()
    if (this.p.step >= this.phase.steps.length) return this.completePhase()
    this.refresh()
    this.kick()
  }

  async completePhase() {
    const ph = this.phase
    this.busy = true
    if (!this.p.completed.includes(ph.id)) this.p.completed.push(ph.id)
    learning.completeChallenge(`phase-${ph.id}`)
    audio.sfx('fanfare')
    confetti(80)
    const last = ph.id === PHASES.length
    if (last) {
      this.p.finished = true
      this.p.restored = [...SCRAMBLED_AT_START]
      saves.save()
      await phaseTransition({
        t1: `FASE ${ph.id} CONCLUÍDA ✓`,
        t2: 'ことばの町が もどった！',
        t3: 'A cidade foi restaurada!'
      })
      this.busy = false
      this.refresh()
      this.world?.refreshQuestState?.()
      this.world?.showResult?.()
      return
    }
    const next = phaseById(ph.id + 1)
    this.p.unlocked = Math.max(this.p.unlocked, next.id)
    this.p.phase = next.id
    this.p.step = 0
    saves.save()
    await phaseTransition({
      t1: `FASE ${ph.id} CONCLUÍDA ✓ → FASE ${next.id}`,
      t2: next.title,
      t3: next.titleJp
    })
    this.busy = false
    this.world?.placeAtSpawn?.(next.spawn.at)
    this.refresh()
    this.kick()
  }

  // ── Eventos do mundo ───────────────────────────────────────
  /** Retorna true se o evento foi consumido pela missão. */
  handle(ev) {
    if (this.busy) return true
    const s = this.step
    if (!s) return false
    switch (s.type) {
      case 'dialogue':
        if (ev.type === 'talk' && ev.npc === s.npc) {
          this.withBusy(() => this.world.runDialogue(s.id)).then(() => this.advance())
          return true
        }
        return false
      case 'reach':
        return ev.type === 'reach' && this.onReach(s, ev.marker)
      case 'sequence':
        return ev.type === 'reach' && this.onSequence(s, ev.marker)
      case 'findBuilding':
        if ((ev.type === 'door' || ev.type === 'sign') && ev.building) {
          this.onFindBuilding(s, ev.building)
          return true
        }
        return false
      case 'enter':
        if (ev.type === 'door' && ev.building === s.target) {
          this.advance()
          return false // deixa a cena executar a entrada normalmente
        }
        return false
      case 'findCats':
        return ev.type === 'inspect' && this.onInspect(s, ev)
      case 'maze':
        if (ev.type === 'mazeRoundDone' && ev.round === s.round) {
          this.advance()
          return true
        }
        return false
      case 'hunt':
        return this.onHunt(s, ev)
      default:
        return false
    }
  }

  onReach(s, marker) {
    if (marker === s.target) {
      this.p.collected.push(marker)
      learning.record({ skill: s.skill, vocab: s.vocab, correct: true, tag: s.skill })
      this.world.collectShard?.(marker)
      bus.emit('compass:refresh')
      reward('💎', `${ABS[s.dir].kanji}（${ABS[s.dir].kana}）`)
      this.withBusy(() =>
        ui.feedbackCard({
          title: 'Pedaço da bússola encontrado!',
          jp: s.jp,
          pt: s.pt,
          explain: s.explain
        })
      ).then(() => this.advance())
      return true
    }
    const d = MARKERS[marker].dir
    ui.toast(
      `${toHTML(`そこは {${ABS[d].kanji}|${ABS[d].kana}}です。`)} Este é o ${ABS[d].pt}. Procure o ${ABS[s.dir].kanji}!`,
      'soft'
    )
    return true
  }

  onSequence(s, marker) {
    const it = s.items[this.p.seqIndex]
    if (marker === it.target) {
      learning.record({
        skill: 'absolute',
        vocab: [{ N: 'kita', S: 'minami', E: 'higashi', W: 'nishi' }[it.dir]],
        correct: true,
        tag: 'absolute'
      })
      audio.sfx('success')
      ui.toast(`✔ ${toHTML(it.jp)} — ${ABS[it.dir].pt}!`, 'ok')
      this.p.seqIndex++
      if (this.p.seqIndex >= s.items.length) {
        this.advance()
      } else {
        saves.saveSoon()
        this.refresh()
      }
      return true
    }
    const d = MARKERS[marker].dir
    learning.record({
      skill: 'absolute',
      vocab: [{ N: 'kita', S: 'minami', E: 'higashi', W: 'nishi' }[it.dir]],
      correct: false,
      tag: 'absolute'
    })
    audio.sfx('soft-error')
    ui.toast(
      `💜 ${toHTML(`ここは {${ABS[d].kanji}|${ABS[d].kana}}。`)} Você está no ${ABS[d].pt}. Releia o comando!`,
      'soft',
      3200
    )
    return true
  }

  onFindBuilding(s, id) {
    const target = buildingById(s.building)
    if (id === s.building) {
      learning.record({ skill: s.skill, vocab: s.vocab, correct: true, tag: s.skill })
      if (s.teach) learning.see(s.teach)
      if (!this.p.restored.includes(id)) this.p.restored.push(id)
      this.world.restoreSign?.(id)
      audio.sfx('success')
      this.withBusy(() =>
        ui.feedbackCard({
          title: `Placa restaurada: ${target.pt}!`,
          jp: s.clue,
          pt: s.cluePt,
          explain: s.explain
        })
      ).then(() => this.advance())
      return
    }
    const other = buildingById(id)
    learning.record({ skill: s.skill, vocab: s.vocab, correct: false, tag: s.skill })
    audio.sfx('soft-error')
    const known = other && !this.isScrambled(id)
    this.withBusy(() =>
      ui.feedbackCard({
        soft: true,
        title: 'Hmm… não é aqui',
        jp: `ここは ${target.name}じゃ ありません。`,
        pt: `Aqui não é: ${target.pt.toLowerCase()}.${known ? ` Este prédio é: ${other.pt}.` : ''}`,
        explain: `Releia a pista: ${s.cluePt} ${s.explain}`
      })
    )
  }

  onInspect(s, ev) {
    const cats = CATS.filter(
      (c) => s.cats.includes(c.id) && !this.p.foundCats.includes(c.id)
    )
    const hit = cats.find((c) => c.object === ev.object && c.pos === ev.pos)
    const obj = INSPECTABLES[ev.object]
    const posVocab = POS_VOCAB[ev.pos]
    if (hit) {
      this.p.foundCats.push(hit.id)
      learning.record({
        skill: 'location',
        vocab: [posVocab, 'neko'],
        correct: true,
        tag: 'location'
      })
      this.world.revealCat?.(hit.id)
      audio.sfx('meow')
      this.withBusy(() =>
        ui.feedbackCard({
          title: `${hit.name} encontrado(a)!`,
          jp: hit.clue,
          pt: hit.cluePt,
          explain: `${obj.name}の${POSITIONS[ev.pos].ruby} = ${POSITIONS[ev.pos].pt} ${obj.pt === 'carro' ? 'do' : 'da'} ${obj.pt}. Gato é ser vivo → います.`
        })
      ).then(() => {
        if (s.cats.every((id) => this.p.foundCats.includes(id))) this.advance()
        else {
          saves.saveSoon()
          this.refresh()
        }
      })
      return true
    }
    const sameObj = cats.find((c) => c.object === ev.object)
    if (sameObj) {
      learning.record({
        skill: 'location',
        vocab: [posVocab],
        correct: false,
        tag: 'location'
      })
      audio.sfx('soft-error')
      this.withBusy(() =>
        ui.feedbackCard({
          soft: true,
          title: 'いません… Não está aqui',
          jp: `${obj.name}の ${POSITIONS[ev.pos].ruby}には いません。`,
          pt: `Não está ${POSITIONS[ev.pos].pt} ${obj.pt === 'carro' ? 'do' : 'da'} ${obj.pt}.`,
          explain: `Releia a pista: ${sameObj.cluePt}`
        })
      )
      return true
    }
    return false
  }

  onHunt(s, ev) {
    const map = { door: 'door', talk: 'npc', spot: 'spot' }
    const kind = map[ev.type]
    if (!kind) return false
    const ref = ev.building || ev.npc || ev.id
    const t = s.targets.find(
      (x) => x.kind === kind && x.ref === ref && !this.p.huntDone.includes(x.id)
    )
    if (!t) return false
    const item = {
      type: 'builder',
      skill: 'building',
      prompt: `Você encontrou! Descreva o lugar em japonês. Pista: ${t.cluePt}`,
      answer: t.answer,
      distractors: t.distractors,
      vocab: [],
      explain:
        'Estrutura: A は B の [posição] に あります (coisas/lugares) / います (pessoas e animais).'
    }
    this.withBusy(() =>
      this.world.runPuzzle({
        title: 'ことばで せつめい',
        stage: 'output',
        items: [item],
        noReview: true,
        setId: t.id
      })
    ).then(() => {
      this.p.huntDone.push(t.id)
      if (t.restore && !this.p.restored.includes(t.restore)) {
        this.p.restored.push(t.restore)
        this.world.restoreSign?.(t.restore)
      }
      reward('🧩', `地図のかけら ${this.p.huntDone.length}/${s.targets.length}`)
      if (this.p.huntDone.length >= s.targets.length) this.advance()
      else {
        saves.save()
        this.refresh()
      }
    })
    return true
  }

  puzzleSet(id) {
    return PUZZLE_SETS[id]
  }
}

export const quest = new QuestSystem()
