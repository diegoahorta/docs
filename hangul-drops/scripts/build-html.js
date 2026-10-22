// Gera dist/hangul-drops.html: o jogo inteiro num único arquivo HTML,
// que abre com dois cliques (sem Live Server).
//
// - Todo o código de src/ é juntado num só módulo pelo esbuild (só nesta etapa
//   de geração; o projeto continua rodando sem bundler no Live Server).
// - Three.js, Phaser e GSAP continuam vindo do CDN pelo importmap.
// - O CSS e o favicon vão embutidos no próprio HTML.
//
// Uso: npm run build:html

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'dist', 'hangul-drops.html');

/** Junta src/main.js e tudo o que ele importa num único módulo ES. */
async function gerarCodigo() {
  const resultado = await build({
    entryPoints: [path.join(raiz, 'src', 'main.js')],
    bundle: true,
    format: 'esm',
    target: 'es2022',
    write: false,
    charset: 'utf8',
    // As bibliotecas ficam de fora: o importmap do HTML aponta para o CDN.
    external: ['three', 'three/addons/*', 'phaser', 'gsap'],
    legalComments: 'inline',
  });
  // Evita que um "</script>" dentro do código feche a tag antes da hora.
  return resultado.outputFiles[0].text.replaceAll('</script', '<\\/script');
}

/** Substitui um trecho do HTML e avisa se ele não existir mais. */
function substituir(html, trecho, novo) {
  if (!html.includes(trecho)) {
    throw new Error(`Trecho não encontrado em index.html: ${trecho}`);
  }
  return html.replace(trecho, () => novo);
}

async function gerarHtml() {
  const [html, css, favicon, codigo] = await Promise.all([
    readFile(path.join(raiz, 'index.html'), 'utf8'),
    readFile(path.join(raiz, 'src', 'ui', 'styles.css'), 'utf8'),
    readFile(path.join(raiz, 'assets', 'img', 'favicon.svg')),
    gerarCodigo(),
  ]);
  const aviso =
    '<!-- Arquivo gerado por scripts/build-html.js. Não edite: altere src/ e rode npm run build:html. -->';

  let saida = substituir(html, '<!doctype html>', `<!doctype html>\n${aviso}`);
  saida = substituir(
    saida,
    '<link rel="icon" href="./assets/img/favicon.svg" type="image/svg+xml" />',
    `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${favicon.toString('base64')}" />`,
  );
  saida = substituir(
    saida,
    '<link rel="stylesheet" href="./src/ui/styles.css" />',
    `<style>\n${css}\n</style>`,
  );
  saida = substituir(
    saida,
    '<script type="module" src="./src/main.js"></script>',
    `<script type="module">\n${codigo}\n</script>`,
  );

  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, saida, 'utf8');
  const kb = (Buffer.byteLength(saida) / 1024).toFixed(0);
  console.warn(`✔ ${path.relative(raiz, destino)} gerado (${kb} KB)`);
}

gerarHtml().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
