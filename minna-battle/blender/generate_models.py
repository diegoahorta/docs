"""
Gera os modelos 3D low-poly do jogo "Minna no Nihongo — Batalha dos Reinos".

Uso (Blender 4.x/5.x):
    blender --background --python generate_models.py
ou, com o módulo bpy instalado (pip install bpy):
    python3 generate_models.py

Cada modelo é exportado como .glb em ../models/.
Materiais chamados "TEAM" são recoloridos no jogo (azul = Time Sakura, vermelho = Time Oni).
"""
import math
import os

import bpy

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
os.makedirs(OUT, exist_ok=True)

_mats = {}


def mat(name, rgb, rough=0.8, metal=0.0, emit=None):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = 1.0
    _mats[name] = m
    return m


def srgb(h):
    """hex sRGB -> linear rgb"""
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)


TEAM = lambda: mat("TEAM", srgb("#3b7dd8"), 0.55)
STONE = lambda: mat("Stone", srgb("#8d8a83"), 0.95)
STONE_D = lambda: mat("StoneDark", srgb("#6b6862"), 0.95)
PLASTER = lambda: mat("Plaster", srgb("#f3efe4"), 0.9)
ROOF = lambda: mat("Roof", srgb("#2f3a45"), 0.6)
WOOD = lambda: mat("Wood", srgb("#5b3a24"), 0.85)
GOLD = lambda: mat("Gold", srgb("#e8b730"), 0.3, 0.9)
RED = lambda: mat("Vermilion", srgb("#d8432e"), 0.6)
SKIN = lambda: mat("Skin", srgb("#f1c9a0"), 0.7)
STEEL = lambda: mat("Steel", srgb("#d6dde4"), 0.25, 1.0)
BLACK = lambda: mat("Black", srgb("#1d1d22"), 0.6)
IVORY = lambda: mat("Ivory", srgb("#f5ead0"), 0.6)
PINK = lambda: mat("Sakura", srgb("#f7a8c4"), 0.8)
PINK2 = lambda: mat("Sakura2", srgb("#fbc7da"), 0.8)
BARK = lambda: mat("Bark", srgb("#4a3328"), 0.9)
GLOW = lambda: mat("Glow", srgb("#ffd98a"), 0.5, emit=srgb("#ffb347"))


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def finish(o, m, smooth=False):
    if m is not None:
        o.data.materials.clear()
        o.data.materials.append(m)
    if not smooth:
        for p in o.data.polygons:
            p.use_smooth = False
    return o


def box(size, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    return finish(o, m)


def cyl(r, h, loc, m, v=12, r2=None, rot=(0, 0, 0)):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    return finish(bpy.context.active_object, m)


def sphere(r, loc, m, sub=1, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    return finish(o, m)


def uvsphere(r, loc, m, seg=12, ring=8, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    return finish(o, m, smooth=True)


def roof(w, h, z, m, flare=1.25):
    """Telhado japonês: tronco de pirâmide de 4 lados com beirais largos."""
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=w * flare * 0.7071 * 2,
                                    radius2=w * 0.22, depth=h, location=(0, 0, z),
                                    rotation=(0, 0, math.pi / 4))
    o = finish(bpy.context.active_object, m)
    # beiral (aba fina e larga)
    box((w * flare * 2.05, w * flare * 2.05, 0.06), (0, 0, z - h / 2), m)
    return o


def export(name):
    for o in bpy.context.scene.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bpy.context.scene.objects[0]
    # aplica escala/rotação para exportar limpo
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    path = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False,
                              export_apply=True, export_yup=True)
    print("exportado", path, os.path.getsize(path), "bytes")


# ---------------------------------------------------------------- 櫓 Yagura (torre da princesa)
def yagura():
    reset()
    cyl(1.25, 1.1, (0, 0, 0.55), STONE(), v=4, r2=0.95, rot=(0, 0, math.pi / 4))
    for i in range(4):  # blocos de pedra na base
        a = i * math.pi / 2 + math.pi / 4
        box((0.35, 0.35, 0.25), (math.cos(a) * 1.05, math.sin(a) * 1.05, 0.13), STONE_D())
    box((1.2, 1.2, 0.9), (0, 0, 1.55), PLASTER())
    box((1.24, 1.24, 0.12), (0, 0, 1.2), TEAM())  # faixa do time
    for sx in (-1, 1):  # janelas
        box((0.05, 0.25, 0.3), (sx * 0.61, 0, 1.6), BLACK())
        box((0.25, 0.05, 0.3), (0, sx * 0.61, 1.6), BLACK())
    roof(0.62, 0.55, 2.27, ROOF())
    box((0.7, 0.7, 0.45), (0, 0, 2.7), PLASTER())
    roof(0.38, 0.45, 3.1, ROOF())
    cyl(0.06, 0.4, (0, 0, 3.5), GOLD(), v=6)
    # mastro e bandeira (nobori) do time
    cyl(0.03, 1.4, (0.55, 0.55, 3.2), WOOD(), v=6)
    box((0.04, 0.32, 0.7), (0.55, 0.38, 3.45), TEAM())
    export("yagura")


# ---------------------------------------------------------------- 天守閣 Tenshu (torre do rei)
def tenshu():
    reset()
    cyl(2.2, 1.6, (0, 0, 0.8), STONE(), v=4, r2=1.65, rot=(0, 0, math.pi / 4))
    box((2.4, 2.4, 1.1), (0, 0, 2.15), PLASTER())
    box((2.44, 2.44, 0.14), (0, 0, 1.7), TEAM())
    for sx in (-1, 1):
        for k in (-0.6, 0, 0.6):
            box((0.05, 0.22, 0.3), (sx * 1.21, k, 2.2), BLACK())
            box((0.22, 0.05, 0.3), (k, sx * 1.21, 2.2), BLACK())
    roof(1.22, 0.6, 2.98, ROOF())
    # karahafu (frontão curvo) dourado
    box((0.9, 0.08, 0.35), (0, 1.45, 3.05), GOLD())
    box((1.7, 1.7, 0.9), (0, 0, 3.7), PLASTER())
    box((1.74, 1.74, 0.1), (0, 0, 3.3), TEAM())
    roof(0.88, 0.55, 4.42, ROOF())
    box((1.05, 1.05, 0.75), (0, 0, 5.0), PLASTER())
    roof(0.56, 0.6, 5.65, ROOF())
    # shachihoko (peixes dourados) no topo
    for sx in (-1, 1):
        sphere(0.16, (sx * 0.35, 0, 6.1), GOLD(), sub=1, scale=(1, 0.7, 1.4))
        cyl(0.02, 0.25, (sx * 0.35, 0, 6.35), GOLD(), v=5, r2=0.12)
    # coroa do rei (indica a torre principal)
    cyl(0.32, 0.25, (0, 0, 6.15), GOLD(), v=8, r2=0.38)
    for i in range(5):
        a = i * 2 * math.pi / 5
        cyl(0.07, 0.25, (math.cos(a) * 0.3, math.sin(a) * 0.3, 6.38), GOLD(), v=4, r2=0.0)
    for sx in (-1, 1):
        cyl(0.035, 2.2, (sx * 1.9, 1.9, 2.5), WOOD(), v=6)
        box((0.05, 0.4, 1.1), (sx * 1.9, 1.68, 3.0), TEAM())
    export("tenshu")


# ---------------------------------------------------------------- 侍 Samurai (tropa)
def samurai():
    reset()
    for sx in (-1, 1):  # pernas
        box((0.16, 0.18, 0.4), (sx * 0.11, 0, 0.2), BLACK())
    cyl(0.28, 0.5, (0, 0, 0.62), TEAM(), v=8, r2=0.22)  # armadura (dō)
    box((0.62, 0.3, 0.12), (0, 0, 0.88), TEAM())  # ombreiras (sode)
    box((0.5, 0.04, 0.3), (0, 0.24, 0.6), GOLD())  # placa peitoral
    for sx in (-1, 1):
        cyl(0.07, 0.35, (sx * 0.33, 0, 0.66), SKIN(), v=6)
    uvsphere(0.2, (0, 0, 1.12), SKIN())
    for sx in (-1, 1):  # olhos
        sphere(0.03, (sx * 0.07, 0.18, 1.14), BLACK(), sub=1)
    uvsphere(0.24, (0, 0, 1.2), BLACK(), scale=(1, 1, 0.65))  # kabuto
    box((0.56, 0.4, 0.04), (0, -0.04, 1.08), BLACK())  # shikoro
    for sx in (-1, 1):  # kuwagata (chifres dourados)
        box((0.04, 0.03, 0.32), (sx * 0.1, 0.18, 1.42), GOLD(), rot=(0, sx * 0.45, 0))
    # katana
    box((0.04, 0.05, 0.8), (0.38, 0.14, 0.85), STEEL(), rot=(0.5, 0, 0))
    box((0.12, 0.12, 0.03), (0.38, 0.0, 0.58), GOLD(), rot=(0.5, 0, 0))
    box((0.04, 0.05, 0.2), (0.38, -0.05, 0.47), BLACK(), rot=(0.5, 0, 0))
    # sashimono (bandeirinha nas costas)
    cyl(0.015, 0.7, (0, -0.2, 1.25), WOOD(), v=5)
    box((0.02, 0.22, 0.3), (0, -0.32, 1.45), TEAM())
    export("samurai")


# ---------------------------------------------------------------- 鬼 Oni (tropa inimiga)
def oni():
    reset()
    for sx in (-1, 1):
        box((0.2, 0.22, 0.4), (sx * 0.15, 0, 0.2), TEAM())
    cyl(0.36, 0.55, (0, 0, 0.68), TEAM(), v=8, r2=0.3)
    box((0.66, 0.42, 0.2), (0, 0, 0.55), mat("Tiger", srgb("#f2b02e"), 0.8))  # tanga de tigre
    for sx in (-1, 1):
        cyl(0.09, 0.42, (sx * 0.42, 0, 0.72), TEAM(), v=6)
    uvsphere(0.28, (0, 0, 1.2), TEAM())
    for sx in (-1, 1):
        cyl(0.07, 0.28, (sx * 0.15, 0, 1.52), IVORY(), v=6, r2=0.0, rot=(0, sx * -0.35, 0))
        sphere(0.06, (sx * 0.1, 0.24, 1.25), IVORY(), sub=1)
        sphere(0.03, (sx * 0.1, 0.29, 1.25), BLACK(), sub=1)
        cyl(0.025, 0.1, (sx * 0.07, 0.25, 1.06), IVORY(), v=4, r2=0.0, rot=(math.pi, 0, 0))
    uvsphere(0.29, (0, -0.04, 1.32), BLACK(), scale=(1, 1, 0.5))  # cabelo
    # kanabō (clava de ferro)
    cyl(0.07, 0.95, (0.48, 0.12, 0.95), BLACK(), v=8, r2=0.11, rot=(0.35, 0, 0))
    for k in range(4):
        z = 1.0 + k * 0.12
        sphere(0.03, (0.58, 0.1 + (z - 0.95) * 0.35, z), STEEL(), sub=1)
        sphere(0.03, (0.38, 0.1 + (z - 0.95) * 0.35, z), STEEL(), sub=1)
    export("oni")


# ---------------------------------------------------------------- cenário
def sakura():
    reset()
    cyl(0.14, 1.2, (0, 0, 0.6), BARK(), v=6, r2=0.09)
    box((0.06, 0.06, 0.6), (0.2, 0, 1.1), BARK(), rot=(0, 0.7, 0))
    box((0.06, 0.06, 0.6), (-0.2, 0.05, 1.15), BARK(), rot=(0, -0.7, 0))
    for (x, y, z, r, m) in [(0, 0, 1.6, 0.65, PINK()), (0.45, 0.1, 1.4, 0.45, PINK2()),
                             (-0.45, -0.1, 1.45, 0.5, PINK2()), (0.1, 0.35, 1.9, 0.4, PINK2()),
                             (-0.15, -0.35, 1.85, 0.42, PINK())]:
        sphere(r, (x, y, z), m, sub=1)
    export("sakura")


def torii():
    reset()
    for sx in (-1, 1):
        cyl(0.11, 2.2, (sx * 0.9, 0, 1.1), RED(), v=8)
        cyl(0.14, 0.2, (sx * 0.9, 0, 0.1), BLACK(), v=8)
    box((2.6, 0.24, 0.16), (0, 0, 2.25), BLACK())
    box((2.3, 0.2, 0.16), (0, 0, 2.08), RED())
    box((2.1, 0.14, 0.12), (0, 0, 1.75), RED())
    box((0.12, 0.1, 0.32), (0, 0, 1.92), RED())
    export("torii")


def bridge():
    reset()
    n = 9
    for i in range(n):
        t = i / (n - 1)
        y = (t - 0.5) * 3.2
        z = 0.12 + math.sin(t * math.pi) * 0.45
        ang = math.cos(t * math.pi) * 0.45
        box((1.4, 0.42, 0.1), (0, y, z), WOOD(), rot=(ang, 0, 0))
        for sx in (-1, 1):
            cyl(0.04, 0.45, (sx * 0.68, y, z + 0.22), RED(), v=6)
    for sx in (-1, 1):
        for i in range(n - 1):
            t0, t1 = i / (n - 1), (i + 1) / (n - 1)
            y0, y1 = (t0 - 0.5) * 3.2, (t1 - 0.5) * 3.2
            z0 = 0.12 + math.sin(t0 * math.pi) * 0.45 + 0.42
            z1 = 0.12 + math.sin(t1 * math.pi) * 0.45 + 0.42
            ln = math.hypot(y1 - y0, z1 - z0)
            box((0.06, ln, 0.06), (sx * 0.68, (y0 + y1) / 2, (z0 + z1) / 2), RED(),
                rot=(math.atan2(z1 - z0, y1 - y0), 0, 0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl(0.06, 0.18, (sx * 0.68, sy * 1.6, 0.66), GOLD(), v=6, r2=0.0)
    export("bridge")


def lantern():
    reset()
    cyl(0.28, 0.12, (0, 0, 0.06), STONE(), v=6)
    cyl(0.08, 0.55, (0, 0, 0.4), STONE(), v=6)
    cyl(0.25, 0.1, (0, 0, 0.72), STONE(), v=6)
    box((0.3, 0.3, 0.26), (0, 0, 0.9), GLOW())
    for sx in (-1, 1):
        box((0.06, 0.34, 0.28), (sx * 0.15, 0, 0.9), STONE())
    cyl(0.42, 0.22, (0, 0, 1.13), STONE_D(), v=6, r2=0.05)
    sphere(0.06, (0, 0, 1.27), STONE_D(), sub=1)
    export("lantern")


def rock():
    reset()
    sphere(0.5, (0, 0, 0.2), STONE(), sub=1, scale=(1.2, 0.9, 0.6))
    sphere(0.3, (0.45, 0.2, 0.12), STONE_D(), sub=1, scale=(1, 0.8, 0.7))
    export("rock")


if __name__ == "__main__":
    for f in (yagura, tenshu, samurai, oni, sakura, torii, bridge, lantern, rock):
        f()
