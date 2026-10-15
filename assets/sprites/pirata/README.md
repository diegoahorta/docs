# Sprite: Pirata (chapéu com caveira)

Personagem em pixel art: pirata baixinho com chapéu tricórnio roxo e caveira branca,
tapa-olho, nariz/barba avermelhados, camisa laranja com cinto amarelo e calça roxa.

## Animação

| Item | Valor |
|------|-------|
| Frames | 5 (`frames/frame_01.png` … `frame_05.png`) |
| Tamanho do frame | 64 × 40 px (RGBA, fundo transparente) |
| Área ocupada | x 20–43 (24 px de largura), base fixa em y = 31 |
| Topo por frame | 4, 5, 7, 6, 4 |
| Tipo | Idle / respiração em loop (squash & stretch) |
| Velocidade sugerida | ~120 ms por frame (≈ 8 fps) |

Os pés ficam fixos e o corpo "afunda" 3 px até o frame 3 e volta — o frame 5 é igual
ao 1 em altura, então o loop fecha sem salto.

## Paleta (10 cores opacas; usos aproximados)

| Hex | Uso |
|-----|-----|
| `#33323d` | Contorno |
| `#68538a` | Chapéu / calça (roxo) |
| `#7b7bab` | Brilho do chapéu |
| `#ffffff` | Caveira / olho |
| `#d06c63` | Nariz / barba (vermelho) |
| `#cd897c` | Sombra de pele |
| `#de9970` | Camisa (laranja) |
| `#eebc9d` | Pele |
| `#eac088` | Destaque da camisa |
| `#eed878` | Cinto (amarelo) |

## Arquivos

- `frames/` — frames originais, sem alteração
- `spritesheet.png` — tira horizontal 320 × 40 (5 × 64 px), na ordem 1→5
- `preview.gif` — prévia animada a 120 ms/frame

Novos anexos: adicionar como `frame_NN.png` em uma nova pasta por personagem/animação
em `assets/sprites/` e regenerar a spritesheet.
