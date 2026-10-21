// Janela modal acessível: foco preso dentro, fecha com Esc ou clicando fora,
// e devolve o foco para quem abriu. Avisa o jogo para pausar enquanto aberta.

import { criarElemento } from '../core/utils.js';
import { entrar, sair } from './motion.js';

const SELETOR_FOCAVEL =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

let contador = 0;
let abertos = 0;

/** Avisa o resto do app (ex.: a tela do jogo) que há um modal aberto. */
function avisarEstado() {
  document.dispatchEvent(new CustomEvent('nd:modal', { detail: { aberto: abertos > 0 } }));
}

/** Mantém o Tab circulando apenas dentro do modal. */
function prenderFoco(evento, caixa) {
  const focaveis = [...caixa.querySelectorAll(SELETOR_FOCAVEL)];
  if (focaveis.length === 0) {
    return;
  }
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primeiro.focus();
  }
}

/**
 * Abre um modal. `conteudo` pode ser um Node ou uma lista de Nodes.
 * Devolve { corpo, fechar }.
 */
export function abrirModal({ titulo, conteudo, classe = '', aoFechar } = {}) {
  contador += 1;
  const idTitulo = `modal-titulo-${contador}`;
  const anterior = document.activeElement;
  const camada = document.getElementById('modais') ?? document.body;

  const botaoFechar = criarElemento('button', {
    class: 'botao-icone',
    type: 'button',
    'aria-label': 'Fechar',
    text: '✕',
  });
  const corpo = criarElemento('div', { class: 'modal-corpo' }, conteudo);
  const caixa = criarElemento(
    'div',
    { class: `modal ${classe}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': idTitulo },
    [
      criarElemento('header', { class: 'modal-cabecalho' }, [
        criarElemento('h2', { id: idTitulo, text: titulo }),
        botaoFechar,
      ]),
      corpo,
    ],
  );
  const fundo = criarElemento('div', { class: 'modal-fundo' }, caixa);

  let fechado = false;
  async function fechar() {
    if (fechado) {
      return;
    }
    fechado = true;
    await sair(fundo, { y: 0 });
    fundo.remove();
    abertos -= 1;
    avisarEstado();
    aoFechar?.();
    if (anterior instanceof HTMLElement && document.contains(anterior)) {
      anterior.focus();
    }
  }

  botaoFechar.addEventListener('click', fechar);
  fundo.addEventListener('pointerdown', (evento) => {
    if (evento.target === fundo) {
      fechar();
    }
  });
  fundo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      evento.stopPropagation();
      fechar();
    } else if (evento.key === 'Tab') {
      prenderFoco(evento, caixa);
    }
  });

  camada.append(fundo);
  abertos += 1;
  avisarEstado();
  entrar(caixa, { y: 30 });
  botaoFechar.focus();
  return { corpo, fechar };
}
