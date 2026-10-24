// Caderno gramatical: padrões, explicações em português e exemplos
// com chunking colorido (azul = referência, amarelo = の, verde =
// posição, roxo = に/で/へ, vermelho = predicado).

export const GRAMMAR = [
  {
    id: 'a-no-b',
    phase: 1,
    pattern: 'A の B',
    title: 'A の B — “o B de A”',
    explain:
      'の liga duas palavras: A é a referência e B a palavra que ela modifica. Para localizar algo, A é o objeto de referência e B a palavra de posição: はこの中 = “o dentro da caixa”. A ordem importa: 中のはこ = “a caixa de dentro” (outra coisa!).',
    examples: [
      { jp: '[ref:はこ][no:の][pos:{中|なか}]', pt: 'dentro da caixa' },
      { jp: '[pos:{中|なか}][no:の][ref:はこ]', pt: 'a caixa (que está) dentro' }
    ]
  },
  {
    id: 'ni-arimasu',
    phase: 2,
    pattern: 'A は B の [posição] に あります',
    title: 'Localizar coisas e lugares',
    explain:
      'Use あります para objetos, plantas, prédios e lugares (seres inanimados). A partícula に marca o lugar onde algo existe.',
    examples: [
      {
        jp: '{駅|えき}は[ref:{銀行|ぎんこう}][no:の][pos:{隣|となり}][part:に][pred:あります]。',
        pt: 'A estação fica ao lado do banco.'
      },
      {
        jp: '{本|ほん}は[ref:{机|つくえ}][no:の][pos:{上|うえ}][part:に][pred:あります]。',
        pt: 'O livro está sobre a mesa.'
      }
    ]
  },
  {
    id: 'ni-imasu',
    phase: 3,
    pattern: 'A は B の [posição] に います',
    title: 'Localizar pessoas e animais',
    explain:
      'Use います para seres vivos que se movem por conta própria: pessoas e animais. Gato → います. Caixa → あります.',
    examples: [
      {
        jp: '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。',
        pt: 'O gato está dentro da caixa.'
      },
      {
        jp: '{先生|せんせい}は[ref:{学校|がっこう}][no:の][pos:{前|まえ}][part:に][pred:います]。',
        pt: 'O professor está na frente da escola.'
      }
    ]
  },
  {
    id: 'to-no-aida',
    phase: 2,
    pattern: 'A と B の 間',
    title: 'Entre A e B',
    explain:
      'と une as duas referências; depois vem の 間 (あいだ). A ordem de A e B pode trocar sem mudar o sentido.',
    examples: [
      {
        jp: 'レストランは[ref:{病院|びょういん}と{銀行|ぎんこう}][no:の][pos:{間|あいだ}][part:に][pred:あります]。',
        pt: 'O restaurante fica entre o hospital e o banco.'
      }
    ]
  },
  {
    id: 'no-chikaku',
    phase: 2,
    pattern: 'A の 近く / A の 隣',
    title: 'Perto de A / ao lado de A',
    explain:
      '近く (ちかく) = perto, na região. 隣 (となり) = imediatamente ao lado, vizinho do mesmo tipo (prédio ao lado de prédio). そば = bem junto, colado.',
    examples: [
      {
        jp: 'コンビニは[ref:{駅|えき}][no:の][pos:{近|ちか}く][part:に][pred:あります]。',
        pt: 'A loja de conveniência fica perto da estação.'
      },
      {
        jp: 'コンビニは[ref:{郵便局|ゆうびんきょく}][no:の][pos:{隣|となり}][part:に][pred:あります]。',
        pt: 'A loja de conveniência fica ao lado do correio.'
      }
    ]
  },
  {
    id: 'de-action',
    phase: 2,
    pattern: 'A で [ação]',
    title: 'で — onde a ação acontece',
    explain:
      'で marca o lugar onde se FAZ algo (comer, brincar, ler). に marca onde algo EXISTE (あります/います) ou o destino. Compare: 公園にいます (estou no parque) × 公園で遊びます (brinco no parque).',
    examples: [
      {
        jp: '[ref:{公園|こうえん}][part:で][pred:{遊|あそ}びます]。',
        pt: 'Brinco no parque.'
      },
      {
        jp: '[ref:{図書館|としょかん}][part:で][pred:{本|ほん}を{読|よ}みます]。',
        pt: 'Leio livros na biblioteca.'
      }
    ]
  },
  {
    id: 'e-direction',
    phase: 1,
    pattern: '[direção] へ 行きます',
    title: 'へ — direção do movimento',
    explain:
      'へ (lida “e”) indica a direção para onde alguém se move: 北へ行きます = vou rumo ao norte. に também pode marcar destino (駅に行きます), mas へ enfatiza a direção.',
    examples: [
      { jp: '[pos:{北|きた}][part:へ][pred:{行|い}きます]。', pt: 'Vou para o norte.' },
      {
        jp: '[pos:{東|ひがし}][part:へ][pred:{行|い}ってください]。',
        pt: 'Vá para o leste, por favor.'
      }
    ]
  },
  {
    id: 'relative-turns',
    phase: 4,
    pattern: '右 / 左 に 曲がってください',
    title: 'Instruções de rota',
    explain:
      'Direções relativas dependem de para onde a pessoa está olhando. Se você olha para o 南 (sul), o seu 右 (direita) é o 西 (oeste)! 右側 / 左側 = lado direito / esquerdo de um caminho.',
    examples: [
      {
        jp: '[pos:{右|みぎ}][part:に][pred:{曲|ま}がってください]。',
        pt: 'Vire à direita, por favor.'
      },
      {
        jp: '[pos:まっすぐ][pred:{行|い}ってください]。',
        pt: 'Siga em frente, por favor.'
      },
      {
        jp: 'ドアは[ref:{廊下|ろうか}][no:の][pos:{左側|ひだりがわ}][part:に][pred:あります]。',
        pt: 'A porta fica do lado esquerdo do corredor.'
      }
    ]
  },
  {
    id: 'ko-so-a',
    phase: 2,
    pattern: 'ここ・そこ・あそこ・この辺',
    title: 'Demonstrativos de lugar',
    explain:
      'ここ = perto de quem fala; そこ = perto de quem ouve; あそこ = longe dos dois; この辺 (このへん) = esta região, por aqui.',
    examples: [
      { jp: '[pos:ここ]は[pred:{駅|えき}です]。', pt: 'Aqui é a estação.' },
      {
        jp: '[pos:この{辺|へん}][part:に]コンビニが[pred:ありますか]。',
        pt: 'Tem loja de conveniência por aqui?'
      }
    ]
  }
]
