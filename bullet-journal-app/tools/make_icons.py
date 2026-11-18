"""Gera os ícones PNG do app (caderno pontilhado com marcadores) em várias densidades."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def draw(size: int) -> Image.Image:
    S = size * 4  # supersampling
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = S * 0.22
    d.rounded_rectangle([S * .04, S * .04, S * .96, S * .96], radius=r, fill=(247, 243, 234, 255))
    # pontos da página
    step = S * 0.105
    dot = S * 0.012
    y = S * 0.16
    while y < S * 0.88:
        x = S * 0.16
        while x < S * 0.88:
            d.ellipse([x - dot, y - dot, x + dot, y + dot], fill=(205, 196, 178, 255))
            x += step
        y += step
    # elástico do caderno
    d.rectangle([S * .74, S * .04, S * .79, S * .96], fill=(196, 82, 58, 255))
    ink = (38, 36, 33, 255)
    # • tarefa
    cx, cy = S * .27, S * .32
    d.ellipse([cx - S * .045, cy - S * .045, cx + S * .045, cy + S * .045], fill=ink)
    d.rounded_rectangle([S * .38, cy - S * .025, S * .66, cy + S * .025], radius=S * .02, fill=ink)
    # × concluída
    cy = S * .5
    w = S * .045
    d.line([cx - w, cy - w, cx + w, cy + w], fill=ink, width=int(S * .03))
    d.line([cx - w, cy + w, cx + w, cy - w], fill=ink, width=int(S * .03))
    d.rounded_rectangle([S * .38, cy - S * .025, S * .6, cy + S * .025], radius=S * .02, fill=ink)
    # ○ evento
    cy = S * .68
    d.ellipse([cx - w, cy - w, cx + w, cy + w], outline=ink, width=int(S * .025))
    d.rounded_rectangle([S * .38, cy - S * .025, S * .64, cy + S * .025], radius=S * .02, fill=ink)
    return img.resize((size, size), Image.LANCZOS)


def main(res_dir: str) -> None:
    for name, px in SIZES.items():
        out = Path(res_dir) / f"drawable-{name}"
        out.mkdir(parents=True, exist_ok=True)
        draw(px).save(out / "ic_launcher.png")
    draw(512).save(Path(res_dir).parent / "icon-512.png")


if __name__ == "__main__":
    main(sys.argv[1])
