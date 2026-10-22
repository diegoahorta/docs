// Regras do Memory Hangul sem nada de Phaser: níveis, montagem dos pares
// (escolhidos pelo SRS), estrelas e pontuação.

import { buscarItem } from '../../data/hangul.js';
import { palavrasPorTamanho } from '../../data/vocab.js';
import { sortearVarios } from '../../core/srs.js';
import { embaralhar } from '../../core/utils.js';
import { poolDoAprendiz } from '../pool.js';

/** Níveis da partida: quantidade de pares e tipo de ligação. */
export const NIVEIS = Object.freeze([
  { pares: 3, modo: 'romanizacao', titulo: 'Letra ↔ romanização' },
  { pares: 6, modo: 'romanizacao', titulo: 'Letra/sílaba ↔ romanização' },
  { pares: 6, modo: 'imagem', titulo: 'Palavra ↔ imagem' },
  { pares: 8, modo: 'misto', titulo: 'Misturado' },
]);

const PONTOS_POR_PAR = 20;
const BONUS_POR_COMBO = 5;
const BONUS_POR_ESTRELA = 15;

// Palavras de 2 ou 3 sílabas: cabem bem na carta e nunca se confundem com
// uma sílaba sozinha (소 "vaca" seria igual à carta 소 do par 소 ↔ so).
const PALAVRAS = palavrasPorTamanho(2, 3);
const PALAVRA_POR_ID = new Map(PALAVRAS.map((palavra) => [palavra.id, palavra]));

/** Ids liberados pelo SRS, sem leituras repetidas (ㅏ e 아 se leem "a"). */
function poolSemLeiturasRepetidas() {
  const leituras = new Set();
  return poolDoAprendiz().filter((id) => {
    const { romanizacao } = buscarItem(id);
    const repetida = leituras.has(romanizacao);
    leituras.add(romanizacao);
    return !repetida;
  });
}

/** Par letra/sílaba ↔ romanização. Cada carta sabe o que falar no 🔊. */
function parDeRomanizacao(item) {
  return {
    id: item.id,
    item,
    cartas: [
      { tipo: 'hangul', texto: item.hangul, fala: item.fala },
      { tipo: 'romanizacao', texto: item.romanizacao, fala: item.fala },
    ],
  };
}

/** Par palavra ↔ imagem (emoji + significado em português). */
function parDeImagem(palavra, mostrarRomanizacao) {
  return {
    id: palavra.id,
    item: palavra,
    cartas: [
      {
        tipo: 'palavra',
        texto: palavra.hangul,
        legenda: mostrarRomanizacao ? palavra.romanizacao : '',
        fala: palavra.fala,
      },
      { tipo: 'imagem', texto: palavra.emoji, legenda: palavra.pt, fala: palavra.fala },
    ],
  };
}

/** Quantos pares de cada tipo o nível pede. */
function divisaoDoNivel(nivel) {
  if (nivel.modo === 'romanizacao') {
    return { romanizacao: nivel.pares, imagem: 0 };
  }
  if (nivel.modo === 'imagem') {
    return { romanizacao: 0, imagem: nivel.pares };
  }
  const metade = Math.floor(nivel.pares / 2);
  return { romanizacao: nivel.pares - metade, imagem: metade };
}

/**
 * Monta as cartas embaralhadas de um nível.
 * Devolve { pares, cartas }, onde cada carta tem { parId, item, tipo, texto, legenda, fala }.
 */
export function montarNivel(indiceDoNivel, { mostrarRomanizacao }) {
  const divisao = divisaoDoNivel(NIVEIS[indiceDoNivel]);
  const itens = sortearVarios(poolSemLeiturasRepetidas(), divisao.romanizacao).map(buscarItem);
  const palavras = sortearVarios(
    PALAVRAS.map((palavra) => palavra.id),
    divisao.imagem,
  ).map((id) => PALAVRA_POR_ID.get(id));

  const pares = [
    ...itens.map(parDeRomanizacao),
    ...palavras.map((palavra) => parDeImagem(palavra, mostrarRomanizacao)),
  ];
  const cartas = embaralhar(
    pares.flatMap((par) =>
      par.cartas.map((carta) => ({ ...carta, parId: par.id, item: par.item })),
    ),
  );
  return { pares, cartas };
}

/** Estrelas pelo número de jogadas (o mínimo possível é igual ao número de pares). */
export function calcularEstrelas(jogadas, pares) {
  if (jogadas <= pares * 1.5) {
    return 3;
  }
  return jogadas <= pares * 2.2 ? 2 : 1;
}

/** Pontos de um par encontrado, com bônus para pares seguidos. */
export function pontosDoPar(combo) {
  return PONTOS_POR_PAR + BONUS_POR_COMBO * Math.max(0, combo - 1);
}

/** Bônus de fim de nível. */
export function bonusDeEstrelas(estrelas) {
  return estrelas * BONUS_POR_ESTRELA;
}
