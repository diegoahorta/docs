# Dark Grammar Anime

Versão anime do [Dark Grammar Invasion](../dark-grammar/): mesmo mapa, mesmas 10 pistas, mesmos 18 terminais
e a mesma Revisão Integrada das aulas **Advanced Grammar em Blocos · Units 1–3** (Prof. Diego Horta · ODU Creative).
Abra `index.html` no navegador.

## O que muda: 2D anime + 3D toon

- **Personagens 2D estilo anime**, desenhados em canvas com contorno (line art) e cel shading:
  - **Aiko**: a sobrevivente, de jaqueta laranja, cachecol esvoaçante e mecha "ahoge". Tem 4 frames de caminhada.
  - **NOVA**: IA holográfica com twin tails, que flutua ao lado da Aiko e tem 3 expressões (normal, feliz, preocupada).
  - **Gramáticos**: yokai encapuzados com máscara estilo nô, chifres e olhos brilhantes, em quatro espécies de cores diferentes.
- **Mundo 3D toon**: `MeshToonMaterial` com gradiente de 3 tons e contornos pretos (técnica de casco invertido) em prédios, containers e objetos.
- **Diálogos estilo visual novel**: a NOVA comenta cada terminal, comemora os acertos, avisa nos erros e explica as regras das pistas.
- **Efeitos de anime**: um "!" aparece quando um Gramático te vê, linhas de velocidade ao correr, ao usar o pulso da lanterna e ao levar dano.

Os personagens continuam sendo sprites 2D (billboards) dentro da cena 3D. Para trocar pela sua arte (por exemplo,
sprite sheets do Unity ou de um ilustrador), use `ASSET_CONFIG.unitySprites`. Para usar um cenário do Blender, use
`ASSET_CONFIG.blenderScene`. Os passos estão no README da versão original.

O progresso é salvo separado da versão original.
