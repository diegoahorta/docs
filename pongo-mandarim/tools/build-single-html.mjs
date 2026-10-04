// Gera dist/pongo-vai-a-china.html: o jogo inteiro num único arquivo HTML
// (CSS, JavaScript, Three.js, modelos 3D do Blender e imagens embutidos).
// O arquivo abre com duplo clique, sem servidor web.
//
// Uso (na pasta pongo-mandarim):
//   npm install --no-save esbuild
//   node tools/build-single-html.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => join(root, ...a);

// 1) junta os módulos JS + Three.js num script só
const threeAlias = {
  name: 'three-vendor',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: p('vendor/three/build/three.module.min.js') }));
    b.onResolve({ filter: /^three\/addons\// }, (a) => ({ path: p('vendor/three/examples/jsm', a.path.slice('three/addons/'.length)) }));
  },
};
const res = await build({
  entryPoints: [p('js/game.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  target: 'es2020',
  plugins: [threeAlias],
  logLevel: 'warning',
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// 2) modelos .glb em base64
const models = {};
for (const f of readdirSync(p('assets/models'))) {
  if (f.endsWith('.glb')) models[f] = readFileSync(p('assets/models', f)).toString('base64');
}

// 3) HTML com CSS e imagens embutidos
let html = readFileSync(p('index.html'), 'utf8');
const css = readFileSync(p('css/style.css'), 'utf8');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${css}\n</style>`);
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/src="(assets\/img\/[^"]+)"/g, (_, f) => {
  const mime = f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `src="data:${mime};base64,${readFileSync(p(f)).toString('base64')}"`;
});
html = html.replace(
  '<script type="module" src="js/game.js"></script>',
  () => `<script>window.PONGO_EMBEDDED_MODELS = ${JSON.stringify(models)};</script>\n<script>\n${js}\n</script>`,
);

mkdirSync(p('dist'), { recursive: true });
const out = p('dist/pongo-vai-a-china.html');
writeFileSync(out, html);
console.log(`${out} — ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
