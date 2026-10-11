# Dark Grammar Invasion

Jogo HTML5 de mundo aberto (investigação, mistério e sobrevivência) baseado nas aulas
**Advanced Grammar em Blocos · Sequência 01 · Units 1–3** e no **Glossário B2+/C1**
(Prof. Diego Horta · ODU Creative).

Abra `index.html` num navegador moderno. Não precisa de build: o Three.js r128 é carregado do cdnjs.
`game.html` é o mesmo jogo sem o esqueleto `<html>/<head>`, usado na versão publicada como Artifact.

## História

Santos, 3h da manhã. A frota do Universo Escuro pousou. Os alienígenas (os **Gramáticos**) se
alimentam de frases erradas: cada resposta errada num terminal faz barulho e atrai os que
estão por perto. O sobrevivente sai do bunker, lê as pistas espalhadas pela cidade, hackeia
terminais em inglês para conseguir equipamento e reúne três **Tense Cores** para ligar a nave de fuga.

## Mapa e conteúdo

| Zona | Aula | Puzzles | Alienígena |
|---|---|---|---|
| Mercado do Porto (oeste) | Unit 1 · Present continuous × present simple (1) | 4 terminais + cofre (Core α) | Continuous Wraith |
| Chef's Lab (leste) | Unit 2 · Verbos de estado, duplo sentido, polidez, performativos | 5 terminais + cofre (Core β) | Stative Leech |
| Estação de Notícias (norte) | Unit 3 · Past simple × present perfect | 5 terminais + cofre (Core γ) | Perfect Stalker |
| Nave de fuga (extremo norte) | Revisão Integrada: “Qual bloco é este?” | 6 frases | — |

Tipos de puzzle, todos tirados dos exercícios, exemplos e erros comuns das aulas:

- **Escolha**: complete a frase (Exercício 1 de cada Unit).
- **Corrija o erro**: escolha a versão certa (Exercício 2 e “Erros comuns”).
- **Digite**: escreva a forma do verbo (aceita contrações e apóstrofo curvo).
- **Frases em blocos**: monte a frase com os blocos coloridos da legenda (S, AUX, V, ADV, REL…).
- **Qual bloco é este?**: identifique a Unit (Revisão Integrada).

As 10 pistas (papéis brilhantes) trazem frases do glossário e as regras fundamentais. Ler uma
pista de uma zona libera o botão **Dica ODU** nos terminais dela.

## Sobrevivência

- Vida, bateria e fôlego. O bunker é zona segura e regenera vida.
- Correr faz barulho e aumenta o raio de detecção.
- **Lanterna UV** (F/Espaço): pulso em cone que atordoa (20% de bateria).
- **Sinalizador** (G): espanta alienígenas próximos. **Kit médico** (Q): +50 de vida.
- **Radar**: mostra os alienígenas no minimapa. **Botas**: corrida mais rápida.
- Cada Tense Core faz descer mais Gramáticos da nave-mãe.
- Ser capturado leva de volta ao bunker, sem perder equipamento, com um lembrete de gramática.
- Progresso salvo no `localStorage` do navegador.

Controles: WASD/setas, Shift, E, F/Espaço, G, Q, J (diário), Esc (pausa). No celular aparecem joystick e botões.

## Unity 2D e Blender

O jogo roda inteiro no navegador com Three.js. Unity e Blender não rodam no ambiente onde ele
foi gerado, então os assets padrão são feitos por código, no mesmo estilo de cada ferramenta:

- **Sprites 2D** (sobrevivente e três espécies de alienígena) são pixel art de 16 px de largura com 3 frames de
  caminhada, espelhados para a esquerda e desenhados como billboards, igual a sprite sheets do Unity 2D.
- **Cenário 3D** é low-poly com flat shading (prédios em ruínas, containers, guindaste, cozinha,
  torre de rádio, nave, nave-mãe), no estilo de uma cena modelada no Blender.

Para trocar pelos seus próprios assets, edite `ASSET_CONFIG` no início do script:

```js
const ASSET_CONFIG = {
  unitySprites: { player: 'assets/player.png', alien: 'assets/alien.png', frames: 3 },
  blenderScene: 'assets/cidade.glb',
  blenderReplacesProcedural: true,
};
```

- **Unity 2D**: no Sprite Editor, exporte cada personagem como um PNG com os frames lado a lado
  na horizontal, todos da mesma largura (`frames` = quantidade). O jogo espelha os frames sozinho.
- **Blender**: `File › Export › glTF 2.0 (.glb)`, com Y para cima e 1 unidade = 1 metro. O mapa
  vai de −92 a 92 em X e Z; as zonas ficam em (−55, 10), (55, 10), (0, −40) e a nave em (0, −82).
  O `GLTFLoader` é carregado do jsDelivr só quando `blenderScene` está definido. Com
  `blenderReplacesProcedural: true` o cenário gerado por código é escondido (as colisões continuam as do código).
- Assets locais precisam de um servidor HTTP (`npx serve .`), porque o navegador bloqueia `file://`.

Para um build Unity WebGL completo, os dados de `NOTES`, `TERMINALS` e `ZONES` podem ser exportados como JSON
e lidos por um ScriptableObject. A lógica dos puzzles não depende do motor.
