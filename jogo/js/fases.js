// História e definição das fases.

export const INTRO = [
  { quem: 'NARRADOR', texto: 'São Paulo. A Gangue dos Ratos saiu dos bueiros e tomou conta da cidade.' },
  { quem: 'NARRADOR', texto: 'Eles picharam o MASP, saquearam a feira e espantaram o povo do ponto de ônibus.' },
  { quem: 'BOULOS', texto: 'Essa cidade é do povo. Hora de colocar ordem na casa!' },
];

export const FINAL = [
  { quem: 'REI RATO', retrato: 'rei', texto: 'Squeek... Isso não acabou, barbudo! Os bueiros são infinitos!' },
  { quem: 'BOULOS', texto: 'Então eu tampo um por um. Volta pro esgoto, majestade.' },
  { quem: 'NARRADOR', texto: 'A Gangue dos Ratos fugiu pelos canos. São Paulo amanhece em paz.' },
  { quem: 'BOULOS', texto: 'Valeu, São Paulo! A cidade é de quem cuida dela.' },
];

// Cada onda trava a câmera em `camX` até todos os inimigos serem derrotados.
// Inimigo: [tipo, lado ('esq' | 'dir' | 'bueiro'), z opcional]
export const FASES = [
  {
    nome: 'FASE 1',
    titulo: 'AVENIDA PAULISTA',
    musica: 'fase1',
    ceu: ['#5aa0e0', '#bfe3ff'],
    tinta: 0xffffff,
    horizonte: '#7d93b8',
    calcada: 'texturas_pedra_onda',
    fachadas: ['predio', 'muro_grafite', 'masp', 'predio', 'copan', 'muro_tijolo', 'predio', 'masp', 'predio'],
    distantes: ['copan', 'predio', 'predio', 'copan'],
    comprimento: 4300,
    historia: [
      { quem: 'NARRADOR', texto: 'Fase 1: Avenida Paulista. Os ratos ocuparam o vão do MASP.' },
      { quem: 'BOULOS', texto: 'Ninguém picha o MASP no meu turno!' },
    ],
    objetos: [
      { tipo: 'ponto_onibus', x: 1250, z: 128, solido: true },
      { tipo: 'onibus', x: 2350, z: 14, solido: true },
      { tipo: 'banca', x: 3350, z: 126, solido: true },
    ],
    plataformas: [{ x0: 1700, x1: 1960, z0: 70, z1: 112, topo: 96 }],
    perigos: [{ x0: 2850, x1: 3000, z0: 18, z1: 54 }],
    itens: [['garrafa', 700, 40], ['pedra', 1580, 90], ['coxinha', 2050, 120], ['garrafa', 2900, 120], ['pastel', 3600, 60]],
    ondas: [
      { camX: 250, inimigos: [['ratinho', 'dir'], ['ratinho', 'dir'], ['ratinho', 'esq']] },
      { camX: 1000, inimigos: [['ratinho', 'dir'], ['ratinho', 'bueiro'], ['lixeiro', 'dir'], ['ratinho', 'esq']] },
      { camX: 1900, inimigos: [['ratazana', 'dir'], ['ratinho', 'dir'], ['ratinho', 'esq'], ['lixeiro', 'dir']] },
      { camX: 3340, inimigos: [['ratazana', 'dir'], ['ratazana', 'esq'], ['ratinho', 'bueiro'], ['ratinho', 'dir'], ['lixeiro', 'dir']] },
    ],
  },
  {
    nome: 'FASE 2',
    titulo: 'CENTRO: COPAN E FEIRA LIVRE',
    musica: 'fase2',
    ceu: ['#e0784a', '#ffd08a'],
    tinta: 0xffe6d2,
    horizonte: '#9a6a6a',
    calcada: 'texturas_calcada',
    fachadas: ['copan', 'padaria', 'predio', 'muro_grafite', 'copan', 'casa_azul', 'predio', 'padaria', 'copan'],
    distantes: ['predio', 'copan', 'predio'],
    comprimento: 4600,
    historia: [
      { quem: 'NARRADOR', texto: 'Fase 2: Centro. Os ratos estão saqueando a feira perto do Copan.' },
      { quem: 'BOULOS', texto: 'Mexeu com o pastel da feira, mexeu comigo.' },
    ],
    objetos: [
      { tipo: 'feira', x: 900, z: 128, solido: true },
      { tipo: 'carro', x: 1650, z: 16, solido: true },
      { tipo: 'banca', x: 2550, z: 126, solido: true },
      { tipo: 'feira', x: 3500, z: 128, solido: true },
    ],
    plataformas: [
      { x0: 2000, x1: 2240, z0: 76, z1: 116, topo: 92 },
      { x0: 3800, x1: 4050, z0: 60, z1: 100, topo: 110 },
    ],
    perigos: [{ x0: 1150, x1: 1290, z0: 14, z1: 50 }, { x0: 3050, x1: 3200, z0: 20, z1: 56 }],
    itens: [['pedra', 600, 50], ['pastel', 1400, 110], ['garrafa', 2100, 40], ['coxinha', 2900, 70], ['pedra', 3300, 100], ['coxinha', 4100, 40]],
    ondas: [
      { camX: 300, inimigos: [['ratinho', 'dir'], ['lixeiro', 'dir'], ['ratinho', 'esq'], ['ratinho', 'bueiro']] },
      { camX: 1300, inimigos: [['ratazana', 'dir'], ['ratinho', 'dir'], ['lixeiro', 'esq'], ['ratinho', 'bueiro']] },
      { camX: 2300, inimigos: [['ratazana', 'dir'], ['ratazana', 'esq'], ['lixeiro', 'dir'], ['ratinho', 'dir'], ['ratinho', 'esq']] },
      { camX: 3640, inimigos: [['ratazana', 'dir'], ['lixeiro', 'dir'], ['lixeiro', 'esq'], ['ratinho', 'bueiro'], ['ratinho', 'bueiro'], ['ratazana', 'esq']] },
    ],
  },
  {
    nome: 'FASE 3',
    titulo: 'PERIFERIA: A TOCA DO REI RATO',
    musica: 'fase3',
    ceu: ['#141838', '#3a3070'],
    tinta: 0xb8b8e8,
    noite: true,
    horizonte: '#2a2a50',
    calcada: 'texturas_pedra_onda2',
    fachadas: ['casa_tijolo', 'padaria', 'casa_azul', 'muro_tijolo', 'casa_tijolo', 'muro_grafite', 'casa_azul', 'padaria', 'casa_tijolo', 'muro_grafite'],
    distantes: ['predio', 'predio', 'copan'],
    comprimento: 4200,
    historia: [
      { quem: 'NARRADOR', texto: 'Fase 3: periferia. A toca do Rei Rato fica embaixo dessas ruas.' },
      { quem: 'BOULOS', texto: 'Aqui eu conheço cada viela. Vamos acabar com isso.' },
    ],
    objetos: [
      { tipo: 'carro', x: 900, z: 18, solido: true },
      { tipo: 'ponto_onibus', x: 1900, z: 128, solido: true },
      { tipo: 'onibus', x: 2700, z: 14, solido: true },
    ],
    plataformas: [{ x0: 1300, x1: 1560, z0: 72, z1: 112, topo: 100 }],
    perigos: [{ x0: 2100, x1: 2260, z0: 16, z1: 52 }],
    itens: [['garrafa', 500, 60], ['coxinha', 1450, 100], ['pedra', 2050, 120], ['pastel', 3000, 110], ['garrafa', 3150, 40], ['coxinha', 3500, 60]],
    ondas: [
      { camX: 300, inimigos: [['ratinho', 'dir'], ['ratazana', 'dir'], ['ratinho', 'bueiro'], ['lixeiro', 'esq']] },
      { camX: 1450, inimigos: [['ratazana', 'dir'], ['ratazana', 'esq'], ['lixeiro', 'dir'], ['ratinho', 'bueiro'], ['ratinho', 'dir']] },
      { camX: 3240, chefe: true, inimigos: [['rei', 'dir', 90]] },
    ],
    chefeFala: [
      { quem: 'REI RATO', retrato: 'rei', texto: 'Então você é o barbudo que anda estragando meus negócios?' },
      { quem: 'BOULOS', texto: 'Seus negócios acabaram. Devolve a cidade, Rei Rato.' },
      { quem: 'REI RATO', retrato: 'rei', texto: 'A cidade é MINHA! Ratos, ao ataque! SQUEEEK!' },
    ],
  },
];
