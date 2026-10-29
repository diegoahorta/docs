// Gera pongo.html: um único arquivo com HTML, CSS, JavaScript e ícone embutidos.
// Uso: npm run build:html  →  dist-single/pongo.html (abre com duplo clique).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = new URL('../dist-single/', import.meta.url).pathname
const read = (rel) => readFileSync(join(dir, rel), 'utf8')
let html = read('index.html')

html = html.replace(
  /<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g,
  (_, file) => `<style>\n${read(file)}\n</style>`
)
html = html.replace(
  /<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/g,
  (_, file) => {
    const js = read(file).replace(/<\/script/gi, '<\\/script')
    return `<script type="module">\n${js}\n</script>`
  }
)
const favicon = readFileSync(new URL('../public/favicon.svg', import.meta.url))
html = html.replace(
  /href="\.\/favicon\.svg"/,
  `href="data:image/svg+xml;base64,${favicon.toString('base64')}"`
)

if (/src="\.\/assets|href="\.\/assets/.test(html))
  throw new Error('Ainda há referências externas em assets/')
writeFileSync(join(dir, 'pongo.html'), html)
console.info(
  `✓ dist-single/pongo.html (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`
)
