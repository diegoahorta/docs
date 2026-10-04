"""Monta o jogo: injeta os assets gerados no Blender (base64) em src/jogo.html.

    python3 build.py            -> index.html (documento completo; usa vendor/three.min.js, funciona offline exceto as fontes)
    python3 build.py --standalone OUT.html  -> arquivo HTML único (Three.js e assets embutidos)
    python3 build.py --fragment  OUT.html  -> versão sem <html>/<head> (para publicar como Artifact)
"""
import base64, json, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(AQUI, "assets")
assets = {}
for nome in sorted(os.listdir(A)):
    base, ext = os.path.splitext(nome)
    with open(os.path.join(A, nome), "rb") as f:
        assets[f"{base}_{ext[1:]}"] = base64.b64encode(f.read()).decode()
for k in ("no_ativo_png", "no_feito_png", "no_bloqueado_png"):
    assets[k.rsplit("_", 1)[0]] = assets.pop(k)

src = open(os.path.join(AQUI, "src", "jogo.html"), encoding="utf-8").read()
src = src.replace("__ASSETS__", json.dumps(assets))
head, body = src.split("<!--HEAD-END-->", 1)

if len(sys.argv) > 2 and sys.argv[1] == "--standalone":
    # arquivo único: Three.js embutido, nenhuma pasta extra necessária
    for url, local in (("https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js", "three.min.js"),
                       ("https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js", "GLTFLoader.js")):
        code = open(os.path.join(AQUI, "vendor", local), encoding="utf-8").read().replace("</script", "<\\/script")
        body = body.replace(f'<script src="{url}"></script>', f"<script>{code}</script>")
    doc = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
           f'{head}</head>\n<body>{body}</body>\n</html>\n')
    open(sys.argv[2], "w", encoding="utf-8").write(doc)
elif len(sys.argv) > 2 and sys.argv[1] == "--fragment":
    open(sys.argv[2], "w", encoding="utf-8").write(head + body)
else:
    # versão do repositório: Three.js local (pasta vendor/) para funcionar sem internet
    body = body.replace("https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js", "vendor/three.min.js")
    body = body.replace("https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js", "vendor/GLTFLoader.js")
    doc = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
           f'{head}</head>\n<body>{body}</body>\n</html>\n')
    open(os.path.join(AQUI, "index.html"), "w", encoding="utf-8").write(doc)
print("ok")
