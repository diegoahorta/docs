// Gatos escondidos por まよいネコ (Fase 3). O gato aparece exatamente na
// posição descrita: dentro da caixa, embaixo da mesa etc.
export const CATS = [
  {
    id: 'shiro',
    name: 'シロ',
    color: '#f4f4f4',
    scene: 'house',
    object: 'box',
    pos: 'naka',
    clue: '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。',
    cluePt: 'O gato está dentro da caixa.'
  },
  {
    id: 'mike',
    name: 'ミケ',
    color: '#f0a050',
    scene: 'house',
    object: 'table',
    pos: 'shita',
    clue: '{猫|ねこ}は[ref:テーブル][no:の][pos:{下|した}][part:に][pred:います]。',
    cluePt: 'O gato está embaixo da mesa.'
  },
  {
    id: 'kuro',
    name: 'クロ',
    color: '#3a3a48',
    scene: 'house',
    object: 'sofa',
    pos: 'ushiro',
    clue: '{猫|ねこ}は[ref:ソファ][no:の][pos:{後|うし}ろ][part:に][pred:います]。',
    cluePt: 'O gato está atrás do sofá.'
  },
  {
    id: 'tora',
    name: 'トラ',
    color: '#c98b3a',
    scene: 'house',
    object: 'shelf',
    pos: 'ue',
    clue: '{猫|ねこ}は[ref:{本棚|ほんだな}][no:の][pos:{上|うえ}][part:に][pred:います]。',
    cluePt: 'O gato está em cima da estante.'
  },
  {
    id: 'chibi',
    name: 'チビ',
    color: '#9aa0aa',
    scene: 'city',
    object: 'car',
    pos: 'soba',
    clue: '{猫|ねこ}は[ref:{車|くるま}][no:の][pos:そば][part:に][pred:います]。',
    cluePt: 'O gato está junto do carro.'
  }
]

// Posições que podem ser inspecionadas em cada objeto.
export const POSITIONS = {
  ue: { ruby: '{上|うえ}', pt: 'em cima' },
  shita: { ruby: '{下|した}', pt: 'embaixo' },
  naka: { ruby: '{中|なか}', pt: 'dentro' },
  soto: { ruby: '{外|そと}', pt: 'fora' },
  mae: { ruby: '{前|まえ}', pt: 'na frente' },
  ushiro: { ruby: '{後|うし}ろ', pt: 'atrás' },
  soba: { ruby: 'そば', pt: 'junto' }
}

export const INSPECTABLES = {
  box: { name: '{箱|はこ}', pt: 'caixa', positions: ['naka', 'ue', 'soto'] },
  table: { name: 'テーブル', pt: 'mesa', positions: ['ue', 'shita'] },
  sofa: { name: 'ソファ', pt: 'sofá', positions: ['mae', 'ushiro', 'ue'] },
  shelf: { name: '{本棚|ほんだな}', pt: 'estante', positions: ['ue', 'mae'] },
  bed: { name: 'ベッド', pt: 'cama', positions: ['ue', 'shita'] },
  tv: { name: 'テレビ', pt: 'televisão', positions: ['mae', 'ushiro'] },
  car: { name: '{車|くるま}', pt: 'carro', positions: ['naka', 'shita', 'soba'] }
}
