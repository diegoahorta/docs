import re, unicodedata
from pypinyin import pinyin, Style, load_phrases_dict
from content_a import LESSONS_A
from content_b import LESSONS_B
L = LESSONS_A + LESSONS_B
assert [l['n'] for l in L] == list(range(1, 26)), 'lesson numbers'
def strip_tones(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z]', '', s.lower().replace('ü', 'v'))
def hz(s): return ''.join(c for c in s if '一' <= c <= '鿿')
def ref(s, style):
    return ''.join(x[0] for x in pinyin(hz(s), style=style, neutral_tone_with_five=False))
problems = 0; rows = 0
def check(hanzi, py, where):
    global problems
    a = strip_tones(py); b = strip_tones(ref(hanzi, Style.NORMAL))
    if a != b:
        problems += 1; print(f'[sílabas] {where}: {hanzi} | {py} | ref: {ref(hanzi, Style.TONE)}')
for l in L:
    check(l['t'], l['py'], f"L{l['n']} título")
    assert len(l['obj']) == 3 and len(l['pts']) == 3
    for i, p in enumerate(l['pts']):
        for k in ('title','forma','funcao','modo','wrong','right','erro','obs'): assert p.get(k), (l['n'], i, k)
        assert len(p['ex']) == 4
        for r in p['ex']:
            rows += 1
            f = r.split('|')
            assert len(f) == 7, (l['n'], r)
            chunks = ''.join(x for x in f[:5] if x != '—')
            check(chunks, f[5], f"L{l['n']}{'ABC'[i]}")
print('linhas de exemplo:', rows, '| problemas:', problems)

# --- tons: compara pinyin com tom, ignorando frases com leituras que variam
def norm_t(s): return re.sub(r"[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]", '', unicodedata.normalize('NFC', s.lower()))
skip = set('一不儿得地着')
tone_issues = 0
for l in L:
    for i, p in enumerate(l['pts']):
        for r in p['ex']:
            f = r.split('|'); h = ''.join(x for x in f[:5] if x != '—')
            if set(h) & skip: continue
            a = norm_t(f[5]); b = norm_t(ref(h, Style.TONE))
            if a != b:
                tone_issues += 1; print(f"[tom] L{l['n']}{'ABC'[i]}: {h} | meu: {f[5]} | ref: {ref(h, Style.TONE)}")
print('diferenças de tom:', tone_issues)
