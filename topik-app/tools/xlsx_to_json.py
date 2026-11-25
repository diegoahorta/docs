"""Converte Vocabulario_Coreano.xlsx em app/src/main/assets/data.js"""
import json, re, sys, openpyxl
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src, data_only=True)
HAN = re.compile(r'^[㐀-鿿豈-﫿\-()·\s]+$')

def rows(name):
    it = wb[name].iter_rows(values_only=True); next(it)
    return [r for r in it if any(c is not None for c in r)]

def split_hx(s):
    """'出張 · exemplo' -> ('出張', 'exemplo'); só hanja -> (hanja, '')"""
    if not s: return "", ""
    parts = [p.strip() for p in str(s).split(" · ")]
    if HAN.match(parts[0]) and re.search(r'[㐀-鿿]', parts[0]):
        return parts[0], " · ".join(parts[1:])
    return "", str(s)

def niv(x): return (x or "").replace("—", "").strip()

cards = []
for r in rows('Melhorar'):
    wrong, ko, pt, ex, tema, nv, pag, nota = r[:8]
    hj, ex = split_hx(ex)
    cards.append(dict(cat="melhorar", ko=ko, pt=pt, hj=hj, ex=ex, tema=tema, niv=niv(nv), pag=str(pag or ""), wrong=wrong, nota=nota or ""))
for cat, name in (("fixar", "Fixar"), ("rever", "Rever")):
    for r in rows(name):
        ko, pt, hx, tema, nv, pag = r[:6]
        hj, ex = split_hx(hx)
        cards.append(dict(cat=cat, ko=ko, pt=pt, hj=hj, ex=ex, tema=tema, niv=niv(nv), pag=str(pag or "")))
for r in rows('Avançar'):
    ko, pt, hx, tema, nv, pr, fr = r[:7]
    hj, ex = split_hx(hx)
    cards.append(dict(cat="avancar", p=pr, ko=ko, pt=pt, hj=hj, ex=ex, tema=tema, niv=niv(nv), freq=fr))
for i, c in enumerate(cards): c["id"] = i

gram = []
for i, r in enumerate(rows('Gramática')):
    cat, pr, pad, sig, ex, expt, erro, aula, pag, nv, nota = r[:11]
    gram.append(dict(id=i, cat={"Melhorar": "melhorar", "Rever": "rever", "Fixar": "fixar", "Avançar": "avancar"}[cat], p=pr,
                     pad=pad.strip(), sig=sig or "", ex=ex or "", expt=expt or "", erro=erro or "", aula=aula or "", pag=str(pag or ""),
                     niv=niv(nv), nota=nota or ""))
ileg = [dict(pag=r[0], trecho=r[1], sit=r[2]) for r in rows('Ilegível')]
data = {"vocab": cards, "gramatica": gram, "ilegivel": ileg}
with open(out, 'w', encoding='utf-8') as f:
    f.write("window.TOPIK_DATA = " + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ";\n")
from collections import Counter
print(len(cards), Counter((c["cat"], c.get("p")) for c in cards), len(gram), len(ileg))
