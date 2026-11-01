/**
 * Animações com GSAP, sempre opcionais.
 * - Respeita "Reduzir movimento" (configuração do app e prefers-reduced-motion).
 * - Se o GSAP não carregar, nada quebra: as funções viram no-op.
 */
function gsapOrNull() {
  const g = globalThis.gsap;
  if (!g) return null;
  if (document.documentElement.dataset.motion === 'reduced') return null;
  if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  return g;
}

export const motionEnabled = () => !!gsapOrNull();

/** Entrada suave de uma página/cartões. */
export function enter(el, { stagger = 0.05 } = {}) {
  const g = gsapOrNull();
  if (!g || !el) return;
  const kids = el.children?.length ? [...el.children] : [el];
  g.from(kids, { y: 12, opacity: 0, duration: 0.35, stagger, ease: 'power2.out', clearProps: 'all' });
}

/** Feedback de acerto: pequeno "pop". */
export function success(el) {
  const g = gsapOrNull();
  if (!g || !el) return;
  g.fromTo(el, { scale: 0.96 }, { scale: 1, duration: 0.45, ease: 'back.out(3)', clearProps: 'transform' });
}

/** Feedback de erro: balanço discreto (não punitivo). */
export function gentleShake(el) {
  const g = gsapOrNull();
  if (!g || !el) return;
  g.fromTo(el, { x: -4 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)', clearProps: 'transform' });
}

/** Comemoração (medalha, missão concluída). */
export function celebrate(el) {
  const g = gsapOrNull();
  if (!g || !el) return;
  g.fromTo(el, { scale: 0.6, rotate: -8, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.6, ease: 'back.out(2.2)' });
}

/** Move um elemento (ex.: personagem do jogo). Retorna Promise. */
export function moveTo(el, vars, duration = 1.2) {
  const g = gsapOrNull();
  if (!g || !el) {
    if (el) for (const [k, v] of Object.entries(vars)) if (k === 'x') el.setAttribute('transform', `translate(${v} 0)`);
    return Promise.resolve();
  }
  return new Promise((resolve) => g.to(el, { ...vars, duration, ease: 'power1.inOut', onComplete: resolve }));
}
