// Gera dist/pongo-vai-a-china.html: o jogo inteiro num único arquivo HTML
// (CSS, JavaScript, sprites e imagens embutidos). Abre com duplo clique, sem servidor.
//
// Uso (na pasta pongo-mandarim):
//   npm install --no-save esbuild
//   node tools/build-single-html.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => join(root, ...a);
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
const dataUri = (file) => `data:${MIME[file.split('.').pop()]};base64,${readFileSync(file).toString('base64')}`;

// 1) todos os módulos JS num script só
const res = await build({ entryPoints: [p('js/game.js')], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', logLevel: 'warning' });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// 2) imagens usadas pelo JS (sprites e expressões)
const assets = {};
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) walk(full);
    else if (MIME[f.split('.').pop()]) assets[relative(root, full).split('\\').join('/')] = dataUri(full);
  }
};
walk(p('assets'));

// 3) HTML com CSS e imagens embutidos
let html = readFileSync(p('index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${readFileSync(p('css/style.css'), 'utf8')}\n</style>`);
html = html.replace(/src="(assets\/[^"]+)"/g, (_, f) => `src="${assets[f] || f}"`);
html = html.replace(
  '<script type="module" src="js/game.js"></script>',
  () => `<script>window.PONGO_ASSETS = ${JSON.stringify(assets)};</script>\n<script>\n${js}\n</script>`,
);

mkdirSync(p('dist'), { recursive: true });
const out = p('dist/pongo-vai-a-china.html');
writeFileSync(out, html);
console.log(`${out} — ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
