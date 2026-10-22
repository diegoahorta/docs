// Painéis HTML do Hangul Runner: início e fim de jogo (a pausa é compartilhada).

import { criarElemento } from '../../core/utils.js';
import { buscarItem } from '../../data/hangul.js';
import {
  criarLinhaDeRecorde,
  criarListaDeRevisao,
  criarResultados,
  mostrarPainel,
} from '../gamePanel.js';

export { painelPausa } from '../gamePanel.js';

/** Itens da rodada (com romanização, se estiver ligada nas configurações). */
function listaDaRodada(ids) {
  return criarElemento(
    'ul',
    { class: 'jogo-hangul-lista', 'aria-label': 'Letras e sílabas desta rodada' },
    ids.map((id) => {
      const item = buscarItem(id);
      return criarElemento('li', {}, [
        criarElemento('span', { class: 'hangul', lang: 'ko', text: item.hangul }),
        criarElemento('span', { class: 'romanizacao', text: item.romanizacao }),
      ]);
    }),
  );
}

/** Painel inicial com instruções. */
export function painelInicio(camada, { pool, recorde, aoComecar, aoSair }) {
  return mostrarPainel(camada, {
    titulo: 'Hangul Runner',
    tituloNativo: '한글 달리기',
    conteudo: [
      criarElemento('p', {
        text: 'Corra pelas pistas e esteja na pista do bloco com a letra ou sílaba pedida quando ele chegar!',
      }),
      criarElemento('ul', { class: 'jogo-instrucoes' }, [
        criarElemento('li', { text: '⬆️⬇️ Setas (ou W/S) trocam de pista.' }),
        criarElemento('li', { text: '👆 Toque acima ou abaixo do corredor, ou use ▲ ▼.' }),
        criarElemento('li', {
          text: '🔊 Ouça o som; com a romanização desligada, você joga só de ouvido.',
        }),
        criarElemento('li', { text: '❤️ 3 vidas. A velocidade aumenta a cada 5 acertos.' }),
      ]),
      criarElemento('h3', { text: 'Nesta rodada' }),
      listaDaRodada(pool),
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
    tituloNativo: '게임 오버',
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
