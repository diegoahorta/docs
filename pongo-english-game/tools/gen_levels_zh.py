"""Gera js/levels-zh.js (Pongo aprende 中文) a partir do manual
odu-mandarim/content.json (Mandarim Básico I — Método Chunk).

As frases de exemplo do manual já estão divididas em chunks com função
(S, ADV, V, O, PART); aqui elas viram os blocos coloridos do jogo.
As 25 lições do manual são agrupadas nas 7 paradas do jardim."""
import json, os, random

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
L = {l["n"]: l for l in json.load(open(os.path.join(ROOT, "..", "odu-mandarim", "content.json"), encoding="utf-8"))}
rnd = random.Random(25)
ROLE = ["s", "e", "v", "c", "t"]  # S, ADV, V, O, PART -> cores do jogo


def row(n, p, e):
    f = L[n]["pts"][p]["ex"][e].split("|")
    chunks = [[f[i], ROLE[i]] for i in range(5) if f[i] != "—"]
    return chunks, f[5], f[6]


def extras(n, p, e, k=2):
    """Distratores: chunks de outras frases do mesmo ponto que não estão na resposta."""
    ans = {c[0] for c in row(n, p, e)[0]}
    pool = []
    for j in range(4):
        if j == e:
            continue
        for c in row(n, p, j)[0]:
            if c[0] not in ans and c not in pool:
                pool.append(c)
    rnd.shuffle(pool)
    return pool[:k]


def build(n, p, e, extra=None):
    chunks, py, pt = row(n, p, e)
    pnt = L[n]["pts"][p]
    return dict(type="build", joined=True, kind=f"Lição {n} · {pnt['title']}", pt=pt,
                blocks=chunks, extra=extra if extra is not None else extras(n, p, e),
                tip=f"{py} — {pnt['forma']}")


def listen(n, p, e):
    chunks, py, pt = row(n, p, e)
    pnt = L[n]["pts"][p]
    say = "".join(c[0] for c in chunks)
    return dict(type="listen", joined=True, kind=f"Lição {n} · Ouça e monte", say=say, sayHint=py,
                prompt=f"({pt})", blocks=chunks, extra=extras(n, p, e), tip=f"{py} — {pt}")


def correct(n, p):
    """Qual frase está certa? (usa o par ✗/✓ do manual)"""
    pnt = L[n]["pts"][p]
    opts = [pnt["right"], pnt["wrong"].split("（")[0]]
    rnd.shuffle(opts)
    return dict(type="choice", kind=f"Lição {n} · Erro comum", title="Qual frase está certa?", pic="🔎",
                prompt=pnt["title"], options=opts, answer=opts.index(pnt["right"]), tip=pnt["erro"])


def choice(prompt, options, answer, tip, pic="💡", say=None, sayHint=None):
    d = dict(type="choice", pic=pic, prompt=prompt, options=options, answer=answer, tip=tip)
    if say:
        d.update(say=say, sayHint=sayHint, title="Ouça e escolha")
    return d


def match(pairs, prompt="Toque nos pares correspondentes"):
    return dict(type="match", prompt=prompt, pairs=pairs)


UNITS = [
    dict(id=1, node="LVL_1", place="Portão", color="#2f86c9", title="你好！· Olá!", topic="Lições 1–3 · 是, 吗, 也, 的, 在哪儿, 多少钱",
         intro=dict(en="汪汪！你好！我是庞戈！", pt="wāngwāng! nǐ hǎo! wǒ shì Páng Gē · Au-au! Olá! Eu sou o Pongo. Vamos aprender a nos apresentar!"),
         ex=[match([["你好", "Olá"], ["谢谢", "Obrigado(a)"], ["老师", "professor(a)"], ["学生", "estudante"], ["朋友", "amigo(a)"]]),
             choice("Como se fala 你好 de verdade?", ["nǐ hǎo (os dois no 3º tom)", "ní hǎo", "nì hāo"], 1,
                    "Dois 3º tons seguidos: o primeiro vira 2º tom. Escreve-se nǐ hǎo, fala-se ní hǎo.", pic="🗣️"),
             build(1, 0, 0), build(1, 1, 0), correct(1, 2), build(2, 1, 0),
             listen(2, 2, 0), build(3, 1, 0), correct(3, 2)]),
    dict(id=2, node="LVL_2", place="Canteiro de flores", color="#d23a4f", title="很好！· Adjetivos e rotina", topic="Lições 4–6 · 很, 不, 了, 没, 去, 坐",
         intro=dict(en="今天很热！", pt="jīntiān hěn rè · Hoje está quente! Vamos descrever coisas e falar da rotina."),
         ex=[match([["便宜", "barato"], ["贵", "caro"], ["冷", "frio"], ["热", "quente"], ["忙", "ocupado"]]),
             build(4, 0, 0), correct(4, 0), build(4, 1, 1),
             choice("不 + 是 se pronuncia…", ["bù shì", "bǔ shì", "bú shì"], 2,
                    "不 vira bú antes de 4º tom: 不是 bú shì, 不贵 bú guì.", pic="🎵", say="不是", sayHint="bú shì"),
             build(5, 0, 0), correct(5, 2), listen(6, 2, 0), build(6, 0, 1)]),
    dict(id=3, node="LVL_3", place="Lago", color="#1cb0f6", title="我喜欢中国菜 · Gostos", topic="Lições 7–9 · 用, 给, 已经, classificadores, 喜欢, 会",
         intro=dict(en="我喜欢吃饺子！", pt="wǒ xǐhuan chī jiǎozi · Eu gosto de comer jiaozi! Hoje: gostos, posses e habilidades."),
         ex=[match([["书", "livro"], ["咖啡", "café"], ["筷子", "hashi"], ["喜欢", "gostar"], ["会", "saber fazer"]]),
             build(7, 0, 0), build(7, 2, 0), correct(8, 0),
             choice("Qual classificador vai com 书 (livro)?", ["杯", "本", "张"], 1,
                    "本 é o classificador de livros e cadernos: 一本书.", pic="📚"),
             build(8, 2, 1), build(9, 1, 0), listen(9, 0, 1), correct(9, 1)]),
    dict(id=4, node="LVL_4", place="Árvore grande", color="#ff9600", title="桌子上有一本书 · Lugares e números", topic="Lições 10–12 · 有, 在, 两, 几, 次, 比",
         intro=dict(en="树上有一只鸟！", pt="shù shang yǒu yì zhī niǎo · Há um pássaro na árvore! Hoje: onde estão as coisas e comparações."),
         ex=[match([["上", "em cima"], ["里", "dentro"], ["旁边", "ao lado"], ["前面", "em frente"], ["后面", "atrás"]]),
             build(10, 0, 0), correct(10, 2), build(10, 1, 0),
             choice("Para \"duas irmãs\", qual está certo?", ["二个妹妹", "两妹妹", "两个妹妹"], 2,
                    "Antes de classificador, \"dois\" é 两; e o classificador 个 é obrigatório.", pic="👭"),
             build(11, 2, 0), listen(12, 1, 0), correct(12, 1), build(12, 2, 3)]),
    dict(id=5, node="LVL_5", place="Casinha do Pongo", color="#8e44ad", title="请等一下！· Pedidos", topic="Lições 13–16 · 想, 要, 请, 在…呢, 可以, 一边",
         intro=dict(en="请坐！请喝茶！", pt="qǐng zuò! qǐng hē chá! · Sente-se! Tome um chá! Hoje: pedidos, permissões e o que está acontecendo agora."),
         ex=[match([["请", "por favor"], ["等", "esperar"], ["坐", "sentar"], ["拍照", "tirar foto"], ["吃饭", "comer"]]),
             build(13, 0, 0), correct(13, 1), build(14, 2, 1),
             choice("O Pongo está dormindo. Qual frase diz isso?", ["庞戈睡觉在。", "庞戈在睡觉。", "庞戈睡觉了在。"], 1,
                    "在 + verbo = ação em andamento; 在 vem antes do verbo.", pic="😴", say="庞戈在睡觉", sayHint="Páng Gē zài shuìjiào"),
             build(15, 0, 0), correct(15, 1), listen(16, 2, 0), build(16, 1, 0)]),
    dict(id=6, node="LVL_6", place="Horta de frutinhas", color="#6a2bd9", title="我吃过北京烤鸭 · Experiências", topic="Lições 17–20 · 别, 应该, 不用, 能, 过, 了, 是…的, 得",
         intro=dict(en="你吃过草莓吗？", pt="nǐ chīguo cǎoméi ma? · Você já comeu morango? Hoje: conselhos, experiências e como fazemos as coisas."),
         ex=[match([["别", "não (faça)!"], ["应该", "deveria"], ["不用", "não precisa"], ["感冒", "resfriado"], ["累", "cansado"]]),
             build(17, 0, 0), correct(17, 2), build(18, 0, 1), build(19, 0, 0),
             correct(19, 0), listen(19, 2, 1), build(20, 1, 0), correct(20, 2)]),
    dict(id=7, node="LVL_7", place="Porta da frente", color="#36912a", title="我到家了！· Revisão", topic="Lições 21–25 · 觉得, 吧, 的, 的时候, 把, 如果…就",
         intro=dict(en="我们回家吧！加油！", pt="wǒmen huí jiā ba! jiāyóu! · Vamos para casa! Força! Revisão final do manual."),
         ex=[match([["觉得", "achar"], ["如果", "se"], ["虽然", "embora"], ["但是", "mas"], ["时候", "momento / quando"]]),
             build(21, 0, 0), correct(21, 2), build(22, 0, 0), build(23, 1, 0),
             build(24, 1, 0), listen(25, 0, 0), correct(25, 1), build(25, 2, 1)]),
]
for u in UNITS:
    u["exercises"] = u.pop("ex")

out = os.path.join(ROOT, "js", "levels-zh.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("/* Pongo aprende 中文 - Mandarin content pack.\n"
            " * GERADO por tools/gen_levels_zh.py a partir de odu-mandarim/content.json\n"
            " * (manual Mandarim Básico I — Método Chunk). Edite o gerador, não este arquivo.\n"
            " * Cores dos blocos = cores do manual: S azul, ADV laranja, V verde, O amarelo, PART lilás. */\n")
    f.write("(function () {\n  'use strict';\n")
    f.write("  const UNITS = " + json.dumps(UNITS, ensure_ascii=False, indent=1) + ";\n")
    f.write(open(os.path.join(HERE, "levels-zh.pack.js"), encoding="utf-8").read())
    f.write("})();\n")
print("levels-zh.js:", sum(len(u["exercises"]) for u in UNITS), "desafios")
