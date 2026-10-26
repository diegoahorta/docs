// As três "temporadas" do show: cada uma libera mais katakana e palavras mais difíceis.

export const TEMPORADAS = Object.freeze([
  {
    id: 'estreia',
    nome: 'Estreia',
    emoji: '🌟',
    descricao: 'Katakana básicos (ア a ン) e palavras curtas.',
    tiposDeKana: ['basico'],
    nivelDasPalavras: 1,
    combinados: false,
    cor: 'var(--rosa)',
  },
  {
    id: 'ao-vivo',
    nome: 'Ao Vivo',
    emoji: '🎬',
    descricao: 'Entram os sinais ゛ e ゜: ガ, ザ, ダ, バ, パ…',
    tiposDeKana: ['basico', 'dakuten'],
    nivelDasPalavras: 2,
    combinados: false,
    cor: 'var(--azul)',
  },
  {
    id: 'grande-final',
    nome: 'Grande Final',
    emoji: '🏆',
    descricao: 'Tudo, mais ッ, ー e as combinações キャ, シュ, チョ…',
    tiposDeKana: ['basico', 'dakuten'],
    nivelDasPalavras: 3,
    combinados: true,
    cor: 'var(--amarelo)',
  },
]);

/** Busca uma temporada pelo id (cai na primeira se não existir). */
export function buscarTemporada(id) {
  return TEMPORADAS.find((temporada) => temporada.id === id) ?? TEMPORADAS[0];
}
