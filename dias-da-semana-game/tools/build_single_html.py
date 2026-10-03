"""
Gera UM arquivo HTML autossuficiente do jogo (funciona offline, até com duplo clique):
three.js, os módulos do jogo e os modelos 3D (.glb) ficam embutidos como data: URIs.

Uso:
    npm i three@0.160.0            # uma vez (em qualquer pasta)
    python3 tools/build_single_html.py --three caminho/para/node_modules/three
Saída: a-semana-do-finn.html
"""
import argparse
import base64
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def data_js(src):
    return "data:text/javascript;base64," + base64.b64encode(src.encode("utf-8")).decode()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--three", default=os.path.join(ROOT, "node_modules", "three"))
    ap.add_argument("--out", default=os.path.join(ROOT, "a-semana-do-finn.html"))
    a = ap.parse_args()

    read = lambda p: open(p, encoding="utf-8").read()
    jsm = os.path.join(a.three, "examples", "jsm")
    imports = {
        "three": data_js(read(os.path.join(a.three, "build", "three.module.min.js"))),
        "three/addons/utils/BufferGeometryUtils.js": data_js(read(os.path.join(jsm, "utils", "BufferGeometryUtils.js"))),
        # caminho relativo não funciona dentro de data: URI -> troca por especificador do importmap
        "three/addons/loaders/GLTFLoader.js": data_js(read(os.path.join(jsm, "loaders", "GLTFLoader.js")).replace(
            "'../utils/BufferGeometryUtils.js'", "'three/addons/utils/BufferGeometryUtils.js'")),
    }
    for name in ("levels", "audio", "fx", "main"):
        src = read(os.path.join(ROOT, "js", f"{name}.js"))
        src = re.sub(r"from '\./(\w+)\.js'", r"from 'app/\1.js'", src)
        imports[f"app/{name}.js"] = data_js(src)

    models = {}
    for f in sorted(os.listdir(os.path.join(ROOT, "models"))):
        if f.endswith(".glb"):
            b = open(os.path.join(ROOT, "models", f), "rb").read()
            models[f[:-4]] = "data:model/gltf-binary;base64," + base64.b64encode(b).decode()

    html = read(os.path.join(ROOT, "index.html"))
    html = re.sub(r'<script type="importmap">.*?</script>',
                  lambda m: '<script type="importmap">' + json.dumps({"imports": imports}) + "</script>",
                  html, flags=re.S)
    html = html.replace(
        '<script type="module" src="js/main.js"></script>',
        "<script>window.MODEL_DATA = " + json.dumps(models) + ";</script>\n"
        '<script type="module">import "app/main.js";</script>')
    open(a.out, "w", encoding="utf-8").write(html)
    print(f"OK: {a.out} ({os.path.getsize(a.out) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
