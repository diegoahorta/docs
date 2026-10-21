// Lista HTML de palavras do Caça-Palavras: a pista de cada palavra
// (emoji, português, número de kana, romaji opcional e 🔊) e o botão de dica.

import { criarElemento } from '../../core/utils.js';
import { criarBotaoFala } from '../../ui/speakButton.js';
import { pulsar } from '../../ui/motion.js';
import { CUSTO_DA_DICA } from './wordSearchLogic.js';

/**
 * Depois de um clique com mouse/toque, devolve o foco ao jogo para que as
 * setas e o Enter voltem a controlar a grade. (No teclado, `detail` é 0.)
 */
function soltarFocoSeForMouse(evento) {
  if (evento.detail > 0) {
    evento.currentTarget.blur();
  }
}

function criarItem(palavra, mostrarRomaji) {
  const tamanho = Array.from(palavra.kana).length;
  const revelado = criarElemento('span', { class: 'caca-revelado', lang: 'ja' });
  const item = criarElemento('li', { class: 'caca-item', dataset: { id: palavra.id } }, [
    criarElemento('span', { class: 'caca-emoji', 'aria-hidden': 'true', text: palavra.emoji }),
    criarElemento('span', { class: 'caca-pista' }, [
      criarElemento('strong', { text: palavra.pt }),
      criarElemento('small', {
        class: 'texto-suave',
        text: mostrarRomaji ? `${palavra.romaji} · ${tamanho} kana` : `${tamanho} kana`,
      }),
      revelado,
    ]),
    criarBotaoFala(palavra.kana, { rotulo: palavra.pt }),
  ]);
  return { item, revelado };
}

/**
 * Cria a lista dentro da camada do jogo.
 * Callbacks: aoDica(), aoPausar().
 */
export function criarListaDePalavras(camada, { aoDica, aoPausar }) {
  const lista = criarElemento('ul', {
    class: 'caca-palavras',
    'aria-label': 'Palavras para encontrar',
  });
  const botaoDica = criarElemento('button', {
    type: 'button',
    class: 'botao botao-secundario',
    text: `💡 Dica (−${CUSTO_DA_DICA})`,
    onClick: (evento) => {
      aoDica();
      soltarFocoSeForMouse(evento);
    },
  });
  const botaoPausa = criarElemento('button', {
    type: 'button',
    class: 'botao botao-secundario',
    'aria-label': 'Pausar (Esc)',
    text: '⏸',
    onClick: (evento) => {
      aoPausar();
      soltarFocoSeForMouse(evento);
    },
  });
  const painel = criarElemento('aside', { class: 'caca-lista' }, [
    criarElemento('h2', { class: 'caca-titulo', text: 'Encontre:' }),
    lista,
    criarElemento('div', { class: 'caca-acoes' }, [botaoDica, botaoPausa]),
  ]);
  camada.append(painel);
  const itens = new Map();

  return {
    elemento: painel,

    /** Preenche a lista com as palavras do nível. */
    preencher(palavras, mostrarRomaji) {
      itens.clear();
      lista.replaceChildren(
        ...palavras.map((palavra) => {
          const criado = criarItem(palavra, mostrarRomaji);
          itens.set(palavra.id, criado);
          return criado.item;
        }),
      );
    },

    /** Risca a palavra e mostra como ela se escreve. */
    marcarEncontrada(palavra) {
      const criado = itens.get(palavra.id);
      if (!criado) {
        return;
      }
      criado.item.classList.add('encontrada');
      criado.revelado.textContent = `${palavra.kana} ✔`;
      pulsar(criado.item, 1.05);
    },

    mostrar(visivel) {
      painel.style.visibility = visivel ? 'visible' : 'hidden';
    },

    destroy() {
      painel.remove();
    },
  };
}
