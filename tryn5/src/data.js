// Banco de questões — gramática JLPT N5.
// q: frase com （　） no lugar da lacuna · o: opções (a primeira é a correta)
// pt: tradução · why: explicação curta
window.N5_STAGES = [
  {
    id: 'p1', title: 'Partículas I', sub: 'は・が・を・の・も', icon: '🌸',
    qs: [
      { q: 'わたし（　）がくせいです。', o: ['は', 'を', 'に', 'で'], pt: 'Eu sou estudante.', why: 'は marca o tema da frase: “quanto a mim…”.' },
      { q: 'これは わたし（　）ほんです。', o: ['の', 'は', 'を', 'に'], pt: 'Este é o meu livro.', why: 'の liga dois substantivos e indica posse: わたしの本 = meu livro.' },
      { q: '毎朝（まいあさ） コーヒー（　）飲みます。', o: ['を', 'が', 'に', 'へ'], pt: 'Bebo café toda manhã.', why: 'を marca o objeto direto do verbo (飲みます).' },
      { q: '田中さんは 先生です。山田さん（　）先生です。', o: ['も', 'は', 'の', 'を'], pt: 'O Tanaka é professor. O Yamada também é professor.', why: 'も = “também”; substitui は quando a informação se repete.' },
      { q: 'あそこに ねこ（　）います。', o: ['が', 'を', 'で', 'の'], pt: 'Tem um gato ali.', why: 'Com います/あります (existência), quem existe é marcado com が.' },
      { q: 'だれ（　）来ましたか。', o: ['が', 'は', 'を', 'も'], pt: 'Quem veio?', why: 'Palavra interrogativa como sujeito leva が, nunca は.' },
      { q: 'わたしは すし（　）好きです。', o: ['が', 'を', 'に', 'で'], pt: 'Eu gosto de sushi.', why: '好き・きらい・じょうず・わかる usam が para o objeto.' },
    ],
  },
  {
    id: 'p2', title: 'Partículas II', sub: 'に・で・へ・と・から・まで', icon: '🗺️',
    qs: [
      { q: '7時（しちじ）（　）起きます。', o: ['に', 'で', 'を', 'へ'], pt: 'Acordo às 7 horas.', why: 'Horário específico leva に.' },
      { q: '図書館（としょかん）（　）べんきょうします。', o: ['で', 'に', 'を', 'へ'], pt: 'Estudo na biblioteca.', why: 'で marca o lugar onde uma ação acontece.' },
      { q: '来週（らいしゅう） 日本（　）行きます。', o: ['へ', 'を', 'で', 'と'], pt: 'Semana que vem vou ao Japão.', why: 'へ (ou に) indica a direção/destino de verbos de movimento.' },
      { q: '友だち（　）えいがを 見ました。', o: ['と', 'を', 'へ', 'が'], pt: 'Vi um filme com um amigo.', why: 'と = “com (alguém)”.' },
      { q: '銀行（ぎんこう）は 9時（　）3時までです。', o: ['から', 'まで', 'に', 'で'], pt: 'O banco funciona das 9 às 3.', why: '〜から〜まで = “de… até…”.' },
      { q: 'はし（　）ごはんを 食べます。', o: ['で', 'を', 'に', 'と'], pt: 'Como arroz com hashi.', why: 'で também indica o meio/instrumento.' },
      { q: 'つくえの 上（　）本が あります。', o: ['に', 'で', 'を', 'へ'], pt: 'Há um livro em cima da mesa.', why: 'Lugar de existência (あります/います) leva に, não で.' },
    ],
  },
  {
    id: 'v1', title: 'Verbos ます', sub: 'presente・passado・convite', icon: '⏳',
    qs: [
      { q: 'きのう テレビを（　）。', o: ['見ました', '見ます', '見ません', '見ましょう'], pt: 'Ontem assisti TV.', why: 'きのう (ontem) pede o passado: 〜ました.' },
      { q: 'あした 学校へ（　）。', o: ['行きます', '行きました', '行きませんでした', '行った'], pt: 'Amanhã vou à escola.', why: 'Futuro em japonês usa a forma 〜ます (não-passado).' },
      { q: '先週（せんしゅう）は いそがしかったです。だから、パーティーに（　）。', o: ['行きませんでした', '行きません', '行きました', '行きましょう'], pt: 'Semana passada eu estava ocupado. Por isso não fui à festa.', why: 'Passado negativo: 〜ませんでした.' },
      { q: 'いっしょに 昼（ひる）ごはんを（　）か。', o: ['食べません', '食べました', '食べない', '食べて'], pt: 'Não quer almoçar comigo?', why: '〜ませんか é um convite educado.' },
      { q: 'つかれましたね。ちょっと（　）。', o: ['休みましょう', '休みました', '休みません', '休む'], pt: 'Cansamos, né? Vamos descansar um pouco.', why: '〜ましょう = “vamos…”.' },
      { q: '今朝（けさ） 何を 食べましたか。…パンを（　）。', o: ['食べました', '食べます', '食べません', '食べましょう'], pt: 'O que você comeu hoje de manhã? …Comi pão.', why: 'Responda no mesmo tempo da pergunta: passado.' },
    ],
  },
  {
    id: 'a1', title: 'Adjetivos', sub: 'い・な', icon: '🎨',
    qs: [
      { q: 'この へやは あまり（　）。', o: ['ひろくないです', 'ひろいです', 'ひろいじゃありません', 'ひろくです'], pt: 'Este quarto não é muito espaçoso.', why: 'あまり pede negativa. Adjetivo い: troque い por くない.' },
      { q: '田中さんは（　）人です。', o: ['しんせつな', 'しんせつ', 'しんせつの', 'しんせつい'], pt: 'O Tanaka é uma pessoa gentil.', why: 'Adjetivo な antes de substantivo leva な.' },
      { q: 'きのうの テストは（　）。', o: ['むずかしかったです', 'むずかしいでした', 'むずかしくでした', 'むずかしいだった'], pt: 'A prova de ontem foi difícil.', why: 'Passado de adjetivo い: troque い por かった + です.' },
      { q: 'ここは（　）、きれいな 町です。', o: ['しずかで', 'しずかくて', 'しずかな', 'しずかに'], pt: 'Aqui é uma cidade tranquila e bonita.', why: 'Para ligar adjetivos な use で (しずかで…).' },
      { q: 'この りんごは 安くて（　）です。', o: ['おいしい', 'おいしいな', 'おいしく', 'おいしかっ'], pt: 'Esta maçã é barata e gostosa.', why: 'Adjetivo い vai direto antes de です.' },
      { q: 'きのうは 天気（てんき）が（　）。', o: ['よかったです', 'いかったです', 'いいでした', 'よいだった'], pt: 'Ontem o tempo estava bom.', why: 'いい é irregular: o passado é よかった.' },
      { q: 'この 町は 前は（　）。', o: ['にぎやかでした', 'にぎやかかったです', 'にぎやかだでした', 'にぎやかくなかった'], pt: 'Esta cidade antes era movimentada.', why: 'Passado de adjetivo な: 〜でした.' },
    ],
  },
  {
    id: 't1', title: 'Forma て', sub: 'ください・います・もいい・はいけない', icon: '🔗',
    qs: [
      { q: 'ここに 名前（なまえ）を（　）ください。', o: ['書いて', '書きて', '書くて', '書いた'], pt: 'Escreva seu nome aqui, por favor.', why: 'Verbos em く → いて: 書く → 書いて.' },
      { q: '今 ごはんを（　）います。', o: ['食べて', '食べた', '食べる', '食べ'], pt: 'Agora estou comendo.', why: '〜ています = ação em andamento.' },
      { q: '写真（しゃしん）を（　）も いいですか。', o: ['とって', 'とりて', 'とった', 'とる'], pt: 'Posso tirar uma foto?', why: '〜てもいいですか = pedir permissão. る(grupo 1) → って.' },
      { q: 'ここは きんえんです。たばこを すって（　）。', o: ['はいけません', 'もいいです', 'ください', 'います'], pt: 'Aqui é proibido fumar. Não pode fumar.', why: '〜てはいけません = proibição.' },
      { q: '兄（あに）は 東京に（　）います。', o: ['住んで', '住みて', '住って', '住むで'], pt: 'Meu irmão mais velho mora em Tóquio.', why: 'む → んで: 住む → 住んで. 住んでいます = morar (estado).' },
      { q: '朝 シャワーを（　）、学校へ 行きます。', o: ['あびて', 'あびって', 'あびた', 'あびる'], pt: 'De manhã tomo banho e vou à escola.', why: 'A forma て liga ações em sequência. Grupo 2: tire る, ponha て.' },
      { q: 'ちょっと（　）ください。', o: ['待って', '待ちて', '待て', '待った'], pt: 'Espere um pouco, por favor.', why: 'つ → って: 待つ → 待って.' },
    ],
  },
  {
    id: 'n1', title: 'Formas ない・た', sub: 'ないで・たことがある・たい', icon: '🧭',
    qs: [
      { q: 'ここで 写真を（　）ください。', o: ['とらないで', 'とらなくて', 'とりないで', 'とるないで'], pt: 'Não tire fotos aqui, por favor.', why: '〜ないでください = pedido para não fazer algo.' },
      { q: '富士山（ふじさん）に（　）ことが あります。', o: ['のぼった', 'のぼって', 'のぼる', 'のぼり'], pt: 'Já subi o Monte Fuji.', why: 'Forma た + ことがあります = experiência (“já fiz”).' },
      { q: '日本へ（　）たいです。', o: ['行き', '行く', '行って', '行った'], pt: 'Quero ir ao Japão.', why: '〜たい junta-se à raiz da forma ます: 行きます → 行きたい.' },
      { q: '冬休（ふゆやす）みに 何が（　）か。', o: ['したいです', 'しますたい', 'したくです', 'するたい'], pt: 'O que você quer fazer nas férias de inverno?', why: 'します → したい + です.' },
      { q: 'かぜですから、きょうは おふろに（　）ください。', o: ['はいらないで', 'はいらなくて', 'はいりないで', 'はいるないで'], pt: 'Como você está resfriado, não tome banho de ofurô hoje.', why: '入る é grupo 1: はいる → はいらない.' },
      { q: 'まだ すしを（　）ことが ありません。', o: ['食べた', '食べて', '食べる', '食べない'], pt: 'Ainda nunca comi sushi.', why: '〜たことがありません = “nunca fiz”.' },
    ],
  },
  {
    id: 'c1', title: 'Ligando frases', sub: 'から・が・前に・あとで・とき・ながら', icon: '🌉',
    qs: [
      { q: '雨（あめ）が ふっています（　）、かさを もって 行きます。', o: ['から', 'が', 'と', 'まで'], pt: 'Como está chovendo, vou levar guarda-chuva.', why: 'から = “porque / como” (motivo).' },
      { q: 'この 店は 安いです（　）、おいしくないです。', o: ['が', 'から', 'と', 'を'], pt: 'Esta loja é barata, mas não é gostosa.', why: 'が entre frases = “mas”.' },
      { q: 'ねる（　）、はを みがきます。', o: ['まえに', 'あとで', 'ながら', 'でも'], pt: 'Escovo os dentes antes de dormir.', why: 'Forma de dicionário + まえに = “antes de”.' },
      { q: 'しごとが 終（お）わった（　）、飲みに 行きましょう。', o: ['あとで', 'まえに', 'ながら', 'でも'], pt: 'Depois que o trabalho acabar, vamos beber.', why: 'Forma た + あとで = “depois de”.' },
      { q: '音楽（おんがく）を（　）ながら、べんきょうします。', o: ['聞き', '聞いて', '聞く', '聞いた'], pt: 'Estudo ouvindo música.', why: 'Raiz da forma ます + ながら = duas ações ao mesmo tempo.' },
      { q: 'ひまな（　）、本を 読みます。', o: ['とき', 'まえに', 'ながら', 'あとで'], pt: 'Quando estou livre, leio livros.', why: 'Adjetivo な + な + とき = “quando”.' },
    ],
  },
  {
    id: 'e1', title: 'Existência e comparação', sub: 'ある・いる・より・ほう・いちばん', icon: '⚖️',
    qs: [
      { q: '教室（きょうしつ）に 学生が 3人（　）。', o: ['います', 'あります', 'です', 'いります'], pt: 'Há 3 alunos na sala.', why: 'Seres vivos (pessoas, animais) usam います.' },
      { q: 'つくえの 上に かぎが（　）。', o: ['あります', 'います', 'です', 'なります'], pt: 'Há uma chave em cima da mesa.', why: 'Coisas e objetos usam あります.' },
      { q: '東京は 大阪（おおさか）（　）大きいです。', o: ['より', 'ほう', 'から', 'で'], pt: 'Tóquio é maior que Osaka.', why: 'A より B = “A é mais … que B”.' },
      { q: '犬と ねこと どちらが 好きですか。…ねこの（　）が 好きです。', o: ['ほう', 'より', 'いちばん', 'もっと'], pt: 'Gosta mais de cachorro ou gato? …Gosto mais de gato.', why: '〜のほうが = “o/a … (é mais)”, resposta a どちら.' },
      { q: 'くだもので 何が（　）好きですか。', o: ['いちばん', 'より', 'ほう', 'ずつ'], pt: 'Qual fruta você gosta mais?', why: 'いちばん = “o mais” (superlativo).' },
      { q: 'れいぞうこに 何も（　）。', o: ['ありません', 'あります', 'いません', 'です'], pt: 'Não há nada na geladeira.', why: '何も + negativa = “nada”. Objetos → ありません.' },
    ],
  },
  {
    id: 'w1', title: 'Interrogativos', sub: 'いつ・どこ・いくら・どうして', icon: '❓',
    qs: [
      { q: '誕生日（たんじょうび）は（　）ですか。…5月10日です。', o: ['いつ', 'どこ', 'だれ', 'いくら'], pt: 'Quando é seu aniversário? …Dia 10 de maio.', why: 'いつ = quando.' },
      { q: 'この かさは（　）ですか。…1,000円です。', o: ['いくら', 'いくつ', 'いつ', 'どれ'], pt: 'Quanto custa este guarda-chuva? …1.000 ienes.', why: 'いくら = quanto (preço).' },
      { q: '駅（えき）まで（　）で 行きますか。…バスで 行きます。', o: ['なん', 'どこ', 'いつ', 'だれ'], pt: 'Como (com o quê) você vai até a estação? …De ônibus.', why: '何（なん）で = “com o quê / por qual meio”.' },
      { q: 'トイレは（　）ですか。…あそこです。', o: ['どこ', 'なに', 'どれ', 'いつ'], pt: 'Onde fica o banheiro? …Ali.', why: 'どこ = onde.' },
      { q: '（　）日本語を べんきょうしていますか。…しごとで つかいますから。', o: ['どうして', 'どこで', 'いつ', 'どんな'], pt: 'Por que você estuda japonês? …Porque uso no trabalho.', why: 'どうして = por quê. A resposta termina em から.' },
      { q: 'りんごを（　）買いましたか。…3つ 買いました。', o: ['いくつ', 'いくら', 'なんじ', 'どれ'], pt: 'Quantas maçãs você comprou? …Comprei 3.', why: 'いくつ = quantos (contagem com 〜つ).' },
    ],
  },
];
