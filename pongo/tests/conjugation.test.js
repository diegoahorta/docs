import { test } from 'node:test'
import assert from 'node:assert/strict'
import { conjugate, explain, wrongOptions, FORMS } from '../src/lang/conjugation.js'
import { loadJSON } from './helpers.js'

const { verbs } = loadJSON('verbs.json')
const byId = Object.fromEntries(verbs.map((v) => [v.id, v]))

// Tabela de referência conferida manualmente (forma com kanji).
const EXPECTED = {
  aruku: [
    '歩く',
    '歩きます',
    '歩きません',
    '歩きました',
    '歩きませんでした',
    '歩いて',
    '歩いています',
    '歩かない',
    '歩きたい'
  ],
  hashiru: [
    '走る',
    '走ります',
    '走りません',
    '走りました',
    '走りませんでした',
    '走って',
    '走っています',
    '走らない',
    '走りたい'
  ],
  tobu: [
    '跳ぶ',
    '跳びます',
    '跳びません',
    '跳びました',
    '跳びませんでした',
    '跳んで',
    '跳んでいます',
    '跳ばない',
    '跳びたい'
  ],
  iku: [
    '行く',
    '行きます',
    '行きません',
    '行きました',
    '行きませんでした',
    '行って',
    '行っています',
    '行かない',
    '行きたい'
  ],
  kuru: [
    '来る',
    '来ます',
    '来ません',
    '来ました',
    '来ませんでした',
    '来て',
    '来ています',
    '来ない',
    '来たい'
  ],
  taberu: [
    '食べる',
    '食べます',
    '食べません',
    '食べました',
    '食べませんでした',
    '食べて',
    '食べています',
    '食べない',
    '食べたい'
  ],
  nomu: [
    '飲む',
    '飲みます',
    '飲みません',
    '飲みました',
    '飲みませんでした',
    '飲んで',
    '飲んでいます',
    '飲まない',
    '飲みたい'
  ],
  kau: [
    '買う',
    '買います',
    '買いません',
    '買いました',
    '買いませんでした',
    '買って',
    '買っています',
    '買わない',
    '買いたい'
  ],
  hanasu: [
    '話す',
    '話します',
    '話しません',
    '話しました',
    '話しませんでした',
    '話して',
    '話しています',
    '話さない',
    '話したい'
  ],
  oyogu: [
    '泳ぐ',
    '泳ぎます',
    '泳ぎません',
    '泳ぎました',
    '泳ぎませんでした',
    '泳いで',
    '泳いでいます',
    '泳がない',
    '泳ぎたい'
  ],
  motsu: [
    '持つ',
    '持ちます',
    '持ちません',
    '持ちました',
    '持ちませんでした',
    '持って',
    '持っています',
    '持たない',
    '持ちたい'
  ],
  okiru: [
    '起きる',
    '起きます',
    '起きません',
    '起きました',
    '起きませんでした',
    '起きて',
    '起きています',
    '起きない',
    '起きたい'
  ],
  kaeru: [
    '帰る',
    '帰ります',
    '帰りません',
    '帰りました',
    '帰りませんでした',
    '帰って',
    '帰っています',
    '帰らない',
    '帰りたい'
  ],
  keru: [
    '蹴る',
    '蹴ります',
    '蹴りません',
    '蹴りました',
    '蹴りませんでした',
    '蹴って',
    '蹴っています',
    '蹴らない',
    '蹴りたい'
  ]
}

for (const [id, forms] of Object.entries(EXPECTED)) {
  test(`conjugação com kanji: ${byId[id].kanji}`, () => {
    FORMS.forEach((form, i) =>
      assert.equal(conjugate(byId[id], form).kanji, forms[i], form)
    )
  })
}

test('leituras em kana do verbo irregular 来る', () => {
  const v = byId.kuru
  assert.equal(conjugate(v, 'masu').kana, 'きます')
  assert.equal(conjugate(v, 'nai').kana, 'こない')
  assert.equal(conjugate(v, 'te').kana, 'きて')
  assert.equal(conjugate(v, 'teimasu').kana, 'きています')
  assert.equal(conjugate(v, 'tai').kana, 'きたい')
})

test('する (Grupo III)', () => {
  const suru = { kanji: 'する', kana: 'する', group: 3 }
  assert.equal(conjugate(suru, 'masu').kanji, 'します')
  assert.equal(conjugate(suru, 'nai').kanji, 'しない')
  assert.equal(conjugate(suru, 'te').kanji, 'して')
})

test('kana e kanji permanecem paralelos em todos os verbos', () => {
  for (const v of verbs) {
    for (const form of FORMS) {
      const r = conjugate(v, form)
      const kanjiTail = r.kanji.replace(/^[一-龯]+/, '')
      assert.ok(r.kana.endsWith(kanjiTail.replace(/[一-龯]/g, '')), `${v.kanji} ${form}`)
    }
  }
})

test('grupos e exceções declarados nos dados são coerentes', () => {
  for (const v of verbs) {
    assert.ok([1, 2, 3].includes(v.group), v.kanji)
    if (v.group === 2)
      assert.match(
        v.kana,
        /[いきしちにひみりぎじぢびぴえけせてねへめれげぜでべぺ]る$/,
        v.kanji
      )
    if (v.exception) {
      assert.equal(v.group, 1, `${v.kanji}: exceção deve ser Grupo I`)
      assert.match(v.kana, /[いきしちにひみりえけせてねへめれべ]る$/, v.kanji)
    }
  }
})

test('explicações citam a forma correta', () => {
  for (const v of verbs) {
    for (const form of FORMS) {
      assert.ok(explain(v, form).includes(conjugate(v, form).kanji), `${v.kanji} ${form}`)
    }
  }
})

test('alternativas erradas nunca coincidem com a resposta e têm motivo', () => {
  for (const v of verbs) {
    for (const form of FORMS.filter((f) => f !== 'dict')) {
      const correct = conjugate(v, form).kanji
      const wrong = wrongOptions(v, form)
      assert.ok(wrong.length >= 2, `${v.kanji} ${form}: poucas alternativas`)
      for (const w of wrong) {
        assert.notEqual(w.kanji, correct)
        assert.ok(w.why.length > 10)
      }
    }
  }
})

test('erros típicos aparecem como distratores', () => {
  const kanjis = (v, f) => wrongOptions(v, f).map((w) => w.kanji)
  assert.ok(kanjis(byId.hashiru, 'masu').includes('走ます'), 'tratar 走る como Grupo II')
  assert.ok(
    kanjis(byId.taberu, 'masu').includes('食べります'),
    'tratar 食べる como Grupo I'
  )
  assert.ok(kanjis(byId.nomu, 'te').includes('飲みて'))
  assert.ok(kanjis(byId.kau, 'nai').includes('買いない'))
})
