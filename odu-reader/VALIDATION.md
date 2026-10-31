# Validação — o que foi realmente executado

Ambiente de desenvolvimento: contêiner sem Android SDK e sem acesso ao Google Maven, portanto
**nenhuma compilação local foi possível**. Toda a compilação e os testes rodaram no GitHub Actions
(`.github/workflows/odu-reader-android.yml`, runner `ubuntu-latest`, JDK 17).

## Execução de referência

Run nº 5 — https://github.com/diegoahorta/docs/actions/runs/41202875279 (commit `7bd4475`)

| Etapa | Resultado |
|---|---|
| `./gradlew assembleDebug` | ✅ sucesso — `app-debug.apk` publicado como artefato `app-debug-apk` |
| `./gradlew testDebugUnitTest` | ✅ sucesso (7 classes de teste: chunking, detecção de idioma, detecção de formato/arquivos corrompidos, repetição espaçada, tempo efetivo de leitura, exportação MD/TXT/DOCX, segmentação/painel/Wiktionary) |
| `./gradlew assembleRelease bundleRelease` (R8, sem assinatura) | ✅ sucesso — APK e AAB publicados no artefato `release-unsigned` |
| `./gradlew connectedDebugAndroidTest` (emulador API 30, x86_64) | ✅ **6 de 6 testes** aprovados |

Testes instrumentados executados:

- `ImportAndReadTest.importsRendersAndResumesPdf` — gera um PDF real de 3 páginas, importa pelo mesmo
  caminho da UI, renderiza uma página com `PdfRenderer`, extrai texto com PdfBox, salva/recupera a
  posição, marca concluído, detecta duplicado, remove da biblioteca e confirma que o arquivo original
  continua existindo.
- `ImportAndReadTest.importsAndOpensEpub` — gera um EPUB 3 real, importa, confere título/autor, abre
  com o Readium, verifica ordem de leitura, sumário e conteúdo (incluindo texto japonês).
- `ImportAndReadTest.rejectsCorruptedFile` — arquivo corrompido é recusado com mensagem de erro.
- `DatabaseTest` (2 testes) — marcadores, anotações, busca, exclusão em cascata, coleções, renomear.
- `MainActivityUiTest.navigatesBetweenMainScreens` — abre o app e navega por Biblioteca, Estudo,
  Painel e Anotações (Compose UI test).

## Problemas encontrados e corrigidos pela CI

1. Readium 3 exige *core library desugaring* → habilitado.
2. Nome incorreto de exceção do SDK da Anthropic (`AuthenticationException` → `UnauthorizedException`).
3. R8: classes de reflexão ausentes referenciadas por dependência transitiva do SDK → regras `-dontwarn`.

## Ainda NÃO verificado (requer aparelho/pessoa)

- Uso manual em aparelho físico (gestos de zoom, seleção de texto no EPUB, rotação, tablets).
- TTS com áudio real e vozes específicas (o emulador da CI não foi usado para isso).
- OCR, tradução ML Kit (download de modelos) e chamadas reais à API de IA (exigem rede/chave).
- Desempenho com PDFs muito grandes (centenas de MB) em aparelhos intermediários.
- APK de release **assinado** (precisa da sua keystore; veja o README).
