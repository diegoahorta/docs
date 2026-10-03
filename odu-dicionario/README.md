# Dicionário ODU (Japonês ⇄ Português)

Site de página única da ODU Creative para buscar vocabulário em japonês (kana, kanji ou romaji) ou em português.

Abra `index.html` direto no navegador; não precisa de build nem de servidor.

## Conteúdo

- Livro de vocabulários A1 (lições 1–10) e A2 (lições 11–20)
- Aula いろいろなぶん: 29 verbos, substantivos, adjetivos e as frases em blocos (Método ODU Chunking)
- Lista "Japonês com Yotsubato" (família, comida, cores, números, natureza, tempo, casa, pronomes, frases)

Palavras repetidas entre materiais viram um único verbete, com cada sentido marcado pela fonte.

## Recursos

- Busca em kana, kanji, romaji (aceita `ohayo`/`ohayou`, `si`/`shi`) ou português (ignora acentos)
- Modos Tudo / Japonês → PT / PT → Japonês
- Filtros por material, lição/categoria, classe gramatical e índice あかさたな
- Verbos com forma de dicionário, forma ～ます e grupo
- Frases da aula em blocos coloridos (substantivo, partícula, verbo, adjetivo)
- Áudio pela voz japonesa do navegador, favoritas (salvas no navegador) e palavra do dia
- Link direto para um verbete: `index.html#p123`

## Como adicionar palavras

Edite o bloco `<script type="text/plain" id="dict-data">` em `index.html`. Cada linha é:

```
kana|kanji|português|classe|padrão de uso|nota
```

Classes: `s` substantivo, `v1`/`v2`/`v3` verbo (grupo), `ai` adjetivo-い, `ana` adjetivo-な, `adv`, `pron`, `int` interrogativo, `expr`, `suf`, `num`, `conj`.
Verbos podem ser escritos na forma ～ます ou de dicionário; a outra forma é gerada automaticamente.
Uma linha `@A1-3` muda a fonte das linhas seguintes (`@A2-12`, `@AULA`, `@Y-Categoria`, `@FRASES`).
