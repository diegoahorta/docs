using UnityEngine;

namespace PongoParticulas
{
    /// <summary>Efeitos sonoros sintetizados na hora (nenhum arquivo de áudio é necessário).</summary>
    public static class Sfx
    {
        public static AudioClip Jump, Pickup, Correct, Wrong, Hurt, Stomp, Door, Checkpoint;
        static AudioSource source;
        const int Rate = 44100;

        public static void Init(GameObject host)
        {
            source = host.AddComponent<AudioSource>();
            source.playOnAwake = false;
            source.volume = 0.5f;
            Jump = Sweep("pulo", 420, 760, 0.09f, Wave.Square, 0.18f);
            Pickup = Notes("partícula", new[] { 1046.5f, 1318.5f, 1568f, 2093f }, 0.07f, Wave.Triangle, 0.35f);
            Correct = Notes("certo", new[] { 523.25f, 659.25f, 783.99f, 1046.5f, 1318.5f }, 0.09f, Wave.Triangle, 0.4f);
            Wrong = Notes("errado", new[] { 220f, 174.6f }, 0.16f, Wave.Saw, 0.25f);
            Hurt = Sweep("dano", 520, 140, 0.22f, Wave.Square, 0.25f);
            Stomp = Sweep("pisão", 300, 90, 0.12f, Wave.Triangle, 0.4f);
            Door = Notes("porta", new[] { 392f, 523.25f, 659.25f, 783.99f, 1046.5f, 1568f }, 0.08f, Wave.Triangle, 0.35f);
            Checkpoint = Notes("vela", new[] { 784f, 1175f }, 0.09f, Wave.Triangle, 0.3f);
        }

        public static void Play(AudioClip clip)
        {
            if (source != null && clip != null) source.PlayOneShot(clip);
        }

        enum Wave { Square, Triangle, Saw }

        static float Osc(Wave w, float phase)
        {
            float p = phase - Mathf.Floor(phase);
            switch (w)
            {
                case Wave.Square: return p < 0.5f ? 1f : -1f;
                case Wave.Saw: return 2f * p - 1f;
                default: return 1f - 4f * Mathf.Abs(p - 0.5f);
            }
        }

        static AudioClip Sweep(string name, float f0, float f1, float dur, Wave w, float vol)
        {
            int n = Mathf.CeilToInt(dur * Rate);
            var data = new float[n];
            float phase = 0f;
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)n;
                phase += Mathf.Lerp(f0, f1, t) / Rate;
                data[i] = Osc(w, phase) * vol * (1f - t) * Mathf.Clamp01(i / 200f);
            }
            var clip = AudioClip.Create(name, n, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        static AudioClip Notes(string name, float[] freqs, float each, Wave w, float vol)
        {
            int per = Mathf.CeilToInt(each * Rate), n = per * freqs.Length + Rate / 8;
            var data = new float[n];
            for (int k = 0; k < freqs.Length; k++)
            {
                float phase = 0f;
                int start = k * per, len = per + Rate / 8;
                for (int i = 0; i < len && start + i < n; i++)
                {
                    phase += freqs[k] / Rate;
                    float env = Mathf.Clamp01(i / 150f) * Mathf.Exp(-i / (float)(per * 0.9f));
                    data[start + i] += Osc(w, phase) * vol * env;
                }
            }
            var clip = AudioClip.Create(name, n, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
