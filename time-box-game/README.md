# Time Box: Grammar Voyager 🚀

Jogo 3D de navegador para praticar **Simple Present × Present Continuous**.
O aluno pilota uma nave em forma de **cabine telefônica britânica azul**, viaja pelo espaço e pelo tempo
num **mapa estelar interativo** e, em cada planeta, **monta frases em blocos**.

**Para jogar:** abra **`time-box.html`** com duplo clique (arquivo único com tudo embutido).

## Como funciona
- **Mapa estelar 3D:** arraste para girar, zoom com a roda/pinça, clique num planeta para ver a missão e toque em *Viajar*.
  A rota percorrida acende em ciano; planetas se liberam em sequência.
- **Viagem pelo vórtice** do tempo com o som de materialização da nave.
- **Missão:** cada planeta mostra a regra (briefing) e 5–6 frases em português. O aluno toca nos blocos na ordem certa
  (blocos falsos incluídos: *drinks / am drinking*, *do / does*, *runing*...) e toca em **Ativar**.
- **Cores dos blocos:** quem (azul), auxiliar (roxo), verbo (verde), complemento (laranja), tempo (amarelo), pergunta (ciano).
  Nos planetas 6–8 as lacunas não mostram a categoria (mais difícil).

| Planeta | Conteúdo |
| --- | --- |
| 1. Rotina | Simple Present afirmativo, -s na 3ª pessoa |
| 2. Agora | Present Continuous (am/is/are + -ing) |
| 3. Cristal da Ortografia | studies, goes, running, making, swimming |
| 4. Vulcão do Não | don't/doesn't × am not/isn't/aren't |
| 5. Gelo das Perguntas | Do/Does…? × Am/Is/Are…-ing? |
| 6. Nebulosa dos Marcadores | always/usually/never × now/Look!/at the moment |
| 7. Dia & Noite | contraste rotina × exceção de agora |
| 8. Buraco do Paradoxo | desafio final + verbos de estado (know, like, understand) |

## Pontuação
- Frase certa: **100** + **50** se acertar de primeira + **bônus de tempo** (até 60), multiplicado pelo **combo**
  (+0,25 a cada acerto seguido de primeira, até ×3).
- Erro: **−25** (os blocos errados piscam; depois de 2 erros aparece a dica da regra). Dica: **−30**.
- Estrelas por planeta: ⭐⭐⭐ sem erros, ⭐⭐ até 3, ⭐ nos demais. O placar total soma o recorde de cada planeta (salvo no navegador).
- Acertar dispara a **comemoração**: flash, estrelas em hiperespaço, anéis hexagonais, raios, faíscas, texto gigante com
  efeito de glitch, uma **frase motivacional em inglês** (com tradução) lida em voz alta e uma fanfarra sci-fi.

## Arquivos
```
time-box.html            jogo completo em um arquivo (gerado)
index.html, js/*.js      código-fonte (three.js)
models/*.glb             modelos 3D exportados do Blender
blender/build_models.py  gera a nave, os 8 planetas, asteroide e estação espacial
tools/build_single_html.py  empacota tudo em time-box.html
```
Regerar modelos: `blender --background --python blender/build_models.py` (ou `pip install bpy` e `python3 ...`).
Regerar o arquivo único: `npm i three@0.160.0 && python3 tools/build_single_html.py --three node_modules/three`.

A música é uma composição original sintetizada no navegador (baixo "galopante", melodia tipo teremim, pads e arpejos).
A nave e o visual são uma homenagem ao estilo das séries britânicas de ficção científica, sem marcas ou nomes oficiais.
