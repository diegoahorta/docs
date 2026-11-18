# Bullet Journal Offline (Android)

App Android que reproduz o sistema **Bullet Journal** e funciona 100% offline. Não pede permissão de internet nem cria conta, e os dados ficam só no aparelho. Tudo o que é salvo pode ser exportado.

**APK pronto:** [`BulletJournal.apk`](BulletJournal.apk) (≈90 KB · Android 7.0+ · `com.bujo.offline`)

---

## 1. Análise do material de referência

Arquivos analisados:

| Arquivo | Conteúdo |
|---|---|
| `Guide-Bullet-Journal.pdf` (43 p., em francês) | Guia do método em 10 capítulos: chave, índice, future log, monthly log, daily log, coleções, trackers, migração, material e conclusão |
| `Bullet-journal.docx` / `My-Journal-2.docx` | Modelos de caderno: Índice (Página # / Descrição), Future log (12 meses), Monthly logs em grade semanal (Semana 1–6 × Dom–Sáb), Daily log (A.M./P.M.), Coleções (Filmes, Quadrinhos, Livros, Séries) e a Chave |

### A lógica do sistema

O Bullet Journal junta agenda, lista de tarefas e diário num único caderno. Ele se apoia em três ideias:

1. **Registro rápido (rapid logging):** frases curtas precedidas de um símbolo (*puce*) que diz o que é cada linha.
2. **Módulos:** páginas com funções fixas, criadas nesta ordem:
   - **Chave** (p. 1): as puces, os *signifiers* e um código de cores opcional (para projetos, filhos, áreas da vida).
   - **Índice** (p. 2): lista de páginas com seus números, atualizada a cada página nova e com o código de cores.
   - **Future log**: visão de longo prazo em 12 casas, uma por mês, começando no mês seguinte. Recebe compromissos, aniversários, férias e prazos que caem depois do mês atual. Pode começar em qualquer época do ano.
   - **Monthly log**: criado no fim de cada mês para o seguinte. Tem duas partes obrigatórias: o **calendário** (dias com eventos) e a **lista de tarefas**.
   - **Daily log**: o dia escrito no topo e as anotações feitas ao longo dele. Pode ser preparado na véspera ou de manhã. O guia desaconselha o *weekly log* por ser limitante.
   - **Coleções**: páginas temáticas (livros, receitas, *braindump*), criadas conforme a necessidade e sempre lançadas no índice. Uma "gommette" da mesma cor marca as coleções de um mesmo tema.
   - **Trackers**: páginas de acompanhamento (hábitos, progresso, peso).
3. **Migração:** nenhuma tarefa se perde.
   - `>` vai **para frente** no caderno: amanhã, outro dia ou uma coleção.
   - `<` volta **para trás**: o monthly log, ou o future log se não couber no mês.

### Chave adotada no app

| Símbolo | Significado | | Signifier | Significado |
|:-:|---|---|:-:|---|
| `•` | Tarefa | | `*` | Prioridade |
| `×` | Tarefa concluída | | `!` | Inspiração / ideia |
| `>` | Migrada para frente (dia / coleção) | | `?` | Pesquisar / explorar |
| `<` | Agendada para trás (monthly / future log) | | | |
| ~~•~~ | Cancelada / irrelevante | | | |
| `○` | Evento | | | |
| `–` | Nota | | | |

---

## 2. Como o app replica o sistema

| Módulo do caderno | No app |
|---|---|
| Chave + código de cores | *Mais → Chave e código de cores*: legenda das puces e dos signifiers, e cores que você pode criar, renomear e apagar |
| Índice | *Mais → Índice*: montado automaticamente com as páginas numeradas (1 Chave, 2 Índice, 3 Future log e depois as demais na ordem de criação). Inclui busca que ignora acentos |
| Future log | Aba **Futuro**: 12 meses navegáveis, com dia opcional em cada entrada |
| Monthly log | Aba **Mês**: calendário (toque num dia para anotar), lista de tarefas e o botão "Trazer para o mês", que puxa os itens do future log |
| Daily log | Aba **Hoje**: abre sempre no dia atual, navega entre dias e mostra os eventos do calendário daquele dia |
| Coleções | Aba **Coleções**: sugestões prontas (Livros, Filmes, Séries, Quadrinhos, Braindump…) com cor de "gommette" |
| Trackers | *Mais → Trackers*: grade de hábitos por mês com percentual, ou valores numéricos com gráfico. Pode ser copiado para o mês seguinte |
| Migração | Toque numa tarefa para escolher: amanhã / data (`>`), monthly log / future log (`<`), coleção (`>`) ou cancelar. Em *Mais → Migração* ficam todas as tarefas abertas de páginas passadas, que podem ir de uma vez para hoje |

**Registro rápido:** o campo de baixo aceita prefixos. `o ` cria evento, `- ` nota, `. ` tarefa, `* ` prioridade, `! ` inspiração e `? ` explorar. Tocar na puce conclui a tarefa (• → ×).

### Exportação

*Mais → Exportar e backup*. O escopo pode ser **tudo**, **o mês atual** ou **um período**.

| Formato | Uso |
|---|---|
| **JSON** | Backup completo, restaurável. Pode **mesclar** com os dados atuais ou **substituir** tudo |
| **Markdown (.md)** / **Texto (.txt)** | Caderno legível, com chave, índice, logs, coleções e trackers |
| **CSV** | Planilha (Excel / Google Sheets) com uma linha por entrada |
| **PDF / Imprimir** | Usa o serviço de impressão do Android, que oferece "Salvar como PDF" (A5) |
| **Compartilhar** | Envia como texto para e-mail, WhatsApp, Drive etc. |

Os arquivos são salvos onde você escolher (Downloads, Drive, cartão SD), pelo seletor do sistema. Para isso não é preciso dar nenhuma permissão de armazenamento.

---

## 3. Instalação

1. Copie o `BulletJournal.apk` para o celular.
2. Abra o arquivo e permita "instalar apps de fonte desconhecida" quando o Android pedir.
3. Se o Play Protect avisar, toque em "Instalar mesmo assim". O app é assinado com uma chave própria e não vem da Play Store.

Os dados ficam em `files/journal.json`, no armazenamento interno do app, com escrita atômica e uma cópia `.bak`. **Desinstalar o app apaga os dados.** Faça backups JSON de tempos em tempos.

---

## 4. Arquitetura e build

```
bullet-journal-app/
├── android/
│   ├── AndroidManifest.xml          # sem permissão de INTERNET
│   ├── res/                         # tema e ícones (gerados por tools/make_icons.py)
│   ├── src/com/bujo/offline/MainActivity.java   # WebView + ponte "Native"
│   └── assets/www/
│       ├── index.html, style.css    # interface (tema claro/escuro, papel pontilhado)
│       ├── core.js                  # lógica: modelo, índice, migração, exportações
│       └── app.js                   # telas e interação
├── tools/
│   ├── make_icons.py                # ícone do app
│   ├── test_logic.js                # testes da lógica (node)
│   └── bujo-release.keystore        # chave de assinatura (senha: bujo-offline)
└── build.sh                         # build sem Gradle
```

- **Interface:** HTML/CSS/JS sem nenhuma biblioteca externa, rodando num `WebView` com rede bloqueada (`setBlockNetworkLoads`).
- **Ponte nativa (`window.Native`):**
  - `load` / `save` para persistir em arquivo
  - `exportFile` e `importFile` (Storage Access Framework)
  - `share`
  - `printHtml` (PDF)
  - `setBars` (cor das barras do sistema)
- **Fora do Android:** o mesmo `index.html` abre num navegador comum e usa `localStorage` e downloads, o que serve para testar.

### Compilar

```bash
sudo apt install aapt dalvik-exchange zipalign apksigner openjdk-17-jdk python3-pil nodejs
./build.sh            # roda os testes, compila e assina -> BulletJournal.apk
```

O script usa `aapt`, `javac --release 8`, `dx`, `zipalign` e `apksigner`. Na primeira execução ele baixa um `android.jar` (API 33).

> A keystore está no repositório para que versões futuras possam **atualizar** o app instalado sem perder os dados. Se for distribuir publicamente, gere uma chave própria (`KEYSTORE=... KS_PASS=... ./build.sh`).
