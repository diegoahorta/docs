// Barra de digitação do Hangul Rain (campo HTML de verdade, para funcionar
// com teclado físico, teclado virtual do celular e leitores de tela).

import { criarElemento } from '../../core/utils.js';
import { tremer } from '../../ui/motion.js';

const TEMPO_INVALIDO_MS = 300;

/**
 * Cria a barra no rodapé da camada do jogo.
 * Callbacks: aoDigitar(texto), aoEnviar(texto), aoPausar(), aoMover().
 */
export function criarBarraDeEntrada(camada, { aoDigitar, aoEnviar, aoPausar, aoMover }) {
  const entrada = criarElemento('input', {
    type: 'text',
    class: 'jogo-entrada',
    autocomplete: 'off',
    autocapitalize: 'none',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'send',
    maxlength: '4',
    placeholder: 'romanização…',
    'aria-label': 'Digite a romanização da letra ou sílaba',
  });
  const botaoEnviar = criarElemento('button', {
    type: 'submit',
    class: 'botao-icone jogo-botao',
    'aria-label': 'Enviar resposta',
    text: '⏎',
  });
  const botaoPausa = criarElemento('button', {
    type: 'button',
    class: 'botao-icone jogo-botao',
    'aria-label': 'Pausar (Esc)',
    text: '⏸',
    onClick: () => aoPausar(),
  });
  const formulario = criarElemento('form', { class: 'jogo-barra-entrada' }, [
    entrada,
    botaoEnviar,
    botaoPausa,
  ]);

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    aoEnviar(entrada.value);
  });
  entrada.addEventListener('input', () => aoDigitar(entrada.value));
  entrada.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      aoPausar();
    }
  });

  // No celular, o teclado virtual cobre o rodapé: subimos a barra junto com ele.
  const janela = window.visualViewport;
  const acompanharTeclado = () => {
    const sobra = janela ? window.innerHeight - janela.height - janela.offsetTop : 0;
    formulario.style.bottom = `${Math.max(0, sobra)}px`;
    aoMover?.();
  };
  janela?.addEventListener('resize', acompanharTeclado);
  janela?.addEventListener('scroll', acompanharTeclado);

  camada.append(formulario);

  return {
    elemento: formulario,
    limpar() {
      entrada.value = '';
    },
    focar() {
      entrada.focus({ preventScroll: true });
    },
    /** Esconde a barra sem tirá-la do layout (a linha do chão depende da posição dela). */
    mostrar(visivel) {
      formulario.style.visibility = visivel ? 'visible' : 'hidden';
    },
    /** Apaga o texto e pisca em vermelho (nada na tela tem essa leitura). */
    marcarInvalido() {
      entrada.value = '';
      entrada.classList.add('invalido');
      tremer(entrada);
      setTimeout(() => entrada.classList.remove('invalido'), TEMPO_INVALIDO_MS);
    },
    destroy() {
      janela?.removeEventListener('resize', acompanharTeclado);
      janela?.removeEventListener('scroll', acompanharTeclado);
      formulario.remove();
    },
  };
}
