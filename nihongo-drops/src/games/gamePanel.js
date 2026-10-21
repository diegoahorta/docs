// Peças de interface HTML compartilhadas pelos minijogos:
// a camada que fica sobre o canvas, os painéis (início, pausa, fim de jogo),
// a lista "Para revisar" e a faixa de dica.

import { criarElemento } from '../core/utils.js';
import { criarBotaoFala } from '../ui/speakButton.js';
import { entrar, sair } from '../ui/motion.js';

const TEMPO_DICA_MS = 3500;
let contador = 0;

/** Cria a camada HTML que fica por cima do canvas do Phaser. */
export function criarCamadaDoJogo(conteiner) {
  const camada = criarElemento('div', { class: 'jogo-camada' });
  conteiner.append(camada);
  return camada;
}

/**
 * Mostra um painel centralizado.
 * `acoes` = [{ rotulo, aoClicar, primario }]; o primeiro botão recebe o foco.
 * Devolve { elemento, fechar }.
 */
export function mostrarPainel(camada, { titulo, tituloJP, conteudo = [], acoes = [] }) {
  contador += 1;
  const idTitulo = `jogo-painel-titulo-${contador}`;
  const botoes = acoes.map(({ rotulo, aoClicar, primario }) =>
    criarElemento('button', {
      type: 'button',
      class: primario ? 'botao' : 'botao botao-secundario',
      text: rotulo,
      onClick: aoClicar,
    }),
  );
  const painel = criarElemento(
    'div',
    { class: 'jogo-painel', role: 'dialog', 'aria-labelledby': idTitulo },
    [
      criarElemento('h2', { id: idTitulo, text: titulo }),
      tituloJP ? criarElemento('p', { class: 'jogo-painel-jp', lang: 'ja', text: tituloJP }) : null,
      ...conteudo,
      criarElemento('div', { class: 'jogo-painel-acoes' }, botoes),
    ],
  );
  camada.append(painel);
  entrar(painel, { y: 30 });
  botoes[0]?.focus({ preventScroll: true });
  return {
    elemento: painel,
    fechar() {
      painel.remove();
    },
  };
}

/** Painel de pausa (igual em todos os jogos). */
export function painelPausa(camada, { aoContinuar, aoSair }) {
  return mostrarPainel(camada, {
    titulo: 'Pausado',
    tituloJP: 'いちじていし',
    conteudo: [criarElemento('p', { class: 'texto-suave', text: 'Respire fundo. ☕' })],
    acoes: [
      { rotulo: 'Continuar', aoClicar: aoContinuar, primario: true },
      { rotulo: 'Menu', aoClicar: aoSair },
    ],
  });
}

/** Grade de resultados: [['Pontos', 120], ['Acertos', 8], ...]. */
export function criarResultados(pares) {
  return criarElemento(
    'dl',
    { class: 'jogo-resultados' },
    pares.map(([rotulo, valor]) =>
      criarElemento('div', {}, [
        criarElemento('dt', { text: rotulo }),
        criarElemento('dd', { text: String(valor) }),
      ]),
    ),
  );
}

/** Um item para revisar: kana ou palavra, leitura, 🔊 e a dica (ou o significado). */
function itemDeRevisao(item) {
  const explicacao = item.mnemonico ?? `${item.emoji} ${item.pt}`;
  return criarElemento('li', {}, [
    criarElemento('span', { class: 'kana kana-medio', lang: 'ja', text: item.kana }),
    criarElemento('span', { class: 'revisao-romaji', text: item.romaji }),
    criarBotaoFala(item.kana),
    criarElemento('small', { class: 'texto-suave', text: explicacao }),
  ]);
}

/** Título + lista "Para revisar" (ou nada, se a lista estiver vazia). */
export function criarListaDeRevisao(itens) {
  if (itens.length === 0) {
    return [];
  }
  return [
    criarElemento('h3', { text: 'Para revisar' }),
    criarElemento('ul', { class: 'jogo-revisao' }, itens.map(itemDeRevisao)),
  ];
}

/** Linha de recorde para os painéis de fim de jogo. */
export function criarLinhaDeRecorde(novoRecorde, recorde) {
  return novoRecorde
    ? criarElemento('p', { class: 'jogo-recorde', text: '🎉 Novo recorde!' })
    : criarElemento('p', { class: 'texto-suave', text: `🏆 Recorde: ${recorde} pontos` });
}

/**
 * Faixa de dica no rodapé que não bloqueia o jogo (some sozinha).
 * Devolve uma função que remove a dica na hora.
 */
export function mostrarDica(camada, linhas, tempoMs = TEMPO_DICA_MS) {
  camada.querySelector('.jogo-dica')?.remove();
  const dica = criarElemento(
    'div',
    { class: 'jogo-dica', role: 'status' },
    linhas.map((linha) => criarElemento('p', { text: linha })),
  );
  camada.append(dica);
  entrar(dica, { y: 20 });
  const temporizador = setTimeout(async () => {
    await sair(dica, { y: 20 });
    dica.remove();
  }, tempoMs);
  return () => {
    clearTimeout(temporizador);
    dica.remove();
  };
}
