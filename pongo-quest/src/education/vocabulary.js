// Vocabulário espacial (JLPT N5, com consolidação N4).
// Cada item possui: kanji (quando aplicável), furigana, tradução,
// exemplo contextualizado (com chunking), ícone, fase de introdução
// e habilidade principal. Atividades de reconhecimento e produção são
// geradas a partir destes dados (education/questionBank.js).

export const SKILLS = {
  absolute: 'Direções absolutas (北・南・東・西)',
  relative: 'Direções relativas (右・左・前・後ろ)',
  location: 'Localização espacial (上・中・隣…)',
  existence: 'あります / います',
  particles: 'Partículas (の・に・で・へ)',
  kanji: 'Kanji e leitura',
  building: 'Construção de frases'
}

const v = (id, data) => ({ id, ...data })

export const VOCAB = [
  // ── Pontos cardeais ───────────────────────────────────────────
  v('kita', {
    word: '{北|きた}',
    kanji: '北',
    kana: 'きた',
    pt: 'norte',
    cat: 'cardinal',
    skill: 'absolute',
    phase: 1,
    icon: 'dir-N',
    ex: '{駅|えき}は[ref:{広場|ひろば}][no:の][pos:{北|きた}][part:に][pred:あります]。',
    exPt: 'A estação fica ao norte da praça.'
  }),
  v('minami', {
    word: '{南|みなみ}',
    kanji: '南',
    kana: 'みなみ',
    pt: 'sul',
    cat: 'cardinal',
    skill: 'absolute',
    phase: 1,
    icon: 'dir-S',
    ex: '{図書館|としょかん}は[ref:{家|いえ}][no:の][pos:{南|みなみ}][part:に][pred:あります]。',
    exPt: 'A biblioteca fica ao sul da casa.'
  }),
  v('higashi', {
    word: '{東|ひがし}',
    kanji: '東',
    kana: 'ひがし',
    pt: 'leste',
    cat: 'cardinal',
    skill: 'absolute',
    phase: 1,
    icon: 'dir-E',
    ex: '{公園|こうえん}は[ref:{広場|ひろば}][no:の][pos:{東|ひがし}][part:に][pred:あります]。',
    exPt: 'O parque fica a leste da praça.'
  }),
  v('nishi', {
    word: '{西|にし}',
    kanji: '西',
    kana: 'にし',
    pt: 'oeste',
    cat: 'cardinal',
    skill: 'absolute',
    phase: 1,
    icon: 'dir-W',
    ex: '{家|いえ}は[ref:{広場|ひろば}][no:の][pos:{西|にし}][part:に][pred:あります]。',
    exPt: 'A casa fica a oeste da praça.'
  }),

  // ── Localização ───────────────────────────────────────────────
  v('chikaku', {
    word: '{近|ちか}く',
    kanji: '近く',
    kana: 'ちかく',
    pt: 'perto',
    cat: 'spatial',
    skill: 'location',
    phase: 2,
    icon: 'pos-chikaku',
    ex: 'コンビニは[ref:{駅|えき}][no:の][pos:{近|ちか}く][part:に][pred:あります]。',
    exPt: 'A loja de conveniência fica perto da estação.'
  }),
  v('tonari', {
    word: '{隣|となり}',
    kanji: '隣',
    kana: 'となり',
    pt: 'ao lado (vizinho)',
    cat: 'spatial',
    skill: 'location',
    phase: 2,
    icon: 'pos-tonari',
    ex: '{駅|えき}は[ref:{銀行|ぎんこう}][no:の][pos:{隣|となり}][part:に][pred:あります]。',
    exPt: 'A estação fica ao lado do banco.'
  }),
  v('aida', {
    word: '{間|あいだ}',
    kanji: '間',
    kana: 'あいだ',
    pt: 'entre',
    cat: 'spatial',
    skill: 'location',
    phase: 2,
    icon: 'pos-aida',
    ex: 'レストランは[ref:{病院|びょういん}と{銀行|ぎんこう}][no:の][pos:{間|あいだ}][part:に][pred:あります]。',
    exPt: 'O restaurante fica entre o hospital e o banco.'
  }),
  v('mukou', {
    word: '{向|む}こう',
    kanji: '向こう',
    kana: 'むこう',
    pt: 'do outro lado',
    cat: 'spatial',
    skill: 'location',
    phase: 2,
    icon: 'pos-mukou',
    ex: '{公園|こうえん}は[ref:{道|みち}][no:の][pos:{向|む}こう][part:に][pred:あります]。',
    exPt: 'O parque fica do outro lado da rua.'
  }),
  v('ue', {
    word: '{上|うえ}',
    kanji: '上',
    kana: 'うえ',
    pt: 'em cima',
    cat: 'spatial',
    skill: 'location',
    phase: 3,
    icon: 'pos-ue',
    ex: '{本|ほん}は[ref:{机|つくえ}][no:の][pos:{上|うえ}][part:に][pred:あります]。',
    exPt: 'O livro está sobre a mesa.'
  }),
  v('shita', {
    word: '{下|した}',
    kanji: '下',
    kana: 'した',
    pt: 'embaixo',
    cat: 'spatial',
    skill: 'location',
    phase: 3,
    icon: 'pos-shita',
    ex: '{猫|ねこ}は[ref:テーブル][no:の][pos:{下|した}][part:に][pred:います]。',
    exPt: 'O gato está embaixo da mesa.'
  }),
  v('naka', {
    word: '{中|なか}',
    kanji: '中',
    kana: 'なか',
    pt: 'dentro',
    cat: 'spatial',
    skill: 'location',
    phase: 3,
    icon: 'pos-naka',
    ex: '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。',
    exPt: 'O gato está dentro da caixa.'
  }),
  v('soto', {
    word: '{外|そと}',
    kanji: '外',
    kana: 'そと',
    pt: 'fora',
    cat: 'spatial',
    skill: 'location',
    phase: 3,
    icon: 'pos-soto',
    ex: '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{外|そと}][part:に][pred:います]。',
    exPt: 'O gato está fora da caixa.'
  }),
  v('mae', {
    word: '{前|まえ}',
    kanji: '前',
    kana: 'まえ',
    pt: 'na frente',
    cat: 'spatial',
    skill: 'location',
    phase: 3,
    icon: 'pos-mae',
    ex: '{先生|せんせい}は[ref:{学校|がっこう}][no:の][pos:{前|まえ}][part:に][pred:います]。',
    exPt: 'O professor está na frente da escola.'
  }),
  v('ushiro', {
    word: '{後|うし}ろ',
    kanji: '後ろ',
    kana: 'うしろ',
    pt: 'atrás',
    cat: 'spatial',
    skill: 'location',
    phase: 3,
    icon: 'pos-ushiro',
    ex: '{猫|ねこ}は[ref:ソファ][no:の][pos:{後|うし}ろ][part:に][pred:います]。',
    exPt: 'O gato está atrás do sofá.'
  }),
  v('soba', {
    word: 'そば',
    kanji: '',
    kana: 'そば',
    pt: 'junto de, bem perto',
    cat: 'spatial',
    skill: 'location',
    phase: 3,
    icon: 'pos-soba',
    ex: '{猫|ねこ}は[ref:{車|くるま}][no:の][pos:そば][part:に][pred:います]。',
    exPt: 'O gato está junto do carro.'
  }),

  // ── Direções relativas ────────────────────────────────────────
  v('migi', {
    word: '{右|みぎ}',
    kanji: '右',
    kana: 'みぎ',
    pt: 'direita',
    cat: 'relative',
    skill: 'relative',
    phase: 4,
    icon: 'rel-migi',
    ex: 'コンビニは[ref:{郵便局|ゆうびんきょく}][no:の][pos:{右|みぎ}][part:に][pred:あります]。',
    exPt: 'A loja de conveniência fica à direita do correio.'
  }),
  v('hidari', {
    word: '{左|ひだり}',
    kanji: '左',
    kana: 'ひだり',
    pt: 'esquerda',
    cat: 'relative',
    skill: 'relative',
    phase: 4,
    icon: 'rel-hidari',
    ex: '{銀行|ぎんこう}は[ref:{駅|えき}][no:の][pos:{左|ひだり}][part:に][pred:あります]。',
    exPt: 'O banco fica à esquerda da estação.'
  }),
  v('migigawa', {
    word: '{右側|みぎがわ}',
    kanji: '右側',
    kana: 'みぎがわ',
    pt: 'lado direito',
    cat: 'relative',
    skill: 'relative',
    phase: 4,
    icon: 'rel-migigawa',
    ex: 'ドアは[ref:{廊下|ろうか}][no:の][pos:{右側|みぎがわ}][part:に][pred:あります]。',
    exPt: 'A porta fica do lado direito do corredor.'
  }),
  v('hidarigawa', {
    word: '{左側|ひだりがわ}',
    kanji: '左側',
    kana: 'ひだりがわ',
    pt: 'lado esquerdo',
    cat: 'relative',
    skill: 'relative',
    phase: 4,
    icon: 'rel-hidarigawa',
    ex: '{郵便局|ゆうびんきょく}は[ref:{道|みち}][no:の][pos:{左側|ひだりがわ}][part:に][pred:あります]。',
    exPt: 'O correio fica do lado esquerdo da rua.'
  }),
  v('massugu', {
    word: 'まっすぐ',
    kanji: '',
    kana: 'まっすぐ',
    pt: 'em frente, reto',
    cat: 'relative',
    skill: 'relative',
    phase: 4,
    icon: 'rel-massugu',
    ex: '[pos:まっすぐ][pred:{行|い}ってください]。',
    exPt: 'Siga em frente, por favor.'
  }),

  // ── Demonstrativos de lugar ───────────────────────────────────
  v('koko', {
    word: 'ここ',
    kanji: '',
    kana: 'ここ',
    pt: 'aqui (perto de quem fala)',
    cat: 'demonstrative',
    skill: 'location',
    phase: 2,
    icon: 'dem-koko',
    ex: '[pos:ここ]は[pred:{駅|えき}です]。',
    exPt: 'Aqui é a estação.'
  }),
  v('soko', {
    word: 'そこ',
    kanji: '',
    kana: 'そこ',
    pt: 'aí (perto de quem ouve)',
    cat: 'demonstrative',
    skill: 'location',
    phase: 3,
    icon: 'dem-soko',
    ex: '[pos:そこ][part:に]{猫|ねこ}が[pred:います]。',
    exPt: 'Tem um gato aí (perto de você).'
  }),
  v('asoko', {
    word: 'あそこ',
    kanji: '',
    kana: 'あそこ',
    pt: 'ali, lá (longe de ambos)',
    cat: 'demonstrative',
    skill: 'location',
    phase: 2,
    icon: 'dem-asoko',
    ex: '[pos:あそこ]は[pred:{公園|こうえん}です]。',
    exPt: 'Lá é o parque.'
  }),
  v('konohen', {
    word: 'この{辺|へん}',
    kanji: 'この辺',
    kana: 'このへん',
    pt: 'por aqui, nesta região',
    cat: 'demonstrative',
    skill: 'location',
    phase: 5,
    icon: 'dem-konohen',
    ex: '[pos:この{辺|へん}][part:に]コンビニが[pred:ありますか]。',
    exPt: 'Tem uma loja de conveniência por aqui?'
  }),

  // ── Lugares da cidade ─────────────────────────────────────────
  v('eki', {
    word: '{駅|えき}',
    kanji: '駅',
    kana: 'えき',
    pt: 'estação',
    cat: 'place',
    skill: 'kanji',
    phase: 2,
    icon: 'bld-station',
    ex: '[pos:ここ]は[pred:{駅|えき}です]。',
    exPt: 'Aqui é a estação.'
  }),
  v('gakkou', {
    word: '{学校|がっこう}',
    kanji: '学校',
    kana: 'がっこう',
    pt: 'escola',
    cat: 'place',
    skill: 'kanji',
    phase: 2,
    icon: 'bld-school',
    ex: '{病院|びょういん}は[ref:{学校|がっこう}][no:の][pos:{隣|となり}][part:に][pred:あります]。',
    exPt: 'O hospital fica ao lado da escola.'
  }),
  v('byouin', {
    word: '{病院|びょういん}',
    kanji: '病院',
    kana: 'びょういん',
    pt: 'hospital',
    cat: 'place',
    skill: 'kanji',
    phase: 2,
    icon: 'bld-hospital',
    ex: '{病院|びょういん}は[ref:{学校|がっこう}][no:の][pos:{近|ちか}く][part:に][pred:あります]。',
    exPt: 'O hospital fica perto da escola.'
  }),
  v('resutoran', {
    word: 'レストラン',
    kanji: '',
    kana: 'れすとらん',
    pt: 'restaurante',
    cat: 'place',
    skill: 'kanji',
    phase: 2,
    icon: 'bld-restaurant',
    ex: '[ref:レストラン][part:で][pred:{食|た}べます]。',
    exPt: 'Como no restaurante.'
  }),
  v('kouen', {
    word: '{公園|こうえん}',
    kanji: '公園',
    kana: 'こうえん',
    pt: 'parque',
    cat: 'place',
    skill: 'kanji',
    phase: 2,
    icon: 'bld-park',
    ex: '[ref:{公園|こうえん}][part:で][pred:{遊|あそ}びます]。',
    exPt: 'Brinco no parque.'
  }),
  v('konbini', {
    word: 'コンビニ',
    kanji: '',
    kana: 'こんびに',
    pt: 'loja de conveniência',
    cat: 'place',
    skill: 'kanji',
    phase: 2,
    icon: 'bld-konbini',
    ex: '[ref:コンビニ][part:で][pred:おにぎりを{買|か}います]。',
    exPt: 'Compro onigiri na loja de conveniência.'
  }),
  v('toshokan', {
    word: '{図書館|としょかん}',
    kanji: '図書館',
    kana: 'としょかん',
    pt: 'biblioteca',
    cat: 'place',
    skill: 'kanji',
    phase: 5,
    icon: 'bld-library',
    ex: '[ref:{図書館|としょかん}][part:で][pred:{本|ほん}を{読|よ}みます]。',
    exPt: 'Leio livros na biblioteca.'
  }),
  v('yuubinkyoku', {
    word: '{郵便局|ゆうびんきょく}',
    kanji: '郵便局',
    kana: 'ゆうびんきょく',
    pt: 'correio',
    cat: 'place',
    skill: 'kanji',
    phase: 2,
    icon: 'bld-post',
    ex: '{郵便局|ゆうびんきょく}は[ref:{駅|えき}とコンビニ][no:の][pos:{間|あいだ}][part:に][pred:あります]。',
    exPt: 'O correio fica entre a estação e a loja de conveniência.'
  }),
  v('ginkou', {
    word: '{銀行|ぎんこう}',
    kanji: '銀行',
    kana: 'ぎんこう',
    pt: 'banco',
    cat: 'place',
    skill: 'kanji',
    phase: 2,
    icon: 'bld-bank',
    ex: '{銀行|ぎんこう}は[ref:{駅|えき}][no:の][pos:{隣|となり}][part:に][pred:あります]。',
    exPt: 'O banco fica ao lado da estação.'
  }),
  v('ie', {
    word: '{家|いえ}',
    kanji: '家',
    kana: 'いえ',
    pt: 'casa',
    cat: 'place',
    skill: 'kanji',
    phase: 3,
    icon: 'bld-house',
    ex: '[ref:{家|いえ}][no:の][pos:{中|なか}][part:に]{猫|ねこ}が[pred:います]。',
    exPt: 'Há gatos dentro da casa.'
  }),

  // ── Objetos e seres ───────────────────────────────────────────
  v('neko', {
    word: '{猫|ねこ}',
    kanji: '猫',
    kana: 'ねこ',
    pt: 'gato',
    cat: 'thing',
    skill: 'existence',
    phase: 3,
    icon: 'obj-cat',
    ex: '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。',
    exPt: 'O gato está dentro da caixa.'
  }),
  v('hako', {
    word: '{箱|はこ}',
    kanji: '箱',
    kana: 'はこ',
    pt: 'caixa',
    cat: 'thing',
    skill: 'kanji',
    phase: 3,
    icon: 'obj-box',
    ex: '[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に]はさみが[pred:あります]。',
    exPt: 'Há uma tesoura dentro da caixa.'
  }),
  v('kuruma', {
    word: '{車|くるま}',
    kanji: '車',
    kana: 'くるま',
    pt: 'carro',
    cat: 'thing',
    skill: 'kanji',
    phase: 3,
    icon: 'obj-car',
    ex: '{車|くるま}は[ref:{家|いえ}][no:の][pos:そば][part:に][pred:あります]。',
    exPt: 'O carro está junto da casa.'
  }),
  v('ki', {
    word: '{木|き}',
    kanji: '木',
    kana: 'き',
    pt: 'árvore',
    cat: 'thing',
    skill: 'kanji',
    phase: 2,
    icon: 'obj-tree',
    ex: '[ref:{木|き}][no:の][pos:{向|む}こう][part:に]{旗|はた}が[pred:あります]。',
    exPt: 'Há uma bandeira do outro lado da árvore.'
  }),
  v('michi', {
    word: '{道|みち}',
    kanji: '道',
    kana: 'みち',
    pt: 'rua, caminho',
    cat: 'thing',
    skill: 'kanji',
    phase: 2,
    icon: 'obj-road',
    ex: '[ref:{道|みち}][no:の][pos:{右側|みぎがわ}][part:に]{駅|えき}が[pred:あります]。',
    exPt: 'A estação fica do lado direito da rua.'
  }),

  // ── Gramática (verbos e partículas) ──────────────────────────
  v('arimasu', {
    word: 'あります',
    kanji: '',
    kana: 'あります',
    pt: 'existir/estar (coisas e lugares)',
    cat: 'grammar',
    skill: 'existence',
    phase: 2,
    icon: 'gr-arimasu',
    ex: '{本|ほん}は[ref:{机|つくえ}][no:の][pos:{上|うえ}][part:に][pred:あります]。',
    exPt: 'O livro está sobre a mesa.'
  }),
  v('imasu', {
    word: 'います',
    kanji: '',
    kana: 'います',
    pt: 'existir/estar (pessoas e animais)',
    cat: 'grammar',
    skill: 'existence',
    phase: 3,
    icon: 'gr-imasu',
    ex: '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。',
    exPt: 'O gato está dentro da caixa.'
  }),
  v('ikimasu', {
    word: '{行|い}きます',
    kanji: '行きます',
    kana: 'いきます',
    pt: 'ir',
    cat: 'grammar',
    skill: 'particles',
    phase: 1,
    icon: 'gr-ikimasu',
    ex: '[pos:{北|きた}][part:へ][pred:{行|い}きます]。',
    exPt: 'Vou para o norte.'
  }),
  v('magarimasu', {
    word: '{曲|ま}がります',
    kanji: '曲がります',
    kana: 'まがります',
    pt: 'virar (fazer curva)',
    cat: 'grammar',
    skill: 'relative',
    phase: 4,
    icon: 'gr-magaru',
    ex: '[pos:{右|みぎ}][part:に][pred:{曲|ま}がってください]。',
    exPt: 'Vire à direita, por favor.'
  })
]

export const VOCAB_BY_ID = Object.fromEntries(VOCAB.map((w) => [w.id, w]))

export function vocabForPhase(phase) {
  return VOCAB.filter((w) => w.phase === phase)
}
