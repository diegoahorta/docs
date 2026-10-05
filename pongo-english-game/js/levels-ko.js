/* Pongo Aprende Hangul - Korean content pack.
 * Based on the ODU Creative booklet "한글 — Hangul em Blocos" (6 modules x 3 topics):
 * history and logic of Hangul, simple vowels, simple consonants, double
 * consonants / compound vowels / batchim, reading real words and first
 * expressions, pronunciation and study plan.
 *
 * Romanization is adapted to Brazilian Portuguese, with one consistent table:
 *   ㅏ a  ㅓ ó  ㅗ ô  ㅜ u  ㅡ û  ㅣ i  ㅐ é  ㅔ ê  ㅑ ia  ㅕ ió  ㅛ iô  ㅠ iu
 *   ㅘ uá  ㅝ uó  ㅚ uê  ㅟ ui  ㅢ ûi
 *   ㄱ g/k  ㄴ n  ㄷ d/t  ㄹ r/l  ㅁ m  ㅂ b/p  ㅅ s/ch  ㅇ (mudo)/ng  ㅈ dj
 *   ㅊ tch  ㅋ k  ㅌ t  ㅍ p  ㅎ r (áspero)
 *
 * Block colours (roles): s = consoante (azul), v = vogal (verde),
 * t = sílaba pronta (lilás), e = expressão / palavra (laranja).
 * Exercises with `compose: true` build Hangul blocks from letters (jamo);
 * the game shows the block forming live (js/hangul.js).
 */
(function () {
  'use strict';

  const VOWELS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  // "ㅎ ㅏ ㄴ" -> [["ㅎ","s"],["ㅏ","v"],["ㄴ","s"]]
  const J = (str) => str.split(' ').filter(Boolean).map((c) => [c, VOWELS.includes(c) ? 'v' : 's']);
  // "감 사 합" -> syllable blocks
  const S = (str, role = 't') => str.split(' ').filter(Boolean).map((c) => [c, role]);

  // building a block from letters, showing the target in Hangul
  const block = (target, rom, meaning, letters, extra, tip) => ({
    type: 'build', compose: true, kind: 'Oficina de blocos', title: 'Monte o bloco com as letras',
    pt: `${target}  ·  ${rom}${meaning ? ' — ' + meaning : ''}`,
    target, meaning: meaning ? `${rom} · ${meaning}` : rom, blocks: J(letters), extra: J(extra), tip,
  });
  // writing from sound + meaning only (no Hangul shown)
  const write = (target, rom, meaning, letters, extra, tip) => ({
    type: 'build', compose: true, kind: 'Escreva em hangul', title: 'Escreva em hangul',
    pt: `Como se escreve “${meaning}” (${rom})?`,
    target, meaning: '', blocks: J(letters), extra: J(extra), tip,
  });
  // listening, then building from letters
  const hear = (target, rom, meaning, letters, extra, tip) => ({
    type: 'listen', compose: true, kind: 'Ouça e monte', title: 'Ouça e monte o bloco',
    say: target, sayHint: rom, prompt: meaning ? `(${meaning})` : '', target, meaning: '',
    blocks: J(letters), extra: J(extra), tip,
  });

  const UNITS = [
    {
      id: 1, node: 'LVL_1', place: 'Portão', color: '#2f86c9',
      title: '한글 · O Hangul', topic: 'Módulo 1 · História e lógica dos blocos',
      intro: { en: '멍멍! 안녕하세요! 저는 퐁고예요!', pt: 'Au-au! Olá! Eu sou o Pongo (퐁고). O hangul foi projetado para ser fácil: vamos descobrir como ele funciona!' },
      exercises: [
        {
          type: 'choice', pic: '👑', prompt: 'Quem mandou criar o hangul, em 1443?',
          options: ['O rei Sejong, o Grande', 'O imperador Qin', 'O rei Taejo'], answer: 0,
          tip: 'Os eruditos da Academia dos Dignos criaram o hangul sob o comando do rei Sejong. Ele foi promulgado em 1446, no Hunminjeongeum (훈민정음).',
        },
        {
          type: 'choice', pic: '📜', prompt: '훈민정음 (Hunminjeongeum) significa…',
          options: ['“Os sons corretos para instruir o povo”', '“A grande escrita do rei”', '“As letras da China”'], answer: 0,
          tip: 'Antes do hangul, escrevia-se com caracteres chineses, difíceis demais para o povo comum.',
        },
        {
          type: 'choice', pic: '🔤', prompt: 'Quantas letras tem o hangul atual?',
          options: ['40: 19 consoantes + 21 vogais', '26: como o alfabeto latino', '24: só as letras básicas'], answer: 0,
          tip: 'São 14 consoantes simples + 5 duplas e 10 vogais simples + 11 compostas.',
        },
        {
          type: 'choice', pic: '👄', prompt: 'A consoante ㅁ desenha…',
          options: ['a boca fechada', 'a garganta', 'os dentes'], answer: 0,
          tip: 'As consoantes básicas imitam a boca: ㄱ e ㄴ mostram a língua, ㅁ a boca, ㅅ os dentes e ㅇ a garganta.',
        },
        {
          type: 'match', prompt: 'Toque nos pares correspondentes',
          pairs: [['한글', 'escrita coreana'], ['한국어', 'língua coreana'], ['한류', 'onda coreana'], ['자음', 'consoantes'], ['모음', 'vogais']],
        },
        block('아', 'a', '', 'ㅇ ㅏ', 'ㅓ ㄴ', 'Quando a sílaba começa com som de vogal, o ㅇ entra mudo, só para segurar o lugar.'),
        block('한', 'han', 'grande', 'ㅎ ㅏ ㄴ', 'ㅓ ㄱ', 'Consoante + vogal + consoante final (batchim): ㅎ + ㅏ + ㄴ.'),
        block('글', 'gûl', 'escrita', 'ㄱ ㅡ ㄹ', 'ㅏ ㄴ', 'ㅡ é uma vogal horizontal: ela fica embaixo da consoante.'),
        {
          type: 'choice', pic: '🧱', prompt: 'Num bloco, onde fica a vogal ㅗ?',
          options: ['Embaixo da consoante', 'À direita da consoante', 'Antes da consoante'], answer: 0,
          tip: 'Vogais verticais (ㅏ ㅓ ㅣ) ficam à direita; vogais horizontais (ㅗ ㅜ ㅡ) ficam embaixo.',
        },
      ],
    },
    {
      id: 2, node: 'LVL_2', place: 'Canteiro de flores', color: '#d23a4f',
      title: '모음 · Vogais', topic: 'Módulo 2 · As vogais simples',
      intro: { en: '아, 어, 오, 우, 으, 이!', pt: 'a, ó, ô, u, û, i! As vogais são o coração de cada bloco. Quase todas existem no português!' },
      exercises: [
        {
          type: 'match', prompt: 'Vogal ↔ som',
          pairs: [['ㅏ', 'a (pai)'], ['ㅓ', 'ó (avó)'], ['ㅗ', 'ô (avô)'], ['ㅜ', 'u (luz)'], ['ㅡ', 'û (sem arredondar)'], ['ㅣ', 'i (filho)']],
        },
        {
          type: 'choice', pic: '😁', prompt: 'Qual vogal é um “u” dito sorrindo, sem arredondar os lábios?',
          options: ['ㅡ', 'ㅜ', 'ㅗ'], answer: 0,
          tip: 'Diga “i” e, sem mexer a língua, estique os lábios para os lados: esse é o ㅡ.',
        },
        {
          type: 'choice', say: '오이', sayHint: 'ô-i', title: 'Ouça e escolha', prompt: 'Qual palavra o Pongo disse?',
          options: ['오이', '어이', '우이'], answer: 0, tip: '오이 (ô-i) = pepino. ㅗ é o “ô” fechado.',
        },
        block('우유', 'u-iu', 'leite', 'ㅇ ㅜ ㅇ ㅠ', 'ㅗ ㅛ', 'Dois blocos com ㅇ mudo: 우 + 유.'),
        {
          type: 'choice', pic: '➕', prompt: 'Regra do traço: ㅏ + mais um traço vira…',
          options: ['ㅑ (ia)', 'ㅓ (ó)', 'ㅐ (é)'], answer: 0,
          tip: '1 traço = vogal pura; 2 traços = a mesma vogal com “i” na frente: ㅏ→ㅑ, ㅓ→ㅕ, ㅗ→ㅛ, ㅜ→ㅠ.',
        },
        block('요가', 'iô-ga', 'ioga', 'ㅇ ㅛ ㄱ ㅏ', 'ㅕ ㅑ', 'ㅛ = “i” + ㅗ (iô).'),
        {
          type: 'choice', pic: '🐶', prompt: 'Como se escreve “cachorro” (ké)? Igual ao Pongo!',
          options: ['개', '게', '가'], answer: 0,
          tip: '개 usa ㅐ (é aberto). 게 (com ㅔ, ê fechado) é “caranguejo”: na fala os dois sons quase se fundiram.',
        },
        write('아이', 'a-i', 'criança', 'ㅇ ㅏ ㅇ ㅣ', 'ㅓ ㅡ', 'ㅇ mudo + ㅏ, depois ㅇ mudo + ㅣ.'),
        hear('여우', 'ió-u', 'raposa', 'ㅇ ㅕ ㅇ ㅜ', 'ㅛ ㅗ', '여우 = raposa. ㅕ = “i” + ㅓ (ió).'),
      ],
    },
    {
      id: 3, node: 'LVL_3', place: 'Lago', color: '#1cb0f6',
      title: '자음 · Consoantes', topic: 'Módulo 3 · Suaves, aspiradas e nasais',
      intro: { en: '가, 나, 다, 라, 마!', pt: 'ga, na, da, ra, ma! O coreano tem três famílias de consoantes. Vamos conhecer as simples.' },
      exercises: [
        {
          type: 'match', prompt: 'Consoante ↔ som',
          pairs: [['ㄱ', 'g / k'], ['ㄴ', 'n'], ['ㄷ', 'd / t'], ['ㄹ', 'r / l'], ['ㅁ', 'm'], ['ㅂ', 'b / p']],
        },
        {
          type: 'choice', pic: '🗣️', prompt: 'Antes de ㅣ, a consoante ㅅ soa como…',
          options: ['“ch” (시 = chi)', '“s” (시 = si)', '“t” (시 = ti)'], answer: 0,
          tip: 'ㅅ é “s”, mas vira “ch” antes de sons de i: 시간 (chi-gan) = tempo, 시계 (chi-guê) = relógio.',
        },
        {
          type: 'choice', say: '카', sayHint: 'ka (com sopro)', title: 'Ouça e escolha', prompt: 'Suave ou aspirada? Qual sílaba o Pongo disse?',
          options: ['가', '카'], answer: 1, tip: 'Teste da mão: em ㅋ você sente o jato de ar; em ㄱ, quase nada.',
        },
        block('나무', 'na-mu', 'árvore', 'ㄴ ㅏ ㅁ ㅜ', 'ㄹ ㅓ', 'ㄴ é o “n” de nada; ㅁ é o “m” de mão.'),
        block('사랑', 'sa-rang', 'amor', 'ㅅ ㅏ ㄹ ㅏ ㅇ', 'ㄴ ㅈ', 'No fim do bloco, ㅇ soa “ng”: 랑 = rang.'),
        {
          type: 'choice', pic: '🔔', prompt: 'No final do bloco (como em 강), ㅇ soa…',
          options: ['“ng”, como em “sing”', 'mudo', '“o”'], answer: 0,
          tip: 'ㅇ tem dupla personalidade: mudo no início, “ng” no final.',
        },
        hear('포도', 'pô-dô', 'uva', 'ㅍ ㅗ ㄷ ㅗ', 'ㅂ ㅌ', 'ㅍ é o “p” com sopro.'),
        write('하늘', 'ra-nûl', 'céu', 'ㅎ ㅏ ㄴ ㅡ ㄹ', 'ㅜ ㅓ', 'ㅎ é um sopro áspero, como o “r” de “carro”.'),
        write('다리', 'da-ri', 'perna / ponte', 'ㄷ ㅏ ㄹ ㅣ', 'ㅌ ㄴ', 'ㄹ entre vogais é um “r” de um toque só, como em “para”.'),
      ],
    },
    {
      id: 4, node: 'LVL_4', place: 'Árvore grande', color: '#ff9600',
      title: '받침 · Duplas e batchim', topic: 'Módulo 4 · Tensas, compostas e consoante final',
      intro: { en: '가, 카, 까!', pt: 'ga, ka, kka! Suave, aspirada e tensa. Hoje você fecha o alfabeto inteiro!' },
      exercises: [
        {
          type: 'choice', say: '까', sayHint: 'kka (tensa, sem sopro)', title: 'Ouça e escolha', prompt: 'O trio: qual delas o Pongo disse?',
          options: ['가', '카', '까'], answer: 2, tip: 'As duplas são tensas: garganta apertada e nenhum sopro.',
        },
        {
          type: 'match', prompt: 'Consoante dupla ↔ som',
          pairs: [['ㄲ', 'kk'], ['ㄸ', 'tt'], ['ㅃ', 'pp'], ['ㅆ', 'ss'], ['ㅉ', 'djj']],
        },
        block('딸기', 'ttal-gui', 'morango', 'ㄸ ㅏ ㄹ ㄱ ㅣ', 'ㄷ ㅌ', 'ㄸ = ㄷ dobrado: o mesmo “t”, só que tenso.'),
        block('사과', 'sa-guá', 'maçã / desculpa', 'ㅅ ㅏ ㄱ ㅘ', 'ㅗ ㅏ', 'ㅘ = ㅗ + ㅏ (uá). Em vogal composta, a consoante fica no canto esquerdo.'),
        {
          type: 'choice', pic: '7️⃣', prompt: 'Quantos sons diferentes o batchim (consoante final) pode ter?',
          options: ['7', '14', '27'], answer: 0,
          tip: 'Regra dos 7: no final, tudo vira ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ ou ㅇ (k, n, t, l, m, p, ng).',
        },
        {
          type: 'choice', pic: '👕', prompt: 'Em 옷 (roupa), o ㅅ final soa como…',
          options: ['um “t” travado', '“s”', '“ch”'], answer: 0,
          tip: 'ㅅ, ㅈ, ㅊ, ㅌ e ㅎ no final soam como “t” travado, sem soltar o ar: 옷 = ôt.',
        },
        hear('밥', 'pap', 'arroz / refeição', 'ㅂ ㅏ ㅂ', 'ㅍ ㅁ', 'ㅂ final: lábios fechados, sem estourar.'),
        block('의사', 'ûi-sa', 'médico', 'ㅇ ㅢ ㅅ ㅏ', 'ㅡ ㅟ', 'ㅢ = ㅡ + ㅣ falados juntos, rápido: “ûi”.'),
        write('원', 'uón', 'won, a moeda', 'ㅇ ㅝ ㄴ', 'ㅘ ㅁ', 'ㅝ = ㅜ + ㅓ (uó).'),
      ],
    },
    {
      id: 5, node: 'LVL_5', place: 'Casinha do Pongo', color: '#8e44ad',
      title: '단어 · Primeiras palavras', topic: 'Módulo 5 · Oficina de blocos e 12 palavras',
      intro: { en: '물, 집, 책, 친구!', pt: 'Água, casa, livro, amigo! Alfabeto completo: agora é ler palavras de verdade.' },
      exercises: [
        block('산', 'san', 'montanha', 'ㅅ ㅏ ㄴ', 'ㅓ ㅁ', 'Ritual: (1) consoante, (2) vogal, (3) batchim embaixo de tudo.'),
        {
          type: 'match', prompt: 'Palavra ↔ significado',
          pairs: [['물', 'água'], ['집', 'casa'], ['책', 'livro'], ['친구', 'amigo(a)'], ['커피', 'café']],
        },
        {
          type: 'choice', pic: '🏫', prompt: 'Qual destas palavras é “escola” (rak-kkiô)?',
          options: ['학교', '한국', '시간'], answer: 0,
          tip: '학교 se escreve hak-gyo, mas soa “rak-kkiô”: o batchim ㄱ deixa o ㄱ seguinte tenso.',
        },
        {
          type: 'build', joined: true, kind: 'Monte a palavra', title: 'Monte a palavra com as sílabas',
          pt: 'Língua coreana (ran-gu-gó)', blocks: S('한 국 어'), extra: S('글 거'),
          tip: '한국어 = 한 + 국 + 어: três blocos, três sílabas. Na fala, o ㄱ de 국 passa para a sílaba seguinte: “ran-gu-gó”.',
        },
        write('커피', 'kó-pi', 'café', 'ㅋ ㅓ ㅍ ㅣ', 'ㅗ ㅂ', 'Palavra emprestada do inglês “coffee”: ㅋ e ㅍ com sopro.'),
        hear('친구', 'tchin-gu', 'amigo', 'ㅊ ㅣ ㄴ ㄱ ㅜ', 'ㅈ ㅋ', 'ㅊ é o “tch” de “tchau” com sopro.'),
        {
          type: 'choice', pic: '🇧🇷', prompt: '“Brasil” escrito em hangul é…',
          options: ['브라질', '부라질', '브라실'], answer: 0,
          tip: 'Para consoantes sem vogal, o coreano usa ㅡ: 브-라-질 (bû-ra-djil).',
        },
        write('시간', 'chi-gan', 'tempo / hora', 'ㅅ ㅣ ㄱ ㅏ ㄴ', 'ㅈ ㅓ', 'ㅅ antes de ㅣ soa “ch”.'),
        {
          type: 'choice', pic: '📅', prompt: '내일 (né-il) significa…',
          options: ['amanhã', 'hoje', 'ontem'], answer: 0, tip: '내일 = amanhã.',
        },
      ],
    },
    {
      id: 6, node: 'LVL_6', place: 'Horta de frutinhas', color: '#6a2bd9',
      title: '안녕하세요 · Expressões', topic: 'Módulo 5 · Fale desde o dia 1',
      intro: { en: '안녕하세요! 감사합니다!', pt: 'Olá! Obrigado! As expressões educadas terminam em 요 ou em 니다. Decore como blocos inteiros.' },
      exercises: [
        {
          type: 'match', prompt: 'Expressão ↔ significado',
          pairs: [['안녕하세요', 'Olá'], ['감사합니다', 'Obrigado(a)'], ['죄송합니다', 'Desculpe'], ['네', 'Sim'], ['아니요', 'Não']],
        },
        {
          type: 'choice', pic: '👋', prompt: 'Você encontra o vizinho. Como cumprimentar com educação?',
          options: ['안녕하세요', '감사합니다', '죄송합니다'], answer: 0,
          tip: '안녕하세요 (an-nióng-ra-sê-iô) = olá / como vai?',
        },
        {
          type: 'build', joined: true, kind: 'Monte a expressão', title: 'Monte a expressão com as sílabas',
          pt: 'Olá! (an-nióng-ra-sê-iô)', blocks: S('안 녕 하 세 요'), extra: S('새 효'),
          tip: '안녕하세요 pergunta, ao pé da letra: “você está em paz?”.',
        },
        {
          type: 'listen', joined: true, kind: 'Ouça e monte', title: 'Ouça e monte com as sílabas',
          say: '감사합니다', sayHint: 'kam-sa-ram-ni-da', blocks: S('감 사 합 니 다'), extra: S('삼 함'),
          tip: '감사합니다 = obrigado(a), formal. O ㅂ de 합 soa “m” antes de ㄴ.',
        },
        {
          type: 'choice', pic: '🙇', prompt: 'Nas expressões educadas, o final 요 indica…',
          options: ['fala educada', 'uma pergunta', 'o passado'], answer: 0,
          tip: '요 é a marca da fala educada do dia a dia: 아니요, 안녕하세요, 뭐예요?',
        },
        {
          type: 'choice', pic: '🤝', prompt: 'Alguém diz “안녕하세요!”. Uma boa resposta é…',
          options: ['네, 안녕하세요!', '아니요!', '죄송합니다!'], answer: 0,
          tip: '네, 안녕하세요 = “sim, olá!”.',
        },
        {
          type: 'build', kind: 'Monte a pergunta', title: 'Monte a pergunta',
          pt: 'Qual é o seu nome? (i-rû-mi muó-iê-iô)', blocks: [['이름이', 'e'], ['뭐예요?', 'e']], extra: [['감사합니다', 'e']],
          tip: '이름 = nome; 이 marca o sujeito; 뭐예요? = o que é?',
        },
        {
          type: 'choice', say: '죄송합니다', sayHint: 'djuê-song-ram-ni-da', title: 'Ouça e escolha', prompt: 'O que o Pongo disse?',
          options: ['Desculpe', 'Obrigado', 'Olá'], answer: 0, tip: '죄송합니다 = desculpe (formal).',
        },
      ],
    },
    {
      id: 7, node: 'LVL_7', place: 'Porta da frente', color: '#36912a',
      title: '화이팅! · Revisão', topic: 'Módulo 6 · Pronúncia e revisão final',
      intro: { en: '불, 풀, 뿔! 화이팅!', pt: 'Fogo, grama, chifre! Treine os contrastes que o português não tem. Força!' },
      exercises: [
        {
          type: 'choice', say: '불', sayHint: 'pul (suave)', title: 'Ouça e escolha', prompt: 'Suave, aspirada ou tensa?',
          options: ['불 (fogo)', '풀 (grama)', '뿔 (chifre)'], answer: 0, tip: '불 = fogo: ㅂ suave, quase sem ar.',
        },
        {
          type: 'choice', say: '풀', sayHint: 'pul (com sopro)', title: 'Ouça e escolha', prompt: 'E agora?',
          options: ['불 (fogo)', '풀 (grama)', '뿔 (chifre)'], answer: 1, tip: '풀 = grama / cola: ㅍ com jato de ar.',
        },
        {
          type: 'choice', say: '뿔', sayHint: 'ppul (tensa)', title: 'Ouça e escolha', prompt: 'Última do trio!',
          options: ['불 (fogo)', '풀 (grama)', '뿔 (chifre)'], answer: 2, tip: '뿔 = chifre: ㅃ tenso, garganta apertada.',
        },
        {
          type: 'choice', pic: '🌬️', prompt: 'Em 바람 (pa-ram, vento), o ㄹ soa como…',
          options: ['um “r” de um toque só, como em “para”', 'o “rr” de “carro”', 'um “l” bem forte'], answer: 0,
          tip: 'Entre vogais, ㄹ é um toque rápido da língua no céu da boca.',
        },
        {
          type: 'choice', pic: '🩼', prompt: 'Qual é o jeito certo de usar a romanização?',
          options: ['Como muleta nas primeiras semanas, e depois largar', 'Sempre, no lugar do hangul', 'Nunca: só áudio'], answer: 0,
          tip: 'Romanização embaixo, hangul em cima. Cubra a romanização antes de ler em voz alta.',
        },
        {
          type: 'match', prompt: 'Palavra ↔ significado',
          pairs: [['읽기', 'leitura'], ['쓰기', 'escrita'], ['듣기', 'escuta'], ['바람', 'vento'], ['마음', 'coração / mente']],
        },
        write('한글', 'ran-gûl', 'escrita coreana', 'ㅎ ㅏ ㄴ ㄱ ㅡ ㄹ', 'ㅓ ㅜ', 'Você já escreve o nome do alfabeto!'),
        hear('마음', 'ma-ûm', 'coração / mente', 'ㅁ ㅏ ㅇ ㅡ ㅁ', 'ㅜ ㄴ', 'ㅇ mudo no início do segundo bloco; ㅁ final.'),
        {
          type: 'build', joined: true, kind: 'Monte a palavra', title: 'Monte a palavra com as sílabas',
          pt: 'Força! Você consegue! (hwa-i-ting)', blocks: S('화 이 팅'), extra: S('하 땅'),
          tip: '화이팅! Vem do inglês “fighting” e é o grito de torcida coreano.',
        },
      ],
    },
  ];

  const MOTIVATION = [
    ['화이팅!', 'hwa-i-ting · Força!'], ['잘했어요!', 'tchal-ré-ssó-iô · Muito bem!'], ['대박!', 'té-bak · Incrível!'],
    ['최고!', 'tchuê-gô · O melhor!'], ['짱!', 'tchang · Demais!'], ['멋져요!', 'mót-djó-iô · Que legal!'],
    ['완벽해요!', 'uan-bió-ké-iô · Perfeito!'], ['좋아요!', 'djô-a-iô · Ótimo!'], ['천재!', 'tchón-djé · Gênio!'],
  ];
  const OK_SHORT = ['잘했어요! Muito bem!', '맞아요! Isso mesmo!', '좋아요! Ótimo!', '정답! Resposta certa!', '최고! O melhor!'];

  window.PongoContent = { UNITS, MOTIVATION, MOTIVATION_SUB: [], OK_SHORT };

  window.PongoPack = {
    id: 'ko',
    lang: 'ko-KR',
    saveKey: 'pongo-hangul-v1',
    docTitle: 'Pongo Aprende Hangul',
    bodyClass: 'lang-ko',
    start: {
      title: '<span>Pongo</span> aprende <span class="ko">한글</span>',
      lead: 'Agora o Pongo quer aprender <strong>coreano</strong>! Ajude-o a atravessar o jardim montando <strong>blocos em hangul</strong>: das vogais e consoantes até as primeiras palavras e expressões.',
      bubble: '멍멍! 저는 퐁고예요!',
      feat: 'Sílabas em <b>blocos</b>',
    },
    roles: { s: 'Consoante', v: 'Vogal', t: 'Sílaba', e: 'Palavra' },
    buildTitle: 'Monte com os blocos',
    typeTitle: 'Escreva',
    isTarget: (s) => /[가-힣]/.test(s) && !/[a-zà-ú]/i.test(s),
    lines: [
      ['멍멍! 안녕하세요!', 'meong-meong! an-nióng-ra-sê-iô · Au-au! Olá!'],
      ['저는 퐁고예요!', 'djó-nûn pông-gô-iê-iô · Eu sou o Pongo!'],
      ['같이 공부해요!', 'ka-tchi kông-bu-ré-iô · Vamos estudar juntos!'],
      ['한글은 재미있어요!', 'ran-gû-rûn djé-mi-i-ssó-iô · Hangul é divertido!'],
      ['배고파요!', 'pé-gô-pa-iô · Estou com fome!'],
      ['화이팅!', 'hwa-i-ting · Força!'],
    ],
    say: {
      notYet: ['아직이요!', 'a-dji-gi-iô · Ainda não! Termine a lição anterior primeiro.'],
      garden: ['우리 집이에요!', 'u-ri dji-bi-ê-iô · É a minha casa! Olha o jardim inteiro!'],
      first: ['멍멍! 안녕하세요! 저는 퐁고예요!', 'Au-au! Olá! Eu sou o Pongo e quero aprender coreano! Toque no número 1.'],
      allDone: ['다 했어요! 대박!', 'ta ré-ssó-iô! té-bak! · Terminamos tudo! Incrível!'],
      welcome: (n, u) => ['다시 만나서 반가워요!', `Que bom te ver de novo! Vamos para a lição ${n}: ${u.place}.`],
      next: (i, u) => ['가자! 화이팅!', `ka-dja! · Vamos! Próxima parada: ${u.place} — ${u.title}`],
      homeEnd: ['집에 왔어요! 고마워요!', 'Cheguei em casa! Obrigado, amigo! Pratique qualquer lição de novo.'],
      practice: ['같이 연습해요!', 'Vamos praticar juntos! Escolha uma lição no mapa.'],
    },
    result: {
      1: '잘했어요!', 2: '대박!', 3: '완벽해요!',
      fail: '다시 해요!',
      speak: { 1: '잘했어요!', 2: '대박! 잘했어요!', 3: '완벽해요! 최고!' },
    },
  };
})();
