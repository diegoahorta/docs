// Dados de hiragana, setores e palavras da missão.

export const LINHAS = [
  {
    id: 'vogais',
    nome: 'Nebulosa das Vogais',
    cor: '#b388ff',
    kana: [
      ['あ', 'a'],
      ['い', 'i'],
      ['う', 'u'],
      ['え', 'e'],
      ['お', 'o']
    ]
  },
  {
    id: 'k',
    nome: 'Cinturão Ka',
    cor: '#31e3ff',
    kana: [
      ['か', 'ka'],
      ['き', 'ki'],
      ['く', 'ku'],
      ['け', 'ke'],
      ['こ', 'ko']
    ]
  },
  {
    id: 's',
    nome: 'Constelação Sa',
    cor: '#5cff9d',
    kana: [
      ['さ', 'sa'],
      ['し', 'shi'],
      ['す', 'su'],
      ['せ', 'se'],
      ['そ', 'so']
    ]
  },
  {
    id: 't',
    nome: 'Vórtice Ta',
    cor: '#ffb347',
    kana: [
      ['た', 'ta'],
      ['ち', 'chi'],
      ['つ', 'tsu'],
      ['て', 'te'],
      ['と', 'to']
    ]
  },
  {
    id: 'n',
    nome: 'Núcleo Na',
    cor: '#ff6fb5',
    kana: [
      ['な', 'na'],
      ['に', 'ni'],
      ['ぬ', 'nu'],
      ['ね', 'ne'],
      ['の', 'no']
    ]
  }
]

export const ROMAJI = Object.fromEntries(LINHAS.flatMap((l) => l.kana))
export const COR_DO_KANA = Object.fromEntries(
  LINHAS.flatMap((l) => l.kana.map(([k]) => [k, l.cor]))
)

// Palavras reais formadas só com os hiragana liberados até cada setor.
export const PALAVRAS = [
  // Setor 1 — vogais
  [
    ['あい', 'amor'],
    ['あお', 'azul'],
    ['いえ', 'casa'],
    ['うえ', 'em cima'],
    ['いい', 'bom'],
    ['おい', 'sobrinho']
  ],
  // Setor 2 — + か行
  [
    ['かお', 'rosto'],
    ['あか', 'vermelho'],
    ['あき', 'outono'],
    ['いけ', 'lagoa'],
    ['えき', 'estação'],
    ['かき', 'caqui'],
    ['ここ', 'aqui'],
    ['こい', 'carpa'],
    ['こえ', 'voz'],
    ['くうき', 'ar'],
    ['おおきい', 'grande']
  ],
  // Setor 3 — + さ行
  [
    ['すし', 'sushi'],
    ['さけ', 'salmão'],
    ['あさ', 'manhã'],
    ['いす', 'cadeira'],
    ['しお', 'sal'],
    ['うそ', 'mentira'],
    ['せかい', 'mundo'],
    ['すき', 'gostar'],
    ['かさ', 'guarda-chuva'],
    ['おかし', 'doce']
  ],
  // Setor 4 — + た行
  [
    ['たこ', 'polvo'],
    ['くつ', 'sapato'],
    ['つき', 'lua'],
    ['うた', 'canção'],
    ['くち', 'boca'],
    ['した', 'embaixo'],
    ['そと', 'lá fora'],
    ['とけい', 'relógio'],
    ['つくえ', 'mesa'],
    ['ちかてつ', 'metrô']
  ],
  // Setor 5 — + な行
  [
    ['ねこ', 'gato'],
    ['いぬ', 'cachorro'],
    ['なつ', 'verão'],
    ['にく', 'carne'],
    ['なか', 'dentro'],
    ['おかね', 'dinheiro'],
    ['きのこ', 'cogumelo'],
    ['さかな', 'peixe'],
    ['なに', 'o quê?'],
    ['こねこ', 'gatinho']
  ]
]

export const PALAVRAS_POR_SETOR = 3
export const SETORES_HISTORIA = LINHAS.length

export const EXCLAMACOES = [
  ['すごい!', 'sugoi! — incrível!'],
  ['やった!', 'yatta! — conseguimos!'],
  ['かんぺき!', 'kanpeki! — perfeito!'],
  ['さいこう!', 'saikō! — o máximo!'],
  ['おみごと!', 'omigoto! — esplêndido!']
]

/** Hiragana liberados no setor (1-based). Depois do último, todos. */
export function kanaDoSetor(setor) {
  const n = Math.min(setor, LINHAS.length)
  return LINHAS.slice(0, n).flatMap((l) => l.kana.map(([k]) => k))
}

export function linhaDoSetor(setor) {
  return LINHAS[Math.min(setor, LINHAS.length) - 1]
}

/** Sorteia uma palavra do setor, preferindo as novas e evitando repetir. */
export function sortearPalavra(setor, jaUsadas = new Set()) {
  const idx = Math.min(setor, PALAVRAS.length) - 1
  let candidatas = PALAVRAS[idx].filter(([p]) => !jaUsadas.has(p))
  if (setor > PALAVRAS.length || candidatas.length === 0) {
    candidatas = PALAVRAS.flat().filter(([p]) => !jaUsadas.has(p))
  }
  if (candidatas.length === 0) candidatas = PALAVRAS.flat()
  const [palavra, significado] =
    candidatas[Math.floor(Math.random() * candidatas.length)]
  return { palavra, significado, letras: [...palavra] }
}

export function romajiDaPalavra(palavra) {
  return [...palavra].map((k) => ROMAJI[k] ?? k).join('')
}
