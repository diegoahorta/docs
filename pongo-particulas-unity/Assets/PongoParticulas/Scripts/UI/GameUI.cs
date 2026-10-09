using UnityEngine;

namespace PongoParticulas
{
    /// <summary>
    /// Interface em IMGUI (OnGUI): funciona em qualquer projeto, sem Canvas nem EventSystem.
    /// Tudo é desenhado numa tela virtual de 720 px de altura e escalado para a janela.
    /// </summary>
    public class GameUI : MonoBehaviour
    {
        const float RefH = 720f;
        float vw;
        bool stylesReady;
        GUIStyle title, h2, body, small, kanaBig, kanaSlot, romajiSlot, button, panel, slot, slotLearned, toast, feedbackBad, feedbackGood, sentence;
        Texture2D heartFull, heartEmpty, pongoTex, dim;

        static readonly Color Gold = new Color(1f, 0.81f, 0.48f);
        static readonly Color Ink = new Color(0.93f, 0.9f, 0.84f);
        static readonly Color Dim = new Color(0.66f, 0.68f, 0.75f);

        GameManager G { get { return GameManager.I; } }

        // ------------------------------------------------------------------ teclado dos painéis
        void Update()
        {
            if (G == null) return;
            switch (G.State)
            {
                case GameState.Title:
                    if (GameInput.Confirm) G.StartGame();
                    break;
                case GameState.Intro:
                    if (GameInput.Confirm) G.BeginLevel();
                    break;
                case GameState.Altar:
                    if (G.Feedback == FeedbackKind.Correct || (G.Feedback == FeedbackKind.Wrong && G.Hearts == 0))
                    {
                        if (GameInput.Confirm || GameInput.Cancel) G.CloseAltar();
                    }
                    else
                    {
                        if (GameInput.Cancel) { G.CloseAltar(); break; }
                        int n = GameInput.NumberDown();
                        if (n >= 0 && n < G.Bag.Count) G.Choose(G.Bag[n]);
                    }
                    break;
                case GameState.LevelDone:
                    if (GameInput.Confirm) G.NextLevel();
                    break;
                case GameState.GameOver:
                    if (GameInput.Confirm) G.RetryLevel();
                    break;
                case GameState.Ending:
                    if (GameInput.Confirm) G.StartGame();
                    break;
            }
        }

        // ------------------------------------------------------------------ OnGUI
        void OnGUI()
        {
            GameInput.Feed(Event.current);
            if (G == null) return;
            if (!stylesReady) BuildStyles();

            float s = Screen.height / RefH;
            vw = Screen.width / s;
            GUI.matrix = Matrix4x4.Scale(new Vector3(s, s, 1f));

            switch (G.State)
            {
                case GameState.Title: DrawTitle(); break;
                case GameState.Intro: DrawHud(); DrawIntro(); break;
                case GameState.Playing:
                    DrawHud();
                    if (G.GrimoireOpen) DrawGrimoire();
                    break;
                case GameState.Altar: DrawHud(); DrawAltar(); break;
                case GameState.LevelDone: DrawHud(); DrawLevelDone(); break;
                case GameState.GameOver: DrawHud(); DrawGameOver(); break;
                case GameState.Ending: DrawEnding(); break;
            }
        }

        // ------------------------------------------------------------------ HUD
        void DrawHud()
        {
            // fase e corações
            GUI.Box(new Rect(16, 14, 300, 78), GUIContent.none, panel);
            GUI.Label(new Rect(30, 20, 280, 26), "<color=#a3a8b6>ANDAR " + (G.LevelIndex + 1) + " DE " + GameData.Levels.Length + "</color>  " + G.LevelData.Name, small);
            for (int i = 0; i < GameManager.MaxHearts; i++)
                GUI.DrawTexture(new Rect(30 + i * 34, 52, 27, 24), i < G.Hearts ? heartFull : heartEmpty);

            // altares
            string altars = "Altares acesos  " + G.AltarsSolved + "/" + (G.Level != null ? G.Level.Altars.Count : 3);
            GUI.Box(new Rect(vw / 2f - 110, 14, 220, 40), GUIContent.none, panel);
            GUI.Label(new Rect(vw / 2f - 110, 14, 220, 40), altars, CenterOf(small));

            // bolsa de partículas
            float slotW = 54, gap = 6;
            int count = Mathf.Max(G.Bag.Count, 1);
            float bagW = 24 + count * (slotW + gap);
            float bx = vw - 16 - bagW;
            GUI.Box(new Rect(bx, 14, bagW, 100), GUIContent.none, panel);
            GUI.Label(new Rect(bx + 12, 18, bagW - 20, 20), "<color=#a3a8b6>BOLSA</color>", small);
            if (G.Bag.Count == 0) GUI.Label(new Rect(bx + 12, 46, bagW, 50), "<color=#6b7080>vazia</color>", small);
            for (int i = 0; i < G.Bag.Count; i++)
            {
                var p = GameData.Particles[G.Bag[i]];
                var r = new Rect(bx + 12 + i * (slotW + gap), 40, slotW, 66);
                GUI.Box(r, GUIContent.none, G.Learned.Contains(p.Id) ? slotLearned : slot);
                GUI.Label(new Rect(r.x, r.y + 2, r.width, 40), Colored(p.Kana, p.Color), p.Kana.Length > 1 ? CenterOf(kanaSlot, 20) : kanaSlot);
                GUI.Label(new Rect(r.x, r.y + 42, r.width, 20), p.Romaji, romajiSlot);
            }

            // dicas na base
            if (G.State == GameState.Playing && !G.GrimoireOpen)
            {
                if (G.NearAltar != null && !G.NearAltar.Solved)
                {
                    var pr = new Rect(vw / 2f - 220, RefH - 118, 440, 46);
                    GUI.Box(pr, GUIContent.none, panel);
                    GUI.Label(pr, "<color=#ffcf7a><b>E</b></color>  usar o Altar da Função", CenterOf(body));
                }
                GUI.Label(new Rect(0, RefH - 40, vw, 30), "← →  andar      Espaço  pular      E  usar altar      Tab  grimório", CenterOf(small));
            }

            if (!string.IsNullOrEmpty(G.ToastText) && Time.unscaledTime < G.ToastUntil && G.State == GameState.Playing)
            {
                float a = Mathf.Clamp01((G.ToastUntil - Time.unscaledTime) * 2f);
                var old = GUI.color; GUI.color = new Color(1, 1, 1, a);
                var tr = new Rect(vw / 2f - 330, 64, 660, 56);
                GUI.Box(tr, GUIContent.none, panel);
                GUI.Label(tr, G.ToastText, toast);
                GUI.color = old;
            }
        }

        // ------------------------------------------------------------------ título
        void DrawTitle()
        {
            GUI.DrawTexture(new Rect(0, 0, vw, RefH), dim);
            float w = Mathf.Min(1040, vw - 40), x = (vw - w) / 2f;
            var card = new Rect(x, 70, w, 580);
            GUI.Box(card, GUIContent.none, panel);
            if (pongoTex != null) GUI.DrawTexture(new Rect(x + 30, 130, 360, 360), pongoTex, ScaleMode.ScaleToFit);
            float tx = x + 420, tw = w - 450;
            GUI.Label(new Rect(tx, 110, tw, 120), "Pongo e as\n<color=#f2a531>Partículas Mágicas</color>", title);
            GUI.Label(new Rect(tx, 240, tw, 30), "Um jogo de plataforma para aprender partículas do japonês", h2);
            GUI.Label(new Rect(tx, 290, tw, 170),
                "As partículas mágicas fugiram do Grimório e se esconderam pelo castelo. Ajude o Pongo a encontrar cada uma: " +
                "são pequenos artefatos com kana, como <b>は</b>, <b>を</b> e <b>に</b>. Depois, leve cada partícula ao altar que pede a <b>função</b> dela " +
                "para completar a frase e abrir a porta do próximo andar.", body);
            GUI.Label(new Rect(tx, 470, tw, 60), "<color=#a3a8b6>← → andar · Espaço pular · E usar altar · 1–9 escolher partícula · Tab grimório</color>", small);
            if (GUI.Button(new Rect(tx, 540, 260, 56), "Começar  (Enter)", button)) G.StartGame();
            GUI.Label(new Rect(x + 30, 500, 360, 40), "<color=#a3a8b6>12 partículas · 4 andares · nível N5</color>", CenterOf(small));
        }

        void DrawIntro()
        {
            var info = G.LevelData;
            var r = Centered(700, 360);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Label(new Rect(r.x + 36, r.y + 26, r.width - 72, 24), "<color=#a3a8b6>ANDAR " + (G.LevelIndex + 1) + " DE " + GameData.Levels.Length + "</color>", small);
            GUI.Label(new Rect(r.x + 36, r.y + 52, r.width - 72, 50), info.Name, title);
            GUI.Label(new Rect(r.x + 36, r.y + 116, r.width - 72, 120), info.Story, body);
            GUI.Label(new Rect(r.x + 36, r.y + 236, r.width - 72, 30), "Encontre <b>3 partículas</b> · acenda <b>3 altares</b> · abra a <b>porta</b>", body);
            if (GUI.Button(new Rect(r.x + 36, r.yMax - 82, 240, 52), "Entrar  (Enter)", button)) G.BeginLevel();
        }

        // ------------------------------------------------------------------ altar
        void DrawAltar()
        {
            var altar = G.CurrentAltar;
            if (altar == null) return;
            var target = GameData.Particles[altar.Info.ParticleId];
            var r = Centered(820, 600);
            GUI.Box(r, GUIContent.none, panel);
            float x = r.x + 40, w = r.width - 80, y = r.y + 26;

            GUI.Label(new Rect(x, y, w, 24), "<color=#a3a8b6>ALTAR DA FUNÇÃO · FUNÇÃO PEDIDA</color>", small); y += 26;
            GUI.Label(new Rect(x, y, w, 46), "<color=#f2a531>" + target.Function + "</color>", title); y += 50;
            GUI.Label(new Rect(x, y, w, 28), target.Detail, body); y += 42;

            bool solved = altar.Solved;
            string blank = solved ? Colored(" " + target.Kana + " ", target.Color) : "<color=#f2a531> ＿＿ </color>";
            string blankR = solved ? "<color=#ffcf7a>" + target.Romaji + "</color>" : "<color=#f2a531>___</color>";
            GUI.Box(new Rect(x, y, w, 126), GUIContent.none, slot);
            GUI.Label(new Rect(x, y + 8, w, 56), altar.Info.JpBefore + blank + altar.Info.JpAfter, sentence);
            GUI.Label(new Rect(x, y + 66, w, 26), altar.Info.RomajiBefore + " " + blankR + " " + altar.Info.RomajiAfter, CenterOf(body));
            GUI.Label(new Rect(x, y + 94, w, 26), "<i><color=#a3a8b6>" + altar.Info.Portuguese + "</color></i>", CenterOf(body));
            y += 142;

            if (G.Feedback == FeedbackKind.Correct)
            {
                string note = string.IsNullOrEmpty(target.Note) ? "" : "\n<color=#a3a8b6>" + target.Note + "</color>";
                GUI.Box(new Rect(x, y, w, 96), "<b>Isso!</b>  " + target.Kana + " (" + target.Romaji + ") = " + target.Function + "." + note, feedbackGood);
                if (GUI.Button(new Rect(r.xMax - 280, r.yMax - 80, 240, 52), "Continuar  (Enter)", button)) G.CloseAltar();
                return;
            }

            if (G.Feedback == FeedbackKind.Wrong && G.FeedbackParticle != null)
            {
                var wrong = GameData.Particles[G.FeedbackParticle];
                GUI.Box(new Rect(x, y, w, 72), "<b>" + wrong.Kana + " (" + wrong.Romaji + ")</b> é " + wrong.Function + ": " + wrong.Detail + "\nEsta frase pede outra função.  <color=#ff8a8a>−1 ♥</color>", feedbackBad);
                y += 82;
                if (G.Hearts == 0)
                {
                    if (GUI.Button(new Rect(r.xMax - 280, r.yMax - 80, 240, 52), "Continuar  (Enter)", button)) G.CloseAltar();
                    return;
                }
            }

            if (G.Bag.Count == 0)
            {
                GUI.Label(new Rect(x, y, w, 50), "Sua bolsa está vazia. Explore o andar e encontre as partículas flutuantes.", body);
            }
            else
            {
                GUI.Label(new Rect(x, y, w, 24), "<color=#a3a8b6>ESCOLHA UMA PARTÍCULA DA BOLSA (teclas 1–" + Mathf.Min(9, G.Bag.Count) + ")</color>", small);
                y += 28;
                float bw = 82, bh = 86, gap = 10;
                for (int i = 0; i < G.Bag.Count; i++)
                {
                    var p = GameData.Particles[G.Bag[i]];
                    var br = new Rect(x + i * (bw + gap), y, bw, bh);
                    if (GUI.Button(br, GUIContent.none, button)) G.Choose(p.Id);
                    GUI.Label(new Rect(br.x + 6, br.y + 4, 20, 18), "<color=#a3a8b6>" + (i + 1) + "</color>", small);
                    GUI.Label(new Rect(br.x, br.y + 10, br.width, 48), Colored(p.Kana, p.Color), p.Kana.Length > 1 ? CenterOf(kanaBig, 26) : kanaBig);
                    GUI.Label(new Rect(br.x, br.y + 58, br.width, 22), p.Romaji, romajiSlot);
                }
            }
            if (GUI.Button(new Rect(r.xMax - 200, r.yMax - 70, 160, 46), "Sair  (Esc)", button)) G.CloseAltar();
            GUI.Label(new Rect(x, r.yMax - 64, w - 200, 40), "<color=#6b7080>A partícula certa ainda não está na bolsa? Saia e explore mais.</color>", small);
        }

        // ------------------------------------------------------------------ fim de andar, derrota, final
        void DrawLevelDone()
        {
            var info = G.LevelData;
            var r = Centered(760, 520);
            GUI.Box(r, GUIContent.none, panel);
            float x = r.x + 40, w = r.width - 80, y = r.y + 28;
            GUI.Label(new Rect(x, y, w, 24), "<color=#a3a8b6>ANDAR " + (G.LevelIndex + 1) + " CONCLUÍDO</color>", small); y += 26;
            GUI.Label(new Rect(x, y, w, 50), info.Name, title); y += 66;
            foreach (var id in info.ParticleIds)
            {
                var p = GameData.Particles[id];
                GUI.Label(new Rect(x, y, 90, 70), Colored(p.Kana, p.Color), p.Kana.Length > 1 ? CenterOf(kanaBig, 28) : kanaBig);
                GUI.Label(new Rect(x + 100, y + 4, w - 100, 26), "<b>" + p.Romaji + "</b> · <color=#f2a531>" + p.Function + "</color>", body);
                GUI.Label(new Rect(x + 100, y + 32, w - 100, 40), "<color=#c9c4b8>" + p.Detail + "</color>", small);
                y += 92;
            }
            bool last = G.LevelIndex + 1 >= GameData.Levels.Length;
            if (GUI.Button(new Rect(r.xMax - 340, r.yMax - 82, 300, 52), last ? "Abrir o Grimório  (Enter)" : "Próximo andar  (Enter)", button)) G.NextLevel();
        }

        void DrawGameOver()
        {
            var r = Centered(640, 300);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Label(new Rect(r.x + 40, r.y + 34, r.width - 80, 50), "O Pongo precisa de um cochilo…", title);
            GUI.Label(new Rect(r.x + 40, r.y + 100, r.width - 80, 90), "Os corações acabaram. O andar recomeça com as partículas de volta aos lugares. O que você aprendeu nos andares anteriores continua no grimório.", body);
            if (GUI.Button(new Rect(r.x + 40, r.yMax - 82, 260, 52), "Tentar de novo  (Enter)", button)) G.RetryLevel();
        }

        void DrawEnding()
        {
            GUI.DrawTexture(new Rect(0, 0, vw, RefH), dim);
            var r = Centered(1000, 660);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Label(new Rect(r.x + 40, r.y + 24, r.width - 80, 50), "O Grimório está completo!", title);
            GUI.Label(new Rect(r.x + 40, r.y + 78, r.width - 80, 30), "O Pongo devolveu as 12 partículas ao castelo. Aqui está o que cada uma faz:", body);
            DrawParticleTable(new Rect(r.x + 40, r.y + 122, r.width - 80, 440), true);
            if (GUI.Button(new Rect(r.xMax - 300, r.yMax - 76, 260, 52), "Jogar de novo  (Enter)", button)) G.StartGame();
        }

        void DrawGrimoire()
        {
            GUI.DrawTexture(new Rect(0, 0, vw, RefH), dim);
            var r = Centered(1000, 640);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Label(new Rect(r.x + 40, r.y + 22, r.width - 80, 50), "Grimório de Partículas", title);
            GUI.Label(new Rect(r.x + 40, r.y + 76, r.width - 80, 26), "<color=#a3a8b6>A função de cada partícula aparece aqui depois que você a usa certo num altar.</color>", small);
            DrawParticleTable(new Rect(r.x + 40, r.y + 112, r.width - 80, 440), false);
            if (GUI.Button(new Rect(r.xMax - 240, r.yMax - 70, 200, 46), "Fechar  (Tab)", button)) G.ToggleGrimoire();
        }

        void DrawParticleTable(Rect area, bool revealAll)
        {
            int i = 0;
            float colW = area.width / 2f - 10, rowH = 72;
            foreach (var p in GameData.AllInOrder())
            {
                float x = area.x + (i % 2) * (colW + 20), y = area.y + (i / 2) * rowH;
                bool learned = revealAll || G.Learned.Contains(p.Id), found = G.Bag.Contains(p.Id);
                GUI.Box(new Rect(x, y, colW, rowH - 8), GUIContent.none, learned ? slotLearned : slot);
                string kana = found || learned ? Colored(p.Kana, p.Color) : "<color=#4d5366>？</color>";
                GUI.Label(new Rect(x + 4, y + 4, 70, rowH - 16), kana, p.Kana.Length > 1 ? CenterOf(kanaSlot, 20) : kanaSlot);
                string text;
                if (learned) text = "<b>" + p.Romaji + "</b> · <color=#f2a531>" + p.Function + "</color>\n<color=#c9c4b8>" + p.Detail + "</color>";
                else if (found) text = "<b>" + p.Romaji + "</b>\n<color=#8a8f9e>Função desconhecida: teste num altar.</color>";
                else text = "<color=#6b7080>Ainda não encontrada.</color>";
                GUI.Label(new Rect(x + 78, y + 6, colW - 86, rowH - 16), text, small);
                i++;
            }
        }

        // ------------------------------------------------------------------ estilos
        Rect Centered(float w, float h)
        {
            w = Mathf.Min(w, vw - 32);
            return new Rect((vw - w) / 2f, (RefH - h) / 2f, w, h);
        }

        static string Colored(string s, Color32 c)
        {
            return "<color=#" + ColorUtility.ToHtmlStringRGB(c) + ">" + s + "</color>";
        }

        static GUIStyle CenterOf(GUIStyle s, int size = 0)
        {
            var c = new GUIStyle(s) { alignment = TextAnchor.MiddleCenter };
            if (size > 0) c.fontSize = size;
            return c;
        }

        GUIStyle Text(int size, Color color, FontStyle fs = FontStyle.Normal, TextAnchor anchor = TextAnchor.UpperLeft)
        {
            var st = new GUIStyle(GUI.skin.label);
            st.font = JpFont.Get();
            st.fontSize = size;
            st.fontStyle = fs;
            st.normal.textColor = color;
            st.alignment = anchor;
            st.wordWrap = true;
            st.richText = true;
            st.padding = new RectOffset(0, 0, 0, 0);
            return st;
        }

        void BuildStyles()
        {
            stylesReady = true;
            title = Text(36, Ink, FontStyle.Bold);
            title.wordWrap = false;
            h2 = Text(20, Gold);
            body = Text(19, Ink);
            small = Text(15, Ink);
            sentence = Text(38, Ink, FontStyle.Normal, TextAnchor.MiddleCenter);
            kanaBig = Text(38, Ink, FontStyle.Normal, TextAnchor.MiddleCenter);
            kanaSlot = Text(30, Ink, FontStyle.Normal, TextAnchor.MiddleCenter);
            romajiSlot = Text(14, Dim, FontStyle.Normal, TextAnchor.MiddleCenter);
            toast = Text(17, Ink, FontStyle.Normal, TextAnchor.MiddleCenter);
            toast.padding = new RectOffset(16, 16, 4, 4);

            panel = BoxStyle(new Color(0.07f, 0.09f, 0.15f, 0.94f), new Color(0.27f, 0.31f, 0.42f), 10);
            slot = BoxStyle(new Color(0.12f, 0.14f, 0.22f, 1f), new Color(0.24f, 0.28f, 0.38f), 6);
            slotLearned = BoxStyle(new Color(0.16f, 0.14f, 0.12f, 1f), new Color(0.95f, 0.65f, 0.19f), 6);

            button = new GUIStyle(GUI.skin.button);
            button.font = JpFont.Get();
            button.fontSize = 19;
            button.fontStyle = FontStyle.Bold;
            button.richText = true;
            button.normal.background = RoundTex(new Color(0.95f, 0.65f, 0.19f), new Color(0.75f, 0.48f, 0.1f), 6);
            button.hover.background = RoundTex(new Color(1f, 0.78f, 0.4f), new Color(0.85f, 0.58f, 0.15f), 6);
            button.active.background = RoundTex(new Color(0.85f, 0.55f, 0.12f), new Color(0.6f, 0.38f, 0.08f), 6);
            button.focused.background = button.normal.background;
            button.normal.textColor = button.hover.textColor = button.active.textColor = button.focused.textColor = new Color(0.12f, 0.07f, 0.02f);
            button.border = new RectOffset(8, 8, 8, 8);
            button.alignment = TextAnchor.MiddleCenter;

            feedbackBad = BoxStyle(new Color(0.3f, 0.1f, 0.12f, 1f), new Color(1f, 0.49f, 0.43f), 6);
            feedbackBad.font = JpFont.Get(); feedbackBad.fontSize = 17; feedbackBad.normal.textColor = Ink; feedbackBad.wordWrap = true; feedbackBad.richText = true;
            feedbackBad.alignment = TextAnchor.MiddleLeft; feedbackBad.padding = new RectOffset(16, 16, 8, 8);
            feedbackGood = new GUIStyle(feedbackBad);
            feedbackGood.normal.background = RoundTex(new Color(0.18f, 0.15f, 0.08f, 1f), new Color(0.95f, 0.65f, 0.19f), 6);
            feedbackGood.fontSize = 19;

            heartFull = Art.Heart(true);
            heartEmpty = Art.Heart(false);
            dim = SolidTex(new Color(0.02f, 0.03f, 0.07f, 0.72f));
            var pongo = Art.Pongo(PongoController.SpriteHeight);
            pongoTex = pongo != null ? pongo.texture : null;
        }

        GUIStyle BoxStyle(Color fill, Color border, int radius)
        {
            var st = new GUIStyle(GUI.skin.box);
            st.normal.background = RoundTex(fill, border, radius);
            st.border = new RectOffset(radius + 2, radius + 2, radius + 2, radius + 2);
            st.richText = true;
            return st;
        }

        static Texture2D SolidTex(Color c)
        {
            var t = new Texture2D(1, 1);
            t.SetPixel(0, 0, c);
            t.Apply();
            return t;
        }

        /// <summary>Textura de caixa com cantos arredondados e borda de 2 px (fatiada em 9 pelo GUIStyle.border).</summary>
        static Texture2D RoundTex(Color fill, Color border, int radius)
        {
            int size = radius * 2 + 6;
            var t = new Texture2D(size, size, TextureFormat.RGBA32, false);
            t.filterMode = FilterMode.Bilinear;
            t.wrapMode = TextureWrapMode.Clamp;
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float cx = Mathf.Clamp(x + 0.5f, radius, size - radius), cy = Mathf.Clamp(y + 0.5f, radius, size - radius);
                    float d = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), new Vector2(cx, cy));
                    Color c;
                    if (d > radius) c = new Color(0, 0, 0, 0);
                    else if (d > radius - 2f || x < 2 && d <= radius || y < 2 || x >= size - 2 || y >= size - 2) c = border;
                    else c = fill;
                    if (d > radius - 1f && d <= radius) c.a *= radius - d;
                    t.SetPixel(x, y, c);
                }
            t.Apply();
            return t;
        }
    }
}
