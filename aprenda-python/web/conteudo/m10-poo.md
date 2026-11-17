# Programação orientada a objetos
id: m10
nivel: Intermediário
icone: 🏛️
descricao: Crie seus próprios tipos com classes: atributos, métodos, métodos especiais, herança, polimorfismo, propriedades, dataclasses e bons princípios de design.

## Classes e objetos
fonte: Pense em Python cap. 15.1–15.6

Você já usou muitos **tipos** prontos: `int`, `str`, `list`, `dict`. Cada valor é um **objeto** de algum tipo, e o tipo define o que o objeto guarda e o que ele sabe fazer (`"abc".upper()`, `lista.append(4)`).

A **programação orientada a objetos** (POO) permite criar **seus próprios tipos**, chamados **classes**, que juntam **dados** (atributos) e **comportamentos** (métodos) de um conceito do seu programa: um ponto, um aluno, uma conta bancária, uma carta de baralho.

| Termo | Significado | Analogia |
|---|---|---|
| **classe** | o molde, a definição de um novo tipo | a planta de uma casa |
| **objeto** / **instância** | um valor concreto criado a partir da classe | uma casa construída |
| **atributo** | um dado guardado no objeto | cor da casa, número de quartos |
| **método** | uma função que pertence à classe | abrir a porta, acender a luz |
| **instanciar** | criar um objeto a partir da classe | construir uma casa |

### Definindo uma classe

Vamos representar um ponto no plano, como no *Pense em Python*. A definição mais simples possível:

```python
class Ponto:
    """Representa um ponto no plano 2D."""

print(Ponto)            # a classe em si
p = Ponto()             # instanciando: chamamos a classe como uma função
print(p)                # um objeto Ponto, num endereço de memória
print(type(p), isinstance(p, Ponto))
```

> 💡 Por convenção, nomes de classes usam **CamelCase** (`ContaBancaria`, `Ponto`), enquanto funções e variáveis usam `snake_case`.

### Atributos

Você pode guardar valores num objeto usando a **notação de ponto**. Cada instância tem seus próprios atributos:

```python
class Ponto:
    """Representa um ponto no plano 2D."""

branco = Ponto()
branco.x = 3.0
branco.y = 4.0

outro = Ponto()
outro.x = -1.0
outro.y = 0.0

print(branco.x, branco.y, outro.x)
distancia = (branco.x ** 2 + branco.y ** 2) ** 0.5
print("Distância até a origem:", distancia)
print(vars(branco))        # os atributos do objeto, como dicionário
```

### Objetos como argumentos e retornos

Objetos podem ser passados para funções e devolvidos por elas. Um retângulo pode ter um atributo que é **outro objeto** (o canto inferior esquerdo, um `Ponto`):

```python
class Ponto:
    """Ponto no plano."""

class Retangulo:
    """Retângulo com atributos largura, altura e canto (um Ponto)."""

def encontrar_centro(ret):
    c = Ponto()
    c.x = ret.canto.x + ret.largura / 2
    c.y = ret.canto.y + ret.altura / 2
    return c

caixa = Retangulo()
caixa.largura = 100.0
caixa.altura = 200.0
caixa.canto = Ponto()
caixa.canto.x = 0.0
caixa.canto.y = 0.0

centro = encontrar_centro(caixa)
print(centro.x, centro.y)
```

### Objetos são mutáveis (e cuidado com os apelidos)

Uma função pode **alterar** o objeto que recebe, e quem chamou vê a alteração. E, como com listas, atribuir um objeto a outra variável **não copia**: cria um apelido.

```python
import copy

class Ponto:
    """Ponto no plano."""

def mover(p, dx, dy):
    p.x += dx          # modifica o próprio objeto
    p.y += dy

a = Ponto()
a.x, a.y = 1, 2
mover(a, 10, 10)
print(a.x, a.y)        # 11 12

b = a                  # apelido: mesmo objeto
c = copy.copy(a)       # cópia: objeto novo com os mesmos valores
b.x = 0
print(a.x, c.x)        # 0 11
print(a is b, a is c)  # True False
print(a == c)          # False! Por padrão, == compara identidade (veremos como mudar)
```

> ⚠️ `copy.copy` faz uma cópia **rasa**: se o objeto contém outros objetos (como o `canto` do retângulo), a cópia compartilha esses objetos internos. Use `copy.deepcopy` para copiar tudo, recursivamente.

Tentar ler um atributo que não existe gera `AttributeError`. Use `hasattr` ou `getattr` com padrão para verificar:

```python
class Ponto:
    """Ponto no plano."""

p = Ponto()
p.x = 5
print(hasattr(p, "x"), hasattr(p, "z"))
print(getattr(p, "z", "não tem z"))
```

### Exercício
Usando a classe `Ponto` (sem `__init__`, atribuindo `x` e `y` manualmente como nos exemplos), escreva a função `distancia(p1, p2)` que devolve a distância entre dois pontos: √((x2−x1)² + (y2−y1)²). Escreva também `ponto_medio(p1, p2)`, que devolve um **novo** `Ponto` no meio dos dois.

```python inicial
class Ponto:
    """Ponto no plano."""

def distancia(p1, p2):
    pass

def ponto_medio(p1, p2):
    pass
```

```python solucao
import math

class Ponto:
    """Ponto no plano."""

def distancia(p1, p2):
    return math.hypot(p2.x - p1.x, p2.y - p1.y)

def ponto_medio(p1, p2):
    m = Ponto()
    m.x = (p1.x + p2.x) / 2
    m.y = (p1.y + p2.y) / 2
    return m
```

```python teste
_a = Ponto(); _a.x, _a.y = 0, 0
_b = Ponto(); _b.x, _b.y = 3, 4
assert distancia(_a, _b) == 5, f"A distância entre (0, 0) e (3, 4) deveria ser 5, veio {distancia(_a, _b)!r}"
assert distancia(_b, _b) == 0, "A distância de um ponto até ele mesmo é 0"
_m = ponto_medio(_a, _b)
assert isinstance(_m, Ponto), "ponto_medio deveria devolver um objeto Ponto"
assert (_m.x, _m.y) == (1.5, 2.0), f"O ponto médio de (0, 0) e (3, 4) é (1.5, 2.0), veio ({_m.x}, {_m.y})"
assert _m is not _a and _m is not _b, "ponto_medio deve criar um NOVO Ponto"
```

## O método __init__ e o self
fonte: Pense em Python cap. 17.5; Documentação oficial do Python (Tutorial, cap. 9.3)

Atribuir atributos um a um, fora da classe, é trabalhoso e arriscado: é fácil esquecer um. O método especial `__init__` (de *initialize*, "inicializar") é chamado **automaticamente** quando um objeto é criado, e serve para dar valores iniciais aos atributos:

```python
class Ponto:
    """Ponto no plano 2D."""

    def __init__(self, x=0.0, y=0.0):
        self.x = x
        self.y = y

p = Ponto(3, 4)          # o Python chama Ponto.__init__(p, 3, 4)
origem = Ponto()         # usa os valores padrão
print(p.x, p.y, origem.x, origem.y)
```

> 💡 `__init__` tem **dois sublinhados** de cada lado. Métodos com esse formato são chamados de métodos especiais ou *dunder* (*double underscore*). Escrever `_init_` ou `__init` é um erro comum, e o Python não avisa: o método simplesmente nunca é chamado.

### O que é o self?

`self` é o **próprio objeto** que está sendo criado (ou usado). Quando você escreve `Ponto(3, 4)`, o Python cria um objeto vazio e o passa como primeiro argumento do `__init__`. Escrever `self.x = x` significa "guarde no **objeto** um atributo `x` com o valor do **parâmetro** `x`".

```python
class Aluno:
    def __init__(self, nome, curso):
        print("  criando objeto em", hex(id(self)))
        self.nome = nome              # atributo do objeto
        self.curso = curso
        self.notas = []               # atributo com valor inicial fixo

a1 = Aluno("Ana", "Física")
print("a1 está em", hex(id(a1)))     # o mesmo endereço: self ERA a1
a2 = Aluno("Rui", "Letras")
a1.notas.append(9.5)
print(a1.nome, a1.notas, "|", a2.nome, a2.notas)  # cada um tem sua lista
```

> ⚠️ Sem o `self.`, a variável é só **local** ao `__init__` e desaparece no fim do método. `nome = nome` não guarda nada no objeto!

```python erro
class Produto:
    def __init__(self, nome, preco):
        nome = nome         # esqueceu o self.
        self.preco = preco

p = Produto("Caneta", 2.5)
print(p.preco)
print(p.nome)               # AttributeError
```

### Validando no __init__

O `__init__` é o lugar certo para garantir que o objeto já **nasce válido**:

```python
class Retangulo:
    def __init__(self, largura, altura):
        if largura <= 0 or altura <= 0:
            raise ValueError("largura e altura devem ser positivas")
        self.largura = largura
        self.altura = altura

r = Retangulo(3, 2)
print(r.largura * r.altura)
try:
    Retangulo(-1, 5)
except ValueError as e:
    print("Erro:", e)
```

> ⚠️ Nunca use uma lista (ou outro mutável) como **valor padrão** de parâmetro no `__init__` (`def __init__(self, itens=[])`): ela seria compartilhada entre todos os objetos. Use `None` e crie a lista dentro do método.

### Exercício
Crie a classe `Livro` cujo `__init__` recebe `titulo`, `autor` e `paginas` (padrão `0`) e os guarda em atributos de mesmo nome. Todo livro também deve nascer com o atributo `lido` igual a `False`. Se `paginas` for negativo, lance `ValueError`.

```python inicial
class Livro:
    pass
```

```python solucao
class Livro:
    def __init__(self, titulo, autor, paginas=0):
        if paginas < 0:
            raise ValueError("o número de páginas não pode ser negativo")
        self.titulo = titulo
        self.autor = autor
        self.paginas = paginas
        self.lido = False
```

```python teste
l = Livro("Memórias Póstumas de Brás Cubas", "Machado de Assis", 368)
assert l.titulo == "Memórias Póstumas de Brás Cubas", "O atributo titulo não foi guardado corretamente"
assert l.autor == "Machado de Assis", "O atributo autor não foi guardado corretamente"
assert l.paginas == 368, "O atributo paginas deveria ser 368"
assert l.lido is False, "Todo livro deve começar com lido = False"
assert Livro("A", "B").paginas == 0, "O padrão de paginas deveria ser 0"
try:
    Livro("X", "Y", -5)
except ValueError:
    pass
else:
    raise AssertionError("Livro com páginas negativas deveria lançar ValueError")
```

## Métodos de instância
fonte: Pense em Python cap. 16.1–16.4 e 17.1–17.4

Um **método** é uma função definida **dentro** da classe. Ele recebe o objeto como primeiro parâmetro (`self`) e, por isso, pode ler e alterar seus atributos. Métodos expressam o que o objeto **sabe fazer**.

O *Pense em Python* usa uma classe para representar a hora do dia. Primeiro, com funções soltas:

```python
class Tempo:
    def __init__(self, hora=0, minuto=0, segundo=0):
        self.hora = hora
        self.minuto = minuto
        self.segundo = segundo

def imprimir_tempo(t):
    print(f"{t.hora:02d}:{t.minuto:02d}:{t.segundo:02d}")

almoco = Tempo(12, 5)
imprimir_tempo(almoco)
```

Agora transformamos a função num **método**, movendo-a para dentro da classe. A chamada fica `objeto.metodo()`, e o Python passa o objeto como `self` automaticamente:

```python
class Tempo:
    def __init__(self, hora=0, minuto=0, segundo=0):
        self.hora = hora
        self.minuto = minuto
        self.segundo = segundo

    def imprimir(self):
        print(f"{self.hora:02d}:{self.minuto:02d}:{self.segundo:02d}")

    def para_segundos(self):
        return self.hora * 3600 + self.minuto * 60 + self.segundo

almoco = Tempo(12, 5)
almoco.imprimir()                 # forma usual
Tempo.imprimir(almoco)            # equivalente: é isso que o Python faz por baixo
print(almoco.para_segundos())
```

### Funções puras × modificadores

O livro distingue dois estilos de método:

- **puro**: não altera o objeto; devolve um resultado novo (mais fácil de testar e de raciocinar);
- **modificador**: altera o próprio objeto (às vezes mais eficiente).

```python
class Tempo:
    def __init__(self, hora=0, minuto=0, segundo=0):
        self.hora = hora
        self.minuto = minuto
        self.segundo = segundo

    def __str__(self):          # explicado na próxima lição
        return f"{self.hora:02d}:{self.minuto:02d}:{self.segundo:02d}"

    def para_segundos(self):
        return self.hora * 3600 + self.minuto * 60 + self.segundo

    @staticmethod                # método "da classe", sem self: veja mais adiante
    def de_segundos(total):
        minutos, segundo = divmod(total, 60)
        hora, minuto = divmod(minutos, 60)
        return Tempo(hora, minuto, segundo)

    def somar(self, outro):              # PURO: devolve um Tempo novo
        return Tempo.de_segundos(self.para_segundos() + outro.para_segundos())

    def incrementar(self, segundos):     # MODIFICADOR: altera self
        novo = self.para_segundos() + segundos
        self.minuto, self.segundo = divmod(novo, 60)
        self.hora, self.minuto = divmod(self.minuto, 60)

    def depois_de(self, outro):
        return self.para_segundos() > outro.para_segundos()

inicio = Tempo(9, 45, 0)
duracao = Tempo(1, 35, 30)
fim = inicio.somar(duracao)
print("Fim do filme:", fim, "| início continua:", inicio)
inicio.incrementar(90)
print("Início depois de incrementar:", inicio)
print(fim.depois_de(inicio))
```

> 💡 Repare na técnica do livro: converter tudo para **segundos** (um único número), fazer a conta e converter de volta. Isso evita uma série de `if`s para tratar "vai um" nos minutos e nas horas. Os métodos `para_segundos` e `de_segundos` formam a **interface**; como o tempo é guardado por dentro é **implementação**, que pode mudar sem afetar quem usa a classe.

### Métodos chamando métodos

Dentro da classe, um método chama outro com `self.outro_metodo()`. Esquecer o `self.` causa `NameError`:

```python
class Carrinho:
    def __init__(self):
        self.itens = []

    def adicionar(self, nome, preco, qtd=1):
        self.itens.append((nome, preco, qtd))
        return self              # devolver self permite encadear chamadas

    def subtotal(self):
        return sum(preco * qtd for _, preco, qtd in self.itens)

    def total(self, cupom=0):
        return round(self.subtotal() * (1 - cupom / 100), 2)

c = Carrinho().adicionar("livro", 40).adicionar("caneta", 2.5, 4)
print(c.subtotal(), c.total(cupom=10))
```

### Exercício
Complete a classe `Tempo` com dois métodos:

- `para_segundos()`: devolve o total de segundos;
- `somar_segundos(s)`: método **puro** que devolve um **novo** `Tempo` com `s` segundos a mais, normalizado (minutos e segundos entre 0 e 59). Não altere `self`.

Ex.: `Tempo(1, 59, 50).somar_segundos(15)` → um Tempo com `hora=2, minuto=0, segundo=5`.

```python inicial
class Tempo:
    def __init__(self, hora=0, minuto=0, segundo=0):
        self.hora = hora
        self.minuto = minuto
        self.segundo = segundo

    def para_segundos(self):
        pass

    def somar_segundos(self, s):
        self.segundo += s
        return self
```

```python solucao
class Tempo:
    def __init__(self, hora=0, minuto=0, segundo=0):
        self.hora = hora
        self.minuto = minuto
        self.segundo = segundo

    def para_segundos(self):
        return self.hora * 3600 + self.minuto * 60 + self.segundo

    def somar_segundos(self, s):
        total = self.para_segundos() + s
        minutos, segundo = divmod(total, 60)
        hora, minuto = divmod(minutos, 60)
        return Tempo(hora, minuto, segundo)
```

```python teste
t = Tempo(1, 59, 50)
assert t.para_segundos() == 7190, f"Tempo(1, 59, 50).para_segundos() deveria ser 7190, veio {t.para_segundos()!r}"
n = t.somar_segundos(15)
assert isinstance(n, Tempo), "somar_segundos deveria devolver um Tempo"
assert n is not t, "somar_segundos deve devolver um NOVO Tempo (método puro)"
assert (n.hora, n.minuto, n.segundo) == (2, 0, 5), f"Esperava 2:00:05, veio {n.hora}:{n.minuto}:{n.segundo}"
assert (t.hora, t.minuto, t.segundo) == (1, 59, 50), "O Tempo original não deveria mudar"
n2 = Tempo().somar_segundos(3 * 3600 + 61)
assert (n2.hora, n2.minuto, n2.segundo) == (3, 1, 1), "Tempo().somar_segundos(10861) deveria dar 3:01:01"
```

## Métodos especiais: __str__, __repr__ e operadores
fonte: Pense em Python cap. 17.6–17.9; Documentação oficial do Python (Modelo de dados)

Métodos especiais (*dunder*) permitem que seus objetos se integrem à linguagem: funcionem com `print`, `+`, `==`, `<`, `len()`, `in`... O Python os chama **automaticamente** nas situações certas.

### __str__ e __repr__

Por padrão, imprimir um objeto mostra algo pouco útil, como `<__main__.Ponto object at 0x...>`. Dois métodos mudam isso:

| Método | Chamado por | Público-alvo | Objetivo |
|---|---|---|---|
| `__str__` | `print(obj)`, `str(obj)`, f-strings | usuário final | texto legível e amigável |
| `__repr__` | `repr(obj)`, listas, console, depuração | programador | texto **sem ambiguidade**, idealmente código que recria o objeto |

```python
class Ponto:
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y

    def __str__(self):
        return f"({self.x}, {self.y})"

    def __repr__(self):
        return f"Ponto({self.x!r}, {self.y!r})"

p = Ponto(3, 4)
print(p)                  # usa __str__
print(repr(p))            # usa __repr__
print([p, Ponto()])       # listas mostram o __repr__ dos elementos
print(f"Ponto: {p} | {p!r}")
```

> 💡 Se você implementar só um, implemente o `__repr__`: quando não há `__str__`, o Python usa o `__repr__` no lugar. Ambos devem **devolver** uma string (não imprimir!).

### Sobrecarga de operadores

Definindo métodos especiais, você decide o que os operadores fazem com seus objetos. Isso se chama **sobrecarga de operadores**:

| Operador / função | Método especial |
|---|---|
| `a + b` | `a.__add__(b)` |
| `a - b` | `a.__sub__(b)` |
| `a * b` | `a.__mul__(b)` |
| `a == b` | `a.__eq__(b)` |
| `a < b` | `a.__lt__(b)` |
| `a <= b` | `a.__le__(b)` |
| `len(a)` | `a.__len__()` |
| `x in a` | `a.__contains__(x)` |
| `a[i]` | `a.__getitem__(i)` |
| `abs(a)` | `a.__abs__()` |
| `bool(a)` | `a.__bool__()` |

```python
class Dinheiro:
    def __init__(self, centavos):
        self.centavos = centavos

    def __repr__(self):
        return f"R$ {self.centavos / 100:.2f}"

    def __add__(self, outro):
        return Dinheiro(self.centavos + outro.centavos)

    def __mul__(self, fator):           # Dinheiro * número
        return Dinheiro(round(self.centavos * fator))

    def __eq__(self, outro):
        return isinstance(outro, Dinheiro) and self.centavos == outro.centavos

    def __lt__(self, outro):
        return self.centavos < outro.centavos

a = Dinheiro(1050)
b = Dinheiro(399)
print(a + b, a * 3, b * 0.5)
print(a == Dinheiro(1050), a == b, b < a)
print(sorted([a, b, Dinheiro(10)]))     # sorted usa o __lt__
print(max(a, b))
```

> ⚠️ Sem `__eq__`, o `==` compara **identidade** (se é o mesmo objeto), como o `is`. Dois objetos com os mesmos dados seriam considerados diferentes.

### __len__, __contains__ e __getitem__

Esses métodos fazem seu objeto se comportar como uma coleção:

```python
class Playlist:
    def __init__(self, nome):
        self.nome = nome
        self.musicas = []

    def adicionar(self, musica):
        self.musicas.append(musica)

    def __len__(self):
        return len(self.musicas)

    def __contains__(self, musica):
        return musica in self.musicas

    def __getitem__(self, i):
        return self.musicas[i]

    def __bool__(self):
        return len(self) > 0

p = Playlist("Estudo")
print(bool(p))                     # False: vazia
for m in ["Aquarela", "Garota de Ipanema", "Asa Branca"]:
    p.adicionar(m)
print(len(p), "Asa Branca" in p, p[0], p[-1])
for musica in p:                   # __getitem__ também permite o for!
    print("-", musica)
```

### Despacho por tipo e __radd__

E se quisermos somar um `Tempo` com outro `Tempo` **ou** com um número de segundos? O método pode verificar o tipo do argumento (*despacho por tipo*, cap. 17.8 do livro). Para que `5 + objeto` também funcione, definimos `__radd__` (*right add*), chamado quando o objeto está à **direita** do `+`:

```python
class Tempo:
    def __init__(self, segundos=0):
        self.segundos = segundos

    def __repr__(self):
        return f"Tempo({self.segundos}s)"

    def __add__(self, outro):
        if isinstance(outro, Tempo):
            return Tempo(self.segundos + outro.segundos)
        if isinstance(outro, (int, float)):
            return Tempo(self.segundos + outro)
        return NotImplemented          # avisa o Python: "não sei somar isso"

    __radd__ = __add__                 # a soma é comutativa

t = Tempo(100)
print(t + Tempo(20), t + 5, 5 + t)
print(sum([Tempo(10), Tempo(20), Tempo(30)]))   # sum começa com 0 + ...
```

### Exercício
Crie a classe `Vetor` (2D) com:

- `__init__(self, x, y)`;
- `__repr__` devolvendo exatamente `"Vetor(x, y)"` (ex.: `Vetor(1, 2)`);
- `__add__` e `__sub__` que devolvem um **novo** `Vetor`;
- `__mul__` com um número (multiplica as duas coordenadas);
- `__eq__` (iguais se `x` e `y` forem iguais);
- `__abs__` devolvendo o comprimento (√(x² + y²)).

```python inicial
class Vetor:
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

```python solucao
import math

class Vetor:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Vetor({self.x}, {self.y})"

    def __add__(self, outro):
        return Vetor(self.x + outro.x, self.y + outro.y)

    def __sub__(self, outro):
        return Vetor(self.x - outro.x, self.y - outro.y)

    def __mul__(self, k):
        return Vetor(self.x * k, self.y * k)

    def __eq__(self, outro):
        return isinstance(outro, Vetor) and (self.x, self.y) == (outro.x, outro.y)

    def __abs__(self):
        return math.hypot(self.x, self.y)
```

```python teste
a, b = Vetor(1, 2), Vetor(3, 5)
assert repr(a) == "Vetor(1, 2)", f"repr(Vetor(1, 2)) deveria ser 'Vetor(1, 2)', veio {repr(a)!r}"
assert a + b == Vetor(4, 7), f"Vetor(1, 2) + Vetor(3, 5) deveria ser Vetor(4, 7), veio {a + b!r}"
assert b - a == Vetor(2, 3), "Vetor(3, 5) - Vetor(1, 2) deveria ser Vetor(2, 3)"
assert a * 3 == Vetor(3, 6), "Vetor(1, 2) * 3 deveria ser Vetor(3, 6)"
assert Vetor(1, 2) != Vetor(2, 1), "Vetor(1, 2) e Vetor(2, 1) devem ser diferentes"
assert abs(Vetor(3, 4)) == 5, "abs(Vetor(3, 4)) deveria ser 5"
assert (a.x, a.y) == (1, 2), "A soma não deve alterar os vetores originais"
```

## Herança e super()
fonte: Pense em Python cap. 18.1–18.8

**Herança** é a capacidade de definir uma nova classe que é uma **versão modificada** de uma classe existente. A classe nova (**filha** ou subclasse) herda todos os atributos e métodos da classe **pai** (superclasse) e pode **acrescentar** coisas novas ou **sobrescrever** (*override*) as existentes.

A herança modela a relação **"é um"**: um cachorro **é um** animal; um gerente **é um** funcionário.

```python
class Animal:
    def __init__(self, nome):
        self.nome = nome

    def falar(self):
        return "..."

    def apresentar(self):
        return f"{self.nome} diz: {self.falar()}"

class Cachorro(Animal):           # Cachorro herda de Animal
    def falar(self):              # sobrescreve
        return "Au au!"

class Gato(Animal):
    def falar(self):
        return "Miau"

for bicho in [Cachorro("Rex"), Gato("Mimi"), Animal("Genérico")]:
    print(bicho.apresentar())     # apresentar foi herdado

print(isinstance(Cachorro("x"), Animal), issubclass(Gato, Animal))
```

### super(): reaproveitando o método da classe pai

Quando a filha sobrescreve um método mas quer **aproveitar** o comportamento do pai, ela chama `super().metodo(...)`. O caso mais comum é o `__init__`: a filha recebe dados extras, mas deixa o pai inicializar a parte comum.

```python
class Funcionario:
    def __init__(self, nome, salario):
        self.nome = nome
        self.salario = salario

    def bonus(self):
        return self.salario * 0.10

    def __repr__(self):
        return f"{type(self).__name__}({self.nome!r}, salário={self.salario})"

class Gerente(Funcionario):
    def __init__(self, nome, salario, setor):
        super().__init__(nome, salario)   # o pai cuida de nome e salário
        self.setor = setor                # a filha acrescenta o setor

    def bonus(self):
        return super().bonus() + 1000     # bônus do pai + extra

equipe = [Funcionario("Lia", 4000), Gerente("Rui", 9000, "TI")]
for f in equipe:
    print(f, "-> bônus:", f.bonus())
print(equipe[1].setor)
```

> ⚠️ Se a filha define `__init__` e **esquece** de chamar `super().__init__(...)`, os atributos criados pelo pai não existem, e o erro (`AttributeError`) só aparece quando algum método herdado tenta usá-los.

### Exemplo do livro: cartas, baralho e mão

O *Pense em Python* modela um baralho. Cada `Carta` tem um naipe e um valor, guardados como inteiros; as **listas de nomes** são **atributos de classe**, compartilhados por todas as cartas (veremos mais sobre eles adiante). As cartas são comparadas primeiro pelo naipe e depois pelo valor, usando tuplas:

```python
import random

class Carta:
    nomes_naipes = ["Paus", "Ouros", "Copas", "Espadas"]
    nomes_valores = [None, "Ás", "2", "3", "4", "5", "6", "7",
                     "8", "9", "10", "Valete", "Dama", "Rei"]

    def __init__(self, naipe=0, valor=2):
        self.naipe = naipe
        self.valor = valor

    def __str__(self):
        return f"{Carta.nomes_valores[self.valor]} de {Carta.nomes_naipes[self.naipe]}"

    def __lt__(self, outra):
        return (self.naipe, self.valor) < (outra.naipe, outra.valor)

class Baralho:
    def __init__(self):
        self.cartas = [Carta(n, v) for n in range(4) for v in range(1, 14)]

    def __str__(self):
        return ", ".join(str(c) for c in self.cartas)

    def __len__(self):
        return len(self.cartas)

    def retirar_carta(self):
        return self.cartas.pop()

    def adicionar_carta(self, carta):
        self.cartas.append(carta)

    def embaralhar(self):
        random.shuffle(self.cartas)

    def mover_cartas(self, outra, quantidade):
        for _ in range(quantidade):
            outra.adicionar_carta(self.retirar_carta())

class Mao(Baralho):
    """Uma mão de cartas: é um Baralho que começa vazio e tem um rótulo."""

    def __init__(self, rotulo=""):
        self.cartas = []          # sobrescreve: não cria as 52 cartas
        self.rotulo = rotulo

random.seed(7)
baralho = Baralho()
baralho.embaralhar()
mao = Mao("Jogador 1")
baralho.mover_cartas(mao, 5)       # mover_cartas é herdado de Baralho
mao.cartas.sort()                  # funciona graças ao __lt__ da Carta
print(mao.rotulo, "->", mao)
print("Restam no baralho:", len(baralho))
```

A classe `Mao` herda `adicionar_carta`, `retirar_carta`, `embaralhar`, `__len__` e `__str__` de `Baralho` sem escrever nenhum deles: herança é **reaproveitamento de código**.

### Exercício
Dada a classe `Conta`, crie a subclasse `ContaPoupanca`:

- seu `__init__` recebe `titular`, `saldo` e `taxa` (juros mensais, ex.: `0.01` = 1%) e usa `super().__init__` para os dois primeiros;
- tem o método `render_juros()`, que soma ao saldo os juros (`saldo * taxa`) e devolve o novo saldo;
- sobrescreve `descricao()` para devolver a descrição do pai seguida de `" (poupança)"` (use `super()`).

```python inicial
class Conta:
    def __init__(self, titular, saldo=0):
        self.titular = titular
        self.saldo = saldo

    def descricao(self):
        return f"{self.titular}: R$ {self.saldo:.2f}"

class ContaPoupanca:
    pass
```

```python solucao
class Conta:
    def __init__(self, titular, saldo=0):
        self.titular = titular
        self.saldo = saldo

    def descricao(self):
        return f"{self.titular}: R$ {self.saldo:.2f}"

class ContaPoupanca(Conta):
    def __init__(self, titular, saldo=0, taxa=0.005):
        super().__init__(titular, saldo)
        self.taxa = taxa

    def render_juros(self):
        self.saldo += self.saldo * self.taxa
        return self.saldo

    def descricao(self):
        return super().descricao() + " (poupança)"
```

```python teste
p = ContaPoupanca("Ana", 1000, 0.01)
assert isinstance(p, Conta), "ContaPoupanca deve herdar de Conta"
assert p.titular == "Ana" and p.saldo == 1000, "titular e saldo devem ser guardados (use super().__init__)"
assert p.taxa == 0.01, "A taxa deve ser guardada no atributo taxa"
r = p.render_juros()
assert abs(r - 1010) < 1e-9 and abs(p.saldo - 1010) < 1e-9, f"Depois de render 1% sobre 1000 o saldo deveria ser 1010, veio {p.saldo}"
assert p.descricao() == "Ana: R$ 1010.00 (poupança)", f"descricao() deveria ser 'Ana: R$ 1010.00 (poupança)', veio {p.descricao()!r}"
assert Conta("Rui", 5).descricao() == "Rui: R$ 5.00", "A classe Conta não deve mudar"
```

## Polimorfismo e duck typing
fonte: Pense em Python cap. 17.9; Documentação oficial do Python (Glossário: duck typing)

**Polimorfismo** ("muitas formas") é a capacidade de um mesmo código funcionar com objetos de **tipos diferentes**. Se várias classes têm um método com o mesmo nome, você pode chamá-lo sem se importar com o tipo exato de cada objeto:

```python
import math

class Circulo:
    def __init__(self, raio):
        self.raio = raio
    def area(self):
        return math.pi * self.raio ** 2
    def nome(self):
        return "círculo"

class Retangulo:
    def __init__(self, largura, altura):
        self.largura, self.altura = largura, altura
    def area(self):
        return self.largura * self.altura
    def nome(self):
        return "retângulo"

formas = [Circulo(1), Retangulo(2, 3), Circulo(0.5)]
for f in formas:
    print(f"{f.nome():<10} área = {f.area():.2f}")     # cada um calcula do seu jeito
print("Maior:", max(formas, key=lambda f: f.area()).nome())
```

O laço não tem nenhum `if tipo == ...`: cada objeto sabe calcular a própria área. Para acrescentar um triângulo, basta criar a classe; o laço continua igual.

### Duck typing

Repare que `Circulo` e `Retangulo` **não têm uma classe pai em comum**. Em Python isso não é necessário: o que importa é o objeto **ter os métodos** usados. Esse é o *duck typing*: "se anda como um pato e grasna como um pato, então é um pato".

As funções embutidas usam duck typing o tempo todo. `sum` funciona com qualquer coisa que suporte `+`; `len` com qualquer coisa que tenha `__len__`; o `for` com qualquer coisa **iterável**:

```python
def histograma(sequencia):
    contagem = {}
    for item in sequencia:          # qualquer iterável serve
        contagem[item] = contagem.get(item, 0) + 1
    return contagem

print(histograma("banana"))                    # str
print(histograma([1, 2, 1, 1]))                # list
print(histograma((True, False, True)))         # tuple
print(histograma(range(3)))                    # range
```

```python
class Pato:
    def falar(self):
        return "Quack!"

class Pessoa:
    def falar(self):
        return "Eu imito um pato: quack!"

class Robo:
    def falar(self):
        return "BIP. QUACK. BIP."

def fazer_falar(coisa):
    print(coisa.falar())   # não pergunta o tipo: só chama o método

for c in [Pato(), Pessoa(), Robo()]:
    fazer_falar(c)
```

> 💡 Duck typing combina com o estilo EAFP do módulo anterior: em vez de checar `isinstance` antes, você usa o objeto e, se ele não tiver o método, trata o `AttributeError`, ou deixa o erro aparecer.

### Classes abstratas: quando você quer um contrato explícito

Às vezes é útil **obrigar** as subclasses a implementarem certos métodos. O módulo `abc` (*Abstract Base Classes*) permite isso: uma classe abstrata não pode ser instanciada, e uma subclasse que esquece um método abstrato também não.

```python
from abc import ABC, abstractmethod

class Forma(ABC):
    @abstractmethod
    def area(self):
        """Toda forma deve saber calcular sua área."""

    def descrever(self):                  # método concreto, herdado
        return f"{type(self).__name__} com área {self.area():.1f}"

class Quadrado(Forma):
    def __init__(self, lado):
        self.lado = lado
    def area(self):
        return self.lado ** 2

print(Quadrado(3).descrever())
try:
    Forma()
except TypeError as e:
    print("Erro:", e)
```

### Exercício
Crie as classes `Quadrado(lado)` e `Circulo(raio)`, cada uma com o método `area()`. Depois escreva a função polimórfica `area_total(formas)`, que soma as áreas de **qualquer** lista de objetos que tenham o método `area()`, e devolve o resultado arredondado com `round(..., 2)`.

```python inicial
import math

class Quadrado:
    def __init__(self, lado):
        self.lado = lado

class Circulo:
    def __init__(self, raio):
        self.raio = raio

def area_total(formas):
    total = 0
    for f in formas:
        if isinstance(f, Quadrado):
            total += f.lado ** 2
    return total
```

```python solucao
import math

class Quadrado:
    def __init__(self, lado):
        self.lado = lado
    def area(self):
        return self.lado ** 2

class Circulo:
    def __init__(self, raio):
        self.raio = raio
    def area(self):
        return math.pi * self.raio ** 2

def area_total(formas):
    return round(sum(f.area() for f in formas), 2)
```

```python teste
assert Quadrado(3).area() == 9, "Quadrado(3).area() deveria ser 9"
assert round(Circulo(1).area(), 4) == 3.1416, "Circulo(1).area() deveria ser π"
assert area_total([Quadrado(2), Circulo(1)]) == 7.14, f"Área total de Quadrado(2) e Circulo(1) deveria ser 7.14, veio {area_total([Quadrado(2), Circulo(1)])}"
class _Triangulo:
    def __init__(self, b, h): self.b, self.h = b, h
    def area(self): return self.b * self.h / 2
assert area_total([_Triangulo(4, 3), Quadrado(1)]) == 7, "area_total deve funcionar com QUALQUER objeto que tenha area() (duck typing)"
assert area_total([]) == 0, "Com lista vazia a área total é 0"
```

## Encapsulamento e @property
fonte: Pense em Python cap. 17.10 e 18.9; Documentação oficial do Python (property)

**Encapsular** é esconder os detalhes internos de um objeto e expor uma **interface** controlada. Quem usa a classe não deveria precisar saber (nem poder bagunçar) como ela guarda seus dados por dentro.

### A convenção do sublinhado

Python não tem atributos verdadeiramente privados. Em vez disso, usa **convenções**:

| Nome | Significado |
|---|---|
| `saldo` | público: pode usar à vontade |
| `_saldo` | "interno": não mexa de fora da classe (é só um aviso, funciona) |
| `__saldo` | *name mangling*: o Python renomeia para `_Classe__saldo`, dificultando acesso acidental e conflitos em subclasses |

```python
class Termometro:
    def __init__(self):
        self._leituras = []       # detalhe interno
        self.__segredo = 42       # vira _Termometro__segredo

    def registrar(self, valor):
        self._leituras.append(valor)

    def media(self):
        return sum(self._leituras) / len(self._leituras)

t = Termometro()
t.registrar(20); t.registrar(24)
print(t.media())
print(t._leituras)                # funciona, mas é "falta de educação"
print(hasattr(t, "__segredo"), t._Termometro__segredo)
```

> 💡 "Somos todos adultos aqui": a filosofia do Python é avisar com o `_` e confiar no programador. Use `__dois_sublinhados` só quando precisar evitar conflito de nomes com subclasses.

### @property: atributos com controle

E se quisermos que, ao mudar um atributo, o valor seja **validado**? Em outras linguagens se escrevem métodos `get_saldo()`/`set_saldo()`. Em Python usamos `@property`: um método que é **acessado como atributo**.

```python
class Produto:
    def __init__(self, nome, preco):
        self.nome = nome
        self.preco = preco            # já passa pelo setter abaixo!

    @property
    def preco(self):                  # getter: obj.preco
        return self._preco

    @preco.setter
    def preco(self, valor):           # setter: obj.preco = valor
        if not isinstance(valor, (int, float)):
            raise TypeError("preço deve ser numérico")
        if valor < 0:
            raise ValueError("preço não pode ser negativo")
        self._preco = valor

p = Produto("Café", 18.9)
print(p.preco)              # parece atributo, mas chama o getter
p.preco = 21.5              # chama o setter, que valida
print(p.preco)
try:
    p.preco = -3
except ValueError as e:
    print("Recusado:", e)
try:
    Produto("Chá", -1)      # a validação também vale na criação
except ValueError as e:
    print("Recusado:", e)
```

### Propriedades calculadas e somente leitura

Uma propriedade sem setter é **somente leitura**. É ótimo para valores **derivados** de outros atributos, que assim nunca ficam desatualizados:

```python
class Retangulo:
    def __init__(self, largura, altura):
        self.largura = largura
        self.altura = altura

    @property
    def area(self):
        return self.largura * self.altura

    @property
    def eh_quadrado(self):
        return self.largura == self.altura

r = Retangulo(3, 4)
print(r.area, r.eh_quadrado)      # sem parênteses!
r.largura = 4
print(r.area, r.eh_quadrado)      # recalculado automaticamente
try:
    r.area = 100
except AttributeError as e:
    print("Erro:", e)
```

> 💡 Uma grande vantagem: você pode começar com um atributo simples e público e, **mais tarde**, transformá-lo em property com validação, sem mudar uma linha do código de quem usa a classe.

### Exercício
Crie a classe `Temperatura`:

- `__init__(self, celsius=0)`;
- propriedade `celsius` com setter que lança `ValueError` se o valor for menor que `-273.15` (zero absoluto);
- propriedade `fahrenheit` (F = C × 9/5 + 32) com setter que converte e guarda em celsius (C = (F − 32) × 5/9), passando pela mesma validação.

```python inicial
class Temperatura:
    def __init__(self, celsius=0):
        self.celsius = celsius
```

```python solucao
class Temperatura:
    def __init__(self, celsius=0):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, valor):
        if valor < -273.15:
            raise ValueError("abaixo do zero absoluto")
        self._celsius = valor

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, valor):
        self.celsius = (valor - 32) * 5 / 9
```

```python teste
t = Temperatura(100)
assert t.celsius == 100, "Temperatura(100).celsius deveria ser 100"
assert t.fahrenheit == 212, f"100 °C deveria ser 212 °F, veio {t.fahrenheit!r}"
t.fahrenheit = 32
assert abs(t.celsius) < 1e-9, f"Depois de t.fahrenheit = 32, celsius deveria ser 0, veio {t.celsius}"
for _ruim in [-300, -273.16]:
    try:
        Temperatura(_ruim)
    except ValueError:
        pass
    else:
        raise AssertionError(f"Temperatura({_ruim}) deveria lançar ValueError")
try:
    t.fahrenheit = -1000
except ValueError:
    pass
else:
    raise AssertionError("t.fahrenheit = -1000 está abaixo do zero absoluto: deveria lançar ValueError")
assert isinstance(type(t).__dict__.get("celsius"), property), "celsius deve ser uma @property"
```

## Atributos de classe, @classmethod e @staticmethod
fonte: Pense em Python cap. 18.2; Documentação oficial do Python (Tutorial, cap. 9.3.5)

### Atributos de instância × atributos de classe

Até agora, os atributos eram de **instância** (`self.nome`): cada objeto tem o seu. Um atributo de **classe** é definido no corpo da classe, fora dos métodos, e é **compartilhado** por todas as instâncias, como as listas de nomes da classe `Carta`:

```python
class Pedido:
    taxa_entrega = 7.0          # atributo de classe: igual para todos
    total_criados = 0

    def __init__(self, valor):
        self.valor = valor      # atributo de instância
        Pedido.total_criados += 1

    def total(self):
        return self.valor + self.taxa_entrega   # busca na instância, depois na classe

p1, p2 = Pedido(50), Pedido(30)
print(p1.total(), p2.total(), Pedido.total_criados)
Pedido.taxa_entrega = 10.0      # muda para TODOS
print(p1.total(), p2.total())
```

> ⚠️ Atribuir **pela instância** (`p1.taxa_entrega = 0`) não muda o atributo da classe: cria um atributo de instância novo que "esconde" o da classe só naquele objeto. E cuidado com atributos de classe **mutáveis** (listas, dicionários): alterá-los com `append` afeta todas as instâncias.

```python
class Turma:
    alunos = []                   # armadilha: lista compartilhada!
    def __init__(self, nome):
        self.nome = nome
    def matricular(self, aluno):
        self.alunos.append(aluno)

a, b = Turma("A"), Turma("B")
a.matricular("Ana")
print(b.alunos)                   # ['Ana'] ... na turma B também!
```

### @classmethod: métodos que recebem a classe

Um **método de classe** recebe a **classe** (por convenção, `cls`) em vez da instância. O uso mais comum é criar **construtores alternativos**: outras formas de criar um objeto.

```python
class Data:
    def __init__(self, dia, mes, ano):
        self.dia, self.mes, self.ano = dia, mes, ano

    def __repr__(self):
        return f"Data({self.dia}, {self.mes}, {self.ano})"

    @classmethod
    def de_texto(cls, texto):            # "25/12/2025"
        dia, mes, ano = (int(p) for p in texto.split("/"))
        return cls(dia, mes, ano)        # cls é Data (ou uma subclasse)

    @classmethod
    def de_iso(cls, texto):              # "2025-12-25"
        ano, mes, dia = (int(p) for p in texto.split("-"))
        return cls(dia, mes, ano)

print(Data(1, 1, 2025))
print(Data.de_texto("25/12/2025"))
print(Data.de_iso("2024-02-29"))
```

> 💡 Usar `cls(...)` em vez de `Data(...)` faz com que, numa subclasse, o construtor alternativo crie um objeto da **subclasse**. A biblioteca padrão faz muito isso: `dict.fromkeys`, `datetime.fromisoformat`, `int.from_bytes`.

### @staticmethod: funções que moram na classe

Um **método estático** não recebe nem a instância nem a classe: é uma função comum, colocada dentro da classe porque tem relação com ela.

```python
class Data:
    def __init__(self, dia, mes, ano):
        if not Data.eh_valida(dia, mes, ano):
            raise ValueError(f"data inválida: {dia}/{mes}/{ano}")
        self.dia, self.mes, self.ano = dia, mes, ano

    @staticmethod
    def eh_bissexto(ano):
        return ano % 4 == 0 and (ano % 100 != 0 or ano % 400 == 0)

    @staticmethod
    def eh_valida(dia, mes, ano):
        dias = [31, 29 if Data.eh_bissexto(ano) else 28, 31, 30, 31, 30,
                31, 31, 30, 31, 30, 31]
        return 1 <= mes <= 12 and 1 <= dia <= dias[mes - 1]

print(Data.eh_bissexto(2024), Data.eh_bissexto(1900), Data.eh_bissexto(2000))
print(Data.eh_valida(29, 2, 2023))
try:
    Data(31, 4, 2025)
except ValueError as e:
    print(e)
```

| Tipo de método | Primeiro parâmetro | Acessa | Uso típico |
|---|---|---|---|
| de instância | `self` (o objeto) | dados do objeto e da classe | a maioria dos métodos |
| `@classmethod` | `cls` (a classe) | dados da classe | construtores alternativos, contadores |
| `@staticmethod` | nenhum | só seus parâmetros | funções utilitárias relacionadas |

### Exercício
Crie a classe `Fracao` com:

- `__init__(self, num, den)` que lança `ZeroDivisionError` se `den` for 0;
- um `@staticmethod` `mdc(a, b)` que calcula o máximo divisor comum (pode usar `math.gcd`);
- um `@classmethod` `de_texto(cls, texto)` que cria a fração a partir de `"3/4"`;
- um método `simplificada()` que devolve uma **nova** `Fracao` simplificada (divida numerador e denominador pelo mdc);
- o atributo de classe `criadas`, que conta quantas frações já foram criadas (incremente no `__init__`).

```python inicial
class Fracao:
    def __init__(self, num, den):
        self.num = num
        self.den = den
```

```python solucao
import math

class Fracao:
    criadas = 0

    def __init__(self, num, den):
        if den == 0:
            raise ZeroDivisionError("denominador zero")
        self.num = num
        self.den = den
        Fracao.criadas += 1

    @staticmethod
    def mdc(a, b):
        return math.gcd(a, b)

    @classmethod
    def de_texto(cls, texto):
        num, den = texto.split("/")
        return cls(int(num), int(den))

    def simplificada(self):
        m = Fracao.mdc(self.num, self.den)
        return Fracao(self.num // m, self.den // m)
```

```python teste
assert Fracao.mdc(12, 18) == 6, "Fracao.mdc(12, 18) deveria ser 6 (chamado pela classe, sem instância)"
f = Fracao.de_texto("6/8")
assert isinstance(f, Fracao) and (f.num, f.den) == (6, 8), "Fracao.de_texto('6/8') deveria criar Fracao(6, 8)"
s = f.simplificada()
assert (s.num, s.den) == (3, 4), f"6/8 simplificada deveria ser 3/4, veio {s.num}/{s.den}"
assert (f.num, f.den) == (6, 8), "simplificada() não deve alterar a fração original"
antes = Fracao.criadas
Fracao(1, 2); Fracao(2, 3)
assert Fracao.criadas == antes + 2, "O atributo de classe criadas deveria aumentar 1 a cada fração criada"
try:
    Fracao(1, 0)
except ZeroDivisionError:
    pass
else:
    raise AssertionError("Fracao(1, 0) deveria lançar ZeroDivisionError")
```

## Dataclasses
fonte: Documentação oficial do Python (dataclasses)

Muitas classes servem principalmente para **guardar dados**. Para elas, escrever `__init__`, `__repr__` e `__eq__` à mão é repetitivo. O decorador `@dataclass` gera esses métodos automaticamente a partir das **anotações de tipo** dos atributos:

```python
from dataclasses import dataclass

@dataclass
class Ponto:
    x: float
    y: float = 0.0          # valor padrão

p = Ponto(3, 4)
print(p)                    # __repr__ gerado: Ponto(x=3, y=4)
print(p == Ponto(3, 4))     # __eq__ gerado: compara os campos
print(Ponto(1))
p.x = 10                    # continua sendo um objeto normal
print(p.x)
```

Equivalente "à mão", que você deixa de escrever:

```python
class PontoManual:
    def __init__(self, x, y=0.0):
        self.x = x
        self.y = y
    def __repr__(self):
        return f"PontoManual(x={self.x!r}, y={self.y!r})"
    def __eq__(self, outro):
        return isinstance(outro, PontoManual) and (self.x, self.y) == (outro.x, outro.y)

print(PontoManual(3, 4), PontoManual(3, 4) == PontoManual(3, 4))
```

> ⚠️ As anotações (`x: float`) **não** são verificadas em tempo de execução: `Ponto("a", "b")` funciona. Elas documentam a intenção e são usadas por editores e ferramentas como o *mypy*.

### Métodos, padrões mutáveis e validação

Uma dataclass é uma classe comum: pode ter métodos e propriedades. Para valores padrão **mutáveis**, use `field(default_factory=...)`, e para validar, o método `__post_init__`, chamado logo depois do `__init__` gerado:

```python
from dataclasses import dataclass, field

@dataclass
class Item:
    nome: str
    preco: float
    quantidade: int = 1
    tags: list[str] = field(default_factory=list)   # lista nova para cada item

    def __post_init__(self):
        if self.preco < 0:
            raise ValueError("preço negativo")

    def total(self):
        return self.preco * self.quantidade

a = Item("caneta", 2.5, 4)
b = Item("caderno", 15.0, tags=["escola"])
a.tags.append("promoção")
print(a, a.total())
print(b.tags)              # não foi afetado pela lista de a
try:
    Item("erro", -1)
except ValueError as e:
    print("Erro:", e)
```

### Opções úteis: order, frozen

```python
from dataclasses import dataclass, asdict, replace

@dataclass(order=True)          # gera <, <=, >, >= comparando os campos em ordem
class Versao:
    maior: int
    menor: int
    correcao: int = 0

print(sorted([Versao(2, 0), Versao(1, 9, 3), Versao(1, 10)]))
print(Versao(3, 1) > Versao(3, 0, 9))

@dataclass(frozen=True)         # imutável: atribuição gera erro; pode ser chave de dict
class Coordenada:
    lat: float
    lon: float

recife = Coordenada(-8.05, -34.9)
print({recife: "Recife"})
try:
    recife.lat = 0
except Exception as e:
    print(type(e).__name__, "->", e)
print(replace(recife, lon=-35.0))     # cria uma cópia alterada
print(asdict(recife))                 # converte para dict (ótimo para JSON!)
```

| Quando usar | Escolha |
|---|---|
| Registro simples, imutável, leve | `namedtuple` ou `@dataclass(frozen=True)` |
| Dados com alguns métodos, padrões, validação | `@dataclass` |
| Comportamento complexo, invariantes, encapsulamento | classe comum |

### Exercício
Crie a dataclass `Produto` com os campos `nome: str`, `preco: float` e `estoque: int = 0`, e:

- o método `valor_em_estoque()` que devolve `preco * estoque`;
- um `__post_init__` que lança `ValueError` se `preco` ou `estoque` forem negativos.

```python inicial
class Produto:
    pass
```

```python solucao
from dataclasses import dataclass

@dataclass
class Produto:
    nome: str
    preco: float
    estoque: int = 0

    def __post_init__(self):
        if self.preco < 0 or self.estoque < 0:
            raise ValueError("preço e estoque não podem ser negativos")

    def valor_em_estoque(self):
        return self.preco * self.estoque
```

```python teste
import dataclasses as _dc
assert _dc.is_dataclass(Produto), "Produto deve ser uma dataclass (use @dataclass)"
p = Produto("Caneta", 2.5, 10)
assert repr(p) == "Produto(nome='Caneta', preco=2.5, estoque=10)", f"repr inesperado: {p!r}"
assert p == Produto("Caneta", 2.5, 10), "Dois produtos com os mesmos campos devem ser iguais"
assert Produto("Lápis", 1.0).estoque == 0, "O estoque padrão deveria ser 0"
assert p.valor_em_estoque() == 25, "valor_em_estoque() de Caneta (2.5 × 10) deveria ser 25"
for _args in [("X", -1, 1), ("Y", 1, -1)]:
    try:
        Produto(*_args)
    except ValueError:
        pass
    else:
        raise AssertionError(f"Produto{_args} deveria lançar ValueError")
```

## Composição, herança e bons princípios de design
fonte: Pense em Python cap. 18.8–18.11; Documentação oficial do Python

Herança é poderosa, mas não é a única forma de reaproveitar código, e muitas vezes não é a melhor. A alternativa é a **composição**: um objeto **contém** outros objetos e delega trabalho a eles.

| Relação | Pergunta | Ferramenta | Exemplo |
|---|---|---|---|
| "é um" | A **é um tipo de** B? | herança | Gerente é um Funcionário |
| "tem um" | A **tem / usa** um B? | composição | Carro tem um Motor; Conta tem um Histórico |

```python
class Motor:
    def __init__(self, potencia):
        self.potencia = potencia
        self.ligado = False
    def ligar(self):
        self.ligado = True

class Carro:
    def __init__(self, modelo, potencia):
        self.modelo = modelo
        self.motor = Motor(potencia)      # composição: Carro TEM um Motor
    def dar_partida(self):
        self.motor.ligar()                # delega ao motor
        return f"{self.modelo} ligado ({self.motor.potencia} cv)"

print(Carro("Fusca", 65).dar_partida())
```

Herdar `Carro` de `Motor` não faria sentido: um carro **não é** um motor. Um sinal clássico de herança mal usada é a subclasse ter que "desligar" métodos herdados que não fazem sentido para ela.

> 💡 Regra prática muito citada: **prefira composição a herança**. Use herança quando a relação "é um" for verdadeira e a subclasse puder ser usada em qualquer lugar onde a classe pai é esperada.

### Responsabilidade única

O **princípio da responsabilidade única** diz que cada classe deve ter **um motivo só para mudar**: cuidar de uma única coisa. Uma classe `Relatorio` que calcula totais, formata em HTML **e** envia e-mail tem três responsabilidades; mudar o layout do e-mail obrigaria a mexer na mesma classe dos cálculos.

### Exemplo completo: ContaBancaria

Vamos juntar tudo: encapsulamento com property, validação, exceção personalizada e composição (a conta **tem um** histórico de transações, cada transação é uma dataclass).

```python
from dataclasses import dataclass
from datetime import datetime

class SaldoInsuficienteError(Exception):
    pass

@dataclass(frozen=True)
class Transacao:
    tipo: str
    valor: float
    momento: datetime

class Historico:
    """Responsabilidade única: guardar e consultar transações."""
    def __init__(self):
        self._transacoes = []
    def registrar(self, tipo, valor):
        self._transacoes.append(Transacao(tipo, valor, datetime(2025, 1, 1)))
    def __len__(self):
        return len(self._transacoes)
    def __iter__(self):
        return iter(self._transacoes)

class ContaBancaria:
    def __init__(self, titular, saldo_inicial=0.0):
        self.titular = titular
        self._saldo = 0.0
        self.historico = Historico()          # composição
        if saldo_inicial:
            self.depositar(saldo_inicial)

    @property
    def saldo(self):                          # somente leitura
        return self._saldo

    @staticmethod
    def _validar(valor):
        if not isinstance(valor, (int, float)) or valor <= 0:
            raise ValueError(f"valor deve ser um número positivo: {valor!r}")

    def depositar(self, valor):
        self._validar(valor)
        self._saldo += valor
        self.historico.registrar("depósito", valor)

    def sacar(self, valor):
        self._validar(valor)
        if valor > self._saldo:
            raise SaldoInsuficienteError(f"saldo {self._saldo:.2f} < {valor:.2f}")
        self._saldo -= valor
        self.historico.registrar("saque", valor)

    def transferir(self, destino, valor):
        self.sacar(valor)              # se falhar, nada é depositado
        destino.depositar(valor)

    def __repr__(self):
        return f"ContaBancaria({self.titular!r}, saldo={self._saldo:.2f})"

ana = ContaBancaria("Ana", 500)
rui = ContaBancaria("Rui")
ana.transferir(rui, 120)
ana.sacar(30)
print(ana, rui)
for t in ana.historico:
    print(f"  {t.tipo:<9} {t.valor:>8.2f}")
for operacao in [lambda: rui.sacar(1000), lambda: ana.depositar(-5)]:
    try:
        operacao()
    except (SaldoInsuficienteError, ValueError) as e:
        print("Recusado:", type(e).__name__, e)
try:
    ana.saldo = 1_000_000
except AttributeError:
    print("Ninguém altera o saldo diretamente!")
```

Repare nas decisões de design:

- o saldo só muda por `depositar`/`sacar`, que validam e registram: **o objeto nunca fica num estado inválido** (essa garantia chama-se **invariante**);
- `Historico` cuida só do histórico; `ContaBancaria` cuida só das regras da conta;
- `transferir` **reaproveita** `sacar` e `depositar`, em vez de duplicar a lógica;
- os erros são **exceções**, e quem usa a classe decide como tratá-los.

### Exercício
Usando **composição**, crie a classe `Carrinho`, que **tem** uma lista interna de itens (`self._itens`, cada item é uma tupla `(nome, preco, qtd)`), e:

- `adicionar(nome, preco, qtd=1)`: lança `ValueError` se `preco < 0` ou `qtd <= 0`;
- `remover(nome)`: remove o item com esse nome; se não existir, lança `KeyError`;
- a propriedade somente leitura `total` (soma de preço × quantidade);
- `__len__` devolvendo a **quantidade total de unidades** (soma das quantidades).

```python inicial
class Carrinho(list):
    pass
```

```python solucao
class Carrinho:
    def __init__(self):
        self._itens = []

    def adicionar(self, nome, preco, qtd=1):
        if preco < 0 or qtd <= 0:
            raise ValueError("preço deve ser >= 0 e quantidade > 0")
        self._itens.append((nome, preco, qtd))

    def remover(self, nome):
        for i, (n, _, _) in enumerate(self._itens):
            if n == nome:
                del self._itens[i]
                return
        raise KeyError(nome)

    @property
    def total(self):
        return sum(preco * qtd for _, preco, qtd in self._itens)

    def __len__(self):
        return sum(qtd for _, _, qtd in self._itens)
```

```python teste
c = Carrinho()
assert not isinstance(c, list), "Use composição (um atributo com a lista), não herança de list"
c.adicionar("caneta", 2.5, 4)
c.adicionar("caderno", 20)
assert c.total == 30, f"Total esperado 30 (2.5×4 + 20), veio {c.total!r}"
assert len(c) == 5, f"len deveria ser 5 unidades, veio {len(c)}"
c.remover("caneta")
assert c.total == 20 and len(c) == 1, "Depois de remover 'caneta' sobram 20 reais e 1 unidade"
try:
    c.remover("borracha")
except KeyError:
    pass
else:
    raise AssertionError("Remover item inexistente deveria lançar KeyError")
for _args in [("x", -1, 1), ("y", 1, 0)]:
    try:
        c.adicionar(*_args)
    except ValueError:
        pass
    else:
        raise AssertionError(f"adicionar{_args} deveria lançar ValueError")
try:
    c.total = 0
except AttributeError:
    pass
else:
    raise AssertionError("total deve ser uma propriedade somente leitura")
```

## Quiz
? Qual é a diferença entre classe e objeto?
- [ ] São sinônimos
- [x] A classe é o molde (o tipo); o objeto é uma instância concreta criada a partir dela
- [ ] O objeto define a classe
- [ ] Classes guardam dados e objetos guardam funções
> Uma classe define atributos e métodos; cada chamada `Classe(...)` cria um novo objeto (instância) com seus próprios dados.

? O que representa o parâmetro `self` num método?
- [ ] A classe
- [x] O próprio objeto sobre o qual o método foi chamado
- [ ] O módulo atual
- [ ] Uma palavra reservada sem significado
> Em `obj.metodo()`, o Python passa `obj` como primeiro argumento, que por convenção se chama `self`.

? Quando o método `__init__` é executado?
- [ ] Quando o programa termina
- [ ] Só quando chamado explicitamente com obj.__init__()
- [x] Automaticamente, toda vez que um novo objeto da classe é criado
- [ ] Quando o objeto é impresso
> `__init__` inicializa os atributos do objeto logo após sua criação.

? O que `print(obj)` usa para mostrar um objeto?
- [x] O método `__str__` (ou `__repr__`, se não houver `__str__`)
- [ ] Sempre o `__repr__`
- [ ] O `__init__`
- [ ] O `__len__`
> `print` e `str()` chamam `__str__`; na ausência dele, o Python usa `__repr__`.

? Que método especial é chamado em `a + b`?
- [ ] `__plus__`
- [x] `__add__`
- [ ] `__sum__`
- [ ] `__concat__`
> `a + b` vira `a.__add__(b)`. Se não funcionar, o Python tenta `b.__radd__(a)`.

? Para que serve `super().__init__(...)` numa subclasse?
- [ ] Cria uma nova classe pai
- [x] Executa o `__init__` da classe pai, para inicializar a parte herdada
- [ ] Impede a herança
- [ ] Apaga os atributos do pai
> Assim a subclasse reaproveita a inicialização do pai e só acrescenta o que é dela.

? O que é duck typing?
- [ ] Uma forma de herança múltipla
- [x] Usar um objeto pelo que ele sabe fazer (seus métodos), sem exigir um tipo específico
- [ ] Converter tipos automaticamente
- [ ] Uma biblioteca de testes
> "Se grasna como um pato, é um pato": qualquer objeto com os métodos necessários serve.

? O que `@property` permite?
- [ ] Criar atributos de classe
- [ ] Tornar um atributo verdadeiramente privado
- [x] Acessar um método como se fosse atributo, podendo validar no setter
- [ ] Copiar objetos
> Com `@property` (e `@x.setter`), `obj.x` e `obj.x = valor` chamam métodos, permitindo cálculo e validação.

? Qual é o uso típico de um `@classmethod`?
- [ ] Acessar atributos de instância
- [x] Construtores alternativos, como `Data.de_texto("25/12/2025")`
- [ ] Deixar o método mais rápido
- [ ] Definir métodos privados
> Ele recebe a classe (`cls`) e pode criar instâncias dela de outras formas.

? Um carro tem um motor. Qual a relação mais adequada entre as classes Carro e Motor?
- [ ] Carro herda de Motor
- [ ] Motor herda de Carro
- [x] Composição: Carro tem um atributo que é um Motor
- [ ] Nenhuma relação
> Relação "tem um" pede composição; herança é para "é um".
