// Ordem dos traços do hangul, desenhada para este projeto num quadro de 109 × 109.
// Regra geral: de cima para baixo e da esquerda para a direita.
//
// - Os jamo básicos são desenhados à mão (caminhos SVG simples).
// - Consoantes duplas (ㄲ ㄸ...), finais compostas (ㄺ ㅄ...) e vogais compostas (ㅐ ㅘ...) são
//   montadas a partir dos básicos.
// - Uma sílaba (가, 간...) encaixa os traços de cada jamo no seu lugar do bloco.

import { decomporSilaba } from './hangul.js';

export const STROKE_VIEWBOX = 109;

/** Traços dos jamo básicos (cada string é um traço, na ordem certa). */
const BASICOS = {
  // Consoantes
  ㄱ: ['M24,28 H82 V88'],
  ㄴ: ['M28,22 V80 H88'],
  ㄷ: ['M26,28 H82', 'M28,28 V80 H86'],
  ㄹ: ['M26,22 H80 V50', 'M28,52 H80', 'M28,52 V84 H86'],
  ㅁ: ['M28,26 V84', 'M28,26 H82 V84', 'M28,84 H82'],
  ㅂ: ['M30,20 V86', 'M80,20 V86', 'M30,50 H80', 'M30,86 H80'],
  ㅅ: ['M56,20 Q50,60 20,88', 'M54,52 Q66,72 90,88'],
  ㅇ: ['M54.5,24 A30,30 0 1,0 54.6,24'],
  ㅈ: ['M24,26 H84 Q62,62 20,90', 'M56,56 Q70,74 90,90'],
  ㅎ: ['M44,16 H66', 'M22,34 H88', 'M54.5,48 A20,20 0 1,0 54.6,48'],
  ㅋ: ['M24,26 H82 V88', 'M28,56 H80'],
  ㅌ: ['M26,24 H84', 'M28,52 H82', 'M28,24 V82 H88'],
  ㅍ: ['M20,24 H90', 'M38,28 V80', 'M72,28 V80', 'M18,84 H92'],
  ㅊ: ['M44,14 H66', 'M24,32 H84 Q62,64 20,92', 'M56,62 Q70,78 90,92'],
  // Vogais
  ㅏ: ['M46,12 V98', 'M46,54 H76'],
  ㅓ: ['M34,54 H64', 'M64,12 V98'],
  ㅗ: ['M54,38 V68', 'M16,70 H94'],
  ㅜ: ['M16,40 H94', 'M54,42 V92'],
  ㅡ: ['M14,56 H96'],
  ㅣ: ['M54,12 V98'],
  ㅑ: ['M44,12 V98', 'M44,42 H74', 'M44,68 H74'],
  ㅕ: ['M32,42 H62', 'M32,68 H62', 'M62,12 V98'],
  ㅛ: ['M40,40 V68', 'M68,40 V68', 'M16,70 H94'],
  ㅠ: ['M16,40 H94', 'M40,42 V88', 'M68,42 V88'],
};

/** Consoantes duplas e finais compostas: dois jamo básicos lado a lado. */
const PARES = {
  ㄲ: 'ㄱㄱ',
  ㄸ: 'ㄷㄷ',
  ㅃ: 'ㅂㅂ',
  ㅆ: 'ㅅㅅ',
  ㅉ: 'ㅈㅈ',
  ㄳ: 'ㄱㅅ',
  ㄵ: 'ㄴㅈ',
  ㄶ: 'ㄴㅎ',
  ㄺ: 'ㄹㄱ',
  ㄻ: 'ㄹㅁ',
  ㄼ: 'ㄹㅂ',
  ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ',
  ㄿ: 'ㄹㅍ',
  ㅀ: 'ㄹㅎ',
  ㅄ: 'ㅂㅅ',
};

/** Vogais compostas: [primeira parte, caixa, segunda parte, caixa]. */
const COMPOSTAS = {
  ㅐ: ['ㅏ', [-8, 0, 90, 109], 'ㅣ', [28, 0, 90, 109]],
  ㅔ: ['ㅓ', [-12, 0, 90, 109], 'ㅣ', [28, 0, 90, 109]],
  ㅒ: ['ㅑ', [-8, 0, 90, 109], 'ㅣ', [28, 0, 90, 109]],
  ㅖ: ['ㅕ', [-12, 0, 90, 109], 'ㅣ', [28, 0, 90, 109]],
  ㅘ: ['ㅗ', [0, 10, 76, 99], 'ㅏ', [40, 0, 80, 109]],
  ㅙ: ['ㅗ', [0, 10, 64, 99], 'ㅐ', [36, 0, 80, 109]],
  ㅚ: ['ㅗ', [0, 10, 76, 99], 'ㅣ', [40, 0, 80, 109]],
  ㅝ: ['ㅜ', [0, -6, 76, 99], 'ㅓ', [36, 0, 80, 109]],
  ㅞ: ['ㅜ', [0, -6, 64, 99], 'ㅔ', [36, 0, 80, 109]],
  ㅟ: ['ㅜ', [0, -6, 76, 99], 'ㅣ', [40, 0, 80, 109]],
  ㅢ: ['ㅡ', [0, 0, 80, 109], 'ㅣ', [40, 0, 80, 109]],
};

const VOGAIS_EM_PE = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ'; // a consoante fica à esquerda
const VOGAIS_DEITADAS = 'ㅗㅛㅜㅠㅡ'; // a consoante fica em cima

const formatar = (numero) => String(Math.round(numero * 100) / 100);

/**
 * Encaixa um caminho SVG (no quadro de 109) dentro da caixa [x, y, largura, altura].
 * Aceita os comandos usados aqui: M, L, H, V, Q e A (coordenadas absolutas).
 */
function encaixar(caminho, [x0, y0, largura, altura]) {
  const sx = largura / STROKE_VIEWBOX;
  const sy = altura / STROKE_VIEWBOX;
  const px = (valor) => formatar(x0 + valor * sx);
  const py = (valor) => formatar(y0 + valor * sy);
  return caminho.replace(/([MLHVQA])([^MLHVQA]*)/g, (_, comando, resto) => {
    const n = resto
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (comando === 'H') {
      return `H${px(n[0])}`;
    }
    if (comando === 'V') {
      return `V${py(n[0])}`;
    }
    if (comando === 'A') {
      const [rx, ry, rotacao, grande, sentido, x, y] = n;
      return `A${formatar(rx * sx)},${formatar(ry * sy)} ${rotacao} ${grande},${sentido} ${px(x)},${py(y)}`;
    }
    const pares = [];
    for (let i = 0; i < n.length; i += 2) {
      pares.push(`${px(n[i])},${py(n[i + 1])}`);
    }
    return `${comando}${pares.join(' ')}`;
  });
}

/** Traços de um jamo (básico, duplo ou composto) no quadro inteiro. */
function tracosDoJamo(jamo) {
  if (BASICOS[jamo]) {
    return BASICOS[jamo];
  }
  if (PARES[jamo]) {
    const [esquerda, direita] = Array.from(PARES[jamo]);
    return [
      ...BASICOS[esquerda].map((d) => encaixar(d, [-6, 8, 66, 94])),
      ...BASICOS[direita].map((d) => encaixar(d, [49, 8, 66, 94])),
    ];
  }
  if (COMPOSTAS[jamo]) {
    const [primeira, caixa1, segunda, caixa2] = COMPOSTAS[jamo];
    return [
      ...tracosDoJamo(primeira).map((d) => encaixar(d, caixa1)),
      ...tracosDoJamo(segunda).map((d) => encaixar(d, caixa2)),
    ];
  }
  return [];
}

/** Caixas de cada parte da sílaba conforme o formato da vogal e o batchim. */
function caixasDaSilaba(vogal, temFinal) {
  let caixas;
  if (VOGAIS_EM_PE.includes(vogal)) {
    caixas = { inicial: [0, 6, 64, 98], vogal: [42, 0, 67, 109] };
  } else if (VOGAIS_DEITADAS.includes(vogal)) {
    caixas = { inicial: [14, -4, 82, 66], vogal: [0, 36, 109, 74] };
  } else {
    caixas = { inicial: [0, 0, 62, 60], vogal: [0, 0, 109, 109] };
  }
  if (!temFinal) {
    return caixas;
  }
  // Com batchim, tudo sobe e encolhe para caber a consoante final embaixo.
  const encolher = ([x, y, l, a]) => [x, y * 0.62, l, a * 0.62];
  return {
    inicial: encolher(caixas.inicial),
    vogal: encolher(caixas.vogal),
    final: [14, 62, 82, 50],
  };
}

/** Traços de qualquer caractere: jamo ou sílaba completa (na ordem de escrita). */
export function tracosDe(caractere) {
  const partes = decomporSilaba(caractere);
  if (!partes) {
    return tracosDoJamo(caractere);
  }
  const caixas = caixasDaSilaba(partes.vogal, Boolean(partes.final));
  const tracos = [
    ...tracosDoJamo(partes.inicial).map((d) => encaixar(d, caixas.inicial)),
    ...tracosDoJamo(partes.vogal).map((d) => encaixar(d, caixas.vogal)),
  ];
  if (partes.final) {
    tracos.push(...tracosDoJamo(partes.final).map((d) => encaixar(d, caixas.final)));
  }
  return tracos;
}
