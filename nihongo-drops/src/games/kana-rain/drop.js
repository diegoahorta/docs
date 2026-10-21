// A "gota" do Kana Rain: forma de gota d'água com um hiragana dentro,
// além das animações de acerto (estouro) e de erro (respingo no chão).

const FONTE = '"Noto Sans JP", system-ui, sans-serif';
const COR_GOTA = 0x8fd3ff;
const COR_DESTAQUE = 0xffd166;
const COR_RESPINGO = 0x8fd3ff;

/** Desenha a gota: círculo + ponta em cima + um brilho. */
function desenharForma(grafico, raio, cor, contorno) {
  grafico.clear();
  grafico.fillStyle(cor, 0.95);
  grafico.fillCircle(0, raio * 0.15, raio);
  grafico.fillTriangle(-raio * 0.66, -raio * 0.55, raio * 0.66, -raio * 0.55, 0, -raio * 1.5);
  grafico.fillStyle(0xffffff, 0.35);
  grafico.fillCircle(-raio * 0.55, -raio * 0.2, raio * 0.14);
  if (contorno) {
    grafico.lineStyle(4, 0xffffff, 1);
    grafico.strokeCircle(0, raio * 0.15, raio + 3);
  }
}

/**
 * Cria uma gota na cena. Devolve um objeto com o item, o contêiner do Phaser,
 * a velocidade (px/s) e a função `destacar` (usada enquanto o jogador digita).
 */
export function criarGota(cena, item, { x, y, raio, velocidade }) {
  const forma = cena.add.graphics();
  desenharForma(forma, raio, COR_GOTA, false);
  const texto = cena.add
    .text(0, raio * 0.15, item.kana, {
      fontFamily: FONTE,
      fontSize: `${Math.round(raio * 1.15)}px`,
      fontStyle: 'bold',
      color: '#141a33',
    })
    .setOrigin(0.5);
  const conteiner = cena.add.container(x, y, [forma, texto]);
  let destacada = false;

  return {
    item,
    conteiner,
    velocidade,
    raio,
    get y() {
      return conteiner.y;
    },
    destacar(sim) {
      if (sim !== destacada) {
        destacada = sim;
        desenharForma(forma, raio, sim ? COR_DESTAQUE : COR_GOTA, sim);
      }
    },
  };
}

/** Partículas simples que se afastam de um ponto e somem. */
function soltarParticulas(cena, x, y, { cor, quantidade, distancia, paraCima }) {
  for (let i = 0; i < quantidade; i += 1) {
    const angulo = paraCima
      ? Math.PI + (Math.PI * (i + 0.5)) / quantidade
      : (Math.PI * 2 * i) / quantidade;
    const particula = cena.add.circle(x, y, 4, cor);
    cena.tweens.add({
      targets: particula,
      x: x + Math.cos(angulo) * distancia,
      y: y + Math.sin(angulo) * distancia,
      alpha: 0,
      duration: 450,
      ease: 'Quad.easeOut',
      onComplete: () => particula.destroy(),
    });
  }
}

/** Animação de acerto: a gota estoura em partículas. */
export function estourarGota(cena, gota, reduzido) {
  const { conteiner } = gota;
  if (reduzido) {
    conteiner.destroy();
    return;
  }
  soltarParticulas(cena, conteiner.x, conteiner.y, {
    cor: 0xffffff,
    quantidade: 10,
    distancia: gota.raio * 1.8,
    paraCima: false,
  });
  cena.tweens.add({
    targets: conteiner,
    scale: 1.5,
    alpha: 0,
    duration: 180,
    onComplete: () => conteiner.destroy(),
  });
}

/** Animação de erro: a gota se desfaz no chão. */
export function respingarGota(cena, gota, chaoY, reduzido) {
  const { conteiner } = gota;
  if (!reduzido) {
    soltarParticulas(cena, conteiner.x, chaoY, {
      cor: COR_RESPINGO,
      quantidade: 7,
      distancia: gota.raio * 1.4,
      paraCima: true,
    });
  }
  conteiner.destroy();
}
