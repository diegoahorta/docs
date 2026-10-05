/* Pongo - tiny Hangul composer.
 * Turns a list of compatibility jamo (ㅎ, ㅏ, ㄴ ...) into syllable blocks
 * (한), the same way a Korean keyboard does: consonant + vowel (+ batchim). */
(function () {
  'use strict';
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ',
    'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const isVowel = (c) => JUNG.includes(c);
  const isCons = (c) => CHO.includes(c) || JONG.includes(c);
  const syl = (c, v, f) => String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28 + JONG.indexOf(f || ''));

  function compose(jamo) {
    const j = jamo.slice();
    let out = '';
    let i = 0;
    while (i < j.length) {
      const c = j[i];
      if (CHO.includes(c) && isVowel(j[i + 1])) {
        const v = j[i + 1];
        i += 2;
        let f = '';
        // a consonant closes the block unless a vowel follows it (then it starts the next block)
        if (i < j.length && JONG.includes(j[i]) && j[i] !== '' && !isVowel(j[i + 1])) {
          f = j[i];
          i++;
        }
        out += syl(c, v, f);
      } else {
        out += c;
        i++;
      }
    }
    return out;
  }

  window.Hangul = { compose, isVowel, isCons };
})();
