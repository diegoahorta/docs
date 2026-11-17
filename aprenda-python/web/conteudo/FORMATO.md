# Formato dos arquivos de conteúdo

Cada módulo do curso é um arquivo `.md` nesta pasta, listado em `indice.json`.
O app lê esses arquivos em tempo de execução, então **para adicionar ou corrigir
uma lição basta editar o `.md`** (e rodar `node tools/validar.js`).

## Estrutura

````text
# Título do módulo
id: m01
nivel: Iniciante            (Iniciante | Básico | Intermediário | Avançado | Projetos)
icone: 🚀
descricao: Uma frase sobre o módulo.

## Título da lição
fonte: Python do Zero p. 4; Pense em Python cap. 1

Texto da lição em Markdown simples...

```python
print("Bloco executável: vira um mini-editor com botão ▶ Executar")
```

### Exercício
Enunciado do exercício (Markdown).

```python inicial
# código que aparece no editor para o aluno começar
```

```python solucao
# solução de referência (o aluno pode revelar)
```

```python teste
# roda DEPOIS do código do aluno, no mesmo namespace.
# A variável `saida` contém tudo o que o código do aluno imprimiu.
assert soma(2, 3) == 5, "soma(2, 3) deveria dar 5"
```

## Quiz
? Pergunta 1
- [ ] opção errada
- [x] opção correta
- [ ] outra errada
> Explicação mostrada depois da resposta.
````

## Markdown suportado nas lições

- `### Subtítulo` e `#### Sub-subtítulo` (não use `#`/`##` dentro de lições)
- parágrafos, `**negrito**`, `*itálico*`, `` `código` ``, links `[texto](https://...)`
- listas `- item` e `1. item`, tabelas `| a | b |` (para um `|` dentro de uma célula, escreva `\|`)
- `> 💡 dica` (caixa de dica) e `> ⚠️ atenção` (caixa de alerta)
- blocos de código: ```` ```python ```` (executável), ```` ```python erro ```` (executável e
  **deve** gerar erro — para mostrar mensagens de erro), ```` ```python nao-executar ````
  (só exibição: código que usa bibliotecas externas, rede, laço infinito proposital etc.),
  ```` ```text ````, ```` ```bash ```` (só exibição).

## Regras

- O Python disponível offline é o CPython 3.14 (Pyodide) com a **biblioteca padrão** —
  sem pandas, numpy, requests, sqlite3, tkinter, threads reais ou rede.
- `input()` funciona no app (abre uma caixa de diálogo). No validador ele sempre recebe `"5"`.
  Exercícios **não** devem depender de `input()`: peça funções que recebem parâmetros.
- O teste deve falhar com o código inicial e passar com a solução (o validador confere).
- Mensagens de `assert` em português, claras, dizendo o que era esperado.
