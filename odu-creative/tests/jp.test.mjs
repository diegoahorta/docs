import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plain, reading, paren, tokens, romaji, kanaToRomaji, normalizeJa, toHiragana } from '../js/core/jp.js';

const s = '{先生|せんせい}が {言|い}った とおりに、{書|か}きます。';

test('plain / reading / paren', () => {
  assert.equal(plain(s), '先生が 言った とおりに、書きます。');
  assert.equal(reading(s), 'せんせいが いった とおりに、かきます。');
  assert.equal(paren('{砂糖|さとう}を'), '砂糖(さとう)を');
});

test('tokens separa base e ruby', () => {
  assert.deepEqual(tokens('{漢字|かんじ}です'), [{ base: '漢字', ruby: 'かんじ' }, { base: 'です' }]);
});

test('romaji Hepburn com partículas separadas', () => {
  assert.equal(romaji(s), 'sensei ga itta toori ni, kakimasu.');
  assert.equal(romaji('コーヒーを {飲|の}んで ください'), 'koohii o nonde kudasai');
  assert.equal(romaji('{砂糖|さとう}は {入|い}れないで ください'), 'satou wa irenaide kudasai');
  assert.equal(romaji('{食|た}べた あとで'), 'tabeta ato de');
  assert.equal(romaji('ちょっと {待|ま}って'), 'chotto matte');
  assert.equal(romaji('いっしょに {行|い}きませんか'), 'issho ni ikimasen ka');
});

test('kanaToRomaji: geminadas, youon, ん, katakana', () => {
  assert.equal(kanaToRomaji('きっぷ', { particle: false }), 'kippu');
  assert.equal(kanaToRomaji('まっちゃ', { particle: false }), 'matcha');
  assert.equal(kanaToRomaji('きんえん', { particle: false }), "kin'en");
  assert.equal(kanaToRomaji('ラテ', { particle: false }), 'rate');
  assert.equal(toHiragana('ケーキ'), 'けーき');
});

test('normalizeJa ignora espaços, pontuação e largura', () => {
  assert.equal(normalizeJa('砂糖は 入れないで ください。'), normalizeJa('砂糖は入れないでください'));
  assert.equal(normalizeJa('ＡＢＣ　ｱｲｳ'), 'ABCアイウ');
});

test('romaji separa a cópula です', () => {
  assert.equal(romaji('ぜんぶで {九百円|きゅうひゃくえん}です。'), 'zenbu de kyuuhyakuen desu.');
  assert.equal(romaji('{苦|にが}いですが'), 'nigai desu ga');
});
