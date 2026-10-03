"""
Empacota pongo-game/models/*.glb em pongo-game/models/models-data.js
(data URIs base64) para o jogo abrir direto do disco (file://) sem servidor.

Uso: python3 pongo-game/blender/embed_models.py
"""

import base64
import glob
import json
import os

MODELS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")

data = {}
for path in sorted(glob.glob(os.path.join(MODELS, "*.glb"))):
    name = os.path.splitext(os.path.basename(path))[0]
    with open(path, "rb") as f:
        data[name] = "data:model/gltf-binary;base64," + base64.b64encode(f.read()).decode("ascii")

out = os.path.join(MODELS, "models-data.js")
with open(out, "w") as f:
    f.write("// Gerado por blender/embed_models.py — não edite à mão.\n")
    f.write("window.PONGO_MODELS = " + json.dumps(data, indent=0) + ";\n")
print("wrote", os.path.abspath(out), os.path.getsize(out), "bytes,", len(data), "models")
