"""
Gera os elementos 3D do jogo "Hajimemashite Quest" (primeiro encontro) com o Blender (bpy).

Uso:
    blender -b -P gerar_modelos.py      # ou: python3 gerar_modelos.py (pip install bpy)

Saídas em ../assets/:
    tanaka.glb    Tanaka-san, o personagem que o jogador conhece (óculos, gravata, cartão de visita)
    meishi.glb    cartão de visita (名刺) que voa nas explosões de acerto
    telefone.glb  smartphone da unidade de telefone
    no_ativo.png  ícone do nível disponível (balão de fala, cor ODU teal)
    dupla.png     retrato de Daru + Tanaka (fallback sem WebGL)
O mascote Daru, a estrela, o troféu e os ícones "concluído"/"bloqueado" vêm do jogo de partículas
(../jogo-particulas/blender/gerar_modelos.py), para manter a mesma identidade.
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



NAVY, TEAL, CORAL, CREME = "#0B1B4D", "#16989A", "#EE7060", "#FFF4E0"


# ---------------------------------------------------------------- Tanaka-san
def tanaka():
    limpar()
    corpo = material("teal", hexrgb(TEAL), 0.35)
    creme = material("creme", hexrgb(CREME), 0.5)
    preto = material("preto", hexrgb("#1E1B2E"), 0.25)
    branco = material("branco", (1, 1, 1), 0.1, emissao=(1, 1, 1))
    rosa = material("rosa", hexrgb("#FF8FAB"), 0.6)
    coral = material("coral", hexrgb(CORAL), 0.4)
    navy = material("navy", hexrgb(NAVY), 0.3)
    ouro = material("ouro", hexrgb("#F5B700"), 0.25, 0.8)
    cartao = material("cartao", (0.97, 0.97, 0.95), 0.4)

    esfera("corpo", (0, 0, 0), (1.0, 0.92, 1.08), corpo)
    esfera("rosto", (0, -0.55, 0.18), (0.66, 0.42, 0.55), creme)
    # cabelo: calota escura no topo
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=(0, 0.02, 0.18))
    cab = bpy.context.active_object
    cab.name = "cabelo"
    cab.scale = (1.04, 0.97, 1.0)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for v in cab.data.vertices:
        v.select = v.co.z < 0.62 and not (v.co.y > -0.2 and v.co.z > 0.45)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    suave(cab)
    aplicar(cab, navy)
    for s in (-1, 1):
        esfera(f"olho{s}", (0.24 * s, -0.94, 0.26), (0.1, 0.06, 0.13), preto, 24, 12)
        esfera(f"brilho{s}", (0.21 * s, -0.99, 0.31), (0.035, 0.02, 0.04), branco, 16, 8)
        esfera(f"bochecha{s}", (0.42 * s, -0.86, 0.04), (0.11, 0.04, 0.07), rosa, 24, 12)
        esfera(f"mao{s}", (0.3 * s, -0.95, -0.42), (0.18, 0.16, 0.16), creme, 24, 12)
        # óculos
        bpy.ops.mesh.primitive_torus_add(major_radius=0.17, minor_radius=0.022, location=(0.24 * s, -1.0, 0.26),
                                         rotation=(math.radians(90), 0, 0), major_segments=40, minor_segments=8)
        aplicar(bpy.context.active_object, navy)
    caixa("ponte", (0, -1.0, 0.28), (0.07, 0.015, 0.015), navy)
    # boca
    bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.024, location=(0, -0.97, 0.05),
                                     rotation=(math.radians(90), 0, 0))
    boca = bpy.context.active_object
    aplicar(boca, preto)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for v in boca.data.vertices:
        v.select = v.co.y > 0.0
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    # gola + gravata
    caixa("gola", (0, -0.86, -0.3), (0.26, 0.04, 0.06), branco, 0.02)
    g = caixa("gravata", (0, -0.9, -0.52), (0.07, 0.03, 0.2), coral, 0.02)
    g.rotation_euler = (math.radians(-8), 0, 0)
    # cartão de visita nas mãos (entregue com as duas mãos)
    caixa("meishi", (0, -1.1, -0.42), (0.42, 0.012, 0.25), cartao, 0.01).rotation_euler = (math.radians(-15), 0, 0)
    caixa("faixa", (0, -1.118, -0.27), (0.42, 0.006, 0.04), coral).rotation_euler = (math.radians(-15), 0, 0)
    cilindro("base", (0, 0, -1.08), 0.75, 0.18, ouro, bevel=0.05)
    exportar("tanaka.glb")


# ---------------------------------------------------------------- meishi (cartão de visita)
def meishi():
    limpar()
    papel = material("papel", (0.97, 0.97, 0.95), 0.45)
    coral = material("coral", hexrgb(CORAL), 0.4)
    navy = material("navy", hexrgb(NAVY), 0.4)
    teal = material("teal", hexrgb(TEAL), 0.4)
    caixa("cartao", (0, 0, 0), (0.9, 0.02, 0.55), papel, 0.015)
    caixa("faixa", (-0.9 + 0.08, -0.022, 0), (0.08, 0.004, 0.55), coral)
    caixa("nome", (0.05, -0.024, 0.12), (0.45, 0.004, 0.09), navy)
    caixa("linha1", (0.0, -0.024, -0.14), (0.4, 0.004, 0.03), teal)
    caixa("linha2", (-0.08, -0.024, -0.26), (0.32, 0.004, 0.03), teal)
    esfera("selo", (0.66, -0.03, 0.3), (0.12, 0.01, 0.12), coral, 24, 12)
    exportar("meishi.glb")


# ---------------------------------------------------------------- smartphone
def telefone():
    limpar()
    corpo = material("corpo", hexrgb(NAVY), 0.3, 0.3)
    tela = material("tela", hexrgb("#0F3D5E"), 0.2, emissao=hexrgb(TEAL))
    tecla = material("tecla", (1, 1, 1), 0.3, emissao=(1, 1, 1))
    coral = material("coral", hexrgb(CORAL), 0.4)
    caixa("corpo", (0, 0, 0), (0.55, 0.07, 1.05), corpo, 0.06)
    caixa("tela", (0, -0.072, 0.05), (0.47, 0.005, 0.88), tela)
    for i in range(3):
        for j in range(4):
            esfera(f"t{i}{j}", (-0.26 + i * 0.26, -0.085, 0.42 - j * 0.24), (0.075, 0.012, 0.075),
                   coral if (i, j) == (1, 3) else tecla, 20, 10)
    exportar("telefone.glb")


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
    if simbolo == "balao":
        # balão de fala com três pontinhos
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.5, depth=0.12, location=(0, 0.06, 0.22))
        b = bpy.context.active_object
        b.scale = (1.0, 0.78, 1.0)
        aplicar(b, branco)
        bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.16, depth=0.12, location=(-0.22, -0.34, 0.22))
        cone = bpy.context.active_object
        cone.rotation_euler = (0, 0, math.radians(200))
        aplicar(cone, branco)
        pontos = material("pontos", hexrgb(NAVY), 0.3)
        for k in (-1, 0, 1):
            cilindro(f"p{k}", (0.22 * k, 0.06, 0.3), 0.07, 0.06, pontos, v=24)
    elif simbolo == "estrela":
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



def dupla():
    """Retrato de Daru + Tanaka (fallback sem WebGL)."""
    limpar()
    for nome, x, rz in (("mascote.glb", -1.25, -0.35), ("tanaka.glb", 1.25, 0.35)):
        antes = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, nome))
        for o in set(bpy.data.objects) - antes:
            if o.parent is None:
                o.location.x += x
                o.rotation_euler.z += rz
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.samples = 48
    cena.render.film_transparent = True
    cena.render.resolution_x, cena.render.resolution_y = 480, 320
    cena.view_settings.view_transform = "Standard"
    mundo = bpy.data.worlds.new("w")
    cena.world = mundo
    mundo.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
    bpy.ops.object.light_add(type="AREA", location=(3, -4, 5))
    luz = bpy.context.active_object
    luz.data.energy = 1800
    luz.data.size = 6
    luz.rotation_euler = (math.radians(40), math.radians(25), 0)
    bpy.ops.object.camera_add(location=(0, -8.5, 0.8), rotation=(math.radians(85), 0, 0))
    cena.camera = bpy.context.active_object
    cena.render.filepath = os.path.join(OUT, "dupla.png")
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    tanaka()
    meishi()
    telefone()
    no_icone("no_ativo.png", TEAL, "#0E6E70", "balao")
    dupla()
    print("OK ->", os.path.abspath(OUT))
