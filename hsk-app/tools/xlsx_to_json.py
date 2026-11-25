"""Converte Vocabulario_Mandarim.xlsx em app/src/main/assets/data.js"""
import json, sys, openpyxl
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src, data_only=True)
def rows(name):
    ws = wb[name]; it = ws.iter_rows(values_only=True); hdr = next(it)
    return [r for r in it if any(c is not None for c in r)]
vocab = []
for i, r in enumerate(rows('Vocabulário')):
    p, tema, hz, py, pt, nv, v2, lista, curso = r[:9]
    vocab.append({"id": i, "p": p, "t": tema, "h": hz, "y": py, "pt": pt,
                  "n": nv, "o": v2, "l": lista or "", "c": curso or ""})
rev = [{"h": r[0], "y": r[1], "pt": r[2], "fix": r[3]} for r in rows('Revisar (caderno)')]
gram = [{"id": r[0], "p": r[1], "ponto": r[2], "padrao": r[3], "ex": r[4], "y": r[5], "pt": r[6], "curso": r[7]} for r in rows('Gramática')]
data = {"vocab": vocab, "revisar": rev, "gramatica": gram}
with open(out, 'w', encoding='utf-8') as f:
    f.write("window.HSK_DATA = " + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ";\n")
print(len(vocab), len(rev), len(gram))
