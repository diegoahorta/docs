import sys, json, base64, io
from collections import deque
import numpy as np
from PIL import Image, ImageFilter
SRC = sys.argv[1]; OUT = sys.argv[2]
sheet = Image.open(SRC + '/2.webp').convert('RGB')
full = Image.open(SRC + '/1.webp').convert('RGB')

def cutout(img, box, tol=58, dark=95, keys=(), opening=0):
    im = img.crop(box); a = np.asarray(im).astype(int); H, W, _ = a.shape
    lum = a @ np.array([.299, .587, .114])
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    # representative background colors from the border (coarse quantization)
    q = {}
    for c in border:
        k = tuple((c // 24) * 24); q[k] = q.get(k, 0) + 1
    bgs = np.array([k for k, n in q.items() if n > len(border) * 0.02]) + 12
    dist = np.min(np.linalg.norm(a[:, :, None, :] - bgs[None, None], axis=3), axis=2)
    cand = (dist < tol) & (lum > dark)
    bg = np.zeros((H, W), bool); dq = deque()
    for y in range(H):
        for x in (0, W - 1):
            if cand[y, x] and not bg[y, x]: bg[y, x] = True; dq.append((y, x))
    for x in range(W):
        for y in (0, H - 1):
            if cand[y, x] and not bg[y, x]: bg[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y+1, x), (y-1, x), (y, x+1), (y, x-1)):
            if 0 <= ny < H and 0 <= nx < W and not bg[ny, nx] and cand[ny, nx]: bg[ny, nx] = True; dq.append((ny, nx))
    for kc, kt in keys:
        bg |= (np.linalg.norm(a - np.array(kc), axis=2) < kt) & (lum > dark)
    fg = ~bg
    if opening:
        m = Image.fromarray((fg * 255).astype('uint8')).filter(ImageFilter.MinFilter(opening)).filter(ImageFilter.MaxFilter(opening)); fg = np.asarray(m) > 127
    # keep largest connected component (drops motion lines, notes, sparkles)
    lab = np.zeros((H, W), int); best, bestn, cur = 0, 0, 0
    for y in range(H):
        for x in range(W):
            if fg[y, x] and not lab[y, x]:
                cur += 1; n = 0; dq.append((y, x)); lab[y, x] = cur
                while dq:
                    cy, cx = dq.popleft(); n += 1
                    for ny, nx in ((cy+1, cx), (cy-1, cx), (cy, cx+1), (cy, cx-1)):
                        if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not lab[ny, nx]: lab[ny, nx] = cur; dq.append((ny, nx))
                if n > bestn: best, bestn = cur, n
    mask = Image.fromarray(((lab == best) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    rgba = im.convert('RGBA'); rgba.putalpha(mask)
    return rgba.crop(rgba.getbbox())

def b64(im, fmt='WEBP', **kw):
    buf = io.BytesIO(); im.save(buf, fmt, **kw); return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()

def up(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)

poses = {
  'stand': (sheet, (8, 86, 228, 326), [((251, 154, 78), 48), ((214, 160, 105), 30)]),
  'run': (sheet, (12, 318, 200, 432), []),
  'back': (sheet, (541, 452, 640, 560), [((250, 200, 71), 55)]),
  'sleep': (sheet, (423, 184, 529, 289), [((158, 134, 183), 40)]),
  'scared': (sheet, (418, 318, 534, 432), [((93, 167, 215), 45)]),
}
faces = {
  'feliz': (222, 8, 376, 152), 'piscando': (377, 20, 502, 152), 'empolgado': (508, 18, 640, 152),
  'curioso': (195, 180, 301, 293), 'surpreso': (305, 180, 415, 293), 'sonolento': (420, 180, 531, 293), 'carinhoso': (535, 180, 640, 293),
  'brincalhao': (12, 318, 200, 432), 'atento': (200, 318, 302, 432), 'bravo': (305, 318, 416, 432), 'assustado': (420, 318, 533, 432), 'pensativo': (535, 318, 640, 432),
  'triste': (12, 455, 183, 556), 'comosso': (188, 455, 318, 556), 'barriga': (322, 455, 515, 556), 'tchau': (518, 455, 640, 556),
}
out = {'poses': {}, 'faces': {}}
preview = Image.new('RGBA', (1800, 330), (255, 0, 255, 255)); px = 10
for k, (img, box, keys) in poses.items():
    c = up(cutout(img, box, keys=keys, opening=5 if k == 'back' else 0), 320 if k != 'sleep' else 220)
    out['poses'][k] = {'src': b64(c, quality=88, method=6), 'w': c.width, 'h': c.height}
    preview.alpha_composite(c, (px, 5)); px += c.width + 10
preview.save(OUT + '/preview.png')
for k, box in faces.items():
    c = sheet.crop(box); c = c.resize((round(c.width * 1.6), round(c.height * 1.6)), Image.LANCZOS)
    out['faces'][k] = b64(c, quality=86, method=6)
hero = full.resize((360, 639), Image.LANCZOS)
out['hero'] = b64(hero, quality=84, method=6)
json.dump(out, open(OUT + '/pongo_assets.json', 'w'))
print({k: (v['w'], v['h']) for k, v in out['poses'].items()}, round(len(json.dumps(out)) / 1024), 'KB')
