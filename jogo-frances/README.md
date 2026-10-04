# Chunks Français

Jogo interativo para montar frases em francês e treinar a conjugação de **être**, **avoir** e dos **verbos do 1º grupo (-er)**. O conteúdo vem da aula de 04/10/2026, que tem três unidades:

1. **Être et avoir**: ser/estar e ter, idade (`J'ai 25 ans`) e sensações (`avoir faim`)
2. **Il y a et c'est**: existência × identificação
3. **Verbes du 1er groupe**: terminações -e/-es/-e/-ons/-ez/-ent, `aimer` + artigo definido, perguntas com `est-ce que`

A quarta parada é um **desafio final** que mistura as três unidades.

## Como jogar

Abra `index.html` no navegador (ou sirva a pasta com `python3 -m http.server`).

- **Chunking com cores** (metodologia Odu Creative): cada frase vem dividida em blocos coloridos com a legenda da aula: S (Sujeito), V (Verbo), O (Objeto/Complemento), AUX (Auxiliar/Partícula) e ADV (Advérbio/Expressão).
- **Trilha progressiva**: a próxima lição só é liberada quando a anterior é concluída. Quem erra uma questão a vê de novo no fim da lição.
- **Pontuação**: +10 XP por acerto, bônus de combo de até +10, +20 XP ao concluir a lição e +30 XP se não houver erros. São de 1 a 3 estrelas por lição, há uma sequência de dias e um recorde de combo.
- **Vidas**: são 5 por lição. Se acabarem, a lição recomeça.
- **Acertos**: explosão sonora com confete, estrelas e croissants em 3D, flash colorido, chuva de emojis e tremor de tela. A frase também é lida em voz alta em francês.
- **Música lo-fi**: a trilha "for study" é gerada em tempo real (Web Audio), com piano elétrico, baixo, bateria swing e chiado de vinil. O botão **Lo-fi** liga e desliga.

O progresso fica salvo no próprio navegador.

## Elementos 3D (Blender)

O mascote Coco (um galo de boina em três expressões), os botões da trilha, os blocos coloridos, o troféu, a estrela, a Torre Eiffel e o croissant foram modelados e renderizados no Blender pelo script `blender/gerar_assets.py`:

```bash
blender -b -P blender/gerar_assets.py      # ou: pip install bpy && python blender/gerar_assets.py
python3 montar.py                          # gera index.html a partir de jogo.html
```
