# Estruturas de decisão
id: m04
nivel: Básico
icone: 🔀
descricao: Faça o programa tomar decisões com comparações, operadores lógicos, if/elif/else, expressões condicionais e match/case.

## Valores booleanos e operadores de comparação
fonte: Python do Zero p. 27; Pense em Python cap. 5.2

Até agora nossos programas executavam todas as linhas, sempre na mesma ordem. Para que um programa **tome decisões**, ele precisa fazer perguntas cujas respostas são **sim** ou **não**. Em Python, essas respostas são os valores **booleanos** `True` e `False` (tipo `bool`).

Uma **expressão booleana** é uma expressão que resulta em `True` ou `False`. As mais comuns usam os **operadores de comparação**:

| Operador | Significado | Exemplo | Resultado |
|---|---|---|---|
| `==` | igual a | `5 == 5` | `True` |
| `!=` | diferente de | `5 != 3` | `True` |
| `>` | maior que | `5 > 7` | `False` |
| `<` | menor que | `5 < 7` | `True` |
| `>=` | maior ou igual | `5 >= 5` | `True` |
| `<=` | menor ou igual | `4 <= 3` | `False` |

```python
idade = 20
print(idade >= 18)
print(idade == 18)
print(idade != 18)
print(type(idade > 0))
```

O resultado de uma comparação pode ser guardado numa variável, como qualquer outro valor:

```python
nota = 7.5
aprovado = nota >= 7
print("Aprovado?", aprovado)
```

> ⚠️ Não confunda `=` com `==`. Um sinal só é **atribuição** ("recebe"); dois sinais é **comparação** ("é igual a?"). Usar `=` onde se espera uma comparação costuma gerar `SyntaxError`.

```python erro
x = 5
if x = 5:
    print("cinco")
```

### Comparando tipos diferentes

Números `int` e `float` se comparam normalmente. Já texto e número **nunca** são iguais, e não podem ser comparados com `<` ou `>`:

```python
print(2 == 2.0)
print("2" == 2)
print("abc" == "abc", "abc" == "ABC")
```

```python erro
print("10" > 5)
```

### Comparações encadeadas

Em Python você pode escrever intervalos como na matemática. `1 < x < 10` significa "x é maior que 1 **e** menor que 10":

```python
x = 5
print(1 < x < 10)
print(0 <= x <= 3)

temperatura = 36.8
print(36 <= temperatura <= 37.5)   # temperatura normal?
```

Na verdade, `a < b < c` equivale a `a < b and b < c`. Isso é exclusivo de Python: em muitas outras linguagens essa escrita não funciona como esperado.

> 💡 Lembre-se do que você viu no módulo anterior: não use `==` para comparar floats calculados (`0.1 + 0.2 == 0.3` é `False`). Use `math.isclose()`.

### Exercício
Escreva a função `esta_no_intervalo(x, minimo, maximo)` que retorna `True` se `x` estiver entre `minimo` e `maximo`, **incluindo** os extremos, e `False` caso contrário. Use uma comparação encadeada.

```python inicial
def esta_no_intervalo(x, minimo, maximo):
    pass
```

```python solucao
def esta_no_intervalo(x, minimo, maximo):
    return minimo <= x <= maximo
```

```python teste
casos = [((5, 1, 10), True), ((1, 1, 10), True), ((10, 1, 10), True), ((0, 1, 10), False), ((11, 1, 10), False), ((-2.5, -3, 0), True)]
for args, esp in casos:
    r = esta_no_intervalo(*args)
    assert r == esp, f"esta_no_intervalo{args} deveria retornar {esp}, mas retornou {r}"
```

## Operadores lógicos: and, or, not
fonte: Python do Zero p. 28; Pense em Python cap. 5.3

Os **operadores lógicos** combinam expressões booleanas:

- `and` (**e**): verdadeiro só se **as duas** condições forem verdadeiras;
- `or` (**ou**): verdadeiro se **pelo menos uma** for verdadeira;
- `not` (**não**): inverte o valor.

### Tabela-verdade

| A | B | `A and B` | `A or B` | `not A` |
|---|---|---|---|---|
| `True` | `True` | `True` | `True` | `False` |
| `True` | `False` | `False` | `True` | `False` |
| `False` | `True` | `False` | `True` | `True` |
| `False` | `False` | `False` | `False` | `True` |

```python
idade = 25
tem_carteira = True

print(idade >= 18 and tem_carteira)   # pode dirigir?
print(idade < 12 or idade >= 65)       # tem desconto?
print(not tem_carteira)
```

### Precedência

`not` é avaliado primeiro, depois `and`, e por último `or`. Todos os operadores de comparação são avaliados **antes** dos lógicos. Na dúvida, use parênteses:

```python
a, b, c = True, False, True
print(a or b and c)       # a or (b and c) -> True
print((a or b) and c)     # True
print(not a or b)         # (not a) or b -> False
print(not (a or b))       # False
```

> ⚠️ Um erro clássico: `x == 1 or 2` **não** significa "x é 1 ou 2". O Python lê `(x == 1) or 2`, e como `2` é considerado verdadeiro, o resultado nunca é falso! Escreva `x == 1 or x == 2`, ou melhor, `x in (1, 2)`.

```python
x = 5
print(x == 1 or 2)          # 2  -> "verdadeiro" sempre!
print(x == 1 or x == 2)     # False, correto
print(x in (1, 2))          # False, correto e mais curto
```

### Avaliação em curto-circuito

O Python é "preguiçoso" com `and` e `or`: ele para de avaliar assim que já sabe a resposta.

- Em `A and B`, se `A` é falso, o resultado já é falso, e `B` **nem é avaliado**.
- Em `A or B`, se `A` é verdadeiro, o resultado já é verdadeiro, e `B` **nem é avaliado**.

Isso permite escrever proteções como esta, que evita a divisão por zero:

```python
divisor = 0
if divisor != 0 and 10 / divisor > 2:
    print("grande")
else:
    print("divisor zero ou resultado pequeno")
```

Se invertêssemos a ordem, a divisão aconteceria primeiro e daria erro:

```python erro
divisor = 0
if 10 / divisor > 2 and divisor != 0:
    print("grande")
```

> 💡 Curiosidade: `and` e `or` não retornam necessariamente `True`/`False`, mas sim **um dos operandos**. `"" or "padrão"` retorna `"padrão"`, o que é usado como atalho para valores padrão. Você entenderá melhor na lição sobre valores *truthy* e *falsy*.

### Exercício
Escreva a função `pode_votar(idade, alistado)` que retorna `True` se a pessoa tem **16 anos ou mais** e está alistada (`alistado` é `True`), e `False` caso contrário.

```python inicial
def pode_votar(idade, alistado):
    pass
```

```python solucao
def pode_votar(idade, alistado):
    return idade >= 16 and alistado
```

```python teste
casos = [((16, True), True), ((30, True), True), ((15, True), False), ((30, False), False), ((10, False), False)]
for args, esp in casos:
    r = pode_votar(*args)
    assert r == esp, f"pode_votar{args} deveria retornar {esp}, mas retornou {r}"
```

## A instrução if e os blocos indentados
fonte: Python do Zero p. 35; Pense em Python cap. 5.4

A instrução `if` (**se**) executa um bloco de código **somente se** uma condição for verdadeira:

```python
temperatura = 32
if temperatura > 30:
    print("Está calor!")
    print("Beba bastante água.")
print("Fim do programa")
```

A estrutura é sempre:

```text
if condição:
    instrução 1      <- bloco: executado só se a condição for True
    instrução 2
instrução seguinte   <- fora do bloco: sempre executada
```

Três detalhes de sintaxe fundamentais:

1. a linha do `if` termina com **dois-pontos** `:`;
2. as instruções do bloco são **indentadas** (recuadas), por convenção com **4 espaços**;
3. o bloco termina quando a indentação volta ao nível anterior.

Experimente mudar a temperatura para 25 e executar de novo:

```python
temperatura = 25
if temperatura > 30:
    print("Está calor!")
    print("Beba bastante água.")
print("Fim do programa")
```

### Erros de indentação

```python erro
nota = 8
if nota >= 7
    print("aprovado")
```

```python erro
nota = 8
if nota >= 7:
print("aprovado")
```

```python erro
nota = 8
if nota >= 7:
    print("aprovado")
      print("parabéns")
```

> ⚠️ Não misture TAB e espaços. Configure seu editor para inserir 4 espaços ao apertar TAB (quase todos já fazem isso).

### Um bloco não pode ficar vazio

Se você ainda não sabe o que colocar no bloco, use `pass`, uma instrução que não faz nada:

```python
x = -1
if x < 0:
    pass   # TODO: tratar números negativos depois
print("ok")
```

### Vários if independentes

Cada `if` é testado separadamente. Se várias condições forem verdadeiras, vários blocos serão executados:

```python
numero = 12
if numero % 2 == 0:
    print("é par")
if numero % 3 == 0:
    print("é múltiplo de 3")
if numero > 100:
    print("é maior que 100")
```

### Exercício
Escreva a função `aplicar_desconto(valor)` que retorna o valor a pagar: se o valor da compra for **maior ou igual a 100**, aplique 10% de desconto; caso contrário, retorne o próprio valor. Use um `if`.

```python inicial
def aplicar_desconto(valor):
    return None
```

```python solucao
def aplicar_desconto(valor):
    if valor >= 100:
        valor = valor * 0.9
    return valor
```

```python teste
import math
for v, esp in [(50, 50), (100, 90), (200, 180), (99.99, 99.99), (0, 0)]:
    r = aplicar_desconto(v)
    assert r is not None, "A função deve retornar o valor a pagar"
    assert math.isclose(r, esp), f"aplicar_desconto({v}) deveria retornar {esp}, mas retornou {r}"
```

## if/else: escolhendo entre dois caminhos
fonte: Python do Zero p. 36; Pense em Python cap. 5.5

Com `else` (**senão**) definimos o que fazer quando a condição é **falsa**. Exatamente **um** dos dois blocos é executado, nunca os dois e nunca nenhum:

```python
numero = 7
if numero % 2 == 0:
    print(numero, "é par")
else:
    print(numero, "é ímpar")
```

Cada caminho alternativo é chamado de **ramo** (*branch*).

```python
saldo = 50
saque = 80
if saque <= saldo:
    saldo -= saque
    print("Saque realizado. Saldo:", saldo)
else:
    print("Saldo insuficiente! Você tem", saldo)
```

### if/else em funções

É muito comum uma função **retornar** valores diferentes dependendo de uma condição:

```python
def absoluto(x):
    if x < 0:
        return -x
    else:
        return x

print(absoluto(-5), absoluto(3))
```

Como `return` encerra a função imediatamente, o `else` às vezes pode ser omitido. As duas versões funcionam igual:

```python
def absoluto(x):
    if x < 0:
        return -x
    return x

print(absoluto(-5), absoluto(3))
```

> ⚠️ Quando a função tem `return` dentro de `if`, garanta que **todo caminho** retorne algo. Se nenhum `return` for executado, a função retorna `None` silenciosamente.

```python
def sinal(x):
    if x > 0:
        return "positivo"
    if x < 0:
        return "negativo"
    # esquecemos o caso x == 0!

print(sinal(0))   # None
```

> 💡 Se a função só retorna `True` ou `False` conforme a condição, retorne a própria condição: em vez de `if x % 2 == 0: return True else: return False`, escreva simplesmente `return x % 2 == 0`.

### Exercício
Escreva a função `par_ou_impar(n)` que retorna a string `"par"` se `n` for par e `"ímpar"` caso contrário (com acento).

```python inicial
def par_ou_impar(n):
    pass
```

```python solucao
def par_ou_impar(n):
    if n % 2 == 0:
        return "par"
    else:
        return "ímpar"
```

```python teste
for n, esp in [(4, "par"), (7, "ímpar"), (0, "par"), (-3, "ímpar"), (100, "par")]:
    r = par_ou_impar(n)
    assert r == esp, f"par_ou_impar({n}) deveria retornar {esp!r}, mas retornou {r!r}"
```

## if/elif/else: várias alternativas
fonte: Python do Zero p. 36–37; Pense em Python cap. 5.6

Quando há **mais de duas** possibilidades, usamos `elif` (abreviação de *else if*, "senão se"). As condições são testadas **em ordem**, de cima para baixo, e **só o primeiro** bloco verdadeiro é executado; os demais são ignorados. O `else` final (opcional) pega todos os casos restantes.

```python
nota = 7.8
if nota >= 9:
    conceito = "A"
elif nota >= 7:
    conceito = "B"
elif nota >= 5:
    conceito = "C"
else:
    conceito = "D"
print("Conceito:", conceito)
```

Repare que, ao chegar no `elif nota >= 7`, já sabemos que a nota é **menor que 9** (senão o primeiro bloco teria sido executado). Por isso não precisamos escrever `7 <= nota < 9`.

> ⚠️ A **ordem** das condições importa! Se testarmos a condição mais ampla primeiro, as outras nunca serão alcançadas:

```python
nota = 9.5
if nota >= 5:
    print("C")        # sempre cai aqui para notas >= 5!
elif nota >= 7:
    print("B")        # nunca executado
elif nota >= 9:
    print("A")        # nunca executado
```

### elif × vários if

Compare: com `elif` só um bloco roda; com vários `if`, todos os verdadeiros rodam.

```python
x = 15
if x > 10:
    print("if: maior que 10")
if x > 5:
    print("if: maior que 5")

if x > 10:
    print("elif: maior que 10")
elif x > 5:
    print("elif: maior que 5")
```

### Exemplo: IMC

O Índice de Massa Corporal é o peso (kg) dividido pela altura (m) ao quadrado. As faixas abaixo são as da Organização Mundial da Saúde:

```python
def classificar_imc(peso, altura):
    imc = peso / altura ** 2
    if imc < 18.5:
        faixa = "abaixo do peso"
    elif imc < 25:
        faixa = "peso normal"
    elif imc < 30:
        faixa = "sobrepeso"
    else:
        faixa = "obesidade"
    return f"IMC {imc:.1f}: {faixa}"

print(classificar_imc(50, 1.75))
print(classificar_imc(70, 1.75))
print(classificar_imc(85, 1.75))
print(classificar_imc(100, 1.75))
```

### Exercício
Escreva a função `classificar_idade(idade)` que retorna:

- `"criança"` para 0 a 11 anos;
- `"adolescente"` para 12 a 17;
- `"adulto"` para 18 a 59;
- `"idoso"` para 60 ou mais;
- `"inválida"` para idades negativas.

```python inicial
def classificar_idade(idade):
    pass
```

```python solucao
def classificar_idade(idade):
    if idade < 0:
        return "inválida"
    elif idade < 12:
        return "criança"
    elif idade < 18:
        return "adolescente"
    elif idade < 60:
        return "adulto"
    else:
        return "idoso"
```

```python teste
casos = {-1: "inválida", 0: "criança", 11: "criança", 12: "adolescente", 17: "adolescente", 18: "adulto", 59: "adulto", 60: "idoso", 95: "idoso"}
for i, esp in casos.items():
    r = classificar_idade(i)
    assert r == esp, f"classificar_idade({i}) deveria retornar {esp!r}, mas retornou {r!r}"
```

## Condicionais aninhadas e expressão condicional
fonte: Pense em Python cap. 5.7 e 19.1

### Condicionais aninhadas

Um `if` pode ficar **dentro** de outro. Cada nível acrescenta uma indentação:

```python
x, y = 3, 7
if x == y:
    print("x e y são iguais")
else:
    if x < y:
        print("x é menor que y")
    else:
        print("x é maior que y")
```

Aninhamento é às vezes necessário, mas níveis demais deixam o código difícil de ler. Muitas vezes dá para **achatar** a estrutura com `elif` ou com operadores lógicos. Estes três trechos são equivalentes:

```python
x = 5

# aninhado
if 0 < x:
    if x < 10:
        print("x é um dígito positivo (aninhado)")

# com and
if 0 < x and x < 10:
    print("x é um dígito positivo (and)")

# com comparação encadeada
if 0 < x < 10:
    print("x é um dígito positivo (encadeado)")
```

O exemplo do início também fica mais simples com `elif`:

```python
x, y = 3, 7
if x == y:
    print("x e y são iguais")
elif x < y:
    print("x é menor que y")
else:
    print("x é maior que y")
```

> 💡 Uma técnica para evitar aninhamento em funções é a **cláusula de guarda**: trate os casos especiais primeiro, com `return` cedo, e deixe o caso principal sem indentação extra.

```python
def dividir(a, b):
    if b == 0:
        return "não dá para dividir por zero"
    return a / b

print(dividir(10, 4))
print(dividir(1, 0))
```

### Expressão condicional (o "ternário")

Quando um `if/else` serve só para **escolher um valor**, Python oferece uma forma compacta, numa linha só:

```text
valor_se_verdadeiro if condição else valor_se_falso
```

```python
idade = 20
status = "maior" if idade >= 18 else "menor"
print(status)

n = 7
print(f"{n} é {'par' if n % 2 == 0 else 'ímpar'}")
```

Compare com a versão completa, que faz a mesma coisa em quatro linhas:

```python
idade = 20
if idade >= 18:
    status = "maior"
else:
    status = "menor"
print(status)
```

> ⚠️ Use a expressão condicional só para casos **simples**. Encadear várias numa linha (`a if x else b if y else c`) funciona, mas fica difícil de ler; nesses casos prefira `if/elif/else`.

### Exercício
Escreva a função `maior_de_dois(a, b)` que retorna o maior dos dois números usando uma **expressão condicional** (sem usar `max`).

```python inicial
def maior_de_dois(a, b):
    pass
```

```python solucao
def maior_de_dois(a, b):
    return a if a >= b else b
```

```python teste
for args, esp in [((3, 7), 7), ((10, 2), 10), ((5, 5), 5), ((-1, -8), -1), ((2.5, 2.4), 2.5)]:
    r = maior_de_dois(*args)
    assert r == esp, f"maior_de_dois{args} deveria retornar {esp}, mas retornou {r}"
```

## Valores truthy e falsy
fonte: Documentação oficial do Python (Truth Value Testing); Pense em Python cap. 5

A condição de um `if` não precisa ser um `bool`. **Qualquer valor** pode ser testado: o Python decide se ele conta como verdadeiro (*truthy*) ou falso (*falsy*), exatamente como faz a função `bool()`.

São **falsy** (contam como falso):

| Valor | Descrição |
|---|---|
| `False` | o próprio falso |
| `None` | ausência de valor |
| `0`, `0.0` | zero de qualquer tipo numérico |
| `""` | string vazia |
| `[]`, `()`, `{}`, `set()` | coleções vazias |

**Todo o resto** é truthy: números diferentes de zero, strings com pelo menos um caractere (até `" "` e `"0"`), listas com itens etc.

```python
valores = [0, 1, -3, 0.0, "", " ", "0", None, [], [0], True, False]
for v in valores:
    print(repr(v), "->", bool(v))
```

### Usando no if

Isso permite escrever testes curtos e expressivos:

```python
nome = ""
if nome:
    print("Olá,", nome)
else:
    print("Nome não informado")

itens = ["café", "pão"]
if itens:
    print("Você tem", len(itens), "itens no carrinho")
```

É o mesmo que escrever `if nome != "":` ou `if len(itens) > 0:`, só que mais idiomático (é o estilo recomendado pela PEP 8).

### and e or retornam operandos

Agora dá para entender a curiosidade da lição de operadores lógicos: `or` retorna o **primeiro operando truthy** (ou o último, se nenhum for), e `and` retorna o **primeiro falsy** (ou o último, se todos forem truthy):

```python
print("" or "visitante")      # visitante
print("Ana" or "visitante")   # Ana
print(0 or None or [])        # []
print(5 and "ok")             # ok
print(0 and "ok")             # 0
```

O padrão `valor or padrao` é muito usado para definir um valor padrão:

```python
apelido = ""
exibir = apelido or "Sem apelido"
print(exibir)
```

> ⚠️ Cuidado quando `0` é um valor válido! Se `quantidade = 0` for uma resposta legítima, `quantidade or 10` vai trocá-la por 10. Nesses casos, teste explicitamente: `quantidade if quantidade is not None else 10`.

> 💡 Para testar `None`, use sempre `is None` / `is not None`, e não a veracidade: `if x:` é falso tanto para `None` quanto para `0` e `""`.

### Exercício
Escreva a função `saudacao(nome)` que retorna `"Olá, <nome>!"`. Se `nome` for vazio, só espaços ou `None`, retorne `"Olá, visitante!"`. Dica: `None` e `""` são falsy; para o caso de só espaços, use `strip()`.

```python inicial
def saudacao(nome):
    return f"Olá, {nome}!"
```

```python solucao
def saudacao(nome):
    if nome and nome.strip():
        return f"Olá, {nome.strip()}!"
    return "Olá, visitante!"
```

```python teste
for n, esp in [("Ana", "Olá, Ana!"), ("", "Olá, visitante!"), (None, "Olá, visitante!"), ("   ", "Olá, visitante!"), ("Rui", "Olá, Rui!")]:
    r = saudacao(n)
    assert r == esp, f"saudacao({n!r}) deveria retornar {esp!r}, mas retornou {r!r}"
```

## match/case: casamento de padrões
fonte: Documentação oficial do Python (PEP 634, PEP 636)

A partir do Python 3.10 existe a instrução `match`, que compara um valor com vários **padrões** e executa o bloco do primeiro que combinar. Para escolher entre muitos valores fixos, ela fica mais limpa que uma longa cadeia de `elif`:

```python
dia = 3
match dia:
    case 1:
        nome = "domingo"
    case 2:
        nome = "segunda"
    case 3:
        nome = "terça"
    case 4:
        nome = "quarta"
    case _:
        nome = "outro dia"
print(nome)
```

O padrão `_` (sublinhado) é o **curinga**: combina com qualquer coisa. Ele funciona como o `else` e deve vir por último. Se nenhum padrão combinar e não houver `_`, nada é executado (não dá erro).

### Vários valores num só case: |

A barra vertical significa **"ou"** dentro de um padrão:

```python
def tipo_de_dia(dia):
    match dia.lower():
        case "sábado" | "domingo":
            return "fim de semana"
        case "segunda" | "terça" | "quarta" | "quinta" | "sexta":
            return "dia útil"
        case _:
            return "dia inválido"

print(tipo_de_dia("Domingo"))
print(tipo_de_dia("quarta"))
print(tipo_de_dia("feriado"))
```

### Capturando valores

Um **nome** dentro do padrão não compara: ele **captura** o valor naquela posição. Isso fica poderoso com sequências (como tuplas e listas), porque o `match` confere também o **formato**:

```python
def descrever(ponto):
    match ponto:
        case (0, 0):
            return "origem"
        case (0, y):
            return f"no eixo Y, em y={y}"
        case (x, 0):
            return f"no eixo X, em x={x}"
        case (x, y):
            return f"ponto ({x}, {y})"
        case _:
            return "não é um ponto 2D"

print(descrever((0, 0)))
print(descrever((0, 5)))
print(descrever((3, 0)))
print(descrever((2, 8)))
print(descrever((1, 2, 3)))
```

Um uso típico é interpretar **comandos** digitados, separando as palavras com `split()`:

```python
def executar(comando):
    match comando.split():
        case ["sair"]:
            return "Até logo!"
        case ["ir", direcao]:
            return f"Indo para {direcao}"
        case ["pegar", *itens]:
            return f"Pegou: {', '.join(itens)}"
        case _:
            return "Comando desconhecido"

print(executar("ir norte"))
print(executar("pegar espada escudo"))
print(executar("sair"))
print(executar("dançar"))
```

O `*itens` captura **todos os itens restantes** numa lista.

### Guardas: case ... if

Depois do padrão você pode colocar uma condição extra com `if`, chamada **guarda**. O case só é escolhido se o padrão combinar **e** a guarda for verdadeira:

```python
def classificar(n):
    match n:
        case 0:
            return "zero"
        case x if x < 0:
            return "negativo"
        case x if x % 2 == 0:
            return "positivo par"
        case _:
            return "positivo ímpar"

for n in [0, -4, 6, 9]:
    print(n, classificar(n))
```

> ⚠️ Um nome solto num `case` **sempre** combina e captura o valor. Por isso `case x:` no meio da lista "rouba" todos os casos seguintes. Para comparar com o valor de uma variável, use uma guarda (`case v if v == limite:`) ou um nome com ponto (como `case Cor.VERMELHO:`).

```python erro
comando = "parar"
match comando:
    case outro:
        print("isto captura tudo")
    case "parar":
        print("nunca chega aqui")
```

> 💡 O Python até recusa esse código: um padrão que captura tudo antes de outros casos gera `SyntaxError` (*makes remaining patterns unreachable*).

### Exercício
Escreva a função `calcular(a, operador, b)` usando `match/case` que retorna o resultado da operação para os operadores `"+"`, `"-"`, `"*"` e `"/"`. Aceite também `"x"` como multiplicação (use `|`). Para divisão por zero retorne a string `"erro: divisão por zero"` (use uma guarda) e para operadores desconhecidos retorne `"erro: operador inválido"`.

```python inicial
def calcular(a, operador, b):
    pass
```

```python solucao
def calcular(a, operador, b):
    match operador:
        case "+":
            return a + b
        case "-":
            return a - b
        case "*" | "x":
            return a * b
        case "/" if b == 0:
            return "erro: divisão por zero"
        case "/":
            return a / b
        case _:
            return "erro: operador inválido"
```

```python teste
casos = [((2, "+", 3), 5), ((10, "-", 4), 6), ((3, "*", 4), 12), ((3, "x", 5), 15), ((9, "/", 2), 4.5),
         ((1, "/", 0), "erro: divisão por zero"), ((2, "^", 3), "erro: operador inválido")]
for args, esp in casos:
    r = calcular(*args)
    assert r == esp, f"calcular{args} deveria retornar {esp!r}, mas retornou {r!r}"
```

## Exemplos práticos
fonte: Python do Zero p. 35–37; Pense em Python cap. 5 e 6

Vamos juntar tudo em problemas clássicos. Para cada um, tente pensar na solução **antes** de ler o código.

### Ano bissexto

Pelo calendário gregoriano, um ano é bissexto se for **divisível por 4**, **exceto** os divisíveis por 100, que só são bissextos se também forem **divisíveis por 400**. Assim, 2024 é bissexto, 1900 não é, e 2000 é.

Versão com `if/elif/else`, seguindo a regra passo a passo:

```python
def bissexto(ano):
    if ano % 400 == 0:
        return True
    elif ano % 100 == 0:
        return False
    elif ano % 4 == 0:
        return True
    else:
        return False

for ano in [2024, 2023, 1900, 2000]:
    print(ano, bissexto(ano))
```

A mesma regra numa única expressão lógica:

```python
def bissexto(ano):
    return ano % 4 == 0 and (ano % 100 != 0 or ano % 400 == 0)

for ano in [2024, 2023, 1900, 2000]:
    print(ano, bissexto(ano))
```

> 💡 O módulo `calendar` da biblioteca padrão já tem essa função: `calendar.isleap(ano)`. Bom para conferir sua resposta!

### Maior de três números

Uma solução comum guarda o "candidato a maior" e vai comparando:

```python
def maior_de_tres(a, b, c):
    maior = a
    if b > maior:
        maior = b
    if c > maior:
        maior = c
    return maior

print(maior_de_tres(3, 9, 5))
print(maior_de_tres(10, 2, 7))
print(maior_de_tres(1, 4, 8))
print(max(3, 9, 5))   # na prática, use a função pronta max()
```

### Calculadora com validação

```python
def calculadora(a, op, b):
    if op == "+":
        return a + b
    elif op == "-":
        return a - b
    elif op == "*":
        return a * b
    elif op == "/":
        if b == 0:
            return "Erro: divisão por zero"
        return a / b
    else:
        return "Erro: operação desconhecida"

print(calculadora(8, "+", 2))
print(calculadora(8, "/", 0))
print(calculadora(8, "%", 3))
```

Num programa interativo, os valores viriam do `input()`:

```python
a = float(input("Primeiro número: "))
b = float(input("Segundo número: "))
if a > b:
    print(a, "é o maior")
elif b > a:
    print(b, "é o maior")
else:
    print("Os números são iguais")
```

### Triângulos

Três lados formam um triângulo se cada lado for **menor que a soma dos outros dois**. E o triângulo pode ser equilátero (3 lados iguais), isósceles (2 iguais) ou escaleno (todos diferentes):

```python
def tipo_triangulo(a, b, c):
    if a >= b + c or b >= a + c or c >= a + b:
        return "não é triângulo"
    if a == b == c:
        return "equilátero"
    if a == b or b == c or a == c:
        return "isósceles"
    return "escaleno"

for lados in [(3, 3, 3), (3, 3, 5), (3, 4, 5), (1, 2, 10)]:
    print(lados, tipo_triangulo(*lados))
```

### Exercício
Escreva a função `bissexto(ano)` que retorna `True` se o ano for bissexto e `False` caso contrário, seguindo a regra do calendário gregoriano explicada acima (**sem** usar o módulo `calendar`).

```python inicial
def bissexto(ano):
    return ano % 4 == 0
```

```python solucao
def bissexto(ano):
    return ano % 4 == 0 and (ano % 100 != 0 or ano % 400 == 0)
```

```python teste
casos = {2024: True, 2023: False, 1900: False, 2000: True, 2100: False, 2400: True, 1996: True, 2001: False}
for ano, esp in casos.items():
    r = bissexto(ano)
    assert r == esp, f"bissexto({ano}) deveria retornar {esp}, mas retornou {r}"
```

## Quiz
? Qual é o resultado de `5 == 5.0`?
- [x] True
- [ ] False
- [ ] TypeError
- [ ] 5
> `int` e `float` com o mesmo valor numérico são iguais.

? O que `1 < x < 10` significa em Python?
- [ ] (1 < x) < 10, comparando True/False com 10
- [x] 1 < x and x < 10
- [ ] É um erro de sintaxe
- [ ] x está entre 1 e 10, incluindo os extremos
> Comparações encadeadas equivalem a várias comparações ligadas por `and`. Os extremos não estão incluídos porque usamos `<`.

? Qual é o valor de `True and not False or False`?
- [x] True
- [ ] False
- [ ] None
- [ ] Erro
> `not` primeiro (`not False` = True), depois `and` (True and True = True) e por fim `or` (True or False = True).

? Em `x != 0 and 10 / x > 1`, o que acontece quando `x` vale 0?
- [ ] ZeroDivisionError
- [x] O resultado é False e a divisão nem é calculada
- [ ] O resultado é True
- [ ] O resultado é None
> Curto-circuito: como `x != 0` é falso, o `and` já sabe que o resultado é falso e não avalia o lado direito.

? Com `nota = 8`, o que este código imprime? `if nota >= 5: print("C")` / `elif nota >= 7: print("B")`
- [x] C
- [ ] B
- [ ] C e B
- [ ] Nada
> Só o primeiro bloco verdadeiro é executado. Como `8 >= 5`, imprime C e ignora o resto. Por isso a ordem das condições importa.

? Qual destes valores é falsy?
- [ ] "0"
- [ ] " "
- [ ] [0]
- [x] 0.0
> Zero de qualquer tipo é falsy. Strings não vazias (mesmo "0" ou " ") e listas com itens são truthy.

? O que `"" or "padrão"` retorna?
- [ ] ""
- [x] "padrão"
- [ ] True
- [ ] False
> `or` retorna o primeiro operando truthy. Como "" é falsy, retorna "padrão".

? Qual é a forma correta da expressão condicional em Python?
- [ ] condição ? a : b
- [ ] if condição then a else b
- [x] a if condição else b
- [ ] a else b if condição
> Em Python o valor verdadeiro vem primeiro: `"par" if n % 2 == 0 else "ímpar"`.

? Num `match`, o que o padrão `case _:` faz?
- [ ] Combina apenas com o valor "_"
- [ ] Gera um erro
- [x] Combina com qualquer valor, funcionando como um "senão"
- [ ] Combina apenas com None
> `_` é o curinga: sempre combina e não captura o valor. Deve ser o último case.

? Qual destes anos é bissexto?
- [ ] 1900
- [ ] 2100
- [x] 2000
- [ ] 2023
> 2000 é divisível por 400. 1900 e 2100 são divisíveis por 100 mas não por 400, e 2023 não é divisível por 4.
