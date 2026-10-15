# Cachorro (filhote com roupa estampada)

Filhote de orelhas grandes, pelagem caramelo e creme, coleira azul-marinho e roupinha
com manchas verdes e azuis. Arte ilustrada (não é pixel art), virado para a direita.

| Arquivo | Tamanho | Frames | Animação |
|---------|---------|--------|----------|
| `cachorro_pulo_sheet.webp` | 2000 × 667, RGBA transparente | 8 | Pulo: 0 preparando → 1–4 subindo e no alto → 5–6 caindo/aterrissando → 7 em pé |
| `cachorro_andar_sheet.webp` | 2000 × 667, RGBA transparente | 8 | Andar/trotar em loop |

Os frames têm cerca de 250 px de largura, mas não estão numa grade exata: no pulo o
cachorro sobe dentro da imagem e, nas duas folhas, partes de um quadro encostam no
seguinte. Para usar na engine, é preciso recortar cada frame com a mesma âncora (por
exemplo, as patas de trás no chão) para a animação não "tremer".

A grade de referência em `../referencia_alien_cachorro_grade.jpg` mostra os frames
numerados (`jump0` … `jump7`, `walk0` … `walk7`).
