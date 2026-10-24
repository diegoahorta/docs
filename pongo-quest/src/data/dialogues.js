// Roteiros de diálogo. Cada fala tem um objetivo comunicativo.
// Campos: s (falante), jp (marcação com furigana/chunks), pt (tradução),
// choices [{jp|pt, ok, fb, next}], teach [vocab], item, label, goto, end.
// Escolhas erradas sem `next` mostram o feedback e repetem a pergunta.

export const DIALOGUES = {
  // ═════════ FASE 1 — A BÚSSOLA PERDIDA ═════════
  p1_intro: [
    {
      s: 'obaasan',
      jp: 'あら、こんにちは！ あなたは だれ？',
      pt: 'Ah, olá! Quem é você?'
    },
    { s: 'pongo', jp: 'こんにちは！ ポンゴです。', pt: 'Olá! Sou o Pongo.' },
    {
      s: 'obaasan',
      jp: 'ポンゴさん、たいへんなの。まよいネコが {町|まち}の {方向|ほうこう}を まぜて しまったの。',
      pt: 'Pongo, que problema! O Mayoi Neko embaralhou as direções da cidade.'
    },
    {
      s: 'obaasan',
      jp: 'わたしの コンパスも こわれて しまったわ。どうぞ。',
      pt: 'Até a minha bússola quebrou. Tome.',
      item: 'compass_broken'
    },
    {
      s: 'obaasan',
      jp: '{太陽|たいよう}は [pos:{東|ひがし}]から のぼります。{月|つき}は [pos:{西|にし}]に しずみます。',
      pt: 'O sol nasce no leste (東). A lua se põe no oeste (西).'
    },
    {
      s: 'obaasan',
      jp: '{北|きた}・{南|みなみ}・{東|ひがし}・{西|にし}。この {四|よっ}つが {方角|ほうがく}です。',
      pt: 'Norte, sul, leste, oeste. Estes quatro são os pontos cardeais.',
      teach: ['kita', 'minami', 'higashi', 'nishi']
    },
    {
      s: 'obaasan',
      jp: '{地図|ちず}では、{上|うえ}が {北|きた}です。',
      pt: 'No mapa, para cima é o norte.'
    },
    {
      s: 'obaasan',
      jp: '{広場|ひろば}に コンパスの かけらが {四|よっ}つ あります。わたしが {言|い}う {方向|ほうこう}へ {行|い}って ください。',
      pt: 'Há quatro pedaços da bússola na praça. Vá na direção que eu disser.',
      teach: ['ikimasu']
    },
    {
      s: 'obaasan',
      jp: '「[pos:{北|きた}][part:へ][pred:{行|い}きます]」の「へ」は なに？',
      pt: 'No “北へ行きます”, o que é o へ?',
      skill: 'particles',
      vocab: ['ikimasu'],
      choices: [
        {
          pt: 'Marca a direção do movimento (rumo a…)',
          ok: true,
          fb: 'Isso! へ (lido “e”) indica para onde o movimento vai.'
        },
        {
          pt: 'Marca o lugar onde a ação acontece',
          ok: false,
          fb: 'Esse é o papel de で (ex.: 公園で遊びます). へ indica direção.'
        },
        {
          pt: 'Liga duas palavras (“de”)',
          ok: false,
          fb: 'Esse é o の (ex.: はこの中). へ indica direção do movimento.'
        }
      ]
    },
    {
      s: 'obaasan',
      jp: 'じゃあ、[pos:{北|きた}][part:へ][pred:{行|い}って ください]！ {北|きた}は {地図|ちず}の {上|うえ}よ。',
      pt: 'Então, vá para o norte, por favor! O norte é para cima no mapa.'
    }
  ],
  p1_final: [
    {
      s: 'obaasan',
      jp: 'すごい！ かけらが ぜんぶ そろいました。',
      pt: 'Incrível! Você juntou todos os pedaços.'
    },
    {
      s: 'obaasan',
      jp: 'さいごの テストです。わたしの ことばだけを {聞|き}いて、{歩|ある}いて ください。',
      pt: 'Último teste: ouça só as minhas palavras e caminhe.'
    },
    {
      s: 'obaasan',
      jp: 'ヒントは コンパスに ありますよ。',
      pt: 'A dica está na bússola.'
    }
  ],
  p1_end: [
    {
      s: 'obaasan',
      jp: 'よく できました！ コンパスが なおりました！',
      pt: 'Muito bem! A bússola está consertada!',
      item: 'compass'
    },
    {
      s: 'obaasan',
      jp: 'コンパスの {内側|うちがわ}には、あなたの {前|まえ}・{右|みぎ}・{後|うし}ろ・{左|ひだり}が {出|で}ます。',
      pt: 'No anel interno da bússola aparecem a sua frente, direita, trás e esquerda.'
    },
    {
      s: 'obaasan',
      jp: 'つぎは リサさんを {手伝|てつだ}って あげて。{広場|ひろば}の {北|きた}の ほうに います。',
      pt: 'Agora ajude a Lisa. Ela está no lado norte da praça.'
    }
  ],

  // ═════════ FASE 2 — ONDE FICA A ESTAÇÃO? ═════════
  p2_intro: [
    {
      s: 'lisa',
      jp: 'すみません。[ref:{駅|えき}]は どこですか。',
      pt: 'Com licença. Onde fica a estação?'
    },
    {
      s: 'pongo',
      jp: 'えっと…わかりません。{看板|かんばん}が へんです！',
      pt: 'Hmm… não sei. As placas estão estranhas!'
    },
    {
      s: 'lisa',
      jp: 'まよいネコの しわざですね。でも、この ガイドブックに ヒントが あります。',
      pt: 'Coisa do Mayoi Neko. Mas este guia tem pistas.',
      item: 'guidebook'
    },
    {
      s: 'lisa',
      jp: '{駅|えき}は[ref:{銀行|ぎんこう}][no:の][pos:{隣|となり}][part:に][pred:あります]。',
      pt: 'A estação fica ao lado do banco.',
      teach: ['eki', 'ginkou', 'tonari', 'arimasu']
    },
    {
      s: 'lisa',
      jp: '{建物|たてもの}や {物|もの}が ある ときは「あります」を つかいます。',
      pt: 'Para prédios e objetos, usamos あります.'
    },
    {
      s: 'lisa',
      jp: '「{銀行|ぎんこう}の {隣|となり}」は どこ？',
      pt: 'Onde é “銀行の隣”?',
      skill: 'location',
      vocab: ['tonari'],
      choices: [
        {
          pt: 'Ao lado do banco',
          ok: true,
          fb: 'Isso! 隣 (となり) = imediatamente ao lado, o vizinho.'
        },
        { pt: 'Dentro do banco', ok: false, fb: 'Dentro seria 中 (なか). 隣 = ao lado.' },
        {
          pt: 'Atrás do banco',
          ok: false,
          fb: 'Atrás seria 後ろ (うしろ). 隣 = ao lado.'
        }
      ]
    },
    {
      s: 'lisa',
      jp: '{銀行|ぎんこう}の {看板|かんばん}は だいじょうぶです。{銀行|ぎんこう}の {隣|となり}の {建物|たてもの}を しらべて ください。',
      pt: 'A placa do banco está normal. Examine o prédio ao lado do banco.'
    }
  ],
  p2_ken: [
    {
      s: 'ken',
      jp: 'やあ！ {公園|こうえん}を さがしてる？',
      pt: 'E aí! Procurando o parque?'
    },
    {
      s: 'ken',
      jp: '[pos:ここ]は {広場|ひろば}です。[pos:あそこ]を {見|み}て。',
      pt: 'Aqui é a praça. Olhe lá.',
      teach: ['koko', 'asoko']
    },
    {
      s: 'ken',
      jp: '{公園|こうえん}は[ref:{道|みち}][no:の][pos:{向|む}こう][part:に][pred:あります]。',
      pt: 'O parque fica do outro lado da rua.',
      teach: ['kouen', 'michi', 'mukou']
    },
    {
      s: 'ken',
      jp: '「{向|む}こう」は {道|みち}や {木|き}を こえた ところ です。',
      pt: '向こう = o lugar além da rua ou da árvore (o outro lado).',
      teach: ['ki']
    },
    {
      s: 'ken',
      jp: '{今|いま}、ぼくたちは {広場|ひろば}に います。{道|みち}の {向|む}こうは どっち？',
      pt: 'Estamos na praça. Para que lado fica “o outro lado da rua”?',
      skill: 'location',
      vocab: ['mukou'],
      choices: [
        {
          jp: '{東|ひがし}',
          pt: 'leste',
          ok: true,
          fb: 'Isso! A rua fica a leste da praça; atravessando, chegamos ao parque.'
        },
        {
          jp: '{西|にし}',
          pt: 'oeste',
          ok: false,
          fb: 'A oeste está a casa. A rua que separa a praça do parque fica a leste (東).'
        }
      ]
    },
    {
      s: 'ken',
      jp: '{横断歩道|おうだんほどう}を わたって、{公園|こうえん}の {看板|かんばん}を しらべて ね。',
      pt: 'Atravesse a faixa de pedestres e examine a placa do parque.'
    }
  ],
  p2_answer: [
    {
      s: 'lisa',
      jp: 'ポンゴさん！ もう いちど {聞|き}きます。[ref:{駅|えき}]は どこですか。',
      pt: 'Pongo! Vou perguntar de novo: onde fica a estação?'
    },
    {
      s: 'lisa',
      jp: '[ref:{駅|えき}]は どこですか。',
      pt: 'Onde fica a estação?',
      skill: 'building',
      vocab: ['tonari', 'arimasu'],
      choices: [
        {
          jp: '{銀行|ぎんこう}の {隣|となり}に あります。',
          pt: 'Fica ao lado do banco.',
          ok: true,
          fb: 'Perfeito! Estação = lugar → あります. 銀行の隣 = ao lado do banco.'
        },
        {
          jp: '{銀行|ぎんこう}の {隣|となり}に います。',
          pt: '(います)',
          ok: false,
          fb: 'Quase! A estação não é um ser vivo: use あります, não います.'
        },
        {
          jp: '{隣|となり}の {銀行|ぎんこう}に あります。',
          pt: '(ordem trocada)',
          ok: false,
          fb: 'Ordem trocada! Em A の B, a referência vem primeiro: 銀行の隣.'
        },
        {
          jp: '{銀行|ぎんこう}の {中|なか}に あります。',
          pt: '(dentro do banco)',
          ok: false,
          fb: '中 = dentro. A estação fica ao lado (隣) do banco, não dentro.'
        }
      ]
    },
    {
      s: 'lisa',
      jp: 'ありがとうございます！ たすかりました！',
      pt: 'Muito obrigada! Você me salvou!'
    },
    {
      s: 'lisa',
      jp: 'あ、ユキさんが こまって いました。{家|いえ}の {近|ちか}くに います。{広場|ひろば}の {西|にし}です。',
      pt: 'Ah, a Yuki estava com problemas. Ela está perto da casa, a oeste da praça.'
    }
  ],

  // ═════════ FASE 3 — O GATO ESCONDIDO ═════════
  p3_intro: [
    {
      s: 'yuki',
      jp: 'ポンゴさん、たすけて！ うちの {猫|ねこ}が いません！',
      pt: 'Pongo, socorro! Meus gatos sumiram!'
    },
    {
      s: 'yuki',
      jp: 'まよいネコが {猫|ねこ}たちを かくしました。',
      pt: 'O Mayoi Neko escondeu os gatos.'
    },
    {
      s: 'yuki',
      jp: '{猫|ねこ}は いきもの です。だから「います」を つかいます。',
      pt: 'Gatos são seres vivos. Por isso usamos います.',
      teach: ['neko', 'imasu']
    },
    {
      s: 'yuki',
      jp: '{本|ほん}や {箱|はこ}は「あります」です。',
      pt: 'Livros e caixas usam あります.',
      teach: ['hako']
    },
    {
      s: 'yuki',
      jp: '{猫|ねこ}は {箱|はこ}の {中|なか}に ＿＿。',
      pt: 'O gato está dentro da caixa. Complete:',
      skill: 'existence',
      vocab: ['imasu'],
      choices: [
        { jp: 'います', ok: true, fb: 'Isso! Gato é ser vivo → います.' },
        {
          jp: 'あります',
          ok: false,
          fb: 'あります é para coisas e lugares. Gato (ser vivo) → います.'
        }
      ]
    },
    {
      s: 'yuki',
      jp: '{上|うえ}・{下|した}・{中|なか}・{外|そと}・{前|まえ}・{後|うし}ろ・そば。よく {読|よ}んでね。',
      pt: 'Em cima, embaixo, dentro, fora, frente, atrás, junto. Leia com atenção.',
      teach: ['ue', 'shita', 'naka', 'soto', 'mae', 'ushiro', 'soba']
    },
    {
      s: 'yuki',
      jp: 'この メモを どうぞ。{家|いえ}の {中|なか}に {四|よん}ひき、{外|そと}に {一|いっ}ぴき います。',
      pt: 'Tome esta lista. Há quatro gatos dentro de casa e um fora.',
      item: 'cat_list',
      teach: ['ie', 'kuruma']
    }
  ],
  p3_end: [
    {
      s: 'yuki',
      jp: 'みんな いました！ ほんとうに ありがとう！',
      pt: 'Estão todos aqui! Muito obrigada mesmo!'
    },
    {
      s: 'yuki',
      jp: '{猫|ねこ}は [ref:ポンゴさん][no:の][pos:そば][part:に][pred:います]ね。ふふ。',
      pt: 'Os gatos estão bem juntinhos de você, hehe.'
    },
    {
      s: 'yuki',
      jp: '{南|みなみ}の {迷路|めいろ}に ロボットの ミチが います。{行|い}って みて！',
      pt: 'No labirinto ao sul está o robô Michi. Vá até lá!'
    }
  ],

  // ═════════ FASE 4 — O LABIRINTO DAS DIREÇÕES ═════════
  p4_intro: [
    {
      s: 'michi',
      jp: 'ピピッ！ ワタシは みちあんない ロボット、ミチです。',
      pt: 'Bip! Sou Michi, robô guia de caminhos.'
    },
    {
      s: 'michi',
      jp: 'この {迷路|めいろ}では「{右|みぎ}」と「{左|ひだり}」が だいじです。',
      pt: 'Neste labirinto, “direita” e “esquerda” são essenciais.',
      teach: ['migi', 'hidari']
    },
    {
      s: 'michi',
      jp: '[pos:{右|みぎ}][part:に][pred:{曲|ま}がってください]。[pos:まっすぐ][pred:{行|い}ってください]。',
      pt: 'Vire à direita, por favor. Siga em frente, por favor.',
      teach: ['massugu', 'magarimasu']
    },
    {
      s: 'michi',
      jp: 'ちゅうい！ {右|みぎ}と {左|ひだり}は、あなたが {見|み}ている {方向|ほうこう}で かわります。',
      pt: 'Atenção! Direita e esquerda mudam conforme a direção para onde você olha.'
    },
    {
      s: 'michi',
      jp: '{北|きた}を {見|み}ている とき、{右|みぎ}は {東|ひがし}。では、{南|みなみ}を {見|み}ている とき、{右|みぎ}は？',
      pt: 'Olhando para o norte, a direita é o leste. E olhando para o sul, a direita é…?',
      skill: 'relative',
      vocab: ['migi'],
      choices: [
        {
          jp: '{西|にし}',
          pt: 'oeste',
          ok: true,
          fb: 'Isso! Virado para o sul, sua mão direita aponta para o oeste.'
        },
        {
          jp: '{東|ひがし}',
          pt: 'leste',
          ok: false,
          fb: 'Imagine seu corpo virado para o sul (para baixo no mapa): a mão direita aponta para o oeste (西).'
        }
      ]
    },
    {
      s: 'michi',
      jp: '{右側|みぎがわ}は {右|みぎ}の ほう、{左側|ひだりがわ}は {左|ひだり}の ほう です。ドアを えらぶ とき つかいます。',
      pt: '右側 = lado direito, 左側 = lado esquerdo. Você vai usar ao escolher portas.',
      teach: ['migigawa', 'hidarigawa']
    },
    {
      s: 'michi',
      jp: 'コンパスの {内側|うちがわ}を {見|み}て ください。{前|まえ}・{右|みぎ}・{後|うし}ろ・{左|ひだり}が {回|まわ}ります。',
      pt: 'Veja o anel interno da bússola: frente/direita/trás/esquerda giram com você.'
    }
  ],
  p4_maze1: [
    {
      s: 'michi',
      jp: 'ラウンド１！ スタートでは {北|きた}を {見|み}ています。',
      pt: 'Rodada 1! Na largada você está olhando para o norte.'
    },
    {
      s: 'michi',
      jp: '{交差点|こうさてん}ごとに ワタシの しじを {聞|き}いて ください。',
      pt: 'Em cada cruzamento, ouça minha instrução.'
    }
  ],
  p4_maze2: [
    {
      s: 'michi',
      jp: 'ラウンド２！ こんどは {南|みなみ}を {見|み}ています。',
      pt: 'Rodada 2! Agora você está olhando para o sul.'
    },
    {
      s: 'michi',
      jp: '{右|みぎ}と {左|ひだり}が さっきと ぎゃくに なりますよ！',
      pt: 'Direita e esquerda ficam invertidas em relação ao mapa!'
    }
  ],
  p4_end: [
    {
      s: 'michi',
      jp: 'ピピピッ！ すばらしい！ あなたは {方向|ほうこう}マスター です！',
      pt: 'Bip-bip! Incrível! Você é um mestre das direções!',
      item: 'maze_badge'
    },
    {
      s: 'michi',
      jp: 'あれ？ {広場|ひろば}で だれかが よんで います…。',
      pt: 'Ué? Alguém está chamando na praça…'
    }
  ],

  // ═════════ FASE 5 — O MAPA MISTERIOSO ═════════
  p5_mayoi: [
    {
      s: 'mayoi',
      jp: 'にゃはは！ ワガハイは まよいネコ！',
      pt: 'Nyahaha! Eu sou o Mayoi Neko!'
    },
    {
      s: 'pongo',
      jp: 'あなたが {町|まち}を まぜたの？',
      pt: 'Foi você que embaralhou a cidade?'
    },
    {
      s: 'mayoi',
      jp: 'そうにゃ。この ふしぎな {地図|ちず}が とけたら、{町|まち}を もとに もどすにゃ。',
      pt: 'Sim, nya. Se você decifrar este mapa misterioso, eu devolvo a cidade.',
      item: 'mystery_map'
    },
    {
      s: 'mayoi',
      jp: '{五|いつ}つの ばしょを みつけて、ことばで せつめいするにゃ！',
      pt: 'Encontre cinco lugares e descreva-os com palavras, nya!',
      teach: ['toshokan', 'konohen']
    },
    { s: 'pongo', jp: 'まけないよ！', pt: 'Não vou perder!' }
  ],
  p5_boss_intro: [
    {
      s: 'mayoi',
      jp: 'もう {五|いつ}つ みつけたにゃ？ じゃあ、さいごの しょうぶにゃ！',
      pt: 'Já achou os cinco, nya? Então, o desafio final!'
    },
    {
      s: 'mayoi',
      jp: 'ワガハイの まよいメーターを ゼロに できるかにゃ？',
      pt: 'Consegue zerar meu medidor de confusão, nya?'
    }
  ],
  p5_end: [
    { s: 'mayoi', jp: 'にゃ…ワガハイの まけにゃ。', pt: 'Nya… eu perdi.' },
    {
      s: 'mayoi',
      jp: 'ほんとうは…ワガハイも みちに まよって いたにゃ。だれも {教|おし}えて くれなかったにゃ。',
      pt: 'Na verdade… eu também vivia perdido. Ninguém me ensinava, nya.'
    },
    {
      s: 'pongo',
      jp: 'じゃあ、いっしょに {勉強|べんきょう}しよう！',
      pt: 'Então vamos estudar juntos!'
    },
    {
      s: 'mayoi',
      jp: 'ありがとうにゃ、ポンゴ！ {看板|かんばん}を ぜんぶ もとに もどすにゃ！',
      pt: 'Obrigado, Pongo! Vou consertar todas as placas, nya!'
    }
  ],

  // ═════════ NPCs fora de missão / prática livre ═════════
  idle_obaasan: [
    {
      s: 'obaasan',
      jp: '{太陽|たいよう}は {東|ひがし}から のぼりますよ。',
      pt: 'O sol nasce no leste.'
    }
  ],
  idle_lisa: [
    {
      s: 'lisa',
      jp: '{駅|えき}は {銀行|ぎんこう}の {隣|となり}です。おぼえました！',
      pt: 'A estação fica ao lado do banco. Decorei!'
    }
  ],
  idle_ken: [
    {
      s: 'ken',
      jp: '{公園|こうえん}で {遊|あそ}びます！ 「で」は {動作|どうさ}の ばしょ だよ。',
      pt: 'Vou brincar no parque! で marca o lugar da ação.'
    }
  ],
  idle_yuki: [
    {
      s: 'yuki',
      jp: '{猫|ねこ}は いつも どこかに います。',
      pt: 'Os gatos sempre estão em algum lugar.'
    }
  ],
  idle_michi: [
    {
      s: 'michi',
      jp: 'ピピッ。{右|みぎ}は いつも あなたの {右手|みぎて}の ほう です。',
      pt: 'Bip. A direita é sempre o lado da sua mão direita.'
    }
  ],
  idle_sensei: [
    {
      s: 'sensei',
      jp: 'わたしは {学校|がっこう}の {前|まえ}に います。{人|ひと}だから「います」ですね。',
      pt: 'Estou na frente da escola. Sou uma pessoa, então います.'
    }
  ],
  idle_mayoi: [
    {
      s: 'mayoi',
      jp: 'にゃー。こんどは ワガハイが みちあんない するにゃ。',
      pt: 'Nyaa. Agora sou eu quem guia o caminho, nya.'
    }
  ],
  satou_hello: [
    {
      s: 'satou',
      jp: 'いらっしゃいませ。ここは {図書館|としょかん}です。',
      pt: 'Bem-vindo. Aqui é a biblioteca.'
    },
    {
      s: 'satou',
      jp: '{本|ほん}は [ref:{机|つくえ}][no:の][pos:{上|うえ}][part:に][pred:あります]。',
      pt: 'O livro está sobre a mesa.'
    },
    {
      s: 'satou',
      jp: 'ここで ふくしゅうが できますよ。',
      pt: 'Aqui você pode fazer revisão.'
    }
  ]
}
