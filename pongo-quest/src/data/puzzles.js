// Conjuntos de puzzles. Todos têm gabarito, feedback e explicação.
// Tipos: direction (A), find (B), builder (C/H), kanji (D),
// particle (E), map (F), route (G), choice (múltipla escolha).

export const FIND_SCENES = {
  room: {
    objects: [
      { kind: 'table', x: 20, y: 90, w: 80, h: 60 },
      { kind: 'box', x: 140, y: 112, w: 62, h: 38 },
      { kind: 'car', x: 262, y: 104, w: 92, h: 46 }
    ],
    spots: [
      { id: 'tbl_ue', x: 60, y: 80, icon: 'cat' },
      { id: 'tbl_shita', x: 60, y: 138, icon: 'cat' },
      { id: 'box_soto', x: 121, y: 140, icon: 'cat' },
      { id: 'box_naka', x: 171, y: 108, icon: 'cat', inside: true },
      { id: 'car_soba', x: 244, y: 142, icon: 'cat' },
      { id: 'car_ue', x: 312, y: 92, icon: 'cat' }
    ]
  },
  park: {
    objects: [
      { kind: 'tree', x: 150, y: 40, w: 70, h: 110 },
      { kind: 'pongo', x: 30, y: 100, w: 30, h: 50 }
    ],
    spots: [
      { id: 'tree_temae', x: 105, y: 140, icon: 'flag' },
      { id: 'tree_mukou', x: 265, y: 140, icon: 'flag' },
      { id: 'tree_ue', x: 185, y: 36, icon: 'flag' }
    ]
  },
  person: {
    objects: [{ kind: 'person', x: 160, y: 60, w: 40, h: 90, facing: 'left' }],
    spots: [
      { id: 'p_mae', x: 95, y: 140, icon: 'cat' },
      { id: 'p_ushiro', x: 260, y: 140, icon: 'cat' }
    ]
  }
}

export const PUZZLE_SETS = {
  // ─────────── Fase 1 ───────────
  p1_intake: {
    title: 'コンパスの れんしゅう',
    stage: 'intake',
    items: [
      {
        type: 'kanji',
        skill: 'kanji',
        vocab: ['kita', 'minami', 'higashi', 'nishi'],
        prompt: 'Associe cada kanji à sua leitura.',
        pairs: [
          ['北', 'きた', 'norte'],
          ['南', 'みなみ', 'sul'],
          ['東', 'ひがし', 'leste'],
          ['西', 'にし', 'oeste']
        ],
        explain:
          '北 きた (norte) · 南 みなみ (sul) · 東 ひがし (leste) · 西 にし (oeste).'
      },
      {
        type: 'direction',
        skill: 'absolute',
        vocab: ['higashi'],
        pick: 'compass',
        prompt: '{東|ひがし}は どこ？',
        promptPt: 'Onde fica o leste? Toque na bússola.',
        answer: 'E',
        explain: 'No mapa, o leste (東) fica à direita. É de onde o sol nasce.'
      },
      {
        type: 'direction',
        skill: 'absolute',
        vocab: ['higashi', 'nishi'],
        prompt: '{太陽|たいよう}が のぼる {方角|ほうがく}は？',
        promptPt: 'Em que direção o sol nasce?',
        options: ['N', 'S', 'E', 'W'],
        answer: 'E',
        explain:
          '太陽は東からのぼります — o sol nasce no leste (東) e se põe no oeste (西).'
      },
      {
        type: 'particle',
        skill: 'particles',
        vocab: ['ikimasu'],
        sentence: '{北|きた}＿{行|い}きます。',
        pt: 'Vou para o norte.',
        options: ['の', 'に', 'で', 'へ'],
        answer: 'へ',
        accept: ['に'],
        explain:
          'へ marca a direção do movimento. に também funciona para destino, mas へ enfatiza o rumo.'
      },
      {
        type: 'direction',
        skill: 'absolute',
        vocab: ['kita', 'eki'],
        visual: 'citymap',
        prompt:
          'ポンゴは {広場|ひろば}に います。{駅|えき}は どの {方角|ほうがく}ですか。',
        promptPt: 'Pongo está na praça. Em que direção fica a estação?',
        options: ['N', 'S', 'E', 'W'],
        answer: 'N',
        explain: '駅は広場の北にあります — a estação fica ao norte (acima) da praça.'
      }
    ]
  },

  // ─────────── Fase 2 ───────────
  p2_intake: {
    title: '{地図|ちず}を {読|よ}もう',
    stage: 'intake',
    items: [
      {
        type: 'map',
        mode: 'click',
        skill: 'location',
        vocab: ['aida'],
        question:
          'レストランは[ref:{病院|びょういん}と{銀行|ぎんこう}][no:の][pos:{間|あいだ}][part:に][pred:あります]。レストランは どれ？',
        questionPt:
          'O restaurante fica entre o hospital e o banco. Qual é o restaurante?',
        labels: ['school', 'hospital', 'bank', 'post', 'house'],
        answer: 'restaurant',
        explain:
          '間 (あいだ) = entre. Procure o prédio que tem o hospital de um lado e o banco do outro.'
      },
      {
        type: 'map',
        mode: 'choose',
        skill: 'location',
        vocab: ['tonari'],
        question: '{郵便局|ゆうびんきょく}の {隣|となり}は どれ？',
        questionPt: 'Qual prédio fica ao lado do correio?',
        labels: 'all',
        highlight: 'post',
        options: [
          { id: 'konbini', jp: 'コンビニ' },
          { id: 'school', jp: '{学校|がっこう}' },
          { id: 'library', jp: '{図書館|としょかん}' },
          { id: 'house', jp: '{家|いえ}' }
        ],
        answer: 'konbini',
        explain:
          'A コンビニ é vizinha (隣) do correio. O 駅 também é — 隣 vale para os dois lados!'
      },
      {
        type: 'particle',
        skill: 'particles',
        vocab: ['kouen'],
        sentence: '{公園|こうえん}＿{遊|あそ}びます。',
        pt: 'Brinco no parque.',
        options: ['の', 'に', 'で', 'へ'],
        answer: 'で',
        explain:
          'で marca o lugar onde a AÇÃO acontece (brincar). に seria para existência: 公園にいます.'
      },
      {
        type: 'particle',
        skill: 'particles',
        vocab: ['tonari'],
        sentence: '{駅|えき}は {銀行|ぎんこう}＿{隣|となり}に あります。',
        pt: 'A estação fica ao lado do banco.',
        options: ['の', 'に', 'で', 'へ'],
        answer: 'の',
        explain: 'の liga a referência à posição: 銀行の隣 = “o lado do banco”.'
      },
      {
        type: 'particle',
        skill: 'particles',
        vocab: ['arimasu'],
        sentence: '{駅|えき}は {銀行|ぎんこう}の {隣|となり}＿あります。',
        pt: 'A estação fica ao lado do banco.',
        options: ['の', 'に', 'で', 'へ'],
        answer: 'に',
        explain: 'に marca o lugar onde algo EXISTE, junto com あります/います.'
      },
      {
        type: 'choice',
        skill: 'location',
        vocab: ['chikaku'],
        prompt: 'コンビニは {駅|えき}の ＿＿ に あります。',
        promptPt: 'A loja de conveniência fica PERTO da estação.',
        options: [{ jp: '{近|ちか}く' }, { jp: '{中|なか}' }, { jp: '{上|うえ}' }],
        answer: 0,
        explain: '近く (ちかく) = perto. 中 = dentro, 上 = em cima.'
      },
      {
        type: 'find',
        scene: 'park',
        skill: 'location',
        vocab: ['mukou', 'ki'],
        sentence:
          '{旗|はた}は[ref:{木|き}][no:の][pos:{向|む}こう][part:に][pred:あります]。',
        pt: 'A bandeira fica do outro lado da árvore (visto por Pongo).',
        answer: 'tree_mukou',
        explain:
          '向こう = do outro lado, além da árvore, do ponto de vista de quem olha (Pongo).'
      }
    ]
  },

  // ─────────── Fase 3 ───────────
  p3_intake: {
    title: '{猫|ねこ}は どこ？',
    stage: 'intake',
    items: [
      {
        type: 'find',
        scene: 'room',
        skill: 'location',
        vocab: ['shita'],
        sentence:
          '{猫|ねこ}は[ref:テーブル][no:の][pos:{下|した}][part:に][pred:います]。',
        pt: 'O gato está embaixo da mesa.',
        answer: 'tbl_shita',
        explain: '下 (した) = embaixo.'
      },
      {
        type: 'find',
        scene: 'room',
        skill: 'location',
        vocab: ['naka', 'hako'],
        sentence:
          '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。',
        pt: 'O gato está dentro da caixa.',
        answer: 'box_naka',
        explain: '中 (なか) = dentro.'
      },
      {
        type: 'find',
        scene: 'room',
        skill: 'location',
        vocab: ['soba', 'kuruma'],
        sentence: '{猫|ねこ}は[ref:{車|くるま}][no:の][pos:そば][part:に][pred:います]。',
        pt: 'O gato está junto do carro.',
        answer: 'car_soba',
        explain: 'そば = bem junto, colado. O gato em cima seria 車の上.'
      },
      {
        type: 'find',
        scene: 'person',
        skill: 'location',
        vocab: ['ushiro'],
        sentence:
          '{猫|ねこ}は[ref:{男|おとこ}の{人|ひと}][no:の][pos:{後|うし}ろ][part:に][pred:います]。',
        pt: 'O gato está atrás do homem.',
        answer: 'p_ushiro',
        explain: 'O homem olha para a esquerda; 後ろ (うしろ) é o lado das costas dele.'
      },
      {
        type: 'choice',
        skill: 'existence',
        vocab: ['arimasu'],
        prompt: '{本|ほん}は {机|つくえ}の {上|うえ}に ＿＿。',
        promptPt: 'O livro está sobre a mesa.',
        options: [{ jp: 'あります' }, { jp: 'います' }],
        answer: 0,
        explain: 'Livro é objeto → あります. います só para pessoas e animais.'
      }
    ]
  },
  p3_output: {
    title: 'ことばで せつめい',
    stage: 'output',
    items: [
      {
        type: 'kanji',
        skill: 'kanji',
        vocab: ['ue', 'shita', 'naka', 'soto'],
        prompt: 'Associe kanji e leitura.',
        pairs: [
          ['上', 'うえ', 'em cima'],
          ['下', 'した', 'embaixo'],
          ['中', 'なか', 'dentro'],
          ['外', 'そと', 'fora']
        ],
        explain: '上 うえ · 下 した · 中 なか · 外 そと.'
      },
      {
        type: 'builder',
        skill: 'building',
        vocab: ['naka', 'imasu'],
        prompt: 'Monte: “O gato está dentro da caixa.”',
        answer:
          '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。',
        distractors: ['[pred:あります]', '[part:で]', '[pos:{外|そと}]'],
        explain:
          'Gato (ser vivo) → います. Lugar de existência → に. Referência + の + posição: 箱の中.'
      },
      {
        type: 'builder',
        skill: 'building',
        vocab: ['ushiro'],
        prompt: 'Monte: “O gato está atrás do sofá.”',
        answer: '{猫|ねこ}は[ref:ソファ][no:の][pos:{後|うし}ろ][part:に][pred:います]。',
        distractors: ['[pos:{前|まえ}]', '[pred:あります]'],
        explain: '後ろ (うしろ) = atrás. 前 (まえ) = na frente.'
      },
      {
        type: 'builder',
        skill: 'building',
        vocab: ['ue'],
        picture: { scene: 'room', spot: 'tbl_ue' },
        prompt: 'Descreva onde está o gato destacado.',
        answer: '{猫|ねこ}は[ref:テーブル][no:の][pos:{上|うえ}][part:に][pred:います]。',
        distractors: ['[pos:{下|した}]', '[pred:あります]'],
        explain: 'O gato está sobre a mesa: テーブルの上.'
      },
      {
        type: 'find',
        scene: 'room',
        skill: 'location',
        vocab: ['soto'],
        sentence:
          '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{外|そと}][part:に][pred:います]。',
        pt: 'O gato está fora da caixa.',
        answer: 'box_soto',
        explain: '外 (そと) = fora. O gato está ao lado de fora da caixa.'
      }
    ]
  },

  // ─────────── Fase 4 ───────────
  p4_intake: {
    title: '{右|みぎ}？ {左|ひだり}？',
    stage: 'intake',
    items: [
      {
        type: 'direction',
        skill: 'relative',
        vocab: ['migi'],
        facing: 'N',
        prompt:
          'ポンゴは {北|きた}を {見|み}ています。{右|みぎ}に {曲|ま}がると、どの {方角|ほうがく}？',
        promptPt: 'Pongo olha para o norte. Virando à direita, vai para qual direção?',
        options: ['N', 'S', 'E', 'W'],
        answer: 'E',
        explain: 'Olhando para o norte, a direita aponta para o leste (東).'
      },
      {
        type: 'direction',
        skill: 'relative',
        vocab: ['migi'],
        facing: 'S',
        prompt: 'ポンゴは {南|みなみ}を {見|み}ています。{右|みぎ}に {曲|ま}がると？',
        promptPt: 'Pongo olha para o sul. Virando à direita…?',
        options: ['N', 'S', 'E', 'W'],
        answer: 'W',
        explain:
          'Olhando para o sul, a direita aponta para o oeste (西). Direção relativa depende de para onde se olha!'
      },
      {
        type: 'direction',
        skill: 'relative',
        vocab: ['hidari'],
        facing: 'E',
        prompt: 'ポンゴは {東|ひがし}を {見|み}ています。{左|ひだり}に {曲|ま}がると？',
        promptPt: 'Pongo olha para o leste. Virando à esquerda…?',
        options: ['N', 'S', 'E', 'W'],
        answer: 'N',
        explain: 'Olhando para o leste, a esquerda aponta para o norte (北).'
      },
      {
        type: 'direction',
        skill: 'relative',
        vocab: ['ushiro'],
        facing: 'W',
        prompt: 'ポンゴは {西|にし}を {見|み}ています。ポンゴの {後|うし}ろは？',
        promptPt: 'Pongo olha para o oeste. O que fica atrás dele?',
        options: ['N', 'S', 'E', 'W'],
        answer: 'E',
        explain: 'Atrás (後ろ) é sempre o oposto da frente: oeste ↔ leste.'
      },
      {
        type: 'kanji',
        skill: 'kanji',
        vocab: ['migi', 'hidari', 'mae', 'ushiro'],
        prompt: 'Associe kanji e leitura.',
        pairs: [
          ['右', 'みぎ', 'direita'],
          ['左', 'ひだり', 'esquerda'],
          ['前', 'まえ', 'frente'],
          ['後ろ', 'うしろ', 'trás']
        ],
        explain: '右 みぎ · 左 ひだり · 前 まえ · 後ろ うしろ.'
      }
    ]
  },
  p4_output: {
    title: 'ルートを つくろう',
    stage: 'output',
    items: [
      {
        type: 'route',
        mode: 'trace',
        skill: 'relative',
        vocab: ['massugu', 'migi', 'hidari'],
        grid: { cols: 4, rows: 3 },
        start: { c: 0, r: 2, facing: 'N' },
        instructions: ['straight', 'right', 'straight', 'left'],
        landmarks: [
          { c: 2, r: 0, label: '{駅|えき}' },
          { c: 3, r: 1, label: '{銀行|ぎんこう}' },
          { c: 1, r: 0, label: '{病院|びょういん}' }
        ],
        prompt: 'Siga as instruções e toque no ponto onde Pongo chega.',
        explain:
          'まっすぐ (norte) → 右 (vira para o leste) → まっすぐ (leste) → 左 (vira para o norte).'
      },
      {
        type: 'route',
        mode: 'build',
        skill: 'relative',
        vocab: ['massugu', 'migi', 'hidari'],
        grid: { cols: 4, rows: 3 },
        start: { c: 3, r: 2, facing: 'W' },
        goal: { c: 0, r: 0 },
        landmarks: [{ c: 0, r: 0, label: '{公園|こうえん}' }],
        prompt: 'Monte uma rota até o 公園. Pongo começa olhando para o oeste (西).',
        explain:
          'Lembre: cada instrução gira (se for 右/左) e avança um quarteirão. Várias rotas são válidas.'
      },
      {
        type: 'choice',
        skill: 'relative',
        vocab: ['migigawa'],
        prompt: 'ドアは {廊下|ろうか}の {右側|みぎがわ}に あります。',
        promptPt:
          'Pongo anda pelo corredor rumo ao SUL. A porta do lado direito fica em que direção cardeal?',
        options: [{ jp: '{西|にし}' }, { jp: '{東|ひがし}' }, { jp: '{北|きた}' }],
        answer: 0,
        explain: 'Andando para o sul, o lado direito (右側) fica a oeste (西).'
      },
      {
        type: 'builder',
        skill: 'building',
        vocab: ['hidari', 'magarimasu'],
        prompt: 'Monte: “Vire à esquerda, por favor.”',
        answer: '[pos:{左|ひだり}][part:に][pred:{曲|ま}がってください]。',
        distractors: ['[pos:{右|みぎ}]', '[part:で]'],
        explain:
          '左に曲がってください: 左 (esquerda) + に (direção da curva) + 曲がってください.'
      }
    ]
  },

  // ─────────── Fase 5 — まよいネコ ───────────
  p5_boss: {
    title: 'まよいネコとの しょうぶ',
    stage: 'output',
    boss: true,
    items: [
      {
        type: 'particle',
        skill: 'particles',
        vocab: ['higashi'],
        sentence: '{東|ひがし}＿{行|い}ってください。',
        pt: 'Vá para o leste, por favor.',
        options: ['の', 'で', 'へ'],
        answer: 'へ',
        explain: 'へ marca a direção do movimento.'
      },
      {
        type: 'direction',
        skill: 'relative',
        vocab: ['migi'],
        facing: 'W',
        prompt:
          'ポンゴは {西|にし}を {見|み}ています。{右|みぎ}は どの {方角|ほうがく}？',
        promptPt: 'Pongo olha para o oeste. A direita dele é qual direção?',
        options: ['N', 'S', 'E', 'W'],
        answer: 'N',
        explain: 'Olhando para o oeste, a mão direita aponta para o norte.'
      },
      {
        type: 'choice',
        skill: 'existence',
        vocab: ['imasu'],
        prompt: 'まよいネコは {広場|ひろば}に ＿＿。',
        promptPt: 'O Mayoi Neko está na praça.',
        options: [{ jp: 'います' }, { jp: 'あります' }],
        answer: 0,
        explain: 'まよいネコ é um gato (ser vivo) → います.'
      },
      {
        type: 'map',
        mode: 'click',
        skill: 'location',
        vocab: ['tonari', 'chikaku'],
        question:
          'コンビニは[ref:{駅|えき}][no:の][pos:{近|ちか}く]です。[ref:{郵便局|ゆうびんきょく}][no:の][pos:{隣|となり}]です。コンビニは どれ？',
        questionPt: 'A コンビニ fica perto da estação e ao lado do correio. Qual é?',
        labels: ['station', 'post', 'bank', 'school'],
        answer: 'konbini',
        explain:
          'Perto da estação há vários prédios, mas só um é vizinho do correio do outro lado.'
      },
      {
        type: 'route',
        mode: 'trace',
        skill: 'relative',
        vocab: ['migi', 'hidari'],
        grid: { cols: 4, rows: 3 },
        start: { c: 3, r: 0, facing: 'S' },
        instructions: ['straight', 'right', 'straight', 'left'],
        landmarks: [{ c: 1, r: 2, label: '{家|いえ}' }],
        prompt: 'Pongo começa olhando para o SUL. Onde ele chega?',
        explain:
          'Olhando para o sul: まっすぐ (sul) → 右 (vira para o oeste) → まっすぐ (oeste) → 左 (vira para o sul).'
      },
      {
        type: 'builder',
        skill: 'building',
        vocab: ['kita', 'eki'],
        prompt: 'Monte: “A estação fica ao norte da praça.”',
        answer:
          '{駅|えき}は[ref:{広場|ひろば}][no:の][pos:{北|きた}][part:に][pred:あります]。',
        distractors: ['[pos:{南|みなみ}]', '[pred:います]', '[part:で]'],
        explain: 'Estação (lugar) → あります; 広場の北 = ao norte da praça.'
      }
    ]
  }
}
