"""Recorta as artes de assets/ink em sprites prontos para o jogo INK.

Uso (a partir da raiz do repositório):
    pip install pillow numpy scipy
    python3 ink/ferramentas/processar_sprites.py

Gera ink/sprites/*.png e ink/sprites/manifesto.json. Os nomes seguem o motor do jogo:
heroi_* (INK), ratos_<tipo>_<pose> (inimigos), cenario_*, texturas_*, itens_* e retrato_*.
"""
import json
import os
import shutil

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ORIGEM = os.path.join(RAIZ, 'assets', 'ink')
DESTINO = os.path.join(RAIZ, 'ink', 'sprites')
manifesto = {'heroi': {}, 'cenario': {}, 'texturas': {}, 'itens': {}, 'ratos': {}, 'retrato': {}}


def abrir(nome):
    return Image.open(os.path.join(ORIGEM, nome)).convert('RGBA')


def aparar(img):
    caixa = img.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    return img.crop(caixa) if caixa else img


def escalar(img, fator):
    if abs(fator - 1) < 1e-3:
        return img
    return img.resize((max(1, round(img.width * fator)), max(1, round(img.height * fator))), Image.LANCZOS)


def ancora_x(img):
    """Centro horizontal da cabeça (topo do quadro), para o corpo não pular quando um membro estica."""
    alfa = np.array(img)[:, :, 3] > 60
    xs = np.where(alfa[: max(1, img.height * 18 // 100)])[1]
    return round(float(xs.mean() + 0.5) / img.width, 4) if len(xs) else 0.5


def salvar(grupo, nome, img, ancora=True):
    img.save(os.path.join(DESTINO, f'{grupo}_{nome}.png'), optimize=True)
    info = {'arquivo': f'sprites/{grupo}_{nome}.png', 'w': img.width, 'h': img.height}
    if ancora and grupo in ('heroi', 'ratos'):
        info['ax'] = ancora_x(img)
    manifesto[grupo][nome] = info


def quadros_da_linha(img, faixa, minimo=3000):
    """Personagens de uma faixa horizontal, da esquerda para a direita (pedaços pequenos juntam-se ao vizinho)."""
    y0, y1 = faixa
    recorte = img.crop((0, y0, img.width, y1))
    alfa = ndimage.binary_closing(np.array(recorte)[:, :, 3] > 40, iterations=3)
    rot, n = ndimage.label(alfa)
    areas = ndimage.sum(alfa, rot, range(1, n + 1))
    centros = ndimage.center_of_mass(alfa, rot, range(1, n + 1))
    caixas = ndimage.find_objects(rot)
    grandes = sorted([i for i in range(n) if areas[i] >= minimo], key=lambda i: centros[i][1])
    grupos = {i: [i + 1] for i in grandes}
    for i in range(n):
        if i in grupos or areas[i] < 30:
            continue
        cy, cx = centros[i]
        perto = [g for g in grandes if caixas[g][1].start - 25 <= cx <= caixas[g][1].stop + 25
                 and caixas[g][0].start - 25 <= cy <= caixas[g][0].stop + 25]
        if perto:
            dono = min(perto, key=lambda g: abs(centros[g][1] - cx))
            grupos[dono].append(i + 1)
    arr = np.array(recorte)
    saida = []
    for g in grandes:
        m = np.isin(rot, grupos[g])
        ys, xs = np.where(m)
        a = arr.copy()
        a[~m, 3] = 0
        saida.append(Image.fromarray(a).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
    return saida


def tirar_fundo(img, tolerancia=26):
    """Remove um fundo liso (preenchimento a partir das bordas, pela cor do canto)."""
    arr = np.array(img.convert('RGBA')).astype(int)
    cor = arr[3, 3, :3]
    parecido = (np.abs(arr[:, :, :3] - cor).max(axis=2) < tolerancia)
    rot, _ = ndimage.label(parecido)
    borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]]))) - {0}
    fundo = np.isin(rot, list(borda))
    alfa = np.where(fundo, 0, 255).astype(np.uint8)
    alfa = np.array(Image.fromarray(alfa).filter(ImageFilter.MinFilter(3)))  # tira o halo claro
    arr[:, :, 3] = alfa
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')


# ---------------------------------------------------------------------------
# INK (andar, correr, pular). Não há quadros de golpe na folha: os golpes usam as poses
# de corrida e salto, e o jogo desenha as garras de tinta por cima.
# ---------------------------------------------------------------------------
def ink():
    img = abrir('ink-movimentos.png')
    andar = quadros_da_linha(img, (0, 335))
    correr = quadros_da_linha(img, (335, 690))
    pular = quadros_da_linha(img, (690, 1024))
    assert len(andar) == len(correr) == len(pular) == 6, (len(andar), len(correr), len(pular))
    fator = 170 / andar[0].height
    A = [escalar(q, fator) for q in andar]
    C = [escalar(q, fator) for q in correr]
    P = [escalar(q, fator) for q in pular]
    for i, q in enumerate(A):
        salvar('heroi', f'passo{i}', q)
    for i, q in enumerate(C):
        salvar('heroi', f'corrida{i}', q)
    for i, q in enumerate(P):
        salvar('heroi', f'salto{i}', q)
    # nomes usados pelo motor de luta
    poses = {
        'soco0': A[2],  # guarda / parada
        'soco1': C[0], 'soco2': C[1],  # golpe 1: arranhão
        'soco3': C[3], 'soco4': C[4], 'soco5': C[5],  # golpe 2: estocada
        'chute1': P[1], 'chute2': P[2],  # golpe 3: joelhada em salto
        'chute3': P[4], 'chute4': P[4], 'chute5': P[5],  # golpe 4: bote com as garras
        'parado': A[2], 'impulso': C[3], 'aterrissar': P[5], 'acenar': P[3], 'frente_pose': A[0],
    }
    for nome, q in poses.items():
        salvar('heroi', nome, q)
    pega = [A[2], P[0], P[5], P[5], P[0], A[2]]
    for tipo in ('garrafa', 'pedra'):
        for i, q in enumerate(pega):
            salvar('heroi', f'pegar_{tipo}{i}', q)
    # retrato: cabeça do quadro de corrida, ampliada
    q = correr[2]
    cab = q.crop((int(q.width * 0.45), 0, int(q.width * 0.85), int(q.width * 0.40)))
    fundo = Image.new('RGBA', cab.size, (40, 34, 80, 255))
    fundo.alpha_composite(cab)
    salvar('heroi', 'retrato', fundo.resize((128, int(128 * cab.height / cab.width)), Image.LANCZOS), ancora=False)


# ---------------------------------------------------------------------------
# Inimigos da facção de Albus: 4 quadros cada (guarda, andar, preparar, golpe)
# ---------------------------------------------------------------------------
INIMIGOS = [('agente', (0, 335), 165), ('soldado', (335, 690), 185), ('cacador', (690, 1024), 172)]


def poses_inimigo(tipo, q, altura):
    fator = altura / q[0].height
    g, a, p, gol = (escalar(x, fator) for x in q)
    poses = {
        'parado0': g, 'parado1': g, 'preparar': p, 'atacar': gol, 'investida': gol,
        'segurar': p, 'arremessar': gol, 'dor': p,
    }
    for i in range(6):
        poses[f'andar{i}'] = a if i % 3 != 2 else g
    for nome, img in poses.items():
        salvar('ratos', f'{tipo}_{nome}', img)
    salvar('ratos', f'{tipo}_caido', p.rotate(90, expand=True), ancora=False)


def inimigos():
    img = abrir('inimigos-faccao-albus.png')
    linhas = {}
    for tipo, faixa, altura in INIMIGOS:
        q = quadros_da_linha(img, faixa)
        assert len(q) == 4, (tipo, len(q))
        linhas[tipo] = q
        poses_inimigo(tipo, q, altura)
    # Alpha (chefe final): o agente de lentes vermelhas, maior
    poses_inimigo('alpha', linhas['agente'], 190)

    # Unidade de controle de multidão (chefe da Viela): um único quadro, de frente
    robo = aparar(tirar_fundo(abrir('robo-controle-multidao.png')))
    r = escalar(robo, 270 / robo.height)
    for nome in ['parado0', 'parado1', 'preparar', 'atacar', 'investida', 'dor', 'segurar', 'arremessar'] + [f'andar{i}' for i in range(6)]:
        salvar('ratos', f'robo_{nome}', r)
    salvar('ratos', 'robo_caido', r.rotate(90, expand=True), ancora=False)


# ---------------------------------------------------------------------------
# NPCs e veículos voadores
# ---------------------------------------------------------------------------
def npcs():
    img = tirar_fundo(abrir('npcs-veiculos.png'), 18)
    veiculos = quadros_da_linha(img, (0, 335), minimo=8000)
    nomes_v = ['limusine', 'onibus_voador', 'caminhao', 'viatura']
    assert len(veiculos) == 4, len(veiculos)
    for n, v in zip(nomes_v, veiculos):
        salvar('cenario', n, escalar(v, 0.75))
    pessoas = quadros_da_linha(img, (345, 1024), minimo=8000)
    nomes_p = ['ambulante', 'operario', 'mecanica', 'senhora', 'executivo', 'policial']
    assert len(pessoas) == 6, len(pessoas)
    for n, p in zip(nomes_p, pessoas):
        # tira a sombra cinza-clara do papel embaixo dos pés
        arr = np.array(p).astype(int)
        h = arr.shape[0]
        rgb = arr[:, :, :3]
        claro = (rgb.min(axis=2) > 150) & (rgb.max(axis=2) - rgb.min(axis=2) < 30)
        claro[: int(h * 0.85)] = False
        arr[claro, 3] = 0
        p = aparar(Image.fromarray(arr.astype(np.uint8), 'RGBA'))
        salvar('cenario', 'npc_' + n, escalar(p, 160 / p.height))


# ---------------------------------------------------------------------------
# Cenários (três painéis) e retratos
# ---------------------------------------------------------------------------
def cenarios():
    img = Image.open(os.path.join(ORIGEM, 'nova-sao-paulo-cenarios.png')).convert('RGB')
    paineis = {'centro': (0, 632), 'muralha': (642, 1296), 'excidium': (1306, 1942)}
    for nome, (x0, x1) in paineis.items():
        p = img.crop((x0, 0, x1, img.height))
        salvar('cenario', 'painel_' + nome, p.convert('RGBA'))
        # faixa larga para o fundo em paralaxe (corta o céu de cima e o chão de baixo)
        faixa = p.crop((0, 120, p.width, 620))
        salvar('cenario', 'fundo_' + nome, faixa.convert('RGBA'))


def retratos():
    def grade(arquivo, prefixo, nomes, margem=0.02):
        img = Image.open(os.path.join(ORIGEM, arquivo)).convert('RGB')
        w, h = img.size
        for k, nome in enumerate(nomes):
            c, r = k % 3, k // 3
            x0, y0 = w * c / 3, h * r / 3
            cel = img.crop((int(x0 + w * margem), int(y0 + h * margem), int(x0 + w / 3 - w * margem), int(y0 + h / 3 - h * margem)))
            lado = min(cel.size)
            cel = cel.crop((0, 0, lado, lado)).resize((160, 160), Image.LANCZOS)
            salvar('retrato', f'{prefixo}_{nome}', cel.convert('RGBA'))

    grade('bill-expressoes.png', 'bill', ['serio', 'cansado', 'desconfiado', 'bravo', 'grito', 'susto', 'luto', 'sorriso', 'alerta'])
    grade('alpha-expressoes.png', 'alpha', ['frio', 'sarcastico', 'superior', 'bravo', 'furia', 'surpreso', 'pensativo', 'tramando', 'sorriso'])
    a = Image.open(os.path.join(ORIGEM, 'alpha-retrato.png')).convert('RGB')
    salvar('retrato', 'alpha_capa', a.crop((0, 0, 1024, 1024)).resize((512, 512), Image.LANCZOS).convert('RGBA'))
    b = Image.open(os.path.join(ORIGEM, 'bill-perfil.png')).convert('RGB')
    salvar('retrato', 'bill_capa', b.resize((588, 668), Image.LANCZOS).convert('RGBA'))


def itens_do_boulos():
    """Garrafa e pedra (armas do chão) vêm do jogo do Boulos."""
    for nome in ('garrafa', 'pedra'):
        src = os.path.join(RAIZ, 'jogo', 'sprites', f'itens_{nome}.png')
        shutil.copy(src, os.path.join(DESTINO, f'itens_{nome}.png'))
        im = Image.open(src)
        manifesto['itens'][nome] = {'arquivo': f'sprites/itens_{nome}.png', 'w': im.width, 'h': im.height}
    for nome in ('cone',):
        src = os.path.join(RAIZ, 'jogo', 'sprites', f'cenario_{nome}.png')
        shutil.copy(src, os.path.join(DESTINO, f'cenario_{nome}.png'))
        im = Image.open(src)
        manifesto['cenario'][nome] = {'arquivo': f'sprites/cenario_{nome}.png', 'w': im.width, 'h': im.height}
    for i in range(5):
        src = os.path.join(RAIZ, 'jogo', 'sprites', f'itens_fx_jet_splash{i}.png')
        shutil.copy(src, os.path.join(DESTINO, f'itens_fx_jet_splash{i}.png'))
        im = Image.open(src)
        manifesto['itens'][f'fx_jet_splash{i}'] = {'arquivo': f'sprites/itens_fx_jet_splash{i}.png', 'w': im.width, 'h': im.height}
    for i in range(6):
        src = os.path.join(RAIZ, 'jogo', 'sprites', f'itens_fx_jet_ripple{i}.png')
        shutil.copy(src, os.path.join(DESTINO, f'itens_fx_jet_ripple{i}.png'))
        im = Image.open(src)
        manifesto['itens'][f'fx_jet_ripple{i}'] = {'arquivo': f'sprites/itens_fx_jet_ripple{i}.png', 'w': im.width, 'h': im.height}


def main():
    os.makedirs(DESTINO, exist_ok=True)
    for f in os.listdir(DESTINO):
        os.remove(os.path.join(DESTINO, f))
    ink()
    inimigos()
    npcs()
    cenarios()
    retratos()
    itens_do_boulos()
    with open(os.path.join(DESTINO, 'manifesto.json'), 'w', encoding='utf-8') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=1)
    print(sum(len(v) for v in manifesto.values()), 'sprites gerados em', DESTINO)


if __name__ == '__main__':
    main()
