# PONGO: 方向の冒険 (ほうこうのぼうけん) — The Japanese Direction Quest

**ODU Creative — Learn. Play. Connect.**

RPG educacional 2D (visão superior, pixel art 16/32 bits) para aprender **direções, pontos
cardeais, localização espacial e construção de frases em japonês** — nível JLPT N5, com
consolidação N4. Pongo chega a **ことばの町 (Cidade das Palavras)**, cujas placas, mapas e
direções foram embaralhados por **まよいネコ (Mayoi Neko, o Gato Desorientador)**. Para
restaurar a cidade, é preciso _entender e usar_ o japonês: caminhar para 北, achar o prédio
que fica 銀行の隣, o gato que está 箱の中, virar 右 no labirinto…

## Como executar

Requer Node.js 18+.

```bash
cd pongo-quest
npm install
npm run dev       # servidor de desenvolvimento (Vite) em http://localhost:5173
npm run lint      # ESLint
npm run format    # Prettier
npm run build     # site estático em dist/
npm run preview   # serve o build
npm test          # testes (Vitest)
```

### VS Code + Live Server

O projeto abre direto no VS Code (extensões recomendadas em `.vscode/extensions.json`:
ESLint, Prettier e Live Server). Depois de `npm run build`, clique em **Go Live**: o Live
Server já está configurado para servir a pasta `dist/` (`.vscode/settings.json`). O build
usa caminhos relativos (`base: './'`), então `dist/` pode ser publicado em qualquer
hospedagem estática (GitHub Pages, Netlify, Vercel, servidor da escola…).

> Abrir `dist/index.html` direto pelo `file://` não funciona (módulos ES exigem um
> servidor) — use Live Server, `npm run preview` ou qualquer servidor estático.

## Controles

| Ação                           | Teclado          | Celular/tablet     |
| ------------------------------ | ---------------- | ------------------ |
| Andar                          | Setas ou WASD    | Direcional na tela |
| Interagir / avançar diálogo    | E, Espaço, Enter | Botão **E**        |
| Responder escolhas             | 1–4 ou clique    | Toque              |
| Minimapa / Furigana / Tradução | M / F / T        | Botões da barra    |
| Modo de análise gramatical     | X                | Botão 🎨           |
| Inventário / Diário / Caderno  | I / J / K        | 🎒 / 📖 / 📝       |
| Progresso / Configurações      | P / Esc          | 📊 / ⚙️            |

## O que tem nesta versão

- **Cidade explorável** com 駅, 学校, 病院, レストラン, 公園, コンビニ, 図書館, 郵便局, 銀行 e 家;
  ruas, cruzamentos, faixas de pedestres, semáforos, árvores, praça com fonte, parque com
  lago, placas de rua em japonês e **interiores exploráveis** (casa e biblioteca).
- **Pongo animado** (idle/andar nas 4 direções), colisão, câmera que acompanha e
  indicador de interação.
- **Bússola interativa**: 北・南・東・西 fixos + anel interno **前・右・後ろ・左** que gira com a
  direção para onde Pongo olha (direção absoluta × relativa). Toque num ponto cardeal para
  ouvir/ler. **Minimapa** opcional com o objetivo marcado.
- **8 NPCs** com diálogos em japonês (おばあさん, リサ, けん, ユキ, ミチ, 先生, さとうさん e まよいネコ),
  retrato, nome, furigana, tradução opcional, digitação animada, voz opcional (ja‑JP),
  escolhas com ramificação e **feedback gramatical em português**.
- **5 fases** com INPUT → INTAKE → OUTPUT:
  1. **A Bússola Perdida** — 北・南・東・西, へ; comandos 「北へ行ってください」 que exigem
     caminhar até o ponto certo; teste final só com japonês.
  2. **Onde fica a estação?** — 近く・隣・間・向こう, ここ/あそこ; placas embaralhadas que só se
     restauram ao achar o prédio descrito pela frase.
  3. **O gato escondido** — 上・下・中・外・前・後ろ・そば, あります × います; o gato aparece
     _de fato_ dentro da caixa, embaixo da mesa, atrás do sofá…
  4. **O labirinto das direções** — 右・左・まっすぐ・右側・左側; as curvas são avaliadas em
     relação à direção de chegada. A mesma porta é 左側 numa rodada e 右側 na outra.
  5. **O mapa misterioso** — 5 destinos para encontrar e descrever montando frases, e o
     “chefe” まよいネコ, vencido com desafios linguísticos (sem violência).
- **Puzzles reutilizáveis** (`src/ui/puzzles/components.js`): A direção · B encontrar
  objeto · C montar frases arrastando blocos · D kanji↔leitura · E partículas の・に・で・へ ·
  F interpretar o mapa · G rota a partir de instruções · H descrever localização. Todos com
  gabarito, dicas progressivas, resposta comentada após 3 tentativas e feedback **não
  punitivo**.
- **Chunking colorido** (modo de análise): referência **azul**, の **amarelo**, posição
  **verde**, に/で/へ **roxo**, predicado **vermelho**.
- **Sistema de aprendizagem**: vocabulário visto/aprendido, acertos, erros, tentativas,
  desafios, progresso por habilidade, dificuldades recorrentes e fila de revisão. Itens
  errados voltam automaticamente no início dos desafios das fases seguintes e na
  biblioteca (さとうさん). O painel deixa claro que a pontuação **não é certificação**.
- **Diário de vocabulário** (kanji, furigana, tradução, exemplo, ícone, atividades de
  reconhecimento e de produção), **caderno gramatical**, inventário, progresso,
  configurações (furigana, tradução, volume, música, voz, redução de movimento,
  velocidade do texto, jogar sem limite de tempo, controles touch).
- **Animações GSAP** para abertura ODU Creative, menu, história, diálogos, recompensas,
  brilho de coletáveis, placas restauradas, transições de fase, acertos/erros e celebração.
  Phaser cuida apenas de movimento/física do mundo.
- **Salvamento local** automático (localStorage) e **tela de conclusão** com diploma.

## Arquitetura

```
src/
  main.js                 configuração do Phaser e cenas
  config/                 resolução lógica 480×270 (zoom 2), cores, constantes
  scenes/                 Boot, Preload, Menu, City, Interior, Maze, Dialogue, Puzzle, Result
                          (WorldScene = base das cenas exploráveis)
  entities/               Player (Pongo) e NPC
  systems/                QuestSystem (missões), DirectionSystem (absoluto × relativo),
                          InputSystem (teclado + touch), SaveSystem, AudioSystem, EventBus
  education/              vocabulário, gramática, LearningTracker, banco de revisão,
                          relações espaciais (verificam as frases contra o mapa)
  maps/                   cidade, interiores, labirinto, índices de tiles
  data/                   fases/missões, diálogos, puzzles, NPCs, itens, gatos
  ui/                     HUD, bússola, minimapa, diálogo, painéis, menus, puzzles (DOM)
  animations/fx.js        animações GSAP (respeitam “reduzir movimento”)
  art/                    pixel art procedural (placeholders) — sprites, tiles, prédios
  styles/main.css         interface responsiva
public/assets/            sprites/ tilesets/ backgrounds/ audio/ icons/ portraits/
tests/                    Vitest
```

Conteúdo pedagógico (`education/`, `data/`), regras de movimento (`systems/`), dados do mapa
(`maps/`) e interface (`ui/`) ficam separados. Para adicionar uma missão, basta incluir um
passo em `data/phases.js` (tipos: `dialogue`, `reach`, `sequence`, `puzzle`,
`findBuilding`, `enter`, `findCats`, `maze`, `hunt`).

### Japonês: marcação compacta

Textos usam `{漢字|かんじ}` para furigana e `[tipo:…]` para os blocos gramaticais:

```js
'{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。'
```

O mesmo texto gera o HTML com `<ruby>`, as cores do modo de análise, os blocos dos puzzles
de montagem e a fala sintetizada.

### Coerência mapa × frases

`tests/spatial.test.js` calcula as relações reais do mapa (隣, 間, 近く, 向こう, そば, 中,
北/南/東/西) e falha se alguma frase de missão não corresponder às posições dos prédios.
`tests/maze.test.js` simula as rotas do labirinto e confere os lados das portas.

### Substituindo os placeholders

Toda a arte e o som são gerados por código para o projeto rodar sem assets externos.
Para usar arte final, coloque os arquivos em `public/assets/…` e carregue-os em
`src/scenes/PreloadScene.js` com `this.load.*`, mantendo as mesmas chaves de textura
(`pongo` com frames `down-0…up-3`, `npc-<id>`, `cat-<id>`, `bld-<id>`, `tiles`, etc.).

### Extensões futuras

Three.js pode ser adicionado para cenas especiais (por exemplo, um mapa 3D da cidade),
mas não é necessário: a experiência principal é 2D.

## Créditos

Jogo e conteúdo: ODU Creative. Fonte DotGothic16 (SIL Open Font License), via
`@fontsource/dotgothic16`. Phaser 3, GSAP e Vite.
