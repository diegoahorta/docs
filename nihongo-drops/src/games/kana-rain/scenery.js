// Cenário do Kana Rain: céu noturno em degradê, nuvens e o chão (lago + grama).
// É redesenhado sempre que a tela muda de tamanho.

const COR_CEU_TOPO = 0x0f1630;
const COR_CEU_BASE = 0x2a3a78;
const COR_NUVEM = 0xc3cbef;
const COR_AGUA = 0x1d3b6b;
const COR_GRAMA = 0x4fb37f;
const QUANTIDADE_NUVENS = 6;

/** Cria os gráficos do cenário. Devolve { redesenhar(largura, altura, chaoY) }. */
export function criarCenario(cena) {
  const ceu = cena.add.graphics().setDepth(-10);
  const nuvens = cena.add.graphics().setDepth(-9);
  const chao = cena.add.graphics().setDepth(5);

  function redesenhar(largura, altura, chaoY) {
    ceu.clear();
    ceu.fillGradientStyle(COR_CEU_TOPO, COR_CEU_TOPO, COR_CEU_BASE, COR_CEU_BASE, 1);
    ceu.fillRect(0, 0, largura, altura);

    // Nuvens fixas no topo: é de lá que os kana "pingam".
    nuvens.clear();
    nuvens.fillStyle(COR_NUVEM, 0.16);
    for (let i = 0; i < QUANTIDADE_NUVENS; i += 1) {
      const x = ((i + 0.5) * largura) / QUANTIDADE_NUVENS;
      nuvens.fillEllipse(x, 10 + (i % 2) * 14, largura / 3.5, 52);
    }

    chao.clear();
    chao.fillStyle(COR_AGUA, 1);
    chao.fillRect(0, chaoY, largura, altura - chaoY);
    chao.fillStyle(COR_GRAMA, 1);
    chao.fillRect(0, chaoY, largura, 6);
  }

  return { redesenhar };
}
