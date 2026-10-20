# Kotobana — vocabulário dos livros 1–6

Análise, codificação e mapa das **2.094 palavras** do glossário oficial *Kotobana 1–6* (`fonte/Kotobana_glossario_1-6_20240108.xlsx`), com ferramentas para estudar e memorizar.

| Arquivo | O que é |
|---|---|
| `dados/vocabulario.json` | Base completa, uma entrada por palavra, com todos os campos codificados |
| `dados/vocabulario.csv` | Mesma base em tabela (abre no Excel / Google Sheets) |
| `dados/anki_kotobana.tsv` | Baralho pronto para importar no Anki (tags por livro, lição, importância e classe) |
| `dados/estatisticas.json` | Contagens, inconsistências da fonte e homógrafos |
| `MAPA.md` | Mapa completo: livro → lição → palavras (★★★ primeiro) |
| `estudo.html` | App de flashcards com repetição espaçada e acento tonal desenhado |
| `site/` | **Kotobana Dojo**: site completo para aprender, estudar, memorizar e jogar (HTML5 + JavaScript + three.js) |
| `tools/build.py` | Gera tudo acima a partir da planilha (`python3 kotobana/tools/build.py`) |
| `tools/build_site.py` | Gera `site/js/vocab.js` com as 2.094 palavras |
| `tools/servidor.py` | Servidor local do site, com progresso do aluno salvo em `progresso/<aluno>.json` |

## Esquema de codificação

Cada palavra recebe um código estável: **`KB{livro}-L{lição}-{nº}`**, ex. `KB3-L27-0002` = livro 3, lição 27, linha nº 2 da planilha (すし). O número da planilha garante unicidade mesmo para homógrafos.

| Campo | Valores |
|---|---|
| `importancia` | 3 = ★★★ (essencial), 2 = ★★, 1 = ★ |
| `classe` | `SUB` substantivo · `V1` verbo grupo 1 (godan) · `V2` grupo 2 (ichidan) · `V3` grupo 3 (する/くる) · `ADJ-I` adjetivo-i · `ADJ-NA` adjetivo-na · `ADV` advérbio · `CONJ` conjunção · `EXP` expressão · `AFX` afixo (～, inferido) · `NC` sem classe na fonte |
| `acento` | Número do acento tonal por palavra: `[0]` heiban (sem queda), `[1]` atamadaka, `[n]` queda após a n-ésima mora. Variantes separadas por `/`, palavras de uma frase por `-` |
| `acento_detalhe` | Tipo (heiban / atamadaka / nakadaka / odaka) por variante e palavra |
| `escrita` | hiragana / katakana / kanji / latino |
| `estrangeirismo` | Língua e palavra de origem dos gairaigo, extraídas do romaji |
| `avisos` | Problemas encontrados na fonte |

## Análise

**Por livro:** 1: 742 · 2: 284 · 3: 227 · 4: 261 · 5: 266 · 6: 312. O livro 1 concentra 35% do vocabulário, quase todo nas lições 1–5 (535 palavras: temas de apresentação, família, números, comidas, lugares).

**Lições mais densas:** L2 (152), L1 (127), L3 (98), L5 (80), L4 (78), L60 e L14 (55), L53 (53), L17 (50).

**Importância:** ★★★ 1.075 (51%) · ★★ 496 · ★ 521. Começar pelas ★★★ cobre metade do glossário com o vocabulário mais útil.

**Classes:** substantivos 1.445 (69%) · verbos 280 (V1 144, V2 68, V3 68) · expressões 88 · adjetivos 117 (イ 79, ナ 38) · afixos 66 · advérbios 57 · conjunções 12.

**Escrita:** 760 palavras com kanji, 740 só em hiragana, 552 só em katakana. Os 552 estrangeirismos vêm sobretudo do inglês (534); há também italiano (7), francês, espanhol e português (3 cada) e alemão (2).

**Acento tonal (1ª variante):** heiban 677 · atamadaka 665 · nakadaka 614 · odaka 118 · sem marcação 19.

**Homógrafos** (mesma grafia, sentidos diferentes, todos mantidos): 開く, かける (3×), あげる, おくる, かぜ, こい, はし, ふく, とる, なる, つける, 止める, etc. — lista completa em `estatisticas.json`.

**Inconsistências da fonte** (preservadas e sinalizadas, nada foi inventado):
- `５月` e `４月`: sem livro e lição → código `KB0-L00-…`
- `7月`: livro 1 sem lição → `KB1-L00-0899`
- `～ちゃん`: lição 34 sem livro → livro 4 inferido pela faixa de lições
- `～方` e `黄金色`: sem importância
- Alguns livros/lições vinham como texto (`'3'`, `'21'`) e foram normalizados para número.

## Como estudar

1. **App (`estudo.html`)** — abra no navegador. Filtre por livro, lição, importância e classe; escolha a direção (日本語 → português ou o inverso). Cada resposta é avaliada em Errei / Difícil / Bom / Fácil e o intervalo de revisão se ajusta (SM‑2 simplificado). A palavra conta como “memorizada” com intervalo ≥ 21 dias. A resposta mostra o acento: linha = tom alto, degrau = queda.
2. **Anki** — Arquivo › Importar `dados/anki_kotobana.tsv`. Use as tags (`livro1`, `licao05`, `imp3`, `V1`…) para criar baralhos filtrados.
3. **Sugestão de ritmo:** 20 palavras novas/dia, ★★★ primeiro, seguindo a ordem das lições. As 1.075 ★★★ ficam vistas em ~8 semanas.

## Kotobana Dojo (site)

```bash
python3 kotobana/tools/build.py        # planilha -> dados/
python3 kotobana/tools/build_site.py   # dados/ -> site/js/vocab.js
python3 kotobana/tools/servidor.py --aluno maria   # http://localhost:8000
```

**Arquivo único:** `kotobana-dojo.html` tem o site inteiro (dados, CSS, JS e three.js embutidos). Abra com dois cliques, funciona offline. Para regenerar: `python3 kotobana/tools/build_single.py --three caminho/three.min.js` (sem `--three`, tenta baixar do cdnjs).

Sem o servidor, o site também funciona aberto por qualquer servidor estático (o progresso fica só no navegador).

| Área | O que o aluno faz |
|---|---|
| **Aprender** | Navega livro → lição, vê cada palavra com leitura, acento tonal desenhado, romaji, classe e nota; ouve a pronúncia (voz japonesa do navegador); modo apresentação uma a uma; marca palavras como vistas |
| **Estudar** | Flashcards com repetição espaçada (SM‑2 simplificado): revisões vencidas primeiro, depois novas (★★★ primeiro); notas Errei/Difícil/Bom/Fácil com o intervalo previsto; atalhos de teclado |
| **Memorizar** | Quiz de 10 perguntas misturando significado, palavra, leitura, escrita em romaji (aceita Hepburn/Kunrei e vogal longa como *oo*/*ou*) e audição; erros voltam para a revisão |
| **Jogar** | Dois jogos em three.js: **灯籠 Lanternas** (toque a lanterna com o significado certo antes que ela suba; vidas, níveis e combo) e **かるた Karuta** (jogo da memória 3D palavra ↔ significado sobre o tatame) |
| **Progresso** | Nível e XP, sequência de dias, atividade dos últimos 28 dias, mapa das 60 lições, 10 conquistas e busca no glossário inteiro |

Arquitetura: `js/core.js` concentra dados, progresso, SRS, XP, acento e voz; cada área é um módulo (`learn.js`, `study.js`, `quiz.js`, `play.js`, `progress.js`), os jogos ficam em `game-lanterns.js` e `game-karuta.js` com utilidades em `three-util.js`. O three.js (r128) vem do cdnjs.
