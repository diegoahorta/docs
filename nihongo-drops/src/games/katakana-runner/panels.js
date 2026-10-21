// Painéis HTML do Katakana Runner: início e fim de jogo (a pausa é compartilhada).

import { criarElemento } from '../../core/utils.js';
import { buscarKana } from '../../data/kana.js';
import {
  criarLinhaDeRecorde,
  criarListaDeRevisao,
  criarResultados,
  mostrarPainel,
} from '../gamePanel.js';

export { painelPausa } from '../gamePanel.js';

/** Katakana da rodada, cada um com o hiragana equivalente embaixo. */
function listaDeKatakana(ids) {
  return criarElemento(
    'ul',
    { class: 'jogo-kana-lista', 'aria-label': 'Katakana desta rodada' },
    ids.map((id) => {
      const item = buscarKana(id);
      return criarElemento('li', {}, [
        criarElemento('span', { class: 'kana', lang: 'ja', text: item.kana }),
        criarElemento('span', { class: 'texto-suave', lang: 'ja', text: item.par }),
        criarElemento('span', { class: 'romaji', text: item.romaji }),
      ]);
    }),
  );
}

/** Painel inicial com instruções. */
export function painelInicio(camada, { pool, recorde, aoComecar, aoSair }) {
  return mostrarPainel(camada, {
    titulo: 'Katakana Runner',
    tituloJP: 'カタカナラン',
    conteudo: [
      criarElemento('p', {
        text: 'Corra pelas pistas e esteja na pista do bloco com o katakana pedido quando ele chegar!',
      }),
      criarElemento('ul', { class: 'jogo-instrucoes' }, [
        criarElemento('li', { text: '⬆️⬇️ Setas (ou W/S) trocam de pista.' }),
        criarElemento('li', { text: '👆 Toque acima ou abaixo do corredor, ou use ▲ ▼.' }),
        criarElemento('li', { text: '🔊 Ouça o som; sem romaji, a pista é o hiragana (か → カ).' }),
        criarElemento('li', { text: '❤️ 3 vidas. A velocidade aumenta a cada 5 acertos.' }),
      ]),
      criarElemento('h3', { text: 'Katakana desta rodada' }),
      listaDeKatakana(pool),
      recorde > 0 ? criarElemento('p', { text: `🏆 Recorde: ${recorde} pontos` }) : null,
    ],
    acoes: [
      { rotulo: 'Começar', aoClicar: aoComecar, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}

/** Painel de fim de jogo. */
export function painelFim(camada, dados) {
  const { pontos, acertos, nivel, recorde, novoRecorde, errados, aoJogarDeNovo, aoSair } = dados;
  return mostrarPainel(camada, {
    titulo: 'Fim de jogo',
    tituloJP: 'ゲームオーバー',
    conteudo: [
      criarLinhaDeRecorde(novoRecorde, recorde),
      criarResultados([
        ['Pontos', pontos],
        ['Acertos', acertos],
        ['Nível', nivel],
      ]),
      ...criarListaDeRevisao(errados),
    ],
    acoes: [
      { rotulo: 'Jogar de novo', aoClicar: aoJogarDeNovo, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}
