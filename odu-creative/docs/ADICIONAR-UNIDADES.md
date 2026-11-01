# Como adicionar novas unidades

Toda unidade é **um único arquivo JSON** (`units/<id>/unit.json`) + seus áudios. O motor não tem
conteúdo fixo no código: trocar o JSON troca idioma, nível, textos, gramática, exercícios e jogo.

## Caminho rápido (sem programar)

1. Abra **Painel do professor → Unidade → Duplicar como nova unidade**.
2. Edite identificação, falas e traduções, gramática e atividades nas abas do painel.
3. Em **Áudio e transcrição**, importe a gravação de cada faixa e marque os tempos com a
   *Ferramenta de marcação* (ou importe um WebVTT/SRT).
4. Clique em **Exportar unidade (JSON)**.

A unidade já funciona no navegador onde foi criada. Para publicá-la para todos:

5. Crie `units/<id>/unit.json` com o JSON exportado e coloque os áudios em `units/<id>/audio/`
   (os áudios importados no painel ficam no navegador; exporte-os do seu editor de áudio original).
6. Registre em `units/index.json`:
   ```json
   { "id": "<id>", "title": "…", "language": "…", "level": "…" }
   ```
7. Gere as apostilas com `node tools/build-docx.mjs units/<id>` e rode `npm test`
   (para validar a nova unidade, copie `tests/unit-content.test.mjs` trocando o caminho da unidade).

Abra `index.html?unit=<id>` para carregar diretamente.

## Formato do `unit.json` (campos principais)

| Campo | Descrição |
|---|---|
| `id`, `title`, `subtitle`, `unitNumber` | Identificação. |
| `language` | `{ "code": "ja", "bcp47": "ja-JP", "name": "Japonês" }` — `bcp47` define a voz do navegador e o reconhecimento de fala. |
| `level`, `age`, `skills`, `communicativeGoal`, `objectives[]` | Configuração do projeto. |
| `labels.discover`, `labels.rule` | Títulos das seções (ex.: `"DISCOVER THE PATTERN \| 文法のルールを見つけよう"`, `"THE RULE \| ルール"`). |
| `config` | `passThreshold` (0–1), `consolidateAfter`, `srsIntervalsDays[]`, `responseTimeSeconds`. |
| `voices` | Por falante: voz do espeak-ng (para `build-audio`) e `browserHint` (`female`/`male`). |
| `vocabulary[]` | `term`, `pron`, `pt`, `example`, `category`. |
| `menu` | Dados de leitura usados pelo jogo (pode virar horário de trem, cardápio, mapa…). |
| `tracks[]` | Faixas de listening: `situation`, `goal`, `audio`, `segments[]` (`id`, `speaker`, `text`, `pt`, `start`, `end`), `gist[]`/`detail[]` (ids de questões). |
| `discover` | `sentences[].chunks` (`[texto, papel]`), `questions[]`, `reorder[]`, `hypothesisKeywords[]`, `pattern[]`, `ruleSteps[]`. |
| `grammar[]` | `id`, `name`, `function`, `form`, `explanation`, `table`, `examples[]` (`type`: affirmative/negative/interrogative), `comparison`, `commonErrors[]`, `usage`, `pronunciation`, `check`. |
| `questions[]` | Banco de questões (ver tipos abaixo). |
| `reviewItems[]` | Questões em **contextos novos** para a revisão espaçada (`context`). |
| `game` | `missions[].steps[]`: `npc`, `npcPt`, `choices[]` (`text`, `ok`, `fb`), `match` (para escrita/fala), `pay`, `ticketDone`, `end`. |
| `speaking` | `repeatSegments`, `shadowTrack`, `substitution`, `respond[]`, `create`. |
| `writing`, `assessment`, `references[]` | Produção escrita, referência de prova, bibliografia. |
| `lines` | Gerado por `build-audio`: mapa de frases isoladas → MP3. |

### Tipos de questão

| `type` | Campos | Correção |
|---|---|---|
| `mcq` | `options[]`, `answer` (índice), `distractors{índice: justificativa}` | exata |
| `tf` | `answer` (true/false) | exata |
| `gap` | `text` com `___`, `answers` = uma lista de alternativas por lacuna | normalizada |
| `order` | `tiles[]`, `answers[]` | normalizada |
| `transform` | `source`, `answers[]` | normalizada (pontuação final opcional) |
| `match` | `pairs[[pergunta, resposta]]` | por par |
| `produce` | `criteria[]` (`pattern` regex, `check`: `articles`/`lines3`, `optional`), `model`, `multiline` | critérios verificáveis — nunca “nota de qualidade” |

Campos comuns: `id`, `stage` (`listening`, `A`, `B`, `C`, `D`, `exam`), `skills[]` (alimentam a revisão
espaçada), `prompt`, `explanation`, `review` (id da gramática), `audio` (`{track, segments[]}`), `examPart`.

Nomes legíveis de skills que não são ids de gramática: adicione `"skillNames": { "minha-skill": "Nome" }`.

## Outros idiomas

O motor é agnóstico de idioma; alguns cuidados por língua:

- **Japonês**: use `labels` com os subtítulos em japonês. Para furigana, escreva o texto com `<ruby>`
  no campo `text` **e** forneça `kana`/`romaji` por segmento; o recurso de exibir/ocultar romaji
  precisa ser ligado no `player.js` (campo previsto, ainda não renderizado nesta versão).
  Questões no estilo JLPT: use `examPart` (ex.: `"JLPT N5 — 文法"`) com conteúdo original.
- **Coreano**: registre o nível de formalidade em `grammar[].table` (해요체 / 합니다체 / 반말).
- **Mandarim**: inclua `pinyin` com marcas de tom em `vocabulary[].pron` e nos exemplos.
- **Francês/inglês**: use `pron` (IPA) e `pronunciation` para ligações e sons difíceis.

A correção de artigos (`check: "articles"`) e as regras a/an são específicas do inglês;
para outros idiomas, use critérios por `pattern`.
