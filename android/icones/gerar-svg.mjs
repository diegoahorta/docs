// Gera os SVG dos ícones a partir dos traços usados nos próprios jogos
// (あ do KanjiVG no japonês; 한 desenhado no projeto coreano).
// Uso: node android/icones/gerar-svg.mjs  → android/icones/<app>.svg

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STROKES } from '../../nihongo-drops/src/data/strokes.js';
import { tracosDe } from '../../hangul-drops/src/data/strokes.js';

const pasta = path.dirname(fileURLToPath(import.meta.url));

/** Quadrado arredondado escuro, o caractere em traços grossos e uma gota no canto. */
function icone(tracos, cor) {
  const caminhos = tracos
    .map((d) => `<path d="${d}" />`)
    .join('\n      ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0f1630" />
  <g transform="translate(88 96) scale(3.1)" fill="none" stroke="${cor}" stroke-width="9"
     stroke-linecap="round" stroke-linejoin="round">
      ${caminhos}
  </g>
  <path d="M410 64 Q448 120 448 140 A38 38 0 0 1 372 140 Q372 120 410 64 Z" fill="#ffd166" />
</svg>
`;
}

await writeFile(path.join(pasta, 'nihongo.svg'), icone(STROKES['あ'], '#ff8fb1'));
await writeFile(path.join(pasta, 'hangul.svg'), icone(tracosDe('한'), '#7ddcb0'));
console.warn('✔ android/icones/nihongo.svg e hangul.svg');
