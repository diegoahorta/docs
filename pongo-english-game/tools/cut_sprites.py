"""Recorta os sprites do Pongo (caminhada, pulo e expressões) em quadros
individuais para o mapa 2D e para as reações nas lições.

uso: python3 tools/cut_sprites.py walk.webp jump.webp expressoes.webp
Saída: assets/sprites/walk.webp, jump.webp (tiras horizontais com quadros de
mesmo tamanho) e assets/sprites/faces/<expressao>.webp."""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "assets", "sprites")
os.makedirs(os.path.join(OUT, "faces"), exist_ok=True)


def frames(path, keep_height):
    """Separa os quadros pelos componentes conectados do alfa."""
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    m = a[:, :, 3] > 20
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    objs = ndimage.find_objects(lab)
    big = sorted([i for i in range(n) if sizes[i] > 3000], key=lambda i: objs[i][1].start)
    # pedaços pequenos (pelos soltos, brilhos) vão para o quadro mais próximo
    owner = {}
    for i in range(n):
        if i in big:
            owner[i + 1] = i + 1
            continue
        cy = (objs[i][0].start + objs[i][0].stop) / 2
        cx = (objs[i][1].start + objs[i][1].stop) / 2
        best = min(big, key=lambda b: (cx - (objs[b][1].start + objs[b][1].stop) / 2) ** 2
                   + (cy - (objs[b][0].start + objs[b][0].stop) / 2) ** 2)
        owner[i + 1] = best + 1
    mapped = np.vectorize(lambda v: owner.get(v, 0))(lab)
    out = []
    for b in big:
        ys, xs = np.where(mapped == b + 1)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        crop = a[y0:y1, x0:x1].copy()
        crop[mapped[y0:y1, x0:x1] != b + 1] = 0
        out.append((Image.fromarray(crop), y0, y1))
    W = max(f.width for f, _, _ in out) + 8
    if keep_height:  # pulo: mantém a altura de cada quadro (o arco do salto)
        top = min(y0 for _, y0, _ in out)
        bottom = max(y1 for _, _, y1 in out)
        H = bottom - top
        cells = []
        for f, y0, y1 in out:
            c = Image.new("RGBA", (W, H))
            c.paste(f, ((W - f.width) // 2, y0 - top))
            cells.append(c)
    else:  # caminhada: patas apoiadas na mesma linha de base
        H = max(f.height for f, _, _ in out) + 4
        cells = []
        for f, _, _ in out:
            c = Image.new("RGBA", (W, H))
            c.paste(f, ((W - f.width) // 2, H - f.height))
            cells.append(c)
    return cells


def strip(cells, name, s):
    """s = escala comum, para o Pongo ter o mesmo tamanho andando e pulando."""
    w, h = round(cells[0].width * s), round(cells[0].height * s)
    cells = [c.resize((w, h), Image.LANCZOS) for c in cells]
    st = Image.new("RGBA", (w * len(cells), h))
    for i, c in enumerate(cells):
        st.paste(c, (i * w, 0))
    st.save(os.path.join(OUT, name + ".webp"), quality=88, method=6)
    return dict(w=w, h=h, n=len(cells))


FACES = {  # painel (x0, y0, x1, y1) sem a faixa com o nome
    "feliz": (226, 10, 372, 150), "piscando": (376, 14, 504, 150), "empolgado": (508, 12, 640, 150),
    "curioso": (192, 180, 303, 290), "surpreso": (304, 180, 417, 290), "sonolento": (418, 180, 532, 290),
    "carinhoso": (536, 180, 640, 290), "brincalhao": (12, 318, 198, 425), "atento": (192, 319, 302, 428),
    "bravo": (306, 318, 418, 428), "assustado": (422, 319, 534, 428), "pensativo": (536, 319, 640, 428),
    "triste": (11, 455, 185, 555), "com_osso": (188, 454, 318, 555), "barriga": (322, 454, 517, 555),
    "tchau": (517, 451, 640, 555),
}


def faces(path):
    im = Image.open(path).convert("RGB")
    for name, (x0, y0, x1, y1) in FACES.items():
        c = im.crop((x0, y0, x1, y1))
        side = max(c.width, c.height)  # quadrado, centralizado, fundo com a cor do painel
        sq = Image.new("RGB", (side, side), c.getpixel((3, 3)))
        sq.paste(c, ((side - c.width) // 2, (side - c.height) // 2))
        sq.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, "faces", name + ".webp"), quality=86)


walk, jump = frames(sys.argv[1], False), frames(sys.argv[2], True)
scale = 200 / walk[0].height
meta = {"walk": strip(walk, "walk", scale), "jump": strip(jump, "jump", scale)}
faces(sys.argv[3])
meta["faces"] = list(FACES)
json.dump(meta, open(os.path.join(OUT, "sprites.json"), "w"), indent=1)
print(meta)
