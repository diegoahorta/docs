"""
Modelos 3D do jogo "Lua à Paris", gerados por código no Blender.

    blender --background --python blender/build_models.py
    # ou:  pip install bpy && python3 blender/build_models.py

Gera ../models/*.glb: a viajante Lua (com braços e pernas articulados), o chão de Paris com o rio Sena,
Torre Eiffel, Arco do Triunfo, Louvre, Notre-Dame, café, prédio haussmanniano, estação, avião,
ponte, árvore e poste.
Convenção: frente em -Y no Blender (vira +Z no glTF). Coordenadas do mapa: x_three = x, z_three = -y.
"""
import math
import os
import random

import bpy  # noqa: I001 (bpy precisa vir antes de bmesh/mathutils)
import bmesh
from mathutils import Vector, noise

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
os.makedirs(OUT, exist_ok=True)
random.seed(5)
_mats = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def mat(name, color, rough=0.6, metal=0.0, emit=0.0, alpha=1.0):
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
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            pass
    _mats[name] = m
    return m


def setmat(o, m):
    o.data.materials.clear()
    o.data.materials.append(m)
    return o


def smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    bpy.context.scene.collection.objects.link(o)
    o.parent = parent
    return o


def box(name, loc, size, m, root, rot=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    setmat(o, m)
    if bevel:
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = 2
    o.parent = root
    return o


def sphere(name, loc, scale, m, root, seg=20, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    setmat(o, m)
    smooth(o)
    o.parent = root
    return o


def cyl(name, loc, r, depth, m, root, verts=16, r2=None, rot=(0, 0, 0), sm=True):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    setmat(o, m)
    if sm:
        smooth(o)
    o.parent = root
    return o


def beam(name, a, b, r, m, root, verts=6):
    a, b = Vector(a), Vector(b)
    d = b - a
    o = cyl(name, (a + b) / 2, r, d.length, m, root, verts=verts, sm=False)
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return o


def boolean_cut(target, cutter):
    mod = target.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter)


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


# ------------------------------------------------------------------ Lua, a viajante
def build_lua():
    reset()
    root = empty("Lua")
    skin = mat("Skin", (176, 118, 84), rough=0.7)
    hair = mat("Hair", (46, 28, 22), rough=0.6)
    beret = mat("Beret", (214, 40, 57), rough=0.8)
    coat = mat("Coat", (247, 160, 190), rough=0.7)
    scarf = mat("Scarf", (255, 214, 92), rough=0.8)
    tights = mat("Tights", (40, 34, 50), rough=0.7)
    shoe = mat("Shoe", (250, 250, 250), rough=0.5)
    eye = mat("Eye", (24, 18, 22), rough=0.2)
    shine = mat("Shine", (255, 255, 255), emit=1.5)
    lips = mat("Lips", (190, 60, 90), rough=0.4)
    cheek = mat("Cheek", (230, 120, 130), rough=0.8)
    bag = mat("Bag", (60, 150, 140), rough=0.5)
    gold = mat("Gold", (240, 200, 90), rough=0.3, metal=0.8)

    # pernas (pivô no quadril)
    for s, nm in ((1, "LegL"), (-1, "LegR")):
        leg = empty(nm, (0.11 * s, 0, 0.82), root)
        cyl(f"{nm}Mesh", (0, 0, -0.38), 0.065, 0.76, tights, leg, verts=12)
        sphere(f"{nm}Shoe", (0, -0.05, -0.78), (0.08, 0.14, 0.06), shoe, leg)
    # casaco em forma de sino (trapézio)
    cyl("Coat", (0, 0, 1.08), 0.27, 0.62, coat, root, verts=24, r2=0.17)
    cyl("CoatTop", (0, 0, 1.43), 0.17, 0.12, coat, root, verts=24, r2=0.15)
    for i, z in enumerate((1.0, 1.15, 1.3)):
        sphere(f"Button{i}", (0, -0.24 + (z - 1.0) * 0.21, z), (0.022, 0.012, 0.022), gold, root)
    # cachecol
    bpy.ops.mesh.primitive_torus_add(major_radius=0.13, minor_radius=0.05, location=(0, 0, 1.5))
    t = bpy.context.active_object
    t.name = "Scarf"
    setmat(t, scarf)
    smooth(t)
    t.parent = root
    box("ScarfEnd", (0.07, -0.13, 1.36), (0.07, 0.03, 0.22), scarf, root, rot=(0.15, 0, 0.1))
    # braços (pivô no ombro)
    for s, nm in ((1, "ArmL"), (-1, "ArmR")):
        arm = empty(nm, (0.2 * s, 0, 1.42), root)
        a = cyl(f"{nm}Sleeve", (0.04 * s, 0, -0.25), 0.055, 0.5, coat, arm, verts=12, r2=0.065)
        a.rotation_euler = (0, -0.18 * s, 0)
        sphere(f"{nm}Hand", (0.09 * s, 0, -0.52), (0.05, 0.05, 0.055), skin, arm)
    # bolsa a tiracolo
    box("Bag", (0.3, -0.02, 0.98), (0.07, 0.2, 0.16), bag, root, bevel=0.02)
    beam("Strap", (0.3, 0, 1.06), (-0.14, 0, 1.46), 0.012, bag, root)
    # cabeça
    cyl("Neck", (0, 0, 1.55), 0.05, 0.1, skin, root, verts=10)
    head = sphere("Head", (0, 0, 1.74), (0.17, 0.16, 0.19), skin, root, seg=28, rings=16)
    # cabelo: calota + mechas longas + franja
    sphere("HairCap", (0, 0.025, 1.78), (0.185, 0.18, 0.19), hair, root, seg=28, rings=16)
    sphere("HairBack", (0, 0.07, 1.58), (0.18, 0.12, 0.24), hair, root)
    sphere("Bangs", (0, -0.12, 1.86), (0.15, 0.07, 0.06), hair, root)
    # boina
    sphere("Beret", (0.02, 0.01, 1.94), (0.21, 0.2, 0.06), beret, root, seg=28)
    cyl("BeretStem", (0.02, 0.01, 2.0), 0.012, 0.04, beret, root, verts=6)
    # rosto
    for s in (1, -1):
        sphere(f"Eye{s}", (0.06 * s, -0.152, 1.75), (0.024, 0.012, 0.03), eye, root)
        sphere(f"Shine{s}", (0.066 * s, -0.162, 1.762), (0.007, 0.004, 0.007), shine, root)
        sphere(f"Cheek{s}", (0.1 * s, -0.135, 1.69), (0.03, 0.01, 0.018), cheek, root)
        sphere(f"Earring{s}", (0.168 * s, -0.01, 1.66), (0.015, 0.015, 0.015), gold, root)
    sphere("Smile", (0, -0.158, 1.655), (0.04, 0.01, 0.013), lips, root)
    export(root, "lua.glb")


# ------------------------------------------------------------------ chão de Paris + Sena
def river_y(x):
    """centro do rio no Blender (y); no three.js z = -y."""
    return 6 * math.sin(x * 0.08) - 4


def build_ground():
    reset()
    root = empty("Paris")
    R = 62
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=160, y_subdivisions=160, size=2 * R)
    g = bpy.context.active_object
    g.name = "Ground"
    bm = bmesh.new()
    bm.from_mesh(g.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().length > R], context="FACES")
    bm.to_mesh(g.data)
    bm.free()
    me = g.data
    for v in me.vertices:
        x, y = v.co.x, v.co.y
        d = abs(y - river_y(x))
        if d < 3.2:
            v.co.z = -0.7 * (1 - (d / 3.2) ** 2)
    ca = me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    stone = (0.86, 0.8, 0.7)
    street = (0.72, 0.68, 0.64)
    grass = (0.55, 0.75, 0.42)
    bank = (0.6, 0.6, 0.58)
    for poly in me.polygons:
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            x, y = co.x, co.y
            d = abs(y - river_y(x))
            c = stone
            if (abs((x + 0.5) % 9 - 4.5) < 0.6) or (abs((y + 0.5) % 9 - 4.5) < 0.6):
                c = street
            # parques: Champ de Mars, Tuileries, Jardin du Luxembourg
            for px, py, pr in ((-36, -16, 9), (2, 10, 6), (-10, -24, 7), (30, 30, 7)):
                if math.hypot(x - px, y - py) < pr + noise.noise(Vector((x * 0.3, y * 0.3, 0))) * 1.5:
                    c = grass
            if d < 3.4:
                c = bank
            n = noise.noise(Vector((x * 0.4, y * 0.4, 1))) * 0.05
            ca.data[li].color = ((c[0] + n) ** 2.2, (c[1] + n) ** 2.2, (c[2] + n) ** 2.2, 1)
    me.color_attributes.active_color = ca
    setmat(g, mat("GroundMat", (255, 255, 255), rough=0.95))
    smooth(g)
    g.parent = root
    # borda do diorama
    cyl("Rim", (0, 0, -2.0), R + 0.3, 2.4, mat("Rim", (120, 96, 140), rough=0.6), root, verts=96)
    export(root, "ground.glb")

    # rio Sena (fita com UV ao longo do comprimento para animar a água)
    reset()
    root = empty("Seine")
    pts = [x * 0.5 for x in range(-130, 131)]
    verts, faces, uvs = [], [], []
    for i, x in enumerate(pts):
        y = river_y(x)
        dy = 0.48 * math.cos(x * 0.08)
        n = Vector((-dy, 1, 0)).normalized()
        for s in (-1, 1):
            verts.append((x + n.x * 2.7 * s, y + n.y * 2.7 * s, -0.35))
    for i in range(len(pts) - 1):
        a = i * 2
        faces.append((a, a + 2, a + 3, a + 1))
    me = bpy.data.meshes.new("Seine")
    me.from_pydata(verts, [], faces)
    uv = me.uv_layers.new(name="UVMap")
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            uv.data[li].uv = ((vi // 2) / 20.0, vi % 2)
    o = bpy.data.objects.new("Seine", me)
    bpy.context.scene.collection.objects.link(o)
    setmat(o, mat("Water", (70, 140, 190), rough=0.1))
    o.parent = root
    export(root, "seine.glb")


# ------------------------------------------------------------------ monumentos
def build_eiffel():
    reset()
    root = empty("Eiffel")
    iron = mat("Iron", (120, 92, 72), rough=0.6, metal=0.3)
    gold = mat("TopLight", (255, 220, 140), emit=2.5)
    H = 14.0

    def half_width(z):
        # perfil curvo da torre
        return 3.2 * math.exp(-z / 4.2) + 0.25

    # 4 pernas formadas por vigas em treliça
    levels = [0, 1.5, 3.2, 5.2, 7.5, 10.0, 12.5, H]
    for sx in (-1, 1):
        for sy in (-1, 1):
            for k in range(len(levels) - 1):
                z0, z1 = levels[k], levels[k + 1]
                w0, w1 = half_width(z0), half_width(z1)
                a = Vector((sx * w0, sy * w0, z0))
                b = Vector((sx * w1, sy * w1, z1))
                beam(f"Leg{sx}{sy}{k}", a, b, 0.16 if z0 < 4 else 0.1, iron, root)
    # contraventamentos em X em cada face
    for k in range(len(levels) - 2):
        z0, z1 = levels[k], levels[k + 1]
        w0, w1 = half_width(z0), half_width(z1)
        for (ax, ay, bx, by) in ((1, 1, -1, 1), (1, -1, -1, -1), (1, 1, 1, -1), (-1, 1, -1, -1)):
            beam(f"X{k}a{ax}{ay}{bx}{by}", (ax * w0, ay * w0, z0), (bx * w1, by * w1, z1), 0.04, iron, root, verts=4)
            beam(f"X{k}b{ax}{ay}{bx}{by}", (bx * w0, by * w0, z0), (ax * w1, ay * w1, z1), 0.04, iron, root, verts=4)
    # arcos da base
    for rot in (0, math.pi / 2):
        bpy.ops.mesh.primitive_torus_add(major_radius=2.2, minor_radius=0.1, location=(0, 0, 0.4),
                                         rotation=(math.pi / 2, 0, rot), major_segments=32, minor_segments=6)
        t = bpy.context.active_object
        bm = bmesh.new()
        bm.from_mesh(t.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -0.1], context="VERTS")
        bm.to_mesh(t.data)
        bm.free()
        setmat(t, iron)
        t.parent = root
    # plataformas
    for z, w in ((3.2, 2.1), (7.5, 1.0)):
        box(f"Deck{z}", (0, 0, z), (w * 2 + 0.6, w * 2 + 0.6, 0.25), iron, root)
    box("Top", (0, 0, 12.5), (0.9, 0.9, 0.5), iron, root)
    cyl("Spire", (0, 0, 13.9), 0.12, 2.2, iron, root, verts=8, r2=0.03)
    sphere("Beacon", (0, 0, 13.2), (0.25, 0.25, 0.25), gold, root)
    export(root, "eiffel.glb")


def build_arc():
    reset()
    root = empty("Arc")
    stone = mat("ArcStone", (232, 220, 196), rough=0.85)
    trim = mat("ArcTrim", (210, 196, 170), rough=0.85)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 2.5))
    body = bpy.context.active_object
    body.scale = (4.6, 2.2, 5.0)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.95, depth=3, location=(0, 0, 2.2), rotation=(math.pi / 2, 0, 0))
    c1 = bpy.context.active_object
    boolean_cut(body, c1)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.1))
    c2 = bpy.context.active_object
    c2.scale = (1.9, 3, 2.2)
    boolean_cut(body, c2)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.55, depth=5, location=(0, 0, 1.6), rotation=(0, math.pi / 2, 0))
    boolean_cut(body, bpy.context.active_object)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.7))
    c4 = bpy.context.active_object
    c4.scale = (5, 1.1, 1.8)
    boolean_cut(body, c4)
    body.name = "Body"
    setmat(body, stone)
    body.parent = root
    box("Attic", (0, 0, 5.3), (4.8, 2.4, 0.6), trim, root)
    box("Cornice", (0, 0, 4.4), (4.75, 2.35, 0.15), trim, root)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f"Relief{sx}{sy}", (sx * 1.6, sy * 1.12, 2.7), (0.8, 0.06, 1.1), trim, root)
    export(root, "arc.glb")


def build_louvre():
    reset()
    root = empty("Louvre")
    glass = mat("Glass", (150, 200, 230), rough=0.05, metal=0.2, emit=0.25)
    frame = mat("Frame", (70, 70, 80), rough=0.4, metal=0.6)
    palace = mat("Palace", (226, 214, 188), rough=0.85)
    roof = mat("Roof", (110, 118, 140), rough=0.6)
    win = mat("PalaceWin", (90, 110, 140), rough=0.3)
    cyl("Pyramid", (0, 0, 1.6), 2.6, 3.2, glass, root, verts=4, r2=0.0, rot=(0, 0, math.pi / 4), sm=False)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        beam(f"Edge{k}", (math.cos(a) * 2.6, math.sin(a) * 2.6, 0), (0, 0, 3.2), 0.04, frame, root, verts=4)
    for z in (0.8, 1.6, 2.4):
        w = 2.6 * (1 - z / 3.2)
        for k in range(4):
            a1 = k * math.pi / 2 + math.pi / 4
            a2 = a1 + math.pi / 2
            beam(f"Ring{z}{k}", (math.cos(a1) * w, math.sin(a1) * w, z), (math.cos(a2) * w, math.sin(a2) * w, z), 0.025, frame, root, verts=4)
    box("Pool", (0, 0, 0.05), (9, 9, 0.1), mat("PoolWater", (110, 170, 210), rough=0.1), root)
    # alas do palácio em U atrás da pirâmide
    for name, loc, size in (("WingN", (0, 7, 2), (18, 3, 4)), ("WingW", (-7.5, 1.5, 2), (3, 11, 4)), ("WingE", (7.5, 1.5, 2), (3, 11, 4))):
        box(name, loc, size, palace, root)
        box(name + "Roof", (loc[0], loc[1], 4.45), (size[0], size[1], 0.9), roof, root)
    for i in range(9):
        x = -8 + i * 2
        box(f"WinN{i}", (x, 5.48, 2.2), (0.7, 0.05, 1.4), win, root)
    for i in range(4):
        for s in (-1, 1):
            box(f"WinS{i}{s}", (s * 5.98, -2.5 + i * 2, 2.2), (0.05, 0.7, 1.4), win, root)
    export(root, "louvre.glb")


def build_notredame():
    reset()
    root = empty("NotreDame")
    stone = mat("NDStone", (214, 204, 182), rough=0.9)
    dark = mat("NDDark", (60, 56, 70), rough=0.8)
    rose = mat("RoseWindow", (90, 120, 220), rough=0.2, emit=0.8)
    roof = mat("NDRoof", (90, 100, 120), rough=0.6)
    box("Facade", (0, 0, 3.2), (6.0, 1.6, 6.4), stone, root)
    for s in (-1, 1):
        box(f"Tower{s}", (s * 2.05, 0, 7.6), (1.9, 1.7, 2.6), stone, root)
        box(f"TowerWin{s}", (s * 2.05, -0.86, 7.7), (0.5, 0.05, 1.6), dark, root)
    for i, x in enumerate((-1.9, 0, 1.9)):
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.6, depth=0.1, location=(x, -0.81, 1.6), rotation=(math.pi / 2, 0, 0))
        d = bpy.context.active_object
        setmat(d, dark)
        d.parent = root
        box(f"Door{i}", (x, -0.81, 0.8), (1.2, 0.08, 1.6), dark, root)
    cyl("Rose", (0, -0.82, 4.6), 1.05, 0.08, rose, root, verts=32, rot=(math.pi / 2, 0, 0))
    for k in range(8):
        a = k * math.pi / 4
        beam(f"Spoke{k}", (0, -0.87, 4.6), (math.cos(a) * 1.0, -0.87, 4.6 + math.sin(a) * 1.0), 0.03, stone, root, verts=4)
    box("Gallery", (0, -0.82, 5.9), (5.6, 0.1, 0.4), dark, root)
    # nave atrás + flecha
    box("Nave", (0, 5, 3), (4, 8.5, 5.5), stone, root)
    cyl("NaveRoof", (0, 5, 6.2), 2.4, 8.5, roof, root, verts=3, rot=(math.pi / 2, 0, 0), sm=False).rotation_euler = (math.pi / 2, 0, math.pi / 2 * 0 + math.pi / 6 * 0)
    cyl("Spire", (0, 6, 8.5), 0.4, 4.0, roof, root, verts=8, r2=0.02, sm=False)
    export(root, "notredame.glb")


def build_cafe():
    reset()
    root = empty("Cafe")
    wall = mat("CafeWall", (250, 238, 220), rough=0.8)
    front = mat("CafeFront", (40, 90, 70), rough=0.5)
    glass = mat("CafeGlass", (255, 230, 170), rough=0.1, emit=0.9)
    red = mat("AwningRed", (200, 40, 55), rough=0.7)
    white = mat("AwningWhite", (250, 250, 250), rough=0.7)
    table = mat("Table", (60, 60, 70), rough=0.4, metal=0.6)
    chair = mat("Chair", (170, 120, 80), rough=0.7)
    roof = mat("Roof", (110, 118, 140), rough=0.6)
    box("Building", (0, 1.5, 3), (6, 3, 6), wall, root)
    box("Mansard", (0, 1.5, 6.5), (6.2, 3.2, 1.0), roof, root)
    for i in range(3):
        box(f"Upper{i}", (-2 + i * 2, -0.01, 4.4), (0.9, 0.05, 1.3), front, root)
        box(f"Balcony{i}", (-2 + i * 2, -0.15, 3.75), (1.1, 0.3, 0.08), table, root)
    box("Shopfront", (0, -0.02, 1.3), (6, 0.1, 2.6), front, root)
    for i in range(3):
        box(f"Window{i}", (-2 + i * 2, -0.08, 1.35), (1.5, 0.05, 1.8), glass, root)
    box("SignBoard", (0, -0.1, 2.85), (4, 0.08, 0.45), front, root)
    # toldo listrado
    for i in range(12):
        b = box(f"Awning{i}", (-2.75 + i * 0.5, -0.8, 2.35), (0.5, 1.6, 0.05), red if i % 2 == 0 else white, root)
        b.rotation_euler = (-0.35, 0, 0)
    # mesinhas e cadeiras
    for i, x in enumerate((-2, 0.2, 2.3)):
        cyl(f"TableTop{i}", (x, -2.6, 0.75), 0.4, 0.04, table, root, verts=16)
        cyl(f"TableLeg{i}", (x, -2.6, 0.37), 0.04, 0.74, table, root, verts=6)
        for s in (-1, 1):
            box(f"Seat{i}{s}", (x + s * 0.65, -2.6, 0.45), (0.38, 0.38, 0.05), chair, root)
            box(f"Back{i}{s}", (x + s * 0.83, -2.6, 0.7), (0.04, 0.38, 0.5), chair, root)
            for lx in (-0.15, 0.15):
                cyl(f"CL{i}{s}{lx}", (x + s * 0.65 + lx, -2.6, 0.22), 0.02, 0.44, chair, root, verts=4)
        cyl(f"Cup{i}", (x + 0.1, -2.6, 0.82), 0.06, 0.1, white, root, verts=10)
    export(root, "cafe.glb")


def build_haussmann():
    reset()
    root = empty("Haussmann")
    wall = mat("HWall", (236, 222, 196), rough=0.85)
    roof = mat("HRoof", (100, 112, 136), rough=0.6)
    win = mat("HWin", (120, 150, 180), rough=0.2, emit=0.15)
    iron = mat("HIron", (40, 40, 48), rough=0.5, metal=0.5)
    shop = mat("HShop", (120, 40, 60), rough=0.6)
    W, D, H = 5.0, 4.0, 6.5
    box("Body", (0, 0, H / 2), (W, D, H), wall, root)
    # telhado mansarda
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, H + 0.8))
    m = bpy.context.active_object
    m.scale = (W, D, 1.6)
    bpy.ops.object.transform_apply(scale=True)
    for v in m.data.vertices:
        if v.co.z > H + 0.8:
            v.co.x *= 0.78
            v.co.y *= 0.7
    m.name = "Mansard"
    setmat(m, roof)
    m.parent = root
    for c in (-1.6, 1.6):
        box(f"Chimney{c}", (c, 0, H + 1.9), (0.5, 0.4, 0.7), wall, root)
    box("ShopFront", (0, -D / 2 - 0.01, 1.0), (W, 0.05, 2.0), shop, root)
    for fl in range(3):
        z = 2.9 + fl * 1.2
        for i in range(4):
            x = -1.8 + i * 1.2
            for side in (-1, 1):
                box(f"W{fl}{i}{side}", (x, side * (D / 2 + 0.01), z), (0.6, 0.05, 0.85), win, root)
        box(f"Balcony{fl}", (0, -D / 2 - 0.18, z - 0.48), (W - 0.2, 0.36, 0.06), iron, root)
    for i in range(2):
        box(f"DW{i}", (-1 + i * 2, -D / 2 * 0.7, H + 1.0), (0.5, 0.05, 0.5), win, root)
    export(root, "haussmann.glb")


def build_station():
    reset()
    root = empty("Gare")
    stone = mat("GStone", (226, 212, 186), rough=0.85)
    glass = mat("GGlass", (170, 200, 220), rough=0.1, emit=0.3)
    roof = mat("GRoof", (100, 112, 136), rough=0.6)
    clock = mat("Clock", (255, 252, 235), emit=0.8)
    hand = mat("Hand", (20, 20, 20))
    box("Hall", (0, 2, 3), (12, 5, 6), stone, root)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=3.2, depth=0.2, location=(0, -0.45, 3.2), rotation=(math.pi / 2, 0, 0))
    arch = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(arch.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -0.01], context="VERTS")
    bm.to_mesh(arch.data)
    bm.free()
    setmat(arch, glass)
    arch.parent = root
    box("ArchLower", (0, -0.5, 1.6), (6.4, 0.15, 3.2), glass, root)
    for x in (-2, 0, 2):
        box(f"Mullion{x}", (x, -0.6, 2.8), (0.08, 0.05, 5.6), roof, root)
    box("Tower", (5.2, 0.5, 6), (2.2, 2.2, 12), stone, root)
    cyl("TowerRoof", (5.2, 0.5, 12.8), 1.6, 1.6, roof, root, verts=4, r2=0.2, rot=(0, 0, math.pi / 4), sm=False)
    cyl("ClockFace", (5.2, -0.62, 10), 0.8, 0.06, clock, root, verts=32, rot=(math.pi / 2, 0, 0))
    beam("HandH", (5.2, -0.68, 10), (5.2, -0.68, 10.45), 0.04, hand, root, verts=4)
    beam("HandM", (5.2, -0.69, 10), (5.75, -0.69, 10), 0.03, hand, root, verts=4)
    box("RoofTop", (0, 2, 6.3), (12.2, 5.2, 0.6), roof, root)
    # trem saindo
    train = mat("Train", (40, 80, 160), rough=0.4, metal=0.3)
    tw = mat("TrainWin", (220, 240, 255), emit=0.6)
    box("Train", (-3.5, -4.5, 0.9), (1.6, 6, 1.6), train, root, bevel=0.2)
    for k in range(4):
        for s in (-1, 1):
            box(f"TW{k}{s}", (-3.5 + s * 0.81, -6.5 + k * 1.3, 1.2), (0.03, 0.8, 0.5), tw, root)
    export(root, "gare.glb")


def build_plane():
    reset()
    root = empty("Plane")
    white = mat("PlaneWhite", (245, 246, 250), rough=0.4, metal=0.2)
    blue = mat("PlaneBlue", (30, 60, 150), rough=0.4)
    red = mat("PlaneRed", (210, 40, 55), rough=0.4)
    win = mat("PlaneWin", (40, 50, 70), rough=0.2)
    f = cyl("Fuselage", (0, 0, 1.3), 0.6, 8, white, root, verts=24, rot=(math.pi / 2, 0, 0))
    sphere("Nose", (0, -4, 1.3), (0.6, 0.9, 0.6), white, root)
    cyl("Tail", (0, 4.6, 1.3), 0.6, 1.4, white, root, verts=24, r2=0.15, rot=(-math.pi / 2, 0, 0))
    box("Wing", (0, 0.3, 1.1), (9, 1.6, 0.12), white, root)
    box("Stab", (0, 4.8, 1.5), (3.2, 0.8, 0.08), white, root)
    fin = box("Fin", (0, 4.7, 2.4), (0.1, 1.2, 1.8), blue, root)
    fin.rotation_euler = (0.35, 0, 0)
    box("FinRed", (0, 5.0, 3.0), (0.12, 0.5, 0.5), red, root)
    for s in (-1, 1):
        cyl(f"Engine{s}", (s * 2.2, -0.2, 0.75), 0.35, 1.3, blue, root, verts=16, rot=(math.pi / 2, 0, 0))
    for k in range(10):
        for s in (-1, 1):
            sphere(f"Win{k}{s}", (s * 0.59, -2.8 + k * 0.6, 1.5), (0.03, 0.12, 0.12), win, root, seg=8, rings=6)
    box("Stripe", (0, 0, 1.15), (1.22, 7.6, 0.12), blue, root)
    for (x, y) in ((0, -3.2), (-1, 0.6), (1, 0.6)):
        cyl(f"Gear{x}{y}", (x, y, 0.3), 0.2, 0.18, mat("Tire", (30, 30, 30)), root, verts=12, rot=(0, math.pi / 2, 0))
    box("Runway", (0, 0, 0.02), (4, 22, 0.04), mat("Runway", (70, 70, 78), rough=0.9), root)
    for k in range(9):
        box(f"Mark{k}", (0, -10 + k * 2.5, 0.05), (0.2, 1.2, 0.02), mat("Mark", (250, 250, 250)), root)
    export(root, "airport.glb")


def build_props():
    reset()
    root = empty("Tree")
    trunk = mat("Trunk", (110, 80, 60), rough=0.9)
    leaf = mat("Leaf", (90, 160, 80), rough=0.8)
    cyl("Trunk", (0, 0, 0.8), 0.12, 1.6, trunk, root, verts=8)
    for k, (x, y, z, s) in enumerate(((0, 0, 2.0, 0.9), (0.4, 0.2, 1.7, 0.6), (-0.35, -0.2, 1.8, 0.65), (0, 0.3, 2.5, 0.55))):
        o = sphere(f"Crown{k}", (x, y, z), (s, s, s * 0.9), leaf, root, seg=12, rings=8)
        for p in o.data.polygons:
            p.use_smooth = False
    export(root, "tree.glb")

    reset()
    root = empty("Lamp")
    iron = mat("LampIron", (40, 50, 50), rough=0.4, metal=0.6)
    light = mat("LampLight", (255, 220, 150), emit=3)
    cyl("Post", (0, 0, 1.4), 0.05, 2.8, iron, root, verts=8)
    cyl("Base", (0, 0, 0.15), 0.14, 0.3, iron, root, verts=8)
    cyl("Head", (0, 0, 3.0), 0.2, 0.4, light, root, verts=6, r2=0.12, sm=False)
    cyl("Cap", (0, 0, 3.3), 0.25, 0.2, iron, root, verts=6, r2=0.02, sm=False)
    export(root, "lamp.glb")

    reset()
    root = empty("Bridge")
    stone = mat("BridgeStone", (220, 208, 186), rough=0.85)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.6))
    b = bpy.context.active_object
    b.scale = (3.4, 8, 1.2)
    bpy.ops.object.transform_apply(scale=True)
    for y in (-2.2, 0, 2.2):
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.95, depth=5, location=(0, y, -0.2), rotation=(0, math.pi / 2, 0))
        boolean_cut(b, bpy.context.active_object)
    b.name = "Deck"
    setmat(b, stone)
    b.parent = root
    for s in (-1, 1):
        box(f"Rail{s}", (s * 1.6, 0, 1.4), (0.15, 8, 0.4), stone, root)
        for k in range(4):
            cyl(f"BL{s}{k}", (s * 1.6, -3 + k * 2, 2.1), 0.04, 1.0, mat("BIron", (40, 50, 50), metal=0.6), root, verts=6)
            sphere(f"BLL{s}{k}", (s * 1.6, -3 + k * 2, 2.65), (0.1, 0.1, 0.12), mat("BLight", (255, 220, 150), emit=3), root, seg=8, rings=6)
    export(root, "bridge.glb")


if __name__ == "__main__":
    build_lua()
    build_ground()
    build_eiffel()
    build_arc()
    build_louvre()
    build_notredame()
    build_cafe()
    build_haussmann()
    build_station()
    build_plane()
    build_props()
    print("OK", os.path.abspath(OUT))
