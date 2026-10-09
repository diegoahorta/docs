using System.Collections.Generic;
using UnityEngine;

namespace PongoParticulas
{
    /// <summary>Uma partícula japonesa: o "artefato" que o Pongo coleta.</summary>
    public class ParticleInfo
    {
        public string Id;        // romaji, usado como chave
        public string Kana;
        public string Romaji;
        public string Function;  // nome curto da função (aparece no altar)
        public string Detail;    // explicação em português
        public string Note;      // observação de leitura, se houver
        public Color32 Color;

        public ParticleInfo(string id, string kana, string romaji, string function, string detail, string note, Color32 color)
        {
            Id = id; Kana = kana; Romaji = romaji; Function = function; Detail = detail; Note = note; Color = color;
        }
    }

    /// <summary>Um altar: uma frase com lacuna que pede uma função.</summary>
    public class AltarInfo
    {
        public string ParticleId;
        public string JpBefore, JpAfter;
        public string RomajiBefore, RomajiAfter;
        public string Portuguese;

        public AltarInfo(string particleId, string jpBefore, string jpAfter, string romajiBefore, string romajiAfter, string portuguese)
        {
            ParticleId = particleId; JpBefore = jpBefore; JpAfter = jpAfter;
            RomajiBefore = romajiBefore; RomajiAfter = romajiAfter; Portuguese = portuguese;
        }
    }

    public enum ThemeId { Courtyard, Dungeon, Commons, Library }

    public class LevelInfo
    {
        public string Name;
        public string Story;
        public ThemeId Theme;
        public string[] ParticleIds; // '1', '2', '3' no mapa
        public AltarInfo[] Altars;   // 'a', 'b', 'c' no mapa
        public string[] Map;
    }

    /// <summary>
    /// Todo o conteúdo do jogo. Legenda dos mapas (linha 0 = topo):
    /// # bloco   - plataforma (atravessável por baixo)   ^ espinhos   P início
    /// 1 2 3 partículas   a b c altares   D porta (2x3)   E inimigo   C vela de checkpoint
    /// m livro voador (plataforma móvel)
    /// Decoração: W janela  B estante  K caldeirão  F lareira  N estandarte  T tocha  L lanterna  H prateleira
    /// </summary>
    public static class GameData
    {
        public static readonly Dictionary<string, ParticleInfo> Particles = new Dictionary<string, ParticleInfo>();

        static void Add(ParticleInfo p) { Particles[p.Id] = p; }

        static GameData()
        {
            Add(new ParticleInfo("wa", "は", "wa", "TÓPICO", "Marca o tópico: o assunto de que a frase fala.", "Escreve-se は (ha), mas como partícula lê-se \"wa\".", new Color32(255, 196, 92, 255)));
            Add(new ParticleInfo("no", "の", "no", "POSSE / LIGAÇÃO", "Liga dois substantivos: de quem é, de onde é. Como o \"de\" do português.", "", new Color32(140, 200, 255, 255)));
            Add(new ParticleInfo("ka", "か", "ka", "PERGUNTA", "No fim da frase, transforma a afirmação em pergunta.", "", new Color32(255, 140, 190, 255)));
            Add(new ParticleInfo("o", "を", "o", "OBJETO DIRETO", "Marca o que recebe a ação do verbo.", "Escreve-se を (wo), mas lê-se \"o\".", new Color32(190, 140, 255, 255)));
            Add(new ParticleInfo("de", "で", "de", "LUGAR DA AÇÃO / MEIO", "Onde a ação acontece, ou com que ferramenta ela é feita.", "", new Color32(120, 230, 200, 255)));
            Add(new ParticleInfo("to", "と", "to", "E / COM", "Liga substantivos (\"e\") ou diz com quem (\"com\").", "", new Color32(255, 170, 120, 255)));
            Add(new ParticleInfo("ni", "に", "ni", "EXISTÊNCIA / HORA / DESTINO", "Onde algo está, a que horas algo acontece, ou para onde vai.", "", new Color32(255, 110, 110, 255)));
            Add(new ParticleInfo("e", "へ", "e", "DIREÇÃO", "Para onde o movimento vai.", "Escreve-se へ (he), mas lê-se \"e\".", new Color32(110, 220, 120, 255)));
            Add(new ParticleInfo("ga", "が", "ga", "SUJEITO", "Marca quem faz ou o que existe; destaca uma informação nova.", "", new Color32(120, 160, 255, 255)));
            Add(new ParticleInfo("mo", "も", "mo", "TAMBÉM", "Substitui は ou が para dizer \"também\".", "", new Color32(255, 220, 110, 255)));
            Add(new ParticleInfo("kara", "から", "kara", "PONTO DE PARTIDA", "De onde, ou a partir de quando.", "", new Color32(130, 210, 255, 255)));
            Add(new ParticleInfo("made", "まで", "made", "LIMITE", "Até onde, ou até quando.", "", new Color32(200, 170, 255, 255)));
        }

        public static readonly LevelInfo[] Levels =
        {
            new LevelInfo
            {
                Name = "Pátio das Rochas",
                Story = "O castelo-maquete ganhou vida! As partículas mágicas do japonês fugiram do Grimório e se espalharam pelo castelo. Sem elas, nenhuma frase funciona. Encontre cada partícula e leve até o altar que pede a função dela.",
                Theme = ThemeId.Courtyard,
                ParticleIds = new[] { "wa", "no", "ka" },
                Altars = new[]
                {
                    new AltarInfo("wa", "わたし", "ポンゴです。", "Watashi", "Pongo desu.", "Eu sou o Pongo."),
                    new AltarInfo("no", "ポンゴ", "シャツ", "Pongo", "shatsu", "a camisa do Pongo"),
                    new AltarInfo("ka", "これは しろです", "。", "Kore wa shiro desu", ".", "Isto é um castelo?")
                },
                Map = new[]
                {
                "..................................................................",
                "..................................................................",
                "..................................................................",
                "..................................................................",
                "...................................................3..............",
                "......................................2...........----............",
                "....................................-----.........................",
                "..................................................................",
                "................................................----......L.c..D..",
                "..........1.......................#######...............##########",
                "........-----.....a...........C.L.#######...............##########",
                "................#####.......#############............#############",
                "..P..L........C.#####..E....#############.....L.b..E.#############",
                "#########...#############...#############....#####################",
                "#########^^^#############^^^#############^^^^#####################",
                "##################################################################",
                }
            },
            new LevelInfo
            {
                Name = "Masmorra das Poções",
                Story = "Lá embaixo, entre caldeirões e frascos, mais três partículas se esconderam. Cuidado com as gotas de poção que andam pelo chão: pule em cima delas!",
                Theme = ThemeId.Dungeon,
                ParticleIds = new[] { "o", "de", "to" },
                Altars = new[]
                {
                    new AltarInfo("o", "ポーション", "のみます。", "Pōshon", "nomimasu.", "(Eu) bebo a poção."),
                    new AltarInfo("de", "なべ", "ポーションを つくります。", "Nabe", "pōshon o tsukurimasu.", "Faço a poção no caldeirão."),
                    new AltarInfo("to", "ねこ", "いぬ", "neko", "inu", "o gato e o cachorro")
                },
                Map = new[]
                {
                "##################################################################",
                "#................................................................#",
                "#................................................................#",
                "#................................................................#",
                "#.............W..................................................#",
                "#............................2...................................#",
                "#..........................-----....W............3...............#",
                "#.................H............................-----......H......#",
                "#...W..1.................................................T.......#",
                "#....-----............-----....................T.................#",
                "#.......T....................................######..............#",
                "#.P.......K.........a....E........C..K..b..E.######.....c....D...#",
                "#############....############....##################...############",
                "#############^^^^############^^^^##################^^^############",
                "##################################################################",
                }
            },
            new LevelInfo
            {
                Name = "Salas Comunais",
                Story = "Quatro salas, quatro cores: vermelha, verde, azul e amarela. Atravesse todas para achar as partículas que marcam lugar, direção e sujeito.",
                Theme = ThemeId.Commons,
                ParticleIds = new[] { "ni", "e", "ga" },
                Altars = new[]
                {
                    new AltarInfo("ni", "へや", "ねこが います。", "Heya", "neko ga imasu.", "Há um gato na sala."),
                    new AltarInfo("e", "としょかん", "いきます。", "Toshokan", "ikimasu.", "Vou para a biblioteca."),
                    new AltarInfo("ga", "ほし", "きれいです。", "Hoshi", "kirei desu.", "As estrelas são bonitas.")
                },
                Map = new[]
                {
                "############################################################################",
                "#..........................................................................#",
                "#..........................................................................#",
                "#..........................................................................#",
                "#..............1........................2..................................#",
                "#............-----...................------.................3..............#",
                "#.........................................................-----............#",
                "#..........N....................................................N..........#",
                "#........-----...................-----.....................................#",
                "#.............W..........W.....................W.........######......N.....#",
                "#.P...F..........a.....C...E..F.....B....B...b........E..######...c....D...#",
                "###################...###########################...########################",
                "###################^^^###########################^^^########################",
                "############################################################################",
                }
            },
            new LevelInfo
            {
                Name = "Torre da Biblioteca",
                Story = "No alto da torre, os livros voam de um lado para o outro. Use os livros voadores como plataforma para recuperar as três últimas partículas.",
                Theme = ThemeId.Library,
                ParticleIds = new[] { "mo", "kara", "made" },
                Altars = new[]
                {
                    new AltarInfo("mo", "わたし", "いぬです。", "Watashi", "inu desu.", "Eu também sou um cachorro."),
                    new AltarInfo("kara", "くじ", "よみます。", "Ku-ji", "yomimasu.", "Leio a partir das nove horas."),
                    new AltarInfo("made", "ごじ", "よみます。", "Go-ji", "yomimasu.", "Leio até as cinco horas.")
                },
                Map = new[]
                {
                "##########################################################################",
                "#........................................................................#",
                "#........................................................................#",
                "#..................................2.....................................#",
                "#................................-----...................................#",
                "#............W...........................................................#",
                "#....1..........................................W.................3......#",
                "#..-----....................-----...............................-----....#",
                "#........................................................................#",
                "#........................................................................#",
                "#.......---...m........-----.........................m......####.........#",
                "#................................m..........W...............####.........#",
                "#.P..B.............C.a...B..E...........b......E..........c.####..B...D..#",
                "###########.......#############......##############.....##################",
                "###########^^^^^^^#############^^^^^^##############^^^^^##################",
                "##########################################################################",
                }
            }
        };

        /// <summary>Ordem do grimório: na ordem em que as partículas aparecem nas fases.</summary>
        public static IEnumerable<ParticleInfo> AllInOrder()
        {
            foreach (var level in Levels)
                foreach (var id in level.ParticleIds)
                    yield return Particles[id];
        }
    }
}
