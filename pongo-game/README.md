# Pongo e o Osso Perdido · ポンゴ と ほね

Jogo em HTML/Three.js para praticar frases simples em japonês usando **apenas a partícula は e a cópula です**, seguindo a metodologia de **Chunking**: as frases são aprendidas em blocos (`[X は]` + `[Y です]`) que vão se abrindo até o jogador montar palavra por palavra.

O Pongo, um dálmata, perdeu o osso no jardim de casa. A cada buraco no mapa, o jogador monta 2 frases para destravar uma pista; o Pongo cava e segue para o próximo buraco até achar o osso.

## Como jogar

**Jeito mais fácil:** abra o arquivo único [`pongo-e-o-osso-perdido.html`](pongo-e-o-osso-perdido.html) com dois cliques. Ele já traz tudo embutido (CSS, JavaScript, Three.js e os modelos 3D) e funciona sem servidor e sem internet (só as fontes vêm do Google Fonts, com fonte reserva offline). Para regerar esse arquivo depois de mudar o código: `python3 pongo-game/build_single_html.py`.

Para desenvolver, a versão em vários arquivos usa módulos ES, então precisa de um servidor HTTP local (abrir via `file://` não funciona no Chrome):

```bash
cd pongo-game
python3 -m http.server 8000
# abra http://localhost:8000
```

- Toque nas peças para colocá-las nos espaços; toque numa peça encaixada para devolvê-la.
- **Verificar** confere a frase. **Dica** coloca a próxima peça certa (-40 pts). **Ouvir** lê a frase em japonês (voz do navegador).
- Toque no Pongo para ele latir. ワン！
- No topo: liga/desliga romaji, música e efeitos.

## Jornada (6 buracos, 12 frases)

| Buraco | Nível de chunk | Peças | Exemplo |
|---|---|---|---|
| 🏠 Casinha | Chunks inteiros | `[わたしは]` `[ポンゴです]` | わたしは ポンゴです。 |
| 🌸 Flores | Tópico aberto | `[これ]` `[は]` `[はなです]` | これは はなです。 |
| 🌳 Árvore | Comentário aberto | `[あれは]` `[き]` `[です]` | あれは きです。 |
| 🌿 Arbusto | Palavra por palavra | `[それ]` `[は]` `[ボール]` `[です]` | それは ボールです。 |
| 🌴 Palmeira | Palavra por palavra | | ポンゴは いいこです。 |
| 🦴 Cerca | Palavra por palavra | | ほねは ここです！ |

O conteúdo fica em [`js/content.js`](js/content.js): para adicionar frases, basta incluir `{ topic, comment, pt, clue, distract, note }` numa estação.

## Pontuação

Por frase: **100** de base + **50** se acertar de primeira (sem dica) + até **50** de rapidez − **40** por dica, multiplicado pelo **combo** (acertos seguidos de primeira: x1 → x1,5 → x2 … até x3). Cada buraco cavado dá +50 e o osso, +200. Estrelas no final pelo número de acertos de primeira; o recorde fica salvo no navegador.

## Estrutura

```
pongo-game/
├── index.html          # telas, HUD, painel do quebra-cabeça
├── style.css           # visual (glassmorphism, cores por tipo de chunk)
├── game.js             # fluxo do jogo, pontuação, combo
├── js/
│   ├── content.js      # frases, vocabulário e níveis de chunk
│   ├── world.js        # cena 3D (jardim, câmera, animações do Pongo)
│   ├── audio.js        # música "aventura na selva" + efeitos (Web Audio, tudo sintetizado)
│   └── fx.js           # explosão estilo candy crush (doces, raios, ondas, palavras)
├── models/             # modelos 3D gerados pelo Blender (.glb) + models-data.js (base64)
├── blender/
│   ├── build_models.py # script Blender que gera todos os modelos
│   └── embed_models.py # empacota os .glb em models/models-data.js
└── vendor/three/       # Three.js r160 (MIT) — sem dependência de CDN
```

## Modelos 3D (Blender)

Todos os modelos — Pongo (com pernas, cabeça e rabo articulados), osso, montinho/buraco de terra, casinha com placa "PONGO", casa, árvore, palmeira, arbusto, flor, cerca, pedra do caminho, bola e moeda de pista — são gerados proceduralmente por `blender/build_models.py`.

Para regerar:

```bash
blender --background --python pongo-game/blender/build_models.py
# ou, sem o Blender instalado:  pip install bpy && python3 pongo-game/blender/build_models.py
python3 pongo-game/blender/embed_models.py
```

## Áudio

Nenhum arquivo de áudio: a trilha (congas, shaker, baixo saltitante, marimba em Sol maior, pássaros e macaquinhos) e os efeitos (pops em cascata, arpejo, boom, fanfarra, latido, cavar) são sintetizados em tempo real com a Web Audio API. A pronúncia usa a voz japonesa do sistema (`speechSynthesis`, `ja-JP`), quando disponível.
