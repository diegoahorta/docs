// Gera src/data/lexico.js a partir da base unificada (../vocabulario/dados/vocabulario.json).
// Uso: npm run build:lexico
import { readFile, writeFile } from 'node:fs/promises';

const src = new URL('../../vocabulario/dados/vocabulario.json', import.meta.url);
const out = new URL('../src/data/lexico.js', import.meta.url);

const { palavras } = JSON.parse(await readFile(src, 'utf8'));

// Onde há alerta de tradução, usa a forma sugerida e marca o idioma corrigido.
const pick = (w, lang) => w.alertas[lang]?.sugestao ?? w.traducoes[lang];

const rows = palavras.map((w) => {
  const pt = w.pt_br || pick(w, 'PT');
  const fixed = ['ES', 'FR', 'DE'].filter((l) => w.alertas[l]).map((l) => l.toLowerCase());
  return [w.n, w.faixa, w.en, pt, pick(w, 'FR'), pick(w, 'DE'), pick(w, 'ES'), fixed.join(',')];
});

const header = `// Gerado por scripts/build-lexico.mjs. Não edite à mão.
// Fonte: Vocabulário Essencial Multilíngue 2.284 (ODU Creative / Mnemotechnics).
// Colunas: n, faixa, en, pt, fr, de, es, idiomas corrigidos pelos alertas.
`;
await writeFile(out, `${header}export const LEXICO = ${JSON.stringify(rows)};\n`);
console.log(`lexico.js: ${rows.length} palavras`);
