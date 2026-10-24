// Fases e missões. Cada passo tem uma etapa INPUT → INTAKE → OUTPUT.
// Os campos `fact` são verificados contra o mapa (tests/spatial.test.js).

const cmd = (dir, kanji, kana, pt) => ({
  target: `mk_${dir.toLowerCase()}`,
  dir,
  jp: `[pos:{${kanji}|${kana}}][part:へ][pred:{行|い}ってください]。`,
  pt: `Vá para o ${pt}, por favor.`
})

export const PHASES = [
  {
    id: 1,
    title: 'A BÚSSOLA PERDIDA',
    titleJp: 'なくした コンパス',
    goal: 'Aprender os quatro pontos cardeais: 北・南・東・西.',
    spawn: { scene: 'city', at: 'station' },
    steps: [
      {
        type: 'dialogue',
        npc: 'obaasan',
        id: 'p1_intro',
        stage: 'input',
        obj: { pt: 'Fale com a vovó perto da fonte, na praça.' }
      },
      {
        type: 'reach',
        stage: 'intake',
        skill: 'absolute',
        vocab: ['kita'],
        ...cmd('N', '北', 'きた', 'norte'),
        explain:
          '北 (きた) = norte. No mapa, o norte fica para cima. へ marca a direção do movimento.'
      },
      {
        type: 'reach',
        stage: 'intake',
        skill: 'absolute',
        vocab: ['higashi'],
        ...cmd('E', '東', 'ひがし', 'leste'),
        explain: '東 (ひがし) = leste, à direita no mapa — onde o sol nasce.'
      },
      {
        type: 'reach',
        stage: 'intake',
        skill: 'absolute',
        vocab: ['minami'],
        ...cmd('S', '南', 'みなみ', 'sul'),
        explain: '南 (みなみ) = sul, para baixo no mapa.'
      },
      {
        type: 'reach',
        stage: 'intake',
        skill: 'absolute',
        vocab: ['nishi'],
        ...cmd('W', '西', 'にし', 'oeste'),
        explain: '西 (にし) = oeste, à esquerda no mapa — onde a lua se põe.'
      },
      { type: 'puzzle', set: 'p1_intake', stage: 'intake' },
      {
        type: 'dialogue',
        npc: 'obaasan',
        id: 'p1_final',
        stage: 'output',
        obj: { pt: 'Volte até a vovó para o teste final.' }
      },
      {
        type: 'sequence',
        stage: 'output',
        skill: 'absolute',
        hideTranslation: true,
        items: [
          cmd('E', '東', 'ひがし', 'leste'),
          cmd('N', '北', 'きた', 'norte'),
          cmd('W', '西', 'にし', 'oeste'),
          cmd('S', '南', 'みなみ', 'sul')
        ]
      },
      { type: 'dialogue', npc: 'obaasan', id: 'p1_end', stage: 'output', auto: true }
    ]
  },
  {
    id: 2,
    title: 'ONDE FICA A ESTAÇÃO?',
    titleJp: '駅は どこ？',
    goal: 'Aprender 近く・隣・間・向こう e localizar prédios.',
    spawn: { scene: 'city', at: 'plaza' },
    steps: [
      {
        type: 'dialogue',
        npc: 'lisa',
        id: 'p2_intro',
        stage: 'input',
        obj: { pt: 'Fale com a turista Lisa, no norte da praça.' }
      },
      {
        type: 'findBuilding',
        building: 'station',
        stage: 'output',
        skill: 'location',
        vocab: ['tonari', 'eki'],
        clue: '{駅|えき}は[ref:{銀行|ぎんこう}][no:の][pos:{隣|となり}][part:に][pred:あります]。',
        cluePt: 'A estação fica ao lado do banco.',
        fact: { rel: 'tonari', a: 'station', b: 'bank' },
        explain:
          '隣 (となり) = vizinho imediato. O banco tem dois vizinhos: a レストラン (oeste) e o 駅 (leste).'
      },
      {
        type: 'findBuilding',
        building: 'restaurant',
        stage: 'output',
        skill: 'location',
        vocab: ['aida', 'byouin'],
        teach: ['aida', 'byouin', 'resutoran'],
        clue: 'レストランは[ref:{病院|びょういん}と{銀行|ぎんこう}][no:の][pos:{間|あいだ}][part:に][pred:あります]。',
        cluePt: 'O restaurante fica entre o hospital e o banco.',
        fact: { rel: 'aida', a: 'restaurant', b: 'hospital', c: 'bank' },
        explain: 'A と B の間 = entre A e B.'
      },
      {
        type: 'findBuilding',
        building: 'konbini',
        stage: 'output',
        skill: 'location',
        vocab: ['chikaku', 'konbini'],
        teach: ['chikaku', 'konbini', 'yuubinkyoku'],
        clue: 'コンビニは[ref:{駅|えき}][no:の][pos:{近|ちか}く]に あります。[ref:{郵便局|ゆうびんきょく}][no:の][pos:{隣|となり}]です。',
        cluePt: 'A loja de conveniência fica perto da estação. É vizinha do correio.',
        fact: [
          { rel: 'chikaku', a: 'konbini', b: 'station' },
          { rel: 'tonari', a: 'konbini', b: 'post' }
        ],
        explain:
          '近く = perto (na região). 隣 = colado, vizinho. Perto da estação há vários prédios; vizinho do correio, só um.'
      },
      {
        type: 'dialogue',
        npc: 'ken',
        id: 'p2_ken',
        stage: 'input',
        obj: { pt: 'Procure o Ken, no lado leste da praça, para achar o parque.' }
      },
      {
        type: 'findBuilding',
        building: 'park',
        stage: 'output',
        skill: 'location',
        vocab: ['mukou', 'kouen'],
        clue: '{公園|こうえん}は[ref:{道|みち}][no:の][pos:{向|む}こう][part:に][pred:あります]。',
        cluePt: 'O parque fica do outro lado da rua.',
        fact: { rel: 'mukou', a: 'park', b: 'eastRoad', from: 'plaza' },
        explain:
          '向こう = do outro lado. Da praça, atravessando a rua a leste, chega-se ao parque.'
      },
      { type: 'puzzle', set: 'p2_intake', stage: 'intake' },
      {
        type: 'dialogue',
        npc: 'lisa',
        id: 'p2_answer',
        stage: 'output',
        obj: { pt: 'Volte até a Lisa e diga onde fica a estação.' }
      }
    ]
  },
  {
    id: 3,
    title: 'O GATO ESCONDIDO',
    titleJp: 'かくれた ねこ',
    goal: 'Aprender 上・下・中・外・前・後ろ・そば e あります/います.',
    spawn: { scene: 'city', at: 'houseYard' },
    steps: [
      {
        type: 'dialogue',
        npc: 'yuki',
        id: 'p3_intro',
        stage: 'input',
        obj: { pt: 'Fale com a Yuki, perto da casa.' }
      },
      { type: 'puzzle', set: 'p3_intake', stage: 'intake' },
      {
        type: 'enter',
        target: 'house',
        stage: 'output',
        obj: {
          jp: '{家|いえ}に {入|はい}って ください。',
          pt: 'Entre na casa (porta ao sul do prédio).'
        }
      },
      {
        type: 'findCats',
        scene: 'house',
        cats: ['shiro', 'mike', 'kuro', 'tora'],
        stage: 'output',
        skill: 'location'
      },
      {
        type: 'findCats',
        scene: 'city',
        cats: ['chibi'],
        stage: 'output',
        skill: 'location',
        fact: { rel: 'soba', a: 'car', b: 'house' }
      },
      {
        type: 'dialogue',
        npc: 'yuki',
        id: 'p3_end',
        stage: 'output',
        obj: { pt: 'Leve a boa notícia para a Yuki.' }
      },
      { type: 'puzzle', set: 'p3_output', stage: 'output' }
    ]
  },
  {
    id: 4,
    title: 'O LABIRINTO DAS DIREÇÕES',
    titleJp: '方向の めいろ',
    goal: 'Diferenciar 右・左・右側・左側 e a direção relativa.',
    spawn: { scene: 'city', at: 'maze' },
    steps: [
      {
        type: 'dialogue',
        npc: 'michi',
        id: 'p4_intro',
        stage: 'input',
        obj: { pt: 'Fale com o robô Michi, na entrada do labirinto ao sul.' }
      },
      { type: 'puzzle', set: 'p4_intake', stage: 'intake' },
      {
        type: 'maze',
        round: 0,
        stage: 'output',
        obj: {
          jp: '{迷路|めいろ}に {入|はい}って ください。',
          pt: 'Entre no labirinto pelo portão.'
        }
      },
      {
        type: 'maze',
        round: 1,
        stage: 'output',
        obj: { pt: 'Rodada 2: agora começando do norte.' }
      },
      { type: 'puzzle', set: 'p4_output', stage: 'output' },
      { type: 'dialogue', npc: 'michi', id: 'p4_end', stage: 'output', auto: true }
    ]
  },
  {
    id: 5,
    title: 'O MAPA MISTERIOSO',
    titleJp: 'ふしぎな 地図',
    goal: 'Combinar direções e localização para vencer まよいネコ.',
    spawn: { scene: 'city', at: 'plaza' },
    steps: [
      { type: 'dialogue', npc: 'mayoi', id: 'p5_mayoi', stage: 'input', auto: true },
      {
        type: 'hunt',
        stage: 'output',
        skill: 'building',
        targets: [
          {
            id: 'h_library',
            kind: 'door',
            ref: 'library',
            restore: 'library',
            clue: '{家|いえ}の {南|みなみ}に ある {建物|たてもの}。{本|ほん}が たくさん あります。',
            cluePt: 'Um prédio ao sul da casa. Tem muitos livros.',
            answer:
              '{図書館|としょかん}は[ref:{家|いえ}][no:の][pos:{南|みなみ}][part:に][pred:あります]。',
            distractors: ['[pos:{北|きた}]', '[pred:います]'],
            fact: { rel: 'dir', a: 'library', dir: 'S', b: 'house' }
          },
          {
            id: 'h_post',
            kind: 'door',
            ref: 'post',
            clue: '{駅|えき}と コンビニの {間|あいだ}の {建物|たてもの}。',
            cluePt: 'O prédio entre a estação e a loja de conveniência.',
            answer:
              '{郵便局|ゆうびんきょく}は[ref:{駅|えき}とコンビニ][no:の][pos:{間|あいだ}][part:に][pred:あります]。',
            distractors: ['[pos:{隣|となり}]', '[part:で]'],
            fact: { rel: 'aida', a: 'post', b: 'station', c: 'konbini' }
          },
          {
            id: 'h_sensei',
            kind: 'npc',
            ref: 'sensei',
            clue: '{学校|がっこう}の {前|まえ}に いる {人|ひと}。',
            cluePt: 'A pessoa que está na frente da escola.',
            answer:
              '{先生|せんせい}は[ref:{学校|がっこう}][no:の][pos:{前|まえ}][part:に][pred:います]。',
            distractors: ['[pred:あります]', '[pos:{後|うし}ろ]']
          },
          {
            id: 'h_pond',
            kind: 'spot',
            ref: 'pond',
            at: { x: 55, y: 33 },
            clue: '{公園|こうえん}の {中|なか}の みず。',
            cluePt: 'A água dentro do parque.',
            answer:
              '{池|いけ}は[ref:{公園|こうえん}][no:の][pos:{中|なか}][part:に][pred:あります]。',
            distractors: ['[pos:{外|そと}]', '[pred:います]'],
            fact: { rel: 'naka', a: 'pond', b: 'park' }
          },
          {
            id: 'h_car',
            kind: 'spot',
            ref: 'car',
            at: { x: 13, y: 22 },
            clue: '{家|いえ}の そばに ある のりもの。',
            cluePt: 'Um veículo junto da casa.',
            answer:
              '{車|くるま}は[ref:{家|いえ}][no:の][pos:そば][part:に][pred:あります]。',
            distractors: ['[pos:{中|なか}]', '[pred:います]'],
            fact: { rel: 'soba', a: 'car', b: 'house' }
          }
        ]
      },
      {
        type: 'dialogue',
        npc: 'mayoi',
        id: 'p5_boss_intro',
        stage: 'output',
        obj: { pt: 'Volte à praça e desafie まよいネコ!' }
      },
      { type: 'puzzle', set: 'p5_boss', stage: 'output' },
      { type: 'dialogue', npc: 'mayoi', id: 'p5_end', stage: 'output', auto: true }
    ]
  }
]

export const phaseById = (id) => PHASES.find((p) => p.id === id)
