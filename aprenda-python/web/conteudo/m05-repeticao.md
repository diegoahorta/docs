# Estruturas de repetição
id: m05
nivel: Básico
icone: 🔁
descricao: Repita ações com while e for, use range, acumuladores, break/continue, laços aninhados e implemente algoritmos clássicos.

## O laço while
fonte: Python do Zero p. 38; Pense em Python cap. 7.3

Computadores são ótimos para fazer a mesma coisa muitas vezes sem errar nem cansar. Em programação, repetir um bloco de código se chama **iteração**, e a estrutura que faz isso é o **laço** (*loop*).

O laço mais simples é o `while` ("enquanto"): **enquanto** a condição for verdadeira, o bloco indentado é executado de novo.

```python
contador = 1
while contador <= 5:
    print("Volta número", contador)
    contador = contador + 1
print("Fim do laço! contador vale", contador)
```

O fluxo de execução de um `while` é sempre este:

1. Avalia a condição, que resulta em `True` ou `False`.
2. Se for `False`, sai do laço e continua na primeira linha depois do bloco.
3. Se for `True`, executa o bloco inteiro e **volta ao passo 1**.

Cada execução do bloco é chamada de **iteração** (ou "volta"). Repare que a condição só é testada **no início** de cada volta: se ela já começar falsa, o bloco não roda nenhuma vez.

```python
n = 10
while n < 5:
    print("isto nunca aparece")
print("O laço foi pulado, pois 10 < 5 é falso")
```

### As três partes de um laço com contador

Quase todo `while` com contador tem três ingredientes. Se faltar algum, o laço não funciona:

| Parte | Exemplo | Para que serve |
|---|---|---|
| Inicialização | `i = 0` | dá o valor inicial à variável de controle, **antes** do laço |
| Condição de parada | `while i < 10:` | decide se continua ou para |
| Atualização | `i += 1` | muda a variável a cada volta, aproximando o fim |

> 💡 `i += 1` é um atalho para `i = i + 1`. Também existem `-=`, `*=`, `/=` e `//=`.

### Laço infinito

Se a condição **nunca** ficar falsa, o laço roda para sempre: é um **laço infinito**. O erro mais comum é esquecer a atualização:

```python nao-executar
i = 1
while i <= 5:
    print(i)
    # esqueci o i += 1: i vale 1 para sempre e o laço nunca termina!
```

> ⚠️ Num laço infinito o programa "trava". No computador, interrompa com **Ctrl+C**. Neste app, a execução é cancelada automaticamente depois de alguns segundos.

Outras causas de laço infinito: atualizar na direção errada (`i -= 1` quando a condição é `i <= 5`) ou usar uma condição que pula o valor de parada, como `while i != 10` com `i` crescendo de 3 em 3 a partir de 0 (0, 3, 6, 9, 12... nunca vale 10). Prefira condições com `<`, `<=`, `>` ou `>=` em vez de `!=`.

### Laço com condição que não é contador

O `while` brilha quando **não sabemos** quantas voltas serão necessárias. Por exemplo: quantas vezes dá para dividir um número por 2 até chegar a 1?

```python
n = 1000
passos = 0
while n > 1:
    n = n // 2
    passos += 1
print("Foram necessárias", passos, "divisões")
```

Outro uso clássico é o **laço com sentinela**: repetir até aparecer um valor especial. Às vezes é mais claro escrever `while True:` e sair com `break` (que você verá em detalhes adiante):

```python
valores = [7, 3, 9, -1, 4]   # -1 é a sentinela: indica "acabou"
i = 0
while True:
    if valores[i] == -1:
        break
    print("Processando", valores[i])
    i += 1
```

### Exercício
Escreva a função `contagem(n)` que **retorna** uma string com os números de `n` até 1, separados por espaço, seguidos de `"Fogo!"`. Use `while`. Exemplo: `contagem(3)` retorna `"3 2 1 Fogo!"`. Se `n` for 0 ou negativo, retorne apenas `"Fogo!"`.

```python inicial
def contagem(n):
    pass
```

```python solucao
def contagem(n):
    texto = ""
    while n > 0:
        texto += str(n) + " "
        n -= 1
    return texto + "Fogo!"
```

```python teste
assert contagem(3) == "3 2 1 Fogo!", f"contagem(3) deveria ser '3 2 1 Fogo!', veio {contagem(3)!r}"
assert contagem(1) == "1 Fogo!", f"contagem(1) deveria ser '1 Fogo!', veio {contagem(1)!r}"
assert contagem(5) == "5 4 3 2 1 Fogo!", f"contagem(5) veio {contagem(5)!r}"
assert contagem(0) == "Fogo!", f"contagem(0) deveria ser apenas 'Fogo!', veio {contagem(0)!r}"
assert contagem(-4) == "Fogo!", f"contagem(-4) deveria ser apenas 'Fogo!', veio {contagem(-4)!r}"
```

## O laço for e as sequências
fonte: Python do Zero p. 39; Pense em Python cap. 4.2, 8.3

O `for` percorre os itens de uma **sequência**, um de cada vez. A cada volta, a variável do laço recebe o próximo item:

```python
for fruta in ["maçã", "banana", "uva"]:
    print("Eu gosto de", fruta)
```

Leia assim: "**para cada** fruta **em** a lista, faça...". Não precisamos de contador, nem de condição, nem de atualização: o `for` cuida de tudo e para sozinho quando os itens acabam. Por isso ele é **menos sujeito a erros** que o `while`.

### Percorrendo strings

Uma string é uma sequência de caracteres, então o `for` também a percorre, letra por letra. Esse padrão é chamado de **travessia**:

```python
for letra in "Python":
    print(letra, end=" ")
print()

vogais = 0
for c in "programação em python":
    if c in "aeiouáéíóúãõâêô":
        vogais += 1
print("Vogais:", vogais)
```

### O que pode vir depois do `in`?

Qualquer **iterável**: strings, listas, tuplas, dicionários, conjuntos, `range`, arquivos... Você conhecerá vários desses no próximo módulo.

```python
for numero in (10, 20, 30):          # tupla
    print(numero * 2)

for chave in {"a": 1, "b": 2}:       # dicionário: percorre as chaves
    print("chave:", chave)
```

### while ou for?

| Situação | Use |
|---|---|
| Percorrer todos os itens de uma coleção | `for` |
| Repetir um número conhecido de vezes | `for` com `range` |
| Repetir até uma condição mudar (não se sabe quantas voltas) | `while` |
| Esperar um valor válido do usuário | `while` |

> ⚠️ A variável do `for` é uma variável comum: depois do laço, ela continua existindo com o **último** valor. Evite reutilizar esse nome para outra coisa sem perceber.

```python
for x in [1, 2, 3]:
    pass        # pass: "não faça nada" (o bloco não pode ficar vazio)
print("Depois do laço, x =", x)
```

### Exercício
Escreva a função `conta_letra(texto, letra)` que retorna quantas vezes `letra` aparece em `texto`, **sem** usar o método `count`. Percorra a string com `for`. A comparação deve ignorar maiúsculas/minúsculas: `conta_letra("Banana", "a")` retorna `3` e `conta_letra("Arara", "A")` retorna `3`.

```python inicial
def conta_letra(texto, letra):
    pass
```

```python solucao
def conta_letra(texto, letra):
    total = 0
    for c in texto.lower():
        if c == letra.lower():
            total += 1
    return total
```

```python teste
assert conta_letra("Banana", "a") == 3, f"conta_letra('Banana', 'a') deveria ser 3, veio {conta_letra('Banana', 'a')}"
assert conta_letra("Arara", "A") == 3, f"conta_letra('Arara', 'A') deveria ser 3 (ignore maiúsculas), veio {conta_letra('Arara', 'A')}"
assert conta_letra("Python", "z") == 0, "Se a letra não aparece, o resultado é 0"
assert conta_letra("", "a") == 0, "Texto vazio deve dar 0"
assert conta_letra("MISSISSIPPI", "s") == 4, f"conta_letra('MISSISSIPPI', 's') deveria ser 4"
```

## range(): contando com o for
fonte: Python do Zero p. 39; Documentação oficial do Python

A função `range` gera uma sequência de números inteiros. Ela é a forma padrão de repetir algo um número fixo de vezes. Há três formas de chamá-la:

| Chamada | Gera | Observação |
|---|---|---|
| `range(n)` | 0, 1, ..., n-1 | `n` números, começando em 0 |
| `range(i, n)` | i, i+1, ..., n-1 | começa em `i`, **para antes** de `n` |
| `range(i, n, p)` | i, i+p, i+2p, ... | passo `p` (pode ser negativo) |

O valor final **nunca é incluído**. É a mesma regra do fatiamento de strings.

```python
for i in range(5):
    print(i, end=" ")
print()
for i in range(3, 8):
    print(i, end=" ")
print()
for i in range(0, 20, 5):
    print(i, end=" ")
print()
```

Para ver todos os números de uma vez, converta para lista com `list()`:

```python
print(list(range(5)))
print(list(range(2, 11, 2)))    # pares de 2 a 10
print(list(range(1, 10, 3)))
print(list(range(5, 5)))        # vazio: começo == fim
```

### Contagem regressiva

Com passo negativo, o `range` conta para trás. O início deve ser **maior** que o fim:

```python
for i in range(10, 0, -1):
    print(i, end=" ")
print("Feliz Ano Novo!")

print(list(range(10, 0, -3)))
print(list(range(0, 10, -1)))   # vazio: não dá para ir de 0 até 10 descendo
```

> ⚠️ `range(1, 10)` vai de 1 a **9**. Para incluir o 10, escreva `range(1, 11)`. Esse "erro de um" (*off-by-one*) é um dos bugs mais comuns em laços.

### Repetir sem usar a variável

Quando só importa repetir, sem usar o número, a convenção é chamar a variável de `_`:

```python
for _ in range(3):
    print("Hip hip, hurra!")
```

### range com o tamanho de uma sequência

`range(len(seq))` gera os **índices** válidos de uma sequência. É útil quando você precisa da posição, por exemplo para comparar um item com o vizinho:

```python
palavra = "carro"
for i in range(len(palavra) - 1):
    if palavra[i] == palavra[i + 1]:
        print("Letra dobrada na posição", i, ":", palavra[i])
```

> 💡 Se você só precisa dos itens, prefira `for item in seq`. Se precisa de item **e** índice, a lição sobre `enumerate` mostra um jeito melhor.

### Exercício
Escreva a função `multiplos(n, limite)` que retorna uma **lista** com todos os múltiplos positivos de `n` menores ou iguais a `limite`, usando `range` com passo. Exemplo: `multiplos(3, 10)` retorna `[3, 6, 9]`; `multiplos(5, 4)` retorna `[]`.

```python inicial
def multiplos(n, limite):
    pass
```

```python solucao
def multiplos(n, limite):
    return list(range(n, limite + 1, n))
```

```python teste
assert multiplos(3, 10) == [3, 6, 9], f"multiplos(3, 10) deveria ser [3, 6, 9], veio {multiplos(3, 10)}"
assert multiplos(5, 20) == [5, 10, 15, 20], f"multiplos(5, 20) deve incluir o 20, veio {multiplos(5, 20)}"
assert multiplos(5, 4) == [], f"multiplos(5, 4) deveria ser [], veio {multiplos(5, 4)}"
assert multiplos(1, 3) == [1, 2, 3], f"multiplos(1, 3) veio {multiplos(1, 3)}"
assert multiplos(7, 7) == [7], f"multiplos(7, 7) deveria ser [7], veio {multiplos(7, 7)}"
```

## Acumuladores e contadores
fonte: Pense em Python cap. 10.7; Python do Zero p. 38–39

Dois padrões aparecem em quase todo programa com laços:

- **contador**: variável que começa em 0 e **soma 1** cada vez que algo acontece;
- **acumulador**: variável que começa num valor neutro e **acumula** um resultado a cada volta (soma, produto, texto...).

O valor inicial importa: soma começa em `0`, produto começa em `1`, texto começa em `""`.

```python
notas = [7.5, 8.0, 5.5, 9.0, 6.0]
soma = 0          # acumulador
aprovados = 0     # contador
for nota in notas:
    soma += nota
    if nota >= 7:
        aprovados += 1
media = soma / len(notas)
print(f"Soma: {soma}  Média: {media:.2f}  Aprovados: {aprovados}")
```

### Máximo e mínimo "na mão"

Para achar o maior valor, guardamos o **melhor até agora** e trocamos sempre que aparecer um maior. Começar com o primeiro item evita problemas com números negativos:

```python
temperaturas = [-3, -8, -1, -12, -5]
maior = temperaturas[0]
menor = temperaturas[0]
for t in temperaturas[1:]:
    if t > maior:
        maior = t
    if t < menor:
        menor = t
print("Máxima:", maior, "Mínima:", menor)
```

> ⚠️ Inicializar `maior = 0` parece natural, mas está errado: com a lista acima (só negativos), o resultado seria `0`, que nem está na lista!

Claro que Python já tem `sum`, `max`, `min` e `len` prontos. Mas entender o padrão do acumulador é essencial, pois você vai usá-lo em situações em que não há função pronta, como "a palavra mais longa" ou "o produto dos números pares":

```python
print(sum([1, 2, 3]), max([4, 9, 2]), min("python"))

produto = 1
for n in range(1, 11):
    if n % 2 == 0:
        produto *= n
print("Produto dos pares de 1 a 10:", produto)

mais_longa = ""
for p in "o rato roeu a roupa do rei de roma".split():
    if len(p) > len(mais_longa):
        mais_longa = p
print("Palavra mais longa:", mais_longa)
```

### Acumulando em listas

O acumulador também pode ser uma lista que começa vazia e recebe itens com `append`. Esse padrão é chamado de **filtragem** (quando seleciona alguns itens) ou **mapeamento** (quando transforma cada item):

```python
numeros = [4, 11, 8, 3, 15, 6]
pares = []
dobros = []
for n in numeros:
    if n % 2 == 0:
        pares.append(n)       # filtragem
    dobros.append(n * 2)      # mapeamento
print(pares)
print(dobros)
```

### Exercício
Escreva a função `estatisticas(valores)` que recebe uma lista **não vazia** de números e retorna uma tupla `(soma, media, maior, menor)`. **Não** use `sum`, `max` nem `min`: use acumuladores. Exemplo: `estatisticas([2, 8, 5])` retorna `(15, 5.0, 8, 2)`.

```python inicial
def estatisticas(valores):
    pass
```

```python solucao
def estatisticas(valores):
    soma = 0
    maior = valores[0]
    menor = valores[0]
    for v in valores:
        soma += v
        if v > maior:
            maior = v
        if v < menor:
            menor = v
    return (soma, soma / len(valores), maior, menor)
```

```python teste
import builtins
r = estatisticas([2, 8, 5])
assert r == (15, 5.0, 8, 2), f"estatisticas([2, 8, 5]) deveria ser (15, 5.0, 8, 2), veio {r}"
r = estatisticas([-4, -9, -1])
assert r == (-14, -14 / 3, -1, -9), f"Com só negativos, o maior é -1 e o menor -9. Veio {r}. Você inicializou o máximo com 0?"
r = estatisticas([42])
assert r == (42, 42.0, 42, 42), f"Com um único valor, veio {r}"
r = estatisticas([3, 3, 10, 0])
assert r == (16, 4.0, 10, 0), f"estatisticas([3, 3, 10, 0]) veio {r}"
_orig = (builtins.sum, builtins.max, builtins.min)
def _proibido(*a, **k):
    raise AssertionError("Não use sum, max ou min neste exercício: use acumuladores")
builtins.sum = builtins.max = builtins.min = _proibido
try:
    estatisticas([1, 2, 3])
finally:
    builtins.sum, builtins.max, builtins.min = _orig
```

## break, continue e else em laços
fonte: Pense em Python cap. 7.4; Documentação oficial do Python

Três comandos dão controle fino sobre um laço:

| Comando | Efeito |
|---|---|
| `break` | sai do laço **imediatamente**, ignorando o resto das voltas |
| `continue` | pula o resto **desta** volta e vai para a próxima |
| `else` (do laço) | bloco que roda quando o laço termina **sem** `break` |

### break: parar quando achou

```python
numeros = [5, 12, 7, 30, 8, 41]
for n in numeros:
    if n > 20:
        print("Primeiro número maior que 20:", n)
        break
    print("Verificado:", n)
```

Note que 8 e 41 nem são examinados: depois de achar o 30, não há motivo para continuar. Isso economiza trabalho.

### continue: pular alguns itens

```python
for n in range(1, 11):
    if n % 3 == 0:
        continue          # pula os múltiplos de 3
    print(n, end=" ")
print()
```

> 💡 Muitas vezes um `if` resolve sem `continue`. Use `continue` quando ele **simplificar** o código, por exemplo para descartar casos inválidos logo no começo da volta e evitar muitos níveis de indentação.

### else em laços: "não achei"

O `else` de um laço é um recurso pouco conhecido, mas muito útil para buscas. Ele roda se o laço chegou ao fim **naturalmente**, ou seja, sem passar por um `break`:

```python
def procura(lista, alvo):
    for item in lista:
        if item == alvo:
            print(alvo, "encontrado!")
            break
    else:
        print(alvo, "não está na lista")

procura([3, 8, 1], 8)
procura([3, 8, 1], 5)
```

O `while` também aceita `else`, com a mesma regra:

```python
n = 3
while n > 0:
    print("n =", n)
    n -= 1
else:
    print("O while terminou normalmente (sem break)")
```

> ⚠️ O `else` do laço deve ficar **alinhado com o `for`/`while`**, não com o `if` de dentro. Se estiver alinhado com o `if`, ele vira o `else` do `if`, com outro significado!

### break em laços aninhados

O `break` só sai do laço **mais interno** em que está. Para sair de vários níveis de uma vez, costuma-se colocar os laços numa função e usar `return`:

```python
def primeiro_par_com_soma(alvo):
    for a in range(10):
        for b in range(10):
            if a + b == alvo:
                return (a, b)     # sai das duas repetições de uma vez
    return None

print(primeiro_par_com_soma(7))
print(primeiro_par_com_soma(50))
```

### Exercício
Escreva a função `primeiro_negativo(numeros)` que retorna a **posição** (índice) do primeiro número negativo da lista. Se não houver nenhum, retorne `-1`. Use um laço com `break` ou `return`. Exemplo: `primeiro_negativo([4, 0, -2, -7])` retorna `2`.

```python inicial
def primeiro_negativo(numeros):
    pass
```

```python solucao
def primeiro_negativo(numeros):
    for i in range(len(numeros)):
        if numeros[i] < 0:
            return i
    return -1
```

```python teste
assert primeiro_negativo([4, 0, -2, -7]) == 2, f"Esperava 2, veio {primeiro_negativo([4, 0, -2, -7])}"
assert primeiro_negativo([-1, 5]) == 0, "Se o primeiro já é negativo, a resposta é 0"
assert primeiro_negativo([1, 2, 3]) == -1, "Sem negativos, deve retornar -1"
assert primeiro_negativo([]) == -1, "Lista vazia deve retornar -1"
assert primeiro_negativo([0, 0, 0, -0.5]) == 3, "0 não é negativo; -0.5 é"
```

## Laços aninhados
fonte: Pense em Python cap. 7; Python do Zero p. 39

Um laço pode ficar dentro de outro: são os **laços aninhados**. Para **cada** volta do laço de fora, o laço de dentro roda **inteiro**. Com 3 voltas fora e 4 dentro, o bloco interno executa 3 × 4 = 12 vezes.

```python
for linha in range(1, 4):
    for coluna in range(1, 5):
        print(f"({linha},{coluna})", end=" ")
    print()      # quebra de linha depois de cada linha completa
```

### Tabuada

O exemplo clássico: a tabuada do 1 ao 5, com os números alinhados graças à formatação `:3` (largura mínima de 3 caracteres):

```python
for i in range(1, 6):
    for j in range(1, 11):
        print(f"{i * j:3}", end=" ")
    print()
```

### Desenhando padrões com *

Padrões com asteriscos treinam o raciocínio de laços aninhados. A chave é descobrir, **para cada linha**, quantos símbolos (e espaços) imprimir:

```python
n = 5
print("Triângulo:")
for i in range(1, n + 1):
    for _ in range(i):
        print("*", end="")
    print()

print("Pirâmide:")
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))
```

Repare que, no segundo desenho, a repetição de strings (`"*" * k`) substitui o laço interno. Em Python isso é comum e deixa o código mais curto.

### Comparando todos os pares

Laços aninhados servem para comparar cada item com todos os outros. Começar o laço interno em `i + 1` evita comparar um item com ele mesmo e repetir pares:

```python
nomes = ["Ana", "Bia", "Caio", "Davi"]
for i in range(len(nomes)):
    for j in range(i + 1, len(nomes)):
        print(nomes[i], "x", nomes[j])
```

> ⚠️ Laços aninhados multiplicam o trabalho. Dois laços de 1.000 voltas cada fazem 1.000.000 de operações. Para listas grandes, isso pode ficar lento: no módulo de algoritmos você aprenderá a medir e evitar isso.

### Exercício
Escreva a função `retangulo(largura, altura)` que **retorna** (não imprime) uma string representando um retângulo de `#`, com as linhas separadas por `"\n"` e sem `"\n"` no final. A borda é de `#` e o interior é de espaços. Exemplo: `retangulo(4, 3)` retorna `"####\n#  #\n####"`. Se a altura for 1, é só uma linha de `#`; se a largura for 1, cada linha tem um único `#`.

```python inicial
def retangulo(largura, altura):
    pass
```

```python solucao
def retangulo(largura, altura):
    linhas = []
    for i in range(altura):
        linha = ""
        for j in range(largura):
            if i == 0 or i == altura - 1 or j == 0 or j == largura - 1:
                linha += "#"
            else:
                linha += " "
        linhas.append(linha)
    return "\n".join(linhas)
```

```python teste
assert retangulo(4, 3) == "####\n#  #\n####", f"retangulo(4, 3) veio:\n{retangulo(4, 3)}"
assert retangulo(2, 2) == "##\n##", f"retangulo(2, 2) veio {retangulo(2, 2)!r}"
assert retangulo(5, 1) == "#####", f"retangulo(5, 1) deveria ser '#####', veio {retangulo(5, 1)!r}"
assert retangulo(1, 3) == "#\n#\n#", f"retangulo(1, 3) veio {retangulo(1, 3)!r}"
assert retangulo(3, 4) == "###\n# #\n# #\n###", f"retangulo(3, 4) veio {retangulo(3, 4)!r}"
assert not retangulo(4, 3).endswith("\n"), "Não deixe '\\n' no final da string"
```

## enumerate e zip
fonte: Pense em Python cap. 12.5; Documentação oficial do Python

### enumerate: item e posição juntos

Quando você precisa do item **e** do índice, `enumerate` entrega os dois a cada volta. É mais legível que `range(len(...))`:

```python
tarefas = ["estudar", "treinar", "ler"]
for i, tarefa in enumerate(tarefas):
    print(i, tarefa)

print("Começando do 1:")
for num, tarefa in enumerate(tarefas, start=1):
    print(f"{num}. {tarefa}")
```

Cada volta do `enumerate` produz um par `(índice, item)`, e escrever `for i, tarefa in ...` **desempacota** esse par em duas variáveis. Você verá desempacotamento com mais detalhes nas tuplas.

```python
print(list(enumerate("abc")))
```

### zip: percorrer duas sequências em paralelo

`zip` junta sequências **lado a lado**, como um zíper. A cada volta, você recebe um item de cada uma:

```python
nomes = ["Ana", "Bruno", "Carla"]
notas = [9.5, 7.0, 8.3]
for nome, nota in zip(nomes, notas):
    print(f"{nome}: {nota}")

print(list(zip("abc", [1, 2, 3])))
```

> ⚠️ Se as sequências tiverem tamanhos diferentes, `zip` para na **mais curta**, sem avisar. Para exigir o mesmo tamanho, use `zip(a, b, strict=True)`, que gera erro se não baterem.

```python
print(list(zip([1, 2, 3, 4], ["um", "dois"])))  # o 3 e o 4 somem!
```

```python erro
print(list(zip([1, 2, 3], ["um", "dois"], strict=True)))
```

### Combinando os dois

Dá para usar `enumerate` e `zip` juntos. Note os parênteses para desempacotar o par interno:

```python
a = "carro"
b = "cerro"
for i, (x, y) in enumerate(zip(a, b)):
    if x != y:
        print(f"Diferença na posição {i}: {x!r} vs {y!r}")
```

### Exercício
Escreva a função `diferencas(a, b)` que recebe duas strings **do mesmo tamanho** e retorna uma lista com as posições em que os caracteres diferem. Use `enumerate` e `zip`. Exemplo: `diferencas("gato", "rato")` retorna `[0]` e `diferencas("abc", "abc")` retorna `[]`.

```python inicial
def diferencas(a, b):
    pass
```

```python solucao
def diferencas(a, b):
    posicoes = []
    for i, (x, y) in enumerate(zip(a, b)):
        if x != y:
            posicoes.append(i)
    return posicoes
```

```python teste
assert diferencas("gato", "rato") == [0], f"diferencas('gato', 'rato') deveria ser [0], veio {diferencas('gato', 'rato')}"
assert diferencas("abc", "abc") == [], "Strings iguais: lista vazia"
assert diferencas("abcd", "xbcy") == [0, 3], f"Esperava [0, 3], veio {diferencas('abcd', 'xbcy')}"
assert diferencas("", "") == [], "Strings vazias: lista vazia"
assert diferencas("AaA", "aaa") == [0, 2], "Maiúscula e minúscula são caracteres diferentes"
```

## Algoritmos clássicos com laços
fonte: Pense em Python cap. 6.5, 7.5–7.6; Python do Zero p. 38–39

Um **algoritmo** é um processo mecânico, passo a passo, para resolver uma categoria de problemas. Os laços são a ferramenta principal para escrever algoritmos. Vamos ver alguns que todo programador conhece.

### Fatorial

O fatorial de *n* (escrito *n!*) é o produto 1 × 2 × ... × n, e por definição 0! = 1. É um acumulador de produto:

```python
def fatorial(n):
    resultado = 1
    for i in range(2, n + 1):
        resultado *= i
    return resultado

for n in [0, 1, 5, 10]:
    print(f"{n}! = {fatorial(n)}")
print("20! =", fatorial(20))   # inteiros em Python não têm limite de tamanho
```

### Fibonacci

Na sequência de Fibonacci, cada termo é a soma dos dois anteriores: 0, 1, 1, 2, 3, 5, 8, 13... Basta guardar os dois últimos e "andar" com eles. A atribuição múltipla `a, b = b, a + b` calcula os dois valores da direita **antes** de atribuir:

```python
a, b = 0, 1
for _ in range(12):
    print(a, end=" ")
    a, b = b, a + b
print()
```

### Números primos

Um número maior que 1 é **primo** se só é divisível por 1 e por ele mesmo. Testamos os divisores possíveis e paramos no primeiro que dividir. Basta testar até a raiz quadrada: se *n* = *a* × *b*, um dos fatores é no máximo √n.

```python
def eh_primo(n):
    if n < 2:
        return False
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True

for n in range(30):
    if eh_primo(n):
        print(n, end=" ")
print()
print(eh_primo(97), eh_primo(91))   # 91 = 7 x 13
```

### MDC pelo algoritmo de Euclides

O máximo divisor comum (MDC) de dois números pode ser achado com um dos algoritmos mais antigos que existem, descrito por Euclides há mais de 2.000 anos: **o MDC de a e b é igual ao MDC de b e do resto de a por b**. Repetimos até o resto ser zero:

```python
def mdc(a, b):
    while b != 0:
        a, b = b, a % b
    return a

print(mdc(48, 18))    # 48,18 -> 18,12 -> 12,6 -> 6,0 -> 6
print(mdc(17, 5))     # primos entre si: MDC 1
print(mdc(100, 75))
```

### Raiz quadrada pelo método de Newton

Laços são muito usados em cálculos numéricos que **melhoram uma aproximação** a cada volta. O método de Newton calcula a raiz quadrada de *a* assim: comece com um chute *x* qualquer (positivo) e calcule uma estimativa melhor:

*y = (x + a/x) / 2*

Repita até a estimativa parar de mudar. Como números `float` são aproximados, não é seguro testar `x == y`; testamos se a diferença ficou muito pequena:

```python
def raiz(a):
    x = a / 2 if a > 1 else 1.0    # chute inicial
    while True:
        y = (x + a / x) / 2
        print("estimativa:", y)
        if abs(y - x) < 1e-10:
            break
        x = y
    return y

print("Raiz de 2:", raiz(2))
print("Raiz de 144:", raiz(144))
```

Repare como a estimativa converge rapidamente: a cada volta, o número de dígitos corretos mais ou menos dobra.

> ⚠️ Comparar floats com `==` é perigoso: `0.1 + 0.2 == 0.3` é `False`! Use uma tolerância, como `abs(a - b) < 1e-9`, ou `math.isclose(a, b)`.

### Exercício
Escreva a função `soma_digitos(n)` que retorna a soma dos dígitos de um inteiro não negativo usando `while`, `%` e `//` (**sem** converter para string). Exemplo: `soma_digitos(1234)` retorna `10` e `soma_digitos(0)` retorna `0`.

Dica: `n % 10` dá o último dígito e `n // 10` remove o último dígito.

```python inicial
def soma_digitos(n):
    pass
```

```python solucao
def soma_digitos(n):
    soma = 0
    while n > 0:
        soma += n % 10
        n //= 10
    return soma
```

```python teste
assert soma_digitos(1234) == 10, f"soma_digitos(1234) deveria ser 10, veio {soma_digitos(1234)}"
assert soma_digitos(0) == 0, f"soma_digitos(0) deveria ser 0, veio {soma_digitos(0)}"
assert soma_digitos(7) == 7, "Um único dígito: a soma é ele mesmo"
assert soma_digitos(1000) == 1, f"soma_digitos(1000) deveria ser 1, veio {soma_digitos(1000)}"
assert soma_digitos(99999) == 45, f"soma_digitos(99999) deveria ser 45"
assert soma_digitos(2 ** 100) == sum(int(c) for c in str(2 ** 100)), "Falhou para um número muito grande"
```

## Depurando laços: rastreamento
fonte: Pense em Python cap. 7.8 e Apêndice A

Laços são uma fonte frequente de bugs: o laço roda uma vez a mais ou a menos, nunca termina, ou o acumulador começa com o valor errado. A ferramenta mais poderosa para encontrá-los é o **rastreamento** (*trace*): simular a execução à mão, anotando o valor das variáveis a cada volta numa **tabela**.

Veja este código, que calcula 2 + 4 + 6 + 8:

```python
total = 0
i = 2
while i <= 8:
    total += i
    i += 2
print(total)
```

A tabela de rastreamento fica assim (cada linha é o estado **ao final** de uma volta):

| Volta | i (antes) | condição `i <= 8` | total | i (depois) |
|---|---|---|---|---|
| 1 | 2 | True | 2 | 4 |
| 2 | 4 | True | 6 | 6 |
| 3 | 6 | True | 12 | 8 |
| 4 | 8 | True | 20 | 10 |
| — | 10 | False | (sai) | |

Fazer isso no papel parece lento, mas é exatamente o que um bom programador faz mentalmente. Muitas vezes você descobre o erro na segunda linha da tabela.

### Deixe o programa fazer a tabela

Um `print` dentro do laço mostra o estado das variáveis a cada volta. A f-string com `=` (`f"{i=}"`) imprime o nome e o valor, o que é ótimo para depurar:

```python
total = 0
for i in range(1, 5):
    total += i * i
    print(f"{i=} {total=}")
print("Resultado:", total)
```

### Estratégias de depuração

1. **Teste com casos pequenos**: uma lista de 3 itens, n = 0, n = 1. É fácil prever o resultado à mão.
2. **Teste os casos-limite**: lista vazia, um só item, todos iguais, valores negativos.
3. **Verifique a primeira e a última volta**: a maioria dos bugs de laço está nas bordas (*off-by-one*).
4. **Depuração por bisseção**: se o programa é grande, coloque um `print` no meio. Se o valor está certo ali, o problema está na segunda metade; senão, na primeira. Repita.
5. **Desconfie do valor inicial** do acumulador (0? 1? primeiro item?).

Exemplo de bug clássico: queríamos somar os números de 1 a 5 (resultado 15).

```python
soma = 0
for i in range(1, 5):       # bug: range(1, 5) para no 4!
    soma += i
print("Com bug:", soma)

soma = 0
for i in range(1, 6):       # corrigido
    soma += i
print("Corrigido:", soma)
```

> 💡 Se um laço parece infinito, coloque um `print` da variável de controle dentro dele. Você verá na hora se ela está mudando na direção certa.

### Exercício
A função abaixo deveria retornar a média dos números **positivos** da lista (ignorando zeros e negativos), e `0` se não houver positivos. Ela tem **três** bugs. Rastreie, encontre e corrija. Exemplo: `media_positivos([4, -2, 6, 0])` deve retornar `5.0`.

```python inicial
def media_positivos(numeros):
    soma = 0
    qtd = 1
    for i in range(1, len(numeros)):
        if numeros[i] >= 0:
            soma += numeros[i]
            qtd += 1
    return soma / qtd
```

```python solucao
def media_positivos(numeros):
    soma = 0
    qtd = 0
    for n in numeros:
        if n > 0:
            soma += n
            qtd += 1
    if qtd == 0:
        return 0
    return soma / qtd
```

```python teste
assert media_positivos([4, -2, 6, 0]) == 5.0, f"media_positivos([4, -2, 6, 0]) deveria ser 5.0, veio {media_positivos([4, -2, 6, 0])}"
assert media_positivos([10]) == 10.0, f"media_positivos([10]) deveria ser 10.0, veio {media_positivos([10])}. O primeiro item está sendo considerado?"
assert media_positivos([0, 0, 3]) == 3.0, f"Zeros não são positivos: media_positivos([0, 0, 3]) deveria ser 3.0, veio {media_positivos([0, 0, 3])}"
assert media_positivos([-1, -5]) == 0, "Sem positivos, deve retornar 0"
assert media_positivos([]) == 0, "Lista vazia deve retornar 0 (sem divisão por zero!)"
```

## Quiz
? Quantas vezes o bloco de `while i < 5:` é executado se `i` começa em 0 e é incrementado de 1 em 1?
- [ ] 4
- [x] 5
- [ ] 6
- [ ] Infinitas vezes
> Para i = 0, 1, 2, 3 e 4 a condição é verdadeira: 5 voltas. Quando i chega a 5, a condição fica falsa e o laço termina.

? O que causa um laço infinito no código `i = 1` / `while i <= 10: print(i)`?
- [ ] A condição usa `<=` em vez de `<`
- [x] A variável `i` nunca é atualizada dentro do laço
- [ ] O `print` não pode ficar dentro do `while`
- [ ] Falta um `else`
> Sem `i += 1`, `i` vale 1 para sempre e a condição nunca fica falsa.

? Qual é o resultado de `list(range(2, 10, 3))`?
- [ ] [2, 5, 8, 11]
- [x] [2, 5, 8]
- [ ] [3, 6, 9]
- [ ] [2, 3, 4, 5, 6, 7, 8, 9]
> Começa em 2 e soma 3 a cada passo: 2, 5, 8. O próximo seria 11, que passa do fim (10, que nunca é incluído).

? Como gerar os números 5, 4, 3, 2, 1 com range?
- [ ] range(5, 1)
- [ ] range(5, 0)
- [x] range(5, 0, -1)
- [ ] range(1, 5, -1)
> Com passo -1 o range conta para trás, e o fim (0) não é incluído. range(5, 0) sem passo é vazio.

? Qual a diferença entre `break` e `continue`?
- [x] `break` encerra o laço; `continue` pula para a próxima volta
- [ ] `break` pula para a próxima volta; `continue` encerra o laço
- [ ] Os dois encerram o laço
- [ ] `continue` só funciona no while
> `break` sai do laço imediatamente; `continue` abandona apenas a volta atual.

? Quando o bloco `else` de um `for` é executado?
- [ ] Quando a lista está vazia, apenas
- [ ] Sempre que o `if` de dentro do laço for falso
- [x] Quando o laço termina sem ter passado por um `break`
- [ ] Nunca: `for` não aceita `else`
> O `else` do laço roda no término "natural". Se um `break` interromper o laço, o `else` é pulado. (Uma lista vazia também cai no `else`, pois não houve `break`.)

? Quantas vezes `print` é executado em `for i in range(3):` / `for j in range(4):` / `print(i, j)`?
- [ ] 3
- [ ] 7
- [x] 12
- [ ] 4
> O laço interno roda 4 vezes para cada uma das 3 voltas do externo: 3 × 4 = 12.

? O que `list(zip([1, 2, 3], "ab"))` produz?
- [ ] Um erro, pois os tamanhos são diferentes
- [x] [(1, 'a'), (2, 'b')]
- [ ] [(1, 'a'), (2, 'b'), (3, None)]
- [ ] [1, 'a', 2, 'b', 3]
> `zip` para na sequência mais curta. Só com `strict=True` ele gera erro quando os tamanhos diferem.

? Para achar o maior valor de uma lista com um acumulador, qual é a inicialização mais segura?
- [ ] maior = 0
- [ ] maior = 1
- [x] maior = lista[0] (o primeiro item)
- [ ] maior = -1
> Começar com 0 ou -1 falha para listas só com valores menores (como negativos). O primeiro item sempre pertence à lista.

? No método de Newton para raiz quadrada, por que o laço para quando `abs(y - x) < 1e-10` em vez de `y == x`?
- [ ] Porque `==` não funciona com números
- [x] Porque floats são aproximados e a igualdade exata pode nunca acontecer
- [ ] Porque `abs` é mais rápido
- [ ] Porque o método nunca converge
> Floats têm precisão limitada; comparar com uma tolerância pequena é a forma segura de dizer "parou de mudar".
