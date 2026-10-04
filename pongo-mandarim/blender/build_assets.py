"""
Pongo vai à China — gerador de assets 3D (Blender)
===================================================

Gera todos os modelos 3D do jogo em formato glTF binário (.glb):

  pongo.glb       o cachorrinho Pongo, com animações Idle / Walk / Jump / Spin
  panda.glb       Lili, a amiga panda que espera o Pongo em Pequim (Idle / Wave)
  gate.glb        portal chinês (牌坊) com duas portas que se abrem (DoorL / DoorR)
  scene_1.glb     O Jardim do Pongo
  scene_2.glb     A Floresta de Bambu
  scene_3.glb     Os Arrozais de Guilin
  scene_4.glb     O Porto e o Mar
  scene_5.glb     A Grande Muralha
  scene_6.glb     Pequim — a vila dos amigos

Como rodar:
  blender --background --python build_assets.py -- ../assets/models
ou, com o Blender como módulo Python (pip install bpy==4.2.0):
  python build_assets.py ../assets/models

Convenções (lidas pelo jogo em js/world.js):
  * O Blender usa Z para cima; o glTF converte para Y para cima.
  * O caminho de cada cenário vai de Y=0 até Y=PATH_LEN no Blender
    (no jogo vira Z=0 → Z=-PATH_LEN). O Pongo olha para +Y.
  * Objetos animados têm o pivô (origem) na articulação.
"""

import math
import os
import random
import sys

import bpy
from mathutils import Vector

PATH_LEN = 64.0

# ------------------------------------------------------------------ utilidades


def out_dir():
    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
    else:
        args = argv[1:]
    d = args[0] if args else os.path.join(os.path.dirname(__file__), "..", "assets", "models")
    os.makedirs(d, exist_ok=True)
    return os.path.abspath(d)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)


_mats = {}


def mat(name, color, rough=0.75, metal=0.0, emit=None, image=None):
    key = name
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*srgb(color), 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*srgb(emit), 1)
        bsdf.inputs["Emission Strength"].default_value = 1.5
    if image is not None:
        tex = m.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = image
        m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    _mats[key] = m
    return m


def srgb(hexstr):
    h = hexstr.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def smooth(obj, on=True):
    if obj.type == "MESH":
        vals = [on] * len(obj.data.polygons)
        obj.data.polygons.foreach_set("use_smooth", vals)


def _finish(obj, name, material, parent, is_smooth):
    obj.name = name
    obj.data.name = name + "_mesh"
    if material:
        obj.data.materials.clear()
        obj.data.materials.append(material)
    smooth(obj, is_smooth)
    if parent:
        set_parent(obj, parent)
    return obj


def set_parent(obj, parent):
    mw = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = mw


def sphere(name, loc, scale=(1, 1, 1), r=1.0, material=None, parent=None, seg=20, rings=12, is_smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, name, material, parent, is_smooth)


def ico(name, loc, r=1.0, scale=(1, 1, 1), material=None, parent=None, sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, name, material, parent, False)


def cyl(name, loc, r=1.0, depth=1.0, rot=(0, 0, 0), material=None, parent=None, verts=12, is_smooth=True, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    return _finish(o, name, material, parent, is_smooth)


def cone(name, loc, r=1.0, depth=1.0, rot=(0, 0, 0), material=None, parent=None, verts=12, is_smooth=False, r2=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    return _finish(o, name, material, parent, is_smooth)


def box(name, loc, size=(1, 1, 1), rot=(0, 0, 0), material=None, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, name, material, parent, False)


def torus(name, loc, R=0.3, r=0.05, rot=(0, 0, 0), material=None, parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=24, minor_segments=8,
                                     location=loc, rotation=rot)
    o = bpy.context.active_object
    return _finish(o, name, material, parent, True)


def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    if parent:
        o.parent = parent
        o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o


def instance(src, name, loc, rot=(0, 0, 0), scale=(1, 1, 1), parent=None):
    """Duplicata ligada (mesma malha) — o glTF reaproveita a malha e o arquivo fica pequeno."""
    o = bpy.data.objects.new(name, src.data)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    o.scale = scale
    if parent:
        o.parent = parent
    return o


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    o.data.name = name + "_mesh"
    return o


def apply_all(o):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def library(name, build):
    """Constrói um objeto-modelo fora de cena (em Y=-500) para ser instanciado."""
    o = build()
    o.name = "LIB_" + name
    o.location = (0, 0, 0)
    bpy.context.scene.collection.objects.unlink(o)
    return o


def export(path, anim=False):
    bpy.ops.object.select_all(action="DESELECT")
    kw = dict(filepath=path, export_format="GLB", export_apply=False, export_yup=True,
              export_animations=anim)
    if anim:
        kw.update(export_animation_mode="NLA_TRACKS", export_force_sampling=True,
                  export_optimize_animation_size=True)
    bpy.ops.export_scene.gltf(**kw)
    print("exportado:", path, os.path.getsize(path) // 1024, "KB")


# --------------------------------------------------------------- animação


def key(obj, frame, loc=None, rot=None, scale=None):
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert("location", frame=frame)
    if rot is not None:
        obj.rotation_euler = rot
        obj.keyframe_insert("rotation_euler", frame=frame)
    if scale is not None:
        obj.scale = scale
        obj.keyframe_insert("scale", frame=frame)


def clip(clip_name, objs, keyer):
    """Cria uma action por objeto e empurra para uma trilha NLA chamada clip_name.
    O exportador junta trilhas homônimas numa única animação glTF."""
    for o in objs:
        base = (o.location.copy(), o.rotation_euler.copy(), o.scale.copy())
        o.animation_data_create()
        act = bpy.data.actions.new(f"{clip_name}_{o.name}")
        o.animation_data.action = act
        keyer(o)
        for fc in act.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
        o.animation_data.action = None
        tr = o.animation_data.nla_tracks.new()
        tr.name = clip_name
        tr.strips.new(clip_name, int(act.frame_range[0]), act)
        o.location, o.rotation_euler, o.scale = base


# =================================================================== PONGO


def bone_texture():
    """Camiseta azul-céu com ossinhos (como na arte de referência)."""
    W = H = 256
    img = bpy.data.images.new("shirt_bones", W, H, alpha=False)
    import numpy as np
    px = np.zeros((H, W, 4), dtype=np.float32)
    base = np.array(srgb("#8fd0f0") + (1,))
    light = np.array(srgb("#c9ecfb") + (1,))
    dark = np.array(srgb("#2f86d6") + (1,))
    px[:] = base
    yy, xx = np.mgrid[0:H, 0:W]
    rng = random.Random(7)
    # manchas camufladas claras
    for _ in range(26):
        cx, cy, rr = rng.randrange(W), rng.randrange(H), rng.randrange(10, 26)
        d = ((xx - cx) % W - W // 2) ** 2 + ((yy - cy) % H - H // 2) ** 2
        px[d < rr * rr] = light
    # ossinhos azuis
    for i in range(18):
        cx, cy = rng.randrange(W), rng.randrange(H)
        ang = rng.random() * math.pi
        dx, dy = math.cos(ang), math.sin(ang)
        L, th = 16, 5
        for t in range(-L, L + 1):
            px_x, px_y = int(cx + dx * t) % W, int(cy + dy * t) % H
            m = (((xx - px_x) % W) - 0) ** 2
            sel = (np.minimum(abs(xx - px_x), W - abs(xx - px_x)) ** 2 +
                   np.minimum(abs(yy - px_y), H - abs(yy - px_y)) ** 2) < th * th
            px[sel] = dark
        for s in (-1, 1):
            for off in (-1, 1):
                ex = cx + dx * L * s - dy * 6 * off
                ey = cy + dy * L * s + dx * 6 * off
                sel = (np.minimum(abs(xx - ex) % W, W - abs(xx - ex) % W) ** 2 +
                       np.minimum(abs(yy - ey) % H, H - abs(yy - ey) % H) ** 2) < 49
                px[sel] = dark
    img.pixels.foreach_set(px.ravel())
    img.file_format = "PNG"
    img.pack()
    return img


def build_pongo(path):
    reset()
    white = mat("pelo_branco", "#fbf3ea", 0.9)
    tan = mat("pelo_caramelo", "#d9893a", 0.9)
    brown = mat("pelo_marrom", "#6b3a22", 0.9)
    pink = mat("orelha_rosa", "#f2a3a6", 0.8)
    black = mat("preto_brilhante", "#141016", 0.15)
    iris = mat("iris", "#8a4a1c", 0.2)
    shine = mat("brilho", "#ffffff", 0.1, emit="#ffffff")
    blue = mat("coleira_azul", "#2449c6", 0.5)
    metal = mat("argola_metal", "#c9ced6", 0.25, 0.9)
    shirt = mat("camiseta_ossos", "#8fd0f0", 0.8, image=bone_texture())
    nail = mat("unhas", "#3b2a25", 0.6)

    root = empty("Pongo")
    rig = empty("Rig", (0, 0, 0), root)

    # corpo + camiseta
    sphere("Body", (0, -0.05, 0.62), (0.34, 0.5, 0.33), material=white, parent=rig)
    sphere("Shirt", (0, 0.03, 0.66), (0.36, 0.42, 0.34), material=shirt, parent=rig)
    sphere("Butt", (0, -0.42, 0.66), (0.27, 0.2, 0.25), material=tan, parent=rig)
    sphere("BackPatch", (0.12, -0.3, 0.86), (0.16, 0.18, 0.08), material=brown, parent=rig)

    # pernas (pivô no quadril/ombro)
    legs = []
    for nm, x, y in (("LegFL", -0.17, 0.27), ("LegFR", 0.17, 0.27), ("LegBL", -0.17, -0.36), ("LegBR", 0.17, -0.36)):
        p = empty(nm, (x, y, 0.5), rig)
        cyl(nm + "_m", (x, y, 0.3), r=0.09, depth=0.42, material=white, parent=p, verts=12)
        paw = sphere(nm + "_paw", (x, y + 0.04, 0.08), (0.11, 0.14, 0.08), material=white, parent=p)
        for k in (-1, 0, 1):
            sphere(f"{nm}_nail{k}", (x + k * 0.045, y + 0.17, 0.05), (0.018, 0.03, 0.018), material=nail, parent=p, seg=8, rings=6)
        legs.append(p)
    # mancha caramelo na pata traseira
    sphere("ThighPatch", (0.22, -0.36, 0.55), (0.1, 0.16, 0.17), material=tan, parent=rig)

    # rabo
    tail = empty("Tail", (0, -0.55, 0.78), rig)
    cone("Tail_m", (0, -0.6, 0.98), r=0.07, depth=0.42, rot=(math.radians(-20), 0, 0), material=white, parent=tail, verts=10, is_smooth=True, r2=0.02)

    # coleira
    torus("Collar", (0, 0.32, 0.93), R=0.2, r=0.04, rot=(math.radians(70), 0, 0), material=blue, parent=rig)
    torus("CollarRing", (-0.12, 0.47, 0.82), R=0.05, r=0.013, rot=(0, math.radians(80), 0), material=metal, parent=rig)
    box("CollarTag", (-0.17, 0.45, 0.72), (0.05, 0.02, 0.18), rot=(0, math.radians(15), 0), material=blue, parent=rig)

    # cabeça (pivô no pescoço)
    head = empty("Head", (0, 0.3, 0.95), rig)
    sphere("Skull", (0, 0.42, 1.2), (0.33, 0.3, 0.3), material=tan, parent=head)
    sphere("SkullTop", (0, 0.36, 1.33), (0.27, 0.24, 0.17), material=brown, parent=head)
    sphere("Blaze", (0, 0.62, 1.22), (0.07, 0.1, 0.22), material=white, parent=head)
    sphere("Cheeks", (0, 0.62, 1.06), (0.22, 0.16, 0.15), material=white, parent=head)
    sphere("Muzzle", (0, 0.76, 1.07), (0.14, 0.13, 0.1), material=white, parent=head)
    sphere("Nose", (0, 0.89, 1.11), (0.065, 0.045, 0.05), material=black, parent=head)
    sphere("Mouth", (0, 0.82, 1.0), (0.05, 0.03, 0.015), material=brown, parent=head, seg=10, rings=6)
    for s, nm in ((-1, "L"), (1, "R")):
        sphere("EyeIris" + nm, (s * 0.13, 0.68, 1.25), (0.085, 0.05, 0.095), material=iris, parent=head)
        sphere("EyePupil" + nm, (s * 0.13, 0.715, 1.255), (0.06, 0.03, 0.068), material=black, parent=head)
        sphere("EyeShine" + nm, (s * 0.13 - 0.02, 0.74, 1.29), (0.022, 0.012, 0.022), material=shine, parent=head, seg=8, rings=6)
        sphere("EyeShine2" + nm, (s * 0.13 + 0.025, 0.74, 1.225), (0.011, 0.008, 0.011), material=shine, parent=head, seg=8, rings=6)

    # orelha esquerda em pé (a marca registrada do Pongo) e direita caída
    earL = empty("EarL", (-0.2, 0.36, 1.42), head)
    sphere("EarL_out", (-0.38, 0.36, 1.68), (0.12, 0.04, 0.3), material=white, parent=earL)
    sphere("EarL_in", (-0.375, 0.39, 1.66), (0.085, 0.02, 0.24), material=pink, parent=earL)
    sphere("EarL_tip", (-0.44, 0.35, 1.9), (0.08, 0.035, 0.09), material=brown, parent=earL)
    earL.rotation_euler = (0, math.radians(-25), 0)

    earR = empty("EarR", (0.26, 0.38, 1.36), head)
    sphere("EarR_m", (0.38, 0.4, 1.16), (0.07, 0.15, 0.26), material=brown, parent=earR)

    objs_anim = [rig, head, earL, earR, tail] + legs

    # ------------------------------------------------ clipes de animação
    F = 24  # frames por ciclo de passo

    def walk(o):
        if o.name.startswith("Leg"):
            front = o.name in ("LegFL", "LegBR")
            a = math.radians(32) * (1 if front else -1)
            key(o, 1, rot=(a, 0, 0))
            key(o, F // 2 + 1, rot=(-a, 0, 0))
            key(o, F + 1, rot=(a, 0, 0))
        elif o.name == "Rig":
            for f, z in ((1, 0), (F // 4 + 1, 0.07), (F // 2 + 1, 0), (3 * F // 4 + 1, 0.07), (F + 1, 0)):
                key(o, f, loc=(0, 0, z))
        elif o.name == "Head":
            for f, rx in ((1, 0.06), (F // 2 + 1, -0.04), (F + 1, 0.06)):
                key(o, f, rot=(rx, 0, 0))
        elif o.name == "Tail":
            for f, rz in ((1, 0.6), (F // 4 + 1, -0.6), (F // 2 + 1, 0.6), (3 * F // 4 + 1, -0.6), (F + 1, 0.6)):
                key(o, f, rot=(0.2, 0, rz))
        elif o.name == "EarR":
            for f, rx in ((1, 0.15), (F // 2 + 1, -0.1), (F + 1, 0.15)):
                key(o, f, rot=(rx, 0, 0))
        elif o.name == "EarL":
            for f, ry in ((1, -0.44), (F // 2 + 1, -0.36), (F + 1, -0.44)):
                key(o, f, rot=(0, ry, 0))

    def idle(o):
        L = 72
        if o.name == "Tail":
            for i in range(9):
                key(o, 1 + i * L // 8, rot=(0.5, 0, 0.5 if i % 2 == 0 else -0.5))
        elif o.name == "Head":  # inclina a cabeça, curioso (como na arte)
            key(o, 1, rot=(0, 0, 0))
            key(o, 25, rot=(0, -0.28, 0.1))
            key(o, 49, rot=(0, -0.28, 0.1))
            key(o, L + 1, rot=(0, 0, 0))
        elif o.name == "EarL":
            key(o, 1, rot=(0, -0.44, 0))
            key(o, 30, rot=(0, -0.44, 0))
            key(o, 34, rot=(0.25, -0.55, 0))
            key(o, 38, rot=(0, -0.44, 0))
            key(o, L + 1, rot=(0, -0.44, 0))
        elif o.name == "Rig":
            key(o, 1, scale=(1, 1, 1))
            key(o, L // 2 + 1, scale=(1.02, 1.02, 0.985))
            key(o, L + 1, scale=(1, 1, 1))
        elif o.name.startswith("Leg"):
            key(o, 1, rot=(0, 0, 0))
            key(o, L + 1, rot=(0, 0, 0))
        elif o.name == "EarR":
            key(o, 1, rot=(0, 0, 0))
            key(o, L + 1, rot=(0, 0, 0))

    def jump(o):
        # pulo de comemoração: agacha, salta, gira e cai
        if o.name == "Rig":
            key(o, 1, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1))
            key(o, 6, loc=(0, 0, -0.05), rot=(0, 0, 0), scale=(1.08, 1.08, 0.85))
            key(o, 14, loc=(0, 0, 1.1), rot=(0, 0, math.pi), scale=(0.95, 0.95, 1.1))
            key(o, 22, loc=(0, 0, 0.0), rot=(0, 0, 2 * math.pi), scale=(1, 1, 1))
            key(o, 26, loc=(0, 0, -0.03), rot=(0, 0, 2 * math.pi), scale=(1.06, 1.06, 0.9))
            key(o, 30, loc=(0, 0, 0), rot=(0, 0, 2 * math.pi), scale=(1, 1, 1))
        elif o.name.startswith("LegF"):
            key(o, 1, rot=(0, 0, 0))
            key(o, 14, rot=(-1.0, 0, 0))
            key(o, 24, rot=(0, 0, 0))
            key(o, 30, rot=(0, 0, 0))
        elif o.name.startswith("LegB"):
            key(o, 1, rot=(0, 0, 0))
            key(o, 14, rot=(0.9, 0, 0))
            key(o, 24, rot=(0, 0, 0))
            key(o, 30, rot=(0, 0, 0))
        elif o.name == "Tail":
            for i in range(11):
                key(o, 1 + i * 3, rot=(0.4, 0, 0.8 if i % 2 else -0.8))
        elif o.name == "EarR":
            key(o, 1, rot=(0, 0, 0))
            key(o, 14, rot=(-1.2, 0, -0.6))
            key(o, 24, rot=(0.3, 0, 0))
            key(o, 30, rot=(0, 0, 0))
        elif o.name == "EarL":
            key(o, 1, rot=(0, -0.44, 0))
            key(o, 14, rot=(0, -0.9, 0))
            key(o, 30, rot=(0, -0.44, 0))
        elif o.name == "Head":
            key(o, 1, rot=(0, 0, 0))
            key(o, 14, rot=(-0.35, 0, 0))
            key(o, 30, rot=(0, 0, 0))

    def sad(o):
        # errou: abaixa a cabeça e as orelhas
        if o.name == "Head":
            key(o, 1, rot=(0, 0, 0))
            key(o, 10, rot=(0.45, 0, 0.12))
            key(o, 40, rot=(0.45, 0, 0.12))
            key(o, 50, rot=(0, 0, 0))
        elif o.name == "EarL":
            key(o, 1, rot=(0, -0.44, 0))
            key(o, 10, rot=(-0.6, -1.3, 0))
            key(o, 40, rot=(-0.6, -1.3, 0))
            key(o, 50, rot=(0, -0.44, 0))
        elif o.name == "Tail":
            key(o, 1, rot=(0, 0, 0))
            key(o, 10, rot=(1.6, 0, 0))
            key(o, 40, rot=(1.6, 0, 0))
            key(o, 50, rot=(0, 0, 0))
        else:
            key(o, 1, rot=tuple(o.rotation_euler), loc=tuple(o.location))
            key(o, 50, rot=tuple(o.rotation_euler), loc=tuple(o.location))

    clip("Walk", objs_anim, walk)
    clip("Idle", objs_anim, idle)
    clip("Jump", objs_anim, jump)
    clip("Sad", objs_anim, sad)
    export(path, anim=True)


# =================================================================== PANDA


def build_panda(path):
    reset()
    w = mat("panda_branco", "#f7f5f0", 0.9)
    k = mat("panda_preto", "#1d1b22", 0.9)
    shine = mat("brilho", "#ffffff", 0.1, emit="#ffffff")
    red = mat("laco_vermelho", "#d0384e", 0.5)
    root = empty("Lili")
    rig = empty("Rig", (0, 0, 0), root)
    sphere("Body", (0, 0, 0.75), (0.55, 0.48, 0.62), material=w, parent=rig)
    sphere("Belt", (0, 0, 0.55), (0.57, 0.5, 0.25), material=k, parent=rig)
    for s in (-1, 1):
        sphere(f"Foot{s}", (s * 0.28, 0.12, 0.15), (0.2, 0.26, 0.16), material=k, parent=rig)
    armL = empty("ArmL", (-0.45, 0.05, 1.05), rig)
    sphere("ArmL_m", (-0.55, 0.18, 0.8), (0.15, 0.15, 0.32), material=k, parent=armL)
    armR = empty("ArmR", (0.45, 0.05, 1.05), rig)
    sphere("ArmR_m", (0.55, 0.18, 0.8), (0.15, 0.15, 0.32), material=k, parent=armR)
    head = empty("Head", (0, 0, 1.25), rig)
    sphere("Skull", (0, 0.05, 1.62), (0.48, 0.42, 0.42), material=w, parent=head)
    for s in (-1, 1):
        sphere(f"Ear{s}", (s * 0.36, 0.0, 2.0), (0.14, 0.08, 0.14), material=k, parent=head)
        sphere(f"Patch{s}", (s * 0.17, 0.38, 1.68), (0.12, 0.06, 0.15), material=k, parent=head)
        sphere(f"Eye{s}", (s * 0.16, 0.43, 1.7), (0.05, 0.02, 0.05), material=shine, parent=head, seg=8, rings=6)
    sphere("Nose", (0, 0.46, 1.52), (0.07, 0.05, 0.045), material=k, parent=head)
    # laço vermelho chinês
    for s in (-1, 1):
        cone(f"Bow{s}", (s * 0.12 + 0.28, 0.0, 2.08), r=0.1, depth=0.22, rot=(0, math.radians(90 * s), 0), material=red, parent=head, verts=8)
    sphere("BowKnot", (0.28, 0.0, 2.08), (0.05, 0.05, 0.05), material=red, parent=head)

    objs = [rig, head, armL, armR]

    def idle(o):
        if o.name == "Rig":
            key(o, 1, scale=(1, 1, 1))
            key(o, 31, scale=(1.03, 1.03, 0.97))
            key(o, 61, scale=(1, 1, 1))
        elif o.name == "Head":
            key(o, 1, rot=(0, 0.12, 0))
            key(o, 31, rot=(0, -0.12, 0))
            key(o, 61, rot=(0, 0.12, 0))
        else:
            key(o, 1, rot=(0, 0, 0))
            key(o, 61, rot=(0, 0, 0))

    def wave(o):
        if o.name == "ArmR":
            key(o, 1, rot=(0, 0, 0))
            for i, a in enumerate((2.4, 2.0, 2.4, 2.0, 2.4)):
                key(o, 6 + i * 6, rot=(0, -a, 0.3))
            key(o, 40, rot=(0, 0, 0))
        elif o.name == "Rig":
            key(o, 1, loc=(0, 0, 0))
            key(o, 10, loc=(0, 0, 0.3))
            key(o, 18, loc=(0, 0, 0))
            key(o, 26, loc=(0, 0, 0.3))
            key(o, 34, loc=(0, 0, 0))
            key(o, 40, loc=(0, 0, 0))
        else:
            key(o, 1, rot=(0, 0, 0))
            key(o, 40, rot=(0, 0, 0))

    clip("Idle", objs, idle)
    clip("Wave", objs, wave)
    export(path, anim=True)


# =================================================================== PORTAL 牌坊


def build_gate(path):
    reset()
    red = mat("laca_vermelha", "#c8283c", 0.45)
    gold = mat("ouro", "#f2b631", 0.3, 0.6)
    roof = mat("telha_verde", "#1e6f6a", 0.6)
    wood = mat("porta_madeira", "#9d1f2f", 0.6)
    root = empty("Gate")
    parts = []
    for s in (-1, 1):
        parts.append(cyl(f"Pillar{s}", (s * 2.2, 0, 2.0), r=0.22, depth=4.0, material=red, verts=12))
        parts.append(cyl(f"Base{s}", (s * 2.2, 0, 0.15), r=0.34, depth=0.3, material=gold, verts=12))
    parts.append(box("Beam", (0, 0, 3.7), (5.4, 0.35, 0.35), material=red))
    parts.append(box("Beam2", (0, 0, 4.3), (5.0, 0.3, 0.3), material=red))
    parts.append(box("Plaque", (0, -0.2, 4.0), (1.4, 0.08, 0.5), material=gold))
    # telhado com beirais curvados
    r1 = box("Roof", (0, 0, 4.75), (6.4, 1.2, 0.25), material=roof)
    parts.append(r1)
    parts.append(box("RoofTop", (0, 0, 5.05), (5.2, 0.7, 0.35), material=roof))
    for s in (-1, 1):
        parts.append(cone(f"Eave{s}", (s * 3.25, 0, 5.0), r=0.25, depth=0.7, rot=(0, math.radians(-35 * s), 0), material=roof, verts=6))
    frame = join(parts, "Frame")
    set_parent(frame, root)
    # portas (pivô na dobradiça)
    for nm, s in (("DoorL", -1), ("DoorR", 1)):
        piv = empty(nm, (s * 1.98, 0, 0), root)
        d = box(nm + "_m", (s * 1.0, 0, 1.7), (1.95, 0.12, 3.3), material=wood, parent=piv)
        for row in range(3):
            for col in range(3):
                sphere(f"{nm}_stud{row}{col}", (s * (0.45 + col * 0.5), -0.08, 0.9 + row * 0.8), (0.06, 0.04, 0.06),
                       material=gold, parent=piv, seg=8, rings=6)
        sphere(nm + "_ring", (s * 0.15, -0.1, 1.7), (0.11, 0.04, 0.11), material=gold, parent=piv, seg=10, rings=6)
    # lanternas
    lr = mat("lanterna", "#ff3b3b", 0.4, emit="#ff2b2b")
    for s in (-1, 1):
        sphere(f"Lantern{s}", (s * 1.3, -0.1, 3.15), (0.25, 0.25, 0.3), material=lr, parent=root)
        cyl(f"LanternCap{s}", (s * 1.3, -0.1, 3.47), r=0.12, depth=0.08, material=gold, parent=root)
    export(path)


# =================================================================== CENÁRIOS


class Kit:
    """Biblioteca de peças reutilizáveis (malhas compartilhadas)."""

    def __init__(self):
        self.m = {
            "grass": mat("grama", "#7cc46a"), "grass2": mat("grama_escura", "#5aa856"),
            "dirt": mat("terra", "#d9b07a"), "stone": mat("pedra", "#a7a9b4"),
            "trunk": mat("tronco", "#7a4e2f"), "leaf": mat("folha", "#4caf50"),
            "leaf2": mat("folha_clara", "#8bd16a"), "pink": mat("flor_rosa", "#ff8fb1"),
            "yellow": mat("flor_amarela", "#ffd23f"), "white": mat("branco", "#fbfbf6"),
            "red": mat("vermelho_china", "#d0384e"), "gold": mat("ouro", "#f2b631", 0.3, 0.5),
            "teal": mat("telha", "#2b7a8c"), "water": mat("agua", "#4fb3d9", 0.15),
            "bamboo": mat("bambu", "#79b843"), "bamboo_ring": mat("bambu_no", "#4f8a2c"),
            "wood": mat("madeira", "#a8683a"), "wall": mat("muralha", "#c9b48e"),
            "wall_dark": mat("muralha_sombra", "#9c8763"), "rice": mat("arroz", "#a6d86a"),
            "karst": mat("montanha", "#5c8f6a"), "karst_top": mat("montanha_topo", "#8fbf7a"),
            "plaster": mat("reboco", "#f3e9d8"), "roof": mat("telhado", "#5d7186"),
            "sail": mat("vela", "#e2723a"), "hull": mat("casco", "#6e3b22"),
            "lantern": mat("lanterna", "#ff3b3b", 0.4, emit="#ff2b2b"), "sand": mat("areia", "#ead6a4"),
            "sakura": mat("ameixeira", "#ffc2d6"), "snow": mat("neve", "#ffffff"),
        }

    def tree(self, kind="round"):
        t = cyl("t", (0, 0, 0.9), r=0.18, depth=1.8, material=self.m["trunk"], verts=7, is_smooth=False)
        parts = [t]
        if kind == "round":
            parts.append(ico("f1", (0, 0, 2.3), r=1.1, material=self.m["leaf"]))
            parts.append(ico("f2", (0.5, 0.2, 2.0), r=0.7, material=self.m["leaf2"]))
        elif kind == "pine":
            for i, (z, r) in enumerate(((1.6, 1.2), (2.4, 0.95), (3.1, 0.65))):
                parts.append(cone(f"p{i}", (0, 0, z), r=r, depth=1.2, material=self.m["leaf"], verts=8))
        elif kind == "sakura":
            parts.append(ico("f1", (0, 0, 2.2), r=1.05, material=self.m["sakura"]))
            parts.append(ico("f2", (-0.5, 0.3, 2.0), r=0.7, material=self.m["pink"]))
        return join(parts, "tree_" + kind)

    def flower(self, color):
        s = cyl("s", (0, 0, 0.2), r=0.03, depth=0.4, material=self.m["leaf"], verts=5, is_smooth=False)
        h = ico("h", (0, 0, 0.42), r=0.12, material=self.m[color], sub=1)
        c = ico("c", (0, -0.05, 0.43), r=0.05, material=self.m["yellow" if color != "yellow" else "white"], sub=1)
        return join([s, h, c], "flower_" + color)

    def bush(self):
        return join([ico("b1", (0, 0, 0.35), r=0.5, material=self.m["grass2"]),
                     ico("b2", (0.4, 0.1, 0.3), r=0.35, material=self.m["leaf"])], "bush")

    def rock(self):
        r = ico("rock", (0, 0, 0.2), r=0.5, scale=(1, 0.8, 0.6), material=self.m["stone"])
        return r

    def bamboo(self, h=7):
        parts = [cyl("c", (0, 0, h / 2), r=0.12, depth=h, material=self.m["bamboo"], verts=8)]
        for i in range(1, int(h)):
            parts.append(cyl(f"r{i}", (0, 0, i), r=0.135, depth=0.06, material=self.m["bamboo_ring"], verts=8))
        for i in range(4):
            a = i * 1.7
            parts.append(sphere(f"l{i}", (math.cos(a) * 0.5, math.sin(a) * 0.5, h - 1.2 + i * 0.4), (0.5, 0.12, 0.04),
                                material=self.m["leaf2"], seg=6, rings=4, is_smooth=False))
        return join(parts, "bamboo")

    def fence(self):
        parts = []
        for i in range(4):
            x = i * 0.5
            parts.append(box(f"p{i}", (x, 0, 0.5), (0.14, 0.06, 1.0), material=self.m["white"]))
            parts.append(cone(f"t{i}", (x, 0, 1.06), r=0.1, depth=0.14, rot=(0, 0, math.pi / 4), material=self.m["white"], verts=4))
        parts.append(box("r1", (0.75, 0, 0.3), (2.0, 0.05, 0.1), material=self.m["white"]))
        parts.append(box("r2", (0.75, 0, 0.75), (2.0, 0.05, 0.1), material=self.m["white"]))
        return join(parts, "fence")

    def house(self):
        """Casa chinesa: paredes claras, colunas vermelhas, telhado com beiral curvo."""
        m = self.m
        parts = [box("w", (0, 0, 1.2), (4, 3, 2.4), material=m["plaster"])]
        for s in (-1, 1):
            for t in (-1, 1):
                parts.append(cyl(f"c{s}{t}", (s * 2.05, t * 1.55, 1.2), r=0.13, depth=2.4, material=m["red"], verts=8))
        parts.append(box("door", (0, -1.52, 0.9), (1.0, 0.05, 1.8), material=m["red"]))
        parts.append(box("roof1", (0, 0, 2.6), (5.0, 4.0, 0.25), material=m["roof"]))
        parts.append(box("roof2", (0, 0, 2.95), (3.8, 2.6, 0.5), material=m["roof"]))
        parts.append(box("ridge", (0, 0, 3.3), (4.2, 0.3, 0.25), material=m["roof"]))
        for s in (-1, 1):
            for t in (-1, 1):
                parts.append(cone(f"e{s}{t}", (s * 2.55, t * 2.05, 2.75), r=0.18, depth=0.6,
                                  rot=(math.radians(25 * t), math.radians(-25 * s), 0), material=m["roof"], verts=5))
        parts.append(box("plq", (0, -1.55, 2.2), (1.2, 0.05, 0.35), material=m["gold"]))
        return join(parts, "house")

    def pagoda(self, floors=5):
        m = self.m
        parts = []
        z = 0
        for i in range(floors):
            w = 3.2 - i * 0.45
            parts.append(box(f"b{i}", (0, 0, z + 0.7), (w, w, 1.4), material=m["red"] if i % 2 == 0 else m["plaster"]))
            parts.append(cyl(f"r{i}", (0, 0, z + 1.55), r=w * 0.95, r2=w * 0.45, depth=0.5, material=m["teal"], verts=8, is_smooth=False))
            z += 1.8
        parts.append(cone("spire", (0, 0, z + 0.6), r=0.18, depth=1.6, material=m["gold"], verts=8))
        return join(parts, "pagoda")

    def lantern_string(self, length=6):
        m = self.m
        parts = [cyl("wire", (0, 0, 0), r=0.015, depth=length, rot=(0, math.pi / 2, 0), material=m["hull"], verts=4)]
        n = int(length // 1.2)
        for i in range(n):
            x = -length / 2 + 0.6 + i * 1.2
            parts.append(sphere(f"l{i}", (x, 0, -0.35), (0.22, 0.22, 0.26), material=m["lantern"], seg=10, rings=8))
            parts.append(cyl(f"c{i}", (x, 0, -0.08), r=0.09, depth=0.06, material=m["gold"], verts=8))
            parts.append(cyl(f"t{i}", (x, 0, -0.7), r=0.03, depth=0.2, material=m["gold"], verts=5))
        return join(parts, "lanterns")

    def karst(self, h=10):
        parts = [cyl("k", (0, 0, h / 2), r=2.2, r2=1.3, depth=h, material=self.m["karst"], verts=9, is_smooth=True),
                 ico("top", (0, 0, h), r=1.45, scale=(1, 1, 0.8), material=self.m["karst_top"], sub=2)]
        return join(parts, "karst")

    def boat(self):
        m = self.m
        parts = [box("hull", (0, 0, 0.4), (1.8, 5, 0.8), material=m["hull"]),
                 cone("bow", (0, 2.9, 0.55), r=0.9, depth=1.2, rot=(math.radians(-90), 0, 0), material=m["hull"], verts=4),
                 box("deck", (0, -1.6, 1.1), (1.6, 1.4, 0.6), material=m["wood"]),
                 cyl("mast", (0, 0.3, 3.0), r=0.08, depth=5.0, material=m["wood"], verts=6)]
        for i in range(5):
            parts.append(box(f"sail{i}", (0, 0.3, 1.5 + i * 0.75), (0.05, 2.4 - i * 0.2, 0.62), material=m["sail"]))
        return join(parts, "boat")

    def wall_segment(self, length=4.0, width=4.0):
        m = self.m
        parts = [box("body", (0, 0, 1.5), (width, length, 3.0), material=m["wall"]),
                 box("path", (0, 0, 3.02), (width - 0.8, length, 0.05), material=m["wall_dark"])]
        for s in (-1, 1):
            for i in range(int(length)):
                parts.append(box(f"m{s}{i}", (s * (width / 2 - 0.2), -length / 2 + 0.5 + i, 3.35), (0.4, 0.55, 0.7), material=m["wall"]))
        return join(parts, "wall_seg")

    def tower(self):
        """Torre de vigia com passagem em arco: o caminho (Z=3 local) atravessa a torre."""
        m = self.m
        parts = [box("base", (0, 0, 1.5), (5.2, 5.2, 3.0), material=m["wall"])]
        for s in (-1, 1):
            parts.append(box(f"pillar{s}", (s * 1.95, 0, 4.4), (1.3, 5.2, 2.8), material=m["wall"]))
            parts.append(box(f"win{s}", (s * 2.62, 0, 6.6), (0.05, 0.8, 1.0), material=m["roof"]))
        parts.append(box("lintel", (0, 0, 6.9), (5.2, 5.2, 2.2), material=m["wall"]))
        parts.append(box("arch", (0, -2.61, 5.85), (2.6, 0.05, 0.25), material=m["wall_dark"]))
        parts.append(box("top", (0, 0, 8.4), (4.2, 4.2, 0.8), material=m["wall_dark"]))
        parts.append(box("roof", (0, 0, 9.2), (4.6, 4.6, 0.3), material=m["roof"]))
        parts.append(cone("roof2", (0, 0, 9.9), r=3.0, depth=1.2, rot=(0, 0, math.pi / 4), material=m["roof"], verts=4))
        return join(parts, "tower")


def scatter(kit_objs, n, rng, x_min, x_max, y_min, y_max, avoid=2.6, scale=(0.7, 1.3), name="deco", z=0.0):
    out = []
    for i in range(n):
        src = rng.choice(kit_objs)
        side = rng.choice((-1, 1))
        x = side * rng.uniform(max(avoid, x_min), x_max)
        y = rng.uniform(y_min, y_max)
        s = rng.uniform(*scale)
        out.append(instance(src, f"{name}_{i}", (x, y, z), rot=(0, 0, rng.uniform(0, 6.28)), scale=(s, s, s)))
    return out


def ground(m_ground, m_path, width=70, path_w=2.6, extra=None):
    box("Ground", (0, PATH_LEN / 2, -0.25), (width, PATH_LEN + 60, 0.5), material=m_ground)
    if m_path is not None:
        box("Path", (0, PATH_LEN / 2, 0.005), (path_w, PATH_LEN + 6, 0.02), material=m_path)


def stepping_stones(k, m, rng):
    src = library("stone", lambda: cyl("st", (0, 0, 0.02), r=0.55, depth=0.06, material=m, verts=9, is_smooth=False))
    y = -2
    i = 0
    while y < PATH_LEN + 4:
        instance(src, f"Step_{i}", (rng.uniform(-0.35, 0.35), y, 0.02), rot=(0, 0, rng.uniform(0, 3)),
                 scale=(rng.uniform(0.9, 1.15),) * 3)
        y += 1.25
        i += 1


def scene_garden(k, rng):
    m = k.m
    ground(m["grass"], m["dirt"])
    trees = [library("tr", lambda: k.tree("round")), library("tr2", lambda: k.tree("sakura"))]
    flowers = [library("fp", lambda: k.flower("pink")), library("fy", lambda: k.flower("yellow")),
               library("fw", lambda: k.flower("white"))]
    bush = library("bush", k.bush)
    fence = library("fence", k.fence)
    scatter(trees, 26, rng, 5, 28, -10, PATH_LEN + 20, name="Tree")
    scatter(flowers, 160, rng, 1.6, 12, -4, PATH_LEN + 4, scale=(0.8, 1.4), name="Flower")
    scatter([bush], 40, rng, 2.2, 16, -6, PATH_LEN + 6, name="Bush")
    # cerca do jardim (o Pongo está "preso"): o primeiro portal é o portão do jardim
    for s in (-1, 1):
        for i in range(12):
            x0 = 2.5 + i * 2.0 if s > 0 else -2.5 - i * 2.0 - 1.5
            instance(fence, f"Fence_{s}_{i}", (x0, 16.0, 0))
        for i in range(12):
            instance(fence, f"FenceSide_{s}_{i}", (s * 26, -8 + i * 2.0, 0), rot=(0, 0, math.pi / 2))
    # casinha do Pongo
    parts = [box("dh", (0, 0, 0.7), (1.8, 1.8, 1.4), material=m["red"]),
             cone("dhr", (0, 0, 1.85), r=1.55, depth=1.0, rot=(0, 0, math.pi / 4), material=m["teal"], verts=4),
             box("dhd", (0, -0.91, 0.55), (0.8, 0.04, 0.9), material=mat("toca", "#3a2418"))]
    dh = join(parts, "DogHouse")
    dh.location = (-3.2, 1.0, 0)
    dh.rotation_euler = (0, 0, math.radians(15))
    # tigela e osso
    cyl("Bowl", (2.4, 1.0, 0.1), r=0.35, r2=0.25, depth=0.2, material=m["red"], verts=14)
    bonemat = m["white"]
    join([cyl("bn", (0, 0, 0.08), r=0.06, depth=0.5, rot=(0, math.pi / 2, 0), material=bonemat, verts=8),
          ico("b1", (-0.27, 0.06, 0.08), r=0.08, material=bonemat), ico("b2", (-0.27, -0.06, 0.08), r=0.08, material=bonemat),
          ico("b3", (0.27, 0.06, 0.08), r=0.08, material=bonemat), ico("b4", (0.27, -0.06, 0.08), r=0.08, material=bonemat)],
         "Bone").location = (1.8, 2.3, 0)
    # pequeno lago
    cyl("Pond", (7, 20, 0.02), r=3.2, depth=0.06, material=m["water"], verts=24)
    stepping_stones(k, m["stone"], rng)


def scene_bamboo(k, rng):
    m = k.m
    ground(m["grass2"], m["dirt"])
    b = [library("b1", lambda: k.bamboo(7)), library("b2", lambda: k.bamboo(9)), library("b3", lambda: k.bamboo(5.5))]
    scatter(b, 260, rng, 2.4, 22, -10, PATH_LEN + 20, scale=(0.8, 1.25), name="Bamboo")
    scatter([library("rk", k.rock)], 40, rng, 2.0, 14, -4, PATH_LEN + 4, name="Rock")
    scatter([library("bush", k.bush)], 30, rng, 2.0, 14, -4, PATH_LEN + 4, name="Bush")
    # riacho com ponte de madeira
    box("Stream", (0, 33, 0.02), (70, 4, 0.04), material=m["water"])
    parts = [box("deck", (0, 0, 0.35), (2.6, 5, 0.15), material=m["wood"])]
    for s in (-1, 1):
        parts.append(box(f"rail{s}", (s * 1.25, 0, 0.9), (0.1, 5, 0.1), material=m["red"]))
        for i in range(5):
            parts.append(box(f"post{s}{i}", (s * 1.25, -2 + i, 0.6), (0.12, 0.12, 0.6), material=m["red"]))
    join(parts, "Bridge").location = (0, 33, 0)


def scene_rice(k, rng):
    m = k.m
    ground(m["water"], m["dirt"], path_w=2.8)
    # dique de terra sob o caminho
    box("Dike", (0, PATH_LEN / 2, 0.05), (3.4, PATH_LEN + 8, 0.3), material=m["grass"])
    # campos de arroz em terraços
    rice = library("rice", lambda: join([box("t", (0, 0, 0.12), (5.5, 5.5, 0.24), material=m["rice"]),
                                         box("e", (0, 0, 0.26), (5.9, 5.9, 0.04), material=m["grass2"])], "paddy"))
    i = 0
    for s in (-1, 1):
        for row in range(14):
            for col in range(3):
                instance(rice, f"Paddy_{i}", (s * (5 + col * 6.2), -6 + row * 6.2, col * 0.35), scale=(1, 1, 1 + col))
                i += 1
    ks = [library("k1", lambda: k.karst(12)), library("k2", lambda: k.karst(16)), library("k3", lambda: k.karst(9))]
    scatter(ks, 26, rng, 24, 45, -10, PATH_LEN + 30, scale=(0.9, 1.6), name="Karst")
    scatter([library("tr", lambda: k.tree("round"))], 10, rng, 2.4, 3.2, 0, PATH_LEN, name="Tree")
    # chapéus de palha 斗笠 (espantalhos)
    hat = mat("palha", "#e7c46a")
    for j in range(6):
        y = 6 + j * 10
        x = (-1) ** j * (8 + j % 3 * 4)
        join([cyl("pole", (0, 0, 0.8), r=0.05, depth=1.6, material=m["wood"], verts=6),
              cone("hat", (0, 0, 1.75), r=0.6, depth=0.4, material=hat, verts=12)], f"Scarecrow_{j}").location = (x, y, 0.3)


def scene_port(k, rng):
    m = k.m
    box("Sea", (0, PATH_LEN / 2, -0.15), (160, PATH_LEN + 120, 0.2), material=m["water"])
    box("Beach", (0, -8, -0.05), (60, 22, 0.3), material=m["sand"])
    # píer de madeira (o caminho)
    plank = library("plank", lambda: box("pl", (0, 0, 0), (3.2, 0.45, 0.12), material=m["wood"]))
    post = library("post", lambda: cyl("po", (0, 0, 0), r=0.13, depth=2.4, material=m["hull"], verts=7))
    for i in range(int((PATH_LEN + 6) / 0.5)):
        instance(plank, f"Plank_{i}", (0, i * 0.5, 0.3))
    for i in range(0, int(PATH_LEN + 6), 3):
        for s in (-1, 1):
            instance(post, f"Post_{s}_{i}", (s * 1.65, i, 0))
    boat = library("boat", k.boat)
    for j in range(9):
        s = (-1) ** j
        instance(boat, f"Boat_{j}", (s * rng.uniform(5, 18), 4 + j * 7.5, 0), rot=(0, 0, rng.uniform(-0.4, 0.4)),
                 scale=(1.2, 1.2, 1.2))
    ks = [library("k1", lambda: k.karst(10))]
    scatter(ks, 10, rng, 35, 60, 10, PATH_LEN + 40, scale=(1, 1.6), name="Island")
    # farol
    join([cyl("lh", (0, 0, 4), r=1.0, r2=0.6, depth=8, material=m["white"], verts=12),
          cyl("lhb", (0, 0, 2.5), r=0.95, depth=1.0, material=m["red"], verts=12),
          cyl("lhb2", (0, 0, 5.5), r=0.75, depth=1.0, material=m["red"], verts=12),
          sphere("lamp", (0, 0, 8.4), (0.7, 0.7, 0.7), material=m["lantern"])], "Lighthouse").location = (-9, -4, 0)
    # navio grande no fim do píer (o Pongo embarca!)
    big = instance(boat, "BigShip", (4.5, PATH_LEN + 2, 0), rot=(0, 0, 0.1), scale=(2.2, 2.2, 2.2))


def scene_wall(k, rng):
    m = k.m
    box("Valley", (0, PATH_LEN / 2, -6), (200, PATH_LEN + 160, 1), material=m["grass2"])
    seg = library("seg", lambda: k.wall_segment(4.0, 4.4))
    tower = library("tower", k.tower)
    # muralha principal: o caminho do Pongo passa por cima dela (Z=3)
    for i in range(int((PATH_LEN + 12) / 4)):
        instance(seg, f"Wall_{i}", (0, -6 + i * 4, -3.0))
    for y in (-14, 24, 40, PATH_LEN + 6):
        instance(tower, f"Tower_{y}", (0, y, -3.0))
    # muralha serpenteando nas montanhas ao longe
    for j in range(60):
        a = j * 0.18
        x = 30 + math.sin(a) * 10
        y = -20 + j * 2.6
        instance(seg, f"FarWall_{j}", (x, y, -6 + 3 * math.sin(j * 0.25) + 3), rot=(0, 0, math.cos(a) * 0.5))
    for j in range(4):
        instance(tower, f"FarTower_{j}", (30 + math.sin(j * 2.7) * 10, -20 + j * 40, -3 + 3 * math.sin(j * 3.75)))
    # montanhas
    mtn = library("mtn", lambda: join([cone("m", (0, 0, 7), r=12, depth=14, material=m["karst"], verts=9, is_smooth=True),
                                       cone("s", (0, 0, 12.4), r=3.6, depth=3.4, material=m["snow"], verts=9)], "mountain"))
    for j in range(16):
        side = (-1) ** j
        instance(mtn, f"Mountain_{j}", (side * rng.uniform(25, 60), -20 + j * 9, -6), scale=(rng.uniform(0.8, 1.6),) * 3)
    scatter([library("pine", lambda: k.tree("pine"))], 80, rng, 6, 30, -10, PATH_LEN + 20, name="Pine", z=-5.6)


def scene_beijing(k, rng):
    m = k.m
    ground(mat("pedra_rua", "#c9b9a0"), mat("tapete_vermelho", "#c8283c"), path_w=2.2)
    house = library("house", k.house)
    lan = library("lan", lambda: k.lantern_string(8))
    for i in range(10):
        for s in (-1, 1):
            instance(house, f"House_{s}_{i}", (s * 6.5, -4 + i * 7.5, 0), rot=(0, 0, s * math.pi / 2))
    pole = library("pole", lambda: cyl("p", (0, 0, 3.1), r=0.1, depth=6.2, material=m["red"], verts=8))
    for i in range(14):
        y = i * 5
        for s in (-1, 1):
            instance(pole, f"Pole_{s}_{i}", (s * 4.0, y, 0))
        instance(lan, f"Lanterns_{i}", (0, y, 6.1))
    pag = library("pagoda", lambda: k.pagoda(6))
    instance(pag, "Pagoda", (0, PATH_LEN + 16, 0), scale=(1.6, 1.6, 1.6))
    instance(pag, "Pagoda2", (-22, 40, 0))
    scatter([library("sak", lambda: k.tree("sakura"))], 22, rng, 10.5, 26, -6, PATH_LEN + 20, name="Sakura")
    # praça final com tapete e mesa de chá para os amigos
    cyl("Plaza", (0, PATH_LEN + 2, 0.01), r=6, depth=0.04, material=m["red"], verts=32)
    cyl("PlazaRing", (0, PATH_LEN + 2, 0.005), r=6.6, depth=0.03, material=m["gold"], verts=32)
    join([cyl("tb", (0, 0, 0.45), r=0.9, depth=0.1, material=m["wood"], verts=16),
          cyl("tl", (0, 0, 0.2), r=0.15, depth=0.45, material=m["wood"], verts=8),
          cyl("tp", (0.2, 0, 0.62), r=0.15, r2=0.1, depth=0.25, material=m["white"], verts=10)], "TeaTable").location = (2.6, PATH_LEN + 3, 0)


SCENES = [
    ("scene_1.glb", scene_garden), ("scene_2.glb", scene_bamboo), ("scene_3.glb", scene_rice),
    ("scene_4.glb", scene_port), ("scene_5.glb", scene_wall), ("scene_6.glb", scene_beijing),
]


def main():
    d = out_dir()
    build_pongo(os.path.join(d, "pongo.glb"))
    build_panda(os.path.join(d, "panda.glb"))
    build_gate(os.path.join(d, "gate.glb"))
    for i, (fname, fn) in enumerate(SCENES):
        reset()
        k = Kit()
        fn(k, random.Random(100 + i))
        export(os.path.join(d, fname))


main()
