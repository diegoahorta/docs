# Chunking Royale · Chrono Knight

Kit de aula **Future Continuous × Future Perfect** (Fonte: Unit 21 · Custo: 3 elixir), no estilo ODU Creative.
Material autoral ODU · Professor Diego Horta.

| Arquivo | O que é |
|---|---|
| `Chrono_Knight_Future_Continuous_x_Future_Perfect.docx` | Material do aluno (6 páginas): carta do personagem, teoria, 12 exercícios com respostas (Monte a frase · Complete a lacuna · Corrija o erro), desafio extra com 8 lacunas abertas, missão final e gabarito. |
| `Chrono_Knight_Apoio.pptx` | Slides de apoio (14), com notas do professor: missão, os dois poderes, linha do tempo, fórmulas em blocos, truque ODU, prática e rodada relâmpago. |
| `flashcards/index.html` | Flashcards 3D (HTML5 + JavaScript + Three.js), funcionam offline. |
| `game/index.html` | **Chrono Knight Arena**: jogo no estilo Clash Royale; cada tropa só entra em campo se o aluno acertar um desafio de gramática. |
| `assets/` | Arte vetorial do Chrono Knight e da arena (`svg/`), as versões em PNG e o Three.js local (`three.min.js`). |
| `build/` | `content.json` (banco de frases único) e os scripts que geram o DOCX e o PPTX. |

## Como usar

Abra `flashcards/index.html` e `game/index.html` direto no navegador. Não precisa de internet.
Se o navegador bloquear módulos em `file://`, sirva a pasta:

```bash
npx http-server chunking-royale/chrono-knight -p 8080
# http://localhost:8080/flashcards/  ·  http://localhost:8080/game/
```

## Imagens no Canva (identidade Chunking Royale)

| Imagem | Link |
|---|---|
| Carta do Chrono Knight (épica, 3:4) | https://www.canva.com/M/MAHYYtfUeB8 |
| Chrono Knight chibi (mascote, 1:1) | https://www.canva.com/M/MAHYYmCNIRU |
| Arena Chunking Royale (16:9) | https://www.canva.com/M/MAHYYlks4fA |
| Linha do tempo: em andamento → concluído (16:9) | https://www.canva.com/M/MAHYYk_7EUY |
| Tela de vitória (16:9) | https://www.canva.com/M/MAHYYmryg-Q |
| Blocos de chunks (16:9) | https://www.canva.com/M/MAHYYqfxvPE |

## Regerar o DOCX e o PPTX

```bash
cd chunking-royale/chrono-knight/build
npm i docx pptxgenjs sharp          # se ainda não estiverem instalados
node render.cjs                     # SVG → PNG
node build-docx.cjs
APPLY_THEME=/caminho/para/apply_theme.js node build-pptx.cjs   # opcional: aplica as cores do tema
```
