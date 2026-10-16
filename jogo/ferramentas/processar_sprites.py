"""Recorta os sprites de assets/sprites em quadros prontos para o jogo.

Uso (a partir da raiz do repositório):
    pip install pillow numpy scipy
    python3 jogo/ferramentas/processar_sprites.py

Gera jogo/sprites/*.png e jogo/sprites/manifesto.json.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ORIGEM = os.path.join(RAIZ, 'assets', 'sprites')
DESTINO = os.path.join(RAIZ, 'jogo', 'sprites')

manifesto = {'heroi': {}, 'cenario': {}, 'texturas': {}, 'itens': {}}


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


def salvar(grupo, nome, img, **extra):
    caminho = os.path.join(DESTINO, f'{grupo}_{nome}.png')
    img.save(caminho, optimize=True)
    manifesto[grupo][nome] = {'arquivo': f'sprites/{grupo}_{nome}.png',
                              'w': img.width, 'h': img.height, **extra}


def escalar(img, fator):
    if fator == 1:
        return img
    return img.resize((max(1, round(img.width * fator)), max(1, round(img.height * fator))),
                      Image.LANCZOS if fator < 1 else Image.NEAREST)


def heroi():
    andar = Image.open(os.path.join(ORIGEM, 'personagem-andar-direita.png')).convert('RGBA')
    andar2 = Image.open(os.path.join(ORIGEM, 'personagem-andar-direita-2.png')).convert('RGBA')
    pular = Image.open(os.path.join(ORIGEM, 'personagem-pular-acenar.png')).convert('RGBA')
    pegar = Image.open(os.path.join(ORIGEM, 'personagem-pegar-garrafa-pedra.webp')).convert('RGBA')

    # Ciclo de caminhada: quadros 1-4 das duas folhas (o quadro 0 é a pose de frente).
    for i in range(4):
        salvar('heroi', f'andar{i}', aparar(andar.crop((96 * (i + 1), 0, 96 * (i + 2), 160))))
    for i in range(4):
        salvar('heroi', f'andarb{i}', aparar(andar2.crop((96 * (i + 1), 0, 96 * (i + 2), 160))))
    salvar('heroi', 'frente', aparar(andar.crop((0, 0, 96, 160))))

    # Folha de pulo: parado, impulso (soco), voadora, aterrissagem, aceno, frente.
    caixas = [(30, 0, 82), (106, 0, 224), (224, 0, 340), (345, 0, 440), (460, 0, 548), (565, 0, 672)]
    nomes = ['parado', 'impulso', 'voadora', 'aterrissar', 'acenar', 'frente_pose']
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
    retrato()
    cenario()
    with open(os.path.join(DESTINO, 'manifesto.json'), 'w', encoding='utf-8') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=1)
    total = sum(len(v) for v in manifesto.values())
    print(f'{total} sprites gerados em {DESTINO}')


if __name__ == '__main__':
    main()
