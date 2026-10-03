# Lua à Paris 🗼

Jogo 3D de **francês para iniciantes (A1)** baseado na aula *Francês em blocos no presente* (Odu Creative • Método Chunking).
A viajante brasileira **Lua** desembarca em Paris sem falar nada de francês. Num mapa 3D interativo da cidade,
ela vai a 8 lugares e, em cada um, **monta frases em blocos** para conversar e ganhar curtidas.

**Para jogar:** abra **`lua-a-paris.html`** com duplo clique (arquivo único com tudo embutido).

## Missões
| # | Lugar | Conteúdo da aula |
| --- | --- | --- |
| 1 | Aéroport Charles-de-Gaulle | pronomes (je, tu, il, elle, nous, vous, ils, elles) |
| 2 | Café de Saint-Germain | parler + idiomas, aussi |
| 3 | Appartement à Montmartre | habiter + à + cidade, elisão j’habite |
| 4 | Gare de Lyon | voyager + à / en / au / aux, nous voyageons |
| 5 | Tour Eiffel | être (suis, es, est, sommes, êtes, sont), nacionalidade |
| 6 | Louvre | mais, aussi, souvent, régulièrement, depuis |
| 7 | Notre-Dame et la Seine | perguntas por entonação e com est-ce que |
| 8 | Arc de Triomphe | apresentação final (sem as cores de apoio) |

Os blocos usam as funções da aula com cor e letra: **S** sujeito, **V** verbo, **C** complemento,
**A** conector/advérbio, **L** lugar/tempo. Blocos falsos treinam os erros comentados na aula
(*je habite*, *tu parle*, *nous voyagons*, *elle parle française*, *au France*...). Na frase final, J’ + habite viram *J’habite*.

## Pontuação (curtidas ❤)
- Frase certa: 100 + 50 se for de primeira + bônus de rapidez (até 60), multiplicado pelo combo (+0,25 por acerto seguido de primeira).
- Erro: −25 (blocos errados piscam; após 2 erros aparece a dica). Dica: −30.
- Estrelas por lugar; seguidores crescem com curtidas e estrelas. Ao terminar um lugar, as frases viram um "post".
- Comemoração: flash, explosões em cascata de corações, macarons, croissants, torres Eiffel e confete azul-branco-vermelho,
  texto gigante, **frase motivacional em francês** com tradução (lida em voz alta) e fanfarra de acordeão.

## Arquivos
```
lua-a-paris.html            jogo completo em um arquivo (gerado)
index.html, js/*.js         código-fonte (three.js)
models/*.glb                modelos exportados do Blender
blender/build_models.py     gera Lua, o chão de Paris com o Sena e os monumentos
tools/build_single_html.py  empacota tudo em lua-a-paris.html
```
Música: valsa musette original (acordeão, violão e contrabaixo) com ambiente de café, sintetizada no navegador.
O visual é inspirado em séries passadas em Paris, sem usar nomes ou marcas oficiais.
