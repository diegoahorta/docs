// Copia Three.js, GSAP, Phaser e as fontes de node_modules para vendor/,
// para o app funcionar sem internet (Live Server e APK Android).
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const nm = (p) => new URL(`node_modules/${p}`, root);
const out = (p) => new URL(`vendor/${p}`, root);

await rm(out(''), { recursive: true, force: true });
await mkdir(out('three/addons/geometries'), { recursive: true });
await mkdir(out('gsap'), { recursive: true });
await mkdir(out('phaser'), { recursive: true });
await mkdir(out('fonts'), { recursive: true });

await cp(nm('three/build/three.module.js'), out('three/three.module.js'));
await cp(
  nm('three/examples/jsm/geometries/RoundedBoxGeometry.js'),
  out('three/addons/geometries/RoundedBoxGeometry.js'),
);
for (const f of ['index.js', 'gsap-core.js', 'CSSPlugin.js']) await cp(nm(`gsap/${f}`), out(`gsap/${f}`));
await cp(nm('phaser/dist/phaser.esm.min.js'), out('phaser/phaser.esm.min.js'));

const fonts = [
  [
    'Atkinson Hyperlegible',
    400,
    '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2',
  ],
  [
    'Atkinson Hyperlegible',
    700,
    '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2',
  ],
  ['Bricolage Grotesque', 700, '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2'],
  ['Bricolage Grotesque', 800, '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2'],
  ['JetBrains Mono', 500, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2'],
];
let css = '';
for (const [family, weight, file] of fonts) {
  const name = file.split('/').pop();
  await cp(nm(file), out(`fonts/${name}`));
  css += `@font-face {\n  font-family: '${family}';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('./${name}') format('woff2');\n}\n`;
}
await writeFile(out('fonts/fonts.css'), css);
console.log('vendor/ pronto: three, gsap, phaser e fontes');
