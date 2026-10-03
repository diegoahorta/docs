"""
Gera todos os modelos 3D do jogo "Shark Week - Dias da Semana" com o Blender.

Uso (Blender instalado):
    blender --background --python blender/build_models.py
ou com o módulo bpy do Python (pip install bpy):
    python3 blender/build_models.py

Os arquivos .glb são gravados em ../models/ e carregados pelo jogo com three.js.
Convenção: a "frente" de cada personagem aponta para -Y no Blender, que vira +Z no glTF.
"""
import math
import os
import random

import bpy  # noqa: I001 (bpy precisa vir antes de bmesh)
import bmesh
from mathutils import Vector

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
os.makedirs(OUT, exist_ok=True)
random.seed(7)


# ---------------------------------------------------------------- utilidades
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


_mats = {}


def mat(name, color, rough=0.55, metal=0.0, emit=0.0, alpha=1.0):
    key = name
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    rgba = (*[c / 255 for c in color], 1.0) if max(color) > 1 else (*color, 1.0)
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit > 0:
        bsdf.inputs["Emission Color"].default_value = rgba
        bsdf.inputs["Emission Strength"].default_value = emit
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            m.blend_method = "BLEND"
    _mats[key] = m
    return m


def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True


def setmat(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)
    return obj


def parent(child, root):
    child.parent = root
    return child


def empty(name, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    bpy.context.scene.collection.objects.link(o)
    return o


def sphere(name, loc, scale, m, seg=24, rings=14, root=None, sm=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    setmat(o, m)
    if sm:
        smooth(o)
    if root:
        parent(o, root)
    return o


def ico(name, loc, r, m, sub=2, root=None, noise=0.0, sm=False, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if noise:
        for v in o.data.vertices:
            v.co *= 1 + random.uniform(-noise, noise)
    setmat(o, m)
    if sm:
        smooth(o)
    if root:
        parent(o, root)
    return o


def cyl(name, loc, r, depth, m, rot=(0, 0, 0), verts=16, root=None, r2=None, sm=True):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    setmat(o, m)
    if sm:
        smooth(o)
    if root:
        parent(o, root)
    return o


def box(name, loc, size, m, rot=(0, 0, 0), root=None, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    setmat(o, m)
    if bevel:
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = 3
    if root:
        parent(o, root)
    return o


def torus(name, loc, R, r, m, rot=(0, 0, 0), root=None, half=False):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot,
                                     major_segments=32, minor_segments=10)
    o = bpy.context.active_object
    o.name = name
    if half:
        bm = bmesh.new()
        bm.from_mesh(o.data)
        kill = [v for v in bm.verts if v.co.y > 0.001]
        bmesh.ops.delete(bm, geom=kill, context="VERTS")
        bm.to_mesh(o.data)
        bm.free()
    setmat(o, m)
    smooth(o)
    if root:
        parent(o, root)
    return o


def fin(name, outline, thick, m, loc=(0, 0, 0), rot=(0, 0, 0), root=None, plane="XZ", subsurf=1):
    """Prisma a partir de um contorno 2D (lista de pontos)."""
    me = bpy.data.meshes.new(name)
    n = len(outline)
    verts = []
    for side in (-1, 1):
        for (a, b) in outline:
            if plane == "XZ":
                verts.append((a, side * thick / 2, b))
            elif plane == "YZ":
                verts.append((side * thick / 2, a, b))
            else:  # XY
                verts.append((a, b, side * thick / 2))
    faces = [list(range(n))[::-1], list(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j, n + i])
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    setmat(o, m)
    if subsurf:
        s = o.modifiers.new("sub", "SUBSURF")
        s.levels = subsurf
        s.render_levels = subsurf
        smooth(o)
    if root:
        parent(o, root)
    return o


def subsurf(o, lv=1):
    s = o.modifiers.new("sub", "SUBSURF")
    s.levels = lv
    s.render_levels = lv
    return o


def export(root, filename):
    bpy.ops.object.select_all(action="DESELECT")

    def sel(o):
        o.select_set(True)
        for c in o.children:
            sel(c)

    sel(root)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, filename),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_vertex_color="ACTIVE",
        export_yup=True,
    )
    print("exported", filename)


def eyes(root, positions, r, white, black, shine, look=(0, -1, 0)):
    look = Vector(look).normalized()
    for i, p in enumerate(positions):
        p = Vector(p)
        sphere(f"EyeWhite{i}", p, (r, r, r), white, root=root)
        side = Vector((1 if p.x > 0 else -1, 0, 0))
        d = (look * 0.75 + side * 0.35).normalized()
        sphere(f"Pupil{i}", p + d * r * 0.62, (r * 0.55, r * 0.55, r * 0.55), black, root=root)
        sphere(f"Shine{i}", p + d * r * 0.95 + Vector((0, 0, r * 0.3)), (r * 0.18,) * 3, shine, root=root)


# ---------------------------------------------------------------- personagens
def build_shark():
    reset()
    root = empty("Shark")
    blue = mat("SharkBody", (74, 142, 214), rough=0.45)
    belly = mat("SharkBelly", (236, 244, 250), rough=0.5)
    white = mat("EyeWhite", (255, 255, 255), rough=0.2)
    black = mat("Pupil", (16, 20, 34), rough=0.1)
    shine = mat("Shine", (255, 255, 255), emit=1.5)
    pink = mat("Cheek", (255, 140, 170), rough=0.6)
    dark = mat("Mouth", (60, 20, 40), rough=0.6)
    tooth = mat("Tooth", (255, 255, 255), rough=0.3)

    # corpo: esfera deformada (nariz em -Y, cauda em +Y)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, radius=1)
    body = bpy.context.active_object
    body.name = "Body"
    for v in body.data.vertices:
        x, y, z = v.co
        t = max(0.0, y)  # metade traseira afina
        taper = 1 - 0.62 * t ** 1.4
        nose = 1 - 0.12 * max(0.0, -y) ** 3
        v.co = Vector((x * 0.82 * taper * nose, y * 1.75, z * 0.78 * taper * nose + 0.08 * max(0.0, -y) ** 2))
    body.data.materials.append(blue)
    body.data.materials.append(belly)
    for p in body.data.polygons:
        c = p.center
        if c.z < -0.18 and c.y < 1.3:
            p.material_index = 1
    smooth(body)
    parent(body, root)

    # barbatana dorsal
    fin("DorsalFin", [(-0.45, 0.0), (0.35, 0.0), (0.25, 0.25), (-0.05, 0.95), (-0.2, 0.75)], 0.16, blue,
        loc=(0, 0.1, 0.62), rot=(0, 0, math.pi / 2), root=root)
    # barbatanas peitorais
    for s in (-1, 1):
        f = fin(f"PecFin{s}", [(0, 0.0), (0.3, 0.0), (0.75, -0.45), (0.55, -0.55)], 0.1, blue,
                loc=(0.6 * s, -0.35, -0.32), rot=(0, 0, 0), root=root, plane="XZ")
        f.scale.x = s
        f.rotation_euler = (0.0, 0.0, -0.35 * s)
    # cauda (objeto separado para animar)
    tail = empty("Tail", (0, 1.55, 0.02))
    parent(tail, root)
    fin("TailFin", [(0, -0.12), (0, 0.12), (0.75, 0.95), (0.95, 0.85), (0.55, 0.0), (0.8, -0.6), (0.6, -0.65)],
        0.14, blue, loc=(0, 0, 0), rot=(0, 0, math.pi / 2), root=tail, plane="XZ")
    sphere("TailJoint", (0, 0.05, 0), (0.18, 0.25, 0.2), blue, root=tail)

    # olhos grandes e fofos
    eyes(root, [(0.42, -1.12, 0.32), (-0.42, -1.12, 0.32)], 0.25, white, black, shine)
    # bochechas
    for s in (-1, 1):
        sphere(f"Cheek{s}", (0.52 * s, -1.0, -0.06), (0.06, 0.12, 0.08), pink, root=root)
    # sorriso com dentinhos
    smile = torus("Smile", (0, -1.48, -0.12), 0.26, 0.045, dark, rot=(math.pi / 2 - 0.35, 0, 0), root=root, half=True)
    smile.rotation_euler = (math.radians(70), 0, math.pi)
    for i, x in enumerate((-0.12, 0.0, 0.12)):
        cyl(f"Tooth{i}", (x, -1.56, -0.25 + abs(x) * 0.6), 0.045, 0.1, tooth, rot=(math.radians(-15), 0, 0),
            verts=8, r2=0.0, root=root)
    # guelras
    for i in range(3):
        for s in (-1, 1):
            box(f"Gill{i}{s}", (0.66 * s, -0.55 + i * 0.16, 0.02), (0.02, 0.03, 0.26), dark,
                rot=(0, 0, 0.25 * s), root=root)
    export(root, "shark.glb")


def build_fish():
    reset()
    root = empty("Fish")
    body_m = mat("Body", (255, 196, 61), rough=0.4)
    stripe = mat("Stripe", (255, 255, 255), rough=0.4)
    white = mat("EyeWhite", (255, 255, 255), rough=0.2)
    black = mat("Pupil", (16, 20, 34), rough=0.1)
    shine = mat("Shine", (255, 255, 255), emit=1.5)
    finm = mat("Fin", (255, 120, 60), rough=0.45)
    body = sphere("Body", (0, 0, 0), (0.42, 0.75, 0.6), body_m, seg=32, rings=18, root=root)
    for i, y in enumerate((-0.15, 0.25)):
        s = sphere(f"Stripe{i}", (0, y, 0), (0.43, 0.07, 0.6 - 0.12 * i), stripe, root=root)
    tail = empty("Tail", (0, 0.7, 0))
    parent(tail, root)
    fin("TailFin", [(0, -0.08), (0, 0.08), (0.5, 0.5), (0.6, 0.0), (0.5, -0.5)], 0.08, finm,
        rot=(0, 0, math.pi / 2), root=tail)
    fin("TopFin", [(-0.3, 0), (0.35, 0), (0.1, 0.35)], 0.06, finm, loc=(0, 0.05, 0.52), rot=(0, 0, math.pi / 2),
        root=root)
    eyes(root, [(0.25, -0.45, 0.15), (-0.25, -0.45, 0.15)], 0.15, white, black, shine)
    torus("Mouth", (0, -0.73, -0.1), 0.09, 0.025, mat("Mouth", (90, 30, 30)), rot=(math.radians(70), 0, math.pi),
          root=root, half=True)
    export(root, "fish.glb")


def build_jelly():
    reset()
    root = empty("Jelly")
    dome_m = mat("JellyDome", (255, 120, 210), rough=0.15, emit=0.6, alpha=0.75)
    tent_m = mat("JellyTentacle", (255, 170, 230), rough=0.3, emit=0.4, alpha=0.8)
    white = mat("EyeWhite", (255, 255, 255))
    black = mat("Pupil", (40, 10, 40))
    shine = mat("Shine", (255, 255, 255), emit=1.5)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.8, location=(0, 0, 0))
    d = bpy.context.active_object
    d.name = "Dome"
    bm = bmesh.new()
    bm.from_mesh(d.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.15], context="VERTS")
    for v in bm.verts:
        a = math.atan2(v.co.y, v.co.x)
        if v.co.z < 0.05:
            v.co.x *= 1 + 0.08 * math.sin(a * 8)
            v.co.y *= 1 + 0.08 * math.sin(a * 8)
    bm.to_mesh(d.data)
    bm.free()
    setmat(d, dome_m)
    smooth(d)
    sol = d.modifiers.new("sol", "SOLIDIFY")
    sol.thickness = 0.06
    parent(d, root)
    for i in range(8):
        a = i / 8 * math.tau
        r = 0.45
        pts = []
        tent = empty(f"Tentacle{i}", (math.cos(a) * r, math.sin(a) * r, -0.1))
        parent(tent, root)
        for k in range(5):
            cyl(f"T{i}_{k}", (math.sin(k * 1.3 + i) * 0.08, 0, -0.18 - k * 0.28), 0.06 - k * 0.009, 0.32, tent_m,
                verts=8, root=tent)
    eyes(root, [(0.24, -0.78, 0.2), (-0.24, -0.78, 0.2)], 0.13, white, black, shine)
    export(root, "jellyfish.glb")


def build_crab():
    reset()
    root = empty("Crab")
    red = mat("CrabShell", (232, 72, 60), rough=0.4)
    white = mat("EyeWhite", (255, 255, 255))
    black = mat("Pupil", (20, 20, 20))
    shine = mat("Shine", (255, 255, 255), emit=1.5)
    sphere("Shell", (0, 0, 0.35), (0.6, 0.45, 0.28), red, root=root)
    for s in (-1, 1):
        cyl(f"EyeStalk{s}", (0.16 * s, -0.25, 0.65), 0.04, 0.3, red, verts=8, root=root)
        for k in range(3):
            leg = cyl(f"Leg{s}{k}", (0.62 * s, -0.15 + k * 0.17, 0.15), 0.045, 0.45, red,
                      rot=(0, math.radians(60) * s, 0), verts=8, root=root)
        arm = empty(f"Claw{s}", (0.55 * s, -0.4, 0.3))
        parent(arm, root)
        cyl(f"Arm{s}", (0.1 * s, -0.1, 0), 0.06, 0.35, red, rot=(math.radians(60), 0, -0.6 * s), verts=8, root=arm)
        sphere(f"Pincer{s}", (0.2 * s, -0.32, 0.12), (0.18, 0.22, 0.13), red, root=arm)
        box(f"PincerCut{s}", (0.2 * s, -0.5, 0.12), (0.05, 0.12, 0.02), black, root=arm)
    eyes(root, [(0.16, -0.27, 0.85), (-0.16, -0.27, 0.85)], 0.09, white, black, shine)
    export(root, "crab.glb")


# ---------------------------------------------------------------- cenário
def build_seabed():
    reset()
    root = empty("Seabed")
    size, n = 260, 120
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=n, y_subdivisions=n, size=size)
    g = bpy.context.active_object
    g.name = "Sand"
    for v in g.data.vertices:
        x, y = v.co.x, v.co.y
        r = math.hypot(x, y)
        h = (math.sin(x * 0.07) * math.cos(y * 0.06) * 0.9 + math.sin(x * 0.21 + y * 0.13) * 0.25
             + math.sin(x * 0.5 + 1.3) * math.sin(y * 0.45) * 0.08)
        # dunas mais altas nas bordas do mapa
        h += max(0, r - 75) ** 1.35 * 0.12
        v.co.z = h
    me = g.data
    ca = me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            co = me.vertices[vi].co
            k = 0.5 + 0.5 * math.sin(co.x * 0.33 + math.sin(co.y * 0.21) * 2.0)
            k2 = 0.5 + 0.5 * math.sin(co.y * 0.9 + co.x * 0.15)
            base = Vector((0.95, 0.85, 0.62))
            darker = Vector((0.78, 0.68, 0.5))
            c = base.lerp(darker, k * 0.6 + k2 * 0.15)
            if co.z > 3:
                c = c.lerp(Vector((0.55, 0.62, 0.7)), min(1, (co.z - 3) / 8))
            ca.data[li].color = (c.x, c.y, c.z, 1)
    me.color_attributes.active_color = ca
    sand = mat("Sand", (255, 255, 255), rough=0.95)
    setmat(g, sand)
    smooth(g)
    parent(g, root)
    export(root, "seabed.glb")


def build_rock():
    reset()
    root = empty("Rock")
    m = mat("Rock", (128, 118, 150), rough=0.9)
    moss = mat("Moss", (90, 160, 110), rough=0.9)
    r = ico("RockA", (0, 0, 0.4), 1.0, m, sub=3, noise=0.18, root=root, scale=(1.3, 1, 0.8))
    subsurf(r)
    ico("RockB", (0.9, 0.5, 0.2), 0.55, m, sub=2, noise=0.2, root=root)
    ico("Moss", (-0.2, 0.1, 1.05), 0.45, moss, sub=2, noise=0.15, root=root, scale=(1.4, 1.2, 0.35), sm=True)
    export(root, "rock.glb")


def build_corals():
    # coral galho
    reset()
    root = empty("CoralBranch")
    m = mat("CoralPink", (255, 105, 150), rough=0.7)

    def branch(p, d, length, r, depth):
        end = p + d * length
        mid = (p + end) / 2
        o = cyl("b", mid, r, length, m, verts=10, r2=r * 0.75, root=root)
        o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        sphere("tip", end, (r * 0.8,) * 3, m, seg=10, rings=6, root=root)
        if depth > 0:
            for k in range(2 + (depth > 1)):
                a = random.uniform(0, math.tau)
                nd = (d + Vector((math.cos(a), math.sin(a), 0)) * random.uniform(0.5, 0.9)).normalized()
                branch(end, nd, length * 0.72, r * 0.72, depth - 1)

    branch(Vector((0, 0, 0)), Vector((0, 0, 1)), 1.1, 0.16, 3)
    export(root, "coral_branch.glb")

    # coral cérebro
    reset()
    root = empty("CoralBrain")
    m = mat("CoralBrain", (255, 170, 70), rough=0.8)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1, location=(0, 0, 0.3))
    o = bpy.context.active_object
    for v in o.data.vertices:
        n = v.co.normalized()
        bump = 0.07 * math.sin(n.x * 18 + math.sin(n.y * 9) * 2) * math.sin(n.y * 16 + n.z * 7)
        v.co = v.co * (1 + bump)
        if v.co.z < 0:
            v.co.z *= 0.3
    o.scale = (1.1, 1.1, 0.8)
    setmat(o, m)
    smooth(o)
    parent(o, root)
    export(root, "coral_brain.glb")

    # coral tubo
    reset()
    root = empty("CoralTube")
    m = mat("CoralTube", (150, 110, 255), rough=0.6)
    inner = mat("CoralTubeInner", (60, 30, 120), rough=0.8)
    for i in range(6):
        a = i / 6 * math.tau + random.uniform(0, 0.4)
        r = 0.0 if i == 0 else 0.42
        h = random.uniform(0.9, 2.0)
        x, y = math.cos(a) * r, math.sin(a) * r
        cyl(f"Tube{i}", (x, y, h / 2), 0.17, h, m, verts=14, root=root, r2=0.22)
        cyl(f"Hole{i}", (x, y, h + 0.005), 0.15, 0.02, inner, verts=14, root=root)
    export(root, "coral_tube.glb")


def build_seaweed():
    reset()
    root = empty("Seaweed")
    m = mat("Seaweed", (60, 190, 100), rough=0.6)
    # tira vertical ondulada (balança com shader/rotação no jogo)
    pts = []
    h, segs = 5.0, 14
    outline = []
    for i in range(segs + 1):
        t = i / segs
        w = 0.28 * (1 - t * 0.7)
        outline.append((w + math.sin(t * 7) * 0.12, t * h))
    for i in range(segs, -1, -1):
        t = i / segs
        w = 0.28 * (1 - t * 0.7)
        outline.append((-w + math.sin(t * 7) * 0.12, t * h))
    outline[segs] = (math.sin(7) * 0.12, h + 0.2)
    fin("Blade", outline, 0.05, m, root=root, subsurf=0)
    fin("Blade2", outline, 0.05, m, rot=(0, 0, math.pi / 2), root=root, subsurf=0).scale = (0.8, 0.8, 0.75)
    export(root, "seaweed.glb")


def build_shell_star():
    reset()
    root = empty("Starfish")
    m = mat("Starfish", (255, 110, 70), rough=0.7)
    dots = mat("StarDots", (255, 220, 160), rough=0.7)
    outline = []
    for i in range(10):
        a = i / 10 * math.tau + math.pi / 2
        r = 0.7 if i % 2 == 0 else 0.3
        outline.append((math.cos(a) * r, math.sin(a) * r))
    fin("Star", outline, 0.16, m, plane="XY", loc=(0, 0, 0.08), root=root, subsurf=2)
    for i in range(5):
        a = i / 5 * math.tau + math.pi / 2
        sphere(f"Dot{i}", (math.cos(a) * 0.35, math.sin(a) * 0.35, 0.16), (0.05,) * 3, dots, seg=8, rings=5,
               root=root)
    export(root, "starfish.glb")

    reset()
    root = empty("Shell")
    m = mat("Shell", (255, 214, 220), rough=0.4)
    rib = mat("ShellRib", (240, 150, 170), rough=0.4)
    s = sphere("ShellBody", (0, 0, 0.1), (0.6, 0.5, 0.18), m, root=root)
    for i in range(7):
        a = math.radians(-60 + i * 20)
        box(f"Rib{i}", (math.sin(a) * 0.25, -math.cos(a) * 0.25 + 0.2, 0.25), (0.04, 0.55, 0.03), rib,
            rot=(0, 0, a), root=root)
    export(root, "shell.glb")


def build_chest():
    reset()
    root = empty("Chest")
    wood = mat("Wood", (150, 92, 50), rough=0.8)
    gold = mat("Gold", (255, 200, 40), rough=0.25, metal=0.8, emit=0.3)
    box("Base", (0, 0, 0.45), (1.6, 1.0, 0.9), wood, root=root, bevel=0.04)
    lid = cyl("Lid", (0, 0, 0.9), 0.5, 1.6, wood, rot=(0, math.pi / 2, 0), verts=20, root=root)
    for x in (-0.6, 0.6):
        box(f"Band{x}", (x, 0, 0.7), (0.12, 1.04, 1.2), gold, root=root)
    box("Lock", (0, -0.52, 0.85), (0.22, 0.08, 0.28), gold, root=root)
    for i in range(10):
        cyl(f"Coin{i}", (random.uniform(-0.5, 0.5), random.uniform(-0.25, 0.25), 1.35 + random.uniform(0, 0.1)),
            0.13, 0.04, gold, rot=(random.uniform(0, 1), random.uniform(0, 1), 0), verts=12, root=root)
    export(root, "chest.glb")


# ---------------------------------------------------------------- compromissos (lugares)
def build_home():
    reset()
    root = empty("Home")
    shell = mat("HomeShell", (255, 160, 190), rough=0.5)
    stripe = mat("HomeStripe", (255, 225, 235), rough=0.5)
    door = mat("Door", (110, 70, 160), rough=0.6)
    win = mat("Window", (130, 220, 255), rough=0.1, emit=0.6)
    frame = mat("Frame", (255, 210, 80), rough=0.5)
    # casa em forma de concha em espiral (caracol)
    for i in range(5):
        r = 3.0 - i * 0.55
        sphere(f"Spiral{i}", (0, 0, 1.6 + i * 1.15), (r, r, 1.0), shell if i % 2 == 0 else stripe, seg=32, rings=16,
               root=root)
    cyl("Tip", (0, 0, 7.3), 0.45, 1.2, shell, r2=0.05, root=root)
    box("Door", (0, -2.55, 1.2), (1.2, 0.6, 2.0), door, root=root, bevel=0.1)
    sphere("DoorTop", (0, -2.55, 2.2), (0.6, 0.3, 0.6), door, root=root)
    sphere("Knob", (0.35, -2.9, 1.2), (0.1,) * 3, frame, root=root)
    for s in (-1, 1):
        torus(f"WinFrame{s}", (1.5 * s, -2.35, 3.0), 0.5, 0.1, frame, rot=(math.pi / 2, 0, 0.5 * s), root=root)
        cyl(f"Win{s}", (1.5 * s, -2.35, 3.0), 0.45, 0.1, win, rot=(math.pi / 2, 0, 0.5 * s), root=root)
    for s in (-1, 1):
        sphere(f"Bush{s}", (2.2 * s, -2.5, 0.3), (0.7, 0.6, 0.5), mat("Bush", (70, 200, 120)), root=root)
    export(root, "place_home.glb")


def build_school():
    reset()
    root = empty("School")
    wall = mat("SchoolWall", (255, 215, 90), rough=0.6)
    roof = mat("SchoolRoof", (230, 70, 70), rough=0.5)
    win = mat("Window", (130, 220, 255), rough=0.1, emit=0.6)
    door = mat("Door", (60, 110, 200), rough=0.6)
    white = mat("White", (255, 255, 255))
    gold = mat("Bell", (255, 200, 40), rough=0.25, metal=0.8)
    green = mat("Board", (40, 120, 80))
    box("Main", (0, 0, 2.0), (7.0, 4.0, 4.0), wall, root=root, bevel=0.15)
    roof_o = fin("Roof", [(-4.0, 0), (4.0, 0), (0, 2.2)], 4.6, roof, loc=(0, 0, 4.0), root=root, subsurf=0)
    box("Tower", (0, 0, 5.4), (1.8, 1.8, 2.6), wall, root=root, bevel=0.1)
    cyl("TowerRoof", (0, 0, 7.4), 1.5, 1.5, roof, r2=0.0, verts=4, rot=(0, 0, math.pi / 4), root=root, sm=False)
    sphere("Bell", (0, -0.95, 5.6), (0.45, 0.35, 0.5), gold, root=root)
    for i, x in enumerate((-2.4, -1.2, 1.2, 2.4)):
        box(f"Win{i}", (x, -2.02, 2.6), (0.8, 0.1, 0.9), win, root=root)
        box(f"WinF{i}", (x, -2.0, 2.6), (0.95, 0.08, 1.05), white, root=root)
    box("Door", (0, -2.05, 1.1), (1.4, 0.15, 2.2), door, root=root, bevel=0.05)
    box("Board", (0, -2.06, 3.55), (2.6, 0.08, 0.6), green, root=root)
    # pilha de livros gigantes
    for i, c in enumerate([(240, 80, 80), (80, 160, 240), (120, 210, 90)]):
        box(f"Book{i}", (4.6, -1.2, 0.25 + i * 0.5), (1.6 - i * 0.15, 1.1, 0.45), mat(f"Book{i}", c), root=root,
            rot=(0, 0, 0.2 * i), bevel=0.04)
    export(root, "place_school.glb")


def build_football():
    reset()
    root = empty("Football")
    field = mat("Field", (70, 190, 110), rough=0.9)
    line = mat("Line", (255, 255, 255), rough=0.6)
    post = mat("Post", (250, 250, 250), rough=0.3)
    netm = mat("Net", (220, 240, 255), rough=0.5, alpha=0.6)
    black = mat("BallBlack", (25, 25, 25))
    box("Field", (0, 0, 0.1), (14, 9, 0.2), field, root=root)
    box("Mid", (0, 0, 0.22), (0.15, 9, 0.04), line, root=root)
    torus("Circle", (0, 0, 0.22), 1.6, 0.07, line, root=root)
    for s in (-1, 1):
        x = 6.6 * s
        for y in (-1.8, 1.8):
            cyl(f"Post{s}{y}", (x, y, 1.3), 0.12, 2.6, post, root=root)
        cyl(f"Bar{s}", (x, 0, 2.6), 0.12, 3.84, post, rot=(math.pi / 2, 0, 0), root=root)
        box(f"Net{s}", (x + 0.6 * s, 0, 1.3), (0.05, 3.6, 2.5), netm, root=root, rot=(0, -0.3 * s, 0))
    # bola gigante
    ball = sphere("Ball", (2.5, -2.0, 1.0), (0.8, 0.8, 0.8), line, seg=32, rings=16, root=root)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1)
    tmp = bpy.context.active_object
    spots = [v.co.copy().normalized() for v in tmp.data.vertices]
    bpy.data.objects.remove(tmp)
    for i, n in enumerate(spots):
        sphere(f"Spot{i}", Vector((2.5, -2.0, 1.0)) + n * 0.74, (0.2, 0.2, 0.2), black, seg=12, rings=6, root=root)
    export(root, "place_football.glb")


def build_arcade():
    reset()
    root = empty("Arcade")
    body = mat("ArcadeBody", (120, 70, 220), rough=0.4)
    trim = mat("ArcadeTrim", (255, 80, 200), rough=0.3, emit=0.8)
    scr = mat("Screen", (40, 255, 180), rough=0.1, emit=1.6)
    black = mat("Panel", (30, 30, 50))
    red = mat("BtnRed", (255, 60, 60), emit=0.6)
    yel = mat("BtnYellow", (255, 220, 40), emit=0.6)
    for i, x in enumerate((-2.0, 0.0, 2.0)):
        g = empty(f"Cabinet{i}", (x, 0, 0))
        parent(g, root)
        box("Cab", (0, 0, 2.2), (1.7, 1.6, 4.4), body, root=g, bevel=0.1)
        box("Marquee", (0, -0.6, 4.2), (1.72, 0.6, 0.6), trim, root=g)
        box("Screen", (0, -0.82, 3.0), (1.3, 0.05, 1.1), scr, root=g)
        box("Panel", (0, -1.05, 2.05), (1.7, 0.8, 0.25), black, rot=(0.25, 0, 0), root=g)
        cyl("Stick", (-0.4, -1.1, 2.4), 0.05, 0.45, black, root=g)
        sphere("Knob", (-0.4, -1.1, 2.65), (0.14,) * 3, red, root=g)
        for k, xx in enumerate((0.15, 0.45)):
            cyl(f"Btn{k}", (xx, -1.1, 2.22), 0.11, 0.1, yel if k else red, rot=(0.25, 0, 0), root=g)
        box("Stripe", (0.86, 0, 2.2), (0.04, 1.4, 3.8), trim, root=g)
        box("Stripe2", (-0.86, 0, 2.2), (0.04, 1.4, 3.8), trim, root=g)
    # controle de videogame gigante
    pad = mat("Gamepad", (60, 60, 80), rough=0.4)
    sphere("PadBody", (0, -3.0, 0.5), (1.4, 0.7, 0.35), pad, root=root)
    for s in (-1, 1):
        sphere(f"PadGrip{s}", (1.1 * s, -2.75, 0.4), (0.55, 0.65, 0.35), pad, root=root)
    box("DpadA", (-0.7, -3.0, 0.85), (0.5, 0.15, 0.1), black, root=root)
    box("DpadB", (-0.7, -3.0, 0.85), (0.15, 0.5, 0.1), black, root=root)
    for k, (dx, dy, mm) in enumerate([(0.6, -0.1, red), (0.85, 0.1, yel), (0.6, 0.3, scr), (0.35, 0.1, trim)]):
        sphere(f"PadBtn{k}", (dx, -3.0 + dy, 0.82), (0.12, 0.12, 0.08), mm, root=root)
    export(root, "place_arcade.glb")


def build_music():
    reset()
    root = empty("Music")
    shell = mat("StageShell", (255, 200, 120), rough=0.4)
    rib = mat("StageRib", (255, 150, 90), rough=0.4)
    floor = mat("Stage", (90, 200, 220), rough=0.4)
    spk = mat("Speaker", (40, 40, 60))
    cone = mat("SpeakerCone", (120, 120, 150), metal=0.4)
    note = mat("Note", (255, 255, 255), emit=1.2)
    cyl("Stage", (0, 0, 0.3), 4.2, 0.6, floor, verts=32, root=root)
    # concha gigante (meio-domo com nervuras)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, radius=4.0, location=(0, 0.6, 0.6))
    d = bpy.context.active_object
    d.name = "ShellDome"
    bm = bmesh.new()
    bm.from_mesh(d.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -0.3 or v.co.z < -0.1], context="VERTS")
    for v in bm.verts:
        a = math.atan2(v.co.z, v.co.x)
        v.co *= 1 + 0.05 * math.cos(a * 14)
    bm.to_mesh(d.data)
    bm.free()
    setmat(d, shell)
    smooth(d)
    sol = d.modifiers.new("sol", "SOLIDIFY")
    sol.thickness = 0.25
    d.scale = (1.0, 1.0, 1.25)
    parent(d, root)
    for s in (-1, 1):
        box(f"Speaker{s}", (3.6 * s, -1.2, 1.8), (1.1, 1.0, 2.4), spk, root=root, bevel=0.05)
        for k, z in enumerate((1.2, 2.4)):
            cyl(f"Cone{s}{k}", (3.6 * s, -1.72, z), 0.38 - k * 0.12, 0.08, cone, rot=(math.pi / 2, 0, 0), root=root)
    # notas musicais
    for i, (x, z) in enumerate([(-1.6, 5.2), (0.4, 6.0), (2.0, 5.0)]):
        sphere(f"NoteHead{i}", (x, -0.5, z), (0.32, 0.2, 0.24), note, root=root)
        box(f"NoteStem{i}", (x + 0.28, -0.5, z + 0.6), (0.07, 0.07, 1.2), note, root=root)
        box(f"NoteFlag{i}", (x + 0.48, -0.5, z + 1.1), (0.4, 0.07, 0.18), note, rot=(0, -0.5, 0), root=root)
    # microfone
    cyl("MicStand", (0, -1.4, 1.3), 0.05, 1.6, spk, root=root)
    sphere("Mic", (0, -1.4, 2.2), (0.18, 0.18, 0.24), cone, root=root)
    export(root, "place_music.glb")


def build_tv():
    reset()
    root = empty("TV")
    body = mat("TVBody", (255, 120, 60), rough=0.4)
    scr = mat("TVScreen", (90, 200, 255), rough=0.1, emit=1.5)
    black = mat("TVDark", (30, 30, 40))
    knob = mat("Knob", (255, 220, 60))
    for s in (-1, 1):
        cyl(f"Leg{s}", (1.6 * s, 0, 0.6), 0.15, 1.2, black, rot=(0, 0.25 * s, 0), root=root)
    box("Body", (0, 0, 3.0), (5.0, 2.6, 3.8), body, root=root, bevel=0.35)
    box("Screen", (-0.5, -1.33, 3.0), (3.4, 0.06, 2.7), scr, root=root, bevel=0.0)
    box("Bezel", (-0.5, -1.3, 3.0), (3.7, 0.05, 3.0), black, root=root)
    for k, z in enumerate((3.8, 3.0)):
        cyl(f"Knob{k}", (1.85, -1.35, z), 0.25, 0.15, knob, rot=(math.pi / 2, 0, 0), root=root)
    for k in range(4):
        box(f"Grill{k}", (1.85, -1.33, 2.0 - k * 0.0 + -k * 0.18 + 0.3), (0.7, 0.05, 0.07), black, root=root)
    for s in (-1, 1):
        cyl(f"Antenna{s}", (0.7 * s, 0, 5.8), 0.05, 2.2, black, rot=(0, 0.45 * s, 0), root=root)
        sphere(f"AntTip{s}", (1.18 * s, 0, 6.85), (0.14,) * 3, knob, root=root)
    sphere("AntBase", (0, 0, 4.95), (0.5, 0.5, 0.3), black, root=root)
    # balde de pipoca
    pop = mat("Popcorn", (255, 250, 220))
    cyl("Bucket", (3.6, -1.5, 0.7), 0.7, 1.4, mat("BucketRed", (230, 50, 50)), r2=0.9, root=root)
    for i in range(14):
        sphere(f"Pop{i}", (3.6 + random.uniform(-0.6, 0.6), -1.5 + random.uniform(-0.6, 0.6),
                           1.45 + random.uniform(0, 0.4)), (0.2,) * 3, pop, seg=8, rings=5, root=root)
    export(root, "place_tv.glb")


def build_calendar():
    """Pedra-calendário: ponto de partida e lugar do 'Today is ...'."""
    reset()
    root = empty("Calendar")
    stone = mat("CalStone", (150, 140, 175), rough=0.9)
    page = mat("CalPage", (255, 255, 255), rough=0.6)
    top = mat("CalTop", (230, 70, 70), rough=0.5)
    ring = mat("CalRing", (255, 210, 80), metal=0.6, rough=0.3)
    r = ico("Base", (0, 0, 0.6), 1.6, stone, sub=3, noise=0.12, scale=(1.6, 1.1, 0.6), root=root)
    subsurf(r)
    box("Board", (0, 0, 3.4), (3.6, 0.3, 3.2), page, root=root, bevel=0.1)
    box("Top", (0, 0, 5.1), (3.6, 0.34, 0.6), top, root=root, bevel=0.08)
    for x in (-1.2, 0, 1.2):
        torus(f"Ring{x}", (x, 0, 5.4), 0.22, 0.05, ring, rot=(0, math.pi / 2, 0), root=root)
    export(root, "place_calendar.glb")


if __name__ == "__main__":
    build_shark()
    build_fish()
    build_jelly()
    build_crab()
    build_seabed()
    build_rock()
    build_corals()
    build_seaweed()
    build_shell_star()
    build_chest()
    build_home()
    build_school()
    build_football()
    build_arcade()
    build_music()
    build_tv()
    build_calendar()
    print("OK - modelos em", os.path.abspath(OUT))
