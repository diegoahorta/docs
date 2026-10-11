# Pongo vai à China · 小狗 Pongo 去中国

Jogo 2D em estilo cartoon de mandarim para os níveis **Pré-HSK 1 e HSK 1**, no estilo dos materiais da **ODU Creative**
(Método ODU Chunking, com frases montadas em blocos coloridos).

> Pongo é um cachorrinho que ama aprender idiomas. Ele quer visitar os amigos na China, mas está
> preso no jardim. Para chegar a Pequim, ele atravessa seis cenários, e cada portal do caminho
> só se abre quando o jogador cumpre uma missão de mandarim.

## Como jogar

```bash
cd pongo-mandarim
python3 -m http.server 8000
# abra http://localhost:8000
```

O `index.html` usa módulos JavaScript, que os navegadores só carregam por um servidor web.
Qualquer hospedagem estática serve: Netlify, Vercel, GitHub Pages ou similar.

### Versão em arquivo único

`dist/pongo-vai-a-china.html` traz o jogo inteiro num só arquivo: CSS, JavaScript, sprites e
imagens embutidos. Ele abre com duplo clique, sem
servidor, e pode ser enviado por e-mail ou colocado num pendrive. Só as fontes vêm da internet;
sem conexão, o navegador usa fontes parecidas. Para gerar o arquivo de novo depois de mudar o jogo:

```bash
cd pongo-mandarim
npm install --no-save esbuild
node tools/build-single-html.mjs
```

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

Cada acerto solta confete e estrelinhas, toca um acorde, faz o Pongo pular (sprite de pulo) e mostra
um balão com a expressão dele.
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

| Fase | Cenário | Nível | Portal 1 | Portal 2 | Portal 3 |
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

## Visual 2D cartoon

- **Pongo** é animado com folhas de sprites recortadas das artes originais: `assets/sprites/pongo-walk.webp`
  (8 quadros de caminhada) e `assets/sprites/pongo-jump.webp` (8 quadros de pulo, usado nas comemorações;
  o último quadro é a pose parada). Os quadros estão alinhados pelo chão, 160 × 195 px e 161 × 293 px.
- **Expressões** (`assets/img/expr/`) vêm da folha "Pongo: expressões e reações": feliz, empolgado,
  piscando, curioso, surpreso, triste, pensativo, assustado, carinhoso, com osso, brincalhão e tchau.
  Elas aparecem no balão sobre o Pongo (curioso ao chegar no portal, triste ou assustado ao errar,
  feliz ou empolgado ao acertar), na lição, no retorno de cada resposta e nas telas de fim.
- **Cenários** são desenhados em canvas (`js/world.js`) no mesmo traço: contorno escuro, cores chapadas
  e camadas em parallax (céu, fundo, meio, chão e primeiro plano). Cada fase tem as próprias peças:
  casinha e cerca no jardim, bambuzal, montanhas cársticas e arrozais de Guilin, píer e barcos no porto,
  a Grande Muralha serpenteando nas montanhas, casas, pagodes e lanternas em Pequim, onde a panda Lili
  espera com a mesa de chá.

## Estrutura

```
pongo-mandarim/
├── index.html            telas: título, história, mapa, jogo, legenda, ajustes
├── css/style.css         visual "brinquedo de blocos" e cores ODU
├── js/
│   ├── data.js           tons, pinyin, sandhi, vocabulário HSK 1, frases em blocos, fases
│   ├── game.js           missões, desafios, pontuação, progresso
│   ├── world.js          mundo 2D: cenários em parallax, sprites do Pongo, portais, Lili
│   ├── assets.js         caminhos das imagens e das folhas de sprites
│   ├── audio.js          trilha lofi, efeitos, contorno dos tons, voz zh-CN
│   └── fx.js             confete, fogos, emojis, flashes, tremor
├── assets/sprites/       folhas de sprites (andar, pular)
├── assets/img/           retrato, expressões do Pongo e logo ODU Creative
├── tools/build-single-html.mjs   gera dist/pongo-vai-a-china.html
└── dist/                 o jogo em um único arquivo HTML
```

A voz em mandarim usa a síntese de fala do aparelho (`speechSynthesis`). Se não houver voz chinesa
instalada, o jogo continua funcionando com a melodia sintetizada dos tons e o pinyin na tela.
