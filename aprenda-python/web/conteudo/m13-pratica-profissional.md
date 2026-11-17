# Prática profissional e ecossistema
id: m13
nivel: Avançado
icone: 🛠️
descricao: Estilo, documentação, testes, logging, ambientes virtuais, Git, desempenho e as trilhas de carreira com Python.

## Estilo e legibilidade: PEP 8 e o Zen of Python
fonte: PEP 8; PEP 20; Pense em Python Apêndice A

Código é lido muito mais vezes do que é escrito: por colegas, por quem vai manter o projeto e por você mesmo daqui a seis meses. Por isso a comunidade Python segue um guia de estilo comum, a **PEP 8** (*Python Enhancement Proposal* número 8). Seguir a PEP 8 não muda o que o programa faz, mas faz qualquer pessoa que conhece Python se sentir "em casa" no seu código.

### Nomes

| O quê | Convenção | Exemplo |
|---|---|---|
| Variáveis e funções | `snake_case` (minúsculas com `_`) | `total_vendas`, `calcular_media()` |
| Classes | `PascalCase` (iniciais maiúsculas) | `ContaBancaria`, `ListaDeTarefas` |
| Constantes | `MAIUSCULAS_COM_UNDERLINE` | `TAXA_JUROS = 0.02` |
| Módulos e pacotes | curtos, minúsculos | `utilidades.py`, `relatorios` |
| Uso "interno" | começa com `_` | `_cache`, `_validar()` |

Prefira nomes que digam **o que** a coisa é: `preco_total` é melhor que `pt`, e `alunos_aprovados` é melhor que `lista2`. Evite `l` (letra L minúscula), `O` e `I` sozinhos, que se confundem com `1` e `0`.

### Espaços, linhas e indentação

- **4 espaços** por nível de indentação (nunca TAB misturado com espaços).
- Um espaço ao redor de operadores de atribuição e comparação: `x = y + 1`, `if a == b:`.
- Sem espaço antes de parênteses de chamada ou colchetes: `print(x)`, `lista[0]`.
- Sem espaços ao redor do `=` de argumentos nomeados: `print(a, sep="-")`.
- Depois de vírgula, um espaço: `f(a, b, c)`.
- Linhas com até **79 caracteres** (muitos projetos aceitam 88 ou 99). Quebre linhas longas dentro de parênteses.
- Duas linhas em branco entre funções e classes de nível superior; uma entre métodos.

```python
# Ruim: funciona, mas é difícil de ler
def CalculaPreco( p,q ,d=0 ):
  t=p*q
  return t-t*d

# Bom: segue a PEP 8
def calcular_preco(preco_unitario, quantidade, desconto=0):
    total = preco_unitario * quantidade
    return total - total * desconto


print(CalculaPreco(10, 3, 0.1), calcular_preco(10, 3, 0.1))
```

### Imports

Os imports ficam **no topo do arquivo**, um por linha, em três grupos separados por uma linha em branco: biblioteca padrão, bibliotecas de terceiros e módulos do seu próprio projeto.

```text
import json
import os
from pathlib import Path

import requests

from meu_projeto.modelos import Cliente
```

> ⚠️ Evite `from modulo import *`: ele joga dezenas de nomes no seu código e fica impossível saber de onde cada um veio.

### Ferramentas que fazem isso por você

No computador, ninguém confere a PEP 8 "no olho". Use um **linter** (aponta problemas) e um **formatador** (reescreve o código no padrão):

```bash
pip install ruff black
ruff check .        # lista problemas de estilo e erros comuns
black .             # formata todos os arquivos automaticamente
```

### O Zen of Python

A **PEP 20** resume a filosofia da linguagem em 19 aforismos. No interpretador, basta digitar `import this`. Aqui usamos um pequeno truque para mostrar o texto toda vez que você executar:

```python
import contextlib, io
with contextlib.redirect_stdout(io.StringIO()):
    import this          # o texto fica guardado, "embaralhado", em this.s
print("".join(this.d.get(c, c) for c in this.s))
```

Alguns aforismos, traduzidos livremente:

| Original | Em português |
|---|---|
| Beautiful is better than ugly. | Bonito é melhor que feio. |
| Explicit is better than implicit. | Explícito é melhor que implícito. |
| Simple is better than complex. | Simples é melhor que complexo. |
| Readability counts. | Legibilidade conta. |
| Errors should never pass silently. | Erros nunca devem passar em silêncio. |
| There should be one obvious way to do it. | Deve haver um jeito óbvio de fazer. |

> 💡 "Pythônico" (*pythonic*) é o código que usa a linguagem do jeito que ela foi pensada: `for item in lista` em vez de `for i in range(len(lista))`, compreensões, `with` para arquivos etc.

### Exercício
A função abaixo funciona, mas fere a PEP 8. Reescreva-a com o nome `calcular_media` (snake_case), parâmetro `notas` e indentação de 4 espaços. Ela deve devolver a média das notas, ou `0` se a lista estiver vazia.

```python inicial
def CalculaMedia(L):
  if len(L)==0: return 0
  return sum(L)/len(L)
```

```python solucao
def calcular_media(notas):
    if len(notas) == 0:
        return 0
    return sum(notas) / len(notas)
```

```python teste
assert "calcular_media" in dir(), "Defina uma função chamada calcular_media (em snake_case)."
assert calcular_media([7, 8, 9]) == 8, "calcular_media([7, 8, 9]) deveria dar 8."
assert calcular_media([]) == 0, "calcular_media([]) deveria dar 0."
import inspect
assert list(inspect.signature(calcular_media).parameters) == ["notas"], "O parâmetro deve se chamar notas."
```

## Documentação: docstrings, help() e doctest
fonte: PEP 257; documentação do módulo doctest

Uma **docstring** é uma string escrita logo na primeira linha de uma função, classe ou módulo. Diferente de um comentário, ela fica guardada no objeto (`__doc__`) e é mostrada por `help()` e pelos editores quando você passa o mouse sobre a função.

```python
def converter_temperatura(celsius):
    """Converte uma temperatura de graus Celsius para Fahrenheit.

    Args:
        celsius: temperatura em °C (int ou float).

    Returns:
        A temperatura em °F, como float.
    """
    return celsius * 9 / 5 + 32


print(converter_temperatura.__doc__)
help(converter_temperatura)
```

Convenções da **PEP 257**:

- Use sempre aspas triplas `"""`, mesmo para uma linha só.
- A primeira linha é um **resumo** curto, terminado em ponto, no imperativo ou descritivo ("Converte...", "Devolve...").
- Se houver mais detalhes, deixe uma linha em branco depois do resumo.
- Descreva parâmetros, retorno e exceções lançadas. Estilos populares: Google (o do exemplo), NumPy e reStructuredText.

> 💡 `help()` funciona com qualquer coisa: `help(str.split)`, `help(len)`, `help(list)`. É a documentação oficial sempre à mão, mesmo offline.

### doctest: exemplos que se testam sozinhos

Se você colocar na docstring exemplos no formato do REPL (`>>>` seguido do resultado esperado), o módulo **doctest** consegue executá-los e conferir se o resultado bate. A documentação vira teste!

```python
import doctest

def fatorial(n):
    """Devolve n! (fatorial de n).

    >>> fatorial(0)
    1
    >>> fatorial(5)
    120
    >>> [fatorial(i) for i in range(4)]
    [1, 1, 2, 6]
    """
    resultado = 1
    for i in range(2, n + 1):
        resultado *= i
    return resultado


# Neste app, capturamos o relatório do doctest com redirect_stdout
import contextlib, io
relatorio = io.StringIO()
with contextlib.redirect_stdout(relatorio):
    doctest.run_docstring_examples(fatorial, {"fatorial": fatorial}, verbose=False)
print(relatorio.getvalue() or "Nenhuma falha: todos os exemplos passaram!")
```

Agora veja o que acontece quando um exemplo está **errado** (o esperado diz 25, mas a função devolve 24):

```python
import doctest

def dobro(x):
    """
    >>> dobro(12)
    25
    """
    return x * 2


import contextlib, io
relatorio = io.StringIO()
with contextlib.redirect_stdout(relatorio):
    doctest.run_docstring_examples(dobro, {"dobro": dobro}, name="dobro")
print(relatorio.getvalue() or "Nenhuma falha.")
```

Num arquivo `.py` no computador, o jeito mais comum é colocar no final:

```text
if __name__ == "__main__":
    import doctest
    doctest.testmod()          # testa todas as docstrings do arquivo
```

Ou rodar pelo terminal: `python -m doctest meu_modulo.py -v`.

### Exercício
Escreva a função `area_retangulo(largura, altura)` que devolve a área. Ela **deve ter uma docstring** com pelo menos um exemplo de doctest (uma linha começando com `>>>`), e o exemplo precisa passar.

```python inicial
def area_retangulo(largura, altura):
    return largura + altura
```

```python solucao
def area_retangulo(largura, altura):
    """Devolve a área de um retângulo.

    >>> area_retangulo(3, 4)
    12
    """
    return largura * altura
```

```python teste
import doctest
assert area_retangulo(3, 4) == 12, "area_retangulo(3, 4) deveria dar 12."
assert area_retangulo(2.5, 2) == 5, "area_retangulo(2.5, 2) deveria dar 5.0."
doc = area_retangulo.__doc__
assert doc, "A função precisa de uma docstring (string com aspas triplas na primeira linha)."
assert ">>>" in doc, "Inclua na docstring um exemplo de doctest, começando com >>>."
_finder = doctest.DocTestFinder()
_runner = doctest.DocTestRunner(verbose=False)
for _t in _finder.find(area_retangulo, "area_retangulo", globs={"area_retangulo": area_retangulo}):
    _runner.run(_t, out=lambda s: None)
assert _runner.failures == 0, "Algum exemplo da docstring não confere com o resultado real."
assert _runner.tries > 0, "Nenhum exemplo de doctest foi encontrado."
```

## Testes automatizados: unittest, pytest e TDD
fonte: documentação dos módulos unittest e pytest

Testar "na mão" (rodar e olhar o resultado) não escala: a cada mudança você teria de conferir tudo de novo. **Testes automatizados** são pequenos programas que verificam seu código e podem ser rodados em segundos, quantas vezes quiser. Eles dão coragem para mudar o código: se algo quebrar, um teste avisa.

### unittest (biblioteca padrão)

Você cria uma classe que herda de `unittest.TestCase`; cada método que começa com `test` é um teste. Os métodos `assert...` fazem as verificações:

```python
import sys
import unittest

def eh_palindromo(texto):
    limpo = "".join(c.lower() for c in texto if c.isalnum())
    return limpo == limpo[::-1]


class TestPalindromo(unittest.TestCase):
    def test_palavra_simples(self):
        self.assertTrue(eh_palindromo("arara"))

    def test_ignora_maiusculas_e_espacos(self):
        self.assertTrue(eh_palindromo("Socorram me subi no onibus em Marrocos"))

    def test_nao_palindromo(self):
        self.assertFalse(eh_palindromo("python"))

    def test_vazio(self):
        self.assertEqual(eh_palindromo(""), True)


suite = unittest.TestLoader().loadTestsFromTestCase(TestPalindromo)
unittest.TextTestRunner(stream=sys.stdout, verbosity=2).run(suite)
```

| Método | Verifica |
|---|---|
| `assertEqual(a, b)` | `a == b` |
| `assertNotEqual(a, b)` | `a != b` |
| `assertTrue(x)` / `assertFalse(x)` | `x` é verdadeiro / falso |
| `assertIn(a, b)` | `a in b` |
| `assertIsNone(x)` | `x is None` |
| `assertAlmostEqual(a, b)` | floats quase iguais (evita problemas de arredondamento) |
| `assertRaises(Erro)` | o bloco lança a exceção `Erro` |

Veja um teste que **falha** e um que verifica uma exceção:

```python
import sys
import unittest

def dividir(a, b):
    return a / b


class TestDividir(unittest.TestCase):
    def test_divisao(self):
        self.assertEqual(dividir(10, 4), 2)      # errado de propósito: 10/4 = 2.5

    def test_divisao_por_zero(self):
        with self.assertRaises(ZeroDivisionError):
            dividir(1, 0)


suite = unittest.TestLoader().loadTestsFromTestCase(TestDividir)
resultado = unittest.TextTestRunner(stream=sys.stdout).run(suite)
print("Tudo passou?", resultado.wasSuccessful())
```

No computador, você salva os testes em arquivos `test_*.py` e roda tudo de uma vez:

```bash
python -m unittest           # descobre e roda os arquivos test_*.py
python -m unittest -v        # com mais detalhes
```

> 💡 Neste app usamos `TestLoader` e `TextTestRunner` diretamente. Num arquivo normal, o atalho é `unittest.main()` no final do arquivo.

### pytest: o favorito da comunidade

O **pytest** é uma biblioteca externa (`pip install pytest`) que deixa os testes mais curtos: são funções comuns e você usa o `assert` do próprio Python.

```python nao-executar
# arquivo test_palindromo.py
import pytest
from texto import eh_palindromo

def test_palavra_simples():
    assert eh_palindromo("arara")

def test_nao_palindromo():
    assert not eh_palindromo("python")

@pytest.mark.parametrize("entrada", ["ana", "Ovo", "A cara rajada da jararaca"])
def test_varios(entrada):
    assert eh_palindromo(entrada)

def test_erro():
    with pytest.raises(ZeroDivisionError):
        1 / 0
```

```bash
pip install pytest
pytest              # roda todos os testes
pytest -v           # mostra cada teste
pytest -k palind    # só os testes com "palind" no nome
```

### TDD: escreva o teste primeiro

No **desenvolvimento guiado por testes** (*Test-Driven Development*), o ciclo é:

1. 🔴 **Vermelho**: escreva um teste para algo que ainda não existe. Ele falha.
2. 🟢 **Verde**: escreva o código mínimo para o teste passar.
3. 🔵 **Refatorar**: melhore o código (nomes, duplicação) com os testes garantindo que nada quebrou.

Os exercícios deste app funcionam exatamente assim: o teste já existe, falha com o código inicial, e você escreve o código até ele passar.

### Exercício
TDD na prática: os testes abaixo (que rodam automaticamente) verificam a função `classificar_imc(imc)`. Ela deve devolver `"abaixo"` para IMC menor que 18.5, `"normal"` de 18.5 até menor que 25, `"sobrepeso"` de 25 até menor que 30 e `"obesidade"` de 30 em diante. Escreva a função para deixar os testes verdes.

```python inicial
def classificar_imc(imc):
    return "normal"
```

```python solucao
def classificar_imc(imc):
    if imc < 18.5:
        return "abaixo"
    if imc < 25:
        return "normal"
    if imc < 30:
        return "sobrepeso"
    return "obesidade"
```

```python teste
import io
import unittest

class TestIMC(unittest.TestCase):
    def test_abaixo(self):
        self.assertEqual(classificar_imc(17), "abaixo")

    def test_normal(self):
        self.assertEqual(classificar_imc(18.5), "normal")
        self.assertEqual(classificar_imc(24.9), "normal")

    def test_sobrepeso(self):
        self.assertEqual(classificar_imc(25), "sobrepeso")

    def test_obesidade(self):
        self.assertEqual(classificar_imc(30), "obesidade")
        self.assertEqual(classificar_imc(42), "obesidade")

_saida = io.StringIO()
_res = unittest.TextTestRunner(stream=_saida).run(unittest.TestLoader().loadTestsFromTestCase(TestIMC))
assert _res.wasSuccessful(), "Alguns testes falharam:\n" + _saida.getvalue()[-600:]
```

## Logging: registrando o que acontece
fonte: documentação do módulo logging (Logging HOWTO)

O `print()` é ótimo para aprender e para depurar rapidinho, mas em programas de verdade ele tem problemas: não diz **quando** nem **onde** algo aconteceu, não tem nível de importância e, para desligar, você precisa apagar linha por linha. O módulo **logging** resolve isso.

### Níveis de log

| Nível | Quando usar |
|---|---|
| `DEBUG` | detalhes para depuração (valores de variáveis, passos internos) |
| `INFO` | confirmação de que as coisas funcionam ("arquivo salvo") |
| `WARNING` | algo inesperado, mas o programa continua (padrão mínimo) |
| `ERROR` | um erro impediu uma operação |
| `CRITICAL` | erro grave: o programa pode não conseguir continuar |

```python
import logging
import sys

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
    force=True,          # reconfigura mesmo que já tenha sido configurado
)

log = logging.getLogger("estoque")

def retirar(estoque, item, qtd):
    log.debug("pedido: %s x%d (há %d)", item, qtd, estoque.get(item, 0))
    if estoque.get(item, 0) < qtd:
        log.warning("estoque insuficiente de %s", item)
        return False
    estoque[item] -= qtd
    log.info("retirados %d de %s", qtd, item)
    return True


estoque = {"caneta": 5}
retirar(estoque, "caneta", 2)
retirar(estoque, "caneta", 10)
```

Mude `level=logging.DEBUG` para `logging.WARNING` e execute de novo: as mensagens menos importantes somem, **sem apagar nenhuma linha** de código.

### Boas práticas

- Crie um logger por módulo: `log = logging.getLogger(__name__)`.
- Configure (`basicConfig`) **uma vez**, no ponto de entrada do programa, não dentro das bibliotecas.
- Passe os valores como argumentos (`log.info("total %s", total)`) em vez de f-strings: a formatação só acontece se a mensagem for realmente exibida.
- Dentro de um `except`, use `log.exception("mensagem")`: ele registra também o traceback.
- Para gravar em arquivo: `logging.basicConfig(filename="app.log", level=logging.INFO)`.

```python
import logging
import sys

logging.basicConfig(level=logging.INFO, stream=sys.stdout, force=True,
                    format="%(levelname)s: %(message)s")

try:
    int("doze")
except ValueError:
    logging.exception("não consegui converter a idade")
print("o programa continua")
```

> ⚠️ Nunca registre senhas, tokens ou dados pessoais sensíveis no log: arquivos de log costumam ser lidos por muita gente.

### Exercício
A função `sacar(saldo, valor)` usa `print` para avisar problemas. Troque por logging: use o logger `logging.getLogger("banco")`, registre um **WARNING** quando o saque for negado (valor maior que o saldo, devolvendo o saldo sem mudança) e um **INFO** quando o saque for realizado (devolvendo o novo saldo).

```python inicial
def sacar(saldo, valor):
    if valor > saldo:
        print("Saque negado")
        return saldo
    print("Saque realizado")
    return saldo - valor
```

```python solucao
import logging

log = logging.getLogger("banco")

def sacar(saldo, valor):
    if valor > saldo:
        log.warning("saque de %s negado: saldo %s", valor, saldo)
        return saldo
    log.info("saque de %s realizado", valor)
    return saldo - valor
```

```python teste
import logging

class _Coletor(logging.Handler):
    def __init__(self):
        super().__init__(logging.DEBUG)
        self.registros = []
    def emit(self, record):
        self.registros.append(record)

_lg = logging.getLogger("banco")
_col = _Coletor()
_antes = (_lg.level, _lg.propagate)
_lg.addHandler(_col)
_lg.setLevel(logging.DEBUG)
_lg.propagate = False
try:
    r1 = sacar(100, 30)
    r2 = sacar(50, 80)
finally:
    _lg.removeHandler(_col)
    _lg.setLevel(_antes[0])
    _lg.propagate = _antes[1]
assert r1 == 70, "sacar(100, 30) deveria devolver 70."
assert r2 == 50, "sacar(50, 80) deveria devolver 50 (saque negado, saldo igual)."
_niveis = [r.levelname for r in _col.registros]
assert "WARNING" in _niveis, "Registre um WARNING no logger 'banco' quando o saque for negado."
assert "INFO" in _niveis, "Registre um INFO no logger 'banco' quando o saque for realizado."
```

## Ambientes virtuais, pip e dependências
fonte: Python do Zero p. 6–18; Python Packaging User Guide

Neste app só existe a biblioteca padrão. No computador, você vai instalar pacotes do **PyPI** (*Python Package Index*, pypi.org), o repositório com centenas de milhares de bibliotecas, usando o **pip**.

### Por que ambientes virtuais?

Imagine dois projetos: um precisa do Django 4 e outro do Django 5. Se você instalar tudo no Python do sistema, um projeto quebra o outro. Um **ambiente virtual** (*venv*) é uma pasta com um Python e pacotes **só daquele projeto**.

```bash
# 1. Criar o ambiente (uma vez por projeto), numa pasta chamada .venv
python3 -m venv .venv

# 2. Ativar (toda vez que abrir um terminal novo)
source .venv/bin/activate        # Linux e macOS
.venv\Scripts\activate           # Windows

# 3. Instalar pacotes: eles vão só para este ambiente
pip install requests
pip install "django>=5,<6"

# 4. Sair do ambiente
deactivate
```

> 💡 Com o ambiente ativado, o nome dele aparece no início do prompt, por exemplo `(.venv) $`. O VS Code e o PyCharm detectam a pasta `.venv` sozinhos.

### Comandos do pip

| Comando | O que faz |
|---|---|
| `pip install pacote` | instala a versão mais recente |
| `pip install pacote==2.1.0` | instala uma versão exata |
| `pip install -U pacote` | atualiza |
| `pip uninstall pacote` | remove |
| `pip list` | lista o que está instalado |
| `pip show pacote` | mostra detalhes (versão, dependências) |
| `pip freeze > requirements.txt` | salva as versões instaladas num arquivo |
| `pip install -r requirements.txt` | instala tudo o que está no arquivo |

### requirements.txt

É a forma mais simples de registrar as dependências, para que outra pessoa (ou o servidor) recrie o mesmo ambiente:

```text
# requirements.txt
requests==2.32.3
beautifulsoup4==4.12.3
pandas>=2.2
```

### pyproject.toml: o padrão moderno

Projetos que serão distribuídos (ou simplesmente bem organizados) descrevem nome, versão e dependências no arquivo **pyproject.toml**:

```text
[project]
name = "meu-app"
version = "0.1.0"
description = "Um app de exemplo"
requires-python = ">=3.10"
dependencies = [
    "requests>=2.31",
]

[project.optional-dependencies]
dev = ["pytest", "ruff"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"
```

Com ele, `pip install -e .` instala o seu próprio projeto em modo editável e `pip install -e ".[dev]"` instala também as ferramentas de desenvolvimento. Ferramentas como **uv** e **Poetry** automatizam a criação do venv, a instalação e o "travamento" das versões.

> ⚠️ Não envie a pasta `.venv` para o Git: ela é grande e específica do seu computador. Envie o `requirements.txt` ou o `pyproject.toml`, e coloque `.venv/` no `.gitignore`.

O Python lê arquivos TOML com o módulo `tomllib` da biblioteca padrão:

```python
import tomllib

texto = """
[project]
name = "meu-app"
version = "0.1.0"
dependencies = ["requests>=2.31", "rich"]
"""
dados = tomllib.loads(texto)
print(dados["project"]["name"], dados["project"]["version"])
for dep in dados["project"]["dependencies"]:
    print("-", dep)
```

### Exercício
Escreva `ler_requirements(texto)` que recebe o conteúdo de um `requirements.txt` e devolve um dicionário `{pacote: versão}`. Regras: ignore linhas vazias e linhas que começam com `#`; para `pacote==versão` guarde a versão (string); para linhas sem `==` (ex.: `rich` ou `pandas>=2.2`) guarde o nome inteiro da linha como chave e `None` como valor. Remova espaços nas pontas.

```python inicial
def ler_requirements(texto):
    resultado = {}
    for linha in texto.split("\n"):
        nome, versao = linha.split("==")
        resultado[nome] = versao
    return resultado
```

```python solucao
def ler_requirements(texto):
    resultado = {}
    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#"):
            continue
        if "==" in linha:
            nome, versao = linha.split("==", 1)
            resultado[nome.strip()] = versao.strip()
        else:
            resultado[linha] = None
    return resultado
```

```python teste
_txt = """# dependências do projeto
requests==2.32.3

  flask == 3.0.0
rich
pandas>=2.2
"""
_r = ler_requirements(_txt)
assert isinstance(_r, dict), "A função deve devolver um dicionário."
assert _r.get("requests") == "2.32.3", "requests==2.32.3 deveria virar {'requests': '2.32.3'}."
assert _r.get("flask") == "3.0.0", "Remova os espaços: ' flask == 3.0.0' deveria virar {'flask': '3.0.0'}."
assert "rich" in _r and _r["rich"] is None, "Linhas sem == (como 'rich') devem ter valor None."
assert "pandas>=2.2" in _r and _r["pandas>=2.2"] is None, "'pandas>=2.2' deve ser chave com valor None."
assert len(_r) == 4, f"Deveriam sobrar 4 pacotes (comentários e linhas vazias ignorados), vieram {len(_r)}."
```

## Estrutura de projetos, pacotes e Git
fonte: Python Packaging User Guide; documentação do Git

### De script a pacote

Um **módulo** é um arquivo `.py`. Um **pacote** é uma pasta com módulos, que pode ter um arquivo `__init__.py` (executado na primeira importação do pacote; pode ficar vazio). Quando o projeto cresce, separe o código por responsabilidade:

```text
meu-app/
├── pyproject.toml
├── README.md
├── .gitignore
├── src/
│   └── meu_app/
│       ├── __init__.py
│       ├── __main__.py       # permite: python -m meu_app
│       ├── modelos.py
│       └── relatorios.py
└── tests/
    ├── test_modelos.py
    └── test_relatorios.py
```

Esse é o **src layout**: o código fica dentro de `src/`, separado dos testes e da configuração. Ele evita um erro clássico: os testes importarem a pasta local por acidente em vez do pacote instalado.

```python nao-executar
# src/meu_app/relatorios.py
from meu_app.modelos import Venda          # import absoluto (preferido)
from .modelos import Venda                 # import relativo, dentro do pacote

# src/meu_app/__init__.py
"""Meu App: relatórios de vendas."""
__version__ = "0.1.0"
```

Lembre-se do idioma `if __name__ == "__main__":`. O código dentro dele só roda quando o arquivo é executado diretamente, e não quando é importado:

```python
def principal():
    print("executando como programa principal")

print("__name__ vale:", __name__)
if __name__ == "__main__":
    principal()
```

### Git: o controle de versões

O **Git** guarda o histórico de todas as versões do seu código. Você pode voltar no tempo, ver quem mudou o quê e trabalhar em paralelo sem estragar a versão que funciona. O **GitHub** (ou GitLab, Codeberg...) hospeda os repositórios na nuvem e facilita a colaboração.

```bash
# Configuração inicial (uma vez por computador)
git config --global user.name "Seu Nome"
git config --global user.email "voce@exemplo.com"

# Começar a versionar um projeto
cd meu-app
git init
git status                  # o que mudou?
git add .                   # prepara (stage) todas as mudanças
git commit -m "Primeira versão do relatório"
git log --oneline           # histórico resumido
git diff                    # o que mudou e ainda não foi preparado
```

| Conceito | O que é |
|---|---|
| repositório | a pasta do projeto com todo o histórico (`.git/`) |
| commit | uma "foto" do projeto com mensagem, autor e data |
| staging (`git add`) | a área onde você escolhe o que entra no próximo commit |
| branch | uma linha de desenvolvimento paralela |
| remote | a cópia do repositório em outro lugar (ex.: GitHub) |
| push / pull | enviar / trazer commits do remote |
| pull request | pedido para revisarem e incorporarem sua branch |

### Branches, GitHub e pull requests

```bash
# Ligar ao GitHub (crie o repositório vazio no site antes)
git remote add origin https://github.com/seu-usuario/meu-app.git
git branch -M main
git push -u origin main

# Trabalhar numa funcionalidade nova sem mexer na main
git switch -c relatorio-mensal     # cria e entra na branch
# ... edita, testa ...
git add src/meu_app/relatorios.py
git commit -m "Adiciona relatório mensal"
git push -u origin relatorio-mensal

# Depois do merge no GitHub, atualizar a main local
git switch main
git pull
```

No GitHub, ao enviar uma branch, aparece o botão **Compare & pull request**. No *pull request* (PR) você descreve a mudança, colegas revisam o código e comentam, e testes automáticos podem rodar (GitHub Actions). Aprovado, alguém faz o **merge** na `main`.

Um `.gitignore` típico de projeto Python:

```text
.venv/
__pycache__/
*.pyc
.pytest_cache/
dist/
build/
*.egg-info/
.env
```

> 💡 Faça commits pequenos e frequentes, com mensagens que expliquem **o que** e **por que** ("Corrige cálculo de juros em meses de 31 dias"), não "mudanças" ou "teste".

> ⚠️ Nunca faça commit de senhas, chaves de API ou arquivos `.env`. Mesmo apagando depois, elas continuam no histórico.

## Desempenho e boas práticas
fonte: documentação dos módulos cProfile, timeit e pstats

> "Otimização prematura é a raiz de todo mal." (Donald Knuth)

A ordem certa é: **1) faça funcionar, 2) faça ficar certo (com testes), 3) só então, se estiver lento de verdade, faça ficar rápido**. E para saber *o que* está lento, **meça**: a intuição sobre gargalos costuma errar.

### Medindo com timeit

```python
import timeit

lista = list(range(10_000))
conjunto = set(lista)

t_lista = timeit.timeit("9_999 in lista", globals=globals(), number=200)
t_conj = timeit.timeit("9_999 in conjunto", globals=globals(), number=200)
print(f"busca na lista:    {t_lista:.5f} s")
print(f"busca no conjunto: {t_conj:.5f} s")
```

### Descobrindo o gargalo com cProfile

O **profiler** conta quantas vezes cada função foi chamada e quanto tempo cada uma gastou:

```python
import cProfile
import pstats
import sys

def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

def relatorio():
    return [fib(i) for i in range(18)]

perfil = cProfile.Profile()
perfil.enable()
relatorio()
perfil.disable()

stats = pstats.Stats(perfil, stream=sys.stdout)
stats.sort_stats("cumulative").print_stats(5)
```

A coluna `ncalls` mostra que `fib` foi chamada milhares de vezes: o problema não é "Python ser lento", é o **algoritmo** recalcular os mesmos valores. Um cache resolve:

```python
from functools import lru_cache
import timeit

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(100))
print(timeit.timeit("fib(25)", globals=globals(), number=1000), "s para 1000 chamadas")
```

No computador: `python -m cProfile -s cumulative meu_script.py`.

### Boas práticas que valem mais que micro-otimizações

| Prática | Por quê |
|---|---|
| Escolha a estrutura de dados certa | `in` num `set`/`dict` é O(1); numa lista é O(n) |
| Use as funções embutidas | `sum`, `max`, `sorted`, `any` são escritas em C |
| Evite repetir trabalho dentro de laços | calcule antes do laço o que não muda |
| Junte strings com `"".join(partes)` | concatenar com `+=` em laço pode ser lento |
| Use geradores para dados grandes | processam um item por vez, sem encher a memória |
| Prefira legibilidade | código claro é mais fácil de otimizar depois |

> 💡 Para cálculos numéricos pesados, a solução profissional costuma ser usar bibliotecas como NumPy, que fazem o trabalho em C.

### Exercício
`tem_duplicatas(lista)` deve devolver `True` se algum elemento aparece mais de uma vez. A versão inicial está correta, mas compara todos os pares (O(n²)) e fica lenta demais para listas grandes. Reescreva-a em O(n) usando um `set`. O teste usa uma lista com milhares de itens e um limite de tempo.

```python inicial
def tem_duplicatas(lista):
    for i in range(len(lista)):
        for j in range(i + 1, len(lista)):
            if lista[i] == lista[j]:
                return True
    return False
```

```python solucao
def tem_duplicatas(lista):
    vistos = set()
    for item in lista:
        if item in vistos:
            return True
        vistos.add(item)
    return False
```

```python teste
import time
assert tem_duplicatas([1, 2, 3, 2]) is True, "tem_duplicatas([1, 2, 3, 2]) deveria dar True."
assert tem_duplicatas([1, 2, 3]) is False, "tem_duplicatas([1, 2, 3]) deveria dar False."
assert tem_duplicatas([]) is False, "Lista vazia não tem duplicatas."
_grande = list(range(2000))
_t0 = time.perf_counter()
_r = tem_duplicatas(_grande)
_dt = time.perf_counter() - _t0
assert _r is False, "Uma lista de números distintos não tem duplicatas."
assert _dt < 0.3, f"Demorou {_dt:.2f} s para 2000 itens: use um set para ficar O(n)."
```

## Trilhas de carreira e bibliotecas
fonte: Python do Zero p. 5; documentação oficial de cada biblioteca

Python é usado em quase toda a área de tecnologia. Depois do básico, você escolhe uma **trilha** e aprende as bibliotecas dela. Os exemplos abaixo usam pacotes externos (instale com `pip` no computador), por isso não rodam neste app: servem para você sentir o "sabor" de cada área.

### Ciência de dados: pandas, NumPy e Matplotlib

Analisar planilhas, limpar dados, calcular estatísticas e fazer gráficos.

```python nao-executar
import pandas as pd
import matplotlib.pyplot as plt

vendas = pd.read_csv("vendas.csv")                # lê uma planilha
print(vendas.head())                              # primeiras linhas
por_mes = vendas.groupby("mes")["valor"].sum()    # total por mês
por_mes.plot(kind="bar", title="Vendas por mês")
plt.show()
```

**Estude**: NumPy (arrays), pandas (DataFrame, `groupby`, `merge`), Matplotlib/Seaborn, estatística básica, SQL, Jupyter Notebook.

### Inteligência artificial e machine learning: scikit-learn e PyTorch

Criar modelos que aprendem com dados: prever preços, classificar imagens, recomendar produtos.

```python nao-executar
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

X, y = load_iris(return_X_y=True)
X_treino, X_teste, y_treino, y_teste = train_test_split(X, y, test_size=0.3)
modelo = DecisionTreeClassifier().fit(X_treino, y_treino)
print("acurácia:", modelo.score(X_teste, y_teste))
```

```python nao-executar
import torch
x = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
camada = torch.nn.Linear(2, 1)      # uma camada de rede neural
print(camada(x))
```

**Estude**: a trilha de ciência de dados primeiro, álgebra linear e probabilidade, scikit-learn (regressão, classificação, validação), depois PyTorch ou TensorFlow, e bibliotecas de LLMs.

### Desenvolvimento web: Django, Flask e FastAPI

Sites, sistemas e APIs que rodam no servidor.

```python nao-executar
# FastAPI: uma API em poucas linhas  (rode com: fastapi dev main.py)
from fastapi import FastAPI

app = FastAPI()

@app.get("/ola/{nome}")
def ola(nome: str):
    return {"mensagem": f"Olá, {nome}!"}
```

```python nao-executar
# Flask: um site mínimo
from flask import Flask
app = Flask(__name__)

@app.route("/")
def inicio():
    return "<h1>Meu primeiro site em Flask</h1>"
```

| Framework | Perfil |
|---|---|
| Django | "baterias incluídas": admin, ORM, login, formulários. Ótimo para sistemas completos. |
| Flask | minimalista e flexível; você escolhe as peças. |
| FastAPI | moderno, focado em APIs, usa type hints e é muito rápido. |

**Estude**: HTTP (métodos, status), HTML/CSS básico, um framework, bancos de dados e SQL, APIs REST e JSON, autenticação, deploy.

### Automação e web scraping: requests, BeautifulSoup, Selenium e Playwright

Scripts que fazem tarefas repetitivas por você: baixar dados, preencher formulários, renomear arquivos, gerar relatórios.

```python nao-executar
import requests
from bs4 import BeautifulSoup

resposta = requests.get("https://example.com", timeout=10)
sopa = BeautifulSoup(resposta.text, "html.parser")
print(sopa.title.text)
for link in sopa.find_all("a"):
    print(link.get("href"))
```

```python nao-executar
# Playwright: controla um navegador de verdade (páginas com JavaScript)
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    navegador = p.chromium.launch()
    pagina = navegador.new_page()
    pagina.goto("https://example.com")
    pagina.screenshot(path="pagina.png")
    navegador.close()
```

**Estude**: `pathlib`, `os`, `shutil`, `csv`, `json` (biblioteca padrão), `requests`, BeautifulSoup, Selenium ou Playwright, agendamento de tarefas, planilhas com `openpyxl`.

> ⚠️ Ao raspar sites, respeite os termos de uso e o arquivo `robots.txt`, e não sobrecarregue o servidor com muitas requisições.

### Jogos: Pygame

```python nao-executar
import pygame

pygame.init()
tela = pygame.display.set_mode((400, 300))
x = 0
rodando = True
while rodando:
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            rodando = False
    tela.fill((30, 30, 60))
    pygame.draw.circle(tela, (255, 200, 0), (x % 400, 150), 20)
    x += 2
    pygame.display.flip()
    pygame.time.Clock().tick(60)
pygame.quit()
```

**Estude**: o laço de jogo (eventos → atualizar → desenhar), coordenadas, colisões, sprites, POO para organizar entidades. Depois, motores como Godot (linguagem parecida com Python).

### Interfaces gráficas (GUI): Tkinter

O Tkinter vem junto com o Python no computador (mas não está disponível neste app).

```python nao-executar
import tkinter as tk

def cumprimentar():
    rotulo["text"] = f"Olá, {entrada.get()}!"

janela = tk.Tk()
janela.title("Saudação")
entrada = tk.Entry(janela)
entrada.pack()
tk.Button(janela, text="OK", command=cumprimentar).pack()
rotulo = tk.Label(janela, text="")
rotulo.pack()
janela.mainloop()
```

**Estude**: widgets e layouts, eventos, depois alternativas como PySide/PyQt, Kivy (inclusive Android) ou Flet.

### Resumo das trilhas

| Trilha | Bibliotecas principais | Primeiro projeto sugerido |
|---|---|---|
| Ciência de dados | pandas, NumPy, Matplotlib | análise de uma planilha pública de dados abertos |
| IA / ML | scikit-learn, PyTorch | prever preços de imóveis |
| Web | Django, Flask, FastAPI | API de lista de tarefas |
| Automação | requests, BeautifulSoup, Playwright | organizador automático da pasta Downloads |
| Jogos | Pygame | jogo da cobrinha |
| GUI | Tkinter, PySide | conversor de moedas com janela |

## Como continuar estudando
fonte: docs.python.org/pt-br; Pense em Python Prefácio

Terminar um curso é o começo. Programadores experientes continuam aprendendo o tempo todo, e a boa notícia é que o ecossistema Python é cheio de material gratuito.

### Documentação oficial (em português!)

- **docs.python.org/pt-br/3/**: a documentação oficial traduzida pela comunidade brasileira.
- **Tutorial** (docs.python.org/pt-br/3/tutorial): ótimo para revisar e aprofundar o que você viu aqui.
- **Referência da biblioteca padrão**: descubra módulos úteis (`itertools`, `collections`, `datetime`, `pathlib`...).
- **Python Packaging User Guide** (packaging.python.org): como distribuir projetos.

> 💡 Ler documentação é uma habilidade. Comece pelos exemplos, depois leia a assinatura da função (parâmetros e valores padrão) e, por fim, os detalhes.

### Comunidades

- **Python Brasil** (python.org.br): grupos regionais (PyLadies, GruPy), eventos e a conferência anual **Python Brasil**.
- **PyLadies**: comunidade que incentiva mulheres na programação, com encontros e mentorias.
- Fóruns: discuss.python.org, Stack Overflow em Português (pt.stackoverflow.com).
- Telegram e Discord de grupos Python: ótimos para tirar dúvidas.

Ao perguntar, mostre o código mínimo que reproduz o problema, a mensagem de erro completa e o que você já tentou.

### Projetos open source

Contribuir com projetos de código aberto ensina a ler código de outras pessoas, usar Git em equipe e receber revisões. Comece pequeno:

1. Procure issues marcadas como `good first issue` no GitHub.
2. Melhore documentação, traduções ou exemplos (a tradução da documentação do Python aceita voluntários!).
3. Leia o arquivo `CONTRIBUTING.md` do projeto antes de abrir um pull request.

### Portfólio no GitHub

Para conseguir o primeiro emprego ou estágio, **mostrar** vale mais do que dizer:

- Publique seus projetos (os do módulo de Projetos são um ótimo começo) com um **README** caprichado: o que faz, como instalar, como usar, uma imagem.
- Inclua testes, siga a PEP 8 e use commits com boas mensagens: recrutadores olham isso.
- Prefira 3 projetos completos e bem feitos a 20 pela metade.
- Crie projetos que resolvam problemas **seus** ou de alguém próximo: são mais interessantes de explicar numa entrevista.

### Hábitos que fazem diferença

| Hábito | Como praticar |
|---|---|
| Praticar um pouco todo dia | desafios em sites como Exercism, Codewars ou Beecrowd |
| Ler código bom | a própria biblioteca padrão é escrita em Python: leia `collections` ou `json` |
| Ensinar | escreva posts, explique para um colega, responda dúvidas em fóruns |
| Revisar fundamentos | releia os quizzes deste app e o Pense em Python |
| Acompanhar novidades | leia o "O que há de novo" (*What's New*) a cada versão do Python |

## Quiz
? Segundo a PEP 8, qual é o nome mais adequado para uma função?
- [ ] CalcularTotal
- [x] calcular_total
- [ ] calcularTotal
- [ ] CALCULAR_TOTAL
> Funções e variáveis usam snake_case; PascalCase é para classes e MAIÚSCULAS para constantes.

? Qual a diferença entre um comentário e uma docstring?
- [ ] Não há diferença
- [ ] A docstring é ignorada pelo Python
- [x] A docstring fica guardada no objeto (`__doc__`) e aparece em `help()`
- [ ] Comentários só podem ter uma linha
> A docstring é uma string na primeira linha da função/classe/módulo; ela vira o atributo `__doc__`.

? Num teste com unittest, o que faz `self.assertRaises(ValueError)` usado com `with`?
- [ ] Lança um ValueError
- [x] Verifica que o bloco lança ValueError; o teste falha se não lançar
- [ ] Ignora qualquer ValueError
- [ ] Converte o erro em aviso
> O teste passa somente se o código dentro do `with` lançar a exceção indicada.

? Qual é a ordem do ciclo do TDD?
- [ ] Código, teste, deploy
- [x] Teste que falha (vermelho), código mínimo que passa (verde), refatorar
- [ ] Refatorar, testar, codificar
- [ ] Escrever toda a aplicação e testar no final
> No TDD o teste vem primeiro: vermelho → verde → refatorar.

? Por que preferir `logging` a `print` em um programa real?
- [ ] Porque `print` é mais lento
- [x] Porque tem níveis, horário e origem, e pode ser filtrado ou desligado sem apagar código
- [ ] Porque `print` não funciona em arquivos `.py`
- [ ] Porque o logging corrige erros sozinho
> Com logging você ajusta o nível (DEBUG, INFO, WARNING...) e o destino (tela, arquivo) em um só lugar.

? Para que serve um ambiente virtual (venv)?
- [ ] Para rodar Python sem instalar
- [ ] Para deixar o programa mais rápido
- [x] Para isolar os pacotes de cada projeto, evitando conflitos de versões
- [ ] Para criar máquinas virtuais
> Cada projeto tem sua própria pasta de pacotes, então versões diferentes não se atrapalham.

? Qual comando recria um ambiente a partir da lista de dependências salva?
- [ ] pip freeze requirements.txt
- [x] pip install -r requirements.txt
- [ ] python -m venv requirements.txt
- [ ] git add requirements.txt
> `pip freeze > requirements.txt` salva; `pip install -r requirements.txt` instala tudo o que está listado.

? Qual sequência envia uma mudança local para o GitHub?
- [ ] git push, git add, git commit
- [ ] git commit, git init, git pull
- [x] git add, git commit, git push
- [ ] git clone, git push, git add
> Primeiro você prepara (`add`), depois registra (`commit`) e por fim envia ao remoto (`push`).

? Seu programa está lento. Qual é o primeiro passo recomendado?
- [ ] Reescrever tudo em C
- [ ] Trocar todos os laços por compreensões
- [x] Medir com um profiler (cProfile) para descobrir onde está o gargalo
- [ ] Remover os testes para ganhar tempo
> Otimizar sem medir costuma atacar a parte errada. Meça primeiro, depois otimize o gargalo real.

? Qual biblioteca é mais associada à análise de dados em tabelas (DataFrames)?
- [ ] Flask
- [x] pandas
- [ ] Pygame
- [ ] BeautifulSoup
> pandas é a base da ciência de dados em Python; Flask é web, Pygame jogos e BeautifulSoup raspagem de HTML.
