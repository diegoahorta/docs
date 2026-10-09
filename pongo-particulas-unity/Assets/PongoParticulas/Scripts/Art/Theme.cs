using UnityEngine;

namespace PongoParticulas
{
    /// <summary>
    /// Paletas tiradas das referências: a maquete impressa em 3D (azul-acinzentado),
    /// o laboratório de poções (verde-azulado com roxo), as quatro salas comunais
    /// (vermelho, verde, azul, amarelo) e a biblioteca noturna.
    /// </summary>
    public class Theme
    {
        public ThemeId Id;
        public Color32 SkyTop, SkyBottom;     // fundo (céu ou parede distante)
        public Color32 Wall, WallDark;        // tijolos de fundo
        public Color32 Stone, StoneLight, StoneDark;
        public Color32 Plank;
        public Color32 Accent;                // luz principal
        public Color32 Glass;                 // vidro das janelas
        public Color32 Slime;                 // inimigo
        public Color32[] Sections;            // salas comunais: cor de cada sala

        static Color32 H(string s) { return PixelCanvas.Hex(s); }

        public static Theme Get(ThemeId id)
        {
            switch (id)
            {
                case ThemeId.Courtyard:
                    return new Theme
                    {
                        Id = id, SkyTop = H("#070b18"), SkyBottom = H("#1c2a4a"),
                        Wall = H("#2b3852"), WallDark = H("#1d273d"),
                        Stone = H("#5f7090"), StoneLight = H("#8193b3"), StoneDark = H("#44526d"),
                        Plank = H("#6b4a2e"), Accent = H("#f2a531"), Glass = H("#ffcf7a"), Slime = H("#8fd0ff")
                    };
                case ThemeId.Dungeon:
                    return new Theme
                    {
                        Id = id, SkyTop = H("#0b1416"), SkyBottom = H("#12302f"),
                        Wall = H("#294243"), WallDark = H("#1b2e30"),
                        Stone = H("#3f5b5d"), StoneLight = H("#5e7f80"), StoneDark = H("#2a3f41"),
                        Plank = H("#5a3a22"), Accent = H("#b48cff"), Glass = H("#cfe8ff"), Slime = H("#a070ff")
                    };
                case ThemeId.Commons:
                    return new Theme
                    {
                        Id = id, SkyTop = H("#140c10"), SkyBottom = H("#24161a"),
                        Wall = H("#5e2e22"), WallDark = H("#3e1f18"),
                        Stone = H("#5a4636"), StoneLight = H("#7a6450"), StoneDark = H("#3a2c22"),
                        Plank = H("#6b4a2e"), Accent = H("#ffb347"), Glass = H("#ffe2a0"), Slime = H("#e2b23a"),
                        Sections = new[] { H("#6a2e24"), H("#22432f"), H("#263763"), H("#86662a") }
                    };
                default:
                    return new Theme
                    {
                        Id = id, SkyTop = H("#0c0a14"), SkyBottom = H("#1d1830"),
                        Wall = H("#2e2840"), WallDark = H("#1f1a2c"),
                        Stone = H("#463a52"), StoneLight = H("#64567a"), StoneDark = H("#30263a"),
                        Plank = H("#5a3a22"), Accent = H("#4fb3ff"), Glass = H("#c9d8ff"), Slime = H("#6fd0ff")
                    };
            }
        }

        /// <summary>Cor de parede numa coluna (as salas comunais mudam de cor por trecho).</summary>
        public Color32 WallAt(int x, int width)
        {
            if (Sections == null) return Wall;
            int i = Mathf.Clamp(x * Sections.Length / Mathf.Max(1, width), 0, Sections.Length - 1);
            return Sections[i];
        }
    }
}
