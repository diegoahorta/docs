// Regras do Katakana Runner sem nada de Phaser: dificuldade, montagem das
// ondas de blocos (com distratores parecidos) e pontuação.

import { buscarKana, gruposDeEstudo, kanaPorCaractere } from '../../data/kana.js';
import { gruposLiberados, sortearPonderado } from '../../core/srs.js';
import { embaralhar, sortear } from '../../core/utils.js';

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

/** Grupos de katakana que costumam ser confundidos. */
const PARECIDOS = [
  ['シ', 'ツ'],
  ['ソ', 'ン', 'ノ'],
  ['ク', 'ケ', 'タ'],
  ['ウ', 'ワ', 'フ'],
  ['ス', 'ヌ', 'メ'],
  ['コ', 'ユ', 'ロ'],
  ['チ', 'テ'],
  ['ア', 'マ'],
  ['ラ', 'ヲ'],
  ['ル', 'レ'],
  ['セ', 'ヒ'],
];

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

/** Ids dos katakana liberados pelo SRS (começa com ア行 e カ行). */
export function poolDeKatakana() {
  return gruposLiberados(gruposDeEstudo('katakana', true)).flatMap((grupo) => grupo.itens);
}

/** Katakana parecidos com o item que também estão liberados. */
function parecidosNoPool(item, pool) {
  const grupo = PARECIDOS.find((lista) => lista.includes(item.kana)) ?? [];
  return grupo
    .filter((kana) => kana !== item.kana)
    .map((kana) => kanaPorCaractere(kana))
    .filter((outro) => outro && pool.includes(outro.id));
}

/** Escolhe distratores com leituras diferentes da resposta e entre si. */
function escolherDistratores(alvo, pool, quantidade) {
  const leituras = new Set([alvo.romaji]);
  const distratores = [];
  const adicionar = (item) => {
    if (item && !leituras.has(item.romaji) && distratores.length < quantidade) {
      leituras.add(item.romaji);
      distratores.push(item);
    }
  };
  const parecidos = parecidosNoPool(alvo, pool);
  if (parecidos.length > 0 && Math.random() < CONFIG.chanceDeParecido) {
    adicionar(sortear(parecidos));
  }
  embaralhar(pool).forEach((id) => adicionar(buscarKana(id)));
  return distratores;
}

/**
 * Monta uma onda: o katakana pedido (sorteado pelo SRS) e os blocos,
 * cada um numa faixa diferente. Devolve { alvo, blocos: [{ item, faixa }] }.
 */
export function montarOnda(pool, nivel, ultimoAlvoId) {
  const alvo = buscarKana(sortearPonderado(pool, { evitar: ultimoAlvoId ? [ultimoAlvoId] : [] }));
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
