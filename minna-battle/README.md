# Minna no Nihongo — Batalha dos Reinos

Jogo em HTML para treinar a gramática do **Minna no Nihongo 初級 I (lições 1–25)** com o
**Método Chunk da Odu Creative**: cada frase é dividida em blocos coloridos e o aluno monta a
ordem correta para atacar o reino inimigo, no estilo Clash Royale.

Abra `index.html` no navegador (precisa de internet para carregar o three.js e as fontes).

## Como funciona

| Elemento | No jogo |
| --- | --- |
| Chunks coloridos | Mesma legenda da aula: **S** Sujeito (verde), **V** Verbo (amarelo), **O** Objeto/Complemento (roxo), **AUX** Partícula (salmão), **ADV** Advérbio/Tempo (azul) |
| Conteúdo | 25 lições × 3 pontos gramaticais × 4 frases = **300 frases** tiradas da aula, com distratores baseados no "erro comum" de cada ponto |
| Missão | Destruir o 天守閣 (castelo do rei) inimigo. Ele só fica vulnerável depois que uma das torres 櫓 cai |
| Progressão | A próxima lição só abre quando a missão é concluída (castelo inimigo destruído) |
| Acerto | Samurais atravessam a ponte e atacam, com explosão sonora, splash "すごい！", confete, flash e tremor de tela |
| Erro | O Time Oni contra-ataca e aparece a correção com a explicação do "erro comum" da aula |
| Pontuação | 100 pts + bônus de rapidez (até +100) × combo (até ×3); dica custa metade; +300 por torre, +600 pelo castelo; bônus de tempo e de defesa na vitória; até 3 estrelas por lição |
| Modos | **Solo vs. Oni** (computador) e **2 Times** (dois times da turma se revezam no mesmo aparelho) |
| Música | Lo-fi "for study" gerada ao vivo com Web Audio (piano Rhodes, bateria com swing, chiado de vinil) |
| Revisão | A partir da lição 3, frases de lições anteriores aparecem misturadas (marcadas como "Revisão") |

Atalhos: teclas `1`–`9` escolhem blocos, `Backspace` remove o último, `Enter` ataca, `M` liga/desliga a música, `Esc` pausa.
O **modo professor** (Configurações) libera todas as lições para uso em sala.

## Estrutura

```
minna-battle/
├── index.html                 # jogo pronto (gerado por build.py)
├── build.py                   # junta src/ + modelos num único HTML
├── src/
│   ├── data.js                # as 25 lições, pontos gramaticais, frases em chunks, erros comuns
│   ├── game.js                # regras, verificação das frases, pontuação, progressão, efeitos
│   ├── world.js               # arena 3D (three.js), tropas, torres, partículas
│   ├── audio.js               # música lo-fi e efeitos sonoros sintetizados
│   ├── style.css, body.html
├── blender/
│   ├── generate_models.py     # gera os modelos 3D low-poly no Blender
│   ├── render_preview.py      # renderiza preview.png
│   └── preview.png
└── models/*.glb               # castelo 天守閣, torre 櫓, samurai, oni, torii, ponte, sakura, lanterna, pedra
```

## Regerar os modelos 3D e o HTML

```bash
cd minna-battle/blender
blender --background --python generate_models.py   # ou: pip install bpy && python3 generate_models.py
cd .. && python3 build.py
```

Para editar frases, altere `src/data.js` (formato `chunk:TIPO … | tradução | distratores`) e rode `python3 build.py`.
