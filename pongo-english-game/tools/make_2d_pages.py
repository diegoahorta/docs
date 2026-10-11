"""Cria as páginas da versão 2D (cartoon) a partir das páginas 3D:
troca o mapa 3D (Three.js + GLB do Blender) pelo mapa 2D com os sprites do Pongo."""
import os, re
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
for src, dst in [("index.html", "index-2d.html"), ("coreano.html", "coreano-2d.html"), ("mandarim.html", "mandarim-2d.html")]:
    s = open(os.path.join(root, src), encoding="utf-8").read()
    for js in ["js/vendor/three.min.js", "js/vendor/GLTFLoader.js", "js/vendor/OrbitControls.js", "js/world-data.js"]:
        s = s.replace(f'<script defer src="{js}"></script>\n', "")
    s = s.replace('<script defer src="js/map3d.js"></script>',
                  '<script defer src="js/sprites-data.js"></script>\n<script defer src="js/map2d.js"></script>')
    s = s.replace('aria-label="Mapa 3D do jardim e da casa do Pongo"', 'aria-label="Mapa do jardim e da casa do Pongo"')
    s = s.replace("paradas no jardim 3D", "paradas no jardim").replace("Construindo o jardim 3D…", "Desenhando o jardim…")
    s = re.sub(r"<title>([^<]+)</title>", r"<title>\1 2D</title>", s)
    assert "map2d.js" in s and "three" not in s and "3D" not in s.split("<body>")[1].split("<script")[0].replace("Mapa", "")
    open(os.path.join(root, dst), "w", encoding="utf-8").write(s)
    print(dst)
