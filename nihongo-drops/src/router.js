// Roteador simples: só uma tela existe por vez (menu 3D ou um minijogo).
// Antes de montar a próxima, a anterior é destruída para não vazar memória.

import { gsap, duracao } from './ui/motion.js';

/**
 * Cria o roteador.
 * Uma "tela" é uma função async (conteiner, params) => { destroy() }.
 */
export function criarRoteador(conteiner, cortina) {
  let telaAtual = null;
  let trocando = false;

  const cobrir = () => gsap.to(cortina, { opacity: 1, duration: duracao(0.3) }).then();
  const descobrir = () => gsap.to(cortina, { opacity: 0, duration: duracao(0.45) }).then();

  /** Troca para outra tela com transição. Ignora cliques repetidos durante a troca. */
  async function irPara(montarTela, params = {}) {
    if (trocando) {
      return;
    }
    trocando = true;
    cortina.classList.add('ativa');
    try {
      await cobrir();
      telaAtual?.destroy();
      telaAtual = null;
      conteiner.replaceChildren();
      telaAtual = await montarTela(conteiner, params);
    } finally {
      await descobrir();
      cortina.classList.remove('ativa');
      trocando = false;
    }
    // Leva o foco para o título da nova tela (ajuda quem usa leitor de tela).
    conteiner.querySelector('h1, [tabindex="-1"]')?.focus({ preventScroll: true });
  }

  return { irPara };
}
