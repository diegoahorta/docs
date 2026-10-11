# Dark Grammar Invasion · ODU-X

Versão corrigida do modelo enviado (`original.html`). O conceito, o layout, os 5 terminais, o robô ODU-X,
a fenda no céu, o áudio procedural e os puzzles continuam os mesmos. Abra `index.html` no navegador.
`game.html` é o mesmo jogo sem o esqueleto `<html>`, usado na versão publicada como Artifact.

## Erros corrigidos

**Jogabilidade**
- **Colisão com prédios**: cada prédio era tratado como um círculo, então dava para atravessar os cantos.
  Agora a colisão usa caixas (AABB), e o jogador nunca fica preso dentro de um prédio.
- **Prédios e carros em cima de terminais, do robô ou do ponto inicial**: os carros não tinham verificação e
  os prédios podiam se sobrepor. Agora há checagem de espaço livre e de sobreposição.
- **Teclas presas**:
  - No celular faltava `pointercancel`, então o personagem continuava andando sozinho.
  - Ao trocar de aba, as teclas seguravam o movimento.
  - Segurar `E` repetia a ação.
  - Agora os controles usam `e.code`, que funciona com qualquer layout de teclado e com Shift/Caps Lock.
- **Movimento continuava depois de abrir um terminal**: as teclas agora são zeradas ao abrir o puzzle, e
  `Esc` fecha o terminal.
- **Respostas decoradas**: as opções eram sempre na mesma ordem, inclusive no "Tentar de novo". Agora são embaralhadas.
- **Botões continuavam clicáveis depois de responder**: agora ficam desativados.
- **Prompt "Ativar robô" aparecia mesmo com o robô já ativo**: agora some e mostra um aviso no lugar.
- **Alienígenas presos andando contra paredes**: agora escolhem um novo destino a cada 6–10 s.
- **Câmera dependente da taxa de quadros** (a suavização era fixa por quadro): agora depende do tempo.
  O salto de tempo depois de pausar também foi corrigido.

**Visual**
- **Cores lavadas nos sprites**: com o Three.js r160, as texturas de canvas precisam de `colorSpace = SRGBColorSpace`.
- **Robô da tela de vitória achatado e cortado** (`scale(s, s/1.5)`): agora a escala é uniforme e o desenho fica centralizado.
- **Animação de morte das criaturas deixava o sprite quadrado** (`setScalar`): agora mantém a proporção.
- **"Janelas" eram placas soltas flutuando na frente dos prédios**: viraram uma textura de janelas nas quatro faces.
- **Fenda no céu sumia na neblina**: agora tem `fog: false`.
- **O robô não mostrava que estava destruindo as criaturas**: agora dispara um feixe até cada uma.
- **Texto de LOG ficava por cima do direcional no celular**: foi reposicionado.
- **Minimapa**: a escala não cobria o mapa inteiro (±66), e a resolução foi dobrada.

**Conteúdo (gabarito ambíguo)**
- "Rental prices ___ steadily this year": a opção `rose` também pode ser aceita. Foi trocada por `rising`.
- "I ___ we postpone the launch": `suggested to` é estranho, mas `I suggested we postpone` é correto. Foi trocada por `am suggest`.
- "I ___ my keys — I can't get into the bunker!": no inglês americano, `lost` também é aceito.
  Foi trocada por "This is the first time I ___ a real alien" (`have seen`), a regra da Unit 3 sem ambiguidade.

**Robustez**
- Aviso na tela se o Three.js não carregar (CDN bloqueada ou offline). O botão fica desativado até o motor carregar.
- `AudioContext` com fallback, `resume()` quando o navegador suspende o áudio, e o batimento cardíaco só toca quando há perigo.
- `user-scalable=no` removido (acessibilidade). Foram adicionados foco visível, `aria-label` nos botões de seta e respeito a `prefers-reduced-motion`.
- Visibilidade controlada com o atributo `hidden` em vez de `style.display` espalhado pelo código.
