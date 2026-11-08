/* Pongo apprend le français - French content pack.
 * Adaptação para o francês da aula ODU Creative "Dias da semana e movimento —
 * tempo e lugar e conectores de frases" (nível básico, A1): quando, onde e como
 * você vai. Rotina semanal com tempo, destino, meio de transporte, local das
 * atividades e conectores.
 *
 * Equivalências com a aula de japonês:
 *   に (destino)       -> à / au / à la / à l' / aux / chez
 *   に (horário)       -> à sept heures; demain, aujourd'hui, tous les jours sem preposição
 *   で (local da ação) -> também à / au: J'étudie à l'école
 *   で (transporte)    -> en bus, en train, en voiture… / à pied, à vélo
 *   conectores          -> et, puis, mais, donc
 *
 * Cores dos blocos: e = tempo / conector (laranja), s = sujeito (azul),
 * v = verbo (verde), c = lugar / complemento (amarelo), t = transporte (lilás).
 */
(function () {
  'use strict';

  const B = (str) => str.split('|').map((p) => {
    const i = p.lastIndexOf('/');
    return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
  });
  const build = (pt, blocks, extra, tip) => ({ type: 'build', pt, blocks: B(blocks), extra: B(extra), tip });
  const listen = (say, prompt, blocks, extra, tip) => ({ type: 'listen', say, sayHint: say, prompt, blocks: B(blocks), extra: B(extra), tip });
  const certa = (right, wrong, prompt, tip) => {
    const options = Math.random() < 0.5 ? [right, wrong] : [wrong, right];
    return { type: 'choice', kind: 'Erro comum', title: 'Qual frase está certa?', pic: '🔎', prompt, options, answer: options.indexOf(right), tip };
  };

  const UNITS = [
    {
      id: 1, node: 'LVL_1', place: 'Portão', color: '#2f86c9',
      title: 'Les jours · Dias da semana', topic: 'Quel jour sommes-nous ?',
      intro: { en: 'Ouaf ! Bonjour ! Quel jour sommes-nous ?', pt: 'Au-au! Olá! Que dia é hoje? Vamos aprender os dias da semana.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: dias da semana', pairs: [['lundi', 'segunda-feira'], ['mardi', 'terça-feira'], ['mercredi', 'quarta-feira'], ['jeudi', 'quinta-feira'], ['vendredi', 'sexta-feira']] },
        { type: 'match', prompt: 'Toque nos pares', pairs: [['samedi', 'sábado'], ['dimanche', 'domingo'], ['aujourd\'hui', 'hoje'], ['demain', 'amanhã'], ['hier', 'ontem']] },
        { type: 'choice', pic: '📅', prompt: '« Quel jour sommes-nous aujourd\'hui ? » significa…', options: ['Que dia da semana é hoje?', 'Que horas são?', 'Aonde você vai hoje?'], answer: 0,
          tip: 'Resposta: « Aujourd\'hui, c\'est samedi. » ou « Nous sommes samedi. »' },
        build('Hoje é sábado.', 'Aujourd\'hui,/e | c\'est/v | samedi/c', 'Demain,/e | dimanche/c',
          '［Aujourd\'hui,］＋［c\'est］＋［___］'),
        { type: 'choice', pic: '✍️', prompt: 'Em francês, os dias da semana se escrevem…', options: ['com letra minúscula (lundi)', 'com letra maiúscula (Lundi)', 'sempre com artigo (le Lundi)'], answer: 0,
          tip: 'Como no português: lundi, mardi, mercredi…' },
        listen('Aujourd\'hui, c\'est lundi.', '(Hoje é segunda-feira.)', 'Aujourd\'hui,/e | c\'est/v | lundi/c', 'Hier,/e | mardi/c', 'lundi = segunda-feira.'),
        { type: 'choice', say: 'mercredi', sayHint: 'mercredi (mér-cre-dí)', title: 'Ouça e escolha', prompt: 'Que dia o Pongo disse?',
          options: ['mardi', 'mercredi', 'vendredi'], answer: 1, tip: 'mercredi = quarta-feira.' },
        build('Amanhã é domingo.', 'Demain,/e | c\'est/v | dimanche/c', 'Aujourd\'hui,/e | lundi/c', 'Demain, c\'est dimanche.'),
        { type: 'choice', pic: '➡️', prompt: 'Que dia vem depois de vendredi (sexta)?', options: ['jeudi', 'dimanche', 'samedi'], answer: 2,
          tip: 'vendredi (sexta) → samedi (sábado) → dimanche (domingo).' },
      ],
    },
    {
      id: 2, node: 'LVL_2', place: 'Canteiro de flores', color: '#d23a4f',
      title: 'Aller · Ir, vir e voltar', topic: 'Verbos de movimento: aller, venir, rentrer',
      intro: { en: 'Je vais au parc !', pt: 'Vou ao parque! Hoje: ir, vir, voltar para casa, caminhar e correr.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: verbos', pairs: [['aller', 'ir'], ['venir', 'vir'], ['rentrer', 'voltar (para casa)'], ['marcher', 'caminhar'], ['courir', 'correr']] },
        { type: 'choice', pic: '🏠', prompt: 'Um amigo vem até a SUA casa. Qual verbo?', options: ['aller', 'venir', 'rentrer'], answer: 1,
          tip: 'venir = vir até onde a pessoa que fala está: « Un ami vient chez moi. »' },
        { type: 'choice', pic: '🎒', prompt: 'A aula acabou e você volta para casa. Qual verbo?', options: ['venir', 'aller', 'rentrer'], answer: 2,
          tip: 'rentrer = voltar para casa: « Je rentre à la maison. »' },
        { type: 'fill', sentence: 'Nous ___ au parc. (Nós vamos ao parque.)', options: ['allons', 'allez', 'vont'], answer: 0,
          tip: 'aller: je vais, tu vas, il/elle va, nous allons, vous allez, ils vont.' },
        { type: 'choice', pic: '🙅', prompt: 'Negativa de « Je vais » (não vou):', options: ['Je ne vais pas', 'Je vais pas ne', 'Je non vais'], answer: 0,
          tip: 'A negativa abraça o verbo: ne … pas. Na fala, o ne costuma cair: « Je vais pas ».' },
        build('Vou à escola.', 'Je/s | vais/v | à l\'école/c', 'à la école/c | viens/v',
          'Antes de vogal, la vira l\': à l\'école.'),
        listen('Un ami vient chez moi.', '(Um amigo vem à minha casa.)', 'Un ami/s | vient/v | chez moi/c', 'va/v | à moi/c',
          'chez moi = na minha casa.'),
        build('Volto para casa.', 'Je/s | rentre/v | à la maison/c', 'vais/v | au maison/c', 'Je rentre à la maison. (ou: Je rentre chez moi.)'),
        { type: 'choice', say: 'Je cours.', sayHint: 'Je cours (jê cur)', title: 'Ouça e escolha', prompt: 'O que o Pongo disse?',
          options: ['Corro.', 'Caminho.', 'Volto para casa.'], answer: 0, tip: 'courir = correr (je cours); marcher = caminhar (je marche).' },
      ],
    },
    {
      id: 3, node: 'LVL_3', place: 'Lago', color: '#1cb0f6',
      title: 'À / au · Para onde?', topic: 'O destino: à la, au, à l\', chez',
      intro: { en: 'Où vas-tu ?', pt: 'Aonde você vai? O destino vem com à: à la, au, à l\' e chez.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: lugares', pairs: [['l\'école', 'a escola'], ['la bibliothèque', 'a biblioteca'], ['le parc', 'o parque'], ['la maison', 'a casa'], ['le cinéma', 'o cinema']] },
        { type: 'choice', pic: '🧮', prompt: 'à + le parc =', options: ['à le parc', 'au parc', 'al parc'], answer: 1,
          tip: 'à + le = au; à + les = aux. Com la e l\' não há contração: à la, à l\'.' },
        build('Vou à biblioteca.', 'Je/s | vais/v | à la bibliothèque/c', 'au bibliothèque/c | viens/v', 'la bibliothèque → à la bibliothèque.'),
        build('Aonde você vai?', 'Où/c | vas-tu/v', 'Quand/e | va/v', 'Où vas-tu ? (falado: Tu vas où ?)'),
        { type: 'choice', pic: '💬', prompt: 'Alguém pergunta « Où vas-tu ? ». Qual resposta está certa?', options: ['Je vais en bibliothèque.', 'Je vais à la bibliothèque.', 'Je vais la bibliothèque.'], answer: 1,
          tip: 'O destino leva à: Je vais à la bibliothèque.' },
        { type: 'fill', sentence: 'Je vais ___ parc.', options: ['au', 'à la', 'en'], answer: 0, tip: 'le parc → au parc.' },
        { type: 'choice', pic: '👩', prompt: 'Para ir à casa de uma pessoa, usamos…', options: ['chez Marie', 'à Marie', 'au Marie'], answer: 0,
          tip: 'chez + pessoa = na casa de: Je vais chez Marie. Chez moi = na minha casa.' },
        listen('Je vais à l\'école.', '(Vou à escola.)', 'Je/s | vais/v | à l\'école/c', 'à la école/c | au école/c', 'à l\' antes de vogal.'),
        build('Um amigo vem à minha casa.', 'Un ami/s | vient/v | chez moi/c', 'à moi/c | va/v', 'chez moi = na minha casa.'),
      ],
    },
    {
      id: 4, node: 'LVL_4', place: 'Árvore grande', color: '#ff9600',
      title: 'Quand ? · Quando?', topic: 'à sept heures, lundi, le lundi, demain',
      intro: { en: 'Je rentre à la maison à sept heures.', pt: 'Volto para casa às sete. Horário leva à; demain e tous les jours vêm sem preposição.' },
      exercises: [
        build('Estudamos na segunda-feira.', 'Nous/s | étudions/v | lundi/e', 'au lundi/e | en lundi/e',
          'Com dia da semana não vai preposição: lundi = nesta segunda.'),
        build('Volto para casa às sete horas.', 'Je/s | rentre/v | à la maison/c | à sept heures/e', 'en sept heures/e | au maison/c',
          'Horário leva à: à sept heures.'),
        { type: 'match', prompt: 'Toque nos pares: marcadores de tempo', pairs: [['tous les jours', 'todos os dias'], ['chaque semaine', 'toda semana'], ['cette semaine', 'esta semana'], ['la semaine prochaine', 'semana que vem'], ['à sept heures', 'às sete horas']] },
        { type: 'choice', pic: '⏰', prompt: 'Qual expressão de tempo vem SEM preposição?', options: ['à sept heures', 'demain', 'à midi'], answer: 1,
          tip: 'aujourd\'hui, demain, hier, tous les jours, chaque semaine: sem preposição. Horas: à.' },
        certa('Demain, je vais à l\'école.', 'À demain, je vais à l\'école.', 'Amanhã, vou à escola.',
          '« À demain ! » quer dizer "até amanhã!". Para "amanhã", use só demain.'),
        certa('Je cours tous les jours.', 'Je cours à tous les jours.', 'Corro todos os dias.', 'tous les jours vem sem preposição.'),
        { type: 'fill', sentence: 'Je rentre ___ sept heures.', options: ['à', 'en', 'au'], answer: 0, tip: 'Horário: à sept heures, à midi, à huit heures.' },
        listen('Tous les jours, j\'étudie le français.', '(Estudo francês todos os dias.)', 'Tous les jours,/e | j\'étudie/v | le français/c', 'À tous les jours,/e | au français/c',
          'je + étudie → j\'étudie.'),
        { type: 'choice', pic: '📌', prompt: '« Le lundi, je vais à l\'école. » significa…', options: ['Toda segunda-feira vou à escola (hábito).', 'Só nesta segunda vou à escola.', 'Na segunda passada fui à escola.'], answer: 0,
          tip: 'le lundi = toda segunda (hábito); lundi = nesta segunda.' },
      ],
    },
    {
      id: 5, node: 'LVL_5', place: 'Casinha do Pongo', color: '#8e44ad',
      title: 'Où ? · Onde acontece?', topic: 'O local da ação: à l\'école, au parc, à la maison',
      intro: { en: 'Je cours au parc !', pt: 'Corro no parque! O lugar onde a ação acontece também usa à / au.' },
      exercises: [
        build('Estudo na escola.', 'J\'étudie/v | à l\'école/c', 'en l\'école/c | Je vais/v', 'O lugar da ação também leva à: à l\'école.'),
        build('Corro no parque.', 'Je/s | cours/v | au parc/c', 'à le parc/c | en parc/c', 'le parc → au parc.'),
        { type: 'fill', sentence: 'J\'étudie le français ___ la maison.', options: ['à', 'en', 'au'], answer: 0, tip: 'à la maison (ou: chez moi).' },
        certa('J\'étudie le français à l\'école.', 'J\'étudie le français en l\'école.', 'Estudo francês na escola.', 'Lugar da ação: à l\'école, não en.'),
        build('Onde você estuda?', 'Où/c | étudies-tu/v', 'Quand/e | vas-tu/v', 'Où étudies-tu ? (falado: Tu étudies où ?)'),
        build('Estudo francês em casa.', 'J\'étudie/v | le français/c | à la maison/c', 'au maison/c | en maison/c', '［J\'étudie］＋［le français］＋［à la maison］'),
        { type: 'choice', pic: '🏠', prompt: '« J\'étudie chez moi. » significa…', options: ['Estudo em casa.', 'Estudo na casa de um amigo.', 'Estudo comigo mesmo.'], answer: 0,
          tip: 'chez moi = na minha casa.' },
        listen('Qu\'est-ce que tu fais au parc ?', '(O que você faz no parque?)', 'Qu\'est-ce que/e | tu fais/v | au parc/c', 'à le parc/c | tu vas/v',
          'Qu\'est-ce que… = o que…'),
        { type: 'choice', pic: '🏫', prompt: '"Estou na escola." Qual está certo?', options: ['Je suis en école.', 'Je suis à l\'école.', 'Je suis au école.'], answer: 1,
          tip: 'Onde você está também usa à: Je suis à l\'école.' },
      ],
    },
    {
      id: 6, node: 'LVL_6', place: 'Horta de frutinhas', color: '#6a2bd9',
      title: 'En bus · Como você vai?', topic: 'O transporte: en bus, en train, à pied, à vélo',
      intro: { en: 'Je vais à l\'école en bus.', pt: 'Vou à escola de ônibus. en para veículos em que você entra; à para pé e bicicleta.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: transportes', pairs: [['en bus', 'de ônibus'], ['en train', 'de trem'], ['en métro', 'de metrô'], ['en voiture', 'de carro'], ['à vélo', 'de bicicleta']] },
        build('Vou à escola de ônibus.', 'Je/s | vais/v | à l\'école/c | en bus/t', 'à bus/t | au bus/t', 'Je vais à l\'école en bus.'),
        build('Volto para casa de trem.', 'Je/s | rentre/v | à la maison/c | en train/t', 'à train/t | au train/t', 'Je rentre à la maison en train.'),
        certa('Je vais à l\'école en bus.', 'Je vais à l\'école à bus.', 'Vou à escola de ônibus.', 'Veículos em que você entra: en bus, en train, en voiture.'),
        { type: 'choice', pic: '🚶', prompt: '"Vou à escola a pé." Qual está certo?', options: ['Je vais à l\'école en pied.', 'Je vais à l\'école à pied.', 'Je vais à l\'école au pied.'], answer: 1,
          tip: 'à pied (a pé) e à vélo (de bicicleta): você vai "em cima", por isso à.' },
        build('Na terça-feira, vou à escola de trem.', 'Mardi,/e | je vais/v | à l\'école/c | en train/t', 'En mardi,/e | à train/t',
          'Mardi, je vais à l\'école en train.'),
        { type: 'fill', sentence: 'Je vais au Japon ___ avion. (Vou ao Japão de avião.)', options: ['en', 'à', 'au'], answer: 0, tip: 'en avion = de avião.' },
        listen('Lundi, je vais à l\'école en bus.', '(Na segunda-feira, vou à escola de ônibus.)', 'Lundi,/e | je vais/v | à l\'école/c | en bus/t', 'à bus/t | au école/c',
          '［Lundi,］＋［je vais］＋［à l\'école］＋［en bus］'),
        { type: 'choice', pic: '⚖️', prompt: '___ vélo ／ ___ voiture. Quais preposições?', options: ['à ／ en', 'en ／ à', 'en ／ en'], answer: 0,
          tip: 'à vélo, à pied, à moto; en voiture, en bus, en train, en avion.' },
      ],
    },
    {
      id: 7, node: 'LVL_7', place: 'Porta da frente', color: '#36912a',
      title: 'Et puis · Ligando frases', topic: 'Conectores: et, puis, mais, donc',
      intro: { en: 'Je rentre à la maison, puis je mange !', pt: 'Volto para casa e depois como! Revisão final com conectores.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares: conectores', pairs: [['et', 'e'], ['puis', 'depois'], ['mais', 'mas'], ['donc', 'por isso']] },
        { type: 'choice', pic: '🔗', prompt: 'Je vais à la bibliothèque, ___ je rentre à la maison. (depois)', options: ['puis', 'mais', 'donc'], answer: 0, tip: 'puis (ou ensuite) ordena as ações: depois.' },
        { type: 'choice', pic: '🔗', prompt: 'Aujourd\'hui, je suis libre, ___ je ne vais pas à l\'école. (por isso)', options: ['mais', 'donc', 'et'], answer: 1, tip: 'donc apresenta a consequência: por isso.' },
        { type: 'choice', pic: '🔗', prompt: 'Je vais à l\'école le lundi, ___ pas le dimanche. (mas)', options: ['mais', 'puis', 'donc'], answer: 0, tip: 'mais apresenta contraste: mas.' },
        build('Vou à biblioteca. Depois, volto para casa.', 'Je vais/v | à la bibliothèque./c | Puis,/e | je rentre/v | à la maison/c', 'Mais,/e | au maison/c',
          'Je vais à la bibliothèque. Puis, je rentre à la maison.'),
        build('Aonde você vai no domingo?', 'Dimanche,/e | où/c | vas-tu/v', 'Au dimanche,/e | quand/e', 'Dimanche, où vas-tu ?'),
        listen('Non, je vais à pied.', '(Não, vou a pé.)', 'Non,/e | je vais/v | à pied/t', 'en pied/t | Oui,/e',
          'Diálogo: Tu vas au parc en bus ? → Non, je vais à pied.'),
        build('No domingo, corro no parque.', 'Dimanche,/e | je cours/v | au parc/c', 'à le parc/c | En dimanche,/e', 'Dimanche, je cours au parc.'),
        build('Hoje vou à escola. Mas amanhã não vou.', 'Aujourd\'hui,/e | je vais/v | à l\'école./c | Mais demain,/e | je n\'y vais pas/v', 'Donc demain,/e | en école/c',
          'y = lá: je n\'y vais pas = não vou (lá).'),
      ],
    },
  ];

  const MOTIVATION = [
    ['BRAVO !', 'Muito bem!'], ['GÉNIAL !', 'Genial!'], ['SUPER !', 'Super!'], ['PARFAIT !', 'Perfeito!'],
    ['FORMIDABLE !', 'Formidável!'], ['CHAPEAU !', 'Tiro o chapéu!'], ['EXCELLENT !', 'Excelente!'],
  ];
  const OK_SHORT = ['Bravo ! Muito bem!', 'Super ! Ótimo!', 'Exact ! Isso mesmo!', 'Parfait ! Perfeito!', 'Bien joué ! Mandou bem!'];

  window.PongoContent = { UNITS, MOTIVATION, MOTIVATION_SUB: [], OK_SHORT };

  // palavras que só aparecem nas opções em português (para não ler português com voz francesa)
  const PT = /[ãõ]|\b(você|não|vou|estou|corro|caminho|volto|segunda|terça|quarta|quinta|sexta|sábado|domingo|hoje|amanhã|ontem|para|casa|estudo|todo|toda|só|mesmo|minha|comigo)\b/i;

  window.PongoPack = {
    id: 'fr',
    lang: 'fr-FR',
    saveKey: 'pongo-frances-v1',
    docTitle: 'Pongo Aprende Francês',
    bodyClass: 'lang-fr',
    start: {
      title: '<span>Pongo</span> apprend le <span class="fr">français</span>',
      lead: 'Quando, onde e como você vai? Ajude o Pongo a falar da <strong>rotina semanal em francês</strong>: dias da semana, destino com <strong>à / au / chez</strong>, transporte com <strong>en / à</strong> e conectores.',
      bubble: 'Ouaf ! Je m\'appelle Pongo !',
      feat: 'Frases em <b>blocos</b>',
    },
    roles: { e: 'Tempo / conector', s: 'Sujeito', v: 'Verbo', c: 'Lugar / complemento', t: 'Transporte' },
    buildTitle: 'Monte a frase em francês',
    typeTitle: 'Escreva',
    isTarget: (s) => /[a-zàâçéèêëîïôûùü]/i.test(s) && !PT.test(s),
    lines: [
      ['Ouaf ! Bonjour !', 'Au-au! Olá!'],
      ['Je m\'appelle Pongo !', 'Meu nome é Pongo!'],
      ['On étudie ensemble ?', 'Vamos estudar juntos?'],
      ['Je vais au parc !', 'Vou ao parque!'],
      ['Courage !', 'Força!'],
      ['Quel jour sommes-nous ?', 'Que dia é hoje?'],
    ],
    say: {
      notYet: ['Pas encore !', 'Ainda não! Termine a lição anterior primeiro.'],
      garden: ['Voilà mon jardin et ma maison !', 'Olha o meu jardim e a minha casa!'],
      first: ['Ouaf ! Bonjour ! Je m\'appelle Pongo !', 'Au-au! Olá! Eu sou o Pongo e quero aprender francês! Toque no número 1.'],
      allDone: ['Je suis rentré à la maison ! Génial !', 'Voltei para casa! Genial!'],
      welcome: (n, u) => ['Bon retour !', `Que bom te ver de novo! Vamos para a lição ${n}: ${u.place}.`],
      next: (i, u) => ['On y va !', `Vamos lá! Próxima parada: ${u.place} — ${u.title}`],
      homeEnd: ['Je suis à la maison ! Merci !', 'Cheguei em casa! Obrigado, amigo!'],
      practice: ['On s\'entraîne ensemble ?', 'Vamos praticar juntos! Escolha uma lição no mapa.'],
    },
    result: {
      1: 'Bien joué !', 2: 'Bravo !', 3: 'Parfait !',
      fail: 'On réessaie !',
      speak: { 1: 'Bien joué !', 2: 'Bravo ! Bien joué !', 3: 'Parfait ! Génial !' },
    },
  };
})();
