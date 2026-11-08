/* Pongo aprende 日本語 - Japanese content pack.
 * Base: aula ODU Creative "Dias da semana e movimento em japonês — tempo e
 * lugar com as partículas に e で e conectores de frases" (JLPT N5).
 * Quando, onde e como você vai: rotina semanal com tempo, destino, meio de
 * transporte, local das atividades e conectores.
 *
 * Os blocos seguem o método da aula: cada bloco já traz a sua partícula
 * (［月曜日に］＋［バスで］＋［学校に］＋［行きます］). Cores:
 *   e = tempo / conector (laranja)   s = tópico, sujeito ou objeto (azul)
 *   t = local da ação ou meio, com で (lilás)   c = destino, com に (amarelo)
 *   v = verbo / predicado (verde)
 */
(function () {
  'use strict';

  const B = (str) => str.split('|').map((p) => {
    const i = p.lastIndexOf('/');
    return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
  });
  const build = (pt, blocks, extra, tip, kind) => ({ type: 'build', joined: true, kind, pt, blocks: B(blocks), extra: B(extra), tip });
  const listen = (say, sayHint, prompt, blocks, extra, tip) => ({ type: 'listen', joined: true, say, sayHint, prompt, blocks: B(blocks), extra: B(extra), tip });
  const certa = (right, wrong, prompt, tip) => {
    const options = Math.random() < 0.5 ? [right, wrong] : [wrong, right];
    return { type: 'choice', kind: 'Erro comum', title: 'Qual frase está certa?', pic: '🔎', prompt, options, answer: options.indexOf(right), tip };
  };

  const UNITS = [
    {
      id: 1, node: 'LVL_1', place: 'Portão', color: '#2f86c9',
      title: '曜日 · Dias da semana', topic: 'Que dia é hoje? 今日は何曜日ですか',
      intro: { en: 'ワンワン！今日は何曜日ですか。', pt: 'wan wan! kyō wa nan\'yōbi desu ka · Au-au! Que dia da semana é hoje? Vamos aprender os dias!' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: dias da semana', pairs: [['月曜日', 'segunda-feira'], ['火曜日', 'terça-feira'], ['水曜日', 'quarta-feira'], ['木曜日', 'quinta-feira'], ['金曜日', 'sexta-feira']] },
        { type: 'match', prompt: 'Toque nos pares', pairs: [['土曜日', 'sábado'], ['日曜日', 'domingo'], ['今日', 'hoje'], ['明日', 'amanhã'], ['昨日', 'ontem']] },
        { type: 'choice', pic: '📅', prompt: '今日は何曜日ですか。 significa…', options: ['Que dia da semana é hoje?', 'Que horas são?', 'Aonde você vai hoje?'], answer: 0,
          tip: 'きょうは なんようびですか • kyō wa nan\'yōbi desu ka' },
        build('Hoje é sábado.', '今日は/s | 土曜日です/v', '明日は/s | 日曜日です/v',
          'きょうは どようびです • kyō wa doyōbi desu — ［今日は］＋［＿＿曜日です］'),
        { type: 'choice', pic: '🗣️', prompt: 'Em 今日は, a partícula は se pronuncia…', options: ['ha', 'wa', 'e'], answer: 1,
          tip: 'Quando é partícula, は se lê wa: きょうは (kyō wa).' },
        listen('今日は月曜日です', 'きょうは げつようびです • kyō wa getsuyōbi desu', '(Hoje é segunda-feira.)',
          '今日は/s | 月曜日です/v', '昨日は/s | 火曜日です/v', 'げつようび = segunda-feira.'),
        { type: 'choice', say: '水曜日', sayHint: 'すいようび • suiyōbi', title: 'Ouça e escolha', prompt: 'Que dia o Pongo disse?',
          options: ['木曜日', '水曜日', '金曜日'], answer: 1, tip: '水曜日 (すいようび) = quarta-feira.' },
        build('Amanhã é domingo.', '明日は/s | 日曜日です/v', '今日は/s | 月曜日です/v',
          'あしたは にちようびです • ashita wa nichiyōbi desu'),
        { type: 'choice', pic: '➡️', prompt: 'Que dia vem depois de 金曜日 (sexta)?', options: ['木曜日', '日曜日', '土曜日'], answer: 2,
          tip: '金曜日 (sexta) → 土曜日 (sábado) → 日曜日 (domingo).' },
      ],
    },
    {
      id: 2, node: 'LVL_2', place: 'Canteiro de flores', color: '#d23a4f',
      title: '行きます · Ir, vir e voltar', topic: 'Verbos de movimento 行きます・来ます・帰ります',
      intro: { en: '公園に行きます！', pt: 'kōen ni ikimasu · Vou ao parque! Hoje: ir, vir, voltar, caminhar e correr.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: verbos', pairs: [['行きます', 'ir'], ['来ます', 'vir'], ['帰ります', 'voltar (para casa)'], ['歩きます', 'caminhar'], ['走ります', 'correr']] },
        { type: 'choice', pic: '🏠', prompt: 'Um amigo vem até a SUA casa. Qual verbo?', options: ['行きます', '来ます', '帰ります'], answer: 1,
          tip: '来ます = movimento em direção ao lugar de quem fala: 友達がうちに来ます。' },
        { type: 'choice', pic: '🎒', prompt: 'A aula acabou e você volta para casa. Qual verbo?', options: ['来ます', '行きます', '帰ります'], answer: 2,
          tip: '帰ります = voltar para casa ou para o lugar de origem.' },
        { type: 'fill', sentence: 'うちに ___。 (Volto para casa.)', options: ['行きます', '帰ります', '来ます'], answer: 1,
          tip: 'うちに かえります • uchi ni kaerimasu' },
        { type: 'choice', pic: '🙅', prompt: 'Negativa de 行きます (não vou):', options: ['行きました', '行きません', '行きましょう'], answer: 1,
          tip: 'A negativa troca ます por ません: 行きます → 行きません.' },
        build('Vou à escola.', '学校に/c | 行きます/v', '学校で/t | 来ます/v',
          'がっこうに いきます • gakkō ni ikimasu — に marca o destino.'),
        listen('友達がうちに来ます', 'ともだちが うちに きます • tomodachi ga uchi ni kimasu', '(Um amigo vem à minha casa.)',
          '友達が/s | うちに/c | 来ます/v', 'うちで/t | 行きます/v', '来ます: o amigo vem até onde eu estou.'),
        build('Volto para casa.', 'うちに/c | 帰ります/v', 'うちで/t | 行きます/v', 'うちに かえります • uchi ni kaerimasu'),
        { type: 'choice', say: '走ります', sayHint: 'はしります • hashirimasu', title: 'Ouça e escolha', prompt: 'O que o Pongo disse?',
          options: ['Corro.', 'Caminho.', 'Volto para casa.'], answer: 0, tip: '走ります = correr; 歩きます = caminhar.' },
      ],
    },
    {
      id: 3, node: 'LVL_3', place: 'Lago', color: '#1cb0f6',
      title: 'に · Para onde?', topic: 'に indica o destino: どこに行きますか',
      intro: { en: 'どこに行きますか。', pt: 'doko ni ikimasu ka · Aonde você vai? A partícula に marca o destino.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: lugares', pairs: [['学校', 'escola'], ['図書館', 'biblioteca'], ['公園', 'parque'], ['うち', 'casa'], ['友達', 'amigo(a)']] },
        { type: 'choice', pic: '🎯', prompt: 'Em 学校に行きます, a partícula に indica…', options: ['o destino', 'o local da ação', 'o meio de transporte'], answer: 0,
          tip: 'Estrutura: ［Destino に］＋［verbo de movimento］.' },
        build('Vou à biblioteca.', '図書館に/c | 行きます/v', '図書館で/t | 帰ります/v', 'としょかんに いきます • toshokan ni ikimasu'),
        build('Aonde você vai?', 'どこに/c | 行きますか/v', 'どこで/t | 何を/s', 'どこに いきますか • doko ni ikimasu ka'),
        { type: 'choice', pic: '💬', prompt: 'Alguém pergunta: どこに行きますか。 Qual resposta está certa?', options: ['図書館で行きます。', '図書館に行きます。', '図書館を行きます。'], answer: 1,
          tip: 'O destino leva に: 図書館に行きます。' },
        { type: 'fill', sentence: '公園___行きます。', options: ['に', 'で', 'を'], answer: 0, tip: 'こうえんに いきます — vou ao parque.' },
        { type: 'choice', pic: '🧭', prompt: 'Em 学校へ行きます, a partícula へ se pronuncia…', options: ['he', 'e', 'ha'], answer: 1,
          tip: 'Como partícula, へ se lê e e também indica direção: がっこうへ いきます.' },
        listen('学校へ行きます', 'がっこうへ いきます • gakkō e ikimasu', '(Vou à escola.)',
          '学校へ/c | 行きます/v', '学校で/t | 来ます/v', 'へ (e) também indica direção.'),
        build('Um amigo vem à minha casa.', '友達が/s | うちに/c | 来ます/v', '友達を/s | うちで/t', 'ともだちが うちに きます • tomodachi ga uchi ni kimasu'),
      ],
    },
    {
      id: 4, node: 'LVL_4', place: 'Árvore grande', color: '#ff9600',
      title: 'に · Quando?', topic: 'に indica o momento: 月曜日に・七時に',
      intro: { en: '七時にうちに帰ります。', pt: 'shichiji ni uchi ni kaerimasu · Volto para casa às sete. に também marca o momento da ação!' },
      exercises: [
        build('Estudo na segunda-feira.', '月曜日に/e | 勉強します/v', '月曜日で/t | 明日に/e', 'げつようびに べんきょうします • getsuyōbi ni benkyō shimasu'),
        build('Volto para casa às sete horas.', '七時に/e | うちに/c | 帰ります/v', '七時で/t | うちで/t',
          'しちじに うちに かえります — ［七時に］tempo ＋［うちに］destino ＋［帰ります］.'),
        { type: 'match', prompt: 'Toque nos pares: marcadores de tempo', pairs: [['毎日', 'todos os dias'], ['毎週', 'toda semana'], ['今週', 'esta semana'], ['来週', 'semana que vem'], ['七時', 'sete horas']] },
        { type: 'choice', pic: '⏰', prompt: 'Qual destas expressões NÃO costuma receber に?', options: ['七時', '明日', '月曜日'], answer: 1,
          tip: 'Tempos relativos (今日、明日、昨日、毎日、毎週…) ficam sem に. Horários levam に; dias da semana podem levar.' },
        certa('明日、学校に行きます。', '明日に学校に行きます。', 'Amanhã, vou à escola.', '明日 normalmente não recebe に.'),
        certa('毎日、走ります。', '毎日に走ります。', 'Corro todos os dias.', '毎日 normalmente não recebe に.'),
        { type: 'fill', sentence: '七時___うちに帰ります。', options: ['に', 'で', 'は'], answer: 0, tip: 'Horário específico leva に: しちじに.' },
        listen('毎日、日本語を勉強します', 'まいにち、にほんごを べんきょうします • mainichi, nihongo o benkyō shimasu', '(Estudo japonês todos os dias.)',
          '毎日、/e | 日本語を/s | 勉強します/v', '毎日に/e | 日本語で/t', '毎日 vem sem に; を (o) marca o que é estudado.'),
        { type: 'choice', pic: '📌', prompt: 'Em 月曜日は学校に行きます, o は…', options: ['apresenta a segunda-feira como assunto (pode sugerir contraste)', 'marca o destino', 'marca o horário exato'], answer: 0,
          tip: '月曜日は = "na segunda-feira (diferente de outros dias)…".' },
      ],
    },
    {
      id: 5, node: 'LVL_5', place: 'Casinha do Pongo', color: '#8e44ad',
      title: 'で · Onde acontece?', topic: 'で indica o local da ação: 学校で勉強します',
      intro: { en: '公園で走ります！', pt: 'kōen de hashirimasu · Corro no parque! で marca o lugar onde a ação acontece.' },
      exercises: [
        build('Estudo na escola.', '学校で/t | 勉強します/v', '学校に/c | 行きます/v', 'がっこうで べんきょうします • gakkō de benkyō shimasu'),
        build('Corro no parque.', '公園で/t | 走ります/v', '公園に/c | 来ます/v', 'こうえんで はしります • kōen de hashirimasu'),
        { type: 'fill', sentence: 'うち___日本語を勉強します。', options: ['に', 'で', 'を'], answer: 1, tip: 'A casa é o lugar do estudo: うちで.' },
        certa('学校で日本語を勉強します。', '学校に日本語を勉強します。', 'Estudo japonês na escola.', 'A escola é o local do estudo: で, não に.'),
        build('Onde você estuda?', 'どこで/t | 勉強しますか/v', 'どこに/c | 何を/s', 'どこで べんきょうしますか • doko de benkyō shimasu ka'),
        build('Estudo japonês na escola.', '学校で/t | 日本語を/s | 勉強します/v', '学校に/c | 日本語に/c',
          '［学校で］＋［日本語を］＋［勉強します］'),
        { type: 'choice', pic: '🗣️', prompt: 'Em 日本語を, a partícula を se pronuncia…', options: ['wo', 'o', 'a'], answer: 1, tip: 'Como partícula, を se lê o.' },
        listen('公園で何をしますか', 'こうえんで なにを しますか • kōen de nani o shimasu ka', '(O que você faz no parque?)',
          '公園で/t | 何を/s | しますか/v', '公園に/c | 何に/c', 'で = onde a ação acontece.'),
        { type: 'choice', pic: '🏫', prompt: '"Estou na escola." Qual está certo?', options: ['学校でいます。', '学校にいます。', '学校をいます。'], answer: 1,
          tip: 'Com います e あります, o lugar onde algo está recebe に.' },
      ],
    },
    {
      id: 6, node: 'LVL_6', place: 'Horta de frutinhas', color: '#6a2bd9',
      title: 'で · Como você vai?', topic: 'で indica o transporte: バスで・電車で・歩いて',
      intro: { en: 'バスで学校に行きます。', pt: 'basu de gakkō ni ikimasu · Vou à escola de ônibus. で também marca o meio de transporte.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: transportes', pairs: [['バスで', 'de ônibus'], ['電車で', 'de trem'], ['地下鉄で', 'de metrô'], ['車で', 'de carro'], ['自転車で', 'de bicicleta']] },
        build('Vou à escola de ônibus.', 'バスで/t | 学校に/c | 行きます/v', 'バスに/c | 学校で/t', 'バスで がっこうに いきます • basu de gakkō ni ikimasu'),
        build('Volto para casa de trem.', '電車で/t | うちに/c | 帰ります/v', '電車に/c | うちで/t', 'でんしゃで うちに かえります • densha de uchi ni kaerimasu'),
        certa('バスで学校に行きます。', 'バスに学校に行きます。', 'Vou à escola de ônibus.', 'O ônibus é o meio de transporte: で.'),
        { type: 'choice', pic: '🚶', prompt: '"Vou à escola a pé." Qual está certo?', options: ['足で学校に行きます。', '歩いて学校に行きます。', '歩くで学校に行きます。'], answer: 1,
          tip: 'A pé = 歩いて (あるいて). Memorize como um bloco pronto.' },
        build('Na terça-feira, vou à escola de trem.', '火曜日に/e | 電車で/t | 学校に/c | 行きます/v', '火曜日で/t | 電車に/c',
          'かようびに でんしゃで がっこうに いきます'),
        { type: 'fill', sentence: '飛行機___日本に行きます。 (Vou ao Japão de avião.)', options: ['で', 'に', 'を'], answer: 0, tip: 'ひこうきで = de avião.' },
        listen('月曜日にバスで学校に行きます', 'げつようびに バスで がっこうに いきます', '(Na segunda-feira, vou à escola de ônibus.)',
          '月曜日に/e | バスで/t | 学校に/c | 行きます/v', '月曜日で/t | バスに/c', '［月曜日に］＋［バスで］＋［学校に］＋［行きます］'),
        { type: 'choice', pic: '⚖️', prompt: '学校＿行きます (vou) ／ 学校＿勉強します (estudo). Quais partículas?', options: ['に ／ で', 'で ／ に', 'に ／ に'], answer: 0,
          tip: 'に = destino; で = local da ação.' },
      ],
    },
    {
      id: 7, node: 'LVL_7', place: 'Porta da frente', color: '#36912a',
      title: 'それから · Ligando frases', topic: 'Conectores e diálogo: そして・それから・でも・だから',
      intro: { en: 'ただいま！それから、ごはんを食べます。', pt: 'tadaima! sorekara, gohan o tabemasu · Cheguei! Depois, vou comer. Revisão final com conectores.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: conectores', pairs: [['そして', 'e / além disso'], ['それから', 'depois'], ['でも', 'mas'], ['だから', 'por isso']] },
        { type: 'choice', pic: '🔗', prompt: '図書館に行きます。＿＿、うちに帰ります。 (Depois, volto para casa.)', options: ['それから', 'でも', 'だから'], answer: 0, tip: 'それから ordena as ações: depois.' },
        { type: 'choice', pic: '🔗', prompt: '今日は休みです。＿＿、学校に行きません。 (Por isso, não vou.)', options: ['でも', 'だから', 'そして'], answer: 1, tip: 'だから apresenta a consequência: por isso.' },
        { type: 'choice', pic: '🔗', prompt: '月曜日に学校に行きます。＿＿、日曜日は行きません。 (Mas no domingo não vou.)', options: ['でも', 'それから', 'だから'], answer: 0, tip: 'でも apresenta contraste: mas.' },
        build('Vou à biblioteca. Depois, volto para casa.', '図書館に/c | 行きます。/v | それから、/e | うちに/c | 帰ります/v', 'でも、/e | うちで/t',
          'としょかんに いきます。それから、うちに かえります。'),
        build('Aonde você vai no domingo?', '日曜日に/e | どこに/c | 行きますか/v', '日曜日で/t | どこで/t', 'にちようびに どこに いきますか'),
        listen('いいえ、歩いて行きます', 'いいえ、あるいて いきます • iie, aruite ikimasu', '(Não, vou a pé.)',
          'いいえ、/e | 歩いて/t | 行きます/v', 'バスで/t | はい、/e', 'Resposta do diálogo: バスで行きますか。→ いいえ、歩いて行きます。'),
        build('No domingo, corro no parque.', '日曜日に/e | 公園で/t | 走ります/v', '公園に/c | 日曜日で/t', 'にちようびに こうえんで はしります'),
        build('Hoje vou à escola. Mas amanhã não vou.', '今日は/s | 学校に/c | 行きます。/v | でも、/e | 明日は/s | 行きません/v', 'だから、/e | 学校で/t',
          'きょうは がっこうに いきます。でも、あしたは いきません。'),
      ],
    },
  ];

  const MOTIVATION = [
    ['すごい！', 'sugoi · Incrível!'], ['やったね！', 'yatta ne · Conseguiu!'], ['よくできました！', 'yoku dekimashita · Muito bem!'],
    ['かんぺき！', 'kanpeki · Perfeito!'], ['がんばって！', 'ganbatte · Força!'], ['さいこう！', 'saikō · O melhor!'], ['じょうず！', 'jōzu · Que habilidade!'],
  ];
  const OK_SHORT = ['せいかい！Correto!', 'いいね！Boa!', 'すごい！Incrível!', 'そのとおり！Isso mesmo!', 'よくできました！Muito bem!'];

  window.PongoContent = { UNITS, MOTIVATION, MOTIVATION_SUB: [], OK_SHORT };

  window.PongoPack = {
    id: 'ja',
    lang: 'ja-JP',
    saveKey: 'pongo-japones-v1',
    docTitle: 'Pongo Aprende Japonês',
    bodyClass: 'lang-ja',
    start: {
      title: '<span>Pongo</span> aprende <span class="ja">日本語</span>',
      lead: 'Quando, onde e como você vai? Ajude o Pongo a falar da <strong>rotina semanal em japonês</strong>: dias da semana, destino com <strong>に</strong>, local e transporte com <strong>で</strong> e conectores.',
      bubble: 'ワンワン！ポンゴです！',
      feat: 'Frases em <b>blocos</b>',
    },
    roles: { e: 'Tempo / conector', s: 'Tópico / objeto', t: 'Local · meio (で)', c: 'Destino (に)', v: 'Verbo' },
    buildTitle: 'Monte a frase em japonês',
    typeTitle: 'Escreva',
    isTarget: (s) => /[぀-ヿ一-鿿]/.test(s) && !/[a-zà-úāēīōū]/i.test(s),
    lines: [
      ['ワンワン！こんにちは！', 'wan wan! konnichiwa! · Au-au! Olá!'],
      ['ぼくはポンゴです！', 'boku wa Pongo desu · Eu sou o Pongo!'],
      ['いっしょに べんきょうしましょう！', 'isshoni benkyō shimashō · Vamos estudar juntos!'],
      ['公園に行きます！', 'kōen ni ikimasu · Vou ao parque!'],
      ['がんばって！', 'ganbatte · Força!'],
      ['今日は何曜日ですか。', 'kyō wa nan\'yōbi desu ka · Que dia é hoje?'],
    ],
    say: {
      notYet: ['まだです！', 'mada desu · Ainda não! Termine a lição anterior primeiro.'],
      garden: ['ここは ぼくの うちです！', 'koko wa boku no uchi desu · Esta é a minha casa! Olha o jardim inteiro!'],
      first: ['ワンワン！こんにちは！ぼくはポンゴです！', 'Au-au! Olá! Eu sou o Pongo e quero aprender japonês! Toque no número 1.'],
      allDone: ['うちに 帰りました！すごい！', 'uchi ni kaerimashita! sugoi! · Voltei para casa! Incrível!'],
      welcome: (n, u) => ['おかえりなさい！', `okaerinasai · Que bom te ver de novo! Vamos para a lição ${n}: ${u.place}.`],
      next: (i, u) => ['行きましょう！', `ikimashō · Vamos! Próxima parada: ${u.place} — ${u.title}`],
      homeEnd: ['ただいま！ありがとう！', 'tadaima! arigatō! · Cheguei em casa! Obrigado, amigo!'],
      practice: ['いっしょに れんしゅうしましょう！', 'Vamos praticar juntos! Escolha uma lição no mapa.'],
    },
    result: {
      1: 'よくできました！', 2: 'すごい！', 3: 'かんぺき！',
      fail: 'もう いちど！',
      speak: { 1: 'よくできました！', 2: 'すごい！よくできました！', 3: 'かんぺき！すごい！' },
    },
  };
})();
