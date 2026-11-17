# Coleções: listas, tuplas, dicionários e conjuntos
id: m06
nivel: Básico
icone: 🗂️
descricao: Guarde e organize muitos valores com listas, tuplas, dicionários e conjuntos, e aprenda a escolher a estrutura certa.

## Listas: criação, índices e mutabilidade
fonte: Python do Zero p. 29–30; Pense em Python cap. 10.1–10.2

Uma **lista** é uma sequência ordenada de valores, chamados **itens** ou **elementos**. Ela é escrita entre colchetes, com os itens separados por vírgula:

```python
numeros = [10, 20, 30, 40]
frutas = ["maçã", "banana", "uva"]
misturada = ["texto", 3.5, 42, True, None]   # tipos diferentes são permitidos
vazia = []
print(numeros, frutas, misturada, vazia)
print(type(numeros), len(frutas))
```

### Acessando itens por índice

Como nas strings, cada item tem um **índice** (posição), começando em **0**. Índices negativos contam a partir do fim:

| Item | `"maçã"` | `"banana"` | `"uva"` |
|---|---|---|---|
| Índice positivo | 0 | 1 | 2 |
| Índice negativo | -3 | -2 | -1 |

```python
frutas = ["maçã", "banana", "uva"]
print(frutas[0])     # primeiro
print(frutas[-1])    # último
print(frutas[len(frutas) - 1])   # também o último, de um jeito mais trabalhoso
```

Acessar um índice que não existe gera `IndexError`:

```python erro
frutas = ["maçã", "banana", "uva"]
print(frutas[3])     # índices válidos: 0, 1 e 2
```

### Listas são mutáveis

A grande diferença em relação às strings: listas são **mutáveis**, ou seja, podemos trocar um item depois de criada a lista. Basta usar o índice do lado esquerdo da atribuição:

```python
cores = ["vermelho", "verde", "azul"]
cores[1] = "amarelo"
cores[-1] = cores[-1].upper()
print(cores)

texto = "gato"
# texto[0] = "r" daria TypeError: strings são imutáveis
texto = "r" + texto[1:]   # com strings, criamos uma nova
print(texto)
```

### Listas aninhadas

Uma lista pode conter outras listas. É assim que representamos tabelas e matrizes: uma lista de linhas, cada linha uma lista. Para acessar, use dois índices: `[linha][coluna]`.

```python
matriz = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]
print(matriz[1])        # a segunda linha inteira
print(matriz[1][2])     # linha 1, coluna 2 -> 6
matriz[0][0] = 100
for linha in matriz:
    print(linha)
print("Itens na lista de fora:", len(matriz))   # 3 (as linhas), não 9
```

### Exercício
Escreva a função `diagonal(matriz)` que recebe uma matriz quadrada (lista de listas com o mesmo número de linhas e colunas) e retorna uma lista com os itens da **diagonal principal** (`matriz[0][0]`, `matriz[1][1]`, ...). Exemplo: `diagonal([[1, 2], [3, 4]])` retorna `[1, 4]`.

```python inicial
def diagonal(matriz):
    pass
```

```python solucao
def diagonal(matriz):
    resultado = []
    for i in range(len(matriz)):
        resultado.append(matriz[i][i])
    return resultado
```

```python teste
assert diagonal([[1, 2], [3, 4]]) == [1, 4], f"diagonal([[1, 2], [3, 4]]) deveria ser [1, 4], veio {diagonal([[1, 2], [3, 4]])}"
assert diagonal([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) == [1, 5, 9], "Matriz 3x3: esperava [1, 5, 9]"
assert diagonal([[42]]) == [42], "Matriz 1x1: esperava [42]"
assert diagonal([]) == [], "Matriz vazia: esperava []"
assert diagonal([["a", "b"], ["c", "d"]]) == ["a", "d"], "Deve funcionar com qualquer tipo de item"
```

## Funções e métodos de listas
fonte: Python do Zero p. 30–32; Pense em Python cap. 10.5–10.8

Listas vêm com muitas ferramentas prontas. Primeiro, as **funções embutidas** que recebem a lista como argumento:

```python
notas = [7, 9, 4, 10, 6]
print(len(notas), min(notas), max(notas), sum(notas))
print("Média:", sum(notas) / len(notas))
print(9 in notas, 5 in notas, 5 not in notas)
```

### Métodos que adicionam e removem

| Método | O que faz |
|---|---|
| `lista.append(x)` | adiciona `x` no final |
| `lista.extend(outra)` | adiciona todos os itens de `outra` no final |
| `lista.insert(i, x)` | insere `x` na posição `i` (os outros "andam" para a direita) |
| `lista.remove(x)` | remove a **primeira** ocorrência do **valor** `x` |
| `lista.pop()` / `lista.pop(i)` | remove e **retorna** o último item (ou o da posição `i`) |
| `del lista[i]` | apaga o item da posição `i` (é um comando, não um método) |
| `lista.clear()` | esvazia a lista |

```python
compras = ["arroz", "feijão"]
compras.append("café")
compras.extend(["leite", "pão"])
compras.insert(0, "açúcar")
print(compras)

compras.remove("feijão")      # por valor
ultimo = compras.pop()        # remove e devolve o último
segundo = compras.pop(1)      # remove e devolve o da posição 1
del compras[0]                # por posição
print(compras, "| tirei:", ultimo, segundo)
```

> ⚠️ `append` com uma lista adiciona a lista **inteira como um único item**: `[1, 2].append([3, 4])` resulta em `[1, 2, [3, 4]]`. Para juntar os itens, use `extend`.

```python erro
nomes = ["Ana", "Bia"]
nomes.remove("Caio")    # remove gera ValueError se o valor não existe
```

### Métodos de busca e ordenação

| Método | O que faz |
|---|---|
| `lista.index(x)` | posição da primeira ocorrência de `x` (erro se não existir) |
| `lista.count(x)` | quantas vezes `x` aparece |
| `lista.sort()` | ordena **a própria lista** (crescente; `reverse=True` para decrescente) |
| `sorted(lista)` | função que **retorna uma nova** lista ordenada, sem alterar a original |
| `lista.reverse()` | inverte a ordem da própria lista |
| `lista.copy()` | retorna uma cópia (rasa) da lista |

```python
valores = [5, 2, 8, 2, 9, 1]
print(valores.index(8), valores.count(2))

ordenada = sorted(valores)
print("sorted:", ordenada, "| original intacta:", valores)

valores.sort(reverse=True)
print("depois do sort:", valores)
valores.reverse()
print("depois do reverse:", valores)
```

> ⚠️ Armadilha clássica: métodos que modificam a lista (`append`, `sort`, `reverse`, `insert`...) retornam **`None`**. Escrever `lista = lista.sort()` **apaga** sua lista, trocando-a por `None`!

```python
lista = [3, 1, 2]
resultado = lista.sort()
print("O sort retornou:", resultado)
print("Mas a lista foi ordenada:", lista)
```

### Operadores + e *

`+` **concatena** listas (cria uma nova) e `*` **repete**:

```python
a = [1, 2]
b = [3, 4]
print(a + b)
print(a * 3)
print([0] * 5)        # forma rápida de criar uma lista com 5 zeros
print(a, b)           # a e b não mudaram
```

### Exercício
Escreva a função `remove_todos(lista, valor)` que **modifica** a lista recebida, removendo **todas** as ocorrências de `valor`, e retorna quantos itens foram removidos. Exemplo: com `x = [1, 2, 1, 3, 1]`, `remove_todos(x, 1)` retorna `3` e `x` passa a ser `[2, 3]`.

Dica: `remove` só tira a primeira ocorrência; repita enquanto `valor in lista`.

```python inicial
def remove_todos(lista, valor):
    pass
```

```python solucao
def remove_todos(lista, valor):
    removidos = 0
    while valor in lista:
        lista.remove(valor)
        removidos += 1
    return removidos
```

```python teste
x = [1, 2, 1, 3, 1]
r = remove_todos(x, 1)
assert r == 3, f"Deveria retornar 3 (itens removidos), retornou {r}"
assert x == [2, 3], f"A lista deveria virar [2, 3], mas ficou {x}. Lembre de modificar a própria lista."
y = ["a", "b"]
assert remove_todos(y, "z") == 0 and y == ["a", "b"], "Se o valor não existe, retorna 0 e a lista não muda"
z = [7, 7, 7]
assert remove_todos(z, 7) == 3 and z == [], f"remove_todos([7, 7, 7], 7) deveria esvaziar a lista, ficou {z}"
v = []
assert remove_todos(v, 1) == 0 and v == [], "Lista vazia: retorna 0"
```

## Fatiamento e list(range())
fonte: Python do Zero p. 31; Pense em Python cap. 10.5

O **fatiamento** (*slicing*) funciona como nas strings: `lista[início:fim:passo]` retorna uma **nova lista** com os itens do início até **antes** do fim.

```python
letras = ["a", "b", "c", "d", "e", "f"]
print(letras[1:4])    # posições 1, 2 e 3
print(letras[:3])     # do começo até antes da 3
print(letras[3:])     # da 3 até o fim
print(letras[-2:])    # os dois últimos
print(letras[::2])    # de dois em dois
print(letras[::-1])   # invertida
print(letras[:])      # cópia completa
```

Fatias **não** geram `IndexError`: índices fora do intervalo são simplesmente ajustados.

```python
dados = [1, 2, 3]
print(dados[1:100], dados[5:10])
```

### Alterando por fatia

Como listas são mutáveis, dá para **substituir** ou **apagar** um trecho inteiro de uma vez:

```python
n = [0, 1, 2, 3, 4, 5]
n[1:3] = ["um", "dois"]
print(n)
n[1:3] = []            # apagar um trecho
print(n)
del n[::2]             # apaga posições pares
print(n)
```

### Criando listas com list(range())

`list(range(...))` é a forma mais simples de criar uma lista de números em sequência:

```python
print(list(range(1, 11)))
print(list(range(0, 101, 25)))
print(list(range(10, 0, -2)))
pares = list(range(0, 21, 2))
print(pares[:5], "...", pares[-1])
```

> 💡 Um `range` sozinho não guarda todos os números na memória: ele os gera sob demanda. `list()` materializa todos de uma vez. Para apenas percorrer com `for`, não é preciso converter.

### Exercício
Escreva a função `rotaciona(lista, k)` que retorna uma **nova** lista com os itens deslocados `k` posições para a esquerda (os primeiros vão para o fim), usando fatiamento. Se `k` for maior que o tamanho, dê a volta (use `%`). Exemplo: `rotaciona([1, 2, 3, 4, 5], 2)` retorna `[3, 4, 5, 1, 2]`. A lista original não pode ser alterada, e lista vazia retorna `[]`.

```python inicial
def rotaciona(lista, k):
    pass
```

```python solucao
def rotaciona(lista, k):
    if not lista:
        return []
    k = k % len(lista)
    return lista[k:] + lista[:k]
```

```python teste
orig = [1, 2, 3, 4, 5]
r = rotaciona(orig, 2)
assert r == [3, 4, 5, 1, 2], f"rotaciona([1, 2, 3, 4, 5], 2) deveria ser [3, 4, 5, 1, 2], veio {r}"
assert orig == [1, 2, 3, 4, 5], "A lista original não deve ser modificada"
assert rotaciona([1, 2, 3], 0) == [1, 2, 3], "k = 0 não muda nada"
assert rotaciona([1, 2, 3], 3) == [1, 2, 3], "k igual ao tamanho dá a volta completa"
assert rotaciona([1, 2, 3], 7) == [2, 3, 1], f"rotaciona([1, 2, 3], 7) deveria ser [2, 3, 1] (7 % 3 = 1), veio {rotaciona([1, 2, 3], 7)}"
assert rotaciona([], 4) == [], "Lista vazia deve retornar []"
assert rotaciona([1, 2, 3], 1) is not orig, "Retorne uma lista nova"
```

## Objetos, valores, aliasing e cópia
fonte: Pense em Python cap. 10.10–10.12

Esta lição explica um dos comportamentos que mais surpreendem iniciantes. Para entendê-lo, precisamos distinguir **valor** de **objeto**.

### == compara valores, is compara identidade

```python
a = [1, 2, 3]
b = [1, 2, 3]
print(a == b)     # True: têm o mesmo valor
print(a is b)     # False: são dois objetos diferentes na memória
print(id(a), id(b))   # id() mostra a "identidade" de cada objeto
```

Duas listas criadas separadamente são **equivalentes** (mesmo valor), mas não **idênticas** (não são o mesmo objeto).

### Aliasing: dois nomes, um objeto

Quando escrevemos `b = a`, **não** criamos uma cópia. Criamos um segundo nome (um **alias**, ou apelido) para o **mesmo** objeto. Toda mudança feita por um nome aparece no outro:

```python
a = [1, 2, 3]
b = a            # b é outro nome para a MESMA lista
b.append(4)
b[0] = 99
print("a:", a)   # a também mudou!
print(a is b)
```

Pense na variável como uma **etiqueta** colada no objeto, e não como uma caixa que guarda o valor. `b = a` cola uma segunda etiqueta no mesmo objeto.

> ⚠️ Com tipos imutáveis (números, strings, tuplas) o aliasing não causa problemas, pois o objeto nunca muda: qualquer "alteração" cria um objeto novo. O cuidado é com tipos **mutáveis**: listas, dicionários e conjuntos.

### Fazendo cópias

Para ter uma lista independente, faça uma cópia explícita. As três formas abaixo são equivalentes:

```python
original = [1, 2, 3]
c1 = original.copy()
c2 = original[:]
c3 = list(original)
c1.append("só no c1")
print(original, c1, c2, c3)
print(original == c2, original is c2)
```

Essas cópias são **rasas** (*shallow*): copiam a lista de fora, mas as listas **internas** continuam compartilhadas. Para listas aninhadas, use `copy.deepcopy`:

```python
import copy
matriz = [[1, 2], [3, 4]]
rasa = matriz.copy()
profunda = copy.deepcopy(matriz)
matriz[0][0] = "X"
print("rasa:", rasa)          # foi afetada!
print("profunda:", profunda)  # independente
```

Uma armadilha relacionada: `[[0] * 3] * 3` cria três referências para a **mesma** linha.

```python
errada = [[0] * 3] * 3
errada[0][0] = 1
print(errada)        # mudou as três linhas!

certa = []
for _ in range(3):
    certa.append([0] * 3)
certa[0][0] = 1
print(certa)
```

### Listas como argumento de função

Quando você passa uma lista para uma função, o parâmetro vira um **alias** da lista original. Se a função **modificar** a lista, quem chamou vê a mudança:

```python
def remove_primeiro(t):
    del t[0]              # modifica o objeto recebido

def sem_primeiro(t):
    return t[1:]          # cria e retorna uma lista NOVA

letras = ["a", "b", "c"]
remove_primeiro(letras)
print(letras)

nova = sem_primeiro(letras)
print(nova, letras)
```

> 💡 Deixe claro (no nome e na documentação) se uma função **modifica** o argumento ou **retorna uma nova** lista. Misturar as duas coisas confunde quem usa a função. Em geral, prefira retornar uma nova lista.

Cuidado: **reatribuir** o parâmetro dentro da função não afeta quem chamou, pois apenas move a etiqueta local para outro objeto:

```python
def nao_funciona(t):
    t = t[1:]          # t agora aponta para uma lista nova (local)

letras = ["a", "b", "c"]
nao_funciona(letras)
print(letras)          # inalterada
```

### Exercício
Escreva a função `duplicados(lista)` que retorna uma **nova** lista com cada item repetido duas vezes, **sem modificar** a original. Exemplo: `duplicados([1, 2])` retorna `[1, 1, 2, 2]`. O teste verifica se a original ficou intacta e se a lista retornada é um objeto novo.

```python inicial
def duplicados(lista):
    for i in range(len(lista) - 1, -1, -1):
        lista.insert(i, lista[i])
    return lista
```

```python solucao
def duplicados(lista):
    nova = []
    for item in lista:
        nova.append(item)
        nova.append(item)
    return nova
```

```python teste
orig = [1, 2, 3]
r = duplicados(orig)
assert r == [1, 1, 2, 2, 3, 3], f"duplicados([1, 2, 3]) deveria ser [1, 1, 2, 2, 3, 3], veio {r}"
assert orig == [1, 2, 3], f"A lista original foi modificada: ficou {orig}"
assert r is not orig, "Retorne uma lista NOVA, não a mesma lista recebida"
v = []
assert duplicados(v) == [] and duplicados(v) is not v, "Lista vazia: retorne uma nova lista vazia"
assert duplicados(["a"]) == ["a", "a"], "duplicados(['a']) deveria ser ['a', 'a']"
```

## Tuplas e desempacotamento
fonte: Python do Zero p. 33; Pense em Python cap. 12.1–12.4

Uma **tupla** é uma sequência como a lista, mas **imutável**: depois de criada, não pode ser alterada. Escreve-se com parênteses (ou só com vírgulas):

```python
ponto = (3, 4)
cores = "vermelho", "verde", "azul"     # os parênteses são opcionais
unitaria = (5,)                         # tupla de 1 item: a vírgula é obrigatória!
nao_tupla = (5)                         # isto é só o número 5 entre parênteses
vazia = ()
print(type(ponto), type(cores), type(unitaria), type(nao_tupla), len(vazia))
print(ponto[0], cores[-1], cores[1:])
```

Índices, fatias, `len`, `in`, `count`, `index`, `for`, `+` e `*` funcionam como nas listas. O que não funciona é alterar:

```python erro
ponto = (3, 4)
ponto[0] = 10
```

### Por que usar tuplas?

- **Segurança**: os dados não podem ser alterados por engano.
- **Significado**: indicam um registro de tamanho fixo, como uma coordenada `(x, y)` ou uma data `(dia, mês, ano)`.
- **Podem ser chaves de dicionário** e itens de conjunto, pois são imutáveis (listas não podem).
- São um pouco mais leves e rápidas que listas.

### Empacotamento e desempacotamento

Escrever `t = 1, 2, 3` **empacota** valores numa tupla. O contrário, **desempacotar**, atribui cada item a uma variável:

```python
data = (25, 12, 2024)
dia, mes, ano = data          # desempacotamento
print(f"{dia}/{mes}/{ano}")

nome, dominio = "ana@exemplo.com".split("@")
print(nome, "|", dominio)

primeiro, *resto = [10, 20, 30, 40]   # * recolhe "o que sobrou" numa lista
print(primeiro, resto)
```

O número de variáveis deve bater com o número de itens:

```python erro
a, b = (1, 2, 3)
```

### A troca a, b = b, a

Em muitas linguagens, trocar dois valores exige uma variável temporária. Em Python, o desempacotamento faz isso numa linha: o lado direito é avaliado **primeiro** (formando uma tupla) e depois distribuído:

```python
a = "primeiro"
b = "segundo"
a, b = b, a
print(a, b)
```

### Retornando vários valores

Uma função só retorna **um** objeto, mas esse objeto pode ser uma tupla. Isso permite "retornar vários valores":

```python
def min_max(valores):
    return min(valores), max(valores)      # retorna uma tupla

menor, maior = min_max([4, 9, 1, 7])
print(menor, maior)

quociente, resto = divmod(17, 5)           # divmod é uma função embutida que faz o mesmo
print(quociente, resto)
```

### Exercício
Escreva a função `separa_nome(nome_completo)` que retorna uma tupla `(primeiro_nome, ultimo_nome)`. Ignore espaços extras nas pontas e entre as palavras. Se houver só um nome, o último nome é string vazia. Exemplo: `separa_nome("Ada King Lovelace")` retorna `("Ada", "Lovelace")`.

```python inicial
def separa_nome(nome_completo):
    pass
```

```python solucao
def separa_nome(nome_completo):
    partes = nome_completo.split()
    if len(partes) == 1:
        return (partes[0], "")
    return (partes[0], partes[-1])
```

```python teste
r = separa_nome("Ada King Lovelace")
assert r == ("Ada", "Lovelace"), f"Esperava ('Ada', 'Lovelace'), veio {r!r}"
assert isinstance(r, tuple), "O retorno deve ser uma tupla"
assert separa_nome("Alan Turing") == ("Alan", "Turing"), "Nome com duas partes"
assert separa_nome("Pelé") == ("Pelé", ""), f"Só um nome: esperava ('Pelé', ''), veio {separa_nome('Pelé')!r}"
assert separa_nome("   Grace    Brewster   Hopper  ") == ("Grace", "Hopper"), "Ignore espaços extras (dica: split() sem argumento)"
```

## Dicionários
fonte: Python do Zero p. 34; Pense em Python cap. 11.1

Um **dicionário** guarda pares **chave → valor**. Em vez de acessar por posição (0, 1, 2...), acessamos pela **chave**, que pode ser uma string, um número ou outro valor imutável. É como uma agenda: procuramos pelo nome e encontramos o telefone.

```python
idades = {"Ana": 25, "Bruno": 31, "Carla": 19}
print(idades["Ana"])
print(len(idades))

vazio = {}
outro = dict(nome="Rex", especie="cão")   # outra forma de criar
print(vazio, outro)
```

### Adicionar, alterar e apagar

Atribuir a uma chave **cria** o par se ele não existir, ou **substitui** o valor se já existir. As chaves são **únicas**:

```python
estoque = {"maçã": 10}
estoque["banana"] = 5       # nova chave
estoque["maçã"] = 12        # altera o valor
estoque["maçã"] += 3        # soma ao valor atual
del estoque["banana"]       # apaga o par
print(estoque)

preco = estoque.pop("maçã")  # remove e retorna o valor
print(preco, estoque)
```

### Acesso seguro com get e in

Acessar uma chave inexistente com colchetes gera `KeyError`:

```python erro
idades = {"Ana": 25}
print(idades["Zé"])
```

Para evitar isso, teste com `in` (que verifica **chaves**, não valores) ou use `get`, que retorna um valor padrão:

```python
idades = {"Ana": 25, "Bruno": 31}
print("Zé" in idades, "Ana" in idades)
print(25 in idades)               # False: 25 é valor, não chave
print(idades.get("Zé"))           # None
print(idades.get("Zé", 0))        # 0 (padrão escolhido)
print(idades.get("Ana", 0))
```

### keys, values e items

```python
capitais = {"SP": "São Paulo", "RJ": "Rio de Janeiro", "MG": "Belo Horizonte"}
print(list(capitais.keys()))
print(list(capitais.values()))
print(list(capitais.items()))     # lista de tuplas (chave, valor)
print("Belo Horizonte" in capitais.values())
```

### setdefault e update

- `d.setdefault(chave, padrao)`: se a chave existe, retorna o valor dela; se não, **cria** com o padrão e o retorna.
- `d.update(outro)`: copia todos os pares de `outro` para `d` (sobrescrevendo chaves repetidas).

```python
config = {"tema": "claro", "fonte": 12}
config.update({"fonte": 14, "idioma": "pt"})
print(config)

grupos = {}
grupos.setdefault("frutas", []).append("uva")
grupos.setdefault("frutas", []).append("pera")
grupos.setdefault("legumes", []).append("cenoura")
print(grupos)
```

> 💡 Desde o Python 3.7, dicionários **mantêm a ordem de inserção** das chaves. A busca por chave é muito rápida, praticamente instantânea mesmo com milhões de itens, porque usa uma técnica chamada *hashing*. Por isso as chaves precisam ser imutáveis.

```python erro
d = {}
d[[1, 2]] = "lista não pode ser chave"
```

### Exercício
Escreva a função `aplica_desconto(precos, percentual)` que recebe um dicionário `{produto: preço}` e retorna um **novo** dicionário com cada preço reduzido pelo percentual, arredondado a 2 casas (`round(valor, 2)`). O dicionário original não deve mudar. Exemplo: `aplica_desconto({"livro": 50.0}, 10)` retorna `{"livro": 45.0}`.

```python inicial
def aplica_desconto(precos, percentual):
    pass
```

```python solucao
def aplica_desconto(precos, percentual):
    novo = {}
    for produto, preco in precos.items():
        novo[produto] = round(preco * (1 - percentual / 100), 2)
    return novo
```

```python teste
orig = {"livro": 50.0, "caneta": 3.0}
r = aplica_desconto(orig, 10)
assert r == {"livro": 45.0, "caneta": 2.7}, f"Esperava {{'livro': 45.0, 'caneta': 2.7}}, veio {r}"
assert orig == {"livro": 50.0, "caneta": 3.0}, f"O dicionário original foi modificado: {orig}"
assert aplica_desconto({"x": 19.99}, 15) == {"x": 16.99}, f"19.99 com 15% deve dar 16.99, veio {aplica_desconto({'x': 19.99}, 15)}"
assert aplica_desconto({"a": 10}, 0) == {"a": 10}, "Desconto de 0% não muda o preço"
assert aplica_desconto({}, 50) == {}, "Dicionário vazio deve retornar {}"
```

## Percorrendo dicionários: contagem e histograma
fonte: Pense em Python cap. 11.2–11.5

### Percorrendo com for

Um `for` direto no dicionário percorre as **chaves**. Para ter chave e valor juntos, use `items()` com desempacotamento:

```python
precos = {"café": 18.5, "açúcar": 4.2, "leite": 5.9}
for produto in precos:
    print(produto)

for produto, preco in precos.items():
    print(f"{produto:<8} R$ {preco:6.2f}")

for produto in sorted(precos):        # chaves em ordem alfabética
    print(produto, end=" ")
print()
```

### O padrão de contagem (histograma)

Um uso fundamental dos dicionários é **contar** quantas vezes cada coisa aparece. O resultado é um **histograma** (termo estatístico para um conjunto de contadores):

```python
def histograma(texto):
    contagem = {}
    for c in texto:
        if c not in contagem:
            contagem[c] = 1
        else:
            contagem[c] += 1
    return contagem

print(histograma("banana"))
```

Com `get`, o mesmo padrão fica numa linha só, sem `if`:

```python
contagem = {}
for palavra in "o sol e o mar e o céu".split():
    contagem[palavra] = contagem.get(palavra, 0) + 1
print(contagem)

# a palavra mais frequente: max com key (você verá key em detalhes em Funções)
print(max(contagem, key=contagem.get))
```

> 💡 A biblioteca padrão tem `collections.Counter`, que faz exatamente isso: `Counter("banana")` resulta em `Counter({'a': 3, 'n': 2, 'b': 1})`. É bom conhecer, mas saber escrever o laço à mão é importante.

### Busca reversa

Achar o valor a partir da chave é rápido. O caminho inverso, achar a chave a partir de um valor (**busca reversa**), exige percorrer o dicionário, e pode haver várias chaves com o mesmo valor:

```python
def busca_reversa(d, valor):
    for chave in d:
        if d[chave] == valor:
            return chave
    return None

h = {"b": 1, "a": 3, "n": 2}
print(busca_reversa(h, 2), busca_reversa(h, 9))
```

### Invertendo um dicionário

Se a busca reversa for frequente, vale a pena **inverter** o dicionário: os valores viram chaves. Como vários itens podem ter o mesmo valor, cada chave nova aponta para uma **lista**:

```python
def inverte(d):
    inverso = {}
    for chave, valor in d.items():
        if valor not in inverso:
            inverso[valor] = [chave]
        else:
            inverso[valor].append(chave)
    return inverso

frequencia = {"p": 1, "a": 1, "r": 2, "o": 1, "t": 1}
print(inverte(frequencia))
```

> ⚠️ Não adicione nem remova chaves de um dicionário **enquanto** o percorre com `for`: isso gera `RuntimeError`. Percorra uma cópia (`for k in list(d):`) se precisar.

### Exercício
Escreva a função `frequencia_palavras(texto)` que retorna um dicionário com quantas vezes cada palavra aparece. Considere as palavras separadas por espaços, **ignore maiúsculas/minúsculas** e remova os sinais `.,!?` das pontas de cada palavra (use `strip(".,!?")`). Exemplo: `frequencia_palavras("Olá, olá mundo!")` retorna `{"olá": 2, "mundo": 1}`.

```python inicial
def frequencia_palavras(texto):
    pass
```

```python solucao
def frequencia_palavras(texto):
    freq = {}
    for palavra in texto.lower().split():
        palavra = palavra.strip(".,!?")
        if palavra:
            freq[palavra] = freq.get(palavra, 0) + 1
    return freq
```

```python teste
r = frequencia_palavras("Olá, olá mundo!")
assert r == {"olá": 2, "mundo": 1}, f"Esperava {{'olá': 2, 'mundo': 1}}, veio {r}"
assert frequencia_palavras("") == {}, "Texto vazio deve retornar {}"
r = frequencia_palavras("A casa. A CASA? a Casa!")
assert r == {"a": 3, "casa": 3}, f"Ignore maiúsculas e pontuação: esperava {{'a': 3, 'casa': 3}}, veio {r}"
r = frequencia_palavras("um   dois  um")
assert r == {"um": 2, "dois": 1}, f"Espaços repetidos não criam palavras vazias. Veio {r}"
```

## Conjuntos (set)
fonte: Pense em Python cap. 19.5; Documentação oficial do Python

Um **conjunto** (`set`) é uma coleção **sem ordem** e **sem itens repetidos**, como os conjuntos da matemática. Escreve-se com chaves, mas sem os pares chave:valor:

```python
primos = {2, 3, 5, 7}
repetidos = {1, 2, 2, 3, 3, 3}
print(repetidos)              # as repetições somem
print(3 in primos, 4 in primos)

vazio = set()                 # {} cria um DICIONÁRIO vazio, não um conjunto!
print(type({}), type(vazio))
```

### Removendo duplicatas

O uso mais comum: converter uma lista em conjunto elimina os repetidos.

```python
emails = ["a@x.com", "b@x.com", "a@x.com", "c@x.com", "b@x.com"]
unicos = set(emails)
print(len(emails), "->", len(unicos))
print(sorted(unicos))          # sorted devolve uma lista ordenada
```

> ⚠️ Conjuntos **não guardam a ordem**. Se a ordem original importa, use `list(dict.fromkeys(lista))`, que remove duplicatas preservando a ordem da primeira aparição.

```python
nomes = ["Bia", "Ana", "Bia", "Caio", "Ana"]
print(list(dict.fromkeys(nomes)))
```

### Adicionando e removendo

```python
s = {"a", "b"}
s.add("c")
s.add("a")          # já existe: nada muda
s.discard("z")      # remove se existir (sem erro se não existir)
s.remove("b")       # remove; gera KeyError se não existir
print(sorted(s))
```

### Operações de conjuntos

| Operação | Método | Resultado |
|---|---|---|
| União | `a.union(b)` | itens que estão em `a` **ou** em `b` |
| Interseção | `a.intersection(b)` | itens que estão em `a` **e** em `b` |
| Diferença | `a.difference(b)` | itens de `a` que **não** estão em `b` |
| Diferença simétrica | `a.symmetric_difference(b)` | itens que estão em **só um** dos dois |
| Subconjunto | `a.issubset(b)` | todos os itens de `a` estão em `b`? |

Cada método tem um operador equivalente, mais curto:

```text
a | b    união
a & b    interseção
a - b    diferença
a ^ b    diferença simétrica
a <= b   subconjunto
```

```python
python = {"Ana", "Bruno", "Carla", "Davi"}
java = {"Carla", "Davi", "Elisa"}
print("Em algum curso:", sorted(python | java))
print("Nos dois:", sorted(python & java))
print("Só Python:", sorted(python - java))
print("Só em um:", sorted(python ^ java))
print({"Carla"} <= java)
```

> 💡 Testar `x in conjunto` é muito mais rápido do que `x in lista` para coleções grandes, pelo mesmo motivo dos dicionários (*hashing*). Se você só precisa saber "está ou não está", use um conjunto.

### Exercício
Escreva a função `comuns(a, b)` que recebe duas listas e retorna uma lista **ordenada** e **sem repetições** com os itens que aparecem nas duas. Use conjuntos. Exemplo: `comuns([3, 1, 2, 3], [3, 4, 1])` retorna `[1, 3]`.

```python inicial
def comuns(a, b):
    pass
```

```python solucao
def comuns(a, b):
    return sorted(set(a) & set(b))
```

```python teste
assert comuns([3, 1, 2, 3], [3, 4, 1]) == [1, 3], f"Esperava [1, 3], veio {comuns([3, 1, 2, 3], [3, 4, 1])}"
assert comuns([1, 2], [3, 4]) == [], "Sem itens em comum: []"
assert comuns([], [1, 2]) == [], "Lista vazia: []"
assert comuns(["b", "a", "b"], ["b", "b", "a", "c"]) == ["a", "b"], "Deve funcionar com strings e remover repetições"
assert comuns([5, 5, 5], [5]) == [5], "Sem repetições no resultado"
```

## Compreensões de lista, dicionário e conjunto
fonte: Pense em Python cap. 19.2; Documentação oficial do Python

Muitos laços seguem o mesmo molde: criar uma coleção vazia, percorrer algo e adicionar um item transformado (talvez só alguns). As **compreensões** (*comprehensions*) escrevem isso numa linha:

```python
# Forma tradicional
quadrados = []
for n in range(1, 6):
    quadrados.append(n * n)
print(quadrados)

# Compreensão de lista: [expressão for variável in iterável]
quadrados = [n * n for n in range(1, 6)]
print(quadrados)
```

Leia `[n * n for n in range(1, 6)]` como: "a lista de `n * n` **para cada** `n` em `range(1, 6)`".

### Com condição (filtro)

Um `if` no final seleciona quais itens entram:

```python
numeros = [4, -2, 7, 0, -5, 10]
positivos = [n for n in numeros if n > 0]
print(positivos)

palavras = ["casa", "sol", "abacaxi", "mar", "python"]
print([p.upper() for p in palavras if len(p) > 3])
```

Para **transformar de formas diferentes** (e não filtrar), o `if/else` vai no **começo**, como uma expressão condicional:

```python
numeros = [4, -2, 7, 0, -5]
print(["par" if n % 2 == 0 else "ímpar" for n in numeros])
print([abs(n) if n < 0 else n for n in numeros])
```

### Compreensões de dicionário e de conjunto

Trocando os colchetes por chaves, criamos um **conjunto**; com `chave: valor`, um **dicionário**:

```python
palavras = ["banana", "kiwi", "uva", "kiwi"]
tamanhos = {p: len(p) for p in palavras}
print(tamanhos)

iniciais = {p[0] for p in palavras}
print(sorted(iniciais))

precos = {"café": 20, "pão": 8, "queijo": 45}
caros = {k: v for k, v in precos.items() if v > 10}
print(caros)
invertido = {v: k for k, v in precos.items()}
print(invertido)
```

### Compreensões aninhadas

Dá para usar mais de um `for`. A ordem é a mesma dos laços aninhados escritos normalmente:

```python
pares = [(x, y) for x in range(1, 4) for y in "ab"]
print(pares)

matriz = [[1, 2, 3], [4, 5, 6]]
achatada = [item for linha in matriz for item in linha]
print(achatada)
transposta = [[linha[i] for linha in matriz] for i in range(3)]
print(transposta)
```

> ⚠️ Compreensões são ótimas quando curtas. Se ficar difícil de ler (muitos `for` e `if`), volte para o laço tradicional: legibilidade vale mais que economizar linhas. E não use compreensão só para executar ações (como `print`): ela serve para **criar** coleções.

### Exercício
Escreva a função `processa(numeros)` que retorna uma tupla com dois itens, ambos criados por **compreensão**: (1) a lista dos quadrados dos números **pares** e (2) um dicionário que associa cada número **positivo** ao seu dobro. Exemplo: `processa([1, 2, -4])` retorna `([4, 16], {1: 2, 2: 4})`.

```python inicial
def processa(numeros):
    pass
```

```python solucao
def processa(numeros):
    quadrados_pares = [n * n for n in numeros if n % 2 == 0]
    dobros = {n: n * 2 for n in numeros if n > 0}
    return (quadrados_pares, dobros)
```

```python teste
r = processa([1, 2, -4])
assert r == ([4, 16], {1: 2, 2: 4}), f"processa([1, 2, -4]) deveria ser ([4, 16], {{1: 2, 2: 4}}), veio {r}"
assert processa([]) == ([], {}), "Lista vazia: ([], {})"
assert processa([0, 3]) == ([0], {3: 6}), f"0 é par mas não é positivo: esperava ([0], {{3: 6}}), veio {processa([0, 3])}"
assert processa([-1, -3]) == ([], {}), "Só negativos ímpares: ([], {})"
assert processa([6, 6]) == ([36, 36], {6: 12}), "Na lista, repetidos aparecem; no dicionário, a chave é única"
```

## Escolhendo a estrutura de dados certa
fonte: Pense em Python cap. 13, 19.5–19.6; Documentação oficial do Python

Você agora conhece quatro coleções. Escolher bem a estrutura de dados é uma das decisões mais importantes ao programar: a escolha certa deixa o código **mais simples** e **mais rápido**.

| Estrutura | Sintaxe | Ordenada? | Mutável? | Repetições? | Acesso | Ideal para |
|---|---|---|---|---|---|---|
| Lista | `[1, 2]` | sim | sim | sim | por índice | sequência de itens que cresce e muda |
| Tupla | `(1, 2)` | sim | não | sim | por índice | registro fixo, retorno múltiplo, chave de dicionário |
| Dicionário | `{"a": 1}` | ordem de inserção | sim | chaves únicas | por chave | associar chave → valor, contagem, busca rápida |
| Conjunto | `{1, 2}` | não | sim | não | só `in` | eliminar duplicatas, pertinência, operações de conjunto |

### Perguntas que ajudam a decidir

1. **Preciso acessar por posição ou manter a ordem com repetições?** Lista.
2. **Os dados formam um registro fixo que não deve mudar?** Tupla.
3. **Vou procurar algo por um nome/código?** Dicionário.
4. **Só preciso saber se algo "está ou não está", ou tirar repetidos?** Conjunto.

### Desempenho: in em lista vs. conjunto

Para verificar se um valor está numa **lista**, o Python precisa comparar item por item. Num **conjunto** ou nas chaves de um **dicionário**, ele vai direto ao lugar certo. Veja a diferença:

```python
import time

numeros_lista = list(range(100_000))
numeros_set = set(numeros_lista)

inicio = time.perf_counter()
for x in range(0, 100_000, 2000):
    x in numeros_lista
t_lista = time.perf_counter() - inicio

inicio = time.perf_counter()
for x in range(0, 100_000, 2000):
    x in numeros_set
t_set = time.perf_counter() - inicio

print(f"lista: {t_lista:.5f}s   conjunto: {t_set:.5f}s")
print("O conjunto foi bem mais rápido:", t_set < t_lista)
```

### Combinando estruturas

Problemas reais costumam combinar estruturas: uma lista de dicionários (uma tabela de registros), um dicionário de listas (agrupamentos), um dicionário com tuplas como chave (coordenadas):

```python
alunos = [
    {"nome": "Ana", "turma": "A", "nota": 9.0},
    {"nome": "Bruno", "turma": "B", "nota": 6.5},
    {"nome": "Carla", "turma": "A", "nota": 7.5},
]

por_turma = {}
for aluno in alunos:
    por_turma.setdefault(aluno["turma"], []).append(aluno["nome"])
print(por_turma)

tabuleiro = {(0, 0): "X", (1, 1): "O"}    # tuplas como chave
print(tabuleiro.get((1, 1)), tabuleiro.get((2, 2), "vazio"))
```

### Estudo de caso: análise de palavras

Juntando tudo: dado um texto, vamos descobrir as palavras mais frequentes, ignorando palavras muito comuns. Repare em como cada estrutura tem seu papel: **conjunto** para as palavras ignoradas (busca rápida), **dicionário** para contar, **lista de tuplas** para ordenar.

```python
texto = """O rato roeu a roupa do rei de Roma e a rainha de raiva
roeu o resto. O rato fugiu e o rei riu do rato."""

ignorar = {"o", "a", "do", "de", "e"}
contagem = {}
for palavra in texto.lower().split():
    palavra = palavra.strip(".,")
    if palavra and palavra not in ignorar:
        contagem[palavra] = contagem.get(palavra, 0) + 1

pares = [(qtd, palavra) for palavra, qtd in contagem.items()]
pares.sort(reverse=True)
for qtd, palavra in pares[:3]:
    print(palavra, qtd)
```

### Exercício
Escreva a função `agrupa_por_inicial(palavras)` que retorna um dicionário cuja chave é a primeira letra (em minúscula) e o valor é uma lista **ordenada** e **sem repetições** das palavras (em minúsculas) que começam com ela. Ignore strings vazias. Exemplo: `agrupa_por_inicial(["Bola", "anel", "bala", "Asa", "bola"])` retorna `{"b": ["bala", "bola"], "a": ["anel", "asa"]}`.

```python inicial
def agrupa_por_inicial(palavras):
    pass
```

```python solucao
def agrupa_por_inicial(palavras):
    grupos = {}
    for p in palavras:
        if not p:
            continue
        p = p.lower()
        grupos.setdefault(p[0], set()).add(p)
    return {letra: sorted(conj) for letra, conj in grupos.items()}
```

```python teste
r = agrupa_por_inicial(["Bola", "anel", "bala", "Asa", "bola"])
assert r == {"b": ["bala", "bola"], "a": ["anel", "asa"]}, f"Veio {r}"
assert agrupa_por_inicial([]) == {}, "Lista vazia: {}"
assert agrupa_por_inicial(["", "x"]) == {"x": ["x"]}, "Ignore strings vazias"
r = agrupa_por_inicial(["Zebra", "zebra", "ZEBRA"])
assert r == {"z": ["zebra"]}, f"Sem repetições (ignorando maiúsculas): veio {r}"
for v in agrupa_por_inicial(["c", "b", "a"]).values():
    assert isinstance(v, list), "Os valores devem ser listas (não conjuntos)"
```

## Quiz
? Qual é o resultado de `[10, 20, 30][-1]`?
- [ ] 10
- [x] 30
- [ ] -1
- [ ] IndexError
> Índices negativos contam do fim: -1 é o último item.

? Depois de `lista = [3, 1, 2]` e `lista = lista.sort()`, o que vale `lista`?
- [ ] [1, 2, 3]
- [ ] [3, 1, 2]
- [x] None
- [ ] Dá erro
> `sort()` ordena a lista no lugar e retorna `None`. Atribuir o resultado à própria variável faz você perder a lista. Use apenas `lista.sort()` ou `nova = sorted(lista)`.

? Qual a diferença entre `append` e `extend`?
- [x] `append` adiciona um único item (mesmo que seja uma lista); `extend` adiciona cada item de outra sequência
- [ ] São iguais
- [ ] `extend` adiciona no início; `append` no final
- [ ] `append` só funciona com números
> `[1].append([2, 3])` dá `[1, [2, 3]]`, enquanto `[1].extend([2, 3])` dá `[1, 2, 3]`.

? Após `a = [1, 2]`, `b = a` e `b.append(3)`, o que vale `a`?
- [ ] [1, 2]
- [x] [1, 2, 3]
- [ ] [3]
- [ ] Dá erro
> `b = a` não copia: `a` e `b` são nomes (aliases) para o mesmo objeto. Para copiar, use `a.copy()` ou `a[:]`.

? Como criar uma tupla com um único elemento, o número 5?
- [ ] (5)
- [x] (5,)
- [ ] [5]
- [ ] tuple(5)
> A vírgula é que define a tupla. `(5)` é apenas o número 5 entre parênteses.

? O que `{"a": 1}.get("b", 0)` retorna?
- [ ] None
- [ ] KeyError
- [x] 0
- [ ] "b"
> `get` retorna o valor padrão informado (0) quando a chave não existe, sem gerar erro.

? Em um dicionário `d`, o teste `x in d` verifica:
- [x] se `x` é uma das chaves
- [ ] se `x` é um dos valores
- [ ] se `x` é chave ou valor
- [ ] se `x` é um par (chave, valor)
> O operador `in` em dicionários olha apenas as chaves. Para valores, use `x in d.values()`.

? Qual o resultado de `{1, 2, 3} & {2, 3, 4}`?
- [ ] {1, 2, 3, 4}
- [x] {2, 3}
- [ ] {1, 4}
- [ ] {1}
> `&` é a interseção: itens presentes nos dois conjuntos. `|` seria a união e `^` a diferença simétrica ({1, 4}).

? O que `[n * 2 for n in range(5) if n % 2 == 1]` produz?
- [ ] [0, 2, 4, 6, 8]
- [x] [2, 6]
- [ ] [1, 3]
- [ ] [0, 4, 8]
> Só os ímpares (1 e 3) passam pelo filtro, e cada um é dobrado: [2, 6].

? Você precisa guardar coordenadas (x, y) como chaves de um dicionário. Que tipo usar para a chave?
- [ ] Lista, como [x, y]
- [x] Tupla, como (x, y)
- [ ] Conjunto, como {x, y}
- [ ] Dicionário, como {"x": x, "y": y}
> Chaves de dicionário precisam ser imutáveis (hashable). Tuplas servem; listas, conjuntos e dicionários não. Além disso, um conjunto perderia a ordem e juntaria x e y iguais.
