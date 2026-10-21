// Animação da ordem dos traços (dados do KanjiVG) usando SVG + GSAP.
// Cada traço é "desenhado" animando o stroke-dashoffset do caminho.

import { STROKES, STROKE_VIEWBOX } from '../data/strokes.js';
import { animacoesReduzidas } from '../core/settings.js';
import { gsap } from './motion.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PAUSA_REDUZIDA = 0.4; // segundos entre traços quando as animações estão reduzidas

function criarSvg(tag, atributos = {}) {
  const elemento = document.createElementNS(SVG_NS, tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    elemento.setAttribute(chave, String(valor));
  }
  return elemento;
}

/** Lê o ponto inicial do traço ("M31.01,33...") para posicionar o número. */
function pontoInicial(d) {
  const encontrado = /^M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(d);
  return encontrado ? { x: Number(encontrado[1]), y: Number(encontrado[2]) } : { x: 0, y: 0 };
}

/** Linhas guia em cruz, como nos cadernos de caligrafia. */
function criarGuias() {
  const meio = STROKE_VIEWBOX / 2;
  const grupo = criarSvg('g', { class: 'tracos-grade' });
  grupo.append(
    criarSvg('line', { x1: meio, y1: 0, x2: meio, y2: STROKE_VIEWBOX }),
    criarSvg('line', { x1: 0, y1: meio, x2: STROKE_VIEWBOX, y2: meio }),
  );
  return grupo;
}

/**
 * Cria a animação de traços de um kana.
 * Devolve { elemento, tocar, destroy, total }.
 */
export function criarAnimacaoTracos(kana, { tamanho = 220 } = {}) {
  const tracos = STROKES[kana] ?? [];
  const svg = criarSvg('svg', {
    viewBox: `0 0 ${STROKE_VIEWBOX} ${STROKE_VIEWBOX}`,
    width: tamanho,
    height: tamanho,
    class: 'tracos',
    role: 'img',
    'aria-label': `Ordem dos traços de ${kana}: ${tracos.length} traços`,
  });
  svg.append(criarGuias());

  const fantasmas = criarSvg('g', { class: 'tracos-fantasma' });
  const ativos = criarSvg('g', { class: 'tracos-ativos' });
  const numeros = criarSvg('g', { class: 'tracos-numeros' });
  const caminhos = tracos.map((d, indice) => {
    fantasmas.append(criarSvg('path', { d }));
    const caminho = criarSvg('path', { d });
    ativos.append(caminho);
    const { x, y } = pontoInicial(d);
    const numero = criarSvg('text', { x: x - 6, y: y - 3 });
    numero.textContent = String(indice + 1);
    numeros.append(numero);
    return { caminho, numero };
  });
  svg.append(fantasmas, ativos, numeros);

  let linhaDoTempo = null;

  /** (Re)começa a animação do primeiro traço. */
  function tocar() {
    linhaDoTempo?.kill();
    const reduzido = animacoesReduzidas();
    linhaDoTempo = gsap.timeline();
    caminhos.forEach(({ caminho, numero }, indice) => {
      const comprimento = caminho.getTotalLength();
      gsap.set(caminho, { strokeDasharray: comprimento, strokeDashoffset: comprimento });
      gsap.set(numero, { opacity: 0 });
      if (reduzido) {
        const momento = indice * PAUSA_REDUZIDA;
        linhaDoTempo.set(caminho, { strokeDashoffset: 0 }, momento);
        linhaDoTempo.set(numero, { opacity: 1 }, momento);
      } else {
        linhaDoTempo.to(numero, { opacity: 1, duration: 0.15 });
        linhaDoTempo.to(
          caminho,
          {
            strokeDashoffset: 0,
            duration: Math.max(0.35, comprimento / 110),
            ease: 'power1.inOut',
          },
          '<',
        );
      }
    });
    return linhaDoTempo;
  }

  function destroy() {
    linhaDoTempo?.kill();
    svg.remove();
  }

  return { elemento: svg, tocar, destroy, total: tracos.length };
}
