"""
ODU CREATIVE — modelos 3D do jogo de flashcards (Blender 4.x, modo headless).

Gera um único arquivo glTF binário com:
  - Card                 carta com cantos arredondados; materiais CardFront / CardBack / CardEdge
                         (frente e verso com UV 0..1 para receber texturas geradas no Three.js)
  - item-<id>            um objeto low-poly por palavra do vocabulário (origem = centro da base)
  - Customer             cliente do modo "Café Rush"
  - env-*                cenário da cafeteria (piso, parede, balcão, quadro, luminárias, plantas)

Uso:
  blender -b --factory-startup -P tools/blender/build_cafe_models.py -- units/en-a1-cafe/3d/cafe-flashcards.glb

Todas as formas são primitivas do Blender combinadas por código — sem arquivos externos,
para que qualquer pessoa possa regenerar ou alterar os modelos.
"""
import bpy
import bmesh
import math
import sys
import os

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "cafe-flashcards.glb"

# ------------------------------------------------------------------ cena limpa
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

MATS = {}


def mat(name, color, rough=0.55, metal=0.0, alpha=1.0, emit=0.0):
    """Material PBR simples (exportado como baseColorFactor/roughness/metallic no glTF)."""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if alpha < 1.0:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    if emit > 0:
        b.inputs["Emission Color"].default_value = (*color, 1.0)
        b.inputs["Emission Strength"].default_value = emit
    MATS[name] = m
    return m


def srgb(hexstr):
    """Hex sRGB → linear (o Blender trabalha em espaço linear)."""
    hexstr = hexstr.lstrip("#")
    c = [int(hexstr[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# Paleta (cores da marca + cores de alimentos)
WHITE = mat("white-ceramic", srgb("#f7f4ee"), 0.35)
CHOC = mat("chocolate", srgb("#5a2e1b"), 0.4)
CREAM = mat("cream", srgb("#fff8ec"), 0.7)
GLASS = mat("glass", srgb("#dff4ff"), 0.05, alpha=0.32)
ORANGE = mat("orange-juice", srgb("#ff9a1f"), 0.3)
ORANGE_PEEL = mat("orange-peel", srgb("#ff7a00"), 0.5)
APPLEJ = mat("apple-juice", srgb("#e8b833"), 0.3)
APPLE_RED = mat("apple-red", srgb("#d6283a"), 0.35)
STEM = mat("stem", srgb("#5b3a1e"), 0.8)
LEAF = mat("leaf", srgb("#3fae4a"), 0.6)
PINK = mat("strawberry-shake", srgb("#ff8fb3"), 0.45)
CHERRY = mat("cherry", srgb("#c4001d"), 0.2)
STRAW_RED = mat("straw", srgb("#ff4a5a"), 0.5)
WATER = mat("water-bottle", srgb("#9fd8ff"), 0.08, alpha=0.45)
CAP_BLUE = mat("cap-blue", srgb("#2f6fde"), 0.4)
BREAD = mat("bread", srgb("#f1c27d"), 0.8)
CRUST = mat("crust", srgb("#b8742a"), 0.8)
CHEESE = mat("cheese", srgb("#ffd23f"), 0.5)
EGG_WHITE = mat("egg-white", srgb("#fffdf5"), 0.6)
YOLK = mat("yolk", srgb("#ffb300"), 0.4)
LETTUCE = mat("lettuce", srgb("#7ccf4a"), 0.7)
MUFFIN_TOP = mat("muffin-top", srgb("#8a4b25"), 0.75)
PAPER_PINK = mat("paper-cup", srgb("#ff6b8a"), 0.7)
CHIP = mat("choc-chip", srgb("#3a1d10"), 0.5)
COOKIE = mat("cookie", srgb("#d99a4e"), 0.8)
PIE_CRUST = mat("pie-crust", srgb("#e0a24f"), 0.7)
PIE_FILL = mat("pie-filling", srgb("#c76b1c"), 0.5)
DISH = mat("dish", srgb("#a7c7e7"), 0.3)
COFFEE_CUP = mat("coffee-cup", srgb("#ffffff"), 0.6)
SLEEVE = mat("cup-sleeve", srgb("#a0663a"), 0.85)
LID = mat("cup-lid", srgb("#2d2a26"), 0.4)
KRAFT = mat("kraft-paper", srgb("#c49a6c"), 0.9)
TRAY = mat("tray", srgb("#12a586"), 0.45)
TAG = mat("price-tag", srgb("#ffc93c"), 0.6)
BRAND = mat("brand-violet", srgb("#5b3df5"), 0.45)
ACCENT = mat("brand-coral", srgb("#ff6b4a"), 0.5)
GOLD = mat("coin-gold", srgb("#e8b931"), 0.25, metal=0.9)
SILVER = mat("coin-silver", srgb("#c9ced6"), 0.25, metal=0.9)
NOTE = mat("banknote", srgb("#8fd18b"), 0.8)
NOTE_DARK = mat("banknote-ink", srgb("#2f7a3b"), 0.7)
BUBBLE = mat("bubble", srgb("#ffffff"), 0.5)
SKIN = mat("skin", srgb("#c98b62"), 0.6)
HAIR = mat("hair", srgb("#2b1a12"), 0.7)
HOODIE = mat("hoodie", srgb("#12a586"), 0.7)
INK = mat("ink", srgb("#1d1a2b"), 0.4)

# ------------------------------------------------------------------ helpers
def _finish(obj, material):
    if material is not None:
        obj.data.materials.clear()
        obj.data.materials.append(material)
    return obj


def cyl(r, h, z=0.0, x=0.0, y=0.0, m=None, v=32, r2=None, rot=(0, 0, 0)):
    """Cilindro (ou tronco de cone se r2) com a base em z."""
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=(x, y, z + h / 2), rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=(x, y, z + h / 2), rotation=rot)
    return _finish(bpy.context.object, m)


def sphere(r, x=0.0, y=0.0, z=0.0, m=None, scale=(1, 1, 1), seg=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=(x, y, z), scale=scale)
    return _finish(bpy.context.object, m)


def box(sx, sy, sz, x=0.0, y=0.0, z=0.0, m=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z), rotation=rot, scale=(sx, sy, sz))
    return _finish(bpy.context.object, m)


def torus(R, r, x=0.0, y=0.0, z=0.0, m=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=24, minor_segments=10, location=(x, y, z), rotation=rot)
    return _finish(bpy.context.object, m)


def text(body, size, x=0.0, y=0.0, z=0.0, m=None, rot=(math.pi / 2, 0, 0), depth=0.02):
    """Texto 3D convertido em malha (exporta como geometria comum)."""
    bpy.ops.object.text_add(location=(x, y, z), rotation=rot)
    t = bpy.context.object
    t.data.body = body
    t.data.size = size
    t.data.extrude = depth
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    bpy.ops.object.convert(target="MESH")
    return _finish(bpy.context.object, m)


def smile(R, r, x=0.0, y=0.0, z=0.0, m=None):
    """Sorriso: metade inferior de um toro, de frente para a câmera (-Y)."""
    t = torus(R, r, x=x, y=y, z=z, m=m, rot=(math.pi / 2, 0, 0))
    bm = bmesh.new()
    bm.from_mesh(t.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > R * 0.15], context="VERTS")
    bm.to_mesh(t.data)
    bm.free()
    return t


def combine(name, parts, size=None, smooth=True, offset_x=0.0):
    """Une as partes em um objeto, normaliza o tamanho (maior dimensão = size) e posiciona."""
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    if len(parts) > 1:
        bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name
    # origem no centro da base (mundo 0,0,0): as peças foram modeladas com a base em z=0
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    if size:
        s = size / max(obj.dimensions)
        obj.scale = (s, s, s)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if smooth:
        bpy.ops.object.shade_smooth()
        if hasattr(obj.data, "use_auto_smooth"):
            obj.data.use_auto_smooth = True
            obj.data.auto_smooth_angle = math.radians(40)
    obj.location.x = offset_x
    return obj


scene.cursor.location = (0, 0, 0)
items = []

# ------------------------------------------------------------------ CARTA
def build_card():
    W, T, H, R = 0.63, 0.018, 0.88, 0.06
    me = bpy.data.meshes.new("Card")
    obj = bpy.data.objects.new("Card", me)
    scene.collection.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(W, T, H), verts=bm.verts)
    vertical = [e for e in bm.edges
                if abs(e.verts[0].co.x - e.verts[1].co.x) < 1e-6 and abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6]
    bmesh.ops.bevel(bm, geom=vertical, offset=R, segments=8, profile=0.5, affect="EDGES")
    bm.normal_update()
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        n = f.normal
        if n.y < -0.9:
            f.material_index = 0  # frente (olha para -Y no Blender = +Z no glTF / câmera)
        elif n.y > 0.9:
            f.material_index = 1  # verso
        else:
            f.material_index = 2  # borda
        for loop in f.loops:
            u = (loop.vert.co.x + W / 2) / W
            v = (loop.vert.co.z + H / 2) / H
            loop[uv].uv = (u if f.material_index != 1 else 1 - u, v)
    bm.to_mesh(me)
    bm.free()
    for m in (mat("CardFront", srgb("#ffffff"), 0.6), mat("CardBack", srgb("#5b3df5"), 0.6), mat("CardEdge", srgb("#ece8ff"), 0.5)):
        me.materials.append(m)
    obj.location = (0, 0, 3.2)
    return obj


build_card()

# ------------------------------------------------------------------ ITENS DO VOCABULÁRIO
SIZE = 0.55
X = iter([i * 0.9 - 7 for i in range(40)])


def item(name, parts, size=SIZE, smooth=True):
    items.append(combine(f"item-{name}", parts, size=size, smooth=smooth, offset_x=next(X)))


# v1 hot chocolate — caneca + chocolate + chantilly + alça
item("hot-chocolate", [
    cyl(0.30, 0.42, m=WHITE),
    cyl(0.27, 0.02, z=0.40, m=CHOC),
    sphere(0.14, x=-0.06, z=0.45, m=CREAM), sphere(0.12, x=0.08, y=0.04, z=0.46, m=CREAM), sphere(0.09, x=0.0, y=-0.06, z=0.53, m=CREAM),
    torus(0.12, 0.035, x=0.33, z=0.22, m=WHITE, rot=(math.pi / 2, 0, 0)),
])

# v2 orange juice — copo de vidro + suco + rodela de laranja + canudo
item("orange-juice", [
    cyl(0.20, 0.58, m=GLASS, r2=0.23),
    cyl(0.185, 0.46, z=0.02, m=ORANGE, r2=0.21),
    cyl(0.12, 0.03, x=0.2, z=0.52, m=ORANGE_PEEL, rot=(0, math.radians(70), 0)),
    cyl(0.018, 0.75, x=-0.06, z=0.0, m=STRAW_RED, rot=(0, math.radians(12), 0)),
])

# v3 apple juice — copo + suco âmbar + maçã ao lado
item("apple-juice", [
    cyl(0.20, 0.58, m=GLASS, r2=0.23),
    cyl(0.185, 0.46, z=0.02, m=APPLEJ, r2=0.21),
    sphere(0.14, x=0.33, z=0.13, m=APPLE_RED, scale=(1, 1, 0.9)),
    cyl(0.012, 0.08, x=0.33, z=0.24, m=STEM),
    sphere(0.04, x=0.37, z=0.31, m=LEAF, scale=(1.6, 0.6, 0.4)),
])

# v4 milkshake — taça alta + rosa + chantilly + cereja + canudo
item("milkshake", [
    cyl(0.12, 0.08, m=GLASS), cyl(0.04, 0.16, z=0.08, m=GLASS), cyl(0.15, 0.5, z=0.24, m=GLASS, r2=0.25),
    cyl(0.14, 0.44, z=0.26, m=PINK, r2=0.235),
    sphere(0.2, z=0.76, m=CREAM, scale=(1, 1, 0.6)), sphere(0.12, z=0.87, m=CREAM),
    sphere(0.055, z=0.99, m=CHERRY),
    cyl(0.02, 0.6, x=0.08, z=0.6, m=STRAW_RED, rot=(0, math.radians(18), 0)),
])

# v5 water — garrafa
item("water", [
    cyl(0.15, 0.55, m=WATER), cyl(0.15, 0.16, z=0.55, m=WATER, r2=0.06), cyl(0.065, 0.08, z=0.71, m=CAP_BLUE),
    cyl(0.155, 0.16, z=0.22, m=CAP_BLUE, v=32),
])

# v6 cheese sandwich — triângulo de pão + queijo
item("cheese-sandwich", [
    cyl(0.4, 0.09, m=BREAD, v=3), cyl(0.43, 0.035, z=0.09, m=CHEESE, v=3, rot=(0, 0, math.radians(8))),
    cyl(0.38, 0.03, z=0.125, m=LETTUCE, v=3, rot=(0, 0, math.radians(-6))), cyl(0.4, 0.09, z=0.155, m=BREAD, v=3),
], smooth=False)

# v7 egg sandwich — pão + clara + gema
item("egg-sandwich", [
    cyl(0.4, 0.09, m=BREAD, v=3),
    cyl(0.17, 0.05, x=-0.05, z=0.09, m=EGG_WHITE), sphere(0.08, x=-0.05, z=0.14, m=YOLK, scale=(1, 1, 0.5)),
    cyl(0.12, 0.05, x=0.16, y=0.05, z=0.09, m=EGG_WHITE), sphere(0.06, x=0.16, y=0.05, z=0.14, m=YOLK, scale=(1, 1, 0.5)),
    cyl(0.4, 0.09, z=0.2, m=BREAD, v=3, rot=(0, 0, math.radians(12))),
], smooth=False)

# v8 muffin — forminha + topo + gotas de chocolate
item("muffin", [
    cyl(0.2, 0.26, m=PAPER_PINK, r2=0.26, v=16),
    sphere(0.29, z=0.28, m=MUFFIN_TOP, scale=(1, 1, 0.65)),
    *[sphere(0.035, x=0.17 * math.cos(a), y=0.17 * math.sin(a), z=0.42, m=CHIP) for a in (0.3, 1.6, 2.7, 4.0, 5.2)],
    sphere(0.035, z=0.47, m=CHIP),
])

# v9 cookie — disco + gotas
item("cookie", [
    cyl(0.33, 0.07, m=COOKIE, v=20),
    *[sphere(0.04, x=r * math.cos(a), y=r * math.sin(a), z=0.075, m=CHIP, scale=(1, 1, 0.6))
      for r, a in ((0.2, 0.2), (0.12, 1.4), (0.22, 2.4), (0.1, 3.6), (0.22, 4.6), (0.15, 5.6), (0.0, 0.0))],
])

# v10 apple pie — prato + torta com treliça + maçã
item("apple-pie", [
    cyl(0.42, 0.04, m=DISH, r2=0.46),
    cyl(0.36, 0.12, z=0.04, m=PIE_CRUST, r2=0.34),
    cyl(0.33, 0.01, z=0.16, m=PIE_FILL),
    *[box(0.62, 0.05, 0.03, y=o, z=0.175, m=PIE_CRUST) for o in (-0.18, 0.0, 0.18)],
    *[box(0.05, 0.62, 0.03, x=o, z=0.18, m=PIE_CRUST) for o in (-0.18, 0.0, 0.18)],
    sphere(0.12, x=0.4, y=-0.3, z=0.12, m=APPLE_RED), cyl(0.012, 0.07, x=0.4, y=-0.3, z=0.22, m=STEM),
], size=0.62)

# v11 small / medium / large — três copos de café com tampa
cups = []
for i, (h, r) in enumerate(((0.28, 0.11), (0.38, 0.13), (0.5, 0.15))):
    x = (i - 1) * 0.36
    cups += [cyl(r * 0.8, h, x=x, m=COFFEE_CUP, r2=r), cyl(r * 0.95, h * 0.35, x=x, z=h * 0.3, m=SLEEVE, r2=r * 1.02),
             cyl(r * 1.05, 0.04, x=x, z=h, m=LID, r2=r * 0.9)]
item("sizes", cups, size=0.7)

# v12 for here / to go — bandeja (aqui) + sacola de papel (viagem)
item("here-or-go", [
    box(0.5, 0.36, 0.03, x=-0.32, z=0.015, m=TRAY), cyl(0.07, 0.16, x=-0.4, z=0.03, m=WHITE), sphere(0.08, x=-0.2, z=0.07, m=MUFFIN_TOP, scale=(1, 1, 0.6)),
    box(0.3, 0.2, 0.42, x=0.3, z=0.21, m=KRAFT), box(0.3, 0.2, 0.06, x=0.3, z=0.45, m=KRAFT, rot=(math.radians(-18), 0, 0)),
    torus(0.07, 0.012, x=0.3, y=0, z=0.5, m=KRAFT, rot=(math.pi / 2, 0, 0)),
], size=0.75, smooth=False)

# v13 How much is it? — etiqueta de preço com $ e ?
item("price-tag", [
    box(0.42, 0.04, 0.3, z=0.15, m=TAG, rot=(0, 0, 0)),
    cyl(0.15, 0.04, x=0.21, z=0.15, m=TAG, v=3, rot=(math.pi / 2, 0, math.pi / 2)),
    torus(0.03, 0.01, x=0.26, y=0, z=0.15, m=INK, rot=(math.pi / 2, 0, 0)),
    text("$?", 0.2, x=-0.04, y=-0.035, z=0.15, m=INK, depth=0.008),
], smooth=False)

# v14 Here you are. — cédula sendo entregue + recibo
item("here-you-are", [
    box(0.56, 0.26, 0.012, z=0.08, m=NOTE, rot=(math.radians(-12), math.radians(8), 0)),
    cyl(0.07, 0.014, x=0.0, y=0.0, z=0.087, m=NOTE_DARK, rot=(math.radians(-12), math.radians(8), 0)),
    text("$", 0.12, x=0.0, y=-0.02, z=0.12, m=NOTE_DARK, rot=(math.radians(78), 0, 0), depth=0.005),
    box(0.22, 0.012, 0.34, x=0.33, y=0.06, z=0.17, m=WHITE, rot=(0, 0, math.radians(-10))),
    *[box(0.15, 0.014, 0.012, x=0.33, y=0.05, z=0.12 + k * 0.05, m=INK, rot=(0, 0, math.radians(-10))) for k in range(4)],
], size=0.7, smooth=False)

# v15 change — pilhas de moedas
coins = []
for k in range(5):
    coins.append(cyl(0.12, 0.025, z=k * 0.027, m=GOLD))
for k in range(3):
    coins.append(cyl(0.1, 0.025, x=0.25, y=0.08, z=k * 0.027, m=SILVER))
coins.append(cyl(0.12, 0.025, x=-0.2, y=0.15, z=0.0, m=GOLD, rot=(math.radians(60), 0, 0)))
item("change", coins, size=0.55)

# v16 Anything else? — balão de fala com + e ?
item("anything-else", [
    sphere(0.4, z=0.45, m=BUBBLE, scale=(1, 0.35, 0.75)),
    cyl(0.12, 0.25, x=-0.2, z=0.0, m=BUBBLE, r2=0.0, v=12, rot=(0, math.radians(200), 0)),
    text("+?", 0.32, y=-0.15, z=0.45, m=BRAND, depth=0.04),
], size=0.7)

# ------------------------------------------------------------------ CLIENTE (modo Café Rush)
customer = combine("Customer", [
    cyl(0.32, 0.9, m=HOODIE, r2=0.26),
    cyl(0.1, 0.12, z=0.88, m=SKIN),
    sphere(0.3, z=1.2, m=SKIN),
    sphere(0.33, z=1.3, y=0.07, m=HAIR, scale=(1.02, 1.0, 0.72)),
    sphere(0.06, x=-0.2, y=-0.22, z=1.13, m=mat("cheeks", srgb("#e8907a"), 0.7)), sphere(0.06, x=0.2, y=-0.22, z=1.13, m=MATS["cheeks"]),
    sphere(0.035, x=-0.1, y=-0.27, z=1.2, m=INK), sphere(0.035, x=0.1, y=-0.27, z=1.2, m=INK),
    smile(0.08, 0.015, y=-0.275, z=1.12, m=INK),
    sphere(0.1, x=-0.33, z=0.7, m=HOODIE), sphere(0.1, x=0.33, z=0.7, m=HOODIE),
], smooth=True)
customer.scale = (1.25, 1.25, 1.25)
customer.location = (0, 1.7, 0)  # do outro lado do balcão (+Y no Blender = fundo da cena)

# ------------------------------------------------------------------ CENÁRIO
FLOOR = mat("env-floor", srgb("#e0b98a"), 0.85)
WALL = mat("env-wall", srgb("#ffe9c7"), 0.95)
COUNTER = mat("env-counter", srgb("#ff6b4a"), 0.6)
COUNTER_TOP = mat("env-counter-top", srgb("#fff3e6"), 0.35)
BOARD = mat("env-board", srgb("#2d2a26"), 0.9)
CHALK = mat("env-chalk", srgb("#ffc93c"), 0.8, emit=0.6)
LAMP = mat("env-lamp", srgb("#5b3df5"), 0.4)
BULB = mat("env-bulb", srgb("#fff2c4"), 0.3, emit=4.0)
POT = mat("env-pot", srgb("#ff6b4a"), 0.7)
WINDOW = mat("env-window", srgb("#bfe7ff"), 0.2, emit=0.8)

def env(name, parts, smooth=False):
    o = combine(name, parts, size=None, smooth=smooth)
    return o

env("env-floor", [box(14, 10, 0.1, y=2, z=-0.05, m=FLOOR)])
env("env-wall", [box(14, 0.1, 6, y=4.0, z=3, m=WALL),
                 box(2.2, 0.06, 1.4, x=-3.6, y=3.93, z=2.3, m=WINDOW), box(2.3, 0.08, 0.08, x=-3.6, y=3.9, z=1.58, m=LAMP)])
env("env-counter", [box(6.0, 0.9, 1.0, y=-0.1, z=0.5, m=COUNTER), box(6.2, 1.0, 0.07, y=-0.1, z=1.03, m=COUNTER_TOP)])
env("env-menu-board", [box(2.4, 0.06, 1.3, x=1.9, y=3.9, z=2.5, m=BOARD),
                       text("MENU", 0.32, x=1.9, y=3.85, z=2.95, m=CHALK, depth=0.01),
                       *[box(1.7, 0.02, 0.05, x=1.9, y=3.86, z=2.6 - k * 0.22, m=CHALK) for k in range(4)]])
env("env-lamps", [part for x in (-1.6, 0.0, 1.6) for part in (
    cyl(0.01, 1.2, x=x, y=1.2, z=3.0, m=INK), cyl(0.32, 0.28, x=x, y=1.2, z=2.75, m=LAMP, r2=0.08),
    sphere(0.1, x=x, y=1.2, z=2.74, m=BULB))], smooth=True)
env("env-plants", [part for x in (-5.2, 5.2) for part in (
    cyl(0.3, 0.5, x=x, y=3.2, m=POT, r2=0.38), sphere(0.5, x=x, y=3.2, z=0.95, m=LEAF), sphere(0.35, x=x + 0.25, y=3.0, z=1.3, m=LEAF))], smooth=True)

# ------------------------------------------------------------------ exportação
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.abspath(OUT), export_format="GLB", export_apply=True,
    export_yup=True, export_texcoords=True, export_normals=True, export_materials="EXPORT",
    export_cameras=False, export_lights=False,
)
print(f"OK: {OUT} — {len(items)} itens, carta, cliente e cenário")
