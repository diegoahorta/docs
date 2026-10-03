"""
Gera UM arquivo HTML autocontido do jogo (abre com dois cliques, sem servidor):
CSS, JavaScript, Three.js e os modelos 3D do Blender ficam todos embutidos.

Uso:
    python3 pongo-game/build_single_html.py
    # usa `npx esbuild`; ou aponte um binário: ESBUILD=/caminho/esbuild python3 ...

Saída: pongo-game/pongo-e-o-osso-perdido.html
"""

import json
import os
import re
import shutil
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "pongo-e-o-osso-perdido.html")


def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding="utf-8") as f:
        return f.read()


def bundle_js():
    """Junta game.js + módulos + Three.js num único script IIFE com esbuild."""
    esbuild = os.environ.get("ESBUILD")
    cmd = [esbuild] if esbuild else ["npx", "--yes", "esbuild@0.24.0"]
    with tempfile.TemporaryDirectory() as tmp:
        tsconfig = os.path.join(tmp, "tsconfig.json")
        with open(tsconfig, "w") as f:
            json.dump({"compilerOptions": {"baseUrl": ROOT, "paths": {
                "three": ["vendor/three/build/three.module.min.js"],
                "three/addons/*": ["vendor/three/examples/jsm/*"],
            }}}, f)
        out = os.path.join(tmp, "bundle.js")
        subprocess.run(cmd + [os.path.join(ROOT, "game.js"), "--bundle", "--format=iife", "--minify",
                              f"--tsconfig={tsconfig}", f"--outfile={out}", "--log-level=warning"], check=True)
        with open(out, encoding="utf-8") as f:
            return f.read()


def inline_script(code):
    # impede que "</script" dentro do código feche a tag antes da hora
    return code.replace("</script", "<\\/script")


def main():
    if not shutil.which("npx") and not os.environ.get("ESBUILD"):
        raise SystemExit("Precisa do Node (npx) ou da variável ESBUILD apontando para o binário do esbuild.")
    html = read("index.html")
    css = read("style.css")
    models = read("models", "models-data.js")
    js = bundle_js()

    html = html.replace('<link rel="stylesheet" href="style.css" />', f"<style>\n{css}\n</style>")
    html = re.sub(r'\s*<script type="importmap">.*?</script>', "", html, flags=re.S)
    html = html.replace('<script src="models/models-data.js"></script>', f"<script>\n{inline_script(models)}\n</script>")
    html = html.replace('<script type="module" src="game.js"></script>', f"<script>\n{inline_script(js)}\n</script>")

    for leftover in ('src="game.js"', 'href="style.css"', 'models-data.js"', "importmap"):
        assert leftover not in html, f"não foi embutido: {leftover}"

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print("gerado", OUT, f"{os.path.getsize(OUT) / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
