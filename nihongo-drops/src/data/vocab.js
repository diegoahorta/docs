// Vocabulário inicial: palavras simples para iniciantes absolutos.
// Cada palavra tem: kana, romaji, significado em português, emoji ilustrativo,
// script principal e categoria. Vogais longas no romaji são escritas dobradas (ex.: "keeki").

const PALAVRAS = [
  // Animais
  ['いぬ', 'inu', 'cachorro', '🐶', 'animais'],
  ['ねこ', 'neko', 'gato', '🐱', 'animais'],
  ['さかな', 'sakana', 'peixe', '🐟', 'animais'],
  ['とり', 'tori', 'pássaro', '🐦', 'animais'],
  ['うし', 'ushi', 'vaca', '🐮', 'animais'],
  ['うま', 'uma', 'cavalo', '🐴', 'animais'],
  ['くま', 'kuma', 'urso', '🐻', 'animais'],
  ['さる', 'saru', 'macaco', '🐵', 'animais'],
  ['かめ', 'kame', 'tartaruga', '🐢', 'animais'],
  ['たこ', 'tako', 'polvo', '🐙', 'animais'],
  ['いか', 'ika', 'lula', '🦑', 'animais'],
  // Natureza
  ['あめ', 'ame', 'chuva', '🌧️', 'natureza'],
  ['ゆき', 'yuki', 'neve', '❄️', 'natureza'],
  ['くも', 'kumo', 'nuvem', '☁️', 'natureza'],
  ['ほし', 'hoshi', 'estrela', '⭐', 'natureza'],
  ['つき', 'tsuki', 'lua', '🌙', 'natureza'],
  ['はな', 'hana', 'flor', '🌸', 'natureza'],
  ['き', 'ki', 'árvore', '🌳', 'natureza'],
  ['やま', 'yama', 'montanha', '⛰️', 'natureza'],
  ['かわ', 'kawa', 'rio', '🏞️', 'natureza'],
  ['うみ', 'umi', 'mar', '🌊', 'natureza'],
  ['ひ', 'hi', 'fogo', '🔥', 'natureza'],
  ['みず', 'mizu', 'água', '💧', 'natureza'],
  ['なつ', 'natsu', 'verão', '☀️', 'natureza'],
  ['ふゆ', 'fuyu', 'inverno', '⛄', 'natureza'],
  // Corpo
  ['て', 'te', 'mão', '✋', 'corpo'],
  ['め', 'me', 'olho', '👁️', 'corpo'],
  ['みみ', 'mimi', 'orelha', '👂', 'corpo'],
  ['くち', 'kuchi', 'boca', '👄', 'corpo'],
  ['あし', 'ashi', 'pé / perna', '🦶', 'corpo'],
  ['かお', 'kao', 'rosto', '🙂', 'corpo'],
  // Objetos e lugares
  ['いえ', 'ie', 'casa', '🏠', 'objetos'],
  ['くるま', 'kuruma', 'carro', '🚗', 'objetos'],
  ['ほん', 'hon', 'livro', '📖', 'objetos'],
  ['かさ', 'kasa', 'guarda-chuva', '☂️', 'objetos'],
  ['くつ', 'kutsu', 'sapato', '👟', 'objetos'],
  ['かぎ', 'kagi', 'chave', '🔑', 'objetos'],
  ['はし', 'hashi', 'hashi (pauzinhos)', '🥢', 'objetos'],
  ['えき', 'eki', 'estação de trem', '🚉', 'objetos'],
  // Comida
  ['すし', 'sushi', 'sushi', '🍣', 'comida'],
  ['りんご', 'ringo', 'maçã', '🍎', 'comida'],
  ['いちご', 'ichigo', 'morango', '🍓', 'comida'],
  ['もも', 'momo', 'pêssego', '🍑', 'comida'],
  ['すいか', 'suika', 'melancia', '🍉', 'comida'],
  ['たまご', 'tamago', 'ovo', '🥚', 'comida'],
  ['ごはん', 'gohan', 'arroz / refeição', '🍚', 'comida'],
  ['にく', 'niku', 'carne', '🥩', 'comida'],
  // Cores
  ['あか', 'aka', 'vermelho', '🔴', 'cores'],
  ['あお', 'ao', 'azul', '🔵', 'cores'],
  ['しろ', 'shiro', 'branco', '⚪', 'cores'],
  ['くろ', 'kuro', 'preto', '⚫', 'cores'],
  // Katakana: palavras estrangeiras
  ['パン', 'pan', 'pão', '🍞', 'comida'],
  ['ケーキ', 'keeki', 'bolo', '🍰', 'comida'],
  ['コーヒー', 'koohii', 'café', '☕', 'comida'],
  ['ピザ', 'piza', 'pizza', '🍕', 'comida'],
  ['バナナ', 'banana', 'banana', '🍌', 'comida'],
  ['トマト', 'tomato', 'tomate', '🍅', 'comida'],
  ['メロン', 'meron', 'melão', '🍈', 'comida'],
  ['レモン', 'remon', 'limão-siciliano', '🍋', 'comida'],
  ['アイス', 'aisu', 'sorvete', '🍦', 'comida'],
  ['ラーメン', 'raamen', 'lámen', '🍜', 'comida'],
  ['カメラ', 'kamera', 'câmera', '📷', 'objetos'],
  ['テレビ', 'terebi', 'televisão', '📺', 'objetos'],
  ['ピアノ', 'piano', 'piano', '🎹', 'objetos'],
  ['ギター', 'gitaa', 'violão / guitarra', '🎸', 'objetos'],
  ['ペン', 'pen', 'caneta', '🖊️', 'objetos'],
  ['ノート', 'nooto', 'caderno', '📓', 'objetos'],
  ['ゲーム', 'geemu', 'videogame', '🎮', 'objetos'],
  ['ロボット', 'robotto', 'robô', '🤖', 'objetos'],
  ['ホテル', 'hoteru', 'hotel', '🏨', 'objetos'],
  ['トイレ', 'toire', 'banheiro', '🚻', 'objetos'],
  ['バス', 'basu', 'ônibus', '🚌', 'objetos'],
  ['タクシー', 'takushii', 'táxi', '🚕', 'objetos'],
  ['テニス', 'tenisu', 'tênis (esporte)', '🎾', 'esportes'],
  ['サッカー', 'sakkaa', 'futebol', '⚽', 'esportes'],
];

/** Detecta o script principal de uma palavra pelo primeiro caractere. */
function detectarScript(kana) {
  const codigo = kana.codePointAt(0);
  return codigo >= 0x30a0 && codigo <= 0x30ff ? 'katakana' : 'hiragana';
}

export const VOCABULARIO = Object.freeze(
  PALAVRAS.map(([kana, romaji, pt, emoji, categoria]) =>
    Object.freeze({
      id: `v:${kana}`,
      kana,
      romaji,
      pt,
      emoji,
      categoria,
      script: detectarScript(kana),
    }),
  ),
);

/** Palavras de um script ("hiragana" ou "katakana"). */
export function palavrasPorScript(script) {
  return VOCABULARIO.filter((palavra) => palavra.script === script);
}

/** Palavras que contêm determinado kana (para mostrar exemplos). */
export function palavrasComKana(kana, limite = 3) {
  return VOCABULARIO.filter((palavra) => palavra.kana.includes(kana)).slice(0, limite);
}
