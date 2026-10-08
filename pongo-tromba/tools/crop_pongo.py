"""Recorta as expressões do Pongo da folha de personagem e gera PNGs pequenos.
Uso: python3 crop_pongo.py <folha.png> <pongo_corpo.png> <pasta_saida>"""
import sys
from collections import deque
from PIL import Image

def cutout(im, seeds, tol):
    """Torna transparente a região de fundo conectada às sementes (para no contorno preto)."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    seen = bytearray(w * h)
    q = deque()
    for s in seeds:
        q.append(s)
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]:
            continue
        seen[y * w + x] = 1
        r, g, b, a = px[x, y]
        ref = None
        for c in tol:
            if abs(r - c[0]) + abs(g - c[1]) + abs(b - c[2]) < c[3]:
                ref = c
                break
        if ref is None:
            continue
        px[x, y] = (0, 0, 0, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im


def keep_largest(im):
    """Mantém só o maior bloco opaco (remove pedaços do logo, patas e linhas de movimento)."""
    px = im.load()
    w, h = im.size
    label = [0] * (w * h)
    best, best_id, cur = 0, 0, 0
    for sy in range(h):
        for sx in range(w):
            if label[sy * w + sx] or px[sx, sy][3] == 0:
                continue
            cur += 1
            size = 0
            q = deque([(sx, sy)])
            label[sy * w + sx] = cur
            while q:
                x, y = q.popleft()
                size += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not label[ny * w + nx] and px[nx, ny][3]:
                        label[ny * w + nx] = cur
                        q.append((nx, ny))
            if size > best:
                best, best_id = size, cur
    for y in range(h):
        for x in range(w):
            if label[y * w + x] != best_id:
                px[x, y] = (0, 0, 0, 0)
    return im



def main():
    sheet = Image.open(sys.argv[1]).convert("RGB")

    out = sys.argv[3]

    FACES = {
        "feliz": (455, 15, 770, 305), "piscando": (765, 50, 1020, 305),
        "empolgado": (1035, 35, 1295, 305), "curioso": (395, 370, 605, 600),
        "surpreso": (615, 370, 840, 600), "sonolento": (850, 370, 1080, 600),
        "carinhoso": (1090, 370, 1300, 600), "brincalhao": (20, 655, 395, 885),
        "atento": (400, 655, 605, 880), "bravo": (615, 655, 845, 880),
        "assustado": (855, 655, 1080, 880), "pensativo": (1090, 655, 1300, 880),
        "triste": (20, 935, 360, 1140), "comosso": (375, 935, 635, 1140),
        "barriga": (650, 935, 1040, 1145), "tchau": (1055, 920, 1295, 1145),
    }
    for name, box in FACES.items():
        im = sheet.crop(box)
        im.thumbnail((240, 240))
        im.save(f"{out}/{name}.jpg", quality=82)



    # Pose principal (em pé) da folha: fundo creme + círculo laranja
    body = sheet.crop((15, 180, 395, 668))
    w, h = body.size
    seeds = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + \
            [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)] + [(215, 387), (205, 400), (225, 370)]
    body = cutout(body, seeds, [(250, 236, 208, 60), (243, 160, 80, 70), (238, 180, 120, 50)])
    body = keep_largest(body)
    body.thumbnail((300, 340))
    body.save(f"{out}/pongo_em_pe.png", optimize=True)

    # Pose correndo (brincalhão): fundo verde-água com linhas de velocidade
    run = sheet.crop((20, 655, 395, 884))
    w, h = run.size
    seeds = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + \
            [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    run = cutout(run, seeds, [(110, 205, 185, 70), (80, 170, 150, 70), (250, 236, 208, 60)])
    run = keep_largest(run)
    run.thumbnail((300, 200))
    run.save(f"{out}/pongo_correndo.png", optimize=True)


if __name__ == "__main__":
    main()
