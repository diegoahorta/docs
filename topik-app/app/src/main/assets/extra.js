// Conteúdo das "Listas de revisão — rumo ao TOPIK II" que não está na planilha.
window.TOPIK_EXTRA = {
  datas: [
    { nome: "TOPIK II", data: "2027-07-03", obs: "data estimada · meta 3급 ≥ 120" },
    { nome: "Fim do curso coreano-topik (aula 111)", data: "2027-01-30", obs: "≈" }
  ],
  categorias: {
    melhorar: { nome: "Melhorar", ico: "고", cor: "var(--bad)", desc: "Você usou ou glossou com erro. Corrigir e reescrever 3×." },
    fixar:    { nome: "Fixar",    ico: "굳", cor: "var(--good)", desc: "Você já sabe, mas é de alta frequência: precisa sair automático." },
    rever:    { nome: "Rever",    ico: "복", cor: "var(--warn)", desc: "Já viu (slide, leitura, glossa), mas não usou em frase sua." },
    avancar:  { nome: "Avançar",  ico: "새", cor: "var(--accent)", desc: "Ainda não está no caderno e é necessário para o TOPIK II (3–4급)." }
  },
  // Ordem do Anki diário (seção 8, item 5)
  ordem: [["melhorar"], ["fixar"], ["avancar", "P1"], ["rever"], ["avancar", "P2"]],
  achados: [
    ["Você reconhece 3급, mas quase não produz.", "Lacunas com -던, -았/었던, -게 되다, -게 e -는 것 estão quase todas certas (p.14, 32, 36, 39, 40, 44). Já as tarefas de produção ficaram em branco: -기로 하다 (p.5), frases 1–6 (p.39), 작은 인터뷰 (p.41) e a pergunta ③ (p.26)."],
    ["Três padrões de erro de grafia.", "Sílaba copiada ou inserida (강가지, 아름마운), ㅓ × ㅕ (별써 → 벌써) e ㄴ × ㅇ (연이 → 영어). Também 느긴 → 느낀/느낌."],
    ["Forma confundida com função.", "-(으)러 anotado como “contraste” (p.18), -아요 como “necessidade” em vez de -아야 (p.46), -(으)ㄴ 거예요 como “presente simples” (p.28), -(이)라고 como “citação direta” (p.7). Glossas trocadas: 설치다 = “dormir”, 학년 = “ano passado”, 우는 = “verme”."],
    ["Falta o vocabulário que mais pesa no TOPIK II.", "Nenhum conectivo de texto de 3–4급 (따라서, 반면, 즉, 오히려…) nem substantivo abstrato frequente (영향, 과정, 상황, 변화…) aparece no caderno."],
    ["Há progresso, mas a regularidade oscila.", "Na p.60, 되었어요 e 서른아홉 saem certos, mas 합니다체 e 해요체 se misturam. Houve ~5 meses sem anotações (25/04 → 29/09/2026)."]
  ],
  proposta: [
    ["오답 노트", "Acrescentar os erros novos (아름다운, 느낀/느낌, 벌써, 잠을 설치다, -기 시작하다, 한국어로, -아야, N에서 오다) às revisões espaçadas das aulas 51, 53, 57, 64 e 78."],
    ["Produção obrigatória", "Em toda aula com -던, -게 되다 ou discurso indireto, responder por escrito à 작은 인터뷰 (p.41) e às frases 1–6 (p.39)."],
    ["Gramática P1 sem lição", "-잖아요, -거든요, -(으)ㄹ 텐데, -는 대신(에), N에 대해(서), -아/어 놓다/두다, -아/어 가다/오다, -(으)ㄹ수록, -는 바람에, -(으)ㄹ 뻔하다, -는 김에, -줄 알다/몰랐다: distribuir nas aulas 73, 98 e 96."],
    ["Vocabulário P1", "Conectivos e abstratos entram na aula 72 (conectores de escrita) e 92 (sino-coreano). Use o hanja para inferir significado."],
    ["Anki diário", "15 cartões novos por dia: Melhorar → Fixar → Avançar P1 → Rever → Avançar P2. Até o fim do P1 são 190 cartões (~13 dias)."],
    ["Plano 2027", "Fase 0 (dez/2026–jan/2027): estas listas como linha de base de 쓰기. Fase 2 (16/05–03/07/2027): revisar P2 e P3 antes do TOPIK II."]
  ],
  dicas: [
    "15 cartões novos por dia, na ordem Melhorar → Fixar → Avançar P1 → Rever → Avançar P2.",
    "Erros do Melhorar: reescreva a forma certa 3× à mão.",
    "Produza: escreva frases suas com cada gramática (campo “내 문장”).",
    "Treine grafia: ㅓ × ㅕ, ㄴ × ㅇ final, sílaba copiada, 띄어쓰기.",
    "Não misture 합니다체 e 해요체 no mesmo texto."
  ]
};
