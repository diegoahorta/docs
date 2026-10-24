// Interiores exploráveis. Coordenadas em tiles.
export const INTERIORS = {
  house: {
    title: '{家|いえ}の {中|なか}',
    w: 20,
    h: 13,
    floor: 'WOOD',
    rug: { x: 6, y: 7, w: 8, h: 3 },
    door: { x: 9, y: 12 },
    spawn: { x: 10, y: 10.6, facing: 'N' },
    exitTo: { scene: 'city', at: 'house' },
    furniture: [
      { id: 'shelf', kind: 'shelf', x: 5, y: 1, w: 2, h: 3, inspect: 'shelf' },
      { id: 'tv', kind: 'tv', x: 12, y: 2, w: 2, h: 2, inspect: 'tv' },
      { id: 'sofa', kind: 'sofa', x: 8, y: 4, w: 4, h: 2, inspect: 'sofa' },
      { id: 'bed', kind: 'bed', x: 16, y: 2, w: 3, h: 4, inspect: 'bed' },
      { id: 'table', kind: 'table', x: 3, y: 7, w: 3, h: 2, inspect: 'table' },
      { id: 'box', kind: 'box', x: 15, y: 8, w: 2, h: 2, inspect: 'box' },
      { id: 'plant', kind: 'plant', x: 1, y: 10, w: 1, h: 1 },
      { id: 'plant2', kind: 'plant', x: 18, y: 10, w: 1, h: 1 }
    ],
    npcs: []
  },
  library: {
    title: '{図書館|としょかん}',
    w: 22,
    h: 13,
    floor: 'TILEFLOOR',
    rug: { x: 8, y: 8, w: 6, h: 2 },
    door: { x: 10, y: 12 },
    spawn: { x: 11, y: 10.6, facing: 'N' },
    exitTo: { scene: 'city', at: 'library' },
    furniture: [
      { id: 'shelf1', kind: 'shelf', x: 1, y: 1, w: 2, h: 3 },
      { id: 'shelf2', kind: 'shelf', x: 3, y: 1, w: 2, h: 3 },
      { id: 'shelf3', kind: 'shelf', x: 17, y: 1, w: 2, h: 3 },
      { id: 'shelf4', kind: 'shelf', x: 19, y: 1, w: 2, h: 3 },
      { id: 'desk', kind: 'desk', x: 9, y: 4, w: 4, h: 2, note: 'book' },
      { id: 'table2', kind: 'table', x: 3, y: 7, w: 3, h: 2 },
      { id: 'table3', kind: 'table', x: 16, y: 7, w: 3, h: 2 },
      { id: 'plant', kind: 'plant', x: 1, y: 10, w: 1, h: 1 },
      { id: 'plant2', kind: 'plant', x: 20, y: 10, w: 1, h: 1 }
    ],
    npcs: [{ id: 'satou', x: 12, y: 3 }]
  }
}
