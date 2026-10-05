"""Bundles each game into one self-contained file (CSS, JS, Three.js, the
Blender map and the images are all inlined):
  index.html   -> pongo-english.html  (inglês)
  coreano.html -> pongo-coreano.html  (coreano / hangul)"""
import base64, os, re

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def rd(p):
    return open(os.path.join(root, p), encoding="utf-8").read()


def data_uri(p, mime):
    return f"data:{mime};base64," + base64.b64encode(open(os.path.join(root, p), "rb").read()).decode()


def inline(m):
    code = rd(m.group(1)).replace("</script", "<\\/script")
    return f"<script>\n{code}\n</script>"


def build(src, dst):
    html = rd(src)
    imgs = {"assets/pongo.webp": data_uri("assets/pongo.webp", "image/webp"),
            "assets/odu-creative-logo.png": data_uri("assets/odu-creative-logo.png", "image/png")}
    for path, uri in imgs.items():
        html = html.replace(f'src="{path}"', f'src="{uri}"')
    html = html.replace('<link rel="stylesheet" href="css/style.css">', "<style>\n" + rd("css/style.css") + "\n</style>")
    # scripts are at the end of <body>, so plain inline scripts keep the same order as defer
    html = re.sub(r'<script defer src="([^"]+)"></script>', inline, html)
    out = os.path.join(root, dst)
    open(out, "w", encoding="utf-8").write(html)
    print(dst + ":", os.path.getsize(out) // 1024, "KB")


build("index.html", "pongo-english.html")
build("coreano.html", "pongo-coreano.html")
