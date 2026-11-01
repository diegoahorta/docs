#!/usr/bin/env node
/**
 * Gera dist/odu-creative.html: a plataforma inteira em UM arquivo HTML.
 * Abre com duplo clique (file://), sem servidor e sem internet.
 *
 * Embute: CSS, JavaScript (módulos unidos com esbuild), GSAP, biblioteca docx,
 * as unidades de units/index.json, seus áudios (MP3 em base64) e as apostilas DOCX prontas.
 * Uso: node tools/build-standalone.mjs [saida.html] [--game flashcards]
 *   --game <rota>  gera um arquivo "somente jogo": abre direto na rota, sem menu lateral.
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname, relative, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const argv = process.argv.slice(2);
const gi = argv.indexOf('--game');
const game = gi >= 0 ? argv[gi + 1] : null;
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--game');
const out = resolve(positional[0] || join(root, 'dist', game ? `odu-${game}.html` : 'odu-creative.html'));
const read = (p) => readFileSync(join(root, p), 'utf8');
const MIME = { '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.svg': 'image/svg+xml', '.png': 'image/png', '.glb': 'model/gltf-binary' };
const dataUrl = (abs) => `data:${MIME[extname(abs)]};base64,${readFileSync(abs).toString('base64')}`;
/** Impede que "</script>" dentro do conteúdo feche a tag antes da hora. */
const safe = (s) => s.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');

function walk(dir) {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
}

// 1. Unidades e mídias
const index = JSON.parse(read('units/index.json'));
const units = {};
const assets = {};
for (const { id } of index) {
  units[id] = JSON.parse(read(`units/${id}/unit.json`));
  for (const sub of ['audio', 'docs', '3d']) {
    const dir = join(root, 'units', id, sub);
    if (!existsSync(dir)) continue;
    for (const f of walk(dir)) {
      if (!MIME[extname(f)]) continue;
      const rel = relative(root, f).split('\\').join('/');
      // arquivo "somente jogo": só modelos 3D e falas curtas (sem faixas longas nem apostilas)
      if (game && !(sub === '3d' || rel.includes('/audio/lines/'))) continue;
      assets[rel] = dataUrl(f);
    }
  }
}

// 2. JavaScript em um único script clássico (funciona em file://)
const bundle = await build({
  entryPoints: [join(root, 'js/main.js')], bundle: true, format: 'iife', minify: true,
  target: ['es2020'], write: false, legalComments: 'none', charset: 'utf8',
});
const appJs = bundle.outputFiles[0].text;

// 3. Monta o HTML a partir do index.html
let html = read('index.html');
const icon = dataUrl(join(root, 'assets/icon.svg'));
html = html
  .replace(/\s*<link rel="manifest"[^>]*>/, '')
  .replace(/href="assets\/icon\.svg"/, `href="${icon}"`)
  .replace(/src="assets\/icon\.svg"/g, `src="${icon}"`)
  .replace(/<link rel="stylesheet" href="css\/tokens\.css">\s*<link rel="stylesheet" href="css\/app\.css">/,
    () => `<style>\n${read('css/tokens.css')}\n${read('css/app.css')}\n</style>`)
  .replace(/\s*<!-- GSAP[^>]*-->\s*<script src="vendor\/gsap\.min\.js" defer><\/script>/, () => `\n  <script>${safe(read('vendor/gsap.min.js'))}</script>`)
  .replace(/\s*<script type="module" src="js\/main\.js"><\/script>/, '')
  .replace(/\s*<script>\s*if \(location\.protocol === 'file:'\)[\s\S]*?<\/script>/, '');

const embed = { index, units, assets, builtAt: new Date().toISOString(), ...(game ? { start: game, gameOnly: true } : {}) };
if (game) html = html.replace(/<title>[^<]*<\/title>/, `<title>ODU CREATIVE — ${game === 'flashcards' ? 'Flashcards 3D' : game}</title>`);
const tail = [
  `<script>window.__ODU_EMBED__=${safe(JSON.stringify(embed))};</script>`,
  `<script>${safe(read('vendor/docx.iife.js'))}\n;window.docx=docx;</script>`,
  `<script>${safe(appJs)}</script>`,
].join('\n');
html = html.replace('</body>', () => `${tail}\n</body>`);

for (const needle of ['css/app.css', 'js/main.js', 'vendor/gsap.min.js', 'manifest.webmanifest']) {
  if (html.includes(`"${needle}"`)) throw new Error(`Referência externa restante: ${needle}`);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`✔ ${relative(process.cwd(), out)} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB, ${Object.keys(assets).length} mídias embutidas)`);
