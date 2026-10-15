# Alien (sombra com olhos ciano)

Criatura humanoide preta e esguia, com garras, tentáculos na cabeça e vários "olhos"
ciano brilhantes pelo corpo, cercada por cristais e partículas ciano flutuando.
Arte ilustrada (não é pixel art).

| Item | Valor |
|------|-------|
| Arquivo | `alien_sheet.webp` (2000 × 667, RGBA com fundo transparente) |
| Frames | 8, em uma linha, cerca de 250 px de largura cada |
| Sequência (pelo visual) | 0 parado → 1 agachado com anel de energia → 2 avançando → 3 braço erguido / ataque por cima → 4 golpe com arco ciano → 5 recuando → 6 recuperando → 7 parado (igual ao 0) |
| Uso provável | Animação de ataque ou de habilidade, em loop de "parado a parado" |

Os frames **não estão numa grade exata**: as partículas e o arco do golpe passam de um
quadro para o outro, então não dá para cortar automaticamente por colunas vazias. Para
usar na engine, os frames precisam ser recortados à mão (ou redesenhados numa grade fixa).
A grade de referência em `../referencia_alien_cachorro_grade.jpg` mostra os 8 frames
numerados (`alien0` … `alien7`).
