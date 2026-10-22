// npm run audio:roteiro  → audio/roteiro.csv com todos os textos que o app pode falar
// npm run audio:manifest → src/data/audio-manifest.js com os arquivos presentes em audio/
import { readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { LESSONS, sentenceText, tileText } from '../src/core/blocks.js';
import { audioKey } from '../src/core/audio-key.js';

const root = new URL('../', import.meta.url);
const LANGS = ['en', 'fr', 'de', 'es'];

if (process.argv[2] === 'roteiro') {
  const rows = new Map();
  const add = (lang, text, tipo, origem) => {
    const key = `${lang}/${audioKey(text)}`;
    if (!rows.has(key)) rows.set(key, { lang, text, tipo, origem, file: audioKey(text) });
  };
  for (const l of LESSONS) {
    for (const item of [...l.frases, ...l.dialogo, ...l.scaffold]) {
      for (const lang of LANGS) {
        add(lang, sentenceText(lang, item.blocks[lang], item.p), 'frase', l.id);
        item.blocks[lang].forEach((b) => add(lang, tileText(b.t), 'bloco', l.id));
      }
    }
  }
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const csv = [
    'idioma,arquivo,texto,tipo,aula',
    ...[...rows.values()].map((r) => [r.lang, `${r.file}.mp3`, r.text, r.tipo, r.origem].map(esc).join(',')),
  ];
  await writeFile(new URL('audio/roteiro.csv', root), `${csv.join('\n')}\n`);
  console.log(`audio/roteiro.csv: ${rows.size} áudios possíveis`);
} else {
  const files = {};
  for (const lang of LANGS) {
    const dir = new URL(`audio/${lang}/`, root);
    if (!existsSync(dir)) continue;
    for (const f of await readdir(dir)) {
      const m = f.match(/^(.+)\.(mp3|m4a|ogg|wav)$/i);
      if (m) files[`${lang}/${m[1]}`] = `audio/${lang}/${f}`;
    }
  }
  await writeFile(
    new URL('src/data/audio-manifest.js', root),
    `// Gerado por scripts/audio.mjs. Não edite à mão.\nexport const AUDIO_FILES = ${JSON.stringify(files, null, 2)};\n`,
  );
  console.log(`audio-manifest.js: ${Object.keys(files).length} arquivos`);
}
