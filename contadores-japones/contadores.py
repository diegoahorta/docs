#!/usr/bin/env python3
"""Kazoeyou! - parte Python do estudo de contadores japoneses.

Este arquivo faz quatro coisas, todas só com a biblioteca padrão:

  python3 contadores.py servir      abre o jogo no navegador e salva o progresso em progresso.json
  python3 contadores.py verificar   gera as leituras pelas regras de som e confere com a tabela
  python3 contadores.py quiz        um quiz rápido no terminal
  python3 contadores.py anki        exporta os 99 cartões para importar no Anki (CSV)
  python3 contadores.py audio       gera a voz japonesa embutida na página (audio/vozes.js)

As leituras não estão "decoradas" aqui: elas são calculadas pelas mesmas
regras fonéticas que o aluno aprende no módulo Estudar (pausa っ, ほ→ぽ/ぼ etc.).
"""

import argparse
import base64
import csv
import http.server
import json
import random
import sys
import threading
import webbrowser
from pathlib import Path

PASTA = Path(__file__).resolve().parent
ARQUIVO_PROGRESSO = PASTA / "progresso.json"

# ---------------------------------------------------------------------------
# Números
# ---------------------------------------------------------------------------

# Números sino-japoneses (vindos do chinês): usados com 個, 本, 台, 枚...
SINO = {1: "いち", 2: "に", 3: "さん", 4: "よん", 5: "ご",
        6: "ろく", 7: "なな", 8: "はち", 9: "きゅう", 10: "じゅう"}

# Forma "com pausa" (sokuon っ): a última sílaba some e vira uma consoante dobrada.
# O 10 é じゅっ na fala; じっ aparece em textos formais e dicionários.
SOKUON = {1: "いっ", 6: "ろっ", 8: "はっ", 10: "じゅっ"}

# Números nativos japoneses: usados só com 〜つ, de 1 a 10.
NATIVOS = {1: "ひとつ", 2: "ふたつ", 3: "みっつ", 4: "よっつ", 5: "いつつ",
           6: "むっつ", 7: "ななつ", 8: "やっつ", 9: "ここのつ", 10: "とお"}

KANJI_NUM = {1: "一", 2: "二", 3: "三", 4: "四", 5: "五",
             6: "六", 7: "七", 8: "八", 9: "九", 10: "十"}

# Dakuten (゛) e handakuten (゜) para a linha do H.
H_PARA_B = str.maketrans("はひふへほ", "ばびぶべぼ")
H_PARA_P = str.maketrans("はひふへほ", "ぱぴぷぺぽ")

# ---------------------------------------------------------------------------
# Contadores (na ordem da tabela da aula)
# ---------------------------------------------------------------------------

CONTADORES = {
    "tsu": {"sufixo": "つ", "kanji": "つ", "uso": "genérico, números nativos (até 10)",
            "objetos": [("プレゼント", "presente"), ("おにぎり", "onigiri"), ("かばん", "mochila")]},
    "nin": {"sufixo": "にん", "kanji": "人", "uso": "pessoas",
            "objetos": [("がくせい", "estudante"), ("こども", "criança"), ("ともだち", "amigo")]},
    "mai": {"sufixo": "まい", "kanji": "枚", "uso": "coisas finas e planas",
            "objetos": [("かみ", "papel"), ("おさら", "prato"), ("シャツ", "camisa")]},
    "dai": {"sufixo": "だい", "kanji": "台", "uso": "máquinas e veículos",
            "objetos": [("くるま", "carro"), ("パソコン", "computador"), ("テレビ", "televisão")]},
    "hon": {"sufixo": "ほん", "kanji": "本", "uso": "coisas longas e cilíndricas",
            "objetos": [("えんぴつ", "lápis"), ("ボトル", "garrafa"), ("かさ", "guarda-chuva")]},
    "hiki": {"sufixo": "ひき", "kanji": "匹", "uso": "animais pequenos",
             "objetos": [("ねこ", "gato"), ("さかな", "peixe"), ("いぬ", "cachorro")]},
    "hai": {"sufixo": "はい", "kanji": "杯", "uso": "copos, xícaras e tigelas cheias",
            "objetos": [("コーヒー", "café"), ("おちゃ", "chá"), ("ラーメン", "tigela de lámen")]},
    "ko": {"sufixo": "こ", "kanji": "個", "uso": "coisas pequenas e compactas",
           "objetos": [("りんご", "maçã"), ("たまご", "ovo"), ("みかん", "tangerina")]},
    "satsu": {"sufixo": "さつ", "kanji": "冊", "uso": "livros, cadernos e revistas",
              "objetos": [("ほん", "livro"), ("ノート", "caderno"), ("ざっし", "revista")]},
}

# 人 é irregular em 1, 2 e 4: usa os números nativos ひと-, ふた- e よ-.
NIN_IRREGULAR = {1: "ひとり", 2: "ふたり", 4: "よにん"}


def ler(n, contador):
    """Calcula a leitura de n (1..10, ou None para 'quantos?') com o contador."""
    if contador == "tsu":
        return "いくつ" if n is None else NATIVOS[n]
    if contador == "nin" and n in NIN_IRREGULAR:
        return NIN_IRREGULAR[n]

    sufixo = CONTADORES[contador]["sufixo"]
    linha_h = sufixo[0] in "はひふへほ"
    linha_k = sufixo[0] in "かきくけこ"
    linha_s = sufixo[0] in "さしすせそたちつてと"

    if n is None:
        # なん termina em ん: com a linha do H ganha dakuten (なんぼん, なんばい).
        return "なん" + (sufixo.translate(H_PARA_B) if linha_h else sufixo)

    # Regra da pausa: com K e H, 1, 6, 8 e 10 viram いっ/ろっ/はっ/じゅっ.
    # Com S e T o 6 fica inteiro (ろくさつ): só 1, 8 e 10 ganham pausa.
    if n in SOKUON and (linha_h or linha_k or (linha_s and n != 6)):
        # Com a linha do H a pausa ainda "endurece" ほ em ぽ.
        return SOKUON[n] + (sufixo.translate(H_PARA_P) if linha_h else sufixo)

    if n == 3 and linha_h:
        # Depois de さん (termina em ん) a linha do H ganha dakuten: さんぼん.
        return "さん" + sufixo.translate(H_PARA_B)

    return SINO[n] + sufixo


def kanji(n, contador):
    if contador == "tsu":
        return "幾つ" if n is None else ("十" if n == 10 else KANJI_NUM[n] + "つ")
    return ("何" if n is None else KANJI_NUM[n]) + CONTADORES[contador]["kanji"]


def variantes(n, contador):
    """Formas também aceitas: じっ no 10 (formal), はち sem pausa no 8, しち no 7."""
    certa, extras = ler(n, contador), []
    if n == 10 and certa.startswith("じゅっ"):
        extras.append("じっ" + certa[3:])
    if contador in ("ko", "hon") and n == 8:
        extras.append("はち" + CONTADORES[contador]["sufixo"])
    if contador == "nin" and n == 7:
        extras.append("しちにん")
    return extras


# A tabela do material de aula (a imagem enviada), coluna por coluna.
TABELA_AULA = {
    "tsu": "ひとつ ふたつ みっつ よっつ いつつ むっつ ななつ やっつ ここのつ とお いくつ",
    "nin": "ひとり ふたり さんにん よにん ごにん ろくにん ななにん はちにん きゅうにん じゅうにん なんにん",
    "mai": "いちまい にまい さんまい よんまい ごまい ろくまい ななまい はちまい きゅうまい じゅうまい なんまい",
    "dai": "いちだい にだい さんだい よんだい ごだい ろくだい ななだい はちだい きゅうだい じゅうだい なんだい",
    "hon": "いっぽん にほん さんぼん よんほん ごほん ろっぽん ななほん はっぽん きゅうほん じゅっぽん なんぼん",
    "hiki": "いっぴき にひき さんびき よんひき ごひき ろっぴき ななひき はっぴき きゅうひき じゅっぴき なんびき",
    "hai": "いっぱい にはい さんばい よんはい ごはい ろっぱい ななはい はっぱい きゅうはい じゅっぱい なんばい",
    "ko": "いっこ にこ さんこ よんこ ごこ ろっこ ななこ はっこ きゅうこ じゅっこ なんこ",
    "satsu": "いっさつ にさつ さんさつ よんさつ ごさつ ろくさつ ななさつ はっさつ きゅうさつ じゅっさつ なんさつ",
}
TABELA_AULA = {k: v.split() for k, v in TABELA_AULA.items()}

# ---------------------------------------------------------------------------
# Romaji (Hepburn simplificado) para mostrar no terminal e no Anki
# ---------------------------------------------------------------------------

_DIGRAFOS = {"きゅ": "kyu", "じゅ": "ju", "しゅ": "shu", "ちゅ": "chu"}
_KANA = dict(zip(
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"
    "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ",
    "a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho "
    "ma mi mu me mo ya yu yo ra ri ru re ro wa o n ga gi gu ge go za ji zu ze zo da ji zu de do "
    "ba bi bu be bo pa pi pu pe po".split()))


def romaji(kana):
    saida, i, dobrar = [], 0, False
    while i < len(kana):
        par = kana[i:i + 2]
        if kana[i] == "っ":
            dobrar, i = True, i + 1
            continue
        if par in _DIGRAFOS:
            silaba, i = _DIGRAFOS[par], i + 2
        else:
            silaba, i = _KANA.get(kana[i], kana[i]), i + 1
        if dobrar:
            silaba = ("t" if silaba.startswith("ch") else silaba[0]) + silaba
            dobrar = False
        saida.append(silaba)
    texto = "".join(saida)
    return texto.replace("ou", "ō").replace("oo", "ō").replace("uu", "ū")


# ---------------------------------------------------------------------------
# Comandos
# ---------------------------------------------------------------------------

def cmd_verificar(_args):
    erros = 0
    print("Conferindo as regras de som com a tabela da aula\n")
    for cid, coluna in TABELA_AULA.items():
        linha = []
        for i, esperado in enumerate(coluna):
            n = None if i == 10 else i + 1
            gerado = ler(n, cid)
            ok = gerado == esperado
            erros += not ok
            linha.append(gerado if ok else f"[{gerado}≠{esperado}]")
        print(f"  {CONTADORES[cid]['kanji']:<2} {' '.join(linha)}")

    print("\nResultado:", f"todas as {sum(map(len, TABELA_AULA.values()))} leituras conferem." if not erros else f"{erros} divergência(s).")
    return 1 if erros else 0


def _cartoes():
    for cid, info in CONTADORES.items():
        for n in list(range(1, 11)) + [None]:
            obj_jp, obj_pt = random.choice(info["objetos"])
            yield cid, n, obj_jp, obj_pt


def cmd_quiz(args):
    cartoes = list(_cartoes())
    random.shuffle(cartoes)
    acertos = 0
    print("Quiz de contadores! Responda com o número da opção. (Ctrl+C sai)\n")
    try:
        for rodada, (cid, n, obj_jp, obj_pt) in enumerate(cartoes[:args.rodadas], 1):
            certo = ler(n, cid)
            proibidas = {certo, *variantes(n, cid)}
            if cid in ("ko", "tsu"):  # つ e 個 valem para as mesmas coisas pequenas
                proibidas.add(ler(n, "tsu" if cid == "ko" else "ko"))
            pool = [ler(m, cid) for m in range(1, 11)] + [ler(n, c) for c in CONTADORES]
            if n:
                pool += [SINO[n] + CONTADORES[cid]["sufixo"]]  # erro clássico: sem mudança de som
            erradas = random.sample(sorted({p for p in pool if p not in proibidas}), 3)
            opcoes = erradas + [certo]
            random.shuffle(opcoes)
            qtd = "quantos?" if n is None else f"{n} ×"
            print(f"{rodada}. {qtd} {obj_jp} ({obj_pt})")
            for i, op in enumerate(opcoes, 1):
                print(f"   {i}) {op}  [{romaji(op)}]")
            resp = input("   > ").strip()
            if resp.isdigit() and 1 <= int(resp) <= 4 and opcoes[int(resp) - 1] == certo:
                acertos += 1
                print(f"   Certo! {certo} ({kanji(n, cid)})\n")
            else:
                print(f"   Quase. O certo é {certo} [{romaji(certo)}] ({kanji(n, cid)})\n")
    except (KeyboardInterrupt, EOFError):
        print()
    print(f"Você acertou {acertos} de {args.rodadas}.")
    return 0


def cmd_anki(args):
    destino = Path(args.saida)
    with destino.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        for cid, info in CONTADORES.items():
            for n in list(range(1, 11)) + [None]:
                obj_jp, obj_pt = info["objetos"][0] if n is None else info["objetos"][n % len(info["objetos"])]
                frente = f"Quantos? {obj_jp} ({obj_pt})" if n is None else f"{n} × {obj_jp} ({obj_pt})"
                leitura = ler(n, cid)
                verso = f"{leitura}<br>{kanji(n, cid)} · {romaji(leitura)}<br><small>{info['uso']}</small>"
                w.writerow([frente, verso, f"contador::{info['kanji']}"])
    print(f"{destino} criado com {len(CONTADORES) * 11} cartões (separador ';', 3ª coluna = tags).")
    return 0


# Falas extras usadas pela página (cut-ins de anime e frases de exemplo).
FALAS_EXTRAS = ["かぞえよう", "すごい", "やった", "かんぺき", "しんきろく", "おつかれ", "はい、どうぞ"]


def _katakana(texto):
    return "".join(chr(ord(ch) + 96) if "ぁ" <= ch <= "ゖ" else ch for ch in texto)


def frases_para_audio():
    """Tudo o que a página fala, como (chave, formas de escrever para o sintetizador, pronúncia esperada).

    O sintetizador às vezes erra kana solto (lê はちまい como "wachimai", corta o つ de さつ),
    então cada fala tem alternativas: kanji, katakana e hiragana. A pronúncia esperada usa わ
    para a partícula は, como ela soa.
    """
    itens = [(t, [t, _katakana(t)], t) for t in FALAS_EXTRAS]
    for cid, info in CONTADORES.items():
        verbo = "いますか" if cid in ("nin", "hiki") else "ありますか"
        for n in list(range(1, 11)) + [None]:
            leitura = ler(n, cid)
            itens.append((leitura, [kanji(n, cid), _katakana(leitura), leitura], leitura))
            for v in (variantes(n, cid) if n else []):
                itens.append((v, [_katakana(v), v], v))
        for obj, _ in info["objetos"]:
            l3, lq = ler(3, cid), ler(None, cid)
            itens += [
                (obj + "を", [obj + "を"], obj + "を"),
                (obj + "が", [obj + "が"], obj + "が"),
                (f"{obj}を{l3}ください。", [f"{obj}を{kanji(3, cid)}ください。", f"{obj}を{_katakana(l3)}ください。"], f"{obj}を{l3}ください"),
                (f"{obj}は{lq}{verbo}。", [f"{obj}は{kanji(None, cid)}{verbo}。", f"{obj}は{_katakana(lq)}{verbo}。"], f"{obj}わ{lq}{verbo}"),
            ]
    vistos = set()
    return [i for i in itens if not (i[0] in vistos or vistos.add(i[0]))]


def _som(kana):
    """Pronúncia comparável: romaji com vogais longas juntas, sem pontuação."""
    hira = "".join(chr(ord(ch) - 96) if "ァ" <= ch <= "ヶ" else ch for ch in kana)
    r = romaji(hira.replace("、", "").replace("。", ""))
    while "ー" in r:
        i = r.index("ー")
        r = r[:i] + (r[i - 1] if i else "") + r[i + 1:]
    return romaji_normal(r)


def romaji_normal(r):
    return r.replace("ou", "ō").replace("oo", "ō").replace("uu", "ū").replace("ōō", "ō")


def cmd_audio(args):
    try:
        import lameenc
        import numpy as np
        import pyopenjtalk
    except ImportError:
        print("Para gerar a voz, instale antes:\n  pip install pyopenjtalk-plus lameenc numpy")
        return 1
    clipes, total, falhas = {}, 0, []
    for chave, entradas, esperado in frases_para_audio():
        alvo = _som(esperado)
        entrada = next((e for e in entradas if _som(pyopenjtalk.g2p(e, kana=True)) == alvo), None)
        if entrada is None:
            falhas.append((chave, pyopenjtalk.g2p(entradas[0], kana=True)))
            entrada = entradas[0]
        x, taxa = pyopenjtalk.tts(entrada, speed=args.velocidade)
        # Corta o silêncio do começo e do fim, para as partes emendarem sem buraco.
        forte = np.flatnonzero(np.abs(x) > np.abs(x).max() * 0.02)
        folga = int(taxa * 0.03)
        x = x[max(0, forte[0] - folga):forte[-1] + folga]
        # 48 kHz -> 24 kHz com um filtro passa-baixa simples, e volume normalizado.
        x = np.convolve(x, [0.25, 0.5, 0.25], mode="same")[::2]
        x = (x / np.abs(x).max() * 0.85 * 32767).astype("<i2")
        enc = lameenc.Encoder()
        enc.set_bit_rate(40)
        enc.set_in_sample_rate(taxa // 2)
        enc.set_channels(1)
        enc.set_quality(2)
        mp3 = enc.encode(x.tobytes()) + enc.flush()
        clipes[chave] = base64.b64encode(mp3).decode("ascii")
        total += len(mp3)
    destino = PASTA / "audio" / "vozes.js"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(
        "/* Gerado por `python3 contadores.py audio` — não edite à mão.\n"
        "   Voz: HTS Voice \"Mei\" (c) Nagoya Institute of Technology, CC BY 3.0, sintetizada com Open JTalk. */\n"
        "window.VOZES = " + json.dumps(clipes, ensure_ascii=False, indent=0) + ";\n", "utf-8")
    print(f"{destino.relative_to(PASTA)}: {len(clipes)} falas, {total / 1024:.0f} KB de MP3.")
    for chave, ouvido in falhas:
        print(f"  atenção: {chave} sai como {ouvido}")
    return 1 if falhas else 0


class _Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(PASTA), **kw)

    def _json(self, codigo, dados):
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/progresso":
            dados = json.loads(ARQUIVO_PROGRESSO.read_text("utf-8")) if ARQUIVO_PROGRESSO.exists() else {}
            return self._json(200, dados)
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/progresso":
            return self._json(404, {"erro": "rota desconhecida"})
        tamanho = int(self.headers.get("Content-Length", 0))
        if tamanho > 1_000_000:
            return self._json(413, {"erro": "progresso grande demais"})
        try:
            dados = json.loads(self.rfile.read(tamanho) or b"{}")
        except json.JSONDecodeError:
            return self._json(400, {"erro": "JSON inválido"})
        ARQUIVO_PROGRESSO.write_text(json.dumps(dados, ensure_ascii=False, indent=1), "utf-8")
        return self._json(200, {"ok": True})

    def log_message(self, fmt, *a):
        if "/api/" not in (a[0] if a else ""):
            super().log_message(fmt, *a)


def cmd_servir(args):
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", args.porta), _Handler)
    url = f"http://127.0.0.1:{args.porta}/index.html"
    print(f"Servindo {PASTA} em {url}\nProgresso salvo em {ARQUIVO_PROGRESSO.name}. Ctrl+C para parar.")
    if not args.sem_navegador:
        threading.Timer(0.6, webbrowser.open, [url]).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nAté a próxima! またね！")
    return 0


def main():
    p = argparse.ArgumentParser(description="Contadores japoneses: servidor, verificador, quiz e exportação.")
    sub = p.add_subparsers(dest="comando", required=True)
    s = sub.add_parser("servir", help="abre o jogo e salva o progresso em progresso.json")
    s.add_argument("--porta", type=int, default=8000)
    s.add_argument("--sem-navegador", action="store_true")
    s.set_defaults(func=cmd_servir)
    sub.add_parser("verificar", help="confere as regras de som").set_defaults(func=cmd_verificar)
    q = sub.add_parser("quiz", help="quiz no terminal")
    q.add_argument("--rodadas", type=int, default=10)
    q.set_defaults(func=cmd_quiz)
    a = sub.add_parser("anki", help="exporta cartões em CSV")
    a.add_argument("--saida", default="contadores_anki.csv")
    a.set_defaults(func=cmd_anki)
    v = sub.add_parser("audio", help="gera audio/vozes.js (precisa de pyopenjtalk-plus e lameenc)")
    v.add_argument("--velocidade", type=float, default=0.9)
    v.set_defaults(func=cmd_audio)
    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
