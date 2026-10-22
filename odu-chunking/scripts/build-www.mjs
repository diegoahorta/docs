// Monta www/ (pasta web empacotada pelo Capacitor no APK).
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const www = new URL('www/', root);

if (!existsSync(new URL('vendor/', root))) {
  console.error('vendor/ não existe. Rode "npm run vendor" antes.');
  process.exit(1);
}
await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });
for (const dir of ['src', 'styles', 'vendor', 'audio']) {
  if (existsSync(new URL(dir, root))) await cp(new URL(dir, root), new URL(dir, www), { recursive: true });
}
await cp(new URL('index.html', root), new URL('index.html', www));
console.log('www/ pronto');
