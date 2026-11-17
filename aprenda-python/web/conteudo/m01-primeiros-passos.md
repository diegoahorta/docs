# Primeiros passos
id: m01
nivel: Iniciante
icone: 🚀
descricao: O que é programar, por que Python, como o Python executa seu código e o seu primeiro programa.

## O que é programar e por que Python
fonte: Python do Zero p. 4–5; Pense em Python cap. 1

**Programar** é escrever instruções precisas para o computador executar. Um **programa** é uma sequência dessas instruções, e quase todo programa, do mais simples ao mais complexo, é feito de poucos tipos de instrução básica:

- **entrada**: receber dados do teclado, de um arquivo, da rede...
- **saída**: mostrar dados na tela, gravar num arquivo...
- **matemática**: fazer contas (somar, multiplicar...)
- **execução condicional**: verificar condições e executar o código adequado
- **repetição**: executar uma ação várias vezes, normalmente com alguma variação

Ou seja: programar é quebrar uma tarefa grande em tarefas cada vez menores, até que cada uma seja simples o suficiente para ser feita com essas instruções básicas. Essa habilidade de **resolver problemas** é a parte mais importante do aprendizado. A linguagem é a ferramenta.

### Por que Python?

| Motivo | O que significa |
|---|---|
| Fácil de aprender | Sintaxe limpa, parecida com o inglês. É a linguagem mais usada em cursos introdutórios. |
| Prática | Programas em Python costumam ter bem menos linhas que os equivalentes em C ou Java. |
| Portátil | O mesmo código roda em Windows, Linux, macOS e até no Android (como neste app!). |
| Grátis | A linguagem, as bibliotecas e as principais IDEs são gratuitas e de código aberto. |
| Bibliotecas | Há centenas de milhares de pacotes prontos no PyPI: você não reinventa a roda. |
| Mercado | Usada por Google, Instagram, Spotify, Netflix, Dropbox, NASA e muitas outras. |

### Onde Python é usado

- **Ciência de dados**: análise de dados com pandas, NumPy, SciPy e gráficos com Matplotlib.
- **Inteligência artificial e machine learning**: scikit-learn, PyTorch, TensorFlow.
- **Desenvolvimento web**: frameworks como Django, Flask e FastAPI.
- **Automação (scripts)**: renomear arquivos, gerar relatórios, enviar e-mails, raspar sites.
- **Jogos**: jogos 2D com a biblioteca Pygame.
- **Computação científica, finanças, educação, segurança, IoT** e muito mais.

Veja como é simples. Toque em **▶ Executar**:

```python
print("Olá, mundo!")
print("Python é", 3 * "legal ")
```

> 💡 Todos os blocos de código deste app podem ser **editados e executados**. Mude o texto acima e execute de novo: experimentar é a melhor forma de aprender.

## Como o Python executa seu código
fonte: Python do Zero p. 6–18; Pense em Python cap. 1

Python é uma linguagem **interpretada**: um programa chamado **interpretador** lê o seu código e o executa, instrução por instrução. Há duas formas de usar o interpretador:

1. **Modo interativo (REPL)**: você digita uma linha e vê o resultado na hora. O sinal `>>>` é o *prompt* do interpretador.
2. **Modo script**: você salva o código num arquivo `.py` e manda o interpretador executá-lo inteiro.

```text
>>> 1 + 1
2
>>> print("oi")
oi
```

Neste app, o **Playground** e os blocos executáveis funcionam como um script: tudo o que está no editor é executado de uma vez. Diferente do REPL, um script só mostra o que você mandar imprimir com `print()`.

### Instalando o Python no computador

Quando quiser programar também no computador:

- **Windows**: baixe o instalador em python.org/downloads, marque **"Add Python to PATH"** e clique em *Install Now*.
- **Linux**: geralmente já vem instalado. Se não, `sudo apt install python3 python3-pip` (Debian/Ubuntu) ou `sudo dnf install python3` (Fedora).
- **macOS**: instale pelo site python.org ou com o Homebrew: `brew install python`.

Para conferir a instalação, abra o terminal e digite:

```bash
python3 --version
```

### Editores e IDEs

Um bom editor colore o código, aponta erros e ajuda a executar o programa:

- **Thonny**: simples, feito para iniciantes, já vem com Python.
- **VS Code**: leve e muito popular (instale a extensão *Python*).
- **PyCharm Community**: IDE completa e gratuita da JetBrains.
- **No Android**: este app (offline), além de apps como Pydroid 3 e Termux.

> 💡 No PyCharm, depois de instalar, configure o interpretador em *Settings → Project → Python Interpreter*, apontando para o Python que você instalou.

## Seu primeiro programa: print()
fonte: Python do Zero p. 20; Pense em Python cap. 1

A função `print()` mostra valores na tela. O texto entre aspas é uma **string** (sequência de caracteres). Pode usar aspas simples ou duplas:

```python
print("Olá, mundo!")
print('Também funciona com aspas simples')
print("Ela disse: 'Python é demais!'")
```

Você pode passar **vários valores** separados por vírgula; o `print` coloca um espaço entre eles:

```python
print("Eu tenho", 25, "anos")
print("2 + 3 =", 2 + 3)
```

Dois parâmetros especiais mudam o comportamento do `print`:

- `sep`: o separador entre os valores (padrão: um espaço)
- `end`: o que vem no final (padrão: quebra de linha `\n`)

```python
print("10", "06", "2025", sep="/")
print("Carregando", end="")
print("...", end="")
print(" pronto!")
print("linha 1\nlinha 2\n\tcom tabulação")
```

> 💡 `\n` é uma quebra de linha e `\t` uma tabulação. São *sequências de escape*.

### Exercício
Escreva um programa que imprima exatamente as duas linhas abaixo:

```text
Olá, Python!
Estou aprendendo a programar.
```

```python inicial
# Use print() duas vezes
```

```python solucao
print("Olá, Python!")
print("Estou aprendendo a programar.")
```

```python teste
linhas = saida.strip().split("\n")
assert len(linhas) == 2, f"Esperava 2 linhas impressas, mas vieram {len(linhas)}."
assert linhas[0].strip() == "Olá, Python!", f"A 1ª linha deveria ser 'Olá, Python!' e foi '{linhas[0]}'"
assert linhas[1].strip() == "Estou aprendendo a programar.", f"A 2ª linha deveria ser 'Estou aprendendo a programar.' e foi '{linhas[1]}'"
```

## Comentários e organização do código
fonte: Pense em Python cap. 2.7

**Comentários** são anotações para pessoas: o Python ignora tudo depois de `#` na linha.

```python
# Calcula a área de um retângulo
largura = 8      # em metros
altura = 3       # em metros
print(largura * altura)   # 24
```

Bons comentários explicam **por que** o código faz algo, não o que é óbvio:

```python
v = 5  # velocidade em metros/segundo  -> útil: diz a unidade
v = 5  # atribui 5 a v                 -> inútil: repete o código
```

Para textos longos, use várias linhas com `#`. Strings entre três aspas (`"""..."""`) também são usadas como documentação, como você verá nas funções (*docstrings*).

### Indentação importa

Em Python, os **espaços no início da linha** (indentação) fazem parte da sintaxe: eles definem blocos de código. Nas próximas lições você verá isso no `if`, `for` e `def`. Por enquanto, a regra é: **não comece linhas com espaços à toa**.

```python erro
print("ok")
    print("esta linha tem espaços sobrando")
```

> ⚠️ Leia a mensagem de erro acima: `IndentationError` significa erro de indentação. Ler erros com calma é uma habilidade essencial!

### Exercício
O programa abaixo tem um comentário escrito sem `#` e por isso não funciona. Corrija-o para que ele imprima `Python`.

```python inicial
Este programa imprime o nome da linguagem
print("Python")
```

```python solucao
# Este programa imprime o nome da linguagem
print("Python")
```

```python teste
assert saida.strip() == "Python", "O programa deveria imprimir apenas: Python"
```

## Erros fazem parte: sintaxe, execução e semântica
fonte: Pense em Python cap. 1.7 e Apêndice A

Programadores cometem erros o tempo todo. Erros de programação são chamados de **bugs** e o processo de encontrá-los é a **depuração** (*debugging*). Existem três tipos:

#### 1. Erro de sintaxe (SyntaxError)
O código não segue as regras da linguagem, e o Python nem começa a executar.

```python erro
print("faltou fechar o parêntese"
```

#### 2. Erro de execução (exceção)
O código é válido, mas algo dá errado **durante** a execução.

```python erro
print("Antes do erro")
print(10 / 0)
print("Esta linha nunca é executada")
```

#### 3. Erro semântico (de lógica)
O programa roda sem mensagem de erro, mas faz **outra coisa** do que você queria. É o mais difícil de achar, porque o Python não avisa!

```python
# Queremos a média de 4 e 8, que é 6...
print(4 + 8 / 2)    # mostra 8.0: a divisão acontece antes da soma!
print((4 + 8) / 2)  # 6.0, correto
```

### Como ler uma mensagem de erro

1. Olhe a **última linha**: ela diz o **tipo** do erro e uma descrição.
2. Veja a **linha** indicada (o app também destaca essa linha no editor).
3. O erro às vezes está numa linha **anterior** (ex.: um parêntese não fechado).

> 💡 Neste app, cada erro vem com uma **dica em português** explicando o que costuma causá-lo.

### Exercício
O programa abaixo deveria imprimir a média de 7 e 9 (que é `8.0`), mas tem um erro semântico. Corrija.

```python inicial
print(7 + 9 / 2)
```

```python solucao
print((7 + 9) / 2)
```

```python teste
assert saida.strip() == "8.0", f"A média de 7 e 9 é 8.0, mas o programa mostrou {saida.strip()!r}. Dica: use parênteses."
```

## Como estudar programação
fonte: Pense em Python Prefácio e cap. 1; plano de estudos deste app

Aprender a programar é como aprender um instrumento: **ler ajuda, mas o que ensina é praticar**. Algumas estratégias que funcionam:

1. **Digite o código**, não apenas leia. Modifique os exemplos e veja o que acontece.
2. **Estude pouco e todo dia**: 30–60 minutos diários rendem mais do que 6 horas no domingo.
3. **Erre de propósito**: tire um parêntese, troque um nome. Conhecer as mensagens de erro acelera muito a depuração.
4. **Explique em voz alta** o que cada linha faz (a técnica do *pato de borracha*).
5. **Revise** os quizzes dos módulos anteriores de tempos em tempos (repetição espaçada).
6. **Construa projetos** pequenos assim que puder: o Módulo de Projetos traz vários.
7. **Leia código** dos outros e a documentação oficial (docs.python.org/pt-br).

### Linguagens naturais × linguagens formais

Português e inglês são **linguagens naturais**: cheias de ambiguidade e redundância, e as pessoas entendem pelo contexto. Python é uma **linguagem formal**: cada símbolo tem um significado exato, sem ambiguidade. Por isso um único caractere errado pode impedir o programa de rodar. Isso não é motivo para desanimar: com o tempo você passa a "ver" os erros rapidamente.

### A trilha deste app

| Nível | Módulos |
|---|---|
| Iniciante | Primeiros passos, Variáveis e operadores, Strings |
| Básico | Decisões, Repetição, Coleções, Funções |
| Intermediário | Erros e depuração, Arquivos e módulos, Orientação a objetos |
| Avançado | Python avançado, Algoritmos e estruturas de dados, Prática profissional |
| Projetos | Projetos completos para consolidar tudo |

Conclua as lições, resolva os exercícios (eles são corrigidos automaticamente) e faça o quiz de cada módulo. Seu progresso fica salvo no aparelho.

## Quiz
? O que é um programa?
- [ ] Um computador muito rápido
- [x] Uma sequência de instruções que especifica como executar uma tarefa
- [ ] Um arquivo de texto qualquer
- [ ] Um tipo de linguagem natural
> Um programa é uma sequência de instruções (entrada, saída, matemática, condicionais e repetição) que diz ao computador como fazer algo.

? O que o código `print("A", "B", sep="-")` mostra?
- [ ] A B
- [ ] AB
- [x] A-B
- [ ] "A"-"B"
> O parâmetro `sep` define o separador colocado entre os valores. O padrão seria um espaço.

? Qual caractere inicia um comentário em Python?
- [ ] //
- [x] #
- [ ] --
- [ ] /*
> Tudo após `#` na linha é ignorado pelo interpretador.

? Um programa roda sem mensagens de erro, mas o resultado está errado. Que tipo de erro é esse?
- [ ] Erro de sintaxe
- [ ] Erro de execução
- [x] Erro semântico (de lógica)
- [ ] Não é um erro
> Erros semânticos não geram mensagem: o programa faz exatamente o que você escreveu, e não o que você queria.

? Qual é o resultado de `print(4 + 8 / 2)`?
- [ ] 6.0
- [x] 8.0
- [ ] 6
- [ ] 12
> A divisão tem precedência maior que a soma: 8 / 2 = 4.0 e 4 + 4.0 = 8.0.

? Por que Python é chamada de linguagem "portátil"?
- [ ] Porque só funciona em celulares
- [ ] Porque o código é pequeno
- [x] Porque o mesmo programa roda em sistemas operacionais diferentes sem alterações
- [ ] Porque não precisa de interpretador
> Portabilidade significa rodar em Windows, Linux, macOS etc. com o mesmo código.
