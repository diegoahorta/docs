// Regras do Hangul Rain sem nada de Phaser: dificuldade, sorteio pelo SRS,
// leitura do que foi digitado e pontuação. Fica fácil de entender e de ajustar.

import { buscarItem } from '../../data/hangul.js';
import { sortearPonderado } from '../../core/srs.js';
import { limitar, normalizarLeitura } from '../../core/utils.js';
import { poolDoAprendiz } from '../pool.js';

export const CONFIG = Object.freeze({
  vidas: 3,
  acertosPorNivel: 5, // a cada 5 acertos o nível da partida sobe
  quedaInicialS: 9, // segundos que uma gota leva do céu ao chão no nível 1
  quedaMinimaS: 3.2,
  intervaloInicialS: 2.4, // segundos entre uma gota e a próxima no nível 1
  intervaloMinimoS: 0.85,
  aceleracao: 0.9, // cada nível multiplica os tempos por este fator
});

/** Nível da partida a partir do número de acertos. */
export function nivelDaPartida(acertos) {
  return Math.floor(acertos / CONFIG.acertosPorNivel) + 1;
}

/** Tempo de queda (s) de uma gota no nível informado. */
export function tempoDeQueda(nivel) {
  return Math.max(CONFIG.quedaMinimaS, CONFIG.quedaInicialS * CONFIG.aceleracao ** (nivel - 1));
}

/** Intervalo (s) entre o nascimento de duas gotas. */
export function intervaloEntreGotas(nivel) {
  return Math.max(
    CONFIG.intervaloMinimoS,
    CONFIG.intervaloInicialS * CONFIG.aceleracao ** (nivel - 1),
  );
}

/** Quantas gotas podem estar na tela ao mesmo tempo. */
export function maxGotasNaTela(nivel) {
  return Math.min(6, 2 + Math.floor(nivel / 2));
}

/** Ids das letras e sílabas liberadas pelo SRS (começa pelas vogais). */
export function poolDaChuva() {
  return poolDoAprendiz();
}

/**
 * Sorteia o próximo item pelo SRS, evitando os que já estão na tela
 * e também leituras repetidas (ex.: ㅏ e 아, que se leem "a").
 */
export function escolherProximo(pool, itensNaTela) {
  const leiturasNaTela = new Set(itensNaTela.map((item) => item.romanizacao));
  const candidatos = pool.filter((id) => !leiturasNaTela.has(buscarItem(id).romanizacao));
  return buscarItem(sortearPonderado(candidatos.length > 0 ? candidatos : pool));
}

/** Todas as leituras aceitas de um item, normalizadas. */
function leituras(item) {
  return [item.romanizacao, ...item.alternativas].map(normalizarLeitura);
}

/**
 * Analisa o texto digitado contra as gotas na tela.
 * - alvo: a gota mais baixa cuja leitura é exatamente o texto;
 * - aguardar: outra gota ainda pode ser completada (ex.: "g" enquanto 가 cai);
 * - possiveis: gotas cuja leitura começa com o texto (para destacar).
 */
export function procurarAlvo(gotas, digitado) {
  if (!digitado) {
    return { alvo: null, aguardar: false, possiveis: [] };
  }
  const possiveis = gotas.filter((gota) =>
    leituras(gota.item).some((leitura) => leitura.startsWith(digitado)),
  );
  const exatas = possiveis.filter((gota) => leituras(gota.item).includes(digitado));
  const alvo = exatas.reduce(
    (maisBaixa, gota) => (!maisBaixa || gota.y > maisBaixa.y ? gota : maisBaixa),
    null,
  );
  const aguardar = possiveis.some((gota) => !exatas.includes(gota));
  return { alvo, aguardar, possiveis };
}

/**
 * Pontos de um acerto: 10 de base, bônus de combo e bônus por acertar alto
 * (`alturaRelativa` = 1 no topo da tela, 0 no chão).
 */
export function pontosDoAcerto(combo, alturaRelativa) {
  const bonusCombo = Math.min(combo - 1, 10) * 2;
  const bonusAltura = Math.round(limitar(alturaRelativa, 0, 1) * 10);
  return 10 + bonusCombo + bonusAltura;
}
