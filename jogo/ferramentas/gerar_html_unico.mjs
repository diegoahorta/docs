// Gera jogo/dist/boulos-vs-ratus-nunes.html: o jogo inteiro em um único arquivo HTML5
// (scripts, Three.js, CSS, sprites, fontes e músicas embutidos), que abre direto
// no navegador, sem servidor.
//
// Uso (a partir da raiz do repositório; precisa de Node.js 18+):
//   node jogo/ferramentas/gerar_html_unico.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const JOGO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.resolve(JOGO, '..');
const SAIDA = path.join(JOGO, 'dist', 'boulos-vs-ratus-nunes.html');

const TIPOS = {
  '.png': 'image/png', '.json': 'application/json', '.fnt': 'text/plain',
  '.ttf': 'font/ttf', '.mp3': 'audio/mpeg',
};

function dataUri(arquivo) {
  const tipo = TIPOS[path.extname(arquivo)];
  if (!tipo) throw new Error('Tipo desconhecido: ' + arquivo);
  return `data:${tipo};base64,${fs.readFileSync(arquivo).toString('base64')}`;
}

// 1. Junta os módulos (e o Three.js) em um único script.
const bundle = path.join(JOGO, 'dist', '.bundle.js');
fs.mkdirSync(path.dirname(bundle), { recursive: true });
execFileSync('npx', [
  '--yes', 'esbuild@0.24.0', path.join(JOGO, 'js', 'main.js'),
  '--bundle', '--format=iife', '--minify', '--target=es2020',
  `--alias:three=${path.join(JOGO, 'vendor', 'three.module.min.js')}`,
  `--outfile=${bundle}`, '--log-level=warning',
], { stdio: 'inherit' });
const js = fs.readFileSync(bundle, 'utf8').replace(/<\/script/gi, '<\\/script');
fs.rmSync(bundle);

// 2. Arquivos carregados em tempo de execução, pelo mesmo caminho que o código usa.
const embutidos = {};
for (const f of fs.readdirSync(path.join(JOGO, 'sprites'))) {
  embutidos[`sprites/${f}`] = dataUri(path.join(JOGO, 'sprites', f));
}
const assets = [
  ...['area-de-perigo', 'bloco-atravessavel', 'destaque-tile-verde', 'botao-seta-baixo',
    'botao-verde', 'botao-verde-pressionado', 'tecla-esc', 'tecla-esc-pressionada'].map((n) => `sprites/ui/${n}.png`),
  'fontes/Fonte_jogo.png', 'fontes/Fonte_jogo_branca.png', 'fontes/Fonte_jogo.fnt',
  ...fs.readdirSync(path.join(RAIZ, 'assets', 'audio', 'musica')).filter((f) => f.endsWith('.mp3')).map((f) => `audio/musica/${f}`),
];
for (const a of assets) embutidos[`../assets/${a}`] = dataUri(path.join(RAIZ, 'assets', a));

// 3. CSS com fontes e imagens embutidas.
const css = fs.readFileSync(path.join(JOGO, 'css', 'estilo.css'), 'utf8').replace(
  /url\('\.\.\/\.\.\/assets\/([^']+)'\)/g,
  (_, rel) => `url('${dataUri(path.join(RAIZ, 'assets', rel))}')`,
);

// 4. HTML final.
let html = fs.readFileSync(path.join(JOGO, 'index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="css/estilo.css">', () => `<style>\n${css}\n</style>`);
html = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '');
html = html.replace(/src="((?:sprites|\.\.\/assets)\/[^"]+)"/g, (_, caminho) => {
  const uri = embutidos[caminho] ?? dataUri(path.resolve(JOGO, caminho));
  return `src="${uri}"`;
});
html = html.replace(
  '<script type="module" src="js/main.js"></script>',
  () => `<script>window.RECURSOS_EMBUTIDOS = ${JSON.stringify(embutidos)};</script>\n  <script>${js}</script>`,
);

fs.writeFileSync(SAIDA, html);
const mb = (fs.statSync(SAIDA).size / 1024 / 1024).toFixed(1);
console.log(`Gerado ${path.relative(RAIZ, SAIDA)} (${mb} MB)`);
