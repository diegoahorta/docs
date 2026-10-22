# Hangul Drops 🌸

Coleção de minijogos no navegador para aprender o **hangul**, o alfabeto coreano, pensada
para iniciantes absolutos que falam português. Todo o conteúdo aparece em **coreano +
romanização + português**, e a romanização (Romanização Revisada, o padrão oficial) pode ser
desligada nas configurações.

É a versão coreana do [Nihongo Drops](../nihongo-drops/), com a mesma estrutura: menu 3D,
SRS, XP, streak, conquistas, painel de progresso e acessibilidade.

## Como o hangul é ensinado

O hangul junta letras (**jamo**) em blocos de sílaba: ㄱ + ㅏ = 가 (ga); com consoante final
(batchim), 가 + ㄴ = 간 (gan). O SRS libera o conteúdo nesta ordem:

1. vogais básicas: ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ; depois ㅑ ㅕ ㅛ ㅠ;
2. consoantes: ㄱ ㄴ ㄷ ㄹ ㅁ e ㅂ ㅅ ㅇ ㅈ ㅎ;
3. aspiradas (ㅋ ㅌ ㅍ ㅊ), tensas (ㄲ ㄸ ㅃ ㅆ ㅉ) e vogais compostas (ㅐ ㅔ ㅘ ㅢ…);
4. sílabas (가 거 고 구 그 기…). Um grupo de sílabas só entra depois que a consoante dele foi
   liberada.

Cada letra tem nome (ㄱ = 기역 giyeok), dica mnemônica em português ("ㅁ é uma boca, mouth:
m"), som (a voz `ko-KR` fala 가 para ㄱ e 아 para ㅏ) e animação da ordem dos traços.

## Os 5 minijogos

| Jogo                           | Como funciona                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Hangul Rain** 한글 비        | Letras e sílabas caem; digite a romanização antes que cheguem ao chão.                              |
| **Memory Hangul** 기억 게임    | Jogo da memória: letra/sílaba ↔ romanização e palavra ↔ imagem, em 4 níveis.                      |
| **Hangul Runner** 한글 달리기  | Troque de pista para estar no bloco pedido; os distratores são letras parecidas (ㅏ/ㅓ, ㄱ/ㅋ/ㄲ…). |
| **Monte a Sílaba** 음절 만들기 | Junte consoante + vogal para formar a sílaba pedida, vendo o bloco se montar ao vivo.               |
| **Caça-Palavras** 낱말 찾기    | Palavras coreanas escondidas numa grade de sílabas (de 5×5 a 8×8, com diagonais).                   |

## Stack

| Ferramenta              | Papel                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| JavaScript (ES Modules) | Toda a lógica, sem bundler, TypeScript ou frameworks                 |
| Phaser 3.90.0           | Os minijogos 2D                                                      |
| Three.js 0.180.0        | O menu em 3D (ilha com portão de palácio coreano e hangul flutuando) |
| GSAP 3.13.0             | Transições, feedback de acerto/erro e animação da ordem dos traços   |
| ESLint 10 + Prettier 3  | Código limpo e padronizado                                           |
| Live Server (VS Code)   | Servidor local para testar                                           |

As bibliotecas vêm do jsDelivr com versões fixadas, pelo `<script type="importmap">`. A fonte é
a Noto Sans KR (Google Fonts).

## Como rodar

1. Abra a pasta `hangul-drops/` no VS Code.
2. Clique com o botão direito em `index.html` → **Open with Live Server**.

> O primeiro carregamento precisa de internet (CDN e Google Fonts). Para ouvir a pronúncia,
> o sistema precisa ter uma voz em coreano; as configurações avisam se ela não existir.

### Versão em um único arquivo

O arquivo `dist/hangul-drops.html` traz o jogo inteiro: código, estilos, dados e favicon.
Para jogar, **basta abri-lo com dois cliques**, sem Live Server (é preciso estar online, por
causa das bibliotecas e da fonte). Depois de mudar o código, gere-o de novo:

```bash
npm run build:html   # junta src/ num só módulo com o esbuild (apenas nesta etapa)
```

### Qualidade de código

Requer Node.js 20.19 ou superior (recomendado: 22 LTS).

```bash
cd hangul-drops
npm install
npx eslint .
npx prettier --write .
```

## Estrutura

```
index.html            importmap, contêineres do HUD, das telas, do feedback e dos modais
src/main.js           inicialização e navegação entre o menu 3D e os jogos
src/data/hangul.js    jamo e sílabas: composição/decomposição Unicode, romanização, grupos
src/data/vocab.js     ~75 palavras (hangul, romanização, português, emoji)
src/data/strokes.js   ordem dos traços desenhada para o projeto (todas as 11.172 sílabas)
src/core/             armazenamento, configurações, SRS, progresso, conquistas, voz, áudio
src/ui/               HUD, modais, feedback, 🔊, tela Estudar, painel de progresso, CSS
src/menu3d/           cena Three.js (ilha, portão de palácio, hangul flutuante, fases)
src/games/            catálogo, host do Phaser, peças comuns e uma pasta por jogo
  pool.js             o que o aluno já pode ver (letras e sílabas liberadas pelo SRS)
  hangul-rain/  memory-hangul/  hangul-runner/  syllable-builder/  word-search/
scripts/build-html.js gera dist/hangul-drops.html
```

## Créditos

- Ordem dos traços: desenhada para este projeto, seguindo a regra geral (de cima para baixo,
  da esquerda para a direita). As sílabas usam os traços dos jamo, encaixados no bloco.
- Fonte: [Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR) (SIL Open Font
  License).
