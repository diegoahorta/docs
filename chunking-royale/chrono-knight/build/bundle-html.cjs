// Gera um HTML único e autocontido (scripts, CSS e imagens embutidos).
// Uso: node bundle-html.cjs <pasta/index.html> <saida.html>
const fs = require('fs');
const path = require('path');

const [src, out] = process.argv.slice(2);
const dir = path.dirname(path.resolve(src));
const read = (rel) => fs.readFileSync(path.resolve(dir, rel));
const dataUri = (rel) => {
  const ext = path.extname(rel).slice(1).toLowerCase();
  const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml' }[ext];
  return `data:${mime};base64,${read(rel).toString('base64')}`;
};
// Troca referências a imagens locais ('../assets/x.png', "img.png", url(...)) por data URIs.
const inlineImages = (text) => text.replace(/(["'(])((?:\.\.?\/)?[\w\-./]+\.(?:png|jpe?g|svg))(["')])/g,
  (m, a, rel, b) => (fs.existsSync(path.resolve(dir, rel)) ? a + dataUri(rel) + b : m));

let html = fs.readFileSync(src, 'utf8');
html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g,
  (m, href) => (/^https?:/.test(href) ? m : `<style>\n${inlineImages(read(href).toString())}\n</style>`));
html = html.replace(/<script([^>]*)\ssrc=["']([^"']+)["']([^>]*)><\/script>/g, (m, a, s, b) => {
  if (/^https?:/.test(s)) return m;
  const code = s.endsWith('.min.js') ? read(s).toString() : inlineImages(read(s).toString());
  return `<script${a}${b}>\n${code.replace(/<\/script/gi, '<\\/script')}\n</script>`;
});
html = inlineImages(html);
fs.writeFileSync(out, html);
console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
