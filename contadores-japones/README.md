# 数えよう! Kazoeyou: contadores japoneses

Material interativo para falantes de português estudarem os nove contadores japoneses
つ, 人, 枚, 台, 本, 匹, 杯, 個 e 冊, de 1 a 10 e a pergunta “quantos?”.

- `index.html`: versão atual, em tons pastel, com cenário 3D (Three.js), mascote animado
  em CreateJS (o formato que o Adobe Animate publica) e suporte opcional a Rive.
- `classico.html`: a primeira versão, mais leve, com os cinco contadores iniciais.

## Como usar

- **Só abrir:** dê dois cliques em `index.html`. O progresso fica salvo no navegador. Sem internet, a página continua funcionando com emojis no lugar do 3D e sem o mascote; `classico.html` funciona 100% offline.
- **Com o servidor Python:** `python3 contadores.py servir` abre o jogo e salva o progresso em `progresso.json`.

## O que tem

| Parte | O que faz |
| --- | --- |
| **Estudar** | Ficha de cada contador, objetos 3D que caem um a um enquanto o Kazu conta em voz alta, grade com as mudanças de som destacadas, tabela geral e as 4 regras de som. |
| **Revisar** | 99 cartões com repetição espaçada (caixas de Leitner). Teclas: espaço vira, 1/2/3 avaliam. |
| **Jogar** | Mercadinho (quiz com tempo e combo), Qual contador? (classificação em 60 s), Ouvido afiado (escuta) e Memória, com pétalas de sakura e cut-ins de anime nos combos. |

### Python (`contadores.py`)

```bash
python3 contadores.py servir      # servidor local + API /api/progresso
python3 contadores.py verificar   # gera as leituras pelas regras de som e confere com a tabela
python3 contadores.py quiz        # quiz no terminal
python3 contadores.py anki        # exporta 99 cartões em CSV para o Anki
```

O `verificar` mostra que a tabela inteira (99 leituras) sai de poucas regras: a pausa っ em
1, 6, 8 e 10 (com S, só 1, 8 e 10); H→P depois de っ; H→B depois de ん; e as formas
nativas de 人 (ひとり, ふたり, よにん). A página usa exatamente as mesmas regras em JavaScript.

## Animação

| Tecnologia | Onde aparece |
| --- | --- |
| **Three.js** (r128) | Palco 3D com cel shading de anime (MeshToonMaterial + contorno), 27 objetos modelados em código, pétalas de sakura, arrastar para girar, tocar num objeto para ouvir. |
| **CreateJS** (runtime do Adobe Animate) | O mascote Kazu é um `MovieClip` com linha do tempo e rótulos `parado`, `feliz`, `triste` e `falar`, no mesmo formato que o Animate exporta. Também faz as pétalas, brilhos e os cut-ins “すごい！”. |
| **Rive** | Opcional: veja `rive/LEIA-ME.md`. |

O Adobe Animate é um programa de desenho; aqui o personagem foi escrito direto no formato
de publicação dele (CreateJS), então dá para abri-lo como referência ou trocá-lo por um
símbolo `lib.Kazu` desenhado no Animate. O Rive precisa de um arquivo `.riv` feito no editor
do Rive, que não existe neste repositório ainda; a página já sabe carregá-lo.

As bibliotecas vêm de CDN (jsDelivr), então a primeira abertura precisa de internet.
Respeita a preferência do sistema por movimento reduzido.
