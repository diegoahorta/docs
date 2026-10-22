// Cenário do Hangul Runner: céu de fim de tarde, sol, montanhas com
// efeito parallax, as três pistas e o chão.

const COR_CEU_TOPO = 0x2a2350;
const COR_CEU_BASE = 0xd67a7a;
const COR_SOL = 0xffd166;
const COR_MONTANHA_LONGE = 0x5b4f8a;
const COR_MONTANHA_PERTO = 0x3d3470;
const COR_NEVE = 0xf4f6ff;
const COR_PISTA = 0xf4f6ff;
const COR_CHAO = 0x2d6b4f;

/** Desenha uma faixa de montanhas que se repete a cada `largura` px. */
function desenharMontanhas(grafico, largura, base, altura, cor, comNeve) {
  grafico.clear();
  const picos = 4;
  for (let copia = 0; copia < 2; copia += 1) {
    for (let i = 0; i < picos; i += 1) {
      const centro = copia * largura + ((i + 0.5) * largura) / picos;
      const meiaLargura = largura / picos / 1.2;
      const topo = base - altura * (0.7 + (0.3 * ((i * 7) % 3)) / 2);
      grafico.fillStyle(cor, 1);
      grafico.fillTriangle(centro - meiaLargura, base, centro + meiaLargura, base, centro, topo);
      if (comNeve) {
        const neve = (base - topo) * 0.22;
        grafico.fillStyle(COR_NEVE, 0.9);
        grafico.fillTriangle(
          centro - meiaLargura * 0.22,
          topo + neve,
          centro + meiaLargura * 0.22,
          topo + neve,
          centro,
          topo,
        );
      }
    }
  }
}

/** Cria o cenário. Devolve { redesenhar, rolar }. */
export function criarCenario(cena) {
  const ceu = cena.add.graphics().setDepth(-10);
  const longe = cena.add.graphics().setDepth(-9);
  const perto = cena.add.graphics().setDepth(-8);
  const pistas = cena.add.graphics().setDepth(-7);
  let larguraAtual = 1;

  /** Redesenha tudo para o tamanho atual. `faixasY` = y de cada pista. */
  function redesenhar(largura, altura, chaoY, faixasY, tamanhoBloco) {
    larguraAtual = largura;
    ceu.clear();
    ceu.fillGradientStyle(COR_CEU_TOPO, COR_CEU_TOPO, COR_CEU_BASE, COR_CEU_BASE, 1);
    ceu.fillRect(0, 0, largura, altura);
    ceu.fillStyle(COR_SOL, 0.9);
    ceu.fillCircle(largura * 0.78, chaoY * 0.45, Math.min(largura, altura) * 0.08);

    desenharMontanhas(longe, largura, chaoY, chaoY * 0.55, COR_MONTANHA_LONGE, true);
    desenharMontanhas(perto, largura * 0.7, chaoY, chaoY * 0.3, COR_MONTANHA_PERTO, false);

    pistas.clear();
    pistas.fillStyle(COR_CHAO, 1);
    pistas.fillRect(0, chaoY, largura, altura - chaoY);
    pistas.lineStyle(3, COR_PISTA, 0.35);
    faixasY.forEach((y) => {
      pistas.lineBetween(0, y + tamanhoBloco / 2 + 6, largura, y + tamanhoBloco / 2 + 6);
    });
  }

  /** Move as montanhas (as de perto andam mais rápido que as de longe). */
  function rolar(distancia) {
    longe.x = (longe.x - distancia * 0.15) % larguraAtual;
    perto.x = (perto.x - distancia * 0.35) % (larguraAtual * 0.7);
  }

  return { redesenhar, rolar };
}
