# ODU Blocos

Sistema em HTML5 para estudar **inglês, francês, alemão e espanhol ao mesmo tempo**, com o método de Chunking da ODU Creative: a frase é montada em blocos coloridos por função, e o aluno vê como cada língua organiza os mesmos blocos.

## Como rodar

### No navegador

```bash
cd odu-chunking
npm install        # também copia Three.js, GSAP, Phaser e as fontes para vendor/
npm start          # Live Server em http://localhost:5500
```

Também funciona com a extensão **Live Server** do VS Code: abra a pasta `odu-chunking` e clique em "Go Live". As configurações recomendadas estão em `.vscode/`. Depois do `npm install`, nada é baixado da internet: bibliotecas e fontes ficam em `vendor/`.

### App Android (APK offline)

O APK pronto está em [`releases/ODU-Blocos-1.0.0.apk`](releases/ODU-Blocos-1.0.0.apk).

1. Copie o arquivo para o celular.
2. Toque nele e permita "instalar apps desconhecidos" para o app de arquivos.
3. Requer Android 7.0 ou mais novo.

Para gerar um APK novo depois de mudar o conteúdo:

```bash
npm run android:build   # → android/dist/ODU-Blocos.apk
```

Precisa de Node 18+ e JDK 17+. Não é preciso Android Studio nem Gradle: o script usa `aapt2` (pacote npm `aaptjs3`), `javac`, `dx` e `apksig`. As ferramentas são baixadas uma vez para `android/tools/cache` (`npm run android:tools`).

Quem preferir o Android Studio pode abrir a pasta `android/`. Ela tem `build.gradle` e `settings.gradle`; rode `npm run build:www` antes de compilar.

**Versões e assinatura**

- A versão do app vem do campo `version` do `package.json`. Aumente esse número a cada APK novo.
- O APK é assinado com `android/odu-blocos-debug.p12` (senha `odublocos`). Use sempre a mesma chave, senão o Android não instala a atualização por cima.
- Para a Play Store, crie uma chave própria e passe `ODU_KEYSTORE`, `ODU_KEYSTORE_PASS` e `ODU_KEY_ALIAS` ao script.

**O que o app faz offline**

- **Progresso salvo no aparelho.** A revisão espaçada, o domínio por idioma, o recorde e as aulas vistas ficam no WebView e nas SharedPreferences do Android. Em Início → _Exportar backup_, você salva um arquivo `.json` (em Downloads, Drive etc.). _Importar backup_ restaura esse arquivo em outro celular.
- **Voz do Android.** O app usa o TextToSpeech nativo, que funciona sem internet depois que as vozes estão instaladas. O painel _Áudio offline_ mostra quais idiomas têm voz e tem o botão _Instalar vozes_.
- **Minha pronúncia.** Em cada frase da aula e no verso dos cartões há _Gravar_, _Minha voz_, _Comparar_ (modelo e depois a sua voz), _Importar áudio_ e _Apagar_. As gravações ficam no aparelho, por frase e por idioma.
- **Gravações de falantes nativos (opcional).** `npm run audio:roteiro` gera `audio/roteiro.csv` com os 596 textos que o app fala, cada um com o nome de arquivo esperado. Grave, coloque os arquivos em `audio/en/`, `audio/fr/`, `audio/de/` e `audio/es/` e gere o APK de novo. Essas gravações passam a ter prioridade sobre a voz sintética.

| Script                                     | O que faz                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `npm start`                                | servidor local com recarga automática (live-server)                               |
| `npm run lint` / `lint:fix`                | ESLint 9 (flat config)                                                            |
| `npm run format` / `format:check`          | Prettier                                                                          |
| `npm run check`                            | lint + checagem de formatação                                                     |
| `npm run vendor`                           | copia bibliotecas e fontes de `node_modules` para `vendor/`                       |
| `npm run build:www`                        | monta `www/`, a pasta empacotada no APK                                           |
| `npm run android:build`                    | gera o APK assinado em `android/dist/`                                            |
| `npm run audio:roteiro` / `audio:manifest` | lista os áudios possíveis / registra as gravações de `audio/`                     |
| `npm run build:lexico`                     | regenera `src/data/lexico.js` a partir de `../vocabulario/dados/vocabulario.json` |

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

A ordem do áudio é esta: gravação de falante nativo em `audio/`, se houver; depois a voz do Android (no APK); por fim a Web Speech API do navegador, com vozes en-US, fr-FR, de-DE e es-ES.

## Estrutura

```
odu-chunking/
├── index.html            # shell + importmap para vendor/ (three, gsap, phaser)
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
├── android/              # app Android: MainActivity.java (WebView + ponte OduNative), recursos e ícones
├── audio/                # gravações opcionais de falantes nativos
├── releases/             # APK pronto para instalar
├── scripts/              # vendor, www, APK, áudio e léxico
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
