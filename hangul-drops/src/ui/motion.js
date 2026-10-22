// Animações da interface com GSAP, sempre respeitando "reduzir animações".
// Com animações reduzidas, movimentos viram fades curtos e efeitos decorativos somem.

import { gsap } from 'gsap';
import { animacoesReduzidas } from '../core/settings.js';

export { gsap };

/** Faz um elemento (ou lista) aparecer subindo levemente. */
export function entrar(alvo, { y = 24, duracao = 0.45, atraso = 0, intervalo = 0.06 } = {}) {
  if (animacoesReduzidas()) {
    return gsap.fromTo(alvo, { opacity: 0 }, { opacity: 1, duration: 0.15 });
  }
  return gsap.fromTo(
    alvo,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: duracao,
      delay: atraso,
      stagger: intervalo,
      ease: 'back.out(1.6)',
    },
  );
}

/** Faz um elemento sumir. Devolve uma Promise que resolve no fim. */
export function sair(alvo, { y = -12, duracao = 0.3 } = {}) {
  const vars = animacoesReduzidas()
    ? { opacity: 0, duration: 0.12 }
    : { opacity: 0, y, duration: duracao, ease: 'power2.in' };
  return new Promise((resolver) => {
    gsap.to(alvo, { ...vars, onComplete: resolver });
  });
}

/** Pulso rápido para chamar atenção (acerto, XP ganho). */
export function pulsar(alvo, escala = 1.18) {
  if (animacoesReduzidas()) {
    return null;
  }
  return gsap.fromTo(
    alvo,
    { scale: 1 },
    { scale: escala, duration: 0.14, yoyo: true, repeat: 1, ease: 'power1.out' },
  );
}

/** Tremida curta para indicar erro ou ação bloqueada. */
export function tremer(alvo) {
  if (animacoesReduzidas()) {
    return null;
  }
  return gsap.fromTo(
    alvo,
    { x: 0 },
    { x: 8, duration: 0.06, yoyo: true, repeat: 5, ease: 'sine.inOut', clearProps: 'x' },
  );
}

/** Duração segura para usar em outras animações (0 se reduzidas). */
export function duracao(segundos) {
  return animacoesReduzidas() ? 0 : segundos;
}
