# Mika no Hospital

Jogo e flashcards em HTML5 para alunos de inglês A1, feitos a partir das aulas ODU Creative
(*No Hospital — Saúde, Bem-Estar e Sentimentos*, *Present Continuous — Affirmative & Negative*,
*Situações Cotidianas* e *Vocabulário A1*).

## O que tem

- **História**: a Mika vai ao hospital em 7 paradas: casa, recepção, sala de espera, triagem, consulta, farmácia e casa de novo.
  Os diálogos das aulas aparecem com voz em inglês, tradução opcional e 20 desafios de gramática.
- **Flashcards**: 75 palavras em 6 categorias, com cartões que viram em 3D, áudio, direção EN→PT / PT→EN
  e revisão espaçada (novas → aprendendo → dominadas).
- **Mini-jogos**: *Feel, Have ou Hurts?*, *Onde dói?* (toque no corpo), *Como a Mika se sente?*,
  *Memória do hospital* e *Monte a frase* (chunking com a legenda de cores S/V/O/AUX/ADV).
- Personagens 2D estilo anime em SVG com 20+ expressões; fundo 3D em Three.js com objetos em estilo toon.
- O progresso e as estrelas ficam salvos no navegador.

## Como rodar

```bash
python3 tools/build.py --serve        # abre http://localhost:8000
python3 tools/build.py                # gera dist/mika-no-hospital.html (um arquivo só)
```

## Atualizar o vocabulário a partir das aulas (.docx)

```bash
python3 tools/extract_vocab.py Aula_Hospital.docx Vocabulario_A1.docx -o js/data.js
```

O script lê as tabelas *English | Português | Exemplo* das aulas e gera `js/data.js`.

## Arquivos

| Arquivo | Função |
| --- | --- |
| `index.html`, `css/style.css` | página e visual em tons pastel (tema claro e escuro) |
| `js/app.js` | navegação, história, flashcards e mini-jogos |
| `js/content.js` | roteiro da história e bancos de exercícios |
| `js/characters.js` | personagens anime em SVG (Mika, Ren, Hana, Dr. Sato, Kai) |
| `js/backgrounds.js` | cenários da história |
| `js/scene3d.js` | fundo 3D com Three.js |
| `js/data.js` | vocabulário gerado a partir dos .docx |
| `tools/` | scripts Python (extração e empacotamento) |
