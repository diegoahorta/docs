"""Embute os sprites do Pongo (assets/sprites) em js/sprites-data.js, para a
versão 2D funcionar aberta direto do disco (file://) e em arquivo único."""
import base64, json, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sp = os.path.join(root, "assets", "sprites")
uri = lambda p: "data:image/webp;base64," + base64.b64encode(open(p, "rb").read()).decode()
meta = json.load(open(os.path.join(sp, "sprites.json")))
data = {"walk": uri(os.path.join(sp, "walk.webp")), "jump": uri(os.path.join(sp, "jump.webp")),
        "meta": {"walk": meta["walk"], "jump": meta["jump"]},
        "faces": {n: uri(os.path.join(sp, "faces", n + ".webp")) for n in meta["faces"]}}
out = os.path.join(root, "js", "sprites-data.js")
with open(out, "w") as f:
    f.write("// Gerado por tools/embed_sprites.py a partir de assets/sprites (sprites do Pongo).\n")
    f.write("window.PongoSprites = " + json.dumps(data) + ";\n")
print("sprites-data.js:", os.path.getsize(out) // 1024, "KB")
