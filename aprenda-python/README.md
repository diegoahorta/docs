# Aprenda Python: do zero ao avançado (offline, Android)

Um sistema completo para aprender Python e programação **sem internet**: trilha de módulos
do nível iniciante ao avançado, lições com código **executável e editável**, exercícios
**corrigidos automaticamente**, quizzes, editor livre (*Praticar*), plano de estudos,
referência rápida, glossário, busca e acompanhamento de progresso. O código roda num
**interpretador Python 3.14 real** (CPython compilado para WebAssembly pelo projeto
[Pyodide](https://pyodide.org)) embutido no APK.

## Instalar no celular

1. Baixe o `AprendaPython.apk`:
   - direto do repositório: [`aprenda-python/apk/AprendaPython.apk`](apk/AprendaPython.apk) (botão *Download raw file*), ou
   - na aba **Actions** do GitHub → execução mais recente de *Aprenda Python — APK* → artefato `AprendaPython-apk`, ou
   - na página **Releases** (quando houver uma tag `apk-v*`).
2. No Android, abra o arquivo e permita "instalar apps desconhecidos" para o navegador/gerenciador de arquivos.
3. Requisitos: Android 7.0+ com o **Android System WebView** (ou Chrome) atualizado pela Play Store.

O app não pede nenhuma permissão e bloqueia qualquer acesso à rede.

## A trilha

**14 módulos · 131 lições · 563 exemplos executáveis · 123 exercícios corrigidos automaticamente · 134 perguntas de quiz**
+ plano de estudos de 16 semanas, referência rápida (cheatsheet) e glossário com 93 termos.

| Nível | Módulo | Conteúdo |
|---|---|---|
| Iniciante | 🚀 Primeiros passos | o que é programar, por que Python, instalação e IDEs, `print`, comentários, tipos de erro, como estudar |
| Iniciante | 📦 Variáveis, tipos e operadores | variáveis, nomes, tipos, conversão, `input`, operadores, f-strings, `math` |
| Iniciante | 🔤 Strings | índices, fatiamento, métodos, `in`, percorrer, jogos de palavras |
| Básico | 🔀 Estruturas de decisão | comparação, lógica, `if/elif/else`, ternário, *truthiness*, `match/case` |
| Básico | 🔁 Estruturas de repetição | `while`, `for`, `range`, acumuladores, `break/continue`, algoritmos clássicos |
| Básico | 🗂️ Coleções | listas, tuplas, dicionários, conjuntos, aliasing, compreensões |
| Básico | 🧩 Funções | parâmetros, retorno, escopo, `*args/**kwargs`, recursão, `lambda`, `map/filter` |
| Intermediário | 🐞 Erros, exceções e depuração | `try/except/else/finally`, `raise`, exceções próprias, técnicas de depuração |
| Intermediário | 📁 Arquivos e módulos | arquivos, `pathlib`, JSON, CSV, biblioteca padrão, seus módulos, pip/venv |
| Intermediário | 🏛️ Orientação a objetos | classes, métodos especiais, herança, polimorfismo, `@property`, dataclasses |
| Avançado | ⚡ Python avançado | iteradores, geradores, closures, decoradores, gerenciadores de contexto, `itertools`, type hints, novidades 3.12–3.14 |
| Avançado | 🧠 Algoritmos e estruturas de dados | Big-O, busca, ordenação, pilhas/filas, hashing, programação dinâmica, grafos |
| Avançado | 🛠️ Prática profissional | PEP 8, testes, logging, ambientes virtuais, Git, carreiras e bibliotecas |
| Projetos | 🏆 Projetos práticos | adivinhação, calculadora, analisador de texto, forca, agenda JSON, tarefas POO, banco, jogo da velha |

Método sugerido (detalhado na página *Plano de estudos* do app): **ler → executar e modificar
os exemplos → resolver o exercício → fazer o quiz → revisar**, cerca de 1 hora por dia, em 16 semanas.

## Fontes

- PATSCH, Augusto. *Como programar em Python do zero* (e-book).
- DOWNEY, Allen B. *Pense em Python*, 2ª ed., trad. Sheila Gomes. Novatec, 2016 (CC BY-NC 3.0).
- Documentação oficial do Python 3 (tutorial, biblioteca padrão, *What's new in Python 3.14*), PEP 8 e PEP 20.

As lições são textos originais baseados nessas fontes; cada uma indica onde aprofundar.

## Estrutura do projeto

```text
aprenda-python/
├── web/                    o app (HTML/CSS/JS puro, sem frameworks)
│   ├── index.html
│   ├── css/app.css
│   ├── js/
│   │   ├── app.js          telas, roteamento, progresso, quiz
│   │   ├── editor.js       editor com realce de sintaxe e barra de teclas
│   │   ├── python.js       carrega o Pyodide e executa código
│   │   ├── harness.py      execução segura: tempo limite, erros em português, input()
│   │   └── parser.js       formato de conteúdo (Markdown) → lições
│   ├── conteudo/           módulos .md + indice.json + extras/ (plano, referência, glossário)
│   └── pyodide/            (baixado pelo build; não versionado)
├── android/                app nativo mínimo: WebView servindo os assets offline
├── tools/
│   ├── baixar-pyodide.sh   baixa o Pyodide do npm
│   ├── validar.js          executa TODOS os exemplos e exercícios no Python real
│   ├── build-apk.sh        compila o APK sem Gradle (aapt + javac + dx + apksigner)
│   └── gerar-icones.cjs    gera os ícones PNG a partir do SVG
└── README.md
```

## Desenvolvimento

```bash
cd aprenda-python
bash tools/baixar-pyodide.sh           # 1x: baixa o Python WebAssembly (~13 MB)
python3 -m http.server -d web 8000     # abra http://localhost:8000 no navegador
node tools/validar.js                  # valida o conteúdo (executa todo o código)
```

### Adicionar ou corrigir lições

Edite os arquivos `.md` em `web/conteudo/` seguindo [`web/conteudo/FORMATO.md`](web/conteudo/FORMATO.md)
e rode `node tools/validar.js`. Ele garante que todo exemplo executa, que cada solução passa no
seu teste e que o código inicial do exercício **não** passa.

### Compilar o APK localmente (Linux Debian/Ubuntu)

```bash
sudo apt-get install -y aapt dalvik-exchange zipalign apksigner android-sdk-platform-23 default-jdk nodejs npm
bash tools/build-apk.sh                # gera build/AprendaPython.apk
```

### Compilar pelo GitHub

O workflow `.github/workflows/aprenda-python-apk.yml` compila o APK a cada push que altere
`aprenda-python/` e o disponibiliza como artefato. Para publicar uma Release:

```bash
git tag apk-v1.0.0 && git push origin apk-v1.0.0
```

**Assinatura:** sem configuração, cada build usa uma chave nova (para atualizar o app será
preciso desinstalar a versão anterior). Para atualizações sem desinstalar, crie uma chave
uma vez e cadastre-a nos *secrets* do repositório:

```bash
keytool -genkeypair -keystore release.keystore -alias aprenda-python -keyalg RSA -validity 10000
base64 -w0 release.keystore   # cole em APK_KEYSTORE_BASE64
```

Secrets: `APK_KEYSTORE_BASE64`, `APK_KEYSTORE_SENHA`, `APK_KEY_ALIAS`.

## Licença

Código do app: MIT. Pyodide: MPL-2.0. Conteúdo: uso educacional, com atribuição às fontes acima
(o livro *Pense em Python* é CC BY-NC 3.0, portanto não use comercialmente).
