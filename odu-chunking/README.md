# ODU Blocos

Sistema em HTML5 para estudar **inglês, francês, alemão e espanhol ao mesmo tempo**, com o método de Chunking da ODU Creative: a frase é montada em blocos coloridos por função, e o aluno vê como cada língua organiza os mesmos blocos.

## Como rodar

```bash
cd odu-chunking
npm install
npm start          # Live Server em http://localhost:5500
```

Também funciona com a extensão **Live Server** do VS Code: abra a pasta `odu-chunking` e clique em "Go Live". As configurações recomendadas estão em `.vscode/`.

Three.js, GSAP e Phaser são carregados por CDN (jsDelivr) via `importmap` no `index.html`. Não há etapa de build, mas é preciso estar conectado à internet.

| Script                            | O que faz                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `npm start`                       | servidor local com recarga automática (live-server)                               |
| `npm run lint` / `lint:fix`       | ESLint 9 (flat config)                                                            |
| `npm run format` / `format:check` | Prettier                                                                          |
| `npm run check`                   | lint + checagem de formatação                                                     |
| `npm run build:lexico`            | regenera `src/data/lexico.js` a partir de `../vocabulario/dados/vocabulario.json` |

## O método no sistema

O sistema segue o **Template Padrão de Aula ODU Creative** e a pesquisa _Chunking na Aquisição de Segunda Língua_.

**Legenda de cores (Mapeamento Sintático).** É a mesma em todas as telas e nos quatro idiomas:

| Bloco | Função                                                                  |
| ----- | ----------------------------------------------------------------------- |
| 1     | Tópico / Sujeito                                                        |
| 2     | Tempo / Advérbio                                                        |
| 3     | Lugar / Destino                                                         |
| 4     | Objeto / Complemento                                                    |
| 5     | Verbo / Ação / Auxiliar                                                 |
| 0     | Expressão / Conector (extensão para "por favor", "obrigado", polywords) |

**Cada aula** tem as seções do template, nesta ordem:

1. Objetivos (reconhecimento, aplicação, comunicação).
2. Legenda de cores.
3. Ponto gramatical (forma em cada idioma, função e modo de uso).
4. Frases em blocos nos 4 idiomas.
5. **Scaffolding** em 4 níveis: núcleo da ação → + objeto/destino → + sujeito → + tempo/contexto.
6. Diálogo em blocos.
7. Prevenção de erros da L1 (✗/✓ com nota do professor).
8. **Substituição de blocos** (drilling).

## Telas

| Tela      | Tecnologia          | O que faz                                                                                                                                                                                                                  |
| --------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Início    | **Three.js + GSAP** | Blocos 3D da frase modelo que se reorganizam em EN → FR → DE → ES. Mostra a ordem de cada idioma, como o verbo em 2º lugar no alemão.                                                                                      |
| Aulas     | GSAP                | Aulas completas no formato do template. Clique em um bloco para ouvi-lo; passe o mouse para destacar a mesma função nos 4 idiomas.                                                                                         |
| Memorizar | GSAP                | Revisão espaçada (Leitner, 1 → 3 → 7 → 21 → 60 dias). O cartão é sempre a frase inteira em blocos. Há dois modos: frente em PT-BR ou ditado em blocos (áudio). Atalhos: espaço vira o cartão, 1–4 avaliam.                 |
| Construir | **Phaser 3**        | Organização sintática: toque ou arraste os blocos embaralhados para a linha. Sempre sobra um bloco de distração. O modo **4 idiomas** passa a mesma frase em EN, FR, DE e ES seguidos. Tem pontos, sequência ×5 e recorde. |
| Mapa 3D   | **Three.js**        | Constelação com 4 aglomerados (um por idioma). Cada frase aparece nos 4 e fica ligada às suas traduções. A cor e o tamanho mostram o domínio. Toque em um ponto para abrir a aula.                                         |
| Léxico    | —                   | As 2.284 palavras mais frequentes, com busca nos 5 idiomas e filtro por faixa. FR, DE e ES já vêm com as correções da lista de alertas.                                                                                    |

O áudio usa a Web Speech API do navegador, com vozes en-US, fr-FR, de-DE e es-ES. O progresso fica no `localStorage`.

## Estrutura

```
odu-chunking/
├── index.html            # shell + importmap (three, gsap, phaser)
├── styles/main.css       # tokens de cor (claro/escuro) e componentes
├── src/
│   ├── main.js           # roteador por hash (#inicio, #aula-l02, #construir…)
│   ├── config.js         # idiomas, legenda de blocos, intervalos SRS
│   ├── data/licoes.js    # 6 aulas no formato do template (fonte de conteúdo)
│   ├── data/lexico.js    # gerado: 2.284 palavras
│   ├── core/             # blocos, UI, voz, revisão espaçada, progresso, tema
│   ├── views/            # uma tela por arquivo
│   ├── game/             # rodadas + cena Phaser
│   └── three/            # cena do início e mapa 3D
├── scripts/build-lexico.mjs
├── eslint.config.js · .prettierrc.json
└── .vscode/              # Live Server, ESLint e Prettier
```

### Como escrever uma aula nova

Em `src/data/licoes.js`, cada frase é escrita em blocos `categoria:texto`, na ordem natural de cada idioma:

```js
{
  id: 'l02f1',
  pt: 'Hoje eu estudo línguas na escola.',
  p: '.',
  b: {
    en: '1:I|5:study|4:languages|3:at school|2:today',
    fr: "2:aujourd'hui|1:j'|5:étudie|4:les langues|3:à l'école",
    de: '2:heute|5:lerne|1:ich|3:in der Schule|4:Sprachen',
    es: '2:hoy|1:yo|5:estudio|4:idiomas|3:en la escuela',
  },
}
```

A exibição cuida sozinha da maiúscula inicial, da elisão (`j'` + `étudie`), do `¿ ¡` no espanhol e do espaço fino antes de `? !` no francês. Um bloco que começa com vírgula (`0:, please`) se cola ao anterior. O jogo, os cartões e o mapa passam a incluir a frase nova automaticamente.
