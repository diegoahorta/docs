# PONGO — 日本語アクション！

**Japanese Verb Adventure** · ODU Creative / ODU Kizuna

Jogo educativo de plataforma 2D em que o aluno aprende **verbos japoneses (JLPT N5/N4)** fazendo o
personagem Pongo agir no mundo. Quando o Pongo **corre**, aparece `走る（はしる）`; quando **senta**,
`座る（すわる）`; quando **bebe**, `飲む（のむ）`. A língua faz parte da jogabilidade, não é um quiz separado.

> Fase 1 jogável: **公園の冒険 — A Aventura no Parque**.

---

## Como executar no VS Code

1. Instale o [Node.js 20.19+](https://nodejs.org/) (recomendado: 22 LTS).
2. Abra a pasta `pongo/` no VS Code (**Arquivo → Abrir Pasta…**).
3. Aceite as extensões recomendadas (ESLint, Prettier, Live Server), sugeridas por `.vscode/extensions.json`.
4. No terminal integrado (**Ctrl + `**):

```bash
npm install        # instala Phaser, GSAP, Vite, ESLint e Prettier
npm run dev        # servidor de desenvolvimento → http://localhost:5173
```

Para jogar no celular na mesma rede Wi-Fi, abra o endereço **Network** que o Vite mostra no terminal.

### Outros comandos

| Comando           | O que faz                                        |
| ----------------- | ------------------------------------------------ |
| `npm run build`   | Build de produção otimizado em `dist/`           |
| `npm run preview` | Serve o build de `dist/` → http://localhost:4173 |
| `npm test`        | Testes das regras gramaticais (`node --test`)    |
| `npm run lint`    | Análise estática com ESLint                      |
| `npm run format`  | Formata o código com Prettier                    |
| `npm run check`   | Lint + testes + build (use antes de publicar)    |

### Usando o Live Server

O build usa caminhos relativos (`base: './'`), então funciona em qualquer servidor estático:

1. `npm run build`
2. Clique com o botão direito em `dist/index.html` → **Open with Live Server**
   (o `.vscode/settings.json` já aponta o Live Server para `/dist`).

> Abrir `index.html` diretamente com `file://` não funciona: os navegadores bloqueiam módulos ES fora de um servidor.

### Ferramenta de prévia dos sprites

Com `npm run dev` rodando, abra <http://localhost:5173/tools/sprites.html> para ver todos os
spritesheets e texturas geradas (útil para o time de arte).

---

## Controles

| Ação      | Teclado         | Celular  | Gamepad           |
| --------- | --------------- | -------- | ----------------- |
| Mover     | A/D ou ←/→      | ◀ ▶      | Analógico / D-pad |
| Pular     | Espaço (W/↑)    | 跳       | A                 |
| Correr    | Shift (segurar) | 走       | RB / RT           |
| Interagir | E (ou Enter)    | ✋       | X / B             |
| Pausar    | Esc             | ⏸ no HUD | Start             |

Nos diálogos: clique, E, Enter ou Espaço avançam. Para controles de toque no computador, abra com `?touch`;
para ver as caixas de colisão, use `?debug`.

---

## O que há na primeira entrega (MVP)

- **Cenário de parque cartoon 2D** com parallax em 5 camadas (céu, nuvens, cidade, colinas, árvores e casas),
  árvores balançando, flores, borboletas, lago, rio e portal.
- **Pongo** (personagem original) com 17 animações: idle, walk, run, jump, fall, sit, stand, eat, drink,
  sleep, read, write, swim, interact, kick, celebrate e ride, todas com squash & stretch.
- **Física Arcade** (Phaser 3): plataformas de mão única, coyote time, buffer de pulo, pulo de altura
  variável, natação com flutuação e queda no rio.
- **Objetos interativos**: gangorra, banco, caixinha de livros, bebedouro, balanço, piquenique,
  escorregador, bola (com física), bicicleta, ponte e portal.
- **3 NPCs** (Taro, Momo e a professora Kumi) e o guardião **Professor Silêncio**.
- **10 verbos principais** e mais 24 no diário (os módulos 1–3 completos, mais os verbos das ações do Pongo).
- **5 atividades pedagógicas** + desafio final:
  1. **Action Match** (gangorra): observe a animação e escolha o verbo.
  2. **Verb Runner** (Taro): minijogo de corrida para coletar o verbo pedido.
  3. **NPC Challenge** (Momo): responda 何をしていますか com blocos.
  4. **Grammar Bridge** (Kumi): a ponte é construída por uma frase correta.
  5. **Verb Transformer** (Kumi): forma de dicionário → ます, ません, ました, て, ています.
  6. **Action Boss** (Professor Silêncio): sequência de ações, ～ています e frase, sem combate.
- **10 missões**, cristais, pontuação, estrelas (1–3) e **9 conquistas**.
- **Interface completa**: título, mapa de fases, HUD, diário de verbos, caderno gramatical, inventário,
  caixa de diálogo, conquistas, revisão, pausa e configurações (furigana, tradução, romaji, efeitos,
  música, voz, reduzir animações).
- **Salvamento local** (`localStorage`, chave `odu-pongo-save-v1`), tolerante a falhas.
- **Desktop e celular**: escala responsiva, controles de toque multitoque, aviso de orientação e gamepad.

---

## Pedagogia

### INPUT → INTAKE → OUTPUT

Cada verbo tem três estágios, registrados no diário com bolinhas coloridas:

| Estágio    | Como acontece no jogo                                                              | Registro         |
| ---------- | ---------------------------------------------------------------------------------- | ---------------- |
| **Input**  | O Pongo faz a ação, e o cartão mostra o verbo, furigana, tradução, áudio e exemplo | `markSeen`       |
| **Intake** | Reconhecer: Action Match, Verb Runner, revisão por significado                     | `markRecognized` |
| **Output** | Produzir: montar frases, conjugar no Verb Transformer, responder NPCs              | `markProduced`   |

A tela de **Revisão** mostra verbos vistos, reconhecidos e usados, o domínio de cada conjugação,
os **erros recorrentes** (por tipo de erro) e as **revisões pendentes**, com treino rápido.

### Feedback corretivo explicativo

O jogo nunca diz apenas "errado". Cada alternativa errada traz o motivo:

- `走ます` → _"走る parece Grupo II, mas é exceção do Grupo I: a última sílaba muda de linha, não desaparece."_
- `公園に走っています` → _"に marca destino ou existência. Para o lugar onde uma AÇÃO acontece, usamos で."_
- Verbo fora do fim → _"Em japonês o verbo fica no FINAL da frase (ordem Sujeito-Objeto-Verbo)."_

### ～ています com cuidado

O jogo **não** ensina que ～ています significa sempre "estar fazendo". Cada verbo é marcado como:

- `progress`: ação em andamento (`走っています`, "está correndo");
- `result`: estado resultante (`座っています`, "está sentado"; `来ています`, "veio e está aqui").

O caderno gramatical também explica o uso de hábito (`毎日走っています`).

### Chunking com cores

| Papel     | Cor      | Exemplo        |
| --------- | -------- | -------------- |
| Tópico    | azul     | ポンゴは       |
| Local     | verde    | 公園で         |
| Objeto    | roxo     | 水を           |
| Partícula | amarelo  | は・で・を・に |
| Verbo     | vermelho | 走っています   |

Os blocos podem ser **arrastados** (mouse ou toque) ou **tocados**. Ordens alternativas gramaticais
(`公園でポンゴは走っています`) também são aceitas, com uma nota sobre qual soa mais neutra.

---

## Arquitetura

```
pongo/
├── index.html                 # contêiner do canvas + camada de UI
├── package.json · vite.config.js · eslint.config.js · .prettierrc.json
├── public/
│   ├── favicon.svg
│   └── assets/manifest.json   # (opcional) spritesheet oficial do Pongo
├── tools/sprites.html         # prévia de todos os sprites (dev)
├── tests/                     # testes de gramática, romaji, furigana e frases
└── src/
    ├── main.js                # inicialização, navegação entre cenas/telas
    ├── art/                   # arte procedural em Canvas 2D (sem arquivos de imagem)
    │   ├── dog.js             #   Pongo + NPCs caninos + poses das animações
    │   ├── silence.js         #   Professor Silêncio
    │   ├── scenery.js         #   cenário, brinquedos, partículas
    │   ├── sheets.js          #   montagem dos spritesheets (2× para telas retina)
    │   └── register.js        #   registro no Phaser + quadros como PNG para a UI
    ├── core/                  # estado e serviços
    │   ├── store.js           #   progresso + configurações (localStorage)
    │   ├── content.js         #   acesso aos dados JSON
    │   ├── events.js          #   barramento de eventos
    │   ├── audio.js           #   efeitos e música sintetizados (Web Audio)
    │   └── tts.js             #   pronúncia (Web Speech API, ja-JP)
    ├── data/                  # conteúdo pedagógico em JSON
    │   ├── verbs.json         #   34 verbos: grupo, exceções, exemplos, ～ています
    │   ├── sentences.json     #   frases em blocos + distratores com explicação
    │   ├── missions.json · npcs.json · grammar.json · achievements.json · items.json
    ├── lang/                  # regras da língua (puras, testáveis em Node)
    │   ├── conjugation.js     #   motor de conjugação + explicações + erros típicos
    │   ├── ruby.js            #   furigana ({漢字|かんじ}) e alinhamento automático
    │   ├── romaji.js          #   Hepburn
    │   └── sentenceCheck.js   #   correção de frases com feedback
    ├── entities/              # Pongo (física separada do visual) e NPCs
    ├── systems/               # entrada unificada, Action to Learn, conquistas
    ├── scenes/                # Boot, Title, Park (fase 1), Runner (minijogo), parallax
    ├── ui/                    # interface DOM animada com GSAP
    │   ├── ui.js · dom.js · hud.js · dialogue.js · touch.js
    │   ├── screens/           #   título, mapa, diário, caderno, inventário, revisão…
    │   └── activities/        #   Action Match, montador de frases, Transformer, Boss
    └── styles/main.css
```

**Princípios técnicos**

- **Phaser** cuida do mundo do jogo (física, câmera, cenas). A **interface é DOM** animada com **GSAP**:
  isso dá `<ruby>` nativo para furigana, acessibilidade e arrastar e soltar confiável no toque.
- **Os dados ficam separados da lógica**: para adicionar verbos, frases ou missões, basta editar os JSON.
- **Nenhum asset é obrigatório**: toda a arte é gerada em canvas, então não existe "imagem não encontrada".
- **Limpeza ao trocar de cena**: listeners do barramento, tweens, timers e controles são removidos no
  evento `shutdown` de cada cena.
- **As regras de língua são puras** (`src/lang`) e testadas com `node --test`.

### Usar o sprite oficial do Pongo (ODU Creative)

O Pongo procedural é um placeholder original. Para usar a arte oficial, coloque o spritesheet em
`public/assets/pongo/` e edite `public/assets/manifest.json`:

```json
{
  "pongo": {
    "image": "assets/pongo/pongo_sheet.png",
    "frameWidth": 352,
    "frameHeight": 352,
    "animations": {
      "idle": [0, 5, 6, -1],
      "walk": [6, 13, 12, -1],
      "run": [14, 21, 16, -1],
      "jump": [22, 23, 10, 0]
    }
  }
}
```

Cada animação é `[primeiroQuadro, últimoQuadro, fps, repeat]`. Os quadros devem ter os pés a 94% da altura
(`footY = 166/176`), com o personagem olhando para a direita. Animações ausentes caem para `idle`.
Se o arquivo não existir, o jogo continua com a arte procedural.

### Adicionar um verbo

1. Inclua o verbo em `src/data/verbs.json` (`group`: 1, 2 ou 3; `exception: true` para 走る/帰る…).
2. Rode `npm test`: os testes conferem grupo, terminação, exemplos e todas as conjugações.
3. Se for uma ação do Pongo, defina `"action"` e crie a pose em `src/art/dog.js` (`PONGO_ANIMS`).

---

## Próximas fases (roteiro)

| Fase | Cenário      | Conteúdo                                                             |
| ---- | ------------ | -------------------------------------------------------------------- |
| 2    | 駅 Estação   | Módulo 1 completo: 行く・来る・帰る・入る・出る, partículas に/へ/を |
| 3    | 学校 Escola  | Módulo 2: 見る・聞く・書く・起きる + forma ない                      |
| 4    | 市場 Mercado | Módulo 3: 買う・使う・開ける・持つ + forma たい                      |

Three.js fica reservado para cenas especiais em 2.5D nas fases futuras; não é necessário no MVP.

---

© ODU Creative / ODU Kizuna. Personagens e arte do MVP são originais e gerados por código.
