// Cálculo de grade de cartas compartilhado pelos jogos de cartas.

/** Quanto o formato da grade difere do formato da área (0 = igual). */
function diferencaDeFormato(colunas, linhas, larguraArea, alturaArea, proporcao) {
  return Math.abs(Math.log((colunas * proporcao) / linhas / (larguraArea / alturaArea)));
}

/**
 * Escolhe quantas colunas usar para que as cartas fiquem o maior possível
 * dentro da área disponível. Em caso de empate (cartas já no tamanho máximo),
 * prefere a grade com o formato mais parecido com o da tela e com menos vagas vazias.
 * Devolve { colunas, linhas, largura, altura }.
 */
export function calcularGrade(total, larguraArea, alturaArea, espaco) {
  const proporcao = 0.8; // largura / altura da carta
  let melhor = null;
  for (let colunas = 2; colunas <= Math.min(total, 8); colunas += 1) {
    const linhas = Math.ceil(total / colunas);
    const larguraMaxima = (larguraArea - espaco * (colunas + 1)) / colunas;
    const alturaMaxima = (alturaArea - espaco * (linhas + 1)) / linhas;
    const largura = Math.min(larguraMaxima, alturaMaxima * proporcao, 150);
    const vagasVazias = colunas * linhas - total;
    const formato =
      diferencaDeFormato(colunas, linhas, larguraArea, alturaArea, proporcao) + vagasVazias * 0.3;
    const empate = melhor && Math.abs(largura - melhor.largura) < 1;
    if (!melhor || (empate ? formato < melhor.formato : largura > melhor.largura)) {
      melhor = { colunas, linhas, largura, altura: largura / proporcao, formato };
    }
  }
  return melhor;
}
