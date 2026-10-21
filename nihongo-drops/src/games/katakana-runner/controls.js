// Parte HTML do Katakana Runner: a pergunta no topo (leitura + 🔊)
// e os botões ▲ ▼ ⏸ no rodapé (para toque e para leitores de tela).

import { criarElemento } from '../../core/utils.js';
import { criarBotaoFala } from '../../ui/speakButton.js';
import { pulsar } from '../../ui/motion.js';

/**
 * Cria a pergunta e os controles dentro da camada do jogo.
 * Callbacks: aoSubir(), aoDescer(), aoPausar().
 */
export function criarControles(camada, { aoSubir, aoDescer, aoPausar }) {
  const pergunta = criarElemento('div', { class: 'runner-pergunta', 'aria-live': 'polite' });
  const botao = (texto, rotulo, acao) =>
    criarElemento('button', {
      type: 'button',
      class: 'botao-icone jogo-botao runner-botao',
      'aria-label': rotulo,
      text: texto,
      onClick: acao,
    });
  const barra = criarElemento('div', { class: 'runner-controles' }, [
    botao('⏸', 'Pausar (Esc)', aoPausar),
    botao('▼', 'Descer uma pista (seta para baixo)', aoDescer),
    botao('▲', 'Subir uma pista (seta para cima)', aoSubir),
  ]);
  camada.append(pergunta, barra);

  return {
    barra,

    /**
     * Mostra o que procurar. Com romaji: "ka"; sem romaji: o hiragana "か".
     * O 🔊 fala o som do katakana pedido.
     */
    perguntar(alvo, mostrarRomaji) {
      const dica = mostrarRomaji ? alvo.romaji : alvo.par;
      pergunta.replaceChildren(
        criarElemento('span', { class: 'texto-suave', text: 'Pule em:' }),
        criarElemento('strong', {
          class: 'runner-leitura',
          lang: mostrarRomaji ? undefined : 'ja',
          text: dica,
        }),
        criarBotaoFala(alvo.kana, { rotulo: dica }),
      );
      pergunta.hidden = false;
      pulsar(pergunta, 1.08);
    },

    mostrar(visivel) {
      barra.style.visibility = visivel ? 'visible' : 'hidden';
      pergunta.hidden = !visivel || pergunta.childElementCount === 0;
    },

    destroy() {
      pergunta.remove();
      barra.remove();
    },
  };
}
