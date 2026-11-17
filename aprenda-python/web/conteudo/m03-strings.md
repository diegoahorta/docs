# Strings
id: m03
nivel: Iniciante
icone: 🔤
descricao: Trabalhe com texto: aspas e escapes, índices, fatiamento, os principais métodos de string, comparação, percursos e jogos de palavras.

## O que é uma string
fonte: Python do Zero p. 22; Pense em Python cap. 8.1; Documentação oficial do Python

Uma **string** (tipo `str`) é uma **sequência de caracteres**: letras, dígitos, espaços, pontuação, emojis... Em Python, escrevemos strings entre aspas **simples** ou **duplas**, que funcionam exatamente igual:

```python
a = 'Olá'
b = "Olá"
print(a == b)
print(type(a))
```

Ter dois tipos de aspas é útil quando o texto contém uma delas:

```python
print("Copo d'água")
print('Ele gritou: "Socorro!"')
```

### Sequências de escape

Para colocar dentro da string caracteres especiais ou as próprias aspas, usamos a **barra invertida** `\`, que indica uma **sequência de escape**:

| Escape | Significado |
|---|---|
| `\n` | quebra de linha |
| `\t` | tabulação |
| `\\` | uma barra invertida |
| `\'` | aspas simples |
| `\"` | aspas duplas |
| `\u00e9` | caractere Unicode pelo código (é) |

```python
print("Linha 1\nLinha 2")
print("Nome:\tAna")
print("Copo d\'água e \"aspas\" duplas")
print("C:\\Users\\ana")
print("Caf\u00e9 \u2615")
```

### Strings multilinha

Com **três aspas** (`"""` ou `'''`), a string pode ocupar várias linhas, e as quebras de linha fazem parte do texto:

```python
poema = """Batatinha quando nasce
espalha a rama pelo chão.
Menininha quando dorme
põe a mão no coração."""
print(poema)
```

Strings com três aspas logo no início de funções são usadas como documentação (**docstrings**), como você verá no módulo de funções.

### Strings raw (cruas)

Colocando `r` antes das aspas, as barras invertidas **não** são interpretadas. Isso é muito útil para caminhos do Windows e expressões regulares:

```python
print("C:\novo\teste")    # \n e \t viraram quebra de linha e tab!
print(r"C:\novo\teste")   # raw: exatamente como escrito
```

### A string vazia

`""` é uma string válida, com zero caracteres. Ela é muito usada como ponto de partida para ir construindo um texto aos poucos.

```python
vazia = ""
print(len(vazia))
print(vazia == "")
print(bool(vazia))   # strings vazias são "falsas"
```

> ⚠️ Esquecer de fechar as aspas, ou abrir com um tipo e fechar com outro, causa `SyntaxError`.

```python erro
print("Olá')
```

### Exercício
Escreva um programa que imprima **exatamente** as duas linhas abaixo, usando um **único** `print` com `\n`:

```text
Ele disse: "Copo d'água"
C:\pasta
```

```python inicial
print()
```

```python solucao
print("Ele disse: \"Copo d'água\"\nC:\\pasta")
```

```python teste
linhas = saida.rstrip("\n").split("\n")
assert len(linhas) == 2, f"Esperava 2 linhas, mas vieram {len(linhas)}"
assert linhas[0] == 'Ele disse: "Copo d\'água"', f"1ª linha incorreta: {linhas[0]!r}"
assert linhas[1] == "C:\\pasta", f"2ª linha deveria ser C:\\pasta, mas foi {linhas[1]!r}"
```

## Concatenação e repetição
fonte: Python do Zero p. 22; Pense em Python cap. 2.8

O operador `+` **concatena** (junta) strings, e o `*` **repete** uma string várias vezes:

```python
primeiro = "Maria"
ultimo = "Silva"
completo = primeiro + " " + ultimo
print(completo)

print("ha" * 3)
print("=" * 30)
print(3 * "abc")
```

> ⚠️ O `+` não coloca espaço sozinho: `"a" + "b"` dá `"ab"`. Se quiser espaço, inclua-o você mesmo.

```python
print("a" + "b" + "c")
print("a" + " " + "b" + " " + "c")
print("a", "b", "c")   # o print com vírgulas já separa com espaço
```

### Misturando texto e número

O `+` só junta string com string. Para incluir números, converta com `str()` ou, melhor ainda, use **f-strings**:

```python erro
idade = 20
print("Tenho " + idade + " anos")
```

```python
idade = 20
print("Tenho " + str(idade) + " anos")
print(f"Tenho {idade} anos")
```

E repetição só funciona com **inteiro**:

```python erro
print("-" * 2.5)
```

### Construindo strings aos poucos

Um padrão comum é começar com uma string vazia e ir acrescentando com `+=`:

```python
resultado = ""
resultado += "Py"
resultado += "thon"
resultado += "!" * 3
print(resultado)
```

### Exercício
Escreva a função `moldura(texto)` que retorna o texto cercado por uma moldura de três linhas, feita com `*`, separadas por `\n`. A linha do meio é `* texto *` e as linhas de cima e de baixo têm só asteriscos, com o mesmo comprimento da linha do meio. Exemplo: `moldura("oi")` retorna `"******\n* oi *\n******"`.

```python inicial
def moldura(texto):
    pass
```

```python solucao
def moldura(texto):
    meio = "* " + texto + " *"
    borda = "*" * len(meio)
    return borda + "\n" + meio + "\n" + borda
```

```python teste
r = moldura("oi")
assert r == "******\n* oi *\n******", f"moldura('oi') deveria ser '******\\n* oi *\\n******', mas foi {r!r}"
r = moldura("Python")
assert r == "**********\n* Python *\n**********", f"moldura('Python') retornou {r!r}"
r = moldura("")
assert r == "****\n*  *\n****", f"moldura('') retornou {r!r}"
```

## Índices e len()
fonte: Python do Zero p. 22 e 25; Pense em Python cap. 8.1–8.2

Como uma string é uma **sequência**, cada caractere ocupa uma **posição**, chamada **índice**. Acessamos um caractere com colchetes: `texto[i]`.

> ⚠️ Os índices começam em **0**, não em 1! O primeiro caractere é `texto[0]`.

```text
 caractere:   P   y   t   h   o   n
 índice:      0   1   2   3   4   5
 negativo:   -6  -5  -4  -3  -2  -1
```

```python
linguagem = "Python"
print(linguagem[0])   # P
print(linguagem[1])   # y
print(linguagem[5])   # n
```

### len(): o tamanho da string

A função `len()` retorna o número de caracteres (espaços e pontuação também contam):

```python
print(len("Python"))
print(len("Olá, mundo!"))
print(len(""))
```

Como os índices vão de `0` a `len - 1`, tentar acessar `texto[len(texto)]` causa `IndexError`:

```python erro
linguagem = "Python"
print(linguagem[6])
```

Para pegar o último caractere com `len()`, subtraia 1:

```python
linguagem = "Python"
ultimo = linguagem[len(linguagem) - 1]
print(ultimo)
```

### Índices negativos

Mais prático: índices **negativos** contam a partir do fim. `-1` é o último caractere, `-2` o penúltimo, e assim por diante:

```python
palavra = "banana"
print(palavra[-1])   # a
print(palavra[-2])   # n
print(palavra[-6])   # b (o primeiro)
```

O índice pode ser qualquer **expressão inteira**, mas não um float:

```python
palavra = "abacaxi"
i = 2
print(palavra[i + 1])
print(palavra[len(palavra) // 2])   # caractere do meio
```

```python erro
palavra = "abacaxi"
print(palavra[1.5])
```

### Exercício
Escreva a função `pontas(texto)` que retorna uma string com o **primeiro** e o **último** caractere do texto, juntos. Exemplo: `pontas("Python")` retorna `"Pn"`. Se o texto tiver um caractere só, retorne ele duas vezes (`pontas("a")` → `"aa"`).

```python inicial
def pontas(texto):
    pass
```

```python solucao
def pontas(texto):
    return texto[0] + texto[-1]
```

```python teste
for t, esp in [("Python", "Pn"), ("a", "aa"), ("banana", "ba"), ("Olá!", "O!")]:
    r = pontas(t)
    assert r == esp, f"pontas({t!r}) deveria retornar {esp!r}, mas retornou {r!r}"
```

## Fatiamento
fonte: Python do Zero p. 26; Pense em Python cap. 8.4

Um pedaço de uma string é chamado de **fatia** (*slice*). A sintaxe é `texto[inicio:fim]`: começa no índice `inicio` (**incluído**) e vai até `fim` (**excluído**).

```text
 caractere:   P   y   t   h   o   n
 índice:      0   1   2   3   4   5   6
```

Uma forma de visualizar: pense que os índices apontam para os espaços **entre** os caracteres. `texto[0:2]` pega o que está entre a marca 0 e a marca 2.

```python
s = "Python"
print(s[0:2])    # Py
print(s[2:6])    # thon
print(s[1:4])    # yth
```

### Omitindo início ou fim

- sem `inicio`, a fatia começa do começo;
- sem `fim`, vai até o final;
- sem os dois (`s[:]`), é uma cópia da string inteira.

```python
s = "Python"
print(s[:3])     # Pyt  (os 3 primeiros)
print(s[3:])     # hon  (do índice 3 em diante)
print(s[-3:])    # hon  (os 3 últimos)
print(s[:-1])    # Pytho (tudo menos o último)
print(s[:])      # Python
```

> 💡 Repare que `s[:n] + s[n:]` sempre reconstrói a string original, para qualquer `n`.

Diferente da indexação, fatias **não dão erro** se passarem do tamanho; elas só retornam o que existir. Se `inicio >= fim`, o resultado é a string vazia:

```python
s = "Python"
print(s[2:100])
print(repr(s[4:2]))
print(repr(s[10:]))
```

### O passo: [inicio:fim:passo]

Um terceiro número define o **passo**: de quantos em quantos caracteres andar.

```python
s = "abcdefghij"
print(s[::2])     # acegi: de 2 em 2
print(s[1::2])    # bdfhj: de 2 em 2, começando no 1
print(s[0:6:3])   # ad
```

### Invertendo uma string

Com passo **negativo**, a fatia anda de trás para frente. `s[::-1]` é o jeito clássico de inverter uma string:

```python
s = "Python"
print(s[::-1])
print("roma"[::-1])
print(s[4:1:-1])   # oht: do 4 até o 2, voltando
```

### Exercício
Escreva a função `iniciais_e_final(palavra)` que retorna uma tupla com três fatias da palavra: os **3 primeiros** caracteres, os **2 últimos** e a palavra **invertida**. Exemplo: `iniciais_e_final("abacaxi")` retorna `("aba", "xi", "ixacaba")`.

```python inicial
def iniciais_e_final(palavra):
    pass
```

```python solucao
def iniciais_e_final(palavra):
    return (palavra[:3], palavra[-2:], palavra[::-1])
```

```python teste
for p, esp in [("abacaxi", ("aba", "xi", "ixacaba")), ("Python", ("Pyt", "on", "nohtyP")), ("oi", ("oi", "oi", "io"))]:
    r = iniciais_e_final(p)
    assert r is not None, "A função deve retornar uma tupla"
    assert tuple(r) == esp, f"iniciais_e_final({p!r}) deveria retornar {esp}, mas retornou {r}"
```

## Strings são imutáveis
fonte: Pense em Python cap. 8.5

Uma vez criada, uma string **não pode ser alterada**. Tentar mudar um caractere pelo índice gera `TypeError`:

```python erro
saudacao = "Olá, mundo!"
saudacao[0] = "J"
```

A mensagem diz: `'str' object does not support item assignment` (o objeto str não aceita atribuição de item). Strings são **imutáveis**.

### Então como "modificar" uma string?

Você cria uma **nova** string, com o que quiser, e (se quiser) faz a variável apontar para ela:

```python
saudacao = "Olá, mundo!"
nova = "J" + saudacao[1:]
print(nova)
print(saudacao)    # a original continua igual

saudacao = saudacao.replace("mundo", "Python")
print(saudacao)    # a variável agora aponta para outra string
```

É por isso que **todos os métodos de string retornam uma nova string** e nunca alteram a original. Um erro muito comum é chamar o método e esquecer de guardar o resultado:

```python
nome = "ana"
nome.upper()        # cria "ANA"... e joga fora!
print(nome)         # ana

nome = nome.upper() # agora sim
print(nome)         # ANA
```

> 💡 Imutabilidade parece uma limitação, mas é uma vantagem: você tem certeza de que uma string que passou para uma função não vai ser modificada por ela. Strings também podem ser chaves de dicionário justamente por serem imutáveis.

### Exercício
Escreva a função `trocar_caractere(texto, i, novo)` que retorna uma **nova** string igual a `texto`, mas com o caractere da posição `i` trocado por `novo`. Exemplo: `trocar_caractere("gato", 0, "p")` retorna `"pato"`.

```python inicial
def trocar_caractere(texto, i, novo):
    return texto
```

```python solucao
def trocar_caractere(texto, i, novo):
    return texto[:i] + novo + texto[i + 1:]
```

```python teste
for args, esp in [(("gato", 0, "p"), "pato"), (("gato", 3, "a"), "gata"), (("rato", 1, "i"), "rito"), (("casa", 2, "z"), "caza")]:
    r = trocar_caractere(*args)
    assert r == esp, f"trocar_caractere{args} deveria retornar {esp!r}, mas retornou {r!r}"
```

## Métodos de string (parte 1): maiúsculas, buscas e verificações
fonte: Python do Zero p. 22–25; Pense em Python cap. 8.8; Documentação oficial do Python

Um **método** é uma função que "pertence" a um tipo de dado. Ele é chamado com um **ponto** depois do valor: `texto.upper()`. Já `len()` é uma função comum, que recebe a string entre parênteses: `len(texto)`.

```python
texto = "python é divertido"
print(len(texto))        # função
print(texto.upper())     # método
```

### Maiúsculas e minúsculas

| Método | O que faz | `"olá MUNDO".metodo()` |
|---|---|---|
| `upper()` | tudo maiúsculo | `"OLÁ MUNDO"` |
| `lower()` | tudo minúsculo | `"olá mundo"` |
| `capitalize()` | 1ª letra maiúscula, resto minúsculo | `"Olá mundo"` |
| `title()` | 1ª letra de cada palavra maiúscula | `"Olá Mundo"` |
| `swapcase()` | inverte maiúsculas/minúsculas | `"OLÁ mundo"` |

```python
s = "olá MUNDO"
print(s.upper())
print(s.lower())
print(s.capitalize())
print(s.title())
print(s.swapcase())
```

> 💡 Para comparar textos sem ligar para maiúsculas, converta os dois para minúsculo: `a.lower() == b.lower()`. (Para casos internacionais, `casefold()` é ainda mais robusto.)

### Contando e procurando

| Método | Retorna |
|---|---|
| `count(sub)` | quantas vezes `sub` aparece |
| `find(sub)` | índice da 1ª ocorrência, ou `-1` se não achar |
| `index(sub)` | igual ao `find`, mas dá **erro** se não achar |
| `startswith(sub)` | `True` se começa com `sub` |
| `endswith(sub)` | `True` se termina com `sub` |

```python
frase = "o rato roeu a roupa do rei de roma"
print(frase.count("r"))
print(frase.count("ro"))
print(frase.find("roupa"))
print(frase.find("gato"))        # -1: não encontrou
print(frase.find("r", 5))        # procura a partir do índice 5
print(frase.index("rei"))
print(frase.startswith("o rato"))
print(frase.endswith("roma"))
```

```python erro
frase = "o rato roeu a roupa"
frase.index("gato")    # ValueError: substring not found
```

`endswith` e `startswith` aceitam uma **tupla** de opções, o que é ótimo para verificar extensões de arquivos:

```python
arquivo = "foto.JPG"
print(arquivo.lower().endswith((".jpg", ".png", ".gif")))
```

### Verificando o conteúdo: métodos is...

Todos retornam `True` ou `False` (e `False` para a string vazia):

| Método | `True` se a string... |
|---|---|
| `isalpha()` | tem só letras |
| `isdigit()` | tem só dígitos |
| `isalnum()` | tem só letras e/ou dígitos |
| `islower()` | tem letras e todas são minúsculas |
| `isupper()` | tem letras e todas são maiúsculas |
| `isspace()` | tem só espaços em branco |

```python
print("Python".isalpha(), "Python3".isalpha())
print("2025".isdigit(), "20.5".isdigit(), "-3".isdigit())
print("abc123".isalnum(), "abc 123".isalnum())
print("ola".islower(), "OLA".isupper(), "Ola".isupper())
print("   ".isspace())
```

> ⚠️ `isdigit()` retorna `False` para `"20.5"` e `"-3"`, porque o ponto e o sinal não são dígitos. Para validar números com decimais ou negativos, a forma mais segura é tentar converter com `float()` (você verá `try`/`except` mais adiante).

### Exercício
Escreva a função `senha_forte(senha)` que retorna `True` se a senha tiver **pelo menos 8 caracteres**, **não** for só letras e **não** for só dígitos. Use `len()`, `isalpha()` e `isdigit()`.

```python inicial
def senha_forte(senha):
    pass
```

```python solucao
def senha_forte(senha):
    return len(senha) >= 8 and not senha.isalpha() and not senha.isdigit()
```

```python teste
casos = {"abc12345": True, "python3!": True, "abcdefgh": False, "12345678": False, "ab12": False, "Senha123": True, "": False}
for s, esp in casos.items():
    r = senha_forte(s)
    assert r == esp, f"senha_forte({s!r}) deveria retornar {esp}, mas retornou {r}"
```

## Métodos de string (parte 2): limpar, dividir, juntar e alinhar
fonte: Python do Zero p. 25–26; Pense em Python cap. 10.9; Documentação oficial do Python

### Removendo espaços: strip, lstrip, rstrip

Muito útil para "limpar" texto digitado pelo usuário, que costuma vir com espaços sobrando:

```python
s = "   olá   "
print(repr(s.strip()))    # remove dos dois lados
print(repr(s.lstrip()))   # só da esquerda
print(repr(s.rstrip()))   # só da direita
print("...uau!!!".strip(".!"))   # também remove outros caracteres
```

> 💡 `repr()` mostra a string com aspas, o que deixa os espaços visíveis. Ótimo para depurar.

### Substituindo: replace

`replace(antigo, novo)` troca **todas** as ocorrências. Um terceiro argumento limita quantas trocar:

```python
s = "banana"
print(s.replace("a", "o"))
print(s.replace("a", "o", 1))
print("1.234.567".replace(".", ""))
```

### Dividindo e juntando: split e join

`split()` quebra uma string em uma **lista** de pedaços. Sem argumento, separa por espaços (qualquer quantidade); com argumento, usa o separador indicado:

```python
frase = "Python   é   muito legal"
print(frase.split())

data = "25/12/2025"
dia, mes, ano = data.split("/")
print(dia, mes, ano)

print("a,b,,c".split(","))
```

`join()` faz o contrário: junta uma lista de strings usando a string como **cola**. A sintaxe parece invertida no começo: o separador vem antes do ponto.

```python
palavras = ["Python", "é", "legal"]
print(" ".join(palavras))
print("-".join(palavras))
print("".join(["a", "b", "c"]))
print(", ".join(["maçã", "banana", "uva"]))
```

```python erro
print(", ".join([1, 2, 3]))   # join só junta strings
```

```python
numeros = [1, 2, 3]
print(", ".join(str(n) for n in numeros))
```

### Alinhando: ljust, rjust, center, zfill

Completam a string até um tamanho mínimo, com espaços (ou outro caractere):

```python
print("[" + "oi".ljust(8) + "]")
print("[" + "oi".rjust(8) + "]")
print("[" + "oi".center(8) + "]")
print("[" + "oi".center(8, "*") + "]")
print("42".zfill(5))       # completa com zeros à esquerda
print("-42".zfill(5))      # respeita o sinal
```

### Encadeando métodos

Como cada método retorna uma nova string, dá para chamar um em seguida do outro:

```python
entrada = "   JOÃO da silva   "
print(entrada.strip().title())
print(entrada.strip().lower().replace(" ", "_"))
```

### Resumo dos métodos

| Categoria | Métodos |
|---|---|
| maiúsc./minúsc. | `upper`, `lower`, `capitalize`, `title`, `swapcase` |
| busca | `count`, `find`, `index`, `startswith`, `endswith` |
| verificação | `isalpha`, `isdigit`, `isalnum`, `islower`, `isupper`, `isspace` |
| limpeza | `strip`, `lstrip`, `rstrip`, `replace` |
| divisão | `split`, `join` |
| alinhamento | `ljust`, `rjust`, `center`, `zfill` |

> 💡 Para ver todos os métodos de string, execute `print(dir(str))`, e para a documentação de um método, `help(str.split)`.

### Exercício
Escreva a função `normalizar_nome(nome)` que recebe um nome com espaços sobrando e letras bagunçadas e retorna o nome limpo, com cada palavra iniciando em maiúscula e **apenas um espaço** entre as palavras. Exemplo: `normalizar_nome("  mARIA   da  SILVA ")` retorna `"Maria Da Silva"`. Dica: `split()` sem argumentos e `join()`.

```python inicial
def normalizar_nome(nome):
    return nome
```

```python solucao
def normalizar_nome(nome):
    return " ".join(nome.split()).title()
```

```python teste
for n, esp in [("  mARIA   da  SILVA ", "Maria Da Silva"), ("joão", "João"), ("ANA    PAULA", "Ana Paula"), ("   pedro   ", "Pedro")]:
    r = normalizar_nome(n)
    assert r == esp, f"normalizar_nome({n!r}) deveria retornar {esp!r}, mas retornou {r!r}"
```

## O operador in e comparação de strings
fonte: Pense em Python cap. 8.9–8.10; Documentação oficial do Python

### in e not in

O operador `in` verifica se uma string está **contida** em outra e retorna `True` ou `False`:

```python
print("a" in "banana")
print("nan" in "banana")
print("x" in "banana")
print("x" not in "banana")
print("Py" in "python")   # False: diferencia maiúsculas
```

Combinado com um laço `for`, ele permite escrever funções que leem quase como português. Esta imprime as letras da primeira palavra que também aparecem na segunda:

```python
def em_ambas(palavra1, palavra2):
    for letra in palavra1:
        if letra in palavra2:
            print(letra)

em_ambas("maçãs", "laranjas")
```

### Comparando strings

Os operadores de comparação (`==`, `!=`, `<`, `>`, `<=`, `>=`) funcionam com strings. Igualdade é direta:

```python
senha = "abc123"
print(senha == "abc123")
print(senha == "ABC123")
print(senha != "xyz")
```

`<` e `>` comparam em **ordem lexicográfica** (como num dicionário): o primeiro caractere diferente decide.

```python
print("abacate" < "banana")   # True: 'a' vem antes de 'b'
print("casa" < "caso")        # True: 'a' < 'o' na 4ª letra
print("ar" < "arara")         # True: prefixo vem antes
```

### ord() e chr(): o código de cada caractere

Na verdade, o Python compara o **código numérico** (Unicode) de cada caractere. `ord()` dá o código de um caractere e `chr()` faz o inverso:

```python
print(ord("A"), ord("Z"), ord("a"), ord("z"))
print(ord("0"), ord(" "), ord("é"))
print(chr(65), chr(97), chr(9731))
```

Por isso todas as **maiúsculas vêm antes** das minúsculas, e letras acentuadas vêm depois de todas as letras sem acento:

```python
print("Zebra" < "abacaxi")    # True! 'Z' (90) < 'a' (97)
print("ética" < "zebra")      # False: 'é' (233) > 'z' (122)
print("zebra".lower() < "Abacaxi".lower())   # comparando sem maiúsculas
```

> ⚠️ Para ordenar palavras como um ser humano espera, converta para minúsculas antes de comparar. Acentos exigem cuidados extras (como o módulo `unicodedata` ou `locale`).

### Exercício
Escreva a função `cifra_cesar(texto, n)` que retorna o texto com cada letra **minúscula** de `a` a `z` deslocada `n` posições no alfabeto, voltando ao início depois do `z` (os outros caracteres ficam iguais). Exemplo: `cifra_cesar("abc xyz", 3)` retorna `"def abc"`. Dica: `chr((ord(c) - ord("a") + n) % 26 + ord("a"))`.

```python inicial
def cifra_cesar(texto, n):
    return texto
```

```python solucao
def cifra_cesar(texto, n):
    resultado = ""
    for c in texto:
        if "a" <= c <= "z":
            resultado += chr((ord(c) - ord("a") + n) % 26 + ord("a"))
        else:
            resultado += c
    return resultado
```

```python teste
for args, esp in [(("abc xyz", 3), "def abc"), (("python", 1), "qzuipo"), (("ola, mundo!", 13), "byn, zhaqb!"), (("def", -3), "abc"), (("zz", 27), "aa")]:
    r = cifra_cesar(*args)
    assert r == esp, f"cifra_cesar{args} deveria retornar {esp!r}, mas retornou {r!r}"
```

## Percorrendo strings com for e while
fonte: Pense em Python cap. 8.3 e 8.7

Muitos problemas com texto exigem olhar **um caractere de cada vez**. Esse processo é chamado de **percurso** (*traversal*).

### Com for

O laço `for` percorre a string, entregando um caractere por vez na variável:

```python
for letra in "Python":
    print(letra)
```

Se você também precisa do **índice**, use `enumerate()`:

```python
for i, letra in enumerate("gato"):
    print(i, letra)
```

### Com while

O mesmo percurso com `while` usa um índice que começa em 0 e vai aumentando até `len - 1`:

```python
fruta = "uva"
i = 0
while i < len(fruta):
    print(i, fruta[i])
    i += 1
```

> ⚠️ A condição é `i < len(fruta)`, e não `<=`. Com `<=` o último passo tentaria acessar `fruta[3]` e daria `IndexError`.

### O padrão contador

Para contar quantas vezes algo acontece, criamos uma variável que começa em **0** e é incrementada a cada ocorrência:

```python
palavra = "banana"
contador = 0
for letra in palavra:
    if letra == "a":
        contador += 1
print(contador)
```

### O padrão acumulador

Parecido com o contador, mas acumulando uma **string** (ou uma soma). Aqui construímos uma versão da palavra sem as vogais:

```python
frase = "programar em python"
sem_vogais = ""
for c in frase:
    if c not in "aeiou":
        sem_vogais += c
print(sem_vogais)
```

### O padrão busca

Procurar um caractere e **parar** assim que encontrar, retornando a posição (é basicamente o que o método `find` faz):

```python
def buscar(palavra, letra):
    i = 0
    while i < len(palavra):
        if palavra[i] == letra:
            return i
        i += 1
    return -1

print(buscar("banana", "n"))
print(buscar("banana", "x"))
```

### Exercício
Escreva a função `contar_maiusculas(texto)` que retorna **quantas letras maiúsculas** há no texto, percorrendo-o com um laço e usando o padrão contador. Exemplo: `contar_maiusculas("Olá Mundo PYTHON")` retorna `8`.

```python inicial
def contar_maiusculas(texto):
    contador = 0
    return contador
```

```python solucao
def contar_maiusculas(texto):
    contador = 0
    for c in texto:
        if c.isupper():
            contador += 1
    return contador
```

```python teste
for t, esp in [("Olá Mundo PYTHON", 8), ("abc", 0), ("ABC", 3), ("", 0), ("São Paulo - SP", 4)]:
    r = contar_maiusculas(t)
    assert r == esp, f"contar_maiusculas({t!r}) deveria retornar {esp}, mas retornou {r}"
```

## Estudo de caso: jogos de palavras
fonte: Pense em Python cap. 9

Vamos aplicar tudo o que vimos para resolver pequenos "quebra-cabeças" com palavras. No livro original, as palavras vêm de um arquivo com mais de 100 mil palavras em inglês; aqui usaremos uma lista curta definida no próprio código (você aprenderá a ler arquivos mais adiante).

```python
palavras = ["arara", "banana", "radar", "python", "osso", "abc", "ovo",
            "cinto", "mirtilo", "ritmo", "sopa", "reviver", "almoço", "bijou"]
print(len(palavras), "palavras")
for p in palavras:
    print(p, len(p))
```

### 1. Palíndromos

Um **palíndromo** é uma palavra que se lê igual de trás para frente, como "arara" e "radar". Com fatiamento, o teste é uma linha só:

```python
def eh_palindromo(palavra):
    return palavra == palavra[::-1]

palavras = ["arara", "banana", "radar", "python", "osso", "ovo", "reviver"]
for p in palavras:
    if eh_palindromo(p):
        print(p)
```

Também é possível resolver comparando as pontas com dois índices que se aproximam, uma técnica útil em muitos outros problemas:

```python
def eh_palindromo2(palavra):
    i = 0
    j = len(palavra) - 1
    while i < j:
        if palavra[i] != palavra[j]:
            return False
        i += 1
        j -= 1
    return True

print(eh_palindromo2("radar"), eh_palindromo2("rapaz"))
```

### 2. Contar vogais

```python
def contar_vogais(palavra):
    total = 0
    for letra in palavra.lower():
        if letra in "aeiouáéíóúâêôãõ":
            total += 1
    return total

for p in ["banana", "Python", "almoço"]:
    print(p, contar_vogais(p))
```

### 3. Palavras sem a letra "e"

Em 1939, o escritor Ernest Vincent Wright publicou um romance de mais de 50 mil palavras **sem nenhuma letra "e"**, a mais comum do inglês. Vamos ver quais palavras da nossa lista passariam no teste:

```python
def sem_e(palavra):
    return "e" not in palavra.lower()

palavras = ["arara", "banana", "radar", "python", "reviver", "sopa", "ritmo", "mirtilo"]
aprovadas = 0
for p in palavras:
    if sem_e(p):
        aprovadas += 1
        print(p)
print(f"{aprovadas / len(palavras):.0%} das palavras não têm 'e'")
```

Generalizando: uma função que verifica se a palavra **evita** um conjunto de letras proibidas:

```python
def evita(palavra, proibidas):
    for letra in palavra:
        if letra in proibidas:
            return False
    return True

print(evita("python", "aeiu"))
print(evita("banana", "xyz"))
print(evita("banana", "an"))
```

### 4. Letras em ordem alfabética

Algumas palavras têm todas as letras em **ordem alfabética**, como "abc", "dez" e "bijou". Será que "cinto" também tem? Em vez de conferir de cabeça, vamos deixar o computador comparar cada letra com a seguinte:

```python
def em_ordem(palavra):
    for i in range(len(palavra) - 1):
        if palavra[i] > palavra[i + 1]:
            return False
    return True

for p in ["abc", "cinto", "bijou", "ritmo", "almoço", "dez"]:
    print(p, em_ordem(p))
```

> 💡 Repare no padrão: em todos esses problemas, a função percorre a palavra e **retorna `False` assim que encontra um contraexemplo**; se chegar ao fim sem encontrar, retorna `True`. Isso é chamado de busca com saída antecipada.

### Reduzindo a problemas já resolvidos

Uma lição importante do capítulo: muitos problemas novos são **variações** de problemas já resolvidos. "A palavra usa só letras de um conjunto?" é o mesmo que "toda letra da palavra está no conjunto?":

```python
def usa_apenas(palavra, permitidas):
    for letra in palavra:
        if letra not in permitidas:
            return False
    return True

def usa_todas(palavra, obrigatorias):
    return usa_apenas(obrigatorias, palavra)   # reaproveita a função anterior!

print(usa_apenas("banana", "abn"))
print(usa_todas("cachorro", "aeiou"), usa_todas("aeiou", "aeiou"))
```

### Exercício
Escreva a função `filtrar_palindromos(palavras)` que recebe uma **lista** de palavras e retorna uma **string** com os palíndromos dela, na ordem em que aparecem, separados por vírgula e espaço. A verificação deve **ignorar maiúsculas** (`"Ana"` é palíndromo). Exemplo: `filtrar_palindromos(["Ana", "gato", "radar"])` retorna `"Ana, radar"`.

```python inicial
def filtrar_palindromos(palavras):
    pass
```

```python solucao
def filtrar_palindromos(palavras):
    encontrados = []
    for p in palavras:
        if p.lower() == p.lower()[::-1]:
            encontrados.append(p)
    return ", ".join(encontrados)
```

```python teste
r = filtrar_palindromos(["Ana", "gato", "radar"])
assert r == "Ana, radar", f"Esperava 'Ana, radar', mas veio {r!r}"
r = filtrar_palindromos(["Osso", "banana", "Reviver", "ovo", "python"])
assert r == "Osso, Reviver, ovo", f"Esperava 'Osso, Reviver, ovo', mas veio {r!r}"
r = filtrar_palindromos(["casa", "mesa"])
assert r == "", f"Sem palíndromos, deveria retornar string vazia, mas veio {r!r}"
```

## Quiz
? Qual é o resultado de `"Python"[1]`?
- [ ] P
- [x] y
- [ ] t
- [ ] n
> Os índices começam em 0: `[0]` é "P" e `[1]` é "y".

? Qual é o resultado de `"Python"[-2]`?
- [ ] y
- [ ] n
- [x] o
- [ ] IndexError
> Índices negativos contam do fim: `-1` é "n" e `-2` é "o".

? O que `"programar"[3:6]` retorna?
- [x] "gra"
- [ ] "ogr"
- [ ] "gram"
- [ ] "ram"
> A fatia vai do índice 3 (incluído) ao 6 (excluído): caracteres 3, 4 e 5, ou seja, "g", "r", "a".

? Qual expressão inverte a string `s`?
- [ ] s[-1]
- [ ] s.reverse()
- [x] s[::-1]
- [ ] s[:-1]
> Passo -1 percorre a string de trás para frente. `s[:-1]` retira o último caractere e strings não têm `reverse()`.

? O que acontece ao executar `s = "gato"` e depois `s[0] = "p"`?
- [ ] s passa a ser "pato"
- [x] TypeError, pois strings são imutáveis
- [ ] IndexError
- [ ] Nada acontece
> Strings não podem ser alteradas. Crie uma nova: `s = "p" + s[1:]`.

? Depois de `nome = "ana"` e `nome.upper()`, quanto vale `nome`?
- [x] "ana"
- [ ] "ANA"
- [ ] "Ana"
- [ ] None
> `upper()` retorna uma nova string, mas ela não foi guardada. Seria preciso `nome = nome.upper()`.

? Qual o resultado de `"banana".find("x")`?
- [ ] 0
- [ ] None
- [x] -1
- [ ] ValueError
> `find` retorna -1 quando não encontra. Já `index` geraria `ValueError`.

? O que `"-".join(["a", "b", "c"])` retorna?
- [ ] ["a-b-c"]
- [x] "a-b-c"
- [ ] "-a-b-c-"
- [ ] "abc-"
> `join` cola os itens da lista usando a string antes do ponto como separador.

? Por que `"Zebra" < "abacaxi"` é `True`?
- [ ] Porque "Zebra" é mais curta
- [x] Porque o código Unicode de "Z" (90) é menor que o de "a" (97)
- [ ] Porque Python ignora maiúsculas
- [ ] É False, na verdade
> A comparação usa o código de cada caractere, e todas as maiúsculas têm códigos menores que as minúsculas.

? Qual é o valor de `"Ana Maria".count("a")`?
- [ ] 4
- [x] 3
- [ ] 2
- [ ] 1
> `count` diferencia maiúsculas: há um "a" minúsculo em "Ana" e dois em "Maria", total 3. O "A" maiúsculo não conta.
