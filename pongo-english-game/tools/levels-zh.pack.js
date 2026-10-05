
  const MOTIVATION = [
    ['太棒了！', 'tài bàng le · Incrível!'], ['加油！', 'jiāyóu · Força!'], ['真厉害！', 'zhēn lìhai · Mandou bem!'],
    ['好极了！', 'hǎo jí le · Excelente!'], ['完美！', 'wánměi · Perfeito!'], ['你真棒！', 'nǐ zhēn bàng · Você é demais!'],
    ['没问题！', 'méi wèntí · Sem problema!'], ['厉害！', 'lìhai · Fera!'],
  ];
  const OK_SHORT = ['对了！Isso!', '很好！Muito bem!', '太好了！Ótimo!', '正确！Correto!', '真棒！Demais!'];

  window.PongoContent = { UNITS, MOTIVATION, MOTIVATION_SUB: [], OK_SHORT };

  window.PongoPack = {
    id: 'zh',
    lang: 'zh-CN',
    saveKey: 'pongo-mandarim-v1',
    docTitle: 'Pongo Aprende Mandarim',
    bodyClass: 'lang-zh',
    start: {
      title: '<span>Pongo</span> aprende <span class="zh">中文</span>',
      lead: 'Agora o Pongo quer aprender <strong>mandarim</strong>! Ajude-o a atravessar o jardim montando frases em <strong>chunks coloridos</strong>, com tons e pinyin, a partir do manual <strong>Mandarim Básico I</strong>.',
      bubble: '汪汪！我是庞戈！',
      feat: 'Frases em <b>chunks</b>',
    },
    roles: { s: 'Sujeito', e: 'Advérbio / tempo', v: 'Verbo', c: 'Objeto', t: 'Partícula' },
    buildTitle: 'Monte a frase em chinês',
    typeTitle: 'Escreva',
    isTarget: (s) => /[一-鿿]/.test(s) && !/[a-zà-úāáǎàēéěèīíǐìōóǒòūúǔù]/i.test(s),
    lines: [
      ['汪汪！你好！', 'wāngwāng! nǐ hǎo! · Au-au! Olá!'],
      ['我是庞戈！', 'wǒ shì Páng Gē · Eu sou o Pongo!'],
      ['我们一起学中文吧！', 'wǒmen yìqǐ xué Zhōngwén ba · Vamos estudar chinês juntos!'],
      ['我饿了！', 'wǒ è le · Fiquei com fome!'],
      ['加油！', 'jiāyóu · Força!'],
      ['中文很有意思！', 'Zhōngwén hěn yǒu yìsi · O chinês é interessante!'],
    ],
    say: {
      notYet: ['还不行！', 'hái bù xíng · Ainda não! Termine a lição anterior primeiro.'],
      garden: ['这是我家！', 'zhè shì wǒ jiā · Esta é a minha casa! Olha o jardim inteiro!'],
      first: ['汪汪！你好！我是庞戈！', 'Au-au! Olá! Eu sou o Pongo e quero aprender mandarim! Toque no número 1.'],
      allDone: ['我们到家了！太棒了！', 'wǒmen dào jiā le! tài bàng le! · Chegamos em casa! Incrível!'],
      welcome: (n, u) => ['欢迎回来！', `huānyíng huílai · Que bom te ver de novo! Vamos para a lição ${n}: ${u.place}.`],
      next: (i, u) => ['走吧！加油！', `zǒu ba! jiāyóu! · Vamos! Próxima parada: ${u.place} — ${u.title}`],
      homeEnd: ['我到家了！谢谢你！', 'wǒ dào jiā le! xièxie nǐ! · Cheguei em casa! Obrigado, amigo!'],
      practice: ['我们一起练习吧！', 'Vamos praticar juntos! Escolha uma lição no mapa.'],
    },
    result: {
      1: '很好！', 2: '真棒！', 3: '太棒了！',
      fail: '再试一次！',
      speak: { 1: '很好！', 2: '真棒！', 3: '太棒了！你真棒！' },
    },
  };
