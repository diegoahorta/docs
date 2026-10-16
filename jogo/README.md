# Boulos vs Ratus Nunes

Beat 'em up de plataforma em HTML5 (JavaScript + Three.js), ambientado em São Paulo.
Boulos atravessa São Paulo para expulsar a Gangue dos Ratos de Ratus Nunes. São 7 fases:

1. **Marsilac**: a estação.
2. **Parelheiros**: o terminal.
3. **Grajaú, Conjunto BNH**: no meio da fase começa a chover, e a chuva vai engrossando.
4. **BNH alagado, sentido Bola Branca**: fase de jet ski. A rua virou rio; o Boulos acelera com
   inércia, pula entulho boiando, arranca contra os ratos (que também estão de jet ski) e
   mergulha em cima deles. No fim, desce na área segura para enfrentar o Ratus Direitus a pé.
5. **Belmira Marin, engarrafamento**: a enxurrada cobriu a avenida, e três fileiras de ônibus
   parados, colados uns nos outros, viram o caminho: o Boulos anda e luta por cima dos tetos,
   trocando de faixa. Cair na água machuca e joga o herói de volta para cima. Os ratos saltam
   da enxurrada para os tetos, e o Ratus Direitus também luta em cima dos ônibus.
6. **Cidade Dutra**: Interlagos.
7. **Avenida Paulista**: a luta final contra Ratus Nunes.

O subchefe Ratus Direitus aparece no fim de todas as fases.

Antes de cada fase, um mapa da Zona Sul (como em Final Fight) mostra para onde o jogador vai:
o bairro da fase acende em vermelho e o resto do mapa fica em preto e branco, enquanto o ônibus
viaja do bairro anterior até o novo. Na última fase o ônibus sai do mapa rumo à Paulista.

## Como rodar

### Arquivo único (mais fácil)

`jogo/dist/boulos-vs-ratus-nunes.html` é o jogo inteiro em um só arquivo HTML5, com scripts,
Three.js, sprites, fontes e músicas embutidos. Basta abrir no navegador (dá até para
mandar para alguém ou abrir no celular). Para gerar de novo depois de mudar o código ou os assets:

```bash
node jogo/ferramentas/gerar_html_unico.mjs   # precisa de Node.js 18+; baixa o esbuild via npx
```

### Versão de desenvolvimento

O jogo usa módulos ES e carrega arquivos de `../assets`, então precisa de um servidor
HTTP servindo a **raiz do repositório** (abrir o `index.html` direto do disco não funciona):

```bash
python3 -m http.server 8000
# abra http://localhost:8000/jogo/
```

Qualquer servidor estático serve (`npx serve .`, extensão Live Server etc.).
Não há etapa de build: o Three.js está incluído em `vendor/`.

## Controles

| Ação | Teclado | Controle |
| --- | --- | --- |
| Andar (inclusive para o fundo e para a frente) | Setas / WASD | Analógico / direcional |
| Pular (baixo + pular desce da plataforma) | Espaço / K | A |
| Golpe (4 seguidos = combo; no ar = voadora) | J / Z | X |
| Pegar e arremessar garrafa ou pedra | L / X | B |
| Força do Povo (energia cheia) | U / C | Y |
| Pausa | Esc / P | Start |
| Trocar música (DnB, MP3, mudo) | M | |
| Efeito de tela CRT | V | |
| Tela cheia | F | |

Em celulares e tablets aparecem botões de toque durante a partida.

## Mecânicas

- **Ondas de inimigos:** a câmera trava até a gangue ser derrotada; depois aparece "SIGA".
- **Combo de 4 golpes:** jab, direto, joelhada e chute lateral; o chute derruba. No ar, a voadora é o chute lateral.
- **Armas:** garrafas e pedras no chão (marcadas pelo destaque verde). A pedra cai de novo depois do arremesso.
- **Comidas:** coxinha (+25 de vida), pastel (+45) e estrela (+50 de energia). Os ratos às vezes deixam itens.
- **Plataformas:** ônibus, banca, ponto de ônibus, feira, carro e andaimes (bloco atravessável). Dá para subir pulando.
- **Buracos na rua** (área de perigo): machucam quem pisar, inclusive os ratos.
- **Força do Povo:** com a barra de energia cheia, derruba todos os ratos da tela.
- **Inimigos:** Ratinho de Esgoto (rápido), Ratazana (taco de beisebol), Rato do Lixão (arremessa sacos de lixo)
  o subchefe Ratus Direitus (socos, chute e investida, no fim de toda fase) e o chefe Ratus Nunes
  (investida, salto com onda de choque e reforços).

## Trilha sonora

A trilha drum and bass é sintetizada em tempo real com a Web Audio API (`js/audio.js`):
quebradas no estilo two-step e amen a 172–178 BPM, baixo reese com varredura de filtro,
sub-grave, pads, arpejos e stabs, com "sidechain" pelo bumbo. Cada fase tem a sua variação,
e o chefe e a vitória têm músicas próprias. Os efeitos sonoros também são sintetizados.
A tecla **M** alterna para as faixas `assets/audio/musica/bgm_action_*.mp3` ou desliga a música.

## Estrutura

```
jogo/
├── index.html            página do jogo (canvas do Three.js + HUD em HTML)
├── css/estilo.css        HUD, menus, diálogos e controles de toque
├── js/
│   ├── main.js           inicialização
│   ├── jogo.js           laço principal, câmera, ondas, fluxo da história
│   ├── atores.js         herói, ratos, projéteis, itens, efeitos
│   ├── cenario.js        céu, prédios, calçada, rua, plataformas, perigos
│   ├── fases.js          história e definição das 7 fases
│   ├── recursos.js       carregamento de sprites, fonte bitmap e texturas procedurais
│   ├── audio.js          trilha drum and bass e efeitos sonoros
│   ├── entrada.js        teclado, controle e toque
│   ├── hud.js            HUD e telas
│   ├── sprite.js         sprites 2D sobre planos do Three.js
│   └── config.js         constantes
├── sprites/              quadros recortados de assets/sprites (gerados)
├── dist/boulos-vs-ratus-nunes.html  o jogo em um único arquivo (gerado)
├── ferramentas/
│   ├── processar_sprites.py     recorta os sprites
│   └── gerar_html_unico.mjs     gera o arquivo único
└── vendor/three.module.min.js (Three.js r170, licença MIT)
```

Recursos do repositório usados pelo jogo:

- `assets/sprites`: herói (golpes, caminhada de 8 quadros, pular, pegar objetos, retrato),
  os ratos (caminhada e ações dos 4 tipos), o Ratus Direitus, o mapa da Zona Sul e os tilesets
  de São Paulo, Marsilac, Parelheiros, Grajaú BNH, BNH alagado, Belmira Marin e Cidade Dutra,
  e o Boulos e os ratos de jet ski
- `assets/sprites/ui`: botões, teclas, scanlines, overlay de dano, bloco atravessável, área de perigo, destaque
- `assets/fontes`: Upheaval (títulos e diálogos), SmallPixel-7 (HUD) e a fonte bitmap `Fonte_jogo` (números de dano)
- `assets/audio/musica`: trilha alternativa em MP3

### Regenerar os sprites

Se as imagens de `assets/sprites` mudarem:

```bash
pip install pillow numpy scipy
python3 jogo/ferramentas/processar_sprites.py
```

## Por que não Unity 2D

Unity é um motor separado, com editor próprio e projetos em C#. Ele não se combina com
Three.js na mesma página. O jogo foi feito em JavaScript puro com Three.js, renderizando em
2D com câmera ortográfica, e roda direto no navegador, sem build nem plugin.
