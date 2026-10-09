using System.Collections.Generic;
using UnityEngine;

namespace PongoParticulas
{
    /// <summary>
    /// Teclado lido pelos eventos do IMGUI (OnGUI). Funciona com o Input Manager antigo,
    /// com o novo Input System ou com os dois ligados, sem nenhuma configuração no projeto.
    /// GameUI chama Feed() em OnGUI e GameManager chama EndFrame() em LateUpdate.
    /// </summary>
    public static class GameInput
    {
        static readonly HashSet<KeyCode> held = new HashSet<KeyCode>();
        static readonly HashSet<KeyCode> pressed = new HashSet<KeyCode>();

        public static void Feed(Event e)
        {
            if (e == null || e.keyCode == KeyCode.None) return;
            if (e.type == EventType.KeyDown)
            {
                if (held.Add(e.keyCode)) pressed.Add(e.keyCode); // repetição do teclado não conta como novo toque
            }
            else if (e.type == EventType.KeyUp)
            {
                held.Remove(e.keyCode);
            }
        }

        public static void EndFrame() { pressed.Clear(); }
        public static void Clear() { held.Clear(); pressed.Clear(); }

        public static bool Held(params KeyCode[] keys)
        {
            foreach (var k in keys) if (held.Contains(k)) return true;
            return false;
        }

        public static bool Down(params KeyCode[] keys)
        {
            foreach (var k in keys) if (pressed.Contains(k)) return true;
            return false;
        }

        public static float Horizontal
        {
            get
            {
                float h = 0f;
                if (Held(KeyCode.RightArrow, KeyCode.D)) h += 1f;
                if (Held(KeyCode.LeftArrow, KeyCode.A)) h -= 1f;
                return h;
            }
        }

        public static bool JumpDown { get { return Down(KeyCode.Space, KeyCode.UpArrow, KeyCode.W, KeyCode.Z); } }
        public static bool JumpHeld { get { return Held(KeyCode.Space, KeyCode.UpArrow, KeyCode.W, KeyCode.Z); } }
        public static bool Interact { get { return Down(KeyCode.E, KeyCode.DownArrow, KeyCode.S, KeyCode.X); } }
        public static bool Confirm { get { return Down(KeyCode.Return, KeyCode.KeypadEnter, KeyCode.Space); } }
        public static bool Cancel { get { return Down(KeyCode.Escape, KeyCode.Backspace); } }
        public static bool Grimoire { get { return Down(KeyCode.Tab, KeyCode.G); } }

        /// <summary>1–9 no teclado principal ou numérico. Retorna -1 se nenhum.</summary>
        public static int NumberDown()
        {
            for (int i = 0; i < 9; i++)
            {
                if (pressed.Contains(KeyCode.Alpha1 + i) || pressed.Contains(KeyCode.Keypad1 + i)) return i;
            }
            return -1;
        }
    }
}
