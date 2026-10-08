"""Gera os sprites em pixel art do Pongo e do Tromba a partir dos recortes.
Uso: python3 tools/pixelate.py   (a partir da pasta pongo-katakana)"""
from PIL import Image

def pixel(src, dst, height, colors=20):
    im = Image.open(src).convert("RGBA")
    w = max(1, round(im.width * height / im.height))
    small = im.resize((w, height), Image.LANCZOS)
    alpha = small.getchannel("A").point(lambda a: 255 if a > 110 else 0)
    rgb = small.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert("RGB")
    out = rgb.convert("RGBA"); out.putalpha(alpha)
    # contorno escuro de 1 px, como nos sprites de 16 bits
    px, a = out.load(), alpha.load()
    edge = []
    for y in range(height):
        for x in range(w):
            if a[x, y] == 0 and any(0 <= x + dx < w and 0 <= y + dy < height and a[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                edge.append((x, y))
    canvas = Image.new("RGBA", (w, height), (0, 0, 0, 0)); canvas.paste(out, (0, 0), out)
    cp = canvas.load()
    for x, y in edge: cp[x, y] = (29, 37, 71, 255)
    canvas.save(dst)
    print(dst, canvas.size)

pixel("assets/pongo_em_pe.png", "assets/px_pongo_stand.png", 30)
pixel("assets/pongo_correndo.png", "assets/px_pongo_run.png", 22)
pixel("assets/tromba.png", "assets/px_tromba.png", 26)
