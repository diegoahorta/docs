# Algoritmos e estruturas de dados
id: m12
nivel: Avançado
icone: 🧠
descricao: Análise de algoritmos e Big-O, busca, ordenação, pilhas e filas, tabelas hash, programação dinâmica, filas de prioridade e grafos.

## O que é um algoritmo e como analisá-lo
fonte: Pense em Python Apêndice B.1

Um **algoritmo** é uma sequência finita de passos bem definidos que resolve um problema. A receita de um bolo é um algoritmo; o procedimento para achar uma palavra no dicionário de papel também. Em programação, quase sempre existem **vários algoritmos** para o mesmo problema, e eles podem ter desempenhos *muito* diferentes.

**Analisar um algoritmo** é estimar quanto ele custa (tempo, memória) conforme a entrada cresce. Medir com cronômetro tem limitações:

- o resultado depende do aparelho, do que mais está rodando e da linguagem;
- depende da entrada específica que você escolheu para testar;
- não diz o que acontece com entradas 100 vezes maiores.

Por isso contamos **operações básicas** (comparações, somas, acessos) em função do **tamanho da entrada**, chamado de `n`.

```python
def soma_lista(nums):
    total = 0            # 1 operação
    for x in nums:       # repete n vezes...
        total += x       # ...1 operação cada
    return total         # total: cerca de n + 2 operações

def tem_par_com_soma(nums, alvo):
    passos = 0
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            passos += 1
            if nums[i] + nums[j] == alvo:
                return True, passos
    return False, passos

print(soma_lista([3, 1, 4]))
for n in [10, 100, 1000]:
    print(n, "itens ->", tem_par_com_soma(list(range(n)), -1)[1], "comparações")
```

Repare: com 10 vezes mais itens, `tem_par_com_soma` faz cerca de **100 vezes** mais comparações. Esse comportamento é o que mais importa.

### Notação Big-O

A **ordem de crescimento** descreve como o custo cresce quando `n` fica grande, ignorando constantes e termos menores. Escrevemos com a **notação Big-O** ("O grande"): `5n² + 3n + 10` é **O(n²)**, porque para `n` grande o termo `n²` domina tudo.

| Ordem | Nome | Exemplo | n = 10 | n = 100 | n = 1000 |
|---|---|---|---|---|---|
| O(1) | constante | acessar `lista[i]`, `chave in dict` | 1 | 1 | 1 |
| O(log n) | logarítmica | busca binária | ~3 | ~7 | ~10 |
| O(n) | linear | percorrer uma lista, `max()` | 10 | 100 | 1.000 |
| O(n log n) | "linearítmica" | `sorted()`, merge sort | ~33 | ~664 | ~9.966 |
| O(n²) | quadrática | dois `for` aninhados, bubble sort | 100 | 10.000 | 1.000.000 |
| O(2ⁿ) | exponencial | testar todos os subconjuntos | 1.024 | ~10³⁰ | ~10³⁰¹ |

> 💡 Um algoritmo O(n²) pode até ganhar de um O(n) para entradas pequenas (por causa das constantes), mas sempre existe um `n` a partir do qual o de menor ordem vence, e de lavada.

```python
import math

print(f"{'n':>6} {'log n':>7} {'n log n':>9} {'n²':>12} {'2^n':>10}")
for n in [10, 20, 30, 1000]:
    exp = f"{2 ** n:.1e}" if n < 1000 else "astronômico"
    print(f"{n:>6} {math.log2(n):>7.1f} {n * math.log2(n):>9.0f} {n * n:>12} {exp:>10}")
```

### Pior caso, caso médio e melhor caso

Em uma busca linear, se o item está na primeira posição, gastamos 1 comparação (melhor caso); se não está na lista, `n` comparações (pior caso). Em geral analisamos o **pior caso**, que é uma garantia, e às vezes o **caso médio**.

### Exercício
Escreva `tem_duplicatas(nums)` que devolve `True` se algum valor aparece mais de uma vez. Em vez de comparar todos os pares (O(n²)), faça em **O(n)**: percorra a lista guardando os valores já vistos num `set`.

```python inicial
def tem_duplicatas(nums):
    return False
```

```python solucao
def tem_duplicatas(nums):
    vistos = set()
    for x in nums:
        if x in vistos:
            return True
        vistos.add(x)
    return False
```

```python teste
assert tem_duplicatas([1, 2, 3, 2]) is True, "[1, 2, 3, 2] tem duplicata"
assert tem_duplicatas([1, 2, 3]) is False, "[1, 2, 3] não tem duplicata"
assert tem_duplicatas([]) is False, "lista vazia não tem duplicata"
assert tem_duplicatas(list(range(50_000)) + [49_999]) is True, "deveria achar a duplicata no fim de uma lista grande"
assert tem_duplicatas(list(range(50_000))) is False, "lista grande sem duplicatas deveria dar False"
```

## Medindo o tempo de execução
fonte: Documentação oficial do Python (time, timeit)

A análise teórica diz como o custo **cresce**; a medição diz quanto tempo leva **na prática**. As duas se complementam.

### time.perf_counter

`time.perf_counter()` devolve um relógio de alta precisão, em segundos. O valor isolado não significa nada; o que importa é a **diferença** entre duas leituras:

```python
import time

inicio = time.perf_counter()
total = sum(i * i for i in range(100_000))
fim = time.perf_counter()
print(f"resultado {total}, levou {(fim - inicio) * 1000:.2f} ms")
```

> ⚠️ Os tempos mostrados neste app **variam** a cada execução e de aparelho para aparelho, e o Python no navegador é mais lento que no computador. Compare sempre **proporções** ("10 vezes mais rápido"), não números absolutos.

### timeit: medições mais confiáveis

Uma única medição é sujeita a ruído. O módulo `timeit` executa o código muitas vezes e mede o total:

```python
import timeit

t1 = timeit.timeit("sum(range(1000))", number=200)
t2 = timeit.timeit("s = 0\nfor i in range(1000): s += i", number=200)
print(f"sum(range):  {t1 * 1000:.2f} ms")
print(f"laço manual: {t2 * 1000:.2f} ms")
print("sum() venceu" if t1 < t2 else "o laço venceu (raro!)")
```

`timeit.repeat` repete a medição várias vezes; usar o **menor** valor é o costume, pois ele sofre menos interferência:

```python
import timeit

dados = list(range(2000))
conj = set(dados)
tempos_lista = timeit.repeat(lambda: 1999 in dados, number=300, repeat=3)
tempos_set = timeit.repeat(lambda: 1999 in conj, number=300, repeat=3)
print(f"'in' na lista: {min(tempos_lista) * 1000:.3f} ms")
print(f"'in' no set:   {min(tempos_set) * 1000:.3f} ms")
```

### Verificando a ordem de crescimento na prática

Um bom teste: dobre o tamanho da entrada e veja quanto o tempo aumenta. Em um O(n), o tempo dobra; em um O(n²), quadruplica.

```python
import time

def quadratico(n):
    c = 0
    for i in range(n):
        for j in range(n):
            c += 1
    return c

anterior = None
for n in [100, 200, 400]:
    t0 = time.perf_counter()
    quadratico(n)
    t = time.perf_counter() - t0
    razao = f"  ({t / anterior:.1f}x o anterior)" if anterior else ""
    print(f"n={n}: {t * 1000:.1f} ms{razao}")
    anterior = t
```

> 💡 Com o dobro de `n`, o tempo deve ficar perto de **4x** o anterior: assinatura de um algoritmo O(n²).

### Exercício
Escreva `cronometrar(func, *args)` que executa `func(*args)` e devolve uma **tupla** `(resultado, segundos)`, onde `segundos` é o tempo gasto (um `float`), medido com `time.perf_counter`.

```python inicial
import time

def cronometrar(func, *args):
    return func(*args)
```

```python solucao
import time

def cronometrar(func, *args):
    inicio = time.perf_counter()
    resultado = func(*args)
    return resultado, time.perf_counter() - inicio
```

```python teste
r = cronometrar(sum, [1, 2, 3])
assert isinstance(r, tuple) and len(r) == 2, "cronometrar deveria devolver uma tupla (resultado, segundos)"
assert r[0] == 6, "o primeiro item deveria ser o resultado da função (sum([1, 2, 3]) == 6)"
assert isinstance(r[1], float) and r[1] >= 0, "o segundo item deveria ser o tempo em segundos (float >= 0)"
assert cronometrar(max, 4, 9, 2)[0] == 9, "os argumentos extras devem ser repassados para a função"
import time as _t
_, s = cronometrar(_t.sleep, 0.05)
assert 0.04 <= s < 2, f"para time.sleep(0.05), o tempo medido deveria ser ~0.05 s, mas foi {s}"
```

## O custo das operações em list, dict e set
fonte: Pense em Python Apêndice B.2 e B.4; Documentação oficial do Python (TimeComplexity)

Para analisar seus programas, você precisa saber quanto custam as operações das estruturas que usa. Uma linha "inocente" como `if x in lista` dentro de um laço pode transformar um algoritmo O(n) em O(n²).

| Operação | `list` | `dict` | `set` |
|---|---|---|---|
| acessar por índice/chave: `l[i]`, `d[k]` | O(1) | O(1)¹ | — |
| `x in ...` | **O(n)** | O(1)¹ | O(1)¹ |
| adicionar no fim: `append`, `d[k] = v`, `add` | O(1)² | O(1)¹ | O(1)¹ |
| inserir/remover no **início**: `insert(0, x)`, `pop(0)` | **O(n)** | — | — |
| remover do fim: `pop()` | O(1) | — | — |
| remover por chave/valor: `remove(x)`, `del d[k]`, `discard` | O(n) | O(1)¹ | O(1)¹ |
| `len(...)` | O(1) | O(1) | O(1) |
| ordenar: `sort()` / `sorted()` | O(n log n) | — | — |
| fatiar `l[a:b]` / copiar | O(b − a) / O(n) | O(n) | O(n) |
| `min`, `max`, `sum` | O(n) | O(n) | O(n) |

¹ em média (caso médio de uma tabela hash). ² "amortizado": de vez em quando a lista precisa crescer e copia tudo, mas na média cada `append` sai O(1).

Veja a diferença de `in` na prática:

```python
import time

n = 20_000
lista = list(range(n))
conjunto = set(lista)
procurados = range(n - 200, n)   # 200 buscas, todas perto do fim

t0 = time.perf_counter()
achados = sum(1 for x in procurados if x in lista)
t_lista = time.perf_counter() - t0

t0 = time.perf_counter()
achados2 = sum(1 for x in procurados if x in conjunto)
t_set = time.perf_counter() - t0

print(achados, achados2)
print(f"lista: {t_lista * 1000:.2f} ms | set: {t_set * 1000:.2f} ms")
print(f"o set foi ~{t_lista / t_set:.0f}x mais rápido (varia)")
```

### Strings e concatenação

Strings são imutáveis: `s = s + "x"` cria uma string **nova** a cada vez, copiando tudo. Num laço, isso pode virar O(n²). O jeito idiomático é juntar as partes numa lista e usar `"".join()` no final, que é O(n):

```python
partes = []
for i in range(5):
    partes.append(str(i))
print("-".join(partes))
```

> 💡 Regra de ouro: se você faz muitas buscas `x in colecao`, converta a coleção para `set` (ou use um `dict`) **uma vez** antes do laço.

### Exercício
Escreva `comuns(a, b)` que devolve uma lista com os elementos de `a` que também estão em `b`, **na ordem em que aparecem em `a`** (podem se repetir). Para ser eficiente, converta `b` para `set` antes de percorrer `a`, deixando o algoritmo O(n + m) em vez de O(n · m).

```python inicial
def comuns(a, b):
    return []
```

```python solucao
def comuns(a, b):
    em_b = set(b)
    return [x for x in a if x in em_b]
```

```python teste
assert comuns([1, 2, 3, 4], [4, 2, 9]) == [2, 4], "comuns([1, 2, 3, 4], [4, 2, 9]) deveria ser [2, 4]"
assert comuns(["a", "b", "a"], ["a"]) == ["a", "a"], "repetições de a que estão em b devem ser mantidas"
assert comuns([], [1]) == [] and comuns([1], []) == [], "com uma lista vazia, o resultado é []"
grande = list(range(30_000))
r = comuns(grande, list(range(29_990, 40_000)))
assert r == list(range(29_990, 30_000)), "resultado errado para listas grandes"
```

## Busca linear e busca binária
fonte: Pense em Python Apêndice B.3; Documentação oficial do Python (bisect)

### Busca linear: O(n)

A forma mais simples de procurar: olhar item por item. Funciona em qualquer lista, ordenada ou não.

```python
def busca_linear(lista, alvo):
    for i, valor in enumerate(lista):
        if valor == alvo:
            return i
    return -1

nomes = ["Caio", "Ana", "Bia", "Duda"]
print(busca_linear(nomes, "Bia"), busca_linear(nomes, "Zeca"))
```

É isso que fazem `x in lista` e `lista.index(x)`.

### Busca binária: O(log n)

Se a lista está **ordenada**, dá para fazer muito melhor, como quando você procura uma palavra no dicionário de papel: abra no meio; se a palavra vem antes, descarte a metade de cima; se vem depois, a de baixo. Repita.

A cada passo, metade dos candidatos é eliminada. Com 1.000.000 de itens bastam cerca de **20 passos** (2²⁰ ≈ 1 milhão).

```python
def busca_binaria(lista, alvo):
    ini, fim = 0, len(lista) - 1
    passo = 0
    while ini <= fim:
        meio = (ini + fim) // 2
        passo += 1
        print(f"  passo {passo}: olhando posição {meio} (valor {lista[meio]})")
        if lista[meio] == alvo:
            return meio
        elif lista[meio] < alvo:
            ini = meio + 1      # o alvo está na metade da direita
        else:
            fim = meio - 1      # o alvo está na metade da esquerda
    return -1

dados = list(range(0, 1000, 3))   # 334 números ordenados
print("achou na posição", busca_binaria(dados, 600))
print("achou na posição", busca_binaria(dados, 601))
```

> ⚠️ Busca binária numa lista **desordenada** dá respostas erradas sem avisar. Ordenar custa O(n log n), então só compensa se você for fazer muitas buscas na mesma lista.

### O módulo bisect

O Python já traz a busca binária pronta no módulo `bisect`:

- `bisect_left(lista, x)`: a posição onde `x` deveria entrar para manter a ordem (antes de valores iguais);
- `bisect_right(lista, x)`: idem, mas depois dos valores iguais;
- `insort(lista, x)`: insere mantendo a ordem.

```python
import bisect

notas = [10, 20, 20, 30, 40]
print(bisect.bisect_left(notas, 20), bisect.bisect_right(notas, 20))

def contem(lista_ordenada, x):
    i = bisect.bisect_left(lista_ordenada, x)
    return i < len(lista_ordenada) and lista_ordenada[i] == x

print(contem(notas, 30), contem(notas, 35))
bisect.insort(notas, 25)
print(notas)

# Uso clássico: converter pontuação em conceito
def conceito(nota, cortes=[60, 70, 80, 90], letras="EDCBA"):
    return letras[bisect.bisect_right(cortes, nota)]

print([conceito(n) for n in [33, 60, 75, 89, 90, 100]])
```

### Exercício
Implemente `busca_binaria(seq, alvo)` que devolve o índice de `alvo` na sequência **ordenada** `seq`, ou `-1` se não estiver lá. Use **apenas** `len(seq)` e indexação `seq[i]` (o teste usa uma sequência especial que conta os acessos e não tem `index` nem `in`). Para 100.000 itens, seu algoritmo deve fazer no máximo cerca de 20 acessos.

```python inicial
def busca_binaria(seq, alvo):
    return -1
```

```python solucao
def busca_binaria(seq, alvo):
    ini, fim = 0, len(seq) - 1
    while ini <= fim:
        meio = (ini + fim) // 2
        v = seq[meio]
        if v == alvo:
            return meio
        if v < alvo:
            ini = meio + 1
        else:
            fim = meio - 1
    return -1
```

```python teste
class SeqContada:
    def __init__(self, dados):
        self._d = dados
        self.acessos = 0
    def __len__(self):
        return len(self._d)
    def __getitem__(self, i):
        self.acessos += 1
        return self._d[i]

s = SeqContada([2, 5, 8, 12, 16, 23, 38, 56, 72, 91])
assert busca_binaria(s, 23) == 5, "23 está na posição 5"
assert busca_binaria(s, 2) == 0, "2 está na posição 0"
assert busca_binaria(s, 91) == 9, "91 está na posição 9"
assert busca_binaria(s, 7) == -1, "7 não está na lista: deveria devolver -1"
assert busca_binaria(SeqContada([]), 1) == -1, "sequência vazia deveria devolver -1"
g = SeqContada(list(range(0, 200_000, 2)))
assert busca_binaria(g, 123_456) == 61_728, "123456 deveria estar na posição 61728"
assert g.acessos <= 25, f"busca binária deveria fazer ~17 acessos, mas fez {g.acessos}"
g2 = SeqContada(list(range(0, 200_000, 2)))
assert busca_binaria(g2, 123_457) == -1 and g2.acessos <= 25, "valor ausente: -1, com poucos acessos"
```

## Ordenação simples: bubble, selection e insertion sort
fonte: Documentação oficial do Python (Sorting HOWTO); material clássico de algoritmos

Na prática você vai usar `sorted()`. Mas implementar ordenações simples é o melhor treino de raciocínio algorítmico, e ajuda a entender por que os algoritmos eficientes são eficientes. Os três abaixo são **O(n²)**.

### Bubble sort (ordenação por bolha)

Percorre a lista comparando vizinhos e trocando os que estão fora de ordem. A cada passada, o maior valor restante "flutua" para o fim, como uma bolha:

```python
def bubble_sort(lista):
    v = lista[:]                      # trabalha numa cópia
    n = len(v)
    for passada in range(n - 1):
        trocou = False
        for i in range(n - 1 - passada):
            if v[i] > v[i + 1]:
                v[i], v[i + 1] = v[i + 1], v[i]
                trocou = True
        print(f"passada {passada + 1}: {v}")
        if not trocou:                # já está ordenada: pode parar
            break
    return v

print(bubble_sort([5, 1, 4, 2, 8]))
```

### Selection sort (ordenação por seleção)

Encontra o **menor** item da parte não ordenada e o coloca na posição certa. Faz sempre ~n²/2 comparações, mas no máximo n − 1 trocas:

```python
def selection_sort(lista):
    v = lista[:]
    n = len(v)
    for i in range(n - 1):
        pos_menor = i
        for j in range(i + 1, n):
            if v[j] < v[pos_menor]:
                pos_menor = j
        v[i], v[pos_menor] = v[pos_menor], v[i]
        print(f"i={i}: menor era {v[i]} -> {v}")
    return v

print(selection_sort([29, 10, 14, 37, 13]))
```

### Insertion sort (ordenação por inserção)

É como organizar cartas na mão: pega a próxima carta e a desliza para a esquerda até achar o lugar dela. Em listas **quase ordenadas** é muito rápido (perto de O(n)), por isso é usado como peça de algoritmos profissionais, como o Timsort:

```python
def insertion_sort(lista):
    v = lista[:]
    for i in range(1, len(v)):
        atual = v[i]
        j = i - 1
        while j >= 0 and v[j] > atual:
            v[j + 1] = v[j]        # empurra para a direita
            j -= 1
        v[j + 1] = atual
        print(f"inseri {atual}: {v}")
    return v

print(insertion_sort([7, 3, 5, 1]))
```

| Algoritmo | Pior caso | Melhor caso | Estável? | Observação |
|---|---|---|---|---|
| Bubble sort | O(n²) | O(n) com parada antecipada | sim | didático; quase nunca usado |
| Selection sort | O(n²) | O(n²) | não | poucas trocas |
| Insertion sort | O(n²) | O(n) | sim | ótimo para listas pequenas ou quase ordenadas |

> 💡 **Estável** significa que itens "empatados" mantêm a ordem original entre si. Isso importa quando você ordena por um critério e quer preservar uma ordenação anterior (veja a próxima lição).

### Exercício
Implemente `ordenar_insercao(lista)` que ordena a lista **no próprio lugar** (modificando-a, sem criar outra) usando insertion sort, e devolve `None`. Não use `sort()` nem `sorted()`.

```python inicial
def ordenar_insercao(lista):
    pass
```

```python solucao
def ordenar_insercao(lista):
    for i in range(1, len(lista)):
        atual = lista[i]
        j = i - 1
        while j >= 0 and lista[j] > atual:
            lista[j + 1] = lista[j]
            j -= 1
        lista[j + 1] = atual
```

```python teste
import random
x = [5, 2, 9, 1, 5, 6]
r = ordenar_insercao(x)
assert r is None, "a função deve ordenar no lugar e devolver None"
assert x == [1, 2, 5, 5, 6, 9], f"a lista deveria virar [1, 2, 5, 5, 6, 9], mas ficou {x}"
vazia = []
ordenar_insercao(vazia)
assert vazia == [], "lista vazia continua vazia"
rnd = random.Random(7)
for _ in range(20):
    dados = [rnd.randint(-50, 50) for _ in range(rnd.randint(0, 30))]
    esperado = sorted(dados)
    ordenar_insercao(dados)
    assert dados == esperado, f"não ordenou corretamente: {dados}"
```

## Ordenação eficiente: merge sort, quick sort e sorted()
fonte: Documentação oficial do Python (Sorting HOWTO)

Para ordenar em **O(n log n)** usamos a estratégia **dividir para conquistar**: quebrar o problema em pedaços menores, resolver cada um (recursivamente) e combinar as respostas.

### Merge sort (ordenação por intercalação)

1. Divida a lista ao meio.
2. Ordene cada metade (recursivamente).
3. **Intercale** as duas metades ordenadas numa só.

```python
def intercalar(a, b):
    """Junta duas listas ordenadas numa lista ordenada: O(len(a) + len(b))."""
    resultado = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:          # '<=' mantém a ordenação estável
            resultado.append(a[i]); i += 1
        else:
            resultado.append(b[j]); j += 1
    resultado.extend(a[i:])       # sobras de uma das listas
    resultado.extend(b[j:])
    return resultado

def merge_sort(lista, nivel=0):
    if len(lista) <= 1:           # caso base: já está ordenada
        return lista
    meio = len(lista) // 2
    esq = merge_sort(lista[:meio], nivel + 1)
    dir = merge_sort(lista[meio:], nivel + 1)
    junto = intercalar(esq, dir)
    print("  " * nivel + f"{esq} + {dir} -> {junto}")
    return junto

print(merge_sort([38, 27, 43, 3, 9, 82, 10]))
```

Por que O(n log n)? A lista é dividida ao meio cerca de **log₂ n** vezes (níveis), e em cada nível intercalar tudo custa **n** operações.

### Quick sort

Escolhe um **pivô**, separa os menores à esquerda e os maiores à direita, e ordena cada lado recursivamente. Em média é O(n log n); no pior caso (pivô sempre ruim) vira O(n²).

```python
import random

def quick_sort(lista):
    if len(lista) <= 1:
        return lista
    pivo = random.choice(lista)       # pivô aleatório evita o pior caso típico
    menores = [x for x in lista if x < pivo]
    iguais = [x for x in lista if x == pivo]
    maiores = [x for x in lista if x > pivo]
    return quick_sort(menores) + iguais + quick_sort(maiores)

print(quick_sort([3, 6, 8, 10, 1, 2, 1]))
```

### Por que usar sorted()

O `sorted()` e o `list.sort()` usam o **Timsort**, um algoritmo híbrido (merge sort + insertion sort) criado para o próprio Python. Ele é O(n log n) no pior caso, aproveita trechos já ordenados (ficando perto de O(n) em dados quase ordenados), é **estável** e é escrito em C. Compare:

```python
import random, time

dados = [random.random() for _ in range(3000)]

def intercalar(a, b):
    r, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]: r.append(a[i]); i += 1
        else: r.append(b[j]); j += 1
    return r + a[i:] + b[j:]

def merge_sort(v):
    if len(v) <= 1: return v
    m = len(v) // 2
    return intercalar(merge_sort(v[:m]), merge_sort(v[m:]))

t0 = time.perf_counter(); a = merge_sort(dados); t1 = time.perf_counter()
b = sorted(dados); t2 = time.perf_counter()
print(a == b)
print(f"merge sort em Python: {(t1 - t0) * 1000:.1f} ms | sorted(): {(t2 - t1) * 1000:.2f} ms")
```

### key, reverse e estabilidade

O parâmetro `key` recebe uma função que extrai o critério de comparação; `reverse=True` inverte a ordem. Graças à estabilidade, dá para ordenar por vários critérios **em etapas**: primeiro pelo secundário, depois pelo principal.

```python
alunos = [("Rui", 8), ("Ana", 9), ("Bia", 8), ("Caio", 7), ("Duda", 9)]

print(sorted(alunos, key=lambda a: a[1], reverse=True))
# Empatados (Ana/Duda, Rui/Bia) mantêm a ordem original: isso é estabilidade.

# Nota decrescente e, no empate, nome em ordem alfabética:
por_nome = sorted(alunos, key=lambda a: a[0])
print(sorted(por_nome, key=lambda a: a[1], reverse=True))
# Mesma coisa em uma etapa, com uma tupla como chave:
print(sorted(alunos, key=lambda a: (-a[1], a[0])))

print(sorted(["banana", "Abacate", "cereja"], key=str.lower))
```

### Exercício
Escreva `intercalar(a, b)`: recebe duas listas **já ordenadas** e devolve uma nova lista ordenada com todos os elementos das duas, em O(len(a) + len(b)), sem usar `sort`/`sorted`. Depois, use-a para escrever `merge_sort(lista)`.

```python inicial
def intercalar(a, b):
    return a + b

def merge_sort(lista):
    return lista
```

```python solucao
def intercalar(a, b):
    r = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            r.append(a[i])
            i += 1
        else:
            r.append(b[j])
            j += 1
    r.extend(a[i:])
    r.extend(b[j:])
    return r

def merge_sort(lista):
    if len(lista) <= 1:
        return lista[:]
    meio = len(lista) // 2
    return intercalar(merge_sort(lista[:meio]), merge_sort(lista[meio:]))
```

```python teste
import random
assert intercalar([1, 4, 9], [2, 3, 10, 11]) == [1, 2, 3, 4, 9, 10, 11], "intercalar([1, 4, 9], [2, 3, 10, 11]) errado"
assert intercalar([], [1, 2]) == [1, 2] and intercalar([3], []) == [3], "listas vazias devem funcionar"
assert intercalar([1, 1], [1]) == [1, 1, 1], "valores repetidos devem ser mantidos"
rnd = random.Random(3)
for _ in range(15):
    d = [rnd.randint(0, 100) for _ in range(rnd.randint(0, 40))]
    original = d[:]
    assert merge_sort(d) == sorted(original), f"merge_sort não ordenou corretamente {original}"
    assert d == original, "merge_sort não deve modificar a lista original"
```

## Pilhas e filas
fonte: Documentação oficial do Python (estruturas de dados, collections.deque)

Duas estruturas simples aparecem em todo lugar: no botão "desfazer" do editor, no histórico do navegador, na fila de impressão, no próprio interpretador Python.

| Estrutura | Regra | Operações | Em Python |
|---|---|---|---|
| **Pilha** (*stack*) | LIFO: o último a entrar é o primeiro a sair | empilhar (*push*), desempilhar (*pop*), topo | `list` com `append()` e `pop()` |
| **Fila** (*queue*) | FIFO: o primeiro a entrar é o primeiro a sair | enfileirar, desenfileirar | `collections.deque` com `append()` e `popleft()` |

### Pilha com list

`append` e `pop()` (sem argumento) mexem no **fim** da lista, ambos O(1):

```python
historico = []
for pagina in ["inicio", "noticias", "esportes"]:
    historico.append(pagina)          # push
    print("visitou", pagina, "->", historico)

print("topo:", historico[-1])
print("voltar:", historico.pop())     # pop
print("voltar:", historico.pop())
print("restou:", historico)
```

### Fila com deque

Usar `lista.pop(0)` como fila funciona, mas é **O(n)**: todos os itens precisam ser deslocados uma posição. O `deque` (*double-ended queue*) insere e remove nas **duas pontas** em O(1):

```python
from collections import deque

fila = deque()
for cliente in ["Ana", "Bruno", "Carla"]:
    fila.append(cliente)
print("fila:", list(fila))

while fila:
    print("atendendo", fila.popleft(), "| ainda esperando:", list(fila))

ultimos = deque(maxlen=3)            # guarda só os 3 mais recentes
for n in range(1, 7):
    ultimos.append(n)
print(ultimos)
```

```python
from collections import deque
import time

n = 60_000
lista = list(range(n))
t0 = time.perf_counter()
while lista:
    lista.pop(0)
t_lista = time.perf_counter() - t0

d = deque(range(n))
t0 = time.perf_counter()
while d:
    d.popleft()
t_deque = time.perf_counter() - t0
print(f"list.pop(0): {t_lista * 1000:.1f} ms | deque.popleft(): {t_deque * 1000:.1f} ms")
```

### Aplicação clássica: parênteses balanceados

Para conferir se `([]{})` está bem formado: ao ver um símbolo de abertura, empilhe; ao ver um de fechamento, o topo da pilha precisa ser o par correspondente. No final, a pilha deve estar vazia. Editores e compiladores fazem isso o tempo todo.

```python
def rastrear(expr):
    pilha = []
    pares = {")": "(", "]": "["}
    for c in expr:
        if c in "([":
            pilha.append(c)
        elif c in ")]":
            topo = pilha.pop() if pilha else None
            print(f"fechou {c!r}, topo era {topo!r}")
            if topo != pares[c]:
                return False
    return not pilha

print(rastrear("(a[1] + (b))"))
print(rastrear("(]"))
```

### Exercício
Escreva `balanceado(texto)` que devolve `True` se todos os `()`, `[]` e `{}` do texto estiverem corretamente abertos, fechados e aninhados (outros caracteres são ignorados). Use uma pilha.

```python inicial
def balanceado(texto):
    return texto.count("(") == texto.count(")")
```

```python solucao
def balanceado(texto):
    pares = {")": "(", "]": "[", "}": "{"}
    pilha = []
    for c in texto:
        if c in "([{":
            pilha.append(c)
        elif c in pares:
            if not pilha or pilha.pop() != pares[c]:
                return False
    return not pilha
```

```python teste
casos = {
    "": True, "()": True, "([]{})": True, "f(x[0], {'a': (1)})": True,
    "(": False, ")(": False, "(]": False, "([)]": False, "{[}": False, "())": False,
    "[[[]]]": True, "texto sem símbolos": True,
}
for entrada, esperado in casos.items():
    r = balanceado(entrada)
    assert r is esperado, f"balanceado({entrada!r}) deveria ser {esperado}, mas deu {r}"
```

## Hashing e tabelas hash
fonte: Pense em Python Apêndice B.4; Documentação oficial do Python (hash, dict)

Como um `dict` consegue achar uma chave entre milhões em tempo **constante**, sem olhar uma por uma? A resposta é a **tabela hash**.

### A função hash

Uma **função hash** transforma um valor num número inteiro. Ela precisa ser **determinística** (o mesmo valor sempre dá o mesmo número durante a execução) e espalhar bem valores diferentes:

```python
print(hash(42), hash(42))
print(hash("python") == hash("python"))
print(hash((1, 2)))
print(hash("python") % 8)        # transformado numa posição de 0 a 7
```

> 💡 O hash de strings muda **a cada vez** que o Python é iniciado (por segurança), por isso os números que você vê aqui variam. Dentro de uma mesma execução, eles são sempre iguais.

Só objetos **imutáveis** (hashable) podem ser chaves de `dict` ou itens de `set`. Se uma lista pudesse ser chave e você a alterasse, o hash mudaria e a chave ficaria "perdida" na posição errada:

```python erro
d = {}
d[[1, 2]] = "lista como chave"
```

### Como funciona: baldes

A ideia: ter uma lista de **baldes** (*buckets*). Para guardar o par `(chave, valor)`, calcule `hash(chave) % numero_de_baldes` para escolher o balde e coloque o par lá. Para buscar, calcule o mesmo índice e procure **só naquele balde**.

Quando duas chaves caem no mesmo balde temos uma **colisão**; por isso cada balde é uma pequena lista. Se os baldes ficarem pequenos (poucos itens cada), cada busca é O(1) em média. Para garantir isso, quando a tabela fica cheia demais, ela **cresce** (dobra o número de baldes) e redistribui tudo.

```python
class MapaHash:
    def __init__(self, n_baldes=4):
        self.baldes = [[] for _ in range(n_baldes)]
        self.tamanho = 0

    def _balde(self, chave):
        return self.baldes[hash(chave) % len(self.baldes)]

    def colocar(self, chave, valor):
        balde = self._balde(chave)
        for i, (k, _) in enumerate(balde):
            if k == chave:
                balde[i] = (chave, valor)    # chave já existe: atualiza
                return
        balde.append((chave, valor))
        self.tamanho += 1
        if self.tamanho > 2 * len(self.baldes):   # muito cheio? cresce
            self._crescer()

    def obter(self, chave):
        for k, v in self._balde(chave):
            if k == chave:
                return v
        raise KeyError(chave)

    def _crescer(self):
        antigos = [par for balde in self.baldes for par in balde]
        self.baldes = [[] for _ in range(2 * len(self.baldes))]
        self.tamanho = 0
        for k, v in antigos:
            self.colocar(k, v)

m = MapaHash()
for i, fruta in enumerate(["uva", "pera", "kiwi", "caju", "figo", "lima", "coco", "manga", "amora", "cacau"]):
    m.colocar(fruta, i)
print("baldes:", len(m.baldes), "| itens:", m.tamanho)
print("maior balde:", max(len(b) for b in m.baldes), "itens")
print(m.obter("manga"), m.obter("uva"))
```

O `dict` de verdade usa uma técnica um pouco diferente (*endereçamento aberto*, sem listas), escrita em C e muito otimizada, mas a ideia é a mesma: o hash diz **onde procurar**.

### Hash e igualdade em classes próprias

Se você define `__eq__` numa classe, deve definir `__hash__` de forma coerente: objetos iguais **precisam** ter o mesmo hash. (Uma `@dataclass(frozen=True)` faz isso por você.)

```python
class Ponto:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __eq__(self, outro):
        return (self.x, self.y) == (outro.x, outro.y)
    def __hash__(self):
        return hash((self.x, self.y))   # baseado nos mesmos campos do __eq__

visitados = {Ponto(1, 2), Ponto(1, 2), Ponto(3, 4)}
print(len(visitados), Ponto(3, 4) in visitados)
```

### Exercício
Complete a classe `MapaSimples`, uma tabela hash com 8 baldes (listas de pares `(chave, valor)`):

- `colocar(chave, valor)`: insere ou **atualiza** a chave no balde `hash(chave) % 8`;
- `obter(chave, padrao=None)`: devolve o valor, ou `padrao` se a chave não existir;
- `__len__`: devolve quantas chaves **distintas** existem.

```python inicial
class MapaSimples:
    def __init__(self):
        self.baldes = [[] for _ in range(8)]

    def colocar(self, chave, valor):
        pass

    def obter(self, chave, padrao=None):
        return padrao

    def __len__(self):
        return 0
```

```python solucao
class MapaSimples:
    def __init__(self):
        self.baldes = [[] for _ in range(8)]

    def _balde(self, chave):
        return self.baldes[hash(chave) % 8]

    def colocar(self, chave, valor):
        balde = self._balde(chave)
        for i, (k, _) in enumerate(balde):
            if k == chave:
                balde[i] = (chave, valor)
                return
        balde.append((chave, valor))

    def obter(self, chave, padrao=None):
        for k, v in self._balde(chave):
            if k == chave:
                return v
        return padrao

    def __len__(self):
        return sum(len(b) for b in self.baldes)
```

```python teste
m = MapaSimples()
m.colocar("a", 1)
m.colocar("b", 2)
assert m.obter("a") == 1 and m.obter("b") == 2, "obter deveria devolver os valores colocados"
m.colocar("a", 10)
assert m.obter("a") == 10, "colocar com chave existente deveria ATUALIZAR o valor"
assert len(m) == 2, f"deveria haver 2 chaves distintas, mas len deu {len(m)}"
assert m.obter("zzz") is None and m.obter("zzz", 0) == 0, "chave ausente deveria devolver o padrão"
for i in range(100):
    m.colocar(i, i * i)
assert len(m) == 102, "depois de 100 chaves novas, len deveria ser 102"
assert all(m.obter(i) == i * i for i in range(100)), "todas as chaves inteiras deveriam ser encontradas"
assert m.obter(8) == 64 and m.obter(16) == 256, "chaves que colidem (mesmo balde) devem funcionar"
assert sum(len(b) for b in m.baldes) == 102, "os pares devem ficar guardados nos baldes"
assert all(hash(k) % 8 == i for i, b in enumerate(m.baldes) for k, _ in b), "cada chave deve estar no balde hash(chave) % 8"
```

## Recursão, iteração e programação dinâmica
fonte: Pense em Python cap. 5, 6 e 11.6; Documentação oficial do Python (functools)

Todo algoritmo recursivo pode ser escrito de forma iterativa (com laços) e vice-versa. A recursão costuma ser mais **natural** para problemas que se dividem em subproblemas parecidos (árvores, dividir para conquistar); a iteração costuma ser mais **econômica** (sem custo de chamadas e sem limite de profundidade).

```python
def fatorial_rec(n):
    return 1 if n <= 1 else n * fatorial_rec(n - 1)

def fatorial_it(n):
    r = 1
    for i in range(2, n + 1):
        r *= i
    return r

print(fatorial_rec(10), fatorial_it(10))
import sys
print("limite de recursão:", sys.getrecursionlimit())
```

> ⚠️ Cada chamada recursiva ocupa memória na **pilha de chamadas**. Ao passar do limite, o Python levanta `RecursionError`. Para entradas grandes, prefira a versão iterativa.

### O problema da recursão ingênua

O Fibonacci recursivo "direto da definição" é elegante e **terrivelmente lento**: ele recalcula os mesmos valores muitas e muitas vezes. É **O(2ⁿ)**!

```python
chamadas = 0

def fib(n):
    global chamadas
    chamadas += 1
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

for n in [10, 15, 20]:
    chamadas = 0
    print(f"fib({n}) = {fib(n)} com {chamadas} chamadas")
```

### Programação dinâmica

**Programação dinâmica** (PD) é a técnica de resolver um problema combinando soluções de subproblemas que **se repetem**, guardando cada resposta para nunca calculá-la duas vezes. Há duas formas:

1. **De cima para baixo (memoização)**: a recursão normal + um cache.
2. **De baixo para cima (tabulação)**: preencher uma tabela dos casos pequenos para os grandes, com laços.

```python
from functools import cache

@cache                         # 1) memoização: cada fib(k) é calculado uma vez
def fib_memo(n):
    return n if n < 2 else fib_memo(n - 1) + fib_memo(n - 2)

def fib_tab(n):                # 2) tabulação: só laços, O(n) e sem recursão
    if n < 2:
        return n
    anterior, atual = 0, 1
    for _ in range(n - 1):
        anterior, atual = atual, anterior + atual
    return atual

print(fib_memo(90))
print(fib_tab(90))
print(fib_tab(1000) % 1_000_000)   # n grande: sem RecursionError
```

### Exemplo: troco com o menor número de moedas

Com moedas de 1, 3 e 4, qual o menor número de moedas para dar troco de 6? A estratégia "gulosa" (pegar sempre a maior moeda) dá 4 + 1 + 1 = **3 moedas**, mas a resposta certa é 3 + 3 = **2 moedas**. A PD resolve sempre corretamente:

Seja `melhor[v]` o menor número de moedas para formar o valor `v`. Então `melhor[0] = 0` e, para cada moeda `m ≤ v`, `melhor[v] = min(melhor[v], melhor[v - m] + 1)`.

```python
def troco_guloso(moedas, valor):
    usadas = []
    for m in sorted(moedas, reverse=True):
        while valor >= m:
            valor -= m
            usadas.append(m)
    return usadas

def troco_pd(moedas, valor):
    INF = float("inf")
    melhor = [0] + [INF] * valor
    for v in range(1, valor + 1):
        for m in moedas:
            if m <= v and melhor[v - m] + 1 < melhor[v]:
                melhor[v] = melhor[v - m] + 1
    print("tabela:", melhor)
    return melhor[valor]

print("guloso:", troco_guloso([1, 3, 4], 6))
print("PD:", troco_pd([1, 3, 4], 6), "moedas")
```

A versão PD custa O(valor × número de moedas), enquanto testar todas as combinações seria exponencial.

### Exercício
Escreva `troco_minimo(moedas, valor)` que devolve o **menor número de moedas** para formar `valor` (cada moeda pode ser usada quantas vezes quiser), ou `-1` se for impossível. `troco_minimo(moedas, 0)` é `0`. Use programação dinâmica.

```python inicial
def troco_minimo(moedas, valor):
    total = 0
    for m in sorted(moedas, reverse=True):
        total += valor // m
        valor %= m
    return total
```

```python solucao
def troco_minimo(moedas, valor):
    INF = float("inf")
    melhor = [0] + [INF] * valor
    for v in range(1, valor + 1):
        for m in moedas:
            if m <= v and melhor[v - m] + 1 < melhor[v]:
                melhor[v] = melhor[v - m] + 1
    return melhor[valor] if melhor[valor] != INF else -1
```

```python teste
assert troco_minimo([1, 3, 4], 6) == 2, "com moedas [1, 3, 4], o troco de 6 usa 2 moedas (3 + 3)"
assert troco_minimo([1, 5, 10, 25], 63) == 6, "63 = 25 + 25 + 10 + 1 + 1 + 1 -> 6 moedas"
assert troco_minimo([2], 3) == -1, "com só moedas de 2 não dá para formar 3: deveria devolver -1"
assert troco_minimo([5, 7], 0) == 0, "valor 0 precisa de 0 moedas"
assert troco_minimo([7, 2], 11) == 3, "11 = 7 + 2 + 2 -> 3 moedas"
assert troco_minimo([186, 419, 83, 408], 6249) == 20, "caso maior: a resposta é 20"
```

## Filas de prioridade (heapq) e grafos
fonte: Documentação oficial do Python (heapq, collections.deque)

### heapq: fila de prioridade

Às vezes não queremos "o primeiro que chegou", e sim "o **mais urgente**": o paciente mais grave no pronto-socorro, a tarefa de maior prioridade, o caminho mais curto até agora. Uma **fila de prioridade** entrega sempre o **menor** item. O módulo `heapq` implementa isso sobre uma lista comum, organizada como uma árvore chamada **heap**:

| Operação | Custo |
|---|---|
| `heapq.heappush(h, x)`: inserir | O(log n) |
| `heapq.heappop(h)`: remover o menor | O(log n) |
| `h[0]`: espiar o menor | O(1) |
| `heapq.heapify(lista)`: transformar uma lista em heap | O(n) |

```python
import heapq

tarefas = []
heapq.heappush(tarefas, (3, "lavar a louça"))
heapq.heappush(tarefas, (1, "pagar boleto que vence hoje"))
heapq.heappush(tarefas, (2, "responder e-mail"))
heapq.heappush(tarefas, (1, "tomar remédio"))

print("mais urgente:", tarefas[0])
while tarefas:
    prioridade, tarefa = heapq.heappop(tarefas)
    print(prioridade, tarefa)
```

> 💡 Tuplas são comparadas item a item: primeiro a prioridade; no empate, o segundo item. Por isso usamos `(prioridade, dado)`.

```python
import heapq

notas = [7.2, 9.8, 5.5, 8.1, 9.1, 6.0, 9.5]
print("3 maiores:", heapq.nlargest(3, notas))
print("2 menores:", heapq.nsmallest(2, notas))

h = notas[:]
heapq.heapify(h)                          # O(n)
print([heapq.heappop(h) for _ in range(len(h))])   # sai em ordem: é o "heap sort"
```

### Grafos com dicionários

Um **grafo** é um conjunto de **vértices** (pontos) ligados por **arestas**. Modela redes sociais, mapas, dependências entre tarefas, links entre páginas... Em Python, a forma mais simples é uma **lista de adjacência**: um dicionário em que cada vértice aponta para a lista dos seus vizinhos.

```python
amizades = {
    "Ana":   ["Bia", "Caio"],
    "Bia":   ["Ana", "Duda"],
    "Caio":  ["Ana", "Duda"],
    "Duda":  ["Bia", "Caio", "Edu"],
    "Edu":   ["Duda"],
}
print("amigos da Duda:", amizades["Duda"])
print("arestas:", sum(len(v) for v in amizades.values()) // 2)
print("Ana e Edu são amigos?", "Edu" in amizades["Ana"])
```

### Busca em largura (BFS): menor caminho

A **busca em largura** (*breadth-first search*) explora o grafo em "ondas": primeiro os vizinhos da origem, depois os vizinhos dos vizinhos, e assim por diante. Ela usa uma **fila** (`deque`). Como visita os vértices em ordem de distância, a primeira vez que chega a um vértice é pelo **menor caminho** (em número de arestas). Custo: O(V + A), vértices mais arestas.

```python
from collections import deque

def distancias(grafo, origem):
    dist = {origem: 0}
    fila = deque([origem])
    while fila:
        v = fila.popleft()
        for viz in grafo[v]:
            if viz not in dist:           # primeira visita = menor distância
                dist[viz] = dist[v] + 1
                fila.append(viz)
    return dist

amizades = {
    "Ana": ["Bia", "Caio"], "Bia": ["Ana", "Duda"], "Caio": ["Ana", "Duda"],
    "Duda": ["Bia", "Caio", "Edu"], "Edu": ["Duda"], "Zé": [],
}
print(distancias(amizades, "Ana"))   # Zé não aparece: é inalcançável
```

### Bônus: Dijkstra, quando as arestas têm peso

Se cada aresta tem um custo (distância em km, tempo), o menor caminho deixa de ser o de menos arestas. O **algoritmo de Dijkstra** é a "BFS com fila de prioridade": sempre expande o vértice com a menor distância acumulada.

```python
import heapq

def dijkstra(grafo, origem):
    dist = {origem: 0}
    heap = [(0, origem)]
    while heap:
        d, v = heapq.heappop(heap)
        if d > dist[v]:
            continue                      # registro antigo, ignorar
        for viz, peso in grafo[v].items():
            nova = d + peso
            if nova < dist.get(viz, float("inf")):
                dist[viz] = nova
                heapq.heappush(heap, (nova, viz))
    return dist

estradas = {
    "A": {"B": 4, "C": 1},
    "B": {"D": 1},
    "C": {"B": 2, "D": 5},
    "D": {},
}
print(dijkstra(estradas, "A"))   # A->C->B->D custa 4, melhor que A->B->D (5)
```

### Exercício
Escreva `menor_caminho(grafo, origem, destino)` que usa BFS para devolver a **lista de vértices** de um menor caminho (em número de arestas) de `origem` até `destino`, incluindo os dois. Se não houver caminho, devolva `None`. Dica: guarde num dicionário `anterior[v]` de onde você veio, e reconstrua o caminho de trás para a frente.

```python inicial
from collections import deque

def menor_caminho(grafo, origem, destino):
    return [origem, destino]
```

```python solucao
from collections import deque

def menor_caminho(grafo, origem, destino):
    anterior = {origem: None}
    fila = deque([origem])
    while fila:
        v = fila.popleft()
        if v == destino:
            caminho = []
            while v is not None:
                caminho.append(v)
                v = anterior[v]
            return caminho[::-1]
        for viz in grafo.get(v, []):
            if viz not in anterior:
                anterior[viz] = v
                fila.append(viz)
    return None
```

```python teste
g = {
    "A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D", "E"],
    "D": ["B", "C", "F"], "E": ["C", "F"], "F": ["D", "E"], "X": ["Y"], "Y": ["X"],
}
r = menor_caminho(g, "A", "F")
assert r is not None and len(r) == 4, f"o menor caminho de A a F tem 4 vértices (3 arestas), veio {r}"
assert r[0] == "A" and r[-1] == "F", "o caminho deve começar na origem e terminar no destino"
assert all(b in g[a] for a, b in zip(r, r[1:])), f"cada passo do caminho deve ser uma aresta do grafo: {r}"
assert menor_caminho(g, "A", "A") == ["A"], "de A para A o caminho é ['A']"
assert menor_caminho(g, "A", "X") is None, "não há caminho de A para X: deveria devolver None"
assert menor_caminho(g, "B", "C") in (["B", "A", "C"], ["B", "D", "C"]), "de B para C há caminhos de 2 arestas"
linha = {i: [i - 1, i + 1] for i in range(1, 999)}
linha[0] = [1]; linha[999] = [998]
assert len(menor_caminho(linha, 0, 999)) == 1000, "num grafo em linha de 1000 vértices, o caminho de 0 a 999 tem 1000 vértices"
```

## Quiz
? Um algoritmo faz `3n² + 10n + 7` operações. Qual é a sua ordem de crescimento?
- [ ] O(n)
- [x] O(n²)
- [ ] O(3n²)
- [ ] O(n² + n)
> No Big-O ignoramos constantes e termos menores: para `n` grande, o termo `n²` domina.

? Quantos passos, aproximadamente, a busca binária precisa numa lista ordenada de 1.000.000 de itens?
- [ ] 1.000.000
- [ ] 500.000
- [ ] 1.000
- [x] 20
> Cada passo descarta metade dos candidatos: 2²⁰ ≈ 1 milhão, então cerca de 20 passos bastam. É O(log n).

? Qual é o custo médio de `x in conjunto` quando `conjunto` é um `set`?
- [x] O(1)
- [ ] O(log n)
- [ ] O(n)
- [ ] O(n²)
> `set` e `dict` são tabelas hash: o hash indica onde procurar, sem percorrer todos os itens. Numa `list`, `in` é O(n).

? Por que `lista.pop(0)` é uma má ideia para implementar uma fila grande?
- [ ] Porque remove o último item
- [x] Porque é O(n): todos os itens restantes precisam ser deslocados
- [ ] Porque dá erro em listas com mais de 1000 itens
- [ ] Porque não devolve o item removido
> Use `collections.deque` e `popleft()`, que remove do início em O(1).

? Qual estrutura é ideal para verificar se parênteses estão balanceados?
- [x] Pilha
- [ ] Fila
- [ ] Heap
- [ ] Conjunto
> O último símbolo aberto deve ser o primeiro a ser fechado: exatamente a regra LIFO da pilha.

? O que significa dizer que um algoritmo de ordenação é **estável**?
- [ ] Ele nunca dá erro
- [ ] Ele sempre tem o mesmo tempo de execução
- [x] Itens com chaves iguais mantêm a ordem relativa original
- [ ] Ele não usa memória extra
> O Timsort do `sorted()` é estável, o que permite ordenar por vários critérios em etapas.

? Qual é a complexidade do merge sort no pior caso?
- [ ] O(n)
- [x] O(n log n)
- [ ] O(n²)
- [ ] O(2ⁿ)
> A lista é dividida ao meio log₂ n vezes, e em cada nível a intercalação custa n operações.

? Por que uma lista não pode ser chave de um dicionário?
- [ ] Porque listas são lentas
- [x] Porque é mutável: se mudasse, seu hash mudaria e a chave ficaria perdida na tabela
- [ ] Porque listas não podem ser comparadas
- [ ] Porque o dicionário só aceita strings
> Chaves precisam ser *hashable* (imutáveis). Use uma tupla no lugar da lista.

? O que caracteriza a programação dinâmica?
- [ ] Usar apenas recursão, sem laços
- [ ] Escolher sempre a opção que parece melhor no momento
- [x] Guardar as soluções de subproblemas repetidos para não recalculá-las
- [ ] Alterar o código enquanto ele executa
> Memoização (de cima para baixo) e tabulação (de baixo para cima) são as duas formas. A opção "escolher o que parece melhor agora" descreve os algoritmos gulosos.

? A busca em largura (BFS) encontra o menor caminho em número de arestas porque:
- [ ] usa uma pilha e vai o mais fundo possível
- [x] visita os vértices em ordem crescente de distância, usando uma fila
- [ ] ordena as arestas por peso
- [ ] testa todos os caminhos possíveis
> Por usar uma fila FIFO, a BFS explora em "ondas": a primeira vez que alcança um vértice é pelo caminho mais curto. Com pesos, use Dijkstra.
