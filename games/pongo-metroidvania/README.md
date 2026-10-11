# Pongo Metroidvania

Plataforma 2D de rolagem lateral no estilo metroidvania. Os personagens são os mesmos das outras versões:
o **Pongo**, os **Gramáticos** e o **ODU-X**. O conteúdo vem das aulas **Advanced Grammar em Blocos · Units 1–3**
(Prof. Diego Horta · ODU Creative). Abra `index.html` no navegador: é um arquivo só, sem dependências externas
além das fontes do Google Fonts.

## Mapa e progressão

A cidade é um mapa contínuo de 150 × 46 blocos. Cada Tense Core dá uma habilidade que abre a próxima área:

| Área | Unit | Como chegar | Cofre libera |
|---|---|---|---|
| Bunker (zona segura) | — | início | — |
| Mercado do Porto (oeste) | Unit 1 | descendo a rua | **Salto duplo** (Core α) |
| Chef's Lab (leste) | Unit 2 | paredão de 5 blocos: só com salto duplo | **Investida** (Core β) |
| Estação de Notícias (alto) | Unit 3 | plataformas acima do bunker + cristal que só a investida quebra | **Latido sônico** (Core γ) |
| Hangar do ODU-X (subsolo) | Revisão integrada | escotilha listrada ao lado do bunker, abre com os 3 cores | final |

Cada zona tem terminais com os puzzles das aulas: escolha, correção de erro, digitação, frases em blocos e "Qual bloco é este?".
O cofre da zona abre depois de 3 terminais. As 10 pistas liberam a Dica ODU dos terminais da zona.

## Personagens

- **Pongo**: as poses "dormindo" (parado por mais de 8 s) e "assustado" (ao levar dano) vêm da folha de expressões.

  As 16 expressões aparecem nos diálogos dos terminais. O busto "Atento" virou o cut-in de anime do pulso da lanterna.
  O ataque é o **latido**: um "AU!" que viaja e atordoa. Com o Core γ ele vira "AUUU!", que vai mais longe e atravessa inimigos.
- **Animações quadro a quadro** (folhas `pongo-caminhada.webp`, `pongo-pulo.webp`, `gramatico-animacoes.webp`):
  - Pongo:
    - a caminhada de 8 quadros acompanha a distância percorrida;
    - o pulo escolhe o quadro pela velocidade vertical (impulso, subida, topo, descida);
    - há um quadro de aterrissagem ao tocar o chão;
    - o último quadro do pulo é a pose parada, com respiração;
    - a investida usa o quadro do salto horizontal, com rastro.
  - Gramático:
    - parado;
    - curvado ao patrulhar;
    - garra erguida ao avistar o Pongo;
    - salto e curvado alternando na perseguição;
    - recuo ao levar dano e ao morrer;
    - **ataque**: preparo agachado (com o anel ciano) seguido do golpe com o arco de energia, que acerta à frente dele.
  `tools/separar-quadros.py` separa as figuras de cada folha pelos pedaços conectados do canal alfa. As partículas soltas
  (olhos, glifos) se juntam à figura mais próxima. Cada quadro guarda o ponto de apoio nos pés, para as poses não "pularem" no chão.
- **Gramáticos**: patrulham as plataformas, mostram o "!" ao avistar o Pongo e perseguem. Têm contorno ciano para aparecer no escuro.
  Errar um terminal faz um deles surgir perto do Pongo ("eles ouvem erros"). Também há olhos flutuantes, inspirados nos olhos ao redor do Gramático da ilustração.
- **ODU-X**: dorme escurecido no hangar, e cada core coletado acende uma luz nele. Depois da Revisão integrada vem a cutscene
  "ODU-X ONLINE". Em seguida, ele apaga com feixes a última onda de Gramáticos.

## Controles

| Ação | Teclado | Toque |
|---|---|---|
| Andar | ← → / A D | ◀ ▶ |
| Pular (segure para ir mais alto; pule de novo no ar com o salto duplo) | Espaço / W / ↑ | PULAR |
| Descer de plataforma fina | ↓ + pular | — |
| Latido | J / C | LATIR |
| Investida | Shift / K | DASH |
| Examinar | E | USAR |
| Pulso da lanterna / sinalizador | F / G | PULSO / SINAL |
| Mapa / diário / pausa | M / I / Esc | botões no topo |

O bunker recupera vida. Cair na água do porto custa uma pata e volta o Pongo para o último chão seguro. O progresso é salvo no navegador.

## Arquivos

- `assets/`: as ilustrações originais.
- `tools/`: os scripts de recorte, o template do jogo e o `build.py`, que monta o HTML com o conteúdo das aulas.
