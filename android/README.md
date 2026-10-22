# Apps Android: Nihongo Drops e Hangul Drops

Empacota os dois jogos como apps Android (APK):

| App | Arquivo | Identificador | Voz |
| --- | --- | --- | --- |
| Nihongo Drops (japonês) | `dist/nihongo-drops.apk` | `io.github.diegoahorta.nihongodrops` | `ja-JP` |
| Hangul Drops (coreano) | `dist/hangul-drops.apk` | `io.github.diegoahorta.hanguldrops` | `ko-KR` |

Cada app é uma WebView em tela cheia com o jogo inteiro embutido:

- **Funciona offline.** O HTML do app é a versão `--offline` do arquivo único: Three.js,
  Phaser e GSAP ficam dentro dele. Só a fonte do Google Fonts precisa de internet; sem
  ela, o Android usa a própria fonte japonesa/coreana.
- **Voz nativa.** A WebView não tem a síntese de voz da web, então o app oferece a ponte
  `window.FalaNativa`, ligada ao TextToSpeech do Android (`FalaNativa.java`). O
  `src/core/speech.js` dos jogos usa essa ponte quando ela existe.
- **Botão voltar.** Ele chama `window.voltarApp()` (em `src/main.js`): fecha o modal de
  cima, sai de um jogo para o menu e, no menu, fecha o app.
- Requer **Android 7.0 (API 24) ou mais novo**, com a WebView atualizada.

## Como instalar

1. Copie o `.apk` para o celular, ou baixe-o direto nele.
2. Abra o arquivo. O Android pede para permitir "instalar apps desconhecidos" para o app
   usado (Arquivos, Chrome...).
3. Para ouvir a pronúncia, o aparelho precisa da voz no idioma. Em
   **Configurações → Sistema → Idiomas → Saída de texto para fala**, instale os dados de
   voz em japonês e/ou coreano. A tela ⚙️ do jogo avisa se a voz não foi encontrada.

## Como gerar de novo

Requisitos (Ubuntu/Debian), sem Gradle:

```bash
sudo apt install aapt dalvik-exchange zipalign apksigner android-sdk-platform-23 openjdk-21-jdk
(cd nihongo-drops && npm install) && (cd hangul-drops && npm install)
./android/build-apks.sh
```

O script faz, para cada app:

1. gera `assets/index.html` com `node scripts/build-html.js --offline`;
2. monta os recursos (nome e ícones) e o `AndroidManifest.xml` a partir do modelo;
3. compila o Java (`javac`) e converte para DEX (`dalvik-exchange`);
4. empacota (`aapt`), alinha (`zipalign`) e assina (`apksigner`, esquemas v2 e v3).

### Assinatura (importante)

Na primeira execução é criada a chave `android/.chave/drops.keystore` (fora do git). A senha
padrão é `drops-local`; para trocar, use a variável `SENHA_DA_CHAVE`. **Guarde essa chave:**
para atualizar um app já instalado, o novo APK precisa ser assinado com a mesma chave (ou
será preciso desinstalar o app antes, perdendo o progresso salvo). Para mudar a versão, use
`VERSAO_CODIGO=2 VERSAO_NOME=1.1 ./android/build-apks.sh`.

## Arquivos

```
AndroidManifest.modelo.xml   manifesto com @ID@, @VERSAO_*@ e @IDIOMA_DA_VOZ@
java/.../MainActivity.java   WebView em tela cheia, links externos, botão voltar
java/.../FalaNativa.java     ponte JavaScript → TextToSpeech
icones/                      ícones (SVG gerados dos traços dos jogos + PNG por densidade)
build-apks.sh                gera dist/nihongo-drops.apk e dist/hangul-drops.apk
```

Os ícones são gerados por `node android/icones/gerar-svg.mjs` (あ com os traços do KanjiVG e
한 com os traços do Hangul Drops) e depois exportados em PNG (48, 72, 96, 144 e 192 px).
