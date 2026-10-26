// Pontos, combo e estrelas (lógica pura, sem DOM).

export const PONTOS_BASE = 100;
export const BONUS_MAXIMO_DE_TEMPO = 50;
/** Sem cronômetro, todo acerto ganha metade do bônus de tempo. */
export const BONUS_SEM_TEMPO = 25;

/** Multiplicador do combo: 3 acertos seguidos = x2, 6 = x3, 10 = x4. */
export function multiplicador(combo) {
  if (combo >= 10) {
    return 4;
  }
  if (combo >= 6) {
    return 3;
  }
  if (combo >= 3) {
    return 2;
  }
  return 1;
}

/**
 * Pontos de um acerto.
 * @param {object} dados
 * @param {number} dados.fracaoRestante tempo que sobrou (0 a 1), ou null sem cronômetro
 * @param {number} dados.combo          acertos seguidos, contando este
 * @param {boolean} dados.consultouGuia abriu o guia fonético nesta pergunta (pontos pela metade)
 */
export function pontosDoAcerto({ fracaoRestante, combo, consultouGuia }) {
  const bonus =
    fracaoRestante === null
      ? BONUS_SEM_TEMPO
      : Math.round(BONUS_MAXIMO_DE_TEMPO * Math.max(0, Math.min(1, fracaoRestante)));
  const pontos = (PONTOS_BASE + bonus) * multiplicador(combo);
  return consultouGuia ? Math.round(pontos / 2) : pontos;
}

/** Estrelas pela porcentagem de acertos: 50% = ★, 75% = ★★, 90% = ★★★. */
export function estrelas(acertos, total) {
  const taxa = total > 0 ? acertos / total : 0;
  if (taxa >= 0.9) {
    return 3;
  }
  if (taxa >= 0.75) {
    return 2;
  }
  return taxa >= 0.5 ? 1 : 0;
}

/** Frase do apresentador para o resultado final. */
export function fraseFinal(numeroDeEstrelas) {
  return [
    'Bora treinar mais um pouco? Abra o 📖 Guia e tente de novo!',
    'Bom começo! O katakana já está ficando familiar.',
    'Mandou bem! Mais uma rodada e você vira lenda!',
    'ESPETACULAR! Você é a estrela do Katakana Show! 🌟',
  ][numeroDeEstrelas];
}
