# INK: Nova São Paulo, 3030

Beat 'em up de plataforma em HTML5 (JavaScript + Three.js) baseado no dossiê de universo de INK
(`assets/ink/dossie-ink.docx`, criação de Diego Horta). Usa o mesmo motor do jogo
*Boulos vs Ratus Nunes* (`jogo/`), adaptado para a personagem, a facção de Albus e Nova São Paulo.

## História

Em 3030, Nova São Paulo pertence ao prefeito Albus e ao filho dele, Alpha. Uma mulher sem memória
desperta à beira de uma represa poluída em Excidium Grajaú, as ruínas do massacre ordenado pela
família Albus. Uma tinta negra viva cobre o corpo dela; uma criatura viscosa a chama de "minha filha";
um fragmento de memória mostra lentes vermelhas e dois disparos: "Blam, blam". INK vai atrás de
vingança, cruza com o delegado Bill na Viela das Ratazanas e sobe até o Centro de Poder para
enfrentar Alpha. Os mistérios do dossiê (quem era INK, a criatura, Albus) ficam abertos no final.

## Fases

1. **Excidium Grajaú: a represa**: ruínas, lama e poças de água contaminada (machucam), um caminhão
   enferrujado e um andaime como plataformas. Chefe: Caçador Alfa-7.
2. **Viela das Ratazanas: a muralha**: chuva, asfalto molhado com reflexos de neon, viatura e
   limusine como plataformas. O delegado Bill aparece. Chefe: a Unidade de Controle de Multidão
   (pisão com onda de choque e reforços).
3. **Centro de Poder: a torre de Albus**: chefe final Alpha (golpes de bastão, investida, tiros
   "Blam, blam" e reforços de caçadores e soldados).

## Inimigos (facção de Albus)

- **Agente de repressão**: rápido, bastão elétrico.
- **Soldado blindado**: lento e forte; o escudo bloqueia golpes fracos de frente (ataque pelas costas
  ou com o golpe final do combo, a voadora ou a Explosão Simbionte).
- **Caçador cibernético**: o mais rápido, ataca com as garras.

## Controles

Os mesmos do jogo do Boulos: setas/WASD andam, Espaço/K pula, J/Z golpeia (4 seguidos fazem o combo
de garras de tinta; no ar, voadora), L/X pega e arremessa garrafa ou pedra, U/C solta a
**Explosão Simbionte** com a energia cheia, Esc pausa, M troca a música, V liga o efeito CRT, F tela cheia.
Há controle de toque no celular e suporte a controle de videogame.

## Como rodar

- **Arquivo único:** `ink/dist/ink.html`, abre direto no navegador.
- **Desenvolvimento:** `python3 -m http.server 8000` na raiz do repositório e abra `http://localhost:8000/ink/`.

Para gerar de novo:

```bash
python3 ink/ferramentas/processar_sprites.py   # recorta as artes de assets/ink
node ink/ferramentas/gerar_html_unico.mjs       # gera ink/dist/ink.html
```

## Artes

As artes ficam em `assets/ink/`: os movimentos da INK (andar, correr, saltar), a facção de Albus
(agente, soldado blindado, caçador), o robô de controle de multidão, os NPCs e veículos voadores,
os três cenários de Nova São Paulo e os retratos de Bill e Alpha.

A folha da INK não tem quadros de golpe, então os golpes usam as poses de corrida e salto, e o jogo
desenha as garras de tinta (azul e roxo) por cima. O Alpha em combate usa a arte do agente de
repressão em tamanho maior, porque não há folha de corpo inteiro dele. O retrato da criatura
é desenhado pelo próprio jogo.
