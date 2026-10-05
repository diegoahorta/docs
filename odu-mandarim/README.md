# Mandarim Básico I — Manual de Aulas (Método Chunk) · Odu Creative

Versão em mandarim do manual de japonês da Odu Creative: mesma estrutura (25 lições × 3 pontos gramaticais = 75 pontos) e mesmo visual (legenda de cores, FORMA/FUNÇÃO/MODO, tabela de chunks, ✗ Errado / ✓ Correto, Erro comum e OBS).

- **Arquivo final:** `Mandarim_Basico_I_Metodo_Chunk.docx` (53 páginas, tamanho Carta).
- **Conteúdo:** `content_a.py` (lições 1–12) e `content_b.py` (lições 13–25). Cada exemplo é uma linha `S|ADV|V|O|PART|pinyin|tradução`.
- **Gerar de novo:**
  ```bash
  python3 -c "import json; from content_a import LESSONS_A; from content_b import LESSONS_B; json.dump(LESSONS_A+LESSONS_B, open('content.json','w'), ensure_ascii=False)"
  node build_docx.cjs "05 / 10 / 2026"
  ```
- **Conferência:** `python3 qa.py` compara o pinyin de cada frase com os caracteres (precisa de `pip install pypinyin`). Os avisos restantes são esperados: 儿 do sotaque de Pequim, tons neutros e leituras de 得/地/着.

Diferenças em relação ao manual de japonês:
- As colunas da tabela de chunks seguem a ordem real da frase chinesa (S → ADV → V → O → PART); lendo da esquerda para a direita, lê-se a frase inteira.
- Cada exemplo traz pinyin e tradução.
- Página "Antes de começar" com os 4 tons, as mudanças de tom (3º+3º, 不, 一) e como ler as tabelas.
