// Painéis HTML do Hangul Rain: início e fim de jogo (a pausa é compartilhada).

import { criarElemento } from '../../core/utils.js';
import { buscarItem } from '../../data/hangul.js';
import {
  criarLinhaDeRecorde,
  criarListaDeRevisao,
  criarResultados,
  mostrarPainel,
} from '../gamePanel.js';

export { painelPausa } from '../gamePanel.js';

/** Lista os itens da rodada (com romanização, se estiver ligada nas configurações). */
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
    titulo: 'Hangul Rain',
    tituloNativo: '한글 비',
    conteudo: [
      criarElemento('p', {
        text: 'As letras e sílabas estão caindo! Digite a romanização de cada uma antes que ela toque o chão.',
      }),
      criarElemento('ul', { class: 'jogo-instrucoes' }, [
        criarElemento('li', { text: '⌨️ Acertou a leitura? A gota estoura sozinha.' }),
        criarElemento('li', {
          text: '⏎ Enter confirma (útil quando uma leitura começa a outra, como "g" e "ga").',
        }),
        criarElemento('li', { text: '❤️ 3 vidas. Errou? Veja a resposta e a dica.' }),
        criarElemento('li', { text: '⏸ Esc pausa o jogo.' }),
      ]),
      criarElemento('h3', { text: 'Nesta rodada' }),
      listaDaRodada(pool),
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

/** Painel de fim de jogo com pontuação e os itens que caíram. */
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
