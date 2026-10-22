// Gera o APK Android sem Gradle: aapt2 (recursos) → javac → dx (DEX) → ApkPacker (alinha e assina).
// Requisitos: JDK 17+ e as ferramentas de "npm run android:tools" (chamado automaticamente).
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const APP_ID = 'com.oducreative.blocos';
const [major, minor, patch] = pkg.version.split('.').map(Number);
const versionCode = String(major * 10000 + minor * 100 + patch);
const android = path.join(root, 'android');
const cache = path.join(android, 'tools/cache');
const build = path.join(android, 'build');
const main = path.join(android, 'src/main');
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });

if (!existsSync(path.join(root, 'www/index.html'))) {
  console.error('www/ não existe. Rode "npm run build:www" antes (o "npm run android:build" já faz isso).');
  process.exit(1);
}
run(process.execPath, [path.join(root, 'scripts/android-tools.mjs')]);

const require = createRequire(import.meta.url);
const aaptDir = path.dirname(require.resolve('aaptjs3/package.json'));
const plat = { linux: 'linux', darwin: 'darwin', win32: 'win32' }[process.platform];
const aapt2 = path.join(aaptDir, 'bin/x64', plat, process.platform === 'win32' ? 'aapt2.exe' : 'aapt2');
if (process.platform !== 'win32') chmodSync(aapt2, 0o755);

const androidJar = path.join(cache, 'android-36.jar');
const dx = path.join(cache, 'dx.jar');
const apksig = path.join(cache, 'apksig.jar');
const sep = process.platform === 'win32' ? ';' : ':';

rmSync(build, { recursive: true, force: true });
for (const d of ['res', 'classes', 'packer', 'assets/www', 'gen']) mkdirSync(path.join(build, d), { recursive: true });

// 1. Recursos + manifesto + assets (app web inteiro em assets/www)
cpSync(path.join(root, 'www'), path.join(build, 'assets/www'), { recursive: true });
const resZip = path.join(build, 'res/compiled.zip');
run(aapt2, ['compile', '--dir', path.join(main, 'res'), '-o', resZip]);
// O manifesto do projeto não tem "package" (padrão do Gradle); o build injeta o id do app.
const manifest = path.join(build, 'AndroidManifest.xml');
writeFileSync(
  manifest,
  readFileSync(path.join(main, 'AndroidManifest.xml'), 'utf8').replace(
    '<manifest ',
    `<manifest package="${APP_ID}" android:versionCode="${versionCode}" android:versionName="${pkg.version}" `,
  ),
);
const baseApk = path.join(build, 'base.apk');
run(aapt2, [
  'link',
  '-I',
  androidJar,
  '--manifest',
  manifest,
  '-A',
  path.join(build, 'assets'),
  '--java',
  path.join(build, 'gen'),
  '--min-sdk-version',
  '24',
  '--target-sdk-version',
  '35',
  '-o',
  baseApk,
  resZip,
]);

// 2. Java → .class (Java 8, sem lambdas, para o dx)
const javaFiles = [];
const walk = (dir) =>
  readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.java')) javaFiles.push(p);
  });
// BuildConfig (como o do Gradle) gerado a partir do package.json.
writeFileSync(
  path.join(build, 'gen/BuildConfig.java'),
  `package ${APP_ID};\n\nfinal class BuildConfig {\n    static final String VERSION_NAME = "${pkg.version}";\n\n    private BuildConfig() {\n    }\n}\n`,
);
walk(path.join(main, 'java'));
walk(path.join(build, 'gen'));
run('javac', [
  '-source',
  '8',
  '-target',
  '8',
  '-nowarn',
  '-Xlint:-options',
  '-bootclasspath',
  androidJar,
  '-encoding',
  'UTF-8',
  '-d',
  path.join(build, 'classes'),
  ...javaFiles,
]);

// 3. .class → classes.dex
const dexFile = path.join(build, 'classes.dex');
run('java', [
  '-cp',
  dx,
  'com.android.dx.command.Main',
  '--dex',
  '--min-sdk-version=24',
  `--output=${dexFile}`,
  path.join(build, 'classes'),
]);

// 4. Junta, alinha e assina
run('javac', ['-nowarn', '-cp', apksig, '-d', path.join(build, 'packer'), path.join(android, 'tools/ApkPacker.java')]);
const keystore = process.env.ODU_KEYSTORE || path.join(android, 'odu-blocos-debug.p12');
const pass = process.env.ODU_KEYSTORE_PASS || 'odublocos';
const alias = process.env.ODU_KEY_ALIAS || 'odublocos';
if (!existsSync(keystore)) {
  console.log('Criando chave de assinatura de desenvolvimento…');
  run('keytool', [
    '-genkeypair',
    '-keystore',
    keystore,
    '-storetype',
    'PKCS12',
    '-storepass',
    pass,
    '-keypass',
    pass,
    '-alias',
    alias,
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-dname',
    'CN=ODU Creative, O=ODU Creative, C=BR',
  ]);
}
const outDir = path.join(android, 'dist');
mkdirSync(outDir, { recursive: true });
const apk = path.join(outDir, 'ODU-Blocos.apk');
// O apksig 2.3 carrega classes internas do JDK mesmo com a assinatura v1 desligada.
const exportsJdk = ['--add-exports', 'java.base/sun.security.x509=ALL-UNNAMED'];
run('java', [
  ...exportsJdk,
  '-cp',
  `${apksig}${sep}${path.join(build, 'packer')}`,
  'ApkPacker',
  baseApk,
  dexFile,
  apk,
  keystore,
  pass,
  alias,
]);
console.log(`\nPronto: ${path.relative(root, apk)} (${(statSync(apk).size / 1024 / 1024).toFixed(1)} MB)`);
