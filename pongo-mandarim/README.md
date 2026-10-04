# Pongo vai à China · 小狗 Pongo 去中国

Jogo 3D de mandarim para os níveis **Pré-HSK 1 e HSK 1**, no estilo dos materiais da **ODU Creative**
(Método ODU Chunking, com frases montadas em blocos coloridos).

> Pongo é um cachorrinho que ama aprender idiomas. Ele quer visitar os amigos na China, mas está
> preso no jardim. Para chegar a Pequim, ele atravessa seis cenários 3D, e cada portal do caminho
> só se abre quando o jogador cumpre uma missão de mandarim.

## Como jogar

```bash
cd pongo-mandarim
python3 -m http.server 8000
# abra http://localhost:8000
```

O jogo precisa de um servidor web porque carrega os modelos `.glb` com `fetch`. Abrir o
`index.html` direto no navegador (`file://`) não funciona. Qualquer hospedagem estática serve:
Netlify, Vercel, GitHub Pages ou similar.

- **走 Andar:** toque no botão, toque no cenário ou segure ↑ / W / espaço.
- **Portais 牌坊:** cada fase tem 3 portais. Em cada um há uma lição curta e depois de 6 a 9 desafios.
- **Progressão:** a próxima fase só é liberada quando os 3 portais da fase atual forem abertos.
  O progresso fica salvo no navegador (`localStorage`).
- **Teclado:** as teclas 1 a 9 escolhem as alternativas.

### Pontuação

| Situação | Pontos |
| --- | --- |
| Acerto de primeira | 100 × combo |
| Acerto na 2ª tentativa | 50 × combo |
| Acerto depois disso | 25 × combo |
| Combo (acertos seguidos) | ×2 a cada 2 acertos, até ×5 |
| Missão cumprida | 200 + 100 por estrela (1 a 3 estrelas) |
| Fase concluída | +1000 |

Estrelas por missão: 3 com 90% ou mais de acertos de primeira, 2 com 65% ou mais, senão 1.

### Comemorações

Cada acerto solta confete na tela e no 3D, toca um acorde e faz o Pongo pular e girar.
Cada missão cumprida dispara a "explosão": canhões de confete, chuva de emojis 🧧🏮🐶🥟, fogos de
artifício, flashes coloridos, tremor de tela, estouro grave, bombinhas 鞭炮, gongo, fanfarra,
buzina, apito e torcida, e a voz diz 太棒了！. A fase concluída dispara tudo isso em dobro.
Em **Ajustes** existe o *Modo calmo*, com menos movimento e sem flashes. Ele já vem ativado para
quem usa a preferência "reduzir movimento" do sistema.

### Trilha sonora

A trilha lofi chinesa é gerada ao vivo com Web Audio, sem arquivos de áudio: guzheng dedilhado na
escala pentatônica (com a "puxada" de nota e glissandos 刮奏), piano elétrico abafado, batida boom-bap
com swing, bloco de madeira e chiado de vinil. Ela pode ser desligada no botão ♫.

## Conteúdo pedagógico

| Fase | Cenário 3D | Nível | Portal 1 | Portal 2 | Portal 3 |
| --- | --- | --- | --- | --- | --- |
| 1 | O Jardim do Pongo 花园 | Pré-HSK 1 | Os cinco tons | Pares mínimos (买/卖) | Os 20 pares de tons |
| 2 | A Floresta de Bambu 竹林 | Pré-HSK 1 | Sons do pinyin (j q x, zh ch sh r, z c s, -n/-ng, ü) | Sandhi (3+3, 不, 一) | Números 一 a 十 |
| 3 | Os Arrozais de Guilin 桂林 | HSK 1 | Pessoas e família | Cortesia | Blocos BL-01 e BL-02 |
| 4 | O Porto 港口 | HSK 1 | Comida e bebida | Compras e dinheiro | Blocos BL-03 a BL-05 |
| 5 | A Grande Muralha 长城 | HSK 1 | Tempo | Lugares e transporte | Blocos BL-06 a BL-08 |
| 6 | Pequim 北京 | HSK 1 | Verbos, adjetivos e perguntas | Blocos BL-09 e BL-10 | Chá com a Lili (diálogo) |

Tipos de desafio:

- **Tom:** ouvir a melodia (contorno de Chao sintetizado) e a voz zh-CN e escolher o tom.
- **Par de tons:** identificar a combinação de tons de palavras de duas sílabas.
- **Pinyin:** escolher a grafia certa entre pares mínimos de som e de tom.
- **Sandhi:** escolher como a palavra é pronunciada de fato.
- **Hanzi:** hanzi → significado, significado → hanzi, hanzi → pinyin, ouvir → hanzi, e jogo de pares.
- **Montar a frase:** os blocos coloridos vêm embaralhados e o jogador monta a frase na ordem da
  esteira (QUEM → QUANDO → ONDE → MODAL → FAZ → O QUÊ → PARTÍCULA). Ao errar, os blocos fora do lugar
  voltam ao monte e os espaços passam a mostrar a cor esperada.
- **Que bloco é este?** e **Complete o bloco que falta:** fixam o código de cores.
- **Diálogo:** responder à Lili escolhendo a frase com os blocos na ordem certa.

As cores dos blocos são as do material *Mandarim em Blocos* (ODU Creative):
Sujeito azul · Tempo âmbar · Lugar verde-azulado · Verbo vermelho · Objeto verde · Modal roxo ·
Partícula rosa · Advérbio cinza · Nº + classificador laranja · Interrogativo ocre.

Fontes do conteúdo: *Material Didático*, *Norteador* e *Mandarim em Blocos* (ODU Creative, 2026);
Yoyo Chinese (tone pairs); Wikipedia (*Standard Chinese phonology*); Language Trainers (*Chinese tones*);
PolyU (*Basic tones*). Todo o conteúdo está em `js/data.js`, para o professor editar.

## Os modelos 3D (Blender)

Todos os modelos foram gerados por script no Blender (`blender/build_assets.py`) e exportados em glTF:

| Arquivo | Conteúdo |
| --- | --- |
| `pongo.glb` | Pongo (tricolor, orelha esquerda em pé, coleira azul, camiseta de ossinhos) com as animações `Walk`, `Idle`, `Jump` e `Sad` |
| `panda.glb` | Lili, a panda, com as animações `Idle` e `Wave` |
| `gate.glb` | Portal chinês 牌坊 com as portas `DoorL` / `DoorR` |
| `scene_1.glb` … `scene_6.glb` | Jardim, floresta de bambu, arrozais de Guilin, porto, Grande Muralha e Pequim |

Para alterar e regenerar:

```bash
# com o Blender instalado (4.2 ou mais recente)
blender --background --python blender/build_assets.py -- assets/models

# ou com o Blender como módulo Python
pip install bpy==4.2.0
python3 blender/build_assets.py assets/models
```

O caminho de cada cenário vai de Y = 0 a Y = 64 no Blender (Z = 0 a −64 no jogo), e os portais ficam
em Y = 16, 32 e 48. O Pongo olha para +Y.

## Estrutura

```
pongo-mandarim/
├── index.html            telas: título, história, mapa, jogo, legenda, ajustes
├── css/style.css         visual "brinquedo de blocos" e cores ODU
├── js/
│   ├── data.js           tons, pinyin, sandhi, vocabulário HSK 1, frases em blocos, fases
│   ├── game.js           missões, desafios, pontuação, progresso
│   ├── world.js          cena 3D (Three.js): Pongo, portais, câmera, partículas
│   ├── audio.js          trilha lofi, efeitos, contorno dos tons, voz zh-CN
│   └── fx.js             confete, fogos, emojis, flashes, tremor
├── assets/models/*.glb   modelos exportados do Blender
├── assets/img/           arte do Pongo e logo ODU Creative
├── blender/build_assets.py
└── vendor/three/         Three.js r169 (licença MIT)
```

A voz em mandarim usa a síntese de fala do aparelho (`speechSynthesis`). Se não houver voz chinesa
instalada, o jogo continua funcionando com a melodia sintetizada dos tons e o pinyin na tela.
