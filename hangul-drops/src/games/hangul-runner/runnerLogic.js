// Regras do Hangul Runner sem nada de Phaser: dificuldade, montagem das
// ondas de blocos (com distratores parecidos) e pontuação.

import { buscarItem, comporSilaba, itemPorCaractere } from '../../data/hangul.js';
import { sortearPonderado } from '../../core/srs.js';
import { embaralhar, sortear } from '../../core/utils.js';
import { poolDoAprendiz } from '../pool.js';

export const CONFIG = Object.freeze({
  vidas: 3,
  faixas: 3, // 0 = baixa, 1 = média, 2 = alta
  acertosPorNivel: 5,
  travessiaInicialS: 4.6, // segundos para a onda ir da borda até o corredor
  travessiaMinimaS: 1.8,
  pausaEntreOndasS: 0.6,
  aceleracao: 0.9,
  nivelComTresBlocos: 3, // a partir deste nível, as ondas têm 3 blocos
  chanceDeParecido: 0.6, // chance de um distrator ser visualmente parecido
});

/** Letras que costumam ser confundidas. */
const PARECIDOS = [
  ['ㅏ', 'ㅓ'],
  ['ㅗ', 'ㅜ'],
  ['ㅑ', 'ㅕ'],
  ['ㅛ', 'ㅠ'],
  ['ㅐ', 'ㅔ'],
  ['ㅒ', 'ㅖ'],
  ['ㅡ', 'ㅣ'],
  ['ㄱ', 'ㅋ', 'ㄲ'],
  ['ㄷ', 'ㅌ', 'ㄸ'],
  ['ㅂ', 'ㅍ', 'ㅃ'],
  ['ㅅ', 'ㅈ', 'ㅊ', 'ㅆ', 'ㅉ'],
  ['ㄴ', 'ㄷ', 'ㄹ'],
  ['ㅁ', 'ㅂ'],
  ['ㅇ', 'ㅎ'],
];

/** Letras parecidas com uma letra (sem ela mesma). */
function letrasParecidas(letra) {
  return PARECIDOS.filter((grupo) => grupo.includes(letra))
    .flat()
    .filter((outra) => outra !== letra);
}

/**
 * Candidatos parecidos com o item: para letras, as letras da lista acima;
 * para sílabas, a mesma sílaba trocando a consoante ou a vogal por uma parecida
 * (가 → 거, 카, 까...).
 */
function candidatosParecidos(item) {
  if (item.tipo !== 'silaba') {
    return letrasParecidas(item.hangul);
  }
  const [consoante, vogal] = item.partes;
  return [
    ...letrasParecidas(vogal).map((outra) => comporSilaba(consoante, outra)),
    ...letrasParecidas(consoante).map((outra) => comporSilaba(outra, vogal)),
  ];
}

/** Nível da partida a partir do número de acertos. */
export function nivelDaPartida(acertos) {
  return Math.floor(acertos / CONFIG.acertosPorNivel) + 1;
}

/** Tempo (s) que uma onda leva da borda da tela até o corredor. */
export function tempoDeTravessia(nivel) {
  return Math.max(
    CONFIG.travessiaMinimaS,
    CONFIG.travessiaInicialS * CONFIG.aceleracao ** (nivel - 1),
  );
}

/** Quantos blocos cada onda tem no nível. */
export function blocosPorOnda(nivel) {
  return nivel >= CONFIG.nivelComTresBlocos ? 3 : 2;
}

/** Ids das letras e sílabas liberadas pelo SRS. */
export function poolDoRunner() {
  return poolDoAprendiz();
}

/** Itens parecidos com o alvo que também já foram liberados. */
function parecidosNoPool(item, pool) {
  return candidatosParecidos(item)
    .map((caractere) => itemPorCaractere(caractere))
    .filter((outro) => outro && pool.includes(outro.id));
}

/** Escolhe distratores com leituras diferentes da resposta e entre si. */
function escolherDistratores(alvo, pool, quantidade) {
  const leituras = new Set([alvo.romanizacao]);
  const distratores = [];
  const adicionar = (item) => {
    if (item && !leituras.has(item.romanizacao) && distratores.length < quantidade) {
      leituras.add(item.romanizacao);
      distratores.push(item);
    }
  };
  const parecidos = parecidosNoPool(alvo, pool);
  if (parecidos.length > 0 && Math.random() < CONFIG.chanceDeParecido) {
    adicionar(sortear(parecidos));
  }
  // Os outros distratores vêm do mesmo tipo do alvo (letra com letra, sílaba com sílaba).
  const mesmoConjunto = pool.filter((id) => buscarItem(id).conjunto === alvo.conjunto);
  embaralhar(mesmoConjunto).forEach((id) => adicionar(buscarItem(id)));
  embaralhar(pool).forEach((id) => adicionar(buscarItem(id)));
  return distratores;
}

/**
 * Monta uma onda: o item pedido (sorteado pelo SRS) e os blocos,
 * cada um numa faixa diferente. Devolve { alvo, blocos: [{ item, faixa }] }.
 */
export function montarOnda(pool, nivel, ultimoAlvoId) {
  const alvo = buscarItem(sortearPonderado(pool, { evitar: ultimoAlvoId ? [ultimoAlvoId] : [] }));
  const itens = [alvo, ...escolherDistratores(alvo, pool, blocosPorOnda(nivel) - 1)];
  const faixas = embaralhar([0, 1, 2]);
  return {
    alvo,
    blocos: embaralhar(itens).map((item, indice) => ({ item, faixa: faixas[indice] })),
  };
}

/** Pontos de um acerto: 10 de base + bônus de combo. */
export function pontosDoAcerto(combo) {
  return 10 + Math.min(combo - 1, 10) * 2;
}
