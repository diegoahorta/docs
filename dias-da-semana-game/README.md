# A Semana do Finn — Days of the Week 🦈

Jogo 3D para navegador, feito a partir da aula **"Dias da semana em inglês" (A1, 10–13 anos, Método Chunking)**.
O jogador é o **Finn**, um tubarãozinho que precisa ir aos compromissos da semana montando frases em inglês.

## Como jogar

| Ação | Teclado | Mouse / toque |
| --- | --- | --- |
| Nadar | setas ou W A S D | segurar o clique/dedo onde quer ir |
| Turbo | Espaço | toque duplo |
| Dica (−100 pts) | H | botão 💡 |
| Pausa / música | P · M | botões ⏸️ 🎵 |

1. Nade até as **bolhas de palavras na ordem certa** para montar a frase.
2. Com a frase completa, siga a **seta** e a **luz amarela** até o compromisso (escola, campo, fliperama…).
3. Ao completar a frase: **explosão de comemoração** com doces, estrelas, confete, raios de luz, tremor de tela, fanfarra, coral, torcida e locutor.

### Pontuação
- Bloco certo: **+100 × combo** (até ×5 com acertos seguidos)
- Bloco errado: **−50** (o combo zera) · Água-viva: **−100** · Pérola: **+10**
- Frase concluída: **+1000**, mais **bônus de tempo** (até +1000) e **+500 sem erros**
- Estrelas por fase: ⭐⭐⭐ sem erros, ⭐⭐ até 3 erros, ⭐ nos demais casos. O recorde e as fases liberadas ficam salvos no navegador.

## As 6 fases (ligadas à aula)

| Fase | Conteúdo da aula | Exemplo |
| --- | --- | --- |
| 1. Os 7 Dias | Missão 1 e a música (começando por Monday e depois por Sunday) | Monday, Tuesday… |
| 2. What day is it today? | Chunk `Today is …`, sem `on`, contraste Tuesday × Thursday | Today is Friday. |
| 3. Dia de Escola | `I study English on …` (Missão 2c) | I study English on Monday. |
| 4. Hora de Jogar | `play video games` / `play football` | I play video games on Saturday. |
| 5. Música e Vídeos | `listen to` como um bloco só, `watch videos` | I listen to music on Sunday. |
| 6. A Agenda do Finn | Missão 4: *What do you do on …?* respondida pela agenda | I play football on Thursday. |

Os blocos usam o **código de cores da aula**: azul = quem, verde = ação, laranja = complemento, roxo = quando, amarelo = dia.
Cada bloco coletado e cada frase completa são lidos em voz alta (síntese de voz do navegador, em inglês).

## Rodando

O jogo carrega modelos `.glb`, então precisa de um servidor web local (abrir o arquivo direto com `file://` não funciona):

```bash
cd dias-da-semana-game
python3 -m http.server 8000
# abra http://localhost:8000
```

Ele usa three.js via CDN (jsDelivr) e as fontes do Google Fonts, então precisa de internet.

## Arquivos

```
index.html              telas, HUD e estilos
js/main.js              cena 3D (three.js), controles, regras e fluxo das fases
js/levels.js            conteúdo pedagógico: fases, frases, agenda e cores
js/audio.js             música de fundo e efeitos sonoros (Web Audio, tudo sintetizado)
js/fx.js                explosão de comemoração (canvas 2D)
models/*.glb            modelos 3D exportados do Blender
blender/build_models.py script do Blender que gera todos os modelos
```

### Modelos 3D (Blender)
Todos os modelos (Finn, peixes, água-viva, caranguejo, fundo do mar, corais, algas, pedras e os 7 lugares) são gerados por código no Blender.
Para regerar:

```bash
blender --background --python blender/build_models.py
# ou, sem o Blender instalado:  pip install bpy && python3 blender/build_models.py
```

### Música
Composição original no clima "fundo do mar" de desenho animado: guitarra havaiana com *slide*, ukulele, baixo "oom-pah",
percussão de coco e bolhinhas. É sintetizada em tempo real pelo navegador (não há arquivo de áudio).
