"""Monta o jogo em um único HTML com as imagens do Pongo embutidas.

Uso: python3 tools/build.py            (a partir da pasta pongo-coreano)
Gera:
  index.html          documento completo, abre direto no navegador
  dist/fragment.html  mesmo conteúdo sem <html>/<head>/<body> (para publicar como Artifact)
"""
import base64
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets = {}
for name in sorted(os.listdir(os.path.join(ROOT, "assets"))):
    path = os.path.join(ROOT, "assets", name)
    mime = "image/png" if name.endswith(".png") else "image/jpeg"
    with open(path, "rb") as f:
        assets[name.rsplit(".", 1)[0]] = f"data:{mime};base64," + base64.b64encode(f.read()).decode()

with open(os.path.join(ROOT, "src", "game.html"), encoding="utf8") as f:
    body = f.read()
body = body.replace("/*__ASSETS__*/{}", json.dumps(assets))

os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
with open(os.path.join(ROOT, "dist", "fragment.html"), "w", encoding="utf8") as f:
    f.write(body)

page = (
    "<!doctype html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
    "</head>\n<body>\n" + body + "\n</body>\n</html>\n"
)
with open(os.path.join(ROOT, "index.html"), "w", encoding="utf8") as f:
    f.write(page)
print("ok", len(page) // 1024, "KB")
