import { describe, it, expect } from 'vitest'
import {
  parseChunks,
  toHTML,
  plain,
  reading,
  toBlocks,
  rubyHTML
} from '../src/ui/ruby.js'

const S = '{猫|ねこ}は[ref:{箱|はこ}][no:の][pos:{中|なか}][part:に][pred:います]。'

describe('marcação de furigana e chunking', () => {
  it('gera ruby', () => {
    expect(rubyHTML('{北|きた}')).toBe('<ruby>北<rt>きた</rt></ruby>')
  })
  it('separa blocos coloridos', () => {
    const c = parseChunks(S)
    expect(c.map((x) => x.type)).toEqual([null, 'ref', 'no', 'pos', 'part', 'pred', null])
  })
  it('texto puro e leitura', () => {
    expect(plain(S)).toBe('猫は箱の中にいます。')
    expect(reading(S)).toBe('ねこははこのなかにいます。')
  })
  it('HTML com classes de chunk e escape', () => {
    const h = toHTML(S)
    expect(h).toContain('class="ch ch-ref"')
    expect(h).toContain('<rt>はこ</rt>')
    expect(toHTML('<b>')).toBe('&lt;b&gt;')
  })
  it('blocos para montar frases (sem pontuação)', () => {
    expect(toBlocks(S).map((b) => b.text)).toEqual([
      '{猫|ねこ}は',
      '{箱|はこ}',
      'の',
      '{中|なか}',
      'に',
      'います'
    ])
  })
})
