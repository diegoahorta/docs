import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRuby, plain, kana, autoRuby, rubyHTML } from '../src/lang/ruby.js'
import { romaji, kanaToRomaji } from '../src/lang/romaji.js'
import { checkSentence, joinChunks } from '../src/lang/sentenceCheck.js'
import { loadJSON } from './helpers.js'

const S = 'ポンゴ[は]{公園|こうえん}[で]{走|はし}っています。'

test('parseRuby / plain / kana', () => {
  assert.equal(plain(S), 'ポンゴは公園で走っています。')
  assert.equal(kana(S), 'ポンゴはこうえんではしっています。')
  assert.equal(parseRuby(S).filter((t) => t.type === 'particle').length, 2)
})

test('autoRuby alinha o furigana das formas conjugadas', () => {
  assert.equal(autoRuby('走っています', 'はしっています'), '{走|はし}っています')
  assert.equal(autoRuby('食べます', 'たべます'), '{食|た}べます')
  assert.equal(autoRuby('来ない', 'こない'), '{来|こ}ない')
  assert.equal(autoRuby('ポンゴ', 'ポンゴ'), 'ポンゴ')
})

test('rubyHTML respeita a opção de furigana', () => {
  assert.match(rubyHTML('{走|はし}る'), /<ruby>走<rt>はし<\/rt><\/ruby>る/)
  assert.equal(rubyHTML('{走|はし}る', { furigana: false }), '走る')
  assert.match(rubyHTML('[は]'), /jp-particle/)
})

test('romaji Hepburn', () => {
  assert.equal(romaji(S), 'pongo wa kouen de hashitteimasu.')
  assert.equal(kanaToRomaji('ちょっと'), 'chotto')
  assert.equal(kanaToRomaji('じてんしゃ'), 'jitensha')
  assert.equal(kanaToRomaji('きって'), 'kitte')
  assert.equal(kanaToRomaji('まっちゃ'), 'matcha')
  assert.equal(kanaToRomaji('ほんや'), "hon'ya")
  assert.equal(kanaToRomaji('シーソー'), 'shiisoo')
  assert.equal(kanaToRomaji('あっ！'), 'a!')
  assert.equal(romaji('{水|みず}[を]{飲|の}みます。'), 'mizu o nomimasu.')
  assert.equal(romaji('すばらしい！ノート[に]{書|か}いて'), 'subarashii! nooto ni kaite')
})

const { bridge, picnic } = loadJSON('sentences.json')

test('checkSentence aceita ordens válidas', () => {
  assert.equal(checkSentence(bridge, ['t', 'l', 'v']).ok, true)
  const alt = checkSentence(bridge, ['l', 't', 'v'])
  assert.equal(alt.ok, true)
  assert.ok(alt.note)
})

test('checkSentence dá feedback explicativo', () => {
  assert.equal(checkSentence(bridge, ['t', 'v', 'l']).tag, 'verb-last')
  assert.equal(checkSentence(bridge, ['t', 'x1', 'v']).tag, 'particle-ni-de')
  assert.equal(checkSentence(bridge, ['t', 'v']).tag, 'missing')
  assert.equal(checkSentence(picnic, ['l', 'o', 'x2']).tag, 'wrong-verb')
  assert.equal(checkSentence(bridge, []).tag, 'empty')
})

test('joinChunks monta o texto da frase', () => {
  assert.equal(plain(joinChunks(bridge, ['t', 'l', 'v'])), 'ポンゴは公園で走っています。')
})

test('todas as frases de exemplo dos verbos têm ruby válido', () => {
  const { verbs } = loadJSON('verbs.json')
  for (const v of verbs) {
    assert.ok(plain(v.example.text).includes(v.kanji.slice(0, 1)), v.kanji)
    assert.ok(!/[{}|[\]]/.test(plain(v.example.text)), v.kanji)
  }
})
