# Hajimemashite Quest はじめまして

Jogo em HTML para treinar o **primeiro encontro em japonês** (ODU Creative · Japonês A1 · Unidade 8),
com o mesmo formato do jogo de partículas (`../jogo-particulas`): trilha estilo Duolingo, frases em blocos
coloridos, pontuação, música lo-fi, explosões e elementos 3D feitos no Blender.

O conteúdo vem da aula "Primeiro encontro" (.docx e .pptx):

- **Ponto A:** `しつれいですが、X は どちらですか。` com おなまえ, おつとめ, がっこう, ごしゅっしん, おすまい;
  の entre dois nomes (たなかさんの おすまい); respostas com です (パラインです。ABCです。おおさかです。).
- **Ponto B:** números de 0 a 9 para telefone, `でんわばんごうは なんばんですか。`, ditar o número com の no hífen,
  confirmar com `〜ですね。`
- **Diálogos 1 e 2** da aula, cortesia (✕ `おなまえは？` → ✓ `しつれいですが、おなまえは どちらですか。`)
  e o **Final Challenge** com o mapa de 6 etapas: cumprimento → nome → origem → trabalho/escola → telefone → encerramento.

## Como jogar

Abra `hajimemashite-quest.html` no navegador. É um arquivo único, com tudo embutido.
O `index.html` é a mesma versão, mas carrega o Three.js da pasta `vendor/`.
Só as fontes do Google Fonts precisam de internet.

## Método ODU Chunking

Os blocos usam as cores da legenda da aula:

| Papel | Cor | Exemplo |
|---|---|---|
| S: Sujeito (quem/tópico) | azul `#D9EAF7` | わたし |
| V: Verbo (ação/cópula) | verde `#E2F0D9` | です。 |
| O: Complemento (informação principal) | amarelo `#FFF2CC` | おなまえ, パライン |
| P: Partícula (marca função) | lilás `#E4D5F3` | は, の |
| ADV: Expressão (cortesia/contexto) | pêssego `#FCE4D6` | しつれいですが、, どちらですか。 |

O guia de cada ponto segue a estrutura da aula: **FORMA / FUNÇÃO / MODO**, frase-exemplo em blocos,
**✗ / ✓** e **Erro comum**. O feedback das respostas erradas usa o mesmo formato.

## Estrutura do jogo

- **Trilha progressiva:** 3 partes e 11 níveis. Um nível só libera o próximo quando é concluído.
- **4 tipos de exercício:** montar a frase com blocos (com blocos "pegadinha"), completar o bloco que falta,
  completar a próxima fala do diálogo e **ditar o número de telefone** com blocos (dígitos + の + です。).
- **Tanaka-san** é a pessoa que você está conhecendo: ele faz uma reverência (お辞儀) quando você acerta
  e, no Final Challenge, responde às suas perguntas.
- **Pontuação, corações, estrelas, música lo-fi, explosões:** iguais ao jogo de partículas
  (100 pontos × combo, bônus de corações e de lição perfeita, 1 a 3 estrelas por nível).

## Elementos 3D (Blender)

`blender/gerar_modelos.py` gera, com o Blender (bpy):

- `tanaka.glb`: Tanaka-san (óculos, gravata e cartão de visita nas mãos)
- `meishi.glb`: cartão de visita (名刺) que voa nas explosões de acerto
- `telefone.glb`: smartphone da tela inicial
- `no_ativo.png`: botão de nível com balão de fala (cor teal da ODU)
- `dupla.png`: retrato de Daru + Tanaka (usado quando o navegador não tem WebGL)

O mascote Daru, a estrela, o troféu e os botões "concluído/bloqueado" são os mesmos do jogo de partículas.

```bash
pip install bpy
python3 blender/gerar_modelos.py   # gera os modelos
python3 montar_fonte.py            # monta src/jogo.html (motor compartilhado + src/parts/)
python3 build.py                   # gera index.html
python3 build.py --standalone hajimemashite-quest.html
```

## Arquivos

- `src/parts/dados.js`: conteúdo da aula (frases, diálogos, guias, níveis)
- `src/parts/licao.js`: tipos de exercício, verificação e feedback
- `src/parts/cena3d.js`: cena 3D (Daru e Tanaka, cartões, celular, troféu)
- `montar_fonte.py`: junta essas partes com o motor do jogo de partículas e a paleta ODU em `src/jogo.html`
- `build.py`: embute os assets e gera os HTML finais
