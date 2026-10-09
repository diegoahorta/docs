using UnityEngine;

namespace PongoParticulas
{
    static class Is
    {
        public static PongoController Pongo(Collider2D c)
        {
            return c != null ? c.GetComponent<PongoController>() : null;
        }
    }

    /// <summary>Partícula japonesa flutuando: o artefato que o Pongo coleta.</summary>
    public class ParticleArtifact : MonoBehaviour
    {
        public ParticleInfo Info;
        Vector3 basePos;
        float seed;
        bool taken;

        public static ParticleArtifact Create(Transform parent, Vector2 pos, ParticleInfo info)
        {
            var go = new GameObject("Partícula " + info.Kana);
            go.transform.SetParent(parent, false);
            go.transform.position = pos;
            var a = go.AddComponent<ParticleArtifact>();
            a.Info = info;

            var glow = new GameObject("Brilho");
            glow.transform.SetParent(go.transform, false);
            var gsr = Compat.AddSprite(glow, Art.Glow(), 9);
            gsr.color = new Color(info.Color.r / 255f, info.Color.g / 255f, info.Color.b / 255f, 0.55f);
            glow.transform.localScale = Vector3.one * 1.6f;
            glow.AddComponent<Flicker>().Amount = 0.15f;

            var orb = Compat.AddSprite(go, Art.Orb(), 10);
            orb.color = info.Color;
            WorldLabel.Create(go.transform, new Vector3(0f, 0.02f, 0f), info.Kana, info.Kana.Length > 1 ? 0.32f : 0.5f, Color.white, 11);

            var col = go.AddComponent<CircleCollider2D>();
            col.isTrigger = true;
            col.radius = 0.45f;
            return a;
        }

        void Start() { basePos = transform.position; seed = Random.value * 6f; }

        void Update()
        {
            transform.position = basePos + Vector3.up * Mathf.Sin(Time.time * 2.4f + seed) * 0.12f;
        }

        void OnTriggerEnter2D(Collider2D other)
        {
            if (taken || Is.Pongo(other) == null || GameManager.I == null) return;
            taken = true;
            GameManager.I.Collect(this);
        }
    }

    /// <summary>Altar da função: pede a partícula certa para completar a frase.</summary>
    public class Altar : MonoBehaviour
    {
        public AltarInfo Info;
        public bool Solved;
        SpriteRenderer pedestal;
        WorldLabel slot, prompt;
        GameObject glow;
        Theme theme;

        public static Altar Create(Transform parent, Vector2 pos, AltarInfo info, Theme th)
        {
            var go = new GameObject("Altar " + info.ParticleId);
            go.transform.SetParent(parent, false);
            go.transform.position = pos;
            var a = go.AddComponent<Altar>();
            a.Info = info;
            a.theme = th;
            a.pedestal = Compat.AddSprite(go, Art.Altar(th, false), 5);

            a.glow = new GameObject("Brilho");
            a.glow.transform.SetParent(go.transform, false);
            a.glow.transform.localPosition = new Vector3(0f, 2.3f, 0f);
            a.glow.transform.localScale = Vector3.one * 2.6f;
            var gsr = Compat.AddSprite(a.glow, Art.Glow(), 4);
            gsr.color = new Color(th.Accent.r / 255f, th.Accent.g / 255f, th.Accent.b / 255f, 0.6f);
            a.glow.AddComponent<Flicker>();
            a.glow.SetActive(false);

            a.slot = WorldLabel.Create(go.transform, new Vector3(0f, 2.55f, 0f), "?", 0.55f, new Color(1f, 1f, 1f, 0.55f), 6);
            a.prompt = WorldLabel.Create(go.transform, new Vector3(0f, 3.35f, 0f), "E", 0.4f, new Color(1f, 0.85f, 0.5f), 6);
            a.prompt.SetVisible(false);

            var col = go.AddComponent<BoxCollider2D>();
            col.isTrigger = true;
            col.size = new Vector2(1.6f, 2.2f);
            col.offset = new Vector2(0f, 1.1f);
            return a;
        }

        public void ShowPrompt(bool v) { if (prompt != null) prompt.SetVisible(v && !Solved); }

        public void SetSolved(ParticleInfo p)
        {
            Solved = true;
            pedestal.sprite = Art.Altar(theme, true);
            slot.Set(p.Kana, p.Color);
            glow.SetActive(true);
            ShowPrompt(false);
            Sparks.Burst(transform.position + Vector3.up * 2.4f, p.Color, 26);
        }

        void OnTriggerEnter2D(Collider2D other)
        {
            if (Is.Pongo(other) != null && GameManager.I != null) GameManager.I.SetNearAltar(this, true);
        }

        void OnTriggerExit2D(Collider2D other)
        {
            if (Is.Pongo(other) != null && GameManager.I != null) GameManager.I.SetNearAltar(this, false);
        }
    }

    /// <summary>Porta de saída: abre quando os três altares estão acesos.</summary>
    public class ExitDoor : MonoBehaviour
    {
        public bool Open;
        SpriteRenderer sr;
        WorldLabel counter;
        Theme theme;
        GameObject glow;

        public static ExitDoor Create(Transform parent, Vector2 bottomLeft, Theme th)
        {
            var go = new GameObject("Porta");
            go.transform.SetParent(parent, false);
            go.transform.position = bottomLeft;
            var d = go.AddComponent<ExitDoor>();
            d.theme = th;
            d.sr = Compat.AddSprite(go, Art.Door(th, false), 4);
            d.counter = WorldLabel.Create(go.transform, new Vector3(1f, 3.45f, 0f), "0/3", 0.36f, new Color(1f, 0.9f, 0.7f), 6);
            d.glow = new GameObject("Luz");
            d.glow.transform.SetParent(go.transform, false);
            d.glow.transform.localPosition = new Vector3(1f, 1.2f, 0f);
            d.glow.transform.localScale = Vector3.one * 4f;
            var g = Compat.AddSprite(d.glow, Art.Glow(), 3);
            g.color = new Color(th.Accent.r / 255f, th.Accent.g / 255f, th.Accent.b / 255f, 0.55f);
            d.glow.SetActive(false);
            var col = go.AddComponent<BoxCollider2D>();
            col.isTrigger = true;
            col.size = new Vector2(1.2f, 2.4f);
            col.offset = new Vector2(1f, 1.2f);
            return d;
        }

        public void SetCount(int solved, int total)
        {
            counter.Set(solved + "/" + total, solved >= total ? new Color(1f, 0.85f, 0.4f) : new Color(1f, 0.9f, 0.7f));
        }

        public void OpenDoor()
        {
            if (Open) return;
            Open = true;
            sr.sprite = Art.Door(theme, true);
            glow.SetActive(true);
            Sparks.Burst(transform.position + new Vector3(1f, 1.5f, 0f), theme.Accent, 30);
        }

        void OnTriggerStay2D(Collider2D other)
        {
            if (Open && Is.Pongo(other) != null && GameManager.I != null) GameManager.I.ReachDoor();
        }
    }

    /// <summary>Vela de checkpoint: o Pongo volta aqui depois de cair.</summary>
    public class Checkpoint : MonoBehaviour
    {
        SpriteRenderer sr;
        GameObject glow;
        bool lit;

        public static Checkpoint Create(Transform parent, Vector2 pos)
        {
            var go = new GameObject("Vela");
            go.transform.SetParent(parent, false);
            go.transform.position = pos;
            var c = go.AddComponent<Checkpoint>();
            c.sr = Compat.AddSprite(go, Art.Candle(false), 5);
            c.glow = new GameObject("Luz");
            c.glow.transform.SetParent(go.transform, false);
            c.glow.transform.localPosition = new Vector3(0f, 1.3f, 0f);
            c.glow.transform.localScale = Vector3.one * 2.5f;
            var g = Compat.AddSprite(c.glow, Art.Glow(), 4);
            g.color = new Color(1f, 0.75f, 0.35f, 0.5f);
            c.glow.AddComponent<Flicker>();
            c.glow.SetActive(false);
            var col = go.AddComponent<BoxCollider2D>();
            col.isTrigger = true;
            col.size = new Vector2(1f, 2f);
            col.offset = new Vector2(0f, 1f);
            return c;
        }

        void OnTriggerEnter2D(Collider2D other)
        {
            var p = Is.Pongo(other);
            if (p == null || lit) return;
            lit = true;
            sr.sprite = Art.Candle(true);
            glow.SetActive(true);
            p.SetRespawn(transform.position + Vector3.up * 0.05f);
            Sfx.Play(Sfx.Checkpoint);
            if (GameManager.I != null) GameManager.I.Toast("Vela acesa: você volta aqui se cair.");
        }
    }

    /// <summary>Espinhos: tiram um coração e levam de volta à última vela.</summary>
    public class Hazard : MonoBehaviour
    {
        void OnTriggerEnter2D(Collider2D other)
        {
            if (Is.Pongo(other) != null && GameManager.I != null) GameManager.I.PlayerHitSpikes();
        }
    }
}
