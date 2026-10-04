# Partícula Quest に・を

Jogo em HTML para treinar, com frases montadas em blocos coloridos:

- **に** com verbos de movimento: いきます・きます・かえります (destino / ponto de chegada)
- **を** com verbos de ação（動詞）: たべます・のみます・みます・ききます・よみます・かきます・かいます・します

O conteúdo vem das Lições 5 e 6 de *Minna no Nihongo Shokyu I* (arquivo "Aulas 02 a 06"):
vocabulário, horários com に (7時に), tempos relativos sem に (きのう, まいにち), meio de transporte com で
e os "erros comuns" de cada ponto gramatical.

## Como jogar

Abra `particula-quest.html` no navegador: é um arquivo único, com tudo embutido (pode ser copiado sozinho para qualquer lugar).
O `index.html` é a mesma versão, mas carrega o Three.js da pasta `vendor/`.
Só as fontes do Google Fonts precisam de internet; sem elas o navegador usa fontes do sistema.

## Metodologia (Chunking em blocos coloridos)

Cada frase é dividida em blocos (chunks) com as cores da legenda da aula:

| Papel | Cor | Exemplo |
|---|---|---|
| S: Sujeito | azul `#D6E4F0` | わたし |
| V: Verbo | verde `#E2EFDA` | いきます |
| O: Objeto / Complemento | amarelo `#FFF2CC` | にほん, パン |
| AUX: Partícula | lilás `#E4D9F0` | は, に, を |
| ADV: Advérbio / Tempo | pêssego `#FDE9D9` | きのう, 7時に, バスで |

O guia de cada unidade segue a estrutura da aula: **FORMA / FUNÇÃO / MODO**, frase-exemplo em blocos,
**✗ Errado / ✓ Correto** e **Erro comum**. O feedback de cada resposta errada usa o mesmo formato.

## Estrutura do jogo

- **Trilha progressiva estilo Duolingo:** 3 unidades e 11 níveis. Um nível só libera o próximo quando é concluído.
  O progresso fica salvo no navegador (localStorage).
- **3 tipos de exercício:** montar a frase com os blocos (com partículas "pegadinha"), escolher a partícula (に/を/で/が)
  e escolher o verbo que combina com a partícula.
- **Corações:** 3 por nível. Uma frase errada volta no fim da lição.
- **Pontuação:** 100 pontos por acerto × multiplicador de combo (+0,25 por acerto seguido, até ×3),
  mais 50 por coração restante e 300 por lição perfeita. Cada nível dá 1 a 3 estrelas, conforme os erros.
- **Acerto:** explosão sonora (estouro + sub-grave + arpejo), confete, faíscas, emojis, ondas de choque,
  raios, texto gigante (すごい！, せいかい！…), flash, tremor de tela e estrelas 3D. Quanto maior o combo, maior a explosão.
- **Música lo-fi para estudar:** gerada ao vivo com a Web Audio API (acordes ii–V–I–vi com piano elétrico, baixo,
  bateria com swing, chiado de vinil, "wow" de fita e reverb). Não usa nenhum arquivo de áudio.
- **Ouvir frase:** lê a frase em japonês com a voz do sistema (Speech Synthesis), quando o navegador tem uma voz japonesa.

## Elementos 3D (Blender)

`blender/gerar_modelos.py` gera todos os elementos 3D com o Blender (bpy):

- `mascote.glb`: o mascote Daru, um daruma com hachimaki e livro
- `torii.glb`: o portal da tela inicial
- `estrela.glb`: as estrelas que explodem a cada acerto
- `trofeu.glb`: o troféu de nível concluído
- `no_*.png`: os botões dos níveis (ativo, concluído, bloqueado), renderizados em Cycles
- `mascote.png`, `trofeu.png`: retratos usados quando o navegador não tem WebGL

No jogo, os modelos GLB são exibidos e animados em tempo real com Three.js.

```bash
pip install bpy            # ou rode com o Blender: blender -b -P blender/gerar_modelos.py
python3 blender/gerar_modelos.py
python3 build.py           # embute os assets e gera index.html
```

## Arquivos

- `src/jogo.html`: código do jogo (HTML, CSS e JS)
- `build.py`: gera o `index.html` final com os assets embutidos em base64
- `assets/`: saídas do Blender
- `vendor/`: Three.js r147 (licença MIT, em `vendor/THREE-LICENSE`)
