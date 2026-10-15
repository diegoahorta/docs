# Interface (botões)

Três estados de um mesmo botão/painel retangular, todos com 190 × 53 px (RGBA). O miolo
é cinza semitransparente (`#000000` com alpha 0x57 ≈ 34%), então ele escurece o que
estiver por trás. Os nomes dos estados foram deduzidos por mim a partir do visual.

| Arquivo | Cores | Visual | Estado provável |
|---------|-------|--------|-----------------|
| `botao_normal.png` | `#ffffff`, `#181425`, miolo | Borda branca, linha escura no topo | Normal |
| `botao_destaque.png` | `#2ce8f5`, `#181425`, miolo | Borda ciano, linha escura no topo | Hover / foco / selecionado |
| `botao_pressionado.png` | `#2ce8f5`, miolo | Borda ciano, sem a linha escura e 4 px mais baixo (y 4–52) | Pressionado |

Fonte para o texto dos botões: `../../fonts/Kenney_Mini_Square.ttf`.
