// Tela final: placar (ou pódio das equipes), estrelas, recorde, palavras da rodada
// e a lista do que errou, para revisar com o guia fonético.

import { estrelas, fraseFinal } from '../quiz/pontuacao.js';
import { salvarResultado } from '../core/placar.js';
import { tocarFanfarra } from '../core/audio.js';
import { animacoesReduzidas } from '../core/settings.js';
import { criarElemento } from '../core/utils.js';
import { botaoFalar } from '../ui/falar.js';
import { silabasDaPalavra } from '../ui/guia.js';
import { chuvaDeConfete } from '../ui/confete.js';
import { entrar, gsap } from '../ui/motion.js';

const MEDALHAS = ['🥇', '🥈', '🥉', '🏅'];

/** Conta de 0 até o valor final (ou mostra direto com animações reduzidas). */
function contarAte(elemento, valor, animacoes) {
  if (animacoesReduzidas()) {
    elemento.textContent = String(valor);
    return;
  }
  const estado = { n: 0 };
  animacoes.push(
    gsap.to(estado, {
      n: valor,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => {
        elemento.textContent = String(Math.round(estado.n));
      },
    }),
  );
}

function blocoSolo(time, total, novoRecorde, numeroDeEstrelas, animacoes) {
  const pontos = criarElemento('strong', { class: 'resultado-pontos', text: '0' });
  contarAte(pontos, time.pontos, animacoes);
  const estrelasEl = criarElemento(
    'p',
    { class: 'resultado-estrelas', 'aria-label': `${numeroDeEstrelas} de 3 estrelas` },
    [0, 1, 2].map((i) =>
      criarElemento('span', {
        class: i < numeroDeEstrelas ? 'estrela-cheia' : 'estrela-vazia',
        text: i < numeroDeEstrelas ? '★' : '☆',
      }),
    ),
  );
  if (!animacoesReduzidas()) {
    animacoes.push(
      gsap.from(estrelasEl.children, {
        scale: 0,
        rotation: -180,
        duration: 0.6,
        stagger: 0.25,
        delay: 0.6,
        ease: 'back.out(2)',
      }),
    );
  }
  return criarElemento('div', { class: 'resultado-solo' }, [
    estrelasEl,
    criarElemento('p', { class: 'resultado-rotulo', text: 'pontos' }),
    pontos,
    novoRecorde ? criarElemento('p', { class: 'novo-recorde', text: '🏆 NOVO RECORDE!' }) : null,
    criarElemento('ul', { class: 'resultado-numeros' }, [
      criarElemento('li', {}, [
        criarElemento('strong', { text: `${time.acertos}/${total}` }),
        'acertos',
      ]),
      criarElemento('li', {}, [
        criarElemento('strong', { text: `🔥 ${time.maiorCombo}` }),
        'maior combo',
      ]),
    ]),
    criarElemento('p', { class: 'resultado-frase', text: fraseFinal(numeroDeEstrelas) }),
  ]);
}

function blocoEquipes(times) {
  const ranking = [...times].sort((a, b) => b.pontos - a.pontos);
  const empate = ranking.length > 1 && ranking[0].pontos === ranking[1].pontos;
  return criarElemento('div', { class: 'resultado-equipes' }, [
    criarElemento('p', {
      class: 'resultado-frase',
      text: empate
        ? '🤝 Empate no topo! Que disputa!'
        : `🎉 A equipe ${ranking[0].emoji} ${ranking[0].nome} venceu o show!`,
    }),
    criarElemento(
      'ol',
      { class: 'podio' },
      ranking.map((time, posicao) =>
        criarElemento('li', { class: `podio-lugar cor-${time.cor}` }, [
          criarElemento('span', {
            class: 'podio-medalha',
            'aria-hidden': 'true',
            text: MEDALHAS[posicao],
          }),
          criarElemento('strong', { text: `${time.emoji} ${time.nome}` }),
          criarElemento('span', { class: 'podio-pontos', text: `${time.pontos} pts` }),
          criarElemento('span', {
            class: 'texto-suave',
            text: `${time.acertos}/${time.respondidas} acertos · 🔥 ${time.maiorCombo}`,
          }),
        ]),
      ),
    ),
  ]);
}

/** Lista de palavras da rodada (figurinhas novas com ✨). */
function blocoPalavras(historico, palavrasNovas) {
  const vistas = new Map();
  historico.forEach(({ pergunta }) => {
    if (pergunta.palavra) {
      vistas.set(pergunta.palavra.id, pergunta.palavra);
    }
  });
  if (vistas.size === 0) {
    return null;
  }
  return criarElemento('section', { class: 'resultado-secao' }, [
    criarElemento('h2', { text: '🗣️ Palavras desta rodada' }),
    criarElemento(
      'ul',
      { class: 'lista-palavras' },
      [...vistas.values()].map((palavra) =>
        criarElemento('li', { class: 'cartao-palavra' }, [
          criarElemento('span', {
            class: 'cartao-palavra-emoji',
            'aria-hidden': 'true',
            text: palavra.emoji,
          }),
          criarElemento('span', { class: 'cartao-palavra-kana', lang: 'ja', text: palavra.kana }),
          criarElemento('span', { class: 'cartao-palavra-romaji', text: palavra.romaji }),
          criarElemento('span', { text: palavra.pt }),
          palavrasNovas.includes(palavra.id)
            ? criarElemento('span', { class: 'etiqueta etiqueta-nova', text: '✨ nova' })
            : null,
          botaoFalar(palavra.kana, { rotulo: `Ouvir ${palavra.pt}` }),
        ]),
      ),
    ),
  ]);
}

/** O que foi errado, com a resposta certa e as sílabas. */
function blocoRevisao(historico) {
  const erros = historico.filter((registro) => !registro.acertou);
  if (erros.length === 0) {
    return criarElemento('section', { class: 'resultado-secao' }, [
      criarElemento('h2', { text: '🎯 Revisão' }),
      criarElemento('p', { text: 'Nenhum erro! Gabaritou! 🤩' }),
    ]);
  }
  return criarElemento('section', { class: 'resultado-secao' }, [
    criarElemento('h2', { text: `🔁 Para revisar (${erros.length})` }),
    criarElemento(
      'ul',
      { class: 'lista-revisao' },
      erros.map(({ pergunta, escolhida }) => {
        const alvo = pergunta.palavra ?? pergunta.item;
        return criarElemento('li', {}, [
          criarElemento('span', { class: 'revisao-kana', lang: 'ja', text: alvo.kana }),
          pergunta.palavra
            ? silabasDaPalavra(alvo.kana)
            : criarElemento('strong', { text: alvo.romaji }),
          pergunta.palavra ? criarElemento('span', { text: `${alvo.emoji} ${alvo.pt}` }) : null,
          criarElemento('span', {
            class: 'texto-suave',
            text: escolhida ? `você marcou: ${escolhida.rotulo}` : 'tempo esgotado',
          }),
          botaoFalar(alvo.kana),
        ]);
      }),
    ),
  ]);
}

/**
 * Mostra o resultado. Devolve a função de limpeza.
 * @param {object} resultado { temporada, times, historico, palavrasNovas }
 * @param {object} acoes { aoJogarDeNovo, aoInicio }
 */
export function mostrarResultado(conteiner, resultado, { aoJogarDeNovo, aoInicio }) {
  const { temporada, times, historico, palavrasNovas } = resultado;
  const animacoes = [];
  const solo = times.length === 1;
  const total = historico.length;
  const numeroDeEstrelas = solo ? estrelas(times[0].acertos, total) : 0;
  const novoRecorde = solo
    ? salvarResultado(temporada.id, times[0].pontos, numeroDeEstrelas)
    : false;

  const tela = criarElemento(
    'section',
    { class: 'tela-resultado', 'aria-labelledby': 'titulo-resultado' },
    [
      criarElemento('h1', {
        id: 'titulo-resultado',
        class: 'titulo-resultado',
        tabindex: '-1',
        text: `${temporada.emoji} Fim da temporada ${temporada.nome}!`,
      }),
      solo
        ? blocoSolo(times[0], total, novoRecorde, numeroDeEstrelas, animacoes)
        : blocoEquipes(times),
      criarElemento('div', { class: 'acoes' }, [
        criarElemento('button', {
          type: 'button',
          class: 'botao botao-gigante',
          text: '🔁 Jogar de novo',
          onClick: aoJogarDeNovo,
        }),
        criarElemento('button', {
          type: 'button',
          class: 'botao botao-secundario',
          text: '🏠 Início',
          onClick: aoInicio,
        }),
      ]),
      blocoPalavras(historico, palavrasNovas),
      blocoRevisao(historico),
    ],
  );
  conteiner.replaceChildren(tela);
  animacoes.push(entrar(tela.children, { intervalo: 0.1 }));
  tela.querySelector('#titulo-resultado').focus({ preventScroll: true });

  if (!solo || numeroDeEstrelas > 0) {
    tocarFanfarra();
    chuvaDeConfete();
  }
  return () => animacoes.forEach((animacao) => animacao?.kill());
}
