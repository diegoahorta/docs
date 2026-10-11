# Pongo vs Dark Grammar

Versão do jogo com o **Pongo** como protagonista, construída sobre a [versão anime](../dark-grammar-anime/).
Tem o mesmo mapa, as mesmas 10 pistas, os mesmos 18 terminais e a mesma Revisão Integrada das aulas
**Advanced Grammar em Blocos · Units 1–3** (Prof. Diego Horta · ODU Creative). Abra `index.html` no navegador.

## Como as ilustrações viraram sprites

As artes originais estão em `assets/`: `pongo.webp` e `pongo-expressoes.webp` (a folha "Expressões e reações").
O script `tools-recortar-sprites.py` (Python + Pillow + NumPy) gera tudo o que o jogo usa:

- **Poses do personagem** (o fundo é removido a partir das bordas, parando no contorno preto do desenho):

  | Pose | Quadro da folha | Quando aparece |
  |---|---|---|
  | em pé | ilustração grande | parado ou andando (com balanço e passo) |
  | correndo | Brincalhão | Shift / CORRER |
  | de costas | Tchau! | andando para o norte |
  | dormindo | Sonolento | parado por mais de 8 s |
  | assustado | Assustado | ao levar dano |

  Cada pose também é espelhada, para o Pongo olhar para a esquerda ou para a direita.
- **Retratos de diálogo**: os 16 quadros de expressão, recortados com o fundo colorido. O Pongo "fala" nos terminais:
  - ao abrir: curioso, atento ou pensativo;
  - ao acertar: feliz, empolgado, piscando, carinhoso ou brincalhão;
  - ao errar: assustado, surpreso, triste ou bravo.

  Nas pistas ele aparece pensativo; quando é capturado, triste; no final, dando tchau.

As imagens geradas ficam embutidas no `index.html` como data URI, então o jogo continua sendo um arquivo só.
Para regenerar: `python3 tools-recortar-sprites.py <pasta-com-1.webp-e-2.webp> <pasta-de-saída>`.
Depois, cole o conteúdo de `pongo_assets.json` na constante `PONGO`.

Os inimigos continuam sendo os Gramáticos desenhados por código. O progresso é salvo separado das outras versões.
