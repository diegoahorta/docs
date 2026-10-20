#!/usr/bin/env python3
"""Extrai as tabelas de vocabulário (English | Português | Exemplo) das aulas .docx
e gera js/data.js para o jogo.

Uso:
    python3 tools/extract_vocab.py AULA_HOSPITAL.docx [VOCABULARIO_A1.docx] -o js/data.js

Só usa a biblioteca padrão (zipfile + xml), então não precisa instalar nada.
"""
import argparse
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
HEADERS_EN = {"english", "inglês", "ingles"}

# Seções da aula de hospital → id da categoria no jogo
HOSPITAL_SECTIONS = {
    "Sentimentos e Bem-Estar": ("feelings", "Sentimentos e Bem-Estar", "Feelings & Well-Being"),
    "Estado de Saúde": ("health", "Estado de Saúde", "State of Health"),
    "Sintomas Comuns": ("symptoms", "Sintomas Comuns", "Common Symptoms"),
    "Partes do Corpo": ("body", "Partes do Corpo", "Body Parts"),
    "No Hospital": ("hospital", "No Hospital", "At the Hospital"),
}
# Do vocabulário A1, aproveitamos o que conversa com o tema
A1_SECTIONS = {"1.9 Corpo Humano": "body", "1.1 Saudações": "phrases"}
A1_EXTRA_WORDS = {"how are you?", "hospital", "doctor", "nurse"}


def text_of(el):
    return "".join(t.text or "" for t in el.iter(W + "t")).strip()


def walk(path):
    """Gera ('p', texto) e ('tbl', linhas) na ordem do documento."""
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")
    for child in body:
        if child.tag == W + "p":
            t = text_of(child)
            if t:
                yield "p", t
        elif child.tag == W + "tbl":
            rows = []
            for tr in child.iter(W + "tr"):
                rows.append([text_of(tc) for tc in tr.findall(W + "tc")])
            yield "tbl", rows


def vocab_tables(path):
    """Devolve [(título_da_seção, [(en, pt, exemplo), ...])]."""
    recent = []  # parágrafos desde a última tabela (título + descrição)
    out = []
    for kind, val in walk(path):
        if kind == "p":
            recent.append(val)
            continue
        heading, recent = " | ".join(recent[-2:]), []
        rows = [r for r in val if any(r)]
        if not rows or len(rows[0]) != 3:
            continue
        if rows[0][0].strip().lower() not in HEADERS_EN:
            continue
        out.append((heading, [tuple(r) for r in rows[1:] if r[0]]))
    return out


def base_word(en):
    """'the doctor' → 'doctor', 'leg(s)' → 'leg', 'eye / eyes' → 'eye'."""
    w = re.split(r" /|\(", en)[0].strip().lower()
    return re.sub(r"^(the|a|an|to) ", "", w)


def entry(en, pt, ex, source):
    return {"en": en.strip(), "pt": pt.strip(), "ex": ex.strip(), "src": source}


def build(hospital_path, a1_path=None):
    cats = {}
    for heading, rows in vocab_tables(hospital_path):
        for key, (cid, pt_name, en_name) in HOSPITAL_SECTIONS.items():
            if key in heading:
                cat = cats.setdefault(cid, {"id": cid, "pt": pt_name, "en": en_name, "words": []})
                cat["words"] += [entry(*r, "aula-hospital") for r in rows]
    if a1_path:
        cats["phrases"] = {"id": "phrases", "pt": "Frases Úteis", "en": "Useful Phrases", "words": []}
        seen = {base_word(w["en"]) for c in cats.values() for w in c["words"]}
        for heading, rows in vocab_tables(a1_path):
            cid = next((v for k, v in A1_SECTIONS.items() if k in heading), None)
            for en, pt, ex in rows:
                base = base_word(en)
                if base in seen:
                    continue
                if cid:
                    cats[cid]["words"].append(entry(en, pt, ex, "vocabulario-a1"))
                    seen.add(base)
                elif en.strip().lower() in A1_EXTRA_WORDS and "hospital" in cats:
                    cats["hospital"]["words"].append(entry(en, pt, ex, "vocabulario-a1"))
                    seen.add(base)
    order = ["feelings", "health", "symptoms", "body", "hospital", "phrases"]
    return [cats[c] for c in order if cats.get(c, {}).get("words")]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("hospital_docx")
    ap.add_argument("a1_docx", nargs="?")
    ap.add_argument("-o", "--out", default="js/data.js")
    args = ap.parse_args()
    cats = build(args.hospital_docx, args.a1_docx)
    if not cats:
        sys.exit("Nenhuma tabela de vocabulário encontrada.")
    js = ("// Gerado por tools/extract_vocab.py a partir das aulas .docx — não edite à mão.\n"
          "window.VOCAB = " + json.dumps(cats, ensure_ascii=False, indent=2) + ";\n")
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(js)
    total = sum(len(c["words"]) for c in cats)
    print(f"{args.out}: {len(cats)} categorias, {total} palavras")
    for c in cats:
        print(f"  {c['id']:<10} {len(c['words']):>3}  {c['pt']}")


if __name__ == "__main__":
    main()
