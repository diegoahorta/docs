using UnityEngine;

namespace PongoParticulas
{
    /// <summary>
    /// Fonte com kana. Ordem de busca:
    /// 1) Resources/Fonts/NotoSansJP (coloque um .ttf com esse nome, obrigatório para WebGL);
    /// 2) fontes japonesas instaladas no sistema (Windows, macOS, Linux);
    /// 3) fonte padrão da Unity.
    /// </summary>
    public static class JpFont
    {
        static Font font;

        static readonly string[] OsFonts =
        {
            "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Yu Gothic", "Meiryo", "MS Gothic",
            "Noto Sans CJK JP", "Noto Sans JP", "Source Han Sans JP", "TakaoGothic", "Arial Unicode MS", "Arial"
        };

        public static Font Get()
        {
            if (font != null) return font;
            font = Resources.Load<Font>("Fonts/NotoSansJP");
            if (font == null)
            {
                try { font = Font.CreateDynamicFontFromOSFont(OsFonts, 32); }
                catch (System.Exception) { font = null; }
            }
            if (font == null) font = Builtin("LegacyRuntime.ttf");
            if (font == null) font = Builtin("Arial.ttf");
            return font;
        }

        static Font Builtin(string name)
        {
            try { return Resources.GetBuiltinResource<Font>(name); }
            catch (System.Exception) { return null; }
        }
    }
}
