// Regras do Pares de Kana sem nada de Phaser: níveis contra o relógio,
// montagem das cartas (hiragana de um lado, katakana do outro) e pontuação.

import { buscarKana, gruposDeEstudo } from '../../data/kana.js';
import { gruposLiberados, sortearVarios } from '../../core/srs.js';
import { embaralhar } from '../../core/utils.js';

export const PENALIDADE_S = 3; // segundos perdidos a cada par errado
const MAXIMO_DE_PARES = 8;
const COR_HIRAGANA = 0xfffaf0;
const COR_KATAKANA = 0xe8f6ff;

/** Pares e tempo de cada nível: mais pares e menos tempo conforme avança. */
export function configDoNivel(nivel) {
  return {
    pares: Math.min(MAXIMO_DE_PARES, 3 + nivel),
    tempoS: Math.max(22, 44 - 2 * nivel),
  };
}

/** Ids dos katakana liberados pelo SRS, sem leituras repetidas (ジ/ヂ). */
function poolDeKatakana() {
  const ids = gruposLiberados(gruposDeEstudo('katakana', true)).flatMap((grupo) => grupo.itens);
  const leituras = new Set();
  return ids.filter((id) => {
    const { romaji } = buscarKana(id);
    const repetida = leituras.has(romaji);
    leituras.add(romaji);
    return !repetida;
  });
}

/** Dados de uma carta. O `parId` é sempre o id do katakana. */
function dadosDaCarta(katakana, lado) {
  const hiragana = lado === 'hiragana';
  return {
    tipo: 'kana',
    lado,
    texto: hiragana ? katakana.par : katakana.kana,
    fala: katakana.kana,
    parId: katakana.id,
    item: katakana,
    cor: hiragana ? COR_HIRAGANA : COR_KATAKANA,
  };
}

/**
 * Monta as cartas de um nível: { hiragana: [...], katakana: [...] },
 * cada lado embaralhado de um jeito diferente.
 */
export function montarNivel(nivel) {
  const katakana = sortearVarios(poolDeKatakana(), configDoNivel(nivel).pares).map(buscarKana);
  return {
    hiragana: embaralhar(katakana).map((item) => dadosDaCarta(item, 'hiragana')),
    katakana: embaralhar(katakana).map((item) => dadosDaCarta(item, 'katakana')),
  };
}

/** Pontos de um par certo, com bônus para pares seguidos. */
export function pontosDoPar(combo) {
  return 15 + Math.min(combo - 1, 8) * 5;
}

/** Bônus pelos segundos que sobraram ao completar o nível. */
export function bonusDeTempo(segundosRestantes) {
  return Math.round(Math.max(0, segundosRestantes) * 2);
}

/**
 * Divide a área em duas partes, uma para cada alfabeto:
 * lado a lado em telas largas, uma em cima da outra em telas altas.
 */
export function dividirArea(x, y, largura, altura, espaco) {
  if (largura >= altura * 1.1) {
    const metade = (largura - espaco) / 2;
    return [
      { x, y, largura: metade, altura },
      { x: x + metade + espaco, y, largura: metade, altura },
    ];
  }
  const metade = (altura - espaco) / 2;
  return [
    { x, y, largura, altura: metade },
    { x, y: y + metade + espaco, largura, altura: metade },
  ];
}
