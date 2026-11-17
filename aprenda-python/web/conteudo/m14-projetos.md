# Projetos práticos
id: m14
nivel: Projetos
icone: 🏆
descricao: Oito projetos guiados que juntam tudo o que você aprendeu: decomposição de problemas, funções, coleções, arquivos, POO e exceções.

## Projeto 1: Jogo de adivinhação
fonte: Pense em Python cap. 7 e 13.2; Python do Zero

### Objetivo
O computador sorteia um número de 1 a 50 e o jogador tenta adivinhar. A cada palpite, o programa diz se o número secreto é maior ou menor. O jogador tem um número limitado de tentativas.

### Conceitos usados
`random.randint`, `input`, conversão com `int()`, `try/except ValueError`, laço `for` com `break`, condicionais e `else` de laço.

### Passo a passo do raciocínio
Antes de escrever código, quebre o problema em perguntas menores:

1. **Como sortear o número?** `random.randint(1, 50)` inclui as duas pontas.
2. **Como repetir os palpites com limite?** Um `for tentativa in range(1, MAX + 1)`.
3. **Como ler um palpite com segurança?** `input()` devolve texto; `int()` pode falhar, então use `try/except`.
4. **Como comparar?** Três casos: igual (fim do jogo), menor ou maior.
5. **Como saber se perdeu?** O `else` do `for` só roda se o laço terminar **sem** `break`.

> 💡 Comece pela versão mais simples que funciona (sortear e comparar uma vez) e vá acrescentando: limite de tentativas, validação da entrada, mensagens. É o **desenvolvimento incremental**.

### Código completo
Execute e jogue (no app, cada `input()` abre uma caixa de diálogo):

```python
import random

MIN, MAX = 1, 50
TENTATIVAS = 6

secreto = random.randint(MIN, MAX)       # sorteia o número
print(f"Pensei num número de {MIN} a {MAX}. Você tem {TENTATIVAS} tentativas.")

for tentativa in range(1, TENTATIVAS + 1):
    texto = input(f"Tentativa {tentativa}: ")
    try:
        palpite = int(texto)              # pode lançar ValueError
    except ValueError:
        print("Isso não é um número inteiro. Tentativa perdida!")
        continue

    if palpite == secreto:
        print(f"🎉 Acertou em {tentativa} tentativa(s)!")
        break
    elif palpite < secreto:
        print("O número secreto é MAIOR.")
    else:
        print("O número secreto é MENOR.")
else:
    # só executa se o for terminou sem break (não acertou)
    print(f"Fim de jogo! O número era {secreto}.")
```

Um programa que só conversa por `input()` é difícil de testar. Separar a **lógica** (comparar) da **interface** (ler e imprimir) resolve isso. Veja um "jogador automático" que usa busca binária e sempre acerta em no máximo 6 tentativas:

```python
import random

def dica(palpite, secreto):
    """Devolve -1 se o secreto é menor, 1 se é maior e 0 se acertou."""
    if palpite == secreto:
        return 0
    return 1 if secreto > palpite else -1


def jogador_automatico(secreto, minimo=1, maximo=50):
    tentativas = 0
    while True:
        tentativas += 1
        chute = (minimo + maximo) // 2        # sempre o meio do intervalo
        resposta = dica(chute, secreto)
        print(f"  chute {chute}")
        if resposta == 0:
            return tentativas
        if resposta > 0:
            minimo = chute + 1
        else:
            maximo = chute - 1


secreto = random.randint(1, 50)
print("Secreto:", secreto)
print("Acertou em", jogador_automatico(secreto), "tentativas")
```

### Sugestões de melhorias
- Níveis de dificuldade (fácil 1–20, difícil 1–100) que mudam `MAX` e `TENTATIVAS`.
- Avisar "está quente" quando o palpite estiver a até 3 do número.
- Guardar o recorde (menor número de tentativas) num arquivo.
- Perguntar "Jogar de novo? (s/n)" num laço externo.

### Exercício
Separe a lógica do jogo numa função testável. Escreva `avaliar_palpite(palpite, secreto)` que devolve exatamente:

- `"Acertou!"` se `palpite == secreto`;
- `"Muito baixo!"` se o palpite for menor que o secreto;
- `"Muito alto!"` se o palpite for maior que o secreto.

```python inicial
def avaliar_palpite(palpite, secreto):
    if palpite == secreto:
        return "Acertou!"
    return "Muito baixo!"
```

```python solucao
def avaliar_palpite(palpite, secreto):
    if palpite == secreto:
        return "Acertou!"
    if palpite < secreto:
        return "Muito baixo!"
    return "Muito alto!"
```

```python teste
assert avaliar_palpite(10, 10) == "Acertou!", "avaliar_palpite(10, 10) deveria ser 'Acertou!'."
assert avaliar_palpite(3, 10) == "Muito baixo!", "avaliar_palpite(3, 10) deveria ser 'Muito baixo!'."
assert avaliar_palpite(42, 10) == "Muito alto!", "avaliar_palpite(42, 10) deveria ser 'Muito alto!'."
assert avaliar_palpite(1, 50) == "Muito baixo!", "avaliar_palpite(1, 50) deveria ser 'Muito baixo!'."
```

## Projeto 2: Calculadora com funções e tratamento de erros
fonte: Pense em Python cap. 3, 6 e 14; Python do Zero

### Objetivo
Uma calculadora que entende expressões simples como `"12 * 3"` ou `"2 ** 10"` e que **nunca quebra**: entradas inválidas geram mensagens amigáveis em vez de tracebacks.

### Conceitos usados
Funções, dicionário de funções, `str.split`, `float()`, exceções (`ValueError`, `ZeroDivisionError`), `raise`, f-strings.

### Passo a passo do raciocínio
1. **Uma função por operação**: `somar`, `subtrair`... (cada uma pequena e fácil de testar).
2. **Como escolher a operação sem um `if` gigante?** Um dicionário que associa o símbolo à função: `{"+": somar, ...}`.
3. **Como transformar `"12 * 3"` em partes?** `texto.split()` dá `["12", "*", "3"]`.
4. **Quais erros podem acontecer?** Número de partes errado, número inválido, operador desconhecido, divisão por zero. Cada um vira uma exceção tratada.
5. **Onde tratar os erros?** A função `calcular` **lança** exceções; a interface (o laço que imprime) **trata** e mostra a mensagem.

### Código completo

```python
def somar(a, b):
    return a + b

def subtrair(a, b):
    return a - b

def multiplicar(a, b):
    return a * b

def dividir(a, b):
    if b == 0:
        raise ZeroDivisionError("divisão por zero")
    return a / b

def potencia(a, b):
    return a ** b

# Associa cada símbolo à função que faz a conta
OPERACOES = {"+": somar, "-": subtrair, "*": multiplicar, "/": dividir, "**": potencia}


def calcular(a, operador, b):
    """Aplica o operador aos números a e b."""
    if operador not in OPERACOES:
        raise ValueError(f"operador desconhecido: {operador!r}")
    return OPERACOES[operador](a, b)


def interpretar(expressao):
    """Transforma '12 * 3' em (12.0, '*', 3.0)."""
    partes = expressao.split()
    if len(partes) != 3:
        raise ValueError("use o formato: número operador número (com espaços)")
    a, operador, b = partes
    try:
        return float(a), operador, float(b)
    except ValueError:
        raise ValueError(f"número inválido em {expressao!r}") from None


def executar(expressao):
    try:
        a, op, b = interpretar(expressao)
        resultado = calcular(a, op, b)
    except ZeroDivisionError:
        print(f"{expressao:>12}  →  erro: não é possível dividir por zero")
    except ValueError as erro:
        print(f"{expressao:>12}  →  erro: {erro}")
    else:
        print(f"{expressao:>12}  =  {resultado:g}")


for exp in ["12 * 3", "7 / 2", "2 ** 10", "10 - 25", "5 / 0", "3 % 2", "dez + 1", "4+4"]:
    executar(exp)
```

Para usar de forma interativa, troque o `for` final por um laço com `input()`:

```python nao-executar
while True:
    exp = input("Expressão (ou 'sair'): ")
    if exp == "sair":
        break
    executar(exp)
```

### Sugestões de melhorias
- Guardar o último resultado numa variável `ans` que pode ser usada na próxima conta.
- Aceitar expressões sem espaços (`4+4`), percorrendo a string caractere a caractere.
- Adicionar raiz quadrada, porcentagem e histórico das contas.
- Escrever testes com `unittest` para cada operação.

### Exercício
Escreva `calcular_texto(expressao)` que recebe uma string como `"8 / 2"` e **devolve** (não imprime) o resultado como `float`. Em caso de problema, devolva exatamente uma destas strings:

- `"Erro: formato inválido"` se a expressão não tiver 3 partes separadas por espaço;
- `"Erro: número inválido"` se algum número não puder ser convertido;
- `"Erro: operador inválido"` se o operador não for `+`, `-`, `*` ou `/`;
- `"Erro: divisão por zero"` se dividir por zero.

```python inicial
def calcular_texto(expressao):
    a, op, b = expressao.split()
    return eval(expressao)
```

```python solucao
def calcular_texto(expressao):
    partes = expressao.split()
    if len(partes) != 3:
        return "Erro: formato inválido"
    a, op, b = partes
    try:
        a, b = float(a), float(b)
    except ValueError:
        return "Erro: número inválido"
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        if b == 0:
            return "Erro: divisão por zero"
        return a / b
    return "Erro: operador inválido"
```

```python teste
assert calcular_texto("8 / 2") == 4.0, "calcular_texto('8 / 2') deveria devolver 4.0."
assert calcular_texto("1.5 + 2") == 3.5, "calcular_texto('1.5 + 2') deveria devolver 3.5."
assert calcular_texto("3 * -2") == -6.0, "calcular_texto('3 * -2') deveria devolver -6.0."
assert calcular_texto("5 / 0") == "Erro: divisão por zero", "Divisão por zero deveria devolver 'Erro: divisão por zero'."
assert calcular_texto("2 ^ 3") == "Erro: operador inválido", "O operador ^ deveria dar 'Erro: operador inválido'."
assert calcular_texto("dois + 3") == "Erro: número inválido", "'dois' não é número: deveria dar 'Erro: número inválido'."
assert calcular_texto("4+4") == "Erro: formato inválido", "'4+4' (sem espaços) deveria dar 'Erro: formato inválido'."
assert calcular_texto("") == "Erro: formato inválido", "Texto vazio deveria dar 'Erro: formato inválido'."
```

## Projeto 3: Analisador de texto
fonte: Pense em Python cap. 9 e 13 (estudo de caso: análise de frequência de palavras)

### Objetivo
Receber um texto e produzir estatísticas: número de palavras, palavras distintas, frequência de cada palavra, as mais comuns, tamanho médio das palavras e número de frases.

### Conceitos usados
Métodos de string (`lower`, `split`, `strip`, `translate`), `string.punctuation`, dicionários como contadores, `sorted` com `key`, `collections.Counter`, funções pequenas e reutilizáveis.

### Passo a passo do raciocínio
1. **Normalizar**: deixar tudo minúsculo e remover pontuação, para que `"Casa,"` e `"casa"` contem como a mesma palavra.
2. **Separar em palavras**: `split()` sem argumentos separa por qualquer espaço em branco.
3. **Contar**: um dicionário `{palavra: contagem}` (o "histograma" do Pense em Python).
4. **Ordenar**: `sorted(freq.items(), key=..., reverse=True)` para achar as mais comuns.
5. **Juntar tudo** numa função `relatorio` que só chama as outras.

### Código completo

```python
import string
from collections import Counter

TEXTO = """
Python é uma linguagem de programação. Python é simples, mas Python é poderosa!
Programação é resolver problemas; uma linguagem é só a ferramenta.
Quem aprende Python aprende a pensar como programador.
"""

# Tabela que apaga a pontuação (usada por str.translate)
SEM_PONTUACAO = str.maketrans("", "", string.punctuation)


def palavras(texto):
    """Devolve a lista de palavras do texto, minúsculas e sem pontuação."""
    return texto.lower().translate(SEM_PONTUACAO).split()


def frequencias(lista):
    """Conta quantas vezes cada palavra aparece (dicionário como contador)."""
    freq = {}
    for p in lista:
        freq[p] = freq.get(p, 0) + 1
    return freq


def mais_comuns(freq, n=5):
    """As n palavras mais frequentes; empates em ordem alfabética."""
    return sorted(freq.items(), key=lambda par: (-par[1], par[0]))[:n]


def contar_frases(texto):
    return sum(texto.count(sinal) for sinal in ".!?")


def relatorio(texto):
    lista = palavras(texto)
    freq = frequencias(lista)
    print(f"Palavras:          {len(lista)}")
    print(f"Palavras distintas: {len(freq)}")
    print(f"Frases:            {contar_frases(texto)}")
    print(f"Tamanho médio:     {sum(map(len, lista)) / len(lista):.2f} letras")
    print("Mais comuns:")
    for palavra, qtd in mais_comuns(freq):
        print(f"  {palavra:<12} {'█' * qtd} {qtd}")


relatorio(TEXTO)

# A biblioteca padrão já tem um contador pronto:
print(Counter(palavras(TEXTO)).most_common(3))
```

> 💡 Repare que `relatorio` quase não tem lógica própria: ela **orquestra** funções menores. Cada função faz uma coisa só e pode ser testada sozinha.

### Sugestões de melhorias
- Ignorar *stopwords* (palavras muito comuns como "a", "de", "é", "uma").
- Ler o texto de um arquivo `.txt` com `open(...)`.
- Mostrar a palavra mais longa e as letras mais frequentes.
- Comparar dois textos: quais palavras aparecem em um e não no outro (subtração de conjuntos, como no cap. 13).

### Exercício
Palavras que aparecem **uma única vez** num texto são chamadas de *hapax*. Escreva `palavras_unicas(texto)` que devolve uma **lista em ordem alfabética** dessas palavras, ignorando maiúsculas/minúsculas e a pontuação (use `string.punctuation`).

```python inicial
def palavras_unicas(texto):
    return sorted(set(texto.split()))
```

```python solucao
import string

def palavras_unicas(texto):
    tabela = str.maketrans("", "", string.punctuation)
    lista = texto.lower().translate(tabela).split()
    freq = {}
    for p in lista:
        freq[p] = freq.get(p, 0) + 1
    return sorted(p for p, n in freq.items() if n == 1)
```

```python teste
_r = palavras_unicas("O gato e o rato. O RATO fugiu!")
assert isinstance(_r, list), "A função deve devolver uma lista."
assert _r == ["e", "fugiu", "gato"], f"Esperava ['e', 'fugiu', 'gato'], veio {_r}."
assert palavras_unicas("sol, sol; sol!") == [], "Se todas se repetem, a lista deve ser vazia."
assert palavras_unicas("") == [], "Texto vazio deve dar lista vazia."
assert palavras_unicas("Zebra abelha") == ["abelha", "zebra"], "Lembre-se de ordenar e de usar minúsculas."
```

## Projeto 4: Jogo da forca
fonte: Pense em Python cap. 8 e 9 (jogos de palavras)

### Objetivo
O clássico jogo da forca: o computador escolhe uma palavra secreta, mostra os traços (`_ _ _ _`) e o jogador tenta letras. Cada erro custa uma vida; o jogador vence se descobrir todas as letras antes de as vidas acabarem.

### Conceitos usados
`random.choice`, conjuntos (`set`) para guardar letras tentadas, `str.join` com expressão geradora, laço `while` com duas condições de parada, funções que separam lógica e interface.

### Passo a passo do raciocínio
1. **Que estado o jogo tem?** A palavra secreta, as letras já tentadas (um `set`) e as vidas restantes.
2. **Como mostrar a palavra?** Para cada letra: mostra se já foi tentada, senão `_`. Isso é a função `mascarar`.
3. **Como saber se venceu?** Todas as letras da palavra estão no conjunto de tentadas: `set(palavra) <= tentadas`.
4. **Como processar uma jogada?** Validar (uma letra, ainda não tentada), adicionar ao conjunto e, se não estiver na palavra, tirar uma vida.
5. **De onde vêm as letras?** Para poder testar, o jogo recebe uma **função** que fornece a próxima letra. Pode ser `input` ou um jogador automático.

### Código completo

```python
import random

PALAVRAS = ["python", "variavel", "funcao", "lista", "dicionario", "classe", "modulo"]
VIDAS = 6


def mascarar(palavra, letras):
    """Mostra as letras já descobertas e '_' no lugar das outras."""
    return " ".join(l if l in letras else "_" for l in palavra)


def jogar(palavra, proxima_letra):
    """Roda uma partida. proxima_letra() deve devolver o palpite do jogador."""
    tentadas = set()
    vidas = VIDAS
    while vidas > 0 and not set(palavra) <= tentadas:
        print(f"\n{mascarar(palavra, tentadas)}   vidas: {'♥' * vidas}")
        letra = proxima_letra().strip().lower()
        if len(letra) != 1 or not letra.isalpha():
            print("Digite uma única letra.")
            vidas -= 1                      # evita laço infinito com entradas inválidas
            continue
        if letra in tentadas:
            print(f"Você já tentou '{letra}'.")
            continue
        tentadas.add(letra)
        if letra in palavra:
            print(f"Boa! '{letra}' está na palavra.")
        else:
            vidas -= 1
            print(f"Não tem '{letra}'.")
    venceu = set(palavra) <= tentadas
    print(f"\n{'Você venceu! 🎉' if venceu else 'Enforcado! 💀'} A palavra era: {palavra}")
    return venceu


# Um jogador automático que chuta as letras mais comuns do português
def jogador_automatico():
    chutes = iter("aeosrinmdutclp")
    return lambda: next(chutes)


jogar(random.choice(PALAVRAS), jogador_automatico())
```

Para jogar você mesmo, passe `input` como fonte das letras:

```python nao-executar
jogar(random.choice(PALAVRAS), lambda: input("Letra: "))
```

> 💡 Passar uma função como argumento (`proxima_letra`) deixou o jogo **testável**: o mesmo código funciona com um humano, com um robô ou com uma lista fixa de letras num teste.

### Sugestões de melhorias
- Desenhar o boneco da forca em ASCII conforme as vidas diminuem.
- Ler as palavras de um arquivo e escolher por categoria (frutas, países...).
- Aceitar acentos: tratar "a", "á" e "ã" como a mesma letra.
- Permitir chutar a palavra inteira.

### Exercício
Melhore a função `mascarar(palavra, letras)` para palavras "de verdade": ela deve ignorar maiúsculas/minúsculas (a letra `"g"` revela o `"G"`, mostrado como está na palavra) e mostrar **sempre** os caracteres que não são letras (como `-`). Continue separando cada caractere por um espaço. Exemplo: `mascarar("Guarda-chuva", {"a", "u"})` devolve `"_ u a _ _ a - _ _ u _ a"`.

```python inicial
def mascarar(palavra, letras):
    return " ".join(l if l in letras else "_" for l in palavra)
```

```python solucao
def mascarar(palavra, letras):
    letras = {l.lower() for l in letras}
    partes = []
    for c in palavra:
        if not c.isalpha() or c.lower() in letras:
            partes.append(c)
        else:
            partes.append("_")
    return " ".join(partes)
```

```python teste
assert mascarar("python", {"p", "o"}) == "p _ _ _ o _", f"mascarar('python', {{'p','o'}}) deveria dar 'p _ _ _ o _', deu {mascarar('python', {'p', 'o'})!r}."
assert mascarar("Guarda-chuva", {"a", "u"}) == "_ u a _ _ a - _ _ u _ a", f"Deu {mascarar('Guarda-chuva', {'a', 'u'})!r}; o hífen deve aparecer sempre."
assert mascarar("Guarda-chuva", {"g"}) == "G _ _ _ _ _ - _ _ _ _ _", "A letra 'g' deveria revelar o 'G' maiúsculo."
assert mascarar("Ana", {"A"}) == "A _ a", "Letras tentadas em maiúscula também devem funcionar."
assert mascarar("sol", set()) == "_ _ _", "Sem letras tentadas, tudo vira '_'."
```

## Projeto 5: Agenda de contatos com JSON
fonte: Pense em Python cap. 14 (arquivos); documentação do módulo json

### Objetivo
Uma agenda que adiciona, busca, lista e remove contatos e que **lembra** dos dados entre execuções, salvando tudo num arquivo JSON.

### Conceitos usados
Dicionários aninhados, `json.dump` / `json.load`, `with open(...)`, tratamento de `FileNotFoundError`, funções de "CRUD" (criar, ler, atualizar, apagar).

### Passo a passo do raciocínio
1. **Como representar os dados?** Um dicionário `{nome: {"telefone": ..., "email": ...}}`. Buscar por nome fica instantâneo.
2. **Como persistir?** JSON é texto legível e mapeia direto para dicionários e listas.
3. **E se o arquivo ainda não existir?** Na primeira execução, `open` lança `FileNotFoundError`: devolva uma agenda vazia.
4. **Quais operações?** `adicionar`, `buscar`, `remover`, `listar`. Cada uma recebe a agenda e devolve ou altera algo, sem saber de arquivos.
5. **Quem fala com o disco?** Só `carregar` e `salvar`. Separar persistência da lógica facilita trocar JSON por um banco de dados no futuro.

### Código completo

```python
import json

ARQUIVO = "agenda.json"


def carregar(caminho=ARQUIVO):
    """Lê a agenda do arquivo; devolve {} se ele ainda não existir."""
    try:
        with open(caminho, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def salvar(agenda, caminho=ARQUIVO):
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(agenda, f, ensure_ascii=False, indent=2, sort_keys=True)


def adicionar(agenda, nome, telefone, email=""):
    agenda[nome] = {"telefone": telefone, "email": email}


def buscar(agenda, termo):
    """Contatos cujo nome contém o termo (sem diferenciar maiúsculas)."""
    termo = termo.lower()
    return {n: d for n, d in agenda.items() if termo in n.lower()}


def remover(agenda, nome):
    if nome not in agenda:
        raise KeyError(f"contato {nome!r} não existe")
    del agenda[nome]


def listar(agenda):
    if not agenda:
        print("(agenda vazia)")
    for nome in sorted(agenda):
        dados = agenda[nome]
        print(f"{nome:<15} {dados['telefone']:<15} {dados['email']}")


# --- Primeira "execução" do programa ---
agenda = carregar()
adicionar(agenda, "Ana Souza", "11 98888-1111", "ana@exemplo.com")
adicionar(agenda, "Bruno Lima", "21 97777-2222")
adicionar(agenda, "Carla Dias", "31 96666-3333", "carla@exemplo.com")
salvar(agenda)

# --- Segunda "execução": os dados voltam do arquivo ---
agenda = carregar()
listar(agenda)
print("\nBusca por 'li':", list(buscar(agenda, "li")))
try:
    remover(agenda, "Zé Ninguém")
except KeyError as erro:
    print("Erro:", erro.args[0])
remover(agenda, "Bruno Lima")
salvar(agenda)

print("\nConteúdo do arquivo:")
with open(ARQUIVO, encoding="utf-8") as f:
    print(f.read())
```

> 💡 `ensure_ascii=False` grava acentos como estão ("João") em vez de códigos como `ã`. `indent=2` deixa o arquivo legível para humanos.

### Sugestões de melhorias
- Um menu com `input()` (1-Adicionar, 2-Buscar, 3-Listar, 4-Remover, 0-Sair).
- Validar e-mails (precisa ter `@` e um ponto depois dele).
- Guardar aniversários e listar os do mês atual com `datetime`.
- Exportar a agenda para CSV com o módulo `csv`.

### Exercício
Escreva `adicionar_contato(caminho, nome, telefone)` que:

1. carrega a agenda do arquivo JSON em `caminho` (se o arquivo não existir, começa com `{}`);
2. **normaliza** o telefone, mantendo só os dígitos (`"(11) 9888-1111"` vira `"1198881111"`); se não sobrar nenhum dígito, lança `ValueError`;
3. grava `agenda[nome] = telefone_normalizado` e salva o arquivo;
4. devolve a agenda (dicionário).

```python inicial
import json

def adicionar_contato(caminho, nome, telefone):
    agenda = {}
    agenda[nome] = telefone
    return agenda
```

```python solucao
import json

def adicionar_contato(caminho, nome, telefone):
    try:
        with open(caminho, encoding="utf-8") as f:
            agenda = json.load(f)
    except FileNotFoundError:
        agenda = {}
    digitos = "".join(c for c in telefone if c.isdigit())
    if not digitos:
        raise ValueError("telefone sem dígitos")
    agenda[nome] = digitos
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(agenda, f, ensure_ascii=False)
    return agenda
```

```python teste
import json, os
_arq = "teste_agenda_ex.json"
if os.path.exists(_arq):
    os.remove(_arq)
_a = adicionar_contato(_arq, "Ana", "(11) 9888-1111")
assert _a == {"Ana": "1198881111"}, f"Esperava {{'Ana': '1198881111'}}, veio {_a}."
assert os.path.exists(_arq), "A função deve salvar o arquivo JSON no caminho recebido."
_a = adicionar_contato(_arq, "João", "21 7777 2222")
assert _a == {"Ana": "1198881111", "João": "2177772222"}, "O segundo contato deve ser somado aos que já estavam no arquivo."
with open(_arq, encoding="utf-8") as _f:
    assert json.load(_f) == _a, "O arquivo deve conter a agenda atualizada."
try:
    adicionar_contato(_arq, "Erro", "sem número")
except ValueError:
    pass
else:
    raise AssertionError("Telefone sem dígitos deveria lançar ValueError.")
os.remove(_arq)
```

## Projeto 6: Gerenciador de tarefas com POO
fonte: Pense em Python cap. 15–18 (classes e objetos)

### Objetivo
Um gerenciador de tarefas (*to-do list*) em que cada tarefa tem título, prioridade e estado (pendente ou concluída), organizado com duas classes: `Tarefa` e `ListaDeTarefas`.

### Conceitos usados
Classes, `__init__`, atributos, métodos, `__str__`, `__len__` e `__iter__`, composição (uma lista que contém objetos), exceções personalizadas, compreensões de lista.

### Passo a passo do raciocínio
1. **Quais são os "substantivos" do problema?** Tarefa e lista de tarefas: viram **classes**.
2. **O que cada tarefa sabe?** Título, prioridade (1 = alta, 3 = baixa) e se está concluída: **atributos**.
3. **O que cada tarefa faz?** Concluir-se e se apresentar como texto: **métodos** `concluir` e `__str__`.
4. **O que a lista faz?** Adicionar, encontrar por título, concluir, listar pendentes e concluídas.
5. **Como a lista se comporta como coleção?** `__len__` permite `len(lista)` e `__iter__` permite `for t in lista`.

### Código completo

```python
class Tarefa:
    PRIORIDADES = {1: "alta", 2: "média", 3: "baixa"}

    def __init__(self, titulo, prioridade=2):
        if prioridade not in self.PRIORIDADES:
            raise ValueError("prioridade deve ser 1, 2 ou 3")
        self.titulo = titulo
        self.prioridade = prioridade
        self.concluida = False

    def concluir(self):
        self.concluida = True

    def __str__(self):
        marca = "✔" if self.concluida else " "
        return f"[{marca}] {self.titulo} ({self.PRIORIDADES[self.prioridade]})"


class ListaDeTarefas:
    def __init__(self):
        self._tarefas = []           # composição: a lista guarda objetos Tarefa

    def adicionar(self, titulo, prioridade=2):
        tarefa = Tarefa(titulo, prioridade)
        self._tarefas.append(tarefa)
        return tarefa

    def encontrar(self, titulo):
        for t in self._tarefas:
            if t.titulo == titulo:
                return t
        raise KeyError(f"tarefa {titulo!r} não encontrada")

    def concluir(self, titulo):
        self.encontrar(titulo).concluir()

    def pendentes(self):
        return [t for t in self._tarefas if not t.concluida]

    def concluidas(self):
        return [t for t in self._tarefas if t.concluida]

    def __len__(self):
        return len(self._tarefas)

    def __iter__(self):
        return iter(self._tarefas)

    def resumo(self):
        feitas = len(self.concluidas())
        return f"{feitas}/{len(self)} concluídas ({feitas / len(self):.0%})"


minhas = ListaDeTarefas()
minhas.adicionar("Estudar POO", 1)
minhas.adicionar("Lavar a louça", 3)
minhas.adicionar("Fazer exercícios do módulo 14", 1)
minhas.adicionar("Ler documentação do json")
minhas.concluir("Estudar POO")

for tarefa in minhas:
    print(tarefa)
print("Pendentes:", [t.titulo for t in minhas.pendentes()])
print(minhas.resumo())

try:
    minhas.concluir("Viajar para Marte")
except KeyError as erro:
    print("Erro:", erro.args[0])
```

### Sugestões de melhorias
- Data de vencimento com `datetime.date` e listagem das tarefas atrasadas.
- Salvar e carregar a lista em JSON (como no Projeto 5): crie `para_dict()` e `de_dict()`.
- Categorias/etiquetas (`{"casa", "estudo"}`) e filtro por etiqueta.
- Uma interface de linha de comando com `argparse`.

### Exercício
Acrescente dois métodos à classe `ListaDeTarefas`:

- `por_prioridade()`: devolve a lista das tarefas **pendentes** ordenadas por prioridade (1 primeiro) e, em caso de empate, por título em ordem alfabética;
- `remover_concluidas()`: remove da lista todas as tarefas concluídas e devolve **quantas** foram removidas.

```python inicial
class Tarefa:
    def __init__(self, titulo, prioridade=2):
        self.titulo = titulo
        self.prioridade = prioridade
        self.concluida = False

    def concluir(self):
        self.concluida = True


class ListaDeTarefas:
    def __init__(self):
        self._tarefas = []

    def adicionar(self, titulo, prioridade=2):
        t = Tarefa(titulo, prioridade)
        self._tarefas.append(t)
        return t

    def __len__(self):
        return len(self._tarefas)

    def por_prioridade(self):
        return self._tarefas

    def remover_concluidas(self):
        return 0
```

```python solucao
class Tarefa:
    def __init__(self, titulo, prioridade=2):
        self.titulo = titulo
        self.prioridade = prioridade
        self.concluida = False

    def concluir(self):
        self.concluida = True


class ListaDeTarefas:
    def __init__(self):
        self._tarefas = []

    def adicionar(self, titulo, prioridade=2):
        t = Tarefa(titulo, prioridade)
        self._tarefas.append(t)
        return t

    def __len__(self):
        return len(self._tarefas)

    def por_prioridade(self):
        pendentes = [t for t in self._tarefas if not t.concluida]
        return sorted(pendentes, key=lambda t: (t.prioridade, t.titulo))

    def remover_concluidas(self):
        antes = len(self._tarefas)
        self._tarefas = [t for t in self._tarefas if not t.concluida]
        return antes - len(self._tarefas)
```

```python teste
_l = ListaDeTarefas()
_l.adicionar("Varrer", 3)
_l.adicionar("Pagar contas", 1)
_l.adicionar("Estudar", 2)
_l.adicionar("Academia", 1)
_l.adicionar("Ler", 2).concluir()
_ordem = [t.titulo for t in _l.por_prioridade()]
assert _ordem == ["Academia", "Pagar contas", "Estudar", "Varrer"], f"Ordem esperada: ['Academia', 'Pagar contas', 'Estudar', 'Varrer'] (só pendentes), veio {_ordem}."
for _t in _l.por_prioridade():
    if _t.titulo == "Estudar":
        _t.concluir()
assert _l.remover_concluidas() == 2, "remover_concluidas() deveria devolver 2 (Ler e Estudar)."
assert len(_l) == 3, f"Deveriam sobrar 3 tarefas, sobraram {len(_l)}."
assert _l.remover_concluidas() == 0, "Chamando de novo, não há mais concluídas: deveria devolver 0."
```

## Projeto 7: Simulador de conta bancária com exceções
fonte: Pense em Python cap. 17–18 (herança); documentação: exceções definidas pelo usuário

### Objetivo
Simular contas bancárias com depósito, saque, transferência e extrato, usando **exceções personalizadas** para as regras de negócio (saldo insuficiente, valor inválido) e **herança** para uma conta especial com limite.

### Conceitos usados
Classes de exceção que herdam de `Exception`, `raise`, `try/except/else/finally`, herança e `super()`, `@property` para proteger o saldo, histórico em lista de tuplas.

### Passo a passo do raciocínio
1. **Quais erros podem acontecer?** Valor negativo ou zero e saldo insuficiente. Cada um vira uma classe de exceção, todas filhas de `OperacaoInvalidaError` (quem quiser pode capturar todas de uma vez).
2. **Como proteger o saldo?** Guardá-lo em `_saldo` e expor só a leitura com `@property`: ninguém faz `conta.saldo = 1000000`.
3. **Onde ficam as regras?** Dentro de `depositar` e `sacar`. Elas **lançam** exceções; quem usa a conta decide como tratar.
4. **Transferência**: sacar de uma e depositar na outra. Se o saque falhar, nada acontece com a outra conta.
5. **Conta especial**: igual à normal, mas pode ficar negativa até um limite. Herança: só muda o cálculo do "quanto pode sacar".

### Código completo

```python
class OperacaoInvalidaError(Exception):
    """Erro base das operações bancárias."""


class ValorInvalidoError(OperacaoInvalidaError):
    pass


class SaldoInsuficienteError(OperacaoInvalidaError):
    def __init__(self, saldo, valor):
        super().__init__(f"saldo insuficiente: disponível R$ {saldo:.2f}, pedido R$ {valor:.2f}")
        self.saldo = saldo
        self.valor = valor


class ContaBancaria:
    def __init__(self, titular, saldo=0.0):
        self.titular = titular
        self._saldo = saldo
        self.historico = [("abertura", saldo)]

    @property
    def saldo(self):
        return self._saldo

    def disponivel(self):
        return self._saldo

    def _validar(self, valor):
        if valor <= 0:
            raise ValorInvalidoError(f"valor deve ser positivo, recebido {valor}")

    def depositar(self, valor):
        self._validar(valor)
        self._saldo += valor
        self.historico.append(("depósito", valor))

    def sacar(self, valor):
        self._validar(valor)
        if valor > self.disponivel():
            raise SaldoInsuficienteError(self.disponivel(), valor)
        self._saldo -= valor
        self.historico.append(("saque", -valor))

    def transferir(self, destino, valor):
        self.sacar(valor)              # se falhar, a exceção sobe e nada muda
        destino.depositar(valor)
        self.historico[-1] = (f"transf. p/ {destino.titular}", -valor)

    def extrato(self):
        print(f"--- Extrato de {self.titular} ---")
        for descricao, valor in self.historico:
            print(f"{descricao:<22} {valor:>10.2f}")
        print(f"{'SALDO':<22} {self.saldo:>10.2f}\n")


class ContaEspecial(ContaBancaria):
    def __init__(self, titular, saldo=0.0, limite=500.0):
        super().__init__(titular, saldo)
        self.limite = limite

    def disponivel(self):              # sobrescreve: pode usar o limite
        return self._saldo + self.limite


ana = ContaBancaria("Ana", 100)
beto = ContaEspecial("Beto", 50, limite=200)

operacoes = [
    lambda: ana.depositar(250),
    lambda: ana.sacar(1000),           # saldo insuficiente
    lambda: ana.depositar(-5),         # valor inválido
    lambda: beto.sacar(220),           # ok: usa o limite
    lambda: ana.transferir(beto, 300),
]
for op in operacoes:
    try:
        op()
    except SaldoInsuficienteError as e:
        print("❌", e, f"(faltam R$ {e.valor - e.saldo:.2f})")
    except OperacaoInvalidaError as e:
        print("❌", e)
    else:
        print("✅ operação realizada")

ana.extrato()
beto.extrato()
```

> ⚠️ Em sistemas financeiros reais, não use `float` para dinheiro (há erros de arredondamento como `0.1 + 0.2`). Use `decimal.Decimal` ou guarde valores em centavos (inteiros).

### Sugestões de melhorias
- Trocar `float` por `Decimal` em todos os valores.
- Cobrar uma taxa por saque e juros sobre o saldo negativo da conta especial.
- Registrar data e hora de cada operação com `datetime`.
- Um `Banco` que guarda várias contas num dicionário por número da conta.

### Exercício
Crie a classe `ContaPoupanca`, filha de `ContaBancaria`, com:

- um limite de **3 saques**: a partir do 4º, `sacar` deve lançar `LimiteDeSaquesError` (já definida, filha de `OperacaoInvalidaError`) sem mexer no saldo;
- o método `render(taxa)`, que acrescenta ao saldo `saldo * taxa` e **devolve** o valor do rendimento.

Os saques que falham por outro motivo (saldo insuficiente) não precisam contar.

```python inicial
class OperacaoInvalidaError(Exception):
    pass

class SaldoInsuficienteError(OperacaoInvalidaError):
    pass

class LimiteDeSaquesError(OperacaoInvalidaError):
    pass


class ContaBancaria:
    def __init__(self, titular, saldo=0.0):
        self.titular = titular
        self._saldo = saldo

    @property
    def saldo(self):
        return self._saldo

    def depositar(self, valor):
        self._saldo += valor

    def sacar(self, valor):
        if valor > self._saldo:
            raise SaldoInsuficienteError("saldo insuficiente")
        self._saldo -= valor


class ContaPoupanca(ContaBancaria):
    pass
```

```python solucao
class OperacaoInvalidaError(Exception):
    pass

class SaldoInsuficienteError(OperacaoInvalidaError):
    pass

class LimiteDeSaquesError(OperacaoInvalidaError):
    pass


class ContaBancaria:
    def __init__(self, titular, saldo=0.0):
        self.titular = titular
        self._saldo = saldo

    @property
    def saldo(self):
        return self._saldo

    def depositar(self, valor):
        self._saldo += valor

    def sacar(self, valor):
        if valor > self._saldo:
            raise SaldoInsuficienteError("saldo insuficiente")
        self._saldo -= valor


class ContaPoupanca(ContaBancaria):
    LIMITE_SAQUES = 3

    def __init__(self, titular, saldo=0.0):
        super().__init__(titular, saldo)
        self.saques = 0

    def sacar(self, valor):
        if self.saques >= self.LIMITE_SAQUES:
            raise LimiteDeSaquesError("limite de 3 saques atingido")
        super().sacar(valor)
        self.saques += 1

    def render(self, taxa):
        rendimento = self._saldo * taxa
        self._saldo += rendimento
        return rendimento
```

```python teste
_p = ContaPoupanca("Ana", 1000)
assert isinstance(_p, ContaBancaria), "ContaPoupanca deve herdar de ContaBancaria."
_rend = _p.render(0.01)
assert abs(_rend - 10) < 1e-9, f"render(0.01) com saldo 1000 deveria devolver 10, devolveu {_rend}."
assert abs(_p.saldo - 1010) < 1e-9, f"Depois de render, o saldo deveria ser 1010, é {_p.saldo}."
try:
    _p.sacar(5000)
except SaldoInsuficienteError:
    pass
else:
    raise AssertionError("Sacar mais que o saldo deve lançar SaldoInsuficienteError.")
for _ in range(3):
    _p.sacar(10)
assert abs(_p.saldo - 980) < 1e-9, f"Depois de 3 saques de 10, o saldo deveria ser 980, é {_p.saldo}."
try:
    _p.sacar(10)
except LimiteDeSaquesError:
    pass
else:
    raise AssertionError("O 4º saque deveria lançar LimiteDeSaquesError.")
assert abs(_p.saldo - 980) < 1e-9, "O saque bloqueado não pode alterar o saldo."
assert issubclass(LimiteDeSaquesError, OperacaoInvalidaError), "LimiteDeSaquesError deve continuar filha de OperacaoInvalidaError."
```

## Projeto 8: Jogo da velha
fonte: Pense em Python cap. 10 e 11 (listas e dicionários)

### Objetivo
Um jogo da velha completo para dois jogadores: mostrar o tabuleiro, validar jogadas, detectar vitória ou empate. Para rodar sem digitar nada, dois "robôs" jogam um contra o outro, e um deles é esperto: ganha quando pode e bloqueia o adversário.

### Conceitos usados
Listas de listas (matriz), índices, laços aninhados, funções com responsabilidades separadas, `random`, `any`/`all`, `copy`.

### Passo a passo do raciocínio
1. **Representação**: uma lista com 3 linhas, cada uma com 3 casas (`"X"`, `"O"` ou `" "`). A casa da linha 1, coluna 2 é `tab[1][2]`.
2. **Mostrar**: juntar as casas com `" | "` e separar as linhas com `---+---+---`.
3. **Vencedor**: há 8 linhas vencedoras (3 horizontais, 3 verticais, 2 diagonais). Gere essa lista **uma vez** e confira cada uma. Se ninguém venceu e não há casas vazias, é empate.
4. **Jogadas possíveis**: as coordenadas das casas vazias.
5. **Estratégia do robô**: para cada jogada possível, simular num tabuleiro copiado. Se ele ganha, joga ali; se o adversário ganharia, bloqueia; senão, prefere o centro ou escolhe ao acaso.
6. **Laço do jogo**: alternar jogadores até haver vencedor ou empate.

### Código completo

```python
import copy
import random

VAZIO = " "


def novo_tabuleiro():
    return [[VAZIO] * 3 for _ in range(3)]


def mostrar(tab):
    linhas = [" " + " | ".join(linha) for linha in tab]
    print("\n---+---+---\n".join(linhas), "\n")


def linhas_vencedoras():
    """As 8 trincas de coordenadas que dão vitória."""
    trincas = []
    for i in range(3):
        trincas.append([(i, j) for j in range(3)])     # linha i
        trincas.append([(j, i) for j in range(3)])     # coluna i
    trincas.append([(i, i) for i in range(3)])         # diagonal principal
    trincas.append([(i, 2 - i) for i in range(3)])     # diagonal secundária
    return trincas


TRINCAS = linhas_vencedoras()


def vencedor(tab):
    """Devolve 'X' ou 'O' se alguém venceu, 'empate' se acabou, ou None."""
    for trinca in TRINCAS:
        a, b, c = (tab[i][j] for i, j in trinca)
        if a != VAZIO and a == b == c:
            return a
    if all(casa != VAZIO for linha in tab for casa in linha):
        return "empate"
    return None


def jogadas_possiveis(tab):
    return [(i, j) for i in range(3) for j in range(3) if tab[i][j] == VAZIO]


def jogada_ao_acaso(tab, simbolo):
    return random.choice(jogadas_possiveis(tab))


def jogada_esperta(tab, simbolo):
    adversario = "O" if simbolo == "X" else "X"
    for quem in (simbolo, adversario):       # 1º tenta ganhar, 2º tenta bloquear
        for i, j in jogadas_possiveis(tab):
            teste = copy.deepcopy(tab)
            teste[i][j] = quem
            if vencedor(teste) == quem:
                return i, j
    if tab[1][1] == VAZIO:
        return 1, 1
    return random.choice(jogadas_possiveis(tab))


def partida(estrategia_x, estrategia_o):
    tab = novo_tabuleiro()
    jogadores = {"X": estrategia_x, "O": estrategia_o}
    vez = "X"
    while vencedor(tab) is None:
        i, j = jogadores[vez](tab, vez)
        tab[i][j] = vez
        vez = "O" if vez == "X" else "X"
    mostrar(tab)
    return vencedor(tab)


resultado = partida(jogada_esperta, jogada_ao_acaso)
print("Resultado:", resultado)

# Placar de 100 partidas: esperto (X) contra aleatório (O)
placar = {"X": 0, "O": 0, "empate": 0}
for _ in range(100):
    tab = novo_tabuleiro()
    vez = "X"
    while vencedor(tab) is None:
        estrategia = jogada_esperta if vez == "X" else jogada_ao_acaso
        i, j = estrategia(tab, vez)
        tab[i][j] = vez
        vez = "O" if vez == "X" else "X"
    placar[vencedor(tab)] += 1
print("Placar em 100 partidas:", placar)
```

Para jogar contra o robô, basta uma "estratégia" que pergunta a você:

```python nao-executar
def jogada_humana(tab, simbolo):
    while True:
        mostrar(tab)
        texto = input(f"{simbolo}, sua jogada (linha coluna, de 0 a 2): ")
        try:
            i, j = map(int, texto.split())
            if (i, j) in jogadas_possiveis(tab):
                return i, j
        except ValueError:
            pass
        print("Jogada inválida, tente de novo.")

partida(jogada_humana, jogada_esperta)
```

> 💡 Como as estratégias são funções com a mesma "forma" (recebem o tabuleiro e o símbolo, devolvem uma jogada), dá para trocar humano por robô sem mudar o resto. Isso é um bom **design**.

### Sugestões de melhorias
- Implementar o algoritmo *minimax*: um robô que nunca perde.
- Tabuleiros maiores (4×4, 5×5) com "N em linha".
- Placar persistente em JSON entre execuções.
- Uma versão gráfica com Tkinter ou Pygame no computador.

### Exercício
Outra forma comum de representar o tabuleiro é uma **string de 9 caracteres**, lida linha a linha: `"XOX OX  X"` corresponde a

```text
X | O | X
  | O | X
  |   | X
```

Escreva `vencedor(tabuleiro)` para esse formato. Devolva `"X"` ou `"O"` se houver um vencedor, `"empate"` se não houver vencedor e nenhuma casa vazia (`" "`), e `None` se o jogo ainda não acabou.

```python inicial
def vencedor(tabuleiro):
    for i in range(0, 9, 3):
        if tabuleiro[i] != " " and tabuleiro[i] == tabuleiro[i + 1] == tabuleiro[i + 2]:
            return tabuleiro[i]
    return None
```

```python solucao
LINHAS = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),     # horizontais
    (0, 3, 6), (1, 4, 7), (2, 5, 8),     # verticais
    (0, 4, 8), (2, 4, 6),                # diagonais
]

def vencedor(tabuleiro):
    for a, b, c in LINHAS:
        if tabuleiro[a] != " " and tabuleiro[a] == tabuleiro[b] == tabuleiro[c]:
            return tabuleiro[a]
    if " " not in tabuleiro:
        return "empate"
    return None
```

```python teste
assert vencedor("XXXOO    ") == "X", "Linha de cima toda X: deveria dar 'X'."
assert vencedor("XOX OX  X") == "X", "Coluna da direita toda X: deveria dar 'X'."
assert vencedor("O X O X O") == "O", "Diagonal principal toda O: deveria dar 'O'."
assert vencedor("XXO O O X") == "O", "Diagonal secundária toda O: deveria dar 'O'."
assert vencedor("XOXXOOOXX") == "empate", "Tabuleiro cheio sem vencedor: deveria dar 'empate'."
assert vencedor("X O      ") is None, "Jogo em andamento: deveria dar None."
assert vencedor("         ") is None, "Tabuleiro vazio: deveria dar None."
```

## Quiz
? O que significa "decompor" um problema?
- [ ] Apagar as partes difíceis do programa
- [x] Quebrá-lo em partes menores e mais simples, que podem ser resolvidas e testadas separadamente
- [ ] Escrever tudo numa única função grande
- [ ] Converter o código para outra linguagem
> Decompor é dividir o problema em subproblemas. Cada um vira uma função (ou classe) pequena e com uma responsabilidade.

? No jogo de adivinhação, por que separar `avaliar_palpite` do código que usa `input()`?
- [ ] Porque `input()` não funciona dentro de funções
- [x] Porque a lógica fica testável sem precisar de alguém digitando
- [ ] Porque deixa o programa mais rápido
- [ ] Porque o Python exige
> Separar lógica de interface permite testar a lógica com `assert` ou unittest e trocar a interface (terminal, app, web) sem reescrevê-la.

? Na calculadora, qual a vantagem do dicionário `{"+": somar, "-": subtrair, ...}`?
- [ ] Ocupa menos memória que funções
- [ ] Faz as contas com mais precisão
- [x] Evita uma cadeia longa de if/elif e facilita adicionar operações novas
- [ ] Impede divisão por zero
> Funções são objetos e podem ser guardadas em dicionários. Para adicionar uma operação, basta uma nova entrada.

? No analisador de texto, por que normalizar (minúsculas e sem pontuação) antes de contar?
- [ ] Para o texto ficar mais curto
- [x] Para que "Casa", "casa," e "casa" sejam contadas como a mesma palavra
- [ ] Porque dicionários não aceitam maiúsculas
- [ ] Para ordenar alfabeticamente
> Sem normalizar, variações de maiúsculas e pontuação gerariam chaves diferentes no dicionário de frequências.

? Na forca, por que guardar as letras tentadas num `set`?
- [ ] Porque conjuntos mantêm a ordem de inserção
- [x] Porque evita repetições e verificar `letra in tentadas` é muito rápido
- [ ] Porque listas não aceitam strings
- [ ] Porque `set` ordena as letras automaticamente
> Conjuntos não têm elementos repetidos e o teste de pertinência é O(1). E `set(palavra) <= tentadas` diz se o jogador venceu.

? Na agenda, qual é o motivo de só `carregar` e `salvar` lidarem com o arquivo?
- [ ] Arquivos só podem ser abertos uma vez
- [x] Separar persistência da lógica facilita testar e trocar JSON por outro armazenamento depois
- [ ] O módulo json exige isso
- [ ] Para o programa usar menos memória
> As outras funções trabalham só com o dicionário; se um dia o JSON virar um banco de dados, só duas funções mudam.

? Na conta bancária, por que criar exceções próprias como `SaldoInsuficienteError`?
- [ ] Porque `Exception` não pode ser lançada
- [ ] Para o programa nunca dar erro
- [x] Para quem usa a classe poder tratar cada situação de negócio de forma específica e clara
- [ ] Porque exceções embutidas são lentas
> Exceções com nomes do domínio deixam o código expressivo e permitem `except SaldoInsuficienteError` sem capturar erros que não têm nada a ver.

? No jogo da velha, as estratégias são funções com a mesma assinatura `(tab, simbolo) -> (i, j)`. Qual o benefício?
- [ ] Ficam mais rápidas
- [ ] O Python obriga funções a terem a mesma assinatura
- [x] Humano, robô aleatório e robô esperto podem ser trocados sem mudar o laço do jogo
- [ ] Assim não é preciso testar o código
> Definir uma "interface" comum permite combinar peças livremente. É o mesmo princípio de passar `input` ou um robô para a forca.
