# Vocabulário Essencial — base de dados estruturada

Os 8 arquivos `.docx` de vocabulário ODU Creative (Diego Horta, 2026), baseados na lista Mnemotechnics, extraídos, validados e unificados em um único mapa de dados: as 2.284 palavras mais frequentes do inglês, com equivalentes em 11 idiomas europeus, alertas de tradução, tradução PT-BR curada e baralhos Anki.

## Estrutura

```
vocabulario/
├── dados/
│   ├── vocabulario.json   # mapa completo: 2.284 palavras × 11 idiomas + PT-BR + alertas + metadados
│   ├── vocabulario.csv    # mesma base em formato planilha
│   ├── alertas.csv        # 112 correções (PT 67 · ES 18 · FR 14 · DE 13)
│   ├── faixas.json        # as 10 faixas de frequência
│   ├── frases_exemplo.csv # 10 frases EN → PT das listas pedagógicas
│   └── validacao.json     # resultado das checagens cruzadas e estatísticas
├── anki/EN-XX.tsv         # 11 baralhos prontos para importar no Anki
└── scripts/extrair.py     # extrator reproduzível (docx → dados)
```

Para regenerar: `python3 -I scripts/extrair.py <pasta-com-os-docx> dados` (requer `python-docx`).

## O que cada arquivo original contém (mapa das fontes)

| Arquivo | Conteúdo | Papel na base |
|---|---|---|
| `Vocabulario_Essencial_Multilingue_2284` | 2.284 palavras × EN + 11 idiomas, 10 faixas, 67 alertas PT, roteiro, índice alfabético | **Fonte mestre** |
| `01_…_EN-PT_Portugues` | EN → PT + coluna "Sugestão" para entradas com ⚠ | alertas PT (idênticos ao mestre) |
| `02_…_EN-ES_Espanhol` | EN → ES + PT de referência | 18 alertas ES |
| `04_…_EN-FR_Frances` | EN → FR + PT de referência | 14 alertas FR |
| `06_…_EN-DE_Alemao` | EN → DE + PT de referência | 13 alertas DE |
| `Alta_Frequencia_Ingles_2000_Completo` | 2.000 palavras com tradução PT-BR curada | campo `pt_br` |
| `Alta_Frequencia_Ingles_Expandido` | Top 300 com traduções mais ricas + 9 frases | `pt_br_ampliado` + frases |
| `Alta_Frequencia_Ingles_Pedagogico` | Top 100 + guia de estudo + 1 frase | frases |

A numeração dos volumes (01, 02, 04, 06) indica que existem outros, provavelmente 03 IT, 05 RO e 07–11 para NL/SV/NO/DA/IS. Esses arquivos não foram enviados, e os dados desses idiomas vêm do mestre.

## Validação (19/19 checagens ok)

- O mestre tem exatamente as linhas 1–2284, sem buracos. O índice alfabético (Apêndice A) aponta para o número certo de todas as palavras.
- Os 4 volumes por idioma reproduzem **célula por célula** as colunas do mestre, incluindo o PT de referência.
- Em todos os volumes, as marcas ⚠ da tabela batem exatamente com a lista de alertas, e o campo "No original" de cada alerta confere com a tabela.
- As listas PT-BR (100/300/2000) seguem **a mesma ordem de frequência** do mestre.

## Análise e descobertas

- **25.124 células, 25.123 equivalentes.** O único vazio é `the` em romeno, porque o romeno usa artigo sufixado.
- **Resíduos do Excel:** `true` e `false` vieram como `TRUE`/`FALSE` (e `VERDADEIRO`). No campo `en` eles foram normalizados para minúsculas, e o original fica guardado em `en_original`.
- **Duas camadas de português.** O PT da Mnemotechnics é tradução automática e tem problemas: `can` → "lata", `run` → "corrida", `no` → "nao kk". Já o PT-BR da lista "2000 Palavras" foi revisado à mão. As duas divergem em **537 entradas**, então prefira `pt_br`. Use `pt_br_ampliado` quando quiser mais sentidos, por exemplo `play` → "brincar, jogar, tocar".
- **Os alertas se repetem entre idiomas.** Modais e homônimos falham em todos: `will` → vontade/voluntad/volonté, `may` → maio/mayo/mois de mai, `can` → lata. Por isso, quando não há sugestão, desconfie desses itens nos idiomas sem volume próprio (IT, RO, NL, SV, NO, DA, IS).
- **Equivalentes iguais ao inglês** são um sinal de cognato ou de "não traduzido". Contagens: DA 241, NO 198, FR 193, SV 163, NL 141, RO 129, DE 115, IS 85, ES 62, IT 49, PT 48. Nas germânicas isso costuma ser cognato real (`hand`, `name`). Já em ES/IT/RO/IS, `TRUE` e `I` são falhas.
- **Distribuição dos alertas PT por tipo:** sentido trocado e homônimos lideram, seguidos de forma conjugada, português europeu (`peúga`, `incómodo`), gírias de internet e falsos cognatos (`parcel` → parcela).

## Como aprender com esta base

1. **Importe um baralho** de `anki/` (Arquivo → Importar). A frente é EN e o verso já traz a **forma corrigida**. A sugestão substitui o original quando há alerta, e nos idiomas que não são PT o verso mostra o PT-BR como apoio. As tags `faixa01…faixa10`, `n0001…` e `alerta` permitem estudar por faixa.
2. Ritmo do roteiro original: **20 palavras novas/dia → ~116 dias**. Dê prioridade máxima às faixas 1–3 (1–500), que dão o maior retorno.
3. Revisão espaçada: 1 → 3 → 7 → 21 dias. Agrupe cada bloco em cognatos, conhecidas e novas, e crie uma frase para cada palavra nova.
4. Use `alertas.csv` como exercício de consciência lexical: encontre o erro e explique a causa.

Fonte: [mnemotechnics.org](https://mnemotechnics.org) · Organização e análise: ODU Creative.
