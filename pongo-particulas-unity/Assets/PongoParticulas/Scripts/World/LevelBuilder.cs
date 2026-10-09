using System.Collections.Generic;
using UnityEngine;

namespace PongoParticulas
{
    /// <summary>Resultado da montagem de uma fase.</summary>
    public class BuiltLevel
    {
        public GameObject Root;
        public Vector2 Start;
        public Rect Bounds;
        public ExitDoor Door;
        public List<Altar> Altars = new List<Altar>();
        public List<ParticleArtifact> Artifacts = new List<ParticleArtifact>();
        public Theme Theme;
    }

    /// <summary>
    /// Transforma o mapa de texto numa fase: duas texturas grandes (fundo e blocos),
    /// colisores agrupados por linha, decoração com luzes e todos os objetos do jogo.
    /// Célula (x, linha) ocupa o quadrado [x, x+1] × [H-1-linha, H-linha] no mundo.
    /// </summary>
    public static class LevelBuilder
    {
        public static BuiltLevel Build(LevelInfo level, Transform parent)
        {
            var th = Theme.Get(level.Theme);
            string[] m = level.Map;
            int w = m[0].Length, h = m.Length;
            var built = new BuiltLevel { Theme = th, Bounds = new Rect(0, 0, w, h) };
            var root = new GameObject("Fase: " + level.Name);
            root.transform.SetParent(parent, false);
            built.Root = root;

            // camadas pintadas
            var bg = new GameObject("Fundo");
            bg.transform.SetParent(root.transform, false);
            Compat.AddSprite(bg, Art.PaintBackground(level, th), -100);
            var fg = new GameObject("Blocos");
            fg.transform.SetParent(root.transform, false);
            Compat.AddSprite(fg, Art.PaintForeground(level, th), 0);

            BuildColliders(m, root.transform);

            // bordas invisíveis (o pátio não tem paredes)
            AddBox(root.transform, "Borda esquerda", new Vector2(-0.5f, h / 2f + 4f), new Vector2(1f, h + 8f));
            AddBox(root.transform, "Borda direita", new Vector2(w + 0.5f, h / 2f + 4f), new Vector2(1f, h + 8f));

            int movers = 0;
            for (int r = 0; r < h; r++)
                for (int x = 0; x < w; x++)
                {
                    char ch = m[r][x];
                    var bottom = new Vector2(x + 0.5f, h - 1 - r);   // centro da base da célula
                    var corner = new Vector2(x, h - 1 - r);          // canto inferior esquerdo
                    switch (ch)
                    {
                        case 'P': built.Start = bottom + Vector2.up * 0.05f; break;
                        case '1': case '2': case '3':
                        {
                            int i = ch - '1';
                            var info = GameData.Particles[level.ParticleIds[i]];
                            built.Artifacts.Add(ParticleArtifact.Create(root.transform, bottom + Vector2.up * 0.5f, info));
                            break;
                        }
                        case 'a': case 'b': case 'c':
                            built.Altars.Add(Altar.Create(root.transform, bottom, level.Altars[ch - 'a'], th));
                            break;
                        case 'D': built.Door = ExitDoor.Create(root.transform, corner, th); break;
                        case 'E': Enemy.Create(root.transform, bottom, th); break;
                        case 'C': Checkpoint.Create(root.transform, bottom); break;
                        case 'm': MovingPlatform.Create(root.transform, new Vector2(x + 1f, h - r), th, movers++); break;
                        case 'W': case 'B': case 'K': case 'F': case 'N': case 'T': case 'L': case 'H':
                            AddDecor(root.transform, ch, corner, th, x, w);
                            break;
                    }
                }
            // altares em ordem a, b, c (a lista acima segue a ordem de leitura do mapa)
            built.Altars.Sort((p, q) => System.Array.IndexOf(level.Altars, p.Info).CompareTo(System.Array.IndexOf(level.Altars, q.Info)));
            return built;
        }

        static void BuildColliders(string[] m, Transform root)
        {
            int w = m[0].Length, h = m.Length;
            var solids = new GameObject("Colisores");
            solids.transform.SetParent(root, false);
            for (int r = 0; r < h; r++)
            {
                int x = 0;
                while (x < w)
                {
                    char ch = m[r][x];
                    if (ch != '#' && ch != '-' && ch != '^') { x++; continue; }
                    int start = x;
                    while (x < w && m[r][x] == ch) x++;
                    float len = x - start, y = h - 1 - r;
                    if (ch == '#')
                    {
                        AddBox(solids.transform, "Bloco", new Vector2(start + len / 2f, y + 0.5f), new Vector2(len, 1f));
                    }
                    else if (ch == '-')
                    {
                        var go = AddBox(solids.transform, "Plataforma", new Vector2(start + len / 2f, y + 0.85f), new Vector2(len, 0.3f));
                        go.GetComponent<BoxCollider2D>().usedByEffector = true;
                        var eff = go.AddComponent<PlatformEffector2D>();
                        eff.useOneWay = true;
                        eff.surfaceArc = 160f;
                    }
                    else
                    {
                        var go = new GameObject("Espinhos");
                        go.transform.SetParent(solids.transform, false);
                        go.transform.position = new Vector2(start + len / 2f, y + 0.35f);
                        var col = go.AddComponent<BoxCollider2D>();
                        col.isTrigger = true;
                        col.size = new Vector2(len - 0.1f, 0.5f);
                        go.AddComponent<Hazard>();
                    }
                }
            }
        }

        static GameObject AddBox(Transform parent, string name, Vector2 center, Vector2 size)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.position = center;
            var col = go.AddComponent<BoxCollider2D>();
            col.size = size;
            return go;
        }

        static void AddDecor(Transform parent, char kind, Vector2 corner, Theme th, int tileX, int width)
        {
            var go = new GameObject("Decoração " + kind);
            go.transform.SetParent(parent, false);
            go.transform.position = corner;
            Compat.AddSprite(go, Art.Decor(kind, th, tileX, width), -50);
            Vector2 off; Color col; float size;
            if (Art.DecorLight(kind, th, out off, out col, out size))
            {
                var glow = new GameObject("Luz");
                glow.transform.SetParent(go.transform, false);
                glow.transform.localPosition = off;
                glow.transform.localScale = Vector3.one * size;
                var sr = Compat.AddSprite(glow, Art.Glow(), -45);
                col.a = kind == 'W' ? 0.28f : 0.42f;
                sr.color = col;
                var f = glow.AddComponent<Flicker>();
                f.Amount = kind == 'W' ? 0.03f : 0.12f;
            }
        }
    }
}
