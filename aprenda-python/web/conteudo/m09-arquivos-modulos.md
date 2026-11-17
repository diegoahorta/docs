# Arquivos e módulos
id: m09
nivel: Intermediário
icone: 📁
descricao: Guarde dados em arquivos de texto, JSON e CSV, navegue por pastas, use a biblioteca padrão (math, random, datetime, collections...) e crie seus próprios módulos.

## Abrindo, escrevendo e lendo arquivos
fonte: Pense em Python cap. 14.1–14.2; Documentação oficial do Python (Tutorial, cap. 7.2)

Até agora, tudo o que seus programas calculavam sumia quando eles terminavam. Programas que guardam dados entre uma execução e outra são chamados de **persistentes**, e a forma mais simples de persistência é gravar em **arquivos**.

A função `open(nome, modo)` abre um arquivo e devolve um **objeto arquivo**, com métodos para ler e escrever:

```python
arquivo = open("diario.txt", "w", encoding="utf-8")   # w = escrita
arquivo.write("Hoje aprendi a gravar arquivos.\n")
arquivo.write("Amanhã: JSON e CSV!\n")
arquivo.close()                                       # grava e libera o arquivo

arquivo = open("diario.txt", "r", encoding="utf-8")   # r = leitura
conteudo = arquivo.read()
arquivo.close()
print(conteudo)
```

> 💡 Neste app os arquivos ficam num sistema de arquivos **virtual**, na memória. No computador, eles seriam criados de verdade na pasta onde o programa está rodando.

### Os modos de abertura

| Modo | Significado | Se o arquivo não existe | Se o arquivo existe |
|---|---|---|---|
| `"r"` | leitura (padrão) | `FileNotFoundError` | lê desde o início |
| `"w"` | escrita | cria | **apaga** o conteúdo e começa do zero |
| `"a"` | acréscimo (*append*) | cria | escreve **no final** |
| `"x"` | criação exclusiva | cria | `FileExistsError` |
| `"r+"` | leitura e escrita | `FileNotFoundError` | lê e escreve |
| `"b"` | combinado: `"rb"`, `"wb"` | — | modo binário (bytes: imagens, áudio...) |

> ⚠️ O modo `"w"` **apaga** o arquivo existente sem perguntar. Se quiser acrescentar, use `"a"`.

### Use sempre `with`

Esquecer o `close()` pode deixar dados sem gravar. A instrução `with` fecha o arquivo **automaticamente** ao final do bloco, mesmo se acontecer uma exceção. É a forma recomendada:

```python
with open("compras.txt", "w", encoding="utf-8") as f:
    f.write("arroz\n")
    f.write("feijão\n")

with open("compras.txt", "a", encoding="utf-8") as f:   # acrescenta
    f.write("café\n")

with open("compras.txt", encoding="utf-8") as f:        # "r" é o padrão
    print(f.read())
print("Fechado?", f.closed)
```

### write só aceita texto

Diferente do `print`, o método `write` não converte nada e não pula linha sozinho: você precisa passar uma **string** e incluir o `\n`. Ele devolve o número de caracteres gravados.

```python
with open("numeros.txt", "w", encoding="utf-8") as f:
    for n in range(1, 4):
        f.write(f"{n} ao quadrado = {n**2}\n")   # f-string converte e formata
    print("linha extra", file=f)                 # print também escreve em arquivo!

with open("numeros.txt", encoding="utf-8") as f:
    print(f.read())
```

### Por que `encoding="utf-8"`?

O arquivo guarda **bytes**; a codificação (*encoding*) diz como transformar texto em bytes e vice-versa. Se você não especificar, o Python usa o padrão do sistema, que no Windows pode não ser UTF-8, e acentos viram `Ã§` ou geram `UnicodeDecodeError`. Especificar `encoding="utf-8"` deixa seu programa igual em qualquer sistema.

```python
with open("acentos.txt", "w", encoding="utf-8") as f:
    f.write("ação, coração, pão")
with open("acentos.txt", "rb") as f:     # modo binário: vemos os bytes crus
    print(f.read())
```

### Tratando arquivos que não existem

```python
try:
    with open("arquivo_que_nao_existe.txt", encoding="utf-8") as f:
        print(f.read())
except FileNotFoundError as e:
    print("Não encontrei:", e.filename)
```

### Exercício
Escreva `salvar_lista(nome_arquivo, itens)` que grava cada item da lista `itens` numa linha do arquivo (substituindo o conteúdo anterior) e devolve a quantidade de itens gravados. Use `with` e `encoding="utf-8"`.

Ex.: `salvar_lista("tarefas.txt", ["estudar", "treinar"])` cria um arquivo com duas linhas e devolve `2`.

```python inicial
def salvar_lista(nome_arquivo, itens):
    pass
```

```python solucao
def salvar_lista(nome_arquivo, itens):
    with open(nome_arquivo, "w", encoding="utf-8") as f:
        for item in itens:
            f.write(f"{item}\n")
    return len(itens)
```

```python teste
import os
_nome = "_teste_salvar_lista.txt"
if os.path.exists(_nome):
    os.remove(_nome)
r = salvar_lista(_nome, ["estudar", "treinar", "ler ação"])
assert os.path.exists(_nome), "O arquivo não foi criado"
with open(_nome, encoding="utf-8") as _f:
    _conteudo = _f.read()
assert _conteudo == "estudar\ntreinar\nler ação\n", f"Conteúdo inesperado: {_conteudo!r}"
assert r == 3, f"Deveria devolver 3 (itens gravados), devolveu {r!r}"
salvar_lista(_nome, ["só um"])
with open(_nome, encoding="utf-8") as _f:
    assert _f.read() == "só um\n", "Uma nova chamada deve SUBSTITUIR o conteúdo (modo 'w')"
```

## Lendo linha a linha e processando texto
fonte: Pense em Python cap. 9.1 e 14.2; Documentação oficial do Python (Tutorial, cap. 7.2.1)

Há várias formas de ler um arquivo de texto:

| Forma | Devolve | Bom para |
|---|---|---|
| `f.read()` | uma única string com tudo | arquivos pequenos |
| `f.readline()` | a próxima linha (string) | ler uma linha por vez, manualmente |
| `f.readlines()` | lista com todas as linhas | precisa de índices ou tamanho |
| `for linha in f:` | uma linha por volta do laço | **o jeito preferido**: usa pouca memória |

```python
with open("poema.txt", "w", encoding="utf-8") as f:
    f.write("Batatinha quando nasce\nespalha rama pelo chão\nmenininha quando dorme\n")

with open("poema.txt", encoding="utf-8") as f:
    print(repr(f.readline()))      # primeira linha, com o \n
    print(f.readlines())           # o restante, numa lista

with open("poema.txt", encoding="utf-8") as f:
    for numero, linha in enumerate(f, start=1):
        print(numero, linha.strip())
```

> 💡 Cada linha lida termina com `"\n"` (exceto, às vezes, a última). Use `linha.strip()` para remover espaços e quebras das pontas, ou `linha.rstrip("\n")` para tirar só a quebra.

Repare: depois de ler tudo, o arquivo fica "no fim". Um segundo `read()` no mesmo arquivo aberto devolve `""`. Para reler, abra de novo (ou use `f.seek(0)`).

```python
with open("poema.txt", encoding="utf-8") as f:
    print(len(f.read()))
    print(repr(f.read()))   # '' : já estamos no fim
    f.seek(0)               # volta ao início
    print(f.read(9))        # lê só 9 caracteres
```

### Processando dados de texto

Um padrão clássico: cada linha é um registro, com campos separados por um caractere. Leia, limpe com `strip`, ignore linhas vazias ou de comentário, separe com `split` e converta os tipos:

```python
with open("gastos.txt", "w", encoding="utf-8") as f:
    f.write("# categoria;valor\n")
    f.write("mercado;250.40\n")
    f.write("\n")
    f.write("transporte; 80.00\n")
    f.write("mercado;99.60\n")

por_categoria = {}
with open("gastos.txt", encoding="utf-8") as f:
    for linha in f:
        linha = linha.strip()
        if not linha or linha.startswith("#"):
            continue                       # pula vazias e comentários
        categoria, valor = linha.split(";")
        valor = float(valor)               # float tolera os espaços
        por_categoria[categoria] = por_categoria.get(categoria, 0) + valor

for cat, total in por_categoria.items():
    print(f"{cat:<12} R$ {total:8.2f}")
```

### Lendo e escrevendo ao mesmo tempo

Você pode abrir dois arquivos no mesmo `with`, por exemplo para transformar um arquivo em outro:

```python
with open("nomes.txt", "w", encoding="utf-8") as f:
    f.write("ana silva\nBRUNO costa\n  carla souza  \n")

with open("nomes.txt", encoding="utf-8") as entrada, \
     open("nomes_formatados.txt", "w", encoding="utf-8") as saida_arq:
    for linha in entrada:
        saida_arq.write(linha.strip().title() + "\n")

with open("nomes_formatados.txt", encoding="utf-8") as f:
    print(f.read())
```

### Exercício
Um arquivo tem uma compra por linha no formato `produto;quantidade;preço_unitário`. Linhas vazias e linhas que começam com `#` devem ser ignoradas. Escreva `total_compras(nome_arquivo)` que devolve o valor total (soma de quantidade × preço), arredondado com `round(total, 2)`.

```text
# produto;qtd;preco
café;2;15.50
pão;10;0.75

leite; 3 ;4.20
```

Para o arquivo acima o total é `2*15.50 + 10*0.75 + 3*4.20 = 51.1`.

```python inicial
def total_compras(nome_arquivo):
    total = 0
    with open(nome_arquivo, encoding="utf-8") as f:
        for linha in f:
            produto, qtd, preco = linha.split(";")
            total += qtd * preco
    return total
```

```python solucao
def total_compras(nome_arquivo):
    total = 0
    with open(nome_arquivo, encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if not linha or linha.startswith("#"):
                continue
            produto, qtd, preco = linha.split(";")
            total += int(qtd) * float(preco)
    return round(total, 2)
```

```python teste
_nome = "_teste_compras.txt"
with open(_nome, "w", encoding="utf-8") as _f:
    _f.write("# produto;qtd;preco\ncafé;2;15.50\npão;10;0.75\n\nleite; 3 ;4.20\n")
r = total_compras(_nome)
assert r == 51.1, f"O total deveria ser 51.1, veio {r!r}"
with open(_nome, "w", encoding="utf-8") as _f:
    _f.write("arroz;1;20\n")
assert total_compras(_nome) == 20, "Com uma linha 'arroz;1;20' o total deveria ser 20"
with open(_nome, "w", encoding="utf-8") as _f:
    _f.write("# vazio\n\n")
assert total_compras(_nome) == 0, "Um arquivo só com comentário e linha vazia deveria dar 0"
```

## Pastas e caminhos: os e pathlib
fonte: Pense em Python cap. 14.4; Documentação oficial do Python (os, os.path, pathlib)

Arquivos vivem em **diretórios** (pastas). Todo programa tem um **diretório de trabalho atual**: um nome de arquivo sem pasta, como `"notas.txt"`, é procurado ali. Um **caminho** pode ser:

- **relativo**: a partir do diretório atual, ex.: `dados/notas.txt`;
- **absoluto**: a partir da raiz do sistema, ex.: `/home/ana/dados/notas.txt` ou `C:\Users\Ana\dados\notas.txt`.

### O módulo os

O módulo `os` ("sistema operacional") traz funções para trabalhar com o sistema de arquivos:

```python
import os

print("Diretório atual:", os.getcwd())
os.makedirs("projeto/dados", exist_ok=True)       # cria pastas (e as intermediárias)
caminho = os.path.join("projeto", "dados", "a.txt")  # junta com o separador certo
print(caminho)

with open(caminho, "w", encoding="utf-8") as f:
    f.write("olá")

print(os.path.exists(caminho), os.path.isfile(caminho), os.path.isdir("projeto"))
print(os.listdir("projeto/dados"))
print(os.path.basename(caminho), os.path.dirname(caminho))
print(os.path.splitext("foto.final.png"))   # separa a extensão
print(os.path.abspath(caminho))
```

> 💡 Use `os.path.join` em vez de juntar com `"/"` na mão: o Windows usa `\` como separador, e o `join` escolhe o certo para cada sistema.

### pathlib: caminhos como objetos

O módulo `pathlib` (moderno e recomendado) representa caminhos com objetos `Path`. O operador `/` junta partes do caminho, e os métodos são bem legíveis:

```python
from pathlib import Path

pasta = Path("biblioteca")
pasta.mkdir(exist_ok=True)

livro = pasta / "dom_casmurro.txt"          # junta caminhos com /
livro.write_text("Capitu tinha olhos de ressaca.", encoding="utf-8")
print(livro.read_text(encoding="utf-8"))

print(livro.name, "|", livro.stem, "|", livro.suffix, "|", livro.parent)
print(livro.exists(), livro.is_file(), pasta.is_dir())
print(livro.stat().st_size, "bytes")
```

`write_text` e `read_text` abrem, escrevem/leem e fecham o arquivo numa só chamada: ótimos para arquivos pequenos.

### Listando o conteúdo de uma pasta

```python
from pathlib import Path

base = Path("fotos")
(base / "2024").mkdir(parents=True, exist_ok=True)
for nome in ["praia.jpg", "festa.png", "notas.txt"]:
    (base / nome).write_text("...", encoding="utf-8")
(base / "2024" / "natal.jpg").write_text("...", encoding="utf-8")

print(sorted(p.name for p in base.iterdir()))        # itens diretos
print(sorted(p.name for p in base.glob("*.jpg")))    # só .jpg da pasta
print(sorted(str(p) for p in base.rglob("*.jpg")))   # .jpg em subpastas também
```

| Tarefa | os / os.path | pathlib |
|---|---|---|
| Juntar caminhos | `os.path.join(a, b)` | `Path(a) / b` |
| Existe? | `os.path.exists(c)` | `p.exists()` |
| Criar pasta | `os.makedirs(c, exist_ok=True)` | `p.mkdir(parents=True, exist_ok=True)` |
| Listar | `os.listdir(c)` | `p.iterdir()` / `p.glob("*.txt")` |
| Nome / extensão | `os.path.basename`, `os.path.splitext` | `p.name`, `p.stem`, `p.suffix` |
| Apagar arquivo | `os.remove(c)` | `p.unlink()` |
| Renomear | `os.rename(a, b)` | `p.rename(b)` |

> ⚠️ Apagar arquivos (`os.remove`, `Path.unlink`) e pastas (`shutil.rmtree`) não manda nada para a lixeira: é definitivo. Teste com cuidado.

### Exercício
Escreva `listar_por_extensao(pasta, extensao)` que devolve uma **lista ordenada** com os **nomes** (só o nome, sem a pasta) dos arquivos diretamente dentro de `pasta` que terminam com `extensao` (ex.: `".txt"`). Ignore subpastas.

```python inicial
from pathlib import Path

def listar_por_extensao(pasta, extensao):
    return list(Path(pasta).iterdir())
```

```python solucao
from pathlib import Path

def listar_por_extensao(pasta, extensao):
    return sorted(p.name for p in Path(pasta).iterdir()
                  if p.is_file() and p.suffix == extensao)
```

```python teste
import shutil
from pathlib import Path as _P
_base = _P("_teste_ext")
if _base.exists():
    shutil.rmtree(_base)
(_base / "sub.txt").mkdir(parents=True)
for _n in ["b.txt", "a.txt", "c.csv", "notas.txt.bak"]:
    (_base / _n).write_text("x", encoding="utf-8")
r = listar_por_extensao(str(_base), ".txt")
assert r == ["a.txt", "b.txt"], f"Esperava ['a.txt', 'b.txt'], veio {r}"
assert listar_por_extensao(str(_base), ".csv") == ["c.csv"], "Para '.csv' esperava ['c.csv']"
assert listar_por_extensao(str(_base), ".py") == [], "Sem arquivos .py deveria devolver []"
```

## JSON: salvando e carregando dados estruturados
fonte: Documentação oficial do Python (json); Pense em Python cap. 14.7 (persistência)

Gravar texto puro é fácil, mas e se você quiser salvar um dicionário com listas dentro? Converter tudo para texto e depois de volta, à mão, dá trabalho. O **JSON** (*JavaScript Object Notation*) é um formato de texto padrão para dados estruturados, usado em praticamente toda API da internet e em arquivos de configuração.

| Python | JSON |
|---|---|
| `dict` | objeto `{...}` |
| `list`, `tuple` | array `[...]` |
| `str` | string (sempre com aspas **duplas**) |
| `int`, `float` | número |
| `True` / `False` | `true` / `false` |
| `None` | `null` |

### dumps e loads: objeto ↔ string

```python
import json

aluno = {"nome": "Joana", "idade": 17, "notas": [8.5, 9.0], "bolsista": True, "apelido": None}
texto = json.dumps(aluno)
print(texto)
print(type(texto))

de_volta = json.loads(texto)
print(de_volta["notas"][1], type(de_volta))
```

Para JSON legível por humanos e com acentos preservados, use `indent` e `ensure_ascii=False`:

```python
import json

produto = {"nome": "Pão de queijo", "preço": 3.5, "tags": ["mineiro", "lanche"]}
print(json.dumps(produto))                                  # acentos viram \u00e3
print(json.dumps(produto, indent=2, ensure_ascii=False, sort_keys=True))
```

### dump e load: objeto ↔ arquivo

Sem o "s" no final, as funções trabalham direto com arquivos:

```python
import json

agenda = [
    {"nome": "Ana", "tel": "1111-2222"},
    {"nome": "Rui", "tel": "3333-4444"},
]
with open("agenda.json", "w", encoding="utf-8") as f:
    json.dump(agenda, f, indent=2, ensure_ascii=False)

with open("agenda.json", encoding="utf-8") as f:
    carregada = json.load(f)

carregada.append({"nome": "Lu", "tel": "5555-6666"})
for contato in carregada:
    print(f"{contato['nome']}: {contato['tel']}")
```

> 💡 Memorize: **s** = *string*. `dumps`/`loads` trabalham com strings; `dump`/`load` com arquivos.

### Armadilhas do JSON

```python
import json

dados = {1: "um", "tupla": (1, 2)}
volta = json.loads(json.dumps(dados))
print(volta)   # a chave 1 virou "1" e a tupla virou lista!

try:
    json.dumps({"conjunto": {1, 2}})
except TypeError as e:
    print("Erro:", e)       # set não existe em JSON

try:
    json.loads("{'nome': 'Ana'}")   # aspas simples não são JSON válido
except json.JSONDecodeError as e:
    print("JSON inválido:", e)
```

- chaves de objetos JSON são **sempre strings**;
- tuplas viram listas; `set`, `datetime` e objetos próprios não são serializáveis diretamente (converta antes: `list(conjunto)`, `data.isoformat()`);
- JSON exige aspas **duplas**.

### Exercício
Escreva `registrar_visita(nome_arquivo, pagina)` que mantém um arquivo JSON com a contagem de visitas por página (um dicionário). A função:

1. carrega o dicionário do arquivo; se o arquivo **não existir**, começa com `{}` (trate `FileNotFoundError`);
2. soma 1 à contagem de `pagina`;
3. salva o dicionário de volta no arquivo e devolve a nova contagem daquela página.

```python inicial
import json

def registrar_visita(nome_arquivo, pagina):
    with open(nome_arquivo, encoding="utf-8") as f:
        visitas = json.load(f)
    visitas[pagina] += 1
    return visitas[pagina]
```

```python solucao
import json

def registrar_visita(nome_arquivo, pagina):
    try:
        with open(nome_arquivo, encoding="utf-8") as f:
            visitas = json.load(f)
    except FileNotFoundError:
        visitas = {}
    visitas[pagina] = visitas.get(pagina, 0) + 1
    with open(nome_arquivo, "w", encoding="utf-8") as f:
        json.dump(visitas, f, ensure_ascii=False)
    return visitas[pagina]
```

```python teste
import os, json as _json
_nome = "_teste_visitas.json"
if os.path.exists(_nome):
    os.remove(_nome)
assert registrar_visita(_nome, "início") == 1, "A 1ª visita a 'início' deveria devolver 1 (arquivo ainda não existia)"
assert registrar_visita(_nome, "início") == 2, "A 2ª visita a 'início' deveria devolver 2"
assert registrar_visita(_nome, "contato") == 1, "A 1ª visita a 'contato' deveria devolver 1"
with open(_nome, encoding="utf-8") as _f:
    _d = _json.load(_f)
assert _d == {"início": 2, "contato": 1}, f"O arquivo deveria conter {{'início': 2, 'contato': 1}}, contém {_d}"
```

## CSV: planilhas em texto
fonte: Documentação oficial do Python (csv)

**CSV** (*Comma-Separated Values*) é o formato de planilha mais simples: cada linha é uma linha da tabela e os campos são separados por vírgula (ou ponto e vírgula, comum em planilhas em português). Excel, LibreOffice e Google Planilhas abrem e exportam CSV.

Separar com `split(",")` funciona até aparecer um campo com vírgula dentro, como `"Silva, Ana"`. O módulo `csv` cuida dessas regras (aspas, separadores, quebras) para você.

### csv.writer e csv.reader

```python
import csv

linhas = [
    ["nome", "cidade", "idade"],
    ["Silva, Ana", "Recife", 31],
    ["Bruno", "São Paulo", 25],
]
with open("pessoas.csv", "w", newline="", encoding="utf-8") as f:
    escritor = csv.writer(f)
    escritor.writerows(linhas)        # ou writerow(uma_linha) para cada uma

with open("pessoas.csv", encoding="utf-8") as f:
    print(f.read())                   # veja como o csv colocou aspas

with open("pessoas.csv", newline="", encoding="utf-8") as f:
    leitor = csv.reader(f)
    cabecalho = next(leitor)          # primeira linha
    for linha in leitor:
        print(linha)                  # cada linha é uma lista de STRINGS
```

> ⚠️ Abra arquivos CSV com `newline=""`. Sem isso, no Windows podem aparecer linhas em branco extras entre os registros.

> ⚠️ O `csv.reader` devolve tudo como **texto**: `"31"`, não `31`. Converta com `int()` ou `float()` quando precisar fazer contas.

### DictReader e DictWriter: colunas pelo nome

Com `DictReader`, cada linha vira um dicionário cujas chaves vêm do cabeçalho. O código fica muito mais legível do que usar `linha[2]`:

```python
import csv

with open("vendas.csv", "w", newline="", encoding="utf-8") as f:
    f.write("produto;quantidade;preco\n")
    f.write("caneta;10;2.50\n")
    f.write("caderno;3;15.00\n")
    f.write("caneta;5;2.50\n")

total_por_produto = {}
with open("vendas.csv", newline="", encoding="utf-8") as f:
    for linha in csv.DictReader(f, delimiter=";"):    # separador ;
        valor = int(linha["quantidade"]) * float(linha["preco"])
        produto = linha["produto"]
        total_por_produto[produto] = total_por_produto.get(produto, 0) + valor
print(total_por_produto)
```

```python
import csv

alunos = [
    {"nome": "Ana", "nota": 9.5, "situacao": "aprovado"},
    {"nome": "Caio", "nota": 4.0, "situacao": "reprovado"},
]
with open("resultado.csv", "w", newline="", encoding="utf-8") as f:
    escritor = csv.DictWriter(f, fieldnames=["nome", "nota", "situacao"])
    escritor.writeheader()
    escritor.writerows(alunos)

with open("resultado.csv", encoding="utf-8") as f:
    print(f.read())
```

> 💡 Para análises pesadas de planilhas, no computador, a biblioteca externa **pandas** (`pd.read_csv`) é o padrão do mercado. Mas para tarefas simples o módulo `csv` da biblioteca padrão resolve sem instalar nada.

### Exercício
O arquivo tem o cabeçalho `nome,nota1,nota2,nota3`. Escreva `medias(nome_arquivo)` que usa `csv.DictReader` e devolve um dicionário `{nome: média}`, com a média das três notas arredondada para 1 casa (`round(m, 1)`).

```text
nome,nota1,nota2,nota3
Ana,8,9,10
Bruno,5,6.5,7
```

Resultado: `{"Ana": 9.0, "Bruno": 6.2}`.

```python inicial
import csv

def medias(nome_arquivo):
    resultado = {}
    with open(nome_arquivo, newline="", encoding="utf-8") as f:
        for linha in csv.reader(f):
            resultado[linha[0]] = linha[1]
    return resultado
```

```python solucao
import csv

def medias(nome_arquivo):
    resultado = {}
    with open(nome_arquivo, newline="", encoding="utf-8") as f:
        for linha in csv.DictReader(f):
            notas = [float(linha["nota1"]), float(linha["nota2"]), float(linha["nota3"])]
            resultado[linha["nome"]] = round(sum(notas) / 3, 1)
    return resultado
```

```python teste
_nome = "_teste_medias.csv"
with open(_nome, "w", newline="", encoding="utf-8") as _f:
    _f.write("nome,nota1,nota2,nota3\nAna,8,9,10\nBruno,5,6.5,7\n")
r = medias(_nome)
assert r == {"Ana": 9.0, "Bruno": 6.2}, f"Esperava {{'Ana': 9.0, 'Bruno': 6.2}}, veio {r}"
with open(_nome, "w", newline="", encoding="utf-8") as _f:
    _f.write("nome,nota1,nota2,nota3\n\"Souza, Lia\",10,10,7\n")
assert medias(_nome) == {"Souza, Lia": 9.0}, "Nomes com vírgula entre aspas devem ser lidos corretamente: esperava {'Souza, Lia': 9.0}"
```

## Importando módulos: math, random e statistics
fonte: Pense em Python cap. 3.2 e 13.2; Documentação oficial do Python (Tutorial, cap. 6)

Um **módulo** é um arquivo com definições Python (funções, variáveis, classes) que você pode reutilizar. O Python vem com uma enorme **biblioteca padrão**: centenas de módulos prontos, "pilhas incluídas".

### As formas de importar

| Forma | Como usar depois | Observação |
|---|---|---|
| `import math` | `math.sqrt(9)` | a mais clara: deixa explícito de onde vem cada nome |
| `import math as m` | `m.sqrt(9)` | apelido; comum em `import numpy as np` |
| `from math import sqrt, pi` | `sqrt(9)` | traz só os nomes escolhidos |
| `from math import *` | `sqrt(9)` | traz tudo: **evite**, polui o namespace |

```python
import math
from math import sqrt, pi
import statistics as st

print(math.floor(3.7), math.ceil(3.2), math.sqrt(16))
print(sqrt(2), round(pi, 4))
print(st.mean([1, 2, 3, 4]))
print(dir(math)[:12])          # nomes disponíveis no módulo
```

> ⚠️ Nunca dê a um arquivo seu o nome de um módulo da biblioteca padrão (`random.py`, `math.py`, `json.py`...). O seu arquivo "esconde" o original e o `import` passa a carregar o seu, gerando erros misteriosos.

### math

```python
import math

print(math.pi, math.e, math.inf)
print(math.sqrt(81), math.pow(2, 10), 2 ** 10)
print(math.factorial(5), math.gcd(12, 18), math.lcm(4, 6))
print(math.log(100, 10), math.log2(8), math.log10(1000))
print(math.sin(math.pi / 2), math.degrees(math.pi), math.radians(180))
print(math.hypot(3, 4), math.dist((0, 0), (3, 4)))
print(math.isclose(0.1 + 0.2, 0.3), math.trunc(-3.7), math.floor(-3.7))
print(math.comb(5, 2), math.perm(5, 2))   # combinações e arranjos
```

### random

O módulo `random` gera números **pseudoaleatórios**: eles parecem aleatórios, mas são calculados a partir de uma **semente** (*seed*). Fixando a semente com `random.seed`, a sequência se repete, o que é ótimo para testes e para reproduzir resultados:

```python
import random

random.seed(42)                         # resultados reproduzíveis
print(random.random())                  # float em [0, 1)
print(random.randint(1, 6))             # inteiro de 1 a 6 (inclui o 6!)
print(random.uniform(1.5, 2.5))         # float no intervalo
cores = ["vermelho", "verde", "azul", "amarelo"]
print(random.choice(cores))             # um elemento
print(random.sample(cores, 2))          # 2 sem repetição
print(random.choices(cores, k=5))       # 5 com repetição
random.shuffle(cores)                   # embaralha NO LUGAR
print(cores)
```

```python
import random

random.seed(2024)
a = [random.randint(1, 100) for _ in range(5)]
random.seed(2024)
b = [random.randint(1, 100) for _ in range(5)]
print(a)
print(b, "-> iguais?", a == b)
```

> ⚠️ `random` **não** serve para senhas ou tokens de segurança, porque é previsível. Para isso use o módulo `secrets` (`secrets.token_hex(16)`).

### statistics

```python
import statistics as st

idades = [18, 22, 22, 25, 31, 40, 22]
print("média:", st.mean(idades))
print("mediana:", st.median(idades))
print("moda:", st.mode(idades))
print("desvio padrão:", round(st.stdev(idades), 2))
print("variância:", round(st.variance(idades), 2))
print("quartis:", st.quantiles(idades, n=4))
```

### Exercício
Escreva `resumo(valores)` que devolve um dicionário com as chaves `"media"`, `"mediana"`, `"desvio"` (desvio padrão amostral, `statistics.stdev`) e `"amplitude"` (maior menos menor). Arredonde todos os valores com `round(x, 2)`.

Ex.: `resumo([2, 4, 4, 4, 5, 5, 7, 9])` → `{"media": 5.0, "mediana": 4.5, "desvio": 2.14, "amplitude": 7}`.

```python inicial
def resumo(valores):
    return {"media": sum(valores) / len(valores)}
```

```python solucao
import statistics

def resumo(valores):
    return {
        "media": round(statistics.mean(valores), 2),
        "mediana": round(statistics.median(valores), 2),
        "desvio": round(statistics.stdev(valores), 2),
        "amplitude": round(max(valores) - min(valores), 2),
    }
```

```python teste
r = resumo([2, 4, 4, 4, 5, 5, 7, 9])
esperado = {"media": 5.0, "mediana": 4.5, "desvio": 2.14, "amplitude": 7}
assert r == esperado, f"Esperava {esperado}, veio {r}"
r2 = resumo([10, 20, 60])
assert r2 == {"media": 30, "mediana": 20, "desvio": 26.46, "amplitude": 50}, f"Para [10, 20, 60] veio {r2}"
```

## Datas e horas: datetime e time
fonte: Documentação oficial do Python (datetime, time)

O módulo `datetime` tem tipos para representar datas e horas e fazer contas com elas:

| Tipo | Representa | Exemplo |
|---|---|---|
| `date` | uma data (ano, mês, dia) | `date(2025, 12, 25)` |
| `time` | um horário do dia | `time(14, 30)` |
| `datetime` | data + horário | `datetime(2025, 12, 25, 14, 30)` |
| `timedelta` | uma **duração** (diferença) | `timedelta(days=7, hours=3)` |

```python
from datetime import date, datetime, timedelta

hoje = date.today()
agora = datetime.now()
print("Hoje:", hoje, "| ano:", hoje.year, "mês:", hoje.month, "dia:", hoje.day)
print("Agora:", agora)

natal = date(2025, 12, 25)
print(natal.weekday())        # 0 = segunda ... 6 = domingo
print(natal.isoformat())      # '2025-12-25' (formato padrão internacional)
```

> 💡 O app roda offline e o relógio do "computador" do Python pode estar em UTC. Os exemplos abaixo usam datas fixas para que o resultado seja sempre o mesmo.

### Contas com datas

Subtrair duas datas dá um `timedelta`; somar um `timedelta` a uma data dá outra data:

```python
from datetime import date, datetime, timedelta

inicio = date(2025, 1, 10)
fim = date(2025, 3, 1)
duracao = fim - inicio
print(duracao, "|", duracao.days, "dias")

prazo = inicio + timedelta(days=45)
print("Vencimento:", prazo)
print("Uma semana antes:", prazo - timedelta(weeks=1))

entrada = datetime(2025, 5, 2, 8, 15)
saida = datetime(2025, 5, 2, 17, 45)
trabalhado = saida - entrada
print("Horas trabalhadas:", trabalhado.total_seconds() / 3600)
print(date(2025, 3, 1) > date(2025, 1, 10))   # datas podem ser comparadas
```

### Formatando e interpretando: strftime e strptime

- `strftime` (*string format time*): data → texto, no formato que você quiser.
- `strptime` (*string parse time*): texto → data, seguindo um formato.

| Código | Significado | Exemplo |
|---|---|---|
| `%d` | dia com 2 dígitos | 05 |
| `%m` | mês com 2 dígitos | 03 |
| `%Y` | ano com 4 dígitos | 2025 |
| `%y` | ano com 2 dígitos | 25 |
| `%H` / `%M` / `%S` | hora (24h) / minuto / segundo | 14 / 07 / 09 |
| `%A` / `%B` | nome do dia / do mês (no idioma do sistema) | Friday / March |
| `%j` | dia do ano | 064 |

```python
from datetime import datetime

momento = datetime(2025, 3, 5, 14, 7, 9)
print(momento.strftime("%d/%m/%Y"))            # padrão brasileiro
print(momento.strftime("%d/%m/%y às %H:%M"))
print(momento.strftime("%Y-%m-%d %H:%M:%S"))

texto = "25/12/2025 18:30"
convertido = datetime.strptime(texto, "%d/%m/%Y %H:%M")
print(convertido, type(convertido).__name__)
print(datetime.fromisoformat("2025-07-20"))     # atalho para o formato ISO
```

Os nomes de `%A` e `%B` dependem do idioma configurado no sistema (aqui, em inglês). Para garantir português, use uma lista própria:

```python
from datetime import date

DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]
d = date(2025, 9, 7)
print(f"{DIAS[d.weekday()]}, {d.day} de {MESES[d.month - 1]} de {d.year}")
```

### O módulo time

O módulo `time` trabalha com o tempo em **segundos**. É útil para medir quanto um trecho demora e para pausar o programa:

```python
import time

inicio = time.perf_counter()          # cronômetro de alta precisão
soma = sum(i * i for i in range(200_000))
time.sleep(0.1)                       # pausa de 0,1 segundo
duracao = time.perf_counter() - inicio
print(f"Levou {duracao:.2f} s")

print(time.time())                    # segundos desde 01/01/1970 (timestamp)
print(time.strftime("%H:%M:%S"))      # hora atual formatada
```

### Exercício
Escreva `idade(nascimento, hoje)` que recebe dois objetos `date` e devolve a idade em **anos completos**. Cuidado: se o aniversário deste ano ainda não chegou, a pessoa ainda não fez o ano.

Dica: compare as tuplas `(hoje.month, hoje.day)` e `(nascimento.month, nascimento.day)`.

```python inicial
from datetime import date

def idade(nascimento, hoje):
    return hoje.year - nascimento.year
```

```python solucao
from datetime import date

def idade(nascimento, hoje):
    anos = hoje.year - nascimento.year
    if (hoje.month, hoje.day) < (nascimento.month, nascimento.day):
        anos -= 1
    return anos
```

```python teste
from datetime import date as _d
assert idade(_d(2000, 5, 10), _d(2025, 5, 10)) == 25, "No dia do aniversário (10/05/2000 → 10/05/2025) a idade é 25"
assert idade(_d(2000, 5, 10), _d(2025, 5, 9)) == 24, "Um dia antes do aniversário a idade ainda é 24"
assert idade(_d(2000, 5, 10), _d(2025, 12, 31)) == 25, "Em 31/12/2025 a idade é 25"
assert idade(_d(1990, 12, 31), _d(2025, 1, 1)) == 34, "Nascido em 31/12/1990, em 01/01/2025 tem 34"
assert idade(_d(2024, 1, 1), _d(2024, 6, 1)) == 0, "Bebê de 5 meses tem 0 anos"
```

## O módulo collections
fonte: Documentação oficial do Python (collections); Pense em Python cap. 19.6–19.7

O módulo `collections` oferece estruturas de dados especializadas que resolvem problemas comuns com bem menos código.

### Counter: contar coisas

`Counter` é um dicionário que conta quantas vezes cada elemento aparece:

```python
from collections import Counter

votos = ["azul", "verde", "azul", "vermelho", "azul", "verde"]
contagem = Counter(votos)
print(contagem)
print(contagem["azul"], contagem["roxo"])     # chave ausente dá 0, não KeyError
print(contagem.most_common(2))                # os 2 mais comuns

letras = Counter("abracadabra")
print(letras.most_common(3))
letras.update("aaa")                          # soma mais contagens
print(letras["a"], sum(letras.values()))
```

Contadores podem ser somados e subtraídos, o que é ótimo para comparar coleções:

```python
from collections import Counter

estoque = Counter(maçã=5, banana=2)
venda = Counter(maçã=3, banana=2)
print(estoque - venda)          # mantém só os positivos
print(estoque + venda)
print(Counter("roma") == Counter("amor"))   # anagramas!
```

### defaultdict: dicionário com valor padrão

Um `defaultdict` cria automaticamente o valor de uma chave ausente, chamando a função que você passou (`list`, `int`, `set`...):

```python
from collections import defaultdict

palavras = ["ana", "bola", "arroz", "casa", "bala", "cão"]
por_letra = defaultdict(list)
for p in palavras:
    por_letra[p[0]].append(p)     # não precisa checar se a chave existe
print(dict(por_letra))

conta = defaultdict(int)          # int() devolve 0
for p in palavras:
    conta[len(p)] += 1
print(dict(conta))
```

### deque: fila com as duas pontas rápidas

Remover do **início** de uma lista (`lista.pop(0)`) é lento em listas grandes, porque todos os elementos precisam ser deslocados. O `deque` (*double-ended queue*, pronuncia-se "deck") adiciona e remove das duas pontas rapidamente:

```python
from collections import deque

fila = deque(["Ana", "Bia"])
fila.append("Caio")          # entra no fim
fila.appendleft("VIP")       # entra no início
print(fila)
print(fila.popleft(), "foi atendido")
print(fila.pop(), "desistiu")
print(fila)

ultimos = deque(maxlen=3)    # guarda só os 3 mais recentes
for pagina in ["home", "produtos", "carrinho", "pagamento"]:
    ultimos.append(pagina)
print(list(ultimos))

roda = deque([1, 2, 3, 4, 5])
roda.rotate(2)
print(roda)
```

### namedtuple: tuplas com nomes

`namedtuple` cria um tipo de tupla cujos campos podem ser acessados pelo **nome**, deixando o código autoexplicativo:

```python
from collections import namedtuple

Ponto = namedtuple("Ponto", ["x", "y"])
p = Ponto(3, 4)
print(p, p.x, p.y, p[0])
x, y = p                     # continua sendo uma tupla
print((p.x ** 2 + p.y ** 2) ** 0.5)

Livro = namedtuple("Livro", "titulo autor ano")
livros = [Livro("Dom Casmurro", "Machado de Assis", 1899),
          Livro("Vidas Secas", "Graciliano Ramos", 1938)]
for l in sorted(livros, key=lambda l: l.ano, reverse=True):
    print(f"{l.titulo} ({l.ano}) - {l.autor}")
print(livros[0]._replace(ano=1900))    # tuplas são imutáveis: cria uma nova
```

| Estrutura | Use quando precisar... |
|---|---|
| `Counter` | contar ocorrências, achar os mais frequentes |
| `defaultdict` | agrupar ou acumular sem checar se a chave existe |
| `deque` | fila/pilha com inserção e remoção rápidas nas duas pontas |
| `namedtuple` | registros leves e imutáveis com campos nomeados |

### Exercício
Escreva `mais_frequentes(texto, n)` que devolve uma lista com as `n` palavras mais frequentes do texto e suas contagens, como pares `(palavra, contagem)`, na ordem de `Counter.most_common`. Ignore maiúsculas/minúsculas (use `lower()`) e remova as pontuações `.,!?` das pontas de cada palavra (use `strip(".,!?")`).

Ex.: `mais_frequentes("O gato e o rato. O RATO fugiu!", 2)` → `[("o", 3), ("rato", 2)]`.

```python inicial
def mais_frequentes(texto, n):
    return texto.split()[:n]
```

```python solucao
from collections import Counter

def mais_frequentes(texto, n):
    palavras = [p.strip(".,!?") for p in texto.lower().split()]
    return Counter(palavras).most_common(n)
```

```python teste
r = mais_frequentes("O gato e o rato. O RATO fugiu!", 2)
assert r == [("o", 3), ("rato", 2)], f"Esperava [('o', 3), ('rato', 2)], veio {r}"
r = mais_frequentes("sim, sim! não? sim.", 1)
assert r == [("sim", 3)], f"Esperava [('sim', 3)], veio {r}"
assert len(mais_frequentes("a b c d", 3)) == 3, "Com n=3 deveria devolver 3 pares"
```

## Criando seus próprios módulos
fonte: Pense em Python cap. 14.9; Documentação oficial do Python (Tutorial, cap. 6.1)

Qualquer arquivo `.py` é um módulo. Se você salvar funções em `utilidades.py`, outro programa na mesma pasta pode fazer `import utilidades`. É assim que se organiza um projeto maior: cada arquivo cuida de um assunto.

No computador você criaria o arquivo no editor. Aqui no app, vamos criá-lo com `open()` (o diretório atual está no caminho de busca de módulos, `sys.path`):

```python
import sys, importlib

codigo = '''
"""Módulo de conversões de unidades."""
PI = 3.14159

def celsius_para_fahrenheit(c):
    return c * 9 / 5 + 32

def km_para_milhas(km):
    return km * 0.621371
'''
with open("conversoes.py", "w", encoding="utf-8") as f:
    f.write(codigo)

importlib.invalidate_caches()        # avisa o Python que surgiu um arquivo novo
sys.modules.pop("conversoes", None)  # esquece versões antigas (para reexecutar)

import conversoes
print(conversoes.celsius_para_fahrenheit(100))
print(round(conversoes.km_para_milhas(42.195), 2))
print(conversoes.__doc__)
```

> 💡 Um módulo é executado **uma única vez**, na primeira importação; depois o Python reutiliza a versão guardada em `sys.modules`. Por isso, ao alterar o arquivo e importar de novo, nada muda. No computador, basta reiniciar o programa; aqui usamos `sys.modules.pop` (ou `importlib.reload(modulo)`).

### Onde o Python procura módulos

Ao executar `import nome`, o Python procura, em ordem, nos diretórios da lista `sys.path`: primeiro a pasta do script (ou a atual), depois a biblioteca padrão e por fim os pacotes instalados (`site-packages`).

```python
import sys
for caminho in sys.path[:4]:
    print(repr(caminho))
```

### `if __name__ == "__main__":`

Todo módulo tem a variável especial `__name__`. Quando o arquivo é **executado diretamente**, ela vale `"__main__"`; quando é **importado**, vale o nome do módulo. Isso permite que um arquivo funcione tanto como programa quanto como biblioteca: o código de teste/demonstração só roda quando o arquivo é executado diretamente.

```python
import sys, importlib

with open("saudacoes.py", "w", encoding="utf-8") as f:
    f.write('''
def ola(nome):
    return f"Olá, {nome}!"

print("saudacoes.__name__ =", __name__)

if __name__ == "__main__":
    # só roda com: python saudacoes.py
    print(ola("mundo"))
''')

importlib.invalidate_caches()
sys.modules.pop("saudacoes", None)
import saudacoes                  # o print de teste dentro do if NÃO roda
print(saudacoes.ola("Ana"))
print("Este programa:", __name__)
```

Sem o `if`, todo código "solto" do módulo (prints, testes) seria executado a cada `import`, o que quase nunca é desejado.

### Pacotes

Quando os módulos se multiplicam, você os agrupa em **pacotes**: pastas de módulos, normalmente com um arquivo `__init__.py`.

```text
minha_loja/
├── principal.py
└── loja/
    ├── __init__.py
    ├── produtos.py
    └── pagamentos.py
```

```python nao-executar
# dentro de principal.py
from loja.produtos import buscar_produto
from loja import pagamentos

item = buscar_produto("caneta")
pagamentos.cobrar(item)
```

### Exercício
Usando `open()`, crie o arquivo `geometria_aluno.py` com duas funções: `area_circulo(r)` (π·r², use `math.pi`) e `perimetro_circulo(r)` (2·π·r). Depois **importe o módulo** com `import geometria_aluno` (lembre-se de `importlib.invalidate_caches()` e de `sys.modules.pop("geometria_aluno", None)` antes do import).

```python inicial
import sys, importlib

codigo = '''
import math

# escreva as funções aqui
'''
# grave `codigo` no arquivo e importe o módulo
```

```python solucao
import sys, importlib

codigo = '''
import math

def area_circulo(r):
    return math.pi * r ** 2

def perimetro_circulo(r):
    return 2 * math.pi * r
'''
with open("geometria_aluno.py", "w", encoding="utf-8") as f:
    f.write(codigo)

importlib.invalidate_caches()
sys.modules.pop("geometria_aluno", None)
import geometria_aluno
print(geometria_aluno.area_circulo(1))
```

```python teste
import math as _m
assert "geometria_aluno" in globals(), "Importe o módulo com: import geometria_aluno"
_g = globals()["geometria_aluno"]
assert hasattr(_g, "area_circulo"), "O módulo deveria ter a função area_circulo"
assert hasattr(_g, "perimetro_circulo"), "O módulo deveria ter a função perimetro_circulo"
assert _m.isclose(_g.area_circulo(2), 4 * _m.pi), "area_circulo(2) deveria ser 4π ≈ 12.566"
assert _m.isclose(_g.perimetro_circulo(3), 6 * _m.pi), "perimetro_circulo(3) deveria ser 6π ≈ 18.85"
```

## pip, PyPI e ambientes virtuais
fonte: Documentação oficial do Python (Tutorial, cap. 12 – Ambientes virtuais e pacotes)

A biblioteca padrão é grande, mas a força do ecossistema Python está nos **pacotes de terceiros**: mais de 500 mil projetos publicados no **PyPI** (*Python Package Index*, pypi.org). Você os instala com o **pip**, o gerenciador de pacotes do Python.

> ⚠️ Este app funciona **offline** e só tem a biblioteca padrão. Os comandos desta lição são para quando você programar no **computador** (ou no Termux). Os exemplos com bibliotecas externas aparecem só para leitura.

### Comandos essenciais do pip

```bash
python -m pip install requests          # instala a versão mais recente
python -m pip install "pandas==2.2.3"   # instala uma versão específica
python -m pip install --upgrade requests
python -m pip uninstall requests
python -m pip list                      # pacotes instalados
python -m pip show pandas               # detalhes de um pacote
```

> 💡 Prefira `python -m pip` a apenas `pip`: assim você garante que o pacote será instalado para **o mesmo Python** que vai executar seu programa. No Windows, troque `python` por `py` se necessário; no Linux/macOS, às vezes é `python3`.

### Por que usar ambientes virtuais (venv)?

Imagine dois projetos: um precisa do pandas 1.5 e outro do pandas 2.2. Se você instalar tudo no Python "global", um quebra o outro. Um **ambiente virtual** é uma pasta com uma cópia isolada do Python e **seus próprios pacotes**, uma para cada projeto.

```bash
# 1. criar o ambiente (uma vez por projeto), numa pasta chamada .venv
python -m venv .venv

# 2. ativar o ambiente
source .venv/bin/activate        # Linux / macOS
.venv\Scripts\activate           # Windows (PowerShell ou cmd)

# 3. instalar pacotes: vão só para este ambiente
python -m pip install requests pandas

# 4. sair do ambiente
deactivate
```

Com o ambiente ativo, o nome dele aparece no início do prompt, por exemplo `(.venv) $`.

### requirements.txt: a lista de dependências

Para que outra pessoa (ou você, em outro computador) recrie o mesmo ambiente, registre as dependências num arquivo `requirements.txt`:

```bash
python -m pip freeze > requirements.txt    # salva as versões instaladas
python -m pip install -r requirements.txt  # instala tudo de uma vez
```

```text
pandas==2.2.3
requests==2.32.3
```

> 💡 Não envie a pasta `.venv` para o Git: inclua-a no `.gitignore`. O `requirements.txt` (ou o `pyproject.toml`) é o que deve ir junto com o código.

### Um gostinho de bibliotecas populares

```python nao-executar
import requests

resposta = requests.get("https://api.github.com/repos/python/cpython")
dados = resposta.json()
print(dados["stargazers_count"], "estrelas")
```

```python nao-executar
import pandas as pd

df = pd.read_csv("vendas.csv", sep=";")
print(df.head())
print(df.groupby("produto")["quantidade"].sum())
```

| Pacote | Para quê |
|---|---|
| `requests` / `httpx` | acessar sites e APIs pela internet |
| `pandas` | análise de dados em tabelas |
| `numpy` | computação numérica com vetores e matrizes |
| `matplotlib` | gráficos |
| `flask` / `django` / `fastapi` | sites e APIs web |
| `pytest` | testes automatizados |
| `openpyxl` | ler e escrever planilhas do Excel |

Ferramentas mais novas, como o **uv**, fazem o papel de `pip` + `venv` de forma muito mais rápida (`uv venv`, `uv pip install`), mas os conceitos são os mesmos.

### Lidando com pacotes que podem não estar instalados

Se o seu programa usa um pacote opcional, trate a ausência dele com `ModuleNotFoundError` e dê uma mensagem útil (ou use uma alternativa da biblioteca padrão). Também é possível apenas **verificar** se um módulo existe com `importlib.util.find_spec`:

```python
import importlib.util

for nome in ["json", "csv", "pandas", "requests"]:
    disponivel = importlib.util.find_spec(nome) is not None
    print(f"{nome:<9} {'instalado' if disponivel else 'não instalado'}")

try:
    import pandas as pd
except ModuleNotFoundError:
    pd = None
    print("pandas não encontrado: instale com  python -m pip install pandas")
```

Mesmo sem internet, você pode conferir o que a biblioteca padrão oferece. Por exemplo, quais módulos já estão carregados e a versão do Python:

```python
import sys
print(sys.version.split()[0])
print("json" in sys.stdlib_module_names, "pandas" in sys.stdlib_module_names)
print(len(sys.stdlib_module_names), "módulos na biblioteca padrão")
```

## Quiz
? O que acontece ao abrir com `open("dados.txt", "w")` um arquivo que já existe?
- [ ] O texto novo é acrescentado ao final
- [x] O conteúdo anterior é apagado
- [ ] Ocorre FileExistsError
- [ ] O arquivo é aberto só para leitura
> O modo `"w"` trunca o arquivo. Para acrescentar ao final use `"a"`; para dar erro se existir, `"x"`.

? Qual a principal vantagem de usar `with open(...) as f:`?
- [ ] O arquivo é lido mais rápido
- [x] O arquivo é fechado automaticamente, mesmo se ocorrer um erro
- [ ] Não é preciso indicar o modo
- [ ] Permite abrir arquivos inexistentes
> O `with` garante o fechamento do arquivo ao final do bloco, em qualquer situação.

? Por que é recomendado passar `encoding="utf-8"` ao abrir arquivos de texto?
- [ ] Para compactar o arquivo
- [ ] Porque é obrigatório
- [x] Para que acentos funcionem igual em qualquer sistema operacional
- [ ] Para abrir arquivos binários
> Sem especificar, o Python usa a codificação padrão do sistema, que pode não ser UTF-8 (ex.: Windows).

? Qual a diferença entre `json.dump` e `json.dumps`?
- [ ] Nenhuma
- [x] `dump` grava num arquivo; `dumps` devolve uma string
- [ ] `dumps` grava vários objetos
- [ ] `dump` é para listas e `dumps` para dicionários
> O "s" significa *string*: `dumps`/`loads` trabalham com strings; `dump`/`load`, com arquivos.

? O que `csv.DictReader` devolve para cada linha?
- [ ] Uma lista de números
- [x] Um dicionário cujas chaves são os nomes das colunas do cabeçalho
- [ ] Uma tupla
- [ ] Uma string com a linha inteira
> Cada linha vira um dicionário `{coluna: valor}`; os valores continuam sendo strings.

? Para que serve `random.seed(10)`?
- [ ] Gera o número 10
- [ ] Deixa os números mais aleatórios
- [x] Fixa a semente, fazendo a sequência de números "aleatórios" se repetir
- [ ] Limita os números ao intervalo de 0 a 10
> Com a mesma semente, o gerador pseudoaleatório produz sempre a mesma sequência: útil para testes.

? Qual o tipo do resultado de `date(2025, 3, 1) - date(2025, 1, 1)`?
- [ ] int
- [ ] date
- [x] timedelta
- [ ] str
> A diferença entre datas é uma duração (`timedelta`); use `.days` para obter o número de dias (59).

? Qual estrutura do módulo collections é ideal para contar ocorrências?
- [x] Counter
- [ ] deque
- [ ] namedtuple
- [ ] OrderedDict
> `Counter` conta os elementos e tem métodos como `most_common`.

? Quando o código dentro de `if __name__ == "__main__":` é executado?
- [ ] Sempre que o módulo é importado
- [x] Só quando o arquivo é executado diretamente
- [ ] Nunca
- [ ] Só dentro de pacotes
> Ao importar, `__name__` vale o nome do módulo; ao executar diretamente, vale `"__main__"`.

? Para que serve um ambiente virtual (venv)?
- [ ] Para rodar Python sem instalá-lo
- [x] Para isolar os pacotes de cada projeto, evitando conflitos de versão
- [ ] Para deixar o Python mais rápido
- [ ] Para programar offline
> Cada venv tem seus próprios pacotes, então projetos diferentes podem usar versões diferentes da mesma biblioteca.
