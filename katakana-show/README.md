# Katakana Show 🎤

Quiz no estilo **programa de TV** para revisar e fixar o **katakana** e aprender **vocabulário**
em japonês, pensado para turmas do **Fundamental II**. O visual é colorido, com palco, holofotes,
confete e placar. Todo o conteúdo aparece em **japonês + romaji + português**, e o **guia fonético
de romaji** pode ser aberto a qualquer momento.

É um jogo separado do [Nihongo Drops](../nihongo-drops/): não usa o menu 3D nem o progresso de lá.

## Como se joga

1. Escolha **Solo** (12 perguntas) ou **Equipes** (2 a 4 equipes que se revezam, 5 perguntas
   para cada uma; ideal para o projetor da sala).
2. Escolha a **temporada**:

   | Temporada       | Katakana                    | Palavras                   |
   | --------------- | --------------------------- | -------------------------- |
   | 🌟 Estreia      | básicos (ア a ン)           | só com kana básicos e ー   |
   | 🎬 Ao Vivo      | + ゛ e ゜ (ガ, パ…)         | + palavras com ゛゜        |
   | 🏆 Grande Final | + combinações (キャ, シュ…) | + palavras com ッ e ャュョ |

3. As perguntas **alternam leitura de katakana e vocabulário**:
   - **Leitura:** "Como se lê? ホ" e "Qual é o katakana de _shi_?";
   - **Vocabulário:** "O que significa メロン?", "Como se lê ラーメン?", "Como se escreve 🍕
     pizza?" e "Ouça e escolha" (só aparece quando há voz em japonês).
4. As alternativas erradas são feitas para ensinar: **katakana parecidos** (シ/ツ, ソ/ン, ク/ケ/タ)
   e **palavras quase certas** (ピザ × ピサ, テレビ × デレビ).
5. Pontos: 100 por acerto, mais até 50 de bônus de tempo. Há **combo** (3 acertos seguidos = x2,
   6 = x3 e 10 = x4). Cada equipe tem 3 **ajudas** por rodada: ✂️ 50:50, ⏱️ +10 s e 🔊 Ouvir.
6. Depois de cada resposta aparece um cartão com:
   - a resposta certa separada **sílaba por sílaba com o romaji** (コ ko · ー +o · ヒ hi · ー +i);
   - como o som soa em português e a dica mnemônica;
   - uma curiosidade (パン e ボタン vieram do português!);
   - no erro, a comparação com o que foi marcado ("サ (sa) × ザ (za)").
7. No fim: estrelas, recorde, as palavras da rodada e a lista para revisar.

## Guia fonético de romaji (📖)

Sempre disponível na barra do topo. Ele tem 5 abas:

- tabela dos básicos;
- ゛゜;
- combinações;
- **Como falar**: os sons que pegam quem fala português, como shi = "xi", chi = "tchi", r de
  "caro", s sempre "ss", ji = "dji" e te = "tê";
- **Sinais**: ー, ッ e ャュョ.

Ao tocar num kana, você ouve a pronúncia e vê a dica. Abrir o guia durante uma pergunta pausa o
cronômetro, mas a pergunta passa a valer metade dos pontos.

## Álbum e revisão inteligente

- **📒 Álbum de figurinhas**: cada palavra acertada vira uma figurinha. São 78 palavras em 9
  categorias.
- **Revisão inteligente**: o kana ou a palavra que o aluno mais erra aparece mais vezes.
- Recordes, álbum, estatísticas e configurações ficam em `localStorage` (sempre com try/catch).

## Configurações (⚙️)

- tempo por pergunta: 10 s, 15 s, 25 s ou sem cronômetro;
- volume dos efeitos;
- velocidade da voz;
- falar a palavra ao mostrar a resposta;
- animações (seguem o `prefers-reduced-motion`);
- apagar os dados.

## Como rodar

- **Live Server:** abra a pasta `katakana-show/` no VS Code, clique com o botão direito em
  `index.html` e escolha **Open with Live Server**.
- **Arquivo único:** `dist/katakana-show.html` abre com dois cliques, sem servidor. Ele precisa
  de internet por causa do GSAP e das fontes. Para gerar de novo, rode `npm run build:html`. Com
  `node scripts/build-html.js --offline`, o GSAP também vai para dentro do arquivo.

Teclado: **1–4** (ou A–D) respondem, **Enter** vai para a próxima e **Esc** pausa.

## Qualidade de código

```bash
cd katakana-show
npm install
npx eslint .
npx prettier --write .
```

## Estrutura

```
index.html              importmap (GSAP), barra do topo, palco e canvas do confete
src/main.js             troca de telas (início → rodada → resultado) e barra do topo
src/data/katakana.js    tabela, combinações, parecidos, sílabas e romaji das palavras
src/data/palavras.js    78 palavras (kana, português, emoji, categoria, curiosidade)
src/data/fonetica.js    guia "como falar" e sinais ー ッ ャ ゛ ゜
src/quiz/               temporadas, geração das perguntas e pontuação (lógica pura)
src/core/               armazenamento, configurações, placar/álbum, voz e efeitos sonoros
src/ui/                 guia, álbum, configurações, modal, confete, 🔊, animações e CSS
src/telas/              início, rodada (cronômetro, combo, ajudas), feedback e resultado
scripts/build-html.js   gera dist/katakana-show.html
```

Stack: JavaScript (ES Modules, sem bundler), GSAP 3.13.0 pelo jsDelivr, ESLint 10 e Prettier 3.
Fontes: Baloo 2 e Noto Sans JP (Google Fonts).
