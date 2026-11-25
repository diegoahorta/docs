// Conteúdo do Diagnóstico (seções 3, 7 e 8) que não está na planilha.
window.HSK_EXTRA = {
  provas: [
    { nome: "Novo HSK 3 (HSK 3.0)", data: "2027-11-07" }
  ],
  erros: {
    "Gramática e ordem das palavras": [
      ["5", "我是学生汉语。", "我是学汉语的学生。/ 我在学汉语。", "Em chinês, o que descreve vem ANTES (estudante que estuda chinês = 学汉语的学生). Mais natural: 我在学汉语 (estou estudando chinês)."],
      ["2", "你是巴西", "你是巴西人。", "巴西 é o país. Nacionalidade = país + 人."],
      ["6", "我的家庭是爸爸，妈妈和狗", "我家有爸爸、妈妈和一只狗。", "Quem faz parte da família se diz com 有. 家庭 é formal. Itens de lista são separados por 、 e animal pede o medidor 只."],
      ["2", "他不是 / 是书", "他不是中国人。/ 这是书。", "Frase com 是 precisa de sujeito e de complemento."],
      ["18", "很 = “ser + adj.”", "我很高兴。(nunca 我是高兴)", "Com adjetivo não se usa 是. O 很 só liga o sujeito ao adjetivo e quase não significa “muito”."],
      ["20", "哪 = “lugar”", "哪 nǎ = qual? · 哪儿 nǎr = onde?", "你是哪国人？(de qual país?) × 你在哪儿？(onde você está?)"],
      ["25", "口 e 个 = “contador”", "口: só membros da família · 个: medidor geral", "我家有四口人 · 我有一个朋友. 我家有五个人 também é aceito, mas 口 é o normal."],
      ["5", "我是英语老师", "Se a ideia era “professor de português”: 我是葡萄牙语老师。", "Pútáoyáyǔ lǎoshī. A frase original está gramaticalmente certa."]
    ],
    "Caracteres (traços e radicais)": [
      ["4", "尔叫什么名字", "你叫什么名字", "Faltou o radical 亻 (pessoa). Sem ele, 尔 não é “você”."],
      ["2", "不 parecido com 才 / 扌", "不 (4 traços: 一 丿 丨 丶)", "O traço vertical é reto e não tem gancho, e o último traço é um ponto à direita."],
      ["5", "描 (com 扌)", "猫 māo, gato (com 犭)", "扌 é mão, e 描 miáo quer dizer descrever ou desenhar. Animais levam 犭."],
      ["7", "的 com 日 à esquerda", "的 = 白 + 勺", "Falta o pequeno traço no alto de 白."],
      ["1", "她 como 女 e 也 bem separados", "她 num só quadrado", "Os componentes ficam estreitos e juntos. Separados, parecem dois caracteres."]
    ],
    "Pinyin e tons": [
      ["1", "zhongguo · zhongguoren", "Zhōngguó · Zhōngguórén", "Anotar sempre o tom. Nomes próprios levam maiúscula."],
      ["1", "Bāxi · Riběn · Nin · ren", "Bāxī · Rìběn · nín · rén", "Tom faltando em uma ou nas duas sílabas."],
      ["7", "口 (kóu)", "kǒu", "3º tom (ˇ), não 2º (´)."],
      ["2", "不 (tom ambíguo)", "bù; búshì", "不 vira 2º tom antes de outro 4º tom: 不是 búshì, 不客气 bú kèqi."],
      ["6, 18, 26", "māmā · bàbà · mèimèi · gēgē", "māma · bàba · mèimei · gēge", "Na palavra repetida, a 2ª sílaba é tom neutro (sem marca)."],
      ["5", "nǐhǎo", "escreve nǐhǎo e fala níhǎo", "3º tom + 3º tom: o primeiro vira 2º na fala."]
    ],
    "Erros do material das aulas": [
      ["5", "她是巴西人马？", "她是巴西人吗？", "马 mǎ quer dizer cavalo. A partícula de pergunta é 吗."],
      ["4", "企业家 · chéngxùyuán", "企业家 qǐyèjiā (empresário)", "chéngxùyuán é 程序员 (programador)."]
    ]
  },
  // Seção 8: próximas quatro semanas
  semanas: [
    { ini: "2026-11-26", fim: "2026-12-02", vocab: "Tabela “Revisar primeiro” + P1: pessoas, tempo e números", gram: "G01–G06 · reescrever as frases da seção Erros", crit: "Ditado de 20 palavras com tom: ≥ 18",
      filtro: { rev: true, p: 1, temas: ["Família e pessoas", "Tempo, datas e números"] }, g: [1, 6] },
    { ini: "2026-12-03", fim: "2026-12-09", vocab: "P1: comida, compras, lugares e transporte", gram: "G07–G12 · autoapresentação de 8 frases, gravada", crit: "≤ 1 erro por frase",
      filtro: { p: 1, temas: ["Comida e bebida", "Compras, dinheiro e roupas", "Lugares, casa e direções", "Transporte e viagem"] }, g: [7, 12] },
    { ini: "2026-12-10", fim: "2026-12-16", vocab: "P1: restante (ações, estudo, gramaticais)", gram: "G13–G18 · Simulado HSK 1", crit: "Simulado ≥ 70%",
      filtro: { p: 1 }, g: [13, 18] },
    { ini: "2026-12-17", fim: "2026-12-23", vocab: "P2: pessoas, tempo, comida e compras", gram: "G19–G23 · texto “我的一天” com 10 frases", crit: "Texto corrigido com ≤ 3 erros",
      filtro: { p: 2, temas: ["Família e pessoas", "Tempo, datas e números", "Comida e bebida", "Compras, dinheiro e roupas"] }, g: [19, 23] }
  ],
  dicas: [
    "Ditado diário: 10 palavras com tom.",
    "Escreva à mão 5 caracteres da prioridade 1 por dia (o novo HSK 3 pede 250 caracteres).",
    "Anki/cartões: 15 novos por dia, na ordem da prioridade (~2 meses para as 932 palavras).",
    "Ao fim de cada aula: “我的句子” (5 frases suas) e “错题本” (escrevi → correto → frase nova).",
    "Termine a prioridade 1 antes de abrir a 2. Palavras gramaticais junto com a gramática."
  ],
  // Palavras básicas que já estão no caderno (não entram na lista) — usadas para montar frases.
  basicas: "我 你 他 她 它 我们 你们 他们 是 不 的 了 很 也 都 在 有 没有 没 吗 呢 吧 这 那 这个 那个 什么 谁 哪 哪儿 几 多少 一 二 三 四 五 六 七 八 九 十 个 口 人 家 学 学习 汉语 中国 喜欢 喝 茶 吃 看 听 说 去 来 做 学生 老师 朋友 爸爸 妈妈 哥哥 妹妹 高兴 今天 明天 工作 学校 书 狗 猫 叫 名字 岁 请 会 想 要 能 和 到 给 让 把 被 着 过 得 地 就 才 再 还 又 吗".split(" ")
};
