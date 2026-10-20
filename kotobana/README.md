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
| `tools/build.py` | Gera tudo acima a partir da planilha (`python3 kotobana/tools/build.py`) |

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
