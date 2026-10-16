"""Monta o trailer "Boulos vs Ratus Nunes" (1920x1080, 30 fps) sincronizado com a trilha.

Uso: python3 editar.py PASTA_CENAS PASTA_ARTE trilha.wav linha.json saida.mp4 [inicio fim]
"""
import json
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CENAS, ARTE, TRILHA, LINHA, SAIDA = sys.argv[1:6]
T_INI = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0
T_FIM = float(sys.argv[7]) if len(sys.argv) > 7 else None
W, H, FPS = 1920, 1080, 30
L = json.load(open(LINHA))
BAR = L['bar']
BEAT = BAR / 4
D = L['drop']
TIT = L['titulo']
FIM = L['fim']
# Raiz do repositório: variável BOULOS_REPO ou, por padrão, três pastas acima deste arquivo.
REPO = os.environ.get('BOULOS_REPO', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
FONTE = os.path.join(REPO, 'assets', 'fontes', 'upheavtt.ttf')
rng = np.random.default_rng(7)


# ---------------------------------------------------------------------------
# Recursos
# ---------------------------------------------------------------------------
def carregar_clipe(nome):
    pasta = os.path.join(CENAS, nome)
    return sorted(os.path.join(pasta, f) for f in os.listdir(pasta))


CLIPES = {n: carregar_clipe(n) for n in os.listdir(CENAS)}
_cache = {}


def quadro_clipe(nome, i):
    lista = CLIPES[nome]
    i = max(0, min(len(lista) - 1, int(i)))
    chave = (nome, i)
    if chave not in _cache:
        if len(_cache) > 60:
            _cache.clear()
        _cache[chave] = np.asarray(Image.open(lista[i]).convert('RGB'), dtype=np.float32)
    return _cache[chave]


# Câmera virtual: segue o centro do movimento na faixa onde os personagens lutam.
_foco = {}


def foco_clipe(nome):
    if nome in _foco:
        return _foco[nome]
    lista = CLIPES[nome]
    xs = []
    ant = None
    for f in lista:
        a = np.asarray(Image.open(f).convert('L').resize((240, 135)), dtype=np.float32)
        if ant is None:
            xs.append(0.5)
        else:
            dif = np.abs(a - ant)[55:128]  # faixa do chão
            col = (dif > 18).sum(0).astype(float)
            # se a tela inteira mexe (rolagem da câmera do jogo), ignora
            xs.append(xs[-1] if col.sum() < 8 or (col > 0).mean() > 0.6 else float((col * np.arange(240)).sum() / col.sum() / 240))
        ant = a
    xs = np.array(xs)
    # suaviza (média móvel de ~1 s) para a câmera não tremer
    k = np.ones(31) / 31
    xs = np.convolve(np.pad(xs, 15, mode='edge'), k, mode='valid')
    _foco[nome] = xs
    return xs


def carregar_arte(nome):
    return Image.open(os.path.join(ARTE, nome)).convert('RGB')


CAPA = carregar_arte('capa.png')
RATO = carregar_arte('rato.png')
DIREITUS = Image.open(os.path.join(ARTE, 'direitus.png')).convert('RGBA')
BOULOS = carregar_arte('boulos.png')
LOGO = Image.open(os.path.join(ARTE, 'logo.png')).convert('RGB')
KATA = Image.open(os.path.join(ARTE, 'katakana.png')).convert('RGB')

# Fundo do título: capa ampliada, desfocada e escurecida.
_f = CAPA.resize((W, int(W * CAPA.height / CAPA.width)), Image.LANCZOS).crop((0, 350, W, 350 + H))
FUNDO_TITULO = np.asarray(_f.filter(ImageFilter.GaussianBlur(14)), dtype=np.float32) * 0.42


def mascara_borda(img, raio=40):
    """Alfa com bordas esfumadas para colar recortes da capa."""
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rectangle((raio, raio, img.width - raio, img.height - raio), fill=255)
    return m.filter(ImageFilter.GaussianBlur(raio / 2))


LOGO_A = mascara_borda(LOGO, 30)
KATA_A = mascara_borda(KATA, 22)


# ---------------------------------------------------------------------------
# Geometria e cor
# ---------------------------------------------------------------------------
def recorte_zoom(arr, cx, cy, zoom, dx=0.0, dy=0.0):
    """Amplia `arr` em torno de (cx, cy) normalizados, com deslocamento em px."""
    h, w = arr.shape[:2]
    cw, ch = w / zoom, h / zoom
    x0 = min(max(cx * w - cw / 2 + dx, 0), w - cw)
    y0 = min(max(cy * h - ch / 2 + dy, 0), h - ch)
    img = Image.fromarray(arr.astype(np.uint8))
    img = img.transform((W, H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BILINEAR)
    return np.asarray(img, dtype=np.float32)


def arte_kb(img, t, dur, z0, z1, cx0, cy0, cx1, cy1):
    """Ken Burns: aproxima e desliza dentro da arte, preenchendo 16:9."""
    k = min(max(t / dur, 0), 1)
    k = k * k * (3 - 2 * k)
    zoom = z0 + (z1 - z0) * k
    cx = cx0 + (cx1 - cx0) * k
    cy = cy0 + (cy1 - cy0) * k
    # recorte 16:9 que cabe na arte
    base_w = min(img.width, img.height * 16 / 9)
    cw = base_w / zoom
    ch = cw * 9 / 16
    x0 = min(max(cx * img.width - cw / 2, 0), img.width - cw)
    y0 = min(max(cy * img.height - ch / 2, 0), img.height - ch)
    out = img.transform((W, H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BICUBIC)
    return np.asarray(out, dtype=np.float32)


def graduar(arr, contraste=1.12, sat=1.18, tinta=(1, 1, 1), brilho=1.0):
    # saturação + contraste + tinta numa única transformação linear por canal (in-place)
    m = arr.mean(axis=2, keepdims=True, dtype=np.float32)
    out = arr * np.float32(sat * contraste)
    out += m * np.float32((1 - sat) * contraste)
    out += np.float32(128 * (1 - contraste))
    out *= np.array(tinta, dtype=np.float32) * np.float32(brilho)
    return out


GRAO = [np.random.default_rng(i).normal(0, 3, (H, W, 1)).astype(np.float32) for i in range(6)]
_yy, _xx = np.mgrid[0:H, 0:W]
VINHETA = (1 - 0.55 * (((_xx - W / 2) / (W / 2)) ** 2 + ((_yy - H / 2) / (H / 2)) ** 2) ** 1.4).clip(0.25, 1)[..., None].astype(np.float32)
del _yy, _xx


def aberracao(arr, px):
    if px < 1:
        return arr
    px = int(px)
    out = arr.copy()
    out[:, px:, 0] = arr[:, :-px, 0]
    out[:, :-px, 2] = arr[:, px:, 2]
    return out


def glitch(arr, forca, semente):
    r = np.random.default_rng(semente)
    out = arr.copy()
    for _ in range(int(6 * forca) + 2):
        y = r.integers(0, H - 40)
        hh = r.integers(8, 70)
        d = int(r.integers(-90, 90) * forca)
        out[y:y + hh] = np.roll(arr[y:y + hh], d, axis=1)
        if r.random() < 0.4:
            out[y:y + hh, :, r.integers(0, 3)] *= 1.6
    return out


# ---------------------------------------------------------------------------
# Tipografia
# ---------------------------------------------------------------------------
_fontes = {}


def fonte(tam):
    if tam not in _fontes:
        _fontes[tam] = ImageFont.truetype(FONTE, tam)
    return _fontes[tam]


_cache_txt = {}


def render_texto(texto, tam, cor, contorno=(20, 12, 40), sombra=(200, 30, 60), brilho=None, inclinar=0.0):
    """Texto com contorno, sombra colorida deslocada e brilho opcional. Retorna RGBA."""
    chave = (texto, tam, cor, contorno, sombra, brilho, inclinar)
    if chave in _cache_txt:
        return _cache_txt[chave]
    f = fonte(tam)
    bx = f.getbbox(texto)
    tw, th = bx[2] - bx[0], bx[3] - bx[1]
    pad = tam // 2
    img = Image.new('RGBA', (tw + 2 * pad, th + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    o = (pad - bx[0], pad - bx[1])
    e = max(2, tam // 14)
    if brilho:
        g = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(g).text(o, texto, font=f, fill=brilho + (255,), stroke_width=e * 2, stroke_fill=brilho + (255,))
        img = Image.alpha_composite(img, g.filter(ImageFilter.GaussianBlur(tam / 5)))
        d = ImageDraw.Draw(img)
    if sombra:
        so = max(3, tam // 12)
        d.text((o[0] + so, o[1] + so), texto, font=f, fill=sombra + (255,), stroke_width=e, stroke_fill=contorno + (255,))
    d.text(o, texto, font=f, fill=cor + (255,), stroke_width=e, stroke_fill=contorno + (255,))
    if inclinar:
        img = img.transform(img.size, Image.AFFINE, (1, inclinar, -inclinar * img.height / 2, 0, 1, 0), Image.BICUBIC)
    _cache_txt[chave] = img
    return img


def colar(base, rgba, cx, cy, escala=1.0, alfa=1.0, girar=0.0):
    if alfa <= 0.01 or escala <= 0.01:
        return base
    img = rgba
    if escala != 1.0:
        img = img.resize((max(1, int(img.width * escala)), max(1, int(img.height * escala))), Image.BICUBIC)
    if girar:
        img = img.rotate(girar, resample=Image.BICUBIC, expand=True)
    x0 = int(cx - img.width / 2)
    y0 = int(cy - img.height / 2)
    xa, ya = max(0, x0), max(0, y0)
    xb, yb = min(W, x0 + img.width), min(H, y0 + img.height)
    if xb <= xa or yb <= ya:
        return base
    sub = np.asarray(img, dtype=np.float32)[ya - y0:yb - y0, xa - x0:xb - x0]
    a = sub[..., 3:4] / 255 * alfa
    base[ya:yb, xa:xb] = base[ya:yb, xa:xb] * (1 - a) + sub[..., :3] * a
    return base


def colar_rgb(base, img, alfa_img, cx, cy, escala, alfa=1.0):
    im = img.resize((int(img.width * escala), int(img.height * escala)), Image.LANCZOS)
    a = alfa_img.resize(im.size, Image.LANCZOS)
    rgba = im.convert('RGBA')
    rgba.putalpha(a)
    return colar(base, rgba, cx, cy, 1.0, alfa)


def faixa_legenda(base, texto, t, dur, lado='esq', cor=(255, 214, 63), fundo=(230, 30, 110)):
    """Legenda moderna: barra inclinada entra deslizando e o texto acompanha."""
    entra = min(1, t / 0.18)
    sai = min(1, max(0, (dur - t) / 0.15))
    k = 1 - (1 - entra) ** 3
    txt = render_texto(texto, 74, cor, sombra=(30, 20, 60), inclinar=-0.18)
    larg = txt.width + 120
    y = 860
    if lado == 'esq':
        x1 = -larg + (larg + 40) * k
    else:
        x1 = W - 40 * k - (larg) * k + 0 * larg
    x0 = int(x1)
    barra = Image.new('RGBA', (larg + 60, 118), (0, 0, 0, 0))
    ImageDraw.Draw(barra).polygon([(30, 0), (larg + 60, 0), (larg + 30, 118), (0, 118)], fill=fundo + (235,))
    ImageDraw.Draw(barra).polygon([(30 + 10, 0), (30 + 26, 0), (26, 118), (10, 118)], fill=(40, 230, 255, 255))
    alfa = sai
    base = colar(base, barra, x0 + barra.width / 2, y, 1.0, alfa)
    base = colar(base, txt, x0 + 30 + larg / 2, y - 2, 1.0, alfa)
    return base


def palavra_impacto(base, texto, t, tam=210, cor=(255, 255, 255), sombra=(230, 30, 110), cy=H / 2, brilho=(40, 230, 255), dur=None):
    """Palavra que entra grande e assenta com um tranco (estilo trailer moderno)."""
    k = min(1, t / 0.12)
    escala = 1.0 + 0.6 * (1 - k) ** 2 + 0.02 * t
    alfa = min(1, t / 0.06)
    if dur is not None:
        alfa *= min(1, max(0, (dur - t) / 0.1))
    img = render_texto(texto, tam, cor, sombra=sombra, brilho=brilho)
    return colar(base, img, W / 2, cy, escala, alfa)


# ---------------------------------------------------------------------------
# Mapa da Zona Sul (como no jogo): bairro em vermelho, resto em preto e branco
# ---------------------------------------------------------------------------
_man = json.load(open(os.path.join(REPO, 'jogo', 'sprites', 'manifesto.json')))['ui']['mapa_cinza']
MAPA_C = _man['centros']
MAPA_BASE = Image.open(os.path.join(ARTE, 'ui_mapa_cinza.png')).convert('RGBA')
MAPA_REG = {n: Image.open(os.path.join(ARTE, f'ui_mapa_{n}.png')).convert('RGBA') for n in MAPA_C}
ONIBUS = Image.open(os.path.join(ARTE, 'ui_mapa_icone_onibus.png')).convert('RGBA')
PINO = Image.open(os.path.join(ARTE, 'ui_mapa_icone_pino.png')).convert('RGBA')
# As 7 fases do jogo: (bairro aceso no mapa, deslocamento do pino, nome na faixa)
ETAPAS = [('marsilac', (0, 0), 'FASE 1: MARSILAC'), ('parelheiros', (0, 0), 'FASE 2: PARELHEIROS'),
          ('grajau', (0, 0), 'FASE 3: GRAJAÚ BNH'), ('grajau', (55, -5), 'FASE 4: BNH ALAGADO'),
          ('grajau', (-70, -25), 'FASE 5: BELMIRA MARIN'), ('cidade_dutra', (0, 0), 'FASE 6: CIDADE DUTRA'),
          (None, (0, 0), 'FASE 7: AV. PAULISTA')]
_fundo_mapa = None


def render_mapa(etapa, etapa_ant, tt, dur):
    regiao, _, nome_fase = ETAPAS[etapa]
    global _fundo_mapa
    if _fundo_mapa is None:
        yy, xx = np.mgrid[0:H, 0:W]
        r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2)
        _fundo_mapa = (np.array([60, 40, 110], np.float32) * (1 - r[..., None] * 1.4).clip(0.15, 1)).astype(np.float32)
    base = _fundo_mapa.copy()
    escala = 1.42 * (1 + 0.04 * tt / dur)
    zoom_in = min(1, tt / 0.25)
    escala *= 1 + 0.5 * (1 - zoom_in) ** 2
    mw, mh = MAPA_BASE.width, MAPA_BASE.height
    cx, cy = W / 2, H / 2 - 40

    def tela(p):
        return cx + (p[0] - mw / 2) * escala, cy + (p[1] - mh / 2) * escala

    def pos(i):
        reg, (dx, dy), _ = ETAPAS[i]
        if reg is None:
            return (mw * 0.82, mh * 0.1)
        c = MAPA_C[reg]
        return (c[0] + dx, c[1] + 34 + dy)

    mapa = MAPA_BASE.copy()
    viagem = min(1, max(0, (tt - 0.15) / (dur * 0.5)))
    chegou = viagem >= 1
    if regiao and chegou:
        ta = tt - (0.15 + dur * 0.5)
        pisca = (ta < 0.3 and int(ta * 14) % 2 == 1)
        if not pisca:
            reg = MAPA_REG[regiao]
            glow = reg.filter(ImageFilter.GaussianBlur(8))
            mapa.alpha_composite(glow)
            mapa.alpha_composite(reg)
    img = mapa.resize((int(mw * escala), int(mh * escala)), Image.BILINEAR)
    base = colar(base, img, cx, cy, 1.0, 1.0)
    # ônibus
    p0 = pos(etapa_ant) if etapa_ant is not None else (pos(etapa)[0], mh + 30)
    p1 = pos(etapa)
    k = viagem * viagem * (3 - 2 * viagem)
    px, py = tela((p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k))
    bob = 0 if chegou else 3 * math.sin(tt * 40)
    base = colar(base, ONIBUS, px, py + bob, escala * 0.95, 1.0)
    if chegou:
        ta = tt - (0.15 + dur * 0.5)
        queda = min(1, ta / 0.18)
        base = colar(base, PINO, px, py - 70 * escala * 0.5 - 120 * (1 - queda), escala * 0.6, queda)
        if regiao is None:
            base = palavra_impacto(base, 'RUMO À PAULISTA', ta, tam=56, cor=(255, 60, 80), sombra=(40, 0, 10), brilho=None, cy=py + 90)
        # faixa com o nome da fase
        base = palavra_impacto(base, nome_fase, ta, tam=84, cor=(255, 255, 255), sombra=(200, 16, 46), brilho=(255, 40, 60), cy=H - 90)
    return base


# ---------------------------------------------------------------------------
# Roteiro
# ---------------------------------------------------------------------------
def b(n):
    """Tempo do compasso n do drop."""
    return D + n * BAR


# Montagem do drop: (início em compassos, duração em compassos, clipe, quadro inicial, velocidade, zoom, legenda)
MONTAGEM = [
    (0, 2, 'mapa:0:', 0, 1.0, 1.0, None),
    (2, 1, 'marsilac_luta', 10, 1.0, 1.22, ('MARSILAC', 'esq')),
    (3, 1, 'parelheiros_onibus', 14, 'onibus', 1.12, ('PARELHEIROS', 'esq')),
    (4, 1, 'mapa:2:1', 0, 1.0, 1.0, None),
    (5, 2, 'grajau_chuva', 10, 1.0, 1.22, ('GRAJAÚ BNH: O TEMPORAL CHEGOU', 'esq')),
    (7, 1, 'mapa:3:2', 0, 1.0, 1.0, None),
    (8, 2, 'jet_luta', 10, 1.0, 1.2, ('NOVO: FASE DE JET SKI NO BNH ALAGADO', 'esq')),
    (10, 1, 'jet_salto', 4, 'jetsalto', 1.15, ('PULE O ENTULHO, MERGULHE NOS RATOS', 'esq')),
    (11, 1, 'mapa:4:3', 0, 1.0, 1.0, None),
    (12, 2, 'belmira_pulo', 2, 1.0, 1.15, ('NOVO: ENGARRAFAMENTO NA BELMIRA MARIN', 'esq')),
    (14, 1, 'belmira_luta', 20, 1.0, 1.22, ('PULE DE ÔNIBUS EM ÔNIBUS', 'esq')),
    (15, 2, 'rapido1', 0, 1.0, 1.3, None),
    (17, 1, 'mapa:5:4', 0, 1.0, 1.0, None),
    (18, 1, 'dutra_luta', 20, 1.0, 1.25, ('CIDADE DUTRA', 'esq')),
    (19, 1, 'direitus', 30, 1.0, 1.3, ('RATUS DIREITUS EM TODA FASE', 'esq')),
    (20, 1, 'mapa:6:5', 0, 1.0, 1.0, None),
    (21, 2, 'chefe', 20, 1.0, 1.28, ('PAULISTA: ENFRENTE RATUS NUNES', 'esq')),
    (23, 1, 'especial', 14, 'especial', 1.15, ('FORÇA DO POVO', 'esq')),
    (24, 2, 'rapido2', 0, 1.0, 1.3, None),
    (26, 1, 'final', 0, 1.0, 1.0, None),
]

# Cortes rápidos (uma batida cada) com palavras de impacto a cada 2 batidas.
RAPIDO1 = [('jet_luta', 120), ('belmira_luta', 80), ('grajau_chuva', 60), ('jet_luta', 170),
           ('marsilac_luta', 90), ('belmira_luta', 140), ('dutra_luta', 130), ('grajau_chuva', 150)]
PALAVRAS1 = ['JAB', 'DIRETO', 'JOELHADA', 'CHUTE!']
RAPIDO2 = [('jet_luta', 200), ('belmira_pulo', 90), ('direitus', 60), ('jet_terra', 60),
           ('chefe', 230), ('belmira_luta', 160), ('chefe', 270), ('especial', 70)]
PALAVRAS2 = ['7 FASES', '1 JET SKI', '1 CHEFÃO', '0 PIEDADE']


def tempo_clipe(vel, t):
    """Converte tempo do segmento em quadro do clipe (com rampas de velocidade)."""
    if vel == 'onibus':
        # normal, câmera lenta no impacto da voadora e volta ao normal
        imp = 1.05
        if t < imp - 0.2:
            return t * 30
        if t < imp + 0.25:
            return (imp - 0.2) * 30 + (t - (imp - 0.2)) * 30 * 0.3
        return (imp - 0.2) * 30 + 0.45 * 30 * 0.3 + (t - imp - 0.25) * 30
    if vel == 'jetsalto':
        imp = 0.6
        if t < imp:
            return t * 30
        if t < imp + 0.5:
            return imp * 30 + (t - imp) * 30 * 0.35
        return imp * 30 + 0.5 * 30 * 0.35 + (t - imp - 0.5) * 30
    if vel == 'especial':
        imp = 0.55
        if t < imp:
            return t * 30
        if t < imp + 1.1:
            return imp * 30 + (t - imp) * 30 * 0.3
        return imp * 30 + 1.1 * 9 + (t - imp - 1.1) * 30
    return t * 30 * vel


def gameplay(nome, i, zoom, t_seg, pulso=0.0, dx=0, dy=0, tinta=(1, 1, 1), sat=1.18):
    arr = quadro_clipe(nome, i)
    fx = foco_clipe(nome)[int(max(0, min(len(CLIPES[nome]) - 1, i)))]
    z = zoom * (1 + 0.035 * t_seg / 2.7) * (1 + pulso)
    out = recorte_zoom(arr, fx, 0.66, z, dx, dy)
    return graduar(out, sat=sat, tinta=tinta)


def pulso_batida(t):
    """Pequeno 'soco' de zoom a cada batida durante o drop."""
    if t < D or t >= TIT - BAR:
        return 0.0
    fase = (t - D) % BEAT
    forte = 1.0 if int((t - D) / BEAT) % 2 == 0 else 0.5
    return 0.022 * forte * math.exp(-fase * 14)


def tremor(t, inicio, dur, forca):
    if inicio <= t < inicio + dur:
        k = 1 - (t - inicio) / dur
        r = np.random.default_rng(int(t * 1000))
        return r.uniform(-1, 1) * forca * k, r.uniform(-1, 1) * forca * k
    return 0.0, 0.0


def letterbox(t):
    """Altura das tarjas pretas de cinema: fechadas na abertura, abrem no drop, voltam no fim."""
    alto = 132
    if t < D - 0.3:
        return alto
    if t < D:
        return alto * (D - t) / 0.3
    if t < TIT - BAR:
        return 0
    if t < TIT:
        return alto * (t - (TIT - BAR)) / BAR
    return 0


def flash(t):
    """Clarões brancos nos cortes principais e trovões."""
    v = 0.0
    for tt, forca, decai in [(L['trovoes'][0], 0.6, 7), (L['trovoes'][1], 0.75, 6), (L['trovoes'][2], 0.7, 6),
                             (L['impactos'][0], 1.0, 7), (8.0, 0.9, 7), (L['impactos'][1], 1.0, 7), (D, 1.0, 5), (TIT, 1.0, 4)]:
        if t >= tt:
            v = max(v, forca * math.exp(-(t - tt) * decai))
    for n in range(1, 27):
        tt = b(n)
        if t >= tt:
            v = max(v, 0.35 * math.exp(-(t - tt) * 14))
    return v


def relampago(t):
    """Intensidade do relâmpago (para iluminar a abertura)."""
    v = 0.0
    for tt in L['trovoes']:
        if t >= tt:
            d = t - tt
            v = max(v, math.exp(-d * 5) + 0.6 * math.exp(-abs(d - 0.12) * 30))
    return min(v, 1.4)


# ---------------------------------------------------------------------------
# Quadro
# ---------------------------------------------------------------------------
def quadro(t):
    cut_px = 0.0  # aberração cromática
    glitch_f = 0.0
    sx, sy = 0.0, 0.0

    # ---------------- Abertura ----------------
    if t < L['impactos'][0]:
        if t < 1.5:
            # escuridão com relâmpagos revelando o Rato
            base = arte_kb(RATO, t, 1.5, 1.25, 1.35, 0.6, 0.35, 0.58, 0.36)
            base = graduar(base, sat=0.7, tinta=(0.7, 0.6, 1.25), brilho=0.05 + 0.85 * relampago(t))
        else:
            # a cidade tomada: gameplay noturno em câmera lenta, frio e escuro
            tt = t - 1.5
            base = gameplay('grajau_chuva', 40 + tt * 30 * 0.45, 1.35, tt, tinta=(0.7, 0.75, 1.1), sat=0.7)
            base *= 0.55 + 0.5 * relampago(t)
            if t > 4.1:
                over = arte_kb(RATO, t - 4.1, 1.9, 1.5, 1.7, 0.62, 0.33, 0.66, 0.30)
                over = graduar(over, sat=0.8, tinta=(0.8, 0.6, 1.2), brilho=0.25 + 0.9 * relampago(t))
                a = min(1, (t - 4.1) / 0.08)
                base = base * (1 - a) + over * a
        if 1.7 <= t < 4.0:
            base = palavra_impacto(base, 'SÃO PAULO.', t - 1.7, tam=150, cor=(240, 236, 255), sombra=(70, 40, 140), brilho=(120, 80, 255), cy=H / 2 - 60, dur=4.0 - 1.7)
            if t >= 2.6:
                base = palavra_impacto(base, 'A CIDADE FOI TOMADA', t - 2.6, tam=78, cor=(255, 214, 63), sombra=(150, 20, 60), brilho=None, cy=H / 2 + 80, dur=4.0 - 2.6)
        if 4.2 <= t < 6.0:
            base = palavra_impacto(base, 'PELA GANGUE DOS RATOS', t - 4.2, tam=96, cor=(255, 255, 255), sombra=(200, 20, 60), brilho=(255, 40, 80), cy=H - 250, dur=6.0 - 4.2)
        if t >= 4.1 and t < 4.35:
            glitch_f = 1.0
    elif 8.0 <= t < L['impactos'][1]:
        # O SUBCHEFE: Ratus Direitus
        tt = t - 8.0
        base = arte_kb(RATO, tt + 2, 4.0, 1.4, 1.5, 0.3, 0.6, 0.32, 0.6)
        base = graduar(base, sat=0.5, tinta=(0.9, 0.35, 0.45), brilho=0.45)
        k = min(1, tt / 0.15)
        esc = 4.3 * (1 + 0.35 * (1 - k) ** 2) * (1 + 0.02 * tt)
        dirA = DIREITUS.resize((int(DIREITUS.width * esc), int(DIREITUS.height * esc)), Image.NEAREST)
        base = colar(base, dirA, W / 2 + 300, H / 2 - 30, 1.0, min(1, tt / 0.06))
        sx, sy = tremor(t, 8.0, 0.4, 18)
        base = palavra_impacto(base, 'RATUS DIREITUS', tt, tam=150, cor=(255, 120, 190), sombra=(60, 10, 40), brilho=(255, 30, 120), cy=730, dur=2.0)
        if tt > 0.6:
            base = palavra_impacto(base, 'O BRAÇO DIREITO', tt - 0.6, tam=64, cor=(255, 214, 63), sombra=(40, 10, 30), brilho=None, cy=850, dur=1.4)
        cut_px = 10 * math.exp(-tt * 6)
        if tt < 0.2:
            glitch_f = 0.8
    elif t < L['impactos'][1]:
        # O VILÃO
        tt = t - L['impactos'][0]
        base = arte_kb(RATO, tt, 4.0, 1.05, 1.32, 0.55, 0.42, 0.66, 0.30)
        base = graduar(base, contraste=1.2, sat=1.25, tinta=(1.15, 0.85, 1.0))
        sx, sy = tremor(t, L['impactos'][0], 0.5, 22)
        if tt < 0.25 or 2.0 < tt < 2.15:
            glitch_f = 0.8
        kata = KATA.crop((540, 0, 1024, 230))
        kaA = mascara_borda(kata, 18)
        if tt > 0.4:
            base = colar_rgb(base, kata, kaA, W - 330, 170, 1.1 + 0.03 * tt, min(1, (tt - 0.4) / 0.2))
        base = palavra_impacto(base, 'RATUS NUNES', tt, tam=190, cor=(255, 90, 170), sombra=(60, 10, 40), brilho=(255, 30, 120), cy=770)
        if tt > 1.2:
            base = palavra_impacto(base, 'O REI DOS RATOS', tt - 1.2, tam=64, cor=(255, 214, 63), sombra=(40, 10, 30), brilho=None, cy=895)
        cut_px = 10 * math.exp(-tt * 6)
    elif t < 12.62:
        # O HERÓI
        tt = t - L['impactos'][1]
        base = arte_kb(BOULOS, tt, 2.62, 1.05, 1.28, 0.5, 0.45, 0.52, 0.33)
        base = graduar(base, contraste=1.15, sat=1.2, tinta=(1.08, 1.0, 0.92))
        sx, sy = tremor(t, L['impactos'][1], 0.45, 20)
        kata = KATA.crop((0, 0, 470, 230))
        kaA = mascara_borda(kata, 18)
        if tt > 0.3:
            base = colar_rgb(base, kata, kaA, 300, 170, 1.0 + 0.03 * tt, min(1, (tt - 0.3) / 0.2))
        base = palavra_impacto(base, 'MAS O POVO TEM UM LÍDER', tt, tam=74, cor=(255, 255, 255), sombra=(20, 120, 200), brilho=None, cy=640)
        if tt > 0.9:
            base = palavra_impacto(base, 'BOULOS', tt - 0.9, tam=230, cor=(255, 214, 63), sombra=(200, 30, 50), brilho=(255, 140, 20), cy=800)
        cut_px = 10 * math.exp(-tt * 6)
    elif t < D:
        # construção: cortes acelerando a cada semicolcheia do chimbal
        k = int((t - 12.65) / BEAT)
        ordem = [('marsilac_luta', 60), ('jet_luta', 30), ('belmira_luta', 80), ('grajau_chuva', 100),
                 ('chefe', 40), ('especial', 30), ('jet_salto', 20), ('chefe', 120)]
        if t < 12.65 or k >= len(ordem):
            base = np.zeros((H, W, 3), np.float32)
            if t >= 15.35:
                base = palavra_impacto(base, 'BORA!', t - 15.35, tam=260, cor=(255, 214, 63), sombra=(230, 30, 110), brilho=(255, 120, 0))
        else:
            nome, ini = ordem[k]
            tt = t - (12.65 + k * BEAT)
            base = gameplay(nome, ini + tt * 30, 1.45, tt, sat=1.25)
            base *= 0.9
            cut_px = 14 * math.exp(-tt * 18)
            if tt < 0.05:
                glitch_f = 0.6
            frase = ['PREPARE', 'OS', 'PUNHOS'][min(2, k // 3)]
            base = palavra_impacto(base, frase, (t - (12.65 + (k // 3) * 3 * BEAT)), tam=150, cor=(255, 255, 255), sombra=(230, 30, 110), brilho=(40, 230, 255))
    elif t < TIT:
        # ---------------- Drop: montagem ----------------
        n = (t - D) / BAR
        seg = next(s for s in MONTAGEM if s[0] <= n < s[0] + s[1])
        ini_bar, dur_bar, nome, q0, vel, zoom, leg = seg
        tt = t - b(ini_bar)
        dur = dur_bar * BAR
        pul = pulso_batida(t)
        if nome in ('rapido1', 'rapido2'):
            lista, palavras = (RAPIDO1, PALAVRAS1) if nome == 'rapido1' else (RAPIDO2, PALAVRAS2)
            k = min(7, int(tt / BEAT))
            ttk = tt - k * BEAT
            cn, cq = lista[k]
            base = gameplay(cn, cq + ttk * 30, zoom, ttk, pul, sat=1.3)
            cut_px = 14 * math.exp(-ttk * 16)
            if ttk < 0.04:
                glitch_f = 0.7
            w = palavras[k // 2]
            base = palavra_impacto(base, w, tt - (k // 2) * 2 * BEAT, tam=200, cor=(255, 214, 63) if k % 4 < 2 else (255, 255, 255),
                                   sombra=(230, 30, 110), brilho=(255, 120, 0) if k % 4 < 2 else (40, 230, 255), dur=2 * BEAT)
        elif nome.startswith('mapa:'):
            _, etapa, ant = nome.split(':')
            base = render_mapa(int(etapa), int(ant) if ant else None, tt, dur)
            cut_px = 8 * math.exp(-tt * 10)
            if tt < 0.05:
                glitch_f = 0.5
        elif nome == 'final':
            # um compasso: o Boulos aproxima rápido, a tela escurece até o título
            base = arte_kb(BOULOS, tt, BAR, 1.2, 1.9, 0.52, 0.32, 0.55, 0.28)
            base = graduar(base, contraste=1.25, sat=1.3, tinta=(1.1, 0.95, 0.9))
            base *= max(0.0, 1 - (tt / BAR) ** 3)
            cut_px = 6 + 18 * (tt / BAR)
            if tt > BAR - 0.25:
                glitch_f = 1.0
        else:
            i = q0 + tempo_clipe(vel, tt)
            sx2, sy2 = (0, 0)
            if nome == 'onibus' and 0.95 < tt < 1.4:
                sx2, sy2 = tremor(tt, 0.95, 0.35, 14)
            base = gameplay(nome, i, zoom, tt, pul, sx2, sy2, tinta=(1.0, 0.98, 1.05) if nome in ('chefe', 'especial') else (1, 1, 1))
            if nome == 'especial' and 0.55 < tt < 1.65:
                cut_px = 8
            cut_px = max(cut_px, 12 * math.exp(-tt * 14))
            if tt < 0.05:
                glitch_f = 0.5
            if leg:
                base = faixa_legenda(base, leg[0], tt - 0.15, dur - 0.15) if tt > 0.15 else base
        if seg[0] == 0 and tt < 0.6:
            sx, sy = tremor(t, D, 0.6, 26)
    else:
        # ---------------- Título ----------------
        tt = t - TIT
        base = FUNDO_TITULO.copy() * (0.85 + 0.15 * math.sin(tt * 2))
        # relâmpagos roxos ao fundo
        if (tt % 2.3) < 0.08:
            base = base * 1.6 + np.array([40, 10, 80], np.float32)
        k = min(1, tt / 0.18)
        escala = 1.22 * (1 + 0.5 * (1 - k) ** 2) * (1 + 0.012 * tt)
        base = colar_rgb(base, LOGO, LOGO_A, W / 2, 560, escala, min(1, tt / 0.08))
        if tt > 0.5:
            kk = min(1, (tt - 0.5) / 0.3)
            base = colar_rgb(base, KATA, KATA_A, W / 2, 150 - 80 * (1 - kk) ** 2, 1.05, kk)
        sx, sy = tremor(t, TIT, 0.7, 30)
        cut_px = 12 * math.exp(-tt * 4)
        if tt < 0.2:
            glitch_f = 1.0
        if tt > 1.0:
            base = palavra_impacto(base, 'NOVA ATUALIZAÇÃO: 7 FASES', tt - 1.0, tam=58, cor=(255, 214, 63), sombra=(200, 16, 46), brilho=None, cy=930)
        if tt > FIM - 3.4 - TIT:
            t2 = tt - (FIM - 3.4 - TIT)
            base = palavra_impacto(base, 'JOGUE AGORA NO NAVEGADOR', t2, tam=60, cor=(255, 255, 255), sombra=(230, 30, 110), brilho=None, cy=1010)
        base *= min(1, max(0, (FIM - t) / 0.6))

    # ---------------- Pós-produção ----------------
    if sx or sy:
        base = np.roll(base, (int(sy), int(sx)), axis=(0, 1))
    if glitch_f:
        base = glitch(base, glitch_f, int(t * 1000))
    base = aberracao(base, cut_px)
    base = base * VINHETA
    fl = flash(t)
    if fl > 0.01:
        base = base + (255 - base) * min(1, fl)
    # granulação de filme
    base += GRAO[int(t * FPS) % len(GRAO)]
    lb = int(letterbox(t))
    if lb:
        base[:lb] = 0
        base[H - lb:] = 0
    return np.clip(base, 0, 255).astype(np.uint8)


def main():
    fim = T_FIM if T_FIM is not None else FIM
    n0, n1 = int(round(T_INI * FPS)), int(round(fim * FPS))
    for nome in CLIPES:
        foco_clipe(nome)
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-']
    if TRILHA != '-':
        cmd += ['-ss', str(T_INI), '-t', str(fim - T_INI), '-i', TRILHA, '-c:a', 'aac', '-b:a', '256k', '-shortest']
    cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-tune', 'grain', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', SAIDA]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for n in range(n0, n1):
        proc.stdin.write(quadro(n / FPS).tobytes())
        if n % 150 == 0:
            print(f'{n / FPS:5.1f}s', flush=True)
    proc.stdin.close()
    proc.wait()


if __name__ == '__main__':
    main()
