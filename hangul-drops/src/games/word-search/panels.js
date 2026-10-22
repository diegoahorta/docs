// Painéis HTML do Caça-Palavras: início, fim de nível e fim de jogo.

import { criarElemento } from '../../core/utils.js';
import {
  criarLinhaDeRecorde,
  criarListaDeRevisao,
  criarResultados,
  mostrarPainel,
} from '../gamePanel.js';
import { NIVEIS } from './wordSearchLogic.js';

export { painelPausa } from '../gamePanel.js';

/** Painel inicial com instruções. */
export function painelInicio(camada, { recorde, aoComecar, aoSair }) {
  return mostrarPainel(camada, {
    titulo: 'Caça-Palavras',
    tituloNativo: '낱말 찾기',
    conteudo: [
      criarElemento('p', {
        text: 'As palavras estão escondidas na grade de sílabas. Leia a pista, ouça o 🔊 e encontre cada uma!',
      }),
      criarElemento('ul', { class: 'jogo-instrucoes' }, [
        criarElemento('li', { text: '👆 Arraste o dedo ou o mouse da primeira à última sílaba.' }),
        criarElemento('li', {
          text: '⌨️ Setas movem o cursor; Enter marca o início e Enter de novo marca o fim.',
        }),
        criarElemento('li', {
          text: '↘️ A partir do nível 3, as palavras também ficam na diagonal.',
        }),
        criarElemento('li', { text: '💡 Travou? Use a dica (custa pontos).' }),
      ]),
      criarElemento('p', {
        class: 'texto-suave',
        text: `${NIVEIS.length} níveis: a grade vai de ${NIVEIS[0].tamanho}×${NIVEIS[0].tamanho} a ${NIVEIS.at(-1).tamanho}×${NIVEIS.at(-1).tamanho}.`,
      }),
      recorde > 0 ? criarElemento('p', { text: `🏆 Recorde: ${recorde} pontos` }) : null,
    ],
    acoes: [
      { rotulo: 'Começar', aoClicar: aoComecar, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}

/** Painel entre um nível e outro. */
export function painelNivelCompleto(camada, { numero, pontos, bonus, aoProximo, aoSair }) {
  const proximo = NIVEIS[numero];
  return mostrarPainel(camada, {
    titulo: `Nível ${numero} completo!`,
    tituloNativo: '잘했어요!',
    conteudo: [
      criarResultados([
        ['Pontos', pontos],
        ['Bônus', bonus > 0 ? `+${bonus}` : 'usou dica'],
      ]),
      criarElemento('p', {
        class: 'texto-suave',
        text: `Próximo: grade ${proximo.tamanho}×${proximo.tamanho} com ${proximo.palavras} palavras.`,
      }),
    ],
    acoes: [
      { rotulo: 'Próximo nível', aoClicar: aoProximo, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}

/** Painel final, depois do último nível. */
export function painelFim(camada, dados) {
  const { pontos, palavras, recorde, novoRecorde, revisar, aoJogarDeNovo, aoSair } = dados;
  return mostrarPainel(camada, {
    titulo: 'Você completou!',
    tituloNativo: '축하해요!',
    conteudo: [
      criarLinhaDeRecorde(novoRecorde, recorde),
      criarResultados([
        ['Pontos', pontos],
        ['Palavras', palavras],
      ]),
      ...criarListaDeRevisao(revisar),
    ],
    acoes: [
      { rotulo: 'Jogar de novo', aoClicar: aoJogarDeNovo, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}
