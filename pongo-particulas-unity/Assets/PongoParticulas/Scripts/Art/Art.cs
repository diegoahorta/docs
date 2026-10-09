using System.Collections.Generic;
using UnityEngine;

namespace PongoParticulas
{
    /// <summary>
    /// Todos os sprites do jogo, desenhados por código em pixel art (16 px = 1 unidade).
    /// Só o Pongo vem de imagem (Resources/pongo.png). Para trocar a arte por sprites
    /// próprios, basta substituir os métodos daqui.
    /// </summary>
    public static class Art
    {
        public const int PPU = 16;
        static readonly Dictionary<string, Sprite> cache = new Dictionary<string, Sprite>();

        static Sprite Cached(string key, System.Func<Sprite> make)
        {
            Sprite s;
            if (cache.TryGetValue(key, out s) && s != null) return s;
            s = make();
            cache[key] = s;
            return s;
        }

        static Color32 H(string hex) { return PixelCanvas.Hex(hex); }
        static Color32 Sh(Color32 c, float k) { return PixelCanvas.Shade(c, k); }

        // =====================================================================
        // PONGO
        // =====================================================================
        public static Sprite Pongo(float heightUnits)
        {
            return Cached("pongo" + heightUnits, () =>
            {
                var tex = Resources.Load<Texture2D>("pongo");
                if (tex != null)
                {
                    tex.filterMode = FilterMode.Bilinear;
                    return Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0f), tex.height / heightUnits);
                }
                // Reserva caso a imagem não seja encontrada: um cachorrinho simples.
                var c = new PixelCanvas(24, 20);
                var fur = H("#f3e6cc"); var orange = H("#d9792b");
                c.Rect(4, 4, 14, 8, fur); c.Rect(15, 9, 7, 7, fur); c.Rect(15, 13, 4, 5, orange); c.Rect(5, 0, 3, 5, fur); c.Rect(14, 0, 3, 5, fur);
                c.Rect(1, 10, 4, 2, orange); c.Set(19, 13, H("#1a1a1a")); c.Rect(21, 11, 2, 2, H("#1a1a1a"));
                c.Rect(7, 5, 8, 6, H("#3aa7b8"));
                return c.ToSprite(new Vector2(0.5f, 0f), 20f / heightUnits);
            });
        }

        // =====================================================================
        // FUNDO E BLOCOS (uma textura grande por fase)
        // =====================================================================
        public static Sprite PaintBackground(LevelInfo level, Theme th)
        {
            int w = level.Map[0].Length, h = level.Map.Length;
            var c = new PixelCanvas(w * PPU, h * PPU);
            var rnd = new System.Random(level.Name.Length * 97 + w);

            if (th.Id == ThemeId.Courtyard)
            {
                for (int y = 0; y < c.H; y++)
                {
                    var col = PixelCanvas.Mix(th.SkyBottom, th.SkyTop, y / (float)c.H);
                    for (int x = 0; x < c.W; x++) c.Set(x, y, col);
                }
                for (int i = 0; i < w * 6; i++)
                {
                    int x = rnd.Next(c.W), y = rnd.Next(c.H / 3, c.H);
                    byte a = (byte)rnd.Next(90, 255);
                    c.Blend(x, y, new Color32(220, 228, 255, a));
                }
                // lua fria (a luz de área do script do Blender)
                float mx = c.W * 0.12f, my = c.H - 40;
                for (int r = 30; r > 12; r -= 2) c.Disc(mx, my, r, new Color32(140, 173, 255, 10));
                c.Disc(mx, my, 11, H("#dfe7ff"));
                // castelo-maquete ao fundo: torres com telhado cônico e janelas acesas
                int baseY = 3 * PPU;
                for (int x = 8; x < c.W - 8; x += rnd.Next(26, 52))
                {
                    int tw = rnd.Next(14, 30), th2 = rnd.Next(50, 150);
                    var body = Sh(th.WallDark, 0.9f + (float)rnd.NextDouble() * 0.2f);
                    c.Rect(x, baseY, tw, th2, body);
                    c.Tri(new Vector2(x - 3, baseY + th2), new Vector2(x + tw + 3, baseY + th2), new Vector2(x + tw / 2f, baseY + th2 + tw * 1.3f), Sh(body, 0.75f));
                    for (int wy = baseY + 10; wy < baseY + th2 - 8; wy += 12)
                        if (rnd.NextDouble() < 0.55) c.Rect(x + tw / 2 - 1, wy, 3, 5, PixelCanvas.Alpha(th.Accent, 210));
                }
                // rochas facetadas distantes, como a base da maquete impressa
                for (int x = -10; x < c.W; x += rnd.Next(12, 24))
                {
                    int rh = rnd.Next(20, 46);
                    c.Tri(new Vector2(x, 0), new Vector2(x + rnd.Next(20, 40), 0), new Vector2(x + rnd.Next(5, 25), baseY + rh - 40), Sh(th.StoneDark, 0.55f + (float)rnd.NextDouble() * 0.15f));
                }
            }
            else
            {
                // tijolos de pedra
                for (int y = 0; y < c.H; y += 8)
                {
                    int off = (y / 8) % 2 == 0 ? 0 : 8;
                    for (int x = -off; x < c.W; x += 16)
                    {
                        int tileX = Mathf.Clamp((x + 8) / PPU, 0, w - 1);
                        var baseCol = th.WallAt(tileX, w);
                        var col = Sh(baseCol, 0.82f + (float)rnd.NextDouble() * 0.26f);
                        c.Rect(x, y, 16, 8, col);
                        c.Rect(x, y, 16, 1, Sh(baseCol, 0.6f));
                        c.Rect(x, y, 1, 8, Sh(baseCol, 0.6f));
                    }
                }
                // escurece em direção ao teto e ao chão (luz vem do meio da sala)
                for (int y = 0; y < c.H; y++)
                {
                    float t = Mathf.Abs(y / (float)c.H - 0.45f) * 1.3f;
                    var dark = new Color32(5, 6, 12, (byte)(Mathf.Clamp01(t) * 150));
                    for (int x = 0; x < c.W; x++) c.Blend(x, y, dark);
                }
                // colunas: nas salas comunais, marcam a troca de cor
                int step = th.Sections != null ? w / th.Sections.Length : 12;
                for (int tx = step; tx < w; tx += step)
                {
                    int px = tx * PPU - 6;
                    c.Rect(px, 0, 12, c.H, Sh(th.StoneDark, 0.9f));
                    c.Rect(px, 0, 2, c.H, Sh(th.StoneLight, 0.8f));
                    for (int y = 0; y < c.H; y += 24) c.Rect(px, y, 12, 2, Sh(th.StoneDark, 0.6f));
                }
            }
            return c.ToSprite(Vector2.zero, PPU);
        }

        public static Sprite PaintForeground(LevelInfo level, Theme th)
        {
            string[] m = level.Map;
            int w = m[0].Length, h = m.Length;
            var c = new PixelCanvas(w * PPU, h * PPU);
            var rnd = new System.Random(w * 31 + h);
            System.Func<int, int, char> at = (x, r) => (x < 0 || x >= w || r < 0 || r >= h) ? '#' : m[r][x];

            for (int r = 0; r < h; r++)
                for (int x = 0; x < w; x++)
                {
                    char ch = m[r][x];
                    int px = x * PPU, py = (h - 1 - r) * PPU;
                    if (ch == '#')
                    {
                        bool top = at(x, r - 1) != '#', left = at(x - 1, r) != '#', right = at(x + 1, r) != '#', bottom = at(x, r + 1) != '#';
                        if (th.Id == ThemeId.Courtyard) RockTile(c, px, py, th, rnd, top, left, right, bottom);
                        else BrickTile(c, px, py, th, rnd, top, left, right, bottom, x, w);
                    }
                    else if (ch == '-') PlankTile(c, px, py, th, at(x - 1, r) != '-', at(x + 1, r) != '-');
                    else if (ch == '^') SpikeTile(c, px, py);
                }
            return c.ToSprite(Vector2.zero, PPU);
        }

        static void RockTile(PixelCanvas c, int px, int py, Theme th, System.Random rnd, bool top, bool left, bool right, bool bottom)
        {
            // faces facetadas como as rochas low-poly da maquete impressa
            float k1 = 0.9f + (float)rnd.NextDouble() * 0.2f, k2 = 0.72f + (float)rnd.NextDouble() * 0.15f;
            c.Rect(px, py, PPU, PPU, Sh(th.Stone, k1));
            if (rnd.Next(2) == 0) c.Tri(new Vector2(px, py), new Vector2(px + 16, py), new Vector2(px + rnd.Next(4, 12), py + rnd.Next(8, 16)), Sh(th.Stone, k2));
            else c.Tri(new Vector2(px, py + 16), new Vector2(px, py), new Vector2(px + rnd.Next(10, 16), py + rnd.Next(2, 10)), Sh(th.Stone, k2));
            if (top) { c.Rect(px, py + 13, PPU, 3, th.StoneLight); c.Rect(px, py + 15, PPU, 1, Sh(th.StoneLight, 1.15f)); c.Rect(px, py + 12, PPU, 1, Sh(th.Stone, 0.7f)); }
            if (left) c.Rect(px, py, 1, PPU, Sh(th.StoneLight, 0.95f));
            if (right) c.Rect(px + 15, py, 1, PPU, th.StoneDark);
            if (bottom) c.Rect(px, py, PPU, 1, th.StoneDark);
        }

        static void BrickTile(PixelCanvas c, int px, int py, Theme th, System.Random rnd, bool top, bool left, bool right, bool bottom, int tx, int w)
        {
            var mortar = th.StoneDark;
            c.Rect(px, py, PPU, PPU, mortar);
            for (int row = 0; row < 2; row++)
            {
                int y = py + row * 8;
                int off = ((py / 8) + row) % 2 == 0 ? 0 : 8;
                for (int bx = -off; bx < 16; bx += 16)
                {
                    int x0 = Mathf.Max(px, px + bx), x1 = Mathf.Min(px + 16, px + bx + 16);
                    var col = Sh(th.Stone, 0.85f + (float)rnd.NextDouble() * 0.25f);
                    c.Rect(x0 + 1, y + 1, x1 - x0 - 1, 7, col);
                    c.Rect(x0 + 1, y + 7, x1 - x0 - 1, 1, Sh(col, 1.12f));
                }
            }
            if (top)
            {
                // borda superior: tapete nas salas comunais, pedra clara nas outras
                var cap = th.Sections != null ? Sh(th.WallAt(tx, w), 1.35f) : th.StoneLight;
                c.Rect(px, py + 12, PPU, 4, cap);
                c.Rect(px, py + 15, PPU, 1, Sh(cap, 1.2f));
                c.Rect(px, py + 11, PPU, 1, Sh(th.StoneDark, 0.8f));
            }
            if (left) c.Rect(px, py, 1, PPU, Sh(th.StoneLight, 0.9f));
            if (right) c.Rect(px + 15, py, 1, PPU, Sh(th.StoneDark, 0.7f));
            if (bottom) c.Rect(px, py, PPU, 1, Sh(th.StoneDark, 0.7f));
        }

        static void PlankTile(PixelCanvas c, int px, int py, Theme th, bool leftEnd, bool rightEnd)
        {
            var wood = th.Plank;
            c.Rect(px, py + 11, PPU, 5, wood);
            c.Rect(px, py + 15, PPU, 1, Sh(wood, 1.3f));
            c.Rect(px, py + 11, PPU, 1, Sh(wood, 0.6f));
            c.Rect(px + 7, py + 12, 1, 3, Sh(wood, 0.75f));
            c.Set(px + 3, py + 13, Sh(wood, 0.5f)); c.Set(px + 12, py + 13, Sh(wood, 0.5f));
            if (leftEnd) { c.Rect(px + 2, py + 6, 2, 5, Sh(wood, 0.7f)); }
            if (rightEnd) { c.Rect(px + 12, py + 6, 2, 5, Sh(wood, 0.7f)); }
        }

        static void SpikeTile(PixelCanvas c, int px, int py)
        {
            var metal = H("#b9c2cf"); var dark = H("#5b6474");
            c.Rect(px, py, PPU, 3, dark);
            for (int i = 0; i < 4; i++)
            {
                float x = px + i * 4;
                c.Tri(new Vector2(x, py + 3), new Vector2(x + 4, py + 3), new Vector2(x + 2, py + 11), metal);
                c.Tri(new Vector2(x + 2, py + 3), new Vector2(x + 4, py + 3), new Vector2(x + 2, py + 11), Sh(metal, 0.7f));
            }
        }

        // =====================================================================
        // OBJETOS DO JOGO
        // =====================================================================
        public static Sprite Glow()
        {
            return Cached("glow", () =>
            {
                var c = new PixelCanvas(64, 64);
                c.RadialGlow(new Color32(255, 255, 255, 255), 2.2f);
                return c.ToSprite(new Vector2(0.5f, 0.5f), 32f, true);
            });
        }

        public static Sprite Orb()
        {
            return Cached("orb", () =>
            {
                var c = new PixelCanvas(32, 32);
                c.RadialGlow(new Color32(255, 255, 255, 120), 1.2f);
                c.Disc(16, 16, 11, new Color32(255, 255, 255, 255));
                c.Disc(16, 16, 9.5f, new Color32(40, 34, 60, 235));
                c.Disc(12, 20, 2.2f, new Color32(255, 255, 255, 160));
                return c.ToSprite(new Vector2(0.5f, 0.5f), 32f, true);
            });
        }

        public static Sprite Spark()
        {
            return Cached("spark", () =>
            {
                var c = new PixelCanvas(4, 4);
                c.Rect(1, 0, 2, 4, Color.white); c.Rect(0, 1, 4, 2, Color.white);
                return c.ToSprite(new Vector2(0.5f, 0.5f), PPU);
            });
        }

        public static Sprite Altar(Theme th, bool lit)
        {
            return Cached("altar" + th.Id + lit, () =>
            {
                var c = new PixelCanvas(16, 32);
                var st = th.StoneLight; var dk = th.StoneDark;
                c.Rect(1, 0, 14, 4, Sh(st, 0.9f)); c.Rect(1, 3, 14, 1, Sh(st, 1.1f));
                c.Rect(4, 4, 8, 18, st); c.Rect(4, 4, 2, 18, Sh(st, 1.15f)); c.Rect(10, 4, 2, 18, Sh(st, 0.75f));
                // runas gravadas na coluna
                for (int y = 7; y < 20; y += 4) c.Rect(6, y, 4, 1, lit ? th.Accent : dk);
                c.Rect(1, 22, 14, 3, Sh(st, 0.95f)); c.Rect(0, 25, 16, 2, st); c.Rect(0, 26, 16, 1, Sh(st, 1.15f));
                c.Rect(2, 27, 12, 2, lit ? th.Accent : Sh(dk, 0.7f));
                if (lit) c.Rect(4, 29, 8, 2, Sh(th.Accent, 1.2f));
                return c.ToSprite(new Vector2(0.5f, 0f), PPU);
            });
        }

        public static Sprite Door(Theme th, bool open)
        {
            return Cached("door" + th.Id + open, () =>
            {
                var c = new PixelCanvas(32, 48);
                var frame = th.StoneLight;
                c.Arch(0, 0, 32, 48, Sh(frame, 0.85f));
                c.Arch(2, 0, 28, 45, frame);
                if (open)
                {
                    c.Arch(4, 0, 24, 42, H("#120c08"));
                    for (int y = 0; y < 30; y++)
                    {
                        byte a = (byte)(200 - y * 6);
                        for (int x = 6; x < 26; x++) c.Blend(x, y, PixelCanvas.Alpha(th.Accent, a));
                    }
                }
                else
                {
                    var wood = H("#6b4024");
                    c.Arch(4, 0, 24, 42, wood);
                    for (int x = 4; x < 28; x += 6) c.Rect(x, 0, 1, 38, Sh(wood, 0.7f));
                    c.Rect(4, 10, 24, 2, H("#2b2b30")); c.Rect(4, 28, 24, 2, H("#2b2b30"));
                    c.Disc(23, 20, 1.5f, th.Accent);
                }
                return c.ToSprite(new Vector2(0f, 0f), PPU);
            });
        }

        public static Sprite Slime(Color32 color, int frame)
        {
            return Cached("slime" + color.r + "_" + color.g + "_" + frame, () =>
            {
                var c = new PixelCanvas(16, 14);
                float squash = frame == 0 ? 0f : 1.5f;
                c.Ellipse(8, 5 - squash * 0.3f, 7 + squash * 0.5f, 5 - squash * 0.6f, Sh(color, 0.75f));
                c.Ellipse(8, 6, 6.5f + squash * 0.4f, 5.5f - squash * 0.5f, color);
                c.Ellipse(5, 8, 2, 1.5f, Sh(color, 1.4f));
                c.Rect(9, 6, 2, 3, H("#ffffff")); c.Rect(12, 6, 2, 3, H("#ffffff"));
                c.Rect(10, 6, 1, 2, H("#1a1020")); c.Rect(13, 6, 1, 2, H("#1a1020"));
                return c.ToSprite(new Vector2(0.5f, 0f), PPU);
            });
        }

        public static Sprite Candle(bool lit)
        {
            return Cached("candle" + lit, () =>
            {
                var c = new PixelCanvas(16, 24);
                var brass = H("#c9a35a");
                c.Rect(3, 0, 10, 2, brass); c.Rect(7, 2, 2, 6, brass); c.Rect(4, 8, 8, 2, brass);
                c.Rect(6, 10, 4, 8, H("#efe6cf")); c.Rect(6, 10, 1, 8, H("#ffffff"));
                c.Rect(7, 18, 1, 2, H("#2a2a2a"));
                if (lit) { c.Ellipse(7.5f, 21, 2, 3, H("#ffb347")); c.Ellipse(7.5f, 21, 1, 2, H("#fff2c0")); }
                return c.ToSprite(new Vector2(0.5f, 0f), PPU);
            });
        }

        public static Sprite Book(Color32 cover)
        {
            return Cached("book" + cover.r + cover.g, () =>
            {
                var c = new PixelCanvas(32, 10);
                c.Rect(0, 0, 32, 10, Sh(cover, 0.7f));
                c.Rect(1, 2, 30, 6, H("#efe2c0"));
                for (int x = 3; x < 30; x += 2) c.Rect(x, 3, 1, 4, H("#cdbd98"));
                c.Rect(0, 8, 32, 2, cover); c.Rect(0, 0, 32, 2, cover);
                c.Rect(14, 0, 4, 10, Sh(cover, 1.25f));
                return c.ToSprite(new Vector2(0.5f, 1f), PPU);
            });
        }

        public static Texture2D Heart(bool full)
        {
            var c = new PixelCanvas(9, 8);
            string[] rows = { ".##...##.", "#########", "#########", "#########", ".#######.", "..#####..", "...###...", "....#...." };
            var fill = full ? H("#ff5a6e") : H("#3a3448");
            for (int r = 0; r < rows.Length; r++)
                for (int x = 0; x < 9; x++)
                    if (rows[r][x] == '#') c.Set(x, 7 - r, fill);
            if (full) { c.Set(1, 5, H("#ffc2cb")); c.Set(2, 6, H("#ffc2cb")); }
            return c.ToTexture(false);
        }

        // =====================================================================
        // DECORAÇÃO (não colide)
        // =====================================================================
        public static Sprite Decor(char kind, Theme th, int tileX, int width)
        {
            Color32 section = th.WallAt(tileX, width);
            string key = "decor" + kind + th.Id + (th.Sections != null ? section.r.ToString() : "");
            return Cached(key, () =>
            {
                switch (kind)
                {
                    case 'W': return Window(th);
                    case 'B': return Bookcase();
                    case 'K': return Cauldron(th);
                    case 'F': return Fireplace(th);
                    case 'N': return Banner(th, section);
                    case 'T': return Torch();
                    case 'L': return Lantern(th);
                    default: return Shelf(th);
                }
            });
        }

        /// <summary>Onde fica a luz de cada decoração (em unidades, a partir do canto inferior esquerdo) e sua cor.</summary>
        public static bool DecorLight(char kind, Theme th, out Vector2 offset, out Color color, out float size)
        {
            offset = Vector2.zero; color = Color.white; size = 0;
            switch (kind)
            {
                case 'W': offset = new Vector2(1f, 1.7f); color = th.Glass; size = 4.5f; return true;
                case 'K': offset = new Vector2(1f, 1.4f); color = th.Accent; size = 3.5f; return true;
                case 'F': offset = new Vector2(1.5f, 0.9f); color = new Color(1f, 0.6f, 0.25f); size = 6f; return true;
                case 'T': offset = new Vector2(0.5f, 1.2f); color = new Color(1f, 0.65f, 0.3f); size = 3.5f; return true;
                case 'L': offset = new Vector2(0.5f, 1.7f); color = th.Accent; size = 4f; return true;
            }
            return false;
        }

        static Sprite Window(Theme th)
        {
            var c = new PixelCanvas(32, 48);
            c.Arch(2, 4, 28, 42, Sh(th.StoneLight, 0.9f));
            c.Arch(5, 6, 22, 37, th.Glass);
            // treliça diagonal, como no laboratório de poções
            var lead = Sh(th.StoneDark, 0.8f);
            for (int d = -40; d < 60; d += 5)
                for (int y = 6; y < 44; y++)
                {
                    int x1 = d + y, x2 = d + 40 - y;
                    if (c.Get(x1, y).Equals(th.Glass)) c.Set(x1, y, lead);
                    if (c.Get(x2, y).Equals(th.Glass)) c.Set(x2, y, lead);
                }
            c.Rect(0, 2, 32, 4, th.StoneLight); c.Rect(0, 5, 32, 1, Sh(th.StoneLight, 1.15f));
            return c.ToSprite(Vector2.zero, PPU);
        }

        static Sprite Bookcase()
        {
            var c = new PixelCanvas(32, 48);
            var wood = H("#4b3020");
            c.Rect(0, 0, 32, 48, wood); c.Rect(2, 2, 28, 44, H("#24160e"));
            var rnd = new System.Random(5);
            Color32[] cols = { H("#8e2a22"), H("#26407e"), H("#1f5b3a"), H("#a9781f"), H("#5a3a6e"), H("#c9b38a"), H("#3a6a8a") };
            for (int shelf = 0; shelf < 4; shelf++)
            {
                int y = 2 + shelf * 11;
                c.Rect(0, y, 32, 2, Sh(wood, 1.2f));
                int x = 3;
                while (x < 29)
                {
                    int bw = rnd.Next(2, 4), bh = rnd.Next(6, 9);
                    var col = cols[rnd.Next(cols.Length)];
                    c.Rect(x, y + 2, bw, bh, col); c.Rect(x, y + 2 + bh - 2, bw, 1, Sh(col, 1.3f));
                    x += bw + (rnd.Next(5) == 0 ? 2 : 0);
                }
            }
            return c.ToSprite(Vector2.zero, PPU);
        }

        static Sprite Cauldron(Theme th)
        {
            var c = new PixelCanvas(32, 32);
            c.Rect(6, 0, 3, 6, H("#1a181f")); c.Rect(23, 0, 3, 6, H("#1a181f"));
            c.Ellipse(16, 12, 13, 10, H("#1c1a22"));
            c.Ellipse(12, 13, 4, 6, H("#2c2934"));
            c.Ellipse(16, 21, 14, 4, H("#2e2b38"));
            c.Ellipse(16, 21, 12, 3, th.Accent);
            c.Ellipse(16, 22, 8, 1.5f, Sh(th.Accent, 1.3f));
            c.Disc(11, 26, 2, PixelCanvas.Alpha(Sh(th.Accent, 1.2f), 200));
            c.Disc(20, 28, 1.5f, PixelCanvas.Alpha(Sh(th.Accent, 1.2f), 160));
            return c.ToSprite(Vector2.zero, PPU);
        }

        static Sprite Fireplace(Theme th)
        {
            var c = new PixelCanvas(48, 48);
            var st = H("#8a8790");
            c.Rect(0, 0, 48, 40, Sh(st, 0.9f));
            for (int y = 0; y < 40; y += 8) for (int x = (y / 8) % 2 * 6; x < 48; x += 12) c.Rect(x, y, 1, 8, Sh(st, 0.7f));
            for (int y = 0; y < 40; y += 8) c.Rect(0, y, 48, 1, Sh(st, 0.7f));
            c.Rect(0, 38, 48, 4, H("#4b3524")); c.Rect(0, 41, 48, 1, H("#6b4a2e"));
            c.Arch(10, 0, 28, 28, H("#140e0c"));
            c.Rect(14, 0, 20, 3, H("#3b2414"));
            c.Ellipse(24, 8, 9, 7, H("#ff7a2a")); c.Ellipse(24, 7, 6, 6, H("#ffb347")); c.Ellipse(24, 6, 3, 4, H("#fff0b0"));
            c.Rect(16, 0, 16, 2, H("#5a3a22"));
            c.Disc(10, 44, 1.5f, H("#efe6cf")); c.Disc(38, 44, 1.5f, H("#efe6cf"));
            return c.ToSprite(Vector2.zero, PPU);
        }

        static Sprite Banner(Theme th, Color32 section)
        {
            var c = new PixelCanvas(16, 48);
            var cloth = th.Sections != null ? Sh(section, 1.6f) : th.Accent;
            c.Rect(0, 44, 16, 2, H("#3b2a18"));
            c.Rect(2, 12, 12, 32, cloth);
            c.Tri(new Vector2(2, 12), new Vector2(14, 12), new Vector2(8, 4), cloth);
            c.Rect(2, 40, 12, 2, H("#e9c46a")); c.Disc(8, 28, 3.5f, H("#e9c46a")); c.Disc(8, 28, 2, cloth);
            c.Rect(12, 12, 2, 32, Sh(cloth, 0.75f));
            return c.ToSprite(Vector2.zero, PPU);
        }

        static Sprite Torch()
        {
            var c = new PixelCanvas(16, 28);
            c.Rect(6, 4, 4, 10, H("#3b2a18")); c.Rect(4, 12, 8, 3, H("#5a5a60"));
            c.Ellipse(8, 19, 4, 5, H("#ff7a2a")); c.Ellipse(8, 18, 2.5f, 4, H("#ffb347")); c.Ellipse(8, 17, 1.2f, 2, H("#fff0b0"));
            return c.ToSprite(Vector2.zero, PPU);
        }

        static Sprite Lantern(Theme th)
        {
            var c = new PixelCanvas(16, 32);
            c.Rect(7, 0, 2, 22, H("#2b1c12"));
            c.Rect(4, 22, 8, 1, H("#1e1e24")); c.Rect(4, 30, 8, 1, H("#1e1e24"));
            c.Rect(5, 23, 6, 7, th.Accent); c.Rect(6, 24, 4, 5, Sh(th.Accent, 1.3f));
            c.Rect(6, 31, 4, 1, H("#1e1e24"));
            return c.ToSprite(Vector2.zero, PPU);
        }

        static Sprite Shelf(Theme th)
        {
            var c = new PixelCanvas(32, 16);
            c.Rect(0, 0, 32, 2, th.Plank);
            Color32[] cols = { H("#7fd0c0"), H("#b48cff"), H("#8fb6ff"), H("#d8e6a0"), H("#ff9a8a") };
            int x = 2, i = 0;
            while (x < 29)
            {
                var col = cols[i % cols.Length];
                int bw = 3 + (i % 2), bh = 5 + (i * 3) % 6;
                c.Rect(x, 2, bw, bh, col); c.Rect(x + 1, 2 + bh, 1, 2, H("#6b4a2e")); c.Rect(x, 2 + bh - 1, bw, 1, Sh(col, 1.3f));
                x += bw + 2; i++;
            }
            return c.ToSprite(Vector2.zero, PPU);
        }
    }
}
