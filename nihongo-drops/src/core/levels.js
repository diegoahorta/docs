// Cálculo de nível a partir do XP.
// Nível n exige 50 × (n − 1)² de XP: 0, 50, 200, 450, 800, 1250...

const XP_BASE = 50;

/** Nível correspondente a um total de XP. */
export function nivelDoXP(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / XP_BASE)) + 1;
}

/** XP total necessário para alcançar um nível. */
export function xpParaNivel(nivel) {
  return XP_BASE * (nivel - 1) ** 2;
}

/** Progresso dentro do nível atual: { nivel, atual, necessario, fracao }. */
export function progressoDoNivel(xp) {
  const nivel = nivelDoXP(xp);
  const inicio = xpParaNivel(nivel);
  const necessario = xpParaNivel(nivel + 1) - inicio;
  const atual = xp - inicio;
  return { nivel, atual, necessario, fracao: atual / necessario };
}
