# Pongo & ODU-X

Versão indie em estilo anime: o **Pongo** investiga a cidade invadida, destrava os terminais de inglês das aulas
**Advanced Grammar em Blocos · Units 1–3** (Prof. Diego Horta · ODU Creative) e desperta o **ODU-X**, um robô gigante
que apaga os **Gramáticos**. Abra `index.html` no navegador.

Junta as ideias das versões anteriores:
- de `dark-grammar-pongo`: o mapa aberto, as 10 pistas, os 18 terminais, a sobrevivência e o Pongo com poses e expressões;
- do modelo `dark-grammar-odu-x`: o robô ODU-X como objetivo final e os feixes que destroem as criaturas.

## Arte (pasta `assets/`)

| Arquivo | Uso no jogo |
|---|---|
| `pongo.webp`, `pongo-expressoes.webp` | Pongo: 5 poses no mundo 3D e 16 expressões nos diálogos |
| `gramatico.webp` | Inimigo em todas as zonas, com contorno ciano para aparecer na noite, balanço e "!" ao avistar |
| `odu-x.webp` | Robô de pé na plataforma norte (escurecido até despertar), na tela inicial e na vitória |
| `odu-x-cutscene.webp` | Cutscene "ODU-X ONLINE" com faixas de cinema, linhas de velocidade e tremor de tela |

`tools-preparar-assets.py` recorta o robô e o Gramático (que já têm fundo transparente), redimensiona tudo e gera o
JSON embutido no HTML (constante `INDIE`). As poses do Pongo vêm do script da versão `dark-grammar-pongo`.

## Final

1. Reúna os 3 Tense Cores (3 terminais por zona abrem o cofre de cada zona).
2. Na plataforma norte, responda à Revisão Integrada ("Qual bloco é este?").
3. Cutscene: *"I have been waiting for you, Pongo. The cores have synchronized."* (present perfect continuous + present perfect).
4. Todos os Gramáticos cercam a plataforma, e o ODU-X os apaga um a um com feixes. Em seguida vem a tela de vitória.

Toque ou clique para pular a cutscene. Com "reduzir movimento" ativado no sistema, as animações dela ficam desligadas.
O progresso é salvo separado das outras versões.
