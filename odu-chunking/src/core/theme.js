/** Lê os tokens de cor do CSS para Phaser e Three.js seguirem o tema atual. */
export function tokens() {
  const css = getComputedStyle(document.documentElement);
  const get = (name) => css.getPropertyValue(name).trim();
  return {
    bg: get('--bg'),
    surface: get('--surface'),
    ink: get('--ink'),
    muted: get('--muted'),
    line: get('--line'),
    onBlock: get('--on-block'),
    blocks: [0, 1, 2, 3, 4, 5].map((i) => get(`--b${i}`)),
  };
}

export const hexToInt = (hex) => parseInt(hex.replace('#', ''), 16);

/** Chama `fn` quando o tema do sistema ou o atributo data-theme mudar. */
export function onThemeChange(fn) {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', fn);
  const mo = new MutationObserver(fn);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    mq.removeEventListener('change', fn);
    mo.disconnect();
  };
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
