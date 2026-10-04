"""
Gera os elementos 3D do jogo "Chunks Français" com o Blender.

Uso (Blender instalado):   blender -b -P gerar_assets.py
Uso (módulo bpy via pip):  python gerar_assets.py

Cada elemento é modelado, iluminado e renderizado (Cycles, fundo transparente)
como WEBP em ../assets/.
"""
import bpy, bmesh, math, os
from mathutils import Vector

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
os.makedirs(OUT, exist_ok=True)


def hexcol(h, a=1.0):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    # sRGB -> linear
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*c, a)


def reset():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.curves):
        for b in list(coll):
            coll.remove(b)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 48
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.exposure = 0.0
    sc.render.image_settings.file_format = "WEBP"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.quality = 88
    w = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    bg = w.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = hexcol("#dfe8ff")
    bg.inputs["Strength"].default_value = 0.9


def mat(name, color, rough=0.45, metal=0.0, emit=0.0, coat=0.25):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = hexcol(color)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if "Coat Weight" in p.inputs:
        p.inputs["Coat Weight"].default_value = coat
    if emit:
        p.inputs["Emission Color"].default_value = hexcol(color)
        p.inputs["Emission Strength"].default_value = emit
    return m


def smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True


def finish(o, m, loc=None, rot=None, scale=None, sm=True):
    if loc: o.location = loc
    if rot: o.rotation_euler = [math.radians(a) for a in rot]
    if scale: o.scale = scale
    o.data.materials.append(m)
    if sm: smooth(o)
    return o


def sphere(m, loc, scale=(1, 1, 1), rot=None, r=1):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=48, ring_count=24)
    return finish(bpy.context.object, m, loc, rot, scale)


def cyl(m, loc, r, depth, rot=None, verts=48, scale=None, bevel=0.0, sm=True):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, vertices=verts)
    o = finish(bpy.context.object, m, loc, rot, scale, sm)
    if bevel:
        b = o.modifiers.new("bev", "BEVEL"); b.width = bevel; b.segments = 6
        b.limit_method = "ANGLE"
    return o


def cone(m, loc, r1, r2, depth, rot=None, verts=48):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=verts)
    return finish(bpy.context.object, m, loc, rot)


def box(m, loc, size, bevel=0.1, segs=8):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.location = loc
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(m)
    b = o.modifiers.new("bev", "BEVEL"); b.width = bevel; b.segments = segs
    smooth(o)
    o.data.shade_smooth() if hasattr(o.data, "shade_smooth") else None
    return o


def camera(loc, target, lens=50, ortho=None):
    cd = bpy.data.cameras.new("cam")
    if ortho:
        cd.type = "ORTHO"; cd.ortho_scale = ortho
    cd.lens = lens
    c = bpy.data.objects.new("cam", cd)
    bpy.context.scene.collection.objects.link(c)
    c.location = loc
    d = Vector(target) - Vector(loc)
    c.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = c
    return c


def light(kind, loc, energy, size=3, target=(0, 0, 0), color="#ffffff"):
    ld = bpy.data.lights.new(kind, kind)
    ld.energy = energy
    ld.color = hexcol(color)[:3]
    if kind == "AREA":
        ld.size = size
    l = bpy.data.objects.new(kind, ld)
    bpy.context.scene.collection.objects.link(l)
    l.location = loc
    l.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()


def studio(target=(0, 0, 0), k=1.0):
    light("AREA", (-4, -5, 6), 900 * k, 5, target)
    light("AREA", (5, -3, 3), 350 * k, 4, target, "#ffe9d6")
    light("AREA", (0, 5, 4), 600 * k, 4, target, "#d6e6ff")


def render(name, w, h):
    sc = bpy.context.scene
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.render.filepath = os.path.join(OUT, name + ".webp")
    bpy.ops.render.render(write_still=True)
    print("ok", name)


# ---------------------------------------------------------------- mascote
def mascot(pose):
    reset()
    blue = mat("blue", "#2f6fd6", 0.5)
    white = mat("white", "#f7f7fb", 0.5)
    red = mat("red", "#e8433b", 0.45)
    orange = mat("orange", "#ff9f1c", 0.4)
    black = mat("black", "#1b1d2a", 0.3)
    beret = mat("beret", "#262a3b", 0.8, coat=0)
    shine = mat("shine", "#ffffff", 0.2, emit=2)

    sphere(blue, (0, 0, 1), (1, 0.92, 1.05))
    sphere(white, (0, -0.5, 0.82), (0.72, 0.5, 0.78))
    # cauda tricolor
    for i, (c, ang) in enumerate([(blue, -35), (white, 0), (red, 35)]):
        sphere(c, (math.sin(math.radians(ang)) * 0.45, 0.85, 1.5 + math.cos(math.radians(ang)) * 0.2),
               (0.2, 0.18, 0.6), rot=(-25, ang, 0))
    # olhos
    for s in (-1, 1):
        if pose == "happy":
            for d in (-1, 1):
                cyl(black, (s * 0.36 + d * 0.1, -0.99, 1.38), 0.065, 0.3, verts=16)
                o = bpy.context.object
                o.rotation_euler = (0, math.radians(-d * 55), 0)
                o.location.z = 1.37
        else:
            sphere(white, (s * 0.36, -0.78, 1.35), (0.27, 0.18, 0.3))
            pz = 1.29 if pose == "sad" else 1.35
            sphere(black, (s * 0.34, -0.93, pz), (0.14, 0.08, 0.16))
            sphere(shine, (s * 0.30, -1.0, pz + 0.07), (0.045, 0.03, 0.045))
            if pose == "sad":
                cyl(black, (s * 0.38, -0.92, 1.66), 0.035, 0.32, rot=(0, 90 + s * 20, 0), verts=16)
    if pose == "sad":
        sphere(mat("tear", "#69b7ff", 0.1), (0.52, -0.92, 1.12), (0.06, 0.05, 0.1))
    # bico, barbela, crista
    cone(orange, (0, -1.08, 1.12), 0.17, 0.0, 0.42, rot=(90, 0, 0))
    sphere(red, (0, -0.97, 0.9), (0.1, 0.07, 0.17))
    for x, z, r in ((-0.22, 1.98, 0.18), (0, 2.08, 0.22), (0.22, 1.98, 0.18)):
        sphere(red, (x, -0.35, z), (r, r * 0.8, r))
    # boina
    cyl(beret, (0.25, 0.15, 2.02), 0.72, 0.16, rot=(8, 18, 0), bevel=0.07)
    cyl(beret, (0.33, 0.15, 2.14), 0.05, 0.16, rot=(8, 18, 0))
    # asas
    for s in (-1, 1):
        if pose == "happy":
            sphere(blue, (s * 1.08, -0.05, 1.45), (0.22, 0.45, 0.62), rot=(0, s * -55, 0))
        elif pose == "sad":
            sphere(blue, (s * 0.95, -0.05, 0.72), (0.22, 0.42, 0.55), rot=(0, s * 8, 0))
        else:
            sphere(blue, (s * 1.0, -0.05, 0.95), (0.22, 0.45, 0.6), rot=(0, s * 22, 0))
        sphere(orange, (s * 0.35, -0.35, 0.06), (0.24, 0.38, 0.08))
    camera((0, -7.2, 2.0), (0, 0, 1.05), lens=58)
    studio((0, 0, 1))
    render("mascote_" + pose, 360, 360)


# ---------------------------------------------------------------- botões da trilha
def node(name, top, lip):
    reset()
    a = mat("top", top, 0.45, coat=0.3)
    b = mat("lip", lip, 0.45)
    cyl(a, (0, 0, 0.2), 1, 0.32, bevel=0.12)
    cyl(b, (0, 0, -0.02), 1, 0.36, bevel=0.12)
    camera((0, -5.2, 4.3), (0, 0, 0.0), lens=88)
    studio((0, 0, 0), 0.55)
    bpy.context.scene.view_settings.exposure = -0.5
    render("no_" + name, 220, 200)


# ---------------------------------------------------------------- blocos (chunks)
def block(name, col, dark):
    reset()
    a = mat("face", col, 0.4, coat=0.35)
    b = mat("base", dark, 0.5)
    box(a, (0, 0, 0.1), (3.0, 0.6, 1.0), bevel=0.24)
    box(b, (0, 0.08, -0.08), (3.0, 0.6, 1.0), bevel=0.24)
    camera((0, -10, 0), (0, 0, 0), ortho=3.3)
    studio((0, 0, 0), 0.6)
    bpy.context.scene.view_settings.exposure = -0.25
    render("bloco_" + name, 480, 220)


# ---------------------------------------------------------------- troféu
def trophy():
    reset()
    gold = mat("gold", "#ffc93c", 0.22, metal=0.85)
    wood = mat("wood", "#2f6fd6", 0.4)
    box(wood, (0, 0, 0.25), (1.5, 1.5, 0.5), bevel=0.08)
    cyl(gold, (0, 0, 0.62), 0.45, 0.25, bevel=0.05)
    cyl(gold, (0, 0, 1.0), 0.12, 0.6)
    sphere(gold, (0, 0, 1.55), (0.85, 0.85, 0.75))
    cone(gold, (0, 0, 2.1), 0.85, 1.05, 0.9)
    for s in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.4, minor_radius=0.08, location=(s * 1.0, 0, 1.95),
                                         rotation=(math.radians(90), 0, 0))
        finish(bpy.context.object, gold)
    star_mesh(mat("s", "#fff5c2", 0.3, emit=0.6), (0, -0.92, 1.85), 0.32, 0.06, rot=(90, 0, 0))
    camera((0, -8, 3.6), (0, 0, 1.4), lens=55)
    studio((0, 0, 1.3), 1.2)
    render("trofeu", 360, 360)


def star_mesh(m, loc, r, depth, rot=(90, 0, 0)):
    me = bpy.data.meshes.new("star")
    bm = bmesh.new()
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * 0.45
        a = math.pi / 2 + i * math.pi / 5
        pts.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, 0)))
    f = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]:
        v.co.z += depth
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("star", me)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = [math.radians(a) for a in rot]
    o.data.materials.append(m)
    b = o.modifiers.new("bev", "BEVEL"); b.width = r * 0.08; b.segments = 4
    return o


def star():
    reset()
    star_mesh(mat("star", "#ffd43b", 0.3, emit=0.15), (0, 0, 0), 1, 0.35, rot=(90, 0, 0))
    camera((0, -6, 0.8), (0, 0, 0), lens=55)
    studio((0, 0, 0))
    render("estrela", 160, 160)


# ---------------------------------------------------------------- torre Eiffel
def frustum_lattice(m, z0, z1, r0, r1, cuts):
    me = bpy.data.meshes.new("fr")
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, segments=4, radius1=r0, radius2=r1, depth=z1 - z0)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 1e-4],
                              cuts=cuts, use_grid_fill=False)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("fr", me)
    bpy.context.scene.collection.objects.link(o)
    o.location = (0, 0, (z0 + z1) / 2)
    o.rotation_euler = (0, 0, math.radians(45))
    o.data.materials.append(m)
    w = o.modifiers.new("wf", "WIREFRAME"); w.thickness = 0.09
    return o


def eiffel():
    reset()
    iron = mat("iron", "#7a4f33", 0.5, metal=0.4)
    frustum_lattice(iron, 0, 1.6, 1.5, 0.75, 3)
    box(iron, (0, 0, 1.65), (1.5, 1.5, 0.14), bevel=0.03, segs=2)
    frustum_lattice(iron, 1.7, 3.6, 0.7, 0.35, 4)
    box(iron, (0, 0, 3.65), (0.75, 0.75, 0.12), bevel=0.02, segs=2)
    frustum_lattice(iron, 3.7, 6.6, 0.33, 0.07, 6)
    cyl(iron, (0, 0, 6.9), 0.04, 0.6)
    camera((5, -15, 5.5), (0, 0, 3.3), lens=60)
    studio((0, 0, 3), 1.6)
    render("torre", 240, 380)


# ---------------------------------------------------------------- croissant
def croissant():
    reset()
    crust = mat("crust", "#d98a2b", 0.5, coat=0.5)
    tip = mat("tip", "#b8661c", 0.5, coat=0.4)
    n = 9
    R = 1.25
    for i in range(n):
        t = i / (n - 1)
        a = math.radians(-115 + 230 * t)
        r = 0.18 + 0.42 * math.sin(math.pi * t) ** 0.8
        sphere(tip if i in (0, n - 1) else crust,
               (math.sin(a) * R, math.cos(a) * R * 0.75, 0),
               (r * 0.95, r * 1.1, r * 0.85), rot=(0, 0, math.degrees(a)))
    camera((0, -3.2, 5.2), (0, -0.3, 0), lens=45)
    studio((0, 0, 0))
    render("croissant", 220, 170)


if __name__ == "__main__":
    for p in ("idle", "happy", "sad"):
        mascot(p)
    node("feito", "#ffc93c", "#d99a00")
    node("atual", "#58cc02", "#3f9a00")
    node("bloqueado", "#d9dde6", "#aab1bf")
    # legenda da aula: S azul, V verde, O amarelo, AUX roxo, ADV rosa
    for n, c, d in (("S", "#8ab8ea", "#4f86c6"), ("V", "#93d47f", "#5aa548"),
                    ("O", "#ffd966", "#d9a92a"), ("AUX", "#b9a0e3", "#7f63b8"),
                    ("ADV", "#f7a99f", "#d0675b")):
        block(n, c, d)
    trophy()
    star()
    eiffel()
    croissant()
