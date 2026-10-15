"""Gera game/dist/pongo.html: o jogo em um único arquivo, com sprites e fonte embutidos.

Útil para abrir com dois cliques (navegadores bloqueiam texturas WebGL vindas de file://)
e para publicar em hospedagens que aceitam só um HTML.
"""
import base64, re
from pathlib import Path

GAME = Path(__file__).resolve().parents[1]
html = (GAME / "index.html").read_text(encoding="utf-8")
MIME = {".png": "image/png", ".ttf": "font/ttf"}

def data_uri(name):
    p = GAME / "assets" / name
    return f"data:{MIME[p.suffix]};base64," + base64.b64encode(p.read_bytes()).decode()

# url("assets/x") em CSS
html = re.sub(r'url\("assets/([^"]+)"\)', lambda m: f'url("{data_uri(m.group(1))}")', html)
# Imagens carregadas pelo JS: A + name + ".png"
pngs = sorted(p.stem for p in (GAME / "assets").glob("*.png"))
table = ",\n".join(f'  "{n}": "{data_uri(n + ".png")}"' for n in pngs)
html = html.replace('const A = "assets/";', 'const A = "";\nconst EMBED = {\n' + table + "\n};")
html = html.replace('A + name + ".png"', 'EMBED[name]')
assert 'A + name' not in html
out = GAME / "dist" / "pongo.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(out, round(out.stat().st_size / 1024), "KB")

# Versão "fragmento" (sem doctype/html/head/body) para hospedagens que montam o esqueleto.
import sys
if "--fragment" in sys.argv:
    frag = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*", "", html, flags=re.I)
    frag = re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', "", frag)
    frag = frag.replace("</head>\n<body>\n", "\n").replace("</body>\n</html>\n", "")
    dest = Path(sys.argv[sys.argv.index("--fragment") + 1])
    dest.write_text(frag, encoding="utf-8")
    print(dest, round(dest.stat().st_size / 1024), "KB")
