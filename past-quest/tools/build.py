#!/usr/bin/env python3
"""Build do Pongo Past Quest.

1. Valida data/lessons.json (respostas existem nas opções, frases montáveis, níveis 1-3...).
2. Dá um id estável a cada exercício e gera web/js/data.js.
3. Exporta build/verbs.tsv para o validador em Java (regras do -ed).
4. Empacota tudo num HTML único: dist/pongo-past-quest.html (abre offline com duplo clique)
   e dist/pongo-past-quest.fragment.html (sem <html>/<head>, para hospedar como artifact).

Uso:
    python3 tools/build.py            # valida + gera
    python3 tools/build.py --java     # também compila e roda java/PastSimpleRules.java
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "lessons.json"
WEB = ROOT / "web"
BUILD = ROOT / "build"
DIST = ROOT / "dist"

TYPES = {"choice", "chat", "type", "build", "match", "listen", "dict", "sound", "fix", "shadow"}
SOUNDS = {"/t/", "/d/", "/ɪd/"}


def norm(s: str) -> str:
    s = s.lower().replace("’", "'")
    s = re.sub(r"\b(was|were|did|do|does|is|are|has|have)n't\b", r"\1 not", s)
    s = re.sub(r"[.,!?;:\"()]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def validate(data: dict) -> list[str]:
    errors: list[str] = []
    seen_units = set()
    for u in data["units"]:
        uid = u["id"]
        if uid in seen_units:
            errors.append(f"{uid}: id de unidade repetido")
        seen_units.add(uid)
        for key in ("title", "subtitle", "color", "guide", "items"):
            if key not in u:
                errors.append(f"{uid}: falta '{key}'")
        levels = {it.get("lvl") for it in u["items"]}
        if not u.get("checkpoint") and not {1, 2, 3} <= levels:
            errors.append(f"{uid}: precisa de exercícios nos níveis 1, 2 e 3 (tem {sorted(levels)})")
        for i, it in enumerate(u["items"]):
            where = f"{uid}#{i} ({it.get('t')})"
            t = it.get("t")
            if t not in TYPES:
                errors.append(f"{where}: tipo desconhecido")
                continue
            if it.get("lvl") not in (1, 2, 3):
                errors.append(f"{where}: lvl deve ser 1, 2 ou 3")
            if t in ("choice", "chat"):
                if it["a"] not in it["o"]:
                    errors.append(f"{where}: resposta '{it['a']}' não está nas opções")
                if len(set(it["o"])) != len(it["o"]):
                    errors.append(f"{where}: opções repetidas")
            if t == "chat" and "___" not in it["lines"][-1][1]:
                errors.append(f"{where}: a última fala precisa ter ___")
            if t == "choice" and "___" in it["q"] and " / " in it["a"]:
                if it["q"].count("___") != len(it["a"].split(" / ")):
                    errors.append(f"{where}: número de lacunas não bate com a resposta")
            if t == "type":
                if "___" not in it["q"] or not it.get("a"):
                    errors.append(f"{where}: precisa de ___ e de respostas aceitas")
            if t == "build":
                tiles = re.sub(r"[?.!]", "", it["a"]).split(" ") + it.get("x", [])
                if norm(" ".join(re.sub(r"[?.!]", "", it["a"]).split(" "))) != norm(it["a"]):
                    errors.append(f"{where}: frase não é montável com os blocos")
                if any(x in re.sub(r"[?.!]", "", it["a"]).split(" ") for x in it.get("x", [])):
                    errors.append(f"{where}: distrator também está na resposta")
                if len(tiles) > 12:
                    errors.append(f"{where}: blocos demais para a tela do celular")
            if t == "match":
                left = [p[0] for p in it["pairs"]]
                right = [p[1] for p in it["pairs"]]
                if len(set(left)) != len(left) or len(set(right)) != len(right):
                    errors.append(f"{where}: pares ambíguos (valores repetidos numa coluna)")
            if t == "listen" and len(set(it["o"])) != len(it["o"]):
                errors.append(f"{where}: opções repetidas")
            if t == "listen" and it["o"][0] != it["say"]:
                errors.append(f"{where}: a primeira opção deve ser a frase falada")
            if t == "sound" and it["a"] not in SOUNDS:
                errors.append(f"{where}: som deve ser /t/, /d/ ou /ɪd/")
            if t == "fix":
                words = it["s"].split(" ")
                if not 0 <= it["bad"] < len(words):
                    errors.append(f"{where}: índice 'bad' fora da frase")
                elif norm(it["s"]) == norm(it["fixed"]):
                    errors.append(f"{where}: frase corrigida igual à errada")
    bases = [v["base"] for v in data["verbs"]]
    if len(set(bases)) != len(bases):
        errors.append("verbs: verbo repetido")
    for v in data["verbs"]:
        if v["kind"] == "regular" and v.get("sound") not in SOUNDS:
            errors.append(f"verbs/{v['base']}: regular precisa de 'sound'")
    return errors


def assign_ids(data: dict) -> int:
    n = 0
    for u in data["units"]:
        for i, it in enumerate(u["items"]):
            it["id"] = f"{u['id']}-{i}"
            n += 1
    return n


def write_data_js(data: dict) -> Path:
    out = WEB / "js" / "data.js"
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    out.write_text(
        "/* Gerado por tools/build.py a partir de data/lessons.json. Não edite à mão. */\n"
        f"window.PQ_DATA = {payload};\n",
        encoding="utf-8",
    )
    return out


def write_verbs_tsv(data: dict) -> Path:
    BUILD.mkdir(exist_ok=True)
    out = BUILD / "verbs.tsv"
    lines = ["base\tpast\tkind\tsound\tpt"]
    for v in data["verbs"]:
        lines.append("\t".join([v["base"], v["past"], v["kind"], v.get("sound", ""), v["pt"]]))
    # os verbos usados nos exercícios de som também entram (base inferida tirando o -ed)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out


def bundle() -> tuple[Path, Path]:
    html = (WEB / "index.html").read_text(encoding="utf-8")

    def inline_css(m: re.Match) -> str:
        css = (WEB / m.group(1)).read_text(encoding="utf-8")
        return "<style>\n" + css + "\n</style>"

    def inline_js(m: re.Match) -> str:
        js = (WEB / m.group(1)).read_text(encoding="utf-8").replace("</script", "<\\/script")
        return "<script>\n" + js + "\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, html)
    html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_js, html)
    DIST.mkdir(exist_ok=True)
    full = DIST / "pongo-past-quest.html"
    full.write_text(html, encoding="utf-8")

    # fragmento: só o conteúdo de <head> (title/meta/style) + <body>
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    head = re.sub(r'<meta charset="utf-8">\s*', "", head)
    head = re.sub(r'<meta name="viewport"[^>]*>\s*', "", head)
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    frag = DIST / "pongo-past-quest.fragment.html"
    frag.write_text(head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")
    return full, frag


def run_java(tsv: Path) -> int:
    javac = shutil.which("javac")
    java = shutil.which("java")
    if not javac or not java:
        print("! Java não encontrado: pulei a validação das regras do -ed.")
        return 0
    out = BUILD / "classes"
    out.mkdir(parents=True, exist_ok=True)
    subprocess.run([javac, "-d", str(out), str(ROOT / "java" / "PastSimpleRules.java")], check=True)
    return subprocess.run([java, "-cp", str(out), "PastSimpleRules", "validate", str(tsv)]).returncode


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--java", action="store_true", help="compila e roda o validador Java")
    args = ap.parse_args()

    data = json.loads(DATA.read_text(encoding="utf-8"))
    errors = validate(data)
    if errors:
        print("Conteúdo com problemas:")
        for e in errors:
            print("  -", e)
        return 1
    n = assign_ids(data)
    js = write_data_js(data)
    tsv = write_verbs_tsv(data)
    full, frag = bundle()
    counts: dict[str, int] = {}
    for u in data["units"]:
        for it in u["items"]:
            counts[it["t"]] = counts.get(it["t"], 0) + 1
    print(f"✓ {len(data['units'])} unidades, {n} exercícios, {len(data['verbs'])} verbos")
    print("  tipos:", ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    for p in (js, tsv, full, frag):
        print(f"  → {p.relative_to(ROOT)} ({p.stat().st_size // 1024} KB)")
    if args.java:
        return run_java(tsv)
    return 0


if __name__ == "__main__":
    sys.exit(main())
