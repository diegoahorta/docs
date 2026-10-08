# Pongo Katakana World · トロンバを さがせ！

Jogo de plataforma 2D em pixel art (estilo console de 16 bits) para aprender katakana.
Cada mundo é uma linha: ア カ サ タ ナ ハ マ ヤ ラ ワ(ヲ ン), depois dakuten/handakuten (ガ ザ ダ バ パ)
e o castelo final, onde o Pongo junta ト ロ ン バ e encontra o Senhor Tromba.

- O Pongo precisa pegar os kana **na ordem da linha**; a porta do fim só abre com a linha completa.
- Kana "impostores" parecidos (シ/ツ, ソ/ン, ル/レ, ア/マ…) aparecem no caminho: pegar um conta como erro e o jogo explica a diferença.
- Blocos "?" escondem kana, inimigos podem ser pisados, buracos, canos, nuvens e escadas; 3 vidas por fase.
- Antes de cada mundo: cartão da linha com romaji, dicas e os impostores. No fim: estrelas e leitura da linha.
- Trilha 8 bits original e efeitos gerados ao vivo (ondas de pulso, triângulo e ruído); pronúncia com a voz japonesa do navegador.
- Teclado (← → / ESPAÇO / SHIFT) ou botões de toque no celular.

Abrir `index.html`. Editar `src/game.html` e rodar `python3 tools/build.py`.
Sprites em pixel art: `python3 tools/pixelate.py`.
