// Painéis HTML do Monte a Sílaba: início e fim de jogo (a pausa é compartilhada),
// e a pergunta no topo ("Monte: ga 🔊").

import { criarElemento } from '../../core/utils.js';
import { criarBotaoFala } from '../../ui/speakButton.js';
import { pulsar } from '../../ui/motion.js';
import {
  criarLinhaDeRecorde,
  criarListaDeRevisao,
  criarResultados,
  mostrarPainel,
} from '../gamePanel.js';
import { PENALIDADE_S } from './builderLogic.js';

export { painelPausa } from '../gamePanel.js';

/** Painel inicial com instruções e exemplos de montagem. */
export function painelInicio(camada, { recorde, aoComecar, aoSair }) {
  return mostrarPainel(camada, {
    titulo: 'Monte a Sílaba',
    tituloNativo: '음절 만들기',
    conteudo: [
      criarElemento('p', {
        text: 'No coreano, as letras se juntam em blocos: uma consoante + uma vogal formam uma sílaba. Monte a sílaba pedida antes que o tempo acabe!',
      }),
      criarElemento('p', {
        class: 'pares-exemplo',
        lang: 'ko',
        text: 'ㄱ + ㅏ = 가　ㄴ + ㅗ = 노　ㅁ + ㅣ = 미',
      }),
      criarElemento('ul', { class: 'jogo-instrucoes' }, [
        criarElemento('li', { text: '👆 Toque numa consoante e numa vogal (em qualquer ordem).' }),
        criarElemento('li', { text: '⌨️ Setas escolhem a peça; Enter ou Espaço seleciona.' }),
        criarElemento('li', { text: '🔊 A voz fala a sílaba que você montou.' }),
        criarElemento('li', {
          text: `⏱️ Errou? Perde ${PENALIDADE_S} s e vê como montar a certa.`,
        }),
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
  const { pontos, nivel, silabas, recorde, novoRecorde, errados, aoJogarDeNovo, aoSair } = dados;
  return mostrarPainel(camada, {
    titulo: 'O tempo acabou!',
    tituloNativo: '시간 초과',
    conteudo: [
      criarLinhaDeRecorde(novoRecorde, recorde),
      criarResultados([
        ['Pontos', pontos],
        ['Nível', nivel],
        ['Sílabas', silabas],
      ]),
      ...criarListaDeRevisao(errados),
    ],
    acoes: [
      { rotulo: 'Jogar de novo', aoClicar: aoJogarDeNovo, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}

/** Pergunta no topo: "Monte: ga 🔊" (ou só o som, sem romanização). */
export function criarPergunta(camada) {
  const pergunta = criarElemento('div', {
    class: 'runner-pergunta pergunta-abaixo-do-relogio',
    'aria-live': 'polite',
  });
  pergunta.hidden = true;
  camada.append(pergunta);
  return {
    mostrar(alvo, mostrarRomanizacao) {
      pergunta.replaceChildren(
        criarElemento('span', { class: 'texto-suave', text: 'Monte:' }),
        criarElemento('strong', {
          class: 'runner-leitura',
          text: mostrarRomanizacao ? alvo.romanizacao : 'ouça',
        }),
        criarBotaoFala(alvo.fala, { rotulo: 'a sílaba pedida' }),
      );
      pergunta.hidden = false;
      pulsar(pergunta, 1.08);
    },
    esconder() {
      pergunta.hidden = true;
    },
  };
}
