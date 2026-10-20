"""Empacota o Kotobana Dojo em um único arquivo HTML (kotobana/kotobana-dojo.html).

O arquivo abre com dois cliques, sem servidor: CSS, módulos JS e as 2.094 palavras
ficam embutidos. O three.js também é embutido quando disponível, para os jogos
funcionarem offline; sem ele, o arquivo carrega o three.js do cdnjs.

Uso: python3 kotobana/tools/build_single.py [--three caminho/para/three.min.js]
"""
import argparse
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "kotobana-dojo.html"
THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
# Ordem de dependência: cada módulo só usa nomes definidos antes dele.
MODULES = ["core", "three-util", "learn", "study", "quiz", "game-lanterns", "game-karuta", "play", "progress", "app"]


def strip_module(src):
    src = re.sub(r'^import\s*\{[^}]*\}\s*from\s*"[^"]+";\s*$', "", src, flags=re.M)
    return re.sub(r"^export\s+", "", src, flags=re.M)


def load_three(path):
    if path:
        return Path(path).read_text(encoding="utf-8")
    try:
        with urllib.request.urlopen(THREE_URL, timeout=20) as r:
            return r.read().decode("utf-8")
    except OSError as e:
        print(f"aviso: three.js não embutido ({e}); o arquivo usará o cdnjs")
        return None


def inline_script(code):
    return "<script>\n" + code.replace("</script", "<\\/script") + "\n</script>"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--three", help="three.min.js (r128) local, para embutir")
    args = ap.parse_args()

    html = (SITE / "index.html").read_text(encoding="utf-8")
    css = (SITE / "css" / "style.css").read_text(encoding="utf-8")
    vocab = (SITE / "js" / "vocab.js").read_text(encoding="utf-8")
    app = "\n".join(f"// ===== {m}.js =====\n" + strip_module((SITE / "js" / f"{m}.js").read_text(encoding="utf-8"))
                    for m in MODULES)
    three = load_three(args.three)

    html = html.replace('<link rel="stylesheet" href="css/style.css">', "<style>\n" + css + "\n</style>")
    html = html.replace('<script src="js/vocab.js"></script>', inline_script(vocab))
    if three:
        html = re.sub(r'<script src="https://cdnjs[^"]*three[^"]*"></script>', lambda _: inline_script(three), html)
    html = html.replace('<script type="module" src="js/app.js"></script>',
                        inline_script('"use strict";\n(() => {\n' + app + "\n})();"))
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT.parent)}: {OUT.stat().st_size / 1024:.0f} KB, three.js {'embutido' if three else 'via cdnjs'}")


if __name__ == "__main__":
    main()
