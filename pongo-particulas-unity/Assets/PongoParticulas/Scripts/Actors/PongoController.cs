using UnityEngine;

namespace PongoParticulas
{
    /// <summary>
    /// O Pongo: corrida com aceleração, pulo com "coyote time", pulo guardado (buffer),
    /// altura variável (soltar o botão corta o pulo) e plataformas atravessáveis por baixo.
    /// A animação é feita por escala e inclinação sobre a ilustração única do Pongo.
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    public class PongoController : MonoBehaviour
    {
        public const float Speed = 7f;
        public const float GroundAccel = 80f;
        public const float AirAccel = 50f;
        public const float JumpVelocity = 16.5f;   // ≈ 3,4 blocos de altura com gravityScale 4
        public const float CoyoteTime = 0.1f;
        public const float JumpBuffer = 0.12f;
        public const float MaxFall = 20f;
        public const float SpriteHeight = 1.5f;

        Rigidbody2D rb;
        CapsuleCollider2D body;
        Transform visual;
        SpriteRenderer sr;
        readonly RaycastHit2D[] hits = new RaycastHit2D[8];
        ContactFilter2D solidFilter;

        float horizontal, coyote, buffer, invulnerable, stun, squash, lastHeight;
        bool jumpHeld, grounded, cutDone;
        int facing = 1;
        MovingPlatform ride;
        Vector2 respawn;

        public bool Grounded { get { return grounded; } }
        public bool Falling { get { return rb.Vel().y < -0.5f; } }
        public Vector2 Velocity { get { return rb.Vel(); } }
        public int Facing { get { return facing; } }

        public static PongoController Create(Vector2 position, Transform parent)
        {
            var go = new GameObject("Pongo");
            go.transform.SetParent(parent, false);
            go.transform.position = position;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 4f;
            rb.freezeRotation = true;
            rb.interpolation = RigidbodyInterpolation2D.Interpolate;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            var col = go.AddComponent<CapsuleCollider2D>();
            col.size = new Vector2(0.8f, 1.15f);
            col.offset = new Vector2(0f, 0.6f);
            col.sharedMaterial = new PhysicsMaterial2D("Pongo sem atrito") { friction = 0f, bounciness = 0f };

            var vis = new GameObject("Visual");
            vis.transform.SetParent(go.transform, false);
            var p = go.AddComponent<PongoController>();
            p.visual = vis.transform;
            p.sr = Compat.AddSprite(vis, Art.Pongo(SpriteHeight), 20);
            p.respawn = position;
            return p;
        }

        void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            body = GetComponent<CapsuleCollider2D>();
            solidFilter = new ContactFilter2D();
            solidFilter.useTriggers = false;
        }

        bool Controllable
        {
            get { return GameManager.I != null && GameManager.I.IsPlaying && stun <= 0f; }
        }

        void Update()
        {
            if (Controllable)
            {
                horizontal = GameInput.Horizontal;
                if (GameInput.JumpDown) buffer = JumpBuffer;
                jumpHeld = GameInput.JumpHeld;
                if (horizontal != 0f) facing = horizontal > 0 ? 1 : -1;
            }
            else
            {
                horizontal = 0f;
                jumpHeld = false;
            }
            if (invulnerable > 0f) invulnerable -= Time.deltaTime;
            if (stun > 0f) stun -= Time.deltaTime;

            if (transform.position.y < -3f && GameManager.I != null) GameManager.I.PlayerFell();
        }

        void FixedUpdate()
        {
            float dt = Time.fixedDeltaTime;
            Vector2 v = rb.Vel();
            bool wasGrounded = grounded;
            CheckGround(v);

            if (grounded) { coyote = CoyoteTime; cutDone = false; }
            else coyote -= dt;
            buffer -= dt;

            if (grounded && !wasGrounded && lastHeight - transform.position.y > 0.3f)
            {
                squash = 0.18f;
            }
            if (grounded) lastHeight = transform.position.y;
            else lastHeight = Mathf.Max(lastHeight, transform.position.y);

            float platformVx = ride != null ? ride.Velocity.x : 0f;
            if (stun <= 0f)
            {
                float target = horizontal * Speed + platformVx;
                float accel = grounded ? GroundAccel : AirAccel;
                v.x = Mathf.MoveTowards(v.x, target, accel * dt);
            }

            if (buffer > 0f && coyote > 0f && Controllable)
            {
                v.y = JumpVelocity;
                buffer = 0f; coyote = 0f; grounded = false; cutDone = false;
                squash = -0.16f;
                Sfx.Play(Sfx.Jump);
            }
            if (!jumpHeld && v.y > 0f && !cutDone && !grounded)
            {
                v.y *= 0.5f;
                cutDone = true;
            }
            if (v.y < -MaxFall) v.y = -MaxFall;
            rb.SetVel(v);
        }

        void CheckGround(Vector2 v)
        {
            grounded = false;
            ride = null;
            if (v.y > 0.1f) return; // subindo: atravessa plataformas sem "grudar" nelas
            int n = body.Cast(Vector2.down, solidFilter, hits, 0.06f);
            for (int i = 0; i < n; i++)
            {
                var h = hits[i];
                if (h.collider == null || h.collider == body || h.normal.y < 0.55f) continue;
                grounded = true;
                var mp = h.collider.GetComponent<MovingPlatform>();
                if (mp != null) ride = mp;
            }
        }

        void LateUpdate()
        {
            if (visual == null) return;
            float t = Time.time;
            Vector2 v = rb.Vel();
            squash = Mathf.MoveTowards(squash, 0f, Time.deltaTime * 0.9f);

            float bob = 0f, tilt = 0f;
            if (grounded && Mathf.Abs(v.x) > 0.5f)
            {
                bob = Mathf.Abs(Mathf.Sin(t * 16f)) * 0.07f;
                tilt = Mathf.Sin(t * 16f) * 4f;
            }
            else if (!grounded)
            {
                tilt = Mathf.Clamp(v.y * 1.1f, -12f, 12f) * facing;
            }
            else
            {
                squash += Mathf.Sin(t * 3f) * 0.004f; // respiração parada
            }

            sr.flipX = facing < 0; // a ilustração original olha para a direita
            visual.localPosition = new Vector3(0f, bob, 0f);
            visual.localRotation = Quaternion.Euler(0f, 0f, tilt);
            visual.localScale = new Vector3(1f + squash, 1f - squash, 1f);
            sr.enabled = invulnerable <= 0f || Mathf.FloorToInt(Time.unscaledTime * 14f) % 2 == 0;
        }

        // ---------------------------------------------------------------
        public void SetRespawn(Vector2 p) { respawn = p; }

        public void Respawn()
        {
            transform.position = respawn;
            rb.SetVel(Vector2.zero);
            invulnerable = 1f;
            lastHeight = respawn.y;
        }

        /// <summary>Dano com empurrão para longe da origem. Retorna false durante a invencibilidade.</summary>
        public bool Hurt(Vector2 from)
        {
            if (invulnerable > 0f) return false;
            invulnerable = 1.3f;
            stun = 0.3f;
            float dir = transform.position.x >= from.x ? 1f : -1f;
            rb.SetVel(new Vector2(dir * 7f, 9f));
            Sfx.Play(Sfx.Hurt);
            return true;
        }

        public void Bounce()
        {
            var v = rb.Vel();
            v.y = JumpVelocity * 0.7f;
            rb.SetVel(v);
            squash = -0.12f;
        }

        public void Freeze()
        {
            rb.SetVel(Vector2.zero);
        }
    }
}
