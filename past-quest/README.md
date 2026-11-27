# Pongo Past Quest

Jogo em HTML5 para praticar **was / were e past simple** (Inglês A1/A2, *Essential Grammar in Use*, Units 10–11), feito a partir do caderno da aula *How was your weekend?*. A progressão e a pontuação seguem o estilo Duolingo/Busuu, e o mascote Pongo é um cachorrinho em 3D (Three.js).

## Como jogar

| Jeito | Comando | O que você tem |
|---|---|---|
| Arquivo único | abra `dist/pongo-past-quest.html` no navegador | jogo completo, progresso salvo no navegador |
| Com servidor (turma) | `python3 server/server.py --host 0.0.0.0` e acesse `http://IP-do-computador:8000` | + ranking real da turma e progresso salvo na nuvem |
| Treino no terminal | `java -cp build/classes PastSimpleRules drill build/verbs.tsv` | quiz de verbos com XP e combo |

Depois de editar o conteúdo, rode `python3 tools/build.py --java`.

## Progressão e pontos

Regras tiradas da seção 6 do caderno:

- **9 paradas** num caminho: Blocos A–D (was/were, -ed, irregulares, did/didn't), o diálogo *How was your weekend?* e o **Checkpoint A2 Key** (precisa de 80%).
- **3 coroas por parada.** Cada coroa sobe o nível dos exercícios (1 → 3): primeiro escolher, depois montar e ouvir, por fim escrever, corrigir e fazer ditado. A próxima parada abre com 1 coroa.
- **XP:** acerto de primeira 10 · depois de errar 4 · combo ×5 +10 · combo ×10 +25 · ditado perfeito +8 · shadowing 3 · cartão revisado 3 · lição completa +10 · lição perfeita +20.
- **Vidas:** 5. Cada erro custa 1; recarrega 1 a cada 20 min, revisando ou com gemas. Revisar nunca custa vida.
- **Sequência de dias** com protetor, **meta diária** (padrão 60 XP), registro da semana, **níveis** Starter → Explorer → … → Legend.
- **Revisão espaçada:** o que você erra vai para os cartões, que voltam nos dias 1, 2, 4, 8 e 16. Um cartão vencido também aparece no meio das lições.
- **Liga semanal** (Bronze → Diamante): os 3 primeiros sobem. Com o servidor, aparece também o ranking real da turma.
- **15 medalhas** (Primeiro acerto, Combo ×5/×10, Meta do dia, 3 e 7 dias, 20/100 revisões, 10 cartões dominados, Ouvido afiado, Sombra, Simulado, Nível 5…) e **loja** de gemas.

## 10 tipos de exercício

Múltipla escolha · completar diálogo (chat com Anna, Leo e Mei) · digitar o verbo · montar a frase com blocos · pares · listening · ditado · phonics do -ed (/t/ /d/ /ɪd/) · tocar na palavra errada · shadowing.

O áudio usa a voz do próprio navegador (Web Speech API, inglês britânico quando disponível), com botão de velocidade 0.6×.

## Estrutura e tecnologias

```
data/lessons.json       conteúdo: unidades, exercícios, dicas, verbos (fonte única)
web/index.html          HTML5
web/css/style.css       CSS3: tema claro/escuro, layout para celular
web/js/scene3d.js       Three.js: Pongo 3D, relógio que gira para trás, confete, moeda
web/js/engine.js        JavaScript: regras do jogo (XP, vidas, SRS, liga, medalhas)
web/js/app.js           JavaScript: telas, exercícios, som e voz
web/js/data.js          gerado pelo build a partir do lessons.json
tools/build.py          Python: valida o conteúdo, gera data.js e o HTML único em dist/
server/server.py        Python: servidor + API (ranking, placar, progresso) com SQLite
java/PastSimpleRules.java  Java: motor das regras do -ed (ortografia e pronúncia),
                        confere o banco de verbos e tem o treino no terminal
```

O build em Python valida cada exercício (resposta nas opções, frase montável, pares sem ambiguidade, níveis 1–3 em toda unidade). Em seguida, o Java recalcula a forma `-ed` e o som de todos os verbos regulares e falha se o banco divergir das regras.

## Para criar exercícios

Adicione itens em `data/lessons.json`. Exemplos:

```json
{ "t": "choice", "lvl": 1, "q": "I ___ tired.", "o": ["was", "were", "did"], "a": "was", "tip": "I → was." }
{ "t": "build",  "lvl": 2, "pt": "Eu não estava em casa.", "a": "I wasn't at home", "x": ["didn't"] }
{ "t": "fix",    "lvl": 3, "s": "You was late.", "bad": 1, "fixed": "You were late.", "tip": "you → were." }
```

Depois rode `python3 tools/build.py --java`.
