"""
Gera os elementos 3D do jogo "Partícula Quest" com o Blender (bpy).

Uso:
    blender -b -P gerar_modelos.py      # ou: python3 gerar_modelos.py (pip install bpy)

Saídas em ../assets/:
    mascote.glb, torii.glb, estrela.glb, trofeu.glb   (modelos 3D usados ao vivo via Three.js)
    no_ativo.png, no_feito.png, no_bloqueado.png        (ícones dos níveis renderizados em Cycles)
"""
import math
import os
import bpy

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
os.makedirs(OUT, exist_ok=True)


def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(nome, cor, rough=0.45, metal=0.0, emissao=None):
    m = bpy.data.materials.new(nome)
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*cor, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emissao:
        b.inputs["Emission Color"].default_value = (*emissao, 1.0)
        b.inputs["Emission Strength"].default_value = 0.6
    return m


def hexrgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    # glTF/Blender trabalham em espaço linear
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def suave(obj):
    for p in obj.data.polygons:
        p.use_smooth = True


def aplicar(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def esfera(nome, loc, escala, mat, seg=48, anel=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=anel, location=loc)
    o = bpy.context.active_object
    o.name = nome
    o.scale = escala
    suave(o)
    aplicar(o, mat)
    return o


def cilindro(nome, loc, r, h, mat, rot=(0, 0, 0), v=48, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = nome
    aplicar(o, mat)
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 4
        mod.limit_method = "ANGLE"
        suave(o)
        o.data.shade_auto_smooth if hasattr(o.data, "shade_auto_smooth") else None
    return o


def caixa(nome, loc, escala, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.active_object
    o.name = nome
    o.scale = escala
    aplicar(o, mat)
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    return o


def estrela_mesh(nome, r_ext=1.0, r_int=0.45, prof=0.3, mat=None, loc=(0, 0, 0), rot=(0, 0, 0)):
    verts, faces = [], []
    n = 5
    for i in range(n * 2):
        a = math.pi / 2 + i * math.pi / n
        r = r_ext if i % 2 == 0 else r_int
        verts.append((r * math.cos(a), 0, r * math.sin(a)))
    # frente / trás + centros elevados (estrela "almofadada")
    k = len(verts)
    front = [(x, -prof / 2, z) for x, _, z in verts]
    back = [(x, prof / 2, z) for x, _, z in verts]
    v = front + back + [(0, -prof, 0), (0, prof, 0)]
    cf, cb = 2 * k, 2 * k + 1
    for i in range(k):
        j = (i + 1) % k
        faces.append((cf, j, i))
        faces.append((cb, k + i, k + j))
        faces.append((i, j, k + j, k + i))
    me = bpy.data.meshes.new(nome)
    me.from_pydata(v, [], faces)
    me.update()
    o = bpy.data.objects.new(nome, me)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    if mat:
        o.data.materials.append(mat)
    mod = o.modifiers.new("bevel", "BEVEL")
    mod.width = 0.04
    mod.segments = 2
    return o


def exportar(nome):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, nome),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )


# ---------------------------------------------------------------- mascote
def mascote():
    limpar()
    vermelho = material("vermelho", hexrgb("#E8483F"), 0.35)
    creme = material("creme", hexrgb("#FFF4E0"), 0.5)
    preto = material("preto", hexrgb("#1E1B2E"), 0.2)
    branco = material("branco", (1, 1, 1), 0.1, emissao=(1, 1, 1))
    rosa = material("rosa", hexrgb("#FF8FAB"), 0.6)
    ouro = material("ouro", hexrgb("#F5B700"), 0.25, 0.8)
    azul = material("azul", hexrgb("#4A7BD0"), 0.4)

    esfera("corpo", (0, 0, 0), (1.0, 0.92, 1.08), vermelho)
    esfera("rosto", (0, -0.55, 0.18), (0.66, 0.42, 0.55), creme)
    for s in (-1, 1):
        esfera(f"olho{s}", (0.24 * s, -0.94, 0.26), (0.11, 0.06, 0.15), preto, 24, 12)
        esfera(f"brilho{s}", (0.21 * s, -0.99, 0.32), (0.04, 0.02, 0.045), branco, 16, 8)
        esfera(f"bochecha{s}", (0.42 * s, -0.86, 0.04), (0.11, 0.04, 0.07), rosa, 24, 12)
        esfera(f"mao{s}", (0.98 * s, -0.25, -0.25), (0.2, 0.2, 0.2), creme, 24, 12)
    # boca sorridente (meio toro)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.1, minor_radius=0.025, location=(0, -0.97, 0.06),
                                     rotation=(math.radians(90), 0, 0))
    boca = bpy.context.active_object
    boca.name = "boca"
    aplicar(boca, preto)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for v in boca.data.vertices:
        v.select = v.co.y > 0.0  # metade de cima (eixo local) é removida
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    # hachimaki (faixa na cabeça) com o hinomaru
    bpy.ops.mesh.primitive_torus_add(major_radius=0.86, minor_radius=0.075, location=(0, 0, 0.62),
                                     major_segments=64, minor_segments=12)
    faixa = bpy.context.active_object
    faixa.name = "hachimaki"
    faixa.scale = (1.0, 0.95, 1.0)
    suave(faixa)
    aplicar(faixa, creme)
    esfera("hinomaru", (0, -0.86, 0.64), (0.08, 0.03, 0.08), vermelho, 24, 12)
    for s in (-1, 1):
        esfera(f"laco{s}", (0.14 * s, 0.86, 0.66), (0.14, 0.05, 0.08), creme, 24, 12)
    # base dourada e livro (estudo!)
    cilindro("base", (0, 0, -1.08), 0.75, 0.18, ouro, bevel=0.05)
    caixa("livro", (0, -0.72, -0.62), (0.34, 0.12, 0.24), azul, bevel=0.03)
    caixa("paginas", (0, -0.71, -0.62), (0.31, 0.13, 0.21), creme)
    exportar("mascote.glb")


# ---------------------------------------------------------------- torii
def torii():
    limpar()
    shu = material("shu", hexrgb("#E2412B"), 0.4)
    preto = material("preto", hexrgb("#24212F"), 0.3)
    pedra = material("pedra", hexrgb("#8C8A99"), 0.8)
    for s in (-1, 1):
        cilindro(f"pilar{s}", (1.1 * s, 0, 0), 0.13, 3.0, shu, v=32)
        cilindro(f"pedra{s}", (1.1 * s, 0, -1.55), 0.22, 0.2, preto, v=32, bevel=0.04)
        cilindro(f"base{s}", (1.1 * s, 0, -1.72), 0.32, 0.12, pedra, v=32, bevel=0.03)
    caixa("nuki", (0, 0, 0.95), (1.55, 0.08, 0.1), shu, bevel=0.02)
    caixa("gakuzuka", (0, 0, 1.2), (0.09, 0.07, 0.18), shu)
    caixa("shimaki", (0, 0, 1.45), (1.65, 0.12, 0.1), shu, bevel=0.02)
    # kasagi levemente curvado
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 1.66))
    k = bpy.context.active_object
    k.name = "kasagi"
    k.scale = (2.0, 0.17, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    sub = k.modifiers.new("sub", "SUBSURF")
    sub.levels = 2
    bpy.ops.object.modifier_apply(modifier="sub")
    for v in k.data.vertices:
        v.co.z += 0.09 * (v.co.x / 2.0) ** 4
    suave(k)
    aplicar(k, preto)
    # placa central
    caixa("placa", (0, -0.1, 1.2), (0.16, 0.02, 0.2), preto)
    exportar("torii.glb")


# ---------------------------------------------------------------- estrela
def estrela():
    limpar()
    ouro = material("ouro", hexrgb("#FFC531"), 0.2, 0.9, emissao=hexrgb("#FFB300"))
    estrela_mesh("estrela", mat=ouro)
    exportar("estrela.glb")


# ---------------------------------------------------------------- troféu
def trofeu():
    limpar()
    ouro = material("ouro", hexrgb("#FFC531"), 0.18, 1.0)
    base = material("base", hexrgb("#3B2F63"), 0.4)
    # taça por revolução (screw de um perfil)
    perfil = [(0.0, 1.6), (0.85, 1.6), (0.82, 1.2), (0.65, 0.8), (0.32, 0.5), (0.12, 0.35), (0.1, 0.0),
              (0.0, 0.0)]
    verts = [(x, 0, z) for x, z in perfil]
    edges = [(i, i + 1) for i in range(len(verts) - 1)]
    me = bpy.data.meshes.new("taca")
    me.from_pydata(verts, edges, [])
    o = bpy.data.objects.new("taca", me)
    bpy.context.collection.objects.link(o)
    sc = o.modifiers.new("screw", "SCREW")
    sc.steps = 48
    sc.render_steps = 48
    sc.use_merge_vertices = True
    sol = o.modifiers.new("sol", "SOLIDIFY")
    sol.thickness = 0.05
    o.data.materials.append(ouro)
    suave(o)
    o.location = (0, 0, -0.2)
    for s in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.3, minor_radius=0.06, location=(0.9 * s, 0, 0.95),
                                         rotation=(math.radians(90), 0, 0))
        a = bpy.context.active_object
        suave(a)
        aplicar(a, ouro)
    cilindro("pe", (0, 0, -0.32), 0.45, 0.22, ouro, bevel=0.04)
    caixa("pedestal", (0, 0, -0.7), (0.62, 0.62, 0.28), base, bevel=0.05)
    estrela_mesh("estrela_frente", 0.32, 0.14, 0.08, ouro, loc=(0, -0.76, -0.7))
    exportar("trofeu.glb")


# ---------------------------------------------------------------- ícones dos nós (Cycles)
def no_icone(arquivo, cor_topo, cor_lado, simbolo):
    limpar()
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.samples = 48
    cena.cycles.device = "CPU"
    cena.render.film_transparent = True
    cena.render.resolution_x = cena.render.resolution_y = 256
    cena.view_settings.view_transform = "Standard"
    mundo = bpy.data.worlds.new("w")
    cena.world = mundo
    try:
        mundo.use_nodes = True
    except Exception:
        pass
    mundo.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.7

    topo = material("topo", hexrgb(cor_topo), 0.3, 0.2)
    lado = material("lado", hexrgb(cor_lado), 0.4)
    branco = material("simb", (1, 1, 1), 0.3)
    cilindro("lado", (0, 0, -0.18), 1.0, 0.36, lado, v=64, bevel=0.08)
    cilindro("topo", (0, 0, 0.06), 0.96, 0.2, topo, v=64, bevel=0.08)
    if simbolo == "estrela":
        estrela_mesh("s", 0.55, 0.24, 0.16, branco, loc=(0, 0, 0.2), rot=(math.radians(90), 0, 0))
    elif simbolo == "check":
        cu = bpy.data.curves.new("check", "CURVE")
        cu.dimensions = "3D"
        cu.bevel_depth = 0.085
        cu.bevel_resolution = 4
        cu.use_fill_caps = True
        sp = cu.splines.new("POLY")
        sp.points.add(2)
        for pt, co in zip(sp.points, [(-0.4, 0.02, 0.24), (-0.12, -0.26, 0.24), (0.42, 0.28, 0.24)]):
            pt.co = (*co, 1)
        ob = bpy.data.objects.new("check", cu)
        bpy.context.collection.objects.link(ob)
        ob.data.materials.append(branco)
    else:  # cadeado
        caixa("corpo", (0, -0.12, 0.25), (0.36, 0.28, 0.07), branco, 0.04)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.06, location=(0, 0.18, 0.25))
        a = bpy.context.active_object
        aplicar(a, branco)
    bpy.ops.object.light_add(type="AREA", location=(2, -3, 5))
    luz = bpy.context.active_object
    luz.data.energy = 900
    luz.data.size = 4
    luz.rotation_euler = (math.radians(30), math.radians(15), 0)
    bpy.ops.object.camera_add(location=(0, -3.2, 3.6), rotation=(math.radians(42), 0, 0))
    cam = bpy.context.active_object
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 2.55
    cena.camera = cam
    cena.render.filepath = os.path.join(OUT, arquivo)
    bpy.ops.render.render(write_still=True)


def retrato(glb, png, cam_z=0.2, dist=6.5):
    """Renderiza um retrato PNG transparente do modelo (fallback quando não há WebGL)."""
    limpar()
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, glb))
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.samples = 48
    cena.render.film_transparent = True
    cena.render.resolution_x = cena.render.resolution_y = 320
    cena.view_settings.view_transform = "Standard"
    mundo = bpy.data.worlds.new("w")
    cena.world = mundo
    mundo.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
    bpy.ops.object.light_add(type="AREA", location=(3, -4, 5))
    luz = bpy.context.active_object
    luz.data.energy = 1500
    luz.data.size = 5
    luz.rotation_euler = (math.radians(40), math.radians(25), 0)
    bpy.ops.object.camera_add(location=(0, -dist, cam_z + 0.6), rotation=(math.radians(84), 0, 0))
    cena.camera = bpy.context.active_object
    cena.render.filepath = os.path.join(OUT, png)
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    mascote()
    torii()
    estrela()
    trofeu()
    no_icone("no_ativo.png", "#58CC02", "#3E9A00", "estrela")
    no_icone("no_feito.png", "#FFC800", "#D69E00", "check")
    no_icone("no_bloqueado.png", "#C9C6D6", "#9E9AB0", "cadeado")
    retrato("mascote.glb", "mascote.png")
    retrato("trofeu.glb", "trofeu.png", 0.3, 6.0)
    print("OK ->", os.path.abspath(OUT))
