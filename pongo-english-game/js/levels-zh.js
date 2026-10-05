/* Pongo aprende 中文 - Mandarin content pack.
 * GERADO por tools/gen_levels_zh.py a partir de odu-mandarim/content.json
 * (manual Mandarim Básico I — Método Chunk). Edite o gerador, não este arquivo.
 * Cores dos blocos = cores do manual: S azul, ADV laranja, V verde, O amarelo, PART lilás. */
(function () {
  'use strict';
  const UNITS = [
 {
  "id": 1,
  "node": "LVL_1",
  "place": "Portão",
  "color": "#2f86c9",
  "title": "你好！· Olá!",
  "topic": "Lições 1–3 · 是, 吗, 也, 的, 在哪儿, 多少钱",
  "intro": {
   "en": "汪汪！你好！我是庞戈！",
   "pt": "wāngwāng! nǐ hǎo! wǒ shì Páng Gē · Au-au! Olá! Eu sou o Pongo. Vamos aprender a nos apresentar!"
  },
  "exercises": [
   {
    "type": "match",
    "prompt": "Toque nos pares correspondentes",
    "pairs": [
     [
      "你好",
      "Olá"
     ],
     [
      "谢谢",
      "Obrigado(a)"
     ],
     [
      "老师",
      "professor(a)"
     ],
     [
      "学生",
      "estudante"
     ],
     [
      "朋友",
      "amigo(a)"
     ]
    ]
   },
   {
    "type": "choice",
    "pic": "🗣️",
    "prompt": "Como se fala 你好 de verdade?",
    "options": [
     "nǐ hǎo (os dois no 3º tom)",
     "ní hǎo",
     "nì hāo"
    ],
    "answer": 1,
    "tip": "Dois 3º tons seguidos: o primeiro vira 2º tom. Escreve-se nǐ hǎo, fala-se ní hǎo."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 1 · Identificação com 是",
    "pt": "Eu sou o Mark.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "是",
      "v"
     ],
     [
      "马克",
      "c"
     ]
    ],
    "extra": [
     [
      "中国人",
      "c"
     ],
     [
      "王老师",
      "s"
     ]
    ],
    "tip": "Wǒ shì Mǎkè. — A 是 B"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 1 · Perguntas com 吗",
    "pt": "Você é estudante?",
    "blocks": [
     [
      "你",
      "s"
     ],
     [
      "是",
      "v"
     ],
     [
      "学生",
      "c"
     ],
     [
      "吗",
      "t"
     ]
    ],
    "extra": [
     [
      "她",
      "s"
     ],
     [
      "巴西人",
      "c"
     ]
    ],
    "tip": "Nǐ shì xuésheng ma? — A 是 B 吗？"
   },
   {
    "type": "choice",
    "kind": "Lição 1 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "\"Também\" com 也",
    "options": [
     "我也是学生。",
     "也我是学生。"
    ],
    "answer": 0,
    "tip": "Colocar 也 no início ou no fim da frase, como \"também\" em português. 也 é advérbio e vem antes do verbo."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 2 · Posse com 的",
    "pt": "Este é o meu livro.",
    "blocks": [
     [
      "这",
      "s"
     ],
     [
      "是",
      "v"
     ],
     [
      "我的书",
      "c"
     ]
    ],
    "extra": [
     [
      "马克的词典",
      "c"
     ],
     [
      "老师的伞",
      "c"
     ]
    ],
    "tip": "Zhè shì wǒ de shū. — N1 的 N2 （我的书、马克的词典）"
   },
   {
    "type": "listen",
    "joined": true,
    "kind": "Lição 2 · Ouça e monte",
    "say": "这是什么",
    "sayHint": "Zhè shì shénme?",
    "prompt": "(O que é isto?)",
    "blocks": [
     [
      "这",
      "s"
     ],
     [
      "是",
      "v"
     ],
     [
      "什么",
      "c"
     ]
    ],
    "extra": [
     [
      "那",
      "s"
     ],
     [
      "谁的伞",
      "c"
     ]
    ],
    "tip": "Zhè shì shénme? — O que é isto?"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 3 · Onde fica: 在哪儿",
    "pt": "Onde fica o banco?",
    "blocks": [
     [
      "银行",
      "s"
     ],
     [
      "在",
      "v"
     ],
     [
      "哪儿",
      "c"
     ]
    ],
    "extra": [
     [
      "那儿",
      "c"
     ],
     [
      "马克",
      "s"
     ]
    ],
    "tip": "Yínháng zài nǎr? — N 在 哪儿？"
   },
   {
    "type": "choice",
    "kind": "Lição 3 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Preço: 多少钱",
    "options": [
     "这个多少钱？",
     "这个是多少钱吗？"
    ],
    "answer": 0,
    "tip": "Acrescentar 吗 à pergunta de preço. 多少 já é interrogativo; 吗 sobra, e 是 costuma ficar de fora."
   }
  ]
 },
 {
  "id": 2,
  "node": "LVL_2",
  "place": "Canteiro de flores",
  "color": "#d23a4f",
  "title": "很好！· Adjetivos e rotina",
  "topic": "Lições 4–6 · 很, 不, 了, 没, 去, 坐",
  "intro": {
   "en": "今天很热！",
   "pt": "jīntiān hěn rè · Hoje está quente! Vamos descrever coisas e falar da rotina."
  },
  "exercises": [
   {
    "type": "match",
    "prompt": "Toque nos pares correspondentes",
    "pairs": [
     [
      "便宜",
      "barato"
     ],
     [
      "贵",
      "caro"
     ],
     [
      "冷",
      "frio"
     ],
     [
      "热",
      "quente"
     ],
     [
      "忙",
      "ocupado"
     ]
    ]
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 4 · Adjetivo como predicado: 很 + adj",
    "pt": "Este hotel é barato.",
    "blocks": [
     [
      "这个饭店",
      "s"
     ],
     [
      "很",
      "e"
     ],
     [
      "便宜",
      "v"
     ]
    ],
    "extra": [
     [
      "贵",
      "v"
     ],
     [
      "大",
      "v"
     ]
    ],
    "tip": "Zhège fàndiàn hěn piányi. — N 很 adj"
   },
   {
    "type": "choice",
    "kind": "Lição 4 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Adjetivo como predicado: 很 + adj",
    "options": [
     "这个饭店很便宜。",
     "这个饭店是便宜。"
    ],
    "answer": 0,
    "tip": "Usar 是 antes de adjetivo, copiando o \"é\" do português. Com adjetivos, 是 sai e entra 很."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 4 · Negativa: 不 + adj",
    "pt": "Hoje não está frio.",
    "blocks": [
     [
      "今天",
      "s"
     ],
     [
      "不",
      "e"
     ],
     [
      "冷",
      "v"
     ]
    ],
    "extra": [
     [
      "这个饭店",
      "s"
     ],
     [
      "难",
      "v"
     ]
    ],
    "tip": "Jīntiān bù lěng. — N 不 adj"
   },
   {
    "type": "choice",
    "pic": "🎵",
    "prompt": "不 + 是 se pronuncia…",
    "options": [
     "bù shì",
     "bǔ shì",
     "bú shì"
    ],
    "answer": 2,
    "tip": "不 vira bú antes de 4º tom: 不是 bú shì, 不贵 bú guì.",
    "say": "不是",
    "sayHint": "bú shì",
    "title": "Ouça e escolha"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 5 · Tempo antes do verbo",
    "pt": "Eu me levanto às sete.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "七点",
      "e"
     ],
     [
      "起床",
      "v"
     ]
    ],
    "extra": [
     [
      "中文",
      "c"
     ],
     [
      "去",
      "v"
     ]
    ],
    "tip": "Wǒ qī diǎn qǐchuáng. — S + tempo + V (+ O)"
   },
   {
    "type": "choice",
    "kind": "Lição 5 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Negação do passado: 没(有)",
    "options": [
     "我昨天没去学校了。",
     "我昨天没去学校。"
    ],
    "answer": 1,
    "tip": "Manter 了 na negativa. Com 没, o 了 sai: 没去, nunca 没去了."
   },
   {
    "type": "listen",
    "joined": true,
    "kind": "Lição 6 · Ouça e monte",
    "say": "我坐地铁去学校",
    "sayHint": "Wǒ zuò dìtiě qù xuéxiào.",
    "prompt": "(Vou à escola de metrô.)",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "坐地铁",
      "e"
     ],
     [
      "去",
      "v"
     ],
     [
      "学校",
      "c"
     ]
    ],
    "extra": [
     [
      "马克",
      "s"
     ],
     [
      "北京",
      "c"
     ]
    ],
    "tip": "Wǒ zuò dìtiě qù xuéxiào. — Vou à escola de metrô."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 6 · Destino: 去 / 来 / 回 + lugar",
    "pt": "Aonde você foi ontem?",
    "blocks": [
     [
      "你",
      "s"
     ],
     [
      "昨天",
      "e"
     ],
     [
      "去",
      "v"
     ],
     [
      "哪儿",
      "c"
     ],
     [
      "了",
      "t"
     ]
    ],
    "extra": [
     [
      "明天",
      "e"
     ],
     [
      "下个月",
      "e"
     ]
    ],
    "tip": "Nǐ zuótiān qù nǎr le? — S + 去/来/回 + lugar"
   }
  ]
 },
 {
  "id": 3,
  "node": "LVL_3",
  "place": "Lago",
  "color": "#1cb0f6",
  "title": "我喜欢中国菜 · Gostos",
  "topic": "Lições 7–9 · 用, 给, 已经, classificadores, 喜欢, 会",
  "intro": {
   "en": "我喜欢吃饺子！",
   "pt": "wǒ xǐhuan chī jiǎozi · Eu gosto de comer jiaozi! Hoje: gostos, posses e habilidades."
  },
  "exercises": [
   {
    "type": "match",
    "prompt": "Toque nos pares correspondentes",
    "pairs": [
     [
      "书",
      "livro"
     ],
     [
      "咖啡",
      "café"
     ],
     [
      "筷子",
      "hashi"
     ],
     [
      "喜欢",
      "gostar"
     ],
     [
      "会",
      "saber fazer"
     ]
    ]
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 7 · Instrumento: 用",
    "pt": "Eu como com hashi.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "用筷子",
      "e"
     ],
     [
      "吃",
      "v"
     ],
     [
      "饭",
      "c"
     ]
    ],
    "extra": [
     [
      "用手机",
      "e"
     ],
     [
      "她",
      "s"
     ]
    ],
    "tip": "Wǒ yòng kuàizi chī fàn. — S + 用 + instrumento + V + O"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 7 · 已经…了 ／ 还没…呢",
    "pt": "Eu já comi.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "已经",
      "e"
     ],
     [
      "吃",
      "v"
     ],
     [
      "饭",
      "c"
     ],
     [
      "了",
      "t"
     ]
    ],
    "extra": [
     [
      "还没",
      "e"
     ],
     [
      "家",
      "c"
     ]
    ],
    "tip": "Wǒ yǐjīng chī fàn le. — S + 已经 + V + 了 ／ S + 还没 + V + 呢"
   },
   {
    "type": "choice",
    "kind": "Lição 8 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Classificadores",
    "options": [
     "这本书很有意思。",
     "这书很有意思。"
    ],
    "answer": 0,
    "tip": "Omitir o classificador. Entre 这 / 那 / número e o substantivo, o classificador é obrigatório."
   },
   {
    "type": "choice",
    "pic": "📚",
    "prompt": "Qual classificador vai com 书 (livro)?",
    "options": [
     "杯",
     "本",
     "张"
    ],
    "answer": 1,
    "tip": "本 é o classificador de livros e cadernos: 一本书."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 8 · Posse: 有 / 没有",
    "pt": "O Mark não tem carro.",
    "blocks": [
     [
      "马克",
      "s"
     ],
     [
      "没有",
      "v"
     ],
     [
      "车",
      "c"
     ]
    ],
    "extra": [
     [
      "我",
      "s"
     ],
     [
      "一个哥哥",
      "c"
     ]
    ],
    "tip": "Mǎkè méiyǒu chē. — S + 有 / 没有 + N"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 9 · Habilidade aprendida: 会",
    "pt": "Eu sei falar chinês.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "会",
      "e"
     ],
     [
      "说",
      "v"
     ],
     [
      "中文",
      "c"
     ]
    ],
    "extra": [
     [
      "马克",
      "s"
     ],
     [
      "她",
      "s"
     ]
    ],
    "tip": "Wǒ huì shuō Zhōngwén. — S + 会 + V + O"
   },
   {
    "type": "listen",
    "joined": true,
    "kind": "Lição 9 · Ouça e monte",
    "say": "马克喜欢喝咖啡",
    "sayHint": "Mǎkè xǐhuan hē kāfēi.",
    "prompt": "(O Mark gosta de tomar café.)",
    "blocks": [
     [
      "马克",
      "s"
     ],
     [
      "喜欢",
      "v"
     ],
     [
      "喝咖啡",
      "c"
     ]
    ],
    "extra": [
     [
      "什么运动",
      "c"
     ],
     [
      "你",
      "s"
     ]
    ],
    "tip": "Mǎkè xǐhuan hē kāfēi. — O Mark gosta de tomar café."
   },
   {
    "type": "choice",
    "kind": "Lição 9 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Habilidade aprendida: 会",
    "options": [
     "我知道说中文。",
     "我会说中文。"
    ],
    "answer": 1,
    "tip": "Traduzir \"saber falar\" com 知道. 知道 = saber uma informação; habilidade aprendida é 会."
   }
  ]
 },
 {
  "id": 4,
  "node": "LVL_4",
  "place": "Árvore grande",
  "color": "#ff9600",
  "title": "桌子上有一本书 · Lugares e números",
  "topic": "Lições 10–12 · 有, 在, 两, 几, 次, 比",
  "intro": {
   "en": "树上有一只鸟！",
   "pt": "shù shang yǒu yì zhī niǎo · Há um pássaro na árvore! Hoje: onde estão as coisas e comparações."
  },
  "exercises": [
   {
    "type": "match",
    "prompt": "Toque nos pares correspondentes",
    "pairs": [
     [
      "上",
      "em cima"
     ],
     [
      "里",
      "dentro"
     ],
     [
      "旁边",
      "ao lado"
     ],
     [
      "前面",
      "em frente"
     ],
     [
      "后面",
      "atrás"
     ]
    ]
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 10 · Existência: lugar + 有 + N",
    "pt": "Há um livro em cima da mesa.",
    "blocks": [
     [
      "桌子上",
      "s"
     ],
     [
      "有",
      "v"
     ],
     [
      "一本书",
      "c"
     ]
    ],
    "extra": [
     [
      "什么",
      "c"
     ],
     [
      "冰箱里",
      "s"
     ]
    ],
    "tip": "Zhuōzi shang yǒu yì běn shū. — Lugar + 有 + (número + cl.) + N"
   },
   {
    "type": "choice",
    "kind": "Lição 10 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Localização: N + 在 + lugar",
    "options": [
     "我的手机在桌子上。",
     "桌子上在我的手机。"
    ],
    "answer": 0,
    "tip": "Misturar as duas estruturas. Coisa nova: lugar + 有 + coisa; coisa conhecida: coisa + 在 + lugar."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 10 · Posição: referência + localizador",
    "pt": "O gato está embaixo da mesa.",
    "blocks": [
     [
      "猫",
      "s"
     ],
     [
      "在",
      "v"
     ],
     [
      "桌子下面",
      "c"
     ]
    ],
    "extra": [
     [
      "包里",
      "c"
     ],
     [
      "银行后面",
      "c"
     ]
    ],
    "tip": "Māo zài zhuōzi xiàmiàn. — N + 上/下面/里/前面/后面/旁边"
   },
   {
    "type": "choice",
    "pic": "👭",
    "prompt": "Para \"duas irmãs\", qual está certo?",
    "options": [
     "二个妹妹",
     "两妹妹",
     "两个妹妹"
    ],
    "answer": 2,
    "tip": "Antes de classificador, \"dois\" é 两; e o classificador 个 é obrigatório."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 11 · Frequência: … 次",
    "pt": "Vou à academia duas vezes por semana.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "一个星期",
      "e"
     ],
     [
      "去",
      "v"
     ],
     [
      "两次健身房",
      "c"
     ]
    ],
    "extra": [
     [
      "一次",
      "c"
     ],
     [
      "一天",
      "e"
     ]
    ],
    "tip": "Wǒ yí ge xīngqī qù liǎng cì jiànshēnfáng. — S + período + V + número + 次 (+ O)"
   },
   {
    "type": "listen",
    "joined": true,
    "kind": "Lição 12 · Ouça e monte",
    "say": "今天比昨天冷",
    "sayHint": "Jīntiān bǐ zuótiān lěng.",
    "prompt": "(Hoje está mais frio que ontem.)",
    "blocks": [
     [
      "今天",
      "s"
     ],
     [
      "比昨天",
      "e"
     ],
     [
      "冷",
      "v"
     ]
    ],
    "extra": [
     [
      "这个",
      "s"
     ],
     [
      "多了",
      "c"
     ]
    ],
    "tip": "Jīntiān bǐ zuótiān lěng. — Hoje está mais frio que ontem."
   },
   {
    "type": "choice",
    "kind": "Lição 12 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Comparação: A 比 B adj",
    "options": [
     "今天比昨天很冷。",
     "今天比昨天冷多了。"
    ],
    "answer": 1,
    "tip": "Usar 很 ou 非常 numa frase com 比. Para dizer \"muito mais\", coloque 多了 depois do adjetivo."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 12 · 最 e 没有…那么",
    "pt": "Não sou tão alto quanto meu irmão.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "没有哥哥那么",
      "e"
     ],
     [
      "高",
      "v"
     ]
    ],
    "extra": [
     [
      "冷",
      "v"
     ],
     [
      "熊猫",
      "c"
     ]
    ],
    "tip": "Wǒ méiyǒu gēge nàme gāo. — 最 + adj ／ A + 没有 + B + (那么) adj"
   }
  ]
 },
 {
  "id": 5,
  "node": "LVL_5",
  "place": "Casinha do Pongo",
  "color": "#8e44ad",
  "title": "请等一下！· Pedidos",
  "topic": "Lições 13–16 · 想, 要, 请, 在…呢, 可以, 一边",
  "intro": {
   "en": "请坐！请喝茶！",
   "pt": "qǐng zuò! qǐng hē chá! · Sente-se! Tome um chá! Hoje: pedidos, permissões e o que está acontecendo agora."
  },
  "exercises": [
   {
    "type": "match",
    "prompt": "Toque nos pares correspondentes",
    "pairs": [
     [
      "请",
      "por favor"
     ],
     [
      "等",
      "esperar"
     ],
     [
      "坐",
      "sentar"
     ],
     [
      "拍照",
      "tirar foto"
     ],
     [
      "吃饭",
      "comer"
     ]
    ]
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 13 · Desejo: 想 + V",
    "pt": "Quero comprar um carro.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "想",
      "e"
     ],
     [
      "买",
      "v"
     ],
     [
      "一辆车",
      "c"
     ]
    ],
    "extra": [
     [
      "你",
      "s"
     ],
     [
      "饭",
      "c"
     ]
    ],
    "tip": "Wǒ xiǎng mǎi yí liàng chē. — S + 想 + V + O"
   },
   {
    "type": "choice",
    "kind": "Lição 13 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Querer e pedir: 要",
    "options": [
     "我要一杯咖啡。",
     "我想一杯咖啡。"
    ],
    "answer": 0,
    "tip": "Usar 想 com substantivo para pedir. 想 + substantivo = sentir falta; para pedir, use 要 + coisa."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 14 · Em andamento: 在 / 正在 … (呢)",
    "pt": "Ela está vendo TV.",
    "blocks": [
     [
      "她",
      "s"
     ],
     [
      "正在",
      "e"
     ],
     [
      "看",
      "v"
     ],
     [
      "电视",
      "c"
     ],
     [
      "呢",
      "t"
     ]
    ],
    "extra": [
     [
      "打",
      "v"
     ],
     [
      "在",
      "e"
     ]
    ],
    "tip": "Tā zhèngzài kàn diànshì ne. — S + (正)在 + V + O + (呢)"
   },
   {
    "type": "choice",
    "pic": "😴",
    "prompt": "O Pongo está dormindo. Qual frase diz isso?",
    "options": [
     "庞戈睡觉在。",
     "庞戈在睡觉。",
     "庞戈睡觉了在。"
    ],
    "answer": 1,
    "tip": "在 + verbo = ação em andamento; 在 vem antes do verbo.",
    "say": "庞戈在睡觉",
    "sayHint": "Páng Gē zài shuìjiào",
    "title": "Ouça e escolha"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 15 · Permissão: 可以…吗？",
    "pt": "Posso entrar?",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "可以",
      "e"
     ],
     [
      "进来",
      "v"
     ],
     [
      "吗",
      "t"
     ]
    ],
    "extra": [
     [
      "用",
      "v"
     ],
     [
      "坐",
      "v"
     ]
    ],
    "tip": "Wǒ kěyǐ jìnlai ma? — S + 可以 + V + O + 吗？"
   },
   {
    "type": "choice",
    "kind": "Lição 15 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Proibição: 不能 / 不可以 / 别",
    "options": [
     "这里没能拍照。",
     "这里不能拍照。"
    ],
    "answer": 1,
    "tip": "Usar 没 para proibir. Regras e proibições usam 不能 ou 不可以; 没 é para fatos que não aconteceram."
   },
   {
    "type": "listen",
    "joined": true,
    "kind": "Lição 16 · Ouça e monte",
    "say": "我一边吃饭，一边看电视",
    "sayHint": "Wǒ yìbiān chī fàn, yìbiān kàn diànshì.",
    "prompt": "(Vejo TV enquanto como.)",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "一边吃饭，一边",
      "e"
     ],
     [
      "看",
      "v"
     ],
     [
      "电视",
      "c"
     ]
    ],
    "extra": [
     [
      "马克",
      "s"
     ],
     [
      "一边听音乐，一边",
      "e"
     ]
    ],
    "tip": "Wǒ yìbiān chī fàn, yìbiān kàn diànshì. — Vejo TV enquanto como."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 16 · Depois de: …以后",
    "pt": "Depois da aula vou à biblioteca.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "下课以后",
      "e"
     ],
     [
      "去",
      "v"
     ],
     [
      "图书馆",
      "c"
     ]
    ],
    "extra": [
     [
      "饭",
      "c"
     ],
     [
      "散",
      "v"
     ]
    ],
    "tip": "Wǒ xiàkè yǐhòu qù túshūguǎn. — V1 + O + 以后，S + V2"
   }
  ]
 },
 {
  "id": 6,
  "node": "LVL_6",
  "place": "Horta de frutinhas",
  "color": "#6a2bd9",
  "title": "我吃过北京烤鸭 · Experiências",
  "topic": "Lições 17–20 · 别, 应该, 不用, 能, 过, 了, 是…的, 得",
  "intro": {
   "en": "你吃过草莓吗？",
   "pt": "nǐ chīguo cǎoméi ma? · Você já comeu morango? Hoje: conselhos, experiências e como fazemos as coisas."
  },
  "exercises": [
   {
    "type": "match",
    "prompt": "Toque nos pares correspondentes",
    "pairs": [
     [
      "别",
      "não (faça)!"
     ],
     [
      "应该",
      "deveria"
     ],
     [
      "不用",
      "não precisa"
     ],
     [
      "感冒",
      "resfriado"
     ],
     [
      "累",
      "cansado"
     ]
    ]
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 17 · Pedido negativo: 别 / 不要",
    "pt": "Não se preocupe.",
    "blocks": [
     [
      "你",
      "s"
     ],
     [
      "别",
      "e"
     ],
     [
      "担心",
      "v"
     ]
    ],
    "extra": [
     [
      "迟到",
      "v"
     ],
     [
      "带护照",
      "c"
     ]
    ],
    "tip": "Nǐ bié dānxīn. — (你) + 别/不要 + V (+ 了)"
   },
   {
    "type": "choice",
    "kind": "Lição 17 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Não precisa: 不用",
    "options": [
     "你别来。",
     "你不用来。"
    ],
    "answer": 1,
    "tip": "Confundir 别 (não faça!) com 不用 (não precisa). 你别来 proíbe; 你不用来 só libera."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 18 · Poder / conseguir: 能",
    "pt": "Hoje não posso beber.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "今天不能",
      "e"
     ],
     [
      "喝",
      "v"
     ],
     [
      "酒",
      "c"
     ]
    ],
    "extra": [
     [
      "这儿",
      "s"
     ],
     [
      "来",
      "v"
     ]
    ],
    "tip": "Wǒ jīntiān bù néng hē jiǔ. — S + 能 + V + O"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 19 · Experiência: V + 过",
    "pt": "Já comi pato laqueado de Pequim.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "吃过",
      "v"
     ],
     [
      "北京烤鸭",
      "c"
     ]
    ],
    "extra": [
     [
      "看过",
      "v"
     ],
     [
      "你",
      "s"
     ]
    ],
    "tip": "Wǒ chīguo Běijīng kǎoyā. — S + V + 过 + O"
   },
   {
    "type": "choice",
    "kind": "Lição 19 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Experiência: V + 过",
    "options": [
     "我没吃过北京烤鸭。",
     "我没吃过了北京烤鸭。"
    ],
    "answer": 0,
    "tip": "Somar 了 à negativa com 过. Na negativa, fica só 没 + verbo + 过."
   },
   {
    "type": "listen",
    "joined": true,
    "kind": "Lição 19 · Ouça e monte",
    "say": "你的中文越来越好了",
    "sayHint": "Nǐ de Zhōngwén yuè lái yuè hǎo le.",
    "prompt": "(Seu chinês está cada vez melhor.)",
    "blocks": [
     [
      "你的中文",
      "s"
     ],
     [
      "越来越",
      "e"
     ],
     [
      "好",
      "v"
     ],
     [
      "了",
      "t"
     ]
    ],
    "extra": [
     [
      "热",
      "v"
     ],
     [
      "北京",
      "c"
     ]
    ],
    "tip": "Nǐ de Zhōngwén yuè lái yuè hǎo le. — Seu chinês está cada vez melhor."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 20 · Ênfase: 是…的",
    "pt": "Eu vim de avião.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "是坐飞机",
      "e"
     ],
     [
      "来",
      "v"
     ],
     [
      "的",
      "t"
     ]
    ],
    "extra": [
     [
      "到",
      "v"
     ],
     [
      "中文",
      "c"
     ]
    ],
    "tip": "Wǒ shì zuò fēijī lái de. — S + 是 + (quando/como/onde) + V + 的"
   },
   {
    "type": "choice",
    "kind": "Lição 20 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Avaliar ações: V + 得 + adj",
    "options": [
     "他说中文得很好。",
     "他中文说得很好。"
    ],
    "answer": 1,
    "tip": "Colocar o objeto entre o verbo e 得. Depois do verbo vem direto 得; o objeto vai antes (ou repete-se o verbo: 他说中文说得很好)."
   }
  ]
 },
 {
  "id": 7,
  "node": "LVL_7",
  "place": "Porta da frente",
  "color": "#36912a",
  "title": "我到家了！· Revisão",
  "topic": "Lições 21–25 · 觉得, 吧, 的, 的时候, 把, 如果…就",
  "intro": {
   "en": "我们回家吧！加油！",
   "pt": "wǒmen huí jiā ba! jiāyóu! · Vamos para casa! Força! Revisão final do manual."
  },
  "exercises": [
   {
    "type": "match",
    "prompt": "Toque nos pares correspondentes",
    "pairs": [
     [
      "觉得",
      "achar"
     ],
     [
      "如果",
      "se"
     ],
     [
      "虽然",
      "embora"
     ],
     [
      "但是",
      "mas"
     ],
     [
      "时候",
      "momento / quando"
     ]
    ]
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 21 · Opinião: 觉得 / 认为",
    "pt": "Acho que você tem razão.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "觉得",
      "v"
     ],
     [
      "你说得对",
      "c"
     ]
    ],
    "extra": [
     [
      "我们应该多练习",
      "c"
     ],
     [
      "这个怎么样",
      "c"
     ]
    ],
    "tip": "Wǒ juéde nǐ shuō de duì. — S + 觉得/认为 + oração"
   },
   {
    "type": "choice",
    "kind": "Lição 21 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Sugestão e suposição: 吧",
    "options": [
     "你是马克吗吧？",
     "你是马克吧？"
    ],
    "answer": 1,
    "tip": "Juntar 吗 e 吧. Use 吗 para perguntar sem saber; use 吧 quando já supõe a resposta."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 22 · Oração relativa: … V + 的 + N",
    "pt": "Este é o livro que eu comprei.",
    "blocks": [
     [
      "这",
      "s"
     ],
     [
      "是",
      "v"
     ],
     [
      "我买的书",
      "c"
     ]
    ],
    "extra": [
     [
      "看",
      "v"
     ],
     [
      "好吃",
      "v"
     ]
    ],
    "tip": "Zhè shì wǒ mǎi de shū. — (S) + V + (O) + 的 + N"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 23 · Assim que: 一…就…",
    "pt": "Assim que cheguei em casa, fui dormir.",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "一到家就",
      "e"
     ],
     [
      "睡",
      "v"
     ],
     [
      "觉",
      "c"
     ],
     [
      "了",
      "t"
     ]
    ],
    "extra": [
     [
      "睡不着",
      "v"
     ],
     [
      "她",
      "s"
     ]
    ],
    "tip": "Wǒ yí dào jiā jiù shuì jiào le. — S + 一 + V1，(S) + 就 + V2"
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 24 · Estrutura 把",
    "pt": "Feche a porta, por favor.",
    "blocks": [
     [
      "请把门",
      "e"
     ],
     [
      "关",
      "v"
     ],
     [
      "上",
      "c"
     ]
    ],
    "extra": [
     [
      "把作业",
      "e"
     ],
     [
      "桌子上",
      "c"
     ]
    ],
    "tip": "Qǐng bǎ mén guānshang. — S + 把 + O + V + complemento"
   },
   {
    "type": "listen",
    "joined": true,
    "kind": "Lição 25 · Ouça e monte",
    "say": "我要是有钱就买车",
    "sayHint": "Wǒ yàoshi yǒu qián jiù mǎi chē.",
    "prompt": "(Se eu tiver dinheiro, compro um carro.)",
    "blocks": [
     [
      "我",
      "s"
     ],
     [
      "要是有钱就",
      "e"
     ],
     [
      "买",
      "v"
     ],
     [
      "车",
      "c"
     ]
    ],
    "extra": [
     [
      "问",
      "v"
     ],
     [
      "我们",
      "s"
     ]
    ],
    "tip": "Wǒ yàoshi yǒu qián jiù mǎi chē. — Se eu tiver dinheiro, compro um carro."
   },
   {
    "type": "choice",
    "kind": "Lição 25 · Erro comum",
    "title": "Qual frase está certa?",
    "pic": "🔎",
    "prompt": "Concessão: 虽然…但是…",
    "options": [
     "虽然很贵，很好看。",
     "虽然很贵，但是很好看。"
    ],
    "answer": 1,
    "tip": "Usar 虽然 sem 但是 (ou 可是). Em chinês, o contraste é marcado nas duas partes da frase."
   },
   {
    "type": "build",
    "joined": true,
    "kind": "Lição 25 · Mesmo que: 即使…也…",
    "pt": "Mesmo que chova amanhã, nós vamos.",
    "blocks": [
     [
      "我们",
      "s"
     ],
     [
      "明天即使下雨也",
      "e"
     ],
     [
      "去",
      "v"
     ]
    ],
    "extra": [
     [
      "一点儿",
      "c"
     ],
     [
      "即使有钱也不",
      "e"
     ]
    ],
    "tip": "Wǒmen míngtiān jíshǐ xià yǔ yě qù. — 即使 + hipótese，S + 也 + resultado"
   }
  ]
 }
];

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
})();
