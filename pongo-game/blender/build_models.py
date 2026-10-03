"""
Gera os modelos 3D do jogo "Pongo e o Osso Perdido" com o Blender.

Uso (qualquer uma das opções):
    blender --background --python pongo-game/blender/build_models.py
    python3 pongo-game/blender/build_models.py        # com `pip install bpy`

Saída: pongo-game/models/*.glb  (glTF binário, eixo Y para cima)
Depois rode `python3 pongo-game/blender/embed_models.py` para gerar
pongo-game/models/models-data.js (os GLBs em base64, para o jogo abrir
direto via file:// sem servidor).

Convenções:
- Todos os modelos são low-poly, cores sólidas via Principled BSDF.
- O Pongo olha para -Y no Blender (vira +Z no glTF / Three.js).
- Partes animáveis do Pongo são empties nomeados (Head, Tail, Leg_FL,
  Leg_FR, Leg_BL, Leg_BR) com o pivô na articulação.
"""

import math
import os
import random

import bpy
from mathutils import Vector

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")


# ---------------------------------------------------------------- helpers

_materials = {}


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _materials.clear()


def mat(name, color, roughness=0.6, metallic=0.0, emission=None):
    key = name
    if key in _materials:
        return _materials[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 1.0
    _materials[key] = m
    return m


def hex_rgb(h):
    """'#rrggbb' -> linear RGB (Blender trabalha em espaço linear)."""
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def finish(obj, material, name, smooth=True, parent=None):
    obj.name = name
    obj.data.name = name
    obj.data.materials.clear()
    obj.data.materials.append(material)
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    if parent is not None:
        set_parent(obj, parent)
    return obj


def set_parent(child, parent):
    bpy.context.view_layer.update()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def sphere(name, material, loc, scale=(1, 1, 1), r=1.0, segs=18, rings=10, rot=(0, 0, 0), parent=None, smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings, radius=r, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    return finish(o, material, name, smooth, parent)


def ico(name, material, loc, scale=(1, 1, 1), r=1.0, subdiv=2, rot=(0, 0, 0), parent=None, jitter=0.0, seed=0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=r, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    if jitter:
        rnd = random.Random(seed)
        for v in o.data.vertices:
            v.co *= 1 + rnd.uniform(-jitter, jitter)
    return finish(o, material, name, smooth=False, parent=parent)


def cyl(name, material, loc, r=0.1, depth=1.0, verts=16, rot=(0, 0, 0), scale=(1, 1, 1), parent=None, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    return finish(o, material, name, smooth, parent)


def cone(name, material, loc, r1=0.1, r2=0.0, depth=1.0, verts=16, rot=(0, 0, 0), parent=None, smooth=True):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    return finish(o, material, name, smooth, parent)


def cube(name, material, loc, scale=(1, 1, 1), rot=(0, 0, 0), parent=None, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    finish(o, material, name, smooth=False, parent=parent)
    if bevel:
        mod = o.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        mod.affect = "EDGES"
    return o


def torus(name, material, loc, major=0.3, minor=0.05, rot=(0, 0, 0), scale=(1, 1, 1), parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, location=loc, rotation=rot,
                                     major_segments=28, minor_segments=10)
    o = bpy.context.active_object
    o.scale = scale
    return finish(o, material, name, True, parent)


def empty(name, loc, parent=None):
    o = bpy.data.objects.new(name, None)
    o.empty_display_type = "PLAIN_AXES"
    o.empty_display_size = 0.2
    o.location = loc
    bpy.context.scene.collection.objects.link(o)
    if parent is not None:
        set_parent(o, parent)
    return o


def prism(name, material, loc, width, height, depth, along="Y", parent=None):
    """Prisma triangular (empena de telhado): base no chão do prisma, ápice para cima."""
    w, h, d = width / 2, height, depth / 2
    verts = [(-w, -d, 0), (w, -d, 0), (0, -d, h), (-w, d, 0), (w, d, 0), (0, d, h)]
    faces = [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    if along == "X":
        verts = [(y, x, z) for x, y, z in verts]
        faces = [tuple(reversed(f)) for f in faces]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    o.location = loc
    bpy.context.scene.collection.objects.link(o)
    return finish(o, material, name, smooth=False, parent=parent)


def text_mesh(name, body, material, loc, size=0.2, rot=(math.pi / 2, 0, 0), extrude=0.02, parent=None):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    t = bpy.context.active_object
    t.data.body = body
    t.data.size = size
    t.data.extrude = extrude
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.active_object
    return finish(o, material, name, smooth=False, parent=parent)


def export(filename):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.abspath(os.path.join(OUT_DIR, filename))
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print("exported", path, os.path.getsize(path), "bytes")


def ellipsoid_point(center, radii, theta, phi, inset=0.0):
    """Ponto na superfície de um elipsoide (theta = azimute, phi = elevação)."""
    cx, cy, cz = center
    rx, ry, rz = (r - inset for r in radii)
    return Vector((
        cx + rx * math.cos(phi) * math.cos(theta),
        cy + ry * math.cos(phi) * math.sin(theta),
        cz + rz * math.sin(phi),
    ))


# ------------------------------------------------------------------ Pongo

def build_pongo():
    reset_scene()
    white = mat("Fur", hex_rgb("#fbf8f1"), 0.8)
    black = mat("Spot", hex_rgb("#1d1b22"), 0.7)
    nose = mat("Nose", hex_rgb("#111015"), 0.25)
    eye = mat("Eye", hex_rgb("#0d0c10"), 0.1)
    shine = mat("EyeShine", (1, 1, 1), 0.1, emission=(1, 1, 1))
    tongue = mat("Tongue", hex_rgb("#ff6f91"), 0.4)
    collar = mat("Collar", hex_rgb("#e63946"), 0.45)
    gold = mat("Gold", hex_rgb("#ffc93c"), 0.25, metallic=0.8)

    root = empty("Pongo", (0, 0, 0))

    # tronco
    body_c, body_r = (0, 0.05, 0.78), (0.4, 0.68, 0.38)
    sphere("Body", white, body_c, scale=body_r, parent=root)
    sphere("Chest", white, (0, -0.42, 0.86), scale=(0.36, 0.36, 0.38), parent=root)

    rnd = random.Random(101)  # 101 dálmatas :)
    for i in range(14):
        theta = rnd.uniform(0, 2 * math.pi)
        phi = rnd.uniform(-0.1, 1.2)
        p = ellipsoid_point(body_c, body_r, theta, phi, inset=0.035)
        s = rnd.uniform(0.07, 0.13)
        o = sphere(f"BodySpot{i}", black, p, scale=(s, s, s * 0.45), segs=12, rings=8, parent=root)
        normal = (p - Vector(body_c))
        o.rotation_euler = normal.to_track_quat("Z", "Y").to_euler()

    # cabeça (pivô no pescoço)
    head = empty("Head", (0, -0.62, 1.12), parent=root)
    hc = Vector((0, -0.78, 1.32))
    sphere("Skull", white, hc, scale=(0.34, 0.34, 0.32), parent=head)
    sphere("Snout", white, hc + Vector((0, -0.27, -0.1)), scale=(0.19, 0.22, 0.15), parent=head)
    sphere("NoseTip", nose, hc + Vector((0, -0.48, -0.04)), scale=(0.075, 0.055, 0.055), parent=head)
    sphere("Tongue", tongue, hc + Vector((0.03, -0.38, -0.23)), scale=(0.06, 0.08, 0.025), parent=head)
    for sx, side in ((-1, "L"), (1, "R")):
        sphere(f"Eye{side}", eye, hc + Vector((sx * 0.13, -0.27, 0.08)), r=0.058, segs=16, rings=10, parent=head)
        sphere(f"EyeShine{side}", shine, hc + Vector((sx * 0.13 + 0.02, -0.325, 0.11)), r=0.018, segs=8, rings=6,
               parent=head)
        ear = sphere(f"Ear{side}", black, hc + Vector((sx * 0.3, 0.02, -0.06)), scale=(0.07, 0.15, 0.26),
                     rot=(0, sx * 0.35, 0), parent=head)
        ear.name = f"Ear{side}"
    sphere("HeadSpot", black, hc + Vector((0.16, -0.05, 0.27)), scale=(0.1, 0.1, 0.04), rot=(0.2, 0.5, 0), parent=head)
    sphere("EyePatch", black, hc + Vector((-0.17, -0.2, 0.12)), scale=(0.08, 0.05, 0.08), parent=head)

    # coleira + plaquinha
    torus("Collar", collar, (0, -0.6, 1.08), major=0.27, minor=0.05, rot=(math.radians(70), 0, 0), parent=root)
    cyl("Tag", gold, (0, -0.86, 0.9), r=0.07, depth=0.02, rot=(math.radians(90), 0, 0), parent=root)

    # pernas (pivô no quadril/ombro)
    legs = {
        "Leg_FL": (-0.2, -0.38, 0.62), "Leg_FR": (0.2, -0.38, 0.62),
        "Leg_BL": (-0.22, 0.42, 0.62), "Leg_BR": (0.22, 0.42, 0.62),
    }
    for i, (name, (x, y, z)) in enumerate(legs.items()):
        pivot = empty(name, (x, y, z), parent=root)
        cyl(f"{name}_Upper", white, (x, y, z - 0.26), r=0.1, depth=0.52, scale=(1, 1.05, 1), parent=pivot)
        sphere(f"{name}_Paw", white, (x, y - 0.05, 0.07), scale=(0.12, 0.15, 0.08), parent=pivot)
        if i % 2 == 0:
            sphere(f"{name}_Spot", black, (x + (0.08 if x > 0 else -0.08), y, z - 0.2),
                   scale=(0.03, 0.07, 0.07), segs=10, rings=6, parent=pivot)

    # rabo (pivô na base)
    tail = empty("Tail", (0, 0.7, 0.95), parent=root)
    cone("TailMesh", white, (0, 0.88, 1.12), r1=0.07, r2=0.025, depth=0.5, rot=(math.radians(-45), 0, 0), parent=tail)
    sphere("TailTip", black, (0, 1.05, 1.3), r=0.04, segs=10, rings=6, parent=tail)

    export("pongo.glb")


# ------------------------------------------------------------------- Osso

def build_bone():
    reset_scene()
    bone = mat("Bone", hex_rgb("#fff3d6"), 0.45)
    root = empty("Bone", (0, 0, 0))
    cyl("Shaft", bone, (0, 0, 0), r=0.11, depth=0.9, rot=(0, math.radians(90), 0), parent=root)
    for x in (-0.45, 0.45):
        for y in (-0.1, 0.1):
            sphere(f"Knob{x}{y}", bone, (x, y, 0), r=0.15, parent=root)
    export("bone.glb")


# -------------------------------------------------------- Montinho / Buraco

def build_dig_mound():
    reset_scene()
    dirt = mat("Dirt", hex_rgb("#8a5a3b"), 0.95)
    dark = mat("DirtDark", hex_rgb("#5e3b25"), 0.95)
    root = empty("Mound", (0, 0, 0))
    m = ico("Heap", dirt, (0, 0, 0.05), scale=(0.75, 0.75, 0.32), subdiv=3, jitter=0.12, seed=7, parent=root)
    rnd = random.Random(3)
    for i in range(7):
        a = rnd.uniform(0, 2 * math.pi)
        d = rnd.uniform(0.6, 0.95)
        ico(f"Clod{i}", dark, (math.cos(a) * d, math.sin(a) * d, 0.04), r=rnd.uniform(0.06, 0.12),
            subdiv=1, jitter=0.2, seed=i, parent=root)
    export("mound.glb")


def build_dig_hole():
    reset_scene()
    dirt = mat("Dirt", hex_rgb("#8a5a3b"), 0.95)
    hole = mat("Hole", hex_rgb("#2b1a10"), 1.0)
    root = empty("Hole", (0, 0, 0))
    torus("Rim", dirt, (0, 0, 0.03), major=0.62, minor=0.17, scale=(1, 1, 0.55), parent=root)
    cyl("Pit", hole, (0, 0, 0.012), r=0.55, depth=0.02, verts=28, parent=root)
    export("hole.glb")


# ---------------------------------------------------------------- Casinha

def build_doghouse():
    reset_scene()
    wall = mat("Wall", hex_rgb("#e76f51"), 0.7)
    roof = mat("Roof", hex_rgb("#264653"), 0.6)
    trim = mat("Trim", hex_rgb("#fefae0"), 0.6)
    door = mat("Door", hex_rgb("#1a1423"), 0.9)
    gold = mat("Gold", hex_rgb("#ffc93c"), 0.3, metallic=0.6)
    root = empty("Doghouse", (0, 0, 0))
    cube("Base", wall, (0, 0, 0.55), scale=(1.4, 1.5, 1.1), parent=root, bevel=0.03)
    prism("Gable", wall, (0, 0, 1.1), width=1.4, height=0.6, depth=1.5, parent=root)
    for sx in (-1, 1):
        cube(f"Roof{sx}", roof, (sx * 0.42, 0, 1.47), scale=(1.05, 1.75, 0.09),
             rot=(0, sx * math.radians(40), 0), parent=root, bevel=0.02)
    cube("Ridge", trim, (0, 0, 1.82), scale=(0.12, 1.8, 0.1), parent=root)
    cyl("DoorArch", door, (0, -0.755, 0.62), r=0.36, depth=0.04, verts=24, rot=(math.radians(90), 0, 0), parent=root)
    cube("DoorLow", door, (0, -0.755, 0.33), scale=(0.72, 0.04, 0.6), parent=root)
    cube("Plate", trim, (0, -0.77, 1.18), scale=(0.7, 0.03, 0.2), parent=root, bevel=0.01)
    text_mesh("Name", "PONGO", door, (0, -0.79, 1.18), size=0.15, extrude=0.01, parent=root)
    cyl("Bowl", gold, (0.95, -0.6, 0.06), r=0.2, depth=0.12, verts=20, parent=root)
    export("doghouse.glb")


# ------------------------------------------------------------------ Casa

def build_house():
    reset_scene()
    wall = mat("HouseWall", hex_rgb("#fff1d0"), 0.8)
    roof = mat("HouseRoof", hex_rgb("#c8553d"), 0.6)
    glass = mat("Glass", hex_rgb("#8ecae6"), 0.1, emission=(0.15, 0.25, 0.3))
    frame = mat("Frame", hex_rgb("#ffffff"), 0.5)
    door = mat("HouseDoor", hex_rgb("#2a9d8f"), 0.5)
    step = mat("Step", hex_rgb("#adb5bd"), 0.9)
    root = empty("House", (0, 0, 0))
    cube("Walls", wall, (0, 0, 1.5), scale=(8, 3, 3), parent=root)
    for sx in (-1, 1):
        cube(f"RoofSide{sx}", roof, (0, sx * 0.95, 3.55), scale=(8.6, 2.4, 0.18),
             rot=(sx * math.radians(-35), 0, 0), parent=root, bevel=0.03)
    prism("Attic", wall, (0, 0, 3.0), width=3.0, height=1.05, depth=7.98, along="X", parent=root)
    for i, x in enumerate((-2.6, -1.0, 2.0, 3.2)):
        cube(f"WinFrame{i}", frame, (x, -1.52, 1.8), scale=(0.95, 0.06, 0.95), parent=root)
        cube(f"Win{i}", glass, (x, -1.56, 1.8), scale=(0.8, 0.04, 0.8), parent=root)
        cube(f"WinBarV{i}", frame, (x, -1.59, 1.8), scale=(0.06, 0.02, 0.8), parent=root)
        cube(f"WinBarH{i}", frame, (x, -1.59, 1.8), scale=(0.8, 0.02, 0.06), parent=root)
    cube("DoorFrame", frame, (0.5, -1.52, 1.05), scale=(1.15, 0.06, 2.1), parent=root)
    cube("Door", door, (0.5, -1.56, 1.0), scale=(1.0, 0.05, 2.0), parent=root, bevel=0.02)
    sphere("Knob", mat("Gold", hex_rgb("#ffc93c"), 0.3, metallic=0.7), (0.85, -1.6, 1.0), r=0.06, parent=root)
    cube("Step", step, (0.5, -1.8, 0.07), scale=(1.6, 0.6, 0.14), parent=root, bevel=0.02)
    export("house.glb")


# ---------------------------------------------------------- Vegetação etc.

def build_tree():
    reset_scene()
    bark = mat("Bark", hex_rgb("#7f5539"), 0.9)
    leaf = mat("Leaf", hex_rgb("#2d9d5c"), 0.8)
    leaf2 = mat("Leaf2", hex_rgb("#52b788"), 0.8)
    fruit = mat("Mango", hex_rgb("#ffb703"), 0.4)
    root = empty("Tree", (0, 0, 0))
    cyl("Trunk", bark, (0, 0, 0.9), r=0.22, depth=1.8, verts=10, scale=(1, 1, 1), parent=root, smooth=False)
    ico("Crown0", leaf, (0, 0, 2.3), r=1.05, subdiv=2, jitter=0.1, seed=1, parent=root)
    ico("Crown1", leaf2, (0.6, 0.2, 2.0), r=0.7, subdiv=2, jitter=0.1, seed=2, parent=root)
    ico("Crown2", leaf2, (-0.55, -0.25, 2.05), r=0.72, subdiv=2, jitter=0.1, seed=3, parent=root)
    ico("Crown3", leaf, (0.1, -0.1, 3.0), r=0.62, subdiv=2, jitter=0.1, seed=4, parent=root)
    for i, (x, y, z) in enumerate(((0.7, -0.6, 2.0), (-0.6, -0.75, 2.3), (0.2, -0.95, 2.6), (0.9, 0.1, 2.5))):
        sphere(f"Fruit{i}", fruit, (x, y, z), r=0.11, segs=12, rings=8, parent=root)
    export("tree.glb")


def build_palm():
    reset_scene()
    bark = mat("PalmBark", hex_rgb("#a47148"), 0.9)
    leaf = mat("PalmLeaf", hex_rgb("#40916c"), 0.7)
    root = empty("Palm", (0, 0, 0))
    for i in range(7):
        z = 0.25 + i * 0.42
        cyl(f"Seg{i}", bark, (i * 0.05, 0, z), r=0.17 - i * 0.01, depth=0.4, verts=8, parent=root, smooth=False)
    top = Vector((0.33, 0, 3.15))
    for i in range(7):
        a = i / 7 * 2 * math.pi
        o = sphere(f"Frond{i}", leaf, top + Vector((math.cos(a) * 0.65, math.sin(a) * 0.65, -0.15)),
                   scale=(0.75, 0.2, 0.04), segs=12, rings=6, rot=(0, math.radians(25), a), parent=root)
    export("palm.glb")


def build_bush():
    reset_scene()
    leaf = mat("BushLeaf", hex_rgb("#40916c"), 0.8)
    leaf2 = mat("BushLeaf2", hex_rgb("#74c69d"), 0.8)
    berry = mat("Berry", hex_rgb("#ef476f"), 0.4)
    root = empty("Bush", (0, 0, 0))
    ico("B0", leaf, (0, 0, 0.35), r=0.5, subdiv=2, jitter=0.12, seed=11, parent=root)
    ico("B1", leaf2, (0.45, 0.1, 0.28), r=0.36, subdiv=2, jitter=0.12, seed=12, parent=root)
    ico("B2", leaf, (-0.42, -0.05, 0.27), r=0.38, subdiv=2, jitter=0.12, seed=13, parent=root)
    for i, (x, y, z) in enumerate(((0.2, -0.45, 0.45), (-0.3, -0.35, 0.4), (0.55, -0.2, 0.35), (0.0, -0.3, 0.7))):
        sphere(f"Berry{i}", berry, (x, y, z), r=0.06, segs=10, rings=6, parent=root)
    export("bush.glb")


def build_flower():
    reset_scene()
    stem = mat("Stem", hex_rgb("#2d6a4f"), 0.8)
    petal = mat("Petal", hex_rgb("#ffffff"), 0.5)  # recolorido no Three.js
    center = mat("FlowerCenter", hex_rgb("#ffd166"), 0.5)
    root = empty("Flower", (0, 0, 0))
    cyl("Stem", stem, (0, 0, 0.2), r=0.02, depth=0.4, verts=6, parent=root)
    sphere("Leaf", stem, (0.07, 0, 0.15), scale=(0.08, 0.03, 0.02), rot=(0, -0.5, 0), parent=root)
    for i in range(6):
        a = i / 6 * 2 * math.pi
        sphere(f"Petal{i}", petal, (math.cos(a) * 0.08, math.sin(a) * 0.08, 0.42), scale=(0.07, 0.045, 0.02),
               segs=10, rings=6, rot=(0, 0, a), parent=root)
    sphere("Center", center, (0, 0, 0.43), r=0.045, segs=10, rings=6, parent=root)
    export("flower.glb")


def build_fence():
    reset_scene()
    wood = mat("FenceWood", hex_rgb("#fefae0"), 0.7)
    root = empty("Fence", (0, 0, 0))
    for i, x in enumerate((-0.9, -0.3, 0.3, 0.9)):
        cube(f"Picket{i}", wood, (x, 0, 0.45), scale=(0.16, 0.06, 0.9), parent=root, bevel=0.01)
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.113, depth=0.12, location=(x, 0, 0.96),
                                        rotation=(0, 0, math.radians(45)))
        tip = bpy.context.active_object
        tip.scale = (1, 0.38, 1)
        finish(tip, wood, f"PicketTip{i}", smooth=False, parent=root)
    cube("RailTop", wood, (0, 0.05, 0.7), scale=(2.0, 0.05, 0.1), parent=root)
    cube("RailLow", wood, (0, 0.05, 0.25), scale=(2.0, 0.05, 0.1), parent=root)
    export("fence.glb")


def build_stone():
    reset_scene()
    stone = mat("Stone", hex_rgb("#ced4da"), 0.9)
    root = empty("Stone", (0, 0, 0))
    ico("Slab", stone, (0, 0, 0.02), scale=(0.5, 0.42, 0.08), subdiv=2, jitter=0.08, seed=5, parent=root)
    export("stone.glb")


def build_ball():
    reset_scene()
    red = mat("BallRed", hex_rgb("#ef476f"), 0.4)
    yellow = mat("BallYellow", hex_rgb("#ffd166"), 0.4)
    root = empty("Ball", (0, 0, 0))
    sphere("Ball", red, (0, 0, 0.22), r=0.22, parent=root)
    torus("Stripe", yellow, (0, 0, 0.22), major=0.215, minor=0.03, rot=(math.radians(90), 0, 0), parent=root)
    export("ball.glb")


def build_chest_marker():
    """Placa de pista '?' que flutua sobre cada ponto de escavação."""
    reset_scene()
    sign = mat("Sign", hex_rgb("#ffd166"), 0.35, emission=(0.4, 0.3, 0.05))
    ink = mat("Ink", hex_rgb("#3a0ca3"), 0.5)
    root = empty("Marker", (0, 0, 0))
    cyl("Coin", sign, (0, 0, 0), r=0.32, depth=0.08, verts=28, rot=(math.radians(90), 0, 0), parent=root)
    text_mesh("Q", "?", ink, (0, -0.05, -0.02), size=0.42, extrude=0.03, parent=root)
    text_mesh("Q2", "?", ink, (0, 0.05, -0.02), size=0.42, extrude=0.03, rot=(math.radians(90), 0, math.pi),
              parent=root)
    export("marker.glb")


if __name__ == "__main__":
    build_pongo()
    build_bone()
    build_dig_mound()
    build_dig_hole()
    build_doghouse()
    build_house()
    build_tree()
    build_palm()
    build_bush()
    build_flower()
    build_fence()
    build_stone()
    build_ball()
    build_chest_marker()
