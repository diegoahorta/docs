// Botão 🔊 que fala um texto em japonês.

import { falar, falaDisponivel } from '../core/speech.js';
import { criarElemento } from '../core/utils.js';
import { pulsar } from './motion.js';

/** Cria um botão 🔊. `rotulo` é o texto lido pelo leitor de tela. */
export function botaoFalar(texto, { rotulo = `Ouvir ${texto}`, classe = '' } = {}) {
  const botao = criarElemento('button', {
    type: 'button',
    class: `botao-falar ${classe}`,
    'aria-label': rotulo,
    title: 'Ouvir a pronúncia',
    text: '🔊',
    onClick: (evento) => {
      evento.stopPropagation();
      falar(texto);
      pulsar(botao, 1.25);
    },
  });
  if (!falaDisponivel()) {
    botao.disabled = true;
    botao.title = 'Este navegador não tem síntese de voz';
  }
  return botao;
}
