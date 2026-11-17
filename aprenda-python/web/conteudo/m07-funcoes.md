# Funções
id: m07
nivel: Básico
icone: 🧩
descricao: Crie suas próprias funções com parâmetros, retorno, valores padrão, *args/**kwargs, recursão, lambda e funções de ordem superior.

## O que é uma função e por que usar
fonte: Python do Zero p. 40; Pense em Python cap. 3.1–3.5, 3.11

Uma **função** é um bloco de código com **nome**, que executa uma tarefa e pode ser chamado (executado) quantas vezes for necessário. Você já usou várias funções prontas: `print`, `len`, `input`, `int`, `max`... Agora vai aprender a criar as suas.

### Por que criar funções?

| Vantagem | Explicação |
|---|---|
| Reutilização | escreva uma vez, use em vários lugares; corrigiu um bug, corrigiu em todos |
| Organização | divide um programa grande em partes pequenas com nomes que explicam o que fazem |
| Legibilidade | `calcula_imposto(salario)` diz mais do que dez linhas de contas |
| Testes | cada função pode ser testada separadamente |
| Abstração | quem usa a função não precisa saber **como** ela funciona por dentro |

### Definindo e chamando

Uma função é criada com `def`, seguido do nome, parênteses e dois-pontos. O **corpo** é o bloco indentado:

```python
def saudacao():
    print("Olá!")
    print("Bem-vindo ao curso de Python.")

saudacao()      # chamada
saudacao()      # pode chamar quantas vezes quiser
```

> ⚠️ **Definir** não é **executar**. O `def` só ensina ao Python o que a função faz; o corpo roda apenas quando a função é **chamada**, com parênteses: `saudacao()`. Escrever só `saudacao`, sem parênteses, não executa nada.

```python
def diga_oi():
    print("oi")

print(diga_oi)     # sem parênteses: mostra o objeto função, não executa
diga_oi()          # com parênteses: executa
```

A função precisa ser definida **antes** de ser chamada (antes no fluxo de execução):

```python erro
dobro(4)

def dobro(x):
    print(x * 2)
```

### Funções chamando funções

Uma função pode chamar outra. O **fluxo de execução** "pula" para dentro da função chamada e, quando ela termina, volta para o ponto onde parou:

```python
def linha():
    print("-" * 20)

def cabecalho(titulo):
    linha()
    print(titulo.center(20))
    linha()

cabecalho("RELATÓRIO")
print("conteúdo...")
```

### Funções embutidas

Python traz dezenas de funções **embutidas** (*built-in*), sempre disponíveis sem importar nada. Algumas das mais úteis:

| Função | Exemplo | Resultado |
|---|---|---|
| `abs` | `abs(-7)` | `7` |
| `round` | `round(3.14159, 2)` | `3.14` |
| `len` | `len("abc")` | `3` |
| `max` / `min` | `max(3, 9, 4)` | `9` |
| `sum` | `sum([1, 2, 3])` | `6` |
| `sorted` | `sorted([3, 1, 2])` | `[1, 2, 3]` |
| `type` / `isinstance` | `isinstance(5, int)` | `True` |
| `int` / `float` / `str` | `int("42")` | `42` |
| `pow` / `divmod` | `divmod(17, 5)` | `(3, 2)` |

```python
print(abs(-7), round(2.675, 1), pow(2, 10), divmod(17, 5))
print(isinstance(3.0, float), isinstance("3", int))
```

> 💡 Use `help(função)` para ler a documentação de qualquer função, por exemplo `help(round)`.

### Exercício
Defina uma função `moldura()` que, ao ser chamada, imprime exatamente estas três linhas:

```text
+------+
| Oi!  |
+------+
```

Depois de definir, **chame** a função uma vez no seu programa.

```python inicial
def moldura():
    pass
```

```python solucao
def moldura():
    print("+------+")
    print("| Oi!  |")
    print("+------+")

moldura()
```

```python teste
linhas = saida.rstrip("\n").split("\n")
assert linhas == ["+------+", "| Oi!  |", "+------+"], f"A saída deveria ter as 3 linhas da moldura. Veio: {linhas}. Lembre-se de chamar a função!"
from io import StringIO
import contextlib
buf = StringIO()
with contextlib.redirect_stdout(buf):
    moldura()
assert buf.getvalue().count("\n") == 3, "Cada chamada de moldura() deve imprimir 3 linhas"
```

## Parâmetros e argumentos
fonte: Python do Zero p. 40–41; Pense em Python cap. 3.8–3.9

Funções ficam muito mais úteis quando recebem **dados**. Os nomes entre parênteses na definição são os **parâmetros**; os valores passados na chamada são os **argumentos**.

```python
def boas_vindas(nome, curso):     # nome e curso são PARÂMETROS
    print(f"Olá, {nome}! Bem-vindo(a) ao curso de {curso}.")

boas_vindas("Ana", "Python")      # "Ana" e "Python" são ARGUMENTOS
boas_vindas("Bruno", "Lógica")
```

Na chamada, o valor de cada argumento é **atribuído** ao parâmetro correspondente, na ordem. Dentro da função, os parâmetros são variáveis comuns.

### O argumento pode ser qualquer expressão

O argumento é **avaliado antes** da chamada. Pode ser um literal, uma variável, uma conta ou o resultado de outra função:

```python
def mostra_dobro(x):
    print(x, "-> dobro:", x * 2)

mostra_dobro(5)
n = 7
mostra_dobro(n)
mostra_dobro(n + 3)
mostra_dobro(len("python"))
mostra_dobro("ab")          # funciona com qualquer tipo que suporte * 2
```

> 💡 O nome da variável usada na chamada **não tem relação** com o nome do parâmetro. Acima, passamos `n`, mas dentro da função o valor se chama `x`.

### Quantidade de argumentos

Se você passar argumentos a mais ou a menos, o Python reclama com `TypeError`:

```python erro
def area_retangulo(largura, altura):
    print(largura * altura)

area_retangulo(3)
```

A **ordem** importa: os argumentos são casados com os parâmetros pela posição (por isso são chamados **argumentos posicionais**):

```python
def divide(a, b):
    print(a / b)

divide(10, 2)
divide(2, 10)     # outra ordem, outro resultado
```

### Exercício
Defina a função `imprime_tabuada(n, ate)` que **imprime** a tabuada de `n` de 1 até `ate`, uma linha por multiplicação, no formato `n x i = resultado`. Exemplo: `imprime_tabuada(3, 2)` imprime `3 x 1 = 3` e `3 x 2 = 6`. Se `ate` for 0, não imprime nada.

```python inicial
def imprime_tabuada(n, ate):
    pass
```

```python solucao
def imprime_tabuada(n, ate):
    for i in range(1, ate + 1):
        print(f"{n} x {i} = {n * i}")
```

```python teste
from io import StringIO
import contextlib
def _captura(*args):
    buf = StringIO()
    with contextlib.redirect_stdout(buf):
        imprime_tabuada(*args)
    return buf.getvalue().strip().split("\n") if buf.getvalue().strip() else []
r = _captura(3, 2)
assert r == ["3 x 1 = 3", "3 x 2 = 6"], f"imprime_tabuada(3, 2) imprimiu {r}"
r = _captura(7, 10)
assert len(r) == 10 and r[-1] == "7 x 10 = 70", f"imprime_tabuada(7, 10) deveria ter 10 linhas, a última '7 x 10 = 70'. Veio {r}"
assert _captura(5, 0) == [], "imprime_tabuada(5, 0) não deve imprimir nada"
assert _captura(0, 1) == ["0 x 1 = 0"], "imprime_tabuada(0, 1) deveria imprimir '0 x 1 = 0'"
```

## return: funções com resultado
fonte: Pense em Python cap. 3.10, 6.1

Até agora, nossas funções **imprimiam** algo. Mas a maioria das funções úteis **calcula e devolve** um valor com `return`, para que quem chamou possa usá-lo: guardar numa variável, usar numa conta, passar para outra função.

```python
def area_circulo(raio):
    pi = 3.14159
    return pi * raio ** 2

a = area_circulo(2)
print(a)
print(area_circulo(1) + area_circulo(3))
print(round(area_circulo(10), 1))
```

### print não é return!

Essa é a confusão mais comum de quem começa. `print` mostra na tela e **descarta** o valor; `return` **devolve** o valor para quem chamou:

```python
def soma_print(a, b):
    print(a + b)        # só mostra

def soma_return(a, b):
    return a + b        # devolve

x = soma_print(2, 3)    # mostra 5, mas x recebe None!
y = soma_return(2, 3)   # não mostra nada, mas y recebe 5
print("x =", x, "| y =", y)
```

Se tentarmos fazer contas com o resultado da versão com `print`, dá erro:

```python erro
def soma_print(a, b):
    print(a + b)

total = soma_print(2, 3) * 10    # None * 10 -> TypeError
```

### Funções nulas e None

Uma função sem `return` (ou com `return` sozinho) é uma **função nula**: ela faz algo (imprime, modifica uma lista...), mas devolve o valor especial **`None`**, que significa "nada".

```python
def avisa(msg):
    print("AVISO:", msg)

r = avisa("bateria fraca")
print(r, type(r))
```

### return encerra a função

Quando o `return` é executado, a função **termina na hora**. O código depois dele não roda. Isso permite ter vários `return` em caminhos diferentes:

```python
def valor_absoluto(x):
    if x < 0:
        return -x
    return x          # só chega aqui se x >= 0

print(valor_absoluto(-5), valor_absoluto(3), valor_absoluto(0))
```

> ⚠️ Garanta que **todo** caminho possível tenha um `return`. Senão, em algum caso a função retorna `None` sem você perceber:

```python
def classifica(nota):
    if nota >= 7:
        return "aprovado"
    elif nota >= 5:
        return "recuperação"
    # esqueci o caso nota < 5!

print(classifica(8), classifica(6), classifica(3))
```

### Funções booleanas

Funções que retornam `True` ou `False` são muito úteis em condições. Costumam ter nomes como `eh_...`, `tem_...` ou `pode_...`. Retorne a expressão booleana diretamente, sem `if`:

```python
def eh_par(n):
    return n % 2 == 0      # em vez de: if n % 2 == 0: return True else: return False

def eh_divisivel(x, y):
    return x % y == 0

print(eh_par(10), eh_par(7))
if eh_divisivel(15, 5):
    print("15 é divisível por 5")
```

### Exercício
Escreva a função `imc(peso, altura)` que **retorna** o índice de massa corporal (peso / altura²) arredondado a 1 casa decimal, e a função `classifica_imc(valor)` que **retorna** `"abaixo"` se valor < 18.5, `"normal"` se até 24.9, `"sobrepeso"` se até 29.9 e `"obesidade"` acima disso. Nenhuma das duas deve imprimir nada.

```python inicial
def imc(peso, altura):
    pass

def classifica_imc(valor):
    pass
```

```python solucao
def imc(peso, altura):
    return round(peso / altura ** 2, 1)

def classifica_imc(valor):
    if valor < 18.5:
        return "abaixo"
    elif valor <= 24.9:
        return "normal"
    elif valor <= 29.9:
        return "sobrepeso"
    return "obesidade"
```

```python teste
assert imc(70, 1.75) == 22.9, f"imc(70, 1.75) deveria retornar 22.9, retornou {imc(70, 1.75)}. Use return, não print."
assert imc(50, 1.80) == 15.4, f"imc(50, 1.80) deveria retornar 15.4, retornou {imc(50, 1.80)}"
assert classifica_imc(18.4) == "abaixo", "18.4 é 'abaixo'"
assert classifica_imc(18.5) == "normal", "18.5 já é 'normal'"
assert classifica_imc(24.9) == "normal", "24.9 ainda é 'normal'"
assert classifica_imc(27) == "sobrepeso", "27 é 'sobrepeso'"
assert classifica_imc(29.9) == "sobrepeso", "29.9 ainda é 'sobrepeso'"
assert classifica_imc(35) == "obesidade", "35 é 'obesidade'"
assert classifica_imc(imc(90, 1.70)) == "obesidade", "imc(90, 1.70) = 31.1 deve ser 'obesidade'"
assert saida.strip() == "", "As funções não devem imprimir nada, apenas retornar"
```

## Escopo: variáveis locais e globais
fonte: Pense em Python cap. 3.9, 11.6

O **escopo** de uma variável é a região do programa onde ela existe. Variáveis criadas **dentro** de uma função (incluindo os parâmetros) são **locais**: existem só enquanto a função executa e desaparecem quando ela termina.

```python
def calcula():
    resultado = 42       # variável local
    print("dentro:", resultado)

calcula()
print("existe fora?", "resultado" in globals())
```

```python erro
def calcula():
    resultado = 42

calcula()
print(resultado)     # NameError: resultado só existia dentro da função
```

Isso é uma **vantagem**: cada função tem seu próprio "espaço de trabalho", e variáveis com o mesmo nome em funções diferentes não se misturam.

```python
def f():
    x = "x da f"
    print(x)

def g():
    x = "x da g"
    print(x)

x = "x global"
f()
g()
print(x)       # o x global não foi afetado
```

### Lendo variáveis globais

Variáveis criadas fora de qualquer função são **globais**. Uma função pode **ler** uma global:

```python
TAXA = 0.1        # constante global (por convenção, em MAIÚSCULAS)

def com_taxa(valor):
    return valor * (1 + TAXA)

print(com_taxa(200))
```

### Alterando globais: a palavra global

Mas, se a função **atribuir** a um nome, o Python o considera **local** à função inteira. Por isso este código dá erro:

```python erro
contador = 0

def incrementa():
    contador = contador + 1    # contador é local aqui, e ainda não tem valor

incrementa()
```

Para alterar a global, declare com `global`:

```python
contador = 0

def incrementa():
    global contador
    contador += 1

incrementa()
incrementa()
print(contador)
```

### Por que evitar global

Funções que alteram globais são difíceis de entender, testar e reutilizar: o resultado depende de algo "escondido" fora delas, e qualquer parte do programa pode mudar esse valor. Prefira **receber por parâmetro e devolver com `return`**:

```python
# Em vez de mexer numa global...
def incrementa(valor):
    return valor + 1

contador = 0
contador = incrementa(contador)
contador = incrementa(contador)
print(contador)
```

> 💡 Constantes globais (que nunca mudam, como `TAXA` ou `PI`) são aceitáveis. O problema são globais **modificadas** por funções.

> ⚠️ Objetos mutáveis globais (listas, dicionários) podem ser **modificados** dentro de uma função sem `global`, pois você não está reatribuindo o nome, apenas alterando o objeto: `lista.append(x)` funciona. Isso também deve ser usado com moderação.

### Exercício
O código abaixo usa uma variável global para acumular o saldo. Reescreva a função `deposita` para que ela **não use global**: ela deve receber o `saldo` atual e o `valor`, e **retornar** o novo saldo. Depósitos com valor menor ou igual a zero devem ser ignorados (retorna o saldo inalterado).

```python inicial
saldo = 0

def deposita(valor):
    global saldo
    saldo += valor
```

```python solucao
def deposita(saldo, valor):
    if valor <= 0:
        return saldo
    return saldo + valor
```

```python teste
assert deposita(100, 50) == 150, f"deposita(100, 50) deveria retornar 150, veio {deposita(100, 50)}"
assert deposita(0, 10) == 10, "deposita(0, 10) deveria retornar 10"
assert deposita(80, -20) == 80, "Valores negativos devem ser ignorados"
assert deposita(80, 0) == 80, "Depósito de 0 deve ser ignorado"
s = 0
for v in [10, 20, -5, 30]:
    s = deposita(s, v)
assert s == 60, f"Depósitos 10, 20, -5, 30 a partir de 0 devem dar 60, deu {s}"
assert "saldo" not in deposita.__code__.co_names, "Não use a variável global saldo: receba o saldo por parâmetro"
```

## Argumentos padrão e nomeados
fonte: Documentação oficial do Python; Pense em Python cap. 19

### Valores padrão

Um parâmetro pode ter um **valor padrão**, usado quando o argumento não é informado. Isso torna o argumento **opcional**:

```python
def saudar(nome, saudacao="Olá"):
    return f"{saudacao}, {nome}!"

print(saudar("Ana"))
print(saudar("Ana", "Bom dia"))
```

Parâmetros com padrão devem vir **depois** dos obrigatórios:

```python erro
def f(a=1, b):
    return a + b
```

### Argumentos nomeados

Na chamada, você pode indicar **o nome do parâmetro**. Assim a ordem não importa e a chamada fica autoexplicativa. Você já fez isso com `print(..., sep="-", end="")` e `sorted(..., reverse=True)`:

```python
def descreve(nome, idade, cidade="não informada"):
    return f"{nome}, {idade} anos, cidade: {cidade}"

print(descreve("Bia", 30))
print(descreve(idade=25, nome="Caio"))
print(descreve("Davi", cidade="Recife", idade=41))
```

Argumentos posicionais devem vir **antes** dos nomeados:

```python erro
def descreve(nome, idade):
    return nome

descreve(nome="Bia", 30)
```

> 💡 Use argumentos nomeados quando o significado de um valor não for óbvio. `conecta("srv", 8080, True)` diz pouco; `conecta("srv", porta=8080, seguro=True)` diz tudo.

### A armadilha do padrão mutável

O valor padrão é criado **uma única vez**, quando o `def` é executado, e não a cada chamada. Se ele for mutável (uma lista, um dicionário), as chamadas **compartilham** o mesmo objeto:

```python
def adiciona(item, lista=[]):     # ⚠️ ERRADO
    lista.append(item)
    return lista

print(adiciona("a"))
print(adiciona("b"))    # surpresa: ['a', 'b']!
print(adiciona("c"))
```

A solução padrão é usar `None` como padrão e criar a lista **dentro** da função:

```python
def adiciona(item, lista=None):   # ✔ CERTO
    if lista is None:
        lista = []
    lista.append(item)
    return lista

print(adiciona("a"))
print(adiciona("b"))
print(adiciona("c", ["x"]))
```

> ⚠️ Regra prática: **nunca** use `[]`, `{}` ou `set()` como valor padrão. Use `None`.

### Exercício
Escreva a função `formata_preco(valor, moeda="R$", casas=2)` que retorna uma string com a moeda, um espaço e o valor com o número de casas decimais indicado. Exemplos: `formata_preco(5)` retorna `"R$ 5.00"`, `formata_preco(3.14159, casas=3)` retorna `"R$ 3.142"` e `formata_preco(10, "US$", 0)` retorna `"US$ 10"`.

Dica: dentro da f-string, `{valor:.{casas}f}` usa a variável `casas` como número de casas.

```python inicial
def formata_preco(valor, moeda, casas):
    pass
```

```python solucao
def formata_preco(valor, moeda="R$", casas=2):
    return f"{moeda} {valor:.{casas}f}"
```

```python teste
assert formata_preco(5) == "R$ 5.00", f"formata_preco(5) deveria ser 'R$ 5.00'. Os parâmetros moeda e casas têm valor padrão?"
assert formata_preco(3.14159, casas=3) == "R$ 3.142", f"formata_preco(3.14159, casas=3) deveria ser 'R$ 3.142', veio {formata_preco(3.14159, casas=3)!r}"
assert formata_preco(10, "US$", 0) == "US$ 10", f"formata_preco(10, 'US$', 0) deveria ser 'US$ 10', veio {formata_preco(10, 'US$', 0)!r}"
assert formata_preco(moeda="€", valor=1.5) == "€ 1.50", "Deve aceitar argumentos nomeados em qualquer ordem"
assert formata_preco(0) == "R$ 0.00", "formata_preco(0) deveria ser 'R$ 0.00'"
```

## *args, **kwargs e desempacotamento
fonte: Pense em Python cap. 12.4; Documentação oficial do Python

### *args: quantidade variável de argumentos posicionais

Às vezes não sabemos quantos argumentos a função vai receber, como em `print(a, b, c, ...)` ou `max(3, 8, 1, 9)`. Um parâmetro com `*` **recolhe** todos os argumentos posicionais extras numa **tupla**:

```python
def soma_tudo(*numeros):
    print("Recebi:", numeros, type(numeros))
    total = 0
    for n in numeros:
        total += n
    return total

print(soma_tudo(1, 2))
print(soma_tudo(5, 10, 15, 20))
print(soma_tudo())
```

O nome `args` é só uma convenção: o que importa é o `*`. Dá para combinar com parâmetros normais, que vêm antes:

```python
def media_com_titulo(titulo, *valores):
    if not valores:
        return f"{titulo}: sem dados"
    return f"{titulo}: {sum(valores) / len(valores):.1f}"

print(media_com_titulo("Notas", 7, 8, 10))
print(media_com_titulo("Vazio"))
```

### **kwargs: argumentos nomeados variáveis

Com `**`, a função recolhe os argumentos **nomeados** extras num **dicionário**:

```python
def perfil(nome, **info):
    print("Nome:", nome)
    for chave, valor in info.items():
        print(f"  {chave}: {valor}")

perfil("Ana", idade=30, cidade="Porto Alegre", linguagem="Python")
```

A ordem geral dos parâmetros numa definição é: normais, `*args`, nomeados com padrão, `**kwargs`. Parâmetros depois de `*args` só podem ser passados **por nome**:

```python
def registra(*mensagens, sep=" | ", **extras):
    texto = sep.join(mensagens)
    return texto + (f" {extras}" if extras else "")

print(registra("início", "processando", "fim"))
print(registra("a", "b", sep="-", nivel="debug"))
```

### Desempacotamento na chamada

O contrário também funciona: na **chamada**, `*` espalha uma sequência em argumentos posicionais e `**` espalha um dicionário em argumentos nomeados:

```python
def ponto(x, y, z):
    return f"({x}, {y}, {z})"

coords = [1, 2, 3]
print(ponto(*coords))              # o mesmo que ponto(1, 2, 3)

dados = {"x": 10, "z": 30, "y": 20}
print(ponto(**dados))              # o mesmo que ponto(x=10, z=30, y=20)

valores = (4, 9, 2)
print(max(*valores), divmod(*(17, 5)))
print(*["a", "b", "c"], sep="-")
```

### Exercício
Escreva a função `maior_de(*numeros)` que retorna o maior dos números recebidos, **sem** usar `max`, ou `None` se nenhum número for passado. Exemplo: `maior_de(3, 9, 2)` retorna `9`, e `maior_de()` retorna `None`.

```python inicial
def maior_de(numeros):
    pass
```

```python solucao
def maior_de(*numeros):
    if not numeros:
        return None
    maior = numeros[0]
    for n in numeros[1:]:
        if n > maior:
            maior = n
    return maior
```

```python teste
import builtins
_max = builtins.max
def _sem_max(*a, **k):
    raise AssertionError("Não use max() neste exercício")
builtins.max = _sem_max
try:
    assert maior_de(3, 9, 2) == 9, f"maior_de(3, 9, 2) deveria ser 9"
    assert maior_de(5) == 5, "Com um único número, ele é o maior"
    assert maior_de() is None, "Sem argumentos, retorne None"
    assert maior_de(-8, -3, -10) == -3, "Com negativos, o maior é -3"
    assert maior_de(*[4, 1, 7, 7]) == 7, "Deve funcionar com desempacotamento de lista"
finally:
    builtins.max = _max
```

## Docstrings e anotações de tipo
fonte: Pense em Python cap. 4.9; Documentação oficial do Python (PEP 257, PEP 484)

### Docstrings

Uma **docstring** é uma string, geralmente entre três aspas, colocada como **primeira linha** do corpo da função. Ela explica o que a função faz, o que recebe e o que retorna. Diferente de um comentário, ela fica guardada na função e aparece no `help()`:

```python
def area_triangulo(base, altura):
    """Calcula a área de um triângulo.

    base: comprimento da base (número positivo)
    altura: altura relativa à base (número positivo)
    Retorna a área como float.
    """
    return base * altura / 2

print(area_triangulo(10, 4))
print(area_triangulo.__doc__)
```

Boas práticas para docstrings:

- A primeira linha é um **resumo curto**, no imperativo ou descritivo ("Calcula...", "Retorna...").
- Descreva os **parâmetros**, o **retorno** e condições especiais (o que acontece com lista vazia? com negativos?).
- Documente o **o quê**, não o **como**: quem usa a função não precisa conhecer os detalhes internos.

### Anotações de tipo

**Anotações de tipo** (*type hints*) indicam o tipo esperado de cada parâmetro e do retorno. Usa-se `: tipo` após o parâmetro e `-> tipo` antes dos dois-pontos:

```python
def repete(texto: str, vezes: int = 2) -> str:
    """Retorna o texto repetido, separado por espaços."""
    return " ".join([texto] * vezes)

print(repete("eco"))
print(repete("oi", 3))
print(repete.__annotations__)
```

Para coleções, indique o tipo dos itens entre colchetes; `|` indica "um ou outro":

```python
def media(valores: list[float]) -> float | None:
    """Retorna a média dos valores, ou None se a lista estiver vazia."""
    if not valores:
        return None
    return sum(valores) / len(valores)

def conta(palavras: list[str]) -> dict[str, int]:
    resultado: dict[str, int] = {}
    for p in palavras:
        resultado[p] = resultado.get(p, 0) + 1
    return resultado

print(media([7.0, 8.5]), media([]))
print(conta(["a", "b", "a"]))
```

> ⚠️ O Python **não verifica** as anotações durante a execução: elas são documentação (e servem para ferramentas como editores e o verificador `mypy`). O código abaixo roda normalmente, mesmo passando tipos "errados":

```python
def dobro(x: int) -> int:
    return x * 2

print(dobro("ha"))    # "haha": nenhum erro, apesar da anotação
```

### Exercício
Escreva a função `conta_vogais(texto: str) -> int` com **anotações de tipo** e uma **docstring**, que retorna quantas vogais (a, e, i, o, u, com ou sem acento, maiúsculas ou minúsculas) há no texto. Considere as vogais `"aeiouáéíóúâêôãõà"`.

```python inicial
def conta_vogais(texto):
    pass
```

```python solucao
def conta_vogais(texto: str) -> int:
    """Retorna a quantidade de vogais (acentuadas ou não) em texto."""
    vogais = "aeiouáéíóúâêôãõà"
    total = 0
    for c in texto.lower():
        if c in vogais:
            total += 1
    return total
```

```python teste
assert conta_vogais("Python") == 1, f"'Python' tem 1 vogal, veio {conta_vogais('Python')}"
assert conta_vogais("AÉREO") == 4, f"'AÉREO' tem 4 vogais, veio {conta_vogais('AÉREO')}"
assert conta_vogais("") == 0, "Texto vazio: 0"
assert conta_vogais("rhythm 123") == 0, "Sem vogais: 0"
assert conta_vogais("Programação") == 5, f"'Programação' tem 5 vogais, veio {conta_vogais('Programação')}"
assert conta_vogais.__doc__ and conta_vogais.__doc__.strip(), "Escreva uma docstring na função"
an = conta_vogais.__annotations__
assert an.get("texto") is str and an.get("return") is int, f"Anote os tipos: texto: str e -> int. Anotações atuais: {an}"
```

## Desenvolvimento incremental e composição
fonte: Pense em Python cap. 6.2–6.4

Ao escrever funções maiores, é comum gastar muito tempo depurando. O **desenvolvimento incremental** evita isso: você escreve **pouco código de cada vez**, testando a cada passo, de modo que qualquer erro está sempre nas últimas linhas que você acrescentou.

### Exemplo: distância entre dois pontos

A distância entre os pontos (x1, y1) e (x2, y2) é dada pelo teorema de Pitágoras: √((x2 − x1)² + (y2 − y1)²).

**Passo 1**: defina a função com os parâmetros certos e um retorno provisório. Ela já pode ser chamada e testada:

```python
def distancia(x1, y1, x2, y2):
    return 0.0

print(distancia(1, 2, 4, 6))   # roda; o valor ainda está errado, mas a estrutura está certa
```

Escolha um caso de teste cuja resposta você **sabe**: de (1, 2) a (4, 6), as diferenças são 3 e 4, e a distância deve ser **5** (o famoso triângulo 3-4-5).

**Passo 2**: calcule as diferenças e mostre os valores intermediários (código de **andaime**, *scaffolding*):

```python
def distancia(x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    print("dx =", dx, "dy =", dy)    # andaime: será removido
    return 0.0

distancia(1, 2, 4, 6)
```

**Passo 3**: some os quadrados e confira:

```python
def distancia(x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    soma_quadrados = dx ** 2 + dy ** 2
    print("soma dos quadrados:", soma_quadrados)   # esperado: 25
    return 0.0

distancia(1, 2, 4, 6)
```

**Passo 4**: tire a raiz, remova o andaime e teste:

```python
import math

def distancia(x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    return math.sqrt(dx ** 2 + dy ** 2)

print(distancia(1, 2, 4, 6))
print(distancia(0, 0, 0, 0))
```

Os pontos-chave do processo:

1. Comece com um programa que **funciona** e faça mudanças pequenas.
2. Use **variáveis intermediárias** para poder exibir e verificar os valores.
3. Quando tudo funcionar, remova o andaime e, se quiser, **consolide** expressões (sem prejudicar a legibilidade).

### Composição

Composição é usar uma função **dentro** de outra. Por exemplo: queremos a área de um círculo dado o **centro** e um ponto na **borda**. O raio é a distância entre os dois pontos, então reutilizamos `distancia`:

```python
import math

def distancia(x1, y1, x2, y2):
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

def area(raio):
    return math.pi * raio ** 2

def area_circulo(xc, yc, xb, yb):
    return area(distancia(xc, yc, xb, yb))

print(round(area_circulo(1, 2, 4, 6), 2))   # raio 5 -> 25π
```

Cada função faz **uma** coisa, é fácil de testar e pode ser reaproveitada. Funções pequenas e bem nomeadas são a base de programas grandes e organizados.

> 💡 Escreva os testes **antes** ou **junto** com a função. Um conjunto de `assert` com casos conhecidos garante que a função continua funcionando depois de cada mudança.

```python
import math

def distancia(x1, y1, x2, y2):
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

assert distancia(1, 2, 4, 6) == 5.0
assert distancia(0, 0, 0, 0) == 0.0
assert distancia(-1, -1, 2, 3) == 5.0
print("Todos os testes passaram!")
```

### Exercício
Usando **composição**, escreva:

1. `perimetro(x1, y1, x2, y2, x3, y3)`, que retorna o perímetro do triângulo com esses três vértices, usando a função `distancia` (já fornecida).
2. `eh_retangulo(x1, y1, x2, y2, x3, y3)`, que retorna `True` se o triângulo é retângulo. Ordene os três lados (`a <= b <= c`) e verifique se `a² + b²` é igual a `c²` com tolerância: `abs(a**2 + b**2 - c**2) < 1e-9`.

```python inicial
import math

def distancia(x1, y1, x2, y2):
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

def perimetro(x1, y1, x2, y2, x3, y3):
    pass

def eh_retangulo(x1, y1, x2, y2, x3, y3):
    pass
```

```python solucao
import math

def distancia(x1, y1, x2, y2):
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

def perimetro(x1, y1, x2, y2, x3, y3):
    return distancia(x1, y1, x2, y2) + distancia(x2, y2, x3, y3) + distancia(x3, y3, x1, y1)

def eh_retangulo(x1, y1, x2, y2, x3, y3):
    a, b, c = sorted([distancia(x1, y1, x2, y2), distancia(x2, y2, x3, y3), distancia(x3, y3, x1, y1)])
    return abs(a ** 2 + b ** 2 - c ** 2) < 1e-9
```

```python teste
assert abs(perimetro(0, 0, 3, 0, 0, 4) - 12) < 1e-9, f"Triângulo 3-4-5: perímetro 12, veio {perimetro(0, 0, 3, 0, 0, 4)}"
assert abs(perimetro(0, 0, 1, 0, 0, 0) - 2) < 1e-9, "Triângulo degenerado (0,0),(1,0),(0,0): perímetro 2"
assert eh_retangulo(0, 0, 3, 0, 0, 4) is True, "(0,0),(3,0),(0,4) é retângulo"
assert eh_retangulo(5, 5, 5, 1, 2, 1) is True, "(5,5),(5,1),(2,1) é retângulo, em qualquer ordem dos vértices"
assert eh_retangulo(0, 0, 2, 0, 1, 1.7320508075688772) is False, "Triângulo equilátero não é retângulo"
assert eh_retangulo(0, 0, 1, 1, 2, 0) is True, "(0,0),(1,1),(2,0) é retângulo (lados irracionais: use tolerância)"
```

## Recursão
fonte: Pense em Python cap. 5.8–5.10, 6.5–6.9

Uma função pode chamar **a si mesma**. Isso se chama **recursão**, e é uma das ideias mais elegantes da programação. Ela funciona quando o problema pode ser resolvido a partir de uma **versão menor dele mesmo**.

Toda função recursiva precisa de duas partes:

1. **Caso base**: uma situação simples, resolvida diretamente, **sem** nova chamada recursiva. É o que faz a recursão parar.
2. **Caso recursivo**: resolve o problema chamando a função para uma entrada **menor**, que se aproxima do caso base.

```python
def contagem_regressiva(n):
    if n <= 0:                       # caso base
        print("Decolar!")
    else:                            # caso recursivo
        print(n)
        contagem_regressiva(n - 1)

contagem_regressiva(3)
```

### Fatorial recursivo

A definição matemática do fatorial já é recursiva: 0! = 1 e n! = n × (n − 1)!. A tradução para Python é quase literal:

```python
def fatorial(n):
    if n == 0:
        return 1
    return n * fatorial(n - 1)

print(fatorial(5))
print(fatorial(0))
```

### A pilha de chamadas

Cada chamada de função ganha seu próprio **quadro** (*frame*) na **pilha de chamadas**, com suas variáveis locais. Na recursão, várias chamadas da mesma função ficam "empilhadas", cada uma esperando a de baixo terminar. Vamos visualizar com `print` e indentação:

```python
def fatorial(n, nivel=0):
    recuo = "    " * nivel
    print(f"{recuo}fatorial({n}) chamado")
    if n == 0:
        print(f"{recuo}caso base: retorna 1")
        return 1
    resultado = n * fatorial(n - 1, nivel + 1)
    print(f"{recuo}fatorial({n}) retorna {resultado}")
    return resultado

fatorial(3)
```

Repare: as chamadas descem até o caso base e depois os resultados **sobem**, sendo multiplicados no caminho de volta.

### Fibonacci recursivo

A sequência de Fibonacci também tem definição recursiva: fib(0) = 0, fib(1) = 1 e fib(n) = fib(n − 1) + fib(n − 2). Aqui há **dois** casos base e **duas** chamadas recursivas:

```python
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print([fib(i) for i in range(12)])
```

> ⚠️ Essa versão é elegante mas **muito lenta** para n grande: `fib(30)` faz mais de 1 milhão de chamadas, porque recalcula os mesmos valores várias vezes. A solução é guardar os resultados já calculados (**memoização**), por exemplo com um dicionário:

```python
memo = {0: 0, 1: 1}

def fib_memo(n):
    if n not in memo:
        memo[n] = fib_memo(n - 1) + fib_memo(n - 2)
    return memo[n]

print(fib_memo(80))
```

### Recursão infinita e RecursionError

Se não houver caso base, ou se a chamada não se aproximar dele, a recursão nunca para. O Python tem um limite de profundidade (cerca de 1000 chamadas) e gera `RecursionError`:

```python erro
def sem_fim(n):
    return sem_fim(n + 1)     # não há caso base!

sem_fim(1)
```

Um erro comum é um caso base que não cobre todas as entradas. Este fatorial funciona para 0, 1, 2... mas um número negativo nunca chega a 0:

```python erro
def fatorial(n):
    if n == 0:
        return 1
    return n * fatorial(n - 1)

fatorial(-1)
```

> 💡 Proteja funções recursivas validando a entrada, por exemplo com `if n < 0: raise ValueError("n deve ser >= 0")`. Você aprenderá mais sobre `raise` no módulo de erros.

### Recursão ou laço?

Tudo o que se faz com recursão pode ser feito com laços, e vice-versa. Laços costumam ser mais rápidos e não têm limite de profundidade. A recursão brilha em problemas naturalmente recursivos: estruturas aninhadas (pastas dentro de pastas, listas dentro de listas), árvores e algoritmos de "dividir para conquistar".

```python
def soma_aninhada(item):
    """Soma todos os números de uma lista que pode conter outras listas."""
    if isinstance(item, list):
        total = 0
        for sub in item:
            total += soma_aninhada(sub)
        return total
    return item

print(soma_aninhada([1, [2, 3], [4, [5, [6]]]]))
```

### Exercício
Escreva **recursivamente** (sem laços) a função `potencia(base, exp)`, que retorna `base` elevado a `exp` (inteiro ≥ 0), usando que base⁰ = 1 e baseⁿ = base × baseⁿ⁻¹. Escreva também `inverte(texto)`, recursiva, que retorna a string invertida (dica: o inverso de `texto` é o inverso de `texto[1:]` seguido de `texto[0]`; o caso base é a string vazia).

```python inicial
def potencia(base, exp):
    pass

def inverte(texto):
    pass
```

```python solucao
def potencia(base, exp):
    if exp == 0:
        return 1
    return base * potencia(base, exp - 1)

def inverte(texto):
    if texto == "":
        return ""
    return inverte(texto[1:]) + texto[0]
```

```python teste
assert potencia(2, 10) == 1024, f"potencia(2, 10) deveria ser 1024, veio {potencia(2, 10)}"
assert potencia(5, 0) == 1, "Qualquer número elevado a 0 é 1"
assert potencia(0, 3) == 0, "0 elevado a 3 é 0"
assert potencia(-3, 3) == -27, "potencia(-3, 3) deveria ser -27"
assert inverte("python") == "nohtyp", f"inverte('python') deveria ser 'nohtyp', veio {inverte('python')!r}"
assert inverte("") == "", "inverte('') deveria ser ''"
assert inverte("a") == "a", "inverte('a') deveria ser 'a'"
import dis
for _f in (potencia, inverte):
    _ops = {ins.opname for ins in dis.get_instructions(_f)}
    assert "FOR_ITER" not in _ops and "JUMP_BACKWARD" not in _ops, f"{_f.__name__}: use recursão, não laços"
    assert _f.__name__ in _f.__code__.co_names, f"{_f.__name__} deve chamar a si mesma (recursão)"
```

## Funções como objetos, lambda, map, filter e key
fonte: Pense em Python cap. 19.1; Documentação oficial do Python

Em Python, funções são **objetos** como quaisquer outros: podem ser guardadas em variáveis, colocadas em listas e dicionários, passadas como argumento e retornadas por outras funções.

```python
def grita(texto):
    return texto.upper() + "!"

def sussurra(texto):
    return texto.lower() + "..."

falar = grita                 # sem parênteses: a função em si, não o resultado
print(falar("olá"))

for f in [grita, sussurra]:
    print(f.__name__, "->", f("Python"))

def aplica_duas_vezes(funcao, valor):
    return funcao(funcao(valor))

print(aplica_duas_vezes(grita, "ei"))
```

Uma função que recebe ou retorna outra função é chamada de **função de ordem superior**. Um uso prático é o "despachante": um dicionário de operações.

```python
def soma(a, b): return a + b
def sub(a, b): return a - b
def mult(a, b): return a * b

operacoes = {"+": soma, "-": sub, "*": mult}
for simbolo in "+-*":
    print(f"7 {simbolo} 3 =", operacoes[simbolo](7, 3))
```

### lambda: funções anônimas curtas

`lambda` cria uma função pequena numa única expressão, sem `def` e sem nome. A sintaxe é `lambda parâmetros: expressão`, e o valor da expressão é retornado automaticamente:

```python
dobro = lambda x: x * 2
soma = lambda a, b: a + b
print(dobro(5), soma(2, 3))

# equivale a:
def dobro_def(x):
    return x * 2
print(dobro_def(5))
```

> 💡 O uso típico de `lambda` não é atribuí-la a uma variável (para isso, prefira `def`), e sim passá-la **direto como argumento** para funções como `sorted`, `map` e `filter`.

### sorted, min e max com key

O parâmetro `key` recebe uma função que é aplicada a cada item para decidir **o que comparar**:

```python
palavras = ["banana", "Kiwi", "uva", "abacaxi"]
print(sorted(palavras))                     # maiúsculas vêm antes!
print(sorted(palavras, key=str.lower))      # ignora maiúsculas
print(sorted(palavras, key=len))            # pelo tamanho
print(max(palavras, key=len), min(palavras, key=len))

alunos = [("Ana", 8.5), ("Bruno", 9.2), ("Carla", 7.1)]
print(sorted(alunos, key=lambda a: a[1], reverse=True))
print(max(alunos, key=lambda a: a[1])[0])
```

Para critérios de desempate, a `key` pode retornar uma **tupla**: compara-se o primeiro item e, se empatar, o segundo:

```python
pessoas = [("Bia", 30), ("Ana", 25), ("Caio", 30), ("Davi", 25)]
print(sorted(pessoas, key=lambda p: (p[1], p[0])))     # idade, depois nome
print(sorted(pessoas, key=lambda p: (-p[1], p[0])))    # idade decrescente, depois nome
```

### map e filter

`map(f, seq)` aplica `f` a cada item; `filter(f, seq)` mantém só os itens para os quais `f` retorna verdadeiro. Ambos retornam iteradores "preguiçosos", por isso usamos `list()` para ver o resultado:

```python
numeros = [1, 2, 3, 4, 5, 6]
print(list(map(lambda n: n ** 2, numeros)))
print(list(filter(lambda n: n % 2 == 0, numeros)))
print(list(map(int, ["10", "20", "30"])))     # funções prontas também servem
print(list(map(str.upper, ["a", "b"])))
```

> ⚠️ Em Python, as **compreensões** costumam ser mais legíveis que `map`/`filter` com `lambda`: `[n ** 2 for n in numeros if n % 2 == 0]` faz as duas coisas de uma vez. Use `map` quando já existe uma função pronta (como `map(int, ...)`).

### Funções que criam funções

Uma função pode definir outra dentro dela e retorná-la. A função interna "lembra" das variáveis da externa (isso se chama **closure**):

```python
def multiplicador(fator):
    def multiplica(x):
        return x * fator
    return multiplica

triplo = multiplicador(3)
print(triplo(10), multiplicador(5)(2))
```

### Exercício
Escreva a função `ordena_produtos(produtos)` que recebe uma lista de tuplas `(nome, preco)` e retorna uma **nova** lista ordenada por preço **decrescente**; em caso de empate, por nome em ordem alfabética. Escreva também `mais_barato(produtos)`, que retorna o **nome** do produto mais barato (ou `None` se a lista estiver vazia). Use `sorted`/`min` com `key`.

```python inicial
def ordena_produtos(produtos):
    pass

def mais_barato(produtos):
    pass
```

```python solucao
def ordena_produtos(produtos):
    return sorted(produtos, key=lambda p: (-p[1], p[0]))

def mais_barato(produtos):
    if not produtos:
        return None
    return min(produtos, key=lambda p: p[1])[0]
```

```python teste
ps = [("caneta", 3.5), ("livro", 40.0), ("borracha", 3.5), ("mochila", 120.0)]
copia = list(ps)
r = ordena_produtos(ps)
esperado = [("mochila", 120.0), ("livro", 40.0), ("borracha", 3.5), ("caneta", 3.5)]
assert r == esperado, f"Esperava {esperado}, veio {r}"
assert ps == copia, "A lista original não deve ser modificada"
assert ordena_produtos([]) == [], "Lista vazia: []"
assert mais_barato(ps) in ("caneta", "borracha"), f"O mais barato custa 3.5; veio {mais_barato(ps)!r}"
assert mais_barato([("a", 10), ("b", 2), ("c", 5)]) == "b", "mais_barato deveria retornar 'b'"
assert mais_barato([]) is None, "Lista vazia: None"
```

## Quiz
? Qual a diferença entre parâmetro e argumento?
- [x] Parâmetro é o nome na definição da função; argumento é o valor passado na chamada
- [ ] São a mesma coisa
- [ ] Argumento é o nome na definição; parâmetro é o valor na chamada
- [ ] Parâmetros só existem em funções com return
> Em `def f(x):`, `x` é o parâmetro. Em `f(10)`, `10` é o argumento, atribuído a `x` na chamada.

? O que é impresso por `def f(): print("oi")` seguido de `r = f()` e `print(r)`?
- [ ] oi
- [x] oi e depois None
- [ ] None
- [ ] Dá erro
> A chamada `f()` imprime "oi". Como `f` não tem `return`, ela devolve `None`, que é guardado em `r` e impresso depois.

? O que acontece com o código após um `return` dentro de uma função?
- [ ] É executado normalmente
- [x] Não é executado: o return encerra a função
- [ ] É executado só se houver outro return
- [ ] Gera erro de sintaxe
> O `return` termina a função imediatamente e devolve o valor. Código depois dele (no mesmo caminho) é "código morto".

? Por que `x = 0` / `def f(): x = x + 1` / `f()` gera erro?
- [ ] Porque não se pode somar 1 a 0
- [x] Porque a atribuição torna `x` local em toda a função, e ele é lido antes de receber valor
- [ ] Porque funções não podem ver variáveis globais
- [ ] Porque falta um return
> Ao atribuir a `x` dentro da função, o Python trata `x` como local. Ler `x` antes da atribuição gera `UnboundLocalError`. Use parâmetro e `return` (ou, se inevitável, `global x`).

? Qual o problema de `def adiciona(item, lista=[]):`?
- [ ] Nenhum
- [ ] Listas não podem ser valor padrão: dá erro de sintaxe
- [x] A mesma lista é reaproveitada entre as chamadas, acumulando itens
- [ ] O parâmetro `lista` vira obrigatório
> O valor padrão é criado uma vez só, quando o `def` executa. Use `lista=None` e crie a lista dentro da função.

? Dentro de `def f(*args, **kwargs)`, chamada como `f(1, 2, a=3)`, o que são `args` e `kwargs`?
- [x] `args = (1, 2)` e `kwargs = {'a': 3}`
- [ ] `args = [1, 2]` e `kwargs = ['a', 3]`
- [ ] `args = (1, 2, 3)` e `kwargs = {}`
- [ ] Dá erro
> `*args` recolhe os posicionais extras numa tupla; `**kwargs` recolhe os nomeados extras num dicionário.

? O Python impede a chamada `dobro("ha")` se a função foi definida como `def dobro(x: int) -> int`?
- [ ] Sim, gera TypeError
- [x] Não: anotações de tipo não são verificadas durante a execução
- [ ] Sim, gera SyntaxError
- [ ] Só se houver docstring
> Anotações são documentação usada por editores e ferramentas como o mypy. Em tempo de execução, o Python as ignora.

? Quais são as duas partes essenciais de uma função recursiva?
- [ ] Um laço e um contador
- [x] Um caso base, que para a recursão, e um caso recursivo, que se aproxima do caso base
- [ ] Um `global` e um `return`
- [ ] Dois parâmetros e uma docstring
> Sem caso base (ou sem progresso até ele), a recursão nunca termina e o Python gera `RecursionError`.

? Qual o resultado de `sorted(["bb", "a", "ccc"], key=len, reverse=True)`?
- [ ] ['a', 'bb', 'ccc']
- [x] ['ccc', 'bb', 'a']
- [ ] ['bb', 'a', 'ccc']
- [ ] [3, 2, 1]
> A `key=len` faz a comparação usar o tamanho de cada string; `reverse=True` ordena do maior para o menor. Os itens retornados são as próprias strings.

? O que `list(filter(lambda n: n > 2, [1, 2, 3, 4]))` retorna?
- [ ] [True, True]
- [ ] [1, 2]
- [x] [3, 4]
- [ ] [False, False, True, True]
> `filter` mantém os itens para os quais a função retorna verdadeiro. (Já `map` com essa lambda retornaria a lista de booleanos.)
