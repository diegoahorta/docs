/* Pongo and the Prepositions - English content pack (nível A1).
 * Preposições de lugar (in, on, under, next to, between, behind, in front of),
 * de tempo (at, on, in), de movimento (to, from, into, out of), lugares do dia
 * a dia (at home, in the garden, on the bus) e outras de uso básico
 * (with, for, by, about). Tema: "Where's Pongo?".
 *
 * Cores dos blocos: e = PREPOSIÇÃO (laranja, o foco do jogo), s = sujeito (azul),
 * v = verbo (verde), c = lugar / objeto (amarelo), t = tempo (lilás).
 * Os distratores dos blocos são outras preposições, para o aluno escolher a certa.
 */
(function () {
  'use strict';

  const B = (str) => str.split('|').map((p) => {
    const i = p.lastIndexOf('/');
    return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
  });
  const build = (pt, blocks, extra, tip) => ({ type: 'build', kind: 'Monte a frase', pt, blocks: B(blocks), extra: B(extra), tip });
  const listen = (say, prompt, blocks, extra, tip) => ({ type: 'listen', say, sayHint: say, prompt, blocks: B(blocks), extra: B(extra), tip });
  const pic = (pic, prompt, options, answer, tip) => ({ type: 'choice', kind: 'Where\'s Pongo?', title: 'Olhe a cena e escolha', pic, prompt, options, answer, tip });
  const certa = (right, wrong, prompt, tip) => {
    const options = Math.random() < 0.5 ? [right, wrong] : [wrong, right];
    return { type: 'choice', kind: 'Erro comum', title: 'Qual frase está certa?', pic: '🔎', prompt, options, answer: options.indexOf(right), tip };
  };

  const UNITS = [
    {
      id: 1, node: 'LVL_1', place: 'Portão', color: '#2f86c9',
      title: 'In, on, under', topic: 'Dentro, em cima e embaixo',
      intro: { en: 'Woof! Where is my ball? Is it in the box? Is it under the table?', pt: 'Au! Onde está a minha bola? Dentro da caixa? Embaixo da mesa? Vamos aprender in, on e under!' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares', pairs: [['in', 'dentro de'], ['on', 'em cima de'], ['under', 'embaixo de'], ['box', 'caixa'], ['table', 'mesa']] },
        pic('🐶📦', 'O Pongo está DENTRO da caixa.', ['Pongo is on the box.', 'Pongo is in the box.', 'Pongo is under the box.'], 1, 'in = dentro de.'),
        pic('🦴🛏️', 'O osso está EMBAIXO da cama.', ['The bone is under the bed.', 'The bone is on the bed.', 'The bone is in the bed.'], 0, 'under = embaixo de.'),
        pic('🐱🚗', 'O gato está EM CIMA do carro.', ['The cat is in the car.', 'The cat is under the car.', 'The cat is on the car.'], 2, 'on = em cima de (encostado na superfície).'),
        build('A bola está embaixo da mesa.', 'The ball/s | is/v | under/e | the table/c', 'on/e | in/e', 'under the table = embaixo da mesa.'),
        build('O Pongo está na caixa.', 'Pongo/s | is/v | in/e | the box/c', 'on/e | under/e', 'in the box = dentro da caixa.'),
        { type: 'fill', sentence: 'The cat is ___ the sofa. (em cima do sofá)', options: ['in', 'on', 'under'], answer: 1, tip: 'on the sofa = em cima do sofá.' },
        listen('The book is on the chair.', '(O livro está em cima da cadeira.)', 'The book/s | is/v | on/e | the chair/c', 'in/e | under/e', 'on = em cima de.'),
        { type: 'choice', pic: '❓', prompt: '"Where is Pongo?" significa…', options: ['Onde está o Pongo?', 'Quem é o Pongo?', 'Como está o Pongo?'], answer: 0,
          tip: 'Where = onde. Resposta: "He\'s under the table."' },
      ],
    },
    {
      id: 2, node: 'LVL_2', place: 'Canteiro de flores', color: '#d23a4f',
      title: 'Next to, between, behind', topic: 'Ao lado, entre, atrás e na frente',
      intro: { en: 'I am hiding behind the flowers! Can you find me?', pt: 'Estou escondido atrás das flores! Você me acha? Hoje: next to, between, behind e in front of.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares', pairs: [['next to', 'ao lado de'], ['between', 'entre'], ['behind', 'atrás de'], ['in front of', 'na frente de'], ['near', 'perto de']] },
        pic('🐶🏠', 'O Pongo está ATRÁS da casinha.', ['Pongo is behind the doghouse.', 'Pongo is in front of the doghouse.', 'Pongo is between the doghouse.'], 0, 'behind = atrás de.'),
        build('O banco fica ao lado do parque.', 'The bank/s | is/v | next to/e | the park/c', 'behind/e | between/e', 'next to = ao lado de.'),
        build('O Pongo está entre a mesa e a cadeira.', 'Pongo/s | is/v | between/e | the table and the chair/c', 'next/e | in front/e',
          'between A and B = entre A e B.'),
        certa('The cat is in front of the TV.', 'The cat is in front the TV.', 'O gato está na frente da TV.', 'Não esqueça o of: in front OF.'),
        certa('The school is next to the park.', 'The school is next the park.', 'A escola fica ao lado do parque.', 'Não esqueça o to: next TO.'),
        { type: 'fill', sentence: 'The ball is ___ the two trees. (entre)', options: ['behind', 'between', 'on'], answer: 1, tip: 'between = entre (duas coisas).' },
        listen('The car is in front of the house.', '(O carro está na frente da casa.)', 'The car/s | is/v | in front of/e | the house/c', 'behind/e | next/e', 'in front of = na frente de.'),
        { type: 'choice', pic: '↔️', prompt: 'Qual é o oposto de "behind"?', options: ['next to', 'in front of', 'under'], answer: 1, tip: 'behind (atrás) × in front of (na frente).' },
      ],
    },
    {
      id: 3, node: 'LVL_3', place: 'Lago', color: '#1cb0f6',
      title: 'At, on, in · Tempo', topic: 'at 7 o\'clock, on Monday, in July',
      intro: { en: 'I swim in the lake on Saturday at ten o\'clock!', pt: 'Eu nado no lago no sábado às dez! Hoje: at, on e in para falar de tempo.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares', pairs: [['at 7 o\'clock', 'às 7 horas'], ['on Monday', 'na segunda-feira'], ['in July', 'em julho'], ['in the morning', 'de manhã'], ['at night', 'à noite']] },
        { type: 'choice', pic: '📌', prompt: 'Qual regra está certa?', options: ['at = horas; on = dias; in = meses, anos e partes do dia', 'at = dias; on = meses; in = horas', 'in = horas; at = meses; on = anos'], answer: 0,
          tip: 'at 7 o\'clock · on Monday · in July, in 2026, in the morning (exceção: at night).' },
        build('Eu acordo às sete horas.', 'I/s | wake up/v | at/e | seven o\'clock/t', 'on/e | in/e', 'Horas: at.'),
        build('Minha aula é na segunda-feira.', 'My class/s | is/v | on/e | Monday/t', 'in/e | at/e', 'Dias da semana: on.'),
        { type: 'fill', sentence: 'My birthday is ___ July.', options: ['on', 'at', 'in'], answer: 2, tip: 'Meses: in July.' },
        certa('I study in the morning.', 'I study on the morning.', 'Eu estudo de manhã.', 'Partes do dia: in the morning, in the afternoon, in the evening.'),
        certa('Pongo sleeps at night.', 'Pongo sleeps in night.', 'O Pongo dorme à noite.', 'Exceção: at night.'),
        listen('We play in the afternoon.', '(Nós brincamos à tarde.)', 'We/s | play/v | in/e | the afternoon/t', 'at/e | on/e', 'in the afternoon = à tarde.'),
        { type: 'fill', sentence: 'See you ___ Friday!', options: ['in', 'on', 'at'], answer: 1, tip: 'on Friday = na sexta-feira.' },
      ],
    },
    {
      id: 4, node: 'LVL_4', place: 'Árvore grande', color: '#ff9600',
      title: 'To, from, into', topic: 'Para onde e de onde',
      intro: { en: 'I run to the big tree and I jump into the leaves!', pt: 'Corro até a árvore grande e pulo dentro das folhas! Hoje: to, from, into e out of.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares', pairs: [['to', 'para (destino)'], ['from', 'de (origem)'], ['into', 'para dentro de'], ['out of', 'para fora de']] },
        build('Eu vou para a escola.', 'I/s | go/v | to/e | school/c', 'at/e | in/e', 'Destino: to.'),
        build('Eu sou do Brasil.', 'I/s | am/v | from/e | Brazil/c', 'to/e | of/e', 'Origem: from.'),
        pic('🐶➡️🏠', 'O Pongo corre PARA DENTRO de casa.', ['Pongo runs into the house.', 'Pongo runs out of the house.', 'Pongo runs from the house.'], 0, 'into = movimento para dentro.'),
        pic('🏠➡️🐶', 'O Pongo corre PARA FORA de casa.', ['Pongo runs into the house.', 'Pongo runs on the house.', 'Pongo runs out of the house.'], 2, 'out of = movimento para fora.'),
        certa('I go home.', 'I go to home.', 'Eu vou para casa.', 'Com home não se usa to: go home, come home.'),
        { type: 'fill', sentence: 'Where are you ___? — I\'m from Brazil.', options: ['to', 'from', 'in'], answer: 1, tip: 'Where are you from? = De onde você é?' },
        listen('Pongo jumps into the pool.', '(O Pongo pula dentro da piscina.)', 'Pongo/s | jumps/v | into/e | the pool/c', 'out/e | from/e', 'into = para dentro de.'),
        build('Ela volta do trabalho às seis.', 'She/s | comes back/v | from/e | work/c | at six/t', 'to/e | in/e', 'from work = do trabalho; at six = às seis.'),
      ],
    },
    {
      id: 5, node: 'LVL_5', place: 'Casinha do Pongo', color: '#8e44ad',
      title: 'At home, on the bus', topic: 'at, in e on com lugares do dia a dia',
      intro: { en: 'I am at home. My house is in the garden!', pt: 'Estou em casa. Minha casinha fica no jardim! Hoje: at home, in the garden, on the bus.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares', pairs: [['at home', 'em casa'], ['at school', 'na escola'], ['at work', 'no trabalho'], ['in the garden', 'no jardim'], ['on the bus', 'no ônibus']] },
        { type: 'choice', pic: '🏠', prompt: '"Estou em casa."', options: ['I\'m in home.', 'I\'m at home.', 'I\'m on home.'], answer: 1, tip: 'at home, at school, at work: lugares de rotina.' },
        build('O Pongo está no jardim.', 'Pongo/s | is/v | in/e | the garden/c', 'at/e | on/e', 'in = dentro de um espaço: in the garden, in the kitchen.'),
        build('Ela está no ônibus.', 'She/s | is/v | on/e | the bus/c', 'in/e | at/e', 'Transportes grandes: on the bus, on the train, on the plane.'),
        certa('My mom is at work.', 'My mom is in work.', 'Minha mãe está no trabalho.', 'at work = no trabalho.'),
        { type: 'fill', sentence: 'The kids are ___ school.', options: ['on', 'at', 'in'], answer: 1, tip: 'at school = na escola.' },
        { type: 'choice', pic: '🚗🚌', prompt: 'Por que "in the car", mas "on the bus"?', options: ['No carro você fica sentado dentro; no ônibus, trem e avião você anda lá dentro', 'Porque o carro é menor que a casa', 'Não tem diferença'], answer: 0,
          tip: 'in the car, in a taxi × on the bus, on the train, on the plane.' },
        listen('I live in Brazil.', '(Eu moro no Brasil.)', 'I/s | live/v | in/e | Brazil/c', 'at/e | on/e', 'Países e cidades: in.'),
        build('Eu moro na Rua das Flores.', 'I/s | live/v | on/e | Flower Street/c', 'in/e | at/e', 'Rua: on; cidade e país: in; endereço com número: at.'),
      ],
    },
    {
      id: 6, node: 'LVL_6', place: 'Horta de frutinhas', color: '#6a2bd9',
      title: 'With, for, by', topic: 'Com, para, de ônibus e sobre',
      intro: { en: 'These berries are for you! Let\'s eat them with my friends!', pt: 'Estas frutinhas são para você! Vamos comer com os meus amigos! Hoje: with, for, by e about.' },
      exercises: [
        { type: 'match', prompt: 'Toque nos pares', pairs: [['with', 'com'], ['without', 'sem'], ['for', 'para (alguém)'], ['by bus', 'de ônibus'], ['about', 'sobre']] },
        build('Eu brinco com o Pongo.', 'I/s | play/v | with/e | Pongo/c', 'for/e | by/e', 'with = com.'),
        build('Este presente é para você.', 'This gift/s | is/v | for/e | you/c', 'with/e | to/e', 'for = para (alguém).'),
        build('Eu vou à escola de ônibus.', 'I/s | go/v | to school/c | by/e | bus/c', 'with/e | on/e', 'Transporte sem artigo: by bus, by car, by train.'),
        { type: 'fill', sentence: 'I go to work ___ car.', options: ['with', 'by', 'in'], answer: 1, tip: 'by car = de carro.' },
        certa('I go to school on foot.', 'I go to school by foot.', 'Eu vou à escola a pé.', 'A pé = on foot.'),
        { type: 'choice', pic: '📕🐶', prompt: '"Um livro SOBRE cachorros."', options: ['a book for dogs', 'a book about dogs', 'a book with dogs'], answer: 1, tip: 'about = sobre (assunto).' },
        listen('Pongo walks with me every day.', '(O Pongo passeia comigo todo dia.)', 'Pongo/s | walks/v | with/e | me/c | every day/t', 'for/e | by/e', 'with me = comigo.'),
        { type: 'choice', pic: '☕', prompt: '"Café COM leite, por favor."', options: ['Coffee for milk, please.', 'Coffee without milk, please.', 'Coffee with milk, please.'], answer: 2, tip: 'with = com; without = sem.' },
      ],
    },
    {
      id: 7, node: 'LVL_7', place: 'Porta da frente', color: '#36912a',
      title: 'Where\'s Pongo? · Revisão', topic: 'Todas as preposições juntas',
      intro: { en: 'I am home! Now find me in the house!', pt: 'Cheguei em casa! Agora me encontre dentro da casa! Revisão final.' },
      exercises: [
        pic('🐶🛋️', 'O Pongo está EM CIMA do sofá.', ['Pongo is under the sofa.', 'Pongo is on the sofa.', 'Pongo is between the sofa.'], 1, 'on the sofa.'),
        pic('🐶🚪', 'O Pongo está ATRÁS da porta.', ['Pongo is behind the door.', 'Pongo is in front of the door.', 'Pongo is into the door.'], 0, 'behind the door.'),
        build('O Pongo está embaixo da cama de manhã.', 'Pongo/s | is/v | under/e | the bed/c | in/e | the morning/t', 'on/e | at/e',
          'Lugar: under the bed; tempo: in the morning.'),
        build('No sábado, eu vou ao parque com o Pongo.', 'On Saturday,/t | I/s | go/v | to the park/c | with/e | Pongo/c', 'In Saturday,/t | at the park/c',
          'on Saturday · to the park · with Pongo.'),
        certa('The party is at 8 o\'clock.', 'The party is on 8 o\'clock.', 'A festa é às 8 horas.', 'Horas: at.'),
        certa('See you on Monday!', 'See you in Monday!', 'Até segunda!', 'Dias: on.'),
        { type: 'fill', sentence: 'I\'m ___ the kitchen. (na cozinha)', options: ['at', 'on', 'in'], answer: 2, tip: 'in the kitchen = dentro da cozinha.' },
        listen('The bone is next to the bowl.', '(O osso está ao lado da tigela.)', 'The bone/s | is/v | next to/e | the bowl/c', 'behind/e | on/e', 'next to = ao lado de.'),
        build('Obrigado por brincar com o Pongo!', 'Thank you/v | for/e | playing/v | with/e | Pongo/c', 'to/e | of/e', 'Thank you FOR + ação: thank you for playing!'),
      ],
    },
  ];

  const MOTIVATION = ['PAWSOME!', 'GREAT JOB!', 'YOU DID IT!', 'AMAZING!', 'WOOF-TASTIC!', 'NAILED IT!', 'SUPERSTAR!', 'FANTASTIC!', 'YOU ROCK!'];
  const MOTIVATION_SUB = [
    'You found Pongo!', 'Pongo is so proud of you!', 'Your English is getting better!', 'In, on, under: easy!',
    'Pongo is wagging his tail!', 'One more step to the house!', 'You are a preposition pro!',
  ];
  const OK_SHORT = ['Great job!', 'Awesome!', 'Correct!', 'Nice!', 'Woof, yes!', 'Excellent!', 'Perfect!'];

  window.PongoContent = { UNITS, MOTIVATION, MOTIVATION_SUB, OK_SHORT };

  window.PongoPack = {
    id: 'en',
    lang: 'en-US',
    saveKey: 'pongo-prepositions-v1',
    docTitle: 'Pongo and the Prepositions',
    start: {
      title: '<span>Pongo</span> and the Prepositions',
      lead: 'Onde está o Pongo? Ajude o cachorrinho mais sapeca do jardim a aprender as <strong>preposições em inglês</strong> (nível A1): <strong>in, on, under</strong>, <strong>next to, behind</strong>, <strong>at, on, in</strong> para o tempo e muito mais.',
      bubble: 'Woof! Where\'s Pongo?',
      feat: 'Preposições em <b>blocos</b>',
    },
    roles: { s: 'Sujeito', v: 'Verbo', e: 'Preposição', c: 'Lugar / objeto', t: 'Tempo' },
    buildTitle: 'Monte a frase em inglês',
    typeTitle: 'Escreva em inglês',
    isTarget: (s) => /[a-z]/i.test(s) && !/[ãçéêíóúâõà+]/i.test(s) && !/\b(o|para|ou|de|não|sim|que|uma|um|com|em|na|no|da|do)\b/i.test(s),
    lines: [
      ['Woof! Where\'s my ball?', 'Au! Cadê a minha bola?'],
      ['I\'m under the table!', 'Estou embaixo da mesa!'],
      ['I\'m behind the tree!', 'Estou atrás da árvore!'],
      ['My bone is in my house!', 'Meu osso está na minha casinha!'],
      ['Let\'s play in the garden!', 'Vamos brincar no jardim!'],
      ['I sleep at night!', 'Eu durmo à noite!'],
    ],
    say: {
      notYet: ['Not yet! Finish the lesson before.', 'Ainda não! Termine a lição anterior primeiro.'],
      garden: ['Look! I\'m in the garden, next to my house!', 'Olha! Estou no jardim, ao lado da minha casinha!'],
      first: ['Woof! Hello! Where\'s Pongo? I\'m here, next to the gate!', 'Au! Olá! Estou aqui, ao lado do portão! Toque no número 1.'],
      allDone: ['I\'m at home! You did it!', 'Estou em casa! Você conseguiu! Pratique de novo quando quiser.'],
      welcome: (n, u) => ['Welcome back! Let\'s go to the next stop!', `Que bom te ver! Vamos para a lição ${n}: ${u.place}.`],
      next: (i, u) => [`I'm going to lesson ${i + 1}!`, `Lá vou eu! Próxima parada: ${u.place} — “${u.title}”`],
      homeEnd: ['I\'m at home! Thank you for playing with me!', 'Cheguei em casa! Obrigado por brincar comigo!'],
      practice: ['Let\'s practice together!', 'Escolha uma lição no mapa.'],
    },
    result: {
      1: 'You did it!', 2: 'Great job!', 3: 'Perfect! Pawsome!',
      fail: 'Let\'s give it a try!',
      speak: { 1: 'Great job! You did it!', 2: 'Great job! You did it!', 3: 'Perfect! Pawsome!' },
    },
  };
})();
