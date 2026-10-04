"""Gera index.html (página completa) a partir de jogo.html."""
import pathlib
d = pathlib.Path(__file__).parent
corpo = (d / "jogo.html").read_text(encoding="utf-8")
html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '</head>\n<body>\n' + corpo + '\n</body>\n</html>\n')
(d / "index.html").write_text(html, encoding="utf-8")
print("index.html gerado")
