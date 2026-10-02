// Gera um único HTML autocontido (JS, CSS e o modelo GLB do Blender embutidos),
// que funciona offline e até abrindo o arquivo direto do disco.
import { readFile, writeFile } from 'node:fs/promises'
import * as esbuild from 'esbuild'

const SAIDA = 'invasao-hiragana-3d.html'

async function montar() {
  const resultado = await esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    format: 'iife',
    minify: true,
    target: ['es2020'],
    loader: { '.glb': 'binary' },
    legalComments: 'none',
    write: false
  })
  const js = resultado.outputFiles[0].text.replace(
    /<\/script/gi,
    '<\\/script'
  )
  const css = await readFile('src/styles.css', 'utf8')
  const html = (await readFile('src/index.html', 'utf8'))
    .replace('/*__CSS__*/', () => css)
    .replace('/*__JS__*/', () => js)
  await writeFile(SAIDA, html)
  console.log(`✔ ${SAIDA} (${(html.length / 1024).toFixed(0)} KB)`)
}

await montar()

if (process.argv.includes('--watch')) {
  const { watch } = await import('node:fs')
  let pendente = null
  for (const pasta of ['src', 'assets']) {
    watch(pasta, { recursive: true }, () => {
      clearTimeout(pendente)
      pendente = setTimeout(
        () => montar().catch((e) => console.error(e.message)),
        100
      )
    })
  }
  console.log('Observando alterações em src/ e assets/…')
}
