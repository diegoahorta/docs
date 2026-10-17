# 漢字カード N5 — jogo de flashcards

Jogo em HTML5 + JavaScript + Three.js para estudar, revisar e aprender os **79 kanji do JLPT N5**,
feito a partir dos *Cards de Kanji · Método Doshisha* (Prof. Diego Horta · ODU Creative).

**Arquivo único:** `Kanji_Cards_N5_Jogo.html` tem tudo embutido (dados, imagens, Three.js, música) e funciona offline — é só abrir com dois cliques.

Versão em vários arquivos: abra `index.html` num navegador (ou sirva a pasta: `python3 -m http.server`).

## Modos
- **読 Estudar** — flashcards 3D que viram: kanji na frente; no verso, 音読み/訓読み, significado, nº de traços,
  ordem dos traços (書き順) e vocabulário com furigana e áudio (voz japonesa do navegador). Avalie com
  *De novo / Lembrei / Fácil*. Botão para esconder o furigana.
- **試 Quiz** — 10 perguntas com tempo (significado, kanji, leitura ON, leitura KUN, leitura e significado de palavras).
  Pontos = 100 + bônus de tempo, multiplicados pelo combo (×1,5 / ×2 / ×3). Confetes a cada acerto.
- **復 Revisão** — revisão espaçada no ritmo dos cards: D+1, D+3, D+7, D+14 e D+30. Errou, o kanji volta para a frente do maço.
- **合 Pares** — jogo da memória kanji ↔ significado.

O progresso (pontos, nível, caixas de revisão) fica salvo no `localStorage` do navegador.

## Arquivos
- `data.js` — dados extraídos do .docx (79 kanji, 315 palavras).
- `strokes/NNN.png` — imagens de ordem dos traços do .docx.
- `scene.js` — cena Three.js (pôr do sol City Pop em tons pastéis) e confetes 3D.
- `music.js` — trilha original estilo City Pop sintetizada com Web Audio + efeitos sonoros.
- `game.js` — lógica do jogo.

## Créditos
Dados: listas JLPT, KANJIDIC2/JMdict (EDRDG, CC BY-SA), KanjiVG (Ulrich Apel, CC BY-SA 3.0).
Traduções e seleção de vocabulário: ODU Creative. A trilha "Neon Sakura Drive" é uma composição original
inspirada no estilo City Pop dos anos 80; não usa gravações de terceiros.
