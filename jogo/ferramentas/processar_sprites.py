"""Recorta os sprites de assets/sprites em quadros prontos para o jogo.

Uso (a partir da raiz do repositório):
    pip install pillow numpy scipy
    python3 jogo/ferramentas/processar_sprites.py

Gera jogo/sprites/*.png e jogo/sprites/manifesto.json.
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ORIGEM = os.path.join(RAIZ, 'assets', 'sprites')
DESTINO = os.path.join(RAIZ, 'jogo', 'sprites')

manifesto = {'heroi': {}, 'cenario': {}, 'texturas': {}, 'itens': {}, 'ratos': {}, 'ui': {}}


def componentes(img, fechamento=2):
    """Rotula as regiões opacas da imagem (com um fechamento morfológico)."""
    alfa = np.array(img)[:, :, 3] > 20
    if fechamento:
        alfa = ndimage.binary_closing(alfa, iterations=fechamento)
    rotulos, _ = ndimage.label(alfa)
    return rotulos


def recorte_mascara(img, rotulos, ponto):
    """Recorta o componente que contém `ponto`, apagando pixels de vizinhos."""
    rotulo = rotulos[ponto[1], ponto[0]]
    assert rotulo, f'nenhum componente em {ponto}'
    mascara = rotulos == rotulo
    ys, xs = np.where(mascara)
    caixa = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    arr = np.array(img).copy()
    arr[~mascara, 3] = 0
    return Image.fromarray(arr).crop(caixa)


def recorte_uniao(img, rotulos, pontos):
    """Recorta a união de vários componentes (ex.: personagem + objeto na mão)."""
    mascara = np.zeros(rotulos.shape, bool)
    for p in pontos:
        mascara |= rotulos == rotulos[p[1], p[0]]
    ys, xs = np.where(mascara)
    caixa = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    arr = np.array(img).copy()
    arr[~mascara, 3] = 0
    return Image.fromarray(arr).crop(caixa)


def aparar(img):
    caixa = img.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    return img.crop(caixa)


def ancora_x(img):
    """Posição horizontal (0 a 1) do centro da cabeça/tronco: média dos pixels opacos do topo (cabeça).

    Mantém o corpo parado na tela quando um braço ou uma perna esticada alarga o quadro.
    """
    alfa = np.array(img)[:, :, 3] > 60
    topo = alfa[: max(1, img.height * 18 // 100)]
    xs = np.where(topo)[1]
    return round(float(xs.mean() + 0.5) / img.width, 4) if len(xs) else 0.5


def salvar(grupo, nome, img, **extra):
    caminho = os.path.join(DESTINO, f'{grupo}_{nome}.png')
    img.save(caminho, optimize=True)
    if grupo in ('heroi', 'ratos') and not nome.endswith('caido') and nome != 'retrato':
        extra.setdefault('ax', ancora_x(img))
    manifesto[grupo][nome] = {'arquivo': f'sprites/{grupo}_{nome}.png',
                              'w': img.width, 'h': img.height, **extra}


def escalar(img, fator):
    if fator == 1:
        return img
    return img.resize((max(1, round(img.width * fator)), max(1, round(img.height * fator))),
                      Image.LANCZOS if fator < 1 else Image.NEAREST)


def heroi():
    pular = Image.open(os.path.join(ORIGEM, 'personagem-pular-acenar.png')).convert('RGBA')
    pegar = Image.open(os.path.join(ORIGEM, 'personagem-pegar-garrafa-pedra.webp')).convert('RGBA')

    # A caminhada agora vem de personagem-andar-8-quadros.png (heroi_novo).
    # Folha de pulo: parado (usado deitado), impulso (arremesso), aterrissagem (dor), aceno, frente.
    # O quadro da voadora (224-340) foi substituído pelo chute lateral da folha de golpes.
    caixas = [(30, 0, 82), (106, 0, 224), (345, 0, 440), (460, 0, 548), (565, 0, 672)]
    nomes = ['parado', 'impulso', 'aterrissar', 'acenar', 'frente_pose']
    for (x0, y0, x1), nome in zip(caixas, nomes):
        salvar('heroi', nome, aparar(pular.crop((x0, y0, x1, 160))))

    # Folha de pegar objetos: usa as linhas viradas para a direita (1 = garrafa, 3 = pedra),
    # reescalando cada linha para a altura da pose parada das outras folhas (158 px).
    rot = componentes(pegar)
    linhas = {
        'garrafa': {'fator': 158 / 267, 'faixa': (305, 585)},
        'pedra': {'fator': 158 / 198 * 0.85, 'faixa': (815, 1024)},
    }
    for tipo, cfg in linhas.items():
        y0, y1 = cfg['faixa']
        for i in range(6):
            maiores = maiores_componentes(rot, (256 * i, y0, 256 * (i + 1), y1))
            quadro = recorte_uniao(pegar, rot, [maiores[0]])
            salvar('heroi', f'pegar_{tipo}{i}', escalar(quadro, cfg['fator']))
            if i == 0:
                item = recorte_uniao(pegar, rot, [maiores[1]])
                salvar('itens', tipo, escalar(item, cfg['fator']))


def maiores_componentes(rotulos, caixa):
    """Pontos representativos dos componentes dentro da caixa, do maior para o menor."""
    x0, y0, x1, y1 = caixa
    janela = rotulos[y0:y1, x0:x1]
    ids, contagens = np.unique(janela[janela > 0], return_counts=True)
    pontos = []
    for rotulo in ids[np.argsort(-contagens)]:
        ys, xs = np.where(janela == rotulo)
        pontos.append((x0 + xs[0], y0 + ys[0]))
    return pontos


def quadros_da_linha(img, faixa, minimo=1500, fechamento=3):
    """Separa os personagens de uma faixa horizontal da folha, da esquerda para a direita.

    Cada personagem é o maior pedaço opaco; pedaços pequenos (rabo, taco, pé solto)
    juntam-se ao personagem mais próximo.
    """
    y0, y1 = faixa
    faixa_img = img.crop((0, y0, img.width, y1))
    alfa = np.array(faixa_img)[:, :, 3] > 40
    alfa = ndimage.binary_closing(alfa, iterations=fechamento)
    rot, n = ndimage.label(alfa)
    areas = ndimage.sum(alfa, rot, range(1, n + 1))
    centros = ndimage.center_of_mass(alfa, rot, range(1, n + 1))
    grandes = [i for i in range(n) if areas[i] >= minimo]
    grandes.sort(key=lambda i: centros[i][1])
    grupos = {i: [i + 1] for i in grandes}
    caixas = ndimage.find_objects(rot)
    for i in range(n):
        if i in grupos or areas[i] < 40:
            continue
        cy, cx = centros[i]
        # só junta pedaços que estejam dentro (ou bem perto) da caixa de um personagem
        perto = [g for g in grandes
                 if caixas[g][0].start - 20 <= cy <= caixas[g][0].stop + 20
                 and caixas[g][1].start - 20 <= cx <= caixas[g][1].stop + 20]
        if not perto:
            continue
        dono = min(perto, key=lambda g: abs(centros[g][1] - cx) + abs(centros[g][0] - cy))
        grupos[dono].append(i + 1)
    arr = np.array(faixa_img)
    quadros = []
    for g in grandes:
        mascara = np.isin(rot, grupos[g])
        ys, xs = np.where(mascara)
        a = arr.copy()
        a[~mascara, 3] = 0
        quadros.append(Image.fromarray(a).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
    return quadros


def heroi_novo():
    """Golpes (socos, joelhada, chute) e o ciclo de caminhada de 8 quadros."""
    golpes = Image.open(os.path.join(ORIGEM, 'personagem-golpes.png')).convert('RGBA')
    socos = quadros_da_linha(golpes, (0, 256))
    chutes = quadros_da_linha(golpes, (526, 768))
    assert len(socos) == 6 and len(chutes) == 6, (len(socos), len(chutes))
    fator = 150 / socos[0].height  # guarda com a altura da pose parada
    for i, q in enumerate(socos):
        salvar('heroi', f'soco{i}', escalar(q, fator))
    for i, q in enumerate(chutes):
        salvar('heroi', f'chute{i}', escalar(q, fator))

    andar = Image.open(os.path.join(ORIGEM, 'personagem-andar-8-quadros.png')).convert('RGBA')
    passos = quadros_da_linha(andar, (444, 887))  # linha de baixo: virado para a direita
    assert len(passos) == 8, len(passos)
    fator = 168 / max(q.height for q in passos)  # proporção mais cabeçuda: um pouco maior que 158
    for i, q in enumerate(passos):
        salvar('heroi', f'passo{i}', escalar(q, fator))


RATOS = [('ratinho', 125), ('ratazana', 135), ('lixeiro', 125), ('rei', 185)]
# Colunas da folha de ações usadas para cada pose do jogo.
POSES_RATO = {'parado0': 0, 'parado1': 1, 'preparar': 6, 'atacar': 7, 'golpe': 8, 'dor': 9,
              'arremessar': 7, 'segurar': 10, 'investida': 11}


def ratos():
    acoes = Image.open(os.path.join(ORIGEM, 'ratos-acoes.png')).convert('RGBA')
    andar = Image.open(os.path.join(ORIGEM, 'ratos-andar.png')).convert('RGBA')
    alt_acoes = acoes.height / 4
    alt_andar = andar.height / 4
    for linha, (tipo, altura) in enumerate(RATOS):
        qa = quadros_da_linha(acoes, (round(linha * alt_acoes), round((linha + 1) * alt_acoes)))
        qw = quadros_da_linha(andar, (round(linha * alt_andar), round((linha + 1) * alt_andar)))
        assert len(qa) == 12 and len(qw) == 6, (tipo, len(qa), len(qw))
        fator = altura / qa[0].height
        poses = dict(POSES_RATO)
        if tipo == 'ratazana':
            poses['preparar'] = 10  # taco levantado atrás da cabeça
        for pose, col in poses.items():
            salvar('ratos', f'{tipo}_{pose}', escalar(qa[col], fator))
        # caído: o quadro de dor deitado de costas (girado 90° no sentido anti-horário)
        salvar('ratos', f'{tipo}_caido', escalar(qa[poses['dor']], fator).rotate(90, expand=True))
        fator_andar = altura / qw[0].height
        for i, q in enumerate(qw):
            salvar('ratos', f'{tipo}_andar{i}', escalar(q, fator_andar))


def grajau():
    img = Image.open(os.path.join(ORIGEM, 'grajau-bnh-tileset.png')).convert('RGBA')

    def objeto(nome, caixa, so_peca=True, apagar=()):
        fonte = img
        if apagar:
            fonte = img.copy()
            for ret in apagar:  # retângulos com pedaços de vizinhos encostados no objeto
                fonte.paste((0, 0, 0, 0), ret)
        recorte = fonte.crop(caixa)
        if so_peca:
            # descarta pedaços de objetos vizinhos que entraram no retângulo
            pecas = quadros_da_linha(recorte, (0, recorte.height), minimo=1, fechamento=2)
            recorte = max(pecas, key=lambda q: q.width * q.height)
        salvar('cenario', 'grajau_' + nome, aparar(recorte))

    objeto('panorama', (18, 12, 1520, 153), so_peca=False)
    objeto('por_do_sol', (1003, 159, 1521, 364), so_peca=False)
    objeto('caixa_dagua', (17, 372, 305, 641))
    objeto('casa_bege', (312, 400, 487, 641))
    objeto('casa_verde', (487, 400, 598, 641))
    objeto('muro_reboco', (598, 460, 667, 641))
    objeto('casa_laranja', (667, 400, 797, 641))
    objeto('mercadinho', (800, 400, 1003, 641))
    objeto('comercio', (1003, 440, 1272, 641))
    objeto('garagem', (1275, 486, 1391, 632))
    objeto('muro_grade', (1395, 505, 1524, 632))
    objeto('onibus', (10, 696, 366, 832))
    objeto('carro_prata', (375, 759, 541, 832))
    objeto('carro_preto', (546, 764, 682, 832))
    objeto('poste', (676, 641, 742, 846))
    objeto('luminaria', (747, 641, 836, 846))
    objeto('arvore', (965, 648, 1168, 846), apagar=[(960, 640, 1000, 700), (1137, 765, 1215, 846)])
    objeto('portao', (1137, 770, 1210, 846))
    objeto('arvore_fina', (1185, 680, 1290, 846), apagar=[(1137, 765, 1212, 846)])
    objeto('grade', (1287, 760, 1442, 846))
    objeto('placa', (1408, 686, 1470, 846), apagar=[(1395, 760, 1443, 846)])
    objeto('lixeira', (1471, 778, 1512, 846))

    def textura(nome, caixa, recuo=4):
        x0, y0, x1, y1 = caixa
        salvar('texturas', 'grajau_' + nome, img.crop((x0 + recuo, y0 + recuo, x1 - recuo, y1 - recuo)))

    textura('asfalto', (18, 849, 397, 951))
    textura('calcada', (405, 850, 795, 935))
    textura('faixa', (808, 853, 1196, 932))
    textura('buraco', (1209, 853, 1518, 929), recuo=6)
    textura('meio_fio', (19, 957, 752, 1006), recuo=2)
    textura('muro_baixo', (767, 942, 1055, 1007), recuo=2)
    objeto('escada', (1071, 940, 1297, 1006))
    objeto('bueiro', (1305, 942, 1518, 1006))



def tileset(arquivo, prefixo, objetos, texturas, so_peca=()):
    """Recorta objetos (retângulos) e texturas de um tileset com fundo transparente."""
    img = Image.open(os.path.join(ORIGEM, arquivo)).convert('RGBA')
    for nome, caixa in objetos.items():
        recorte = img.crop(caixa)
        if nome in so_peca:
            pecas = quadros_da_linha(recorte, (0, recorte.height), minimo=1, fechamento=2)
            recorte = max(pecas, key=lambda q: q.width * q.height)
        salvar('cenario', f'{prefixo}_{nome}', aparar(recorte))
    for nome, caixa in texturas.items():
        x0, y0, x1, y1 = caixa
        r = 4
        salvar('texturas', f'{prefixo}_{nome}', img.crop((x0 + r, y0 + r, x1 - r, y1 - r)))


def marsilac():
    tileset('marsilac-tileset.webp', 'marsilac', {
        'estacao': (7, 7, 336, 222), 'mercearia': (338, 35, 535, 200), 'casa': (540, 60, 730, 200),
        'ponte': (782, 78, 1046, 220), 'sinal': (1026, 5, 1115, 219),
        'mata': (8, 236, 252, 416), 'arvore': (250, 230, 410, 415), 'arvore2': (411, 232, 553, 413),
        'bananeira': (548, 237, 678, 373), 'bananeira2': (682, 241, 829, 370),
        'cerca': (849, 304, 961, 363), 'poste': (953, 233, 1040, 417), 'ponto': (1036, 300, 1120, 417),
        'caixote': (608, 501, 676, 568), 'barril': (689, 500, 731, 568), 'pneu': (740, 524, 796, 565),
        'kit': (915, 516, 965, 568), 'bandeira': (984, 493, 1043, 569), 'seta': (1054, 508, 1119, 565),
        'ponte_madeira': (12, 506, 187, 565),
    }, {
        'terra': (12, 430, 164, 495), 'terra2': (170, 430, 276, 495), 'terra_bloco': (367, 425, 448, 495),
        'asfalto': (558, 428, 667, 487), 'asfalto_faixa': (765, 428, 842, 484), 'trilho': (848, 436, 1114, 487),
        'agua': (193, 513, 290, 564), 'agua2': (297, 513, 375, 564),
    }, so_peca=('arvore', 'arvore2', 'bananeira', 'bananeira2', 'cerca', 'poste', 'ponto', 'sinal'))


def parelheiros():
    tileset('parelheiros-tileset.webp', 'parelheiros', {
        'igreja': (8, 11, 325, 322), 'padaria': (327, 11, 616, 322), 'mercado': (617, 45, 897, 322),
        'terminal': (893, 95, 1272, 322), 'sobrado': (1268, 11, 1494, 327),
        'onibus': (8, 355, 568, 514), 'ponto': (565, 364, 812, 512), 'feira': (808, 388, 963, 514),
        'arvore': (948, 329, 1163, 516), 'mata': (1165, 340, 1491, 516),
        'muro_grafite': (9, 524, 530, 641), 'muro_tijolo': (541, 528, 836, 642), 'poste': (836, 516, 1064, 654),
        'grade': (1071, 530, 1470, 639),
        'caixote': (845, 667, 903, 749), 'barril': (911, 667, 959, 749), 'cone': (966, 687, 1010, 749),
        'lixeira': (1015, 670, 1072, 749), 'banco': (1080, 693, 1175, 749), 'kit': (1282, 698, 1339, 756),
        'bandeira': (1353, 654, 1411, 762), 'placa_saida': (1415, 680, 1486, 757),
    }, {
        'asfalto': (13, 650, 163, 769), 'calcada': (170, 655, 247, 770), 'meio_fio': (253, 655, 357, 770),
        'faixa': (362, 655, 503, 775), 'terra': (509, 653, 603, 764), 'grama': (609, 656, 706, 772),
        'corrego': (715, 659, 833, 777),
    }, so_peca=('arvore', 'ponto', 'feira'))


def cidade_dutra():
    tileset('cidade-dutra-tileset.webp', 'dutra', {
        'padaria': (11, 20, 352, 282), 'comercio': (354, 60, 672, 282), 'sobrado': (672, 25, 882, 282),
        'interlagos': (882, 60, 1180, 282), 'praca': (1178, 15, 1422, 282), 'placa': (1418, 150, 1492, 282),
        'onibus': (14, 336, 413, 463), 'carro': (414, 393, 553, 462), 'ponto': (556, 358, 704, 469),
        'arvore': (706, 295, 839, 468), 'palmeira': (832, 329, 934, 469), 'arbusto': (793, 398, 857, 468),
        'arquibancada': (932, 319, 1112, 469), 'muro_grafite': (1110, 385, 1251, 469), 'poste': (1245, 299, 1300, 469),
        'portao': (1278, 390, 1341, 469), 'bandeirolas': (1346, 328, 1477, 392), 'pneus': (1380, 420, 1486, 468),
        'caixote': (892, 495, 955, 562), 'barril': (962, 495, 1003, 561), 'cone': (1008, 504, 1055, 562),
        'lixeira': (1059, 500, 1099, 563), 'banco': (1107, 510, 1191, 564), 'kit': (1298, 515, 1348, 561),
        'bandeira': (1362, 478, 1414, 564), 'seta': (1424, 501, 1488, 558),
    }, {
        'asfalto': (14, 491, 113, 564), 'asfalto2': (118, 491, 213, 564), 'asfalto_amarela': (308, 491, 405, 564),
        'faixa': (409, 491, 512, 564), 'calcada': (517, 491, 614, 564), 'ladrilho': (619, 491, 697, 564),
        'tijolo': (701, 491, 783, 564), 'grama': (788, 491, 884, 564),
    }, so_peca=('arvore', 'palmeira', 'arbusto', 'poste', 'portao', 'bandeirolas', 'pneus'))


def ratus_direitus():
    """Subchefe: 6 linhas (guarda, andar, socos, chute, investida, dano/queda) x 6 quadros."""
    img = Image.open(os.path.join(ORIGEM, 'ratus-direitus.webp')).convert('RGBA')
    img = img.crop((118, 0, img.width, img.height))  # tira os rótulos da esquerda
    faixas = [(0, 178), (180, 340), (342, 500), (506, 672), (676, 826), (834, 1000)]
    nomes = ['guarda', 'andar', 'soco', 'chute', 'investida', 'dano']
    linhas = [quadros_da_linha(img, f, minimo=4000) for f in faixas]
    assert all(len(l) == 6 for l in linhas), [len(l) for l in linhas]
    fator = 178 / linhas[0][0].height
    for nome, quadros in zip(nomes, linhas):
        for i, q in enumerate(quadros):
            salvar('ratos', f'direitus_{nome}{i}', escalar(q, fator))


def mapa():
    """Mapa da Zona Sul: base em preto e branco e uma camada vermelha por região."""
    img = Image.open(os.path.join(ORIGEM, 'mapa-zona-sul.webp')).convert('RGBA')
    topo = img.crop((60, 0, 850, 515))
    arr = np.array(topo).astype(float)
    alfa = arr[:, :, 3] > 40
    cinza = (arr[:, :, :3] @ [0.3, 0.59, 0.11])[..., None].repeat(3, 2)
    base = np.dstack([cinza, arr[:, :, 3]]).astype(np.uint8)
    salvar('ui', 'mapa_cinza', Image.fromarray(base, 'RGBA'))

    # Divisas dos bairros traçadas à mão sobre as ruas do desenho (coordenadas do recorte 790x515).
    # Cada polígono é pintado por cima do anterior; o que sobra fica com Marsilac.
    divisas = {
        'parelheiros': [(0, 150), (200, 150), (205, 245), (318, 245), (410, 250), (410, 300), (540, 320),
                        (615, 395), (560, 400), (400, 395), (200, 400), (0, 325)],
        'cidade_dutra': [(0, 73), (250, 73), (258, 98), (445, 102), (430, 140), (330, 180), (318, 245),
                         (205, 245), (200, 150), (0, 150)],
        'grajau': [(445, 102), (790, 102), (790, 395), (615, 395), (540, 320), (410, 300), (410, 250),
                   (318, 245), (330, 180), (430, 140)],
        'socorro': [(0, 0), (790, 0), (790, 100), (445, 102), (258, 98), (250, 73), (0, 73)],
    }
    dono = Image.new('L', topo.size, 0)
    d = ImageDraw.Draw(dono)
    nomes = ['marsilac'] + list(divisas)
    for k, nome in enumerate(nomes[1:], start=1):
        d.polygon(divisas[nome], fill=k)
    dono = np.array(dono)
    regioes = {nome: (dono == k) & alfa for k, nome in enumerate(nomes)}
    centros = {}
    for nome, mascara in regioes.items():
        ys, xs = np.where(mascara)
        centros[nome] = [round(float(xs.mean()), 1), round(float(ys.mean()), 1)]
        vermelho = arr.copy()
        lum = cinza[:, :, 0] / 255
        vermelho[:, :, 0] = 120 + 135 * lum
        vermelho[:, :, 1] = 20 + 60 * lum
        vermelho[:, :, 2] = 30 + 60 * lum
        vermelho[:, :, 3] = np.where(mascara, 255, 0)
        salvar('ui', f'mapa_{nome}', Image.fromarray(vermelho.astype(np.uint8), 'RGBA'))
    manifesto['ui']['mapa_cinza']['centros'] = centros

    # Ícones (coluna da direita)
    for nome, caixa in {'pino': (875, 1320, 990, 1420), 'onibus': (860, 735, 1000, 830), 'ponto': (880, 245, 950, 305)}.items():
        salvar('ui', f'mapa_icone_{nome}', aparar(img.crop(caixa)))



def maior_peca(recorte):
    pecas_ = quadros_da_linha(recorte, (0, recorte.height), minimo=1, fechamento=2)
    return max(pecas_, key=lambda q: (np.array(q)[:, :, 3] > 40).sum())


def pecas(img, caixa, nomes, prefixo, grupo='cenario', minimo=200):
    """Divide a área em peças (da esquerda para a direita) e salva cada uma com um nome."""
    recorte = img.crop(caixa)
    qs = quadros_da_linha(recorte, (0, recorte.height), minimo=minimo, fechamento=2)
    assert len(qs) == len(nomes), (prefixo, caixa, len(qs), nomes)
    for nome, q in zip(nomes, qs):
        if nome:
            salvar(grupo, f'{prefixo}_{nome}', q)


def bnh_alagado():
    img = Image.open(os.path.join(ORIGEM, 'bnh-alagado-tileset.webp')).convert('RGBA')

    def obj(nome, caixa, inteiro=False):
        r = img.crop(caixa)
        salvar('cenario', 'alagado_' + nome, aparar(r) if inteiro else maior_peca(r))

    obj('panorama', (12, 2, 1113, 125), True)
    obj('rua', (12, 128, 1113, 268), True)
    obj('caixa_dagua', (12, 268, 215, 458), True)
    obj('casas', (222, 275, 545, 456))
    obj('mercadinho', (548, 275, 706, 458))
    obj('comercio', (708, 300, 920, 458))
    obj('garagem', (925, 318, 1008, 458))
    obj('muro', (1012, 330, 1108, 458))
    obj('onibus', (12, 440, 252, 560))
    obj('carro_prata', (256, 470, 372, 560))
    obj('carro_preto', (374, 470, 470, 560))
    obj('poste', (465, 430, 508, 560))
    obj('luminaria', (508, 430, 562, 560))
    obj('arvore', (568, 445, 672, 560))
    obj('escada', (835, 440, 972, 560))
    obj('pier', (975, 445, 1112, 560))
    for nome, caixa in {'agua': (15, 563, 126, 615), 'calcada': (133, 563, 293, 615), 'faixa': (301, 563, 458, 618),
                        'bueiro': (465, 563, 571, 615), 'borda': (578, 563, 683, 615), 'redemoinho': (690, 563, 794, 616)}.items():
        x0, y0, x1, y1 = caixa
        salvar('texturas', 'alagado_' + nome, img.crop((x0 + 4, y0 + 4, x1 - 4, y1 - 4)))
    for nome, x0, x1 in [('caixote', 800, 839), ('pneu', 839, 879), ('garrafa', 879, 913), ('caixa', 913, 951),
                         ('sacos', 951, 1004), ('cone', 1004, 1047)]:
        obj(nome, (x0, 566, x1, 620))
    pecas(img, (1048, 540, 1114, 630), ['bandeira'], 'alagado')


def belmira():
    img = Image.open(os.path.join(ORIGEM, 'belmira-marin-tileset.webp')).convert('RGBA')

    def obj(nome, caixa, inteiro=True):
        r = img.crop(caixa)
        salvar('cenario', 'belmira_' + nome, aparar(r) if inteiro else maior_peca(r))

    obj('panorama', (2, 2, 1123, 155))
    obj('panorama_chuva', (2, 160, 1123, 325))
    obj('onibus_verde', (10, 343, 200, 408))
    obj('onibus_azul', (350, 343, 516, 408))
    obj('articulado', (678, 343, 984, 408))
    obj('hb20', (8, 428, 100, 471))
    obj('sedan', (227, 428, 326, 471))
    obj('vermelho', (455, 428, 544, 471))
    obj('cinza', (685, 428, 787, 471))
    obj('moto', (923, 428, 980, 471))
    obj('mercado', (10, 498, 78, 561))
    obj('padaria', (78, 498, 140, 561))
    obj('lanchonete', (140, 498, 216, 561))
    obj('farmacia', (216, 498, 306, 561))
    obj('poste', (309, 494, 447, 572))
    obj('semaforo', (453, 494, 530, 558))
    obj('placa', (537, 499, 600, 534))
    obj('placa_e', (606, 506, 656, 568))
    obj('ponto', (664, 500, 775, 567))
    obj('luminaria', (775, 494, 830, 568))
    obj('cones', (835, 494, 907, 557))
    obj('defensa', (918, 508, 1010, 528))
    obj('gradil', (1020, 508, 1116, 545))
    for nome, caixa in {'seco': (11, 594, 153, 646), 'molhado': (160, 594, 297, 646), 'faixa': (301, 594, 390, 646),
                        'buraco': (397, 594, 477, 646), 'sarjeta': (483, 594, 578, 646), 'calcada': (584, 594, 673, 646),
                        'poca': (686, 594, 749, 646)}.items():
        x0, y0, x1, y1 = caixa
        salvar('texturas', 'belmira_' + nome, img.crop((x0 + 3, y0 + 3, x1 - 3, y1 - 3)))


def jetski():
    """Boulos e os ratos de jet ski."""
    b = Image.open(os.path.join(ORIGEM, 'boulos-jetski.webp')).convert('RGBA')
    for ret in [(0, 55, 155, 100), (0, 215, 155, 262), (0, 395, 104, 442), (0, 575, 104, 622), (0, 750, 104, 800),
                (0, 912, 135, 962), (770, 912, 900, 962)]:
        b.paste((0, 0, 0, 0), ret)  # rótulos
    linhas = {'acelerar': (10, 175), 'curva': (335, 505), 'salto': (505, 710), 'frear': (712, 870)}
    alturas = {}
    for nome, faixa in linhas.items():
        qs = quadros_da_linha(b, faixa, minimo=4000)
        assert len(qs) == 6, (nome, len(qs))
        if nome == 'acelerar':
            fator = 150 / max(q.height for q in qs)
        for i, q in enumerate(qs):
            salvar('heroi', f'jet_{nome}{i}', escalar(q, fator))
    # efeitos (splash 5 quadros e ripple 6 quadros)
    fx = quadros_da_linha(b, (875, 990), minimo=150)
    nomes = [f'splash{i}' for i in range(5)] + [f'ripple{i}' for i in range(6)]
    assert len(fx) == 11, len(fx)
    for nome, q in zip(nomes, fx):
        salvar('itens', 'fx_jet_' + nome, q)

    r = Image.open(os.path.join(ORIGEM, 'ratos-jetski.webp')).convert('RGBA')
    for ret in [(0, 70, 100, 115), (0, 260, 80, 305), (0, 465, 85, 510), (0, 655, 60, 700)]:
        r.paste((0, 0, 0, 0), ret)
    faixas = {'ratinho': (15, 200), 'ratazana': (205, 395), 'lixeiro': (400, 595), 'rei': (598, 812)}
    alturas = {'ratinho': 120, 'ratazana': 125, 'lixeiro': 120, 'rei': 150}
    for tipo, faixa in faixas.items():
        qs = quadros_da_linha(r, faixa, minimo=4000)
        while len(qs) < 8:
            # capas encostadas: separa a peça mais larga na coluna com menos pixels opacos
            i = max(range(len(qs)), key=lambda k: qs[k].width)
            a = np.array(qs[i])[:, :, 3] > 40
            meio = range(a.shape[1] // 3, 2 * a.shape[1] // 3)
            corte = min(meio, key=lambda c: a[:, c].sum())
            esq, dir_ = qs[i].crop((0, 0, corte, qs[i].height)), qs[i].crop((corte, 0, qs[i].width, qs[i].height))
            qs[i:i + 1] = [aparar(esq), aparar(dir_)]
        assert len(qs) == 8, (tipo, len(qs))
        fator = alturas[tipo] / qs[0].height
        for i, q in enumerate(qs):
            salvar('ratos', f'jet{tipo}_q{i}', escalar(q, fator))


def retrato():
    """Remove o fundo branco do retrato (preenchimento a partir das bordas)."""
    img = Image.open(os.path.join(ORIGEM, 'personagem-retrato-frente.jpg')).convert('RGB')
    arr = np.array(img).astype(int)
    branco = (arr.min(axis=2) > 232)
    rotulos, _ = ndimage.label(branco)
    borda = set(np.unique(np.concatenate([rotulos[0], rotulos[-1], rotulos[:, 0], rotulos[:, -1]]))) - {0}
    fundo = np.isin(rotulos, list(borda))
    fundo = ndimage.binary_opening(fundo, iterations=1)
    rgba = np.dstack([arr, np.where(fundo, 0, 255)]).astype(np.uint8)
    img = aparar(Image.fromarray(rgba, 'RGBA'))
    # Busto (cabeça e ombros) para as caixas de diálogo.
    busto = img.crop((0, 0, img.width, int(img.height * 0.62)))
    salvar('heroi', 'retrato', escalar(busto, 0.25))


def cenario():
    img = Image.open(os.path.join(ORIGEM, 'sao-paulo-cenario-tileset.webp')).convert('RGBA')
    rot = componentes(img)
    # Caixas (x0, y0, x1, y1) de cada objeto na folha; usa o maior componente dentro dela.
    objetos = {
        'masp': (9, 58, 550, 409), 'copan': (556, 10, 873, 409), 'predio': (873, 10, 1090, 409),
        'casa_tijolo': (1101, 155, 1302, 409), 'padaria': (1310, 137, 1580, 409),
        'casa_azul': (1589, 172, 1766, 409), 'muro_grafite': (14, 445, 249, 542),
        'muro_tijolo': (262, 440, 455, 541), 'janela_grade': (470, 449, 547, 529),
        'janela_flores': (562, 445, 634, 531), 'janela_veneziana': (650, 459, 725, 528),
        'sacada_plantas': (740, 439, 844, 541), 'sacada_roupas': (856, 439, 968, 541),
        'porta': (987, 450, 1039, 542), 'portao_aco': (1055, 447, 1143, 542),
        'janela_pequena': (1157, 460, 1222, 525), 'cobogo': (1237, 447, 1289, 531),
        'caixa_dagua': (1315, 454, 1372, 531), 'janelinha': (1695, 440, 1753, 542),
        'onibus': (20, 558, 541, 693), 'ponto_onibus': (912, 570, 1162, 687),
        'banca': (1175, 558, 1415, 693), 'feira': (1468, 559, 1747, 693),
        'carro': (563, 612, 753, 693), 'moto': (768, 607, 898, 692),
        'poste_luz': (903, 701, 970, 860), 'arvore': (1483, 704, 1609, 862),
        'semaforo': (983, 726, 1026, 860), 'placa_pedestre': (1048, 726, 1116, 861),
        'placa_rua': (1133, 742, 1208, 861), 'orelhao': (1682, 738, 1744, 861),
        'cone': (1228, 794, 1271, 861), 'lixeira': (1291, 785, 1329, 861),
        'banco': (1347, 791, 1484, 861), 'jardineira': (1587, 787, 1674, 862),
    }
    for nome, caixa in objetos.items():
        salvar('cenario', nome, recorte_uniao(img, rot, maiores_componentes(rot, caixa)[:1]))

    # Poste com fiação: preso à jardineira de parede pelo mesmo componente; recorta por retângulo.
    poste = img.crop((1409, 424, 1505, 693))
    salvar('cenario', 'poste', aparar(poste))

    # Texturas (recortes retangulares com recuo para esconder as bordas desenhadas).
    def textura(nome, caixa, recuo=3):
        x0, y0, x1, y1 = caixa
        salvar('texturas', nome, img.crop((x0 + recuo, y0 + recuo, x1 - recuo, y1 - recuo)))

    textura('pedra_onda', (21, 706, 97, 783))
    textura('pedra_onda2', (102, 706, 193, 783))
    textura('calcada', (509, 706, 582, 783))
    textura('calcada_tatil', (657, 706, 730, 783))
    textura('calcada_meiofio', (803, 706, 876, 783))
    textura('asfalto', (21, 789, 156, 878))
    textura('asfalto_faixa', (161, 789, 278, 878))
    textura('asfalto_amarela', (283, 789, 368, 878))
    textura('faixa_pedestre', (373, 789, 505, 878))
    textura('asfalto_rachado', (654, 789, 790, 878))


def main():
    os.makedirs(DESTINO, exist_ok=True)
    heroi()
    heroi_novo()
    ratos()
    retrato()
    cenario()
    grajau()
    marsilac()
    parelheiros()
    cidade_dutra()
    ratus_direitus()
    mapa()
    bnh_alagado()
    belmira()
    jetski()
    with open(os.path.join(DESTINO, 'manifesto.json'), 'w', encoding='utf-8') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=1)
    total = sum(len(v) for v in manifesto.values())
    print(f'{total} sprites gerados em {DESTINO}')


if __name__ == '__main__':
    main()
