// Painéis HTML do Kana Rain: início e fim de jogo (a pausa é compartilhada).

import { criarElemento } from '../../core/utils.js';
import { buscarKana } from '../../data/kana.js';
import {
  criarLinhaDeRecorde,
  criarListaDeRevisao,
  criarResultados,
  mostrarPainel,
} from '../gamePanel.js';

export { painelPausa } from '../gamePanel.js';

/** Lista os kana da rodada (com romaji, se estiver ligado nas configurações). */
function listaDeKana(ids) {
  return criarElemento(
    'ul',
    { class: 'jogo-kana-lista', 'aria-label': 'Kana desta rodada' },
    ids.map((id) => {
      const item = buscarKana(id);
      return criarElemento('li', {}, [
        criarElemento('span', { class: 'kana', lang: 'ja', text: item.kana }),
        criarElemento('span', { class: 'romaji', text: item.romaji }),
      ]);
    }),
  );
}

/** Painel inicial com instruções. */
export function painelInicio(camada, { pool, recorde, aoComecar, aoSair }) {
  return mostrarPainel(camada, {
    titulo: 'Kana Rain',
    tituloJP: 'かなのあめ',
    conteudo: [
      criarElemento('p', {
        text: 'Os hiragana estão caindo! Digite o romaji de cada um antes que ele toque o chão.',
      }),
      criarElemento('ul', { class: 'jogo-instrucoes' }, [
        criarElemento('li', { text: '⌨️ Acertou a leitura? O kana estoura sozinho.' }),
        criarElemento('li', { text: '⏎ Enter confirma (útil para ん = "n").' }),
        criarElemento('li', { text: '❤️ 3 vidas. Errou? Veja a resposta e a dica.' }),
        criarElemento('li', { text: '⏸ Esc pausa o jogo.' }),
      ]),
      criarElemento('h3', { text: 'Kana desta rodada' }),
      listaDeKana(pool),
      criarElemento('p', {
        class: 'texto-suave',
        text: 'Novos grupos são liberados conforme você domina estes (SRS).',
      }),
      recorde > 0 ? criarElemento('p', { text: `🏆 Recorde: ${recorde} pontos` }) : null,
    ],
    acoes: [
      { rotulo: 'Começar', aoClicar: aoComecar, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}

/** Painel de fim de jogo com pontuação e os kana que caíram. */
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
