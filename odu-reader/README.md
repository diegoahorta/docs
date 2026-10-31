# ODU Reader — Smart PDF & E-book Reader

**ODU CREATIVE — Read. Learn. Explore.**

Aplicativo Android nativo (Kotlin + Jetpack Compose + Material 3) para ler PDF e EPUB offline,
organizar uma biblioteca pessoal e estudar com ferramentas de leitura (TTS, anotações,
flashcards, chunking, descoberta gramatical e IA opcional).

- `applicationId` / `namespace`: `com.oducreative.reader` (o build *debug* usa o sufixo `.debug`)
- `minSdk` 26 (Android 8.0) · `targetSdk`/`compileSdk` 35
- Interface em português do Brasil, com recursos de strings preparados para outros idiomas (`values-en`)

## Funcionalidades

| Área | O que foi implementado |
|---|---|
| Biblioteca | Importação de PDF/EPUB pelo seletor do sistema (SAF), múltiplos arquivos, abertura por “Abrir com”/“Compartilhar” de outros apps, capa, título, autor, formato, “Continuar lendo”, filtros (lendo, recentes, concluídos, PDF, EPUB), ordenação (recente, nome, data, progresso), busca, coleções, favoritos, renomear título exibido, marcar como concluído, remoção com confirmação (o arquivo original **nunca** é apagado), detecção de duplicados por SHA-256 |
| Leitor PDF | Renderização sob demanda com `PdfRenderer` e cache LRU limitado; rolagem vertical contínua ou paginação horizontal; zoom por pinça e toque duplo, com re-renderização em resolução maior; ajuste à largura/página; miniaturas; ir para página; marcadores; busca textual na camada de texto (PdfBox-Android); seleção de texto da página para copiar, destacar, anotar e estudar; indicador de progresso; retomada automática; filtro escuro/sépia; OCR opcional (ML Kit, on-device) claramente identificado |
| Leitor EPUB | Readium Kotlin Toolkit 3: paginação ou rolagem contínua, tamanho/família da fonte, entrelinha, espaçamento de letras, margens, alinhamento, temas claro/escuro/sépia, sumário navegável, busca, marcadores, destaques coloridos (decorações), notas, seleção nativa com ações “Destacar” e “Estudar / anotar”, retomada por `Locator`, EPUB reflowable e fixed-layout, CJK/escrita vertical conforme metadados. Livros com DRM não são abertos |
| TTS | `TextToSpeech` do Android com vozes instaladas; reproduzir/pausar/continuar/parar/próximo trecho; velocidade e tom; escolha de idioma e voz; detecção de idioma (metadados ou heurística offline); destaque palavra a palavra quando o mecanismo informa `onRangeStart`; acompanha a página/trecho no leitor; mini player que continua ativo ao navegar pelo app; mensagem e atalho para instalar vozes ausentes |
| ODU Study Tools | Dicionário (apps instalados via `PROCESS_TEXT` offline; Wiktionary online opcional), tradução on-device opcional (ML Kit), notas, flashcards com contexto/referência e revisão espaçada (SM-2), chunking (pt, en, es, fr, de, ja, ko, zh) editável, “Discover the Pattern — Grammar Rule” (hipótese antes da explicação) |
| IA (Fase 4) | Desativada por padrão; usa a API Claude (SDK Java oficial da Anthropic) com a chave do próprio usuário; resumo, explicação de frase, vocabulário, exercícios e avaliação de hipóteses gramaticais; envia **somente** o trecho escolhido, após ação explícita |
| Anotações | Destaques por cor, notas, marcadores, histórico, busca, exportação para Markdown, TXT e DOCX; âncoras: página (PDF) e `Locator` JSON (EPUB) |
| Painel | Livros em andamento e concluídos, progresso por obra, tempo restante estimado, histórico de sessões, metas diária/semanal, sequência de dias, gráfico de 14 dias. Conta apenas tempo **efetivo** (pausas > 2 min e segundo plano não contam) |
| Privacidade | Dados apenas no armazenamento privado; sem permissões de armazenamento; backup em nuvem desativado; “Excluir todos os meus dados”; nenhum envio automático de livros |

## Arquitetura

MVVM + Repository, Coroutines/StateFlow, Room, DataStore, injeção de dependências manual
(`AppContainer` — sem Hilt, para reduzir complexidade de build).

```
app/src/main/java/com/oducreative/reader
├── app/              Application, MainActivity, AppContainer (DI)
├── core/
│   ├── database/     Room: OduDatabase, DAOs, conversores
│   ├── datastore/    SettingsRepository (DataStore)
│   ├── designsystem/ Tema ODU (claro/escuro/sépia), componentes
│   ├── navigation/   Rotas, NavHost, barra/trilho de navegação adaptativos
│   └── utilities/    Detecção de formato, idioma, segmentação de texto, formatação
├── data/
│   ├── models/       Entidades
│   ├── repositories/ Livros, anotações, estudo, estatísticas
│   └── sources/      Importador, PdfRenderer, PdfBox, Readium
└── features/
    ├── library/  pdfreader/  epubreader/  annotations/  texttospeech/
    ├── studytools/  dashboard/  settings/  reader/ (sessões de leitura)
app/src/test         testes unitários (JVM)
app/src/androidTest  testes instrumentados (Room, importação/abertura real de PDF/EPUB, UI Compose)
```

O leitor EPUB usa uma Activity própria (`EpubReaderActivity`) porque o navegador do Readium é um
`Fragment`; o restante do app é uma única Activity com Navigation Compose.

### Bibliotecas e licenças

- Readium Kotlin Toolkit 3.0.3 — BSD-3-Clause
- PdfBox-Android 2.0.27.0 — Apache 2.0 (camada de texto do PDF)
- AndroidX / Jetpack Compose / Room / DataStore / WorkManager — Apache 2.0
- Google ML Kit Text Recognition e Translate — termos do Google ML Kit (on-device)
- Anthropic Java SDK 3.2.0 — MIT (somente para o recurso de IA opcional)

## Como compilar

Pré-requisitos: JDK 17+, Android SDK (plataforma 35 e build-tools), ou Android Studio Ladybug/mais recente.

```bash
cd odu-reader
./gradlew assembleDebug
```

O APK fica em `app/build/outputs/apk/debug/app-debug.apk`. Instale com:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Testes:

```bash
./gradlew testDebugUnitTest
```

```bash
./gradlew connectedDebugAndroidTest   # requer emulador ou aparelho conectado
```

### Integração contínua

O workflow `.github/workflows/odu-reader-android.yml` (na raiz do repositório) compila o APK de
debug, executa os testes unitários, gera o build de release com R8 e o App Bundle (sem assinatura),
roda os testes instrumentados em um emulador (API 30) e publica `app-debug.apk` como artefato.

## APK assinado e Android App Bundle (AAB)

1. Gere uma chave (uma única vez; guarde-a com segurança — perder a chave impede atualizações):

   ```bash
   keytool -genkeypair -v -keystore odu-release.jks -alias odu-reader -keyalg RSA -keysize 4096 -validity 10000
   ```

2. Copie `keystore.properties.example` para `keystore.properties` e preencha (o arquivo é
   ignorado pelo Git), **ou** exporte as variáveis `ODU_KEYSTORE_PATH`, `ODU_KEYSTORE_PASSWORD`,
   `ODU_KEY_ALIAS` e `ODU_KEY_PASSWORD` (útil em CI, a partir de secrets).

3. Gere os artefatos:

   ```bash
   ./gradlew assembleRelease   # app/build/outputs/apk/release/app-release.apk
   ```

   ```bash
   ./gradlew bundleRelease     # app/build/outputs/bundle/release/app-release.aab (Google Play)
   ```

Sem configuração de assinatura, o build de release é gerado sem assinatura (útil só para validar o R8).
Nenhuma senha, token ou chave é armazenada no código-fonte.

## Limitações conhecidas (honestas)

- **PDF**: o `PdfRenderer` do Android desenha páginas como imagem. Por isso a seleção de texto é
  feita sobre o texto extraído da página (folha “Texto da página”), e destaques de PDF ficam
  associados à página e ao trecho, com um marcador lateral — não há realce desenhado sobre a imagem.
  PDFs protegidos por senha não são abertos.
- **PDFs digitalizados**: sem camada de texto, busca/seleção/TTS ficam indisponíveis até que o
  OCR opcional seja executado na página; o OCR incluído reconhece o alfabeto latino.
- **TTS**: depende das vozes instaladas. O Android TTS não tem pausa nativa: “continuar” repete o
  trecho atual. O destaque palavra a palavra só aparece com mecanismos que reportam `onRangeStart`.
  A leitura continua enquanto o app está aberto (inclusive entre telas); não há serviço de mídia
  em segundo plano com o app fechado.
- **Tradução**: idiomas suportados pelo ML Kit; o primeiro uso de cada idioma baixa o modelo.
- **Dicionário online**: Wiktionary em inglês (definições de palavras de muitos idiomas, em inglês).
- **Escrita vertical/RTL**: aplicada pelo Readium conforme os metadados do EPUB.
- A chave de API da IA fica no DataStore privado do app (não é criptografada com Keystore).

## Fases

1. **MVP** — biblioteca, importação, leitores PDF/EPUB, preferências e progresso ✅
2. **Produtividade** — busca, marcadores, anotações, exportação, TTS ✅
3. **ODU Study Tools** — flashcards, chunking, dicionário, descoberta gramatical, revisão ✅
4. **IA opcional** — resumo, explicação, vocabulário, exercícios (desativada por padrão) ✅

Consulte [VALIDATION.md](VALIDATION.md) para o que foi efetivamente compilado e testado.
