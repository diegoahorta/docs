"""Gera os dados codificados do glossário Kotobana (livros 1-6).

Uso: python3 kotobana/tools/build.py
Entrada: kotobana/fonte/Kotobana_glossario_1-6_20240108.xlsx
Saídas: kotobana/dados/*.json|csv|tsv e kotobana/MAPA.md
"""
import collections
import csv
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fonte" / "Kotobana_glossario_1-6_20240108.xlsx"
OUT = ROOT / "dados"

# Lições de cada livro (inferido do próprio glossário)
BOOK_LESSONS = {1: (1, 15), 2: (16, 24), 3: (25, 33), 4: (34, 42), 5: (43, 51), 6: (52, 60)}

POS = {
    "N": ("SUB", "substantivo"),
    "V [1]": ("V1", "verbo grupo 1 (godan / u-verbo)"),
    "V [2]": ("V2", "verbo grupo 2 (ichidan / ru-verbo)"),
    "V [3]": ("V3", "verbo grupo 3 (irregular: する / くる)"),
    "イA": ("ADJ-I", "adjetivo-i (イ形容詞)"),
    "ナA": ("ADJ-NA", "adjetivo-na (ナ形容詞)"),
    "Adv": ("ADV", "advérbio"),
    "Conj": ("CONJ", "conjunção"),
    "Exp": ("EXP", "expressão"),
}
LANGS = {"en": "inglês", "it": "italiano", "al": "alemão", "fr": "francês", "pt": "português",
         "es": "espanhol", "ho": "holandês", "ru": "russo", "ko": "coreano", "zh": "chinês"}

SMALL = set("ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ")


def morae(kana):
    return sum(1 for c in kana if ("\u3040" <= c <= "\u30ff") and c not in SMALL and c != "・")


def accent_of_word(w):
    """Notação ↓/→ -> número de acento (0 = heiban)."""
    w = w.strip("～…。、 ")
    if not w:
        return None
    if "↓" in w:
        before = w.split("↓")[0]
        n = morae(before)
        total = morae(w.replace("↓", "").replace("→", ""))
        kind = "atamadaka" if n == 1 else ("odaka" if n == total else "nakadaka")
        return {"n": n, "tipo": kind}
    if "→" in w:
        return {"n": 0, "tipo": "heiban"}
    return None


def parse_accent(raw):
    if not raw:
        return []
    variants = []
    for v in re.split(r"\s*[/／]\s*", str(raw)):
        words = [x for x in re.split(r"[ \u3000]+", v.replace("（", "").replace("）", "")) if x]
        variants.append({"forma": v.strip(), "palavras": [accent_of_word(w) for w in words]})
    return variants


def accent_code(variants):
    out = []
    for v in variants:
        # palavras sem marcação (partículas, ～) não entram no código
        nums = [str(a["n"]) for a in v["palavras"] if a is not None]
        out.append("-".join(nums) or "?")
    return " / ".join(f"[{x}]" for x in out)


def as_int(x):
    try:
        return int(str(x).strip())
    except (TypeError, ValueError):
        return None


def script_of(word):
    s = set()
    for c in word:
        if "\u3040" <= c <= "\u309f":
            s.add("hiragana")
        elif "\u30a0" <= c <= "\u30ff" and c != "ー":
            s.add("katakana")
        elif "\u4e00" <= c <= "\u9fff" or c == "々":
            s.add("kanji")
        elif c.isascii() and c.isalnum():
            s.add("latino")
    return sorted(s)


def loan_origin(romaji):
    m = re.search(r"\(([^()]*(?:\[[^\]]*\][^()]*)*)\)\s*$", romaji or "")
    if not m or romaji.startswith("("):
        return None
    inner = m.group(1).strip()
    lm = re.match(r"([a-z]{2}):\s*(.+)", inner)
    if lm:
        return {"lingua": LANGS.get(lm.group(1), lm.group(1)), "original": lm.group(2)}
    return {"lingua": "inglês", "original": inner}


def build():
    ws = openpyxl.load_workbook(SRC).active
    entries, issues = [], []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r[0] is None:
            continue
        no, imp, word, yomi, acc, romaji, pt, pos, book, lesson, note = r
        book, lesson = as_int(book), as_int(lesson)
        flags = []
        if book is None and lesson is not None:
            book = next((b for b, (a, z) in BOOK_LESSONS.items() if a <= lesson <= z), None)
            flags.append("livro inferido pela lição")
        if book is None or lesson is None:
            flags.append("livro/lição ausente na fonte")
        if imp is None:
            flags.append("importância ausente na fonte")
        word = str(word).strip()
        if pos in POS:
            pos_code, pos_name = POS[pos]
        elif word.startswith("～"):
            pos_code, pos_name = "AFX", "afixo / sufixo (～)"
        else:
            pos_code, pos_name = "NC", "não classificado"
        variants = parse_accent(acc)
        origin = loan_origin(romaji)
        e = {
            "id": f"KB{book or 0}-L{lesson or 0:02d}-{no:04d}",
            "no": no,
            "palavra": word,
            "leitura": str(yomi).strip() if yomi else word,
            "romaji": (romaji or "").strip(),
            "pt": (pt or "").strip(),
            "importancia": imp.count("★") if imp else None,
            "classe": pos_code,
            "classe_nome": pos_name,
            "classe_fonte": pos,
            "livro": book,
            "licao": lesson,
            "acento_fonte": acc,
            "acento": accent_code(variants),
            "acento_detalhe": variants,
            "escrita": script_of(word),
            "estrangeirismo": origin,
            "nota": note,
            "avisos": flags,
        }
        entries.append(e)
        if flags:
            issues.append((e["id"], word, flags))
    return entries, issues


def write(entries, issues):
    OUT.mkdir(exist_ok=True)
    (OUT / "vocabulario.json").write_text(json.dumps(entries, ensure_ascii=False, indent=1), encoding="utf-8")

    flat = ["id", "no", "palavra", "leitura", "romaji", "pt", "importancia", "classe", "classe_nome",
            "livro", "licao", "acento", "acento_fonte", "nota"]
    with open(OUT / "vocabulario.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(flat)
        for e in entries:
            w.writerow([e[k] for k in flat])

    # Anki: frente / verso / tags (Arquivo > Importar, separado por tabulação, HTML ativado)
    with open(OUT / "anki_kotobana.tsv", "w", encoding="utf-8") as f:
        f.write("#separator:tab\n#html:true\n#tags column:3\n")
        for e in entries:
            front = e["palavra"] if e["palavra"] == e["leitura"] else f"{e['palavra']}<br><small>{e['leitura']}</small>"
            back = f"{e['pt']}<br><small>{e['romaji']} · {e['classe_nome']} · acento {e['acento']}</small>"
            tags = f"kotobana livro{e['livro'] or 0} licao{e['licao'] or 0:02d} imp{e['importancia'] or 0} {e['classe']}"
            f.write(f"{front}\t{back}\t{tags}\n".replace("\n\t", "\t"))

    stats = {
        "total": len(entries),
        "por_livro": dict(sorted(collections.Counter(e["livro"] or 0 for e in entries).items())),
        "por_licao": {f"{k[0]}-{k[1]:02d}": v for k, v in sorted(collections.Counter(
            (e["livro"] or 0, e["licao"] or 0) for e in entries).items())},
        "por_importancia": {str(k): v for k, v in sorted(collections.Counter(
            e["importancia"] or 0 for e in entries).items())},
        "por_classe": dict(collections.Counter(e["classe"] for e in entries).most_common()),
        "por_tipo_acento": dict(collections.Counter(
            (v["palavras"][0] or {}).get("tipo", "sem marcação") for e in entries
            for v in e["acento_detalhe"][:1]).most_common()),
        "estrangeirismos": sum(1 for e in entries if e["estrangeirismo"]),
        "linguas_origem": dict(collections.Counter(
            e["estrangeirismo"]["lingua"] for e in entries if e["estrangeirismo"]).most_common()),
        "com_kanji": sum(1 for e in entries if "kanji" in e["escrita"]),
        "so_katakana": sum(1 for e in entries if e["escrita"] == ["katakana"]),
        "so_hiragana": sum(1 for e in entries if e["escrita"] == ["hiragana"]),
        "homografos": {w: n for w, n in collections.Counter(e["palavra"] for e in entries).items() if n > 1},
        "avisos": [{"id": i, "palavra": w, "avisos": f} for i, w, f in issues],
    }
    (OUT / "estatisticas.json").write_text(json.dumps(stats, ensure_ascii=False, indent=1), encoding="utf-8")
    return stats


def write_map(entries):
    lines = ["# Mapa do vocabulário Kotobana (livros 1–6)", "",
             "Gerado por `tools/build.py`. Ordem: livro → lição → importância (★★★ primeiro) → leitura.",
             "Colunas: código · palavra · leitura · acento · classe · português.", ""]
    by_book = collections.defaultdict(lambda: collections.defaultdict(list))
    for e in entries:
        by_book[e["livro"] or 0][e["licao"] or 0].append(e)
    lines.append("## Índice")
    for b in sorted(by_book):
        n = sum(len(v) for v in by_book[b].values())
        title = f"Livro {b}" if b else "Sem livro/lição"
        lines.append(f"- [{title}](#{'livro-' + str(b) if b else 'sem-livro-licao'}) — {n} palavras, "
                     + ", ".join(f"[L{l}](#licao-{l})" for l in sorted(by_book[b]) if l))
    for b in sorted(by_book):
        lines += ["", f"## {'Livro ' + str(b) if b else 'Sem livro/lição'}"]
        for l in sorted(by_book[b]):
            items = sorted(by_book[b][l], key=lambda e: (-(e["importancia"] or 0), e["leitura"]))
            lines += ["", f"### Lição {l}" if l else "### Lição desconhecida", "",
                      f"{len(items)} palavras.", "",
                      "| código | ★ | palavra | leitura | acento | classe | português |",
                      "|---|---|---|---|---|---|---|"]
            for e in items:
                cells = [e["id"], "★" * (e["importancia"] or 0), e["palavra"], e["leitura"], e["acento"],
                         e["classe"], e["pt"]]
                lines.append("| " + " | ".join(str(c).replace("|", "\\|").replace("\n", " ") for c in cells) + " |")
    (ROOT / "MAPA.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_app(entries):
    """App de estudo (flashcards com repetição espaçada) com os dados embutidos."""
    cols = ["id", "no", "palavra", "leitura", "romaji", "pt", "importancia", "classe", "livro", "licao",
            "acento", "acento_fonte", "nota"]
    rows = [[e[c] for c in cols] for e in entries]
    classes = {code: name for code, name in [*POS.values(), ("AFX", "afixo (～)"), ("NC", "não classificado")]}
    classes = {k: v.split(" (")[0] if k not in ("AFX",) else v for k, v in classes.items()}
    html = (ROOT / "tools" / "app_template.html").read_text(encoding="utf-8")
    html = html.replace("__DATA__", json.dumps(rows, ensure_ascii=False, separators=(",", ":")))
    html = html.replace("__CLASSES__", json.dumps(classes, ensure_ascii=False))
    (ROOT / "estudo.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    entries, issues = build()
    stats = write(entries, issues)
    write_map(entries)
    write_app(entries)
    print(json.dumps({k: v for k, v in stats.items() if k not in ("por_licao", "avisos", "homografos")},
                     ensure_ascii=False, indent=1))
    print("avisos:", len(stats["avisos"]), "homógrafos:", len(stats["homografos"]))
