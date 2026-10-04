"""
Monta o jogo num único arquivo HTML.

    python3 build.py                 -> index.html (documento completo, abre direto no navegador)
    python3 build.py --artifact X    -> X sem <html>/<head>/<body> (formato de Artifact do Claude)

Os modelos .glb gerados pelo Blender (blender/generate_models.py) são embutidos em base64.
"""
import base64, json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
read = lambda *p: open(os.path.join(ROOT, *p), encoding="utf-8").read()

models = {}
for f in sorted(os.listdir(os.path.join(ROOT, "models"))):
    if f.endswith(".glb"):
        models[f[:-4]] = base64.b64encode(open(os.path.join(ROOT, "models", f), "rb").read()).decode()

THREE = "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"
GLTF = "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js"

page = f"""<title>Batalha dos Reinos</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap">
<style>
{read("src", "style.css")}
</style>
{read("src", "body.html")}
<script src="{THREE}"></script>
<script src="{GLTF}"></script>
<script>window.MODELS = {json.dumps(models)};</script>
<script>
{read("src", "data.js")}
</script>
<script>
{read("src", "audio.js")}
</script>
<script>
{read("src", "world.js")}
</script>
<script>
{read("src", "game.js")}
</script>
"""

if len(sys.argv) > 2 and sys.argv[1] == "--artifact":
    out, html = sys.argv[2], page
else:
    out = os.path.join(ROOT, "index.html")
    html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + page.replace("</style>\n", "</style>\n</head>\n<body>\n", 1) + "</body>\n</html>\n")
open(out, "w", encoding="utf-8").write(html)
print("ok:", out, f"{len(html) / 1024:.0f} KB")
