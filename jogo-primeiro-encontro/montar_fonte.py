"""Monta src/jogo.html a partir do motor do jogo de partículas + as partes deste jogo (src/parts/).

O motor (áudio lo-fi, efeitos, trilha, resultado, controles) é compartilhado com
../jogo-particulas/src/jogo.html; aqui trocamos conteúdo, paleta ODU, cena 3D e tipos de exercício.
"""
import os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
old = open(os.path.join(AQUI, "..", "jogo-particulas", "src", "jogo.html"), encoding="utf-8").read()
parts = {n: open(os.path.join(AQUI, "src", "parts", n), encoding="utf-8").read() for n in ("dados.js", "cena3d.js", "licao.js")}

def between(s, a, b):
    i = s.index(a); j = s.index(b, i)
    return s[i:j]

def sec(title):  # seção JS do jogo antigo, do cabeçalho "title" até o próximo cabeçalho
    start = old.index("/* =====================================================================\n   " + title)
    nxt = old.find("/* =====================================================================", start + 10)
    return old[start:nxt]

# ---------------- CSS ----------------
css = between(old, "<style>", "</style>")[len("<style>"):]
root_old = between(css, ":root {", "\nhtml, body")
root_new = """:root {
  color-scheme: dark;
  --bg: #0b1435;
  --bg-2: #13204a;
  --surface: #1b2b5c;
  --line: #2c3f7c;
  --fg: #f4f5fa;
  --muted: #a6b1d8;
  --ok: #58cc02;
  --ok-deep: #3f9600;
  --ok-soft: #d7ffb8;
  --bad: #ff5a5f;
  --bad-deep: #c9373c;
  --bad-soft: #ffdfe0;
  --lantern: #ffc24b;
  --lantern-deep: #d18f00;
  --teal: #16989a;
  --teal-deep: #0e6e70;
  --coral: #ee7060;
  --ink: #15213d;

  /* cores da legenda do Método ODU Chunking (preenchimento / borda / texto) */
  --s-fill: #d9eaf7; --s-edge: #3979b9; --s-ink: #15213d;
  --v-fill: #e2f0d9; --v-edge: #5a9b4e; --v-ink: #15213d;
  --o-fill: #fff2cc; --o-edge: #b28b14; --o-ink: #15213d;
  --p-fill: #e4d5f3; --p-edge: #8151a7; --p-ink: #15213d;
  --d-fill: #fce4d6; --d-edge: #c96d3b; --d-ink: #15213d;

  --f-display: "Dela Gothic One", "M PLUS Rounded 1c", system-ui, sans-serif;
  --f-body: "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Yu Gothic", system-ui, sans-serif;
  --f-pixel: "DotGothic16", ui-monospace, monospace;

  --r: 16px;
  --step--1: 0.8125rem;
  --step-0: 1rem;
  --step-1: 1.25rem;
  --step-2: 1.6rem;
  --step-3: 2.2rem;
}
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }"""
css = css.replace(root_old, root_new)
css = css.replace("/* Layout: uma coluna estilo Duolingo (trilha em zigue-zague) num \"quarto de estudo lo-fi à noite\";\n   os blocos de frase usam as cores da legenda da aula (S/V/O/AUX/ADV). Visual único e escuro por escolha. */",
                  "/* Layout: uma coluna estilo Duolingo (trilha em zigue-zague) num \"café à noite\" com as cores da ODU Creative\n   (navy, teal, coral); os blocos usam a legenda do Método ODU Chunking (S/V/O/P/ADV). Visual escuro por escolha. */")
css = css.replace(".r-A { --fill: var(--a-fill); --edge: var(--a-edge); --ink-c: var(--a-ink); }",
                  ".r-P { --fill: var(--p-fill); --edge: var(--p-edge); --ink-c: var(--p-ink); }")
css = css.replace("""    radial-gradient(1200px 500px at 80% -10%, #3a2f6e 0%, transparent 60%),
    radial-gradient(800px 400px at -10% 30%, #2b2357 0%, transparent 60%),""",
"""    radial-gradient(1100px 500px at 85% -10%, rgba(22, 152, 154, .35) 0%, transparent 60%),
    radial-gradient(800px 420px at -10% 35%, rgba(238, 112, 96, .18) 0%, transparent 60%),""")
css = css.replace("""    radial-gradient(60px 60px at 82% 22%, #fff6d6 0 40%, #ffe9a8 41%, transparent 70%),
    linear-gradient(180deg, #2e2763 0%, #4a3a86 55%, #7a5aa8 100%);""",
"""    radial-gradient(70px 70px at 12% 80%, rgba(255, 194, 75, .35), transparent 70%),
    radial-gradient(90px 90px at 62% 18%, rgba(238, 112, 96, .35), transparent 70%),
    radial-gradient(60px 60px at 90% 70%, rgba(22, 152, 154, .55), transparent 70%),
    linear-gradient(180deg, #0f1d4f 0%, #173a6b 55%, #16676f 100%);""")
css = css.replace("radial-gradient(900px 400px at 50% -20%, #33296b 0%, transparent 70%),",
                  "radial-gradient(900px 400px at 50% -20%, rgba(22, 152, 154, .35) 0%, transparent 70%),")
css = css.replace("color: var(--ok-deep); padding: 6px 12px;", "color: var(--teal-deep); padding: 6px 12px;")
css = css.replace("border: 4px solid var(--ok); opacity: .55;", "border: 4px solid var(--teal); opacity: .6;")
css += """
/* ---------- extras do jogo de primeiro encontro ---------- */
.hero .eyebrow { display: block; margin-top: 10px; font-size: .7rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--coral); }
.hero h1 { margin-top: 4px; }
.stage-tag { align-self: flex-start; font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ink); background: var(--coral); padding: 4px 10px; border-radius: 999px; }
.say .num { display: block; margin-top: 6px; font-family: var(--f-pixel); font-size: var(--step-3); letter-spacing: .06em; color: var(--lantern); font-variant-numeric: tabular-nums; }
.bigword { align-self: center; min-width: 140px; text-align: center; padding: 18px 28px; border-radius: 20px; background: var(--o-fill); color: var(--ink); border: 2px solid var(--o-edge); border-bottom-width: 6px; font-family: var(--f-pixel); font-size: 3rem; line-height: 1.1; }
.bigword.jp { font-family: var(--f-body); font-weight: 800; font-size: var(--step-3); }
.dialog { display: flex; flex-direction: column; gap: 8px; }
.dialog .line { display: flex; align-items: flex-start; gap: 8px; max-width: 92%; }
.dialog .line b { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-size: .8rem; color: var(--ink); }
.dialog .line span { min-width: 0; padding: 8px 12px; border-radius: 14px; font-weight: 700; line-height: 1.4; }
.dialog .line.a b { background: var(--coral); }
.dialog .line.a span { background: var(--surface); border: 2px solid var(--line); }
.dialog .line.b { align-self: flex-end; flex-direction: row-reverse; }
.dialog .line.b b { background: var(--teal); color: #fff; }
.dialog .line.b span { background: #1d4f62; border: 2px solid var(--teal); }
.dialog .line.you span { border-style: dashed; color: var(--muted); min-width: 80px; }
.dialog .line.you span.filled { border-style: solid; color: var(--fg); }
.options.long { grid-template-columns: 1fr; }
.options.long .opt { font-size: var(--step-1); }
.opt.pt { font-size: var(--step-0); font-family: var(--f-body); }
.answer-pill { display: inline-block; padding: 6px 12px; border-radius: 12px; background: #fff; border: 2px solid var(--ok); font-weight: 800; color: var(--ink); }
.answer-pill.bad { border-color: var(--bad); }
.reply { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; padding: 8px 12px; border-radius: 12px; background: rgba(22, 152, 154, .14); border: 2px solid rgba(22, 152, 154, .4); }
.reply b { color: var(--teal-deep); }
.reply span { font-weight: 700; }
@media (max-width: 480px) {
  .hero canvas, .hero img.fallback { height: 330px; }
  .hero-copy { right: 16px; }
}
"""

# ---------------- HTML ----------------
html_head = old[:old.index("<style>")]
html_head = html_head.replace("<title>Partícula Quest</title>", "<title>Hajimemashite Quest</title>")
html_old = between(old, "<!--HEAD-END-->", "<script src=")
html_new = html_old
html_new = html_new.replace('<div class="brand"><b>Partícula Quest</b><span>に・を</span></div>', '<div class="brand"><b>Hajimemashite Quest</b><span>はじめまして</span></div>')
hero_old = between(html_new, '<section class="hero"', '<div class="music-cta"')
hero_new = """<section class="hero" aria-label="Apresentação">
      <canvas id="heroCanvas" aria-label="Daru e Tanaka-san em 3D se cumprimentando com uma reverência"></canvas>
      <div class="hero-copy">
        <span class="bubble">しつれいですが、おなまえは どちらですか。</span>
        <span class="eyebrow">ODU Creative · Japonês A1 · Unidade 8</span>
        <h1>Primeiro encontro em blocos coloridos</h1>
      </div>
      <div class="hero-foot">
        <div class="legend" aria-label="Legenda de cores do Método ODU Chunking">
          <span class="chip r-S">S · Sujeito</span>
          <span class="chip r-V">V · Verbo</span>
          <span class="chip r-O">O · Complemento</span>
          <span class="chip r-P">P · Partícula</span>
          <span class="chip r-D">ADV · Expressão</span>
        </div>
      </div>
    </section>

    """
html_new = html_new.replace(hero_old, hero_new)
html_new = html_new.replace('<span class="chip r-S">S</span><span class="chip r-V">V</span><span class="chip r-O">O</span><span class="chip r-A">AUX</span><span class="chip r-D">ADV</span>',
                            '<span class="chip r-S">S</span><span class="chip r-V">V</span><span class="chip r-O">O</span><span class="chip r-P">P</span><span class="chip r-D">ADV</span>')
assert "r-A" not in html_new and "r-A" not in css

# ---------------- JS ----------------
audio = sec("ÁUDIO")
audio = re.sub(r"  BPM: 74,\n  CHORDS: \[.*?\n  \],", """  BPM: 72,
  CHORDS: [ // Fmaj9 – Em7 – Dm9 – Cmaj9 (descida tranquila de café)
    { root: 41, notes: [57, 60, 64, 67] },
    { root: 40, notes: [55, 59, 62, 67] },
    { root: 38, notes: [53, 57, 60, 64] },
    { root: 36, notes: [52, 55, 59, 62, 67] }
  ],""", audio, flags=re.S)
assert "BPM: 72" in audio
stage_cls = re.search(r"class Stage \{.*?\n\}\n", sec("3D"), re.S).group(0)
fx = sec("EFEITOS 2D")
fx = fx.replace("EMOJI: ['✨', '⭐', '🎉', '🌸', '💥', '🔥', '🎊', '💯', '🏮', '🍡'],", "EMOJI: ['✨', '⭐', '🎉', '🤝', '🙇', '📇', '☎️', '💥', '🌸', '💯'],")
fx = fx.replace("WORDS: ['すごい！', 'せいかい！', 'やった！', 'いいね！', 'かんぺき！', 'さいこう！'],", "WORDS: ['すごい！', 'せいかい！', 'いいですね！', 'かんぺき！', 'よくできました！', 'はなまる！'],")
home = sec("TELA INICIAL")
result = sec("RESULTADO")
result = result.replace("const head = lv.boss ? 'Partículas dominadas!'", "const head = lv.boss ? 'Primeiro encontro dominado!'")
result = result.replace("'Você completou toda a trilha de に e を. おめでとう！'", "'Você fez o Final Challenge inteiro: はじめまして até よろしくおねがいします. おめでとう！'")
result = result.replace("Revise o guia da unidade e tente de novo", "Revise o guia do ponto e tente de novo")
assert "Primeiro encontro dominado" in result
controls = sec("CONTROLES DE SOM")
start = old[old.index("/* =====================================================================\n   INÍCIO"):old.index("</script>", old.index("   INÍCIO"))]

js = "(() => {\n'use strict';\n\n" + parts["dados.js"] + audio + parts["cena3d.js"].replace("__STAGE_CLASS__", stage_cls) + fx + home + parts["licao.js"] + result + controls + start + "</script>\n"
scripts = old[old.index('<script src='):old.index("<script>\n(() => {")]
out = html_head + "<style>" + css + "</style>\n<!--HEAD-END-->" + html_new + scripts + "<script>\n" + js
open(os.path.join(AQUI, "src", "jogo.html"), "w", encoding="utf-8").write(out)
print("src/jogo.html:", len(out), "bytes")
