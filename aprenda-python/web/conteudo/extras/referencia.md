# Referência rápida

### Saída e entrada

| Comando | Resultado |
|---|---|
| `print("a", "b")` | `a b` |
| `print("a", "b", sep="-")` | `a-b` |
| `print("sem quebra", end="")` | não pula linha no final |
| `print(f"{x:.2f}")` | número com 2 casas decimais |
| `input("Nome: ")` | lê uma linha digitada (sempre devolve `str`) |
| `int(input("Idade: "))` | lê e converte para inteiro |

```python
nome = "Ana"
preco = 1234.5
print(f"Olá, {nome}!")
print(f"Preço: R$ {preco:,.2f}")       # separador de milhar no padrão americano: 1,234.50
print(f"|{nome:<6}|{nome:>6}|{nome:^6}|")   # alinhamento
print(f"{0.256:.1%}", f"{42:05d}", f"{255:x}")
idade = int(input("Sua idade: "))
print("Ano que vem você terá", idade + 1)
```

### Tipos e conversões

| Tipo | Exemplo | Conversão |
|---|---|---|
| `int` | `42`, `-7`, `1_000_000` | `int("42")`, `int(3.9)` → `3` |
| `float` | `3.14`, `2e3` | `float("3.5")` |
| `str` | `"texto"`, `'texto'` | `str(42)` |
| `bool` | `True`, `False` | `bool(0)` → `False`, `bool("x")` → `True` |
| `list` | `[1, 2, 3]` | `list("abc")` → `['a', 'b', 'c']` |
| `tuple` | `(1, 2)` | `tuple([1, 2])` |
| `dict` | `{"a": 1}` | `dict([("a", 1)])` |
| `set` | `{1, 2}` | `set([1, 1, 2])` → `{1, 2}` |
| `NoneType` | `None` | — |

```python
print(type(42), type(3.0), type("oi"), type(None))
print(isinstance(3, int), isinstance("3", int))
print(int("101", 2), round(2.675, 2), round(7.5), abs(-3))   # 2.67: floats não são exatos; round(7.5) dá 8 (arredonda para o par)
print(bool(""), bool([]), bool(0), bool("0"))   # valores "falsos" e "verdadeiros"
```

### Operadores

| Categoria | Operadores |
|---|---|
| Aritméticos | `+ - * /` (divisão real), `//` (divisão inteira), `%` (resto), `**` (potência) |
| Atribuição | `= += -= *= /= //= %= **=` |
| Comparação | `== != < > <= >=` (podem ser encadeados: `0 < x < 10`) |
| Lógicos | `and`, `or`, `not` |
| Pertinência | `in`, `not in` |
| Identidade | `is`, `is not` (use para `None`: `x is None`) |
| Morsa | `:=` atribui dentro de uma expressão |

Precedência (da maior para a menor): `**` → `-x` → `* / // %` → `+ -` → comparações → `not` → `and` → `or`.

```python
print(7 / 2, 7 // 2, 7 % 2, 2 ** 10, -7 // 2)
x = 5
print(0 < x < 10, x == 5 and x != 3, not x > 3)
print("a" in "casa", 3 not in [1, 2])
print(2 + 3 * 4, (2 + 3) * 4)
```

### Strings: métodos

| Método | Exemplo | Resultado |
|---|---|---|
| `upper()` / `lower()` | `"Py".upper()` | `'PY'` |
| `title()` / `capitalize()` | `"ana maria".title()` | `'Ana Maria'` |
| `strip()` | `"  oi  ".strip()` | `'oi'` |
| `split(sep)` | `"a,b,c".split(",")` | `['a', 'b', 'c']` |
| `join(lista)` | `"-".join(["a", "b"])` | `'a-b'` |
| `replace(a, b)` | `"casa".replace("a", "o")` | `'coso'` |
| `find(s)` / `index(s)` | `"banana".find("n")` | `2` (`find` dá `-1` se não achar) |
| `count(s)` | `"banana".count("a")` | `3` |
| `startswith(s)` / `endswith(s)` | `"foto.png".endswith(".png")` | `True` |
| `isdigit()` / `isalpha()` | `"123".isdigit()` | `True` |
| `zfill(n)` | `"7".zfill(3)` | `'007'` |

```python
s = "Python é legal"
print(s[0], s[-1], s[0:6], s[::-1])      # índice, fatia, invertida
print(len(s), s.upper(), s.split())
print("-" * 20)
print(" ".join(p.capitalize() for p in "olá mundo".split()))
texto = """várias
linhas"""
print(texto, "\ttab\\barra 'aspas'")
```

### Listas

| Operação | Exemplo |
|---|---|
| Criar | `nums = [3, 1, 2]`, `vazia = []` |
| Acessar / alterar | `nums[0]`, `nums[-1]`, `nums[0] = 10` |
| Adicionar | `append(x)`, `insert(i, x)`, `extend(outra)` |
| Remover | `remove(x)`, `pop()`, `pop(i)`, `del nums[i]`, `clear()` |
| Procurar | `x in nums`, `nums.index(x)`, `nums.count(x)` |
| Ordenar | `nums.sort()` (altera), `sorted(nums)` (nova lista), `reverse=True`, `key=` |
| Outros | `len`, `sum`, `min`, `max`, `nums.reverse()`, `nums.copy()` |

```python
nums = [5, 2, 8, 1]
nums.append(9)
nums.insert(0, 7)
print(nums, len(nums), sum(nums), max(nums))
nums.remove(8)
ultimo = nums.pop()
print(nums, ultimo, sorted(nums), sorted(nums, reverse=True))
nomes = ["ana", "Bia", "carlos"]
print(sorted(nomes, key=str.lower), sorted(nomes, key=len))
print(nums[1:3], nums[::2])
for i, n in enumerate(nums):
    print(i, n, end=" | ")
print()
```

> ⚠️ `b = a` não copia a lista: as duas variáveis apontam para o mesmo objeto. Use `b = a.copy()` ou `b = a[:]`.

### Tuplas

Sequências **imutáveis**: úteis para dados que não mudam e para devolver vários valores.

```python
ponto = (3, 4)
x, y = ponto                     # desempacotamento
print(x, y, ponto[0], len(ponto))
a, b = 1, 2
a, b = b, a                      # troca de valores
print(a, b)
unitaria = (5,)                  # a vírgula é obrigatória
primeiro, *resto = [1, 2, 3, 4]
print(unitaria, primeiro, resto)

def min_max(valores):
    return min(valores), max(valores)   # devolve uma tupla

print(min_max([4, 9, 1]))
```

### Dicionários

| Operação | Exemplo |
|---|---|
| Criar | `d = {"ana": 8, "bia": 9}`, `dict(a=1, b=2)` |
| Acessar | `d["ana"]` (erro se não existe), `d.get("zé", 0)` (valor padrão) |
| Inserir / alterar | `d["caio"] = 7` |
| Remover | `del d["ana"]`, `d.pop("ana")` |
| Percorrer | `d.keys()`, `d.values()`, `d.items()` |
| Outros | `"ana" in d`, `len(d)`, `d.update(outro)`, `d.setdefault(k, [])` |

```python
notas = {"ana": 8.5, "bia": 9.0}
notas["caio"] = 7.0
print(notas["ana"], notas.get("zé", "sem nota"), "bia" in notas)
for nome, nota in notas.items():
    print(f"{nome}: {nota}")
contagem = {}
for letra in "banana":
    contagem[letra] = contagem.get(letra, 0) + 1
print(contagem)
print(max(notas, key=notas.get))      # chave com o maior valor
```

### Conjuntos

Coleções **sem ordem e sem repetição**, com teste `in` muito rápido.

```python
a = {1, 2, 3, 4}
b = {3, 4, 5}
print(a | b, a & b, a - b, a ^ b)    # união, interseção, diferença, simétrica
a.add(10)
a.discard(1)
print(a, 3 in a, {1, 2} <= {1, 2, 3})
print(set("abracadabra"), len(set([1, 1, 2, 2, 3])))
vazio = set()                        # {} cria um dicionário vazio!
print(type(vazio), type({}))
```

### Condicionais

```python
nota = 7.5
if nota >= 9:
    conceito = "A"
elif nota >= 7:
    conceito = "B"
elif nota >= 5:
    conceito = "C"
else:
    conceito = "D"
print(conceito)

situacao = "aprovado" if nota >= 6 else "reprovado"   # expressão condicional
print(situacao)

comando = "sair"
match comando:                       # casamento de padrões (Python 3.10+)
    case "ajuda":
        print("mostrando ajuda")
    case "sair" | "fim":
        print("até logo")
    case _:
        print("comando desconhecido")
```

### Laços

| Forma | Uso |
|---|---|
| `for x in sequencia:` | percorre cada elemento |
| `for i in range(início, fim, passo):` | conta números (`fim` não incluído) |
| `for i, x in enumerate(seq):` | índice e elemento |
| `for a, b in zip(seq1, seq2):` | percorre duas sequências juntas |
| `while condição:` | repete enquanto a condição for verdadeira |
| `break` / `continue` | sai do laço / pula para a próxima volta |
| `else:` no laço | executa se o laço terminou sem `break` |

```python
for i in range(1, 10, 3):
    print(i, end=" ")
print()
for nome, idade in zip(["Ana", "Bia"], [20, 31]):
    print(nome, idade)
n = 10
while n > 0:
    n -= 3
    if n == 4:
        continue
    print(n, end=" ")
print()
for x in [2, 4, 6]:
    if x % 2:
        break
else:
    print("todos são pares")
```

### Funções

```python
def saudacao(nome, cumprimento="Olá"):
    """Devolve uma saudação."""
    return f"{cumprimento}, {nome}!"

print(saudacao("Ana"), saudacao("Bia", cumprimento="Oi"))

def somar(*numeros):              # quantidade variável de argumentos
    return sum(numeros)

def perfil(**dados):              # argumentos nomeados variáveis (dict)
    return dados

print(somar(1, 2, 3), perfil(nome="Ana", idade=30))

dobro = lambda x: x * 2           # função anônima
print(dobro(21), list(map(dobro, [1, 2])), list(filter(lambda x: x > 1, [1, 2, 3])))

def area(largura: float, altura: float) -> float:   # dicas de tipo
    return largura * altura

def fatorial(n):
    return 1 if n <= 1 else n * fatorial(n - 1)     # recursão

print(area(2, 3.5), fatorial(5))
```

> ⚠️ Não use lista ou dicionário como valor padrão (`def f(x=[])`): o mesmo objeto é reaproveitado entre chamadas. Use `x=None` e crie a lista dentro da função.

### Compreensões

| Tipo | Sintaxe |
|---|---|
| Lista | `[expr for x in seq if cond]` |
| Dicionário | `{chave: valor for x in seq}` |
| Conjunto | `{expr for x in seq}` |
| Gerador | `(expr for x in seq)` (preguiçoso: um item por vez) |

```python
quadrados = [n ** 2 for n in range(6)]
pares = [n for n in range(10) if n % 2 == 0]
tamanhos = {p: len(p) for p in ["sol", "lua", "estrela"]}
iniciais = {p[0] for p in ["ana", "alice", "bruno"]}
rotulos = ["par" if n % 2 == 0 else "ímpar" for n in range(4)]
matriz = [[i * j for j in range(3)] for i in range(3)]
print(quadrados, pares, tamanhos, iniciais, rotulos, matriz, sep="\n")
print(sum(n * n for n in range(1_000)))     # gerador: não cria a lista
```

### Exceções

```python
def dividir(a, b):
    try:
        resultado = a / b
    except ZeroDivisionError:
        print("não dá para dividir por zero")
        return None
    except TypeError as erro:
        print("tipo inválido:", erro)
        return None
    else:
        return resultado            # roda se não houve exceção
    finally:
        print("fim da tentativa")   # roda sempre

print(dividir(10, 2))
print(dividir(1, 0))

class SaldoInsuficiente(Exception):  # exceção própria
    pass

try:
    raise SaldoInsuficiente("saldo de R$ 10 é menor que R$ 50")
except SaldoInsuficiente as e:
    print("Erro:", e)
```

| Exceção comum | Causa típica |
|---|---|
| `SyntaxError` | erro de escrita (parêntese, dois-pontos, aspas) |
| `IndentationError` | indentação incorreta |
| `NameError` | nome não definido |
| `TypeError` | operação com tipo errado (`"5" + 3`) |
| `ValueError` | valor inadequado (`int("abc")`) |
| `IndexError` | índice fora da lista |
| `KeyError` | chave inexistente no dicionário |
| `ZeroDivisionError` | divisão por zero |
| `FileNotFoundError` | arquivo não existe |
| `AttributeError` | atributo ou método inexistente |

### Arquivos

| Modo | Significado |
|---|---|
| `"r"` | leitura (padrão); erro se não existir |
| `"w"` | escrita; cria ou **apaga** o conteúdo anterior |
| `"a"` | acrescenta ao final |
| `"x"` | cria; erro se já existir |
| `"b"` | binário (ex.: `"rb"`, `"wb"`) |

```python
with open("notas.txt", "w", encoding="utf-8") as f:   # fecha sozinho
    f.write("Ana;8.5\n")
    f.write("Bia;9.0\n")

with open("notas.txt", "a", encoding="utf-8") as f:
    print("Caio;7.0", file=f)

with open("notas.txt", encoding="utf-8") as f:
    for linha in f:
        nome, nota = linha.strip().split(";")
        print(nome, float(nota))

import json
dados = {"nome": "Ana", "notas": [8.5, 9.0]}
with open("dados.json", "w", encoding="utf-8") as f:
    json.dump(dados, f, ensure_ascii=False, indent=2)
with open("dados.json", encoding="utf-8") as f:
    print(json.load(f))

from pathlib import Path
p = Path("notas.txt")
print(p.exists(), p.suffix, len(p.read_text(encoding="utf-8").splitlines()))
```

### Classes

```python
class Animal:
    especie = "desconhecida"            # atributo de classe

    def __init__(self, nome, idade):    # construtor
        self.nome = nome                # atributos de instância
        self.idade = idade

    def falar(self):
        return "..."

    def __str__(self):                  # usado por print() e str()
        return f"{self.nome} ({self.idade} anos)"


class Cachorro(Animal):                 # herança
    especie = "Canis familiaris"

    def __init__(self, nome, idade, raca):
        super().__init__(nome, idade)
        self.raca = raca

    def falar(self):                    # sobrescrita (polimorfismo)
        return "Au au!"


rex = Cachorro("Rex", 3, "vira-lata")
print(rex, rex.falar(), rex.especie, isinstance(rex, Animal))
for a in [Animal("Genérico", 1), rex]:
    print(a.nome, "->", a.falar())
```

```python
from dataclasses import dataclass

@dataclass
class Ponto:                 # gera __init__, __repr__ e __eq__ automaticamente
    x: float
    y: float = 0.0

    @property
    def distancia_origem(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

p = Ponto(3, 4)
print(p, p.distancia_origem, p == Ponto(3, 4))
```

| Método especial | Ativado por |
|---|---|
| `__init__` | criação do objeto: `Classe(...)` |
| `__str__` / `__repr__` | `print(obj)` / representação técnica |
| `__len__` | `len(obj)` |
| `__eq__` / `__lt__` | `obj == outro` / `obj < outro` |
| `__add__` | `obj + outro` |
| `__iter__` | `for x in obj` |
| `__contains__` | `x in obj` |
| `__getitem__` | `obj[chave]` |

### Módulos úteis da biblioteca padrão

| Módulo | Para quê | Exemplo |
|---|---|---|
| `math` | funções matemáticas | `math.sqrt(16)`, `math.pi`, `math.ceil(2.1)` |
| `random` | sorteios | `random.randint(1, 6)`, `random.choice(lista)`, `random.shuffle(lista)` |
| `datetime` | datas e horas | `date.today()`, `timedelta(days=7)` |
| `time` | tempo e pausas | `time.time()`, `time.perf_counter()` |
| `json` | ler/gravar JSON | `json.dumps(obj)`, `json.loads(texto)` |
| `csv` | planilhas CSV | `csv.reader(f)`, `csv.DictWriter(f, campos)` |
| `pathlib` | caminhos e arquivos | `Path("pasta") / "arq.txt"` |
| `os` | sistema operacional | `os.listdir(".")`, `os.getcwd()` |
| `collections` | coleções especiais | `Counter`, `defaultdict`, `deque`, `namedtuple` |
| `itertools` | combinações e iteradores | `permutations`, `combinations`, `product`, `chain` |
| `functools` | ferramentas de funções | `lru_cache`, `reduce`, `partial` |
| `statistics` | estatística | `mean`, `median`, `stdev` |
| `re` | expressões regulares | `re.findall(r"\d+", texto)` |
| `string` | constantes de texto | `string.ascii_letters`, `string.punctuation` |
| `unittest` | testes automatizados | `unittest.TestCase` |
| `logging` | registro de eventos | `logging.info("msg")` |

```python
import math, random, statistics, re
from collections import Counter, defaultdict
from datetime import date, timedelta
from itertools import combinations

print(math.sqrt(16), math.floor(2.7), math.pi)
random.seed(1)
print(random.randint(1, 6), random.choice("abc"))
print(statistics.mean([7, 8, 9]), statistics.median([1, 5, 3]))
print(Counter("abracadabra").most_common(2))
grupos = defaultdict(list)
for nome in ["ana", "alice", "bruno"]:
    grupos[nome[0]].append(nome)
print(dict(grupos))
natal = date(2025, 12, 25)
print(natal + timedelta(days=7), natal.strftime("%d/%m/%Y"))
print(list(combinations("ABC", 2)))
print(re.findall(r"\d+", "tel: 11 9876-5432"))
```

### Funções embutidas mais usadas

| Função | O que faz | Exemplo |
|---|---|---|
| `print()` | mostra valores | `print("oi")` |
| `input()` | lê texto do usuário | `input("Nome: ")` |
| `len()` | tamanho | `len([1, 2])` → `2` |
| `type()` / `isinstance()` | tipo / verificação de tipo | `isinstance(3, int)` |
| `int()`, `float()`, `str()`, `bool()` | conversões | `int("7")` |
| `list()`, `tuple()`, `set()`, `dict()` | criam coleções | `list(range(3))` |
| `range()` | sequência de inteiros | `range(0, 10, 2)` |
| `sum()`, `min()`, `max()` | soma, mínimo, máximo | `max([3, 9, 2])` → `9` |
| `abs()`, `round()`, `pow()`, `divmod()` | matemática | `divmod(17, 5)` → `(3, 2)` |
| `sorted()`, `reversed()` | ordenar / inverter | `sorted("cba")` |
| `enumerate()`, `zip()` | índices / parear | `list(zip("ab", [1, 2]))` |
| `map()`, `filter()` | aplicar / filtrar | `list(map(str, [1, 2]))` |
| `any()`, `all()` | algum / todos verdadeiros | `any(x > 2 for x in [1, 3])` |
| `open()` | abrir arquivo | `open("a.txt")` |
| `help()`, `dir()` | documentação / atributos | `help(str.split)` |
| `id()`, `hash()` | identidade / hash | `id(obj)` |
| `chr()`, `ord()` | caractere ↔ código | `ord("A")` → `65` |

```python
dados = [4, 1, 7, 3]
print(len(dados), sum(dados), min(dados), max(dados))
print(sorted(dados), list(reversed(dados)))
print(list(enumerate("abc")), list(zip("ab", [1, 2])))
print(list(map(str.upper, ["a", "b"])), list(filter(None, [0, 1, "", "x"])))
print(any(x > 5 for x in dados), all(x > 0 for x in dados))
print(divmod(17, 5), round(3.14159, 2), pow(2, 8), abs(-4))
print(ord("A"), chr(97), [n for n in dir(list) if not n.startswith("_")][:5])
```
