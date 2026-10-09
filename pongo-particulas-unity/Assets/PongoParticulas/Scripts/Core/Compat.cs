using UnityEngine;
using UnityEngine.Rendering;

namespace PongoParticulas
{
    /// <summary>Diferenças entre versões da Unity (2021.3 LTS até Unity 6).</summary>
    public static class Compat
    {
        public static Vector2 Vel(this Rigidbody2D rb)
        {
#if UNITY_6000_0_OR_NEWER
            return rb.linearVelocity;
#else
            return rb.velocity;
#endif
        }

        public static void SetVel(this Rigidbody2D rb, Vector2 v)
        {
#if UNITY_6000_0_OR_NEWER
            rb.linearVelocity = v;
#else
            rb.velocity = v;
#endif
        }

        public static void MakeKinematic(this Rigidbody2D rb)
        {
#if UNITY_6000_0_OR_NEWER
            rb.bodyType = RigidbodyType2D.Kinematic;
#else
            rb.isKinematic = true;
#endif
        }

        static Material spriteMaterial;

        /// <summary>
        /// Material sem iluminação para os sprites. No URP 2D o padrão é "Sprite-Lit",
        /// que fica escuro sem luzes 2D na cena; aqui usamos sempre a versão "Unlit".
        /// </summary>
        public static Material SpriteMaterial
        {
            get
            {
                if (spriteMaterial != null) return spriteMaterial;
                Shader shader = null;
                if (GraphicsSettings.currentRenderPipeline != null)
                    shader = Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default");
                if (shader == null) shader = Shader.Find("Sprites/Default");
                spriteMaterial = shader != null ? new Material(shader) : null;
                return spriteMaterial;
            }
        }

        public static SpriteRenderer AddSprite(GameObject go, Sprite sprite, int order)
        {
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.sortingOrder = order;
            var mat = SpriteMaterial;
            if (mat != null) sr.sharedMaterial = mat;
            return sr;
        }
    }
}
