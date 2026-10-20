#!/usr/bin/env python3
"""Empacota o jogo em um único arquivo HTML (CSS e JS embutidos).

Uso:
    python3 tools/build.py                 # gera dist/mika-no-hospital.html
    python3 tools/build.py --page flashcards.html   # gera dist/flashcards.html (só os flashcards)
    python3 tools/build.py --fragment      # sem <html>/<head>/<body> (para publicar como Artifact)
    python3 tools/build.py --serve         # abre um servidor local em http://localhost:8000

Só bibliotecas externas que ficam em CDN (Three.js e Google Fonts) continuam como links.
"""
import argparse
import functools
import http.server
import pathlib
import re
import socketserver

ROOT = pathlib.Path(__file__).resolve().parent.parent


def inline(html: str) -> str:
    def css(m):
        return "<style>\n" + (ROOT / m.group(1)).read_text(encoding="utf-8") + "\n</style>"

    def js(m):
        code = (ROOT / m.group(1)).read_text(encoding="utf-8")
        return "<script>\n" + code.replace("</script", "<\\/script") + "\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', css, html)
    html = re.sub(r'<script src="(js/[^"]+)"></script>', js, html)
    return html


def fragment(html: str) -> str:
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
    head = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', "", head)
    title = re.search(r"<title>.*?</title>", head).group(0)
    head = head.replace(title, "")
    return title + "\n" + head.strip() + "\n" + body.strip() + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--page", default="index.html", help="página de origem (index.html ou flashcards.html)")
    ap.add_argument("--fragment", action="store_true")
    ap.add_argument("--serve", action="store_true")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("-o", "--out")
    args = ap.parse_args()

    if args.serve:
        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
        with socketserver.TCPServer(("", args.port), handler) as httpd:
            print(f"Jogo em http://localhost:{args.port}  (Ctrl+C para parar)")
            httpd.serve_forever()
        return

    html = inline((ROOT / args.page).read_text(encoding="utf-8"))
    if args.fragment:
        html = fragment(html)
    stem = "mika-no-hospital" if args.page == "index.html" else pathlib.Path(args.page).stem
    name = f"{stem}-artifact.html" if args.fragment else f"{stem}.html"
    out = pathlib.Path(args.out) if args.out else ROOT / "dist" / name
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"{out}  ({len(html.encode()) // 1024} KB)")


if __name__ == "__main__":
    main()
