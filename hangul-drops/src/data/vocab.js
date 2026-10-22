// Vocabulário inicial: palavras simples para iniciantes absolutos.
// Cada palavra tem: hangul, romanização (Romanização Revisada, já com as
// mudanças de som da palavra), significado em português, emoji e categoria.

import { decomporSilaba } from './hangul.js';

const PALAVRAS = [
  // Animais
  ['고양이', 'goyangi', 'gato', '🐱', 'animais'],
  ['개', 'gae', 'cachorro', '🐶', 'animais'],
  ['새', 'sae', 'pássaro', '🐦', 'animais'],
  ['소', 'so', 'vaca', '🐮', 'animais'],
  ['말', 'mal', 'cavalo', '🐴', 'animais'],
  ['곰', 'gom', 'urso', '🐻', 'animais'],
  ['원숭이', 'wonsungi', 'macaco', '🐵', 'animais'],
  ['거북이', 'geobugi', 'tartaruga', '🐢', 'animais'],
  ['문어', 'muneo', 'polvo', '🐙', 'animais'],
  ['물고기', 'mulgogi', 'peixe', '🐟', 'animais'],
  ['토끼', 'tokki', 'coelho', '🐰', 'animais'],
  ['돼지', 'dwaeji', 'porco', '🐷', 'animais'],
  // Natureza
  ['비', 'bi', 'chuva', '🌧️', 'natureza'],
  ['눈', 'nun', 'neve', '❄️', 'natureza'],
  ['구름', 'gureum', 'nuvem', '☁️', 'natureza'],
  ['별', 'byeol', 'estrela', '⭐', 'natureza'],
  ['달', 'dal', 'lua', '🌙', 'natureza'],
  ['해', 'hae', 'sol', '🌞', 'natureza'],
  ['꽃', 'kkot', 'flor', '🌸', 'natureza'],
  ['나무', 'namu', 'árvore', '🌳', 'natureza'],
  ['산', 'san', 'montanha', '⛰️', 'natureza'],
  ['강', 'gang', 'rio', '🏞️', 'natureza'],
  ['바다', 'bada', 'mar', '🌊', 'natureza'],
  ['불', 'bul', 'fogo', '🔥', 'natureza'],
  ['물', 'mul', 'água', '💧', 'natureza'],
  ['여름', 'yeoreum', 'verão', '☀️', 'natureza'],
  ['겨울', 'gyeoul', 'inverno', '⛄', 'natureza'],
  // Corpo
  ['손', 'son', 'mão', '✋', 'corpo'],
  ['귀', 'gwi', 'orelha', '👂', 'corpo'],
  ['입', 'ip', 'boca', '👄', 'corpo'],
  ['코', 'ko', 'nariz', '👃', 'corpo'],
  ['발', 'bal', 'pé', '🦶', 'corpo'],
  ['얼굴', 'eolgul', 'rosto', '🙂', 'corpo'],
  // Objetos e lugares
  ['집', 'jip', 'casa', '🏠', 'objetos'],
  ['차', 'cha', 'carro', '🚗', 'objetos'],
  ['책', 'chaek', 'livro', '📖', 'objetos'],
  ['우산', 'usan', 'guarda-chuva', '☂️', 'objetos'],
  ['신발', 'sinbal', 'sapato', '👟', 'objetos'],
  ['열쇠', 'yeolsoe', 'chave', '🔑', 'objetos'],
  ['의자', 'uija', 'cadeira', '🪑', 'objetos'],
  ['가방', 'gabang', 'bolsa', '👜', 'objetos'],
  ['시계', 'sigye', 'relógio', '⌚', 'objetos'],
  ['모자', 'moja', 'chapéu', '👒', 'objetos'],
  ['안경', 'angyeong', 'óculos', '👓', 'objetos'],
  ['학교', 'hakgyo', 'escola', '🏫', 'objetos'],
  ['버스', 'beoseu', 'ônibus', '🚌', 'objetos'],
  ['기차', 'gicha', 'trem', '🚆', 'objetos'],
  ['비행기', 'bihaenggi', 'avião', '✈️', 'objetos'],
  // Comida
  ['사과', 'sagwa', 'maçã', '🍎', 'comida'],
  ['딸기', 'ttalgi', 'morango', '🍓', 'comida'],
  ['수박', 'subak', 'melancia', '🍉', 'comida'],
  ['바나나', 'banana', 'banana', '🍌', 'comida'],
  ['포도', 'podo', 'uva', '🍇', 'comida'],
  ['우유', 'uyu', 'leite', '🥛', 'comida'],
  ['빵', 'ppang', 'pão', '🍞', 'comida'],
  ['밥', 'bap', 'arroz / refeição', '🍚', 'comida'],
  ['김치', 'gimchi', 'kimchi', '🥬', 'comida'],
  ['라면', 'ramyeon', 'lámen', '🍜', 'comida'],
  ['커피', 'keopi', 'café', '☕', 'comida'],
  ['계란', 'gyeran', 'ovo', '🥚', 'comida'],
  ['고기', 'gogi', 'carne', '🥩', 'comida'],
  ['피자', 'pija', 'pizza', '🍕', 'comida'],
  ['케이크', 'keikeu', 'bolo', '🍰', 'comida'],
  // Cores
  ['빨강', 'ppalgang', 'vermelho', '🔴', 'cores'],
  ['파랑', 'parang', 'azul', '🔵', 'cores'],
  ['노랑', 'norang', 'amarelo', '🟡', 'cores'],
  ['하양', 'hayang', 'branco', '⚪', 'cores'],
  // Pessoas e outros
  ['엄마', 'eomma', 'mãe', '👩', 'pessoas'],
  ['아빠', 'appa', 'pai', '👨', 'pessoas'],
  ['아기', 'agi', 'bebê', '👶', 'pessoas'],
  ['친구', 'chingu', 'amigo(a)', '🤝', 'pessoas'],
  ['축구', 'chukgu', 'futebol', '⚽', 'esportes'],
  ['음악', 'eumak', 'música', '🎵', 'outros'],
  ['사랑', 'sarang', 'amor', '❤️', 'outros'],
];

export const VOCABULARIO = Object.freeze(
  PALAVRAS.map(([hangul, romanizacao, pt, emoji, categoria]) =>
    Object.freeze({
      id: `v:${hangul}`,
      hangul,
      romanizacao,
      pt,
      emoji,
      categoria,
      fala: hangul,
      silabas: Array.from(hangul).length,
    }),
  ),
);

/** Palavras com uma quantidade de sílabas entre `minimo` e `maximo`. */
export function palavrasPorTamanho(minimo, maximo) {
  return VOCABULARIO.filter((palavra) => palavra.silabas >= minimo && palavra.silabas <= maximo);
}

/** Jamo de uma sílaba: '간' → ['ㄱ', 'ㅏ', 'ㄴ']. */
function jamoDaSilaba(silaba) {
  const partes = decomporSilaba(silaba);
  return partes ? [partes.inicial, partes.vogal, partes.final].filter(Boolean) : [];
}

/** Palavras que contêm determinado jamo ou sílaba (para mostrar exemplos). */
export function palavrasCom(caractere, limite = 3) {
  return VOCABULARIO.filter((palavra) =>
    Array.from(palavra.hangul).some(
      (silaba) => silaba === caractere || jamoDaSilaba(silaba).includes(caractere),
    ),
  ).slice(0, limite);
}
