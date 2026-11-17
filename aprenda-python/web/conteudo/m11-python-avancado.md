# Python avançado
id: m11
nivel: Avançado
icone: ⚡
descricao: Iteradores, geradores, closures, decoradores, gerenciadores de contexto, itertools, type hints, match/case e as novidades do Python moderno.

## Iteráveis e iteradores
fonte: Pense em Python cap. 19; Documentação oficial do Python (tipos iteradores)

Desde os primeiros laços você usa `for x in algo`. Mas o que o `for` realmente faz por baixo dos panos? Entender isso abre a porta para geradores, `itertools` e boa parte do Python avançado.

Dois conceitos que parecem iguais, mas não são:

| Conceito | O que é | Exemplos |
|---|---|---|
| **Iterável** | Qualquer objeto que *pode ser percorrido*. Sabe produzir um iterador com `iter()`. | `list`, `str`, `tuple`, `dict`, `set`, `range`, arquivos |
| **Iterador** | O objeto que *faz o percurso*: lembra onde parou e entrega o próximo item com `next()`. | o resultado de `iter(lista)`, objetos de `map`, `zip`, `enumerate`, geradores |

Veja o `for` "desmontado" à mão:

```python
cores = ["vermelho", "verde", "azul"]
it = iter(cores)          # pede um iterador ao iterável
print(next(it))           # vermelho
print(next(it))           # verde
print(next(it))           # azul
try:
    next(it)              # acabou!
except StopIteration:
    print("O iterador avisou que terminou com StopIteration")
```

Na prática, `for x in cores:` faz exatamente isso: chama `iter(cores)` uma vez e depois `next()` repetidamente, até receber `StopIteration`, que o `for` captura silenciosamente.

> 💡 Um iterador **se esgota**: depois de percorrido, não volta ao começo. Uma lista, por outro lado, pode ser percorrida quantas vezes você quiser, pois cada `for` cria um iterador novo.

```python
numeros = [1, 2, 3]
it = iter(numeros)
print(list(it))   # [1, 2, 3]
print(list(it))   # []  -> o iterador já foi consumido
print(list(numeros), list(numeros))  # a lista continua inteira
```

### O protocolo de iteração

Para um objeto seu funcionar no `for`, basta seguir o **protocolo de iteração**, formado por dois métodos especiais:

- `__iter__(self)`: devolve o iterador (num iterador, devolve o próprio `self`);
- `__next__(self)`: devolve o próximo item ou levanta `StopIteration` quando acabar.

```python
class Intervalo:
    """Iterador que conta de inicio até fim (exclusive), de passo em passo."""
    def __init__(self, inicio, fim, passo=1):
        self.atual = inicio
        self.fim = fim
        self.passo = passo

    def __iter__(self):
        return self

    def __next__(self):
        if self.atual >= self.fim:
            raise StopIteration
        valor = self.atual
        self.atual += self.passo
        return valor

for n in Intervalo(0, 10, 3):
    print(n, end=" ")
print()
print(sum(Intervalo(1, 5)))   # funções como sum, list, max aceitam qualquer iterável
```

### Iterável reutilizável × iterador descartável

Se a classe devolve `self` em `__iter__`, ela só pode ser percorrida uma vez. Para algo reutilizável (como uma lista), o `__iter__` do iterável deve criar um **iterador novo** a cada chamada:

```python
class Playlist:
    def __init__(self, *musicas):
        self.musicas = list(musicas)

    def __iter__(self):
        return iter(self.musicas)   # um iterador novo a cada for

p = Playlist("Asa Branca", "Garota de Ipanema")
for m in p:
    print("1ª volta:", m)
for m in p:
    print("2ª volta:", m)
```

> ⚠️ Chamar `next()` num iterável que não é iterador dá erro: `next([1, 2])` gera `TypeError: 'list' object is not an iterator`. Primeiro use `iter()`.

```python erro
next([1, 2, 3])
```

### Exercício
Crie a classe iteradora `Regressiva(n)` que produz `n, n-1, ..., 1` e depois termina. Ela deve implementar `__iter__` (devolvendo `self`) e `__next__` (levantando `StopIteration` no fim). Exemplo: `list(Regressiva(3))` → `[3, 2, 1]`.

```python inicial
class Regressiva:
    def __init__(self, n):
        self.n = n

    def __iter__(self):
        return self

    def __next__(self):
        # devolva o valor atual e diminua; levante StopIteration quando chegar a 0
        pass
```

```python solucao
class Regressiva:
    def __init__(self, n):
        self.n = n

    def __iter__(self):
        return self

    def __next__(self):
        if self.n <= 0:
            raise StopIteration
        valor = self.n
        self.n -= 1
        return valor
```

```python teste
r = Regressiva(3)
assert iter(r) is r, "__iter__ deveria devolver o próprio objeto (self)"
res = []
for _ in range(10):
    try:
        res.append(next(r))
    except StopIteration:
        break
assert res == [3, 2, 1], f"Regressiva(3) deveria produzir [3, 2, 1], mas produziu {res}"
assert list(Regressiva(5)) == [5, 4, 3, 2, 1], "list(Regressiva(5)) deveria ser [5, 4, 3, 2, 1]"
assert list(Regressiva(0)) == [], "Regressiva(0) não deveria produzir nada"
```

## Geradores com yield
fonte: Pense em Python cap. 19; Documentação oficial do Python (geradores)

Escrever uma classe com `__iter__` e `__next__` funciona, mas dá trabalho. Um **gerador** faz o mesmo com muito menos código: é uma função comum que usa `yield` no lugar de (ou além de) `return`.

```python
def regressiva(n):
    while n > 0:
        yield n      # entrega n e PAUSA aqui
        n -= 1

g = regressiva(3)
print(g)             # um objeto gerador, nada foi executado ainda
print(next(g))       # 3
print(next(g))       # 2
print(list(g))       # [1]  -> o que sobrou
```

Como funciona:

1. Chamar `regressiva(3)` **não executa** o corpo: devolve um objeto gerador (que é um iterador).
2. Cada `next()` roda o corpo até o próximo `yield`, entrega o valor e **congela** a função, com todas as variáveis locais preservadas.
3. Quando a função termina (ou executa `return`), o gerador levanta `StopIteration`.

```python
def passos():
    print("  começou")
    yield "A"
    print("  voltou depois do A")
    yield "B"
    print("  terminou")

for letra in passos():
    print("recebi", letra)
```

### Avaliação preguiçosa (lazy)

Um gerador só calcula cada valor **quando alguém pede**. Isso economiza memória: uma lista com um milhão de quadrados ocupa megabytes; o gerador equivalente ocupa poucos bytes, não importa quantos itens produza.

```python
import sys

lista = [x * x for x in range(100_000)]
gerador = (x * x for x in range(100_000))   # expressão geradora (próxima lição)

print("lista:   ", sys.getsizeof(lista), "bytes")
print("gerador: ", sys.getsizeof(gerador), "bytes")
print(sum(gerador) == sum(lista))
```

### Geradores infinitos

Como nada é calculado antecipadamente, um gerador pode ser **infinito**. Para pegar só alguns itens, use `itertools.islice(iteravel, n)`, o "fatiamento" para iteradores:

```python
from itertools import islice

def fibonacci():
    a, b = 0, 1
    while True:          # infinito, mas tudo bem: é preguiçoso
        yield a
        a, b = b, a + b

print(list(islice(fibonacci(), 10)))
print(list(islice(fibonacci(), 20, 25)))   # do 20º ao 24º termo
```

> ⚠️ Nunca faça `list(fibonacci())`: a lista tentaria guardar infinitos itens e o programa travaria até o tempo limite.

### Encadeando geradores e `yield from`

Geradores combinam como peças de uma linha de montagem (*pipeline*): cada etapa consome a anterior, item a item. E `yield from outro` repassa todos os itens de outro iterável:

```python
def ler_linhas():
    yield from ["10", "x", "25", "", "7"]   # simula as linhas de um arquivo

def so_numeros(linhas):
    for l in linhas:
        if l.isdigit():
            yield int(l)

def dobrar(nums):
    for n in nums:
        yield n * 2

print(list(dobrar(so_numeros(ler_linhas()))))   # [20, 50, 14]
```

### Exercício
Escreva o gerador `multiplos(k)` que produz infinitamente os múltiplos positivos de `k` (`k, 2k, 3k, ...`) usando `yield`. Depois, escreva `primeiros_multiplos(k, n)` que devolve uma **lista** com os `n` primeiros, usando `islice`.

```python inicial
from itertools import islice

def multiplos(k):
    return [k, 2 * k, 3 * k]

def primeiros_multiplos(k, n):
    return []
```

```python solucao
from itertools import islice

def multiplos(k):
    i = 1
    while True:
        yield k * i
        i += 1

def primeiros_multiplos(k, n):
    return list(islice(multiplos(k), n))
```

```python teste
import inspect
assert inspect.isgeneratorfunction(multiplos), "multiplos deveria ser um gerador (use yield)"
g = multiplos(7)
assert [next(g) for _ in range(4)] == [7, 14, 21, 28], "multiplos(7) deveria produzir 7, 14, 21, 28, ..."
assert next(g) == 35, "o gerador deveria continuar: depois de 28 vem 35"
assert primeiros_multiplos(3, 5) == [3, 6, 9, 12, 15], "primeiros_multiplos(3, 5) deveria ser [3, 6, 9, 12, 15]"
assert primeiros_multiplos(10, 100)[-1] == 1000, "o 100º múltiplo de 10 é 1000"
```

## Expressões geradoras, any/all e compreensões aninhadas
fonte: Pense em Python cap. 19.2–19.4

Você já conhece as compreensões de lista. Trocando os colchetes por **parênteses**, obtém uma **expressão geradora**: mesma sintaxe, mas avaliação preguiçosa.

```python
quadrados_lista = [x ** 2 for x in range(5)]
quadrados_gen = (x ** 2 for x in range(5))
print(quadrados_lista)
print(quadrados_gen)        # <generator object ...>
print(list(quadrados_gen))

# Quando é o único argumento de uma função, dispensa os parênteses extras:
print(sum(x ** 2 for x in range(5)))
print(max(len(p) for p in ["sol", "abacaxi", "lua"]))
```

> 💡 Regra prática: se você só vai **percorrer uma vez** (somar, achar o máximo, passar para outra função), use a expressão geradora. Se precisa guardar, indexar ou percorrer várias vezes, use a lista.

### Compreensões de dicionário e de conjunto

```python
palavras = ["python", "java", "go", "rust", "python"]
tamanhos = {p: len(p) for p in palavras}        # dict
iniciais = {p[0] for p in palavras}             # set (sem repetição)
print(tamanhos)
print(sorted(iniciais))
```

### any e all

- `any(iteravel)`: `True` se **pelo menos um** item for verdadeiro.
- `all(iteravel)`: `True` se **todos** os itens forem verdadeiros.

Combinadas com expressões geradoras, ficam muito expressivas. E param assim que a resposta fica definida (*curto-circuito*):

```python
notas = [7.5, 8.0, 4.5, 9.0]
print(any(n < 5 for n in notas))     # alguém ficou abaixo de 5?  True
print(all(n >= 5 for n in notas))    # todos passaram?  False

def tem_vogal(palavra):
    return any(letra in "aeiou" for letra in palavra.lower())

print(tem_vogal("Python"), tem_vogal("rhythm"))
print(all([]), any([]))   # casos especiais: lista vazia -> all True, any False
```

### Compreensões aninhadas

Um `for` dentro de outro também cabe numa compreensão. A ordem dos `for` é a mesma dos laços escritos por extenso:

```python
# Por extenso
pares = []
for x in range(3):
    for y in "ab":
        pares.append((x, y))
print(pares)

# Em uma linha: mesma ordem dos for
print([(x, y) for x in range(3) for y in "ab"])

# Achatar uma matriz
matriz = [[1, 2, 3], [4, 5, 6]]
print([v for linha in matriz for v in linha])

# Compreensão DENTRO de compreensão: transpor (linhas viram colunas)
print([[linha[i] for linha in matriz] for i in range(3)])
```

> ⚠️ Compreensões com três ou mais níveis ficam ilegíveis. Se precisou parar para entender, prefira laços comuns: clareza vale mais que uma linha a menos.

### Exercício
Escreva duas funções:

- `todos_pares(nums)`: devolve `True` se todos os números forem pares (use `all`).
- `achatar(matriz)`: devolve uma lista com todos os elementos da matriz (lista de listas), linha por linha, usando uma compreensão aninhada.

```python inicial
def todos_pares(nums):
    return False

def achatar(matriz):
    return matriz
```

```python solucao
def todos_pares(nums):
    return all(n % 2 == 0 for n in nums)

def achatar(matriz):
    return [v for linha in matriz for v in linha]
```

```python teste
assert todos_pares([2, 4, 6]) is True, "todos_pares([2, 4, 6]) deveria ser True"
assert todos_pares([2, 3, 6]) is False, "todos_pares([2, 3, 6]) deveria ser False"
assert todos_pares([]) is True, "todos_pares([]) deveria ser True (como all([]))"
assert achatar([[1, 2], [3], [4, 5, 6]]) == [1, 2, 3, 4, 5, 6], "achatar([[1, 2], [3], [4, 5, 6]]) deveria ser [1, 2, 3, 4, 5, 6]"
assert achatar([]) == [], "achatar([]) deveria ser []"
```

## Closures e nonlocal
fonte: Documentação oficial do Python (escopos e namespaces)

Em Python, funções são **objetos**: podem ser guardadas em variáveis, passadas como argumento e **devolvidas** por outras funções. Quando uma função interna usa variáveis da função externa, e continua lembrando delas depois que a externa terminou, temos uma **closure** (fechamento).

```python
def criar_multiplicador(fator):
    def multiplicar(x):
        return x * fator      # 'fator' vem da função de fora
    return multiplicar

dobro = criar_multiplicador(2)
triplo = criar_multiplicador(3)
print(dobro(10), triplo(10))   # 20 30
# criar_multiplicador já terminou, mas cada função "lembra" o seu fator:
print(dobro.__closure__[0].cell_contents)
```

Cada chamada de `criar_multiplicador` cria um ambiente novo, por isso `dobro` e `triplo` são independentes. Closures são uma forma leve de "guardar estado" sem criar uma classe.

### A regra LEGB

Quando você usa um nome, o Python procura nesta ordem:

| Letra | Escopo | Exemplo |
|---|---|---|
| **L** | Local: dentro da função atual | variáveis criadas na função |
| **E** | *Enclosing*: funções que envolvem a atual | o `fator` do exemplo acima |
| **G** | Global: o módulo | variáveis no topo do arquivo |
| **B** | *Built-in*: nomes do Python | `print`, `len`, `range` |

### Alterando a variável de fora: nonlocal

Ler uma variável externa é livre. Mas **atribuir** a ela faz o Python achar que você está criando uma variável local nova, e o resultado é um erro:

```python erro
def criar_contador():
    total = 0
    def contar():
        total += 1        # o Python acha que 'total' é local aqui
        return total
    return contar

c = criar_contador()
c()
```

A palavra-chave `nonlocal` diz: "este nome pertence à função de fora; altere aquele":

```python
def criar_contador():
    total = 0
    def contar():
        nonlocal total
        total += 1
        return total
    return contar

a = criar_contador()
b = criar_contador()
print(a(), a(), a())   # 1 2 3
print(b())             # 1 -> contador independente
```

> 💡 `global` faz o mesmo para variáveis do módulo, mas use com moderação. `nonlocal` mantém o estado "escondido" dentro da closure, o que é bem mais organizado.

### Armadilha clássica: closures em laços

As closures guardam a **variável**, não o valor do momento. Num laço, todas acabam vendo o último valor:

```python
funcoes = [lambda: i for i in range(3)]
print([f() for f in funcoes])          # [2, 2, 2]  -> surpresa!

# Solução: "congelar" o valor com um parâmetro padrão
funcoes = [lambda i=i: i for i in range(3)]
print([f() for f in funcoes])          # [0, 1, 2]
```

### Exercício
Escreva `criar_acumulador(inicial)` que devolve uma função `somar(valor)`. Cada chamada soma `valor` ao total acumulado e devolve o novo total. Exemplo: `acc = criar_acumulador(10)`; `acc(5)` → `15`; `acc(5)` → `20`. Use uma closure com `nonlocal`.

```python inicial
def criar_acumulador(inicial):
    def somar(valor):
        return inicial + valor
    return somar
```

```python solucao
def criar_acumulador(inicial):
    total = inicial
    def somar(valor):
        nonlocal total
        total += valor
        return total
    return somar
```

```python teste
acc = criar_acumulador(10)
assert acc(5) == 15, "acc(5) deveria devolver 15"
assert acc(5) == 20, "a segunda chamada acc(5) deveria devolver 20 (o total acumula)"
assert acc(-20) == 0, "acc(-20) deveria devolver 0"
outro = criar_acumulador(0)
assert outro(1) == 1, "cada acumulador deve ser independente"
assert acc(1) == 1, "o primeiro acumulador não deve ser afetado pelo segundo"
```

## Decoradores
fonte: Documentação oficial do Python (functools, definição de funções)

Um **decorador** é uma função que recebe uma função e devolve outra, normalmente uma versão "embrulhada" com algum comportamento extra. É uma aplicação direta de closures.

```python
def anunciar(func):
    def embrulho(*args, **kwargs):
        print(f">> chamando {func.__name__}{args}")
        resultado = func(*args, **kwargs)
        print(f"<< {func.__name__} devolveu {resultado}")
        return resultado
    return embrulho

def somar(a, b):
    return a + b

somar = anunciar(somar)    # decorando "à mão"
somar(2, 3)
```

A sintaxe `@decorador` acima do `def` é só um atalho para `func = decorador(func)`:

```python
def anunciar(func):
    def embrulho(*args, **kwargs):
        print(f">> chamando {func.__name__}")
        return func(*args, **kwargs)
    return embrulho

@anunciar
def saudar(nome):
    return f"Olá, {nome}!"

print(saudar("Bia"))
print(saudar.__name__)   # 'embrulho'?! perdemos o nome original...
```

### functools.wraps

O embrulho "esconde" a função original: o nome, a docstring e outras informações somem. `functools.wraps` copia esses dados para o embrulho. **Use sempre**:

```python
import functools

def anunciar(func):
    @functools.wraps(func)
    def embrulho(*args, **kwargs):
        return func(*args, **kwargs)
    return embrulho

@anunciar
def saudar(nome):
    """Devolve uma saudação."""
    return f"Olá, {nome}!"

print(saudar.__name__, "-", saudar.__doc__)
```

### Exemplos úteis: cronometrar e memoizar

```python
import functools
import time

def cronometrar(func):
    @functools.wraps(func)
    def embrulho(*args, **kwargs):
        inicio = time.perf_counter()
        resultado = func(*args, **kwargs)
        duracao = time.perf_counter() - inicio
        print(f"{func.__name__} levou {duracao * 1000:.2f} ms")
        return resultado
    return embrulho

def memoizar(func):
    cache = {}                     # guardado na closure
    @functools.wraps(func)
    def embrulho(n):
        if n not in cache:
            cache[n] = func(n)
        return cache[n]
    return embrulho

@memoizar
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

@cronometrar
def calcular():
    return fib(80)

print(calcular())   # sem memoização, fib(80) levaria anos!
```

> 💡 Os tempos medidos variam de aparelho para aparelho e de uma execução para outra. O importante é a ordem de grandeza.

### Decoradores com argumentos

Para um decorador que recebe parâmetros (`@repetir(3)`), é preciso mais um nível: uma função que recebe os argumentos e **devolve o decorador**.

```python
import functools

def repetir(vezes):                 # 1) recebe o argumento
    def decorador(func):            # 2) recebe a função
        @functools.wraps(func)
        def embrulho(*args, **kwargs):   # 3) substitui a função
            for _ in range(vezes):
                resultado = func(*args, **kwargs)
            return resultado
        return embrulho
    return decorador

@repetir(3)
def bater():
    print("toc!")

bater()
```

Um uso muito comum é **validar** argumentos antes de chamar a função:

```python
import functools

def exigir_positivo(func):
    @functools.wraps(func)
    def embrulho(*args):
        for a in args:
            if a <= 0:
                raise ValueError(f"{func.__name__}: esperava números positivos, recebi {a}")
        return func(*args)
    return embrulho

@exigir_positivo
def area_retangulo(largura, altura):
    return largura * altura

print(area_retangulo(3, 4))
try:
    area_retangulo(3, -1)
except ValueError as e:
    print("Erro:", e)
```

> 💡 Você já usou decoradores prontos: `@property`, `@staticmethod`, `@classmethod` e `@dataclass` são todos decoradores.

### Exercício
Escreva o decorador `contar_chamadas` que conta quantas vezes a função decorada foi chamada, guardando o total no atributo `chamadas` da função embrulhada (ex.: `f.chamadas`). Use `functools.wraps` para preservar o nome original.

```python inicial
import functools

def contar_chamadas(func):
    return func
```

```python solucao
import functools

def contar_chamadas(func):
    @functools.wraps(func)
    def embrulho(*args, **kwargs):
        embrulho.chamadas += 1
        return func(*args, **kwargs)
    embrulho.chamadas = 0
    return embrulho
```

```python teste
@contar_chamadas
def dobro(x):
    """Dobra x."""
    return 2 * x

assert getattr(dobro, "chamadas", None) == 0, "antes de qualquer chamada, dobro.chamadas deveria ser 0"
assert dobro(4) == 8, "a função decorada deve continuar devolvendo o resultado (dobro(4) == 8)"
dobro(1); dobro(2)
assert dobro.chamadas == 3, f"depois de 3 chamadas, dobro.chamadas deveria ser 3, mas é {dobro.chamadas}"
assert dobro.__name__ == "dobro", "use functools.wraps para preservar o __name__"
assert dobro.__doc__ == "Dobra x.", "use functools.wraps para preservar a docstring"

@contar_chamadas
def outra():
    return None
outra()
assert outra.chamadas == 1 and dobro.chamadas == 3, "cada função decorada deve ter seu próprio contador"
```

## Gerenciadores de contexto
fonte: Documentação oficial do Python (with, contextlib)

Você já usou `with open(...) as f:`, que garante que o arquivo será fechado mesmo se der erro no meio. Objetos que funcionam com `with` são **gerenciadores de contexto**. Eles servem para qualquer par "preparar / limpar": abrir e fechar, travar e destravar, iniciar e parar um cronômetro, mudar e restaurar uma configuração.

### O protocolo: `__enter__` e `__exit__`

```python
class Anunciador:
    def __init__(self, nome):
        self.nome = nome

    def __enter__(self):
        print(f"[entrando em {self.nome}]")
        return self            # é o que vai para a variável depois do 'as'

    def __exit__(self, tipo, valor, rastro):
        print(f"[saindo de {self.nome}]  erro: {tipo.__name__ if tipo else 'nenhum'}")
        return False           # False = não engole a exceção

with Anunciador("bloco 1") as a:
    print("  trabalhando com", a.nome)

try:
    with Anunciador("bloco 2"):
        1 / 0
except ZeroDivisionError:
    print("A exceção continuou subindo, mas o __exit__ rodou antes!")
```

O `with` faz o seguinte:

1. chama `__enter__()` e guarda o retorno na variável do `as`;
2. executa o bloco;
3. chama `__exit__(tipo, valor, rastro)` **sempre**, com ou sem erro. Se não houve erro, os três valem `None`;
4. se `__exit__` devolver `True`, a exceção é suprimida (engolida).

Um exemplo prático: um cronômetro reutilizável.

```python
import time

class Cronometro:
    def __enter__(self):
        self.inicio = time.perf_counter()
        return self

    def __exit__(self, *erro):
        self.duracao = time.perf_counter() - self.inicio
        return False

with Cronometro() as c:
    total = sum(range(200_000))

print(total, f"- levou {c.duracao * 1000:.1f} ms (o valor varia)")
```

### O jeito fácil: `contextlib.contextmanager`

Escrever uma classe toda vez cansa. Com o decorador `@contextmanager`, um **gerador** com um único `yield` vira gerenciador de contexto: o que vem antes do `yield` é o `__enter__`, o que vem depois é o `__exit__`.

```python
from contextlib import contextmanager

@contextmanager
def tag(nome):
    print(f"<{nome}>")
    try:
        yield               # aqui o bloco do with é executado
    finally:
        print(f"</{nome}>")  # o finally garante a limpeza mesmo com erro

with tag("html"):
    with tag("body"):
        print("Olá!")
```

> ⚠️ Sem o `try/finally` em volta do `yield`, a parte de limpeza **não** roda quando o bloco do `with` levanta uma exceção.

### Prontos na biblioteca padrão

```python
from contextlib import suppress, redirect_stdout
import io

# suppress: ignora exceções escolhidas
with suppress(KeyError):
    d = {}
    print(d["não existe"])
print("seguiu normalmente")

# redirect_stdout: captura tudo o que for impresso
buffer = io.StringIO()
with redirect_stdout(buffer):
    print("isto não aparece na tela")
print("capturado:", repr(buffer.getvalue()))
```

### Exercício
Usando `@contextmanager`, escreva `registrar(log, nome)` que adiciona a string `"início:" + nome` à lista `log` ao entrar e `"fim:" + nome` ao sair, **mesmo que o bloco levante uma exceção** (que deve continuar subindo).

```python inicial
from contextlib import contextmanager

@contextmanager
def registrar(log, nome):
    log.append("início:" + nome)
    yield
```

```python solucao
from contextlib import contextmanager

@contextmanager
def registrar(log, nome):
    log.append("início:" + nome)
    try:
        yield
    finally:
        log.append("fim:" + nome)
```

```python teste
log = []
with registrar(log, "a"):
    log.append("meio")
assert log == ["início:a", "meio", "fim:a"], f"esperava ['início:a', 'meio', 'fim:a'], veio {log}"
log2 = []
subiu = False
try:
    with registrar(log2, "b"):
        raise ValueError("falha")
except ValueError:
    subiu = True
assert subiu, "a exceção do bloco deveria continuar subindo"
assert log2 == ["início:b", "fim:b"], f"mesmo com erro, deveria registrar o fim: esperava ['início:b', 'fim:b'], veio {log2}"
```

## itertools e functools
fonte: Documentação oficial do Python (itertools, functools)

Os módulos `itertools` e `functools` são caixas de ferramentas para trabalhar com iteráveis e funções. Tudo em `itertools` devolve **iteradores** (preguiçosos), por isso usamos `list()` para ver o resultado.

### Iteradores infinitos e encadeamento

```python
from itertools import count, cycle, islice, chain

print(list(islice(count(10, 5), 4)))         # 10, 15, 20, 25 ...
print(list(islice(cycle("AB"), 5)))          # A B A B A ...
print(list(chain([1, 2], (3, 4), "xy")))     # junta vários iteráveis
print(list(chain.from_iterable([[1], [2, 3]])))  # achata um nível
```

### Combinatória

| Função | O que produz | `"ABC"`, 2 → quantos? |
|---|---|---|
| `product(a, b)` | todas as combinações de um item de cada (como `for` aninhados) | — |
| `permutations(s, r)` | arranjos de `r` itens (a ordem importa) | 6 |
| `combinations(s, r)` | subconjuntos de `r` itens (a ordem não importa) | 3 |

```python
from itertools import product, permutations, combinations

print(list(product("01", repeat=3)))   # todas as sequências binárias de 3 dígitos
print(["".join(p) for p in permutations("ABC", 2)])
print(["".join(c) for c in combinations("ABC", 2)])
times = ["Fla", "Flu", "Vasco", "Bota"]
print(len(list(combinations(times, 2))), "jogos num turno de pontos corridos")
```

### groupby e accumulate

`groupby` agrupa itens **consecutivos** com a mesma chave. Por isso quase sempre se ordena antes pela mesma chave. `accumulate` produz os totais parciais:

```python
from itertools import groupby, accumulate
import operator

palavras = ["banana", "abacate", "amora", "caju", "boldo", "cacau"]
for letra, grupo in groupby(sorted(palavras), key=lambda p: p[0]):
    print(letra, list(grupo))

vendas = [100, 50, 70, 30]
print(list(accumulate(vendas)))                  # soma acumulada
print(list(accumulate(vendas, max)))             # máximo até aqui
print(list(accumulate([1, 2, 3, 4], operator.mul)))  # fatoriais parciais
```

> ⚠️ Sem ordenar, `groupby("aabaa")` gera **três** grupos (`aa`, `b`, `aa`), não dois.

### functools: reduce, partial e cache

```python
from functools import reduce, partial

# reduce "dobra" a lista com uma função de 2 argumentos: ((1*2)*3)*4
print(reduce(lambda a, b: a * b, [1, 2, 3, 4]))

# partial fixa alguns argumentos e devolve uma nova função
binario_para_int = partial(int, base=2)
print(binario_para_int("1011"))
imprimir_csv = partial(print, sep=";")
imprimir_csv("nome", "idade", "cidade")
```

`lru_cache` (e o atalho `cache`, sem limite de tamanho) é um decorador de memoização pronto, bem mais completo que o que escrevemos na lição de decoradores:

```python
from functools import lru_cache, cache

@lru_cache(maxsize=128)
def caminhos(linhas, colunas):
    """Quantos caminhos (só direita/baixo) num grid."""
    if linhas == 1 or colunas == 1:
        return 1
    return caminhos(linhas - 1, colunas) + caminhos(linhas, colunas - 1)

print(caminhos(16, 16))
print(caminhos.cache_info())

@cache
def fat(n):
    return 1 if n <= 1 else n * fat(n - 1)
print(fat(30))
```

> 💡 Só use cache em **funções puras**: as que sempre devolvem o mesmo resultado para os mesmos argumentos e não têm efeitos colaterais. E os argumentos precisam ser *hashable* (nada de listas).

### Exercício
Escreva `agrupar_por_inicial(palavras)` que devolve um dicionário cuja chave é a letra inicial e o valor é a lista das palavras com essa inicial, em ordem alfabética. Use `sorted` + `itertools.groupby`. Exemplo: `["uva", "abacate", "ameixa"]` → `{"a": ["abacate", "ameixa"], "u": ["uva"]}`.

```python inicial
from itertools import groupby

def agrupar_por_inicial(palavras):
    return {p[0]: [p] for p in palavras}
```

```python solucao
from itertools import groupby

def agrupar_por_inicial(palavras):
    ordenadas = sorted(palavras)
    return {letra: list(grupo) for letra, grupo in groupby(ordenadas, key=lambda p: p[0])}
```

```python teste
r = agrupar_por_inicial(["uva", "abacate", "ameixa"])
assert r == {"a": ["abacate", "ameixa"], "u": ["uva"]}, f"resultado inesperado: {r}"
r2 = agrupar_por_inicial(["caju", "banana", "cacau", "boldo", "amora", "abacate"])
assert r2 == {"a": ["abacate", "amora"], "b": ["banana", "boldo"], "c": ["cacau", "caju"]}, f"resultado inesperado: {r2}"
assert agrupar_por_inicial([]) == {}, "lista vazia deveria dar {}"
```

## Type hints avançados
fonte: Documentação oficial do Python (typing)

**Type hints** (dicas de tipo, ou anotações) indicam os tipos esperados de parâmetros, retornos e variáveis. Eles documentam o código, melhoram o autocompletar dos editores e permitem que ferramentas encontrem erros **antes** de executar.

```python
def media(notas: list[float]) -> float:
    return sum(notas) / len(notas)

idades: dict[str, int] = {"Ana": 30, "Rui": 25}
coordenada: tuple[float, float] = (-23.5, -46.6)
tags: set[str] = {"python", "dados"}

print(media([7.0, 8.5]))
print(media.__annotations__)
```

> ⚠️ O Python **não verifica** os tipos em tempo de execução! As anotações são só informação. Quem confere é uma ferramenta separada, como o **mypy** (`pip install mypy` e depois `mypy programa.py`), o Pyright ou o próprio editor (VS Code, PyCharm).

```python
def dobro(x: int) -> int:
    return x * 2

print(dobro("ha"))   # roda sem reclamar: 'haha'. O mypy acusaria o erro.
```

### Tipos opcionais e uniões

- `int | None` (forma antiga: `Optional[int]`): um `int` ou `None`;
- `int | str` (forma antiga: `Union[int, str]`): um `int` ou uma `str`;
- `list[int]` (forma antiga: `List[int]`): lista de inteiros;
- `dict[str, int]` (forma antiga: `Dict[str, int]`): dicionário de `str` para `int`.

As formas antigas vêm do módulo `typing` e ainda aparecem bastante em código existente; prefira as modernas, disponíveis desde o Python 3.10.

```python
def buscar(nomes: list[str], alvo: str) -> int | None:
    """Devolve o índice de alvo, ou None se não existir."""
    for i, n in enumerate(nomes):
        if n == alvo:
            return i
    return None

def formatar(valor: int | float | str) -> str:
    return f"<{valor}>"

print(buscar(["a", "b"], "b"), buscar(["a"], "z"))
print(formatar(3), formatar("x"))
```

### Callable: funções como parâmetro

```python
from collections.abc import Callable

def aplicar(f: Callable[[int, int], int], a: int, b: int) -> int:
    return f(a, b)

print(aplicar(lambda x, y: x + y, 2, 3))
print(aplicar(max, 2, 3))
```

### Genéricos com a sintaxe nova

E se uma função funciona com **qualquer** tipo, mas o tipo de saída depende do tipo de entrada? Usamos uma **variável de tipo**. Desde o Python 3.12, ela é declarada entre colchetes logo após o nome:

```python
def primeiro[T](itens: list[T]) -> T:
    return itens[0]

# Para o mypy: primeiro([1, 2]) é int; primeiro(["a"]) é str.
print(primeiro([1, 2]), primeiro(["a", "b"]))

class Caixa[T]:
    def __init__(self, conteudo: T):
        self.conteudo = conteudo
    def abrir(self) -> T:
        return self.conteudo

print(Caixa(42).abrir())

type Matriz = list[list[float]]     # apelido de tipo (Python 3.12+)
m: Matriz = [[1.0, 2.0]]
print(m)
```

Em códigos mais antigos você verá a forma equivalente com `TypeVar`:

```python
from typing import TypeVar

T = TypeVar("T")

def ultimo(itens: list[T]) -> T:
    return itens[-1]

print(ultimo([1, 2, 3]))
```

### Protocol: "tipagem pato" com tipos

Python é famoso pela *duck typing*: "se anda como pato e grasna como pato, é pato". Um `Protocol` descreve **quais métodos** um objeto precisa ter, sem exigir herança:

```python
from typing import Protocol

class TemArea(Protocol):
    def area(self) -> float: ...

class Quadrado:                    # não herda de TemArea!
    def __init__(self, lado: float):
        self.lado = lado
    def area(self) -> float:
        return self.lado ** 2

class Circulo:
    def __init__(self, r: float):
        self.r = r
    def area(self) -> float:
        return 3.14159 * self.r ** 2

def area_total(formas: list[TemArea]) -> float:
    return sum(f.area() for f in formas)

print(round(area_total([Quadrado(2), Circulo(1)]), 2))
```

Para o mypy, `Quadrado` e `Circulo` "satisfazem" `TemArea` porque têm o método `area`, sem nenhuma relação de herança.

### Exercício
Escreva a função genérica `primeiro_ou_padrao` usando a sintaxe nova `[T]`. Ela recebe `itens: list[T]` e `padrao: T` e devolve o primeiro item, ou `padrao` se a lista estiver vazia. Anote os parâmetros e o retorno (`-> T`).

```python inicial
def primeiro_ou_padrao(itens, padrao):
    return itens[0]
```

```python solucao
def primeiro_ou_padrao[T](itens: list[T], padrao: T) -> T:
    if itens:
        return itens[0]
    return padrao
```

```python teste
assert primeiro_ou_padrao([5, 6], 0) == 5, "primeiro_ou_padrao([5, 6], 0) deveria ser 5"
assert primeiro_ou_padrao([], "vazio") == "vazio", "com lista vazia, deveria devolver o padrão"
anot = primeiro_ou_padrao.__annotations__
assert "return" in anot and "itens" in anot and "padrao" in anot, "anote os parâmetros itens, padrao e o retorno"
params = getattr(primeiro_ou_padrao, "__type_params__", ())
assert len(params) == 1, "use a sintaxe genérica: def primeiro_ou_padrao[T](...)"
assert anot["return"] is params[0], "o retorno deveria ser anotado como T"
```

## Enum, tuplas nomeadas, desempacotamento, walrus e match
fonte: Pense em Python cap. 19.8; Documentação oficial do Python (enum, collections, match)

Esta lição reúne recursos que deixam o código mais claro e seguro no dia a dia.

### Enum: constantes com nome

Em vez de espalhar strings ou números "mágicos" (`status = 2`), um `Enum` cria um conjunto fechado de valores com nome:

```python
from enum import Enum, auto

class Cor(Enum):
    VERMELHO = 1
    VERDE = 2
    AZUL = 3

class Status(Enum):
    PENDENTE = auto()     # auto() numera sozinho
    PAGO = auto()
    CANCELADO = auto()

print(Cor.VERDE, Cor.VERDE.name, Cor.VERDE.value)
print(Cor(3))                 # busca pelo valor
print(Status["PAGO"])         # busca pelo nome
print([s.name for s in Status])
print(Status.PAGO is Status.PAGO, Status.PAGO == 2)  # não é igual ao número!
```

### namedtuple e typing.NamedTuple

Uma **tupla nomeada** é uma tupla (imutável, leve) cujos campos têm nome, então `p.x` em vez de `p[0]`:

```python
from collections import namedtuple
from typing import NamedTuple

Ponto = namedtuple("Ponto", ["x", "y"])
p = Ponto(3, 4)
print(p, p.x, p[1])
x, y = p                       # continua sendo tupla
print(p._replace(x=10))        # imutável: cria uma nova

class Produto(NamedTuple):     # versão com classe e type hints
    nome: str
    preco: float
    qtd: int = 1

item = Produto("Café", 18.9)
print(item, item.preco * item.qtd)
print(item._asdict())
```

> 💡 Quando usar o quê? `NamedTuple` para registros pequenos e imutáveis; `@dataclass` quando precisar de mutabilidade, métodos ou validação mais elaborada.

### Desempacotamento estendido

O `*` num lado esquerdo de atribuição captura "o resto" numa lista:

```python
primeiro, *meio, ultimo = [10, 20, 30, 40, 50]
print(primeiro, meio, ultimo)

cabeca, *cauda = "python"
print(cabeca, cauda)

*_, penultimo, _ = range(10)
print(penultimo)

# Também para montar coleções
a = [1, 2]
b = (3, 4)
print([*a, *b, 5], {**{"x": 1}, "y": 2})
```

### Operador walrus `:=`

O operador `:=` (apelidado de "morsa" por causa do formato `:=`) **atribui e devolve** o valor na mesma expressão. Evita calcular duas vezes ou repetir uma linha antes do `while`:

```python
dados = [3, 8, 1, 9, 4]
if (n := len(dados)) > 3:
    print(f"lista grande: {n} itens")

# Guardar um resultado caro dentro de uma compreensão
import math
raizes = [r for x in dados if (r := math.sqrt(x)) > 2]
print(raizes)

# Consumir uma fila em while
fila = ["a", "b", "c"]
while (item := fila.pop() if fila else None) is not None:
    print("processando", item)
```

### match/case com estruturas

O `match` vai bem além de comparar valores: ele **desmonta** estruturas, testando forma e tipo e capturando partes em variáveis.

```python
def interpretar(comando):
    match comando.split():
        case ["sair"]:
            return "tchau!"
        case ["ir", direcao] if direcao in ("norte", "sul"):
            return f"indo para o {direcao}"
        case ["pegar", *itens]:
            return f"pegou {', '.join(itens)}"
        case _:
            return "comando desconhecido"

for c in ["ir norte", "pegar espada escudo", "sair", "voar"]:
    print(c, "->", interpretar(c))
```

Com **dicionários** (ótimo para dados JSON) e com **classes**:

```python
from dataclasses import dataclass

@dataclass
class Ponto:
    x: float
    y: float

def onde(p):
    match p:
        case Ponto(x=0, y=0):
            return "na origem"
        case Ponto(x=0, y=y):
            return f"no eixo Y, altura {y}"
        case Ponto(x, 0):              # dataclasses aceitam posição
            return f"no eixo X, em {x}"
        case Ponto():
            return "em algum outro lugar"

def evento(e):
    match e:
        case {"tipo": "clique", "x": x, "y": y}:
            return f"clique em ({x}, {y})"
        case {"tipo": "tecla", "tecla": str(t)}:
            return f"tecla {t!r}"
        case _:
            return "evento ignorado"

print(onde(Ponto(0, 0)), "|", onde(Ponto(0, 5)), "|", onde(Ponto(2, 0)), "|", onde(Ponto(1, 1)))
print(evento({"tipo": "clique", "x": 10, "y": 20, "botao": 1}))
print(evento({"tipo": "tecla", "tecla": "q"}))
```

> 💡 Um padrão de dicionário casa mesmo que o dicionário tenha **chaves a mais** (como `"botao"` acima). Já um padrão de lista exige o tamanho exato, a não ser que use `*resto`.

### Exercício
Escreva `processar(evento)` usando `match/case` com padrões de dicionário:

- `{"acao": "somar", "valores": [...]}` → devolve a soma dos valores;
- `{"acao": "saudar", "nome": nome}` (nome é `str`) → devolve `"Olá, <nome>!"`;
- qualquer outra coisa → devolve `None`.

```python inicial
def processar(evento):
    return None
```

```python solucao
def processar(evento):
    match evento:
        case {"acao": "somar", "valores": list(valores)}:
            return sum(valores)
        case {"acao": "saudar", "nome": str(nome)}:
            return f"Olá, {nome}!"
        case _:
            return None
```

```python teste
assert processar({"acao": "somar", "valores": [1, 2, 3]}) == 6, "somar [1, 2, 3] deveria dar 6"
assert processar({"acao": "saudar", "nome": "Lia"}) == "Olá, Lia!", "deveria devolver 'Olá, Lia!'"
assert processar({"acao": "saudar", "nome": "Lia", "extra": 1}) == "Olá, Lia!", "chaves a mais não devem atrapalhar"
assert processar({"acao": "voar"}) is None, "ação desconhecida deveria devolver None"
assert processar({"acao": "saudar", "nome": 42}) is None, "nome que não é str deveria devolver None"
assert processar("texto") is None, "algo que não é dicionário deveria devolver None"
```

## Novidades do Python moderno e asyncio
fonte: Documentação oficial do Python ("O que há de novo" 3.12, 3.13, 3.14; asyncio)

O Python evolui todo ano (uma versão nova a cada outubro). Este app roda o **Python 3.14**. Veja algumas novidades recentes que você vai encontrar em código moderno.

### f-strings mais flexíveis (3.12)

Desde o 3.12, dentro das chaves de uma f-string você pode reutilizar **as mesmas aspas** de fora, quebrar linhas e escrever comentários. Antes isso era erro de sintaxe:

```python
frutas = ["maçã", "uva"]
print(f"Frutas: {", ".join(frutas)}")        # aspas duplas dentro de aspas duplas
precos = {"café": 12.5}
print(f"Café custa R$ {precos["café"]:.2f}")
print(f"Total: {
    sum([1, 2, 3])   # comentários e quebras de linha são permitidos
}")
x = 7
print(f"{x = }, {x * 2 = }")                  # o '=' (do 3.8) mostra a expressão
```

### Mensagens de erro melhores (3.10–3.14)

As mensagens de erro ficaram muito mais úteis. O Python sugere nomes parecidos e aponta exatamente o trecho do problema. No terminal do computador você veria algo assim:

```text
>>> import math
>>> math.sqr(9)
AttributeError: module 'math' has no attribute 'sqr'. Did you mean: 'sqrt'?

>>> lista = [1, 2]
>>> lista.apend(3)
AttributeError: 'list' object has no attribute 'apend'. Did you mean: 'append'?

>>> print("oi"
SyntaxError: '(' was never closed
```

> 💡 "Did you mean" significa "Você quis dizer". Leia sempre a última linha do erro: muitas vezes ela já traz a solução.

### Anotações adiadas (3.14)

No 3.14, as anotações de tipo deixaram de ser avaliadas na hora em que a função é definida: elas só são calculadas quando alguém as consulta. Na prática, você pode citar uma classe que ainda vai ser definida mais abaixo, sem precisar escrever o nome entre aspas:

```python
class No:
    def __init__(self, valor: int, proximo: No | None = None):   # 'No' citado dentro de si mesmo
        self.valor = valor
        self.proximo = proximo

def criar() -> Arvore:       # Arvore ainda nem existe aqui!
    return Arvore()

class Arvore:
    pass

print(type(criar()).__name__, No(1, No(2)).proximo.valor)

import annotationlib
print(annotationlib.get_annotations(criar, format=annotationlib.Format.STRING))
```

### t-strings: template strings (3.14)

Uma **t-string** se parece com uma f-string, mas com `t` no lugar de `f`. A grande diferença: ela **não** monta o texto final. Ela devolve um objeto `Template` com as partes fixas e os valores interpolados **separados**, para que o seu código decida o que fazer com cada valor, por exemplo escapar HTML ou SQL para evitar ataques de injeção.

```python
from string.templatelib import Template, Interpolation

nome = "Ana"
idade = 30
t = t"Olá, {nome}! Você tem {idade} anos."
print(type(t).__name__)
print(t.strings)                       # as partes fixas
print([i.value for i in t.interpolations])       # os valores
print([i.expression for i in t.interpolations])  # o texto das expressões

for parte in t:                        # percorre na ordem: str e Interpolation
    print(repr(parte) if isinstance(parte, str) else f"<valor {parte.value!r}>")
```

Exemplo prático: "escapar" valores perigosos antes de montar HTML:

```python
from string.templatelib import Interpolation
import html

def html_seguro(template):
    partes = []
    for parte in template:
        if isinstance(parte, Interpolation):
            partes.append(html.escape(str(parte.value)))   # só os valores são escapados
        else:
            partes.append(parte)
    return "".join(partes)

comentario = "<script>alert('hack')</script>"
print(html_seguro(t"<p>{comentario}</p>"))
```

### asyncio: concorrência cooperativa

Muitos programas passam a maior parte do tempo **esperando**: uma resposta da rede, um arquivo, o banco de dados. A programação **assíncrona** aproveita essa espera para adiantar outras tarefas, sem threads. As peças:

- `async def` define uma **corrotina**: uma função que pode pausar no meio;
- `await algo` pausa a corrotina atual até `algo` ficar pronto, liberando o processador para outras;
- o **laço de eventos** (*event loop*) do `asyncio` decide quem roda a cada momento.

É uma concorrência **cooperativa**: cada tarefa só cede a vez quando faz `await`. Uma tarefa que nunca dá `await` trava todas as outras.

No computador, um programa típico com `asyncio` fica assim:

```python nao-executar
import asyncio

async def baixar(nome, segundos):
    print(f"começando {nome}")
    await asyncio.sleep(segundos)      # simula esperar a rede
    print(f"terminou {nome}")
    return f"{nome}: ok"

async def main():
    # gather roda as três "ao mesmo tempo": total ~3 s, não 6 s
    resultados = await asyncio.gather(
        baixar("A", 3), baixar("B", 1), baixar("C", 2),
    )
    print(resultados)

asyncio.run(main())
```

> ⚠️ No Python deste app (Pyodide, que roda dentro do navegador), `asyncio.run()` geralmente **não funciona** e gera `RuntimeError`, porque o laço de eventos depende de recursos do navegador. Teste o exemplo acima no computador. Abaixo fazemos um laço de eventos de brinquedo, que roda aqui.

Para entender o mecanismo, podemos "dar corda" nas corrotinas à mão. Uma corrotina é parecida com um gerador: `send(None)` a faz rodar até a próxima pausa:

```python
import types

@types.coroutine
def ceder():
    """Pausa a corrotina e devolve a vez ao 'laço de eventos'."""
    yield

async def tarefa(nome, passos):
    for i in range(1, passos + 1):
        print(f"{nome}: passo {i}")
        await ceder()                  # coopera: deixa outra tarefa rodar
    return f"{nome} concluída"

def mini_laco(*corrotinas):
    fila = list(corrotinas)
    resultados = []
    while fila:
        c = fila.pop(0)
        try:
            c.send(None)               # roda até o próximo await
            fila.append(c)             # volta para o fim da fila
        except StopIteration as fim:   # a corrotina terminou
            resultados.append(fim.value)
    return resultados

print(mini_laco(tarefa("A", 3), tarefa("B", 2)))
```

Repare como A e B se **intercalam**: é exatamente isso que o `asyncio` faz, só que muito mais sofisticado (com temporizadores, rede e tratamento de erros).

| | Threads | asyncio |
|---|---|---|
| Quem troca de tarefa | o sistema operacional, a qualquer momento | a própria tarefa, em cada `await` |
| Bom para | esperar E/S; bibliotecas que bloqueiam | milhares de conexões de rede simultâneas |
| Cuidado | condições de corrida, travas | nunca bloquear o laço (ex.: `time.sleep`) |

### Exercício
Escreva `maiusculas(template)` que recebe uma **t-string** e devolve a string final com **apenas os valores interpolados em MAIÚSCULAS** (as partes fixas ficam como estão). Exemplo: `nome = "ana"`; `maiusculas(t"oi, {nome}!")` → `"oi, ANA!"`.

```python inicial
from string.templatelib import Interpolation

def maiusculas(template):
    return ""
```

```python solucao
from string.templatelib import Interpolation

def maiusculas(template):
    partes = []
    for parte in template:
        if isinstance(parte, Interpolation):
            partes.append(str(parte.value).upper())
        else:
            partes.append(parte)
    return "".join(partes)
```

```python teste
nome = "ana"
cidade = "recife"
assert maiusculas(t"oi, {nome}!") == "oi, ANA!", f"esperava 'oi, ANA!', veio {maiusculas(t'oi, {nome}!')!r}"
assert maiusculas(t"{nome} mora em {cidade}.") == "ANA mora em RECIFE.", "esperava 'ANA mora em RECIFE.'"
n = 3
assert maiusculas(t"tenho {n} gatos") == "tenho 3 gatos", "valores não textuais devem ser convertidos com str()"
assert maiusculas(t"sem valores") == "sem valores", "sem interpolações, o texto fica igual"
```

## Quiz
? O que acontece quando você chama uma função que contém `yield`?
- [ ] O corpo da função é executado até o fim
- [x] Nada do corpo é executado ainda: ela devolve um objeto gerador
- [ ] Ela devolve uma lista com todos os valores
- [ ] Dá erro, pois falta o `return`
> Funções com `yield` são funções geradoras. A chamada só cria o gerador; o corpo roda aos poucos, a cada `next()`.

? Qual método um iterador usa para avisar que acabaram os itens?
- [ ] Devolve `None`
- [ ] Devolve `False`
- [x] Levanta a exceção `StopIteration`
- [ ] Levanta `IndexError`
> O protocolo de iteração usa `StopIteration`. O `for` captura essa exceção e encerra o laço.

? Qual é o valor de `all([])`?
- [x] `True`
- [ ] `False`
- [ ] `None`
- [ ] Dá erro
> `all` só é `False` se encontrar um item falso; numa lista vazia não há nenhum, então o resultado é `True`. Já `any([])` é `False`.

? Para que serve `nonlocal`?
- [ ] Para criar uma variável global
- [x] Para atribuir a uma variável da função que envolve a função atual
- [ ] Para impedir que uma variável seja alterada
- [ ] Para importar uma variável de outro módulo
> Sem `nonlocal`, uma atribuição dentro da função interna cria uma variável local nova (e `total += 1` dá `UnboundLocalError`).

? `@decorador` acima de `def f(): ...` é equivalente a:
- [ ] `decorador = f(decorador)`
- [x] `f = decorador(f)`
- [ ] `f = decorador`
- [ ] `decorador(f())`
> A sintaxe com `@` é só um atalho: a função é passada para o decorador e o nome passa a apontar para o que ele devolveu.

? Por que usar `functools.wraps` ao escrever um decorador?
- [ ] Para deixar a função mais rápida
- [ ] Para permitir argumentos no decorador
- [x] Para preservar o nome, a docstring e outros metadados da função original
- [ ] Porque sem ele o decorador não funciona
> Sem `wraps`, a função decorada passa a se chamar `embrulho` e perde a docstring, o que confunde a depuração e a documentação.

? Num gerenciador de contexto, quando o `__exit__` é chamado?
- [ ] Só quando o bloco termina sem erro
- [ ] Só quando há uma exceção
- [x] Sempre que o bloco termina, com ou sem exceção
- [ ] Apenas se você chamá-lo manualmente
> Essa garantia é o motivo de existir o `with`: a limpeza acontece em qualquer caso.

? Quantos itens produz `itertools.combinations("ABCD", 2)`?
- [ ] 4
- [x] 6
- [ ] 12
- [ ] 16
> Combinações ignoram a ordem: AB, AC, AD, BC, BD, CD. As permutações (onde a ordem importa) seriam 12.

? O que acontece ao executar `def dobro(x: int) -> int: return x * 2` e chamar `dobro("ab")`?
- [ ] `TypeError`, pois o tipo não é int
- [x] Devolve `"abab"`: o Python não verifica as anotações em tempo de execução
- [ ] Devolve `None`
- [ ] Erro de sintaxe
> Type hints são só informação. Ferramentas como o mypy é que apontam o problema, antes de executar.

? Qual é a principal diferença entre uma t-string (`t"..."`) e uma f-string?
- [ ] A t-string é mais rápida
- [ ] A t-string só aceita texto, nunca números
- [x] A t-string devolve um objeto `Template` com partes fixas e valores separados, em vez de uma `str` pronta
- [ ] Não há diferença; é só outra letra
> Isso permite processar os valores (escapar HTML/SQL, traduzir, registrar logs) antes de montar o texto final.
