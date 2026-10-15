# Odu Creative Alunos

Portal onde os alunos acessam os jogos da Odu Creative. Todos os jogos abrem **na mesma janela do app**.

- `site/index.html`: versão pronta para hospedar (Netlify, Vercel, GitHub Pages ou a pasta `public/` de um projeto Lovable). É um arquivo só, sem instalação.
- `index.html`: o mesmo app sem o esqueleto `<html>/<head>`, usado como Artifact.

## Para o aluno

1. Entra com nome, ano escolar, turma e um símbolo (um dos 16 Odù). Não precisa de senha nem de e-mail.
2. Vê os jogos indicados para o seu ano e pode filtrar por disciplina, ano ou nome.
3. Ganha de 0 a 3 estrelas por partida e desbloqueia 8 conquistas. O histórico fica na aba Conquistas.
4. Vários alunos podem usar o mesmo aparelho: cada nome e turma tem o seu próprio progresso.

## Jogos incluídos

| Jogo | Disciplina | Anos | 3 estrelas |
| --- | --- | --- | --- |
| Tabuada do Baobá | Matemática | 2º–6º | 9 ou 10 acertos em 10 |
| Palavras que vieram da África | Língua Portuguesa | 3º–9º | 9 ou 10 acertos em 10 |
| Ayò (semeadura iorubá) | História e Cultura | 3º–9º | vencer o computador |
| Memória dos Odù | Raciocínio | 1º–9º | até 12 jogadas |

Os conteúdos dialogam com a Lei 10.639/2003 (história e cultura afro-brasileira na escola).

## Para o professor: adicionar jogos do oducreative.com

1. Abra a aba **Professor**, preencha nome, link, disciplina e anos.
2. **Testar neste aparelho** abre o jogo dentro do app para conferir.
3. **Copiar código do jogo** gera uma linha como esta; cole na lista `CATALOGO` do `index.html` e publique:

```js
{ id: "caca-palavras", title: "Caça-palavras", subj: "Língua Portuguesa", min: 3, max: 5, time: "10 min",
  desc: "Encontre palavras da capoeira.", url: "https://oducreative.com/jogos/caca-palavras/" },
```

Para o jogo abrir **dentro** do app, o servidor do oducreative.com precisa enviar:

```
Content-Security-Policy: frame-ancestors 'self' https://ENDERECO-DO-APP
```

e não enviar `X-Frame-Options`. Sem isso, depois de 7 segundos o aluno vê um aviso com "Tentar de novo" e "Abrir em nova aba".

## Limitações

O progresso fica no navegador do aparelho (`localStorage`). Para o professor acompanhar as estrelas da turma inteira, o próximo passo é um back-end com login (ex.: Supabase no Lovable).
