"""Monta game.html a partir de tools/template.html.

Uso: python3 tools/build.py <pongo_assets.json> <indie_assets.json>

O conteúdo das aulas (TERMINALS, NOTES, ZONES, LEGEND, DEATH_TIPS) vem de ../pongo-odu-x/game.html.
Os JSON são gerados por recortar-poses-pongo.py e preparar-robo-e-gramatico.py.
As correções aplicadas depois da primeira montagem já estão em game.html; use este script como ponto de partida.
"""
import json, sys, pathlib
here = pathlib.Path(__file__).resolve().parent
t = (here / 'template.html').read_text()
src = (here.parent.parent / 'pongo-odu-x' / 'game.html').read_text()
a = src.index('/* ------------------------------ CONTENT ------------------------------ */')
b = src.index('/* ------------------------------ STATE ------------------------------ */')
data = src[a:b].replace('const ITEMS = {', 'const ITEMS_3D = {')
pongo, indie = (json.load(open(p)) for p in sys.argv[1:3])
t = t.replace('/*__DATA__*/', data).replace('/*__PONGO__*/', 'const PONGO = ' + json.dumps(pongo, separators=(',', ':')) + ';').replace('/*__INDIE__*/', 'const INDIE = ' + json.dumps(indie, separators=(',', ':')) + ';')
(here.parent / 'game.built.html').write_text(t)
print('ok')
