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
    "pirata/spritesheet.png": "pirate_strip.png",
    "efeitos/explosao_branca/spritesheet.png": "boom_strip.png",
    "ui/botao_normal.png": "btn.png",
    "ui/botao_destaque.png": "btn_hover.png",
}
for src, dst in copies.items():
    shutil.copy(sp / src, OUT / dst)
shutil.copy(SRC / "fonts/Kenney_Mini_Square.ttf", OUT / "kenney_mini_square.ttf")
print("ok", len(list(OUT.iterdir())), "arquivos")
