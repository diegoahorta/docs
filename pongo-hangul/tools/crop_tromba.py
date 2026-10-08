"""Recorta a folha "Pongo & Senhor Tromba" em expressões e recortes sem fundo.
Uso: python3 crop_tromba.py <folha_tromba.png> <pasta_saida>"""
import os
import sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from crop_pongo import cutout, keep_largest  # noqa: E402  (reaproveita o recorte por preenchimento)

sheet = Image.open(sys.argv[1]).convert("RGB")
out = sys.argv[2]
FACES = {
    "t_carinhoso": (470, 20, 705, 265), "t_brincando": (722, 20, 1005, 265), "t_sonolento": (1020, 20, 1300, 265),
    "t_curioso": (445, 320, 632, 575), "t_surpreso": (645, 320, 862, 580), "t_orgulhoso": (870, 320, 1082, 585),
    "t_feliz": (1090, 320, 1300, 580), "t_predador": (15, 635, 365, 845), "t_cabo": (378, 635, 720, 850),
    "t_naosolto": (733, 630, 1022, 845), "t_companhia": (1032, 635, 1300, 845), "t_barriga": (15, 905, 375, 1140),
    "t_mordida": (390, 905, 705, 1140), "t_pensativo": (718, 905, 1015, 1145), "t_juntos": (1030, 905, 1300, 1125),
}
for name, box in FACES.items():
    im = sheet.crop(box)
    im.thumbnail((260, 260))
    im.save(f"{out}/{name}.jpg", quality=82)


def border(w, h):
    return [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]


BG = [(250, 236, 208, 60), (248, 214, 110, 80), (245, 200, 90, 70)]
hero = sheet.crop((5, 185, 445, 640))
hero = keep_largest(cutout(hero, border(*hero.size), BG))
hero.thumbnail((340, 360))
hero.save(f"{out}/hero_tromba.png", optimize=True)

# Senhor Tromba sozinho (ao lado do Pongo no quadro "Sempre juntos")
tr = sheet.crop((1209, 972, 1298, 1114))
tr = keep_largest(cutout(tr, border(*tr.size), BG + [(250, 222, 140, 70)]))
tr.thumbnail((160, 200))
tr.save(f"{out}/tromba.png", optimize=True)
