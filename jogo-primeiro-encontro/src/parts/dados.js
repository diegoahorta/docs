/* =====================================================================
   DADOS: Unidade 8 "Primeiro encontro" (ODU Creative, Japonês A1)
   Blocos: "texto:PAPEL". Papéis do Método ODU Chunking:
   S Sujeito · V Verbo · O Complemento · P Partícula · D (ADV) Expressão.
   "＿" marca a lacuna de um exercício de escolha.
   ===================================================================== */
const ROLE_TAG = { S: 'S', V: 'V', O: 'O', P: 'P', D: 'ADV' };
const READ = ['ゼロ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

const m = (jp, pt, fakes = [], extra = {}) => Object.assign({ t: 'm', jp, pt, fakes }, extra);
const e = o => Object.assign({ t: 'e' }, o);
const n = (o = {}) => Object.assign({ t: 'n' }, o);

/* diálogos da aula: [quem, japonês, português] */
const D1 = [
  ['A', 'はじめまして。', 'Muito prazer.'],
  ['B', 'はじめまして。', 'Muito prazer.'],
  ['A', 'しつれいですが、おなまえは どちらですか。', 'Com licença, qual é o seu nome?'],
  ['B', 'パラインです。', 'Sou Parain.'],
  ['A', 'おつとめは どちらですか。', 'Onde você trabalha?'],
  ['B', 'ABCです。', 'Trabalho na ABC.'],
  ['A', 'そうですか。よろしくおねがいします。', 'Ah, é mesmo? Prazer em conhecê-lo(a).'],
  ['B', 'よろしくおねがいします。', 'O prazer é meu.']
];
const D2 = [
  ['A', 'しつれいですが、でんわばんごうは なんばんですか。', 'Com licença, qual é o número de telefone?'],
  ['B', 'ゼロ、いち、に、さんの よん、ご、ろく、ななです。', 'É 0123-4567.'],
  ['A', '0123-4567ですね。', 'Então é 0123-4567, certo?'],
  ['B', 'はい、そうです。', 'Sim, isso mesmo.'],
  ['A', 'ありがとうございます。', 'Muito obrigado(a).'],
  ['B', 'いいえ。', 'De nada.']
];
const dlg = (lines, k, opts, why) => e({ q: 'O que vem agora no diálogo?', dlg: lines.slice(0, k), who: lines[k][0], opts, ans: lines[k][1], why, pt: lines[k][2] });

/* números de telefone */
function randomPhone() {
  let a = '0', b = '';
  for (let i = 0; i < 3; i++) a += Math.random() * 10 | 0;
  for (let i = 0; i < 4; i++) b += Math.random() * 10 | 0;
  return a + '-' + b;
}
const phoneReading = num => num.split('-').map(g => g.split('').map(d => READ[d]).join('、')).join('の ') + 'です。';
function phoneChunks(num) {
  const [a, b] = num.split('-');
  return [...a.split('').map(d => ({ t: READ[d], r: 'O' })), { t: 'の', r: 'P' }, ...b.split('').map(d => ({ t: READ[d], r: 'O' })), { t: 'です。', r: 'V' }];
}
function similarPhones(num) { // dois números parecidos (dígitos trocados) para a escolha
  const out = new Set([num]);
  while (out.size < 3) {
    const d = num.replace('-', '').split('');
    const i = 1 + (Math.random() * 6 | 0);
    if (Math.random() < 0.5) [d[i], d[i + 1]] = [d[i + 1], d[i]]; else d[i] = String(Math.random() * 10 | 0);
    const s = d.slice(0, 4).join('') + '-' + d.slice(4).join('');
    out.add(s);
  }
  return [...out];
}
function digitWhy(d) {
  return { 0: '0 = ゼロ (também se diz まる).', 4: '4 = よん em números de telefone.', 7: '7 = なな em números de telefone.', 9: '9 = きゅう.' }[d] || `${d} = ${READ[d]}.`;
}
function genNumeros() {
  const ds = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const others = d => shuffle(READ.filter((_, i) => i !== d)).slice(0, 2);
  const items = [];
  ds.slice(0, 3).forEach(d => items.push(e({ q: 'Como se lê este número no telefone?', big: String(d), opts: [READ[d], ...others(d)], ans: READ[d], why: digitWhy(d) })));
  ds.slice(3, 6).forEach(d => items.push(e({ q: 'Que número é este?', big: READ[d], opts: [String(d), ...shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== d)).slice(0, 2).map(String)], ans: String(d), why: digitWhy(d) })));
  const g = '0' + (Math.random() * 10 | 0) + (Math.random() * 10 | 0) + (Math.random() * 10 | 0);
  const rd = s => s.split('').map(x => READ[x]).join('、');
  const variants = new Set([rd(g)]);
  while (variants.size < 3) { const a = g.split(''); const i = 1 + (Math.random() * 3 | 0); a[i] = String((+a[i] + 1 + (Math.random() * 8 | 0)) % 10); variants.add(rd(a.join(''))); }
  items.push(e({ q: 'Leia o grupo de números.', big: g, opts: [...variants], ans: rd(g), why: 'Ao ditar, leia dígito por dígito, com uma pausa (、) entre eles.' }));
  return shuffle(items);
}
function genEscuta() {
  const num = randomPhone();
  return e({ q: `Tanaka dita: ${phoneReading(num)} Qual número você anota?`, opts: similarPhones(num), ans: num, why: `${phoneReading(num)} = ${num}. の marca o hífen entre as duas partes.` });
}

const UNITS = [
  {
    id: 'u1', eyebrow: 'Ponto A', title: 'Pedir informações pessoais', jp: 'おなまえ・おつとめ・ごしゅっしん・おすまい',
    bg: 'var(--s-fill)', edge: 'var(--s-edge)',
    guide: {
      forma: 'しつれいですが、X は どちらですか。',
      funcao: 'Pedir uma informação pessoal de forma cortês a alguém que acabou de conhecer.',
      modo: 'しつれいですが suaviza a pergunta; は marca o tópico; どちらですか pede “qual/onde” de modo polido.',
      exemplo: 'しつれいですが、:D おなまえ:O は:P どちらですか。:D',
      errado: 'おなまえは？', correto: 'しつれいですが、おなまえは どちらですか。',
      erro: 'Fazer a pergunta pessoal de forma abrupta. No primeiro encontro, comece com しつれいですが (“com licença / desculpe perguntar”).',
      obs: 'の liga dois nomes: たなかさんの おすまい = a residência do Sr./Sra. Tanaka. です fecha a resposta: パラインです。'
    },
    levels: [
      {
        id: 'L1', name: 'おなまえ', pt: 'nome', pool: [
          m('しつれいですが、:D おなまえ:O は:P どちらですか。:D', 'Com licença, qual é o seu nome?', ['の', 'を'], { reply: 'パラインです。' }),
          m('はじめまして。:D パライン:O です。:V', 'Muito prazer. Sou Parain.', ['ですか。:V', 'は']),
          m('わたし:S は:P パライン:O です。:V', 'Eu sou Parain.', ['の', 'を']),
          e({ q: 'Como começar a pergunta de forma cortês?', ctx: '＿:D おなまえ:O は:P どちらですか。:D', opts: ['しつれいですが、', 'ありがとうございます。', 'いいえ。'], ans: 'しつれいですが、', why: 'しつれいですが (“com licença / desculpe perguntar”) suaviza a pergunta pessoal no primeiro encontro.', pt: 'Com licença, qual é o seu nome?' }),
          e({ q: 'Qual partícula marca o tópico da pergunta?', ctx: 'しつれいですが、:D おなまえ:O ＿:P どちらですか。:D', opts: ['は', 'の', 'を'], ans: 'は', why: 'は apresenta o tópico sobre o qual você pede informação: おなまえは…', pt: 'Com licença, qual é o seu nome?' }),
          e({ q: 'Complete: “Com licença, qual é o seu nome?”', ctx: 'しつれいですが、:D ＿:O は:P どちらですか。:D', opts: ['おなまえ', 'おすまい', 'おつとめ'], ans: 'おなまえ', why: 'おなまえ = nome. おすまい = residência; おつとめ = trabalho.' }),
          e({ q: 'Tanaka pergunta: おなまえは どちらですか。 O que você responde?', opts: ['パラインです。', 'ABCです。', 'おおさかです。'], ans: 'パラインです。', why: 'A pergunta é sobre o nome: responda Nome + です。 ABC é a empresa; おおさか é a cidade.' }),
          e({ q: 'O que significa はじめまして？', opts: ['Muito prazer (primeiro encontro)', 'Muito obrigado(a)', 'De nada'], ans: 'Muito prazer (primeiro encontro)', why: 'はじめまして é o cumprimento do primeiro encontro. Obrigado = ありがとうございます; de nada = いいえ.' })
        ]
      },
      {
        id: 'L2', name: 'おつとめ・がっこう', pt: 'trabalho · escola', pool: [
          m('しつれいですが、:D おつとめ:O は:P どちらですか。:D', 'Com licença, onde você trabalha?', ['の', 'なんばんですか。:D'], { reply: 'ABCです。' }),
          m('ABC:O です。:V', 'Trabalho na ABC.', ['ですか。:V', 'は']),
          m('がっこう:O は:P どちらですか。:D', 'Qual é a sua escola?', ['の', 'を']),
          m('さくらがっこう:O です。:V', 'É a Escola Sakura.', ['ですか。:V', 'を']),
          m('たなかさん:O の:P おつとめ:O は:P どちらですか。:D', 'Onde o Sr./Sra. Tanaka trabalha?', ['を']),
          e({ q: 'Complete: “Com licença, onde você trabalha?”', ctx: 'しつれいですが、:D ＿:O は:P どちらですか。:D', opts: ['おつとめ', 'おなまえ', 'ごしゅっしん'], ans: 'おつとめ', why: 'おつとめ = trabalho / local de trabalho.' }),
          e({ q: 'Tanaka pergunta: おつとめは どちらですか。 O que você responde?', opts: ['ABCです。', 'パラインです。', 'おおさかです。'], ans: 'ABCです。', why: 'おつとめ pergunta onde você trabalha: responda com a empresa + です。' }),
          e({ q: 'Tanaka pergunta: がっこうは どちらですか。 O que você responde?', opts: ['さくらがっこうです。', 'ABCです。', 'パラインです。'], ans: 'さくらがっこうです。', why: 'がっこう = escola: responda com o nome da escola + です。' }),
          e({ q: 'O que significa おつとめ？', opts: ['trabalho / local de trabalho', 'residência / onde mora', 'origem / terra natal'], ans: 'trabalho / local de trabalho', why: 'おつとめ = trabalho. おすまい = residência; ごしゅっしん = origem.' })
        ]
      },
      {
        id: 'L3', name: 'ごしゅっしん・おすまい', pt: 'origem · residência', pool: [
          m('しつれいですが、:D ごしゅっしん:O は:P どちらですか。:D', 'Com licença, de onde você é?', ['の', 'なんばんですか。:D'], { reply: 'おおさかです。' }),
          m('おおさか:O です。:V', 'Sou de Osaka.', ['ですか。:V', 'の']),
          m('たなかさん:O の:P おすまい:O は:P どちらですか。:D', 'Onde o Sr./Sra. Tanaka mora?', ['を']),
          m('しつれいですが、:D おすまい:O は:P どちらですか。:D', 'Com licença, onde você mora?', ['の', 'を']),
          m('ブラジル:O です。:V', 'Sou do Brasil.', ['ですか。:V', 'は']),
          e({ q: 'Qual partícula liga os dois nomes?', ctx: 'たなかさん:O ＿:P おすまい:O は:P どちらですか。:D', opts: ['の', 'は', 'を'], ans: 'の', why: 'の liga dois nomes: たなかさんの おすまい = a residência do Sr./Sra. Tanaka.', pt: 'Onde o Sr./Sra. Tanaka mora?' }),
          e({ q: 'Complete: “De onde você é?”', ctx: 'しつれいですが、:D ＿:O は:P どちらですか。:D', opts: ['ごしゅっしん', 'おすまい', 'がっこう'], ans: 'ごしゅっしん', why: 'ごしゅっしん = origem / terra natal. おすまい = onde mora.' }),
          e({ q: 'O que significa おすまい？', opts: ['residência / onde mora', 'origem / terra natal', 'escola'], ans: 'residência / onde mora', why: 'おすまい = residência. おすまいは どちらですか。 = Onde você mora?' }),
          e({ q: 'Tanaka pergunta: ごしゅっしんは どちらですか。 O que você responde?', opts: ['おおさかです。', 'ABCです。', 'さくらがっこうです。'], ans: 'おおさかです。', why: 'ごしゅっしん pergunta a origem: responda com a cidade ou o país + です。' })
        ]
      },
      {
        id: 'L4', name: 'こたえかた', pt: 'como responder', distract: 2, pool: [
          m('そうですか。:D よろしくおねがいします。:D', 'Ah, é mesmo? Prazer em conhecê-lo(a).', ['いいえ。:D']),
          m('しつれいですが、:D がっこう:O は:P どちらですか。:D', 'Com licença, qual é a sua escola?', ['の', 'なんばんですか。:D']),
          m('たなかさん:O の:P ごしゅっしん:O は:P どちらですか。:D', 'De onde é o Sr./Sra. Tanaka?', ['を', 'ですか。:V']),
          e({ q: 'Tanaka diz: ABCです。 Reaja de forma natural.', opts: ['そうですか。', 'いいえ。', 'はじめまして。'], ans: 'そうですか。', why: 'そうですか = “Entendo / ah, é mesmo?”: mostra que você ouviu a informação.' }),
          e({ q: 'Qual pergunta tem esta resposta: おおさかです。', opts: ['ごしゅっしんは どちらですか。', 'おつとめは どちらですか。', 'おなまえは どちらですか。'], ans: 'ごしゅっしんは どちらですか。', why: 'おおさか é uma cidade: responde à pergunta de origem (ごしゅっしん).' }),
          e({ q: 'Qual pergunta tem esta resposta: ABCです。', opts: ['おつとめは どちらですか。', 'おすまいは どちらですか。', 'おなまえは どちらですか。'], ans: 'おつとめは どちらですか。', why: 'ABC é a empresa: responde à pergunta de trabalho (おつとめ).' }),
          e({ q: 'Qual pergunta tem esta resposta: パラインです。', opts: ['おなまえは どちらですか。', 'がっこうは どちらですか。', 'ごしゅっしんは どちらですか。'], ans: 'おなまえは どちらですか。', why: 'パライン é um nome: responde a おなまえは どちらですか。' }),
          e({ q: 'Como fechar a resposta de forma polida?', ctx: 'さくらがっこう:O ＿:V', opts: ['です。', 'ですか。', 'どちらですか。'], ans: 'です。', why: 'です fecha a resposta de forma polida. ですか transforma a frase em pergunta.', pt: 'É a Escola Sakura.' })
        ]
      }
    ]
  },
  {
    id: 'u2', eyebrow: 'Ponto B', title: 'Telefone: でんわばんごう', jp: 'ゼロ・いち・に・さん… / なんばんですか / ですね',
    bg: 'var(--o-fill)', edge: 'var(--o-edge)',
    guide: {
      forma: 'しつれいですが、でんわばんごうは なんばんですか。',
      funcao: 'Pedir, informar e confirmar um número de telefone.',
      modo: 'Dite os números com pausas (、). の marca o hífen entre as partes. 〜ですね confirma o que você ouviu.',
      exemplo: 'ゼロ、いち、に、さん:O の:P よん、ご、ろく、なな:O です。:V',
      errado: 'でんわばんごうは どちらですか。', correto: 'でんわばんごうは なんばんですか。',
      erro: 'Usar どちら para pedir o telefone. どちら pergunta “qual/onde”; para número, use なんばん (“que número?”).',
      obs: 'Leituras para telefone: 0 ゼロ/まる, 1 いち, 2 に, 3 さん, 4 よん, 5 ご, 6 ろく, 7 なな, 8 はち, 9 きゅう.'
    },
    levels: [
      { id: 'L5', name: 'すうじ', pt: 'números 0 a 9', gen: genNumeros, count: 7 },
      {
        id: 'L6', name: 'なんばんですか', pt: 'pedir o número', pool: [
          m('しつれいですが、:D でんわばんごう:O は:P なんばんですか。:D', 'Com licença, qual é o número de telefone?', ['の', 'どちらですか。:D'], { reply: 'ゼロ、いち、に、さんの よん、ご、ろく、ななです。' }),
          n({ num: '0123-4567' }), n(), n(),
          e({ q: 'Complete a pergunta do telefone.', ctx: 'でんわばんごう:O は:P ＿:D', opts: ['なんばんですか。', 'どちらですか。', 'ですね。'], ans: 'なんばんですか。', why: 'Para perguntar um número use なんばんですか (“que número?”).', pt: 'Qual é o número de telefone?' }),
          e({ q: 'Qual partícula marca o hífen do número?', ctx: 'ゼロ、いち、に、さん:O ＿:P よん、ご、ろく、なな:O です。:V', opts: ['の', 'は', 'を'], ans: 'の', why: 'Ao ditar, の marca o hífen: 0123-4567 → …さんの よん…', pt: 'É 0123-4567.' }),
          e({ q: 'O que significa でんわばんごう？', opts: ['número de telefone', 'endereço', 'nome'], ans: 'número de telefone', why: 'でんわ = telefone; ばんごう = número.' })
        ]
      },
      {
        id: 'L7', name: 'ですね', pt: 'confirmar', pool: [
          dlg(D2, 2, ['0123-4567ですね。', 'はじめまして。', 'いいえ。'], '〜ですね = “Então é ~, certo?”: confirma o número que você acabou de ouvir.'),
          dlg(D2, 3, ['はい、そうです。', 'そうですか。', 'よろしくおねがいします。'], 'はい、そうです = “Sim, isso mesmo”: confirma que o número está certo.'),
          e({ q: 'Como confirmar o número 0123-4567?', opts: ['0123-4567ですね。', '0123-4567は どちらですか。', 'そうですか。'], ans: '0123-4567ですね。', why: '〜ですね confirma uma informação que você acabou de ouvir.' }),
          m('はい、:D そうです。:D', 'Sim, isso mesmo.', ['いいえ。:D']),
          m('0123-4567:O ですね。:V', 'Então é 0123-4567, certo?', ['ですか。:V', 'は']),
          n(), genEscuta(), genEscuta()
        ]
      }
    ]
  },
  {
    id: 'u3', eyebrow: 'Diálogo', title: 'はじめまして！ Conversa completa', jp: 'そうですか・よろしくおねがいします・いいえ',
    bg: 'var(--d-fill)', edge: 'var(--d-edge)',
    guide: {
      forma: 'はじめまして → おなまえ → ごしゅっしん → おつとめ・がっこう → でんわばんごう → よろしくおねがいします',
      funcao: 'Realizar um diálogo simples de primeiro encontro em registro polido.',
      modo: 'Reaja com そうですか, confirme com 〜ですね, agradeça com ありがとうございます (resposta: いいえ).',
      exemplo: 'そうですか。:D よろしくおねがいします。:D',
      errado: 'ありがとうございます。→ はい、そうです。', correto: 'ありがとうございます。→ いいえ。',
      erro: 'Responder a um agradecimento com はい、そうです. A resposta natural é いいえ (“de nada / não há de quê”).',
      obs: 'Nota ODU: ensine a frase como um bloco comunicativo antes de desmontar cada partícula. Input → intake → output controlado → output livre.'
    },
    levels: [
      {
        id: 'L8', name: 'かいわ 1', pt: 'diálogo: primeiro encontro', ordered: true, pool: [
          dlg(D1, 1, ['はじめまして。', 'いいえ。', 'ABCです。'], 'Responda はじめまして com はじめまして。'),
          dlg(D1, 2, ['しつれいですが、おなまえは どちらですか。', 'おなまえは？', 'はい、そうです。'], 'Peça o nome com cortesia: しつれいですが、おなまえは どちらですか。 (おなまえは？ é abrupto.)'),
          dlg(D1, 3, ['パラインです。', 'おおさかです。', 'そうですか。'], 'A pergunta foi o nome (おなまえ): responda Nome + です。'),
          dlg(D1, 4, ['おつとめは どちらですか。', 'いいえ。', 'はじめまして。'], 'Depois do nome, pergunte o trabalho: おつとめは どちらですか。'),
          dlg(D1, 5, ['ABCです。', 'パラインです。', 'ありがとうございます。'], 'おつとめ = trabalho: responda com a empresa + です。'),
          dlg(D1, 6, ['そうですか。よろしくおねがいします。', 'いいえ。', '0123-4567ですね。'], 'Reaja com そうですか e finalize com よろしくおねがいします。'),
          dlg(D1, 7, ['よろしくおねがいします。', 'はじめまして。', 'はい、そうです。'], 'Responda よろしくおねがいします com よろしくおねがいします。')
        ]
      },
      {
        id: 'L9', name: 'かいわ 2', pt: 'diálogo: troca de contato', ordered: true, pool: [
          m('しつれいですが、:D でんわばんごう:O は:P なんばんですか。:D', 'Com licença, qual é o número de telefone?', ['どちらですか。:D', 'の']),
          dlg(D2, 1, ['ゼロ、いち、に、さんの よん、ご、ろく、ななです。', 'ABCです。', 'おおさかです。'], 'A pergunta foi o telefone: dite o número e feche com です。'),
          dlg(D2, 2, ['0123-4567ですね。', 'はじめまして。', 'いいえ。'], 'Confirme o número com 〜ですね。'),
          dlg(D2, 3, ['はい、そうです。', 'そうですか。', 'よろしくおねがいします。'], 'Para confirmar: はい、そうです。'),
          dlg(D2, 4, ['ありがとうございます。', 'しつれいですが、', 'はい、そうです。'], 'Agradeça: ありがとうございます。'),
          dlg(D2, 5, ['いいえ。', 'はい、そうです。', 'ありがとうございます。'], 'Para responder a um agradecimento: いいえ。 (de nada)')
        ]
      },
      {
        id: 'L10', name: 'ていねいに', pt: 'cortesia', distract: 2, pool: [
          e({ q: 'Primeiro encontro com um cliente. Como perguntar o nome?', opts: ['しつれいですが、おなまえは どちらですか。', 'おなまえは？'], ans: 'しつれいですが、おなまえは どちらですか。', why: 'おなまえは？ é abrupto. A forma curta existe em contextos informais, mas no primeiro encontro use o registro polido.' }),
          e({ q: 'Qual pergunta é mais adequada para um colega novo?', opts: ['しつれいですが、ごしゅっしんは どちらですか。', 'ごしゅっしんは？', 'ごしゅっしんですね。'], ans: 'しつれいですが、ごしゅっしんは どちらですか。', why: 'Comece com しつれいですが e termine com どちらですか.' }),
          e({ q: 'Você acabou de ouvir o número. Como confirmar?', opts: ['0123-4567ですね。', 'そうですか。', 'いいえ。'], ans: '0123-4567ですね。', why: '〜ですね = “Então é ~, certo?”' }),
          e({ q: 'Como encerrar a apresentação?', opts: ['よろしくおねがいします。', 'いいえ。', 'はい、そうです。'], ans: 'よろしくおねがいします。', why: 'よろしくおねがいします fecha o primeiro encontro (“conto com você / prazer”).' }),
          e({ q: 'Tanaka diz: ありがとうございます。 Responda.', opts: ['いいえ。', 'はい、そうです。', 'はじめまして。'], ans: 'いいえ。', why: 'Aqui いいえ significa “de nada / não há de quê”.' }),
          e({ q: 'Tanaka diz: さくらがっこうです。 Mostre que entendeu.', opts: ['そうですか。', 'しつれいですが、', 'なんばんですか。'], ans: 'そうですか。', why: 'そうですか = “Entendo / ah, é mesmo?”' }),
          m('しつれいですが、:D おすまい:O は:P どちらですか。:D', 'Com licença, onde você mora?', ['の', 'なんばんですか。:D'])
        ]
      },
      {
        id: 'L11', name: 'はじめまして！', pt: 'Final Challenge', boss: true, ordered: true, distract: 2, pool: [
          e({ stage: 'Etapa 1 · Cumprimento', q: 'Tanaka se aproxima. Cumprimente.', opts: ['はじめまして。', 'いいえ。', 'そうですか。'], ans: 'はじめまして。', why: 'はじめまして abre o primeiro encontro.', reply: 'はじめまして。' }),
          m('しつれいですが、:D おなまえ:O は:P どちらですか。:D', 'Pergunte o nome com cortesia.', ['の', 'なんばんですか。:D'], { stage: 'Etapa 2 · Nome', reply: 'たなかです。' }),
          m('しつれいですが、:D ごしゅっしん:O は:P どちらですか。:D', 'Pergunte de onde Tanaka é.', ['の', 'を'], { stage: 'Etapa 3 · Origem', reply: 'おおさかです。' }),
          m('おつとめ:O は:P どちらですか。:D', 'Pergunte onde Tanaka trabalha.', ['の', 'なんばんですか。:D'], { stage: 'Etapa 4 · Trabalho', reply: 'ABCです。' }),
          e({ stage: 'Etapa 4 · Trabalho', q: 'Tanaka: ABCです。 Reaja.', opts: ['そうですか。', 'いいえ。', 'ですね。'], ans: 'そうですか。', why: 'そうですか mostra que você ouviu.' }),
          m('しつれいですが、:D でんわばんごう:O は:P なんばんですか。:D', 'Peça o número de telefone.', ['どちらですか。:D', 'の'], { stage: 'Etapa 5 · Telefone', reply: 'ゼロ、きゅう、ご、いちの さん、なな、よん、はちです。' }),
          n({ stage: 'Etapa 5 · Telefone', q: 'Agora Tanaka pede o seu. Dite o número:' }),
          e({ stage: 'Etapa 6 · Encerramento', q: 'Finalize o encontro.', opts: ['よろしくおねがいします。', 'いいえ。', '0123-4567ですね。'], ans: 'よろしくおねがいします。', why: 'よろしくおねがいします fecha o encontro.', reply: 'こちらこそ、よろしくおねがいします。' })
        ]
      }
    ]
  }
];
const LEVELS = UNITS.flatMap(u => u.levels.map(l => Object.assign(l, { unit: u })));

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = a => a[Math.random() * a.length | 0];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isJP = s => /[぀-ヿ一-龯]/.test(s);

function parse(str) {
  return str.trim().split(/\s+/).map(tok => {
    const i = tok.lastIndexOf(':');
    return i < 0 ? { t: tok, r: 'P' } : { t: tok.slice(0, i), r: tok.slice(i + 1) };
  });
}
const exampleChunks = parse;
const sentenceText = chunks => chunks.map(c => c.t).join('');
function chunkHTML(c, extra = '') {
  return `<span class="chunk static r-${c.r} ${extra}"><span class="tag">${ROLE_TAG[c.r]}</span>${esc(c.t)}</span>`;
}

/* ---------- progresso salvo ---------- */
const SAVE_KEY = 'hajimemashite-quest-v1';
let state = { done: {}, best: {}, xp: 0, music: true, sfx: true, seen: {} };
function load(data) {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s) state = Object.assign(state, s); } catch (err) { /* sem storage */ }
  if (data && data.state) state = Object.assign(state, data.state);
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (err) { /* sem storage */ } }
const isUnlocked = i => i === 0 || !!state.done[LEVELS[i - 1].id];

