using UnityEngine;

namespace PongoParticulas
{
    /// <summary>
    /// Inicia o jogo sozinho ao apertar Play, em qualquer cena (inclusive a SampleScene vazia
    /// de um projeto 2D novo). Não é preciso montar cena nem prefab: tudo é criado por código.
    /// Para desligar o início automático, mude AutoStart para false e coloque um GameManager na cena.
    /// </summary>
    public static class GameBoot
    {
        public const bool AutoStart = true;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Boot()
        {
            if (!AutoStart || GameManager.I != null) return;
            new GameObject("Pongo — Partículas Mágicas").AddComponent<GameManager>();
        }
    }
}
