// Botão 🔊 reutilizável: fala o texto em japonês ao ser clicado.

import { criarElemento } from '../core/utils.js';
import { falaDisponivel, falar } from '../core/speech.js';
import { pulsar } from './motion.js';

/** Cria um botão que pronuncia `texto`. `rotulo` é usado no aria-label. */
export function criarBotaoFala(texto, { rotulo = texto, classe = '' } = {}) {
  const disponivel = falaDisponivel();
  const botao = criarElemento('button', {
    type: 'button',
    class: `botao-fala ${classe}`,
    'aria-label': `Ouvir a pronúncia de ${rotulo}`,
    title: disponivel ? 'Ouvir pronúncia' : 'Seu navegador não tem síntese de voz',
    disabled: !disponivel,
    text: '🔊',
  });
  botao.addEventListener('click', (evento) => {
    evento.stopPropagation();
    falar(texto);
    pulsar(botao, 1.25);
    // Com mouse/toque, solta o foco para o teclado voltar ao jogo (no teclado, detail é 0).
    if (evento.detail > 0) {
      botao.blur();
    }
  });
  return botao;
}
