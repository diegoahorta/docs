// Tela que hospeda um minijogo: carrega o módulo sob demanda, cria o Phaser
// e pausa o jogo enquanto houver um modal aberto (ex.: configurações).

import { criarElemento } from '../core/utils.js';
import { buscarJogo } from './registry.js';
import { criarJogoPhaser } from './PhaserHost.js';

/**
 * Monta a tela de um jogo. `aoSair` volta para o menu.
 * Devolve { destroy }.
 */
export async function montarTelaJogo(conteiner, { jogoId, aoSair }) {
  const jogo = buscarJogo(jogoId);
  if (!jogo?.carregar) {
    throw new Error(`O jogo "${jogoId}" ainda não está disponível.`);
  }
  const palco = criarElemento('section', {
    class: 'tela-jogo',
    'aria-label': `${jogo.nome} — ${jogo.descricao}`,
  });
  conteiner.append(palco);

  const modulo = await jogo.carregar();
  const instancia = criarJogoPhaser(palco, modulo.default, {
    jogo,
    conteiner: palco,
    aoSair,
  });

  const aoModal = (evento) => (evento.detail.aberto ? instancia.pausar() : instancia.continuar());
  document.addEventListener('nd:modal', aoModal);

  return {
    destroy() {
      document.removeEventListener('nd:modal', aoModal);
      instancia.destroy();
      palco.remove();
    },
  };
}
