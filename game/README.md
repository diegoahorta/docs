# Piloto Pongo contra os Gramáticos

Shoot 'em up horizontal no estilo Parodius, feito em HTML5 + JavaScript com Three.js
(câmera ortográfica 2D, 640 × 360) e trilha sonora sintetizada com Web Audio.

**História:** os Gramáticos, alienígenas de sombra obcecados por regras, roubaram as
Partículas (QUE, SE, DE, EM…) e nenhuma frase do universo consegue mais se completar.
Pongo, um jovem cachorro piloto da Frota Latido, atravessa três setores para resgatá-las.

## Como jogar

- `dist/pongo.html`: versão em arquivo único (sprites e fonte embutidos). Abre com dois cliques.
- `index.html`: versão de desenvolvimento, que lê os arquivos de `assets/`. Precisa de um servidor
  local, porque o navegador bloqueia texturas WebGL vindas de `file://`:
  `npx serve game` ou `python3 -m http.server -d game`.

| Ação | Teclado | Toque |
|------|---------|-------|
| Mover | Setas / WASD | Arrastar o dedo |
| Atirar | Z / Espaço (segurar) | Automático enquanto toca |
| Ativar poder | X / Shift | Botão PODER |
| Pausar | P / Esc | Botão II |
| Som | M | Botão no menu |

## O que tem no jogo

- **3 fases:** Cinturão das Vírgulas (espaço), Mar das Reticências (céu, mar, palmeiras e nuvens)
  e Caverna do Pleonasmo (piso e teto de tiles; as paredes empurram e machucam).
- **Chefes:** Sujeito Oculto, Crase Indevida e Rei Pleonasmo (alien gigante com ataques em leque,
  golpe de lâminas ciano, invocação e espiral).
- **Barra de poder estilo Gradius/Parodius:** cada cápsula vermelha avança a seleção;
  VELOC, MÍSSIL, DUPLO, LASER, OPÇÃO (mini-naves que seguem Pongo) e ESCUDO.
- **Sinos:** atire para trocar a cor. Dourado dá pontos, azul explode a tela, verde deixa o Pongo gigante.
- **Partículas roubadas:** caem dos Gramáticos e dos chefes; contam pontos e aparecem no placar da fase.
- **Partículas japonesas (aula "Missão Internacional U.A."):** orbes amarelos brilhantes com
  は (wa), を (o), の (no) e か (ka), e esferas maiores com 人 (jin, nacionalidade) e 語 (go, idioma).
  Chegam em fileiras, caem dos Gramáticos e saem dos chefes derrotados. Ao pegar uma, aparece um
  cartão com a função e um exemplo da aula (お国はどこですか。, 日本語を話せますか。,
  ブラジルのポルトガル語, 何人ですか。, ブラジル人, 日本語) e o narrador lê em voz alta.
  Os orbes são PNGs gerados por `tools/prep_assets.py` com a fonte IPAGothic, então aparecem mesmo
  em aparelhos sem fonte japonesa.
- **Narrador ao vivo:** o pirata Capitão Caveirinha comenta a partida (balão de texto e voz do
  navegador em pt-BR, que pode ser desligada).
- **Trilha sci-fi:** sequenciador próprio (baixo, arpejos com eco, pad, bateria e melodia) com
  músicas de título, uma por fase, chefe, fanfarra de vitória e final.
- **Comemoração:** fogos de artifício com partículas e explosões coloridas ao concluir cada fase.

## Arquivos

- `assets/`: gerado por `tools/prep_assets.py` a partir de `../assets/sprites`. Os frames do
  cachorro e do alien são recortados da grade de referência (fundo magenta), porque nas folhas
  `.webp` os frames encostam uns nos outros.
- `tools/build_single.py`: gera `dist/pongo.html`.

Depois de mudar `index.html` ou os sprites:

```sh
python3 game/tools/prep_assets.py   # só se os sprites mudaram
python3 game/tools/build_single.py
```

## Sobre Unity 2D

O jogo usa Three.js, não Unity. Unity não roda direto numa página HTML: ele exporta para WebGL a
partir do editor, e isso não dá para fazer neste ambiente. Os sprites em `../assets/sprites` podem
ser importados num projeto Unity 2D se quiser portar o jogo depois.
