# Pongo Learns English 🐶

Jogo educativo de inglês (A1/A2) da **ODU Creative**, no estilo Duolingo, com o mascote **Pongo**, um filhote de Jack Russell muito sapeca que quer aprender a falar inglês. O conteúdo vem da aula *“Cumprimentos e rotina diária em inglês”*: cumprimentos, verbo **be** e **Present Continuous**.

## Como jogar

**Jeito mais fácil:** abra o arquivo único `pongo-english.html`. O jogo inteiro está nele (mapa 3D, imagens, música e lições), então dá para mandar por e-mail, WhatsApp ou pendrive. Para gerar o arquivo de novo depois de mudar alguma coisa, rode `python3 tools/build_single_html.py`.

Versão em pastas: Abra `index.html` no navegador (Chrome, Edge, Firefox ou Safari). Funciona direto do disco e sem internet, porque tudo está na pasta, inclusive o Three.js. Só as fontes vêm do Google Fonts; sem internet, o navegador usa uma fonte parecida.

Se preferir um servidor local:

```bash
cd pongo-english-game
python3 -m http.server 8000   # depois abra http://localhost:8000
```

## O que tem no jogo

| Parte | Descrição |
| --- | --- |
| **Mapa 3D interativo** | Jardim grande com a casa do dono, modelado no **Blender**. Arraste para girar, use a roda do mouse ou dois dedos para dar zoom e toque no Pongo para ele latir e falar. |
| **7 paradas** | Portão → Canteiro de flores → Lago → Árvore grande → Casinha do Pongo → Horta de frutinhas → Porta da frente. Cada parada desbloqueia a próxima, e o Pongo anda pelo caminho de pedras até ela. |
| **60 desafios** | Múltipla escolha, completar a frase, pares (inglês ↔ português), escrever, **montar frases em blocos** e **ouvir e montar** (com voz em inglês e botão de velocidade lenta). |
| **Blocos coloridos** | Mesmo código de cores da apostila: azul = sujeito, verde = verbo, amarelo = complemento, lilás = tempo/lugar e laranja = expressão fixa. |
| **Pontuação** | XP por acerto (10 a 15). Combo de 3 acertos dá +5 XP e combo de 5 dá **XP em dobro**. São 5 vidas por lição, e o erro volta no fim da lição. Cada lição vale de 1 a 3 estrelas, mais ossinhos 🦴 e uma sequência de dias 🔥. O progresso fica salvo no navegador. |
| **Explosão de comemoração** | Ao acertar uma frase: confete, emojis, fogos, raios coloridos girando, tremida na tela, fanfarra e uma frase motivadora gigante em inglês (*PAWSOME!*, *YOU DID IT!*, *WOOF-TASTIC!*…). |
| **Música estilo jungle** | Trilha animada gerada ao vivo pelo navegador, com congas, shaker, marimba, breakbeat, baixo e passarinhos. Por isso não há arquivo de áudio nem problema de direitos autorais. Botões para ligar e desligar a música e os efeitos. |

## Versão em coreano: Pongo Aprende Hangul (한글)

O mesmo jogo, com o conteúdo da apostila **한글 — Hangul em Blocos** (6 módulos):

- **Arquivo único:** `pongo-coreano.html`. Versão em pastas: `coreano.html`.
- **7 paradas e 62 desafios:** O Hangul → Vogais → Consoantes → Duplas e batchim → Primeiras palavras → Expressões → Revisão (화이팅!).
- **Oficina de blocos:** o aluno toca as letras (ㅎ + ㅏ + ㄴ) e vê o bloco (한) se formar na hora (`js/hangul.js`).
- **Voz coreana** do próprio aparelho. Se o aparelho não tiver voz em coreano, aparece a pronúncia escrita.
- **Conteúdo:** `js/levels-ko.js`. O progresso fica salvo separado do inglês.

O motor (`js/game.js`) é o mesmo para os dois idiomas. Cada idioma é um pacote (`js/levels.js` ou `js/levels-ko.js`) com as lições e as falas do Pongo.

Para gerar os dois arquivos únicos de novo: `python3 tools/build_single_html.py`.
Teste automático que joga todas as lições: `NODE_PATH=$(npm root -g) node tools/playtest.cjs pongo-coreano.html`.

## Estrutura

```
pongo-english-game/
├── index.html
├── css/style.css
├── js/
│   ├── levels.js       ← conteúdo das lições (fácil de editar)
│   ├── game.js         ← telas, exercícios, pontuação
│   ├── map3d.js        ← mapa 3D (Three.js + GLB do Blender)
│   ├── audio.js        ← música jungle, fanfarra, efeitos e voz (Web Audio + fala do navegador)
│   ├── fx.js           ← explosão de comemoração (partículas)
│   ├── world-data.js   ← o .glb embutido (gerado)
│   └── vendor/         ← Three.js r147 (licença MIT)
├── assets/
│   ├── pongo_world.glb   ← mapa exportado do Blender
│   ├── pongo_world.blend ← cena do Blender para editar
│   ├── pongo.webp
│   └── odu-creative-logo.png
├── blender/build_pongo_world.py  ← script que constrói a cena no Blender
└── tools/embed_glb.py
```

## Editar o mapa no Blender

O mapa inteiro (jardim, casa, cerca, lago, árvores, casinha, horta e o próprio Pongo em 3D) é gerado por `blender/build_pongo_world.py`.

1. **No Blender:** abra `assets/pongo_world.blend` para editar à mão, ou rode o script na aba *Scripting*.
2. **Pelo terminal:** `blender --background --python blender/build_pongo_world.py -- assets/pongo_world.glb`
   (ou `pip install bpy` no Python 3.11 e `python3 blender/build_pongo_world.py assets/pongo_world.glb`)
3. Atualize o arquivo embutido: `python3 tools/embed_glb.py`

As paradas das lições são *empties* chamados `LVL_1` … `LVL_7`. Se você mover uma delas no Blender, o marcador no jogo acompanha. O caminho que o Pongo percorre ao andar está repetido em `PATH_2D` no `js/map3d.js`.

## Editar ou criar lições

Tudo fica em `js/levels.js`. Exemplo de frase em blocos:

```js
{
  type: 'build', pt: 'O sol está brilhando hoje.',
  blocks: B('The sun/s | is shining/v | today./t'),   // resposta, na ordem
  extra:  B('are shining/v | shine/v'),               // blocos distratores
  tip: 'is shining = ação em andamento.',
}
```
