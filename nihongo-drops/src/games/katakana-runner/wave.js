// Uma "onda" do Katakana Runner: uma coluna de blocos com katakana,
// cada bloco numa pista. A onda inteira anda da direita para a esquerda.

const FONTE = '"Noto Sans JP", system-ui, sans-serif';
const COR_BLOCO = 0xffd166;
const COR_BORDA = 0xb8860b;
const COR_CERTO = 0x5be49b;

function desenharBloco(grafico, tamanho, cor) {
  const metade = tamanho / 2;
  grafico.clear();
  grafico.fillStyle(cor, 1);
  grafico.fillRoundedRect(-metade, -metade, tamanho, tamanho, 12);
  grafico.lineStyle(4, COR_BORDA, 1);
  grafico.strokeRoundedRect(-metade, -metade, tamanho, tamanho, 12);
}

/**
 * Cria os blocos de uma onda.
 * `posicaoDaFaixa(faixa)` devolve o y de cada pista.
 * Devolve { conteiner, blocos, alvo, posicionar, mostrarCerto, estourar }.
 */
export function criarOnda(cena, { alvo, blocos }, { x, tamanho, posicaoDaFaixa }) {
  const conteiner = cena.add.container(x, 0).setDepth(4);
  const pecas = blocos.map(({ item, faixa }) => {
    const fundo = cena.add.graphics();
    const texto = cena.add
      .text(0, 0, item.kana, { fontFamily: FONTE, fontStyle: 'bold', color: '#141a33' })
      .setOrigin(0.5);
    const bloco = cena.add.container(0, 0, [fundo, texto]);
    conteiner.add(bloco);
    return { item, faixa, bloco, fundo, texto };
  });

  const onda = {
    conteiner,
    alvo,
    pecas,
    tamanho,

    /** Reposiciona os blocos (início e redimensionamento). */
    posicionar(novoTamanho) {
      onda.tamanho = novoTamanho;
      pecas.forEach((peca) => {
        desenharBloco(peca.fundo, novoTamanho, COR_BLOCO);
        peca.texto.setFontSize(novoTamanho * 0.62);
        peca.bloco.y = posicaoDaFaixa(peca.faixa);
      });
    },

    /** Pinta de verde o bloco certo (usado no erro, para mostrar a resposta). */
    mostrarCerto() {
      pecas
        .filter((peca) => peca.item.id === alvo.id)
        .forEach((peca) => desenharBloco(peca.fundo, onda.tamanho, COR_CERTO));
    },

    /** Animação de acerto: o bloco escolhido estoura e os outros somem. */
    estourar(pecaEscolhida, animado) {
      if (!animado) {
        conteiner.destroy();
        return;
      }
      pecas.forEach((peca) => {
        const escolhida = peca === pecaEscolhida;
        cena.tweens.add({
          targets: peca.bloco,
          scale: escolhida ? 1.6 : 0.6,
          alpha: 0,
          duration: escolhida ? 220 : 160,
        });
      });
      cena.time.delayedCall(240, () => conteiner.destroy());
    },
  };
  onda.posicionar(tamanho);
  return onda;
}
