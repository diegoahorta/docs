"""Gera o ícone do app (caderno com marcador) em várias densidades."""
from PIL import Image, ImageDraw
import os, sys

def icon(size):
    s = 4  # supersampling
    S = size * s
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=(30, 94, 168))
    # caderno
    x0, y0, x1, y1 = int(S*.24), int(S*.18), int(S*.78), int(S*.82)
    d.rounded_rectangle([x0, y0, x1, y1], radius=int(S*.05), fill=(255, 255, 255))
    d.rectangle([x0, y0, x0 + int(S*.08), y1], fill=(255, 196, 61))
    for i in range(4):
        y = int(S*(.34 + i*.12))
        d.rounded_rectangle([int(S*.40), y, int(S*.70), y + int(S*.035)], radius=int(S*.015), fill=(30, 94, 168))
    # visto
    w = int(S*.05)
    d.line([(int(S*.54), int(S*.70)), (int(S*.62), int(S*.78)), (int(S*.80), int(S*.56))], fill=(46, 160, 67), width=w, joint="curve")
    return im.resize((size, size), Image.LANCZOS)

out = sys.argv[1]
for name, px in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    d = os.path.join(out, f"mipmap-{name}")
    os.makedirs(d, exist_ok=True)
    icon(px).save(os.path.join(d, "ic_launcher.png"))
icon(512).save(os.path.join(out, "..", "icon-512.png"))
