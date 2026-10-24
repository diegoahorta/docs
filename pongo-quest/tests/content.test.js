import { describe, it, expect } from 'vitest'
import { VOCAB, VOCAB_BY_ID, SKILLS } from '../src/education/vocabulary.js'
import { GRAMMAR } from '../src/education/grammar.js'
import { PUZZLE_SETS, FIND_SCENES } from '../src/data/puzzles.js'
import { PHASES } from '../src/data/phases.js'
import { DIALOGUES } from '../src/data/dialogues.js'
import { ITEMS } from '../src/data/items.js'
import { NPCS } from '../src/data/npcs.js'
import { CATS, INSPECTABLES } from '../src/data/cats.js'
import { BUILDINGS } from '../src/maps/cityMap.js'
import { toBlocks, parseChunks } from '../src/ui/ruby.js'
import { simulateGrid } from '../src/ui/puzzles/common.js'
import { recognitionItem, productionItem } from '../src/education/questionBank.js'

const REQUIRED_SPATIAL = [
  'ue',
  'shita',
  'naka',
  'soto',
  'mae',
  'ushiro',
  'migi',
  'hidari',
  'migigawa',
  'hidarigawa',
  'tonari',
  'chikaku',
  'aida',
  'mukou',
  'soba',
  'koko',
  'soko',
  'asoko',
  'konohen',
  'kita',
  'minami',
  'higashi',
  'nishi'
]

describe('vocabulário', () => {
  it('inclui todas as palavras pedidas', () =>
    REQUIRED_SPATIAL.forEach((id) => expect(VOCAB_BY_ID[id], id).toBeTruthy()))
  VOCAB.forEach((w) =>
    it(`${w.id}: campos completos e exemplo com chunking`, () => {
      ;['word', 'kana', 'pt', 'cat', 'skill', 'phase', 'icon', 'ex', 'exPt'].forEach(
        (k) => expect(w[k], k).toBeTruthy()
      )
      expect(SKILLS[w.skill]).toBeTruthy()
      expect(parseChunks(w.ex).some((c) => c.type)).toBe(true)
      expect(recognitionItem(w.id).options).toHaveLength(4)
      expect(toBlocks(productionItem(w.id).answer).length).toBeGreaterThan(1)
    })
  )
  it('ids únicos', () => expect(new Set(VOCAB.map((w) => w.id)).size).toBe(VOCAB.length))
})

describe('gramática', () => {
  it('cobre os padrões pedidos', () => {
    const p = GRAMMAR.map((g) => g.pattern).join(' ')
    ;[
      'A の B',
      'に あります',
      'に います',
      'A と B の 間',
      'の 近く',
      'A で',
      'へ'
    ].forEach((k) => expect(p).toContain(k))
  })
})

const allItems = Object.entries(PUZZLE_SETS).flatMap(([set, s]) =>
  s.items.map((it, i) => [`${set}#${i}`, it])
)

describe('puzzles têm gabarito e explicação', () => {
  allItems.forEach(([id, item]) =>
    it(`${id} (${item.type})`, () => {
      expect(item.explain, 'explicação').toBeTruthy()
      ;(item.vocab || []).forEach((v) => expect(VOCAB_BY_ID[v], v).toBeTruthy())
      switch (item.type) {
        case 'choice':
          expect(item.answer).toBeLessThan(item.options.length)
          break
        case 'direction':
          if (item.options) expect(item.options).toContain(item.answer)
          else expect(['N', 'S', 'E', 'W']).toContain(item.answer)
          break
        case 'particle':
          expect(item.options).toContain(item.answer)
          expect(item.sentence).toContain('＿')
          break
        case 'map':
          expect(BUILDINGS.map((b) => b.id).concat('park')).toContain(item.answer)
          if (item.mode === 'click' && Array.isArray(item.labels))
            expect(item.labels).not.toContain(item.answer)
          break
        case 'find':
          expect(FIND_SCENES[item.scene].spots.map((s) => s.id)).toContain(item.answer)
          break
        case 'builder': {
          const blocks = toBlocks(item.answer).map((b) => b.text)
          ;(item.distractors || [])
            .flatMap(toBlocks)
            .forEach((d) => expect(blocks).not.toContain(d.text))
          break
        }
        case 'kanji':
          expect(item.pairs.length).toBeGreaterThan(1)
          break
        case 'route':
          if (item.mode === 'trace')
            expect(simulateGrid(item, item.instructions).ok).toBe(true)
          else expect(item.goal).toBeTruthy()
          break
        default:
          throw new Error(`tipo desconhecido ${item.type}`)
      }
    })
  )
})

describe('fases, diálogos e dados', () => {
  it('cinco fases com INPUT, INTAKE e OUTPUT', () => {
    expect(PHASES).toHaveLength(5)
    PHASES.forEach((ph) => {
      const stages = new Set(ph.steps.map((s) => s.stage))
      expect(stages.has('input') || ph.id === 5).toBe(true)
      expect(stages.has('output')).toBe(true)
    })
  })
  it('referências válidas em todos os passos', () => {
    PHASES.forEach((ph) =>
      ph.steps.forEach((s) => {
        if (s.type === 'dialogue') expect(DIALOGUES[s.id], s.id).toBeTruthy()
        if (s.type === 'puzzle') expect(PUZZLE_SETS[s.set], s.set).toBeTruthy()
        if (s.type === 'findCats')
          s.cats.forEach((c) => expect(CATS.find((x) => x.id === c)).toBeTruthy())
        if (s.type === 'hunt')
          s.targets.forEach((t) => expect(toBlocks(t.answer).length).toBeGreaterThan(3))
      })
    )
  })
  it('diálogos: falantes, itens e vocabulário existem; perguntas têm resposta certa', () => {
    Object.entries(DIALOGUES).forEach(([id, lines]) =>
      lines.forEach((l) => {
        if (l.s) expect(NPCS[l.s], `${id}: ${l.s}`).toBeTruthy()
        if (l.item) expect(ITEMS[l.item], l.item).toBeTruthy()
        ;(l.teach || []).forEach((v) =>
          expect(VOCAB_BY_ID[v], `${id}: ${v}`).toBeTruthy()
        )
        if (l.choices) expect(l.choices.some((c) => c.ok)).toBe(true)
      })
    )
  })
  it('gatos ficam em posições inspecionáveis', () => {
    CATS.forEach((c) => expect(INSPECTABLES[c.object].positions).toContain(c.pos))
  })
  it('há ao menos três NPCs com diálogos japoneses e cinco prédios', () => {
    expect(Object.values(NPCS).filter((n) => n.palette).length).toBeGreaterThanOrEqual(3)
    expect(BUILDINGS.length).toBeGreaterThanOrEqual(5)
  })
})
