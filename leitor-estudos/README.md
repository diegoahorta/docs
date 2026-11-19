# Leitor & Estudos (Android, off-line)

Aplicativo Android para **ler, armazenar, organizar e estudar** documentos **PDF** e **DOCX**, funcionando 100% off-line (o APK não pede nem a permissão de internet).

📦 **APK pronto:** [`dist/LeitorEstudos.apk`](dist/LeitorEstudos.apk) — Android 8.0 ou superior.

## Funcionalidades

| Área | O que faz |
|---|---|
| **Biblioteca (armazenamento)** | Importa vários PDF/DOCX de uma vez (ou via "Abrir com…" / "Compartilhar" de outros apps). Guarda os arquivos no aparelho, com miniatura, progresso de leitura, favoritos, ordenação e renomear/excluir. |
| **Agregador** | Coleções (pastas) para agrupar documentos; **busca global** no nome e no **conteúdo de todos os documentos**; aba **Trechos** que reúne citações de todos os arquivos; **Estudos** que juntam trechos de vários documentos. |
| **Leitor PDF** | Renderização com pdf.js, texto selecionável, zoom (botões e pinça), barra de páginas, ir para página, busca no documento, temas claro/sépia/escuro, tela cheia, manter tela ligada. |
| **Leitor DOCX** | Conversão para HTML (mammoth.js) com títulos, tabelas e imagens; ajuste de fonte, temas e busca. |
| **Marcadores** | 🔖 marca a página/posição atual; lista com renomear, excluir e salto direto. |
| **Destaques e notas no texto** | Selecione um texto → 5 cores de destaque ou **Nota** (o destaque recebe 📝). Toque no destaque para editar a nota, trocar a cor, copiar, compartilhar ou excluir. |
| **Anotações** | Painel ☰ com destaques (filtros por cor / com nota), marcadores e um **caderno** livre por documento. Exporta tudo em Markdown (copiar, compartilhar ou salvar .md). |
| **Copiar trechos** | **Copiar** envia para a área de transferência; **Trecho** salva na aba Trechos (com busca, filtro por documento, "copiar com citação", exportar). |
| **Mapas mentais** | Editor visual (arrastar, pinça para zoom, adicionar filho/irmão, editar, cores, recolher, reordenar). Geração automática a partir de um documento: sumário do PDF ou títulos do DOCX + marcadores + destaques agrupados por cor. Nós ligados ao trecho de origem. Exporta PNG ou Markdown. |
| **Estudos** | Cadernos com títulos, notas e trechos de vários documentos; **flashcards** (manuais, a partir de trechos/notas ou por lacuna automática) e **revisão com repetição espaçada** (caixas de Leitner). Gera estudo a partir das anotações de um documento. Exporta Markdown. |
| **Backup** | Backup completo num único arquivo `.leitorbak` (documentos + todos os dados) e restauração (mesclar ou substituir). |

## Arquitetura

```
leitor-estudos/
├── build-apk.sh                  # gera dist/LeitorEstudos.apk
├── dist/LeitorEstudos.apk
└── android/                      # projeto Gradle (sem dependências AndroidX)
    └── app/src/main/
        ├── AndroidManifest.xml   # sem permissões; intents VIEW/SEND para PDF e DOCX
        ├── java/br/leitor/estudos/MainActivity.java
        │     WebView que serve os assets em https://app.local/ (bloqueia qualquer
        │     outro host), seletor de arquivos, área de transferência, "Salvar como",
        │     compartilhar, botão voltar e arquivos recebidos de outros apps.
        └── assets/www/           # aplicação (HTML/CSS/JS puro, ES modules)
            ├── js/db.js          # IndexedDB (documentos, arquivos, textos, anotações…)
            ├── js/docs.js        # importação, conversão DOCX, indexação de texto
            ├── js/library.js     # biblioteca, coleções, busca global
            ├── js/reader.js      # leitor PDF/DOCX, seleção, destaques, notas, marcadores
            ├── js/excerpts.js    # trechos
            ├── js/mindmap.js     # mapas mentais
            ├── js/study.js       # estudos e flashcards
            ├── js/more.js        # tema, armazenamento, backup
            └── lib/              # pdf.js 3.11 (legacy) e mammoth.js 1.8, embutidos
```

Todos os dados ficam no armazenamento interno do app (IndexedDB do WebView). Desinstalar o app apaga os dados — use **Mais → Fazer backup completo** antes.

## Como gerar o APK

Requisitos: JDK 17+ e Android SDK com `platforms;android-34` e `build-tools;34.0.0`.

```bash
export ANDROID_HOME=/caminho/para/android-sdk
./build-apk.sh
```

Na primeira execução o script cria a chave de assinatura `android/keystore/leitor.jks` (senha padrão `leitor123`, ou a definida em `LEITOR_KS_PASS`). A chave **não** vai para o git: guarde-a para publicar atualizações, pois o Android só instala uma atualização assinada com a mesma chave. Um APK gerado com uma chave nova exige desinstalar a versão anterior (faça backup antes).

## Testar a interface no navegador

```bash
cd android/app/src/main/assets/www && python3 -m http.server 8765
# abra http://localhost:8765 (modo celular do DevTools)
```

## Instalação no celular

1. Copie `LeitorEstudos.apk` para o aparelho.
2. Abra o arquivo e permita "instalar apps desconhecidos" para o gerenciador de arquivos/navegador.
3. Abra **Leitor & Estudos** e toque em **＋** para adicionar documentos.

Licenças de terceiros: pdf.js (Apache-2.0) e mammoth.js (BSD-2-Clause); os textos estão em `assets/www/lib/`.
