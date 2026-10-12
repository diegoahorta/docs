# Análise dos PDFs de pronúncia

Fonte: Google Drive do usuário.

| Arquivo | Origem | Páginas |
|---|---|---|
| `Aula Bônus - Pronúncia.pdf` | Curso de Inglês Victor Riva 2.0, "Pronunciation" | 2 |
| `Aula Bônus - Pronúncia Parte 2.pdf` | Curso de Inglês Victor Riva 2.0, "Pronunciation, Part 02" | 2 |

## Parte 1: sons que o brasileiro costuma errar

| Tópico | O que o PDF ensina | Palavras | Frase-modelo |
|---|---|---|---|
| Syllable stressing | Toda palavra tem uma sílaba forte | television, computer, manager, interesting, police, phone | (nenhuma) |
| "th" | TH suave /θ/ e TH "buzzy" /ð/ | thank you, thanks, three, think, something / this, that, father, mother, together, with | *Their father and mother are thinking about something to do together.* |
| Letra "r" | Sempre o R retroflexo, o "R caipira" | door, park, car, bird, rock, rare, really | *I parked my car around the corner.* |
| Letra "t" | T forte; T como "d"/"r" entre vogais; T mudo depois de N; T glotal | talk, take, table, top / water, daughter, computer, later, better / twenty, internet, interview, advantage, winter / mountain, fountain, certain, button, forgotten | *My daughter left the water fountain on the table.* |
| "L" | L inicial; L no meio/fim; L mudo | light, letter, love, like / milk, Brazil, travel / walk, talk | *I'm travelling to Brazil to talk to the love of my life.* |
| Double "e" | EE = "i" longo | sleep, cheese, green, free, meet, sixteen, street, feet, teeth | (nenhuma) |
| Double "o" | OO como "u", como "ó" e como "ã" | book, cook, foot, wood, good, look / door, poor, floor / blood, flood | *I'm looking for a good book about cooking.* |

## Parte 2: homófonos

15 grupos, cada palavra com uma frase de exemplo: buy/bye/by, know/no, hear/here,
right/write, I/eye, hi/high, hour/our, meet/meat, peace/piece, sun/son, see/sea,
too/two, week/weak, where/wear, your/you're. Mais 5 conjuntos de letras e números
que soam como palavras: You–U, Be–Bee–B, See–C, Too–2, For–Four–4.

## Abordagem didática

- O material explica os sons do inglês **a partir do português** (R caipira, T como
  "d" ou "r", OO como "u", OO como "ã"). Essa é a ideia central que o sistema manteve.
- Cada tópico é uma lista de palavras agrupadas por regra, seguida de uma frase que
  junta os sons. Não há exercícios, áudio nem transcrição fonética.
- A variante descrita é o inglês americano (flap T, T mudo depois de N, R retroflexo).

## Lacunas e como o sistema trata cada uma

1. **Sem transcrição fonética.** Cada palavra ganhou IPA americano e uma aproximação
   em português.
2. **Sílaba tônica sem marcação.** No texto extraído não há indicação da sílaba forte
   (provavelmente era cor ou negrito). O sistema destaca a sílaba e faz dela um exercício.
3. **Grafia mista.** *travelling* (britânico) em um material de pronúncia americana.
   A frase foi mantida e a diferença sinalizada.
4. **Palavras com mais de uma pronúncia.** *with* (/wɪð/ ou /wɪθ/), *poor* (/pʊr/ ou
   /pɔːr/), *our* (pode soar como *are*). Viraram observações nas lições.
5. **Homófono ausente.** O trio clássico é *to / too / two*; o PDF traz só *too / two*.
6. **Sem frase para EE nem para a sílaba tônica; sem pares de contraste.** Foram
   acrescentados (marcados como "extra"), por exemplo *sheep × ship*, *think × sink*.
7. **Sem prática.** Cada lição tem exercícios com correção imediata, e há um desafio
   misto de 10 perguntas.

## O sistema (`index.html`)

- Carrossel 3D (three.js r128) com um bloco por lição e uma esfera central com anel
  de barras que reage enquanto a voz fala. Arrastar gira; tocar num bloco abre a lição.
- 8 lições na ordem do material, cada uma com: explicação, "como fazer com a boca",
  "erro comum de brasileiro", palavras clicáveis com áudio, frase-modelo com
  destaque palavra a palavra, pares de contraste e exercícios.
- Áudio pela Web Speech API do navegador (voz em inglês selecionável, velocidade
  ajustável, modo "devagar"; voz em português para os pares inglês × português).
- Progresso salvo no navegador (localStorage); lição concluída com 80% de acerto.
- Funciona sem 3D (WebGL indisponível) e sem voz, com avisos; respeita
  `prefers-reduced-motion`, tema claro/escuro e telas de celular.

Para usar: abra `index.html` em um navegador moderno (Chrome, Edge ou Safari têm as
melhores vozes).
