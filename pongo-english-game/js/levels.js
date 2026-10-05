/* Pongo Learns English - lesson content.
 * Based on "ODU Creative - Cumprimentos e rotina diária em inglês" (A1/A2):
 * greetings, verb BE, Present Continuous and daily-routine vocabulary.
 *
 * Block roles follow the colour code of the class material:
 *   s = sujeito (azul)  v = verbo / grupo verbal (verde)
 *   c = complemento (amarelo)  t = tempo, lugar ou circunstância (lilás)
 *   e = expressão fixa (laranja) - learned as one whole block
 *
 * Exercise types:
 *   choice  prompt + options, answer = index
 *   fill    sentence with ___, options, answer = index
 *   build   Portuguese sentence -> order the English blocks
 *   listen  hear the sentence (TTS) -> order the blocks
 *   match   tap the pairs (English <-> Portuguese)
 *   type    write the answer (accept = list of accepted answers)
 */
(function () {
  'use strict';

  const B = (str) =>
    // "The sun/s | is shining/v | today/t" -> [["The sun","s"],...]
    str.split('|').map((p) => {
      const i = p.lastIndexOf('/');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    });

  const UNITS = [
    {
      id: 1,
      node: 'LVL_1',
      place: 'Portão',
      title: 'Hello, Pongo!',
      topic: 'Cumprimentos do dia',
      color: '#2f86c9',
      intro: { en: 'Woof! Hello! Good morning! Let\'s learn greetings!', pt: 'Au! Olá! Bom dia! Vamos aprender cumprimentos!' },
      exercises: [
        {
          type: 'choice', pic: '🌅', clock: '8:00',
          prompt: 'Você encontra uma pessoa às 8h da manhã. O que você diz?',
          options: ['Good morning!', 'Good night!', 'Good evening!', 'Goodbye!'], answer: 0,
          tip: '“Good morning” é o cumprimento da manhã.',
        },
        {
          type: 'choice', pic: '🌆', clock: '19:00',
          prompt: 'Às 19h você encontra seu vizinho. Como cumprimentar?',
          options: ['Good night!', 'Good evening!', 'Good afternoon!'], answer: 1,
          tip: '“Good evening” inicia um encontro à noite. “Good night” encerra o contato ou anuncia que alguém vai dormir.',
        },
        {
          type: 'match', prompt: 'Toque nos pares correspondentes',
          pairs: [['Hi / Hello', 'Oi / Olá'], ['Good morning', 'Bom dia'], ['Good afternoon', 'Boa tarde'],
            ['Goodbye', 'Tchau'], ['How are you?', 'Como você está?']],
        },
        {
          type: 'build', pt: 'Olá, Pongo! Como você está?',
          blocks: B('Hello,/e | Pongo!/e | How/e | are/v | you?/s'),
          extra: B('is/v | Good night/e'),
          tip: 'Em perguntas com be, o verbo (are) vem antes do sujeito (you).',
        },
        {
          type: 'listen', say: 'Good afternoon, everyone!',
          blocks: B('Good afternoon,/e | everyone!/e'),
          extra: B('Good evening,/e | Goodbye/e'),
        },
        {
          type: 'choice', pic: '☀️',
          prompt: '“Hello” pode ser usado à tarde?',
          options: ['Sim, “Hello” funciona em vários horários', 'Não, “Hello” significa só “bom dia”', 'Não, “Hello” é uma despedida'],
          answer: 0,
          tip: '“Hello” funciona também à tarde, mas não significa especificamente “boa tarde”.',
        },
        {
          type: 'build', pt: 'Bom dia, pessoal!',
          blocks: B('Good morning,/e | everyone!/e'),
          extra: B('Good night,/e | people/c'),
        },
        {
          type: 'choice', pic: '🌙',
          prompt: 'Quando usamos “Good night”?',
          options: ['Ao chegar em uma festa à noite', 'Para encerrar o contato ou ir dormir', 'Ao acordar'], answer: 1,
          tip: '“Good night” normalmente encerra o contato ou anuncia que alguém vai dormir.',
        },
      ],
    },
    {
      id: 2,
      node: 'LVL_2',
      place: 'Canteiro de flores',
      title: 'Nice to meet you!',
      topic: 'Conhecer, agradecer, desculpar-se',
      color: '#d23a4f',
      intro: { en: 'Look! Our next-door neighbor! Let\'s say: nice to meet you!', pt: 'Olha! Nosso vizinho da casa ao lado! Vamos dizer: prazer em conhecer você!' },
      exercises: [
        {
          type: 'choice', pic: '🤝',
          prompt: 'Você conhece um colega pela primeira vez. O que você diz?',
          options: ['Nice to meet you!', 'It\'s been a while!', 'I\'m home!'], answer: 0,
          tip: 'Aprenda “Nice to meet you” como expressão pronta, em um bloco só.',
        },
        {
          type: 'choice', pic: '🍓',
          prompt: 'Um amigo oferece comida para você.',
          options: ['You\'re welcome!', 'Thank you!', 'I\'m sorry!'], answer: 1,
          tip: '“Thank you” agradece.',
        },
        {
          type: 'choice', pic: '😊',
          prompt: 'Alguém agradece pela sua ajuda: “Thank you!”. Você responde:',
          options: ['Thank you!', 'Good night!', 'You\'re welcome!'], answer: 2,
          tip: '“You’re welcome” = de nada. É a resposta a um agradecimento.',
        },
        {
          type: 'match', prompt: 'Toque nos pares correspondentes',
          pairs: [['Thank you', 'Obrigado(a)'], ['You\'re welcome', 'De nada'], ['I\'m sorry', 'Desculpe'],
            ['It\'s been a while', 'Faz tempo'], ['Nice to meet you', 'Prazer em conhecer você']],
        },
        {
          type: 'build', pt: 'Eu sou o Pongo. Prazer em conhecer você!',
          blocks: B('I/s | am/v | Pongo./c | Nice to meet you!/e'),
          extra: B('is/v | Thank you/e'),
          tip: 'I é o sujeito; am é a forma de be para I.',
        },
        {
          type: 'choice', pic: '⏳',
          prompt: 'Em “It\'s been a while”, a contração it\'s significa…',
          options: ['it is', 'it has', 'it was'], answer: 1,
          tip: 'Aqui, it’s = it has (Present Perfect): “It has been a while” = faz tempo.',
        },
        {
          type: 'listen', say: 'Thank you, my friend!',
          blocks: B('Thank you,/e | my friend!/c'),
          extra: B('You\'re welcome,/e | your/c'),
        },
        {
          type: 'build', pt: 'Faz tempo! Como você está?',
          blocks: B('It\'s been a while!/e | How/e | are/v | you?/s'),
          extra: B('is/v | Nice to meet you/e'),
        },
      ],
    },
    {
      id: 3,
      node: 'LVL_3',
      place: 'Lago',
      title: 'I am happy!',
      topic: 'Verbo BE: am, is, are',
      color: '#1cb0f6',
      intro: { en: 'I am happy! You are ready! The duck is yellow!', pt: 'Eu estou feliz! Você está pronto! O pato é amarelo! Vamos estudar o verbo BE.' },
      exercises: [
        {
          type: 'fill', sentence: 'I ___ happy.', options: ['am', 'is', 'are'], answer: 0,
          tip: 'I → am · You/We/They → are · He/She/It → is',
        },
        {
          type: 'fill', sentence: 'The sun ___ shining.', options: ['am', 'is', 'are'], answer: 1,
          tip: '“The sun” = it → is.',
        },
        {
          type: 'fill', sentence: 'We ___ home.', options: ['am', 'is', 'are'], answer: 2,
          tip: 'We → are.',
        },
        {
          type: 'fill', sentence: 'My friends ___ walking.', options: ['am', 'is', 'are'], answer: 2,
          tip: '“My friends” é plural (they) → are.',
        },
        {
          type: 'build', pt: 'Eu estou feliz hoje.',
          blocks: B('I/s | am/v | happy/c | today./t'),
          extra: B('is/v | are/v'),
          tip: 'Troque happy por hungry, tired ou drowsy para fazer novas frases!',
        },
        {
          type: 'build', pt: 'Você está pronto?',
          blocks: B('Are/v | you/s | ready?/c'),
          extra: B('Do/v | is/v'),
          tip: 'Na pergunta com be, o verbo vem antes do sujeito. Não usamos “do”.',
        },
        {
          type: 'choice', pic: '🙅',
          prompt: 'Coloque na negativa: “I am ready.”',
          options: ['I don\'t ready.', 'I\'m not ready.', 'I amn\'t ready.'], answer: 1,
          tip: 'Na negativa acrescentamos not: I’m not ready.',
        },
        {
          type: 'type', prompt: 'Escreva a contração de “You are”', placeholder: 'You…',
          accept: ['you\'re', 'you’re'], tip: 'You are → You’re · We are → We’re · It is → It’s',
        },
        {
          type: 'build', pt: 'Nós estamos felizes hoje.',
          blocks: B('We/s | are/v | happy/c | today./t'),
          extra: B('am/v | is/v'),
          tip: 'A mudança de sujeito pode exigir mudança no verbo: I am → We are.',
        },
      ],
    },
    {
      id: 4,
      node: 'LVL_4',
      place: 'Árvore grande',
      title: 'The sun is shining!',
      topic: 'Present Continuous',
      color: '#ff9600',
      intro: { en: 'Look up! The sun is shining! I am playing under the tree!', pt: 'Olhe para cima! O sol está brilhando! Eu estou brincando debaixo da árvore!' },
      exercises: [
        {
          type: 'choice', pic: '🧩',
          prompt: 'Qual é a estrutura do Present Continuous?',
          options: ['sujeito + verbo + -ed', 'sujeito + am/is/are + verbo-ing', 'sujeito + do/does + verbo'], answer: 1,
          tip: 'Sujeito + am/is/are + verbo com -ing: descreve ações em andamento.',
        },
        {
          type: 'type', prompt: 'Escreva a forma -ing de “walk”', placeholder: 'walk…',
          accept: ['walking'], tip: 'Em geral, acrescente -ing: walk → walking.',
        },
        {
          type: 'type', prompt: 'Escreva a forma -ing de “shine”', placeholder: 'shin…',
          accept: ['shining'], tip: 'Retire o e final silencioso: shine → shining.',
        },
        {
          type: 'type', prompt: 'Escreva a forma -ing de “get”', placeholder: 'get…',
          accept: ['getting'], tip: 'Em get, dobre a consoante: get → getting.',
        },
        {
          type: 'build', pt: 'O sol está brilhando intensamente hoje.',
          blocks: B('The sun/s | is shining/v | brightly/c | today./t'),
          extra: B('are shining/v | shine/v'),
          tip: '“is shining” = ação em andamento. “Brightly” diz como; “today” diz quando.',
        },
        {
          type: 'listen', say: 'You are walking down the street.',
          blocks: B('You/s | are walking/v | down the street./t'),
          extra: B('is walking/v | walk/v'),
        },
        {
          type: 'fill', sentence: 'Pongo is ___ in the garden.', options: ['play', 'playing', 'plays'], answer: 1,
          tip: 'Depois de am/is/are vem o verbo com -ing: is playing.',
        },
        {
          type: 'build', pt: 'Está ficando tarde.',
          blocks: B('It/s | is getting/v | late./c'),
          extra: B('are getting/v | get/v'),
          tip: '“It” é sujeito gramatical; não traduzimos por “isso”. Get + adjetivo = mudança de estado.',
        },
        {
          type: 'choice', pic: '🐶🦴',
          prompt: 'What is Pongo doing? (O que o Pongo está fazendo?)',
          options: ['Pongo are eating.', 'Pongo is eating.', 'Pongo eating is.'], answer: 1,
          tip: 'Pongo = he → is eating.',
        },
      ],
    },
    {
      id: 5,
      node: 'LVL_5',
      place: 'Casinha do Pongo',
      title: 'Are you sleeping?',
      topic: 'Perguntas e negativas no Present Continuous',
      color: '#8e44ad',
      intro: { en: 'Are you sleeping? No, I\'m not! I\'m playing!', pt: 'Você está dormindo? Não! Eu estou brincando! Vamos fazer perguntas e negativas.' },
      exercises: [
        {
          type: 'choice', pic: '❓',
          prompt: 'Transforme em pergunta: “You are walking.”',
          options: ['Do you walking?', 'Are you walking?', 'You walking are?'], answer: 1,
          tip: 'Não acrescente do/does: be já funciona como auxiliar.',
        },
        {
          type: 'build', pt: 'Você está caminhando?',
          blocks: B('Are/v | you/s | walking?/v'),
          extra: B('Do/v | walk/v'),
        },
        {
          type: 'choice', pic: '🌥️',
          prompt: 'Negativa de: “The sun is shining.”',
          options: ['The sun doesn\'t shining.', 'The sun isn\'t shining.', 'The sun not is shining.'], answer: 1,
          tip: 'Negativa: is not / isn’t + verbo-ing.',
        },
        {
          type: 'build', pt: 'O sol não está brilhando.',
          blocks: B('The sun/s | isn\'t shining./v'),
          extra: B('doesn\'t/v | shine/v'),
        },
        {
          type: 'choice', pic: '💬',
          prompt: '“Are you ready?” — Resposta curta afirmativa:',
          options: ['Yes, I do.', 'Yes, I am.', 'Yes, I\'m.'], answer: 1,
          tip: 'Respostas curtas: Yes, I am. / No, I’m not. (Não use contração no “Yes, I am”.)',
        },
        {
          type: 'fill', sentence: '___ Pongo sleeping? No, he isn\'t.', options: ['Is', 'Are', 'Does'], answer: 0,
          tip: 'Pongo = he → Is he sleeping?',
        },
        {
          type: 'listen', say: 'Is the dog playing outside?',
          blocks: B('Is/v | the dog/s | playing/v | outside?/t'),
          extra: B('Are/v | Does/v'),
        },
        {
          type: 'build', pt: 'Eu não estou dormindo. Eu estou brincando!',
          blocks: B('I/s | am not sleeping./v | I\'m playing!/v'),
          extra: B('don\'t sleep/v | is playing/v'),
        },
      ],
    },
    {
      id: 6,
      node: 'LVL_6',
      place: 'Horta de frutinhas',
      title: 'Let\'s share berries!',
      topic: 'Ações da rotina e convites',
      color: '#6a2bd9',
      intro: { en: 'Yummy berries! Let\'s share! Long walks make me very hungry!', pt: 'Frutinhas gostosas! Vamos compartilhar! Caminhadas longas me deixam com muita fome!' },
      exercises: [
        {
          type: 'match', prompt: 'Toque nos pares de verbos',
          pairs: [['eat', 'comer'], ['share', 'compartilhar'], ['play', 'brincar'], ['chew', 'mastigar'], ['sleep', 'dormir']],
        },
        {
          type: 'build', pt: 'Pongo está comendo frutinhas no jardim.',
          blocks: B('Pongo/s | is eating/v | berries/c | in the garden./t'),
          extra: B('are eating/v | eat/v'),
        },
        {
          type: 'fill', sentence: 'Let\'s ___ together!', options: ['practice', 'practicing', 'to practice'], answer: 0,
          tip: 'Let’s + verbo na forma base: Let’s practice = vamos praticar.',
        },
        {
          type: 'fill', sentence: 'Finish ___ breakfast.', options: ['eat', 'eating', 'to eat'], answer: 1,
          tip: 'Depois de finish, a atividade recebe -ing. Aqui não é Present Continuous: falta o be.',
        },
        {
          type: 'build', pt: 'Você vai compartilhar suas frutinhas conosco.',
          blocks: B('You/s | are going to share/v | your berries/c | with us./t'),
          extra: B('going share/v | my/c'),
          tip: 'Be going to + verbo base expressa uma intenção.',
        },
        {
          type: 'listen', say: 'We are sharing our berries.',
          blocks: B('We/s | are sharing/v | our berries./c'),
          extra: B('is sharing/v | your/c'),
        },
        {
          type: 'build', pt: 'Caminhadas longas me deixam com fome.',
          blocks: B('Long walks/s | make/v | me hungry./c'),
          extra: B('makes/v | I/s'),
          tip: 'make + pessoa + adjetivo. Sujeito plural → make.',
        },
        {
          type: 'fill', sentence: 'Long walks always make ___ very hungry.', options: ['I', 'me', 'my'], answer: 1,
          tip: 'Me é pronome objeto: I → me, we → us, they → them.',
        },
        {
          type: 'build', pt: 'Meus amigos estão brincando juntos.',
          blocks: B('My friends/s | are playing/v | together./t'),
          extra: B('is playing/v | plays/v'),
        },
      ],
    },
    {
      id: 7,
      node: 'LVL_7',
      place: 'Porta da frente',
      title: 'I\'m home!',
      topic: 'Despedidas e revisão final',
      color: '#36912a',
      intro: { en: 'We are home! It\'s getting late. Let\'s say good night!', pt: 'Chegamos em casa! Está ficando tarde. Vamos dizer boa noite! Revisão final!' },
      exercises: [
        {
          type: 'choice', pic: '🏠',
          prompt: 'Você entra em casa e anuncia que chegou:',
          options: ['I\'m home!', 'Goodbye!', 'Nice to meet you!'], answer: 0,
          tip: '“I’m home” anuncia uma chegada: “Cheguei!”. Usamos home sem “at”.',
        },
        {
          type: 'match', prompt: 'Toque nos pares de despedidas',
          pairs: [['Take care', 'Cuide-se'], ['See you tomorrow', 'Até amanhã'], ['Have a nice day', 'Tenha um bom dia'],
            ['Good night', 'Boa noite (despedida)'], ['I\'m home', 'Cheguei']],
        },
        {
          type: 'choice', pic: '😴',
          prompt: 'Você vai dormir. O que você diz para a família?',
          options: ['Good evening!', 'Good morning!', 'Good night!'], answer: 2,
          tip: '“Good night” anuncia que alguém vai dormir.',
        },
        {
          type: 'build', pt: 'Está ficando tarde. Boa noite, Pongo!',
          blocks: B('It/s | is getting/v | late./c | Good night, Pongo!/e'),
          extra: B('Good evening/e | get/v'),
        },
        {
          type: 'listen', say: 'See you tomorrow, my friend!',
          blocks: B('See you tomorrow,/e | my friend!/c'),
          extra: B('Take care/e | your/c'),
        },
        {
          type: 'choice', pic: '🚪',
          prompt: '“I\'m going to go.” — o que essa frase faz?',
          options: ['É uma fórmula de cumprimento', 'Anuncia uma intenção: “Vou sair”', 'Significa “Cheguei”'], answer: 1,
          tip: 'Ela anuncia uma intenção. Para encerrar a conversa, combine com “Bye” ou “See you later”.',
        },
        {
          type: 'build', pt: 'As estrelas estão cintilando no céu.',
          blocks: B('The stars/s | are twinkling/v | in the sky./t'),
          extra: B('is twinkling/v | twinkle/v'),
        },
        {
          type: 'build', pt: 'O que você está fazendo?',
          blocks: B('What/c | are/v | you/s | doing?/v'),
          extra: B('do/v | is/v'),
        },
        {
          type: 'build', pt: 'Pongo está aprendendo inglês com você!',
          blocks: B('Pongo/s | is learning/v | English/c | with you!/t'),
          extra: B('are learning/v | learn/v'),
          tip: 'You did it! Você conseguiu!',
        },
      ],
    },
  ];

  const MOTIVATION = [
    'PAWSOME!', 'GREAT JOB!', 'YOU DID IT!', 'AMAZING!', 'WOOF-TASTIC!', 'NAILED IT!',
    'YOU\'RE ON FIRE!', 'SUPERSTAR!', 'HERE WE GO!', 'KEEP GOING!', 'FANTASTIC!', 'BRILLIANT!',
    'WAY TO GO!', 'YOU ROCK!', 'UNSTOPPABLE!',
  ];
  const MOTIVATION_SUB = [
    'Pongo is so proud of you!', 'You are learning so fast!', 'Your English is getting better!',
    'Keep shining like the sun!', 'Let\'s give it another try!', 'You are doing a great job!',
    'Pongo is wagging his tail!', 'One more step to the house!',
  ];
  const OK_SHORT = ['Great job!', 'Awesome!', 'Correct!', 'Nice!', 'Woof, yes!', 'Excellent!', 'Perfect!'];

  window.PongoContent = { UNITS, MOTIVATION, MOTIVATION_SUB, OK_SHORT };

  // Language pack: everything the game engine says that depends on the language.
  window.PongoPack = {
    id: 'en',
    lang: 'en-US',
    saveKey: 'pongo-english-v1',
    docTitle: 'Pongo Learns English',
    start: {
      title: '<span>Pongo</span> Learns English',
      lead: 'O Pongo é um cachorrinho muito sapeca que quer aprender a falar inglês. Ajude-o a atravessar o jardim até a casa do dono, aprendendo <strong>cumprimentos</strong> e o <strong>Present Continuous</strong>.',
      bubble: 'Woof! Hello! I\'m Pongo!',
    },
    roles: { s: 'Sujeito', v: 'Verbo', c: 'Complemento', t: 'Tempo / lugar', e: 'Expressão' },
    buildTitle: 'Traduza: monte a frase em inglês',
    typeTitle: 'Escreva em inglês',
    isTarget: (s) => /[a-z]/i.test(s) && !/[ãçéêíóúâõà+]/i.test(s) && !/\b(o|a|para|ou|de|não|sim|que|uma|um|com)\b/i.test(s),
    lines: [
      ['Woof! Hello, friend!', 'Au! Olá, amigo!'],
      ['I am wagging my tail!', 'Estou abanando o rabo!'],
      ['Let\'s practice together!', 'Vamos praticar juntos!'],
      ['The sun is shining today!', 'O sol está brilhando hoje!'],
      ['I am getting hungry!', 'Estou ficando com fome!'],
      ['Are you ready? Here we go!', 'Você está pronto? Vamos lá!'],
      ['Nice to meet you!', 'Prazer em conhecer você!'],
    ],
    say: {
      notYet: ['Not yet! Finish the lesson before.', 'Ainda não! Termine a lição anterior primeiro.'],
      garden: ['Look! My big garden and my house!', 'Olha! Meu jardim grande e minha casa!'],
      first: ['Woof! Hello! I am Pongo! Let\'s learn English!', 'Au! Olá! Eu sou o Pongo! Vamos aprender inglês! Toque no número 1.'],
      allDone: ['I\'m home! You did it!', 'Cheguei em casa! Você conseguiu! Pratique de novo quando quiser.'],
      welcome: (n, u) => ['Welcome back! Here we go!', `Que bom te ver! Vamos para a lição ${n}: ${u.place}.`],
      next: (i, u) => [`Here we go! Next stop: lesson ${i + 1}!`, `Lá vamos nós! Próxima parada: ${u.place} — “${u.title}”`],
      homeEnd: ['I\'m home! Thank you, my friend!', 'Cheguei! Obrigado, amigo! Você pode praticar qualquer lição de novo.'],
      practice: ['Let\'s practice together!', 'Escolha uma lição no mapa.'],
    },
    result: {
      1: 'You did it!', 2: 'Great job!', 3: 'Perfect! Pawsome!',
      fail: 'Let\'s give it a try!',
      speak: { 1: 'Great job! You did it!', 2: 'Great job! You did it!', 3: 'Perfect! Pawsome!' },
    },
  };
})();
