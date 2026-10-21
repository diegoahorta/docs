// Catálogo dos minijogos. Cada um aparece como um ponto no menu 3D.
// `carregar` importa o módulo do jogo só quando ele é aberto (lazy loading);
// enquanto o jogo não existe, fica null e o menu mostra "Em breve".

export const JOGOS = Object.freeze([
  {
    id: 'kana-rain',
    nome: 'Kana Rain',
    nomeJP: 'かなのあめ',
    descricao: 'Hiragana caem do céu: digite o romaji antes que cheguem ao chão.',
    cor: '#8fd3ff',
    xpNecessario: 0,
    carregar: () => import('./kana-rain/KanaRainScene.js'),
  },
  {
    id: 'memory-kana',
    nome: 'Memory Kana',
    nomeJP: 'きおく',
    descricao: 'Jogo da memória: ligue cada kana ao romaji ou à imagem da palavra.',
    cor: '#ff8fb1',
    xpNecessario: 0,
    carregar: () => import('./memory-kana/MemoryKanaScene.js'),
  },
  {
    id: 'katakana-runner',
    nome: 'Katakana Runner',
    nomeJP: 'カタカナラン',
    descricao: 'Corra e pule no bloco com a leitura correta do katakana.',
    cor: '#ffd166',
    xpNecessario: 200,
    carregar: null,
  },
  {
    id: 'kana-pairs',
    nome: 'Pares de Kana',
    nomeJP: 'ひらがな・カタカナ',
    descricao: 'Encontre os pares: o hiragana e o katakana que têm o mesmo som (あ ↔ ア).',
    cor: '#5be49b',
    xpNecessario: 400,
    carregar: null,
  },
  {
    id: 'crossword',
    nome: 'Palavra Cruzada',
    nomeJP: 'クロスワード',
    descricao: 'Complete a grade com palavras em kana. A cada nível a grade cresce.',
    cor: '#c3a6ff',
    xpNecessario: 700,
    carregar: null,
  },
]);

/** Busca um jogo pelo id. */
export function buscarJogo(id) {
  return JOGOS.find((jogo) => jogo.id === id) ?? null;
}
