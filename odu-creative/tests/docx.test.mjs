/** O gerador produz DOCX válidos, com as 17 seções e gabarito só na versão do professor. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as docx from 'docx';
import JSZip from 'jszip';
import { buildApostila } from '../js/core/docx-builder.js';

const unit = JSON.parse(readFileSync(new URL('../units/en-a1-cafe/unit.json', import.meta.url), 'utf8'));

async function text(version, opts = {}) {
  const buf = await docx.Packer.toBuffer(buildApostila(docx, unit, { version, ...opts }));
  assert.equal(buf.subarray(0, 2).toString(), 'PK');
  const zip = await JSZip.loadAsync(buf);
  return (await zip.file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
}

test('versão do professor tem as 17 seções e o gabarito', async () => {
  const t = await text('teacher');
  for (let i = 2; i <= 17; i++) assert.ok(t.includes(`${i}. `), `seção ${i}`);
  assert.ok(t.includes('Gabarito comentado'));
  assert.ok(t.includes('Orientação ao professor'));
  assert.ok(t.includes('Mia: Hi! Welcome to Sunny Corner Café.'));
});

test('versão do aluno não traz as respostas', async () => {
  const t = await text('student');
  assert.ok(t.includes('VERSÃO DO ALUNO'));
  assert.ok(!t.includes('Orientação ao professor'));
  assert.ok(t.includes('O gabarito comentado está na versão do professor'));
});

test('links de áudio só aparecem com URL pública e não alegam áudio embutido', async () => {
  const sem = await text('student');
  assert.ok(!sem.includes('https://'));
  const com = await text('student', { audioBaseUrl: 'https://example.org/u/' });
  assert.ok(com.includes('https://example.org/u/audio/t1.mp3'));
});
