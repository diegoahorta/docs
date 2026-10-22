// Painéis HTML do Memory Hangul: início, fim de nível e fim de jogo.

import { criarElemento } from '../../core/utils.js';
import {
  criarLinhaDeRecorde,
  criarListaDeRevisao,
  criarResultados,
  mostrarPainel,
} from '../gamePanel.js';
import { NIVEIS } from './memoryLogic.js';

export { painelPausa } from '../gamePanel.js';

function textoDeEstrelas(estrelas) {
  return '★'.repeat(estrelas) + '☆'.repeat(3 - estrelas);
}

/** Painel inicial com as regras e a lista de níveis. */
export function painelInicio(camada, { recorde, aoComecar, aoSair }) {
  return mostrarPainel(camada, {
    titulo: 'Memory Hangul',
    tituloNativo: '기억 게임',
    conteudo: [
      criarElemento('p', {
        text: 'Vire duas cartas por vez e encontre os pares: cada letra ou sílaba com a sua romanização, e cada palavra com a sua imagem.',
      }),
      criarElemento('ul', { class: 'jogo-instrucoes' }, [
        criarElemento('li', { text: '🖱️ Clique ou toque para virar uma carta.' }),
        criarElemento('li', { text: '⌨️ Setas escolhem a carta; Enter ou Espaço vira.' }),
        criarElemento('li', { text: '🔊 Toda carta virada é pronunciada.' }),
        criarElemento('li', { text: '💡 Errou o par? Aparece a leitura certa e a dica.' }),
      ]),
      criarElemento('h3', { text: 'Níveis' }),
      criarElemento(
        'ol',
        { class: 'jogo-instrucoes jogo-niveis' },
        NIVEIS.map((nivel) =>
          criarElemento('li', { text: `${nivel.titulo} — ${nivel.pares} pares` }),
        ),
      ),
      recorde > 0 ? criarElemento('p', { text: `🏆 Recorde: ${recorde} pontos` }) : null,
    ],
    acoes: [
      { rotulo: 'Começar', aoClicar: aoComecar, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}

/** Painel entre um nível e outro. */
export function painelNivelCompleto(camada, dados) {
  const { numero, estrelas, jogadas, pontos, aoProximo, aoSair } = dados;
  return mostrarPainel(camada, {
    titulo: `Nível ${numero} completo!`,
    tituloNativo: '잘했어요!',
    conteudo: [
      criarElemento('p', {
        class: 'jogo-estrelas',
        'aria-label': `${estrelas} de 3 estrelas`,
        text: textoDeEstrelas(estrelas),
      }),
      criarResultados([
        ['Jogadas', jogadas],
        ['Pontos', pontos],
      ]),
      criarElemento('p', {
        class: 'texto-suave',
        text: `Próximo: ${NIVEIS[numero].titulo} — ${NIVEIS[numero].pares} pares`,
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
  const { pontos, estrelas, recorde, novoRecorde, revisar, aoJogarDeNovo, aoSair } = dados;
  return mostrarPainel(camada, {
    titulo: 'Você completou!',
    tituloNativo: '축하해요!',
    conteudo: [
      criarLinhaDeRecorde(novoRecorde, recorde),
      criarResultados([
        ['Pontos', pontos],
        ['Estrelas', `${estrelas}/${NIVEIS.length * 3}`],
      ]),
      ...criarListaDeRevisao(revisar),
    ],
    acoes: [
      { rotulo: 'Jogar de novo', aoClicar: aoJogarDeNovo, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}
