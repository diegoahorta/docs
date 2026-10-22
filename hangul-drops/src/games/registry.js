// Catálogo dos minijogos. Cada um aparece como um ponto no menu 3D.
// `carregar` importa o módulo do jogo só quando ele é aberto (lazy loading).

export const JOGOS = Object.freeze([
  {
    id: 'hangul-rain',
    nome: 'Hangul Rain',
    nomeNativo: '한글 비',
    descricao: 'Letras e sílabas caem do céu: digite a romanização antes que cheguem ao chão.',
    cor: '#8fd3ff',
    xpNecessario: 0,
    carregar: () => import('./hangul-rain/HangulRainScene.js'),
  },
  {
    id: 'memory-hangul',
    nome: 'Memory Hangul',
    nomeNativo: '기억 게임',
    descricao:
      'Jogo da memória: ligue cada letra ou sílaba à romanização, e cada palavra à imagem.',
    cor: '#ff8fb1',
    xpNecessario: 0,
    carregar: () => import('./memory-hangul/MemoryHangulScene.js'),
  },
  {
    id: 'hangul-runner',
    nome: 'Hangul Runner',
    nomeNativo: '한글 달리기',
    descricao: 'Corra pelas pistas e esteja no bloco com a letra ou sílaba pedida.',
    cor: '#ffd166',
    xpNecessario: 200,
    carregar: () => import('./hangul-runner/HangulRunnerScene.js'),
  },
  {
    id: 'syllable-builder',
    nome: 'Monte a Sílaba',
    nomeNativo: '음절 만들기',
    descricao:
      'Junte consoante e vogal para formar a sílaba pedida (ㄱ + ㅏ = 가) contra o relógio.',
    cor: '#5be49b',
    xpNecessario: 400,
    carregar: () => import('./syllable-builder/SyllableBuilderScene.js'),
  },
  {
    id: 'word-search',
    nome: 'Caça-Palavras',
    nomeNativo: '낱말 찾기',
    descricao: 'Encontre as palavras coreanas escondidas na grade. A cada nível a grade cresce.',
    cor: '#c3a6ff',
    xpNecessario: 700,
    carregar: () => import('./word-search/WordSearchScene.js'),
  },
]);

/** Busca um jogo pelo id. */
export function buscarJogo(id) {
  return JOGOS.find((jogo) => jogo.id === id) ?? null;
}
