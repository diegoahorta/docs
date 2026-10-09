using UnityEngine;

namespace PongoParticulas
{
    /// <summary>Gota de poção que patrulha: vira nas paredes e nas beiradas. Pule em cima para derrotá-la.</summary>
    [RequireComponent(typeof(Rigidbody2D))]
    public class Enemy : MonoBehaviour
    {
        public float Speed = 1.6f;
        Rigidbody2D rb;
        SpriteRenderer sr;
        Sprite[] frames;
        int dir = -1;
        bool dead;

        public static Enemy Create(Transform parent, Vector2 pos, Theme th)
        {
            var go = new GameObject("Gota de poção");
            go.transform.SetParent(parent, false);
            go.transform.position = pos;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.MakeKinematic();
            rb.interpolation = RigidbodyInterpolation2D.Interpolate;
            var col = go.AddComponent<BoxCollider2D>();
            col.isTrigger = true;
            col.size = new Vector2(0.8f, 0.6f);
            col.offset = new Vector2(0f, 0.3f);
            var e = go.AddComponent<Enemy>();
            e.frames = new[] { Art.Slime(th.Slime, 0), Art.Slime(th.Slime, 1) };
            e.sr = Compat.AddSprite(go, e.frames[0], 8);
            return e;
        }

        void Awake() { rb = GetComponent<Rigidbody2D>(); }

        void FixedUpdate()
        {
            if (dead) return;
            Vector2 p = rb.position;
            // parede à frente?
            var wall = Physics2D.Raycast(p + new Vector2(0f, 0.3f), new Vector2(dir, 0f), 0.5f);
            bool blocked = wall.collider != null && Is.Pongo(wall.collider) == null;
            // chão à frente?
            var floor = Physics2D.Raycast(p + new Vector2(dir * 0.45f, 0.1f), Vector2.down, 0.4f);
            if (blocked || floor.collider == null) dir = -dir;
            rb.MovePosition(p + new Vector2(dir * Speed * Time.fixedDeltaTime, 0f));
        }

        void Update()
        {
            if (dead) return;
            sr.sprite = frames[Mathf.FloorToInt(Time.time * 4f) % 2];
            sr.flipX = dir < 0;
        }

        void OnTriggerEnter2D(Collider2D other) { Touch(other); }
        void OnTriggerStay2D(Collider2D other) { Touch(other); }

        void Touch(Collider2D other)
        {
            var p = Is.Pongo(other);
            if (dead || p == null || GameManager.I == null || !GameManager.I.IsPlaying) return;
            bool stomp = p.Velocity.y < -0.5f && p.transform.position.y > transform.position.y + 0.3f;
            if (stomp)
            {
                dead = true;
                p.Bounce();
                Sfx.Play(Sfx.Stomp);
                Sparks.Burst(transform.position + Vector3.up * 0.3f, sr.color * new Color(1, 1, 1, 1), 14);
                Sparks.Burst(transform.position + Vector3.up * 0.3f, Color.white, 6);
                Destroy(gameObject);
            }
            else GameManager.I.PlayerHurt(transform.position);
        }
    }

    /// <summary>Livro voador: plataforma que vai e volta na horizontal.</summary>
    [RequireComponent(typeof(Rigidbody2D))]
    public class MovingPlatform : MonoBehaviour
    {
        public float Amplitude = 2.5f;
        public float Period = 4.5f;
        public Vector2 Velocity { get; private set; }
        Rigidbody2D rb;
        Vector2 origin;
        float phase;

        public static MovingPlatform Create(Transform parent, Vector2 center, Theme th, int index)
        {
            var go = new GameObject("Livro voador");
            go.transform.SetParent(parent, false);
            go.transform.position = center;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.MakeKinematic();
            rb.interpolation = RigidbodyInterpolation2D.Interpolate;
            Color32[] covers = { PixelCanvas.Hex("#8e2a22"), PixelCanvas.Hex("#26407e"), PixelCanvas.Hex("#1f5b3a") };
            Compat.AddSprite(go, Art.Book(covers[index % covers.Length]), 6);
            var col = go.AddComponent<BoxCollider2D>();
            col.size = new Vector2(2f, 0.3f);
            col.offset = new Vector2(0f, -0.15f);
            col.usedByEffector = true;
            var eff = go.AddComponent<PlatformEffector2D>();
            eff.useOneWay = true;
            eff.surfaceArc = 160f;
            var mp = go.AddComponent<MovingPlatform>();
            mp.phase = index * 1.3f;
            return mp;
        }

        void Awake() { rb = GetComponent<Rigidbody2D>(); origin = rb.position; }

        void FixedUpdate()
        {
            float t = Time.time * Mathf.PI * 2f / Period + phase;
            var target = origin + new Vector2(Mathf.Sin(t) * Amplitude, Mathf.Sin(t * 2f) * 0.08f);
            Velocity = (target - rb.position) / Time.fixedDeltaTime;
            rb.MovePosition(target);
        }
    }
}
