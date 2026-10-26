// Tela de abertura do show: logo, modo (solo ou equipes) e temporada.

import { TEMPORADAS } from '../quiz/temporadas.js';
import { recordeDa, palavrasDoAlbum } from '../core/placar.js';
import { PALAVRAS_KATAKANA } from '../data/palavras.js';
import { tocarClique } from '../core/audio.js';
import { criarElemento } from '../core/utils.js';
import { entrar, gsap } from '../ui/motion.js';
import { animacoesReduzidas } from '../core/settings.js';

/** Equipes disponíveis no modo turma (nome, emoji e cor). */
export const EQUIPES = Object.freeze([
  { nome: 'Raio', emoji: '⚡', cor: 'amarelo' },
  { nome: 'Dragão', emoji: '🐉', cor: 'rosa' },
  { nome: 'Onda', emoji: '🌊', cor: 'azul' },
  { nome: 'Ninja', emoji: '🥷', cor: 'verde' },
]);

const PERGUNTAS_SOLO = 12;
const PERGUNTAS_POR_EQUIPE = 5;

let escolhaLembrada = { modo: 'solo', equipes: 2, temporada: 'estreia' };

function estrelasTexto(quantidade) {
  return '★'.repeat(quantidade) + '☆'.repeat(3 - quantidade);
}

/** Grupo de botões em que só um fica marcado (role=radiogroup). */
function grupoDeEscolha(rotulo, opcoes, valorAtual, aoEscolher, classe = '') {
  const botoes = opcoes.map((opcao) =>
    criarElemento(
      'button',
      {
        type: 'button',
        role: 'radio',
        class: `escolha ${classe}`,
        dataset: { valor: String(opcao.valor) },
        style: opcao.cor ? `--cor-escolha: ${opcao.cor}` : null,
        onClick: () => marcar(opcao.valor, true),
      },
      opcao.conteudo,
    ),
  );
  const grupo = criarElemento(
    'div',
    { class: 'grupo-escolha', role: 'radiogroup', 'aria-label': rotulo },
    botoes,
  );

  function marcar(valor, peloJogador = false) {
    botoes.forEach((botao) => {
      const marcado = botao.dataset.valor === String(valor);
      botao.setAttribute('aria-checked', String(marcado));
      botao.tabIndex = marcado ? 0 : -1;
      if (marcado && peloJogador) {
        botao.focus();
      }
    });
    if (peloJogador) {
      tocarClique();
      aoEscolher(valor);
    }
  }

  // Setas percorrem as opções (padrão de radiogroup).
  grupo.addEventListener('keydown', (evento) => {
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
    if (!passo) {
      return;
    }
    evento.preventDefault();
    const atual = botoes.findIndex((botao) => botao.getAttribute('aria-checked') === 'true');
    const proximo = opcoes[(atual + passo + opcoes.length) % opcoes.length];
    marcar(proximo.valor, true);
  });

  marcar(valorAtual);
  return grupo;
}

/**
 * Monta a tela inicial dentro de `conteiner`.
 * `aoComecar({ temporada, equipes, perguntas })` inicia a rodada.
 * Devolve uma função de limpeza.
 */
export function mostrarInicio(conteiner, { aoComecar }) {
  const escolha = { ...escolhaLembrada };
  const album = palavrasDoAlbum();
  const conquistadas = PALAVRAS_KATAKANA.filter((palavra) => album.has(palavra.id)).length;

  const logo = criarElemento('h1', { class: 'logo', id: 'titulo-inicio' }, [
    criarElemento('span', { class: 'logo-jp', lang: 'ja', 'aria-hidden': 'true' }, [
      ...'カタカナ'.split('').map((letra) => criarElemento('span', { text: letra })),
    ]),
    criarElemento('span', { class: 'logo-show', text: 'Katakana Show' }),
  ]);

  const seletorEquipes = grupoDeEscolha(
    'Número de equipes',
    [2, 3, 4].map((numero) => ({ valor: numero, conteudo: `${numero} equipes` })),
    escolha.equipes,
    (valor) => {
      escolha.equipes = valor;
    },
    'escolha-pequena',
  );
  const linhaEquipes = criarElemento('div', { class: 'linha-equipes' }, [
    seletorEquipes,
    criarElemento('p', {
      class: 'texto-suave',
      text: `As equipes se revezam: ${PERGUNTAS_POR_EQUIPE} perguntas para cada uma. Ideal para o projetor da sala!`,
    }),
  ]);
  linhaEquipes.hidden = escolha.modo !== 'equipes';

  const seletorModo = grupoDeEscolha(
    'Modo de jogo',
    [
      {
        valor: 'solo',
        conteudo: [
          criarElemento('span', { class: 'escolha-emoji', text: '🙋' }),
          criarElemento('strong', { text: 'Solo' }),
          criarElemento('span', { text: `${PERGUNTAS_SOLO} perguntas` }),
        ],
      },
      {
        valor: 'equipes',
        conteudo: [
          criarElemento('span', { class: 'escolha-emoji', text: '👥' }),
          criarElemento('strong', { text: 'Equipes' }),
          criarElemento('span', { text: 'Disputa na turma' }),
        ],
      },
    ],
    escolha.modo,
    (valor) => {
      escolha.modo = valor;
      linhaEquipes.hidden = valor !== 'equipes';
    },
    'escolha-modo',
  );

  const seletorTemporada = grupoDeEscolha(
    'Temporada',
    TEMPORADAS.map((temporada) => {
      const recorde = recordeDa(temporada.id);
      return {
        valor: temporada.id,
        cor: temporada.cor,
        conteudo: [
          criarElemento('span', { class: 'escolha-emoji', text: temporada.emoji }),
          criarElemento('strong', { text: temporada.nome }),
          criarElemento('span', { class: 'escolha-descricao', text: temporada.descricao }),
          criarElemento('span', {
            class: 'escolha-estrelas',
            'aria-label': `${recorde.estrelas} de 3 estrelas`,
            text: estrelasTexto(recorde.estrelas),
          }),
          recorde.pontos > 0
            ? criarElemento('span', { class: 'escolha-recorde', text: `🏆 ${recorde.pontos}` })
            : null,
        ],
      };
    }),
    escolha.temporada,
    (valor) => {
      escolha.temporada = valor;
    },
    'escolha-temporada',
  );

  const botaoComecar = criarElemento('button', {
    type: 'button',
    class: 'botao botao-gigante',
    text: '🎬 Começar o show!',
    onClick: () => {
      escolhaLembrada = { ...escolha };
      const equipes =
        escolha.modo === 'equipes'
          ? EQUIPES.slice(0, escolha.equipes)
          : [{ nome: 'Você', emoji: '🙋', cor: 'rosa' }];
      aoComecar({
        temporadaId: escolha.temporada,
        equipes,
        perguntas:
          escolha.modo === 'equipes' ? PERGUNTAS_POR_EQUIPE * equipes.length : PERGUNTAS_SOLO,
      });
    },
  });

  const tela = criarElemento(
    'section',
    { class: 'tela-inicio', 'aria-labelledby': 'titulo-inicio' },
    [
      logo,
      criarElemento('p', {
        class: 'chamada',
        text: 'O quiz que revisa o katakana e ensina palavras novas! Leia, ouça e responda rápido para fazer combos.',
      }),
      criarElemento('div', { class: 'cartao-escolhas' }, [
        criarElemento('h2', { class: 'titulo-secao', text: '1. Quem vai jogar?' }),
        seletorModo,
        linhaEquipes,
        criarElemento('h2', { class: 'titulo-secao', text: '2. Escolha a temporada' }),
        seletorTemporada,
        botaoComecar,
      ]),
      criarElemento('ul', { class: 'dicas-rapidas' }, [
        criarElemento('li', { text: '⌨️ Teclas 1 a 4 respondem; Enter vai para a próxima.' }),
        criarElemento('li', { text: '🔥 3 acertos seguidos = combo x2, depois x3 e x4!' }),
        criarElemento('li', {
          text: '📖 O Guia de romaji pode ser aberto a qualquer hora (na pergunta, vale metade dos pontos).',
        }),
        criarElemento('li', {
          text: `📒 Álbum: ${conquistadas} de ${PALAVRAS_KATAKANA.length} palavras conquistadas.`,
        }),
      ]),
    ],
  );
  conteiner.replaceChildren(tela);

  // Animação de entrada: o logo "pula" letra por letra.
  const animacoes = [];
  if (!animacoesReduzidas()) {
    animacoes.push(
      gsap.from(logo.querySelectorAll('.logo-jp span'), {
        y: -60,
        opacity: 0,
        rotation: () => gsap.utils.random(-25, 25),
        duration: 0.7,
        stagger: 0.08,
        ease: 'bounce.out',
      }),
      gsap.to(logo.querySelectorAll('.logo-jp span'), {
        y: -8,
        duration: 0.9,
        ease: 'sine.inOut',
        stagger: { each: 0.15, repeat: -1, yoyo: true },
        delay: 1.2,
      }),
    );
  }
  animacoes.push(entrar(tela.querySelectorAll('.chamada, .cartao-escolhas, .dicas-rapidas')));

  return () => animacoes.forEach((animacao) => animacao?.kill());
}
