"""
Invasão Hiragana 3D — modelos gerados no Blender.

Gera todos os modelos 3D do jogo de forma procedural (low-poly facetado,
homenagem ao visual clássico dos shooters de trilho) e exporta para
assets/invasao-hiragana.glb, que o build embute no HTML final.

Uso (Blender instalado):
    blender --background --python blender/modelos.py
ou com o módulo Python do Blender (pip install bpy):
    python blender/modelos.py [--render]

Objetos-raiz exportados (procurados pelo nome no jogo):
    Nave        — nave do jogador (KANA-01). Filhos: MotorBrilho, CanhaoE, CanhaoD
    Invasor     — disco alienígena. Filho: InvasorAnel (cor trocada por hiragana)
    Asteroide   — rocha para desviar
    Portal      — anel de bônus (atravessar recarrega o escudo)
"""

import math
import os
import random
import sys

import bpy  # precisa vir antes de bmesh/mathutils
import bmesh
from mathutils import Matrix, Vector

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA_GLB = os.path.join(AQUI, "..", "assets", "invasao-hiragana.glb")
SAIDA_PNG = os.path.join(AQUI, "..", "assets", "preview-blender.png")


# ---------------------------------------------------------------- utilidades

def limpar_cena():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(nome, cor, metal=0.0, rugosidade=0.5, emissao=None, forca=0.0, alpha=1.0):
    mat = bpy.data.materials.get(nome)
    if mat:
        return mat
    mat = bpy.data.materials.new(nome)
    if not mat.use_nodes:  # Blender < 5 cria materiais sem nós
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*cor, 1.0)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rugosidade
    if emissao is not None:
        bsdf.inputs["Emission Color"].default_value = (*emissao, 1.0)
        bsdf.inputs["Emission Strength"].default_value = forca
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
    return mat


def objeto_de_bmesh(nome, bm, mat, pai=None, suave=False):
    malha = bpy.data.meshes.new(nome)
    bm.normal_update()
    bm.to_mesh(malha)
    bm.free()
    if suave:
        for p in malha.polygons:
            p.use_smooth = True
    malha.materials.append(mat)
    obj = bpy.data.objects.new(nome, malha)
    bpy.context.scene.collection.objects.link(obj)
    if pai:
        obj.parent = pai
    return obj


def vazio(nome, pai=None, local=(0, 0, 0)):
    obj = bpy.data.objects.new(nome, None)
    obj.empty_display_size = 0.3
    obj.location = local
    bpy.context.scene.collection.objects.link(obj)
    if pai:
        obj.parent = pai
    return obj


def loft(secoes, lados=8, ponta_frente=None, ponta_tras=None):
    """Cria um casco a partir de seções elípticas ao longo de Y.

    secoes: lista de (y, raio_x, raio_z, deslocamento_z)
    """
    bm = bmesh.new()
    aneis = []
    for y, rx, rz, dz in secoes:
        anel = []
        for i in range(lados):
            a = 2 * math.pi * i / lados + math.pi / lados
            anel.append(bm.verts.new((math.cos(a) * rx, y, math.sin(a) * rz + dz)))
        aneis.append(anel)
    for a, b in zip(aneis, aneis[1:]):
        for i in range(lados):
            j = (i + 1) % lados
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if ponta_frente is not None:
        v = bm.verts.new(ponta_frente)
        ult = aneis[-1]
        for i in range(lados):
            bm.faces.new((ult[i], ult[(i + 1) % lados], v))
    else:
        bm.faces.new(list(reversed(aneis[-1])))
    if ponta_tras is not None:
        v = bm.verts.new(ponta_tras)
        pri = aneis[0]
        for i in range(lados):
            bm.faces.new((pri[(i + 1) % lados], pri[i], v))
    else:
        bm.faces.new(aneis[0])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def prisma(contorno_xy, espessura, z=0.0):
    """Extruda um polígono do plano XY em Z (asas, aletas)."""
    bm = bmesh.new()
    baixo = [bm.verts.new((x, y, z - espessura / 2)) for x, y in contorno_xy]
    cima = [bm.verts.new((x, y, z + espessura / 2)) for x, y in contorno_xy]
    n = len(contorno_xy)
    bm.faces.new(cima)
    bm.faces.new(list(reversed(baixo)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((baixo[i], baixo[j], cima[j], cima[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def transformar(bm, matriz):
    bmesh.ops.transform(bm, matrix=matriz, verts=bm.verts)
    return bm


def espelhar_x(bm):
    transformar(bm, Matrix.Scale(-1, 4, (1, 0, 0)))
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return bm


# ---------------------------------------------------------------- materiais

def criar_materiais():
    global CASCO, CASCO_ESCURO, VIOLETA, CIANO, VIDRO, MOTOR, DISCO, CUPULA, ANEL_ALIEN, OLHO, ROCHA, PORTAL, PORTAL_BASE
    CASCO = material("Casco", (0.86, 0.85, 0.96), metal=0.35, rugosidade=0.35)
    CASCO_ESCURO = material("CascoEscuro", (0.12, 0.11, 0.22), metal=0.6, rugosidade=0.4)
    VIOLETA = material("Violeta", (0.36, 0.26, 1.0), metal=0.2, rugosidade=0.3,
                       emissao=(0.42, 0.33, 1.0), forca=0.6)
    CIANO = material("CianoNeon", (0.1, 0.85, 1.0), emissao=(0.19, 0.89, 1.0), forca=4.0)
    VIDRO = material("Cabine", (0.08, 0.14, 0.4), metal=0.1, rugosidade=0.05,
                     emissao=(0.25, 0.55, 1.0), forca=0.35, alpha=0.78)
    MOTOR = material("Motor", (0.4, 0.7, 1.0), emissao=(0.55, 0.45, 1.0), forca=8.0)

    DISCO = material("DiscoAlien", (0.28, 0.3, 0.38), metal=0.85, rugosidade=0.25)
    CUPULA = material("CupulaAlien", (0.2, 1.0, 0.55), metal=0.0, rugosidade=0.1,
                      emissao=(0.2, 1.0, 0.55), forca=1.6, alpha=0.85)
    ANEL_ALIEN = material("AnelAlien", (1.0, 0.25, 0.75), emissao=(1.0, 0.25, 0.75), forca=5.0)
    OLHO = material("OlhoAlien", (1.0, 0.95, 0.4), emissao=(1.0, 0.85, 0.3), forca=6.0)

    ROCHA = material("Rocha", (0.32, 0.27, 0.3), metal=0.05, rugosidade=0.95)
    PORTAL = material("PortalNeon", (1.0, 0.75, 0.2), emissao=(1.0, 0.72, 0.15), forca=5.0)
    PORTAL_BASE = material("PortalBase", (0.18, 0.16, 0.3), metal=0.8, rugosidade=0.3)


# ---------------------------------------------------------------- nave

def criar_nave():
    raiz = vazio("Nave")

    # Fuselagem: nariz apontando para +Y (vira -Z no glTF = "para frente" no jogo)
    casco = loft(
        [
            (-1.15, 0.30, 0.22, 0.02),
            (-0.70, 0.42, 0.30, 0.05),
            (0.10, 0.36, 0.27, 0.04),
            (0.90, 0.20, 0.15, 0.00),
            (1.55, 0.07, 0.06, -0.03),
        ],
        lados=8,
        ponta_frente=(0, 1.95, -0.04),
    )
    objeto_de_bmesh("Fuselagem", casco, CASCO, raiz)

    # Faixa violeta sob a fuselagem
    quilha = prisma([(-0.05, -1.0), (0.05, -1.0), (0.04, 1.2), (-0.04, 1.2)], 0.12, z=-0.26)
    objeto_de_bmesh("Quilha", quilha, VIOLETA, raiz)

    # Cabine
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=1.0)
    transformar(bm, Matrix.Diagonal((0.22, 0.55, 0.18, 1.0)))
    transformar(bm, Matrix.Translation((0, 0.15, 0.24)))
    objeto_de_bmesh("Cabine", bm, VIDRO, raiz, suave=True)

    # Asas enflechadas com diedro negativo (pontas para baixo)
    contorno = [(0.30, 0.55), (0.30, -0.85), (2.25, -1.35), (2.35, -1.05)]
    for lado in (1, -1):
        asa = prisma(contorno, 0.07)
        transformar(asa, Matrix.Rotation(math.radians(14), 4, "Y"))
        if lado < 0:
            espelhar_x(asa)
        objeto_de_bmesh("Asa" + ("D" if lado > 0 else "E"), asa, CASCO, raiz)

        filete = prisma([(0.9, -0.55), (0.9, -0.75), (2.15, -1.12), (2.2, -0.98)], 0.09)
        transformar(filete, Matrix.Rotation(math.radians(14), 4, "Y"))
        if lado < 0:
            espelhar_x(filete)
        objeto_de_bmesh("FaixaAsa" + ("D" if lado > 0 else "E"), filete, VIOLETA, raiz)

        # Aleta vertical na ponta da asa, com borda neon
        ponta_x = 2.28 * lado
        ponta_z = -2.28 * math.tan(math.radians(14))
        bm = bmesh.new()
        # aleta no plano YZ: perfil (y, z)
        perfil = [(-1.35, 0.0), (-0.95, 0.0), (-1.1, 0.5), (-1.38, 0.58)]
        frente = [bm.verts.new((ponta_x - 0.03, y, z + ponta_z)) for y, z in perfil]
        tras = [bm.verts.new((ponta_x + 0.03, y, z + ponta_z)) for y, z in perfil]
        bm.faces.new(frente)
        bm.faces.new(list(reversed(tras)))
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((frente[i], frente[j], tras[j], tras[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        objeto_de_bmesh("Aleta" + ("D" if lado > 0 else "E"), bm, CASCO, raiz)

        luz = bmesh.new()
        bmesh.ops.create_cube(luz, size=1.0)
        transformar(luz, Matrix.Diagonal((0.07, 0.42, 0.05, 1.0)))
        transformar(luz, Matrix.Translation((ponta_x, -1.15, ponta_z + 0.03)))
        objeto_de_bmesh("LuzAsa" + ("D" if lado > 0 else "E"), luz, CIANO, raiz)

        # Canhões sob as asas
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.06, radius2=0.045, depth=1.2)
        transformar(bm, Matrix.Rotation(math.radians(90), 4, "X"))
        transformar(bm, Matrix.Translation((0.95 * lado, 0.05, -0.32)))
        objeto_de_bmesh("Canhao" + ("D" if lado > 0 else "E"), bm, CASCO_ESCURO, raiz)
        vazio("Canhao" + ("D" if lado > 0 else "E") + "Saida", raiz, (0.95 * lado, 0.7, -0.32))

    # Estabilizadores traseiros duplos inclinados
    for lado in (1, -1):
        bm = bmesh.new()
        perfil = [(-1.1, 0.0), (-0.55, 0.0), (-0.95, 0.62), (-1.25, 0.68)]
        a = [bm.verts.new((0.22 * lado - 0.025, y, z + 0.18)) for y, z in perfil]
        b = [bm.verts.new((0.22 * lado + 0.025, y, z + 0.18)) for y, z in perfil]
        bm.faces.new(a)
        bm.faces.new(list(reversed(b)))
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((a[i], a[j], b[j], b[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        transformar(bm, Matrix.Translation((-0.22 * lado, 0, -0.18)))
        transformar(bm, Matrix.Rotation(math.radians(18 * lado), 4, "Y"))
        transformar(bm, Matrix.Translation((0.22 * lado, 0, 0.18)))
        objeto_de_bmesh("Estabilizador" + ("D" if lado > 0 else "E"), bm, VIOLETA, raiz)

    # Motor e brilho do motor (o jogo pulsa a escala do brilho)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.3, radius2=0.24, depth=0.3)
    transformar(bm, Matrix.Rotation(math.radians(90), 4, "X"))
    transformar(bm, Matrix.Translation((0, -1.2, 0.03)))
    objeto_de_bmesh("Motor", bm, CASCO_ESCURO, raiz)

    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.22, radius2=0.0, depth=0.7)
    transformar(bm, Matrix.Rotation(math.radians(-90), 4, "X"))
    transformar(bm, Matrix.Translation((0, -1.6, 0.03)))
    objeto_de_bmesh("MotorBrilho", bm, MOTOR, raiz)
    return raiz


# ---------------------------------------------------------------- invasor

def criar_invasor():
    raiz = vazio("Invasor")

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=1.0)
    transformar(bm, Matrix.Diagonal((1.25, 1.25, 0.32, 1.0)))
    objeto_de_bmesh("Disco", bm, DISCO, raiz, suave=True)

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=0.55)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.01], context="VERTS")
    transformar(bm, Matrix.Translation((0, 0, 0.18)))
    objeto_de_bmesh("Cupula", bm, CUPULA, raiz, suave=True)

    bm = bmesh.new()
    seg_maior, seg_menor, R, r = 24, 6, 1.28, 0.07
    aneis = []
    for i in range(seg_maior):
        a = 2 * math.pi * i / seg_maior
        anel = []
        for j in range(seg_menor):
            b = 2 * math.pi * j / seg_menor
            x = (R + r * math.cos(b)) * math.cos(a)
            y = (R + r * math.cos(b)) * math.sin(a)
            anel.append(bm.verts.new((x, y, r * math.sin(b))))
        aneis.append(anel)
    for i in range(seg_maior):
        a, b = aneis[i], aneis[(i + 1) % seg_maior]
        for j in range(seg_menor):
            k = (j + 1) % seg_menor
            bm.faces.new((a[j], b[j], b[k], a[k]))
    objeto_de_bmesh("InvasorAnel", bm, ANEL_ALIEN, raiz, suave=True)

    # Luzes ao redor do disco
    for i in range(8):
        a = 2 * math.pi * i / 8
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.09)
        transformar(bm, Matrix.Translation((math.cos(a) * 0.95, math.sin(a) * 0.95, -0.2)))
        objeto_de_bmesh(f"LuzDisco{i}", bm, OLHO, raiz)

    # Tentáculos/garras
    for i in range(3):
        a = 2 * math.pi * i / 3 + math.pi / 6
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.12, radius2=0.0, depth=0.8)
        transformar(bm, Matrix.Rotation(math.radians(180 + 20), 4, "X"))
        transformar(bm, Matrix.Rotation(a, 4, "Z"))
        transformar(bm, Matrix.Translation((math.cos(a) * 0.45, math.sin(a) * 0.45, -0.45)))
        objeto_de_bmesh(f"Garra{i}", bm, DISCO, raiz)

    # Olho central sob o disco
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.2)
    transformar(bm, Matrix.Translation((0, 0, -0.3)))
    objeto_de_bmesh("Olho", bm, OLHO, raiz, suave=True)

    # O disco fica de frente para a câmera do jogo
    raiz.rotation_euler = (math.radians(70), 0, 0)
    return raiz


# ---------------------------------------------------------------- asteroide

def criar_asteroide():
    raiz = vazio("Asteroide")
    rnd = random.Random(7)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    for v in bm.verts:
        ruido = 0.75 + rnd.random() * 0.45
        v.co *= ruido
    transformar(bm, Matrix.Diagonal((1.15, 0.9, 0.85, 1.0)))
    objeto_de_bmesh("Rocha", bm, ROCHA, raiz)
    return raiz


# ---------------------------------------------------------------- portal

def criar_portal():
    raiz = vazio("Portal")
    for nome, R, r, mat, seg in (
        ("PortalAro", 3.2, 0.22, PORTAL_BASE, 8),
        ("PortalLuz", 3.2, 0.09, PORTAL, 6),
    ):
        bm = bmesh.new()
        aneis = []
        n = 40
        for i in range(n):
            a = 2 * math.pi * i / n
            anel = []
            for j in range(seg):
                b = 2 * math.pi * j / seg
                desloc = 0.16 if nome == "PortalLuz" else 0.0
                x = (R + r * math.cos(b)) * math.cos(a)
                z = (R + r * math.cos(b)) * math.sin(a)
                anel.append(bm.verts.new((x, r * math.sin(b) + desloc, z)))
            aneis.append(anel)
        for i in range(n):
            a, b = aneis[i], aneis[(i + 1) % n]
            for j in range(seg):
                k = (j + 1) % seg
                bm.faces.new((a[j], a[k], b[k], b[j]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        objeto_de_bmesh(nome, bm, mat, raiz, suave=True)

    # Quatro luzes de marcação
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=0.5)
        transformar(bm, Matrix.Rotation(a, 4, "Y"))
        transformar(bm, Matrix.Translation((math.cos(a) * 3.2, 0, math.sin(a) * 3.2)))
        objeto_de_bmesh(f"PortalMarca{i}", bm, PORTAL, raiz)
    return raiz


# ---------------------------------------------------------------- render de prévia

def renderizar_previa(nave, invasor):
    cena = bpy.context.scene
    for obj in bpy.data.objects:
        obj.hide_render = True
    for raiz in (nave, invasor):
        raiz.hide_render = False
        for filho in raiz.children_recursive:
            filho.hide_render = False

    nave.location = (0, 0, 0)
    nave.rotation_euler = (0, math.radians(-20), math.radians(12))
    invasor.location = (-3.0, 11.0, 2.2)

    cam_dados = bpy.data.cameras.new("Camera")
    cam = bpy.data.objects.new("Camera", cam_dados)
    cena.collection.objects.link(cam)
    cam.location = (5.5, -6.0, 3.2)
    cam_dados.lens = 32
    alvo = Vector((-0.6, 3.0, 0.6))
    cam.rotation_euler = (alvo - cam.location).to_track_quat("-Z", "Y").to_euler()
    cena.camera = cam

    for nome, energia, local, cor in (
        ("Chave", 900, (4, -4, 6), (0.85, 0.85, 1.0)),
        ("Recorte", 1300, (-5, 6, 3), (0.45, 0.35, 1.0)),
    ):
        luz_dados = bpy.data.lights.new(nome, "POINT")
        luz_dados.energy = energia
        luz_dados.color = cor
        luz = bpy.data.objects.new(nome, luz_dados)
        luz.location = local
        cena.collection.objects.link(luz)

    mundo = bpy.data.worlds.new("Espaco")
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.015, 0.06, 1)
    cena.world = mundo

    cena.render.engine = "CYCLES"
    cena.cycles.samples = 48
    cena.cycles.device = "CPU"
    cena.render.resolution_x = 960
    cena.render.resolution_y = 540
    cena.render.filepath = SAIDA_PNG
    bpy.ops.render.render(write_still=True)

    nave.location = (0, 0, 0)
    nave.rotation_euler = (0, 0, 0)
    invasor.location = (0, 0, 0)
    for obj in (cam,):
        bpy.data.objects.remove(obj)


# ---------------------------------------------------------------- principal

def main():
    limpar_cena()
    criar_materiais()
    nave = criar_nave()
    invasor = criar_invasor()
    criar_asteroide()
    criar_portal()

    if "--render" in sys.argv:
        renderizar_previa(nave, invasor)

    os.makedirs(os.path.dirname(SAIDA_GLB), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=SAIDA_GLB,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_lights=False,
        export_cameras=False,
    )
    print("GLB exportado em", os.path.abspath(SAIDA_GLB))


if __name__ == "__main__":
    main()
