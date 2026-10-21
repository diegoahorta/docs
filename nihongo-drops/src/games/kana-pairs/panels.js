// Painéis HTML do Pares de Kana: início e fim de jogo (a pausa é compartilhada).

import { criarElemento } from '../../core/utils.js';
import {
  criarLinhaDeRecorde,
  criarListaDeRevisao,
  criarResultados,
  mostrarPainel,
} from '../gamePanel.js';
import { PENALIDADE_S } from './pairsLogic.js';

export { painelPausa } from '../gamePanel.js';

/** Painel inicial com instruções e um exemplo de par. */
export function painelInicio(camada, { recorde, aoComecar, aoSair }) {
  return mostrarPainel(camada, {
    titulo: 'Pares de Kana',
    tituloJP: 'ひらがな・カタカナ',
    conteudo: [
      criarElemento('p', {
        text: 'Cada som tem duas formas: hiragana e katakana. Ligue cada hiragana ao katakana com o mesmo som antes que o tempo acabe!',
      }),
      criarElemento('p', {
        class: 'pares-exemplo',
        lang: 'ja',
        text: 'あ ↔ ア　か ↔ カ　さ ↔ サ',
      }),
      criarElemento('ul', { class: 'jogo-instrucoes' }, [
        criarElemento('li', { text: '👆 Toque numa carta de um lado e depois na do outro.' }),
        criarElemento('li', { text: '⌨️ Setas escolhem a carta; Enter ou Espaço seleciona.' }),
        criarElemento('li', { text: `⏱️ Errou? Perde ${PENALIDADE_S} s e vê a dica.` }),
        criarElemento('li', { text: '📈 A cada nível: mais pares e menos tempo.' }),
      ]),
      recorde > 0 ? criarElemento('p', { text: `🏆 Recorde: ${recorde} pontos` }) : null,
    ],
    acoes: [
      { rotulo: 'Começar', aoClicar: aoComecar, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}

/** Painel de fim de jogo (o tempo acabou). */
export function painelFim(camada, dados) {
  const { pontos, nivel, pares, recorde, novoRecorde, errados, aoJogarDeNovo, aoSair } = dados;
  return mostrarPainel(camada, {
    titulo: 'O tempo acabou!',
    tituloJP: 'じかんぎれ',
    conteudo: [
      criarLinhaDeRecorde(novoRecorde, recorde),
      criarResultados([
        ['Pontos', pontos],
        ['Nível', nivel],
        ['Pares', pares],
      ]),
      ...criarListaDeRevisao(errados),
    ],
    acoes: [
      { rotulo: 'Jogar de novo', aoClicar: aoJogarDeNovo, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}
