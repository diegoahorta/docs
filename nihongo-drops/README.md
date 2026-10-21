# Nihongo Drops 🌸

Coleção de minijogos no navegador para aprender **hiragana** e **katakana**, pensada para
iniciantes absolutos que falam português. Todo o conteúdo aparece em **japonês + romaji +
português**, e o romaji pode ser desligado nas configurações.

## Stack

| Ferramenta              | Papel                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| JavaScript (ES Modules) | Toda a lógica, sem bundler, TypeScript ou frameworks               |
| Phaser 3.90.0           | Os minijogos 2D                                                    |
| Three.js 0.180.0        | O menu principal em 3D (ilha com torii e kana flutuando)           |
| GSAP 3.13.0             | Transições, feedback de acerto/erro e animação da ordem dos traços |
| ESLint 9 + Prettier 3   | Código limpo e padronizado (`eslint.config.js` e `.prettierrc`)    |
| Live Server (VS Code)   | Servidor local para testar                                         |

As bibliotecas vêm do jsDelivr com versões fixadas, por meio do `<script type="importmap">`
do `index.html`. Não há etapa de build.

## Como rodar

1. Abra a pasta `nihongo-drops/` no VS Code. Ela pode ser a raiz do workspace ou uma subpasta dele.
2. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.
3. O navegador abre em `http://127.0.0.1:5500/` (ou em `/nihongo-drops/index.html`).

> É preciso usar um servidor HTTP: abrir o arquivo direto (`file://`) não funciona com ES Modules.
> O primeiro carregamento precisa de internet, por causa do CDN e do Google Fonts.

### Qualidade de código

Requer Node.js 20.19 ou superior (recomendado: 22 LTS).

```bash
cd nihongo-drops
npm install          # instala ESLint e Prettier (só para desenvolvimento)
npx eslint .         # deve terminar sem erros
npx prettier --write .
```

## Estrutura

```
index.html            importmap, contêineres do HUD, das telas, do feedback e dos modais
src/main.js           inicialização e navegação entre o menu 3D e os jogos
src/router.js         troca de telas com cortina GSAP; destrói a tela anterior
src/menu3d/           cena Three.js (ilha, torii, kana flutuantes, pontos das fases)
src/games/            catálogo, host do Phaser, painéis HTML comuns e uma pasta por jogo
  kana-rain/          cena Phaser, lógica pura, gota, cenário, barra de digitação e painéis
src/data/             kana.js, vocab.js, kanji.js e strokes.js (ordem dos traços)
src/core/             armazenamento, configurações, SRS, progresso, conquistas, voz, áudio
src/ui/               HUD, modais, feedback, botão 🔊, tabela de estudo, ordem dos traços, CSS
assets/               imagens (favicon), sfx/ e fonts/ reservados para uso futuro
```

## Pedagogia

- **SRS estilo Leitner** (`src/core/srs.js`):
  - Cada kana fica em uma de 5 caixas.
  - Acertar uma revisão vencida sobe uma caixa; errar volta para a caixa 1.
  - Caixas baixas e itens vencidos aparecem mais.
  - Os grupos (あ行, か行…) são liberados aos poucos.
- **Pronúncia**: Web Speech API com `lang: 'ja-JP'` e botão 🔊 em todo caractere. Se não
  houver voz japonesa no sistema, as configurações explicam como instalar.
- **Feedback imediato**: no acerto aparecem pétalas e "+10"; no erro, um cartão mostra a
  resposta certa e a dica mnemônica.
- **Progresso** em `localStorage`, sempre com try/catch: XP, nível, streak diário,
  conquistas e recordes.

## Acessibilidade e desempenho

- O menu 3D tem uma lista de botões em HTML equivalente, para teclado, leitor de tela e
  navegadores sem WebGL.
- O kana usa fonte grande e o tema tem contraste AA. O foco fica sempre visível.
- A opção "Animações" segue o `prefers-reduced-motion` ou a escolha do jogador.
- Só uma tela existe por vez. Ao trocar de tela:
  - o menu libera geometrias, materiais, texturas e o contexto WebGL;
  - os jogos chamam `game.destroy(true)`.

## Roteiro

1. ✅ Base: menu 3D, progresso, SRS, tabela de estudo com ordem dos traços
2. ✅ Kana Rain: os hiragana caem e você digita o romaji. A velocidade cresce a cada 5 acertos e há 3 vidas
3. ⏳ Memory Kana
4. ⏳ Katakana Runner
5. ⏳ Pares de Kana (hiragana ↔ katakana)
6. ⏳ Palavra Cruzada

## Créditos e licenças

- Ordem dos traços: [KanjiVG](https://kanjivg.tagaini.net), © Ulrich Apel, licença
  [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Os dados estão em
  `src/data/strokes.js`, que segue a mesma licença.
- Fonte: [Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP) (SIL Open Font
  License), carregada pelo Google Fonts.
