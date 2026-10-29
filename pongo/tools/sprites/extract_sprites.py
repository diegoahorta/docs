"""Recorta os spritesheets ilustrados (art-source/) em quadros alinhados para o jogo.

Uso (Python 3 + numpy + scipy + Pillow):
    python3 tools/sprites/extract_sprites.py

Gera src/assets/sprites/<personagem>.webp + <personagem>.json.
- pongo-sheet.png: fundo transparente -> segmentação pelo canal alfa.
- cast-sheet.png: halo colorido opaco -> segmentação pelos contornos (gradiente),
  watershed para separar sprites encostados e erosão para remover o halo.
Cada quadro é colocado numa célula de tamanho fixo, com os pés na mesma
linha de base (footY) e centralizado pelo centro de massa horizontal.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'art-source'
OUT = ROOT / 'src' / 'assets' / 'sprites'
PAD = 6


def components(mask, min_area):
    lab, n = ndi.label(mask)
    objs = ndi.find_objects(lab)
    areas = ndi.sum(mask, lab, range(1, n + 1))
    return lab, [(i + 1, objs[i], areas[i]) for i in range(n) if areas[i] >= min_area]


def bbox_of(m):
    ys, xs = np.nonzero(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


# ---------------------------------------------------------------- Pongo
def extract_pongo():
    a = np.array(Image.open(SRC / 'pongo-sheet.png').convert('RGBA'))
    solid = ndi.binary_closing(a[..., 3] > 128, iterations=2)
    lab, comps = components(solid, 30)
    bands = [
        (40, 200, [(0, 732, 'idle'), (732, 9999, 'walk')]),
        (200, 400, [(0, 730, 'run'), (730, 9999, 'jump')]),
        (430, 600, [(0, 455, 'sit'), (455, 1035, 'talk'), (1035, 9999, 'sleep')]),
        (630, 810, [(0, 800, 'interact'), (800, 9999, 'hurt')]),
        (845, 1015, [(0, 790, 'attack'), (790, 9999, 'emote')]),
    ]
    big, small = [], []
    for idx, sl, area in comps:
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        w, h = x1 - x0, y1 - y0
        if h <= 52 and w >= 90:  # rótulos e sombras alongadas
            continue
        if h < 14 and w > 40:
            continue
        (big if area > 2500 else small).append((idx, x0, y0, x1, y1))
    frames = {}
    groups = {}
    for b in big:
        cx, cy = (b[1] + b[3]) / 2, (b[2] + b[4]) / 2
        for y0, y1, splits in bands:
            if y0 <= cy < y1:
                for gx0, gx1, name in splits:
                    if gx0 <= cx < gx1:
                        groups.setdefault(name, []).append(b)
    masks = {}
    for name, items in groups.items():
        items.sort(key=lambda b: b[1])
        for i, b in enumerate(items):
            masks[f'{name}_{i}'] = [b]
    # acessórios (zzz, corações, estrelas) vão para o quadro mais próximo
    for s in small:
        sx, sy = (s[1] + s[3]) / 2, (s[2] + s[4]) / 2
        best, bd = None, 1e9
        for key, lst in masks.items():
            b = lst[0]
            dx = max(b[1] - sx, 0, sx - b[3])
            dy = max(b[2] - sy, 0, sy - b[4])
            d = dx + dy * 2
            if d < bd:
                best, bd = key, d
        if bd < 60:
            masks[best].append(s)
    for key, lst in masks.items():
        m = np.isin(lab, [c[0] for c in lst])
        m = ndi.binary_dilation(m, iterations=2) & (a[..., 3] > 0)
        frames[key] = m
    return a, frames


# ---------------------------------------------------------------- elenco
# Caixas (x0, y0, x1, y1) de cada sprite em cast-sheet.png e grupos de animação.
CAST = {
    'silence': {
        'idle': [(12, 636, 118, 752), (120, 640, 218, 752), (218, 640, 307, 752), (312, 638, 412, 752)],
        'talk': [(414, 638, 518, 752), (518, 632, 612, 752), (626, 642, 728, 752)],
        'fly': [(724, 640, 832, 752), (832, 630, 968, 748), (970, 620, 1082, 742)],
    },
    'taro': {
        'idle': [(14, 840, 110, 951), (110, 845, 197, 951), (200, 835, 297, 951)],
        'talk': [(302, 838, 403, 951), (406, 832, 525, 951), (528, 838, 627, 951)],
        'walk': [(632, 846, 757, 951), (760, 838, 882, 951), (886, 848, 984, 951), (980, 840, 1084, 951)],
    },
    'momo': {
        'idle': [(12, 1028, 120, 1156), (120, 1032, 209, 1156), (210, 1018, 302, 1156)],
        'talk': [(307, 1016, 404, 1156), (404, 1005, 532, 1156), (514, 1015, 618, 1156)],
        'walk': [(618, 1018, 739, 1156), (740, 1020, 858, 1156), (850, 1018, 966, 1156), (966, 1020, 1084, 1156)],
    },
    'kumi': {
        'idle': [(10, 1255, 102, 1386), (100, 1258, 192, 1386), (190, 1250, 282, 1386), (278, 1248, 381, 1386)],
        'talk': [(398, 1250, 503, 1386), (500, 1255, 601, 1386)],
        'walk': [(608, 1258, 739, 1386), (738, 1262, 858, 1386), (862, 1250, 978, 1386), (975, 1255, 1084, 1386)],
    },
}


def extract_cast():
    import cv2

    a = np.array(Image.open(SRC / 'cast-sheet.png').convert('RGBA'))
    bgr = np.ascontiguousarray(a[..., [2, 1, 0]])
    rgb = a[..., :3].astype(np.float32)
    grad = np.zeros(a.shape[:2], np.float32)
    for c in range(3):
        grad += np.hypot(ndi.sobel(rgb[..., c], 0), ndi.sobel(rgb[..., c], 1))
    grad /= 3
    out = {}
    for char, groups in CAST.items():
        frames = {}
        for name, boxes in groups.items():
            for i, (x0, y0, x1, y1) in enumerate(boxes):
                H, W = a.shape[:2]
                m0 = (max(0, x0 - 6), max(0, y0 - 6), min(W, x1 + 6), min(H, y1 + 4))
                ox, oy = x0 - m0[0], y0 - m0[1]
                sub = bgr[m0[1] : m0[3], m0[0] : m0[2]].copy()
                g = grad[m0[1] : m0[3], m0[0] : m0[2]]
                filled = ndi.binary_fill_holes(ndi.binary_closing(g > 170, iterations=3))
                inbox = np.zeros(sub.shape[:2], bool)
                inbox[oy : oy + (y1 - y0), ox : ox + (x1 - x0)] = True
                mask = np.full(sub.shape[:2], cv2.GC_BGD, np.uint8)
                mask[inbox] = cv2.GC_PR_BGD
                mask[inbox & filled] = cv2.GC_PR_FGD
                mask[inbox & ndi.binary_erosion(filled, iterations=3)] = cv2.GC_FGD
                # contornos com pequenas aberturas: um fechamento maior define o núcleo
                filled_big = ndi.binary_fill_holes(ndi.binary_closing(g > 170, iterations=7))
                holey = (inbox & filled).sum() < 0.85 * (inbox & filled_big).sum()
                core_big = inbox & ndi.binary_erosion(filled_big, iterations=8) if holey else inbox & False
                mask[core_big] = cv2.GC_FGD
                bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
                cv2.grabCut(sub, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
                fg = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
                fg |= inbox & ndi.binary_erosion(filled, iterations=2)
                fg |= core_big
                fg = ndi.binary_fill_holes(ndi.binary_opening(fg, iterations=1))
                # descarta pedaços de vizinhos cortados pelas laterais da caixa
                lab, cc = components(fg, 10)
                big = max(cc, key=lambda c: c[2])[0]
                for idx, (sy, sx), area in cc:
                    if idx != big and (sx.start <= ox + 5 or sx.stop >= ox + (x1 - x0) - 5):
                        fg[lab == idx] = False
                fg = main_with_accessories(fg, reach=12)
                full = np.zeros(a.shape[:2], bool)
                full[m0[1] : m0[3], m0[0] : m0[2]] = fg
                frames[f'{name}_{i}'] = full
        out[char] = (a, frames)
    return out


def main_with_accessories(m, reach=30):
    """Mantém o maior componente e os pedacinhos próximos (estrelas, corações)."""
    lab, cc = components(m, 20)
    if not cc:
        return m
    main = max(cc, key=lambda c: c[2])
    my, mx = main[1]
    keep = [main[0]]
    for idx, (sy, sx), area in cc:
        if idx == main[0]:
            continue
        dx = max(mx.start - sx.stop, 0, sx.start - mx.stop)
        dy = max(my.start - sy.stop, 0, sy.start - my.stop)
        if dx <= reach and dy <= reach:
            keep.append(idx)
    return np.isin(lab, keep)


# ---------------------------------------------------------------- montagem
def nose_point(m):
    """Ponto mais à direita na metade superior (focinho), útil para objetos."""
    x0, y0, x1, y1 = bbox_of(m)
    top = m[y0 : y0 + int((y1 - y0) * 0.55), x0:x1]
    ys, xs = np.nonzero(top)
    i = np.argmax(xs)
    return int(xs[i] + x0), int(ys[i] + y0)


def pack(name, a, frames, cols=8):
    items = []
    for key, m in frames.items():
        x0, y0, x1, y1 = bbox_of(m)
        ys, xs = np.nonzero(m)
        cx = float(np.average(xs, weights=a[ys, xs, 3].astype(float) + 1))
        items.append((key, m, x0, y0, x1, y1, cx))
    half = max(max(cx - x0, x1 - cx) for _, _, x0, _, x1, _, cx in items)
    hmax = max(it[5] - it[3] for it in items)
    W = int(np.ceil(half * 2 + PAD * 2))
    W += W % 2
    H = int(hmax + PAD * 2)
    footY = H - PAD
    order = sorted(items, key=lambda it: (it[0].rsplit('_', 1)[0], int(it[0].rsplit('_', 1)[1])))
    rows = int(np.ceil(len(order) / cols))
    sheet = np.zeros((rows * H, cols * W, 4), np.uint8)
    meta = {'cell': {'w': int(W), 'h': int(H), 'footY': int(footY)}, 'frames': {}}
    for n, (key, m, x0, y0, x1, y1, cx) in enumerate(order):
        gx, gy = (n % cols) * W, (n // cols) * H
        dx = int(round(W / 2 - cx))
        dy = footY - y1
        crop = a[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(m[y0:y1, x0:x1], crop[..., 3], 0)
        tx, ty = gx + x0 + dx, gy + y0 + dy
        sheet[ty : ty + (y1 - y0), tx : tx + (x1 - x0)] = crop
        nx, ny = nose_point(m)
        meta['frames'][key] = {'x': int(gx), 'y': int(gy), 'nose': [int(nx + dx), int(ny + dy)]}
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(sheet).save(OUT / f'{name}.webp', quality=90, method=6)
    (OUT / f'{name}.json').write_text(json.dumps(meta, indent=1))
    groups = {}
    for k in meta['frames']:
        g = k.rsplit('_', 1)[0]
        groups[g] = groups.get(g, 0) + 1
    print(f'{name}: célula {W}x{H}, {len(order)} quadros {groups}')


if __name__ == '__main__':
    a, frames = extract_pongo()
    pack('pongo', a, frames)
    for char, (a2, fr) in extract_cast().items():
        pack(char, a2, fr, cols=5)
