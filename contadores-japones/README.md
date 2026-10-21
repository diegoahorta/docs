# 数えよう! Kazoeyou: contadores japoneses

Material interativo para falantes de português estudarem os contadores japoneses
つ, 個, 本, 台 e 枚 (a mesma tabela da aula), de 1 a 10 e a pergunta “quantos?”.

## Como usar

- **Só abrir:** dê dois cliques em `index.html`. Tudo funciona offline, e o progresso fica salvo no navegador.
- **Com o servidor Python:** `python3 contadores.py servir` abre o jogo e salva o progresso em `progresso.json`.

## O que tem

| Parte | O que faz |
| --- | --- |
| **Estudar** | Ficha de cada contador (quando usar, dica de memória, frases), animação de contagem com voz em japonês, grade com as mudanças de som destacadas e a tabela geral. |
| **Revisar** | 55 cartões com repetição espaçada (caixas de Leitner). Teclas: espaço vira, 1/2/3 avaliam. |
| **Jogar** | Mercadinho (quiz com tempo e combo), Qual contador? (classificação em 60 s), Ouvido afiado (escuta) e Memória. |

### Python (`contadores.py`)

```bash
python3 contadores.py servir      # servidor local + API /api/progresso
python3 contadores.py verificar   # gera as leituras pelas regras de som e confere com a tabela
python3 contadores.py quiz        # quiz no terminal
python3 contadores.py anki        # exporta 55 cartões em CSV para o Anki
```

O `verificar` mostra que a tabela inteira sai de três regras (pausa っ; H→P depois de っ;
H→B depois de ん) e que essas mesmas regras já preveem 杯 (いっぱい, さんばい) e 匹 (いっぴき, さんびき).

### Sobre as animações “Flash”

O Adobe Flash Player foi descontinuado em 2020 e nenhum navegador atual o executa.
As animações foram feitas com um pequeno motor em `<canvas>` (classe `Palco`) que segue a
lógica do Flash: palco, sprites (o mascote Kazu, objetos, balões de fala) e *tweens* com
*easing*. Respeita a preferência do sistema por movimento reduzido.
