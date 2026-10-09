using UnityEngine;

namespace PongoParticulas
{
    /// <summary>Texto no mundo (kana sobre as partículas e altares) com a fonte japonesa.</summary>
    public class WorldLabel : MonoBehaviour
    {
        TextMesh tm;
        MeshRenderer mr;
        float targetHeight;
        int fitFrames;

        public static WorldLabel Create(Transform parent, Vector3 localPos, string text, float height, Color color, int order)
        {
            var go = new GameObject("Rótulo");
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            var l = go.AddComponent<WorldLabel>();
            l.tm = go.AddComponent<TextMesh>();
            l.mr = go.GetComponent<MeshRenderer>();
            var font = JpFont.Get();
            l.tm.font = font;
            if (font != null) l.mr.sharedMaterial = font.material;
            l.tm.fontSize = 64;
            l.tm.anchor = TextAnchor.MiddleCenter;
            l.tm.alignment = TextAlignment.Center;
            l.tm.characterSize = height / 6.4f; // estimativa; ajustada pela medida real abaixo
            l.mr.sortingOrder = order;
            l.targetHeight = height;
            l.Set(text, color);
            return l;
        }

        public void Set(string text, Color color)
        {
            tm.text = text;
            tm.color = color;
            fitFrames = 3;
        }

        public void SetVisible(bool v) { mr.enabled = v; }

        void LateUpdate()
        {
            // mede a altura real do texto e corrige a escala (o tamanho da fonte varia por sistema)
            if (fitFrames <= 0) return;
            fitFrames--;
            float h = mr.bounds.size.y / Mathf.Max(0.0001f, transform.lossyScale.y);
            if (h > 0.0001f) tm.characterSize *= targetHeight / h;
        }
    }

    /// <summary>Brilho que pulsa (tochas, lareiras, janelas, caldeirões).</summary>
    public class Flicker : MonoBehaviour
    {
        public float Amount = 0.12f;
        public float Speed = 9f;
        Vector3 baseScale;
        float seed;

        void Start() { baseScale = transform.localScale; seed = Random.value * 10f; }

        void Update()
        {
            float k = 1f + (Mathf.PerlinNoise(seed, Time.time * Speed * 0.3f) - 0.5f) * 2f * Amount;
            transform.localScale = baseScale * k;
        }
    }

    /// <summary>Faíscas que saem quando algo mágico acontece.</summary>
    public class Sparks : MonoBehaviour
    {
        Vector2[] vel;
        Transform[] bits;
        float life = 0.9f, age;

        public static void Burst(Vector2 at, Color color, int count)
        {
            var go = new GameObject("Faíscas");
            go.transform.position = at;
            var s = go.AddComponent<Sparks>();
            s.vel = new Vector2[count];
            s.bits = new Transform[count];
            for (int i = 0; i < count; i++)
            {
                var b = new GameObject("f");
                b.transform.SetParent(go.transform, false);
                var sr = Compat.AddSprite(b, Art.Spark(), 30);
                sr.color = Color.Lerp(color, Color.white, Random.value * 0.5f);
                float a = Random.value * Mathf.PI * 2f, sp = 2f + Random.value * 4f;
                s.vel[i] = new Vector2(Mathf.Cos(a), Mathf.Sin(a)) * sp + Vector2.up * 2f;
                s.bits[i] = b.transform;
            }
        }

        void Update()
        {
            float dt = Time.unscaledDeltaTime;
            age += dt;
            for (int i = 0; i < bits.Length; i++)
            {
                vel[i] += Vector2.down * 9f * dt;
                bits[i].localPosition += (Vector3)(vel[i] * dt);
                bits[i].localScale = Vector3.one * Mathf.Clamp01(1f - age / life);
            }
            if (age >= life) Destroy(gameObject);
        }
    }

    /// <summary>Segue o Pongo com suavização e não sai dos limites da fase.</summary>
    public class CameraFollow : MonoBehaviour
    {
        public Transform Target;
        public Rect Bounds;
        Camera cam;
        Vector3 vel;

        void Awake() { cam = GetComponent<Camera>(); }

        public void Snap()
        {
            if (Target == null) return;
            transform.position = Clamp(Desired());
        }

        Vector3 Desired()
        {
            var p = Target.position;
            var pongo = Target.GetComponent<PongoController>();
            float look = pongo != null ? pongo.Facing * 1.6f : 0f;
            return new Vector3(p.x + look, p.y + 1.2f, -10f);
        }

        Vector3 Clamp(Vector3 p)
        {
            float halfH = cam.orthographicSize, halfW = halfH * cam.aspect;
            if (Bounds.width <= halfW * 2f) p.x = Bounds.center.x;
            else p.x = Mathf.Clamp(p.x, Bounds.xMin + halfW, Bounds.xMax - halfW);
            if (Bounds.height <= halfH * 2f) p.y = Bounds.yMin + halfH - 0.5f;
            else p.y = Mathf.Clamp(p.y, Bounds.yMin + halfH, Bounds.yMax - halfH);
            p.z = -10f;
            return p;
        }

        void LateUpdate()
        {
            if (Target == null) return;
            var d = Clamp(Desired());
            transform.position = Vector3.SmoothDamp(transform.position, d, ref vel, 0.18f, Mathf.Infinity, Time.unscaledDeltaTime);
        }
    }
}
