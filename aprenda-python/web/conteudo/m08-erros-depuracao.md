# Erros, exceções e depuração
id: m08
nivel: Intermediário
icone: 🐞
descricao: Entenda as mensagens de erro, trate exceções com try/except, crie suas próprias exceções e aprenda técnicas profissionais de depuração.

## Tipos de erros e a hierarquia de exceções
fonte: Pense em Python cap. 1.7 e Apêndice A; Documentação oficial do Python (Exceções embutidas)

Você já sabe que existem três grandes famílias de erros: **de sintaxe** (o código nem começa a rodar), **de execução** (algo dá errado no meio do caminho) e **semânticos** (o programa roda, mas faz a coisa errada). Neste módulo vamos dominar os dois últimos.

Quando algo dá errado durante a execução, o Python **lança uma exceção** (*raise an exception*): ele interrompe o fluxo normal e cria um objeto que descreve o problema. Se ninguém tratar essa exceção, o programa termina e mostra uma mensagem de erro.

### As exceções que você mais vai encontrar

| Exceção | Quando acontece | Exemplo típico |
|---|---|---|
| `SyntaxError` | O código não segue as regras da linguagem | faltou `:` ou um parêntese |
| `IndentationError` | Recuo inconsistente (é um tipo de `SyntaxError`) | linha com espaços a mais |
| `NameError` | Nome (variável/função) que não existe | erro de digitação: `pirnt` |
| `TypeError` | Operação com o tipo errado | `"idade: " + 30` |
| `ValueError` | Tipo certo, valor inadequado | `int("doze")` |
| `IndexError` | Índice fora da sequência | `[1, 2, 3][10]` |
| `KeyError` | Chave inexistente no dicionário | `{"a": 1}["b"]` |
| `ZeroDivisionError` | Divisão (ou resto) por zero | `10 / 0` |
| `AttributeError` | O objeto não tem aquele atributo/método | `[1, 2].push(3)` |
| `FileNotFoundError` | Arquivo que não existe | `open("nao_existe.txt")` |
| `ModuleNotFoundError` | Módulo que não pode ser importado | `import pandass` |
| `RecursionError` | Recursão profunda demais | função sem caso base |

Veja alguns deles em ação. Cada bloco abaixo **termina com erro de propósito**; leia a última linha da mensagem:

```python erro
idade = 30
print("Idade: " + idade)   # TypeError: não dá para somar str com int
```

```python erro
numero = int("doze")       # ValueError: o texto não representa um inteiro
```

```python erro
notas = [7, 8, 9]
print(notas[3])            # IndexError: os índices válidos são 0, 1 e 2
```

```python erro
precos = {"café": 5.0, "pão": 1.5}
print(precos["leite"])     # KeyError: 'leite'
```

```python erro
lista = [1, 2]
lista.push(3)              # AttributeError: listas usam append, não push
```

> 💡 Repare na diferença entre `TypeError` e `ValueError`: em `int([1, 2])` o **tipo** do argumento já é inadequado (TypeError); em `int("doze")` o tipo (str) é aceitável, mas aquele **valor** não serve (ValueError).

### A hierarquia de exceções

As exceções do Python são organizadas numa **árvore**: exceções mais específicas "são tipos de" exceções mais gerais. Um trecho da árvore:

```text
BaseException
 ├── KeyboardInterrupt        (usuário apertou Ctrl+C)
 ├── SystemExit               (sys.exit())
 └── Exception                (quase tudo que você trata fica aqui embaixo)
      ├── ArithmeticError
      │    ├── ZeroDivisionError
      │    └── OverflowError
      ├── LookupError
      │    ├── IndexError
      │    └── KeyError
      ├── OSError
      │    ├── FileNotFoundError
      │    └── PermissionError
      ├── ValueError
      ├── TypeError
      ├── NameError
      ├── AttributeError
      └── ImportError
           └── ModuleNotFoundError
```

Essa árvore importa porque, como você verá, tratar `LookupError` também trata `IndexError` e `KeyError`. Você pode conferir os "ancestrais" de uma exceção com `issubclass` ou com o atributo `__mro__`:

```python
print(issubclass(ZeroDivisionError, ArithmeticError))  # True
print(issubclass(KeyError, LookupError))                # True
print(issubclass(ValueError, TypeError))                # False: são irmãs
print([c.__name__ for c in FileNotFoundError.__mro__])
```

### Exercício
O programa abaixo tem **três** erros de execução diferentes (um `NameError`, um `TypeError` e um `IndexError`). Corrija-os para que ele imprima exatamente:

```text
Total de itens: 3
Último item: banana
```

```python inicial
itens = ["maçã", "uva", "banana"]
quantidade = len(itens)
print("Total de itens: " + quantidade)
print("Último item: " + itens[quantidade])
pirnt("fim")
```

```python solucao
itens = ["maçã", "uva", "banana"]
quantidade = len(itens)
print("Total de itens: " + str(quantidade))
print("Último item: " + itens[quantidade - 1])
```

```python teste
linhas = [l.strip() for l in saida.strip().split("\n")]
assert linhas[0] == "Total de itens: 3", f"A 1ª linha deveria ser 'Total de itens: 3', veio {linhas[0]!r}"
assert len(linhas) >= 2 and linhas[1] == "Último item: banana", "A 2ª linha deveria ser 'Último item: banana'"
assert len(linhas) == 2, "O programa deveria imprimir só as duas linhas pedidas (remova o pirnt)"
```

## Lendo um traceback
fonte: Pense em Python cap. 6.9 e Apêndice A.2.3; Documentação oficial do Python

Quando uma exceção não é tratada, o Python mostra um **traceback** (rastro de chamadas). Ele conta a história de **como** o programa chegou ao erro: quais funções estavam sendo executadas, em que linhas. Veja um traceback como o Python do computador mostraria:

```text
Traceback (most recent call last):
  File "notas.py", line 9, in <module>
    print(relatorio(turma))
          ~~~~~~~~~^^^^^^^
  File "notas.py", line 6, in relatorio
    return f"Média: {media(alunos[0])}"
                     ~~~~~^^^^^^^^^^^
  File "notas.py", line 2, in media
    return sum(notas) / len(notas)
           ~~~~~~~~~~~^~~~~~~~~~~~
ZeroDivisionError: division by zero
```

Como ler, passo a passo:

1. **Comece pela última linha**: ela diz o **tipo** da exceção (`ZeroDivisionError`) e a **mensagem** (`division by zero`).
2. **Suba de baixo para cima**: a entrada logo acima da última linha é onde o erro **aconteceu** (linha 2, dentro de `media`).
3. **Continue subindo** para ver **quem chamou** quem: `media` foi chamada por `relatorio` (linha 6), que foi chamada pelo programa principal (`<module>`, linha 9).
4. Os sinais `~~~^^^` (Python 3.11+) apontam a parte exata da expressão que falhou.

> 💡 "Most recent call last" significa "chamada mais recente por último": a chamada mais funda (onde o erro estourou) aparece embaixo.

Execute o código abaixo e compare com o traceback acima. Neste app, o traceback é resumido e traduzido, mostrando só as linhas e funções do **seu** código:

```python erro
def media(notas):
    return sum(notas) / len(notas)

def relatorio(alunos):
    return f"Média: {media(alunos[0])}"

turma = [[], [7, 8]]
print(relatorio(turma))
```

### O erro nem sempre está na linha apontada

O traceback mostra onde o problema **se manifestou**, não necessariamente onde ele **nasceu**. No exemplo, a divisão por zero acontece em `media`, mas a causa real é a **lista vazia** que veio de `turma`. Pergunte sempre: *de onde veio esse valor?*

Com erros de sintaxe é parecido: um parêntese não fechado numa linha costuma ser acusado na linha **seguinte**.

```python erro
total = (10 + 20
print(total)
```

### Mensagens úteis do Python moderno

As versões recentes do Python dão sugestões nas mensagens. No terminal do computador você veria, por exemplo:

```text
>>> lista_de_compras = []
>>> lista_de_compra.append("pão")
NameError: name 'lista_de_compra' is not defined. Did you mean: 'lista_de_compras'?
```

Também é possível capturar e mostrar o traceback dentro do próprio programa com o módulo `traceback` (útil em registros de log):

```python
import traceback

try:
    {"a": 1}["b"]
except KeyError:
    texto = traceback.format_exc()
    print("Registrado no log:")
    print(texto.strip().splitlines()[-1])
```

### Exercício
A função `preco_medio` deveria devolver a média dos preços de uma lista de produtos (dicionários). Execute, leia o traceback e corrija **a causa** do erro. Com os dados do exemplo, `preco_medio(produtos)` deve dar `4.0`.

```python inicial
def preco_medio(produtos):
    total = 0
    for p in produtos:
        total += p["preço"]
    return total / len(produtos)

produtos = [
    {"nome": "café", "preco": 6.0},
    {"nome": "pão", "preco": 2.0},
]
print(preco_medio(produtos))
```

```python solucao
def preco_medio(produtos):
    total = 0
    for p in produtos:
        total += p["preco"]
    return total / len(produtos)

produtos = [
    {"nome": "café", "preco": 6.0},
    {"nome": "pão", "preco": 2.0},
]
print(preco_medio(produtos))
```

```python teste
assert preco_medio(produtos) == 4.0, "Com os produtos do exemplo a média deveria ser 4.0"
assert preco_medio([{"nome": "x", "preco": 10}]) == 10, "Com um único produto de preço 10 a média deveria ser 10"
```

## Tratando exceções com try/except
fonte: Pense em Python cap. 14.5; Documentação oficial do Python (Tutorial, cap. 8)

Para **tratar** uma exceção (em vez de deixar o programa morrer), use `try`/`except`. O Python executa o bloco `try`; se uma exceção do tipo indicado acontecer, ele pula para o bloco `except`.

```python
texto = "doze"
try:
    numero = int(texto)
    print("Convertido:", numero)   # não é executado se int() falhar
except ValueError:
    print(f"'{texto}' não é um número inteiro válido")
print("O programa continua normalmente")
```

### Capture exceções específicas

Sempre diga **qual** exceção você espera. Um `except:` sozinho (ou `except Exception:`) captura **tudo**, inclusive erros de digitação no seu próprio código, e esconde bugs:

```python
def dobro(x):
    return x * 2

try:
    resultado = dobor(5)      # erro de digitação!
except Exception:
    resultado = 0             # o bug foi "engolido" em silêncio
print(resultado)              # 0 ... e você nem sabe por quê
```

> ⚠️ Evite `except:` sem tipo e `except Exception:` genérico. Capture apenas o que você sabe tratar. Os outros erros devem aparecer, para que você os corrija.

### Várias exceções

Você pode ter vários blocos `except` (o primeiro que combinar é usado) ou agrupar exceções numa tupla:

```python
def converter(valor):
    try:
        return 100 / int(valor)
    except ValueError:
        return "não é número"
    except ZeroDivisionError:
        return "não divido por zero"
    except (TypeError, OverflowError):
        return "tipo inadequado"

for v in ["4", "abc", "0", None]:
    print(repr(v), "->", converter(v))
```

> 💡 A ordem dos `except` importa: coloque as exceções **mais específicas primeiro**. Se `except LookupError` vier antes de `except KeyError`, o segundo nunca será alcançado.

### Acessando o objeto da exceção com `as`

Com `except Tipo as e`, a variável `e` guarda o objeto da exceção. Você pode mostrar a mensagem, o tipo ou guardar para depois:

```python
dados = {"nome": "Ana"}
try:
    print(dados["idade"])
except KeyError as e:
    print("Tipo:", type(e).__name__)
    print("Chave que faltou:", e)
    print("Argumentos:", e.args)
```

### Tratando o erro numa repetição

Um padrão muito comum: processar vários itens, tratando os problemáticos sem parar tudo.

```python
entradas = ["10", "7.5", "oito", "", "3"]
validos, invalidos = [], []
for item in entradas:
    try:
        validos.append(float(item))
    except ValueError:
        invalidos.append(item)
print("Válidos:", validos)
print("Inválidos:", invalidos)
```

> 💡 Mantenha o bloco `try` **pequeno**: coloque nele só a linha que pode falhar. Assim você não captura, sem querer, um erro de outra linha.

### Exercício
Escreva a função `para_inteiro(texto, padrao=0)` que tenta converter `texto` em `int`. Se a conversão falhar com `ValueError` ou `TypeError`, ela devolve `padrao`.

Exemplos: `para_inteiro("42")` → `42`; `para_inteiro("abc")` → `0`; `para_inteiro(None, -1)` → `-1`.

```python inicial
def para_inteiro(texto, padrao=0):
    return int(texto)
```

```python solucao
def para_inteiro(texto, padrao=0):
    try:
        return int(texto)
    except (ValueError, TypeError):
        return padrao
```

```python teste
assert para_inteiro("42") == 42, "para_inteiro('42') deveria devolver 42"
assert para_inteiro(" -7 ") == -7, "para_inteiro(' -7 ') deveria devolver -7 (int aceita espaços)"
assert para_inteiro("abc") == 0, "para_inteiro('abc') deveria devolver o padrão 0"
assert para_inteiro("3.5", 99) == 99, "para_inteiro('3.5', 99) deveria devolver 99"
assert para_inteiro(None, -1) == -1, "para_inteiro(None, -1) deveria devolver -1 (int(None) gera TypeError)"
assert para_inteiro([], 5) == 5, "para_inteiro([], 5) deveria devolver 5"
```

## else e finally
fonte: Documentação oficial do Python (Tutorial, cap. 8.3–8.7)

A instrução `try` completa tem quatro partes:

| Bloco | Quando é executado |
|---|---|
| `try` | Sempre: é o código "arriscado" |
| `except` | Só se ocorrer uma exceção daquele tipo no `try` |
| `else` | Só se **nenhuma** exceção ocorreu no `try` |
| `finally` | **Sempre**, com ou sem exceção (até se houver `return`) |

```python
def dividir(a, b):
    try:
        resultado = a / b
    except ZeroDivisionError:
        print("  erro: divisão por zero")
    else:
        print("  deu certo:", resultado)
    finally:
        print("  (fim da tentativa)")

print("dividir(10, 2):")
dividir(10, 2)
print("dividir(1, 0):")
dividir(1, 0)
```

### Para que serve o else?

O `else` deixa o `try` pequeno: só o que pode falhar fica dentro dele; o que deve rodar **apenas em caso de sucesso** vai para o `else`. Assim, um erro no código do `else` não é confundido com o erro que você está tratando.

```python
estoque = {"caneta": 10, "lápis": 0}

def vender(item):
    try:
        qtd = estoque[item]
    except KeyError:
        return f"{item}: não vendemos esse produto"
    else:
        if qtd == 0:
            return f"{item}: esgotado"
        estoque[item] = qtd - 1
        return f"{item}: vendido! restam {estoque[item]}"

for produto in ["caneta", "lápis", "borracha"]:
    print(vender(produto))
```

### finally: limpeza garantida

O `finally` é ideal para "arrumar a casa": fechar arquivos, liberar recursos, registrar que algo terminou. Ele roda **mesmo** quando a exceção não é tratada ou quando há `return`:

```python
def tarefa():
    try:
        print("abrindo recurso")
        return "resultado"
    finally:
        print("fechando recurso (sempre!)")

print(tarefa())
```

```python
registro = []
try:
    try:
        registro.append("início")
        x = 1 / 0
    finally:
        registro.append("limpeza")   # roda antes de a exceção "subir"
except ZeroDivisionError:
    registro.append("tratado lá fora")
print(registro)
```

> 💡 Para arquivos, o `with open(...)` (próximo módulo) já faz o papel do `finally`: fecha o arquivo automaticamente, mesmo se der erro.

> ⚠️ Não coloque `return` dentro do `finally`: ele "apaga" a exceção e o valor de retorno do `try`. Desde o Python 3.14 isso gera até um aviso (`SyntaxWarning`).

### Exercício
Escreva `ler_numero(texto, log)`, que tenta converter `texto` em `float` e registra as etapas na lista `log`:

- sempre adiciona `"início"` no começo;
- se converter, adiciona `"ok"` (use `else`) e devolve o número;
- se der `ValueError`, adiciona `"erro"` e devolve `None`;
- em **qualquer** caso, adiciona `"fim"` por último (use `finally`).

Ex.: com `log = []`, `ler_numero("2.5", log)` devolve `2.5` e `log` fica `["início", "ok", "fim"]`.

```python inicial
def ler_numero(texto, log):
    log.append("início")
    return float(texto)
```

```python solucao
def ler_numero(texto, log):
    log.append("início")
    try:
        numero = float(texto)
    except ValueError:
        log.append("erro")
        return None
    else:
        log.append("ok")
        return numero
    finally:
        log.append("fim")
```

```python teste
log = []
r = ler_numero("2.5", log)
assert r == 2.5, f"ler_numero('2.5', log) deveria devolver 2.5, devolveu {r!r}"
assert log == ["início", "ok", "fim"], f"Com '2.5' o log deveria ser ['início', 'ok', 'fim'], foi {log}"
log = []
r = ler_numero("x", log)
assert r is None, "ler_numero('x', log) deveria devolver None"
assert log == ["início", "erro", "fim"], f"Com 'x' o log deveria ser ['início', 'erro', 'fim'], foi {log}"
```

## raise e validação de dados
fonte: Pense em Python cap. 11.4 (raise); Documentação oficial do Python (Tutorial, cap. 8.4)

Até aqui você **tratou** exceções lançadas pelo Python. Com `raise` você **lança** suas próprias exceções, para avisar quem chamou a sua função que algo está errado:

```python
def raiz_quadrada(x):
    if x < 0:
        raise ValueError(f"não existe raiz real de número negativo: {x}")
    return x ** 0.5

print(raiz_quadrada(16))
try:
    raiz_quadrada(-4)
except ValueError as e:
    print("Erro:", e)
```

### Por que lançar em vez de imprimir ou devolver None?

Compare as alternativas para uma função que recebe um valor inválido:

| Abordagem | Problema |
|---|---|
| `print("valor inválido")` | Quem chamou não fica sabendo; o programa segue com dados ruins |
| `return None` | Fácil de esquecer de checar; o erro estoura bem longe dali |
| `raise ValueError(...)` | Impossível ignorar sem querer; quem chama decide como tratar |

### Escolha a exceção certa

- `TypeError` quando o **tipo** do argumento está errado;
- `ValueError` quando o tipo está certo, mas o **valor** não faz sentido;
- `KeyError`/`IndexError` para buscas que não encontram nada (em estruturas próprias);
- `NotImplementedError` para algo que ainda não foi implementado.

```python
def criar_usuario(nome, idade):
    if not isinstance(nome, str):
        raise TypeError("nome deve ser texto")
    nome = nome.strip()
    if not nome:
        raise ValueError("nome não pode ser vazio")
    if not isinstance(idade, int):
        raise TypeError("idade deve ser um número inteiro")
    if not 0 <= idade <= 150:
        raise ValueError(f"idade fora do intervalo permitido: {idade}")
    return {"nome": nome, "idade": idade}

print(criar_usuario("  Bia ", 20))
for args in [("", 30), ("Caio", -2), ("Duda", "vinte")]:
    try:
        criar_usuario(*args)
    except (TypeError, ValueError) as e:
        print(f"{args} -> {type(e).__name__}: {e}")
```

> 💡 Escreva mensagens de erro que ajudem: diga **o que** estava errado e, se possível, **qual valor** foi recebido.

### Relançando exceções

Dentro de um `except`, um `raise` sozinho **relança** a mesma exceção (útil para registrar algo e deixar o erro seguir). Já `raise NovaExcecao(...) from e` troca a exceção por outra mais significativa, guardando a original como causa:

```python
def carregar_config(texto):
    try:
        chave, valor = texto.split("=")
    except ValueError as e:
        raise ValueError(f"linha de configuração inválida: {texto!r}") from e
    return chave.strip(), valor.strip()

print(carregar_config("tema = escuro"))
try:
    carregar_config("tema escuro")
except ValueError as e:
    print("Erro:", e)
    print("Causa original:", repr(e.__cause__))
```

### Exercício
Escreva `definir_nota(nota)` que valida uma nota escolar e a devolve como `float`:

- se `nota` não for `int` nem `float`, lance `TypeError`;
- se estiver fora do intervalo de 0 a 10, lance `ValueError`;
- caso contrário, devolva `float(nota)`.

```python inicial
def definir_nota(nota):
    return float(nota)
```

```python solucao
def definir_nota(nota):
    if not isinstance(nota, (int, float)):
        raise TypeError(f"a nota deve ser um número, recebi {type(nota).__name__}")
    if not 0 <= nota <= 10:
        raise ValueError(f"a nota deve estar entre 0 e 10, recebi {nota}")
    return float(nota)
```

```python teste
assert definir_nota(7) == 7.0 and isinstance(definir_nota(7), float), "definir_nota(7) deveria devolver 7.0 (float)"
assert definir_nota(0) == 0.0 and definir_nota(10) == 10.0, "0 e 10 são notas válidas"
def _lanca(valor, tipo):
    try:
        definir_nota(valor)
    except tipo:
        return True
    except Exception as e:
        raise AssertionError(f"definir_nota({valor!r}) deveria lançar {tipo.__name__}, mas lançou {type(e).__name__}")
    return False
assert _lanca("8", TypeError), "definir_nota('8') deveria lançar TypeError (texto não é número)"
assert _lanca(None, TypeError), "definir_nota(None) deveria lançar TypeError"
assert _lanca(11, ValueError), "definir_nota(11) deveria lançar ValueError"
assert _lanca(-0.5, ValueError), "definir_nota(-0.5) deveria lançar ValueError"
```

## Exceções personalizadas
fonte: Documentação oficial do Python (Tutorial, cap. 8.6 – Exceções definidas pelo usuário)

Às vezes nenhuma exceção embutida descreve bem o problema do **seu** programa. Num sistema bancário, por exemplo, "saldo insuficiente" é um erro do domínio, diferente de um `ValueError` qualquer. Você pode criar sua própria exceção.

### O mínimo de classe que você precisa

Classes serão estudadas a fundo no módulo de Orientação a Objetos. Por ora basta saber: uma **classe** define um novo tipo, e escrever `class Nome(Pai):` cria um tipo que **herda** tudo de `Pai`. Toda exceção é uma classe, então criar a sua é só herdar de `Exception`:

```python
class SaldoInsuficienteError(Exception):
    """Lançada quando um saque é maior que o saldo."""

def sacar(saldo, valor):
    if valor > saldo:
        raise SaldoInsuficienteError(f"saldo {saldo:.2f} não cobre saque de {valor:.2f}")
    return saldo - valor

print(sacar(100, 30))
try:
    sacar(100, 250)
except SaldoInsuficienteError as e:
    print("Operação negada:", e)
```

A *docstring* já basta como corpo da classe (você também pode usar `pass`). Convenções:

- o nome termina em **`Error`** (como as embutidas);
- herde de `Exception` (nunca de `BaseException`), ou de uma exceção embutida mais próxima do significado, como `ValueError`.

### Uma família de exceções

Criar uma exceção base para o seu programa permite que quem usa o código trate **todos** os seus erros de uma vez, ou cada um separadamente:

```python
class LojaError(Exception):
    """Base de todos os erros da loja."""

class ProdutoInexistenteError(LojaError):
    pass

class EstoqueInsuficienteError(LojaError):
    pass

estoque = {"caderno": 3}

def comprar(item, qtd):
    if item not in estoque:
        raise ProdutoInexistenteError(item)
    if qtd > estoque[item]:
        raise EstoqueInsuficienteError(f"{item}: pedido {qtd}, há {estoque[item]}")
    estoque[item] -= qtd

for pedido in [("caderno", 2), ("caderno", 5), ("régua", 1)]:
    try:
        comprar(*pedido)
        print(pedido, "-> ok")
    except LojaError as e:          # trata qualquer erro da loja
        print(pedido, "->", type(e).__name__, e)
```

### Guardando informações extras

Uma exceção pode carregar dados para quem a trata. Para isso definimos o método especial `__init__` (que roda quando o objeto é criado) e chamamos o `__init__` da classe pai com `super()`. Não se preocupe com os detalhes: eles voltam no módulo de POO.

```python
class ValorForaDoLimiteError(ValueError):
    def __init__(self, valor, minimo, maximo):
        super().__init__(f"{valor} fora do limite [{minimo}, {maximo}]")
        self.valor = valor
        self.minimo = minimo
        self.maximo = maximo

try:
    raise ValorForaDoLimiteError(42, 0, 10)
except ValueError as e:      # funciona porque herda de ValueError
    print(e)
    print("Valor recebido:", e.valor, "| máximo:", e.maximo)
```

### Exercício
Crie a exceção `SenhaFracaError` (herdando de `ValueError`) e a função `validar_senha(senha)`, que lança `SenhaFracaError` se a senha:

- tiver menos de 8 caracteres; **ou**
- não tiver nenhum dígito (use `any(c.isdigit() for c in senha)`).

Se a senha for boa, a função devolve `True`.

```python inicial
def validar_senha(senha):
    return True
```

```python solucao
class SenhaFracaError(ValueError):
    """Senha não atende aos requisitos mínimos."""

def validar_senha(senha):
    if len(senha) < 8:
        raise SenhaFracaError("a senha precisa de pelo menos 8 caracteres")
    if not any(c.isdigit() for c in senha):
        raise SenhaFracaError("a senha precisa de pelo menos um dígito")
    return True
```

```python teste
assert "SenhaFracaError" in globals(), "Crie a classe SenhaFracaError"
assert issubclass(SenhaFracaError, ValueError), "SenhaFracaError deve herdar de ValueError"
assert validar_senha("segura123") is True, "'segura123' é uma senha válida: deveria devolver True"
for ruim in ["abc1", "semdigitos", ""]:
    try:
        validar_senha(ruim)
    except SenhaFracaError:
        pass
    else:
        raise AssertionError(f"validar_senha({ruim!r}) deveria lançar SenhaFracaError")
```

## assert e programação defensiva
fonte: Pense em Python cap. 6.9 e 16.5; Documentação oficial do Python (instrução assert)

A instrução `assert` verifica uma condição que **deveria** ser sempre verdadeira. Se ela for falsa, o Python lança `AssertionError` com a mensagem opcional:

```python
def area_retangulo(largura, altura):
    assert largura >= 0 and altura >= 0, "dimensões não podem ser negativas"
    return largura * altura

print(area_retangulo(3, 4))
```

```python erro
def area_retangulo(largura, altura):
    assert largura >= 0 and altura >= 0, "dimensões não podem ser negativas"
    return largura * altura

print(area_retangulo(3, -4))
```

### assert é para bugs, não para dados do usuário

O `assert` serve para pegar **erros do programador**: situações que "nunca deveriam acontecer" se o código estivesse certo. Ele pode ser **desligado**: rodando `python -O programa.py`, todas as asserções são ignoradas. Por isso:

| Use `assert` para | Use `if` + `raise` para |
|---|---|
| Conferir suposições internas do seu código | Validar entrada do usuário, arquivos, rede |
| Pré e pós-condições durante o desenvolvimento | Regras de negócio que sempre valem |
| Testes automáticos (como os deste app!) | Qualquer coisa que precise funcionar com `-O` |

> ⚠️ Cuidado com `assert (condição, "mensagem")` entre parênteses: isso é uma **tupla** não vazia, que é sempre verdadeira, e o assert nunca falha! O Python até avisa com um `SyntaxWarning`.

### Pré-condições e pós-condições

O *Pense em Python* sugere pensar em cada função como um contrato: as **pré-condições** são responsabilidade de quem chama (os argumentos estão certos?) e as **pós-condições** são responsabilidade da função (o resultado está certo?). Verificar as duas ajuda a localizar o culpado de um bug:

```python
def media(valores):
    assert len(valores) > 0, "pré-condição: a lista não pode ser vazia"
    resultado = sum(valores) / len(valores)
    assert min(valores) <= resultado <= max(valores), "pós-condição violada!"
    return resultado

print(media([4, 8, 9]))
```

### Programação defensiva

Programar defensivamente é **desconfiar** das entradas e falhar cedo, com mensagens claras, em vez de deixar dados ruins se espalharem pelo programa:

```python
def aplicar_desconto(preco, percentual):
    if not isinstance(preco, (int, float)) or not isinstance(percentual, (int, float)):
        raise TypeError("preço e percentual devem ser números")
    if preco < 0:
        raise ValueError("preço negativo")
    if not 0 <= percentual <= 100:
        raise ValueError("percentual deve estar entre 0 e 100")
    novo = preco * (1 - percentual / 100)
    assert 0 <= novo <= preco   # se falhar, o bug é NOSSO
    return round(novo, 2)

print(aplicar_desconto(80, 25))
print(aplicar_desconto(19.90, 10))
```

> 💡 "Falhe cedo, falhe alto": um erro que estoura logo na entrada da função é muito mais fácil de depurar do que um valor errado que só aparece três telas depois.

### Exercício
Escreva `media_ponderada(valores, pesos)` que devolve a média ponderada (soma de valor × peso dividida pela soma dos pesos). Use `assert` para garantir as pré-condições:

- as duas listas têm o mesmo tamanho;
- a soma dos pesos é maior que zero.

Ex.: `media_ponderada([10, 5], [3, 1])` → `8.75`.

```python inicial
def media_ponderada(valores, pesos):
    total = 0
    for v, p in zip(valores, pesos):
        total += v * p
    return total / sum(pesos)
```

```python solucao
def media_ponderada(valores, pesos):
    assert len(valores) == len(pesos), "valores e pesos devem ter o mesmo tamanho"
    assert sum(pesos) > 0, "a soma dos pesos deve ser positiva"
    total = 0
    for v, p in zip(valores, pesos):
        total += v * p
    return total / sum(pesos)
```

```python teste
assert media_ponderada([10, 5], [3, 1]) == 8.75, "media_ponderada([10, 5], [3, 1]) deveria dar 8.75"
assert media_ponderada([7], [2]) == 7, "media_ponderada([7], [2]) deveria dar 7"
for vals, pesos, desc in [([1, 2, 3], [1, 1], "tamanhos diferentes"), ([5, 5], [0, 0], "pesos somando zero")]:
    try:
        media_ponderada(vals, pesos)
    except AssertionError:
        pass
    except Exception as e:
        raise AssertionError(f"Com {desc} deveria lançar AssertionError, mas lançou {type(e).__name__}")
    else:
        raise AssertionError(f"Com {desc} deveria lançar AssertionError")
```

## Técnicas de depuração
fonte: Pense em Python Apêndice A e cap. 1.7

Depurar é como ser **detetive**: você observa as pistas (o comportamento do programa), formula uma hipótese sobre a causa, testa a hipótese e repete. Como disse Sherlock Holmes, citado no *Pense em Python*: eliminado o impossível, o que sobrar, por mais improvável, deve ser a verdade.

### 1. Print estratégico

A ferramenta mais simples e eficaz: imprimir valores em pontos-chave para ver **o que o programa realmente está fazendo** (e não o que você acha que ele faz). Use `repr` ou o especificador `=` das f-strings, que mostra o nome e o valor. No exemplo abaixo o programa quebra, e os prints mostram exatamente com qual valor:

```python erro
def soma_pares(numeros):
    total = 0
    for n in numeros:
        print(f"DEBUG {n=} {total=}")
        if n % 2 == 0:
            total += n
    return total

print(soma_pares([3, 4, "6", 8]))
```

O último `DEBUG` antes do erro mostra `n='6'`: um **texto** no meio dos números (com texto, `%` significa formatação de string, daí a mensagem estranha). A pista certa economiza minutos de adivinhação.

O `print` com `!r` / `repr` revela detalhes invisíveis, como espaços e tipos:

```python
valor = "42 "
print("valor:", valor)        # parece normal
print(f"{valor!r}")           # '42 ' -> tem um espaço no final!
print(f"{valor=}", type(valor))
```

> 💡 Quando houver prints demais (o *Pense em Python* fala em ser "inundado pelos resultados"), **reduza a entrada**: teste com uma lista de 3 itens, não de 3 mil. E apague os prints de depuração quando terminar.

### 2. Rastreamento manual (teste de mesa)

Pegue papel e "execute" o código à mão, anotando o valor de cada variável a cada passo numa tabela. Para `soma_pares([3, 4, 8])`:

| Passo | n | n % 2 == 0? | total |
|---|---|---|---|
| início | — | — | 0 |
| 1 | 3 | não | 0 |
| 2 | 4 | sim | 4 |
| 3 | 8 | sim | 12 |

### 3. Pato de borracha

Explique o código, linha por linha, em voz alta, para alguém, ou para um pato de borracha na mesa. Ao verbalizar *"aqui eu percorro a lista até o penúltimo elemento..."*, você frequentemente percebe sozinho o erro. Funciona assustadoramente bem.

### 4. Bisseção (busca binária do bug)

Se um programa de 100 linhas dá resultado errado, verifique um valor intermediário **no meio** (linha 50). Se lá já está errado, o bug está na primeira metade; senão, na segunda. Repetindo, em ~7 passos você chega à linha culpada. O mesmo vale para **dados**: se um arquivo de 1000 linhas quebra o programa, teste com metade dele.

```python
def etapa1(x): return x * 2
def etapa2(x): return x + 10
def etapa3(x): return x // 3     # bug: deveria ser divisão comum
def etapa4(x): return x - 1

x = 7
for etapa in [etapa1, etapa2, etapa3, etapa4]:
    x = etapa(x)
    print(f"depois de {etapa.__name__}: {x}")   # onde o valor saiu do esperado?
```

### 5. Reduza o problema

Crie o **menor exemplo possível** que ainda mostra o bug. Remova tudo o que não é essencial. Muitas vezes, nesse processo, a causa aparece. E se não aparecer, um exemplo mínimo é exatamente o que você deve mostrar ao pedir ajuda.

### 6. Leia a documentação (e a mensagem de erro!)

Muitos bugs vêm de supor algo errado sobre uma função. `help()` e a documentação oficial dizem exatamente o que ela recebe e devolve:

```python
help(str.split)
lista = [3, 1, 2]
resultado = lista.sort()
print(resultado)   # None! sort() ordena no lugar e não devolve nada
```

### Mais conselhos do Apêndice A

- **O programa não muda nada?** Talvez você esteja editando um arquivo e rodando outro. Coloque um `print("versão nova")` no topo para conferir.
- **O programa trava?** Provavelmente um laço infinito: imprima a variável de controle a cada volta.
- **Expressão "cabeluda"?** Quebre em variáveis temporárias com nomes claros e imprima cada uma.
- **Empacou?** Afaste-se do computador. Muitos bugs são resolvidos no banho, no ônibus ou dormindo.
- **Vai pedir ajuda?** Leve a mensagem de erro completa, o exemplo mínimo, o que você esperava e o que já tentou.

### Exercício
A função `contar_vogais(texto)` deveria contar as vogais (a, e, i, o, u) de um texto, **sem diferenciar maiúsculas e minúsculas**. Ela tem **dois** bugs. Use prints ou teste de mesa para encontrá-los e corrija. Ex.: `contar_vogais("Abacaxi Uva")` → `6`.

```python inicial
def contar_vogais(texto):
    total = 0
    for letra in texto:
        if letra in "aeio":
            total += 1
    return total
```

```python solucao
def contar_vogais(texto):
    total = 0
    for letra in texto.lower():
        if letra in "aeiou":
            total += 1
    return total
```

```python teste
assert contar_vogais("Abacaxi Uva") == 6, f"contar_vogais('Abacaxi Uva') deveria dar 6, deu {contar_vogais('Abacaxi Uva')}"
assert contar_vogais("uuu") == 3, "contar_vogais('uuu') deveria dar 3 (o 'u' também é vogal)"
assert contar_vogais("AEIOU") == 5, "contar_vogais('AEIOU') deveria dar 5 (maiúsculas contam)"
assert contar_vogais("xyz") == 0, "contar_vogais('xyz') deveria dar 0"
```

## Erros semânticos comuns
fonte: Pense em Python Apêndice A.3 e caps. 8, 10 e 11

Erros semânticos não geram mensagem: o programa faz exatamente o que você escreveu. Conhecer os mais frequentes ajuda a reconhecê-los rápido.

### 1. Erro por um (*off-by-one*)

Errar o limite de um intervalo em uma unidade. Lembre: `range(a, b)` **não inclui** `b`, e os índices vão de `0` a `len - 1`.

```python
# Queremos somar de 1 a 10 (resultado esperado: 55)
errado = sum(range(1, 10))     # para no 9!
certo = sum(range(1, 11))
print(errado, certo)

letras = ["a", "b", "c"]
print(letras[len(letras) - 1])   # último elemento (ou simplesmente letras[-1])
```

### 2. `=` versus `==`, e comparações enganosas

Em Python, `if x = 5:` é erro de sintaxe (ainda bem!). Mas outras confusões passam despercebidas:

```python
cor = "azul"
# Parece certo, mas é SEMPRE verdadeiro: "verde" é uma string não vazia
if cor == "vermelho" or "verde":
    print("errado: entrou no if!")
# Correto:
if cor == "vermelho" or cor == "verde":
    print("não entra")
if cor in ("vermelho", "verde"):
    print("também não entra")

print(0.1 + 0.2 == 0.3)            # False! ponto flutuante não é exato
import math
print(math.isclose(0.1 + 0.2, 0.3))  # True: compare floats assim
```

### 3. Modificar uma lista enquanto a percorre

Remover itens de uma lista **durante** um `for` sobre ela faz o laço pular elementos, porque os índices "andam" por baixo do laço:

```python
numeros = [1, 2, 2, 3, 4, 4]
for n in numeros:
    if n % 2 == 0:
        numeros.remove(n)
print(numeros)   # esperado [1, 3], mas sobram pares!
```

A solução é criar uma **nova** lista (ou percorrer uma cópia):

```python
numeros = [1, 2, 2, 3, 4, 4]
impares = [n for n in numeros if n % 2 != 0]
print(impares)

for n in numeros[:]:          # percorre uma cópia, altera a original
    if n % 2 == 0:
        numeros.remove(n)
print(numeros)
```

### 4. Mutáveis compartilhados (aliasing)

Atribuir uma lista a outra variável **não copia** a lista: as duas variáveis apontam para o **mesmo objeto**.

```python
original = [1, 2, 3]
apelido = original          # mesmo objeto!
apelido.append(4)
print(original)             # [1, 2, 3, 4]

copia = original.copy()     # ou list(original) ou original[:]
copia.append(5)
print(original, copia)

matriz = [[0] * 3] * 3      # 3 referências para a MESMA linha
matriz[0][0] = 9
print(matriz)               # o 9 aparece nas três linhas!
matriz_ok = [[0] * 3 for _ in range(3)]
matriz_ok[0][0] = 9
print(matriz_ok)
```

### 5. Valor padrão mutável em função

O valor padrão de um parâmetro é criado **uma única vez**, quando a função é definida. Uma lista padrão é, portanto, compartilhada entre todas as chamadas:

```python
def adicionar(item, lista=[]):      # armadilha!
    lista.append(item)
    return lista

print(adicionar("a"))
print(adicionar("b"))   # ['a', 'b'] ... a lista "lembrou" da chamada anterior

def adicionar_ok(item, lista=None):
    if lista is None:
        lista = []
    lista.append(item)
    return lista

print(adicionar_ok("a"))
print(adicionar_ok("b"))
```

### 6. Esquecer o return (ou usar o retorno de um método "no lugar")

```python
def dobro(x):
    resultado = x * 2      # esqueceu o return

print(dobro(4))            # None

nomes = ["Caio", "Ana"]
nomes = nomes.sort()       # sort() devolve None!
print(nomes)
```

> 💡 Métodos que **modificam** o objeto (`sort`, `append`, `reverse`, `remove`...) geralmente devolvem `None`. As funções `sorted()` e `reversed()` é que criam algo novo.

### Exercício
A função `remover_negativos(numeros)` deveria **devolver uma nova lista** sem os números negativos, **sem alterar** a lista original. A versão atual tem o bug de modificar a lista enquanto a percorre. Corrija.

```python inicial
def remover_negativos(numeros):
    for n in numeros:
        if n < 0:
            numeros.remove(n)
    return numeros
```

```python solucao
def remover_negativos(numeros):
    return [n for n in numeros if n >= 0]
```

```python teste
dados = [-1, -2, 3, -4, -5, 6, 0]
copia = list(dados)
r = remover_negativos(dados)
assert r == [3, 6, 0], f"remover_negativos({copia}) deveria devolver [3, 6, 0], devolveu {r}"
assert dados == copia, "A lista original não deveria ser modificada"
assert r is not dados, "Devolva uma NOVA lista, não a original"
assert remover_negativos([]) == [], "Com lista vazia deveria devolver []"
```

## EAFP vs LBYL
fonte: Documentação oficial do Python (Glossário: EAFP, LBYL)

Há dois estilos para lidar com situações que podem dar errado:

- **LBYL** (*Look Before You Leap*, "olhe antes de pular"): verifique as condições **antes** de agir, com `if`.
- **EAFP** (*Easier to Ask Forgiveness than Permission*, "é mais fácil pedir perdão que permissão"): **tente** fazer e trate a exceção se der errado.

```python
dados = {"nome": "Lia", "idade": "28"}

# LBYL: verifica antes
if "idade" in dados and dados["idade"].isdigit():
    idade = int(dados["idade"])
else:
    idade = None
print("LBYL:", idade)

# EAFP: tenta e trata
try:
    idade = int(dados["idade"])
except (KeyError, ValueError):
    idade = None
print("EAFP:", idade)
```

### Por que o Python costuma preferir EAFP

1. **Cobre casos que você não previu**: `"−5".isdigit()` e `"3.0".isdigit()` dão `False`, e `"²".isdigit()` dá `True` mas `int("²")` falha! O `try` com `int()` usa a própria regra da conversão.
2. **Evita checar duas vezes**: com LBYL você procura a chave no `if` e de novo ao acessá-la.
3. **Evita condições de corrida**: entre o `if os.path.exists(arq)` e o `open(arq)`, outro programa pode apagar o arquivo. Com EAFP, só há uma operação.

```python
print("²".isdigit())   # True ... mas:
try:
    int("²")
except ValueError as e:
    print("int falhou:", e)
```

### Quando LBYL é melhor

- quando o erro é **comum** (tratar exceção é um pouco mais lento que um `if` quando ela acontece muito);
- quando a verificação é **simples e clara**, como `if lista:` antes de pegar `lista[0]`;
- quando a ação tem **efeitos colaterais** difíceis de desfazer pela metade.

E lembre-se de que muitas vezes há um terceiro caminho, mais limpo que ambos:

```python
estoque = {"maçã": 3}
print(estoque.get("pera", 0))          # dict.get com valor padrão
contagem = {}
for fruta in ["maçã", "pera", "maçã"]:
    contagem[fruta] = contagem.get(fruta, 0) + 1
print(contagem)
```

> 💡 Não existe estilo "certo" universal: EAFP é o idioma mais comum em Python, mas escolha o que deixa o código **mais claro e correto** para cada caso.

### Exercício
Escreva `obter(dados, caminho, padrao=None)` no estilo **EAFP**: ela percorre dicionários (e listas) aninhados seguindo as chaves da lista `caminho` e devolve o valor final. Se algum passo falhar (`KeyError`, `IndexError` ou `TypeError`), devolve `padrao`.

```text
config = {"banco": {"portas": [5432, 5433], "host": "local"}}
obter(config, ["banco", "host"])          -> "local"
obter(config, ["banco", "portas", 1])     -> 5433
obter(config, ["banco", "senha"], "?")    -> "?"
obter(config, ["banco", "host", "x"])     -> None   (str não aceita índice "x")
```

```python inicial
def obter(dados, caminho, padrao=None):
    atual = dados
    for chave in caminho:
        atual = atual[chave]
    return atual
```

```python solucao
def obter(dados, caminho, padrao=None):
    atual = dados
    try:
        for chave in caminho:
            atual = atual[chave]
    except (KeyError, IndexError, TypeError):
        return padrao
    return atual
```

```python teste
config = {"banco": {"portas": [5432, 5433], "host": "local"}}
assert obter(config, ["banco", "host"]) == "local", "obter(config, ['banco', 'host']) deveria dar 'local'"
assert obter(config, ["banco", "portas", 1]) == 5433, "obter(config, ['banco', 'portas', 1]) deveria dar 5433"
assert obter(config, ["banco", "senha"], "?") == "?", "Chave inexistente deveria devolver o padrão"
assert obter(config, ["banco", "portas", 9], 0) == 0, "Índice inexistente deveria devolver o padrão"
assert obter(config, ["banco", "host", "x"]) is None, "Indexar uma str com 'x' (TypeError) deveria devolver None"
assert obter(config, []) == config, "Caminho vazio deveria devolver os próprios dados"
```

## Quiz
? Qual exceção é lançada por `int("abc")`?
- [ ] TypeError
- [x] ValueError
- [ ] SyntaxError
- [ ] NameError
> O tipo do argumento (str) é aceito por `int()`, mas aquele valor não representa um número: isso é um `ValueError`.

? Num traceback, onde você deve olhar primeiro?
- [ ] Na primeira linha
- [x] Na última linha, que mostra o tipo e a mensagem do erro
- [ ] No meio, nas linhas com `~~~`
- [ ] Não é preciso ler, basta apagar o código
> A última linha diz qual exceção ocorreu e por quê; logo acima dela está o ponto exato onde o erro aconteceu.

? Qual bloco de um `try` é executado SOMENTE quando nenhuma exceção ocorreu?
- [ ] except
- [ ] finally
- [x] else
- [ ] try
> O `else` roda só em caso de sucesso; o `finally` roda sempre.

? Por que `except:` sem tipo (ou `except Exception:` genérico) é considerado má prática?
- [ ] Porque deixa o programa mais lento
- [x] Porque captura também erros inesperados (como erros de digitação) e esconde bugs
- [ ] Porque é um erro de sintaxe
- [ ] Porque só captura SyntaxError
> Capture apenas as exceções que você sabe tratar; as demais devem aparecer para serem corrigidas.

? Como criar uma exceção personalizada?
- [ ] `def MinhaErro(): raise`
- [ ] `exception MinhaErro`
- [x] `class MinhaErro(Exception): pass`
- [ ] `raise new MinhaErro`
> Exceções são classes. Herdando de `Exception` (ou de uma exceção mais específica), você cria seu próprio tipo de erro.

? Qual é o problema de usar `assert` para validar dados digitados pelo usuário?
- [ ] assert não aceita mensagem
- [x] As asserções podem ser desativadas com `python -O`, e a validação sumiria
- [ ] assert só funciona com números
- [ ] Nenhum, é o jeito recomendado
> `assert` é para conferir suposições internas (bugs do programador). Validação de dados deve usar `if` + `raise`.

? O que imprime este código? `try: x = 1/0` / `except ZeroDivisionError: print("A")` / `finally: print("B")`
- [ ] Só A
- [ ] Só B
- [x] A e depois B
- [ ] B e depois A
> A exceção é tratada no `except` (imprime A) e o `finally` sempre roda no final (imprime B).

? Qual o resultado de `sum(range(1, 10))` quando a intenção era somar de 1 a 10?
- [ ] 55, como esperado
- [x] 45: um erro "off-by-one", pois range não inclui o 10
- [ ] Dá erro
- [ ] 50
> `range(1, 10)` gera de 1 a 9. Para incluir o 10 use `range(1, 11)`.

? Depois de `a = [1, 2]`, `b = a` e `b.append(3)`, quanto vale `a`?
- [ ] [1, 2]
- [x] [1, 2, 3]
- [ ] [3]
- [ ] Dá erro
> `b = a` não copia a lista: as duas variáveis referenciam o mesmo objeto. Use `a.copy()` para copiar.

? O que significa o estilo EAFP?
- [ ] Verificar tudo com if antes de agir
- [x] Tentar a operação e tratar a exceção se ela falhar
- [ ] Nunca usar exceções
- [ ] Usar assert em todas as funções
> "Easier to Ask Forgiveness than Permission": tenta-se com `try` e trata-se com `except`. É o estilo mais comum em Python.
