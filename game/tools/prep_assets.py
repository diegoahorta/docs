"""Gera game/assets a partir de assets/sprites (recorta folhas, reduz tamanho)."""
import shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets"
OUT = ROOT / "game" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

def slice_sheet(path, n, height, prefix, alpha_min=60):
    im = Image.open(path).convert("RGBA")
    w = im.width / n
    for i in range(n):
        cell = im.crop((round(i * w), 0, round((i + 1) * w), im.height))
        mask = cell.split()[3].point(lambda v: 255 if v >= alpha_min else 0)
        box = mask.getbbox()
        cell = cell.crop(box)
        scale = height / cell.height
        cell = cell.resize((max(1, round(cell.width * scale)), height), Image.LANCZOS)
        cell.save(OUT / f"{prefix}{i}.png", optimize=True)

def strip_frames(paths, out_name):
    fr = [Image.open(p).convert("RGBA") for p in paths]
    w, h = fr[0].size
    s = Image.new("RGBA", (w * len(fr), h))
    for i, f in enumerate(fr):
        s.paste(f, (i * w, 0))
    s.save(OUT / out_name, optimize=True)

def from_grid(row, height, prefix):
    """Recorta a grade de referência (fundo magenta, células de 248 x 340) com chroma key.
    As folhas .webp têm frames encostados uns nos outros; a grade tem cada frame separado."""
    im = np.array(Image.open(SRC / "sprites/referencia_alien_cachorro_grade.jpg").convert("RGB")).astype(float)
    y0 = 22 + row * 340
    for i in range(8):
        cell = im[y0:y0 + 318, i * 248:(i + 1) * 248]
        r, g, b = cell[..., 0], cell[..., 1], cell[..., 2]
        # "magenticidade": quanto R e B superam G
        m = np.clip((np.minimum(r, b) - g - 60) / 120, 0, 1)
        alpha = (1 - m) * 255
        # remove o tom rosa das bordas (despill)
        spill = np.minimum(r, b) - g
        fix = np.clip(spill - 40, 0, None) * (1 - m)
        out = np.dstack([r - fix * 0.5, g, b - fix * 0.5, alpha]).clip(0, 255).astype(np.uint8)
        img = Image.fromarray(out, "RGBA")
        img = img.crop(img.split()[3].point(lambda v: 255 if v > 100 else 0).getbbox())
        scale = height / img.height
        img = img.resize((max(1, round(img.width * scale)), height), Image.LANCZOS)
        a = np.array(img)
        a[..., 3] = np.where(a[..., 3] < 90, 0, np.where(a[..., 3] > 170, 255, a[..., 3]))
        Image.fromarray(a, "RGBA").save(OUT / f"{prefix}{i}.png", optimize=True)

sp = SRC / "sprites"
from_grid(0, 150, "alien")
from_grid(1, 112, "dog_jump")
from_grid(2, 112, "dog_walk")

copies = {
    "nave/nave_jogador.png": "ship.png",
    "nave/asteroide_grande.png": "rock_big.png",
    "nave/asteroide_pequeno.png": "rock_small.png",
    "nave/projetil_fogo.png": "fire.png",
    "fundo_espaco/espaco_asteroides.png": "bg_space.png",
    "fundo_espaco/estrelas_camada.png": "stars.png",
    "cenario/ceu_mar_fundo.png": "bg_sea.png",
    "cenario/nuvens.png": "clouds.png",
    "cenario/nuvem_pequena.png": "cloud_small.png",
    "cenario/tileset_caverna.png": "cave_tiles.png",
    "cenario/tile_fundo_vinho.png": "tile_wine.png",
    "cenario/caixa_madeira.png": "crate.png",
    "cenario/palmeira_fundo/spritesheet.png": "palm_strip.png",
    "cenario/reflexo_agua/spritesheet.png": "water_strip.png",
    "efeitos/explosao_branca/spritesheet.png": "boom_strip.png",
    "ui/botao_normal.png": "btn.png",
    "ui/botao_destaque.png": "btn_hover.png",
}
for src, dst in copies.items():
    shutil.copy(sp / src, OUT / dst)
shutil.copy(SRC / "fonts/Kenney_Mini_Square.ttf", OUT / "kenney_mini_square.ttf")
# Rostos do Pongo (narrador), recortados da folha de expressões.
for f in sorted((sp / "cachorro/expressoes").glob("*.png")):
    shutil.copy(f, OUT / ("face_" + f.name))
print("ok", len(list(OUT.iterdir())), "arquivos")

# ---------------------------------------------------------------------------
# Orbes (partículas は を の か) e esferas (sufixos 人 語) amarelos e brilhantes,
# do conteúdo da aula "Missão Internacional U.A.". Pré-renderizados para não
# depender de fonte japonesa no aparelho de quem joga.
from PIL import ImageDraw, ImageFilter, ImageFont

JP_FONT = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"
LAT_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def radial(size, cx, cy, r, stops):
    """Gradiente radial RGBA. stops: [(t, (r,g,b,a)), ...] com t de 0 a 1."""
    yy, xx = np.mgrid[0:size, 0:size]
    t = np.clip(np.hypot(xx - cx, yy - cy) / r, 0, 1)
    out = np.zeros((size, size, 4))
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        m = (t >= t0) & (t <= t1)
        k = ((t - t0) / max(t1 - t0, 1e-6))[m][:, None]
        out[m] = np.array(c0) * (1 - k) + np.array(c1) * k
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGBA")

def glyph_orb(char, romaji, out_name, sphere):
    S = 128
    img = radial(S, 64, 64, 64, [(0, (255, 214, 60, 230)), (0.45, (255, 190, 30, 140)), (1, (255, 170, 0, 0))])
    r = 40 if sphere else 32
    if sphere:
        body = radial(S, 52, 50, r * 1.5, [(0, (255, 255, 225, 255)), (0.35, (255, 226, 80, 255)), (0.8, (240, 160, 10, 255)), (1, (170, 90, 0, 255))])
    else:
        body = radial(S, 64, 64, r, [(0, (255, 250, 200, 255)), (0.7, (255, 214, 50, 255)), (1, (235, 150, 10, 255))])
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse((64 - r, 64 - r, 64 + r, 64 + r), fill=255)
    img.paste(body, (0, 0), mask)
    d = ImageDraw.Draw(img)
    d.ellipse((64 - r, 64 - r, 64 + r, 64 + r), outline=(255, 255, 230, 255), width=3)
    if sphere:
        # brilho especular e anel orbital
        hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(hl).ellipse((40, 32, 66, 48), fill=(255, 255, 255, 170))
        img.alpha_composite(hl.filter(ImageFilter.GaussianBlur(3)))
        ring = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(ring).ellipse((10, 50, 118, 78), outline=(255, 245, 170, 220), width=3)
        ring_mask = Image.new("L", (S, S), 255)
        ImageDraw.Draw(ring_mask).rectangle((0, 0, S, 64), fill=0)  # só a metade da frente do anel
        img = Image.alpha_composite(img, Image.composite(ring, Image.new("RGBA", (S, S)), ring_mask))
        d = ImageDraw.Draw(img)
    f = ImageFont.truetype(JP_FONT, 40 if sphere else 34)
    cy = 60 if sphere else 58
    d.text((64, cy), char, font=f, anchor="mm", fill=(70, 30, 0, 255), stroke_width=2, stroke_fill=(255, 250, 215, 255))
    fl = ImageFont.truetype(LAT_FONT, 12 if sphere else 11)
    d.text((64, cy + (27 if sphere else 22)), romaji, font=fl, anchor="mm", fill=(90, 40, 0, 255))
    img.save(OUT / out_name, optimize=True)

for ch_, ro, name in [("は", "wa", "jp_wa"), ("を", "o", "jp_wo"), ("の", "no", "jp_no"), ("か", "ka", "jp_ka"),
                      ("が", "ga", "jp_ga"), ("に", "ni", "jp_ni"), ("で", "de", "jp_de"), ("も", "mo", "jp_mo"), ("と", "to", "jp_to")]:
    glyph_orb(ch_, ro, name + ".png", False)
for ch_, ro, name in [("人", "jin", "jp_jin"), ("語", "go", "jp_go")]:
    glyph_orb(ch_, ro, name + ".png", True)
print("orbes japoneses ok")
