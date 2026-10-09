using System.Collections.Generic;
using UnityEngine;

namespace PongoParticulas
{
    public enum GameState { Title, Intro, Playing, Altar, LevelDone, GameOver, Ending }

    public enum FeedbackKind { None, Correct, Wrong }

    /// <summary>
    /// Regras do jogo: fases, corações, bolsa de partículas, altares e porta.
    /// O tempo para (timeScale 0) sempre que um painel está aberto.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager I { get; private set; }
        public const int MaxHearts = 5;

        public GameState State { get; private set; }
        public bool GrimoireOpen { get; private set; }
        public int LevelIndex { get; private set; }
        public int Hearts { get; private set; }
        public BuiltLevel Level { get; private set; }
        public PongoController Pongo { get; private set; }
        public Altar NearAltar { get; private set; }
        public Altar CurrentAltar { get; private set; }
        public FeedbackKind Feedback { get; private set; }
        public string FeedbackParticle { get; private set; }
        public string ToastText { get; private set; }
        public float ToastUntil { get; private set; }

        /// <summary>Partículas coletadas, na ordem em que foram achadas (vale para o jogo todo).</summary>
        public readonly List<string> Bag = new List<string>();
        /// <summary>Partículas já combinadas com a função certa: aparecem completas no grimório.</summary>
        public readonly HashSet<string> Learned = new HashSet<string>();

        List<string> bagAtLevelStart = new List<string>();
        HashSet<string> learnedAtLevelStart = new HashSet<string>();
        Transform world;
        Camera cam;
        CameraFollow follow;
        float lastFallTime = -10f;

        public bool IsPlaying { get { return State == GameState.Playing && !GrimoireOpen; } }
        public LevelInfo LevelData { get { return GameData.Levels[LevelIndex]; } }
        public int AltarsSolved
        {
            get
            {
                int n = 0;
                if (Level != null) foreach (var a in Level.Altars) if (a.Solved) n++;
                return n;
            }
        }

        void Awake()
        {
            if (I != null && I != this) { Destroy(gameObject); return; }
            I = this;
            Physics2D.queriesHitTriggers = false;
            Sfx.Init(gameObject);
            gameObject.AddComponent<GameUI>();
            world = new GameObject("Mundo").transform;
            SetupCamera();
            LoadLevel(0);          // a primeira fase aparece atrás da tela de título
            State = GameState.Title;
        }

        void OnDestroy() { if (I == this) I = null; Time.timeScale = 1f; }

        void SetupCamera()
        {
            cam = Camera.main;
            if (cam == null)
            {
                var go = new GameObject("Main Camera");
                go.tag = "MainCamera";
                cam = go.AddComponent<Camera>();
                go.AddComponent<AudioListener>();
            }
            cam.orthographic = true;
            cam.orthographicSize = 6.2f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.transform.rotation = Quaternion.identity;
            follow = cam.GetComponent<CameraFollow>();
            if (follow == null) follow = cam.gameObject.AddComponent<CameraFollow>();
        }

        void Update()
        {
            if (State == GameState.Playing)
            {
                if (GameInput.Grimoire) GrimoireOpen = !GrimoireOpen;
                else if (GrimoireOpen && GameInput.Cancel) GrimoireOpen = false;
                else if (!GrimoireOpen && GameInput.Interact && NearAltar != null && !NearAltar.Solved) OpenAltar(NearAltar);
            }
            Time.timeScale = IsPlaying ? 1f : 0f;
        }

        void LateUpdate() { GameInput.EndFrame(); }

        void OnApplicationFocus(bool focus) { if (!focus) GameInput.Clear(); }

        // ------------------------------------------------------------------ fluxo
        public void StartGame()
        {
            Bag.Clear();
            Learned.Clear();
            LoadLevel(0);
            State = GameState.Intro;
        }

        public void BeginLevel()
        {
            State = GameState.Playing;
            GameInput.Clear();
        }

        void LoadLevel(int index)
        {
            if (Level != null) Destroy(Level.Root);
            if (Pongo != null) Destroy(Pongo.gameObject);
            LevelIndex = index;
            Hearts = MaxHearts;
            NearAltar = null;
            CurrentAltar = null;
            GrimoireOpen = false;
            ToastText = null;
            bagAtLevelStart = new List<string>(Bag);
            learnedAtLevelStart = new HashSet<string>(Learned);

            Level = LevelBuilder.Build(LevelData, world);
            Pongo = PongoController.Create(Level.Start, world);
            cam.backgroundColor = (Color)Level.Theme.SkyTop;
            follow.Target = Pongo.transform;
            follow.Bounds = Level.Bounds;
            follow.Snap();
            if (Level.Door != null) Level.Door.SetCount(0, Level.Altars.Count);
        }

        public void RetryLevel()
        {
            Bag.Clear(); Bag.AddRange(bagAtLevelStart);
            Learned.Clear(); foreach (var id in learnedAtLevelStart) Learned.Add(id);
            LoadLevel(LevelIndex);
            State = GameState.Playing;
            GameInput.Clear();
        }

        public void NextLevel()
        {
            if (LevelIndex + 1 < GameData.Levels.Length)
            {
                LoadLevel(LevelIndex + 1);
                State = GameState.Intro;
            }
            else State = GameState.Ending;
        }

        public void ToggleGrimoire() { if (State == GameState.Playing) GrimoireOpen = !GrimoireOpen; }

        public void Toast(string text)
        {
            ToastText = text;
            ToastUntil = Time.unscaledTime + 3.5f;
        }

        // ------------------------------------------------------------------ eventos do mundo
        public void Collect(ParticleArtifact a)
        {
            var p = a.Info;
            if (!Bag.Contains(p.Id)) Bag.Add(p.Id);
            Sfx.Play(Sfx.Pickup);
            Sparks.Burst(a.transform.position, p.Color, 22);
            Destroy(a.gameObject);
            Toast("Você encontrou " + p.Kana + " (" + p.Romaji + ")! Leve até o altar que pede a função dela.");
        }

        public void SetNearAltar(Altar altar, bool inside)
        {
            if (inside)
            {
                if (NearAltar != null && NearAltar != altar) NearAltar.ShowPrompt(false);
                NearAltar = altar;
                altar.ShowPrompt(true);
            }
            else if (NearAltar == altar)
            {
                altar.ShowPrompt(false);
                NearAltar = null;
            }
        }

        public void PlayerHurt(Vector2 from)
        {
            if (!IsPlaying || Pongo == null) return;
            if (Pongo.Hurt(from)) LoseHeart();
        }

        public void PlayerHitSpikes() { FallBack(); }
        public void PlayerFell() { FallBack(); }

        void FallBack()
        {
            if (!IsPlaying || Pongo == null || Time.unscaledTime - lastFallTime < 0.5f) return;
            lastFallTime = Time.unscaledTime;
            Sfx.Play(Sfx.Hurt);
            Pongo.Respawn();
            LoseHeart();
        }

        void LoseHeart()
        {
            Hearts = Mathf.Max(0, Hearts - 1);
            if (Hearts == 0)
            {
                State = GameState.GameOver;
                GrimoireOpen = false;
            }
        }

        public void ReachDoor()
        {
            if (State != GameState.Playing) return;
            Sfx.Play(Sfx.Door);
            State = GameState.LevelDone;
        }

        // ------------------------------------------------------------------ altar
        void OpenAltar(Altar altar)
        {
            CurrentAltar = altar;
            Feedback = FeedbackKind.None;
            FeedbackParticle = null;
            State = GameState.Altar;
            Pongo.Freeze();
        }

        public void CloseAltar()
        {
            if (State != GameState.Altar) return;
            CurrentAltar = null;
            State = Hearts > 0 ? GameState.Playing : GameState.GameOver;
            GameInput.Clear();
        }

        /// <summary>O jogador escolheu uma partícula da bolsa para o altar aberto.</summary>
        public void Choose(string particleId)
        {
            if (State != GameState.Altar || CurrentAltar == null || CurrentAltar.Solved) return;
            FeedbackParticle = particleId;
            var p = GameData.Particles[particleId];
            if (particleId == CurrentAltar.Info.ParticleId)
            {
                Feedback = FeedbackKind.Correct;
                Learned.Add(particleId);
                CurrentAltar.SetSolved(p);
                Sfx.Play(Sfx.Correct);
                int solved = AltarsSolved, total = Level.Altars.Count;
                if (Level.Door != null)
                {
                    Level.Door.SetCount(solved, total);
                    if (solved >= total)
                    {
                        Level.Door.OpenDoor();
                        Toast("Os três altares estão acesos: a porta se abriu!");
                    }
                }
            }
            else
            {
                Feedback = FeedbackKind.Wrong;
                Sfx.Play(Sfx.Wrong);
                Hearts = Mathf.Max(0, Hearts - 1);
            }
        }
    }
}
