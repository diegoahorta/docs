# Variáveis, tipos e operadores
id: m02
nivel: Iniciante
icone: 📦
descricao: Guarde valores em variáveis, conheça os tipos básicos, converta dados, faça contas e formate números com f-strings.

## Variáveis e atribuição
fonte: Python do Zero p. 19; Pense em Python cap. 2.1

Uma **variável** é um **nome** que se refere a um **valor** guardado na memória do computador. Pense numa etiqueta colada numa caixa: a etiqueta é o nome, o conteúdo da caixa é o valor.

Para criar uma variável usamos uma **instrução de atribuição**, com o sinal `=`:

```python
mensagem = "Bom dia!"
idade = 17
pi = 3.14159

print(mensagem)
print(idade)
print(pi)
```

Leia `idade = 17` como **"idade recebe 17"**, e não "idade é igual a 17". O `=` em Python não é uma pergunta nem uma equação: é uma **ordem** para guardar o valor da direita no nome da esquerda. Por isso a ordem importa: o nome fica sempre à esquerda.

```python erro
17 = idade
```

### Diagrama de estado

Uma forma comum de representar variáveis no papel é o **diagrama de estado**: cada nome aponta com uma seta para o seu valor.

```text
mensagem ──> "Bom dia!"
idade    ──> 17
pi       ──> 3.14159
```

### Usando variáveis em expressões

Depois de criada, a variável pode ser usada no lugar do valor. O Python substitui o nome pelo valor na hora de calcular:

```python
largura = 8
altura = 5
area = largura * altura
print("Área:", area)
print("Perímetro:", 2 * (largura + altura))
```

### Reatribuição

Uma variável pode receber um **novo valor** a qualquer momento. O valor antigo é descartado e a seta passa a apontar para o novo:

```python
pontos = 10
print(pontos)
pontos = 25        # reatribuição: o 10 foi esquecido
print(pontos)
pontos = pontos + 5  # usa o valor atual (25) para calcular o novo (30)
print(pontos)
```

```text
pontos ──X──> 10
       ──X──> 25
       ─────> 30
```

A linha `pontos = pontos + 5` não faz sentido em matemática, mas em programação é muito comum: o Python primeiro calcula o lado **direito** com o valor atual e só depois guarda o resultado no lado **esquerdo**.

> ⚠️ Usar uma variável **antes** de criá-la gera `NameError`. O Python lê o código de cima para baixo.

```python erro
print(saldo)
saldo = 100
```

### Atribuição múltipla

Dá para atribuir vários nomes numa linha só, ou o mesmo valor a vários nomes:

```python
x, y, z = 1, 2, 3
print(x, y, z)

a = b = c = 0
print(a, b, c)
```

### Exercício
Crie três variáveis: `nome` com o texto `"Ana"`, `idade` com o número inteiro `30` e `altura` com o número `1.65`.

```python inicial
# crie as variáveis nome, idade e altura
```

```python solucao
nome = "Ana"
idade = 30
altura = 1.65
```

```python teste
assert "nome" in dir(), "Crie a variável nome"
assert "idade" in dir(), "Crie a variável idade"
assert "altura" in dir(), "Crie a variável altura"
assert nome == "Ana", f"nome deveria ser 'Ana', mas é {nome!r}"
assert idade == 30 and type(idade) is int, f"idade deveria ser o inteiro 30, mas é {idade!r}"
assert altura == 1.65, f"altura deveria ser 1.65, mas é {altura!r}"
```

## Nomes de variáveis e palavras reservadas
fonte: Python do Zero p. 19; Pense em Python cap. 2.2; Documentação oficial do Python (PEP 8)

Escolher bons nomes é uma das partes mais importantes de escrever código legível. Python tem algumas **regras obrigatórias** e algumas **convenções** (boas práticas).

### Regras (se quebrar, dá erro)

1. O nome deve começar com uma **letra** ou com **sublinhado** (`_`). Nunca com número.
2. Depois do primeiro caractere, pode ter letras, números e sublinhados. **Espaços, hífens e símbolos** como `@`, `$`, `!` não são permitidos.
3. Maiúsculas e minúsculas são **diferentes** (Python é *case sensitive*): `nota`, `Nota` e `NOTA` são três variáveis distintas.
4. Não se pode usar uma **palavra reservada** da linguagem.

```python
nota = 7
Nota = 8
NOTA = 9
_interno = 1
aluno2 = "Bia"
print(nota, Nota, NOTA, _interno, aluno2)
```

```python erro
2aluno = "Bia"
```

```python erro
nota-final = 8.5
```

| Nome | Válido? | Por quê |
|---|---|---|
| `preco_total` | sim | letras e sublinhado |
| `_contador` | sim | pode começar com `_` |
| `aluno1` | sim | número depois da primeira letra |
| `1aluno` | não | começa com número |
| `preço` | sim, mas evite | acentos funcionam, porém dificultam digitar e compartilhar |
| `nota final` | não | tem espaço |
| `e-mail` | não | o `-` é o operador de subtração |
| `class` | não | palavra reservada |

### Palavras reservadas

São palavras que o Python usa na própria sintaxe (como `if`, `for`, `def`). Você pode ver a lista completa com o módulo `keyword`:

```python
import keyword

print(len(keyword.kwlist), "palavras reservadas:")
print(keyword.kwlist)
print(keyword.iskeyword("class"))   # True
print(keyword.iskeyword("classe"))  # False
```

```python erro
class = "3º ano"
```

Além delas, existem as **palavras reservadas "suaves"** (`match`, `case`, `type` e `_`), que só têm significado especial em certos contextos. Elas aparecem em `keyword.softkwlist`.

> ⚠️ Evite também usar como nome de variável funções prontas do Python, como `print`, `list`, `str`, `sum`, `max`, `input`. Não dá erro na hora, mas você "apaga" a função original e ela para de funcionar no resto do programa.

```python erro
print = "oi"     # agora print é uma string, não uma função!
print("Olá")     # TypeError: 'str' object is not callable
```

### Convenções (boas práticas)

- **snake_case** para variáveis e funções: palavras minúsculas separadas por `_`. Ex.: `valor_total`, `nome_do_cliente`. É o estilo recomendado pela PEP 8, o guia oficial de estilo do Python.
- **MAIÚSCULAS** para constantes (valores que não devem mudar): `TAXA_JUROS = 0.05`.
- **PascalCase** para classes (você verá no módulo de orientação a objetos): `ContaBancaria`.
- Nomes **descritivos**: `media_notas` é muito melhor que `mn` ou `x`. Nomes de uma letra só são aceitáveis em contas curtas ou contadores de laço (`i`, `j`).

```python
# Ruim: o que é isso?
a = 1500
b = 0.12
c = a * b

# Bom: o código se explica sozinho
salario = 1500
percentual_aumento = 0.12
aumento = salario * percentual_aumento
print(aumento)
```

### Exercício
Escreva a função `nome_valido(nome)` que retorna `True` se `nome` pode ser usado como nome de variável em Python e `False` caso contrário. Dica: o método `nome.isidentifier()` diz se o texto segue as regras de formação, e `keyword.iskeyword(nome)` diz se é palavra reservada. Os dois precisam ser verificados.

```python inicial
import keyword

def nome_valido(nome):
    pass
```

```python solucao
import keyword

def nome_valido(nome):
    return nome.isidentifier() and not keyword.iskeyword(nome)
```

```python teste
casos = {"idade": True, "_x": True, "nota2": True, "valor_total": True,
         "2nota": False, "nota final": False, "e-mail": False, "class": False, "for": False, "True": False}
for n, esperado in casos.items():
    r = nome_valido(n)
    assert r == esperado, f"nome_valido({n!r}) deveria retornar {esperado}, mas retornou {r}"
```

## Tipos de dados: int, float, str, bool e None
fonte: Python do Zero p. 20; Pense em Python cap. 1.4 e 2

Todo valor em Python tem um **tipo**, que define o que ele representa e quais operações aceita. Os tipos básicos são:

| Tipo | Nome | Exemplos | Para que serve |
|---|---|---|---|
| `int` | inteiro | `0`, `42`, `-7`, `1_000_000` | contagens, idades, posições |
| `float` | ponto flutuante (real) | `3.14`, `-0.5`, `2.0`, `1e3` | medidas, dinheiro, médias |
| `str` | string (texto) | `"oi"`, `'Python'`, `"42"` | nomes, mensagens, qualquer texto |
| `bool` | booleano | `True`, `False` | respostas sim/não, condições |
| `NoneType` | nada | `None` | indicar "nenhum valor" |

A função `type()` mostra o tipo de qualquer valor ou variável:

```python
print(type(42))
print(type(3.14))
print(type("olá"))
print(type(True))
print(type(None))
```

### Inteiros (int)

Números sem parte decimal, positivos ou negativos. Em Python eles **não têm limite de tamanho**: só a memória do aparelho limita. Você pode usar `_` para separar milhares e facilitar a leitura.

```python
populacao = 215_000_000
print(populacao)
print(2 ** 100)    # um número enorme, sem problema
```

### Ponto flutuante (float)

Números com parte decimal. Em Python o separador decimal é sempre o **ponto**, nunca a vírgula. Basta ter um ponto para o número ser `float`, mesmo que seja `2.0`. A notação científica também funciona: `1.5e3` é 1500.0.

```python
preco = 19.90
print(type(preco))
print(type(2.0))
print(1.5e3, 2e-3)
```

> ⚠️ Cuidado com a vírgula: `x = 3,5` não dá erro, mas cria uma **tupla** com dois valores (3 e 5), não o número três e meio!

```python
x = 3,5
print(x, type(x))
```

### Strings (str)

Texto, escrito entre aspas simples ou duplas. Atenção: `"42"` (com aspas) é um texto, não um número.

```python
print(type("42"))
print(type(42))
print("42" == 42)   # False: texto e número são coisas diferentes
```

### Booleanos (bool)

Só têm dois valores: `True` (verdadeiro) e `False` (falso), sempre com a primeira letra **maiúscula**. Normalmente surgem de comparações:

```python
maior_de_idade = 20 >= 18
print(maior_de_idade, type(maior_de_idade))
print(5 < 2)
```

### None

`None` é um valor especial que significa **"nada", "ausência de valor"**. É útil para indicar que algo ainda não foi definido. Uma função que não retorna nada explicitamente também devolve `None`.

```python
resultado = None
print(resultado)
print(resultado is None)

r = print("o print não retorna nada...")
print(r)
```

> 💡 Para testar se algo é `None`, a forma recomendada é `x is None` (e não `x == None`).

### Exercício
Escreva a função `nome_do_tipo(valor)` que retorna o **nome** do tipo do valor como string: `"int"`, `"float"`, `"str"`, `"bool"` ou `"NoneType"`. Dica: `type(valor).__name__` dá exatamente esse nome.

```python inicial
def nome_do_tipo(valor):
    pass
```

```python solucao
def nome_do_tipo(valor):
    return type(valor).__name__
```

```python teste
casos = [(10, "int"), (2.5, "float"), ("10", "str"), (False, "bool"), (None, "NoneType"), (2.0, "float")]
for v, esperado in casos:
    r = nome_do_tipo(v)
    assert r == esperado, f"nome_do_tipo({v!r}) deveria retornar {esperado!r}, mas retornou {r!r}"
```

## Tipagem dinâmica
fonte: Python do Zero p. 19; Documentação oficial do Python

Em linguagens como C e Java, você precisa **declarar** o tipo de cada variável antes de usá-la (`int idade = 17;`). Em Python, não: o interpretador **descobre o tipo sozinho** a partir do valor atribuído. Isso se chama **tipagem dinâmica**.

```python
x = 10
print(x, type(x))
x = "dez"
print(x, type(x))
x = 10.0
print(x, type(x))
```

A mesma variável pode apontar para valores de tipos diferentes ao longo do programa, porque **o tipo pertence ao valor, não ao nome**. A variável é só uma etiqueta.

### Mas Python é fortemente tipado

Dinâmica não quer dizer "vale tudo". Python não converte tipos automaticamente quando a operação não faz sentido. Somar texto com número, por exemplo, gera `TypeError`:

```python erro
idade = 17
print("Idade: " + idade)
```

Você precisa converter explicitamente (próxima lição) ou usar vírgulas no `print`:

```python
idade = 17
print("Idade: " + str(idade))
print("Idade:", idade)
```

A exceção são os números: `int` e `float` se misturam sem problema, e o resultado vira `float`. O `bool` também se comporta como número (`True` vale 1 e `False` vale 0):

```python
print(5 + 2.5)
print(True + True + False)
```

### Dicas de tipo (type hints)

Desde o Python 3.5 é possível **anotar** o tipo esperado de uma variável. Isso **não muda** o comportamento do programa (o Python não verifica nada), mas ajuda a documentar o código e permite que editores e ferramentas como o *mypy* encontrem erros.

```python
nome: str = "Carlos"
idade: int = 40
altura: float = 1.80
print(nome, idade, altura)

idade = "quarenta"   # o Python não reclama: a anotação é só uma dica
print(idade)
```

> 💡 A tipagem dinâmica deixa o código curto e flexível, mas exige atenção: dê nomes que indiquem o conteúdo e evite reaproveitar a mesma variável para coisas de tipos diferentes.

## Conversão de tipos
fonte: Python do Zero p. 21; Pense em Python cap. 3.1

Muitas vezes precisamos transformar um valor de um tipo em outro, por exemplo um texto `"25"` digitado pelo usuário no número `25`. Para isso usamos funções com o nome do tipo:

| Função | Converte para | Exemplos |
|---|---|---|
| `int(x)` | inteiro | `int("42")` → `42`, `int(3.99)` → `3` |
| `float(x)` | real | `float("2.5")` → `2.5`, `float(7)` → `7.0` |
| `str(x)` | texto | `str(10)` → `"10"`, `str(1.5)` → `"1.5"` |
| `bool(x)` | booleano | `bool(0)` → `False`, `bool("oi")` → `True` |

```python
texto = "25"
numero = int(texto)
print(numero + 5)        # 30: agora é conta
print(texto + "5")       # 255: com texto é concatenação!

print(float("3.75"))
print(str(100) + " reais")
```

### int() trunca, não arredonda

Ao converter um `float` em `int`, a parte decimal é simplesmente **cortada** (em direção ao zero). Para arredondar, use `round()`:

```python
print(int(3.99))     # 3
print(int(-3.99))    # -3
print(round(3.99))   # 4
```

### bool(): o que é verdadeiro?

`bool()` retorna `False` para valores "vazios" ou zero (`0`, `0.0`, `""`, `None`) e `True` para todo o resto:

```python
print(bool(0), bool(0.0), bool(""), bool(None))
print(bool(1), bool(-5), bool("0"), bool(" "), bool("False"))
```

> ⚠️ Repare que `bool("False")` é `True`! Qualquer string **não vazia** é verdadeira, não importa o conteúdo.

### Erros comuns de conversão

Se o texto não representa um número válido, a conversão gera `ValueError`:

```python erro
int("doze")
```

```python erro
int("3.5")    # int() não aceita texto com ponto decimal
```

```python erro
float("3,5")  # vírgula não é separador decimal em Python
```

Soluções para os dois últimos casos:

```python
print(int(float("3.5")))          # primeiro float, depois int
print(float("3,5".replace(",", ".")))  # troca a vírgula por ponto
print(int("  42  "))              # espaços nas pontas são aceitos
```

> 💡 Você vai aprender a **tratar** esses erros com `try`/`except` no módulo de erros e depuração, para que o programa não pare quando o usuário digitar algo inválido.

### Exercício
Escreva a função `somar_textos(a, b)` que recebe dois números escritos como texto (podem ter casas decimais com **ponto** ou com **vírgula**, como `"2,5"`) e retorna a soma como `float`.

```python inicial
def somar_textos(a, b):
    return a + b
```

```python solucao
def somar_textos(a, b):
    x = float(a.replace(",", "."))
    y = float(b.replace(",", "."))
    return x + y
```

```python teste
r = somar_textos("2", "3")
assert r == 5.0 and isinstance(r, float), f"somar_textos('2', '3') deveria retornar 5.0 (float), mas retornou {r!r}"
r = somar_textos("2,5", "1.5")
assert r == 4.0, f"somar_textos('2,5', '1.5') deveria retornar 4.0, mas retornou {r!r}"
r = somar_textos("10", "0,25")
assert r == 10.25, f"somar_textos('10', '0,25') deveria retornar 10.25, mas retornou {r!r}"
```

## Entrada de dados com input()
fonte: Python do Zero p. 21; Pense em Python cap. 5.11

A função `input()` faz o programa **parar e esperar** o usuário digitar algo. O texto entre parênteses é a mensagem (o *prompt*) mostrada antes da digitação. Quando a pessoa confirma, `input()` **retorna** o que foi digitado.

```python
nome = input("Qual é o seu nome? ")
print("Olá,", nome)
```

> 💡 Neste app, o `input()` abre uma caixa de diálogo para você digitar.

### input() sempre retorna str

Esse é o ponto que mais confunde iniciantes: mesmo que a pessoa digite um número, o valor vem como **texto**.

```python
valor = input("Digite um número: ")
print(type(valor))
print(valor * 2)    # repete o texto em vez de dobrar o número!
```

Por isso, para fazer contas, converta o resultado com `int()` ou `float()`:

```python
idade = int(input("Sua idade: "))
print("Daqui a 10 anos você terá", idade + 10, "anos.")

altura = float(input("Sua altura em metros: "))
print("Metade da sua altura:", altura / 2)
```

Esquecer a conversão leva a erros como este:

```python erro
idade = input("Sua idade: ")
print(idade + 10)
```

### Um programa completo

Um padrão muito comum: **ler** os dados, **processar** e **mostrar** o resultado.

```python
# Entrada
celsius = float(input("Temperatura em °C: "))

# Processamento
fahrenheit = celsius * 9 / 5 + 32

# Saída
print(celsius, "°C equivalem a", fahrenheit, "°F")
```

> ⚠️ Se a pessoa digitar algo que não é número, `int()`/`float()` gera `ValueError`. Por enquanto, confie no usuário; mais adiante você aprenderá a validar a entrada.

> 💡 Nos exercícios deste app você vai escrever **funções que recebem parâmetros** em vez de usar `input()`. Assim o código pode ser testado automaticamente, e é também como se escreve código reutilizável na vida real: a função faz a conta, e quem a chama decide de onde vêm os dados.

### Exercício
Escreva a função `celsius_para_fahrenheit(c)` que recebe uma temperatura em graus Celsius e retorna o valor em Fahrenheit, usando a fórmula F = C × 9/5 + 32.

```python inicial
def celsius_para_fahrenheit(c):
    pass
```

```python solucao
def celsius_para_fahrenheit(c):
    return c * 9 / 5 + 32
```

```python teste
for c, f in [(0, 32), (100, 212), (-40, -40), (37, 98.6)]:
    r = celsius_para_fahrenheit(c)
    assert r is not None, "A função deve retornar (return) o valor, não apenas imprimir"
    assert abs(r - f) < 1e-9, f"celsius_para_fahrenheit({c}) deveria dar {f}, mas deu {r}"
```

## Operadores aritméticos
fonte: Python do Zero p. 27; Pense em Python cap. 1.3 e 2.6

| Operador | Operação | Exemplo | Resultado |
|---|---|---|---|
| `+` | soma | `7 + 2` | `9` |
| `-` | subtração | `7 - 2` | `5` |
| `*` | multiplicação | `7 * 2` | `14` |
| `/` | divisão real | `7 / 2` | `3.5` |
| `//` | divisão inteira (piso) | `7 // 2` | `3` |
| `%` | resto da divisão (módulo) | `7 % 2` | `1` |
| `**` | potência | `7 ** 2` | `49` |
| `-x` | negativo | `-7` | `-7` |

```python
a, b = 17, 5
print("soma:", a + b)
print("subtração:", a - b)
print("multiplicação:", a * b)
print("divisão:", a / b)
print("divisão inteira:", a // b)
print("resto:", a % b)
print("potência:", a ** b)
```

### Divisão: / sempre dá float

O operador `/` **sempre** retorna `float`, mesmo quando a divisão é exata. Se você quer um inteiro, use `//`:

```python
print(10 / 2)    # 5.0
print(10 // 2)   # 5
print(type(10 / 2), type(10 // 2))
```

> ⚠️ Com números negativos, `//` arredonda **para baixo** (para menos infinito), não em direção ao zero: `-7 // 2` dá `-4`, não `-3`.

```python
print(7 // 2, -7 // 2)
print(7 % 3, -7 % 3)
```

### Para que serve o resto (%)?

O operador `%` é muito mais útil do que parece:

- **par ou ímpar**: `n % 2` é `0` para pares e `1` para ímpares;
- **divisibilidade**: `n % 3 == 0` diz se `n` é múltiplo de 3;
- **último dígito**: `n % 10` pega o algarismo das unidades; `n % 100`, os dois últimos;
- **conversões de unidade**: segundos em minutos e segundos, por exemplo.

```python
n = 1234
print(n % 2)      # 0 -> par
print(n % 10)     # 4 -> último dígito
print(n // 10)    # 123 -> remove o último dígito

total_seg = 200
print(total_seg // 60, "min e", total_seg % 60, "s")
```

### divmod, abs, round, pow, min e max

```python
print(divmod(200, 60))   # (3, 20): quociente e resto juntos
minutos, segundos = divmod(200, 60)
print(minutos, segundos)

print(abs(-8.5))         # 8.5: valor absoluto
print(round(3.14159, 2)) # 3.14: arredonda para 2 casas
print(round(2.5), round(3.5))  # 2 4: arredondamento "do banqueiro"
print(pow(2, 10))        # 1024, igual a 2 ** 10
print(min(4, 9, 1), max(4, 9, 1))
```

> 💡 `round()` com empate (`.5`) arredonda para o número **par** mais próximo. Isso reduz o viés em somas grandes, mas surpreende quem espera que `round(2.5)` seja 3.

### Precedência de operadores

Quando uma expressão tem vários operadores, o Python segue uma ordem, como na matemática. Em português, o mnemônico **PEMDAS** ajuda: **P**arênteses, **E**xponenciação, **M**ultiplicação e **D**ivisão, **A**dição e **S**ubtração.

| Prioridade | Operadores |
|---|---|
| 1 (maior) | `( )` parênteses |
| 2 | `**` potência |
| 3 | `-x` sinal negativo |
| 4 | `*`, `/`, `//`, `%` |
| 5 (menor) | `+`, `-` |

Operadores com a mesma prioridade são avaliados da **esquerda para a direita**, exceto `**`, que vai da direita para a esquerda.

```python
print(2 + 3 * 4)       # 14, não 20
print((2 + 3) * 4)     # 20
print(2 ** 3 ** 2)     # 512 = 2 ** 9
print(-2 ** 2)         # -4: a potência vem antes do sinal
print((-2) ** 2)       # 4
print(10 - 4 - 3)      # 3: da esquerda para a direita
```

> 💡 Na dúvida, **use parênteses**. Eles deixam a intenção clara para quem lê, mesmo quando não são estritamente necessários.

### Dividir por zero

```python erro
print(10 / 0)
```

### Exercício
Escreva a função `converter_segundos(total)` que recebe uma quantidade de segundos e retorna uma tupla `(horas, minutos, segundos)`. Exemplo: `converter_segundos(3725)` retorna `(1, 2, 5)`, pois 3725 s = 1 h, 2 min e 5 s.

```python inicial
def converter_segundos(total):
    pass
```

```python solucao
def converter_segundos(total):
    horas, resto = divmod(total, 3600)
    minutos, segundos = divmod(resto, 60)
    return (horas, minutos, segundos)
```

```python teste
for t, esp in [(3725, (1, 2, 5)), (0, (0, 0, 0)), (59, (0, 0, 59)), (3600, (1, 0, 0)), (86399, (23, 59, 59))]:
    r = converter_segundos(t)
    assert r is not None, "A função deve retornar uma tupla com return"
    assert tuple(r) == esp, f"converter_segundos({t}) deveria retornar {esp}, mas retornou {r}"
```

## Atribuição composta e troca de valores
fonte: Pense em Python cap. 7.1 e 12.2

É muito comum atualizar uma variável a partir do seu próprio valor: somar pontos, descontar um valor, dobrar uma quantidade. Para isso existem os **operadores de atribuição composta**:

| Forma curta | Equivale a |
|---|---|
| `x += 3` | `x = x + 3` |
| `x -= 3` | `x = x - 3` |
| `x *= 3` | `x = x * 3` |
| `x /= 3` | `x = x / 3` |
| `x //= 3` | `x = x // 3` |
| `x %= 3` | `x = x % 3` |
| `x **= 3` | `x = x ** 3` |

```python
saldo = 100
saldo += 50     # depósito
print(saldo)
saldo -= 30     # saque
print(saldo)
saldo *= 2
print(saldo)
saldo /= 4      # repare: vira float
print(saldo)
```

Eles também funcionam com strings:

```python
frase = "Olá"
frase += ", mundo"
frase += "!"
print(frase)

linha = "-"
linha *= 20
print(linha)
```

> ⚠️ Python **não tem** os operadores `++` e `--` de C e Java. Escreva `x += 1`. Curiosidade: `++x` não dá erro, mas não faz nada (é só "mais mais x"), e `x++` é erro de sintaxe.

```python erro
contador = 0
contador++
```

> ⚠️ Para usar `+=`, a variável já precisa existir. `total += 5` sem ter criado `total` antes gera `NameError`. Por isso, contadores e acumuladores costumam ser **inicializados** com `0`.

### Trocando os valores de duas variáveis

Em muitas linguagens, para trocar os valores de `a` e `b` é preciso uma variável auxiliar:

```python
a = 1
b = 2
aux = a
a = b
b = aux
print(a, b)
```

Em Python existe um jeito mais elegante, a **atribuição de tupla**: o lado direito é calculado inteiro **antes** de qualquer atribuição.

```python
a = 1
b = 2
a, b = b, a
print(a, b)
```

> ⚠️ Fazer só `a = b` e depois `b = a` **não** troca: na segunda linha, `a` já perdeu o valor original e as duas variáveis ficam iguais.

```python
a, b = 1, 2
a = b
b = a
print(a, b)   # 2 2 -- errado!
```

### Exercício
Escreva a função `aplicar_operacoes(x)` que, a partir de `x`, faz em sequência e usando atribuição composta: soma 10, multiplica por 3, subtrai 4 e faz a divisão inteira por 2. Retorne o resultado final. Exemplo: para `x = 2` → 12 → 36 → 32 → `16`.

```python inicial
def aplicar_operacoes(x):
    return x
```

```python solucao
def aplicar_operacoes(x):
    x += 10
    x *= 3
    x -= 4
    x //= 2
    return x
```

```python teste
for x, esp in [(2, 16), (0, 13), (5, 20), (-10, -2)]:
    r = aplicar_operacoes(x)
    assert r == esp, f"aplicar_operacoes({x}) deveria retornar {esp}, mas retornou {r}"
```

## f-strings e formatação de números
fonte: Documentação oficial do Python (Formatted string literals); Pense em Python cap. 14.3

Juntar texto e valores com `+` e `str()` é trabalhoso. A forma moderna e recomendada é a **f-string**: coloque um `f` antes das aspas e escreva variáveis ou expressões entre chaves `{}`.

```python
nome = "Lia"
idade = 28
print(f"{nome} tem {idade} anos.")
print(f"Daqui a 5 anos, {nome} terá {idade + 5}.")
print(f"Nome em maiúsculas: {nome.upper()}")
```

### Formatando números

Depois do valor, dentro das chaves, você pode colocar `:` seguido de um **especificador de formato**:

| Formato | Significado | Exemplo | Resultado |
|---|---|---|---|
| `:.2f` | 2 casas decimais | `f"{3.14159:.2f}"` | `3.14` |
| `:.0f` | sem casas (arredonda) | `f"{2.7:.0f}"` | `3` |
| `:,` | separador de milhar | `f"{1234567:,}"` | `1,234,567` |
| `:,.2f` | milhar + 2 casas | `f"{1234.5:,.2f}"` | `1,234.50` |
| `:.1%` | porcentagem | `f"{0.256:.1%}"` | `25.6%` |
| `:>10` | alinha à direita em 10 | `f"{'oi':>10}"` | `        oi` |
| `:<10` | alinha à esquerda | `f"{'oi':<10}"` | `oi        ` |
| `:^10` | centraliza | `f"{'oi':^10}"` | `    oi    ` |
| `:05d` | completa com zeros | `f"{42:05d}"` | `00042` |
| `:e` | notação científica | `f"{12345.678:.2e}"` | `1.23e+04` |

```python
preco = 1234.5
print(f"Preço: R$ {preco:.2f}")
print(f"Grande: {9876543.21:,.2f}")
print(f"Desconto: {0.15:.0%}")
print(f"Pedido nº {7:04d}")
```

### Alinhando uma tabela

```python
itens = [("Café", 12.5), ("Pão de queijo", 4.0), ("Suco", 8.75)]
for nome, valor in itens:
    print(f"{nome:<15}{valor:>8.2f}")
print(f"{'TOTAL':<15}{25.25:>8.2f}")
```

Você pode escolher o caractere de preenchimento antes do alinhamento:

```python
print(f"{'MENU':*^20}")
print(f"{'fim':-<20}")
```

### Formato brasileiro de dinheiro

O padrão do Python usa vírgula para milhar e ponto para decimais (padrão americano). Um truque simples para o formato brasileiro é trocar os símbolos:

```python
valor = 1234567.891
us = f"{valor:,.2f}"
br = us.replace(",", "X").replace(".", ",").replace("X", ".")
print(us)
print("R$", br)
```

### Depuração com =

Colocar `=` depois da expressão mostra o próprio código e o valor. Ótimo para depurar:

```python
x = 7
y = 3
print(f"{x=}, {y=}, {x * y=}")
```

### Outras formas (você vai encontrar em códigos antigos)

```python
nome, nota = "Rui", 8.456
print("Aluno: {} nota {:.1f}".format(nome, nota))   # método format
print("Aluno: %s nota %.1f" % (nome, nota))          # estilo antigo com %
print(f"Aluno: {nome} nota {nota:.1f}")              # f-string (preferida)
```

> ⚠️ Esqueceu o `f` antes das aspas? As chaves aparecem literalmente no texto: `"{nome}"` imprime `{nome}`.

### Exercício
Escreva a função `formatar_preco(produto, valor)` que retorna uma string no formato `"Produto: R$ valor"` com **duas casas decimais**. Exemplo: `formatar_preco("Caneta", 2.5)` retorna `"Caneta: R$ 2.50"`.

```python inicial
def formatar_preco(produto, valor):
    pass
```

```python solucao
def formatar_preco(produto, valor):
    return f"{produto}: R$ {valor:.2f}"
```

```python teste
for p, v, esp in [("Caneta", 2.5, "Caneta: R$ 2.50"), ("Livro", 39.9, "Livro: R$ 39.90"),
                  ("Bala", 0.1, "Bala: R$ 0.10"), ("TV", 1999, "TV: R$ 1999.00"), ("Chiclete", 1.256, "Chiclete: R$ 1.26")]:
    r = formatar_preco(p, v)
    assert r == esp, f"formatar_preco({p!r}, {v}) deveria retornar {esp!r}, mas retornou {r!r}"
```

## O módulo math e a imprecisão do float
fonte: Pense em Python cap. 3.3; Documentação oficial do Python (math, Floating Point Arithmetic)

Python já vem com um **módulo** de matemática, o `math`. Um módulo é um arquivo com funções e valores prontos; para usá-lo, é preciso **importá-lo** e depois acessar o conteúdo com um ponto (`math.nome`):

```python
import math

print(math.pi)
print(math.e)
print(math.sqrt(16))     # raiz quadrada
print(math.sqrt(2))
print(math.floor(3.7))   # arredonda para baixo: 3
print(math.ceil(3.2))    # arredonda para cima: 4
print(math.trunc(-3.7))  # corta a parte decimal: -3
```

| Função | O que faz | Exemplo |
|---|---|---|
| `math.sqrt(x)` | raiz quadrada | `math.sqrt(25)` → `5.0` |
| `math.pi`, `math.e` | constantes π e e | `3.14159...`, `2.71828...` |
| `math.floor(x)` | maior inteiro ≤ x | `math.floor(-2.5)` → `-3` |
| `math.ceil(x)` | menor inteiro ≥ x | `math.ceil(-2.5)` → `-2` |
| `math.pow(x, y)` | potência (sempre float) | `math.pow(2, 3)` → `8.0` |
| `math.factorial(n)` | fatorial | `math.factorial(5)` → `120` |
| `math.gcd(a, b)` | máximo divisor comum | `math.gcd(12, 18)` → `6` |
| `math.hypot(a, b)` | hipotenusa | `math.hypot(3, 4)` → `5.0` |
| `math.log(x)`, `math.log10(x)` | logaritmos | `math.log10(1000)` → `3.0` |
| `math.sin`, `math.cos`, `math.radians` | trigonometria | ângulos em radianos |

```python
import math

raio = 3
area = math.pi * raio ** 2
print(f"Área do círculo: {area:.2f}")

graus = 30
print(f"seno de 30°: {math.sin(math.radians(graus)):.2f}")
print(math.factorial(10))
```

Também é possível importar só o que você precisa:

```python
from math import sqrt, pi
print(sqrt(81), pi)
```

```python erro
import math
print(math.sqrt(-1))   # raiz de negativo não existe nos reais
```

### Por que 0.1 + 0.2 não dá 0.3?

Execute e veja:

```python
print(0.1 + 0.2)
print(0.1 + 0.2 == 0.3)
```

Isso **não é um bug do Python**: acontece em praticamente todas as linguagens. O computador guarda números `float` em **binário**, e assim como 1/3 não tem representação exata em decimal (0,3333...), números como 0.1 não têm representação exata em binário. O valor guardado é uma aproximação muito, muito próxima, e pequenos erros aparecem nas contas.

Como lidar com isso:

1. **Nunca compare floats com `==`**. Use `math.isclose()` ou verifique se a diferença é pequena.
2. Para **exibir**, arredonde com `round()` ou f-strings (`:.2f`).
3. Para **dinheiro**, trabalhe em centavos com `int` ou use o módulo `decimal`.

```python
import math
from decimal import Decimal

print(math.isclose(0.1 + 0.2, 0.3))     # True
print(abs((0.1 + 0.2) - 0.3) < 1e-9)    # True
print(f"{0.1 + 0.2:.2f}")                # 0.30
print(Decimal("0.1") + Decimal("0.2"))   # 0.3 exato
print(10 + 20, "centavos")               # inteiros são exatos
```

> 💡 Inteiros em Python são sempre exatos, por maiores que sejam. A imprecisão só afeta os `float`.

### Exercício
Escreva a função `hipotenusa(a, b)` que retorna o comprimento da hipotenusa de um triângulo retângulo com catetos `a` e `b`, usando `math.sqrt` (Teorema de Pitágoras: h = √(a² + b²)), **arredondado para 2 casas decimais**.

```python inicial
import math

def hipotenusa(a, b):
    pass
```

```python solucao
import math

def hipotenusa(a, b):
    return round(math.sqrt(a ** 2 + b ** 2), 2)
```

```python teste
for a, b, esp in [(3, 4, 5.0), (5, 12, 13.0), (1, 1, 1.41), (2, 3, 3.61), (0.5, 0.5, 0.71)]:
    r = hipotenusa(a, b)
    assert r is not None, "A função deve retornar o valor com return"
    assert r == esp, f"hipotenusa({a}, {b}) deveria retornar {esp}, mas retornou {r}"
```

## Quiz
? Qual instrução cria a variável `total` com o valor 10?
- [ ] 10 = total
- [x] total = 10
- [ ] total == 10
- [ ] int total = 10
> O nome fica à esquerda e o valor à direita do `=`. `==` é comparação, e Python não declara o tipo antes do nome.

? Qual destes nomes de variável é INVÁLIDO?
- [ ] _valor
- [ ] valor2
- [x] 2valor
- [ ] valor_total
> Nomes não podem começar com número. Podem começar com letra ou sublinhado.

? Qual é o tipo do valor `"3.5"`?
- [ ] float
- [ ] int
- [x] str
- [ ] bool
> Está entre aspas, então é texto (str), mesmo parecendo um número.

? O que `input()` retorna quando o usuário digita 42?
- [ ] o inteiro 42
- [ ] o float 42.0
- [x] a string "42"
- [ ] None
> `input()` sempre retorna `str`. Para fazer contas, converta com `int()` ou `float()`.

? Qual é o resultado de `17 // 5` e `17 % 5`, respectivamente?
- [ ] 3.4 e 2
- [x] 3 e 2
- [ ] 3 e 3
- [ ] 2 e 3
> `//` é a divisão inteira (17 ÷ 5 = 3, sobra 2) e `%` é o resto (2).

? Qual é o resultado de `2 + 3 * 2 ** 2`?
- [ ] 100
- [ ] 22
- [x] 14
- [ ] 36
> Primeiro a potência (2 ** 2 = 4), depois a multiplicação (3 * 4 = 12) e por fim a soma (2 + 12 = 14).

? O que `int(7.9)` retorna?
- [x] 7
- [ ] 8
- [ ] 7.9
- [ ] ValueError
> `int()` corta a parte decimal (trunca), não arredonda. Para arredondar use `round(7.9)`, que dá 8.

? Depois de `a, b = 5, 9` e `a, b = b, a`, quanto valem `a` e `b`?
- [ ] 5 e 9
- [x] 9 e 5
- [ ] 9 e 9
- [ ] 5 e 5
> A atribuição de tupla calcula o lado direito inteiro antes de atribuir, então os valores são trocados.

? O que `print(f"{3.14159:.2f}")` mostra?
- [ ] 3.14159
- [ ] 3.1
- [x] 3.14
- [ ] {3.14159:.2f}
> `:.2f` formata o número com exatamente duas casas decimais.

? Por que `0.1 + 0.2 == 0.3` resulta em `False`?
- [ ] Porque Python tem um bug na soma
- [x] Porque floats são guardados em binário de forma aproximada
- [ ] Porque 0.1 é um int
- [ ] Porque o == compara apenas inteiros
> Muitos decimais não têm representação exata em binário. Compare floats com `math.isclose()` ou arredonde.
