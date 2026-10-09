using UnityEngine;

namespace PongoParticulas
{
    /// <summary>Pequena "tela" de pixels para desenhar sprites por código. y = 0 é a base.</summary>
    public class PixelCanvas
    {
        public readonly int W, H;
        public readonly Color32[] Px;

        public PixelCanvas(int w, int h)
        {
            W = w; H = h; Px = new Color32[w * h];
        }

        public void Set(int x, int y, Color32 c)
        {
            if (x < 0 || y < 0 || x >= W || y >= H) return;
            Px[y * W + x] = c;
        }

        public Color32 Get(int x, int y)
        {
            if (x < 0 || y < 0 || x >= W || y >= H) return new Color32(0, 0, 0, 0);
            return Px[y * W + x];
        }

        /// <summary>Mistura com transparência (para brilhos e sombras).</summary>
        public void Blend(int x, int y, Color32 c)
        {
            if (x < 0 || y < 0 || x >= W || y >= H || c.a == 0) return;
            if (c.a == 255) { Px[y * W + x] = c; return; }
            Color32 d = Px[y * W + x];
            float a = c.a / 255f, da = d.a / 255f, oa = a + da * (1 - a);
            if (oa <= 0f) return;
            Px[y * W + x] = new Color32(
                (byte)((c.r * a + d.r * da * (1 - a)) / oa),
                (byte)((c.g * a + d.g * da * (1 - a)) / oa),
                (byte)((c.b * a + d.b * da * (1 - a)) / oa),
                (byte)(oa * 255));
        }

        public void Rect(int x, int y, int w, int h, Color32 c)
        {
            for (int j = y; j < y + h; j++)
                for (int i = x; i < x + w; i++) Set(i, j, c);
        }

        public void BlendRect(int x, int y, int w, int h, Color32 c)
        {
            for (int j = y; j < y + h; j++)
                for (int i = x; i < x + w; i++) Blend(i, j, c);
        }

        public void Disc(float cx, float cy, float r, Color32 c)
        {
            int x0 = Mathf.FloorToInt(cx - r), x1 = Mathf.CeilToInt(cx + r);
            int y0 = Mathf.FloorToInt(cy - r), y1 = Mathf.CeilToInt(cy + r);
            for (int y = y0; y <= y1; y++)
                for (int x = x0; x <= x1; x++)
                {
                    float dx = x + 0.5f - cx, dy = y + 0.5f - cy;
                    if (dx * dx + dy * dy <= r * r) Set(x, y, c);
                }
        }

        public void Ellipse(float cx, float cy, float rx, float ry, Color32 c)
        {
            int x0 = Mathf.FloorToInt(cx - rx), x1 = Mathf.CeilToInt(cx + rx);
            int y0 = Mathf.FloorToInt(cy - ry), y1 = Mathf.CeilToInt(cy + ry);
            for (int y = y0; y <= y1; y++)
                for (int x = x0; x <= x1; x++)
                {
                    float dx = (x + 0.5f - cx) / rx, dy = (y + 0.5f - cy) / ry;
                    if (dx * dx + dy * dy <= 1f) Set(x, y, c);
                }
        }

        /// <summary>Preenche um triângulo (teste de ponto por pixel).</summary>
        public void Tri(Vector2 a, Vector2 b, Vector2 c, Color32 col)
        {
            int x0 = Mathf.FloorToInt(Mathf.Min(a.x, Mathf.Min(b.x, c.x)));
            int x1 = Mathf.CeilToInt(Mathf.Max(a.x, Mathf.Max(b.x, c.x)));
            int y0 = Mathf.FloorToInt(Mathf.Min(a.y, Mathf.Min(b.y, c.y)));
            int y1 = Mathf.CeilToInt(Mathf.Max(a.y, Mathf.Max(b.y, c.y)));
            for (int y = y0; y <= y1; y++)
                for (int x = x0; x <= x1; x++)
                {
                    var p = new Vector2(x + 0.5f, y + 0.5f);
                    float d1 = Side(p, a, b), d2 = Side(p, b, c), d3 = Side(p, c, a);
                    bool neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
                    if (!(neg && pos)) Set(x, y, col);
                }
        }

        static float Side(Vector2 p, Vector2 a, Vector2 b)
        {
            return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
        }

        /// <summary>Arco gótico/romano: retângulo com topo em semicírculo.</summary>
        public void Arch(int x, int y, int w, int h, Color32 c)
        {
            float r = w / 2f;
            Rect(x, y, w, Mathf.Max(0, Mathf.CeilToInt(h - r)), c);
            Disc(x + r, y + h - r, r, c);
        }

        public void RadialGlow(Color32 c, float power)
        {
            float cx = W / 2f, cy = H / 2f, r = Mathf.Min(W, H) / 2f;
            for (int y = 0; y < H; y++)
                for (int x = 0; x < W; x++)
                {
                    float d = Mathf.Sqrt((x + 0.5f - cx) * (x + 0.5f - cx) + (y + 0.5f - cy) * (y + 0.5f - cy)) / r;
                    float a = Mathf.Clamp01(1f - d);
                    a = Mathf.Pow(a, power);
                    Set(x, y, new Color32(c.r, c.g, c.b, (byte)(c.a * a)));
                }
        }

        public Texture2D ToTexture(bool smooth)
        {
            var t = new Texture2D(W, H, TextureFormat.RGBA32, false);
            t.filterMode = smooth ? FilterMode.Bilinear : FilterMode.Point;
            t.wrapMode = TextureWrapMode.Clamp;
            t.SetPixels32(Px);
            t.Apply(false, false);
            return t;
        }

        public Sprite ToSprite(Vector2 pivot, float ppu = 16f, bool smooth = false)
        {
            var t = ToTexture(smooth);
            return Sprite.Create(t, new Rect(0, 0, W, H), pivot, ppu, 0, SpriteMeshType.FullRect);
        }

        // ---- cores ----
        public static Color32 Hex(string hex)
        {
            Color c;
            if (!ColorUtility.TryParseHtmlString(hex, out c)) c = Color.magenta;
            return c;
        }

        public static Color32 Shade(Color32 c, float k)
        {
            return new Color32((byte)Mathf.Clamp(c.r * k, 0, 255), (byte)Mathf.Clamp(c.g * k, 0, 255), (byte)Mathf.Clamp(c.b * k, 0, 255), c.a);
        }

        public static Color32 Mix(Color32 a, Color32 b, float t)
        {
            return Color32.Lerp(a, b, t);
        }

        public static Color32 Alpha(Color32 c, byte a)
        {
            return new Color32(c.r, c.g, c.b, a);
        }
    }
}
