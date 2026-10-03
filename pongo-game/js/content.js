// Conteúdo pedagógico — metodologia de Chunking.
// Cada buraco abre um pouco mais os blocos:
//   1. Chunks inteiros        [わたしは] [ポンゴです]
//   2. Tópico aberto          [わたし] [は] [ポンゴです]
//   3. Comentário aberto      [わたしは] [ポンゴ] [です]
//   4-6. Palavra por palavra  [わたし] [は] [ポンゴ] [です]
// Só usamos a partícula は e a cópula です.

export const WORDS = {
  わたし: { romaji: 'watashi', pt: 'eu' },
  ポンゴ: { romaji: 'Pongo', pt: 'Pongo' },
  いぬ: { romaji: 'inu', pt: 'cachorro' },
  ねこ: { romaji: 'neko', pt: 'gato' },
  これ: { romaji: 'kore', pt: 'isto' },
  それ: { romaji: 'sore', pt: 'isso' },
  あれ: { romaji: 'are', pt: 'aquilo' },
  ここ: { romaji: 'koko', pt: 'aqui' },
  そこ: { romaji: 'soko', pt: 'aí' },
  はな: { romaji: 'hana', pt: 'flor' },
  にわ: { romaji: 'niwa', pt: 'jardim' },
  き: { romaji: 'ki', pt: 'árvore' },
  いえ: { romaji: 'ie', pt: 'casa' },
  ボール: { romaji: 'bōru', pt: 'bola' },
  きょう: { romaji: 'kyō', pt: 'hoje' },
  にちようび: { romaji: 'nichiyōbi', pt: 'domingo' },
  げつようび: { romaji: 'getsuyōbi', pt: 'segunda-feira' },
  いいこ: { romaji: 'ii ko', pt: 'bom garoto' },
  げんき: { romaji: 'genki', pt: 'bem / animado' },
  ほね: { romaji: 'hone', pt: 'osso' },
  くつ: { romaji: 'kutsu', pt: 'sapato' },
  は: { romaji: 'wa', pt: '(tópico)' },
  です: { romaji: 'desu', pt: 'é / sou / está' },
}

export const LEVELS = [
  { id: 'whole', label: 'Chunks inteiros', hint: 'Junte o bloco do TÓPICO com o bloco do COMENTÁRIO.' },
  { id: 'topic', label: 'Tópico aberto', hint: 'Abra o bloco do tópico: palavra + は.' },
  { id: 'comment', label: 'Comentário aberto', hint: 'Agora abra o comentário: palavra + です.' },
  { id: 'words', label: 'Palavra por palavra', hint: 'Monte tudo: palavra + は + palavra + です.' },
]

// Cada estação = 1 buraco no jardim, com 2 frases.
export const STATIONS = [
  {
    icon: '🏠',
    place: 'ao lado da casinha',
    level: 'whole',
    find: 'clue',
    findText: 'Um papelzinho com marca de patinha! “Procure perto das flores…”',
    phrases: [
      {
        clue: 'O Pongo quer se apresentar para o jardim.',
        pt: 'Eu sou o Pongo.',
        topic: 'わたし', comment: 'ポンゴ',
        distract: ['ねこです'],
        note: 'Literalmente: “Quanto a mim, (sou) Pongo.” は apresenta o tema, です fecha a frase.',
      },
      {
        clue: 'Uma borboleta pergunta: “E você, é o quê?”',
        pt: 'O Pongo é um cachorro.',
        topic: 'ポンゴ', comment: 'いぬ',
        distract: ['ねこは', 'ねこです'],
        note: 'Troque o tema e o comentário e a estrutura continua igual: [X は] [Y です].',
      },
    ],
  },
  {
    icon: '🌸',
    place: 'no canteiro de flores',
    level: 'topic',
    find: 'clue',
    findText: 'Outra pista! “A árvore grande sabe de alguma coisa…”',
    phrases: [
      {
        clue: 'O Pongo cheira uma coisa colorida bem pertinho.',
        pt: 'Isto é uma flor.',
        topic: 'これ', comment: 'はな',
        distract: ['あれ'],
        note: 'これ = “isto” (perto de quem fala). O bloco do tópico é sempre [palavra + は].',
      },
      {
        clue: 'Ele olha em volta e reconhece o lugar.',
        pt: 'Aqui é o jardim.',
        topic: 'ここ', comment: 'にわ',
        distract: ['そこ', 'いえです'],
        note: 'ここ = “aqui”. Lugares também podem ser o tema com は.',
      },
    ],
  },
  {
    icon: '🌳',
    place: 'debaixo da árvore',
    level: 'comment',
    find: 'clue',
    findText: 'Uma pista com cheiro de bola… “Veja atrás do arbusto!”',
    phrases: [
      {
        clue: 'Lá longe tem uma coisa alta e cheia de folhas.',
        pt: 'Aquilo é uma árvore.',
        topic: 'あれ', comment: 'き',
        distract: ['いえ'],
        note: 'あれ = “aquilo” (longe de todos). O comentário é [palavra + です].',
      },
      {
        clue: 'E aquela construção grande lá no fundo?',
        pt: 'Aquilo é a casa.',
        topic: 'あれ', comment: 'いえ',
        distract: ['き', 'にわ'],
        note: 'Mesmo tópico, comentário diferente: é só trocar a peça do bloco.',
      },
    ],
  },
  {
    icon: '🌿',
    place: 'atrás do arbusto',
    level: 'words',
    find: 'ball',
    findText: 'Não é o osso… é uma bola! A pista diz: “Vá até a palmeira!”',
    phrases: [
      {
        clue: 'Tem uma coisa redonda perto de você (o jogador)!',
        pt: 'Isso é uma bola.',
        topic: 'それ', comment: 'ボール',
        distract: ['これ'],
        note: 'それ = “isso” (perto de quem ouve). Agora você monta tudo palavra por palavra!',
      },
      {
        clue: 'Dia perfeito para cavar…',
        pt: 'Hoje é domingo.',
        topic: 'きょう', comment: 'にちようび',
        distract: ['げつようび'],
        note: 'Em japonês, “hoje” também pode ser o tema: きょうは…',
      },
    ],
  },
  {
    icon: '🌴',
    place: 'perto da palmeira',
    level: 'words',
    find: 'clue',
    findText: 'O cheiro ficou forte! “O osso está perto da cerca!”',
    phrases: [
      {
        clue: 'Alguém está fazendo um ótimo trabalho!',
        pt: 'O Pongo é um bom garoto.',
        topic: 'ポンゴ', comment: 'いいこ',
        distract: ['ねこ', 'ほね'],
        note: 'いいこ = “bom garoto/boa criança”. Elogio perfeito para cachorro!',
      },
      {
        clue: 'O Pongo está cheio de energia para o último buraco.',
        pt: 'Eu estou bem / animado.',
        topic: 'わたし', comment: 'げんき',
        distract: ['いぬ', 'それ'],
        note: 'です também funciona como “estar”: げんきです = estou bem.',
      },
    ],
  },
  {
    icon: '🦴',
    place: 'junto da cerca',
    level: 'words',
    find: 'bone',
    findText: 'É ELE! O osso perdido do Pongo!',
    phrases: [
      {
        clue: 'Uma ponta branca aparece na terra…',
        pt: 'Isto é um osso!',
        topic: 'これ', comment: 'ほね',
        distract: ['くつ', 'それ'],
        note: 'ほね = osso. Falta só uma frase para desenterrar!',
      },
      {
        clue: 'Grite para todo mundo onde está o tesouro!',
        pt: 'O osso está aqui!',
        topic: 'ほね', comment: 'ここ',
        distract: ['そこ', 'いぬ'],
        note: 'A frase final do jogo: ほねは ここです！ O tema é o osso; o comentário diz onde ele está.',
      },
    ],
  },
]

/** Monta as peças (corretas e distratoras) para o nível de chunk da estação. */
export function buildPuzzle(phrase, levelId) {
  const { topic, comment } = phrase
  let answer
  switch (levelId) {
    case 'whole':
      answer = [tile(topic + 'は', 'topic'), tile(comment + 'です', 'comment')]
      break
    case 'topic':
      answer = [tile(topic, 'noun'), tile('は', 'wa'), tile(comment + 'です', 'comment')]
      break
    case 'comment':
      answer = [tile(topic + 'は', 'topic'), tile(comment, 'noun'), tile('です', 'desu')]
      break
    default:
      answer = [tile(topic, 'noun'), tile('は', 'wa'), tile(comment, 'noun'), tile('です', 'desu')]
  }
  const distract = phrase.distract.map((d) => {
    if (d.endsWith('です') && d !== 'です') return tile(d, 'comment')
    if (d.endsWith('は') && d.length > 1) return tile(d, 'topic')
    return tile(d, 'noun')
  })
  // grupos de slots: tópico (até は) e comentário (até です)
  const split = answer.findIndex((t, i) => i > 0 && (t.kind === 'comment' || t.kind === 'noun'))
  const groups = [
    { kind: 'topic', label: 'TÓPICO', size: split },
    { kind: 'comment', label: 'COMENTÁRIO', size: answer.length - split },
  ]
  return { answer, distract, groups }
}

function tile(text, kind) {
  return { text, kind, romaji: romajiOf(text) }
}

export function romajiOf(text) {
  if (WORDS[text]) return WORDS[text].romaji
  if (text.endsWith('です') && WORDS[text.slice(0, -2)]) return WORDS[text.slice(0, -2)].romaji + ' desu'
  if (text.endsWith('は') && WORDS[text.slice(0, -1)]) return WORDS[text.slice(0, -1)].romaji + ' wa'
  return ''
}

export function sentenceOf(phrase) {
  return `${phrase.topic}は ${phrase.comment}です`
}

export function romajiSentence(phrase) {
  const r = `${WORDS[phrase.topic].romaji} wa ${WORDS[phrase.comment].romaji} desu.`
  return r.charAt(0).toUpperCase() + r.slice(1)
}
