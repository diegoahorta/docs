// Peças de interface HTML compartilhadas pelos minijogos:
// a camada que fica sobre o canvas e os painéis (início, pausa, fim de jogo).

import { criarElemento } from '../core/utils.js';
import { entrar } from '../ui/motion.js';

let contador = 0;

/** Cria a camada HTML que fica por cima do canvas do Phaser. */
export function criarCamadaDoJogo(conteiner) {
  const camada = criarElemento('div', { class: 'jogo-camada' });
  conteiner.append(camada);
  return camada;
}

/**
 * Mostra um painel centralizado.
 * `acoes` = [{ rotulo, aoClicar, primario }]; o primeiro botão recebe o foco.
 * Devolve { elemento, fechar }.
 */
export function mostrarPainel(camada, { titulo, tituloJP, conteudo = [], acoes = [] }) {
  contador += 1;
  const idTitulo = `jogo-painel-titulo-${contador}`;
  const botoes = acoes.map(({ rotulo, aoClicar, primario }) =>
    criarElemento('button', {
      type: 'button',
      class: primario ? 'botao' : 'botao botao-secundario',
      text: rotulo,
      onClick: aoClicar,
    }),
  );
  const painel = criarElemento(
    'div',
    { class: 'jogo-painel', role: 'dialog', 'aria-labelledby': idTitulo },
    [
      criarElemento('h2', { id: idTitulo, text: titulo }),
      tituloJP ? criarElemento('p', { class: 'jogo-painel-jp', lang: 'ja', text: tituloJP }) : null,
      ...conteudo,
      criarElemento('div', { class: 'jogo-painel-acoes' }, botoes),
    ],
  );
  camada.append(painel);
  entrar(painel, { y: 30 });
  botoes[0]?.focus({ preventScroll: true });
  return {
    elemento: painel,
    fechar() {
      painel.remove();
    },
  };
}
