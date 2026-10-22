// Gera o jogo inteiro num único arquivo HTML (dist/<nome-do-projeto>.html),
// que abre com dois cliques (sem Live Server).
//
// - Todo o código de src/ é juntado num só módulo pelo esbuild (só nesta etapa
//   de geração; o projeto continua rodando sem bundler no Live Server).
// - Normal: Three.js, Phaser e GSAP vêm do CDN pelo importmap (precisa de internet).
// - --offline: as bibliotecas também vão para dentro do HTML (de node_modules),
//   sem importmap. É a versão usada nos apps Android.
// - O CSS e o favicon vão embutidos no próprio HTML.
//
// Uso: npm run build:html
//      node scripts/build-html.js --offline --saida caminho/index.html

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIBLIOTECAS = ['three', 'three/addons/*', 'phaser', 'gsap'];

/** Lê --offline e --saida da linha de comando. */
function lerOpcoes(argumentos, nomeDoProjeto) {
  const indiceSaida = argumentos.indexOf('--saida');
  return {
    offline: argumentos.includes('--offline'),
    destino:
      indiceSaida >= 0
        ? path.resolve(argumentos[indiceSaida + 1])
        : path.join(raiz, 'dist', `${nomeDoProjeto}.html`),
  };
}

/** Junta src/main.js e tudo o que ele importa num único módulo ES. */
async function gerarCodigo(offline) {
  const resultado = await build({
    entryPoints: [path.join(raiz, 'src', 'main.js')],
    bundle: true,
    format: 'esm',
    target: 'es2022',
    write: false,
    charset: 'utf8',
    minify: offline, // as bibliotecas embutidas ficam bem menores minificadas
    // Na versão normal as bibliotecas ficam de fora: o importmap aponta para o CDN.
    external: offline ? [] : BIBLIOTECAS,
    legalComments: offline ? 'eof' : 'inline',
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

/** Remove o <script type="importmap"> (desnecessário com as bibliotecas embutidas). */
function removerImportmap(html) {
  const semImportmap = html.replace(
    /\s*<!-- Bibliotecas por CDN[^>]*-->\s*<script type="importmap">[\s\S]*?<\/script>/,
    '',
  );
  if (semImportmap === html) {
    throw new Error('Importmap não encontrado em index.html');
  }
  return semImportmap;
}

async function gerarHtml() {
  const pacote = JSON.parse(await readFile(path.join(raiz, 'package.json'), 'utf8'));
  const { offline, destino } = lerOpcoes(process.argv.slice(2), pacote.name);
  const [html, css, favicon, codigo] = await Promise.all([
    readFile(path.join(raiz, 'index.html'), 'utf8'),
    readFile(path.join(raiz, 'src', 'ui', 'styles.css'), 'utf8'),
    readFile(path.join(raiz, 'assets', 'img', 'favicon.svg')),
    gerarCodigo(offline),
  ]);
  const aviso =
    '<!-- Arquivo gerado por scripts/build-html.js. Não edite: altere src/ e gere de novo. -->';

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
  if (offline) {
    saida = removerImportmap(saida);
  }
  saida = substituir(
    saida,
    '<script type="module" src="./src/main.js"></script>',
    `<script type="module">\n${codigo}\n</script>`,
  );

  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, saida, 'utf8');
  const kb = (Buffer.byteLength(saida) / 1024).toFixed(0);
  console.warn(
    `✔ ${path.relative(process.cwd(), destino)} gerado (${kb} KB${offline ? ', offline' : ''})`,
  );
}

gerarHtml().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
