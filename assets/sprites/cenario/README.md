# Cenário (tiles e decoração)

Mesmo estilo e paleta do personagem em `../pirata/`: o contorno `#33323d` é o mesmo.
Os usos de cada cor abaixo foram estimados a olho.

| Arquivo | Tamanho | Cores | Descrição |
|---------|---------|-------|-----------|
| `nuvens.png` | 448 × 101 | `#f5f1de`, `#eadfc7` | Faixa de nuvens creme para fundo/parallax. As bordas esquerda e direita têm a mesma altura, então provavelmente repete na horizontal sem emenda. |
| `tile_fundo_vinho.png` | 16 × 16 | `#73172d`, `#3b1725` | Tile de padrão vinho com borda escura, para preencher o fundo. |
| `caixa_madeira.png` | 48 × 48 (conteúdo 46 × 42) | 8 | Caixa de madeira com cantoneiras verdes: plataforma ou objeto empurrável. |
| `tileset_caverna.png` | 544 × 160 | 9 | Tileset de caverna/terra com grama no topo e bordas de pedra cinza. |

## Tileset da caverna

- Grade de **16 × 16 px**: 34 × 10 células, das quais 188 não estão vazias.
- Inclui blocos 3×3 completos (cantos, bordas e miolo), colunas e plataformas de uma
  linha, cantos internos e variações com grama pendurada e pedras no miolo.
- Paleta: escuro `#33323d` (interior), cinzas/lilás `#5a4e73` `#716b8e` `#9197b0`
  `#a9b6c3` (pedras), verdes `#335f61` `#407769` `#639d6d` `#92c191` (grama).

## Outros

| Arquivo | Tamanho | Cores | Descrição |
|---------|---------|-------|-----------|
| `reflexo_agua.png` | 170 × 10 | `#afc6d9`, `#ffffff` | Linhas claras de brilho/reflexo na superfície da água. |
| `palmeira_fundo/` | 51 × 53 × 4 frames | 6 | Palmeira de fundo animada (veja o README da pasta). |
