#!/usr/bin/env node
/**
 * Gera as apostilas DOCX (aluno e professor) de uma unidade.
 * Uso: node tools/build-docx.mjs units/en-a1-cafe [--audio-base https://seu-site/odu-creative/units/en-a1-cafe/]
 *
 * Com --audio-base (URL pública onde os MP3 estão hospedados), o DOCX inclui links e QR codes.
 * Sem ela, o DOCX indica onde o áudio está na plataforma. O áudio nunca é incorporado ao DOCX.
 */
import * as docx from 'docx';
import QRCode from 'qrcode';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildApostila } from '../js/core/docx-builder.js';

const unitDir = resolve(process.argv[2] || 'units/en-a1-cafe');
const ai = process.argv.indexOf('--audio-base');
const audioBaseUrl = ai > 0 ? process.argv[ai + 1] : '';
const unit = JSON.parse(readFileSync(join(unitDir, 'unit.json'), 'utf8'));

const qr = {};
if (audioBaseUrl) {
  for (const tr of unit.tracks) {
    const url = audioBaseUrl.replace(/\/?$/, '/') + tr.audio;
    qr[tr.id] = await QRCode.toBuffer(url, { type: 'png', width: 330, margin: 1 });
  }
}

const outDir = join(unitDir, 'docs');
mkdirSync(outDir, { recursive: true });
for (const version of ['student', 'teacher']) {
  const doc = buildApostila(docx, unit, { version, audioBaseUrl, qr });
  const buf = await docx.Packer.toBuffer(doc);
  const file = join(outDir, `${unit.id}-${version === 'student' ? 'aluno' : 'professor'}.docx`);
  writeFileSync(file, buf);
  console.log(`✔ ${file} (${(buf.length / 1024).toFixed(0)} KB)`);
}
