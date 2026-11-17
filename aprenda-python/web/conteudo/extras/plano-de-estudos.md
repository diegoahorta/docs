# Plano de estudos

### Como usar este app

Cada módulo foi pensado para ser estudado em um ciclo de cinco passos. Repita o ciclo em cada lição:

1. **Ler**: leia a lição com calma, sem pressa de chegar ao fim. Se um termo for novo, consulte o **Glossário**.
2. **Executar os exemplos**: toque em **▶ Executar** em cada bloco de código. Depois **modifique** o exemplo (troque valores, quebre algo de propósito) e execute de novo.
3. **Fazer o exercício**: tente sozinho antes de revelar a solução. Errar e ler a mensagem de erro faz parte do aprendizado.
4. **Responder o quiz**: ao fim do módulo, faça o quiz. Leia a explicação de cada resposta, inclusive das que você acertou.
5. **Revisar**: alguns dias depois, refaça o quiz e um exercício do módulo anterior. Use a **Referência rápida** para relembrar a sintaxe.

> 💡 Estude **um pouco todo dia**. Uma hora diária, cinco ou seis dias por semana, rende muito mais do que uma maratona no fim de semana.

### Cronograma sugerido: 16 semanas (cerca de 1 hora por dia)

| Semana | Módulo | Meta da semana |
|---|---|---|
| 1 | Primeiros passos; Variáveis, tipos e operadores | Usar `print`, variáveis, tipos numéricos e operadores; entender mensagens de erro |
| 2 | Strings | Fatiar, formatar com f-strings e usar os principais métodos de string |
| 3 | Estruturas de decisão | Escrever `if/elif/else` com condições compostas (`and`, `or`, `not`) |
| 4 | Estruturas de repetição | Dominar `for`, `while`, `range`, `break` e `continue`; resolver problemas com acumuladores |
| 5 | Coleções (listas e tuplas) | Criar, percorrer, ordenar e modificar listas; entender mutabilidade |
| 6 | Coleções (dicionários e conjuntos) | Usar dicionários como contadores e índices; operações de conjuntos. Revisar semanas 1–5 |
| 7 | Funções | Criar funções com parâmetros, valores padrão e retorno; escrever docstrings |
| 8 | Funções (escopo e recursão) + Projetos práticos 1 e 2 | Decompor um problema em funções; concluir o jogo de adivinhação e a calculadora |
| 9 | Erros, exceções e depuração | Tratar exceções com `try/except`, lançar erros com `raise`, depurar com método |
| 10 | Arquivos e módulos + Projeto 5 | Ler e gravar arquivos texto e JSON; importar módulos; concluir a agenda de contatos |
| 11 | Programação orientada a objetos | Criar classes com atributos, métodos e `__str__` |
| 12 | Programação orientada a objetos (herança) + Projetos 6 e 7 | Usar herança, `super()` e exceções próprias; concluir tarefas e conta bancária |
| 13 | Python avançado | Compreensões, geradores, decoradores, `lambda` e gerenciadores de contexto |
| 14 | Algoritmos e estruturas de dados | Busca, ordenação, complexidade (Big O), pilhas, filas e recursão |
| 15 | Prática profissional | PEP 8, testes com unittest, logging, venv/pip, Git e profiling |
| 16 | Projetos práticos (3, 4 e 8) + projeto próprio | Concluir os projetos restantes e começar um projeto pessoal para o portfólio |

> 💡 Atrasou? Tudo bem. O cronograma é uma sugestão: o importante é a constância. Se um módulo ficou difícil, gaste mais uma semana nele antes de seguir.

### Metas por nível

#### Ao fim do nível Iniciante, você deve saber:
- explicar o que é um programa, um interpretador e os três tipos de erro;
- usar `print`, variáveis, os tipos `int`, `float`, `str` e `bool` e converter entre eles;
- fazer contas com os operadores aritméticos, respeitando a precedência;
- manipular strings: índices, fatias, `len`, métodos como `upper`, `split`, `replace` e f-strings.

#### Ao fim do nível Básico, você deve saber:
- tomar decisões com `if/elif/else` e repetir ações com `for` e `while`;
- escolher entre lista, tupla, dicionário e conjunto para cada situação;
- escrever funções pequenas, com parâmetros, retorno e docstring;
- resolver problemas clássicos: somar, contar, achar máximo/mínimo, filtrar e buscar.

#### Ao fim do nível Intermediário, você deve saber:
- tratar exceções e ler um traceback para encontrar a causa de um erro;
- ler e gravar arquivos (texto, CSV e JSON) usando `with`;
- organizar o código em módulos e usar a biblioteca padrão (`random`, `math`, `datetime`, `json`...);
- modelar problemas com classes, objetos, herança e métodos especiais.

#### Ao fim do nível Avançado, você deve saber:
- usar compreensões, geradores, decoradores e funções de ordem superior;
- analisar a complexidade de um algoritmo e escolher estruturas de dados eficientes;
- escrever testes automatizados, usar logging e seguir a PEP 8;
- criar um ambiente virtual, instalar pacotes com pip e versionar um projeto com Git;
- escolher uma trilha (dados, web, automação, IA...) e saber por onde continuar.

### Técnicas de estudo que funcionam

| Técnica | O que é | Como aplicar aqui |
|---|---|---|
| Prática deliberada | Treinar de propósito o que você ainda não domina, com feedback imediato | Refaça os exercícios em que errou; crie variações (mude a regra, os dados) |
| Repetição espaçada | Revisar em intervalos crescentes (1 dia, 3 dias, 1 semana, 1 mês) | Refaça os quizzes dos módulos anteriores nesses intervalos |
| Recordação ativa | Tentar lembrar antes de olhar a resposta | Escreva o código de memória e só depois compare com a lição |
| Projetos | Aplicar vários conceitos juntos num problema real | Faça um projeto do módulo de Projetos a cada 2–3 módulos |
| Ensinar | Explicar o conteúdo para alguém (ou para um pato de borracha) | Explique em voz alta o que cada linha de um exemplo faz |
| Intercalar | Misturar tipos de problema em vez de repetir só um | Numa revisão, combine exercícios de strings, laços e funções |
| Descanso | O cérebro consolida o aprendizado durante o sono e as pausas | Sessões de 25–50 minutos com pausas curtas |

> 💡 Travou num problema por mais de 20 minutos? Faça uma pausa, escreva o problema em português, quebre-o em partes menores e resolva a menor primeiro.

### Checklist de habilidades

Marque mentalmente cada item quando conseguir fazê-lo **sem consultar**:

- ☐ Escrever e executar um programa que imprime mensagens e faz contas
- ☐ Converter texto em número com `int()` e `float()` e tratar o erro quando a conversão falha
- ☐ Formatar valores com f-strings (casas decimais, alinhamento)
- ☐ Usar `if/elif/else` com condições compostas
- ☐ Percorrer uma lista com `for` e acumular um resultado (soma, contagem, máximo)
- ☐ Usar `while` com uma condição de parada correta
- ☐ Criar e modificar listas, fatiar e ordenar
- ☐ Usar um dicionário para contar ocorrências
- ☐ Usar conjuntos para remover duplicatas e comparar coleções
- ☐ Escrever funções com parâmetros, valores padrão e `return`
- ☐ Explicar a diferença entre variável local e global
- ☐ Escrever uma função recursiva com caso base
- ☐ Tratar exceções com `try/except/else/finally` e lançar com `raise`
- ☐ Ler e gravar arquivos de texto e JSON com `with open(...)`
- ☐ Importar e usar módulos da biblioteca padrão
- ☐ Criar uma classe com `__init__`, métodos e `__str__`
- ☐ Usar herança e `super()`
- ☐ Escrever compreensões de lista e de dicionário
- ☐ Criar um gerador com `yield`
- ☐ Explicar o que é complexidade O(n) e O(n²) e dar exemplos
- ☐ Escrever testes com `assert` e com `unittest`
- ☐ Criar um ambiente virtual e instalar um pacote com pip
- ☐ Fazer `git init`, `add`, `commit` e `push` de um projeto
- ☐ Ler a documentação oficial para descobrir como usar uma função nova

### 20 ideias de projetos por nível

#### Iniciante
1. **Cartão de visita**: imprimir seus dados formatados com bordas de caracteres.
2. **Conversor de unidades**: Celsius ↔ Fahrenheit, km ↔ milhas, reais ↔ dólares.
3. **Calculadora de IMC** com a classificação do resultado.
4. **Gerador de tabuada** de qualquer número, bem alinhada.
5. **Contador de vogais** e consoantes de uma frase.

#### Básico
6. **Jogo de adivinhação** com níveis de dificuldade e recorde.
7. **Pedra, papel e tesoura** contra o computador, com placar.
8. **Validador de senha**: tamanho mínimo, maiúsculas, números e símbolos.
9. **Lista de compras** com total, item mais caro e média de preços.
10. **Gerador de senhas** aleatórias com o módulo `random`.

#### Intermediário
11. **Agenda de contatos** com JSON, busca e exportação para CSV.
12. **Quiz de perguntas** lidas de um arquivo, com pontuação final.
13. **Controle de gastos mensais** por categoria, salvo em arquivo.
14. **Biblioteca pessoal** com classes Livro e Estante (empréstimos e devoluções).
15. **Jogo da forca** com categorias e boneco em ASCII.

#### Avançado
16. **Analisador de logs**: ler um arquivo de log e gerar estatísticas de erros por hora.
17. **Organizador de arquivos**: mover arquivos para pastas por extensão (com `pathlib`).
18. **Jogo da velha imbatível** com o algoritmo minimax.
19. **API de tarefas** com FastAPI ou Flask (no computador), com testes automatizados.
20. **Painel de dados** com pandas e Matplotlib a partir de dados abertos do governo (no computador).

> 💡 Publique os projetos que você concluir no GitHub, com um README explicando o que fazem. Eles formam o seu portfólio.
