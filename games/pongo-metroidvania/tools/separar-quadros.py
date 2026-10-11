"""Splits the transparent sprite sheets into frames.
Main figures = the 8 largest connected components; small pieces (orbs, glyphs) join the nearest figure.
Each frame is cropped, scaled by one factor per sheet and anchored at the main figure's feet."""
import sys, json, base64, io
from collections import deque
import numpy as np
from PIL import Image, ImageDraw
IMG, OUT = sys.argv[1], sys.argv[2]
def components(mask):
    H, W = mask.shape; lab = np.zeros((H, W), np.int32); comps = []; cur = 0
    ys, xs = np.nonzero(mask)
    for y, x in zip(ys, xs):
        if lab[y, x]: continue
        cur += 1; q = deque([(y, x)]); lab[y, x] = cur; n = 0; sx = 0; x0 = x1 = x; y0 = y1 = y
        while q:
            cy, cx = q.popleft(); n += 1; sx += cx
            if cx < x0: x0 = cx
            if cx > x1: x1 = cx
            if cy < y0: y0 = cy
            if cy > y1: y1 = cy
            for ny, nx in ((cy+1, cx), (cy-1, cx), (cy, cx+1), (cy, cx-1)):
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not lab[ny, nx]: lab[ny, nx] = cur; q.append((ny, nx))
        comps.append({'id': cur, 'n': n, 'bbox': [x0, y0, x1, y1], 'cx': sx / n})
    return lab, comps
def b64(im): buf = io.BytesIO(); im.save(buf, 'WEBP', quality=86, method=6); return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
SHEETS = {'alien': ('7.webp', .42), 'jump': ('8.webp', .5), 'walk': ('9.webp', .5)}
out = {}
prev = Image.new('RGBA', (2000, 3 * 340), (255, 0, 255, 255)); dr = ImageDraw.Draw(prev)
for row, (key, (fn, sc)) in enumerate(SHEETS.items()):
    im = Image.open(IMG + '/' + fn).convert('RGBA'); a = np.asarray(im)
    mask = a[..., 3] > 24
    lab, comps = components(mask)
    comps.sort(key=lambda c: -c['n'])
    mains = sorted(comps[:8], key=lambda c: c['bbox'][0])
    groups = [[m['id']] for m in mains]
    for c in comps[8:]:
        if c['n'] < 6: continue
        i = min(range(8), key=lambda k: abs(mains[k]['cx'] - c['cx']))
        groups[i].append(c['id'])
    frames = []
    for i, (m, g) in enumerate(zip(mains, groups)):
        sel = np.isin(lab, g)
        # grow selection by 1px so anti-aliased edges survive
        selimg = Image.fromarray((sel * 255).astype('uint8')).filter(__import__('PIL.ImageFilter', fromlist=['x']).MaxFilter(3))
        alpha = np.minimum(a[..., 3], np.asarray(selimg))
        fr = im.copy(); fr.putalpha(Image.fromarray(alpha.astype('uint8')))
        bb = fr.getbbox(); crop = fr.crop(bb)
        W, H = max(1, round(crop.width * sc)), max(1, round(crop.height * sc))
        crop = crop.resize((W, H), Image.LANCZOS)
        # anchor: feet of the main figure (bottom of its bbox) and its centre of mass
        ax = (m['cx'] - bb[0]) * sc; ay = (m['bbox'][3] + 1 - bb[1]) * sc
        frames.append({'src': b64(crop), 'w': W, 'h': H, 'ax': round(ax, 1), 'ay': round(ay, 1), 'bodyH': round((m['bbox'][3] - m['bbox'][1]) * sc, 1)})
        th = crop.copy(); th.thumbnail((240, 300)); px = 10 + i * 248
        prev.alpha_composite(th, (px, row * 340 + 30)); dr.text((px + 4, row * 340 + 6), f'{key} {i}', fill=(0, 0, 0, 255))
    out[key] = frames
    print(key, [(f['w'], f['h'], f['ax'], f['ay']) for f in frames])
prev.save(OUT + '/frames_preview.png')
json.dump(out, open(OUT + '/anim_assets.json', 'w'))
print(round(len(json.dumps(out)) / 1024), 'KB')
