// Baixa as ferramentas de build do APK para android/tools/cache (uma vez só):
// android.jar (API 36), dx (Dalvik) e apksig (assinatura v1/v2).
// Se ANDROID_HOME tiver platforms/android-36, ele é usado no lugar do download.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cache = path.join(root, 'android/tools/cache');
mkdirSync(cache, { recursive: true });

const API = 36;
const MAVEN = 'https://repo1.maven.org/maven2';
const JARS = {
  'dx.jar': `${MAVEN}/com/jakewharton/android/repackaged/dalvik-dx/16.0.1/dalvik-dx-16.0.1.jar`,
  'apksig.jar': `${MAVEN}/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar`,
};

async function download(url, dest) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = await fetch(url);
    if (res.ok) {
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return;
    }
    // O Maven Central devolve 429 quando há muitas requisições seguidas.
    const wait = 2 ** attempt * 1000;
    console.log(`  ${res.status} em ${url}, nova tentativa em ${wait / 1000}s`);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw new Error(`Falha ao baixar ${url}`);
}

const androidJar = path.join(cache, `android-${API}.jar`);
if (!existsSync(androidJar)) {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const local = sdk && path.join(sdk, `platforms/android-${API}/android.jar`);
  if (local && existsSync(local)) {
    copyFileSync(local, androidJar);
    console.log(`android.jar copiado de ${local}`);
  } else {
    console.log(`Baixando android-${API}/android.jar (espelho github.com/Sable/android-platforms)…`);
    const tmp = path.join(cache, 'platforms-git');
    rmSync(tmp, { recursive: true, force: true });
    const git = (...a) => execFileSync('git', a, { stdio: 'inherit', cwd: cache });
    git(
      'clone',
      '--filter=blob:none',
      '--no-checkout',
      '--depth',
      '1',
      'https://github.com/Sable/android-platforms',
      tmp,
    );
    execFileSync('git', ['sparse-checkout', 'set', '--no-cone', `/android-${API}/`], { cwd: tmp, stdio: 'inherit' });
    execFileSync('git', ['checkout', '-q', 'HEAD'], { cwd: tmp, stdio: 'inherit' });
    copyFileSync(path.join(tmp, `android-${API}/android.jar`), androidJar);
    rmSync(tmp, { recursive: true, force: true });
  }
}

for (const [name, url] of Object.entries(JARS)) {
  const dest = path.join(cache, name);
  if (existsSync(dest) && statSync(dest).size > 100_000) continue;
  console.log(`Baixando ${name}…`);
  await download(url, dest);
}
console.log('Ferramentas prontas em android/tools/cache');
