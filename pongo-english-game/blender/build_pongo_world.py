"""
Pongo's World - Blender scene builder
=====================================

Builds the 3D map for the game "Pongo Learns English": a big garden with the
owner's house, a winding stepping-stone path, a pond, a doghouse, a berry patch
and the mascot Pongo (a playful Jack Russell puppy with a blue collar and a
bone-print vest).

Each lesson stop on the map is exported as an empty named LVL_1 ... LVL_7 so the
game can read its position from the .glb file.

How to run
----------
Inside Blender (Scripting tab):  open this file and press "Run Script".
From a terminal:
    blender --background --python build_pongo_world.py -- ../assets/pongo_world.glb
Or with the bpy module (pip install bpy, Python 3.11):
    python3 build_pongo_world.py ../assets/pongo_world.glb

It also saves a .blend file next to the .glb so the scene can be edited.
"""

import math
import os
import random
import sys

import bpy
from mathutils import Vector

random.seed(7)

# ---------------------------------------------------------------- output path
argv = sys.argv
if "--" in argv:
    argv = argv[argv.index("--") + 1:]
else:
    argv = [a for a in argv[1:] if a.endswith(".glb")]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(argv[0]) if argv else os.path.join(HERE, "..", "assets", "pongo_world.glb")

# ---------------------------------------------------------------- clean scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------------------------------------------------------- materials
_mats = {}


def mat(name, rgb, rough=0.8, emit=0.0, metal=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    col = (*rgb, 1.0)
    bsdf.inputs["Base Color"].default_value = col
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit:
        bsdf.inputs["Emission Color"].default_value = col
        bsdf.inputs["Emission Strength"].default_value = emit
    m.diffuse_color = col
    _mats[name] = m
    return m


def hexrgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    # Blender colors are linear
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


M = {
    "grass": mat("Grass", hexrgb("#7cc04b")),
    "grass_dark": mat("GrassDark", hexrgb("#5a9e38")),
    "lawn_out": mat("LawnOutside", hexrgb("#6aa843")),
    "stone": mat("Stone", hexrgb("#e8dcc4")),
    "stone_dark": mat("StoneDark", hexrgb("#b9ab92")),
    "wood": mat("Wood", hexrgb("#a86b3c")),
    "wood_light": mat("WoodLight", hexrgb("#f3e3c3")),
    "trunk": mat("Trunk", hexrgb("#7a4b2a")),
    "leaf": mat("Leaves", hexrgb("#4fae4a")),
    "leaf2": mat("Leaves2", hexrgb("#3d9440")),
    "leaf3": mat("Leaves3", hexrgb("#8fd14f")),
    "pine": mat("Pine", hexrgb("#2f7d4a")),
    "wall": mat("HouseWall", hexrgb("#fff4dc")),
    "roof": mat("Roof", hexrgb("#d9534f")),
    "door": mat("Door", hexrgb("#1cb0f6")),
    "window": mat("Window", hexrgb("#bfe9ff"), rough=0.1, emit=0.35),
    "frame": mat("Frame", hexrgb("#ffffff")),
    "chimney": mat("Chimney", hexrgb("#b5523b")),
    "water": mat("Water", hexrgb("#4fc3f7"), rough=0.05, emit=0.08),
    "lily": mat("Lily", hexrgb("#58cc02")),
    "red": mat("FlowerRed", hexrgb("#ff4b4b")),
    "yellow": mat("FlowerYellow", hexrgb("#ffc800")),
    "pink": mat("FlowerPink", hexrgb("#ff86d0")),
    "purple": mat("FlowerPurple", hexrgb("#ce82ff")),
    "white": mat("White", hexrgb("#ffffff")),
    "orange": mat("Orange", hexrgb("#ff9600")),
    "berry": mat("Berry", hexrgb("#6a2bd9")),
    "berry_red": mat("BerryRed", hexrgb("#e5243b")),
    "soil": mat("Soil", hexrgb("#6b4428")),
    "metal": mat("Metal", hexrgb("#9aa5ad"), rough=0.35, metal=0.6),
    "blue": mat("Blue", hexrgb("#1c5fd6")),
    # Pongo
    "fur_white": mat("PongoWhite", hexrgb("#fbf7f0"), rough=0.9),
    "fur_tan": mat("PongoTan", hexrgb("#c8742e"), rough=0.9),
    "fur_dark": mat("PongoDark", hexrgb("#4a3020"), rough=0.9),
    "ear_pink": mat("PongoEarPink", hexrgb("#f2a5a5"), rough=0.9),
    "eye": mat("PongoEye", hexrgb("#1a0f08"), rough=0.05),
    "eye_shine": mat("PongoEyeShine", hexrgb("#ffffff"), emit=1.0),
    "nose": mat("PongoNose", hexrgb("#2a2220"), rough=0.3),
    "collar": mat("PongoCollar", hexrgb("#1f4fb5"), rough=0.5),
    "vest": mat("PongoVest", hexrgb("#7cc8ec"), rough=0.85),
    "vest_bone": mat("PongoVestBone", hexrgb("#2c86c9"), rough=0.85),
    "tag": mat("PongoTag", hexrgb("#ffd34d"), rough=0.3, metal=0.8),
}

# ---------------------------------------------------------------- helpers
_root_cols = {}


def collection(name):
    if name not in _root_cols:
        c = bpy.data.collections.new(name)
        scene.collection.children.link(c)
        _root_cols[name] = c
    return _root_cols[name]


def _finish(obj, material, coll, smooth):
    if material is not None:
        obj.data.materials.clear()
        obj.data.materials.append(material)
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection(coll).objects.link(obj)
    if smooth:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.shade_smooth()
    return obj


def box(name, loc, size, material, coll="Garden", rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, material, coll, False)


def cyl(name, loc, r, depth, material, coll="Garden", verts=12, rot=(0, 0, 0), smooth=False):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return _finish(o, material, coll, smooth)


def cone(name, loc, r1, r2, depth, material, coll="Garden", verts=10, rot=(0, 0, 0), smooth=False):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return _finish(o, material, coll, smooth)


def ico(name, loc, r, material, coll="Garden", sub=1, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, material, coll, False)


def sphere(name, loc, r, material, coll="Pongo", scale=(1, 1, 1), rot=(0, 0, 0), seg=20, ring=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=r, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return _finish(o, material, coll, True)


def torus(name, loc, R, r, material, coll="Pongo", rot=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot,
                                     major_segments=24, minor_segments=8)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, material, coll, True)


def mesh_from(name, verts, faces, material, coll="Garden"):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    collection(coll).objects.link(o)
    o.data.materials.append(material)
    return o


def empty(name, loc, coll="Levels"):
    o = bpy.data.objects.new(name, None)
    o.empty_display_type = "CONE"
    o.empty_display_size = 1.2
    o.location = loc
    collection(coll).objects.link(o)
    return o


def catmull(points, steps=24):
    """Catmull-Rom spline through 2D points."""
    pts = [points[0]] + points + [points[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for s in range(steps):
            t = s / steps
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2
                       + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3) for k in (0, 1)))
    out.append(points[-1])
    return out


# ================================================================= GROUND
# Outside lawn
bpy.ops.mesh.primitive_plane_add(size=160, location=(0, 0, -0.05))
g = bpy.context.active_object
g.name = "LawnOutside"
_finish(g, M["lawn_out"], "Ground", False)

# Garden lawn, gently rolling
bpy.ops.mesh.primitive_grid_add(x_subdivisions=56, y_subdivisions=60, size=1, location=(0, 2, 0))
lawn = bpy.context.active_object
lawn.name = "GardenLawn"
lawn.scale = (54, 58, 1)
bpy.ops.object.transform_apply(scale=True)
for v in lawn.data.vertices:
    x, y = v.co.x, v.co.y
    edge = min(1.0, (27 - abs(x)) / 4, (29 - abs(y - 0)) / 4)
    v.co.z = max(0.0, edge) * (0.18 * math.sin(x * 0.35) * math.cos(y * 0.28) + random.uniform(0, 0.06))
_finish(lawn, M["grass"], "Ground", False)

# ================================================================= LEVEL STOPS
LEVELS = [
    ("LVL_1", (0, -21), "Gate"),
    ("LVL_2", (-8, -15), "Flower Bed"),
    ("LVL_3", (-11, -6), "Pond"),
    ("LVL_4", (-2, -1), "Big Tree"),
    ("LVL_5", (8, 2), "Doghouse"),
    ("LVL_6", (10, 9), "Berry Patch"),
    ("LVL_7", (0, 15.5), "Front Door"),
]
# ================================================================= PATH
PATH = [(0, -29), (0, -21), (-8, -15), (-11, -6), (-2, -1), (8, 2), (10, 9), (4, 12.5), (0, 15.5)]
curve = catmull(PATH, steps=30)
dist_acc, last = 0.0, curve[0]
stone_i = 0
for p in curve:
    dist_acc += math.dist(p, last)
    last = p
    if dist_acc >= 1.15:
        if any(math.dist(p, xy) < 1.9 for _, xy, _ in LEVELS):
            continue
        dist_acc = 0
        stone_i += 1
        r = random.uniform(0.48, 0.62)
        cyl(f"PathStone_{stone_i:03d}", (p[0] + random.uniform(-.12, .12), p[1], 0.12), r, 0.18,
            M["stone"] if stone_i % 3 else M["stone_dark"], coll="Path", verts=9,
            rot=(0, 0, random.uniform(0, 3)))

for name, (x, y), label in LEVELS:
    e = empty(name, (x, y, 0.25))
    e["label"] = label
    # round stone platform under each stop
    cyl(f"{name}_Pad", (x, y, 0.16), 1.35, 0.3, M["wood_light"], coll="Levels", verts=24)
    cyl(f"{name}_PadRim", (x, y, 0.04), 1.55, 0.12, M["stone_dark"], coll="Levels", verts=24)

# ================================================================= FENCE + GATE
FX, FY0, FY1 = 27, -29, 31


def fence_run(x0, y0, x1, y1, tag):
    length = math.dist((x0, y0), (x1, y1))
    n = max(1, int(length / 1.6))
    ang = math.atan2(y1 - y0, x1 - x0)
    for i in range(n + 1):
        t = i / n
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        box(f"Fence_{tag}_Post{i:02d}", (x, y, 0.75), (0.28, 0.28, 1.5), M["white"], coll="Fence")
        cone(f"Fence_{tag}_Cap{i:02d}", (x, y, 1.62), 0.22, 0, 0.3, M["white"], coll="Fence", verts=4,
             rot=(0, 0, math.pi / 4))
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    for z in (0.5, 1.1):
        box(f"Fence_{tag}_Rail{z}", (mx, my, z), (length, 0.12, 0.18), M["white"], coll="Fence",
            rot=(0, 0, ang))


fence_run(-FX, FY0, -2.2, FY0, "S1")
fence_run(2.2, FY0, FX, FY0, "S2")
fence_run(-FX, FY0, -FX, FY1, "W")
fence_run(FX, FY0, FX, FY1, "E")
fence_run(-FX, FY1, FX, FY1, "N")
# gate arch
for sx in (-2.2, 2.2):
    box(f"GatePillar_{sx}", (sx, FY0, 1.4), (0.6, 0.6, 2.8), M["wood"], coll="Fence")
arch_pts = [(math.cos(a) * 2.2, FY0, 2.8 + math.sin(a) * 0.9) for a in [i * math.pi / 10 for i in range(11)]]
for i, (x, y, z) in enumerate(arch_pts):
    ico(f"GateArch_{i}", (x, y, z), 0.32, M["leaf"], coll="Fence", sub=1)
    if i % 2 == 0:
        ico(f"GateArchFlower_{i}", (x, y - 0.3, z + 0.1), 0.14, M["pink"] if i % 4 else M["yellow"], coll="Fence")
box("GateSign", (0, FY0 - 0.2, 3.95), (2.6, 0.12, 0.7), M["wood"], coll="Fence")

# ================================================================= HOUSE
HX, HY = 0, 22.5
HW, HD, HH = 15, 10, 5.2
house_coll = "House"
box("House_Base", (HX, HY, 0.25), (HW + 0.8, HD + 0.8, 0.5), M["stone_dark"], coll=house_coll)
box("House_Walls", (HX, HY, 0.5 + HH / 2), (HW, HD, HH), M["wall"], coll=house_coll)
# gable roof
ov = 0.9
rz = 0.5 + HH
peak = rz + 4.2
x0, x1 = HX - HW / 2 - ov, HX + HW / 2 + ov
y0, y1 = HY - HD / 2 - ov, HY + HD / 2 + ov
roof = mesh_from("House_Roof", [
    (x0, y0, rz - .3), (x1, y0, rz - .3), (x1, HY, peak), (x0, HY, peak),
    (x0, y1, rz - .3), (x1, y1, rz - .3),
    (x0, y0, rz), (x1, y0, rz), (x1, HY, peak + .35), (x0, HY, peak + .35), (x0, y1, rz), (x1, y1, rz),
], [(0, 1, 2, 3), (3, 2, 5, 4), (6, 9, 8, 7), (9, 10, 11, 8), (0, 6, 7, 1), (4, 5, 11, 10),
    (0, 3, 9, 6), (3, 4, 10, 9), (1, 7, 8, 2), (2, 8, 11, 5)], M["roof"], coll=house_coll)
# gable walls
for side, sx in (("L", HX - HW / 2), ("R", HX + HW / 2)):
    mesh_from(f"House_Gable{side}", [(sx, HY - HD / 2, rz), (sx, HY + HD / 2, rz), (sx, HY, peak - 0.05)],
              [(0, 1, 2)], M["wall"], coll=house_coll)
box("House_Chimney", (HX + 4.2, HY + 2.2, peak - 0.4), (1.3, 1.3, 3.2), M["chimney"], coll=house_coll)
box("House_ChimneyTop", (HX + 4.2, HY + 2.2, peak + 1.25), (1.6, 1.6, 0.3), M["stone_dark"], coll=house_coll)
# door
fy = HY - HD / 2
box("House_DoorFrame", (HX, fy - 0.06, 0.5 + 1.55), (2.3, 0.14, 3.3), M["frame"], coll=house_coll)
box("House_Door", (HX, fy - 0.14, 0.5 + 1.45), (1.8, 0.12, 2.9), M["door"], coll=house_coll)
ico("House_DoorKnob", (HX + 0.6, fy - 0.24, 0.5 + 1.45), 0.11, M["yellow"], coll=house_coll)
cyl("House_DoorWindow", (HX, fy - 0.22, 2.75), 0.38, 0.06, M["window"], coll=house_coll, verts=16,
    rot=(math.pi / 2, 0, 0))
# windows
for i, wx in enumerate((-4.6, 4.6)):
    box(f"House_WinFrame{i}", (HX + wx, fy - 0.05, 2.9), (2.5, 0.14, 2.1), M["frame"], coll=house_coll)
    box(f"House_Win{i}", (HX + wx, fy - 0.13, 2.9), (2.1, 0.12, 1.7), M["window"], coll=house_coll)
    box(f"House_WinBarV{i}", (HX + wx, fy - 0.2, 2.9), (0.12, 0.06, 1.7), M["frame"], coll=house_coll)
    box(f"House_WinBarH{i}", (HX + wx, fy - 0.2, 2.9), (2.1, 0.06, 0.12), M["frame"], coll=house_coll)
    box(f"House_FlowerBox{i}", (HX + wx, fy - 0.45, 1.75), (2.4, 0.6, 0.4), M["wood"], coll=house_coll)
    for k in range(5):
        ico(f"House_BoxFlower{i}_{k}", (HX + wx - 0.9 + k * 0.45, fy - 0.45, 2.1), 0.2,
            [M["red"], M["yellow"], M["pink"], M["purple"], M["red"]][k], coll=house_coll)
# porch
box("House_PorchStep1", (HX, fy - 1.2, 0.18), (4.2, 1.4, 0.36), M["wood_light"], coll=house_coll)
box("House_PorchStep2", (HX, fy - 0.7, 0.42), (4.2, 1.0, 0.3), M["wood_light"], coll=house_coll)
box("House_Doormat", (HX, fy - 1.2, 0.38), (1.8, 0.9, 0.05), M["orange"], coll=house_coll)
for sx in (-1.9, 1.9):
    cyl(f"House_PorchPost{sx}", (HX + sx, fy - 1.6, 2.2), 0.14, 3.6, M["white"], coll=house_coll, verts=8)
box("House_Awning", (HX, fy - 1.0, 4.05), (4.6, 2.4, 0.18), M["roof"], coll=house_coll, rot=(-0.18, 0, 0))
# lamp
cyl("House_LampPole", (HX + 3.2, fy - 1.9, 1.2), 0.07, 2.4, M["metal"], coll=house_coll, verts=8)
ico("House_LampGlobe", (HX + 3.2, fy - 1.9, 2.55), 0.3, mat("LampLight", hexrgb("#fff2a8"), emit=2.0),
    coll=house_coll, sub=2)

# ================================================================= POND
PX, PY = -18, -5
bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=1, depth=0.1, location=(PX, PY, 0.02))
pond = bpy.context.active_object
pond.name = "Pond_Water"
pond.scale = (5.2, 3.8, 1)
bpy.ops.object.transform_apply(scale=True)
_finish(pond, M["water"], "Pond", False)
bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.09, location=(PX, PY, 0.08),
                                 major_segments=28, minor_segments=6)
rim = bpy.context.active_object
rim.name = "Pond_Rim"
rim.scale = (5.3, 3.9, 2.2)
bpy.ops.object.transform_apply(scale=True)
_finish(rim, M["stone_dark"], "Pond", False)
for i in range(5):
    a = i * 1.3
    cyl(f"Pond_Lily{i}", (PX + math.cos(a) * 2.8, PY + math.sin(a) * 1.8, 0.1), 0.55, 0.05, M["lily"],
        coll="Pond", verts=10)
    if i % 2 == 0:
        ico(f"Pond_LilyFlower{i}", (PX + math.cos(a) * 2.8, PY + math.sin(a) * 1.8, 0.22), 0.16, M["pink"],
            coll="Pond")
for i in range(9):  # reeds
    a = math.pi * 0.8 + i * 0.12
    x, y = PX + math.cos(a) * 5.5, PY + math.sin(a) * 4.0
    cyl(f"Pond_Reed{i}", (x, y, 0.8), 0.05, 1.6, M["leaf2"], coll="Pond", verts=5)
    cyl(f"Pond_ReedTop{i}", (x, y, 1.55), 0.1, 0.4, M["trunk"], coll="Pond", verts=6)
# little wooden duck
ico("Pond_DuckBody", (PX + 1, PY - 0.5, 0.3), 0.45, M["yellow"], coll="Pond", scale=(1.3, 1, 0.8))
ico("Pond_DuckHead", (PX + 1.5, PY - 0.5, 0.75), 0.27, M["yellow"], coll="Pond")
cone("Pond_DuckBeak", (PX + 1.85, PY - 0.5, 0.72), 0.1, 0, 0.3, M["orange"], coll="Pond", rot=(0, math.pi / 2, 0))

# ================================================================= TREES


def tree(name, x, y, s=1.0, kind="round"):
    if kind == "pine":
        cyl(f"{name}_Trunk", (x, y, 0.6 * s), 0.25 * s, 1.2 * s, M["trunk"], coll="Trees", verts=7)
        for i, (r, h) in enumerate(((1.8, 2.2), (1.4, 2.0), (0.9, 1.8))):
            cone(f"{name}_Cone{i}", (x, y, (1.6 + i * 1.2) * s), r * s, 0, h * s, M["pine"], coll="Trees", verts=8)
    else:
        cyl(f"{name}_Trunk", (x, y, 1.1 * s), 0.32 * s, 2.2 * s, M["trunk"], coll="Trees", verts=7)
        leaves = [M["leaf"], M["leaf2"], M["leaf3"]]
        for i in range(3):
            ico(f"{name}_Leaf{i}", (x + random.uniform(-.7, .7) * s, y + random.uniform(-.7, .7) * s,
                                    (2.9 + i * 0.55) * s), random.uniform(1.15, 1.5) * s, leaves[i % 3],
                coll="Trees")


# The Big Tree (lesson 4) with a tire swing
BTX, BTY = -6.5, 3.5
cyl("BigTree_Trunk", (BTX, BTY, 2.2), 0.75, 4.4, M["trunk"], coll="Trees", verts=9)
cyl("BigTree_Branch", (BTX + 1.6, BTY - 0.2, 4.2), 0.25, 3.6, M["trunk"], coll="Trees", verts=7,
    rot=(0, math.pi / 2.4, 0))
for i, (dx, dy, dz, r) in enumerate([(0, 0, 6, 2.8), (2, 0.5, 5.4, 2.1), (-1.8, 0.2, 5.3, 2.2),
                                      (0.5, 1.6, 5.8, 2.0), (0.4, -1.4, 5.6, 2.0), (2.8, -0.4, 4.8, 1.5)]):
    ico(f"BigTree_Leaf{i}", (BTX + dx, BTY + dy, dz), r, [M["leaf"], M["leaf2"], M["leaf3"]][i % 3], coll="Trees")
for i in range(6):  # oranges in the tree
    a = i * 1.05
    ico(f"BigTree_Fruit{i}", (BTX + math.cos(a) * 2.4, BTY + math.sin(a) * 2.4, 5.0 + (i % 2) * 0.8), 0.22,
        M["orange"], coll="Trees")
for sx in (-0.25, 0.25):
    cyl(f"BigTree_Rope{sx}", (BTX + 2.8 + sx, BTY - 0.2, 3.0), 0.03, 2.4, M["wood_light"], coll="Trees", verts=5)
torus("BigTree_Tire", (BTX + 2.8, BTY - 0.2, 1.6), 0.55, 0.18, M["nose"], coll="Trees", rot=(math.pi / 2, 0, 0))

# scattered trees inside the fence (away from path, house and pond)
spots = [(-22, -24, "pine"), (-23, -16, "round"), (-23, 6, "pine"), (-22, 14, "round"), (-23, 25, "pine"),
         (-14, 27, "round"), (14, 27, "pine"), (22, 25, "round"), (23, 16, "pine"), (23, -6, "round"),
         (22, -16, "pine"), (23, -24, "round"), (-12, 16, "round"), (12, -21, "round"), (17, -12, "pine"),
         (-16, 9, "round")]
for i, (x, y, k) in enumerate(spots):
    tree(f"Tree{i:02d}", x, y, random.uniform(0.85, 1.15), k)
# outside the fence
for i in range(36):
    a = i / 36 * math.tau
    rr = random.uniform(36, 48)
    tree(f"FarTree{i:02d}", math.cos(a) * rr, math.sin(a) * rr + 2, random.uniform(1.1, 1.6),
         "pine" if i % 3 else "round")

# ================================================================= FLOWER BEDS (lesson 2)


def flower(name, x, y, m, h=0.7):
    cyl(f"{name}_Stem", (x, y, h / 2), 0.04, h, M["leaf2"], coll="Flowers", verts=5)
    ico(f"{name}_Head", (x, y, h + 0.08), 0.2, m, coll="Flowers", sub=1, scale=(1, 1, 0.75))
    ico(f"{name}_Core", (x, y, h + 0.2), 0.08, M["yellow"] if m is not M["yellow"] else M["orange"], coll="Flowers")


colors = [M["red"], M["yellow"], M["pink"], M["purple"], M["white"], M["orange"]]
for bed, (bx, by, w, d) in enumerate([(-14, -19, 6, 3), (-3, -12.5, 3.5, 2.2), (6, -18, 5, 2.6)]):
    box(f"FlowerBed{bed}_Soil", (bx, by, 0.12), (w, d, 0.24), M["soil"], coll="Flowers")
    box(f"FlowerBed{bed}_EdgeN", (bx, by + d / 2, 0.2), (w + 0.3, 0.2, 0.4), M["wood"], coll="Flowers")
    box(f"FlowerBed{bed}_EdgeS", (bx, by - d / 2, 0.2), (w + 0.3, 0.2, 0.4), M["wood"], coll="Flowers")
    box(f"FlowerBed{bed}_EdgeW", (bx - w / 2, by, 0.2), (0.2, d, 0.4), M["wood"], coll="Flowers")
    box(f"FlowerBed{bed}_EdgeE", (bx + w / 2, by, 0.2), (0.2, d, 0.4), M["wood"], coll="Flowers")
    n = 0
    for ix in range(int(w / 0.7)):
        for iy in range(int(d / 0.7)):
            n += 1
            flower(f"Flower{bed}_{n:02d}", bx - w / 2 + 0.5 + ix * 0.7 + random.uniform(-.1, .1),
                   by - d / 2 + 0.45 + iy * 0.7 + random.uniform(-.1, .1), random.choice(colors),
                   random.uniform(0.5, 0.9))
# loose flowers in the lawn
for i in range(40):
    x, y = random.uniform(-25, 25), random.uniform(-27, 13)
    if any(math.dist((x, y), c) < 2.2 for c in curve[::6]) or math.dist((x, y), (PX, PY)) < 6.5:
        continue
    ico(f"LawnFlower{i:02d}", (x, y, 0.2), 0.13, random.choice(colors), coll="Flowers")

# hedges along the house
for i, hx in enumerate([-13, -10.5, 10.5, 13]):
    ico(f"Hedge{i}", (hx, 16.3, 0.8), 1.3, M["leaf2"], coll="Garden", scale=(1, 0.8, 0.8))

# ================================================================= DOGHOUSE (lesson 5)
DX, DY = 15, 2.5
box("Doghouse_Body", (DX, DY, 1.15), (3.2, 3.6, 2.3), M["roof"], coll="Doghouse")
dz = 2.3
mesh_from("Doghouse_Roof", [
    (DX - 2, DY - 2.1, dz - .1), (DX - 2, DY + 2.1, dz - .1), (DX, DY - 2.1, dz + 1.5), (DX, DY + 2.1, dz + 1.5),
    (DX + 2, DY - 2.1, dz - .1), (DX + 2, DY + 2.1, dz - .1)],
    [(0, 2, 3, 1), (2, 4, 5, 3), (0, 1, 5, 4), (0, 4, 2), (1, 3, 5)], M["blue"], coll="Doghouse")
mesh_from("Doghouse_GableFront", [(DX - 1.6, DY - 1.81, dz), (DX + 1.6, DY - 1.81, dz), (DX, DY - 1.81, dz + 1.2)],
          [(0, 1, 2)], M["roof"], coll="Doghouse")
box("Doghouse_Door", (DX, DY - 1.79, 0.8), (1.3, 0.05, 1.5), M["nose"], coll="Doghouse")
cyl("Doghouse_DoorTop", (DX, DY - 1.79, 1.55), 0.65, 0.05, M["nose"], coll="Doghouse", verts=16,
    rot=(math.pi / 2, 0, 0))
box("Doghouse_Sign", (DX, DY - 1.86, 2.75), (1.8, 0.08, 0.5), M["wood_light"], coll="Doghouse")
# bowls + bone + ball
cyl("Doghouse_Bowl1", (DX - 2.6, DY - 2.4, 0.18), 0.45, 0.32, M["blue"], coll="Doghouse", verts=14)
cyl("Doghouse_Food", (DX - 2.6, DY - 2.4, 0.33), 0.38, 0.05, M["trunk"], coll="Doghouse", verts=14)
cyl("Doghouse_Bowl2", (DX - 1.6, DY - 2.8, 0.18), 0.45, 0.32, M["red"], coll="Doghouse", verts=14)
cyl("Doghouse_Water", (DX - 1.6, DY - 2.8, 0.33), 0.38, 0.05, M["water"], coll="Doghouse", verts=14)
for i, (bx, by) in enumerate([(DX + 2.5, DY - 3)]):
    cyl(f"Bone{i}_Shaft", (bx, by, 0.15), 0.12, 1.0, M["white"], coll="Doghouse", verts=8, rot=(0, math.pi / 2, 0.4))
    for sx in (-1, 1):
        for sy in (-1, 1):
            ico(f"Bone{i}_Knob{sx}{sy}", (bx + sx * 0.46 * math.cos(0.4) - sy * 0.12 * math.sin(0.4),
                                          by + sx * 0.46 * math.sin(0.4) + sy * 0.12 * math.cos(0.4), 0.15),
                0.16, M["white"], coll="Doghouse")
ico("Ball", (4.5, -4.5, 0.35), 0.35, M["yellow"], coll="Garden", sub=2)
torus("BallStripe", (4.5, -4.5, 0.35), 0.35, 0.04, M["white"], coll="Garden", rot=(0.6, 0.3, 0))

# ================================================================= BERRY PATCH (lesson 6)
for i in range(6):
    bx, by = 16 + (i % 3) * 2.6, 9 + (i // 3) * 3
    ico(f"BerryBush{i}", (bx, by, 0.9), 1.05, M["leaf2"], coll="Berries", scale=(1, 1, 0.85))
    for k in range(7):
        a, z = k * 0.9, 0.5 + (k % 3) * 0.35
        ico(f"Berry{i}_{k}", (bx + math.cos(a) * 0.98, by + math.sin(a) * 0.98, z), 0.13,
            M["berry"] if (i + k) % 2 else M["berry_red"], coll="Berries")
box("Berries_Basket", (13.2, 7.2, 0.3), (1.0, 0.8, 0.6), M["wood"], coll="Berries")
for k in range(5):
    ico(f"Berries_BasketBerry{k}", (13.0 + (k % 3) * 0.2, 7.1 + (k // 3) * 0.2, 0.68), 0.12, M["berry"],
        coll="Berries")

# clothes line + bench + mailbox for life
for sx in (-21, -13):
    cyl(f"ClothesPole{sx}", (sx, 20, 1.4), 0.08, 2.8, M["metal"], coll="Garden", verts=6)
box("ClothesLine", (-17, 20, 2.7), (8, 0.03, 0.03), M["white"], coll="Garden")
for i, c in enumerate([M["red"], M["door"], M["yellow"], M["pink"]]):
    box(f"Laundry{i}", (-20 + i * 1.8, 20, 2.15), (1.0, 0.06, 1.0), c, coll="Garden")
box("Bench_Seat", (-6, -7.5, 0.7), (2.8, 0.9, 0.15), M["wood"], coll="Garden")
box("Bench_Back", (-6, -7.1, 1.25), (2.8, 0.12, 0.8), M["wood"], coll="Garden")
for sx in (-1.2, 1.2):
    box(f"Bench_Leg{sx}", (-6 + sx, -7.5, 0.33), (0.15, 0.8, 0.66), M["metal"], coll="Garden")
cyl("Mailbox_Post", (4.5, -28, 0.7), 0.1, 1.4, M["wood"], coll="Garden", verts=6)
box("Mailbox_Box", (4.5, -28, 1.55), (0.6, 1.0, 0.55), M["door"], coll="Garden")
box("Mailbox_Flag", (4.85, -27.8, 1.75), (0.06, 0.4, 0.3), M["red"], coll="Garden")

# ================================================================= PONGO
# Built at the origin, facing -Y (toward the camera in the game).
P = "Pongo"
root = bpy.data.objects.new("Pongo", None)
collection(P).objects.link(root)
parts = []
S = 0.62  # overall scale (Pongo stands ~1.9 units tall)


def pz(v):
    return Vector(v) * S


parts.append(sphere("Pongo_Body", pz((0, 0.35, 1.05)), 0.8 * S, M["fur_white"], scale=(0.95, 1.25, 0.9)))
parts.append(sphere("Pongo_Vest", pz((0, 0.3, 1.1)), 0.84 * S, M["vest"], scale=(0.97, 1.0, 0.86)))
for i, (vx, vy, vz) in enumerate([(-0.55, -0.1, 1.3), (0.6, 0.4, 1.4), (-0.5, 0.75, 1.0), (0.5, -0.05, 0.85),
                                  (0, 0.2, 1.75), (-0.2, -0.55, 1.15), (0.25, 0.85, 1.55)]):
    parts.append(sphere(f"Pongo_VestBone{i}", pz((vx, vy, vz)), 0.13 * S, M["vest_bone"], scale=(1.9, 0.9, 0.7),
                        rot=(0, 0, i * 0.8), seg=10, ring=6))
# legs
for i, (lx, ly) in enumerate([(-0.42, -0.35), (0.42, -0.35), (-0.42, 0.9), (0.42, 0.9)]):
    parts.append(sphere(f"Pongo_Leg{i}", pz((lx, ly, 0.42)), 0.24 * S, M["fur_white"], scale=(1, 1, 1.9)))
    parts.append(sphere(f"Pongo_Paw{i}", pz((lx, ly - 0.08, 0.1)), 0.24 * S, M["fur_white"], scale=(1.05, 1.3, 0.6)))
parts.append(sphere("Pongo_Tail", pz((0, 1.55, 1.55)), 0.13 * S, M["fur_white"], scale=(1, 1, 3.2),
                    rot=(-0.6, 0, 0)))
parts.append(sphere("Pongo_TailTip", pz((0, 1.8, 1.95)), 0.12 * S, M["fur_dark"], scale=(1, 1, 1.4)))
# head
HZ = 2.25
parts.append(sphere("Pongo_Head", pz((0, -0.35, HZ)), 0.72 * S, M["fur_white"], scale=(1.05, 0.95, 0.95)))
parts.append(sphere("Pongo_HeadDark", pz((0, 0.0, HZ + 0.42)), 0.6 * S, M["fur_dark"], scale=(1.05, 0.95, 0.7)))
for sx in (-1, 1):  # tan cheeks around the eyes
    parts.append(sphere(f"Pongo_Cheek{sx}", pz((sx * 0.36, -0.55, HZ + 0.16)), 0.42 * S, M["fur_tan"],
                        scale=(0.9, 0.8, 0.95)))
parts.append(sphere("Pongo_Blaze", pz((0, -0.8, HZ + 0.32)), 0.17 * S, M["fur_white"], scale=(0.7, 0.7, 2.0)))
parts.append(sphere("Pongo_Muzzle", pz((0, -0.88, HZ - 0.2)), 0.44 * S, M["fur_white"], scale=(1.05, 0.95, 0.75)))
parts.append(sphere("Pongo_Nose", pz((0, -1.27, HZ - 0.06)), 0.16 * S, M["nose"], scale=(1.3, 0.9, 0.9)))
parts.append(sphere("Pongo_Tongue", pz((0.05, -1.12, HZ - 0.5)), 0.11 * S, M["red"], scale=(1, 0.6, 1.3)))
for sx in (-1, 1):  # big puppy eyes
    parts.append(sphere(f"Pongo_Eye{sx}", pz((sx * 0.33, -0.9, HZ + 0.2)), 0.21 * S, M["eye"], scale=(1, 0.7, 1.1)))
    parts.append(sphere(f"Pongo_EyeShine{sx}", pz((sx * 0.33 - 0.06, -1.05, HZ + 0.3)), 0.065 * S,
                        M["eye_shine"], seg=8, ring=6))
# ears: left one perked up and tilted out (pink inside), right one floppy brown
parts.append(sphere("Pongo_EarUp", pz((-0.72, -0.05, HZ + 0.7)), 0.34 * S, M["fur_white"], scale=(0.95, 0.32, 1.05),
                    rot=(0.15, -0.95, 0)))
parts.append(sphere("Pongo_EarUpInside", pz((-0.72, -0.13, HZ + 0.7)), 0.26 * S, M["ear_pink"],
                    scale=(0.85, 0.25, 0.95), rot=(0.15, -0.95, 0)))
parts.append(sphere("Pongo_EarUpTip", pz((-1.02, -0.05, HZ + 0.98)), 0.12 * S, M["fur_dark"], scale=(1, 0.5, 0.8)))
parts.append(sphere("Pongo_EarFlop", pz((0.74, -0.2, HZ + 0.12)), 0.32 * S, M["fur_tan"], scale=(0.42, 0.8, 1.35),
                    rot=(0.1, 0.45, 0)))
# collar + tag
parts.append(torus("Pongo_Collar", pz((0, -0.3, HZ - 0.62)), 0.55 * S, 0.09 * S, M["collar"], rot=(0.35, 0, 0)))
parts.append(cyl("Pongo_Tag", pz((0, -0.9, HZ - 0.95)), 0.12 * S, 0.04 * S, M["tag"], coll=P, verts=12,
                 rot=(math.pi / 2, 0, 0)))
for o in parts:
    o.parent = root

# ================================================================= LIGHT + CAMERA (for the .blend preview)
sun = bpy.data.lights.new("Sun", "SUN")
sun.energy = 3.5
sun_o = bpy.data.objects.new("Sun", sun)
sun_o.rotation_euler = (0.8, 0.2, 0.6)
scene.collection.objects.link(sun_o)
cam = bpy.data.cameras.new("MapCam")
cam_o = bpy.data.objects.new("MapCam", cam)
cam_o.location = (0, -55, 42)
cam_o.rotation_euler = (math.radians(52), 0, 0)
scene.collection.objects.link(cam_o)
scene.camera = cam_o
world = bpy.data.worlds.new("Sky")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (*hexrgb("#9fdcff"), 1)
scene.world = world

# ================================================================= EXPORT
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + ".blend")
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_apply=True,
    export_extras=True,  # keeps the "label" custom property on the LVL_* empties
    export_lights=False,
    export_cameras=False,
    export_yup=True,
)
print("Exported", OUT, os.path.getsize(OUT) // 1024, "KB")
