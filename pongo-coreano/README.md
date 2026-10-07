# Pongo na Cidade · 퐁고의 동네

Jogo em HTML para praticar a Unidade 13 (**어디에 가요?**) do livro *Coreano para Brasileiros 1-1* (p. 108–110)
com o caderno de aula da Odu Creative (lugares, partículas 에 · 에서 · (으)로, posições com 있다 e direções).

Abra `index.html` no navegador (precisa de internet para carregar o Three.js e as fontes).

- **Cidade 3D e mapa 2D**: escola (corredor da p. 109) e bairro (우리 동네), com a missão do mapa do caderno:
  biblioteca à direita da escola, parque em frente e farmácia ao lado do parque.
- **17 missões em 5 capítulos**, liberadas uma a uma (o "Modo professor" libera todas).
- **Frases em blocos coloridos (modelo Odu)**: azul = quem, rosa = onde/como, amarelo = ação, cinza = conector.
  Partículas aparecem como blocos que grudam na palavra anterior. Dicas explicam erros de 에/에서, 로/으로, 가요/와요.
- **Missões de rota**: as frases 쭉 가세요 / 오른쪽으로 도세요 viram comandos que o Pongo executa no mapa.
- **Trilha city pop anos 80** gerada ao vivo com Web Audio, e pronúncia das frases com a voz coreana do navegador.

## Editar

O código fica em `src/game.html`; as imagens do Pongo em `assets/` (recortadas da folha de expressões com
`tools/crop_pongo.py`). Depois de editar, rode `python3 tools/build.py` para gerar o `index.html` com as imagens embutidas.
