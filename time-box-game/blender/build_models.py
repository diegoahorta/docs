"""
Modelos 3D do jogo "Time Box: Grammar Voyager", gerados por código no Blender.

    blender --background --python blender/build_models.py
    # ou:  pip install bpy && python3 blender/build_models.py

Gera ../models/*.glb: a nave (uma cabine telefônica britânica azul), 8 planetas
(com cores por vértice), asteroide e estação espacial.
Convenção: frente da nave em -Y no Blender (vira +Z no glTF).
"""
import math
import os
import random

import bpy  # noqa: I001 (bpy precisa vir antes de bmesh/mathutils)
import bmesh
from mathutils import Color, Vector, noise

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
os.makedirs(OUT, exist_ok=True)
random.seed(11)
_mats = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def mat(name, color, rough=0.5, metal=0.0, emit=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    rgba = (*[c / 255 for c in color], 1.0)
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = rgba
        b.inputs["Emission Strength"].default_value = emit
    _mats[name] = m
    return m


def setmat(o, m):
    o.data.materials.clear()
    o.data.materials.append(m)
    return o


def empty(name):
    o = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(o)
    return o


def box(name, loc, size, m, root, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    setmat(o, m)
    if bevel:
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bv = o.modifiers.new("bevel", "BEVEL")
        bv.width = bevel
        bv.segments = 2
    o.parent = root
    return o


def cyl(name, loc, r, depth, m, root, verts=16, r2=None, rot=(0, 0, 0)):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    setmat(o, m)
    for p in o.data.polygons:
        p.use_smooth = verts > 8
    o.parent = root
    return o


def export(root, filename):
    bpy.ops.object.select_all(action="DESELECT")

    def sel(o):
        o.select_set(True)
        for c in o.children:
            sel(c)

    sel(root)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, filename), export_format="GLB", use_selection=True,
                              export_apply=True, export_vertex_color="ACTIVE", export_yup=True)
    print("exported", filename)


# ------------------------------------------------------------------ a nave (cabine azul)
def build_timebox():
    reset()
    root = empty("TimeBox")
    blue = mat("BoxBlue", (28, 58, 120), rough=0.55)
    blue_d = mat("BoxBlueDark", (18, 40, 88), rough=0.6)
    sign = mat("SignBlack", (12, 14, 22), rough=0.4)
    glass = mat("Window", (225, 240, 255), rough=0.1, emit=1.4)
    lamp = mat("Lamp", (200, 235, 255), rough=0.05, emit=4.0)
    plate = mat("Plate", (245, 245, 235), rough=0.4, emit=0.4)
    metal = mat("Handle", (200, 200, 210), rough=0.25, metal=0.9)

    W, H = 1.2, 2.4
    box("Plinth", (0, 0, 0.08), (1.5, 1.5, 0.16), blue_d, root, bevel=0.02)
    box("Body", (0, 0, 0.16 + H / 2), (W, W, H), blue, root)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f"Post{sx}{sy}", (sx * 0.66, sy * 0.66, 0.16 + 1.3), (0.18, 0.18, 2.6), blue, root, bevel=0.02)
    # 4 faces: painéis, janelas e placa
    faces = [((0, -1), 0.0), ((0, 1), math.pi), ((-1, 0), -math.pi / 2), ((1, 0), math.pi / 2)]
    for fi, ((nx, ny), _a) in enumerate(faces):
        n = Vector((nx, ny, 0))
        t = Vector((-ny, nx, 0))  # tangente da face
        d = W / 2 + 0.01
        for side in (-1, 1):  # duas portas por face
            cx = side * 0.28
            # janelas (2 colunas x 3 linhas) na parte de cima
            for r in range(3):
                for c in range(2):
                    p = n * d + t * (cx + (c - 0.5) * 0.2) + Vector((0, 0, 2.05 + (r - 1) * 0.15))
                    sz = Vector((0.16, 0.16, 0.12))
                    sz = Vector((abs(t.x) * sz.x + abs(n.x) * 0.02, abs(t.y) * sz.x + abs(n.y) * 0.02, sz.z))
                    box(f"Win{fi}{side}{r}{c}", p, sz, glass, root)
            # painéis rebaixados
            for r in range(3):
                p = n * (d + 0.005) + t * cx + Vector((0, 0, 0.5 + r * 0.45))
                sz = Vector((abs(t.x) * 0.42 + abs(n.x) * 0.03, abs(t.y) * 0.42 + abs(n.y) * 0.03, 0.34))
                box(f"Panel{fi}{side}{r}", p, sz, blue_d, root)
        # caixa da placa luminosa abaixo do teto (o texto é aplicado no jogo)
        p = n * (W / 2 + 0.07) + Vector((0, 0, 2.5))
        sz = Vector((abs(t.x) * 1.22 + abs(n.x) * 0.1, abs(t.y) * 1.22 + abs(n.y) * 0.1, 0.2))
        box(f"Sign{fi}", p, sz, sign, root)
    # aviso branco e maçaneta na porta da frente
    box("Notice", (0.28, -W / 2 - 0.03, 1.55), (0.3, 0.02, 0.3), plate, root)
    cyl("Handle", (-0.06, -W / 2 - 0.05, 1.2), 0.025, 0.12, metal, root, verts=8, rot=(math.pi / 2, 0, 0))
    # teto em degraus + lâmpada
    box("Roof1", (0, 0, 2.66), (1.42, 1.42, 0.14), blue, root, bevel=0.02)
    box("Roof2", (0, 0, 2.78), (1.25, 1.25, 0.1), blue, root, bevel=0.02)
    cyl("Roof3", (0, 0, 2.93), 0.85, 0.2, blue, root, verts=4, r2=0.3, rot=(0, 0, math.pi / 4))
    cyl("LampBase", (0, 0, 3.06), 0.12, 0.06, blue_d, root)
    cyl("Lamp", (0, 0, 3.18), 0.09, 0.2, lamp, root)
    cyl("LampCap", (0, 0, 3.31), 0.12, 0.06, blue_d, root, r2=0.04)
    export(root, "timebox.glb")


# ------------------------------------------------------------------ planetas com cores por vértice
def color_planet(o, fn):
    me = o.data
    ca = me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            c = fn(v.normalized(), v)
            # cores pensadas em sRGB -> atributo linear
            ca.data[li].color = (c[0] ** 2.2, c[1] ** 2.2, c[2] ** 2.2, 1)
    me.color_attributes.active_color = ca


def lerp(a, b, t):
    t = max(0.0, min(1.0, t))
    return [a[i] + (b[i] - a[i]) * t for i in range(3)]


def hexc(h):
    return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]


def planet(name, filename, colfn, bump=0.04, ring=None, ico=False, emit_ring=False, extra=None):
    reset()
    root = empty(name)
    if ico:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1)
    o = bpy.context.active_object
    o.name = "Surface"
    if bump:
        for v in o.data.vertices:
            n = v.co.normalized()
            v.co = n * (1 + bump * noise.fractal(n * 2.5, 1.0, 2.0, 4))
    color_planet(o, colfn)
    setmat(o, mat("PlanetSurface", (255, 255, 255), rough=0.8))
    if not ico:
        for p in o.data.polygons:
            p.use_smooth = True
    o.parent = root
    if ring:
        r1, r2, col = ring
        bpy.ops.mesh.primitive_circle_add(vertices=96, radius=r2, fill_type="NOTHING")
        rg = bpy.context.active_object
        bm = bmesh.new()
        bm.from_mesh(rg.data)
        outer = list(bm.verts)
        inner = [bm.verts.new(v.co * (r1 / r2)) for v in outer]
        for i in range(len(outer)):
            j = (i + 1) % len(outer)
            bm.faces.new((outer[i], outer[j], inner[j], inner[i]))
        bm.to_mesh(rg.data)
        bm.free()
        rg.name = "Ring"
        rg.rotation_euler = (math.radians(18), math.radians(14), 0)
        sol = rg.modifiers.new("sol", "SOLIDIFY")
        sol.thickness = 0.02
        setmat(rg, mat("Ring", col, rough=0.6, emit=2.5 if emit_ring else 0.0))
        rg.parent = root
    if extra:
        extra(root)
    export(root, filename)


def build_planets():
    ocean, deep, land, grass, ice = hexc("#2a7fd4"), hexc("#163d8a"), hexc("#c9b26b"), hexc("#3fae4f"), hexc("#f2f8ff")

    def earthlike(n, v):
        h = noise.fractal(n * 1.8, 1.0, 2.0, 5)
        if abs(n.z) > 0.85:
            return ice
        if h > 0.12:
            return lerp(grass, land, (h - 0.12) * 3)
        return lerp(deep, ocean, h + 0.6)

    planet("Routine", "planet_routine.glb", earthlike, bump=0.03)

    def gas(c1, c2, c3, freq=9):
        a, b, c = hexc(c1), hexc(c2), hexc(c3)

        def f(n, v):
            t = math.sin(n.z * freq + noise.noise(n * 3) * 1.6)
            return lerp(lerp(a, b, t * 0.5 + 0.5), c, max(0, noise.noise(n * 6)) * 0.8)
        return f

    planet("Now", "planet_now.glb", gas("#ff8a3d", "#ffd28a", "#b5452a"), bump=0, ring=(1.35, 2.1, (255, 200, 150)))

    def crystal(n, v):
        k = noise.noise(n * 3) * 0.5 + 0.5
        return lerp(hexc("#5b2bb5"), hexc("#e3a6ff"), k + random.uniform(-0.15, 0.15))

    planet("Spelling", "planet_spelling.glb", crystal, bump=0.12, ico=True)

    def lava(n, v):
        cr = abs(noise.noise(n * 4))
        if cr < 0.06:
            return hexc("#ffcf3a")
        if cr < 0.12:
            return hexc("#ff4a1c")
        return lerp(hexc("#2a1414"), hexc("#5a2a22"), noise.noise(n * 8) * 0.5 + 0.5)

    planet("Negatives", "planet_negatives.glb", lava, bump=0.06)
    planet("Questions", "planet_questions.glb", gas("#bfe9ff", "#ffffff", "#5fb7e8", freq=6), bump=0.02,
           ring=(1.3, 1.9, (170, 230, 255)))
    planet("Markers", "planet_markers.glb", gas("#f2c14e", "#fff1b8", "#c97b1e", freq=14), bump=0.03)

    def split(n, v):
        # metade dia, metade noite: o planeta do contraste
        day = n.x + noise.noise(n * 3) * 0.15 > 0
        if day:
            return lerp(hexc("#58c4ff"), hexc("#ffe27a"), noise.noise(n * 4) * 0.5 + 0.5)
        lights = noise.noise(n * 20) > 0.45
        return hexc("#ffd36b") if lights else lerp(hexc("#0b1236"), hexc("#26306b"), noise.noise(n * 4) * 0.5 + 0.5)

    planet("Contrast", "planet_contrast.glb", split, bump=0.03)

    def paradox(n, v):
        return lerp(hexc("#05030a"), hexc("#2a0f40"), noise.noise(n * 5) * 0.5 + 0.5)

    def disk_extra(root):
        bpy.ops.mesh.primitive_torus_add(major_radius=1.6, minor_radius=0.06, major_segments=64, minor_segments=8)
        t = bpy.context.active_object
        t.name = "Halo"
        t.rotation_euler = (math.radians(18), math.radians(14), 0)
        setmat(t, mat("Halo", (255, 240, 200), emit=5))
        t.parent = root

    planet("Paradox", "planet_paradox.glb", paradox, bump=0.0, ring=(1.25, 2.6, (255, 140, 40)), emit_ring=True,
           extra=disk_extra)


def build_asteroid():
    reset()
    root = empty("Asteroid")
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1)
    o = bpy.context.active_object
    for v in o.data.vertices:
        n = v.co.normalized()
        v.co = n * (1 + 0.28 * noise.fractal(n * 1.6, 1.0, 2.0, 4))
    o.scale = (1.3, 1.0, 0.85)

    def col(n, v):
        return lerp(hexc("#4a4552"), hexc("#8d8494"), noise.noise(n * 5) * 0.5 + 0.5)

    color_planet(o, col)
    setmat(o, mat("Rock", (255, 255, 255), rough=0.95))
    o.parent = root
    export(root, "asteroid.glb")


def build_station():
    reset()
    root = empty("Station")
    hull = mat("Hull", (210, 214, 224), rough=0.35, metal=0.6)
    panel = mat("Solar", (30, 60, 140), rough=0.2, metal=0.5, emit=0.3)
    light = mat("Beacon", (255, 120, 60), emit=4)
    cyl("Hub", (0, 0, 0), 0.5, 1.6, hull, root, verts=20, rot=(math.pi / 2, 0, 0))
    bpy.ops.mesh.primitive_torus_add(major_radius=1.6, minor_radius=0.12, major_segments=48, minor_segments=10,
                                     rotation=(math.pi / 2, 0, 0))
    t = bpy.context.active_object
    setmat(t, hull)
    t.parent = root
    for k in range(4):
        a = k * math.pi / 2
        s = cyl(f"Spoke{k}", (0, 0, 0), 0.05, 3.2, hull, root, verts=8, rot=(0, a + math.pi / 2, 0))
        s.rotation_euler = (math.pi / 2, 0, a)
        s.rotation_euler = (0, math.pi / 2, 0) if k % 2 == 0 else (0, 0, 0)
    for sy in (-1, 1):
        box(f"Solar{sy}", (0, sy * 1.6, 0), (2.4, 0.5, 0.03), panel, root)
        cyl(f"Arm{sy}", (0, sy * 1.0, 0), 0.04, 1.0, hull, root, verts=6, rot=(math.pi / 2, 0, 0))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(0, -0.85, 0))
    b = bpy.context.active_object
    setmat(b, light)
    b.parent = root
    export(root, "station.glb")


if __name__ == "__main__":
    build_timebox()
    build_planets()
    build_asteroid()
    build_station()
    print("OK", os.path.abspath(OUT))
