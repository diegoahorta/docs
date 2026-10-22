// Regras do Monte a Sílaba sem nada de Phaser: níveis contra o relógio,
// escolha das peças (consoantes e vogais) e das sílabas a montar, pontuação.

import { buscarItem, comporSilaba } from '../../data/hangul.js';
import { sortearVarios } from '../../core/srs.js';
import { embaralhar } from '../../core/utils.js';
import { consoantesLiberadas } from '../pool.js';

export const PENALIDADE_S = 3; // segundos perdidos a cada sílaba montada errado
const VOGAIS = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ'];
const CONSOANTES_DE_RESERVA = ['ㄱ', 'ㄴ', 'ㄷ']; // garantem um jogo mesmo no começo
const COR_CONSOANTE = 0xfffaf0;
const COR_VOGAL = 0xe8f6ff;

/** Peças, sílabas e tempo de cada nível: mais peças e mais sílabas conforme avança. */
export function configDoNivel(nivel) {
  return {
    consoantes: Math.min(8, 2 + nivel),
    vogais: Math.min(VOGAIS.length, 2 + nivel),
    alvos: 4 + nivel,
    tempoS: Math.max(30, 50 - 3 * nivel),
  };
}

/** Consoantes que o aluno já conhece (com uma reserva mínima para começar). */
function consoantesDisponiveis() {
  const liberadas = consoantesLiberadas();
  return liberadas.length >= CONSOANTES_DE_RESERVA.length
    ? liberadas
    : [...new Set([...liberadas, ...CONSOANTES_DE_RESERVA])];
}

/** Dados de uma peça (carta). */
function dadosDaPeca(jamo, lado) {
  const item = buscarItem(`j:${jamo}`);
  return {
    tipo: 'hangul',
    lado,
    texto: jamo,
    fala: item.fala,
    item,
    cor: lado === 'consoante' ? COR_CONSOANTE : COR_VOGAL,
  };
}

/**
 * Monta um nível: as peças de cada lado e a lista de sílabas a montar,
 * todas formadas com essas peças e sorteadas pelo SRS.
 */
export function montarNivel(nivel) {
  const config = configDoNivel(nivel);
  const consoantes = sortearVarios(
    consoantesDisponiveis().map((jamo) => `j:${jamo}`),
    config.consoantes,
  ).map((id) => buscarItem(id).hangul);
  const vogais = sortearVarios(
    VOGAIS.map((jamo) => `j:${jamo}`),
    config.vogais,
  ).map((id) => buscarItem(id).hangul);
  const possiveis = consoantes.flatMap((consoante) =>
    vogais.map((vogal) => `s:${comporSilaba(consoante, vogal)}`),
  );
  return {
    consoantes: embaralhar(consoantes).map((jamo) => dadosDaPeca(jamo, 'consoante')),
    vogais: embaralhar(vogais).map((jamo) => dadosDaPeca(jamo, 'vogal')),
    alvos: sortearVarios(possiveis, Math.min(config.alvos, possiveis.length)).map(buscarItem),
    tempoS: config.tempoS,
  };
}

/** Pontos de uma sílaba certa, com bônus para acertos seguidos. */
export function pontosDoAcerto(combo) {
  return 15 + Math.min(combo - 1, 8) * 5;
}

/** Bônus pelos segundos que sobraram ao completar o nível. */
export function bonusDeTempo(segundosRestantes) {
  return Math.round(Math.max(0, segundosRestantes) * 2);
}
