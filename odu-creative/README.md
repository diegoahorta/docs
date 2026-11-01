# ODU CREATIVE — Universal Language Learning Engine

Plataforma educacional HTML5 modular para o ensino de línguas, organizada no fluxo
**INPUT → INTAKE → OUTPUT → FEEDBACK → REVIEW**.

Unidades incluídas:

- **Inglês · A1 · 13 anos · “At the Café”** (`units/en-a1-cafe`) — o aluno vai até uma cafeteria,
  lê o cardápio, entende a atendente e consegue pedir o que quer.
- **Japonês · N4 · 13 a 17 anos · 「カフェ・さくらで」** (`units/ja-n4-34`) — alinhada aos objetivos da lição 34
  de 『みんなの日本語 初級Ⅱ』 (〜とおりに, 〜あとで, 〜て／〜ないで), com textos, diálogos e exercícios
  **originais**: pedido com instruções na cafeteria, oficina de matcha latte, missão “faça como diz o bilhete”,
  furigana e romaji ligáveis, questões no formato das seções do JLPT N4 e áudio gerado com Open JTalk.

Troque de unidade no seletor da página inicial.

## O que está implementado

| Módulo | Onde | O que faz |
|---|---|---|
| 1 · Input — **Café Quest** | `js/modules/quest.js` | Jogo com 3 missões: cena animada (GSAP), cardápio para leitura, carteira, ticket do pedido, falas da atendente em áudio, resposta por **escolha**, **escrita** (correção de a/an e de adequação) ou **fala** (reconhecimento de fala, quando o navegador suporta). Erros geram feedback pragmático e nova tentativa; estrelas por desempenho. |
| 1 · Input — **Listening** | `js/modules/listening.js`, `js/components/player.js` | 2 diálogos originais com MP3 + **trilha de timestamps** (start/end por fala). 4 etapas: escuta global sem texto → informações específicas → texto sincronizado (destaque da fala ativa) → repetição/shadowing. Play/pause, voltar 5 s, velocidade 0.75–1.25×, ouvir trechos isolados, ocultar/revelar texto, tradução, legenda. |
| 2 · Intake — **Discover the Pattern** | `js/modules/discover.js` | Comparação de frases, destaque de chunks (sujeito, pedido, artigo, item, cortesia), perguntas indutivas, montagem de frases com blocos, campo de hipótese, revelação gradual da regra, comparação hipótese × regra e seção **THE RULE**. |
| 3 · **Grammar Lab** | `js/modules/grammar.js` | 4 estruturas (I'd like, Can I have…?, a/an, How much…?) com função, forma, tabela, exemplos afirm./neg./interr. com áudio e tradução, comparação, erros frequentes, uso, pronúncia e verificação. |
| 4 · **Practice Zone** | `js/modules/practice.js`, `js/components/question.js` | Etapas A (reconhecimento), B (compreensão com áudio), C (manipulação: lacunas, blocos, transformação, associação), D (produção livre com critérios verificáveis) e Avaliação inspirada no Cambridge A1 Movers. Cada resposta: acerto/erro, explicação, justificativa do distrator, correção comentada, tentar de novo e link de revisão. |
| 5 · **Speaking Studio** | `js/modules/speaking.js` | Listen, Repeat, Shadow, Substitute, Respond, Create; role-play com papéis alternados; tempo de resposta configurável; gravação (MediaRecorder) com medidor de volume (Web Audio API) e reprodução; transcrição automática como auxílio; **modo sem microfone**. Não há nota de pronúncia. |
| 6 · **Gamificação** | `js/core/gamify.js`, `js/modules/progress.js` | XP (erro nunca tira ponto), 11 medalhas, sequência de dias, barras de progresso, animações discretas de acerto/erro. |
| **Flashcards 3D** (jogo) | `js/modules/flashcards.js`, `js/three/`, `tools/blender/` | Jogo 3D para pré-adolescentes com modelos feitos no **Blender** e exibidos com **Three.js**: **Estudar** (cartas que viram, com o objeto 3D, áudio, direção EN→PT ou PT→EN, gesto de arrastar e caixas de Leitner por carta), **Memória 3D** (palavra com a/an ↔ objeto 3D) e **Café Rush** (o cliente pede em áudio, o aluno serve o item no balcão e completa a/an; pontos, combo e tempo, sem punição). Cada ação 3D tem botão HTML e atalho de teclado; sem WebGL, o modo Estudar funciona em 2D. |
| 7 · **Revisão espaçada** | `js/core/srs.js`, `js/modules/review.js` | Registro por competência; status *Ainda não dominado / Em desenvolvimento / Consolidado*; intervalos ajustáveis; desafio de revisão com itens em **novos contextos**. |
| 8 · **Document Generator** | `js/core/docx-builder.js`, `js/modules/docs.js`, `tools/build-docx.mjs` | Apostila DOCX com as 17 seções exigidas, versão do **aluno** e do **professor** (gabarito comentado, distratores, orientações). Gerada no navegador ou na linha de comando (esta inclui QR codes). |
| 9 · **Painel do professor** | `js/modules/teacher.js` | Unidade ativa, metadados (idioma, nível, idade…), capa, duplicar/exportar/importar unidades, importar áudio e transcrições (VTT/SRT/JSON), **ferramenta de marcação de tempos**, editores JSON validados de padrões, gramática e atividades com pré-visualização, critérios de avaliação, importação de progresso dos alunos e relatório CSV. |

Também: tema claro/escuro, alto contraste, redução de movimento, tamanho do texto, navegação por
teclado, ARIA/leitores de tela, layout mobile-first e PWA (funciona offline após a primeira visita).

## Limitações (declaradas, não simuladas)

- **Áudio**: as faixas são de **voz sintética** (espeak-ng + MBROLA), geradas por `tools/build-audio.mjs`
  com timestamps exatos. Soam robóticas: para uso em sala, recomenda-se gravar vozes humanas e importar
  pelo painel (ou substituir os MP3 e ajustar `start`/`end`).
- **Reconhecimento de fala** depende do navegador (Chrome, Edge, Safari; no Chrome requer internet).
  Firefox não oferece: o app mostra o aviso e as alternativas (escolher/escrever/autoavaliação).
- **Painel do professor é local**: dados ficam no navegador do professor. Não há login nem servidor,
  então não há armazenamento central de dados de alunos. O backend C# é opcional e está especificado
  em [`docs/BACKEND.md`](docs/BACKEND.md), mas **não foi implementado**.
- **DOCX** não contém áudio incorporado: contém links (e QR codes, quando gerado via CLI com URL pública).
- **Japonês**: furigana e romaji são gerados a partir da marcação `{漢字|かんじ}`; o romaji é automático
  (Hepburn, separando partículas comuns) e pode errar em casos raros de segmentação. Pinyin (mandarim)
  e níveis de formalidade (coreano) estão previstos no formato de unidade, mas ainda não há unidades nesses idiomas.
- **Áudio japonês**: voz sintética do Open JTalk (uma voz masculina com tom ajustado para os personagens).
  O áudio é gerado a partir da leitura do furigana, para que fale exatamente o que o aluno lê.

## Como executar

### Opção 1 — arquivo único (mais simples)

Abra **`dist/odu-creative.html`** com duplo clique. É a plataforma inteira em um só arquivo HTML
(≈3,2 MB): código, estilos, unidade, áudios e apostilas embutidos. Funciona sem servidor e sem internet
(exceto o reconhecimento de fala do Chrome, que depende do serviço do navegador). Pode ser enviado
por e-mail, pendrive ou colocado num LMS como recurso. Nessa versão, o progresso fica salvo no
navegador, associado ao local de onde o arquivo foi aberto.

Depois de editar conteúdo ou código, gere o arquivo de novo:

```bash
npm install
```

```bash
npm run build:html
```

**Só a unidade de japonês:** `dist/odu-japones-n4.html` (≈6,7 MB).
**Só o jogo de flashcards:** `dist/odu-flashcards.html` (≈5 MB) abre direto no jogo 3D, sem menu lateral.

### Opção 2 — servidor local (desenvolvimento)

Requisitos: Node.js 18+ (só para o servidor local, testes e geração de arquivos).

```bash
cd odu-creative
```

```bash
npm run serve
```

Acesse http://localhost:8080. (Abrir o `index.html` direto do disco não funciona: navegadores
bloqueiam módulos JavaScript em `file://`.) Qualquer servidor estático serve — Netlify, GitHub Pages,
Apache, Nginx — desde que suporte requisições de intervalo (Range) para o áudio.

### Testes

```bash
npm install
```

```bash
npm test
```

29 testes cobrem: correção de respostas, artigos a/an, critérios de produção, revisão espaçada,
sincronização e WebVTT, integridade da unidade (questões aceitam a própria resposta, áudio e tempos
coerentes, jogo jogável, preços do cardápio) e geração dos DOCX.

### Regenerar áudio e apostilas

```bash
sudo apt-get install espeak-ng mbrola mbrola-us1 mbrola-us2 ffmpeg open-jtalk open-jtalk-mecab-naist-jdic hts-voice-nitech-jp-atr503-m001
```

```bash
npm run build:audio
```

```bash
npm run build:docx -- --audio-base https://seu-site.com/odu-creative/units/en-a1-cafe/
```

### Modelos 3D (Blender)

Os modelos do jogo (carta, 16 objetos do vocabulário, cliente e cafeteria) são gerados **por código**
em `tools/blender/build_cafe_models.py` — dá para alterar cores, formas e tamanhos e gerar de novo:

```bash
sudo apt-get install blender python3-numpy
```

```bash
npm run build:models
```

Saída: `assets/3d/cafe-flashcards.glb` (compartilhado pelas unidades) (glTF binário). Para conferir os modelos,
abra http://localhost:8080/tools/blender/preview.html (`?view=scene` mostra o cenário).
Para usar modelos feitos à mão no Blender, exporte em glTF mantendo os nomes `Card`,
`item-<nome>` e `Customer`, e os materiais `CardFront`/`CardBack` da carta.

Sem `--audio-base`, a apostila indica onde ouvir na plataforma em vez de links/QR codes.
As apostilas prontas ficam em `units/en-a1-cafe/docs/`.

## Estrutura

```
odu-creative/
├── index.html, manifest.webmanifest, sw.js   # app shell + PWA
├── css/tokens.css                            # identidade visual (troque a marca aqui)
├── css/app.css
├── js/main.js                                # rotas, contexto, configurações
├── js/core/                                  # lógica sem UI (testável): evaluate, srs, audio-sync,
│                                             #   speech, store, idb, motion, gamify, unit-loader, docx-builder
├── js/components/                            # question.js, player.js
├── js/modules/                               # uma tela por módulo
├── units/index.json                          # registro de unidades
├── units/en-a1-cafe/unit.json                # TODO o conteúdo da unidade (banco de questões incluso)
├── units/en-a1-cafe/audio/                   # t1.mp3, t2.mp3, lines/*.mp3
├── units/en-a1-cafe/docs/                    # apostilas aluno/professor (.docx)
├── tools/                                    # serve, build-audio, build-docx, vendor
├── tests/                                    # node --test
├── vendor/                                   # gsap, docx (offline)
└── docs/                                     # novas unidades, backend
```

## Privacidade (LGPD)

- Progresso, tentativas e configurações ficam no `localStorage` do dispositivo do aluno.
- Gravações de voz ficam só na memória da página e não são enviadas a lugar nenhum.
- O reconhecimento de fala usa o serviço do próprio navegador (no Chrome, processado pelo Google).
  Ele só é ativado quando o aluno toca em “Falar”.
- O aluno pode exportar o próprio progresso (com apelido opcional) e apagá-lo a qualquer momento.

## Base pedagógica

Input compreensível (Krashen), *noticing* (Schmidt), output (Swain), abordagem lexical/chunks (Lewis),
estratégias de escuta (Field), tarefas (Ellis), revisão espaçada e descritores do QECR — referências
completas na seção 17 da apostila e em `unit.json → references`.
