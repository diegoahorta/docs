// Regras do Memory Kana sem nada de Phaser: níveis, montagem dos pares
// (escolhidos pelo SRS), estrelas, pontuação e cálculo da grade.

import { buscarKana, gruposDeEstudo } from '../../data/kana.js';
import { palavrasPorScript } from '../../data/vocab.js';
import { gruposLiberados, sortearVarios } from '../../core/srs.js';
import { embaralhar } from '../../core/utils.js';

/** Níveis da partida: quantidade de pares e tipo de ligação. */
export const NIVEIS = Object.freeze([
  { pares: 3, modo: 'romaji', titulo: 'Kana ↔ romaji' },
  { pares: 6, modo: 'romaji', titulo: 'Kana ↔ romaji' },
  { pares: 6, modo: 'imagem', titulo: 'Palavra ↔ imagem' },
  { pares: 8, modo: 'misto', titulo: 'Misturado' },
]);

const PONTOS_POR_PAR = 20;
const BONUS_POR_COMBO = 5;
const BONUS_POR_ESTRELA = 15;
// Palavras de 2 ou 3 kana: cabem bem na carta e nunca se confundem com um
// kana sozinho (き "árvore" seria igual à carta き do par き ↔ ki no nível misto).
const TAMANHO_MINIMO_DA_PALAVRA = 2;
const TAMANHO_MAXIMO_DA_PALAVRA = 3;

const PALAVRAS = palavrasPorScript('hiragana').filter(
  (palavra) =>
    palavra.kana.length >= TAMANHO_MINIMO_DA_PALAVRA &&
    palavra.kana.length <= TAMANHO_MAXIMO_DA_PALAVRA,
);
const PALAVRA_POR_ID = new Map(PALAVRAS.map((palavra) => [palavra.id, palavra]));

/** Ids dos hiragana liberados pelo SRS, sem leituras repetidas (じ/ぢ). */
function poolDeKana() {
  const ids = gruposLiberados(gruposDeEstudo('hiragana', true)).flatMap((grupo) => grupo.itens);
  const leituras = new Set();
  return ids.filter((id) => {
    const { romaji } = buscarKana(id);
    if (leituras.has(romaji)) {
      return false;
    }
    leituras.add(romaji);
    return true;
  });
}

/** Par kana ↔ romaji. Cada carta sabe o que falar no 🔊. */
function parDeRomaji(item) {
  return {
    id: item.id,
    item,
    cartas: [
      { tipo: 'kana', texto: item.kana, fala: item.kana },
      { tipo: 'romaji', texto: item.romaji, fala: item.kana },
    ],
  };
}

/** Par palavra ↔ imagem (emoji + significado em português). */
function parDeImagem(palavra, mostrarRomaji) {
  return {
    id: palavra.id,
    item: palavra,
    cartas: [
      {
        tipo: 'palavra',
        texto: palavra.kana,
        legenda: mostrarRomaji ? palavra.romaji : '',
        fala: palavra.kana,
      },
      { tipo: 'imagem', texto: palavra.emoji, legenda: palavra.pt, fala: palavra.kana },
    ],
  };
}

/** Quantos pares de cada tipo o nível pede. */
function divisaoDoNivel(nivel) {
  if (nivel.modo === 'romaji') {
    return { romaji: nivel.pares, imagem: 0 };
  }
  if (nivel.modo === 'imagem') {
    return { romaji: 0, imagem: nivel.pares };
  }
  const metade = Math.floor(nivel.pares / 2);
  return { romaji: nivel.pares - metade, imagem: metade };
}

/**
 * Monta as cartas embaralhadas de um nível.
 * Devolve { pares, cartas }, onde cada carta tem { parId, item, tipo, texto, legenda, fala }.
 */
export function montarNivel(indiceDoNivel, { mostrarRomaji }) {
  const divisao = divisaoDoNivel(NIVEIS[indiceDoNivel]);
  const kana = sortearVarios(poolDeKana(), divisao.romaji).map(buscarKana);
  const palavras = sortearVarios(
    PALAVRAS.map((palavra) => palavra.id),
    divisao.imagem,
  ).map((id) => PALAVRA_POR_ID.get(id));

  const pares = [
    ...kana.map(parDeRomaji),
    ...palavras.map((palavra) => parDeImagem(palavra, mostrarRomaji)),
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

/** Quanto o formato da grade difere do formato da área (0 = igual). */
function diferencaDeFormato(colunas, linhas, larguraArea, alturaArea, proporcao) {
  return Math.abs(Math.log((colunas * proporcao) / linhas / (larguraArea / alturaArea)));
}

/**
 * Escolhe quantas colunas usar para que as cartas fiquem o maior possível
 * dentro da área disponível. Em caso de empate (cartas já no tamanho máximo),
 * prefere a grade com o formato mais parecido com o da tela e com menos vagas vazias.
 * Devolve { colunas, linhas, largura, altura }.
 */
export function calcularGrade(total, larguraArea, alturaArea, espaco) {
  const proporcao = 0.8; // largura / altura da carta
  let melhor = null;
  for (let colunas = 2; colunas <= Math.min(total, 8); colunas += 1) {
    const linhas = Math.ceil(total / colunas);
    const larguraMaxima = (larguraArea - espaco * (colunas + 1)) / colunas;
    const alturaMaxima = (alturaArea - espaco * (linhas + 1)) / linhas;
    const largura = Math.min(larguraMaxima, alturaMaxima * proporcao, 150);
    const vagasVazias = colunas * linhas - total;
    const formato =
      diferencaDeFormato(colunas, linhas, larguraArea, alturaArea, proporcao) + vagasVazias * 0.3;
    const empate = melhor && Math.abs(largura - melhor.largura) < 1;
    if (!melhor || (empate ? formato < melhor.formato : largura > melhor.largura)) {
      melhor = { colunas, linhas, largura, altura: largura / proporcao, formato };
    }
  }
  return melhor;
}
