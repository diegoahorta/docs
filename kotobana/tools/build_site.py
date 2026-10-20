"""Gera os dados do site Kotobana Dojo (site/js/vocab.js) a partir de dados/vocabulario.json.

Uso: python3 kotobana/tools/build.py && python3 kotobana/tools/build_site.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COLS = ["id", "no", "palavra", "leitura", "romaji", "pt", "importancia", "classe", "livro", "licao",
        "acento", "acento_fonte", "nota"]


def main():
    entries = json.loads((ROOT / "dados" / "vocabulario.json").read_text(encoding="utf-8"))
    rows = [[e[c] for c in COLS] for e in entries]
    out = ROOT / "site" / "js" / "vocab.js"
    out.write_text(
        "// Gerado por tools/build_site.py a partir do glossário Kotobana 1-6. Não editar à mão.\n"
        "// Colunas: " + ", ".join(COLS) + "\n"
        "window.KOTOBANA_DATA = " + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8")
    print(f"{out.relative_to(ROOT)}: {len(rows)} palavras, {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
